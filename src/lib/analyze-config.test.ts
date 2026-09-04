import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getFallbackModel,
  getModelAsk,
  getModelPassA,
  getModelPassB,
  getVisionDetailPassA,
  getVisionDetailPassB,
} from "./analyze-config.ts";

const KEYS = [
  "NUSA_VISION_DETAIL_PASS_A",
  "NUSA_VISION_DETAIL_PASS_B",
  "NUSA_MODEL_PASS_A",
  "NUSA_MODEL_PASS_B",
  "NUSA_MODEL_ASK",
  "NUSA_MODEL_FALLBACK",
] as const;

const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};

describe("analyze-config defaults", () => {
  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of KEYS) {
      const v = saved[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("uses sensible defaults when unset", () => {
    assert.equal(getVisionDetailPassA(), "auto");
    assert.equal(getVisionDetailPassB(), "high");
    assert.equal(getModelPassA(), "grok-4.5");
    assert.equal(getModelPassB(), "grok-4.5");
    assert.equal(getModelAsk(), "grok-4.5");
    assert.equal(getFallbackModel(), "grok-4.6");
  });

  it("honours env overrides", () => {
    process.env.NUSA_VISION_DETAIL_PASS_A = "low";
    process.env.NUSA_VISION_DETAIL_PASS_B = "auto";
    process.env.NUSA_MODEL_PASS_A = "grok-fast";
    process.env.NUSA_MODEL_ASK = "grok-mini";
    assert.equal(getVisionDetailPassA(), "low");
    assert.equal(getVisionDetailPassB(), "auto");
    assert.equal(getModelPassA(), "grok-fast");
    assert.equal(getModelAsk(), "grok-mini");
  });

  it("ignores invalid detail values", () => {
    process.env.NUSA_VISION_DETAIL_PASS_A = "ultra";
    assert.equal(getVisionDetailPassA(), "auto");
  });
});
