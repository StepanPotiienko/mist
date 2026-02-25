"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, FileText, CheckSquare, TrendingUp } from "lucide-react"
import type { UnifiedEvent } from "@/types/calendar"

interface StatsCardsProps {
  events: UnifiedEvent[]
  totalNotes: number
  totalTasks: number
}

export function StatsCards({ events, totalNotes, totalTasks }: StatsCardsProps) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const thisWeekEvents = events.filter(
    (e) => e.start >= weekStart && e.start <= now
  )

  const upcomingEvents = events.filter(
    (e) => e.start > now && e.start <= new Date(now.getTime() + 7 * 86400000)
  )

  const stats = [
    {
      title: "Events This Week",
      value: thisWeekEvents.length,
      icon: CalendarDays,
      description: "across all calendars",
      color: "text-blue-500",
    },
    {
      title: "Upcoming (7 days)",
      value: upcomingEvents.length,
      icon: TrendingUp,
      description: "events ahead",
      color: "text-green-500",
    },
    {
      title: "Notes with Dates",
      value: totalNotes,
      icon: FileText,
      description: "in Obsidian vault",
      color: "text-purple-500",
    },
    {
      title: "Notion Tasks",
      value: totalTasks,
      icon: CheckSquare,
      description: "in linked databases",
      color: "text-orange-500",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
