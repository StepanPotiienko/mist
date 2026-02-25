"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface WidgetConfig {
  i: string // unique widget id
  x: number
  y: number
  w: number
  h: number
  type: "notion-database" | "obsidian-notes" | "calendar-mini" | "stats"
  title: string
  view?: "list" | "compact" | "calendar" // Added view mode support
  config: Record<string, unknown> // widget-specific config (e.g. databaseId)
}

interface WorkspaceState {
  pages: WorkspacePage[]
  widgets: Record<string, WidgetConfig[]> // pageSlug → widgets
  addPage: (name: string) => void
  removePage: (slug: string) => void
  setWidgets: (pageSlug: string, widgets: WidgetConfig[]) => void
  addWidget: (pageSlug: string, widget: WidgetConfig) => void
  removeWidget: (pageSlug: string, widgetId: string) => void
  updateWidget: (pageSlug: string, widgetId: string, updates: Partial<WidgetConfig>) => void
}

interface WorkspacePage {
  slug: string
  name: string
  icon?: string
}

const DEFAULT_SLUG = "workspace-default"

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set) => ({
      pages: [{ slug: DEFAULT_SLUG, name: "My Workspace" }],
      widgets: {},
      addPage: (name) =>
        set((s) => ({
          pages: [
            ...s.pages,
            { slug: `workspace-${Date.now()}`, name },
          ],
        })),
      removePage: (slug) =>
        set((s) => ({
          pages: s.pages.filter((p) => p.slug !== slug),
          widgets: Object.fromEntries(
            Object.entries(s.widgets).filter(([k]) => k !== slug)
          ),
        })),
      setWidgets: (pageSlug, widgets) =>
        set((s) => ({ widgets: { ...s.widgets, [pageSlug]: widgets } })),
      addWidget: (pageSlug, widget) =>
        set((s) => ({
          widgets: {
            ...s.widgets,
            [pageSlug]: [...(s.widgets[pageSlug] ?? []), widget],
          },
        })),
      removeWidget: (pageSlug, widgetId) =>
        set((s) => ({
          widgets: {
            ...s.widgets,
            [pageSlug]: (s.widgets[pageSlug] ?? []).filter(
              (w) => w.i !== widgetId
            ),
          },
        })),
      updateWidget: (pageSlug, widgetId, updates) =>
        set((s) => ({
          widgets: {
            ...s.widgets,
            [pageSlug]: (s.widgets[pageSlug] ?? []).map((w) =>
              w.i === widgetId ? { ...w, ...updates } : w
            ),
          },
        })),
    }),
    { name: "mist-workspace" }
  )
)
