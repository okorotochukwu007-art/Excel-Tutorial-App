import { Course, CurriculumLevel, ProjectBrief } from '../types/academy';
import youtubeRecommendationsCache from './youtubeRecommendationsCache.json';
import { createTopicAlignedLessonQuiz } from './moduleQuizzesData';

function getDefaultLessonVideoId(lessonId: string): string | undefined {
  const entry = (youtubeRecommendationsCache as Record<string, any>)[lessonId];
  if (!entry || !Array.isArray(entry.recommendations)) return undefined;
  const primary =
    entry.recommendations.find((r: any) => r.status === 'approved' && r.isPrimary) ||
    entry.recommendations.find((r: any) => r.status === 'approved') ||
    entry.recommendations[0];
  return primary?.videoId || undefined;
}

export const INITIAL_COURSE: Course = {
  id: 'course-excel-data-analyst-mastery',
  slug: 'excel-to-data-analyst-academy',
  title: 'Excel to Data Analyst Academy',
  subtitle: 'Start from Zero. Learn Excel. Become a Data Analyst.',
  description:
    'Master Excel step by step through practical video lessons, hands-on exercises, real-world datasets, and projects that teach you how to turn raw data into useful business insights.',
  oneTimePrice: 45000,
  currency: 'NGN',
  status: 'published',
  lifetimeAccessEntitlement: true,
  previewLessonCount: 6,
  updatedAt: '2026-10-23',
};

