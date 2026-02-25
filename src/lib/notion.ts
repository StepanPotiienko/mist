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
      for (const prop of Object.values(page.properties)) {
        if (prop.type === "date" && prop.date?.start) {
          date = new Date(prop.date.start)
          if (prop.date.end) dateEnd = new Date(prop.date.end)
          break
        }
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
