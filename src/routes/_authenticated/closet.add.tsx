import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ChevronLeft, Camera, Loader2, Sparkles, X, Image as ImageIcon, SwitchCamera, RotateCcw, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  categorizeClothing,
  createClothingItem,
  removeBackground,
} from "@/lib/closet.functions";

export const Route = createFileRoute("/_authenticated/closet/add")({
  head: () => ({
    meta: [
      { title: "Add clothing — What to Wear Today?" },
      { name: "description", content: "Scan a new piece into your closet." },
    ],
  }),
  component: AddClothingPage,
});

type Stage = "pick" | "confirm" | "uploading" | "processing" | "review" | "saving";

const CATEGORIES = [
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
  { id: "outerwear", label: "Outerwear" },
  { id: "dress", label: "Dress" },
  { id: "shoes", label: "Shoes" },
  { id: "accessory", label: "Accessory" },
] as const;

function AddClothingPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [captured, setCaptured] = useState<{ file: File; url: string } | null>(null);
  const queryClient = useQueryClient();

  const removeBg = useServerFn(removeBackground);
  const categorize = useServerFn(categorizeClothing);
  const createItem = useServerFn(createClothingItem);

  const [stage, setStage] = useState<Stage>("pick");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    color: string;
    category: (typeof CATEGORIES)[number]["id"];
  }>({ name: "", color: "", category: "top" });

  async function onFile(file: File) {
    try {
      setStage("uploading");

      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${u.user.id}/raw/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("wardrobe")
        .upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("wardrobe").getPublicUrl(path);
      const rawUrl = pub.publicUrl;
      setImageUrl(rawUrl);

      setStage("processing");
      // Run categorize + bg-remove in parallel
      const [cat, cutout] = await Promise.allSettled([
        categorize({ data: { imageUrl: rawUrl } }),
        removeBg({ data: { imageUrl: rawUrl } }),
      ]);

      if (cat.status === "fulfilled") {
        setForm({
          name: cat.value.name,
          color: cat.value.color,
          category: cat.value.category,
        });
      } else {
        console.error(cat.reason);
      }

      if (cutout.status === "fulfilled" && cutout.value.cutoutDataUrl) {
        const dataUrl = cutout.value.cutoutDataUrl;
        // Upload cutout back to storage
        const blob = await (await fetch(dataUrl)).blob();
        const cutoutPath = `${u.user.id}/cutouts/${Date.now()}.png`;
        const { error: cErr } = await supabase.storage
          .from("wardrobe")
          .upload(cutoutPath, blob, { contentType: "image/png", upsert: false });
        if (!cErr) {
          const { data: cPub } = supabase.storage.from("wardrobe").getPublicUrl(cutoutPath);
          setCutoutUrl(cPub.publicUrl);
        }
      }

      setStage("review");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
      setStage("pick");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function startStream(mode: "environment" | "user") {
    setCameraStarting(true);
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      return true;
    } catch (e) {
      console.error(e);
      const name = (e as { name?: string })?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        toast.error("Camera permission denied. Use 'Choose from photos' instead.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        toast.error("No camera found. Use 'Choose from photos' instead.");
      } else {
        toast.error("Could not open camera. Try uploading a photo instead.");
      }
      return false;
    } finally {
      setCameraStarting(false);
    }
  }

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      // No camera API — fall back to native file picker with capture hint
      cameraRef.current?.click();
      return;
    }
    setCameraOpen(true);
    const ok = await startStream(facing);
    if (!ok) stopCamera();
  }

  async function switchCamera() {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    await startStream(next);
  }

  async function snapPhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.92));
    if (!blob) return;
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
    stopCamera();
    setCaptured({ file, url: URL.createObjectURL(file) });
    setStage("confirm");
  }

  function retake() {
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    setStage("pick");
    openCamera();
  }

  function useCapture() {
    if (!captured) return;
    onFile(captured.file);
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function save() {
    if (!imageUrl) return;
    if (!form.name.trim() || !form.color.trim()) {
      toast.error("Add a name and color.");
      return;
    }
    setStage("saving");
    try {
      await createItem({
        data: {
          image_url: imageUrl,
          cutout_url: cutoutUrl,
          name: form.name.trim(),
          color: form.color.trim(),
          category: form.category,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["closet"] });
      toast.success("Added to your closet ✦");
      navigate({ to: "/closet" });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not save.");
      setStage("review");
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

      <div className="mt-3">
        <span className="sticker -rotate-2" style={{ background: "var(--mint)" }}>scan a piece</span>
        <h1 className="display mt-3 text-[2.4rem] text-foreground">
          Add a{" "}
          <span className="inline-block rotate-1 rounded-xl border-[1.5px] border-ink px-2" style={{ background: "var(--sun)" }}>
            new fit
          </span>
        </h1>
      </div>

      {stage === "pick" && (
        <div className="mt-8">
          <button
            type="button"
            onClick={openCamera}
            className="card-pop flex aspect-[3/4] w-full flex-col items-center justify-center text-foreground active:translate-x-[2px] active:translate-y-[2px]"
            style={{ background: "var(--pink-soft)" }}
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-ink" style={{ background: "var(--pink)" }}>
              <Camera className="h-7 w-7" strokeWidth={2} />
            </div>
            <p className="mt-5 text-lg font-bold">Take a photo</p>
            <p className="mt-1 text-xs text-muted-foreground">opens your camera</p>
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-pop mt-4 w-full py-3 text-sm inline-flex items-center justify-center gap-2"
            data-tone="mint"
          >
            <ImageIcon className="h-4 w-4" />
            Choose from photos
          </button>

          {/* Camera capture (mobile only — desktop browsers ignore `capture`) */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) onFile(f);
            }}
          />
          {/* Standard file picker — works on desktop & mobile */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) onFile(f);
            }}
          />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Lay the piece flat on a plain surface — looks chef's kiss.
          </p>
        </div>
      )}

      {stage === "confirm" && captured && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
          <div className="card-pop overflow-hidden" style={{ background: "var(--sun-soft, var(--sun))" }}>
            <div className="aspect-[3/4]">
              <img src={captured.url} alt="Captured clothing photo" className="h-full w-full object-cover" />
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Looks good? We'll tag it and cut the background for you.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={retake}
              className="btn-pop flex-1 py-3.5 text-sm inline-flex items-center justify-center gap-2"
              data-tone="mint"
            >
              <RotateCcw className="h-4 w-4" /> Retake
            </button>
            <button
              type="button"
              onClick={useCapture}
              className="btn-pop flex-1 py-3.5 text-sm inline-flex items-center justify-center gap-2"
              data-tone="pink"
            >
              <Check className="h-4 w-4" /> Use photo
            </button>
          </div>
        </motion.div>
      )}

      {(stage === "uploading" || stage === "processing") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 flex flex-col items-center"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              className="h-52 w-52 rounded-3xl border-[1.5px] border-ink object-cover shadow-[4px_4px_0_0_var(--ink)]"
              alt=""
            />
          ) : (
            <div className="h-52 w-52 animate-pulse rounded-3xl border-[1.5px] border-ink bg-muted" />
          )}
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <Loader2 className="h-4 w-4 animate-spin" />
            {stage === "uploading" ? "Uploading…" : "Tagging & cutting background…"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Hang tight — usually a few seconds.
          </p>
        </motion.div>
      )}

      {(stage === "review" || stage === "saving") && imageUrl && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
          <div className="card-pop overflow-hidden" style={{ background: "var(--mint-soft)" }}>
            <div className="aspect-square">
              <img src={cutoutUrl ?? imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="border-t-[1.5px] border-ink bg-card px-4 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {cutoutUrl ? "✦ background removed" : "Original photo"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Field label="Name">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. White linen shirt"
                className="w-full rounded-2xl border-[1.5px] border-ink bg-card px-4 py-3 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-pink"
              />
            </Field>
            <Field label="Color">
              <input
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                placeholder="e.g. cream"
                className="w-full rounded-2xl border-[1.5px] border-ink bg-card px-4 py-3 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-pink"
              />
            </Field>
            <Field label="Category">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setForm((f) => ({ ...f, category: c.id }))}
                    className="chip"
                    data-active={form.category === c.id}
                    type="button"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <button
            disabled={stage === "saving"}
            onClick={save}
            className="btn-pop mt-8 w-full py-4 text-base disabled:opacity-60"
            data-tone="pink"
          >
            {stage === "saving" ? "Saving…" : "Add to closet ✦"}
          </button>
        </motion.div>
      )}

      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="flex-1 w-full object-cover"
          />
          {cameraStarting && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          <button
            type="button"
            onClick={stopCamera}
            className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative bg-black px-6 py-6 pb-10 flex items-center justify-center">
            <button
              type="button"
              onClick={switchCamera}
              disabled={cameraStarting}
              aria-label="Switch camera"
              className="absolute left-6 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white disabled:opacity-50"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={snapPhoto}
              disabled={cameraStarting}
              className="h-18 w-18 rounded-full border-4 border-white bg-white/20 active:scale-95 transition disabled:opacity-50"
              style={{ height: 72, width: 72 }}
              aria-label="Capture photo"
            >
              <span className="block h-14 w-14 rounded-full bg-white mx-auto" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
