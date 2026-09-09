import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, Users, Hash } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hearth — team chat with channels, DMs and threads" },
      { name: "description", content: "Hearth is a fast, focused team chat app: organised channels, private direct messages and tidy threads that keep conversations on track." },
      { property: "og:title", content: "Hearth — team chat with channels, DMs and threads" },
      { property: "og:description", content: "Organised channels, private direct messages and tidy threads for your team." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-dvh bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <span className="font-display text-sm font-semibold uppercase tracking-[0.3em] opacity-70">Hearth</span>
        <h1 className="mt-6 font-display text-5xl font-bold leading-tight">
          Where your team keeps the conversation warm
        </h1>
        <p className="mt-4 max-w-xl text-base opacity-80">
          Channels for every project, direct messages for the quiet chats, and threads so the
          side conversations stay out of the way.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/auth"
            className="rounded-md bg-sidebar-primary px-6 py-3 text-sm font-semibold text-sidebar-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            to="/channels"
            className="rounded-md border border-sidebar-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-sidebar-accent"
          >
            Open the workspace
          </Link>
        </div>

        <ul className="mt-16 grid w-full gap-4 text-left sm:grid-cols-3">
          {[
            { icon: Hash, title: "Channels", copy: "Public or private rooms for every topic." },
            { icon: Users, title: "Direct messages", copy: "One-to-one and small group chats." },
            { icon: MessageSquare, title: "Threads", copy: "Replies stay tucked beside the message." },
          ].map(({ icon: Icon, title, copy }) => (
            <li key={title} className="rounded-xl border border-sidebar-border p-4">
              <Icon className="size-5 opacity-80" aria-hidden="true" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm opacity-70">{copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
