import { requireSupabase } from '../services/supabase/client';
import type { AppRole, Json } from '../types/database';

interface RpcError {
  message: string;
  code?: string;
}

interface QueryResult {
  data: unknown[] | null;
  error: RpcError | null;
}

interface LooseClient {
  rpc(name: string, args?: Record<string, unknown>): Promise<{ data: Json; error: RpcError | null }>;
  from(table: string): {
    select(columns: string): Promise<QueryResult>;
  };
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        file: File,
        options?: { upsert?: boolean; contentType?: string },
      ): Promise<{ error: RpcError | null }>;
      getPublicUrl(path: string): { data: { publicUrl: string } };
    };
  };
}

function client(): LooseClient {
  return requireSupabase() as unknown as LooseClient;
}

function raise(error: RpcError | null): never {
  const wrapped = new Error(error?.message ?? 'Aksi admin gagal.');
  if (error?.code) Object.assign(wrapped, { code: error.code });
  throw wrapped;
}

async function call(name: string, args: Record<string, unknown> = {}): Promise<Json> {
  const { data, error } = await client().rpc(name, args);
  if (error) raise(error);
  return data;
}

export const adminRepository = {
  getContext: () => call('admin_get_context'),
  getOverview: () => call('admin_get_overview'),
  getAnalytics: (days: number) => call('admin_get_analytics', { p_days: days }),

  listUsers: (search: string, role: string, page: number, pageSize: number) =>
    call('admin_list_users', {
      p_search: search,
      p_role: role,
      p_page: page,
      p_page_size: pageSize,
    }),
  getUserDetail: (userId: string) => call('admin_get_user_detail', { p_user_id: userId }),
  setUserRole: (userId: string, role: AppRole, reason: string) =>
    call('admin_set_user_role', { p_user_id: userId, p_role: role, p_reason: reason }),

  getCurriculum: () => call('admin_list_curriculum'),
  listSubjectCategories: () => call('admin_list_subject_categories'),
  setSubjectCategory: (subjectId: string, category: string, reason: string) =>
    call('admin_set_subject_category', {
      p_subject_id: subjectId,
      p_category: category,
      p_reason: reason,
    }),
  saveSubject: (payload: Json, reason: string) =>
    call('admin_save_subject', { p_payload: payload, p_reason: reason }),
  saveCourse: (payload: Json, reason: string) =>
    call('admin_save_course', { p_payload: payload, p_reason: reason }),
  saveLevel: (payload: Json, reason: string) =>
    call('admin_save_level', { p_payload: payload, p_reason: reason }),
  saveUnit: (payload: Json, reason: string) =>
    call('admin_save_unit', { p_payload: payload, p_reason: reason }),
  saveLesson: (payload: Json, reason: string) =>
    call('admin_save_lesson', { p_payload: payload, p_reason: reason }),
  saveNode: (payload: Json, reason: string) =>
    call('admin_save_node', { p_payload: payload, p_reason: reason }),
  listSections: (subjectId: string | null) =>
    call('admin_list_learning_sections', { p_subject_id: subjectId }),
  saveSection: (payload: Json, reason: string) =>
    call('admin_save_learning_section', { p_payload: payload, p_reason: reason }),
  deleteSection: (sectionId: string, reason: string) =>
    call('admin_delete_learning_section', { p_section_id: sectionId, p_reason: reason }),
  reorder: (entity: string, ids: string[], reason: string) =>
    call('admin_reorder', { p_entity: entity, p_ids: ids, p_reason: reason }),

  listQuestions: (
    lessonId: string | null,
    subjectId: string | null,
    type: string,
    search: string,
    status: string,
    page: number,
    pageSize: number,
  ) =>
    call('admin_list_questions', {
      p_lesson_id: lessonId,
      p_subject_id: subjectId,
      p_type: type,
      p_search: search,
      p_status: status,
      p_page: page,
      p_page_size: pageSize,
    }),
  getQuestion: (questionId: string) =>
    call('admin_get_question', { p_question_id: questionId }),
  saveQuestion: (payload: Json, reason: string) =>
    call('admin_save_question', { p_payload: payload, p_reason: reason }),
  createQuestionLevel: (payload: Json, reason: string) =>
    call('admin_create_question_level', { p_payload: payload, p_reason: reason }),
  setQuestionActive: (questionId: string, active: boolean, reason: string) =>
    call('admin_set_question_active', {
      p_question_id: questionId,
      p_active: active,
      p_reason: reason,
    }),

  getSiteSettings: () => call('admin_get_site_settings'),
  saveSiteSettings: (payload: Json, reason: string) =>
    call('admin_save_site_settings', { p_payload: payload, p_reason: reason }),
  listPages: () => call('admin_list_pages'),
  getPage: (pageId: string) => call('admin_get_page', { p_page_id: pageId }),
  savePage: (payload: Json, reason: string) =>
    call('admin_save_page', { p_payload: payload, p_reason: reason }),
  listAnnouncements: () => call('admin_list_announcements'),
  saveAnnouncement: (payload: Json, reason: string) =>
    call('admin_save_announcement', { p_payload: payload, p_reason: reason }),
  estimateAudience: (audience: string) =>
    call('admin_estimate_audience', { p_audience: audience }),
  sendNotification: (
    title: string,
    body: string,
    link: string,
    audience: string,
    reason: string,
  ) =>
    call('admin_send_notification', {
      p_title: title,
      p_body: body,
      p_link: link,
      p_audience: audience,
      p_reason: reason,
    }),

  listMedia: (search: string, kind: string, page: number, pageSize: number) =>
    call('admin_list_media', {
      p_search: search,
      p_kind: kind,
      p_page: page,
      p_page_size: pageSize,
    }),
  archiveMedia: (mediaId: string, reason: string) =>
    call('admin_archive_media', { p_media_id: mediaId, p_reason: reason }),

  getGamification: () => call('admin_get_gamification'),
  saveGameCatalog: (kind: string, payload: Json, reason: string) =>
    call('admin_save_game_catalog', { p_kind: kind, p_payload: payload, p_reason: reason }),

  listSocial: (search: string, status: string, page: number, pageSize: number) =>
    call('admin_list_social', {
      p_search: search,
      p_status: status,
      p_page: page,
      p_page_size: pageSize,
    }),
  listFriendQuests: (search: string) =>
    call('admin_list_friend_quests', { p_search: search }),
  removeFriendship: (friendshipId: string, reason: string) =>
    call('admin_remove_friendship', { p_friendship_id: friendshipId, p_reason: reason }),
  updateFriendQuest: (
    questId: string,
    targetXp: number,
    rewardXp: number,
    rewardCoins: number,
    reason: string,
  ) =>
    call('admin_update_friend_quest', {
      p_quest_id: questId,
      p_target_xp: targetXp,
      p_reward_xp: rewardXp,
      p_reward_coins: rewardCoins,
      p_reason: reason,
    }),

  getAuditLogs: (limit: number) => call('get_audit_logs', { p_limit: limit }),
  async getRolePermissions(): Promise<Array<{ role: string; permission: string }>> {
    const { data, error } = await client().from('role_permissions').select('role,permission');
    if (error) raise(error);
    return (data ?? []).map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return { role: String(row.role ?? ''), permission: String(row.permission ?? '') };
    });
  },
  setRolePermission: (role: AppRole, permission: string, allowed: boolean, reason: string) =>
    call('admin_set_role_permission', {
      p_role: role,
      p_permission: permission,
      p_allowed: allowed,
      p_reason: reason,
    }),
  getContentHealth: () => call('admin_content_health'),

  async uploadMedia(file: File, altText: string, width: number | null, height: number | null) {
    const supabase = client();
    const mime = file.type.toLowerCase();
    const kind = mime.startsWith('image/')
      ? 'image'
      : mime.startsWith('audio/')
        ? 'audio'
        : mime.startsWith('video/')
          ? 'video'
          : '';
    if (!kind) throw new Error('Format file tidak didukung. Gunakan gambar, audio, atau video.');

    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
    const bucket = supabase.storage.from('content-media');
    const { error } = await bucket.upload(path, file, { upsert: false, contentType: mime });
    if (error) raise(error);
    const { data } = bucket.getPublicUrl(path);

    return call('admin_register_media', {
      p_storage_path: path,
      p_url: data.publicUrl,
      p_kind: kind,
      p_mime_type: mime,
      p_size_bytes: file.size,
      p_alt_text: altText,
      p_width: width,
      p_height: height,
    });
  },
};
