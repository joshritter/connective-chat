-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'member');
CREATE TYPE public.member_role AS ENUM ('owner', 'member');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'New member',
  avatar_url text,
  status_text text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- CHANNELS
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  topic text,
  description text,
  is_private boolean NOT NULL DEFAULT false,
  is_dm boolean NOT NULL DEFAULT false,
  dm_key text UNIQUE,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX channels_name_unique ON public.channels (lower(name)) WHERE is_dm = false;
GRANT SELECT, INSERT, UPDATE ON public.channels TO authenticated;
GRANT ALL ON public.channels TO service_role;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- CHANNEL MEMBERS
CREATE TABLE public.channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'member',
  last_read_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, profile_id)
);
CREATE INDEX channel_members_profile_idx ON public.channel_members (profile_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_members TO authenticated;
GRANT ALL ON public.channel_members TO service_role;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- MESSAGES
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  parent_message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  reply_count integer NOT NULL DEFAULT 0,
  last_reply_at timestamptz,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_channel_created_idx ON public.messages (channel_id, created_at DESC);
CREATE INDEX messages_parent_created_idx ON public.messages (parent_message_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- REACTIONS
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, profile_id, emoji)
);
CREATE INDEX reactions_message_idx ON public.reactions (message_id);
GRANT SELECT, INSERT, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- HELPERS (security definer to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = _channel_id AND profile_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.can_view_channel(_channel_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = _channel_id
      AND (
        (c.is_private = false AND c.is_dm = false)
        OR EXISTS (SELECT 1 FROM public.channel_members m WHERE m.channel_id = c.id AND m.profile_id = _user_id)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_view_message(_message_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.messages msg
    WHERE msg.id = _message_id
      AND public.is_channel_member(msg.channel_id, _user_id)
  )
$$;

-- POLICIES: channels
CREATE POLICY "channels_select_visible" ON public.channels FOR SELECT TO authenticated
  USING ((is_private = false AND is_dm = false) OR public.is_channel_member(id, auth.uid()));
CREATE POLICY "channels_insert_own" ON public.channels FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "channels_update_member" ON public.channels FOR UPDATE TO authenticated
  USING (public.is_channel_member(id, auth.uid())) WITH CHECK (public.is_channel_member(id, auth.uid()));

-- POLICIES: channel members
CREATE POLICY "channel_members_select" ON public.channel_members FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.can_view_channel(channel_id, auth.uid()));
CREATE POLICY "channel_members_insert" ON public.channel_members FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    OR public.is_channel_member(channel_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.created_by = auth.uid())
  );
CREATE POLICY "channel_members_update_own" ON public.channel_members FOR UPDATE TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "channel_members_delete_own" ON public.channel_members FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- POLICIES: messages
CREATE POLICY "messages_select_member" ON public.messages FOR SELECT TO authenticated
  USING (public.is_channel_member(channel_id, auth.uid()));
CREATE POLICY "messages_insert_member" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.is_channel_member(channel_id, auth.uid()));
CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "messages_delete_own" ON public.messages FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- POLICIES: reactions
CREATE POLICY "reactions_select_visible" ON public.reactions FOR SELECT TO authenticated
  USING (public.can_view_message(message_id, auth.uid()));
CREATE POLICY "reactions_insert_own" ON public.reactions FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() AND public.can_view_message(message_id, auth.uid()));
CREATE POLICY "reactions_delete_own" ON public.reactions FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER channels_set_updated_at BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- thread reply counters
CREATE OR REPLACE FUNCTION public.bump_thread_counters()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_message_id IS NOT NULL THEN
    UPDATE public.messages
      SET reply_count = reply_count + 1, last_reply_at = NEW.created_at
      WHERE id = NEW.parent_message_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_message_id IS NOT NULL THEN
    UPDATE public.messages
      SET reply_count = GREATEST(reply_count - 1, 0)
      WHERE id = OLD.parent_message_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER messages_thread_counters
AFTER INSERT OR DELETE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.bump_thread_counters();

-- seed default channel
INSERT INTO public.channels (id, name, topic, description, is_private, is_dm)
VALUES ('00000000-0000-4000-8000-000000000001', 'general', 'Company-wide announcements and work-based matters', 'This is the one channel that will always include everyone.', false, false);

-- new user -> profile + default membership + member role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
      split_part(COALESCE(NEW.email, 'member'), '@', 1)
    ),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.channel_members (channel_id, profile_id)
  VALUES ('00000000-0000-4000-8000-000000000001', NEW.id)
  ON CONFLICT (channel_id, profile_id) DO NOTHING;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.reactions REPLICA IDENTITY FULL;
ALTER TABLE public.channel_members REPLICA IDENTITY FULL;
ALTER TABLE public.channels REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;