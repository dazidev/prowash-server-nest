-- CreateTable
CREATE TABLE "individual_services" (
    "id" TEXT NOT NULL,
    "initialPrice" INTEGER NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "individual_services_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "individual_services" ADD CONSTRAINT "individual_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "package_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