export const LEVEL_6_PROJECTS: ProjectBrief[] = [
  {
    id: 'proj-1-sales-performance',
    projectNumber: 1,
    title: 'Sales Performance Analysis',
    category: 'Commercial Revenue & Regional Sales',
    businessProblem:
      'A multi-branch retail distributor has 12 months of raw invoice lines across four regions (Lagos, Abuja, Port Harcourt, Kano) and five product categories. Management cannot tell which product lines are driving net margin or why Q3 revenue dipped in two territories.',
    sampleDatasetDescription:
      'Demonstration dataset containing regional invoice records with Order_ID, Order_Date, Region, Sales_Rep, Product_Category, Units_Sold, Unit_Price, Discount_Pct, and Unit_Cost.',
    sampleHeaders: ['Order_ID', 'Order_Date', 'Region', 'Category', 'Units', 'Unit_Price', 'Revenue', 'Net_Margin'],
    sampleRows: [
      ['INV-1041', '2026-01-14', 'Lagos', 'Enterprise Hardware', 18, 125000, 2250000, 495000],
      ['INV-1042', '2026-01-19', 'Abuja', 'Cloud Subscriptions', 45, 38000, 1710000, 769500],
      ['INV-1043', '2026-02-03', 'Port Harcourt', 'Networking Gear', 12, 94000, 1128000, 225600],
      ['INV-1044', '2026-02-11', 'Kano', 'Office Peripherals', 60, 18500, 1110000, 277500],
      ['INV-1045', '2026-03-04', 'Lagos', 'Cloud Subscriptions', 80, 38000, 3040000, 1368000],
    ],
    objectives: [
      'Calculate gross revenue, discount impact, total cost, and net profit margin per invoice line.',
      'Summarize monthly and quarterly revenue trends using a PivotTable grouped by date.',
      'Rank top-performing products and identify underperforming regional product segments.',
      'Write a concise executive summary supported by variance percentages.',
    ],
    stepByStepInstructions: [
      'Convert the raw invoice range into a structured Excel Table named tbl_SalesInvoices.',
      'Add calculated columns for Gross_Revenue (=[@Units]*[@Unit_Price]), Net_Revenue, and Gross_Margin_Pct.',
      'Insert a PivotTable on a dedicated Analysis sheet showing Region vs. Category with % of Column Total.',
      'Create a monthly trend line chart and highlight the lowest-margin category using conditional formatting.',
      'Document three concrete commercial findings in the findings summary block.',
    ],
    requiredExcelSkills: [
      'Excel Tables & Structured References',
      'SUMIFS & AVERAGEIFS',
      'PivotTable Date Grouping',
      'Percentage of Total & MoM Growth Calculations',
      'Conditional Formatting Data Bars',
    ],
    expectedDeliverables: [
      'Cleaned tbl_SalesInvoices worksheet with zero formula errors.',
      'Regional and Product Category PivotTable summary tab.',
      '3-bullet management memo citing exact revenue and margin figures.',
    ],
    reviewChecklist: [
      'All currency columns are consistently formatted with thousand separators and tabular alignment.',
      'Gross margin percentage handles zero-revenue edge cases using IFERROR.',
      'PivotTable includes both absolute currency values and percentage contribution.',
      'Findings state exact time periods, regions, and percentage differences.',
    ],
    modelSolutionExplanation:
      'In the model workbook, Cloud Subscriptions generate 45% gross margin compared to 20% in Networking Gear. The Q3 dip in Port Harcourt stems from a 14% unapproved discount spike on hardware orders rather than lower unit volume.',
    sampleCsvContent: `Order_ID,Order_Date,Region,Sales_Rep,Category,Units,Unit_Price,Discount_Pct,Unit_Cost
INV-1041,2026-01-14,Lagos,A. Okafor,Enterprise Hardware,18,125000,0.00,97500
INV-1042,2026-01-19,Abuja,B. Ibrahim,Cloud Subscriptions,45,38000,0.05,19000
INV-1043,2026-02-03,Port Harcourt,C. Nwachukwu,Networking Gear,12,94000,0.10,65800
INV-1044,2026-02-11,Kano,M. Abdullahi,Office Peripherals,60,18500,0.00,13875
INV-1045,2026-03-04,Lagos,A. Okafor,Cloud Subscriptions,80,38000,0.00,20900`,
  },
  {
    id: 'proj-2-customer-purchasing',
    projectNumber: 2,
    title: 'Customer Purchasing Analysis',
    category: 'Customer Retention & Cohort Behaviour',
    businessProblem:
      'A B2B wholesale supplier wants to understand customer concentration risk, repeat purchase frequency, and average order value across customer tiers (Enterprise, SME, Walk-in).',
    sampleDatasetDescription:
      'Demonstration dataset of customer transactions with Customer_ID, Company_Name, Segment, First_Order_Date, Total_Orders, Total_Spend, and Last_Purchase_Date.',
    sampleHeaders: ['Customer_ID', 'Company_Name', 'Segment', 'Orders', 'Total_Spend', 'Avg_Order_Value', 'Status'],
    sampleRows: [
      ['CUST-201', 'Apex Logistics Ltd', 'Enterprise', 24, 14880000, 620000, 'Active'],
      ['CUST-202', 'Veritas Pharmacy', 'SME', 9, 2430000, 270000, 'Active'],
      ['CUST-203', 'Crestline Foods', 'SME', 2, 410000, 205000, 'At Risk (>180d)'],
      ['CUST-204', 'Nordic Marine Supply', 'Enterprise', 19, 11210000, 590000, 'Active'],
      ['CUST-205', 'Metro Print Studio', 'Walk-in', 1, 95000, 95000, 'Churned'],
    ],
    objectives: [
      'Merge customer profile attributes with transaction logs using XLOOKUP.',
      'Compute Average Order Value (AOV) and days since last order using DATEDIF / TODAY reference date.',
      'Segment customers into Active, At Risk, and Churned buckets using IF / IFS logic.',
      'Identify the top 20% of accounts contributing to overall revenue.',
    ],
    stepByStepInstructions: [
      'Clean inconsistent company names and trailing spaces using TRIM and PROPER.',
      'Use XLOOKUP to pull customer segment and onboarding date into the transaction summary table.',
      'Write an IFS formula to classify inactivity windows (<90 days Active, 90-180 days At Risk, >180 days Churned).',
      'Build a PivotTable comparing Customer Segment against Retention Status.',
    ],
    requiredExcelSkills: [
      'XLOOKUP with if_not_found handling',
      'IFS and nested AND/OR logic',
      'Date arithmetic',
      'COUNTIFS & SUMIFS segmentation',
      'Pareto / Top-N sorting',
    ],
    expectedDeliverables: [
      'Customer master summary table with automated retention classification.',
      'Segment concentration breakdown showing revenue share by tier.',
      'At-Risk account recovery list sorted by historical spend.',
    ],
    reviewChecklist: [
      'No #N/A errors appear when looking up new customer IDs.',
      'Inactivity days are calculated against a fixed reporting reference cell ($B$2) rather than volatile hardcoded numbers.',
      'Segment totals reconcile 100% with the raw transaction log.',
    ],
    modelSolutionExplanation:
      'The model analysis reveals that 14 Enterprise accounts generate 68% of total wholesale revenue, while 31% of SME accounts place a second order within 60 days. Prioritizing re-engagement for At-Risk SME accounts with historical spend above 1.5M offers the fastest revenue recovery.',
    sampleCsvContent: `Customer_ID,Company_Name,Segment,First_Order_Date,Total_Orders,Total_Spend,Last_Purchase_Date
CUST-201,Apex Logistics Ltd,Enterprise,2025-02-10,24,14880000,2026-10-05
CUST-202,Veritas Pharmacy,SME,2025-06-18,9,2430000,2026-09-28
CUST-203,Crestline Foods,SME,2025-08-01,2,410000,2026-03-12
CUST-204,Nordic Marine Supply,Enterprise,2025-01-22,19,11210000,2026-10-11
CUST-205,Metro Print Studio,Walk-in,2025-11-04,1,95000,2025-11-04`,
  },
  {
    id: 'proj-3-inventory-stock',
    projectNumber: 3,
    title: 'Inventory and Stock Movement Analysis',
    category: 'Supply Chain & Warehouse Operations',
    businessProblem:
      'A regional distribution warehouse suffers from simultaneous stockouts on fast-moving SKUs and excess capital tied up in slow-moving items. Operations needs an automated reorder alert model.',
    sampleDatasetDescription:
      'Demonstration SKU ledger containing SKU_Code, Item_Description, Warehouse_Zone, Opening_Stock, Units_Received, Units_Dispatched, Reorder_Level, Lead_Time_Days, and Unit_Cost.',
    sampleHeaders: ['SKU_Code', 'Description', 'Closing_Stock', 'Reorder_Level', 'Stock_Value', 'Reorder_Status'],
    sampleRows: [
      ['SKU-4010', 'Industrial UPS 3kVA', 14, 25, 2590000, 'REORDER NOW'],
      ['SKU-4011', 'Cat6 Shielded Drum 305m', 112, 40, 5040000, 'Optimal'],
      ['SKU-4012', 'Fiber Patch Cord LC-LC', 8, 30, 120000, 'REORDER NOW'],
      ['SKU-4013', 'Rack PDU 16-Way', 95, 20, 4275000, 'Overstocked'],
      ['SKU-4014', 'Managed Switch 24-Port', 29, 25, 6090000, 'Optimal'],
    ],
    objectives: [
      'Reconcile Closing Stock (=Opening_Stock + Units_Received - Units_Dispatched) across all SKUs.',
      'Calculate total inventory valuation and Days of Inventory on Hand (DOH).',
      'Flag SKUs below Reorder Level and identify dead/overstocked inventory (>120 days supply).',
    ],
    stepByStepInstructions: [
      'Validate stock movement columns to ensure no negative closing balances exist due to data entry errors.',
      'Write a logical formula to assign status labels: REORDER NOW, Optimal, or Overstocked.',
      'Use SUMIFS to compute total capital tied up in Overstocked items by Warehouse Zone.',
      'Create a filtered procurement action table showing exact reorder quantities needed.',
    ],
    requiredExcelSkills: [
      'Inventory reconciliation formulas',
      'Logical IF / AND / OR functions',
      'Conditional Formatting rules based on formula criteria',
      'SUMIFS valuation summaries',
    ],
    expectedDeliverables: [
      'Automated SKU Reorder Status schedule.',
      'Warehouse capital allocation summary table.',
      'Procurement replenishment list for immediate purchasing.',
    ],
    reviewChecklist: [
      'Closing stock formula accurately accounts for both receipts and dispatches.',
      'Conditional formatting highlights entire row or status cell with clear text labels (never color alone).',
      'Inventory value equals Closing_Stock multiplied by Unit_Cost.',
    ],
    modelSolutionExplanation:
      'The solution identifies 22% of warehouse capital sitting in slow-moving Rack PDUs while high-margin UPS units are below safety stock thresholds.',
    sampleCsvContent: `SKU_Code,Description,Warehouse_Zone,Opening_Stock,Units_Received,Units_Dispatched,Reorder_Level,Unit_Cost
SKU-4010,Industrial UPS 3kVA,Zone-A,40,20,46,25,185000
SKU-4011,Cat6 Shielded Drum 305m,Zone-B,90,80,58,40,45000
SKU-4012,Fiber Patch Cord LC-LC,Zone-C,50,0,42,30,15000
SKU-4013,Rack PDU 16-Way,Zone-A,110,15,30,20,45000
SKU-4014,Managed Switch 24-Port,Zone-B,35,30,36,25,210000`,
  },
  {
    id: 'proj-4-business-expense',
    projectNumber: 4,
    title: 'Business Expense & Budget Variance Analysis',
    category: 'Financial Planning & Cost Control',
    businessProblem:
      'An operations director needs to compare actual monthly departmental operating expenses against approved quarterly budgets and isolate cost overruns before Q4 closes.',
    sampleDatasetDescription:
      'Demonstration general ledger export with Expense_ID, Date, Department, Cost_Center, Expense_Category, Budgeted_Amount, and Actual_Spend.',
    sampleHeaders: ['Dept', 'Category', 'Budget', 'Actual_Spend', 'Variance_Amt', 'Variance_Pct', 'Flag'],
    sampleRows: [
      ['Logistics', 'Fleet Fuel & Maintenance', 4200000, 5124000, -924000, '-22.0%', 'Over Budget'],
      ['Operations', 'Cloud & Software Licenses', 1850000, 1790000, 60000, '+3.2%', 'Within Budget'],
      ['Marketing', 'Paid Digital Campaigns', 3100000, 3689000, -589000, '-19.0%', 'Over Budget'],
      ['Facilities', 'Generator Power & Diesel', 2900000, 3451000, -551000, '-19.0%', 'Over Budget'],
      ['HR & Admin', 'Staff Training & Recruitment', 1200000, 980000, 220000, '+18.3%', 'Within Budget'],
    ],
    objectives: [
      'Clean raw ledger descriptions and map each transaction to a standardized Cost Category.',
      'Calculate favorable and unfavorable budget variances in both currency and percentage terms.',
      'Build a departmental variance summary with dynamic threshold alerts (>10% overrun).',
    ],
    stepByStepInstructions: [
      'Standardize department and category names using TRIM, CLEAN, and a mapping lookup table.',
      'Compute Variance_Amount (=Budget - Actual_Spend) and Variance_Pct (=Variance_Amount / Budget).',
      'Flag any line item exceeding budget by more than 10% for executive review.',
      'Construct a clustered column and variance bar chart comparing Budget vs. Actual by department.',
    ],
    requiredExcelSkills: [
      'Budget vs. Actual variance math',
      'Absolute cell references for threshold tolerances',
      'SUMIFS multi-criteria aggregation',
      'Comparative variance charting',
    ],
    expectedDeliverables: [
      'Departmental Budget vs. Actual reconciliation sheet.',
      'Cost-overrun exception report (>10% threshold).',
      'Visual variance chart suitable for monthly finance review.',
    ],
    reviewChecklist: [
      'Unfavorable variances (overruns) are consistently signed and clearly labeled.',
      'Threshold cell ($E$2 = 10%) is referenced with absolute dollar signs so tolerance can be adjusted dynamically.',
      'Totals row uses SUBTOTAL(9, ...) so filtered views calculate accurately.',
    ],
    modelSolutionExplanation:
      'Fleet fuel and generator diesel account for 78% of the total Q3 budget overrun, driven by unit fuel price increases rather than higher consumption volume.',
    sampleCsvContent: `Expense_ID,Date,Department,Category,Budget,Actual_Spend
EXP-801,2026-09-30,Logistics,Fleet Fuel & Maintenance,4200000,5124000
EXP-802,2026-09-30,Operations,Cloud & Software Licenses,1850000,1790000
EXP-803,2026-09-30,Marketing,Paid Digital Campaigns,3100000,3689000
EXP-804,2026-09-30,Facilities,Generator Power & Diesel,2900000,3451000
EXP-805,2026-09-30,HR & Admin,Staff Training & Recruitment,1200000,980000`,
  },
  {
    id: 'proj-5-operational-performance',
    projectNumber: 5,
    title: 'Employee & Operational SLA Performance Reporting',
    category: 'Service Operations & Workforce Productivity',
    businessProblem:
      'A customer support and service fulfillment team tracks ticket resolution times, SLA compliance, and customer satisfaction scores across shifts, but lacks a unified operational scorecard.',
    sampleDatasetDescription:
      'Demonstration service desk dataset with Ticket_ID, Agent_Name, Shift, Priority, Created_Time, Resolved_Hours, Target_SLA_Hours, and CSAT_Score.',
    sampleHeaders: ['Agent_Name', 'Shift', 'Tickets_Closed', 'Avg_Resolution_Hrs', 'SLA_Compliance', 'CSAT_Avg'],
    sampleRows: [
      ['Chidinma Eze', 'Morning', 142, 3.4, '94.4%', 4.8],
      ['Tunde Bakare', 'Morning', 128, 4.1, '89.1%', 4.6],
      ['Zainab Bello', 'Afternoon', 156, 3.8, '92.3%', 4.7],
      ['Emeka Obi', 'Afternoon', 119, 6.2, '76.5%', 4.1],
      ['Sadiq Lawal', 'Night', 94, 5.5, '81.9%', 4.4],
    ],
    objectives: [
      'Evaluate ticket-level SLA compliance (=IF([@Resolved_Hours]<=[@Target_SLA_Hours], "Met", "Breached")).',
      'Aggregate agent and shift productivity using COUNTIFS and AVERAGEIFS.',
      'Identify bottlenecks by ticket priority and shift window.',
    ],
    stepByStepInstructions: [
      'Add an SLA_Met binary/text column comparing actual resolution hours against target SLA hours.',
      'Build an Agent Scorecard summary table using COUNTIFS, AVERAGEIFS, and SLA compliance ratios.',
      'Create a PivotTable cross-tabulating Ticket Priority against Shift to isolate when SLA breaches peak.',
    ],
    requiredExcelSkills: [
      'COUNTIFS & AVERAGEIFS',
      'SLA threshold logic',
      'PivotTable cross-tabulation',
      'Operational KPI card design',
    ],
    expectedDeliverables: [
      'Shift & Agent Operational Scorecard table.',
      'SLA Breach root-cause matrix by priority tier.',
      'Staffing recommendation based on ticket arrival density.',
    ],
    reviewChecklist: [
      'SLA compliance percentage is weighted by total tickets closed per shift.',
      'Average resolution time excludes cancelled/invalidated duplicate tickets.',
      'Scorecard uses tabular numerals and clear benchmark indicators.',
    ],
    modelSolutionExplanation:
      'High-priority SLA breaches cluster between 16:00 and 19:00 during the Afternoon shift handover, indicating a shift-overlap scheduling gap rather than individual agent underperformance.',
    sampleCsvContent: `Agent_Name,Shift,Tickets_Closed,Avg_Resolution_Hrs,SLA_Met_Count,CSAT_Avg
Chidinma Eze,Morning,142,3.4,134,4.8
Tunde Bakare,Morning,128,4.1,114,4.6
Zainab Bello,Afternoon,156,3.8,144,4.7
Emeka Obi,Afternoon,119,6.2,91,4.1
Sadiq Lawal,Night,94,5.5,77,4.4`,
  },
  {
    id: 'proj-6-capstone-dashboard',
    projectNumber: 6,
    title: 'Final End-to-End Data Analysis & Executive Dashboard Project',
    category: 'Capstone Portfolio Project',
    businessProblem:
      'Combine data cleaning, Power Query transformation, lookup modeling, PivotTables, and interactive slicers to transform a messy multi-sheet commercial dataset into an executive-ready Excel Dashboard.',
    sampleDatasetDescription:
      'End-to-end demonstration workbook package containing dirty orders data, product master lookup table, and regional targets.',
    sampleHeaders: ['Quarter', 'Region', 'Target_Rev', 'Actual_Rev', 'Achievement_Pct', 'YoY_Growth'],
    sampleRows: [
      ['2026-Q1', 'West Africa Hub', 45000000, 48150000, '107.0%', '+14.2%'],
      ['2026-Q2', 'West Africa Hub', 48000000, 46560000, '97.0%', '+8.5%'],
      ['2026-Q3', 'East Africa Hub', 32000000, 35840000, '112.0%', '+19.4%'],
      ['2026-Q4', 'Southern Hub', 29000000, 30160000, '104.0%', '+11.1%'],
    ],
    objectives: [
      'Import and clean raw transaction records using Excel Tables or Power Query.',
      'Connect lookup tables for Products, Customers, and Regional Targets.',
      'Build 4 headline KPI summary cards, 3 linked PivotCharts, and interactive Slicers for Region, Year, and Category.',
      'Present a structured business recommendation report based on your dashboard.',
    ],
    stepByStepInstructions: [
      'Audit the raw data tab: remove 14 duplicate rows, standardize date formats, and resolve missing region codes.',
      'Enrich transaction rows with Category and Unit Cost via XLOOKUP.',
      'Construct a dedicated Pivot_Engine worksheet feeding all dashboard visuals.',
      'Assemble the clean Dashboard canvas: remove gridlines, align chart containers to the grid, connect Slicers to all PivotTables via Report Connections, and write dynamic chart titles.',
    ],
    requiredExcelSkills: [
      'End-to-End Data Cleaning & Validation',
      'Power Query & Structured Excel Tables',
      'XLOOKUP & Dynamic Formula Summaries',
      'Multi-PivotTable Report Connections & Slicers',
      'Executive Dashboard Layout & Storytelling',
    ],
    expectedDeliverables: [
      'Complete multi-tab Excel workbook (Raw_Data, Clean_Table, Pivot_Engine, Executive_Dashboard).',
      'Interactive Slicer controls filtering all charts simultaneously.',
      'Written Executive Briefing summarizing top growth drivers and risk areas.',
    ],
    reviewChecklist: [
      'Every Slicer is connected to all relevant PivotTables via Report Connections.',
      'Gridlines and unnecessary chart clutter are hidden on the Executive_Dashboard sheet.',
      'Dynamic KPI cards update accurately when any region or quarter filter is clicked.',
      'Executive summary offers actionable, data-backed recommendations.',
    ],
    modelSolutionExplanation:
      'The capstone solution demonstrates a full analyst workflow: raw records are normalized into a 100% reconcilable table, feeding a locked Pivot Engine sheet and a distraction-free navy-and-emerald executive dashboard.',
    sampleCsvContent: `Quarter,Region,Category,Target_Rev,Actual_Rev,Gross_Profit,YoY_Growth_Pct
2026-Q1,West Africa Hub,Enterprise Solutions,45000000,48150000,19260000,0.142
2026-Q2,West Africa Hub,Cloud & Data,48000000,46560000,21417600,0.085
2026-Q3,East Africa Hub,Cloud & Data,32000000,35840000,16844800,0.194
2026-Q4,Southern Hub,Managed Services,29000000,30160000,12667200,0.111`,
  },
];

