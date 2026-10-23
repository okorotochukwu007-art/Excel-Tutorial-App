import { SpreadsheetGrid } from '../utils/excelFormulaEngine';

export interface PlaygroundDataset {
  id: string;
  name: string;
  description: string;
  badge: string;
  headers: string[];
  rows: (string | number)[][];
  suggestedFormulas: {
    title: string;
    formula: string;
    category: string;
    explanation: string;
  }[];
}

export interface PlaygroundChallenge {
  id: string;
  datasetId: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  scenario: string;
  goal: string;
  hint: string;
  expectedResultType: 'number' | 'text' | 'boolean';
  validate: (result: any, formula: string) => { passed: boolean; message: string };
  starterFormula?: string;
}

export const PLAYGROUND_DATASETS: PlaygroundDataset[] = [
  {
    id: 'sales',
    name: 'Regional Sales & Revenue',
    badge: 'Sales & E-Commerce',
    description: 'Realistic e-commerce transactions across regions, sales representatives, product categories, revenue, and profit margins.',
    headers: ['Order ID (A)', 'Sales Rep (B)', 'Region (C)', 'Category (D)', 'Sales $ (E)', 'Units (F)', 'Discount (G)', 'Profit $ (H)'],
    rows: [
      ['ORD-101', 'Amara Obi', 'East', 'Technology', 1250, 5, 0.1, 375],
      ['ORD-102', 'Babatunde Alabi', 'West', 'Furniture', 450, 2, 0.0, 90],
      ['ORD-103', 'Chioma Eze', 'North', 'Office Supplies', 85, 12, 0.05, 24],
      ['ORD-104', 'David Mensah', 'East', 'Technology', 2400, 8, 0.15, 680],
      ['ORD-105', 'Fatima Bello', 'South', 'Furniture', 920, 3, 0.0, 220],
      ['ORD-106', 'Grace Okafor', 'West', 'Technology', 1650, 4, 0.1, 410],
      ['ORD-107', 'Ibrahim Danladi', 'North', 'Office Supplies', 140, 20, 0.05, 38],
      ['ORD-108', 'Kelechi Nwosu', 'East', 'Furniture', 780, 2, 0.0, 160],
      ['ORD-109', 'Lami Abubakar', 'South', 'Technology', 3100, 10, 0.2, 850],
      ['ORD-110', 'Ngozi Adeyemi', 'East', 'Office Supplies', 320, 15, 0.0, 88],
    ],
    suggestedFormulas: [
      {
        title: 'Total Revenue Across All Orders',
        formula: '=SUM(E2:E11)',
        category: 'Basic Math',
        explanation: 'Calculates the sum of all sales values from cell E2 to E11.',
      },
      {
        title: 'Average Order Value',
        formula: '=AVERAGE(E2:E11)',
        category: 'Basic Math',
        explanation: 'Finds the arithmetic mean order value across all 10 transactions.',
      },
      {
        title: 'Total Sales in East Region',
        formula: '=SUMIF(C2:C11, "East", E2:E11)',
        category: 'Conditional Math',
        explanation: 'Sums sales in column E only for rows where Region (column C) equals "East".',
      },
      {
        title: 'Technology Orders in East Region',
        formula: '=SUMIFS(E2:E11, C2:C11, "East", D2:D11, "Technology")',
        category: 'Multi-Condition',
        explanation: 'Sums sales in column E where Region is "East" AND Category is "Technology".',
      },
      {
        title: 'Count Large Orders (Sales >= 1000)',
        formula: '=COUNTIF(E2:E11, ">=1000")',
        category: 'Counting',
        explanation: 'Counts how many orders generated $1,000 or more in revenue.',
      },
      {
        title: 'Find Sales for Order ORD-104 with XLOOKUP',
        formula: '=XLOOKUP("ORD-104", A2:A11, E2:E11, "Not Found")',
        category: 'Lookup & Reference',
        explanation: 'Searches for "ORD-104" in column A and returns the corresponding sales figure in column E.',
      },
      {
        title: 'High Value Flag using IF',
        formula: '=IF(E2>=1000, "High Value Deal", "Standard Order")',
        category: 'Logic',
        explanation: 'Tests if cell E2 is at least $1,000, returning a customized status text.',
      },
      {
        title: 'Full Sales Rep Badge using CONCAT',
        formula: '=CONCAT(B2, " - ", C2, " (", D2, ")")',
        category: 'Text & Cleaning',
        explanation: 'Combines the sales rep name, region, and category into a clean summary badge.',
      },
    ],
  },
  {
    id: 'employees',
    name: 'Employee HR & Salary Directory',
    badge: 'Human Resources',
    description: 'Corporate staff directory containing Employee IDs, department tags, job titles, base salaries, and performance ratings.',
    headers: ['Emp ID (A)', 'Employee Name (B)', 'Department (C)', 'Role (D)', 'Base Salary (E)', 'Bonus % (F)', 'Rating (G)', 'Years (H)'],
    rows: [
      ['EMP-201', 'Amina Yusuf', 'Engineering', 'Senior Developer', 92000, 0.12, 4.8, 5],
      ['EMP-202', 'Chidi Okonkwo', 'Finance', 'Financial Analyst', 68000, 0.08, 4.2, 3],
      ['EMP-203', 'Damilola Adeleke', 'Marketing', 'Growth Specialist', 62000, 0.1, 4.5, 2],
      ['EMP-204', 'Emeka Nnamdi', 'Engineering', 'DevOps Engineer', 88000, 0.1, 4.6, 4],
      ['EMP-205', 'Folake Olawale', 'Human Resources', 'HR Generalist', 58000, 0.05, 3.9, 3],
      ['EMP-206', 'Gbenga Adele', 'Engineering', 'Engineering Manager', 115000, 0.15, 4.9, 7],
      ['EMP-207', 'Halima Musa', 'Finance', 'Senior Accountant', 76000, 0.08, 4.1, 6],
      ['EMP-208', 'Ifunanya Chukwu', 'Marketing', 'Content Director', 84000, 0.1, 4.7, 4],
      ['EMP-209', 'Jumoke Bakare', 'Human Resources', 'People Director', 96000, 0.12, 4.8, 8],
      ['EMP-210', 'Kunle Oladipo', 'Engineering', 'Junior Developer', 52000, 0.05, 3.8, 1],
    ],
    suggestedFormulas: [
      {
        title: 'Total Engineering Payroll',
        formula: '=SUMIF(C2:C11, "Engineering", E2:E11)',
        category: 'Conditional Math',
        explanation: 'Calculates the sum of base salaries exclusively for Engineering department staff.',
      },
      {
        title: 'Average Base Salary Company-wide',
        formula: '=ROUND(AVERAGE(E2:E11), 0)',
        category: 'Math & Stats',
        explanation: 'Computes the overall average salary rounded to the nearest whole dollar.',
      },
      {
        title: 'Lookup Employee Name for ID EMP-206',
        formula: '=XLOOKUP("EMP-206", A2:A11, B2:B11, "Unknown ID")',
        category: 'Lookup & Reference',
        explanation: 'Searches employee ID in column A and retrieves the full name from column B.',
      },
      {
        title: 'High Performer Bonus Qualification',
        formula: '=IF(G2>=4.5, "Eligible for Bonus", "Standard Performance")',
        category: 'Logic',
        explanation: 'Tests whether employee rating is 4.5 or higher to determine bonus eligibility.',
      },
      {
        title: 'Clean Uppercase Name',
        formula: '=UPPER(TRIM(B2))',
        category: 'Text & Cleaning',
        explanation: 'Trims any accidental whitespace and converts employee name to clean UPPERCASE.',
      },
      {
        title: 'Count Employees with 5+ Years Tenure',
        formula: '=COUNTIF(H2:H11, ">=5")',
        category: 'Counting',
        explanation: 'Counts how many staff members have been with the company 5 or more years.',
      },
    ],
  },
  {
    id: 'inventory',
    name: 'Product Inventory & Margins',
    badge: 'Operations & Supply Chain',
    description: 'Retail inventory stock levels, wholesale cost, retail selling price, and reorder point thresholds.',
    headers: ['SKU (A)', 'Product Name (B)', 'Category (C)', 'Cost $ (D)', 'Price $ (E)', 'Stock Qty (F)', 'Reorder Pt (G)', 'Status (H)'],
    rows: [
      ['SKU-301', 'Wireless Ergonomic Mouse', 'Accessories', 14.5, 39.99, 120, 30, 'In Stock'],
      ['SKU-302', 'Mechanical Keyboard RGB', 'Accessories', 38.0, 89.99, 18, 25, 'Low Stock'],
      ['SKU-303', '27-inch 4K Monitor IPS', 'Displays', 185.0, 349.99, 45, 15, 'In Stock'],
      ['SKU-304', 'USB-C Dual HDMI Hub', 'Cables & Hubs', 16.0, 45.0, 8, 20, 'Critical Reorder'],
      ['SKU-305', 'Noise-Canceling Headset', 'Audio', 42.0, 99.5, 64, 20, 'In Stock'],
      ['SKU-306', 'Ultra-Fast GaN Charger 65W', 'Power', 12.0, 32.0, 95, 30, 'In Stock'],
      ['SKU-307', 'Braided Thunderbolt 4 Cable', 'Cables & Hubs', 9.5, 28.0, 150, 40, 'In Stock'],
      ['SKU-308', 'Ergonomic Standing Desk Mat', 'Office', 22.0, 54.0, 12, 15, 'Low Stock'],
      ['SKU-309', 'Aluminum Laptop Stand', 'Accessories', 15.0, 35.0, 75, 25, 'In Stock'],
      ['SKU-310', 'Webcam 1080p with Privacy Cover', 'Audio & Video', 26.0, 64.99, 5, 20, 'Critical Reorder'],
    ],
    suggestedFormulas: [
      {
        title: 'Profit Margin Per Unit for First SKU',
        formula: '=E2-D2',
        category: 'Basic Math',
        explanation: 'Subtracts cost price in D2 from selling price in E2.',
      },
      {
        title: 'Check If Reorder Needed',
        formula: '=IF(F2<=G2, "Reorder Alert!", "Stock Healthy")',
        category: 'Logic',
        explanation: 'Compares Stock Qty (F2) against Reorder Point (G2) to generate an inventory warning.',
      },
      {
        title: 'Total Potential Retail Inventory Value',
        formula: '=SUM(E2:E11)',
        category: 'Basic Math',
        explanation: 'Sums the retail prices across all catalog SKUs.',
      },
      {
        title: 'Count Critical Reorder Items',
        formula: '=COUNTIF(H2:H11, "Critical Reorder")',
        category: 'Counting',
        explanation: 'Counts how many inventory items are flagged with Critical Reorder status.',
      },
      {
        title: 'Find SKU-303 Unit Price with VLOOKUP',
        formula: '=VLOOKUP("SKU-303", A2:E11, 5, FALSE)',
        category: 'Lookup & Reference',
        explanation: 'Looks up "SKU-303" in table range A2:E11 and returns the 5th column (Price $).',
      },
    ],
  },
];

