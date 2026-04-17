import fs from "fs/promises"
import path from "path"
import os from "os"
import matter from "gray-matter"
import { getCredential } from "./credentials"
import type { ObsidianNote, ObsidianVaultFile } from "@/types/obsidian"

function expandHome(p: string): string {
  return p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p
}

export async function getVaultPath(): Promise<string | null> {
  const cred = await getCredential("obsidian")
  if (!cred?.vaultPath) return null
  return expandHome(cred.vaultPath)
}

// ─── Internal helpers (accept vaultPath so we only read the DB once) ─────────

async function walkVaultInternal(dir: string, base: string): Promise<ObsidianVaultFile[]> {
  const results: ObsidianVaultFile[] = []

  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return results
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue // skip .obsidian, .git, etc.

    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(base, fullPath)

    if (entry.isDirectory()) {
      results.push(...(await walkVaultInternal(fullPath, base)))
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const stat = await fs.stat(fullPath)
      results.push({
        path: relativePath,
        name: entry.name,
        extension: "md",
        stat: { ctime: stat.ctimeMs, mtime: stat.mtimeMs, size: stat.size },
      })
    }
  }

  return results
}

async function getNoteContentInternal(vaultPath: string, filePath: string): Promise<string> {
  // Guard against path traversal
  const resolved = path.resolve(vaultPath, filePath)
  const vaultResolved = path.resolve(vaultPath)
  if (!resolved.startsWith(vaultResolved + path.sep) && resolved !== vaultResolved) {
    throw new Error("Path traversal detected")
  }

  try {
    return await fs.readFile(resolved, "utf-8")
  } catch {
    return ""
  }
}

async function parseNoteInternal(vaultPath: string, filePath: string): Promise<ObsidianNote> {
  const resolved = path.resolve(vaultPath, filePath)
  const raw = await getNoteContentInternal(vaultPath, filePath)
  if (!raw) throw new Error("Empty content")

  const { data: frontmatter, content } = matter(raw)

  // 1. Try frontmatter date
  const dateVal = frontmatter.date ?? frontmatter.Date
  let date: Date | undefined
  if (dateVal) {
    const parsed = new Date(dateVal as string)
    if (!isNaN(parsed.getTime())) date = parsed
  }

  // 2. Try YYYY-MM-DD in filename
  if (!date) {
    const match = filePath.match(/(\d{4}-\d{2}-\d{2})/)
    if (match) {
      const parsed = new Date(match[1])
      if (!isNaN(parsed.getTime())) date = parsed
    }
  }

  // 3. Fall back to file mtime — ensures notes always have a date so they
  //    appear in calendar/dashboard date-range queries
  if (!date) {
    try {
      const stat = await fs.stat(resolved)
      date = stat.mtime
    } catch {
      // ignore, date stays undefined
    }
  }

  const tags: string[] = []
  if (Array.isArray(frontmatter.tags)) {
    tags.push(...frontmatter.tags.map(String))
  } else if (typeof frontmatter.tags === "string") {
    tags.push(frontmatter.tags)
  }

  const name = filePath.split("/").pop() ?? filePath
  const title = (frontmatter.title as string) ?? name.replace(/\.md$/, "")

  return { path: filePath, title, date, tags, frontmatter, content }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listVaultFiles(): Promise<ObsidianVaultFile[]> {
  const vaultPath = await getVaultPath()
  if (!vaultPath) return []
  return walkVaultInternal(vaultPath, vaultPath)
}

export async function getNoteContent(filePath: string): Promise<string> {
  const vaultPath = await getVaultPath()
  if (!vaultPath) return ""
  return getNoteContentInternal(vaultPath, filePath)
}

export async function parseNote(filePath: string): Promise<ObsidianNote> {
  const vaultPath = await getVaultPath()
  if (!vaultPath) throw new Error("Vault path not configured")
  return parseNoteInternal(vaultPath, filePath)
}

export async function searchNotes(query: string): Promise<ObsidianNote[]> {
  // Get vault path ONCE — avoids repeated DB reads when parsing many files concurrently
  const vaultPath = await getVaultPath()
  if (!vaultPath) return []

  const files = await walkVaultInternal(vaultPath, vaultPath)
  const q = query.toLowerCase().trim()

  const results = await Promise.allSettled(
    files.map((f) => parseNoteInternal(vaultPath, f.path))
  )
  const notes = results
    .filter((r): r is PromiseFulfilledResult<ObsidianNote> => r.status === "fulfilled")
    .map((r) => r.value)

  if (!q || q === "*") return notes

  return notes.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.content?.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
  )
}

export async function getNotesWithDates(from?: Date, to?: Date): Promise<ObsidianNote[]> {
  const notes = await searchNotes("")
  const f = from && !isNaN(from.getTime()) ? from : undefined
  const t = to && !isNaN(to.getTime()) ? to : undefined
  if (!f && !t) return notes
  return notes.filter((n) => {
    if (!n.date) return false
    if (f && n.date < f) return false
    if (t && n.date > t) return false
    return true
  })
}

export async function isVaultAccessible(): Promise<boolean> {
  const vaultPath = await getVaultPath()
  if (!vaultPath) return false
  try {
    await fs.access(vaultPath)
    return true
  } catch {
    return false
  }
}
