import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

// Re-use the connection across hot reloads in Next.js dev mode
declare global {
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

async function connectDB(): Promise<typeof mongoose> {
  if (global._mongooseConn) {
    return global._mongooseConn;
  }

  global._mongooseConn = mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  return global._mongooseConn;
}

export default connectDB;
