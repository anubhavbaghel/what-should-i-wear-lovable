import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/outfits")({
  head: () => ({
    meta: [
      { title: "Outfits — What to Wear Today?" },
      { name: "description", content: "Your saved looks and collections." },
    ],
  }),
  component: OutfitsPage,
});

function OutfitsPage() {
  return (
    <div className="px-5 pt-10 pb-32">
      <header>
        <span className="sticker -rotate-2" style={{ background: "var(--mint)" }}>saved looks</span>
        <h1 className="display mt-3 text-[2.4rem] text-foreground">
          Your{" "}
          <span className="inline-block -rotate-1 rounded-xl border-[1.5px] border-ink px-2" style={{ background: "var(--mint)" }}>
            outfits
          </span>
        </h1>
      </header>

      <div className="card-pop mt-10 px-6 py-14 text-center" style={{ background: "var(--sun-soft)" }}>
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-ink" style={{ background: "var(--pink)" }}>
          <Heart className="h-5 w-5" strokeWidth={2.4} fill="currentColor" />
        </div>
        <h2 className="display mt-5 text-2xl text-foreground">No outfits yet</h2>
        <p className="mx-auto mt-2 max-w-[28ch] text-sm text-muted-foreground">
          Hop into Style, mix some pieces, and save the looks you'll actually wear.
        </p>
      </div>
    </div>
  );
}
