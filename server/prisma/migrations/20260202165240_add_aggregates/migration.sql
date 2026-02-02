-- CreateTable
CREATE TABLE "sensor_aggs" (
    "id" TEXT NOT NULL,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "bucketMinutes" INTEGER NOT NULL DEFAULT 5,
    "temperatureAvg" DOUBLE PRECISION NOT NULL,
    "temperatureMin" DOUBLE PRECISION NOT NULL,
    "temperatureMax" DOUBLE PRECISION NOT NULL,
    "humidityAvg" DOUBLE PRECISION NOT NULL,
    "humidityMin" DOUBLE PRECISION NOT NULL,
    "humidityMax" DOUBLE PRECISION NOT NULL,
    "pressureAvg" DOUBLE PRECISION NOT NULL,
    "pressureMin" DOUBLE PRECISION NOT NULL,
    "pressureMax" DOUBLE PRECISION NOT NULL,
    "lightLevelAvg" DOUBLE PRECISION NOT NULL,
    "lightLevelMin" INTEGER NOT NULL,
    "lightLevelMax" INTEGER NOT NULL,
    "rainCount" INTEGER NOT NULL DEFAULT 0,
    "darkCount" INTEGER NOT NULL DEFAULT 0,
    "samples" INTEGER NOT NULL,

    CONSTRAINT "sensor_aggs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_aggs" (
    "id" TEXT NOT NULL,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "bucketMinutes" INTEGER NOT NULL DEFAULT 5,
    "voltageAvg" DOUBLE PRECISION NOT NULL,
    "voltageMin" DOUBLE PRECISION NOT NULL,
    "voltageMax" DOUBLE PRECISION NOT NULL,
    "currentAvg" DOUBLE PRECISION NOT NULL,
    "currentMin" DOUBLE PRECISION NOT NULL,
    "currentMax" DOUBLE PRECISION NOT NULL,
    "powerAvg" DOUBLE PRECISION NOT NULL,
    "powerMin" DOUBLE PRECISION NOT NULL,
    "powerMax" DOUBLE PRECISION NOT NULL,
    "energySum" DOUBLE PRECISION NOT NULL,
    "samples" INTEGER NOT NULL,

    CONSTRAINT "power_aggs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sensor_aggs_bucketStart_idx" ON "sensor_aggs"("bucketStart");

-- CreateIndex
CREATE UNIQUE INDEX "sensor_aggs_bucketStart_bucketMinutes_key" ON "sensor_aggs"("bucketStart", "bucketMinutes");

-- CreateIndex
CREATE INDEX "power_aggs_bucketStart_idx" ON "power_aggs"("bucketStart");

-- CreateIndex
CREATE UNIQUE INDEX "power_aggs_bucketStart_bucketMinutes_key" ON "power_aggs"("bucketStart", "bucketMinutes");
