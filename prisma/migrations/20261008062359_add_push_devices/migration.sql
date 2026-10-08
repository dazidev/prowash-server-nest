-- CreateEnum
CREATE TYPE "PushDevicePlatform" AS ENUM ('ANDROID', 'IOS');

-- CreateTable
CREATE TABLE "push_devices" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "fcmToken" VARCHAR(2048) NOT NULL,
    "platform" "PushDevicePlatform" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "push_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_devices_deviceId_key" ON "push_devices"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "push_devices_fcmToken_key" ON "push_devices"("fcmToken");

-- CreateIndex
CREATE UNIQUE INDEX "push_devices_sessionId_key" ON "push_devices"("sessionId");

-- CreateIndex
CREATE INDEX "push_devices_userId_isActive_idx" ON "push_devices"("userId", "isActive");

-- CreateIndex
CREATE INDEX "push_devices_lastSeenAt_idx" ON "push_devices"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "push_devices" ADD CONSTRAINT "push_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_devices" ADD CONSTRAINT "push_devices_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "user_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
