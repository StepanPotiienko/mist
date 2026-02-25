"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { TopBar } from "@/components/shared/TopBar"
import { SourceFilter } from "@/components/calendar/SourceFilter"
import { UnifiedCalendar } from "@/components/calendar/UnifiedCalendar"
import { Skeleton } from "@/components/ui/skeleton"
import type { UnifiedEvent, CalendarSource } from "@/types/calendar"

const DEFAULT_ENABLED: Record<CalendarSource, boolean> = {
  apple: true,
  google: true,
  notion: true,
  obsidian: true,
}

export default function CalendarPage() {
  const [enabled, setEnabled] = useState(DEFAULT_ENABLED)

  function toggleSource(source: CalendarSource) {
    setEnabled((prev) => ({ ...prev, [source]: !prev[source] }))
  }

  const from = new Date()
  from.setMonth(from.getMonth() - 1)
  const to = new Date()
  to.setMonth(to.getMonth() + 2)
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  })

  const { data: appleEvents = [] } = useQuery({
    queryKey: ["calendar", "apple"],
    queryFn: () =>
      fetch(`/api/calendar/apple?${params}`)
        .then((r) => r.json() as Promise<{ events: UnifiedEvent[] }>)
        .then((d) => (d.events ?? []).map((e) => ({ ...e, start: new Date(e.start) }))),
    enabled: enabled.apple,
  })

  const { data: googleEvents = [] } = useQuery({
    queryKey: ["calendar", "google"],
    queryFn: () =>
      fetch(`/api/calendar/google?${params}`)
        .then((r) => r.json() as Promise<{ events: UnifiedEvent[] }>)
        .then((d) => (d.events ?? []).map((e) => ({ ...e, start: new Date(e.start) }))),
    enabled: enabled.google,
  })

  const { data: obsidianNotes = [] } = useQuery({
    queryKey: ["obsidian", "notes"],
    queryFn: () =>
      fetch(`/api/obsidian/notes?from=${params.get("from")}&to=${params.get("to")}`)
        .then((r) => r.json() as Promise<{ notes: Array<{ path: string; title: string; date?: string }> }>)
        .then(
          (d) =>
            (d.notes ?? []).map(
              (n): UnifiedEvent => ({
                id: `obsidian-${n.path}`,
                source: "obsidian",
                title: n.title,
                start: new Date(n.date ?? 0),
                allDay: true,
                color: "#7C3AED",
              })
            )
        ),
    enabled: enabled.obsidian,
  })

  const allEvents: UnifiedEvent[] = [
    ...(enabled.apple ? appleEvents : []),
    ...(enabled.google ? googleEvents : []),
    ...(enabled.obsidian ? obsidianNotes : []),
  ]

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Calendar">
        <SourceFilter enabled={enabled} onToggle={toggleSource} />
      </TopBar>
      <div className="flex-1 overflow-hidden p-6">
        <UnifiedCalendar events={allEvents} />
      </div>
    </div>
  )
}
