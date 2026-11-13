import { curriculumRepository } from '../repositories/curriculum.repository';
import { progressRepository } from '../repositories/progress.repository';
import type {
  CourseRow,
  DifficultyBand,
  LearningNodeRow,
  LessonRow,
  SubjectOverviewRow,
  SubjectRow,
} from '../types/database';
import { resolveNodeStatuses, type LearningNodeStatus } from './learningPath';

export type { LearningNodeStatus } from './learningPath';

export interface SubjectCard extends SubjectOverviewRow {
  completedLessons: number;
  completedLevels: number;
  progressPercent: number;
}

export interface PathNode {
  id: string;
  slug: string;
  title: string;
  description: string;
  nodeType: string;
  lessonId: string | null;
  lessonSlug: string | null;
  questionId: string | null;
  levelNumber: number | null;
  playable: boolean;
  questionCount: number;
  topics: string[];
  questionTypes: string[];
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  rewardCoins: number;
  rewardXp: number;
  rewardClaimed: boolean;
  status: LearningNodeStatus;
}

export interface PathUnit {
  id: string;
  slug: string;
  title: string;
  description: string;
  objectives: string[];
  nodes: PathNode[];
}

export interface PathLevel {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: DifficultyBand;
  nodeCount: number;
  completedCount: number;
  units: PathUnit[];
}

export interface SubjectPath {
  subject: SubjectRow;
  course: CourseRow | null;
  levels: PathLevel[];
  totalNodes: number;
  completedNodes: number;
  questionCount: number;
  developerPreview: boolean;
}

export interface LessonDetail {
  subject: SubjectRow;
  course: CourseRow | null;
  level: {
    slug: string;
    title: string;
    difficulty: DifficultyBand;
  };
  unit: PathUnit;
  node: PathNode;
}

export interface RewardDetail extends LessonDetail {
  level: {
    slug: string;
    title: string;
    difficulty: DifficultyBand;
    nodeCount: number;
    completedCount: number;
  };
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const groupKey = key(item);
    const group = map.get(groupKey);
    if (group) group.push(item);
    else map.set(groupKey, [item]);
  }
  return map;
}

