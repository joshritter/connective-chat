export function TypingIndicator({ names }: { names: string[] }) {
  const label =
    names.length === 0
      ? ""
      : names.length === 1
        ? `${names[0]} is typing`
        : names.length === 2
          ? `${names[0]} and ${names[1]} are typing`
          : `${names[0]}, ${names[1]} and ${names.length - 2} other${names.length - 2 > 1 ? "s" : ""} are typing`;

  return (
    <div
      className="h-5 px-1 pt-1 text-xs text-muted-foreground"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {label ? (
        <span className="inline-flex items-center gap-1">
          <span className="truncate">{label}</span>
          <span className="inline-flex gap-0.5" aria-hidden="true">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="size-1 animate-bounce rounded-full bg-muted-foreground/70"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
        </span>
      ) : null}
    </div>
  );
}
