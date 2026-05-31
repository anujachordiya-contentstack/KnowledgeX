import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import TopicModel from "@/models/Topic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const doc = await TopicModel.findOne({ slug, status: "published" }).lean();

    if (!doc) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const topic = {
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
      body: doc.body ?? [],
    };

    return NextResponse.json({ data: topic });
  } catch (error) {
    console.error("[GET /api/topics/:slug]", error);
    return NextResponse.json({ error: "Failed to fetch topic" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const existing = await TopicModel.findOne({ slug });

    if (!existing) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    if (!["draft", "changes_requested"].includes(existing.status)) {
      return NextResponse.json(
        { error: "Topic cannot be edited in its current status" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateFields: Record<string, unknown> = {};

    if (body.title !== undefined) {
      updateFields.title = body.title;
      // Regenerate slug from title (slugify only, no ObjectId suffix)
      updateFields.slug = (body.title as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
    if (body.summary !== undefined) updateFields.summary = body.summary;
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.difficulty !== undefined) updateFields.difficulty = body.difficulty;
    if (body.tags !== undefined) updateFields.tags = body.tags;
    if (body.readingTime !== undefined) updateFields.readingTime = body.readingTime;
    if (body.body !== undefined) updateFields.body = body.body;

    const updated = await TopicModel.findOneAndUpdate(
      { slug },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: updated._id.toString(),
        slug: updated.slug,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("[PUT /api/topics/:slug]", error);
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();
    const deleted = await TopicModel.findOneAndDelete({ slug });
    if (!deleted) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }
    return NextResponse.json({ data: { slug } });
  } catch (error) {
    console.error("[DELETE /api/topics/:slug]", error);
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
  }
}
