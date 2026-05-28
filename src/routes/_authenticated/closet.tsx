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

function ClosetPage() {
  const fetchList = useServerFn(listClothing);
  const { data, isLoading } = useQuery({
    queryKey: ["closet"],
    queryFn: () => fetchList(),
  });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [greeting, setGreeting] = useState("Your closet");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 5) setGreeting("Up late");
    else if (h < 12) setGreeting("Good morning");
    else if (h < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const items = data?.items ?? [];
  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  return (
    <div className="px-5 pt-12 pb-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{greeting}</p>
          <h1 className="display mt-1 text-4xl text-foreground">
            Your <em className="italic text-tomato">closet</em>
          </h1>
        </div>
        <Link
          to="/closet/add"
          className="group inline-flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background active:scale-95 transition-transform"
          aria-label="Add clothing"
        >
          <Plus className="h-5 w-5" />
        </Link>
      </header>

      <div className="-mx-5 mt-6 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="chip"
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
          <ul className="grid grid-cols-2 gap-3">
            {filtered.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
              >
                <Link
                  to="/closet/$itemId"
                  params={{ itemId: item.id }}
                  className={cn(
                    "block overflow-hidden rounded-2xl border border-border bg-card",
                  )}
                >
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <img
                      src={item.cutout_url ?? item.image_url}
                      alt={item.name ?? item.category}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {item.name ?? labelForCategory(item.category)}
                    </p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {item.color ?? labelForCategory(item.category)}
                    </p>
                  </div>
                </Link>
              </motion.li>
            ))}
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
    <ul className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="aspect-[3/4] animate-pulse rounded-2xl bg-muted"
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
    <div className="mt-12 rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <Camera className="mx-auto h-7 w-7 text-foreground" strokeWidth={1.6} />
      <h2 className="display mt-4 text-2xl text-foreground">Start with one piece</h2>
      <p className="mx-auto mt-2 max-w-[26ch] text-sm text-muted-foreground">
        Scan a top, a pair of jeans, those sneakers — we'll do the rest.
      </p>
      <Link
        to="/closet/add"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background"
      >
        <Camera className="h-4 w-4" /> Scan first piece
      </Link>
    </div>
  );
}
