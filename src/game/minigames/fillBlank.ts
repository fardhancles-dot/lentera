import { el } from '../../utils/dom';
import type { MiniGameProps, MiniGameView } from './types';

export function createFillBlank({ question, onChange }: MiniGameProps): MiniGameView {
  // Existing seed content uses both "__" and "___" as the blank marker.
  const parts = question.prompt.split(/_{2,}/);
  const hasInlineBlank = parts.length === 2;

  const input = el('input', {
    class: hasInlineBlank ? 'play-blank-input' : 'play-input',
    attrs: {
      type: 'text',
      inputmode: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      placeholder: hasInlineBlank ? 'isi rumpang' : 'Tulis jawabanmu…',
      'aria-label': 'Isi bagian rumpang',
    },
  });

  input.addEventListener('input', () => onChange(input.value.trim().length > 0));

  const prompt = hasInlineBlank
    ? el('div', { class: 'play-prompt play-blank-prompt' }, [
        parts[0]!,
        input,
        parts[1]!,
      ])
    : undefined;

  const answer = hasInlineBlank
    ? el('p', {
        class: 'play-mini-note',
        text: 'Isi bagian kosong pada kalimat di atas, lalu periksa jawaban.',
      })
    : el('div', { class: 'play-blank-fallback' }, [input]);

  return {
    prompt,
    answer,
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
