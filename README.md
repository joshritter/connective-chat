# Hearth

A real-time team chat application inspired by Slack, built to support multiple users, public/private channels, direct messages, group DMs, message threads, reactions, and live presence indicators.

This project was built with [Lovable](https://lovable.dev).

## Data Model

The backend uses a relational schema designed around workspaces, conversations, messages, and memberships.

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | One row per user, synced from auth sign-ups. Stores display name, avatar URL, status text, and last seen timestamp. |
| `user_roles` | Separate role assignments per user (`admin` or `member`). Kept independent of `profiles` for security. |
| `channels` | Conversations: public channels, private channels, and DM/group-DM channels. Uses `is_private`, `is_dm`, and `dm_key` to distinguish types. |
| `channel_members` | Many-to-many membership linking profiles to channels, plus member roles (`owner` or `member`) and `last_read_at`. |
| `messages` | Chat messages, supporting threads via `parent_message_id`, soft deletion via `deleted_at`, and reply metadata (`reply_count`, `last_reply_at`). |
| `reactions` | Emoji reactions tied to messages and profiles. |

### Key Columns & Concepts

- **Channels as universal conversations**: Public channels, private channels, DMs, and group DMs are all stored in `channels`. DM channels use a deterministic `dm_key` built from sorted member IDs so the same group always maps to one channel.
- **Membership-driven visibility**: A user can only see channels they are a member of, plus public non-DM channels. All visibility checks use security-definer helper functions.
- **Threading**: A message with `parent_message_id` is a reply. A database trigger automatically increments `reply_count` and sets `last_reply_at` on the parent message.
- **Soft deletion**: Messages set `deleted_at` instead of being removed, preserving thread structure and reply counts.
- **Real-time presence**: Online/away status is tracked client-side via Supabase Realtime Presence on a shared `presence:workspace` channel, with no extra database writes.

### Database Helpers

| Function | Role |
|----------|------|
| `is_channel_member(channel_id, user_id)` | Checks channel membership. |
| `can_view_channel(channel_id, user_id)` | Returns true for public channels or channels the user is a member of. |
| `can_view_message(message_id, user_id)` | Returns true when the user can view the message's channel. |
| `has_role(user_id, role)` | Checks whether a user has a given app role (`admin` or `member`). |
| `bump_thread_counters()` | Trigger function that updates parent reply counts on insert/delete. |
| `handle_new_user()` | Auth trigger that creates a profile, assigns the `member` role, and auto-joins the `general` channel. |

### Enums

- `app_role`: `admin`, `member`
- `member_role`: `owner`, `member`

## Architecture Overview

Hearth is a full-stack React application using TanStack Start with edge-ready server functions.

### Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19, SSR/SSG, file-based routing)
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4 with a custom design-token layer (deep plum/ink + warm ember accents)
- **Backend / Auth / Realtime**: Lovable Cloud (Supabase)
- **State & Caching**: React Query (TanStack Query)
- **UI Components**: shadcn/ui primitives

### Route Structure

| Route | Purpose |
|-------|---------|
| `/` | Public landing page with sign-in / sign-up links. |
| `/auth` | Authentication screen (email/password and Google OAuth). |
| `/_authenticated` | Layout gate requiring a signed-in user. |
| `/_authenticated/channels` | Redirects to the seeded `general` channel. |
| `/_authenticated/c/$channelId` | A public/private channel conversation. |
| `/_authenticated/dm/$channelId` | A direct message or group DM conversation. |
| `/_authenticated/browse` | Discover and join public channels. |
| `/_authenticated/settings` | User profile settings. |

### Key Frontend Patterns

- **Authenticated layout**: `src/routes/_authenticated/route.tsx` checks the Supabase session and redirects unauthenticated users to `/auth`.
- **Server functions**: Internal backend calls use `createServerFn` from `@tanstack/react-start` (e.g., fetching channels, sending messages, creating DMs). Public HTTP endpoints live under `src/routes/api/public/*`.
- **Real-time updates**: The authenticated layout subscribes to Supabase Realtime for `INSERT`, `UPDATE`, and `DELETE` events on `messages`, then invalidates React Query caches so messages appear instantly across clients.
- **Presence**: A `PresenceProvider` joins the `presence:workspace` realtime channel, tracks local user activity/idle state, and exposes an online/away map used by avatars throughout the UI.
- **Typing indicators**: `src/hooks/useTyping.ts` joins an ephemeral Realtime **broadcast** channel scoped per conversation — `typing:<channelId>` for a channel or DM, and `typing:<channelId>:<parentMessageId>` for a thread, so thread typing never leaks into the main channel. Nothing is written to the database.
  - `notifyTyping()` fires from the composer's `onChange`, throttled to one broadcast every 2s, with payload `{ user_id, display_name }`.
  - Received events are held in a ref-backed map with timestamps; a 1s interval prunes entries older than 4s, and an explicit `stop` event is broadcast on send, blur, and unmount.
  - `TypingIndicator.tsx` renders a fixed-height line under the composer ("Sam is typing…", "Sam and Alex are typing…", "Sam, Alex and 2 others are typing…"), so the layout never shifts. Your own events are filtered out via `broadcast: { self: false }` plus a user-id check.
- **Security**: Row-Level Security (RLS) policies enforce that users can only read/write data they are authorized to access. Admin checks use the dedicated `user_roles` table via server-side validation.


### Authentication Flow

1. User signs up or signs in via `/auth` (email/password or Google).
2. Supabase creates the auth record.
3. The `handle_new_user()` trigger creates a `profile`, assigns the `member` role, and joins the seeded `general` channel.
4. The authenticated layout loads channels and starts realtime subscriptions.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/56e580b8-a16b-411b-ad51-be1396b8f6b0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
