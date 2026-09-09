export type EmojiEntry = {
  emoji: string;
  name: string;
  keywords: string[];
};

export type EmojiCategory = {
  id: string;
  label: string;
  emojis: EmojiEntry[];
};

const e = (emoji: string, name: string, ...keywords: string[]): EmojiEntry => ({
  emoji,
  name,
  keywords,
});

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "smileys",
    label: "Smileys",
    emojis: [
      e("😀", "grinning face", "smile", "happy"),
      e("😃", "smiley", "smile", "happy"),
      e("😄", "grinning face with smiling eyes", "happy", "joy"),
      e("😁", "beaming face", "grin", "happy"),
      e("😂", "face with tears of joy", "lol", "laugh", "funny"),
      e("🤣", "rolling on the floor laughing", "rofl", "laugh"),
      e("🙂", "slightly smiling face", "smile"),
      e("😉", "winking face", "wink"),
      e("😊", "smiling face with smiling eyes", "blush", "happy"),
      e("😍", "heart eyes", "love", "crush"),
      e("😘", "face blowing a kiss", "kiss", "love"),
      e("😎", "smiling face with sunglasses", "cool"),
      e("🤔", "thinking face", "hmm", "consider"),
      e("😐", "neutral face", "meh"),
      e("😴", "sleeping face", "tired", "zzz"),
      e("😢", "crying face", "sad", "tear"),
      e("😭", "loudly crying face", "sad", "sob"),
      e("😅", "grinning face with sweat", "phew", "relief"),
      e("😬", "grimacing face", "awkward", "yikes"),
      e("🤯", "mind blown", "exploding head", "wow"),
      e("🥳", "partying face", "celebrate", "party"),
      e("😱", "screaming face", "shock", "scared"),
      e("🙃", "upside down face", "sarcasm", "irony"),
      e("🤗", "hugging face", "hug"),
    ],
  },
  {
    id: "gestures",
    label: "Gestures",
    emojis: [
      e("👍", "thumbs up", "yes", "approve", "+1", "like"),
      e("👎", "thumbs down", "no", "disapprove", "-1"),
      e("👏", "clapping hands", "applause", "bravo"),
      e("🙌", "raising hands", "celebrate", "praise"),
      e("🙏", "folded hands", "thanks", "please", "pray"),
      e("👌", "ok hand", "perfect", "fine"),
      e("🤝", "handshake", "deal", "agree"),
      e("✋", "raised hand", "stop", "high five"),
      e("👋", "waving hand", "hello", "bye"),
      e("💪", "flexed biceps", "strong", "power"),
      e("🤞", "crossed fingers", "luck", "hope"),
      e("✍️", "writing hand", "write", "note"),
      e("👀", "eyes", "look", "watching", "seen"),
      e("🫡", "saluting face", "yes sir", "on it"),
    ],
  },
  {
    id: "hearts",
    label: "Hearts",
    emojis: [
      e("❤️", "red heart", "love"),
      e("🧡", "orange heart", "love"),
      e("💛", "yellow heart", "love"),
      e("💚", "green heart", "love"),
      e("💙", "blue heart", "love"),
      e("💜", "purple heart", "love"),
      e("🖤", "black heart", "love"),
      e("🤍", "white heart", "love"),
      e("💔", "broken heart", "sad", "breakup"),
      e("💕", "two hearts", "love"),
      e("💖", "sparkling heart", "love"),
      e("💯", "hundred points", "perfect", "100", "agree"),
    ],
  },
  {
    id: "animals",
    label: "Animals & nature",
    emojis: [
      e("🐶", "dog face", "puppy", "pet"),
      e("🐱", "cat face", "kitten", "pet"),
      e("🦊", "fox", "animal"),
      e("🐻", "bear", "animal"),
      e("🐼", "panda", "animal"),
      e("🐨", "koala", "animal"),
      e("🦄", "unicorn", "magic"),
      e("🐝", "bee", "bug"),
      e("🐢", "turtle", "slow"),
      e("🐙", "octopus", "sea"),
      e("🌱", "seedling", "plant", "growth"),
      e("🌳", "tree", "nature"),
      e("🌸", "cherry blossom", "flower", "spring"),
      e("🌈", "rainbow", "pride", "colour"),
      e("🔥", "fire", "lit", "hot", "flame"),
      e("⭐", "star", "favourite"),
      e("⚡", "high voltage", "lightning", "fast"),
      e("❄️", "snowflake", "cold", "winter"),
    ],
  },
  {
    id: "food",
    label: "Food & drink",
    emojis: [
      e("🍎", "red apple", "fruit"),
      e("🍌", "banana", "fruit"),
      e("🍓", "strawberry", "fruit"),
      e("🥑", "avocado", "toast"),
      e("🍕", "pizza", "food", "slice"),
      e("🍔", "hamburger", "burger", "food"),
      e("🌮", "taco", "food"),
      e("🍜", "steaming bowl", "noodles", "ramen"),
      e("🍩", "doughnut", "donut", "sweet"),
      e("🍪", "cookie", "biscuit", "sweet"),
      e("🎂", "birthday cake", "cake", "celebrate"),
      e("☕", "hot beverage", "coffee", "tea"),
      e("🍺", "beer", "drink", "cheers"),
      e("🥂", "clinking glasses", "cheers", "celebrate"),
      e("🍾", "bottle with popping cork", "champagne", "celebrate"),
      e("🥤", "cup with straw", "drink", "soda"),
    ],
  },
  {
    id: "activity",
    label: "Activity & travel",
    emojis: [
      e("🎉", "party popper", "celebrate", "tada", "hooray"),
      e("🎊", "confetti ball", "celebrate", "party"),
      e("🏆", "trophy", "win", "award"),
      e("🥇", "first place medal", "gold", "win"),
      e("⚽", "soccer ball", "football", "sport"),
      e("🏀", "basketball", "sport"),
      e("🎮", "video game", "gaming", "controller"),
      e("🎸", "guitar", "music"),
      e("🎧", "headphones", "music", "listen"),
      e("🚀", "rocket", "launch", "ship", "fast"),
      e("✈️", "airplane", "travel", "flight"),
      e("🚗", "car", "drive", "travel"),
      e("🏝️", "desert island", "holiday", "vacation"),
      e("🗺️", "world map", "travel", "plan"),
    ],
  },
  {
    id: "objects",
    label: "Objects",
    emojis: [
      e("💻", "laptop", "computer", "work", "code"),
      e("🖥️", "desktop computer", "screen", "monitor"),
      e("📱", "mobile phone", "phone", "mobile"),
      e("⌨️", "keyboard", "typing"),
      e("📝", "memo", "note", "write"),
      e("📌", "pushpin", "pin", "important"),
      e("📎", "paperclip", "attachment"),
      e("📅", "calendar", "date", "schedule"),
      e("📈", "chart increasing", "growth", "up", "metrics"),
      e("📉", "chart decreasing", "down", "loss"),
      e("💡", "light bulb", "idea", "suggestion"),
      e("🔒", "locked", "secure", "private"),
      e("🔑", "key", "access", "password"),
      e("🛠️", "hammer and wrench", "tools", "fix", "build"),
      e("🐛", "bug", "issue", "defect"),
      e("☑️", "check box with check", "done", "task", "complete"),
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    emojis: [
      e("✅", "check mark button", "done", "yes", "approved"),
      e("❌", "cross mark", "no", "wrong", "fail"),
      e("⚠️", "warning", "caution", "careful"),
      e("❓", "question mark", "question", "help"),
      e("❗", "exclamation mark", "important", "attention"),
      e("➕", "plus", "add", "more"),
      e("➖", "minus", "remove", "less"),
      e("🔁", "repeat", "loop", "again"),
      e("🔔", "bell", "notification", "alert"),
      e("🚫", "prohibited", "no", "blocked"),
      e("♻️", "recycling symbol", "reuse", "green"),
      e("💤", "zzz", "sleep", "idle"),
    ],
  },
];

export const ALL_EMOJI: EmojiEntry[] = EMOJI_CATEGORIES.flatMap((c) => c.emojis);

/** Case-insensitive search across emoji name and keywords. Empty query returns everything. */
export function searchEmoji(query: string, source: EmojiEntry[] = ALL_EMOJI): EmojiEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return source;
  return source.filter(
    (entry) =>
      entry.emoji === q ||
      entry.name.toLowerCase().includes(q) ||
      entry.keywords.some((k) => k.toLowerCase().includes(q)),
  );
}

export function findEmoji(emoji: string): EmojiEntry | undefined {
  return ALL_EMOJI.find((entry) => entry.emoji === emoji);
}

/** Human-readable name for an emoji, falling back to the character itself. */
export function emojiName(emoji: string): string {
  return findEmoji(emoji)?.name ?? emoji;
}

const RECENT_KEY = "hearth:recent-emoji";
const RECENT_LIMIT = 8;

export function readRecentEmoji(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string").slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

export function rememberRecentEmoji(emoji: string): string[] {
  const next = [emoji, ...readRecentEmoji().filter((v) => v !== emoji)].slice(0, RECENT_LIMIT);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Storage can be unavailable (private mode); recents are a nicety, not a requirement.
    }
  }
  return next;
}
