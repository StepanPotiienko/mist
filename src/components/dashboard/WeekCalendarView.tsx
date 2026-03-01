"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { UnifiedEvent } from "@/types/calendar"

interface WeekCalendarViewProps {
  events: UnifiedEvent[]
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function startOfWeek(d: Date): Date {
  const result = new Date(d)
  result.setDate(d.getDate() - d.getDay())
  result.setHours(0, 0, 0, 0)
  return result
}

function formatDayHeader(d: Date): { day: string; date: string; isToday: boolean } {
  const today = new Date()
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  return {
    day: DAY_NAMES[d.getDay()],
    date: d.getDate().toString(),
    isToday,
  }
}

function toDateNum(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

function eventCoversDay(event: UnifiedEvent, day: Date): boolean {
  const start = new Date(event.start)
  const dayNum = toDateNum(day)
  if (toDateNum(start) > dayNum) return false

  if (!event.end) return toDateNum(start) === dayNum

  const end = new Date(event.end)
  if (event.endIsExclusive !== false) {
    end.setDate(end.getDate() - 1)
  }
  return toDateNum(end) >= dayNum
}

export function WeekCalendarView({ events }: WeekCalendarViewProps) {
  const [weekOffset, setWeekOffset] = useState(0)

  const now = new Date()
  const baseWeekStart = startOfWeek(now)
  const weekStart = new Date(baseWeekStart)
  weekStart.setDate(baseWeekStart.getDate() + weekOffset * 7)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  // Partition into spanning (2+ days this week) vs single-day
  interface SpanInfo { event: UnifiedEvent; colStart: number; colSpan: number }
  const spanning: SpanInfo[] = []
  const perDay: UnifiedEvent[][] = days.map(() => [])

  for (const event of events) {
    const covered = days.reduce<number[]>((acc, d, i) => {
      if (eventCoversDay(event, d)) acc.push(i)
      return acc
    }, [])
    if (covered.length > 1) {
      spanning.push({ event, colStart: covered[0] + 1, colSpan: covered.length })
    } else if (covered.length === 1) {
      perDay[covered[0]].push(event)
    }
  }

  const monthLabel = weekStart.toLocaleString("default", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{monthLabel}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setWeekOffset((o) => o - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setWeekOffset(0)}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setWeekOffset((o) => o + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const { day: dayName, date, isToday } = formatDayHeader(day)
          return (
            <div key={i} className={`flex flex-col items-center py-1 rounded-md ${isToday ? "bg-primary/10" : ""}`}>
              <span className="text-[11px] text-muted-foreground">{dayName}</span>
              <span className={`text-sm font-semibold leading-none ${isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground" : ""}`}>
                {date}
              </span>
            </div>
          )
        })}
      </div>

      {/* Spanning multi-day events — one grid row per event */}
      {spanning.map(({ event, colStart, colSpan }) => (
        <div key={event.id} className="grid grid-cols-7 gap-1">
          <div
            className="truncate rounded px-1 py-0.5 text-[11px] font-medium text-white cursor-pointer hover:opacity-90"
            style={{ gridColumn: `${colStart} / span ${colSpan}`, backgroundColor: event.color }}
            title={event.title}
          >
            {event.title}
          </div>
        </div>
      ))}

      {/* Single-day events per column */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((_, i) => {
          const dayEvts = perDay[i]
          return (
            <div key={i} className="flex flex-col gap-0.5 min-h-[80px]">
              {dayEvts.slice(0, 3).map((evt) => (
                <div
                  key={evt.id}
                  className="truncate rounded px-1 py-0.5 text-[11px] font-medium text-white"
                  style={{ backgroundColor: evt.color }}
                  title={evt.title}
                >
                  {!evt.allDay && (
                    <span className="opacity-80 mr-1">
                      {new Date(evt.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  {evt.title}
                </div>
              ))}
              {dayEvts.length > 3 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                  +{dayEvts.length - 3} more
                </Badge>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
