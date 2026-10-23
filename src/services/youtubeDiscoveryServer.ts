import fs from 'fs';
import path from 'path';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  Lesson,
  LessonVideoCoverageState,
  LessonVideoRecommendationsRecord,
  RecommendationStatus,
  SuitabilityEvidence,
  VideoCoverageAuditItem,
  VideoCoverageAuditSummary,
  YoutubeVideoRecommendation,
} from '../types/academy.ts';
import { CURRICULUM_LEVELS } from '../data/curriculumData.ts';

const LOCAL_CACHE_PATH = path.join(
  process.cwd(),
  'src',
  'data',
  'youtubeRecommendationsCache.json'
);

// Track whether the optional dedicated table exists so we don't spam failed table queries
let dedicatedRecsTableAvailable: boolean | null = null;

const REPUTABLE_EXCEL_CHANNELS = [
  'kevin stratvert',
  'leila gharani',
  'excelisfun',
  'myonlinetraininghub',
  'chandoo',
  "teacher's tech",
  'teachers tech',
  'learnit training',
  'technology for teachers and students',
  'trumpexcel',
  'simon sez it',
  'gcflearnfree',
  'kenji explains',
  'pragmatic works',
  'excel campus',
  'vertex42',
  'contextures',
  'chester tugwell',
  'sele training',
  'computergaga',
  'lukas',
  'excel dictionary',
  'wiseowlbusiness',
  'wiseowl',
];

const NON_ENGLISH_MARKERS = [
  'hindi',
  'urdu',
  'bangla',
  'tamil',
  'telugu',
  'malayalam',
  'español',
  'espanol',
  'português',
  'portugues',
  'aula de excel',
  'curso de excel',
  'belajar excel',
  'rumus excel',
  'bahasa indonesia',
  'tagalog',
  'filipino',
  'en français',
  'auf deutsch',
  'po polsku',
  'türkçe',
];

// Explicit topic-accurate search queries and keywords for all 54 modules across Levels 1 to 6
const MODULE_TOPIC_QUERY_MAP: Record<
  string,
  { conceptQuery: string; labQuery: string; keywords: string[] }
