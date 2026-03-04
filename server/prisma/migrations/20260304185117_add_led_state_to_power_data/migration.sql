-- AlterTable
ALTER TABLE "power_data" ADD COLUMN     "led1" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "led2" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '30 days';

-- AlterTable
ALTER TABLE "sensor_data" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '30 days';

-- AlterTable
ALTER TABLE "solar_data" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '30 days';
