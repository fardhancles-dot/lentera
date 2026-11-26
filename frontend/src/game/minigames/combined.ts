import { el } from '../../utils/dom';
import { countPromptBlanks } from '../../utils/combinedQuestion';
import { parseBlankPrompt } from './blankPrompt';
import { createMatchingPairs } from './matchingPairs';
import { createMultipleChoice } from './multipleChoice';
import { createSentenceBuilder } from './sentenceBuilder';
import { createSpeaking } from './speaking';
import { createTranslation } from './translation';
import { seededShuffle } from './shuffle';
import type { MiniGameProps, MiniGameView } from './types';

/**
 * Soal Kombinasi: one question, several mechanisms in one card.
 *
 * The content elements (story, conversation, image, audio, text, hint) are
 * rendered above the question text, and exactly one answer interaction is
 * built from `config.answer.mode`. Word ordering and pair matching reuse the
 * existing Susun Kalimat and Mencocokkan Pasangan renderers instead of a
 * second implementation.
 */
export function createCombined({ question, onChange }: MiniGameProps): MiniGameView {
  const config = question.combined;
  const mode = config.answer.mode;
  const blankCount = countPromptBlanks(question.prompt);
  const partCount = Math.max(1, blankCount);

  const images = question.media.filter((media) => media.kind === 'image' && media.url);
  const audios = question.media.filter((media) => media.kind === 'audio' && media.url);
  const videos = question.media.filter((media) => media.kind === 'video' && media.url);
  let imageCursor = 0;
  let audioCursor = 0;

  const imageNode = (index: number): HTMLElement => {
    const media = images[index]!;
    return el('img', {
      class: 'play-media',
      attrs: { src: media.url, alt: media.alt || 'Ilustrasi soal' },
    });
  };
  const audioNode = (index: number): HTMLElement => {
    const media = audios[index]!;
    return el('div', { class: 'play-question-audio' }, [
      el('p', { class: 'play-mini-label', text: media.alt || 'Audio soal' }),
      el('audio', {
        class: 'play-question-audio__player',
        attrs: { src: media.url, controls: true, preload: 'metadata' },
      }),
    ]);
  };

  const content = el('div', { class: 'play-combined__content' });
  for (const element of config.elements) {
    if (element.kind === 'text' && element.text) {
      content.append(el('p', { class: 'play-combined__text', text: element.text }));
    } else if (element.kind === 'hint' && element.text) {
      content.append(el('p', { class: 'play-combined__hint', text: element.text }));
    } else if (element.kind === 'story') {
      const block = el('div', { class: 'play-combined__story' });
      if (element.title) block.append(el('p', { class: 'play-mini-label', text: element.title }));
      for (const paragraph of (element.body ?? '').split(/\n{2,}/).filter(Boolean)) {
        block.append(el('p', { text: paragraph }));
      }
      content.append(block);
    } else if (element.kind === 'conversation') {
      const block = el('div', { class: 'play-combined__dialog' });
      for (const line of element.lines ?? []) {
        block.append(
          el('p', {}, [el('strong', { text: `${line.speaker}: ` }), line.line]),
        );
      }
      content.append(block);
    } else if (element.kind === 'image') {
      if (imageCursor < images.length) content.append(imageNode(imageCursor++));
    } else if (element.kind === 'audio') {
      if (audioCursor < audios.length) content.append(audioNode(audioCursor++));
    }
  }
  // Media that no element points at still belongs to the question, so it is
  // appended instead of silently disappearing.
  while (imageCursor < images.length) content.append(imageNode(imageCursor++));
  while (audioCursor < audios.length) content.append(audioNode(audioCursor++));
  for (const video of videos) {
    content.append(
      el('video', {
        class: 'play-media',
        attrs: { src: video.url, controls: true, preload: 'metadata' },
      }),
    );
  }

  const prompt = el('h1', { class: 'play-prompt play-combined__prompt' });
  const slots: HTMLElement[] = [];
  const blankPrompt = parseBlankPrompt(question.prompt);
  blankPrompt.parts.forEach((part, index) => {
    if (part) prompt.append(document.createTextNode(part));
    if (index < blankPrompt.blankCount) {
      const slot = el('span', {
        class: 'play-combined__slot',
        attrs: { 'aria-label': `Rumpang ${index + 1}` },
        text: '______',
      });
      slots.push(slot);
      prompt.append(slot);
    }
  });

  const notes = el('div', { class: 'play-combined__notes' });
  const answerBox = el('div', { class: 'play-combined__answer' });

  const setSlotLabel = (index: number, label: string): void => {
    const slot = slots[index];
    if (slot) slot.textContent = label;
  };

  if (mode === 'choice' && config.answer.display === 'bank') {
    const tokens = seededShuffle(
      question.options.filter((option) => option.label.trim().length > 0),
      `${question.id}:combined-bank`,
    );
    const buttons = new Map<string, HTMLButtonElement>();
    let selectedId: string | null = null;
    let disabled = false;

    const bank = el('div', {
      class: 'play-bank',
      attrs: { role: 'group', 'aria-label': 'Kata yang tersedia' },
    });
    const strip = el('div', {
      class: 'play-strip',
      attrs: { 'aria-live': 'polite', 'aria-label': 'Jawaban yang dipilih' },
    });

    const render = (): void => {
      bank.replaceChildren();
      if (tokens.length === 0) {
        bank.append(
          el('p', { class: 'play-mini-note', text: 'Pilihan kata belum diisi untuk soal ini.' }),
        );
      }
      for (const token of tokens) {
        const selected = selectedId === token.id;
        const button = el(
          'button',
          {
            class: `play-token${selected ? ' play-token--selected' : ''}`,
            attrs: { type: 'button', 'aria-pressed': String(selected) },
          },
          [token.label],
        );
        button.disabled = disabled;
        button.addEventListener('click', () => {
          if (disabled) return;
          selectedId = token.id;
          setSlotLabel(0, token.label);
          render();
          onChange(true);
        });
        buttons.set(token.id, button);
        bank.append(button);
      }

      strip.replaceChildren();
      if (selectedId === null) {
        strip.append(
          el('span', {
            class: 'play-strip__placeholder',
            text: 'Ketuk kata untuk mengisi bagian kosong.',
          }),
        );
      } else {
        const label = question.options.find((option) => option.id === selectedId)?.label ?? '';
        strip.append(el('span', { class: 'play-chip__label', text: label }));
      }
    };

    render();

    notes.append(
      el('p', { class: 'play-mini-label', text: 'Pilihan kata' }),
      bank,
      strip,
    );

    answerBox.append(
      el('p', {
        class: 'play-mini-note',
        text: 'Pilih satu kata, lalu tekan Periksa jawaban.',
      }),
    );

    return {
      prompt: el('div', { class: 'play-combined' }, [content, prompt, notes]),
      answer: answerBox,
      ownsMedia: true,
      getAnswer: () => (selectedId ? { optionId: selectedId } : null),
      focus: () => buttons.get(tokens[0]?.id ?? '')?.focus({ preventScroll: true }),
      setDisabled: (value) => {
        disabled = value;
        render();
      },
      markResult: (isCorrect) => {
        strip.classList.add(isCorrect ? 'play-strip--correct' : 'play-strip--wrong');
        for (const [id, button] of buttons) {
          if (id === selectedId) {
            button.classList.add(isCorrect ? 'play-token--correct' : 'play-token--wrong');
          }
        }
      },
    };
  }

  if (mode === 'choice') {
    const inner = createMultipleChoice({ question: { ...question, media: [] }, onChange });
    answerBox.append(inner.answer);
    return {
      prompt: el('div', { class: 'play-combined' }, [content, prompt, notes]),
      answer: answerBox,
      ownsMedia: true,
      getAnswer: inner.getAnswer,
      focus: inner.focus,
      setDisabled: (value) => {
        inner.setDisabled(value);
        for (const input of answerBox.querySelectorAll('button')) input.disabled = value;
      },
      markResult: inner.markResult,
    };
  }

  if (mode === 'text') {
    const inputs: HTMLInputElement[] = [];
    const extra = el('div', { class: 'play-combined__parts' });
    const ready = (): boolean => inputs.every((input) => input.value.trim().length > 0);
    for (let index = 0; index < partCount; index += 1) {
      const input = el('input', {
        class: blankPrompt.inline ? 'play-blank-input' : 'play-input',
        attrs: {
          type: 'text',
          inputmode: 'text',
          autocomplete: 'off',
          autocapitalize: 'off',
          spellcheck: 'false',
          placeholder: `rumpang ${index + 1}`,
          'aria-label': `Isi rumpang ke-${index + 1}`,
        },
      });
      input.addEventListener('input', () => onChange(ready()));
      inputs.push(input);

      const slot = slots[index];
      if (slot) {
        slot.replaceChildren(input);
        slot.classList.add('play-combined__slot--input');
      } else {
        extra.append(el('label', { class: 'play-combined__part' }, [
          el('span', { class: 'play-mini-label', text: `Rumpang ${index + 1}` }),
          input,
        ]));
      }
    }

    answerBox.append(
      el('p', {
        class: 'play-mini-note',
        text:
          partCount > 1
            ? `Isi ${partCount} bagian kosong, lalu periksa jawaban.`
            : 'Isi bagian kosong, lalu periksa jawaban.',
      }),
    );

    return {
      prompt: el('div', { class: 'play-combined' }, [
        content,
        prompt,
        ...(extra.childElementCount > 0 ? [extra] : []),
        notes,
      ]),
      answer: answerBox,
      ownsMedia: true,
      getAnswer: () => {
        if (!ready()) return null;
        const values = inputs.map((input) => input.value.trim());
        return values.length > 1 ? { parts: values } : { text: values[0]! };
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

  if (mode === 'speak' || mode === 'translate') {
    const inner =
      mode === 'speak'
        ? createSpeaking({ question: { ...question, type: 'speaking', media: [] }, onChange })
        : createTranslation({
            question: { ...question, type: 'translation', media: [] },
            onChange,
          });
    notes.append(el('p', { class: 'play-mini-label', text: 'Jawaban' }));
    answerBox.append(inner.answer);

    return {
      prompt: el('div', { class: 'play-combined' }, [content, prompt, notes]),
      answer: answerBox,
      ownsMedia: true,
      getAnswer: inner.getAnswer,
      focus: inner.focus,
      setDisabled: (value) => inner.setDisabled(value),
      markResult: inner.markResult,
    };
  }

  const interaction =
    mode === 'order'
      ? createSentenceBuilder({
          question: { ...question, type: 'sentence_builder', media: [] },
          onChange,
        })
      : createMatchingPairs({ question, onChange });

  notes.append(el('p', { class: 'play-mini-label', text: 'Jawaban' }));
  answerBox.append(interaction.answer);

  return {
    prompt: el('div', { class: 'play-combined' }, [content, prompt, notes]),
    answer: answerBox,
    ownsMedia: true,
    getAnswer: interaction.getAnswer,
    focus: interaction.focus,
    setDisabled: (value) => interaction.setDisabled(value),
    markResult: interaction.markResult,
  };
}
