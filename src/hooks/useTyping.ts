import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/chat";

type TypingPayload = { user_id: string; display_name: string };

const THROTTLE_MS = 2000;
const EXPIRY_MS = 4000;

export function useTyping(scopeKey: string, meId: string | null) {
  const [typers, setTypers] = useState<string[]>([]);
  const entries = useRef<Map<string, { name: string; at: number }>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSent = useRef(0);

  const me = useQuery({ queryKey: ["myProfile"], queryFn: getMyProfile });
  const myName = me.data?.display_name ?? "Someone";

  const render = useCallback(() => {
    const now = Date.now();
    let changed = false;
    for (const [id, entry] of entries.current) {
      if (now - entry.at > EXPIRY_MS) {
        entries.current.delete(id);
        changed = true;
      }
    }
    const names = [...entries.current.values()].map((e) => e.name);
    setTypers((prev) =>
      changed || prev.length !== names.length || prev.some((n, i) => n !== names[i]) ? names : prev,
    );
  }, []);

  useEffect(() => {
    if (!meId) return;
    entries.current.clear();
    setTypers([]);

    const channel = supabase.channel(`typing:${scopeKey}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const p = payload as TypingPayload;
        if (!p?.user_id || p.user_id === meId) return;
        entries.current.set(p.user_id, { name: p.display_name, at: Date.now() });
        render();
      })
      .on("broadcast", { event: "stop" }, ({ payload }) => {
        const p = payload as TypingPayload;
        if (!p?.user_id) return;
        entries.current.delete(p.user_id);
        render();
      })
      .subscribe();

    channelRef.current = channel;
    const timer = window.setInterval(render, 1000);

    return () => {
      window.clearInterval(timer);
      channelRef.current = null;
      void supabase.removeChannel(channel);
      entries.current.clear();
      setTypers([]);
    };
  }, [scopeKey, meId, render]);

  const notifyTyping = useCallback(() => {
    if (!meId) return;
    const now = Date.now();
    if (now - lastSent.current < THROTTLE_MS) return;
    lastSent.current = now;
    void channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: meId, display_name: myName } satisfies TypingPayload,
    });
  }, [meId, myName]);

  const stopTyping = useCallback(() => {
    if (!meId) return;
    lastSent.current = 0;
    void channelRef.current?.send({
      type: "broadcast",
      event: "stop",
      payload: { user_id: meId, display_name: myName } satisfies TypingPayload,
    });
  }, [meId, myName]);

  return { typers, notifyTyping, stopTyping };
}
