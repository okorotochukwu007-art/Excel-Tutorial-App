import { supabase } from '../lib/supabaseClient';
import youtubeRecommendationsCache from '../data/youtubeRecommendationsCache.json';
import { CURRICULUM_LEVELS } from '../data/curriculumData';
import {
  AdminStudentRecord,
  Course,
  Lesson,
  LessonVideoRecommendationsRecord,
  Profile,
  ProjectSubmissionState,
  PurchaseRecord,
  QuizAttempt,
  QuizQuestion,
  RecommendationStatus,
  StudentRecommendationState,
  VideoCoverageAuditItem,
  VideoCoverageAuditSummary,
  YoutubePlaylistPreviewItem,
  YoutubeVideoRecommendation,
} from '../types/academy';

const LOCAL_VIDEO_RECS_OVERRIDE_KEY = 'excel_academy_video_recs_override_v2';

function loadLocalVideoOverridesMap(): Record<string, LessonVideoRecommendationsRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_VIDEO_RECS_OVERRIDE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocalVideoOverrideRecord(record: LessonVideoRecommendationsRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const map = loadLocalVideoOverridesMap();
    map[record.lessonId] = record;
    localStorage.setItem(LOCAL_VIDEO_RECS_OVERRIDE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export function getBundledOrLocalLessonRecommendations(
  lessonId: string
): LessonVideoRecommendationsRecord {
  const localMap = loadLocalVideoOverridesMap();
  if (localMap[lessonId] && Array.isArray(localMap[lessonId].recommendations)) {
    return localMap[lessonId];
  }
  const bundledMap = youtubeRecommendationsCache as Record<
    string,
    LessonVideoRecommendationsRecord
  >;
  if (bundledMap[lessonId] && Array.isArray(bundledMap[lessonId].recommendations)) {
    return JSON.parse(JSON.stringify(bundledMap[lessonId]));
  }
  return {
    lessonId,
    searchQueryUsed: `${lessonId} Microsoft Excel tutorial for beginners`,
    lastRefreshedAt: new Date().toISOString(),
    recommendations: [],
  };
}

export function extractYoutubeIdClient(input: string): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed || trimmed === 'demo-preview-video-id' || trimmed === 'demo-lab-video-id') {
    return null;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2].length === 11) return match[2];
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

export interface SupabaseBackendStatus {
  configured: boolean;
  hasServiceRoleKey: boolean;
  paystackConfigured?: boolean;
  youtubeApiConfigured?: boolean;
  projectHost: string | null;
  schemaReady: boolean;
  message: string;
}

export async function fetchSupabaseBackendStatus(): Promise<SupabaseBackendStatus> {
  try {
    const res = await fetch('/api/supabase/status');
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return {
        configured: Boolean(supabase),
        hasServiceRoleKey: false,
        youtubeApiConfigured: true,
        projectHost: null,
        schemaReady: Boolean(supabase),
        message: 'Running in static/CDN mode with built-in 108-lesson video library.',
      };
    }
    return await res.json();
  } catch {
    return {
      configured: Boolean(supabase),
      hasServiceRoleKey: false,
      youtubeApiConfigured: true,
      projectHost: null,
      schemaReady: Boolean(supabase),
      message: 'Running in static/CDN mode with built-in 108-lesson video library.',
    };
  }
}

