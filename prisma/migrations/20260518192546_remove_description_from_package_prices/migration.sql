/*
  Warnings:

  - You are about to drop the column `description` on the `package_prices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "package_prices" DROP COLUMN IF EXISTS "description";
