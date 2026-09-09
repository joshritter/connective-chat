import { createFileRoute, redirect } from "@tanstack/react-router";
import { GENERAL_CHANNEL_ID } from "@/lib/chat";

export const Route = createFileRoute("/_authenticated/channels")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/c/$channelId", params: { channelId: GENERAL_CHANNEL_ID } });
  },
  component: () => null,
});
