-- CreateEnum
CREATE TYPE "PackageOrderPurchaseStatus" AS ENUM ('PENDING_REVIEW', 'ASSIGNED_APPOINTMENT', 'QUOTED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "package_orders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initialPrice" INTEGER NOT NULL,
    "finalPrice" INTEGER,
    "range" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "purchaseStatus" "PackageOrderPurchaseStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "services" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "package_orders_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "package_orders" ADD CONSTRAINT "package_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
