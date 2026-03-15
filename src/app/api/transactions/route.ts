import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getTransactions } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const transactions = getTransactions(session.user.id, 50)
  return NextResponse.json({ transactions })
}
