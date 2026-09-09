REVOKE ALL ON FUNCTION public.guard_channel_member_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_open_channel(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_channel_creator(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_dm_channel(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.my_channel_overview() FROM anon;