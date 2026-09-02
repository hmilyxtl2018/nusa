import type { ScanRecord } from "./types";

const KEY = "nusa-last-scan";

export function rememberScan(scan: ScanRecord, photo: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ scan, photo }));
  } catch {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ scan, photo: scan.thumb }));
    } catch {
      /* quota — in-memory store still holds the scan */
    }
  }
}

export function recallScan(id: string): { scan: ScanRecord; photo: string } | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { scan?: ScanRecord; photo?: string };
    if (!parsed?.scan || parsed.scan.id !== id) return null;
    return { scan: parsed.scan, photo: parsed.photo ?? parsed.scan.thumb ?? "" };
  } catch {
    return null;
  }
}
