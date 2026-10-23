export interface CapstoneRubricDimension {
  id: string;
  name: string;
  maxPoints: number;
  description: string;
  criteria: {
    points: number;
    level: 'Exemplary' | 'Proficient' | 'Developing' | 'Needs Improvement';
    description: string;
  }[];
}

export interface CapstoneProject {
  id: string;
  slug: string;
  projectNumber: number;
  title: string;
  subtitle: string;
  category: string;
  industry: string;
  difficulty: 'Comprehensive' | 'Enterprise' | 'Executive';
  estimatedHours: number;
  heroBadge: string;
  businessScenario: string;
  problemStatement: string;
  keyObjectives: string[];
  deliverableChecklist: {
    id: string;
    label: string;
    details: string;
  }[];
  requiredFormulas: string[];
  executiveTakeaways: string[];
  sampleHeaders: string[];
  samplePreviewRows: (string | number)[][];
  rubric: CapstoneRubricDimension[];
  starterWorkbookName: string;
  solutionWorkbookName: string;
}

export const CAPSTONE_RUBRIC_DIMENSIONS: CapstoneRubricDimension[] = [
  {
    id: 'data-hygiene',
    name: 'Data Hygiene & Table Architecture',
    maxPoints: 25,
    description: 'Structure of raw data tables, column data typing, removal of blanks, and naming conventions.',
    criteria: [
      {
        points: 25,
        level: 'Exemplary',
        description: 'Formatted as official Excel Table (tbl_*), clean headers, strict data typing, zero blank rows or merged cells.',
      },
      {
        points: 20,
        level: 'Proficient',
        description: 'Structured tables used, numbers formatted consistently, minimal formatting blemishes.',
      },
      {
        points: 15,
        level: 'Developing',
        description: 'Basic grid without official Excel Table formatting, some inconsistent number formats.',
      },
      {
        points: 8,
        level: 'Needs Improvement',
        description: 'Messy data with merged cells, unaligned columns, or unformatted decimal values.',
      },
    ],
  },
  {
    id: 'formula-accuracy',
    name: 'Formula Accuracy & Scalability',
    maxPoints: 25,
    description: 'Correct mathematical logic, absolute referencing ($), dynamic lookup ranges, and error handling.',
    criteria: [
      {
        points: 25,
        level: 'Exemplary',
        description: 'Advanced dynamic formulas (XLOOKUP, SUMIFS, IFERROR) with precise absolute reference locking; zero hardcoded values.',
      },
      {
        points: 20,
        level: 'Proficient',
        description: 'Formulas calculate correctly across all rows; minor opportunities for dynamic optimization.',
      },
      {
        points: 15,
        level: 'Developing',
        description: 'Some static numbers mixed inside formulas; missing IFERROR on lookup edges.',
      },
      {
        points: 8,
        level: 'Needs Improvement',
        description: '#N/A, #VALUE!, or #REF! formula errors present in submitted workbook.',
      },
    ],
  },
  {
    id: 'visual-hierarchy',
    name: 'Visual Hierarchy & Dashboard Polish',
    maxPoints: 25,
    description: 'Executive readability, clean typography, number formatting, and disciplined color harmony.',
    criteria: [
      {
        points: 25,
        level: 'Exemplary',
        description: 'Publication-quality layout: clear KPI scorecards, subtle borders, currency/percentage symbols, restrained color palette.',
      },
      {
        points: 20,
        level: 'Proficient',
        description: 'Clean visual presentation with good readability; charts have clear axes and titles.',
      },
      {
        points: 15,
        level: 'Developing',
        description: 'Functional layout but somewhat cluttered; default chart styling without custom titles.',
      },
      {
        points: 8,
        level: 'Needs Improvement',
        description: 'Garish or distracting colors, unformatted large numbers, poorly scaled charts.',
      },
    ],
  },
  {
    id: 'executive-insights',
    name: 'Business Insights & Executive Commentary',
    maxPoints: 25,
    description: 'Commercial understanding, root-cause interpretation, variance citations, and strategic recommendations.',
    criteria: [
      {
        points: 25,
        level: 'Exemplary',
        description: 'Persuasive executive memo citing exact dollar values and % variances, with actionable business recommendations.',
      },
      {
        points: 20,
        level: 'Proficient',
        description: 'Good summary of trends with supporting figures; general recommendations provided.',
      },
      {
        points: 15,
        level: 'Developing',
        description: 'Basic descriptive statements without deep analysis of underlying business drivers.',
      },
      {
        points: 8,
        level: 'Needs Improvement',
        description: 'Missing commentary or vague observations with no quantitative support.',
      },
    ],
  },
];

