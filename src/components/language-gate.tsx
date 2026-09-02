import { Check } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n";
import { useNusa } from "@/lib/store";
import { cn } from "@/lib/utils";
import { NusaMark } from "@/components/mark";

export function LanguageGate() {
  const current = useNusa((s) => s.lang);
  const setLang = useNusa((s) => s.setLang);

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-5xl md:grid-cols-2 md:gap-12 md:px-10">
      <header className="pointer-events-none px-5 pt-[max(2.5rem,env(safe-area-inset-top))] md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:justify-center md:px-0 md:pt-0">
        <NusaMark className="size-10 text-primary md:size-14" />
        <h1 className="mt-6 font-display text-4xl font-medium tracking-[-0.04em] text-foreground md:text-6xl">
          Nusa
        </h1>
        <p className="mt-2 max-w-[20rem] text-sm leading-relaxed text-muted-foreground md:mt-4 md:max-w-[22rem] md:text-base">
          Know your plate. The languages of Southeast Asia.
        </p>
      </header>

      <div className="relative z-10 flex min-h-0 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 md:px-0 md:py-16">
        <ul className="space-y-2">
          {LANGUAGES.map((item) => {
            const selected = current === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setLang(item.id)}
                  className={cn(
                    "flex min-h-14 w-full items-center justify-between rounded-[20px] bg-card px-4 py-3 text-left shadow-[var(--shadow-border)] transition-[box-shadow,background-color,transform] duration-150 ease-[var(--ease-out)]",
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
      </div>
    </div>
  );
}
