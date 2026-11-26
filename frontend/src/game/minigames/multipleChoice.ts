import { el } from '../../utils/dom';
import type { MiniGameProps, MiniGameView } from './types';

function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function createMultipleChoice({ question, onChange }: MiniGameProps): MiniGameView {
  const group = el('div', {
    class: 'play-options',
    attrs: { role: 'group', 'aria-label': 'Pilihan jawaban' },
  });
  const buttons: HTMLButtonElement[] = [];
  let selectedId: string | null = null;
  let disabled = false;

  for (const [index, option] of question.options.entries()) {
    const button = el('button', {
      class: 'play-option',
      attrs: { type: 'button', 'aria-pressed': 'false' },
    });
    button.append(
      el('span', { class: 'play-option__letter', text: optionLetter(index) }),
      el('span', { class: 'play-option__label', text: option.label }),
    );

    button.addEventListener('click', () => {
      if (disabled) return;
      selectedId = option.id;
      for (const item of buttons) {
        const pressed = item === button;
        item.setAttribute('aria-pressed', String(pressed));
        item.classList.toggle('play-option--selected', pressed);
      }
      onChange(true);
    });

    buttons.push(button);
    group.append(button);
  }

  if (question.options.length === 0) {
    group.append(
      el('p', { class: 'small muted', text: 'Pilihan jawaban belum tersedia untuk soal ini.' }),
    );
  }

  return {
    answer: group,
    getAnswer: () => (selectedId ? { optionId: selectedId } : null),
    focus: () => buttons[0]?.focus({ preventScroll: true }),
    setDisabled: (value) => {
      disabled = value;
      for (const button of buttons) button.disabled = value;
    },
    markResult: (isCorrect, correctAnswer) => {
      for (const button of buttons) {
        const label = button.querySelector('.play-option__label')?.textContent ?? '';
        if (button.getAttribute('aria-pressed') === 'true') {
          button.classList.add(isCorrect ? 'play-option--correct' : 'play-option--wrong');
        }
        if (!isCorrect && label === correctAnswer) {
          button.classList.add('play-option--correct');
        }
      }
    },
  };
}
