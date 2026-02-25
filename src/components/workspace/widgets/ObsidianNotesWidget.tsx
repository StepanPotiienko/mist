"use client"

import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { WidgetWrapper } from "./WidgetWrapper"
import type { ObsidianNote } from "@/types/obsidian"

interface ObsidianNotesWidgetProps {
  title: string
  tag?: string
  view?: "list" | "compact" | "calendar"
  onViewChange?: (view: "list" | "compact" | "calendar") => void
  onRemove?: () => void
}

export function ObsidianNotesWidget({
  title,
  tag,
  view = "list",
  onViewChange,
  onRemove,
}: ObsidianNotesWidgetProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["obsidian", "notes", "widget", tag],
    queryFn: () =>
      fetch(`/api/obsidian/notes${tag ? `?q=${encodeURIComponent(tag)}` : ""}`)
        .then((r) => r.json() as Promise<{ notes: ObsidianNote[]; error?: string }>),
  })

  return (
    <WidgetWrapper title={title} view={view} onViewChange={onViewChange} onRemove={onRemove}>
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      )}
      {(error || data?.error) && (
        <p className="text-xs text-muted-foreground text-center py-4">
          {data?.error ?? "Could not connect to Obsidian. Make sure the Local REST API plugin is running."}
        </p>
      )}
      {data?.notes && (
        <div className={view === "compact" ? "space-y-0.5" : "space-y-1"}>
          {data.notes.slice(0, view === "compact" ? 10 : 20).map((note) => (
            <div
              key={note.path}
              className={cn(
                "flex items-center gap-2 rounded-md transition-colors px-2",
                view === "compact" ? "py-1" : "py-1.5 hover:bg-accent"
              )}
            >
              <span className="text-purple-500 text-[10px] flex-shrink-0">◆</span>
              <span className={cn("flex-1 truncate", view === "compact" ? "text-xs" : "text-sm")}>
                {note.title}
              </span>
              {note.date && view !== "compact" && (
                <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                  {new Date(note.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Badge>
              )}
            </div>
          ))}
          {data.notes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No notes with dates found.
            </p>
          )}
        </div>
      )}
    </WidgetWrapper>
  )
}
