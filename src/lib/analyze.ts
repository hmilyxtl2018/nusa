import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LANG_PROMPT } from "./i18n";
import type {
  AllergyFlag,
  Diet,
  FoodAnalysis,
  HealthFlag,
  Lang,
  Profile,
} from "./types";
import {
  getFallbackModel,
  getModelAsk,
  getModelPassA,
  getModelPassB,
  getVisionDetailPassA,
  getVisionDetailPassB,
  type VisionDetail,
} from "./analyze-config";
import { asString, mergePassAB, parseJsonObject } from "./analyze-merge";
import { notFoodSchema, passASchema, passBSchema } from "./analyze-schema";
import { parseValidateRepair, type ChatRunner } from "./analyze-validate";

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

function profileBlurb(profile: Profile) {
  const diet = profile.diet;
  const health = profile.health.join(", ") || "none";
  const allergies = profile.allergies.join(", ") || "none";
  return `The eater's profile:
- diet: ${diet}
- health flags: ${health}
- allergies: ${allergies}

Halal: pork, lard, alcohol, non-halal gelatin, and uncertain street-stall oils should make halal "no" or "uncertain". Hindu: flag beef. Buddhist vegetarian: flag meat, fish sauce, shrimp paste, garlic/onion if clearly present.`;
}

function voicePreamble(lang: Lang) {
  const language = LANG_PROMPT[lang];
  return `You are Nusa, a food-intelligence dietitian who knows Southeast Asian cuisines in depth: Malaysia, Indonesia, Singapore, Brunei, Thailand, Vietnam, Philippines, Cambodia, Laos, Myanmar. You read meal photographs from hawkers, warungs, street stalls, home kitchens and restaurants.

Write EVERY user-facing string in ${language}. Keep JSON keys in English exactly as specified.

Be culturally fluent and non-moralising. Fried food, coconut milk, sambal, fish sauce and palm sugar are cuisine, not sins. Explain tradeoffs. Distinguish clinical evidence from traditional use. Do not invent scare stories about MSG; treat it as a sodium-containing flavour salt. Do not claim to diagnose disease.`;
}

function passASystemPrompt(lang: Lang, profile: Profile) {
  return `${voicePreamble(lang)}

${profileBlurb(profile)}

This is Pass A (fast identity). Focus on what is on the plate.

If the image is not a meal or edible dish, return {"error":"not_food","message":"<short message in ${LANG_PROMPT[lang]}>"}.

Otherwise return ONLY a JSON object with this shape:
{
  "dishName": string,
  "localName": string,
  "cuisine": string,
  "region": string,
  "mealType": string,
  "confidence": number (0-1),
  "summary": string (1-2 sentences naming the plate),
  "foods": [{ "name": string, "portion": string, "role": string }],
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

List the visible foods (2-8). Be decisive on flags when the plate is clear.`;
}

