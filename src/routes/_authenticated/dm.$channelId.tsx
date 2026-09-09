import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/components/chat/ChatView";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dm/$channelId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Direct message — Hearth" },
      { name: "description", content: "A private one-to-one or group conversation in Hearth." },
      { property: "og:title", content: "Direct message — Hearth" },
      { property: "og:description", content: "A private conversation in Hearth." },
    ],
  }),
  component: DmPage,
});

function DmPage() {
  const { channelId } = Route.useParams();
  const [meId, setMeId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  useEffect(() => setThreadId(null), [channelId]);

  return (
    <ChatView
      channelId={channelId}
      meId={meId}
      threadId={threadId ?? undefined}
      onOpenThread={setThreadId}
    />
  );
}
