import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, Trash2, Download } from "lucide-react";
import { deleteOutfit, getOutfit } from "@/lib/outfits.functions";

export const Route = createFileRoute("/_authenticated/outfits/$outfitId")({
  head: () => ({
    meta: [
      { title: "Look — What to Wear Today?" },
      { name: "description", content: "View this saved outfit." },
    ],
  }),
  component: OutfitDetail,
});

function OutfitDetail() {
  const { outfitId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getOutfit);
  const del = useServerFn(deleteOutfit);

  const { data, isLoading } = useQuery({
    queryKey: ["outfit", outfitId],
    queryFn: () => get({ data: { id: outfitId } }),
  });

  const outfit = data?.outfit;
  const items = data?.items ?? [];

  async function onDelete() {
    if (!confirm("Delete this look?")) return;
    try {
      await del({ data: { id: outfitId } });
      await qc.invalidateQueries({ queryKey: ["outfits"] });
      toast.success("Deleted");
      navigate({ to: "/outfits" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete.");
    }
  }

  return (
    <div className="px-5 pt-10 pb-32">
      <button
        onClick={() => navigate({ to: "/outfits" })}
        className="-ml-2 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Outfits
      </button>

      {isLoading || !outfit ? (
        <div className="mt-6 aspect-[3/4] animate-pulse rounded-3xl border-[1.5px] border-ink/20 bg-muted" />
      ) : (
        <>
          <div className="card-pop mt-4 overflow-hidden" style={{ background: "var(--mint-soft)" }}>
            <div className="aspect-[3/4]">
              {outfit.generated_image_url ? (
                <img src={outfit.generated_image_url} alt={outfit.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  No preview
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="display text-3xl text-foreground">{outfit.name}</h1>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {items.length} {items.length === 1 ? "piece" : "pieces"}
              </p>
            </div>
            <span className="sticker rotate-3" style={{ background: "var(--sun)" }}>saved</span>
          </div>

          {items.length > 0 && (
            <section className="mt-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Pieces in this look
              </p>
              <div className="grid grid-cols-4 gap-2">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="aspect-square overflow-hidden rounded-xl border-[1.5px] border-ink bg-card"
                  >
                    <img
                      src={it.cutout_url ?? it.image_url}
                      alt={it.name ?? ""}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-8 flex gap-3">
            {outfit.generated_image_url && (
              <a
                href={outfit.generated_image_url}
                target="_blank"
                rel="noreferrer"
                className="btn-pop flex-1 py-4 text-sm"
                data-tone="paper"
              >
                <Download className="h-4 w-4" /> Open
              </a>
            )}
            <button
              onClick={onDelete}
              className="btn-pop flex-1 py-4 text-sm text-destructive"
              data-tone="paper"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
