const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const res = await prisma.powerData.create({
      data: {
        voltage: 220,
        current: 100, // mA
        power: 22000, // mW
      }
    });
    console.log('Success:', res);
  } catch (err) {
    console.error('Error detail:', err);
  }
}
main().finally(() => prisma.$disconnect());
