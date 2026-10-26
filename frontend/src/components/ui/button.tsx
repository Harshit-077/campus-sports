import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary-container text-white hover:bg-on-primary-fixed-variant",
  // the single orange call to action per screen (Sora, per the design system)
  accent: "bg-secondary-container text-white font-display font-semibold hover:bg-accent-strong",
  secondary: "border border-line bg-white text-on-surface hover:bg-tertiary-fixed",
  ghost: "text-primary-container hover:bg-tertiary-fixed",
  danger: "bg-danger text-white hover:opacity-90",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

/** Class names for a button-looking element, so a Link can look like a Button. */
export function buttonStyles(variant: Variant = "primary", size: Size = "md", className?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, disabled, className, children, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(buttonStyles(variant, size, className), "disabled:cursor-not-allowed disabled:opacity-60")}
      {...rest}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
