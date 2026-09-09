import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { joinChannel, listMyChannels, listPublicChannels } from "@/lib/chat";

export const Route = createFileRoute("/_authenticated/browse")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Browse channels — Hearth" },
      { name: "description", content: "Discover open channels in your Hearth workspace and join the conversations that matter to you." },
      { property: "og:title", content: "Browse channels — Hearth" },
      { property: "og:description", content: "Discover and join open channels in your workspace." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const all = useQuery({ queryKey: ["publicChannels"], queryFn: listPublicChannels });
  const mine = useQuery({ queryKey: ["myChannels"], queryFn: listMyChannels });
  const myIds = new Set((mine.data ?? []).map((c) => c.id));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border px-5 py-3">
        <h1 className="font-display text-lg font-semibold">Browse channels</h1>
        <p className="text-xs text-muted-foreground">Open channels anyone in the workspace can join.</p>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="mx-auto max-w-2xl space-y-2 p-4">
          {(all.data ?? []).map((channel) => (
            <li
              key={channel.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <Hash className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{channel.name}</p>
                {channel.topic ? (
                  <p className="truncate text-xs text-muted-foreground">{channel.topic}</p>
                ) : null}
              </div>
              {myIds.has(channel.id) ? (
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/c/$channelId", params: { channelId: channel.id } })}
                >
                  Open
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    await joinChannel(channel.id);
                    await qc.invalidateQueries({ queryKey: ["myChannels"] });
                    void navigate({ to: "/c/$channelId", params: { channelId: channel.id } });
                  }}
                >
                  Join
                </Button>
              )}
            </li>
          ))}
          {all.data?.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No open channels yet.
            </li>
          ) : null}
        </ul>
      </ScrollArea>
    </div>
  );
}
