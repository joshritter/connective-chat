import { useState } from "react";
import { MessageSquare, Pencil, SmilePlus, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "./UserAvatar";
import { EmojiPicker } from "./EmojiPicker";
import { emojiName } from "@/lib/emoji";
import type { Message, Reaction } from "@/lib/chat";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
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
  const authorName = message.author?.display_name ?? "Someone";
  const sentAt = new Date(message.created_at);

  const grouped = reactions.reduce<Record<string, Reaction[]>>((acc, r) => {
    (acc[r.emoji] ||= []).push(r);
    return acc;
  }, {});

  return (
    <article
      aria-label={`Message from ${authorName} at ${formatTime(message.created_at)}`}
      className="group relative flex gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface focus-within:bg-surface"
    >
      <UserAvatar profile={message.author} showPresence />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-foreground">{authorName}</span>
          <time
            dateTime={sentAt.toISOString()}
            title={sentAt.toLocaleString()}
            className="text-xs text-muted-foreground"
          >
            {formatTime(message.created_at)}
          </time>
          {message.edited_at && !deleted ? (
            <span className="text-xs text-muted-foreground">(edited)</span>
          ) : null}
        </div>

        {deleted ? (
          <p className="text-sm italic text-muted-foreground">This message was deleted.</p>
        ) : editing ? (
          <div className="mt-1 space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              aria-label="Edit your message"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onEdit(message.id, draft.trim());
                  setEditing(false);
                }}
              >
                <Check className="size-4" aria-hidden="true" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="size-4" aria-hidden="true" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-foreground">
            {message.body}
          </p>
        )}

        {Object.keys(grouped).length > 0 ? (
          <ul aria-label="Reactions" className="mt-1.5 flex list-none flex-wrap gap-1">
            {Object.entries(grouped).map(([emoji, list]) => {
              const mine = list.some((r) => r.profile_id === meId);
              return (
                <li key={emoji}>
                  <button
                    type="button"
                    aria-pressed={mine}
                    aria-label={`${emojiName(emoji)} reaction, ${list.length} ${list.length === 1 ? "person" : "people"}. ${mine ? "Remove your reaction" : "Add your reaction"}`}
                    title={`${list.length} reacted with ${emojiName(emoji)}`}
                    onClick={() => onToggleReaction(message.id, emoji)}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      mine
                        ? "border-ember bg-accent text-accent-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-ember",
                    )}
                  >
                    <span aria-hidden="true">{emoji}</span>
                    <span aria-hidden="true">{list.length}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {showThreadButton && message.reply_count > 0 ? (
          <button
            type="button"
            onClick={() => onOpenThread?.(message)}
            aria-label={`Open thread with ${message.reply_count} ${message.reply_count === 1 ? "reply" : "replies"}`}
            className="mt-1.5 text-xs font-semibold text-ember hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {message.reply_count} {message.reply_count === 1 ? "reply" : "replies"}
          </button>
        ) : null}
      </div>

      {!deleted ? (
        <div
          role="toolbar"
          aria-label={`Actions for message from ${authorName}`}
          className="absolute right-3 top-1 flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-within:opacity-100"
        >
          <EmojiPicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            onSelect={(emoji) => onToggleReaction(message.id, emoji)}
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label="Add a reaction"
                title="Add a reaction"
              >
                <SmilePlus className="size-4" aria-hidden="true" />
              </Button>
            }
          />
          {showThreadButton ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Reply in thread"
              title="Reply in thread"
              onClick={() => onOpenThread?.(message)}
            >
              <MessageSquare className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
          {isMine ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label="Edit your message"
                title="Edit message"
                onClick={() => {
                  setDraft(message.body);
                  setEditing(true);
                }}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-destructive"
                aria-label="Delete your message"
                title="Delete message"
                onClick={() => onDelete(message.id)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
