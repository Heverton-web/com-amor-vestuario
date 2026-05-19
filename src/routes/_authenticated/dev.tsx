import { createFileRoute } from "@tanstack/react-router";
import { DevConsoleDashboard } from "@/features/desenvolvedor";

export const Route = createFileRoute("/_authenticated/dev")({
  component: () => <DevConsoleDashboard />,
});
