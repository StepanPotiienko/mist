import { NextRequest, NextResponse } from "next/server"
import { saveCredential, deleteCredential } from "@/lib/credentials"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { apiKey?: string; apiUrl?: string }
    const { apiKey, apiUrl } = body

    console.log("Obsidian API: Received POST request")
    await saveCredential("obsidian", {
      ...(apiKey ? { apiKey } : {}),
      ...(apiUrl ? { apiUrl } : {}),
    })
    console.log("Obsidian API: Successfully saved credential")
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    await deleteCredential("obsidian")
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
