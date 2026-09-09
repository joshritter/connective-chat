import { useState, type KeyboardEvent } from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function Composer({
  placeholder,
  onSend,
  autoFocus,
  onTyping,
  onStopTyping,
}: {
  placeholder: string;
  onSend: (body: string) => Promise<void> | void;
  autoFocus?: boolean;
  onTyping?: () => void;
  onStopTyping?: () => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const body = value.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await onSend(body);
      setValue("");
      onStopTyping?.();
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-2 shadow-sm">
      <div className="flex items-end gap-2">
        <Textarea
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (e.target.value.trim()) onTyping?.();
            else onStopTyping?.();
          }}
          onBlur={() => onStopTyping?.()}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          className="min-h-11 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        />

        <Button size="icon" onClick={() => void submit()} disabled={!value.trim() || busy}>
          <SendHorizonal className="size-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}
