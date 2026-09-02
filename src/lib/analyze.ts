import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LANG_PROMPT } from "./i18n";
import type {
  AllergyFlag,
  BalanceLabel,
  Diet,
  Evidence,
  FoodAnalysis,
  HalalFlag,
  HealthFlag,
  Lang,
  Profile,
  Severity,
} from "./types";

const profileSchema = z.object({
  diet: z.enum([
    "any",
    "halal",
    "vegetarian",
    "vegan",
    "buddhist",
    "hindu",
  ]),
  health: z.array(
    z.enum([
      "diabetes",
      "hypertension",
      "pregnancy",
      "gout",
      "kidney",
      "cholesterol",
    ]),
  ),
  allergies: z.array(
    z.enum([
      "peanut",
      "shellfish",
      "fish",
      "gluten",
      "dairy",
      "soy",
      "egg",
      "sesame",
    ]),
  ),
});

const analyzeInput = z.object({
  imageDataUrl: z.string().min(32).max(2_500_000),
  lang: z.enum(["en", "id", "ms", "th", "vi", "fil", "zh", "km", "lo", "my"]),
  profile: profileSchema,
  note: z.string().max(280).optional(),
});

const askInput = z.object({
  question: z.string().min(1).max(400),
  lang: z.enum(["en", "id", "ms", "th", "vi", "fil", "zh", "km", "lo", "my"]),
  profile: profileSchema,
  analysis: z.unknown(),
});

type AnalyzeOk = { ok: true; analysis: FoodAnalysis };
type AnalyzeErr = {
  ok: false;
  error: "unavailable" | "not_food" | "fail" | "bad_image";
  message?: string;
};
export type AnalyzeResult = AnalyzeOk | AnalyzeErr;

type AskOk = { ok: true; text: string };
type AskErr = { ok: false; error: "unavailable" | "fail" };
export type AskResult = AskOk | AskErr;

function systemPrompt(lang: Lang, profile: Profile) {
  const language = LANG_PROMPT[lang];
  const diet = profile.diet;
  const health = profile.health.join(", ") || "none";
  const allergies = profile.allergies.join(", ") || "none";
  return `You are Nusa, a food-intelligence dietitian who knows Southeast Asian cuisines in depth: Malaysia, Indonesia, Singapore, Brunei, Thailand, Vietnam, Philippines, Cambodia, Laos, Myanmar. You read meal photographs from hawkers, warungs, street stalls, home kitchens and restaurants.

Write EVERY user-facing string in ${language}. Keep JSON keys in English exactly as specified.

Be culturally fluent and non-moralising. Fried food, coconut milk, sambal, fish sauce and palm sugar are cuisine, not sins. Explain tradeoffs. Distinguish clinical evidence from traditional use. Do not invent scare stories about MSG; treat it as a sodium-containing flavour salt. Do not claim to diagnose disease.

The eater's profile:
- diet: ${diet}
- health flags: ${health}
- allergies: ${allergies}

Halal: pork, lard, alcohol, non-halal gelatin, and uncertain street-stall oils should make halal "no" or "uncertain". Hindu: flag beef. Buddhist vegetarian: flag meat, fish sauce, shrimp paste, garlic/onion if clearly present.

If the image is not a meal or edible dish, return {"error":"not_food","message":"<short message in ${language}>"}.

Otherwise return ONLY a JSON object with this shape:
{
  "dishName": string,
  "localName": string,
  "cuisine": string,
  "region": string,
  "mealType": string,
  "confidence": number (0-1),
  "summary": string (2-3 sentences, calm, specific to THIS plate),
  "overall": {
    "score": number (0-100, 55-80 for typical mixed hawker plates),
    "label": "nourishing" | "balanced" | "indulgent" | "caution",
    "headline": string
  },
  "foods": [{ "name": string, "portion": string, "role": string }],
  "beneficial": [{
    "component": string (name the compound or nutrient, e.g. curcumin, capsaicin, EPA/DHA, resistant starch),
    "source": string (which food on THIS plate),
    "effect": string (what it does in the body, 1-2 sentences),
    "evidence": "strong" | "moderate" | "traditional",
    "tags": string[]
  }],
  "cautions": [{
    "component": string,
    "source": string,
    "effect": string,
    "severity": "low" | "moderate" | "high",
    "whoShouldCare": string,
    "profileKeys": string[] (subset of diabetes, hypertension, pregnancy, gout, kidney, cholesterol, peanut, shellfish, fish, gluten, dairy, soy, egg, sesame, halal, vegetarian, vegan, hindu)
  }],
  "nutrition": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "sodium_mg": number,
    "sugar_g": number,
    "fiber_g": number,
    "basis": string (e.g. "one hawker plate")
  },
  "culturalNote": string,
  "servingTips": string[] (2-4 practical tips),
  "pairingAdvice": string,
  "allergens": string[],
  "flags": {
    "halal": "yes" | "no" | "uncertain",
    "vegetarian": boolean,
    "vegan": boolean,
    "glutenFree": boolean,
    "containsPork": boolean,
    "containsAlcohol": boolean,
    "containsBeef": boolean,
    "containsShellfish": boolean
  }
}

List 3-6 beneficial items and 3-6 cautions when the plate supports it. Nutrition is an estimate for the visible portion, not lab data. Prefer named phytochemicals and culinary ingredients over generic "vitamins".`;
}

