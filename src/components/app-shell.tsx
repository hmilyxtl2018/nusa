import type { ReactNode } from "react";
import { Clock3, Leaf, UserRound } from "lucide-react";
import { t } from "@/lib/i18n";
import { useNusa } from "@/lib/store";
import type { Lang, Tab } from "@/lib/types";
import { cn } from "@/lib/utils";

const ITEMS: { id: Tab; icon: typeof Leaf; key: "nav.home" | "nav.history" | "nav.you" }[] = [
  { id: "home", icon: Leaf, key: "nav.home" },
  { id: "history", icon: Clock3, key: "nav.history" },
  { id: "you", icon: UserRound, key: "nav.you" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const lang = useNusa((s) => s.lang) as Lang;
  const tab = useNusa((s) => s.tab);
  const setTab = useNusa((s) => s.setTab);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <div className="flex-1 pb-24">{children}</div>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg border-t border-border bg-background/90 px-3 pt-2 backdrop-blur-sm pb-[max(0.6rem,env(safe-area-inset-bottom))]"
        aria-label="Nusa"
      >
        <ul className="grid grid-cols-3">
          {ITEMS.map((item) => {
            const active = tab === item.id;
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex h-12 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-150",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.1 : 1.7} />
                  {t(lang, item.key)}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
