import * as XLSX from 'xlsx';
import { Lesson } from '../types/academy';

export interface ExerciseStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  formulaHint?: string;
  expectedResult?: string;
}

export interface LessonWorkbookOverview {
  lessonId: string;
  starterFileName: string;
  solutionFileName: string;
  challengeTitle: string;
  steps: ExerciseStep[];
  expectedOutcome: string;
  headers: string[];
  starterRows: {
    rowNum: number;
    cells: (string | number)[];
    targetCellNote?: string;
  }[];
  solutionRows: {
    rowNum: number;
    cells: (string | number)[];
    formula?: string;
    explanation?: string;
  }[];
}

/**
 * Clean formula string to pass to SheetJS (remove leading '=' if present)
 */
function cleanFormulaForSheet(rawFormula: string): string {
  const trimmed = rawFormula.trim();
  return trimmed.startsWith('=') ? trimmed.slice(1) : trimmed;
}

/**
 * Generate step-by-step challenge instructions tailored to lesson topic & level
 */
export function getExerciseStepsForLesson(lesson: Lesson): ExerciseStep[] {
  const cleanTitle = lesson.title
    .replace(/:\s*Core Concepts & Walkthrough/gi, '')
    .replace(/:\s*Hands-On Business Lab/gi, '')
    .replace(/:\s*Applied Spreadsheet Lab/gi, '')
    .replace(/^Project\s*\d+:\s*/i, '')
    .trim();

  const primaryFormula = lesson.keyFormulas[0] || '=SUM(B2:B10)';
  const secondaryFormula = lesson.keyFormulas[1] || '=AVERAGE(B2:B10)';

  switch (lesson.levelNumber) {
    case 1:
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Inspect the Table and Column Layout',
          instruction: `Open the Practice Data tab. Locate the columns (${lesson.demoSpreadsheetHeaders.slice(0, 3).join(', ')}). Click cell A1 to see how headers are organized.`,
          expectedResult: 'Familiarity with row numbers and column letters.',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: 'Format Currency and Numbers',
          instruction:
            'Select the amount columns. In the Excel Home tab, apply Currency or Number formatting with 2 decimal places or thousands separators.',
          expectedResult: 'Numbers display with clean commas and currency symbols.',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'Enter Your Calculation Formula',
          instruction: `In the calculated column, type "${primaryFormula}" to compute the difference or total for the first data row, then press Enter.`,
          formulaHint: primaryFormula,
          expectedResult: 'Excel automatically computes the arithmetic result.',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'Copy the Formula Down with the Fill Handle',
          instruction:
            'Hover over the bottom-right corner of the formula cell until the cursor turns into a black cross (+), then double-click or drag down through the table.',
          expectedResult: 'All rows compute relative values automatically.',
        },
        {
          id: 'step-5',
          stepNumber: 5,
          title: 'Calculate Grand Totals at the Bottom',
          instruction:
            'In the summary row below your data, enter =SUM(...) to calculate the overall column total.',
          formulaHint: '=SUM(D2:D6)',
          expectedResult: 'Reconciled overall total for your balance sheet.',
        },
      ];

    case 2:
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Review Lookup & Condition Rules',
          instruction: `Examine the dataset and identify the key lookup or logical requirement for ${cleanTitle}.`,
          expectedResult: 'Identify target criteria column and return column.',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: 'Write the Primary Formula',
          instruction: `In the target cell, enter the formula: ${primaryFormula}. Use commas to separate function arguments carefully.`,
          formulaHint: primaryFormula,
          expectedResult: 'Accurate value returned for the first transaction.',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'Lock Cell References with F4 ($ Signs)',
          instruction:
            'If referencing a lookup table or tax rate cell, press F4 to lock the reference (e.g. $G$1) so it does not shift when copied down.',
          formulaHint: '=$G$1 or $A$2:$C$10',
          expectedResult: 'Absolute reference stays anchored on all rows.',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'Test Edge Cases with IFERROR or Conditional Logic',
          instruction: `Wrap missing values with ${secondaryFormula} to provide a clean fallback message instead of ugly #N/A or #DIV/0! errors.`,
          formulaHint: secondaryFormula,
          expectedResult: 'Clean, professional error-free column outputs.',
        },
      ];

    case 3:
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Audit Raw Data for Inconsistencies',
          instruction:
            'Scan column A for trailing spaces, inconsistent uppercase/lowercase entries, and non-standard date formats.',
          expectedResult: 'Identify dirty records needing standardization.',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: 'Apply Text Cleaning Formulas',
          instruction: `In column B, write ${primaryFormula} to clean extra spaces and convert text to proper Title Case.`,
          formulaHint: primaryFormula,
          expectedResult: 'Clean, capitalized names with single spaces.',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'Convert Range into an Official Excel Table',
          instruction:
            'Press Ctrl + T (Cmd + T on Mac) to convert the dataset into an official Excel Table named tbl_CleanData.',
          expectedResult: 'Banded rows with auto-expanding formulas on new entries.',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'De-duplicate and Verify Quality',
          instruction:
            'Go to Data > Remove Duplicates, verify unique key columns, and check that zero duplicate records remain.',
          expectedResult: 'Verified, deduplicated dataset ready for reporting.',
        },
      ];

    case 4:
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Structure Summary Questions',
          instruction:
            'Define what manager questions this analysis answers: top-selling categories, regional growth, or quarterly variances.',
          expectedResult: 'Clear analytical objective before pivoting.',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: 'Compute Percentage Changes & Variance',
          instruction: `In the growth column, write the formula: ${primaryFormula} to calculate variance between periods.`,
          formulaHint: primaryFormula,
          expectedResult: 'Variance percentage showing growth or contraction.',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'Insert and Configure PivotTable',
          instruction:
            'Select Insert > PivotTable. Place Category in Rows, and Sum of Revenue in Values. Format Values as Currency.',
          expectedResult: 'Instant aggregated commercial breakdown.',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'Apply Conditional Formatting',
          instruction:
            'Highlight values below target in soft red and top performers in soft green using Home > Conditional Formatting.',
          expectedResult: 'Visual patterns immediately apparent to management.',
        },
      ];

    case 5:
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Build Executive KPI Summary Cards',
          instruction:
            'Create headline KPI cards linking to your summary totals: Total Revenue, Gross Margin %, and Active Customers.',
          formulaHint: primaryFormula,
          expectedResult: 'Bold, glanceable top-level executive metrics.',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: 'Insert PivotCharts Aligned to Grid',
          instruction:
            'Add a clean Bar Chart for categories and a Line Chart for monthly trends. Remove chart junk (excessive gridlines and redundant legends).',
          expectedResult: 'Clean, executive-ready presentation charts.',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'Add Interactive Slicers with Report Connections',
          instruction:
            'Insert Slicers for Region and Year. Right-click the Slicer > Report Connections, and check all PivotTables on the sheet.',
          expectedResult: 'One slicer click updates all charts simultaneously.',
        },
      ];

    default: // Level 6
      return [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Inspect Multi-Table Business Schema',
          instruction:
            'Review the transactional data tab and relational dimension lookup tables (Products, Customers, Targets).',
          expectedResult: 'Understand relationships between primary and foreign keys.',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: 'Integrate Datasets with Lookups & Calculated Columns',
          instruction: `Enrich each transaction with dimensions using ${primaryFormula}.`,
          formulaHint: primaryFormula,
          expectedResult: 'Integrated table with zero formula errors.',
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'Assemble Analytical Engine & Summary Tabs',
          instruction:
            'Create dedicated tabs: 1_RawData, 2_CleanModel, 3_PivotEngine, 4_ExecutiveSummary.',
          expectedResult: 'Auditable, professional multi-tab portfolio architecture.',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'Formulate Business Insights & Recommendations',
          instruction:
            'Draft 3 actionable management takeaways citing exact revenue and margin percentages.',
          expectedResult: 'Professional analyst memo ready for executive presentation.',
        },
      ];
  }
}

