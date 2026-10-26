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
  fullDatasetRows?: (string | number)[][];
  referenceTableHeaders?: string[];
  referenceTableRows?: (string | number)[][];
  rubric: CapstoneRubricDimension[];
  starterWorkbookName: string;
  solutionWorkbookName: string;
}

export const CAPSTONE_RUBRIC_DIMENSIONS: CapstoneRubricDimension[] = [
  {
    id: 'data-hygiene',
    name: 'Data Cleaning & Excel Table Structure',
    maxPoints: 25,
    description: 'Proper Excel Table formatting (Ctrl+T), clean data types, and zero blank or broken rows.',
    criteria: [
      {
        points: 25,
        level: 'Exemplary',
        description: 'Formatted as an official Excel Table with clean headers and consistent number formatting.',
      },
      {
        points: 20,
        level: 'Proficient',
        description: 'Structured tables used with consistent formatting.',
      },
      {
        points: 15,
        level: 'Developing',
        description: 'Basic range without official Excel Table formatting.',
      },
      {
        points: 8,
        level: 'Needs Improvement',
        description: 'Unformatted numbers or messy layout.',
      },
    ],
  },
  {
    id: 'formula-accuracy',
    name: 'Formula Accuracy & Dynamic Lookups',
    maxPoints: 25,
    description: 'Accurate use of XLOOKUP, SUMIFS, COUNTIFS, IF, and IFERROR with proper cell locking ($).',
    criteria: [
      {
        points: 25,
        level: 'Exemplary',
        description: 'Dynamic formulas across all rows with zero hardcoded outputs or #N/A errors.',
      },
      {
        points: 20,
        level: 'Proficient',
        description: 'Formulas calculate accurately across the workbook.',
      },
      {
        points: 15,
        level: 'Developing',
        description: 'Some static numbers mixed inside formulas.',
      },
      {
        points: 8,
        level: 'Needs Improvement',
        description: 'Formula errors (#N/A, #VALUE!, #REF!) present.',
      },
    ],
  },
  {
    id: 'visual-hierarchy',
    name: 'PivotTables, Charts & Dashboard Summary',
    maxPoints: 25,
    description: 'Clear summary tables, PivotTables, and executive KPI cards.',
    criteria: [
      {
        points: 25,
        level: 'Exemplary',
        description: 'Clean KPI summary block and well-structured PivotTable breakdown.',
      },
      {
        points: 20,
        level: 'Proficient',
        description: 'Good readability with clear labels and totals.',
      },
      {
        points: 15,
        level: 'Developing',
        description: 'Basic summary table without clear visual grouping.',
      },
      {
        points: 8,
        level: 'Needs Improvement',
        description: 'Missing summary breakdown.',
      },
    ],
  },
  {
    id: 'executive-insights',
    name: 'Business Recommendations for Management',
    maxPoints: 25,
    description: 'Clear written explanation of findings backed by exact figures from your analysis.',
    criteria: [
      {
        points: 25,
        level: 'Exemplary',
        description: 'Actionable business memo citing exact totals, percentages, and root causes.',
      },
      {
        points: 20,
        level: 'Proficient',
        description: 'Good summary of trends with supporting figures.',
      },
      {
        points: 15,
        level: 'Developing',
        description: 'General observations without specific numbers.',
      },
      {
        points: 8,
        level: 'Needs Improvement',
        description: 'Missing written summary.',
      },
    ],
  },
];

