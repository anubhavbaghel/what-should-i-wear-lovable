import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Sparkles, Loader2, Camera, Check } from "lucide-react";
import { listClothing } from "@/lib/closet.functions";
import { generateTryOn, getProfile } from "@/lib/outfits.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/style")({
  head: () => ({
    meta: [
      { title: "Style — What to Wear Today?" },
      { name: "description", content: "Mix pieces and generate a fresh look on your mannequin." },
    ],
  }),
  component: StylePage,
});

const CATEGORY_GROUPS = [
  { id: "top", label: "Tops" },
  { id: "bottom", label: "Bottoms" },
  { id: "outerwear", label: "Outerwear" },
  { id: "dress", label: "Dresses" },
  { id: "shoes", label: "Shoes" },
  { id: "accessory", label: "Accessories" },
] as const;

const PRESETS = [
  { id: "slim_light", label: "Slim · Light" },
  { id: "slim_medium", label: "Slim · Medium" },
  { id: "slim_dark", label: "Slim · Deep" },
  { id: "neutral_light", label: "Avg · Light" },
  { id: "neutral_medium", label: "Avg · Medium" },
  { id: "neutral_dark", label: "Avg · Deep" },
  { id: "curvy_light", label: "Curvy · Light" },
  { id: "curvy_medium", label: "Curvy · Medium" },
  { id: "curvy_dark", label: "Curvy · Deep" },
] as const;

type Preset = (typeof PRESETS)[number]["id"];

function StylePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchList = useServerFn(listClothing);
  const fetchProfile = useServerFn(getProfile);
  const tryOn = useServerFn(generateTryOn);

  const { data: closet, isLoading } = useQuery({
    queryKey: ["closet"],
    queryFn: () => fetchList(),
  });
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  const [selected, setSelected] = useState<string[]>([]);
  const [preset, setPreset] = useState<Preset>("neutral_medium");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const p = profileData?.profile?.mannequin_preset as Preset | undefined;
    if (p) setPreset(p);
  }, [profileData]);

  const items = closet?.items ?? [];
  const grouped = useMemo(() => {
    const map: Record<string, typeof items> = {};
    for (const it of items) {
      (map[it.category] ??= []).push(it);
    }
    return map;
  }, [items]);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function generate() {
    if (selected.length === 0) {
      toast.error("Pick at least one piece.");
      return;
    }
    setGenerating(true);
    try {
      const { outfit } = await tryOn({
        data: { itemIds: selected, mannequinPreset: preset },
      });
      await qc.invalidateQueries({ queryKey: ["outfits"] });
      toast.success("Look generated ✦");
      navigate({ to: "/outfits/$outfitId", params: { outfitId: outfit.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="px-5 pt-10 pb-40">
      <header>
        <span className="sticker -rotate-2" style={{ background: "var(--sun)" }}>try on</span>
        <h1 className="display mt-3 text-[2.4rem] text-foreground">
          Style a{" "}
          <span className="inline-block rotate-1 rounded-xl border-[1.5px] border-ink px-2" style={{ background: "var(--sun)" }}>
            look
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick pieces, choose your figure, and we'll dress the mannequin for you.
        </p>
      </header>

      {/* Mannequin preset */}
      <section className="mt-7">
        <h2 className="display text-lg text-foreground">Your figure</h2>
        <div className="-mx-5 mt-3 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2 pb-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className="chip shrink-0"
                data-active={preset === p.id}
                type="button"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Item picker */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="display text-lg text-foreground">Pick pieces</h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {selected.length} selected
          </span>
        </div>

        {isLoading ? (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl border-[1.5px] border-ink/20 bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card-pop mt-5 px-6 py-10 text-center" style={{ background: "var(--pink-soft)" }}>
            <p className="text-sm font-semibold text-foreground">No pieces yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Add a few items to start styling.</p>
            <Link to="/closet/add" className="btn-pop mt-5 px-5 py-2.5 text-sm" data-tone="pink">
              <Camera className="h-4 w-4" /> Scan a piece
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {CATEGORY_GROUPS.map((g) => {
              const list = grouped[g.id];
              if (!list?.length) return null;
              return (
                <div key={g.id}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {g.label}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {list.map((it) => {
                      const active = selected.includes(it.id);
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => toggle(it.id)}
                          className={cn(
                            "card-pop relative aspect-square overflow-hidden transition-transform",
                            active && "translate-x-[2px] translate-y-[2px]",
                          )}
                          style={{ background: active ? "var(--mint)" : "var(--card)" }}
                        >
                          <img
                            src={it.cutout_url ?? it.image_url}
                            alt={it.name ?? ""}
                            className="h-full w-full object-cover"
                          />
                          {active && (
                            <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-ink bg-mint text-ink">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sticky generate */}
      {items.length > 0 && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-0 bottom-24 z-30 px-5"
        >
          <div className="mx-auto max-w-md">
            <button
              onClick={generate}
              disabled={generating || selected.length === 0}
              className="btn-pop w-full py-4 text-base disabled:opacity-60"
              data-tone="pink"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Styling…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate look
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
