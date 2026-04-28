-- 1. Thêm createdAt và updatedAt cho ai_learning_data
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Đảm bảo các cột khác cũng đầy đủ
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "date" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ai_learning_data" ADD COLUMN IF NOT EXISTS "feature" TEXT NOT NULL DEFAULT 'daily_stats';