> = {
  // LEVEL 1: EXCEL FOUNDATIONS
  'lvl-1-mod-1': {
    conceptQuery:
      'Introduction to Microsoft Excel interface tutorial for absolute beginners step by step',
    labQuery:
      'How to use Microsoft Excel for beginners first spreadsheet walkthrough tutorial',
    keywords: ['excel', 'introduction', 'interface', 'beginner', 'ribbon', 'spreadsheet'],
  },
  'lvl-1-mod-2': {
    conceptQuery:
      'Excel workbooks worksheets rows columns and cells explained for beginners',
    labQuery:
      'Understanding rows columns cells and worksheets in Microsoft Excel beginner tutorial',
    keywords: ['workbook', 'worksheet', 'rows', 'columns', 'cells', 'sheet', 'tabs'],
  },
  'lvl-1-mod-3': {
    conceptQuery:
      'How to enter and edit data in Microsoft Excel tutorial for beginners step by step',
    labQuery:
      'Entering data autofill and editing cells in Excel beginner practical tutorial',
    keywords: ['enter', 'entering', 'edit', 'editing', 'data', 'autofill', 'input', 'cells'],
  },
  'lvl-1-mod-4': {
    conceptQuery:
      'How to format cells numbers dates and text in Microsoft Excel for beginners',
    labQuery:
      'Excel number formatting currency dates borders and simple tables tutorial',
    keywords: ['format', 'formatting', 'numbers', 'dates', 'currency', 'cells', 'table'],
  },
  'lvl-1-mod-5': {
    conceptQuery:
      'Basic calculations and math formulas add subtract multiply divide in Excel for beginners',
    labQuery:
      'How to do basic math calculations in Microsoft Excel step by step tutorial',
    keywords: ['basic', 'calculations', 'math', 'add', 'subtract', 'multiply', 'divide', 'formula'],
  },
  'lvl-1-mod-6': {
    conceptQuery:
      'Introduction to Excel formulas and cell references tutorial for absolute beginners',
    labQuery:
      'How to write formulas and use cell references in Microsoft Excel step by step',
    keywords: ['formula', 'formulas', 'cell', 'reference', 'references', 'sum'],
  },
  'lvl-1-mod-7': {
    conceptQuery:
      'How to sort and filter data in Microsoft Excel tutorial for beginners step by step',
    labQuery:
      'Sorting and filtering tables in Excel practical beginner tutorial',
    keywords: ['sort', 'sorting', 'filter', 'filtering', 'data', 'organize'],
  },
  'lvl-1-mod-8': {
    conceptQuery:
      'How to save open and organize Excel workbooks and files for beginners',
    labQuery:
      'Saving opening exporting PDF and managing files in Microsoft Excel tutorial',
    keywords: ['save', 'saving', 'open', 'workbook', 'file', 'files', 'export'],
  },

  // LEVEL 2: EXCEL FORMULAS AND FUNCTIONS
  'lvl-2-mod-1': {
    conceptQuery:
      'Relative absolute and mixed cell references in Excel $A$1 explained for beginners',
    labQuery:
      'When to use dollar sign $ absolute vs relative cell reference in Excel tutorial',
    keywords: ['relative', 'absolute', 'mixed', 'reference', 'references', 'dollar', 'f4'],
  },
  'lvl-2-mod-2': {
    conceptQuery:
      'Excel SUM AVERAGE MIN and MAX functions tutorial for beginners step by step',
    labQuery:
      'How to use SUM AVERAGE MIN MAX in Microsoft Excel with practical examples',
    keywords: ['sum', 'average', 'min', 'max', 'functions', 'autosum'],
  },
  'lvl-2-mod-3': {
    conceptQuery:
      'Excel COUNT COUNTA COUNTIF and COUNTIFS functions tutorial for beginners',
    labQuery:
      'How to use COUNTIF and COUNTIFS in Microsoft Excel step by step examples',
    keywords: ['count', 'counta', 'countif', 'countifs', 'criteria'],
  },
  'lvl-2-mod-4': {
    conceptQuery:
      'Excel IF function and nested IF logical formulas tutorial for beginners step by step',
    labQuery:
      'How to use IF AND OR functions in Microsoft Excel practical business examples',
    keywords: ['if', 'logical', 'nested', 'ifs', 'condition', 'formula'],
  },
  'lvl-2-mod-5': {
    conceptQuery:
      'Excel SUMIF and SUMIFS tutorial for beginners step by step with examples',
    labQuery:
      'How to use SUMIFS with multiple criteria in Microsoft Excel practical tutorial',
    keywords: ['sumif', 'sumifs', 'criteria', 'multiple', 'sum'],
  },
  'lvl-2-mod-6': {
    conceptQuery:
      'Excel XLOOKUP and VLOOKUP tutorial for beginners step by step explained',
    labQuery:
      'How to use XLOOKUP in Microsoft Excel practical lookup examples for beginners',
    keywords: ['xlookup', 'vlookup', 'lookup', 'match', 'search'],
  },
  'lvl-2-mod-7': {
    conceptQuery:
      'Excel text functions TRIM CONCAT LEFT RIGHT MID PROPER tutorial for beginners',
    labQuery:
      'How to clean and combine text in Excel using text formulas step by step',
    keywords: ['text', 'trim', 'concat', 'left', 'right', 'mid', 'proper', 'combine'],
  },
  'lvl-2-mod-8': {
    conceptQuery:
      'Excel date and time functions TODAY YEAR MONTH DATEDIF tutorial for beginners',
    labQuery:
      'How to calculate days between dates and use date formulas in Microsoft Excel',
    keywords: ['date', 'dates', 'time', 'today', 'year', 'month', 'datedif', 'days'],
  },
  'lvl-2-mod-9': {
    conceptQuery:
      'How to use IFERROR in Excel to fix #N/A and #DIV/0! formula errors for beginners',
    labQuery:
      'Excel IFERROR and formula error handling practical tutorial step by step',
    keywords: ['iferror', 'error', 'errors', 'na', 'div', 'handle'],
  },
  'lvl-2-mod-10': {
    conceptQuery:
      'How to troubleshoot and fix broken Excel formulas #VALUE #REF #NAME for beginners',
    labQuery:
      'Excel formula auditing trace precedents evaluate formula troubleshooting tutorial',
    keywords: ['troubleshoot', 'troubleshooting', 'audit', 'errors', 'fix', 'formula', 'precedents'],
  },

  // LEVEL 3: DATA CLEANING AND PREPARATION
  'lvl-3-mod-1': {
    conceptQuery:
      'How to clean messy raw data in Microsoft Excel for beginners step by step',
    labQuery:
      'Excel data cleaning tutorial transforming raw messy spreadsheet data into clean tables',
    keywords: ['clean', 'cleaning', 'messy', 'raw', 'data', 'dataset', 'prepare'],
  },
  'lvl-3-mod-2': {
    conceptQuery:
      'How to find and handle blank cells and missing values in Excel tutorial for beginners',
    labQuery:
      'Excel Go To Special Blanks COUNTBLANK finding missing data and inconsistencies tutorial',
    keywords: ['missing', 'blank', 'blanks', 'empty', 'cells', 'find', 'inconsistencies'],
  },
  'lvl-3-mod-3': {
    conceptQuery:
      'How to find and remove duplicates in Microsoft Excel tutorial for beginners',
    labQuery:
      'Remove duplicate rows and highlight duplicate values in Excel step by step',
    keywords: ['remove', 'removing', 'duplicates', 'duplicate', 'unique'],
  },
  'lvl-3-mod-4': {
    conceptQuery:
      'How to standardize text names and fix inconsistent date formats in Excel tutorial',
    labQuery:
      'Fixing messy dates and standardizing text capitalization in Microsoft Excel',
    keywords: ['standardize', 'dates', 'date', 'names', 'text', 'format', 'proper', 'clean'],
  },
  'lvl-3-mod-5': {
    conceptQuery:
      'Cleaning data with Excel text functions TRIM CLEAN PROPER SUBSTITUTE tutorial',
    labQuery:
      'How to remove extra spaces and non-printable characters in Excel using TRIM and CLEAN',
    keywords: ['trim', 'clean', 'proper', 'spaces', 'text', 'functions', 'substitute'],
  },
  'lvl-3-mod-6': {
    conceptQuery:
      'Excel Text to Columns and Flash Fill tutorial for beginners step by step',
    labQuery:
      'How to split text into columns using Flash Fill and Text to Columns in Excel',
    keywords: ['text to columns', 'flash fill', 'split', 'columns', 'separate'],
  },
  'lvl-3-mod-7': {
    conceptQuery:
      'Excel Data Validation drop-down lists sorting and filtering tutorial for beginners',
    labQuery:
      'How to validate data entry and create drop-down lists in Microsoft Excel step by step',
    keywords: ['validation', 'data validation', 'dropdown', 'sort', 'filter', 'records'],
  },
  'lvl-3-mod-8': {
    conceptQuery:
      'How to use Excel Tables Ctrl+T and structured references tutorial for beginners',
    labQuery:
      'Why you should use official Excel Tables and structured formulas step by step',
    keywords: ['table', 'tables', 'structured', 'references', 'ctrl+t', 'total row'],
  },
  'lvl-3-mod-9': {
    conceptQuery:
      'Power Query in Excel tutorial for beginners import and clean data step by step',
    labQuery:
      'How to use Power Query in Microsoft Excel to automate data cleaning for beginners',
    keywords: ['power query', 'import', 'transform', 'clean', 'automate', 'query'],
  },
  'lvl-3-mod-10': {
    conceptQuery:
      'Excel data cleaning checklist how to check data quality before analysis tutorial',
    labQuery:
      'Step by step data preparation and quality check in Microsoft Excel before PivotTables',
    keywords: ['quality', 'check', 'checklist', 'clean', 'cleaning', 'prepare', 'analysis'],
  },

  // LEVEL 4: DATA ANALYSIS WITH EXCEL
  'lvl-4-mod-1': {
    conceptQuery:
      'How to structure data tables rows columns and records for analysis in Excel',
    labQuery:
      'Excel data analysis basics understanding fields records and tabular data layout',
    keywords: ['data', 'analysis', 'rows', 'columns', 'records', 'fields', 'table'],
  },
  'lvl-4-mod-2': {
    conceptQuery:
      'How to analyze data in Microsoft Excel for beginners step by step guide',
    labQuery:
      'Excel data analysis tutorial answering business questions from sales data',
    keywords: ['data analysis', 'analyze', 'business', 'questions', 'sales', 'insights'],
  },
  'lvl-4-mod-3': {
    conceptQuery:
      'How to summarize data in Excel using SUMIFS COUNTIFS AVERAGEIFS tutorial',
    labQuery:
      'Building a summary report table with formulas in Microsoft Excel step by step',
    keywords: ['summarize', 'summarizing', 'summary', 'sumifs', 'countifs', 'averageifs'],
  },
  'lvl-4-mod-4': {
    conceptQuery:
      'Pivot Tables in Excel tutorial for beginners step by step how to create PivotTables',
    labQuery:
      'How to analyze sales data with PivotTables in Microsoft Excel practical tutorial',
    keywords: ['pivot', 'pivottable', 'pivottables', 'pivot table', 'analyze', 'summary'],
  },
  'lvl-4-mod-5': {
    conceptQuery:
      'How to group dates months quarters and filter PivotTables in Excel tutorial',
    labQuery:
      'Grouping by month year and filtering data in Excel PivotTables step by step',
    keywords: ['group', 'grouping', 'filter', 'filtering', 'pivot', 'pivottable', 'dates', 'months'],
  },
  'lvl-4-mod-6': {
    conceptQuery:
      'How to create PivotCharts in Microsoft Excel tutorial for beginners step by step',
    labQuery:
      'Excel PivotChart and PivotTable visual data analysis tutorial for beginners',
    keywords: ['pivotchart', 'pivotcharts', 'pivot chart', 'chart', 'pivot', 'visualize'],
  },
  'lvl-4-mod-7': {
    conceptQuery:
      'Excel Conditional Formatting tutorial for beginners highlight patterns and data bars',
    labQuery:
      'How to use Conditional Formatting color scales icon sets and rules in Excel',
    keywords: ['conditional', 'formatting', 'highlight', 'data bars', 'rules', 'patterns'],
  },
  'lvl-4-mod-8': {
    conceptQuery:
      'How to compare sales performance across regions products and months in Excel PivotTables',
    labQuery:
      'Excel PivotTable Show Values As % of Total and period comparison tutorial',
    keywords: ['compare', 'comparison', 'performance', 'sales', 'pivot', 'region', 'percentage'],
  },
  'lvl-4-mod-9': {
    conceptQuery:
      'How to calculate percentage change and growth rate in Microsoft Excel tutorial',
    labQuery:
      'Calculating month over month and year over year percentage growth in Excel',
    keywords: ['percentage', 'change', 'growth', 'increase', 'variance', 'formula'],
  },
  'lvl-4-mod-10': {
    conceptQuery:
      'How to present and interpret data analysis findings in Microsoft Excel tutorial',
    labQuery:
      'Turning Excel PivotTable analysis into clear business insights and reports',
    keywords: ['insights', 'findings', 'analysis', 'report', 'reporting', 'interpret', 'summary'],
  },

  // LEVEL 5: DASHBOARDS AND PROFESSIONAL REPORTING
  'lvl-5-mod-1': {
    conceptQuery:
      'How to design clean professional business reports in Microsoft Excel tutorial',
    labQuery:
      'Excel report formatting tips make spreadsheets look clean and executive ready',
    keywords: ['report', 'reporting', 'professional', 'clean', 'design', 'business', 'format'],
  },
  'lvl-5-mod-2': {
    conceptQuery:
      'How to choose and create charts in Microsoft Excel tutorial for beginners',
    labQuery:
      'Excel charts and graphs tutorial bar column line and pie charts explained',
    keywords: ['chart', 'charts', 'graph', 'graphs', 'line', 'bar', 'column', 'choose'],
  },
  'lvl-5-mod-3': {
    conceptQuery:
      'How to create dynamic KPI cards in Microsoft Excel dashboard tutorial',
    labQuery:
      'Building KPI summary cards and headline metrics in Excel step by step',
    keywords: ['kpi', 'card', 'cards', 'summary', 'dashboard', 'metrics'],
  },
  'lvl-5-mod-4': {
    conceptQuery:
      'How to build an interactive Excel Dashboard step by step tutorial for beginners',
    labQuery:
      'Designing a professional Microsoft Excel Dashboard from scratch complete tutorial',
    keywords: ['dashboard', 'dashboards', 'interactive', 'design', 'professional'],
  },
  'lvl-5-mod-5': {
    conceptQuery:
      'How to add Slicers and PivotCharts in Microsoft Excel dashboard tutorial',
    labQuery:
      'Connecting Slicers to multiple PivotTables and PivotCharts in Excel step by step',
    keywords: ['slicer', 'slicers', 'pivotchart', 'pivotcharts', 'connect', 'dashboard'],
  },
  'lvl-5-mod-6': {
    conceptQuery:
      'How to use Slicers and Timeline filters in Excel to make interactive reports',
    labQuery:
      'Excel interactive filters Slicer Report Connections and Timeline tutorial',
    keywords: ['slicer', 'slicers', 'timeline', 'interactive', 'filter', 'filters'],
  },
  'lvl-5-mod-7': {
    conceptQuery:
      'How to format Excel charts and align dashboard layouts like a pro tutorial',
    labQuery:
      'Excel chart formatting tricks and clean dashboard layout alignment step by step',
    keywords: ['format', 'formatting', 'chart', 'charts', 'layout', 'dashboard', 'design'],
  },
  'lvl-5-mod-8': {
    conceptQuery:
      'Excel dashboard design best practices and usability tips for data analysts',
    labQuery:
      'How to make Excel dashboards easy to read clean colors and visual hierarchy',
    keywords: ['dashboard', 'design', 'tips', 'best practices', 'clean', 'visual'],
  },
  'lvl-5-mod-9': {
    conceptQuery:
      'How to automatically refresh PivotTables and dashboards when data changes in Excel',
    labQuery:
      'Updating and refreshing dynamic Excel reports when new data rows are added',
    keywords: ['refresh', 'update', 'dynamic', 'pivottable', 'table', 'dashboard', 'data'],
  },
  'lvl-5-mod-10': {
    conceptQuery:
      'How to present Excel dashboard insights and business recommendations tutorial',
    labQuery:
      'Data storytelling and presenting executive dashboard reports in Microsoft Excel',
    keywords: ['present', 'presenting', 'insights', 'dashboard', 'storytelling', 'report'],
  },

  // LEVEL 6: REAL-WORLD DATA ANALYSIS PROJECTS
  'lvl-6-mod-1': {
    conceptQuery:
      'Excel sales data analysis project step by step tutorial for beginners',
    labQuery:
      'End to end sales performance analysis and dashboard project in Microsoft Excel',
    keywords: ['sales', 'project', 'analysis', 'revenue', 'performance', 'dashboard', 'pivot'],
  },
  'lvl-6-mod-2': {
    conceptQuery:
      'Customer data analysis in Microsoft Excel PivotTables and lookup project tutorial',
    labQuery:
      'How to analyze customer purchasing behavior and retention in Excel step by step',
    keywords: ['customer', 'customers', 'analysis', 'sales', 'data', 'pivot', 'project'],
  },
  'lvl-6-mod-3': {
    conceptQuery:
      'Inventory management and stock movement analysis in Microsoft Excel tutorial',
    labQuery:
      'How to build an inventory tracker and reorder alert sheet in Excel step by step',
    keywords: ['inventory', 'stock', 'reorder', 'management', 'tracker', 'analysis'],
  },
  'lvl-6-mod-4': {
    conceptQuery:
      'Budget vs actual variance analysis in Microsoft Excel financial reporting tutorial',
    labQuery:
      'How to analyze business expenses and budget variance in Excel step by step',
    keywords: ['budget', 'actual', 'variance', 'expense', 'expenses', 'financial', 'analysis'],
  },
  'lvl-6-mod-5': {
    conceptQuery:
      'Employee performance KPI scorecard and operational report in Microsoft Excel tutorial',
    labQuery:
      'How to build an operational KPI performance tracker and report in Excel',
    keywords: ['performance', 'kpi', 'scorecard', 'employee', 'tracker', 'report', 'dashboard'],
  },
  'lvl-6-mod-6': {
    conceptQuery:
      'Complete Excel data analysis portfolio project from raw data to dashboard step by step',
    labQuery:
      'Full end to end data analyst Excel project data cleaning PivotTables and dashboard',
    keywords: ['project', 'data analyst', 'portfolio', 'dashboard', 'complete', 'analysis'],
  },
};

