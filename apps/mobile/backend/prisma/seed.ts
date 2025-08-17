import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { appConfig } from '../src/config/app';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', appConfig.bcrypt.saltRounds);

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@startynk.com' },
    update: {},
    create: {
      email: 'admin@startynk.com',
      phone: '+48123456789',
      password: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      isActive: true,
      position: 'System Administrator',
      department: 'IT',
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Regular user
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@startynk.com' },
    update: {},
    create: {
      email: 'user@startynk.com',
      phone: '+48987654321',
      password: hashedPassword,
      name: 'Regular User',
      role: Role.USER,
      isActive: true,
      position: 'Worker',
      department: 'Operations',
    },
  });

  console.log('✅ Created regular user:', regularUser.email);

  // Manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@startynk.com' },
    update: {},
    create: {
      email: 'manager@startynk.com',
      phone: '+48555666777',
      password: hashedPassword,
      name: 'Manager User',
      role: Role.COORDINATOR, // Using COORDINATOR role for manager
      isActive: true,
      position: 'Project Manager',
      department: 'Management',
    },
  });

  console.log('✅ Created manager user:', managerUser.email);

  console.log('🎉 Seed completed successfully!');
  console.log('📝 You can login with any of these users using password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });