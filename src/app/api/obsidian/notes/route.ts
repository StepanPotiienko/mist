import { NextRequest, NextResponse } from "next/server"
import { getCredential } from "@/lib/credentials"

function resolveMethod(cred: Record<string, string> | null): "filesystem" | "rest-api" {
  if (cred?.method === "filesystem" || cred?.method === "rest-api") return cred.method
  // Legacy credentials: if they have apiKey/apiUrl but no explicit method, default to rest-api
  if (cred?.apiKey || cred?.apiUrl) return "rest-api"
  return "filesystem"
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined

    const cred = await getCredential("obsidian")
    const method = resolveMethod(cred)

    if (method === "filesystem") {
      const { searchNotes, getNotesWithDates, isVaultAccessible } = await import("@/lib/obsidian-fs")

      const accessible = await isVaultAccessible()
      if (!accessible) {
        return NextResponse.json(
          { error: "Vault path is not configured or not accessible." },
          { status: 503 }
        )
      }

      const notes = query ? await searchNotes(query) : await getNotesWithDates(from, to)
      return NextResponse.json({ notes })
    }

    // REST API method
    const { getNotesWithDates, searchNotes, isObsidianRunning } = await import("@/lib/obsidian")

    const running = await isObsidianRunning()
    if (!running) {
      return NextResponse.json(
        { error: "Obsidian is not running or the Local REST API plugin is not enabled." },
        { status: 503 }
      )
    }

    const notes = query ? await searchNotes(query) : await getNotesWithDates(from, to)
    return NextResponse.json({ notes })
  } catch (err) {
    console.error("Obsidian notes API error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
