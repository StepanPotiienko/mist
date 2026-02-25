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
    console.log("Listing vault files...")
    // In many cases /vault/ might just return root files. 
    // If this fails or returns something unexpected, we handle it.
    const res = await obsidianFetch("/vault/")
    if (!res.ok) {
      const text = await res.text()
      console.error(`Obsidian API error listing files: ${res.status}`, text)
      // Fallback: try to use search to find all md files if /vault/ fails
      return []
    }
    const data = await res.json() as any
    const files = Array.isArray(data?.files) ? data.files : []
    console.log(`Found ${files.length} items in vault root.`)
    return files.filter((f: any) => f.extension === "md")
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
  // Use search to find all MD files instead of just listing root vault
  // An empty search query in simple search might not work, so we use a broad one or list items.
  // For now, let's stick to listVaultFiles but make it non-throwing.
  const allFiles = await listVaultFiles()
  
  // If we found nothing in root, try a simple search for ".md" or similar if possible
  if (allFiles.length === 0) {
    console.log("No files found in vault root, trying search fallback...")
    // This is a common pattern to find all markdown files
    return searchNotes("") 
  }

  const files = allFiles.slice(0, 100)
  console.log(`Parsing ${files.length} notes...`)
  const notes = await Promise.allSettled(files.map((f) => parseNote(f.path)))

  return notes
    .filter(
      (r): r is PromiseFulfilledResult<ObsidianNote> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value)
    .filter((n) => {
      const f = from && !isNaN(from.getTime()) ? from : undefined
      const t = to && !isNaN(to.getTime()) ? to : undefined

      if (!f && !t) return true
      if (!n.date) return false // Cannot filter by date if no date exists
      const d = n.date
      if (f && d < f) return false
      if (t && d > t) return false
      return true
    })
}

export async function searchNotes(query: string): Promise<ObsidianNote[]> {
  try {
    const isSpecialEmptySearch = !query || query.trim() === ""
    const searchString = isSpecialEmptySearch ? "*" : query
    
    console.log(`Searching Obsidian with query param: "${searchString}"`)

    // The error message 40090 specifically asked for '?query='
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
    const notes = await Promise.allSettled(limitedResults.map((r) => parseNote(r.filename)))
    return notes
      .filter((r): r is PromiseFulfilledResult<ObsidianNote> => r.status === "fulfilled")
      .map((r) => r.value)
  } catch (err) {
    console.error("Obsidian search failed:", err)
    return []
  }
}
