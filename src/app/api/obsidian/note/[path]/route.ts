import { NextRequest, NextResponse } from "next/server"
import { getCredential } from "@/lib/credentials"

function resolveMethod(cred: Record<string, string> | null): "filesystem" | "rest-api" {
  if (cred?.method === "filesystem" || cred?.method === "rest-api") return cred.method
  if (cred?.apiKey || cred?.apiUrl) return "rest-api"
  return "filesystem"
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string }> }
) {
  try {
    const { path } = await params
    const decodedPath = decodeURIComponent(path)

    const cred = await getCredential("obsidian")
    const method = resolveMethod(cred)

    if (method === "filesystem") {
      const { parseNote } = await import("@/lib/obsidian-fs")
      const note = await parseNote(decodedPath)
      return NextResponse.json({ note })
    }

    const { parseNote } = await import("@/lib/obsidian")
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
