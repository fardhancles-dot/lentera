import { describe, expect, it } from 'vitest';
import {
  TIMEZONE_GROUPS,
  TIMEZONE_OPTIONS,
  suggestUsername,
  validateBio,
  validateDailyGoal,
  validateDisplayName,
  validateEmail,
  validateOtpCode,
  validatePassword,
  validatePasswordConfirmation,
  validateTimezone,
  validateUsername,
  validateVolume,
} from '../src/utils/validation';

describe('validateEmail', () => {
  it('normalizes valid addresses', () => {
    const result = validateEmail('  Pemain@Lentera.ID ');
    expect(result).toEqual({ ok: true, value: 'pemain@lentera.id' });
  });

  it.each(['', 'bukan-email', 'a@b', 'a@b.c', 'spasi di@email.com'])(
    'rejects %j',
    (input) => {
      expect(validateEmail(input).ok).toBe(false);
    },
  );
});

describe('validatePassword', () => {
  it.each(['abcdef', '123456', 'dhan123', 'password', 'abc123'])(
    'accepts %j with only a 6-character minimum',
    (input) => {
      expect(validatePassword(input)).toEqual({ ok: true, value: input });
    },
  );

  it.each(['abc12', '12345', '', 'a'.repeat(73)])(
    'rejects %j',
    (input) => {
      expect(validatePassword(input).ok).toBe(false);
    },
  );

  it('does not require letters, digits, capitals, or symbols', () => {
    expect(validatePassword('abcdef').ok).toBe(true);
    expect(validatePassword('123456').ok).toBe(true);
    expect(validatePassword('!!!!!!').ok).toBe(true);
  });
});

describe('validateOtpCode', () => {
  it('accepts exactly six digits', () => {
    expect(validateOtpCode(' 483921 ')).toEqual({ ok: true, value: '483921' });
  });

  it.each(['', '12345', '1234567', 'abcdef', '12 34 56'])(
    'rejects %j',
    (input) => {
      expect(validateOtpCode(input).ok).toBe(false);
    },
  );
});

describe('validatePasswordConfirmation', () => {
  it('requires matching confirmation', () => {
    expect(validatePasswordConfirmation('abc12345', 'abc12345').ok).toBe(true);
    expect(validatePasswordConfirmation('abc12345', 'abc12346').ok).toBe(false);
  });
});

describe('validateUsername', () => {
  it('trims but preserves the entered case', () => {
    expect(validateUsername('  Kiko_Belajar ')).toEqual({ ok: true, value: 'Kiko_Belajar' });
  });

  it.each([
    'fardhan123',
    'fardhan_123',
    'fardhan@123',
    'fardhan.dev',
    'fardhan!2026',
    'Fardhan Web&App',
    'fardhan 123',
    'Fardhan_Dev@2026',
  ])('accepts %j', (input) => {
    expect(validateUsername(input)).toEqual({ ok: true, value: input });
  });

  it.each(['ab', 'kiko/ belajar', 'admin', 'Admin', 'a'.repeat(21)])(
    'rejects %j',
    (input) => {
      expect(validateUsername(input).ok).toBe(false);
    },
  );

  it.each(['fardhan😀', '😀😀😀', 'fardhan❤️', '👨‍👩‍👧‍👦', '🇮🇩'])(
    'rejects emoji in %j',
    (input) => {
      expect(validateUsername(input).ok).toBe(false);
    },
  );
});

describe('profile text validation', () => {
  it('trims display names and rejects empty ones', () => {
    expect(validateDisplayName('  Kiko   Daun ')).toEqual({ ok: true, value: 'Kiko Daun' });
    expect(validateDisplayName('   ').ok).toBe(false);
  });

  it('limits bio to 280 characters', () => {
    expect(validateBio('a'.repeat(280)).ok).toBe(true);
    expect(validateBio('a'.repeat(281)).ok).toBe(false);
  });
});

describe('preference validation', () => {
  it('allows only configured daily goals', () => {
    expect(validateDailyGoal(15)).toEqual({ ok: true, value: 15 });
    expect(validateDailyGoal(7).ok).toBe(false);
  });

  it('validates timezones against Intl', () => {
    expect(validateTimezone('Asia/Jakarta').ok).toBe(true);
    expect(validateTimezone('Mars/Olympus').ok).toBe(false);
  });

  it('lists Indonesia first and every zone is a valid IANA identifier', () => {
    expect(TIMEZONE_GROUPS[0]?.country).toBe('INDONESIA');
    expect(TIMEZONE_GROUPS[0]?.zones[0]?.value).toBe('Asia/Jakarta');
    expect(TIMEZONE_OPTIONS[0]?.label).toBe('Asia/Jakarta (WIB)');
    for (const option of TIMEZONE_OPTIONS) {
      expect(validateTimezone(option.value).ok).toBe(true);
    }
    expect(new Set(TIMEZONE_OPTIONS.map((option) => option.value)).size).toBe(
      TIMEZONE_OPTIONS.length,
    );
  });

  it('covers Asian countries and no longer offers UTC', () => {
    const values = TIMEZONE_OPTIONS.map((option) => option.value);
    expect(values).toContain('Asia/Makassar');
    expect(values).toContain('Asia/Jayapura');
    expect(values).toContain('Asia/Kuala_Lumpur');
    expect(values).toContain('Asia/Singapore');
    expect(values).toContain('Asia/Bangkok');
    expect(values).toContain('Asia/Manila');
    expect(values).toContain('Asia/Tokyo');
    expect(values).toContain('Asia/Seoul');
    expect(values).toContain('Asia/Amman');
    expect(values).toContain('Asia/Dubai');
    expect(values).toContain('Asia/Kolkata');
    expect(values).toContain('Asia/Shanghai');
    expect(values).not.toContain('UTC');
  });

  it('accepts only integer volumes 0–100', () => {
    expect(validateVolume(0).ok).toBe(true);
    expect(validateVolume(100).ok).toBe(true);
    expect(validateVolume(55.5).ok).toBe(false);
    expect(validateVolume(101).ok).toBe(false);
  });
});

describe('suggestUsername', () => {
  it('builds safe handles from emails', () => {
    expect(suggestUsername('Kiko.Belajar+game@lentera.id')).toBe('kikobelajargame');
    expect(suggestUsername('9budi@mail.com')).toBe('p9budi');
    expect(suggestUsername('ab@mail.com')).toBe('playerab');
    expect(suggestUsername('a'.repeat(40) + '@mail.com').length).toBeLessThanOrEqual(20);
  });
});
