-- CreateEnum
CREATE TYPE "QuoteNotificationType" AS ENUM ('APPOINTMENT_ASSIGNED', 'FINAL_PRICE_ASSIGNED');

-- CreateEnum
CREATE TYPE "QuoteNotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'SKIPPED', 'FAILED');

-- AlterTable
ALTER TABLE "package_orders" ADD COLUMN     "finalPriceVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "quote_notification_outbox" (
    "id" TEXT NOT NULL,
    "type" "QuoteNotificationType" NOT NULL,
    "status" "QuoteNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "appointmentAt" TIMESTAMPTZ,
    "finalPrice" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockToken" TEXT,
    "lockedUntil" TIMESTAMPTZ,
    "completedDeviceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastError" VARCHAR(256),
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quote_notification_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_notification_outbox_userId_idx" ON "quote_notification_outbox"("userId");

-- CreateIndex
CREATE INDEX "quote_notification_outbox_status_availableAt_idx" ON "quote_notification_outbox"("status", "availableAt");

-- CreateIndex
CREATE INDEX "quote_notification_outbox_status_lockedUntil_idx" ON "quote_notification_outbox"("status", "lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "quote_notification_outbox_quoteId_type_version_key" ON "quote_notification_outbox"("quoteId", "type", "version");

-- AddForeignKey
ALTER TABLE "quote_notification_outbox" ADD CONSTRAINT "quote_notification_outbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_notification_outbox" ADD CONSTRAINT "quote_notification_outbox_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "package_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
