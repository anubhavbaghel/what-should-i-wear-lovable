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
    <div className="px-5 pt-12 pb-6">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Saved looks</p>
        <h1 className="display mt-1 text-4xl text-foreground">
          Your <em className="italic text-tomato">outfits</em>
        </h1>
      </header>

      <div className="mt-10 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <Heart className="mx-auto h-7 w-7 text-foreground" strokeWidth={1.6} />
        <h2 className="display mt-4 text-2xl text-foreground">No outfits yet</h2>
        <p className="mx-auto mt-2 max-w-[28ch] text-sm text-muted-foreground">
          Style a look in the Style tab — save the ones you'll actually wear.
        </p>
      </div>
    </div>
  );
}
