import { PrismaClient } from '@repo/database'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@example.com'
  const password = 'Admin123!'
  
  try {
    // Sprawdź czy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      console.log('Użytkownik już istnieje:', existingUser.email)
      return
    }
    
    // Hashuj hasło
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Utwórz użytkownika
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Administrator',
        role: 'ADMIN',
        isActive: true,
        loginCount: 0
      }
    })
    
    console.log('✅ Utworzono użytkownika administratora:')
    console.log('Email:', email)
    console.log('Hasło:', password)
    console.log('ID:', user.id)
    
  } catch (error) {
    console.error('Błąd podczas tworzenia użytkownika:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()