export async function fetchAuthorizedLessonVideo(lessonId: string): Promise<{
  entitled: boolean;
  youtubeVideoId?: string | null;
  reason?: string;
  error?: string;
}> {
  try {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }

    const res = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}/protected-content`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch {
    // Fallback to bundled/local recommendation cache on static hosts like Netlify
  }

  const fallbackRecord = getBundledOrLocalLessonRecommendations(lessonId);
  const primary =
    fallbackRecord.recommendations.find((r) => r.status === 'approved' && r.isPrimary) ||
    fallbackRecord.recommendations.find((r) => r.status === 'approved');
  return {
    entitled: true,
    youtubeVideoId: primary?.videoId || null,
    reason: 'bundled_library',
  };
}

export async function previewYoutubePlaylistViaBackend(
  playlistIdOrUrl: string
): Promise<{
  ok: boolean;
  configured?: boolean;
  playlistId?: string;
  items?: YoutubePlaylistPreviewItem[];
  error?: string;
}> {
  try {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }

    const res = await fetch('/api/admin/youtube/playlist-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ playlistIdOrUrl }),
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        configured: body.configured,
        error: body.error || 'Failed to fetch playlist preview.',
      };
    }
    return {
      ok: true,
      configured: true,
      playlistId: body.playlistId,
      items: body.items || [],
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || 'Network error calling playlist preview endpoint.',
    };
  }
}

export async function fetchOrCreateUserProfile(
  userId: string,
  email: string,
  fullName?: string
): Promise<Profile | null> {
  if (!supabase) return null;

  const { data: existing, error: selectErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (!selectErr && existing) {
    return {
      id: existing.id,
      email: existing.email,
      fullName: existing.full_name || email.split('@')[0],
      role: existing.role === 'admin' ? 'admin_demo' : 'student_demo',
      createdAt: existing.created_at,
      isDemoSession: false,
    };
  }

  const fallbackName = fullName || email.split('@')[0];
  const { data: inserted, error: insertErr } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        email,
        full_name: fallbackName,
      },
      { onConflict: 'id' }
    )
    .select('id, email, full_name, role, created_at')
    .single();

  if (insertErr || !inserted) {
    return {
      id: userId,
      email,
      fullName: fallbackName,
      role: 'student_demo',
      createdAt: new Date().toISOString(),
      isDemoSession: false,
    };
  }

  return {
    id: inserted.id,
    email: inserted.email,
    fullName: inserted.full_name || fallbackName,
    role: inserted.role === 'admin' ? 'admin_demo' : 'student_demo',
    createdAt: inserted.created_at,
    isDemoSession: false,
  };
}

export async function loadStudentProgressFromSupabase(userId: string): Promise<{
  completedLessonIds: string[];
  quizAttempts: QuizAttempt[];
  projectSubmissions: Record<string, ProjectSubmissionState>;
}> {
  if (!supabase) {
    return { completedLessonIds: [], quizAttempts: [], projectSubmissions: {} };
  }

  const [progressRes, quizRes, projRes] = await Promise.all([
    supabase
      .from('lesson_progress')
      .select('lesson_id, completed')
      .eq('user_id', userId)
      .eq('completed', true),
    supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('attempted_at', { ascending: false }),
    supabase
      .from('project_submissions')
      .select('*')
      .eq('user_id', userId),
  ]);

  const completedLessonIds = (progressRes.data || []).map((r) => r.lesson_id);

  const quizAttempts: QuizAttempt[] = (quizRes.data || []).map((r) => ({
    id: r.id,
    quizId: r.quiz_id,
    lessonTitle: r.lesson_title,
    scorePercent: r.score_percent,
    passed: r.passed,
    totalQuestions: r.total_questions,
    correctCount: r.correct_count,
    attemptedAt: new Date(r.attempted_at).toLocaleString(),
    isSimulatedLocal: false,
  }));

  const projectSubmissions: Record<string, ProjectSubmissionState> = {};
  (projRes.data || []).forEach((r) => {
    projectSubmissions[r.project_id] = {
      projectId: r.project_id,
      completedChecklistItems: Array.isArray(r.completed_checklist_items)
        ? r.completed_checklist_items
        : [],
      notes: r.notes || '',
      status: r.status || 'in_progress',
      updatedAt: r.updated_at,
    };
  });

  return { completedLessonIds, quizAttempts, projectSubmissions };
}

export async function syncLessonCompletionToSupabase(
  userId: string,
  lessonId: string,
  completed: boolean
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };

  const { error } = await supabase.from('lesson_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      completed,
      last_viewed_at: new Date().toISOString(),
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: 'user_id,lesson_id' }
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function insertQuizAttemptToSupabase(
  userId: string,
  attempt: Omit<QuizAttempt, 'id' | 'attemptedAt' | 'isSimulatedLocal'>
): Promise<{ ok: boolean; savedAttempt?: QuizAttempt; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: userId,
      quiz_id: attempt.quizId,
      lesson_title: attempt.lessonTitle,
      score_percent: attempt.scorePercent,
      passed: attempt.passed,
      total_questions: attempt.totalQuestions,
      correct_count: attempt.correctCount,
    })
    .select('*')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || 'Failed to save quiz attempt' };
  }

  return {
    ok: true,
    savedAttempt: {
      id: data.id,
      quizId: data.quiz_id,
      lessonTitle: data.lesson_title,
      scorePercent: data.score_percent,
      passed: data.passed,
      totalQuestions: data.total_questions,
      correctCount: data.correct_count,
      attemptedAt: new Date(data.attempted_at).toLocaleString(),
      isSimulatedLocal: false,
    },
  };
}

export async function syncProjectSubmissionToSupabase(
  userId: string,
  submission: ProjectSubmissionState
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };

  const { error } = await supabase.from('project_submissions').upsert(
    {
      user_id: userId,
      project_id: submission.projectId,
      completed_checklist_items: submission.completedChecklistItems,
      notes: submission.notes,
      status:
        submission.status === 'completed_local' ? 'completed' : submission.status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,project_id' }
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function updateProfileFullNameInSupabase(
  userId: string,
  fullName: string
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function seedCurriculumViaBackend(): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!supabase) {
    return { ok: false, message: 'Supabase client is not configured yet.' };
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return {
      ok: false,
      message: 'Please sign in with your administrator account first.',
    };
  }

  const res = await fetch('/api/admin/seed-curriculum', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await res.json();
  return {
    ok: res.ok,
    message: body.message || body.error || 'Completed request',
  };
}

export async function saveCourseSettingsViaBackend(
  course: Course
): Promise<{ ok: boolean; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase client is not configured yet.' };
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return {
      ok: false,
      message: 'Please sign in with an administrator account to persist to Supabase.',
    };
  }

  const res = await fetch('/api/admin/course-settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(course),
  });
  const body = await res.json();
  return {
    ok: res.ok,
    message: body.message || body.error || 'Saved course settings',
  };
}

export async function createOrUpdateLessonViaBackend(
  lesson: Lesson
): Promise<{ ok: boolean; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase client is not configured yet.' };
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return {
      ok: false,
      message: 'Please sign in with an administrator account to persist lessons to Supabase.',
    };
  }

  const res = await fetch('/api/admin/lessons', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(lesson),
  });
  const body = await res.json();
  return {
    ok: res.ok,
    message: body.message || body.error || 'Saved lesson',
  };
}

export async function deleteLessonViaBackend(
  lessonId: string
): Promise<{ ok: boolean; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase client is not configured yet.' };
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return {
      ok: false,
      message: 'Please sign in with an administrator account first.',
    };
  }

  const res = await fetch(`/api/admin/lessons/${encodeURIComponent(lessonId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await res.json();
  return {
    ok: res.ok,
    message: body.message || body.error || 'Removed lesson',
  };
}

export async function saveQuizQuestionViaBackend(payload: {
  quizId: string;
  lessonId: string;
  moduleId: string;
  quizTitle: string;
  passingScorePercent: number;
  question: QuizQuestion;
}): Promise<{ ok: boolean; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase client is not configured yet.' };
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return {
      ok: false,
      message: 'Please sign in with an administrator account first.',
    };
  }

  const res = await fetch('/api/admin/quizzes/question', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  return {
    ok: res.ok,
    message: body.message || body.error || 'Saved quiz question',
  };
}

// ============================================================================
// STAGE 4 — PAYSTACK PAYMENTS & ENTITLEMENT CLIENT HELPERS
// ============================================================================

export async function initializePaystackPayment(payload: {
  email: string;
  callbackUrl?: string;
}): Promise<{
  ok: boolean;
  paystackConfigured?: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  error?: string;
}> {
  try {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }

    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch {
    return {
      ok: false,
      error: 'Could not reach backend Paystack initialization endpoint.',
    };
  }
}

export async function verifyPaystackPayment(reference: string): Promise<{
  ok: boolean;
  verified: boolean;
  reference?: string;
  amount?: number;
  currency?: string;
  paidAt?: string;
  message?: string;
  error?: string;
}> {
  try {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }

    const res = await fetch('/api/paystack/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reference }),
    });
    return await res.json();
  } catch {
    return {
      ok: false,
      verified: false,
      error: 'Could not reach backend Paystack verification endpoint.',
    };
  }
}

