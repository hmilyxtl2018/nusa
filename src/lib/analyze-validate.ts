import type { z } from "zod";
import { formatZodIssues } from "./analyze-schema";
import { parseJsonObject } from "./analyze-merge";

export type ChatRunner = (opts: {
  system: string;
  userText: string;
  imageDataUrl?: string;
  maxTokens: number;
  model: string;
  detail?: "auto" | "low" | "high";
}) => Promise<{ ok: true; text: string } | { ok: false; status: number }>;

/**
 * Parse model JSON, validate with Zod; on failure, ONE repair call including
 * validation errors, then re-parse/validate. Returns null if still invalid.
 */
export async function parseValidateRepair<T>(opts: {
  text: string;
  schema: z.ZodType<T>;
  runChat: ChatRunner;
  repairSystem: string;
  repairContext: string;
  model: string;
  imageDataUrl?: string;
  detail?: "auto" | "low" | "high";
  maxTokens?: number;
}): Promise<{ ok: true; data: T; repaired: boolean } | { ok: false; reason: string }> {
  const tryParse = (raw: string): { ok: true; data: T } | { ok: false; issues: string } => {
    let obj: Record<string, unknown>;
    try {
      obj = parseJsonObject(raw);
    } catch {
      return { ok: false, issues: "unparseable JSON" };
    }
    const result = opts.schema.safeParse(obj);
    if (result.success) return { ok: true, data: result.data };
    return { ok: false, issues: formatZodIssues(result.error) };
  };

  const first = tryParse(opts.text);
  if (first.ok) return { ok: true, data: first.data, repaired: false };

  const repair = await opts.runChat({
    system: opts.repairSystem,
    userText: `${opts.repairContext}\n\nValidation errors:\n${first.issues}\n\nPrevious JSON:\n${opts.text.slice(0, 6000)}\n\nReturn corrected JSON only.`,
    imageDataUrl: opts.imageDataUrl,
    maxTokens: opts.maxTokens ?? 2500,
    model: opts.model,
    detail: opts.detail,
  });

  if (!repair.ok) return { ok: false, reason: `repair_http_${repair.status}` };

  const second = tryParse(repair.text);
  if (second.ok) return { ok: true, data: second.data, repaired: true };
  return { ok: false, reason: second.issues };
}
