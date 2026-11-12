import { requireSupabase } from '../services/supabase/client';
import type {
  CourseLevelRow,
  CourseRow,
  LearningNodeRow,
  LessonQuestionStatsRow,
  LessonRow,
  SubjectOverviewRow,
  SubjectRow,
  UnitRow,
} from '../types/database';

function raise(error: { message: string; code?: string } | null): never {
  const wrapped = new Error(error?.message ?? 'Permintaan kurikulum gagal.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function isPermissionError(error: { message: string; code?: string }): boolean {
  return error.code === '42501' || /permission denied/i.test(error.message);
}

// Set once the view rejects the published contract, so a session does not keep
// retrying a known-broken view on every catalog navigation.
let subjectOverviewUnavailable = false;

/**
 * Fallback for databases where `subject_overview` still runs with the caller's
 * privileges (security_invoker) while `questions` is revoked from players.
 * Counts are rebuilt from published curriculum tables plus the safe
 * `lesson_question_stats` view, so no question rows or answer keys are read.
 */
async function listSubjectsFromTables(): Promise<SubjectOverviewRow[]> {
  const supabase = requireSupabase();

  const subjectsResult = await supabase
    .from('subjects')
    .select('*')
    .neq('status', 'inactive')
    .order('sort_order', { ascending: true });
  if (subjectsResult.error) raise(subjectsResult.error);
  const subjects = subjectsResult.data ?? [];
  if (subjects.length === 0) return [];

  const coursesResult = await supabase
    .from('courses')
    .select('id, subject_id')
    .in(
      'subject_id',
      subjects.map((subject) => subject.id),
    )
    .eq('is_published', true);
  if (coursesResult.error) raise(coursesResult.error);
  const courses = coursesResult.data ?? [];

  const courseIds = unique(courses.map((course) => course.id));
  const levelsResult = courseIds.length
    ? await supabase
        .from('course_levels')
        .select('id, course_id')
        .in('course_id', courseIds)
        .eq('is_published', true)
    : { data: [], error: null };
  if (levelsResult.error) raise(levelsResult.error);
  const levels = levelsResult.data ?? [];

  const levelIds = unique(levels.map((level) => level.id));
  const unitsResult = levelIds.length
    ? await supabase
        .from('units')
        .select('id, course_level_id')
        .in('course_level_id', levelIds)
        .eq('is_published', true)
    : { data: [], error: null };
  if (unitsResult.error) raise(unitsResult.error);
  const units = unitsResult.data ?? [];

  const unitIds = unique(units.map((unit) => unit.id));
  const lessonsResult = unitIds.length
    ? await supabase
        .from('lessons')
        .select('id, unit_id')
        .in('unit_id', unitIds)
        .eq('is_published', true)
    : { data: [], error: null };
  if (lessonsResult.error) raise(lessonsResult.error);
  const lessons = lessonsResult.data ?? [];

  const lessonIds = unique(lessons.map((lesson) => lesson.id));
  const statsResult = lessonIds.length
    ? await supabase
        .from('lesson_question_stats')
        .select('lesson_id, question_count')
        .in('lesson_id', lessonIds)
    : { data: [], error: null };
  if (statsResult.error) raise(statsResult.error);
  const stats = statsResult.data ?? [];

  const levelsByCourse = new Map<string, string[]>();
  for (const level of levels) {
    const list = levelsByCourse.get(level.course_id) ?? [];
    list.push(level.id);
    levelsByCourse.set(level.course_id, list);
  }

  const unitsByLevel = new Map<string, string[]>();
  for (const unit of units) {
    const list = unitsByLevel.get(unit.course_level_id) ?? [];
    list.push(unit.id);
    unitsByLevel.set(unit.course_level_id, list);
  }

  const lessonsByUnit = new Map<string, string[]>();
  for (const lesson of lessons) {
    const list = lessonsByUnit.get(lesson.unit_id) ?? [];
    list.push(lesson.id);
    lessonsByUnit.set(lesson.unit_id, list);
  }

  const statsByLesson = new Map(
    stats.map((row) => [row.lesson_id, row.question_count] as const),
  );

  const coursesBySubject = new Map<string, string[]>();
  for (const course of courses) {
    const list = coursesBySubject.get(course.subject_id) ?? [];
    list.push(course.id);
    coursesBySubject.set(course.subject_id, list);
  }

  const rows: SubjectOverviewRow[] = [];
  for (const subject of subjects) {
    const subjectCourses = coursesBySubject.get(subject.id) ?? [];
    const courseSlots: Array<string | null> = subjectCourses.length
      ? subjectCourses
      : [null];

    for (const courseId of courseSlots) {
      const courseLevels = courseId ? (levelsByCourse.get(courseId) ?? []) : [];
      const courseUnits = courseLevels.flatMap(
        (levelId) => unitsByLevel.get(levelId) ?? [],
      );
      const courseLessons = courseUnits.flatMap(
        (unitId) => lessonsByUnit.get(unitId) ?? [],
      );

      rows.push({
        id: subject.id,
        slug: subject.slug,
        name: subject.name,
        short_name: subject.short_name,
        description: subject.description,
        category: subject.category,
        icon_key: subject.icon_key,
        accent_color: subject.accent_color,
        status: subject.status,
        is_primary: subject.is_primary,
        sort_order: subject.sort_order,
        course_id: courseId,
        level_count: courseLevels.length,
        unit_count: courseUnits.length,
        lesson_count: courseLessons.length,
        question_count: courseLessons.reduce(
          (sum, lessonId) => sum + (statsByLesson.get(lessonId) ?? 0),
          0,
        ),
      });
    }
  }

  return rows;
}

export const curriculumRepository = {
  async listSubjects(): Promise<SubjectOverviewRow[]> {
    if (subjectOverviewUnavailable) return listSubjectsFromTables();

    const { data, error } = await requireSupabase()
      .from('subject_overview')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      if (!isPermissionError(error)) raise(error);
      subjectOverviewUnavailable = true;
      console.warn(
        '[curriculum] subject_overview ditolak, memakai agregat tabel:',
        error.message,
      );
      return listSubjectsFromTables();
    }

    return data;
  },

  async fetchSubject(slug: string): Promise<SubjectRow | null> {
    const { data, error } = await requireSupabase()
      .from('subjects')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) raise(error);
    return data;
  },

  async listCourses(subjectId: string): Promise<CourseRow[]> {
    const { data, error } = await requireSupabase()
      .from('courses')
      .select('*')
      .eq('subject_id', subjectId)
      .order('sort_order', { ascending: true });
    if (error) raise(error);
    return data;
  },

  async listLevels(courseIds: string[]): Promise<CourseLevelRow[]> {
    const ids = unique(courseIds);
    if (ids.length === 0) return [];
    const { data, error } = await requireSupabase()
      .from('course_levels')
      .select('*')
      .in('course_id', ids)
      .order('sort_order', { ascending: true });
    if (error) raise(error);
    return data;
  },

  async listUnits(levelIds: string[]): Promise<UnitRow[]> {
    const ids = unique(levelIds);
    if (ids.length === 0) return [];
    const { data, error } = await requireSupabase()
      .from('units')
      .select('*')
      .in('course_level_id', ids)
      .order('sort_order', { ascending: true });
    if (error) raise(error);
    return data;
  },

  async listNodes(unitIds: string[]): Promise<LearningNodeRow[]> {
    const ids = unique(unitIds);
    if (ids.length === 0) return [];
    const { data, error } = await requireSupabase()
      .from('learning_nodes')
      .select('*')
      .in('unit_id', ids)
      .order('sort_order', { ascending: true });
    if (error) raise(error);
    return data;
  },

  async listLessons(lessonIds: string[]): Promise<LessonRow[]> {
    const ids = unique(lessonIds);
    if (ids.length === 0) return [];
    const { data, error } = await requireSupabase()
      .from('lessons')
      .select('*')
      .in('id', ids)
      .order('sort_order', { ascending: true });
    if (error) raise(error);
    return data;
  },

  /** Playable levels keyed by subject, used for catalog progress. */
  async listLevelNodeIndex(): Promise<Array<{ subjectId: string; nodeId: string }>> {
    const supabase = requireSupabase();
    const coursesResult = await supabase
      .from('courses')
      .select('id, subject_id')
      .eq('is_published', true);
    if (coursesResult.error) raise(coursesResult.error);
    const courses = coursesResult.data ?? [];
    if (courses.length === 0) return [];

    const courseToSubject = new Map(courses.map((course) => [course.id, course.subject_id]));
    const levelsResult = await supabase
      .from('course_levels')
      .select('id, course_id')
      .in('course_id', [...courseToSubject.keys()])
      .eq('is_published', true);
    if (levelsResult.error) raise(levelsResult.error);
    const levels = levelsResult.data ?? [];
    if (levels.length === 0) return [];

    const levelToCourse = new Map(levels.map((level) => [level.id, level.course_id]));
    const unitsResult = await supabase
      .from('units')
      .select('id, course_level_id')
      .in('course_level_id', [...levelToCourse.keys()])
      .eq('is_published', true);
    if (unitsResult.error) raise(unitsResult.error);
    const units = unitsResult.data ?? [];
    if (units.length === 0) return [];

    const unitToLevel = new Map(units.map((unit) => [unit.id, unit.course_level_id]));
    const nodesResult = await supabase
      .from('learning_nodes')
      .select('id, unit_id, question_id')
      .in('unit_id', [...unitToLevel.keys()])
      .eq('is_active', true)
      .not('question_id', 'is', null);
    if (nodesResult.error) raise(nodesResult.error);

    const rows: Array<{ subjectId: string; nodeId: string }> = [];
    for (const node of nodesResult.data ?? []) {
      const levelId = unitToLevel.get(node.unit_id);
      const courseId = levelId ? levelToCourse.get(levelId) : undefined;
      const subjectId = courseId ? courseToSubject.get(courseId) : undefined;
      if (subjectId) rows.push({ subjectId, nodeId: node.id });
    }
    return rows;
  },

  async listQuestionStats(lessonIds: string[]): Promise<LessonQuestionStatsRow[]> {
    const ids = unique(lessonIds);
    if (ids.length === 0) return [];
    const { data, error } = await requireSupabase()
      .from('lesson_question_stats')
      .select('*')
      .in('lesson_id', ids);
    if (error) raise(error);
    return data;
  },
};
