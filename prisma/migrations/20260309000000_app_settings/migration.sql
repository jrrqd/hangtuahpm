-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "colorNavy" TEXT NOT NULL DEFAULT '#0B1F3A',
    "colorSky" TEXT NOT NULL DEFAULT '#0F8BF6',
    "colorFight" TEXT NOT NULL DEFAULT '#C8102E',
    "logoPath" TEXT,
    "loginHeroPath" TEXT,
    "dashboardHeroPath" TEXT,
    "emptyKanbanPaths" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AppSettings" ("id", "colorNavy", "colorSky", "colorFight", "updatedAt")
VALUES ('default', '#0B1F3A', '#0F8BF6', '#C8102E', CURRENT_TIMESTAMP);
