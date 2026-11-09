import type { PageModule } from '../app/router';
import { kikoMarkup } from '../components/brandArt';
import { icon } from '../components/icons';
import { createMiniGame, isMiniGameSupported } from '../game/minigames';
import type { MiniGameView } from '../game/minigames/types';
import { curriculumService } from '../services/curriculum.service';
import {
  lessonService,
  type AnswerResult,
  type LessonAnswer,
  type LessonStart,
  type LessonSummary,
} from '../services/lesson.service';
import { sessionStore } from '../stores/session.store';
import { el } from '../utils/dom';

const meta = { title: 'Lesson' };

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} detik`;
  return `${minutes} menit ${rest} detik`;
}

function errorView(
  title: string,
  body: string,
  backHref: string,
  onRetry?: () => void,
): HTMLElement {
  const actions = el('div', { class: 'state-card__actions' }, [
    el('a', { class: 'btn', attrs: { href: backHref } }, [
      icon('arrow-left', 18),
      'Kembali ke peta',
    ]),
  ]);

  if (onRetry) {
    const retry = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
      icon('refresh', 18),
      'Coba lagi',
    ]);
    retry.addEventListener('click', onRetry);
    actions.append(retry);
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

  const subjectSlug = ctx.params.subject ?? '';
  const lessonSlug = ctx.params.lessonSlug ?? '';
  const backHref = `/learn/${subjectSlug}/lesson/${lessonSlug}`;
  const pathHref = `/learn/${subjectSlug}`;
  let disposed = false;
  let start: LessonStart | null = null;
  let index = 0;
  let answeredCount = 0;
  let busy = false;
  let summary: LessonSummary | null = null;

  ctx.onCleanup(() => {
    disposed = true;
  });

  const host = el('div', { class: 'play-loading' }, [
    el('span', { class: 'spinner' }),
    el('p', { text: 'Menyiapkan lesson…' }),
  ]);
  ctx.outlet.append(host);

  const fail = (title: string, body: string, onRetry?: () => void) => {
    if (disposed) return;
    ctx.outlet.replaceChildren(errorView(title, body, backHref, onRetry));
  };

  const load = () => {
    host.className = 'play-loading';
    host.replaceChildren(el('span', { class: 'spinner' }), el('p', { text: 'Menyiapkan lesson…' }));

    void (async () => {
      try {
        const detail = await curriculumService.loadLessonDetail(subjectSlug, lessonSlug, user.id, {
          developerPreview: user.role === 'developer',
        });
        if (disposed) return;

        if (!detail) {
          fail('Lesson tidak ditemukan', 'Lesson ini tidak ada di mata pelajaran tersebut.');
          return;
        }

        if (detail.node.status === 'locked') {
          fail(
            'Lesson masih terkunci',
            'Selesaikan lesson sebelumnya pada peta belajar untuk membuka lesson ini.',
          );
          return;
        }

        if (!detail.node.playable || detail.node.questionCount === 0) {
          fail('Bank soal belum tersedia', 'Lesson ini belum memiliki soal yang dapat dimainkan.');
          return;
        }

        start = await lessonService.start(detail.node.id);
        if (disposed) return;

        index = 0;
        answeredCount = 0;
        summary = null;
        renderGame();
      } catch (error) {
        if (disposed) return;
        fail(
          'Lesson gagal dimuat',
          error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat lesson.',
          load,
        );
      }
    })();
  };

  const renderGame = () => {
    if (!start || disposed) return;

    const progressBar = el('span', { class: 'play-progress__bar' });
    const progress = el(
      'div',
      {
        class: 'play-progress',
        attrs: {
          role: 'progressbar',
          'aria-label': 'Progres lesson',
          'aria-valuemin': '0',
          'aria-valuemax': String(start.questions.length),
          'aria-valuenow': String(answeredCount),
        },
      },
      [progressBar],
    );
    const counter = el('span', {
      class: 'play-counter',
      text: `${Math.min(index + 1, start.questions.length)}/${start.questions.length}`,
    });

    const body = el('div', { class: 'play-body' });
    const footer = el('div', { class: 'play-footer' });
    const live = el('div', {
      class: 'play-feedback-slot',
      attrs: { 'aria-live': 'polite' },
    });

    const shell = el('div', { class: 'play-shell' }, [
      el('header', { class: 'play-top' }, [
        el(
          'a',
          {
            class: 'play-exit',
            attrs: { href: backHref, 'aria-label': 'Keluar dari lesson' },
          },
          [icon('close', 20), el('span', { text: 'Keluar' })],
        ),
        el('div', { class: 'play-top__center' }, [
          el('p', { class: 'play-top__eyebrow', text: start.lesson.title }),
          progress,
        ]),
        counter,
      ]),
      el('main', { class: 'play-main' }, [body, live]),
      footer,
    ]);

    ctx.outlet.replaceChildren(shell);
    setProgress(progressBar, progress, answeredCount, start.questions.length);

    const question = start.questions[index]!;
    const supported = isMiniGameSupported(question.type);
    let view: MiniGameView | null = null;

    const instruction = el('p', {
      class: 'play-instruction',
      text: question.instruction || 'Jawab pertanyaan berikut.',
    });
    const prompt = el('h1', { class: 'play-prompt', text: question.prompt });
    const topic = question.topic
      ? el('span', { class: 'topic-chip', text: question.topic })
      : null;

    const answerArea = el('div', { class: 'play-answer' });
    const checkButton = el('button', {
      class: 'btn btn--block btn--lg',
      attrs: { type: 'button', disabled: true },
    });
    checkButton.append(icon('check', 20), document.createTextNode('Periksa jawaban'));

    const setCheckEnabled = (ready: boolean) => {
      checkButton.disabled = !ready || busy;
    };

    view = createMiniGame(question, (ready) => {
      if (!busy) setCheckEnabled(ready);
    });
    answerArea.append(view.answer);

    const submitOnEnter = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || checkButton.disabled) return;
      if (!(event.target instanceof HTMLInputElement)) return;
      event.preventDefault();
      checkButton.click();
    };
    answerArea.addEventListener('keydown', submitOnEnter);
    // Fill in the Blank renders its input inside the prompt, not the answer area.
    view.prompt?.addEventListener('keydown', submitOnEnter);

    const hint = question.hint
      ? (() => {
          const hintText = el('p', { class: 'play-hint__text', text: question.hint });
          hintText.hidden = true;
          const button = el('button', {
            class: 'play-hint__button',
            attrs: { type: 'button' },
          }, [icon('info', 16), 'Lihat petunjuk']);
          button.addEventListener('click', () => {
            hintText.hidden = !hintText.hidden;
            button.lastChild!.textContent = hintText.hidden ? 'Lihat petunjuk' : 'Sembunyikan petunjuk';
          });
          return el('div', { class: 'play-hint' }, [button, hintText]);
        })()
      : null;

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

    const submit = (answer: LessonAnswer) => {
      if (busy || !start || disposed) return;
      busy = true;
      checkButton.disabled = true;
      view?.setDisabled(true);
      checkButton.replaceChildren(
        el('span', { class: 'btn__spinner' }),
        document.createTextNode('Memeriksa…'),
      );
      live.replaceChildren();

      void (async () => {
        try {
          const result = await lessonService.answer(start!.attemptId, question.id, answer);
          if (disposed) return;
          busy = false;
          answeredCount = result.answeredCount;
          setProgress(progressBar, progress, answeredCount, start!.questions.length);
          showFeedback(result, view!, live, footer, progressBar, progress);
        } catch (error) {
          if (disposed) return;
          busy = false;
          view?.setDisabled(false);
          checkButton.replaceChildren(
            icon('check', 20),
            document.createTextNode('Periksa jawaban'),
          );
          setCheckEnabled(Boolean(view?.getAnswer()));
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
      const answer = view?.getAnswer();
      if (answer) submit(answer);
    });

    footer.append(checkButton);

    if (!supported) {
      const skip = el('button', { class: 'btn btn--ghost btn--block', attrs: { type: 'button' } }, [
        'Lewati soal ini',
      ]);
      skip.addEventListener('click', () => submit({ text: '' }));
      footer.append(skip);
    }

    // Focus the first interactive control for keyboard players.
    window.setTimeout(() => view?.focus(), 30);
  };

  const showFeedback = (
    result: AnswerResult,
    view: MiniGameView,
    live: HTMLElement,
    footer: HTMLElement,
    progressBar: HTMLElement,
    progress: HTMLElement,
  ) => {
    if (!start) return;

    view.setDisabled(true);
    view.markResult?.(result.isCorrect, result.correctAnswer);

    const feedback = el(
      'div',
      { class: `play-feedback ${result.isCorrect ? 'play-feedback--correct' : 'play-feedback--wrong'}` },
      [
        el('div', { class: 'play-feedback__head' }, [
          el('span', { class: 'play-feedback__icon' }, [
            icon(result.isCorrect ? 'check' : 'alert', 20),
          ]),
          el('div', {}, [
            el('p', {
              class: 'play-feedback__title',
              text: result.isCorrect
                ? result.pointsAwarded > 0
                  ? `Benar! +${result.pointsAwarded} poin`
                  : 'Benar!'
                : 'Belum tepat',
            }),
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
      ],
    );
    live.replaceChildren(feedback);

    footer.replaceChildren();
    const isLast = index + 1 >= start.questions.length;
    const next = el(
      'button',
      { class: 'btn btn--block btn--lg', attrs: { type: 'button' } },
      [isLast ? 'Lihat hasil' : 'Lanjut', icon('arrow-right', 18)],
    );
    next.addEventListener('click', () => {
      if (!start || busy) return;
      if (isLast) {
        void finish(progressBar, progress);
        return;
      }
      index += 1;
      renderGame();
    });
    footer.append(next);
    next.focus({ preventScroll: true });

    if (result.isCorrect) {
      progressBar.classList.add('play-progress__bar--correct');
    }
  };

  const finish = async (progressBar: HTMLElement, progress: HTMLElement) => {
    if (!start || busy || disposed) return;
    busy = true;
    setProgress(progressBar, progress, start.questions.length, start.questions.length);
    ctx.outlet.replaceChildren(
      el('div', { class: 'play-loading' }, [
        el('span', { class: 'spinner' }),
        el('p', { text: 'Menghitung hasil dan menyimpan progres…' }),
      ]),
    );

    try {
      summary = await lessonService.complete(start.attemptId);
      if (disposed) return;
      renderResult();
    } catch (error) {
      if (disposed) return;
      busy = false;
      fail(
        'Hasil lesson gagal disimpan',
        error instanceof Error ? error.message : 'Periksa koneksi lalu coba lagi.',
        load,
      );
    }
  };

  const renderResult = () => {
    if (!start || !summary || disposed) return;
    const passed = summary.passed;

    const stats = [
      ['Akurasi', `${summary.accuracy}%`],
      ['Jawaban benar', `${summary.correctCount}/${summary.totalCount}`],
      ['Durasi', formatDuration(summary.durationSeconds)],
      ['Poin', `${summary.score}/${summary.maxScore}`],
    ] as const;

    const rewards =
      summary.xpAwarded > 0 || summary.coinsAwarded > 0
        ? el('div', { class: 'play-rewards' }, [
            summary.xpAwarded > 0
              ? el('div', { class: 'play-reward' }, [
                  icon('sparkles', 20),
                  el('span', { class: 'play-reward__value', text: `+${summary.xpAwarded}` }),
                  el('span', { class: 'play-reward__label', text: 'XP' }),
                ])
              : null,
            summary.coinsAwarded > 0
              ? el('div', { class: 'play-reward' }, [
                  icon('coin', 20),
                  el('span', { class: 'play-reward__value', text: `+${summary.coinsAwarded}` }),
                  el('span', { class: 'play-reward__label', text: 'Koin' }),
                ])
              : null,
          ])
        : null;

    const note = summary.alreadyCompleted
      ? 'Sesi ini sudah pernah diselesaikan. Hadiah tidak diberikan dua kali.'
      : !passed
        ? 'Kamu perlu akurasi minimal 60% untuk menyelesaikan lesson. Coba lagi — progres percobaan tetap tercatat.'
        : summary.xpAwarded === 0
          ? 'Lesson ini sudah pernah diselesaikan sebelumnya, jadi hadiah tambahan tidak diberikan.'
          : null;

    const retry = el('button', { class: 'btn btn--secondary', attrs: { type: 'button' } }, [
      icon('refresh', 18),
      passed ? 'Main lagi' : 'Coba lagi',
    ]);
    retry.addEventListener('click', () => window.location.reload());

    const screen = el('div', { class: 'play-result-shell' }, [
      el('div', { class: 'play-result', dataset: { passed: String(passed) } }, [
        el('div', { class: 'play-result__art', html: kikoMarkup(150) }),
        el('span', { class: `play-result__badge ${passed ? '' : 'play-result__badge--retry'}` }, [
          icon(passed ? 'check' : 'refresh', 18),
          passed ? 'Lesson selesai' : 'Belum lulus',
        ]),
        el('h1', { class: 'play-result__title', text: passed ? 'Kerja bagus!' : 'Hampir sampai!' }),
        el('p', {
          class: 'play-result__lead',
          text: passed
            ? start.lesson.description || 'Progres lesson ini sudah tersimpan di akunmu.'
            : 'Tidak apa-apa. Setiap percobaan memperkuat ingatanmu.',
        }),
        el('div', { class: 'play-result__stats' }, [
          ...stats.map(([label, value]) =>
            el('div', { class: 'stat' }, [
              el('span', { class: 'stat__value', text: value }),
              el('span', { class: 'stat__label', text: label }),
            ]),
          ),
        ]),
        rewards,
        note ? el('p', { class: 'play-result__note', text: note }) : null,
        el('div', { class: 'play-result__actions' }, [
          el('a', { class: 'btn btn--block', attrs: { href: pathHref } }, [
            icon('map', 18),
            'Kembali ke peta belajar',
          ]),
          retry,
        ]),
      ]),
    ]);

    ctx.outlet.replaceChildren(screen);
  };

  load();
}

function setProgress(
  bar: HTMLElement,
  progress: HTMLElement,
  value: number,
  total: number,
): void {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  bar.style.width = `${percent}%`;
  progress.setAttribute('aria-valuenow', String(value));
  progress.setAttribute('aria-valuetext', `${value} dari ${total} soal`);
}

export { meta };