function scrubApiKeyFromMessage(msg: string): string {
  return String(msg || '').replace(/key=[^&\s]+/gi, 'key=REDACTED');
}

export function isYoutubeApiKeyConfigured(): boolean {
  const key = (process.env.YOUTUBE_API_KEY || '').trim();
  return (
    Boolean(key) &&
    key !== 'your-youtube-data-api-v3-key' &&
    key !== 'MY_YOUTUBE_API_KEY'
  );
}

export function extractYoutubeVideoId(input: string): string | null {
  const trimmed = String(input || '').trim();
  if (
    !trimmed ||
    trimmed === 'demo-preview-video-id' ||
    trimmed === 'demo-lab-video-id'
  ) {
    return null;
  }
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function cleanLessonTopicTitle(title: string): string {
  return String(title || '')
    .replace(/:\s*Core Concepts & Walkthrough/gi, '')
    .replace(/:\s*Hands-On Business Lab/gi, '')
    .replace(/:\s*Applied Spreadsheet Lab/gi, '')
    .replace(/^Project\s*\d+:\s*/i, '')
    .replace(/—\s*Part\s*\d+/gi, '')
    .trim();
}

export function parseIso8601Duration(iso?: string): {
  seconds: number;
  formatted: string;
} {
  if (!iso) return { seconds: 0, formatted: 'N/A' };
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { seconds: 0, formatted: 'N/A' };
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted =
    hours > 0
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${minutes}:${pad(seconds)}`;
  return { seconds: totalSeconds, formatted };
}

export function findLessonInCurriculum(lessonId: string): {
  lesson: Lesson;
  moduleId: string;
  moduleOrder: number;
  moduleTitle: string;
  levelNumber: number;
  levelTitle: string;
} | null {
  for (const lvl of CURRICULUM_LEVELS) {
    for (const mod of lvl.modules) {
      for (const les of mod.lessons) {
        if (les.id === lessonId) {
          return {
            lesson: les,
            moduleId: mod.id,
            moduleOrder: mod.orderIndex,
            moduleTitle: mod.title,
            levelNumber: lvl.levelNumber,
            levelTitle: lvl.title,
          };
        }
      }
    }
  }
  return null;
}

export function buildYoutubeQueryForLesson(params: {
  lessonId?: string;
  moduleId?: string;
  orderIndex?: number;
  title: string;
  moduleTitle?: string;
  levelNumber: number;
  keyFormulas?: string[];
  customQuery?: string;
}): string {
  if (params.customQuery && params.customQuery.trim()) {
    return params.customQuery.trim();
  }

  // Check if lessonId or moduleId maps to our hand-tuned 54-module curriculum map
  const resolvedModuleId =
    params.moduleId ||
    (params.lessonId ? params.lessonId.replace(/-les-\d+$/, '') : '');
  const isHandsOnLab =
    params.orderIndex === 2 ||
    /Hands-On Business Lab/i.test(params.title) ||
    Boolean(params.lessonId && params.lessonId.endsWith('-les-2'));

  const mapped = resolvedModuleId
    ? MODULE_TOPIC_QUERY_MAP[resolvedModuleId]
    : undefined;
  if (mapped) {
    return isHandsOnLab ? mapped.labQuery : mapped.conceptQuery;
  }

  const cleanTitle = cleanLessonTopicTitle(params.title);

  const levelFocusByNumber: Record<number, string> = {
    1: 'Microsoft Excel tutorial for absolute beginners step by step',
    2: 'Microsoft Excel formulas and functions tutorial for beginners',
    3: 'Microsoft Excel data cleaning tutorial step by step',
    4: 'Microsoft Excel data analysis tutorial for beginners',
    5: 'Microsoft Excel charts and dashboard reporting tutorial',
    6: 'Microsoft Excel data analysis project step by step tutorial',
  };

  const levelContext =
    levelFocusByNumber[params.levelNumber] ||
    'Microsoft Excel tutorial for beginners step by step';

  if (isHandsOnLab) {
    return `${cleanTitle} practical example ${levelContext}`.trim();
  }

  return `${cleanTitle} ${levelContext}`.trim();
}

function extractTopicKeywords(params: {
  lessonId: string;
  moduleId?: string;
  title: string;
  moduleTitle: string;
}): string[] {
  const resolvedModuleId =
    params.moduleId || params.lessonId.replace(/-les-\d+$/, '');
  const mapped = MODULE_TOPIC_QUERY_MAP[resolvedModuleId];

  const stopWords = new Set([
    'and',
    'the',
    'for',
    'with',
    'into',
    'from',
    'using',
    'how',
    'what',
    'why',
    'core',
    'concepts',
    'walkthrough',
    'applied',
    'hands',
    'business',
    'spreadsheet',
    'lab',
    'lesson',
    'module',
    'level',
    'part',
    'basic',
    'basics',
    'project',
    'understanding',
    'introduction',
    'creating',
    'building',
    'working',
  ]);

  const cleanTitle = cleanLessonTopicTitle(params.title);
  const cleanModTitle = cleanLessonTopicTitle(params.moduleTitle);

  const rawText = `${cleanTitle} ${cleanModTitle}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ');

  const tokens = rawText
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w));

  const combined = mapped ? [...mapped.keywords, ...tokens] : tokens;
  if (!combined.includes('excel')) {
    combined.push('excel');
  }
  return Array.from(new Set(combined));
}

function hasNonLatinScript(text: string): boolean {
  // Detect Devanagari, Arabic, Cyrillic, Bengali, Tamil, Thai, CJK scripts
  return /[\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u0980-\u09FF\u0B80-\u0BFF\u0E00-\u0E7F\u4E00-\u9FFF]/.test(
    text
  );
}

