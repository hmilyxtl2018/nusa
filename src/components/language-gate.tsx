import { useState } from "react";
import { Check } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n";
import { useNusa } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { NusaMark } from "@/components/mark";

export function LanguageGate() {
  const current = useNusa((s) => s.lang);
  const setLang = useNusa((s) => s.setLang);
  const [picked, setPicked] = useState<Lang | null>(current);

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-5xl md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start md:gap-16 md:px-10">
      <header className="nusa-rise px-5 pt-[max(2.5rem,env(safe-area-inset-top))] md:sticky md:top-0 md:flex md:min-h-dvh md:flex-col md:justify-center md:px-0 md:pt-0">
        <NusaMark className="size-10 text-primary md:size-14" />
        <h1 className="mt-6 font-display text-4xl font-medium tracking-[-0.04em] text-foreground md:text-6xl">
          Nusa
        </h1>
        <p className="mt-2 max-w-[20rem] text-sm leading-relaxed text-muted-foreground md:mt-4 md:max-w-[22rem] md:text-base">
          Know your plate. The languages of Southeast Asia.
        </p>
      </header>

      <div className="flex min-h-0 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-0 md:pt-16">
        <ul className="mt-8 space-y-2 md:mt-0">
          {LANGUAGES.map((item, i) => {
            const selected = picked === item.id;
            return (
              <li
                key={item.id}
                className="nusa-rise"
                style={{ animationDelay: `${80 + i * 28}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setPicked(item.id)}
                  className={cn(
                    "flex min-h-14 w-full items-center justify-between rounded-[20px] bg-card px-4 py-3 text-left shadow-[var(--shadow-border)] transition-[box-shadow,background-color] duration-150 ease-[var(--ease-out)]",
                    selected && "shadow-[var(--shadow-lift)]",
                  )}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium text-foreground">{item.native}</span>
                    <span className="text-xs text-muted-foreground">{item.region}</span>
                  </span>
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full transition-[background-color,color] duration-150",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-transparent",
                    )}
                  >
                    <Check className="size-3.5" strokeWidth={2.4} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-background via-background to-transparent pt-4 md:static">
          <Button
            className="w-full"
            size="lg"
            disabled={!picked}
            onClick={() => {
              if (picked) setLang(picked);
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
