import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { Heart, Sparkles } from "lucide-react";
import { listOutfits } from "@/lib/outfits.functions";

export const Route = createFileRoute("/_authenticated/outfits")({
  head: () => ({
    meta: [
      { title: "Outfits — What to Wear Today?" },
      { name: "description", content: "Your saved looks and collections." },
    ],
  }),
  component: OutfitsPage,
});

const TONES = ["var(--pink-soft)", "var(--mint-soft)", "var(--sun-soft)"];

function OutfitsPage() {
  const fetchList = useServerFn(listOutfits);
  const { data, isLoading } = useQuery({
    queryKey: ["outfits"],
    queryFn: () => fetchList(),
  });
  const outfits = data?.outfits ?? [];

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

      {isLoading ? (
        <ul className="mt-6 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <li key={i} className="aspect-[3/4] animate-pulse rounded-2xl border-[1.5px] border-ink/20 bg-muted" />
          ))}
        </ul>
      ) : outfits.length === 0 ? (
        <div className="card-pop mt-10 px-6 py-12 text-center" style={{ background: "var(--sun-soft)" }}>
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-ink" style={{ background: "var(--pink)" }}>
            <Heart className="h-5 w-5" strokeWidth={2.4} fill="currentColor" />
          </div>
          <h2 className="display mt-5 text-2xl text-foreground">No outfits yet</h2>
          <p className="mx-auto mt-2 max-w-[28ch] text-sm text-muted-foreground">
            Hop into Style, mix some pieces, and save the looks you'll actually wear.
          </p>
          <Link to="/style" className="btn-pop mt-6 px-5 py-2.5 text-sm" data-tone="pink">
            <Sparkles className="h-4 w-4" /> Style a look
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3">
          {outfits.map((o, i) => (
            <motion.li
              key={o.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                to="/outfits/$outfitId"
                params={{ outfitId: o.id }}
                className="card-pop block overflow-hidden"
                style={{ background: TONES[i % TONES.length] }}
              >
                <div className="aspect-[3/4]">
                  {o.generated_image_url ? (
                    <img src={o.generated_image_url} alt={o.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No preview
                    </div>
                  )}
                </div>
                <div className="border-t-[1.5px] border-ink bg-card px-3 py-2">
                  <p className="truncate text-sm font-semibold text-foreground">{o.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {o.item_ids.length} {o.item_ids.length === 1 ? "piece" : "pieces"}
                  </p>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
