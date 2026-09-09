import { describe, expect, it } from "vitest";
import { channelLabel, initials, type Profile } from "./chat";

const person = (id: string, display_name: string): Profile => ({ id, display_name }) as Profile;

describe("channelLabel", () => {
  it("uses the channel name for regular channels", () => {
    expect(channelLabel({ name: "general", is_dm: false }, [])).toBe("general");
  });

  it("falls back when a channel has no name", () => {
    expect(channelLabel({ name: null, is_dm: false }, [])).toBe("channel");
  });

  it("names the other person in a direct message", () => {
    const members = [person("me", "Josh"), person("them", "Sam")];
    expect(channelLabel({ name: null, is_dm: true }, members, "me")).toBe("Sam");
  });

  it("lists everyone in a group direct message", () => {
    const members = [person("me", "Josh"), person("a", "Sam"), person("b", "Ada")];
    expect(channelLabel({ name: null, is_dm: true }, members, "me")).toBe("Sam, Ada");
  });

  it("says You for a note-to-self conversation", () => {
    expect(channelLabel({ name: null, is_dm: true }, [person("me", "Josh")], "me")).toBe("You");
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
  });

  it("handles a single name", () => {
    expect(initials("Prince")).toBe("P");
  });

  it("ignores anything past the second word", () => {
    expect(initials("Jean Luc Picard")).toBe("JL");
  });

  it("returns an empty string for an empty name", () => {
    expect(initials("")).toBe("");
  });
});
