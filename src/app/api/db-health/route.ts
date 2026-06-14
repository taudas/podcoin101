import { type NextRequest } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const db = await getDb()
    
    // Try a simple query
    const result = await db.prepare("SELECT 1 as test").first()
    
    return Response.json({
      status: "ok",
      database: "connected",
      test: result?.test,
    })
  } catch (error) {
    return Response.json(
      { 
        status: "error", 
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
