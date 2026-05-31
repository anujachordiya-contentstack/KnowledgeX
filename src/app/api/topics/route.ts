import { NextRequest, NextResponse } from "next/server";
import { SortOrder } from "mongoose";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import TopicModel from "@/models/Topic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const tags = searchParams.getAll("tags"); // ?tags=Redis&tags=CDN
    const sort = searchParams.get("sort") ?? "recent";

    // Build query
    const query: Record<string, unknown> = { status: "published" };

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (tags.length > 0) query.tags = { $in: tags };

    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    const sortMap: Record<string, Record<string, SortOrder>> = {
      recent: { publishedAt: -1 },
      upvotes: { upvoteCount: -1 },
      trending: { trendingScore: -1 },
    };
    const sortOrder = sortMap[sort] ?? sortMap.recent;

    const topics = await TopicModel.find(query)
      .sort(sortOrder)
      .lean();

    const serialized = topics.map((doc) => ({
      id: doc._id.toString(),
      slug: doc.slug,
      title: doc.title,
      summary: doc.summary,
      category: doc.category,
      difficulty: doc.difficulty,
      tags: doc.tags ?? [],
      readingTime: doc.readingTime,
      upvoteCount: doc.upvoteCount,
      viewCount: doc.viewCount,
      author: doc.author,
      publishedAt: doc.publishedAt?.toISOString() ?? new Date().toISOString(),
      trendingScore: doc.trendingScore,
    }));

    return NextResponse.json({ data: serialized, total: serialized.length });
  } catch (error) {
    console.error("[GET /api/topics]", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      title,
      summary,
      category,
      difficulty,
      tags,
      readingTime,
      bodyContent,
      authorId,
      authorName,
    } = body;

    if (!title || !category) {
      return NextResponse.json(
        { error: "title and category are required" },
        { status: 400 }
      );
    }

    // Generate slug: slugify title + "-" + last 6 chars of a new ObjectId
    const slugBase = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const suffix = new mongoose.Types.ObjectId().toString().slice(-6);
    const slug = `${slugBase}-${suffix}`;

    try {
      const topic = await TopicModel.create({
        slug,
        title,
        summary: summary ?? "",
        category,
        difficulty: difficulty ?? "beginner",
        tags: Array.isArray(tags) ? tags : [],
        readingTime: readingTime ?? 0,
        body: Array.isArray(body.body) ? body.body : [],
        author: {
          id: authorId ?? "",
          name: authorName ?? "",
          avatarUrl: "",
        },
        status: "draft",
        upvoteCount: 0,
        viewCount: 0,
        trendingScore: 0,
        publishedAt: new Date(),
      });

      return NextResponse.json(
        { data: { id: topic._id.toString(), slug: topic.slug, status: topic.status } },
        { status: 201 }
      );
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        return NextResponse.json({ error: "duplicate title" }, { status: 409 });
      }
      throw err;
    }
  } catch (error) {
    console.error("[POST /api/topics]", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}