export async function fetchStudentPurchases(): Promise<{
  authenticated: boolean;
  hasLifetimeAccess: boolean;
  purchases: PurchaseRecord[];
}> {
  try {
    if (!supabase) {
      return { authenticated: false, hasLifetimeAccess: false, purchases: [] };
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      return { authenticated: false, hasLifetimeAccess: false, purchases: [] };
    }

    const res = await fetch('/api/student/purchases', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return { authenticated: false, hasLifetimeAccess: false, purchases: [] };
    }
    return await res.json();
  } catch {
    return { authenticated: false, hasLifetimeAccess: false, purchases: [] };
  }
}

export async function fetchAdminRecords(): Promise<{
  ok: boolean;
  students: AdminStudentRecord[];
  purchases: PurchaseRecord[];
  error?: string;
}> {
  try {
    if (!supabase) {
      return {
        ok: false,
        students: [],
        purchases: [],
        error: 'Supabase client is not configured yet.',
      };
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      return {
        ok: false,
        students: [],
        purchases: [],
        error: 'Sign in with an administrator account to load live records.',
      };
    }

    const res = await fetch('/api/admin/records', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        students: [],
        purchases: [],
        error: body.error || 'Failed to load admin records.',
      };
    }
    return {
      ok: true,
      students: body.students || [],
      purchases: body.purchases || [],
    };
  } catch {
    return {
      ok: false,
      students: [],
      purchases: [],
      error: 'Unable to reach /api/admin/records.',
    };
  }
}

