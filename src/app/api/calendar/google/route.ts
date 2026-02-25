import { NextRequest, NextResponse } from "next/server"
import { getGoogleCalendarEvents } from "@/lib/google-calendar"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = new Date(searchParams.get("from") ?? new Date().toISOString())
    const to = new Date(searchParams.get("to") ?? new Date(Date.now() + 30 * 86400000).toISOString())

    const events = await getGoogleCalendarEvents(from, to)
    return NextResponse.json({ events })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
