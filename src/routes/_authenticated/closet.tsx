import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { Plus, Camera } from "lucide-react";
import { listClothing } from "@/lib/closet.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/closet")({
  head: () => ({
    meta: [
      { title: "Closet — What to Wear Today?" },
      { name: "description", content: "All your scanned clothing in one place." },
    ],
  }),
  component: ClosetPage,
});

const FILTERS = [
  { id: "all", label: "All" },
  { id: "top", label: "Tops" },
  { id: "bottom", label: "Bottoms" },
  { id: "outerwear", label: "Outerwear" },
  { id: "dress", label: "Dresses" },
  { id: "shoes", label: "Shoes" },
  { id: "accessory", label: "Accessories" },
] as const;

// Bento span pattern cycled across items to vary tile sizes
const BENTO_PATTERN = [
  "col-span-2 row-span-2", // big square
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-2", // tall
  "col-span-1 row-span-1",
  "col-span-2 row-span-1", // wide
  "col-span-1 row-span-1",
];

const TONES = ["var(--pink-soft)", "var(--mint-soft)", "var(--sun-soft)", "var(--card)"];

function ClosetPage() {
  const fetchList = useServerFn(listClothing);
  const { data, isLoading } = useQuery({
    queryKey: ["closet"],
    queryFn: () => fetchList(),
  });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [greeting, setGreeting] = useState("Hey you");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 5) setGreeting("Up late ✦");
    else if (h < 12) setGreeting("Morning sunshine");
    else if (h < 18) setGreeting("Hey gorgeous");
    else setGreeting("Evening vibes");
  }, []);

  const items = data?.items ?? [];
  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  return (
    <div className="px-5 pt-10 pb-32">
      <header className="flex items-end justify-between gap-3">
        <div>
          <span className="sticker -rotate-2">{greeting}</span>
          <h1 className="display mt-3 text-[2.4rem] text-foreground">
            Your{" "}
            <span className="inline-block rotate-1 rounded-xl border-[1.5px] border-ink px-2" style={{ background: "var(--pink)" }}>
              closet
            </span>
          </h1>
        </div>
        <Link
          to="/closet/add"
          className="btn-pop h-12 w-12 shrink-0 p-0"
          data-tone="sun"
          aria-label="Add clothing"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </Link>
      </header>

      <div className="-mx-5 mt-6 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 pb-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="chip shrink-0"
              data-active={filter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-5">
        {isLoading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <Empty hasAny={items.length > 0} filter={filter} />
        ) : (
          <ul className="grid auto-rows-[110px] grid-cols-3 gap-3">
            {filtered.map((item, i) => {
              const span = BENTO_PATTERN[i % BENTO_PATTERN.length];
              const tone = TONES[i % TONES.length];
              return (
                <motion.li
                  key={item.id}
                  className={cn(span)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                >
                  <Link
                    to="/closet/$itemId"
                    params={{ itemId: item.id }}
                    className="card-pop group flex h-full w-full flex-col overflow-hidden"
                    style={{ background: tone }}
                  >
                    <div className="relative flex-1 overflow-hidden">
                      <img
                        src={item.cutout_url ?? item.image_url}
                        alt={item.name ?? item.category}
                        className="absolute inset-0 h-full w-full object-cover transition-transform group-active:scale-95"
                        loading="lazy"
                      />
                    </div>
                    <div className="border-t-[1.5px] border-ink bg-card px-2.5 py-1.5">
                      <p className="truncate text-[12px] font-semibold text-foreground">
                        {item.name ?? labelForCategory(item.category)}
                      </p>
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function labelForCategory(c: string) {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function Skeleton() {
  return (
    <ul className="grid auto-rows-[110px] grid-cols-3 gap-3">
      {BENTO_PATTERN.map((span, i) => (
        <li
          key={i}
          className={cn("animate-pulse rounded-2xl border-[1.5px] border-ink/20 bg-muted", span)}
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </ul>
  );
}

function Empty({ hasAny, filter }: { hasAny: boolean; filter: string }) {
  if (hasAny) {
    return (
      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">No {filter} items yet.</p>
      </div>
    );
  }
  return (
    <div className="card-pop mt-10 px-6 py-12 text-center" style={{ background: "var(--mint-soft)" }}>
      <span className="sticker rotate-3" style={{ background: "var(--pink)" }}>start here</span>
      <h2 className="display mt-5 text-3xl text-foreground">One piece is all it takes</h2>
      <p className="mx-auto mt-2 max-w-[28ch] text-sm text-muted-foreground">
        Scan a top, those jeans, your fave sneakers — we'll handle the rest.
      </p>
      <Link to="/closet/add" className="btn-pop mt-6 px-6 py-3 text-sm" data-tone="pink">
        <Camera className="h-4 w-4" /> Scan first piece
      </Link>
    </div>
  );
}
