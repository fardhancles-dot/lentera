import { icon } from '../../components/icons';
import { el } from '../../utils/dom';
import { speak, speechSynthesisSupported, stopSpeech } from '../audio/speech';
import type { MiniGameProps, MiniGameView } from './types';

function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function createListening({ question, onChange }: MiniGameProps): MiniGameView {
  const audioMedia = question.media.find((media) => media.kind === 'audio');
  const speech = question.scene?.speech ?? '';
  const canSpeak = speechSynthesisSupported() && Boolean(speech);
  const audio = audioMedia
    ? el('audio', {
        class: 'play-audio__element',
        attrs: { src: audioMedia.url, preload: 'none' },
      })
    : null;

  const status = el('p', {
    class: 'play-audio__status',
    attrs: { 'aria-live': 'polite' },
  });

  const play = (rate: number) => {
    status.textContent = '';
    if (audio) {
      audio.playbackRate = rate;
      audio.currentTime = 0;
      void audio.play().catch(() => {
        status.textContent = 'Audio gagal diputar. Coba tekan putar lagi.';
      });
      return;
    }
    if (canSpeak) {
      if (speak(speech, rate)) {
        status.textContent = rate < 1 ? 'Memutar versi lambat…' : 'Memutar audio…';
      } else {
        status.textContent = 'Browser menolak memutar audio. Periksa pengaturan suara.';
      }
      return;
    }
    status.textContent = 'Audio tidak tersedia di browser ini.';
  };

  const playButton = el('button', { class: 'play-audio__button', attrs: { type: 'button' } }, [
    icon('volume', 20),
    el('span', { text: 'Putar audio' }),
  ]);
  playButton.addEventListener('click', () => play(1));

  const replayButton = el(
    'button',
    { class: 'play-audio__small', attrs: { type: 'button' } },
    [icon('refresh', 16), 'Ulangi'],
  );
  replayButton.addEventListener('click', () => play(1));

  const slowButton = el(
    'button',
    { class: 'play-audio__small', attrs: { type: 'button' } },
    [icon('clock', 16), 'Versi lambat'],
  );
  slowButton.addEventListener('click', () => play(0.7));

  const volume = el('input', {
    class: 'play-audio__volume',
    attrs: {
      type: 'range',
      min: '0',
      max: '1',
      step: '0.1',
      value: '1',
      'aria-label': 'Volume audio',
    },
  });
  volume.addEventListener('input', () => {
    if (audio) audio.volume = Number(volume.value);
  });

  const audioPanel = el('div', { class: 'play-audio' }, [
    el('div', { class: 'play-audio__stage' }, [
      el('span', { class: 'play-audio__icon' }, [icon('volume', 26)]),
      el('div', { class: 'play-audio__controls' }, [
        playButton,
        el('div', { class: 'play-audio__row' }, [replayButton, slowButton]),
      ]),
    ]),
    el('div', { class: 'play-audio__settings' }, [
      el('span', { class: 'play-audio__volume-label', text: 'Volume' }),
      volume,
    ]),
    audio,
    status,
  ]);

  if (!audioMedia && !canSpeak) {
    audioPanel.append(
      el('div', { class: 'banner banner--warning' }, [
        icon('info', 18),
        el('div', {}, [
          el('p', { class: 'banner__title', text: 'Audio tidak dapat diputar' }),
          el('p', {
            class: 'banner__body',
            text: `Browser ini tidak mendukung text-to-speech dan soal tidak memiliki audio tersimpan. Transkrip ditampilkan agar soal tetap jujur dan dapat dijawab: "${speech || 'transkrip belum tersedia'}"`,
          }),
        ]),
      ]),
    );
  }

  const options = el('div', {
    class: 'play-options',
    attrs: { role: 'group', 'aria-label': 'Pilihan jawaban' },
  });
  const buttons: HTMLButtonElement[] = [];
  let selectedId: string | null = null;
  let disabled = false;

  for (const [index, option] of question.options.entries()) {
    const button = el('button', {
      class: 'play-option',
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
        item.classList.toggle('play-option--selected', pressed);
      }
      onChange(true);
    });
    buttons.push(button);
    options.append(button);
  }

  const typedFallback = el('input', {
    class: 'play-input',
    attrs: {
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      placeholder: 'Ketik apa yang kamu dengar…',
      'aria-label': 'Jawaban dari audio',
    },
  });
  typedFallback.addEventListener('input', () => onChange(typedFallback.value.trim().length > 0));

  return {
    answer: el('div', { class: 'play-listening' }, [
      audioPanel,
      ...(buttons.length > 0 ? [el('p', { class: 'play-mini-label', text: 'Pilih jawaban' }), options] : [typedFallback]),
    ]),
    ownsMedia: true,
    getAnswer: () => {
      if (buttons.length > 0) return selectedId ? { optionId: selectedId } : null;
      return typedFallback.value.trim() ? { text: typedFallback.value } : null;
    },
    focus: () => playButton.focus({ preventScroll: true }),
    setDisabled: (value) => {
      disabled = value;
      playButton.disabled = value;
      replayButton.disabled = value;
      slowButton.disabled = value;
      typedFallback.disabled = value;
      for (const button of buttons) button.disabled = value;
      if (value) stopSpeech();
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
      typedFallback.classList.add(isCorrect ? 'play-input--correct' : 'play-input--wrong');
    },
  };
}
