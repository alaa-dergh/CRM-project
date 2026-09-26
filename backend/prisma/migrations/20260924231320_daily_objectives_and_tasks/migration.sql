/*
  Warnings:

  - You are about to drop the column `actualClients` on the `Objective` table. All the data in the column will be lost.
  - You are about to drop the column `actualRevenue` on the `Objective` table. All the data in the column will be lost.
  - You are about to drop the column `actualVisits` on the `Objective` table. All the data in the column will be lost.
  - You are about to drop the column `targetClients` on the `Objective` table. All the data in the column will be lost.
  - You are about to drop the column `targetVisits` on the `Objective` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Objective" DROP COLUMN "actualClients",
DROP COLUMN "actualRevenue",
DROP COLUMN "actualVisits",
DROP COLUMN "targetClients",
DROP COLUMN "targetVisits",
ADD COLUMN     "minOrdersPerDay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetVisitsPerDay" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "commercialId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "timesPerMonth" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
