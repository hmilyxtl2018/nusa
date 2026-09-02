import { t, LANGUAGES } from "@/lib/i18n";
import { useNusa } from "@/lib/store";
import type { Lang } from "@/lib/types";
import { NusaWordmark } from "@/components/mark";
import { ProfileForm } from "@/components/profile-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function YouView() {
  const lang = useNusa((s) => s.lang) as Lang;
  const setLang = useNusa((s) => s.setLang);
  const profile = useNusa((s) => s.profile);
  const setProfile = useNusa((s) => s.setProfile);
  const resetAll = useNusa((s) => s.resetAll);

  return (
    <div className="px-5 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="pt-3">
        <NusaWordmark />
      </header>

      <h1 className="mt-8 font-display text-3xl font-medium tracking-[-0.03em]">
        {t(lang, "nav.you")}
      </h1>

      <section className="mt-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {t(lang, "you.language")}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {LANGUAGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLang(item.id)}
              className={cn(
                "relative z-10 min-h-11 rounded-full px-3.5 text-sm font-medium shadow-[var(--shadow-border)]",
                lang === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground",
              )}
            >
              {item.native}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {t(lang, "you.edit")}
        </h2>
        <div className="mt-4">
          <ProfileForm lang={lang} value={profile} onChange={setProfile} />
        </div>
        <p className="mt-4 text-xs text-subtle">{t(lang, "profile.saved")}</p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-medium tracking-[-0.03em]">
          {t(lang, "you.about")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t(lang, "you.about.body")}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t(lang, "you.privacy")}
        </p>
        <p className="mt-4 text-xs leading-relaxed text-subtle">{t(lang, "app.disclaimer")}</p>
      </section>

      <Button
        variant="outline"
        className="mt-10 w-full"
        onClick={() => resetAll()}
      >
        {t(lang, "you.reset")}
      </Button>
    </div>
  );
}
