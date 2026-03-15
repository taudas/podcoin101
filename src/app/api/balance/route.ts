import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUserBalance } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = getUserBalance(session.user.id)
  if (!data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({
    balance: data.balance,
    credit_limit: data.credit_limit,
    available_credit: data.balance + data.credit_limit,
  })
}
