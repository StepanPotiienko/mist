"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { TopBar } from "@/components/shared/TopBar"
import { WidgetGrid } from "@/components/workspace/WidgetGrid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWorkspace } from "@/stores/workspace"

export default function WorkspacePage() {
  const { pages, addPage, removePage } = useWorkspace()
  const [activeSlug, setActiveSlug] = useState(pages[0]?.slug ?? "workspace-default")
  const [addPageOpen, setAddPageOpen] = useState(false)
  const [newPageName, setNewPageName] = useState("")

  function handleAddPage() {
    if (!newPageName.trim()) return
    addPage(newPageName.trim())
    setAddPageOpen(false)
    setNewPageName("")
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Workspace">
        <Button variant="ghost" size="sm" onClick={() => setAddPageOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Page
        </Button>
      </TopBar>

      {pages.length > 1 && (
        <div className="border-b border-border px-6 pt-2">
          <Tabs value={activeSlug} onValueChange={setActiveSlug}>
            <TabsList className="bg-transparent gap-1 p-0 h-auto">
              {pages.map((page) => (
                <div key={page.slug} className="group relative flex items-center">
                  <TabsTrigger
                    value={page.slug}
                    className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none pb-2 pr-8"
                  >
                    {page.name}
                  </TabsTrigger>
                  {pages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Are you sure you want to delete "${page.name}"?`)) {
                          removePage(page.slug)
                          if (activeSlug === page.slug) {
                            setActiveSlug(pages.find(p => p.slug !== page.slug)?.slug ?? "")
                          }
                        }
                      }}
                    >
                      <X className="h-3.2 w-3.2" />
                    </Button>
                  )}
                </div>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <WidgetGrid pageSlug={activeSlug} />
      </div>

      <Dialog open={addPageOpen} onOpenChange={setAddPageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Workspace Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Page name"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPage()}
            />
            <Button onClick={handleAddPage} disabled={!newPageName.trim()} className="w-full">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
