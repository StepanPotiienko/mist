import { Client } from "@notionhq/client"
import type {
  DataSourceObjectResponse,
  PageObjectResponse,
  QueryDataSourceParameters,
} from "@notionhq/client/build/src/api-endpoints"
import { getCredential } from "./credentials"
import type { NotionDatabase, NotionEntry } from "@/types/notion"

async function getClient(): Promise<Client> {
  const apiKey = process.env.NOTION_API_KEY
  if (apiKey) return new Client({ auth: apiKey })

  const cred = await getCredential("notion")
  if (cred?.apiKey) return new Client({ auth: cred.apiKey })

  throw new Error("Notion is not connected. Please add your API key in Settings.")
}

export async function listDatabases(): Promise<NotionDatabase[]> {
  const client = await getClient()
  const response = await client.search({
    filter: { value: "data_source", property: "object" },
    sort: { direction: "descending", timestamp: "last_edited_time" },
  })

  return response.results
    .filter((r): r is DataSourceObjectResponse => r.object === "data_source")
    .map((ds) => ({
      id: ds.id,
      title: ds.title[0]?.plain_text ?? "Untitled",
      icon: ds.icon?.type === "emoji" ? ds.icon.emoji : undefined,
      url: ds.url,
      properties: Object.fromEntries(
        Object.entries(ds.properties).map(([, prop]) => [
          prop.id,
          { id: prop.id, name: prop.name, type: prop.type },
        ])
      ),
    }))
}

export async function queryDatabase(
  dataSourceId: string,
  options?: Partial<QueryDataSourceParameters>
): Promise<NotionEntry[]> {
  const client = await getClient()
  const response = await client.dataSources.query({
    data_source_id: dataSourceId,
    ...options,
  })

  return response.results
    .filter((r): r is PageObjectResponse => r.object === "page")
    .map((page) => {
      let title = "Untitled"
      for (const prop of Object.values(page.properties)) {
        if (prop.type === "title") {
          title = prop.title[0]?.plain_text ?? "Untitled"
          break
        }
      }

      let date: Date | undefined
      let dateEnd: Date | undefined

      // Collect all date properties that have a value. Use entries so we have the property name.
      type DateEntry = { name: string; start: string; end?: string | null }
      const dateEntries: DateEntry[] = Object.entries(page.properties)
        .filter(([, p]) => p.type === "date" && !!(p as { date?: { start?: string } }).date?.start)
        .map(([name, p]) => {
          const d = (p as { date: { start: string; end?: string | null } }).date
          return { name, start: d.start, end: d.end }
        })

      if (dateEntries.length === 1) {
        date = new Date(dateEntries[0].start)
        if (dateEntries[0].end) dateEnd = new Date(dateEntries[0].end)
      } else if (dateEntries.length > 1) {
        // Multiple date properties: heuristic to find which is start and which is end
        const nameIncludes = (keywords: string[], name: string) =>
          keywords.some((k) => name.toLowerCase().includes(k))
        const startEntry =
          dateEntries.find((e) => nameIncludes(["start", "begin", "from"], e.name)) ??
          dateEntries.find((e) => nameIncludes(["date"], e.name)) ??
          dateEntries[0]
        const endEntry = dateEntries.find(
          (e) => e !== startEntry && nameIncludes(["end", "finish", "to", "due", "deadline"], e.name)
        )
        date = new Date(startEntry.start)
        if (startEntry.end) dateEnd = new Date(startEntry.end)
        if (!dateEnd && endEntry) dateEnd = new Date(endEntry.start)
      }

      return {
        id: page.id,
        databaseId: dataSourceId,
        title,
        url: page.url,
        date,
        dateEnd,
        properties: page.properties as Record<string, unknown>,
        createdAt: new Date(page.created_time),
        updatedAt: new Date(page.last_edited_time),
      }
    })
}

export async function getNotionEntriesWithDates(
  dataSourceId: string,
  from: Date,
  to: Date
): Promise<NotionEntry[]> {
  return queryDatabase(dataSourceId, {
    filter: {
      and: [
        { property: "date", date: { on_or_after: from.toISOString() } },
        { property: "date", date: { on_or_before: to.toISOString() } },
      ],
    },
  } as Partial<QueryDataSourceParameters>)
}
