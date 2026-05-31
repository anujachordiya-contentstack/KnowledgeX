import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, ThumbsUp, User } from "lucide-react";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { TopicBody } from "@/components/TopicBody";
import { Topic } from "@/types";
import connectDB from "@/lib/mongodb";
import TopicModel from "@/models/Topic";

const CATEGORY_COLORS: Record<string, string> = {
  Networking: "bg-blue-100 text-blue-700",
  Security: "bg-purple-100 text-purple-700",
  Caching: "bg-orange-100 text-orange-700",
  Infrastructure: "bg-cyan-100 text-cyan-700",
  Frontend: "bg-pink-100 text-pink-700",
  Databases: "bg-teal-100 text-teal-700",
};

async function getTopic(slug: string): Promise<Topic | null> {
  await connectDB();
  const doc = await TopicModel.findOne({ slug, status: "published" }).lean();
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    category: doc.category as Topic["category"],
    difficulty: doc.difficulty as Topic["difficulty"],
    tags: doc.tags ?? [],
    readingTime: doc.readingTime,
    upvoteCount: doc.upvoteCount,
    viewCount: doc.viewCount,
    author: doc.author,
    publishedAt: doc.publishedAt?.toISOString() ?? new Date().toISOString(),
    trendingScore: doc.trendingScore,
    body: doc.body ?? [],
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await getTopic(slug);

  if (!topic) notFound();

  const publishDate = new Date(topic.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
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

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Meta row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-4xl">
          {topic.title}
        </h1>

        {/* Summary */}
        <p className="mb-6 text-lg leading-relaxed text-[var(--muted-foreground)]">
          {topic.summary}
        </p>

        {/* Stats row */}
        <div className="mb-8 flex flex-wrap items-center gap-4 border-y border-[var(--border)] py-4 text-sm text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {topic.author.name}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {topic.readingTime} min read
          </span>
          <span className="flex items-center gap-1.5">
            <ThumbsUp className="h-4 w-4" />
            {topic.upvoteCount} upvotes
          </span>
          <span className="ml-auto">{publishDate}</span>
        </div>

        {/* Tags */}
        <div className="mb-10 flex flex-wrap gap-2">
          {topic.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[var(--muted)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)]"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Body */}
        <article>
          <TopicBody sections={topic.body ?? []} />
        </article>
      </main>
    </div>
  );
}
