import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzePlateTwoPhase } from "./analyze.ts";
import type { ChatRunner } from "./analyze-validate.ts";

describe("analyzePlateTwoPhase", () => {
  it("merges Pass A + Pass B via mocked chat", async () => {
    let call = 0;
    const runChat: ChatRunner = async (opts) => {
      call += 1;
      const isPassA = opts.system.includes("Pass A (fast identity)");
      const isPassB = opts.system.includes("Pass B (deep analysis)");
      if (isPassA) {
        return {
          ok: true,
          text: JSON.stringify({
            dishName: "Nasi Goreng",
            localName: "Nasi Goreng",
            cuisine: "Indonesian",
            region: "Indonesia",
            mealType: "dinner",
            confidence: 0.88,
            summary: "Fried rice plate.",
            foods: [{ name: "Fried rice", portion: "1 plate", role: "staple" }],
            allergens: ["egg", "soy"],
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
          }),
        };
      }
      if (isPassB) {
        return {
          ok: true,
          text: JSON.stringify({
            summary: "A savoury Indonesian fried rice with aromatics.",
            overall: { score: 70, label: "balanced", headline: "Comforting wok heat" },
            beneficial: [
              {
                component: "allicin",
                source: "Garlic",
                effect: "Supports cardiovascular tone in culinary amounts.",
                evidence: "moderate",
                tags: ["allium"],
              },
            ],
            cautions: [
              {
                component: "sodium",
                source: "Soy sauce",
                effect: "Adds salt load.",
                severity: "moderate",
                whoShouldCare: "Hypertension",
                profileKeys: ["hypertension"],
              },
            ],
            nutrition: {
              calories: 550,
              protein_g: 16,
              carbs_g: 70,
              fat_g: 20,
              sodium_mg: 1100,
              sugar_g: 6,
              fiber_g: 3,
              basis: "one plate",
            },
            culturalNote: "Street-stall staple across the archipelago.",
            servingTips: ["Add cucumber on the side"],
            pairingAdvice: "Iced tea or teh tarik.",
            allergens: ["egg", "soy"],
          }),
        };
      }
      return { ok: false, status: 500 };
    };

    const result = await analyzePlateTwoPhase({
      apiKey: "test-key",
      lang: "en",
      profile: { diet: "halal", health: [], allergies: [] },
      imageDataUrl: "data:image/jpeg;base64,aaaa",
      runChat,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.analysis.dishName, "Nasi Goreng");
      assert.equal(result.analysis.overall.score, 70);
      assert.equal(result.analysis.beneficial[0]?.component, "allicin");
      assert.ok(call >= 2);
    }
  });

  it("returns not_food from Pass A", async () => {
    const runChat: ChatRunner = async () => ({
      ok: true,
      text: JSON.stringify({ error: "not_food", message: "That is a bicycle." }),
    });
    const result = await analyzePlateTwoPhase({
      apiKey: "test-key",
      lang: "en",
      profile: { diet: "any", health: [], allergies: [] },
      imageDataUrl: "data:image/jpeg;base64,aaaa",
      runChat,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "not_food");
      assert.match(result.message ?? "", /bicycle/);
    }
  });
});