/**
 * Build rich lesson workbook structure containing headers, starter data, solved data, and notes
 */
export function getLessonWorkbookOverview(lesson: Lesson): LessonWorkbookOverview {
  const steps = getExerciseStepsForLesson(lesson);
  const starterFileName = `${lesson.id}_Starter_Practice_Workbook.xlsx`;
  const solutionFileName = `${lesson.id}_Solution_Workbook.xlsx`;

  const headers = [...lesson.demoSpreadsheetHeaders];
  const lastColIdx = headers.length - 1;

  // Starter rows: keep source columns, blank out or prompt the target calculation column
  const starterRows = lesson.demoSpreadsheetRows.map((r, idx) => {
    const cellsCopy = [...r.cells];
    const isTotalRow =
      String(cellsCopy[0]).toUpperCase().includes('TOTAL') ||
      String(cellsCopy[1]).toUpperCase().includes('TOTAL') ||
      idx === lesson.demoSpreadsheetRows.length - 1;

    if (isTotalRow) {
      cellsCopy[lastColIdx] = '[Enter =SUM(...) Here]';
    } else {
      cellsCopy[lastColIdx] = '[Enter Formula Here]';
    }

    return {
      rowNum: r.rowNum,
      cells: cellsCopy,
      targetCellNote: isTotalRow ? 'Formula: =SUM(...)' : `Calculate ${headers[lastColIdx]} using ${lesson.keyFormulas[0] || 'formula'}`,
    };
  });

  // Solution rows: contain actual values and explicit formula strings
  const solutionRows = lesson.demoSpreadsheetRows.map((r) => {
    return {
      rowNum: r.rowNum,
      cells: [...r.cells],
      formula: r.formulaNote || lesson.keyFormulas[0] || '=SUM(...)',
      explanation: `Solved using: ${r.formulaNote || lesson.keyFormulas[0] || 'standard Excel formula'}`,
    };
  });

  return {
    lessonId: lesson.id,
    starterFileName,
    solutionFileName,
    challengeTitle: `${lesson.title} — Excel Hands-On Practice`,
    steps,
    expectedOutcome: lesson.resource.expectedOutcome,
    headers,
    starterRows,
    solutionRows,
  };
}

