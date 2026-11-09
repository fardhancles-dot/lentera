import { icon } from '../../components/icons';
import { el } from '../../utils/dom';
import { seededShuffle } from './shuffle';
import type { MiniGameProps, MiniGameView } from './types';

interface Match {
  leftId: string;
  rightId: string;
}

export function createMatchingPairs({ question, onChange }: MiniGameProps): MiniGameView {
  const leftItems = question.leftItems;
  const rightItems = seededShuffle(question.rightItems, `${question.id}:matching-right`);
  const pairs: Match[] = [];
  const leftButtons = new Map<string, HTMLButtonElement>();
  const rightButtons = new Map<string, HTMLButtonElement>();
  let selectedLeft: string | null = null;
  let selectedRight: string | null = null;
  let disabled = false;

  if (
    leftItems.length === 0 ||
    rightItems.length === 0 ||
    leftItems.length !== rightItems.length
  ) {
    return {
      answer: el('div', { class: 'banner banner--warning' }, [
        icon('info', 18),
        el('div', {}, [
          el('p', { class: 'banner__title', text: 'Pasangan belum tersedia' }),
          el('p', {
            class: 'banner__body',
            text: 'Soal ini belum memiliki data pasangan yang lengkap, jadi tidak dapat dinilai.',
          }),
        ]),
      ]),
      getAnswer: () => null,
      focus: () => undefined,
      setDisabled: () => undefined,
    };
  }

  const leftColumn = el('div', {
    class: 'play-pair-column',
    attrs: { role: 'group', 'aria-label': 'Kolom kiri' },
  });
  const rightColumn = el('div', {
    class: 'play-pair-column',
    attrs: { role: 'group', 'aria-label': 'Kolom kanan' },
  });
  const reset = el('button', { class: 'play-reset', attrs: { type: 'button' } }, [
    'Hapus semua pasangan',
  ]);

  const complete = () => pairs.length === leftItems.length && leftItems.length > 0;

  const removePair = (side: 'left' | 'right', id: string) => {
    const index = pairs.findIndex((pair) =>
      side === 'left' ? pair.leftId === id : pair.rightId === id,
    );
    if (index >= 0) pairs.splice(index, 1);
    selectedLeft = null;
    selectedRight = null;
  };

  const tryPair = () => {
    if (!selectedLeft || !selectedRight) return;
    pairs.push({ leftId: selectedLeft, rightId: selectedRight });
    selectedLeft = null;
    selectedRight = null;
  };

  const render = () => {
    leftColumn.replaceChildren();
    for (const item of leftItems) {
      const pair = pairs.find((entry) => entry.leftId === item.id);
      const selected = selectedLeft === item.id;
      const button = el(
        'button',
        {
          class: `play-pair${pair ? ' play-pair--paired' : ''}${
            selected ? ' play-pair--selected' : ''
          }`,
          attrs: { type: 'button', 'aria-pressed': String(selected) },
        },
        [
          el('span', { class: 'play-pair__label', text: item.label }),
          pair ? el('span', { class: 'play-pair__mark', text: '✓' }) : null,
        ],
      );
      button.disabled = disabled;
      button.addEventListener('click', () => {
        if (disabled) return;
        if (pair) {
          removePair('left', item.id);
          render();
          onChange(false);
          return;
        }
        selectedLeft = selected ? null : item.id;
        tryPair();
        render();
        onChange(complete());
      });
      leftButtons.set(item.id, button);
      leftColumn.append(button);
    }

    rightColumn.replaceChildren();
    for (const item of rightItems) {
      const pair = pairs.find((entry) => entry.rightId === item.id);
      const selected = selectedRight === item.id;
      const button = el(
        'button',
        {
          class: `play-pair${pair ? ' play-pair--paired' : ''}${
            selected ? ' play-pair--selected' : ''
          }`,
          attrs: { type: 'button', 'aria-pressed': String(selected) },
        },
        [
          el('span', { class: 'play-pair__label', text: item.label }),
          pair ? el('span', { class: 'play-pair__mark', text: '✓' }) : null,
        ],
      );
      button.disabled = disabled;
      button.addEventListener('click', () => {
        if (disabled) return;
        if (pair) {
          removePair('right', item.id);
          render();
          onChange(false);
          return;
        }
        selectedRight = selected ? null : item.id;
        tryPair();
        render();
        onChange(complete());
      });
      rightButtons.set(item.id, button);
      rightColumn.append(button);
    }

    reset.disabled = disabled || pairs.length === 0;
  };

  reset.addEventListener('click', () => {
    if (disabled) return;
    pairs.length = 0;
    selectedLeft = null;
    selectedRight = null;
    render();
    onChange(false);
  });

  render();

  return {
    answer: el('div', { class: 'play-matching' }, [
      el('div', { class: 'play-pairs' }, [leftColumn, rightColumn]),
      el('p', {
        class: 'play-mini-note',
        text: 'Ketuk satu item di setiap kolom. Ketuk pasangan yang sudah tersambung untuk membatalkannya.',
      }),
      el('div', { class: 'play-reset-row' }, [reset]),
    ]),
    getAnswer: () => (complete() ? { matches: pairs.map((pair) => ({ ...pair })) } : null),
    focus: () => leftButtons.values().next().value?.focus({ preventScroll: true }),
    setDisabled: (value) => {
      disabled = value;
      render();
    },
    markResult: (isCorrect) => {
      for (const button of [...leftButtons.values(), ...rightButtons.values()]) {
        if (button.classList.contains('play-pair--paired')) {
          button.classList.add(isCorrect ? 'play-pair--correct' : 'play-pair--wrong');
        }
      }
    },
  };
}
