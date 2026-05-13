-- CreateTable
CREATE TABLE "idempotency_key" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_key_key_key" ON "idempotency_key"("key");

-- CreateIndex
CREATE INDEX "idempotency_key_key_idx" ON "idempotency_key"("key");