export function assessAndScoreVideo(
  videoItem: any,
  lessonContext: {
    lessonId: string;
    moduleId?: string;
    orderIndex?: number;
    title: string;
    description: string;
    moduleTitle: string;
    levelNumber: number;
    keyFormulas: string[];
    conceptSummary: string[];
  },
  source: 'youtube_discovery' | 'manual_url' = 'youtube_discovery'
): YoutubeVideoRecommendation | null {
  const videoId =
    typeof videoItem.id === 'string'
      ? videoItem.id
      : videoItem.id?.videoId || '';
  if (!videoId) return null;

  const snippet = videoItem.snippet || {};
  const contentDetails = videoItem.contentDetails || {};
  const status = videoItem.status || {};
  const statistics = videoItem.statistics || {};

  const title = String(snippet.title || '').trim();
  const description = String(snippet.description || '').trim();
  const channelTitle = String(snippet.channelTitle || 'YouTube Creator').trim();
  const combinedLower = `${title} ${description} ${channelTitle}`.toLowerCase();

  const isPublic = status.privacyStatus === 'public';
  const isEmbeddable = status.embeddable !== false;
  const isAgeRestricted =
    contentDetails.contentRating?.ytRating === 'ytAgeRestricted';
  const isDeletedOrPrivate =
    !title ||
    title === 'Private video' ||
    title === 'Deleted video' ||
    !isPublic ||
    !isEmbeddable ||
    isAgeRestricted;

  if (isDeletedOrPrivate) {
    return null;
  }

  const { seconds: durationSeconds, formatted: durationFormatted } =
    parseIso8601Duration(contentDetails.duration);

  // Exclude very short clips (< 75s Shorts) or overly long streams (> 4 hours) for automatic discovery
  if (
    source === 'youtube_discovery' &&
    (durationSeconds < 75 || durationSeconds > 14400)
  ) {
    return null;
  }

  // Must relate to Excel / spreadsheets
  const mentionsExcel =
    combinedLower.includes('excel') ||
    combinedLower.includes('spreadsheet') ||
    combinedLower.includes('pivottable') ||
    combinedLower.includes('pivot table') ||
    combinedLower.includes('vlookup') ||
    combinedLower.includes('xlookup') ||
    combinedLower.includes('power query') ||
    combinedLower.includes('workbook') ||
    combinedLower.includes('worksheet');

  if (source === 'youtube_discovery' && !mentionsExcel) {
    return null;
  }

  // Language verification checks (never fabricate verification)
  const audioLang = snippet.defaultAudioLanguage
    ? String(snippet.defaultAudioLanguage).toLowerCase()
    : null;
  const textLang = snippet.defaultLanguage
    ? String(snippet.defaultLanguage).toLowerCase()
    : null;

  const explicitlyNonEnglishTag =
    (audioLang && !audioLang.startsWith('en')) ||
    (textLang && !textLang.startsWith('en'));

  const containsNonEnglishMarkers =
    hasNonLatinScript(title) ||
    NON_ENGLISH_MARKERS.some((marker) => combinedLower.includes(marker));

  if (
    source === 'youtube_discovery' &&
    (explicitlyNonEnglishTag || containsNonEnglishMarkers)
  ) {
    return null;
  }

  const evidenceSummary: string[] = [];
  const cautionNotes: string[] = [];

  // 1. Topic Relevance Score (0 - 40)
  const keywords = extractTopicKeywords({
    lessonId: lessonContext.lessonId,
    moduleId: lessonContext.moduleId,
    title: lessonContext.title,
    moduleTitle: lessonContext.moduleTitle,
  });

  const matchedKeywordList = keywords.filter((kw) => combinedLower.includes(kw));
  const matchedKeywords = matchedKeywordList.length;

  const targetKeywordCount = Math.min(5, Math.max(2, keywords.length));
  const keywordRatio = Math.min(1, matchedKeywords / targetKeywordCount);
  let topicMatchScore = Math.round(
    Math.min(40, keywordRatio * 34 + (mentionsExcel ? 6 : 0))
  );

  const cleanTopicName = cleanLessonTopicTitle(lessonContext.title);

  if (
    cleanTopicName.length >= 4 &&
    title.toLowerCase().includes(cleanTopicName.toLowerCase().slice(0, 16))
  ) {
    topicMatchScore = Math.min(40, topicMatchScore + 4);
  }

  if (matchedKeywords > 0) {
    evidenceSummary.push(
      `Matches ${matchedKeywords} topic keyword(s) (${matchedKeywordList
        .slice(0, 5)
        .join(', ')})`
    );
  } else {
    cautionNotes.push(
      'Limited exact keyword overlap in title/description; verify topic alignment before publishing.'
    );
  }

  // 2. Beginner-Friendly & Appropriate Level Signals (0 - 25)
  let beginnerSignalScore = 10;
  const beginnerSignals = [
    'for beginners',
    'beginner',
    'step by step',
    'step-by-step',
    'tutorial',
    'how to',
    'basics',
    'explained',
    'from scratch',
    'introduction',
    'easy',
    'guide',
    'examples',
    'practice',
  ];
  const matchedBeginnerTerms = beginnerSignals.filter((sig) =>
    combinedLower.includes(sig)
  );
  beginnerSignalScore += Math.min(12, matchedBeginnerTerms.length * 3);

  const isHandsOnLab =
    lessonContext.orderIndex === 2 ||
    /Hands-On Business Lab/i.test(lessonContext.title) ||
    lessonContext.lessonId.endsWith('-les-2');

  if (
    isHandsOnLab &&
    (combinedLower.includes('example') ||
      combinedLower.includes('practice') ||
      combinedLower.includes('project') ||
      combinedLower.includes('how to'))
  ) {
    beginnerSignalScore = Math.min(25, beginnerSignalScore + 3);
  }

  // Check for timestamps/chapters in description
  const hasChapters = /(?:^|\s)0?0:00(?:\s|-)/.test(description);
  if (hasChapters) {
    beginnerSignalScore = Math.min(25, beginnerSignalScore + 3);
    evidenceSummary.push(
      'Includes structured chapter timestamps in video description'
    );
  }

  if (matchedBeginnerTerms.length > 0) {
    evidenceSummary.push(
      `Beginner-oriented teaching terms in metadata (${matchedBeginnerTerms
        .slice(0, 3)
        .join(', ')})`
    );
  }

  // Penalize overly advanced tools for beginner levels (Levels 1-3)
  if (lessonContext.levelNumber <= 3) {
    const advancedTerms = ['vba', 'macro', 'power bi', 'dax', 'python in excel'];
    const foundAdvanced = advancedTerms.filter((t) =>
      title.toLowerCase().includes(t)
    );
    if (foundAdvanced.length > 0) {
      beginnerSignalScore = Math.max(0, beginnerSignalScore - 14);
      cautionNotes.push(
        `Mentions advanced tooling (${foundAdvanced.join(
          ', '
        )}) which may be too complex for Level ${lessonContext.levelNumber} beginners.`
      );
    }
  }

  // 3. Channel Reputation, English Metadata & Captions (0 - 20)
  let channelTeachingScore = 7;
  const isKnownEducator = REPUTABLE_EXCEL_CHANNELS.some((ch) =>
    channelTitle.toLowerCase().includes(ch)
  );
  if (isKnownEducator) {
    channelTeachingScore += 7;
    evidenceSummary.push(
      `Published by established Excel instruction channel (${channelTitle})`
    );
  }

  if (audioLang && audioLang.startsWith('en')) {
    channelTeachingScore += 4;
    evidenceSummary.push(
      `Uploader audio language metadata tag is '${audioLang}' (spoken clarity still unverified until human preview)`
    );
  } else {
    cautionNotes.push(
      'Uploader did not declare defaultAudioLanguage tag in YouTube metadata; English inferred from title/description only.'
    );
  }

  const hasClosedCaptions = contentDetails.caption === 'true';
  if (hasClosedCaptions) {
    channelTeachingScore = Math.min(20, channelTeachingScore + 2);
    evidenceSummary.push('Closed captions available for learner accessibility');
  }

  // 4. Duration & Practical Demonstration Pacing (0 - 15)
  let durationScore = 8;
  if (durationSeconds >= 210 && durationSeconds <= 1980) {
    // 3.5 min to 33 min is ideal for step-by-step Excel demonstration
    durationScore = 15;
    evidenceSummary.push(
      `Practical tutorial length (${durationFormatted}) suited for step-by-step screen demonstration`
    );
  } else if (durationSeconds >= 110 && durationSeconds < 210) {
    durationScore = 12;
    evidenceSummary.push(`Focused concept walkthrough (${durationFormatted})`);
  } else if (durationSeconds > 1980 && durationSeconds <= 3900) {
    durationScore = 11;
    evidenceSummary.push(`In-depth workshop length (${durationFormatted})`);
  } else {
    durationScore = 6;
  }

  const totalRankScore = Math.min(
    100,
    topicMatchScore + beginnerSignalScore + channelTeachingScore + durationScore
  );

  // Plain-English explanation of what the student will learn
  const cleanObjective =
    lessonContext.conceptSummary[0] ||
    lessonContext.description ||
    `how to perform ${cleanTopicName} step by step in Microsoft Excel`;

  const whatYouWillLearn = `In this ${durationFormatted} tutorial from ${channelTitle}, you will see on-screen demonstrations of ${cleanTopicName.toLowerCase()} in Microsoft Excel — specifically ${cleanObjective
    .charAt(0)
    .toLowerCase()}${cleanObjective.slice(1)}`;

  const suitabilityLabel: YoutubeVideoRecommendation['suitabilityLabel'] =
    source === 'manual_url'
      ? 'Manual Admin Selection'
      : totalRankScore >= 65
      ? 'Strong Beginner Match (Metadata Evidence)'
      : 'Moderate Match (Needs Admin Review)';

  const thumbnailUrl =
    snippet.thumbnails?.high?.url ||
    snippet.thumbnails?.medium?.url ||
    snippet.thumbnails?.default?.url ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const evidence: SuitabilityEvidence = {
    audioLanguageTag: audioLang,
    textLanguageTag: textLang,
    hasClosedCaptions,
    isEmbeddable,
    isPublic,
    isAgeRestricted,
    topicMatchScore,
    beginnerSignalScore,
    channelTeachingScore,
    durationScore,
    totalRankScore,
    evidenceSummary,
    cautionNotes,
  };

  return {
    videoId,
    lessonId: lessonContext.lessonId,
    title,
    channelTitle,
    channelId: snippet.channelId,
    description: description.slice(0, 500),
    thumbnailUrl,
    durationIso: contentDetails.duration,
    durationFormatted,
    durationSeconds,
    publishedAt: snippet.publishedAt,
    viewCount: statistics.viewCount ? Number(statistics.viewCount) : undefined,
    likeCount: statistics.likeCount ? Number(statistics.likeCount) : undefined,
    whatYouWillLearn,
    suitabilityLabel,
    evidence,
    status: 'candidate',
    isPrimary: false,
    source,
    discoveredAt: new Date().toISOString(),
    approvedAt: null,
  };
}

