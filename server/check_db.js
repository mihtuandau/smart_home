const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const powerCount = await prisma.powerData.count();
  const sensorCount = await prisma.sensorData.count();
  const latestPower = await prisma.powerData.findFirst({ orderBy: { timestamp: 'desc' } });
  console.log(JSON.stringify({ powerCount, sensorCount, latestPower }, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
