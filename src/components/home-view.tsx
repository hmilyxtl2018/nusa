import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Camera, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Analyzing } from "@/components/analyzing";
import { NusaWordmark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { analyzePlate } from "@/lib/analyze";
import { greetingKey, t } from "@/lib/i18n";
import { compressImage, makeThumb, urlToDataUrl } from "@/lib/image";
import { savePhoto } from "@/lib/photo-db";
import { SAMPLE_PLATES } from "@/lib/samples";
import { useNusa } from "@/lib/store";
import type { Lang } from "@/lib/types";
import { uid } from "@/lib/utils";

type Draft = {
  dataUrl: string;
  sampleSrc?: string;
};

export function HomeView() {
  const lang = useNusa((s) => s.lang) as Lang;
  const profile = useNusa((s) => s.profile);
  const scans = useNusa((s) => s.scans);
  const addScan = useNusa((s) => s.addScan);
  const setTab = useNusa((s) => s.setTab);
  const navigate = useNavigate();

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"fail" | "unavailable" | "not_food" | "bad_image" | null>(null);

  const hour = new Date().getHours();

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      setError(null);
      setDraft({ dataUrl });
    } catch {
      toast.error(t(lang, "analyze.fail"));
    }
  }

  async function onSample(src: string) {
    try {
      const dataUrl = await urlToDataUrl(src);
      setError(null);
      setDraft({ dataUrl, sampleSrc: src });
    } catch {
      toast.error(t(lang, "analyze.fail"));
    }
  }

  async function runAnalyze() {
    if (!draft || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await analyzePlate({
        data: {
          imageDataUrl: draft.dataUrl,
          lang,
          profile,
          note: note.trim() || undefined,
        },
      });
      if (!result.ok) {
        setError(result.error === "unavailable" ? "unavailable" : result.error);
        setBusy(false);
        return;
      }
      const id = uid();
      const thumb = await makeThumb(draft.dataUrl);
      if (!draft.sampleSrc) await savePhoto(id, draft.dataUrl);
      addScan({
        id,
        createdAt: Date.now(),
        sampleSrc: draft.sampleSrc,
        thumb,
        analysis: result.analysis,
        chat: [],
      });
      setDraft(null);
      setNote("");
      setBusy(false);
      await navigate({ to: "/scan/$id", params: { id } });
    } catch {
      setError("fail");
      setBusy(false);
    }
  }

  return (
    <div className="px-5 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between pt-3">
        <NusaWordmark />
        <button
          type="button"
          className="min-h-11 text-xs font-medium text-muted-foreground"
          onClick={() => setTab("you")}
        >
          {t(lang, "you.language")}
        </button>
      </header>

      <h1 className="nusa-rise mt-6 max-w-[16ch] font-display text-[1.85rem] font-medium leading-[1.12] tracking-[-0.04em] md:text-[2rem]">
        {t(lang, greetingKey(hour))}
      </h1>

      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        className="nusa-plate mt-6 flex h-44 w-full flex-col items-center justify-center rounded-[var(--radius-2xl)] transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.98] md:h-52"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-lift)]">
          <Camera className="size-6" strokeWidth={1.7} />
        </span>
        <span className="mt-3 font-medium text-foreground">{t(lang, "home.cta")}</span>
        <span className="mt-1 text-sm text-muted-foreground">{t(lang, "app.tagline")}</span>
      </button>

      <Button
        variant="secondary"
        className="mt-4 w-full"
        onClick={() => galleryRef.current?.click()}
      >
        <ImageIcon className="size-4" />
        {t(lang, "home.gallery")}
      </Button>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <section className="mt-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {t(lang, "home.samples")}
        </h2>
        <div className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SAMPLE_PLATES.map((plate) => (
            <button
              key={plate.id}
              type="button"
              onClick={() => void onSample(plate.src)}
              className="w-[9.5rem] shrink-0 text-left"
            >
              <img
                src={plate.src}
                alt=""
                className="aspect-[4/3] w-full rounded-[16px] object-cover"
              />
              <p className="mt-2 truncate text-sm font-medium">{t(lang, plate.nameKey)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {t(lang, plate.regionKey)}
              </p>
            </button>
          ))}
        </div>
      </section>

      {scans.length > 0 ? (
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t(lang, "home.recent")}
            </h2>
            <button
              type="button"
              className="text-xs font-medium text-primary"
              onClick={() => setTab("history")}
            >
              {t(lang, "nav.history")}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {scans.slice(0, 6).map((scan) => (
              <button
                key={scan.id}
                type="button"
                onClick={() => navigate({ to: "/scan/$id", params: { id: scan.id } })}
                className="overflow-hidden rounded-[14px]"
              >
                <img
                  src={scan.sampleSrc ?? scan.thumb}
                  alt={scan.analysis.dishName}
                  className="aspect-square w-full object-cover"
                />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {draft && !busy ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-overlay">
          <div className="mt-auto max-h-[92dvh] overflow-auto rounded-t-[28px] bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-secondary" />
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-2xl font-medium tracking-[-0.03em]">
                {t(lang, "home.confirm")}
              </h2>
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-full bg-secondary"
                onClick={() => {
                  setDraft(null);
                  setError(null);
                  setNote("");
                }}
                aria-label={t(lang, "common.close")}
              >
                <X className="size-4" />
              </button>
            </div>
            <img
              src={draft.sampleSrc ?? draft.dataUrl}
              alt=""
              className="mt-4 aspect-[4/3] w-full rounded-[20px] object-cover"
            />
            <label className="mt-4 block text-xs font-medium text-muted-foreground">
              {t(lang, "home.note")}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                placeholder={t(lang, "home.note.ph")}
                rows={2}
                className="mt-2 w-full resize-none rounded-[16px] bg-card px-3 py-3 text-sm text-foreground shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus:shadow-[var(--shadow-border-hover)]"
              />
            </label>
            {error ? (
              <p className="mt-3 text-sm text-caution">
                {t(
                  lang,
                  error === "unavailable"
                    ? "analyze.unavailable"
                    : error === "not_food"
                      ? "analyze.notfood"
                      : "analyze.fail",
                )}
              </p>
            ) : null}
            <Button className="mt-5 w-full" size="lg" onClick={() => void runAnalyze()}>
              {error ? t(lang, "analyze.retry") : t(lang, "home.confirm")}
            </Button>
          </div>
        </div>
      ) : null}

      {busy && draft ? <Analyzing lang={lang} photo={draft.sampleSrc ?? draft.dataUrl} /> : null}
    </div>
  );
}
