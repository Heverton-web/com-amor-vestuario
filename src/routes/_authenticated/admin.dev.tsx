import { createFileRoute } from "@tanstack/react-router";
import { DevConsoleDashboard } from "@/features/desenvolvedor";

export const Route = createFileRoute("/_authenticated/admin/dev")({
  component: () => <DevConsoleDashboard />,
});
