import { useEffect } from "react";
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/outfits.functions";
import { BottomTabBar } from "@/components/BottomTabBar";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
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

// Paths that should NOT trigger the onboarding redirect (user is mid-flow there).
const ONBOARDING_BYPASS = ["/onboarding"];

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchProfile = useServerFn(getProfile);

  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
    staleTime: 60_000,
  });

  useEffect(() => {
    const profile = data?.profile;
    if (!profile) return;
    if (!profile.onboarded_at && !ONBOARDING_BYPASS.includes(pathname)) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [data, pathname, navigate]);

  const hideTabBar = pathname === "/onboarding";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        <Outlet />
      </div>
      {!hideTabBar && <BottomTabBar />}
    </div>
  );
}
