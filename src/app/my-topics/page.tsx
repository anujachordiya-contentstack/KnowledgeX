"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

function relativeTime(iso: string): string {
  const now = window.performance.timeOrigin + window.performance.now();
  const then = +new Date(iso);
  const ms = now - then;

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} days ago`;
}

interface Topic {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  difficulty: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

type LoadState = "loading" | "loaded" | "error";

export default function MyTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    const authorId =
      typeof window !== "undefined"
        ? localStorage.getItem("kx_author_id")
        : null;

    if (!authorId) {
      Promise.resolve().then(() => {
        setTopics([]);
        setLoadState("loaded");
      });
      return;
    }

    fetch(`/api/topics/mine?authorId=${encodeURIComponent(authorId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load topics");
        return res.json();
      })
      .then((json: { data: Topic[] }) => {
        setTopics(Array.isArray(json.data) ? json.data : []);
        setLoadState("loaded");
      })
      .catch(() => setLoadState("error"));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>

          <Link href="/" className="flex shrink-0 items-center gap-2 ml-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">
              knowledge<span className="text-[var(--primary)]">X</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            My Topics
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Topics you have contributed or drafted.
          </p>
        </div>

        {loadState === "loading" && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
          </div>
        )}

        {loadState === "error" && (
          <p className="text-sm text-rose-600">
            Failed to load your topics. Please try again later.
          </p>
        )}

        {loadState === "loaded" && topics.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--muted)]">
              <FileText className="h-6 w-6 text-[var(--muted-foreground)]" />
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              You haven&apos;t contributed any topics yet.
            </p>
            <Link
              href="/contribute"
              className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Contribute a Topic
            </Link>
          </div>
        )}

        {loadState === "loaded" && topics.length > 0 && (
          <div className="flex flex-col gap-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <StatusBadge status={topic.status} />
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {topic.category}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        &middot;
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {relativeTime(topic.updatedAt ?? topic.createdAt)}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-[var(--foreground)] truncate">
                      {topic.title}
                    </h2>
                    {topic.summary && (
                      <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">
                        {topic.summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/topics/${topic.slug}`}
                    className="text-xs font-medium text-[var(--primary)] hover:underline"
                  >
                    View
                  </Link>
                  {(topic.status === "draft" ||
                    topic.status === "changes_requested") && (
                    <Link
                      href={`/contribute?edit=${topic.slug}`}
                      className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
