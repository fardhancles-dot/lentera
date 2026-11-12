import { showToast } from '../../components/toast';
import { adminService } from '../../services/admin.service';
import type { AdminQuestion, CurriculumSubject } from '../../types/admin';
import type { Json } from '../../types/database';
import { el } from '../../utils/dom';
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
const OPTION_TYPES = new Set(['multiple_choice', 'picture_identification', 'conversation', 'story']);
const PAIR_TYPES = new Set(['matching_pairs']);
const SCENE_TYPES = new Set(['listening', 'speaking', 'conversation', 'story']);

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

export function openQuestionEditor(
  item: AdminQuestion | null,
  subjects: CurriculumSubject[],
  initialSubjectId: string,
  onDone: () => void,
): void {
  const content = el('div', {});
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

  const prompt = textarea('prompt', item?.prompt ?? '', 3, { required: true });
  const typeSelect = select('type', TYPES.map(([value, label]) => ({ value, label })), item?.type ?? 'multiple_choice');
  const points = input('points', item?.points ?? 10, 'number', { min: '1', max: '1000' });
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
  const dynamic = el('div', {});

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
    field('Pertanyaan', prompt),
    dynamic,
    field('Instruksi', input('instruction', item?.instruction ?? '', 'text')),
    field('Pembahasan', textarea('explanation', item?.explanation ?? '', 3)),
    field('Hint', input('hint', item?.hint ?? '', 'text')),
  );

  const addMedia = button('Tambah media', 'plus', () => mediaBox.append(mediaRow()));
  const addOption = button('Tambah pilihan', 'plus', () => optionsBox.append(optionRow()));
  const addAnswer = button('Tambah jawaban', 'plus', () => answersBox.append(answerRow()));
  const addPair = button('Tambah pasangan', 'plus', () => pairsBox.append(pairRow()));

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
          ? [el('p', { class: 'form-hint', text: 'Gunakan __ pada pertanyaan untuk setiap rumpang.' })]
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
    dynamic.append(
      el('div', { class: 'admin-subhead-row' }, [
        el('h3', { class: 'admin-subhead', text: 'Media (opsional)' }),
        addMedia,
      ]),
      mediaBox,
    );
  }

  if (item?.media?.length) {
    for (const media of item.media) mediaBox.append(mediaRow(media.kind, media.url, media.alt));
  }
  typeSelect.addEventListener('change', renderDynamic);
  renderDynamic();

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
      const promptText = valueOf(data, 'prompt');
      if (!promptText) throw new Error('Pertanyaan wajib diisi.');
      const type = valueOf(data, 'type');
      const finalSlug = item?.slug || slugify(promptText) || `level-${Date.now()}`;
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
      if (OPTION_TYPES.has(type) && options.filter((option) => option.isCorrect).length !== 1) {
        throw new Error('Tandai tepat satu pilihan sebagai kunci jawaban.');
      }

      const shared = {
        ...(item?.id ? { id: item.id } : {}),
        subjectId,
        ...(item?.lessonId ? { lessonId: item.lessonId } : {}),
        slug: finalSlug,
        type,
        difficulty: valueOf(data, 'difficulty'),
        instruction: valueOf(data, 'instruction'),
        prompt: promptText,
        explanation: valueOf(data, 'explanation'),
        hint: valueOf(data, 'hint'),
        points: numOf(data, 'points', 10),
        options,
        answers,
        pairs,
        media,
        scene: sceneValue,
      };

      if (item?.id) {
        await adminService.saveQuestion(shared as unknown as Json, 'Edit dari bank soal admin');
        showToast('Soal diperbarui. Level tetap terhubung.', 'success');
      } else {
        const linked = await adminService.createQuestionLevel(shared as unknown as Json, 'Tambah soal dan level otomatis');
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
