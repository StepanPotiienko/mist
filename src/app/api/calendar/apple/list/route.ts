import { NextResponse } from "next/server"
import { listAppleCalendars } from "@/lib/caldav"

export async function GET() {
  try {
    const calendars = await listAppleCalendars()
    return NextResponse.json({ calendars })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
