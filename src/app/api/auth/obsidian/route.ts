import { NextRequest, NextResponse } from "next/server"
import { saveCredential, deleteCredential, getCredential } from "@/lib/credentials"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      method?: string
      vaultPath?: string
      apiKey?: string
      apiUrl?: string
    }
    const { method, vaultPath, apiKey, apiUrl } = body

    const credential: Record<string, string> = {}
    if (method) credential.method = method
    if (vaultPath) credential.vaultPath = vaultPath
    if (apiKey) credential.apiKey = apiKey
    if (apiUrl) credential.apiUrl = apiUrl

    await saveCredential("obsidian", credential)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const cred = await getCredential("obsidian")
    if (!cred) return NextResponse.json({ configured: false })
    return NextResponse.json({
      configured: true,
      method: cred.method ?? null,
      vaultPath: cred.vaultPath ?? null,
      hasApiKey: !!cred.apiKey,
      hasApiUrl: !!cred.apiUrl,
    })
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
