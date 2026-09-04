import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { parseValidateRepair, type ChatRunner } from "./analyze-validate.ts";
import { passASchema } from "./analyze-schema.ts";

const tinySchema = z.object({
  dishName: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

describe("parseValidateRepair", () => {
  it("returns data without repair when valid", async () => {
    const runChat: ChatRunner = async () => {
      throw new Error("should not repair");
    };
    const result = await parseValidateRepair({
      text: '{"dishName":"Laksa","confidence":0.8}',
      schema: tinySchema,
      runChat,
      repairSystem: "fix",
      repairContext: "ctx",
      model: "grok-4.5",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.repaired, false);
      assert.equal(result.data.dishName, "Laksa");
    }
  });

  it("repairs once on validation failure", async () => {
    let calls = 0;
    const runChat: ChatRunner = async () => {
      calls += 1;
      return {
        ok: true,
        text: '{"dishName":"Laksa","confidence":0.7}',
      };
    };
    const result = await parseValidateRepair({
      text: '{"dishName":"","confidence":2}',
      schema: tinySchema,
      runChat,
      repairSystem: "fix",
      repairContext: "ctx",
      model: "grok-4.5",
    });
    assert.equal(calls, 1);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.repaired, true);
      assert.equal(result.data.dishName, "Laksa");
    }
  });

  it("fails when repair still invalid", async () => {
    const runChat: ChatRunner = async () => ({
      ok: true,
      text: '{"dishName":"","confidence":9}',
    });
    const result = await parseValidateRepair({
      text: "not json at all",
      schema: tinySchema,
      runChat,
      repairSystem: "fix",
      repairContext: "ctx",
      model: "grok-4.5",
    });
    assert.equal(result.ok, false);
  });

  it("accepts a realistic Pass A payload", async () => {
    const payload = {
      dishName: "Pad Thai",
      localName: "ผัดไทย",
      cuisine: "Thai",
      region: "Thailand",
      mealType: "lunch",
      confidence: 0.85,
      summary: "Stir-fried rice noodles with tamarind.",
      foods: [{ name: "Rice noodles", portion: "1 plate", role: "staple" }],
      allergens: ["peanut", "egg", "shellfish"],
      flags: {
        halal: "uncertain",
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        containsPork: false,
        containsAlcohol: false,
        containsBeef: false,
        containsShellfish: true,
      },
    };
    const runChat: ChatRunner = async () => {
      throw new Error("no repair");
    };
    const result = await parseValidateRepair({
      text: JSON.stringify(payload),
      schema: passASchema,
      runChat,
      repairSystem: "fix",
      repairContext: "ctx",
      model: "grok-4.5",
    });
    assert.equal(result.ok, true);
  });
});