async function chatCompletions(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  return { ok: res.ok, status: res.status, text: raw };
}

function extractMessage(raw: string): string {
  const body = JSON.parse(raw) as {
    choices?: { message?: { content?: string | null } }[];
  };
  return body.choices?.[0]?.message?.content ?? "";
}

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence?.[1] ?? trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no json");
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function asStringArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

const EVIDENCE: Evidence[] = ["strong", "moderate", "traditional"];
const SEVERITY: Severity[] = ["low", "moderate", "high"];
const LABELS: BalanceLabel[] = ["nourishing", "balanced", "indulgent", "caution"];
const HALAL: HalalFlag[] = ["yes", "no", "uncertain"];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizeAnalysis(raw: Record<string, unknown>): FoodAnalysis {
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

async function runChat(opts: {
  apiKey: string;
  system: string;
  userText: string;
  imageDataUrl?: string;
  maxTokens: number;
}): Promise<{ ok: true; text: string } | { ok: false; status: number }> {
  const userContent = opts.imageDataUrl
    ? [
        {
          type: "image_url",
          image_url: { url: opts.imageDataUrl, detail: "high" },
        },
        { type: "text", text: opts.userText },
      ]
    : opts.userText;

  const base = {
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: userContent },
    ],
    temperature: 0.3,
    max_tokens: opts.maxTokens,
    response_format: { type: "json_object" },
  };

  let result = await chatCompletions(opts.apiKey, { model: "grok-4.5", ...base });
  if (!result.ok && (result.status === 400 || result.status === 404)) {
    result = await chatCompletions(opts.apiKey, { model: "grok-4.6", ...base });
  }
  if (!result.ok) return { ok: false, status: result.status };
  try {
    return { ok: true, text: extractMessage(result.text) };
  } catch {
    return { ok: false, status: 500 };
  }
}

export const analyzePlate = createServerFn({ method: "POST" })
  .validator((input: unknown) => analyzeInput.parse(input))
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "unavailable" };
    if (!data.imageDataUrl.startsWith("data:image/")) {
      return { ok: false, error: "bad_image" };
    }

    const note = data.note?.trim()
      ? `Eater's note: ${data.note.trim()}`
      : "No extra note.";

    const result = await runChat({
      apiKey,
      system: systemPrompt(data.lang, data.profile),
      userText: `Analyse this meal photograph. ${note} Return the JSON object only.`,
      imageDataUrl: data.imageDataUrl,
      maxTokens: 3500,
    });

    if (!result.ok) {
      return { ok: false, error: result.status === 401 ? "unavailable" : "fail" };
    }

    try {
      const parsed = parseJsonObject(result.text);
      if (parsed.error === "not_food") {
        return {
          ok: false,
          error: "not_food",
          message: asString(parsed.message),
        };
      }
      return { ok: true, analysis: normalizeAnalysis(parsed) };
    } catch {
      return { ok: false, error: "fail" };
    }
  });

export const askAboutPlate = createServerFn({ method: "POST" })
  .validator((input: unknown) => askInput.parse(input))
  .handler(async ({ data }): Promise<AskResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "unavailable" };

    const language = LANG_PROMPT[data.lang as Lang];
    const compact = JSON.stringify(data.analysis).slice(0, 6000);
    const diet = (data.profile as Profile).diet as Diet;
    const health = (data.profile as { health: HealthFlag[] }).health.join(", ") || "none";
    const allergies =
      (data.profile as { allergies: AllergyFlag[] }).allergies.join(", ") || "none";

    const result = await runChat({
      apiKey,
      system: `You are Nusa, continuing a conversation about one analysed Southeast Asian meal. Answer in ${language}. Be specific to THIS plate. Not medical advice. Return JSON {"answer":"..." } with 1-3 short paragraphs, no markdown.`,
      userText: `Profile diet=${diet}; health=${health}; allergies=${allergies}.\nAnalysis JSON:\n${compact}\n\nQuestion: ${data.question}`,
      maxTokens: 700,
    });

    if (!result.ok) return { ok: false, error: "fail" };
    try {
      const parsed = parseJsonObject(result.text);
      const text = asString(parsed.answer) || asString(parsed.text) || result.text;
      return { ok: true, text: text.trim() };
    } catch {
      return { ok: true, text: result.text.trim() };
    }
  });
