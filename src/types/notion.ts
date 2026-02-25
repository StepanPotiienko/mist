export interface NotionDatabase {
  id: string
  title: string
  icon?: string
  url: string
  properties: Record<string, NotionPropertySchema>
}

export interface NotionPropertySchema {
  id: string
  name: string
  type: string
}

export interface NotionEntry {
  id: string
  databaseId: string
  title: string
  url: string
  date?: Date
  dateEnd?: Date
  properties: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface NotionPage {
  id: string
  title: string
  url: string
  createdAt: Date
  updatedAt: Date
  content?: string
}
