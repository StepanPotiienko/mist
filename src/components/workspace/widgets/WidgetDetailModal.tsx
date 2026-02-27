"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, PanelRight, Square, Maximize2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from "react-markdown"

type ViewMode = "side" | "center" | "full"

// ------------------------------------------------------------------
// Generic entry that both Notion + Obsidian pass in
// ------------------------------------------------------------------
export interface WidgetEntry {
  id: string
  title: string
  /** ISO date string or undefined */
  date?: string
  /** tags / status badges */
  tags?: string[]
  /** Rendered body (markdown for Obsidian, rich text for Notion) */
  content?: string
  /** Open in external app / browser */
  url?: string
  source: "notion" | "obsidian"
}

interface WidgetDetailModalProps {
  entry: WidgetEntry | null
  onClose: () => void
}

const OVERLAY_CLASSES = "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-end transition-opacity duration-200"

const PANEL_CLASSES: Record<ViewMode, string> = {
  side: "h-full w-full max-w-[480px] border-l",
  center: "m-auto h-[80vh] w-full max-w-2xl rounded-xl border",
  full: "m-auto h-[96vh] w-[96vw] max-w-none rounded-xl border",
}

export function WidgetDetailModal({ entry, onClose }: WidgetDetailModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("side")

  useEffect(() => {
    if (!entry) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [entry, onClose])

  if (!entry) return null

  const isCenter = viewMode === "center" || viewMode === "full"

  return (
    <div
      className={OVERLAY_CLASSES}
      style={{ alignItems: isCenter ? "center" : "flex-start" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`flex flex-col bg-background shadow-2xl overflow-hidden transition-all duration-200 ${PANEL_CLASSES[viewMode]}`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {entry.source === "obsidian" ? "Obsidian Note" : "Notion Entry"}
            </span>
          </div>

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
            {entry.url && (
              <>
                <div className="w-px h-4 bg-border mx-1" />
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Open in browser"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </>
            )}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Title */}
          <h1 className="text-2xl font-bold leading-tight mb-3">{entry.title}</h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {entry.date && (
              <Badge variant="secondary" className="text-xs">
                {new Date(entry.date).toLocaleDateString("en-US", {
                  weekday: "short", year: "numeric", month: "short", day: "numeric",
                })}
              </Badge>
            )}
            {entry.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Content */}
          {entry.content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{entry.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {entry.source === "obsidian"
                ? "No content preview available."
                : "Open in Notion to view full entry."}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
