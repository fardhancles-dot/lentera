import { adminRepository } from '../repositories/admin.repository';
import type { AppRole, Json } from '../types/database';
import type {
  AdminAnalytics,
  AdminAnnouncement,
  AdminAuditEntry,
  AdminContentHealth,
  AdminContentPage,
  AdminContext,
  AdminFriendQuest,
  AdminGamification,
  AdminMediaItem,
  AdminOverview,
  AdminPageResult,
  AdminQuestion,
  AdminQuestionListItem,
  AdminSiteSettings,
  AdminSocialLink,
  AdminUser,
  AdminUserDetail,
  CurriculumSubject,
} from '../types/admin';

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Sesi berakhir. Masuk kembali untuk melanjutkan.',
  staff_required: 'Halaman ini hanya untuk staf Lentera.',
  admin_permission_denied: 'Role kamu tidak memiliki izin untuk tindakan ini.',
  player_not_found: 'Pengguna tidak ditemukan.',
  subject_not_found: 'Mata pelajaran tidak ditemukan.',
  course_not_found: 'Kursus tidak ditemukan.',
  level_not_found: 'Level tidak ditemukan.',
  unit_not_found: 'Unit tidak ditemukan.',
  lesson_not_found: 'Lesson tidak ditemukan.',
  question_not_found: 'Soal tidak ditemukan.',
  question_prompt_required: 'Pertanyaan wajib diisi.',
  question_options_required: 'Tipe soal ini membutuhkan minimal dua pilihan.',
  question_exactly_one_correct: 'Tepat satu pilihan harus menjadi kunci jawaban.',
  question_answers_required: 'Jawaban teks wajib diisi.',
  question_pairs_required: 'Soal mencocokkan membutuhkan minimal dua pasangan.',
  question_image_required: 'Soal identifikasi gambar membutuhkan gambar.',
  question_audio_or_speech_required: 'Soal listening membutuhkan audio atau transkrip.',
  question_scene_screens_required: 'Soal percakapan/cerita membutuhkan minimal satu layar scene.',
  question_blank_required: 'Soal isian harus memuat __ pada pertanyaan.',
  slug_invalid: 'Slug hanya boleh huruf kecil, angka, dan tanda hubung.',
  title_invalid: 'Judul wajib diisi.',
  name_invalid: 'Nama harus 2–80 karakter.',
  reason_invalid: 'Alasan wajib 3–160 karakter.',
  target_invalid: 'Target tidak valid.',
  metric_invalid: 'Metric tidak didukung mesin gamifikasi.',
  cadence_invalid: 'Cadence harus daily atau weekly.',
  item_kind_invalid: 'Jenis item toko tidak didukung.',
  price_invalid: 'Harga tidak boleh negatif.',
  max_stack_invalid: 'Batas tumpukan harus 1–20.',
  xp_threshold_not_increasing: 'Ambang XP harus naik dibanding level sebelumnya dan berikutnya.',
  level_one_xp_invalid: 'Level 1 harus mulai dari 0 XP.',
  tier_invalid: 'Tier liga harus 1–10.',
  accent_invalid: 'Warna aksen harus format #RRGGBB.',
  event_dates_invalid: 'Waktu selesai harus setelah waktu mulai.',
  completed_quest_locked: 'Friend Quest yang sudah selesai tidak dapat diubah.',
  media_alt_required: 'Alt text wajib untuk gambar.',
  media_type_forbidden: 'Tipe file ini ditolak karena tidak aman.',
  media_type_invalid: 'Tipe file tidak sesuai jenis media.',
  media_size_invalid: 'Ukuran media maksimal 20 MB.',
  media_path_required: 'File media belum diunggah.',
  site_name_required: 'Nama website wajib diisi.',
  color_invalid: 'Warna harus format #RRGGBB.',
  page_status_invalid: 'Status halaman tidak valid.',
  content_block_invalid: 'Blok konten tidak valid.',
  registration_disabled: 'Registrasi sedang dinonaktifkan.',
  broadcast_title_invalid: 'Judul harus 3–80 karakter.',
  broadcast_body_invalid: 'Isi maksimal 300 karakter.',
  broadcast_link_invalid: 'Tautan harus path internal yang diawali /.',
  audience_invalid: 'Audiens tidak valid.',
};

