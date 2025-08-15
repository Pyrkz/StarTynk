import { prisma } from '@repo/database';
import bcrypt from 'bcryptjs';
import { Role } from '@shared/types';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: Role;
}

export interface ValidateUserData {
  email?: string;
  phone?: string;
  password: string;
}

/**
 * Creates a new user with hashed password
 * @param data User creation data
 * @returns Created user without password
 */
export async function createUser(data: CreateUserData) {
  const { email, password, name, phone, role = Role.DEVELOPER } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        ...(phone ? [{ phone }] : [])
      ]
    }
  });

  if (existingUser) {
    throw new Error('User with this email or phone already exists');
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone,
      role: role as string,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    }
  });

  return user;
}

/**
 * Validates user credentials
 * @param data Login credentials
 * @returns User data if valid, null otherwise
 */
export async function validateUserCredentials(data: ValidateUserData) {
  const { email, phone, password } = data;

  if (!email && !phone) {
    throw new Error('Either email or phone is required');
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
    }
  });

  if (!user || !user.password) {
    return null;
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return null;
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Updates user's last login timestamp
 * @param userId User ID
 */
export async function updateLastLogin(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      loginCount: { increment: 1 }
    }
  });
}