export async function discoverAndRankYoutubeVideosForLesson(params: {
  lessonId: string;
  customQuery?: string;
}): Promise<{
  ok: boolean;
  configured: boolean;
  quotaExceeded?: boolean;
  searchQueryUsed: string;
  candidates: YoutubeVideoRecommendation[];
  rawVideoItems?: any[];
  error?: string;
}> {
  const found = findLessonInCurriculum(params.lessonId);
  const lessonContext = found
    ? {
        lessonId: found.lesson.id,
        moduleId: found.moduleId,
        orderIndex: found.lesson.orderIndex,
        title: found.lesson.title,
        description: found.lesson.description,
        moduleTitle: found.moduleTitle,
        levelNumber: found.lesson.levelNumber,
        keyFormulas: found.lesson.keyFormulas,
        conceptSummary: found.lesson.conceptSummary,
      }
    : {
        lessonId: params.lessonId,
        moduleId: params.lessonId.replace(/-les-\d+$/, ''),
        orderIndex: 1,
        title: params.customQuery || 'Microsoft Excel Beginner Lesson',
        description: 'Learn Microsoft Excel step by step for beginners.',
        moduleTitle: 'Excel Foundations',
        levelNumber: 1,
        keyFormulas: [],
        conceptSummary: ['Learn how to use Microsoft Excel step by step.'],
      };

  const searchQueryUsed = buildYoutubeQueryForLesson({
    lessonId: lessonContext.lessonId,
    moduleId: lessonContext.moduleId,
    orderIndex: lessonContext.orderIndex,
    title: lessonContext.title,
    moduleTitle: lessonContext.moduleTitle,
    levelNumber: lessonContext.levelNumber,
    keyFormulas: lessonContext.keyFormulas,
    customQuery: params.customQuery,
  });

  if (!isYoutubeApiKeyConfigured()) {
    return {
      ok: false,
      configured: false,
      searchQueryUsed,
      candidates: [],
      error:
        'YOUTUBE_API_KEY is not configured on the server. Add YOUTUBE_API_KEY in AI Studio Secrets to search YouTube Data API v3.',
    };
  }

  const apiKey = (process.env.YOUTUBE_API_KEY || '').trim();

  try {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', searchQueryUsed);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('videoEmbeddable', 'true');
    searchUrl.searchParams.set('safeSearch', 'strict');
    searchUrl.searchParams.set('relevanceLanguage', 'en');
    searchUrl.searchParams.set('maxResults', '15');
    searchUrl.searchParams.set('key', apiKey);

    const searchRes = await fetch(searchUrl.toString());
    const searchData: any = await searchRes.json();

    if (!searchRes.ok) {
      const reason = searchData?.error?.errors?.[0]?.reason || '';
      const isQuota =
        searchRes.status === 403 &&
        (reason.includes('quota') ||
          String(searchData?.error?.message || '')
            .toLowerCase()
            .includes('quota'));

      return {
        ok: false,
        configured: true,
        quotaExceeded: isQuota,
        searchQueryUsed,
        candidates: [],
        error: scrubApiKeyFromMessage(
          searchData?.error?.message ||
            'YouTube Data API v3 search request failed.'
        ),
      };
    }

    const videoIds: string[] = (searchData.items || [])
      .map((item: any) => item.id?.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) {
      return {
        ok: true,
        configured: true,
        searchQueryUsed,
        candidates: [],
        rawVideoItems: [],
      };
    }

    // Fetch full details (duration, embeddable status, captions, audio language, statistics)
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.set(
      'part',
      'snippet,contentDetails,status,statistics'
    );
    detailsUrl.searchParams.set('id', videoIds.join(','));
    detailsUrl.searchParams.set('key', apiKey);

    const detailsRes = await fetch(detailsUrl.toString());
    const detailsData: any = await detailsRes.json();

    if (!detailsRes.ok) {
      return {
        ok: false,
        configured: true,
        searchQueryUsed,
        candidates: [],
        error: scrubApiKeyFromMessage(
          detailsData?.error?.message ||
            'Failed to load video metadata from YouTube Data API v3.'
        ),
      };
    }

    const rawItems = detailsData.items || [];
    const assessed: YoutubeVideoRecommendation[] = [];
    for (const vItem of rawItems) {
      const scored = assessAndScoreVideo(
        vItem,
        lessonContext,
        'youtube_discovery'
      );
      if (scored && scored.evidence.totalRankScore >= 48) {
        assessed.push(scored);
      }
    }

    // Sort descending by totalRankScore
    assessed.sort(
      (a, b) => b.evidence.totalRankScore - a.evidence.totalRankScore
    );

    return {
      ok: true,
      configured: true,
      searchQueryUsed,
      candidates: assessed.slice(0, 6),
      rawVideoItems: rawItems,
    };
  } catch (err: any) {
    return {
      ok: false,
      configured: true,
      searchQueryUsed,
      candidates: [],
      error: scrubApiKeyFromMessage(
        err.message || 'Network error while querying YouTube Data API v3.'
      ),
    };
  }
}

/**
 * Applies candidate ranking and automatic strong-match approval to a lesson record,
 * while strictly preserving existing manually approved tutorials.
 */
export function mergeAndAutoApproveCandidates(params: {
  existingRecord: LessonVideoRecommendationsRecord;
  candidates: YoutubeVideoRecommendation[];
  searchQueryUsed: string;
  autoApproveTopStrong: boolean;
  avoidPrimaryVideoIds?: string[];
}): LessonVideoRecommendationsRecord {
  const {
    existingRecord,
    candidates,
    searchQueryUsed,
    autoApproveTopStrong,
    avoidPrimaryVideoIds = [],
  } = params;

  const existingById = new Map(
    existingRecord.recommendations.map((r) => [r.videoId, r])
  );

  // Preserve already-approved recommendations
  const mergedList = [
    ...existingRecord.recommendations.filter((r) => r.status === 'approved'),
  ];
  const mergedIds = new Set(mergedList.map((r) => r.videoId));

  for (const cand of candidates) {
    if (mergedIds.has(cand.videoId)) continue;
    const prev = existingById.get(cand.videoId);
    if (prev && prev.status === 'rejected') {
      mergedList.push({
        ...cand,
        status: 'rejected',
        isPrimary: false,
      });
    } else {
      mergedList.push({ ...cand });
    }
    mergedIds.add(cand.videoId);
  }

  const hasApprovedAlready = mergedList.some((r) => r.status === 'approved');
  let reviewReason: string | null = null;

  if (!hasApprovedAlready && autoApproveTopStrong) {
    // Filter candidates that meet strong beginner & topic criteria (score >= 62 & topicMatchScore >= 16)
    const eligibleStrong = mergedList.filter(
      (r) =>
        r.status === 'candidate' &&
        (r.evidence?.totalRankScore || 0) >= 62 &&
        (r.evidence?.topicMatchScore || 0) >= 16 &&
        r.evidence?.isEmbeddable !== false &&
        r.evidence?.isPublic !== false
    );

    if (eligibleStrong.length > 0) {
      // Pick primary video (preferring one not in avoidPrimaryVideoIds if possible so Lesson 1 and Lesson 2 in same module have distinct primaries)
      const preferredPrimary =
        eligibleStrong.find(
          (r) => !avoidPrimaryVideoIds.includes(r.videoId)
        ) || eligibleStrong[0];

      let approvedCount = 0;
      const nowIso = new Date().toISOString();

      for (const item of mergedList) {
        if (item.videoId === preferredPrimary.videoId) {
          item.status = 'approved';
          item.isPrimary = true;
          item.approvedAt = nowIso;
          approvedCount++;
        }
      }

      for (const item of eligibleStrong) {
        if (approvedCount >= 3) break;
        if (item.videoId === preferredPrimary.videoId) continue;
        item.status = 'approved';
        item.isPrimary = false;
        item.approvedAt = nowIso;
        approvedCount++;
      }
    } else if (mergedList.some((r) => r.status === 'candidate')) {
      reviewReason =
        'Candidate videos were found on YouTube, but none met the automatic high-confidence beginner threshold (score >= 62). Please review and approve a video manually in the Admin Console.';
    } else {
      reviewReason =
        'No suitable embeddable English-metadata tutorials matched this lesson query. Try refining the search query or pasting a manual YouTube URL.';
    }
  } else if (!hasApprovedAlready) {
    if (mergedList.some((r) => r.status === 'candidate')) {
      reviewReason =
        'Candidate tutorials discovered and awaiting administrator approval.';
    } else {
      reviewReason =
        'No suitable tutorials found for this query. Refine search or paste a YouTube URL.';
    }
  }

  const nowIso = new Date().toISOString();
  return {
    lessonId: existingRecord.lessonId,
    searchQueryUsed,
    lastRefreshedAt: nowIso,
    lastSuccessfulSearchAt: nowIso,
    lastError: null,
    reviewReason,
    brokenVideoIds: existingRecord.brokenVideoIds || [],
    recommendations: mergedList,
  };
}

export async function fetchSingleYoutubeVideoForLesson(params: {
  lessonId: string;
  videoUrlOrId: string;
}): Promise<{
  ok: boolean;
  recommendation?: YoutubeVideoRecommendation;
  error?: string;
}> {
  const videoId = extractYoutubeVideoId(params.videoUrlOrId);
  if (!videoId) {
    return {
      ok: false,
      error:
        'Please enter a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=...) or 11-character video ID.',
    };
  }

  const found = findLessonInCurriculum(params.lessonId);
  const lessonContext = found
    ? {
        lessonId: found.lesson.id,
        moduleId: found.moduleId,
        orderIndex: found.lesson.orderIndex,
        title: found.lesson.title,
        description: found.lesson.description,
        moduleTitle: found.moduleTitle,
        levelNumber: found.lesson.levelNumber,
        keyFormulas: found.lesson.keyFormulas,
        conceptSummary: found.lesson.conceptSummary,
      }
    : {
        lessonId: params.lessonId,
        moduleId: params.lessonId.replace(/-les-\d+$/, ''),
        orderIndex: 1,
        title: 'Excel Lesson Tutorial',
        description: 'Step-by-step Microsoft Excel tutorial.',
        moduleTitle: 'Excel Module',
        levelNumber: 1,
        keyFormulas: [],
        conceptSummary: ['Learn how to perform this task in Microsoft Excel.'],
      };

  if (isYoutubeApiKeyConfigured()) {
    try {
      const apiKey = (process.env.YOUTUBE_API_KEY || '').trim();
      const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      detailsUrl.searchParams.set(
        'part',
        'snippet,contentDetails,status,statistics'
      );
      detailsUrl.searchParams.set('id', videoId);
      detailsUrl.searchParams.set('key', apiKey);

      const res = await fetch(detailsUrl.toString());
      const data: any = await res.json();
      if (res.ok && data.items && data.items.length > 0) {
        const scored = assessAndScoreVideo(
          data.items[0],
          lessonContext,
          'manual_url'
        );
        if (!scored) {
          return {
            ok: false,
            error:
              'This YouTube video is private, deleted, age-restricted, or has embedding disabled by the creator.',
          };
        }
        return { ok: true, recommendation: scored };
      } else if (res.ok && (!data.items || data.items.length === 0)) {
        return {
          ok: false,
          error: `No public YouTube video found with ID "${videoId}".`,
        };
      }
    } catch {
      // Fall through to manual metadata fallback if API is unreachable
    }
  }

  const cleanTopic = cleanLessonTopicTitle(lessonContext.title);

  const manualRec: YoutubeVideoRecommendation = {
    videoId,
    lessonId: params.lessonId,
    title: `${cleanTopic} — Instructor Selected Tutorial`,
    channelTitle: 'Admin Selected YouTube Tutorial',
    description: `Manually linked tutorial video for ${cleanTopic}.`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    durationFormatted: `${found?.lesson.durationMinutes || 12}:00`,
    durationSeconds: (found?.lesson.durationMinutes || 12) * 60,
    whatYouWillLearn: `This instructor-selected video walks you through ${cleanTopic.toLowerCase()} in Microsoft Excel.`,
    suitabilityLabel: 'Admin Approved · Beginner Suitable',
    evidence: {
      audioLanguageTag: null,
      textLanguageTag: null,
      hasClosedCaptions: false,
      isEmbeddable: true,
      isPublic: true,
      isAgeRestricted: false,
      topicMatchScore: 35,
      beginnerSignalScore: 20,
      channelTeachingScore: 15,
      durationScore: 15,
      totalRankScore: 85,
      evidenceSummary: [
        'Manually selected and approved by Academy Administrator',
      ],
      cautionNotes: [],
    },
    status: 'approved',
    isPrimary: true,
    source: 'manual_url',
    discoveredAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
  };

  return { ok: true, recommendation: manualRec };
}

