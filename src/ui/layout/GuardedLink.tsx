"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

type GuardedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
  };

function stringifyHref(href: LinkProps["href"]) {
  if (typeof href === "string") return href;

  const pathname = href.pathname ?? "";
  const query =
    href.query && typeof href.query === "object"
      ? `?${new URLSearchParams(
          Object.entries(href.query).flatMap(([key, value]) =>
            value === undefined
              ? []
              : [[key, Array.isArray(value) ? value.join(",") : String(value)]]
          )
        ).toString()}`
      : "";
  const hash = href.hash ? `#${href.hash}` : "";

  return `${pathname}${query}${hash}`;
}

export default function GuardedLink({
  children,
  href,
  onClick,
  ...props
}: GuardedLinkProps) {
  const { guardLinkClick } = useUnsavedChangesGuard();
  const hrefString = stringifyHref(href);

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          guardLinkClick(hrefString, event);
        }
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
