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
  const presenceLabel = presence === "online" ? "Online" : "Away";

  return (
    <span className="relative inline-flex shrink-0">
      <Avatar className={cn("size-9 rounded-lg", className)} title={name}>
        {profile?.avatar_url ? (
          <AvatarImage src={profile.avatar_url} alt={`${name}'s profile picture`} />
        ) : null}
        <AvatarFallback
          aria-label={name}
          className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
        >
          <span aria-hidden="true">{initials(name) || "?"}</span>
        </AvatarFallback>
      </Avatar>
      {presence ? (
        <span
          role="img"
          aria-label={`${name} is ${presenceLabel.toLowerCase()}`}
          title={`${name} — ${presenceLabel}`}
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
