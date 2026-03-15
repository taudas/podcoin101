import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { transfer } from "@/lib/db"

interface QrPayload {
  toUserId: string
  amount: number
  note?: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { qrData?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.qrData || typeof body.qrData !== "string") {
    return NextResponse.json({ error: "qrData is required" }, { status: 400 })
  }

  let payload: QrPayload
  try {
    payload = JSON.parse(body.qrData) as QrPayload
  } catch {
    return NextResponse.json({ error: "Invalid QR data format" }, { status: 400 })
  }

  if (!payload.toUserId || typeof payload.toUserId !== "string") {
    return NextResponse.json({ error: "Invalid QR: missing toUserId" }, { status: 400 })
  }
  if (typeof payload.amount !== "number" || payload.amount <= 0) {
    return NextResponse.json({ error: "Invalid QR: amount must be positive" }, { status: 400 })
  }

  try {
    const result = transfer(
      session.user.id,
      payload.toUserId,
      payload.amount,
      payload.note ?? ""
    )
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
