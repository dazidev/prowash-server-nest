/*
  Warnings:

  - Added the required column `houseId` to the `package_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "package_orders" ADD COLUMN     "houseId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "package_orders" ADD CONSTRAINT "package_orders_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "user_houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
