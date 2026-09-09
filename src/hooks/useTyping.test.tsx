import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTyping } from "./useTyping";

vi.mock("@/lib/chat", () => ({
  getMyProfile: vi.fn(async () => ({ id: "me", display_name: "Josh" })),
}));

type Handler = (msg: { payload: unknown }) => void;

function fakeChannel() {
  const handlers = new Map<string, Handler>();
  const send = vi.fn();
  return {
    handlers,
    send,
    channel: {
      // Real implementation is installed in beforeEach so it can return itself.
      on: vi.fn(),
      subscribe: vi.fn(),
      send,
    },
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

let fake: ReturnType<typeof fakeChannel>;

beforeEach(() => {
  fake = fakeChannel();
  fake.channel.on.mockImplementation((_t: string, opts: { event: string }, cb: Handler) => {
    fake.handlers.set(opts.event, cb);
    return fake.channel;
  });
  vi.mocked(supabase.channel).mockReturnValue(fake.channel as never);
});

describe("useTyping", () => {
  it("starts with nobody typing", () => {
    const { result } = renderHook(() => useTyping("c1", "me"), { wrapper });
    expect(result.current.typers).toEqual([]);
  });

  it("lists someone else who is typing", async () => {
    const { result } = renderHook(() => useTyping("c1", "me"), { wrapper });
    act(() => {
      fake.handlers.get("typing")?.({ payload: { user_id: "u2", display_name: "Sam" } });
    });
    await waitFor(() => expect(result.current.typers).toEqual(["Sam"]));
  });

  it("ignores your own typing events", async () => {
    const { result } = renderHook(() => useTyping("c1", "me"), { wrapper });
    act(() => {
      fake.handlers.get("typing")?.({ payload: { user_id: "me", display_name: "Josh" } });
    });
    expect(result.current.typers).toEqual([]);
  });

  it("removes someone after a stop event", async () => {
    const { result } = renderHook(() => useTyping("c1", "me"), { wrapper });
    act(() => {
      fake.handlers.get("typing")?.({ payload: { user_id: "u2", display_name: "Sam" } });
    });
    await waitFor(() => expect(result.current.typers).toEqual(["Sam"]));
    act(() => {
      fake.handlers.get("stop")?.({ payload: { user_id: "u2", display_name: "Sam" } });
    });
    await waitFor(() => expect(result.current.typers).toEqual([]));
  });

  it("throttles repeated typing broadcasts", async () => {
    const { result } = renderHook(() => useTyping("c1", "me"), { wrapper });
    await waitFor(() => expect(supabase.channel).toHaveBeenCalled());
    act(() => {
      result.current.notifyTyping();
      result.current.notifyTyping();
      result.current.notifyTyping();
    });
    const typingSends = fake.send.mock.calls.filter((c) => c[0]?.event === "typing");
    expect(typingSends).toHaveLength(1);
  });

  it("always broadcasts a stop event", async () => {
    const { result } = renderHook(() => useTyping("c1", "me"), { wrapper });
    await waitFor(() => expect(supabase.channel).toHaveBeenCalled());
    act(() => {
      result.current.stopTyping();
    });
    expect(fake.send.mock.calls.some((c) => c[0]?.event === "stop")).toBe(true);
  });

  it("does nothing when there is no signed-in user", () => {
    const { result } = renderHook(() => useTyping("c1", null), { wrapper });
    act(() => {
      result.current.notifyTyping();
    });
    expect(fake.send).not.toHaveBeenCalled();
  });
});
