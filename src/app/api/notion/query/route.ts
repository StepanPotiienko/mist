import { NextRequest, NextResponse } from "next/server"
import { queryDatabase } from "@/lib/notion"
import type { QueryDataSourceParameters } from "@notionhq/client/build/src/api-endpoints"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      databaseId: string
      filter?: QueryDataSourceParameters["filter"]
      sorts?: QueryDataSourceParameters["sorts"]
    }
    const { databaseId, filter, sorts } = body

    if (!databaseId) {
      return NextResponse.json({ error: "databaseId is required" }, { status: 400 })
    }

    const entries = await queryDatabase(databaseId, { filter, sorts })
    return NextResponse.json({ entries })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
