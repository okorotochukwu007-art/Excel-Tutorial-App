import { useState, useEffect } from 'react';
import {
  Course,
  CurriculumLevel,
  Lesson,
  LevelCertificate,
  Profile,
  ProjectSubmissionState,
  QuizAttempt,
  QuizQuestion,
} from './types/academy';
import { CURRICULUM_LEVELS, INITIAL_COURSE } from './data/curriculumData';
import { LEVEL_EXAMS } from './data/levelExamData';
import { CAPSTONE_PROJECTS } from './data/capstoneProjectsData';
import { AppView, Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { CurriculumView } from './components/CurriculumView';
import { StudentDashboardView } from './components/StudentDashboardView';
import { CapstonePortfolioView } from './components/CapstonePortfolioView';
import { LessonPlayerView } from './components/LessonPlayerView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ShortcutCoachView } from './components/ShortcutCoachView';
import {
  AuthAndCheckoutModal,
  AuthModalTab,
  LegalAndContactModal,
} from './components/AuthAndCheckoutModal';
import { LevelExamModal } from './components/LevelExamModal';
import { CertificatePreviewModal } from './components/CertificatePreviewModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { supabase } from './lib/supabaseClient';
import {
  checkStudentEmailFullAccess,
  fetchOrCreateUserProfile,
  fetchPublicVideoCoverageMap,
  fetchSupabaseBackendStatus,
  insertQuizAttemptToSupabase,
  isEmailGrantedFullAccessLocally,
  loadLocalStudentProgress,
  loadStudentProgressFromSupabase,
  saveFullStudentProgressSnapshot,
  SupabaseBackendStatus,
  syncLessonCompletionToSupabase,
  syncProjectSubmissionToSupabase,
  updateProfileFullNameInSupabase,
} from './services/academyService';

const ACTIVE_PROFILE_STORAGE_KEY = 'excel_academy_active_profile_v1';

function loadSavedActiveProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.email && !parsed.isDemoSession) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveActiveProfile(profile: Profile | null) {
  try {
    if (!profile || profile.isDemoSession) {
      localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
    } else {
      localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
  } catch {}
}

function ensureConsistentCompletedLessons(
  _completedIds: string[],
  attempts: QuizAttempt[],
  curriculumLevels: CurriculumLevel[]
): string[] {
  const set = new Set<string>();

  // 1. Any passed module quiz ('quiz-lvl-...') marks its lesson completed
  for (const att of attempts) {
    if (att.passed && att.quizId?.startsWith('quiz-')) {
      const lessonId = att.quizId.replace(/^quiz-/, '');
      if (lessonId) set.add(lessonId);
    }
  }

  // 2. Any passed Level Final Exam ('exam-lvl-N') ensures all lessons in Level N are marked completed
  for (const lvl of curriculumLevels) {
    const passedLevelExam = attempts.some(
      (att) => att.quizId === `exam-lvl-${lvl.levelNumber}` && att.passed
    );
    if (passedLevelExam) {
      for (const mod of lvl.modules) {
        for (const les of mod.lessons) {
          set.add(les.id);
        }
      }
    }
  }

  return Array.from(set);
}

function resolveBestResumeLessonId(
  completedIds: string[],
  savedActiveId: string | null | undefined,
  curriculumLevels: CurriculumLevel[]
): string {
  const allOrdered: Lesson[] = [];
  curriculumLevels.forEach((lvl) => {
    lvl.modules.forEach((mod) => {
      mod.lessons
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .forEach((les) => allOrdered.push(les));
    });
  });

  const firstUncompleted = allOrdered.find((l) => !completedIds.includes(l.id));
  if (savedActiveId && !completedIds.includes(savedActiveId)) {
    return savedActiveId;
  }
  if (firstUncompleted) {
    return firstUncompleted.id;
  }
  return savedActiveId || allOrdered[allOrdered.length - 1]?.id || 'lvl-1-mod-1-les-1';
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [course, setCourse] = useState<Course>(INITIAL_COURSE);
  const [levels, setLevels] = useState<CurriculumLevel[]>(CURRICULUM_LEVELS);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');

  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseBackendStatus>({
    configured: false,
    hasServiceRoleKey: false,
    projectHost: null,
    schemaReady: false,
    message: 'Checking Supabase connection status...',
  });

  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    const saved = loadSavedActiveProfile();
    return (
      saved || {
        id: 'demo-student-01',
        email: 'demo.student@excelacademy.local',
        fullName: 'Guest Learner',
        role: 'student_demo',
        createdAt: '2026-10-23',
        isDemoSession: true,
      }
    );
  });

  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    const saved = loadSavedActiveProfile();
    if (saved) {
      const localProg = loadLocalStudentProgress(saved.id, saved.email);
      return ensureConsistentCompletedLessons(
        localProg.completedLessonIds,
        localProg.quizAttempts,
        CURRICULUM_LEVELS
      );
    }
    return [];
  });

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    const saved = loadSavedActiveProfile();
    if (saved) {
      return loadLocalStudentProgress(saved.id, saved.email).quizAttempts;
    }
    return [];
  });

  const [projectSubmissions, setProjectSubmissions] = useState<
    Record<string, ProjectSubmissionState>
  >(() => {
    const saved = loadSavedActiveProfile();
    if (saved) {
      return loadLocalStudentProgress(saved.id, saved.email).projectSubmissions;
    }
    return {};
  });

  const [activeLessonId, setActiveLessonId] = useState<string>(() => {
    const saved = loadSavedActiveProfile();
    if (saved) {
      const localProg = loadLocalStudentProgress(saved.id, saved.email);
      const completed = ensureConsistentCompletedLessons(
        localProg.completedLessonIds,
        localProg.quizAttempts,
        CURRICULUM_LEVELS
      );
      return resolveBestResumeLessonId(
        completed,
        localProg.activeLessonId,
        CURRICULUM_LEVELS
      );
    }
    return 'lvl-1-mod-1-les-1';
  });

  const [recentlyViewedLessonId, setRecentlyViewedLessonId] = useState<string>(() => {
    const saved = loadSavedActiveProfile();
    if (saved) {
      const localProg = loadLocalStudentProgress(saved.id, saved.email);
      const completed = ensureConsistentCompletedLessons(
        localProg.completedLessonIds,
        localProg.quizAttempts,
        CURRICULUM_LEVELS
      );
      return resolveBestResumeLessonId(
        completed,
        localProg.recentlyViewedLessonId || localProg.activeLessonId,
        CURRICULUM_LEVELS
      );
    }
    return 'lvl-1-mod-1-les-1';
  });

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('login');
  const [pendingLessonId, setPendingLessonId] = useState<string | null>(null);
  const [authPromptNotice, setAuthPromptNotice] = useState<string | null>(null);
  const [legalDocType, setLegalDocType] = useState<
    'privacy' | 'terms' | 'refund' | 'contact' | null
  >(null);
  const [activeExamLevel, setActiveExamLevel] = useState<number | null>(null);
  const [previewCertificate, setPreviewCertificate] = useState<LevelCertificate | null>(null);
  const [lockNoticeBanner, setLockNoticeBanner] = useState<string | null>(null);

  const [hasPaid, setHasPaid] = useState<boolean>(() => {
    const saved = loadSavedActiveProfile();
    if (saved && saved.email) {
      return isEmailGrantedFullAccessLocally(saved.email);
    }
    return false;
  });

  const isAuthenticated = Boolean(currentUser && !currentUser.isDemoSession);
  const isInstructor = currentUser?.email?.toLowerCase() === 'okorotochukwu007@gmail.com';
  const isPurchased = isInstructor || hasPaid;

  // Hydrate and merge student progress + Full Access status from localStorage + Server + Supabase tables
  const restoreProgressForProfile = async (profile: Profile) => {
    saveActiveProfile(profile);
    if (profile.isDemoSession) {
      setHasPaid(false);
      return;
    }
    const [dbProgress, accessRes] = await Promise.all([
      loadStudentProgressFromSupabase(profile.id, profile.email),
      checkStudentEmailFullAccess(profile.email, profile.fullName),
    ]);
    const entitled = Boolean(
      dbProgress.hasFullAccess ||
        accessRes.hasFullAccess ||
        profile.email?.toLowerCase() === 'okorotochukwu007@gmail.com'
    );
    setHasPaid(entitled);

    const consistentCompleted = ensureConsistentCompletedLessons(
      dbProgress.completedLessonIds,
      dbProgress.quizAttempts,
      levels
    );
    const resumeLessonId = resolveBestResumeLessonId(
      consistentCompleted,
      dbProgress.activeLessonId,
      levels
    );

    setCompletedLessonIds(consistentCompleted);
    setQuizAttempts(dbProgress.quizAttempts);
    setProjectSubmissions(dbProgress.projectSubmissions);
    setActiveLessonId(resumeLessonId);
    setRecentlyViewedLessonId(resumeLessonId);
  };

  // Poll student email access status every 8 seconds so instructor-granted Full Access unlocks Levels 2–6 live
  useEffect(() => {
    if (!currentUser || currentUser.isDemoSession || isInstructor) return;
    const cleanEmail = (currentUser.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.endsWith('.local')) {
      return;
    }

    let cancelled = false;
    const syncAccess = async () => {
      try {
        const res = await checkStudentEmailFullAccess(
          cleanEmail,
          currentUser.fullName
        );
        if (!cancelled && res.ok) {
          setHasPaid(Boolean(res.hasFullAccess));
        }
      } catch {}
    };

    const timer = setInterval(syncAccess, 8000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [currentUser, isInstructor]);

  // Automatically persist student progress whenever state updates while logged in
  useEffect(() => {
    if (!currentUser || currentUser.isDemoSession) return;
    saveFullStudentProgressSnapshot(currentUser.id, currentUser.email, {
      completedLessonIds,
      quizAttempts,
      projectSubmissions,
      activeLessonId,
      recentlyViewedLessonId,
    }).catch(() => {});
  }, [
    currentUser,
    completedLessonIds,
    quizAttempts,
    projectSubmissions,
    activeLessonId,
    recentlyViewedLessonId,
  ]);

  const checkLessonAccess = (lessonId: string): {
    unlocked: boolean;
    reason?: 'level_locked' | 'level_quiz_required' | 'sequence_locked';
    requiredLessonTitle?: string;
    requiredLevelNumber?: number;
  } => {
    if (isInstructor) {
      return { unlocked: true };
    }

    const allOrderedLessons: Lesson[] = [];
    levels.forEach((lvl) => {
      lvl.modules.forEach((mod) => {
        mod.lessons
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .forEach((les) => allOrderedLessons.push(les));
      });
    });

    const targetIdx = allOrderedLessons.findIndex((l) => l.id === lessonId);
    if (targetIdx === -1) return { unlocked: true };

    const targetLesson = allOrderedLessons[targetIdx];

    // Level 1 is free for all registered learners; Levels 2–6 require payment
    if (targetLesson.levelNumber > 1 && !isPurchased) {
      return {
        unlocked: false,
        reason: 'level_locked',
        requiredLevelNumber: targetLesson.levelNumber,
      };
    }

    // Must pass the previous Level's End-of-Level General Quiz before unlocking the next Level
    if (targetLesson.levelNumber > 1) {
      const prevLevelNum = targetLesson.levelNumber - 1;
      const hasPassedPrevLevelQuiz = quizAttempts.some(
        (att) => att.quizId === `exam-lvl-${prevLevelNum}` && att.passed
      );
      if (!hasPassedPrevLevelQuiz) {
        return {
          unlocked: false,
          reason: 'level_quiz_required',
          requiredLevelNumber: prevLevelNum,
        };
      }
    }

    // Finish and pass each lesson quiz before starting the next lesson
    if (targetIdx > 0) {
      const prevLesson = allOrderedLessons[targetIdx - 1];
      const hasPassedPrevQuiz = quizAttempts.some(
        (att) =>
          att.passed &&
          (att.quizId === prevLesson.quiz?.id ||
            att.quizId === `quiz-${prevLesson.id}` ||
            att.quizId === `exam-lvl-${prevLesson.levelNumber}`)
      );
      const isPrevCompleted =
        completedLessonIds.includes(prevLesson.id) && hasPassedPrevQuiz;
      if (!isPrevCompleted) {
        return {
          unlocked: false,
          reason: 'sequence_locked',
          requiredLessonTitle: prevLesson.title,
        };
      }
    }

    return { unlocked: true };
  };

  // Check backend status, hydrate approved video IDs, and initialize Supabase Auth listener
  useEffect(() => {
    fetchSupabaseBackendStatus()
      .then((status) => {
        setSupabaseStatus(status);
      })
      .catch(() => {});

    fetchPublicVideoCoverageMap()
      .then((videoMap) => {
        if (Object.keys(videoMap).length === 0) return;
        setLevels((prevLevels) =>
          prevLevels.map((lvl) => ({
            ...lvl,
            modules: lvl.modules.map((mod) => ({
              ...mod,
              lessons: mod.lessons.map((les) => ({
                ...les,
                youtubeVideoId: videoMap[les.id] || les.youtubeVideoId,
              })),
            })),
          }))
        );
      })
      .catch(() => {});

    // If a saved profile was loaded on mount, also sync its latest progress from server
    const savedProfile = loadSavedActiveProfile();
    if (savedProfile && !savedProfile.isDemoSession) {
      restoreProgressForProfile(savedProfile).catch(() => {});
    }

    if (!supabase) return;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        try {
          if (data?.session?.user) {
            const u = data.session.user;
            const profile = await fetchOrCreateUserProfile(
              u.id,
              u.email || '',
              u.user_metadata?.full_name
            );
            if (profile) {
              setCurrentUser(profile);
              await restoreProgressForProfile(profile);
            }
          }
        } catch (err) {
          console.warn('Session restoration warning:', err);
        }
      })
      .catch((err) => {
        console.warn('getSession warning:', err);
      });

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data: listener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            if (event === 'PASSWORD_RECOVERY') {
              setAuthModalTab('reset_password');
              setAuthModalOpen(true);
            }
            if (session?.user) {
              const u = session.user;
              const profile = await fetchOrCreateUserProfile(
                u.id,
                u.email || '',
                u.user_metadata?.full_name
              );
              if (profile) {
                setCurrentUser(profile);
                await restoreProgressForProfile(profile);
              }
            }
          } catch (err) {
            console.warn('Auth state change warning:', err);
          }
        }
      );
      subscription = listener?.subscription || null;
    } catch (err) {
      console.warn('Auth listener registration warning:', err);
    }

    return () => {
      try {
        subscription?.unsubscribe();
      } catch {}
    };
  }, []);

  const handleNavigate = (view: AppView, sectionId?: string) => {
    if (view === 'admin' && !isInstructor) {
      setCurrentView(isAuthenticated ? 'dashboard' : 'home');
      return;
    }

    if (!isAuthenticated && (view === 'lesson' || view === 'dashboard')) {
      setAuthPromptNotice(
        'Please log in or create a free student account to access lessons and your learning dashboard.'
      );
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }

    setCurrentView(view);
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectLevelInCurriculum = (levelNumber: number) => {
    setSelectedLevelFilter(levelNumber);
    setCurrentView('curriculum');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLevelExam = (levelNumber: number) => {
    if (!isAuthenticated) {
      setAuthPromptNotice(
        'Please log in or create a free student account to take Level Final Exams.'
      );
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }

    if (levelNumber > 1 && !isPurchased && !isInstructor) {
      setAuthPromptNotice(
        `Level ${levelNumber} Final Exam requires Full Academy enrolment. Enrol to unlock Levels 2–6 and all certification exams.`
      );
      setAuthModalTab('checkout');
      setAuthModalOpen(true);
      return;
    }

    if (!isInstructor) {
      // 1. Check that all previous levels (1 .. levelNumber - 1) have both all modules completed and their exams passed
      for (let prev = 1; prev < levelNumber; prev++) {
        const prevLvl = levels.find((l) => l.levelNumber === prev);
        if (prevLvl) {
          const prevLessons = prevLvl.modules.flatMap((m) => m.lessons);
          const prevDoneCount = prevLessons.filter((l) =>
            completedLessonIds.includes(l.id)
          ).length;
          if (prevDoneCount < prevLessons.length) {
            setLockNoticeBanner(
              `Level ${levelNumber} Final Exam is locked: Please complete all modules in Level ${prev} (${prevDoneCount}/${prevLessons.length} completed) first.`
            );
            return;
          }
        }
        const passedPrevExam = quizAttempts.some(
          (att) => att.quizId === `exam-lvl-${prev}` && att.passed
        );
        if (!passedPrevExam) {
          setLockNoticeBanner(
            `Level ${levelNumber} Final Exam is locked: You must pass the Level ${prev} Final Exam first before taking Level ${levelNumber}.`
          );
          return;
        }
      }

      // 2. Check that all modules/lessons in THIS level are completed before taking this level's exam
      const targetLvl = levels.find((l) => l.levelNumber === levelNumber);
      if (targetLvl) {
        const lvlLessons = targetLvl.modules.flatMap((m) => m.lessons);
        const doneCount = lvlLessons.filter((l) =>
          completedLessonIds.includes(l.id)
        ).length;
        const alreadyPassedThisExam = quizAttempts.some(
          (att) => att.quizId === `exam-lvl-${levelNumber}` && att.passed
        );
        if (doneCount < lvlLessons.length && !alreadyPassedThisExam) {
          setLockNoticeBanner(
            `Level ${levelNumber} Final Exam is locked: Please complete all ${lvlLessons.length} module lessons in Level ${levelNumber} (${doneCount}/${lvlLessons.length} completed) before taking the Level ${levelNumber} Final Exam.`
          );
          return;
        }
      }
    }

    setLockNoticeBanner(null);
    setActiveExamLevel(levelNumber);
  };

  const handleStartLesson = (lessonId: string) => {
    if (!isAuthenticated) {
      setPendingLessonId(lessonId);
      setAuthPromptNotice(
        'Please log in or sign up to start taking lessons and download Excel practice workbooks.'
      );
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }

    const access = checkLessonAccess(lessonId);
    if (!access.unlocked) {
      if (access.reason === 'level_locked') {
        setAuthPromptNotice(
          `Level ${access.requiredLevelNumber} is locked. Level 1 is free for all registered learners! Enrol in the Full Academy to unlock Levels 2–6.`
        );
        setAuthModalTab('checkout');
        setAuthModalOpen(true);
        return;
      } else if (access.reason === 'sequence_locked') {
        setLockNoticeBanner(
          `Module Locked: You must pass the quiz for "${access.requiredLessonTitle}" (unlimited retakes available) before moving to the next module.`
        );
        const quizEl = document.getElementById('module-quiz-section');
        if (quizEl) {
          quizEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      } else if (access.reason === 'level_quiz_required' && access.requiredLevelNumber) {
        setLockNoticeBanner(
          `To unlock Level ${access.requiredLevelNumber + 1}, please complete all modules in Level ${access.requiredLevelNumber} and pass the Level ${access.requiredLevelNumber} Final Exam (70%+ required).`
        );
        handleOpenLevelExam(access.requiredLevelNumber);
        return;
      }
    }

    setLockNoticeBanner(null);
    setActiveLessonId(lessonId);
    setRecentlyViewedLessonId(lessonId);
    setCurrentView('lesson');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCompleteLesson = async (lessonId: string) => {
    if (!isInstructor) {
      let targetLevelNum = 1;
      for (const lvl of levels) {
        for (const mod of lvl.modules) {
          if (mod.lessons.some((l) => l.id === lessonId)) {
            targetLevelNum = lvl.levelNumber;
          }
        }
      }
      const hasPassedQuizForLesson = quizAttempts.some(
        (att) =>
          att.passed &&
          (att.quizId === `quiz-${lessonId}` ||
            att.quizId === `exam-lvl-${targetLevelNum}`)
      );

      if (!hasPassedQuizForLesson) {
        setLockNoticeBanner(
          'Please pass the Module Quiz at the bottom of this lesson (unlimited retakes available) before marking the lesson as completed or moving to the next module.'
        );
        const quizEl = document.getElementById('module-quiz-section');
        if (quizEl) {
          quizEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // If the student already passed the quiz, keep it marked completed
      if (completedLessonIds.includes(lessonId)) {
        return;
      }
    }

    const isCurrentlyCompleted = completedLessonIds.includes(lessonId);
    const nextCompletedState = !isCurrentlyCompleted;
    const nextCompletedIds = nextCompletedState
      ? Array.from(new Set([...completedLessonIds, lessonId]))
      : completedLessonIds.filter((id) => id !== lessonId);

    setCompletedLessonIds(nextCompletedIds);

    if (!currentUser.isDemoSession) {
      saveFullStudentProgressSnapshot(currentUser.id, currentUser.email, {
        completedLessonIds: nextCompletedIds,
        quizAttempts,
        projectSubmissions,
        activeLessonId,
        recentlyViewedLessonId,
      }).catch(() => {});

      if (supabase) {
        await syncLessonCompletionToSupabase(
          currentUser.id,
          lessonId,
          nextCompletedState
        );
      }
    }
  };

  const handleRecordQuizAttempt = async (attempt: QuizAttempt) => {
    let finalAttempt = attempt;

    if (!currentUser.isDemoSession && supabase) {
      const res = await insertQuizAttemptToSupabase(currentUser.id, {
        quizId: attempt.quizId,
        lessonTitle: attempt.lessonTitle,
        scorePercent: attempt.scorePercent,
        passed: attempt.passed,
        totalQuestions: attempt.totalQuestions,
        correctCount: attempt.correctCount,
      });
      if (res.ok && res.savedAttempt) {
        finalAttempt = res.savedAttempt;
      }
    }

    const nextAttempts = [finalAttempt, ...quizAttempts];
    const nextCompletedIds = ensureConsistentCompletedLessons(
      completedLessonIds,
      nextAttempts,
      levels
    );

    if (finalAttempt.passed) {
      setLockNoticeBanner(null);
    }

    let nextActiveId = activeLessonId;
    let nextRecentId = recentlyViewedLessonId;

    // If the student just passed a Level Final Exam, automatically advance their resume lesson to the next level
    if (finalAttempt.passed && finalAttempt.quizId?.startsWith('exam-lvl-')) {
      const passedLvlNum = Number(finalAttempt.quizId.replace('exam-lvl-', ''));
      const nextLvlObj = levels.find((l) => l.levelNumber === passedLvlNum + 1);
      const firstLessonInNextLvl = nextLvlObj?.modules[0]?.lessons[0];
      if (firstLessonInNextLvl) {
        nextActiveId = firstLessonInNextLvl.id;
        nextRecentId = firstLessonInNextLvl.id;
        setActiveLessonId(nextActiveId);
        setRecentlyViewedLessonId(nextRecentId);
      }
    }

    setQuizAttempts(nextAttempts);
    setCompletedLessonIds(nextCompletedIds);

    if (!currentUser.isDemoSession) {
      if (
        finalAttempt.passed &&
        finalAttempt.quizId?.startsWith('quiz-') &&
        supabase
      ) {
        const passedLessonId = finalAttempt.quizId.replace(/^quiz-/, '');
        syncLessonCompletionToSupabase(
          currentUser.id,
          passedLessonId,
          true
        ).catch(() => {});
      }

      await saveFullStudentProgressSnapshot(currentUser.id, currentUser.email, {
        completedLessonIds: nextCompletedIds,
        quizAttempts: nextAttempts,
        projectSubmissions,
        activeLessonId: nextActiveId,
        recentlyViewedLessonId: nextRecentId,
      });
    }
  };

  const handleToggleProjectChecklist = async (
    projectId: string,
    itemIdx: number
  ) => {
    const existing = projectSubmissions[projectId] || {
      projectId,
      completedChecklistItems: [],
      notes: '',
      status: 'not_started' as const,
    };
    const hasItem = existing.completedChecklistItems.includes(itemIdx);
    const updatedItems = hasItem
      ? existing.completedChecklistItems.filter((i) => i !== itemIdx)
      : [...existing.completedChecklistItems, itemIdx];

    const updatedSubmission: ProjectSubmissionState = {
      ...existing,
      completedChecklistItems: updatedItems,
      status: updatedItems.length > 0 ? 'in_progress' : 'not_started',
    };

    setProjectSubmissions((prev) => ({
      ...prev,
      [projectId]: updatedSubmission,
    }));

    if (!currentUser.isDemoSession && supabase) {
      await syncProjectSubmissionToSupabase(currentUser.id, updatedSubmission);
    }
  };

  const handleSaveLessonInModule = (
    levelNumber: number,
    moduleId: string,
    lesson: Lesson
  ) => {
    setLevels((prevLevels) =>
      prevLevels.map((lvl) => {
        if (lvl.levelNumber !== levelNumber) return lvl;
        return {
          ...lvl,
          modules: lvl.modules.map((mod) => {
            if (mod.id !== moduleId) return mod;
            const exists = mod.lessons.some((l) => l.id === lesson.id);
            const updatedLessons = exists
              ? mod.lessons.map((l) => (l.id === lesson.id ? lesson : l))
              : [...mod.lessons, lesson];
            return {
              ...mod,
              lessons: [...updatedLessons].sort(
                (a, b) => a.orderIndex - b.orderIndex
              ),
            };
          }),
        };
      })
    );
  };

  const handleDeleteLessonFromModule = (
    levelNumber: number,
    moduleId: string,
    lessonId: string
  ) => {
    setLevels((prevLevels) =>
      prevLevels.map((lvl) => {
        if (lvl.levelNumber !== levelNumber) return lvl;
        return {
          ...lvl,
          modules: lvl.modules.map((mod) => {
            if (mod.id !== moduleId) return mod;
            return {
              ...mod,
              lessons: mod.lessons.filter((l) => l.id !== lessonId),
            };
          }),
        };
      })
    );
  };

  const handleReorderLessonInModule = (
    levelNumber: number,
    moduleId: string,
    lessonId: string,
    direction: 'up' | 'down'
  ) => {
    setLevels((prevLevels) =>
      prevLevels.map((lvl) => {
        if (lvl.levelNumber !== levelNumber) return lvl;
        return {
          ...lvl,
          modules: lvl.modules.map((mod) => {
            if (mod.id !== moduleId) return mod;
            const sorted = [...mod.lessons].sort(
              (a, b) => a.orderIndex - b.orderIndex
            );
            const idx = sorted.findIndex((l) => l.id === lessonId);
            if (idx === -1) return mod;
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= sorted.length) return mod;

            const currentOrder = sorted[idx].orderIndex;
            const targetOrder = sorted[swapIdx].orderIndex;
            sorted[idx] = { ...sorted[idx], orderIndex: targetOrder };
            sorted[swapIdx] = { ...sorted[swapIdx], orderIndex: currentOrder };

            return {
              ...mod,
              lessons: [...sorted].sort((a, b) => a.orderIndex - b.orderIndex),
            };
          }),
        };
      })
    );
  };

  const handleAddQuizQuestionToLesson = (
    lessonId: string,
    newQuestion: QuizQuestion
  ) => {
    setLevels((prevLevels) =>
      prevLevels.map((lvl) => ({
        ...lvl,
        modules: lvl.modules.map((mod) => ({
          ...mod,
          lessons: mod.lessons.map((les) => {
            if (les.id !== lessonId) return les;
            return {
              ...les,
              quiz: {
                ...(les.quiz || {
                  id: `quiz-${les.id}`,
                  lessonId: les.id,
                  moduleId: mod.id,
                  title: `${les.title} Quiz`,
                  passingScorePercent: 67,
                  questions: [],
                }),
                questions: [...(les.quiz?.questions || []), newQuestion],
              },
            };
          }),
        })),
      }))
    );
  };

  const handleOpenAuthModal = (tab: 'login' | 'register' | 'instructor' | 'checkout') => {
    setAuthPromptNotice(null);
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    if (!currentUser.isDemoSession) {
      await saveFullStudentProgressSnapshot(currentUser.id, currentUser.email, {
        completedLessonIds,
        quizAttempts,
        projectSubmissions,
        activeLessonId,
        recentlyViewedLessonId,
      }).catch(() => {});
    }
    saveActiveProfile(null);
    if (supabase && !currentUser.isDemoSession) {
      await supabase.auth.signOut().catch(() => {});
    }
    setCurrentUser({
      id: 'demo-student-01',
      email: 'guest@excelacademy.local',
      fullName: 'Guest Learner',
      role: 'student_demo',
      createdAt: '2026-10-23',
      isDemoSession: true,
    });
    setCompletedLessonIds([]);
    setQuizAttempts([]);
    setProjectSubmissions({});
    setHasPaid(false);
    setActiveLessonId('lvl-1-mod-1-les-1');
    setRecentlyViewedLessonId('lvl-1-mod-1-les-1');
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeExamObj =
    activeExamLevel !== null
      ? LEVEL_EXAMS.find((e) => e.levelNumber === activeExamLevel) || null
      : null;

  const totalCurriculumLessons = levels.reduce(
    (acc, lvl) =>
      acc + lvl.modules.reduce((mAcc, mod) => mAcc + mod.lessons.length, 0),
    0
  );
  const allModulesDone =
    totalCurriculumLessons > 0 &&
    completedLessonIds.length >= totalCurriculumLessons;
  const allExamsDone = levels.every((lvl) =>
    quizAttempts.some(
      (att) => att.quizId === `exam-lvl-${lvl.levelNumber}` && att.passed
    )
  );
  const allProjectsDone = CAPSTONE_PROJECTS.every(
    (proj) => projectSubmissions[proj.id]?.status === 'completed_local'
  );
  const canExportCertificate =
    allModulesDone && allExamsDone && allProjectsDone;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-slate-900">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuthModal={handleOpenAuthModal}
        currentUser={currentUser}
        supabaseStatus={supabaseStatus}
        onLogout={handleLogout}
      />

      {lockNoticeBanner && (
        <div className="bg-amber-950 text-amber-100 border-b border-amber-800 px-6 py-3 flex items-center justify-between gap-4 text-xs">
          <span>{lockNoticeBanner}</span>
          <button
            type="button"
            onClick={() => setLockNoticeBanner(null)}
            className="px-2.5 py-1 rounded bg-amber-800 hover:bg-amber-700 text-white font-semibold shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {(currentView === 'home' ||
        (!isAuthenticated &&
          currentView !== 'curriculum' &&
          currentView !== 'projects' &&
          currentView !== 'shortcuts' &&
          currentView !== 'admin')) && (
        <HomeView
          course={course}
          levels={levels}
          isAuthenticated={isAuthenticated}
          onNavigate={handleNavigate}
          onSelectLevelInCurriculum={handleSelectLevelInCurriculum}
          onStartLesson={handleStartLesson}
          onOpenAuthModal={handleOpenAuthModal}
          onOpenLegalModal={(doc) => setLegalDocType(doc)}
        />
      )}

      {currentView === 'curriculum' && (
        <CurriculumView
          levels={levels}
          selectedLevelFilter={selectedLevelFilter}
          onChangeLevelFilter={setSelectedLevelFilter}
          completedLessonIds={completedLessonIds}
          quizAttempts={quizAttempts}
          isAuthenticated={isAuthenticated}
          isPurchased={isPurchased}
          isInstructor={isInstructor}
          onStartLesson={handleStartLesson}
          onOpenLevelExam={handleOpenLevelExam}
          onRequireAuth={() => {
            setAuthPromptNotice(
              'Please log in or sign up to start taking lessons and download Excel practice workbooks.'
            );
            setAuthModalTab('login');
            setAuthModalOpen(true);
          }}
          onOpenCheckout={() => handleOpenAuthModal('checkout')}
        />
      )}

      {currentView === 'projects' && (
        <CapstonePortfolioView
          standalonePage={true}
          studentName={currentUser.fullName}
          studentEmail={currentUser.email}
          projectSubmissions={projectSubmissions}
          levels={levels}
          completedLessonIds={completedLessonIds}
          quizAttempts={quizAttempts}
          isInstructor={isInstructor}
          isAuthenticated={isAuthenticated}
          onUpdateStudentName={async (newName) => {
            setCurrentUser((prev) => ({ ...prev, fullName: newName }));
            if (!currentUser.isDemoSession) {
              await updateProfileFullNameInSupabase(currentUser.id, newName);
            }
          }}
          onNavigateToLearning={() => {
            if (isAuthenticated) {
              setCurrentView('dashboard');
            } else {
              setCurrentView('curriculum');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onRequireAuth={() => {
            setAuthPromptNotice(
              'Please log in or sign up to submit your final projects and download your official certificate.'
            );
            setAuthModalTab('login');
            setAuthModalOpen(true);
          }}
          onSubmitCapstoneProject={(projectId, _score, notes) => {
            setProjectSubmissions((prev) => {
              const updated = {
                ...prev,
                [projectId]: {
                  projectId,
                  completedChecklistItems: [0, 1, 2, 3],
                  notes,
                  status: 'completed_local' as const,
                  updatedAt: new Date().toISOString(),
                },
              };
              if (!currentUser.isDemoSession) {
                syncProjectSubmissionToSupabase(
                  currentUser.id,
                  updated[projectId]
                );
              }
              return updated;
            });
          }}
        />
      )}

      {isAuthenticated && currentView === 'dashboard' && (
        <StudentDashboardView
          student={currentUser}
          course={course}
          levels={levels}
          completedLessonIds={completedLessonIds}
          recentlyViewedLessonId={recentlyViewedLessonId}
          quizAttempts={quizAttempts}
          projectSubmissions={projectSubmissions}
          onToggleProjectChecklist={handleToggleProjectChecklist}
          onStartLesson={handleStartLesson}
          onUpdateStudentName={async (newName) => {
            setCurrentUser((prev) => ({ ...prev, fullName: newName }));
            if (!currentUser.isDemoSession) {
              await updateProfileFullNameInSupabase(currentUser.id, newName);
            }
          }}
          onResetDemoProgress={() => {
            setCompletedLessonIds([]);
            setQuizAttempts([]);
            setProjectSubmissions({});
          }}
          onRecordQuizAttempt={handleRecordQuizAttempt}
          onLogoutDemo={handleLogout}
          onOpenLevelExam={handleOpenLevelExam}
          onNavigateToProjects={() => {
            setCurrentView('projects');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSubmitCapstoneProject={(projectId, _score, notes) => {
            setProjectSubmissions((prev) => {
              const updated = {
                ...prev,
                [projectId]: {
                  projectId,
                  completedChecklistItems: [0, 1, 2, 3],
                  notes,
                  status: 'completed_local' as const,
                  updatedAt: new Date().toISOString(),
                },
              };
              if (!currentUser.isDemoSession) {
                syncProjectSubmissionToSupabase(
                  currentUser.id,
                  updated[projectId]
                );
              }
              return updated;
            });
          }}
        />
      )}

      {isAuthenticated && currentView === 'lesson' && (
        <LessonPlayerView
          levels={levels}
          activeLessonId={activeLessonId}
          completedLessonIds={completedLessonIds}
          supabaseStatus={supabaseStatus}
          currentUser={currentUser}
          onSelectLesson={handleStartLesson}
          onToggleCompleteLesson={handleToggleCompleteLesson}
          onRecordQuizAttempt={handleRecordQuizAttempt}
          quizAttempts={quizAttempts}
          onOpenLevelExam={handleOpenLevelExam}
        />
      )}

      {currentView === 'shortcuts' && (
        <ShortcutCoachView
          onNavigateToLessons={() => {
            if (isAuthenticated) {
              setCurrentView('lesson');
            } else {
              setCurrentView('curriculum');
            }
          }}
        />
      )}

      {currentView === 'admin' && isInstructor && (
        <AdminDashboardView
          course={course}
          levels={levels}
          completedLessonIds={completedLessonIds}
          supabaseStatus={supabaseStatus}
          currentUser={currentUser}
          onUpdateCourse={setCourse}
          onSaveLessonInModule={handleSaveLessonInModule}
          onDeleteLessonFromModule={handleDeleteLessonFromModule}
          onReorderLessonInModule={handleReorderLessonInModule}
          onAddQuizQuestionToLesson={handleAddQuizQuestionToLesson}
          onSignOutAdmin={() => {
            handleLogout();
            setCurrentView('home');
          }}
        />
      )}

      {activeExamObj && (
        <LevelExamModal
          exam={activeExamObj}
          studentName={currentUser.fullName}
          studentEmail={currentUser.email}
          isOpen={Boolean(activeExamObj)}
          canExportCertificate={canExportCertificate}
          onClose={() => setActiveExamLevel(null)}
          onRecordExamAttempt={handleRecordQuizAttempt}
          onOpenCertificatePreview={(cert) => setPreviewCertificate(cert)}
          onAdvanceToNextLevel={(nextLvlNum) => {
            setActiveExamLevel(null);
            setLockNoticeBanner(null);
            if (nextLvlNum > 1 && !isPurchased) {
              setAuthPromptNotice(
                `Congratulations on passing the Level ${nextLvlNum - 1} General Quiz! Enrol in the Full Academy to unlock Level ${nextLvlNum}.`
              );
              setAuthModalTab('checkout');
              setAuthModalOpen(true);
              return;
            }
            const nextLevelObj = levels.find((l) => l.levelNumber === nextLvlNum);
            const firstLessonInNextLevel = nextLevelObj?.modules[0]?.lessons[0];
            if (firstLessonInNextLevel) {
              setActiveLessonId(firstLessonInNextLevel.id);
              setRecentlyViewedLessonId(firstLessonInNextLevel.id);
              setCurrentView('lesson');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              setSelectedLevelFilter(nextLvlNum);
              setCurrentView('curriculum');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      )}

      {previewCertificate && (
        <CertificatePreviewModal
          certificate={previewCertificate}
          isOpen={Boolean(previewCertificate)}
          onClose={() => setPreviewCertificate(null)}
          onUpdateName={async (newName) => {
            setCurrentUser((prev) => ({ ...prev, fullName: newName }));
            setPreviewCertificate((prev) =>
              prev ? { ...prev, studentName: newName } : null
            );
            if (!currentUser.isDemoSession) {
              await updateProfileFullNameInSupabase(currentUser.id, newName);
            }
          }}
        />
      )}

      <AuthAndCheckoutModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        course={course}
        currentUserEmail={currentUser.email}
        authPromptMessage={authPromptNotice}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthPromptNotice(null);
        }}
        onPaymentVerified={() => {
          setHasPaid(true);
          localStorage.setItem('excel_academy_has_paid', 'true');
        }}
        onAuthenticated={async (profile) => {
          setCurrentUser(profile);
          setAuthPromptNotice(null);
          await restoreProgressForProfile(profile);
          const isAdminLogin =
            profile.email?.toLowerCase() === 'okorotochukwu007@gmail.com' ||
            profile.role === 'admin';
          if (pendingLessonId) {
            setActiveLessonId(pendingLessonId);
            setRecentlyViewedLessonId(pendingLessonId);
            setPendingLessonId(null);
            setCurrentView('lesson');
          } else if (isAdminLogin) {
            setCurrentView('admin');
          } else {
            setCurrentView('dashboard');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <LegalAndContactModal
        docType={legalDocType}
        onClose={() => setLegalDocType(null)}
      />

      <OfflineIndicator />
    </div>
  );
}
