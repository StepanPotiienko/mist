"use client"

import { useState } from "react"
import { ExternalLink, Link2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SOURCE_LABELS } from "@/types/calendar"
import type { UnifiedEvent } from "@/types/calendar"

interface EventCardProps {
  event: UnifiedEvent
  compact?: boolean
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const [open, setOpen] = useState(false)

  const timeStr = event.allDay
    ? "All day"
    : event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  if (compact) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: event.color }}
        title={event.title}
      >
        {!event.allDay && <span className="opacity-80 mr-1">{timeStr}</span>}
        {event.title}
      </button>
    )
  }

  return (
    <>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: event.color }}
              />
              {event.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                style={{ borderColor: event.color, color: event.color }}
              >
                {SOURCE_LABELS[event.source]}
              </Badge>
              {event.calendarName && (
                <span className="text-muted-foreground">{event.calendarName}</span>
              )}
            </div>

            <div>
              <span className="font-medium">When: </span>
              {event.allDay
                ? event.start.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : `${event.start.toLocaleString()} ${event.end ? `→ ${event.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`}
            </div>

            {event.description && (
              <div>
                <span className="font-medium">Notes: </span>
                <span className="text-muted-foreground whitespace-pre-wrap">{event.description}</span>
              </div>
            )}

            {event.location && (
              <div>
                <span className="font-medium">Location: </span>
                <span className="text-muted-foreground">{event.location}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {event.sourceUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={event.sourceUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in {SOURCE_LABELS[event.source]}
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" disabled>
                <Link2 className="h-3 w-3 mr-1" />
                Link to…
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
