import { el } from '../../utils/dom';
import { joinBlankAnswers, parseBlankPrompt } from './blankPrompt';
import type { MiniGameProps, MiniGameView } from './types';

export function createFillBlank({ question, onChange }: MiniGameProps): MiniGameView {
  // Existing seed content uses both "__" and "___" as the blank marker.
  const { parts, blankCount, inline: hasInlineBlanks } = parseBlankPrompt(question.prompt);

  const inputs = Array.from({ length: Math.max(1, blankCount) }, (_, index) =>
    el('input', {
      class: hasInlineBlanks ? 'play-blank-input' : 'play-input',
      attrs: {
        type: 'text',
        inputmode: 'text',
        autocomplete: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
        placeholder: hasInlineBlanks ? `rumpang ${index + 1}` : 'Tulis jawabanmu…',
        'aria-label':
          blankCount > 1 ? `Isi rumpang ke-${index + 1}` : 'Isi bagian rumpang',
      },
    }),
  );

  const ready = () => inputs.every((input) => input.value.trim().length > 0);
  for (const input of inputs) {
    input.addEventListener('input', () => onChange(ready()));
  }

  const prompt = hasInlineBlanks
    ? el('div', { class: 'play-prompt play-blank-prompt' }, [
        ...parts.flatMap((part, index) => {
          const nodes: Array<Node | string> = [part];
          const input = inputs[index];
          if (input) nodes.push(input);
          return nodes;
        }),
      ])
    : undefined;

  const answer = hasInlineBlanks
    ? el('p', {
        class: 'play-mini-note',
        text:
          blankCount > 1
            ? `Isi ${blankCount} bagian kosong pada kalimat di atas, lalu periksa jawaban.`
            : 'Isi bagian kosong pada kalimat di atas, lalu periksa jawaban.',
      })
    : el('div', { class: 'play-blank-fallback' }, [inputs[0]!]);

  return {
    prompt,
    answer,
    getAnswer: () => {
      const text = joinBlankAnswers(inputs.map((input) => input.value));
      return text ? { text } : null;
    },
    focus: () => inputs[0]?.focus({ preventScroll: true }),
    setDisabled: (value) => {
      for (const input of inputs) input.disabled = value;
    },
    markResult: (isCorrect) => {
      for (const input of inputs) {
        input.classList.add(isCorrect ? 'play-input--correct' : 'play-input--wrong');
      }
    },
  };
}
