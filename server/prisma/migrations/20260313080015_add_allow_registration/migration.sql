/*
  Warnings:

  - You are about to drop the column `led1` on the `power_data` table. All the data in the column will be lost.
  - You are about to drop the column `led2` on the `power_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "power_data" DROP COLUMN "led1",
DROP COLUMN "led2",
ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '30 days';

-- AlterTable
ALTER TABLE "sensor_data" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '30 days';

-- AlterTable
ALTER TABLE "solar_data" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '30 days';

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "allowRegistration" BOOLEAN NOT NULL DEFAULT false;
