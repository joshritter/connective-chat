import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "./UserAvatar";
import { listPeople, openDirectMessage } from "@/lib/chat";
import { cn } from "@/lib/utils";

export function NewDmDialog({ meId, trigger }: { meId: string | null; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const people = useQuery({ queryKey: ["people"], queryFn: listPeople, enabled: open });
  const list = (people.data ?? []).filter(
    (p) => p.id !== meId && p.display_name.toLowerCase().includes(search.toLowerCase()),
  );

  async function start() {
    setBusy(true);
    try {
      const channel = await openDirectMessage(selected);
      await qc.invalidateQueries({ queryKey: ["myChannels"] });
      setOpen(false);
      setSelected([]);
      setSearch("");
      void navigate({ to: "/dm/$channelId", params: { channelId: channel.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open that conversation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>Pick one or more people to start a conversation.</DialogDescription>
        </DialogHeader>
        <Input placeholder="Search people" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ScrollArea className="h-64 rounded-lg border border-border">
          <div className="p-1">
            {list.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No one else has joined yet.</p>
            ) : null}
            {list.map((person) => {
              const active = selected.includes(person.id);
              return (
                <button
                  key={person.id}
                  onClick={() =>
                    setSelected((prev) =>
                      prev.includes(person.id)
                        ? prev.filter((id) => id !== person.id)
                        : [...prev, person.id],
                    )
                  }
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                    active ? "bg-accent text-accent-foreground" : "hover:bg-surface",
                  )}
                >
                  <UserAvatar profile={person} className="size-8" showPresence />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{person.display_name}</p>
                    {person.status_text ? (
                      <p className="truncate text-xs text-muted-foreground">{person.status_text}</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        <Button disabled={selected.length === 0 || busy} onClick={() => void start()}>
          Start conversation
        </Button>
      </DialogContent>
    </Dialog>
  );
}
