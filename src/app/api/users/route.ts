import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUsers } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? undefined

  const users = getUsers(search)
  return NextResponse.json({ users })
}
