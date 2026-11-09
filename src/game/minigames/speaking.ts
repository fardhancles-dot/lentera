import { icon } from '../../components/icons';
import { el } from '../../utils/dom';
import { speak, speechSynthesisSupported, stopSpeech } from '../audio/speech';
import type { MiniGameProps, MiniGameView } from './types';

interface RecognitionAlternative {
  0: { transcript: string };
  isFinal: boolean;
  length: number;
}

interface RecognitionEvent {
  results: { length: number; [index: number]: RecognitionAlternative };
}

interface RecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionConstructor = new () => RecognitionInstance;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function createSpeaking({ question, onChange }: MiniGameProps): MiniGameView {
  const Ctor = recognitionConstructor();
  const target = question.scene?.speech || question.prompt;
  const lang = question.scene?.lang ?? 'id-ID';
  const canSpeak = speechSynthesisSupported();
  let disabled = false;
  let recognizing = false;
  let transcript = '';

  const transcriptBox = el('p', {
    class: 'play-speaking__transcript',
    attrs: { 'aria-live': 'polite' },
    text: 'Belum ada ucapan yang dikenali.',
  });

  const modelButton = el(
    'button',
    { class: 'play-audio__small', attrs: { type: 'button' } },
    [icon('volume', 16), 'Dengar contoh'],
  );
  modelButton.addEventListener('click', () => {
    if (canSpeak) speak(target, 0.9, lang);
  });

  const recordButton = el(
    'button',
    { class: 'play-speaking__record', attrs: { type: 'button' } },
    [icon('volume', 20), el('span', { text: 'Mulai bicara' })],
  );

  const fallbackInput = el('input', {
    class: 'play-input',
    attrs: {
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      placeholder: 'Tulis kalimat yang kamu ucapkan…',
      'aria-label': 'Alternatif menulis jawaban',
    },
  });
  fallbackInput.addEventListener('input', () =>
    onChange(fallbackInput.value.trim().length > 0),
  );

  let recognition: RecognitionInstance | null = null;

  const finishRecording = () => {
    recognizing = false;
    recordButton.classList.remove('play-speaking__record--active');
    recordButton.querySelector('span')!.textContent = transcript ? 'Ucapkan ulang' : 'Mulai bicara';
  };

  if (Ctor) {
    recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let text = '';
      for (let index = 0; index < event.results.length; index += 1) {
        text += ` ${event.results[index]![0].transcript}`;
      }
      transcript = text.trim();
      transcriptBox.textContent = transcript
        ? `Terdengar: “${transcript}”`
        : 'Belum ada ucapan yang dikenali.';
      onChange(transcript.length > 0);
    };
    recognition.onerror = (event) => {
      transcriptBox.textContent =
        event.error === 'not-allowed'
          ? 'Izin mikrofon ditolak. Kamu tetap bisa memakai alternatif menulis.'
          : 'Pengenalan suara gagal. Coba lagi atau gunakan alternatif menulis.';
      finishRecording();
    };
    recognition.onend = () => finishRecording();
  }

  recordButton.addEventListener('click', () => {
    if (disabled || !recognition) return;
    if (recognizing) {
      recognition.stop();
      return;
    }
    transcript = '';
    transcriptBox.textContent = 'Mendengarkan… ucapkan kalimatnya dengan jelas.';
    try {
      recognition.start();
      recognizing = true;
      recordButton.classList.add('play-speaking__record--active');
      recordButton.querySelector('span')!.textContent = 'Berhenti';
    } catch {
      transcriptBox.textContent = 'Mikrofon tidak dapat dimulai. Gunakan alternatif menulis.';
      finishRecording();
    }
  });

  const supportBanner = Ctor
    ? el('p', {
        class: 'play-mini-note',
        text: 'Penilaian memeriksa apakah ucapan dikenali. Tidak ada skor pengucapan buatan; hasil bisa berbeda tergantung mikrofon dan browser.',
      })
    : el('div', { class: 'banner banner--warning' }, [
        icon('info', 18),
        el('div', {}, [
          el('p', { class: 'banner__title', text: 'Pengenalan suara tidak tersedia' }),
          el('p', {
            class: 'banner__body',
            text: 'Browser ini tidak mendukung Web Speech Recognition. Gunakan alternatif menulis kalimat yang kamu ucapkan; jawaban tetap dinilai di server.',
          }),
        ]),
      ]);

  return {
    answer: el('div', { class: 'play-speaking' }, [
      el('div', { class: 'play-speaking__prompt' }, [
        el('p', { class: 'play-mini-label', text: 'Ucapkan kalimat ini' }),
        el('p', { class: 'play-speaking__target', text: target }),
      ]),
      el('div', { class: 'play-speaking__actions' }, [
        modelButton,
        ...(Ctor ? [recordButton] : [recordButton]),
      ]),
      transcriptBox,
      supportBanner,
      ...(Ctor
        ? [
            el('p', { class: 'play-mini-label', text: 'Alternatif: tulis yang kamu ucapkan' }),
            fallbackInput,
          ]
        : [el('p', { class: 'play-mini-label', text: 'Tulis kalimat yang kamu ucapkan' }), fallbackInput]),
    ]),
    getAnswer: () => {
      const value = transcript || fallbackInput.value.trim();
      return value ? { text: value } : null;
    },
    focus: () => (Ctor ? recordButton : fallbackInput).focus({ preventScroll: true }),
    setDisabled: (value) => {
      disabled = value;
      recordButton.disabled = value;
      modelButton.disabled = value;
      fallbackInput.disabled = value;
      if (value) {
        recognition?.abort();
        stopSpeech();
      }
    },
    markResult: (isCorrect) => {
      transcriptBox.classList.add(
        isCorrect ? 'play-speaking__transcript--correct' : 'play-speaking__transcript--wrong',
      );
      fallbackInput.classList.add(isCorrect ? 'play-input--correct' : 'play-input--wrong');
    },
  };
}
