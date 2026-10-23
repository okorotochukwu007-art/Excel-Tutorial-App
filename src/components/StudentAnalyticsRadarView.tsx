import React, { useState, useMemo } from 'react';
import {
  Flame,
  Clock,
  Award,
  Sparkles,
  Trophy,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Share2,
  TrendingUp,
  Search,
  Table,
  PieChart,
  Wand2,
  Calculator,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  CurriculumLevel,
  QuizAttempt,
  ProjectSubmissionState,
  Profile,
} from '../types/academy';
import {
  calculateStudentAnalytics,
  generateLinkedInSummary,
  CompetencyScore,
} from '../utils/studentAnalyticsCalculator';

interface StudentAnalyticsRadarViewProps {
  student: Profile;
  levels: CurriculumLevel[];
  completedLessonIds: string[];
  quizAttempts: QuizAttempt[];
  projectSubmissions: Record<string, ProjectSubmissionState>;
  onStartLesson?: (lessonId: string) => void;
}

export const StudentAnalyticsRadarView: React.FC<StudentAnalyticsRadarViewProps> = ({
  student,
  levels,
  completedLessonIds,
  quizAttempts,
  projectSubmissions,
  onStartLesson,
}) => {
  const [activeCompetencyId, setActiveCompetencyId] = useState<string>('logic-math');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [copiedLinkedIn, setCopiedLinkedIn] = useState<boolean>(false);

  const analytics = useMemo(
    () =>
      calculateStudentAnalytics(
        levels,
        completedLessonIds,
        quizAttempts,
        projectSubmissions
      ),
    [levels, completedLessonIds, quizAttempts, projectSubmissions]
  );

  const selectedCompetency =
    analytics.competencies.find((c) => c.id === activeCompetencyId) ||
    analytics.competencies[0];

  // SVG Radar Coordinates Calculation (6 axes)
  const radarData = useMemo(() => {
    const size = 320;
    const center = size / 2;
    const radius = 120;
    const angleStep = (Math.PI * 2) / analytics.competencies.length;

    // Grid polygon points for 20%, 40%, 60%, 80%, 100%
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const gridPolygons = gridLevels.map((lvl) => {
      const pts = analytics.competencies.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = radius * lvl;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return { level: lvl, points: pts.join(' ') };
    });

    // Student score polygon points
    const studentPoints = analytics.competencies.map((c, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const normalizedScore = Math.max(0.1, c.score / 100);
      const r = radius * normalizedScore;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y, score: c.score, name: c.name, id: c.id };
    });

    // Axis line endpoints and labels
    const axisLines = analytics.competencies.map((c, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      const labelRadius = radius + 25;
      const labelX = center + labelRadius * Math.cos(angle);
      const labelY = center + labelRadius * Math.sin(angle);
      return { x1: center, y1: center, x2: x, y2: y, labelX, labelY, competency: c };
    });

    return {
      size,
      center,
      gridPolygons,
      studentPoints,
      studentPolygonString: studentPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
      axisLines,
    };
  }, [analytics.competencies]);

  const handleCopyLinkedIn = () => {
    const text = generateLinkedInSummary(student.fullName, analytics);
    navigator.clipboard.writeText(text);
    setCopiedLinkedIn(true);
    setTimeout(() => setCopiedLinkedIn(false), 2500);
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator':
        return <Calculator className="w-5 h-5 text-blue-600" />;
      case 'Wand2':
        return <Wand2 className="w-5 h-5 text-purple-600" />;
      case 'Search':
        return <Search className="w-5 h-5 text-emerald-600" />;
      case 'Table':
        return <Table className="w-5 h-5 text-indigo-600" />;
      case 'PieChart':
        return <PieChart className="w-5 h-5 text-amber-600" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-600" />;
      case 'Award':
        return <Award className="w-5 h-5 text-emerald-700" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP SUMMARY TICKER STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Streak Counter */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Learning Streak</span>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <Flame className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {analytics.streakDays} Days
          </div>
          <div className="text-[11px] text-orange-700 font-semibold flex items-center gap-1">
            <span>🔥 On Fire! Active learning streak</span>
          </div>
        </div>

        {/* Overall Mastery Tier */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Overall Mastery</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {analytics.overallMasteryPercent}%
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold truncate">
            {analytics.masteryTier}
          </div>
        </div>

        {/* Total Practice Time */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Verified Study</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {(analytics.totalStudyMinutes / 60).toFixed(1)} hrs
          </div>
          <div className="text-[11px] text-slate-500">
            {analytics.totalLessonsCompleted} lessons completed
          </div>
        </div>

        {/* Badges Earned */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Badges Earned</span>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {analytics.unlockedBadgeCount} / {analytics.badges.length}
          </div>
          <div className="text-[11px] text-purple-700 font-semibold">
            {Math.round((analytics.unlockedBadgeCount / analytics.badges.length) * 100)}% achievements
          </div>
        </div>
      </div>

      {/* COMPETENCY RADAR & DEEP DIVE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual SVG Radar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>Excel 6-Axis Competency Radar</span>
              </h2>
              <p className="text-xs text-slate-500">
                Visual matrix evaluating your real spreadsheet abilities
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-3 py-1.5 bg-[#0077B5] hover:bg-[#005f93] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Export for LinkedIn</span>
            </button>
          </div>

          {/* SVG Radar */}
          <div className="py-2 flex items-center justify-center">
            <svg
              viewBox={`0 0 ${radarData.size} ${radarData.size}`}
              className="w-full max-w-[340px] h-auto select-none overflow-visible"
            >
              {/* Concentric Grid Polygons */}
              {radarData.gridPolygons.map((gp, idx) => (
                <polygon
                  key={idx}
                  points={gp.points}
                  fill={idx % 2 === 0 ? '#f8fafc' : '#ffffff'}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray={idx < 4 ? '3 3' : 'none'}
                />
              ))}

              {/* Axis lines from center */}
              {radarData.axisLines.map((axis, idx) => (
                <line
                  key={idx}
                  x1={axis.x1}
                  y1={axis.y1}
                  x2={axis.x2}
                  y2={axis.y2}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
              ))}

              {/* Student Filled Polygon */}
              <polygon
                points={radarData.studentPolygonString}
                fill="rgba(16, 185, 129, 0.25)"
                stroke="#047857"
                strokeWidth="2.5"
                className="transition-all duration-300"
              />

              {/* Interactive Anchor Points */}
              {radarData.studentPoints.map((pt) => {
                const isSelected = pt.id === activeCompetencyId;
                return (
                  <g
                    key={pt.id}
                    onClick={() => setActiveCompetencyId(pt.id)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6 : 4.5}
                      fill={isSelected ? '#065f46' : '#10b981'}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all"
                    />
                    {/* Score tooltip on circle */}
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      className="text-[10px] font-mono font-bold fill-slate-800"
                    >
                      {pt.score}%
                    </text>
                  </g>
                );
              })}

              {/* Axis Outer Labels */}
              {radarData.axisLines.map((axis) => {
                const isSelected = axis.competency.id === activeCompetencyId;
                return (
                  <text
                    key={axis.competency.id}
                    x={axis.labelX}
                    y={axis.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    onClick={() => setActiveCompetencyId(axis.competency.id)}
                    className={`text-[10px] font-bold cursor-pointer transition-colors ${
                      isSelected
                        ? 'fill-emerald-800 font-extrabold underline'
                        : 'fill-slate-600 hover:fill-slate-900'
                    }`}
                  >
                    {axis.competency.name}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="text-center text-xs text-slate-500 pt-1">
            Click on any radar point or label to inspect verified capabilities.
          </div>
        </div>

        {/* Competency Card Detail (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                  Selected Competency
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedCompetency.name}
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  selectedCompetency.score >= 70
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : selectedCompetency.score >= 50
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {selectedCompetency.tier} · {selectedCompetency.score}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-slate-500">
                <span>Mastery Progress</span>
                <span className="font-bold text-slate-900">{selectedCompetency.score} / 100</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                  style={{ width: `${selectedCompetency.score}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedCompetency.description}
            </p>

            {/* Verified Skills Pill Tags */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800">
                Verified Formula &amp; Execution Skills:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedCompetency.verifiedSkills.map((sk) => (
                  <span
                    key={sk}
                    className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-mono rounded-md border border-slate-200"
                  >
                    ✓ {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Switcher among all 6 competencies */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500">
              Switch Competency:
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {analytics.competencies.map((comp) => (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setActiveCompetencyId(comp.id)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg text-left truncate transition-colors cursor-pointer flex items-center justify-between ${
                    comp.id === activeCompetencyId
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{comp.name}</span>
                  <span className="font-mono text-[10px] opacity-80 shrink-0 ml-1">
                    {comp.score}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MILESTONE BADGES CABINET */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-600" />
              <span>Milestone Badges &amp; Accomplishments</span>
            </h2>
            <p className="text-xs text-slate-500">
              Earn badges by mastering formulas, acing quizzes, and solving business challenges
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-900">
            {analytics.unlockedBadgeCount} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border transition-all space-y-2 flex flex-col justify-between ${
                badge.isUnlocked
                  ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-400/30'
                  : 'bg-slate-50/70 border-slate-200 opacity-70'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      badge.isUnlocked ? 'bg-emerald-50' : 'bg-slate-200'
                    }`}
                  >
                    {getBadgeIcon(badge.iconName)}
                  </div>
                  {badge.isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      LOCKED
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{badge.title}</h4>
                  <div className="text-[10px] font-mono text-slate-500">
                    {badge.category}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-snug">
                  {badge.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Criteria: </span>
                <span>{badge.criteria}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LINKEDIN SKILLS EXPORT MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0077B5] flex items-center justify-center text-white">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    LinkedIn &amp; Résumé Skills Summary
                  </h3>
                  <p className="text-xs text-slate-500">
                    Copy verified formula proficiencies and paste them directly into your profile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Formatted Résumé / Profile Bullets:
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  Generated from verified curriculum accomplishments
                </span>
              </div>
              <textarea
                readOnly
                rows={12}
                value={generateLinkedInSummary(student.fullName, analytics)}
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 leading-relaxed focus:outline-none select-all"
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-700" />
                <span>Recommended Placement on LinkedIn:</span>
              </div>
              <p className="leading-relaxed">
                Paste into your <strong>About</strong> section, under the{' '}
                <strong>Licenses &amp; Certifications</strong> details, or inside
                your latest <strong>Role description</strong> to showcase practical
                spreadsheet competencies to recruiters.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopyLinkedIn}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {copiedLinkedIn ? (
                  <Check className="w-4 h-4 text-emerald-300" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copiedLinkedIn ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
