import { showToast } from '../../components/toast';
import { adminService } from '../../services/admin.service';
import type { CurriculumLesson } from '../../types/admin';
import type { Json } from '../../types/database';
import { el, formatNumber } from '../../utils/dom';
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
  openDialog,
  panel,
  select,
  textarea,
  table,
  valueOf,
  boolOf,
  numOf,
} from './ui';

type CurriculumKind = 'subject' | 'course' | 'level' | 'unit' | 'lesson' | 'node';

function get(item: unknown, key: string): string {
  if (!item || typeof item !== 'object') return '';
  const value = (item as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
}

function getBool(item: unknown, key: string, fallback: boolean): boolean {
  if (!item || typeof item !== 'object') return fallback;
  const value = (item as Record<string, unknown>)[key];
  return typeof value === 'boolean' ? value : fallback;
}

function getNum(item: unknown, key: string, fallback = 0): number {
  if (!item || typeof item !== 'object') return fallback;
  const value = (item as Record<string, unknown>)[key];
  return typeof value === 'number' ? value : fallback;
}

function hidden(name: string, value: string): HTMLInputElement {
  return input(name, value, 'hidden');
}

export function openCurriculumForm(
  kind: CurriculumKind,
  item: Record<string, unknown> | null,
  parentId: string,
  lessons: CurriculumLesson[],
  onDone: () => void,
): void {
  const content = el('div', { class: 'admin-form-grid' });
  const reason = input('reason', '', 'text', {
    minlength: '3',
    maxlength: '160',
    placeholder: 'Contoh: menambah materi baru',
  });
  content.append(hidden('id', get(item, 'id')), field('Alasan perubahan', reason, 'Wajib 3–160 karakter dan masuk audit log.'));

  if (kind === 'subject') {
    content.append(
      formGrid([
        field('Nama mapel', input('name', get(item, 'name'), 'text', { required: true, maxlength: '80' })),
        field('Slug', input('slug', get(item, 'slug'), 'text', { required: true, maxlength: '60' })),
        field('Nama pendek', input('shortName', get(item, 'shortName'))),
        field('Kategori', input('category', get(item, 'category', ) || 'umum')),
        field('Ikon', input('iconKey', get(item, 'iconKey') || 'book')),
        field('Warna aksen', input('accentColor', get(item, 'accentColor') || '#58CC02', 'text', { pattern: '#[0-9A-Fa-f]{6}' })),
        field(
          'Status',
          select(
            'status',
            [
              { value: 'development', label: 'Draft / development' },
              { value: 'active', label: 'Aktif / terbit' },
              { value: 'inactive', label: 'Arsip / nonaktif' },
            ],
            get(item, 'status') || 'development',
          ),
        ),
        field('Urutan', input('sortOrder', getNum(item, 'sortOrder'), 'number', { min: '0' })),
        field('Deskripsi', textarea('description', get(item, 'description'), 3)),
        checkbox('isPrimary', getBool(item, 'isPrimary', false), 'Tampilkan sebagai mata pelajaran utama'),
      ]),
    );
  } else if (kind === 'course') {
    content.append(
      hidden('subjectId', get(item, 'subjectId') || parentId),
      formGrid([
        field('Judul kursus', input('title', get(item, 'title'), 'text', { required: true })),
        field('Slug', input('slug', get(item, 'slug'), 'text', { required: true })),
        field('Kategori', input('category', get(item, 'category') || 'umum')),
        field('Ikon', input('iconKey', get(item, 'iconKey') || 'book')),
        field('Urutan', input('sortOrder', getNum(item, 'sortOrder'), 'number', { min: '0' })),
        field('Deskripsi', textarea('description', get(item, 'description'), 3)),
        checkbox('isPublished', getBool(item, 'isPublished', false), 'Terbitkan kursus'),
      ]),
    );
  } else if (kind === 'level') {
    content.append(
      hidden('courseId', get(item, 'courseId') || parentId),
      formGrid([
        field('Judul level', input('title', get(item, 'title'), 'text', { required: true })),
        field('Slug', input('slug', get(item, 'slug'), 'text', { required: true })),
        field(
          'Kesulitan',
          select(
            'difficulty',
            [
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ],
            get(item, 'difficulty') || 'beginner',
          ),
        ),
        field('Urutan', input('sortOrder', getNum(item, 'sortOrder'), 'number', { min: '0' })),
        field('Deskripsi', textarea('description', get(item, 'description'), 3)),
        checkbox('isPublished', getBool(item, 'isPublished', false), 'Terbitkan level'),
      ]),
    );
  } else if (kind === 'unit') {
    const objectives = Array.isArray(item?.objectives) ? (item?.objectives as string[]).join('\n') : '';
    content.append(
      hidden('levelId', get(item, 'levelId') || parentId),
      formGrid([
        field('Judul unit', input('title', get(item, 'title'), 'text', { required: true })),
        field('Slug', input('slug', get(item, 'slug'), 'text', { required: true })),
        field('Koin hadiah unit', input('rewardCoins', getNum(item, 'rewardCoins'), 'number', { min: '0' })),
        field('Urutan', input('sortOrder', getNum(item, 'sortOrder'), 'number', { min: '0' })),
        field('Tujuan pembelajaran', textarea('objectives', objectives, 4, { placeholder: 'Satu tujuan per baris' })),
        field('Deskripsi', textarea('description', get(item, 'description'), 3)),
        checkbox('isPublished', getBool(item, 'isPublished', false), 'Terbitkan unit'),
      ]),
    );
  } else if (kind === 'lesson') {
    content.append(
      hidden('unitId', get(item, 'unitId') || parentId),
      formGrid([
        field('Judul lesson', input('title', get(item, 'title'), 'text', { required: true })),
        field('Slug', input('slug', get(item, 'slug'), 'text', { required: true })),
        field(
          'Jenis',
          select(
            'kind',
            [
              { value: 'lesson', label: 'Lesson' },
              { value: 'practice', label: 'Practice' },
              { value: 'checkpoint', label: 'Checkpoint' },
              { value: 'legendary', label: 'Legendary' },
            ],
            get(item, 'kind') || 'lesson',
          ),
        ),
        field('Estimasi menit', input('estimatedMinutes', getNum(item, 'estimatedMinutes', 5), 'number', { min: '1', max: '120' })),
        field('XP hadiah', input('xpReward', getNum(item, 'xpReward', 10), 'number', { min: '0' })),
        field('Koin hadiah', input('coinReward', getNum(item, 'coinReward', 2), 'number', { min: '0' })),
        field('Urutan', input('sortOrder', getNum(item, 'sortOrder'), 'number', { min: '0' })),
        field('Deskripsi', textarea('description', get(item, 'description'), 3)),
        checkbox('heartsEnabled', getBool(item, 'heartsEnabled', true), 'Gunakan Heart pada lesson'),
        checkbox('isPublished', getBool(item, 'isPublished', false), 'Terbitkan lesson'),
      ]),
    );
  } else {
    const unitLessons = lessons.filter((lesson) => lesson.id === get(item, 'lessonId') || lesson.unitId === parentId);
    const options = [{ value: '', label: '— Tanpa lesson (reward) —' }];
    for (const lesson of lessons) {
      if (lesson.unitId === parentId || lesson.id === get(item, 'lessonId')) {
        options.push({ value: lesson.id, label: lesson.title });
      }
    }
    content.append(
      hidden('unitId', get(item, 'unitId') || parentId),
      formGrid([
        field('Judul node', input('title', get(item, 'title'), 'text', { required: true })),
        field('Slug', input('slug', get(item, 'slug'), 'text', { required: true })),
        field(
          'Tipe node',
          select(
            'nodeType',
            [
              { value: 'lesson', label: 'Lesson' },
              { value: 'practice', label: 'Practice' },
              { value: 'checkpoint', label: 'Checkpoint' },
              { value: 'legendary', label: 'Legendary' },
              { value: 'reward', label: 'Reward' },
            ],
            get(item, 'nodeType') || 'lesson',
          ),
        ),
        field('Lesson terkait', select('lessonId', options, get(item, 'lessonId'))),
        field('Urutan', input('sortOrder', getNum(item, 'sortOrder'), 'number', { min: '0' })),
        field('Koin reward node', input('rewardCoins', getNum(item, 'rewardCoins'), 'number', { min: '0' })),
        field('XP reward node', input('rewardXp', getNum(item, 'rewardXp'), 'number', { min: '0' })),
        field('Deskripsi', textarea('description', get(item, 'description'), 3)),
        checkbox('isActive', getBool(item, 'isActive', true), 'Node aktif di peta'),
      ]),
      ...(unitLessons.length === 0
        ? [el('p', { class: 'form-hint', text: 'Unit ini belum memiliki lesson. Tambahkan lesson sebelum menghubungkan node.' })]
        : []),
    );
  }

  openDialog({
    title: `${item ? 'Edit' : 'Tambah'} ${kind}`,
    subtitle: 'Perubahan disimpan ke database dan dicatat pada audit log.',
    content,
    submitLabel: item ? 'Simpan perubahan' : 'Tambah',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const reasonText = valueOf(data, 'reason');
      if (reasonText.length < 3) throw new Error('Alasan minimal 3 karakter.');
      const id = valueOf(data, 'id');
      const base: Record<string, unknown> = id ? { id } : {};

      if (kind === 'subject') {
        Object.assign(base, {
          name: valueOf(data, 'name'),
          slug: valueOf(data, 'slug'),
          shortName: valueOf(data, 'shortName'),
          category: valueOf(data, 'category'),
          iconKey: valueOf(data, 'iconKey'),
          accentColor: valueOf(data, 'accentColor'),
          status: valueOf(data, 'status'),
          sortOrder: numOf(data, 'sortOrder'),
          description: valueOf(data, 'description'),
          isPrimary: boolOf(data, 'isPrimary'),
        });
        await adminService.saveSubject(base as Json, reasonText);
      } else if (kind === 'course') {
        Object.assign(base, {
          subjectId: valueOf(data, 'subjectId'),
          title: valueOf(data, 'title'),
          slug: valueOf(data, 'slug'),
          category: valueOf(data, 'category'),
          iconKey: valueOf(data, 'iconKey'),
          sortOrder: numOf(data, 'sortOrder'),
          description: valueOf(data, 'description'),
          isPublished: boolOf(data, 'isPublished'),
        });
        await adminService.saveCourse(base as Json, reasonText);
      } else if (kind === 'level') {
        Object.assign(base, {
          courseId: valueOf(data, 'courseId'),
          title: valueOf(data, 'title'),
          slug: valueOf(data, 'slug'),
          difficulty: valueOf(data, 'difficulty'),
          sortOrder: numOf(data, 'sortOrder'),
          description: valueOf(data, 'description'),
          isPublished: boolOf(data, 'isPublished'),
        });
        await adminService.saveLevel(base as Json, reasonText);
      } else if (kind === 'unit') {
        Object.assign(base, {
          levelId: valueOf(data, 'levelId'),
          title: valueOf(data, 'title'),
          slug: valueOf(data, 'slug'),
          rewardCoins: numOf(data, 'rewardCoins'),
          sortOrder: numOf(data, 'sortOrder'),
          objectives: valueOf(data, 'objectives').split('\n').map((line) => line.trim()).filter(Boolean),
          description: valueOf(data, 'description'),
          isPublished: boolOf(data, 'isPublished'),
        });
        await adminService.saveUnit(base as Json, reasonText);
      } else if (kind === 'lesson') {
        Object.assign(base, {
          unitId: valueOf(data, 'unitId'),
          title: valueOf(data, 'title'),
          slug: valueOf(data, 'slug'),
          kind: valueOf(data, 'kind'),
          estimatedMinutes: numOf(data, 'estimatedMinutes', 5),
          xpReward: numOf(data, 'xpReward', 10),
          coinReward: numOf(data, 'coinReward', 2),
          sortOrder: numOf(data, 'sortOrder'),
          description: valueOf(data, 'description'),
          heartsEnabled: boolOf(data, 'heartsEnabled'),
          isPublished: boolOf(data, 'isPublished'),
        });
        await adminService.saveLesson(base as Json, reasonText);
      } else {
        Object.assign(base, {
          unitId: valueOf(data, 'unitId'),
          title: valueOf(data, 'title'),
          slug: valueOf(data, 'slug'),
          nodeType: valueOf(data, 'nodeType'),
          lessonId: valueOf(data, 'lessonId') || null,
          sortOrder: numOf(data, 'sortOrder'),
          rewardCoins: numOf(data, 'rewardCoins'),
          rewardXp: numOf(data, 'rewardXp'),
          description: valueOf(data, 'description'),
          isActive: boolOf(data, 'isActive'),
        });
        await adminService.saveNode(base as Json, reasonText);
      }
      showToast('Perubahan tersimpan.', 'success');
      onDone();
    },
  });
}

