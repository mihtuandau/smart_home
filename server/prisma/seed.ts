import { PrismaClient, DeviceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // Create LED devices (Mapped to hardcoded ESP32 indicators)
  const initialDevices = [
    { name: 'LED1', pin: 25, status: DeviceStatus.OFF, powerConsumption: 0.5 },
    { name: 'LED2', pin: 26, status: DeviceStatus.OFF, powerConsumption: 0.8 },
  ];

  for (const deviceData of initialDevices) {
    const existing = await prisma.device.findFirst({
      where: { name: deviceData.name },
    });

    if (!existing) {
      const device = await prisma.device.create({
        data: deviceData,
      });
      console.log(`✅ Created device: ${device.name}`);
    } else {
      console.log(`ℹ️  Device ${deviceData.name} already exists`);
    }
  }

  // Create default system settings
  const settings = await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
    },
  });

  console.log('✅ System settings initialized:', settings);
  console.log('🎉 Seeding finished.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
