import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { pageHeader, renderAppLayout } from '../layouts/appLayout';
import { curriculumService, type SubjectCard } from '../services/curriculum.service';
import { masteryService } from '../services/mastery.service';
import { PRACTICE_MODES, type PracticeModeInfo } from '../services/practice.service';
import type { MasteryBoard } from '../types/mastery';
import { sessionStore } from '../stores/session.store';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Latihan' };

function modeCard(
  info: PracticeModeInfo,
  courseId: string | null,
  dueCount: number,
): HTMLElement {
  const waitingForDue = Boolean(info.needsDue) && dueCount === 0;
  const buttonLabel = info.needsDue
    ? waitingForDue
      ? 'Belum ada jatuh tempo'
      : `Review ${dueCount} soal`
    : info.needsUnit
      ? 'Pilih unit'
      : 'Mulai';
  const start = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
    buttonLabel,
    icon(info.needsDue ? 'clock' : 'arrow-right', 16),
  ]);
  start.disabled = !courseId || waitingForDue;

  return el('article', { class: 'card practice-mode' }, [
    el('div', { class: 'practice-mode__top' }, [
      el('span', { class: 'practice-mode__icon' }, [icon(info.icon, 24)]),
      el('span', { class: 'badge badge--muted', text: info.meta }),
    ]),
    el('h2', { class: 'practice-mode__title', text: info.title }),
    el('p', { class: 'practice-mode__body', text: info.description }),
    el('div', { class: 'practice-mode__footer' }, [start]),
  ]);
}

