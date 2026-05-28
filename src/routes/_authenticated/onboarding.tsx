import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ChevronRight, Loader2, Sparkles, Camera, Shirt } from "lucide-react";
import { completeOnboarding, getProfile } from "@/lib/outfits.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — What to Wear Today?" },
      { name: "description", content: "Set up your closet in 30 seconds." },
    ],
  }),
  component: OnboardingPage,
});

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

function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const finish = useServerFn(completeOnboarding);

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [preset, setPreset] = useState<Preset>("neutral_medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = profileData?.profile;
    if (!p) return;
    if (p.onboarded_at) {
      navigate({ to: "/closet", replace: true });
      return;
    }
    if (p.display_name && !name) setName(p.display_name);
    if (p.mannequin_preset) setPreset(p.mannequin_preset as Preset);
  }, [profileData, navigate, name]);

  async function save(goAdd: boolean) {
    setSaving(true);
    try {
      await finish({ data: { displayName: name.trim() || undefined, preset } });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("You're all set ✦");
      navigate({ to: goAdd ? "/closet/add" : "/closet", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] px-5 pt-12 pb-12">
      {/* progress dots */}
      <div className="mx-auto mb-8 flex w-full max-w-xs items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 rounded-full border-[1.5px] border-ink transition-all"
            style={{
              width: i === step ? 28 : 14,
              background: i <= step ? "var(--pink)" : "var(--card)",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.section
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span className="sticker -rotate-2" style={{ background: "var(--mint)" }}>
              welcome ✦
            </span>
            <h1 className="display mt-3 text-[2.6rem] leading-[0.95] text-foreground">
              Hey —{" "}
              <span
                className="inline-block rotate-1 rounded-xl border-[1.5px] border-ink px-2"
                style={{ background: "var(--sun)" }}
              >
                what should
              </span>{" "}
              we call you?
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              We'll personalize your closet a little.
            </p>

            <label className="mt-7 block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Your name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full rounded-2xl border-[1.5px] border-ink bg-card px-4 py-3 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-pink"
              />
            </label>

            <button
              onClick={() => setStep(1)}
              className="btn-pop mt-8 w-full py-4 text-base"
              data-tone="pink"
              type="button"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </motion.section>
        )}

        {step === 1 && (
          <motion.section
            key="figure"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span className="sticker -rotate-2" style={{ background: "var(--pink)" }}>
              your mannequin
            </span>
            <h1 className="display mt-3 text-[2.4rem] leading-[0.95] text-foreground">
              Pick a{" "}
              <span
                className="inline-block rotate-1 rounded-xl border-[1.5px] border-ink px-2"
                style={{ background: "var(--mint)" }}
              >
                figure
              </span>{" "}
              that feels like you.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              We'll dress this mannequin when you generate looks. You can change it anytime.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  className="chip justify-center text-[12px]"
                  data-active={preset === p.id}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="btn-pop py-3 px-4 text-sm"
                data-tone="paper"
                type="button"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="btn-pop flex-1 py-3 text-sm"
                data-tone="pink"
                type="button"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section
            key="how"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span className="sticker -rotate-2" style={{ background: "var(--sun)" }}>
              how it works
            </span>
            <h1 className="display mt-3 text-[2.4rem] leading-[0.95] text-foreground">
              Three steps to a{" "}
              <span
                className="inline-block rotate-1 rounded-xl border-[1.5px] border-ink px-2"
                style={{ background: "var(--pink)" }}
              >
                full closet
              </span>
              .
            </h1>

            <ol className="mt-6 space-y-3">
              <Step
                n={1}
                icon={<Camera className="h-4 w-4" />}
                tone="pink"
                title="Scan your pieces"
                body="Snap a photo — we cut the background & tag it."
              />
              <Step
                n={2}
                icon={<Sparkles className="h-4 w-4" />}
                tone="sun"
                title="Style a look"
                body="Mix pieces; AI dresses your mannequin."
              />
              <Step
                n={3}
                icon={<Shirt className="h-4 w-4" />}
                tone="mint"
                title="Save outfits"
                body="Keep the looks you love for later."
              />
            </ol>

            <button
              onClick={() => save(true)}
              disabled={saving}
              className="btn-pop mt-8 w-full py-4 text-base disabled:opacity-60"
              data-tone="pink"
              type="button"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Setting up…
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" /> Scan my first piece
                </>
              )}
            </button>
            <button
              onClick={() => save(false)}
              disabled={saving}
              className="mt-3 w-full text-xs font-semibold text-muted-foreground hover:text-ink disabled:opacity-60"
              type="button"
            >
              I'll do it later
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  body,
  tone,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "pink" | "mint" | "sun";
}) {
  const bg = tone === "pink" ? "var(--pink-soft)" : tone === "mint" ? "var(--mint-soft)" : "var(--sun)";
  const chip = tone === "pink" ? "var(--pink)" : tone === "mint" ? "var(--mint)" : "var(--sun)";
  return (
    <li className="card-pop flex items-start gap-3 px-4 py-3" style={{ background: bg }}>
      <span
        className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink text-[12px] font-bold"
        style={{ background: chip }}
      >
        {n}
      </span>
      <div>
        <p className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
          {icon} {title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}
