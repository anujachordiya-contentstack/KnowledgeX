"use client";

import Link from "next/link";
import { BookOpen, Plus, Search, X } from "lucide-react";

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function Navbar({ searchQuery, onSearchChange }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            knowledge<span className="text-[var(--primary)]">X</span>
          </span>
        </Link>

        {/* Search bar */}
        <div className="relative flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search topics, tags, descriptions…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-full border border-[var(--border)] bg-[var(--muted)] pl-9 pr-9 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/my-topics"
            className="hidden sm:inline text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] shrink-0 transition-colors"
          >
            My Topics
          </Link>
          <Link
            href="/review"
            className="hidden sm:inline text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] shrink-0 transition-colors"
          >
            Review
          </Link>
          <Link href="/contribute" className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Contribute</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
