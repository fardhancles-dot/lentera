import { el } from '../../utils/dom';
import type { MiniGameProps, MiniGameView } from './types';

export function createTyping({ question, onChange }: MiniGameProps): MiniGameView {
  const input = el('input', {
    class: 'play-input',
    attrs: {
      type: 'text',
      inputmode: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      placeholder: 'Tulis jawabanmu…',
      'aria-label': 'Jawaban',
    },
  });

  input.addEventListener('input', () => onChange(input.value.trim().length > 0));

  if (question.instruction) {
    input.setAttribute('aria-description', question.instruction);
  }

  return {
    answer: input,
    getAnswer: () => (input.value.trim() ? { text: input.value } : null),
    focus: () => input.focus({ preventScroll: true }),
    setDisabled: (value) => {
      input.disabled = value;
    },
    markResult: (isCorrect) => {
      input.classList.add(isCorrect ? 'play-input--correct' : 'play-input--wrong');
    },
  };
}
