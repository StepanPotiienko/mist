"use client"

import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { WidgetWrapper } from "./WidgetWrapper"
import { WeekCalendarView } from "@/components/dashboard/WeekCalendarView"
import type { UnifiedEvent } from "@/types/calendar"

interface CalendarMiniWidgetProps {
  title: string
  onRemove?: () => void
}

export function CalendarMiniWidget({ title, onRemove }: CalendarMiniWidgetProps) {
  const from = new Date()
  from.setDate(from.getDate() - 7)
  const to = new Date()
  to.setDate(to.getDate() + 14)
  const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() })

  const { data: appleData } = useQuery({
    queryKey: ["calendar", "apple", "widget"],
    queryFn: () =>
      fetch(`/api/calendar/apple?${params}`)
        .then(async (r) => {
          const d = await r.json()
          if (!r.ok) throw new Error(d.error || `HTTP error ${r.status}`)
          return d as { events: UnifiedEvent[] }
        })
        .then((d) => (d.events ?? []).map((e) => ({ ...e, start: new Date(e.start) }))),
  })

  const { data: googleData } = useQuery({
    queryKey: ["calendar", "google", "widget"],
    queryFn: () =>
      fetch(`/api/calendar/google?${params}`)
        .then(async (r) => {
          const d = await r.json()
          if (!r.ok) throw new Error(d.error || `HTTP error ${r.status}`)
          return d as { events: UnifiedEvent[] }
        })
        .then((d) => (d.events ?? []).map((e) => ({ ...e, start: new Date(e.start) }))),
  })

  const events: UnifiedEvent[] = [...(appleData ?? []), ...(googleData ?? [])]
  const isLoading = !appleData && !googleData

  return (
    <WidgetWrapper title={title} onRemove={onRemove}>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <WeekCalendarView events={events} />
      )}
    </WidgetWrapper>
  )
}
