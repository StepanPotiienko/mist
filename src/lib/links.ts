import { db } from "./db"
import type { CalendarSource } from "@/types/calendar"

export interface LinkRecord {
  id: string
  sourceType: CalendarSource
  sourceId: string
  targetType: CalendarSource
  targetId: string
  createdAt: Date
}

export async function createLink(
  sourceType: CalendarSource,
  sourceId: string,
  targetType: CalendarSource,
  targetId: string
): Promise<LinkRecord> {
  const link = await db.link.upsert({
    where: {
      sourceType_sourceId_targetType_targetId: {
        sourceType,
        sourceId,
        targetType,
        targetId,
      },
    },
    create: { sourceType, sourceId, targetType, targetId },
    update: {},
  })
  return link as LinkRecord
}

export async function deleteLink(id: string): Promise<void> {
  await db.link.delete({ where: { id } })
}

export async function getLinksForItem(
  type: CalendarSource,
  id: string
): Promise<LinkRecord[]> {
  const [asSource, asTarget] = await Promise.all([
    db.link.findMany({ where: { sourceType: type, sourceId: id } }),
    db.link.findMany({ where: { targetType: type, targetId: id } }),
  ])
  return [...asSource, ...asTarget] as LinkRecord[]
}
