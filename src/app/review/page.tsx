"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { ReviewerGate } from "@/components/ReviewerGate";
import { AdminBar, useAdmin } from "@/components/AdminBar";


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

interface QueueItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  difficulty: string;
  status?: string;
  author: { name: string };
  submittedAt: string;
  isOwn: boolean;
}

type Decision = "approved" | "changes_requested" | "rejected" | "";

// ── Queue list with admin delete ─────────────────────────────────────────────
function QueueList({
  queue, selected, onSelect, onDeleted,
}: {
  queue: QueueItem[];
  selected: QueueItem | null;
  onSelect: (item: QueueItem) => void;
  onDeleted: (slug: string) => void;
}) {
  const { isAdmin } = useAdmin();

  async function handleDelete(e: React.MouseEvent, item: QueueItem) {
    e.stopPropagation();
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    await fetch(`/api/topics/${item.slug}`, { method: "DELETE" });
    onDeleted(item.slug);
  }

  return (
    <div className="flex flex-col gap-2">
      {queue.map((item) => (
        <div key={item.id} className="relative group/card">
          <button
            onClick={() => onSelect(item)}
            disabled={item.isOwn}
            title={item.isOwn ? "You cannot review your own topic" : undefined}
            className={`w-full rounded-xl border p-4 text-left transition-all ${
              item.isOwn
                ? "cursor-not-allowed border-[var(--border)] bg-[var(--muted)] opacity-60"
                : selected?.id === item.id
                ? "border-[var(--primary)] bg-[var(--primary)]/5"
                : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50"
            }`}
          >
            <div className="flex items-start justify-between gap-2 pr-6">
              <p className="text-sm font-medium text-[var(--foreground)] line-clamp-2">{item.title}</p>
              {item.isOwn && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  Your topic
                </span>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-xs text-[var(--muted-foreground)]">{item.category}</span>
              <span className="text-xs text-[var(--muted-foreground)]">&middot;</span>
              <span className="text-xs text-[var(--muted-foreground)]">{relativeTime(item.submittedAt)}</span>
            </div>
          </button>
          {isAdmin && (
            <button
              onClick={(e) => handleDelete(e, item)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-500 opacity-0 transition-opacity group-hover/card:opacity-100 hover:bg-rose-200 z-10"
              title="Delete topic"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [decision, setDecision] = useState<Decision>("");
  const [reviewerName, setReviewerName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [authorId, setAuthorId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("kx_author_id") ?? "";
    Promise.resolve().then(() => setAuthorId(id));
    const url = "/api/reviews/queue" + (id ? `?authorId=${encodeURIComponent(id)}` : "");
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load queue");
        return res.json();
      })
      .then((json: { data: QueueItem[] }) => {
        setQueue(Array.isArray(json.data) ? json.data : []);
        setLoadState("loaded");
      })
      .catch(() => setLoadState("error"));
  }, []);

  function selectItem(item: QueueItem) {
    setSelected(item);
    setDecision("");
    setFeedback("");
    setSubmitError("");
  }

  async function handleSubmitReview() {
    if (!selected || !decision) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/reviews/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewerName, feedback }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; detail?: string; message?: string };
        throw new Error(err.detail ?? err.error ?? err.message ?? "Failed to submit review");
      }

      setQueue((prev) => prev.filter((q) => q.id !== selected.id));
      setSelected(null);
      setDecision("");
      setReviewerName("");
      setFeedback("");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const DECISION_STYLES: Record<string, string> = {
    approved:
      "border-emerald-500 bg-emerald-50 text-emerald-700",
    changes_requested:
      "border-amber-500 bg-amber-50 text-amber-700",
    rejected:
      "border-rose-500 bg-rose-50 text-rose-700",
  };

  const DECISION_DEFAULT =
    "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:border-[var(--primary)]";

  function handleTopicDeleted(slug: string) {
    setQueue((prev) => prev.filter((t) => t.slug !== slug));
    if (selected?.slug === slug) setSelected(null);
  }

  return (
    <AdminBar onTopicDeleted={handleTopicDeleted}>
    <ReviewerGate>
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

          <span className="ml-auto text-sm font-medium text-[var(--foreground)]">
            Review Queue
          </span>
        </div>
      </header>

      {loadState === "loading" && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
        </div>
      )}

      {loadState === "error" && (
        <p className="mx-auto mt-10 max-w-md text-center text-sm text-rose-600">
          Failed to load the review queue. Please try again later.
        </p>
      )}

      {loadState === "loaded" && (
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6">
          {/* Queue list */}
          <aside className="w-80 shrink-0">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Pending ({queue.length})
            </h2>

            {queue.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">
                No topics pending review.
              </p>
            )}

            <QueueList
                queue={queue}
                selected={selected}
                onSelect={selectItem}
                onDeleted={handleTopicDeleted}
              />
          </aside>

          {/* Review panel */}
          <div className="flex-1 min-w-0">
            {!selected ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[var(--border)]">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Select a topic from the queue to review it.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                {/* Topic header */}
                <div className="mb-4">
                  <Link
                    href={`/topics/${selected.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                  >
                    {selected.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">In Review</span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {selected.category}
                    </span>
                    <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                      {selected.difficulty}
                    </span>
                    {selected.author?.name && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        by {selected.author.name}
                      </span>
                    )}
                  </div>
                </div>

                {selected.summary && (
                  <p className="mb-4 text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {selected.summary}
                  </p>
                )}

                <hr className="mb-5 border-[var(--border)]" />

                {/* Decision buttons */}
                <div className="mb-4">
                  <p className="mb-2.5 text-sm font-medium text-[var(--foreground)]">
                    Decision
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: "approved", label: "Approve" },
                        { value: "changes_requested", label: "Request Changes" },
                        { value: "rejected", label: "Reject" },
                      ] as { value: Decision; label: string }[]
                    ).map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setDecision(value)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                          decision === value
                            ? DECISION_STYLES[value]
                            : DECISION_DEFAULT
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reviewer name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Reviewer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  />
                </div>

                {/* Feedback */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Feedback
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Leave feedback for the author…"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all resize-none"
                  />
                </div>

                {submitError && (
                  <p className="mb-3 text-sm text-rose-600">{submitError}</p>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitReview}
                    disabled={!decision || submitting}
                    className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Submit Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </ReviewerGate>
    </AdminBar>
  );
}