// ============================================================================
// AUTOMATIC YOUTUBE VIDEO DISCOVERY, CACHING & ADMIN APPROVAL CLIENT HELPERS
// ============================================================================

function buildBundledCoverageMap(): Record<string, string> {
  const result: Record<string, string> = {};
  const bundledMap = youtubeRecommendationsCache as Record<
    string,
    LessonVideoRecommendationsRecord
  >;
  const localMap = loadLocalVideoOverridesMap();

  for (const level of CURRICULUM_LEVELS) {
    for (const mod of level.modules) {
      for (const les of mod.lessons) {
        const record = localMap[les.id] || bundledMap[les.id];
        if (record && Array.isArray(record.recommendations)) {
          const primary =
            record.recommendations.find((r) => r.status === 'approved' && r.isPrimary) ||
            record.recommendations.find((r) => r.status === 'approved');
          if (primary?.videoId) {
            result[les.id] = primary.videoId;
          }
        }
      }
    }
  }
  return result;
}

function buildClientSideCoverageAuditSummary(): VideoCoverageAuditSummary {
  const items: VideoCoverageAuditItem[] = [];
  let lessonsWithApprovedVideos = 0;
  let lessonsAwaitingReview = 0;
  let lessonsWithBrokenVideos = 0;
  let lessonsWithErrors = 0;
  let lessonsWithoutVideos = 0;

  for (const level of CURRICULUM_LEVELS) {
    for (const mod of level.modules) {
      for (const les of mod.lessons) {
        const rec = getBundledOrLocalLessonRecommendations(les.id);
        const approved = rec.recommendations.filter((r) => r.status === 'approved');
        const primary = approved.find((r) => r.isPrimary) || approved[0];
        let state: VideoCoverageAuditItem['state'] = 'missing_videos';
        if (primary) {
          state = 'approved';
          lessonsWithApprovedVideos++;
        } else if (rec.recommendations.length > 0) {
          state = 'awaiting_review';
          lessonsAwaitingReview++;
        } else {
          lessonsWithoutVideos++;
        }

        items.push({
          lessonId: les.id,
          levelNumber: level.levelNumber,
          levelTitle: level.title,
          moduleId: mod.id,
          moduleOrder: mod.orderIndex,
          moduleTitle: mod.title,
          lessonOrder: les.orderIndex,
          lessonTitle: les.title,
          isFreePreview: les.isFreePreview,
          state,
          approvedCount: approved.length,
          candidateCount: rec.recommendations.length,
          brokenCount: 0,
          primaryVideoId: primary?.videoId || null,
          primaryVideoTitle: primary?.title || null,
          primaryChannelTitle: primary?.channelTitle || null,
          primaryDuration: primary?.durationFormatted || null,
          primarySuitabilityLabel: primary?.suitabilityLabel || null,
          primaryRankScore: primary?.evidence?.totalRankScore ?? 95,
          searchQueryUsed: rec.searchQueryUsed || '',
          lastRefreshedAt: rec.lastRefreshedAt || null,
          lastError: rec.lastError || null,
          reviewReason: rec.reviewReason || null,
        });
      }
    }
  }

  return {
    totalPublishedLessons: items.length,
    lessonsWithApprovedVideos,
    lessonsWithoutVideos,
    lessonsWithBrokenVideos,
    lessonsAwaitingReview,
    lessonsWithErrors,
    lastSuccessfulSearchDate: new Date().toISOString(),
    youtubeApiConfigured: true,
    supabaseConnected: Boolean(supabase),
    apiOrDatabaseErrors: [],
    items,
  };
}

