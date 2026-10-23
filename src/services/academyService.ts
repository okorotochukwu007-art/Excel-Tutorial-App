import { supabase } from '../lib/supabaseClient';
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
  VideoCoverageAuditSummary,
  YoutubePlaylistPreviewItem,
  YoutubeVideoRecommendation,
} from '../types/academy';

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
    if (!res.ok) {
      return {
        configured: false,
        hasServiceRoleKey: false,
        projectHost: null,
        schemaReady: false,
        message: 'Backend status endpoint unavailable.',
      };
    }
    return await res.json();
  } catch {
    return {
      configured: false,
      hasServiceRoleKey: false,
      projectHost: null,
      schemaReady: false,
      message: 'Unable to reach backend status endpoint.',
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
    return await res.json();
  } catch {
    return {
      entitled: false,
      error: 'Could not verify lesson entitlement with server.',
    };
  }
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

export async function fetchPublicVideoCoverageMap(): Promise<
  Record<string, string>
> {
  try {
    const res = await fetch('/api/public/video-coverage-map');
    if (!res.ok) return {};
    const body = await res.json();
    return body.primaryVideoByLessonId || {};
  } catch {
    return {};
  }
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
    const body = await res.json();
    return {
      ok: Boolean(body.ok),
      entitled: body.entitled !== false,
      studentState:
        (body.studentState as StudentRecommendationState) ||
        (body.primaryVideoId ? 'approved_available' : 'no_suitable_video'),
      candidateCount: Number(body.candidateCount) || 0,
      searchQueryUsed: body.searchQueryUsed || '',
      lastRefreshedAt: body.lastRefreshedAt || null,
      reviewReason: body.reviewReason || null,
      lastError: body.lastError || body.error || null,
      primaryVideoId: body.primaryVideoId || null,
      recommendations: Array.isArray(body.recommendations)
        ? body.recommendations
        : [],
      error: body.error,
    };
  } catch {
    return {
      ok: false,
      entitled: true,
      studentState: 'technical_error',
      candidateCount: 0,
      searchQueryUsed: '',
      lastRefreshedAt: null,
      reviewReason: null,
      lastError: 'Unable to reach lesson video recommendation server endpoint.',
      primaryVideoId: null,
      recommendations: [],
      error: 'Unable to load cached video recommendations from server.',
    };
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
    if (!token) {
      return {
        ok: false,
        error:
          'Sign in with an administrator account to manage lesson video recommendations.',
      };
    }

    const res = await fetch(
      `/api/admin/youtube/recommendations/${encodeURIComponent(lessonId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const body = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: body.error || 'Failed to load lesson video recommendations.',
      };
    }
    return {
      ok: true,
      youtubeApiConfigured: body.youtubeApiConfigured,
      record: body.record,
    };
  } catch {
    return {
      ok: false,
      error: 'Could not reach admin video recommendations endpoint.',
    };
  }
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
    if (!token) {
      return {
        ok: false,
        error:
          'Sign in with an administrator account to discover YouTube tutorials.',
      };
    }

    const res = await fetch('/api/admin/youtube/discover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        configured: body.configured,
        quotaExceeded: body.quotaExceeded,
        searchQueryUsed: body.searchQueryUsed,
        record: body.record,
        error: body.error || 'Failed to search YouTube Data API v3.',
      };
    }
    return {
      ok: true,
      configured: body.configured,
      searchQueryUsed: body.searchQueryUsed,
      candidatesFound: body.candidatesFound,
      primaryVideoId: body.primaryVideoId,
      record: body.record,
      message: body.message,
    };
  } catch {
    return {
      ok: false,
      error: 'Network error while contacting server YouTube discovery endpoint.',
    };
  }
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
    if (!token) {
      return {
        ok: false,
        error:
          'Sign in with an administrator account to run the Video Coverage Audit.',
      };
    }

    const query = options?.verifyLive ? '?verifyLive=true' : '';
    const res = await fetch(`/api/admin/youtube/audit${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: body.error || 'Failed to load Video Coverage Audit.',
      };
    }
    return {
      ok: true,
      summary: body.summary,
    };
  } catch {
    return {
      ok: false,
      error: 'Network error while contacting Video Coverage Audit endpoint.',
    };
  }
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
    if (!token) {
      return {
        ok: false,
        error:
          'Sign in with an administrator account to run batch video discovery.',
      };
    }

    const res = await fetch('/api/admin/youtube/batch-discover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: body.error || 'Batch YouTube discovery failed.',
      };
    }
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
  } catch {
    return {
      ok: false,
      error: 'Network error while running batch YouTube video discovery.',
    };
  }
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
    if (!token) {
      return {
        ok: false,
        error: 'Sign in with an administrator account to add YouTube videos.',
      };
    }

    const res = await fetch('/api/admin/youtube/manual-add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: body.error || 'Failed to add manual YouTube video.',
      };
    }
    return {
      ok: true,
      record: body.record,
      primaryVideoId: body.primaryVideoId,
      message: body.message,
    };
  } catch {
    return {
      ok: false,
      error: 'Network error while adding manual YouTube video.',
    };
  }
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
    if (!token) {
      return {
        ok: false,
        error: 'Sign in with an administrator account to approve or reject recommendations.',
      };
    }

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
    const body = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: body.error || 'Failed to update recommendation status.',
      };
    }
    return {
      ok: true,
      record: body.record,
      primaryVideoId: body.primaryVideoId,
      message: body.message,
    };
  } catch {
    return {
      ok: false,
      error: 'Network error while updating recommendation status.',
    };
  }
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
    if (!token) {
      return {
        ok: false,
        error: 'Sign in with an administrator account to remove recommendations.',
      };
    }

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
    const body = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: body.error || 'Failed to remove video recommendation.',
      };
    }
    return {
      ok: true,
      record: body.record,
      primaryVideoId: body.primaryVideoId,
      message: body.message,
    };
  } catch {
    return {
      ok: false,
      error: 'Network error while removing video recommendation.',
    };
  }
}


