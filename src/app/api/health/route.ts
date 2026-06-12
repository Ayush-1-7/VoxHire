import { db } from "@/lib/db";

export async function GET() {
  try {
    // Perform a lightweight query to verify connection
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", time: new Date() });
  } catch (err) {
    const error = err as Error;
    console.error("[Health Check] Database connection error:", error);
    return Response.json(
      { status: "error", message: error.message || "Database connection failed" },
      { status: 500 }
    );
  }
}
