/**
 * South African ID number helpers.
 * Format: YYMMDD SSSS C A Z (13 digits). The final digit is a Luhn checksum.
 */

export interface SaIdInfo {
  valid: boolean;
  error?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: 'female' | 'male';
  citizen?: boolean;
}

const luhnValid = (digits: string): boolean => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = parseInt(digits[digits.length - 1 - i], 10);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
};

export function parseSaId(raw: string): SaIdInfo {
  const id = (raw || '').replace(/\s/g, '');
  if (!/^\d{13}$/.test(id)) return { valid: false, error: 'ID number must be 13 digits' };

  const yy = parseInt(id.slice(0, 2), 10);
  const mm = parseInt(id.slice(2, 4), 10);
  const dd = parseInt(id.slice(4, 6), 10);
  const currentYY = new Date().getFullYear() % 100;
  const year = yy > currentYY ? 1900 + yy : 2000 + yy;
  const date = new Date(Date.UTC(year, mm - 1, dd));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== mm - 1 || date.getUTCDate() !== dd) {
    return { valid: false, error: 'ID number has an invalid date of birth' };
  }

  const citizenDigit = id[10];
  if (citizenDigit !== '0' && citizenDigit !== '1') {
    return { valid: false, error: 'ID number is not valid' };
  }

  if (!luhnValid(id)) return { valid: false, error: 'ID number checksum is not valid — check for a typo' };

  return {
    valid: true,
    dateOfBirth: `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
    gender: parseInt(id.slice(6, 10), 10) >= 5000 ? 'male' : 'female',
    citizen: citizenDigit === '0',
  };
}

/** SA mobile/landline: 0XXXXXXXXX or +27XXXXXXXXX */
export const isValidSaPhone = (raw: string): boolean => /^(\+27|0)\d{9}$/.test((raw || '').replace(/[\s-]/g, ''));

export const isValidEmail = (raw: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((raw || '').trim());

export const ageFromDob = (dob?: string | null): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
};
