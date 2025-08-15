import { type ClassValue, clsx } from 'clsx';

/**
 * UI-specific utility functions
 */
export class UIUtils {
  /**
   * Combine class names using clsx (for CSS classes)
   */
  static cn(...inputs: ClassValue[]): string {
    return clsx(inputs);
  }

  /**
   * Generate invitation/random code
   */
  static generateCode(length = 12): string {
    return Math.random().toString(36).substring(2, 2 + length) + 
           Math.random().toString(36).substring(2, 2 + Math.max(0, length - 10));
  }

  /**
   * Generate invitation code (specific format)
   */
  static generateInvitationCode(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get user initials for avatars
   */
  static getUserInitials(name?: string | null, maxInitials = 2): string {
    if (!name) return '';
    return name
      .split(' ')
      .filter(part => part.length > 0)
      .slice(0, maxInitials)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  /**
   * Generate avatar background color based on name
   */
  static getAvatarColor(name?: string | null): string {
    if (!name) return '#6B7280'; // gray-500

    const colors = [
      '#EF4444', // red-500
      '#F97316', // orange-500
      '#F59E0B', // amber-500
      '#EAB308', // yellow-500
      '#84CC16', // lime-500
      '#22C55E', // green-500
      '#10B981', // emerald-500
      '#06B6D4', // cyan-500
      '#0EA5E9', // sky-500
      '#3B82F6', // blue-500
      '#6366F1', // indigo-500
      '#8B5CF6', // violet-500
      '#A855F7', // purple-500
      '#D946EF', // fuchsia-500
      '#EC4899', // pink-500
      '#F43F5E', // rose-500
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }
}