function passBSystemPrompt(lang: Lang, profile: Profile) {
  return `${voicePreamble(lang)}

${profileBlurb(profile)}

This is Pass B (deep analysis). You already have Pass A identity JSON. Enrich the SAME plate — do not rename the dish unless Pass A is clearly wrong.

Return ONLY a JSON object with this shape:
{
  "summary": string (2-3 sentences, calm, specific to THIS plate; optional if Pass A summary is already good),
  "overall": {
    "score": number (0-100, 55-80 for typical mixed hawker plates),
    "label": "nourishing" | "balanced" | "indulgent" | "caution",
    "headline": string
  },
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
  "allergens": string[]
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

function makeRunChat(apiKey: string): ChatRunner {
  return async (opts) => {
    const detail: VisionDetail = opts.detail ?? "auto";
    const userContent = opts.imageDataUrl
      ? [
          {
            type: "image_url",
            image_url: { url: opts.imageDataUrl, detail },
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

    const primary = opts.model;
    const fallback = getFallbackModel();
    let result = await chatCompletions(apiKey, { model: primary, ...base });
    if (
      !result.ok &&
      (result.status === 400 || result.status === 404) &&
      fallback !== primary
    ) {
      result = await chatCompletions(apiKey, { model: fallback, ...base });
    }
    if (!result.ok) return { ok: false, status: result.status };
    try {
      return { ok: true, text: extractMessage(result.text) };
    } catch {
      return { ok: false, status: 500 };
    }
  };
}

/** Exported for unit tests: run Pass A then Pass B and merge. */
export async function analyzePlateTwoPhase(opts: {
  apiKey: string;
  lang: Lang;
  profile: Profile;
  imageDataUrl: string;
  note?: string;
  runChat?: ChatRunner;
}): Promise<AnalyzeResult> {
  const runChat = opts.runChat ?? makeRunChat(opts.apiKey);
  const note = opts.note?.trim()
    ? `Eater's note: ${opts.note.trim()}`
    : "No extra note.";
  const modelA = getModelPassA();
  const modelB = getModelPassB();
  const detailA = getVisionDetailPassA();
  const detailB = getVisionDetailPassB();

  // --- Pass A ---
  const passARaw = await runChat({
    system: passASystemPrompt(opts.lang, opts.profile),
    userText: `Analyse this meal photograph (Pass A — identity). ${note} Return the JSON object only.`,
    imageDataUrl: opts.imageDataUrl,
    maxTokens: 1600,
    model: modelA,
    detail: detailA,
  });

  if (!passARaw.ok) {
    return { ok: false, error: passARaw.status === 401 ? "unavailable" : "fail" };
  }

  // Detect not_food before schema validation
  try {
    const early = parseJsonObject(passARaw.text);
    const nf = notFoodSchema.safeParse(early);
    if (nf.success) {
      return {
        ok: false,
        error: "not_food",
        message: asString(nf.data.message),
      };
    }
  } catch {
    // fall through to validate/repair
  }

  const passAValidated = await parseValidateRepair({
    text: passARaw.text,
    schema: passASchema,
    runChat,
    repairSystem: passASystemPrompt(opts.lang, opts.profile),
    repairContext: "Fix Pass A JSON so it matches the required schema.",
    model: modelA,
    imageDataUrl: opts.imageDataUrl,
    detail: detailA,
    maxTokens: 1600,
  });

  if (!passAValidated.ok) {
    // Re-check not_food on original if repair failed
    try {
      const early = parseJsonObject(passARaw.text);
      if (early.error === "not_food") {
        return {
          ok: false,
          error: "not_food",
          message: asString(early.message),
        };
      }
    } catch {
      /* ignore */
    }
    return { ok: false, error: "fail" };
  }

  // --- Pass B ---
  const passAJson = JSON.stringify(passAValidated.data);
  const passBRaw = await runChat({
    system: passBSystemPrompt(opts.lang, opts.profile),
    userText: `Pass A JSON:\n${passAJson}\n\nEnrich this same plate (Pass B — deep). ${note} Return the JSON object only.`,
    imageDataUrl: opts.imageDataUrl,
    maxTokens: 2800,
    model: modelB,
    detail: detailB,
  });

  if (!passBRaw.ok) {
    return { ok: false, error: passBRaw.status === 401 ? "unavailable" : "fail" };
  }

  const passBValidated = await parseValidateRepair({
    text: passBRaw.text,
    schema: passBSchema,
    runChat,
    repairSystem: passBSystemPrompt(opts.lang, opts.profile),
    repairContext: `Fix Pass B JSON so it matches the required schema.\nPass A was:\n${passAJson.slice(0, 3000)}`,
    model: modelB,
    imageDataUrl: opts.imageDataUrl,
    detail: detailB,
    maxTokens: 2800,
  });

  if (!passBValidated.ok) {
    return { ok: false, error: "fail" };
  }

  const analysis = mergePassAB(passAValidated.data, passBValidated.data);
  return { ok: true, analysis };
}

export const analyzePlate = createServerFn({ method: "POST" })
  .validator((input: unknown) => analyzeInput.parse(input))
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "unavailable" };
    if (!data.imageDataUrl.startsWith("data:image/")) {
      return { ok: false, error: "bad_image" };
    }

    return analyzePlateTwoPhase({
      apiKey,
      lang: data.lang,
      profile: data.profile,
      imageDataUrl: data.imageDataUrl,
      note: data.note,
    });
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

    const runChat = makeRunChat(apiKey);
    const result = await runChat({
      system: `You are Nusa, continuing a conversation about one analysed Southeast Asian meal. Answer in ${language}. Be specific to THIS plate. Not medical advice. Return JSON {"answer":"..." } with 1-3 short paragraphs, no markdown.`,
      userText: `Profile diet=${diet}; health=${health}; allergies=${allergies}.\nAnalysis JSON:\n${compact}\n\nQuestion: ${data.question}`,
      maxTokens: 700,
      model: getModelAsk(),
      // no image — cheaper text-only follow-up
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
