import { icon } from '../../components/icons';
import { showToast } from '../../components/toast';
import { createMiniGame } from '../../game/minigames';
import type { LessonQuestion, LessonScene } from '../../services/lesson.service';
import { adminService } from '../../services/admin.service';
import type { AdminQuestion, CurriculumSubject } from '../../types/admin';
import type { Json, QuestionType } from '../../types/database';
import { el } from '../../utils/dom';
import { normalizeSentenceAnswer, splitSentenceTokens } from '../../utils/questionText';
import { pickMedia } from './media';
import type { AdminSectionContext } from './ui';
import {
  badge,
  button,
  errorState,
  field,
  formGrid,
  input,
  loading,
  askReason,
  openDialog,
  panel,
  select,
  table,
  textarea,
  valueOf,
  numOf,
} from './ui';

const TYPES = [
  ['multiple_choice', 'Pilihan ganda'],
  ['fill_blank', 'Isi rumpang'],
  ['typing', 'Mengetik'],
  ['matching_pairs', 'Mencocokkan pasangan'],
  ['listening', 'Menyimak'],
  ['picture_identification', 'Identifikasi gambar'],
  ['speaking', 'Berbicara'],
  ['conversation', 'Percakapan'],
  ['story', 'Cerita'],
  ['word_bank', 'Word bank'],
  ['sentence_builder', 'Susun kalimat'],
  ['translation', 'Terjemahan'],
] as const;

const TYPE_LABELS = new Map<string, string>(TYPES.map(([value, label]) => [value, label]));
// Types whose answer is a single option id. This also decides which editor
// shows the "Pilihan jawaban" repeater, not how the server grades (the server
// accepts an optionId for any type that has options).
const OPTION_TYPES = new Set([
  'multiple_choice',
  'picture_identification',
  'listening',
  'conversation',
  'story',
]);
const PAIR_TYPES = new Set(['matching_pairs']);
const TEXT_TYPES = new Set(['fill_blank', 'typing', 'translation', 'speaking']);
// The five types with a purpose-built form. Everything else keeps the generic
// editor so behaviour that already works is not disturbed.
const SIMPLIFIED_TYPES = new Set([
  'listening',
  'conversation',
  'story',
  'word_bank',
  'sentence_builder',
]);
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const ALLOWED_AUDIO_MIME = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
];

export interface SubjectLevel {
  nodeId: string;
  levelNumber: number | null;
  title: string;
  description: string;
  questionId: string | null;
  questionPrompt: string | null;
  questionActive: boolean | null;
  isActive: boolean;
}

