import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, Trash2 } from "lucide-react";
import { deleteClothingItem, getClothingItem } from "@/lib/closet.functions";

export const Route = createFileRoute("/_authenticated/closet/$itemId")({
  head: () => ({
    meta: [
      { title: "Item — What to Wear Today?" },
      { name: "description", content: "View a piece in your closet." },
    ],
  }),
  component: ItemPage,
});

function ItemPage() {
  const { itemId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const get = useServerFn(getClothingItem);
  const del = useServerFn(deleteClothingItem);

  const { data, isLoading } = useQuery({
    queryKey: ["clothing-item", itemId],
    queryFn: () => get({ data: { id: itemId } }),
  });

  const item = data?.item;

  async function onDelete() {
    if (!item) return;
    if (!confirm("Remove this piece from your closet?")) return;
    try {
      await del({ data: { id: item.id } });
      await queryClient.invalidateQueries({ queryKey: ["closet"] });
      toast.success("Removed");
      navigate({ to: "/closet" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.");
    }
  }

  return (
    <div className="px-5 pt-10 pb-32">
      <button
        onClick={() => navigate({ to: "/closet" })}
        className="-ml-2 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Closet
      </button>

      {isLoading || !item ? (
        <div className="mt-6 aspect-square animate-pulse rounded-3xl border-[1.5px] border-ink/20 bg-muted" />
      ) : (
        <>
          <div className="card-pop mt-4 overflow-hidden" style={{ background: "var(--pink-soft)" }}>
            <div className="aspect-square">
              <img
                src={item.cutout_url ?? item.image_url}
                alt={item.name ?? ""}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="display text-3xl text-foreground">{item.name}</h1>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {item.color} · {item.category}
              </p>
            </div>
            <span className="sticker rotate-3" style={{ background: "var(--sun)" }}>in closet</span>
          </div>

          <button
            onClick={onDelete}
            className="btn-pop mt-8 w-full py-4 text-sm text-destructive"
            data-tone="paper"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </>
      )}
    </div>
  );
}
