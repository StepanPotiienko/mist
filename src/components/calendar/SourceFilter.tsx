"use client"

import { Badge } from "@/components/ui/badge"
import type { CalendarSource } from "@/types/calendar"
import { SOURCE_COLORS, SOURCE_LABELS } from "@/types/calendar"

interface SourceFilterProps {
  enabled: Record<CalendarSource, boolean>
  onToggle: (source: CalendarSource) => void
}

export function SourceFilter({ enabled, onToggle }: SourceFilterProps) {
  const sources: CalendarSource[] = ["apple", "google", "notion", "obsidian"]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {sources.map((src) => (
        <button
          key={src}
          onClick={() => onToggle(src)}
          className="focus:outline-none"
        >
          <Badge
            variant={enabled[src] ? "default" : "outline"}
            className="cursor-pointer select-none gap-1.5 transition-opacity"
            style={
              enabled[src]
                ? { backgroundColor: SOURCE_COLORS[src], color: "white", borderColor: SOURCE_COLORS[src] }
                : { borderColor: SOURCE_COLORS[src], color: SOURCE_COLORS[src], opacity: 0.6 }
            }
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: enabled[src] ? "white" : SOURCE_COLORS[src] }}
            />
            {SOURCE_LABELS[src]}
          </Badge>
        </button>
      ))}
    </div>
  )
}
