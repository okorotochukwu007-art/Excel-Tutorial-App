import React, { useState } from 'react';
import {
  Briefcase,
  Download,
  FileSpreadsheet,
  FileCheck2,
  CheckCircle2,
  Award,
  Sparkles,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Table,
  Check,
  RotateCcw,
  BookOpen,
  Send,
  Eye,
  Info,
} from 'lucide-react';
import {
  CAPSTONE_PROJECTS,
  CapstoneProject,
  CapstoneRubricDimension,
} from '../data/capstoneProjectsData';
import {
  downloadCapstoneStarterWorkbook,
  downloadCapstoneSolutionWorkbook,
} from '../utils/capstoneWorkbookGenerator';
import { ProjectSubmissionState, Profile } from '../types/academy';

interface CapstonePortfolioViewProps {
  student: Profile;
  projectSubmissions: Record<string, ProjectSubmissionState>;
  onToggleProjectChecklist: (projectId: string, itemIdx: number) => void;
  onSubmitCapstoneProject?: (
    projectId: string,
    score: number,
    notes: string,
    rubricScores: Record<string, number>
  ) => void;
  onNavigateToClassroom?: (lessonId: string) => void;
}

export const CapstonePortfolioView: React.FC<CapstonePortfolioViewProps> = ({
  student,
  projectSubmissions,
  onToggleProjectChecklist,
  onSubmitCapstoneProject,
  onNavigateToClassroom,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    CAPSTONE_PROJECTS[0].id
  );
  const [activeSubTab, setActiveSubTab] = useState<'brief' | 'rubric' | 'preview'>('brief');

  // Rubric self-assessment points state: dimensionId -> points
  const [rubricScores, setRubricScores] = useState<Record<string, Record<string, number>>>({
    'capstone-1-ecommerce-dashboard': {
      'data-hygiene': 25,
      'formula-accuracy': 25,
      'visual-hierarchy': 20,
      'executive-insights': 25,
    },
    'capstone-2-pl-budget-variance': {
      'data-hygiene': 25,
      'formula-accuracy': 20,
      'visual-hierarchy': 25,
      'executive-insights': 20,
    },
    'capstone-3-churn-cohort-matrix': {
      'data-hygiene': 25,
      'formula-accuracy': 25,
      'visual-hierarchy': 20,
      'executive-insights': 25,
    },
  });

  const [executiveNotes, setExecutiveNotes] = useState<Record<string, string>>({
    'capstone-1-ecommerce-dashboard':
      'Identified that Direct Wholesale generates 52% of total order volume but only 18% gross margin due to unconstrained tier discounting. Recommending a minimum order quantity (MOQ) policy to preserve operating margins.',
    'capstone-2-pl-budget-variance':
      'Full year ARR closed $340,000 above budget (+4.8%), offsetting an unbudgeted 14.2% spike in S&M event sponsorships. Net Operating EBITDA achieved 18.1% margin vs 16.9% target.',
    'capstone-3-churn-cohort-matrix':
      'Retention analysis indicates Month 1 customer drop-off is 18.5%, while customers surviving past Month 3 display an 82% annual retention rate. Recommending dedicated onboarding CS check-ins within the first 14 days.',
  });

  const [submittedStatus, setSubmittedStatus] = useState<Record<string, boolean>>({
    'capstone-1-ecommerce-dashboard': true, // seeded demo state
  });

  const activeProject =
    CAPSTONE_PROJECTS.find((p) => p.id === selectedProjectId) ||
    CAPSTONE_PROJECTS[0];

  const currentProjectSubmission = projectSubmissions[activeProject.id] || {
    projectId: activeProject.id,
    completedChecklistItems: [0, 1, 2],
    notes: '',
    status: 'in_progress',
  };

  const currentRubric = rubricScores[activeProject.id] || {
    'data-hygiene': 20,
    'formula-accuracy': 20,
    'visual-hierarchy': 20,
    'executive-insights': 20,
  };

  const totalRubricScore = Object.values(currentRubric).reduce((a, b) => a + b, 0);

  const handleRubricScoreChange = (dimId: string, pts: number) => {
    setRubricScores((prev) => ({
      ...prev,
      [activeProject.id]: {
        ...prev[activeProject.id],
        [dimId]: pts,
      },
    }));
  };

  const handleNotesChange = (text: string) => {
    setExecutiveNotes((prev) => ({
      ...prev,
      [activeProject.id]: text,
    }));
  };

  const handleSubmitProject = () => {
    setSubmittedStatus((prev) => ({
      ...prev,
      [activeProject.id]: true,
    }));
    if (onSubmitCapstoneProject) {
      onSubmitCapstoneProject(
        activeProject.id,
        totalRubricScore,
        executiveNotes[activeProject.id] || '',
        currentRubric
      );
    }
  };

  const completedChecklistCount =
    currentProjectSubmission.completedChecklistItems?.length || 0;
  const totalChecklistCount = activeProject.deliverableChecklist.length;
  const isCertified = submittedStatus[activeProject.id];

  return (
    <div className="space-y-6">
      {/* CAPSTONE HERO BANNER */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Level 6 Flagship Portfolio Capstones</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Enterprise Business Capstones &amp; Portfolio Showcase
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Solve full-scale commercial problems with realistic multi-tab Excel
              models. Self-assess against rigorous enterprise rubrics, download
              starter and solution workbooks, and build a verified portfolio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-center shrink-0">
              <div className="text-xl font-mono font-black text-emerald-400">3</div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Capstones
              </div>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-center shrink-0">
              <div className="text-xl font-mono font-black text-amber-400">100</div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Rubric Pts
              </div>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-center shrink-0">
              <div className="text-xl font-mono font-black text-blue-400">.XLSX</div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">
                Live Files
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-CAPSTONE SELECTOR TABS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {CAPSTONE_PROJECTS.map((proj) => {
          const isSelected = proj.id === selectedProjectId;
          const isDone = submittedStatus[proj.id];

          return (
            <button
              key={proj.id}
              type="button"
              onClick={() => setSelectedProjectId(proj.id)}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                  : 'bg-white/80 border-slate-200 hover:border-slate-400 hover:bg-white'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-emerald-800">
                    Project 0{proj.projectNumber}
                  </span>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3 text-emerald-700" />
                      CERTIFIED
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {proj.difficulty}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                  {proj.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {proj.businessScenario}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100">
                <span>{proj.industry}</span>
                <span>~{proj.estimatedHours} hrs</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ACTIVE CAPSTONE MAIN WORKSPACE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Workspace Sub-Navigation */}
        <div className="border-b border-slate-200 px-6 pt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveSubTab('brief')}
              className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'brief'
                  ? 'border-emerald-700 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4 text-emerald-700" />
              <span>Project Brief &amp; Workbooks</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('rubric')}
              className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'rubric'
                  ? 'border-emerald-700 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>Enterprise Rubric &amp; Submission</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                {totalRubricScore}/100 pts
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('preview')}
              className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'preview'
                  ? 'border-emerald-700 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Table className="w-4 h-4 text-emerald-700" />
              <span>Model Dataset &amp; Formulas Preview</span>
            </button>
          </div>

          {/* Certification Badge Status */}
          {isCertified && (
            <div className="pb-3 flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Verified Portfolio Credential Active</span>
            </div>
          )}
        </div>

        {/* SUBTAB 1: PROJECT BRIEF & DUAL WORKBOOK DOWNLOADS */}
        {activeSubTab === 'brief' && (
          <div className="p-6 space-y-6">
            {/* Context & Scenario Card */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider">
                    {activeProject.heroBadge} · {activeProject.category}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">
                    {activeProject.title}
                  </h2>
                  <div className="text-xs text-slate-500 font-medium">
                    {activeProject.subtitle}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Est. Completion: ~{activeProject.estimatedHours} Hours</span>
                </div>
              </div>

              <div className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-xl space-y-2 text-xs leading-relaxed">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Enterprise Business Scenario:
                </div>
                <p className="text-slate-700">{activeProject.businessScenario}</p>
                <div className="pt-2 border-t border-slate-200 text-slate-600">
                  <strong className="text-slate-900">Problem Statement: </strong>
                  {activeProject.problemStatement}
                </div>
              </div>
            </div>

            {/* DUAL WORKBOOK DOWNLOAD CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* STARTER WORKBOOK */}
              <div className="p-5 bg-white border-2 border-emerald-600/40 rounded-xl space-y-3 hover:border-emerald-700 transition-colors shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold">
                      Starter Challenge Workbook
                    </span>
                    <span className="font-mono text-xs text-slate-400">.XLSX</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 font-mono">
                    {activeProject.starterWorkbookName}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Includes an Instructions sheet, raw unformatted transaction
                    data, and deliverable checklist. Build your tables, PivotTables,
                    and executive dashboard here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadCapstoneStarterWorkbook(activeProject)}
                  className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-200" />
                  <span>Download Starter Workbook (.xlsx)</span>
                </button>
              </div>

              {/* SOLUTION REFERENCE WORKBOOK */}
              <div className="p-5 bg-white border-2 border-slate-900 rounded-xl space-y-3 hover:border-slate-800 transition-colors shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[11px] font-bold">
                      Completed Model Solution
                    </span>
                    <span className="font-mono text-xs text-slate-400">.XLSX</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 font-mono">
                    {activeProject.solutionWorkbookName}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    100/100 benchmark reference file. Contains live structured
                    formulas, completed PivotTables, executive KPI scorecards, and
                    formatted management variance memo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadCapstoneSolutionWorkbook(activeProject)}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>Download Reference Solution (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Core Objectives & Deliverables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Core Project Deliverables</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-700">
                  {activeProject.keyObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-emerald-800 shrink-0">
                        {i + 1}.
                      </span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Executive Findings &amp; Insights</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-700">
                  {activeProject.executiveTakeaways.map((takeaway, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: ENTERPRISE RUBRIC & INTERACTIVE SUBMISSION */}
        {activeSubTab === 'rubric' && (
          <div className="p-6 space-y-6">
            {/* Progress Header */}
            <div className="p-5 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-mono text-emerald-400 uppercase">
                  Institutional Evaluation Standard
                </div>
                <h3 className="text-base font-bold">
                  Enterprise Capstone Grading Rubric (100 Points Total)
                </h3>
                <p className="text-xs text-slate-300">
                  Rate your submission across all 4 corporate competencies to
                  certify your portfolio.
                </p>
              </div>

              <div className="text-right">
                <div className="text-3xl font-black font-mono text-emerald-400">
                  {totalRubricScore} / 100
                </div>
                <div className="text-xs text-slate-400 font-semibold">
                  {totalRubricScore >= 85
                    ? '★ Passed with Distinction'
                    : totalRubricScore >= 70
                    ? '✓ Passed Enterprise Benchmark'
                    : 'Requires Review'}
                </div>
              </div>
            </div>

            {/* 4 Rubric Dimensions */}
            <div className="space-y-4">
              {activeProject.rubric.map((dim) => {
                const currentScore = currentRubric[dim.id] || 20;

                return (
                  <div
                    key={dim.id}
                    className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {dim.name}
                        </h4>
                        <p className="text-xs text-slate-500">{dim.description}</p>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 rounded-lg font-mono text-xs font-bold text-slate-800">
                        {currentScore} / {dim.maxPoints} pts
                      </span>
                    </div>

                    {/* Criteria Radio Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {dim.criteria.map((crit) => {
                        const isSelected = currentScore === crit.points;

                        return (
                          <div
                            key={crit.points}
                            onClick={() =>
                              handleRubricScoreChange(dim.id, crit.points)
                            }
                            className={`p-3 rounded-lg border text-left cursor-pointer transition-all space-y-1 ${
                              isSelected
                                ? 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600 shadow-xs'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[11px] font-bold ${
                                  isSelected ? 'text-emerald-900' : 'text-slate-700'
                                }`}
                              >
                                {crit.level}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-800">
                                {crit.points} pts
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">
                              {crit.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deliverables Checklist */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  Step-by-Step Deliverable Verification Checklist
                </h4>
                <span className="text-xs font-mono text-slate-600 font-semibold">
                  {completedChecklistCount} / {totalChecklistCount} Completed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeProject.deliverableChecklist.map((item, idx) => {
                  const checked =
                    currentProjectSubmission.completedChecklistItems?.includes(idx);

                  return (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                        checked
                          ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onToggleProjectChecklist(activeProject.id, idx)
                        }
                        className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                      />
                      <div className="space-y-0.5">
                        <div
                          className={`font-semibold ${
                            checked ? 'text-emerald-950 font-bold' : 'text-slate-900'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.details}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Executive Memo Written Submission */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Executive Findings &amp; Commercial Recommendations Memo:
                </span>
                <span className="text-slate-500 text-[11px]">
                  Cite exact revenue, margin %, or churn findings from your model
                </span>
              </div>
              <textarea
                rows={4}
                value={executiveNotes[activeProject.id] || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Draft your 3 to 4-bullet executive memo citing exact figures..."
                className="w-full p-3.5 bg-white border border-slate-300 rounded-xl font-sans text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Submit & Certify Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                {isCertified ? (
                  <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Project Certified &amp; Included in Your Verified Portfolio</span>
                  </span>
                ) : (
                  <span>
                    Ready to submit your analysis? Certified capstones boost your
                    overall Mastery score.
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmitProject}
                className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4 text-emerald-200" />
                <span>
                  {isCertified
                    ? 'Update Capstone Submission'
                    : 'Submit for Portfolio Certification'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB 3: MODEL DATASET & FORMULA ARCHITECTURE PREVIEW */}
        {activeSubTab === 'preview' && (
          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Model Dataset Sample &amp; Formula Architecture
              </h3>
              <p className="text-xs text-slate-500">
                Preview the data structure and core formula syntax used in the
                official benchmark solution.
              </p>
            </div>

            {/* Sample Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    {activeProject.sampleHeaders.map((hdr) => (
                      <th
                        key={hdr}
                        className="py-2.5 px-3.5 border-r border-slate-200 font-semibold whitespace-nowrap"
                      >
                        {hdr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 bg-white">
                  {activeProject.samplePreviewRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="py-2 px-3.5 border-r border-slate-200 whitespace-nowrap"
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

            {/* Formula Architecture List */}
            <div className="p-5 bg-slate-950 text-white rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                <span className="font-bold">Enterprise Formulas Implemented</span>
                <span>Dynamic References</span>
              </div>
              <div className="space-y-2">
                {activeProject.requiredFormulas.map((f, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-emerald-300"
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
