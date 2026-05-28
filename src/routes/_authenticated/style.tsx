import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/style")({
  head: () => ({
    meta: [
      { title: "Style — What to Wear Today?" },
      { name: "description", content: "Dress a mannequin with your closet." },
    ],
  }),
  component: StylePage,
});

function StylePage() {
  return (
    <div className="px-5 pt-10 pb-32">
      <header>
        <span className="sticker -rotate-2" style={{ background: "var(--sun)" }}>try on</span>
        <h1 className="display mt-3 text-[2.4rem] text-foreground">
          Style a{" "}
          <span className="inline-block rotate-1 rounded-xl border-[1.5px] border-ink px-2" style={{ background: "var(--sun)" }}>
            look
          </span>
        </h1>
      </header>

      <div className="card-pop mt-10 px-6 py-14 text-center" style={{ background: "var(--pink-soft)" }}>
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-ink" style={{ background: "var(--sun)" }}>
          <Sparkles className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <h2 className="display mt-5 text-2xl text-foreground">Coming next</h2>
        <p className="mx-auto mt-2 max-w-[28ch] text-sm text-muted-foreground">
          Pick pieces from your closet, drop them on a stylized mannequin, and we'll generate the look.
        </p>
      </div>
    </div>
  );
}
