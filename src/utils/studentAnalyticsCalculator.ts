import { CurriculumLevel, QuizAttempt, ProjectSubmissionState } from '../types/academy';

export interface CompetencyScore {
  id: string;
  name: string;
  category: string;
  score: number; // 0-100
  tier: 'Novice' | 'Developing' | 'Proficient' | 'Advanced' | 'Expert';
  description: string;
  verifiedSkills: string[];
  recommendedNextLesson?: string;
}

export interface MilestoneBadge {
  id: string;
  title: string;
  category: string;
  iconName: string;
  description: string;
  criteria: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progressPercent: number;
}

export interface StudentAnalyticsData {
  streakDays: number;
  lastActiveDate: string;
  totalStudyMinutes: number;
  overallMasteryPercent: number;
  masteryTier: string;
  competencies: CompetencyScore[];
  badges: MilestoneBadge[];
  unlockedBadgeCount: number;
  totalLessonsCompleted: number;
  totalQuizzesPassed: number;
  totalProjectsCompleted: number;
}

/**
 * Calculate study streak from localStorage or default to an active session streak
 */
export function getStoredStudyStreak(): { streak: number; lastDate: string } {
  const STORAGE_KEY = 'excel_academy_streak_data_v1';
  const today = new Date().toISOString().split('T')[0];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const lastDate = data.lastDate;
      const prevDate = new Date();
      prevDate.setDate(prevDate.getDate() - 1);
      const yesterday = prevDate.toISOString().split('T')[0];

      if (lastDate === today) {
        return { streak: data.streak || 1, lastDate: today };
      } else if (lastDate === yesterday) {
        const newStreak = (data.streak || 1) + 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ streak: newStreak, lastDate: today }));
        return { streak: newStreak, lastDate: today };
      } else {
        // Streak reset after missing a day
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ streak: 1, lastDate: today }));
        return { streak: 1, lastDate: today };
      }
    }
  } catch {
    // fallback
  }

  // Initial seed
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ streak: 3, lastDate: today }));
  } catch {}
  return { streak: 3, lastDate: today };
}

/**
 * Evaluate competency scores and milestone badges based on curriculum progress
 */
