// apps/api/prisma/seed-templates.ts
import { prisma } from './seed-helpers';
import { seedMonthlyFull } from './seed-monthly-full';
import { seedMatrixFull } from './seed-matrix-full';
import { seedFinancialFull } from './seed-financial-full';
import { seedComment } from './seed-comment';
import { seedTour } from './seed-tour';

async function main() {
  await seedMonthlyFull();
  await seedMatrixFull();
  await seedFinancialFull();
  await seedComment();
  await seedTour();
}
main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });