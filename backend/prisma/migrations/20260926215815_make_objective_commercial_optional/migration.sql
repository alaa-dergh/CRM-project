-- DropForeignKey
ALTER TABLE "Objective" DROP CONSTRAINT "Objective_commercialId_fkey";

-- AlterTable
ALTER TABLE "Objective" ALTER COLUMN "commercialId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
