import { useState, useEffect } from 'react';
import {
  Course,
  CurriculumLevel,
  Lesson,
  Profile,
  ProjectSubmissionState,
  QuizAttempt,
  QuizQuestion,
} from './types/academy';
import { CURRICULUM_LEVELS, INITIAL_COURSE } from './data/curriculumData';
import { AppView, Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { CurriculumView } from './components/CurriculumView';
import { StudentDashboardView } from './components/StudentDashboardView';
import { LessonPlayerView } from './components/LessonPlayerView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AdminAccessGate } from './components/AdminAccessGate';
import { FormulaPlaygroundView } from './components/FormulaPlaygroundView';
import { ShortcutCoachView } from './components/ShortcutCoachView';
import {
  AuthAndCheckoutModal,
  LegalAndContactModal,
} from './components/AuthAndCheckoutModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { supabase } from './lib/supabaseClient';
import {
  fetchOrCreateUserProfile,
  fetchPublicVideoCoverageMap,
  fetchSupabaseBackendStatus,
  insertQuizAttemptToSupabase,
  loadStudentProgressFromSupabase,
  SupabaseBackendStatus,
  syncLessonCompletionToSupabase,
  syncProjectSubmissionToSupabase,
  updateProfileFullNameInSupabase,
} from './services/academyService';

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

  const [currentUser, setCurrentUser] = useState<Profile>({
    id: 'demo-student-01',
    email: 'demo.student@excelacademy.local',
    fullName: 'Demo Student (Local Session)',
    role: 'student_demo',
    createdAt: '2026-10-23',
    isDemoSession: true,
  });

  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([
    'lvl-1-mod-1-les-1',
    'lvl-1-mod-1-les-2',
    'lvl-1-mod-2-les-1',
  ]);
  const [activeLessonId, setActiveLessonId] = useState<string>('lvl-1-mod-2-les-2');
  const [recentlyViewedLessonId, setRecentlyViewedLessonId] =
    useState<string>('lvl-1-mod-2-les-2');

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([
    {
      id: 'demo-att-1',
      quizId: 'quiz-lvl-1-mod-1-les-1',
      lessonTitle: 'Introduction to Excel and the spreadsheet interface: Core Concepts & Walkthrough',
      scorePercent: 100,
      passed: true,
      totalQuestions: 3,
      correctCount: 3,
      attemptedAt: 'Demo Session Initial',
      isSimulatedLocal: true,
    },
  ]);

  const [projectSubmissions, setProjectSubmissions] = useState<
    Record<string, ProjectSubmissionState>
  >({
    'proj-1-sales-performance': {
      projectId: 'proj-1-sales-performance',
      completedChecklistItems: [0, 1],
      notes: '',
      status: 'in_progress',
    },
  });

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'instructor' | 'checkout'>('login');
  const [pendingLessonId, setPendingLessonId] = useState<string | null>(null);
  const [authPromptNotice, setAuthPromptNotice] = useState<string | null>(null);
  const [legalDocType, setLegalDocType] = useState<
    'privacy' | 'terms' | 'refund' | 'contact' | null
  >(null);
  const [playgroundFormula, setPlaygroundFormula] = useState<string>('=SUM(E2:E11)');

  const [hasPaid, setHasPaid] = useState<boolean>(() => {
    return localStorage.getItem('excel_academy_has_paid') === 'true';
  });

  const isAuthenticated = Boolean(currentUser && !currentUser.isDemoSession);
  const isInstructor = currentUser?.email?.toLowerCase() === 'okorotochukwu007@gmail.com';
  const isPurchased = isInstructor || hasPaid;

  const checkLessonAccess = (lessonId: string): {
    unlocked: boolean;
    reason?: 'level_locked' | 'sequence_locked';
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

    // Finish each exercise before starting the next
    if (targetIdx > 0) {
      const prevLesson = allOrderedLessons[targetIdx - 1];
      const isPrevCompleted = completedLessonIds.includes(prevLesson.id);
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
              const dbProgress = await loadStudentProgressFromSupabase(u.id);
              setCompletedLessonIds(dbProgress.completedLessonIds);
              setQuizAttempts(dbProgress.quizAttempts);
              setProjectSubmissions(dbProgress.projectSubmissions);
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
        async (_event, session) => {
          try {
            if (session?.user) {
              const u = session.user;
              const profile = await fetchOrCreateUserProfile(
                u.id,
                u.email || '',
                u.user_metadata?.full_name
              );
              if (profile) {
                setCurrentUser(profile);
                const dbProgress = await loadStudentProgressFromSupabase(u.id);
                setCompletedLessonIds(dbProgress.completedLessonIds);
                setQuizAttempts(dbProgress.quizAttempts);
                setProjectSubmissions(dbProgress.projectSubmissions);
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
    if (!isAuthenticated && (view === 'lesson' || view === 'dashboard' || view === 'admin')) {
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
        alert(
          `Exercise Locked: Please finish the previous exercise ("${access.requiredLessonTitle}") before starting this one!`
        );
        return;
      }
    }

    setActiveLessonId(lessonId);
    setRecentlyViewedLessonId(lessonId);
    setCurrentView('lesson');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCompleteLesson = async (lessonId: string) => {
    const isCurrentlyCompleted = completedLessonIds.includes(lessonId);
    const nextCompletedState = !isCurrentlyCompleted;

    setCompletedLessonIds((prev) =>
      nextCompletedState
        ? [...prev, lessonId]
        : prev.filter((id) => id !== lessonId)
    );

    if (!currentUser.isDemoSession && supabase) {
      await syncLessonCompletionToSupabase(
        currentUser.id,
        lessonId,
        nextCompletedState
      );
    }
  };

  const handleRecordQuizAttempt = async (attempt: QuizAttempt) => {
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
        setQuizAttempts((prev) => [res.savedAttempt!, ...prev]);
        return;
      }
    }
    setQuizAttempts((prev) => [attempt, ...prev]);
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
    if (supabase && !currentUser.isDemoSession) {
      await supabase.auth.signOut();
    }
    setCurrentUser({
      id: 'demo-student-01',
      email: 'guest@excelacademy.local',
      fullName: 'Guest Learner',
      role: 'student_demo',
      createdAt: '2026-10-23',
      isDemoSession: true,
    });
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

      {(currentView === 'home' ||
        (!isAuthenticated &&
          currentView !== 'curriculum' &&
          currentView !== 'playground' &&
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
          isAuthenticated={isAuthenticated}
          isPurchased={isPurchased}
          isInstructor={isInstructor}
          onStartLesson={handleStartLesson}
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
          onSubmitCapstoneProject={(projectId, score, notes) => {
            setProjectSubmissions((prev) => {
              const updated = {
                ...prev,
                [projectId]: {
                  projectId,
                  completedChecklistItems: [0, 1, 2, 3, 4, 5],
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
          onOpenInPlayground={(formula) => {
            setPlaygroundFormula(formula);
            setCurrentView('playground');
          }}
        />
      )}

      {currentView === 'playground' && (
        <FormulaPlaygroundView
          initialFormula={playgroundFormula}
          onNavigateToLessons={() => {
            if (isAuthenticated) {
              setCurrentView('lesson');
            } else {
              setCurrentView('curriculum');
            }
          }}
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

      {currentView === 'admin' && (
        currentUser?.email?.toLowerCase() === 'okorotochukwu007@gmail.com' ? (
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
        ) : (
          <AdminAccessGate
            currentUser={currentUser}
            onAuthorizeAsInstructor={() => {
              setCurrentUser({
                id: 'instructor-okoro-tochuwku',
                email: 'okorotochukwu007@gmail.com',
                fullName: 'Okoro Tochuwku (Lead Instructor)',
                role: 'admin_demo',
                createdAt: '2026-10-23',
                isDemoSession: false,
              });
              localStorage.setItem('instructor_master_key', 'OKORO-EXCEL-CHIEF-2026');
              setCurrentView('admin');
            }}
            onReturnHome={() => setCurrentView('home')}
          />
        )
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
          if (!profile.isDemoSession) {
            const dbProgress = await loadStudentProgressFromSupabase(profile.id);
            setCompletedLessonIds(dbProgress.completedLessonIds);
            setQuizAttempts(dbProgress.quizAttempts);
            setProjectSubmissions(dbProgress.projectSubmissions);
          }
          if (pendingLessonId) {
            setActiveLessonId(pendingLessonId);
            setRecentlyViewedLessonId(pendingLessonId);
            setPendingLessonId(null);
            setCurrentView('lesson');
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
