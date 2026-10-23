import React, { useState } from 'react';
import {
  Play,
  Download,
  Check,
  BookOpen,
  Settings,
  LogOut,
  FileSpreadsheet,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Award,
  CheckCircle2,
  Circle,
  Clock,
  ShieldCheck,
  Sparkles,
  Eye,
  FileCheck2,
  HelpCircle,
  RotateCcw,
  Flame,
  TrendingUp,
  Share2,
  Briefcase,
  MessageCircle,
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
import { LEVEL_6_PROJECTS } from '../data/curriculumData';
import { LEVEL_EXAMS } from '../data/levelExamData';
import { downloadDemoCsvFile } from '../utils/downloadCsv';
import {
  downloadLevelCertificatePdf,
  getCertificateDataForLevel,
} from '../utils/pdfCertificateGenerator';
import { LevelExamModal } from './LevelExamModal';
import { CertificatePreviewModal } from './CertificatePreviewModal';
import { StudentAnalyticsRadarView } from './StudentAnalyticsRadarView';
import { CapstonePortfolioView } from './CapstonePortfolioView';
import { getStoredStudyStreak } from '../utils/studentAnalyticsCalculator';

interface StudentDashboardViewProps {
  student: Profile;
  course: Course;
  levels: CurriculumLevel[];
  completedLessonIds: string[];
  recentlyViewedLessonId: string;
  quizAttempts: QuizAttempt[];
  projectSubmissions: Record<string, ProjectSubmissionState>;
  onToggleProjectChecklist: (projectId: string, itemIdx: number) => void;
  onStartLesson: (lessonId: string) => void;
  onUpdateStudentName: (newName: string) => void;
  onResetDemoProgress: () => void;
  onLogoutDemo: () => void;
  onRecordQuizAttempt?: (attempt: QuizAttempt) => void;
  onSubmitCapstoneProject?: (
    projectId: string,
    score: number,
    notes: string,
    rubricScores: Record<string, number>
  ) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  student,
  course,
  levels,
  completedLessonIds,
  recentlyViewedLessonId,
  quizAttempts,
  projectSubmissions,
  onToggleProjectChecklist,
  onStartLesson,
  onUpdateStudentName,
  onResetDemoProgress,
  onLogoutDemo,
  onRecordQuizAttempt,
  onSubmitCapstoneProject,
}) => {
  const [activeTab, setActiveTab] = useState<
    'material' | 'analytics' | 'certificates' | 'grades' | 'projects' | 'resources' | 'settings'
  >('material');
  const [selectedLevelNumber, setSelectedLevelNumber] = useState<number>(1);
  const [selectedExamLevel, setSelectedExamLevel] = useState<number | null>(null);
  const [previewCertificate, setPreviewCertificate] =
    useState<LevelCertificate | null>(null);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({
    'lvl-1-mod-1': true,
    'lvl-1-mod-2': true,
  });
  const [profileNameInput, setProfileNameInput] = useState(student.fullName);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  const allLessons: Lesson[] = levels.flatMap((l) =>
    l.modules.flatMap((m) => m.lessons)
  );

  const totalLessonsCount = allLessons.length;
  const completedCount = completedLessonIds.length;
  const overallProgressPct =
    totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

  const recentlyViewedLesson =
    allLessons.find((l) => l.id === recentlyViewedLessonId) || allLessons[0];
  const nextRecommendedLesson =
    allLessons.find((l) => !completedLessonIds.includes(l.id)) || allLessons[0];

  const activeLevelObj =
    levels.find((l) => l.levelNumber === selectedLevelNumber) || levels[0];

  const toggleModuleExpand = (modId: string) => {
    setExpandedModuleIds((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const getExamAttemptForLevel = (lvlNum: number) => {
    return quizAttempts.find(
      (a) => a.quizId === `exam-lvl-${lvlNum}` || a.lessonTitle.includes(`Level ${lvlNum} Comprehensive`)
    );
  };

  const getPassedExamsCount = () => {
    let count = 0;
    for (let i = 1; i <= 6; i++) {
      const att = getExamAttemptForLevel(i);
      if (att && att.passed) count++;
    }
    return count;
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileNameInput.trim()) return;
    onUpdateStudentName(profileNameInput.trim());
    setSettingsSavedMsg('Your profile name has been updated.');
    setTimeout(() => setSettingsSavedMsg(''), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COURSERA-STYLE COURSE SIDEBAR (3 Cols) */}
        <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-emerald-800">
                Professional Certificate Track
              </div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">
                {course.title}
              </h2>
            </div>

            {/* Progress Meter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Course Progress</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {overallProgressPct}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-700 h-full transition-all duration-200"
                  style={{ width: `${Math.max(overallProgressPct, 2)}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                {completedCount} of {totalLessonsCount} lessons completed
              </div>
            </div>

            {/* Direct WhatsApp Instructor Help Button */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="text-[11px] font-bold text-emerald-950 flex items-center justify-between">
                <span>Direct Instructor Help</span>
                <span className="font-mono text-[10px] bg-emerald-800 text-white px-1.5 py-0.5 rounded">07080145682</span>
              </div>
              <a
                href="https://wa.me/2347080145682?text=Hello%20Lead%20Instructor%20Okoro,%20I%20am%20enrolled%20in%20the%20Excel%20Academy%20and%20need%20assistance."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>Speak to the Instructor</span>
              </a>
            </div>

            {/* Sidebar Navigation Links */}
            <nav className="pt-2 border-t border-slate-100 space-y-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('material')}
                className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'material'
                    ? 'bg-emerald-50 text-emerald-950 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>Course Material</span>
                </span>
                <span className="font-mono text-[11px] text-slate-500">6 Levels</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-50 text-emerald-950 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <span>Skills Radar &amp; Streaks</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-current text-orange-600" />
                  <span>{getStoredStudyStreak().streak}d</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('certificates')}
                className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'certificates'
                    ? 'bg-emerald-50 text-emerald-950 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Certificates &amp; Exams</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                  PDF
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('grades')}
                className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'grades'
                    ? 'bg-emerald-50 text-emerald-950 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-emerald-700" />
                  <span>Grades &amp; Quizzes</span>
                </span>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                  {quizAttempts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('projects')}
                className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'projects'
                    ? 'bg-emerald-50 text-emerald-950 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  <span>Capstone Portfolio</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  3 Projects
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('resources')}
                className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'resources'
                    ? 'bg-emerald-50 text-emerald-950 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Workbooks & Datasets</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-emerald-50 text-emerald-950 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-emerald-700" />
                  <span>Account Settings</span>
                </span>
              </button>
            </nav>

            {/* Clean Learner Account Footer & Sign Out */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
              <div className="px-1">
                <div className="font-semibold text-slate-900 truncate">
                  {student.fullName}
                </div>
                <div className="text-slate-500 truncate text-[11px]">
                  {student.email}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogoutDemo}
                className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA (9 Cols) */}
        <main className="lg:col-span-9 space-y-6">
          {/* Top Coursera-Style "Next Up" Resume Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                <span>Next Up in Level {nextRecommendedLesson.levelNumber}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{nextRecommendedLesson.durationMinutes} min video</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                {nextRecommendedLesson.title}
              </h1>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                {nextRecommendedLesson.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onStartLesson(nextRecommendedLesson.id)}
                className="px-5 py-2.5 bg-emerald-800 text-white text-xs font-semibold rounded-lg hover:bg-emerald-900 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Lesson</span>
              </button>

              {recentlyViewedLesson.id !== nextRecommendedLesson.id && (
                <button
                  type="button"
                  onClick={() => onStartLesson(recentlyViewedLesson.id)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Last Viewed
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className="px-3.5 py-2.5 bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                title="View your 6-axis Competency Radar and streak"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                <span>Skills Radar</span>
              </button>
            </div>
          </div>

          {/* TAB 1: COURSE MATERIAL (Coursera Level Switcher & Module Accordions) */}
          {activeTab === 'material' && (
            <div className="space-y-6">
              {/* 6-Level Selector Pills/Tabs */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-900">
                  Select Learning Level
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {levels.map((lvl) => {
                    const lvlLessons = lvl.modules.flatMap((m) => m.lessons);
                    const lvlDone = lvlLessons.filter((l) =>
                      completedLessonIds.includes(l.id)
                    ).length;
                    const isSelected = lvl.levelNumber === selectedLevelNumber;

                    return (
                      <button
                        key={lvl.levelNumber}
                        type="button"
                        onClick={() => setSelectedLevelNumber(lvl.levelNumber)}
                        className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div
                          className={`text-[11px] font-mono font-semibold ${
                            isSelected ? 'text-emerald-400' : 'text-emerald-800'
                          }`}
                        >
                          Level {lvl.levelNumber}
                        </div>
                        <div className="text-xs font-bold truncate mt-0.5">
                          {lvl.title.replace(/^Excel\s+/i, '')}
                        </div>
                        <div
                          className={`text-[11px] font-mono mt-1 tabular-nums ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {lvlDone}/{lvlLessons.length} done
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Level Header & Modules Accordion */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-200 space-y-2">
                  <div className="text-xs font-mono text-emerald-800 font-semibold">
                    Level 0{activeLevelObj.levelNumber} of 06 · {activeLevelObj.modules.length} Modules
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {activeLevelObj.title}
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {activeLevelObj.goal}
                  </p>
                </div>

                <div className="divide-y divide-slate-200">
                  {activeLevelObj.modules.map((mod) => {
                    const isExpanded = Boolean(expandedModuleIds[mod.id]);
                    const modCompleted = mod.lessons.filter((l) =>
                      completedLessonIds.includes(l.id)
                    ).length;

                    return (
                      <div key={mod.id} className="bg-white">
                        <button
                          type="button"
                          onClick={() => toggleModuleExpand(mod.id)}
                          className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                            )}
                            <div>
                              <div className="text-xs font-mono text-slate-500">
                                Module {activeLevelObj.levelNumber}.{mod.orderIndex}
                              </div>
                              <div className="text-sm font-bold text-slate-900">
                                {mod.title}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs font-mono text-slate-600 tabular-nums shrink-0">
                            {modCompleted}/{mod.lessons.length} completed
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-6 pb-4 pt-1 bg-slate-50/60 divide-y divide-slate-200/70">
                            {mod.lessons.map((les) => {
                              const isDone = completedLessonIds.includes(les.id);
                              return (
                                <div
                                  key={les.id}
                                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-start gap-3">
                                    {isDone ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                                    )}
                                    <div className="space-y-0.5">
                                      <button
                                        type="button"
                                        onClick={() => onStartLesson(les.id)}
                                        className="font-semibold text-slate-900 hover:text-emerald-800 text-left cursor-pointer"
                                      >
                                        {les.title}
                                      </button>
                                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                        <span className="flex items-center gap-1 font-mono">
                                          <Clock className="w-3 h-3" />
                                          {les.durationMinutes} min
                                        </span>
                                        <span aria-hidden="true">·</span>
                                        <span className="font-mono">
                                          Workbook: {les.resource.fileName}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 pl-7 sm:pl-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        downloadDemoCsvFile(
                                          les.resource.fileName,
                                          les.resource.sampleCsvContent
                                        )
                                      }
                                      className="px-2.5 py-1.5 text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 font-medium cursor-pointer"
                                    >
                                      Workbook
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onStartLesson(les.id)}
                                      className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-md hover:bg-emerald-800 flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>{isDone ? 'Review' : 'Start'}</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* END-OF-LEVEL CERTIFICATION EXAM & CREDENTIAL CARD */}
                <div className="mt-6 bg-[#FAF9F5] border-2 border-emerald-600/40 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold uppercase tracking-wider">
                          Level {selectedLevelNumber} Comprehensive Assessment
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          10 Questions · 70% to Pass
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {activeLevelObj.title}: Official End-of-Level Certification Exam
                      </h3>
                    </div>

                    {(() => {
                      const examAtt = getExamAttemptForLevel(selectedLevelNumber);
                      if (examAtt && examAtt.passed) {
                        return (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full font-bold text-xs font-mono">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            Passed ({examAtt.scorePercent}%) · Credential Ready
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-medium text-xs font-mono">
                          <Award className="w-4 h-4 text-amber-700" />
                          Earn Official PDF Credential
                        </span>
                      );
                    })()}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    Verify your practical mastery of {activeLevelObj.title.toLowerCase()}. Pass the 10-question multiple-choice and formula syntax exam to unlock your official verified certificate of achievement signed by the academy.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedExamLevel(selectedLevelNumber)}
                      className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Award className="w-4 h-4 text-emerald-200" />
                      <span>
                        {getExamAttemptForLevel(selectedLevelNumber)
                          ? 'Retake Level Exam'
                          : `Take Level ${selectedLevelNumber} Exam (10 Questions)`}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const examAtt = getExamAttemptForLevel(selectedLevelNumber);
                        const cert = getCertificateDataForLevel(
                          selectedLevelNumber,
                          student.fullName,
                          student.email,
                          examAtt?.scorePercent || 100
                        );
                        downloadLevelCertificatePdf(cert);
                      }}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Download Level {selectedLevelNumber} PDF (.pdf)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const examAtt = getExamAttemptForLevel(selectedLevelNumber);
                        const cert = getCertificateDataForLevel(
                          selectedLevelNumber,
                          student.fullName,
                          student.email,
                          examAtt?.scorePercent || 100
                        );
                        setPreviewCertificate(cert);
                      }}
                      className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-emerald-800" />
                      <span>Preview Certificate</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SKILLS COMPETENCY RADAR, GAMIFIED BADGES & LINKEDIN EXPORT */}
          {activeTab === 'analytics' && (
            <StudentAnalyticsRadarView
              student={student}
              levels={levels}
              completedLessonIds={completedLessonIds}
              quizAttempts={quizAttempts}
              projectSubmissions={projectSubmissions}
              onStartLesson={onStartLesson}
            />
          )}

          {/* TAB: CERTIFICATES & END-OF-LEVEL EXAMS HUB */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              {/* MASTER CERTIFICATION HERO BANNER */}
              <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xl">
                {/* Decorative Background Accents */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-32 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-3 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/80 border border-amber-600 text-amber-300 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Master Data Analyst Credential
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Excel to Data Analyst Master Certification
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Conferred upon completion of all 6 curriculum levels (54 modules, 108 guided walkthroughs, hands-on practice workbooks, and comprehensive exams). Verified credential recognized for data analyst competency.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-slate-300">
                      <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Student: {student.fullName}
                      </span>
                      <span>·</span>
                      <span>{getPassedExamsCount()} of 6 Level Exams Passed</span>
                      <span>·</span>
                      <span>{completedCount}/{totalLessonsCount} Lessons Completed</span>
                    </div>
                  </div>

                  {/* Actions & Official Seal */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 shrink-0">
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
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Master Certificate (.PDF)</span>
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
                        setPreviewCertificate(masterCert);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>Preview Master Credential</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 6 INDIVIDUAL LEVEL CERTIFICATIONS & COMPREHENSIVE EXAMS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Level Certification Exams &amp; Credentials (Levels 1–6)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Each level features a 10-question comprehensive exam. Complete an exam to verify your knowledge and claim your branded PDF certificate.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {LEVEL_EXAMS.map((exam) => {
                    const examAttempt = getExamAttemptForLevel(exam.levelNumber);
                    const isPassed = Boolean(examAttempt && examAttempt.passed);
                    const lvlLessons =
                      levels
                        .find((l) => l.levelNumber === exam.levelNumber)
                        ?.modules.flatMap((m) => m.lessons) || [];
                    const lvlCompleted = lvlLessons.filter((l) =>
                      completedLessonIds.includes(l.id)
                    ).length;

                    return (
                      <div
                        key={exam.levelNumber}
                        className={`bg-white border rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs transition-colors ${
                          isPassed
                            ? 'border-emerald-600/50 bg-emerald-50/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] font-bold uppercase">
                              Level {exam.levelNumber} Certification
                            </span>
                            {isPassed ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                Passed ({examAttempt?.scorePercent}%)
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-500">
                                10 Questions · 70% Pass
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-bold text-slate-900">
                            {exam.title}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {exam.description}
                          </p>

                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2 pt-1">
                            <span>
                              Lessons Completed: {lvlCompleted} / {lvlLessons.length}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setSelectedExamLevel(exam.levelNumber)}
                            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>
                              {isPassed
                                ? 'Retake Exam'
                                : 'Take 10-Q Level Exam'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const cert = getCertificateDataForLevel(
                                exam.levelNumber,
                                student.fullName,
                                student.email,
                                examAttempt?.scorePercent || 100
                              );
                              downloadLevelCertificatePdf(cert);
                            }}
                            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                            title="Download verified PDF certificate"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-300" />
                            <span>PDF (.pdf)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const cert = getCertificateDataForLevel(
                                exam.levelNumber,
                                student.fullName,
                                student.email,
                                examAttempt?.scorePercent || 100
                              );
                              setPreviewCertificate(cert);
                            }}
                            className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer"
                            title="Preview certificate on screen"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GRADES & QUIZZES */}
          {activeTab === 'grades' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Grades & Quiz Attempt History
                </h2>
                <p className="text-xs text-slate-600">
                  Assessments taken in the Classroom and End-of-Level Certification Exams are recorded here.
                </p>
              </div>

              {quizAttempts.length === 0 ? (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-3">
                  <div className="text-sm font-semibold text-slate-900">
                    No quiz attempts recorded yet
                  </div>
                  <p className="text-xs text-slate-600">
                    Open any lesson in the Classroom and switch to the Quiz tab to complete your first assessment.
                  </p>
                  <button
                    type="button"
                    onClick={() => onStartLesson(nextRecommendedLesson.id)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-lg cursor-pointer"
                  >
                    Go to Next Lesson Quiz
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <th className="py-3 px-4 font-sans">Lesson Assessment</th>
                        <th className="py-3 px-4 text-right">Grade</th>
                        <th className="py-3 px-4 text-right">Score</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {quizAttempts.map((att) => (
                        <tr key={att.id}>
                          <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                            {att.lessonTitle}
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            {att.scorePercent}%
                          </td>
                          <td className="py-3 px-4 text-right">
                            {att.correctCount}/{att.totalQuestions}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={
                                att.passed
                                  ? 'text-emerald-800 font-semibold'
                                  : 'text-amber-800 font-semibold'
                              }
                            >
                              {att.passed ? 'Passed' : 'Keep Practising'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{att.attemptedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LEVEL 6 CAPSTONE PROJECTS & PORTFOLIO SHOWCASE */}
          {activeTab === 'projects' && (
            <CapstonePortfolioView
              student={student}
              projectSubmissions={projectSubmissions}
              onToggleProjectChecklist={onToggleProjectChecklist}
              onSubmitCapstoneProject={onSubmitCapstoneProject}
              onNavigateToClassroom={onStartLesson}
            />
          )}

          {/* TAB 4: PRACTICE WORKBOOKS REPOSITORY */}
          {activeTab === 'resources' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Excel Workbooks & Practice Datasets
                </h2>
                <p className="text-xs text-slate-600">
                  Download any lesson dataset below to practise formulas, PivotTables, and dashboards directly in Microsoft Excel.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4">Workbook File</th>
                      <th className="py-3 px-4">Lesson</th>
                      <th className="py-3 px-4 text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {allLessons.slice(0, 30).map((les) => (
                      <tr key={les.resource.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          Level 0{les.levelNumber}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {les.resource.fileName}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => onStartLesson(les.id)}
                            className="hover:underline font-medium text-slate-900 text-left cursor-pointer"
                          >
                            {les.title}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              downloadDemoCsvFile(
                                les.resource.fileName,
                                les.resource.sampleCsvContent
                              )
                            }
                            className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-emerald-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ACCOUNT & PROFILE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 max-w-2xl">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Account & Profile Settings
                </h2>
                <p className="text-xs text-slate-500">
                  Manage your learner profile and session preferences.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="student-fullname"
                    className="block text-xs font-semibold text-slate-800"
                  >
                    Full Name
                  </label>
                  <input
                    id="student-fullname"
                    type="text"
                    required
                    value={profileNameInput}
                    onChange={(e) => setProfileNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="student-email"
                    className="block text-xs font-semibold text-slate-800"
                  >
                    Registered Email Address
                  </label>
                  <input
                    id="student-email"
                    type="email"
                    disabled
                    value={student.email}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                  />
                </div>

                {settingsSavedMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-medium">
                    {settingsSavedMsg}
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>

                  <div className="flex items-center gap-3">
                    {student.isDemoSession && (
                      <button
                        type="button"
                        onClick={onResetDemoProgress}
                        className="px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        Reset Progress
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onLogoutDemo}
                      className="px-4 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* LEVEL EXAM MODAL */}
      {selectedExamLevel !== null && (
        <LevelExamModal
          exam={
            LEVEL_EXAMS.find((e) => e.levelNumber === selectedExamLevel) ||
            LEVEL_EXAMS[0]
          }
          studentName={student.fullName}
          studentEmail={student.email}
          isOpen={selectedExamLevel !== null}
          onClose={() => setSelectedExamLevel(null)}
          onRecordExamAttempt={(attempt) => {
            if (onRecordQuizAttempt) {
              onRecordQuizAttempt(attempt);
            }
          }}
          onOpenCertificatePreview={(cert) => {
            setPreviewCertificate(cert);
          }}
        />
      )}

      {/* CERTIFICATE PREVIEW & PDF DOWNLOAD MODAL */}
      {previewCertificate !== null && (
        <CertificatePreviewModal
          certificate={previewCertificate}
          isOpen={previewCertificate !== null}
          onClose={() => setPreviewCertificate(null)}
          onUpdateName={(newName) => {
            onUpdateStudentName(newName);
            setProfileNameInput(newName);
          }}
        />
      )}
    </div>
  );
};
