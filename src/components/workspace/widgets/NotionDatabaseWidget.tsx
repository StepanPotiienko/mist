"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { WidgetWrapper } from "./WidgetWrapper"
import { WidgetDetailModal, type WidgetEntry } from "./WidgetDetailModal"
import type { NotionEntry } from "@/types/notion"

interface NotionDatabaseWidgetProps {
  title: string
  databaseId: string
  view?: "list" | "compact" | "calendar"
  onViewChange?: (view: "list" | "compact" | "calendar") => void
  onRemove?: () => void
}

export function NotionDatabaseWidget({
  title,
  databaseId,
  view = "list",
  onViewChange,
  onRemove,
}: NotionDatabaseWidgetProps) {
  const [selectedEntry, setSelectedEntry] = useState<WidgetEntry | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ["notion", "database", databaseId],
    queryFn: () =>
      fetch("/api/notion/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseId }),
      })
        .then((r) => r.json() as Promise<{ entries: NotionEntry[]; error?: string }>),
    enabled: !!databaseId,
  })

  function openEntry(entry: NotionEntry) {
    setSelectedEntry({
      id: entry.id,
      title: entry.title,
      date: entry.date ? new Date(entry.date).toISOString() : undefined,
      tags: [],
      url: entry.url,
      source: "notion",
    })
  }

  return (
    <>
      <WidgetWrapper title={title} view={view} onViewChange={onViewChange} onRemove={onRemove}>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}
        {error && (
          <p className="text-xs text-destructive">Failed to load Notion database.</p>
        )}
        {data?.error && (
          <p className="text-xs text-destructive">{data.error}</p>
        )}
        {data?.entries && (
          <div className={view === "compact" ? "space-y-0.5" : "space-y-1"}>
            {data.entries.slice(0, view === "compact" ? 10 : 20).map((entry) => (
              <button
                key={entry.id}
                onClick={() => openEntry(entry)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-md transition-colors group px-2 text-left cursor-pointer",
                  view === "compact" ? "py-1" : "py-1.5 hover:bg-accent"
                )}
              >
                <span className={cn("flex-1 truncate", view === "compact" ? "text-xs" : "text-sm")}>
                  {entry.title}
                </span>
                {entry.date && view !== "compact" && (
                  <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Badge>
                )}
              </button>
            ))}
            {data.entries.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No entries found.
              </p>
            )}
          </div>
        )}
      </WidgetWrapper>

      <WidgetDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </>
  )
}
