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
    <div className="px-5 pt-12 pb-6">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Try on</p>
        <h1 className="display mt-1 text-4xl text-foreground">
          Style a <em className="italic text-tomato">look</em>
        </h1>
      </header>

      <div className="mt-10 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <Sparkles className="mx-auto h-7 w-7 text-foreground" strokeWidth={1.6} />
        <h2 className="display mt-4 text-2xl text-foreground">Coming next</h2>
        <p className="mx-auto mt-2 max-w-[28ch] text-sm text-muted-foreground">
          Pick pieces from your closet, drop them on a stylized mannequin, and we'll generate the
          look.
        </p>
      </div>
    </div>
  );
}
