import { NextRequest, NextResponse } from "next/server"
import { getNotesWithDates, searchNotes, isObsidianRunning } from "@/lib/obsidian"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined

    const running = await isObsidianRunning()
    if (!running) {
      return NextResponse.json(
        { error: "Obsidian is not running or the Local REST API plugin is not enabled." },
        { status: 503 }
      )
    }

    if (query) {
      const notes = await searchNotes(query)
      return NextResponse.json({ notes })
    }

    const notes = await getNotesWithDates(from, to)
    return NextResponse.json({ notes })
  } catch (err) {
    console.error("Obsidian notes API error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
