-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('ATTENDED', 'NOT_ATTENDED');

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastname" TEXT,
    "zipcode" INTEGER,
    "phone" INTEGER NOT NULL,
    "comments" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);