function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const listSlot = el('div', { class: 'loading-screen' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Memuat mode latihan…' }),
  ]);

  const toolbar = el('div', { class: 'practice-toolbar' });
  const masterySlot = el('div');

  const content = el('div', {}, [
    pageHeader({
      eyebrow: 'Practice Hub',
      title: 'Latihan',
      subtitle:
        'Latihan terarah dari bank soal yang sama dengan lesson. Semua jawaban dinilai di server; combo dan XP tidak dikirim dari browser.',
    }),
    el('div', { class: 'banner banner--info' }, [
      icon('shield', 18),
      el('div', {}, [
        el('p', { class: 'banner__title', text: 'Penilaian tetap di server' }),
        el('p', {
          class: 'banner__body',
          text: 'Waktu dan combo dihitung ulang oleh database saat sesi selesai. Kamu hanya mengirim jawaban dan durasi menjawab.',
        }),
      ]),
    ]),
    el('a', { class: 'card friend-quest-cta', attrs: { href: '/friends-quest' } }, [
      el('span', { class: 'friend-quest-cta__icon' }, [icon('users', 24)]),
      el('span', { class: 'friend-quest-cta__text' }, [
        el('span', { class: 'friend-quest-cta__title', text: 'Friends Quest' }),
        el('span', {
          class: 'friend-quest-cta__body',
          text: 'Kejar target XP bersama teman. Kontribusi dihitung dari lesson dan latihan.',
        }),
      ]),
      icon('chevron-right', 20),
    ]),
    masterySlot,
    toolbar,
    listSlot,
  ]);

  renderAppLayout(ctx, { active: 'practice', title: 'Latihan', content });

  const load = () => {
    listSlot.className = 'loading-screen';
    listSlot.replaceChildren(
      el('span', { class: 'spinner' }),
      el('p', { text: 'Memuat mode latihan…' }),
    );
    toolbar.replaceChildren();

    void (async () => {
      try {
        const subjects = await curriculumService.loadCatalog(user.id);
        const mastery: MasteryBoard | null = await masteryService.load().catch(() => null);
        if (!listSlot.isConnected) return;

        const playable: SubjectCard[] = subjects.filter(
          (subject) => subject.status === 'active' && subject.question_count > 0,
        );

        if (playable.length === 0) {
          listSlot.className = '';
          listSlot.append(
            el('div', { class: 'card empty-state' }, [
              el('span', { class: 'empty-state__art' }, [icon('target', 34)]),
              el('h2', { class: 'empty-state__title', text: 'Belum ada bank soal' }),
              el('p', {
                class: 'empty-state__body',
                text: 'Latihan membutuhkan soal aktif. Jalankan migration dan seed kurikulum terlebih dahulu.',
              }),
            ]),
          );
          return;
        }

        const preferred = ctx.query.get('subject');
        let selected =
          playable.find((subject) => subject.slug === preferred) ?? playable[0]!;

        const select = el('select', {
          class: 'practice-toolbar__select',
          attrs: { 'aria-label': 'Mata pelajaran untuk latihan' },
        });
        for (const subject of playable) {
          const option = el('option', {
            text: `${subject.name} · ${formatNumber(subject.question_count)} soal`,
            attrs: { value: subject.slug },
          });
          if (subject.slug === selected.slug) option.selected = true;
          select.append(option);
        }

        const grid = el('div', { class: 'practice-grid' });

        const paintMastery = () => {
          if (!mastery) {
            masterySlot.replaceChildren();
            return;
          }

          masterySlot.replaceChildren(
            el('a', { class: 'card mastery-cta', attrs: { href: '/mastery' } }, [
              el('span', { class: 'mastery-cta__icon' }, [icon('target', 24)]),
              el('span', { class: 'mastery-cta__text' }, [
                el('span', { class: 'mastery-cta__title', text: 'Mastery & Review' }),
                el('span', {
                  class: 'mastery-cta__body',
                  text: `${mastery.summary.tracked} soal terlacak · ${mastery.summary.due} jatuh tempo · akurasi ${mastery.summary.accuracy}%`,
                }),
              ]),
              mastery.summary.due > 0
                ? el('span', { class: 'badge badge--yellow', text: `${mastery.summary.due} jatuh tempo` })
                : el('span', { class: 'badge badge--muted', text: 'Terjadwal' }),
              icon('chevron-right', 20),
            ]),
          );
        };

        const dueForSelected = () =>
          mastery?.courses.find((course) => course.courseId === selected.course_id)?.due ?? 0;

        const paint = () => {
          grid.replaceChildren(
            ...PRACTICE_MODES.map((info) => {
              const card = modeCard(info, selected.course_id, dueForSelected());
              const button = card.querySelector('button');
              button?.addEventListener('click', () => {
                if (!selected.course_id) return;
                const params = new URLSearchParams({
                  mode: info.mode,
                  course: selected.course_id,
                  subject: selected.slug,
                });
                ctx.navigate(`/practice/play?${params.toString()}`);
              });
              return card;
            }),
          );
        };

        select.addEventListener('change', () => {
          selected = playable.find((subject) => subject.slug === select.value) ?? selected;
          paint();
        });

        toolbar.append(
          el('label', { class: 'practice-toolbar__label' }, [
            el('span', { text: 'Mata pelajaran' }),
            select,
          ]),
          el('span', {
            class: 'practice-toolbar__hint',
            text: 'Review Terjadwal memakai soal yang sudah jatuh tempo; Mistakes Review memakai riwayat jawaban salah; Personalized Practice memakai topik yang paling sering salah.',
          }),
        );

        paintMastery();
        listSlot.className = '';
        listSlot.append(grid);
        paint();
      } catch (error) {
        console.error('[practice] failed to load modes', error);
        if (!listSlot.isConnected) return;
        listSlot.className = '';
        const message = error instanceof Error ? error.message : 'Mode latihan gagal dimuat.';
        const retry = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
          icon('refresh', 18),
          'Coba lagi',
        ]);
        retry.addEventListener('click', load);
        listSlot.append(
          el('div', { class: 'card empty-state' }, [
            el('span', { class: 'empty-state__art' }, [icon('alert', 34)]),
            el('h2', { class: 'empty-state__title', text: 'Latihan gagal dimuat' }),
            el('p', { class: 'empty-state__body', text: message }),
            retry,
          ]),
        );
      }
    })();
  };

  load();
}

export { meta, render };
