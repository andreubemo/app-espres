import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-surface px-2 py-1 text-xs font-medium text-muted",
        className
      )}
      {...props}
    />
  );
}