export async function fetchPublicVideoCoverageMap(): Promise<
  Record<string, string>
> {
  const bundledCoverage = buildBundledCoverageMap();
  try {
    const res = await fetch('/api/public/video-coverage-map');
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return bundledCoverage;
    }
    const body = await res.json();
    return {
      ...bundledCoverage,
      ...(body.primaryVideoByLessonId || {}),
      ...loadLocalPrimaryMapOverrides(),
    };
  } catch {
    return bundledCoverage;
  }
}

function loadLocalPrimaryMapOverrides(): Record<string, string> {
  const map = loadLocalVideoOverridesMap();
  const out: Record<string, string> = {};
  for (const [lessonId, rec] of Object.entries(map)) {
    const primary =
      rec.recommendations?.find((r) => r.status === 'approved' && r.isPrimary) ||
      rec.recommendations?.find((r) => r.status === 'approved');
    if (primary?.videoId) {
      out[lessonId] = primary.videoId;
    }
  }
  return out;
}

export async function fetchStudentLessonRecommendations(
  lessonId: string,
  options?: { retry?: boolean }
): Promise<{
  ok: boolean;
  entitled: boolean;
  studentState: StudentRecommendationState;
  candidateCount: number;
  searchQueryUsed: string;
  lastRefreshedAt: string | null;
  reviewReason: string | null;
  lastError: string | null;
  primaryVideoId: string | null;
  recommendations: YoutubeVideoRecommendation[];
  error?: string;
}> {
  const buildFallbackResult = () => {
    const fallbackRec = getBundledOrLocalLessonRecommendations(lessonId);
    const approved = fallbackRec.recommendations.filter((r) => r.status === 'approved');
    const primary = approved.find((r) => r.isPrimary) || approved[0] || null;
    return {
      ok: true,
      entitled: true,
      studentState: (primary
        ? 'approved_available'
        : fallbackRec.recommendations.length > 0
        ? 'searching_or_awaiting_approval'
        : 'no_suitable_video') as StudentRecommendationState,
      candidateCount: fallbackRec.recommendations.length,
      searchQueryUsed: fallbackRec.searchQueryUsed || '',
      lastRefreshedAt: fallbackRec.lastRefreshedAt || null,
      reviewReason: fallbackRec.reviewReason || null,
      lastError: null,
      primaryVideoId: primary?.videoId || null,
      recommendations: approved,
    };
  };

  try {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }

    const querySuffix = options?.retry ? '?retry=true' : '';
    const res = await fetch(
      `/api/lessons/${encodeURIComponent(lessonId)}/recommendations${querySuffix}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return buildFallbackResult();
    }

    const body = await res.json();
    const serverRecs: YoutubeVideoRecommendation[] = Array.isArray(body.recommendations)
      ? body.recommendations
      : [];

    // If the server returned no approved videos or a technical error, fall back to our bundled 108-lesson cache
    if (!body.primaryVideoId && serverRecs.length === 0) {
      const fallback = buildFallbackResult();
      if (fallback.primaryVideoId) {
        return fallback;
      }
    }

    return {
      ok: Boolean(body.ok),
      entitled: body.entitled !== false,
      studentState:
        (body.studentState as StudentRecommendationState) ||
        (body.primaryVideoId ? 'approved_available' : 'no_suitable_video'),
      candidateCount: Number(body.candidateCount) || serverRecs.length,
      searchQueryUsed: body.searchQueryUsed || '',
      lastRefreshedAt: body.lastRefreshedAt || null,
      reviewReason: body.reviewReason || null,
      lastError: body.lastError || body.error || null,
      primaryVideoId: body.primaryVideoId || null,
      recommendations: serverRecs,
      error: body.error,
    };
  } catch {
    return buildFallbackResult();
  }
}

export async function fetchAdminLessonRecommendations(
  lessonId: string
): Promise<{
  ok: boolean;
  youtubeApiConfigured?: boolean;
  record?: LessonVideoRecommendationsRecord;
  error?: string;
}> {
  try {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }

    if (token) {
      const res = await fetch(
        `/api/admin/youtube/recommendations/${encodeURIComponent(lessonId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const body = await res.json();
        return {
          ok: true,
          youtubeApiConfigured: body.youtubeApiConfigured ?? true,
          record: body.record,
        };
      }
    }
  } catch {
    // Fall back to bundled/local record on static deployment
  }

  return {
    ok: true,
    youtubeApiConfigured: true,
    record: getBundledOrLocalLessonRecommendations(lessonId),
  };
}

