import { PrismaClient, DeviceType, DeviceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // Create LED devices
  const led1Existing = await prisma.device.findFirst({
    where: { name: 'LED1' },
  });

  let led1;
  if (!led1Existing) {
    led1 = await prisma.device.create({
      data: {
        name: 'LED1',
        type: DeviceType.LED,
        status: DeviceStatus.OFF,
        pin: 25,
        value: 0,
        manualMode: true,
        led: {
          create: {
            color: '#FF0000',
            brightness: 100,
            minBrightness: 0,
            maxBrightness: 100,
          },
        },
      },
    });
    console.log('✅ Created LED1:', led1);
  } else {
    console.log('ℹ️  LED1 already exists');
  }

  const led2Existing = await prisma.device.findFirst({
    where: { name: 'LED2' },
  });

  let led2;
  if (!led2Existing) {
    led2 = await prisma.device.create({
      data: {
        name: 'LED2',
        type: DeviceType.LED,
        status: DeviceStatus.OFF,
        pin: 26,
        value: 0,
        manualMode: true,
        led: {
          create: {
            color: '#00FF00',
            brightness: 100,
            minBrightness: 0,
            maxBrightness: 100,
          },
        },
      },
    });
    console.log('✅ Created LED2:', led2);
  } else {
    console.log('ℹ️  LED2 already exists');
  }

  // Create system settings
  const settings = await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      autoLightEnabled: true,
      lightOnTime: '18:00',
      lightOffTime: '06:00',
      lightThreshold: 30,
      autoRainProtection: true,
      rainHumidityThreshold: 80,
      powerSaveMode: false,
      maxPowerConsumption: 100,
      aiLearningEnabled: true,
      predictionHorizon: 24,
    },
  });

  console.log('✅ Created system settings:', settings);

  console.log('🎉 Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
