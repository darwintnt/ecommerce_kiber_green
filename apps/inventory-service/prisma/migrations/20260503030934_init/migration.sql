/*
  Warnings:

  - You are about to drop the `InventoryReservation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "InventoryReservation";

-- CreateTable
CREATE TABLE "inventory_reservation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_reservation_orderId_key" ON "inventory_reservation"("orderId");

-- CreateIndex
CREATE INDEX "inventory_reservation_orderId_idx" ON "inventory_reservation"("orderId");

-- CreateIndex
CREATE INDEX "inventory_reservation_status_idx" ON "inventory_reservation"("status");
