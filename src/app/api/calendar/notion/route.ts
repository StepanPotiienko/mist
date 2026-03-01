import { NextRequest, NextResponse } from "next/server"
import { listDatabases, queryDatabase } from "@/lib/notion"
import type { UnifiedEvent } from "@/types/calendar"
import type { QueryDataSourceParameters } from "@notionhq/client/build/src/api-endpoints"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fromStr = searchParams.get("from")
  const toStr = searchParams.get("to")

  if (!fromStr || !toStr) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 })
  }

  const from = new Date(fromStr)
  const to = new Date(toStr)

  try {
    const databases = await listDatabases()
    const events: UnifiedEvent[] = []

    // Widen the lower bound to catch multi-day events that started before `from`
    // but whose end date falls within the requested range.
    const widenedFrom = new Date(from)
    widenedFrom.setDate(widenedFrom.getDate() - 90)

    await Promise.all(
      databases.map(async (db) => {
        const dateProps = Object.values(db.properties).filter((p) => p.type === "date")
        if (dateProps.length === 0) return

        // Prefer a property that looks like a start/begin date; fall back to the first one.
        const nameIncludes = (keywords: string[], name: string) =>
          keywords.some((k) => name.toLowerCase().includes(k))
        const startDateProp =
          dateProps.find((p) => nameIncludes(["start", "begin", "from"], p.name)) ??
          dateProps.find((p) => nameIncludes(["date"], p.name)) ??
          dateProps[0]
        const datePropName = startDateProp.name

        try {
          const entries = await queryDatabase(db.id, {
            filter: {
              and: [
                { property: datePropName, date: { on_or_after: widenedFrom.toISOString() } },
                { property: datePropName, date: { on_or_before: to.toISOString() } },
              ],
            },
          } as Partial<QueryDataSourceParameters>)

          for (const entry of entries) {
            if (!entry.date) continue

            // Only include if the event actually overlaps with the requested [from, to] range.
            // (Entries from the widened query that don't reach `from` are excluded here.)
            const entryEnd = entry.dateEnd ?? entry.date
            if (entry.date > to || entryEnd < from) continue

            let status: string | undefined
            for (const prop of Object.values(entry.properties)) {
              const p = prop as Record<string, unknown>
              if (p.type === "status" && (p.status as Record<string, string>)?.name) {
                status = (p.status as Record<string, string>).name
                break
              }
              if (p.type === "select" && (p.select as Record<string, string>)?.name) {
                status = (p.select as Record<string, string>).name
                break
              }
            }

            events.push({
              id: `notion-${entry.id}`,
              source: "notion",
              title: entry.title,
              start: entry.date,
              end: entry.dateEnd,
              // Notion date ranges are inclusive (end = last day, not day-after)
              endIsExclusive: false,
              allDay: true,
              color: "#000000",
              sourceUrl: entry.url,
              calendarName: db.title,
              status,
            })
          }
        } catch {
          // Skip this database if the date filter fails (e.g. wrong property name)
        }
      })
    )

    return NextResponse.json({ events })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
