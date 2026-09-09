import { supabase } from "@/integrations/supabase/client";

export const GENERAL_CHANNEL_ID = "00000000-0000-4000-8000-000000000001";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  status_text: string | null;
};

export type Channel = {
  id: string;
  name: string | null;
  topic: string | null;
  description: string | null;
  is_private: boolean;
  is_dm: boolean;
  dm_key: string | null;
  created_by: string | null;
  created_at: string;
};

export type Membership = {
  channel_id: string;
  profile_id: string;
  last_read_at: string;
  role: string;
};

export type Message = {
  id: string;
  channel_id: string;
  author_id: string;
  body: string;
  parent_message_id: string | null;
  reply_count: number;
  last_reply_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  author: Profile | null;
};

export type Reaction = {
  id: string;
  message_id: string;
  profile_id: string;
  emoji: string;
};

const MESSAGE_SELECT =
  "id, channel_id, author_id, body, parent_message_id, reply_count, last_reply_at, edited_at, deleted_at, created_at, author:profiles!messages_author_id_fkey(id, display_name, avatar_url, status_text)";

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getMyProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const res = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, status_text")
    .eq("id", userId)
    .maybeSingle();
  return unwrap(res) as Profile | null;
}

export async function updateMyProfile(patch: {
  display_name?: string;
  status_text?: string | null;
  avatar_url?: string | null;
}) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");
  const res = await supabase.from("profiles").update(patch).eq("id", userId).select().single();
  return unwrap(res);
}

export async function listPeople(): Promise<Profile[]> {
  const res = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, status_text")
    .order("display_name");
  return (unwrap(res) ?? []) as Profile[];
}

export type MyChannel = Channel & {
  last_read_at: string;
  members: Profile[];
  unread: number;
};

export async function listMyChannels(): Promise<MyChannel[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const memberships = (unwrap(
    await supabase
      .from("channel_members")
      .select("channel_id, last_read_at, channel:channels(*)")
      .eq("profile_id", userId),
  ) ?? []) as Array<{ channel_id: string; last_read_at: string; channel: Channel | null }>;

  const channelIds = memberships.map((m) => m.channel_id);
  if (channelIds.length === 0) return [];

  const allMembers = (unwrap(
    await supabase
      .from("channel_members")
      .select("channel_id, profile:profiles(id, display_name, avatar_url, status_text)")
      .in("channel_id", channelIds),
  ) ?? []) as Array<{ channel_id: string; profile: Profile | null }>;

  const recent = (unwrap(
    await supabase
      .from("messages")
      .select("channel_id, created_at, author_id")
      .in("channel_id", channelIds)
      .order("created_at", { ascending: false })
      .limit(500),
  ) ?? []) as Array<{ channel_id: string; created_at: string; author_id: string }>;

  return memberships
    .filter((m) => m.channel)
    .map((m) => {
      const channel = m.channel as Channel;
      const members = allMembers
        .filter((am) => am.channel_id === m.channel_id && am.profile)
        .map((am) => am.profile as Profile);
      const unread = recent.filter(
        (r) =>
          r.channel_id === m.channel_id &&
          r.author_id !== userId &&
          new Date(r.created_at) > new Date(m.last_read_at),
      ).length;
      return { ...channel, last_read_at: m.last_read_at, members, unread };
    })
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
}

export async function listPublicChannels(): Promise<Channel[]> {
  const res = await supabase
    .from("channels")
    .select("*")
    .eq("is_dm", false)
    .eq("is_private", false)
    .eq("is_archived", false)
    .order("name");
  return (unwrap(res) ?? []) as Channel[];
}

export async function getChannel(channelId: string): Promise<Channel | null> {
  const res = await supabase.from("channels").select("*").eq("id", channelId).maybeSingle();
  return unwrap(res) as Channel | null;
}

export async function listChannelMembers(channelId: string): Promise<Profile[]> {
  const rows = (unwrap(
    await supabase
      .from("channel_members")
      .select("profile:profiles(id, display_name, avatar_url, status_text)")
      .eq("channel_id", channelId),
  ) ?? []) as Array<{ profile: Profile | null }>;
  return rows.filter((r) => r.profile).map((r) => r.profile as Profile);
}

export async function listMessages(channelId: string, limit = 80): Promise<Message[]> {
  const rows = (unwrap(
    await supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("channel_id", channelId)
      .is("parent_message_id", null)
      .order("created_at", { ascending: false })
      .limit(limit),
  ) ?? []) as unknown as Message[];
  return rows.slice().reverse();
}

