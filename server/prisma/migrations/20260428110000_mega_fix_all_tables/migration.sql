-- 1. Vá bảng ai_learning_data
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "date" TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS "ai_learning_data_date_feature_idx" ON "ai_learning_data"("date", "feature");

-- 2. Vá bảng system_settings
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "energyPriceKwh" DOUBLE PRECISION NOT NULL DEFAULT 2500;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "powerAlertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 2000;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "maxPowerConsumption" DOUBLE PRECISION NOT NULL DEFAULT 2000;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "aiAdvisorEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "aiLearningEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "predictionHorizon" INTEGER NOT NULL DEFAULT 24;

-- 3. Vá bảng sensor_data
ALTER TABLE "sensor_data" ADD COLUMN IF NOT EXISTS "lightLevel" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "sensor_data" ADD COLUMN IF NOT EXISTS "isDark" BOOLEAN NOT NULL DEFAULT false;

-- 4. Bảng solar_data
CREATE TABLE IF NOT EXISTS "solar_data" (
    "id" TEXT NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL,
    "power" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    CONSTRAINT "solar_data_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "solar_data_timestamp_idx" ON "solar_data"("timestamp");
