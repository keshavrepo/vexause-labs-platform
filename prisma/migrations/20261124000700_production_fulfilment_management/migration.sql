CREATE TABLE "ProductionMachine" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "model" TEXT,
  "buildVolume" TEXT,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductionMachine_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductionMachine_name_key" ON "ProductionMachine"("name");

CREATE TABLE "ProductionJob" (
  "id" TEXT NOT NULL,
  "jobCode" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "machineId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "dueAt" TIMESTAMP(3),
  "operatorNotes" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "qcPassedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductionJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductionJob_jobCode_key" ON "ProductionJob"("jobCode");
CREATE UNIQUE INDEX "ProductionJob_orderId_key" ON "ProductionJob"("orderId");
CREATE INDEX "ProductionJob_status_priority_createdAt_idx" ON "ProductionJob"("status","priority","createdAt");
CREATE INDEX "ProductionJob_machineId_status_idx" ON "ProductionJob"("machineId","status");
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductionJob" ADD CONSTRAINT "ProductionJob_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "ProductionMachine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProductionJobLine" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "orderItemId" TEXT,
  "productName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "materialName" TEXT,
  "colour" TEXT,
  "notes" TEXT,
  CONSTRAINT "ProductionJobLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProductionJobLine_jobId_idx" ON "ProductionJobLine"("jobId");
ALTER TABLE "ProductionJobLine" ADD CONSTRAINT "ProductionJobLine_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProductionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductionJobLine" ADD CONSTRAINT "ProductionJobLine_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProductionMaterial" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "materialType" TEXT,
  "colour" TEXT,
  "stockGrams" INTEGER NOT NULL DEFAULT 0,
  "reorderAtGrams" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductionMaterial_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProductionMaterial_isActive_name_idx" ON "ProductionMaterial"("isActive","name");

CREATE TABLE "MaterialConsumption" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "materialId" TEXT NOT NULL,
  "quantityGrams" INTEGER NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaterialConsumption_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MaterialConsumption_jobId_createdAt_idx" ON "MaterialConsumption"("jobId","createdAt");
CREATE INDEX "MaterialConsumption_materialId_createdAt_idx" ON "MaterialConsumption"("materialId","createdAt");
ALTER TABLE "MaterialConsumption" ADD CONSTRAINT "MaterialConsumption_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProductionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaterialConsumption" ADD CONSTRAINT "MaterialConsumption_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "ProductionMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "QualityInspection" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "passed" BOOLEAN NOT NULL,
  "checksJson" JSONB NOT NULL,
  "notes" TEXT,
  "inspectedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QualityInspection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "QualityInspection_jobId_createdAt_idx" ON "QualityInspection"("jobId","createdAt");
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProductionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
