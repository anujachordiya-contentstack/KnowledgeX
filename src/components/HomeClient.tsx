"use client";

import { useEffect, useMemo, useState } from "react";
import { Category, Difficulty, SortOption, Topic } from "@/types";
import { Navbar } from "./Navbar";
import { CategoryTabs } from "./CategoryTabs";
import { FilterPanel } from "./FilterPanel";
import { TopicsGrid } from "./TopicsGrid";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminBar } from "./AdminBar";

interface FilterState {
  categories: Category[];
  difficulties: Difficulty[];
  tags: string[];
}

const EMPTY_FILTERS: FilterState = { categories: [], difficulties: [], tags: [] };

function sortTopics(topics: Topic[], sort: SortOption): Topic[] {
  return [...topics].sort((a, b) => {
    if (sort === "upvotes") return b.upvoteCount - a.upvoteCount;
    if (sort === "trending") return b.trendingScore - a.trendingScore;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export function HomeClient() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortOption>("recent");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 9;

  // Fetch all published topics once on mount
  useEffect(() => {
    async function fetchTopics() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/topics");
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        setTopics(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load topics");
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  const activeFilterCount =
    filters.categories.length + filters.difficulties.length + filters.tags.length;

  const allTags = useMemo(
    () => Array.from(new Set(topics.flatMap((t) => t.tags))).sort(),
    [topics]
  );

  const filteredTopics = useMemo(() => {
    let result = topics;

    if (activeCategory !== "all") {
      result = result.filter((t) => t.category === activeCategory);
    }
    if (filters.categories.length > 0) {
      result = result.filter((t) => filters.categories.includes(t.category));
    }
    if (filters.difficulties.length > 0) {
      result = result.filter((t) => filters.difficulties.includes(t.difficulty));
    }
    if (filters.tags.length > 0) {
      result = result.filter((t) => filters.tags.some((tag) => t.tags.includes(tag)));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return sortTopics(result, sort);
  }, [topics, searchQuery, activeCategory, filters, sort]);

  // Reset to page 1 whenever the filtered set changes
  const prevFilterKey = useMemo(
    () => `${searchQuery}|${activeCategory}|${filters.categories.join()}|${filters.difficulties.join()}|${filters.tags.join()}|${sort}`,
    [searchQuery, activeCategory, filters, sort]
  );
  const [lastFilterKey, setLastFilterKey] = useState(prevFilterKey);
  if (prevFilterKey !== lastFilterKey) {
    setLastFilterKey(prevFilterKey);
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(filteredTopics.length / PAGE_SIZE);
  const pagedTopics = filteredTopics.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: topics.length };
    for (const topic of topics) {
      counts[topic.category] = (counts[topic.category] ?? 0) + 1;
    }
    return counts;
  }, [topics]);

  return (
    <AdminBar onTopicDeleted={(slug) => setTopics((prev) => prev.filter((t) => t.slug !== slug))}>
    <div className="flex min-h-screen flex-col">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Hero */}
      <div className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/5 via-[var(--background)] to-[var(--background)] px-4 py-10 text-center sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Engineering Knowledge Base
        </h1>
        <p className="mt-3 text-base text-[var(--muted-foreground)] max-w-xl mx-auto">
          Curated explainers on caching, auth, DNS, CDN, edge functions, databases, and more —
          written by engineers, for engineers.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-sm text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--foreground)]">{topics.length}</span> topics
          </span>
          <span className="h-4 w-px bg-[var(--border)]" />
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--foreground)]">
              {Object.keys(categoryCounts).length - 1}
            </span>{" "}
            categories
          </span>
          <span className="h-4 w-px bg-[var(--border)]" />
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--foreground)]">{allTags.length}</span> tags
          </span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 sm:px-6">
        <CategoryTabs
          active={activeCategory}
          onChange={(cat) => {
            setActiveCategory(cat);
            setFilters(EMPTY_FILTERS);
            setCurrentPage(1);
          }}
          counts={categoryCounts}
        />
      </div>

      {/* Main layout */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6">
        {/* Mobile filter toggle */}
        <div className="flex items-center gap-2 lg:hidden mb-0">
          <button
            onClick={() => setShowMobileFilters((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              showMobileFilters || activeFilterCount > 0
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Sidebar */}
        <aside
          className={cn(
            "w-64 shrink-0",
            "hidden lg:block",
            showMobileFilters && "!block w-full lg:w-64"
          )}
        >
          <div className={cn(showMobileFilters ? "block mb-4 lg:sticky lg:top-22" : "sticky top-22")}>
            <FilterPanel
              filters={filters}
              availableTags={allTags}
              onChange={setFilters}
              onClear={() => setFilters(EMPTY_FILTERS)}
              activeCount={activeFilterCount}
            />
          </div>
        </aside>

        {/* Topics grid */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-32 text-[var(--muted-foreground)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading topics…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-rose-300 py-20 text-center">
              <p className="text-sm font-medium text-rose-600">Failed to load topics</p>
              <p className="text-xs text-[var(--muted-foreground)]">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 rounded-full bg-[var(--primary)] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Retry
              </button>
            </div>
          ) : (
            <TopicsGrid
              topics={filteredTopics}
              pagedTopics={pagedTopics}
              sort={sort}
              onSortChange={setSort}
              searchQuery={searchQuery}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </div>
      </main>
    </div>
    </AdminBar>
  );
}
