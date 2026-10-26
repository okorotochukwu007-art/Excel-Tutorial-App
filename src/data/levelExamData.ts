import { EndOfLevelExam } from '../types/academy';

const RAW_LEVEL_EXAMS: EndOfLevelExam[] = [
  {
    levelNumber: 1,
    title: 'Level 1 General Quiz & Certification Exam',
    subtitle: 'Excel Foundations & Core Workbook Skills',
    description:
      'Demonstrate your mastery of the Excel spreadsheet screen, cell addresses, basic arithmetic formulas, AutoSum, cell formatting, and workbook organization.',
    passingScorePercent: 70,
    totalQuestions: 10,
    questions: [
      {
        id: 'l1-exam-q1',
        quizId: 'exam-lvl-1',
        questionText: 'Every formula or calculation in Microsoft Excel MUST begin with which character?',
        options: ['Equal sign (=)', 'Plus sign (+)', 'At symbol (@)', 'Hash symbol (#)'],
        correctOptionIndex: 0,
        explanation:
          'Excel requires an equals sign (=) at the beginning of a cell to recognize that you are writing a dynamic formula rather than static text.',
      },
      {
        id: 'l1-exam-q2',
        quizId: 'exam-lvl-1',
        questionText: 'What is the intersection of column D and row 8 called in Microsoft Excel?',
        options: ['Cell address D8', 'Range 8D', 'Named box D-8', 'Coordinate (4,8)'],
        correctOptionIndex: 0,
        explanation:
          'Cells are addressed by column letter followed by row number, making D8 the exact cell address.',
      },
      {
        id: 'l1-exam-q3',
        quizId: 'exam-lvl-1',
        questionText: 'Which keyboard shortcut in Excel automatically inserts the SUM formula to add up adjacent numbers?',
        formulaContext: '=SUM(D2:D10)',
        options: ['Alt + = (or Cmd + Shift + T on Mac)', 'Ctrl + S', 'Ctrl + Shift + Enter', 'F2'],
        correctOptionIndex: 0,
        explanation:
          'Alt + = is the universal Excel shortcut for AutoSum, automatically detecting the contiguous numeric range above or to the left.',
      },
      {
        id: 'l1-exam-q4',
        quizId: 'exam-lvl-1',
        questionText: 'You have entered 45000 in cell C2. How should you format it so it displays as professional commercial currency with commas and currency symbol?',
        options: [
          'Select cell C2, go to the Home tab > Number group, and choose Currency (or Accounting)',
          'Type the currency symbol and commas manually into the cell by hand',
          'Convert the entire column to uppercase text',
          'Save the workbook as a plain CSV file',
        ],
        correctOptionIndex: 0,
        explanation:
          'Applying cell formatting maintains the underlying numeric value for calculations while displaying commas, decimals, and currency symbols.',
      },
      {
        id: 'l1-exam-q5',
        quizId: 'exam-lvl-1',
        questionText: 'In cell F2, you type =D2-E2 to calculate remaining budget. What is the quickest way to copy this formula down to rows 3 through 50?',
        options: [
          'Double-click the small square fill handle at the bottom-right corner of cell F2',
          'Re-type =D3-E3, =D4-E4 manually into every single row',
          'Copy and paste row numbers into the formula bar',
          'Delete the other rows and recreate them',
        ],
        correctOptionIndex: 0,
        explanation:
          'Double-clicking or dragging the fill handle copies relative formulas down the entire adjacent list of rows instantly.',
      },
      {
        id: 'l1-exam-q6',
        quizId: 'exam-lvl-1',
        questionText: 'What happens when a cell displays "#####" instead of your calculated number?',
        options: [
          'The column is too narrow to display the formatted number; double-click the column boundary to widen it',
          'Excel encountered a permanent mathematical division by zero',
          'Your formula has been permanently erased',
          'The workbook has exceeded 100 rows',
        ],
        correctOptionIndex: 0,
        explanation:
          'The "#####" display indicates insufficient column width for formatted numbers or dates. Widening the column resolves it immediately.',
      },
      {
        id: 'l1-exam-q7',
        quizId: 'exam-lvl-1',
        questionText: 'Which mathematical order of operations (operator precedence) does Excel follow when calculating =5 + 2 * 10?',
        formulaContext: '=5 + 2 * 10',
        options: [
          'Multiplication happens before addition, resulting in 25',
          'Addition happens before multiplication, resulting in 70',
          'Excel calculates left-to-right strictly, resulting in 70',
          'Excel returns an error because spaces are not allowed',
        ],
        correctOptionIndex: 0,
        explanation:
          'Excel follows standard mathematical precedence (PEMDAS/BODMAS): 2 * 10 is calculated first (20), then 5 is added, yielding 25.',
      },
      {
        id: 'l1-exam-q8',
        quizId: 'exam-lvl-1',
        questionText: 'How can you undo an accidental deletion or mistake in Excel instantly?',
        options: ['Press Ctrl + Z (or Cmd + Z on Mac)', 'Press Delete', 'Close Excel without saving', 'Press F4'],
        correctOptionIndex: 0,
        explanation:
          'Ctrl + Z is the standard undo shortcut in Excel, allowing you to quickly reverse accidental edits.',
      },
      {
        id: 'l1-exam-q9',
        quizId: 'exam-lvl-1',
        questionText: 'Which file format should you choose to preserve all multiple worksheets, formula formatting, and colors when saving?',
        options: [
          'Excel Workbook (.xlsx)',
          'CSV (Comma delimited) (.csv)',
          'Plain Text (.txt)',
          'Single Web Page (.html)',
        ],
        correctOptionIndex: 0,
        explanation:
          'The .xlsx format stores multiple sheets, formatting, fonts, colors, and live formulas. CSV files only retain flat raw text on a single sheet.',
      },
      {
        id: 'l1-exam-q10',
        quizId: 'exam-lvl-1',
        questionText: 'To sort a table of expenses so the largest expense amounts appear at the very top, which sort order should you select?',
        options: ['Sort Largest to Smallest (Descending)', 'Sort Smallest to Largest (Ascending)', 'Filter by Color', 'AutoSum'],
        correctOptionIndex: 0,
        explanation:
          'Sorting Largest to Smallest orders numbers in descending fashion, placing highest costs or revenues at the top.',
      },
    ],
  },
  {
    levelNumber: 2,
    title: 'Level 2 Comprehensive Certification Exam',
    subtitle: 'Excel Formulas, Dynamic Functions & Logic',
    description:
      'Prove your ability to write absolute references ($), SUMIFS, COUNTIFS, XLOOKUP, logical IF/AND statements, error handling with IFERROR, and formula troubleshooting.',
    passingScorePercent: 70,
    totalQuestions: 10,
    questions: [
      {
        id: 'l2-exam-q1',
        quizId: 'exam-lvl-2',
        questionText: 'Why do you include dollar signs ($) in a cell reference like $G$1 when multiplying across multiple rows?',
        formulaContext: '=C2 * $G$1',
        options: [
          'It locks the reference so it stays pointing to cell G1 when the formula is copied down rows',
          'It tells Excel to format the result as US dollars',
          'It makes the formula run faster in memory',
          'It converts the cell value to text',
        ],
        correctOptionIndex: 0,
        explanation:
          'Dollar signs create an absolute reference, preventing Excel from adjusting the row or column coordinates when dragged down or across.',
      },
      {
        id: 'l2-exam-q2',
        quizId: 'exam-lvl-2',
        questionText: 'Which keyboard shortcut toggles a selected cell reference between relative (A1), absolute ($A$1), and mixed (A$1, $A1)?',
        options: ['F4 (or Cmd + T on Mac)', 'F2', 'F9', 'Ctrl + L'],
        correctOptionIndex: 0,
        explanation:
          'Pressing F4 while editing a cell reference cycles through all reference modes ($A$1 -> A$1 -> $A1 -> A1).',
      },
      {
        id: 'l2-exam-q3',
        quizId: 'exam-lvl-2',
        questionText: 'You need to sum revenue in column E where Region (column B) is "Lagos" AND Product Category (column C) is "Cloud". Which function is designed for multiple conditions?',
        formulaContext: '=SUMIFS(E2:E100, B2:B100, "Lagos", C2:C100, "Cloud")',
        options: ['SUMIFS', 'SUMIF', 'COUNTIFS', 'AVERAGEIF'],
        correctOptionIndex: 0,
        explanation:
          'SUMIFS evaluates multiple criteria ranges and criteria pairs simultaneously, whereas SUMIF only accepts a single condition.',
      },
      {
        id: 'l2-exam-q4',
        quizId: 'exam-lvl-2',
        questionText: 'What is the FIRST argument in the modern SUMIFS function?',
        formulaContext: '=SUMIFS(sum_range, criteria_range1, criteria1, ...)',
        options: [
          'The sum_range (the numeric numbers to add up)',
          'The first criteria_range',
          'The text condition string',
          'The lookup array',
        ],
        correctOptionIndex: 0,
        explanation:
          'Unlike the older SUMIF function, SUMIFS places the sum_range as the very first argument, followed by pairs of criteria ranges and criteria.',
      },
      {
        id: 'l2-exam-q5',
        quizId: 'exam-lvl-2',
        questionText: 'Why is XLOOKUP widely preferred over the older VLOOKUP in modern business reporting?',
        formulaContext: '=XLOOKUP(A2, Products!A:A, Products!C:C, "Missing SKU")',
        options: [
          'It looks to the left or right, defaults to exact match, and has a built-in if_not_found fallback',
          'It only works if data is sorted alphabetically in ascending order',
          'It requires counting column index numbers manually',
          'It automatically deletes duplicate rows from the workbook',
        ],
        correctOptionIndex: 0,
        explanation:
          'XLOOKUP eliminates column index counting, looks both left and right, defaults to exact matching, and eliminates ugly #N/A errors via if_not_found.',
      },
      {
        id: 'l2-exam-q6',
        quizId: 'exam-lvl-2',
        questionText: 'You want to check if a sales rep achieved their quota: if Revenue in E2 is greater than or equal to 2,000,000, show "Target Met", otherwise show "Review". Which formula is correct?',
        formulaContext: '=IF(E2>=2000000, "Target Met", "Review")',
        options: [
          '=IF(E2>=2000000, "Target Met", "Review")',
          '=IF(E2>=2000000: Target Met: Review)',
          '=IF(E2=2000000, Target Met)',
          '=COUNTIF(E2>=2000000)',
        ],
        correctOptionIndex: 0,
        explanation:
          'IF requires 3 arguments: logical_test, value_if_true, and value_if_false. Text returns must be enclosed in double quotes.',
      },
      {
        id: 'l2-exam-q7',
        quizId: 'exam-lvl-2',
        questionText: 'When dividing Revenue by Units (=E5/D5), some rows return a #DIV/0! error because Units is zero. How can you display 0 instead of the error?',
        formulaContext: '=IFERROR(E5/D5, 0)',
        options: [
          'Wrap the calculation in =IFERROR(E5/D5, 0)',
          'Delete the row completely',
          'Use =SUM(E5/D5)',
          'Change the cell color to white',
        ],
        correctOptionIndex: 0,
        explanation:
          'IFERROR catches any formula errors (#DIV/0!, #N/A, #VALUE!) and returns your specified alternative value (such as 0 or a clean text note).',
      },
      {
        id: 'l2-exam-q8',
        quizId: 'exam-lvl-2',
        questionText: 'What is the difference between COUNT and COUNTA in Excel?',
        options: [
          'COUNT counts cells containing numbers only; COUNTA counts any cell that is not empty (numbers and text)',
          'COUNT is for columns; COUNTA is for rows',
          'COUNT works on text; COUNTA works on dates only',
          'They are identical functions with different names',
        ],
        correctOptionIndex: 0,
        explanation:
          'COUNT only counts numerical cells, while COUNTA counts all non-blank cells (both text, codes, and numbers).',
      },
      {
        id: 'l2-exam-q9',
        quizId: 'exam-lvl-2',
        questionText: 'Which function joins text from cells A2 and B2 with a clean space in between?',
        options: [
          '=A2 & " " & B2 (or =CONCAT(A2, " ", B2))',
          '=A2 + B2',
          '=JOIN(A2; B2)',
          '=SUM(A2, B2)',
        ],
        correctOptionIndex: 0,
        explanation:
          'The ampersand (&) operator concatenates text strings in Excel, allowing you to insert spaces or characters between cell values.',
      },
      {
        id: 'l2-exam-q10',
        quizId: 'exam-lvl-2',
        questionText: 'If a formula returns #VALUE!, what is the most common underlying cause?',
        options: [
          'A mathematical operator was applied to a cell containing text or improper spacing instead of a clean number',
          'The worksheet was renamed',
          'The font size is set too small',
          'The computer has run out of storage space',
        ],
        correctOptionIndex: 0,
        explanation:
          '#VALUE! errors typically occur when mathematical operations (like +, *, -) are applied to cells containing non-numeric characters, hidden spaces, or mismatched types.',
      },
    ],
  },
  {
    levelNumber: 3,
    title: 'Level 3 Comprehensive Certification Exam',
    subtitle: 'Data Cleaning, Standardization & Preparation',
    description:
      'Demonstrate practical proficiency in data auditing, cleaning irregular spaces with TRIM, text parsing with Flash Fill and Text to Columns, de-duplication, Excel Tables, and Power Query.',
    passingScorePercent: 70,
    totalQuestions: 10,
    questions: [
      {
        id: 'l3-exam-q1',
        quizId: 'exam-lvl-3',
        questionText: 'Raw customer names contain erratic leading spaces, trailing spaces, and multiple spaces between words. Which function standardizes them to single spaces?',
        formulaContext: '=TRIM(A2)',
        options: ['TRIM', 'CLEAN', 'REMOVE', 'SPACELESS'],
        correctOptionIndex: 0,
        explanation:
          'TRIM eliminates all leading and trailing whitespace and collapses multiple consecutive spaces between words into a single standard space.',
      },
      {
        id: 'l3-exam-q2',
        quizId: 'exam-lvl-3',
        questionText: 'Which function converts messy uppercase or lowercase text like "chinedu okafor" into properly capitalized "Chinedu Okafor"?',
        formulaContext: '=PROPER(A2)',
        options: ['PROPER', 'UPPER', 'LOWER', 'CAPITAL'],
        correctOptionIndex: 0,
        explanation:
          'PROPER capitalizes the first letter of each word and converts all other letters to lowercase.',
      },
      {
        id: 'l3-exam-q3',
        quizId: 'exam-lvl-3',
        questionText: 'What is the fastest keyboard shortcut to convert an ordinary range of data into an official, structured Excel Table?',
        options: ['Ctrl + T (or Cmd + T on Mac)', 'Ctrl + P', 'Alt + F4', 'Ctrl + Shift + L'],
        correctOptionIndex: 0,
        explanation:
          'Ctrl + T instantly converts a contiguous data range into an official Excel Table with sort/filter controls and dynamic range expansion.',
      },
      {
        id: 'l3-exam-q4',
        quizId: 'exam-lvl-3',
        questionText: 'What is a key benefit of using structured references like tbl_Sales[@[Revenue]] instead of standard cell references like E2 in a table?',
        options: [
          'Formulas are self-documenting and automatically propagate to every new row added to the table',
          'The file size is reduced by 90%',
          'Formulas cannot be edited by other users',
          'It restricts table data to 10 rows',
        ],
        correctOptionIndex: 0,
        explanation:
          'Structured references use readable column names and automatically expand formulas to newly added or pasted rows without manual dragging.',
      },
      {
        id: 'l3-exam-q5',
        quizId: 'exam-lvl-3',
        questionText: 'You have a single column with "LastName, FirstName" (e.g., "Okafor, Chinedu"). Which feature splits this into two distinct columns without writing complex formulas?',
        options: [
          'Text to Columns (or Flash Fill Ctrl + E)',
          'AutoSum',
          'Conditional Formatting',
          'Consolidate',
        ],
        correctOptionIndex: 0,
        explanation:
          'Data > Text to Columns (with comma delimiter) or Flash Fill (Ctrl + E) splits combined text strings into separated columns effortlessly.',
      },
      {
        id: 'l3-exam-q6',
        quizId: 'exam-lvl-3',
        questionText: 'Where in Excel do you find the native tool to remove identical duplicate transaction lines from a dataset?',
        options: [
          'Data tab > Remove Duplicates',
          'Home tab > Find & Select',
          'Page Layout > Margins',
          'Formulas tab > Calculation Options',
        ],
        correctOptionIndex: 0,
        explanation:
          'Data > Remove Duplicates compares selected columns and strips out redundant duplicate records while reporting how many were deleted.',
      },
      {
        id: 'l3-exam-q7',
        quizId: 'exam-lvl-3',
        questionText: 'Why should date fields always be standardized into true Excel serial date formats (e.g. YYYY-MM-DD) before analysis?',
        options: [
          'So Excel can perform chronological sorting, time-based grouping in PivotTables, and day/month math correctly',
          'Because text dates cannot be viewed on mobile devices',
          'Excel will delete non-standard date columns upon saving',
          'To save RAM memory',
        ],
        correctOptionIndex: 0,
        explanation:
          'Excel stores true dates as serial numbers. Text dates (like "14.Feb.26") cannot be properly grouped into months, quarters, or years in PivotTables.',
      },
      {
        id: 'l3-exam-q8',
        quizId: 'exam-lvl-3',
        questionText: 'In Power Query, what is the role of the "Applied Steps" pane?',
        options: [
          'It records every transformation step in sequence so the entire cleaning recipe can be refreshed automatically on new files',
          'It deletes the original raw source file permanently',
          'It prevents users from viewing data rows',
          'It is a chat log with Microsoft support',
        ],
        correctOptionIndex: 0,
        explanation:
          'Applied Steps records a repeatable transformation pipeline. When next month\'s raw export arrives, clicking Refresh re-executes all steps in seconds.',
      },
      {
        id: 'l3-exam-q9',
        quizId: 'exam-lvl-3',
        questionText: 'Which function counts how many empty/missing cells exist in a dataset column from C2 to C500?',
        formulaContext: '=COUNTBLANK(C2:C500)',
        options: ['COUNTBLANK', 'COUNTZERO', 'ISBLANK', 'EMPTYCOUNT'],
        correctOptionIndex: 0,
        explanation:
          'COUNTBLANK returns the exact tally of blank or empty cells within a range, making it essential for initial data quality audits.',
      },
      {
        id: 'l3-exam-q10',
        quizId: 'exam-lvl-3',
        questionText: 'To prevent teammates from entering invalid regional codes into a column, which feature restricts user inputs to an authorized dropdown list?',
        options: ['Data Validation (List criteria)', 'Conditional Formatting', 'Protect Sheet with password', 'Track Changes'],
        correctOptionIndex: 0,
        explanation:
          'Data Validation allows you to enforce validation rules and provide a controlled dropdown list, eliminating typing errors at the source.',
      },
    ],
  },
  {
    levelNumber: 4,
    title: 'Level 4 Comprehensive Certification Exam',
    subtitle: 'Data Analysis, Aggregations & PivotTables',
    description:
      'Validate your analytical capability to frame commercial questions, construct PivotTables, calculate growth rates and variances, detect patterns with Conditional Formatting, and summarize findings.',
    passingScorePercent: 70,
    totalQuestions: 10,
    questions: [
      {
        id: 'l4-exam-q1',
        quizId: 'exam-lvl-4',
        questionText: 'What is the primary commercial purpose of a PivotTable in business analysis?',
        options: [
          'To aggregate, slice, and summarize large datasets rapidly without writing hundreds of individual formulas',
          'To format cells with decorative borders and fonts',
          'To spell-check customer records',
          'To export files to PDF format',
        ],
        correctOptionIndex: 0,
        explanation:
          'PivotTables are the core analytical engine in Excel for multidimensional summaries, comparisons, and aggregations across thousands of rows.',
      },
      {
        id: 'l4-exam-q2',
        quizId: 'exam-lvl-4',
        questionText: 'In a PivotTable Field List, where should you place the "Revenue" field to calculate total regional sales?',
        options: ['Values area', 'Rows area', 'Filters area', 'Columns area'],
        correctOptionIndex: 0,
        explanation:
          'Fields placed in the Values area are aggregated (summed, averaged, or counted) across the categories defined in Rows and Columns.',
      },
      {
        id: 'l4-exam-q3',
        quizId: 'exam-lvl-4',
        questionText: 'When your PivotTable summarizes a Date field, how can you group the individual transaction dates into Months, Quarters, and Years?',
        options: [
          'Right-click any date cell in the PivotTable and select "Group...", then choose Months and Quarters',
          'Manually re-type month names into adjacent cells',
          'Apply the SUM formula to the date column',
          'Change the Windows system clock',
        ],
        correctOptionIndex: 0,
        explanation:
          'Right-clicking a date cell in a PivotTable and selecting Group allows instant aggregation by Days, Months, Quarters, and Years.',
      },
      {
        id: 'l4-exam-q4',
        quizId: 'exam-lvl-4',
        questionText: 'What is the correct mathematical formula to calculate percentage change (growth rate) between prior month revenue (B2) and current month revenue (C2)?',
        formulaContext: '=(Current - Prior) / Prior',
        options: [
          '=(C2 - B2) / B2',
          '=C2 / B2 - 100',
          '=B2 - C2 / C2',
          '=AVERAGE(B2, C2)',
        ],
        correctOptionIndex: 0,
        explanation:
          'Percentage change is always calculated as (New - Old) / Old, which simplifies to (C2 - B2) / B2, formatted as a percentage.',
      },
      {
        id: 'l4-exam-q5',
        quizId: 'exam-lvl-4',
        questionText: 'If new transaction rows are added to the source data table, why doesn\'t the PivotTable update immediately?',
        options: [
          'PivotTables read from an internal cache for speed; you must click PivotTable Analyze > Refresh (or Alt + F5)',
          'PivotTables can only ever read data once permanently',
          'The source table must be converted to plain text',
          'You must restart your computer',
        ],
        correctOptionIndex: 0,
        explanation:
          'PivotTables utilize a high-performance PivotCache. Clicking Refresh updates the cache from the underlying source table.',
      },
      {
        id: 'l4-exam-q6',
        quizId: 'exam-lvl-4',
        questionText: 'In a PivotTable Value Field Settings, which option displays each category\'s sales as a percentage of the total company revenue?',
        options: [
          'Show Values As > % of Grand Total (or % of Column Total)',
          'Number Format > Scientific',
          'Summarize Values By > Product',
          'Sort A to Z',
        ],
        correctOptionIndex: 0,
        explanation:
          'Value Field Settings > Show Values As > % of Column Total or % of Grand Total instantly calculates proportional share without extra formulas.',
      },
      {
        id: 'l4-exam-q7',
        quizId: 'exam-lvl-4',
        questionText: 'Which Excel visual tool applies automatic color scales or icons (e.g. green for top 10%, red for below budget) based on cell values?',
        options: ['Conditional Formatting', 'Color Palette', 'Picture Styles', 'Format Painter'],
        correctOptionIndex: 0,
        explanation:
          'Conditional Formatting dynamically alters fill colors, borders, and icons based on defined logical criteria, highlighting outliers instantly.',
      },
      {
        id: 'l4-exam-q8',
        quizId: 'exam-lvl-4',
        questionText: 'What is the best chart type for comparing revenue performance across five different regional sales territories?',
        options: [
          'A clean Bar or Clustered Column Chart',
          'A 3D Exploded Pie Chart with 12 slices',
          'A Radar Chart',
          'A Stock High-Low-Close Chart',
        ],
        correctOptionIndex: 0,
        explanation:
          'Horizontal bar or vertical column charts are optimal for comparing discrete categories clearly along a shared baseline.',
      },
      {
        id: 'l4-exam-q9',
        quizId: 'exam-lvl-4',
        questionText: 'Which formula ranks the performance of a salesperson (revenue in C2) against the entire team\'s revenue list (C$2:C$20)?',
        formulaContext: '=RANK.EQ(C2, $C$2:$C$20)',
        options: ['=RANK.EQ(C2, $C$2:$C$20)', '=TOP(C2, C20)', '=SORT(C2:C20)', '=COUNT(C2:C20)'],
        correctOptionIndex: 0,
        explanation:
          'RANK.EQ evaluates a numeric value against an absolute reference list and returns its ordinal rank (1 for highest, 2 for second, etc.).',
      },
      {
        id: 'l4-exam-q10',
        quizId: 'exam-lvl-4',
        questionText: 'Before presenting findings from a dataset to executive management, why should an analyst perform a control total reconciliation check?',
        options: [
          'To verify that the grand total in your PivotTable matches the sum of the raw source table exactly, confirming no data was lost or double-counted',
          'Because Excel requires all numbers to be even',
          'To delete negative variance figures from view',
          'To convert currency from local to foreign',
        ],
        correctOptionIndex: 0,
        explanation:
          'Reconciling summary totals against raw control totals ensures joins, filters, or duplicate removals did not distort the integrity of the figures.',
      },
    ],
  },
  {
    levelNumber: 5,
    title: 'Level 5 Comprehensive Certification Exam',
    subtitle: 'Dashboards, Executive Reporting & Interactive Slicers',
    description:
      'Prove your ability to design executive KPI cards, align visual layouts, connect Slicers across multiple PivotTables via Report Connections, and deliver clean, decision-ready reports.',
    passingScorePercent: 70,
    totalQuestions: 10,
    questions: [
      {
        id: 'l5-exam-q1',
        quizId: 'exam-lvl-5',
        questionText: 'What is the primary function of an executive KPI card on a business dashboard?',
        options: [
          'To present headline metrics (e.g. ₦142.8M Revenue) with context (e.g. +8.5% vs. Target) in a prominent, glanceable format',
          'To show all 10,000 raw transaction rows on one screen',
          'To add colorful decorations to the worksheet',
          'To replace all charts on the dashboard',
        ],
        correctOptionIndex: 0,
        explanation:
          'Executive KPI cards distill complex data into bold headline figures accompanied by benchmarks (variance vs. budget or prior year) for rapid decision-making.',
      },
      {
        id: 'l5-exam-q2',
        quizId: 'exam-lvl-5',
        questionText: 'You insert a "Region" Slicer onto your dashboard. Which setting connects this single slicer to all three PivotTables on the worksheet?',
        options: [
          'Right-click Slicer > Report Connections (or Filter Connections) and check all target PivotTables',
          'Copy and paste the slicer 3 times',
          'Conditional Formatting > Manage Rules',
          'Page Layout > Print Area',
        ],
        correctOptionIndex: 0,
        explanation:
          'Report Connections links a Slicer to all PivotTables sharing the same data cache, allowing one filter click to update the entire dashboard simultaneously.',
      },
      {
        id: 'l5-exam-q3',
        quizId: 'exam-lvl-5',
        questionText: 'Why should gridlines typically be turned off (View > uncheck Gridlines) on a presentation dashboard sheet?',
        options: [
          'It eliminates visual clutter and creates a clean, application-like canvas for cards, charts, and slicers',
          'Gridlines cause Excel formulas to calculate 50% slower',
          'Excel does not allow slicers when gridlines are visible',
          'To prevent users from selecting cells',
        ],
        correctOptionIndex: 0,
        explanation:
          'Hiding gridlines removes spreadsheet clutter, transforming the worksheet into an elegant, professional dashboard presentation.',
      },
      {
        id: 'l5-exam-q4',
        quizId: 'exam-lvl-5',
        questionText: 'Which chart type is best suited for demonstrating 24 months of continuous commercial revenue trends?',
        options: [
          'A clean Line Chart with a consistent chronological date axis',
          'A 3D Exploded Pie Chart',
          'A Bubble Chart with 100 circles',
          'A Doughnut Chart',
        ],
        correctOptionIndex: 0,
        explanation:
          'Line charts depict continuous trends and seasonal patterns over time without misleading visual distortion.',
      },
      {
        id: 'l5-exam-q5',
        quizId: 'exam-lvl-5',
        questionText: 'How can you create a dynamic chart title in Excel that automatically updates when a user clicks a Region slicer?',
        formulaContext: '="Executive Sales Performance — " & Slicer_Selection_Cell',
        options: [
          'Write a text formula in a cell (e.g. ="Sales Overview — " & B1), select the Chart Title, type = in the formula bar, and click that cell',
          'Re-type the title manually every time you filter',
          'Insert an animated GIF file',
          'Chart titles cannot be connected to cell formulas',
        ],
        correctOptionIndex: 0,
        explanation:
          'Clicking a chart title and entering =Sheet1!A1 in the formula bar dynamically links the title text to the contents of that cell formula.',
      },
      {
        id: 'l5-exam-q6',
        quizId: 'exam-lvl-5',
        questionText: 'In professional dashboard architecture, why is it best practice to keep "Data", "Pivot_Engine", and "Dashboard" on separate worksheets?',
        options: [
          'It separates data storage, calculation logic, and presentation, keeping the report robust, auditable, and clean',
          'Excel limits workbooks to 1 table per sheet',
          'Formulas will not work if placed on the same sheet as data',
          'To prevent users from opening the file on Mac',
        ],
        correctOptionIndex: 0,
        explanation:
          'A 3-tier architecture (Raw Data -> Calculation Engine -> Visual Dashboard) protects source integrity and allows easy maintenance without breaking visual layouts.',
      },
      {
        id: 'l5-exam-q7',
        quizId: 'exam-lvl-5',
        questionText: 'What is the purpose of holding down the Alt key while resizing or moving chart containers and slicers in Excel?',
        options: [
          'It snaps the object edges cleanly to worksheet cell grid boundaries for perfect alignment',
          'It locks the chart with a password',
          'It rotates the chart 90 degrees',
          'It changes the color theme to dark mode',
        ],
        correctOptionIndex: 0,
        explanation:
          'Holding Alt while dragging or resizing snaps visual containers directly to worksheet column and row grid lines for pixel-perfect alignment.',
      },
      {
        id: 'l5-exam-q8',
        quizId: 'exam-lvl-5',
        questionText: 'Which formula dynamically formats a variance percentage with a visual directional arrow (▲ or ▼)?',
        formulaContext: '=IF(E2>=0, "▲ +" & TEXT(E2,"0.0%"), "▼ " & TEXT(E2,"0.0%"))',
        options: [
          '=IF(E2>=0, "▲ +" & TEXT(E2,"0.0%"), "▼ " & TEXT(E2,"0.0%"))',
          '=ARROW(E2)',
          '=VLOOKUP(E2, Arrows!A:B, 2)',
          '=SUM(E2, "▲")',
        ],
        correctOptionIndex: 0,
        explanation:
          'Using IF with TEXT formatting and Unicode arrows creates dynamic, professional KPI trend indicators directly in Excel cells.',
      },
      {
        id: 'l5-exam-q9',
        quizId: 'exam-lvl-5',
        questionText: 'Why should 3D chart effects, heavy shadows, and decorative backgrounds be avoided in executive business reporting?',
        options: [
          'They distort visual data proportions, reduce legibility, and distract decision-makers from key metrics',
          'Excel crashes when opening 3D charts',
          'Printer toner is too expensive for 3D graphics',
          'They only work in Microsoft PowerPoint',
        ],
        correctOptionIndex: 0,
        explanation:
          '3D angles distort perspective (making closer wedges or bars look deceptively larger), cluttering visual hierarchy without conveying information.',
      },
      {
        id: 'l5-exam-q10',
        quizId: 'exam-lvl-5',
        questionText: 'When distributing an Excel dashboard to non-technical managers, how can you protect background calculation formulas from accidental edits?',
        options: [
          'Lock calculation cells, unlock filter/slicer cells, and protect the worksheet via Review > Protect Sheet',
          'Hide the columns and never show them again',
          'Save the workbook as plain text',
          'Delete the underlying dataset',
        ],
        correctOptionIndex: 0,
        explanation:
          'Review > Protect Sheet prevents users from modifying formula cells while permitting interaction with Slicers and unlocked input cells.',
      },
    ],
  },
  {
    levelNumber: 6,
    title: 'Level 6 Capstone Data Analyst Master Exam',
    subtitle: 'End-to-End Business Analysis, Modeling & Synthesis',
    description:
      'The comprehensive capstone assessment synthesizing multi-table data modeling, lookup architecture, gross margin reconciliation, SLA metrics, and executive business recommendations.',
    passingScorePercent: 70,
    totalQuestions: 10,
    questions: [
      {
        id: 'l6-exam-q1',
        quizId: 'exam-lvl-6',
        questionText: 'When analyzing customer transaction lines across 12 months, how is Net Profit Margin percentage calculated for each record?',
        formulaContext: '=[@[Net_Profit]] / [@[Gross_Revenue]]',
        options: [
          '=(Gross_Revenue - Total_Cost) / Gross_Revenue',
          '=Gross_Revenue / Total_Cost',
          '=Total_Cost - Gross_Revenue',
          '=(Gross_Revenue + Total_Cost) / 2',
        ],
        correctOptionIndex: 0,
        explanation:
          'Net Profit Margin is calculated as Net Profit (Gross Revenue minus Total Costs) divided by Gross Revenue, formatted as a percentage.',
      },
      {
        id: 'l6-exam-q2',
        quizId: 'exam-lvl-6',
        questionText: 'In a warehouse inventory model, which formula outputs an urgent "REORDER NOW" flag when Closing_Stock drops to or below the Reorder_Threshold?',
        formulaContext: '=IF(E2<=F2, "REORDER NOW", "Optimal")',
        options: [
          '=IF(E2<=F2, "REORDER NOW", "Optimal")',
          '=COUNTIF(E2<=F2, "REORDER NOW")',
          '=XLOOKUP(E2, F2, "REORDER NOW")',
          '=IFERROR(E2-F2, "REORDER NOW")',
        ],
        correctOptionIndex: 0,
        explanation:
          'The logical test =IF(Closing_Stock <= Reorder_Level, "REORDER NOW", "Optimal") triggers supply chain alerts automatically.',
      },
      {
        id: 'l6-exam-q3',
        quizId: 'exam-lvl-6',
        questionText: 'In customer retention analysis, what is a "Cohort" and how is it defined in Excel?',
        options: [
          'A group of customers grouped by a common characteristic, such as the month or quarter of their very first purchase',
          'A formula that multiplies revenue by 100',
          'A list of deleted duplicate records',
          'An encrypted Excel password',
        ],
        correctOptionIndex: 0,
        explanation:
          'Cohorts segment users by their acquisition date (e.g. Jan 2026 Cohort), allowing analysts to track retention and repeat purchase behavior over time.',
      },
      {
        id: 'l6-exam-q4',
        quizId: 'exam-lvl-6',
        questionText: 'You are auditing customer support ticket operations. SLA Target is 4.0 hours. Which formula calculates whether a ticket was compliant or breached?',
        formulaContext: '=IF(D2<=4.0, "Met", "Breached")',
        options: [
          '=IF(D2<=4.0, "Met", "Breached")',
          '=SUM(D2, 4.0)',
          '=XLOOKUP(D2, 4.0, "Met")',
          '=COUNT(D2>4.0)',
        ],
        correctOptionIndex: 0,
        explanation:
          '=IF(Actual_Hours <= Target_Hours, "Met", "Breached") accurately evaluates ticket SLA compliance against operational benchmarks.',
      },
      {
        id: 'l6-exam-q5',
        quizId: 'exam-lvl-6',
        questionText: 'When building a departmental budget vs. actual model, how is Budget Variance defined?',
        formulaContext: '=Actual_Spend - Budgeted_Spend',
        options: [
          'Actual_Spend minus Budgeted_Spend (positive indicates over-budget; negative indicates cost savings)',
          'Budgeted_Spend multiplied by Actual_Spend',
          'Budgeted_Spend divided by 12 months',
          'Sum of all staff salaries',
        ],
        correctOptionIndex: 0,
        explanation:
          'Variance = Actual - Budget. For expense accounts, a positive variance signals an unfavorable over-budget spend requiring manager justification.',
      },
      {
        id: 'l6-exam-q6',
        quizId: 'exam-lvl-6',
        questionText: 'When connecting multi-region transaction files in Power Query, why should you use "Append Queries" rather than copying and pasting rows manually?',
        options: [
          'Append stacks tables vertically into a single consolidated dataset and re-runs automatically whenever new monthly regional files are placed in the folder',
          'Append restricts the dataset to 25 rows',
          'Append changes all numbers into Roman numerals',
          'Because Excel does not have a copy command',
        ],
        correctOptionIndex: 0,
        explanation:
          'Append Queries stacks identical structural tables automatically, building a repeatable multi-source ingestion pipeline.',
      },
      {
        id: 'l6-exam-q7',
        quizId: 'exam-lvl-6',
        questionText: 'In data modeling, what is the role of a Primary Key (e.g., Customer_ID or SKU_Code)?',
        options: [
          'A unique identifier that never repeats on the master table, ensuring exact 1-to-many lookups and relationships without ambiguity',
          'The font color of the header row',
          'The first cell in column A',
          'A password to open the file',
        ],
        correctOptionIndex: 0,
        explanation:
          'Primary Keys uniquely distinguish each entity (product, customer, invoice), allowing reliable relational joins and XLOOKUP queries.',
      },
      {
        id: 'l6-exam-q8',
        quizId: 'exam-lvl-6',
        questionText: 'When presenting findings to stakeholders, what distinguishes a great Data Analyst recommendation from raw chart descriptions?',
        options: [
          'A great recommendation connects the data findings directly to business impact (e.g., revenue gains, margin loss, operational risks) and suggests concrete actions',
          'Reading every single number on the table out loud',
          'Adding 10 different colors to every chart',
          'Hiding all negative metrics from the report',
        ],
        correctOptionIndex: 0,
        explanation:
          'Data analysts bridge technical data and business decisions. Effective recommendations cite metrics to propose actionable commercial interventions.',
      },
      {
        id: 'l6-exam-q9',
        quizId: 'exam-lvl-6',
        questionText: 'Why should financial and numerical tables always use tabular (monospaced) numerals and right-alignment?',
        options: [
          'Right-aligning numbers aligns decimal points and comma positions vertically, making numbers easy for human eyes to compare and audit at a glance',
          'It is a required setting by Microsoft Windows',
          'Left-aligned numbers will not sum correctly',
          'To prevent charts from rotating',
        ],
        correctOptionIndex: 0,
        explanation:
          'Right alignment aligns units, tens, hundreds, and decimal points vertically, enabling instant visual comparison and auditing of magnitude.',
      },
      {
        id: 'l6-exam-q10',
        quizId: 'exam-lvl-6',
        questionText: 'You completed your 6-Level Capstone Project. What key portfolio artifacts demonstrate your verified readiness for a professional Data Analyst role?',
        options: [
          'Clean, error-free multi-sheet Excel workbooks with structured data, dynamic formulas, PivotTable models, and an executive dashboard memo',
          'A screenshot of a blank spreadsheet',
          'A folder of corrupt CSV files',
          'A handwritten list of Excel ribbon tabs',
        ],
        correctOptionIndex: 0,
        explanation:
          'Employers evaluate realistic, auditable workbooks demonstrating data cleaning, relational lookups, dynamic modeling, and executive dashboard communication.',
      },
    ],
  },
];

export const LEVEL_EXAMS: EndOfLevelExam[] = RAW_LEVEL_EXAMS.map((exam) => ({
  ...exam,
  title: `Level ${exam.levelNumber} General Quiz & Certification Exam`,
  questions: exam.questions.map((q, qIdx) => {
    const len = q.options.length;
    const shift = (exam.levelNumber + qIdx) % len;
    if (shift === 0) return q;
    const rotatedOptions = q.options.map((_, i) => q.options[(i - shift + len) % len]);
    const newCorrectIdx = (q.correctOptionIndex + shift) % len;
    return {
      ...q,
      options: rotatedOptions,
      correctOptionIndex: newCorrectIdx,
    };
  }),
}));

