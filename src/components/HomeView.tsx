import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  BookOpen,
  Play,
  Check,
  Lock,
  Sparkles,
  Award,
  Crown,
  ShieldCheck,
  TrendingUp,
  MessageCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Course, CurriculumLevel } from '../types/academy';
import { FAQ_ITEMS, LEARNING_OUTCOMES, LEVEL_6_PROJECTS } from '../data/curriculumData';
import { AppView } from './Navbar';
import { downloadDemoCsvFile } from '../utils/downloadCsv';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeViewProps {
  course: Course;
  levels: CurriculumLevel[];
  isAuthenticated: boolean;
  onNavigate: (view: AppView, sectionId?: string) => void;
  onSelectLevelInCurriculum: (levelNumber: number) => void;
  onStartLesson: (lessonId: string) => void;
  onOpenAuthModal: (tab: 'login' | 'register' | 'instructor' | 'checkout') => void;
  onOpenLegalModal: (docType: 'privacy' | 'terms' | 'refund' | 'contact') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  course,
  levels,
  isAuthenticated,
  onNavigate,
  onSelectLevelInCurriculum,
  onStartLesson,
  onOpenAuthModal,
  onOpenLegalModal,
}) => {
  const [selectedShowcaseProjectIdx, setSelectedShowcaseProjectIdx] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const activeShowcaseProject = LEVEL_6_PROJECTS[selectedShowcaseProjectIdx] || LEVEL_6_PROJECTS[0];

  const totalModulesCount = levels.reduce((sum, lvl) => sum + lvl.modules.length, 0);
  const totalLessonsCount = levels.reduce(
    (sum, lvl) => sum + lvl.modules.reduce((mSum, m) => mSum + m.lessons.length, 0),
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#080C14] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. LUXURY HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-amber-500/15">
        {/* Ambient Radial Luxury Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Brand Message & Luxury CTAs */}
            <div className="lg:col-span-6 space-y-7">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold tracking-wide">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>PREMIUM EXECUTIVE ANALYST TRACK</span>
                  <span aria-hidden="true" className="text-amber-500/50">·</span>
                  <span>6 STRUCTURED LEVELS</span>
                </div>

                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-100"
                  style={{ textWrap: 'balance' }}
                >
                  Learn Excel with{' '}
                  <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-emerald-300 text-transparent bg-clip-text">
                    TK the Analyst
                  </span>
                  . Become a Data Analyst.
                </h1>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
                  Learn Excel from scratch with Lead Instructor Okoro Tochuwku (TK the Analyst), master data analysis step by step, and build the practical skills to clean data, analyse information, and create professional executive dashboards.
                </p>

                <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                  Master spreadsheet mechanics through practical video lessons, downloadable Excel workbooks, real-world commercial datasets, and 6 portfolio-ready analytics capstone projects.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-6 pt-2">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('curriculum')}
                    className="px-7 py-4 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2.5 cursor-pointer"
                  >
                    <span>Explore the Curriculum</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartLesson('lvl-1-mod-1-les-1')}
                    className="px-6 py-4 text-sm font-semibold text-amber-200 bg-slate-900/90 border border-amber-500/35 rounded-xl hover:bg-slate-800/90 hover:border-amber-400 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
                  >
                    {isAuthenticated ? (
                      <>
                        <Play className="w-4 h-4 text-emerald-400 fill-current" />
                        <span>Resume Classroom</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>Start Free Level 1 Lesson</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://wa.me/2347080145682?text=Hello%20Lead%20Instructor%20Okoro,%20I%20have%20a%20question%20about%20the%20Excel%20Academy."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-4 text-sm font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-xl hover:bg-emerald-900/50 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-current text-emerald-400" />
                    <span>WhatsApp TK (07080145682)</span>
                  </a>
                </div>

                {/* Mobile PWA Installation Prompter Banner */}
                <PWAInstallButton variant="banner" className="mt-2" />

                {/* Factual Metrics Card */}
                <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs text-slate-400">
                  <div className="space-y-1">
                    <div className="font-mono font-bold text-lg text-amber-300 tabular-nums">6 Levels</div>
                    <div className="text-[11px] text-slate-400">Zero to Capstone</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-mono font-bold text-lg text-amber-300 tabular-nums">
                      {totalModulesCount} Modules · {totalLessonsCount} Lessons
                    </div>
                    <div className="text-[11px] text-slate-400">Practical Walkthroughs</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-mono font-bold text-lg text-amber-300 tabular-nums">6 Capstones</div>
                    <div className="text-[11px] text-slate-400">Downloadable XLSX Labs</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Lead Instructor Cutout Portrait on Luxury Gold Halo */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="relative w-full max-w-md mx-auto lg:max-w-lg">
                {/* Glowing Halo Backdrop */}
                <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 blur-xl opacity-75" />

                <div className="relative w-full h-[450px] sm:h-[490px] lg:h-[520px] rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-[#111827] via-[#0B0F19] to-[#0A0E1A] shadow-2xl flex items-end justify-center">
                  {/* Grid Lines */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(212, 175, 55, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(212, 175, 55, 0.15) 1px, transparent 1px)',
                      backgroundSize: '36px 36px',
                    }}
                  />
                  {/* Radial Spotlight */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

                  <img
                    src="/assets/aistudio/instructor_cutout.png"
                    alt="Lead Instructor Okoro Tochuwku (TK the Analyst)"
                    className="relative z-10 w-auto h-[96%] max-w-full object-contain object-bottom select-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)]"
                  />

                  {/* Glassmorphic Instructor Badge */}
                  <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-950/90 backdrop-blur-xl border border-amber-500/35 rounded-xl p-3.5 shadow-2xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Lead Instructor · TK the Analyst</span>
                      </div>
                      <div className="text-sm sm:text-base font-bold text-slate-100 tracking-tight">
                        Okoro Tochuwku
                      </div>
                      <div className="text-xs text-amber-300 font-medium leading-snug">
                        Data Analyst with 4 years of experience in the financial services industry
                      </div>
                      <div className="text-[11px] text-slate-400 pt-0.5">
                        WhatsApp Helpline: <code className="text-amber-300 font-mono font-semibold">07080145682</code>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right text-[11px] font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-500/35 px-3 py-1.5 rounded-lg shrink-0">
                      Full Unrestricted Access
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LUXURY COMPETENCY OUTCOMES */}
      <section className="py-20 lg:py-28 bg-[#0B0F19] border-b border-amber-500/10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Core Practical Analyst Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight" style={{ textWrap: 'balance' }}>
              What You Will Learn to Build and Analyse with TK the Analyst
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Every module equips you with workplace spreadsheet skills used in financial modeling, sales forecasting, operations, and commercial decision-making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LEARNING_OUTCOMES.map((item) => (
              <div
                key={item.index}
                className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-amber-400 font-bold px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                      0{item.index}. CORE CAPABILITY
                    </span>
                    <TrendingUp className="w-4 h-4 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-200 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[11px] text-slate-500 font-mono">Example Formula / Workflow</div>
                  <code className="block text-xs font-mono text-emerald-300 bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 overflow-x-auto whitespace-nowrap">
                    {item.formulaExample}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SIX-LEVEL CURRICULUM PATH IN LUXURY CARDS */}
      <section className="py-20 lg:py-28 bg-[#080C14] border-b border-amber-500/10" id="curriculum-preview">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                Structured 6-Stage Masterclass
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight" style={{ textWrap: 'balance' }}>
                A Logical Progression from Your First Cell Entry to Executive Dashboards
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                Level 1 is free for all students upon registration. Levels 2–6 unlock with lifetime enrolment.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('curriculum')}
              className="px-6 py-3.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer shadow-lg shadow-amber-500/15"
            >
              Browse Complete 6-Level Curriculum
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level) => {
              const isLevel1 = level.levelNumber === 1;
              return (
                <div
                  key={level.levelNumber}
                  className={`border rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 backdrop-blur-md ${
                    isLevel1
                      ? 'bg-gradient-to-b from-emerald-950/30 via-slate-900/90 to-slate-950 border-emerald-500/40 shadow-xl shadow-emerald-500/5'
                      : 'bg-slate-900/70 border-slate-800 hover:border-amber-500/35'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={`px-2.5 py-1 rounded font-bold ${isLevel1 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        LEVEL 0{level.levelNumber}
                      </span>
                      <span className="text-slate-400">{level.modules.length} Modules</span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-100">{level.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{level.shortDescription}</p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-800">
                      <div className="text-xs font-semibold text-slate-300">Key Skills Mastered:</div>
                      <ul className="space-y-1.5 text-xs text-slate-400">
                        {level.keySkills.map((skill, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold select-none">·</span>
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-amber-300">Practical Outcome: </span>
                      {level.practicalOutcome}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectLevelInCurriculum(level.levelNumber)}
                      className={`w-full py-3 px-4 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isLevel1
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-500/20'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>View Level {level.levelNumber} Lessons</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. CAPSTONE PORTFOLIO SHOWCASE */}
      <section className="py-20 lg:py-28 bg-[#0B0F19] border-b border-amber-500/10" id="project-showcase">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Level 6 Portfolio Projects Preview</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight" style={{ textWrap: 'balance' }}>
              Real-World Analytics Projects You Will Build
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Master hands-on commercial reporting with realistic business datasets provided in Level 6.
            </p>
          </div>

          {/* Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900/90 rounded-2xl border border-slate-800">
            {LEVEL_6_PROJECTS.map((proj, index) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => setSelectedShowcaseProjectIdx(index)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedShowcaseProjectIdx === index
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                0{proj.projectNumber}. {proj.title}
              </button>
            ))}
          </div>

          {/* Active Showcase Project Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
            <div className="lg:col-span-5 space-y-5">
              <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                <span className="font-bold text-amber-300">Project 0{activeShowcaseProject.projectNumber}</span>
                <span aria-hidden="true">·</span>
                <span>{activeShowcaseProject.category}</span>
              </div>

              <h3 className="text-2xl font-bold text-slate-100">{activeShowcaseProject.title}</h3>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-300">Business Problem:</div>
                <p className="text-sm text-slate-400 leading-relaxed">{activeShowcaseProject.businessProblem}</p>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-300">Excel Skills Applied:</div>
                <div className="text-xs text-amber-300 font-mono leading-relaxed">
                  {activeShowcaseProject.requiredExcelSkills.join(' · ')}
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      onOpenAuthModal('login');
                      return;
                    }
                    downloadDemoCsvFile(
                      `Demo_Project_${activeShowcaseProject.projectNumber}_${activeShowcaseProject.title.replace(/\s+/g, '_')}.csv`,
                      activeShowcaseProject.sampleCsvContent
                    );
                  }}
                  className="px-5 py-3 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-emerald-400 rounded-xl hover:from-amber-300 hover:to-emerald-300 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-md"
                >
                  {isAuthenticated ? (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Practice Dataset (.CSV)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Log In to Download Dataset</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Table Preview */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-900 text-slate-200 px-4 py-3 flex items-center justify-between text-xs font-mono border-b border-slate-800">
                <span className="text-amber-400 font-semibold">
                  Dataset Sample — {activeShowcaseProject.title}
                </span>
                <span className="text-slate-400">Rows 1–5</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="bg-slate-900/90 text-amber-300 border-b border-slate-800">
                      {activeShowcaseProject.sampleHeaders.map((hdr) => (
                        <th key={hdr} className="py-2.5 px-3 border-r border-slate-800 last:border-r-0 whitespace-nowrap">
                          {hdr}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {activeShowcaseProject.sampleRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/50">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`py-2.5 px-3 border-r border-slate-800 last:border-r-0 whitespace-nowrap ${
                              typeof cell === 'number' ? 'text-right text-emerald-300' : 'text-left'
                            }`}
                          >
                            {typeof cell === 'number' ? cell.toLocaleString() : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-amber-500/5 border-t border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-amber-300">Executive Finding in Model Solution:</div>
                <p className="text-slate-400">{activeShowcaseProject.modelSolutionExplanation}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INSTRUCTOR SPOTLIGHT & ONE-TIME TUITION ENROLMENT */}
      <section className="py-20 lg:py-28 bg-[#080C14] border-b border-amber-500/10" id="about-academy">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: About & Who This Serves */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                  Instruction by TK the Analyst
                </div>
                <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
                  Designed for Practical Office and Commercial Impact
                </h2>
                <p className="text-slate-400 text-base leading-relaxed">
                  Excel to Data Analyst Academy bridges the gap between basic data entry and genuine business intelligence. Learn directly from Lead Instructor Okoro Tochuwku (TK the Analyst) through step-by-step video walkthroughs.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-amber-300">Who This Platform Is Built For:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
                  {[
                    'Complete Excel beginners starting from zero',
                    'University students and recent graduates',
                    'Job seekers building verifiable analytical skills',
                    'Office workers and administrative professionals',
                    'Small business owners tracking finances',
                    'Career changers transitioning into data analysis',
                    'Operations, finance, and sales professionals',
                  ].map((aud) => (
                    <div key={aud} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{aud}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Luxury Tuition Card */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-white rounded-2xl p-7 lg:p-8 space-y-6 border border-amber-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-2 border-b border-slate-800 pb-5">
                <div className="text-xs font-mono font-bold text-amber-400 tracking-widest">ONE-TIME TUITION · LIFETIME ACCESS</div>
                <h3 className="text-2xl font-bold">{course.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Single one-time payment for lifetime access to all 6 levels, datasets, quizzes, and project briefs.
                </p>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold font-mono text-amber-300 tabular-nums">
                  {course.currency === 'NGN' ? '₦' : `${course.currency} `}
                  {course.oneTimePrice.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">One-time payment · No subscription</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                {[
                  'All 6 Learning Levels & 54 Structured Modules',
                  'Video Lessons with TK the Analyst',
                  'Downloadable Excel Datasets (.CSV / .XLSX)',
                  'Skill-Check Quizzes with Explanations',
                  '6 Portfolio Projects & Level Completion Certificates',
                  'Direct WhatsApp Instructor Helpline (07080145682)',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('checkout')}
                  className="w-full py-4 px-5 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Enrol for Lifetime Access
                </button>

                <button
                  type="button"
                  onClick={() => onStartLesson('lvl-1-mod-1-les-1')}
                  className="w-full py-3 px-5 text-xs font-semibold text-amber-200 bg-slate-900 border border-amber-500/25 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAuthenticated ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                      <span>Open Classroom</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Take Free Level 1 Lesson</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQS SECTION */}
      <section className="py-20 lg:py-28 bg-[#0B0F19] border-b border-amber-500/10" id="faq">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          <div className="space-y-2 text-center">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Questions & Answers</div>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/80 backdrop-blur-md">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={faq.question} className="bg-slate-900/60">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-semibold text-slate-100">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. LUXURY FOOTER */}
      <footer className="bg-[#05080E] text-slate-400 py-14 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800">
            <div className="md:col-span-5 space-y-3">
              <div className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                <span>Excel to Data Analyst Academy</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono">TK THE ANALYST</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Learn Excel with TK the Analyst. Become a Data Analyst. Structured 6-level practical training in spreadsheet mechanics, formulas, data cleaning, PivotTables, dashboards, and portfolio projects.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2.5 text-xs">
              <div className="font-semibold text-amber-300">Navigation</div>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('home', 'about-academy')}
                    className="hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    About the Academy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('curriculum')}
                    className="hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Curriculum (Levels 1–6)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('playground')}
                    className="hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Formula Playground (Live)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('shortcuts')}
                    className="hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Shortcuts Coach (Speed Drills)
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-2.5 text-xs">
              <div className="font-semibold text-amber-300">Support & Instructor Helpline</div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://wa.me/2347080145682?text=Hello%20Lead%20Instructor%20Okoro,%20I%20have%20a%20question."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 font-semibold hover:underline flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp TK (07080145682)</span>
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal('contact')}
                    className="hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Contact & Support
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal('refund')}
                    className="hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    14-Day Refund Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} Excel to Data Analyst Academy. All rights reserved.
            </div>
            <div>
              Instructed by Lead Instructor Okoro Tochuwku (TK the Analyst)
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