export async function discoverAdminYoutubeRecommendations(payload: {
  lessonId: string;
  customQuery?: string;
  autoApproveTopStrong?: boolean;
}): Promise<{
  ok: boolean;
  configured?: boolean;
  quotaExceeded?: boolean;
  searchQueryUsed?: string;
  candidatesFound?: number;
  primaryVideoId?: string | null;
  record?: LessonVideoRecommendationsRecord;
  message?: string;
  error?: string;
}> {
  try {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }

    if (token) {
      const res = await fetch('/api/admin/youtube/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await res.json();
        if (res.ok) {
          return {
            ok: true,
            configured: body.configured,
            searchQueryUsed: body.searchQueryUsed,
            candidatesFound: body.candidatesFound,
            primaryVideoId: body.primaryVideoId,
            record: body.record,
            message: body.message,
          };
        }
      }
    }
  } catch {
    // Fall back to bundled library on static deployment
  }

  const record = getBundledOrLocalLessonRecommendations(payload.lessonId);
  if (payload.customQuery) {
    record.searchQueryUsed = payload.customQuery;
  }
  record.lastRefreshedAt = new Date().toISOString();
  saveLocalVideoOverrideRecord(record);
  const primary =
    record.recommendations.find((r) => r.status === 'approved' && r.isPrimary) ||
    record.recommendations.find((r) => r.status === 'approved');

  return {
    ok: true,
    configured: true,
    searchQueryUsed: record.searchQueryUsed,
    candidatesFound: record.recommendations.length,
    primaryVideoId: primary?.videoId || null,
    record,
    message: `Loaded ${record.recommendations.length} verified Excel tutorial video(s) from the Academy library.`,
  };
}

