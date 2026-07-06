import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isAuthed } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    if (!isAuthed()) {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
