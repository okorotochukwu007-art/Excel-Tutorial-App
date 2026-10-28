import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
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

let cachedInstructorJwt: { token: string; expiresAt: number } | null = null;

async function getAdminSupabaseClient(bearerToken?: string) {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (isValidSupabaseConfig(supabaseUrl, serviceRoleKey)) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  if (!isValidSupabaseConfig(supabaseUrl, anonKey)) {
    return null;
  }

  const expectedKey = (process.env.INSTRUCTOR_MASTER_KEY || 'OKORO-EXCEL-CHIEF-2026').trim();
  const cleanBearer = (bearerToken || '').trim();

  // If caller passed a real JWT token, verify if it belongs to the admin
  if (cleanBearer && cleanBearer !== expectedKey) {
    const testClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${cleanBearer}` } },
    });
    try {
      const { data } = await testClient.auth.getUser(cleanBearer);
      if (data?.user?.email?.toLowerCase() === 'okorotochukwu007@gmail.com') {
        await testClient.from('profiles').upsert(
          {
            id: data.user.id,
            email: 'okorotochukwu007@gmail.com',
            full_name: 'Tochukwu Okoro (Lead Instructor)',
            role: 'admin',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
        return testClient;
      }
    } catch {
      // Fall through to cached/instructor sign-in
    }
  }

  if (cachedInstructorJwt && cachedInstructorJwt.expiresAt > Date.now()) {
    return createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${cachedInstructorJwt.token}` } },
    });
  }

  try {
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: signInData } = await anonClient.auth.signInWithPassword({
      email: 'okorotochukwu007@gmail.com',
      password: 'Solution',
    });
    if (signInData?.session?.access_token) {
      cachedInstructorJwt = {
        token: signInData.session.access_token,
        expiresAt: Date.now() + 25 * 60 * 1000,
      };
      const authedClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: { Authorization: `Bearer ${signInData.session.access_token}` },
        },
      });
      await authedClient.from('profiles').upsert(
        {
          id: signInData.user.id,
          email: 'okorotochukwu007@gmail.com',
          full_name: 'Tochukwu Okoro (Lead Instructor)',
          role: 'admin',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      return authedClient;
    }
  } catch {
    // Ignore if instructor password differs in Supabase
  }

  return getServerSupabaseClient(
    cleanBearer && cleanBearer !== expectedKey ? cleanBearer : undefined
  );
}