function detailsSummary(
  title: string,
  meta: string,
  actions: HTMLElement[],
  children: HTMLElement[],
): HTMLElement {
  const actionRow = el('span', { class: 'admin-tree__actions' }, actions);
  actionRow.addEventListener('click', (event) => event.stopPropagation());
  const summary = el('summary', { class: 'admin-tree__summary' }, [
    el('span', { class: 'admin-tree__title', text: title }),
    el('span', { class: 'admin-tree__meta', text: meta }),
    actionRow,
  ]);
  return el('details', { class: 'admin-tree__branch' }, [summary, el('div', { class: 'admin-tree__body' }, children)]);
}

export async function renderCurriculum(ctx: AdminSectionContext): Promise<void> {
  ctx.root.replaceChildren(loading('Memuat kurikulum…'));
  try {
    const curriculum = await adminService.getCurriculum();
    const reload = () => void renderCurriculum(ctx);
    const allLessons = curriculum.flatMap((subject) =>
      subject.courses.flatMap((course) =>
        course.levels.flatMap((level) =>
          level.units.flatMap((unit) =>
            unit.lessons.map((lesson) => ({ ...lesson, unitId: unit.id })),
          ),
        ),
      ),
    );
    const tree = el('div', { class: 'admin-tree' });
    const subjectIds = curriculum.map((entry) => entry.id);
    for (const subject of curriculum) {
      const children: HTMLElement[] = [];
      children.push(
        el('div', { class: 'admin-tree__toolbar' }, [
          button('Tambah kursus', 'plus', () =>
            openCurriculumForm('course', null, subject.id, allLessons, reload)),
        ]),
      );
      const courseIds = subject.courses.map((entry) => entry.id);
      for (const [courseIndex, course] of subject.courses.entries()) {
        const courseChildren: HTMLElement[] = [
          el('div', { class: 'admin-tree__toolbar' }, [
            button('Tambah level', 'plus', () =>
              openCurriculumForm('level', null, course.id, allLessons, reload)),
          ]),
        ];
        const levelIds = course.levels.map((entry) => entry.id);
        for (const [levelIndex, level] of course.levels.entries()) {
          const levelChildren: HTMLElement[] = [
            el('div', { class: 'admin-tree__toolbar' }, [
              button('Tambah unit', 'plus', () =>
                openCurriculumForm('unit', null, level.id, allLessons, reload)),
            ]),
          ];
          const unitIds = level.units.map((entry) => entry.id);
          for (const [unitIndex, unit] of level.units.entries()) {
            const unitChildren: HTMLElement[] = [
              el('div', { class: 'admin-tree__toolbar' }, [
                button('Tambah lesson', 'plus', () =>
                  openCurriculumForm('lesson', null, unit.id, allLessons, reload)),
                button('Tambah node', 'plus', () =>
                  openCurriculumForm('node', null, unit.id, allLessons, reload)),
              ]),
            ];
            if (unit.lessons.length > 0) {
              unitChildren.push(
                table(
                  ['Lesson', 'Jenis', 'Soal', 'XP', 'Koin', 'Status', 'Aksi'],
                  unit.lessons.map((lesson, lessonIndex) => [
                    el('span', {}, [
                      el('strong', { text: lesson.title }),
                      el('span', { class: 'admin-sub', text: ` /${lesson.slug}` }),
                    ]),
                    lesson.kind,
                    String(lesson.questionCount),
                    String(lesson.xpReward),
                    String(lesson.coinReward),
                    badge(lesson.isPublished ? 'Terbit' : 'Draft', lesson.isPublished ? 'ok' : 'warn'),
                    el('span', { class: 'admin-row-actions' }, [
                      reorderControls('lesson', unit.lessons.map((entry) => entry.id), lessonIndex, reload),
                      button('Edit', 'settings', () =>
                        openCurriculumForm('lesson', { ...lesson, unitId: unit.id }, unit.id, allLessons, reload)),
                    ]),
                  ]),
                ),
              );
            } else {
              unitChildren.push(el('p', { class: 'form-hint', text: 'Belum ada lesson di unit ini.' }));
            }
            if (unit.nodes.length > 0) {
              unitChildren.push(
                table(
                  ['Node', 'Tipe', 'Lesson', 'Reward', 'Status', 'Aksi'],
                  unit.nodes.map((node, nodeIndex) => [
                    el('span', {}, [
                      el('strong', { text: node.title }),
                      el('span', { class: 'admin-sub', text: ` #${node.sortOrder}` }),
                    ]),
                    node.nodeType,
                    node.lessonTitle ?? '—',
                    node.nodeType === 'reward'
                      ? `${formatNumber(node.rewardCoins)} Koin · ${formatNumber(node.rewardXp)} XP`
                      : '—',
                    badge(node.isActive ? 'Aktif' : 'Nonaktif', node.isActive ? 'ok' : 'muted'),
                    el('span', { class: 'admin-row-actions' }, [
                      reorderControls('node', unit.nodes.map((entry) => entry.id), nodeIndex, reload),
                      button('Edit', 'settings', () =>
                        openCurriculumForm('node', { ...node, unitId: unit.id }, unit.id, allLessons, reload)),
                    ]),
                  ]),
                ),
              );
            }
            levelChildren.push(
              detailsSummary(
                unit.title,
                `${unit.lessons.length} lesson · ${unit.nodes.length} node · ${unit.rewardCoins} Koin`,
                [
                  reorderControls('unit', unitIds, unitIndex, reload),
                  button('Edit unit', 'settings', () =>
                    openCurriculumForm('unit', { ...unit, levelId: level.id }, level.id, allLessons, reload)),
                ],
                unitChildren,
              ),
            );
          }
          courseChildren.push(
            detailsSummary(
              level.title,
              `${level.difficulty} · ${level.units.length} unit`,
              [
                reorderControls('level', levelIds, levelIndex, reload),
                button('Edit level', 'settings', () =>
                  openCurriculumForm('level', { ...level, courseId: course.id }, course.id, allLessons, reload)),
              ],
              levelChildren,
            ),
          );
        }
        children.push(
          detailsSummary(
            course.title,
            `${course.levels.length} level · ${course.isPublished ? 'terbit' : 'draft'}`,
            [
              reorderControls('course', courseIds, courseIndex, reload),
              button('Edit kursus', 'settings', () =>
                openCurriculumForm('course', { ...course, subjectId: subject.id }, subject.id, allLessons, reload)),
            ],
            courseChildren,
          ),
        );
      }
      if (subject.courses.length === 0) {
        children.push(el('p', { class: 'form-hint', text: 'Mapel ini belum punya kursus.' }));
      }
      tree.append(
        detailsSummary(
          subject.name,
          `${subject.status} · ${subject.courses.length} kursus`,
          [
            reorderControls('subject', subjectIds, curriculum.indexOf(subject), reload),
            button('Edit mapel', 'settings', () =>
              openCurriculumForm('subject', { ...subject }, subject.id, allLessons, reload)),
          ],
          children,
        ),
      );
    }

    ctx.root.replaceChildren(
      panel('Struktur pembelajaran', 'Mata pelajaran → kursus → level → unit → lesson → node peta.', [tree], [
        button('Tambah mapel', 'plus', () =>
          openCurriculumForm('subject', null, '', allLessons, reload), 'primary', false),
      ]),
    );
  } catch (error) {
    ctx.root.replaceChildren(
      errorState(error instanceof Error ? error.message : 'Kurikulum gagal dimuat.', () =>
        void renderCurriculum(ctx)),
    );
  }
}

