"use client"

import { useQuery } from "@tanstack/react-query"
import { TopBar } from "@/components/shared/TopBar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ObsidianNote } from "@/types/obsidian"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function NotesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["obsidian", "notes", "all"],
    queryFn: () => fetch("/api/obsidian/notes").then((r) => r.json() as Promise<{ notes: ObsidianNote[]; error?: string }>),
  })

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar title="Notes" />
      
      <div className="flex-1 p-6 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Obsidian Notes</h2>
            {data?.notes && (
              <Badge variant="outline" className="text-sm">
                {data.notes.length} Notes
              </Badge>
            )}
          </div>

          {(error || data?.error) && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {data?.error ?? "Failed to connect to Obsidian. Please check your settings and ensure the Local REST API plugin is enabled."}
            </div>
          )}

          <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
            <ScrollArea className="h-full">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                  Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-lg border border-border space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  ))
                ) : data?.notes ? (
                  data.notes.map((note) => (
                    <div
                      key={note.path}
                      className="group p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-default"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {note.title}
                        </h3>
                        <span className="text-purple-500 text-[10px] flex-shrink-0">◆</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {note.date && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded leading-none">
                            {new Date(note.date).toLocaleDateString()}
                          </span>
                        )}
                        {note.tags?.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : null}
                
                {!isLoading && data?.notes?.length === 0 && (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    No notes found with dates or titles.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}
