import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Supabase is never called for real in unit tests.
vi.mock("@/integrations/supabase/client", () => {
  const chain: Record<string, unknown> = {};
  const proxy: unknown = new Proxy(chain, {
    get: () => () => proxy,
  });
  return {
    supabase: {
      from: () => proxy,
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
        getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
        signOut: vi.fn(async () => ({ error: null })),
      },
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        track: vi.fn(),
        send: vi.fn(),
        presenceState: vi.fn(() => ({})),
      })),
      removeChannel: vi.fn(),
    },
  };
});

afterEach(() => {
  cleanup();
});
