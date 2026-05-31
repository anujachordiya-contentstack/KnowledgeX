import { NextRequest, NextResponse } from "next/server";
import { SortOrder } from "mongoose";
import connectDB from "@/lib/mongodb";
import TopicModel from "@/models/Topic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authorId = req.nextUrl.searchParams.get("authorId") ?? "";
    const sortOrder: Record<string, SortOrder> = { updatedAt: 1 };

    const topics = await TopicModel.find({ status: "in_review" })
      .sort(sortOrder)
      .lean();

    const data = topics.map((doc) => ({
      id: doc._id.toString(),
      slug: doc.slug,
      title: doc.title,
      summary: doc.summary,
      category: doc.category,
      difficulty: doc.difficulty,
      author: doc.author,
      submittedAt: (doc as unknown as { updatedAt: Date }).updatedAt.toISOString(),
      isOwn: authorId ? doc.author?.id === authorId : false,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/reviews/queue]", error);
    return NextResponse.json(
      { error: "Failed to fetch review queue" },
      { status: 500 }
    );
  }
}
