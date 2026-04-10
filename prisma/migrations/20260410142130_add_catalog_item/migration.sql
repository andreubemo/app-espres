-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourceSheet" TEXT NOT NULL,
    "sourceRow" INTEGER NOT NULL,
    "sectionTitle" TEXT,
    "familyKey" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "subfamily" TEXT,
    "material" TEXT,
    "itemName" TEXT NOT NULL,
    "comments" TEXT,
    "input1Label" TEXT,
    "input2Label" TEXT,
    "input3Label" TEXT,
    "measureUnit" TEXT,
    "quantityLabel" TEXT,
    "priceLabel" TEXT,
    "unitPriceBase" DOUBLE PRECISION NOT NULL,
    "unitPriceRaw" DOUBLE PRECISION,
    "measureCurrent" DOUBLE PRECISION,
    "qtyCurrent" DOUBLE PRECISION,
    "realPriceCurrent" DOUBLE PRECISION,
    "companyCostCurrent" DOUBLE PRECISION,
    "markupCurrent" DOUBLE PRECISION,
    "totalCurrent" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogItem_companyId_family_idx" ON "CatalogItem"("companyId", "family");

-- CreateIndex
CREATE INDEX "CatalogItem_companyId_familyKey_idx" ON "CatalogItem"("companyId", "familyKey");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_companyId_itemKey_key" ON "CatalogItem"("companyId", "itemKey");

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