export async function renderMap(ctx: AdminSectionContext): Promise<void> {
  ctx.root.replaceChildren(loading('Memuat peta pembelajaran…'));
  try {
    const curriculum = await adminService.getCurriculum();
    const rows: Array<Array<Node | string>> = [];
    const lessonLists = new Map<string, CurriculumLesson[]>();
    for (const subject of curriculum) {
      for (const course of subject.courses) {
        for (const level of course.levels) {
          for (const unit of level.units) {
            const lessons = unit.lessons.map((lesson) => ({ ...lesson, unitId: unit.id }));
            lessonLists.set(unit.id, lessons);
            for (const node of unit.nodes) {
              rows.push([
                el('span', {}, [
                  el('strong', { text: node.title }),
                  el('span', { class: 'admin-sub', text: ` ${subject.name} / ${level.title} / ${unit.title}` }),
                ]),
                node.nodeType,
                node.lessonTitle ?? '—',
                String(node.sortOrder),
                node.nodeType === 'reward'
                  ? `${formatNumber(node.rewardCoins)} Koin · ${formatNumber(node.rewardXp)} XP`
                  : '—',
                badge(node.isActive ? 'Aktif' : 'Nonaktif', node.isActive ? 'ok' : 'muted'),
                button('Edit', 'settings', () =>
                  openCurriculumForm(
                    'node',
                    { ...node, unitId: unit.id },
                    unit.id,
                    lessonLists.get(unit.id) ?? [],
                    () => void renderMap(ctx),
                  )),
              ]);
            }
          }
        }
      }
    }

    ctx.root.replaceChildren(
      panel('Map editor', 'Node peta dibaca langsung dari learning_nodes yang juga dipakai pemain.', [
        rows.length === 0
          ? el('p', { class: 'form-hint', text: 'Belum ada node.' })
          : table(['Node', 'Tipe', 'Lesson', 'Urutan', 'Reward', 'Status', 'Aksi'], rows),
        el('p', {
          class: 'form-hint',
          text: 'Posisi, jalur, dan animasi peta tetap mengikuti renderer yang sudah ada. Dashboard hanya mengelola data node.',
        }),
      ]),
    );
  } catch (error) {
    ctx.root.replaceChildren(
      errorState(error instanceof Error ? error.message : 'Peta gagal dimuat.', () => void renderMap(ctx)),
    );
  }
}

