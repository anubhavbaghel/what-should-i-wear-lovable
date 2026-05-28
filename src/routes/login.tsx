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
      if (result.redirected) return;
      navigate({ to: "/closet", replace: true });
    } catch (e) {
      console.error(e);
      toast.error("Sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-6 pt-12 pb-10 flex flex-col">
      {/* Playful color blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full"
        style={{ background: "var(--pink)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-32 -left-20 h-44 w-44 rounded-full"
        style={{ background: "var(--mint)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-44 right-6 h-24 w-24 rounded-full"
        style={{ background: "var(--sun)" }}
      />

      <header className="relative z-10 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-ink bg-card text-[12px] font-bold">
          ✦
        </span>
        <span className="text-sm font-semibold tracking-tight">what to wear today?</span>
      </header>

      <section className="relative z-10 mt-16 flex-1">
        <span className="sticker -rotate-3">new fit, who dis</span>
        <h1 className="display mt-4 text-[3.5rem] leading-[0.9] text-foreground">
          Hi <span className="inline-block -rotate-2 rounded-2xl border-[1.5px] border-ink bg-card px-3 py-0.5" style={{ background: "var(--sun)" }}>cutie</span>
          <br />
          dress <em className="not-italic" style={{ color: "var(--pink)" }}>up.</em>
        </h1>
        <p className="mt-5 max-w-[28ch] text-[15px] leading-relaxed text-muted-foreground">
          Scan your closet, mix looks on a mannequin, save the fits you love.
        </p>
      </section>

      <div className="relative z-10 space-y-3">
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="btn-pop w-full py-4 text-base disabled:opacity-60"
          data-tone="paper"
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
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
