import { el } from '../../utils/dom';
import { seededShuffle } from './shuffle';
import type { MiniGameProps, MiniGameView } from './types';

export function createSentenceBuilder({ question, onChange }: MiniGameProps): MiniGameView {
  const tokens = seededShuffle(question.options, `${question.id}:sentence-builder`);
  const selected: string[] = [];
  const trayButtons = new Map<string, HTMLButtonElement>();
  let disabled = false;

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

  const tokenLabel = (id: string) => question.options.find((option) => option.id === id)?.label ?? '';
  const complete = () => selected.length === tokens.length && tokens.length > 0;

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
        remove.addEventListener('click', () => {
          if (disabled) return;
          const current = selected.indexOf(id);
          if (current >= 0) selected.splice(current, 1);
          render();
          onChange(false);
        });

        strip.append(
          el('span', { class: 'play-chip play-chip--builder' }, [
            left,
            el('span', { class: 'play-chip__label', text: label }),
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
      el('p', { class: 'play-mini-label', text: 'Kata acak' }),
      tray,
      el('p', { class: 'play-mini-label', text: 'Susunanmu' }),
      strip,
      el('div', { class: 'play-reset-row' }, [reset]),
    ]),
    getAnswer: () =>
      complete() ? { text: selected.map(tokenLabel).join(' ') } : null,
    focus: () => trayButtons.get(tokens[0]?.id ?? '')?.focus({ preventScroll: true }),
    setDisabled: (value) => {
      disabled = value;
      render();
    },
    markResult: (isCorrect) => {
      strip.classList.add(isCorrect ? 'play-strip--correct' : 'play-strip--wrong');
    },
  };
}