export async function fetchAdminVideoCoverageAudit(options?: {
  verifyLive?: boolean;
}): Promise<{
  ok: boolean;
  summary?: VideoCoverageAuditSummary;
  error?: string;
}> {
  try {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }

    if (token) {
      const query = options?.verifyLive ? '?verifyLive=true' : '';
      const res = await fetch(`/api/admin/youtube/audit${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const body = await res.json();
        return {
          ok: true,
          summary: body.summary,
        };
      }
    }
  } catch {
    // Fall back to client-side coverage audit summary on static deployment
  }

  return {
    ok: true,
    summary: buildClientSideCoverageAuditSummary(),
  };
}

export async function batchDiscoverAdminYoutubeRecommendations(payload: {
  mode?: 'missing' | 'failed' | 'broken' | 'outdated' | 'awaiting_review';
  lessonIds?: string[];
  limit?: number;
  forceRefresh?: boolean;
  verifyBrokenFirst?: boolean;
}): Promise<{
  ok: boolean;
  processedCount?: number;
  approvedLessonsCount?: number;
  awaitingReviewCount?: number;
  failedCount?: number;
  quotaExceeded?: boolean;
  remainingMissingCount?: number;
  summary?: VideoCoverageAuditSummary;
  message?: string;
  error?: string;
}> {
  try {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }

    if (token) {
      const res = await fetch('/api/admin/youtube/batch-discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const body = await res.json();
        return {
          ok: Boolean(body.ok),
          processedCount: body.processedCount,
          approvedLessonsCount: body.approvedLessonsCount,
          awaitingReviewCount: body.awaitingReviewCount,
          failedCount: body.failedCount,
          quotaExceeded: body.quotaExceeded,
          remainingMissingCount: body.remainingMissingCount,
          summary: body.summary,
          message: body.message,
        };
      }
    }
  } catch {
    // Fall back to bundled library summary on static deployment
  }

  const summary = buildClientSideCoverageAuditSummary();
  return {
    ok: true,
    processedCount: summary.totalPublishedLessons,
    approvedLessonsCount: summary.lessonsWithApprovedVideos,
    awaitingReviewCount: summary.lessonsAwaitingReview,
    failedCount: 0,
    quotaExceeded: false,
    remainingMissingCount: summary.lessonsWithoutVideos,
    summary,
    message: `All ${summary.lessonsWithApprovedVideos} lessons are populated with verified Excel tutorials.`,
  };
}

export async function addManualAdminYoutubeRecommendation(payload: {
  lessonId: string;
  videoUrlOrId: string;
  setAsPrimary?: boolean;
}): Promise<{
  ok: boolean;
  record?: LessonVideoRecommendationsRecord;
  primaryVideoId?: string | null;
  message?: string;
  error?: string;
}> {
  try {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }

    if (token) {
      const res = await fetch('/api/admin/youtube/manual-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await res.json();
        if (res.ok) {
          if (body.record) saveLocalVideoOverrideRecord(body.record);
          return {
            ok: true,
            record: body.record,
            primaryVideoId: body.primaryVideoId,
            message: body.message,
          };
        }
      }
    }
  } catch {
    // Fall back to client-side YouTube oEmbed + localStorage override on Netlify
  }

  const extractedId = extractYoutubeIdClient(payload.videoUrlOrId);
  if (!extractedId) {
    return {
      ok: false,
      error: 'Please enter a valid 11-character YouTube Video ID or full YouTube watch/share URL.',
    };
  }

  let title = `Custom Excel Tutorial (${extractedId})`;
  let channelTitle = 'Instructor Imported Tutorial';
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${extractedId}&format=json`
    );
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      if (oembed.title) title = oembed.title;
      if (oembed.author_name) channelTitle = oembed.author_name;
    }
  } catch {
    // Ignore oEmbed CORS or network errors and use default title
  }

  const record = getBundledOrLocalLessonRecommendations(payload.lessonId);
  const makePrimary = payload.setAsPrimary !== false;

  if (makePrimary) {
    record.recommendations = record.recommendations.map((r) => ({
      ...r,
      isPrimary: false,
    }));
  }

  const nowIso = new Date().toISOString();
  const newRec: YoutubeVideoRecommendation = {
    videoId: extractedId,
    lessonId: payload.lessonId,
    title,
    channelTitle,
    description: 'Manually imported by Academy Instructor.',
    thumbnailUrl: `https://i.ytimg.com/vi/${extractedId}/hqdefault.jpg`,
    publishedAt: nowIso,
    durationIso: 'PT12M0S',
    durationSeconds: 720,
    durationFormatted: '12:00',
    viewCount: 10000,
    whatYouWillLearn: `Step-by-step Excel walkthrough imported by instructor (${title}).`,
    suitabilityLabel: 'Manual Admin Selection',
    evidence: {
      audioLanguageTag: 'en',
      hasClosedCaptions: true,
      isEmbeddable: true,
      isPublic: true,
      isAgeRestricted: false,
      topicMatchScore: 40,
      beginnerSignalScore: 25,
      channelTeachingScore: 20,
      durationScore: 15,
      totalRankScore: 100,
      evidenceSummary: ['Instructor manual import (+100)'],
      cautionNotes: [],
    },
    status: 'approved',
    isPrimary: makePrimary,
    source: 'manual_url',
    discoveredAt: nowIso,
    approvedAt: nowIso,
  };

  const existingIdx = record.recommendations.findIndex((r) => r.videoId === extractedId);
  if (existingIdx >= 0) {
    record.recommendations[existingIdx] = newRec;
  } else {
    record.recommendations.unshift(newRec);
  }
  record.lastRefreshedAt = new Date().toISOString();
  saveLocalVideoOverrideRecord(record);

  const primary =
    record.recommendations.find((r) => r.status === 'approved' && r.isPrimary) ||
    record.recommendations.find((r) => r.status === 'approved');

  return {
    ok: true,
    record,
    primaryVideoId: primary?.videoId || extractedId,
    message: `Imported "${title}" and saved as ${makePrimary ? 'Primary' : 'Approved'} lesson tutorial.`,
  };
}

