import { describe, expect, it } from 'vitest';
import {
  passwordStrength,
  suggestUsername,
  validateBio,
  validateDailyGoal,
  validateDisplayName,
  validateEmail,
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
  it('accepts a password with letters and numbers', () => {
    expect(validatePassword('belajar123')).toEqual({ ok: true, value: 'belajar123' });
  });

  it('rejects short, letter-only, number-only, and overlong values', () => {
    expect(validatePassword('a1').ok).toBe(false);
    expect(validatePassword('hanyaHuruf').ok).toBe(false);
    expect(validatePassword('12345678').ok).toBe(false);
    expect(validatePassword(`${'a1'.repeat(40)}`).ok).toBe(false);
  });
});

describe('passwordStrength', () => {
  it('reports empty, weak, fair, and strong values', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('abc')).toBe(1);
    expect(passwordStrength('belajar123')).toBe(2);
    expect(passwordStrength('Belajar123!panjang')).toBe(3);
  });
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
