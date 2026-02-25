import { NextRequest, NextResponse } from "next/server"
import Database from "better-sqlite3"
import path from "path"

export async function GET() {
  try {
    const dbPath = path.resolve(process.cwd(), "prisma/dev.db")
    console.log("API Init: Opening database at:", dbPath)
    const db = new Database(dbPath)

    console.log("API Init: Creating tables...")
    db.exec(`
      CREATE TABLE IF NOT EXISTS "Credential" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "service" TEXT NOT NULL,
          "data" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Credential_service_key" ON "Credential"("service");

      CREATE TABLE IF NOT EXISTS "Link" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "sourceType" TEXT NOT NULL,
          "sourceId" TEXT NOT NULL,
          "targetType" TEXT NOT NULL,
          "targetId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "Link_sourceType_sourceId_idx" ON "Link"("sourceType", "sourceId");
      CREATE INDEX IF NOT EXISTS "Link_targetType_targetId_idx" ON "Link"("targetType", "targetId");
      CREATE UNIQUE INDEX IF NOT EXISTS "Link_sourceType_sourceId_targetType_targetId_key" ON "Link"("sourceType", "sourceId", "targetType", "targetId");

      CREATE TABLE IF NOT EXISTS "WidgetLayout" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "pageSlug" TEXT NOT NULL,
          "layout" TEXT NOT NULL,
          "updatedAt" DATETIME NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "WidgetLayout_pageSlug_key" ON "WidgetLayout"("pageSlug");

      CREATE TABLE IF NOT EXISTS "WorkspacePage" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "slug" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "icon" TEXT,
          "order" INTEGER NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "WorkspacePage_slug_key" ON "WorkspacePage"("slug");
    `)

    db.close()
    return NextResponse.json({ ok: true, message: "Tables created" })
  } catch (err) {
    console.error("API Init Error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
