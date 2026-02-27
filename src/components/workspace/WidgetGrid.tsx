"use client"

import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Responsive, useContainerWidth, type LayoutItem, type Layout } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWorkspace, type WidgetConfig } from "@/stores/workspace"
import { NotionDatabaseWidget } from "./widgets/NotionDatabaseWidget"
import { ObsidianNotesWidget } from "./widgets/ObsidianNotesWidget"
import { CalendarMiniWidget } from "./widgets/CalendarMiniWidget"

interface WidgetGridProps {
  pageSlug: string
}

const WIDGET_TYPES = [
  { value: "notion-database", label: "Notion Database" },
  { value: "obsidian-notes", label: "Obsidian Notes" },
  { value: "calendar-mini", label: "Calendar" },
]

export function WidgetGrid({ pageSlug }: WidgetGridProps) {
  const { widgets, setWidgets, addWidget, removeWidget, updateWidget } = useWorkspace()
  const pageWidgets = widgets[pageSlug] ?? []
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1200 })


  const [addOpen, setAddOpen] = useState(false)
  const [newType, setNewType] = useState<WidgetConfig["type"]>("notion-database")
  const [newTitle, setNewTitle] = useState("")
  const [newConfig, setNewConfig] = useState<Record<string, string>>({})
  const { data: databasesData, isLoading: isLoadingDatabases } = useQuery({
    queryKey: ["notion", "databases"],
    queryFn: () => fetch("/api/notion/databases").then((r) => r.json()),
    enabled: addOpen && newType === "notion-database",
  })

  const layoutItems: LayoutItem[] = pageWidgets.map((w) => ({
    i: w.i,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
    minW: 2,
    minH: 3,
  }))

  // Use drag/resize STOP callbacks instead of onLayoutChange.
  // onLayoutChange fires on mount with re-packed positions — overwriting what
  // was saved. Stop callbacks only fire on actual user interaction.
  const persistLayout = useCallback(
    (layout: Layout) => {
      const items = layout as LayoutItem[]
      const updated = pageWidgets.map((w) => {
        const l = items.find((n) => n.i === w.i)
        return l ? { ...w, x: l.x, y: l.y, w: l.w, h: l.h } : w
      })
      setWidgets(pageSlug, updated)
    },
    [pageWidgets, pageSlug, setWidgets]
  )

  function handleAddWidget() {
    if (!newTitle.trim()) return
    const widget: WidgetConfig = {
      i: `widget-${Date.now()}`,
      x: 0,
      y: Infinity,
      w: newType === "calendar-mini" ? 6 : 4,
      h: newType === "calendar-mini" ? 5 : 6,
      type: newType,
      title: newTitle,
      config: newConfig,
    }
    addWidget(pageSlug, widget)
    setAddOpen(false)
    setNewTitle("")
    setNewConfig({})
  }

  function renderWidget(w: WidgetConfig) {
    const common = {
      title: w.title,
      view: w.view,
      onViewChange: (view: "list" | "compact" | "calendar") => updateWidget(pageSlug, w.i, { view }),
      onRemove: () => removeWidget(pageSlug, w.i),
    }

    switch (w.type) {
      case "notion-database":
        return (
          <NotionDatabaseWidget
            {...common}
            databaseId={(w.config.databaseId as string) ?? ""}
          />
        )
      case "obsidian-notes":
        return (
          <ObsidianNotesWidget
            {...common}
            tag={w.config.tag as string | undefined}
          />
        )
      case "calendar-mini":
        return <CalendarMiniWidget {...common} />
      default:
        return <div className="p-3 text-sm text-muted-foreground">Unknown widget</div>
    }
  }

  const responsiveLayouts = {
    lg: layoutItems,
    md: layoutItems,
    sm: layoutItems,
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Widget
        </Button>
      </div>

      {pageWidgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl text-muted-foreground gap-3">
          <p className="text-sm">Your workspace is empty.</p>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add your first widget
          </Button>
        </div>
      ) : mounted ? (
        <Responsive
          width={width}
          layouts={responsiveLayouts}
          breakpoints={{ lg: 1200, md: 768, sm: 0 }}
          cols={{ lg: 12, md: 8, sm: 4 }}
          rowHeight={60}
          dragConfig={{ handle: ".drag-handle" }}
          onDragStop={(layout) => persistLayout(layout as Layout)}
          onResizeStop={(layout) => persistLayout(layout as Layout)}
          margin={[12, 12]}
        >
          {pageWidgets.map((w) => (
            <div key={w.i}>{renderWidget(w)}</div>
          ))}
        </Responsive>
      ) : null}

      {/* Add Widget Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Widget Type</Label>
              <Select
                value={newType}
                onValueChange={(v) => setNewType(v as WidgetConfig["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WIDGET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="My Widget"
              />
            </div>

            {newType === "notion-database" && (
              <div className="space-y-1">
                <Label>Select Notion Database</Label>
                {isLoadingDatabases ? (
                  <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
                ) : (
                  <Select
                    value={newConfig.databaseId ?? ""}
                    onValueChange={(v) =>
                      setNewConfig((c) => ({ ...c, databaseId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a database..." />
                    </SelectTrigger>
                    <SelectContent>
                      {databasesData?.databases.map((db: any) => (
                        <SelectItem key={db.id} value={db.id}>
                          <div className="flex items-center gap-2">
                            {db.icon && <span>{db.icon}</span>}
                            <span>{db.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Select a database from your connected Notion account.
                </p>
              </div>
            )}

            {newType === "obsidian-notes" && (
              <div className="space-y-1">
                <Label>Filter by Tag (optional)</Label>
                <Input
                  value={newConfig.tag ?? ""}
                  onChange={(e) =>
                    setNewConfig((c) => ({ ...c, tag: e.target.value }))
                  }
                  placeholder="#meetings"
                />
              </div>
            )}

            <Button onClick={handleAddWidget} disabled={!newTitle.trim()} className="w-full">
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
