import { PrismaClient } from '@repo/database'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Rozpoczynam seedowanie bazy danych...')

  // Tworzenie użytkownika testowego
  const hashedPassword = await bcrypt.hash('test123', 12)
  
  const testUser = await prisma.user.upsert({
    where: { email: 'marcin@sitefy.pl' },
    update: {},
    create: {
      email: 'marcin@sitefy.pl',
      password: hashedPassword,
      name: 'Marcin',
      role: 'ADMIN',
      isActive: true
    }
  })

  console.log('✅ Utworzono użytkownika testowego:', testUser.email)

  // Opcjonalnie: tworzenie kodu zaproszenia dla nowych użytkowników
  const invitationCode = await prisma.invitationCode.create({
    data: {
      code: 'WELCOME2024',
      email: 'nowy@example.com',
      invitedBy: testUser.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dni
    }
  })

  console.log('✅ Utworzono kod zaproszenia:', invitationCode.code)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Błąd podczas seedowania:', e)
    await prisma.$disconnect()
    process.exit(1)
  })