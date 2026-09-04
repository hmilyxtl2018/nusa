import type {
  BalanceLabel,
  Evidence,
  FoodAnalysis,
  HalalFlag,
  Severity,
} from "./types";
import type { PassA, PassB } from "./analyze-schema";

export function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
export function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
export function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
export function asStringArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

const EVIDENCE: Evidence[] = ["strong", "moderate", "traditional"];
const SEVERITY: Severity[] = ["low", "moderate", "high"];
const LABELS: BalanceLabel[] = ["nourishing", "balanced", "indulgent", "caution"];
const HALAL: HalalFlag[] = ["yes", "no", "uncertain"];

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence?.[1] ?? trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no json");
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
}

/** Normalize a partial-but-usable payload into a complete FoodAnalysis. */
export function normalizeAnalysis(raw: Record<string, unknown>): FoodAnalysis {
  const overallRaw = (raw.overall ?? {}) as Record<string, unknown>;
  const nutritionRaw = (raw.nutrition ?? {}) as Record<string, unknown>;
  const flagsRaw = (raw.flags ?? {}) as Record<string, unknown>;
  const label = LABELS.includes(overallRaw.label as BalanceLabel)
    ? (overallRaw.label as BalanceLabel)
    : "balanced";
  const halal = HALAL.includes(flagsRaw.halal as HalalFlag)
    ? (flagsRaw.halal as HalalFlag)
    : "uncertain";

  const foods = Array.isArray(raw.foods)
    ? raw.foods.slice(0, 10).map((item) => {
        const o = (item ?? {}) as Record<string, unknown>;
        return {
          name: asString(o.name, "—"),
          portion: asString(o.portion),
          role: asString(o.role),
        };
      })
    : [];

  const beneficial = Array.isArray(raw.beneficial)
    ? raw.beneficial.slice(0, 8).map((item) => {
        const o = (item ?? {}) as Record<string, unknown>;
        const evidence = EVIDENCE.includes(o.evidence as Evidence)
          ? (o.evidence as Evidence)
          : "moderate";
        return {
          component: asString(o.component, "—"),
          source: asString(o.source),
          effect: asString(o.effect),
          evidence,
          tags: asStringArr(o.tags).slice(0, 6),
        };
      })
    : [];

  const cautions = Array.isArray(raw.cautions)
    ? raw.cautions.slice(0, 8).map((item) => {
        const o = (item ?? {}) as Record<string, unknown>;
        const severity = SEVERITY.includes(o.severity as Severity)
          ? (o.severity as Severity)
          : "moderate";
        return {
          component: asString(o.component, "—"),
          source: asString(o.source),
          effect: asString(o.effect),
          severity,
          whoShouldCare: asString(o.whoShouldCare),
          profileKeys: asStringArr(o.profileKeys).slice(0, 8),
        };
      })
    : [];

  return {
    dishName: asString(raw.dishName, "Unknown plate"),
    localName: asString(raw.localName),
    cuisine: asString(raw.cuisine),
    region: asString(raw.region),
    mealType: asString(raw.mealType),
    confidence: clamp(asNumber(raw.confidence, 0.6), 0, 1),
    summary: asString(raw.summary),
    overall: {
      score: Math.round(clamp(asNumber(overallRaw.score, 62), 0, 100)),
      label,
      headline: asString(overallRaw.headline),
    },
    foods,
    beneficial,
    cautions,
    nutrition: {
      calories: Math.round(asNumber(nutritionRaw.calories, 0)),
      protein_g: Math.round(asNumber(nutritionRaw.protein_g, 0)),
      carbs_g: Math.round(asNumber(nutritionRaw.carbs_g, 0)),
      fat_g: Math.round(asNumber(nutritionRaw.fat_g, 0)),
      sodium_mg: Math.round(asNumber(nutritionRaw.sodium_mg, 0)),
      sugar_g: Math.round(asNumber(nutritionRaw.sugar_g, 0)),
      fiber_g: Math.round(asNumber(nutritionRaw.fiber_g, 0)),
      basis: asString(nutritionRaw.basis),
    },
    culturalNote: asString(raw.culturalNote),
    servingTips: asStringArr(raw.servingTips).slice(0, 6),
    pairingAdvice: asString(raw.pairingAdvice),
    allergens: asStringArr(raw.allergens).slice(0, 10),
    flags: {
      halal,
      vegetarian: asBool(flagsRaw.vegetarian),
      vegan: asBool(flagsRaw.vegan),
      glutenFree: asBool(flagsRaw.glutenFree),
      containsPork: asBool(flagsRaw.containsPork),
      containsAlcohol: asBool(flagsRaw.containsAlcohol),
      containsBeef: asBool(flagsRaw.containsBeef),
      containsShellfish: asBool(flagsRaw.containsShellfish),
    },
  };
}

/**
 * Light deterministic flag coherence for collectMismatches.
 * Keeps pork/alcohol/beef/shellfish consistent with diet flags.
 */
export function cohereFlags(analysis: FoodAnalysis): FoodAnalysis {
  const flags = { ...analysis.flags };
  let allergens = [...analysis.allergens];

  if (flags.containsPork || flags.containsAlcohol) {
    if (flags.halal === "yes") flags.halal = "no";
  }
  if (flags.containsPork) {
    flags.vegetarian = false;
    flags.vegan = false;
    if (!allergens.some((a) => /pork|lard|bacon/i.test(a))) {
      allergens = [...allergens, "pork"].slice(0, 10);
    }
  }
  if (flags.containsBeef) {
    flags.vegetarian = false;
    flags.vegan = false;
  }
  if (flags.containsShellfish) {
    flags.vegetarian = false;
    flags.vegan = false;
    if (!allergens.some((a) => /shellfish|shrimp|prawn|crab|lobster|squid/i.test(a))) {
      allergens = [...allergens, "shellfish"].slice(0, 10);
    }
  }
  if (flags.vegan) {
    flags.vegetarian = true;
  }
  // Vegan/vegetarian cannot claim pork/beef/shellfish presence
  if (flags.vegetarian && (flags.containsPork || flags.containsBeef || flags.containsShellfish)) {
    flags.vegetarian = false;
    flags.vegan = false;
  }

  return { ...analysis, flags, allergens };
}

/** Compose Pass A identity + Pass B depth into a complete FoodAnalysis. */
export function mergePassAB(passA: PassA, passB: PassB): FoodAnalysis {
  const merged: Record<string, unknown> = {
    dishName: passA.dishName,
    localName: passA.localName,
    cuisine: passA.cuisine,
    region: passA.region,
    mealType: passA.mealType,
    confidence: passA.confidence,
    summary: passB.summary?.trim() ? passB.summary : passA.summary,
    overall: passB.overall,
    foods: passA.foods,
    beneficial: passB.beneficial,
    cautions: passB.cautions,
    nutrition: passB.nutrition,
    culturalNote: passB.culturalNote,
    servingTips: passB.servingTips,
    pairingAdvice: passB.pairingAdvice,
    allergens: passB.allergens ?? passA.allergens,
    flags: passA.flags,
  };
  return cohereFlags(normalizeAnalysis(merged));
}
