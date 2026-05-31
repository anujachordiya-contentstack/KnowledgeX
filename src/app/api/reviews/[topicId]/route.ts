import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import TopicModel from "@/models/Topic";
import ReviewModel from "@/models/Review";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    await connectDB();

    const body = await req.json();
    const { decision, feedback, reviewerId, reviewerName } = body;

    if (!decision || !feedback) {
      return NextResponse.json(
        { error: "decision and feedback are required" },
        { status: 400 }
      );
    }

    const topic = await TopicModel.findById(new mongoose.Types.ObjectId(topicId));

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    if (topic.status !== "in_review") {
      return NextResponse.json(
        { error: "Topic is not currently in review" },
        { status: 400 }
      );
    }

    // Create the review record
    await ReviewModel.create({
      topicId: new mongoose.Types.ObjectId(topicId),
      reviewerId: reviewerId ?? "",
      reviewerName: reviewerName ?? "",
      decision,
      feedback,
    });

    // Apply status transition
    if (decision === "approved") {
      topic.status = "published";
      topic.publishedAt = new Date();
    } else if (decision === "changes_requested") {
      topic.status = "changes_requested";
    } else {
      topic.status = "archived";
    }

    await topic.save();

    return NextResponse.json({
      data: {
        topicId: topic._id.toString(),
        decision,
        topicStatus: topic.status,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[POST /api/reviews/:topicId]", msg);
    return NextResponse.json(
      { error: "Failed to submit review decision", detail: msg },
      { status: 500 }
    );
  }
}
