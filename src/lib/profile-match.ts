import type { I18nKey } from "./i18n";
import type { Caution, FoodAnalysis, Profile } from "./types";

export type Mismatch = {
  key: string;
  kind: "diet" | "allergy" | "health";
};

const MISMATCH_LABEL: Record<string, I18nKey> = {
  diabetes: "profile.health.diabetes",
  hypertension: "profile.health.hypertension",
  pregnancy: "profile.health.pregnancy",
  gout: "profile.health.gout",
  kidney: "profile.health.kidney",
  cholesterol: "profile.health.cholesterol",
  peanut: "profile.allergy.peanut",
  shellfish: "profile.allergy.shellfish",
  fish: "profile.allergy.fish",
  gluten: "profile.allergy.gluten",
  dairy: "profile.allergy.dairy",
  soy: "profile.allergy.soy",
  egg: "profile.allergy.egg",
  sesame: "profile.allergy.sesame",
  halal: "profile.diet.halal",
  "halal-uncertain": "result.halal.uncertain",
  vegetarian: "result.veg",
  vegan: "result.vegan",
  beef: "result.beef",
};

export function mismatchLabelKey(key: string): I18nKey | null {
  return MISMATCH_LABEL[key] ?? null;
}

export function collectMismatches(analysis: FoodAnalysis, profile: Profile): Mismatch[] {
  const out: Mismatch[] = [];
  const { flags } = analysis;

  if (profile.diet === "halal" && (flags.halal === "no" || flags.containsPork || flags.containsAlcohol)) {
    out.push({ key: "halal", kind: "diet" });
  }
  if (profile.diet === "halal" && flags.halal === "uncertain") {
    out.push({ key: "halal-uncertain", kind: "diet" });
  }
  if (
    (profile.diet === "vegetarian" || profile.diet === "vegan" || profile.diet === "buddhist") &&
    !flags.vegetarian
  ) {
    out.push({ key: "vegetarian", kind: "diet" });
  }
  if (profile.diet === "vegan" && !flags.vegan) {
    out.push({ key: "vegan", kind: "diet" });
  }
  if (profile.diet === "hindu" && flags.containsBeef) {
    out.push({ key: "beef", kind: "diet" });
  }

  const allergyMap: Record<string, () => boolean> = {
    peanut: () => analysis.allergens.some((a) => /peanut|kacang|groundnut/i.test(a)),
    shellfish: () => flags.containsShellfish,
    fish: () => analysis.allergens.some((a) => /\bfish\b|ikan|cá\b/i.test(a)),
    gluten: () => !flags.glutenFree && analysis.allergens.some((a) => /gluten|wheat|soy sauce/i.test(a)),
    dairy: () => analysis.allergens.some((a) => /milk|dairy|cheese|butter|cream/i.test(a)),
    soy: () => analysis.allergens.some((a) => /soy|soya|kedelai/i.test(a)),
    egg: () => analysis.allergens.some((a) => /egg|telur|trứng/i.test(a)),
    sesame: () => analysis.allergens.some((a) => /sesame|wijen|nga/i.test(a)),
  };

  for (const a of profile.allergies) {
    const hit =
      allergyMap[a]?.() ||
      analysis.cautions.some((c) => c.profileKeys.includes(a)) ||
      analysis.allergens.some((name) => name.toLowerCase().includes(a));
    if (hit) out.push({ key: a, kind: "allergy" });
  }

  for (const h of profile.health) {
    if (analysis.cautions.some((c) => c.profileKeys.includes(h))) {
      out.push({ key: h, kind: "health" });
    }
  }

  const seen = new Set<string>();
  return out.filter((m) => {
    if (seen.has(m.key)) return false;
    seen.add(m.key);
    return true;
  });
}

export function cautionIsPersonal(caution: Caution, profile: Profile): boolean {
  const keys = new Set<string>([
    ...profile.health,
    ...profile.allergies,
    profile.diet === "any" ? "" : profile.diet,
  ]);
  return caution.profileKeys.some((k) => keys.has(k) || (k === "hindu" && profile.diet === "hindu"));
}