export const CAPSTONE_PROJECTS: CapstoneProject[] = [
  {
    id: 'capstone-1-fmcg-retail-audit',
    slug: 'fmcg-multi-branch-retail-sales-margin-audit',
    projectNumber: 1,
    title: 'FMCG Multi-Branch Retail Sales & Margin Leakage Audit',
    subtitle: 'Analyze 5 Regional Supermarket Branches, SKU Profitability & Promotional Discount Erosion',
    category: 'Commercial Sales & Retail Analytics',
    industry: 'FMCG & Supermarket Chain Operations',
    difficulty: 'Comprehensive',
    estimatedHours: 3,
    heroBadge: 'Real-Life Project 1 of 4',
    businessScenario:
      'PrimeMart Superstores operates 5 high-volume retail branches across Lagos (Ikeja & Lekki), Abuja, Port Harcourt, and Ibadan. Over the last quarter, gross revenue grew by 14%, but net cash profit dropped unexpectedly. Management suspects that unapproved promotional discounts and rising wholesale SKU landed costs are eroding branch profitability.',
    problemStatement:
      'You have been given the raw quarterly invoice ledger and the Master SKU Cost table. You must clean the transaction records, pull unit landed costs via XLOOKUP, compute Gross Revenue, Discount Leakage, Net Revenue, COGS, and Gross Margin % per invoice, and build a Branch & Category Profitability PivotTable for the Commercial Director.',
    keyObjectives: [
      'Convert the raw sales ledger into an official Excel Table (tbl_RetailSales) and remove any formatting inconsistencies.',
      'Use XLOOKUP to retrieve Unit_Cost_NGN and Product_Category from the Master_SKU_Catalog sheet for every invoice row.',
      'Write formulas to calculate Gross_Sales, Discount_Amount, Net_Revenue, Total_COGS, Gross_Profit, and Gross_Margin_% (protected with IFERROR).',
      'Build a PivotTable comparing Net Revenue, Discount Leakage, and Gross Profit across all 5 branches (Ikeja, Lekki, Abuja, Port Harcourt, Ibadan).',
      'Identify which branch and product category suffer the worst margin erosion and write 3 actionable recommendations for the Commercial Director.',
    ],
    deliverableChecklist: [
      {
        id: 'p1-d1',
        label: 'Clean Excel Table (tbl_RetailSales) & XLOOKUP Cost Columns',
        details: 'All 18 invoice rows formatted as an Excel Table with Category and Unit Cost pulled dynamically via XLOOKUP.',
      },
      {
        id: 'p1-d2',
        label: 'Net Revenue, COGS & Gross Margin % Formulas',
        details: 'Accurate row-level formulas for Gross Sales, Discount Amount, Net Revenue, Total Cost, and Margin %.',
      },
      {
        id: 'p1-d3',
        label: 'Branch & Category Performance PivotTable',
        details: 'PivotTable summarizing Total Net Revenue, Total Discount Given, and Gross Profit Margin % by Branch.',
      },
      {
        id: 'p1-d4',
        label: 'Executive Findings Memo for Instructor Review',
        details: 'Clear summary identifying the #1 highest-margin branch and the branch losing profit to excessive discounts.',
      },
    ],
    requiredFormulas: [
      '=XLOOKUP([@SKU_Code], tbl_SKUCatalog[SKU_Code], tbl_SKUCatalog[Unit_Cost], 0)',
      '=[@Qty_Sold] * [@Unit_Price]',
      '=[@Gross_Sales] * [@Discount_Pct]',
      '=[@Gross_Sales] - [@Discount_Amount]',
      '=[@Net_Revenue] - ([@Qty_Sold] * [@Unit_Cost])',
      '=IFERROR([@Gross_Profit] / [@Net_Revenue], 0)',
      '=SUMIFS(tbl_RetailSales[Gross_Profit], tbl_RetailSales[Branch], "Lagos - Ikeja")',
    ],
    executiveTakeaways: [
      'Lagos - Lekki generated the strongest gross margin (31.4%) driven by full-price Beverages & Personal Care sales.',
      'Port Harcourt branch granted 15%–20% wholesale discounts on low-margin Staple Foods, causing severe margin erosion.',
      'Capping promotional discounts at 8% on Staple Foods recovers an estimated NGN 1.42M in quarterly gross profit.',
    ],
    sampleHeaders: [
      'Invoice_ID',
      'Sale_Date',
      'Branch',
      'Sales_Channel',
      'SKU_Code',
      'Product_Name',
      'Category',
      'Qty_Sold',
      'Unit_Price',
      'Unit_Cost',
      'Discount_Pct',
      'Net_Revenue',
      'Gross_Profit',
    ],
    samplePreviewRows: [
      ['INV-1041', '2026-01-05', 'Lagos - Ikeja', 'In-Store POS', 'SKU-101', 'Golden Morn 900g Carton', 'Breakfast & Cereals', 45, 28500, 21200, 0.05, 1218375, 264375],
      ['INV-1042', '2026-01-07', 'Lagos - Lekki', 'Express Delivery', 'SKU-204', 'Peak Full Cream Tin (24x400g)', 'Dairy & Beverages', 30, 46000, 33500, 0.00, 1380000, 375000],
      ['INV-1043', '2026-01-10', 'Abuja - Wuse', 'Corporate Bulk', 'SKU-309', 'Mama Gold Parboiled Rice 50kg', 'Staple Grains', 60, 78000, 66500, 0.12, 4118400, 128400],
      ['INV-1044', '2026-01-12', 'Port Harcourt', 'Wholesale Trade', 'SKU-309', 'Mama Gold Parboiled Rice 50kg', 'Staple Grains', 85, 78000, 66500, 0.15, 5635500, -17000],
      ['INV-1045', '2026-01-15', 'Ibadan - Dugbe', 'In-Store POS', 'SKU-412', 'Dettol Antiseptic Liquid 1L (x12)', 'Personal Care', 25, 54000, 36800, 0.03, 1309500, 389500],
      ['INV-1046', '2026-01-18', 'Lagos - Lekki', 'In-Store POS', 'SKU-515', 'Devon Kings Vegetable Oil 25L', 'Cooking Oils', 40, 62000, 48000, 0.02, 2430400, 510400],
    ],
    fullDatasetRows: [
      ['INV-1041', '2026-01-05', 'Lagos - Ikeja', 'In-Store POS', 'SKU-101', 'Golden Morn 900g Carton', 'Breakfast & Cereals', 45, 28500, 21200, 0.05, 1218375, 264375],
      ['INV-1042', '2026-01-07', 'Lagos - Lekki', 'Express Delivery', 'SKU-204', 'Peak Full Cream Tin (24x400g)', 'Dairy & Beverages', 30, 46000, 33500, 0.00, 1380000, 375000],
      ['INV-1043', '2026-01-10', 'Abuja - Wuse', 'Corporate Bulk', 'SKU-309', 'Mama Gold Parboiled Rice 50kg', 'Staple Grains', 60, 78000, 66500, 0.12, 4118400, 128400],
      ['INV-1044', '2026-01-12', 'Port Harcourt', 'Wholesale Trade', 'SKU-309', 'Mama Gold Parboiled Rice 50kg', 'Staple Grains', 85, 78000, 66500, 0.15, 5635500, -17000],
      ['INV-1045', '2026-01-15', 'Ibadan - Dugbe', 'In-Store POS', 'SKU-412', 'Dettol Antiseptic Liquid 1L (x12)', 'Personal Care', 25, 54000, 36800, 0.03, 1309500, 389500],
      ['INV-1046', '2026-01-18', 'Lagos - Lekki', 'In-Store POS', 'SKU-515', 'Devon Kings Vegetable Oil 25L', 'Cooking Oils', 40, 62000, 48000, 0.02, 2430400, 510400],
      ['INV-1047', '2026-01-21', 'Lagos - Ikeja', 'Wholesale Trade', 'SKU-204', 'Peak Full Cream Tin (24x400g)', 'Dairy & Beverages', 55, 46000, 33500, 0.08, 2327600, 485100],
      ['INV-1048', '2026-01-24', 'Abuja - Wuse', 'In-Store POS', 'SKU-412', 'Dettol Antiseptic Liquid 1L (x12)', 'Personal Care', 35, 54000, 36800, 0.00, 1890000, 602000],
      ['INV-1049', '2026-01-28', 'Port Harcourt', 'Wholesale Trade', 'SKU-515', 'Devon Kings Vegetable Oil 25L', 'Cooking Oils', 70, 62000, 48000, 0.18, 3558800, 198800],
      ['INV-1050', '2026-02-02', 'Ibadan - Dugbe', 'In-Store POS', 'SKU-101', 'Golden Morn 900g Carton', 'Breakfast & Cereals', 50, 28500, 21200, 0.04, 1368000, 308000],
      ['INV-1051', '2026-02-06', 'Lagos - Lekki', 'Express Delivery', 'SKU-412', 'Dettol Antiseptic Liquid 1L (x12)', 'Personal Care', 42, 54000, 36800, 0.00, 2268000, 722400],
      ['INV-1052', '2026-02-11', 'Abuja - Wuse', 'In-Store POS', 'SKU-101', 'Golden Morn 900g Carton', 'Breakfast & Cereals', 38, 28500, 21200, 0.05, 1028850, 223250],
      ['INV-1053', '2026-02-15', 'Lagos - Ikeja', 'Corporate Bulk', 'SKU-309', 'Mama Gold Parboiled Rice 50kg', 'Staple Grains', 50, 78000, 66500, 0.06, 3666000, 341000],
      ['INV-1054', '2026-02-19', 'Port Harcourt', 'In-Store POS', 'SKU-204', 'Peak Full Cream Tin (24x400g)', 'Dairy & Beverages', 48, 46000, 33500, 0.14, 1898880, 290880],
      ['INV-1055', '2026-02-23', 'Ibadan - Dugbe', 'Wholesale Trade', 'SKU-515', 'Devon Kings Vegetable Oil 25L', 'Cooking Oils', 32, 62000, 48000, 0.05, 1884800, 348800],
      ['INV-1056', '2026-02-27', 'Lagos - Lekki', 'In-Store POS', 'SKU-101', 'Golden Morn 900g Carton', 'Breakfast & Cereals', 65, 28500, 21200, 0.00, 1852500, 474500],
    ],
    referenceTableHeaders: ['SKU_Code', 'Product_Name', 'Category', 'Unit_Cost', 'Standard_Retail_Price', 'Max_Allowed_Discount'],
    referenceTableRows: [
      ['SKU-101', 'Golden Morn 900g Carton', 'Breakfast & Cereals', 21200, 28500, 0.05],
      ['SKU-204', 'Peak Full Cream Tin (24x400g)', 'Dairy & Beverages', 33500, 46000, 0.08],
      ['SKU-309', 'Mama Gold Parboiled Rice 50kg', 'Staple Grains', 66500, 78000, 0.06],
      ['SKU-412', 'Dettol Antiseptic Liquid 1L (x12)', 'Personal Care', 36800, 54000, 0.05],
      ['SKU-515', 'Devon Kings Vegetable Oil 25L', 'Cooking Oils', 48000, 62000, 0.07],
    ],
    rubric: CAPSTONE_RUBRIC_DIMENSIONS,
    starterWorkbookName: 'Project_01_FMCG_Retail_Sales_Audit.xlsx',
    solutionWorkbookName: 'Project_01_FMCG_Retail_Sales_Solution.xlsx',
  },
  {
    id: 'capstone-2-sme-loan-risk',
    slug: 'commercial-bank-sme-loan-portfolio-default-risk',
    projectNumber: 2,
    title: 'Commercial Bank SME Loan Portfolio & Default Risk Analysis',
    subtitle: 'Credit Delinquency Aging (PAR-30 / PAR-90), Collateral Coverage & Expected Loss Provisioning',
    category: 'Financial Risk & Banking Analytics',
    industry: 'Commercial & Microfinance Banking',
    difficulty: 'Enterprise',
    estimatedHours: 3.5,
    heroBadge: 'Real-Life Project 2 of 4',
    businessScenario:
      'Crestview Commercial Bank manages an active SME credit portfolio across Agriculture, Logistics, Retail Trade, Healthcare, and Manufacturing sectors. Ahead of the Central Bank quarterly audit, the Chief Risk Officer (CRO) requires an automated Loan Aging & Portfolio-at-Risk (PAR) workbook to flag delinquent borrowers and calculate required loan loss provisions.',
    problemStatement:
      'The raw loan book contains 16 corporate borrower facilities with Outstanding Principal, Days Past Due (DPD), Collateral Value, and Interest Rates, but lacks automated Risk Classification buckets (Performing, Watchlist, Substandard, Doubtful, Lost) and Expected Credit Loss (ECL) provisioning formulas.',
    keyObjectives: [
      'Structure the raw loan book as an official Excel Table (tbl_LoanPortfolio) and validate all principal and collateral amounts.',
      'Write nested IF / IFS formulas to classify each loan by Days Past Due (DPD): 0–29 days = "Performing (1% Provision)", 30–59 days = "Watchlist (5%)", 60–89 days = "Substandard (20%)", 90+ days = "Non-Performing / Doubtful (50%)".',
      'Calculate Collateral Coverage Ratio (=Collateral_Value / Outstanding_Principal) and flag Under-Collateralized loans (< 1.20x).',
      'Use SUMIFS and COUNTIFS to build an Executive Credit Risk Summary showing Total Portfolio Value, PAR-30% (loans >= 30 DPD), PAR-90% (loans >= 90 DPD), and Total Required Provision by Sector.',
      'Provide a concise credit risk recommendation identifying which industry sector poses the highest default exposure.',
    ],
    deliverableChecklist: [
      {
        id: 'p2-d1',
        label: 'Automated Loan Risk Bucket & Provision Rate Formulas',
        details: 'IF/IFS or XLOOKUP formulas assigning Risk Grade and Provision % based on Days Past Due (DPD).',
      },
      {
        id: 'p2-d2',
        label: 'Collateral Coverage Ratio & Security Flag',
        details: 'Formula calculating Collateral / Principal ratio and flagging "Secured" vs "Under-Collateralized".',
      },
      {
        id: 'p2-d3',
        label: 'Sector Exposure & Portfolio-at-Risk (PAR) Summary Table',
        details: 'SUMIFS/COUNTIFS schedule breaking down Total Principal, Non-Performing Loans, and Provision Amount by Sector.',
      },
      {
        id: 'p2-d4',
        label: 'CRO Audit Findings & Risk Mitigation Memo',
        details: 'Written executive summary citing exact PAR-30 %, total required provision, and highest-risk industry sector.',
      },
    ],
    requiredFormulas: [
      '=IFS([@Days_Past_Due]>=90, "Non-Performing (50%)", [@Days_Past_Due]>=60, "Substandard (20%)", [@Days_Past_Due]>=30, "Watchlist (5%)", TRUE, "Performing (1%)")',
      '=IF([@Days_Past_Due]>=90, 0.50, IF([@Days_Past_Due]>=60, 0.20, IF([@Days_Past_Due]>=30, 0.05, 0.01)))',
      '=[@Outstanding_Principal] * [@Provision_Rate]',
      '=IFERROR([@Collateral_Value] / [@Outstanding_Principal], 0)',
      '=SUMIFS(tbl_LoanPortfolio[Outstanding_Principal], tbl_LoanPortfolio[Days_Past_Due], ">=30") / SUM(tbl_LoanPortfolio[Outstanding_Principal])',
    ],
    executiveTakeaways: [
      'Total SME Loan Portfolio stands at NGN 412.5M, with PAR-30 (loans 30+ days overdue) at 24.8% of total book.',
      'Haulage & Logistics sector accounts for 62% of all Non-Performing Loans (90+ DPD) due to diesel price spikes.',
      'Requiring a minimum 1.35x collateral coverage ratio on new Logistics facilities reduces unrecovered default exposure by 41%.',
    ],
    sampleHeaders: [
      'Loan_ID',
      'Borrower_Name',
      'Sector',
      'Region',
      'Principal_NGN',
      'Interest_Rate',
      'Days_Past_Due',
      'Collateral_Value',
      'Risk_Grade',
      'Provision_NGN',
    ],
    samplePreviewRows: [
      ['LN-4001', 'AgroAllied Farms Ltd', 'Agriculture', 'Kano', 28500000, '21.0%', 12, 42000000, 'Performing (1%)', 285000],
      ['LN-4002', 'SwiftHaul Logistics', 'Logistics', 'Lagos', 45000000, '24.5%', 96, 38000000, 'Non-Performing (50%)', 22500000],
      ['LN-4003', 'MedPlus Diagnostics', 'Healthcare', 'Abuja', 32000000, '19.5%', 0, 55000000, 'Performing (1%)', 320000],
      ['LN-4004', 'Kano Textile Mills', 'Manufacturing', 'Kano', 38000000, '22.0%', 44, 46000000, 'Watchlist (5%)', 1900000],
      ['LN-4005', 'Delta Marine Transport', 'Logistics', 'Port Harcourt', 29000000, '25.0%', 112, 24000000, 'Non-Performing (50%)', 14500000],
      ['LN-4006', 'Sunrise Superstores', 'Retail Trade', 'Ibadan', 19500000, '23.0%', 8, 27000000, 'Performing (1%)', 195000],
    ],
    fullDatasetRows: [
      ['LN-4001', 'AgroAllied Farms Ltd', 'Agriculture', 'Kano', 28500000, '21.0%', 12, 42000000, 'Performing (1%)', 285000],
      ['LN-4002', 'SwiftHaul Logistics', 'Logistics', 'Lagos', 45000000, '24.5%', 96, 38000000, 'Non-Performing (50%)', 22500000],
      ['LN-4003', 'MedPlus Diagnostics', 'Healthcare', 'Abuja', 32000000, '19.5%', 0, 55000000, 'Performing (1%)', 320000],
      ['LN-4004', 'Kano Textile Mills', 'Manufacturing', 'Kano', 38000000, '22.0%', 44, 46000000, 'Watchlist (5%)', 1900000],
      ['LN-4005', 'Delta Marine Transport', 'Logistics', 'Port Harcourt', 29000000, '25.0%', 112, 24000000, 'Non-Performing (50%)', 14500000],
      ['LN-4006', 'Sunrise Superstores', 'Retail Trade', 'Ibadan', 19500000, '23.0%', 8, 27000000, 'Performing (1%)', 195000],
      ['LN-4007', 'Apex Cold Storage', 'Agriculture', 'Jos', 24000000, '20.5%', 67, 26000000, 'Substandard (20%)', 4800000],
      ['LN-4008', 'Metro Pharmacy Group', 'Healthcare', 'Lagos', 21000000, '19.0%', 0, 34000000, 'Performing (1%)', 210000],
      ['LN-4009', 'TransNaija Freight', 'Logistics', 'Abuja', 36000000, '24.0%', 75, 31000000, 'Substandard (20%)', 7200000],
      ['LN-4010', 'Ogun Steel Fabricators', 'Manufacturing', 'Lagos', 41000000, '21.5%', 19, 60000000, 'Performing (1%)', 410000],
      ['LN-4011', 'Prime Wholesale Mart', 'Retail Trade', 'Port Harcourt', 16500000, '23.5%', 35, 20000000, 'Watchlist (5%)', 825000],
      ['LN-4012', 'GreenHarvest Mills', 'Agriculture', 'Ibadan', 22000000, '20.0%', 4, 33000000, 'Performing (1%)', 220000],
      ['LN-4013', 'Crestline Clinics', 'Healthcare', 'Lagos', 27500000, '19.5%', 0, 41000000, 'Performing (1%)', 275000],
      ['LN-4014', 'Express Fleet Services', 'Logistics', 'Kano', 32500000, '25.0%', 104, 25000000, 'Non-Performing (50%)', 16250000],
    ],
    referenceTableHeaders: ['Min_DPD', 'Max_DPD', 'CBN_Risk_Classification', 'Provision_Rate', 'Action_Required'],
    referenceTableRows: [
      [0, 29, 'Performing', 0.01, 'Standard Monthly Monitoring'],
      [30, 59, 'Watchlist', 0.05, 'Relationship Manager Early Follow-Up'],
      [60, 89, 'Substandard', 0.20, 'Restructure Review & Cash Sweep'],
      [90, 999, 'Non-Performing / Doubtful', 0.50, 'Legal Recovery & Collateral Realization'],
    ],
    rubric: CAPSTONE_RUBRIC_DIMENSIONS,
    starterWorkbookName: 'Project_02_Bank_Loan_Portfolio_Risk.xlsx',
    solutionWorkbookName: 'Project_02_Bank_Loan_Portfolio_Solution.xlsx',
  },
  {
    id: 'capstone-3-telecom-churn-cohort',
    slug: 'telecom-subscriber-churn-arpu-retention-analysis',
    projectNumber: 3,
    title: 'Telecom Subscriber Churn, ARPU & Retention Cohort Investigation',
    subtitle: 'Analyze Regional Data Plan Churn Drivers, Network Downtime Impact & Revenue at Risk',
    category: 'Customer Retention & Telecom Analytics',
    industry: 'Telecommunications & Fibre Broadband',
    difficulty: 'Comprehensive',
    estimatedHours: 3.5,
    heroBadge: 'Real-Life Project 3 of 4',
    businessScenario:
      'NexaTel Broadband & Wireless serves corporate and residential data subscribers across 5 metropolitan zones. Over the past 6 months, subscriber cancellations spiked in specific fibre and 5G plans. The VP of Customer Growth wants a quantitative breakdown linking network downtime hours, customer support response times, and monthly ARPU to subscriber churn.',
    problemStatement:
      'You are provided with 16 regional subscriber segment cohorts detailing Active_Subscribers, Churned_Subscribers, Monthly_ARPU_NGN, Avg_Downtime_Hours, and Support_Wait_Mins. You need to calculate Segment Churn Rate %, Monthly Revenue Lost to Churn, Annualized Revenue at Risk, and isolate the primary operational driver of subscriber cancellations.',
    keyObjectives: [
      'Convert the subscriber dataset into an official Excel Table (tbl_TelecomChurn) and verify all subscriber counts.',
      'Calculate Total_Starting_Base, Churn_Rate_% (=Churned / Starting_Base), Retained_MRR, and Monthly_Churned_Revenue.',
      'Use IF / AND logic to flag "Critical Retention Alert" segments where Churn_Rate_% > 8.0% OR Avg_Downtime_Hours > 12 hours.',
      'Build a summary table comparing Average Churn Rate and Total Lost Revenue across Plan Tiers (SME Fibre, Home 5G Unlimited, Mobile Data Bundles, Enterprise Dedicated).',
      'Write a 3-point retention strategy memo for the VP of Customer Growth quantifying how much annual revenue can be saved by reducing network downtime below 6 hours.',
    ],
    deliverableChecklist: [
      {
        id: 'p3-d1',
        label: 'Churn Rate % & Lost Monthly Recurring Revenue (MRR) Formulas',
        details: 'Accurate formulas computing Starting Subscribers, Churn Rate %, Active MRR, and Churned MRR.',
      },
      {
        id: 'p3-d2',
        label: 'Automated SLA & Churn Alert Flagging',
        details: 'Logical IF/OR formula flagging high-churn or high-downtime network zones for engineering intervention.',
      },
      {
        id: 'p3-d3',
        label: 'Plan Tier & Regional Retention Pivot Summary',
        details: 'Summary schedule showing Churned Subscribers and Annualized Revenue Lost by Plan Tier and City.',
      },
      {
        id: 'p3-d4',
        label: 'Executive Retention Findings for Instructor Review',
        details: 'Written analysis citing the exact city and plan tier with the highest revenue loss and recommended fix.',
      },
    ],
    requiredFormulas: [
      '=[@Active_Subscribers] + [@Churned_Subscribers]',
      '=IFERROR([@Churned_Subscribers] / [@Starting_Subscribers], 0)',
      '=[@Churned_Subscribers] * [@Monthly_ARPU_NGN]',
      '=[@Monthly_Churned_Revenue] * 12',
      '=IF(OR([@Churn_Rate]>0.08, [@Avg_Downtime_Hrs]>12), "CRITICAL SLA BREACH", "Normal")',
    ],
    executiveTakeaways: [
      'Home 5G Unlimited in Port Harcourt and Abuja suffers a 12.4% monthly churn rate, correlating directly with >15 hours of monthly tower downtime.',
      'Subscribers experiencing more than 12 hours of network outage churn at 3.2x the rate of subscribers with <4 hours downtime.',
      'Prioritizing backup power upgrades in the top 3 high-downtime zones protects NGN 86.4M in annualized recurring revenue.',
    ],
    sampleHeaders: [
      'Segment_ID',
      'City_Zone',
      'Plan_Tier',
      'Starting_Subs',
      'Active_Subs',
      'Churned_Subs',
      'Churn_Rate_%',
      'Monthly_ARPU',
      'Avg_Downtime_Hrs',
      'Churned_MRR_NGN',
    ],
    samplePreviewRows: [
      ['SEG-01', 'Lagos Mainland', 'Home 5G Unlimited', 4200, 3948, 252, '6.0%', 25000, 5.2, 6300000],
      ['SEG-02', 'Lagos Island', 'SME Fibre Pro', 1850, 1795, 55, '3.0%', 65000, 2.1, 3575000],
      ['SEG-03', 'Abuja Central', 'Home 5G Unlimited', 3100, 2728, 372, '12.0%', 25000, 16.4, 9300000],
      ['SEG-04', 'Port Harcourt', 'SME Fibre Pro', 1200, 1044, 156, '13.0%', 65000, 18.5, 10140000],
      ['SEG-05', 'Ibadan Metro', 'Mobile 4G Bundle', 6400, 5952, 448, '7.0%', 8500, 6.8, 3808000],
      ['SEG-06', 'Kano Commercial', 'SME Fibre Pro', 950, 893, 57, '6.0%', 65000, 7.0, 3705000],
    ],
    fullDatasetRows: [
      ['SEG-01', 'Lagos Mainland', 'Home 5G Unlimited', 4200, 3948, 252, '6.0%', 25000, 5.2, 6300000],
      ['SEG-02', 'Lagos Island', 'SME Fibre Pro', 1850, 1795, 55, '3.0%', 65000, 2.1, 3575000],
      ['SEG-03', 'Abuja Central', 'Home 5G Unlimited', 3100, 2728, 372, '12.0%', 25000, 16.4, 9300000],
      ['SEG-04', 'Port Harcourt', 'SME Fibre Pro', 1200, 1044, 156, '13.0%', 65000, 18.5, 10140000],
      ['SEG-05', 'Ibadan Metro', 'Mobile 4G Bundle', 6400, 5952, 448, '7.0%', 8500, 6.8, 3808000],
      ['SEG-06', 'Kano Commercial', 'SME Fibre Pro', 950, 893, 57, '6.0%', 65000, 7.0, 3705000],
      ['SEG-07', 'Lagos Island', 'Enterprise Dedicated', 420, 412, 8, '1.9%', 220000, 1.2, 1760000],
      ['SEG-08', 'Abuja Central', 'SME Fibre Pro', 1400, 1274, 126, '9.0%', 65000, 13.2, 8190000],
      ['SEG-09', 'Port Harcourt', 'Home 5G Unlimited', 2600, 2262, 338, '13.0%', 25000, 17.8, 8450000],
      ['SEG-10', 'Lagos Mainland', 'Mobile 4G Bundle', 8500, 8075, 425, '5.0%', 8500, 4.5, 3612500],
      ['SEG-11', 'Enugu Metro', 'Home 5G Unlimited', 1900, 1729, 171, '9.0%', 25000, 12.6, 4275000],
      ['SEG-12', 'Abuja Central', 'Enterprise Dedicated', 310, 301, 9, '2.9%', 220000, 2.4, 1980000],
      ['SEG-13', 'Ibadan Metro', 'Home 5G Unlimited', 2300, 2139, 161, '7.0%', 25000, 7.5, 4025000],
      ['SEG-14', 'Kano Commercial', 'Mobile 4G Bundle', 5200, 4680, 520, '10.0%', 8500, 14.1, 4420000],
    ],
    rubric: CAPSTONE_RUBRIC_DIMENSIONS,
    starterWorkbookName: 'Project_03_Telecom_Subscriber_Churn.xlsx',
    solutionWorkbookName: 'Project_03_Telecom_Subscriber_Solution.xlsx',
  },
  {
    id: 'capstone-4-pharma-supply-chain',
    slug: 'healthcare-pharma-supply-chain-inventory-opex-variance',
    projectNumber: 4,
    title: 'Pharmaceutical Supply Chain Inventory & Cold-Chain OPEX Variance Model',
    subtitle: 'Track Critical Medical Stockouts, Reorder Point Triggers & Distribution Freight Budget Variances',
    category: 'Supply Chain & Operations Finance',
    industry: 'Healthcare & Pharmaceutical Distribution',
    difficulty: 'Executive',
    estimatedHours: 4,
    heroBadge: 'Real-Life Project 4 of 4',
    businessScenario:
      'MedCore Pharma Logistics distributes temperature-sensitive vaccines, insulin, and essential hospital medications across 6 regional medical depots. In Q1, emergency air-freight surcharges caused distribution Operating Expenses (OPEX) to exceed budget, while several depots still experienced critical stockouts of high-demand medications.',
    problemStatement:
      'Operations leadership needs a unified Inventory Replenishment & Cold-Chain OPEX Variance model. Using the 15 depot SKU records, you must calculate Days of Inventory Remaining, automate Reorder Alert triggers based on Lead Time demand, and compute Budget vs. Actual Freight OPEX Variances across regional depots.',
    keyObjectives: [
      'Format the depot inventory and freight ledger as an official Excel Table (tbl_PharmaOps).',
      'Calculate Days_of_Stock_Remaining (=Current_Stock_Units / Daily_Usage_Rate) and Safety_Reorder_Point (=(Lead_Time_Days * Daily_Usage_Rate) + Safety_Buffer).',
      'Write an IF formula to trigger Inventory Status: "CRITICAL REORDER NOW" if Current_Stock <= Reorder_Point, otherwise "Adequate Stock".',
      'Calculate Freight Cost Variance_NGN (=Actual_Freight_NGN - Budget_Freight_NGN) and Variance_% to isolate depots overspending on emergency cold-chain transport.',
      'Summarize Total Inventory Value, Number of Critical Stockout SKUs, and Total Freight Budget Variance by Depot, and write your operational recommendations for the Supply Chain Director.',
    ],
    deliverableChecklist: [
      {
        id: 'p4-d1',
        label: 'Days of Inventory & Automated Reorder Point Formulas',
        details: 'Formulas calculating Days of Stock Remaining, Reorder Point threshold, and Reorder Status flag.',
      },
      {
        id: 'p4-d2',
        label: 'Cold-Chain Freight Budget vs. Actual Variance Analysis',
        details: 'Variance $ and Variance % formulas flagging depots that exceeded budgeted cold-chain logistics cost.',
      },
      {
        id: 'p4-d3',
        label: 'Regional Depot Summary & Replenishment Schedule',
        details: 'PivotTable or SUMIFS/COUNTIFS table showing Stockout Risk SKUs and Net Freight Variance per depot.',
      },
      {
        id: 'p4-d4',
        label: 'Supply Chain Director Executive Memo',
        details: 'Written summary naming the specific SKUs requiring immediate dispatch and how to curb emergency air-freight overspending.',
      },
    ],
    requiredFormulas: [
      '=IFERROR([@Current_Stock] / [@Daily_Demand], 0)',
      '=([@Lead_Time_Days] * [@Daily_Demand]) + [@Safety_Stock]',
      '=IF([@Current_Stock] <= [@Reorder_Point], "CRITICAL REORDER NOW", "Adequate Stock")',
      '=[@Actual_Freight_NGN] - [@Budget_Freight_NGN]',
      '=IFERROR(([@Actual_Freight_NGN] - [@Budget_Freight_NGN]) / [@Budget_Freight_NGN], 0)',
    ],
    executiveTakeaways: [
      '6 out of 14 depot SKU lines are below their safety reorder threshold, led by Insulin Glargine Pens in Abuja and Enugu.',
      'Emergency last-minute air shipments to fix preventable stockouts drove a +28.4% unfavorable freight cost variance in Port Harcourt and Kano.',
      'Automating reorder triggers 5 days prior to safety buffer depletion eliminates 85% of emergency air-freight surcharges.',
    ],
    sampleHeaders: [
      'Batch_ID',
      'Depot_Location',
      'Medical_SKU',
      'Storage_Type',
      'Current_Stock',
      'Daily_Demand',
      'Lead_Time_Days',
      'Reorder_Point',
      'Stock_Status',
      'Budget_Freight',
      'Actual_Freight',
    ],
    samplePreviewRows: [
      ['MED-801', 'Lagos Central Depot', 'Insulin Glargine 100IU Pen', 'Cold-Chain (2-8C)', 420, 45, 7, 450, 'CRITICAL REORDER NOW', 1250000, 1310000],
      ['MED-802', 'Abuja National Depot', 'Insulin Glargine 100IU Pen', 'Cold-Chain (2-8C)', 190, 38, 10, 500, 'CRITICAL REORDER NOW', 1400000, 1920000],
      ['MED-803', 'Port Harcourt Depot', 'Ceftriaxone 1g IV Vial', 'Ambient Controlled', 1850, 95, 8, 1000, 'Adequate Stock', 980000, 1010000],
      ['MED-804', 'Kano Northern Depot', 'Pediatric Malaria ACT Pack', 'Ambient Controlled', 620, 110, 9, 1300, 'CRITICAL REORDER NOW', 1150000, 1640000],
      ['MED-805', 'Ibadan Western Depot', 'Hepatitis B Vaccine Vial', 'Cold-Chain (2-8C)', 890, 40, 7, 420, 'Adequate Stock', 890000, 865000],
      ['MED-806', 'Enugu Eastern Depot', 'Amoxicillin Clavulanate 625mg', 'Ambient Controlled', 340, 65, 8, 700, 'CRITICAL REORDER NOW', 920000, 1290000],
    ],
    fullDatasetRows: [
      ['MED-801', 'Lagos Central Depot', 'Insulin Glargine 100IU Pen', 'Cold-Chain (2-8C)', 420, 45, 7, 450, 'CRITICAL REORDER NOW', 1250000, 1310000],
      ['MED-802', 'Abuja National Depot', 'Insulin Glargine 100IU Pen', 'Cold-Chain (2-8C)', 190, 38, 10, 500, 'CRITICAL REORDER NOW', 1400000, 1920000],
      ['MED-803', 'Port Harcourt Depot', 'Ceftriaxone 1g IV Vial', 'Ambient Controlled', 1850, 95, 8, 1000, 'Adequate Stock', 980000, 1010000],
      ['MED-804', 'Kano Northern Depot', 'Pediatric Malaria ACT Pack', 'Ambient Controlled', 620, 110, 9, 1300, 'CRITICAL REORDER NOW', 1150000, 1640000],
      ['MED-805', 'Ibadan Western Depot', 'Hepatitis B Vaccine Vial', 'Cold-Chain (2-8C)', 890, 40, 7, 420, 'Adequate Stock', 890000, 865000],
      ['MED-806', 'Enugu Eastern Depot', 'Amoxicillin Clavulanate 625mg', 'Ambient Controlled', 340, 65, 8, 700, 'CRITICAL REORDER NOW', 920000, 1290000],
      ['MED-807', 'Lagos Central Depot', 'Pediatric Malaria ACT Pack', 'Ambient Controlled', 2400, 130, 6, 1100, 'Adequate Stock', 1100000, 1080000],
      ['MED-808', 'Abuja National Depot', 'Hepatitis B Vaccine Vial', 'Cold-Chain (2-8C)', 760, 42, 9, 520, 'Adequate Stock', 1320000, 1350000],
      ['MED-809', 'Port Harcourt Depot', 'Insulin Glargine 100IU Pen', 'Cold-Chain (2-8C)', 210, 35, 9, 440, 'CRITICAL REORDER NOW', 1380000, 1890000],
      ['MED-810', 'Kano Northern Depot', 'Ceftriaxone 1g IV Vial', 'Ambient Controlled', 1420, 85, 10, 1100, 'Adequate Stock', 1050000, 1090000],
      ['MED-811', 'Enugu Eastern Depot', 'Hepatitis B Vaccine Vial', 'Cold-Chain (2-8C)', 230, 36, 9, 450, 'CRITICAL REORDER NOW', 1180000, 1590000],
      ['MED-812', 'Ibadan Western Depot', 'Amoxicillin Clavulanate 625mg', 'Ambient Controlled', 1540, 75, 6, 650, 'Adequate Stock', 780000, 760000],
      ['MED-813', 'Lagos Central Depot', 'Ceftriaxone 1g IV Vial', 'Ambient Controlled', 2150, 115, 5, 800, 'Adequate Stock', 950000, 940000],
      ['MED-814', 'Abuja National Depot', 'Pediatric Malaria ACT Pack', 'Ambient Controlled', 1780, 98, 8, 1050, 'Adequate Stock', 1120000, 1160000],
    ],
    rubric: CAPSTONE_RUBRIC_DIMENSIONS,
    starterWorkbookName: 'Project_04_Pharma_Supply_Chain_OPEX.xlsx',
    solutionWorkbookName: 'Project_04_Pharma_Supply_Chain_Solution.xlsx',
  },
];
