-- 1. Helper: is this an open (public, non-DM) channel?
CREATE OR REPLACE FUNCTION public.is_open_channel(_channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = _channel_id AND c.is_private = false AND c.is_dm = false
  )
$$;

REVOKE ALL ON FUNCTION public.is_open_channel(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_open_channel(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_channel_creator(_channel_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = _channel_id AND c.created_by = _user_id
  )
$$;

REVOKE ALL ON FUNCTION public.is_channel_creator(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_channel_creator(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_dm_channel(_channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.channels c WHERE c.id = _channel_id AND c.is_dm = true)
$$;

REVOKE ALL ON FUNCTION public.is_dm_channel(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_dm_channel(uuid) TO authenticated;

-- 2. Replace the permissive membership insert policy
DROP POLICY IF EXISTS channel_members_insert ON public.channel_members;

CREATE POLICY channel_members_insert ON public.channel_members
FOR INSERT TO authenticated
WITH CHECK (
  (
    -- adding yourself to an open channel, or re-joining one you're already in
    (profile_id = auth.uid() AND (
      public.is_open_channel(channel_id)
      OR public.is_channel_member(channel_id, auth.uid())
    ))
    -- the creator bootstraps the channel / DM with its first members
    OR public.is_channel_creator(channel_id, auth.uid())
    -- a member invites someone into a private channel (never into a DM)
    OR (
      public.is_channel_member(channel_id, auth.uid())
      AND profile_id <> auth.uid()
      AND NOT public.is_dm_channel(channel_id)
    )
  )
  AND (
    role = 'member'::member_role
    OR (
      role = 'owner'::member_role
      AND profile_id = auth.uid()
      AND public.is_channel_creator(channel_id, auth.uid())
    )
  )
);

-- 3. Guard role changes after the fact
CREATE OR REPLACE FUNCTION public.guard_channel_member_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.channel_members m
      WHERE m.channel_id = OLD.channel_id
        AND m.profile_id = auth.uid()
        AND m.role = 'owner'::member_role
    ) THEN
      RAISE EXCEPTION 'Only channel owners can change member roles';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS channel_members_guard_role ON public.channel_members;
CREATE TRIGGER channel_members_guard_role
BEFORE UPDATE ON public.channel_members
FOR EACH ROW EXECUTE FUNCTION public.guard_channel_member_role();

-- 4. Fast conversation overview with unread counts
CREATE OR REPLACE FUNCTION public.my_channel_overview()
RETURNS TABLE (
  id uuid,
  name text,
  topic text,
  description text,
  is_private boolean,
  is_dm boolean,
  dm_key text,
  is_archived boolean,
  created_by uuid,
  created_at timestamptz,
  last_read_at timestamptz,
  unread integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    c.id, c.name, c.topic, c.description, c.is_private, c.is_dm, c.dm_key,
    c.is_archived, c.created_by, c.created_at, m.last_read_at,
    (
      SELECT count(*)::int
      FROM public.messages msg
      WHERE msg.channel_id = c.id
        AND msg.author_id <> auth.uid()
        AND msg.deleted_at IS NULL
        AND msg.created_at > m.last_read_at
    ) AS unread
  FROM public.channel_members m
  JOIN public.channels c ON c.id = m.channel_id
  WHERE m.profile_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.my_channel_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_channel_overview() TO authenticated;

-- Supporting index for the unread subquery's author filter
CREATE INDEX IF NOT EXISTS reactions_profile_idx ON public.reactions (profile_id);
CREATE INDEX IF NOT EXISTS channels_created_by_idx ON public.channels (created_by);