export function subjectLevels(subject: CurriculumSubject | undefined): SubjectLevel[] {
  if (!subject) return [];
  return subject.courses
    .flatMap((course) => course.levels)
    .flatMap((level) => level.units)
    .flatMap((unit) => unit.nodes)
    .filter((node) => node.nodeType !== 'reward' && node.levelNumber !== null)
    .map((node) => ({
      nodeId: node.id,
      levelNumber: node.levelNumber,
      title: node.title,
      description: node.description,
      questionId: node.questionId,
      questionPrompt: node.questionPrompt,
      questionActive: node.questionActive,
      isActive: node.isActive,
    }));
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function removeRowButton(label: string, row: HTMLElement): HTMLElement {
  return el('button', {
    class: 'icon-btn',
    attrs: { type: 'button', 'aria-label': label },
    events: { click: () => row.remove() },
  }, [el('span', { text: '×' })]);
}

function optionRow(label = '', correct = false): HTMLElement {
  const radio = el('input', { attrs: { type: 'radio', name: 'optionCorrect' } });
  radio.checked = correct;
  const row = el('div', { class: 'admin-repeater__row admin-option-row' }, [
    el('input', {
      class: 'input',
      attrs: { name: 'optionLabel', placeholder: 'Teks pilihan jawaban', value: label },
    }),
    el('label', { class: 'admin-check' }, [radio, el('span', { text: 'Kunci' })]),
  ]);
  row.append(removeRowButton('Hapus pilihan', row));
  return row;
}

function answerRow(answer = '', caseSensitive = false): HTMLElement {
  const row = el('div', { class: 'admin-repeater__row admin-answer-row' }, [
    el('input', {
      class: 'input',
      attrs: { name: 'answerValue', placeholder: 'Jawaban yang diterima', value: answer },
    }),
    el('label', { class: 'admin-check' }, [
      el('input', { attrs: { type: 'checkbox', name: 'answerCase' } }),
      el('span', { text: 'Case sensitive' }),
    ]),
  ]);
  const caseBox = row.querySelector<HTMLInputElement>('input[type=checkbox]')!;
  caseBox.checked = caseSensitive;
  row.append(removeRowButton('Hapus jawaban', row));
  return row;
}

function pairRow(left = '', right = ''): HTMLElement {
  const row = el('div', { class: 'admin-repeater__row admin-pair-row' }, [
    el('input', { class: 'input', attrs: { name: 'pairLeft', placeholder: 'Kiri', value: left } }),
    el('input', { class: 'input', attrs: { name: 'pairRight', placeholder: 'Kanan', value: right } }),
  ]);
  row.append(removeRowButton('Hapus pasangan', row));
  return row;
}

function dialogRow(speaker = '', line = ''): HTMLElement {
  const row = el('div', { class: 'admin-repeater__row admin-dialog-row' }, [
    el('input', {
      class: 'input',
      attrs: { name: 'dialogSpeaker', placeholder: 'Nama pembicara (contoh: Andi)', value: speaker },
    }),
    el('input', {
      class: 'input',
      attrs: { name: 'dialogLine', placeholder: 'Kalimat yang diucapkan', value: line },
    }),
  ]);
  row.append(removeRowButton('Hapus dialog', row));
  return row;
}

function wordRow(word = ''): HTMLElement {
  const row = el('div', { class: 'admin-repeater__row admin-word-row' }, [
    el('input', {
      class: 'input',
      attrs: { name: 'wordValue', placeholder: 'Kata atau frasa', value: word },
    }),
  ]);
  row.append(removeRowButton('Hapus kata', row));
  return row;
}

function mediaRow(kind = 'image', url = '', alt = ''): HTMLElement {
  const kindSelect = select('mediaKind', [
    { value: 'image', label: 'Gambar' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Video' },
  ], kind);
  const urlInput = el('input', {
    class: 'input',
    attrs: { name: 'mediaUrl', placeholder: 'https://… atau /assets/…', value: url },
  });
  const altInput = el('input', {
    class: 'input',
    attrs: { name: 'mediaAlt', placeholder: 'Alt / transkrip', value: alt },
  });
  const library = el('button', {
    class: 'btn btn--secondary btn--sm',
    attrs: { type: 'button' },
    text: 'Library',
    events: {
      click: () =>
        pickMedia(kindSelect.value as 'image' | 'audio' | 'video', (item) => {
          kindSelect.value = item.kind;
          urlInput.value = item.url;
          altInput.value = item.altText;
          urlInput.dispatchEvent(new Event('input', { bubbles: true }));
        }),
    },
  });
  const row = el('div', { class: 'admin-repeater__row admin-media-row' }, [
    kindSelect,
    urlInput,
    altInput,
    library,
  ]);
  row.append(removeRowButton('Hapus media', row));
  return row;
}

interface AudioField {
  element: HTMLElement;
  file: () => File | null;
  url: () => string;
  previewUrl: () => string;
  transcript: () => string;
}

/**
 * Audio input for listening questions. A picked or recorded file stays local
 * until the question is saved, then it is uploaded to the content-media bucket
 * so every player can stream it. The preview player uses an object URL until
 * the upload finishes.
 */
function audioField(initialUrl: string, initialTranscript: string): AudioField {
  let currentUrl = initialUrl;
  let pending: File | null = null;
  let objectUrl = '';
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  const status = el('p', { class: 'form-hint', attrs: { 'aria-live': 'polite' } });
  const player = el('audio', {
    class: 'admin-audio__player',
    attrs: { controls: true, preload: 'metadata' },
  });
  const fileInput = el('input', {
    class: 'admin-audio__file',
    attrs: { type: 'file', accept: 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm' },
  });
  const uploadButton = el('button', {
    class: 'btn btn--secondary btn--sm',
    attrs: { type: 'button' },
  }, [icon('plus', 16), 'Upload MP3']);
  const recordButton = el('button', {
    class: 'btn btn--secondary btn--sm admin-audio__record',
    attrs: { type: 'button' },
  }, [icon('volume', 16), 'Rekam suara']);
  const removeButton = el('button', {
    class: 'btn btn--danger btn--sm',
    attrs: { type: 'button' },
  }, [icon('close', 16), 'Hapus audio']);
  const transcriptInput = input('audioTranscript', initialTranscript, 'text', {
    placeholder: 'Opsional. Isi transkrip agar soal tetap bisa dijawab bila audio gagal diputar.',
  });

  const sync = (): void => {
    const src = objectUrl || currentUrl;
    player.hidden = !src;
    if (src) {
      player.src = src;
    } else {
      player.removeAttribute('src');
    }
    removeButton.disabled = !src;
  };

  const releaseObjectUrl = (): void => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = '';
    }
  };

  const applyFile = (file: File): void => {
    if (!ALLOWED_AUDIO_MIME.includes(file.type.toLowerCase())) {
      status.textContent = 'Format audio harus MP3, WAV, OGG, atau WebM.';
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      status.textContent = 'Ukuran audio maksimal 20 MB.';
      return;
    }
    if (file.size === 0) {
      status.textContent = 'File audio kosong. Pilih atau rekam ulang.';
      return;
    }
    releaseObjectUrl();
    pending = file;
    objectUrl = URL.createObjectURL(file);
    status.textContent = `${file.name} siap diunggah saat soal disimpan.`;
    sync();
  };

  uploadButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (file) applyFile(file);
  });

  removeButton.addEventListener('click', () => {
    if (recorder) return;
    releaseObjectUrl();
    pending = null;
    currentUrl = '';
    status.textContent = 'Audio dihapus. Soal bisa disimpan dengan audio baru atau transkrip.';
    sync();
  });

  recordButton.addEventListener('click', () => {
    if (recorder) {
      recorder.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      status.textContent =
        'Browser ini belum mendukung perekaman mikrofon. Unggah file MP3 sebagai gantinya.';
      return;
    }
    void navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mimeType =
          ['audio/webm', 'audio/ogg'].find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
        const active = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorder = active;
        chunks = [];
        active.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        });
        active.addEventListener('stop', () => {
          stream.getTracks().forEach((track) => track.stop());
          recorder = null;
          recordButton.classList.remove('is-recording');
          recordButton.replaceChildren(icon('volume', 16), document.createTextNode('Rekam suara'));
          const type = chunks[0]?.type || 'audio/webm';
          const blob = new Blob(chunks, { type });
          chunks = [];
          applyFile(new File([blob], `rekaman-${Date.now()}.webm`, { type }));
        });
        active.start();
        recordButton.classList.add('is-recording');
        recordButton.replaceChildren(icon('volume', 16), document.createTextNode('Stop rekaman'));
        status.textContent = 'Merekam… tekan Stop rekaman saat selesai.';
      })
      .catch(() => {
        status.textContent =
          'Mikrofon tidak dapat diakses. Izinkan akses mikrofon atau unggah file MP3.';
      });
  });

  sync();

  return {
    element: el('div', { class: 'admin-audio' }, [
      el('div', { class: 'admin-audio__actions' }, [uploadButton, recordButton, removeButton]),
      fileInput,
      player,
      status,
      field(
        'Transkrip audio (opsional)',
        transcriptInput,
        'Ditampilkan sebagai cadangan bila pemutar audio tidak tersedia.',
      ),
    ]),
    file: () => pending,
    url: () => currentUrl,
    previewUrl: () => objectUrl || currentUrl,
    transcript: () => transcriptInput.value.trim(),
  };
}

interface Snapshot {
  type: string;
  prompt: string;
  instruction: string;
  explanation: string;
  hint: string;
  difficulty: string;
  points: number;
  options: Array<{ label: string; isCorrect: boolean; sortOrder: number }>;
  answers: Array<{ answer: string; isCaseSensitive: boolean }>;
  pairs: Array<{ left: string; right: string; sortOrder: number }>;
  media: Array<{ kind: string; url: string; alt: string; sortOrder: number }>;
  words: string[];
  wordAnswer: string;
  sentence: string;
  dialogs: Array<{ speaker: string; line: string }>;
  storyTitle: string;
  storyBody: string;
  audioUrl: string;
  hasAudio: boolean;
  transcript: string;
  sceneText: string;
}

function canFormAnswer(words: string[], answer: string): boolean {
  const pool = words
    .flatMap((word) => normalizeSentenceAnswer(word).split(' '))
    .filter(Boolean);
  const needed = normalizeSentenceAnswer(answer).split(' ').filter(Boolean);
  const counts = new Map<string, number>();
  for (const word of pool) counts.set(word, (counts.get(word) ?? 0) + 1);
  for (const word of needed) {
    const left = counts.get(word) ?? 0;
    if (left === 0) return false;
    counts.set(word, left - 1);
  }
  return needed.length > 0;
}

