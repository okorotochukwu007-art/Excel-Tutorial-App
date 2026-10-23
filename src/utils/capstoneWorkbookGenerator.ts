import * as XLSX from 'xlsx';
import { CapstoneProject } from '../data/capstoneProjectsData';

/**
 * Generate and trigger download of Starter Challenge .xlsx workbook for Capstone
 */
export function downloadCapstoneStarterWorkbook(project: CapstoneProject): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Project Instructions & Objectives
  const instructionsData: (string | number)[][] = [
    ['EXCEL TO DATA ANALYST ACADEMY — CAPSTONE PORTFOLIO PROJECT'],
    ['Project #:', `Project ${project.projectNumber}: ${project.title}`],
    ['Industry:', project.industry],
    ['Category:', project.category],
    ['Target Deliverable:', project.subtitle],
    [''],
    ['BUSINESS SCENARIO & CONTEXT:'],
    [project.businessScenario],
    [''],
    ['CORE DELIVERABLES & OBJECTIVES:'],
    ...project.keyObjectives.map((obj, i) => [`${i + 1}.`, obj]),
    [''],
    ['REQUIRED EXCEL FORMULAS & FUNCTIONS:'],
    ...project.requiredFormulas.map((f) => ['•', f]),
    [''],
    ['ENTERPRISE GRADING RUBRIC STANDARDS:'],
    ...project.rubric.map((dim) => [
      `[${dim.name} — ${dim.maxPoints} pts Max]`,
      dim.description,
    ]),
    [''],
    ['INSTRUCTIONS FOR COMPLETION:'],
    ['1. Go to the "Raw_Data" or "Model_Template" sheet.'],
    ['2. Build your calculations, PivotTables, and summary schedules.'],
    ['3. Verify all numbers reconcile and formatting meets enterprise presentation standards.'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 25 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions_Rubric');

  // Sheet 2: Raw / Starter Data
  const starterData: (string | number)[][] = [
    project.sampleHeaders,
    ...project.samplePreviewRows.map((r) => [...r]),
  ];

  // Add more realistic rows if needed
  const wsData = XLSX.utils.aoa_to_sheet(starterData);
  wsData['!cols'] = project.sampleHeaders.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, wsData, 'Raw_Dataset');

  // Sheet 3: Deliverable Checklist
  const checklistData: (string | number)[][] = [
    ['DELIVERABLE ID', 'CHECKLIST REQUIREMENT', 'STATUS', 'SELF ASSESSMENT NOTES'],
    ...project.deliverableChecklist.map((item) => [
      item.id,
      item.label + ' — ' + item.details,
      'PENDING',
      '',
    ]),
  ];
  const wsChecklist = XLSX.utils.aoa_to_sheet(checklistData);
  wsChecklist['!cols'] = [{ wch: 18 }, { wch: 65 }, { wch: 14 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsChecklist, 'Deliverables_Checklist');

  // Write and download file
  XLSX.writeFile(wb, project.starterWorkbookName);
}

/**
 * Generate and trigger download of Solution Reference .xlsx workbook for Capstone
 */
export function downloadCapstoneSolutionWorkbook(project: CapstoneProject): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive Findings Summary
  const memoData: (string | number)[][] = [
    ['EXCEL TO DATA ANALYST ACADEMY — MODEL SOLUTION & EXECUTIVE MEMO'],
    ['Project #:', `Project ${project.projectNumber}: ${project.title}`],
    ['Evaluation Status:', '100/100 Enterprise Benchmark Solution'],
    [''],
    ['EXECUTIVE COMMERCIAL MEMO & KEY FINDINGS:'],
    ...project.executiveTakeaways.map((takeaway, i) => [`Key Finding #${i + 1}:`, takeaway]),
    [''],
    ['MODEL FORMULA ARCHITECTURE:'],
    ...project.requiredFormulas.map((f) => ['Formula Applied:', f]),
    [''],
    ['GRADING RUBRIC BREAKDOWN (100 / 100):'],
    ...project.rubric.map((dim) => [
      dim.name,
      `Score: ${dim.maxPoints}/${dim.maxPoints} pts (Exemplary)`,
      dim.description,
    ]),
  ];

  const wsMemo = XLSX.utils.aoa_to_sheet(memoData);
  wsMemo['!cols'] = [{ wch: 25 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsMemo, 'Executive_Memo');

  // Sheet 2: Completed Model Dataset & Formulas
  const completedData: (string | number)[][] = [
    project.sampleHeaders,
    ...project.samplePreviewRows,
  ];

  const wsCompleted = XLSX.utils.aoa_to_sheet(completedData);
  wsCompleted['!cols'] = project.sampleHeaders.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, wsCompleted, 'Model_Analysis');

  // Sheet 3: Rubric Audit Sheet
  const auditData: (string | number)[][] = [
    ['DIMENSION', 'MAX POINTS', 'ACHIEVED', 'AUDIT NOTE'],
    ['1. Data Hygiene & Table Architecture', 25, 25, 'Formal tbl_* table used, strict typing, zero blanks'],
    ['2. Formula Accuracy & Scalability', 25, 25, 'Dynamic XLOOKUP/SUMIFS used, absolute referencing intact'],
    ['3. Visual Hierarchy & Dashboard Polish', 25, 25, 'KPI cards aligned, clean typography, consistent formatting'],
    ['4. Business Insights & Executive Commentary', 25, 25, 'Exact metric citations with dollar impact and percentages'],
    ['TOTAL SCORE', 100, 100, 'CERTIFIED PORTFOLIO GRADE: PASSED WITH DISTINCTION'],
  ];
  const wsAudit = XLSX.utils.aoa_to_sheet(auditData);
  wsAudit['!cols'] = [{ wch: 38 }, { wch: 14 }, { wch: 14 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsAudit, 'Enterprise_Rubric_Audit');

  XLSX.writeFile(wb, project.solutionWorkbookName);
}
