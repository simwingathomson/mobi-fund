import { PrismaClient, Role, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@mobifund.local' },
    update: {},
    create: {
      name: 'MobiFund Admin',
      phone: '+260970000001',
      email: 'admin@mobifund.local',
      passwordHash: await bcrypt.hash('Admin123!', 12),
      role: Role.ADMIN
    }
  });

  await prisma.user.upsert({
    where: { email: 'customer@mobifund.local' },
    update: {},
    create: {
      name: 'Demo Customer',
      phone: '+260970000002',
      email: 'customer@mobifund.local',
      passwordHash: await bcrypt.hash('Customer123!', 12),
      role: Role.CUSTOMER,
      profile: {
        create: {
          nrcNumber: '123456/78/9',
          address: 'Lusaka, Zambia',
          employment: 'Market trader',
          repaymentPhone: '+260970000002',
          verificationStatus: VerificationStatus.APPROVED
        }
      }
    }
  });

  for (const product of [
    { name: 'Starter Loan', minimumAmount: 100, maximumAmount: 1000, interestRate: 12, durationDays: 30, fees: 15 },
    { name: 'Business Boost', minimumAmount: 1000, maximumAmount: 10000, interestRate: 18, durationDays: 90, fees: 75 }
  ]) {
    const exists = await prisma.loanProduct.findFirst({ where: { name: product.name } });
    if (!exists) await prisma.loanProduct.create({ data: product });
  }
}

main().finally(() => prisma.$disconnect());
