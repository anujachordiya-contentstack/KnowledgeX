"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Lock, Loader2, ArrowLeft } from "lucide-react";

interface ReviewerGateProps {
  children: React.ReactNode;
}

export function ReviewerGate({ children }: ReviewerGateProps) {
  // No localStorage — auth lives only in React state.
  // Navigating away always resets to locked.
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) throw new Error("Invalid PIN");
      setUnlocked(true);
    } catch {
      setError("Invalid PIN. Please try again.");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  if (unlocked) {
    return (
      <div className="relative">
        {children}
        <button
          onClick={() => { setUnlocked(false); setPin(""); }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] shadow-md hover:text-[var(--foreground)] transition-colors"
        >
          <Lock className="h-3 w-3" />
          Lock Review
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <ArrowLeft className="h-4 w-4" />Back
          </Link>
          <span className="h-4 w-px bg-[var(--border)]" />
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-[var(--primary)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">
              knowledge<span className="text-[var(--primary)]">X</span>
            </span>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]/10 mb-4">
              <Lock className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Reviewer Access</h1>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
              Enter your PIN to access the review queue.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                autoFocus
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              />
            </div>
            {error && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={!pin || loading}
              className="flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Unlock Review Queue
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
            Don&apos;t have access?{" "}
            <Link href="/contribute" className="text-[var(--primary)] hover:underline">
              Contribute a topic
            </Link>{" "}
            to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