function messageFor(error: unknown): Error {
  const raw = error instanceof Error ? error.message : 'Aksi admin gagal.';
  const key = Object.keys(ERROR_MESSAGES).find((candidate) => raw.includes(candidate));
  return new Error(key ? ERROR_MESSAGES[key]! : raw);
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function role(value: unknown): AppRole {
  return value === 'admin' || value === 'developer' ? value : 'player';
}

function json(value: unknown): Json {
  if (value === null || typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(json);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(record(value)).map(([key, item]) => [key, json(item)]));
  }
  return {};
}

async function run<T>(task: () => Promise<Json>, parse: (value: Json) => T): Promise<T> {
  try {
    return parse(await task());
  } catch (error) {
    throw messageFor(error);
  }
}

function parseContext(value: Json): AdminContext {
  const data = record(value);
  return {
    role: role(data.role),
    isDeveloper: bool(data.isDeveloper),
    permissions: array(data.permissions).filter((item): item is string => typeof item === 'string'),
    catalog: array(data.catalog).map((item) => {
      const entry = record(item);
      return {
        code: str(entry.code),
        label: str(entry.label),
        group: str(entry.group),
        sortOrder: num(entry.sortOrder),
      };
    }),
  };
}

function parseOverview(value: Json): AdminOverview {
  const data = record(value);
  const players = record(data.players);
  const activity = record(data.activity);
  const content = record(data.content);
  return {
    players: {
      total: num(players.total),
      onboarded: num(players.onboarded),
      staff: num(players.staff),
      new7d: num(players.new7d),
    },
    activity: {
      lessonsCompleted: num(activity.lessonsCompleted),
      practicesCompleted: num(activity.practicesCompleted),
      xpAwarded: num(activity.xpAwarded),
      coinsCirculating: num(activity.coinsCirculating),
      activeStreaks: num(activity.activeStreaks),
    },
    content: {
      subjects: num(content.subjects),
      lessons: num(content.lessons),
      questions: num(content.questions),
      nodes: num(content.nodes),
    },
    auditEntries: num(data.auditEntries),
    daily: array(data.daily).map((item) => {
      const day = record(item);
      return {
        date: str(day.date),
        users: num(day.users),
        lessons: num(day.lessons),
        practices: num(day.practices),
        xp: num(day.xp),
      };
    }),
    warnings: array(data.warnings).map((item) => {
      const warning = record(item);
      return { code: str(warning.code), label: str(warning.label), count: num(warning.count) };
    }),
    drafts: record(data.drafts) as Record<string, number>,
  };
}

function parseUser(value: unknown): AdminUser {
  const data = record(value);
  return {
    userId: str(data.userId),
    email: str(data.email),
    username: str(data.username, 'pemain'),
    displayName: str(data.displayName, 'Pemain'),
    avatarKey: str(data.avatarKey, 'sprout'),
    role: role(data.role),
    onboardingCompleted: bool(data.onboardingCompleted),
    totalXp: num(data.totalXp),
    coins: num(data.coins),
    joinedAt: str(data.joinedAt),
  };
}

function parseUserDetail(value: Json): AdminUserDetail {
  const data = record(value);
  const user = record(data.user);
  const counts = record(data.counts);
  return {
    ...parseUser(user),
    bio: str(user.bio),
    level: 1,
    hearts: num(user.hearts),
    maxHearts: num(user.maxHearts),
    streak: num(user.streak),
    longestStreak: num(user.longestStreak),
    lessonsCompleted: num(counts.lessonsCompleted),
    questionsAnswered: num(counts.questionsAnswered),
    correctAnswers: 0,
    achievements: 0,
    friendCount: num(counts.friendQuests),
    recentXp: array(data.xpHistory).map((item) => {
      const entry = record(item);
      return { amount: num(entry.amount), source: str(entry.source), createdAt: str(entry.createdAt) };
    }),
    recentCoins: array(data.coinHistory).map((item) => {
      const entry = record(item);
      return { amount: num(entry.amount), source: str(entry.source), createdAt: str(entry.createdAt) };
    }),
    settings: record(data.settings),
  };
}

function parseOthers<T>(parse: (value: unknown) => T) {
  return (value: Json): T[] => array(value).map(parse);
}

function parseQuestionItem(value: unknown): AdminQuestionListItem {
  const data = record(value);
  return {
    id: str(data.id),
    lessonId: str(data.lessonId),
    lessonTitle: str(data.lessonTitle),
    subjectId: str(data.subjectId),
    subjectName: str(data.subjectName),
    type: str(data.type, 'multiple_choice'),
    topic: str(data.topic),
    difficulty: str(data.difficulty, 'beginner'),
    prompt: str(data.prompt),
    points: num(data.points, 10),
    isActive: bool(data.isActive, true),
    sortOrder: num(data.sortOrder),
    updatedAt: str(data.updatedAt),
  };
}

