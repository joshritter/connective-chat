import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Hash, Lock, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Composer } from "./Composer";
import { MessageRow } from "./MessageRow";
import { ThreadPane } from "./ThreadPane";
import { TypingIndicator } from "./TypingIndicator";
import { UserAvatar } from "./UserAvatar";
import { useTyping } from "@/hooks/useTyping";

import {
  channelLabel,
  deleteMessage,
  editMessage,
  getChannel,
  joinChannel,
  listChannelMembers,
  listMessages,
  listReactions,
  markChannelRead,
  sendMessage,
  toggleReaction,
} from "@/lib/chat";

export function ChatView({
  channelId,
  meId,
  threadId,
  onOpenThread,
}: {
  channelId: string;
  meId: string | null;
  threadId?: string | undefined;
  onOpenThread: (id: string | null) => void;
}) {
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typing = useTyping(channelId, meId);


  const channel = useQuery({ queryKey: ["channel", channelId], queryFn: () => getChannel(channelId) });
  const members = useQuery({ queryKey: ["members", channelId], queryFn: () => listChannelMembers(channelId) });
  const messages = useQuery({ queryKey: ["messages", channelId], queryFn: () => listMessages(channelId) });

  const messageIds = useMemo(() => (messages.data ?? []).map((m) => m.id), [messages.data]);
  const reactions = useQuery({
    queryKey: ["reactions", channelId, messageIds.length],
    queryFn: () => listReactions(messageIds),
    enabled: messageIds.length > 0,
  });

  const isMember = useMemo(
    () => Boolean(meId) && (members.data ?? []).some((m) => m.id === meId),
    [members.data, meId],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length, channelId]);

  useEffect(() => {
    if (!isMember) return;
    void markChannelRead(channelId).then(() => qc.invalidateQueries({ queryKey: ["myChannels"] }));
  }, [channelId, isMember, messages.data?.length, qc]);

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["messages", channelId] });
    void qc.invalidateQueries({ queryKey: ["reactions", channelId] });
    void qc.invalidateQueries({ queryKey: ["myChannels"] });
  }

  const title = channel.data
    ? channelLabel(channel.data, members.data ?? [], meId ?? undefined)
    : "Loading…";

  return (
    <div className="flex min-h-0 flex-1">
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-5 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {channel.data?.is_dm ? (
                <UserAvatar
                  profile={(members.data ?? []).find((m) => m.id !== meId) ?? null}
                  className="size-6"
                  showPresence
                />
              ) : channel.data?.is_private ? (
                <Lock className="size-4 text-muted-foreground" />
              ) : (
                <Hash className="size-4 text-muted-foreground" />
              )}
              <h1 className="truncate text-lg font-semibold">{title}</h1>
            </div>
            {channel.data?.topic ? (
              <p className="truncate text-xs text-muted-foreground">{channel.data.topic}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-4" />
            {members.data?.length ?? 0}
          </div>
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto max-w-3xl space-y-0.5 p-3">
            {messages.data?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <h2 className="text-base font-semibold">This is the beginning of {title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Say something to get things started.</p>
              </div>
            ) : null}

            {(messages.data ?? []).map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                reactions={(reactions.data ?? []).filter((r) => r.message_id === message.id)}
                meId={meId}
                onOpenThread={(m) => onOpenThread(m.id)}
                onToggleReaction={async (id, emoji) => {
                  await toggleReaction(id, emoji);
                  refresh();
                }}
                onEdit={async (id, body) => {
                  await editMessage(id, body);
                  refresh();
                }}
                onDelete={async (id) => {
                  await deleteMessage(id);
                  refresh();
                }}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="mx-auto w-full max-w-3xl p-3">
          {isMember ? (
            <>
              <Composer
                placeholder={`Message ${channel.data?.is_dm ? title : `#${title}`}`}
                onTyping={typing.notifyTyping}
                onStopTyping={typing.stopTyping}
                onSend={async (body) => {
                  await sendMessage({ channelId, body });
                  refresh();
                }}
              />
              <TypingIndicator names={typing.typers} />
            </>
          ) : (

            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <p className="text-sm text-muted-foreground">You are viewing an open channel.</p>
              <Button
                onClick={async () => {
                  await joinChannel(channelId);
                  void qc.invalidateQueries({ queryKey: ["members", channelId] });
                  void qc.invalidateQueries({ queryKey: ["myChannels"] });
                  refresh();
                }}
              >
                Join channel
              </Button>
            </div>
          )}
        </div>
      </section>

      {threadId ? (
        <ThreadPane
          channelId={channelId}
          parentId={threadId}
          meId={meId}
          onClose={() => onOpenThread(null)}
        />
      ) : null}
    </div>
  );
}
