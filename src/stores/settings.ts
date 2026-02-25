"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface IntegrationStatus {
  connected: boolean
  label: string
  checkedAt?: number
}

interface SettingsState {
  integrations: Record<string, IntegrationStatus>
  notionDatabaseIds: string[] // which databases are selected for calendar view
  selectedAppleCalendars: string[]
  setIntegration: (key: string, status: IntegrationStatus) => void
  setNotionDatabaseIds: (ids: string[]) => void
  setSelectedAppleCalendars: (ids: string[]) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      integrations: {},
      notionDatabaseIds: [],
      selectedAppleCalendars: [],
      setIntegration: (key, status) =>
        set((s) => ({
          integrations: { ...s.integrations, [key]: status },
        })),
      setNotionDatabaseIds: (ids) => set({ notionDatabaseIds: ids }),
      setSelectedAppleCalendars: (ids) => set({ selectedAppleCalendars: ids }),
    }),
    { name: "mist-settings" }
  )
)
