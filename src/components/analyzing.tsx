import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const STEPS = ["analyze.1", "analyze.2", "analyze.3", "analyze.4"] as const;

export function Analyzing({ lang, photo }: { lang: Lang; photo: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="relative h-[46vh] min-h-56 overflow-hidden">
        <img
          src={photo}
          alt=""
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pt-2">
        <p className="nusa-shimmer font-display text-2xl font-medium tracking-[-0.03em]">
          {t(lang, "analyze.title")}
        </p>
        <ol className="mt-6 space-y-3">
          {STEPS.map((key, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <li
                key={key}
                className="flex items-center gap-3 text-sm transition-colors duration-200"
                style={{
                  color: active
                    ? "var(--color-foreground)"
                    : done
                      ? "var(--color-primary)"
                      : "var(--color-muted-foreground)",
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: active
                      ? "var(--color-primary)"
                      : done
                        ? "var(--color-benefit)"
                        : "var(--color-secondary)",
                  }}
                />
                {t(lang, key)}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
