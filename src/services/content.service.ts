import { basePath } from '../app/basePath';
import { brand } from '../config/brand';
import { contentRepository } from '../repositories/content.repository';
import type {
  PublicAnnouncement,
  PublicContentPage,
  PublicPageSummary,
  PublicSiteSettings,
  PublicSiteContent,
} from '../types/siteContent';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

const DEFAULT_SETTINGS: PublicSiteSettings = {
  siteName: brand.name,
  tagline: brand.tagline,
  description: '',
  copyright: brand.copyright,
  supportUrl: brand.supportUrl,
  primaryColor: brand.colors.primary,
  faviconUrl: '',
  logoUrl: '',
  heroTitle: '',
  heroDescription: '',
  heroCtaLabel: '',
  heroCtaHref: '',
  footerText: '',
  maintenanceMode: false,
  registrationEnabled: true,
};

function parseSettings(value: unknown): PublicSiteSettings {
  const data = record(value);
  const text = (key: string, fallback: string) => {
    const raw = str(data[key]).trim();
    return raw || fallback;
  };
  return {
    siteName: text('siteName', brand.name),
    tagline: text('tagline', brand.tagline),
    description: str(data.description),
    copyright: text('copyright', brand.copyright),
    supportUrl: str(data.supportUrl),
    primaryColor: /^#[0-9a-fA-F]{6}$/.test(str(data.primaryColor))
      ? str(data.primaryColor)
      : brand.colors.primary,
    faviconUrl: str(data.faviconUrl),
    logoUrl: str(data.logoUrl),
    heroTitle: str(data.heroTitle),
    heroDescription: str(data.heroDescription),
    heroCtaLabel: str(data.heroCtaLabel),
    heroCtaHref: str(data.heroCtaHref),
    footerText: str(data.footerText),
    maintenanceMode: bool(data.maintenanceMode, false),
    registrationEnabled: bool(data.registrationEnabled, true),
  };
}

function parsePageSummary(value: unknown): PublicPageSummary {
  const data = record(value);
  return {
    slug: str(data.slug),
    title: str(data.title),
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 0,
  };
}

function parsePage(value: unknown): PublicContentPage | null {
  if (!value || typeof value !== 'object') return null;
  const data = record(value);
  const slug = str(data.slug);
  if (!slug) return null;
  return {
    slug,
    title: str(data.title),
    summary: str(data.summary),
    blocks: array(data.blocks).map(record),
    metaTitle: str(data.metaTitle),
    metaDescription: str(data.metaDescription),
    ogImageUrl: str(data.ogImageUrl),
    updatedAt: str(data.updatedAt),
  };
}

function parseAnnouncement(value: unknown): PublicAnnouncement {
  const data = record(value);
  return {
    id: str(data.id),
    title: str(data.title),
    body: str(data.body),
    link: str(data.link),
  };
}

/** Darkens a #RRGGBB color so hover/pressed states stay distinct. */
function shade(hex: string, factor: number): string {
  const value = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return hex;
  const channels = [0, 2, 4].map((offset) =>
    Math.max(0, Math.min(255, Math.round(Number.parseInt(value.slice(offset, offset + 2), 16) * factor))),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function applyBranding(settings: PublicSiteSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // Primary color drives the game's main accent tokens. Contrast is the
  // administrator's responsibility; the admin form requires #RRGGBB.
  root.style.setProperty('--green-500', settings.primaryColor);
  root.style.setProperty('--green-600', shade(settings.primaryColor, 0.82));
  root.style.setProperty('--green-700', shade(settings.primaryColor, 0.64));

  const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (theme) theme.content = settings.primaryColor;

  if (settings.description) {
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = settings.description;
  }

  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  const link = existing ?? document.createElement('link');
  if (!existing) {
    link.rel = 'icon';
    document.head.append(link);
  }
  const defaultFavicon = `${basePath}/favicon.svg`;
  const useDefaultFavicon = (): void => {
    link.href = defaultFavicon;
    link.type = 'image/svg+xml';
  };

  if (!settings.faviconUrl) {
    // Deleting the uploaded icon must restore the built-in Lentera favicon.
    useDefaultFavicon();
  } else {
    const favicon = settings.faviconUrl;
    link.removeAttribute('type');
    link.setAttribute('href', favicon);
    // Probe the upload; a missing file falls back without a broken tab icon.
    const probe = new Image();
    probe.addEventListener('error', () => {
      if (link.getAttribute('href') === favicon) useDefaultFavicon();
    }, { once: true });
    probe.src = favicon;
  }
}

const ANNOUNCEMENT_TTL_MS = 60_000;

export const contentService = {
  _settings: DEFAULT_SETTINGS as PublicSiteSettings,
  _pages: [] as PublicPageSummary[],
  _loaded: false,
  _init: null as Promise<void> | null,
  _pageCache: new Map<string, PublicContentPage | null>(),
  _announcements: [] as PublicAnnouncement[],
  _announcementsAt: 0,

  get settings(): PublicSiteSettings {
    return this._settings;
  },

  get pages(): PublicPageSummary[] {
    return this._pages;
  },

  /** Loads public site content once at boot. Never blocks the app on failure. */
  init(): Promise<void> {
    if (this._loaded) return Promise.resolve();
    if (this._init) return this._init;
    this._init = (async () => {
      try {
        const raw = await contentRepository.getSiteContent();
        const data = record(raw);
        const settings = parseSettings(data.settings);
        const pages = array(data.pages).map(parsePageSummary).filter((page) => page.slug);
        this._settings = settings;
        this._pages = pages;
        applyBranding(settings);
        this._loaded = true;
      } catch (error) {
        // Unconfigured Supabase or offline boot: keep build-time defaults.
        console.warn('[content] public site content unavailable', error);
        this._settings = DEFAULT_SETTINGS;
        this._pages = [];
        this._loaded = true;
      } finally {
        this._init = null;
      }
    })();
    return this._init;
  },

  async getPage(slug: string): Promise<PublicContentPage | null> {
    const key = slug.trim().toLowerCase();
    if (!key) return null;
    if (this._pageCache.has(key)) return this._pageCache.get(key) ?? null;
    try {
      const page = parsePage(await contentRepository.getPage(key));
      this._pageCache.set(key, page);
      return page;
    } catch (error) {
      console.warn('[content] page unavailable', error);
      return null;
    }
  },

  async getAnnouncements(): Promise<PublicAnnouncement[]> {
    if (Date.now() - this._announcementsAt < ANNOUNCEMENT_TTL_MS) {
      return this._announcements;
    }
    try {
      const rows = array(await contentRepository.getAnnouncements()).map(parseAnnouncement);
      this._announcements = rows.filter((item) => item.title);
      this._announcementsAt = Date.now();
    } catch (error) {
      console.warn('[content] announcements unavailable', error);
    }
    return this._announcements;
  },
};

export type { PublicSiteContent };
