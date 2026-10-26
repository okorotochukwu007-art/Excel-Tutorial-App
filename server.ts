import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { CURRICULUM_LEVELS, INITIAL_COURSE } from './src/data/curriculumData.ts';
import {
  batchDiscoverLessonVideos,
  buildVideoCoverageAudit,
  discoverAndRankYoutubeVideosForLesson,
  extractYoutubeVideoId,
  fetchSingleYoutubeVideoForLesson,
  findLessonInCurriculum,
  isYoutubeApiKeyConfigured,
  loadAllLessonRecommendationsMap,
  loadLessonRecommendations,
  mergeAndAutoApproveCandidates,
  saveLessonRecommendations,
} from './src/services/youtubeDiscoveryServer.ts';
import {
  RecommendationStatus,
  StudentRecommendationState,
} from './src/types/academy.ts';

dotenv.config();

const PORT = 3000;

function isPaystackSecretConfigured(): boolean {
  const key = (process.env.PAYSTACK_SECRET_KEY || '').trim();
  return (
    Boolean(key) &&
    key !== 'sk_test_your_paystack_secret_key' &&
    (key.startsWith('sk_test_') || key.startsWith('sk_live_'))
  );
}

function isValidSupabaseConfig(url?: string, key?: string): boolean {
  const cleanUrl = (url || '').trim();
  const cleanKey = (key || '').trim();
  if (!cleanUrl || !cleanKey) return false;
  if (
    cleanUrl.includes('your-project-ref.supabase.co') ||
    cleanUrl === 'MY_SUPABASE_URL' ||
    cleanKey === 'your-public-anon-key' ||
    cleanKey === 'your-service-role-secret-key'
  ) {
    return false;
  }
  try {
    const parsed = new URL(cleanUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function getServerSupabaseClient(bearerToken?: string) {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (isValidSupabaseConfig(supabaseUrl, serviceRoleKey)) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  if (isValidSupabaseConfig(supabaseUrl, anonKey)) {
    return createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: bearerToken
        ? { headers: { Authorization: `Bearer ${bearerToken}` } }
        : undefined,
    });
  }

  return null;
}

async function verifyAdminRequest(req: Request): Promise<{
  authorized: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  // Master Security Key check for Lead Instructor Okoro Tochuwku
  const masterKey =
    req.headers['x-instructor-master-key'] ||
    req.headers['x-admin-master-key'] ||
    req.headers['x-admin-key'];
  const expectedKey = (process.env.INSTRUCTOR_MASTER_KEY || 'OKORO-EXCEL-CHIEF-2026').trim();
  if (masterKey && String(masterKey).trim() === expectedKey) {
    return {
      authorized: true,
      userId: 'instructor-okoro-tochuwku',
      email: 'okorotochukwu007@gmail.com',
    };
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing Authorization Bearer token' };
  }
  const token = authHeader.split('Bearer ')[1]?.trim();
  if (token && token === expectedKey) {
    return {
      authorized: true,
      userId: 'instructor-okoro-tochuwku',
      email: 'okorotochukwu007@gmail.com',
    };
  }

  const supabase = getServerSupabaseClient(token);
  if (!supabase) {
    return { authorized: false, error: 'Supabase is not configured on the server' };
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) {
    return { authorized: false, error: 'Invalid or expired Supabase session token' };
  }

  const user = userData.user;
  const authorizedAdminEmail = (
    process.env.ADMIN_BOOTSTRAPPED_EMAIL || 'okorotochukwu007@gmail.com'
  )
    .trim()
    .toLowerCase();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .maybeSingle();

  const userEmail = (user.email || '').toLowerCase();
  const profileEmail = (profile?.email || '').toLowerCase();

  const isDatabaseAdmin =
    profile?.role === 'admin' &&
    (userEmail === authorizedAdminEmail || profileEmail === authorizedAdminEmail);
  const isBootstrappedOwner =
    userEmail === authorizedAdminEmail && Boolean(user.email_confirmed_at);

  if (!isDatabaseAdmin && !isBootstrappedOwner) {
    return {
      authorized: false,
      userId: user.id,
      email: user.email,
      error:
        'Forbidden: Administrative Console is strictly restricted to Lead Instructor Okoro Tochuwku (okorotochukwu007@gmail.com).',
    };
  }

  return { authorized: true, userId: user.id, email: user.email };
}

function extractYoutubePlaylistId(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    const listParam = url.searchParams.get('list');
    if (listParam) return listParam;
  } catch {
    // Input is already a playlist ID
  }
  return trimmed;
}

