import matter from "gray-matter"
import { getCredential } from "./credentials"
import type { ObsidianNote, ObsidianVaultFile } from "@/types/obsidian"

async function obsidianFetch(path: string, init?: RequestInit): Promise<Response> {
  const cred = await getCredential("obsidian")
  const baseUrl = process.env.OBSIDIAN_API_URL ?? "http://localhost:27123"
  const apiKey = cred?.apiKey ?? ""

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(apiKey ? { 
      Authorization: apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`,
      "X-API-Key": apiKey // Fallback for some configurations
    } : {}),
    ...(init?.headers ?? {}),
  }

  try {
    return await fetch(`${baseUrl}${path}`, { ...init, headers })
  } catch (err) {
    console.error(`Fetch failed for ${path}:`, err)
    throw err
  }
}

export async function isObsidianRunning(): Promise<boolean> {
  try {
    const res = await obsidianFetch("/")
    console.log(`Obsidian check status: ${res.status}`)
    return res.ok
  } catch (err) {
    console.error("Obsidian running check failed:", err)
    return false
  }
}

export async function listVaultFiles(): Promise<ObsidianVaultFile[]> {
  try {
    const res = await obsidianFetch("/vault/")
    if (!res.ok) {
      const text = await res.text()
      console.error(`Obsidian API error listing files: ${res.status}`, text)
      return []
    }
    const data = await res.json() as any
    const rawFiles = Array.isArray(data?.files) ? data.files : []
    console.log(`Found ${rawFiles.length} items in vault root. Sample:`, rawFiles.slice(0, 3))

    // The Obsidian Local REST API returns files as plain strings (paths), not objects
    return rawFiles
      .filter((f: any) => {
        if (typeof f === "string") return f.endsWith(".md")
        return f.extension === "md"
      })
      .map((f: any): ObsidianVaultFile => {
        if (typeof f === "string") {
          const name = f.split("/").pop() ?? f
          return { path: f, name, extension: "md", stat: { ctime: 0, mtime: 0, size: 0 } }
        }
        return f as ObsidianVaultFile
      })
  } catch (err) {
    console.error("Failed to list vault files:", err)
    return []
  }
}

export async function getNoteContent(filePath: string): Promise<string> {
  const encoded = encodeURIComponent(filePath)
  const res = await obsidianFetch(`/vault/${encoded}`)
  if (!res.ok) {
    console.warn(`Obsidian note not found: ${filePath}`)
    return ""
  }
  return res.text()
}

export async function parseNote(filePath: string): Promise<ObsidianNote> {
  try {
    const raw = await getNoteContent(filePath)
    if (!raw) throw new Error("Empty content")
    
    // matter() can throw on malformed frontmatter
    const { data: frontmatter, content } = matter(raw)

    const dateVal = frontmatter.date ?? frontmatter.Date
    let date: Date | undefined
    if (dateVal) {
      const parsed = new Date(dateVal as string)
      if (!isNaN(parsed.getTime())) date = parsed
    }

    if (!date) {
      const match = filePath.match(/(\d{4}-\d{2}-\d{2})/)
      if (match) {
        const parsed = new Date(match[1])
        if (!isNaN(parsed.getTime())) date = parsed
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
  } catch (err) {
    // console.warn(`Failed to parse note ${filePath}:`, err)
    throw err
  }
}

export async function getNotesWithDates(
  from?: Date,
  to?: Date
): Promise<ObsidianNote[]> {
  // /vault/ only lists the ROOT directory, not subfolders — use search to get all notes
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

async function withConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = []
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit)
    const batchResults = await Promise.allSettled(batch.map(fn))
    results.push(...batchResults)
  }
  return results
}

export async function searchNotes(query: string): Promise<ObsidianNote[]> {
  try {
    const isSpecialEmptySearch = !query || query.trim() === ""
    const searchString = isSpecialEmptySearch ? "*" : query

    console.log(`Searching Obsidian with query param: "${searchString}"`)

    const res = await obsidianFetch(`/search/simple/?query=${encodeURIComponent(searchString)}`, {
      method: "POST",
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`Obsidian search error: ${res.status}`, text)
      return []
    }
    const data = await res.json() as Array<{ filename: string }>
    const limitedResults = data.slice(0, 100)

    // Fetch note contents 10 at a time to avoid overwhelming Obsidian's local server
    const notes = await withConcurrency(limitedResults, 10, (r) => parseNote(r.filename))
    return notes
      .filter((r): r is PromiseFulfilledResult<ObsidianNote> => r.status === "fulfilled")
      .map((r) => r.value)
  } catch (err) {
    console.error("Obsidian search failed:", err)
    return []
  }
}
