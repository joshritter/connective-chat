import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageRow } from "./MessageRow";
import type { Message, Reaction } from "@/lib/chat";

const message = {
  id: "m1",
  channel_id: "c1",
  author_id: "u1",
  parent_message_id: null,
  body: "Hello team",
  created_at: new Date("2026-01-01T10:00:00Z").toISOString(),
  edited_at: null,
  deleted_at: null,
  reply_count: 2,
  author: { id: "u1", display_name: "Ada Lovelace", avatar_url: null },
} as unknown as Message;

const reaction = (profile_id: string): Reaction =>
  ({ id: `r-${profile_id}`, message_id: "m1", profile_id, emoji: "👍" }) as Reaction;

const noop = {
  onToggleReaction: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("MessageRow", () => {
  it("shows the author and body", () => {
    render(<MessageRow message={message} reactions={[]} meId="u2" {...noop} />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Hello team")).toBeInTheDocument();
  });

  it("offers edit and delete only on your own messages", () => {
    const { rerender } = render(
      <MessageRow message={message} reactions={[]} meId="u2" {...noop} />,
    );
    expect(screen.queryByRole("button", { name: /delete your message/i })).not.toBeInTheDocument();
    rerender(<MessageRow message={message} reactions={[]} meId="u1" {...noop} />);
    expect(screen.getByRole("button", { name: /delete your message/i })).toBeInTheDocument();
  });

  it("marks your own reaction as pressed", () => {
    render(<MessageRow message={message} reactions={[reaction("u1")]} meId="u1" {...noop} />);
    expect(screen.getByRole("button", { name: /👍 reaction/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("toggles a reaction when clicked", async () => {
    const user = userEvent.setup();
    const onToggleReaction = vi.fn();
    render(
      <MessageRow
        message={message}
        reactions={[reaction("u2")]}
        meId="u1"
        {...noop}
        onToggleReaction={onToggleReaction}
      />,
    );
    await user.click(screen.getByRole("button", { name: /👍 reaction/i }));
    expect(onToggleReaction).toHaveBeenCalledWith("m1", "👍");
  });

  it("opens the thread from the reply count", async () => {
    const user = userEvent.setup();
    const onOpenThread = vi.fn();
    render(
      <MessageRow
        message={message}
        reactions={[]}
        meId="u2"
        {...noop}
        onOpenThread={onOpenThread}
      />,
    );
    await user.click(screen.getByRole("button", { name: /open thread with 2 replies/i }));
    expect(onOpenThread).toHaveBeenCalled();
  });

  it("hides actions and the body for a deleted message", () => {
    const deleted = { ...message, deleted_at: new Date().toISOString() } as Message;
    render(<MessageRow message={deleted} reactions={[]} meId="u1" {...noop} />);
    expect(screen.getByText("This message was deleted.")).toBeInTheDocument();
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("lets you edit your own message", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<MessageRow message={message} reactions={[]} meId="u1" {...noop} onEdit={onEdit} />);
    await user.click(screen.getByRole("button", { name: /edit your message/i }));
    const box = screen.getByRole("textbox", { name: "Edit your message" });
    await user.clear(box);
    await user.type(box, "Updated");
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onEdit).toHaveBeenCalledWith("m1", "Updated");
  });
});
