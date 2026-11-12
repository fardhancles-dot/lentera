import { adminService } from '../../services/admin.service';
import { el, formatNumber } from '../../utils/dom';
import type { AdminSectionContext } from './ui';
import { errorState, loading, metric, panel, select, table } from './ui';

export async function renderAnalytics(ctx: AdminSectionContext): Promise<void> {
  const slot = el('div', {});
  let days = 30;

  const load = async (): Promise<void> => {
    slot.replaceChildren(loading('Menghitung analytics…'));
    try {
      const analytics = await adminService.getAnalytics(days);
      const totals = analytics.totals;
      const max = Math.max(
        1,
        ...analytics.daily.map((day) => Number(day.questionsAnswered ?? 0)),
      );
      const bars = el('div', { class: 'admin-chart' });
      for (const day of analytics.daily) {
        const value = Number(day.questionsAnswered ?? 0);
        bars.append(
          el('div', { class: 'admin-chart__col' }, [
            el('div', { class: 'admin-chart__bars' }, [
              el('span', {
                class: 'admin-chart__bar admin-chart__bar--a',
                attrs: { style: `height:${Math.max(3, Math.round((value / max) * 100))}%`, title: `${value} soal` },
              }),
            ]),
            el('span', { class: 'admin-chart__label', text: String(day.date).slice(5) }),
          ]),
        );
      }
      slot.replaceChildren(
        el('div', { class: 'admin-metrics' }, [
          metric('Pengguna aktif', formatNumber(Number(totals.activeUsers ?? 0)), `${formatNumber(Number(totals.users ?? 0))} total`, 'users'),
          metric('Pengguna baru', formatNumber(Number(totals.newUsers ?? 0)), `${days} hari terakhir`, 'sparkles'),
          metric('Soal dikerjakan', formatNumber(Number(totals.questionsAnswered ?? 0)), `${formatNumber(Number(totals.correctAnswers ?? 0))} benar`, 'target'),
          metric('Lesson selesai', formatNumber(Number(totals.lessonsCompleted ?? 0)), `${formatNumber(Number(totals.lessonAttempts ?? 0))} attempt`, 'book'),
          metric('XP diberikan', formatNumber(Number(totals.xpAwarded ?? 0)), `${formatNumber(Number(totals.questClaims ?? 0))} klaim quest`, 'star'),
          metric('Koin diperoleh', formatNumber(Number(totals.coinsEarned ?? 0)), `${formatNumber(Number(totals.coinsSpent ?? 0))} dibelanjakan`, 'coin'),
          metric('Toko', formatNumber(Number(totals.shopPurchases ?? 0)), 'Pembelian', 'bag'),
          metric('Achievement', formatNumber(Number(totals.achievementsUnlocked ?? 0)), 'Dibuka', 'trophy'),
        ]),
        panel(`Aktivitas ${days} hari`, 'Soal yang dikerjakan per hari.', [bars]),
        panel('Lesson teratas', 'Berdasarkan attempt dalam periode ini.', [
          analytics.topLessons.length === 0
            ? el('p', { class: 'form-hint', text: 'Belum tersedia data lesson pada periode ini.' })
            : table(['Lesson', 'Attempt', 'Lulus', 'Akurasi'], analytics.topLessons.map((lesson) => [
                lesson.title,
                formatNumber(lesson.attempts),
                formatNumber(lesson.passed),
                `${lesson.accuracy}%`,
              ])),
        ]),
        el('p', {
          class: 'form-hint',
          text: 'Statistik berasal dari agregasi RPC. Data yang belum tersedia tidak ditampilkan sebagai angka palsu.',
        }),
      );
    } catch (error) {
      slot.replaceChildren(errorState(error instanceof Error ? error.message : 'Analytics gagal dimuat.', () => void load()));
    }
  };

  const range = select('analytics-days', [
    { value: '7', label: '7 hari' },
    { value: '30', label: '30 hari' },
    { value: '90', label: '90 hari' },
  ], String(days));
  range.addEventListener('change', () => {
    days = Number(range.value) || 30;
    void load();
  });

  ctx.root.replaceChildren(el('div', { class: 'admin-filters' }, [range]), slot);
  await load();
}
