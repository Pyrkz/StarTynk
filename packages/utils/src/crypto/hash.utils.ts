import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

/**
 * Hash a password using bcrypt
 */
export async function hash(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hash
 */
export async function compare(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random salt
 */
export async function generateSalt(rounds = 12): Promise<string> {
  return bcrypt.genSalt(rounds);
}

/**
 * Hash with custom salt
 */
export async function hashWithSalt(password: string, salt: string): Promise<string> {
  return bcrypt.hash(password, salt);
}

/**
 * Generate SHA256 hash of a string
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate MD5 hash of a string
 */
export function md5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}