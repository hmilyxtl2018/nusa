import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnalysisView } from "@/components/analysis-view";
import { LanguageGate } from "@/components/language-gate";
import { NusaMark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { recallScan } from "@/lib/last-scan";
import { loadPhoto } from "@/lib/photo-db";
import { useNusa } from "@/lib/store";
import type { Lang } from "@/lib/types";

export const Route = createFileRoute("/scan/$id")({
  component: ScanPage,
});

function ScanPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const lang = useNusa((s) => s.lang);
  const addScan = useNusa((s) => s.addScan);
  const storeScan = useNusa((s) => s.scans.find((item) => item.id === id));
  const recalled = useMemo(() => recallScan(id), [id]);
  const scan = storeScan ?? recalled?.scan ?? null;

  const [photo, setPhoto] = useState<string | null>(
    () => scan?.sampleSrc ?? scan?.thumb ?? recalled?.photo ?? null,
  );
  const [waited, setWaited] = useState(
    () => Boolean(useNusa.persist?.hasHydrated?.()),
  );

  useEffect(() => {
    if (recalled?.scan && !storeScan) addScan(recalled.scan);
  }, [addScan, recalled, storeScan]);

  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      useNusa.setState({ hydrated: true });
      setWaited(true);
    };
    const persist = useNusa.persist;
    const timer = window.setTimeout(finish, 250);
    if (!persist || persist.hasHydrated()) finish();
    else persist.onFinishHydration(finish);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!scan) return;
    const fallback = scan.sampleSrc ?? scan.thumb ?? recalled?.photo ?? null;
    if (fallback) setPhoto(fallback);
    if (scan.sampleSrc) return;
    let cancelled = false;
    void loadPhoto(scan.id).then((full) => {
      if (!cancelled && full) setPhoto(full);
    });
    return () => {
      cancelled = true;
    };
  }, [scan, recalled?.photo]);

  if (scan && lang) {
    return <AnalysisView scan={scan} photo={photo || scan.thumb || ""} />;
  }

  if (!waited) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <NusaMark className="size-12 text-primary" />
      </div>
    );
  }

  if (!lang) return <LanguageGate />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-5 px-6">
      <NusaMark className="size-12 text-primary" />
      <p className="max-w-[28ch] text-center text-sm leading-relaxed text-muted-foreground">
        {t(lang as Lang, "result.missing")}
      </p>
      <Button onClick={() => void navigate({ to: "/" })}>
        {t(lang as Lang, "result.back")}
      </Button>
    </div>
  );
}
