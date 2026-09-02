import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { HistoryView } from "@/components/history-view";
import { HomeView } from "@/components/home-view";
import { LanguageGate } from "@/components/language-gate";
import { Onboarding } from "@/components/onboarding";
import { YouView } from "@/components/you-view";
import { useNusa } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const lang = useNusa((s) => s.lang);
  const onboarded = useNusa((s) => s.onboarded);
  const tab = useNusa((s) => s.tab);

  if (!lang) return <LanguageGate />;
  if (!onboarded) return <Onboarding />;

  return (
    <AppShell>
      {tab === "home" ? <HomeView /> : null}
      {tab === "history" ? <HistoryView /> : null}
      {tab === "you" ? <YouView /> : null}
    </AppShell>
  );
}
