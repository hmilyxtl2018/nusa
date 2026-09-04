/** Cost / latency knobs for plate analysis. Unset env must not break the app. */

export type VisionDetail = "auto" | "low" | "high";

const DEFAULT_MODEL = "grok-4.5";
const DEFAULT_FALLBACK_MODEL = "grok-4.6";

function env(name: string): string | undefined {
  const v = process.env[name];
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function parseDetail(raw: string | undefined, fallback: VisionDetail): VisionDetail {
  if (raw === "auto" || raw === "low" || raw === "high") return raw;
  return fallback;
}

/** Pass A (identity): cheaper vision detail. Default `auto`. */
export function getVisionDetailPassA(): VisionDetail {
  return parseDetail(env("NUSA_VISION_DETAIL_PASS_A"), "auto");
}

/** Pass B (deep): richer vision detail. Default `high`. */
export function getVisionDetailPassB(): VisionDetail {
  return parseDetail(env("NUSA_VISION_DETAIL_PASS_B"), "high");
}

export function getModelPassA(): string {
  return env("NUSA_MODEL_PASS_A") ?? DEFAULT_MODEL;
}

export function getModelPassB(): string {
  return env("NUSA_MODEL_PASS_B") ?? DEFAULT_MODEL;
}

/** Follow-up Q&A (no image). Default same primary model. */
export function getModelAsk(): string {
  return env("NUSA_MODEL_ASK") ?? DEFAULT_MODEL;
}

/** Fallback when primary returns 400/404. */
export function getFallbackModel(): string {
  return env("NUSA_MODEL_FALLBACK") ?? DEFAULT_FALLBACK_MODEL;
}
