import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Composer } from "./Composer";
import { MessageRow } from "./MessageRow";
import { TypingIndicator } from "./TypingIndicator";
import { useTyping } from "@/hooks/useTyping";

import {
  deleteMessage,
  editMessage,
  getMessage,
  listReactions,
  listThreadReplies,
  sendMessage,
  toggleReaction,
} from "@/lib/chat";

export function ThreadPane({
  channelId,
  parentId,
  meId,
  onClose,
}: {
  channelId: string;
  parentId: string;
  meId: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const typing = useTyping(`${channelId}:${parentId}`, meId);

  const parent = useQuery({ queryKey: ["message", parentId], queryFn: () => getMessage(parentId) });

  const replies = useQuery({ queryKey: ["thread", parentId], queryFn: () => listThreadReplies(parentId) });

  const ids = [parentId, ...(replies.data ?? []).map((m) => m.id)];
  const reactions = useQuery({
    queryKey: ["thread-reactions", parentId, ids.length],
    queryFn: () => listReactions(ids),
  });

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["thread", parentId] });
    void qc.invalidateQueries({ queryKey: ["message", parentId] });
    void qc.invalidateQueries({ queryKey: ["messages", channelId] });
    void qc.invalidateQueries({ queryKey: ["thread-reactions", parentId] });
  }

  const reactionsFor = (id: string) => (reactions.data ?? []).filter((r) => r.message_id === id);

  return (
    <aside
      aria-label="Thread"
      className="flex w-full max-w-md flex-col border-l border-border bg-background"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold">Thread</h2>
        <Button
          size="icon"
          variant="ghost"
          className="min-h-11 min-w-11"
          aria-label="Close thread"
          title="Close thread"
          onClick={onClose}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div role="log" aria-live="polite" aria-label="Thread replies" className="space-y-1 p-2">
          {parent.data ? (
            <MessageRow
              message={parent.data}
              reactions={reactionsFor(parent.data.id)}
              meId={meId}
              showThreadButton={false}
              onToggleReaction={async (id, emoji) => {
                await toggleReaction(id, emoji);
                refresh();
              }}
              onEdit={async (id, body) => {
                await editMessage(id, body);
                refresh();
              }}
              onDelete={async (id) => {
                await deleteMessage(id);
                refresh();
              }}
            />
          ) : null}

          <div className="my-2 flex items-center gap-3 px-3 text-xs text-muted-foreground">
            <span>{replies.data?.length ?? 0} replies</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {(replies.data ?? []).map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              reactions={reactionsFor(message.id)}
              meId={meId}
              showThreadButton={false}
              onToggleReaction={async (id, emoji) => {
                await toggleReaction(id, emoji);
                refresh();
              }}
              onEdit={async (id, body) => {
                await editMessage(id, body);
                refresh();
              }}
              onDelete={async (id) => {
                await deleteMessage(id);
                refresh();
              }}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="p-3">
        <Composer
          autoFocus
          placeholder="Reply in thread…"
          onTyping={typing.notifyTyping}
          onStopTyping={typing.stopTyping}
          onSend={async (body) => {
            await sendMessage({ channelId, body, parentMessageId: parentId });
            refresh();
          }}
        />
        <TypingIndicator names={typing.typers} />
      </div>

    </aside>
  );
}
