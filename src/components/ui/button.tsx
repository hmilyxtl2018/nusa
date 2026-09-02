import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[transform,background-color,color,box-shadow,opacity] duration-150 ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-border)] hover:opacity-90",
        secondary:
          "bg-card text-foreground shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
        outline:
          "bg-transparent text-foreground shadow-[var(--shadow-border)] hover:bg-secondary",
        ghost: "bg-transparent text-foreground hover:bg-secondary",
        benefit:
          "bg-benefit text-primary-foreground shadow-[var(--shadow-border)]",
        caution:
          "bg-caution text-primary-foreground shadow-[var(--shadow-border)]",
      },
      size: {
        default: "h-11 rounded-[var(--radius-md)] px-5 text-sm",
        sm: "h-9 rounded-[var(--radius-sm)] px-3 text-sm",
        lg: "h-12 rounded-[var(--radius-lg)] px-6 text-base",
        xl: "h-14 rounded-[var(--radius-lg)] px-7 text-base",
        icon: "size-11 rounded-[var(--radius-md)]",
        pill: "h-10 rounded-full px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
