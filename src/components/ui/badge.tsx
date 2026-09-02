import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tracking-[0.01em]",
  {
    variants: {
      tone: {
        muted: "bg-secondary text-muted-foreground",
        primary: "bg-primary/10 text-primary",
        benefit: "bg-benefit-bg text-benefit-fg",
        caution: "bg-caution-bg text-caution-fg",
        ink: "bg-foreground text-background",
      },
    },
    defaultVariants: { tone: "muted" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}
