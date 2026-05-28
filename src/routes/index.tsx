import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "What to Wear Today?" },
      {
        name: "description",
        content: "Scan your clothes, dress a mannequin with AI try-on, and save your favorite looks.",
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
      if (!error && data.user) navigate({ to: "/closet", replace: true });
      else setChecking(false);
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
    <main className="relative min-h-screen overflow-hidden bg-background px-6 pb-10 pt-12 flex flex-col">
      <div aria-hidden className="pointer-events-none absolute -top-16 -left-20 h-56 w-56 rounded-full" style={{ background: "var(--mint)" }} />
      <div aria-hidden className="pointer-events-none absolute top-40 -right-10 h-40 w-40 rounded-full" style={{ background: "var(--pink)" }} />

      <header className="relative z-10 flex items-center gap-2">
        <Spark />
        <span className="text-sm font-semibold tracking-tight">what to wear today?</span>
      </header>

      <section className="relative z-10 mt-12 flex-1">
        <span className="sticker -rotate-2">your closet, but fun</span>
        <h1 className="display mt-4 text-[3.4rem] leading-[0.92] text-foreground">
          Get dressed
          <br />
          <span className="inline-block rotate-1 rounded-2xl border-[1.5px] border-ink px-3 py-0.5" style={{ background: "var(--pink)" }}>
            in seconds
          </span>
          <em className="not-italic">.</em>
        </h1>
        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          Scan your clothes with your phone. Mix them on a mannequin. Save the looks you love — no more wardrobe panic.
        </p>

        <ul className="mt-8 space-y-2.5 text-sm">
          <Feature label="Snap a piece — we cut the background" tone="pink" />
          <Feature label="Mix & match on a stylized model" tone="mint" />
          <Feature label="Save outfits to collections you'll actually wear" tone="sun" />
        </ul>
      </section>

      <button
        onClick={() => navigate({ to: "/login" })}
        className="btn-pop relative z-10 mt-8 w-full py-4 text-base"
        data-tone="pink"
      >
        Get started ✦
      </button>
      <p className="relative z-10 mt-3 text-center text-xs text-muted-foreground">
        Free to use. Made for the well-dressed.
      </p>
    </main>
  );
}

function Feature({ label, tone }: { label: string; tone: "pink" | "mint" | "sun" }) {
  const bg = tone === "pink" ? "var(--pink)" : tone === "mint" ? "var(--mint)" : "var(--sun)";
  return (
    <li className="flex items-center gap-3">
      <span className="inline-block h-3 w-3 rounded-full border-[1.5px] border-ink" style={{ background: bg }} />
      <span className="text-foreground">{label}</span>
    </li>
  );
}

function Spark() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-ink bg-card text-[12px] font-bold">
      ✦
    </span>
  );
}
