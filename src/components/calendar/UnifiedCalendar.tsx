"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EventCard } from "./EventCard"
import type { UnifiedEvent } from "@/types/calendar"

type ViewMode = "day" | "week" | "month"

interface UnifiedCalendarProps {
  events: UnifiedEvent[]
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function startOfWeek(d: Date): Date {
  const r = startOfDay(d)
  r.setDate(r.getDate() - r.getDay())
  return r
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function UnifiedCalendar({ events }: UnifiedCalendarProps) {
  const [view, setView] = useState<ViewMode>("week")
  const [cursor, setCursor] = useState(new Date())

  function navigate(delta: number) {
    setCursor((prev) => {
      const next = new Date(prev)
      if (view === "day") next.setDate(next.getDate() + delta)
      if (view === "week") next.setDate(next.getDate() + delta * 7)
      if (view === "month") next.setMonth(next.getMonth() + delta)
      return next
    })
  }

  function getTitle(): string {
    if (view === "day") {
      return cursor.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    }
    if (view === "week") {
      const ws = startOfWeek(cursor)
      const we = new Date(ws)
      we.setDate(ws.getDate() + 6)
      return `${ws.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${we.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    }
    return cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  function eventsForDay(d: Date): UnifiedEvent[] {
    return events
      .filter((e) => sameDay(new Date(e.start), d))
      .sort((a, b) => (a.allDay ? -1 : 1) - (b.allDay ? -1 : 1) || a.start.getTime() - b.start.getTime())
  }

  // ── Day View ──────────────────────────────────────────────────────────────
  function renderDay() {
    const dayEvts = eventsForDay(cursor)
    return (
      <div className="space-y-2 pt-2">
        {dayEvts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No events today.</p>
        ) : (
          dayEvts.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </div>
    )
  }

  // ── Week View ─────────────────────────────────────────────────────────────
  function renderWeek() {
    const ws = startOfWeek(cursor)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws)
      d.setDate(ws.getDate() + i)
      return d
    })
    const today = new Date()

    return (
      <div className="grid grid-cols-7 gap-1 pt-2">
        {days.map((day, i) => {
          const evts = eventsForDay(day)
          const isToday = sameDay(day, today)
          return (
            <div key={i} className="flex flex-col">
              <div
                className={`mb-1 rounded-md py-1 text-center ${isToday ? "bg-primary/10" : ""}`}
              >
                <p className="text-[11px] text-muted-foreground">{DAYS[day.getDay()]}</p>
                <p
                  className={`text-sm font-semibold ${isToday ? "flex h-6 w-6 mx-auto items-center justify-center rounded-full bg-primary text-primary-foreground text-xs" : ""}`}
                >
                  {day.getDate()}
                </p>
              </div>
              <div className="flex flex-col gap-0.5 min-h-[120px]">
                {evts.slice(0, 5).map((e) => (
                  <EventCard key={e.id} event={e} compact />
                ))}
                {evts.length > 5 && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    +{evts.length - 5}
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Month View ────────────────────────────────────────────────────────────
  function renderMonth() {
    const ms = startOfMonth(cursor)
    const firstDow = ms.getDay()
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const today = new Date()

    // Pad beginning
    const cells: Array<Date | null> = Array(firstDow).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))
    }
    // Pad end to multiple of 7
    while (cells.length % 7 !== 0) cells.push(null)

    return (
      <div className="pt-2">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-muted-foreground pb-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="h-24 rounded-lg" />
            const evts = eventsForDay(day)
            const isToday = sameDay(day, today)
            const isCurrentMonth = day.getMonth() === cursor.getMonth()

            return (
              <div
                key={i}
                className={`h-24 rounded-lg border border-border p-1 overflow-hidden ${
                  isToday ? "border-primary/50 bg-primary/5" : ""
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <p
                  className={`text-xs font-medium mb-0.5 leading-none ${
                    isToday
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]"
                      : "text-muted-foreground"
                  }`}
                >
                  {day.getDate()}
                </p>
                <div className="flex flex-col gap-0.5">
                  {evts.slice(0, 3).map((e) => (
                    <EventCard key={e.id} event={e} compact />
                  ))}
                  {evts.length > 3 && (
                    <span className="text-[10px] text-muted-foreground px-1">
                      +{evts.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-52 text-center">{getTitle()}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setCursor(new Date())}
          >
            Today
          </Button>
        </div>

        <div className="flex rounded-md border border-border overflow-hidden">
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <Button
              key={v}
              variant={view === v ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-8 text-xs capitalize"
              onClick={() => setView(v)}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === "day" && renderDay()}
        {view === "week" && renderWeek()}
        {view === "month" && renderMonth()}
      </div>
    </div>
  )
}