function parseQuestion(value: Json): AdminQuestion {
  const data = record(value);
  return {
    ...parseQuestionItem({
      ...data,
      lessonTitle: '',
      subjectId: '',
      subjectName: '',
      updatedAt: '',
    }),
    slug: str(data.slug),
    instruction: str(data.instruction),
    explanation: str(data.explanation),
    hint: typeof data.hint === 'string' ? data.hint : null,
    scene: record(data.scene),
    options: array(data.options).map((item) => {
      const option = record(item);
      return {
        id: str(option.id),
        label: str(option.label),
        isCorrect: bool(option.isCorrect),
        sortOrder: num(option.sortOrder),
      };
    }),
    answers: array(data.answers).map((item) => {
      const answer = record(item);
      return {
        id: str(answer.id),
        answer: str(answer.answer),
        isCaseSensitive: bool(answer.isCaseSensitive),
      };
    }),
    pairs: array(data.pairs).map((item) => {
      const pair = record(item);
      return {
        leftId: str(pair.leftId),
        left: str(pair.left),
        rightId: str(pair.rightId),
        right: str(pair.right),
        sortOrder: num(pair.sortOrder),
      };
    }),
    media: array(data.media).map((item) => {
      const media = record(item);
      return {
        id: str(media.id),
        kind: str(media.kind),
        url: str(media.url),
        alt: str(media.alt),
        sortOrder: num(media.sortOrder),
      };
    }),
  };
}

function parseCurriculum(value: Json): CurriculumSubject[] {
  return array(value).map((item) => {
    const subject = record(item);
    return {
      id: str(subject.id),
      slug: str(subject.slug),
      name: str(subject.name),
      shortName: typeof subject.shortName === 'string' ? subject.shortName : null,
      description: str(subject.description),
      category: str(subject.category),
      iconKey: str(subject.iconKey, 'book'),
      accentColor: str(subject.accentColor, '#58CC02'),
      status: str(subject.status, 'development'),
      isPrimary: bool(subject.isPrimary),
      sortOrder: num(subject.sortOrder),
      courses: array(subject.courses).map((courseValue) => {
        const course = record(courseValue);
        return {
          id: str(course.id),
          slug: str(course.slug),
          title: str(course.title),
          description: str(course.description),
          category: str(course.category),
          iconKey: str(course.iconKey, 'book'),
          sortOrder: num(course.sortOrder),
          isPublished: bool(course.isPublished),
          levels: array(course.levels).map((levelValue) => {
            const level = record(levelValue);
            return {
              id: str(level.id),
              slug: str(level.slug),
              title: str(level.title),
              description: str(level.description),
              difficulty: str(level.difficulty, 'beginner'),
              sortOrder: num(level.sortOrder),
              isPublished: bool(level.isPublished),
              units: array(level.units).map((unitValue) => {
                const unit = record(unitValue);
                return {
                  id: str(unit.id),
                  slug: str(unit.slug),
                  title: str(unit.title),
                  description: str(unit.description),
                  objectives: array(unit.objectives).filter(
                    (objective): objective is string => typeof objective === 'string',
                  ),
                  rewardCoins: num(unit.rewardCoins),
                  sortOrder: num(unit.sortOrder),
                  isPublished: bool(unit.isPublished),
                  nodes: array(unit.nodes).map((nodeValue) => {
                    const node = record(nodeValue);
                    return {
                      id: str(node.id),
                      slug: str(node.slug),
                      title: str(node.title),
                      description: str(node.description),
                      nodeType: str(node.nodeType, 'lesson'),
                      lessonId: typeof node.lessonId === 'string' ? node.lessonId : null,
                      lessonTitle:
                        typeof node.lessonTitle === 'string' ? node.lessonTitle : null,
                      sortOrder: num(node.sortOrder),
                      isActive: bool(node.isActive, true),
                      rewardCoins: num(node.rewardCoins),
                      rewardXp: num(node.rewardXp),
                    };
                  }),
                  lessons: array(unit.lessons).map((lessonValue) => {
                    const lesson = record(lessonValue);
                    return {
                      id: str(lesson.id),
                      slug: str(lesson.slug),
                      title: str(lesson.title),
                      description: str(lesson.description),
                      kind: str(lesson.kind, 'lesson'),
                      estimatedMinutes: num(lesson.estimatedMinutes, 5),
                      xpReward: num(lesson.xpReward, 10),
                      coinReward: num(lesson.coinReward, 2),
                      heartsEnabled: bool(lesson.heartsEnabled, true),
                      sortOrder: num(lesson.sortOrder),
                      isPublished: bool(lesson.isPublished),
                      questionCount: num(lesson.questionCount),
                      nodes: array(lesson.nodes).map(record),
                    };
                  }),
                };
              }),
            };
          }),
        };
      }),
    };
  });
}

