import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cohereFlags,
  mergePassAB,
  normalizeAnalysis,
  parseJsonObject,
} from "./analyze-merge.ts";
import type { PassA, PassB } from "./analyze-schema.ts";

const basePassA = (): PassA => ({
  dishName: "Nasi Lemak",
  localName: "Nasi Lemak",
  cuisine: "Malay",
  region: "Malaysia",
  mealType: "breakfast",
  confidence: 0.9,
  summary: "Coconut rice with sambal and sides.",
  foods: [
    { name: "Coconut rice", portion: "1 scoop", role: "staple" },
    { name: "Sambal", portion: "2 tbsp", role: "condiment" },
    { name: "Fried anchovies", portion: "small", role: "protein" },
  ],
  allergens: ["fish", "peanut"],
  flags: {
    halal: "yes",
    vegetarian: false,
    vegan: false,
    glutenFree: true,
    containsPork: false,
    containsAlcohol: false,
    containsBeef: false,
    containsShellfish: false,
  },
});

const basePassB = (): PassB => ({
  summary: "A classic Malay breakfast plate with coconut rice and spicy sambal.",
  overall: { score: 68, label: "balanced", headline: "Comforting and fiery" },
  beneficial: [
    {
      component: "capsaicin",
      source: "Sambal",
      effect: "May support metabolism.",
      evidence: "moderate",
      tags: ["chili"],
    },
  ],
  cautions: [
    {
      component: "sodium",
      source: "Sambal / ikan bilis",
      effect: "Can raise blood pressure when frequent.",
      severity: "moderate",
      whoShouldCare: "People watching blood pressure",
      profileKeys: ["hypertension"],
    },
  ],
  nutrition: {
    calories: 650,
    protein_g: 18,
    carbs_g: 80,
    fat_g: 28,
    sodium_mg: 900,
    sugar_g: 8,
    fiber_g: 4,
    basis: "one hawker plate",
  },
  culturalNote: "Often eaten for breakfast across Malaysia and Singapore.",
  servingTips: ["Eat sambal sparingly if sensitive to spice"],
  pairingAdvice: "Pair with cucumber and a soft-boiled egg.",
  allergens: ["fish", "peanut", "egg"],
});

describe("parseJsonObject", () => {
  it("parses fenced and bare JSON", () => {
    assert.equal(parseJsonObject('{"a":1}').a, 1);
    assert.equal(parseJsonObject('```json\n{"a":2}\n```').a, 2);
  });

  it("throws when no object", () => {
    assert.throws(() => parseJsonObject("nope"));
  });
});

describe("mergePassAB", () => {
  it("composes identity from A and depth from B", () => {
    const analysis = mergePassAB(basePassA(), basePassB());
    assert.equal(analysis.dishName, "Nasi Lemak");
    assert.equal(analysis.cuisine, "Malay");
    assert.equal(analysis.foods.length, 3);
    assert.equal(analysis.overall.score, 68);
    assert.equal(analysis.overall.label, "balanced");
    assert.equal(analysis.beneficial[0]?.component, "capsaicin");
    assert.equal(analysis.nutrition.calories, 650);
    assert.match(analysis.summary, /classic Malay/);
    assert.ok(analysis.allergens.includes("egg"));
  });

  it("keeps Pass A summary when Pass B omits it", () => {
    const b = basePassB();
    delete b.summary;
    const analysis = mergePassAB(basePassA(), b);
    assert.match(analysis.summary, /Coconut rice/);
  });
});

describe("cohereFlags", () => {
  it("forces halal no when pork present", () => {
    const raw = normalizeAnalysis({
      dishName: "Char siu",
      flags: {
        halal: "yes",
        vegetarian: true,
        vegan: true,
        glutenFree: false,
        containsPork: true,
        containsAlcohol: false,
        containsBeef: false,
        containsShellfish: false,
      },
      foods: [{ name: "Pork", portion: "1", role: "protein" }],
    });
    const fixed = cohereFlags(raw);
    assert.equal(fixed.flags.halal, "no");
    assert.equal(fixed.flags.vegetarian, false);
    assert.equal(fixed.flags.vegan, false);
    assert.ok(fixed.allergens.some((a) => /pork/i.test(a)));
  });

  it("clears vegetarian when shellfish present", () => {
    const raw = normalizeAnalysis({
      dishName: "Prawn mee",
      flags: {
        halal: "uncertain",
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        containsPork: false,
        containsAlcohol: false,
        containsBeef: false,
        containsShellfish: true,
      },
      foods: [{ name: "Prawns", portion: "6", role: "protein" }],
    });
    const fixed = cohereFlags(raw);
    assert.equal(fixed.flags.vegetarian, false);
    assert.ok(fixed.allergens.some((a) => /shellfish/i.test(a)));
  });
});
