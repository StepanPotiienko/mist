"use client"

import { useState } from "react"
import { ExternalLink, Clock, MapPin, FileText, Tag, Folder } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SOURCE_LABELS } from "@/types/calendar"
import type { UnifiedEvent } from "@/types/calendar"

interface EventCardProps {
  event: UnifiedEvent
  compact?: boolean
}

function formatDuration(start: Date, end: Date): string {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function formatDateRange(event: UnifiedEvent): string {
  if (event.allDay) {
    const startStr = event.start.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    if (event.end) {
      // iCal all-day end is exclusive — subtract 1 day for display
      const endAdj = new Date(event.end)
      endAdj.setDate(endAdj.getDate() - 1)
      if (endAdj.getTime() > event.start.getTime()) {
        const endStr = endAdj.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
        return `${startStr} – ${endStr}`
      }
    }
    return startStr
  }

  const dateStr = event.start.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const startTime = event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  if (!event.end) return `${dateStr}\n${startTime}`

  const endTime = event.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const duration = formatDuration(event.start, event.end)
  return `${dateStr}\n${startTime} – ${endTime} (${duration})`
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const [open, setOpen] = useState(false)

  const timeStr = event.allDay
    ? "All day"
    : event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  const dateRange = formatDateRange(event)

  // Obsidian note path is encoded in the id as "obsidian-{path}"
  const obsidianPath =
    event.source === "obsidian" ? event.id.replace(/^obsidian-/, "") : undefined

  return (
    <>
      {compact ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: event.color }}
          title={event.title}
        >
          {!event.allDay && <span className="opacity-80 mr-1">{timeStr}</span>}
          {event.title}
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="group flex w-full items-start gap-2 rounded-lg border border-border bg-card p-3 text-left hover:bg-accent/50 transition-colors"
        >
          <div
            className="mt-0.5 h-3 w-1 flex-shrink-0 rounded-full"
            style={{ backgroundColor: event.color }}
          />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{event.title}</p>
            <p className="text-xs text-muted-foreground">{timeStr}</p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] flex-shrink-0"
            style={{ borderColor: event.color, color: event.color }}
          >
            {SOURCE_LABELS[event.source]}
          </Badge>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-6">
              <span
                className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: event.color }}
              />
              <span className="leading-snug">{event.title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            {/* Source + calendar/database name */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" style={{ borderColor: event.color, color: event.color }}>
                {SOURCE_LABELS[event.source]}
              </Badge>
              {event.calendarName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Folder className="h-3 w-3" />
                  {event.calendarName}
                </div>
              )}
            </div>

            {/* Date / time */}
            <div className="flex gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground whitespace-pre-line">{dateRange}</span>
            </div>

            {/* Status (Notion select/status field) */}
            {event.status && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{event.status}</span>
              </div>
            )}

            {/* Location */}
            {event.location && (
              <div className="flex gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{event.location}</span>
              </div>
            )}

            {/* Description / notes */}
            {event.description && (
              <div className="flex gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground whitespace-pre-wrap line-clamp-6">
                  {event.description}
                </span>
              </div>
            )}

            {/* Obsidian note path */}
            {obsidianPath && (
              <div className="flex gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground text-xs font-mono break-all">
                  {obsidianPath}
                </span>
              </div>
            )}

            {/* External link */}
            {event.sourceUrl && (
              <div className="pt-1">
                <Button variant="outline" size="sm" asChild>
                  <a href={event.sourceUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in {SOURCE_LABELS[event.source]}
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
