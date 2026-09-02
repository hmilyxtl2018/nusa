import { cn } from "@/lib/utils";

export function NusaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-primary", className)}
      aria-hidden
    >
      <circle
        cx="16"
        cy="16.4"
        r="11.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="16"
        cy="16.4"
        r="7.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.55"
      />
      <path
        d="M22.4 7.2c1.8 1.1 2.6 3.2 1.7 5.1-.7 1.4-2.1 2.1-3.5 2.1-1.1-2.2-.4-4.7 1.8-7.2z"
        fill="currentColor"
      />
      <path
        d="M21.2 9.1c.9 1.4 1 2.9.4 4"
        fill="none"
        stroke="var(--color-background)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NusaWordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <NusaMark className={cn("size-7", markClassName)} />
      <span className="font-display text-[1.35rem] font-medium tracking-[-0.04em] text-foreground">
        Nusa
      </span>
    </span>
  );
}
