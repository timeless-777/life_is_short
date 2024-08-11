-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "loginId" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_worldId_key" ON "User"("worldId");
