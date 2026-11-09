import { el } from '../../utils/dom';
import { seededShuffle } from './shuffle';
import type { MiniGameProps, MiniGameView } from './types';

export function createWordBank({ question, onChange }: MiniGameProps): MiniGameView {
  const tokens = seededShuffle(question.options, `${question.id}:word-bank`);
  const selected: string[] = [];
  const buttons = new Map<string, HTMLButtonElement>();
  let disabled = false;

  const bank = el('div', {
    class: 'play-bank',
    attrs: { role: 'group', 'aria-label': 'Kata yang tersedia' },
  });
  const strip = el('div', {
    class: 'play-strip',
    attrs: { 'aria-live': 'polite', 'aria-label': 'Jawaban yang disusun' },
  });
  const reset = el('button', { class: 'play-reset', attrs: { type: 'button' } }, ['Hapus semua']);

  const tokenLabel = (id: string) => question.options.find((option) => option.id === id)?.label ?? '';

  const render = () => {
    bank.replaceChildren();
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
        onChange(true);
      });
      buttons.set(token.id, button);
      bank.append(button);
    }

    strip.replaceChildren();
    if (selected.length === 0) {
      strip.append(
        el('span', {
          class: 'play-strip__placeholder',
          text: 'Ketuk kata untuk menyusun jawaban.',
        }),
      );
    } else {
      for (const id of selected) {
        const label = tokenLabel(id);
        const chip = el(
          'button',
          {
            class: 'play-chip',
            attrs: { type: 'button', 'aria-label': `Hapus kata ${label}` },
          },
          [label, el('span', { class: 'play-chip__remove', text: '×' })],
        );
        chip.disabled = disabled;
        chip.addEventListener('click', () => {
          if (disabled) return;
          const index = selected.indexOf(id);
          if (index >= 0) selected.splice(index, 1);
          render();
          onChange(selected.length > 0);
        });
        strip.append(chip);
      }
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
      el('p', { class: 'play-mini-label', text: 'Kata tersedia' }),
      bank,
      el('p', { class: 'play-mini-label', text: 'Jawabanmu' }),
      strip,
      el('div', { class: 'play-reset-row' }, [reset]),
    ]),
    getAnswer: () =>
      selected.length > 0 ? { text: selected.map(tokenLabel).join(' ') } : null,
    focus: () => buttons.get(tokens[0]?.id ?? '')?.focus({ preventScroll: true }),
    setDisabled: (value) => {
      disabled = value;
      render();
    },
    markResult: (isCorrect) => {
      strip.classList.add(isCorrect ? 'play-strip--correct' : 'play-strip--wrong');
    },
  };
}
