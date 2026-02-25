export interface ObsidianNote {
  path: string
  title: string
  date?: Date
  tags: string[]
  frontmatter: Record<string, unknown>
  content?: string
  stat?: {
    ctime: number
    mtime: number
    size: number
  }
}

export interface ObsidianVaultFile {
  path: string
  name: string
  extension: string
  stat: {
    ctime: number
    mtime: number
    size: number
  }
}

export interface ObsidianSearchResult {
  filename: string
  score: number
  matches: Array<[number, number]>
}
