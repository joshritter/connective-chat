import { useState } from "react";
import { MessageSquare, Pencil, SmilePlus, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "./UserAvatar";
import type { Message, Reaction } from "@/lib/chat";
import { cn } from "@/lib/utils";

const QUICK_EMOJI = ["👍", "🎉", "❤️", "😂", "👀", "🚀"];

function formatTime(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function MessageRow({
  message,
  reactions,
  meId,
  showThreadButton = true,
  onOpenThread,
  onToggleReaction,
  onEdit,
  onDelete,
}: {
  message: Message;
  reactions: Reaction[];
  meId: string | null;
  showThreadButton?: boolean;
  onOpenThread?: (message: Message) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, body: string) => void;
  onDelete: (messageId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [pickerOpen, setPickerOpen] = useState(false);
  const isMine = meId === message.author_id;
  const deleted = Boolean(message.deleted_at);

  const grouped = reactions.reduce<Record<string, Reaction[]>>((acc, r) => {
    (acc[r.emoji] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="group relative flex gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface">
      <UserAvatar profile={message.author} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-foreground">{message.author?.display_name ?? "Someone"}</span>
          <span className="text-xs text-muted-foreground">{formatTime(message.created_at)}</span>
          {message.edited_at && !deleted ? (
            <span className="text-xs text-muted-foreground">(edited)</span>
          ) : null}
        </div>

        {deleted ? (
          <p className="text-sm italic text-muted-foreground">This message was deleted.</p>
        ) : editing ? (
          <div className="mt-1 space-y-2">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onEdit(message.id, draft.trim());
                  setEditing(false);
                }}
              >
                <Check className="size-4" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="size-4" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-foreground">
            {message.body}
          </p>
        )}

        {Object.keys(grouped).length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {Object.entries(grouped).map(([emoji, list]) => {
              const mine = list.some((r) => r.profile_id === meId);
              return (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction(message.id, emoji)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                    mine
                      ? "border-ember bg-accent text-accent-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-ember",
                  )}
                >
                  <span>{emoji}</span>
                  <span>{list.length}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {showThreadButton && message.reply_count > 0 ? (
          <button
            onClick={() => onOpenThread?.(message)}
            className="mt-1.5 text-xs font-semibold text-ember hover:underline"
          >
            {message.reply_count} {message.reply_count === 1 ? "reply" : "replies"}
          </button>
        ) : null}
      </div>

      {!deleted ? (
        <div className="absolute right-3 top-1 flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          {pickerOpen ? (
            <div className="flex items-center gap-0.5">
              {QUICK_EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  className="rounded px-1 text-base hover:bg-surface"
                  onClick={() => {
                    onToggleReaction(message.id, emoji);
                    setPickerOpen(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <Button size="icon" variant="ghost" className="size-7" onClick={() => setPickerOpen(true)}>
              <SmilePlus className="size-4" />
            </Button>
          )}
          {showThreadButton ? (
            <Button size="icon" variant="ghost" className="size-7" onClick={() => onOpenThread?.(message)}>
              <MessageSquare className="size-4" />
            </Button>
          ) : null}
          {isMine ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => {
                  setDraft(message.body);
                  setEditing(true);
                }}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-destructive"
                onClick={() => onDelete(message.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
