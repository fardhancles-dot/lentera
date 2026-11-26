import { el } from '../../utils/dom';
import { joinSentenceTokens } from '../../utils/questionText';
import { seededShuffle } from './shuffle';
import type { MiniGameProps, MiniGameView } from './types';

type QuestionOption = MiniGameProps['question']['options'][number];

/**
 * Older one-word questions stored each letter as its own option. Those rows
 * still have to play as one whole word, so the leading run of one-character
 * options (saved in letter order, before any whole-word distractors) is merged
 * back into a single card.
 */
export function mergeLegacyLetters(options: QuestionOption[]): QuestionOption[] {
  let end = 0;
  const letters: string[] = [];
  while (end < options.length) {
    const label = options[end]!.label.trim();
    if (Array.from(label).length !== 1) break;
    letters.push(label);
    end += 1;
  }
  if (letters.length < 2) return options;
  return [
    { id: `${options[0]!.id}:word`, label: letters.join('') },
    ...options.slice(end),
  ];
}

/**
 * Text sent to the server for grading. Labels are read from the cards the
 * player actually sees, never from question.options directly, so a card that
 * was rebuilt from legacy letter tokens still submits its whole word.
 */
export function sentenceBuilderAnswer(
  selected: readonly string[],
  tokens: readonly QuestionOption[],
): string {
  const labels = new Map(tokens.map((token) => [token.id, token.label]));
  return joinSentenceTokens(selected.map((id) => labels.get(id) ?? ''));
}

export function createSentenceBuilder({ question, onChange }: MiniGameProps): MiniGameView {
  // Empty labels would render invisible buttons; duplicates stay distinct
  // because every token keeps its own option id. Every card is one whole word.
  const available = question.options.filter((option) => option.label.trim().length > 0);
  const tokens = seededShuffle(
    question.scene.tokenMode === 'letters' ? mergeLegacyLetters(available) : available,
    `${question.id}:sentence-builder`,
  );
  const selected: string[] = [];
  const trayButtons = new Map<string, HTMLButtonElement>();
  let disabled = false;

  const audioMedia = question.media.find((media) => media.kind === 'audio' && media.url);
  const audio = audioMedia
    ? el('audio', {
        class: 'play-question-audio__player',
        attrs: { src: audioMedia.url, controls: true, preload: 'metadata' },
      })
    : null;
  const audioPanel = audio
    ? el('div', { class: 'play-question-audio' }, [
        el('p', { class: 'play-mini-label', text: 'Audio soal' }),
        audio,
      ])
    : null;

  const tray = el('div', {
    class: 'play-bank',
    attrs: { role: 'group', 'aria-label': 'Kata acak' },
  });
  const strip = el('div', {
    class: 'play-strip play-strip--builder',
    attrs: { 'aria-label': 'Susunan kalimat' },
  });
  const reset = el('button', { class: 'play-reset', attrs: { type: 'button' } }, [
    'Susun ulang',
  ]);

  // Every rendered card is identified by its own option id, and the label is
  // read from the same card list the tray shows. Keeping one source avoids a
  // card looking selected while its word never reaches "Susunanmu".
  const labels = new Map(tokens.map((token) => [token.id, token.label]));
  const tokenLabel = (id: string) => labels.get(id) ?? '';
  // Extra distractor words are allowed in the tray, so the answer is ready as
  // soon as the player arranges something instead of needing every token.
  const complete = () => selected.length > 0;

  const removeToken = (id: string) => {
    if (disabled) return;
    const index = selected.indexOf(id);
    if (index < 0) return;
    selected.splice(index, 1);
    render();
    // The remaining words may still form a checkable answer.
    onChange(complete());
  };

  const move = (id: string, direction: -1 | 1) => {
    if (disabled) return;
    const index = selected.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= selected.length) return;
    const value = selected[index]!;
    selected[index] = selected[target]!;
    selected[target] = value;
    render();
  };

  const render = () => {
    tray.replaceChildren();
    if (tokens.length === 0) {
      tray.append(
        el('p', { class: 'play-mini-note', text: 'Kata acak belum tersedia untuk soal ini.' }),
      );
    }
    for (const token of tokens) {
      const used = selected.includes(token.id);
      const button = el(
        'button',
        {
          class: `play-token${used ? ' play-token--used' : ''}`,
          attrs: { type: 'button', 'aria-pressed': String(used) },
        },
        [token.label],
      );
      button.disabled = disabled || used;
      button.addEventListener('click', () => {
        if (disabled) return;
        selected.push(token.id);
        render();
        onChange(complete());
      });
      trayButtons.set(token.id, button);
      tray.append(button);
    }

    strip.replaceChildren();
    if (selected.length === 0) {
      strip.append(
        el('span', {
          class: 'play-strip__placeholder',
          text: 'Ketuk kata untuk mulai menyusun kalimat.',
        }),
      );
    } else {
      selected.forEach((id, index) => {
        const label = tokenLabel(id);
        const left = el(
          'button',
          {
            class: 'play-chip__move',
            attrs: { type: 'button', 'aria-label': `Geser ${label} ke kiri` },
          },
          ['‹'],
        );
        const right = el(
          'button',
          {
            class: 'play-chip__move',
            attrs: { type: 'button', 'aria-label': `Geser ${label} ke kanan` },
          },
          ['›'],
        );
        const remove = el(
          'button',
          {
            class: 'play-chip__remove',
            attrs: { type: 'button', 'aria-label': `Kembalikan kata ${label}` },
          },
          ['×'],
        );

        left.disabled = disabled || index === 0;
        right.disabled = disabled || index === selected.length - 1;
        remove.disabled = disabled;

        left.addEventListener('click', () => move(id, -1));
        right.addEventListener('click', () => move(id, 1));
        remove.addEventListener('click', () => removeToken(id));

        const chipLabel = el('span', {
          class: 'play-chip__label',
          text: label,
        });
        // Tapping the arranged word also returns it to the tray.
        chipLabel.addEventListener('click', () => removeToken(id));

        strip.append(
          el('span', { class: 'play-chip play-chip--builder' }, [
            left,
            chipLabel,
            right,
            remove,
          ]),
        );
      });
    }

    reset.disabled = disabled || selected.length === 0;
  };

  reset.addEventListener('click', () => {
    if (disabled) return;
    selected.length = 0;
    render();
    onChange(false);
  });

  render();

  return {
    answer: el('div', { class: 'play-wordbank' }, [
      ...(audioPanel ? [audioPanel] : []),
      el('p', { class: 'play-mini-label', text: 'Kata acak' }),
      tray,
      el('p', { class: 'play-mini-label', text: 'Susunanmu' }),
      strip,
      el('div', { class: 'play-reset-row' }, [reset]),
    ]),
    getAnswer: () =>
      complete() ? { text: sentenceBuilderAnswer(selected, tokens) } : null,
    focus: () => trayButtons.get(tokens[0]?.id ?? '')?.focus({ preventScroll: true }),
    setDisabled: (value) => {
      disabled = value;
      if (value) audio?.pause();
      render();
    },
    markResult: (isCorrect) => {
      strip.classList.add(isCorrect ? 'play-strip--correct' : 'play-strip--wrong');
    },
  };
}
