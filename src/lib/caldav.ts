import { createDAVClient, DAVObject } from "tsdav"
import { getCredential } from "./credentials"
import type { UnifiedEvent } from "@/types/calendar"

interface ICalEvent {
  summary?: string
  dtstart?: string
  dtend?: string
  uid?: string
  description?: string
  location?: string
  allDay?: boolean
}

function parseICalDate(value: string): Date {
  // DATE-TIME format: 19980118T230000Z or 19980118T230000
  // DATE format (all-day): 19980118
  if (value.length === 8) {
    const y = parseInt(value.slice(0, 4))
    const m = parseInt(value.slice(4, 6)) - 1
    const d = parseInt(value.slice(6, 8))
    return new Date(y, m, d)
  }
  return new Date(value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)/, "$1-$2-$3T$4:$5:$6$7"))
}

function parseVEvent(vEventText: string): ICalEvent | null {
  const lines: Record<string, string> = {}
  let inEvent = false

  for (const raw of vEventText.split(/\r?\n/)) {
    const line = raw.replace(/^\s+/, "") // unfold
    if (line === "BEGIN:VEVENT") { inEvent = true; continue }
    if (line === "END:VEVENT") break
    if (!inEvent) continue
    const sep = line.indexOf(":")
    if (sep === -1) continue
    const key = line.slice(0, sep).toUpperCase().split(";")[0]
    const val = line.slice(sep + 1)
    lines[key] = val
  }

  if (!lines["DTSTART"]) return null

  const dtstart = lines["DTSTART"]
  const dtend = lines["DTEND"]
  const allDay = dtstart.length === 8

  return {
    uid: lines["UID"],
    summary: lines["SUMMARY"],
    dtstart,
    dtend,
    description: lines["DESCRIPTION"],
    location: lines["LOCATION"],
    allDay,
  }
}

export async function getAppleCalendarEvents(
  from: Date,
  to: Date,
  selectedCalendars?: string[]
): Promise<UnifiedEvent[]> {
  const cred = await getCredential("apple")
  const username = cred?.username || process.env.APPLE_CALDAV_USERNAME || ""
  const password = cred?.password || process.env.APPLE_CALENDAR_PASSWORD || ""
  if (!username || !password) {
    console.log("Apple Calendar: no credentials found (DB or env)")
    return []
  }

  const client = await createDAVClient({
    serverUrl: "https://caldav.icloud.com",
    credentials: {
      username,
      password,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  })

  const allCalendars = await client.fetchCalendars()

  const filteredCalendars = selectedCalendars && selectedCalendars.length > 0
    ? allCalendars.filter((cal) => {
        const name = typeof cal.displayName === "string" ? cal.displayName : ""
        return selectedCalendars.includes(name)
      })
    : allCalendars

  const perCalendarEvents = await Promise.all(
    filteredCalendars.map(async (calendar) => {
      const objects: DAVObject[] = await client.fetchCalendarObjects({
        calendar,
        timeRange: {
          start: from.toISOString(),
          end: to.toISOString(),
        },
      })

      const rawColor = (calendar as { color?: unknown }).color
      const calColor = typeof rawColor === "string" ? rawColor : "#FF3B30"
      const calName = typeof calendar.displayName === "string" ? calendar.displayName : undefined

      const events: UnifiedEvent[] = []
      for (const obj of objects) {
        if (!obj.data) continue
        const ical = String(obj.data)
        const eventBlocks = ical.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? []
        for (const block of eventBlocks) {
          const parsed = parseVEvent(block)
          if (!parsed?.dtstart) continue
          const start = parseICalDate(parsed.dtstart)
          const end = parsed.dtend ? parseICalDate(parsed.dtend) : undefined
          events.push({
            id: `apple-${parsed.uid ?? obj.url}`,
            source: "apple",
            title: parsed.summary ?? "No Title",
            start,
            end,
            allDay: parsed.allDay ?? false,
            color: calColor,
            description: parsed.description,
            location: parsed.location,
            calendarName: calName,
          })
        }
      }
      console.log(`Apple Calendar [${calName}]: ${objects.length} objects → ${events.length} events`)
      return events
    })
  )

  const allEvents = perCalendarEvents.flat()
  console.log(`Apple Calendar total: ${allEvents.length} events from ${filteredCalendars.length} calendars`)
  return allEvents
}
export async function listAppleCalendars(): Promise<Array<{ id: string; name: string; color: string }>> {
  const cred = await getCredential("apple")
  const username = cred?.username || process.env.APPLE_CALDAV_USERNAME || ""
  const password = cred?.password || process.env.APPLE_CALENDAR_PASSWORD || ""
  if (!username || !password) {
    return []
  }

  const client = await createDAVClient({
    serverUrl: "https://caldav.icloud.com",
    credentials: {
      username,
      password,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  })

  const calendars = await client.fetchCalendars()
  return calendars.map((cal) => {
    const rawColor = (cal as { color?: unknown }).color
    const calColor = typeof rawColor === "string" ? rawColor : "#FF3B30"
    return {
      id: cal.url,
      name: typeof cal.displayName === "string" ? cal.displayName : "Untitled",
      color: calColor,
    }
  })
}