export const curriculumService = {
  async loadCatalog(userId: string): Promise<SubjectCard[]> {
    const [subjects, courseProgress, nodeProgress, levelIndex] = await Promise.all([
      curriculumRepository.listSubjects(),
      progressRepository.listCourseProgress(userId),
      progressRepository.listNodeProgress(userId),
      curriculumRepository.listLevelNodeIndex().catch(() => []),
    ]);

    const progressByCourse = new Map(courseProgress.map((row) => [row.course_id, row]));
    const completedNodeIds = new Set(
      nodeProgress.filter((row) => row.status === 'completed').map((row) => row.node_id),
    );
    const levelsBySubject = new Map<string, string[]>();
    for (const row of levelIndex) {
      const list = levelsBySubject.get(row.subjectId) ?? [];
      list.push(row.nodeId);
      levelsBySubject.set(row.subjectId, list);
    }

    return subjects.map((subject) => {
      const progress = subject.course_id ? progressByCourse.get(subject.course_id) : undefined;
      const indexedLevels = levelsBySubject.get(subject.id);
      const levelCount = indexedLevels?.length ?? subject.level_count;
      const completedLevels = indexedLevels
        ? indexedLevels.filter((id) => completedNodeIds.has(id)).length
        : Math.min(progress?.completed_lessons ?? 0, Math.max(levelCount, 0));

      return {
        ...subject,
        level_count: levelCount,
        question_count: indexedLevels ? levelCount : subject.question_count,
        completedLessons: Math.min(completedLevels, levelCount),
        completedLevels,
        progressPercent:
          levelCount > 0
            ? Math.min(100, Math.round((completedLevels / levelCount) * 100))
            : 0,
      };
    });
  },

  async loadSubjectPath(
    slug: string,
    userId: string,
    options: { developerPreview?: boolean } = {},
  ): Promise<SubjectPath | null> {
    const subject = await curriculumRepository.fetchSubject(slug);
    if (!subject) return null;

    const courses = await curriculumRepository.listCourses(subject.id);
    const course = courses[0] ?? null;

    if (!course) {
      return {
        subject,
        course: null,
        levels: [],
        totalNodes: 0,
        completedNodes: 0,
        questionCount: 0,
        developerPreview: options.developerPreview ?? false,
      };
    }

    const [levels, progressRows, rewardClaims] = await Promise.all([
      curriculumRepository.listLevels([course.id]),
      progressRepository.listNodeProgress(userId),
      progressRepository.listRewardClaims(userId),
    ]);
    const units = await curriculumRepository.listUnits(levels.map((level) => level.id));
    const nodes = await curriculumRepository.listNodes(units.map((unit) => unit.id));

    const lessonIds = nodes
      .map((node) => node.lesson_id)
      .filter((id): id is string => Boolean(id));

    const [lessons, stats] = await Promise.all([
      curriculumRepository.listLessons(lessonIds),
      curriculumRepository.listQuestionStats(lessonIds),
    ]);

    const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
    const statsByLesson = new Map(stats.map((row) => [row.lesson_id, row]));
    const completedNodeIds = new Set(
      progressRows
        .filter((row) => row.status === 'completed')
        .map((row) => row.node_id),
    );
    const startedNodeIds = new Set(
      progressRows
        .filter((row) => row.status === 'in_progress')
        .map((row) => row.node_id),
    );
    const claimedRewardIds = new Set(rewardClaims.map((claim) => claim.node_id));

    const unitsByLevel = groupBy(units, (unit) => unit.course_level_id);
    const nodesByUnit = groupBy(nodes, (node) => node.unit_id);

    // The API returns rows ordered by a single sort_order per table, which is
    // ambiguous across units and levels. Rebuild the adventure order explicitly
    // so the unlock chain always follows level → unit → node.
    const orderedUnits: typeof units = [];
    for (const level of [...levels].sort((a, b) => a.sort_order - b.sort_order)) {
      const levelUnits = (unitsByLevel.get(level.id) ?? []).sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      for (const unit of levelUnits) {
        orderedUnits.push(unit);
      }
    }

    const nodeOrder = new Map<string, number>();
    const orderedNodes: typeof nodes = [];
    for (const unit of orderedUnits) {
      const unitNodes = (nodesByUnit.get(unit.id) ?? []).sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.id.localeCompare(b.id);
      });
      for (const node of unitNodes) {
        nodeOrder.set(node.id, orderedNodes.length);
        orderedNodes.push(node);
      }
    }

    // A level can only play when its own lesson bank has an active question.
    // Empty legacy levels stay visible but must not consume the single
    // "available" slot, otherwise every later level stays locked forever.
    const hasPlayableQuestion = (node: LearningNodeRow): boolean => {
      if (!node.lesson_id) return false;
      if (node.question_id) return true;
      return (statsByLesson.get(node.lesson_id)?.question_count ?? 0) > 0;
    };

    const contentNodes = orderedNodes.filter(hasPlayableQuestion);
    const statuses = resolveNodeStatuses(
      contentNodes.map((node) => node.id),
      completedNodeIds,
      { developerPreview: options.developerPreview, startedNodeIds },
    );
    const statusByNode = new Map(
      contentNodes.map((node, index) => [node.id, statuses[index]!] as const),
    );

    // Checkpoint/reward nodes do not gate progress. A reward opens once every
    // earlier playable lesson is complete, and stays completed after claimed.
    let lastPlayableComplete = true;
    for (const node of orderedNodes) {
      if (node.lesson_id) {
        if (!hasPlayableQuestion(node)) {
          statusByNode.set(node.id, 'locked');
          // The empty level still owns the reward that follows it, so that
          // reward stays locked; later levels remain available because the
          // empty node no longer consumes the unlock chain.
          lastPlayableComplete = false;
          continue;
        }
        lastPlayableComplete = statusByNode.get(node.id) === 'completed';
      } else if (node.node_type === 'reward' && claimedRewardIds.has(node.id)) {
        statusByNode.set(node.id, 'completed');
      } else {
        statusByNode.set(
          node.id,
          lastPlayableComplete
            ? options.developerPreview
              ? 'preview'
              : 'available'
            : 'locked',
        );
      }
    }

    let totalNodes = 0;
    let completedNodes = 0;
    let questionCount = 0;

    const pathLevels: PathLevel[] = [...levels]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((level) => {
        const levelUnits = (unitsByLevel.get(level.id) ?? []).sort(
          (a, b) => a.sort_order - b.sort_order,
        );

        const pathUnits: PathUnit[] = levelUnits.map((unit) => {
          const unitNodes = (nodesByUnit.get(unit.id) ?? [])
            .sort((a, b) => {
              const orderA = nodeOrder.get(a.id) ?? 0;
              const orderB = nodeOrder.get(b.id) ?? 0;
              return orderA - orderB;
            })
            .map((node) =>
              buildPathNode(node, lessonById, statsByLesson, statusByNode, claimedRewardIds),
            );

          for (const node of unitNodes) {
            // Levels without a question are shown on the map as "Belum ada
            // soal", but they do not count toward playable-level progress.
            if (!node.playable || node.questionCount === 0) continue;
            questionCount += node.questionCount;
            totalNodes += 1;
            if (node.status === 'completed') completedNodes += 1;
          }

          return {
            id: unit.id,
            slug: unit.slug,
            title: unit.title,
            description: unit.description,
            objectives: unit.objectives,
            nodes: unitNodes,
          };
        });

        return {
          id: level.id,
          slug: level.slug,
          title: level.title,
          description: level.description,
          difficulty: level.difficulty,
          nodeCount: pathUnits.reduce(
            (sum, unit) =>
              sum +
              unit.nodes.filter((node) => node.playable && node.questionCount > 0).length,
            0,
          ),
          completedCount: pathUnits.reduce(
            (sum, unit) =>
              sum +
              unit.nodes.filter(
                (node) =>
                  node.playable && node.questionCount > 0 && node.status === 'completed',
              ).length,
            0,
          ),
          units: pathUnits,
        };
      });

    return {
      subject,
      course,
      levels: pathLevels,
      totalNodes,
      completedNodes,
      questionCount,
      developerPreview: options.developerPreview ?? false,
    };
  },

  async loadLessonDetail(
    subjectSlug: string,
    lessonSlug: string,
    userId: string,
    options: { developerPreview?: boolean } = {},
  ): Promise<LessonDetail | null> {
    const path = await this.loadSubjectPath(subjectSlug, userId, options);
    if (!path) return null;

    for (const level of path.levels) {
      for (const unit of level.units) {
        const node = unit.nodes.find((item) => item.lessonSlug === lessonSlug);
        if (!node) continue;

        return {
          subject: path.subject,
          course: path.course,
          level: {
            slug: level.slug,
            title: level.title,
            difficulty: level.difficulty,
          },
          unit,
          node,
        };
      }
    }

    return null;
  },

  async loadRewardDetail(
    subjectSlug: string,
    rewardSlug: string,
    userId: string,
    options: { developerPreview?: boolean } = {},
  ): Promise<RewardDetail | null> {
    const path = await this.loadSubjectPath(subjectSlug, userId, options);
    if (!path) return null;

    for (const level of path.levels) {
      for (const unit of level.units) {
        const node = unit.nodes.find(
          (item) => item.nodeType === 'reward' && item.slug === rewardSlug,
        );
        if (!node) continue;

        return {
          subject: path.subject,
          course: path.course,
          level: {
            slug: level.slug,
            title: level.title,
            difficulty: level.difficulty,
            nodeCount: level.nodeCount,
            completedCount: level.completedCount,
          },
          unit,
          node,
        };
      }
    }

    return null;
  },
};

