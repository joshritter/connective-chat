# Typing indicators

Show "Sam is typing…" under the message box while someone is actively writing, in channels, DMs, and threads.

## Behaviour

- While a person types, everyone else viewing that same conversation sees their name below the composer.
- Threads are separate: typing in a thread only shows inside that thread, not in the main channel.
- The line disappears about 4 seconds after the person stops typing, or immediately when they send the message, close the tab, or switch conversations.
- Wording: "Sam is typing…", "Sam and Alex are typing…", "Sam, Alex and 2 others are typing…".
- You never see yourself.

## Technical approach

- New `src/hooks/useTyping.ts`: joins a realtime broadcast channel keyed by scope (`typing:<channelId>` or `typing:<channelId>:<parentMessageId>`).
  - `notifyTyping()` broadcasts `{ user_id, display_name }` at most once every 2s while the user types.
  - Incoming events are stored with a timestamp; a 1s interval prunes entries older than 4s.
  - Returns `{ typers, notifyTyping, stopTyping }`; `stopTyping` broadcasts a `stop` event on send/unmount.
  - No database tables, no writes — ephemeral broadcast only.
- `Composer.tsx` gains optional `onTyping` / `onStopTyping` props, called from the textarea `onChange` and after a successful send.
- New `TypingIndicator.tsx` renders the reserved-height single line below the composer using muted foreground text and animated dots.
- `ChatView.tsx` and `ThreadPane.tsx` wire the hook with their own scope keys and pass the current user's display name (from the existing profile query / members list).
