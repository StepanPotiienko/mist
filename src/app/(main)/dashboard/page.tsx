"use client"

import { useQuery } from "@tanstack/react-query"
import { TopBar } from "@/components/shared/TopBar"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap"
import { WeekCalendarView } from "@/components/dashboard/WeekCalendarView"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { UnifiedEvent } from "@/types/calendar"

function useDashboardEvents() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const twoWeeksAhead = new Date()
  twoWeeksAhead.setDate(twoWeeksAhead.getDate() + 14)

  const params = new URLSearchParams({
    from: sixMonthsAgo.toISOString(),
    to: twoWeeksAhead.toISOString(),
  })

  const { data: appleData } = useQuery({
    queryKey: ["calendar", "apple", "dashboard"],
    queryFn: () =>
      fetch(`/api/calendar/apple?${params}`).then(async (r) => {
        const d = await r.json() as { events?: unknown[] }
        return (d.events ?? []) as UnifiedEvent[]
      }),
  })

  const { data: googleData } = useQuery({
    queryKey: ["calendar", "google", "dashboard"],
    queryFn: () =>
      fetch(`/api/calendar/google?${params}`).then(async (r) => {
        const d = await r.json() as { events?: unknown[] }
        return (d.events ?? []) as UnifiedEvent[]
      }),
  })

  const { data: obsidianData } = useQuery({
    queryKey: ["obsidian", "notes", "dashboard"],
    queryFn: () =>
      fetch(`/api/obsidian/notes?from=${params.get("from")}&to=${params.get("to")}`).then(async (r) => {
        if (!r.ok) return []
        const d = await r.json() as { notes?: Array<{ path: string; title: string; date?: string }> }
        return (d.notes ?? []).map(
          (n): UnifiedEvent => ({
            id: `obsidian-${n.path}`,
            source: "obsidian",
            title: n.title,
            start: new Date(n.date ?? 0),
            allDay: true,
            color: "#7C3AED",
          })
        )
      }),
  })

  const { data: notionData } = useQuery({
    queryKey: ["calendar", "notion", "dashboard"],
    queryFn: () =>
      fetch(`/api/calendar/notion?${params}`).then(async (r) => {
        if (!r.ok) return []
        const d = await r.json() as { events?: unknown[] }
        return (d.events ?? []) as UnifiedEvent[]
      }),
  })

  const allEvents: UnifiedEvent[] = [
    ...(appleData ?? []),
    ...(googleData ?? []),
    ...(obsidianData ?? []),
    ...(notionData ?? []),
  ].map((e) => ({ ...e, start: new Date(e.start) }))

  return {
    events: allEvents,
    obsidianCount: (obsidianData ?? []).length,
    notionCount: (notionData ?? []).length,
    isLoading: !appleData && !googleData && !obsidianData && !notionData,
  }
}

export default function DashboardPage() {
  const { events, obsidianCount, notionCount, isLoading } = useDashboardEvents()

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <StatsCards
            events={events}
            totalNotes={obsidianCount}
            totalTasks={notionCount}
          />
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Activity Heatmap */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Activity</CardTitle>
              <p className="text-xs text-muted-foreground">Events and notes over the last 6 months</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-28 w-full" />
              ) : (
                <ActivityHeatmap events={events} weeks={26} />
              )}
            </CardContent>
          </Card>

          {/* This Week */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">This Week</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <WeekCalendarView events={events} />
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