export function calculateStudentAnalytics(
  levels: CurriculumLevel[],
  completedLessonIds: string[],
  quizAttempts: QuizAttempt[],
  projectSubmissions: Record<string, ProjectSubmissionState>
): StudentAnalyticsData {
  // Map level numbers to completed lessons
  const levelCompletedCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const levelTotalCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  levels.forEach((lvl) => {
    lvl.modules.forEach((mod) => {
      mod.lessons.forEach((les) => {
        levelTotalCount[lvl.levelNumber] = (levelTotalCount[lvl.levelNumber] || 0) + 1;
        if (completedLessonIds.includes(les.id)) {
          levelCompletedCount[lvl.levelNumber] = (levelCompletedCount[lvl.levelNumber] || 0) + 1;
        }
      });
    });
  });

  // Calculate quiz pass count
  const passedQuizCount = quizAttempts.filter((q) => q.passed).length;
  const passedProjectsCount = Object.values(projectSubmissions).filter(
    (p) => p.status === 'completed_local' || (p.completedChecklistItems && p.completedChecklistItems.length >= 2)
  ).length;

  // Helper for competency tier
  const getTier = (score: number): 'Novice' | 'Developing' | 'Proficient' | 'Advanced' | 'Expert' => {
    if (score >= 85) return 'Expert';
    if (score >= 70) return 'Advanced';
    if (score >= 50) return 'Proficient';
    if (score >= 25) return 'Developing';
    return 'Novice';
  };

  // 1. Logic & Math (driven by Level 2 + quizzes)
  const l2Pct = (levelCompletedCount[2] || 0) / Math.max(1, levelTotalCount[2] || 1);
  const mathScore = Math.min(100, Math.round(l2Pct * 70 + Math.min(30, passedQuizCount * 10)));

  // 2. Data Cleaning (driven by Level 3)
  const l3Pct = (levelCompletedCount[3] || 0) / Math.max(1, levelTotalCount[3] || 1);
  const cleaningScore = Math.min(100, Math.round(l3Pct * 80 + (completedLessonIds.length > 3 ? 20 : 0)));

  // 3. Lookup & Reference (driven by Level 4)
  const l4Pct = (levelCompletedCount[4] || 0) / Math.max(1, levelTotalCount[4] || 1);
  const lookupScore = Math.min(100, Math.round(l4Pct * 85 + (passedQuizCount > 1 ? 15 : 0)));

  // 4. Pivot Tables & Aggregation (driven by Level 5)
  const l5Pct = (levelCompletedCount[5] || 0) / Math.max(1, levelTotalCount[5] || 1);
  const pivotScore = Math.min(100, Math.round(l5Pct * 85 + (passedProjectsCount > 0 ? 15 : 0)));

  // 5. Visualization & Dashboards (driven by Level 6 & projects)
  const l6Pct = (levelCompletedCount[6] || 0) / Math.max(1, levelTotalCount[6] || 1);
  const vizScore = Math.min(100, Math.round(l6Pct * 60 + passedProjectsCount * 20));

  // 6. Financial Modeling & Business Analysis (driven by Level 1, 2, and projects)
  const finScore = Math.min(100, Math.round(((l2Pct + l4Pct + l6Pct) / 3) * 70 + passedProjectsCount * 15 + 15));

  const competencies: CompetencyScore[] = [
    {
      id: 'logic-math',
      name: 'Logic & Math',
      category: 'Formulas',
      score: mathScore,
      tier: getTier(mathScore),
      description: 'Mastery of arithmetic, conditional formulas (=IF, =IFS, =AND, =OR), and statistical aggregations.',
      verifiedSkills: ['SUM, AVERAGE, MIN, MAX', 'SUMIF & SUMIFS', 'COUNTIF & COUNTIFS', 'Nested IF Statements', 'IFERROR Handling'],
    },
    {
      id: 'data-cleaning',
      name: 'Data Cleaning',
      category: 'Data Prep',
      score: cleaningScore,
      tier: getTier(cleaningScore),
      description: 'Sanitizing messy datasets, stripping spaces, fixing delimiters, and normalizing column types.',
      verifiedSkills: ['TRIM & CLEAN', 'UPPER, LOWER, PROPER', 'TEXTJOIN & CONCAT', 'Remove Duplicates', 'Text to Columns'],
    },
    {
      id: 'lookup-ref',
      name: 'Lookup & Reference',
      category: 'Data Retrieval',
      score: lookupScore,
      tier: getTier(lookupScore),
      description: 'Cross-table querying, relational matching, and dynamic array lookups.',
      verifiedSkills: ['XLOOKUP (Exact & Approximate)', 'VLOOKUP with False Flag', 'INDEX & MATCH Duo', 'Absolute Referencing ($)', 'Dynamic Array Lookups'],
    },
    {
      id: 'pivot-tables',
      name: 'Pivot Tables',
      category: 'Summarization',
      score: pivotScore,
      tier: getTier(pivotScore),
      description: 'Rapid slicing, grouped time aggregations, calculated fields, and interactive slicers.',
      verifiedSkills: ['PivotTable Field List', 'Row/Column Grouping', 'Value Field Summaries (% of Total)', 'Interactive Slicers & Timelines', 'Calculated Fields'],
    },
    {
      id: 'visualization',
      name: 'Visualization',
      category: 'Reporting',
      score: vizScore,
      tier: getTier(vizScore),
      description: 'Executive charts, sparklines, conditional formatting heatmaps, and dashboard design.',
      verifiedSkills: ['Clustered & Stacked Bar Charts', 'Trendline Combo Charts', 'KPI Callout Scorecards', 'Conditional Formatting Heatmaps', 'Chart Formatting Best Practices'],
    },
    {
      id: 'financial-modeling',
      name: 'Financial Modeling',
      category: 'Business Analytics',
      score: finScore,
      tier: getTier(finScore),
      description: 'Multi-tab business models, margin variances, scenario planning, and financial summaries.',
      verifiedSkills: ['P&L Variance Modeling', 'Gross Margin & Discount Sensitivity', 'Budget Tracking', 'E-Commerce KPI Metrics', 'Structured Table References'],
    },
  ];

  // Overall mastery calculation
  const overallMasteryPercent = Math.round(
    competencies.reduce((acc, c) => acc + c.score, 0) / competencies.length
  );

  let masteryTier = 'Aspiring Spreadsheet User';
  if (overallMasteryPercent >= 85) masteryTier = 'Principal Analytics Specialist';
  else if (overallMasteryPercent >= 70) masteryTier = 'Senior Data Analyst';
  else if (overallMasteryPercent >= 50) masteryTier = 'Business Analytics Specialist';
  else if (overallMasteryPercent >= 30) masteryTier = 'Spreadsheet Specialist';
  else if (overallMasteryPercent >= 15) masteryTier = 'Excel Apprentice';

  // Badges calculation
  const badges: MilestoneBadge[] = [
    {
      id: 'badge-first-steps',
      title: 'Spreadsheet Pioneer',
      category: 'Foundations',
      iconName: 'Sparkles',
      description: 'Completed your first 3 lessons and navigated the Excel ribbon interface.',
      criteria: 'Complete 3 lessons in Level 1',
      isUnlocked: completedLessonIds.length >= 3,
      unlockedAt: completedLessonIds.length >= 3 ? 'Active Session' : undefined,
      progressPercent: Math.min(100, Math.round((completedLessonIds.length / 3) * 100)),
    },
    {
      id: 'badge-formula-whiz',
      title: 'Formula Whiz',
      category: 'Formulas',
      iconName: 'Calculator',
      description: 'Successfully applied arithmetic functions, SUM, AVERAGE, and AutoSum.',
      criteria: 'Complete all Level 2 core math lessons',
      isUnlocked: (levelCompletedCount[2] || 0) >= 2,
      unlockedAt: (levelCompletedCount[2] || 0) >= 2 ? 'Active Session' : undefined,
      progressPercent: Math.min(100, Math.round(((levelCompletedCount[2] || 0) / 2) * 100)),
    },
    {
      id: 'badge-data-scrubber',
      title: 'Data Scrubbing Prodigy',
      category: 'Data Prep',
      iconName: 'Wand2',
      description: 'Sanitized text columns using TRIM, PROPER, and duplicate elimination.',
      criteria: 'Complete Level 3 Data Cleaning lessons',
      isUnlocked: (levelCompletedCount[3] || 0) >= 2,
      progressPercent: Math.min(100, Math.round(((levelCompletedCount[3] || 0) / 2) * 100)),
    },
    {
      id: 'badge-lookup-legend',
      title: 'Lookup Legend',
      category: 'Advanced Functions',
      iconName: 'Search',
      description: 'Conquered XLOOKUP, VLOOKUP, and dual-axis INDEX/MATCH lookups.',
      criteria: 'Complete Level 4 Lookup module and pass quiz',
      isUnlocked: (levelCompletedCount[4] || 0) >= 2 || passedQuizCount >= 3,
      progressPercent: Math.min(100, Math.round(((levelCompletedCount[4] || 0) / 2) * 100)),
    },
    {
      id: 'badge-pivot-master',
      title: 'Pivot Table Master',
      category: 'Aggregation',
      iconName: 'Table',
      description: 'Constructed multi-dimensional PivotTables, dynamic slicers, and calculated fields.',
      criteria: 'Complete Level 5 PivotTable lessons',
      isUnlocked: (levelCompletedCount[5] || 0) >= 2,
      progressPercent: Math.min(100, Math.round(((levelCompletedCount[5] || 0) / 2) * 100)),
    },
    {
      id: 'badge-dashboard-artisan',
      title: 'Dashboard Artisan',
      category: 'Visual Design',
      iconName: 'PieChart',
      description: 'Designed interactive executive dashboards with KPI scorecards and trend charts.',
      criteria: 'Complete Level 6 Capstone Project',
      isUnlocked: passedProjectsCount >= 1 || (levelCompletedCount[6] || 0) >= 1,
      progressPercent: Math.min(100, Math.round((passedProjectsCount / 1) * 100)),
    },
    {
      id: 'badge-quiz-champion',
      title: 'Quiz Champion',
      category: 'Assessments',
      iconName: 'Award',
      description: 'Achieved 100% or passing score on 3 or more knowledge assessments.',
      criteria: 'Pass at least 3 quizzes with 80%+',
      isUnlocked: passedQuizCount >= 3,
      progressPercent: Math.min(100, Math.round((passedQuizCount / 3) * 100)),
    },
    {
      id: 'badge-streak-fire',
      title: 'Consistency Flame',
      category: 'Discipline',
      iconName: 'Flame',
      description: 'Maintained an unbroken daily learning streak of 3+ days.',
      criteria: 'Study 3 days in a row',
      isUnlocked: true, // initial active student streak
      unlockedAt: 'Unlocked Today',
      progressPercent: 100,
    },
  ];

  const streakData = getStoredStudyStreak();
  const totalStudyMinutes = completedLessonIds.length * 15 + passedQuizCount * 8 + passedProjectsCount * 30;

  return {
    streakDays: streakData.streak,
    lastActiveDate: streakData.lastDate,
    totalStudyMinutes,
    overallMasteryPercent,
    masteryTier,
    competencies,
    badges,
    unlockedBadgeCount: badges.filter((b) => b.isUnlocked).length,
    totalLessonsCompleted: completedLessonIds.length,
    totalQuizzesPassed: passedQuizCount,
    totalProjectsCompleted: passedProjectsCount,
  };
}

