import type { UnifiedEvent } from "@/types/calendar"
import { SOURCE_COLORS } from "@/types/calendar"

interface FetchEventsOptions {
  from: Date
  to: Date
  sources?: {
    apple?: boolean
    google?: boolean
    notion?: boolean
    obsidian?: boolean
  }
  notionDatabaseId?: string
}

export async function fetchUnifiedEvents(
  opts: FetchEventsOptions
): Promise<UnifiedEvent[]> {
  const { from, to, sources = {}, notionDatabaseId } = opts
  const enabled = {
    apple: sources.apple ?? true,
    google: sources.google ?? true,
    notion: sources.notion ?? true,
    obsidian: sources.obsidian ?? true,
  }

  const tasks: Promise<UnifiedEvent[]>[] = []

  if (enabled.apple) {
    tasks.push(
      import("./caldav")
        .then((m) => m.getAppleCalendarEvents(from, to))
        .catch(() => [])
    )
  }

  if (enabled.google) {
    tasks.push(
      import("./google-calendar")
        .then((m) => m.getGoogleCalendarEvents(from, to))
        .catch(() => [])
    )
  }

  if (enabled.notion && notionDatabaseId) {
    tasks.push(
      import("./notion")
        .then(async (m) => {
          const entries = await m.getNotionEntriesWithDates(notionDatabaseId, from, to)
          return entries
            .filter((e) => !!e.date)
            .map((e): UnifiedEvent => ({
              id: `notion-${e.id}`,
              source: "notion",
              title: e.title,
              start: e.date!,
              end: e.dateEnd,
              allDay: true,
              color: SOURCE_COLORS.notion,
              sourceUrl: e.url,
            }))
        })
        .catch(() => [])
    )
  }

  if (enabled.obsidian) {
    tasks.push(
      fetch(
        `/api/obsidian/notes?from=${from.toISOString()}&to=${to.toISOString()}`
      )
        .then(async (r) => {
          if (!r.ok) return []
          const d = await r.json() as { notes?: Array<{ path: string; title: string; date?: string }> }
          return (d.notes ?? []).map((n): UnifiedEvent => ({
            id: `obsidian-${n.path}`,
            source: "obsidian",
            title: n.title,
            start: new Date(n.date ?? 0),
            allDay: true,
            color: SOURCE_COLORS.obsidian,
          }))
        })
        .catch(() => [])
    )
  }

  const results = await Promise.all(tasks)
  const all = results.flat()

  // Deduplicate by id
  const seen = new Set<string>()
  return all.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })
}
