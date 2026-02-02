-- AlterTable
ALTER TABLE "power_data" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '30 days';

-- AlterTable
ALTER TABLE "sensor_data" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '30 days';

-- AlterTable
ALTER TABLE "solar_data" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '30 days';

-- CreateIndex
CREATE INDEX "power_data_expiresAt_idx" ON "power_data"("expiresAt");

-- CreateIndex
CREATE INDEX "sensor_data_expiresAt_idx" ON "sensor_data"("expiresAt");

-- CreateIndex
CREATE INDEX "solar_data_expiresAt_idx" ON "solar_data"("expiresAt");
