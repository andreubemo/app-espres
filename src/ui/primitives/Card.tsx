import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "soft" | "outline";
type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  padding?: CardPadding;
  variant?: CardVariant;
};

const variantClasses: Record<CardVariant, string> = {
  default:
    "border border-[#dedbd6] bg-[#fbfaf7] shadow-[0_1px_2px_rgba(31,31,31,0.04)]",
  elevated:
    "border border-[#dedbd6] bg-[#fbfaf7] shadow-[0_1px_2px_rgba(31,31,31,0.05),0_10px_24px_rgba(31,31,31,0.04)]",
  soft: "border border-[#e2ded8] bg-[#f4f2ef]",
  outline: "border border-[#dedbd6] bg-transparent",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-4",
};

export function Card({
  children,
  className,
  padding = "md",
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card text-[#24211f]",
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
