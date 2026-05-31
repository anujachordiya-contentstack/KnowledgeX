import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuthor {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface IBodySection {
  type: "text" | "code" | "list" | "note" | "warning";
  heading?: string;
  content?: string;
  items?: string[];
  code?: { language: string; snippet: string; caption?: string };
}

export interface ITopic extends Document {
  slug: string;
  title: string;
  summary: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  readingTime: number;
  upvoteCount: number;
  viewCount: number;
  author: IAuthor;
  publishedAt: Date;
  trendingScore: number;
  status: "draft" | "in_review" | "changes_requested" | "published" | "approved" | "archived";
  body: IBodySection[];
}

const AuthorSchema = new Schema<IAuthor>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
  },
  { _id: false }
);

const TopicSchema = new Schema<ITopic>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    category: { type: String, required: true, index: true },
    difficulty: {
      type: String,
      required: true,
      enum: ["beginner", "intermediate", "advanced"],
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    readingTime: { type: Number, required: true },
    upvoteCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    author: { type: AuthorSchema, required: true },
    publishedAt: { type: Date, default: Date.now },
    trendingScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "in_review", "changes_requested", "published", "approved", "archived"],
      default: "published",
      index: true,
    },
    body: { type: Schema.Types.Mixed, default: [] },
  },
  {
    timestamps: true,
  }
);

// Text index for full-text search
TopicSchema.index(
  { title: "text", summary: "text", tags: "text" },
  { weights: { title: 10, tags: 5, summary: 1 }, name: "topic_text_search" }
);

const Topic: Model<ITopic> =
  mongoose.models.Topic ?? mongoose.model<ITopic>("Topic", TopicSchema);

export default Topic;
