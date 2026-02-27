import { NextRequest, NextResponse } from "next/server"
import { getAppleCalendarEvents } from "@/lib/caldav"
import type { UnifiedEvent } from "@/types/calendar"

interface CacheEntry {
  events: UnifiedEvent[]
  fetchedAt: number
}

// Module-level in-memory cache — survives across requests in the same process
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fromStr = searchParams.get("from") ?? new Date().toISOString()
    const toStr = searchParams.get("to") ?? new Date(Date.now() + 30 * 86400000).toISOString()
    const selectedStr = searchParams.get("selected") ?? ""

    // Round timestamps to the nearest hour for a stable cache key
    const fromHour = new Date(fromStr)
    fromHour.setMinutes(0, 0, 0)
    const toHour = new Date(toStr)
    toHour.setMinutes(0, 0, 0)
    const cacheKey = `${fromHour.toISOString()}|${toHour.toISOString()}|${selectedStr}`

    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      console.log(`Apple Calendar: serving ${cached.events.length} events from cache`)
      return NextResponse.json({ events: cached.events, cached: true })
    }

    const from = new Date(fromStr)
    const to = new Date(toStr)
    const selected = selectedStr ? selectedStr.split(",") : undefined
    const events = await getAppleCalendarEvents(from, to, selected)

    cache.set(cacheKey, { events, fetchedAt: Date.now() })
    return NextResponse.json({ events })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
