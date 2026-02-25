"use client"

import { GripVertical, X, LayoutList, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface WidgetWrapperProps {
  title: string
  view?: "list" | "compact" | "calendar"
  onViewChange?: (view: "list" | "compact" | "calendar") => void
  onRemove?: () => void
  children: React.ReactNode
  dragHandleClass?: string
}

export function WidgetWrapper({
  title,
  view,
  onViewChange,
  onRemove,
  children,
  dragHandleClass = "drag-handle",
}: WidgetWrapperProps) {
  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 border-b border-border bg-accent/30 flex-shrink-0 transition-colors",
          dragHandleClass
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex-1 truncate">{title}</span>
        
        <div className="flex items-center gap-1">
          {onViewChange && (
            <div className="flex items-center bg-black/10 rounded-md p-0.5 border border-white/5 mr-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-5 w-5 rounded-sm p-0",
                  view === "list" ? "bg-white/10 text-foreground" : "text-muted-foreground/50 hover:text-foreground"
                )}
                onClick={(e) => { e.stopPropagation(); onViewChange("list"); }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <LayoutList className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-5 w-5 rounded-sm p-0",
                  view === "compact" ? "bg-white/10 text-foreground" : "text-muted-foreground/50 hover:text-foreground"
                )}
                onClick={(e) => { e.stopPropagation(); onViewChange("compact"); }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <LayoutGrid className="h-3 w-3" />
              </Button>
            </div>
          )}
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">{children}</div>
    </div>
  )
}
