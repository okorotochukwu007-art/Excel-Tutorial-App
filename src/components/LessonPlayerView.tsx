import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Play,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  Video,
  MessageCircle,
  Lock,
} from 'lucide-react';
import {
  CurriculumLevel,
  Lesson,
  Profile,
  QuizAttempt,
  StudentRecommendationState,
  YoutubeVideoRecommendation,
} from '../types/academy';
import {
  fetchAuthorizedLessonVideo,
  fetchStudentLessonRecommendations,
  getBundledOrLocalLessonRecommendations,
  SupabaseBackendStatus,
} from '../services/academyService';

interface LessonPlayerViewProps {
  levels: CurriculumLevel[];
  activeLessonId: string;
  completedLessonIds: string[];
  supabaseStatus: SupabaseBackendStatus;
  currentUser?: Profile | null;
  onSelectLesson: (lessonId: string) => void;
  onToggleCompleteLesson: (lessonId: string) => void;
  onRecordQuizAttempt: (attempt: QuizAttempt) => void;
  quizAttempts: QuizAttempt[];
  onOpenLevelExam?: (levelNumber: number) => void;
}

function buildBeginnerIntroForLesson(
  lesson: Lesson,
  moduleTitle: string,
  levelTitle: string
): { whatYouWillLearn: string; whyItMatters: string } {
  const cleanTitle = lesson.title
    .replace(/:\s*Core Concepts & Walkthrough/gi, '')
    .replace(/:\s*Hands-On Business Lab/gi, '')
    .replace(/:\s*Applied Spreadsheet Lab/gi, '')
    .replace(/^Project\s*\d+:\s*/i, '')
    .trim();

  const whatYouWillLearn = `In this lesson, you will learn ${cleanTitle.toLowerCase()} step by step inside Microsoft Excel. Even if you have never used this feature before, we start from the basics and show you exactly where to click and what to type.`;

  const levelWhyMap: Record<number, string> = {
    1: 'Mastering the basic Excel screen, cells, and file habits gives you confidence so you never feel lost or afraid of breaking a spreadsheet.',
    2: 'Formulas let Excel do the math for you automatically, saving hours of manual calculator work and preventing costly typing mistakes.',
    3: 'Real-world office spreadsheets often contain extra spaces, duplicates, or messy dates. Cleaning data properly ensures your totals and reports are 100% trustworthy.',
    4: 'Sorting, filtering, and PivotTables allow you to answer manager questions in seconds instead of manually counting hundreds of rows.',
    5: 'Clear charts and dashboards turn rows of numbers into visual stories that business leaders and clients can understand at a glance.',
    6: 'Combining these skills on realistic business datasets prepares you for real data analyst tasks, job interviews, and workplace reporting.',
  };

  const whyItMatters =
    levelWhyMap[lesson.levelNumber] ||
    `This skill is a core part of ${moduleTitle} (${levelTitle}) and helps you work faster and more accurately with everyday spreadsheets.`;

  return { whatYouWillLearn, whyItMatters };
}

