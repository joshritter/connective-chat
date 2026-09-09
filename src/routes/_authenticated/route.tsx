import { useEffect, useState } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/chat/AppSidebar";
import { PresenceProvider } from "@/components/chat/PresenceProvider";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const qc = useQueryClient();
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("workspace-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        const row = (payload.new ?? payload.old) as {
          channel_id?: string;
          parent_message_id?: string;
        } | null;
        if (row?.channel_id) {
          void qc.invalidateQueries({ queryKey: ["messages", row.channel_id] });
        }
        if (row?.parent_message_id) {
          void qc.invalidateQueries({ queryKey: ["thread", row.parent_message_id] });
          void qc.invalidateQueries({ queryKey: ["message", row.parent_message_id] });
        }
        void qc.invalidateQueries({ queryKey: ["myChannels"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, () => {
        void qc.invalidateQueries({ queryKey: ["reactions"] });
        void qc.invalidateQueries({ queryKey: ["thread-reactions"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "channel_members" }, () => {
        void qc.invalidateQueries({ queryKey: ["myChannels"] });
        void qc.invalidateQueries({ queryKey: ["members"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  return (
    <PresenceProvider meId={meId}>
      <div className="flex h-dvh w-full overflow-hidden bg-background">
        <AppSidebar meId={meId} />
        <main className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </PresenceProvider>
  );
}