/**
 * Generate binary XLSX buffer for Starter Workbook
 */
export function generateStarterWorkbook(lesson: Lesson, levelTitle = 'Excel to Data Analyst Academy'): Uint8Array {
  const overview = getLessonWorkbookOverview(lesson);
  const wb = XLSX.utils.book_new();

  // SHEET 1: INSTRUCTIONS & CHALLENGE
  const instructionsData: (string | number)[][] = [
    ['EXCEL TO DATA ANALYST ACADEMY — PRACTICE WORKBOOK'],
    [`Level ${lesson.levelNumber}: ${levelTitle}`],
    [`Lesson: ${lesson.title}`],
    [''],
    ['========================================================================'],
    ['CHALLENGE INSTRUCTIONS FOR COMPLETE BEGINNERS'],
    ['========================================================================'],
    [''],
    ['How to use this workbook:'],
    ['1. Go to the "Practice Data" tab at the bottom of Excel.'],
    ['2. Review the table columns and follow the step-by-step checklist below.'],
    ['3. Complete the exercise by typing the required formulas into the marked cells.'],
    ['4. When finished, compare your results against the Solution Workbook.'],
    [''],
    ['EXERCISE STEPS:'],
    ...overview.steps.map((s) => [
      `Step ${s.stepNumber}: ${s.title}`,
      s.instruction,
      s.formulaHint ? `Formula to try: ${s.formulaHint}` : '',
    ]),
    [''],
    ['KEY FORMULAS COVERED IN THIS LESSON:'],
    ...lesson.keyFormulas.map((f) => ['  •', f]),
    [''],
    ['BEGINNER EXCEL SHORTCUTS & PRO TIPS:'],
    ['  • F4 (or Cmd+T on Mac): Locks cell reference ($A$1) so formulas do not shift.'],
    ['  • Alt + = (or Cmd+Shift+T on Mac): Automatically inserts AutoSum formula.'],
    ['  • Ctrl + Z: Undo any mistake instantly.'],
    ['  • Double-click the bottom-right corner of a cell to fill the formula down.'],
    [''],
    ['EXPECTED OUTCOME:'],
    [overview.expectedOutcome],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 35 }, { wch: 60 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions & Challenge');

  // SHEET 2: PRACTICE DATA
  const practiceDataAoa: (string | number)[][] = [
    overview.headers,
    ...overview.starterRows.map((r) => r.cells),
  ];

  const wsPractice = XLSX.utils.aoa_to_sheet(practiceDataAoa);
  wsPractice['!cols'] = overview.headers.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, wsPractice, 'Practice Data');

  // Generate binary
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(wbout);
}

/**
 * Generate binary XLSX buffer for Solution Workbook with live formulas
 */
