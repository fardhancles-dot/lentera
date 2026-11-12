import { showToast } from '../../components/toast';
import { adminService } from '../../services/admin.service';
import type { AdminQuestion, CurriculumSubject } from '../../types/admin';
import type { Json } from '../../types/database';
import { el } from '../../utils/dom';
import { pickMedia } from './media';
import { reorderControls } from './reorder';
import type { AdminSectionContext } from './ui';
import {
  badge,
  button,
  checkbox,
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
  boolOf,
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

const OPTION_TYPES = new Set(['multiple_choice', 'picture_identification', 'conversation', 'story']);
const PAIR_TYPES = new Set(['matching_pairs']);
const SCENE_TYPES = new Set(['listening', 'speaking', 'conversation', 'story']);

interface FlatLesson {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  path: string;
}

function flatten(curriculum: CurriculumSubject[]): FlatLesson[] {
  const rows: FlatLesson[] = [];
  for (const subject of curriculum) {
    for (const course of subject.courses) {
      for (const level of course.levels) {
        for (const unit of level.units) {
          for (const lesson of unit.lessons) {
            rows.push({
              id: lesson.id,
              title: lesson.title,
              subjectId: subject.id,
              subjectName: subject.name,
              path: `${subject.name} / ${level.title} / ${unit.title}`,
            });
          }
        }
      }
    }
  }
  return rows;
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

function optionRow(label = '', correct = false): HTMLElement {
  const radio = el('input', { attrs: { type: 'radio', name: 'optionCorrect' } });
  radio.checked = correct;
  const row = el('div', { class: 'admin-repeater__row admin-option-row' }, [
    el('input', {
      class: 'input',
      attrs: { name: 'optionLabel', placeholder: 'Teks pilihan', value: label },
    }),
    el('label', { class: 'admin-check' }, [radio, el('span', { text: 'Kunci' })]),
  ]);
  row.append(
    el('button', {
      class: 'icon-btn',
      attrs: { type: 'button', 'aria-label': 'Hapus pilihan' },
      events: { click: () => row.remove() },
    }, [el('span', { text: '×' })]),
  );
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
  row.append(
    el('button', {
      class: 'icon-btn',
      attrs: { type: 'button', 'aria-label': 'Hapus jawaban' },
      events: { click: () => row.remove() },
    }, [el('span', { text: '×' })]),
  );
  return row;
}

function pairRow(left = '', right = ''): HTMLElement {
  const row = el('div', { class: 'admin-repeater__row admin-pair-row' }, [
    el('input', { class: 'input', attrs: { name: 'pairLeft', placeholder: 'Kiri', value: left } }),
    el('input', { class: 'input', attrs: { name: 'pairRight', placeholder: 'Kanan', value: right } }),
  ]);
  row.append(
    el('button', {
      class: 'icon-btn',
      attrs: { type: 'button', 'aria-label': 'Hapus pasangan' },
      events: { click: () => row.remove() },
    }, [el('span', { text: '×' })]),
  );
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
  row.append(
    el('button', {
      class: 'icon-btn',
      attrs: { type: 'button', 'aria-label': 'Hapus media' },
      events: { click: () => row.remove() },
    }, [el('span', { text: '×' })]),
  );
  return row;
}

function openQuestionEditor(
  item: AdminQuestion | null,
  lessons: FlatLesson[],
  onDone: () => void,
): void {
  const content = el('div', {});
  const typeOptions = TYPES.map(([value, label]) => ({ value, label }));
  const lessonOptions = lessons.map((lesson) => ({
    value: lesson.id,
    label: `${lesson.path} / ${lesson.title}`,
  }));

  const slug = input('slug', item?.slug ?? '', 'text', { maxlength: '94' });
  const prompt = textarea('prompt', item?.prompt ?? '', 3, { required: true });
  const typeSelect = select('type', typeOptions, item?.type ?? 'multiple_choice');
  const points = input('points', item?.points ?? 10, 'number', { min: '1', max: '1000' });
  const sortOrder = input('sortOrder', item?.sortOrder ?? 0, 'number', { min: '0' });
  const active = checkbox('isActive', item?.isActive ?? true, 'Aktif dan dapat dimainkan');
  const lessonSelect = select('lessonId', [{ value: '', label: '— Pilih lesson —' }, ...lessonOptions], item?.lessonId ?? '');
  const optionsBox = el('div', { class: 'admin-repeater' });
  const answersBox = el('div', { class: 'admin-repeater' });
  const pairsBox = el('div', { class: 'admin-repeater' });
  const mediaBox = el('div', { class: 'admin-repeater' });
  const scene = textarea('scene', JSON.stringify(item?.scene ?? {}, null, 2), 6, {
    placeholder: '{ "speech": "…", "screens": [] }',
  });
  const sceneHint = el('p', {
    class: 'form-hint',
    text: 'Scene JSON mengikuti renderer tipe soal. Percakapan/cerita wajib memiliki screens.',
  });
  const preview = el('div', { class: 'admin-question-preview' });
  const dynamic = el('div', {});

  content.append(
    field('Lesson', lessonSelect),
    formGrid([
      field('Tipe soal', typeSelect),
      field('Slug', slug, 'Kosongkan untuk dibuat otomatis dari pertanyaan.'),
      field('Kesulitan', select('difficulty', [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
      ], item?.difficulty ?? 'beginner')),
      field('Poin', points),
      field('Urutan', sortOrder),
    ]),
    field('Instruksi', input('instruction', item?.instruction ?? '', 'text')),
    field('Pertanyaan / prompt', prompt),
    field('Penjelasan jawaban', textarea('explanation', item?.explanation ?? '', 3)),
    field('Hint', input('hint', item?.hint ?? '', 'text')),
    active,
    dynamic,
    el('div', { class: 'admin-question-preview__head' }, [
      el('strong', { text: 'Pratinjau editor' }),
      el('span', { class: 'form-hint', text: 'Kunci jawaban hanya tampil di dashboard admin.' }),
    ]),
    preview,
  );
  const addMedia = button('Tambah media', 'plus', () => {
    mediaBox.append(mediaRow());
    updatePreview();
  });
  const addOption = button('Tambah pilihan', 'plus', () => {
    optionsBox.append(optionRow());
    updatePreview();
  });
  const addAnswer = button('Tambah jawaban', 'plus', () => {
    answersBox.append(answerRow());
    updatePreview();
  });
  const addPair = button('Tambah pasangan', 'plus', () => {
    pairsBox.append(pairRow());
    updatePreview();
  });

  function renderDynamic(): void {
    const type = typeSelect.value;
    dynamic.replaceChildren();
    if (OPTION_TYPES.has(type)) {
      optionsBox.replaceChildren();
      const existing = item?.options ?? [];
      if (existing.length > 0) {
        for (const option of existing) optionsBox.append(optionRow(option.label, option.isCorrect));
      } else {
        optionsBox.append(optionRow('', true), optionRow());
      }
      dynamic.append(
        el('div', { class: 'admin-subhead-row' }, [
          el('h3', { class: 'admin-subhead', text: 'Pilihan jawaban' }),
          addOption,
        ]),
        el('p', { class: 'form-hint', text: 'Tandai tepat satu pilihan sebagai kunci jawaban.' }),
        optionsBox,
      );
    }
    if (!OPTION_TYPES.has(type) && !PAIR_TYPES.has(type)) {
      answersBox.replaceChildren();
      const existing = item?.answers ?? [];
      if (existing.length > 0) {
        for (const answer of existing) answersBox.append(answerRow(answer.answer, answer.isCaseSensitive));
      } else {
        answersBox.append(answerRow());
      }
      dynamic.append(
        el('div', { class: 'admin-subhead-row' }, [
          el('h3', { class: 'admin-subhead', text: 'Jawaban teks' }),
          addAnswer,
        ]),
        ...(type === 'fill_blank'
          ? [el('p', { class: 'form-hint', text: 'Gunakan __ pada prompt untuk setiap rumpang.' })]
          : []),
        answersBox,
      );
    }
    if (PAIR_TYPES.has(type)) {
      pairsBox.replaceChildren();
      const existing = item?.pairs ?? [];
      if (existing.length > 0) {
        for (const pair of existing) pairsBox.append(pairRow(pair.left, pair.right));
      } else {
        pairsBox.append(pairRow(), pairRow());
      }
      dynamic.append(
        el('div', { class: 'admin-subhead-row' }, [
          el('h3', { class: 'admin-subhead', text: 'Pasangan' }),
          addPair,
        ]),
        pairsBox,
      );
    }
    if (SCENE_TYPES.has(type)) {
      dynamic.append(
        el('h3', { class: 'admin-subhead', text: 'Scene renderer' }),
        scene,
        sceneHint,
      );
    }
    dynamic.append(addMedia, mediaBox);
    updatePreview();
  }

  function updatePreview(): void {
    const promptText = prompt.value.trim() || 'Pertanyaan belum diisi';
    const type = typeSelect.value;
    const box = el('div', { class: 'admin-preview' }, [
      el('span', { class: 'badge badge--muted', text: TYPES.find(([value]) => value === type)?.[1] ?? type }),
      el('p', { class: 'admin-preview__prompt', text: promptText }),
    ]);
    if (OPTION_TYPES.has(type)) {
      const rows = Array.from(optionsBox.querySelectorAll<HTMLElement>('.admin-option-row'));
      box.append(
        el('ul', { class: 'admin-preview__options' }, rows.map((row) => {
          const label = row.querySelector<HTMLInputElement>('[name=optionLabel]')?.value || '—';
          const correct = row.querySelector<HTMLInputElement>('[name=optionCorrect]')?.checked;
          return el('li', {}, [label, correct ? badge('kunci', 'ok') : null]);
        })),
      );
    } else if (PAIR_TYPES.has(type)) {
      const rows = Array.from(pairsBox.querySelectorAll<HTMLElement>('.admin-pair-row'));
      box.append(
        el('ul', { class: 'admin-preview__options' }, rows.map((row) => {
          const left = row.querySelector<HTMLInputElement>('[name=pairLeft]')?.value || '—';
          const right = row.querySelector<HTMLInputElement>('[name=pairRight]')?.value || '—';
          return el('li', { text: `${left} → ${right}` });
        })),
      );
    } else {
      const rows = Array.from(answersBox.querySelectorAll<HTMLElement>('.admin-answer-row'));
      box.append(
        el('p', {
          class: 'form-hint',
          text: `Jawaban diterima: ${rows.map((row) => row.querySelector<HTMLInputElement>('[name=answerValue]')?.value || '—').join(', ')}`,
        }),
      );
    }
    preview.replaceChildren(box);
  }

  if (item?.media?.length) {
    for (const media of item.media) mediaBox.append(mediaRow(media.kind, media.url, media.alt));
  }
  typeSelect.addEventListener('change', renderDynamic);
  content.addEventListener('input', updatePreview);
  renderDynamic();

  openDialog({
    title: item ? 'Edit soal' : 'Tambah soal',
    subtitle: 'Penyimpanan atomik: pertanyaan, pilihan, kunci, pasangan, media, dan audit.',
    content,
    submitLabel: item ? 'Simpan soal' : 'Tambah soal',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const lessonId = valueOf(data, 'lessonId');
      if (!lessonId) throw new Error('Pilih lesson terlebih dahulu.');
      const promptText = valueOf(data, 'prompt');
      if (!promptText) throw new Error('Pertanyaan wajib diisi.');
      const finalSlug = valueOf(data, 'slug') || slugify(promptText) || `soal-${Date.now()}`;
      const type = valueOf(data, 'type');
      const options = Array.from(form.querySelectorAll<HTMLElement>('.admin-option-row')).map((row, index) => ({
        label: row.querySelector<HTMLInputElement>('[name=optionLabel]')?.value.trim() ?? '',
        isCorrect: row.querySelector<HTMLInputElement>('[name=optionCorrect]')?.checked ?? false,
        sortOrder: index,
      })).filter((option) => option.label);
      const answers = Array.from(form.querySelectorAll<HTMLElement>('.admin-answer-row')).map((row) => ({
        answer: row.querySelector<HTMLInputElement>('[name=answerValue]')?.value.trim() ?? '',
        isCaseSensitive: row.querySelector<HTMLInputElement>('[name=answerCase]')?.checked ?? false,
      })).filter((answer) => answer.answer);
      const pairs = Array.from(form.querySelectorAll<HTMLElement>('.admin-pair-row')).map((row, index) => ({
        left: row.querySelector<HTMLInputElement>('[name=pairLeft]')?.value.trim() ?? '',
        right: row.querySelector<HTMLInputElement>('[name=pairRight]')?.value.trim() ?? '',
        sortOrder: index,
      })).filter((pair) => pair.left && pair.right);
      const media = Array.from(form.querySelectorAll<HTMLElement>('.admin-media-row')).map((row, index) => ({
        kind: row.querySelector<HTMLSelectElement>('[name=mediaKind]')?.value ?? 'image',
        url: row.querySelector<HTMLInputElement>('[name=mediaUrl]')?.value.trim() ?? '',
        alt: row.querySelector<HTMLInputElement>('[name=mediaAlt]')?.value.trim() ?? '',
        sortOrder: index,
      })).filter((entry) => entry.url);
      let sceneValue: Json = {};
      try {
        sceneValue = JSON.parse(valueOf(data, 'scene') || '{}') as Json;
      } catch {
        throw new Error('Scene harus berupa JSON yang valid.');
      }
      const payload: Record<string, unknown> = {
        ...(item?.id ? { id: item.id } : {}),
        lessonId,
        slug: finalSlug,
        type,
        difficulty: valueOf(data, 'difficulty'),
        instruction: valueOf(data, 'instruction'),
        prompt: promptText,
        explanation: valueOf(data, 'explanation'),
        hint: valueOf(data, 'hint'),
        points: numOf(data, 'points', 10),
        sortOrder: numOf(data, 'sortOrder'),
        isActive: boolOf(data, 'isActive'),
        options,
        answers,
        pairs,
        media,
        scene: sceneValue,
      };
      await adminService.saveQuestion(payload as Json, 'Simpan dari bank soal admin');
      showToast('Soal tersimpan.', 'success');
      onDone();
    },
  });
}

export async function renderQuestions(ctx: AdminSectionContext): Promise<void> {
  ctx.root.replaceChildren(loading('Memuat bank soal…'));
  try {
    const curriculum = await adminService.getCurriculum();
    const lessons = flatten(curriculum);
    const subjects = curriculum.map((subject) => ({ value: subject.id, label: subject.name }));
    const slot = el('div', {});
    const state = { subjectId: '', lessonId: '', type: '', status: '', search: '', page: 1 };
    const subjectSelect = select('subject', [{ value: '', label: 'Semua mapel' }, ...subjects]);
    const lessonSelect = select('lesson', [{ value: '', label: 'Semua lesson' }, ...lessons.map((lesson) => ({ value: lesson.id, label: lesson.title }))]);
    const typeSelect = select('type', [{ value: '', label: 'Semua tipe' }, ...TYPES.map(([value, label]) => ({ value, label }))]);
    const statusSelect = select('status', [
      { value: '', label: 'Semua status' },
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Arsip' },
    ]);
    const search = input('search', '', 'search', { placeholder: 'Cari pertanyaan, topik, atau slug…' });

    const load = async (): Promise<void> => {
      slot.replaceChildren(loading('Memuat soal…'));
      try {
        const result = await adminService.listQuestions(
          state.lessonId || null,
          state.subjectId || null,
          state.type,
          state.search,
          state.status,
          state.page,
          20,
        );
        if (result.items.length === 0) {
          slot.replaceChildren(el('p', { class: 'form-hint', text: 'Tidak ada soal yang cocok.' }));
        } else {
          slot.replaceChildren(
            table(
              ['Pertanyaan', 'Tipe', 'Lesson', 'Poin', 'Status', 'Aksi'],
              result.items.map((question, index) => [
                el('span', {}, [
                  el('strong', { text: question.prompt.slice(0, 90) }),
                  el('span', { class: 'admin-sub', text: ` ${question.subjectName} · ${question.difficulty}` }),
                ]),
                question.type,
                question.lessonTitle,
                String(question.points),
                badge(question.isActive ? 'Aktif' : 'Arsip', question.isActive ? 'ok' : 'muted'),
                el('span', { class: 'admin-row-actions' }, [
                  state.lessonId && result.total <= result.pageSize
                    ? reorderControls('question', result.items.map((entry) => entry.id), index, () => void load())
                    : null,
                  button('Edit', 'settings', () => {
                    void adminService.getQuestion(question.id)
                      .then((full) => openQuestionEditor(full, lessons, () => void load()))
                      .catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Soal gagal dimuat.', 'error'));
                  }),
                  button(question.isActive ? 'Arsipkan' : 'Aktifkan', question.isActive ? 'close' : 'check', () => {
                    void (async () => {
                      if (question.isActive) {
                        const reason = await askReason('Arsipkan soal', `Soal “${question.prompt.slice(0, 80)}” akan dinonaktifkan. Riwayat attempt tetap tersimpan.`, 'Arsipkan');
                        if (!reason) return;
                        await adminService.setQuestionActive(question.id, false, reason);
                      } else {
                        await adminService.setQuestionActive(question.id, true, 'Aktifkan kembali dari bank soal');
                      }
                      showToast('Status soal diperbarui.', 'success');
                      void load();
                    })().catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Status gagal diubah.', 'error'));
                  }, question.isActive ? 'danger' : 'secondary'),
                ]),
              ]),
            ),
          );
        }
        const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
        slot.append(
          el('div', { class: 'admin-pagination' }, [
            el('span', { text: `${result.total} soal · halaman ${result.page}/${pages}` }),
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

    const apply = () => {
      state.subjectId = subjectSelect.value;
      state.lessonId = lessonSelect.value;
      state.type = typeSelect.value;
      state.status = statusSelect.value;
      state.search = search.value.trim();
      state.page = 1;
      void load();
    };
    subjectSelect.addEventListener('change', apply);
    lessonSelect.addEventListener('change', apply);
    typeSelect.addEventListener('change', apply);
    statusSelect.addEventListener('change', apply);
    search.addEventListener('input', () => {
      window.clearTimeout((search as HTMLInputElement & { timer?: number }).timer);
      (search as HTMLInputElement & { timer?: number }).timer = window.setTimeout(apply, 250);
    });

    ctx.root.replaceChildren(
      panel('Bank soal', 'Semua tipe yang memiliki renderer dan mekanisme penilaian.', [
        el('div', { class: 'admin-filters' }, [subjectSelect, lessonSelect, typeSelect, statusSelect, search]),
        slot,
      ], [
        button('Tambah soal', 'plus', () => openQuestionEditor(null, lessons, () => void load()), 'primary', false),
      ]),
    );
    await load();
  } catch (error) {
    ctx.root.replaceChildren(errorState(error instanceof Error ? error.message : 'Bank soal gagal dimuat.', () => void renderQuestions(ctx)));
  }
}
