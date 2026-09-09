# Hearth roadmap

- [x] Lovable Cloud + schema (profiles, channels, channel_members, messages, reactions, user_roles) with RLS + grants + seed #general
- [x] Auth (email/password + Google) at /auth, profile auto-create trigger
- [x] Design system in src/styles.css
- [x] App shell: sidebar (channels + DMs), /c/$channelId
- [x] Messages: list, send, edit, delete, realtime
- [x] Threads pane
- [x] DMs: open-or-create, member picker
- [x] Reactions, unread badges, browse page, settings page
- [x] Head metadata on every route
- [x] Presence indicators
- [x] Typing indicators (+ README docs)
- [x] Accessibility pass across UI components
- [x] Testing setup (Vitest + Testing Library), coverage thresholds, lint rules, TESTING.md
- [x] Full emoji picker for reactions (searchable, categorised, keyboard accessible) + tests
- [x] Security hardening: private-channel/DM join rules, channel role escalation guard
- [x] Performance: sidebar unread counts computed in the database (my_channel_overview)
- [ ] Confirm all tests are committed to GitHub (sync happens automatically once GitHub is connected)

## Not built yet

- [ ] File attachments in messages
- [ ] Performance follow-ups: narrower realtime invalidation, reaction cache key, message paging
- [ ] Security follow-ups: restrict channel settings edits to owners, message length limit, channel delete policy