function parseMedia(value: unknown): AdminMediaItem {
  const data = record(value);
  return {
    id: str(data.id),
    storagePath: str(data.storagePath),
    url: str(data.url),
    kind: str(data.kind),
    mimeType: str(data.mimeType),
    sizeBytes: num(data.sizeBytes),
    width: typeof data.width === 'number' ? data.width : null,
    height: typeof data.height === 'number' ? data.height : null,
    altText: str(data.altText),
    status: str(data.status, 'active'),
    createdAt: str(data.createdAt),
  };
}

function parseSiteSettings(value: Json): AdminSiteSettings {
  const data = record(value);
  return {
    siteName: str(data.site_name, 'Lentera'),
    tagline: str(data.tagline),
    description: str(data.description),
    copyright: str(data.copyright),
    supportUrl: str(data.support_url),
    primaryColor: str(data.primary_color, '#58CC02'),
    faviconUrl: str(data.favicon_url),
    logoUrl: str(data.logo_url),
    heroTitle: str(data.hero_title),
    heroDescription: str(data.hero_description),
    heroCtaLabel: str(data.hero_cta_label),
    heroCtaHref: str(data.hero_cta_href),
    footerText: str(data.footer_text),
    maintenanceMode: bool(data.maintenance_mode),
    registrationEnabled: bool(data.registration_enabled, true),
    updatedAt: str(data.updated_at),
  };
}

function parsePage(value: unknown): AdminContentPage {
  const data = record(value);
  return {
    id: str(data.id),
    slug: str(data.slug),
    title: str(data.title),
    summary: str(data.summary),
    blocks: array(data.blocks).map(record),
    status: str(data.status, 'draft'),
    metaTitle: str(data.metaTitle),
    metaDescription: str(data.metaDescription),
    updatedAt: str(data.updatedAt),
  };
}

function parseAnnouncement(value: unknown): AdminAnnouncement {
  const data = record(value);
  return {
    id: str(data.id),
    title: str(data.title),
    body: str(data.body),
    link: str(data.link),
    audience: str(data.audience, 'onboarded'),
    startsAt: str(data.startsAt),
    endsAt: typeof data.endsAt === 'string' ? data.endsAt : null,
    isActive: bool(data.isActive, true),
    createdAt: str(data.createdAt),
  };
}

function parseGamification(value: Json): AdminGamification {
  const data = record(value);
  const catalog = (key: string) => array(data[key]).map(record);
  return {
    quests: catalog('quests'),
    achievements: catalog('achievements'),
    shopItems: catalog('shopItems'),
    playerLevels: catalog('playerLevels'),
    streakMilestones: catalog('streakMilestones'),
    leagueTiers: catalog('leagueTiers'),
    events: catalog('events'),
    heartSettings: record(data.heartSettings),
  };
}

function parseSocial(value: unknown): AdminSocialLink {
  const data = record(value);
  return {
    id: str(data.id),
    status: str(data.status),
    requesterId: str(data.requesterId),
    requesterUsername: str(data.requesterUsername),
    requesterName: str(data.requesterName),
    addresseeId: str(data.addresseeId),
    addresseeUsername: str(data.addresseeUsername),
    addresseeName: str(data.addresseeName),
    createdAt: str(data.createdAt),
    respondedAt: typeof data.respondedAt === 'string' ? data.respondedAt : null,
  };
}

function parseFriendQuest(value: unknown): AdminFriendQuest {
  const data = record(value);
  return {
    id: str(data.id),
    code: str(data.code),
    title: str(data.title),
    status: str(data.status),
    targetXp: num(data.targetXp),
    rewardXp: num(data.rewardXp),
    rewardCoins: num(data.rewardCoins),
    memberCount: num(data.memberCount),
    totalXp: num(data.totalXp),
    startsAt: str(data.startsAt),
    endsAt: str(data.endsAt),
    createdAt: str(data.createdAt),
  };
}

