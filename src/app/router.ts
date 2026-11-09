import { brand } from '../config/brand';
import { sessionStore } from '../stores/session.store';

export interface RouteContext {
  outlet: HTMLElement;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  onCleanup: (cleanup: () => void) => void;
}

export interface PageModule {
  meta: {
    title: string | ((params: Record<string, string>) => string);
  };
  render: (ctx: RouteContext) => void | Promise<void>;
}

type Access = 'public' | 'guest' | 'authenticated' | 'onboarded';

interface RouteDefinition {
  pattern: string;
  access: Access;
  load: () => Promise<PageModule>;
}

const routes: RouteDefinition[] = [
  {
    pattern: '/',
    access: 'public',
    load: () => import('../pages/welcome.page'),
  },
  {
    pattern: '/login',
    access: 'guest',
    load: () => import('../pages/login.page'),
  },
  {
    pattern: '/register',
    access: 'guest',
    load: () => import('../pages/register.page'),
  },
  {
    pattern: '/forgot-password',
    access: 'guest',
    load: () => import('../pages/forgot-password.page'),
  },
  {
    pattern: '/reset-password',
    access: 'public',
    load: () => import('../pages/reset-password.page'),
  },
  {
    pattern: '/onboarding',
    access: 'authenticated',
    load: () => import('../pages/onboarding.page'),
  },
  {
    pattern: '/app',
    access: 'onboarded',
    load: () => import('../pages/home.page'),
  },
  {
    pattern: '/learn',
    access: 'onboarded',
    load: () => import('../pages/learn.page'),
  },
  {
    pattern: '/learn/:subject',
    access: 'onboarded',
    load: () => import('../pages/learn-subject.page'),
  },
  {
    pattern: '/learn/:subject/lesson/:lessonSlug',
    access: 'onboarded',
    load: () => import('../pages/learn-lesson.page'),
  },
  {
    pattern: '/learn/:subject/reward/:nodeSlug',
    access: 'onboarded',
    load: () => import('../pages/learn-reward.page'),
  },
  {
    pattern: '/learn/:subject/lesson/:lessonSlug/play',
    access: 'onboarded',
    load: () => import('../pages/lesson-play.page'),
  },
  {
    pattern: '/practice',
    access: 'onboarded',
    load: () => import('../pages/practice.page'),
  },
  {
    pattern: '/mastery',
    access: 'onboarded',
    load: () => import('../pages/mastery.page'),
  },
  {
    pattern: '/practice/play',
    access: 'onboarded',
    load: () => import('../pages/practice-play.page'),
  },
  {
    pattern: '/wallet',
    access: 'onboarded',
    load: () => import('../pages/wallet.page'),
  },
  {
    pattern: '/quests',
    access: 'onboarded',
    load: () => import('../pages/quests.page'),
  },
  {
    pattern: '/shop',
    access: 'onboarded',
    load: () => import('../pages/shop.page'),
  },
  {
    pattern: '/friends-quest',
    access: 'onboarded',
    load: () => import('../pages/friends-quest.page'),
  },
  {
    pattern: '/profile',
    access: 'onboarded',
    load: () => import('../pages/profile.page'),
  },
  {
    pattern: '/settings',
    access: 'onboarded',
    load: () => import('../pages/settings.page'),
  },
  {
    pattern: '/setup',
    access: 'public',
    load: () => import('../pages/setup.page'),
  },
  {
    pattern: '/404',
    access: 'public',
    load: () => import('../pages/not-found.page'),
  },
];

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function matchRoute(path: string): { route: RouteDefinition; params: Record<string, string> } | null {
  const segments = path.split('/').filter(Boolean);

  for (const route of routes) {
    const routeSegments = route.pattern.split('/').filter(Boolean);
    if (routeSegments.length !== segments.length) continue;

    const params: Record<string, string> = {};
    let matched = true;

    for (let i = 0; i < routeSegments.length; i += 1) {
      const expected = routeSegments[i]!;
      const actual = segments[i]!;
      if (expected.startsWith(':')) {
        params[expected.slice(1)] = decodeURIComponent(actual);
      } else if (expected !== actual) {
        matched = false;
        break;
      }
    }

    if (matched) return { route, params };
  }

  return null;
}

export class Router {
  private readonly outlet: HTMLElement;
  private cleanups: Array<() => void> = [];
  private renderToken = 0;
  private currentUrl = '';
  private started = false;
  private unsubscribeRecovery: (() => void) | null = null;

