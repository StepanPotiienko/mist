"use client"

import { useMemo } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { UnifiedEvent } from "@/types/calendar"

interface ActivityHeatmapProps {
  events: UnifiedEvent[]
  weeks?: number
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getDayLabel(dayIndex: number): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex]
}

function getMonthLabel(d: Date): string {
  return d.toLocaleString("default", { month: "short" })
}

export function ActivityHeatmap({ events, weeks = 26 }: ActivityHeatmapProps) {
  const { grid, maxCount, monthMarkers } = useMemo(() => {
    // Build a map: dateStr → count
    const countMap: Record<string, number> = {}
    for (const event of events) {
      const key = formatDate(event.start)
      countMap[key] = (countMap[key] ?? 0) + 1
    }

    // Build grid: past `weeks` weeks ending today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from the Sunday before `weeks` weeks ago
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7)

    const columns: Array<Array<{ date: Date; count: number }>> = []
    const markers: Array<{ col: number; label: string }> = []
    let lastMonth = -1

    let cursor = new Date(start)
    for (let w = 0; w < weeks; w++) {
      const col: Array<{ date: Date; count: number }> = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(cursor)
        col.push({ date, count: countMap[formatDate(date)] ?? 0 })
        cursor.setDate(cursor.getDate() + 1)
      }

      const monthNow = col[0].date.getMonth()
      if (monthNow !== lastMonth) {
        markers.push({ col: w, label: getMonthLabel(col[0].date) })
        lastMonth = monthNow
      }

      columns.push(col)
    }

    const maxCount = Math.max(1, ...Object.values(countMap))
    return { grid: columns, maxCount, monthMarkers: markers }
  }, [events, weeks])

  function getColor(count: number): string {
    if (count === 0) return "bg-muted"
    const intensity = Math.ceil((count / maxCount) * 4)
    return [
      "",
      "bg-blue-200 dark:bg-blue-900",
      "bg-blue-300 dark:bg-blue-700",
      "bg-blue-400 dark:bg-blue-600",
      "bg-blue-500 dark:bg-blue-500",
    ][intensity] ?? "bg-blue-500"
  }

  return (
    <div className="w-fit">
      <div className="flex flex-col gap-1 w-fit overflow-visible">
        {/* Month labels */}
        <div className="flex gap-1 pl-8">
          {grid.map((_, colIdx) => {
            const marker = monthMarkers.find((m) => m.col === colIdx)
            return (
              <div key={colIdx} className="w-3 text-[10px] text-muted-foreground">
                {marker?.label ?? ""}
              </div>
            )
          })}
        </div>

        {/* Day rows */}
        {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
          <div key={dayIdx} className="flex items-center gap-1">
            <span className="w-7 text-right text-[10px] text-muted-foreground pr-1">
              {dayIdx % 2 === 1 ? getDayLabel(dayIdx) : ""}
            </span>
            {grid.map((col, colIdx) => {
              const cell = col[dayIdx]
              return (
                <Tooltip key={colIdx}>
                  <TooltipTrigger asChild>
                    <div
                      className={`h-3 w-3 rounded-sm cursor-default ${getColor(cell.count)}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {cell.count} event{cell.count !== 1 ? "s" : ""} on{" "}
                      {cell.date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
