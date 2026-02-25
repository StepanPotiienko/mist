import { NextRequest, NextResponse } from "next/server"
import { createLink, deleteLink, getLinksForItem } from "@/lib/links"
import type { CalendarSource } from "@/types/calendar"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") as CalendarSource
    const id = searchParams.get("id")

    if (!type || !id) {
      return NextResponse.json({ error: "type and id are required" }, { status: 400 })
    }

    const links = await getLinksForItem(type, id)
    return NextResponse.json({ links })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      sourceType: CalendarSource
      sourceId: string
      targetType: CalendarSource
      targetId: string
    }
    const { sourceType, sourceId, targetType, targetId } = body

    if (!sourceType || !sourceId || !targetType || !targetId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const link = await createLink(sourceType, sourceId, targetType, targetId)
    return NextResponse.json({ link }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { id: string }
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    await deleteLink(body.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
