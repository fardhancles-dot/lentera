import { icon } from '../../components/icons';
import { adminService } from '../../services/admin.service';
import type { AdminAnalytics, AdminAuditEntry, AdminContentHealth, AdminOverview } from '../../types/admin';
import type { AdminSectionContext } from './ui';
import {
  badge,
  button,
  errorState,
  formatDate,
  loading,
  metric,
  panel,
  table,
} from './ui';
import { el, formatNumber } from '../../utils/dom';

function chart(daily: Array<{ date: string; users: number; lessons: number; xp: number }>): HTMLElement {
  const max = Math.max(1, ...daily.map((day) => Math.max(day.users, day.lessons)));
  const bars = el('div', { class: 'admin-chart' });
  for (const day of daily) {
    const bar = el('div', { class: 'admin-chart__col' }, [
      el('div', { class: 'admin-chart__bars' }, [
        el('span', {
          class: 'admin-chart__bar admin-chart__bar--a',
          attrs: {
            style: `height:${Math.max(3, Math.round((day.users / max) * 100))}%`,
            title: `${day.users} pengguna baru`,
          },
        }),
        el('span', {
          class: 'admin-chart__bar admin-chart__bar--b',
          attrs: {
            style: `height:${Math.max(3, Math.round((day.lessons / max) * 100))}%`,
            title: `${day.lessons} lesson selesai`,
          },
        }),
      ]),
      el('span', { class: 'admin-chart__label', text: day.date.slice(5) }),
    ]);
    bars.append(bar);
  }
  return el('div', {}, [
    bars,
    el('p', { class: 'admin-chart__legend' }, [
      el('span', { class: 'admin-chart__key admin-chart__key--a', text: 'Pengguna baru' }),
      el('span', { class: 'admin-chart__key admin-chart__key--b', text: 'Lesson selesai' }),
    ]),
  ]);
}

function auditList(entries: AdminAuditEntry[]): HTMLElement {
  if (entries.length === 0) {
    return el('p', { class: 'form-hint', text: 'Belum ada aktivitas administrator.' });
  }
  return el(
    'ul',
    { class: 'admin-feed' },
    entries.map((entry) =>
      el('li', { class: 'admin-feed__item' }, [
        el('span', { class: 'admin-feed__dot' }),
        el('div', {}, [
          el('strong', { text: entry.action.replaceAll('_', ' ') }),
          el('p', {
            class: 'admin-feed__meta',
            text: `${entry.actorName} · ${entry.targetType}${
              entry.targetId ? ` ${entry.targetId.slice(0, 8)}…` : ''
            } · ${formatDate(entry.createdAt, true)}`,
          }),
        ]),
      ]),
    ),
  );
}

export async function renderOverview(ctx: AdminSectionContext): Promise<void> {
  ctx.root.replaceChildren(loading('Memuat ringkasan dashboard…'));
  try {
    const [overview, analytics, audits, health] = await Promise.all([
      adminService.getOverview(),
      adminService.getAnalytics(14),
      adminService.getAuditLogs(8),
      adminService.getContentHealth(),
    ]);
    ctx.root.replaceChildren(...overviewView(ctx, overview, analytics, audits, health));
  } catch (error) {
    ctx.root.replaceChildren(
      errorState(error instanceof Error ? error.message : 'Ringkasan gagal dimuat.', () =>
        void renderOverview(ctx),
      ),
    );
  }
}

function overviewView(
  ctx: AdminSectionContext,
  overview: AdminOverview,
  analytics: AdminAnalytics,
  audits: AdminAuditEntry[],
  health: AdminContentHealth,
): HTMLElement[] {
  const warningCount = overview.warnings.reduce((total, warning) => total + warning.count, 0);
  const quick = el('div', { class: 'admin-quick' }, [
    button('Kelola mapel', 'book', () => ctx.navigate('curriculum'), 'primary'),
    button('Bank soal', 'plus', () => ctx.navigate('questions')),
    button('Pengumuman', 'bell', () => ctx.navigate('website')),
    button('Pengguna', 'users', () => ctx.navigate('users')),
  ]);

  return [
    el('div', { class: 'admin-metrics' }, [
      metric('Total pengguna', formatNumber(overview.players.total), `${formatNumber(overview.players.onboarded)} onboarded`, 'users'),
      metric('Pengguna baru', formatNumber(overview.players.new7d), '7 hari terakhir', 'sparkles'),
      metric('Level & lesson', formatNumber(overview.content.lessons), `${formatNumber(overview.content.nodes)} node peta`, 'map'),
      metric('Bank soal', formatNumber(overview.content.questions), `${formatNumber(overview.content.subjects)} mata pelajaran`, 'book'),
      metric('XP diberikan', formatNumber(overview.activity.xpAwarded), `${formatNumber(overview.activity.lessonsCompleted)} lesson selesai`, 'star'),
      metric('Koin beredar', formatNumber(overview.activity.coinsCirculating), `${formatNumber(overview.activity.activeStreaks)} streak aktif`, 'coin'),
      metric('Latihan selesai', formatNumber(overview.activity.practicesCompleted), 'Sepanjang waktu', 'target'),
      metric('Audit entry', formatNumber(overview.auditEntries), 'Append-only', 'shield'),
    ]),
    el('div', { class: 'admin-grid admin-grid--2' }, [
      panel('Aktivitas 14 hari', 'Data aktual dari ledger, attempt, dan registrasi.', [chart(overview.daily)]),
      panel('Aksi cepat', 'Langsung ke modul pengelolaan terkait.', [quick]),
    ]),
    el('div', { class: 'admin-grid admin-grid--2' }, [
      panel('Perlu perhatian', 'Konten yang belum siap dimainkan.', [
        overview.warnings.length === 0 ? null : el(
          'ul',
          { class: 'admin-list' },
          overview.warnings.map((warning) =>
            el('li', {}, [
              el('span', { text: warning.label }),
              badge(String(warning.count), warning.count > 0 ? 'warn' : 'ok'),
            ]),
          ),
        ),
        el('p', {
          class: 'form-hint',
          text: `Draft: ${overview.drafts.subjects ?? 0} mapel · ${overview.drafts.levels ?? 0} level · ${overview.drafts.lessons ?? 0} lesson · ${overview.drafts.questions ?? 0} soal.`,
        }),
        el('p', {
          class: 'form-hint',
          text: `Kesehatan konten: ${health.publishedLessonsWithoutQuestions.length} lesson terbit tanpa soal, ${health.nodesWithoutLesson.length} node tanpa lesson.`,
        }),
      ]),
      panel('Aktivitas administrator', 'Perubahan terakhir yang tercatat.', [auditList(audits)]),
    ]),
    panel('Top lesson', 'Berdasarkan attempt pada periode analytics.', [
      analytics.topLessons.length === 0
        ? el('p', { class: 'form-hint', text: 'Belum ada attempt pada periode ini.' })
        : table(
            ['Lesson', 'Attempt', 'Lulus', 'Akurasi'],
            analytics.topLessons.map((lesson) => [
              lesson.title,
              formatNumber(lesson.attempts),
              formatNumber(lesson.passed),
              `${lesson.accuracy}%`,
            ]),
          ),
    ]),
    warningCount > 0
      ? el('div', { class: 'banner banner--warning' }, [
          icon('alert', 18),
          el('span', { text: `${warningCount} peringatan konten aktif. Periksa modul Validasi.` }),
        ])
      : null,
  ].filter((item): item is HTMLElement => Boolean(item));
}
