import { useId, useState, type KeyboardEvent } from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function Composer({
  placeholder,
  onSend,
  autoFocus,
  onTyping,
  onStopTyping,
  label,
}: {
  placeholder: string;
  onSend: (body: string) => Promise<void> | void;
  autoFocus?: boolean;
  onTyping?: () => void;
  onStopTyping?: () => void;
  label?: string;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const hintId = useId();
  const fieldLabel = label ?? placeholder;

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
          aria-label={fieldLabel}
          aria-describedby={hintId}
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

        <Button
          size="icon"
          className="min-h-11 min-w-11"
          aria-label="Send message"
          title="Send message"
          onClick={() => void submit()}
          disabled={!value.trim() || busy}
        >
          <SendHorizonal className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <p id={hintId} className="sr-only">
        Press Enter to send, Shift plus Enter for a new line.
      </p>
    </div>
  );
}
