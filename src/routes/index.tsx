import { useEffect, useState } from "react";
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
  const [ready, setReady] = useState(() =>
    Boolean(useNusa.persist?.hasHydrated?.()),
  );

  useEffect(() => {
    if (ready) return;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      useNusa.setState({ hydrated: true });
      setReady(true);
    };
    const persist = useNusa.persist;
    const timer = window.setTimeout(finish, 200);
    if (!persist || persist.hasHydrated()) finish();
    else persist.onFinishHydration(finish);
    return () => window.clearTimeout(timer);
  }, [ready]);

  if (!ready) {
    return <div className="min-h-dvh bg-background" aria-hidden />;
  }

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