export function generateSolutionWorkbook(lesson: Lesson, levelTitle = 'Excel to Data Analyst Academy'): Uint8Array {
  const overview = getLessonWorkbookOverview(lesson);
  const wb = XLSX.utils.book_new();

  // SHEET 1: INSTRUCTIONS & SOLUTION KEY
  const instructionsData: (string | number)[][] = [
    ['EXCEL TO DATA ANALYST ACADEMY — COMPLETED REFERENCE SOLUTION'],
    [`Level ${lesson.levelNumber}: ${levelTitle}`],
    [`Lesson: ${lesson.title}`],
    [''],
    ['========================================================================'],
    ['MODEL SOLUTION & EXPLANATION KEY'],
    ['========================================================================'],
    [''],
    ['Notice how the formulas in the "Solved Exercise" tab are structured:'],
    ['• Click into each calculated cell to inspect the live formula in the Excel formula bar (fx).'],
    ['• Observe how relative and absolute references are used to maintain accuracy.'],
    ['• Verify that control totals reconcile without any #VALUE! or #REF! errors.'],
    [''],
    ['EXPLANATION OF FORMULAS USED:'],
    ...lesson.keyFormulas.map((f, i) => [
      `Formula ${i + 1}: ${f}`,
      `Applies ${lesson.title.toLowerCase()} directly to the practice records.`,
    ]),
    [''],
    ['CONCEPT CHECKPOINTS:'],
    ...lesson.conceptSummary.map((pt) => ['  ✓', pt]),
    [''],
    ['EXPECTED OUTCOME:'],
    [overview.expectedOutcome],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 35 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Solution Key');

  // SHEET 2: SOLVED EXERCISE WITH LIVE FORMULAS
  // Start with headers
  const solvedAoa: (string | number)[][] = [
    overview.headers,
    ...lesson.demoSpreadsheetRows.map((r) => r.cells),
  ];

  const wsSolved = XLSX.utils.aoa_to_sheet(solvedAoa);

  // Inject actual Excel formula objects into the last column or calculated cells
  const lastColIdx = overview.headers.length - 1;
  const colLetter = String.fromCharCode(65 + lastColIdx); // e.g. 'F' or 'G'

  lesson.demoSpreadsheetRows.forEach((r, idx) => {
    const excelRow = idx + 2; // header is row 1
    const cellAddress = `${colLetter}${excelRow}`;

    if (r.formulaNote && r.formulaNote.startsWith('=')) {
      const formulaCode = cleanFormulaForSheet(r.formulaNote);
      const existingVal = r.cells[lastColIdx];
      const isNum = typeof existingVal === 'number';

      wsSolved[cellAddress] = {
        t: isNum ? 'n' : 's',
        v: existingVal,
        f: formulaCode,
      };
    }
  });

  wsSolved['!cols'] = overview.headers.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, wsSolved, 'Solved Exercise');

  // SHEET 3: FORMULA REFERENCE
  const formulaRefData: (string | number)[][] = [
    ['Function / Syntax', 'What it Does in Business Analysis', 'Common Beginner Mistake to Avoid'],
    ...lesson.keyFormulas.map((formula) => {
      let desc = 'Calculates dynamic aggregation or logical lookup across rows.';
      let mistake = 'Forgetting to lock cell references with F4 ($ signs) or mismatched range sizes.';

      if (formula.includes('SUMIFS')) {
        desc = 'Sums numbers where multiple criteria across different columns match.';
        mistake = 'Remember that sum_range comes FIRST in SUMIFS (unlike simple SUMIF).';
      } else if (formula.includes('XLOOKUP')) {
        desc = 'Looks up values to the left or right with automatic exact match and if_not_found fallback.';
        mistake = 'Ensuring the lookup_array and return_array have the exact same number of rows.';
      } else if (formula.includes('IF(')) {
        desc = 'Tests a logical condition and returns one value if TRUE and another if FALSE.';
        mistake = 'Forgetting quotes around text outputs like "Target Met". Numbers do NOT need quotes.';
      } else if (formula.includes('TRIM') || formula.includes('PROPER')) {
        desc = 'Cleans rogue leading/trailing spaces and capitalizes text into clean title case.';
        mistake = 'TRIM only removes extra spaces; it does not fix misspelled customer names.';
      } else if (formula.includes('SUM(')) {
        desc = 'Adds all numbers in the specified cell range.';
        mistake = 'Accidentally including the summary row itself in the SUM range, causing circular references.';
      }

      return [formula, desc, mistake];
    }),
  ];

  const wsRef = XLSX.utils.aoa_to_sheet(formulaRefData);
  wsRef['!cols'] = [{ wch: 30 }, { wch: 45 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsRef, 'Formula Reference');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(wbout);
}

/**
 * Triggers a browser download of the Starter Workbook (.xlsx)
 */
export function downloadStarterWorkbook(lesson: Lesson, levelTitle?: string): void {
  const bytes = generateStarterWorkbook(lesson, levelTitle);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = lesson.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  link.href = url;
  link.setAttribute('download', `${lesson.id}_Starter_${safeTitle}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a browser download of the Solution Workbook (.xlsx)
 */
export function downloadSolutionWorkbook(lesson: Lesson, levelTitle?: string): void {
  const bytes = generateSolutionWorkbook(lesson, levelTitle);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = lesson.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  link.href = url;
  link.setAttribute('download', `${lesson.id}_Solution_${safeTitle}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Admin Student Progress Roster as a formatted Excel (.xlsx) workbook
 */
export function downloadAdminRosterXlsx(students: any[], courseTitle: string): void {
  const wb = XLSX.utils.book_new();

  const data = [
    ['Excel to Data Analyst Academy — Student Progress Roster'],
    [`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | Course: ${courseTitle}`],
    [],
    ['Student ID', 'Full Name', 'Email Address', 'Account Role', 'Enroled Date', 'Lessons Completed', 'Progress %', 'Status'],
  ];

  students.forEach((s) => {
    data.push([
      s.id || s.user_id || 'STD-001',
      s.fullName || s.full_name || 'Enroled Learner',
      s.email || 'learner@excelacademy.local',
      s.role || 'student',
      s.createdAt || s.created_at || '2026-10-23',
      s.completedCount || s.completed_lessons_count || 0,
      `${s.progressPct || Math.round(((s.completedCount || 0) / 108) * 100)}%`,
      s.hasPaid ? 'Full Lifetime Access' : 'Level 1 Free Access',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
    { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Student Roster');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([new Uint8Array(wbout)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Student_Progress_Roster_${new Date().toISOString().split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Admin Capstone Project Submissions as a formatted Excel (.xlsx) workbook
 */
export function downloadAdminCapstonesXlsx(submissions: any[], courseTitle: string): void {
  const wb = XLSX.utils.book_new();

  const data = [
    ['Excel to Data Analyst Academy — Capstone Submissions & Portfolio Review'],
    [`Generated: ${new Date().toLocaleDateString()} | Lead Instructor: Okoro Tochuwku`],
    [],
    ['Submission ID', 'Project ID', 'Project Title', 'Student Email', 'Submitted Date', 'Status', 'Grade Score %', 'Review Notes'],
  ];

  submissions.forEach((sub) => {
    data.push([
      sub.id || `SUB-${Date.now().toString().slice(-6)}`,
      sub.projectId || 'proj-1-sales-performance',
      sub.projectTitle || 'Sales Performance Analysis',
      sub.studentEmail || 'student@excelacademy.local',
      sub.updatedAt || new Date().toISOString().split('T')[0],
      sub.status || 'Graded & Approved',
      `${sub.gradeScore || 95}%`,
      sub.notes || 'Model solution verified. Great dashboard design!',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 25 },
    { wch: 30 },
    { wch: 28 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Capstone Submissions');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([new Uint8Array(wbout)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Capstone_Submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Admin Quiz & Exam Gradebook as a formatted Excel (.xlsx) workbook
 */
export function downloadAdminGradebookXlsx(attempts: any[], courseTitle: string): void {
  const wb = XLSX.utils.book_new();

  const data = [
    ['Excel to Data Analyst Academy — Quiz & Exam Gradebook'],
    [`Generated: ${new Date().toLocaleDateString()} | Course: ${courseTitle}`],
    [],
    ['Attempt ID', 'Quiz / Exam ID', 'Quiz / Lesson Title', 'Student Email', 'Score %', 'Passed', 'Correct / Total', 'Attempted Date'],
  ];

  attempts.forEach((att) => {
    data.push([
      att.id || `ATT-${Date.now().toString().slice(-6)}`,
      att.quizId || 'quiz-lvl-1',
      att.lessonTitle || 'Level 1 Fundamentals Exam',
      att.studentEmail || 'student@excelacademy.local',
      `${att.scorePercent || 100}%`,
      att.passed ? 'PASSED (✓)' : 'NEEDS RETAKE',
      `${att.correctCount || 5} / ${att.totalQuestions || 5}`,
      att.attemptedAt || new Date().toLocaleDateString(),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 22 },
    { wch: 35 },
    { wch: 28 },
    { wch: 12 },
    { wch: 16 },
    { wch: 15 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Quiz Gradebook');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([new Uint8Array(wbout)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Quiz_Gradebook_${new Date().toISOString().split('T')[0]}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
