"use client";

import { X } from "lucide-react";
import { CATEGORIES, DIFFICULTIES } from "@/data/mock";
import { Category, Difficulty } from "@/types";
import { cn } from "@/lib/utils";

interface FilterState {
  categories: Category[];
  difficulties: Difficulty[];
  tags: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  availableTags: string[];
  onChange: (filters: FilterState) => void;
  onClear: () => void;
  activeCount: number;
}

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function FilterPanel({
  filters,
  availableTags,
  onChange,
  onClear,
  activeCount,
}: FilterPanelProps) {
  return (
    <aside className="flex flex-col gap-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Filters</h2>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
          >
            <X className="h-3 w-3" />
            Clear {activeCount}
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
          Category
        </p>
        <div className="flex flex-col gap-1.5">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex cursor-pointer items-center gap-2 group">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat as Category)}
                onChange={() =>
                  onChange({
                    ...filters,
                    categories: toggle(filters.categories, cat as Category),
                  })
                }
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
              />
              <span
                className={cn(
                  "text-sm transition-colors",
                  filters.categories.includes(cat as Category)
                    ? "text-[var(--primary)] font-medium"
                    : "text-[var(--foreground)] group-hover:text-[var(--primary)]"
                )}
              >
                {cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
          Difficulty
        </p>
        <div className="flex flex-col gap-1.5">
          {DIFFICULTIES.map((diff) => (
            <label key={diff} className="flex cursor-pointer items-center gap-2 group">
              <input
                type="checkbox"
                checked={filters.difficulties.includes(diff as Difficulty)}
                onChange={() =>
                  onChange({
                    ...filters,
                    difficulties: toggle(filters.difficulties, diff as Difficulty),
                  })
                }
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
              />
              <span
                className={cn(
                  "text-sm capitalize transition-colors",
                  filters.difficulties.includes(diff as Difficulty)
                    ? "text-[var(--primary)] font-medium"
                    : "text-[var(--foreground)] group-hover:text-[var(--primary)]"
                )}
              >
                {diff}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
          Tags
        </p>
        <div className="flex flex-wrap gap-1.5">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() =>
                onChange({ ...filters, tags: toggle(filters.tags, tag) })
              }
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs transition-colors border",
                filters.tags.includes(tag)
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                  : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
