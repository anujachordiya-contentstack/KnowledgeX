import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import TopicModel from "@/models/Topic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const authorId = searchParams.get("authorId");

    if (!authorId) {
      return NextResponse.json(
        { error: "authorId query parameter is required" },
        { status: 400 }
      );
    }

    const topics = await TopicModel.find({ "author.id": authorId })
      .sort({ updatedAt: -1 })
      .lean();

    const data = topics.map((doc) => ({
      id: doc._id.toString(),
      slug: doc.slug,
      title: doc.title,
      status: doc.status,
      category: doc.category,
      difficulty: doc.difficulty,
      updatedAt: (doc as unknown as { updatedAt: Date }).updatedAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/topics/mine]", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
