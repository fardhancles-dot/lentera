import type { PageModule } from '../app/router';
import { avatar } from '../components/avatar';
import { brandMark } from '../components/brandMark';
import { icon, type IconName } from '../components/icons';
import { showToast } from '../components/toast';
import { adminService } from '../services/admin.service';
import { sessionStore } from '../stores/session.store';
import type { AdminContext } from '../types/admin';
import { el } from '../utils/dom';
import { renderAnalytics } from './admin/analytics';
import { renderCurriculum, renderMap } from './admin/curriculum';
import { renderGamification } from './admin/gamification';
import { renderMedia } from './admin/media';
import { renderOverview } from './admin/overview';
import { renderQuestions } from './admin/questions';
import { renderSocial } from './admin/social';
import { renderSystem } from './admin/system';
import type { AdminSectionContext } from './admin/ui';
import { renderUsers } from './admin/users';
import { renderWebsite } from './admin/website';

const meta = { title: 'Admin Dashboard' };

interface NavItem {
  key: string;
  label: string;
  icon: IconName;
  permission: string;
  render: (ctx: AdminSectionContext) => Promise<void>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: 'Ringkasan',
    items: [
      { key: 'overview', label: 'Ringkasan', icon: 'home', permission: 'dashboard.read', render: renderOverview },
    ],
  },
  {
    label: 'Pembelajaran',
    items: [
      { key: 'curriculum', label: 'Kurikulum', icon: 'book', permission: 'curriculum.read', render: renderCurriculum },
      { key: 'map', label: 'Map editor', icon: 'map', permission: 'curriculum.read', render: renderMap },
      { key: 'questions', label: 'Bank soal', icon: 'target', permission: 'questions.read', render: renderQuestions },
      { key: 'media', label: 'Media', icon: 'globe', permission: 'media.manage', render: renderMedia },
    ],
  },
  {
    label: 'Gamifikasi',
    items: [
      { key: 'gamification', label: 'XP, misi, toko', icon: 'trophy', permission: 'gamification.manage', render: renderGamification },
    ],
  },
  {
    label: 'Konten website',
    items: [
      { key: 'website', label: 'Website & pengumuman', icon: 'globe', permission: 'content.manage', render: renderWebsite },
    ],
  },
  {
    label: 'Pengguna',
    items: [
      { key: 'users', label: 'Pengguna & reward', icon: 'users', permission: 'users.read', render: renderUsers },
    ],
  },
  {
    label: 'Sosial',
    items: [
      { key: 'social', label: 'Pertemanan & quest', icon: 'users', permission: 'social.moderate', render: renderSocial },
    ],
  },
  {
    label: 'Analitik',
    items: [
      { key: 'analytics', label: 'Analytics', icon: 'chart', permission: 'analytics.read', render: renderAnalytics },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { key: 'system', label: 'Audit & izin', icon: 'shield', permission: 'audit.read', render: renderSystem },
    ],
  },
];

function availableNav(context: AdminContext): NavGroup[] {
  return NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => context.permissions.includes(item.permission)),
  })).filter((group) => group.items.length > 0);
}

