import * as XLSX from 'xlsx';
import { CapstoneProject } from '../data/capstoneProjectsData';

/**
 * Generate and trigger download of Starter Challenge .xlsx workbook for Real-Life Practice Projects
 */
export function downloadCapstoneStarterWorkbook(project: CapstoneProject): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Project Brief & Tasks
  const instructionsData: (string | number)[][] = [
    ['EXCEL TO DATA ANALYST ACADEMY — REAL-LIFE PRACTICE PROJECT'],
    ['Project #:', `Project ${project.projectNumber} of 4: ${project.title}`],
    ['Industry:', project.industry],
    ['Category:', project.category],
    ['Instructor:', 'Okoro Tochuwku (Lead Instructor)'],
    [''],
    ['BUSINESS SCENARIO:'],
    [project.businessScenario],
    [''],
    ['PROBLEM STATEMENT:'],
    [project.problemStatement],
    [''],
    ['STEP-BY-STEP PROJECT TASKS:'],
    ...project.keyObjectives.map((obj, i) => [`Task ${i + 1}:`, obj]),
    [''],
    ['RECOMMENDED EXCEL FORMULAS:'],
    ...project.requiredFormulas.map((f) => ['Formula:', f]),
    [''],
    ['HOW TO SUBMIT THIS PROJECT TO YOUR INSTRUCTOR:'],
    ['Step 1:', 'Open the "Raw_Dataset" sheet in this workbook and complete all required formulas and PivotTables.'],
    ['Step 2:', 'Fill in your findings on the "Instructor_Submission_Sheet" tab and save your Excel workbook (.xlsx).'],
    ['Step 3:', 'Return to the My Learning -> Real-Life Projects page, attach your completed workbook and executive summary, and click "Submit Project to Instructor".'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 24 }, { wch: 95 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Project_Brief_&_Tasks');

  // Sheet 2: Raw Dataset (14-16 realistic records)
  const datasetRows = project.fullDatasetRows || project.samplePreviewRows;
  const starterData: (string | number)[][] = [
    project.sampleHeaders,
    ...datasetRows.map((r) => [...r]),
  ];

  const wsData = XLSX.utils.aoa_to_sheet(starterData);
  wsData['!cols'] = project.sampleHeaders.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, wsData, 'Raw_Dataset');

  // Sheet 3 (Optional): Reference Lookup Table (e.g., Master SKU Catalog or CBN Risk Table)
  if (project.referenceTableHeaders && project.referenceTableRows) {
    const refData: (string | number)[][] = [
      project.referenceTableHeaders,
      ...project.referenceTableRows.map((r) => [...r]),
    ];
    const wsRef = XLSX.utils.aoa_to_sheet(refData);
    wsRef['!cols'] = project.referenceTableHeaders.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(wb, wsRef, 'Reference_Lookup_Table');
  }

  // Sheet 4: Instructor Submission & Deliverables Checklist
  const checklistData: (string | number)[][] = [
    ['DELIVERABLE ID', 'REQUIRED PROJECT DELIVERABLE', 'COMPLETED? (YES/NO)', 'STUDENT NOTES / SUMMARY FOR INSTRUCTOR'],
    ...project.deliverableChecklist.map((item) => [
      item.id.toUpperCase(),
      `${item.label} — ${item.details}`,
      'NO',
      '',
    ]),
    ['', '', '', ''],
    ['EXECUTIVE SUMMARY', 'Write your 3 key business findings and recommendations below:', '', ''],
    ['Finding 1:', '', '', ''],
    ['Finding 2:', '', '', ''],
    ['Finding 3:', '', '', ''],
  ];
  const wsChecklist = XLSX.utils.aoa_to_sheet(checklistData);
  wsChecklist['!cols'] = [{ wch: 20 }, { wch: 70 }, { wch: 22 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsChecklist, 'Instructor_Submission_Sheet');

  // Write and download file
  XLSX.writeFile(wb, project.starterWorkbookName);
}

/**
 * Keep solution export helper for backwards compatibility if referenced
 */
export function downloadCapstoneSolutionWorkbook(project: CapstoneProject): void {
  downloadCapstoneStarterWorkbook(project);
}
