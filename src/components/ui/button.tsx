import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors",
        {
          "bg-brand text-brand-foreground hover:bg-black/80":
            variant === "primary",
          "bg-surface text-brand hover:bg-gray-200":
            variant === "secondary",
          "bg-transparent text-brand hover:bg-gray-100":
            variant === "ghost",
        },
        className
      )}
      {...props}
    />
  );
}
