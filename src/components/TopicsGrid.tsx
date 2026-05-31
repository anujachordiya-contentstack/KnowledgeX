"use client";

import { ArrowUpDown, Clock, Flame, Search } from "lucide-react";
import { Topic, SortOption } from "@/types";
import { TopicCard } from "./TopicCard";
import { Pagination } from "./Pagination";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: "recent", label: "Most Recent", icon: <Clock className="h-3.5 w-3.5" /> },
  { value: "upvotes", label: "Most Upvoted", icon: <ArrowUpDown className="h-3.5 w-3.5" /> },
  { value: "trending", label: "Trending", icon: <Flame className="h-3.5 w-3.5" /> },
];

interface TopicsGridProps {
  topics: Topic[];           // already-filtered full list
  pagedTopics: Topic[];      // current page slice
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function TopicsGrid({
  topics,
  pagedTopics,
  sort,
  onSortChange,
  searchQuery,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
}: TopicsGridProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Sort bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          {topics.length === 0
            ? "No topics found"
            : `${topics.length} topic${topics.length !== 1 ? "s" : ""}`}
          {searchQuery && (
            <span className="ml-1">
              for <span className="font-medium text-[var(--foreground)]">&ldquo;{searchQuery}&rdquo;</span>
            </span>
          )}
        </p>

        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                sort === opt.value
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              {opt.icon}
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border)] py-20 text-center">
          <Search className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm font-medium text-[var(--foreground)]">No topics match your filters</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Try adjusting your search or clearing filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={topics.length}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
