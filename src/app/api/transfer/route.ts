import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { transfer } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { toUserId?: unknown; amount?: unknown; note?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { toUserId, amount, note } = body

  if (!toUserId || typeof toUserId !== "string") {
    return NextResponse.json({ error: "toUserId is required" }, { status: 400 })
  }
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 })
  }

  try {
    const result = transfer(
      session.user.id,
      toUserId,
      amount,
      typeof note === "string" ? note : ""
    )
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
