import { icon } from '../../components/icons';
import { el } from '../../utils/dom';
import { speak, speechSynthesisSupported } from '../audio/speech';
import type { MiniGameProps, MiniGameView } from './types';

/**
 * Conversation plays the opening lines one at a time, then asks for a response.
 * Every option has its own NPC reaction in `scene.responses`, so choices do not
 * collapse into the same dialogue. The server still grades the selected option;
 * the reaction text never reveals which option is correct.
 */
export function createConversation({ question, onChange }: MiniGameProps): MiniGameView {
  const npc = question.scene?.npc;
  const screens = question.scene?.screens ?? [];
  const responses = question.scene?.responses ?? [];
  const lang = question.scene?.lang ?? 'id-ID';
  const canSpeak = speechSynthesisSupported();
  const buttons: HTMLButtonElement[] = [];
  let selectedId: string | null = null;
  let disabled = false;
  let step = 0;

  const transcript = el('div', { class: 'play-dialogue__transcript' });
  const progress = el('span', { class: 'play-dialogue__progress' });
  const nextButton = el(
    'button',
    { class: 'btn btn--secondary btn--block', attrs: { type: 'button' } },
    ['Lanjut dialog', icon('arrow-right', 18)],
  );

  const scene = el('div', { class: 'play-dialogue' }, [
    el('div', { class: 'play-dialogue__scene' }, [
      el('span', { class: 'play-dialogue__avatar' }, [icon('user', 30)]),
      el('div', { class: 'play-dialogue__identity' }, [
        el('p', { class: 'play-dialogue__name', text: npc?.name || 'Lawan bicara' }),
        el('p', { class: 'play-dialogue__role', text: npc?.role || 'NPC' }),
      ]),
      progress,
    ]),
    transcript,
  ]);

  const appendBubble = (speaker: string | undefined, line: string) => {
    const bubble = el('div', { class: 'play-bubble' }, [
      speaker ? el('span', { class: 'play-bubble__speaker', text: speaker }) : null,
      el('p', { class: 'play-bubble__text', text: line }),
      canSpeak
        ? el(
            'button',
            {
              class: 'play-bubble__audio',
              attrs: {
                type: 'button',
                'aria-label': `Putar dialog ${speaker ?? npc?.name ?? ''}`,
              },
              events: { click: () => speak(line, 0.95, lang) },
            },
            [icon('volume', 16)],
          )
        : null,
    ]);
    transcript.append(bubble);
    transcript.scrollTop = transcript.scrollHeight;
  };

  const choices = el('div', {
    class: 'play-options play-options--dialogue',
    attrs: { role: 'group', 'aria-label': 'Pilihan respons' },
  });
  choices.hidden = true;

  const reaction = el('div', { class: 'play-dialogue__reaction', attrs: { 'aria-live': 'polite' } });

  const revealChoices = () => {
    nextButton.hidden = true;
    choices.hidden = false;
    progress.textContent = 'Pilih responsmu';
    buttons[0]?.focus({ preventScroll: true });
  };

  const showStep = () => {
    const screen = screens[step];
    if (!screen) return;
    appendBubble(screen.speaker, screen.line);
    progress.textContent = `${step + 1}/${screens.length} dialog`;
    const isLast = step >= screens.length - 1;
    nextButton.replaceChildren(
      isLast ? 'Pilih respons' : 'Lanjut dialog',
      icon('arrow-right', 18),
    );
    if (isLast) {
      // The last line still needs a deliberate click so reading is paced.
      nextButton.hidden = false;
    }
  };

  nextButton.addEventListener('click', () => {
    if (disabled) return;
    if (step >= screens.length - 1) {
      revealChoices();
      return;
    }
    step += 1;
    showStep();
  });

  for (const [index, option] of question.options.entries()) {
    const button = el('button', {
      class: 'play-option play-option--speech',
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

      const reply = responses[index];
      if (reply) {
        reaction.replaceChildren(
          el('div', { class: 'play-bubble play-bubble--reaction' }, [
            el('span', { class: 'play-bubble__speaker', text: npc?.name || 'Lawan bicara' }),
            el('p', { class: 'play-bubble__text', text: reply }),
            canSpeak
              ? el(
                  'button',
                  {
                    class: 'play-bubble__audio',
                    attrs: { type: 'button', 'aria-label': 'Putar respons karakter' },
                    events: { click: () => speak(reply, 0.95, lang) },
                  },
                  [icon('volume', 16)],
                )
              : null,
          ]),
        );
      } else {
        reaction.replaceChildren();
      }
      onChange(true);
    });
    buttons.push(button);
    choices.append(button);
  }

  if (screens.length === 0) {
    transcript.append(
      el('p', {
        class: 'play-mini-note',
        text: 'Dialog belum tersedia untuk soal ini. Pilih respons berdasarkan pertanyaan.',
      }),
    );
    revealChoices();
  } else {
    showStep();
  }

  return {
    answer: el('div', { class: 'play-conversation' }, [
      scene,
      nextButton,
      el('p', { class: 'play-mini-label', text: 'Responsmu' }),
      choices,
      reaction,
    ]),
    getAnswer: () => (selectedId ? { optionId: selectedId } : null),
    focus: () =>
      (nextButton.hidden ? buttons[0] : nextButton)?.focus({ preventScroll: true }),
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
