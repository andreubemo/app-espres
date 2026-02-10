"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 cursor-pointer rounded border border-[var(--color-border)]",
        "accent-black focus:ring-2 focus:ring-black",
        className
      )}
      {...props}
    />
  );
}
