"use client";

import { createContext, useContext, useState } from "react";
import { Loader2, Lock, ShieldCheck, Trash2, X } from "lucide-react";

// ── Context ──────────────────────────────────────────────────────────────────
interface AdminContextValue {
  isAdmin: boolean;
  onDelete: (slug: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextValue>({
  isAdmin: false,
  onDelete: async () => {},
});

export function useAdmin() {
  return useContext(AdminContext);
}

// ── AdminBar ─────────────────────────────────────────────────────────────────
interface AdminBarProps {
  children: React.ReactNode;
  onTopicDeleted: (slug: string) => void;
}

export function AdminBar({ children, onTopicDeleted }: AdminBarProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  // No localStorage — admin mode resets on every page navigation
  async function handleLogin(e: React.FormEvent) {
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
      setIsAdmin(true);
      setShowPinForm(false);
      setPin("");
    } catch {
      setError("Invalid PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setIsAdmin(false);
  }

  async function onDelete(slug: string) {
    setDeletingSlug(slug);
    try {
      const res = await fetch(`/api/topics/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onTopicDeleted(slug);
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <AdminContext.Provider value={{ isAdmin, onDelete }}>
      {children}

      {/* Floating admin toggle button */}
      {!isAdmin ? (
        <button
          onClick={() => setShowPinForm(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] shadow-md hover:text-[var(--foreground)] transition-colors"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin
        </button>
      ) : (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1.5 shadow-md">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
          <span className="text-xs font-medium text-[var(--primary)]">Admin mode</span>
          <button
            onClick={handleLogout}
            className="ml-1 text-[var(--primary)] hover:opacity-70 transition-opacity"
            title="Exit admin mode"
          >
            <Lock className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Deleting overlay */}
      {deletingSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-4 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">Deleting topic…</span>
          </div>
        </div>
      )}

      {/* PIN modal */}
      {showPinForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">Admin Access</h2>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Enter the admin PIN to manage topics.</p>
              </div>
              <button onClick={() => { setShowPinForm(false); setError(""); setPin(""); }} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter admin PIN"
                autoFocus
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              />
              {error && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>
              )}
              <button
                type="submit"
                disabled={!pin || loading}
                className="flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Unlock
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminContext.Provider>
  );
}

// ── DeleteButton — used inside TopicCard ─────────────────────────────────────
export function DeleteButton({ slug }: { slug: string }) {
  const { isAdmin, onDelete } = useAdmin();
  const [confirming, setConfirming] = useState(false);

  if (!isAdmin) return null;

  return confirming ? (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-[var(--card)]/95 backdrop-blur-sm z-10 p-4 text-center">
      <Trash2 className="h-6 w-6 text-rose-500" />
      <p className="text-sm font-medium text-[var(--foreground)]">Delete this topic?</p>
      <p className="text-xs text-[var(--muted-foreground)]">This cannot be undone.</p>
      <div className="flex gap-2">
        <button
          onClick={(e) => { e.preventDefault(); setConfirming(false); }}
          className="rounded-full border border-[var(--border)] px-4 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          Cancel
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onDelete(slug); }}
          className="rounded-full bg-rose-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-600"
        >
          Delete
        </button>
      </div>
    </div>
  ) : (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(true); }}
      className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-200"
      title="Delete topic"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
