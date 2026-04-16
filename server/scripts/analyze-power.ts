import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rows = await prisma.powerData.findMany({
    where: { timestamp: { gte: thirtyDaysAgo } },
    orderBy: { timestamp: 'asc' },
    select: { power: true, timestamp: true },
  });

  if (rows.length < 2) {
    console.log('Không đủ dữ liệu.');
    return;
  }

  console.log(`\n=== PHÂN TÍCH DATA 30 NGÀY ===`);
  console.log(`Tổng số dòng: ${rows.length}`);
  console.log(`Từ: ${rows[0].timestamp.toISOString()}`);
  console.log(`Đến: ${rows[rows.length-1].timestamp.toISOString()}`);

  // Phân tích các gaps
  const gapBuckets = { under5min: 0, under1h: 0, under2h: 0, under6h: 0, over6h: 0 };
  let totalWhNoFilter = 0;
  let totalWh2hFilter = 0;
  let totalWh5minFilter = 0;

  for (let i = 0; i < rows.length - 1; i++) {
    const dt = (rows[i+1].timestamp.getTime() - rows[i].timestamp.getTime()) / 3_600_000;
    const wh = rows[i].power * dt;

    totalWhNoFilter += wh;
    if (dt <= 2) totalWh2hFilter += wh;
    if (dt <= (1/12)) totalWh5minFilter += wh;

    const dtMin = dt * 60;
    if (dtMin < 5) gapBuckets.under5min++;
    else if (dt < 1) gapBuckets.under1h++;
    else if (dt < 2) gapBuckets.under2h++;
    else if (dt < 6) gapBuckets.under6h++;
    else gapBuckets.over6h++;
  }

  console.log(`\n--- Phân bố Gaps giữa các lần gửi tín hiệu ---`);
  console.log(`  Dưới 5 phút:  ${gapBuckets.under5min} lần (dữ liệu thật realtime)`);
  console.log(`  5 phút - 1h:  ${gapBuckets.under1h} lần`);
  console.log(`  1h - 2h:      ${gapBuckets.under2h} lần`);
  console.log(`  2h - 6h:      ${gapBuckets.under6h} lần`);
  console.log(`  Hơn 6h:       ${gapBuckets.over6h} lần (Gap offline lớn)`);

  console.log(`\n--- So sánh thuật toán tính kWh ---`);
  console.log(`  Không lọc (Raw Riemann):    ${(totalWhNoFilter/1000).toFixed(4)} kWh`);
  console.log(`  Lọc Gap > 5 phút:           ${(totalWh5minFilter/1000).toFixed(4)} kWh`);
  console.log(`  Lọc Gap > 2 giờ (hiện tại): ${(totalWh2hFilter/1000).toFixed(4)} kWh`);

  console.log(`\n--- Mức công suất TB ---`);
  const avgPower = rows.reduce((sum, r) => sum + r.power, 0) / rows.length;
  const maxPower = Math.max(...rows.map(r => r.power));
  console.log(`  Công suất trung bình: ${avgPower.toFixed(3)} W`);
  console.log(`  Công suất đỉnh:       ${maxPower.toFixed(3)} W`);
}

main().finally(() => prisma.$disconnect());
