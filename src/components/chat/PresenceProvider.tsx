import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

export type PresenceState = "online" | "away";

const PresenceContext = createContext<Record<string, PresenceState>>({});

export function usePresence(userId?: string | null): PresenceState | null {
  const map = useContext(PresenceContext);
  if (!userId) return null;
  return map[userId] ?? null;
}

const IDLE_MS = 5 * 60 * 1000;

export function PresenceProvider({ meId, children }: { meId: string | null; children: ReactNode }) {
  const [peers, setPeers] = useState<Record<string, PresenceState>>({});
  const trackRef = useRef<((state: PresenceState) => void) | null>(null);

  useEffect(() => {
    if (!meId) return;

    const channel = supabase.channel("presence:workspace", {
      config: { presence: { key: meId } },
    });

    const sync = () => {
      const raw = channel.presenceState<{ user_id: string; state: PresenceState }>();
      const next: Record<string, PresenceState> = {};
      for (const entries of Object.values(raw)) {
        for (const entry of entries) {
          if (!entry?.user_id) continue;
          if (entry.state === "online" || next[entry.user_id] !== "online") {
            next[entry.user_id] = entry.state === "away" ? "away" : "online";
          }
        }
      }
      setPeers(next);
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.track({ user_id: meId, state: "online" });
        }
      });

    trackRef.current = (state) => {
      void channel.track({ user_id: meId, state });
    };

    return () => {
      trackRef.current = null;
      void supabase.removeChannel(channel);
      setPeers({});
    };
  }, [meId]);

  // Away detection: idle tab or no interaction for a while.
  useEffect(() => {
    if (!meId) return;
    let last = Date.now();
    let current: PresenceState = "online";

    const push = (state: PresenceState) => {
      if (state === current) return;
      current = state;
      trackRef.current?.(state);
    };

    const activity = () => {
      last = Date.now();
      if (document.visibilityState === "visible") push("online");
    };

    const events = ["pointerdown", "keydown", "focus", "visibilitychange"] as const;
    events.forEach((e) => window.addEventListener(e, activity));

    const timer = window.setInterval(() => {
      const idle = Date.now() - last > IDLE_MS || document.visibilityState === "hidden";
      push(idle ? "away" : "online");
    }, 30_000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, activity));
      window.clearInterval(timer);
    };
  }, [meId]);

  const value = useMemo(() => peers, [peers]);

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}
