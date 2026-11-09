import { icon } from '../../components/icons';
import { el } from '../../utils/dom';
import type { MiniGameProps, MiniGameView } from './types';

function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function createPictureIdentification({
  question,
  onChange,
}: MiniGameProps): MiniGameView {
  const image = question.media.find((media) => media.kind === 'image');
  const buttons: HTMLButtonElement[] = [];
  let selectedId: string | null = null;
  let disabled = false;

  const figure = image
    ? el('figure', { class: 'play-picture' }, [
        el('img', {
          class: 'play-picture__image',
          attrs: { src: image.url, alt: image.alt || 'Ilustrasi soal' },
        }),
      ])
    : el('div', { class: 'banner banner--warning' }, [
        icon('info', 18),
        el('div', {}, [
          el('p', { class: 'banner__title', text: 'Gambar belum tersedia' }),
          el('p', {
            class: 'banner__body',
            text: 'Soal ini tidak memiliki media gambar, sehingga tidak dapat dijawab dengan benar.',
          }),
        ]),
      ]);

  const grid = el('div', {
    class: 'play-picture-grid',
    attrs: { role: 'group', 'aria-label': 'Nama benda' },
  });

  for (const [index, option] of question.options.entries()) {
    const button = el('button', {
      class: 'play-picture-option',
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
        item.classList.toggle('play-picture-option--selected', pressed);
      }
      onChange(true);
    });
    buttons.push(button);
    grid.append(button);
  }

  return {
    answer: el('div', { class: 'play-picture-game' }, [figure, grid]),
    ownsMedia: true,
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
          button.classList.add(
            isCorrect ? 'play-picture-option--correct' : 'play-picture-option--wrong',
          );
        }
        if (!isCorrect && label === correctAnswer) {
          button.classList.add('play-picture-option--correct');
        }
      }
    },
  };
}
