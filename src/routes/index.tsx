import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "What to Wear Today?" },
      {
        name: "description",
        content:
          "Scan your clothes, dress a mannequin with AI try-on, and save your favorite looks.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data.user) {
        navigate({ to: "/closet", replace: true });
      } else {
        setChecking(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spark />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 pb-12 pt-16 flex flex-col">
      <header className="flex items-center gap-2">
        <Spark />
        <span className="text-sm tracking-wide text-muted-foreground">what to wear today?</span>
      </header>

      <section className="mt-16 flex-1">
        <h1 className="display text-[3.25rem] leading-[0.95] text-foreground">
          Your closet, <em className="italic font-normal text-tomato">styled.</em>
        </h1>
        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          Scan your clothes with your phone. Dress a mannequin. Save the looks you love. No more
          standing in front of the mirror.
        </p>

        <ul className="mt-10 space-y-3 text-sm">
          <Feature label="Snap a piece — we cut out the background" />
          <Feature label="Mix and match on a stylized model" />
          <Feature label="Save outfits into collections you'll actually use" />
        </ul>
      </section>

      <button
        onClick={() => navigate({ to: "/login" })}
        className="mt-10 w-full rounded-full bg-foreground py-4 text-base font-medium text-background active:opacity-90"
      >
        Get started
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Free to use. Made for the well-dressed.
      </p>
    </main>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-tomato" />
      <span className="text-foreground">{label}</span>
    </li>
  );
}

function Spark() {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-semibold">
      ✦
    </span>
  );
}
