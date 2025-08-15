export class StringUtils {
  /**
   * Capitalize first letter
   */
  static capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Convert to title case
   */
  static toTitleCase(str: string): string {
    if (!str) return str;
    return str.split(' ')
      .map(word => this.capitalize(word))
      .join(' ');
  }

  /**
   * Convert to camelCase
   */
  static toCamelCase(str: string): string {
    if (!str) return str;
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (+match === 0) return '';
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }

  /**
   * Convert to snake_case
   */
  static toSnakeCase(str: string): string {
    if (!str) return str;
    return str
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  }

  /**
   * Convert to kebab-case
   */
  static toKebabCase(str: string): string {
    if (!str) return str;
    return str
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('-');
  }

  /**
   * Truncate string with ellipsis
   */
  static truncate(str: string, maxLength: number, suffix = '...'): string {
    if (!str || str.length <= maxLength) return str;
    return str.slice(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Remove all whitespace
   */
  static removeWhitespace(str: string): string {
    if (!str) return str;
    return str.replace(/\s/g, '');
  }

  /**
   * Normalize whitespace (replace multiple spaces with single space)
   */
  static normalizeWhitespace(str: string): string {
    if (!str) return str;
    return str.replace(/\s+/g, ' ').trim();
  }

  /**
   * Check if string is empty or only whitespace
   */
  static isEmpty(str: string | null | undefined): boolean {
    return !str || str.trim().length === 0;
  }

  /**
   * Check if string is not empty
   */
  static isNotEmpty(str: string | null | undefined): boolean {
    return !this.isEmpty(str);
  }

  /**
   * Generate random string
   */
  static random(length = 10, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Generate UUID v4
   */
  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Mask string (for sensitive data)
   */
  static mask(str: string, visibleChars = 4, maskChar = '*'): string {
    if (!str || str.length <= visibleChars) return str;
    const visible = str.slice(-visibleChars);
    const masked = maskChar.repeat(str.length - visibleChars);
    return masked + visible;
  }

  /**
   * Extract initials from name
   */
  static getInitials(name: string, maxInitials = 2): string {
    if (!name) return '';
    return name
      .split(' ')
      .filter(part => part.length > 0)
      .slice(0, maxInitials)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  /**
   * Format phone number (Polish format)
   */
  static formatPhone(phone: string): string {
    if (!phone) return phone;
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 9) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('48')) {
      const without48 = cleaned.slice(2);
      return `+48 ${without48.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`;
    }
    
    return phone; // Return original if format not recognized
  }

  /**
   * Slugify string for URLs
   */
  static slugify(str: string): string {
    if (!str) return str;
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Count words in string
   */
  static wordCount(str: string): number {
    if (!str) return 0;
    return str.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Escape HTML characters
   */
  static escapeHtml(str: string): string {
    if (!str) return str;
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Unescape HTML characters
   */
  static unescapeHtml(str: string): string {
    if (!str) return str;
    const map: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
    };
    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (m) => map[m]);
  }
}