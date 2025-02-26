/*
  Warnings:

  - You are about to drop the column `skill` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "skill",
ADD COLUMN     "skills" TEXT[];
