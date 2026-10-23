import React, { useState } from 'react';
import {
  Search,
  Play,
  Download,
  ChevronDown,
  ChevronUp,
  Check,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import { CurriculumLevel } from '../types/academy';
import { LEVEL_6_PROJECTS } from '../data/curriculumData';
import { downloadDemoCsvFile } from '../utils/downloadCsv';
import { downloadStarterWorkbook } from '../utils/excelWorkbookGenerator';

interface CurriculumViewProps {
  levels: CurriculumLevel[];
  selectedLevelFilter: number | 'all';
  onChangeLevelFilter: (level: number | 'all') => void;
  completedLessonIds: string[];
  isAuthenticated: boolean;
  isPurchased?: boolean;
  isInstructor?: boolean;
  onStartLesson: (lessonId: string) => void;
  onRequireAuth: () => void;
  onOpenCheckout: () => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  levels,
  selectedLevelFilter,
  onChangeLevelFilter,
  completedLessonIds,
  isAuthenticated,
  isPurchased = false,
  isInstructor = false,
  onStartLesson,
  onRequireAuth,
  onOpenCheckout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFreePreview, setOnlyFreePreview] = useState(false);
  const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>([
    'lvl-1-mod-1',
    'lvl-2-mod-1',
    'lvl-3-mod-1',
    'lvl-4-mod-1',
    'lvl-5-mod-1',
    'lvl-6-mod-1',
  ]);
  const [expandedProjectIds, setExpandedProjectIds] = useState<string[]>(['proj-1-sales-performance']);

  // Build flat ordered array of all lesson IDs to check sequential unlocking
  const allOrderedLessonIds: string[] = [];
  levels.forEach((l) => {
    l.modules.forEach((m) => {
      m.lessons
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .forEach((les) => allOrderedLessonIds.push(les.id));
    });
  });

  const toggleModule = (modId: string) => {
    setExpandedModuleIds((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const toggleProject = (projId: string) => {
    setExpandedProjectIds((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  };

  const filteredLevels = levels
    .filter((lvl) => selectedLevelFilter === 'all' || lvl.levelNumber === selectedLevelFilter)
    .map((lvl) => {
      const filteredModules = lvl.modules
        .map((mod) => {
          const matchingLessons = mod.lessons.filter((les) => {
            if (onlyFreePreview && !les.isFreePreview) return false;
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
              les.title.toLowerCase().includes(q) ||
              les.description.toLowerCase().includes(q) ||
              mod.title.toLowerCase().includes(q) ||
              les.keyFormulas.some((f) => f.toLowerCase().includes(q))
            );
          });
          return { ...mod, lessons: matchingLessons };
        })
        .filter((mod) => mod.lessons.length > 0);

      return { ...lvl, modules: filteredModules };
    })
    .filter((lvl) => lvl.modules.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="text-xs font-medium text-emerald-800 flex items-center gap-2">
              <span>Complete 6-Level Syllabus · 54 Modules · 108 Guided Video Lessons & Labs</span>
              {isInstructor && (
                <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-[10px] font-bold">
                  INSTRUCTOR FULL UNRESTRICTED ACCESS
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Excel to Data Analyst Curriculum
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {isInstructor
                ? 'Lead Instructor Okoro Tochuwku: You have full, unrestricted access to all 6 levels and all exercises. Click any lesson to launch it immediately.'
                : isAuthenticated
                ? 'Level 1 is free for all registered learners. Enrol in the Full Academy to unlock Levels 2–6. Within unlocked levels, complete each exercise before moving on to the next.'
                : 'Level 1 is free for all students upon sign up. Enrol anytime for lifetime access to Levels 2–6.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
            {!isAuthenticated && (
              <button
                type="button"
                onClick={onRequireAuth}
                className="px-5 py-3 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Log In to Start Level 1
              </button>
            )}
            {(!isPurchased && !isInstructor) && (
              <button
                type="button"
                onClick={onOpenCheckout}
                className="px-5 py-3 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Enrol to Unlock Levels 2–6
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Segmented Level Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => onChangeLevelFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedLevelFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All 6 Levels
            </button>
            {levels.map((lvl) => (
              <button
                key={lvl.levelNumber}
                type="button"
                onClick={() => onChangeLevelFilter(lvl.levelNumber)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedLevelFilter === lvl.levelNumber
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Level {lvl.levelNumber}
              </button>
            ))}
          </div>

          {/* Search & Free Preview Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lessons or formulas (e.g. XLOOKUP)..."
                aria-label="Search curriculum lessons or formulas"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-700"
              />
            </div>

            <button
              type="button"
              onClick={() => setOnlyFreePreview(!onlyFreePreview)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                onlyFreePreview
                  ? 'bg-emerald-900 text-white border-emerald-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {onlyFreePreview ? 'Showing Free Previews Only' : 'Filter Free Previews'}
            </button>
          </div>
        </div>
      </div>

      {/* Levels & Modules Listing */}
      {filteredLevels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <div className="text-base font-semibold text-slate-900">No matching modules or lessons found</div>
          <p className="text-xs text-slate-600">
            Try clearing your search query or switching back to "All 6 Levels".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setOnlyFreePreview(false);
              onChangeLevelFilter('all');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredLevels.map((level) => (
            <section
              key={level.levelNumber}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              {/* Level Banner */}
              <div className="bg-slate-900 text-white p-6 lg:p-8 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-emerald-400">
                  <span>LEVEL 0{level.levelNumber} OF 06</span>
                  <span>
                    {level.modules.length} Modules · Practical Outcome Included
                  </span>
                </div>
                <h2 className="text-2xl font-bold">{level.title}</h2>
                <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">{level.goal} {level.shortDescription}</p>
                <div className="pt-2 text-xs text-slate-300">
                  <span className="font-semibold text-amber-300">Level Practical Outcome: </span>
                  {level.practicalOutcome}
                </div>
              </div>

              {/* Modules Accordion List */}
              <div className="divide-y divide-slate-200">
                {level.modules.map((mod) => {
                  const isExpanded = expandedModuleIds.includes(mod.id);
                  const completedInMod = mod.lessons.filter((l) =>
                    completedLessonIds.includes(l.id)
                  ).length;

                  return (
                    <div key={mod.id} className="bg-white">
                      <button
                        type="button"
                        onClick={() => toggleModule(mod.id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <span>
                              Module {level.levelNumber}.{mod.orderIndex}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{mod.lessons.length} Lessons</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {isAuthenticated
                                ? `${completedInMod}/${mod.lessons.length} Completed`
                                : 'Syllabus Preview'}
                            </span>
                          </div>
                          <div className="text-base font-semibold text-slate-900">{mod.title}</div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-slate-500 hidden sm:inline">
                            {isExpanded ? 'Hide Lessons' : 'Show Lessons'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="bg-[#FAF9F5] border-t border-slate-200 px-6 py-4 space-y-3">
                          {mod.lessons.map((lesson) => {
                            const isDone = isAuthenticated && completedLessonIds.includes(lesson.id);
                            const isLevelLocked = level.levelNumber > 1 && !isPurchased && !isInstructor;
                            const lesIdx = allOrderedLessonIds.indexOf(lesson.id);
                            const isSeqLocked =
                              !isInstructor &&
                              lesIdx > 0 &&
                              !completedLessonIds.includes(allOrderedLessonIds[lesIdx - 1]);

                            return (
                              <div
                                key={lesson.id}
                                className={`bg-white border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                                  isLevelLocked || isSeqLocked ? 'border-amber-200/80 bg-amber-50/20' : 'border-slate-200'
                                }`}
                              >
                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                                    <span>
                                      Lesson {mod.orderIndex}.{lesson.orderIndex}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span>{lesson.durationMinutes} min</span>
                                    <span aria-hidden="true">·</span>
                                    {isLevelLocked ? (
                                      <span className="text-amber-800 font-bold flex items-center gap-1">
                                        <Lock className="w-3 h-3 text-amber-700" />
                                        <span>Level {level.levelNumber} Enrolment Required</span>
                                      </span>
                                    ) : isSeqLocked ? (
                                      <span className="text-amber-800 font-bold flex items-center gap-1">
                                        <Lock className="w-3 h-3 text-amber-700" />
                                        <span>Locked · Complete Previous Exercise First</span>
                                      </span>
                                    ) : (
                                      <span
                                        className={
                                          level.levelNumber === 1
                                            ? 'text-emerald-800 font-bold'
                                            : 'text-slate-700'
                                        }
                                      >
                                        {level.levelNumber === 1 ? 'Free Level 1 Starter' : 'Unlocked Lesson'}
                                      </span>
                                    )}
                                    {isDone && (
                                      <>
                                        <span aria-hidden="true">·</span>
                                        <span className="text-emerald-800 font-semibold">✓ Completed</span>
                                      </>
                                    )}
                                  </div>

                                  <h4 className="text-sm font-bold text-slate-900">{lesson.title}</h4>
                                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                                    {lesson.description}
                                  </p>

                                  <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-600">
                                    <span className="text-slate-400">Formulas:</span>
                                    {lesson.keyFormulas.slice(0, 2).map((f) => (
                                      <code
                                        key={f}
                                        className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800"
                                      >
                                        {f}
                                      </code>
                                    ))}
                                    <span aria-hidden="true">·</span>
                                    <span>Workbook: {lesson.resource.fileName}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isAuthenticated) {
                                        onRequireAuth();
                                        return;
                                      }
                                      downloadStarterWorkbook(lesson, level.title);
                                    }}
                                    className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                                    title="Download practice Excel workbook (.xlsx)"
                                  >
                                    {isAuthenticated ? (
                                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
                                    ) : (
                                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                                    )}
                                    {isAuthenticated ? 'Practice .XLSX' : 'Log in for .XLSX'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isLevelLocked) {
                                        onOpenCheckout();
                                      } else {
                                        onStartLesson(lesson.id);
                                      }
                                    }}
                                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                                      isLevelLocked
                                        ? 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200'
                                        : isSeqLocked
                                        ? 'bg-slate-200 text-slate-800 border border-slate-300 hover:bg-slate-300'
                                        : 'bg-slate-900 text-white hover:bg-emerald-800'
                                    }`}
                                  >
                                    {!isAuthenticated ? (
                                      <>
                                        <Lock className="w-3.5 h-3.5" />
                                        Log in to Start Level 1
                                      </>
                                    ) : isLevelLocked ? (
                                      <>
                                        <Lock className="w-3.5 h-3.5 text-amber-800" />
                                        Enrol to Unlock Level {level.levelNumber}
                                      </>
                                    ) : isSeqLocked ? (
                                      <>
                                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                                        Complete Previous Exercise First
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-3.5 h-3.5" />
                                        Start Lesson
                                      </>
                                    )}
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

              {/* Level 6 Detailed Real-World Data Analysis Projects Specifications */}
              {level.levelNumber === 6 && (
                <div className="p-6 lg:p-8 bg-[#FAF9F5] border-t border-slate-200 space-y-6">
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-emerald-800 font-semibold">
                      LEVEL 6 PORTFOLIO SPECIFICATIONS · DEMONSTRATION DATASETS
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Six Real-World Data Analysis Project Briefs & Audit Checklists
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Each project below includes a realistic business problem, sample dataset, step-by-step instructions, required Excel skills, deliverables, review checklist, and model solution explanation.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {LEVEL_6_PROJECTS.map((proj) => {
                      const isProjOpen = expandedProjectIds.includes(proj.id);
                      return (
                        <div
                          key={proj.id}
                          className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleProject(proj.id)}
                            className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className="space-y-1">
                              <div className="text-xs font-mono text-emerald-800">
                                Project 0{proj.projectNumber} · {proj.category} · Demonstration Dataset
                              </div>
                              <div className="text-base font-bold text-slate-900">{proj.title}</div>
                            </div>
                            {isProjOpen ? (
                              <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                          </button>

                          {isProjOpen && (
                            <div className="px-6 pb-6 pt-3 border-t border-slate-100 space-y-6 text-xs text-slate-700">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <div className="font-semibold text-slate-900 mb-1">1. Business Problem</div>
                                    <p className="leading-relaxed text-slate-600">{proj.businessProblem}</p>
                                  </div>

                                  <div>
                                    <div className="font-semibold text-slate-900 mb-1">2. Project Objectives</div>
                                    <ul className="space-y-1 text-slate-600 list-disc pl-4">
                                      {proj.objectives.map((obj, idx) => (
                                        <li key={idx}>{obj}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <div className="font-semibold text-slate-900 mb-1">
                                      3. Step-by-Step Instructions
                                    </div>
                                    <ol className="space-y-1 text-slate-600 list-decimal pl-4">
                                      {proj.stepByStepInstructions.map((step, idx) => (
                                        <li key={idx}>{step}</li>
                                      ))}
                                    </ol>
                                  </div>

                                  <div>
                                    <div className="font-semibold text-slate-900 mb-1">4. Required Excel Skills</div>
                                    <p className="text-emerald-900 font-mono">{proj.requiredExcelSkills.join(' · ')}</p>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <div className="font-semibold text-slate-900 mb-1">5. Expected Deliverables</div>
                                    <ul className="space-y-1 text-slate-600 list-disc pl-4">
                                      {proj.expectedDeliverables.map((del, idx) => (
                                        <li key={idx}>{del}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <div className="font-semibold text-slate-900 mb-1">
                                      6. Quality Review Checklist
                                    </div>
                                    <ul className="space-y-1.5 text-slate-600">
                                      {proj.reviewChecklist.map((chk, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                                          <span>{chk}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                                    <div className="font-semibold text-slate-900">
                                      7. Model Solution Explanation
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">
                                      {proj.modelSolutionExplanation}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isAuthenticated) {
                                        onRequireAuth();
                                        return;
                                      }
                                      downloadDemoCsvFile(
                                        `Level6_Project_${proj.projectNumber}_Dataset.csv`,
                                        proj.sampleCsvContent
                                      );
                                    }}
                                    className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors flex items-center gap-2 cursor-pointer"
                                  >
                                    {isAuthenticated ? (
                                      <>
                                        <Download className="w-3.5 h-3.5" />
                                        Download Project 0{proj.projectNumber} Sample Dataset (.CSV)
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="w-3.5 h-3.5" />
                                        Log in to Download Project 0{proj.projectNumber} Dataset (.CSV)
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
