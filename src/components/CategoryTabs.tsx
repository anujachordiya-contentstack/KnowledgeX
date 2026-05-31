"use client";

import { cn } from "@/lib/utils";
import { Category } from "@/types";
import { CATEGORIES } from "@/data/mock";

const CATEGORY_EMOJI: Record<string, string> = {
  Networking: "🌐",
  Security: "🔒",
  Caching: "⚡",
  Infrastructure: "🏗️",
  Frontend: "🎨",
  Databases: "🗄️",
};

interface CategoryTabsProps {
  active: Category | "all";
  onChange: (category: Category | "all") => void;
  counts: Record<string, number>;
}

export function CategoryTabs({ active, onChange, counts }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onChange("all")}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all border",
          active === "all"
            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
            : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
        )}
      >
        All
        <span className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
          active === "all" ? "bg-white/20 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
        )}>
          {counts["all"] ?? 0}
        </span>
      </button>

      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat as Category)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all border",
            active === cat
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
          )}
        >
          <span>{CATEGORY_EMOJI[cat]}</span>
          {cat}
          {counts[cat] !== undefined && (
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              active === cat ? "bg-white/20 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
            )}>
              {counts[cat]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
