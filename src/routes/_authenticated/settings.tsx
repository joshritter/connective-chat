import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyProfile, updateMyProfile } from "@/lib/chat";

export const Route = createFileRoute("/_authenticated/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your profile settings — Hearth" },
      { name: "description", content: "Update your display name, avatar and status so teammates know who you are in Hearth." },
      { property: "og:title", content: "Your profile settings — Hearth" },
      { property: "og:description", content: "Update your display name, avatar and status in Hearth." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    if (!profile.data) return;
    setDisplayName(profile.data.display_name ?? "");
    setAvatarUrl(profile.data.avatar_url ?? "");
    setStatusText(profile.data.status_text ?? "");
  }, [profile.data]);

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="mx-auto max-w-lg p-6">
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await updateMyProfile({
                display_name: displayName,
                avatar_url: avatarUrl || null,
                status_text: statusText || null,
              });
              await qc.invalidateQueries({ queryKey: ["profile"] });
              toast.success("Profile saved");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not save");
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="display">Display name</Label>
            <Input id="display" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="avatar">Avatar image URL</Label>
            <Input id="avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Input id="status" value={statusText} onChange={(e) => setStatusText(e.target.value)} placeholder="Working on the roadmap" />
          </div>
          <Button type="submit">Save changes</Button>
        </form>
      </div>
    </div>
  );
}
