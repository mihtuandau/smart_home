-- 1. Vá bảng ai_learning_data (Thêm tất cả các cột còn thiếu)
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "led1_wh" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "led2_wh" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "led1_on_minutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "led2_on_minutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "accuracy" DOUBLE PRECISION;
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "inputData" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "outputData" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Vá bảng system_settings (Đảm bảo giá trị mặc định cho Energy Price)
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "energyPriceKwh" DOUBLE PRECISION NOT NULL DEFAULT 2500;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "powerAlertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 2000;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "maxPowerConsumption" DOUBLE PRECISION NOT NULL DEFAULT 2000;

-- 3. Vá bảng sensor_data (Đảm bảo đồng nhất kiểu dữ liệu)
ALTER TABLE "sensor_data" ADD COLUMN IF NOT EXISTS "lightLevel" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "sensor_data" ADD COLUMN IF NOT EXISTS "isDark" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "sensor_data" ADD COLUMN IF NOT EXISTS "isRaining" BOOLEAN NOT NULL DEFAULT false;
