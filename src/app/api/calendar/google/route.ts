import { NextRequest, NextResponse } from "next/server"
import { getGoogleCalendarEvents } from "@/lib/google-calendar"
import type { UnifiedEvent } from "@/types/calendar"

interface CacheEntry {
  events: UnifiedEvent[]
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fromStr = searchParams.get("from") ?? new Date().toISOString()
    const toStr = searchParams.get("to") ?? new Date(Date.now() + 30 * 86400000).toISOString()

    const fromHour = new Date(fromStr)
    fromHour.setMinutes(0, 0, 0)
    const toHour = new Date(toStr)
    toHour.setMinutes(0, 0, 0)
    const cacheKey = `${fromHour.toISOString()}|${toHour.toISOString()}`

    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      console.log(`Google Calendar: serving ${cached.events.length} events from cache`)
      return NextResponse.json({ events: cached.events, cached: true })
    }

    const events = await getGoogleCalendarEvents(new Date(fromStr), new Date(toStr))
    cache.set(cacheKey, { events, fetchedAt: Date.now() })
    return NextResponse.json({ events })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
