const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sensorData = await prisma.sensorData.findMany({ take: 5, orderBy: { timestamp: 'desc' } });
  console.log(JSON.stringify(sensorData, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