  constructor(outlet: HTMLElement) {
    this.outlet = outlet;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    await sessionStore.init();

    this.unsubscribeRecovery = sessionStore.subscribe((state) => {
      if (
        state.recoveryMode &&
        normalizePath(window.location.pathname) !== '/reset-password'
      ) {
        this.navigate('/reset-password', { replace: true });
      }
    });

    window.addEventListener('popstate', () => {
      void this.render(window.location.pathname + window.location.search, false);
    });

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (anchor.hasAttribute('download')) return;
      const anchorTarget = anchor.getAttribute('target');
      if (anchorTarget && anchorTarget !== '_self') return;

      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      if (!href.startsWith('/')) return;

      event.preventDefault();
      this.navigate(url.pathname + url.search + url.hash);
    });

    await this.render(window.location.pathname + window.location.search, true);
  }

  navigate(url: string, options: { replace?: boolean } = {}): void {
    if (url === this.currentUrl) return;
    if (options.replace) {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }
    void this.render(url, false);
  }

  private runCleanups(): void {
    const cleanups = this.cleanups;
    this.cleanups = [];
    for (const cleanup of cleanups) {
      try {
        cleanup();
      } catch (error) {
        console.error('[router] cleanup failed', error);
      }
    }
  }

  private async guard(route: RouteDefinition, path: string, query: URLSearchParams): Promise<boolean> {
    if (route.access === 'public') return true;

    await sessionStore.init();
    const state = sessionStore.getState();

    if (state.status === 'unconfigured') {
      // Guest pages stay browsable and explain the missing backend inline;
      // anything that needs a player session goes to the setup guide.
      if (route.access === 'guest' || path === '/setup') return true;
      this.navigate('/setup', { replace: true });
      return false;
    }

    if (state.status === 'loading') {
      // A session refresh is in flight; keep the user where they are.
      return false;
    }

    if (state.status === 'anonymous') {
      if (route.access === 'guest') return true;
      const next = encodeURIComponent(path + (query.size ? `?${query}` : ''));
      this.navigate(`/login?next=${next}`, { replace: true });
      return false;
    }

    const onboarded = state.user?.profile.onboarding_completed ?? false;

    if (route.access === 'guest') {
      this.navigate(onboarded ? '/app' : '/onboarding', { replace: true });
      return false;
    }

    if (route.access === 'authenticated' && onboarded) {
      this.navigate('/app', { replace: true });
      return false;
    }

    if (route.access === 'onboarded' && !onboarded) {
      this.navigate('/onboarding', { replace: true });
      return false;
    }

    return true;
  }

  private async render(url: string, initial: boolean): Promise<void> {
    const token = ++this.renderToken;
    const parsed = new URL(url, window.location.origin);
    const path = normalizePath(parsed.pathname);
    const query = parsed.searchParams;

    this.runCleanups();

    const matched = matchRoute(path);
    const route = matched?.route;
    const params = matched?.params ?? {};

    if (!route || path === '/404') {
      const notFound = await import('../pages/not-found.page');
      if (token !== this.renderToken) return;
      this.outlet.replaceChildren();
      const ctx = this.createContext(path, params, query);
      await notFound.render(ctx);
      this.currentUrl = url;
      document.title = `Halaman tidak ditemukan · ${brand.name}`;
      return;
    }

    const allowed = await this.guard(route, path, query);
    if (token !== this.renderToken || !allowed) return;

    let module: PageModule;
    try {
      module = await route.load();
    } catch (error) {
      console.error('[router] failed to load page', path, error);
      const notFound = await import('../pages/not-found.page');
      if (token !== this.renderToken) return;
      this.outlet.replaceChildren();
      await notFound.render(this.createContext(path, params, query));
      this.currentUrl = url;
      return;
    }

    if (token !== this.renderToken) return;

    this.outlet.replaceChildren();
    const ctx = this.createContext(path, params, query);

    try {
      await module.render(ctx);
    } catch (error) {
      console.error('[router] page render failed', path, error);
      const state = await import('../pages/error.page');
      this.outlet.replaceChildren();
      await state.render(ctx);
    }

    if (token !== this.renderToken) return;

    const title =
      typeof module.meta.title === 'function' ? module.meta.title(params) : module.meta.title;
    document.title = `${title} · ${brand.name}`;

    if (!initial) {
      window.scrollTo(0, 0);
    }

    const main = this.outlet.querySelector<HTMLElement>('main');
    main?.focus({ preventScroll: true });

    this.currentUrl = url;
  }

  private createContext(
    path: string,
    params: Record<string, string>,
    query: URLSearchParams,
  ): RouteContext {
    return {
      outlet: this.outlet,
      path,
      params,
      query,
      navigate: (url, options) => this.navigate(url, options),
      onCleanup: (cleanup) => this.cleanups.push(cleanup),
    };
  }

  dispose(): void {
    this.runCleanups();
    this.unsubscribeRecovery?.();
    this.unsubscribeRecovery = null;
  }
}
