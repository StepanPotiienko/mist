import { NextResponse } from "next/server"
import { listDatabases } from "@/lib/notion"

export async function GET() {
  try {
    const databases = await listDatabases()
    return NextResponse.json({ databases })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
