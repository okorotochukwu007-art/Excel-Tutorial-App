import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Lock,
  LogOut,
  Play,
  Sparkles,
  User,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';
import {
  Course,
  CurriculumLevel,
  Lesson,
  LevelCertificate,
  Profile,
  ProjectSubmissionState,
  QuizAttempt,
} from '../types/academy';
import {
  downloadLevelCertificatePdf,
  getCertificateDataForLevel,
} from '../utils/pdfCertificateGenerator';
import { CertificatePreviewModal } from './CertificatePreviewModal';
import { CapstonePortfolioView } from './CapstonePortfolioView';
import { CAPSTONE_PROJECTS } from '../data/capstoneProjectsData';

interface StudentDashboardViewProps {
  student: Profile;
  course: Course;
  levels: CurriculumLevel[];
  completedLessonIds: string[];
  recentlyViewedLessonId: string | null;
  quizAttempts: QuizAttempt[];
  projectSubmissions: Record<string, ProjectSubmissionState>;
  onToggleProjectChecklist: (projectId: string, itemIdx: number) => void;
  onStartLesson: (lessonId: string) => void;
  onUpdateStudentName: (newName: string) => void;
  onResetDemoProgress: () => void;
  onRecordQuizAttempt?: (attempt: QuizAttempt) => void;
  onLogoutDemo?: () => void;
  onSubmitCapstoneProject?: (
    projectId: string,
    score: number,
    notes: string
  ) => void;
  onOpenLevelExam?: (levelNumber: number) => void;
  onNavigateToProjects?: () => void;
}

