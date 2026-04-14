"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "datos", label: "Datos" },
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
    <div className="sticky z-20 rounded-2xl border border-neutral-200 bg-white/95 p-2 shadow-sm backdrop-blur xl:top-[calc(var(--app-header-height)+8px)]">
      <div className="flex gap-2 overflow-x-auto scroll-smooth">
        {sections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={isActive ? "true" : undefined}
              className={[
                "inline-flex shrink-0 items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900",
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