export const PLAYGROUND_CHALLENGES: PlaygroundChallenge[] = [
  {
    id: 'ch-sum-east',
    datasetId: 'sales',
    title: 'Calculate Total East Region Sales',
    difficulty: 'Beginner',
    category: 'Conditional Math',
    scenario: 'Your sales VP needs to know the exact combined revenue generated exclusively by the East sales team across all transactions.',
    goal: 'Use SUMIF to sum column E (Sales) where column C (Region) is equal to "East".',
    hint: 'Syntax: =SUMIF(C2:C11, "East", E2:E11)',
    expectedResultType: 'number',
    starterFormula: '=SUMIF(',
    validate: (res, formula) => {
      const isSumif = /SUMIF/i.test(formula);
      const isNum = typeof res === 'number';
      // Expected: 1250 + 2400 + 780 + 320 = 4750
      if (isNum && res === 4750) {
        return { passed: true, message: 'Spot on! The total East region sales is exactly $4,750.' };
      }
      if (!isSumif) {
        return { passed: false, message: 'Make sure you are using the =SUMIF() function.' };
      }
      return { passed: false, message: `Expected $4,750, but got ${res}. Check your range and criteria arguments.` };
    },
  },
  {
    id: 'ch-xlookup-rep',
    datasetId: 'sales',
    title: 'Lookup Order ORD-109 Sales Rep',
    difficulty: 'Intermediate',
    category: 'Lookup & Reference',
    scenario: 'A customer disputed transaction ORD-109. You need to look up which sales representative managed that order.',
    goal: 'Use XLOOKUP to find "ORD-109" in column A (A2:A11) and return the Sales Rep from column B (B2:B11).',
    hint: 'Syntax: =XLOOKUP("ORD-109", A2:A11, B2:B11)',
    expectedResultType: 'text',
    starterFormula: '=XLOOKUP("ORD-109", ',
    validate: (res, formula) => {
      const isXlookup = /XLOOKUP/i.test(formula);
      const cleanRes = String(res).trim().toLowerCase();
      if (cleanRes === 'lami abubakar') {
        return { passed: true, message: 'Excellent! Transaction ORD-109 was managed by Lami Abubakar.' };
      }
      if (!isXlookup) {
        return { passed: false, message: 'Try using the modern =XLOOKUP() function for this challenge.' };
      }
      return { passed: false, message: `Expected "Lami Abubakar", but got "${res}". Check your lookup_array and return_array ranges.` };
    },
  },
  {
    id: 'ch-count-tech',
    datasetId: 'sales',
    title: 'Count Technology Orders',
    difficulty: 'Beginner',
    category: 'Counting',
    scenario: 'The inventory team wants to know how many orders belong to the "Technology" product category.',
    goal: 'Use COUNTIF on Category range D2:D11 to count how many orders are "Technology".',
    hint: 'Syntax: =COUNTIF(D2:D11, "Technology")',
    expectedResultType: 'number',
    starterFormula: '=COUNTIF(D2:D11, ',
    validate: (res, formula) => {
      // ORD-101, ORD-104, ORD-106, ORD-109 = 4
      if (res === 4) {
        return { passed: true, message: 'Great job! There are exactly 4 Technology orders in this dataset.' };
      }
      return { passed: false, message: `Expected 4 Technology orders, but got ${res}. Did you wrap "Technology" in quotes?` };
    },
  },
  {
    id: 'ch-emp-salary',
    datasetId: 'employees',
    title: 'Find Engineering Manager Base Salary',
    difficulty: 'Intermediate',
    category: 'Lookup & Reference',
    scenario: 'HR wants to verify the base salary for employee EMP-206 (Gbenga Adele, Engineering Manager).',
    goal: 'Use XLOOKUP or VLOOKUP to find EMP-206 in column A and return their Base Salary (column E).',
    hint: 'Using XLOOKUP: =XLOOKUP("EMP-206", A2:A11, E2:E11) or VLOOKUP: =VLOOKUP("EMP-206", A2:E11, 5, FALSE)',
    expectedResultType: 'number',
    starterFormula: '=XLOOKUP("EMP-206", ',
    validate: (res) => {
      if (Number(res) === 115000) {
        return { passed: true, message: 'Perfect! EMP-206 has a base salary of $115,000.' };
      }
      return { passed: false, message: `Expected $115,000, but got ${res}. Check your column index or return array.` };
    },
  },
  {
    id: 'ch-avg-rating',
    datasetId: 'employees',
    title: 'Calculate Average Employee Rating',
    difficulty: 'Beginner',
    category: 'Math & Stats',
    scenario: 'Executive leadership wants to see the overall average performance rating across all staff members.',
    goal: 'Use AVERAGE on column G (G2:G11) to compute the mean performance rating.',
    hint: 'Syntax: =AVERAGE(G2:G11)',
    expectedResultType: 'number',
    starterFormula: '=AVERAGE(G2:G11)',
    validate: (res) => {
      const val = Number(res);
      // (4.8+4.2+4.5+4.6+3.9+4.9+4.1+4.7+4.8+3.8) / 10 = 4.43
      if (Math.abs(val - 4.43) < 0.05) {
        return { passed: true, message: 'Correct! The company average rating is 4.43 out of 5.0.' };
      }
      return { passed: false, message: `Expected approximately 4.43, but got ${res}. Make sure your range is G2:G11.` };
    },
  },
];
