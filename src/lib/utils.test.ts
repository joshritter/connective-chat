import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    const off: string | false = false;
    expect(cn("a", off, undefined, "c")).toBe("a c");
  });

  it("lets later tailwind classes win", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