function parseAudit(value: unknown): AdminAuditEntry {
  const data = record(value);
  return {
    id: str(data.id),
    actorId: typeof data.actorId === 'string' ? data.actorId : null,
    actorName: str(data.actorName, 'Sistem'),
    actorUsername: str(data.actorUsername),
    action: str(data.action),
    targetType: str(data.targetType),
    targetId: typeof data.targetId === 'string' ? data.targetId : null,
    details: json(data.details),
    createdAt: str(data.createdAt),
  };
}

function parseHealth(value: Json): AdminContentHealth {
  const data = record(value);
  const rows = (key: string) =>
    array(data[key]).map((item) => {
      const row = record(item);
      return { id: str(row.id), title: str(row.title) };
    });
  return {
    publishedLessonsWithoutQuestions: rows('publishedLessonsWithoutQuestions'),
    nodesWithoutLesson: rows('nodesWithoutLesson'),
    rewardNodesWithoutValue: rows('rewardNodesWithoutValue'),
    levelsWithoutUnits: rows('levelsWithoutUnits'),
    archivedQuestions: num(data.archivedQuestions),
    archivedMedia: num(data.archivedMedia),
  };
}

export const adminService = {
  getContext: () => run(() => adminRepository.getContext(), parseContext),
  getOverview: () => run(() => adminRepository.getOverview(), parseOverview),
  getAnalytics: (days: number) =>
    run(() => adminRepository.getAnalytics(days), (value) => {
      const data = record(value);
      return {
        days: num(data.days, days),
        totals: record(data.totals) as Record<string, number>,
        daily: array(data.daily).map((item) => record(item) as Record<string, number | string>),
        topLessons: array(data.topLessons).map((item) => {
          const row = record(item);
          return {
            lessonId: str(row.lessonId),
            title: str(row.title),
            attempts: num(row.attempts),
            passed: num(row.passed),
            accuracy: num(row.accuracy),
          };
        }),
      } satisfies AdminAnalytics;
    }),

  listUsers: (search: string, roleFilter: string, page: number, pageSize: number) =>
    run(
      () => adminRepository.listUsers(search, roleFilter, page, pageSize),
      (value) => {
        const data = record(value);
        return {
          total: num(data.total),
          page: num(data.page, page),
          pageSize: num(data.pageSize, pageSize),
          items: array(data.items).map(parseUser),
        } satisfies AdminPageResult<AdminUser>;
      },
    ),
  getUserDetail: (userId: string) =>
    run(() => adminRepository.getUserDetail(userId), parseUserDetail),
  setUserRole: (userId: string, newRole: AppRole, reason: string) =>
    run(() => adminRepository.setUserRole(userId, newRole, reason), (value) => record(value)),

  getCurriculum: () => run(() => adminRepository.getCurriculum(), parseCurriculum),
  saveSubject: (payload: Json, reason: string) =>
    run(() => adminRepository.saveSubject(payload, reason), (value) => record(value)),
  saveCourse: (payload: Json, reason: string) =>
    run(() => adminRepository.saveCourse(payload, reason), (value) => record(value)),
  saveLevel: (payload: Json, reason: string) =>
    run(() => adminRepository.saveLevel(payload, reason), (value) => record(value)),
  saveUnit: (payload: Json, reason: string) =>
    run(() => adminRepository.saveUnit(payload, reason), (value) => record(value)),
  saveLesson: (payload: Json, reason: string) =>
    run(() => adminRepository.saveLesson(payload, reason), (value) => record(value)),
  saveNode: (payload: Json, reason: string) =>
    run(() => adminRepository.saveNode(payload, reason), (value) => record(value)),
  reorder: (entity: string, ids: string[], reason: string) =>
    run(() => adminRepository.reorder(entity, ids, reason), (value) => record(value)),

  listQuestions: (
    lessonId: string | null,
    subjectId: string | null,
    type: string,
    search: string,
    status: string,
    page: number,
    pageSize: number,
  ) =>
    run(
      () => adminRepository.listQuestions(lessonId, subjectId, type, search, status, page, pageSize),
      (value) => {
        const data = record(value);
        return {
          total: num(data.total),
          page: num(data.page, page),
          pageSize: num(data.pageSize, pageSize),
          items: array(data.items).map(parseQuestionItem),
        } satisfies AdminPageResult<AdminQuestionListItem>;
      },
    ),
  getQuestion: (questionId: string) =>
    run(() => adminRepository.getQuestion(questionId), parseQuestion),
  saveQuestion: (payload: Json, reason: string) =>
    run(() => adminRepository.saveQuestion(payload, reason), parseQuestion),
  setQuestionActive: (questionId: string, active: boolean, reason: string) =>
    run(() => adminRepository.setQuestionActive(questionId, active, reason), (value) =>
      record(value),
    ),

  getSiteSettings: () => run(() => adminRepository.getSiteSettings(), parseSiteSettings),
  saveSiteSettings: (payload: Json, reason: string) =>
    run(() => adminRepository.saveSiteSettings(payload, reason), parseSiteSettings),
  listPages: () => run(() => adminRepository.listPages(), parseOthers(parsePage)),
  getPage: (pageId: string) => run(() => adminRepository.getPage(pageId), parsePage),
  savePage: (payload: Json, reason: string) =>
    run(() => adminRepository.savePage(payload, reason), parsePage),
  listAnnouncements: () =>
    run(() => adminRepository.listAnnouncements(), parseOthers(parseAnnouncement)),
  saveAnnouncement: (payload: Json, reason: string) =>
    run(() => adminRepository.saveAnnouncement(payload, reason), parseAnnouncement),
  estimateAudience: (audience: string) =>
    run(() => adminRepository.estimateAudience(audience), (value) => num(value)),
  sendNotification: (title: string, body: string, link: string, audience: string, reason: string) =>
    run(() => adminRepository.sendNotification(title, body, link, audience, reason), (value) =>
      record(value),
    ),

  listMedia: (search: string, kind: string, page: number, pageSize: number) =>
    run(
      () => adminRepository.listMedia(search, kind, page, pageSize),
      (value) => {
        const data = record(value);
        return {
          total: num(data.total),
          page: num(data.page, page),
          pageSize: num(data.pageSize, pageSize),
          items: array(data.items).map(parseMedia),
        } satisfies AdminPageResult<AdminMediaItem>;
      },
    ),
  archiveMedia: (mediaId: string, reason: string) =>
    run(() => adminRepository.archiveMedia(mediaId, reason), (value) => record(value)),
  uploadMedia: (file: File, altText: string, width: number | null, height: number | null) =>
    run(() => adminRepository.uploadMedia(file, altText, width, height), parseMedia),

  getGamification: () => run(() => adminRepository.getGamification(), parseGamification),
  saveGameCatalog: (kind: string, payload: Json, reason: string) =>
    run(() => adminRepository.saveGameCatalog(kind, payload, reason), (value) => record(value)),

  listSocial: (search: string, status: string, page: number, pageSize: number) =>
    run(
      () => adminRepository.listSocial(search, status, page, pageSize),
      (value) => {
        const data = record(value);
        return {
          total: num(data.total),
          page: num(data.page, page),
          pageSize: num(data.pageSize, pageSize),
          items: array(data.items).map(parseSocial),
        } satisfies AdminPageResult<AdminSocialLink>;
      },
    ),
  listFriendQuests: (search: string) =>
    run(() => adminRepository.listFriendQuests(search), parseOthers(parseFriendQuest)),
  removeFriendship: (friendshipId: string, reason: string) =>
    run(() => adminRepository.removeFriendship(friendshipId, reason), (value) => record(value)),
  updateFriendQuest: (
    questId: string,
    targetXp: number,
    rewardXp: number,
    rewardCoins: number,
    reason: string,
  ) =>
    run(
      () => adminRepository.updateFriendQuest(questId, targetXp, rewardXp, rewardCoins, reason),
      (value) => record(value),
    ),

  getAuditLogs: (limit = 50) =>
    run(() => adminRepository.getAuditLogs(limit), parseOthers(parseAudit)),
  getRolePermissions: () =>
    run(
      async () => (await adminRepository.getRolePermissions()) as unknown as Json,
      (value) =>
        array(value).map((item) => {
          const row = record(item);
          return { role: str(row.role), permission: str(row.permission) };
        }),
    ),
  setRolePermission: (targetRole: AppRole, permission: string, allowed: boolean, reason: string) =>
    run(
      () => adminRepository.setRolePermission(targetRole, permission, allowed, reason),
      (value) => record(value),
    ),
  getContentHealth: () => run(() => adminRepository.getContentHealth(), parseHealth),
};