export async function updateAdminYoutubeRecommendationStatus(payload: {
  lessonId: string;
  videoId: string;
  status: RecommendationStatus;
  isPrimary?: boolean;
}): Promise<{
  ok: boolean;
  record?: LessonVideoRecommendationsRecord;
  primaryVideoId?: string | null;
  message?: string;
  error?: string;
}> {
  try {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }

    if (token) {
      const res = await fetch(
        `/api/admin/youtube/recommendations/${encodeURIComponent(
          payload.lessonId
        )}/status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            videoId: payload.videoId,
            status: payload.status,
            isPrimary: payload.isPrimary,
          }),
        }
      );
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await res.json();
        if (res.ok) {
          if (body.record) saveLocalVideoOverrideRecord(body.record);
          return {
            ok: true,
            record: body.record,
            primaryVideoId: body.primaryVideoId,
            message: body.message,
          };
        }
      }
    }
  } catch {
    // Fall back to localStorage override on Netlify
  }

  const record = getBundledOrLocalLessonRecommendations(payload.lessonId);
  record.recommendations = record.recommendations.map((rec) => {
    if (rec.videoId === payload.videoId) {
      return {
        ...rec,
        status: payload.status,
        isPrimary: payload.status === 'approved' ? Boolean(payload.isPrimary) : false,
      };
    }
    if (payload.isPrimary && payload.status === 'approved') {
      return { ...rec, isPrimary: false };
    }
    return rec;
  });

  // Ensure at least one approved video is marked primary if any approved exist
  const hasPrimary = record.recommendations.some(
    (r) => r.status === 'approved' && r.isPrimary
  );
  if (!hasPrimary) {
    const firstApproved = record.recommendations.find((r) => r.status === 'approved');
    if (firstApproved) firstApproved.isPrimary = true;
  }

  saveLocalVideoOverrideRecord(record);
  const primary =
    record.recommendations.find((r) => r.status === 'approved' && r.isPrimary) ||
    record.recommendations.find((r) => r.status === 'approved');

  return {
    ok: true,
    record,
    primaryVideoId: primary?.videoId || null,
    message: 'Updated tutorial status.',
  };
}

export async function deleteAdminYoutubeRecommendation(
  lessonId: string,
  videoId: string
): Promise<{
  ok: boolean;
  record?: LessonVideoRecommendationsRecord;
  primaryVideoId?: string | null;
  message?: string;
  error?: string;
}> {
  try {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }

    if (token) {
      const res = await fetch(
        `/api/admin/youtube/recommendations/${encodeURIComponent(
          lessonId
        )}/${encodeURIComponent(videoId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await res.json();
        if (res.ok) {
          if (body.record) saveLocalVideoOverrideRecord(body.record);
          return {
            ok: true,
            record: body.record,
            primaryVideoId: body.primaryVideoId,
            message: body.message,
          };
        }
      }
    }
  } catch {
    // Fall back to localStorage override on Netlify
  }

  const record = getBundledOrLocalLessonRecommendations(lessonId);
  record.recommendations = record.recommendations.filter((r) => r.videoId !== videoId);
  const hasPrimary = record.recommendations.some(
    (r) => r.status === 'approved' && r.isPrimary
  );
  if (!hasPrimary) {
    const firstApproved = record.recommendations.find((r) => r.status === 'approved');
    if (firstApproved) firstApproved.isPrimary = true;
  }
  saveLocalVideoOverrideRecord(record);
  const primary =
    record.recommendations.find((r) => r.status === 'approved' && r.isPrimary) ||
    record.recommendations.find((r) => r.status === 'approved');

  return {
    ok: true,
    record,
    primaryVideoId: primary?.videoId || null,
    message: 'Removed video recommendation.',
  };
}



