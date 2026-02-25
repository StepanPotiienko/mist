-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WidgetLayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageSlug" TEXT NOT NULL,
    "layout" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkspacePage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Credential_service_key" ON "Credential"("service");

-- CreateIndex
CREATE INDEX "Link_sourceType_sourceId_idx" ON "Link"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "Link_targetType_targetId_idx" ON "Link"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Link_sourceType_sourceId_targetType_targetId_key" ON "Link"("sourceType", "sourceId", "targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "WidgetLayout_pageSlug_key" ON "WidgetLayout"("pageSlug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspacePage_slug_key" ON "WorkspacePage"("slug");
