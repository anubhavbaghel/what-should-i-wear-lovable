
# What to Wear Today?

A mobile-first web app where Gen Z users scan their clothes, dress a stylized mannequin with AI-powered virtual try-on, and save outfits to collections.

## Core flows

1. **Onboarding & Auth** — Google sign-in (via Lovable Cloud). New users land on an empty closet with a friendly "Scan your first piece" prompt.
2. **Closet** — Grid of clothing items, filterable by category (Tops, Bottoms, Outerwear, Dresses, Shoes, Accessories). Tap an item to view / re-tag / delete.
3. **Add clothing** — Open phone camera (or pick from gallery), capture garment, auto-remove background and auto-categorize via AI, confirm tags, save.
4. **Style** (the hero feature) — Stylized mannequin on screen. User taps slots (top / bottom / shoes / outerwear) to pick items from their closet. Tap "Try it on" to generate an AI virtual try-on image of the mannequin wearing the selected pieces.
5. **Outfits** — Save generated try-on images to named collections (e.g. "Date night", "Work week"). Browse, rename, delete.
6. **Profile** — Avatar, sign out, basic preferences (default mannequin body type / skin tone).

## Design direction

Minimal, fashionable, clean, modern. Editorial fashion-magazine feel with playful Gen Z touches — no neon, no glassmorphism, no emoji, no futuristic chrome.

- **Palette**: Warm off-white background (`#FAF7F2`), deep ink primary (`#111111`), soft taupe surfaces, single accent — a confident tomato/coral (`#E8533C`) used sparingly for CTAs and active states.
- **Typography**: Display serif for headings (Instrument Serif or Fraunces) paired with a clean grotesque body (Inter or Geist). Big editorial headlines, generous line-height.
- **Layout**: Single-column mobile-first, big tap targets, generous whitespace, soft 12–16px corner radius, subtle 1px hairline borders instead of heavy shadows.
- **Motion**: Restrained — soft fade/slide on route change, gentle spring on item pick, satisfying snap when an outfit slot fills. Powered by Motion (framer-motion).
- **Fun Gen Z elements**: Sticker-style category chips, a hand-drawn underline accent on active tab, playful microcopy ("Pick a top to start the look"), small "✦" sparkle glyph (typographic, not emoji) on successful saves.
- **Bottom tab bar**: Closet · Style · Outfits · Profile.

## Tech & backend

- **Stack**: TanStack Start + Tailwind + shadcn (restyled to match), Motion for animation.
- **Lovable Cloud** for auth (Google), Postgres (clothing items, outfits, collections), and Storage (raw photos + processed cutouts + generated try-on images).
- **Lovable AI Gateway** for:
  - Background removal + auto-categorization on clothing intake (vision model classifies type & dominant color).
  - Virtual try-on image generation via `openai/gpt-image-2` (streamed through a `src/routes/api/*` server route — `createServerFn` can't stream images).
- **Mobile camera** via the standard `<input type="file" accept="image/*" capture="environment">` — works in mobile browsers without native APIs.

## Data model (Lovable Cloud / Postgres)

- `profiles` (id → auth.users, display_name, avatar_url, mannequin_preset, created_at)
- `clothing_items` (id, user_id, category, color, image_url, cutout_url, ai_tags jsonb, created_at)
- `outfits` (id, user_id, name, mannequin_preset, item_ids uuid[], generated_image_url, created_at)
- `collections` (id, user_id, name, cover_outfit_id, created_at)
- `collection_outfits` (collection_id, outfit_id)
- RLS: each user can only read/write their own rows. Storage bucket `wardrobe` with per-user folder policy.

## Screens / routes

- `/` — landing redirect (logged-in → `/closet`, logged-out → `/login`)
- `/login` — Google sign-in
- `/_authenticated/closet` — closet grid + filters + "Add" FAB
- `/_authenticated/closet/add` — camera capture + AI processing flow
- `/_authenticated/closet/$itemId` — item detail
- `/_authenticated/style` — mannequin try-on builder
- `/_authenticated/outfits` — saved outfits & collections
- `/_authenticated/outfits/$outfitId` — outfit detail
- `/_authenticated/profile` — profile + sign out

## Build order

1. Enable Lovable Cloud + Google auth, set up schema, RLS, storage bucket, design tokens, bottom-tab shell.
2. Closet: list, add via camera, AI background removal + auto-categorization, item detail.
3. Style: mannequin canvas, slot picker pulling from closet, AI virtual try-on generation (streamed).
4. Outfits & collections: save, browse, organize.
5. Profile, polish, motion pass.

## Out of scope (v1)

- Phone/SMS login (Google only for now; can be added later if you set up Twilio).
- Photo-real AI avatar from user selfie.
- Social sharing, friends, public feeds.
- Weather-based outfit suggestions (good v2 idea).
