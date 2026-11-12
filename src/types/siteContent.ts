export interface PublicSiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  copyright: string;
  supportUrl: string;
  primaryColor: string;
  faviconUrl: string;
  logoUrl: string;
  heroTitle: string;
  heroDescription: string;
  heroCtaLabel: string;
  heroCtaHref: string;
  footerText: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
}

export interface PublicPageSummary {
  slug: string;
  title: string;
  sortOrder: number;
}

export interface PublicContentPage {
  slug: string;
  title: string;
  summary: string;
  blocks: Array<Record<string, unknown>>;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  updatedAt: string;
}

export interface PublicAnnouncement {
  id: string;
  title: string;
  body: string;
  link: string;
}

export interface PublicSiteContent {
  settings: PublicSiteSettings;
  pages: PublicPageSummary[];
}