function buildLevelModules(
  levelNumber: number,
  moduleTitles: string[],
  defaultFormulas: string[],
  defaultHeaders: string[],
  defaultRows: { rowNum: number; cells: (string | number)[]; formulaNote?: string }[]
) {
  return moduleTitles.map((modTitle, idx) => {
    const modOrder = idx + 1;
    const moduleId = `lvl-${levelNumber}-mod-${modOrder}`;
    const lesson1Id = `${moduleId}-les-1`;
    const lesson2Id = `${moduleId}-les-2`;
    const isFree = levelNumber === 1 && modOrder <= 3;

    return {
      id: moduleId,
      levelNumber,
      orderIndex: modOrder,
      title: modTitle,
      summary: `Step-by-step practical training on ${modTitle.toLowerCase()} paired with a video-aligned topic quiz.`,
      lessons: [
        {
          id: lesson1Id,
          moduleId,
          levelNumber,
          orderIndex: 1,
          title: `${modTitle}: Core Concepts & Walkthrough`,
          description: `Learn the exact workflow for ${modTitle.toLowerCase()} in Microsoft Excel. Watch the tutorial and take the 3-question topic quiz to test your understanding.`,
          durationMinutes: 14 + ((levelNumber + modOrder) % 9),
          isFreePreview: isFree,
          youtubeVideoId: getDefaultLessonVideoId(lesson1Id),
          keyFormulas: defaultFormulas,
          conceptSummary: [
            `Understand why ${modTitle.toLowerCase()} matters in day-to-day business reporting.`,
            'Follow step-by-step cell selection, formula bar inspection, and formatting standards.',
            'Pass the Lesson Quiz (unlimited retakes) to verify mastery of this video topic.',
          ],
          demoSpreadsheetHeaders: defaultHeaders,
          demoSpreadsheetRows: defaultRows,
          resource: {
            id: `res-${lesson1Id}`,
            lessonId: lesson1Id,
            fileName: `L${levelNumber}_M${modOrder}_Practice_Workbook.csv`,
            fileDescription: `Optional reference dataset for ${modTitle}.`,
            fileFormat: 'XLSX Template (CSV Demo)',
            assignmentInstructions: `Watch the video tutorial for "${modTitle}" and complete the 3-question Lesson Quiz below to unlock the next lesson.`,
            expectedOutcome: `Passed topic quiz on ${modTitle.toLowerCase()} (67%+ score, unlimited retakes allowed).`,
            sampleCsvContent: [
              defaultHeaders.join(','),
              ...defaultRows.map((r) => r.cells.join(',')),
            ].join('\n'),
          },
          quiz: createTopicAlignedLessonQuiz(levelNumber, moduleId, lesson1Id, modTitle, false),
        },
        {
          id: lesson2Id,
          moduleId,
          levelNumber,
          orderIndex: 2,
          title: `${modTitle}: Hands-On Business Lab`,
          description: `Apply ${modTitle.toLowerCase()} to realistic business scenarios and test your applied knowledge with the module quiz.`,
          durationMinutes: 18 + ((levelNumber * 2 + modOrder) % 8),
          isFreePreview: levelNumber === 1 && modOrder === 1,
          youtubeVideoId: getDefaultLessonVideoId(lesson2Id),
          keyFormulas: defaultFormulas,
          conceptSummary: [
            'Translate a business request into structured rows, columns, and formulas.',
            'Test edge cases such as blank cells, zero values, or new data rows.',
            'Pass the applied module quiz (unlimited retakes) to progress through the level.',
          ],
          demoSpreadsheetHeaders: defaultHeaders,
          demoSpreadsheetRows: defaultRows,
          resource: {
            id: `res-${lesson2Id}`,
            lessonId: lesson2Id,
            fileName: `L${levelNumber}_M${modOrder}_HandsOn_Lab.csv`,
            fileDescription: `Optional reference dataset for ${modTitle} practical scenario.`,
            fileFormat: 'CSV Raw Dataset',
            assignmentInstructions: `Watch the applied tutorial for "${modTitle}" and pass the 3-question Module Quiz below (retake as many times as needed).`,
            expectedOutcome: `Completed module quiz demonstrating mastery of ${modTitle.toLowerCase()}.`,
            sampleCsvContent: [
              defaultHeaders.join(','),
              ...defaultRows.map((r) => r.cells.join(',')),
            ].join('\n'),
          },
          quiz: createTopicAlignedLessonQuiz(levelNumber, moduleId, lesson2Id, modTitle, true),
        },
      ],
    };
  });
}

