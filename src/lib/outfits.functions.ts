import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_BASE = "https://ai.gateway.lovable.dev/v1";

function aiKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured.");
  return key;
}

const MANNEQUIN_PRESETS = [
  "neutral_light",
  "neutral_medium",
  "neutral_dark",
  "curvy_light",
  "curvy_medium",
  "curvy_dark",
  "slim_light",
  "slim_medium",
  "slim_dark",
] as const;

type MannequinPreset = (typeof MANNEQUIN_PRESETS)[number];

function describePreset(p: MannequinPreset): string {
  const [build, skin] = p.split("_") as [string, string];
  const buildMap: Record<string, string> = {
    slim: "slim",
    neutral: "average build",
    curvy: "curvy",
  };
  const skinMap: Record<string, string> = {
    light: "light skin tone",
    medium: "medium skin tone",
    dark: "deep skin tone",
  };
  return `${buildMap[build] ?? build}, ${skinMap[skin] ?? skin}`;
}

/* ============ List outfits ============ */
export const listOutfits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("outfits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { outfits: data ?? [] };
  });

/* ============ Get one outfit (with its items) ============ */
export const getOutfit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: outfit, error } = await supabase
      .from("outfits")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);

    let items: Array<{
      id: string;
      name: string | null;
      category: string;
      image_url: string;
      cutout_url: string | null;
    }> = [];
    if (outfit.item_ids?.length) {
      const { data: rows, error: e2 } = await supabase
        .from("clothing_items")
        .select("id,name,category,image_url,cutout_url")
        .in("id", outfit.item_ids)
        .eq("user_id", userId);
      if (e2) throw new Error(e2.message);
      items = rows ?? [];
    }
    return { outfit, items };
  });

/* ============ Delete outfit ============ */
export const deleteOutfit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("outfits")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Rename outfit ============ */
export const renameOutfit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), name: z.string().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("outfits")
      .update({ name: data.name })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ AI: virtual try-on — generate look image ============ */
export const generateTryOn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        itemIds: z.array(z.string().uuid()).min(1).max(6),
        mannequinPreset: z.enum(MANNEQUIN_PRESETS),
        name: z.string().min(1).max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load the items (must belong to user — RLS enforces too)
    const { data: items, error: itemsErr } = await supabase
      .from("clothing_items")
      .select("id,name,category,image_url,cutout_url")
      .in("id", data.itemIds)
      .eq("user_id", userId);
    if (itemsErr) throw new Error(itemsErr.message);
    if (!items || items.length === 0) throw new Error("Couldn't load those pieces.");

    const description = describePreset(data.mannequinPreset);
    const piecesText = items
      .map((i) => `- ${i.name ?? i.category} (${i.category})`)
      .join("\n");

    const userContent: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: `Create a single full-body fashion editorial photo of a stylized illustrated mannequin/figure (${description}) wearing ALL of the following clothing pieces TOGETHER as one cohesive outfit:\n${piecesText}\n\nRules:\n- Use the provided reference images for each garment — preserve their exact colors, patterns, and silhouettes.\n- Pose: standing, facing camera, relaxed, full body in frame (head to feet).\n- Background: clean solid soft cream (#FFF6F1).\n- Style: minimal, premium, magazine-quality, soft natural lighting, no text, no watermark.\n- The figure should look like a friendly illustrated/stylized mannequin (not a hyperreal photo of a real person).`,
      },
      ...items.map((i) => ({
        type: "image_url" as const,
        image_url: { url: i.cutout_url ?? i.image_url },
      })),
    ];

    const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: userContent }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Too many requests, slow down a sec.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits to keep styling.");
      throw new Error(`Try-on generation failed [${res.status}]: ${txt}`);
    }
    const json = (await res.json()) as {
      choices?: {
        message?: { images?: { image_url?: { url?: string } }[] };
      }[];
    };
    const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl) throw new Error("AI didn't return an image. Try again.");

    // Upload generated image to storage
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${userId}/outfits/${Date.now()}.png`;
    const { error: upErr } = await supabase.storage
      .from("wardrobe")
      .upload(path, blob, { contentType: "image/png", upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = supabase.storage.from("wardrobe").getPublicUrl(path);
    const generatedUrl = pub.publicUrl;

    // Save outfit row
    const { data: outfit, error: insErr } = await supabase
      .from("outfits")
      .insert({
        user_id: userId,
        name: data.name?.trim() || "New look",
        item_ids: data.itemIds,
        mannequin_preset: data.mannequinPreset,
        generated_image_url: generatedUrl,
      })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);

    return { outfit };
  });

/* ============ Profile: get + update mannequin preset ============ */
export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data };
  });

export const updateMannequinPreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ preset: z.enum(MANNEQUIN_PRESETS) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ mannequin_preset: data.preset })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
