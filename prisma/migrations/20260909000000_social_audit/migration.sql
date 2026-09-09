-- CreateEnum
CREATE TYPE "SocialChannel" AS ENUM ('INSTAGRAM', 'TIKTOK', 'X', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "SnapshotSource" AS ENUM ('PUBLIC_RESEARCH', 'MANUAL');

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "isHangtuah" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "channel" "SocialChannel" NOT NULL,
    "handle" TEXT,
    "profileUrl" TEXT,
    "displayName" TEXT,
    "missing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followers" INTEGER,
    "following" INTEGER,
    "contentCount" INTEGER,
    "avgLikes" DOUBLE PRECISION,
    "avgComments" DOUBLE PRECISION,
    "avgViews" DOUBLE PRECISION,
    "engagementRate" DOUBLE PRECISION,
    "sampleSize" INTEGER,
    "source" "SnapshotSource" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,

    CONSTRAINT "MetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienceProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "primaryLanguage" TEXT,
    "inferredGeo" TEXT,
    "contentPillars" TEXT,
    "fanTone" TEXT,
    "strengths" TEXT,
    "gaps" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudienceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_clubId_channel_key" ON "SocialAccount"("clubId", "channel");

-- CreateIndex
CREATE INDEX "MetricSnapshot_accountId_capturedAt_idx" ON "MetricSnapshot"("accountId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AudienceProfile_accountId_key" ON "AudienceProfile"("accountId");

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricSnapshot" ADD CONSTRAINT "MetricSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienceProfile" ADD CONSTRAINT "AudienceProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