export const CURRICULUM_LEVELS: CurriculumLevel[] = [
  {
    levelNumber: 1,
    title: 'Excel Foundations',
    shortDescription:
      'Start from zero and become confident navigating workbooks, formatting business tables, writing basic calculations, and organizing simple datasets.',
    goal: 'Help students who have never used Excel become comfortable with spreadsheets.',
    keySkills: [
      'Spreadsheet interface & ribbon navigation',
      'Rows, columns, cell addresses & ranges',
      'Number, currency, percentage & date formatting',
      'Basic arithmetic operators (+, -, *, /)',
      'Sorting, filtering & workbook management',
    ],
    practicalOutcome:
      'Students create a properly formatted personal budget or simple business expense spreadsheet.',
    modules: buildLevelModules(
      1,
      [
        'Introduction to Excel and the spreadsheet interface',
        'Workbooks, worksheets, rows, columns, and cells',
        'Entering and editing data',
        'Formatting cells, numbers, dates, and text',
        'Basic calculations and arithmetic operators',
        'Introduction to formulas and cell references',
        'Sorting, filtering, and organizing simple data',
        'Saving, opening, and managing workbooks',
      ],
      ['=B2+C2', '=D2-E2', '=B2*C2', '=SUM(D2:D6)'],
      ['A: Expense_Date', 'B: Category', 'C: Description', 'D: Budget_Amt', 'E: Actual_Amt', 'F: Remaining'],
      [
        { rowNum: 2, cells: ['2026-10-01', 'Office Rent', 'Q4 Workspace Lease', 450000, 450000, 0], formulaNote: '=D2-E2' },
        { rowNum: 3, cells: ['2026-10-04', 'Internet & Comms', 'Fiber Broadband', 65000, 58500, 6500], formulaNote: '=D3-E3' },
        { rowNum: 4, cells: ['2026-10-09', 'Power & Utilities', 'Inverter Maintenance', 120000, 134000, -14000], formulaNote: '=D4-E4' },
        { rowNum: 5, cells: ['2026-10-15', 'Stationery', 'Printer Paper & Toner', 35000, 29000, 6000], formulaNote: '=D5-E5' },
        { rowNum: 6, cells: ['TOTAL', 'All Categories', '4 Line Items', 670000, 671500, -1500], formulaNote: '=SUM(F2:F5)' },
      ]
    ),
  },
  {
    levelNumber: 2,
    title: 'Excel Formulas and Functions',
    shortDescription:
      'Move beyond manual math to dynamic business functions including absolute references, logical IF statements, SUMIFS, XLOOKUP, and error handling.',
    goal: 'Teach students to use formulas to solve everyday business problems.',
    keySkills: [
      'Relative, absolute ($A$1), and mixed references',
      'SUM, AVERAGE, MIN, MAX, COUNT, COUNTA',
      'COUNTIF, COUNTIFS, SUMIF, and SUMIFS',
      'IF and nested logical functions',
      'XLOOKUP, text functions, date functions & IFERROR',
    ],
    practicalOutcome:
      'Students create a sales summary that calculates totals, identifies performance levels, and retrieves information automatically.',
    modules: buildLevelModules(
      2,
      [
        'Relative, absolute, and mixed references',
        'SUM, AVERAGE, MIN, and MAX',
        'COUNT, COUNTA, COUNTIF, and COUNTIFS',
        'IF and nested logical functions',
        'SUMIF and SUMIFS',
        'XLOOKUP and lookup concepts',
        'Text functions for cleaning and combining text',
        'Date and time functions',
        'IFERROR and error handling',
        'Formula troubleshooting and practical exercises',
      ],
      [
        '=C2*$G$1',
        '=SUMIFS(E2:E100, B2:B100, "Lagos", C2:C100, "Hardware")',
        '=XLOOKUP(A2, Products!A:A, Products!C:C, "Missing SKU")',
        '=IF(E2>=500000, "Target Met", "Below Target")',
      ],
      ['A: SKU_ID', 'B: Region', 'C: Product_Name', 'D: Units', 'E: Revenue', 'F: Performance_Tier'],
      [
        { rowNum: 2, cells: ['SKU-101', 'Lagos', 'Pro Laptop 14"', 12, 5400000, 'Target Met'], formulaNote: '=IF(E2>=2000000,"Target Met","Review")' },
        { rowNum: 3, cells: ['SKU-104', 'Abuja', 'Docking Station', 25, 1625000, 'Review'], formulaNote: '=XLOOKUP(A3,Catalog!A:A,Catalog!B:B)' },
        { rowNum: 4, cells: ['SKU-109', 'Lagos', '27" IPS Monitor', 18, 3330000, 'Target Met'], formulaNote: '=D4*V_Price' },
        { rowNum: 5, cells: ['SKU-112', 'Port Harcourt', 'Wireless Headset', 40, 1800000, 'Review'], formulaNote: '=IFERROR(E5/D5, 0)' },
      ]
    ),
  },
  {
    levelNumber: 3,
    title: 'Data Cleaning and Preparation',
    shortDescription:
      'Learn how to audit, standardize, de-duplicate, and transform messy real-world datasets using text functions, Excel Tables, Data Validation, and Power Query.',
    goal: 'Teach students to transform messy raw data into a reliable dataset.',
    keySkills: [
      'Auditing missing values & inconsistent records',
      'Removing duplicates & standardizing dates/text',
      'TRIM, CLEAN, PROPER, UPPER, TEXTSPLIT',
      'Text to Columns, Flash Fill & Data Validation',
      'Excel Tables & Introduction to Power Query',
    ],
    practicalOutcome:
      'Students clean a messy customer or sales dataset and prepare it for reporting.',
    modules: buildLevelModules(
      3,
      [
        'Understanding raw business datasets',
        'Identifying missing values and inconsistencies',
        'Removing duplicates',
        'Standardizing names, dates, and text',
        'Cleaning text using Excel functions',
        'Text to Columns and Flash Fill',
        'Sorting, filtering, and validating records',
        'Excel Tables and structured references',
        'Introduction to Power Query, including import and transformation',
        'Checking data quality before analysis',
      ],
      [
        '=PROPER(TRIM(CLEAN(A2)))',
        '=DATEVALUE(B2)',
        '=tbl_Customers[@[Total_Spend]]/tbl_Customers[@[Order_Count]]',
        '=COUNTBLANK(C2:C500)',
      ],
      ['A: Raw_Customer_Entry', 'B: Cleaned_Name', 'C: Raw_Date', 'D: ISO_Date', 'E: Region_Code', 'F: QA_Status'],
      [
        { rowNum: 2, cells: ['  okafor, chinedu  ', 'Chinedu Okafor', '14/02/2026', '2026-02-14', 'LOS-01', 'Verified'], formulaNote: '=PROPER(TRIM(A2))' },
        { rowNum: 3, cells: ['ADEBAYO   FUNKE', 'Funke Adebayo', '2026.02.19', '2026-02-19', 'ABV-02', 'Verified'], formulaNote: 'Standardized via Power Query' },
        { rowNum: 4, cells: ['ibrahim musa ', 'Musa Ibrahim', '23-Feb-26', '2026-02-23', 'KAN-01', 'Verified'], formulaNote: 'Duplicate row removed' },
      ]
    ),
  },
  {
    levelNumber: 4,
    title: 'Data Analysis with Excel',
    shortDescription:
      'Investigate datasets to answer commercial questions using PivotTables, date/category grouping, PivotCharts, conditional formatting, and growth variance metrics.',
    goal: 'Teach students how to investigate datasets and answer business questions.',
    keySkills: [
      'Framing structured business questions from records',
      'Building & customizing PivotTables',
      'Grouping dates (Months, Quarters, Years) & categories',
      'PivotCharts & Conditional Formatting pattern detection',
      'Calculating YoY/MoM percentage changes & communicating insights',
    ],
    practicalOutcome:
      'Students analyse sales data and identify top-performing products, monthly trends, and areas requiring attention.',
    modules: buildLevelModules(
      4,
      [
        'Understanding rows, records, fields, and variables',
        'Asking useful business questions',
        'Summarizing data using formulas',
        'Creating and analyzing PivotTables',
        'Grouping and filtering PivotTable data',
        'Building PivotCharts',
        'Using conditional formatting to identify patterns',
        'Comparing performance across products, locations, and periods',
        'Calculating percentage changes and growth',
        'Interpreting results and communicating findings',
      ],
      [
        '=(Current_Month - Prior_Month) / Prior_Month',
        '=GETPIVOTDATA("Revenue",$A$3,"Region","Lagos")',
        '=RANK.EQ(C2,$C$2:$C$20)',
      ],
      ['A: Product_Line', 'B: Q2_Revenue', 'C: Q3_Revenue', 'D: QoQ_Change_Amt', 'E: QoQ_Growth_Pct', 'F: Revenue_Share'],
      [
        { rowNum: 2, cells: ['Cloud Subscriptions', 12400000, 15128000, 2728000, '+22.0%', '41.5%'], formulaNote: '=(C2-B2)/B2' },
        { rowNum: 3, cells: ['Enterprise Hardware', 10800000, 11340000, 540000, '+5.0%', '31.1%'], formulaNote: '=C3/$C$6' },
        { rowNum: 4, cells: ['Networking Gear', 6500000, 5590000, -910000, '-14.0%', '15.3%'], formulaNote: 'Flagged for margin review' },
        { rowNum: 5, cells: ['Managed Support', 3900000, 4407000, 507000, '+13.0%', '12.1%'], formulaNote: '=(C5-B5)/B5' },
        { rowNum: 6, cells: ['Grand Total', 33600000, 36465000, 2865000, '+8.5%', '100.0%'], formulaNote: '=SUM(C2:C5)' },
      ]
    ),
  },
  {
    levelNumber: 5,
    title: 'Dashboards and Professional Reporting',
    shortDescription:
      'Design clean, interactive Excel dashboards with executive KPI cards, connected Slicers, dynamic charts, and repeatable data refresh workflows.',
    goal: 'Teach students to communicate data insights through clear and useful reports.',
    keySkills: [
      'Principles of executive business reporting',
      'Selecting the right chart for comparison, trend, or composition',
      'Building dynamic KPI summary cards',
      'Connecting Slicers and Timelines across multiple PivotTables',
      'Dashboard grid alignment, usability & one-click data refresh',
    ],
    practicalOutcome:
      'Students build an interactive sales dashboard with KPIs, charts, and filters.',
    modules: buildLevelModules(
      5,
      [
        'Principles of effective business reporting',
        'Choosing appropriate charts',
        'Creating KPI summaries',
        'Designing a professional Excel dashboard',
        'Adding PivotCharts and slicers',
        'Creating interactive filters',
        'Formatting charts and dashboard layouts',
        'Improving dashboard usability',
        'Refreshing reports when data changes',
        'Presenting insights and recommendations',
      ],
      [
        '="Executive Sales Overview — " & Pivot_Engine!B1',
        '=IF(Variance_Pct>=0, "▲ +" & TEXT(Variance_Pct,"0.0%"), "▼ " & TEXT(Variance_Pct,"0.0%"))',
      ],
      ['A: KPI_Metric', 'B: Actual_YTD', 'C: Target_YTD', 'D: Achievement', 'E: Prior_Year_YTD', 'F: YoY_Trend'],
      [
        { rowNum: 2, cells: ['Net Revenue', '₦142,850,000', '₦135,000,000', '105.8%', '₦124,200,000', '+15.0%'], formulaNote: 'Connected to Region Slicer' },
        { rowNum: 3, cells: ['Gross Margin', '₦54,283,000', '₦51,300,000', '105.8%', '₦45,954,000', '+18.1%'], formulaNote: '38.0% Margin Rate' },
        { rowNum: 4, cells: ['Active Accounts', '318', '300', '106.0%', '274', '+16.1%'], formulaNote: '=COUNTA(Unique_Customers)' },
      ]
    ),
  },
  {
    levelNumber: 6,
    title: 'Real-World Data Analysis Projects',
    shortDescription:
      'Synthesize everything you have learned by completing six realistic business analysis projects and building a verifiable portfolio of Excel workbooks.',
    goal: 'Help students combine their skills to complete realistic projects.',
    keySkills: [
      'Sales performance & margin variance investigation',
      'Customer retention & purchasing cohort analysis',
      'Inventory reconciliation & reorder modeling',
      'Departmental budget vs. actual expense control',
      'Operational SLA scorecards & end-to-end capstone dashboarding',
    ],
    practicalOutcome:
      'Students complete a portfolio of Excel analysis projects demonstrating their ability to prepare data, analyse findings, and present reports.',
    projects: LEVEL_6_PROJECTS,
    modules: buildLevelModules(
      6,
      [
        'Project 1: Sales performance analysis',
        'Project 2: Customer purchasing analysis',
        'Project 3: Inventory and stock movement analysis',
        'Project 4: Business expense analysis',
        'Project 5: Employee or operational performance reporting',
        'Project 6: Final end-to-end data analysis project',
      ],
      [
        '=SUMIFS(tbl_Sales[Net_Revenue], tbl_Sales[Region], $B$4)',
        '=XLOOKUP([@Customer_ID], tbl_Customers[Customer_ID], tbl_Customers[Segment])',
        '=IF([@Closing_Stock]<=[@Reorder_Level], "REORDER NOW", "Optimal")',
      ],
      ['A: Project_Deliverable', 'B: Dataset_Domain', 'C: Core_Technique', 'D: Audit_Check', 'E: Status'],
      [
        { rowNum: 2, cells: ['Sales Margin Model', 'Commercial Retail', 'PivotTables + SUMIFS', '100% Reconciled', 'Portfolio Ready'] },
        { rowNum: 3, cells: ['Customer Retention Cohort', 'B2B Wholesale', 'XLOOKUP + IFS', 'Zero #N/A Errors', 'Portfolio Ready'] },
        { rowNum: 4, cells: ['Warehouse Stock Alert', 'Supply Chain', 'Logical IF + Conditional Rules', 'Verified', 'Portfolio Ready'] },
        { rowNum: 5, cells: ['Executive Sales Dashboard', 'Multi-Region Capstone', 'Power Query + Slicers', 'Interactive', 'Portfolio Ready'] },
      ]
    ),
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Do I need prior Excel experience?',
    answer:
      'No. Level 1 (Excel Foundations) starts from the absolute basics—opening a workbook, understanding rows, columns, and cell addresses, entering data accurately, and writing your very first formula. Each level builds progressively on the previous one.',
  },
  {
    question: 'Do I need Microsoft Excel installed?',
    answer:
      'We recommend having Microsoft Excel (Desktop version for Windows or Mac, or Microsoft 365) so you can practice keyboard shortcuts, PivotTables, Slicers, and Power Query comfortably. Most foundational and formula lessons in Levels 1–4 can also be practiced in Excel for the Web (free with a Microsoft account).',
  },
  {
    question: 'How do the video lessons work?',
    answer:
      'Every module contains structured, step-by-step video lessons paired with formula notes, a downloadable practice dataset, an exercise checklist, and a skill-check quiz. You can pause, rewind, and work alongside the instructor at your own pace.',
  },
  {
    question: 'Can I download practice files?',
    answer:
      'Yes. Lessons include downloadable datasets and workbook templates so you can practice every formula, data-cleaning step, PivotTable, and dashboard layout directly on your computer.',
  },
  {
    question: 'Is the payment a one-time payment?',
    answer:
      'Yes. The academy uses a transparent one-time tuition payment model—there are no recurring monthly or annual subscription fees.',
  },
  {
    question: 'How long can I access the course?',
    answer:
      'Your one-time enrolment grants lifetime access to all six learning levels, downloadable datasets, quizzes, and future curriculum updates.',
  },
  {
    question: 'Will I build practical projects?',
    answer:
      'Yes. In addition to hands-on labs throughout Levels 1–5, Level 6 is dedicated entirely to six real-world business data analysis projects—covering sales performance, customer retention, inventory control, expense variance, operational SLAs, and an end-to-end interactive dashboard.',
  },
];