function buildPathNode(
  node: LearningNodeRow,
  lessonById: Map<string, LessonRow>,
  statsByLesson: Map<string, { question_count: number; topics: string[] | null; question_types: string[] | null }>,
  statusByNode: Map<string, LearningNodeStatus>,
  claimedRewardIds: ReadonlySet<string>,
): PathNode {
  const lesson = node.lesson_id ? lessonById.get(node.lesson_id) : undefined;
  const stats = node.lesson_id ? statsByLesson.get(node.lesson_id) : undefined;
  // A linked question is authoritative. Legacy levels created before question
  // links existed still play the first active question from their own lesson
  // bank (the server does the same fallback), so availability must read the
  // bank instead of only the link column.
  const hasPlayableQuestion = Boolean(node.question_id) || (stats?.question_count ?? 0) > 0;

  return {
    id: node.id,
    slug: node.slug,
    title: node.title || lesson?.title || 'Lesson',
    description: node.description || lesson?.description || '',
    nodeType: node.node_type,
    lessonId: node.lesson_id,
    lessonSlug: lesson?.slug ?? null,
    questionId: node.question_id ?? null,
    levelNumber: node.level_number ?? null,
    playable: Boolean(node.lesson_id && lesson),
    // A level plays exactly one question. The rest of a legacy lesson bank
    // stays available to practice/mastery but is not counted as a level.
    questionCount: hasPlayableQuestion ? 1 : 0,
    topics: stats?.topics ?? [],
    questionTypes: stats?.question_types ?? [],
    estimatedMinutes: lesson?.estimated_minutes ?? 0,
    xpReward: lesson?.xp_reward ?? 0,
    coinReward: lesson?.coin_reward ?? 0,
    rewardCoins: node.reward_coins,
    rewardXp: node.reward_xp,
    rewardClaimed: claimedRewardIds.has(node.id),
    status: statusByNode.get(node.id) ?? 'locked',
  };
}
