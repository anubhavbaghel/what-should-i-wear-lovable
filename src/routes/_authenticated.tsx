import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BottomTabBar } from "@/components/BottomTabBar";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // Wait for session hydration; redirect anonymous visitors.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href } as never,
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  );
}
