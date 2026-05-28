import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — What to Wear Today?" },
      { name: "description", content: "Sign in to your wardrobe." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // If already signed in, bounce to the closet (handles return-from-OAuth too).
  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) navigate({ to: "/closet", replace: true });
    });
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/closet", replace: true });
    });
    return () => sub.data.subscription.unsubscribe();
  }, [navigate]);

  async function signInWithGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        console.error(result.error);
        toast.error("Sign-in failed. Please try again.");
        setLoading(false);
        return;
      }
      if (result.redirected) return; // browser is navigating away
      navigate({ to: "/closet", replace: true });
    } catch (e) {
      console.error(e);
      toast.error("Sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 pt-16 pb-10 flex flex-col">
      <header className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-semibold">
          ✦
        </span>
        <span className="text-sm tracking-wide text-muted-foreground">what to wear today?</span>
      </header>

      <section className="mt-20 flex-1">
        <h1 className="display text-5xl leading-[0.95] text-foreground">
          Welcome <em className="italic font-normal text-tomato">in.</em>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Sign in to scan your clothes and start styling looks.
        </p>
      </section>

      <div className="space-y-3">
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full rounded-full bg-foreground py-4 text-base font-medium text-background active:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-3"
        >
          <GoogleMark />
          {loading ? "Opening Google…" : "Continue with Google"}
        </button>
        <p className="text-center text-[11px] text-muted-foreground px-6 leading-relaxed">
          By continuing you agree to keep it cute. We never share your closet.
        </p>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#FFFFFF"
        d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.77 1.45l2.57-2.48C16.7 3.95 14.6 3 12 3 6.99 3 3 7 3 12s3.99 9 9 9c5.2 0 8.62-3.65 8.62-8.78 0-.59-.07-1.04-.27-2.12Z"
      />
    </svg>
  );
}
