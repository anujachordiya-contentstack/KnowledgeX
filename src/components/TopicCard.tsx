"use client";

import Link from "next/link";
import { Clock, ThumbsUp } from "lucide-react";
import { Topic } from "@/types";
import { DifficultyBadge } from "./DifficultyBadge";
import { DeleteButton } from "./AdminBar";

const CATEGORY_COLORS: Record<string, string> = {
  Networking: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Security: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Caching: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Infrastructure: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  Frontend: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  Databases: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TopicCard({ topic }: { topic: Topic }) {
  return (
    <Link
      href={`/topics/${topic.slug}`}
      className="group relative flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-all hover:shadow-md hover:border-[var(--primary)]/40 hover:-translate-y-0.5"
    >
      <DeleteButton slug={topic.slug} />
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            CATEGORY_COLORS[topic.category] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {topic.category}
        </span>
        <DifficultyBadge difficulty={topic.difficulty} />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold leading-snug text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
        {topic.title}
      </h3>

      {/* Summary */}
      <p className="text-sm leading-relaxed text-[var(--muted-foreground)] line-clamp-2">
        {topic.summary}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {topic.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]"
          >
            #{tag}
          </span>
        ))}
        {topic.tags.length > 3 && (
          <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
            +{topic.tags.length - 3}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-3">
        {/* Author */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]/20 text-[10px] font-bold text-[var(--primary)]">
            {getInitials(topic.author.name)}
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">
            {topic.author.name}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {topic.readingTime}m
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            {topic.upvoteCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
