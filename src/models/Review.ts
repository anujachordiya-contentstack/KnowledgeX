import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  topicId: mongoose.Types.ObjectId;
  reviewerId: string;
  reviewerName: string;
  decision: "approved" | "changes_requested" | "rejected";
  feedback: string;
}

const ReviewSchema = new Schema<IReview>(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },
    reviewerId: { type: String, default: "anonymous" },
    reviewerName: { type: String, required: true },
    decision: {
      type: String,
      enum: ["approved", "changes_requested", "rejected"],
      required: true,
    },
    feedback: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Review: Model<IReview> =
  mongoose.models.Review ?? mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