type SimpleLearningTab = 'progress' | 'projects' | 'certificates';

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  student,
  levels,
  completedLessonIds,
  recentlyViewedLessonId,
  quizAttempts,
  projectSubmissions,
  onStartLesson,
  onUpdateStudentName,
  onLogoutDemo,
  onSubmitCapstoneProject,
  onOpenLevelExam,
  onNavigateToProjects,
}) => {
  const [activeTab, setActiveTab] = useState<SimpleLearningTab>('progress');
  const [nameInput, setNameInput] = useState(student.fullName);
  const [editingName, setEditingName] = useState(false);
  const [previewCertificate, setPreviewCertificate] =
    useState<LevelCertificate | null>(null);

  const isInstructor =
    student.email?.toLowerCase() === 'okorotochukwu007@gmail.com' ||
    student.role === 'admin';

  // 1. Calculate Module & Lesson Completion
  const allLessons: Lesson[] = [];
  levels.forEach((lvl) => {
    lvl.modules.forEach((mod) => {
      mod.lessons
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .forEach((les) => allLessons.push(les));
    });
  });

  const totalLessonsCount = allLessons.length;
  const completedLessonsCount = allLessons.filter((l) =>
    completedLessonIds.includes(l.id)
  ).length;
  const lessonProgressPercent =
    totalLessonsCount > 0
      ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
      : 0;
  const allModulesCompleted =
    totalLessonsCount > 0 && completedLessonsCount >= totalLessonsCount;

  // 2. Calculate Level Final Exams Passed (Levels 1 to 6)
  const getLevelExamStatus = (levelNum: number) => {
    const attempts = quizAttempts.filter(
      (a) => a.quizId === `exam-lvl-${levelNum}`
    );
    const passedAttempt = attempts.find((a) => a.passed);
    const bestScore =
      attempts.length > 0
        ? Math.max(...attempts.map((a) => a.scorePercent))
        : undefined;
    return {
      passed: Boolean(passedAttempt),
      bestScore,
      attemptsCount: attempts.length,
    };
  };

  // Check if all previous levels (1 .. levelNum - 1) have both all lessons completed AND level exams passed
  const areAllPreviousLevelsCompletedAndPassed = (levelNum: number): boolean => {
    if (isInstructor) return true;
    for (let prev = 1; prev < levelNum; prev++) {
      const prevLvl = levels.find((l) => l.levelNumber === prev);
      if (prevLvl) {
        const prevLessons = prevLvl.modules.flatMap((m) => m.lessons);
        const allPrevLessonsDone = prevLessons.every((l) =>
          completedLessonIds.includes(l.id)
        );
        if (!allPrevLessonsDone) return false;
      }
      if (!getLevelExamStatus(prev).passed) {
        return false;
      }
    }
    return true;
  };

  const totalExamsCount = levels.length; // 6 levels
  const passedExamsCount = levels.filter(
    (lvl) => getLevelExamStatus(lvl.levelNumber).passed
  ).length;
  const allExamsPassed = passedExamsCount >= totalExamsCount;

  // 3. Calculate Real-Life Projects Submitted to Instructor (4 projects)
  const totalProjectsCount = CAPSTONE_PROJECTS.length; // 4 realistic projects
  const submittedProjectsCount = CAPSTONE_PROJECTS.filter(
    (proj) => projectSubmissions[proj.id]?.status === 'completed_local'
  ).length;
  const allProjectsSubmitted = submittedProjectsCount >= totalProjectsCount;

  // STRICT CERTIFICATE UNLOCK CONDITION:
  // Student must have completed ALL modules, passed ALL exams, and submitted ALL 4 projects to the instructor
  const isCertificateUnlocked =
    allModulesCompleted && allExamsPassed && allProjectsSubmitted;

  // Determine next lesson to resume
  const nextRecommendedLesson =
    allLessons.find((l) => !completedLessonIds.includes(l.id)) ||
    allLessons.find((l) => l.id === recentlyViewedLessonId) ||
    allLessons[0];

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onUpdateStudentName(nameInput.trim());
    setEditingName(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* TOP STUDENT SUMMARY BANNER */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>MY LEARNING DASHBOARD</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome, {student.fullName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Complete each module lesson and quiz in order to unlock that
                level&apos;s Final Exam. Pass all 6 Level Final Exams to unlock
                the 4 Final Projects on the Project page, then download your
                official Certificate.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
              {onNavigateToProjects && (
                <button
                  type="button"
                  onClick={onNavigateToProjects}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Go to Project Page</span>
                </button>
              )}
              {onLogoutDemo && (
                <button
                  type="button"
                  onClick={onLogoutDemo}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-200 hover:text-rose-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>

          {/* 3 SIMPLE COMPLETION PILLARS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
            {/* Pillar 1: Modules & Lessons */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400">
                  1. Course Modules &amp; Lessons
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {completedLessonsCount} / {totalLessonsCount} Completed
                </div>
                <div className="text-xs text-emerald-400 font-mono mt-0.5">
                  {lessonProgressPercent}% Progress
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  allModulesCompleted
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            {/* Pillar 2: Level Exams */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400">
                  2. Level Final Exams Passed
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {passedExamsCount} / {totalExamsCount} Passed
                </div>
                <div className="text-xs text-emerald-400 font-mono mt-0.5">
                  {allExamsPassed
                    ? 'All 6 Exams Passed'
                    : `${totalExamsCount - passedExamsCount} Exam(s) Remaining`}
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  allExamsPassed
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <FileCheck2 className="w-5 h-5" />
              </div>
            </div>

            {/* Pillar 3: Real-Life Projects */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400">
                  3. Final Projects (Unlock at Level 6)
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {submittedProjectsCount} / {totalProjectsCount} Submitted
                </div>
                <div className="text-xs text-emerald-400 font-mono mt-0.5">
                  {allProjectsSubmitted
                    ? 'Sent to Instructor'
                    : allModulesCompleted && allExamsPassed
                    ? 'Unlocked — Ready to Submit'
                    : 'Locked Until All 6 Levels Done'}
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  allProjectsSubmitted
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* SIMPLE 3-TAB NAVIGATION BAR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>
              1. My Learning Progress ({completedLessonsCount}/{totalLessonsCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {allModulesCompleted && allExamsPassed ? (
              <Briefcase className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>
              2. Final Practice Projects ({submittedProjectsCount}/4 Submitted)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('certificates')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'certificates'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isCertificateUnlocked ? (
              <Award className="w-4 h-4 text-amber-300" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>
              3. Download Certificate{' '}
              {isCertificateUnlocked ? '(Unlocked)' : '(Locked)'}
            </span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: STUDENT LEARNING PROGRESS (MODULES & EXAMS)        */}
        {/* ========================================================= */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Resume Next Lesson Card */}
            {nextRecommendedLesson && (
              <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-800">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>
                      Continue Learning · Level {nextRecommendedLesson.levelNumber}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    {nextRecommendedLesson.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                    {nextRecommendedLesson.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onStartLesson(nextRecommendedLesson.id)}
                  className="px-6 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Video Lesson &amp; Quiz</span>
                </button>
              </div>
            )}

            {/* Levels & Modules Progress List */}
            <div className="space-y-5">
              {levels.map((lvl) => {
                const lvlLessons = lvl.modules.flatMap((m) => m.lessons);
                const lvlCompletedCount = lvlLessons.filter((l) =>
                  completedLessonIds.includes(l.id)
                ).length;
                const lvlTotalCount = lvlLessons.length;
                const lvlPct =
                  lvlTotalCount > 0
                    ? Math.round((lvlCompletedCount / lvlTotalCount) * 100)
                    : 0;
                const allLevelLessonsDone =
                  lvlTotalCount > 0 && lvlCompletedCount >= lvlTotalCount;
                const examStatus = getLevelExamStatus(lvl.levelNumber);

                // Check if previous levels (1 .. lvl.levelNumber - 1) are completed and their exams passed
                const prevLevelsUnlocked =
                  areAllPreviousLevelsCompletedAndPassed(lvl.levelNumber);

                // The Level Final Exam is ONLY unlocked when:
                // 1) All previous levels & their exams are passed, AND
                // 2) All modules/lessons in THIS level are 100% completed (or exam was already passed / instructor)
                const isLevelExamUnlocked =
                  isInstructor ||
                  examStatus.passed ||
                  (prevLevelsUnlocked && allLevelLessonsDone);

                return (
                  <div
                    key={lvl.levelNumber}
                    className={`bg-white border rounded-2xl shadow-xs overflow-hidden ${
                      !prevLevelsUnlocked
                        ? 'border-slate-200 opacity-90'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Level Header */}
                    <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-xs font-mono font-bold">
                            Level {lvl.levelNumber}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">
                            {lvl.title}
                          </h3>
                          {!prevLevelsUnlocked && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-mono font-bold">
                              <Lock className="w-3 h-3" />
                              Pass Level {lvl.levelNumber - 1} Exam to Unlock
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {lvl.shortDescription}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-slate-800">
                            {lvlCompletedCount} / {lvlTotalCount} Lessons (
                            {lvlPct}%)
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {examStatus.passed
                              ? `Level Exam Passed (${examStatus.bestScore}%)`
                              : isLevelExamUnlocked
                              ? 'Level Exam Unlocked'
                              : 'Level Exam Locked'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modules & Lessons inside this Level */}
                    <div className="divide-y divide-slate-100">
                      {lvl.modules.map((mod) => (
                        <div key={mod.id} className="p-5 space-y-3">
                          <div className="text-xs font-mono font-bold uppercase text-slate-500">
                            Module {mod.orderIndex}: {mod.title}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {mod.lessons.map((les) => {
                              const isDone = completedLessonIds.includes(
                                les.id
                              );
                              const globalIdx = allLessons.findIndex(
                                (item) => item.id === les.id
                              );
                              const isSeqLocked =
                                !isInstructor &&
                                globalIdx > 0 &&
                                !completedLessonIds.includes(
                                  allLessons[globalIdx - 1].id
                                );
                              const isLessonLocked =
                                !isDone &&
                                (!prevLevelsUnlocked || isSeqLocked);

                              return (
                                <button
                                  key={les.id}
                                  type="button"
                                  onClick={() => onStartLesson(les.id)}
                                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                    isDone
                                      ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50'
                                      : isLessonLocked
                                      ? 'bg-slate-50/80 border-slate-200 text-slate-500 hover:bg-slate-100'
                                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {isDone ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                    ) : isLessonLocked ? (
                                      <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                                    ) : (
                                      <Play className="w-4 h-4 text-emerald-700 shrink-0" />
                                    )}
                                    <div className="truncate">
                                      <div className="text-xs font-semibold text-slate-900 truncate">
                                        {les.title}
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {les.durationMinutes}m
                                        </span>
                                        <span>·</span>
                                        <span>
                                          {isDone
                                            ? 'Completed ✓'
                                            : !prevLevelsUnlocked
                                            ? `Pass Level ${lvl.levelNumber - 1} Exam First`
                                            : isSeqLocked
                                            ? 'Complete Previous Lesson First'
                                            : 'Start Lesson'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* End-of-Level Final Exam Bar — STRICTLY LOCKED UNTIL MODULES & PREVIOUS EXAMS ARE DONE */}
                    <div
                      className={`px-5 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        examStatus.passed
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : isLevelExamUnlocked
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-amber-50/60 border-amber-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {examStatus.passed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                        ) : isLevelExamUnlocked ? (
                          <FileCheck2 className="w-5 h-5 text-emerald-700 shrink-0" />
                        ) : (
                          <Lock className="w-5 h-5 text-amber-800 shrink-0" />
                        )}
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Level {lvl.levelNumber} Final Exam:{' '}
                            {examStatus.passed
                              ? `Passed (Best Score: ${examStatus.bestScore}%)`
                              : isLevelExamUnlocked
                              ? 'Unlocked — Ready to Take Exam'
                              : 'Locked — Complete Prerequisites First'}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {!prevLevelsUnlocked
                              ? `Locked: You must complete Level ${lvl.levelNumber - 1} and pass the Level ${lvl.levelNumber - 1} Final Exam first.`
                              : !allLevelLessonsDone
                              ? `Locked: Complete all ${lvlTotalCount} lessons in Level ${lvl.levelNumber} (${lvlCompletedCount}/${lvlTotalCount} completed) before taking the Level ${lvl.levelNumber} Final Exam.`
                              : examStatus.passed
                              ? `You have passed the Level ${lvl.levelNumber} Final Exam and unlocked the next stage.`
                              : `All modules in Level ${lvl.levelNumber} are complete! Pass this exam (70%+) to unlock the next level.`}
                          </div>
                        </div>
                      </div>

                      {onOpenLevelExam && (
                        isLevelExamUnlocked ? (
                          <button
                            type="button"
                            onClick={() => onOpenLevelExam(lvl.levelNumber)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors flex items-center gap-1.5 ${
                              examStatus.passed
                                ? 'bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                                : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                            }`}
                          >
                            <Award className="w-4 h-4" />
                            <span>
                              {examStatus.passed
                                ? `Retake Level ${lvl.levelNumber} Exam`
                                : `Take Level ${lvl.levelNumber} Final Exam`}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-500 border border-slate-300 shrink-0 cursor-not-allowed flex items-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>
                              {!prevLevelsUnlocked
                                ? `Locked · Pass Level ${lvl.levelNumber - 1} Exam First`
                                : `Locked · Complete Modules (${lvlCompletedCount}/${lvlTotalCount})`}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 4 REAL-LIFE PRACTICE PROJECTS (GATED BY 6 LEVELS)  */}
        {/* ========================================================= */}
        {activeTab === 'projects' && (
          <CapstonePortfolioView
            studentName={student.fullName}
            studentEmail={student.email}
            projectSubmissions={projectSubmissions}
            levels={levels}
            completedLessonIds={completedLessonIds}
            quizAttempts={quizAttempts}
            isInstructor={isInstructor}
            isAuthenticated={true}
            onUpdateStudentName={onUpdateStudentName}
            onNavigateToLearning={() => setActiveTab('progress')}
            onSubmitCapstoneProject={(projectId, score, notes) => {
              if (onSubmitCapstoneProject) {
                onSubmitCapstoneProject(projectId, score, notes);
              }
            }}
          />
        )}

        {/* ========================================================= */}
        {/* TAB 3: DOWNLOAD CERTIFICATE (STRICT 3-REQUIREMENT GATE)   */}
        {/* ========================================================= */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            {/* Certificate Requirements Checklist Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-800">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span>OFFICIAL ACADEMY CERTIFICATE VERIFICATION</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Your Certificate of Mastery
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                    Before any certificate can be exported, you must complete
                    all course modules, pass all 6 level exams, and submit all 4
                    real-life projects to your instructor.
                  </p>
                </div>

                {/* Certificate Name Editor */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shrink-0">
                  <div className="text-[10px] font-mono uppercase text-slate-500">
                    Name Printed on Certificate
                  </div>
                  {!editingName ? (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-bold text-slate-900">
                        {student.fullName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setNameInput(student.fullName);
                          setEditingName(true);
                        }}
                        className="text-xs text-emerald-800 font-semibold hover:underline cursor-pointer"
                      >
                        Edit Name
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSaveName}
                      className="flex items-center gap-2 mt-1"
                    >
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-emerald-800 text-white text-xs font-bold rounded cursor-pointer"
                      >
                        Save
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* 3 MANDATORY REQUIREMENTS CHECKLIST */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Requirement 1: All Modules Completed */}
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    allModulesCompleted
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-slate-600">
                      Requirement 1 of 3
                    </span>
                    {allModulesCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-800 text-white text-[10px] font-mono font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
                        In Progress
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Complete All Modules &amp; Lessons
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {completedLessonsCount} of {totalLessonsCount} lessons
                      completed ({lessonProgressPercent}%)
                    </p>
                  </div>
                  {!allModulesCompleted && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('progress')}
                      className="w-full py-2 px-3 bg-white border border-slate-300 hover:border-emerald-600 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Go to Modules &rarr;
                    </button>
                  )}
                </div>

                {/* Requirement 2: All 6 Level Exams Passed */}
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    allExamsPassed
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-slate-600">
                      Requirement 2 of 3
                    </span>
                    {allExamsPassed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-800 text-white text-[10px] font-mono font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
                        In Progress
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Pass All 6 Level Final Exams
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {passedExamsCount} of {totalExamsCount} level exams passed
                      (70%+ required)
                    </p>
                  </div>
                  {!allExamsPassed && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('progress')}
                      className="w-full py-2 px-3 bg-white border border-slate-300 hover:border-emerald-600 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Take Remaining Exams &rarr;
                    </button>
                  )}
                </div>

                {/* Requirement 3: All 4 Real-Life Projects Submitted */}
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    allProjectsSubmitted
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-slate-600">
                      Requirement 3 of 3
                    </span>
                    {allProjectsSubmitted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-800 text-white text-[10px] font-mono font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
                        Action Needed
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Submit All 4 Projects to Instructor
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {submittedProjectsCount} of {totalProjectsCount} real-life
                      projects submitted
                    </p>
                  </div>
                  {!allProjectsSubmitted && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('projects')}
                      className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      View Projects &rarr;
                    </button>
                  )}
                </div>
              </div>

              {/* CERTIFICATE EXPORT / LOCK CALLOUT */}
              {isCertificateUnlocked ? (
                <div className="p-6 rounded-2xl bg-emerald-950 text-white border-2 border-emerald-600 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-800 text-emerald-200 text-xs font-mono font-bold uppercase">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>All Requirements Completed · Certificate Unlocked!</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Certified Excel Data Analyst Diploma — {student.fullName}
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                      Congratulations! You have completed all {totalLessonsCount}{' '}
                      lessons, passed all {totalExamsCount} level exams, and
                      submitted all {totalProjectsCount} real-life projects to
                      Instructor Okoro Tochuwku. You can now export your
                      official PDF certificate.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const masterCert = getCertificateDataForLevel(
                          'all',
                          student.fullName,
                          student.email,
                          95
                        );
                        setPreviewCertificate(masterCert);
                      }}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>Preview Certificate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const masterCert = getCertificateDataForLevel(
                          'all',
                          student.fullName,
                          student.email,
                          95
                        );
                        downloadLevelCertificatePdf(masterCert);
                      }}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Official Certificate (.PDF)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-amber-50/90 border border-amber-300 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900">
                        Certificate Export is Currently Locked
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl">
                        To export your certificate, please finish all 3
                        requirements above:{' '}
                        <strong>
                          {Math.max(0, totalLessonsCount - completedLessonsCount)}{' '}
                          lesson(s)
                        </strong>{' '}
                        remaining,{' '}
                        <strong>
                          {Math.max(0, totalExamsCount - passedExamsCount)} level
                          exam(s)
                        </strong>{' '}
                        remaining, and{' '}
                        <strong>
                          {Math.max(0, totalProjectsCount - submittedProjectsCount)}{' '}
                          project(s)
                        </strong>{' '}
                        remaining to submit to the instructor.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="px-5 py-3 bg-slate-200 text-slate-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed shrink-0"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Complete Requirements to Export PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Certificate Preview Modal */}
      {previewCertificate && (
        <CertificatePreviewModal
          certificate={previewCertificate}
          isOpen={Boolean(previewCertificate)}
          onClose={() => setPreviewCertificate(null)}
          onUpdateName={(newName) => {
            onUpdateStudentName(newName);
            setPreviewCertificate((prev) =>
              prev ? { ...prev, studentName: newName } : null
            );
          }}
        />
      )}
    </div>
  );
};
