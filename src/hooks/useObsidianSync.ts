"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

/**
 * Subscribes to vault file-change events (filesystem method only).
 * Automatically invalidates all obsidian queries when a note changes.
 * Safe to call in any component — no-ops when vault path is not configured.
 */
export function useObsidianSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const source = new EventSource("/api/obsidian/watch")

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type: string; path?: string }
        if (data.type === "change" || data.type === "rename") {
          queryClient.invalidateQueries({ queryKey: ["obsidian"] })
        }
      } catch {
        // malformed event, ignore
      }
    }

    source.onerror = () => {
      // Connection failed or vault path not set — SSE will not retry
      source.close()
    }

    return () => source.close()
  }, [queryClient])
}
