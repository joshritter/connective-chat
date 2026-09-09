# Fix: channel access, role escalation, and slow sidebar

Three fixes: two access-rule holes and the sidebar's heavy unread counting.

## 1. Stop people joining private channels and other people's DMs

Today the rule for adding someone to a conversation only asks "is this row about
me?", so any signed-in person can add themselves to a private channel or a
two-person DM and read everything in it.

New rule — a membership row is allowed only when one of these is true:

- You are adding yourself to an **open** channel (not private, not a DM).
- You are adding yourself to a conversation you are **already in** (re-joining
  is harmless).
- You **created** the conversation (this is what lets a new channel or DM be set
  up with its first members).
- You are already a member of a **private channel** and are inviting someone
  else. DMs are excluded: nobody can be added to an existing DM.

A helper is added to check "is this an open channel?" without tripping over the
conversation's own visibility rules.

## 2. Stop people promoting themselves to channel owner

Today a member can set their own role to `owner`.

- On creation, the `owner` role is only accepted when the channel's creator is
  adding themselves. Everyone else lands as `member`.
- A database guard rejects any later role change unless the person making it is
  already an owner of that channel.
- Members keep the ability to update their own "last read" marker, which is what
  the unread badges rely on.

## 3. Make the sidebar fast

Today the sidebar downloads the last 500 messages from every conversation you
belong to, just to count unread badges. That grows with the workspace.

- Add a database function that returns your conversations together with their
  unread count, computed in the database using the existing
  `(channel, created_at)` index. Deleted messages and your own messages are not
  counted.
- `listMyChannels` calls that function and then makes a single follow-up query
  for member profiles (needed for DM names and avatars). The 500-message fetch
  is removed entirely.
- Return shape stays identical, so the sidebar, DM labels, and unread badges
  need no changes.

## Verification

- Existing tests, type check, lint, and build.
- Re-run the security scan to confirm the two findings clear.
- Confirm the sidebar still lists channels, DMs, and unread badges in the
  preview.

## Not included

The broader live-update refetch storm and message paging (performance items 2-6)
stay open for a later pass.
