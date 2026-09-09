import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/components/chat/ChatView";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/c/$channelId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Channel — Hearth" },
      {
        name: "description",
        content: "Follow the conversation in this Hearth channel, with threads and reactions.",
      },
      { property: "og:title", content: "Channel — Hearth" },
      { property: "og:description", content: "Follow the conversation in this Hearth channel." },
    ],
  }),
  component: ChannelPage,
});

function ChannelPage() {
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
