import { beforeEach, describe, expect, it } from "vitest";
import {
  ALL_EMOJI,
  EMOJI_CATEGORIES,
  emojiName,
  findEmoji,
  readRecentEmoji,
  rememberRecentEmoji,
  searchEmoji,
} from "./emoji";

describe("emoji data", () => {
  it("has non-empty categories with unique emoji per category", () => {
    expect(EMOJI_CATEGORIES.length).toBeGreaterThan(4);
    for (const category of EMOJI_CATEGORIES) {
      expect(category.emojis.length).toBeGreaterThan(0);
      const chars = category.emojis.map((entry) => entry.emoji);
      expect(new Set(chars).size).toBe(chars.length);
    }
  });

  it("gives every emoji an accessible name", () => {
    for (const entry of ALL_EMOJI) {
      expect(entry.name.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("searchEmoji", () => {
  it("returns everything for an empty query", () => {
    expect(searchEmoji("")).toHaveLength(ALL_EMOJI.length);
    expect(searchEmoji("   ")).toHaveLength(ALL_EMOJI.length);
  });

  it("matches on name", () => {
    const results = searchEmoji("rocket");
    expect(results.map((r) => r.emoji)).toContain("🚀");
  });

  it("matches on keyword and is case-insensitive", () => {
    expect(searchEmoji("LOL").map((r) => r.emoji)).toContain("😂");
    expect(searchEmoji("+1").map((r) => r.emoji)).toContain("👍");
  });

  it("returns nothing for an unknown term", () => {
    expect(searchEmoji("zzzzzznope")).toEqual([]);
  });
});

describe("findEmoji / emojiName", () => {
  it("finds a known emoji and names it", () => {
    expect(findEmoji("🎉")?.name).toBe("party popper");
    expect(emojiName("🎉")).toBe("party popper");
  });

  it("falls back to the character for unknown emoji", () => {
    expect(findEmoji("🫥")).toBeUndefined();
    expect(emojiName("🫥")).toBe("🫥");
  });
});

describe("recent emoji", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty", () => {
    expect(readRecentEmoji()).toEqual([]);
  });

  it("stores most recent first without duplicates", () => {
    rememberRecentEmoji("👍");
    rememberRecentEmoji("🎉");
    rememberRecentEmoji("👍");
    expect(readRecentEmoji()).toEqual(["👍", "🎉"]);
  });

  it("caps the list at eight entries", () => {
    for (const entry of ALL_EMOJI.slice(0, 12)) rememberRecentEmoji(entry.emoji);
    expect(readRecentEmoji()).toHaveLength(8);
  });

  it("ignores corrupt stored data", () => {
    window.localStorage.setItem("hearth:recent-emoji", "{not json");
    expect(readRecentEmoji()).toEqual([]);
    window.localStorage.setItem("hearth:recent-emoji", '{"a":1}');
    expect(readRecentEmoji()).toEqual([]);
  });
});
