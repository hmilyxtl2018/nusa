import { useNavigate } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { useNusa } from "@/lib/store";
import type { Lang } from "@/lib/types";
import { NusaWordmark } from "@/components/mark";
import { Button } from "@/components/ui/button";

export function HistoryView() {
  const lang = useNusa((s) => s.lang) as Lang;
  const scans = useNusa((s) => s.scans);
  const clearScans = useNusa((s) => s.clearScans);
  const navigate = useNavigate();

  return (
    <div className="px-5 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between pt-3">
        <NusaWordmark />
        {scans.length > 0 ? (
          <button
            type="button"
            className="min-h-11 text-xs font-medium text-caution"
            onClick={() => {
              if (window.confirm(t(lang, "history.clear.confirm"))) clearScans();
            }}
          >
            {t(lang, "history.clear")}
          </button>
        ) : null}
      </header>

      <h1 className="mt-8 font-display text-3xl font-medium tracking-[-0.03em]">
        {t(lang, "history.title")}
      </h1>

      {scans.length === 0 ? (
        <p className="mt-4 max-w-[28ch] text-sm leading-relaxed text-muted-foreground">
          {t(lang, "history.empty")}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {scans.map((scan) => (
            <li key={scan.id}>
              <button
                type="button"
                onClick={() => navigate({ to: "/scan/$id", params: { id: scan.id } })}
                className="flex w-full gap-3 rounded-[20px] bg-card p-2 text-left shadow-[var(--shadow-border)]"
              >
                <img
                  src={scan.sampleSrc ?? scan.thumb}
                  alt=""
                  className="size-[4.5rem] rounded-[14px] object-cover"
                />
                <span className="min-w-0 flex-1 py-1.5 pr-2">
                  <span className="block truncate font-medium">{scan.analysis.dishName}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {scan.analysis.cuisine}
                    {scan.analysis.region ? ` · ${scan.analysis.region}` : ""}
                  </span>
                  <span className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="tabular-nums text-foreground">
                      {scan.analysis.overall.score}
                    </span>
                    {new Date(scan.createdAt).toLocaleDateString()}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {scans.length === 0 ? (
        <Button className="mt-8" onClick={() => useNusa.getState().setTab("home")}>
          {t(lang, "home.cta")}
        </Button>
      ) : null}
    </div>
  );
}
