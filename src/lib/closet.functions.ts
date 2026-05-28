import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_BASE = "https://ai.gateway.lovable.dev/v1";

function aiKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured.");
  return key;
}

const CATEGORIES = ["top", "bottom", "outerwear", "dress", "shoes", "accessory"] as const;

/* ============ List ============ */
export const listClothing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("clothing_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

/* ============ Get one ============ */
export const getClothingItem = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("clothing_items")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);
    return { item: row };
  });

/* ============ Delete ============ */
export const deleteClothingItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("clothing_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Update tags / category ============ */
export const updateClothingItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        category: z.enum(CATEGORIES).optional(),
        color: z.string().min(1).max(40).optional(),
        name: z.string().min(1).max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...patch } = data;
    const { error } = await supabase
      .from("clothing_items")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ AI: categorize an uploaded image ============ */
export const categorizeClothing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        imageUrl: z.string().url(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = aiKey();
    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You analyze clothing photos. Return ONLY the structured tool call. Be concise.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Identify the single clothing item in this photo. Pick the best category. Give a short, friendly garment name (2-3 words) and a one-word dominant color.",
            },
            { type: "image_url", image_url: { url: data.imageUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "tag_garment",
            description: "Return structured tags for the garment.",
            parameters: {
              type: "object",
              properties: {
                category: { type: "string", enum: CATEGORIES as unknown as string[] },
                name: { type: "string" },
                color: { type: "string" },
              },
              required: ["category", "name", "color"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "tag_garment" } },
    };

    const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Too many requests, slow down a sec.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits to keep styling.");
      throw new Error(`AI categorize failed [${res.status}]: ${txt}`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      return { category: "top" as const, name: "Clothing item", color: "neutral" };
    }
    const parsed = JSON.parse(args) as { category: string; name: string; color: string };
    const category = (CATEGORIES as readonly string[]).includes(parsed.category)
      ? (parsed.category as (typeof CATEGORIES)[number])
      : ("top" as const);
    return {
      category,
      name: parsed.name.slice(0, 60),
      color: parsed.color.slice(0, 30),
    };
  });

/* ============ AI: remove background, return data URL of cutout ============ */
export const removeBackground = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        imageUrl: z.string().url(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = aiKey();
    // Use Gemini Nano Banana via /chat/completions image editing route.
    const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Isolate the single clothing item shown. Replace the background with pure plain white (#FFFFFF). Keep the garment crisp, centered, with natural shadows removed. No text, no watermarks.",
              },
              { type: "image_url", image_url: { url: data.imageUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Too many requests, slow down a sec.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits to keep styling.");
      throw new Error(`Background removal failed [${res.status}]: ${txt}`);
    }
    const json = (await res.json()) as {
      choices?: {
        message?: {
          images?: { image_url?: { url?: string } }[];
        };
      }[];
    };
    const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl) {
      // No cutout available — caller will fall back to the raw image.
      return { cutoutDataUrl: null as string | null };
    }
    return { cutoutDataUrl: dataUrl };
  });

/* ============ Insert clothing row ============ */
export const createClothingItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        image_url: z.string().url(),
        cutout_url: z.string().url().nullable().optional(),
        category: z.enum(CATEGORIES),
        color: z.string().min(1).max(40),
        name: z.string().min(1).max(80),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("clothing_items")
      .insert({
        user_id: userId,
        image_url: data.image_url,
        cutout_url: data.cutout_url ?? null,
        category: data.category,
        color: data.color,
        name: data.name,
        ai_tags: {},
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { item: row };
  });
