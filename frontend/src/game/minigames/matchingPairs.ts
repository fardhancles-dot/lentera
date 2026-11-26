import { icon } from '../../components/icons';
import { el } from '../../utils/dom';
import { seededShuffle } from './shuffle';
import type { MiniGameProps, MiniGameView } from './types';

export function createMatchingPairs({ question, onChange }: MiniGameProps): MiniGameView {
  const leftItems = seededShuffle(
    question.leftItems,
    `${question.id}:matching-left`,
  );
  const rightItems = seededShuffle(
    question.rightItems,
    `${question.id}:matching-right`,
  );
  const rightIds = new Set(rightItems.map((item) => item.id));
  const pairMap = new Map<string, string>();
  for (const pair of question.pairs) {
    if (pair.leftId && pair.rightId && rightIds.has(pair.rightId)) {
      pairMap.set(pair.leftId, pair.rightId);
    }
  }

  const total = leftItems.length;
  const valid =
    total > 0 &&
    rightItems.length === total &&
    pairMap.size === total &&
    new Set(pairMap.values()).size === total &&
    leftItems.every((item) => pairMap.has(item.id));

  if (!valid) {
    return {
      answer: el('div', { class: 'banner banner--warning' }, [
        icon('info', 18),
        el('div', {}, [
          el('p', { class: 'banner__title', text: 'Pasangan belum tersedia' }),
          el('p', {
            class: 'banner__body',
            text: 'Soal ini belum memiliki peta pasangan yang lengkap, jadi belum dapat dimainkan.',
          }),
        ]),
      ]),
      getAnswer: () => null,
      focus: () => undefined,
      setDisabled: () => undefined,
    };
  }

  const solvedLeft = new Set<string>();
  const solvedRight = new Set<string>();
  const leftButtons = new Map<string, HTMLButtonElement>();
  const rightButtons = new Map<string, HTMLButtonElement>();
  let selectedLeft: string | null = null;
  let selectedRight: string | null = null;
  let wrongLeft: string | null = null;
  let wrongRight: string | null = null;
  let wrongTimer: number | null = null;
  let locked = false;
  let disabled = false;

  const instruction = el('p', {
    class: 'play-match-instruction',
    text: 'Ketuk pasangan yang cocok',
  });
  const progressLabel = el('span', {
    class: 'play-match-progress__label',
    attrs: { 'aria-live': 'polite' },
  });
  const progressBar = el('span', { class: 'play-match-progress__bar' });
  const progress = el(
    'div',
    {
      class: 'play-match-progress',
      attrs: {
        role: 'progressbar',
        'aria-label': 'Progres pasangan',
        'aria-valuemin': '0',
        'aria-valuemax': String(total),
        'aria-valuenow': '0',
      },
    },
    [progressBar],
  );
  const completion = el(
    'div',
    { class: 'play-matching__complete', attrs: { 'aria-live': 'polite' } },
    [
      el('span', { class: 'play-matching__complete-icon', text: '✓' }),
      el('div', {}, [
        el('strong', { text: 'Semua pasangan cocok!' }),
        el('span', { text: 'Kerja bagus. Tekan Periksa jawaban untuk melanjutkan.' }),
      ]),
    ],
  );
  completion.hidden = true;

  const grid = el('div', {
    class: 'play-pairs',
    attrs: { role: 'group', 'aria-label': 'Pasangan kata' },
  });

  const complete = () => total > 0 && solvedLeft.size === total;

  const clearWrong = (): void => {
    if (wrongTimer !== null) {
      window.clearTimeout(wrongTimer);
      wrongTimer = null;
    }
    wrongLeft = null;
    wrongRight = null;
    locked = false;
  };

  const renderCard = (
    side: 'left' | 'right',
    item: { id: string; label: string },
  ): HTMLButtonElement => {
    const solved = side === 'left' ? solvedLeft.has(item.id) : solvedRight.has(item.id);
    const selected =
      side === 'left' ? selectedLeft === item.id : selectedRight === item.id;
    const wrong =
      side === 'left' ? wrongLeft === item.id : wrongRight === item.id;
    const classes = ['play-pair'];
    if (solved) classes.push('play-pair--paired', 'play-pair--solved');
    if (selected && !solved) classes.push('play-pair--selected');
    if (wrong && !solved) classes.push('play-pair--wrong');

    const button = el(
      'button',
      {
        class: classes.join(' '),
        attrs: {
          type: 'button',
          'aria-pressed': String(selected || solved),
          'aria-label': `${side === 'left' ? 'Kiri' : 'Kanan'}: ${item.label}`,
        },
        dataset: {
          side,
          match: side === 'left' ? (pairMap.get(item.id) ?? '') : item.id,
        },
      },
      [
        el('span', { class: 'play-pair__label', text: item.label }),
        solved ? el('span', { class: 'play-pair__mark', text: '✓' }) : null,
      ],
    );
    button.disabled = disabled || locked || solved;
    button.addEventListener('click', () => choose(side, item.id));
    if (side === 'left') leftButtons.set(item.id, button);
    else rightButtons.set(item.id, button);
    return button;
  };

  const render = (): void => {
    const matched = solvedLeft.size;
    const percent = total > 0 ? Math.round((matched / total) * 100) : 0;
    progressBar.style.width = `${percent}%`;
    progress.setAttribute('aria-valuenow', String(matched));
    progress.setAttribute('aria-valuetext', `${matched} dari ${total} pasangan`);
    progressLabel.textContent = `${matched}/${total} pasangan`;
    completion.hidden = matched !== total;
    completion.classList.toggle('is-visible', matched === total);

    grid.replaceChildren();
    for (let index = 0; index < total; index += 1) {
      grid.append(renderCard('left', leftItems[index]!));
      grid.append(renderCard('right', rightItems[index]!));
    }
  };

  const scheduleWrongReset = (): void => {
    wrongTimer = window.setTimeout(() => {
      wrongTimer = null;
      wrongLeft = null;
      wrongRight = null;
      locked = false;
      render();
    }, 650);
  };

  const choose = (side: 'left' | 'right', id: string): void => {
    if (disabled || locked) return;
    const solved = side === 'left' ? solvedLeft.has(id) : solvedRight.has(id);
    if (solved) return;

    if (side === 'left') {
      if (selectedLeft === id) {
        selectedLeft = null;
        render();
        return;
      }
      selectedLeft = id;
    } else {
      if (selectedRight === id) {
        selectedRight = null;
        render();
        return;
      }
      selectedRight = id;
    }

    if (!selectedLeft || !selectedRight) {
      render();
      return;
    }

    const leftId = selectedLeft;
    const rightId = selectedRight;
    if (pairMap.get(leftId) === rightId) {
      solvedLeft.add(leftId);
      solvedRight.add(rightId);
      selectedLeft = null;
      selectedRight = null;
      clearWrong();
      render();
      onChange(complete());
      return;
    }

    wrongLeft = leftId;
    wrongRight = rightId;
    selectedLeft = null;
    selectedRight = null;
    locked = true;
    render();
    onChange(false);
    scheduleWrongReset();
  };

  render();
  onChange(false);

  return {
    answer: el('div', { class: 'play-matching' }, [
      el('div', { class: 'play-match-head' }, [
        el('div', { class: 'play-match-copy' }, [
          instruction,
          el('p', {
            class: 'play-mini-note',
            text: 'Pasangan yang benar akan hijau dan terkunci. Pasangan yang salah kembali normal.',
          }),
        ]),
        el('div', { class: 'play-match-progress-wrap' }, [progressLabel, progress]),
      ]),
      grid,
      completion,
    ]),
    getAnswer: () =>
      complete()
        ? {
            matches: leftItems
              .filter((item) => solvedLeft.has(item.id))
              .map((item) => ({
                leftId: item.id,
                rightId: pairMap.get(item.id)!,
              })),
          }
        : null,
    focus: () => {
      const firstLeft = leftItems.find((item) => !solvedLeft.has(item.id));
      const firstRight = rightItems.find((item) => !solvedRight.has(item.id));
      (firstLeft ? leftButtons.get(firstLeft.id) : firstRight ? rightButtons.get(firstRight.id) : undefined)
        ?.focus({ preventScroll: true });
    },
    setDisabled: (value) => {
      disabled = value;
      clearWrong();
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
