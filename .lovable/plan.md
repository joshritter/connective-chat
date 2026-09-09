# Online presence indicators

Show at a glance who is currently online in the workspace.

## What you'll see

- A small green dot on the bottom-right corner of a person's avatar when they're online, grey/hidden when they're not.
- Dots appear in the direct-message list in the sidebar, on the conversation header, in the "new message" people picker, and on message avatars.
- Your own avatar at the bottom of the sidebar shows you as online (with an "Away" state after a few minutes of no activity in the tab).
- Updates happen live: when someone opens or closes the app, everyone else's dots change within a second.

## How it works

- Uses the built-in live presence channel of the backend (no new tables, no polling, no extra database writes).
- One shared workspace presence channel is joined once in the signed-in layout; each person publishes their own id and an online/away state.
- A small React context (`PresenceProvider` + `usePresence` hook) exposes a set of online user ids to every component.
- Away detection: the browser tab's visibility and last interaction time flip the published state after 5 minutes idle.
- `UserAvatar` gains an optional `showPresence` flag and reads the hook itself, so every existing usage lights up by passing that flag.

## Files

- New: `src/components/chat/PresenceProvider.tsx` (context, channel subscribe/track, idle detection)
- Edit: `src/routes/_authenticated/route.tsx` (wrap the layout in the provider once the user id is known)
- Edit: `src/components/chat/UserAvatar.tsx` (presence dot)
- Edit: `AppSidebar.tsx`, `ChatView.tsx`, `MessageRow.tsx`, `NewDmDialog.tsx` (enable the dot where people are shown)
