import { describe, expect, it } from 'vitest';

import { normalizeBase, stripBase, withBase } from '../src/app/basePath';

const PAGES_BASE = '/lentera';

describe('normalizeBase', () => {
  it('treats an empty base and root as no prefix', () => {
    expect(normalizeBase('')).toBe('');
    expect(normalizeBase('/')).toBe('');
  });

  it('adds a leading slash and removes trailing slashes', () => {
    expect(normalizeBase('lentera')).toBe('/lentera');
    expect(normalizeBase('/lentera/')).toBe('/lentera');
    expect(normalizeBase(' /lentera// ')).toBe('/lentera');
  });
});

describe('stripBase', () => {
  it('maps the Pages root to the app root', () => {
    expect(stripBase('/lentera', PAGES_BASE)).toBe('/');
    expect(stripBase('/lentera/', PAGES_BASE)).toBe('/');
  });

  it('removes the prefix from nested routes', () => {
    expect(stripBase('/lentera/learn/ipa/lesson/salam', PAGES_BASE)).toBe(
      '/learn/ipa/lesson/salam',
    );
  });

  it('leaves paths outside the base untouched', () => {
    expect(stripBase('/login', PAGES_BASE)).toBe('/login');
    expect(stripBase('/lentera-other/login', PAGES_BASE)).toBe('/lentera-other/login');
  });

  it('is a no-op when the app is served from the domain root', () => {
    expect(stripBase('/learn', '')).toBe('/learn');
  });
});

describe('withBase', () => {
  it('prefixes app routes for GitHub Pages', () => {
    expect(withBase('/login', PAGES_BASE)).toBe('/lentera/login');
    expect(withBase('/', PAGES_BASE)).toBe('/lentera/');
    expect(withBase('/login?next=%2Fapp', PAGES_BASE)).toBe('/lentera/login?next=%2Fapp');
  });

  it('does not double-prefix paths that already include the base', () => {
    expect(withBase('/lentera/learn', PAGES_BASE)).toBe('/lentera/learn');
  });

  it('keeps root-relative paths unchanged on Vercel', () => {
    expect(withBase('/learn', '')).toBe('/learn');
    expect(withBase('/', '')).toBe('/');
  });

  it('round-trips with stripBase', () => {
    const path = '/learn/ipa/lesson/salam';
    expect(stripBase(withBase(path, PAGES_BASE), PAGES_BASE)).toBe(path);
  });
});