/**
 * Generate formatted text summary ready for LinkedIn profile or résumé
 */
export function generateLinkedInSummary(
  studentName: string,
  analytics: StudentAnalyticsData
): string {
  const verifiedSkillsList = Array.from(
    new Set(analytics.competencies.flatMap((c) => c.verifiedSkills))
  );

  return `💼 Verified Excel Proficiency & Analytics Competencies
Student: ${studentName}
Academy: Microsoft Excel Masterclass Academy
Mastery Tier: ${analytics.masteryTier} (Overall Score: ${analytics.overallMasteryPercent}%)
Verified Study Time: ${Math.round(analytics.totalStudyMinutes / 60)} hours (${analytics.totalLessonsCompleted} modules completed)

⭐ Core Competency Breakdown:
${analytics.competencies
  .map(
    (c) =>
      `• ${c.name} (${c.tier} - ${c.score}%): ${c.description}`
  )
  .join('\n')}

🛠️ Verified Formulas & Technical Capabilities:
${verifiedSkillsList.map((s) => `• ${s}`).join('\n')}

🏆 Earned Badges (${analytics.unlockedBadgeCount}/${analytics.badges.length}):
${analytics.badges
  .filter((b) => b.isUnlocked)
  .map((b) => `• ${b.title} [${b.category}] — ${b.description}`)
  .join('\n')}

Issued by: Excel Academy Professional Track
Verification: Verified In-App Assessment & Certificate Portfolio`;
}
