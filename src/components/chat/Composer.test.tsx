import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Composer } from "./Composer";

describe("Composer", () => {
  it("labels the message box for screen readers", () => {
    render(<Composer placeholder="Message #general" onSend={vi.fn()} />);
    expect(screen.getByLabelText("Message #general")).toBeInTheDocument();
  });

  it("keeps send disabled until there is text", async () => {
    const user = userEvent.setup();
    render(<Composer placeholder="Message #general" onSend={vi.fn()} />);
    const send = screen.getByRole("button", { name: "Send message" });
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText("Message #general"), "hello");
    expect(send).toBeEnabled();
  });

  it("sends on Enter and clears the box", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Composer placeholder="Message #general" onSend={onSend} />);
    const box = screen.getByLabelText("Message #general");
    await user.type(box, "hello{Enter}");
    expect(onSend).toHaveBeenCalledWith("hello");
    expect(box).toHaveValue("");
  });

  it("adds a new line with Shift+Enter instead of sending", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Composer placeholder="Message #general" onSend={onSend} />);
    await user.type(screen.getByLabelText("Message #general"), "one{Shift>}{Enter}{/Shift}two");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("reports typing and stops when the box is emptied", async () => {
    const user = userEvent.setup();
    const onTyping = vi.fn();
    const onStopTyping = vi.fn();
    render(
      <Composer
        placeholder="Message #general"
        onSend={vi.fn()}
        onTyping={onTyping}
        onStopTyping={onStopTyping}
      />,
    );
    const box = screen.getByLabelText("Message #general");
    await user.type(box, "hi");
    expect(onTyping).toHaveBeenCalled();
    await user.clear(box);
    expect(onStopTyping).toHaveBeenCalled();
  });
});
