import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — What to Wear Today?" },
      { name: "description", content: "Your wardrobe profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email: string | null; name: string | null; avatar: string | null } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setUser({
        email: u.email ?? null,
        name:
          (u.user_metadata?.full_name as string | undefined) ??
          (u.user_metadata?.name as string | undefined) ??
          null,
        avatar: (u.user_metadata?.avatar_url as string | undefined) ?? null,
      });
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="px-5 pt-12 pb-6">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Account</p>
        <h1 className="display mt-1 text-4xl text-foreground">
          Your <em className="italic text-tomato">profile</em>
        </h1>
      </header>

      <section className="mt-8 flex items-center gap-4 rounded-3xl border border-border bg-card p-5">
        <div className="h-14 w-14 overflow-hidden rounded-full bg-muted">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-medium text-muted-foreground">
              {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "·"}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{user?.name ?? "Stylish you"}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email ?? ""}</p>
        </div>
      </section>

      <button
        onClick={signOut}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card py-4 text-sm font-medium text-foreground active:opacity-90"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>

      <p className="mt-10 text-center text-xs text-muted-foreground">✦ what to wear today?</p>
    </div>
  );
}
