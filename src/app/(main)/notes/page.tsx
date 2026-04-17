"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useObsidianSync } from "@/hooks/useObsidianSync"
import { Search, ArrowUpDown } from "lucide-react"
import { TopBar } from "@/components/shared/TopBar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ObsidianNote } from "@/types/obsidian"
import { NoteModal } from "@/components/notes/NoteModal"

type SortKey = "newest" | "oldest" | "az" | "za"

export default function NotesPage() {
  useObsidianSync()

  const { data, isLoading, error } = useQuery({
    queryKey: ["obsidian", "notes", "all"],
    queryFn: () =>
      fetch("/api/obsidian/notes").then(
        (r) => r.json() as Promise<{ notes: ObsidianNote[]; error?: string }>
      ),
  })

  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortKey>("newest")
  const [selectedNote, setSelectedNote] = useState<ObsidianNote | null>(null)

  const processedNotes = useMemo(() => {
    if (!data?.notes) return []
    let notes = [...data.notes]

    // Filter by title or tag
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Sort
    switch (sort) {
      case "newest":
        notes.sort((a, b) => {
          const da = a.date ? new Date(a.date).getTime() : 0
          const db = b.date ? new Date(b.date).getTime() : 0
          return db - da
        })
        break
      case "oldest":
        notes.sort((a, b) => {
          const da = a.date ? new Date(a.date).getTime() : 0
          const db = b.date ? new Date(b.date).getTime() : 0
          return da - db
        })
        break
      case "az":
        notes.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "za":
        notes.sort((a, b) => b.title.localeCompare(a.title))
        break
    }

    return notes
  }, [data?.notes, search, sort])

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar title="Notes" />

      <div className="flex-1 p-6 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full flex flex-col gap-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Obsidian Notes</h2>
            {data?.notes && (
              <Badge variant="outline" className="text-sm">
                {processedNotes.length}
                {search ? ` / ${data.notes.length}` : ""} Notes
              </Badge>
            )}
          </div>

          {/* Filter + Sort controls */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9 h-8 text-sm"
                placeholder="Search by title or tag…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-8 w-[160px] text-sm gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="az">A → Z</SelectItem>
                <SelectItem value="za">Z → A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {(error || data?.error) && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {data?.error ??
                "Failed to connect to Obsidian. Please check your settings and ensure the Local REST API plugin is enabled."}
            </div>
          )}

          {/* Notes grid */}
          <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
            <ScrollArea className="h-full">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading
                  ? Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-lg border border-border space-y-3"
                      >
                        <Skeleton className="h-5 w-3/4" />
                        <div className="flex gap-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </div>
                    ))
                  : processedNotes.map((note) => (
                      <button
                        key={note.path}
                        onClick={() => setSelectedNote(note)}
                        className="group text-left p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                            <span
                              key={tag}
                              className="text-[10px] text-purple-600 dark:text-purple-400 font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}

                {!isLoading && processedNotes.length === 0 && (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    {search
                      ? `No notes matched "${search}".`
                      : "No notes found with dates or titles."}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Full-screen note modal */}
      {selectedNote && (
        <NoteModal
          note={selectedNote}
          open={!!selectedNote}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </div>
  )
}
