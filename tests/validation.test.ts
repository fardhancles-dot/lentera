import { describe, expect, it } from 'vitest';
import {
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
  it('normalizes valid usernames', () => {
    expect(validateUsername('  Kiko_Belajar ')).toEqual({ ok: true, value: 'kiko_belajar' });
  });

  it.each(['ab', '1kiko', 'kiko-belajar', 'kiko belajar', 'admin', 'a'.repeat(21)])(
    'rejects %j',
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
