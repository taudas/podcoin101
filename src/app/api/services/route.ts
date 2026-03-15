import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUserServices, addService, updateService, deleteService } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const services = getUserServices(session.user.id)
  return NextResponse.json({ services })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { title?: unknown; description?: unknown; price_podcoin?: unknown; category?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }
  if (typeof body.price_podcoin !== "number" || body.price_podcoin < 0) {
    return NextResponse.json({ error: "price_podcoin must be a non-negative number" }, { status: 400 })
  }

  const service = addService(session.user.id, {
    title: body.title,
    description: typeof body.description === "string" ? body.description : undefined,
    price_podcoin: body.price_podcoin,
    category: typeof body.category === "string" ? body.category : undefined,
  })
  return NextResponse.json(service, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { id?: unknown; title?: unknown; description?: unknown; price_podcoin?: unknown; category?: unknown; active?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.id || typeof body.id !== "number") {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  try {
    updateService(body.id, session.user.id, {
      title: typeof body.title === "string" ? body.title : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      price_podcoin: typeof body.price_podcoin === "number" ? body.price_podcoin : undefined,
      category: typeof body.category === "string" ? body.category : undefined,
      active: typeof body.active === "number" ? body.active : undefined,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get("id") ?? "")
  if (isNaN(id)) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  try {
    deleteService(id, session.user.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
