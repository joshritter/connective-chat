import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Compass, Hash, Lock, LogOut, Plus, Settings, SquarePen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "./UserAvatar";
import { NewChannelDialog } from "./NewChannelDialog";
import { NewDmDialog } from "./NewDmDialog";
import { channelLabel, getMyProfile, listMyChannels } from "@/lib/chat";
import { cn } from "@/lib/utils";

export function AppSidebar({ meId }: { meId: string | null }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const channels = useQuery({ queryKey: ["myChannels"], queryFn: listMyChannels });

  const rooms = (channels.data ?? []).filter((c) => !c.is_dm);
  const dms = (channels.data ?? []).filter((c) => c.is_dm);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
        <Link to="/channels" className="font-display text-lg font-bold text-sidebar-accent-foreground">
          Hearth
        </Link>
        <NewDmDialog
          meId={meId}
          trigger={
            <Button size="icon" variant="ghost" className="size-8 text-sidebar-foreground hover:bg-sidebar-accent">
              <SquarePen className="size-4" />
            </Button>
          }
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="space-y-6 p-3">
          <div>
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Channels</span>
              <NewChannelDialog
                trigger={
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                }
              />
            </div>
            <ul className="space-y-0.5">
              {rooms.map((channel) => (
                <li key={channel.id}>
                  <Link
                    to="/c/$channelId"
                    params={{ channelId: channel.id }}
                    activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent"
                  >
                    {channel.is_private ? (
                      <Lock className="size-3.5 opacity-70" />
                    ) : (
                      <Hash className="size-3.5 opacity-70" />
                    )}
                    <span className={cn("flex-1 truncate", channel.unread > 0 && "font-semibold")}>
                      {channel.name}
                    </span>
                    {channel.unread > 0 ? (
                      <span className="rounded-full bg-sidebar-primary px-1.5 text-xs font-bold text-sidebar-primary-foreground">
                        {channel.unread}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/browse"
                  activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm opacity-80 transition-colors hover:bg-sidebar-accent"
                >
                  <Compass className="size-3.5" />
                  Browse channels
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="px-2 text-xs font-semibold uppercase tracking-wider opacity-70">
              Direct messages
            </span>
            <ul className="mt-1 space-y-0.5">
              {dms.length === 0 ? (
                <li className="px-2 py-1 text-xs opacity-60">No conversations yet.</li>
              ) : null}
              {dms.map((channel) => (
                <li key={channel.id}>
                  <Link
                    to="/dm/$channelId"
                    params={{ channelId: channel.id }}
                    activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent"
                  >
                    <UserAvatar
                      profile={channel.members.find((m) => m.id !== meId) ?? null}
                      className="size-5"
                      showPresence
                      ringClassName="ring-sidebar"
                    />
                    <span className={cn("flex-1 truncate", channel.unread > 0 && "font-semibold")}>
                      {channelLabel(channel, channel.members, meId ?? undefined)}
                    </span>
                    {channel.unread > 0 ? (
                      <span className="rounded-full bg-sidebar-primary px-1.5 text-xs font-bold text-sidebar-primary-foreground">
                        {channel.unread}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </ScrollArea>

      <div className="flex items-center gap-2 border-t border-sidebar-border p-3">
        <UserAvatar profile={profile.data} className="size-8" showPresence ringClassName="ring-sidebar" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{profile.data?.display_name ?? "You"}</p>
          {profile.data?.status_text ? (
            <p className="truncate text-xs opacity-70">{profile.data.status_text}</p>
          ) : null}
        </div>
        <Link to="/settings">
          <Button size="icon" variant="ghost" className="size-8 text-sidebar-foreground hover:bg-sidebar-accent">
            <Settings className="size-4" />
          </Button>
        </Link>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => void signOut()}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  );
}
