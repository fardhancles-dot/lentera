import { el } from '../../utils/dom';
import { seededShuffle } from './shuffle';
import type { MiniGameProps, MiniGameView } from './types';

/**
 * Translation keeps the answer as text (graded by the server) but offers two
 * input paths: tapping word tokens or typing freely. The direction is part of
 * the question prompt, so the same mechanics work for both directions.
 */
export function createTranslation({ question, onChange }: MiniGameProps): MiniGameView {
  const tokens = seededShuffle(question.options, `${question.id}:translation`);
  const selected: string[] = [];
  let disabled = false;
  let mode: 'tokens' | 'typing' = tokens.length > 0 ? 'tokens' : 'typing';

  const tokenLabel = (id: string) => question.options.find((option) => option.id === id)?.label ?? '';

  const bank = el('div', {
    class: 'play-bank',
    attrs: { role: 'group', 'aria-label': 'Kata yang tersedia' },
  });
  const strip = el('div', {
    class: 'play-strip',
    attrs: { 'aria-live': 'polite', 'aria-label': 'Terjemahan yang disusun' },
  });
  const typed = el('input', {
    class: 'play-input',
    attrs: {
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      placeholder: 'Tulis terjemahanmu…',
      'aria-label': 'Terjemahan',
    },
  });
  typed.addEventListener('input', () => onChange(typed.value.trim().length > 0));

  const tokenPanel = el('div', { class: 'play-translation__tokens' }, [
    el('p', { class: 'play-mini-label', text: 'Kata tersedia' }),
    bank,
    el('p', { class: 'play-mini-label', text: 'Terjemahanmu' }),
    strip,
  ]);

  const typingPanel = el('div', { class: 'play-translation__typing' }, [typed]);

  const render = () => {
    bank.replaceChildren();
    for (const token of tokens) {
      const used = selected.includes(token.id);
      const button = el(
        'button',
        {
          class: `play-token${used ? ' play-token--used' : ''}`,
          attrs: { type: 'button', 'aria-pressed': String(used) },
        },
        [token.label],
      );
      button.disabled = disabled || used || mode !== 'tokens';
      button.addEventListener('click', () => {
        if (disabled) return;
        selected.push(token.id);
        render();
        onChange(true);
      });
      bank.append(button);
    }

    strip.replaceChildren();
    if (selected.length === 0) {
      strip.append(
        el('span', {
          class: 'play-strip__placeholder',
          text: 'Ketuk kata untuk menyusun terjemahan.',
        }),
      );
    } else {
      for (const id of selected) {
        const label = tokenLabel(id);
        const chip = el(
          'button',
          {
            class: 'play-chip',
            attrs: { type: 'button', 'aria-label': `Hapus kata ${label}` },
          },
          [label, el('span', { class: 'play-chip__remove', text: '×' })],
        );
        chip.disabled = disabled || mode !== 'tokens';
        chip.addEventListener('click', () => {
          if (disabled) return;
          const index = selected.indexOf(id);
          if (index >= 0) selected.splice(index, 1);
          render();
          onChange(selected.length > 0);
        });
        strip.append(chip);
      }
    }

    tokenPanel.hidden = mode !== 'tokens';
    typingPanel.hidden = mode !== 'typing';
  };

  const modeButtons: HTMLButtonElement[] = [];
  const setMode = (next: 'tokens' | 'typing') => {
    if (disabled || mode === next) return;
    mode = next;
    for (const button of modeButtons) {
      const active = button.dataset.mode === mode;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    }
    render();
    onChange(mode === 'typing' ? typed.value.trim().length > 0 : selected.length > 0);
    if (mode === 'typing') typed.focus({ preventScroll: true });
  };

  const modeSwitch = el('div', { class: 'play-translation__switch', attrs: { role: 'group' } });
  for (const [value, label] of [
    ['tokens', 'Susun kata'],
    ['typing', 'Tulis sendiri'],
  ] as const) {
    const button = el('button', {
      class: `play-translation__mode${mode === value ? ' is-active' : ''}`,
      attrs: { type: 'button', 'aria-pressed': String(mode === value) },
      dataset: { mode: value },
      text: label,
      events: { click: () => setMode(value) },
    });
    modeButtons.push(button);
    modeSwitch.append(button);
  }

  render();

  return {
    answer: el('div', { class: 'play-translation' }, [
      ...(tokens.length > 0 ? [modeSwitch] : []),
      tokenPanel,
      typingPanel,
    ]),
    getAnswer: () => {
      const text =
        mode === 'typing' ? typed.value.trim() : selected.map(tokenLabel).join(' ').trim();
      return text ? { text } : null;
    },
    focus: () =>
      mode === 'typing'
        ? typed.focus({ preventScroll: true })
        : bank.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }),
    setDisabled: (value) => {
      disabled = value;
      typed.disabled = value;
      for (const button of modeButtons) button.disabled = value;
      render();
    },
    markResult: (isCorrect) => {
      if (mode === 'typing') {
        typed.classList.add(isCorrect ? 'play-input--correct' : 'play-input--wrong');
      } else {
        strip.classList.add(isCorrect ? 'play-strip--correct' : 'play-strip--wrong');
      }
    },
  };
}