function problemsOf(snapshot: Snapshot): string[] {
  const issues: string[] = [];
  const type = snapshot.type;
  if (!snapshot.prompt) issues.push('Pertanyaan wajib diisi.');

  // Listening normally uses choices, but older rows may only have a typed
  // transcript answer. Both shapes stay valid instead of losing the key.
  const choiceBased = OPTION_TYPES.has(type) && !(type === 'listening' && snapshot.options.length === 0);
  if (choiceBased) {
    const filled = snapshot.options.filter((option) => option.label.trim().length > 0);
    if (filled.length < 2) issues.push('Tambahkan minimal dua pilihan jawaban.');
    if (filled.filter((option) => option.isCorrect).length !== 1) {
      issues.push('Tandai tepat satu pilihan sebagai kunci jawaban.');
    }
  }
  if (type === 'listening' && !choiceBased && snapshot.answers.length === 0) {
    issues.push('Isi minimal satu jawaban teks yang diterima.');
  }

  if (type === 'conversation' && snapshot.dialogs.length === 0) {
    issues.push('Tambahkan minimal satu dialog.');
  }
  if (type === 'story' && !snapshot.storyBody) {
    issues.push('Isi cerita wajib diisi.');
  }
  if (type === 'listening' && !snapshot.audioUrl && !snapshot.hasAudio && !snapshot.transcript) {
    issues.push('Unggah atau rekam audio, atau isi transkrip audio.');
  }
  if (type === 'word_bank') {
    if (snapshot.words.length < 2) {
      issues.push('Tambahkan minimal dua kata yang tersedia.');
    }
    if (!snapshot.wordAnswer) {
      issues.push('Isi jawaban benar.');
    } else if (snapshot.words.length > 0 && !canFormAnswer(snapshot.words, snapshot.wordAnswer)) {
      issues.push(
        'Setiap kata pada jawaban benar harus ada di daftar kata yang tersedia.',
      );
    }
  }
  if (type === 'sentence_builder') {
    const tokens = splitSentenceTokens(snapshot.sentence);
    if (!snapshot.sentence) {
      issues.push('Kalimat yang benar wajib diisi.');
    } else if (tokens.length < 2) {
      issues.push('Kalimat minimal terdiri dari dua kata agar bisa disusun.');
    }
  }
  if (type === 'fill_blank' && !snapshot.prompt.includes('__')) {
    issues.push('Pertanyaan isi rumpang harus memuat __ sebagai penanda bagian kosong.');
  }
  if (PAIR_TYPES.has(type) && snapshot.pairs.length < 2) {
    issues.push('Tambahkan minimal dua pasangan.');
  }
  if (TEXT_TYPES.has(type) && type !== 'speaking' && snapshot.answers.length === 0) {
    issues.push('Isi minimal satu jawaban teks.');
  }
  if (type === 'speaking' && snapshot.answers.length === 0) {
    issues.push('Isi minimal satu jawaban teks yang diterima.');
  }
  if (type === 'picture_identification' && !snapshot.media.some((media) => media.kind === 'image' && media.url)) {
    issues.push('Tambahkan gambar untuk soal identifikasi gambar.');
  }
  if (type === 'speaking' && snapshot.sceneText) {
    try {
      JSON.parse(snapshot.sceneText);
    } catch {
      issues.push('Scene JSON tidak valid.');
    }
  }
  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function legacyScreens(scene: Record<string, unknown>): Array<Record<string, unknown>> {
  return Array.isArray(scene.screens) ? scene.screens.filter(isRecord) : [];
}

function sceneFor(snapshot: Snapshot, legacy: Record<string, unknown>): Json {
  const screens = legacyScreens(legacy);
  const lang = typeof legacy.lang === 'string' && legacy.lang ? { lang: legacy.lang } : {};

  if (snapshot.type === 'conversation') {
    const responses = Array.isArray(legacy.responses)
      ? legacy.responses.filter((item): item is string => typeof item === 'string')
      : [];
    return {
      npc: {
        name: snapshot.dialogs[0]?.speaker || 'Lawan bicara',
        role: 'Percakapan',
      },
      screens: snapshot.dialogs.map((dialog) => ({
        speaker: dialog.speaker,
        line: dialog.line,
      })),
      responses,
    };
  }

  if (snapshot.type === 'story') {
    // Older stories can carry ungraded response choices; keep them attached to
    // the first screen instead of dropping data the new form cannot edit.
    const choices = screens.map((screen) => screen.choices).find(
      (value) => Array.isArray(value) && value.length > 0,
    );
    return {
      ...lang,
      ...(snapshot.storyTitle ? { title: snapshot.storyTitle } : {}),
      screens: [
        {
          narration: snapshot.storyBody,
          ...(choices ? { choices: choices as Json } : {}),
        },
      ],
    };
  }

  if (snapshot.type === 'listening') {
    return {
      ...lang,
      ...(snapshot.transcript ? { speech: snapshot.transcript } : {}),
    };
  }

  if (snapshot.type === 'speaking') {
    try {
      return JSON.parse(snapshot.sceneText || '{}') as Json;
    } catch {
      return {};
    }
  }

  return legacy as unknown as Json;
}

export function openQuestionEditor(
  item: AdminQuestion | null,
  subjects: CurriculumSubject[],
  initialSubjectId: string,
  onDone: () => void,
): void {
  const content = el('div', { class: 'admin-question-editor' });
  const subjectOptions = subjects.map((subject) => ({
    value: subject.id,
    label: subject.name,
  }));
  const subjectSelect = select(
    'subjectId',
    [{ value: '', label: '— Pilih mata pelajaran —' }, ...subjectOptions],
    item?.subjectId || initialSubjectId,
  );
  if (item) subjectSelect.disabled = true;

  const subjectHint = el('p', {
    class: 'form-hint',
    text: item
      ? item.levelNumber
        ? `Soal ini adalah Level ${item.levelNumber}. Nomor level tidak berubah saat soal diedit.`
        : 'Soal ini masih berupa latihan dan tidak terhubung ke level.'
      : 'Level berikutnya dibuat otomatis setelah soal disimpan. Satu soal = satu level.',
  });

  const prompt = textarea('prompt', item?.prompt ?? '', 3, {
    required: true,
    placeholder: 'Contoh: Apa yang dibicarakan dalam audio tersebut?',
  });
  const instructionInput = input('instruction', item?.instruction ?? '', 'text', {
    placeholder: 'Opsional, contoh: Dengarkan audio lalu pilih jawaban yang tepat.',
  });
  const explanationInput = textarea('explanation', item?.explanation ?? '', 3, {
    placeholder: 'Opsional. Ditampilkan setelah pemain menjawab.',
  });
  const hintInput = input('hint', item?.hint ?? '', 'text', {
    placeholder: 'Opsional. Petunjuk kecil untuk membantu pemain.',
  });
  const typeSelect = select('type', TYPES.map(([value, label]) => ({ value, label })), item?.type ?? 'multiple_choice');
  const points = input('points', item?.points ?? 10, 'number', { min: '1', max: '1000' });
  const optionsBox = el('div', { class: 'admin-repeater' });
  const answersBox = el('div', { class: 'admin-repeater' });
  const pairsBox = el('div', { class: 'admin-repeater' });
  const mediaBox = el('div', { class: 'admin-repeater' });
  const wordsBox = el('div', { class: 'admin-repeater' });
  const dialogBox = el('div', { class: 'admin-repeater' });
  const scene = textarea('scene', JSON.stringify(item?.scene ?? {}, null, 2), 5, {
    placeholder: '{ "speech": "…", "screens": [] }',
  });

  const wordAnswer = input('wordAnswer', '', 'text', {
    placeholder: 'Contoh: Saya makan nasi.',
  });
  const sentenceInput = input('sentence', '', 'text', {
    placeholder: 'Contoh: Saya pergi ke sekolah.',
  });
  const tokenPreview = el('div', { class: 'admin-token-preview' });
  const storyTitle = input('storyTitle', '', 'text', {
    placeholder: 'Contoh: Liburan Andi',
  });
  const storyBody = textarea('storyBody', '', 8, {
    placeholder:
      'Contoh: Andi pergi berlibur ke pantai bersama keluarganya pada hari Minggu. Mereka bermain pasir, berenang, dan menikmati pemandangan laut.',
  });

  const legacyScene = item?.scene ?? {};
  const legacyAudio = item?.media.find((media) => media.kind === 'audio');

  // Initial values from the saved question, so editing never silently drops
  // parts of the existing content.
  const legacyTextListening =
    item?.type === 'listening' && item.options.length === 0 && item.answers.length > 0;
  const initialOptions = item && OPTION_TYPES.has(item.type) ? item.options : [];
  if (initialOptions.length > 0) {
    for (const option of initialOptions) optionsBox.append(optionRow(option.label, option.isCorrect));
  } else {
    optionsBox.append(optionRow('', true), optionRow());
  }
  const initialAnswers = item &&
    (!OPTION_TYPES.has(item.type) || legacyTextListening) &&
    !PAIR_TYPES.has(item.type)
    ? item.answers
    : [];
  if (initialAnswers.length > 0) {
    for (const answer of initialAnswers) answersBox.append(answerRow(answer.answer, answer.isCaseSensitive));
  } else {
    answersBox.append(answerRow());
  }
  if (item?.pairs.length) {
    for (const pair of item.pairs) pairsBox.append(pairRow(pair.left, pair.right));
  } else {
    pairsBox.append(pairRow(), pairRow());
  }
  if (item?.media.length) {
    for (const media of item.media) mediaBox.append(mediaRow(media.kind, media.url, media.alt));
  }

  const initialWords = item?.type === 'word_bank' ? item.options.map((option) => option.label) : [];
  if (initialWords.length > 0) {
    for (const word of initialWords) wordsBox.append(wordRow(word));
  } else {
    wordsBox.append(wordRow(), wordRow(), wordRow());
  }
  if (item?.type === 'word_bank') wordAnswer.value = item.answers[0]?.answer ?? '';

  const initialDialogs = item?.type === 'conversation' ? legacyScreens(legacyScene) : [];
  if (initialDialogs.length > 0) {
    for (const screen of initialDialogs) {
      dialogBox.append(
        dialogRow(
          typeof screen.speaker === 'string' ? screen.speaker : '',
          typeof screen.line === 'string' ? screen.line : '',
        ),
      );
    }
  } else {
    dialogBox.append(dialogRow(), dialogRow(), dialogRow());
  }

  if (item?.type === 'story') {
    const screens = legacyScreens(legacyScene);
    const body = screens
      .map((screen) =>
        typeof screen.narration === 'string' && screen.narration
          ? screen.narration
          : typeof screen.line === 'string'
            ? screen.line
            : '',
      )
      .filter(Boolean)
      .join('\n\n');
    storyBody.value = body || item.prompt;
    storyTitle.value = typeof legacyScene.title === 'string' ? legacyScene.title : '';
  }

  if (item?.type === 'sentence_builder') {
    sentenceInput.value =
      item.answers[0]?.answer || item.options.map((option) => option.label).join(' ');
  }

  const audio = audioField(legacyAudio?.url ?? '', typeof legacyScene.speech === 'string' ? legacyScene.speech : '');

  const addMedia = button('Tambah media', 'plus', () => mediaBox.append(mediaRow()));
  const addOption = button('Tambah pilihan', 'plus', () => optionsBox.append(optionRow()));
  const addAnswer = button('Tambah jawaban', 'plus', () => answersBox.append(answerRow()));
  const addPair = button('Tambah pasangan', 'plus', () => pairsBox.append(pairRow()));
  const addWord = button('Tambah kata', 'plus', () => wordsBox.append(wordRow()));
  const addDialog = button('Tambah dialog', 'plus', () => dialogBox.append(dialogRow()));

  const paintTokens = (shuffle = false): void => {
    const tokens = splitSentenceTokens(sentenceInput.value);
    if (shuffle) {
      for (let index = tokens.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [tokens[index], tokens[swap]] = [tokens[swap]!, tokens[index]!];
      }
    }
    tokenPreview.replaceChildren();
    if (tokens.length === 0) {
      tokenPreview.append(
        el('span', { class: 'form-hint', text: 'Kata acak akan muncul di sini setelah kalimat diisi.' }),
      );
      return;
    }
    for (const token of tokens) {
      tokenPreview.append(el('span', { class: 'admin-token-preview__token', text: token }));
    }
  };
  paintTokens();
  sentenceInput.addEventListener('input', () => paintTokens());

  const promptField = field('Pertanyaan', prompt, 'Tulis pertanyaan atau instruksi utama soal.');
  const promptLabel = promptField.querySelector('.admin-field__label')!;
  const materi = el('div', { class: 'admin-materi' });
  const answersSection = el('div', { class: 'admin-answers' });
  const bodyFields = el('div', { class: 'admin-editor-body' });

  function optionSection(): HTMLElement {
    return el('div', {}, [
      el('div', { class: 'admin-subhead-row' }, [
        el('h3', { class: 'admin-subhead', text: 'Pilihan jawaban' }),
        addOption,
      ]),
      el('p', {
        class: 'form-hint',
        text: 'Isi minimal dua pilihan, lalu tandai satu pilihan sebagai kunci jawaban.',
      }),
      optionsBox,
    ]);
  }

  function textAnswerSection(): HTMLElement {
    return el('div', {}, [
      el('div', { class: 'admin-subhead-row' }, [
        el('h3', { class: 'admin-subhead', text: 'Jawaban teks' }),
        addAnswer,
      ]),
      ...(typeSelect.value === 'fill_blank'
        ? [el('p', { class: 'form-hint', text: 'Gunakan __ pada pertanyaan untuk setiap rumpang.' })]
        : []),
      answersBox,
    ]);
  }

  function mediaSection(): HTMLElement {
    return el('div', {}, [
      el('div', { class: 'admin-subhead-row' }, [
        el('h3', { class: 'admin-subhead', text: 'Media (opsional)' }),
        addMedia,
      ]),
      mediaBox,
    ]);
  }

  let renderedType = '';
  function renderDynamic(force = false): void {
    const type = typeSelect.value;
    if (!force && renderedType === type) return;
    renderedType = type;
    materi.replaceChildren();
    answersSection.replaceChildren();

    if (type === 'listening') {
      promptLabel.textContent = 'Pertanyaan';
      prompt.setAttribute('placeholder', 'Contoh: Apa yang dibicarakan dalam audio tersebut?');
      materi.append(
        el('h3', { class: 'admin-subhead', text: 'Audio soal' }),
        el('p', {
          class: 'form-hint',
          text: 'Unggah file MP3 dari perangkat atau rekam langsung lewat mikrofon. Audio dicek dulu sebelum disimpan.',
        }),
        audio.element,
        el('p', {
          class: 'form-hint',
          text: 'Audio baru diunggah saat soal disimpan, sehingga pemain lain bisa memutarnya.',
        }),
      );
    }

    if (type === 'conversation') {
      promptLabel.textContent = 'Pertanyaan berdasarkan percakapan';
      prompt.setAttribute('placeholder', 'Contoh: Bagaimana keadaan Budi?');
      materi.append(
        el('div', { class: 'admin-subhead-row' }, [
          el('h3', { class: 'admin-subhead', text: 'Isi percakapan' }),
          addDialog,
        ]),
        el('p', {
          class: 'form-hint',
          text: 'Isi nama pembicara dan kalimatnya. Pemain akan membaca dialog ini sebelum menjawab.',
        }),
        dialogBox,
      );
    }

    if (type === 'story') {
      promptLabel.textContent = 'Pertanyaan pemahaman';
      prompt.setAttribute('placeholder', 'Contoh: Ke mana Andi pergi berlibur?');
      materi.append(
        field('Judul cerita (opsional)', storyTitle, 'Judul tampil di atas isi cerita.'),
        field('Isi cerita', storyBody, 'Tulis cerita lengkap di sini. Pemain membaca cerita lalu menjawab pertanyaan.'),
      );
    }

    if (type === 'word_bank') {
      promptLabel.textContent = 'Pertanyaan / instruksi';
      prompt.setAttribute('placeholder', 'Contoh: Susun kata yang tersedia untuk melengkapi kalimat berikut.');
      materi.append(
        el('div', { class: 'admin-subhead-row' }, [
          el('h3', { class: 'admin-subhead', text: 'Kata yang tersedia' }),
          addWord,
        ]),
        el('p', {
          class: 'form-hint',
          text: 'Tambahkan kata satu per satu. Pemain memilih kata untuk menyusun jawaban.',
        }),
        wordsBox,
        field(
          'Jawaban benar',
          wordAnswer,
          'Tulis susunan jawaban yang benar memakai kata-kata di atas, contoh: Saya makan nasi.',
        ),
      );
    }

    if (type === 'sentence_builder') {
      promptLabel.textContent = 'Pertanyaan / instruksi';
      prompt.setAttribute('placeholder', 'Contoh: Susunlah kata-kata berikut menjadi kalimat yang benar.');
      materi.append(
        field(
          'Kalimat yang benar',
          sentenceInput,
          'Sistem otomatis memecah kalimat menjadi kata dan mengacak urutannya. Kamu tidak perlu menulis kata acak satu per satu.',
        ),
        el('div', { class: 'admin-subhead-row' }, [
          el('h3', { class: 'admin-subhead', text: 'Pratinjau kata acak' }),
          button('Buat kata acak', 'refresh', () => paintTokens(true)),
        ]),
        el('p', {
          class: 'form-hint',
          text: 'Pemain akan menerima kata dalam urutan acak setiap kali bermain.',
        }),
        tokenPreview,
      );
    }

    if (!SIMPLIFIED_TYPES.has(type)) {
      promptLabel.textContent = 'Pertanyaan';
      prompt.setAttribute('placeholder', 'Tulis pertanyaan yang akan dibaca pemain.');
    }

    if (OPTION_TYPES.has(type) && !legacyTextListening) answersSection.append(optionSection());
    if (type === 'listening' && legacyTextListening) {
      answersSection.append(
        el('div', {}, [
          el('p', {
            class: 'form-hint',
            text: 'Soal lama ini memakai jawaban teks. Tambahkan pilihan jawaban baru kapan saja lewat soal baru.',
          }),
          textAnswerSection(),
        ]),
      );
    }
    if (PAIR_TYPES.has(type)) {
      answersSection.append(
        el('div', {}, [
          el('div', { class: 'admin-subhead-row' }, [
            el('h3', { class: 'admin-subhead', text: 'Pasangan' }),
            addPair,
          ]),
          pairsBox,
        ]),
      );
    }
    if (TEXT_TYPES.has(type)) answersSection.append(textAnswerSection());
    if (type === 'speaking') {
      answersSection.append(
        el('div', {}, [
          el('h3', { class: 'admin-subhead', text: 'Scene renderer (opsional)' }),
          scene,
          el('p', {
            class: 'form-hint',
            text: 'Hanya dipakai tipe Berbicara. Biarkan {} bila tidak memakai scene khusus.',
          }),
        ]),
      );
    }
    if (!SIMPLIFIED_TYPES.has(type)) answersSection.append(mediaSection());

    // Story, conversation, listening, and token questions read the material
    // first, then the question; the generic types keep the question on top.
    if (
      type === 'story' ||
      type === 'conversation' ||
      type === 'listening' ||
      type === 'word_bank' ||
      type === 'sentence_builder'
    ) {
      bodyFields.insertBefore(materi, promptField);
    } else {
      bodyFields.insertBefore(promptField, materi);
      bodyFields.insertBefore(materi, answersSection);
    }
  }

  const previewRow = el('div', { class: 'admin-preview-row' }, [
    button('Pratinjau soal', 'eye', () => {
      const form = content.closest('form');
      if (form) openPreview(form);
    }),
    el('p', {
      class: 'form-hint',
      text: 'Pratinjau memakai tampilan yang sama dengan halaman belajar.',
    }),
  ]);

  content.append(
    field('Mata pelajaran', subjectSelect),
    subjectHint,
    formGrid([
      field('Tipe soal', typeSelect),
      field('Kesulitan', select('difficulty', [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
      ], item?.difficulty ?? 'beginner')),
      field('Poin', points),
    ]),
    bodyFields,
    field(
      'Instruksi (opsional)',
      instructionInput,
      'Ditampilkan di atas pertanyaan saat pemain mengerjakan soal.',
    ),
    field('Pembahasan (opsional)', explanationInput, 'Muncul setelah pemain menjawab.'),
    field('Hint (opsional)', hintInput, 'Petunjuk kecil yang bisa dibuka pemain.'),
    previewRow,
  );
  bodyFields.append(promptField, materi, answersSection);

  typeSelect.addEventListener('change', () => renderDynamic());
  renderDynamic(true);

  function snapshotOf(form: HTMLFormElement): Snapshot {
    const type = typeSelect.value;
    const options = Array.from(form.querySelectorAll<HTMLElement>('.admin-option-row'))
      .map((row, index) => ({
        label: row.querySelector<HTMLInputElement>('[name=optionLabel]')?.value.trim() ?? '',
        isCorrect: row.querySelector<HTMLInputElement>('[name=optionCorrect]')?.checked ?? false,
        sortOrder: index,
      }))
      .filter((option) => option.label);
    const answers = Array.from(form.querySelectorAll<HTMLElement>('.admin-answer-row'))
      .map((row) => ({
        answer: row.querySelector<HTMLInputElement>('[name=answerValue]')?.value.trim() ?? '',
        isCaseSensitive: row.querySelector<HTMLInputElement>('[name=answerCase]')?.checked ?? false,
      }))
      .filter((answer) => answer.answer);
    const pairs = Array.from(form.querySelectorAll<HTMLElement>('.admin-pair-row'))
      .map((row, index) => ({
        left: row.querySelector<HTMLInputElement>('[name=pairLeft]')?.value.trim() ?? '',
        right: row.querySelector<HTMLInputElement>('[name=pairRight]')?.value.trim() ?? '',
        sortOrder: index,
      }))
      .filter((pair) => pair.left && pair.right);
    const media = Array.from(form.querySelectorAll<HTMLElement>('.admin-media-row'))
      .map((row, index) => ({
        kind: row.querySelector<HTMLSelectElement>('[name=mediaKind]')?.value ?? 'image',
        url: row.querySelector<HTMLInputElement>('[name=mediaUrl]')?.value.trim() ?? '',
        alt: row.querySelector<HTMLInputElement>('[name=mediaAlt]')?.value.trim() ?? '',
        sortOrder: index,
      }))
      .filter((entry) => entry.url);
    const words = Array.from(form.querySelectorAll<HTMLElement>('.admin-word-row'))
      .map((row) => row.querySelector<HTMLInputElement>('[name=wordValue]')?.value.trim() ?? '')
      .filter(Boolean);
    const dialogs = Array.from(form.querySelectorAll<HTMLElement>('.admin-dialog-row'))
      .map((row) => ({
        speaker: row.querySelector<HTMLInputElement>('[name=dialogSpeaker]')?.value.trim() ?? '',
        line: row.querySelector<HTMLInputElement>('[name=dialogLine]')?.value.trim() ?? '',
      }))
      .filter((dialog) => dialog.line);

    return {
      type,
      prompt: prompt.value.trim(),
      instruction: instructionInput.value.trim(),
      explanation: explanationInput.value.trim(),
      hint: hintInput.value.trim(),
      difficulty: valueOf(new FormData(form), 'difficulty'),
      points: numOf(new FormData(form), 'points', 10),
      options,
      answers,
      pairs,
      media,
      words,
      wordAnswer: wordAnswer.value.trim(),
      sentence: sentenceInput.value.trim(),
      dialogs,
      storyTitle: storyTitle.value.trim(),
      storyBody: storyBody.value.trim(),
      audioUrl: audio.url(),
      hasAudio: Boolean(audio.file() || audio.url()),
      transcript: audio.transcript(),
      sceneText: scene.value.trim(),
    };
  }

  function previewOptions(snapshot: Snapshot): Array<{ id: string; label: string }> {
    if (snapshot.type === 'word_bank') {
      return snapshot.words.map((label, index) => ({ id: `word-${index}`, label }));
    }
    if (snapshot.type === 'sentence_builder') {
      return splitSentenceTokens(snapshot.sentence).map((label, index) => ({
        id: `token-${index}`,
        label,
      }));
    }
    return snapshot.options.map((option, index) => ({ id: `option-${index}`, label: option.label }));
  }

  function previewQuestion(snapshot: Snapshot): LessonQuestion {
    const sceneValue = sceneFor(snapshot, legacyScene) as unknown as LessonScene;
    const media =
      snapshot.type === 'listening'
        ? audio.previewUrl()
          ? [
              {
                kind: 'audio' as const,
                url: audio.previewUrl(),
                alt: snapshot.transcript || 'Audio soal',
              },
            ]
          : []
        : snapshot.media.map((entry) => ({
            kind: entry.kind as 'image' | 'audio' | 'video',
            url: entry.url,
            alt: entry.alt,
          }));

    return {
      id: 'preview',
      type: snapshot.type as QuestionType,
      topic: '',
      difficulty: 'beginner',
      instruction: snapshot.instruction,
      prompt: snapshot.prompt,
      hint: null,
      points: snapshot.points,
      options: previewOptions(snapshot),
      leftItems: [],
      rightItems: [],
      media,
      scene: sceneValue,
    };
  }

  function openPreview(form: HTMLFormElement): void {
    const snapshot = snapshotOf(form);
    const issues = problemsOf(snapshot);
    const body = el('div', { class: 'admin-preview-body' });

    if (issues.length > 0) {
      const list = el('ul', { class: 'admin-preview-issues' });
      for (const issue of issues) list.append(el('li', { text: issue }));
      body.append(
        el('div', { class: 'banner banner--warning' }, [
          icon('info', 18),
          el('div', {}, [
            el('p', { class: 'banner__title', text: 'Soal belum lengkap' }),
            el('p', { class: 'banner__body', text: 'Lengkapi bagian berikut sebelum pratinjau:' }),
          ]),
        ]),
        list,
      );
    } else {
      const question = previewQuestion(snapshot);
      const view = createMiniGame(question, () => {});
      body.append(
        el('p', { class: 'play-instruction', text: snapshot.instruction || 'Jawab pertanyaan berikut.' }),
        view.prompt ?? el('h1', { class: 'play-prompt', text: snapshot.prompt }),
        ...(view.ownsMedia
          ? []
          : question.media
              .filter((media) => media.kind === 'image')
              .map((media) =>
                el('img', {
                  class: 'play-media',
                  attrs: { src: media.url, alt: media.alt || 'Ilustrasi soal' },
                }),
              )),
        el('div', { class: 'play-answer' }, [view.answer]),
        el('p', {
          class: 'form-hint',
          text: 'Ini hanya pratinjau. Jawaban belum dikirim dan tidak mengubah progres pemain.',
        }),
      );
    }

    const close = (): void => {
      overlay.remove();
      document.removeEventListener('keydown', onKey, true);
    };
    function onKey(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      close();
    }

    const overlay = el('div', { class: 'admin-dialog' }, [
      el('div', {
        class: 'admin-dialog__backdrop',
        attrs: { 'aria-hidden': 'true' },
        events: { click: close },
      }),
      el('div', {
        class: 'admin-dialog__panel',
        attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Pratinjau soal' },
      }, [
        el('div', { class: 'admin-dialog__head' }, [
          el('div', {}, [
            el('h2', { class: 'admin-dialog__title', text: 'Pratinjau soal' }),
            el('p', {
              class: 'card__subtitle',
              text: `Tampilan ${TYPE_LABELS.get(snapshot.type) ?? snapshot.type} seperti di halaman belajar.`,
            }),
          ]),
          el('button', {
            class: 'icon-btn',
            attrs: { type: 'button', 'aria-label': 'Tutup pratinjau' },
            events: { click: close },
          }, [icon('close', 18)]),
        ]),
        body,
      ]),
    ]);

    document.addEventListener('keydown', onKey, true);
    document.body.append(overlay);
  }

  openDialog({
    title: item ? 'Edit soal' : 'Tambah soal',
    subtitle: item
      ? 'Perubahan langsung dipakai game; level dan progres pemain tetap aman.'
      : 'Pilih mapel, isi soal, lalu simpan. Level baru dibuat otomatis.',
    content,
    submitLabel: item ? 'Simpan soal' : 'Simpan & buat level',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const subjectId = item?.subjectId || valueOf(data, 'subjectId');
      if (!subjectId) throw new Error('Pilih mata pelajaran terlebih dahulu.');
      const snapshot = snapshotOf(form);
      const issues = problemsOf(snapshot);
      if (issues.length > 0) throw new Error(issues[0]);
      if (snapshot.points < 1 || snapshot.points > 1000) {
        throw new Error('Poin harus antara 1 dan 1000.');
      }

      const type = snapshot.type;
      const finalSlug = item?.slug || slugify(snapshot.prompt) || `level-${Date.now()}`;

      let media = snapshot.media;
      if (type === 'listening') {
        let audioUrl = snapshot.audioUrl;
        const file = audio.file();
        if (file) {
          const uploaded = await adminService.uploadMedia(
            file,
            snapshot.transcript || 'Audio soal menyimak',
            null,
            null,
          );
          audioUrl = uploaded.url;
        }
        media = [
          ...(item?.media ?? [])
            .filter((entry) => entry.kind !== 'audio')
            .map((entry, index) => ({
              kind: entry.kind,
              url: entry.url,
              alt: entry.alt,
              sortOrder: index,
            })),
          ...(audioUrl
            ? [{
                kind: 'audio',
                url: audioUrl,
                alt: snapshot.transcript || 'Audio soal menyimak',
                sortOrder: (item?.media ?? []).filter((entry) => entry.kind !== 'audio').length,
              }]
            : []),
        ];
      } else if (SIMPLIFIED_TYPES.has(type)) {
        // The simplified forms do not edit media, so the existing media is kept
        // as-is instead of being wiped when a question is saved again.
        media = (item?.media ?? []).map((entry, index) => ({
          kind: entry.kind,
          url: entry.url,
          alt: entry.alt,
          sortOrder: index,
        }));
      }

      let options = snapshot.options;
      let answers = snapshot.answers;
      if (type === 'word_bank') {
        options = snapshot.words.map((label, index) => ({
          label,
          isCorrect: false,
          sortOrder: index,
        }));
        answers = [{ answer: snapshot.wordAnswer, isCaseSensitive: false }];
      } else if (type === 'sentence_builder') {
        options = splitSentenceTokens(snapshot.sentence).map((label, index) => ({
          label,
          isCorrect: false,
          sortOrder: index,
        }));
        answers = [{ answer: snapshot.sentence, isCaseSensitive: false }];
      }

      const sceneValue = sceneFor(snapshot, legacyScene);
      const shared = {
        ...(item?.id ? { id: item.id } : {}),
        subjectId,
        ...(item?.lessonId ? { lessonId: item.lessonId } : {}),
        slug: finalSlug,
        type,
        difficulty: snapshot.difficulty,
        instruction: snapshot.instruction,
        prompt: snapshot.prompt,
        explanation: snapshot.explanation,
        hint: snapshot.hint,
        points: snapshot.points,
        options,
        answers,
        pairs: snapshot.pairs,
        media,
        scene: sceneValue,
      };

      if (item?.id) {
        await adminService.saveQuestion(shared as unknown as Json, 'Edit dari bank soal admin');
        showToast('Soal diperbarui. Level tetap terhubung.', 'success');
      } else {
        const linked = await adminService.createQuestionLevel(
          shared as unknown as Json,
          'Tambah soal dan level otomatis',
        );
        showToast(`Soal tersimpan sebagai Level ${linked.levelNumber ?? 'baru'}.`, 'success');
      }
      onDone();
    },
  });
}

