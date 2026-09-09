import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createChannel } from "@/lib/chat";

export function NewChannelDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function submit() {
    setBusy(true);
    try {
      const channel = await createChannel({ name, topic, isPrivate });
      await qc.invalidateQueries({ queryKey: ["myChannels"] });
      setOpen(false);
      setName("");
      setTopic("");
      setIsPrivate(false);
      void navigate({ to: "/c/$channelId", params: { channelId: channel.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the channel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a channel</DialogTitle>
          <DialogDescription>Channels are where your team talks about one topic.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">Name</Label>
            <Input
              id="channel-name"
              value={name}
              placeholder="product-launch"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel-topic">Topic (optional)</Label>
            <Input
              id="channel-topic"
              value={topic}
              placeholder="What is this channel about?"
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Make private</p>
              <p className="text-xs text-muted-foreground">Only invited people can find and join it.</p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
          <Button className="w-full" disabled={!name.trim() || busy} onClick={() => void submit()}>
            Create channel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
