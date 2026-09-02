import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnalysisView } from "@/components/analysis-view";
import { LanguageGate } from "@/components/language-gate";
import { NusaMark } from "@/components/mark";
import { loadPhoto } from "@/lib/photo-db";
import { useNusa } from "@/lib/store";

export const Route = createFileRoute("/scan/$id")({
  component: ScanPage,
});

function ScanPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const lang = useNusa((s) => s.lang);
  const scan = useNusa((s) => s.scans.find((item) => item.id === id));
  const [photo, setPhoto] = useState<string | null>(scan?.sampleSrc ?? scan?.thumb ?? null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const persist = useNusa.persist;
    if (!persist) {
      setReady(true);
      return;
    }
    const unsub = persist.onFinishHydration(() => setReady(true));
    if (persist.hasHydrated()) setReady(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!scan) {
      void navigate({ to: "/" });
      return;
    }
    if (scan.sampleSrc) {
      setPhoto(scan.sampleSrc);
      return;
    }
    let cancelled = false;
    void loadPhoto(scan.id).then((full) => {
      if (!cancelled) setPhoto(full ?? scan.thumb);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, scan, navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <NusaMark className="size-12" />
      </div>
    );
  }

  if (!lang) return <LanguageGate />;
  if (!scan || !photo) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <NusaMark className="size-12" />
      </div>
    );
  }

  return <AnalysisView scan={scan} photo={photo} />;
}
