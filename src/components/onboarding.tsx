import { useState } from "react";
import { Camera, Scale, UserRound } from "lucide-react";
import { t } from "@/lib/i18n";
import { useNusa } from "@/lib/store";
import type { Lang } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { NusaMark } from "@/components/mark";
import { ProfileForm } from "@/components/profile-form";

const STEPS = [
  { icon: Camera, title: "onb.1.title", body: "onb.1.body" },
  { icon: Scale, title: "onb.2.title", body: "onb.2.body" },
  { icon: UserRound, title: "onb.3.title", body: "onb.3.body" },
] as const;

export function Onboarding() {
  const lang = useNusa((s) => s.lang) as Lang;
  const profile = useNusa((s) => s.profile);
  const setProfile = useNusa((s) => s.setProfile);
  const setOnboarded = useNusa((s) => s.setOnboarded);
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const last = step === STEPS.length - 1;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between pt-4">
        <NusaMark className="size-7" />
        <button
          type="button"
          className="min-h-11 px-2 text-sm text-muted-foreground"
          onClick={() => setOnboarded(true)}
        >
          {t(lang, "onb.skip")}
        </button>
      </div>

      <div className="mt-6 flex gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full bg-secondary transition-[background-color] duration-200"
            style={{
              backgroundColor:
                i <= step ? "var(--color-primary)" : "var(--color-secondary)",
            }}
          />
        ))}
      </div>

      <div key={step} className="nusa-rise mt-10 flex-1">
        <div className="flex size-14 items-center justify-center rounded-[20px] bg-card shadow-[var(--shadow-border)]">
          <Icon className="size-6 text-primary" strokeWidth={1.7} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-medium tracking-[-0.03em]">
          {t(lang, current.title)}
        </h1>
        <p className="mt-3 max-w-[28rem] text-[15px] leading-relaxed text-muted-foreground">
          {t(lang, current.body)}
        </p>

        {last ? (
          <div className="mt-8">
            <ProfileForm lang={lang} value={profile} onChange={setProfile} />
            <p className="mt-5 text-xs text-subtle">{t(lang, "profile.saved")}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-8">
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            if (last) setOnboarded(true);
            else setStep((s) => s + 1);
          }}
        >
          {t(lang, last ? "onb.start" : "onb.next")}
        </Button>
      </div>
    </div>
  );
}