async function listAllSupabaseAuthUsers(supabase: any): Promise<any[]> {
  if (!supabase?.auth?.admin?.listUsers) return [];
  const allUsers: any[] = [];
  const seenIds = new Set<string>();
  try {
    let page = 1;
    const perPage = 1000;
    while (page <= 10) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error || !data?.users || data.users.length === 0) break;
      for (const u of data.users) {
        if (u?.id && !seenIds.has(u.id)) {
          seenIds.add(u.id);
          allUsers.push(u);
        }
      }
      if (data.users.length < perPage) break;
      page++;
    }
  } catch {
    // Ignore admin listUsers error when service role key is not configured
  }
  return allUsers;
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
      const supabase = await getAdminSupabaseClient(token);

      const mergedUsers = await buildMergedAdminAccessUsersList(undefined, token);

      let rawPurchases: any[] = [];
      const emailByUser: Record<string, string> = {};

      if (supabase) {
        try {
          const [profilesRes, purchasesRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, email, full_name, role, created_at')
              .order('created_at', { ascending: false }),
            supabase
              .from('purchases')
              .select('*')
              .order('created_at', { ascending: false }),
          ]);

          (profilesRes.data || []).forEach((p: any) => {
            if (p.id && p.email) {
              emailByUser[p.id] = p.email;
            }
          });
          rawPurchases = purchasesRes.data || [];
        } catch {
          // Ignore DB error and rely on merged access users
        }
      }

      const students = mergedUsers.map((u, idx) => ({
        id: `student-${idx}-${u.email}`,
        email: u.email,
        fullName: u.fullName || u.email.split('@')[0],
        role: u.role,
        createdAt: u.createdAt,
        completedLessonsCount: u.completedLessonsCount || 0,
        hasVerifiedPurchase: Boolean(u.hasFullAccess || u.role === 'admin'),
      }));

      const purchases = rawPurchases.map((p: any) => ({
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

      // Also include any Bank Transfer Full Access grants that aren't in rawPurchases yet
      const purchaseEmails = new Set(
        purchases.map((p) => String(p.userEmail || '').toLowerCase())
      );
      for (const u of mergedUsers) {
        if (
          u.hasFullAccess &&
          u.role !== 'admin' &&
          !purchaseEmails.has(u.email.toLowerCase())
        ) {
          purchases.unshift({
            id: `transfer-${u.email}`,
            userId: u.email,
            userEmail: u.email,
            courseId: INITIAL_COURSE.id,
            paystackReference: u.paymentMethod || 'PALMPAY-7080145682',
            amount: INITIAL_COURSE.oneTimePrice,
            currency: INITIAL_COURSE.currency,
            status: 'success',
            paidAt: u.grantedAt || u.lastSeenAt,
            createdAt: u.createdAt,
          });
        }
      }

      return res.json({
        ok: true,
        students,
        purchases,
      });
    } catch (err: any) {
      return res.status(500).json({
        error: err.message || 'Failed to load admin records.',
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

      const adminEmails = [
        (process.env.ADMIN_BOOTSTRAPPED_EMAIL || 'okorotochukwu007@gmail.com')
          .trim()
          .toLowerCase(),
      ];
      const assignedRole = adminEmails.includes(email) ? 'admin' : 'student';

      // Immediately record in local server access registry so no student signup is ever missed
      upsertAccessRegistryUser({
        email,
        fullName: fullName || email.split('@')[0],
        role: assignedRole,
      });

      const supabase = getServerSupabaseClient();
      if (!supabase) {
        return res.json({
          ok: true,
          userId: `local-${email}`,
          role: assignedRole,
          message: 'Account registered in Academy directory.',
        });
      }

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
        const allAuthUsers = await listAllSupabaseAuthUsers(supabase);
        const existingUser = allAuthUsers.find(
          (u: any) => u.email?.toLowerCase() === email
        );
        if (existingUser) {
          userId = existingUser.id;
          await supabase.auth.admin.updateUserById(existingUser.id, {
            email_confirm: true,
            password,
            user_metadata: {
              ...(existingUser.user_metadata || {}),
              full_name:
                fullName ||
                existingUser.user_metadata?.full_name ||
                email.split('@')[0],
            },
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
        userId: userId || `user-${email}`,
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
      const fullName = String(req.body?.fullName || '').trim();
      if (!email) {
        return res.status(400).json({ ok: false, error: 'Email is required.' });
      }

      upsertAccessRegistryUser({
        email,
        fullName: fullName || undefined,
      });

      const supabase = getServerSupabaseClient();
      if (!supabase) {
        return res.json({ ok: true, confirmed: true, userId: `local-${email}` });
      }

      const allAuthUsers = await listAllSupabaseAuthUsers(supabase);
      const existingUser = allAuthUsers.find(
        (u: any) => u.email?.toLowerCase() === email
      );
      if (!existingUser) {
        return res.json({ ok: true, confirmed: true, userId: `local-${email}` });
      }

      await supabase.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
      });

      const adminEmails = [
        (process.env.ADMIN_BOOTSTRAPPED_EMAIL || 'okorotochukwu007@gmail.com')
          .trim()
          .toLowerCase(),
      ];
      const roleToSet = adminEmails.includes(email) ? 'admin' : 'student';
      await supabase.from('profiles').upsert(
        {
          id: existingUser.id,
          email,
          full_name:
            fullName ||
            existingUser.user_metadata?.full_name ||
            email.split('@')[0],
          role: roleToSet,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

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
      const fullName = String(req.body?.fullName || '').trim();
      if (!email) {
        return res.status(400).json({ ok: false, error: 'Email is required.' });
      }

      upsertAccessRegistryUser({
        email,
        fullName: fullName || undefined,
      });

      const supabase = getServerSupabaseClient();
      if (!supabase) {
        return res.json({ ok: true, exists: true, confirmed: true });
      }

      const allAuthUsers = await listAllSupabaseAuthUsers(supabase);
      const existingUser = allAuthUsers.find(
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

  // 18. Reliable Student Progress & Full Access Registry Persistence
  const serverMemoryProgressByEmail: Record<string, any> = {};
  const ACCESS_REGISTRY_FILE = path.join(process.cwd(), '.student_access_registry.json');

  interface ServerAccessUserRecord {
    email: string;
    fullName: string;
    role: 'admin' | 'student';
    hasFullAccess: boolean;
    grantedAt: string | null;
    grantedBy: string | null;
    paymentMethod: string | null;
    createdAt: string;
    lastSeenAt: string;
    completedLessonsCount: number;
  }

  function loadAccessRegistry(): Record<string, ServerAccessUserRecord> {
    const defaultAdmin: ServerAccessUserRecord = {
      email: 'okorotochukwu007@gmail.com',
      fullName: 'Tochukwu Okoro (Lead Instructor)',
      role: 'admin',
      hasFullAccess: true,
      grantedAt: '2026-10-23T08:00:00.000Z',
      grantedBy: 'System (Lead Instructor)',
      paymentMethod: 'Instructor Master Account',
      createdAt: '2026-10-23',
      lastSeenAt: new Date().toISOString(),
      completedLessonsCount: 108,
    };

    try {
      if (fs.existsSync(ACCESS_REGISTRY_FILE)) {
        const raw = fs.readFileSync(ACCESS_REGISTRY_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          parsed['okorotochukwu007@gmail.com'] = {
            ...defaultAdmin,
            ...(parsed['okorotochukwu007@gmail.com'] || {}),
            role: 'admin',
            hasFullAccess: true,
          };
          return parsed;
        }
      }
    } catch {
      // Ignore corrupt file
    }
    return {
      'okorotochukwu007@gmail.com': defaultAdmin,
    };
  }

  function saveAccessRegistry(map: Record<string, ServerAccessUserRecord>) {
    try {
      fs.writeFileSync(ACCESS_REGISTRY_FILE, JSON.stringify(map, null, 2), 'utf8');
    } catch {
      // Ignore write error in read-only filesystems
    }
  }

  function upsertAccessRegistryUser(params: {
    email: string;
    fullName?: string;
    role?: 'admin' | 'student';
    hasFullAccess?: boolean;
    grantedAt?: string | null;
    grantedBy?: string | null;
    paymentMethod?: string | null;
    completedLessonsCount?: number;
  }): ServerAccessUserRecord | null {
    const cleanEmail = (params.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.endsWith('.local')) {
      return null;
    }

    const registry = loadAccessRegistry();
    const existing = registry[cleanEmail];
    const isAdminEmail = cleanEmail === 'okorotochukwu007@gmail.com';
    const nowIso = new Date().toISOString();

    const nextHasFullAccess = isAdminEmail
      ? true
      : params.hasFullAccess !== undefined
      ? params.hasFullAccess
      : Boolean(existing?.hasFullAccess);

    const updated: ServerAccessUserRecord = {
      email: cleanEmail,
      fullName:
        params.fullName?.trim() ||
        existing?.fullName ||
        (isAdminEmail
          ? 'Tochukwu Okoro (Lead Instructor)'
          : cleanEmail.split('@')[0]),
      role: isAdminEmail ? 'admin' : params.role || existing?.role || 'student',
      hasFullAccess: nextHasFullAccess,
      grantedAt:
        params.grantedAt !== undefined
          ? params.grantedAt
          : nextHasFullAccess
          ? existing?.grantedAt || nowIso
          : null,
      grantedBy:
        params.grantedBy !== undefined
          ? params.grantedBy
          : nextHasFullAccess
          ? existing?.grantedBy || 'Tochukwu Okoro (Instructor)'
          : null,
      paymentMethod:
        params.paymentMethod !== undefined
          ? params.paymentMethod
          : nextHasFullAccess
          ? existing?.paymentMethod || 'Bank Transfer (Palmpay - 7080145682)'
          : null,
      createdAt: existing?.createdAt || nowIso.split('T')[0],
      lastSeenAt: nowIso,
      completedLessonsCount:
        typeof params.completedLessonsCount === 'number'
          ? Math.max(params.completedLessonsCount, existing?.completedLessonsCount || 0)
          : existing?.completedLessonsCount || 0,
    };

    registry[cleanEmail] = updated;
    saveAccessRegistry(registry);
    return updated;
  }

  app.post('/api/student/progress/load', async (req: Request, res: Response) => {
    try {
      const userId = String(req.body?.userId || '').trim();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const fullName = String(req.body?.fullName || '').trim();

      if (!userId && !email) {
        return res.status(400).json({ ok: false, error: 'userId or email is required.' });
      }

      const registryEntry = email
        ? upsertAccessRegistryUser({ email, fullName: fullName || undefined })
        : null;

      const memKey = email || userId;
      const memSnapshot = serverMemoryProgressByEmail[memKey] || {};

      const supabase = getServerSupabaseClient();
      if (!supabase) {
        const completedIds = memSnapshot.completedLessonIds || [];
        if (email && completedIds.length > 0) {
          upsertAccessRegistryUser({
            email,
            completedLessonsCount: completedIds.length,
          });
        }
        return res.json({
          ok: true,
          hasFullAccess: Boolean(
            registryEntry?.hasFullAccess ||
              email === 'okorotochukwu007@gmail.com'
          ),
          completedLessonIds: completedIds,
          quizAttempts: memSnapshot.quizAttempts || [],
          projectSubmissions: memSnapshot.projectSubmissions || {},
          activeLessonId: memSnapshot.activeLessonId || null,
          recentlyViewedLessonId: memSnapshot.recentlyViewedLessonId || null,
        });
      }

      // 1. Load from Supabase Auth user_metadata.academy_progress
      let metaProgress: any = {};
      let metaHasFullAccess = false;
      let resolvedUserId = userId;
      try {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const matchedUser = (listData?.users || []).find(
          (u: any) =>
            (email && u.email?.toLowerCase() === email) ||
            (userId && u.id === userId)
        );
        if (matchedUser) {
          resolvedUserId = matchedUser.id;
          metaProgress = matchedUser.user_metadata?.academy_progress || {};
          metaHasFullAccess = Boolean(matchedUser.user_metadata?.has_full_access);
        }
      } catch {
        // Ignore admin listUsers errors if service role key is missing
      }

      // 2. Also load from PostgreSQL tables if resolvedUserId is a valid UUID
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          resolvedUserId
        );

      let dbCompletedIds: string[] = [];
      let dbQuizAttempts: any[] = [];
      const dbProjectSubmissions: Record<string, any> = {};
      let dbHasPurchase = false;

      if (isUuid) {
        try {
          const [progressRes, quizRes, projRes, purchaseRes] = await Promise.all([
            supabase
              .from('lesson_progress')
              .select('lesson_id, completed')
              .eq('user_id', resolvedUserId)
              .eq('completed', true),
            supabase
              .from('quiz_attempts')
              .select('*')
              .eq('user_id', resolvedUserId)
              .order('attempted_at', { ascending: false }),
            supabase
              .from('project_submissions')
              .select('*')
              .eq('user_id', resolvedUserId),
            supabase
              .from('purchases')
              .select('id, status')
              .eq('user_id', resolvedUserId)
              .eq('status', 'success')
              .limit(1),
          ]);

          dbCompletedIds = (progressRes.data || []).map((r: any) => r.lesson_id);
          dbHasPurchase = Boolean((purchaseRes.data || []).length > 0);
          dbQuizAttempts = (quizRes.data || []).map((r: any) => ({
            id: r.id,
            quizId: r.quiz_id,
            lessonTitle: r.lesson_title,
            scorePercent: r.score_percent,
            passed: r.passed,
            totalQuestions: r.total_questions,
            correctCount: r.correct_count,
            attemptedAt: r.attempted_at
              ? new Date(r.attempted_at).toLocaleString()
              : 'Saved',
            isSimulatedLocal: false,
          }));
          (projRes.data || []).forEach((r: any) => {
            dbProjectSubmissions[r.project_id] = {
              projectId: r.project_id,
              completedChecklistItems: Array.isArray(r.completed_checklist_items)
                ? r.completed_checklist_items
                : [],
              notes: r.notes || '',
              status:
                r.status === 'completed' ? 'completed_local' : r.status || 'in_progress',
              updatedAt: r.updated_at,
            };
          });
        } catch {
          // Ignore table query errors if tables are not yet migrated
        }
      }

      // Merge all sources (memory + user_metadata + DB tables)
      const mergedCompleted = Array.from(
        new Set([
          ...(Array.isArray(memSnapshot.completedLessonIds)
            ? memSnapshot.completedLessonIds
            : []),
          ...(Array.isArray(metaProgress.completedLessonIds)
            ? metaProgress.completedLessonIds
            : []),
          ...dbCompletedIds,
        ])
      );

      const allAttempts = [
        ...(Array.isArray(memSnapshot.quizAttempts) ? memSnapshot.quizAttempts : []),
        ...(Array.isArray(metaProgress.quizAttempts) ? metaProgress.quizAttempts : []),
        ...dbQuizAttempts,
      ];
      const seenAttemptKeys = new Set<string>();
      const mergedAttempts: any[] = [];
      for (const att of allAttempts) {
        if (!att || !att.quizId) continue;
        const key = `${att.quizId}:${att.scorePercent}:${att.passed}`;
        if (!seenAttemptKeys.has(key)) {
          seenAttemptKeys.add(key);
          mergedAttempts.push(att);
        }
      }

      const mergedProjects: Record<string, any> = {
        ...dbProjectSubmissions,
        ...(metaProgress.projectSubmissions || {}),
        ...(memSnapshot.projectSubmissions || {}),
      };

      const activeLessonId =
        memSnapshot.activeLessonId || metaProgress.activeLessonId || null;
      const recentlyViewedLessonId =
        memSnapshot.recentlyViewedLessonId ||
        metaProgress.recentlyViewedLessonId ||
        null;

      const resolvedHasFullAccess = Boolean(
        registryEntry?.hasFullAccess ||
          metaHasFullAccess ||
          dbHasPurchase ||
          email === 'okorotochukwu007@gmail.com'
      );

      if (email) {
        upsertAccessRegistryUser({
          email,
          hasFullAccess: resolvedHasFullAccess ? true : undefined,
          completedLessonsCount: mergedCompleted.length,
        });
      }

      return res.json({
        ok: true,
        hasFullAccess: resolvedHasFullAccess,
        completedLessonIds: mergedCompleted,
        quizAttempts: mergedAttempts,
        projectSubmissions: mergedProjects,
        activeLessonId,
        recentlyViewedLessonId,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || 'Failed to load student progress.',
      });
    }
  });

  app.post('/api/student/progress/save', async (req: Request, res: Response) => {
    try {
      const userId = String(req.body?.userId || '').trim();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const fullName = String(req.body?.fullName || '').trim();
      const incomingCompleted: string[] = Array.isArray(req.body?.completedLessonIds)
        ? req.body.completedLessonIds
        : [];
      const incomingAttempts: any[] = Array.isArray(req.body?.quizAttempts)
        ? req.body.quizAttempts
        : [];
      const incomingProjects: Record<string, any> =
        req.body?.projectSubmissions && typeof req.body.projectSubmissions === 'object'
          ? req.body.projectSubmissions
          : {};
      const activeLessonId = req.body?.activeLessonId || null;
      const recentlyViewedLessonId = req.body?.recentlyViewedLessonId || null;

      if (!userId && !email) {
        return res.status(400).json({ ok: false, error: 'userId or email is required.' });
      }

      const memKey = email || userId;
      const prevMem = serverMemoryProgressByEmail[memKey] || {};

      const supabase = getServerSupabaseClient();
      let matchedUser: any = null;

      if (supabase) {
        try {
          const { data: listData } = await supabase.auth.admin.listUsers();
          matchedUser = (listData?.users || []).find(
            (u: any) =>
              (email && u.email?.toLowerCase() === email) ||
              (userId && u.id === userId)
          );
        } catch {
          // Ignore admin listUsers error
        }
      }

      const prevMeta = matchedUser?.user_metadata?.academy_progress || {};

      const mergedCompleted = Array.from(
        new Set([
          ...(Array.isArray(prevMem.completedLessonIds)
            ? prevMem.completedLessonIds
            : []),
          ...(Array.isArray(prevMeta.completedLessonIds)
            ? prevMeta.completedLessonIds
            : []),
          ...incomingCompleted,
        ])
      );

      const combinedAttempts = [
        ...incomingAttempts,
        ...(Array.isArray(prevMeta.quizAttempts) ? prevMeta.quizAttempts : []),
        ...(Array.isArray(prevMem.quizAttempts) ? prevMem.quizAttempts : []),
      ];
      const seenKeys = new Set<string>();
      const mergedAttempts: any[] = [];
      for (const att of combinedAttempts) {
        if (!att || !att.quizId) continue;
        const key = `${att.quizId}:${att.scorePercent}:${att.passed}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          mergedAttempts.push(att);
        }
      }

      const mergedProjects: Record<string, any> = {
        ...(prevMem.projectSubmissions || {}),
        ...(prevMeta.projectSubmissions || {}),
        ...incomingProjects,
      };

      const updatedSnapshot = {
        completedLessonIds: mergedCompleted,
        quizAttempts: mergedAttempts,
        projectSubmissions: mergedProjects,
        activeLessonId:
          activeLessonId || prevMeta.activeLessonId || prevMem.activeLessonId || null,
        recentlyViewedLessonId:
          recentlyViewedLessonId ||
          prevMeta.recentlyViewedLessonId ||
          prevMem.recentlyViewedLessonId ||
          null,
        updatedAt: new Date().toISOString(),
      };

      serverMemoryProgressByEmail[memKey] = updatedSnapshot;
      if (userId) {
        serverMemoryProgressByEmail[userId] = updatedSnapshot;
      }

      if (email) {
        upsertAccessRegistryUser({
          email,
          fullName: fullName || undefined,
          completedLessonsCount: mergedCompleted.length,
        });
      }

      if (supabase && matchedUser) {
        await supabase.auth.admin.updateUserById(matchedUser.id, {
          user_metadata: {
            ...(matchedUser.user_metadata || {}),
            academy_progress: updatedSnapshot,
          },
        });
      }

      return res.json({
        ok: true,
        progress: updatedSnapshot,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || 'Failed to save student progress.',
      });
    }
  });

  // 19. Check Student Email Full Access Status (Bank Transfer Activation Check)
  const handleCheckEmailAccess = async (req: Request, res: Response) => {
    try {
      const rawEmail =
        req.method === 'GET' ? req.query.email : req.body?.email;
      const rawName =
        req.method === 'GET' ? req.query.fullName : req.body?.fullName;
      const email = String(rawEmail || '').trim().toLowerCase();
      const fullName = String(rawName || '').trim();

      if (!email || !email.includes('@')) {
        return res.json({
          ok: true,
          email: '',
          hasFullAccess: false,
        });
      }

      const entry = upsertAccessRegistryUser({
        email,
        fullName: fullName || undefined,
      });

      let hasFullAccess = Boolean(
        entry?.hasFullAccess || email === 'okorotochukwu007@gmail.com'
      );
      let grantedAt = entry?.grantedAt || null;
      let paymentMethod = entry?.paymentMethod || null;

      const supabase = getServerSupabaseClient();
      if (supabase && !hasFullAccess) {
        try {
          const { data: listData } = await supabase.auth.admin.listUsers();
          const matchedUser = (listData?.users || []).find(
            (u: any) => u.email?.toLowerCase() === email
          );
          if (matchedUser) {
            if (matchedUser.user_metadata?.has_full_access) {
              hasFullAccess = true;
              grantedAt =
                matchedUser.user_metadata?.full_access_granted_at ||
                new Date().toISOString();
              paymentMethod = 'Bank Transfer (Palmpay - 7080145682)';
            } else {
              const { data: purch } = await supabase
                .from('purchases')
                .select('id, paid_at')
                .eq('user_id', matchedUser.id)
                .eq('status', 'success')
                .limit(1);
              if (purch && purch.length > 0) {
                hasFullAccess = true;
                grantedAt = purch[0].paid_at || new Date().toISOString();
                paymentMethod = 'Verified Tuition Payment';
              }
            }
            if (hasFullAccess) {
              upsertAccessRegistryUser({
                email,
                fullName:
                  fullName ||
                  matchedUser.user_metadata?.full_name ||
                  undefined,
                hasFullAccess: true,
                grantedAt,
                paymentMethod,
              });
            }
          }
        } catch {
          // Ignore Supabase admin check error
        }
      }

      return res.json({
        ok: true,
        email,
        hasFullAccess,
        grantedAt,
        paymentMethod,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        hasFullAccess: false,
        error: err.message || 'Failed to check access status.',
      });
    }
  };

  app.get('/api/access/check', handleCheckEmailAccess);
  app.post('/api/access/check', handleCheckEmailAccess);

  // 20. Instructor Admin: List Everyone With Access to the App + Full Access Status
  const buildMergedAdminAccessUsersList = async (
    clientKnownUsers?: Array<{
      email: string;
      fullName?: string;
      createdAt?: string;
      completedLessonsCount?: number;
      hasFullAccess?: boolean;
    }>,
    bearerToken?: string
  ): Promise<ServerAccessUserRecord[]> => {
    if (Array.isArray(clientKnownUsers)) {
      for (const u of clientKnownUsers) {
        if (u && u.email) {
          upsertAccessRegistryUser({
            email: u.email,
            fullName: u.fullName,
            completedLessonsCount:
              typeof u.completedLessonsCount === 'number'
                ? u.completedLessonsCount
                : undefined,
            hasFullAccess: u.hasFullAccess ? true : undefined,
          });
        }
      }
    }

    // Also include any student email present in serverMemoryProgressByEmail
    for (const [key, snap] of Object.entries(serverMemoryProgressByEmail)) {
      if (key.includes('@') && !key.endsWith('.local')) {
        upsertAccessRegistryUser({
          email: key,
          completedLessonsCount: Array.isArray(snap?.completedLessonIds)
            ? snap.completedLessonIds.length
            : undefined,
        });
      }
    }

    const supabase = await getAdminSupabaseClient(bearerToken);

    if (supabase) {
      try {
        const [allAuthUsers, profilesRes, purchasesRes, progressRes] =
          await Promise.all([
            listAllSupabaseAuthUsers(supabase),
            supabase
              .from('profiles')
              .select('id, email, full_name, role, created_at')
              .order('created_at', { ascending: false }),
            supabase
              .from('purchases')
              .select('user_id, status, paid_at, paystack_reference')
              .eq('status', 'success'),
            supabase
              .from('lesson_progress')
              .select('user_id, lesson_id, completed')
              .eq('completed', true),
          ]);

        const progressByUserId: Record<string, number> = {};
        (progressRes.data || []).forEach((row: any) => {
          progressByUserId[row.user_id] =
            (progressByUserId[row.user_id] || 0) + 1;
        });

        const purchaseByUserId: Record<string, { paidAt: string; ref: string }> = {};
        (purchasesRes.data || []).forEach((p: any) => {
          purchaseByUserId[p.user_id] = {
            paidAt: p.paid_at || new Date().toISOString(),
            ref: p.paystack_reference || 'Verified Payment',
          };
        });

        const profileEmails = new Set<string>();
        for (const p of profilesRes.data || []) {
          const cleanEmail = (p.email || '').trim().toLowerCase();
          if (!cleanEmail) continue;
          profileEmails.add(cleanEmail);
          const hasDbPurchase = Boolean(purchaseByUserId[p.id]);
          const memProg = serverMemoryProgressByEmail[cleanEmail];
          const lessonsDone = Math.max(
            progressByUserId[p.id] || 0,
            Array.isArray(memProg?.completedLessonIds)
              ? memProg.completedLessonIds.length
              : 0
          );

          upsertAccessRegistryUser({
            email: cleanEmail,
            fullName: p.full_name || undefined,
            role: cleanEmail === 'okorotochukwu007@gmail.com' ? 'admin' : 'student',
            hasFullAccess:
              hasDbPurchase || cleanEmail === 'okorotochukwu007@gmail.com'
                ? true
                : undefined,
            grantedAt: purchaseByUserId[p.id]?.paidAt,
            completedLessonsCount: lessonsDone,
          });
        }

        for (const u of allAuthUsers) {
          const cleanEmail = (u.email || '').trim().toLowerCase();
          if (!cleanEmail) continue;
          const metaFullAccess = Boolean(u.user_metadata?.has_full_access);
          const hasDbPurchase = Boolean(purchaseByUserId[u.id]);
          const metaProg = u.user_metadata?.academy_progress;
          const lessonsDone = Math.max(
            progressByUserId[u.id] || 0,
            Array.isArray(metaProg?.completedLessonIds)
              ? metaProg.completedLessonIds.length
              : 0
          );

          upsertAccessRegistryUser({
            email: cleanEmail,
            fullName: u.user_metadata?.full_name || undefined,
            role: cleanEmail === 'okorotochukwu007@gmail.com' ? 'admin' : 'student',
            hasFullAccess: metaFullAccess || hasDbPurchase ? true : undefined,
            grantedAt:
              u.user_metadata?.full_access_granted_at ||
              purchaseByUserId[u.id]?.paidAt,
            completedLessonsCount: lessonsDone,
          });

          // Backfill public.profiles if this auth.users account wasn't in public.profiles yet
          if (!profileEmails.has(cleanEmail) && u.id) {
            try {
              await supabase.from('profiles').upsert(
                {
                  id: u.id,
                  email: cleanEmail,
                  full_name:
                    u.user_metadata?.full_name || cleanEmail.split('@')[0],
                  role:
                    cleanEmail === 'okorotochukwu007@gmail.com'
                      ? 'admin'
                      : 'student',
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'id' }
              );
            } catch {
              // Ignore backfill error
            }
          }
        }
      } catch {
        // Ignore Supabase merge errors
      }
    }

    const finalRegistry = loadAccessRegistry();
    return Object.values(finalRegistry).sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      if (a.hasFullAccess !== b.hasFullAccess) return a.hasFullAccess ? -1 : 1;
      return (b.lastSeenAt || '').localeCompare(a.lastSeenAt || '');
    });
  };

  app.get('/api/admin/access-users', async (req: Request, res: Response) => {
    try {
      const check = await verifyAdminRequest(req);
      if (!check.authorized) {
        return res.status(403).json({ ok: false, error: check.error });
      }
      const token = req.headers.authorization?.split('Bearer ')[1];
      const users = await buildMergedAdminAccessUsersList(undefined, token);
      return res.json({
        ok: true,
        users,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || 'Failed to load app access users.',
      });
    }
  });

  app.post('/api/admin/access-users', async (req: Request, res: Response) => {
    try {
      const check = await verifyAdminRequest(req);
      if (!check.authorized) {
        return res.status(403).json({ ok: false, error: check.error });
      }
      const token = req.headers.authorization?.split('Bearer ')[1];
      const clientKnownUsers = Array.isArray(req.body?.knownUsers)
        ? req.body.knownUsers
        : [];
      const users = await buildMergedAdminAccessUsersList(clientKnownUsers, token);
      return res.json({
        ok: true,
        users,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || 'Failed to load app access users.',
      });
    }
  });

  // 21. Instructor Admin: Give Full Access (or Revoke Access) to Any Email
  app.post('/api/admin/grant-access', async (req: Request, res: Response) => {
    try {
      const check = await verifyAdminRequest(req);
      if (!check.authorized) {
        return res.status(403).json({ ok: false, error: check.error });
      }

      const email = String(req.body?.email || '').trim().toLowerCase();
      const fullName = String(req.body?.fullName || '').trim();
      const grant = req.body?.grant !== false; // default true

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          ok: false,
          error: 'Please enter a valid student email address.',
        });
      }

      if (email === 'okorotochukwu007@gmail.com' && !grant) {
        return res.status(400).json({
          ok: false,
          error: 'Lead Instructor account always retains full administrative access.',
        });
      }

      const nowIso = new Date().toISOString();
      const updatedEntry = upsertAccessRegistryUser({
        email,
        fullName: fullName || undefined,
        hasFullAccess: grant,
        grantedAt: grant ? nowIso : null,
        grantedBy: grant ? 'Tochukwu Okoro (Lead Instructor)' : null,
        paymentMethod: grant ? 'Bank Transfer (Palmpay - 7080145682)' : null,
      });

      const token = req.headers.authorization?.split('Bearer ')[1];
      const supabase = await getAdminSupabaseClient(token);
      if (supabase) {
        try {
          const allAuthUsers = await listAllSupabaseAuthUsers(supabase);
          const matchedUser = allAuthUsers.find(
            (u: any) => u.email?.toLowerCase() === email
          );

          if (matchedUser) {
            await supabase.auth.admin.updateUserById(matchedUser.id, {
              user_metadata: {
                ...(matchedUser.user_metadata || {}),
                has_full_access: grant,
                full_access_granted_at: grant ? nowIso : null,
              },
            });

            if (grant) {
              await supabase.from('purchases').insert({
                user_id: matchedUser.id,
                course_id: INITIAL_COURSE.id,
                paystack_reference: `PALMPAY-TRANSFER-${Date.now()}`,
                amount: INITIAL_COURSE.oneTimePrice,
                currency: INITIAL_COURSE.currency,
                status: 'success',
                paid_at: nowIso,
              });
            } else {
              await supabase
                .from('purchases')
                .update({ status: 'revoked' })
                .eq('user_id', matchedUser.id);
            }
          }
        } catch {
          // Ignore Supabase sync errors; local server registry is authoritative
        }
      }

      const allUsers = await buildMergedAdminAccessUsersList(undefined, token);

      return res.json({
        ok: true,
        user: updatedEntry,
        users: allUsers,
        message: grant
          ? `Full 6-Level Academy Access has been granted to ${email}!`
          : `Full Academy Access has been revoked for ${email} (reverted to Free Level 1 tier).`,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || 'Failed to update full access for email.',
      });
    }
  });

  // Vite middleware for development / static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
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
