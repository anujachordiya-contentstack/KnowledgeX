import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import TopicModel from "@/models/Topic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const topic = await TopicModel.findOne({ slug });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    if (!["draft", "changes_requested"].includes(topic.status)) {
      return NextResponse.json(
        { error: "Only draft or changes_requested topics can be submitted for review" },
        { status: 400 }
      );
    }

    topic.status = "in_review";
    await topic.save();

    return NextResponse.json({
      data: {
        id: topic._id.toString(),
        slug: topic.slug,
        status: topic.status,
      },
    });
  } catch (error) {
    console.error("[POST /api/topics/:slug/submit]", error);
    return NextResponse.json({ error: "Failed to submit topic" }, { status: 500 });
  }
}
