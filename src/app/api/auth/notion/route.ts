import { NextRequest, NextResponse } from "next/server"
import { saveCredential } from "@/lib/credentials"

// This route handles saving a Notion API key (simple integration token flow)
// OAuth flow can be added later once you publish the integration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { apiKey: string }
    const { apiKey } = body

    if (!apiKey || !apiKey.startsWith("secret_")) {
      return NextResponse.json(
        { error: "Invalid Notion API key. It should start with 'secret_'" },
        { status: 400 }
      )
    }

    await saveCredential("notion", { apiKey })
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
    const { deleteCredential } = await import("@/lib/credentials")
    await deleteCredential("notion")
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
