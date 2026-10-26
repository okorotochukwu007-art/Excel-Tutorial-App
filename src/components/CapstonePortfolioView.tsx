import React, { useState } from 'react';
import {
  Award,
  Briefcase,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Lock,
  Send,
  Upload,
  Link2,
  AlertCircle,
  CheckSquare,
  Square,
  Sparkles,
  UserCheck,
  BookOpen,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';
import { CAPSTONE_PROJECTS } from '../data/capstoneProjectsData';
import { downloadCapstoneStarterWorkbook } from '../utils/capstoneWorkbookGenerator';
import {
  CurriculumLevel,
  Lesson,
  LevelCertificate,
  ProjectSubmissionState,
  QuizAttempt,
} from '../types/academy';
import {
  downloadLevelCertificatePdf,
  getCertificateDataForLevel,
} from '../utils/pdfCertificateGenerator';
import { CertificatePreviewModal } from './CertificatePreviewModal';

interface CapstonePortfolioViewProps {
  studentName: string;
  studentEmail?: string;
  projectSubmissions: Record<string, ProjectSubmissionState>;
  onSubmitCapstoneProject: (
    projectId: string,
    score: number,
    notes: string
  ) => void;
  levels?: CurriculumLevel[];
  completedLessonIds?: string[];
  quizAttempts?: QuizAttempt[];
  isInstructor?: boolean;
  isAuthenticated?: boolean;
  onUpdateStudentName?: (newName: string) => void;
  onNavigateToLearning?: () => void;
  onRequireAuth?: () => void;
  standalonePage?: boolean;
}

export const CapstonePortfolioView: React.FC<CapstonePortfolioViewProps> = ({
  studentName,
  studentEmail,
  projectSubmissions,
  onSubmitCapstoneProject,
  levels = [],
  completedLessonIds = [],
  quizAttempts = [],
  isInstructor = false,
  isAuthenticated = true,
  onUpdateStudentName,
  onNavigateToLearning,
  onRequireAuth,
  standalonePage = false,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    CAPSTONE_PROJECTS[0].id
  );
  const [nameInput, setNameInput] = useState(studentName);
  const [editingName, setEditingName] = useState(false);
  const [previewCertificate, setPreviewCertificate] =
    useState<LevelCertificate | null>(null);

  // Calculate 6-Level Course & Exam Completion
  const allLessons: Lesson[] = [];
  levels.forEach((lvl) => {
    lvl.modules.forEach((mod) => {
      mod.lessons.forEach((les) => allLessons.push(les));
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

  const totalExamsCount = levels.length > 0 ? levels.length : 6;
  const passedExamsCount = levels.filter((lvl) =>
    quizAttempts.some(
      (a) => a.quizId === `exam-lvl-${lvl.levelNumber}` && a.passed
    )
  ).length;
  const allExamsPassed =
    totalExamsCount > 0 && passedExamsCount >= totalExamsCount;

  // Count how many full levels (all lessons in level + level exam passed) are finished
  const completedFullLevelsCount = levels.filter((lvl) => {
    const lvlLessonIds = lvl.modules.flatMap((m) =>
      m.lessons.map((l) => l.id)
    );
    const allLvlLessonsDone =
      lvlLessonIds.length > 0 &&
      lvlLessonIds.every((id) => completedLessonIds.includes(id));
    const lvlExamPassed = quizAttempts.some(
      (a) => a.quizId === `exam-lvl-${lvl.levelNumber}` && a.passed
    );
    return allLvlLessonsDone && lvlExamPassed;
  }).length;

  // Students must complete all 6 levels (all modules + all 6 level exams) before approaching the final projects
  const canApproachFinalProjects =
    isInstructor || (allModulesCompleted && allExamsPassed);

  // Track checklist items per project
  const [checkedDeliverables, setCheckedDeliverables] = useState<
    Record<string, Record<string, boolean>>
  >(() => {
    const init: Record<string, Record<string, boolean>> = {};
    CAPSTONE_PROJECTS.forEach((p) => {
      const existing = projectSubmissions[p.id];
      const isAlreadySubmitted = existing?.status === 'completed_local';
      init[p.id] = {};
      p.deliverableChecklist.forEach((d, idx) => {
        init[p.id][d.id] =
          isAlreadySubmitted ||
          Boolean(existing?.completedChecklistItems?.includes(idx));
      });
    });
    return init;
  });

  // Track attached workbook filename per project
  const [uploadedFileNames, setUploadedFileNames] = useState<
    Record<string, string>
  >({});

  // Track optional cloud link per project
  const [workbookLinks, setWorkbookLinks] = useState<Record<string, string>>(
    {}
  );

  // Track executive findings written for the instructor
  const [executiveSummaries, setExecutiveSummaries] = useState<
    Record<string, string>
  >(() => {
    const init: Record<string, string> = {};
    CAPSTONE_PROJECTS.forEach((p) => {
      init[p.id] = projectSubmissions[p.id]?.notes || '';
    });
    return init;
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionSuccessToast, setSubmissionSuccessToast] = useState<
    string | null
  >(null);

  const activeProject =
    CAPSTONE_PROJECTS.find((p) => p.id === selectedProjectId) ||
    CAPSTONE_PROJECTS[0];

  const isProjectSubmitted = (projectId: string): boolean => {
    return projectSubmissions[projectId]?.status === 'completed_local';
  };

  const totalProjectsCount = CAPSTONE_PROJECTS.length;
  const submittedCount = CAPSTONE_PROJECTS.filter((p) =>
    isProjectSubmitted(p.id)
  ).length;
  const allProjectsSubmitted = submittedCount >= totalProjectsCount;

  // Certificate is unlocked ONLY when all 6 levels (modules + exams) AND all 4 projects are completed
  const isCertificateUnlocked =
    allModulesCompleted && allExamsPassed && allProjectsSubmitted;

  const projectDeliverables = checkedDeliverables[activeProject.id] || {};
  const completedDeliverablesCount = activeProject.deliverableChecklist.filter(
    (d) => projectDeliverables[d.id]
  ).length;
  const totalDeliverablesCount = activeProject.deliverableChecklist.length;

  const handleToggleDeliverable = (deliverableId: string) => {
    if (!canApproachFinalProjects) return;
    setValidationError(null);
    setCheckedDeliverables((prev) => ({
      ...prev,
      [activeProject.id]: {
        ...(prev[activeProject.id] || {}),
        [deliverableId]: !prev[activeProject.id]?.[deliverableId],
      },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canApproachFinalProjects) return;
    setValidationError(null);
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileNames((prev) => ({
        ...prev,
        [activeProject.id]: file.name,
      }));
    }
  };

  const handleSubmitToInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!isAuthenticated) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (!canApproachFinalProjects) {
      setValidationError(
        'Final projects are locked until you complete all 6 course levels and pass all 6 level final exams.'
      );
      return;
    }

    const attachedFile = uploadedFileNames[activeProject.id]?.trim() || '';
    const linkValue = workbookLinks[activeProject.id]?.trim() || '';
    const summaryText =
      (
        executiveSummaries[activeProject.id] ??
        projectSubmissions[activeProject.id]?.notes ??
        ''
      ).trim();

    if (completedDeliverablesCount < totalDeliverablesCount) {
      setValidationError(
        `Please complete and check all ${totalDeliverablesCount} required deliverables in Step 3 before submitting to the instructor.`
      );
      return;
    }

    if (!attachedFile && !linkValue && !isProjectSubmitted(activeProject.id)) {
      setValidationError(
        'Please attach your completed Excel workbook (.xlsx) file or paste a shared workbook link for your instructor.'
      );
      return;
    }

    if (summaryText.length < 20) {
      setValidationError(
        'Please write a clear summary of your key findings and business recommendations (at least 1–2 sentences) for the instructor.'
      );
      return;
    }

    const formattedSubmissionNote = [
      attachedFile ? `[Workbook File: ${attachedFile}]` : '',
      linkValue ? `[Workbook Link: ${linkValue}]` : '',
      summaryText,
    ]
      .filter(Boolean)
      .join(' | ');

    onSubmitCapstoneProject(activeProject.id, 100, formattedSubmissionNote);
    setSubmissionSuccessToast(
      `Project ${activeProject.projectNumber} ("${activeProject.title}") has been submitted to Instructor Okoro Tochuwku!`
    );
    setTimeout(() => setSubmissionSuccessToast(null), 5000);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    if (onUpdateStudentName) {
      onUpdateStudentName(nameInput.trim());
    }
    setEditingName(false);
  };

  const currentlySubmitted = isProjectSubmitted(activeProject.id);

  const content = (
    <div className="space-y-8">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-950/90 border border-emerald-700/70 text-emerald-300 text-xs font-mono">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              <span>FINAL CAPSTONE PROJECTS &amp; OFFICIAL CERTIFICATE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Real-Life Industry Projects &amp; Diploma Certification
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Browse the 4 real-life company projects below. You must{' '}
              <strong className="text-amber-300">
                complete all 6 course levels and pass all 6 level final exams
              </strong>{' '}
              before approaching and submitting these final projects to your
              instructor. Once all 6 levels and all 4 projects are completed,
              your official PDF Certificate unlocks below.
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 shrink-0 text-center min-w-[210px]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Final Projects Status
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {submittedCount} / {CAPSTONE_PROJECTS.length} Submitted
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              {canApproachFinalProjects
                ? submittedCount === CAPSTONE_PROJECTS.length
                  ? 'All 4 Projects Submitted!'
                  : 'Projects Unlocked — Ready to Submit'
                : `Locked (${completedFullLevelsCount}/6 Levels Done)`}
            </div>
          </div>
        </div>

        {/* 6-LEVEL PREREQUISITE BANNER */}
        {!canApproachFinalProjects ? (
          <div className="p-4 rounded-xl bg-amber-950/90 border border-amber-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-800/60 border border-amber-600 text-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-bold text-amber-200">
                  Final Projects Are Locked Until You Complete All 6 Course Levels
                </div>
                <p className="text-xs text-amber-100/90 leading-relaxed max-w-2xl">
                  You can preview the 4 project briefs and sample datasets below,
                  but downloading project workbooks and submitting to the
                  instructor requires completing all 6 levels first:{' '}
                  <strong>
                    {completedLessonsCount}/{totalLessonsCount} module lessons
                  </strong>{' '}
                  completed and{' '}
                  <strong>
                    {passedExamsCount}/{totalExamsCount} level final exams
                  </strong>{' '}
                  passed.
                </p>
              </div>
            </div>

            {onNavigateToLearning && (
              <button
                type="button"
                onClick={onNavigateToLearning}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shrink-0 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Continue Course Levels (1–6)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-200 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                {isInstructor && !(allModulesCompleted && allExamsPassed)
                  ? 'Instructor Preview Mode: All 4 Final Projects & Workbooks are unlocked for inspection.'
                  : 'All 6 Course Levels & Exams Completed! You can now download and submit all 4 final projects below.'}
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-300 shrink-0">
              {submittedCount}/4 Projects Submitted
            </span>
          </div>
        )}
      </div>

      {/* 4 PROJECT SELECTOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {CAPSTONE_PROJECTS.map((project) => {
          const isSelected = project.id === activeProject.id;
          const isDone = isProjectSubmitted(project.id);

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => {
                setSelectedProjectId(project.id);
                setValidationError(null);
              }}
              className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-950 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/40'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70 shadow-xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      isSelected
                        ? 'bg-emerald-800 text-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Project {project.projectNumber} of 4
                  </span>

                  {isDone ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-mono font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      Submitted
                    </span>
                  ) : !canApproachFinalProjects ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono ${
                        isSelected ? 'text-amber-300' : 'text-slate-500'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-mono ${
                        isSelected ? 'text-amber-300' : 'text-amber-700'
                      }`}
                    >
                      Pending
                    </span>
                  )}
                </div>

                <h3
                  className={`text-sm font-bold leading-snug ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {project.title}
                </h3>
              </div>

              <div
                className={`text-[11px] font-mono pt-2 border-t flex items-center justify-between ${
                  isSelected
                    ? 'border-emerald-800/80 text-emerald-200'
                    : 'border-slate-100 text-slate-500'
                }`}
              >
                <span className="truncate">{project.industry}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* TOAST NOTIFICATION */}
      {submissionSuccessToast && (
        <div className="p-4 bg-emerald-900 text-white rounded-xl border border-emerald-700 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>{submissionSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionSuccessToast(null)}
            className="text-xs text-emerald-200 hover:text-white font-mono cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ACTIVE PROJECT WORKSPACE — SIMPLE 3-STEP FLOW */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-200">
        {/* PROJECT TITLE & STEP 1: DOWNLOAD WORKBOOK */}
        <div className="p-6 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 text-xs font-mono font-bold">
                Project {activeProject.projectNumber} of 4
              </span>
              <span className="text-xs font-mono text-slate-500">
                {activeProject.industry}
              </span>
              {currentlySubmitted && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-800 text-white text-xs font-mono font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Submitted to Instructor
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              {activeProject.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              {activeProject.subtitle}
            </p>
          </div>

          <div className="shrink-0">
            {canApproachFinalProjects ? (
              <>
                <button
                  type="button"
                  onClick={() => downloadCapstoneStarterWorkbook(activeProject)}
                  className="w-full sm:w-auto px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-200" />
                  <span>
                    Step 1: Download Realistic Excel Dataset (.xlsx)
                  </span>
                </button>
                <div className="text-[11px] text-slate-500 font-mono mt-1.5 text-center sm:text-right">
                  File: {activeProject.starterWorkbookName}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  className="w-full sm:w-auto px-5 py-3 bg-slate-200 text-slate-500 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Locked — Complete All 6 Levels to Download (.xlsx)
                  </span>
                </button>
                <div className="text-[11px] text-amber-800 font-mono mt-1.5 text-center sm:text-right">
                  Prerequisite: Finish Levels 1–6 &amp; Pass All 6 Exams ({completedFullLevelsCount}/6 Done)
                </div>
              </>
            )}
          </div>
        </div>

        {/* STEP 2: REAL-LIFE SCENARIO, TASKS & DATASET PREVIEW */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Scenario & Problem */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold">
                  Real-Life Business Scenario
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {activeProject.businessScenario}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-amber-900 font-bold">
                  Your Analyst Assignment
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {activeProject.problemStatement}
                </p>
              </div>
            </div>

            {/* Right: Step-by-Step Tasks */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-800 font-bold">
                Step 2: Tasks to Complete in Your Excel Workbook
              </div>
              <ol className="space-y-2.5">
                {activeProject.keyObjectives.map((task, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{task}</span>
                  </li>
                ))}
              </ol>

              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                  Key Excel Formulas Used in This Project:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeProject.requiredFormulas.map((formula, i) => (
                    <code
                      key={i}
                      className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono text-emerald-900"
                    >
                      {formula}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dataset Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-700 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>
                  Preview of Realistic Dataset (
                  {
                    (
                      activeProject.fullDatasetRows ||
                      activeProject.samplePreviewRows
                    ).length
                  }{' '}
                  records in full workbook)
                </span>
              </h4>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    {activeProject.sampleHeaders.map((hdr) => (
                      <th
                        key={hdr}
                        className="py-2 px-3 border-r border-slate-200 font-semibold whitespace-nowrap"
                      >
                        {hdr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 bg-white">
                  {activeProject.samplePreviewRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="py-2 px-3 border-r border-slate-200 whitespace-nowrap"
                        >
                          {typeof cell === 'number'
                            ? cell.toLocaleString()
                            : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* STEP 3: SUBMIT PROJECT TO INSTRUCTOR */}
        {!canApproachFinalProjects ? (
          <div className="p-6 bg-amber-50/70 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Step 3: Project Submission Locked Until All 6 Levels Are Completed
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                    Before approaching and submitting Project{' '}
                    {activeProject.projectNumber} to Instructor Okoro Tochuwku,
                    you must complete all modules in Levels 1–6 (
                    <strong>
                      {completedLessonsCount}/{totalLessonsCount} completed
                    </strong>
                    ) and pass all 6 Level Final Exams (
                    <strong>
                      {passedExamsCount}/{totalExamsCount} passed
                    </strong>
                    ).
                  </p>
                </div>
              </div>

              {onNavigateToLearning && (
                <button
                  type="button"
                  onClick={onNavigateToLearning}
                  className="px-5 py-3 bg-slate-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-colors"
                >
                  <span>Complete Course Levels First</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmitToInstructor}
            className="p-6 bg-emerald-50/40 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/70 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-emerald-900">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>
                    Step 3: Submit Completed Project{' '}
                    {activeProject.projectNumber} to Instructor
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Instructor:{' '}
                  <strong className="text-slate-900">
                    Okoro Tochuwku (Lead Instructor)
                  </strong>{' '}
                  · Submitting as{' '}
                  <strong className="text-slate-900">{studentName}</strong>
                  {studentEmail ? ` (${studentEmail})` : ''}
                </p>
              </div>

              {currentlySubmitted && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Project {activeProject.projectNumber} Submitted</span>
                </div>
              )}
            </div>

            {/* 3A: Deliverable Checklist */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-800">
                1. Confirm Your Completed Workbook Deliverables (
                {completedDeliverablesCount}/{totalDeliverablesCount} checked):
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {activeProject.deliverableChecklist.map((item) => {
                  const isChecked = Boolean(projectDeliverables[item.id]);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleDeliverable(item.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                        isChecked
                          ? 'bg-white border-emerald-500 shadow-2xs'
                          : 'bg-white/80 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-snug">
                          {item.details}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3B: Upload Completed Excel Workbook OR Paste Shared Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  2A. Attach Completed Excel Workbook (.xlsx):
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-xl bg-emerald-50/40 cursor-pointer transition-colors text-xs font-semibold text-emerald-900">
                  <Upload className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="truncate">
                    {uploadedFileNames[activeProject.id]
                      ? `Attached: ${uploadedFileNames[activeProject.id]}`
                      : 'Choose Completed .xlsx File from Computer'}
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500">
                  Select the Excel workbook you saved after completing the
                  formulas and PivotTables.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  2B. Or Paste Shared Workbook Link (Google Sheets / OneDrive):
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={workbookLinks[activeProject.id] || ''}
                    onChange={(e) => {
                      setValidationError(null);
                      setWorkbookLinks((prev) => ({
                        ...prev,
                        [activeProject.id]: e.target.value,
                      }));
                    }}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Optional if you attached your <code>.xlsx</code> file on the
                  left.
                </p>
              </div>
            </div>

            {/* 3C: Executive Summary for Instructor */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                3. Write Your Executive Findings &amp; Recommendations for the
                Instructor:
              </label>
              <textarea
                rows={3}
                value={
                  executiveSummaries[activeProject.id] ??
                  projectSubmissions[activeProject.id]?.notes ??
                  ''
                }
                onChange={(e) => {
                  setValidationError(null);
                  setExecutiveSummaries((prev) => ({
                    ...prev,
                    [activeProject.id]: e.target.value,
                  }));
                }}
                placeholder={`Summarize your key numbers and recommendations for Project ${activeProject.projectNumber} (e.g., which branch/sector had the highest risk or margin erosion and what action management should take)...`}
                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {validationError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Your submission is recorded immediately and counts toward
                  unlocking your Official Academy Certificate ({submittedCount}
                  /4 submitted).
                </span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4 text-emerald-200" />
                <span>
                  {currentlySubmitted
                    ? `Update Project ${activeProject.projectNumber} Submission`
                    : `Submit Project ${activeProject.projectNumber} to Instructor`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ================================================================= */}
      {/* OFFICIAL ACADEMY CERTIFICATE SECTION ON THE PROJECT PAGE          */}
      {/* ================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-800">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>OFFICIAL ACADEMY DIPLOMA &amp; CERTIFICATE DOWNLOAD</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Download Your Certificate of Mastery
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Students must complete the entire 6-level course (all modules and
              all 6 level final exams) and submit all 4 final projects to the
              instructor before downloading the official certificate.
            </p>
          </div>

          {/* Certificate Name Editor */}
          {onUpdateStudentName && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shrink-0">
              <div className="text-[10px] font-mono uppercase text-slate-500">
                Name Printed on Certificate
              </div>
              {!editingName ? (
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-bold text-slate-900">
                    {studentName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(studentName);
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
          )}
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
              <span className="text-xs font-mono font-bold uppercase text-slate-600 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
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
                Complete All 6 Levels&apos; Modules
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {completedLessonsCount} of {totalLessonsCount} lessons completed
                ({lessonProgressPercent}%)
              </p>
            </div>
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
              <span className="text-xs font-mono font-bold uppercase text-slate-600 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
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
                {passedExamsCount} of {totalExamsCount} level exams passed (70%+
                required)
              </p>
            </div>
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
              <span className="text-xs font-mono font-bold uppercase text-slate-600 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                Requirement 3 of 3
              </span>
              {allProjectsSubmitted ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-800 text-white text-[10px] font-mono font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  Submitted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
                  Pending
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Submit All 4 Final Projects
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {submittedCount} of {totalProjectsCount} real-life projects
                submitted to instructor
              </p>
            </div>
          </div>
        </div>

        {/* CERTIFICATE DOWNLOAD / LOCK CALLOUT */}
        {isCertificateUnlocked ? (
          <div className="p-6 rounded-2xl bg-emerald-950 text-white border-2 border-emerald-600 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-800 text-emerald-200 text-xs font-mono font-bold uppercase">
                <CheckCircle2 className="w-4 h-4" />
                <span>Course &amp; Projects Completed · Certificate Unlocked!</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Certified Excel Data Analyst Diploma — {studentName}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                Congratulations! You have completed all 6 course levels, passed
                all {totalExamsCount} level exams, and submitted all{' '}
                {totalProjectsCount} real-life projects to Instructor Okoro
                Tochuwku. You can now download your official PDF certificate.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const masterCert = getCertificateDataForLevel(
                    'all',
                    studentName,
                    studentEmail || 'student@excelacademy.local',
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
                    studentName,
                    studentEmail || 'student@excelacademy.local',
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
                  Certificate Download is Locked Until Course &amp; Projects Are Completed
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl">
                  To download your certificate, please finish the remaining
                  requirements:{' '}
                  <strong>
                    {Math.max(0, totalLessonsCount - completedLessonsCount)}{' '}
                    module lesson(s)
                  </strong>{' '}
                  remaining,{' '}
                  <strong>
                    {Math.max(0, totalExamsCount - passedExamsCount)} level
                    exam(s)
                  </strong>{' '}
                  remaining, and{' '}
                  <strong>
                    {Math.max(0, totalProjectsCount - submittedCount)} final
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
              <span>Locked — Complete Course &amp; Projects First</span>
            </button>
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
            if (onUpdateStudentName) {
              onUpdateStudentName(newName);
            }
            setPreviewCertificate((prev) =>
              prev ? { ...prev, studentName: newName } : null
            );
          }}
        />
      )}
    </div>
  );

  if (standalonePage) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">{content}</div>
      </div>
    );
  }

  return content;
};
