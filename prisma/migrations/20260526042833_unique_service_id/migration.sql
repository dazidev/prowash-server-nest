/*
  Warnings:

  - A unique constraint covering the columns `[serviceId]` on the table `individual_services` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "individual_services_serviceId_key" ON "individual_services"("serviceId");