export async function listThreadReplies(parentId: string): Promise<Message[]> {
  const rows = (unwrap(
    await supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("parent_message_id", parentId)
      .order("created_at", { ascending: true }),
  ) ?? []) as unknown as Message[];
  return rows;
}

export async function getMessage(messageId: string): Promise<Message | null> {
  const res = await supabase.from("messages").select(MESSAGE_SELECT).eq("id", messageId).maybeSingle();
  return unwrap(res) as unknown as Message | null;
}

export async function sendMessage(input: {
  channelId: string;
  body: string;
  parentMessageId?: string | null;
}) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");
  const res = await supabase
    .from("messages")
    .insert({
      channel_id: input.channelId,
      author_id: userId,
      body: input.body,
      parent_message_id: input.parentMessageId ?? null,
    })
    .select(MESSAGE_SELECT)
    .single();
  return unwrap(res) as unknown as Message;
}

export async function editMessage(messageId: string, body: string) {
  const res = await supabase
    .from("messages")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .select(MESSAGE_SELECT)
    .single();
  return unwrap(res);
}

export async function deleteMessage(messageId: string) {
  const res = await supabase
    .from("messages")
    .update({ body: "", deleted_at: new Date().toISOString() })
    .eq("id", messageId)
    .select("id")
    .single();
  return unwrap(res);
}

export async function listReactions(messageIds: string[]): Promise<Reaction[]> {
  if (messageIds.length === 0) return [];
  const res = await supabase
    .from("reactions")
    .select("id, message_id, profile_id, emoji")
    .in("message_id", messageIds);
  return (unwrap(res) ?? []) as Reaction[];
}

export async function toggleReaction(messageId: string, emoji: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");
  const existing = (unwrap(
    await supabase
      .from("reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("profile_id", userId)
      .eq("emoji", emoji)
      .maybeSingle(),
  ) ?? null) as { id: string } | null;

  if (existing) {
    const res = await supabase.from("reactions").delete().eq("id", existing.id).select("id");
    unwrap(res);
    return;
  }
  const res = await supabase
    .from("reactions")
    .insert({ message_id: messageId, profile_id: userId, emoji })
    .select("id");
  unwrap(res);
}

export async function createChannel(input: {
  name: string;
  topic?: string;
  isPrivate?: boolean;
}): Promise<Channel> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");
  const name = input.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
  if (!name) throw new Error("Channel name required");

  const channel = unwrap(
    await supabase
      .from("channels")
      .insert({
        name,
        topic: input.topic ?? null,
        is_private: input.isPrivate ?? false,
        created_by: userId,
      })
      .select("*")
      .single(),
  ) as Channel;

  unwrap(
    await supabase
      .from("channel_members")
      .insert({ channel_id: channel.id, profile_id: userId, role: "owner" })
      .select("id")
      .single(),
  );

  return channel;
}

export async function joinChannel(channelId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");
  const res = await supabase
    .from("channel_members")
    .upsert({ channel_id: channelId, profile_id: userId }, { onConflict: "channel_id,profile_id" })
    .select("id")
    .single();
  return unwrap(res);
}

export async function leaveChannel(channelId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");
  const res = await supabase
    .from("channel_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("profile_id", userId)
    .select("id");
  return unwrap(res);
}

export async function addMembers(channelId: string, profileIds: string[]) {
  if (profileIds.length === 0) return;
  const res = await supabase
    .from("channel_members")
    .upsert(
      profileIds.map((profile_id) => ({ channel_id: channelId, profile_id })),
      { onConflict: "channel_id,profile_id" },
    )
    .select("id");
  unwrap(res);
}

export async function openDirectMessage(otherProfileIds: string[]): Promise<Channel> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");
  const ids = Array.from(new Set([userId, ...otherProfileIds])).sort();
  const dmKey = ids.join("|");

  const existing = (unwrap(
    await supabase.from("channels").select("*").eq("dm_key", dmKey).maybeSingle(),
  ) ?? null) as Channel | null;
  if (existing) {
    await joinChannel(existing.id);
    return existing;
  }

  const channel = unwrap(
    await supabase
      .from("channels")
      .insert({ is_dm: true, dm_key: dmKey, created_by: userId })
      .select("*")
      .single(),
  ) as Channel;

  await addMembers(channel.id, ids);
  return channel;
}

export async function markChannelRead(channelId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return;
  await supabase
    .from("channel_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("profile_id", userId);
}

export function channelLabel(channel: { name: string | null; is_dm: boolean }, members: Profile[], meId?: string) {
  if (!channel.is_dm) return channel.name ?? "channel";
  const others = members.filter((m) => m.id !== meId);
  if (others.length === 0) return "You";
  return others.map((o) => o.display_name).join(", ");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}
