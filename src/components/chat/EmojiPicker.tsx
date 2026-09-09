import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  EMOJI_CATEGORIES,
  readRecentEmoji,
  rememberRecentEmoji,
  searchEmoji,
  findEmoji,
  type EmojiEntry,
} from "@/lib/emoji";
import { cn } from "@/lib/utils";

const COLUMNS = 8;

export function EmojiPicker({
  trigger,
  onSelect,
  open,
  onOpenChange,
}: {
  trigger: ReactNode;
  onSelect: (emoji: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = open ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const searchId = useId();

  useEffect(() => {
    if (isOpen) setRecent(readRecentEmoji());
  }, [isOpen]);

  const sections = useMemo(() => {
    if (query.trim()) {
      return [{ id: "results", label: "Search results", emojis: searchEmoji(query) }];
    }
    const recentEntries = recent
      .map((emoji) => findEmoji(emoji) ?? { emoji, name: emoji, keywords: [] })
      .filter(Boolean) as EmojiEntry[];
    return [
      ...(recentEntries.length
        ? [{ id: "recent", label: "Recently used", emojis: recentEntries }]
        : []),
      ...EMOJI_CATEGORIES,
    ];
  }, [query, recent]);

  const total = sections.reduce((n, s) => n + s.emojis.length, 0);

  function choose(emoji: string) {
    setRecent(rememberRecentEmoji(emoji));
    onSelect(emoji);
    setQuery("");
    setOpen(false);
  }

  // Arrow keys move across the emoji grid, like a native picker.
  function onGridKeyDown(event: KeyboardEvent<HTMLElement>) {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const buttons = Array.from(
      gridRef.current?.querySelectorAll<HTMLButtonElement>("button[data-emoji]") ?? [],
    );
    if (buttons.length === 0) return;
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) {
      event.preventDefault();
      buttons[0]?.focus();
      return;
    }
    const step =
      event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowLeft"
          ? -1
          : event.key === "ArrowDown"
            ? COLUMNS
            : event.key === "ArrowUp"
              ? -COLUMNS
              : 0;
    let next = current + step;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = buttons.length - 1;
    if (next < 0 || next >= buttons.length) return;
    event.preventDefault();
    buttons[next]?.focus();
  }

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-2"
        aria-label="Emoji picker"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const input = document.getElementById(searchId) as HTMLInputElement | null;
          input?.focus();
        }}
      >
        <label htmlFor={searchId} className="sr-only">
          Search emoji
        </label>
        <Input
          id={searchId}
          type="search"
          value={query}
          placeholder="Search emoji"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              gridRef.current?.querySelector<HTMLButtonElement>("button[data-emoji]")?.focus();
            }
          }}
        />

        <div
          ref={gridRef}
          className="mt-2 max-h-64 overflow-y-auto pr-1"
          role="group"
          aria-label="Emoji"
        >
          {total === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No emoji match “{query.trim()}”.
            </p>
          ) : null}

          {sections.map((section) =>
            section.emojis.length ? (
              <section key={section.id} aria-labelledby={`${searchId}-${section.id}`}>
                <h3
                  id={`${searchId}-${section.id}`}
                  className="sticky top-0 bg-popover px-1 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {section.label}
                </h3>
                <div className="grid grid-cols-8 gap-0.5 pb-2">
                  {section.emojis.map((entry) => (
                    <button
                      key={`${section.id}-${entry.emoji}`}
                      type="button"
                      data-emoji={entry.emoji}
                      aria-label={entry.name}
                      title={entry.name}
                      onClick={() => choose(entry.emoji)}
                      onKeyDown={onGridKeyDown}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-md text-lg transition-colors",
                        "hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                    >
                      <span aria-hidden="true">{entry.emoji}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
