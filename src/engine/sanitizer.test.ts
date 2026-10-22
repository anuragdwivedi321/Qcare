import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  validatePatientName,
  validatePatientAge,
  validatePatientPhone,
  validateSymptoms,
  evaluateMetricFlag
} from './sanitizer';

describe('Clinical Security Sanitizer & Validator', () => {
  it('strips malicious XSS tags and event handlers', () => {
    const malicious = "<script>alert('pwned')</script><img src=x onerror=alert(1)>John <b>Doe</b>";
    const cleaned = sanitizeString(malicious);
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).not.toContain('onerror');
    expect(cleaned).toBe('John Doe');
  });

  it('validates patient name boundary limits (2 to 80 chars)', () => {
    expect(validatePatientName('').isValid).toBe(false);
    expect(validatePatientName('A').isValid).toBe(false);
    expect(validatePatientName('Rameshwar Sharma').isValid).toBe(true);
    expect(validatePatientName('Rameshwar Sharma').value).toBe('Rameshwar Sharma');
  });

  it('validates patient age boundaries strictly between 0 and 130', () => {
    expect(validatePatientAge(-5).isValid).toBe(false);
    expect(validatePatientAge(135).isValid).toBe(false);
    expect(validatePatientAge('invalid').isValid).toBe(false);
    expect(validatePatientAge(0).isValid).toBe(true);
    expect(validatePatientAge(52).isValid).toBe(true);
    expect(validatePatientAge(130).isValid).toBe(true);
  });

  it('validates Indian mobile numbers with 10 digits and optional +91 or 0 prefix', () => {
    expect(validatePatientPhone('9876543210').isValid).toBe(true);
    expect(validatePatientPhone('9876543210').value).toBe('+91 98765 43210');

    expect(validatePatientPhone('+91 98765 43210').isValid).toBe(true);
    expect(validatePatientPhone('+91 98765 43210').value).toBe('+91 98765 43210');

    expect(validatePatientPhone('09876543210').isValid).toBe(true);
    expect(validatePatientPhone('12345').isValid).toBe(false);
  });

  it('evaluates metric flags (normal, high, low, critical) against reference ranges', () => {
    // Range: 70 - 99
    expect(evaluateMetricFlag('85', '70 - 99')).toBe('normal');
    expect(evaluateMetricFlag('142', '70 - 99')).toBe('high');
    expect(evaluateMetricFlag('320', '70 - 99')).toBe('critical');
    expect(evaluateMetricFlag('65', '70 - 99')).toBe('low');

    // Range: < 200
    expect(evaluateMetricFlag('180', '< 200')).toBe('normal');
    expect(evaluateMetricFlag('240', '< 200')).toBe('high');
    expect(evaluateMetricFlag('450', '< 200')).toBe('critical');

    // Range: > 40
    expect(evaluateMetricFlag('45', '> 40')).toBe('normal');
    expect(evaluateMetricFlag('35', '> 40')).toBe('low');
    expect(evaluateMetricFlag('15', '> 40')).toBe('critical');
  });
});
