import type { BalanceLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  label,
  caption,
}: {
  score: number;
  label: string;
  caption?: string;
  tone?: BalanceLabel;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * c;
  const color =
    clamped >= 72
      ? "var(--color-benefit)"
      : clamped >= 48
        ? "var(--color-primary)"
        : "var(--color-caution)";

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-[104px] shrink-0">
        <svg viewBox="0 0 104 104" className="size-full -rotate-90">
          <circle
            cx="52"
            cy="52"
            r={r}
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth="8"
          />
          <circle
            cx="52"
            cy="52"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            className="transition-[stroke-dasharray] duration-500 ease-[var(--ease-smooth-out)]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-medium tabular-nums leading-none tracking-tight">
            {Math.round(clamped)}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className={cn("font-display text-xl font-medium tracking-[-0.03em]")}>
          {label}
        </p>
        {caption ? (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {caption}
          </p>
        ) : null}
      </div>
    </div>
  );
}
