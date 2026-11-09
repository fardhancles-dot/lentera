import { icon } from '../../components/icons';
import { el } from '../../utils/dom';
import { speak, speechSynthesisSupported } from '../audio/speech';
import type { MiniGameProps, MiniGameView } from './types';

/**
 * Branching conversation scene. Server-side grading checks the selected option
 * against the stored correct option, so the NPC replies are presentation only
 * and never reveal which choice the database will accept.
 */
export function createConversation({ question, onChange }: MiniGameProps): MiniGameView {
  const npc = question.scene?.npc;
  const screens = question.scene?.screens ?? [];
  const canSpeak = speechSynthesisSupported();
  const buttons: HTMLButtonElement[] = [];
  let selectedId: string | null = null;
  let disabled = false;

  const scene = el('div', { class: 'play-dialogue' }, [
    el('div', { class: 'play-dialogue__scene' }, [
      el('span', { class: 'play-dialogue__avatar' }, [icon('user', 30)]),
      el('div', { class: 'play-dialogue__identity' }, [
        el('p', { class: 'play-dialogue__name', text: npc?.name || 'Lawan bicara' }),
        el('p', { class: 'play-dialogue__role', text: npc?.role || 'NPC' }),
      ]),
    ]),
  ]);

  for (const screen of screens) {
    const line = el('p', { class: 'play-bubble__text', text: screen.line });

    const bubble = el('div', { class: 'play-bubble' }, [
      screen.speaker ? el('span', { class: 'play-bubble__speaker', text: screen.speaker }) : null,
      line,
      canSpeak
        ? el(
            'button',
            {
              class: 'play-bubble__audio',
              attrs: { type: 'button', 'aria-label': `Putar dialog ${screen.speaker ?? npc?.name ?? ''}` },
              events: { click: () => speak(screen.line, 0.95) },
            },
            [icon('volume', 16)],
          )
        : null,
    ]);
    scene.append(bubble);
  }

  if (screens.length === 0) {
    scene.append(
      el('p', {
        class: 'play-mini-note',
        text: 'Dialog belum tersedia untuk soal ini. Pilih respons berdasarkan pertanyaan.',
      }),
    );
  }

  const choices = el('div', {
    class: 'play-options',
    attrs: { role: 'group', 'aria-label': 'Pilihan respons' },
  });

  for (const option of question.options) {
    const button = el('button', {
      class: 'play-option play-option--speech',
      attrs: { type: 'button', 'aria-pressed': 'false' },
    });
    button.append(
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
    choices.append(button);
  }

  return {
    answer: el('div', { class: 'play-conversation' }, [
      scene,
      el('p', { class: 'play-mini-label', text: 'Responsmu' }),
      choices,
    ]),
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
