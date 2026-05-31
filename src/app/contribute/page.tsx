"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

const INPUT_CLS =
  "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all";

const TEXTAREA_CLS =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all resize-none";

const LABEL_CLS = "block text-sm font-medium text-[var(--foreground)] mb-1.5";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for non-secure (HTTP) contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getOrCreateAuthorId(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem("kx_author_id");
  if (existing) return existing;
  const id = generateUUID();
  localStorage.setItem("kx_author_id", id);
  return id;
}

type PageStatus = "idle" | "saving" | "submitting" | "done" | "error";

export default function ContributePage() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("Networking");
  const [difficulty, setDifficulty] = useState("beginner");
  const [tagsInput, setTagsInput] = useState("");
  const [readingTime, setReadingTime] = useState(5);
  const [authorName, setAuthorName] = useState("");
  const [pageStatus, setPageStatus] = useState<PageStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  async function saveDraft(): Promise<string> {
    const authorId = getOrCreateAuthorId();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const res = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        category,
        difficulty,
        tags,
        readingTime,
        authorName,
        authorId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? "Failed to save draft");
    }

    const json = (await res.json()) as { data: { slug: string } };
    return json.data.slug;
  }

  async function handleSaveDraft() {
    setPageStatus("saving");
    setErrorMsg("");
    try {
      const slug = await saveDraft();
      setSavedSlug(slug);
      setPageStatus("idle");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
      setPageStatus("error");
    }
  }

  async function handleSubmit() {
    setPageStatus("submitting");
    setErrorMsg("");
    try {
      let slug = savedSlug;
      if (!slug) {
        slug = await saveDraft();
        setSavedSlug(slug);
      }

      const res = await fetch(`/api/topics/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Failed to submit");
      }

      setPageStatus("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
      setPageStatus("error");
    }
  }

  function handleReset() {
    setTitle("");
    setSummary("");
    setCategory("Networking");
    setDifficulty("beginner");
    setTagsInput("");
    setReadingTime(5);
    setAuthorName("");
    setPageStatus("idle");
    setErrorMsg("");
    setSavedSlug(null);
  }

  const isBusy = pageStatus === "saving" || pageStatus === "submitting";

  if (pageStatus === "done") {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                knowledge<span className="text-[var(--primary)]">X</span>
              </span>
            </Link>
          </div>
        </header>

        {/* Success card */}
        <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 pt-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Topic Submitted!
            </h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Your topic has been submitted for review. The team will take a
              look shortly.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/my-topics"
              className="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              View My Topics
            </Link>
            <button
              onClick={handleReset}
              className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Form */}
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Contribute a Topic
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Share your knowledge with the community.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="flex flex-col gap-5">
            {/* Title */}
            <div>
              <label className={LABEL_CLS}>
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Introduction to BGP Routing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={INPUT_CLS}
              />
            </div>

            {/* Summary */}
            <div>
              <label className={LABEL_CLS}>
                Summary <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="A brief description of what this topic covers…"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className={TEXTAREA_CLS}
              />
            </div>

            {/* Category & Difficulty */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={INPUT_CLS}
                >
                  {[
                    "Networking",
                    "Security",
                    "Cloud",
                    "DevOps",
                    "Programming",
                    "Databases",
                    "AI / ML",
                    "Other",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLS}>Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={INPUT_CLS}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={LABEL_CLS}>Tags</label>
              <input
                type="text"
                placeholder="e.g. bgp, routing, networking (comma separated)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className={INPUT_CLS}
              />
            </div>

            {/* Reading Time */}
            <div>
              <label className={LABEL_CLS}>Reading Time (minutes)</label>
              <input
                type="number"
                min={1}
                max={120}
                value={readingTime}
                onChange={(e) => setReadingTime(Number(e.target.value))}
                className={INPUT_CLS}
              />
            </div>

            {/* Author Name */}
            <div>
              <label className={LABEL_CLS}>Your Name</label>
              <input
                type="text"
                placeholder="e.g. Jane Smith"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Error */}
          {pageStatus === "error" && (
            <p className="mt-4 text-sm text-rose-600">{errorMsg}</p>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isBusy}
              className="flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              {pageStatus === "saving" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Draft
            </button>

            <button
              onClick={handleSubmit}
              disabled={isBusy}
              className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pageStatus === "submitting" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Submit for Review
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