function allItems(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((group) => group.items);
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;
  ctx.onCleanup(() => {
    document.documentElement.classList.remove('admin-drawer-open');
  });

  ctx.outlet.replaceChildren(
    el('div', { class: 'admin-boot' }, [el('span', { class: 'spinner' }), el('p', { text: 'Menyiapkan admin dashboard…' })]),
  );

  void adminService
    .getContext()
    .then((context) => {
      const groups = availableNav(context);
      const items = allItems(groups);
      if (items.length === 0) {
        ctx.outlet.replaceChildren(
          el('div', { class: 'admin-empty-page' }, [
            el('h1', { text: 'Tidak ada modul yang dapat diakses' }),
            el('p', { text: 'Role kamu tidak memiliki izin dashboard. Hubungi developer.' }),
            el('a', { class: 'btn', attrs: { href: '/app' }, text: 'Kembali ke aplikasi' }),
          ]),
        );
        return;
      }

      const requested = ctx.params.section ?? 'overview';
      const active = items.find((item) => item.key === requested) ?? items[0]!;
      const sectionRoot = el('div', { class: 'admin-section' });
      const shell = el('div', { class: 'admin' });

      const navigate = (section: string) => {
        const target = items.find((item) => item.key === section);
        if (target) ctx.navigate(`/admin/${target.key}`);
      };
      const sectionCtx: AdminSectionContext = {
        root: sectionRoot,
        permissions: context.permissions,
        navigate,
        reload: () => renderSection(active),
      };

      const renderSection = (item: NavItem) => {
        sectionRoot.replaceChildren();
        void item
          .render(sectionCtx)
          .catch((error: unknown) => {
            sectionRoot.replaceChildren(
              el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
                el('span', { text: error instanceof Error ? error.message : 'Modul gagal dimuat.' }),
              ]),
            );
          });
      };

      const nav = el('nav', { class: 'admin-nav', attrs: { 'aria-label': 'Navigasi admin' } });
      for (const group of groups) {
        nav.append(
          el('div', { class: 'admin-nav__group' }, [
            el('span', { class: 'admin-nav__label', text: group.label }),
            ...group.items.map((item) =>
              el(
                'a',
                {
                  class: `admin-nav__item${item.key === active.key ? ' is-active' : ''}`,
                  attrs: { href: `/admin/${item.key}`, 'aria-current': item.key === active.key ? 'page' : null },
                },
                [
                  el('span', { class: 'admin-nav__icon' }, [icon(item.icon, 18)]),
                  el('span', { class: 'admin-nav__text', text: item.label }),
                ],
              ),
            ),
          ]),
        );
      }

      const logout = el('button', {
        class: 'admin-user__logout',
        attrs: { type: 'button', 'aria-label': 'Keluar' },
        events: {
          click: () => {
            void sessionStore.signOut().then(() => {
              showToast('Kamu sudah keluar.', 'success');
              ctx.navigate('/login', { replace: true });
            });
          },
        },
      }, [icon('logout', 18)]);

      const sidebar = el('aside', { class: 'admin-sidebar', attrs: { 'aria-label': 'Sidebar admin' } }, [
        el('a', { class: 'admin-brand', attrs: { href: '/admin' } }, [
          brandMark(30, 'admin-brand__mark'),
          el('span', { class: 'admin-brand__text' }, [
            el('strong', { text: 'Lentera' }),
            el('span', { text: 'Admin CMS' }),
          ]),
        ]),
        nav,
        el('div', { class: 'admin-sidebar__footer' }, [
          el('a', { class: 'admin-legacy', attrs: { href: '/developer' }, text: 'Developer Dashboard lama' }),
          el('div', { class: 'admin-user' }, [
            avatar(user.profile.avatar_key, 'sm'),
            el('span', { class: 'admin-user__meta' }, [
              el('strong', { text: user.profile.display_name || user.profile.username }),
              el('span', { text: context.role === 'developer' ? 'Developer' : 'Admin' }),
            ]),
            logout,
          ]),
        ]),
      ]);

      const backdrop = el('div', {
        class: 'admin-backdrop',
        attrs: { 'aria-hidden': 'true' },
        events: { click: () => closeDrawer() },
      });

      const menuButton = el('button', {
        class: 'admin-topbar__menu',
        attrs: { type: 'button', 'aria-label': 'Buka menu admin', 'aria-expanded': 'false' },
      }, [icon('menu', 20)]);

      const collapseButton = el('button', {
        class: 'admin-topbar__collapse',
        attrs: { type: 'button', 'aria-label': 'Ciutkan sidebar', title: 'Ciutkan sidebar' },
      }, [icon('arrow-left', 18)]);

      function closeDrawer(): void {
        shell.classList.remove('is-drawer-open');
        document.documentElement.classList.remove('admin-drawer-open');
        menuButton.setAttribute('aria-expanded', 'false');
      }

      menuButton.addEventListener('click', () => {
        const open = !shell.classList.contains('is-drawer-open');
        shell.classList.toggle('is-drawer-open', open);
        document.documentElement.classList.toggle('admin-drawer-open', open);
        menuButton.setAttribute('aria-expanded', String(open));
      });
      collapseButton.addEventListener('click', () => {
        const collapsed = shell.classList.toggle('is-collapsed');
        collapseButton.setAttribute('aria-label', collapsed ? 'Bentangkan sidebar' : 'Ciutkan sidebar');
      });

      const breadcrumb = el('div', { class: 'admin-breadcrumb' }, [
        el('a', { attrs: { href: '/admin' }, text: 'Admin' }),
        el('span', { attrs: { 'aria-hidden': 'true' }, text: '/' }),
        el('span', { text: active.label }),
      ]);

      const topbar = el('header', { class: 'admin-topbar' }, [
        menuButton,
        collapseButton,
        breadcrumb,
        el('div', { class: 'admin-topbar__actions' }, [
          el('a', { class: 'btn btn--secondary btn--sm', attrs: { href: '/app' }, text: 'Lihat aplikasi' }),
        ]),
      ]);

      shell.append(
        backdrop,
        sidebar,
        el('div', { class: 'admin-main' }, [
          topbar,
          el('main', { class: 'admin-content', attrs: { id: 'admin-main', tabindex: '-1' } }, [
            el('div', { class: 'admin-page-head' }, [
              el('h1', { text: active.label }),
              el('p', { text: `Masuk sebagai ${user.profile.username} · ${context.role}` }),
            ]),
            sectionRoot,
          ]),
        ]),
      );

      ctx.outlet.replaceChildren(shell);
      renderSection(active);
      window.setTimeout(() => document.querySelector<HTMLElement>('#admin-main')?.focus({ preventScroll: true }), 0);
    })
    .catch((error: unknown) => {
      ctx.outlet.replaceChildren(
        el('div', { class: 'admin-empty-page' }, [
          el('h1', { text: 'Admin Dashboard tidak dapat dibuka' }),
          el('p', { text: error instanceof Error ? error.message : 'Gagal memuat konteks admin.' }),
          el('a', { class: 'btn', attrs: { href: '/app' }, text: 'Kembali ke aplikasi' }),
        ]),
      );
    });
}

export { meta, render };
