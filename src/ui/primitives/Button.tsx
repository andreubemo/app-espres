import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "neutral"
  | "ghost"
  | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  fullWidth?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-strong focus-visible:ring-primary/25",
  secondary:
    "bg-primary-soft/40 text-primary-strong hover:bg-primary-soft/65 focus-visible:ring-primary/20",
  outline:
    "border border-border bg-card-background text-text-strong hover:border-primary hover:text-primary focus-visible:ring-primary/20",
  neutral:
    "border border-[#d8d3cc] bg-[#fffdfa] text-[#2b2926] hover:border-[#2b2926] hover:bg-white hover:text-[#2b2926] focus-visible:ring-[#2b2926]/15",
  ghost:
    "bg-transparent text-text-neutral hover:bg-primary-soft/20 hover:text-primary-strong focus-visible:ring-primary/20",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/25",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export function Button({
  children,
  className,
  disabled,
  fullWidth = false,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-4",
        "disabled:pointer-events-none disabled:opacity-45",
        fullWidth && "w-full",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
