import { NextRequest } from "next/server"
import fs from "fs"
import path from "path"
import os from "os"
import { getCredential } from "@/lib/credentials"

function expandHome(p: string): string {
  return p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p
}

export async function GET(_req: NextRequest) {
  const cred = await getCredential("obsidian")
  const rawPath = cred?.vaultPath

  if (!rawPath) {
    return new Response("Vault path not configured", { status: 400 })
  }

  const vaultPath = expandHome(rawPath)
  const encoder = new TextEncoder()

  let watcher: fs.FSWatcher | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))

      try {
        watcher = fs.watch(vaultPath, { recursive: true }, (event, filename) => {
          if (!filename || !filename.endsWith(".md")) return

          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => {
            try {
              const payload = JSON.stringify({ type: event, path: filename })
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
            } catch {
              // Stream already closed
            }
          }, 300)
        })

        watcher.on("error", () => controller.close())
      } catch {
        controller.enqueue(
          encoder.encode('data: {"type":"error","message":"Cannot watch vault directory"}\n\n')
        )
        controller.close()
      }
    },
    cancel() {
      if (debounceTimer) clearTimeout(debounceTimer)
      watcher?.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
