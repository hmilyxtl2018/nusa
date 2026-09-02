import type { ReactNode } from "react";
import { t } from "@/lib/i18n";
import type { AllergyFlag, Diet, HealthFlag, Lang, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const DIETS: Diet[] = ["any", "halal", "vegetarian", "vegan", "buddhist", "hindu"];
const HEALTH: HealthFlag[] = [
  "diabetes",
  "hypertension",
  "pregnancy",
  "gout",
  "kidney",
  "cholesterol",
];
const ALLERGIES: AllergyFlag[] = [
  "peanut",
  "shellfish",
  "fish",
  "gluten",
  "dairy",
  "soy",
  "egg",
  "sesame",
];

const DIET_KEYS: Record<Diet, "profile.diet.any" | "profile.diet.halal" | "profile.diet.vegetarian" | "profile.diet.vegan" | "profile.diet.buddhist" | "profile.diet.hindu"> = {
  any: "profile.diet.any",
  halal: "profile.diet.halal",
  vegetarian: "profile.diet.vegetarian",
  vegan: "profile.diet.vegan",
  buddhist: "profile.diet.buddhist",
  hindu: "profile.diet.hindu",
};

const HEALTH_KEYS: Record<HealthFlag, "profile.health.diabetes" | "profile.health.hypertension" | "profile.health.pregnancy" | "profile.health.gout" | "profile.health.kidney" | "profile.health.cholesterol"> = {
  diabetes: "profile.health.diabetes",
  hypertension: "profile.health.hypertension",
  pregnancy: "profile.health.pregnancy",
  gout: "profile.health.gout",
  kidney: "profile.health.kidney",
  cholesterol: "profile.health.cholesterol",
};

const ALLERGY_KEYS: Record<AllergyFlag, "profile.allergy.peanut" | "profile.allergy.shellfish" | "profile.allergy.fish" | "profile.allergy.gluten" | "profile.allergy.dairy" | "profile.allergy.soy" | "profile.allergy.egg" | "profile.allergy.sesame"> = {
  peanut: "profile.allergy.peanut",
  shellfish: "profile.allergy.shellfish",
  fish: "profile.allergy.fish",
  gluten: "profile.allergy.gluten",
  dairy: "profile.allergy.dairy",
  soy: "profile.allergy.soy",
  egg: "profile.allergy.egg",
  sesame: "profile.allergy.sesame",
};

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-10 rounded-full px-3.5 text-sm font-medium shadow-[var(--shadow-border)] transition-[background-color,color,box-shadow] duration-150 ease-[var(--ease-out)]",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-card text-foreground hover:shadow-[var(--shadow-border-hover)]",
      )}
    >
      {children}
    </button>
  );
}

export function ProfileForm({
  lang,
  value,
  onChange,
}: {
  lang: Lang;
  value: Profile;
  onChange: (next: Profile) => void;
}) {
  const toggle = <T,>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  return (
    <div className="space-y-7">
      <section>
        <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {t(lang, "profile.diet")}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {DIETS.map((d) => (
            <Chip
              key={d}
              active={value.diet === d}
              onClick={() => onChange({ ...value, diet: d })}
            >
              {t(lang, DIET_KEYS[d])}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {t(lang, "profile.health")}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {HEALTH.map((h) => (
            <Chip
              key={h}
              active={value.health.includes(h)}
              onClick={() => onChange({ ...value, health: toggle(value.health, h) })}
            >
              {t(lang, HEALTH_KEYS[h])}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {t(lang, "profile.allergies")}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALLERGIES.map((a) => (
            <Chip
              key={a}
              active={value.allergies.includes(a)}
              onClick={() =>
                onChange({ ...value, allergies: toggle(value.allergies, a) })
              }
            >
              {t(lang, ALLERGY_KEYS[a])}
            </Chip>
          ))}
        </div>
      </section>
    </div>
  );
}
