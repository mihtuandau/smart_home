-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'GUEST');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('LED', 'SERVO', 'TOUCH');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ON', 'OFF', 'AUTO', 'ERROR');

-- CreateEnum
CREATE TYPE "PowerSource" AS ENUM ('SOLAR', 'BATTERY', 'GRID');

-- CreateEnum
CREATE TYPE "SolarStatus" AS ENUM ('CHARGING', 'STANDBY', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'OFF',
    "pin" INTEGER NOT NULL,
    "value" INTEGER,
    "manualMode" BOOLEAN NOT NULL DEFAULT false,
    "powerConsumption" DOUBLE PRECISION DEFAULT 0,
    "lastActive" TIMESTAMP(3),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leds" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "color" TEXT DEFAULT '#FFFFFF',
    "brightness" INTEGER NOT NULL DEFAULT 100,
    "minBrightness" INTEGER NOT NULL DEFAULT 0,
    "maxBrightness" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "leds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servos" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "minAngle" INTEGER NOT NULL DEFAULT 0,
    "maxAngle" INTEGER NOT NULL DEFAULT 180,
    "speed" INTEGER NOT NULL DEFAULT 10,
    "autoRetract" BOOLEAN NOT NULL DEFAULT true,
    "rainThreshold" DOUBLE PRECISION NOT NULL DEFAULT 80,

    CONSTRAINT "servos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "touches" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "sensitivity" INTEGER NOT NULL DEFAULT 50,
    "isTouched" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "touches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_data" (
    "id" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "lightLevel" INTEGER NOT NULL,
    "isDark" BOOLEAN NOT NULL,
    "isRaining" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_data" (
    "id" TEXT NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL,
    "power" DOUBLE PRECISION NOT NULL,
    "energy" DOUBLE PRECISION NOT NULL,
    "source" "PowerSource" NOT NULL DEFAULT 'SOLAR',
    "batteryLevel" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "power_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solar_data" (
    "id" TEXT NOT NULL,
    "solarVoltage" DOUBLE PRECISION NOT NULL,
    "solarCurrent" DOUBLE PRECISION NOT NULL,
    "chargeVoltage" DOUBLE PRECISION NOT NULL,
    "chargeCurrent" DOUBLE PRECISION NOT NULL,
    "batteryVoltage" DOUBLE PRECISION NOT NULL,
    "status" "SolarStatus" NOT NULL DEFAULT 'STANDBY',
    "temperature" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solar_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "display_data" (
    "id" TEXT NOT NULL,
    "line1" TEXT,
    "line2" TEXT,
    "line3" TEXT,
    "line4" TEXT,
    "isDisplayOn" BOOLEAN NOT NULL DEFAULT true,
    "brightness" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "display_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_learning_data" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "inputData" JSONB NOT NULL,
    "outputData" JSONB NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_learning_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_patterns" (
    "id" TEXT NOT NULL,
    "patternName" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behavior_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "conditionType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMP(3),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "deviceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "autoLightEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lightOnTime" TEXT DEFAULT '18:00',
    "lightOffTime" TEXT DEFAULT '06:00',
    "lightThreshold" INTEGER NOT NULL DEFAULT 30,
    "autoRainProtection" BOOLEAN NOT NULL DEFAULT true,
    "rainHumidityThreshold" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "powerSaveMode" BOOLEAN NOT NULL DEFAULT false,
    "maxPowerConsumption" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "aiLearningEnabled" BOOLEAN NOT NULL DEFAULT true,
    "predictionHorizon" INTEGER NOT NULL DEFAULT 24,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "devices_userId_name_key" ON "devices"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "leds_deviceId_key" ON "leds"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "servos_deviceId_key" ON "servos"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "touches_deviceId_key" ON "touches"("deviceId");

-- CreateIndex
CREATE INDEX "sensor_data_timestamp_idx" ON "sensor_data"("timestamp");

-- CreateIndex
CREATE INDEX "power_data_timestamp_idx" ON "power_data"("timestamp");

-- CreateIndex
CREATE INDEX "solar_data_timestamp_idx" ON "solar_data"("timestamp");

-- CreateIndex
CREATE INDEX "ai_learning_data_feature_timestamp_idx" ON "ai_learning_data"("feature", "timestamp");

-- CreateIndex
CREATE INDEX "activity_logs_timestamp_idx" ON "activity_logs"("timestamp");

-- CreateIndex
CREATE INDEX "activity_logs_userId_timestamp_idx" ON "activity_logs"("userId", "timestamp");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leds" ADD CONSTRAINT "leds_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servos" ADD CONSTRAINT "servos_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "touches" ADD CONSTRAINT "touches_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
