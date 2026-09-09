import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, type Profile } from "@/lib/chat";
import { cn } from "@/lib/utils";

export function UserAvatar({
  profile,
  className,
}: {
  profile: Pick<Profile, "display_name" | "avatar_url"> | null | undefined;
  className?: string;
}) {
  const name = profile?.display_name ?? "?";
  return (
    <Avatar className={cn("size-9 rounded-lg", className)}>
      {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={name} /> : null}
      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
        {initials(name) || "?"}
      </AvatarFallback>
    </Avatar>
  );
}
