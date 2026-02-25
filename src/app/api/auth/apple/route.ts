import { NextRequest, NextResponse } from "next/server"
import { saveCredential, deleteCredential } from "@/lib/credentials"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { username: string; password: string }
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: "username (iCloud email) and password (app-specific password) are required" },
        { status: 400 }
      )
    }

    console.log("Apple API: Received POST request")
    await saveCredential("apple", { username, password })
    console.log("Apple API: Successfully saved credential")
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Apple API error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    await deleteCredential("apple")
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
