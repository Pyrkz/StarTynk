// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone number validation (Polish format)
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Accept 9 digits or 11 digits starting with 48
  return cleaned.length === 9 || (cleaned.length === 11 && cleaned.startsWith('48'));
}

// NIP validation (Polish tax number)
export function isValidNIP(nip: string): boolean {
  const cleaned = nip.replace(/\D/g, '');
  
  if (cleaned.length !== 10) {
    return false;
  }

  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * weights[i];
  }
  
  const checkDigit = sum % 11;
  return checkDigit === parseInt(cleaned[9]);
}

// PESEL validation (Polish national ID)
export function isValidPESEL(pesel: string): boolean {
  const cleaned = pesel.replace(/\D/g, '');
  
  if (cleaned.length !== 11) {
    return false;
  }

  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * weights[i];
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cleaned[10]);
}

// REGON validation (Polish business number)
export function isValidREGON(regon: string): boolean {
  const cleaned = regon.replace(/\D/g, '');
  
  if (cleaned.length !== 9 && cleaned.length !== 14) {
    return false;
  }

  if (cleaned.length === 9) {
    const weights = [8, 9, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    
    for (let i = 0; i < 8; i++) {
      sum += parseInt(cleaned[i]) * weights[i];
    }
    
    const checkDigit = sum % 11;
    return checkDigit === parseInt(cleaned[8]);
  }

  // For 14-digit REGON, validate first 9 digits first
  if (!isValidREGON(cleaned.substring(0, 9))) {
    return false;
  }

  const weights = [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8];
  let sum = 0;
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights[i];
  }
  
  const checkDigit = sum % 11;
  return checkDigit === parseInt(cleaned[13]);
}

// Bank account validation (Polish format)
export function isValidBankAccount(account: string): boolean {
  const cleaned = account.replace(/\s/g, '');
  
  if (!/^PL\d{26}$/.test(cleaned)) {
    return false;
  }

  // IBAN validation
  const rearranged = cleaned.substring(4) + '2521' + cleaned.substring(2, 4);
  let remainder = rearranged;
  
  while (remainder.length > 2) {
    const block = remainder.substring(0, 9);
    remainder = (parseInt(block, 10) % 97).toString() + remainder.substring(block.length);
  }
  
  return parseInt(remainder, 10) % 97 === 1;
}

// Password strength validation
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;

  if (password.length < 8) {
    errors.push('Hasło musi mieć minimum 8 znaków');
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Hasło musi zawierać małą literę');
  } else {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Hasło musi zawierać wielką literę');
  } else {
    score++;
  }

  if (!/\d/.test(password)) {
    errors.push('Hasło musi zawierać cyfrę');
  } else {
    score++;
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Hasło musi zawierać znak specjalny');
  } else {
    score++;
  }

  if (score <= 2) strength = 'weak';
  else if (score <= 4) strength = 'medium';
  else strength = 'strong';

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

// URL validation
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Date validation
export function isValidDate(date: string): boolean {
  const parsed = Date.parse(date);
  return !isNaN(parsed);
}

// Number range validation
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// Required field validation
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}