async function startServer() {
  const app = express();
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  // 1. Check Supabase Server, Schema & Paystack Configuration Status
  app.get('/api/supabase/status', async (_req: Request, res: Response) => {
    const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').trim();
    const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    const paystackConfigured = isPaystackSecretConfigured();
    const youtubeApiConfigured = isYoutubeApiKeyConfigured();

    const configured = isValidSupabaseConfig(supabaseUrl, anonKey);
    const hasServiceRoleKey = isValidSupabaseConfig(supabaseUrl, serviceRoleKey);

    if (!configured) {
      return res.json({
        configured: false,
        hasServiceRoleKey: false,
        paystackConfigured,
        youtubeApiConfigured,
        projectHost: null,
        schemaReady: false,
        message:
          'Awaiting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in AI Studio Secrets.',
      });
    }

    let projectHost: string | null = null;
    try {
      projectHost = new URL(supabaseUrl).host;
    } catch {
      projectHost = null;
    }

    const client = getServerSupabaseClient();
    let schemaReady = false;
    let message = 'Connected to Supabase project.';

    if (client) {
      const { error } = await client.from('courses').select('id').limit(1);
      if (!error) {
        schemaReady = true;
        message = 'Supabase connected and Stage 2–4 tables verified.';
      } else {
        schemaReady = false;
        message =
          'Supabase URL/Key connected. Run the Stage 2 SQL Migration in your Supabase SQL Editor to create the tables and RLS policies.';
      }
    }

    return res.json({
      configured,
      hasServiceRoleKey,
      paystackConfigured,
      youtubeApiConfigured,
      projectHost,
      schemaReady,
      message,
    });
  });

  // 2. Public Curriculum Loader (Redacts paid youtube_video_id from public listings)
  app.get('/api/public/curriculum', async (_req: Request, res: Response) => {
    const client = getServerSupabaseClient();
    if (!client) {
      return res.json({ source: 'local_default', seeded: false });
    }

    const [coursesRes, modulesRes, lessonsRes, resourcesRes, quizzesRes, questionsRes] =
      await Promise.all([
        client.from('courses').select('*').eq('id', INITIAL_COURSE.id).maybeSingle(),
        client.from('modules').select('*').order('order_index', { ascending: true }),
        client.from('lessons').select('*').order('order_index', { ascending: true }),
        client.from('lesson_resources').select('*'),
        client.from('quizzes').select('*'),
        client.from('quiz_questions').select('*'),
      ]);

    if (
      coursesRes.error ||
      !coursesRes.data ||
      !modulesRes.data ||
      modulesRes.data.length === 0
    ) {
      return res.json({ source: 'local_default', seeded: false });
    }

    // Security rule: Never expose real paid video links in public course listings
    const sanitizedLessons = (lessonsRes.data || []).map((les) => ({
      ...les,
      youtube_video_id: les.is_free_preview ? les.youtube_video_id : null,
    }));

    return res.json({
      source: 'supabase_postgres',
      seeded: true,
      course: coursesRes.data,
      modules: modulesRes.data,
      lessons: sanitizedLessons,
      resources: resourcesRes.data || [],
      quizzes: quizzesRes.data || [],
      quizQuestions: questionsRes.data || [],
    });
  });

  // 3. Server-Side Protected Lesson Metadata & Entitlement Verification
  app.get(
    '/api/lessons/:lessonId/protected-content',
    async (req: Request, res: Response) => {
      const { lessonId } = req.params;
      const authHeader = req.headers.authorization;
      const token =
        authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.split('Bearer ')[1]
          : undefined;

      const client = getServerSupabaseClient(token);
      if (!client) {
        return res.status(503).json({
          entitled: false,
          error: 'Supabase is not configured yet.',
        });
      }

      const { data: lesson, error: lessonErr } = await client
        .from('lessons')
        .select(
          'id, title, is_free_preview, youtube_video_id, module_id, level_number'
        )
        .eq('id', lessonId)
        .maybeSingle();

      if (lessonErr || !lesson) {
        return res.status(404).json({
          entitled: false,
          error: 'Lesson not found in Supabase database (seed curriculum first).',
        });
      }

      if (lesson.is_free_preview) {
        return res.json({
          entitled: true,
          reason: 'free_preview',
          youtubeVideoId: lesson.youtube_video_id,
        });
      }

      if (!token) {
        return res.status(401).json({
          entitled: false,
          error: 'Sign in required to access paid lesson video metadata.',
        });
      }

      const { data: userData } = await client.auth.getUser(token);
      if (!userData.user) {
        return res.status(401).json({
          entitled: false,
          error: 'Invalid authentication session.',
        });
      }

      const [{ data: purchase }, { data: profile }] = await Promise.all([
        client
          .from('purchases')
          .select('id, status')
          .eq('user_id', userData.user.id)
          .eq('status', 'success')
          .maybeSingle(),
        client
          .from('profiles')
          .select('role')
          .eq('id', userData.user.id)
          .maybeSingle(),
      ]);

      if (profile?.role === 'admin' || purchase) {
        return res.json({
          entitled: true,
          reason: profile?.role === 'admin' ? 'admin' : 'verified_purchase',
          youtubeVideoId: lesson.youtube_video_id,
        });
      }

      return res.status(403).json({
        entitled: false,
        error:
          'Active course purchase entitlement required to release protected video ID.',
      });
    }
  );

  // 3B. Public / Authenticated Primary Video Coverage Map (Hydrates frontend curriculum state)
  app.get('/api/public/video-coverage-map', async (_req: Request, res: Response) => {
    try {
      const supabase = getServerSupabaseClient();
      const { recordsByLessonId, dbVideoIdByLessonId } =
        await loadAllLessonRecommendationsMap(supabase);

      const primaryVideoByLessonId: Record<string, string> = {};
      for (const lvl of CURRICULUM_LEVELS) {
        for (const mod of lvl.modules) {
          for (const les of mod.lessons) {
            const rec = recordsByLessonId[les.id];
            const approvedPrimary =
              rec?.recommendations.find(
                (r) => r.status === 'approved' && r.isPrimary
              ) || rec?.recommendations.find((r) => r.status === 'approved');
            const validDbId = extractYoutubeVideoId(
              dbVideoIdByLessonId[les.id] || ''
            );
            const resolvedId = approvedPrimary?.videoId || validDbId;
            if (resolvedId) {
              primaryVideoByLessonId[les.id] = resolvedId;
            }
          }
        }
      }

      return res.json({
        ok: true,
        primaryVideoByLessonId,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        primaryVideoByLessonId: {},
        error: err.message,
      });
    }
  });

  // 3C. Student Lesson Approved Video Recommendations (Cached + On-Demand Discovery Fallback)
  app.get(
    '/api/lessons/:lessonId/recommendations',
    async (req: Request, res: Response) => {
      try {
        const { lessonId } = req.params;
        const forceRetry = req.query.retry === 'true';
        const allowAutoDiscover = req.query.autoDiscover !== 'false';
        const authHeader = req.headers.authorization;
        const token =
          authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split('Bearer ')[1]
            : undefined;

        const supabase = getServerSupabaseClient(token);
        const curriculumEntry = findLessonInCurriculum(lessonId);
        let isFreePreview = Boolean(curriculumEntry?.lesson.isFreePreview);
        let legacyYoutubeId = extractYoutubeVideoId(
          curriculumEntry?.lesson.youtubeVideoId || ''
        );

        if (supabase) {
          const { data: dbLesson } = await supabase
            .from('lessons')
            .select('id, is_free_preview, youtube_video_id')
            .eq('id', lessonId)
            .maybeSingle();
          if (dbLesson) {
            isFreePreview = Boolean(dbLesson.is_free_preview);
            const validDbVideoId = extractYoutubeVideoId(
              dbLesson.youtube_video_id || ''
            );
            legacyYoutubeId = validDbVideoId || legacyYoutubeId;
          }
        }

        // Note: Lesson access is gated by student login in the application UI;
        // always serve approved YouTube tutorial recommendations cleanly once the lesson player is opened.
        let record = await loadLessonRecommendations(supabase, lessonId);
        let approved = record.recommendations.filter(
          (r) => r.status === 'approved'
        );

        // If lesson has no approved video and has never been searched (or student clicked Retry), trigger server-side discovery
        if (
          approved.length === 0 &&
          allowAutoDiscover &&
          (!record.lastRefreshedAt || forceRetry)
        ) {
          await batchDiscoverLessonVideos(supabase, {
            lessonIds: [lessonId],
            autoApproveTopStrong: true,
            forceRefresh: forceRetry,
          });
          record = await loadLessonRecommendations(supabase, lessonId);
          approved = record.recommendations.filter(
            (r) => r.status === 'approved'
          );
        }

        // Sort so primary recommendation is first, then by rank score, max 3 (1 primary + up to 2 alternatives)
        approved.sort((a, b) => {
          if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
          return (
            (b.evidence?.totalRankScore || 0) -
            (a.evidence?.totalRankScore || 0)
          );
        });

        const topApproved = approved.slice(0, 3);
        const candidateCount = record.recommendations.filter(
          (r) => r.status === 'candidate'
        ).length;
        const resolvedPrimaryId =
          topApproved[0]?.videoId || legacyYoutubeId || null;

        let studentState: StudentRecommendationState = 'no_suitable_video';
        if (resolvedPrimaryId) {
          studentState = 'approved_available';
        } else if (record.lastError) {
          studentState = 'technical_error';
        } else if (candidateCount > 0 || !record.lastRefreshedAt) {
          studentState = 'searching_or_awaiting_approval';
        } else {
          studentState = 'no_suitable_video';
        }

        return res.json({
          ok: !record.lastError || Boolean(resolvedPrimaryId),
          entitled: true,
          lessonId,
          studentState,
          candidateCount,
          searchQueryUsed: record.searchQueryUsed,
          lastRefreshedAt: record.lastRefreshedAt,
          reviewReason: record.reviewReason || null,
          lastError: record.lastError || null,
          primaryVideoId: resolvedPrimaryId,
          recommendations: topApproved,
        });
      } catch (err: any) {
        return res.status(500).json({
          ok: false,
          studentState: 'technical_error' as StudentRecommendationState,
          recommendations: [],
          error:
            err.message ||
            'Failed to load recommended tutorials for this lesson.',
        });
      }
    }
  );

  // 4A. Admin: Load Cached & Approved YouTube Recommendations for a Lesson
  app.get(
    '/api/admin/youtube/recommendations/:lessonId',
    async (req: Request, res: Response) => {
      try {
        const check = await verifyAdminRequest(req);
        if (!check.authorized) {
          return res.status(403).json({ ok: false, error: check.error });
        }
        const token = req.headers.authorization?.split('Bearer ')[1];
        const supabase = getServerSupabaseClient(token);
        const { lessonId } = req.params;

        const record = await loadLessonRecommendations(supabase, lessonId);
        return res.json({
          ok: true,
          youtubeApiConfigured: isYoutubeApiKeyConfigured(),
          record,
        });
      } catch (err: any) {
        return res.status(500).json({
          ok: false,
          error: err.message || 'Failed to load lesson video recommendations.',
        });
      }
    }
  );

  // 4B. Admin: Discover & Rank Beginner-Friendly YouTube Videos for a Lesson
  app.post(
    '/api/admin/youtube/discover',
    async (req: Request, res: Response) => {
      try {
        const check = await verifyAdminRequest(req);
        if (!check.authorized) {
          return res.status(403).json({ ok: false, error: check.error });
        }

        const lessonId = String(req.body?.lessonId || '').trim();
        const customQuery = req.body?.customQuery
          ? String(req.body.customQuery).trim()
          : undefined;
        const autoApproveTopStrong = req.body?.autoApproveTopStrong !== false;

        if (!lessonId) {
          return res
            .status(400)
            .json({ ok: false, error: 'lessonId is required.' });
        }

        const token = req.headers.authorization?.split('Bearer ')[1];
        const supabase = getServerSupabaseClient(token);

        const existingRecord = await loadLessonRecommendations(
          supabase,
          lessonId
        );

        const discovery = await discoverAndRankYoutubeVideosForLesson({
          lessonId,
          customQuery,
        });

        if (!discovery.ok) {
          const failedRecord = {
            ...existingRecord,
            searchQueryUsed: discovery.searchQueryUsed,
            lastRefreshedAt: new Date().toISOString(),
            lastError:
              discovery.error || 'YouTube Data API v3 search request failed.',
          };
          await saveLessonRecommendations(supabase, failedRecord);

          return res.status(discovery.configured ? 502 : 400).json({
            ok: false,
            configured: discovery.configured,
            quotaExceeded: discovery.quotaExceeded,
            searchQueryUsed: discovery.searchQueryUsed,
            record: failedRecord,
            error: discovery.error,
          });
        }

        // Check sibling lesson in same module to avoid duplicate primary video
        const siblingLessonId = lessonId.endsWith('-les-1')
          ? lessonId.replace(/-les-1$/, '-les-2')
          : lessonId.replace(/-les-2$/, '-les-1');
        const siblingRecord = await loadLessonRecommendations(
          supabase,
          siblingLessonId
        );
        const siblingPrimaryIds = siblingRecord.recommendations
          .filter((r) => r.status === 'approved' && r.isPrimary)
          .map((r) => r.videoId);

        const updatedRecord = mergeAndAutoApproveCandidates({
          existingRecord,
          candidates: discovery.candidates,
          searchQueryUsed: discovery.searchQueryUsed,
          autoApproveTopStrong,
          avoidPrimaryVideoIds: siblingPrimaryIds,
        });

        await saveLessonRecommendations(supabase, updatedRecord);

        const primaryApproved = updatedRecord.recommendations.find(
          (r) => r.status === 'approved' && r.isPrimary
        );

        return res.json({
          ok: true,
          configured: true,
          searchQueryUsed: discovery.searchQueryUsed,
          candidatesFound: discovery.candidates.length,
          primaryVideoId: primaryApproved?.videoId || null,
          record: updatedRecord,
          message:
            discovery.candidates.length > 0
              ? primaryApproved
                ? `Discovered ${discovery.candidates.length} beginner-suited tutorial(s) and published "${primaryApproved.title}" (${primaryApproved.videoId}) as the Primary Lesson Video.`
                : `Discovered ${discovery.candidates.length} candidate tutorial(s). Review and approve a video below to publish it to the lesson player.`
              : 'No strong beginner-friendly YouTube tutorials met the minimum quality criteria for this query. Try refining the search query or paste a manual YouTube URL.',
        });
      } catch (err: any) {
        return res.status(500).json({
          ok: false,
          error:
            err.message || 'Server failed to discover YouTube recommendations.',
        });
      }
    }
  );

  // 4B-2. Admin: Full 108-Lesson Video Coverage Audit
  app.get(
    '/api/admin/youtube/audit',
    async (req: Request, res: Response) => {
      try {
        const check = await verifyAdminRequest(req);
        if (!check.authorized) {
          return res.status(403).json({ ok: false, error: check.error });
        }

        const verifyLive = req.query.verifyLive === 'true';
        const token = req.headers.authorization?.split('Bearer ')[1];
        const supabase = getServerSupabaseClient(token);

        const summary = await buildVideoCoverageAudit(supabase, {
          verifyLiveYoutubeStatus: verifyLive,
        });

        return res.json({
          ok: true,
          summary,
        });
      } catch (err: any) {
        return res.status(500).json({
          ok: false,
          error: err.message || 'Failed to run Video Coverage Audit.',
        });
      }
    }
  );

  // 4B-3. Admin: Batch Discover / Retry / Refresh Videos Across Missing or Selected Lessons
  app.post(
    '/api/admin/youtube/batch-discover',
    async (req: Request, res: Response) => {
      try {
        const check = await verifyAdminRequest(req);
        if (!check.authorized) {
          return res.status(403).json({ ok: false, error: check.error });
        }

        const token = req.headers.authorization?.split('Bearer ')[1];
        const supabase = getServerSupabaseClient(token);

        const mode = String(req.body?.mode || 'missing').trim();
        const requestedIds: string[] = Array.isArray(req.body?.lessonIds)
          ? req.body.lessonIds.map((id: any) => String(id).trim()).filter(Boolean)
          : [];
        const batchLimit = Math.min(
          40,
          Math.max(1, Number(req.body?.limit) || 12)
        );
        const forceRefresh = Boolean(req.body?.forceRefresh);
        const verifyBrokenFirst = Boolean(req.body?.verifyBrokenFirst);

        let targetLessonIds: string[] = [];

        if (requestedIds.length > 0) {
          targetLessonIds = requestedIds.slice(0, batchLimit);
        } else {
          const auditBefore = await buildVideoCoverageAudit(supabase, {
            verifyLiveYoutubeStatus: verifyBrokenFirst || mode === 'broken',
          });

          if (mode === 'failed') {
            targetLessonIds = auditBefore.items
              .filter((i) => i.state === 'search_error')
              .map((i) => i.lessonId);
          } else if (mode === 'broken') {
            targetLessonIds = auditBefore.items
              .filter((i) => i.state === 'broken_video' || i.brokenCount > 0)
              .map((i) => i.lessonId);
          } else if (mode === 'awaiting_review') {
            targetLessonIds = auditBefore.items
              .filter((i) => i.state === 'awaiting_review')
              .map((i) => i.lessonId);
          } else if (mode === 'outdated') {
            const cutoffMs = Date.now() - 14 * 24 * 60 * 60 * 1000;
            targetLessonIds = auditBefore.items
              .filter(
                (i) =>
                  !i.lastRefreshedAt ||
                  Date.parse(i.lastRefreshedAt) < cutoffMs
              )
              .map((i) => i.lessonId);
          } else {
            // Default 'missing': all lessons that do not currently have an approved video
            targetLessonIds = auditBefore.items
              .filter((i) => i.state !== 'approved')
              .map((i) => i.lessonId);
          }
          targetLessonIds = targetLessonIds.slice(0, batchLimit);
        }

        const batchRes = await batchDiscoverLessonVideos(supabase, {
          lessonIds: targetLessonIds,
          autoApproveTopStrong: true,
          forceRefresh:
            forceRefresh || mode === 'broken' || mode === 'outdated',
        });

        const updatedSummary = await buildVideoCoverageAudit(supabase, {
          verifyLiveYoutubeStatus: false,
        });

        return res.json({
          ok: batchRes.ok,
          processedCount: batchRes.processedCount,
          approvedLessonsCount: batchRes.approvedLessonsCount,
          awaitingReviewCount: batchRes.awaitingReviewCount,
          failedCount: batchRes.failedCount,
          quotaExceeded: batchRes.quotaExceeded,
          remainingMissingCount: updatedSummary.lessonsWithoutVideos,
          results: batchRes.results,
          summary: updatedSummary,
          message: `Processed ${batchRes.processedCount} lesson(s): ${batchRes.approvedLessonsCount} approved, ${batchRes.awaitingReviewCount} awaiting review, ${batchRes.failedCount} failed.`,
        });
      } catch (err: any) {
        return res.status(500).json({
          ok: false,
          error:
            err.message || 'Batch YouTube video discovery request failed.',
        });
      }
    }
  );

  // 4C. Admin: Manually Add / Paste a YouTube Video URL or ID for a Lesson
  app.post(
    '/api/admin/youtube/manual-add',
    async (req: Request, res: Response) => {
      try {
        const check = await verifyAdminRequest(req);
        if (!check.authorized) {
          return res.status(403).json({ ok: false, error: check.error });
        }

        const lessonId = String(req.body?.lessonId || '').trim();
        const videoUrlOrId = String(req.body?.videoUrlOrId || '').trim();
        const setAsPrimary = req.body?.setAsPrimary !== false;

        if (!lessonId || !videoUrlOrId) {
          return res.status(400).json({
            ok: false,
            error: 'Both lessonId and videoUrlOrId are required.',
          });
        }

        const fetched = await fetchSingleYoutubeVideoForLesson({
          lessonId,
          videoUrlOrId,
        });

        if (!fetched.ok || !fetched.recommendation) {
          return res.status(400).json({
            ok: false,
            error: fetched.error || 'Could not validate YouTube video URL/ID.',
          });
        }

        const token = req.headers.authorization?.split('Bearer ')[1];
        const supabase = getServerSupabaseClient(token);
        const existingRecord = await loadLessonRecommendations(
          supabase,
          lessonId
        );

        const hasExistingPrimary = existingRecord.recommendations.some(
          (r) => r.status === 'approved' && r.isPrimary
        );
        const makePrimary = setAsPrimary || !hasExistingPrimary;

        const approvedRec = {
          ...fetched.recommendation,
          status: 'approved' as const,
          suitabilityLabel: 'Admin Approved · Beginner Suitable' as const,
          isPrimary: makePrimary,
          approvedAt: new Date().toISOString(),
        };

        const filtered = existingRecord.recommendations
          .filter((r) => r.videoId !== approvedRec.videoId)
          .map((r) => (makePrimary ? { ...r, isPrimary: false } : r));

        const updatedRecord = {
          lessonId,
          searchQueryUsed: existingRecord.searchQueryUsed,
          lastRefreshedAt:
            existingRecord.lastRefreshedAt || new Date().toISOString(),
          recommendations: [approvedRec, ...filtered],
        };

        await saveLessonRecommendations(supabase, updatedRecord);

        const primaryRec = updatedRecord.recommendations.find(
          (r) => r.status === 'approved' && r.isPrimary
        );

        return res.json({
          ok: true,
          record: updatedRecord,
          primaryVideoId: primaryRec?.videoId || approvedRec.videoId,
          message: `Added and approved "${approvedRec.title}" (${approvedRec.videoId})${
            makePrimary ? ' as Primary Lesson Video' : ' as Alternative Tutorial'
          }.`,
        });
      } catch (err: any) {
        return res.status(500).json({
          ok: false,
          error: err.message || 'Failed to add manual YouTube video.',
        });
      }
    }
  );

  // 4D. Admin: Approve, Reject, or Set Primary Video Recommendation
  app.post(
    '/api/admin/youtube/recommendations/:lessonId/status',
    async (req: Request, res: Response) => {
      try {
        const check = await verifyAdminRequest(req);
        if (!check.authorized) {
          return res.status(403).json({ ok: false, error: check.error });
        }

        const { lessonId } = req.params;
        const videoId = String(req.body?.videoId || '').trim();
        const status = String(req.body?.status || 'approved') as RecommendationStatus;
        const requestedPrimary = Boolean(req.body?.isPrimary);

        if (!lessonId || !videoId) {
          return res.status(400).json({
            ok: false,
            error: 'lessonId and videoId are required.',
          });
        }

        const token = req.headers.authorization?.split('Bearer ')[1];
        const supabase = getServerSupabaseClient(token);
        const existingRecord = await loadLessonRecommendations(
          supabase,
          lessonId
        );

        const targetExists = existingRecord.recommendations.some(
          (r) => r.videoId === videoId
        );
        if (!targetExists) {
          return res.status(404).json({
            ok: false,
            error: `Video ${videoId} not found in recommendations for lesson ${lessonId}.`,
          });
        }

        const otherApprovedPrimary = existingRecord.recommendations.some(
          (r) =>
            r.videoId !== videoId && r.status === 'approved' && r.isPrimary
        );
        const makePrimary =
          status === 'approved' && (requestedPrimary || !otherApprovedPrimary);

        const updatedRecs = existingRecord.recommendations.map((rec) => {
          if (rec.videoId === videoId) {
            return {
              ...rec,
              status,
              isPrimary: status === 'approved' ? makePrimary : false,
              suitabilityLabel:
                status === 'approved'
                  ? ('Admin Approved · Beginner Suitable' as const)
                  : rec.suitabilityLabel,
              approvedAt:
                status === 'approved' ? new Date().toISOString() : null,
            };
          }
          if (makePrimary) {
            return { ...rec, isPrimary: false };
          }
          return rec;
        });

        // Ensure at least one approved video is marked primary if any approved videos exist
        const anyPrimary = updatedRecs.some(
          (r) => r.status === 'approved' && r.isPrimary
        );
        if (!anyPrimary) {
          const firstApproved = updatedRecs.find(
            (r) => r.status === 'approved'
          );
          if (firstApproved) {
            firstApproved.isPrimary = true;
          }
        }

        const updatedRecord = {
          ...existingRecord,
          recommendations: updatedRecs,
        };

        await saveLessonRecommendations(supabase, updatedRecord);

        const primaryVideo = updatedRecord.recommendations.find(
          (r) => r.status === 'approved' && r.isPrimary
        );

        return res.json({
          ok: true,
          record: updatedRecord,
          primaryVideoId: primaryVideo?.videoId || null,
          message:
            status === 'approved'
              ? `Approved tutorial (${videoId})${
                  makePrimary ? ' and set as Primary Lesson Video.' : ' as an Alternative Video.'
                }`
              : status === 'rejected'
              ? `Rejected video (${videoId}). It will not be shown to students.`
              : `Moved video (${videoId}) back to candidate review queue.`,
        });
      } catch (err: any) {
        return res.status(500).json({
          ok: false,
          error: err.message || 'Failed to update recommendation status.',
        });
      }
    }
  );

  // 4E. Admin: Remove an Unavailable or Unsuitable Video Recommendation
  app.delete(
    '/api/admin/youtube/recommendations/:lessonId/:videoId',
    async (req: Request, res: Response) => {
      try {
        const check = await verifyAdminRequest(req);
        if (!check.authorized) {
          return res.status(403).json({ ok: false, error: check.error });
        }

        const { lessonId, videoId } = req.params;
        const token = req.headers.authorization?.split('Bearer ')[1];
        const supabase = getServerSupabaseClient(token);

        const existingRecord = await loadLessonRecommendations(
          supabase,
          lessonId
        );
        const remaining = existingRecord.recommendations.filter(
          (r) => r.videoId !== videoId
        );

        // If primary was removed, promote next approved video if any
        if (!remaining.some((r) => r.status === 'approved' && r.isPrimary)) {
          const nextApproved = remaining.find((r) => r.status === 'approved');
          if (nextApproved) {
            nextApproved.isPrimary = true;
          }
        }

        const updatedRecord = {
          ...existingRecord,
          recommendations: remaining,
        };

        if (supabase) {
          await supabase
            .from('lesson_video_recommendations')
            .delete()
            .eq('lesson_id', lessonId)
            .eq('video_id', videoId);
        }

        await saveLessonRecommendations(supabase, updatedRecord);

        const primaryVideo = updatedRecord.recommendations.find(
          (r) => r.status === 'approved' && r.isPrimary
        );

        return res.json({
          ok: true,
          record: updatedRecord,
          primaryVideoId: primaryVideo?.videoId || null,
          message: `Removed video ${videoId} from lesson recommendations.`,
        });
      } catch (err: any) {
        return res.status(500).json({
          ok: false,
          error: err.message || 'Failed to remove video recommendation.',
        });
      }
    }
  );

  // 4F. Stage 3 Server-Side YouTube Data API v3 Playlist Importer (Admin Protected)
  app.post(
    '/api/admin/youtube/playlist-preview',
    async (req: Request, res: Response) => {
      try {
        const check = await verifyAdminRequest(req);
        if (!check.authorized) {
          return res.status(403).json({ error: check.error });
        }

        const { playlistIdOrUrl } = req.body;
        if (!playlistIdOrUrl || !String(playlistIdOrUrl).trim()) {
          return res.status(400).json({ error: 'Please provide a YouTube Playlist ID or URL.' });
        }

        const playlistId = extractYoutubePlaylistId(String(playlistIdOrUrl));
        const youtubeApiKey = (process.env.YOUTUBE_API_KEY || '').trim();

        if (!isYoutubeApiKeyConfigured()) {
          return res.status(400).json({
            configured: false,
            error:
              'YOUTUBE_API_KEY is not configured in AI Studio Secrets yet. Add your YouTube Data API v3 key as YOUTUBE_API_KEY in Secrets to fetch live playlist metadata from YouTube.',
          });
        }

        const apiUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        apiUrl.searchParams.set('part', 'snippet,contentDetails,status');
        apiUrl.searchParams.set('maxResults', '25');
        apiUrl.searchParams.set('playlistId', playlistId);
        apiUrl.searchParams.set('key', youtubeApiKey);

        const ytRes = await fetch(apiUrl.toString());
        const ytData: any = await ytRes.json();

        if (!ytRes.ok) {
          return res.status(ytRes.status).json({
            configured: true,
            error:
              ytData?.error?.message ||
              'Failed to fetch playlist from YouTube Data API v3.',
          });
        }

        const items = (ytData.items || []).map((item: any, idx: number) => {
          const title = item.snippet?.title || 'Untitled Video';
          const privacyStatus = item.status?.privacyStatus || 'unknown';
          const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || '';
          const isUnavailable =
            title === 'Private video' ||
            title === 'Deleted video' ||
            privacyStatus === 'private' ||
            !videoId;

          return {
            videoId,
            title,
            description: item.snippet?.description || '',
            position: typeof item.snippet?.position === 'number' ? item.snippet.position + 1 : idx + 1,
            privacyStatus,
            thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
            eligible: !isUnavailable,
          };
        });

        return res.json({
          configured: true,
          playlistId,
          items,
        });
      } catch (err: any) {
        return res.status(500).json({
          error: err.message || 'Unexpected error calling YouTube Data API v3.',
        });
      }
    }
  );

  // 5. Server-Verified Admin Endpoint: Seed 6-Level Curriculum into Supabase
  app.post('/api/admin/seed-curriculum', async (req: Request, res: Response) => {
    try {
      const check = await verifyAdminRequest(req);
      if (!check.authorized) {
        return res.status(403).json({ error: check.error });
      }

      const token = req.headers.authorization?.split('Bearer ')[1];
      const supabase = getServerSupabaseClient(token);
      if (!supabase) {
        return res.status(503).json({ error: 'Supabase not configured' });
      }

      if (check.userId && check.email) {
        await supabase.from('profiles').upsert(
          {
            id: check.userId,
            email: check.email,
            role: 'admin',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }

      // 1. Upsert Course
      const { error: courseErr } = await supabase.from('courses').upsert(
        {
          id: INITIAL_COURSE.id,
          slug: INITIAL_COURSE.slug,
          title: INITIAL_COURSE.title,
          subtitle: INITIAL_COURSE.subtitle,
          description: INITIAL_COURSE.description,
          one_time_price: INITIAL_COURSE.oneTimePrice,
          currency: INITIAL_COURSE.currency,
          status: INITIAL_COURSE.status,
          lifetime_access_entitlement: INITIAL_COURSE.lifetimeAccessEntitlement,
          preview_lesson_count: INITIAL_COURSE.previewLessonCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (courseErr) throw new Error(courseErr.message);

      // 2. Upsert Modules
      const moduleRows = CURRICULUM_LEVELS.flatMap((lvl) =>
        lvl.modules.map((m) => ({
          id: m.id,
          course_id: INITIAL_COURSE.id,
          level_number: lvl.levelNumber,
          order_index: m.orderIndex,
          title: m.title,
          summary: m.summary,
        }))
      );

      const { error: modErr } = await supabase
        .from('modules')
        .upsert(moduleRows, { onConflict: 'id' });
      if (modErr) throw new Error(modErr.message);

      // 3. Upsert Lessons (Preserving any already-approved youtube_video_id in DB/cache)
      const { recordsByLessonId, dbVideoIdByLessonId } =
        await loadAllLessonRecommendationsMap(supabase);

      const lessonRows = CURRICULUM_LEVELS.flatMap((lvl) =>
        lvl.modules.flatMap((m) =>
          m.lessons.map((l) => {
            const rec = recordsByLessonId[l.id];
            const approvedPrimary =
              rec?.recommendations.find(
                (r) => r.status === 'approved' && r.isPrimary
              ) || rec?.recommendations.find((r) => r.status === 'approved');
            const existingValidDbVid = extractYoutubeVideoId(
              dbVideoIdByLessonId[l.id] || ''
            );
            const preservedYoutubeId =
              approvedPrimary?.videoId ||
              existingValidDbVid ||
              extractYoutubeVideoId(l.youtubeVideoId || '') ||
              null;

            return {
              id: l.id,
              module_id: m.id,
              level_number: lvl.levelNumber,
              order_index: l.orderIndex,
              title: l.title,
              description: l.description,
              duration_minutes: l.durationMinutes,
              is_free_preview: l.isFreePreview,
              youtube_video_id: preservedYoutubeId,
              key_formulas: l.keyFormulas,
              concept_summary: l.conceptSummary,
            };
          })
        )
      );

      const { error: lesErr } = await supabase
        .from('lessons')
        .upsert(lessonRows, { onConflict: 'id' });
      if (lesErr) throw new Error(lesErr.message);

      // 4. Upsert Practice Resources
      const resourceRows = CURRICULUM_LEVELS.flatMap((lvl) =>
        lvl.modules.flatMap((m) =>
          m.lessons.map((l) => ({
            id: l.resource.id,
            lesson_id: l.id,
            file_name: l.resource.fileName,
            file_description: l.resource.fileDescription,
            download_url: l.resource.downloadUrl || null,
            assignment_instructions: l.resource.assignmentInstructions,
            expected_outcome: l.resource.expectedOutcome,
            sample_csv_content: l.resource.sampleCsvContent,
          }))
        )
      );

      const { error: resErr } = await supabase
        .from('lesson_resources')
        .upsert(resourceRows, { onConflict: 'id' });
      if (resErr) throw new Error(resErr.message);

      // 5. Upsert Quizzes & Quiz Questions
      const quizRows = CURRICULUM_LEVELS.flatMap((lvl) =>
        lvl.modules.flatMap((m) =>
          m.lessons
            .filter((l) => Boolean(l.quiz))
            .map((l) => ({
              id: l.quiz!.id,
              lesson_id: l.id,
              module_id: m.id,
              title: l.quiz!.title,
              passing_score_percent: l.quiz!.passingScorePercent,
            }))
        )
      );

      if (quizRows.length > 0) {
        await supabase.from('quizzes').upsert(quizRows, { onConflict: 'id' });
      }

      const questionRows = CURRICULUM_LEVELS.flatMap((lvl) =>
        lvl.modules.flatMap((m) =>
          m.lessons.flatMap((l) =>
            (l.quiz?.questions || []).map((q) => ({
              id: q.id,
              quiz_id: l.quiz!.id,
              question_text: q.questionText,
              formula_context: q.formulaContext || null,
              options: q.options,
              correct_option_index: q.correctOptionIndex,
              explanation: q.explanation,
            }))
          )
        )
      );

      if (questionRows.length > 0) {
        await supabase
          .from('quiz_questions')
          .upsert(questionRows, { onConflict: 'id' });
      }

      return res.json({
        ok: true,
        message: `Successfully seeded 6 Levels, ${moduleRows.length} Modules, ${lessonRows.length} Lessons, ${resourceRows.length} Workbooks, and ${questionRows.length} Quiz Questions into Supabase PostgreSQL.`,
      });
    } catch (err: any) {
      return res.status(500).json({
        error: err.message || 'Failed to seed curriculum to Supabase.',
      });
    }
  });

  // 6. Server-Verified Admin Endpoint: Update Course Settings
  app.post('/api/admin/course-settings', async (req: Request, res: Response) => {
    try {
      const check = await verifyAdminRequest(req);
      if (!check.authorized) {
        return res.status(403).json({ error: check.error });
      }
      const token = req.headers.authorization?.split('Bearer ')[1];
      const supabase = getServerSupabaseClient(token);
      if (!supabase) {
        return res.status(503).json({ error: 'Supabase not configured' });
      }

      const body = req.body;
      const { error } = await supabase.from('courses').upsert(
        {
          id: body.id || INITIAL_COURSE.id,
          slug: body.slug || INITIAL_COURSE.slug,
          title: body.title,
          subtitle: body.subtitle || INITIAL_COURSE.subtitle,
          description: body.description,
          one_time_price: Number(body.oneTimePrice),
          currency: body.currency,
          status: body.status,
          lifetime_access_entitlement: Boolean(body.lifetimeAccessEntitlement),
          preview_lesson_count: Number(body.previewLessonCount),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) throw new Error(error.message);

      return res.json({
        ok: true,
        message: 'Course settings persisted to Supabase PostgreSQL.',
      });
    } catch (err: any) {
      return res.status(500).json({
        error: err.message || 'Failed to save course settings.',
      });
    }
  });

  // 7. Server-Verified Admin Endpoint: Create or Update Lesson & Practice Material
  app.post('/api/admin/lessons', async (req: Request, res: Response) => {
    try {
      const check = await verifyAdminRequest(req);
      if (!check.authorized) {
        return res.status(403).json({ error: check.error });
      }
      const token = req.headers.authorization?.split('Bearer ')[1];
      const supabase = getServerSupabaseClient(token);
      if (!supabase) {
        return res.status(503).json({ error: 'Supabase not configured' });
      }

      const l = req.body;
      const { error: lesErr } = await supabase.from('lessons').upsert(
        {
          id: l.id,
          module_id: l.moduleId,
          level_number: Number(l.levelNumber),
          order_index: Number(l.orderIndex),
          title: l.title,
          description: l.description,
          duration_minutes: Number(l.durationMinutes),
          is_free_preview: Boolean(l.isFreePreview),
          youtube_video_id: l.youtubeVideoId || null,
          key_formulas: l.keyFormulas || [],
          concept_summary: l.conceptSummary || [],
        },
        { onConflict: 'id' }
      );

      if (lesErr) throw new Error(lesErr.message);

      if (l.resource) {
        await supabase.from('lesson_resources').upsert(
          {
            id: l.resource.id,
            lesson_id: l.id,
            file_name: l.resource.fileName,
            file_description: l.resource.fileDescription,
            download_url: l.resource.downloadUrl || null,
            assignment_instructions: l.resource.assignmentInstructions,
            expected_outcome: l.resource.expectedOutcome,
            sample_csv_content: l.resource.sampleCsvContent,
          },
          { onConflict: 'id' }
        );
      }

      return res.json({
        ok: true,
        message: `Lesson "${l.title}" persisted to Supabase PostgreSQL.`,
      });
    } catch (err: any) {
      return res.status(500).json({
        error: err.message || 'Failed to save lesson to Supabase.',
      });
    }
  });

  // 8. Server-Verified Admin Endpoint: Delete / Remove Unavailable Lesson
  app.delete(
    '/api/admin/lessons/:lessonId',
    async (req: Request, res: Response) => {
      try {
        const check = await verifyAdminRequest(req);
        if (!check.authorized) {
          return res.status(403).json({ error: check.error });
        }
        const token = req.headers.authorization?.split('Bearer ')[1];
        const supabase = getServerSupabaseClient(token);
        if (!supabase) {
          return res.status(503).json({ error: 'Supabase not configured' });
        }

        const { lessonId } = req.params;
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('id', lessonId);

        if (error) throw new Error(error.message);

        return res.json({
          ok: true,
          message: `Lesson ${lessonId} removed from Supabase PostgreSQL.`,
        });
      } catch (err: any) {
        return res.status(500).json({
          error: err.message || 'Failed to remove lesson.',
        });
      }
    }
  );

  // 9. Server-Verified Admin Endpoint: Add / Update Quiz Question
  app.post('/api/admin/quizzes/question', async (req: Request, res: Response) => {
    try {
      const check = await verifyAdminRequest(req);
      if (!check.authorized) {
        return res.status(403).json({ error: check.error });
      }
      const token = req.headers.authorization?.split('Bearer ')[1];
      const supabase = getServerSupabaseClient(token);
      if (!supabase) {
        return res.status(503).json({ error: 'Supabase not configured' });
      }

      const { quizId, lessonId, moduleId, quizTitle, passingScorePercent, question } =
        req.body;

      await supabase.from('quizzes').upsert(
        {
          id: quizId,
          lesson_id: lessonId,
          module_id: moduleId,
          title: quizTitle,
          passing_score_percent: Number(passingScorePercent) || 67,
        },
        { onConflict: 'id' }
      );

      const { error: qErr } = await supabase.from('quiz_questions').upsert(
        {
          id: question.id,
          quiz_id: quizId,
          question_text: question.questionText,
          formula_context: question.formulaContext || null,
          options: question.options,
          correct_option_index: Number(question.correctOptionIndex),
          explanation: question.explanation,
        },
        { onConflict: 'id' }
      );

      if (qErr) throw new Error(qErr.message);

      return res.json({
        ok: true,
        message: 'Quiz question persisted to Supabase PostgreSQL.',
      });
    } catch (err: any) {
      return res.status(500).json({
        error: err.message || 'Failed to save quiz question.',
      });
    }
  });

  // ==========================================================================
  // STAGE 4 — PAYSTACK PAYMENTS, WEBHOOKS & COURSE ACCESS ENTITLEMENT
  // ==========================================================================

  // 10. Initialize Paystack Transaction (Server-Side Authoritative Price Lookup)
  app.post('/api/paystack/initialize', async (req: Request, res: Response) => {
    try {
      const paystackSecretKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();
      if (!isPaystackSecretConfigured()) {
        return res.status(400).json({
          ok: false,
          paystackConfigured: false,
          error:
            'PAYSTACK_SECRET_KEY is not configured in AI Studio Secrets. Add your Paystack Secret Key (sk_test_... or sk_live_...) in Secrets to initialize live Paystack transactions.',
        });
      }

      const authHeader = req.headers.authorization;
      const token =
        authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.split('Bearer ')[1]
          : undefined;

      const supabase = getServerSupabaseClient(token);
      let userId: string | null = null;
      let userEmail = String(req.body?.email || '').trim();

      if (supabase && token) {
        const { data: uData } = await supabase.auth.getUser(token);
        if (uData?.user) {
          userId = uData.user.id;
          userEmail = uData.user.email || userEmail;
        }
      }

      if (!userEmail || !userEmail.includes('@')) {
        return res.status(400).json({
          ok: false,
          error: 'A valid student email address is required to initialize payment.',
        });
      }

      // Look up authoritative course price from Supabase (or fallback to INITIAL_COURSE)
      let authoritativePrice = INITIAL_COURSE.oneTimePrice;
      let authoritativeCurrency = INITIAL_COURSE.currency;
      let courseId = INITIAL_COURSE.id;

      if (supabase) {
        const { data: dbCourse } = await supabase
          .from('courses')
          .select('id, one_time_price, currency')
          .eq('id', INITIAL_COURSE.id)
          .maybeSingle();
        if (dbCourse) {
          courseId = dbCourse.id;
          authoritativePrice = Number(dbCourse.one_time_price) || INITIAL_COURSE.oneTimePrice;
          authoritativeCurrency = dbCourse.currency || INITIAL_COURSE.currency;
        }
      }

      const amountInSubunit = Math.round(authoritativePrice * 100);
      const reference = `EXL-ACAD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const callbackUrl =
        String(req.body?.callbackUrl || process.env.APP_URL || '').trim() || undefined;

      // Record pending purchase in Supabase if user is authenticated in Supabase
      if (supabase && userId) {
        await supabase.from('purchases').insert({
          user_id: userId,
          course_id: courseId,
          paystack_reference: reference,
          amount: authoritativePrice,
          currency: authoritativeCurrency,
          status: 'pending',
        });
      }

      const paystackRes = await fetch(
        'https://api.paystack.co/transaction/initialize',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            amount: amountInSubunit,
            currency: authoritativeCurrency,
            reference,
            callback_url: callbackUrl,
            metadata: {
              course_id: courseId,
              user_id: userId,
              academy: 'Excel to Data Analyst Academy',
            },
          }),
        }
      );

      const paystackData: any = await paystackRes.json();
      if (!paystackRes.ok || !paystackData?.status) {
        return res.status(400).json({
          ok: false,
          paystackConfigured: true,
          error:
            paystackData?.message ||
            'Paystack rejected transaction initialization.',
        });
      }

      return res.json({
        ok: true,
        paystackConfigured: true,
        authorizationUrl: paystackData.data.authorization_url,
        accessCode: paystackData.data.access_code,
        reference: paystackData.data.reference || reference,
        amount: authoritativePrice,
        currency: authoritativeCurrency,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || 'Server failed to initialize Paystack transaction.',
      });
    }
  });

  // 11. Verify Paystack Transaction Reference (Zero-Trust Server-Side Verification)
  app.post('/api/paystack/verify', async (req: Request, res: Response) => {
    try {
      const reference = String(req.body?.reference || '').trim();
      if (!reference) {
        return res.status(400).json({
          ok: false,
          verified: false,
          error: 'Transaction reference is required for verification.',
        });
      }

      const paystackSecretKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();
      if (!isPaystackSecretConfigured()) {
        return res.status(400).json({
          ok: false,
          verified: false,
          paystackConfigured: false,
          error:
            'PAYSTACK_SECRET_KEY is not configured on the server. Cannot verify reference with Paystack API.',
        });
      }

      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
          },
        }
      );
      const verifyData: any = await verifyRes.json();

      if (!verifyRes.ok || !verifyData?.status || !verifyData?.data) {
        return res.status(400).json({
          ok: false,
          verified: false,
          error:
            verifyData?.message || 'Unable to verify transaction reference with Paystack.',
        });
      }

      const tx = verifyData.data;
      const authHeader = req.headers.authorization;
      const token =
        authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.split('Bearer ')[1]
          : undefined;
      const supabase = getServerSupabaseClient(token);

      let expectedPrice = INITIAL_COURSE.oneTimePrice;
      let expectedCurrency = INITIAL_COURSE.currency;
      let courseId = INITIAL_COURSE.id;

      if (supabase) {
        const { data: dbCourse } = await supabase
          .from('courses')
          .select('id, one_time_price, currency')
          .eq('id', INITIAL_COURSE.id)
          .maybeSingle();
        if (dbCourse) {
          courseId = dbCourse.id;
          expectedPrice = Number(dbCourse.one_time_price) || INITIAL_COURSE.oneTimePrice;
          expectedCurrency = dbCourse.currency || INITIAL_COURSE.currency;
        }
      }

      const expectedSubunit = Math.round(expectedPrice * 100);
      const isStatusSuccess = tx.status === 'success';
      const isAmountValid = Number(tx.amount) >= expectedSubunit;
      const isCurrencyValid =
        String(tx.currency || '').toUpperCase() === expectedCurrency.toUpperCase();

      if (!isStatusSuccess || !isAmountValid || !isCurrencyValid) {
        if (supabase) {
          await supabase
            .from('purchases')
            .update({ status: 'failed' })
            .eq('paystack_reference', reference);
        }
        return res.status(400).json({
          ok: false,
          verified: false,
          error: `Payment verification failed: status=${tx.status}, amount=${tx.amount / 100} ${tx.currency} (expected ${expectedPrice} ${expectedCurrency}).`,
        });
      }

      const paidAtIso = tx.paid_at || new Date().toISOString();

      // Update or upsert purchase row in Supabase
      if (supabase) {
        let userId: string | null = tx.metadata?.user_id || null;
        if (!userId && token) {
          const { data: uData } = await supabase.auth.getUser(token);
          userId = uData?.user?.id || null;
        }

        const { data: existingPurchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('paystack_reference', reference)
          .maybeSingle();

        if (existingPurchase) {
          await supabase
            .from('purchases')
            .update({
              status: 'success',
              paid_at: paidAtIso,
            })
            .eq('paystack_reference', reference);
        } else if (userId) {
          await supabase.from('purchases').insert({
            user_id: userId,
            course_id: courseId,
            paystack_reference: reference,
            amount: Number(tx.amount) / 100,
            currency: tx.currency || expectedCurrency,
            status: 'success',
            paid_at: paidAtIso,
          });
        }
      }

      return res.json({
        ok: true,
        verified: true,
        reference,
        amount: Number(tx.amount) / 100,
        currency: tx.currency || expectedCurrency,
        paidAt: paidAtIso,
        message:
          'Paystack transaction verified server-side. Lifetime course access granted!',
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        verified: false,
        error: err.message || 'Server error while verifying Paystack payment.',
      });
    }
  });

  // 12. Paystack Webhook Endpoint (HMAC SHA-512 Signature Verification)
  app.post('/api/paystack/webhook', async (req: any, res: Response) => {
    try {
      const paystackSecretKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();
      if (!isPaystackSecretConfigured()) {
        return res.status(400).send('Paystack secret key not configured');
      }

      const signature = String(req.headers['x-paystack-signature'] || '');
      const rawBody: Buffer =
        req.rawBody || Buffer.from(JSON.stringify(req.body || {}));

      const expectedHash = crypto
        .createHmac('sha512', paystackSecretKey)
        .update(rawBody)
        .digest('hex');

      if (!signature || signature !== expectedHash) {
        return res.status(401).send('Invalid Paystack webhook signature');
      }

      const event = req.body;
      if (event?.event === 'charge.success' && event?.data?.reference) {
        const tx = event.data;
        const reference = String(tx.reference);
        const paidAtIso = tx.paid_at || new Date().toISOString();

        const supabase = getServerSupabaseClient();
        if (supabase) {
          const { data: existing } = await supabase
            .from('purchases')
            .select('id, status')
            .eq('paystack_reference', reference)
            .maybeSingle();

          if (existing && existing.status !== 'success') {
            await supabase
              .from('purchases')
              .update({
                status: 'success',
                paid_at: paidAtIso,
              })
              .eq('paystack_reference', reference);
          } else if (!existing && tx.metadata?.user_id) {
            await supabase.from('purchases').insert({
              user_id: tx.metadata.user_id,
              course_id: tx.metadata.course_id || INITIAL_COURSE.id,
              paystack_reference: reference,
              amount: Number(tx.amount) / 100,
              currency: tx.currency || INITIAL_COURSE.currency,
              status: 'success',
              paid_at: paidAtIso,
            });
          }
        }
      }

      return res.status(200).json({ received: true });
    } catch {
      return res.status(500).send('Webhook processing failed');
    }
  });

  // 13. Student Entitlement & Purchase History Endpoint
  app.get('/api/student/purchases', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({
          authenticated: false,
          hasLifetimeAccess: false,
          purchases: [],
        });
      }
      const token = authHeader.split('Bearer ')[1];
      const supabase = getServerSupabaseClient(token);
      if (!supabase) {
        return res.json({
          authenticated: false,
          hasLifetimeAccess: false,
          purchases: [],
        });
      }

      const { data: uData } = await supabase.auth.getUser(token);
      if (!uData?.user) {
        return res.json({
          authenticated: false,
          hasLifetimeAccess: false,
          purchases: [],
        });
      }

      const user = uData.user;
      const [profileRes, purchasesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('purchases')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      const purchases = (purchasesRes.data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        courseId: p.course_id,
        paystackReference: p.paystack_reference,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        paidAt: p.paid_at,
        createdAt: p.created_at,
      }));

      const hasVerifiedPurchase = purchases.some(
        (p: any) => p.status === 'success'
      );
      const isAdmin = profileRes.data?.role === 'admin';

      return res.json({
        authenticated: true,
        hasLifetimeAccess: hasVerifiedPurchase || isAdmin,
        purchases,
      });
    } catch {
      return res.json({
        authenticated: false,
        hasLifetimeAccess: false,
        purchases: [],
      });
    }
  });

  // 14. Admin Live Directory & Purchases Endpoint (Sections 7, 8, 9)
  app.get('/api/admin/records', async (req: Request, res: Response) => {
    try {
      const check = await verifyAdminRequest(req);
      if (!check.authorized) {
        return res.status(403).json({ error: check.error });
      }
      const token = req.headers.authorization?.split('Bearer ')[1];
      const supabase = getServerSupabaseClient(token);
      if (!supabase) {
        return res.status(503).json({ error: 'Supabase not configured' });
      }

      const [profilesRes, purchasesRes, progressRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, full_name, role, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('purchases')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('lesson_progress')
          .select('user_id, lesson_id, completed')
          .eq('completed', true),
      ]);

      const progressCountByUser: Record<string, number> = {};
      (progressRes.data || []).forEach((row: any) => {
        progressCountByUser[row.user_id] =
          (progressCountByUser[row.user_id] || 0) + 1;
      });

      const emailByUser: Record<string, string> = {};
      (profilesRes.data || []).forEach((p: any) => {
        emailByUser[p.id] = p.email;
      });

      const verifiedBuyers = new Set(
        (purchasesRes.data || [])
          .filter((p: any) => p.status === 'success')
          .map((p: any) => p.user_id)
      );

      const students = (profilesRes.data || []).map((p: any) => ({
        id: p.id,
        email: p.email,
        fullName: p.full_name || 'Student',
        role: p.role,
        createdAt: p.created_at,
        completedLessonsCount: progressCountByUser[p.id] || 0,
        hasVerifiedPurchase: verifiedBuyers.has(p.id) || p.role === 'admin',
      }));

      const purchases = (purchasesRes.data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        userEmail: emailByUser[p.user_id] || p.user_id,
        courseId: p.course_id,
        paystackReference: p.paystack_reference,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        paidAt: p.paid_at,
        createdAt: p.created_at,
      }));

      return res.json({
        ok: true,
        students,
        purchases,
      });
    } catch (err: any) {
      return res.status(500).json({
        error: err.message || 'Failed to load admin records from Supabase.',
      });
    }
  });

  // 15. Server-Side Account Registration & Auto-Confirmation (Prevents broken localhost email redirect)
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      const fullName = String(req.body?.fullName || '').trim();

      if (!email || !password || password.length < 8) {
        return res.status(400).json({
          ok: false,
          error: 'Valid email and password (minimum 8 characters) are required.',
        });
      }

      const supabase = getServerSupabaseClient();
      if (!supabase) {
        return res.status(503).json({
          ok: false,
          error: 'Supabase is not configured on the server.',
        });
      }

      const adminEmails = [
        (process.env.ADMIN_BOOTSTRAPPED_EMAIL || 'okorotochukwu007@gmail.com')
          .trim()
          .toLowerCase(),
        'tokoro408@gmail.com',
        'nelszt@gmail.com',
      ];
      const assignedRole = adminEmails.includes(email) ? 'admin' : 'student';

      let userId: string | null = null;

      // Try creating user with email_confirm: true via Admin API
      const { data: createdData, error: createErr } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || email.split('@')[0],
          },
        });

      if (createdData?.user) {
        userId = createdData.user.id;
      } else if (createErr) {
        // User may already exist from an earlier unconfirmed signup; find & confirm them
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = (listData?.users || []).find(
          (u: any) => u.email?.toLowerCase() === email
        );
        if (existingUser) {
          userId = existingUser.id;
          await supabase.auth.admin.updateUserById(existingUser.id, {
            email_confirm: true,
            password,
            user_metadata: {
              full_name:
                fullName ||
                existingUser.user_metadata?.full_name ||
                email.split('@')[0],
            },
          });
        } else {
          return res.status(400).json({
            ok: false,
            error: createErr.message,
          });
        }
      }

      if (userId) {
        await supabase.from('profiles').upsert(
          {
            id: userId,
            email,
            full_name: fullName || email.split('@')[0],
            role: assignedRole,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }

      return res.json({
        ok: true,
        userId,
        role: assignedRole,
        message: 'Account created and email confirmed.',
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || 'Server failed to register account.',
      });
    }
  });

  // 16. Auto-Confirm Existing Unconfirmed User on Login
  app.post('/api/auth/confirm-email', async (req: Request, res: Response) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ ok: false, error: 'Email is required.' });
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        return res.status(503).json({ ok: false, error: 'Supabase not configured.' });
      }

      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = (listData?.users || []).find(
        (u: any) => u.email?.toLowerCase() === email
      );
      if (!existingUser) {
        return res.status(404).json({ ok: false, error: 'User not found.' });
      }

      await supabase.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
      });

      const adminEmails = [
        (process.env.ADMIN_BOOTSTRAPPED_EMAIL || 'okorotochukwu007@gmail.com')
          .trim()
          .toLowerCase(),
        'tokoro408@gmail.com',
        'nelszt@gmail.com',
      ];
      if (adminEmails.includes(email)) {
        await supabase.from('profiles').upsert(
          {
            id: existingUser.id,
            email,
            full_name:
              existingUser.user_metadata?.full_name || email.split('@')[0],
            role: 'admin',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }

      return res.json({ ok: true, confirmed: true, userId: existingUser.id });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || 'Failed to confirm user email.',
      });
    }
  });

  // 16b. Check Email Confirmation Status (Allows automatic login as soon as email link is clicked)
  app.post('/api/auth/check-confirmation', async (req: Request, res: Response) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ ok: false, error: 'Email is required.' });
      }
      const supabase = getServerSupabaseClient();
      if (!supabase) {
        return res.json({ ok: true, exists: false, confirmed: false });
      }

      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = (listData?.users || []).find(
        (u: any) => u.email?.toLowerCase() === email
      );
      if (!existingUser) {
        return res.json({ ok: true, exists: false, confirmed: false });
      }

      const isConfirmed = Boolean(
        existingUser.email_confirmed_at || existingUser.confirmed_at
      );

      return res.json({
        ok: true,
        exists: true,
        confirmed: isConfirmed,
        userId: existingUser.id,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || 'Failed to check confirmation status.',
      });
    }
  });

  // 17. Reset Student Password Server-Side (Supports Forgot Password Recovery Flow)
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const newPassword = String(req.body?.newPassword || '');

      if (!email || !email.includes('@')) {
        return res.status(400).json({
          ok: false,
          error: 'Please provide a valid registered email address.',
        });
      }
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({
          ok: false,
          error: 'New password must be at least 8 characters long.',
        });
      }

      const supabase = getServerSupabaseClient();
      if (!supabase) {
        return res.status(503).json({
          ok: false,
          error: 'Supabase is not configured on the server.',
        });
      }

      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = (listData?.users || []).find(
        (u: any) => u.email?.toLowerCase() === email
      );

      if (!existingUser) {
        return res.status(404).json({
          ok: false,
          error: 'No student account found with that email address. Please sign up first.',
        });
      }

      const { error: updateErr } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: newPassword,
          email_confirm: true,
        }
      );

      if (updateErr) {
        return res.status(400).json({
          ok: false,
          error: updateErr.message || 'Could not update password.',
        });
      }

      return res.json({
        ok: true,
        message: 'Your password has been reset. You can now log in with your new password.',
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || 'Failed to reset password.',
      });
    }
  });

  // Vite middleware for development / static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Excel to Data Analyst Academy server running on http://localhost:${PORT}`);
  });
}

startServer();
