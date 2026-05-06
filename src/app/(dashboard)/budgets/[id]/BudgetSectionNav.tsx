"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "datos", label: "Datos" },
  { id: "notas", label: "NOTAS" },
  { id: "dimensiones", label: "Dimensiones" },
  { id: "partidas", label: "Partidas" },
  { id: "historial", label: "Historial" },
];

export default function BudgetSectionNav() {
  const [activeSection, setActiveSection] = useState<string>("datos");

  useEffect(() => {
    const sectionElements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element instanceof HTMLElement);

    if (!sectionElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top)
          );

        if (visibleEntries.length > 0) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-15% 0px -70% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    sectionElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-[calc(var(--app-header-height)+8px)] z-20 rounded-lg border border-border bg-card-background/95 p-2 shadow-sm backdrop-blur">
      <div className="flex gap-2 overflow-x-auto scroll-smooth">
        {sections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={isActive ? "true" : undefined}
              className={[
                "inline-flex shrink-0 items-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "border border-border bg-surface text-text-neutral hover:border-primary-soft hover:bg-surface hover:text-text-strong",
              ].join(" ")}
            >
              {section.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
