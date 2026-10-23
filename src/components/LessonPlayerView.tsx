import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Download,
  Play,
  BookOpen,
  FileSpreadsheet,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  Video,
  FileCheck2,
  Copy,
  CheckCheck,
  TableProperties,
  Lightbulb,
  FileText,
  FileCode2,
  Eye,
  MessageSquare,
  MessageCircle,
  Terminal,
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
import { downloadDemoCsvFile } from '../utils/downloadCsv';
import {
  downloadStarterWorkbook,
  downloadSolutionWorkbook,
  getLessonWorkbookOverview,
} from '../utils/excelWorkbookGenerator';
import {
  fetchAuthorizedLessonVideo,
  fetchStudentLessonRecommendations,
  SupabaseBackendStatus,
} from '../services/academyService';
import { LessonQnAView } from './LessonQnAView';

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
  onOpenInPlayground?: (formula: string) => void;
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

function buildPracticalTasksForBeginner(lesson: Lesson): string[] {
  const cleanTitle = lesson.title
    .replace(/:\s*Core Concepts & Walkthrough/gi, '')
    .replace(/:\s*Hands-On Business Lab/gi, '')
    .replace(/:\s*Applied Spreadsheet Lab/gi, '')
    .replace(/^Project\s*\d+:\s*/i, '')
    .trim();
  const primaryFormula = lesson.keyFormulas[0] || '=SUM(B2:B10)';

  const tasks: string[] = [
    `Open Microsoft Excel (or download the practice file "${lesson.resource.fileName}" below) and look at how the columns (${lesson.demoSpreadsheetHeaders.slice(0, 3).join(', ')}) are organised.`,
    `Follow along with the video tutorial to practice ${cleanTitle.toLowerCase()} on a few sample rows at your own pace—pause and rewind whenever you need.`,
    `Try typing or inspecting the key formula or action shown in this lesson (${primaryFormula}) and notice how Excel updates the result automatically.`,
    `Task Check: ${lesson.resource.assignmentInstructions}`,
  ];

  if (lesson.quiz && lesson.quiz.questions.length > 0) {
    tasks.push(
      `Self-Question: ${lesson.quiz.questions[0].questionText} (Check your answer in the Lesson Quiz tab below!)`
    );
  }

  return tasks.slice(0, 5);
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
  onOpenInPlayground,
}) => {
  const [activeBottomTab, setActiveBottomTab] = useState<
    'overview' | 'practice' | 'quiz' | 'qna'
  >('overview');
  const [sidebarLevelNumber, setSidebarLevelNumber] = useState<number>(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [assignmentSelfChecked, setAssignmentSelfChecked] = useState<
    Record<string, boolean>
  >({});
  const [practicalTaskChecked, setPracticalTaskChecked] = useState<
    Record<string, boolean>
  >({});
  const [workbookPreviewMode, setWorkbookPreviewMode] = useState<
    'starter' | 'solution'
  >('starter');
  const [copiedFormulaText, setCopiedFormulaText] = useState<string | null>(null);
  const [activeCellKey, setActiveCellKey] = useState<string>('A2');
  const [exerciseStepsCompleted, setExerciseStepsCompleted] = useState<
    Record<string, boolean>
  >({});

  // Cached Approved Recommendations & Explicit Student Video State (A, B, C, D)
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [approvedRecs, setApprovedRecs] = useState<YoutubeVideoRecommendation[]>(
    []
  );
  const [studentRecState, setStudentRecState] =
    useState<StudentRecommendationState>('searching_or_awaiting_approval');
  const [candidateCount, setCandidateCount] = useState<number>(0);
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

  const loadRecommendationsForCurrentLesson = (retry = false) => {
    setLoadingRecs(true);
    setRecErrorMessage(null);
    fetchStudentLessonRecommendations(currentLesson.id, { retry })
      .then((recRes) => {
        setApprovedRecs(recRes.recommendations || []);
        setStudentRecState(recRes.studentState);
        setCandidateCount(recRes.candidateCount || 0);
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

  const isCompleted = completedLessonIds.includes(currentLesson.id);
  const overallPct = Math.round(
    (completedLessonIds.length / Math.max(1, allLessons.length)) * 100
  );

  const relatedLessons = allLessons
    .filter(
      (item) =>
        item.lesson.levelNumber === currentLesson.levelNumber &&
        item.lesson.id !== currentLesson.id
    )
    .slice(0, 3);

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

  const activeRec: YoutubeVideoRecommendation | null =
    approvedRecs[selectedRecIndex] || approvedRecs[0] || null;

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
  const beginnerTasks = buildPracticalTasksForBeginner(currentLesson);

  const handleCycleAlternativeTutorial = () => {
    if (approvedRecs.length <= 1) return;
    setSelectedRecIndex((prev) => (prev + 1) % approvedRecs.length);
    setIsPlayerOpen(true);
  };

  const workbookOverview = getLessonWorkbookOverview(currentLesson);

  const handleCopyFormula = (formulaText: string) => {
    try {
      navigator.clipboard.writeText(formulaText);
      setCopiedFormulaText(formulaText);
      setTimeout(() => {
        setCopiedFormulaText((prev) => (prev === formulaText ? null : prev));
      }, 2500);
    } catch {
      setCopiedFormulaText(formulaText);
      setTimeout(() => setCopiedFormulaText(null), 2500);
    }
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
                      const isDone = completedLessonIds.includes(les.id);
                      const isInstructorUser = currentUser?.email?.toLowerCase() === 'okorotochukwu007@gmail.com';
                      const lesIdxInAll = allLessons.findIndex((item) => item.lesson.id === les.id);
                      const isLevelLocked = les.levelNumber > 1 && !isInstructorUser && localStorage.getItem('excel_academy_has_paid') !== 'true';
                      const isSeqLocked = !isInstructorUser && lesIdxInAll > 0 && !completedLessonIds.includes(allLessons[lesIdxInAll - 1]?.lesson.id);
                      const isLocked = isLevelLocked || isSeqLocked;

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
                onClick={() => onToggleCompleteLesson(currentLesson.id)}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                    : 'bg-slate-900 text-white hover:bg-emerald-800'
                }`}
              >
                <Check className="w-4 h-4" />
                {isCompleted ? 'Completed' : 'Mark as Complete'}
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

              {approvedRecs.length > 1 && (
                <button
                  type="button"
                  onClick={handleCycleAlternativeTutorial}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    View Another Recommended Tutorial ({selectedRecIndex + 1}/
                    {approvedRecs.length})
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
                        onClick={() => setIsPlayerOpen((prev) => !prev)}
                        className="px-3.5 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>
                          {isPlayerOpen ? 'Playing Above' : 'Watch in Academy'}
                        </span>
                      </button>

                      <a
                        href={`https://www.youtube.com/watch?v=${encodeURIComponent(
                          activeRec.videoId
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open on YouTube</span>
                      </a>
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
                  {approvedRecs.length > 1 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-semibold text-slate-700">
                        Want a different explanation style? Choose another approved tutorial for this lesson:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {approvedRecs.map((rec, idx) => {
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
                  <a
                    href={`https://www.youtube.com/watch?v=${encodeURIComponent(
                      activeYoutubeEmbedId
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open on YouTube</span>
                  </a>
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] font-mono text-slate-400">
                        Key Excel Formulas &amp; Actions Covered in This Lesson:
                      </div>
                      {onOpenInPlayground && currentLesson.keyFormulas.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenInPlayground(currentLesson.keyFormulas[0])
                          }
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Terminal className="w-3 h-3 text-emerald-200" />
                          <span>Test in Live Playground</span>
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentLesson.keyFormulas.map((formula) => (
                        <button
                          key={formula}
                          type="button"
                          onClick={() =>
                            onOpenInPlayground && onOpenInPlayground(formula)
                          }
                          className="text-xs font-mono text-emerald-300 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer text-left group"
                          title="Click to test this formula in the Formula Playground"
                        >
                          <span>{formula}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-emerald-300" />
                        </button>
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

          {/* 3. AFTER THE VIDEO: SIMPLE BEGINNER PRACTICE TASKS, KEY SUMMARY, PRACTICE FILE & COMPLETE BUTTON */}
          <section
            aria-label="After Watching Practice Checklist and Summary"
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
          >
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono font-semibold text-emerald-800 uppercase">
                  After You Watch · Beginner Practice &amp; Key Summary
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Try It Yourself in Excel ({beginnerTasks.length} Simple Steps)
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Complete at your own pace before marking this lesson finished
              </span>
            </div>

            {/* 3 to 5 Simple Practical Tasks / Questions */}
            <div className="space-y-2.5">
              {beginnerTasks.map((task, idx) => {
                const taskKey = `${currentLesson.id}-task-${idx}`;
                const checked = Boolean(practicalTaskChecked[taskKey]);
                return (
                  <label
                    key={taskKey}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-xs leading-relaxed cursor-pointer select-none transition-colors ${
                      checked
                        ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                        : 'bg-[#FAF9F5] border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setPracticalTaskChecked((prev) => ({
                          ...prev,
                          [taskKey]: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                    />
                    <span>
                      <strong className="font-mono text-slate-900">
                        Step {idx + 1}:
                      </strong>{' '}
                      {task}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Short Summary of Key Lesson */}
            <div className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <div className="font-bold text-slate-900">
                Short Summary of Key Lesson Takeaways:
              </div>
              <ul className="space-y-1.5 text-slate-700">
                {currentLesson.conceptSummary.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Link to Relevant Practice Files & Button to Mark Lesson as Completed */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadStarterWorkbook(currentLesson, currentEntry.levelTitle)
                  }
                  className="px-3.5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  title="Download starter Excel template with instructions and practice datasets"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Starter Workbook (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadSolutionWorkbook(currentLesson, currentEntry.levelTitle)
                  }
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  title="Download completed reference Excel workbook with live formulas in action"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>Solution Workbook (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadDemoCsvFile(
                      currentLesson.resource.fileName,
                      currentLesson.resource.sampleCsvContent
                    )
                  }
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Download lightweight CSV dataset"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>CSV</span>
                </button>

                {currentLesson.resource.downloadUrl && (
                  <a
                    href={currentLesson.resource.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>External URL</span>
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => onToggleCompleteLesson(currentLesson.id)}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                    : 'bg-slate-900 text-white hover:bg-emerald-800'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {isCompleted
                    ? 'Lesson Completed (Click to Undo)'
                    : 'Mark Lesson as Completed'}
                </span>
              </button>
            </div>
          </section>

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
          </div>

          {/* LESSON TABS: 1. OVERVIEW & SPREADSHEET DEMO | 2. PRACTICE MATERIALS & ASSIGNMENT | 3. LESSON QUIZ */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="border-b border-slate-200 px-6 pt-4 flex flex-wrap items-center gap-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveBottomTab('overview')}
                className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeBottomTab === 'overview'
                    ? 'border-emerald-700 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Lesson Notes &amp; Spreadsheet Example
              </button>

              <button
                type="button"
                onClick={() => setActiveBottomTab('practice')}
                className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeBottomTab === 'practice'
                    ? 'border-emerald-700 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Practice Workbook &amp; Assignment
              </button>

              <button
                type="button"
                onClick={() => setActiveBottomTab('quiz')}
                className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeBottomTab === 'quiz'
                    ? 'border-emerald-700 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Lesson Quiz &amp; Assessment (
                {currentLesson.quiz?.questions.length || 0} Questions)
              </button>

              <button
                type="button"
                onClick={() => setActiveBottomTab('qna')}
                className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeBottomTab === 'qna'
                    ? 'border-emerald-700 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                Lesson Q&amp;A &amp; Community Discussion
              </button>
            </div>

            <div className="p-6">
              {/* TAB 1: LESSON NOTES & INTERACTIVE SPREADSHEET TABLE */}
              {activeBottomTab === 'overview' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-900">
                      Core Learning Objectives
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                      {currentLesson.conceptSummary.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Genuine Excel Table Preview for this Lesson */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">
                        Demonstration Worksheet Preview (
                        {currentLesson.resource.fileName})
                      </span>
                      <span className="font-mono text-amber-800">
                        Demonstration Data
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                            <th className="py-2 px-2.5 border-r border-slate-200 text-center w-10">
                              Row
                            </th>
                            {currentLesson.demoSpreadsheetHeaders.map((hdr) => (
                              <th
                                key={hdr}
                                className="py-2 px-3 border-r border-slate-200 last:border-r-0 whitespace-nowrap"
                              >
                                {hdr}
                              </th>
                            ))}
                            <th className="py-2 px-3 bg-emerald-50 text-emerald-950 whitespace-nowrap">
                              Formula Note
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          {currentLesson.demoSpreadsheetRows.map((row) => (
                            <tr key={row.rowNum} className="hover:bg-slate-50">
                              <td className="py-2 px-2.5 bg-slate-50 border-r border-slate-200 text-center text-slate-400">
                                {row.rowNum}
                              </td>
                              {row.cells.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`py-2 px-3 border-r border-slate-200 whitespace-nowrap ${
                                    typeof cell === 'number'
                                      ? 'text-right'
                                      : 'text-left'
                                  }`}
                                >
                                  {typeof cell === 'number'
                                    ? cell.toLocaleString()
                                    : cell}
                                </td>
                              ))}
                              <td className="py-2 px-3 bg-emerald-50/40 text-emerald-900 whitespace-nowrap">
                                {row.formulaNote || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Related Lessons */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-700">
                      Related Lessons in Level {currentLesson.levelNumber}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {relatedLessons.map((rel) => (
                        <button
                          key={rel.lesson.id}
                          type="button"
                          onClick={() => onSelectLesson(rel.lesson.id)}
                          className="p-3 bg-[#FAF9F5] border border-slate-200 rounded-lg text-left hover:border-slate-400 transition-colors space-y-1 cursor-pointer"
                        >
                          <div className="text-[11px] font-mono text-emerald-800">
                            {rel.lesson.durationMinutes} min
                          </div>
                          <div className="text-xs font-semibold text-slate-900 line-clamp-2">
                            {rel.lesson.title}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRACTICAL EXCEL EXERCISES & DOWNLOADABLE WORKBOOKS */}
              {activeBottomTab === 'practice' && (
                <div className="space-y-6">
                  {/* WORKBOOK DOWNLOAD HUB: DUAL STARTER & SOLUTION FILES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CARD 1: STARTER CHALLENGE WORKBOOK */}
                    <div className="bg-[#FAF9F5] border-2 border-emerald-600/40 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-emerald-700 transition-colors">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold uppercase tracking-wider">
                            Starter Challenge Workbook
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            .XLSX Format
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 font-mono">
                          {workbookOverview.starterFileName}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          The blank practice workbook to open in Microsoft Excel alongside this video tutorial. Includes an Instructions sheet, raw practice data, and blank formula entry columns for you to complete.
                        </p>
                        <ul className="space-y-1.5 text-xs text-slate-700 pt-1">
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>Sheet 1: Step-by-Step Beginner Instructions &amp; Pro Tips</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>Sheet 2: Practice Dataset with [Enter Formula Here] prompts</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>Formatted column layout ready for calculation</span>
                          </li>
                        </ul>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            downloadStarterWorkbook(currentLesson, currentEntry.levelTitle)
                          }
                          className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                          <span>Download Starter Workbook (.xlsx)</span>
                        </button>
                      </div>
                    </div>

                    {/* CARD 2: COMPLETED SOLUTION REFERENCE WORKBOOK */}
                    <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs border border-slate-800">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-[11px] font-bold uppercase tracking-wider">
                            Completed Solution Key
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Live Excel Formulas
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white font-mono">
                          {workbookOverview.solutionFileName}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          The master reference workbook with actual live Excel formulas in action. Click into any calculated cell in Excel to inspect the formula bar and verify your results.
                        </p>
                        <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>Sheet 1: Model Solution Key &amp; Analytical Rationale</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>Sheet 2: Live Working Formulas in cells (e.g. {currentLesson.keyFormulas[0] || '=SUM(...) '})</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>Sheet 3: Formula Reference, Syntax &amp; Common Pitfalls</span>
                          </li>
                        </ul>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            downloadSolutionWorkbook(currentLesson, currentEntry.levelTitle)
                          }
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <FileCheck2 className="w-4 h-4 text-white" />
                          <span>Download Solution Workbook (.xlsx)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ADDITIONAL UTILITY ROW */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                      Both workbooks are valid <strong>.XLSX</strong> spreadsheets compatible with Microsoft Excel (Desktop/365) and Google Sheets.
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          downloadDemoCsvFile(
                            currentLesson.resource.fileName,
                            currentLesson.resource.sampleCsvContent
                          )
                        }
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-slate-500" />
                        <span>Download Raw CSV Dataset</span>
                      </button>

                      {currentLesson.resource.downloadUrl && (
                        <a
                          href={currentLesson.resource.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                          <span>External Link</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* INTERACTIVE IN-APP SPREADSHEET & FORMULA INSPECTOR */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-0">
                    {/* Header Controls: Toggle between Starter and Solution view */}
                    <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-mono font-bold text-slate-900 uppercase">
                          Interactive In-App Spreadsheet Preview
                        </div>
                        <p className="text-xs text-slate-500">
                          Inspect the starter practice data or preview the completed solution before downloading
                        </p>
                      </div>

                      <div className="inline-flex p-1 bg-slate-200/80 rounded-lg text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setWorkbookPreviewMode('starter')}
                          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                            workbookPreviewMode === 'starter'
                              ? 'bg-white text-slate-900 font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Starter View (Practice Data)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkbookPreviewMode('solution')}
                          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                            workbookPreviewMode === 'solution'
                              ? 'bg-slate-900 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Solution View (Formulas in Action)</span>
                        </button>
                      </div>
                    </div>

                    {/* EXCEL FORMULA BAR (fx) */}
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-3 text-xs font-mono">
                      {/* Name Box */}
                      <div className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center text-slate-800 font-bold">
                        {activeCellKey || 'A2'}
                      </div>

                      {/* fx Icon */}
                      <div className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold italic select-none">
                        fx
                      </div>

                      {/* Formula Text Box */}
                      <div className="flex-1 px-3 py-1 bg-white border border-slate-300 rounded text-slate-800 truncate select-all flex items-center justify-between">
                        <span>
                          {workbookPreviewMode === 'solution'
                            ? currentLesson.keyFormulas[0] || '=SUM(...)'
                            : '[Click any cell below to inspect or copy formula]'}
                        </span>

                        {workbookPreviewMode === 'solution' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyFormula(currentLesson.keyFormulas[0] || '=SUM(...)')
                            }
                            className="ml-2 text-slate-500 hover:text-emerald-700 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Copy formula to clipboard"
                          >
                            {copiedFormulaText === (currentLesson.keyFormulas[0] || '=SUM(...)') ? (
                              <span className="text-emerald-700 font-sans text-[11px] font-semibold flex items-center gap-1">
                                <CheckCheck className="w-3 h-3" /> Copied!
                              </span>
                            ) : (
                              <span className="text-[11px] font-sans flex items-center gap-1">
                                <Copy className="w-3 h-3" /> Copy
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SPREADSHEET TABLE GRID */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                        <thead>
                          <tr className="bg-slate-200/70 text-slate-700 border-b border-slate-300">
                            <th className="py-2 px-2.5 border-r border-slate-300 text-center w-10 bg-slate-200">
                              #
                            </th>
                            {workbookOverview.headers.map((hdr, hIdx) => {
                              const colLetter = String.fromCharCode(65 + hIdx);
                              return (
                                <th
                                  key={hdr}
                                  className="py-2 px-3 border-r border-slate-300 last:border-r-0 whitespace-nowrap"
                                >
                                  <span className="text-[10px] text-slate-400 block font-normal">
                                    Col {colLetter}
                                  </span>
                                  {hdr}
                                </th>
                              );
                            })}
                            <th className="py-2 px-3 bg-emerald-50 text-emerald-950 whitespace-nowrap">
                              {workbookPreviewMode === 'solution'
                                ? 'Solution Formula'
                                : 'Challenge Prompt'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          {workbookPreviewMode === 'starter'
                            ? workbookOverview.starterRows.map((r, rIdx) => (
                                <tr key={r.rowNum} className="hover:bg-amber-50/40">
                                  <td className="py-2 px-2.5 bg-slate-100 border-r border-slate-300 text-center text-slate-500 font-bold">
                                    {r.rowNum}
                                  </td>
                                  {r.cells.map((cell, cIdx) => {
                                    const colLetter = String.fromCharCode(65 + cIdx);
                                    const cellCoord = `${colLetter}${r.rowNum}`;
                                    const isTargetCol = cIdx === r.cells.length - 1;
                                    return (
                                      <td
                                        key={cIdx}
                                        onClick={() => setActiveCellKey(cellCoord)}
                                        className={`py-2 px-3 border-r border-slate-200 whitespace-nowrap cursor-pointer transition-colors ${
                                          activeCellKey === cellCoord
                                            ? 'bg-amber-100 ring-2 ring-amber-400 ring-inset'
                                            : isTargetCol
                                            ? 'bg-amber-50/70 text-amber-900 font-medium'
                                            : typeof cell === 'number'
                                            ? 'text-right'
                                            : 'text-left'
                                        }`}
                                      >
                                        {typeof cell === 'number' ? cell.toLocaleString() : cell}
                                      </td>
                                    );
                                  })}
                                  <td className="py-2 px-3 bg-amber-50/40 text-amber-800 text-[11px] whitespace-nowrap">
                                    {r.targetCellNote || 'Fill with formula'}
                                  </td>
                                </tr>
                              ))
                            : workbookOverview.solutionRows.map((r, rIdx) => (
                                <tr key={r.rowNum} className="hover:bg-emerald-50/40">
                                  <td className="py-2 px-2.5 bg-slate-100 border-r border-slate-300 text-center text-slate-500 font-bold">
                                    {r.rowNum}
                                  </td>
                                  {r.cells.map((cell, cIdx) => {
                                    const colLetter = String.fromCharCode(65 + cIdx);
                                    const cellCoord = `${colLetter}${r.rowNum}`;
                                    const isFormulaCol = cIdx === r.cells.length - 1;
                                    return (
                                      <td
                                        key={cIdx}
                                        onClick={() => setActiveCellKey(cellCoord)}
                                        className={`py-2 px-3 border-r border-slate-200 whitespace-nowrap cursor-pointer transition-colors ${
                                          activeCellKey === cellCoord
                                            ? 'bg-emerald-100 ring-2 ring-emerald-500 ring-inset'
                                            : isFormulaCol
                                            ? 'bg-emerald-50/80 font-bold text-emerald-950'
                                            : typeof cell === 'number'
                                            ? 'text-right'
                                            : 'text-left'
                                        }`}
                                      >
                                        {typeof cell === 'number' ? cell.toLocaleString() : cell}
                                      </td>
                                    );
                                  })}
                                  <td className="py-2 px-3 bg-emerald-50/60 text-emerald-900 text-[11px] font-mono whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100/90 text-emerald-900 border border-emerald-300">
                                      fx: {r.formula}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* STEP-BY-STEP CHALLENGE CHECKLIST */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <div className="text-xs font-mono font-bold text-emerald-800 uppercase">
                          Practice Checklist for Beginners
                        </div>
                        <h4 className="text-base font-bold text-slate-900">
                          Complete These Steps Directly in Microsoft Excel
                        </h4>
                      </div>
                      <span className="text-xs text-slate-500">
                        Check each step off as you practice alongside the tutorial
                      </span>
                    </div>

                    <div className="space-y-3">
                      {workbookOverview.steps.map((step) => {
                        const stepKey = `${currentLesson.id}-wkstep-${step.id}`;
                        const isDone = Boolean(exerciseStepsCompleted[stepKey]);
                        return (
                          <div
                            key={step.id}
                            className={`p-3.5 rounded-lg border text-xs transition-colors ${
                              isDone
                                ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                                : 'bg-[#FAF9F5] border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                id={stepKey}
                                checked={isDone}
                                onChange={(e) =>
                                  setExerciseStepsCompleted((prev) => ({
                                    ...prev,
                                    [stepKey]: e.target.checked,
                                  }))
                                }
                                className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                              />
                              <div className="space-y-1.5 flex-1">
                                <label
                                  htmlFor={stepKey}
                                  className="font-bold text-slate-900 block cursor-pointer select-none"
                                >
                                  Step {step.stepNumber}: {step.title}
                                </label>
                                <p className="text-slate-600 leading-relaxed">
                                  {step.instruction}
                                </p>

                                {step.formulaHint && (
                                  <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <span className="text-[11px] font-semibold text-slate-600">
                                      Formula:
                                    </span>
                                    <code className="px-2 py-0.5 rounded bg-slate-900 text-emerald-300 font-mono text-[11px]">
                                      {step.formulaHint}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyFormula(step.formulaHint!)}
                                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[10px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      {copiedFormulaText === step.formulaHint ? (
                                        <>
                                          <CheckCheck className="w-3 h-3 text-emerald-700" />
                                          <span className="text-emerald-700">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy Formula</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}

                                {step.expectedResult && (
                                  <div className="text-[11px] text-slate-500 pt-0.5">
                                    Expected: <em>{step.expectedResult}</em>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ASSIGNMENT INSTRUCTIONS & EXPECTED OUTCOME */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
                      <div className="font-bold text-slate-900">
                        Lesson Assignment Brief
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {currentLesson.resource.assignmentInstructions}
                      </p>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
                      <div className="font-bold text-slate-900">
                        Reconciliation &amp; Expected Outcome
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {currentLesson.resource.expectedOutcome}
                      </p>
                    </div>
                  </div>

                  {/* SELF-CHECK EXERCISE VERIFICATION */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-4">
                    <label className="flex items-center gap-3 text-xs font-medium text-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!assignmentSelfChecked[currentLesson.id]}
                        onChange={(e) =>
                          setAssignmentSelfChecked((prev) => ({
                            ...prev,
                            [currentLesson.id]: e.target.checked,
                          }))
                        }
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                      />
                      <span>
                        I have downloaded the starter workbook, practiced the formulas in Microsoft Excel, and verified my totals against the Solution Workbook.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 3: LESSON QUIZ & ASSESSMENT */}
              {activeBottomTab === 'quiz' && currentLesson.quiz && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {currentLesson.quiz.title}
                      </h3>
                      <p className="text-xs text-slate-600">
                        Passing threshold:{' '}
                        {currentLesson.quiz.passingScorePercent}% · Select the
                        best answer for each Excel scenario below.
                      </p>
                    </div>
                    {quizSubmitted && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAnswers({});
                          setQuizSubmitted(false);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleQuizSubmit} className="space-y-6">
                    {currentLesson.quiz.questions.map((q, qIndex) => {
                      const chosenIdx = selectedAnswers[q.id];
                      const isCorrect = chosenIdx === q.correctOptionIndex;

                      return (
                        <div
                          key={q.id}
                          className="p-5 bg-[#FAF9F5] border border-slate-200 rounded-xl space-y-3"
                        >
                          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                            <span>Question 0{qIndex + 1}</span>
                            {q.formulaContext && (
                              <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-emerald-900">
                                {q.formulaContext}
                              </code>
                            )}
                          </div>

                          <div className="text-sm font-semibold text-slate-900">
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
                                    'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold';
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
                                  className={`flex items-center gap-3 p-3 border rounded-lg text-xs cursor-pointer transition-colors ${optionStyle}`}
                                >
                                  <input
                                    type="radio"
                                    name={q.id}
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
                                  <span className="font-mono text-xs opacity-75">
                                    {String.fromCharCode(65 + oIndex)}.
                                  </span>
                                  <span>{opt}</span>
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
                                {isCorrect ? '✓ Correct: ' : 'Explanation: '}
                              </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {!quizSubmitted && (
                      <button
                        type="submit"
                        disabled={
                          Object.keys(selectedAnswers).length <
                          currentLesson.quiz.questions.length
                        }
                        className="px-6 py-3 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        Submit Quiz Answers
                      </button>
                    )}
                  </form>

                  {/* Recent Attempts for this Quiz */}
                  {quizAttempts.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      <div className="text-xs font-semibold text-slate-800">
                        Quiz Attempt History:
                      </div>
                      <div className="space-y-1.5 text-xs font-mono">
                        {quizAttempts.slice(0, 4).map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded"
                          >
                            <span className="font-sans font-medium text-slate-800">
                              {att.lessonTitle}
                            </span>
                            <span>
                              Score: {att.scorePercent}% ({att.correctCount}/
                              {att.totalQuestions}) ·{' '}
                              {att.passed ? 'PASSED' : 'REVIEW'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LESSON Q&A & COMMUNITY DISCUSSION */}
              {activeBottomTab === 'qna' && (
                <LessonQnAView
                  lessonId={currentLesson.id}
                  lessonTitle={currentLesson.title}
                  primaryFormula={currentLesson.keyFormulas[0] || '=SUM(B2:B10)'}
                  currentUser={currentUser || undefined}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
