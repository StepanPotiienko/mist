export type CalendarSource = "apple" | "google" | "notion" | "obsidian"

export interface UnifiedEvent {
  id: string
  source: CalendarSource
  title: string
  start: Date
  end?: Date
  allDay: boolean
  color: string
  description?: string
  location?: string
  sourceUrl?: string
  calendarName?: string
  linkedIds?: string[]
}

export interface CalendarInfo {
  id: string
  name: string
  color: string
  source: CalendarSource
}

export const SOURCE_COLORS: Record<CalendarSource, string> = {
  apple: "#FF3B30",
  google: "#1A73E8",
  notion: "#000000",
  obsidian: "#7C3AED",
}

export const SOURCE_LABELS: Record<CalendarSource, string> = {
  apple: "Apple Calendar",
  google: "Google Calendar",
  notion: "Notion",
  obsidian: "Obsidian",
}
