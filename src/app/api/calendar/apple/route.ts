import { NextRequest, NextResponse } from "next/server"
import { getAppleCalendarEvents } from "@/lib/caldav"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = new Date(searchParams.get("from") ?? new Date().toISOString())
    const to = new Date(searchParams.get("to") ?? new Date(Date.now() + 30 * 86400000).toISOString())

    const selectedStr = searchParams.get("selected")
    const selected = selectedStr ? selectedStr.split(",") : undefined
    const events = await getAppleCalendarEvents(from, to, selected)
    return NextResponse.json({ events })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