/**
 * Batch verifies a list of YouTube video IDs via videos.list (costs 1 quota unit per 50 videos)
 * Returns a Set of valid, public, embeddable, non-age-restricted video IDs.
 */
export async function verifyVideosAvailabilityOnYoutube(
  videoIds: string[]
): Promise<{
  checked: boolean;
  validVideoIds: Set<string>;
  brokenVideoIds: Set<string>;
  error?: string;
}> {
  const uniqueIds = Array.from(
    new Set(videoIds.map((v) => String(v || '').trim()).filter(Boolean))
  );
  const validVideoIds = new Set<string>();
  const brokenVideoIds = new Set<string>();

  // Any ID that isn't a valid 11-char YouTube ID (e.g. 'demo-preview-video-id') is immediately broken
  const syntaxValidIds: string[] = [];
  for (const id of uniqueIds) {
    if (extractYoutubeVideoId(id) === id) {
      syntaxValidIds.push(id);
    } else {
      brokenVideoIds.add(id);
    }
  }

  if (!isYoutubeApiKeyConfigured() || syntaxValidIds.length === 0) {
    for (const id of syntaxValidIds) {
      validVideoIds.add(id);
    }
    return {
      checked: isYoutubeApiKeyConfigured(),
      validVideoIds,
      brokenVideoIds,
    };
  }

  const apiKey = (process.env.YOUTUBE_API_KEY || '').trim();

  try {
    // Process in chunks of 50 (YouTube Data API v3 limit per videos.list call)
    for (let i = 0; i < syntaxValidIds.length; i += 50) {
      const chunk = syntaxValidIds.slice(i, i + 50);
      const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      detailsUrl.searchParams.set('part', 'snippet,contentDetails,status');
      detailsUrl.searchParams.set('id', chunk.join(','));
      detailsUrl.searchParams.set('key', apiKey);

      const res = await fetch(detailsUrl.toString());
      const data: any = await res.json();
      if (!res.ok) {
        // Don't mark videos broken if the API call itself failed
        for (const id of chunk) validVideoIds.add(id);
        return {
          checked: false,
          validVideoIds,
          brokenVideoIds,
          error: scrubApiKeyFromMessage(
            data?.error?.message || 'Failed to verify video status on YouTube.'
          ),
        };
      }

      const returnedById = new Map<string, any>();
      for (const item of data.items || []) {
        returnedById.set(item.id, item);
      }

      for (const id of chunk) {
        const item = returnedById.get(id);
        if (!item) {
          brokenVideoIds.add(id);
          continue;
        }
        const title = String(item.snippet?.title || '');
        const isPublic = item.status?.privacyStatus === 'public';
        const isEmbeddable = item.status?.embeddable !== false;
        const isAgeRestricted =
          item.contentDetails?.contentRating?.ytRating === 'ytAgeRestricted';

        if (
          !title ||
          title === 'Private video' ||
          title === 'Deleted video' ||
          !isPublic ||
          !isEmbeddable ||
          isAgeRestricted
        ) {
          brokenVideoIds.add(id);
        } else {
          validVideoIds.add(id);
        }
      }
    }

    return { checked: true, validVideoIds, brokenVideoIds };
  } catch (err: any) {
    for (const id of syntaxValidIds) validVideoIds.add(id);
    return {
      checked: false,
      validVideoIds,
      brokenVideoIds,
      error: scrubApiKeyFromMessage(
        err.message || 'Network error while verifying video availability.'
      ),
    };
  }
}

// ============================================================================
// PERSISTENCE LAYER (Supabase PostgreSQL + Local JSON Cache Fallback)
// ============================================================================

export function readLocalCache(): Record<
  string,
  LessonVideoRecommendationsRecord
