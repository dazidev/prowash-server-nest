-- CreateEnum
CREATE TYPE "WebQuoteRequestStatus" AS ENUM ('PENDING_REVIEW', 'ATTENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "web_quote_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastname" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "zipcode" TEXT,
    "comments" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packagePriceId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "initialPrice" INTEGER NOT NULL,
    "rangeName" TEXT NOT NULL,
    "rangeUnit" TEXT NOT NULL,
    "services" JSONB NOT NULL,
    "status" "WebQuoteRequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "web_quote_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "web_quote_requests_status_createdAt_idx" ON "web_quote_requests"("status", "createdAt");
