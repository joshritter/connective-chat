# Hearth

A real-time team chat application inspired by Slack, built to support multiple users, public/private channels, direct messages, group DMs, message threads, reactions, and live presence indicators.

This project was built with [Lovable](https://lovable.dev).

## Data Model

The backend uses a relational schema designed around workspaces, conversations, messages, and memberships.

### Core Tables

| Table             | Purpose                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`        | One row per user, synced from auth sign-ups. Stores display name, avatar URL, status text, and last seen timestamp.                             |
| `user_roles`      | Separate role assignments per user (`admin` or `member`). Kept independent of `profiles` for security.                                          |
| `channels`        | Conversations: public channels, private channels, and DM/group-DM channels. Uses `is_private`, `is_dm`, and `dm_key` to distinguish types.      |
| `channel_members` | Many-to-many membership linking profiles to channels, plus member roles (`owner` or `member`) and `last_read_at`.                               |
| `messages`        | Chat messages, supporting threads via `parent_message_id`, soft deletion via `deleted_at`, and reply metadata (`reply_count`, `last_reply_at`). |
| `reactions`       | Emoji reactions tied to messages and profiles.                                                                                                  |

### Key Columns & Concepts

- **Channels as universal conversations**: Public channels, private channels, DMs, and group DMs are all stored in `channels`. DM channels use a deterministic `dm_key` built from sorted member IDs so the same group always maps to one channel.
- **Membership-driven visibility**: A user can only see channels they are a member of, plus public non-DM channels. All visibility checks use security-definer helper functions.
- **Threading**: A message with `parent_message_id` is a reply. A database trigger automatically increments `reply_count` and sets `last_reply_at` on the parent message.
- **Soft deletion**: Messages set `deleted_at` instead of being removed, preserving thread structure and reply counts.
- **Real-time presence**: Online/away status is tracked client-side via Supabase Realtime Presence on a shared `presence:workspace` channel, with no extra database writes.

### Database Helpers

| Function                                  | Role                                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `is_channel_member(channel_id, user_id)`  | Checks channel membership.                                                                            |
| `can_view_channel(channel_id, user_id)`   | Returns true for public channels or channels the user is a member of.                                 |
| `can_view_message(message_id, user_id)`   | Returns true when the user can view the message's channel.                                            |
| `is_open_channel(channel_id)`             | Returns true for public, non-DM channels — the only ones anyone may self-join.                        |
| `is_channel_creator(channel_id, user_id)` | Returns true when the user created the channel (used to bootstrap members).                           |
| `is_dm_channel(channel_id)`               | Returns true for DM channels, which nobody may be added to after creation.                            |
| `my_channel_overview()`                   | Returns the caller's channels/DMs with server-computed unread counts (powers the sidebar).            |
| `has_role(user_id, role)`                 | Checks whether a user has a given app role (`admin` or `member`).                                     |
| `bump_thread_counters()`                  | Trigger function that updates parent reply counts on insert/delete.                                   |
| `guard_channel_member_role()`             | Trigger function that rejects role changes made by anyone who is not a channel owner.                 |
| `handle_new_user()`                       | Auth trigger that creates a profile, assigns the `member` role, and auto-joins the `general` channel. |

### Membership Rules

A `channel_members` row may only be created when one of the following holds:

- The user is adding **themselves** to an open channel, or re-joining a channel they are already in.
- The user **created** the channel (bootstraps the owner row and DM participants).
- The user is a member of a **private channel** and is inviting someone else. DMs are excluded — no one can be added to an existing DM.

The `owner` role can only be claimed by the channel's creator at insert time; any later role change is rejected by
`guard_channel_member_role()` unless the caller is already an owner of that channel.

### Unread Counts

Unread badges come from `my_channel_overview()`, which counts messages newer than the caller's `last_read_at`
(excluding their own and soft-deleted messages) inside the database, using the `(channel_id, created_at DESC)` index.
The client fetches only member profiles afterwards, so no message bodies are transferred to render the sidebar.

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

| Route                           | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `/`                             | Public landing page with sign-in / sign-up links.        |
| `/auth`                         | Authentication screen (email/password and Google OAuth). |
| `/_authenticated`               | Layout gate requiring a signed-in user.                  |
| `/_authenticated/channels`      | Redirects to the seeded `general` channel.               |
| `/_authenticated/c/$channelId`  | A public/private channel conversation.                   |
| `/_authenticated/dm/$channelId` | A direct message or group DM conversation.               |
| `/_authenticated/browse`        | Discover and join public channels.                       |
| `/_authenticated/settings`      | User profile settings.                                   |

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

## Emoji picker

Reactions and the composer share one picker (`src/components/chat/EmojiPicker.tsx`).

- **Data** lives in `src/lib/emoji.ts`: a curated set grouped into eight categories, each entry
  carrying an `emoji`, a human-readable `name` and search `keywords`. No external emoji
  dependency, so the bundle stays small and every character has an accessible name.
- **Search** (`searchEmoji`) matches name or keyword, case-insensitively, and shows a single
  "Search results" section; an empty query shows all categories.
- **Recently used** emoji are kept in `localStorage` under `hearth:recent-emoji`, most recent
  first, capped at eight, and corrupt or unavailable storage degrades to an empty list.
- **Accessibility**: the picker is a Popover that focuses its search box on open, every emoji is a
  button with its name as the accessible label and title, sections use headings, and arrow keys
  (plus Home/End) move a roving focus across the 8-column grid. Down arrow from the search box
  drops into the grid.
- **Usage**: `MessageRow` opens it from the "Add a reaction" action and toggles the reaction;
  `Composer` opens it from "Add emoji" and appends the character to the draft. Reaction pills are
  announced by name ("thumbs up reaction, 2 people") rather than by raw character.

## Testing & code quality

Unit tests run on **Vitest** + **Testing Library** in a jsdom environment, with a global
setup (`src/test/setup.ts`) that mocks the backend client so tests never hit the network.

```sh
npm run test           # run the suite once
npm run test:watch     # re-run on change
npm run test:coverage  # run with coverage thresholds enforced
npm run lint           # ESLint: TypeScript, react-hooks, jsx-a11y, Prettier
npm run verify         # lint + tests + coverage (run before shipping)
```

Tests live beside the code they cover (`Composer.tsx` → `Composer.test.tsx`) and query the
DOM by role and accessible name, so an unlabelled control fails the suite. Coverage
thresholds live in `vitest.config.ts`: a global floor plus stricter per-file floors for
modules that already have tests. Thresholds ratchet upwards only.

Full rules and rationale: see [TESTING.md](./TESTING.md).

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
