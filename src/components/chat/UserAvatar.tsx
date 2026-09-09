import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, type Profile } from "@/lib/chat";
import { cn } from "@/lib/utils";
import { usePresence } from "./PresenceProvider";

export function UserAvatar({
  profile,
  className,
  showPresence = false,
  ringClassName,
}: {
  profile: Pick<Profile, "id" | "display_name" | "avatar_url"> | null | undefined;
  className?: string;
  showPresence?: boolean;
  ringClassName?: string;
}) {
  const name = profile?.display_name ?? "?";
  const presence = usePresence(showPresence ? profile?.id : null);

  return (
    <span className="relative inline-flex shrink-0">
      <Avatar className={cn("size-9 rounded-lg", className)}>
        {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={name} /> : null}
        <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
          {initials(name) || "?"}
        </AvatarFallback>
      </Avatar>
      {presence ? (
        <span
          aria-label={presence === "online" ? "Online" : "Away"}
          title={presence === "online" ? "Online" : "Away"}
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background",
            presence === "online" ? "bg-presence-online" : "bg-presence-away",
            ringClassName,
          )}
        />
      ) : null}
    </span>
  );
}
