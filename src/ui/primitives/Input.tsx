import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputSize = "sm" | "md" | "lg";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  inputSize?: InputSize;
  isInvalid?: boolean;
};

const sizeClasses: Record<InputSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-3 text-sm",
  lg: "h-11 px-4 text-sm",
};

export function Input({
  "aria-invalid": ariaInvalid,
  className,
  inputSize = "md",
  isInvalid = false,
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={isInvalid || ariaInvalid}
      className={cn(
        "w-full rounded-control border bg-card-background text-text-strong transition-colors",
        "placeholder:text-text-neutral/65",
        "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20",
        "disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-70",
        isInvalid ? "border-red-500 focus:border-red-600" : "border-border",
        sizeClasses[inputSize],
        className
      )}
    />
  );
}
