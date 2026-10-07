-- AlterEnum
ALTER TYPE "PackageOrderPurchaseStatus" ADD VALUE 'APPOINTMENT_RESCHEDULE_REQUESTED';

-- AlterTable
ALTER TABLE "package_orders" ADD COLUMN     "appointmentAcceptedAt" TIMESTAMPTZ,
ADD COLUMN     "appointmentAt" TIMESTAMPTZ,
ADD COLUMN     "appointmentTimeZone" TEXT,
ADD COLUMN     "appointmentVersion" INTEGER NOT NULL DEFAULT 0;
