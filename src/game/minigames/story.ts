import { icon } from '../../components/icons';
import { el } from '../../utils/dom';
import { speak, speechSynthesisSupported } from '../audio/speech';
import type { MiniGameProps, MiniGameView } from './types';

/**
 * Story Mode shows the scene sequentially, then asks the comprehension
 * question. Reading the story is not graded; the server grades the option that
 * answers the question.
 */
export function createStory({ question, onChange }: MiniGameProps): MiniGameView {
  const screens = question.scene?.screens ?? [];
  const canSpeak = speechSynthesisSupported();
  const buttons: HTMLButtonElement[] = [];
  let selectedId: string | null = null;
  let disabled = false;
  let step = 0;
  const read = new Set<number>();

  const stage = el('div', { class: 'play-story__stage' });
  const progress = el('span', { class: 'play-story__progress' });
  const nextButton = el('button', { class: 'btn btn--secondary btn--block', attrs: { type: 'button' } }, [
    'Lanjut cerita',
    icon('arrow-right', 18),
  ]);
  const choices = el('div', {
    class: 'play-options',
    attrs: { role: 'group', 'aria-label': 'Pilihan jawaban' },
  });

  for (const option of question.options) {
    const button = el('button', {
      class: 'play-option',
      attrs: { type: 'button', 'aria-pressed': 'false' },
    });
    button.append(el('span', { class: 'play-option__label', text: option.label }));
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
    choices.append(button);
  }

  const showStep = () => {
    const screen = screens[step];
    if (!screen) return;

    read.add(step);
    stage.replaceChildren(
      el('div', { class: 'play-story__screen' }, [
        el('p', { class: 'play-story__eyebrow', text: `Bagian ${step + 1} dari ${screens.length}` }),
        screen.speaker
          ? el('p', { class: 'play-story__speaker', text: screen.speaker })
          : null,
        el('p', {
          class: screen.narration ? 'play-story__narration' : 'play-bubble__text play-story__line',
          text: screen.narration || screen.line,
        }),
        canSpeak
          ? el(
              'button',
              {
                class: 'play-bubble__audio',
                attrs: { type: 'button', 'aria-label': 'Putar bagian cerita ini' },
                events: { click: () => speak(screen.line, 0.95) },
              },
              [icon('volume', 16)],
            )
          : null,
      ]),
    );

    progress.textContent = `${read.size}/${screens.length} bagian dibaca`;
    const isLast = step >= screens.length - 1;
    nextButton.replaceChildren(
      isLast ? 'Lanjut ke pertanyaan' : 'Lanjut cerita',
      icon('arrow-right', 18),
    );
    nextButton.hidden = false;
  };

  nextButton.addEventListener('click', () => {
    if (disabled) return;
    if (step < screens.length - 1) {
      step += 1;
      showStep();
      return;
    }
    nextButton.hidden = true;
    stage.append(el('p', { class: 'play-mini-label', text: 'Pertanyaan pemahaman' }));
  });

  if (screens.length === 0) {
    nextButton.hidden = true;
    stage.append(
      el('div', { class: 'banner banner--warning' }, [
        icon('info', 18),
        el('div', {}, [
          el('p', { class: 'banner__title', text: 'Cerita belum tersedia' }),
          el('p', {
            class: 'banner__body',
            text: 'Soal ini tidak memiliki layar cerita, jadi hanya pertanyaan pemahamannya yang ditampilkan.',
          }),
        ]),
      ]),
    );
  } else {
    showStep();
  }

  return {
    answer: el('div', { class: 'play-story' }, [progress, stage, nextButton, choices]),
    getAnswer: () => (selectedId ? { optionId: selectedId } : null),
    focus: () => (screens.length > 0 ? nextButton : buttons[0])?.focus({ preventScroll: true }),
    setDisabled: (value) => {
      disabled = value;
      nextButton.disabled = value;
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