export const LEARNING_OUTCOMES = [
  {
    index: '01',
    title: 'Use Excel Confidently from the Basics',
    description:
      'Navigate workbooks, worksheets, cell references, number formats, sorting, and filtering without guesswork or spreadsheet anxiety.',
    formulaExample: '=SUM(D2:D45)',
  },
  {
    index: '02',
    title: 'Apply Formulas and Functions to Solve Problems',
    description:
      'Write reliable business formulas using absolute references ($A$1), IF/IFS, SUMIFS, COUNTIFS, XLOOKUP, date math, and IFERROR.',
    formulaExample: '=XLOOKUP(A2, SKUs!A:A, SKUs!C:C, "Not Found")',
  },
  {
    index: '03',
    title: 'Clean and Prepare Messy Datasets',
    description:
      'Audit raw exports, remove duplicates, standardize inconsistent text and dates, build structured Excel Tables, and automate cleanup with Power Query.',
    formulaExample: '=PROPER(TRIM(CLEAN(B2)))',
  },
  {
    index: '04',
    title: 'Analyse Data Using PivotTables and Charts',
    description:
      'Group transactions by month, quarter, region, and product category to uncover margins, growth rates, and operational bottlenecks.',
    formulaExample: '=(Q3_Rev - Q2_Rev) / Q2_Rev',
  },
  {
    index: '05',
    title: 'Create Professional Dashboards and Reports',
    description:
      'Design clean executive dashboards with headline KPI cards, PivotCharts, and multi-table Slicers that update with a single click.',
    formulaExample: 'Report Connections -> Region & Quarter Slicers',
  },
  {
    index: '06',
    title: 'Complete Practical Business Data Analysis Projects',
    description:
      'Assemble a portfolio of six realistic commercial analysis workbooks—from sales and customer cohorts to inventory and budget variance.',
    formulaExample: '6 End-to-End Business Case Studies',
  },
];

