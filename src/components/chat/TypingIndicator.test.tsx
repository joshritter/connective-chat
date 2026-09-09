import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TypingIndicator } from "./TypingIndicator";

describe("TypingIndicator", () => {
  it("renders nothing readable when nobody is typing", () => {
    render(<TypingIndicator names={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("announces a single typist", () => {
    render(<TypingIndicator names={["Sam"]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Sam is typing");
  });

  it("announces two typists", () => {
    render(<TypingIndicator names={["Sam", "Ada"]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Sam and Ada are typing");
  });

  it("summarises three or more typists", () => {
    render(<TypingIndicator names={["Sam", "Ada", "Josh", "Kim"]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Sam, Ada and 2 others are typing");
  });

  it("is a polite live region so it never interrupts", () => {
    render(<TypingIndicator names={["Sam"]} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
