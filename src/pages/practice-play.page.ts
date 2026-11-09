import type { PageModule } from '../app/router';
import { icon } from '../components/icons';
import { createMiniGame } from '../game/minigames';
import type { MiniGameView } from '../game/minigames/types';
import { formatClock, RAMP_UP_SECONDS } from '../game/practice/scoring';
import { curriculumService } from '../services/curriculum.service';
import type { LessonAnswer } from '../services/lesson.service';
import {
  practiceService,
  type PracticeMode,
  type PracticeStart,
  type PracticeSummary,
} from '../services/practice.service';
import { playerStore } from '../stores/player.store';
import { sessionStore } from '../stores/session.store';
import { el, formatNumber } from '../utils/dom';

const meta = { title: 'Latihan' };

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} detik`;
  return `${minutes} menit ${rest} detik`;
}

function statePage(title: string, body: string, backHref: string, retry?: () => void): HTMLElement {
  const actions = el('div', { class: 'state-card__actions' }, [
    el('a', { class: 'btn', attrs: { href: backHref } }, [
      icon('arrow-left', 18),
      'Kembali ke latihan',
    ]),
  ]);

  if (retry) {
    const button = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
      icon('refresh', 18),
      'Coba lagi',
    ]);
    button.addEventListener('click', retry);
    actions.append(button);
  }

  return el('div', { class: 'state-page play-state' }, [
    el('div', { class: 'state-card' }, [
      el('span', { class: 'state-card__icon' }, [icon('alert', 30)]),
      el('h1', { class: 'state-card__title', text: title }),
      el('p', { class: 'state-card__body', text: body }),
      actions,
    ]),
  ]);
}

export function render(ctx: Parameters<PageModule['render']>[0]): void {
  const user = sessionStore.getState().user;
  if (!user) return;

  const mode = (ctx.query.get('mode') ?? '') as PracticeMode;
  const info = practiceService.modeInfo(mode);
  const courseId = ctx.query.get('course') ?? '';
  const subjectSlug = ctx.query.get('subject') ?? '';
  const unitId = ctx.query.get('unit');
  const backHref = '/practice';

  let disposed = false;
  let start: PracticeStart | null = null;
  let summary: PracticeSummary | null = null;
  let index = 0;
  let busy = false;
  let finishing = false;
  let combo = 0;
  let remainingMs = 0;
  let totalDeadline = 0;
  let countdownTimer = 0;
  let rampTimer = 0;
  let questionStartedAt = 0;
  let timerChip: HTMLElement | null = null;
  let comboSlot: HTMLElement | null = null;

  ctx.onCleanup(() => {
    disposed = true;
    window.clearInterval(countdownTimer);
    window.clearInterval(rampTimer);
  });

  if (!info || !courseId) {
    ctx.outlet.replaceChildren(
      statePage(
        'Mode latihan tidak dikenali',
        'Alamat latihan tidak memuat mode dan mata pelajaran yang valid. Buka Practice Hub untuk memilih mode.',
        backHref,
      ),
    );
    return;
  }

  const unitChooser = () => {
    const host = el('div', { class: 'play-loading' }, [
      el('span', { class: 'spinner' }),
      el('p', { text: 'Memuat unit…' }),
    ]);
    ctx.outlet.replaceChildren(host);

    if (!subjectSlug) {
      ctx.outlet.replaceChildren(
        statePage(
          'Mata pelajaran tidak ditemukan',
          'Unit Review membutuhkan mata pelajaran. Pilih ulang dari Practice Hub.',
          backHref,
        ),
      );
      return;
    }

    void (async () => {
      try {
        const path = await curriculumService.loadSubjectPath(subjectSlug, user.id);
        if (disposed) return;

        const units =
          path?.levels
            .flatMap((level) => level.units)
            .filter((unit) => unit.nodes.some((node) => node.questionCount > 0)) ?? [];

        if (units.length === 0) {
          ctx.outlet.replaceChildren(
            statePage(
              'Belum ada unit dengan soal',
              'Unit Review membutuhkan unit yang sudah memiliki bank soal.',
              backHref,
            ),
          );
          return;
        }

        const list = el('ol', { class: 'practice-units' });
        for (const unit of units) {
          const questions = unit.nodes.reduce((sum, node) => sum + node.questionCount, 0);
          const link = el('a', { class: 'practice-unit', attrs: { href: '#' } }, [
            el('span', { class: 'practice-unit__title', text: unit.title }),
            el('span', {
              class: 'practice-unit__meta',
              text: `${unit.nodes.length} node · ${questions} soal`,
            }),
            icon('chevron-right', 18),
          ]);
          link.addEventListener('click', (event) => {
            event.preventDefault();
            const params = new URLSearchParams(ctx.query);
            params.set('unit', unit.id);
            ctx.navigate(`/practice/play?${params.toString()}`);
          });
          list.append(el('li', {}, [link]));
        }

        ctx.outlet.replaceChildren(
          el('div', { class: 'play-shell practice-shell' }, [
            el('header', { class: 'play-top' }, [
              el('a', { class: 'play-exit', attrs: { href: backHref, 'aria-label': 'Kembali' } }, [
                icon('close', 20),
                el('span', { text: 'Keluar' }),
              ]),
              el('div', { class: 'play-top__center' }, [
                el('p', { class: 'play-top__eyebrow', text: info.title }),
              ]),
            ]),
            el('main', { class: 'play-main' }, [
              el('div', { class: 'play-card' }, [
                el('p', { class: 'play-instruction', text: 'Pilih unit untuk diulas' }),
                el('h1', { class: 'play-prompt', text: 'Unit Review' }),
                el('p', {
                  class: 'play-mini-note',
                  text: 'Soal dipilih acak dari unit yang kamu pilih, maksimal 12 soal.',
                }),
                list,
              ]),
            ]),
          ]),
        );
      } catch (error) {
        if (disposed) return;
        ctx.outlet.replaceChildren(
          statePage(
            'Unit gagal dimuat',
            error instanceof Error ? error.message : 'Coba lagi.',
            backHref,
            unitChooser,
          ),
        );
      }
    })();
  };

  const startSession = () => {
    const host = el('div', { class: 'play-loading' }, [
      el('span', { class: 'spinner' }),
      el('p', { text: 'Menyiapkan latihan…' }),
    ]);
    ctx.outlet.replaceChildren(host);

    void (async () => {
      try {
        start = await practiceService.start(mode, courseId, unitId);
        if (disposed) return;

        index = 0;
        combo = 0;
        summary = null;
        remainingMs = start.timeLimitSeconds * 1000;
        renderGame();
      } catch (error) {
        if (disposed) return;
        ctx.outlet.replaceChildren(
          statePage(
            'Latihan belum bisa dimulai',
            error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat latihan.',
            backHref,
            startSession,
          ),
        );
      }
    })();
  };

  const pauseCountdown = () => {
    if (!start || start.timeLimitSeconds <= 0) return;
    remainingMs = Math.max(0, totalDeadline - performance.now());
    window.clearInterval(countdownTimer);
  };

  const startCountdown = () => {
    window.clearInterval(countdownTimer);
    if (!start || start.timeLimitSeconds <= 0 || !timerChip) return;

    totalDeadline = performance.now() + remainingMs;
    const tick = () => {
      if (!timerChip || disposed) return;
      const left = totalDeadline - performance.now();
      timerChip.textContent = formatClock(left);
      timerChip.classList.toggle('practice-timer--low', left <= 15000);
      if (left <= 0) {
        window.clearInterval(countdownTimer);
        void finishPractice();
      }
    };
    tick();
    countdownTimer = window.setInterval(tick, 250);
  };

  const finishPractice = async () => {
    if (!start || finishing || disposed) return;
    finishing = true;
    busy = true;
    window.clearInterval(countdownTimer);
    window.clearInterval(rampTimer);

    ctx.outlet.replaceChildren(
      el('div', { class: 'play-loading' }, [
        el('span', { class: 'spinner' }),
        el('p', { text: 'Menghitung hasil latihan…' }),
      ]),
    );

    try {
      summary = await practiceService.complete(start.sessionId);
      await playerStore.load(true);
      if (disposed) return;
      renderSummary();
    } catch (error) {
      if (disposed) return;
      finishing = false;
      ctx.outlet.replaceChildren(
        statePage(
          'Hasil latihan gagal disimpan',
          error instanceof Error ? error.message : 'Periksa koneksi lalu coba lagi.',
          backHref,
          () => window.location.reload(),
        ),
      );
    }
  };

  const renderGame = () => {
    if (!start || disposed) return;

    const total = start.questions.length;
    const progressBar = el('span', { class: 'play-progress__bar' });
    const progress = el(
      'div',
      {
        class: 'play-progress',
        attrs: {
          role: 'progressbar',
          'aria-label': 'Progres latihan',
          'aria-valuemin': '0',
          'aria-valuemax': String(total),
          'aria-valuenow': String(index),
        },
      },
      [progressBar],
    );
    progressBar.style.width = `${Math.round((index / total) * 100)}%`;

    const counter = el('span', {
      class: 'play-counter',
      text: `${Math.min(index + 1, total)}/${total}`,
    });

    timerChip = el('span', {
      class: 'practice-timer',
      attrs: { 'aria-live': 'off' },
      text: start.timeLimitSeconds > 0 ? formatClock(remainingMs) : '0:20',
    });
    comboSlot = el('span', {
      class: 'practice-combo',
      text: combo > 1 ? `Combo ×${combo}` : 'Combo —',
    });

    const body = el('div', { class: 'play-body' });
    const footer = el('div', { class: 'play-footer' });
    const live = el('div', { class: 'play-feedback-slot', attrs: { 'aria-live': 'polite' } });

    const shell = el('div', { class: 'play-shell practice-shell' }, [
      el('header', { class: 'play-top' }, [
        el('a', { class: 'play-exit', attrs: { href: backHref, 'aria-label': 'Keluar dari latihan' } }, [
          icon('close', 20),
          el('span', { text: 'Keluar' }),
        ]),
        el('div', { class: 'play-top__center' }, [
          el('p', { class: 'play-top__eyebrow', text: info.title }),
          progress,
        ]),
        el('div', { class: 'practice-hud' }, [timerChip, comboSlot, counter]),
      ]),
      el('main', { class: 'play-main' }, [body, live]),
      footer,
    ]);

    ctx.outlet.replaceChildren(shell);

    const question = start.questions[index]!;
    const view: MiniGameView = createMiniGame(question, (ready) => {
      checkButton.disabled = !ready || busy;
    });

    const instruction = el('p', {
      class: 'play-instruction',
      text: question.instruction || 'Jawab pertanyaan berikut.',
    });
    const prompt = el('h1', { class: 'play-prompt', text: question.prompt });
    const topic = question.topic
      ? el('span', { class: 'topic-chip', text: question.topic })
      : null;

    const answerArea = el('div', { class: 'play-answer' }, [view.answer]);
    const hint = question.hint
      ? (() => {
          const hintText = el('p', { class: 'play-hint__text', text: question.hint });
          hintText.hidden = true;
          const button = el('button', { class: 'play-hint__button', attrs: { type: 'button' } }, [
            icon('info', 16),
            'Lihat petunjuk',
          ]);
          button.addEventListener('click', () => {
            hintText.hidden = !hintText.hidden;
            button.lastChild!.textContent = hintText.hidden
              ? 'Lihat petunjuk'
              : 'Sembunyikan petunjuk';
          });
          return el('div', { class: 'play-hint' }, [button, hintText]);
        })()
      : null;

    const checkButton = el('button', {
      class: 'btn btn--block btn--lg',
      attrs: { type: 'button', disabled: true },
    });
    checkButton.append(icon('check', 20), document.createTextNode('Periksa jawaban'));

    body.append(
      el('div', { class: 'play-card' }, [
        el('div', { class: 'play-card__top' }, [instruction, topic]),
        view.prompt ?? prompt,
        ...(view.ownsMedia
          ? []
          : question.media
              .filter((media) => media.kind === 'image')
              .map((media) =>
                el('img', {
                  class: 'play-media',
                  attrs: { src: media.url, alt: media.alt || 'Ilustrasi soal' },
                }),
              )),
        hint,
        answerArea,
      ]),
    );
    footer.append(checkButton);

    const submitOnEnter = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || checkButton.disabled) return;
      if (!(event.target instanceof HTMLInputElement)) return;
      event.preventDefault();
      checkButton.click();
    };
    answerArea.addEventListener('keydown', submitOnEnter);
    view.prompt?.addEventListener('keydown', submitOnEnter);

    const submitAnswer = (answer: LessonAnswer | null, timedOut = false) => {
      if (busy || !start || disposed) return;
      busy = true;
      window.clearInterval(rampTimer);
      pauseCountdown();
      checkButton.disabled = true;
      view.setDisabled(true);
      if (timerChip) timerChip.textContent = 'Jeda';
      checkButton.replaceChildren(
        el('span', { class: 'btn__spinner' }),
        document.createTextNode('Memeriksa…'),
      );
      live.replaceChildren();

      const elapsed = performance.now() - questionStartedAt;

      void (async () => {
        try {
          const result = await practiceService.answer(
            start!.sessionId,
            question.id,
            answer ?? { text: '' },
            elapsed,
          );
          if (disposed) return;
          busy = false;
          combo = result.combo;
          if (comboSlot) {
            comboSlot.textContent = combo > 1 ? `Combo ×${combo}` : 'Combo —';
            comboSlot.classList.toggle('practice-combo--active', combo > 1);
          }
          if (timerChip) timerChip.textContent = 'Jeda';

          showFeedback(result, view, live, footer, timedOut);
        } catch (error) {
          if (disposed) return;
          busy = false;
          view.setDisabled(false);
          checkButton.replaceChildren(
            icon('check', 20),
            document.createTextNode('Periksa jawaban'),
          );
          checkButton.disabled = !view.getAnswer();
          if (start) startCountdown();
          if (start?.mode === 'ramp_up') startRampTimer();
          live.replaceChildren(
            el('div', { class: 'banner banner--error', attrs: { role: 'alert' } }, [
              icon('alert', 18),
              el('div', {}, [
                el('p', { class: 'banner__title', text: 'Jawaban gagal dikirim' }),
                el('p', {
                  class: 'banner__body',
                  text: error instanceof Error ? error.message : 'Coba lagi.',
                }),
              ]),
            ]),
          );
        }
      })();
    };

    checkButton.addEventListener('click', () => {
      const answer = view.getAnswer();
      if (answer) submitAnswer(answer);
    });

    const showFeedback = (
      result: Awaited<ReturnType<typeof practiceService.answer>>,
      gameView: MiniGameView,
      liveSlot: HTMLElement,
      footerSlot: HTMLElement,
      timedOut: boolean,
    ) => {
      if (!start) return;

      gameView.markResult?.(result.isCorrect, result.correctAnswer);

      const title = result.isCorrect
        ? result.pointsAwarded > 0
          ? `Benar! +${result.pointsAwarded} poin`
          : 'Benar!'
        : timedOut
          ? 'Waktu habis'
          : 'Belum tepat';

      liveSlot.replaceChildren(
        el(
          'div',
          {
            class: `play-feedback ${
              result.isCorrect ? 'play-feedback--correct' : 'play-feedback--wrong'
            }`,
          },
          [
            el('div', { class: 'play-feedback__head' }, [
              el('span', { class: 'play-feedback__icon' }, [
                icon(result.isCorrect ? 'check' : 'alert', 20),
              ]),
              el('div', {}, [
                el('p', { class: 'play-feedback__title', text: title }),
                !result.isCorrect && result.correctAnswer
                  ? el('p', {
                      class: 'play-feedback__answer',
                      text: `Jawaban benar: ${result.correctAnswer}`,
                    })
                  : null,
              ]),
            ]),
            result.explanation
              ? el('p', { class: 'play-feedback__body', text: result.explanation })
              : null,
            result.combo > 1
              ? el('p', { class: 'play-feedback__combo', text: `Combo ${result.combo} · bonus poin` })
              : null,
          ],
        ),
      );

      footerSlot.replaceChildren();
      const isLast = index + 1 >= start.questions.length;
      const next = el(
        'button',
        { class: 'btn btn--block btn--lg', attrs: { type: 'button' } },
        [isLast ? 'Lihat hasil' : 'Lanjut', icon('arrow-right', 18)],
      );
      next.addEventListener('click', () => {
        if (!start || busy) return;
        if (isLast) {
          void finishPractice();
          return;
        }
        index += 1;
        renderGame();
      });
      footerSlot.append(next);
      next.focus({ preventScroll: true });
    };

    const startRampTimer = () => {
      window.clearInterval(rampTimer);
      if (!start || start.mode !== 'ramp_up') return;

      const deadline = performance.now() + RAMP_UP_SECONDS * 1000;
      const tick = () => {
        if (!timerChip || disposed) return;
        const left = deadline - performance.now();
        timerChip.textContent = formatClock(left);
        timerChip.classList.toggle('practice-timer--low', left <= 5000);
        if (left <= 0) {
          window.clearInterval(rampTimer);
          submitAnswer(null, true);
        }
      };
      tick();
      rampTimer = window.setInterval(tick, 200);
    };

    questionStartedAt = performance.now();
    if (start.mode === 'ramp_up') {
      startRampTimer();
    } else if (start.timeLimitSeconds > 0) {
      startCountdown();
    }

    window.setTimeout(() => view.focus(), 30);
  };

  const renderSummary = () => {
    if (!start || !summary || disposed) return;

    const stats = [
      ['Akurasi', `${summary.accuracy}%`],
      ['Jawaban benar', `${summary.correctCount}/${summary.totalCount}`],
      ['Poin', `${summary.score}/${summary.maxScore}`],
      ['Combo terbaik', `×${summary.bestCombo || 1}`],
      ['Durasi', formatDuration(summary.durationSeconds)],
    ] as const;

    const retry = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
      icon('refresh', 18),
      'Ulangi mode ini',
    ]);
    retry.addEventListener('click', () => window.location.reload());

    const note = summary.xpAwarded > 0
      ? `XP dicatat ke akunmu. Total XP sekarang ${summary.totalXp}.`
      : summary.passed
        ? 'XP tidak diberikan lagi untuk sesi ini.'
        : 'XP hanya diberikan bila akurasi minimal 60%. Ini hanya sesi latihan, progres lesson tidak berubah.';
    const player = playerStore.getState().data;
    const progressNote = player
      ? `Level ${player.level.level} · ${formatNumber(player.totalXp)} XP · Streak ${player.streak.current} hari`
      : null;

    ctx.outlet.replaceChildren(
      el('div', { class: 'play-result-shell' }, [
        el('div', { class: 'play-result', dataset: { passed: String(summary.passed) } }, [
          el('span', { class: 'play-result__badge' }, [
            icon(summary.passed ? 'check' : 'refresh', 18),
            summary.passed ? 'Latihan selesai' : 'Perlu diulang',
          ]),
          el('h1', {
            class: 'play-result__title',
            text: summary.passed ? 'Latihan selesai!' : 'Terus berlatih',
          }),
          el('p', {
            class: 'play-result__lead',
            text: summary.passed
              ? 'Hasil sesi ini tersimpan di riwayat latihanmu.'
              : 'Coba lagi untuk memperbaiki akurasi. Soal yang salah masuk ke Mistakes Review.',
          }),
          el(
            'div',
            { class: 'play-result__stats' },
            stats.map(([label, value]) =>
              el('div', { class: 'stat' }, [
                el('span', { class: 'stat__value', text: value }),
                el('span', { class: 'stat__label', text: label }),
              ]),
            ),
          ),
          summary.xpAwarded > 0
            ? el('div', { class: 'play-rewards' }, [
                el('div', { class: 'play-reward' }, [
                  icon('sparkles', 20),
                  el('span', { class: 'play-reward__value', text: `+${summary.xpAwarded}` }),
                  el('span', { class: 'play-reward__label', text: 'XP' }),
                ]),
              ])
            : null,
          progressNote
            ? el('p', { class: 'play-result__progress', text: progressNote })
            : null,
          el('p', { class: 'play-result__note', text: note }),
          el('div', { class: 'play-result__actions' }, [
            el('a', { class: 'btn btn--block', attrs: { href: backHref } }, [
              icon('target', 18),
              'Kembali ke Latihan',
            ]),
            retry,
          ]),
        ]),
      ]),
    );
  };

  if (info.needsUnit && !unitId) unitChooser();
  else startSession();
}

export { meta };