> {
  try {
    if (fs.existsSync(LOCAL_CACHE_PATH)) {
      const raw = fs.readFileSync(LOCAL_CACHE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // ignore read error
  }
  return {};
}

export function writeLocalCache(
  store: Record<string, LessonVideoRecommendationsRecord>
): void {
  try {
    fs.mkdirSync(path.dirname(LOCAL_CACHE_PATH), { recursive: true });
    fs.writeFileSync(LOCAL_CACHE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // ignore write error
  }
}

export async function loadLessonRecommendations(
  supabase: SupabaseClient | null,
  lessonId: string
): Promise<LessonVideoRecommendationsRecord> {
  const localStore = readLocalCache();

  if (supabase) {
    // 1. Try dedicated lesson_video_recommendations table if known to exist or not yet checked
    if (dedicatedRecsTableAvailable !== false) {
      const { data: tableRows, error: tableErr } = await supabase
        .from('lesson_video_recommendations')
        .select('*')
        .eq('lesson_id', lessonId);

      if (tableErr) {
        if (
          tableErr.message?.includes('Could not find the table') ||
          tableErr.code === '42P01'
        ) {
          dedicatedRecsTableAvailable = false;
        }
      } else {
        dedicatedRecsTableAvailable = true;
        if (Array.isArray(tableRows) && tableRows.length > 0) {
          const recs: YoutubeVideoRecommendation[] = tableRows.map(
            (r: any) => ({
              videoId: r.video_id,
              lessonId: r.lesson_id,
              title: r.title,
              channelTitle: r.channel_title,
              description: r.description,
              thumbnailUrl: r.thumbnail_url,
              durationFormatted: r.duration_formatted,
              durationSeconds: Number(r.duration_seconds) || 0,
              whatYouWillLearn: r.what_you_will_learn,
              suitabilityLabel: r.suitability_label,
              evidence: r.evidence || {},
              status: r.status as RecommendationStatus,
              isPrimary: Boolean(r.is_primary),
              source: r.source || 'youtube_discovery',
              discoveredAt: r.discovered_at,
              approvedAt: r.approved_at,
            })
          );
          recs.sort((a, b) => {
            if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
            return (
              (b.evidence?.totalRankScore || 0) -
              (a.evidence?.totalRankScore || 0)
            );
          });
          return {
            lessonId,
            searchQueryUsed: tableRows[0]?.search_query_used || '',
            lastRefreshedAt: tableRows[0]?.discovered_at || null,
            lastSuccessfulSearchAt: tableRows[0]?.discovered_at || null,
            recommendations: recs,
          };
        }
      }
    }

    // 2. Check assignments table row 'yt-rec-cache:<lessonId>' (works immediately on existing Stage 2 schema)
    const { data: assignRow, error: assignErr } = await supabase
      .from('assignments')
      .select('instructions, expected_outcome, created_at')
      .eq('id', `yt-rec-cache:${lessonId}`)
      .maybeSingle();

    if (!assignErr && assignRow?.instructions) {
      try {
        const parsed: LessonVideoRecommendationsRecord = JSON.parse(
          assignRow.instructions
        );
        if (parsed && Array.isArray(parsed.recommendations)) {
          return parsed;
        }
      } catch {
        // ignore parse error
      }
    }
  }

  if (localStore[lessonId]) {
    return localStore[lessonId];
  }

  const found = findLessonInCurriculum(lessonId);
  return {
    lessonId,
    searchQueryUsed: found
      ? buildYoutubeQueryForLesson({
          lessonId: found.lesson.id,
          moduleId: found.moduleId,
          orderIndex: found.lesson.orderIndex,
          title: found.lesson.title,
          moduleTitle: found.moduleTitle,
          levelNumber: found.lesson.levelNumber,
          keyFormulas: found.lesson.keyFormulas,
        })
      : '',
    lastRefreshedAt: null,
    lastSuccessfulSearchAt: null,
    lastError: null,
    reviewReason: null,
    brokenVideoIds: [],
    recommendations: [],
  };
}

export async function saveLessonRecommendations(
  supabase: SupabaseClient | null,
  record: LessonVideoRecommendationsRecord
): Promise<void> {
  // Sort so primary is first, then approved, then candidates by rank score
  record.recommendations.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    if (a.status !== b.status) {
      const order: Record<RecommendationStatus, number> = {
        approved: 0,
        candidate: 1,
        rejected: 2,
      };
      return order[a.status] - order[b.status];
    }
    return (
      (b.evidence?.totalRankScore || 0) - (a.evidence?.totalRankScore || 0)
    );
  });

  // 1. Always update local disk cache
  const localStore = readLocalCache();
  localStore[record.lessonId] = record;
  writeLocalCache(localStore);

  if (!supabase) return;

  // Find primary approved video ID (if any) to sync with public.lessons.youtube_video_id
  const primaryApproved =
    record.recommendations.find(
      (r) => r.status === 'approved' && r.isPrimary
    ) || record.recommendations.find((r) => r.status === 'approved');

  if (primaryApproved) {
    await supabase
      .from('lessons')
      .update({ youtube_video_id: primaryApproved.videoId })
      .eq('id', record.lessonId);
  } else {
    const anyApproved = record.recommendations.some(
      (r) => r.status === 'approved'
    );
    if (!anyApproved) {
      await supabase
        .from('lessons')
        .update({ youtube_video_id: null })
        .eq('id', record.lessonId);
    }
  }

  // 2. Persist into public.assignments ('yt-rec-cache:<lessonId>') which exists in Stage 2 schema
  await supabase.from('assignments').upsert(
    {
      id: `yt-rec-cache:${record.lessonId}`,
      lesson_id: record.lessonId,
      instructions: JSON.stringify(record),
      expected_outcome:
        record.searchQueryUsed || 'YouTube Recommendation Cache',
      created_at: record.lastRefreshedAt || new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  // 3. Also persist into public.lesson_video_recommendations if that table exists
  if (dedicatedRecsTableAvailable !== false) {
    const rows = record.recommendations.map((rec) => ({
      id: `${record.lessonId}:${rec.videoId}`,
      lesson_id: record.lessonId,
      video_id: rec.videoId,
      title: rec.title,
      channel_title: rec.channelTitle,
      description: rec.description,
      thumbnail_url: rec.thumbnailUrl,
      duration_formatted: rec.durationFormatted,
      duration_seconds: rec.durationSeconds,
      what_you_will_learn: rec.whatYouWillLearn,
      suitability_label: rec.suitabilityLabel,
      evidence: rec.evidence,
      status: rec.status,
      is_primary: rec.isPrimary,
      source: rec.source,
      search_query_used: record.searchQueryUsed,
      discovered_at: rec.discoveredAt,
      approved_at: rec.approvedAt || null,
    }));

    if (rows.length > 0) {
      const { error } = await supabase
        .from('lesson_video_recommendations')
        .upsert(rows, { onConflict: 'lesson_id,video_id' });
      if (
        error &&
        (error.message?.includes('Could not find the table') ||
          error.code === '42P01')
      ) {
        dedicatedRecsTableAvailable = false;
      }
    }
  }
}

/**
 * Bulk loads all lesson recommendation records across the entire curriculum
 * using 1 batch query on Supabase + local cache merge.
 */
export async function loadAllLessonRecommendationsMap(
  supabase: SupabaseClient | null
): Promise<{
  recordsByLessonId: Record<string, LessonVideoRecommendationsRecord>;
  dbVideoIdByLessonId: Record<string, string | null>;
  dbErrors: string[];
}> {
  const localStore = readLocalCache();
  const recordsByLessonId: Record<string, LessonVideoRecommendationsRecord> = {
    ...localStore,
  };
  const dbVideoIdByLessonId: Record<string, string | null> = {};
  const dbErrors: string[] = [];

  if (supabase) {
    const [lessonsRes, assignRes] = await Promise.all([
      supabase.from('lessons').select('id, youtube_video_id'),
      supabase
        .from('assignments')
        .select('id, lesson_id, instructions, created_at')
        .like('id', 'yt-rec-cache:%'),
    ]);

    if (lessonsRes.error) {
      dbErrors.push(
        `Supabase lessons query error: ${lessonsRes.error.message}`
      );
    } else {
      for (const row of lessonsRes.data || []) {
        dbVideoIdByLessonId[row.id] = row.youtube_video_id || null;
      }
    }

    if (assignRes.error) {
      dbErrors.push(
        `Supabase assignments cache query error: ${assignRes.error.message}`
      );
    } else {
      for (const row of assignRes.data || []) {
        if (!row.instructions) continue;
        try {
          const parsed: LessonVideoRecommendationsRecord = JSON.parse(
            row.instructions
          );
          if (parsed && parsed.lessonId && Array.isArray(parsed.recommendations)) {
            recordsByLessonId[parsed.lessonId] = parsed;
          }
        } catch {
          // ignore malformed JSON
        }
      }
    }
  }

  return { recordsByLessonId, dbVideoIdByLessonId, dbErrors };
}

/**
 * Builds the complete Video Coverage Audit across all 6 levels (108 lessons).
 */
export async function buildVideoCoverageAudit(
  supabase: SupabaseClient | null,
  options?: { verifyLiveYoutubeStatus?: boolean }
): Promise<VideoCoverageAuditSummary> {
  const { recordsByLessonId, dbVideoIdByLessonId, dbErrors } =
    await loadAllLessonRecommendationsMap(supabase);

  const allCurriculumEntries: {
    lesson: Lesson;
    moduleId: string;
    moduleOrder: number;
    moduleTitle: string;
    levelNumber: number;
    levelTitle: string;
  }[] = [];

  for (const lvl of CURRICULUM_LEVELS) {
    for (const mod of lvl.modules) {
      for (const les of mod.lessons) {
        allCurriculumEntries.push({
          lesson: les,
          moduleId: mod.id,
          moduleOrder: mod.orderIndex,
          moduleTitle: mod.title,
          levelNumber: lvl.levelNumber,
          levelTitle: lvl.title,
        });
      }
    }
  }

  // Optionally verify live status of all currently approved / assigned video IDs on YouTube
  let liveBrokenIds = new Set<string>();
  const apiOrDatabaseErrors = [...dbErrors];

  if (!isYoutubeApiKeyConfigured()) {
    apiOrDatabaseErrors.push(
      'YOUTUBE_API_KEY is not configured on the server. Live YouTube searches are unavailable until configured.'
    );
  }

  if (options?.verifyLiveYoutubeStatus) {
    const allIdsToVerify: string[] = [];
    for (const entry of allCurriculumEntries) {
      const rec = recordsByLessonId[entry.lesson.id];
      const dbVid = dbVideoIdByLessonId[entry.lesson.id];
      if (dbVid) allIdsToVerify.push(dbVid);
      for (const r of rec?.recommendations || []) {
        if (r.status === 'approved') {
          allIdsToVerify.push(r.videoId);
        }
      }
    }

    const verifyRes = await verifyVideosAvailabilityOnYoutube(allIdsToVerify);
    liveBrokenIds = verifyRes.brokenVideoIds;
    if (verifyRes.error) {
      apiOrDatabaseErrors.push(verifyRes.error);
    }

    // If any approved video or DB video ID was found broken, update the record
    for (const entry of allCurriculumEntries) {
      const lessonId = entry.lesson.id;
      const dbVid = dbVideoIdByLessonId[lessonId];
      const rec = recordsByLessonId[lessonId];

      const hasBrokenDbVid = Boolean(dbVid && liveBrokenIds.has(dbVid));
      const hasBrokenApprovedRec = Boolean(
        rec?.recommendations.some(
          (r) => r.status === 'approved' && liveBrokenIds.has(r.videoId)
        )
      );

      if (hasBrokenDbVid || hasBrokenApprovedRec) {
        const currentRec: LessonVideoRecommendationsRecord = rec || {
          lessonId,
          searchQueryUsed: buildYoutubeQueryForLesson({
            lessonId,
            moduleId: entry.moduleId,
            orderIndex: entry.lesson.orderIndex,
            title: entry.lesson.title,
            moduleTitle: entry.moduleTitle,
            levelNumber: entry.levelNumber,
          }),
          lastRefreshedAt: null,
          recommendations: [],
        };

        const brokenSet = new Set(currentRec.brokenVideoIds || []);
        if (dbVid && liveBrokenIds.has(dbVid)) brokenSet.add(dbVid);

        for (const r of currentRec.recommendations) {
          if (r.status === 'approved' && liveBrokenIds.has(r.videoId)) {
            brokenSet.add(r.videoId);
            r.status = 'rejected';
            r.isPrimary = false;
          }
        }

        // Promote next valid approved alternative if available
        if (
          !currentRec.recommendations.some(
            (r) => r.status === 'approved' && r.isPrimary
          )
        ) {
          const nextValid = currentRec.recommendations.find(
            (r) => r.status === 'approved' && !liveBrokenIds.has(r.videoId)
          );
          if (nextValid) nextValid.isPrimary = true;
        }

        currentRec.brokenVideoIds = Array.from(brokenSet);
        recordsByLessonId[lessonId] = currentRec;
        await saveLessonRecommendations(supabase, currentRec);
      }
    }
  }

  let lessonsWithApprovedVideos = 0;
  let lessonsWithoutVideos = 0;
  let lessonsWithBrokenVideos = 0;
  let lessonsAwaitingReview = 0;
  let lessonsWithErrors = 0;
  let latestTimestampMs = 0;

  const items: VideoCoverageAuditItem[] = [];

  for (const entry of allCurriculumEntries) {
    const lessonId = entry.lesson.id;
    const rec = recordsByLessonId[lessonId];
    const dbVid = dbVideoIdByLessonId[lessonId];
    const validDbVid = dbVid ? extractYoutubeVideoId(dbVid) : null;
    const isInvalidPlaceholderDbVid = Boolean(dbVid && !validDbVid);

    const defaultQuery = buildYoutubeQueryForLesson({
      lessonId,
      moduleId: entry.moduleId,
      orderIndex: entry.lesson.orderIndex,
      title: entry.lesson.title,
      moduleTitle: entry.moduleTitle,
      levelNumber: entry.levelNumber,
    });

    const approvedList = (rec?.recommendations || []).filter(
      (r) => r.status === 'approved' && !liveBrokenIds.has(r.videoId)
    );
    const candidateList = (rec?.recommendations || []).filter(
      (r) => r.status === 'candidate'
    );
    const brokenList = [
      ...(rec?.brokenVideoIds || []),
      ...(isInvalidPlaceholderDbVid && dbVid ? [dbVid] : []),
    ];
    const uniqueBrokenCount = new Set(brokenList).size;

    const primaryRec =
      approvedList.find((r) => r.isPrimary) || approvedList[0] || null;

    if (rec?.lastRefreshedAt) {
      const ts = Date.parse(rec.lastRefreshedAt);
      if (!Number.isNaN(ts) && ts > latestTimestampMs) {
        latestTimestampMs = ts;
      }
    }

    let state: LessonVideoCoverageState = 'missing_videos';
    if (primaryRec) {
      state = 'approved';
      lessonsWithApprovedVideos++;
    } else if (rec?.lastError) {
      state = 'search_error';
      lessonsWithErrors++;
      lessonsWithoutVideos++;
    } else if (uniqueBrokenCount > 0) {
      state = 'broken_video';
      lessonsWithBrokenVideos++;
      lessonsWithoutVideos++;
    } else if (candidateList.length > 0 || rec?.reviewReason) {
      state = 'awaiting_review';
      lessonsAwaitingReview++;
      lessonsWithoutVideos++;
    } else {
      state = 'missing_videos';
      lessonsWithoutVideos++;
    }

    items.push({
      lessonId,
      levelNumber: entry.levelNumber,
      levelTitle: entry.levelTitle,
      moduleId: entry.moduleId,
      moduleOrder: entry.moduleOrder,
      moduleTitle: entry.moduleTitle,
      lessonOrder: entry.lesson.orderIndex,
      lessonTitle: entry.lesson.title,
      isFreePreview: entry.lesson.isFreePreview,
      state,
      approvedCount: approvedList.length,
      candidateCount: candidateList.length,
      brokenCount: uniqueBrokenCount,
      primaryVideoId: primaryRec?.videoId || validDbVid || null,
      primaryVideoTitle: primaryRec?.title || null,
      primaryChannelTitle: primaryRec?.channelTitle || null,
      primaryDuration: primaryRec?.durationFormatted || null,
      primarySuitabilityLabel: primaryRec?.suitabilityLabel || null,
      primaryRankScore: primaryRec?.evidence?.totalRankScore ?? null,
      searchQueryUsed: rec?.searchQueryUsed || defaultQuery,
      lastRefreshedAt: rec?.lastRefreshedAt || null,
      lastError: rec?.lastError || null,
      reviewReason: rec?.reviewReason || null,
    });
  }

  return {
    totalPublishedLessons: allCurriculumEntries.length,
    lessonsWithApprovedVideos,
    lessonsWithoutVideos,
    lessonsWithBrokenVideos,
    lessonsAwaitingReview,
    lessonsWithErrors,
    lastSuccessfulSearchDate:
      latestTimestampMs > 0 ? new Date(latestTimestampMs).toISOString() : null,
    youtubeApiConfigured: isYoutubeApiKeyConfigured(),
    supabaseConnected: Boolean(supabase),
    apiOrDatabaseErrors,
    items,
  };
}

/**
 * Discovers, ranks, and auto-approves strong beginner tutorials for a batch of lessons.
 * Uses smart module-pair sharing when both lessons in a module are in the batch
 * to cut YouTube API quota consumption in half while ensuring distinct primary videos.
 */
export async function batchDiscoverLessonVideos(
  supabase: SupabaseClient | null,
  params: {
    lessonIds: string[];
    autoApproveTopStrong?: boolean;
    forceRefresh?: boolean;
  }
): Promise<{
  ok: boolean;
  processedCount: number;
  approvedLessonsCount: number;
  awaitingReviewCount: number;
  failedCount: number;
  quotaExceeded: boolean;
  results: {
    lessonId: string;
    state: LessonVideoCoverageState;
    primaryVideoId: string | null;
    candidatesFound: number;
    error?: string;
  }[];
}> {
  const autoApprove = params.autoApproveTopStrong !== false;
  const { recordsByLessonId } = await loadAllLessonRecommendationsMap(supabase);

  const results: {
    lessonId: string;
    state: LessonVideoCoverageState;
    primaryVideoId: string | null;
    candidatesFound: number;
    error?: string;
  }[] = [];

  let processedCount = 0;
  let approvedLessonsCount = 0;
  let awaitingReviewCount = 0;
  let failedCount = 0;
  let quotaExceeded = false;

  // Group requested lessonIds by moduleId so sibling lessons in the same module can share raw YouTube API items when appropriate
  const rawItemsCacheByModule = new Map<
    string,
    { rawVideoItems: any[]; searchQueryUsed: string }
  >();

  for (const lessonId of params.lessonIds) {
    const found = findLessonInCurriculum(lessonId);
    if (!found) continue;

    const existingRecord =
      recordsByLessonId[lessonId] ||
      (await loadLessonRecommendations(supabase, lessonId));

    // Preserve existing manually approved videos unless forceRefresh is explicitly requested and no manual_url exists
    const hasManualApproval = existingRecord.recommendations.some(
      (r) =>
        r.status === 'approved' &&
        (r.source === 'manual_url' ||
          r.suitabilityLabel === 'Admin Approved · Beginner Suitable')
    );

    if (
      !params.forceRefresh &&
      existingRecord.recommendations.some((r) => r.status === 'approved')
    ) {
      const primary = existingRecord.recommendations.find(
        (r) => r.status === 'approved' && r.isPrimary
      );
      results.push({
        lessonId,
        state: 'approved',
        primaryVideoId: primary?.videoId || null,
        candidatesFound: existingRecord.recommendations.length,
      });
      processedCount++;
      approvedLessonsCount++;
      continue;
    }

    // Check sibling lesson in the same module so we avoid assigning the identical primary video ID to both Lesson 1 and Lesson 2
    const siblingLessonId = lessonId.endsWith('-les-1')
      ? lessonId.replace(/-les-1$/, '-les-2')
      : lessonId.replace(/-les-2$/, '-les-1');
    const siblingRecord = recordsByLessonId[siblingLessonId];
    const siblingPrimaryIds = (siblingRecord?.recommendations || [])
      .filter((r) => r.status === 'approved' && r.isPrimary)
      .map((r) => r.videoId);

    const cachedModuleRaw = rawItemsCacheByModule.get(found.moduleId);
    let candidatesForLesson: YoutubeVideoRecommendation[] = [];
    let queryUsed = '';

    if (cachedModuleRaw && cachedModuleRaw.rawVideoItems.length >= 4) {
      // Score the module's raw items specifically for this lesson's context (e.g. Hands-On Business Lab)
      queryUsed = buildYoutubeQueryForLesson({
        lessonId: found.lesson.id,
        moduleId: found.moduleId,
        orderIndex: found.lesson.orderIndex,
        title: found.lesson.title,
        moduleTitle: found.moduleTitle,
        levelNumber: found.levelNumber,
      });

      const lessonContext = {
        lessonId: found.lesson.id,
        moduleId: found.moduleId,
        orderIndex: found.lesson.orderIndex,
        title: found.lesson.title,
        description: found.lesson.description,
        moduleTitle: found.moduleTitle,
        levelNumber: found.lesson.levelNumber,
        keyFormulas: found.lesson.keyFormulas,
        conceptSummary: found.lesson.conceptSummary,
      };

      const assessed: YoutubeVideoRecommendation[] = [];
      for (const vItem of cachedModuleRaw.rawVideoItems) {
        const scored = assessAndScoreVideo(
          vItem,
          lessonContext,
          'youtube_discovery'
        );
        if (scored && scored.evidence.totalRankScore >= 48) {
          assessed.push(scored);
        }
      }
      assessed.sort(
        (a, b) => b.evidence.totalRankScore - a.evidence.totalRankScore
      );
      candidatesForLesson = assessed.slice(0, 6);
    }

    // If not in module cache or fewer than 2 strong candidates, run a live YouTube search
    if (candidatesForLesson.length < 2) {
      const discovery = await discoverAndRankYoutubeVideosForLesson({
        lessonId,
      });
      queryUsed = discovery.searchQueryUsed;

      if (!discovery.ok) {
        failedCount++;
        processedCount++;
        if (discovery.quotaExceeded) {
          quotaExceeded = true;
        }
        const errRecord: LessonVideoRecommendationsRecord = {
          ...existingRecord,
          searchQueryUsed: queryUsed,
          lastRefreshedAt: new Date().toISOString(),
          lastError:
            discovery.error || 'YouTube Data API v3 search request failed.',
        };
        recordsByLessonId[lessonId] = errRecord;
        await saveLessonRecommendations(supabase, errRecord);

        results.push({
          lessonId,
          state: 'search_error',
          primaryVideoId: null,
          candidatesFound: 0,
          error: discovery.error,
        });

        if (discovery.quotaExceeded) {
          break;
        }
        continue;
      }

      candidatesForLesson = discovery.candidates;
      if (discovery.rawVideoItems && discovery.rawVideoItems.length > 0) {
        rawItemsCacheByModule.set(found.moduleId, {
          rawVideoItems: discovery.rawVideoItems,
          searchQueryUsed: queryUsed,
        });
      }
    }

    const updatedRecord = mergeAndAutoApproveCandidates({
      existingRecord: hasManualApproval
        ? existingRecord
        : {
            ...existingRecord,
            recommendations: params.forceRefresh
              ? existingRecord.recommendations.filter(
                  (r) => r.source === 'manual_url'
                )
              : existingRecord.recommendations,
          },
      candidates: candidatesForLesson,
      searchQueryUsed: queryUsed,
      autoApproveTopStrong: autoApprove,
      avoidPrimaryVideoIds: siblingPrimaryIds,
    });

    recordsByLessonId[lessonId] = updatedRecord;
    await saveLessonRecommendations(supabase, updatedRecord);

    const primaryApproved = updatedRecord.recommendations.find(
      (r) => r.status === 'approved' && r.isPrimary
    );

    processedCount++;
    if (primaryApproved) {
      approvedLessonsCount++;
      results.push({
        lessonId,
        state: 'approved',
        primaryVideoId: primaryApproved.videoId,
        candidatesFound: candidatesForLesson.length,
      });
    } else {
      awaitingReviewCount++;
      results.push({
        lessonId,
        state: 'awaiting_review',
        primaryVideoId: null,
        candidatesFound: candidatesForLesson.length,
      });
    }
  }

  return {
    ok: !quotaExceeded,
    processedCount,
    approvedLessonsCount,
    awaitingReviewCount,
    failedCount,
    quotaExceeded,
    results,
  };
}
