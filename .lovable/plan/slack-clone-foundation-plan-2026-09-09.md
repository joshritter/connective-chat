# Slack clone — foundation plan

A real-time team chat app: workspaces of people, public/private channels, direct messages, and threaded replies inside channels.

## What people will be able to do

- Sign up and sign in with email + password, pick a display name and avatar.
- See a sidebar of channels they belong to, plus their direct message conversations.
- Create channels (public or private), join/leave, invite others.
- Post messages, edit and delete their own, react with emoji.
- Reply in a thread on any message; the parent message shows a reply count and last reply time.
- Start a DM with any member (1:1 or small group).
- See new messages arrive live, unread badges, and who's typing.

## Backend (Lovable Cloud)

Accounts, database, file storage for avatars and attachments, and live updates all come from Lovable Cloud.

### Data models

- **profiles** — id (matches the account), display_name, avatar_url, status_text, presence, created_at.
- **channels** — id, name, slug, topic, description, is_private, is_dm, created_by, created_at.
- **channel_members** — channel_id, profile_id, role (owner/member), last_read_at, joined_at. Unique per pair. Also drives DM membership.
- **messages** — id, channel_id, author_id, body, parent_message_id (null = top-level, set = thread reply), reply_count, last_reply_at, edited_at, deleted_at, created_at.
- **reactions** — message_id, profile_id, emoji. Unique per triple.
- **attachments** — id, message_id, file_path, mime_type, size, width/height.
- **user_roles** — separate table with an app_role enum (admin/member); never stored on profiles.

Indexes on messages(channel_id, created_at) and messages(parent_message_id, created_at) so channel scroll and thread panes stay fast.

DMs are channels with is_dm = true and no name; the UI labels them from the other members. A deterministic key of sorted member ids prevents duplicate DM conversations.

### Access rules

Every table has row-level security. A person can read a channel and its messages only if they are a member (public channels are also readable to signed-in users for browse/join). Only the author can edit or delete their own message. Membership checks run through a security-definer helper function so policies never recurse.

### Server endpoints (typed server functions)

- Auth-adjacent: get current profile, update profile.
- Channels: list my channels, browse public channels, create channel, join, leave, update topic, archive.
- DMs: open-or-create DM with a set of members.
- Messages: list channel messages (paged, top-level only), list thread replies, send message, edit, delete, mark channel read.
- Reactions: toggle reaction.
- Presence/typing: broadcast-only, no persistence.

Realtime subscriptions push new messages, edits, reactions, and thread updates to open clients.

### Pages

- `/` — landing/sign-in when signed out; redirects into the workspace when signed in.
- `/c/$channelId` — channel view with message list, composer, and a right-hand thread pane at `?thread=<messageId>`.
- `/dm/$channelId` — same view, DM framing.
- `/browse` — public channel directory.
- `/settings` — profile.

## Build order

1. Enable Lovable Cloud, create the schema, access rules, and seed a #general channel.
2. Sign-up / sign-in and profile.
3. App shell: sidebar, channel list, empty channel view, design system.
4. Messages: list, send, edit, delete, live updates, pagination.
5. Threads: reply pane, reply counts.
6. DMs and the member picker.
7. Reactions, unread badges, typing indicator, attachments.

## Notes

Reactions, attachments, typing indicators, and presence are included in the schema but built last, so the core chat works early. No Slack account or Slack API is involved — this is your own app.
