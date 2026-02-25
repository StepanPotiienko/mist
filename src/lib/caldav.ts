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
  if (!cred?.username || !cred?.password) {
    return []
  }

  const client = await createDAVClient({
    serverUrl: "https://caldav.icloud.com",
    credentials: {
      username: cred.username,
      password: cred.password,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  })

  const calendars = await client.fetchCalendars()
  const events: UnifiedEvent[] = []

  for (const calendar of calendars) {
    if (selectedCalendars && selectedCalendars.length > 0) {
      const name = typeof calendar.displayName === "string" ? calendar.displayName : ""
      if (!selectedCalendars.includes(name)) continue
    }
    const objects: DAVObject[] = await client.fetchCalendarObjects({
      calendar,
      timeRange: {
        start: from.toISOString(),
        end: to.toISOString(),
      },
    })

    const rawColor = (calendar as { color?: unknown }).color
    const calColor = typeof rawColor === "string" ? rawColor : "#FF3B30"

    for (const obj of objects) {
      if (!obj.data) continue
      const ical = String(obj.data)

      // A single .ics may have multiple VEVENT blocks
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
          calendarName: typeof calendar.displayName === "string" ? calendar.displayName : undefined,
        })
      }
    }
  }

  return events
}
export async function listAppleCalendars(): Promise<Array<{ id: string; name: string; color: string }>> {
  const cred = await getCredential("apple")
  if (!cred?.username || !cred?.password) {
    return []
  }

  const client = await createDAVClient({
    serverUrl: "https://caldav.icloud.com",
    credentials: {
      username: cred.username,
      password: cred.password,
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
