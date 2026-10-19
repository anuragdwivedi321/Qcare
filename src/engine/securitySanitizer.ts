// ==========================================
// Q-Care Clinical Security & Input Sanitizer
// Input Validation, Boundary Checks & Anti-XSS Engine
// ==========================================

/**
 * Sanitizes input text by stripping dangerous HTML, script tags, event handlers,
 * and malicious javascript: or data: URIs to guard against stored and reflected XSS.
 */
export function sanitizeString(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';

  return raw
    // Strip <script>...</script> blocks
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip <iframe>, <object>, <embed>, <applet>, <style> blocks
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    // Strip HTML opening and closing tags
    .replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, '')
    // Strip inline event attributes like onload=, onerror=, onclick=, etc.
    .replace(/\bon\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\bon\w+\s*=\s*[^>\s]+/gi, '')
    // Strip javascript: or data: pseudo-protocols
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    // Trim whitespace
    .trim();
}

export interface ValidationResult<T> {
  isValid: boolean;
  value: T;
  error?: string;
}

/**
 * Validates and sanitizes patient full name.
 * Length: 2 to 80 characters.
 */
export function validatePatientName(name: string): ValidationResult<string> {
  const sanitized = sanitizeString(name);
  if (!sanitized || sanitized.length === 0) {
    return { isValid: false, value: '', error: 'Patient full name is required.' };
  }
  if (sanitized.length < 2) {
    return { isValid: false, value: sanitized, error: 'Patient name must be at least 2 characters.' };
  }
  if (sanitized.length > 80) {
    return { isValid: false, value: sanitized.slice(0, 80), error: 'Patient name cannot exceed 80 characters.' };
  }
  // Check for allowed characters (letters, spaces, dots, hyphens, apostrophes)
  const namePattern = /^[A-Za-z\s.'-]+$/;
  if (!namePattern.test(sanitized)) {
    return { isValid: false, value: sanitized, error: 'Patient name contains invalid characters.' };
  }
  return { isValid: true, value: sanitized };
}

/**
 * Validates patient age against physiological clinical boundaries: 0 to 130 years.
 */
export function validatePatientAge(age: number | string): ValidationResult<number> {
  if (age === '' || age === undefined || age === null) {
    return { isValid: false, value: 0, error: 'Patient age is required.' };
  }
  const num = typeof age === 'number' ? age : Number(age);
  if (isNaN(num)) {
    return { isValid: false, value: 0, error: 'Patient age must be a valid number.' };
  }
  if (!Number.isInteger(num)) {
    return { isValid: false, value: Math.floor(num), error: 'Patient age must be a whole number.' };
  }
  if (num < 0 || num > 130) {
    return { isValid: false, value: num, error: 'Patient age must be between 0 and 130 years.' };
  }
  return { isValid: true, value: num };
}

/**
 * Validates and sanitizes patient phone / mobile number.
 * Enforces exactly 10 digits (ignoring +91 country code prefix or punctuation).
 */
export function validatePatientPhone(phone: string): ValidationResult<string> {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, value: '', error: 'Mobile phone number is required.' };
  }
  // Extract all digit characters
  let digits = phone.replace(/\D/g, '');

  // If 12 digits starting with 91 (India country code), strip the 91 prefix
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  // If 11 digits starting with 0 (STD trunk prefix), strip the leading 0
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    return {
      isValid: false,
      value: digits,
      error: `Mobile number must be exactly 10 digits (received ${digits.length} digits).`
    };
  }

  // Check valid mobile starting digit (standard Indian numbers start with 6, 7, 8, or 9)
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      isValid: false,
      value: digits,
      error: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
    };
  }

  const formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return { isValid: true, value: formatted };
}

/**
 * Validates and sanitizes chief complaints, current illness description or sickness symptoms.
 */
export function validateSymptoms(symptoms: string): ValidationResult<string> {
  const sanitized = sanitizeString(symptoms);
  if (!sanitized || sanitized.length === 0) {
    return { isValid: false, value: '', error: 'Please describe the chief sickness or symptoms.' };
  }
  if (sanitized.length > 500) {
    return { isValid: true, value: sanitized.slice(0, 500) };
  }
  return { isValid: true, value: sanitized };
}
