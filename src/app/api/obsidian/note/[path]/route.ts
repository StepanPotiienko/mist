import { NextRequest, NextResponse } from "next/server"
import { parseNote } from "@/lib/obsidian"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string }> }
) {
  try {
    const { path } = await params
    const decodedPath = decodeURIComponent(path)
    const note = await parseNote(decodedPath)
    return NextResponse.json({ note })
  } catch (err) {
    console.error("Obsidian single note API error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
