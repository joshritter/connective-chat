import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmojiPicker } from "./EmojiPicker";
import { readRecentEmoji } from "@/lib/emoji";

function setup(onSelect = vi.fn()) {
  render(
    <EmojiPicker trigger={<button type="button">Add a reaction</button>} onSelect={onSelect} />,
  );
  return { onSelect, user: userEvent.setup() };
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Add a reaction" }));
  return screen.findByRole("searchbox", { name: "Search emoji" });
}

describe("EmojiPicker", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("opens on the trigger and focuses the search box", async () => {
    const { user } = setup();
    const search = await openPicker(user);
    expect(search).toHaveFocus();
  });

  it("labels every emoji for screen readers", async () => {
    const { user } = setup();
    await openPicker(user);
    expect(screen.getByRole("button", { name: "rocket" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "party popper" })).toBeInTheDocument();
  });

  it("filters as you search", async () => {
    const { user } = setup();
    const search = await openPicker(user);
    await user.type(search, "rocket");
    expect(screen.getByRole("button", { name: "rocket" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "party popper" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Search results" })).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const { user } = setup();
    const search = await openPicker(user);
    await user.type(search, "zzzzzznope");
    expect(screen.getByText(/No emoji match/)).toBeInTheDocument();
  });

  it("reports the chosen emoji and closes", async () => {
    const { user, onSelect } = setup();
    await openPicker(user);
    await user.click(screen.getByRole("button", { name: "rocket" }));
    expect(onSelect).toHaveBeenCalledWith("🚀");
    expect(screen.queryByRole("searchbox", { name: "Search emoji" })).not.toBeInTheDocument();
  });

  it("remembers recently used emoji", async () => {
    const { user } = setup();
    await openPicker(user);
    await user.click(screen.getByRole("button", { name: "rocket" }));
    expect(readRecentEmoji()).toEqual(["🚀"]);

    await openPicker(user);
    expect(screen.getByRole("heading", { name: "Recently used" })).toBeInTheDocument();
  });

  it("moves focus into the grid with the down arrow", async () => {
    const { user } = setup();
    const search = await openPicker(user);
    await user.type(search, "{ArrowDown}");
    const first = screen.getAllByRole("button", { name: /face|hand|heart|rocket|grinning/i })[0];
    expect(document.activeElement).toHaveAttribute("data-emoji");
    expect(first).toBeInTheDocument();
  });

  it("moves between emoji with the right arrow", async () => {
    const { user } = setup();
    const search = await openPicker(user);
    await user.type(search, "{ArrowDown}");
    const firstEmoji = (document.activeElement as HTMLElement).dataset["emoji"];
    await user.keyboard("{ArrowRight}");
    expect((document.activeElement as HTMLElement).dataset["emoji"]).not.toBe(firstEmoji);
  });
});