export function openQuestionById(
  questionId: string,
  subjects: CurriculumSubject[],
  subjectId: string,
  onDone: () => void,
): void {
  void adminService
    .getQuestion(questionId)
    .then((question) => openQuestionEditor(question, subjects, subjectId, onDone))
    .catch((error: unknown) =>
      showToast(error instanceof Error ? error.message : 'Soal gagal dimuat.', 'error'),
    );
}

export async function renderQuestions(ctx: AdminSectionContext): Promise<void> {
  ctx.root.replaceChildren(loading('Memuat bank soal…'));
  try {
    let curriculum = await adminService.getCurriculum();
    const subjects = curriculum.filter((subject) => subject.status !== 'inactive');
    const slot = el('div', {});
    const summary = el('div', { class: 'admin-filters' });
    const state = { subjectId: subjects[0]?.id ?? '', type: '', status: '', search: '', page: 1 };

    const subjectSelect = select(
      'subject',
      subjects.map((subject) => ({
        value: subject.id,
        label: subject.status === 'development' ? `${subject.name} (pengembangan)` : subject.name,
      })),
      state.subjectId,
    );
    const typeSelect = select('type', [{ value: '', label: 'Semua tipe' }, ...TYPES.map(([value, label]) => ({ value, label }))]);
    const statusSelect = select('status', [
      { value: '', label: 'Semua status' },
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Arsip' },
    ]);
    const search = input('search', '', 'search', { placeholder: 'Cari pertanyaan atau topik…' });

    const currentSubject = (): CurriculumSubject | undefined =>
      curriculum.find((subject) => subject.id === state.subjectId);

    const refreshSummary = (): void => {
      const levels = subjectLevels(currentSubject());
      const linked = levels.filter((level) => level.questionId);
      const active = levels.filter((level) => level.isActive && level.questionId);
      summary.replaceChildren(
        el('span', { class: 'badge badge--muted', text: `${levels.length} level` }),
        el('span', { class: 'badge badge--success', text: `${active.length} level aktif` }),
        el('span', { class: 'badge badge--muted', text: `${linked.length} soal terhubung` }),
      );
    };

    const load = async (): Promise<void> => {
      slot.replaceChildren(loading('Memuat soal…'));
      try {
        const result = await adminService.listQuestions(
          null,
          state.subjectId || null,
          state.type,
          state.search,
          state.status,
          state.page,
          20,
        );
        if (result.items.length === 0) {
          slot.replaceChildren(el('p', { class: 'form-hint', text: 'Belum ada soal untuk mata pelajaran ini.' }));
        } else {
          slot.replaceChildren(
            table(
              ['Level', 'Pertanyaan', 'Tipe', 'Status', 'Aksi'],
              result.items.map((question) => [
                question.levelNumber
                  ? el('span', {}, [
                      badge(`Level ${question.levelNumber}`, question.levelActive ? 'ok' : 'muted'),
                      question.levelActive ? null : el('span', { class: 'admin-sub', text: ' nonaktif' }),
                    ])
                  : badge('Latihan', 'muted'),
                el('span', {}, [
                  el('strong', { text: question.prompt.slice(0, 100) }),
                  el('span', {
                    class: 'admin-sub',
                    text: ` ${question.topic || 'Tanpa topik'} · ${question.difficulty}`,
                  }),
                ]),
                TYPE_LABELS.get(question.type) ?? question.type,
                badge(question.isActive ? 'Aktif' : 'Arsip', question.isActive ? 'ok' : 'warn'),
                el('span', { class: 'admin-row-actions' }, [
                  button('Edit', 'settings', () =>
                    openQuestionById(question.id, curriculum, state.subjectId, () => void reloadAll())),
                  button(question.isActive ? 'Arsipkan' : 'Aktifkan', question.isActive ? 'close' : 'check', () => {
                    void (async () => {
                      if (question.isActive) {
                        const detail = await adminService.getQuestion(question.id);
                        const levelText = detail.levelNumber
                          ? ` Level ${detail.levelNumber} akan disembunyikan dari peta, bukan dihapus.`
                          : '';
                        const reason = await askReason(
                          'Arsipkan soal',
                          `Soal “${question.prompt.slice(0, 80)}” akan dinonaktifkan.${levelText} ${
                            detail.attemptCount
                              ? `${detail.attemptCount} jawaban pemain tetap tersimpan.`
                              : 'Riwayat progres pemain tetap aman.'
                          }`,
                          'Arsipkan',
                        );
                        if (!reason) return;
                        await adminService.setQuestionActive(question.id, false, reason);
                      } else {
                        await adminService.setQuestionActive(question.id, true, 'Aktifkan kembali dari bank soal');
                      }
                      showToast('Status soal diperbarui.', 'success');
                      void reloadAll();
                    })().catch((error: unknown) =>
                      showToast(error instanceof Error ? error.message : 'Status gagal diubah.', 'error'));
                  }, question.isActive ? 'danger' : 'secondary'),
                ]),
              ]),
            ),
          );
        }
        const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
        slot.append(
          el('div', { class: 'admin-pagination' }, [
            el('span', { text: `${result.total} soal di bank · halaman ${result.page}/${pages}` }),
            el('span', { class: 'admin-row-actions' }, [
              button('Sebelumnya', 'arrow-left', () => {
                if (state.page > 1) {
                  state.page -= 1;
                  void load();
                }
              }),
              button('Berikutnya', 'arrow-right', () => {
                if (state.page < pages) {
                  state.page += 1;
                  void load();
                }
              }),
            ]),
          ]),
        );
      } catch (error) {
        slot.replaceChildren(errorState(error instanceof Error ? error.message : 'Soal gagal dimuat.', () => void load()));
      }
    };

    const reloadAll = async (): Promise<void> => {
      curriculum = await adminService.getCurriculum();
      refreshSummary();
      await load();
    };

    const apply = (): void => {
      state.subjectId = subjectSelect.value;
      state.type = typeSelect.value;
      state.status = statusSelect.value;
      state.search = search.value.trim();
      state.page = 1;
      refreshSummary();
      void load();
    };
    subjectSelect.addEventListener('change', apply);
    typeSelect.addEventListener('change', apply);
    statusSelect.addEventListener('change', apply);
    search.addEventListener('input', () => {
      window.clearTimeout((search as HTMLInputElement & { timer?: number }).timer);
      (search as HTMLInputElement & { timer?: number }).timer = window.setTimeout(apply, 250);
    });

    refreshSummary();
    ctx.root.replaceChildren(
      panel(
        'Bank soal',
        'Pilih mata pelajaran, lalu kelola soalnya. Simpan soal baru dan levelnya dibuat otomatis.',
        [
          el('div', { class: 'admin-filters' }, [subjectSelect, typeSelect, statusSelect, search]),
          summary,
          el('p', {
            class: 'form-hint',
            text: 'Soal berlabel Latihan tetap tersimpan di bank, tetapi hanya soal yang terhubung ke level yang dihitung di peta dan game.',
          }),
          slot,
        ],
        [
          button('Tambah soal', 'plus', () => {
            if (!state.subjectId) {
              showToast('Pilih mata pelajaran terlebih dahulu.', 'error');
              return;
            }
            openQuestionEditor(null, curriculum, state.subjectId, () => void reloadAll());
          }, 'primary', false),
        ],
      ),
    );
    await load();
  } catch (error) {
    ctx.root.replaceChildren(
      errorState(error instanceof Error ? error.message : 'Bank soal gagal dimuat.', () => void renderQuestions(ctx)),
    );
  }
}