export const DATABASE_SCHEMA_BLUEPRINT = [
  {
    table: 'profiles',
    pk: 'id (uuid, references auth.users)',
    columns: 'full_name, email, role (student | admin), created_at, updated_at',
    rlsPolicy: 'Users can SELECT/UPDATE only their own profile (auth.uid() = id); admins verified via server/database role policy.',
  },
  {
    table: 'courses',
    pk: 'id (uuid)',
    columns: 'slug, title, description, one_time_price, currency, is_published, lifetime_access, updated_at',
    rlsPolicy: 'Public SELECT for published courses; INSERT/UPDATE/DELETE restricted to verified admin role.',
  },
  {
    table: 'modules',
    pk: 'id (uuid)',
    columns: 'course_id (fk), level_number (1..6), order_index, title, summary, created_at',
    rlsPolicy: 'Public SELECT for published course curriculum structure; admin write-only.',
  },
  {
    table: 'lessons',
    pk: 'id (uuid)',
    columns: 'module_id (fk), order_index, title, description, duration_minutes, is_free_preview, youtube_video_id',
    rlsPolicy: 'Public metadata SELECT; protected youtube_video_id released only via server-side entitlement check or if is_free_preview = true.',
  },
  {
    table: 'lesson_resources',
    pk: 'id (uuid)',
    columns: 'lesson_id (fk), file_name, file_description, storage_path, assignment_instructions, expected_outcome',
    rlsPolicy: 'SELECT requires verified purchase entitlement in purchases table or free preview lesson.',
  },
  {
    table: 'purchases',
    pk: 'id (uuid)',
    columns: 'user_id (fk), course_id (fk), paystack_reference (unique), amount_kobo, currency, status, verified_at',
    rlsPolicy: 'Students can SELECT only own purchases (auth.uid() = user_id). INSERT/UPDATE restricted strictly to service-role webhook/verification server endpoint.',
  },
  {
    table: 'lesson_progress',
    pk: 'id (uuid)',
    columns: 'user_id (fk), lesson_id (fk), completed (boolean), last_viewed_at, completed_at',
    rlsPolicy: 'Students can SELECT/INSERT/UPDATE only their own rows (auth.uid() = user_id).',
  },
  {
    table: 'quizzes & quiz_questions',
    pk: 'id (uuid)',
    columns: 'lesson_id (fk), title, passing_score_pct | quiz_id (fk), question_text, options_json, correct_index, explanation',
    rlsPolicy: 'Enrolled students SELECT; admin write-only.',
  },
  {
    table: 'quiz_attempts',
    pk: 'id (uuid)',
    columns: 'user_id (fk), quiz_id (fk), score_pct, passed, answers_json, attempted_at',
    rlsPolicy: 'Students can SELECT/INSERT only their own attempts (auth.uid() = user_id).',
  },
  {
    table: 'assignments & project_submissions',
    pk: 'id (uuid)',
    columns: 'user_id (fk), project_id, checklist_json, submission_notes, status, submitted_at',
    rlsPolicy: 'Students can SELECT/INSERT/UPDATE only their own submissions (auth.uid() = user_id); admins can review all.',
  },
  {
    table: 'lesson_video_recommendations',
    pk: 'id (text, unique lesson_id + video_id)',
    columns: 'lesson_id (fk), video_id, title, channel_title, duration_formatted, suitability_label, evidence (jsonb), status (candidate | approved | rejected), is_primary',
    rlsPolicy: 'Students SELECT only status = approved rows; INSERT/UPDATE/DELETE restricted strictly to verified admin role (public.is_admin()).',
  },
];

