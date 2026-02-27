"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { X, FileText, Calendar, Tag, Loader2, PanelRight, Maximize2, Square } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { ObsidianNote } from "@/types/obsidian"
import ReactMarkdown from "react-markdown"

type ViewMode = "side" | "center" | "full"

interface NoteModalProps {
  note: ObsidianNote
  open: boolean
  onClose: () => void
}

export function NoteModal({ note, open, onClose }: NoteModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("center")

  const { data, isLoading, error } = useQuery({
    queryKey: ["obsidian", "note", note.path],
    queryFn: () =>
      fetch(`/api/obsidian/note/${encodeURIComponent(note.path)}`).then(
        (r) => r.json() as Promise<{ note: ObsidianNote; error?: string }>
      ),
    enabled: open,
    staleTime: 1000 * 60 * 5,
  })

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  const content = data?.note?.content ?? note.content

  // Panel sizing per mode
  const panelClass = {
    side: "fixed top-0 right-0 h-full w-[480px] max-w-full flex flex-col shadow-2xl border-l border-border bg-background z-50 animate-in slide-in-from-right duration-200",
    center: "fixed inset-0 m-auto h-[90vh] w-[780px] max-w-[95vw] flex flex-col rounded-xl shadow-2xl border border-border bg-background z-50 animate-in fade-in zoom-in-95 duration-200",
    full: "fixed inset-0 h-full w-full flex flex-col bg-background z-50 animate-in fade-in duration-150",
  }[viewMode]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={panelClass}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-purple-500 shrink-0" />
              <h2 className="text-lg font-semibold leading-tight truncate">{note.title}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {note.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(note.date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
              {note.tags?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {note.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">
                      #{t}
                    </Badge>
                  ))}
                </span>
              )}
              <span className="font-mono text-[10px] opacity-60 truncate">{note.path}</span>
            </div>
          </div>

          {/* View mode controls + close */}
          <div className="ml-4 flex items-center gap-1 shrink-0">
            <button
              title="Side peek"
              onClick={() => setViewMode("side")}
              className={`rounded-md p-1.5 transition-colors ${viewMode === "side" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
            >
              <PanelRight className="h-3.5 w-3.5" />
            </button>
            <button
              title="Center view"
              onClick={() => setViewMode("center")}
              className={`rounded-md p-1.5 transition-colors ${viewMode === "center" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
            >
              <Square className="h-3.5 w-3.5" />
            </button>
            <button
              title="Full view"
              onClick={() => setViewMode("full")}
              className={`rounded-md p-1.5 transition-colors ${viewMode === "full" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              onClick={onClose}
              title="Close"
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0 px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading note…</span>
            </div>
          ) : error || data?.error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {data?.error ?? "Failed to load note content."}
            </div>
          ) : content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">This note has no content.</p>
          )}
        </ScrollArea>
      </div>
    </>
  )
}
