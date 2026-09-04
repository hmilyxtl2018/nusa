import { z } from "zod";

const evidenceSchema = z.enum(["strong", "moderate", "traditional"]);
const severitySchema = z.enum(["low", "moderate", "high"]);
const balanceLabelSchema = z.enum(["nourishing", "balanced", "indulgent", "caution"]);
const halalSchema = z.enum(["yes", "no", "uncertain"]);

const foodItemSchema = z.object({
  name: z.string(),
  portion: z.string().optional().default(""),
  role: z.string().optional().default(""),
});

const flagsSchema = z.object({
  halal: halalSchema,
  vegetarian: z.boolean(),
  vegan: z.boolean(),
  glutenFree: z.boolean(),
  containsPork: z.boolean(),
  containsAlcohol: z.boolean(),
  containsBeef: z.boolean(),
  containsShellfish: z.boolean(),
});

/** Pass A: dish identity + foods + flags (+ light summary). */
export const passASchema = z.object({
  dishName: z.string().min(1),
  localName: z.string().optional().default(""),
  cuisine: z.string().optional().default(""),
  region: z.string().optional().default(""),
  mealType: z.string().optional().default(""),
  confidence: z.number().min(0).max(1),
  summary: z.string().optional().default(""),
  foods: z.array(foodItemSchema).min(1),
  allergens: z.array(z.string()).optional().default([]),
  flags: flagsSchema,
});

export type PassA = z.infer<typeof passASchema>;

const benefitSchema = z.object({
  component: z.string(),
  source: z.string().optional().default(""),
  effect: z.string().optional().default(""),
  evidence: evidenceSchema,
  tags: z.array(z.string()).optional().default([]),
});

const cautionSchema = z.object({
  component: z.string(),
  source: z.string().optional().default(""),
  effect: z.string().optional().default(""),
  severity: severitySchema,
  whoShouldCare: z.string().optional().default(""),
  profileKeys: z.array(z.string()).optional().default([]),
});

const nutritionSchema = z.object({
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  sodium_mg: z.number(),
  sugar_g: z.number(),
  fiber_g: z.number(),
  basis: z.string().optional().default(""),
});

/** Pass B: deep nutrition / culture / scoring fields. */
export const passBSchema = z.object({
  summary: z.string().optional(),
  overall: z.object({
    score: z.number().min(0).max(100),
    label: balanceLabelSchema,
    headline: z.string().optional().default(""),
  }),
  beneficial: z.array(benefitSchema).optional().default([]),
  cautions: z.array(cautionSchema).optional().default([]),
  nutrition: nutritionSchema,
  culturalNote: z.string().optional().default(""),
  servingTips: z.array(z.string()).optional().default([]),
  pairingAdvice: z.string().optional().default(""),
  allergens: z.array(z.string()).optional(),
});

export type PassB = z.infer<typeof passBSchema>;

export const notFoodSchema = z.object({
  error: z.literal("not_food"),
  message: z.string().optional(),
});

/** Loose final FoodAnalysis shape used after merge (partial ok → normalize). */
export const foodAnalysisLooseSchema = z.object({
  dishName: z.string().optional(),
  localName: z.string().optional(),
  cuisine: z.string().optional(),
  region: z.string().optional(),
  mealType: z.string().optional(),
  confidence: z.number().optional(),
  summary: z.string().optional(),
  overall: z
    .object({
      score: z.number().optional(),
      label: z.string().optional(),
      headline: z.string().optional(),
    })
    .optional(),
  foods: z.array(z.unknown()).optional(),
  beneficial: z.array(z.unknown()).optional(),
  cautions: z.array(z.unknown()).optional(),
  nutrition: z.record(z.string(), z.unknown()).optional(),
  culturalNote: z.string().optional(),
  servingTips: z.array(z.string()).optional(),
  pairingAdvice: z.string().optional(),
  allergens: z.array(z.string()).optional(),
  flags: z.record(z.string(), z.unknown()).optional(),
});

export function formatZodIssues(err: z.ZodError): string {
  return err.issues
    .slice(0, 12)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}
