import { icon } from '../../components/icons';
import { el } from '../../utils/dom';
import { speak, speechSynthesisSupported } from '../audio/speech';
import type { MiniGameProps, MiniGameView } from './types';

/**
 * Story Mode plays its screens in order. A screen can offer ungraded response
 * choices; each choice has its own reply and must be made before continuing.
 * Only the final comprehension question is graded by the server.
 */
export function createStory({ question, onChange }: MiniGameProps): MiniGameView {
  const screens = question.scene?.screens ?? [];
  const lang = question.scene?.lang ?? 'id-ID';
  const canSpeak = speechSynthesisSupported();
  const optionButtons: HTMLButtonElement[] = [];
  const choiceButtons: HTMLButtonElement[] = [];
  const chosen = new Map<number, string>();
  let selectedId: string | null = null;
  let disabled = false;
  let step = 0;
  let storyFinished = false;
  const read = new Set<number>();

  const stage = el('div', { class: 'play-story__stage' });
  const progress = el('span', { class: 'play-story__progress' });
  const nextButton = el('button', { class: 'btn btn--secondary btn--block', attrs: { type: 'button' } }, [
    'Lanjut cerita',
    icon('arrow-right', 18),
  ]);
  const questionLabel = el('p', { class: 'play-mini-label', text: 'Pertanyaan pemahaman' });
  questionLabel.hidden = true;
  const choices = el('div', {
    class: 'play-options',
    attrs: { role: 'group', 'aria-label': 'Pilihan jawaban' },
  });
  choices.hidden = true;

  for (const option of question.options) {
    const button = el('button', {
      class: 'play-option',
      attrs: { type: 'button', 'aria-pressed': 'false' },
    });
    button.append(el('span', { class: 'play-option__label', text: option.label }));
    button.addEventListener('click', () => {
      if (disabled || !storyFinished) return;
      selectedId = option.id;
      for (const item of optionButtons) {
        const pressed = item === button;
        item.setAttribute('aria-pressed', String(pressed));
        item.classList.toggle('play-option--selected', pressed);
      }
      onChange(true);
    });
    optionButtons.push(button);
    choices.append(button);
  }

  const finishStory = () => {
    storyFinished = true;
    nextButton.hidden = true;
    questionLabel.hidden = false;
    choices.hidden = false;
    progress.textContent = `${read.size}/${screens.length} bagian dibaca`;
    optionButtons[0]?.focus({ preventScroll: true });
  };

  const showStep = () => {
    const screen = screens[step];
    if (!screen) return;

    read.add(step);
    const content: Array<Node | null> = [
      el('p', { class: 'play-story__eyebrow', text: `Bagian ${step + 1} dari ${screens.length}` }),
      screen.speaker ? el('p', { class: 'play-story__speaker', text: screen.speaker }) : null,
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
              events: { click: () => speak(screen.line, 0.95, lang) },
            },
            [icon('volume', 16)],
          )
        : null,
    ];

    if (screen.choices?.length) {
      choiceButtons.length = 0;
      const chosenLabel = chosen.get(step);
      const chooser = el('div', {
        class: 'play-story__choices',
        attrs: { role: 'group', 'aria-label': 'Pilihan respons cerita' },
      });

      for (const choice of screen.choices) {
        const button = el('button', {
          class: `play-story__choice${chosenLabel === choice.label ? ' is-chosen' : ''}`,
          attrs: {
            type: 'button',
            'aria-pressed': String(chosenLabel === choice.label),
          },
          text: choice.label,
        });
        button.disabled = disabled;
        button.addEventListener('click', () => {
          if (disabled) return;
          chosen.set(step, choice.label);
          showStep();
        });
        choiceButtons.push(button);
        chooser.append(button);
      }

      content.push(el('p', { class: 'play-mini-label', text: 'Apa yang kamu lakukan?' }), chooser);

      const reply = screen.choices.find((choice) => choice.label === chosenLabel)?.reply;
      if (reply) {
        content.push(
          el('div', { class: 'play-bubble play-bubble--reaction' }, [
            el('p', { class: 'play-bubble__text', text: reply }),
          ]),
        );
      }
    }

    stage.replaceChildren(el('div', { class: 'play-story__screen' }, content));
    progress.textContent = `${read.size}/${screens.length} bagian dibaca`;

    const needsChoice = Boolean(screen.choices?.length) && !chosen.has(step);
    const isLast = step >= screens.length - 1;
    nextButton.hidden = false;
    nextButton.disabled = needsChoice || disabled;
    nextButton.replaceChildren(
      isLast ? 'Lanjut ke pertanyaan' : 'Lanjut cerita',
      icon('arrow-right', 18),
    );
  };

  nextButton.addEventListener('click', () => {
    if (disabled) return;
    const screen = screens[step];
    if (screen?.choices?.length && !chosen.has(step)) return;
    if (step < screens.length - 1) {
      step += 1;
      showStep();
      return;
    }
    finishStory();
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
    finishStory();
  } else {
    showStep();
  }

  return {
    answer: el('div', { class: 'play-story' }, [
      progress,
      stage,
      nextButton,
      questionLabel,
      choices,
    ]),
    getAnswer: () => (selectedId ? { optionId: selectedId } : null),
    focus: () =>
      (storyFinished
        ? optionButtons[0]
        : nextButton.hidden
          ? optionButtons[0]
          : nextButton
      )?.focus({ preventScroll: true }),
    setDisabled: (value) => {
      disabled = value;
      nextButton.disabled = value;
      for (const button of [...choiceButtons, ...optionButtons]) button.disabled = value;
    },
    markResult: (isCorrect, correctAnswer) => {
      for (const button of optionButtons) {
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