export const LessonPlayerView: React.FC<LessonPlayerViewProps> = ({
  levels,
  activeLessonId,
  completedLessonIds,
  supabaseStatus,
  currentUser,
  onSelectLesson,
  onToggleCompleteLesson,
  onRecordQuizAttempt,
  quizAttempts,
  onOpenLevelExam,
}) => {
  const [sidebarLevelNumber, setSidebarLevelNumber] = useState<number>(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizRequirementNotice, setQuizRequirementNotice] = useState<string | null>(null);

  // Cached Approved Recommendations & Explicit Student Video State (A, B, C, D)
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [approvedRecs, setApprovedRecs] = useState<YoutubeVideoRecommendation[]>(
    () =>
      getBundledOrLocalLessonRecommendations(activeLessonId).recommendations.filter(
        (r) => r.status === 'approved'
      )
  );
  const [studentRecState, setStudentRecState] =
    useState<StudentRecommendationState>('approved_available');
  const [candidateCount, setCandidateCount] = useState<number>(3);
  const [recReviewReason, setRecReviewReason] = useState<string | null>(null);
  const [recErrorMessage, setRecErrorMessage] = useState<string | null>(null);
  const [selectedRecIndex, setSelectedRecIndex] = useState<number>(0);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(true);

  const [serverVideoAuth, setServerVideoAuth] = useState<{
    checked: boolean;
    entitled: boolean;
    youtubeVideoId?: string | null;
    reason?: string;
    message?: string;
  }>({ checked: false, entitled: false });

  // Flatten lessons for Prev/Next navigation
  const allLessons: {
    lesson: Lesson;
    moduleTitle: string;
    levelTitle: string;
  }[] = [];
  levels.forEach((lvl) => {
    lvl.modules.forEach((mod) => {
      mod.lessons
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .forEach((les) => {
          allLessons.push({
            lesson: les,
            moduleTitle: mod.title,
            levelTitle: lvl.title,
          });
        });
    });
  });

  const currentIdx = Math.max(
    0,
    allLessons.findIndex((item) => item.lesson.id === activeLessonId)
  );
  const currentEntry = allLessons[currentIdx] || allLessons[0];
  const currentLesson = currentEntry.lesson;
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1].lesson : null;
  const nextLesson =
    currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1].lesson : null;

  const bundledApprovedForCurrent = getBundledOrLocalLessonRecommendations(
    currentLesson.id
  ).recommendations.filter((r) => r.status === 'approved');

  const loadRecommendationsForCurrentLesson = (retry = false) => {
    const immediateBundled = getBundledOrLocalLessonRecommendations(
      currentLesson.id
    ).recommendations.filter((r) => r.status === 'approved');

    if (immediateBundled.length > 0) {
      setApprovedRecs(immediateBundled);
      setStudentRecState('approved_available');
    } else {
      setLoadingRecs(true);
    }
    setRecErrorMessage(null);
    fetchStudentLessonRecommendations(currentLesson.id, { retry })
      .then((recRes) => {
        const recs =
          recRes.recommendations && recRes.recommendations.length > 0
            ? recRes.recommendations
            : immediateBundled;
        setApprovedRecs(recs);
        setStudentRecState(
          recs.length > 0 ? 'approved_available' : recRes.studentState
        );
        setCandidateCount(recRes.candidateCount || recs.length);
        setRecReviewReason(recRes.reviewReason || null);
        setRecErrorMessage(recRes.lastError || recRes.error || null);
      })
      .finally(() => {
        setLoadingRecs(false);
      });
  };

  useEffect(() => {
    setSidebarLevelNumber(currentLesson.levelNumber);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizRequirementNotice(null);
    setSelectedRecIndex(0);
    setIsPlayerOpen(true);

    loadRecommendationsForCurrentLesson(false);

    if (supabaseStatus.configured && supabaseStatus.schemaReady) {
      fetchAuthorizedLessonVideo(currentLesson.id).then((res) => {
        setServerVideoAuth({
          checked: true,
          entitled: res.entitled,
          youtubeVideoId: res.youtubeVideoId,
          reason: res.reason,
          message: res.error,
        });
      });
    } else {
      setServerVideoAuth({
        checked: false,
        entitled: currentLesson.isFreePreview,
      });
    }
  }, [
    currentLesson.id,
    currentLesson.levelNumber,
    currentLesson.isFreePreview,
    supabaseStatus,
  ]);

  const isInstructorUser =
    currentUser?.email?.toLowerCase() === 'okorotochukwu007@gmail.com';

  const hasPassedLessonQuizById = (lessonId: string, levelNumber: number) => {
    if (isInstructorUser) return completedLessonIds.includes(lessonId);
    return (
      completedLessonIds.includes(lessonId) &&
      quizAttempts.some(
        (att) =>
          att.passed &&
          (att.quizId === `quiz-${lessonId}` ||
            att.quizId === `exam-lvl-${levelNumber}`)
      )
    );
  };

  const hasPassedCurrentQuiz =
    isInstructorUser ||
    quizAttempts.some(
      (att) =>
        att.passed &&
        (att.quizId === currentLesson.quiz?.id ||
          att.quizId === `quiz-${currentLesson.id}` ||
          att.quizId === `exam-lvl-${currentLesson.levelNumber}`)
    );

  const isCompleted = isInstructorUser
    ? completedLessonIds.includes(currentLesson.id)
    : hasPassedCurrentQuiz && completedLessonIds.includes(currentLesson.id);

  const overallPct = Math.round(
    (completedLessonIds.length / Math.max(1, allLessons.length)) * 100
  );

  const scrollToModuleQuizWithPrompt = () => {
    setQuizRequirementNotice(
      `You must pass this module's quiz (${currentLesson.quiz?.passingScorePercent || 67}%+ required) before marking this lesson as completed or moving to the next module. You can retake the quiz as many times as needed!`
    );
    const quizEl = document.getElementById('module-quiz-section');
    if (quizEl) {
      quizEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLesson.quiz) return;
    const questions = currentLesson.quiz.questions;
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        correctCount += 1;
      }
    });
    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const passed = scorePercent >= currentLesson.quiz.passingScorePercent;

    setQuizSubmitted(true);
    if (passed) {
      setQuizRequirementNotice(null);
    }
    onRecordQuizAttempt({
      id: `att-${Date.now()}`,
      quizId: currentLesson.quiz.id,
      lessonTitle: currentLesson.title,
      scorePercent,
      passed,
      totalQuestions: questions.length,
      correctCount,
      attemptedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isSimulatedLocal: !supabaseStatus.configured,
    });
  };

  const getPassedLevelExamAttempt = (lvlNum: number) => {
    return quizAttempts.find(
      (a) =>
        (a.quizId === `exam-lvl-${lvlNum}` ||
          a.lessonTitle.includes(`Level ${lvlNum} General Quiz`) ||
          a.lessonTitle.includes(`Level ${lvlNum} Comprehensive`)) &&
        a.passed
    );
  };

  const isLastLessonOfLevel =
    !nextLesson || nextLesson.levelNumber > currentLesson.levelNumber;
  const currentLevelExamPassedAttempt = getPassedLevelExamAttempt(
    currentLesson.levelNumber
  );

  const currentSidebarLevel =
    levels.find((l) => l.levelNumber === sidebarLevelNumber) || levels[0];

  const extractYoutubeId = (input: string): string | null => {
    const trimmed = input.trim();
    if (
      !trimmed ||
      trimmed === 'demo-preview-video-id' ||
      trimmed === 'demo-lab-video-id'
    ) {
      return null;
    }
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[2].length === 11) return match[2];
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    return null;
  };

  const effectiveApprovedRecs =
    approvedRecs.length > 0 ? approvedRecs : bundledApprovedForCurrent;

  const activeRec: YoutubeVideoRecommendation | null =
    effectiveApprovedRecs[selectedRecIndex] || effectiveApprovedRecs[0] || null;

  const fallbackVideoId =
    extractYoutubeId(serverVideoAuth.youtubeVideoId || '') ||
    extractYoutubeId(currentLesson.youtubeVideoId || '');

  const activeYoutubeEmbedId = activeRec
    ? activeRec.videoId
    : fallbackVideoId;

  const beginnerIntro = buildBeginnerIntroForLesson(
    currentLesson,
    currentEntry.moduleTitle,
    currentEntry.levelTitle
  );

  const handleCycleAlternativeTutorial = () => {
    if (effectiveApprovedRecs.length <= 1) return;
    setSelectedRecIndex((prev) => (prev + 1) % effectiveApprovedRecs.length);
    setIsPlayerOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: COURSERA-STYLE COURSE OUTLINE SIDEBAR (4 cols) */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden lg:sticky lg:top-24 order-2 lg:order-1">
          <div className="bg-slate-900 text-white p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold">Course Outline</span>
              <span className="font-mono tabular-nums">{overallPct}% Complete</span>
            </div>

            <div className="grid grid-cols-6 gap-1 bg-slate-800 p-1 rounded-lg">
              {levels.map((lvl) => (
                <button
                  key={lvl.levelNumber}
                  type="button"
                  onClick={() => setSidebarLevelNumber(lvl.levelNumber)}
                  className={`py-1.5 text-xs font-mono font-semibold rounded transition-colors cursor-pointer ${
                    sidebarLevelNumber === lvl.levelNumber
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  L{lvl.levelNumber}
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-slate-200">
              Level {currentSidebarLevel.levelNumber}: {currentSidebarLevel.title}
            </div>
          </div>

          <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-200">
            {currentSidebarLevel.modules.map((mod) => (
              <div key={mod.id} className="p-4 space-y-2.5">
                <div className="text-xs font-bold text-slate-900">
                  Module {currentSidebarLevel.levelNumber}.{mod.orderIndex}: {mod.title}
                </div>

                <div className="space-y-1.5">
                  {mod.lessons
                    .slice()
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((les) => {
                      const isActive = les.id === currentLesson.id;
                      const isDone = hasPassedLessonQuizById(les.id, les.levelNumber);
                      const lesIdxInAll = allLessons.findIndex((item) => item.lesson.id === les.id);
                      const isLevelLocked =
                        les.levelNumber > 1 &&
                        !isInstructorUser &&
                        localStorage.getItem('excel_academy_has_paid') !== 'true';
                      const isPrevLevelQuizLocked =
                        les.levelNumber > 1 &&
                        !isInstructorUser &&
                        !getPassedLevelExamAttempt(les.levelNumber - 1);
                      const prevLesObj = lesIdxInAll > 0 ? allLessons[lesIdxInAll - 1]?.lesson : null;
                      const isSeqLocked =
                        !isInstructorUser &&
                        Boolean(prevLesObj) &&
                        !hasPassedLessonQuizById(prevLesObj!.id, prevLesObj!.levelNumber);
                      const isLocked = isLevelLocked || isPrevLevelQuizLocked || isSeqLocked;

                      return (
                        <button
                          key={les.id}
                          type="button"
                          onClick={() => onSelectLesson(les.id)}
                          className={`w-full p-2.5 rounded-lg text-left text-xs flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-slate-900 text-white font-semibold'
                              : isLocked
                              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {isLocked ? (
                              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-700" />
                            )}
                            <span>{les.title}</span>
                          </div>
                          <span className="font-mono text-[11px] opacity-75 shrink-0 tabular-nums">
                            {isDone ? '✓' : isLocked ? '🔒' : `${les.durationMinutes}m`}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}

            {/* END OF LEVEL GENERAL QUIZ GATE IN SIDEBAR */}
            {(() => {
              const sidebarLvlLessons = currentSidebarLevel.modules.flatMap(
                (m) => m.lessons
              );
              const sidebarDoneCount = sidebarLvlLessons.filter((l) =>
                completedLessonIds.includes(l.id)
              ).length;
              const sidebarTotalCount = sidebarLvlLessons.length;
              const allSidebarLessonsDone =
                sidebarTotalCount > 0 && sidebarDoneCount >= sidebarTotalCount;
              const prevSidebarExamPassed =
                currentSidebarLevel.levelNumber === 1 ||
                Boolean(
                  getPassedLevelExamAttempt(currentSidebarLevel.levelNumber - 1)
                );
              const sidebarExamPassed = getPassedLevelExamAttempt(
                currentSidebarLevel.levelNumber
              );
              const canTakeSidebarExam =
                isInstructorUser ||
                Boolean(sidebarExamPassed) ||
                (prevSidebarExamPassed && allSidebarLessonsDone);

              return (
                <div className="p-4 bg-emerald-50/70 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-900 text-white font-mono text-[10px] font-bold uppercase">
                      End of Level {currentSidebarLevel.levelNumber} Final Exam
                    </span>
                    {sidebarExamPassed ? (
                      <span className="text-[11px] font-mono font-bold text-emerald-800">
                        ✓ Passed ({sidebarExamPassed.scorePercent}%)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-amber-900 font-semibold">
                        {sidebarDoneCount}/{sidebarTotalCount} Modules Done
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {!prevSidebarExamPassed
                      ? `Pass the Level ${currentSidebarLevel.levelNumber - 1} Final Exam first to unlock Level ${currentSidebarLevel.levelNumber}.`
                      : !allSidebarLessonsDone
                      ? `Complete all ${sidebarTotalCount} module lessons in Level ${currentSidebarLevel.levelNumber} (${sidebarDoneCount}/${sidebarTotalCount} done) to unlock this Level Final Exam.`
                      : currentSidebarLevel.levelNumber < 6
                      ? `All modules complete! Pass the Level ${currentSidebarLevel.levelNumber} Final Exam to unlock Level ${currentSidebarLevel.levelNumber + 1}.`
                      : 'All modules complete! Pass the Level 6 Final Exam to unlock the 4 Final Practice Projects.'}
                  </p>
                  {onOpenLevelExam &&
                    (canTakeSidebarExam ? (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenLevelExam(currentSidebarLevel.levelNumber)
                        }
                        className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>
                          {sidebarExamPassed
                            ? `Retake Level ${currentSidebarLevel.levelNumber} Final Exam`
                            : `Take Level ${currentSidebarLevel.levelNumber} Final Exam`}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 px-3 bg-slate-200 text-slate-500 border border-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          {!prevSidebarExamPassed
                            ? `Locked · Pass Level ${currentSidebarLevel.levelNumber - 1} Exam First`
                            : `Locked · Complete Modules (${sidebarDoneCount}/${sidebarTotalCount})`}
                        </span>
                      </button>
                    ))}
                </div>
              );
            })()}
          </div>
        </aside>

        {/* RIGHT / MAIN LESSON PLAYER COLUMN (8 cols) */}
        <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
          {/* Breadcrumb & Progress Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-800 font-semibold">
                <span>
                  Level 0{currentLesson.levelNumber}: {currentEntry.levelTitle}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{currentLesson.durationMinutes} min</span>
                <span aria-hidden="true">·</span>
                <span>
                  {currentLesson.isFreePreview
                    ? 'Free Preview'
                    : 'Full Course Lesson'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {currentLesson.title}
              </h1>
              <div className="text-xs text-slate-500">
                Module: {currentEntry.moduleTitle}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href="https://wa.me/2347080145682?text=Hello%20Lead%20Instructor%20Okoro,%20I%20am%20working%20on%20a%20lesson%20in%20the%20Excel%20Academy%20and%20have%20a%20question."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Speak directly to Lead Instructor Okoro Tochuwku on WhatsApp (07080145682)"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current text-white shrink-0" />
                <span className="hidden sm:inline">Speak to the Instructor</span>
                <span className="sm:hidden">WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  if (isInstructorUser || isCompleted) {
                    onToggleCompleteLesson(currentLesson.id);
                  } else {
                    scrollToModuleQuizWithPrompt();
                  }
                }}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                    : 'bg-slate-900 text-white hover:bg-emerald-800'
                }`}
              >
                {isCompleted ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Quiz Passed · Completed</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    <span>Pass Quiz to Complete</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 1. BEGINNER INTRODUCTION BEFORE THE VIDEO */}
          <div className="bg-[#FAF9F5] border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-800 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Before You Watch · Beginner Introduction</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 space-y-1">
                <div className="font-bold text-slate-900">
                  What You Are About to Learn
                </div>
                <p className="text-slate-600">{beginnerIntro.whatYouWillLearn}</p>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 space-y-1">
                <div className="font-bold text-slate-900">
                  Why This Matters in Everyday Work
                </div>
                <p className="text-slate-600">{beginnerIntro.whyItMatters}</p>
              </div>
            </div>
          </div>

          {/* 2. RECOMMENDED VIDEO TUTORIAL SECTION */}
          <section
            aria-label="Recommended Video Tutorial"
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <h2 className="text-sm sm:text-base font-bold tracking-tight">
                    Recommended Video Tutorial
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Watch step-by-step Excel instruction directly inside the academy
                  </p>
                </div>
              </div>

              {effectiveApprovedRecs.length > 1 && (
                <button
                  type="button"
                  onClick={handleCycleAlternativeTutorial}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    View Another Recommended Tutorial ({selectedRecIndex + 1}/
                    {effectiveApprovedRecs.length})
                  </span>
                </button>
              )}
            </div>

            {loadingRecs ? (
              <div className="p-8 bg-slate-900 text-white text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-emerald-300 text-xs font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>State B · Finding Beginner-Friendly Video Tutorial...</span>
                </div>
                <p className="text-xs text-slate-300 max-w-lg mx-auto">
                  Checking approved tutorials and matching beginner-friendly Microsoft Excel instruction for <strong>{currentLesson.title}</strong>...
                </p>
              </div>
            ) : activeRec ? (
              <div className="divide-y divide-slate-200">
                {/* Embedded YouTube Player or Thumbnail Preview */}
                <div className="bg-slate-950">
                  {isPlayerOpen ? (
                    <div className="aspect-video w-full bg-black">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube-nocookie.com/embed/${activeRec.videoId}?rel=0`}
                        title={activeRec.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full relative bg-slate-900 flex items-center justify-center overflow-hidden">
                      <img
                        src={activeRec.thumbnailUrl}
                        alt={activeRec.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-65"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPlayerOpen(true)}
                        className="relative z-10 px-5 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-2.5 cursor-pointer transition-transform hover:scale-105"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Watch Tutorial Inside Academy</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Video Metadata, Suitability Indicator & Controls */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <img
                        src={activeRec.thumbnailUrl}
                        alt={activeRec.title}
                        referrerPolicy="no-referrer"
                        className="w-24 h-16 sm:w-28 sm:h-20 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                      />
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-[11px] font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                            {activeRec.suitabilityLabel}
                          </span>
                          {activeRec.isPrimary ? (
                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-mono uppercase">
                              Primary Recommendation
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono uppercase">
                              Alternative Tutorial #{selectedRecIndex}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {activeRec.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span>
                            Channel:{' '}
                            <strong className="text-slate-900">
                              {activeRec.channelTitle}
                            </strong>
                          </span>
                          {activeRec.durationFormatted &&
                            activeRec.durationFormatted !== 'N/A' && (
                              <span className="flex items-center gap-1 font-mono text-slate-700">
                                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                                {activeRec.durationFormatted}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsPlayerOpen(true)}
                        className="px-3.5 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>
                          {isPlayerOpen ? 'Playing Above' : 'Watch in Academy'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Simple Explanation of What the Student Will Learn */}
                  <div className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-lg space-y-2 text-xs">
                    <div className="font-bold text-slate-900">
                      What You Will Learn in This Video:
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {activeRec.whatYouWillLearn}
                    </p>
                    {activeRec.evidence?.evidenceSummary &&
                      activeRec.evidence.evidenceSummary.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Suitability Evidence:
                          </span>
                          <span>
                            {activeRec.evidence.evidenceSummary
                              .slice(0, 2)
                              .join(' · ')}
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Option to Switch Between Primary and Alternative Tutorials */}
                  {effectiveApprovedRecs.length > 1 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-semibold text-slate-700">
                        Want a different explanation style? Choose another approved tutorial for this lesson:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {effectiveApprovedRecs.map((rec, idx) => {
                          const isCurrent = idx === selectedRecIndex;
                          return (
                            <button
                              key={rec.videoId}
                              type="button"
                              onClick={() => {
                                setSelectedRecIndex(idx);
                                setIsPlayerOpen(true);
                              }}
                              className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                                isCurrent
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-[#FAF9F5] text-slate-800 border-slate-200 hover:border-slate-400'
                              }`}
                            >
                              <img
                                src={rec.thumbnailUrl}
                                alt={rec.title}
                                referrerPolicy="no-referrer"
                                className="w-14 h-10 rounded object-cover shrink-0 bg-slate-200"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-mono opacity-80">
                                  {idx === 0
                                    ? 'Primary Tutorial'
                                    : `Alternative #${idx}`}{' '}
                                  · {rec.durationFormatted}
                                </div>
                                <div className="font-semibold truncate">
                                  {rec.title}
                                </div>
                                <div className="text-[11px] opacity-75 truncate">
                                  {rec.channelTitle}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : activeYoutubeEmbedId ? (
              /* Fallback if lesson has a direct youtubeVideoId assigned */
              <div className="divide-y divide-slate-200">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${activeYoutubeEmbedId}?rel=0`}
                    title={currentLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">
                      {currentLesson.title}
                    </div>
                    <div className="text-slate-600">
                      Instructor-assigned lesson video ({currentLesson.durationMinutes} min)
                    </div>
                  </div>
                  <span className="px-3.5 py-2 bg-emerald-800 text-white font-semibold rounded-lg flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5" />
                    <span>Playing Above</span>
                  </span>
                </div>
              </div>
            ) : studentRecState === 'technical_error' ? (
              /* STATE D: Technical or API Error Occurred, with Useful Fallback & Retry */
              <div className="bg-slate-900 text-white p-6 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800 pb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/90 border border-rose-700 text-rose-200 font-mono font-semibold">
                    Video Service Notice · Temporary Technical Issue
                  </span>
                  <button
                    type="button"
                    onClick={() => loadRecommendationsForCurrentLesson(true)}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Video Lookup</span>
                  </button>
                </div>

                <div className="space-y-2 max-w-2xl">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    We could not load the video tutorial for &ldquo;{currentLesson.title}&rdquo; right now
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {recErrorMessage ||
                      'A temporary connection or YouTube API quota limit prevented loading the video player for this lesson.'}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You can click <strong>Retry Video Lookup</strong> above, or study the complete step-by-step written walkthrough, Excel formula examples, and downloadable practice dataset (<code className="text-emerald-300 font-mono">{currentLesson.resource.fileName}</code>) directly below.
                  </p>
                </div>
              </div>
            ) : studentRecState === 'searching_or_awaiting_approval' ? (
              /* STATE B: Candidate Videos Found & Awaiting Admin Review / Approval */
              <div className="bg-slate-900 text-white p-6 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800 pb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-700 text-amber-200 font-mono font-semibold">
                    Recommendation Queued · Awaiting Instructor Review ({candidateCount} Candidate{candidateCount === 1 ? '' : 's'})
                  </span>
                  <button
                    type="button"
                    onClick={() => loadRecommendationsForCurrentLesson(true)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-emerald-700 text-white font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Check for Approved Video</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-w-2xl">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Tutorial Recommendation Awaiting Quality Approval for &ldquo;{currentLesson.title}&rdquo;
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {recReviewReason ||
                      'Candidate tutorials for this lesson topic have been found and are awaiting final beginner-suitability approval by the academy administrator.'}
                  </p>
                  <p className="text-xs text-slate-400">
                    While the video is being reviewed, you can complete this lesson using the interactive spreadsheet table, formula reference, and downloadable practice file (<strong className="text-slate-200 font-mono">{currentLesson.resource.fileName}</strong>) below.
                  </p>
                </div>
              </div>
            ) : (
              /* STATE C: No Suitable Beginner Video Found for Exact Topic — Clear Explanation & Fallback */
              <div className="bg-slate-900 text-white p-6 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-emerald-300 font-mono">
                    Guided Interactive Spreadsheet Lesson · {currentLesson.durationMinutes} min study time
                  </span>
                  <button
                    type="button"
                    onClick={() => loadRecommendationsForCurrentLesson(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-700 text-white font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Search Again</span>
                  </button>
                </div>

                <div className="space-y-3 max-w-2xl">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {currentLesson.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {recReviewReason ||
                      'No public, embeddable YouTube video met our strict beginner-friendly criteria for this exact topic yet. Rather than showing an unrelated or overly advanced video, we have prepared the complete step-by-step written walkthrough and practice workbook below.'}
                  </p>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
                    <div className="text-[11px] font-mono text-slate-400">
                      Key Excel Formulas &amp; Actions Covered in This Lesson:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentLesson.keyFormulas.map((formula) => (
                        <span
                          key={formula}
                          className="text-xs font-mono text-emerald-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-700 inline-flex items-center gap-1.5"
                        >
                          <span>{formula}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                  <span>
                    Practice File:{' '}
                    <strong className="text-slate-200 font-mono">
                      {currentLesson.resource.fileName}
                    </strong>
                  </span>
                  <span>
                    Administrators can assign a custom YouTube URL or review candidates in Admin &rarr; 4. Lessons &amp; Videos.
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* 3. AFTER THE VIDEO: VIDEO-ALIGNED MODULE QUIZ (REPLACES GENERIC EXERCISE CHECKLIST) */}
          <section
            id="module-quiz-section"
            aria-label="Video-Aligned Module Quiz"
            className="bg-white border-2 border-emerald-700/30 rounded-xl p-6 space-y-5 shadow-xs"
          >
            {quizRequirementNotice && (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs font-medium flex items-center justify-between gap-3">
                <span>{quizRequirementNotice}</span>
                <button
                  type="button"
                  onClick={() => setQuizRequirementNotice(null)}
                  className="px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold shrink-0 cursor-pointer"
                >
                  Got It
                </button>
              </div>
            )}

            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold uppercase tracking-wider">
                    After You Watch · Video-Aligned Lesson Quiz
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {currentLesson.quiz?.questions.length || 3} Questions · Pass with{' '}
                    {currentLesson.quiz?.passingScorePercent || 67}%+ · Unlimited Retakes
                  </span>
                  {isCompleted && (
                    <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-[10px] font-bold uppercase">
                      ✓ Quiz Passed
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Quiz: {currentEntry.moduleTitle}
                </h3>
                <p className="text-xs text-slate-600">
                  Answer these questions based on the{' '}
                  <strong className="text-slate-800">
                    {activeRec?.title || currentLesson.title}
                  </strong>{' '}
                  video tutorial above. You must pass this quiz to complete the lesson and unlock the next module—and you can retake it as many times as you like!
                </p>
              </div>

              {(quizSubmitted || Object.keys(selectedAnswers).length > 0 || isCompleted) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnswers({});
                    setQuizSubmitted(false);
                    setQuizRequirementNotice(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{quizSubmitted ? 'Retake Quiz' : 'Reset / Retake Quiz'}</span>
                </button>
              )}
            </div>

            {currentLesson.quiz && (
              <form onSubmit={handleQuizSubmit} className="space-y-4">
                {currentLesson.quiz.questions.map((q, qIndex) => {
                  const chosenIdx = selectedAnswers[q.id];
                  const isCorrect = chosenIdx === q.correctOptionIndex;

                  return (
                    <div
                      key={q.id}
                      className="p-4 sm:p-5 bg-[#FAF9F5] border border-slate-200 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                        <span className="font-bold text-slate-700">
                          Question 0{qIndex + 1} of 0{currentLesson.quiz!.questions.length}
                        </span>
                        {q.formulaContext && (
                          <code className="bg-white px-2.5 py-0.5 rounded border border-slate-200 text-emerald-900 font-semibold">
                            {q.formulaContext}
                          </code>
                        )}
                      </div>

                      <div className="text-sm font-bold text-slate-900 leading-snug">
                        {q.questionText}
                      </div>

                      <div className="space-y-2 pt-1">
                        {q.options.map((opt, oIndex) => {
                          const isSelected = chosenIdx === oIndex;
                          let optionStyle =
                            'bg-white border-slate-300 text-slate-800 hover:bg-slate-50';
                          if (quizSubmitted) {
                            if (oIndex === q.correctOptionIndex) {
                              optionStyle =
                                'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                            } else if (
                              isSelected &&
                              oIndex !== q.correctOptionIndex
                            ) {
                              optionStyle =
                                'bg-rose-50 border-rose-500 text-rose-950';
                            }
                          } else if (isSelected) {
                            optionStyle =
                              'bg-slate-900 border-slate-900 text-white font-medium';
                          }

                          return (
                            <label
                              key={oIndex}
                              className={`flex items-start gap-3 p-3 border rounded-lg text-xs cursor-pointer transition-colors ${optionStyle}`}
                            >
                              <input
                                type="radio"
                                name={`inline-${q.id}`}
                                disabled={quizSubmitted}
                                checked={isSelected}
                                onChange={() =>
                                  setSelectedAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: oIndex,
                                  }))
                                }
                                className="sr-only"
                              />
                              <span className="font-mono text-xs opacity-80 font-bold shrink-0">
                                {String.fromCharCode(65 + oIndex)}.
                              </span>
                              <span className="leading-relaxed">{opt}</span>
                            </label>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div
                          className={`p-3 rounded-lg text-xs leading-relaxed ${
                            isCorrect
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-950'
                              : 'bg-amber-50 border border-amber-200 text-amber-950'
                          }`}
                        >
                          <span className="font-bold">
                            {isCorrect ? '✓ Correct! ' : 'Explanation: '}
                          </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!quizSubmitted ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <span className="text-xs text-slate-500 font-mono">
                      {Object.keys(selectedAnswers).length} of{' '}
                      {currentLesson.quiz.questions.length} questions answered
                    </span>
                    <button
                      type="submit"
                      disabled={
                        Object.keys(selectedAnswers).length <
                        currentLesson.quiz.questions.length
                      }
                      className="px-6 py-3 text-xs font-bold text-white bg-emerald-800 rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
                    >
                      Submit Lesson Quiz
                    </button>
                  </div>
                ) : (
                  (() => {
                    const questions = currentLesson.quiz!.questions;
                    const correctCount = questions.filter(
                      (q) => selectedAnswers[q.id] === q.correctOptionIndex
                    ).length;
                    const scorePercent = Math.round(
                      (correctCount / questions.length) * 100
                    );
                    const passed =
                      scorePercent >= currentLesson.quiz!.passingScorePercent;

                    return (
                      <div
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          passed
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-amber-50 border-amber-300 text-amber-950'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-bold flex items-center gap-2">
                            {passed ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span>
                                  Quiz Passed ({scorePercent}% — {correctCount}/
                                  {questions.length} Correct) · Lesson Completed!
                                </span>
                              </>
                            ) : (
                              <span>
                                You scored {scorePercent}% ({correctCount}/
                                {questions.length} Correct). Need{' '}
                                {currentLesson.quiz!.passingScorePercent}% to pass.
                              </span>
                            )}
                          </div>
                          <p className="text-xs opacity-90">
                            {passed
                              ? isLastLessonOfLevel
                                ? `Great work! You have finished the final module of Level ${currentLesson.levelNumber}. Now pass the Level ${currentLesson.levelNumber} General Quiz to move to Level ${currentLesson.levelNumber + 1}!`
                                : 'Great job! You can retake this quiz anytime or proceed directly to the next lesson.'
                              : 'Review the explanations above and click "Retake Quiz" to try again—you have unlimited attempts!'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAnswers({});
                              setQuizSubmitted(false);
                            }}
                            className="px-3.5 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            Retake Quiz
                          </button>

                          {passed && !isLastLessonOfLevel && nextLesson && (
                            <button
                              type="button"
                              onClick={() => onSelectLesson(nextLesson.id)}
                              className="px-4 py-2 bg-slate-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Next Lesson</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}

                          {passed && isLastLessonOfLevel && onOpenLevelExam && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenLevelExam(currentLesson.levelNumber)
                              }
                              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <span>
                                Take Level {currentLesson.levelNumber} General Quiz
                              </span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}
              </form>
            )}

            {/* Recent Attempts for this Module Quiz */}
            {quizAttempts.filter((att) => att.quizId === currentLesson.quiz?.id)
              .length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  Your Recent Attempts on This Module Quiz:
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  {quizAttempts
                    .filter((att) => att.quizId === currentLesson.quiz?.id)
                    .slice(0, 3)
                    .map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <span className="font-sans font-medium text-slate-800">
                          {att.lessonTitle} ({att.attemptedAt})
                        </span>
                        <span
                          className={
                            att.passed
                              ? 'text-emerald-800 font-bold'
                              : 'text-amber-800 font-semibold'
                          }
                        >
                          Score: {att.scorePercent}% ({att.correctCount}/
                          {att.totalQuestions}) ·{' '}
                          {att.passed ? 'PASSED ✓' : 'RETRY'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Module Completion Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-600">
                {isCompleted
                  ? '✓ Module quiz passed and lesson completed! You can retake the quiz anytime or proceed to the next module.'
                  : 'You must pass the module quiz above (unlimited retakes) to complete this lesson and unlock the next module.'}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {isCompleted ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAnswers({});
                        setQuizSubmitted(false);
                        setQuizRequirementNotice(null);
                      }}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </button>
                    <span className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-800 text-white flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Module Lesson Completed ✓</span>
                    </span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={scrollToModuleQuizWithPrompt}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-800" />
                    <span>Pass Quiz Above to Complete Lesson</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* END OF LEVEL GENERAL QUIZ BANNER (SHOWN ONLY AT THE END OF THE LEVEL) */}
          {onOpenLevelExam &&
            isLastLessonOfLevel &&
            (() => {
              const currLvlObj = levels.find(
                (l) => l.levelNumber === currentLesson.levelNumber
              );
              const currLvlLessons =
                currLvlObj?.modules.flatMap((m) => m.lessons) || [];
              const currLvlDoneCount = currLvlLessons.filter((l) =>
                completedLessonIds.includes(l.id)
              ).length;
              const currLvlTotalCount = currLvlLessons.length;
              const allCurrLvlLessonsDone =
                currLvlTotalCount > 0 && currLvlDoneCount >= currLvlTotalCount;
              const prevLvlExamPassed =
                currentLesson.levelNumber === 1 ||
                Boolean(
                  getPassedLevelExamAttempt(currentLesson.levelNumber - 1)
                );
              const canTakeCurrLvlExam =
                isInstructorUser ||
                Boolean(currentLevelExamPassedAttempt) ||
                (prevLvlExamPassed && allCurrLvlLessonsDone);

              return (
                <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 font-mono text-[10px] font-bold uppercase">
                        End of Level {currentLesson.levelNumber} Final Exam
                      </span>
                      {currentLevelExamPassedAttempt ? (
                        <span className="text-xs font-mono text-emerald-400 font-bold">
                          ✓ Passed ({currentLevelExamPassedAttempt.scorePercent}
                          %) ·{' '}
                          {currentLesson.levelNumber < 6
                            ? `Level ${currentLesson.levelNumber + 1} Unlocked`
                            : 'Master Level Completed'}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-amber-300">
                          {currLvlDoneCount}/{currLvlTotalCount} Modules Completed · 70% to Pass
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      {currentLesson.levelNumber < 6
                        ? `Pass the Level ${currentLesson.levelNumber} Final Exam to Move to Level ${currentLesson.levelNumber + 1}`
                        : 'Take the Final Level 6 Exam to Unlock Final Projects'}
                    </h4>
                    <p className="text-xs text-slate-300">
                      {canTakeCurrLvlExam
                        ? `All modules in Level ${currentLesson.levelNumber} are complete! Take the final exam covering Level ${currentLesson.levelNumber} to advance.`
                        : `Complete all ${currLvlTotalCount} module lessons in Level ${currentLesson.levelNumber} (${currLvlDoneCount}/${currLvlTotalCount} completed) to unlock this Level Final Exam.`}
                    </p>
                  </div>

                  {canTakeCurrLvlExam ? (
                    <button
                      type="button"
                      onClick={() => onOpenLevelExam(currentLesson.levelNumber)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>
                        {currentLevelExamPassedAttempt
                          ? `Retake Level ${currentLesson.levelNumber} Final Exam`
                          : `Take Level ${currentLesson.levelNumber} Final Exam`}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="px-5 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold rounded-lg shrink-0 flex items-center gap-2 cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>
                        Locked · Complete This Lesson Quiz First ({currLvlDoneCount}/{currLvlTotalCount})
                      </span>
                    </button>
                  )}
                </div>
              );
            })()}

          {/* PREVIOUS / NEXT LESSON CONTROLS */}
          <div className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
            <button
              type="button"
              disabled={!prevLesson}
              onClick={() => prevLesson && onSelectLesson(prevLesson.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                prevLesson
                  ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Lesson
            </button>

            <div className="text-xs font-mono text-slate-500 tabular-nums text-center">
              Lesson {currentIdx + 1} of {allLessons.length}
            </div>

            {!isCompleted && !isInstructorUser ? (
              <button
                type="button"
                onClick={scrollToModuleQuizWithPrompt}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Pass Module Quiz to Unlock Next Lesson</span>
              </button>
            ) : nextLesson &&
              nextLesson.levelNumber > currentLesson.levelNumber &&
              !currentLevelExamPassedAttempt &&
              !isInstructorUser &&
              onOpenLevelExam ? (
              <button
                type="button"
                onClick={() => onOpenLevelExam(currentLesson.levelNumber)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>
                  Take Level {currentLesson.levelNumber} Final Exam to Unlock
                  Level {nextLesson.levelNumber}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!nextLesson}
                onClick={() => nextLesson && onSelectLesson(nextLesson.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                  nextLesson
                    ? 'bg-slate-900 text-white hover:bg-emerald-800 cursor-pointer'
                    : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
              >
                Next Lesson
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