export const CAPSTONE_PROJECTS: CapstoneProject[] = [
  {
    id: 'capstone-1-ecommerce-dashboard',
    slug: 'ecommerce-revenue-margin-dashboard',
    projectNumber: 1,
    title: 'Executive E-Commerce Revenue & Margin Dashboard',
    subtitle: 'Multi-Channel Sales, Margin Erosion Analysis & Regional KPI Scorecards',
    category: 'Commercial Strategy & Revenue Operations',
    industry: 'Omnichannel Retail & E-Commerce',
    difficulty: 'Enterprise',
    estimatedHours: 4,
    heroBadge: 'Flagship Capstone 1',
    businessScenario:
      'NovaRetail Global generated $8.45M in annual turnover across Shopify, Amazon FBA, and Direct Wholesale. The executive committee cannot determine which channels generate healthy net margins or how steep promotional discounts are eroding operating cash flow across 4 core sales regions.',
    problemStatement:
      'Raw invoice transactions contain unstandardized discount structures, disparate shipping costs, and unlinked product cost tables. You must construct an automated executive dashboard to present high-level KPIs, territory performance, and category margin analysis.',
    keyObjectives: [
      'Clean raw transaction logs and merge with Master Product Catalog using XLOOKUP.',
      'Calculate Gross Sales, Discount Erosion, Net Revenue, COGS, and Gross Margin % per order.',
      'Construct executive KPI tiles (Revenue, Gross Profit, Blended Margin %, AOV, Order Count).',
      'Build dynamic PivotTables with Month and Region slicers for interactive executive filtering.',
      'Draft a 4-bullet commercial memo detailing the #1 product line driving margin vs. the territory with highest discount leakage.',
    ],
    deliverableChecklist: [
      {
        id: 'c1-d1',
        label: 'Structured Excel Table (tbl_SalesOrders)',
        details: 'All transaction lines converted to tbl_SalesOrders with standardized headers, currency formatting, and zero blank rows.',
      },
      {
        id: 'c1-d2',
        label: 'Dynamic Cost & Category XLOOKUPs',
        details: 'Cost_Price and Product_Category populated via XLOOKUP from Master SKU sheet with if_not_found protection.',
      },
      {
        id: 'c1-d3',
        label: 'Net Margin Calculations with IFERROR',
        details: 'Gross Revenue, Discount Amount, Net Revenue, Total Cost, and Margin % calculated without formula errors.',
      },
      {
        id: 'c1-d4',
        label: 'Executive KPI Summary Cards',
        details: 'Callout cards for Total Revenue, Total Gross Profit, Blended Margin %, and Average Order Value (AOV).',
      },
      {
        id: 'c1-d5',
        label: 'PivotTable Category Breakdown & Slicers',
        details: 'Channel vs. Category cross-tabulation with % of Total and interactive Region/Quarter slicers.',
      },
      {
        id: 'c1-d6',
        label: 'Commercial Findings Executive Memo',
        details: 'Written 3-4 bullet executive memo citing exact revenue numbers, margin percentages, and recommendations.',
      },
    ],
    requiredFormulas: [
      '=XLOOKUP([@SKU], tbl_Catalog[SKU], tbl_Catalog[UnitCost], "Missing")',
      '=[@UnitsSold] * [@UnitPrice]',
      '=[@GrossRevenue] * [@DiscountPct]',
      '=[@NetRevenue] - [@TotalCost]',
      '=IFERROR([@GrossProfit] / [@NetRevenue], 0)',
      '=SUMIFS(tbl_SalesOrders[NetRevenue], tbl_SalesOrders[Region], "Lagos")',
    ],
    executiveTakeaways: [
      'Direct Wholesale drives 52% of total volume but yields only 18% gross margin due to aggressive tier discounting.',
      'Shopify channel produces highest blended margin (46.4%), with Technology Accessories leading profitability.',
      'Port Harcourt regional territory experienced a 12.8% margin erosion due to unapproved freight cost absorptions.',
    ],
    sampleHeaders: ['Order_ID', 'Date', 'Channel', 'Region', 'Category', 'Units', 'Unit_Price', 'Discount', 'Net_Revenue', 'Margin_%'],
    samplePreviewRows: [
      ['ORD-8801', '2026-01-08', 'Shopify', 'Lagos', 'Technology', 4, 185000, '0.05', 703000, '42.8%'],
      ['ORD-8802', '2026-01-12', 'Amazon FBA', 'Abuja', 'Furniture', 2, 95000, '0.00', 190000, '28.5%'],
      ['ORD-8803', '2026-01-15', 'Wholesale', 'Kano', 'Office Supplies', 45, 14000, '0.15', 535500, '22.0%'],
      ['ORD-8804', '2026-01-22', 'Shopify', 'Port Harcourt', 'Technology', 8, 85000, '0.10', 612000, '38.2%'],
      ['ORD-8805', '2026-02-04', 'Amazon FBA', 'Lagos', 'Audio', 12, 42000, '0.00', 504000, '48.1%'],
    ],
    rubric: CAPSTONE_RUBRIC_DIMENSIONS,
    starterWorkbookName: 'Capstone_01_Ecommerce_Dashboard_Starter.xlsx',
    solutionWorkbookName: 'Capstone_01_Ecommerce_Dashboard_Solution.xlsx',
  },
  {
    id: 'capstone-2-pl-budget-variance',
    slug: 'corporate-pl-budget-variance-model',
    projectNumber: 2,
    title: 'Corporate P&L Budget Variance & EBITDA Forecasting Model',
    subtitle: 'Quarterly Financial Statement Modeling, Variance Threshold Alerts & Scenario Sensitivity',
    category: 'Corporate Finance & FP&A',
    industry: 'Enterprise Software & SaaS',
    difficulty: 'Executive',
    estimatedHours: 5,
    heroBadge: 'Flagship Capstone 2',
    businessScenario:
      'CloudScale Tech is closing Q4 and preparing its financial presentation for venture lenders and board members. The CFO needs an institutional-grade Profit and Loss (P&L) schedule comparing Budgeted vs. Actual performance across Revenue, COGS, OpEx (R&D, S&M, G&A), and EBITDA with dynamic variance flags.',
    problemStatement:
      'Monthly accounting line items are scattered across cost center trial balances. There is no consolidated schedule that isolates favorable vs. unfavorable variances or tests how a 5% slowdown in ARR renewals would impact EBITDA breakeven.',
    keyObjectives: [
      'Build a standard GAAP/IFRS multi-step P&L statement schedule spanning Q1 through Q4.',
      'Calculate Variance ($) (=Actual - Budget) and Variance (%) with proper accounting sign conventions.',
      'Implement conditional formatting indicators for favorable (green) vs. unfavorable (amber/red) variances.',
      'Compute gross profit, operating expense sub-totals, and EBITDA with operating margin percentages.',
      'Construct a 3-scenario sensitivity toggle (Base, Upside, Downside) using data validation and CHOOSE/INDEX.',
    ],
    deliverableChecklist: [
      {
        id: 'c2-d1',
        label: 'Consolidated P&L Statement Schedule',
        details: 'Proper financial hierarchy: Revenue -> Gross Margin -> OpEx (R&D, S&M, G&A) -> EBITDA.',
      },
      {
        id: 'c2-d2',
        label: 'Variance $ and % Formulas',
        details: 'Variance calculated with correct sign conventions (e.g. higher expenses are unfavorable).',
      },
      {
        id: 'c2-d3',
        label: 'Conditional Threshold Alerts',
        details: 'Automated formatting flags variances greater than ±10% or $50,000 threshold.',
      },
      {
        id: 'c2-d4',
        label: 'Operating Margin & EBITDA Metrics',
        details: 'Gross margin %, EBITDA margin %, and Operating Expense % of Revenue formulas.',
      },
      {
        id: 'c2-d5',
        label: 'Scenario Sensitivity Switch',
        details: 'Interactive dropdown for Base / Conservative / Aggressive forecasting.',
      },
      {
        id: 'c2-d6',
        label: 'CFO Board Variance Memo',
        details: 'Comprehensive 4-point memo explaining key drivers of EBITDA variance.',
      },
    ],
    requiredFormulas: [
      '=Actual_Revenue - Budget_Revenue',
      '=IFERROR((Actual - Budget) / Budget, 0)',
      '=Budget_Expense - Actual_Expense',
      '=GrossProfit - Total_OpEx',
      '=CHOOSE(ScenarioIndex, Base_Value, Conservative_Value, Aggressive_Value)',
    ],
    executiveTakeaways: [
      'Full-year Net Revenue surpassed budget by $340,000 (+4.8%) driven by enterprise expansion contracts.',
      'Sales & Marketing exceeded budget by 14.2% due to unbudgeted Q2 conference sponsorships.',
      'EBITDA closed at $1.28M (18.1% margin) vs. budgeted $1.15M (16.9% margin), delivering a net positive variance.',
    ],
    sampleHeaders: ['P&L_Line_Item', 'FY_Budget', 'FY_Actual', 'Variance_$', 'Variance_%', 'Status_Alert', 'Cost_Center'],
    samplePreviewRows: [
      ['Subscription ARR Revenue', 5800000, 6120000, 320000, '+5.5%', 'Favorable', 'Revenue'],
      ['Professional Services', 1200000, 1220000, 20000, '+1.7%', 'On Track', 'Revenue'],
      ['Cost of Goods Sold (Hosting & Support)', 1400000, 1490000, -90000, '-6.4%', 'Review', 'COGS'],
      ['Research & Development (R&D)', 2100000, 2050000, 50000, '+2.4%', 'Favorable', 'OpEx'],
      ['Sales & Marketing (S&M)', 1650000, 1885000, -235000, '-14.2%', 'Critical Alert', 'OpEx'],
      ['General & Administrative (G&A)', 700000, 695000, 5000, '+0.7%', 'On Track', 'OpEx'],
      ['Operating EBITDA', 1150000, 1280000, 130000, '+11.3%', 'Favorable', 'Bottom Line'],
    ],
    rubric: CAPSTONE_RUBRIC_DIMENSIONS,
    starterWorkbookName: 'Capstone_02_PL_Budget_Variance_Starter.xlsx',
    solutionWorkbookName: 'Capstone_02_PL_Budget_Variance_Solution.xlsx',
  },
  {
    id: 'capstone-3-churn-cohort-matrix',
    slug: 'customer-churn-cohort-matrix-retention',
    projectNumber: 3,
    title: 'Customer Churn Cohort Matrix & Retention Heatmap',
    subtitle: '12-Month SaaS User Retention Triangle, Churn Dynamics & Net Revenue Retention (NRR)',
    category: 'Product Analytics & Subscription Growth',
    industry: 'B2B SaaS & Digital Subscriptions',
    difficulty: 'Comprehensive',
    estimatedHours: 4.5,
    heroBadge: 'Flagship Capstone 3',
    businessScenario:
      'PulseAnalytics is a subscription analytics platform with 3,500 active customer accounts. Leadership has noticed a decline in Net Revenue Retention (NRR) and wants a monthly cohort retention matrix (Month 0 through Month 11) to isolate whether churn is happening during initial onboarding (M1) or at annual renewal (M12).',
    problemStatement:
      'Customer subscription start and cancel dates are stored in raw logs. The company lacks a cohort retention heatmap showing the percentage of customers retained over each relative calendar month.',
    keyObjectives: [
      'Extract cohort signup month and calculate relative age in months (=DATEDIF or Year/Month math).',
      'Build a classic cohort retention matrix with Month 0 (100%) through Month 11.',
      'Apply conditional formatting gradient heatmap to immediately highlight steep drop-off cliffs.',
      'Calculate cumulative churn rate and average customer lifetime (1 / Churn Rate).',
      'Model Net Revenue Retention (NRR) by incorporating upgrade expansion revenue against churned ARR.',
    ],
    deliverableChecklist: [
      {
        id: 'c3-d1',
        label: 'Subscription Ledger Normalization',
        details: 'Raw customer accounts tagged with Cohort Month, Tenure in Months, and Status (Active/Churned).',
      },
      {
        id: 'c3-d2',
        label: 'Cohort Triangle Matrix Table',
        details: 'Grid displaying 12 monthly cohorts (Jan–Dec) across relative months M0 to M11.',
      },
      {
        id: 'c3-d3',
        label: 'Percentage Retention Calculations',
        details: 'Each cell calculates active customers divided by Month 0 initial cohort size.',
      },
      {
        id: 'c3-d4',
        label: 'Conditional Formatting Heatmap',
        details: '3-color scale (Green for high retention 80-100%, Yellow 60-80%, Red <60%).',
      },
      {
        id: 'c3-d5',
        label: 'Net Revenue Retention (NRR) Schedule',
        details: 'Calculates expansion MRR from retained customers vs. lost MRR from churned customers.',
      },
      {
        id: 'c3-d6',
        label: 'VP Product Growth Strategy Memo',
        details: '3-bullet diagnosis explaining where customer drop-off accelerates and onboarding remedies.',
      },
    ],
    requiredFormulas: [
      '=COUNTIFS(tbl_Users[Cohort], $A2, tbl_Users[ActiveMonth], B$1)',
      '=B2 / $B2',
      '=IFERROR(Current_Active / Month0_Cohort, 0)',
      '=AVERAGE(C2:C13)',
      '=1 / Monthly_Churn_Rate',
    ],
    executiveTakeaways: [
      'Steepest drop-off occurs between Month 0 and Month 1 (average 18.5% churn), pointing to onboarding friction.',
      'Cohorts acquired via Organic Search display 74% M6 retention vs. only 48% for Paid Ad cohorts.',
      'Net Revenue Retention among Enterprise tiers stands at 114% due to seat expansion, subsidizing SME churn.',
    ],
    sampleHeaders: ['Cohort_Month', 'Cohort_Size', 'M0', 'M1', 'M2', 'M3', 'M6', 'M12_Retention'],
    samplePreviewRows: [
      ['Jan 2025', 280, '100.0%', '82.5%', '78.2%', '74.6%', '68.2%', '61.4%'],
      ['Feb 2025', 310, '100.0%', '81.0%', '76.8%', '72.1%', '65.5%', '59.0%'],
      ['Mar 2025', 345, '100.0%', '83.2%', '79.1%', '75.4%', '69.0%', '63.2%'],
      ['Apr 2025', 290, '100.0%', '79.3%', '73.8%', '70.0%', '64.1%', '58.6%'],
      ['May 2025', 320, '100.0%', '84.4%', '80.0%', '76.3%', '70.3%', '64.1%'],
    ],
    rubric: CAPSTONE_RUBRIC_DIMENSIONS,
    starterWorkbookName: 'Capstone_03_Customer_Churn_Cohort_Starter.xlsx',
    solutionWorkbookName: 'Capstone_03_Customer_Churn_Cohort_Solution.xlsx',
  },
];
