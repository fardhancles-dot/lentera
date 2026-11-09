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

export const curriculumRepository = {
  async listSubjects(): Promise<SubjectOverviewRow[]> {
    const { data, error } = await requireSupabase()
      .from('subject_overview')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) raise(error);
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
