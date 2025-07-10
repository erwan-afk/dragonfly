/*
  Warnings:

  - You are about to alter the column `description` on the `boats` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2000)`.

*/
-- CreateEnum
CREATE TYPE "BoatStatus" AS ENUM ('pending', 'active', 'inactive', 'deleted');

-- AlterTable
ALTER TABLE "boats" ADD COLUMN     "status" "BoatStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "description" SET DATA TYPE VARCHAR(2000);
