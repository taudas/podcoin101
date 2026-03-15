import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUser, getUserServices, updateProfile } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = getUser(session.user.id)
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const services = getUserServices(session.user.id)
  return NextResponse.json({ ...user, services })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { name?: unknown; bio?: unknown; neighborhood?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const data: { name?: string; bio?: string; neighborhood?: string } = {}
  if (typeof body.name === "string") data.name = body.name
  if (typeof body.bio === "string") data.bio = body.bio
  if (typeof body.neighborhood === "string") data.neighborhood = body.neighborhood

  const updated = updateProfile(session.user.id, data)
  return NextResponse.json(updated)
}
