import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Initialize Default Admin
  const adminUsername = 'admin';
  const adminPassword = 'admin123'; // Default password
  
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.admin.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
      },
    });
    console.log(`Created default admin user: ${adminUsername} / ${adminPassword}`);
  } else {
    console.log('Admin user already exists.');
  }

  // 2. Initialize Default Configs
  const defaultConfigs = [
    { key: 'AI_PROVIDER', value: 'gemini' },
    { key: 'GEMINI_API_KEY', value: '' },
    { key: 'OPENAI_BASE_URL', value: 'https://api.openai.com/v1' },
    { key: 'OPENAI_API_KEY', value: '' },
    { key: 'OPENAI_MODEL', value: 'gpt-3.5-turbo' },
    { key: 'GITHUB_TOKEN', value: '' },
    { key: 'TARGET_LANGUAGE', value: 'Chinese' },
    { key: 'PULL_FREQUENCY_MINUTES', value: '60' },
    { key: 'PULL_COUNT', value: '10' },
    { key: 'PULL_TYPE', value: 'trending' },
  ];

  for (const config of defaultConfigs) {
    const existingConfig = await prisma.config.findUnique({
      where: { key: config.key },
    });

    if (!existingConfig) {
      await prisma.config.create({
        data: config,
      });
      console.log(`Created default config: ${config.key}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
