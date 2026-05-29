-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN "inputConfig" JSONB,
ADD COLUMN "formulaConfig" JSONB,
ADD COLUMN "componentConfig" JSONB,
ADD COLUMN "defaultValues" JSONB;

-- CreateTable
CREATE TABLE "CatalogPriceItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourceSheet" TEXT,
    "sourceRow" INTEGER,
    "itemKey" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "subfamily" TEXT,
    "description" TEXT NOT NULL,
    "xMm" DOUBLE PRECISION,
    "yMm" DOUBLE PRECISION,
    "thicknessMm" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "provider" TEXT,
    "extra1Label" TEXT,
    "extra1Value" DOUBLE PRECISION,
    "extra2Label" TEXT,
    "extra2Value" DOUBLE PRECISION,
    "extra3Label" TEXT,
    "extra3Value" DOUBLE PRECISION,
    "boardPrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogPriceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogPriceImportBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "fileName" TEXT,
    "sourceType" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogPriceImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExcelWorkbookCell" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "cellAddress" TEXT NOT NULL,
    "valueNumber" DOUBLE PRECISION,
    "valueText" TEXT,
    "formula" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExcelWorkbookCell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogItem_companyId_sourceSheet_sourceRow_idx" ON "CatalogItem"("companyId", "sourceSheet", "sourceRow");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogPriceItem_companyId_itemKey_key" ON "CatalogPriceItem"("companyId", "itemKey");

-- CreateIndex
CREATE INDEX "CatalogPriceItem_companyId_family_idx" ON "CatalogPriceItem"("companyId", "family");

-- CreateIndex
CREATE INDEX "CatalogPriceItem_companyId_isActive_idx" ON "CatalogPriceItem"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "CatalogPriceImportBatch_companyId_createdAt_idx" ON "CatalogPriceImportBatch"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExcelWorkbookCell_companyId_sheetName_cellAddress_key" ON "ExcelWorkbookCell"("companyId", "sheetName", "cellAddress");

-- CreateIndex
CREATE INDEX "ExcelWorkbookCell_companyId_sheetName_idx" ON "ExcelWorkbookCell"("companyId", "sheetName");

-- AddForeignKey
ALTER TABLE "CatalogPriceItem" ADD CONSTRAINT "CatalogPriceItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogPriceImportBatch" ADD CONSTRAINT "CatalogPriceImportBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogPriceImportBatch" ADD CONSTRAINT "CatalogPriceImportBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcelWorkbookCell" ADD CONSTRAINT "ExcelWorkbookCell_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
