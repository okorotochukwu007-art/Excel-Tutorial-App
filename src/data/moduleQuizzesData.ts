import { Quiz, QuizQuestion } from '../types/academy';
import youtubeRecommendationsCache from './youtubeRecommendationsCache.json';

interface ModuleQuizSeed {
  q1: {
    questionText: string;
    formulaContext?: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  };
  q2: {
    questionText: string;
    formulaContext?: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  };
  q3: {
    questionText: string;
    formulaContext?: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  };
  labQ1?: {
    questionText: string;
    formulaContext?: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  };
  labQ2?: {
    questionText: string;
    formulaContext?: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  };
  labQ3?: {
    questionText: string;
    formulaContext?: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  };
}

const MODULE_QUIZ_BANK: Record<string, ModuleQuizSeed> = {
  // ================= LEVEL 1: EXCEL FOUNDATIONS =================
  'lvl-1-mod-1': {
    q1: {
      questionText: 'In the Excel interface, which bar directly above the column letters displays the underlying formula or raw content of the currently selected cell?',
      formulaContext: 'fx =SUM(B2:B10)',
      options: [
        'The Status Bar at the bottom of the window',
        'The Formula Bar (fx)',
        'The Quick Access Toolbar',
        'The Sheet Tab Bar',
      ],
      correctOptionIndex: 1,
      explanation: 'The Formula Bar (marked with fx) always shows the actual formula or underlying value stored inside the active cell.',
    },
    q2: {
      questionText: 'Where on the Excel screen can you immediately see the address of the currently selected cell (such as A1 or D14)?',
      options: [
        'In the Name Box on the far left of the Formula Bar',
        'Inside the Page Layout tab',
        'In the Zoom slider at the bottom right',
        'In the File > Info menu',
      ],
      correctOptionIndex: 0,
      explanation: 'The Name Box sits to the left of the Formula Bar and displays the active cell coordinate or named range.',
    },
    q3: {
      questionText: 'How is the Excel Ribbon organized to help you find commands quickly?',
      options: [
        'Alphabetically in a single dropdown list',
        'Into task-oriented Tabs (Home, Insert, Data, Formulas) and logical command Groups',
        'Only through right-click menus',
        'By file size and creation date',
      ],
      correctOptionIndex: 1,
      explanation: 'The Excel Ribbon groups related tools into top-level Tabs (Home, Insert, Data, etc.) subdivided into labeled Groups (Font, Alignment, Number).',
    },
  },
  'lvl-1-mod-2': {
    q1: {
      questionText: 'In an Excel worksheet, how are columns and rows labeled?',
      options: [
        'Columns use numbers (1, 2, 3) and rows use letters (A, B, C)',
        'Columns use letters (A, B, C...) and rows use numbers (1, 2, 3...)',
        'Both columns and rows use Roman numerals',
        'Columns and rows are only labeled after you create a table',
      ],
      correctOptionIndex: 1,
      explanation: 'Vertical columns are identified by letters (A, B, C...) while horizontal rows are numbered sequentially (1, 2, 3...).',
    },
    q2: {
      questionText: 'What is the difference between an Excel Workbook and a Worksheet?',
      options: [
        'They are two names for the exact same single grid',
        'A Workbook is the entire Excel file (.xlsx) that can hold multiple Worksheet tabs inside it',
        'A Worksheet holds multiple Workbooks inside a folder',
        'Workbooks only store charts while Worksheets only store text',
      ],
      correctOptionIndex: 1,
      explanation: 'An Excel Workbook is the file itself, which contains one or more individual Worksheet tabs (grids of rows and columns) at the bottom.',
    },
    q3: {
      questionText: 'What does the cell range notation C3:E10 represent?',
      formulaContext: 'C3:E10',
      options: [
        'Only cell C3 and cell E10',
        'Every cell in the rectangular block starting at C3 (top-left) through E10 (bottom-right)',
        'Column C divided by Column E',
        'Row 3 subtracted from Row 10',
      ],
      correctOptionIndex: 1,
      explanation: 'The colon (:) defines a contiguous rectangular range of cells from the top-left corner (C3) to the bottom-right corner (E10).',
    },
  },
  'lvl-1-mod-3': {
    q1: {
      questionText: 'When you want to edit a small typo inside an existing cell without erasing the entire cell entry, which shortcut key puts the cursor directly inside the cell?',
      options: ['Press Esc', 'Press F2 (or double-click the cell)', 'Press Delete', 'Press Ctrl + N'],
      correctOptionIndex: 1,
      explanation: 'Pressing F2 (or double-clicking the cell) enters Edit Mode at the end of the current cell content instead of overwriting it.',
    },
    q2: {
      questionText: 'You started typing a change into a cell by mistake and want to cancel your edit and restore what was in the cell before. Which key should you press before hitting Enter?',
      options: ['Spacebar', 'Tab', 'Esc (Escape)', 'Backspace'],
      correctOptionIndex: 2,
      explanation: 'Pressing Esc cancels the in-progress cell edit and restores the previous value untouched.',
    },
    q3: {
      questionText: 'How does Excel\'s Fill Handle (the small square in the bottom-right corner of a selected cell) behave when you drag a cell containing "January" down several rows?',
      options: [
        'It deletes the word January',
        'It automatically fills the series (February, March, April...)',
        'It converts the text into #VALUE! errors',
        'It opens the Print dialog',
      ],
      correctOptionIndex: 1,
      explanation: 'Excel\'s AutoFill recognizes built-in date/month/day patterns and automatically extends the sequence across the dragged cells.',
    },
  },
  'lvl-1-mod-4': {
    q1: {
      questionText: 'Why should you format numbers as Currency using the Ribbon rather than typing the currency symbol and commas manually by hand?',
      options: [
        'Typing symbols manually makes the font too large',
        'Number formatting changes the visual appearance while keeping the underlying value numeric so formulas can calculate it',
        'Excel blocks users from typing commas on a keyboard',
        'Manual currency symbols delete adjacent columns',
      ],
      correctOptionIndex: 1,
      explanation: 'Applying Number/Currency formatting preserves the pure number in memory so SUM, AVERAGE, and math operators continue working.',
    },
    q2: {
      questionText: 'After applying Currency formatting to a column of numbers, several cells display "######". How do you fix this?',
      options: [
        'Rewrite all the formulas from scratch',
        'Widen the column by dragging or double-clicking the right border of the column header',
        'Delete the currency values',
        'Restart Microsoft Excel',
      ],
      correctOptionIndex: 1,
      explanation: 'The "######" symbols simply mean the column is currently too narrow to show the formatted number; widening the column reveals the full value.',
    },
    q3: {
      questionText: 'Which tool copies the exact font, fill color, borders, and number formatting from one cell and paints it onto another range of cells?',
      options: ['AutoSum', 'Format Painter (the paintbrush icon on the Home tab)', 'Wrap Text', 'Find & Replace'],
      correctOptionIndex: 1,
      explanation: 'Format Painter duplicates all visual styling and number formatting from a sample cell onto any target cells you click.',
    },
  },
  'lvl-1-mod-5': {
    q1: {
      questionText: 'Which character MUST you type first in an Excel cell so Excel knows you are performing a calculation?',
      formulaContext: '=B2*C2',
      options: ['The hash sign (#)', 'The equals sign (=)', 'The asterisk (*)', 'The dollar sign ($)'],
      correctOptionIndex: 1,
      explanation: 'Every Excel formula or calculation starts with an equals sign (=). Without it, Excel treats the entry as plain text.',
    },
    q2: {
      questionText: 'Which symbols does Excel use for multiplication and division in formulas?',
      formulaContext: '=A2*B2/C2',
      options: [
        'x for multiplication and ÷ for division',
        '* (asterisk) for multiplication and / (forward slash) for division',
        '^ for multiplication and % for division',
        '& for multiplication and : for division',
      ],
      correctOptionIndex: 1,
      explanation: 'In Excel formulas, the asterisk (*) represents multiplication and the forward slash (/) represents division.',
    },
    q3: {
      questionText: 'What result will Excel return for the formula =10 + 5 * 2, and why?',
      formulaContext: '=10 + 5 * 2',
      options: [
        '30, because Excel calculates strictly from left to right',
        '20, because Excel follows order of operations (multiplication before addition)',
        '17, because Excel ignores the asterisk',
        '#ERROR!, because parentheses are required in every formula',
      ],
      correctOptionIndex: 1,
      explanation: 'Following BODMAS/PEMDAS order of operations, Excel evaluates 5 * 2 = 10 first, then adds 10 to produce 20.',
    },
  },
  'lvl-1-mod-6': {
    q1: {
      questionText: 'Why is writing =B2+C2 much better than typing =450+120 directly using hardcoded numbers?',
      formulaContext: '=B2+C2',
      options: [
        'Cell references automatically recalculate the total whenever the numbers in B2 or C2 change',
        'Excel does not allow numbers inside formulas',
        'Hardcoded numbers cannot be formatted as currency',
        'Cell references use less disk space',
      ],
      correctOptionIndex: 0,
      explanation: 'Referencing cells (B2, C2) makes your spreadsheet dynamic: updating an input cell updates all dependent totals automatically.',
    },
    q2: {
      questionText: 'When you copy the relative formula =D2-E2 from cell F2 down into cell F3, what formula does Excel automatically place in cell F3?',
      formulaContext: '=D2-E2  ->  =D3-E3',
      options: ['=D2-E2', '=D3-E3', '=E2-F2', '=SUM(D2:E3)'],
      correctOptionIndex: 1,
      explanation: 'By default, cell references are relative—moving down one row automatically increments the row numbers from 2 to 3.',
    },
    q3: {
      questionText: 'Which keyboard shortcut automatically inserts the =SUM() function for a column of numbers directly above the active cell?',
      formulaContext: '=SUM(D2:D15)',
      options: ['Alt + = (or Cmd + Shift + T on Mac)', 'Ctrl + F', 'Alt + F4', 'Ctrl + Z'],
      correctOptionIndex: 0,
      explanation: 'Alt + = triggers AutoSum, automatically wrapping the contiguous numeric range above or to the left inside =SUM().',
    },
  },
  'lvl-1-mod-7': {
    q1: {
      questionText: 'You want to view only rows where the Region column equals "Lagos" without deleting the other rows. Which Excel feature should you use?',
      options: ['Delete Rows', 'Filter (Data > Filter / Ctrl + Shift + L)', 'Merge & Center', 'Find & Replace'],
      correctOptionIndex: 1,
      explanation: 'Filtering temporarily hides rows that do not match your criteria while keeping all underlying records safe.',
    },
    q2: {
      questionText: 'Why should you select a single cell inside your data table (or the entire table) rather than highlighting only ONE column before clicking Sort?',
      options: [
        'Sorting a single isolated column scrambles that column separately from the rest of each row\'s record',
        'Excel cannot sort text columns',
        'Sorting requires at least 1,000 rows',
        'Highlighting one column deletes the headers',
      ],
      correctOptionIndex: 0,
      explanation: 'Clicking a single cell inside the contiguous table lets Excel sort whole rows together so customer names stay matched with their amounts.',
    },
    q3: {
      questionText: 'To arrange a list of invoices so the most recent dates appear at the top of the table, which Sort option should you select on the Date column?',
      options: ['Sort Oldest to Newest', 'Sort Newest to Oldest', 'Sort A to Z by Customer', 'Clear Filter'],
      correctOptionIndex: 1,
      explanation: 'Sort Newest to Oldest orders chronological dates in descending order, placing the latest transactions first.',
    },
  },
  'lvl-1-mod-8': {
    q1: {
      questionText: 'Which file extension is the modern standard Excel Workbook format that preserves multiple sheets, live formulas, charts, and formatting?',
      options: ['.csv', '.xlsx', '.txt', '.pdf'],
      correctOptionIndex: 1,
      explanation: '.xlsx is the standard XML-based Excel Workbook format supporting multiple worksheets, formulas, formatting, and charts.',
    },
    q2: {
      questionText: 'What happens if you save a multi-sheet workbook containing live formulas and colors as a plain .CSV (Comma Separated Values) file?',
      options: [
        'All sheets and colors are preserved with smaller file size',
        'Only the active worksheet\'s raw text/values are saved; formulas, formatting, and extra sheets are stripped out',
        'The file becomes password-protected automatically',
        'Excel converts every number into a chart',
      ],
      correctOptionIndex: 1,
      explanation: 'CSV files are flat plain-text files that store only raw values separated by commas from a single sheet, losing formulas and formatting.',
    },
    q3: {
      questionText: 'When scrolling down a long 500-row table, how do you keep Row 1 (your column headers) permanently visible at the top of the screen?',
      options: [
        'View tab > Freeze Panes > Freeze Top Row',
        'Home tab > Merge & Center',
        'Data tab > Group',
        'File > Print Titles',
      ],
      correctOptionIndex: 0,
      explanation: 'Freeze Top Row locks row 1 in place so your column headers stay visible as you scroll down through hundreds of rows.',
    },
  },

  // ================= LEVEL 2: EXCEL FORMULAS AND FUNCTIONS =================
  'lvl-2-mod-1': {
    q1: {
      questionText: 'In the formula =B2*$E$1, what do the dollar signs ($) around E1 accomplish when you drag the formula down to row 50?',
      formulaContext: '=B2*$E$1',
      options: [
        'They format the output in US Dollars',
        'They lock both Column E and Row 1 (absolute reference) so every row continues multiplying by cell E1',
        'They hide the formula from other users',
        'They round the result to 2 decimal places',
      ],
      correctOptionIndex: 1,
      explanation: '$E$1 is an absolute cell reference: neither the column letter E nor the row number 1 shifts when copied down or across.',
    },
    q2: {
      questionText: 'While typing a cell reference in a formula, which key can you press to cycle through $A$1, A$1, $A1, and A1?',
      options: ['F2', 'F4 (or Cmd + T on Mac)', 'F9', 'Alt + Enter'],
      correctOptionIndex: 1,
      explanation: 'Pressing F4 while the cursor is on a cell reference cycles through absolute, mixed row, mixed column, and relative reference types.',
    },
    q3: {
      questionText: 'In the mixed reference $B4, which part is locked and which part is free to change when copied?',
      formulaContext: '=$B4*C$1',
      options: [
        'Column B is locked ($B), while Row 4 adjusts relatively when copied down',
        'Row 4 is locked, while Column B adjusts when copied right',
        'Both Column B and Row 4 are locked',
        'Neither is locked',
      ],
      correctOptionIndex: 0,
      explanation: 'The dollar sign sits immediately before the part it locks: in $B4, Column B is locked and Row 4 is relative.',
    },
  },
  'lvl-2-mod-2': {
    q1: {
      questionText: 'You want to find the arithmetic mean (average sales value) across cells D2 through D40. Which formula is correct?',
      formulaContext: '=AVERAGE(D2:D40)',
      options: ['=MEAN(D2:D40)', '=AVERAGE(D2:D40)', '=AVG(D2:D40)', '=SUM(D2:D40)/2'],
      correctOptionIndex: 1,
      explanation: 'Excel uses the full word =AVERAGE(range) to compute the arithmetic mean of numeric cells.',
    },
    q2: {
      questionText: 'Which pair of functions returns the lowest and highest numeric values in a range of invoice amounts?',
      formulaContext: '=MIN(E2:E100) / =MAX(E2:E100)',
      options: ['=LOW() and =HIGH()', '=SMALLEST() and =LARGEST()', '=MIN() and =MAX()', '=BOTTOM() and =TOP()'],
      correctOptionIndex: 2,
      explanation: 'MIN returns the smallest numeric value in a range, and MAX returns the largest numeric value.',
    },
    q3: {
      questionText: 'How does =AVERAGE(B2:B10) treat a completely blank (empty) cell versus a cell containing the number 0?',
      options: [
        'It treats both blank cells and zeros identically',
        'Blank cells are ignored in the average calculation, whereas a cell containing 0 is included and lowers the average',
        'A blank cell causes a #DIV/0! error',
        'Zeros are ignored while blank cells count as 100',
      ],
      correctOptionIndex: 1,
      explanation: 'AVERAGE ignores empty cells and text, but includes 0 as a valid numeric data point.',
    },
  },
  'lvl-2-mod-3': {
    q1: {
      questionText: 'A column contains alphanumeric Order IDs like "INV-101", "INV-102", etc. Why does =COUNT(A2:A50) return 0, and which function should you use instead?',
      formulaContext: '=COUNTA(A2:A50)',
      options: [
        'COUNT only counts cells containing numbers; use COUNTA to count all non-empty cells including text',
        'COUNT only works on Row 1; use SUM instead',
        'Order IDs must be formatted as dates first',
        'COUNT requires dollar signs around the range',
      ],
      correctOptionIndex: 0,
      explanation: 'COUNT tallies purely numeric values (and dates), whereas COUNTA tallies all non-blank cells regardless of whether they hold text or numbers.',
    },
    q2: {
      questionText: 'Which formula counts how many orders in B2:B100 were placed in the "Abuja" region?',
      formulaContext: '=COUNTIF(B2:B100, "Abuja")',
      options: [
        '=COUNT(B2:B100, "Abuja")',
        '=COUNTIF(B2:B100, "Abuja")',
        '=SUMIF(B2:B100, "Abuja")',
        '=IF(B2:B100="Abuja", 1, 0)',
      ],
      correctOptionIndex: 1,
      explanation: 'COUNTIF(range, criteria) counts the number of cells within a range that match the specified condition.',
    },
    q3: {
      questionText: 'How do you count rows where Region (B2:B100) is "Lagos" AND Order Value (E2:E100) is greater than 500,000?',
      formulaContext: '=COUNTIFS(B2:B100, "Lagos", E2:E100, ">500000")',
      options: [
        '=COUNTIF(B2:B100, "Lagos", E2:E100, >500000)',
        '=COUNTIFS(B2:B100, "Lagos", E2:E100, ">500000")',
        '=COUNTA(B2:B100, E2:E100)',
        '=SUMIFS(B2:B100, "Lagos")',
      ],
      correctOptionIndex: 1,
      explanation: 'COUNTIFS accepts multiple (criteria_range, criteria) pairs, and comparison operators like ">500000" are enclosed in quotes.',
    },
  },
  'lvl-2-mod-4': {
    q1: {
      questionText: 'What are the three arguments of the standard Excel IF function in order?',
      formulaContext: '=IF(logical_test, value_if_true, value_if_false)',
      options: [
        'range, criteria, sum_range',
        'logical_test, value_if_true, value_if_false',
        'lookup_value, lookup_array, return_array',
        'value_if_true, logical_test, value_if_false',
      ],
      correctOptionIndex: 1,
      explanation: 'IF first evaluates the logical_test; if TRUE it returns the second argument, and if FALSE it returns the third argument.',
    },
    q2: {
      questionText: 'You want to award a bonus only if Sales (D2) >= 1,000,000 AND Attendance (E2) >= 95%. Which formula properly checks that BOTH conditions are true?',
      formulaContext: '=IF(AND(D2>=1000000, E2>=0.95), "Bonus", "No Bonus")',
      options: [
        '=IF(OR(D2>=1000000, E2>=0.95), "Bonus", "No Bonus")',
        '=IF(AND(D2>=1000000, E2>=0.95), "Bonus", "No Bonus")',
        '=AND(IF(D2>=1000000), "Bonus")',
        '=IF(D2>=1000000 & E2>=0.95, "Bonus", "No Bonus")',
      ],
      correctOptionIndex: 1,
      explanation: 'Wrapping conditions inside AND(...) returns TRUE only when every condition inside it is satisfied.',
    },
    q3: {
      questionText: 'When returning a text label like "Approved" inside an IF formula, why must you put double quotes around "Approved"?',
      options: [
        'Without double quotes, Excel mistakes the word for a function or named range and returns a #NAME? error',
        'Quotes make the text bold in the cell',
        'Quotes convert the text into a currency number',
        'Quotes are optional in Excel formulas',
      ],
      correctOptionIndex: 0,
      explanation: 'Literal text strings inside Excel formulas must be enclosed in double quotes ("Approved"), otherwise Excel searches for a named object and throws #NAME?.',
    },
  },
  'lvl-2-mod-5': {
    q1: {
      questionText: 'What is the most important difference in argument order between SUMIF and SUMIFS?',
      formulaContext: '=SUMIFS(sum_range, criteria_range1, criteria1, ...)',
      options: [
        'There is no difference in argument order',
        'In SUMIFS, the sum_range comes FIRST; in SUMIF, the sum_range comes LAST',
        'SUMIFS cannot sum numbers, only text',
        'SUMIF accepts up to 10 conditions while SUMIFS accepts only 1',
      ],
      correctOptionIndex: 1,
      explanation: 'SUMIFS puts sum_range as the very first argument so you can append as many (criteria_range, criteria) pairs after it as needed.',
    },
    q2: {
      questionText: 'Which formula sums Revenue (E2:E200) for transactions where Region (B2:B200) is "Kano" and Category (C2:C200) is "Hardware"?',
      formulaContext: '=SUMIFS(E2:E200, B2:B200, "Kano", C2:C200, "Hardware")',
      options: [
        '=SUMIFS(B2:B200, "Kano", C2:C200, "Hardware", E2:E200)',
        '=SUMIFS(E2:E200, B2:B200, "Kano", C2:C200, "Hardware")',
        '=SUMIF(E2:E200, B2:B200="Kano", C2:C200="Hardware")',
        '=COUNTIFS(E2:E200, B2:B200, "Kano")',
      ],
      correctOptionIndex: 1,
      explanation: 'In SUMIFS, E2:E200 (the numeric column to sum) is placed first, followed by B2:B200,"Kano" and C2:C200,"Hardware".',
    },
    q3: {
      questionText: 'What happens in SUMIFS if your sum_range is E2:E200 but your criteria_range1 is accidentally typed as B2:B150 (different row lengths)?',
      options: [
        'Excel automatically fixes the range length',
        'Excel returns a #VALUE! error because all ranges in SUMIFS must have the exact same dimensions',
        'Excel sums only the first 50 rows',
        'Excel deletes rows 151 to 200',
      ],
      correctOptionIndex: 1,
      explanation: 'Every range passed to SUMIFS/COUNTIFS must span the exact same number of rows; mismatched range sizes trigger #VALUE!.',
    },
  },
  'lvl-2-mod-6': {
    q1: {
      questionText: 'In =XLOOKUP(A2, Products!A:A, Products!C:C, "Not Found"), what do the first three arguments represent?',
      formulaContext: '=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])',
      options: [
        'return_array, lookup_array, lookup_value',
        'lookup_value (what to find), lookup_array (where to search), return_array (what column to bring back)',
        'table_array, col_index_num, range_lookup',
        'row_num, column_num, sheet_name',
      ],
      correctOptionIndex: 1,
      explanation: 'XLOOKUP takes the lookup_value first, searches for it in lookup_array, and returns the corresponding item from return_array.',
    },
    q2: {
      questionText: 'Why is XLOOKUP safer and more flexible than VLOOKUP when someone inserts a new column inside the source table?',
      options: [
        'XLOOKUP references the return column directly instead of relying on a hardcoded column index number like 3 or 4',
        'XLOOKUP locks the worksheet from edits',
        'VLOOKUP only works on Mac computers',
        'XLOOKUP automatically deletes newly inserted columns',
      ],
      correctOptionIndex: 0,
      explanation: 'Because XLOOKUP points directly to the return_array range, inserting or moving columns doesn\'t break a fragile col_index_num.',
    },
    q3: {
      questionText: 'What is the default match mode of XLOOKUP if you omit the 5th argument?',
      options: [
        'Approximate match (requires sorted data)',
        'Exact match (0) — it only returns a result when an exact match is found',
        'Wildcard partial match',
        'Random match',
      ],
      correctOptionIndex: 1,
      explanation: 'Unlike VLOOKUP (which defaulted to approximate match), XLOOKUP defaults to Exact Match automatically.',
    },
  },
  'lvl-2-mod-7': {
    q1: {
      questionText: 'Cell A2 contains "  adebayo, tunde  ". Which nested formula removes extra spaces AND capitalizes the name properly as "Adebayo, Tunde"?',
      formulaContext: '=PROPER(TRIM(A2))',
      options: ['=UPPER(CLEAN(A2))', '=PROPER(TRIM(A2))', '=LEFT(A2, 5)', '=LEN(TRIM(A2))'],
      correctOptionIndex: 1,
      explanation: 'TRIM strips leading/trailing/multiple spaces, and PROPER capitalizes the first letter of each word.',
    },
    q2: {
      questionText: 'You have First Name in A2 ("Chinedu") and Last Name in B2 ("Okafor"). Which formula combines them into "Chinedu Okafor" with a space in between?',
      formulaContext: '=A2 & " " & B2',
      options: ['=A2 + B2', '=A2 & " " & B2', '=A2 & B2', '=SUM(A2, B2)'],
      correctOptionIndex: 1,
      explanation: 'The ampersand (&) joins text strings together; including " " inserts a space between the first and last name.',
    },
    q3: {
      questionText: 'For an invoice code like "LOS-2026-9941" in cell A2, what does =LEFT(A2, 3) return?',
      formulaContext: '=LEFT(A2, 3)',
      options: ['"9941"', '"LOS"', '"2026"', '3'],
      correctOptionIndex: 1,
      explanation: 'LEFT(text, num_chars) extracts the specified number of characters starting from the far left of the string ("LOS").',
    },
  },
  'lvl-2-mod-8': {
    q1: {
      questionText: 'How does Excel store dates internally so that you can subtract one date from another to find the number of days between them?',
      options: [
        'As plain English text strings',
        'As sequential serial numbers (where 1 = Jan 1, 1900, and each day adds 1)',
        'As hexadecimal color codes',
        'Excel cannot subtract dates without a macro',
      ],
      correctOptionIndex: 1,
      explanation: 'Excel stores dates as sequential integer serial numbers, allowing direct date subtraction (e.g., =Delivery_Date - Order_Date).',
    },
    q2: {
      questionText: 'Which function returns the date of the very last day of a month, a given number of months in the future or past (useful for invoice due dates)?',
      formulaContext: '=EOMONTH(A2, 1)',
      options: ['=ENDMONTH(A2)', '=EOMONTH(A2, 1)', '=LASTDAY(A2)', '=MONTHEND(A2)'],
      correctOptionIndex: 1,
      explanation: 'EOMONTH(start_date, months) returns the serial date for the last day of the month N months away (use 0 for the current month\'s end).',
    },
    q3: {
      questionText: 'If cell B2 contains the date 2026-10-25, what do =YEAR(B2) and =MONTH(B2) return?',
      formulaContext: '=YEAR(B2) / =MONTH(B2)',
      options: [
        '2026 and "October"',
        '2026 and 10',
        '25 and 10',
        '#VALUE! error',
      ],
      correctOptionIndex: 1,
      explanation: 'YEAR extracts the 4-digit year (2026) and MONTH extracts the numeric month from 1 to 12 (10).',
    },
  },
  'lvl-2-mod-9': {
    q1: {
      questionText: 'When calculating Unit Price as =Revenue/Units (=E2/D2), rows where Units is 0 show #DIV/0!. How do you wrap this formula so it displays 0 instead of an error?',
      formulaContext: '=IFERROR(E2/D2, 0)',
      options: [
        '=ERROR.IF(E2/D2, 0)',
        '=IFERROR(E2/D2, 0)',
        '=ISERROR(E2/D2, 0)',
        '=IF(E2/D2="#DIV/0!", 0)',
      ],
      correctOptionIndex: 1,
      explanation: 'IFERROR(value, value_if_error) returns the normal calculation result unless an error occurs, in which case it returns the fallback value.',
    },
    q2: {
      questionText: 'Why do #DIV/0! or #N/A errors inside a column cause a problem for your summary row at the bottom of the sheet?',
      options: [
        'Because standard aggregation functions like =SUM(E2:E100) will also fail and return the error if any cell in the range contains an error',
        'Errors automatically delete the worksheet',
        'Errors prevent the file from being saved',
        'Errors turn the computer screen black',
      ],
      correctOptionIndex: 0,
      explanation: 'A single unhandled error in a range cascades into =SUM() and =AVERAGE(), breaking grand totals until handled with IFERROR or if_not_found.',
    },
    q3: {
      questionText: 'When using XLOOKUP, why is it often better to use XLOOKUP\'s built-in 4th argument (if_not_found) rather than wrapping the whole formula in IFERROR?',
      formulaContext: '=XLOOKUP(A2, SKUs!A:A, SKUs!B:B, "Missing SKU")',
      options: [
        'if_not_found catches only missing lookup matches while still alerting you if you made a genuine typo (#NAME?) in the formula',
        'IFERROR is not supported in Excel',
        'if_not_found makes the font color green',
        'There is no 4th argument in XLOOKUP',
      ],
      correctOptionIndex: 0,
      explanation: 'XLOOKUP\'s if_not_found handles missing records cleanly without masking structural formula mistakes.',
    },
  },
  'lvl-2-mod-10': {
    q1: {
      questionText: 'What causes Excel to display a #NAME? error in a cell?',
      options: [
        'Dividing a number by zero',
        'Misspelling a function name (e.g., =VLOKUP or =SUMM) or forgetting quotes around a text string',
        'The column width is too narrow',
        'A lookup value was not found in the table',
      ],
      correctOptionIndex: 1,
      explanation: '#NAME? means Excel does not recognize an identifier in your formula—usually a misspelled function name or unquoted text.',
    },
    q2: {
      questionText: 'Which tool on the Formulas tab lets you highlight a cell and visually draw arrows pointing to every cell that feeds into its calculation?',
      options: [
        'Trace Precedents (Formulas > Formula Auditing)',
        'Goal Seek',
        'Data Validation',
        'Consolidate',
      ],
      correctOptionIndex: 0,
      explanation: 'Trace Precedents draws blue arrows from all input cells referenced by the active formula so you can visually audit its inputs.',
    },
    q3: {
      questionText: 'Which keyboard shortcut toggles the entire worksheet to display all underlying formulas in the cells instead of their calculated results?',
      options: [
        'Ctrl + ` (Grave accent / tilde key above Tab)',
        'Ctrl + B',
        'Alt + F1',
        'Ctrl + Shift + L',
      ],
      correctOptionIndex: 0,
      explanation: 'Pressing Ctrl + ` (backtick) switches between normal value view and Formula Auditing view across all cells at once.',
    },
  },

  // ================= LEVEL 3: DATA CLEANING AND PREPARATION =================
  'lvl-3-mod-1': {
    q1: {
      questionText: 'In a properly structured raw business dataset (flat table) ready for Excel analysis, what should each Row and each Column represent?',
      options: [
        'Each Row is a summary total and each Column is a month name',
        'Each Row represents one complete transaction/record, and each Column represents a single distinct attribute/field',
        'Rows and columns can mix headers, blank rows, and side-by-side mini-tables freely',
        'Every row should contain merged cells for visual styling',
      ],
      correctOptionIndex: 1,
      explanation: 'Tabular data requires one record per row and one variable/attribute per column, with no blank separator rows or merged cells.',
    },
    q2: {
      questionText: 'Why should an analyst ALWAYS keep an untouched "Raw_Data" backup worksheet before cleaning or transforming data?',
      options: [
        'So you always have an audit trail and can verify or recover original values if a cleaning step removes needed records',
        'Because Excel requires at least two sheets to save a file',
        'Because formulas only work on the second sheet',
        'To double the file size',
      ],
      correctOptionIndex: 0,
      explanation: 'Preserving the raw import tab guarantees reproducibility and lets you reconcile cleaned control totals against the original source.',
    },
    q3: {
      questionText: 'Why are Merged Cells inside a dataset header or data column problematic for data cleaning and analysis?',
      options: [
        'Merged cells block proper sorting, filtering, column selection, and PivotTable creation',
        'Merged cells change the font family',
        'Merged cells cannot be printed',
        'Merged cells convert numbers to negative values',
      ],
      correctOptionIndex: 0,
      explanation: 'Merged cells break column continuity, preventing Excel Sort, Filter, Tables, and PivotTables from functioning properly.',
    },
  },
  'lvl-3-mod-2': {
    q1: {
      questionText: 'Which formula quickly counts how many missing (empty) cells exist in the Customer_Email column (D2:D800)?',
      formulaContext: '=COUNTBLANK(D2:D800)',
      options: ['=COUNT(D2:D800)', '=COUNTBLANK(D2:D800)', '=ISBLANK(D2:D800)', '=COUNTA(D2:D800)'],
      correctOptionIndex: 1,
      explanation: 'COUNTBLANK(range) returns the exact count of empty cells in a range so you can quantify missing data immediately.',
    },
    q2: {
      questionText: 'How can you select all blank cells within a range at once to highlight or fill them with "N/A"?',
      options: [
        'Home > Find & Select > Go To Special (or Ctrl + G > Special) > select Blanks',
        'Press Ctrl + Z repeatedly',
        'Data > Text to Columns',
        'View > Freeze Panes',
      ],
      correctOptionIndex: 0,
      explanation: 'Go To Special > Blanks highlights every empty cell in the selected range simultaneously.',
    },
    q3: {
      questionText: 'You notice the Region column contains "Lagos", "LAGOS ", and "Los". How does an quick Filter dropdown inspection help spot these inconsistencies?',
      options: [
        'The Filter dropdown lists every unique distinct value in the column alphabetically so spelling variations and inconsistent codes stand out immediately',
        'Filter automatically rewrites "Los" to "Lagos"',
        'Filter deletes all rows with lowercase letters',
        'Filter converts text to numbers',
      ],
      correctOptionIndex: 0,
      explanation: 'Opening a column\'s Filter dropdown shows the distinct values list, making typos and inconsistent naming visible at a glance.',
    },
  },
  'lvl-3-mod-3': {
    q1: {
      questionText: 'Where is Excel\'s built-in tool for stripping identical duplicate rows located on the Ribbon?',
      options: [
        'Home tab > Styles group',
        'Data tab > Data Tools group > Remove Duplicates',
        'Formulas tab > Function Library',
        'Insert tab > Tables',
      ],
      correctOptionIndex: 1,
      explanation: 'Data > Remove Duplicates permanently deletes duplicate rows based on the columns you check in the dialog.',
    },
    q2: {
      questionText: 'If you want to remove only rows where the Invoice_ID (Column A) is duplicated—even if a timestamp column differs—how should you configure the Remove Duplicates dialog?',
      options: [
        'Check ONLY the Invoice_ID column in the Remove Duplicates dialog',
        'Uncheck all columns',
        'Sort by amount and delete the bottom half of the sheet',
        'Use Merge & Center on Column A',
      ],
      correctOptionIndex: 0,
      explanation: 'Checking only the unique identifier column (Invoice_ID) tells Excel to treat any second occurrence of that Invoice_ID as a duplicate.',
    },
    q3: {
      questionText: 'Why will Excel\'s Remove Duplicates tool fail to catch two rows as duplicates if one cell has "INV-101" and the other has "INV-101 " (with a trailing space)?',
      options: [
        'Because the trailing space makes the two text strings different characters until you clean them with TRIM first',
        'Remove Duplicates only works on numbers',
        'Remove Duplicates ignores the first 10 rows',
        'Trailing spaces delete the row automatically',
      ],
      correctOptionIndex: 0,
      explanation: 'Always clean extra spaces with TRIM before running Remove Duplicates so hidden whitespace doesn\'t disguise duplicate records.',
    },
  },
  'lvl-3-mod-4': {
    q1: {
      questionText: 'How can you quickly tell if numbers or dates imported from a CSV file are accidentally stored as Text instead of real numbers/dates?',
      options: [
        'Text values align to the LEFT edge of the cell by default (while real numbers and dates align to the RIGHT) and =SUM() ignores them',
        'Text values appear in bold red font',
        'Excel plays an alarm sound when opening the file',
        'Real numbers always align to the left',
      ],
      correctOptionIndex: 0,
      explanation: 'In Excel\'s General alignment, true numbers and dates right-align while text strings left-align (and often show a small green warning triangle).',
    },
    q2: {
      questionText: 'Which function converts a date stored as a text string (such as "2026-03-15") into an official Excel serial date number?',
      formulaContext: '=DATEVALUE(C2)',
      options: ['=TEXT(C2)', '=DATEVALUE(C2)', '=DAY(C2)', '=PROPER(C2)'],
      correctOptionIndex: 1,
      explanation: 'DATEVALUE converts a date represented as text into a valid numeric Excel serial date.',
    },
    q3: {
      questionText: 'What is the internationally unambiguous date format recommended for clean analytical tables?',
      options: [
        'ISO 8601 format: YYYY-MM-DD (e.g., 2026-10-25)',
        'MM/DD/YY mixed with DD/MM/YY in the same column',
        'Typing only the day of the week ("Monday")',
        'Text strings with ordinal suffixes ("25th Oct")',
      ],
      correctOptionIndex: 0,
      explanation: 'YYYY-MM-DD (ISO standard) eliminates US vs. UK day/month confusion and sorts chronologically even as text.',
    },
  },
  'lvl-3-mod-5': {
    q1: {
      questionText: 'What is the difference between the TRIM and CLEAN functions when cleaning messy imported text?',
      formulaContext: '=TRIM(CLEAN(A2))',
      options: [
        'TRIM removes irregular extra spaces; CLEAN removes non-printable control characters and line breaks',
        'TRIM deletes numbers; CLEAN deletes letters',
        'They are 100% identical',
        'CLEAN capitalizes words while TRIM makes them lowercase',
      ],
      correctOptionIndex: 0,
      explanation: 'Combining =TRIM(CLEAN(A2)) strips both invisible non-printing characters (like line breaks from web/CRM exports) and excess spaces.',
    },
    q2: {
      questionText: 'Product codes contain old prefixes like "OLD-4010" and you want to change "OLD-" to "SKU-" via a formula. Which function replaces specific text inside a string?',
      formulaContext: '=SUBSTITUTE(A2, "OLD-", "SKU-")',
      options: [
        '=SUBSTITUTE(A2, "OLD-", "SKU-")',
        '=TRIM(A2, "SKU-")',
        '=FIND("OLD-", A2)',
        '=MID(A2, 1, 4)',
      ],
      correctOptionIndex: 0,
      explanation: 'SUBSTITUTE(text, old_text, new_text) searches for a specific substring and replaces it with new text.',
    },
    q3: {
      questionText: 'After cleaning a column of messy names in Column B using =PROPER(TRIM(A2)), how do you replace the formulas with permanent static text so you can delete Column A safely?',
      options: [
        'Delete Column A immediately without copying',
        'Copy Column B, then right-click > Paste Special > Values (Ctrl + Shift + V)',
        'Format Column B as Currency',
        'Press F4 on the column header',
      ],
      correctOptionIndex: 1,
      explanation: 'Paste Values converts dynamic formula outputs into standalone static values so they no longer depend on the raw source column.',
    },
  },
  'lvl-3-mod-6': {
    q1: {
      questionText: 'A column contains "Lagos | Enterprise | Chinedu Okafor" separated by pipe symbols (|). Which wizard splits this column into three separate columns at once?',
      options: [
        'Data tab > Text to Columns > Delimited',
        'Home tab > Wrap Text',
        'Insert tab > PivotTable',
        'Review tab > Spell Check',
      ],
      correctOptionIndex: 0,
      explanation: 'Text to Columns (Delimited mode) splits a column into multiple columns wherever your chosen delimiter character (comma, pipe, space, tab) appears.',
    },
    q2: {
      questionText: 'You type an example in B2 showing how you want to extract the email domain from A2, then press Ctrl + E. Excel instantly fills the rest of Column B by detecting the pattern. What is this feature called?',
      options: ['AutoSum', 'Flash Fill (Ctrl + E)', 'Goal Seek', 'Solver'],
      correctOptionIndex: 1,
      explanation: 'Flash Fill (Data > Flash Fill or Ctrl + E) recognizes the transformation pattern from your example and completes the column automatically.',
    },
    q3: {
      questionText: 'What is one limitation of Flash Fill compared to a dynamic formula or Power Query?',
      options: [
        'Flash Fill produces static one-time results—if the source cell in Column A changes later, Flash Fill outputs do not recalculate automatically',
        'Flash Fill only works on numbers',
        'Flash Fill deletes the workbook after saving',
        'Flash Fill requires writing VBA code',
      ],
      correctOptionIndex: 0,
      explanation: 'Flash Fill is a one-time pattern fill; unlike formulas or Power Query, it does not dynamically update if source values change later.',
    },
  },
  'lvl-3-mod-7': {
    q1: {
      questionText: 'How do you prevent users from typing invalid region names into Column C by restricting entries to an approved dropdown list ("Lagos, Abuja, Kano, Port Harcourt")?',
      options: [
        'Data tab > Data Validation > Allow: List',
        'Home tab > Conditional Formatting',
        'View tab > Freeze Panes',
        'Data tab > Sort',
      ],
      correctOptionIndex: 0,
      explanation: 'Data Validation with the List option adds an in-cell dropdown and blocks unauthorized text entries.',
    },
    q2: {
      questionText: 'When a table is filtered to show only one region, why should you use =SUBTOTAL(9, E2:E200) instead of =SUM(E2:E200) at the bottom?',
      formulaContext: '=SUBTOTAL(9, E2:E200)',
      options: [
        'SUBTOTAL sums ONLY the visible (filtered) rows, whereas SUM continues adding hidden filtered-out rows',
        'SUM is no longer supported in Excel',
        'SUBTOTAL multiplies numbers by 9',
        'SUBTOTAL only works on text columns',
      ],
      correctOptionIndex: 0,
      explanation: 'SUBTOTAL(9, range) dynamically recalculates based only on visible rows after a filter is applied.',
    },
    q3: {
      questionText: 'In Data Validation, what does the "Circle Invalid Data" command do on an existing messy worksheet?',
      options: [
        'It places red ovals around any existing cells that violate your validation rules so you can fix them',
        'It deletes the entire worksheet',
        'It converts the table into a Pie Chart',
        'It sorts the column from Z to A',
      ],
      correctOptionIndex: 0,
      explanation: 'Circle Invalid Data audits values that were already typed before the validation rule was added and highlights rule-breakers in red.',
    },
  },
  'lvl-3-mod-8': {
    q1: {
      questionText: 'Which keyboard shortcut converts a clean range of data into an official Excel Table?',
      options: ['Ctrl + T (or Ctrl + L)', 'Ctrl + Shift + N', 'Alt + F1', 'Ctrl + D'],
      correctOptionIndex: 0,
      explanation: 'Pressing Ctrl + T opens the Create Table dialog and upgrades a standard cell range into a structured Excel Table.',
    },
    q2: {
      questionText: 'In an Excel Table named tbl_Sales, what does the structured reference =[@Units]*[@Unit_Price] mean?',
      formulaContext: '=[@Units]*[@Unit_Price]',
      options: [
        'Multiply the Units value in the current row (@) by the Unit_Price value in the current row (@)',
        'Send an email to Units and Unit_Price',
        'Multiply the entire column totals together',
        'Count how many rows contain @ symbols',
      ],
      correctOptionIndex: 0,
      explanation: 'Inside an Excel Table, the @ symbol refers to "this row", making table formulas readable and self-documenting.',
    },
    q3: {
      questionText: 'What is the biggest advantage of basing a PivotTable or formula on an official Excel Table (tbl_Sales) rather than a fixed range like A1:F100?',
      options: [
        'When new rows are pasted at the bottom of tbl_Sales, the table range and calculated columns expand automatically',
        'Excel Tables cannot be edited by anyone',
        'Excel Tables do not use computer memory',
        'Fixed ranges are not allowed in PivotTables',
      ],
      correctOptionIndex: 0,
      explanation: 'Excel Tables automatically expand their boundaries when new records are added, ensuring formulas and PivotTables never miss new bottom rows.',
    },
  },
  'lvl-3-mod-9': {
    q1: {
      questionText: 'Where in Excel do you launch Power Query to import and clean data from an external CSV file or workbook table?',
      options: [
        'Data tab > Get & Transform Data group (From Table/Range or From Text/CSV)',
        'Home tab > Font group',
        'Page Layout > Themes',
        'Review > Protect Workbook',
      ],
      correctOptionIndex: 0,
      explanation: 'Power Query lives under the Data tab in the Get & Transform Data section.',
    },
    q2: {
      questionText: 'In the Power Query Editor, why is the "Applied Steps" list on the right side so powerful for monthly business reporting?',
      options: [
        'It records every cleaning action in order so next month you simply click Data > Refresh All to clean the new data automatically',
        'It permanently deletes the original CSV file from your hard drive',
        'It limits imports to 100 rows',
        'It converts Excel into a word processor',
      ],
      correctOptionIndex: 0,
      explanation: 'Applied Steps stores a non-destructive transformation pipeline that replays automatically whenever you click Refresh.',
    },
    q3: {
      questionText: 'Once you finish cleaning columns inside the Power Query Editor, which button loads the cleaned output back into an Excel worksheet Table?',
      options: [
        'Home > Close & Load',
        'File > Exit Without Saving',
        'View > Gridlines',
        'Insert > Slicer',
      ],
      correctOptionIndex: 0,
      explanation: 'Clicking Close & Load outputs the transformed query result into a structured Excel Table (or directly into the Data Model / PivotTable).',
    },
  },
  'lvl-3-mod-10': {
    q1: {
      questionText: 'Before handing a cleaned dataset over for PivotTable analysis, what does a "Control Total Reconciliation" check verify?',
      options: [
        'That the total row count and total revenue after cleaning match the expected source totals (accounting only for documented duplicate/invalid removals)',
        'That every column has a different background color',
        'That all numbers are rounded to the nearest million',
        'That all formulas have been deleted',
      ],
      correctOptionIndex: 0,
      explanation: 'Control total reconciliation proves that data cleaning did not accidentally drop valid transactions or double-count rows.',
    },
    q2: {
      questionText: 'Which quick check confirms that a numeric Revenue column contains zero text entries disguised as numbers?',
      formulaContext: '=COUNT(E2:E500) = COUNTA(E2:E500)',
      options: [
        'Compare =COUNT(E2:E500) against =COUNTA(E2:E500); if they match, every non-blank cell is a true number',
        'Check if the column header is bold',
        'Sort the sheet by customer name',
        'Hide the Revenue column',
      ],
      correctOptionIndex: 0,
      explanation: 'Since COUNT counts only true numbers and COUNTA counts all non-empty cells, any discrepancy reveals text strings hiding in a numeric column.',
    },
    q3: {
      questionText: 'Why should you verify data types (Date, Currency/Decimal, Text) before building PivotTables?',
      options: [
        'Because numbers stored as text default to Count instead of Sum in PivotTables, and text dates cannot be grouped by Month/Quarter',
        'Because PivotTables delete columns with wrong data types',
        'Because Excel refuses to save files with mixed data types',
        'Data types only affect printing paper size',
      ],
      correctOptionIndex: 0,
      explanation: 'Correct data types ensure numeric fields sum properly and date fields group into Months, Quarters, and Years effortlessly.',
    },
  },

  // ================= LEVEL 4: DATA ANALYSIS WITH EXCEL =================
  'lvl-4-mod-1': {
    q1: {
      questionText: 'In data analysis terminology, what is the difference between a Categorical (Dimension) field and a Quantitative (Measure/Metric) field?',
      options: [
        'Categorical fields (Region, Category, Segment) group or slice data; Quantitative fields (Revenue, Units, Cost) are numeric values you aggregate',
        'Categorical fields are always numbers; Quantitative fields are always text',
        'There is no difference between them',
        'Quantitative fields can only be placed in PivotTable Filters',
      ],
      correctOptionIndex: 0,
      explanation: 'Dimensions/Categories (Who, What, Where, When) go into Rows/Columns/Filters, while Metrics/Measures (How much, How many) go into Values.',
    },
    q2: {
      questionText: 'What is meant by the "Granularity" (or grain) of a business dataset?',
      options: [
        'The font size of the worksheet cells',
        'The level of detail represented by a single row (e.g., one individual invoice line vs. a monthly regional summary)',
        'The file size in megabytes',
        'The number of color themes used',
      ],
      correctOptionIndex: 1,
      explanation: 'Granularity defines what one single row represents—understanding the grain prevents double-counting when joining or aggregating tables.',
    },
    q3: {
      questionText: 'Why must a summary "Grand Total" row at the bottom of a raw table be excluded before creating a PivotTable from that range?',
      options: [
        'Including a Grand Total row inside the source range causes the PivotTable to count the total row as another data record, doubling your numbers!',
        'Grand Total rows change the PivotTable colors',
        'Excel blocks PivotTables if the word Total appears anywhere',
        'Grand Total rows delete the column headers',
      ],
      correctOptionIndex: 0,
      explanation: 'If a manual total row is part of the source range, the PivotTable aggregates all detail rows PLUS the total row, inflating every sum by 2x.',
    },
  },
  'lvl-4-mod-2': {
    q1: {
      questionText: 'A manager asks: "Why did our profit drop last quarter?" How does a skilled data analyst translate this vague question into structured Excel analysis?',
      options: [
        'Guess an answer without looking at the spreadsheet',
        'Decompose profit by Region, Product Category, Volume, Discount Rate, and Unit Cost across Q2 vs. Q3 to isolate the specific driver',
        'Delete Q3 transactions so profit looks higher',
        'Print the raw 10,000-row table and hand it to the manager',
      ],
      correctOptionIndex: 1,
      explanation: 'Good analytical framing breaks a high-level symptom (profit drop) into testable slices (region, category, price/discount vs. volume).',
    },
    q2: {
      questionText: 'Why is looking only at Total Revenue often misleading when evaluating regional sales performance?',
      options: [
        'High gross revenue can hide heavy unapproved discounting or high product costs that result in low or negative Net Profit Margin',
        'Revenue is never an important business metric',
        'Excel cannot sum large revenue numbers',
        'Total Revenue only works for one month at a time',
      ],
      correctOptionIndex: 0,
      explanation: 'Comparing Gross Revenue alongside Net Profit and Margin % reveals whether top-line sales are actually generating bottom-line profit.',
    },
    q3: {
      questionText: 'Which analytical comparison helps distinguish a true performance decline from normal seasonal fluctuations (e.g., January retail dip after December)?',
      options: [
        'Comparing Year-over-Year (YoY — Jan 2026 vs. Jan 2025) in addition to Month-over-Month (MoM)',
        'Comparing only Tuesday against Wednesday',
        'Sorting customer names alphabetically',
        'Changing the chart type to a Pie Chart',
      ],
      correctOptionIndex: 0,
      explanation: 'Year-over-Year (YoY) comparisons control for seasonality by comparing the exact same calendar period across different years.',
    },
  },
  'lvl-4-mod-3': {
    q1: {
      questionText: 'Which function calculates the average order value specifically for "Enterprise" segment customers in a transaction table?',
      formulaContext: '=AVERAGEIFS(tbl_Orders[Order_Value], tbl_Orders[Segment], "Enterprise")',
      options: [
        '=SUMIFS(tbl_Orders[Order_Value], tbl_Orders[Segment], "Enterprise")',
        '=AVERAGEIFS(tbl_Orders[Order_Value], tbl_Orders[Segment], "Enterprise")',
        '=COUNTIFS(tbl_Orders[Segment], "Enterprise")',
        '=AVERAGE(tbl_Orders[Order_Value])',
      ],
      correctOptionIndex: 1,
      explanation: 'AVERAGEIFS computes the arithmetic mean of a numeric column filtered by one or more criteria columns.',
    },
    q2: {
      questionText: 'When building a formula-based summary table with Regions in A2:A5 and Categories across B1:E1, how do mixed references ($A2 and B$1) save time inside =SUMIFS()?',
      formulaContext: '=SUMIFS(Sales[Rev], Sales[Region], $A2, Sales[Category], B$1)',
      options: [
        'You write ONE formula in B2 and drag it both down and across the entire matrix without retyping criteria',
        'Mixed references make the numbers larger',
        'Mixed references automatically build a PivotChart',
        'They convert the table into a PDF',
      ],
      correctOptionIndex: 0,
      explanation: 'Locking the column on $A2 (Region) and the row on B$1 (Category) lets a single SUMIFS formula populate the entire 2D cross-tab grid.',
    },
    q3: {
      questionText: 'In modern Excel (365 / 2021+), which dynamic array function extracts a clean list of distinct product categories from a 5,000-row column automatically?',
      formulaContext: '=UNIQUE(tbl_Sales[Category])',
      options: ['=DISTINCT(tbl_Sales[Category])', '=UNIQUE(tbl_Sales[Category])', '=SINGLE(tbl_Sales[Category])', '=GROUP(tbl_Sales[Category])'],
      correctOptionIndex: 1,
      explanation: '=UNIQUE() spills a dynamic list of distinct values from any range or table column.',
    },
  },
  'lvl-4-mod-4': {
    q1: {
      questionText: 'What are the four drop zones inside the PivotTable Fields pane?',
      options: [
        'Top, Bottom, Left, Right',
        'Filters, Columns, Rows, and Values',
        'Headers, Footers, Totals, and Charts',
        'Sum, Count, Average, and Max',
      ],
      correctOptionIndex: 1,
      explanation: 'Every PivotTable is organized through four areas: Filters (report-level filter), Rows, Columns, and Values (aggregated metrics).',
    },
    q2: {
      questionText: 'When you drag a numeric field like "Revenue" into the Values area of a PivotTable, it suddenly defaults to "Count of Revenue" instead of "Sum of Revenue". Why did this happen and how do you fix it?',
      options: [
        'One or more cells in the Revenue column contain blanks or text; click Value Field Settings > Summarize Value Field By > Sum',
        'PivotTables cannot add numbers',
        'The Revenue column is too wide',
        'You must reinstall Excel',
      ],
      correctOptionIndex: 0,
      explanation: 'Excel defaults to Count if any cell in a numeric source column is blank or text; you can switch it via Value Field Settings > Sum.',
    },
    q3: {
      questionText: 'How do you display each region\'s revenue as a percentage of total company sales inside a PivotTable without writing any formulas?',
      options: [
        'Right-click a value cell > Show Values As > % of Grand Total (or % of Column Total)',
        'Type =A2/B2 inside the PivotTable cells',
        'Change the font to Percent style on the Home tab',
        'Sort the PivotTable from Z to A',
      ],
      correctOptionIndex: 0,
      explanation: 'Show Values As > % of Grand Total / % of Column Total computes proportional contribution directly inside the PivotTable.',
    },
  },
  'lvl-4-mod-5': {
    q1: {
      questionText: 'How do you group daily transaction dates (e.g., 2026-01-01 to 2026-12-31) in a PivotTable into Quarters and Months?',
      options: [
        'Right-click any date in the PivotTable Row labels > click Group > select Months and Quarters',
        'Manually type Quarter names into a new worksheet',
        'Use Find & Replace on the date column',
        'Apply Conditional Formatting Data Bars',
      ],
      correctOptionIndex: 0,
      explanation: 'Right-clicking a date cell in the PivotTable and choosing Group lets you roll daily dates up into Months, Quarters, and Years.',
    },
    q2: {
      questionText: 'How can you quickly filter a PivotTable to show ONLY the "Top 5 Products by Revenue"?',
      options: [
        'Click the Row Labels filter arrow > Value Filters > Top 10... > change 10 to 5',
        'Delete the bottom rows manually with the Delete key',
        'Hide rows on the worksheet tab',
        'Change the PivotTable style color',
      ],
      correctOptionIndex: 0,
      explanation: 'Value Filters > Top 10 lets you dynamically display the Top (or Bottom) N items ranked by any metric in the Values area.',
    },
    q3: {
      questionText: 'What happens when you double-click any single aggregated number cell inside a PivotTable?',
      options: [
        'It deletes the PivotTable',
        'Excel performs a Drill-Down: it creates a new worksheet listing the exact underlying source rows that make up that number',
        'It closes the workbook',
        'It converts the PivotTable into a picture',
      ],
      correctOptionIndex: 1,
      explanation: 'Double-clicking a value cell in a PivotTable extracts the exact supporting transaction records onto a new audit sheet.',
    },
  },
  'lvl-4-mod-6': {
    q1: {
      questionText: 'How does a PivotChart differ from a standard static Excel chart?',
      options: [
        'A PivotChart is dynamically linked to its PivotTable—filtering, grouping, or slicing the PivotTable updates the PivotChart automatically',
        'PivotCharts can only be printed in black and white',
        'PivotCharts cannot show column or bar visuals',
        'Standard charts update PivotTables automatically',
      ],
      correctOptionIndex: 0,
      explanation: 'A PivotChart stays synchronized with its underlying PivotTable: any filter, slicer, or grouping change updates both immediately.',
    },
    q2: {
      questionText: 'To make a PivotChart look clean and executive-ready, how do you remove the gray "Field Buttons" (like Sum of Revenue, Region▼) cluttering the chart canvas?',
      options: [
        'Right-click any Field Button on the chart and select "Hide All Field Buttons on Chart" (or PivotChart Analyze > Field Buttons)',
        'Cover them with white text boxes',
        'Crop a screenshot of the chart',
        'Delete the PivotTable',
      ],
      correctOptionIndex: 0,
      explanation: 'Hiding all field buttons on the chart removes interactive button clutter so the visual is clean for presentations and dashboards.',
    },
    q3: {
      questionText: 'If you have a PivotChart showing 12 product categories with long names, why is a Horizontal Bar Chart often better than a Vertical Column Chart?',
      options: [
        'Horizontal bars allow long category labels to read naturally from left to right without awkward diagonal or vertical text rotation',
        'Horizontal bars calculate sums faster',
        'Vertical column charts cannot show more than 3 items',
        'Excel does not support vertical column PivotCharts',
      ],
      correctOptionIndex: 0,
      explanation: 'Horizontal bar charts give category labels ample horizontal reading space and rank neatly from top to bottom.',
    },
  },
  'lvl-4-mod-7': {
    q1: {
      questionText: 'Which Conditional Formatting tool draws horizontal proportional bars directly inside numeric cells so you can visually scan magnitude down a column?',
      options: [
        'Conditional Formatting > Data Bars',
        'Conditional Formatting > Duplicate Values',
        'Home > Merge & Center',
        'Insert > Sparklines',
      ],
      correctOptionIndex: 0,
      explanation: 'Data Bars render an in-cell bar chart proportional to each cell\'s value relative to the rest of the selected range.',
    },
    q2: {
      questionText: 'When highlighting "Over Budget" variance cells using Conditional Formatting, why is it important to pair color formatting with a clear text label or symbol (like "-19.0% Over Budget")?',
      options: [
        'Relying on color alone fails for color-blind readers, black-and-white prints, and sorting/filtering by status',
        'Excel does not allow red fill color without text',
        'Colors disappear when you save an .xlsx file',
        'Conditional Formatting only works on text',
      ],
      correctOptionIndex: 0,
      explanation: 'Accessible, professional tables combine visual cues (subtle fill/icons) with explicit values or status labels.',
    },
    q3: {
      questionText: 'Where do you go to edit, reorder, or delete existing Conditional Formatting rules when multiple rules have been applied to a sheet?',
      options: [
        'Home > Conditional Formatting > Manage Rules...',
        'File > Options > Advanced',
        'Data > Remove Duplicates',
        'View > Macros',
      ],
      correctOptionIndex: 0,
      explanation: 'Conditional Formatting > Manage Rules shows all active rules on the current selection or worksheet so you can edit or clear them cleanly.',
    },
  },
  'lvl-4-mod-8': {
    q1: {
      questionText: 'Which Excel function assigns a rank (1st, 2nd, 3rd...) to a branch\'s revenue in cell C2 compared against all branches in $C$2:$C$15?',
      formulaContext: '=RANK.EQ(C2, $C$2:$C$15)',
      options: [
        '=ORDER(C2, $C$2:$C$15)',
        '=RANK.EQ(C2, $C$2:$C$15)',
        '=INDEX(C2, $C$2:$C$15)',
        '=MATCH(C2, $C$2:$C$15)',
      ],
      correctOptionIndex: 1,
      explanation: 'RANK.EQ returns the numeric rank of a value within a locked list of values (1 = highest by default).',
    },
    q2: {
      questionText: 'Why must the second argument in =RANK.EQ(C2, $C$2:$C$15) use absolute dollar signs ($C$2:$C$15) when copied down the column?',
      options: [
        'So every branch is ranked against the exact same full list of 14 branches rather than a shifting range',
        'Because RANK.EQ only works on US Dollar currency',
        'To sort the rows automatically',
        'To hide tied ranks',
      ],
      correctOptionIndex: 0,
      explanation: 'Without $ signs, copying down shifts the comparison list (C3:C16, C4:C17...), producing completely wrong ranks.',
    },
    q3: {
      questionText: 'When comparing a small new branch (5 sales reps) against a flagship headquarters branch (40 sales reps), why should you calculate "Revenue per Sales Rep" alongside Total Revenue?',
      options: [
        'Normalizing metrics (per rep, per store, or margin %) allows fair apple-to-apples efficiency comparisons across different-sized locations',
        'Total Revenue is illegal to report in Excel',
        'Because PivotTables cannot sum numbers larger than 10 million',
        'To reduce the number of columns in the workbook',
      ],
      correctOptionIndex: 0,
      explanation: 'Normalized ratios (Revenue per Rep, Average Order Value, Margin %) reveal true productivity independent of branch headcount.',
    },
  },
  'lvl-4-mod-9': {
    q1: {
      questionText: 'Prior Month revenue is in cell B2 (10,000,000) and Current Month revenue is in cell C2 (12,200,000). Which formula accurately calculates the percentage growth rate (+22.0%)?',
      formulaContext: '=(C2 - B2) / B2',
      options: [
        '=(B2 - C2) / C2',
        '=(C2 - B2) / B2   (or =C2/B2 - 1)',
        '=C2 / B2',
        '=(C2 + B2) / 100',
      ],
      correctOptionIndex: 1,
      explanation: 'Percentage change is always (New - Old) / Old, which is (C2 - B2) / B2 formatted as a Percentage.',
    },
    q2: {
      questionText: 'In a PivotTable with Years or Months across columns, which "Show Values As" option calculates period-over-period percentage growth automatically?',
      options: [
        'Show Values As > % Difference From... (Base item: Previous)',
        'Show Values As > Running Total In',
        'Show Values As > Index',
        'Summarize Values By > StdDev',
      ],
      correctOptionIndex: 0,
      explanation: '% Difference From (Base item: Previous) computes period-over-period percentage growth directly inside the PivotTable.',
    },
    q3: {
      questionText: 'When calculating percentage growth =(C2-B2)/B2, what happens if Prior Month revenue (B2) was 0 (e.g., a brand-new product launch), and how should you handle it?',
      formulaContext: '=IFERROR((C2-B2)/B2, "New Launch")',
      options: [
        'Dividing by 0 causes #DIV/0!; wrap the formula in =IFERROR((C2-B2)/B2, "New / N/A")',
        'Excel automatically displays +100%',
        'Excel deletes the row',
        'It returns 0% automatically',
      ],
      correctOptionIndex: 0,
      explanation: 'When the prior baseline is 0, percentage growth is mathematically undefined (#DIV/0!); IFERROR provides a clean business label.',
    },
  },
  'lvl-4-mod-10': {
    q1: {
      questionText: 'What is the difference between a mere "Data Observation" and an actionable "Business Insight"?',
      options: [
        'An observation states what happened ("Q3 sales fell 14%"); an insight explains WHY it happened and recommends a specific action ("Q3 sales in Port Harcourt fell 14% due to stockouts on UPS units—increase reorder buffer by 20%")',
        'An insight uses larger font sizes than an observation',
        'An observation includes formulas while an insight deletes all numbers',
        'There is no difference',
      ],
      correctOptionIndex: 0,
      explanation: 'Executive decision-makers need the What, the So-What (root cause & business impact), and the Now-What (recommended action).',
    },
    q2: {
      questionText: 'When writing a 3-bullet executive summary at the top of an analysis sheet, why should you always cite exact numbers, time periods, and percentages?',
      options: [
        'Precise figures ("Cloud Subscriptions grew +22.0% QoQ to ₦15.13M, contributing 41.5% of Q3 revenue") build credibility and let stakeholders verify claims immediately',
        'Because vague words like "sales went up a lot" are faster to read',
        'Excel requires numbers inside every text box',
        'To make the sentence longer',
      ],
      correctOptionIndex: 0,
      explanation: 'Quantified findings anchor your narrative in verifiable facts rather than subjective opinions.',
    },
    q3: {
      questionText: 'Before emailing or presenting your analysis workbook to leadership, what final check ensures your tables and charts are trustworthy?',
      options: [
        'Refresh all PivotTables/queries, confirm zero formula errors (#REF!, #DIV/0!, #N/A), and reconcile summary totals against raw control totals',
        'Change every chart into a 3D Pie Chart',
        'Zoom the worksheet out to 25%',
        'Remove all column headers',
      ],
      correctOptionIndex: 0,
      explanation: 'Refreshing caches, auditing for formula errors, and reconciling control totals is the gold standard pre-delivery checklist.',
    },
  },

  // ================= LEVEL 5: DASHBOARDS AND PROFESSIONAL REPORTING =================
  'lvl-5-mod-1': {
    q1: {
      questionText: 'In professional Excel dashboard design, what is the recommended 3-layer worksheet architecture inside your workbook?',
      options: [
        'Put raw data, scratch calculations, PivotTables, and final charts all mixed together on Sheet1',
        'Separate the workbook into three distinct layers: 1) Raw/Clean Data Table tab, 2) Pivot/Calculation Engine tab, and 3) Executive Dashboard presentation tab',
        'Put each chart in a separate Excel file on the desktop',
        'Use only CSV files for dashboards',
      ],
      correctOptionIndex: 1,
      explanation: 'Separating Data, Calculation/Pivot Engine, and Presentation Dashboard keeps the report clean, fast, and impossible to break accidentally.',
    },
    q2: {
      questionText: 'Where on an executive dashboard should the most critical headline KPIs (Total Revenue, Net Margin %, Achievement vs. Target) be placed?',
      options: [
        'Hidden at the bottom below row 200',
        'Across the top banner (top-left to top-right) where a reader\'s eye naturally lands first',
        'On a separate hidden worksheet',
        'Inside the footer print settings',
      ],
      correctOptionIndex: 1,
      explanation: 'Visual hierarchy follows a Z- or F-reading pattern: headline KPIs belong at the top, followed by primary trend/comparison charts below.',
    },
    q3: {
      questionText: 'Why should an executive dashboard fit comfortably on a single screen view without requiring endless horizontal and vertical scrolling?',
      options: [
        'Dashboards are designed for at-a-glance monitoring and interactive comparison; scrolling hides context when clicking filters',
        'Excel disables Slicers below row 30',
        'Charts stop calculating when scrolled off-screen',
        'Monitors cannot display more than 10 rows',
      ],
      correctOptionIndex: 0,
      explanation: 'A single-screen viewport lets decision-makers click any Slicer and immediately see all KPI cards and charts respond together.',
    },
  },
  'lvl-5-mod-2': {
    q1: {
      questionText: 'Which chart type is best for showing a 12-month or 24-month continuous trend of monthly revenue and target over time?',
      options: [
        'A Pie Chart with 24 slices',
        'A clean Line Chart with a chronological horizontal time axis',
        'A Doughnut Chart',
        'A Scatter Plot of customer names',
      ],
      correctOptionIndex: 1,
      explanation: 'Line charts clearly connect sequential time periods, making growth trajectories, dips, and seasonality immediately obvious.',
    },
    q2: {
      questionText: 'Why do data visualization experts recommend avoiding Pie Charts when comparing more than 3 or 4 categories (or when values are close in size)?',
      options: [
        'Human eyes are poor at judging slice angles and areas compared to comparing aligned bar lengths on a Bar/Column chart',
        'Pie charts cannot display percentages',
        'Pie charts are not available in Microsoft 365',
        'Pie charts corrupt the workbook file',
      ],
      correctOptionIndex: 0,
      explanation: 'Aligned horizontal bars or vertical columns let the eye compare lengths accurately down to small differences.',
    },
    q3: {
      questionText: 'When you want to plot Monthly Revenue (in millions of Naira) AND Gross Margin % (e.g., 38%) on the same chart, which chart type prevents the percentage line from looking flat at the bottom?',
      options: [
        'A Combo Chart (Clustered Column for Revenue + Line on a Secondary Axis for Margin %)',
        'A 3D Pyramid Chart',
        'A Pie of Pie Chart',
        'A Surface Chart',
      ],
      correctOptionIndex: 0,
      explanation: 'A Combo Chart with a Secondary Axis plots currency on the left axis and percentages on the right axis.',
    },
  },
  'lvl-5-mod-3': {
    q1: {
      questionText: 'What three elements make an Executive KPI Card truly informative rather than just a raw number?',
      options: [
        '1) Clear Metric Title, 2) Headline Actual Value (e.g. ₦142.8M), and 3) Comparison Context (e.g. ▲ +15.0% YoY or 105.8% of Target)',
        'Three different font families in rainbow colors',
        'A paragraph of 200 words explaining how SUM works',
        'Only the raw unformatted number with 8 decimal places',
      ],
      correctOptionIndex: 0,
      explanation: 'Every KPI card needs the metric name, the formatted headline figure, and a variance/target benchmark for instant interpretation.',
    },
    q2: {
      questionText: 'How do you link a shape or text box on your Dashboard so it dynamically displays the value of calculation cell Pivot_Engine!B4?',
      formulaContext: '=Pivot_Engine!B4',
      options: [
        'Type =Pivot_Engine!B4 directly inside the text box body',
        'Click the border of the Shape/Text Box, click inside the Excel Formula Bar (fx) at the top, type =Pivot_Engine!B4, and press Enter',
        'Copy and paste a static screenshot every morning',
        'Shapes cannot display cell values in Excel',
      ],
      correctOptionIndex: 1,
      explanation: 'Selecting the shape border and typing =Sheet!Cell inside the top Formula Bar binds the shape dynamically to that cell\'s output.',
    },
    q3: {
      questionText: 'What does the formula =IF(D2>=0, "▲ +" & TEXT(D2,"0.0%"), "▼ " & TEXT(D2,"0.0%")) produce for a KPI variance card?',
      formulaContext: '=IF(D2>=0, "▲ +" & TEXT(D2,"0.0%"), "▼ " & TEXT(D2,"0.0%"))',
      options: [
        'A dynamic directional trend label like "▲ +15.0%" for positive growth or "▼ -4.2%" for a decline',
        'A #VALUE! error',
        'A static pie chart',
        'It deletes negative numbers',
      ],
      correctOptionIndex: 0,
      explanation: 'Combining IF, TEXT formatting, and Unicode triangles (▲/▼) builds clean, self-updating variance badges.',
    },
  },
  'lvl-5-mod-4': {
    q1: {
      questionText: 'Which View tab setting should you uncheck on your Dashboard worksheet to remove the default spreadsheet cell borders and create a clean report canvas?',
      options: ['View > uncheck Gridlines', 'View > uncheck Formula Bar', 'View > Zoom to 400%', 'View > Split Window'],
      correctOptionIndex: 0,
      explanation: 'Turning off Gridlines on the presentation tab gives your dashboard a polished, modern software look.',
    },
    q2: {
      questionText: 'When dragging or resizing charts and KPI cards on a worksheet, which keyboard key can you hold down so the edges snap cleanly to cell grid borders?',
      options: ['Hold down the Alt key (or Cmd on Mac) while dragging/resizing', 'Hold down Caps Lock', 'Hold down Spacebar', 'Press Esc'],
      correctOptionIndex: 0,
      explanation: 'Holding Alt while moving or resizing objects snaps their corners directly to worksheet row and column boundaries.',
    },
    q3: {
      questionText: 'Why should a professional business dashboard stick to a disciplined 2-to-3 color palette (such as Slate Navy, Emerald Green for positive/primary, and Amber/Coral for alerts)?',
      options: [
        'Consistent, restrained color coding lets viewers immediately recognize what color means (e.g., target met vs. overrun) without visual noise',
        'Excel charges extra for using more than 3 colors',
        'Monitors can only display 3 colors',
        'Random bright rainbow colors make numbers more accurate',
      ],
      correctOptionIndex: 0,
      explanation: 'Semantic color consistency reduces cognitive load so color carries clear analytical meaning.',
    },
  },
  'lvl-5-mod-5': {
    q1: {
      questionText: 'What is a Slicer in Excel?',
      options: [
        'A formula that cuts text strings in half',
        'Visual, clickable filter buttons that let users filter PivotTables and PivotCharts interactively with one click',
        'A tool for deleting worksheet tabs',
        'A print margin cutter',
      ],
      correctOptionIndex: 1,
      explanation: 'Slicers provide user-friendly, visual filter buttons that clearly show which regions, categories, or segments are currently selected.',
    },
    q2: {
      questionText: 'Which specialized interactive filter control is designed specifically for filtering Date fields by Years, Quarters, Months, or Days using a sliding time bar?',
      options: [
        'Insert > Timeline (PivotTable Analyze > Insert Timeline)',
        'Data > Text to Columns',
        'Home > Find & Select',
        'Formulas > Name Manager',
      ],
      correctOptionIndex: 0,
      explanation: 'A Timeline is a date-specific interactive filter that lets users drag across months, quarters, or years smoothly.',
    },
    q3: {
      questionText: 'How can you change a vertical 1-column Slicer into a compact horizontal 4-column button bar that sits neatly across the top of a dashboard?',
      options: [
        'Select the Slicer > go to the Slicer contextual tab > increase the "Columns" setting (e.g. from 1 to 4) and resize',
        'Create 4 separate Slicers',
        'Rotate the monitor 90 degrees',
        'Slicers can only have 1 column',
      ],
      correctOptionIndex: 0,
      explanation: 'Increasing the Columns count on the Slicer tab arranges buttons horizontally into a sleek filter bar.',
    },
  },
  'lvl-5-mod-6': {
    q1: {
      questionText: 'You have 4 PivotCharts on your dashboard, but clicking your "Region" Slicer only updates 1 chart! Which setting connects that single Slicer to all 4 PivotTables?',
      options: [
        'Right-click the Slicer > Report Connections (or Slicer tab > Report Connections) and check all 4 PivotTables',
        'Delete the other 3 charts',
        'Rebuild the workbook from scratch',
        'Turn off AutoCalculate',
      ],
      correctOptionIndex: 0,
      explanation: 'Report Connections links one Slicer to every PivotTable built from the same source table/cache.',
    },
    q2: {
      questionText: 'For two PivotTables to appear together inside a Slicer\'s "Report Connections" list, what requirement must they share?',
      options: [
        'Both PivotTables must be created from the exact same source Excel Table (or shared Data Model / PivotCache)',
        'Both PivotTables must use the same font size',
        'Both PivotTables must be on Sheet1',
        'They must have the same number of rows',
      ],
      correctOptionIndex: 0,
      explanation: 'When all your PivotTables point to the same named Excel Table (e.g., tbl_Sales), they share a PivotCache and can be controlled by the same Slicers.',
    },
    q3: {
      questionText: 'How can a user select multiple non-adjacent buttons on an Excel Slicer (for example, both "Lagos" and "Kano" together)?',
      options: [
        'Hold down Ctrl while clicking the buttons (or click the Multi-Select icon at the top-right of the Slicer)',
        'Double-click the Slicer border',
        'Press Alt + F4',
        'Slicers only allow selecting one item ever',
      ],
      correctOptionIndex: 0,
      explanation: 'Ctrl-clicking (or toggling the Multi-Select button in the Slicer header) lets users combine any subset of filter items.',
    },
  },
  'lvl-5-mod-7': {
    q1: {
      questionText: 'Why is placing Direct Data Labels right on your bars or line points often cleaner than forcing readers to look back and forth at a vertical grid axis and legend?',
      options: [
        'Direct data labels let the reader see the exact value on each bar immediately, allowing you to remove noisy gridlines and axis clutter',
        'Excel requires data labels to save a chart',
        'Gridlines cause formula errors',
        'Axes are not supported in Excel',
      ],
      correctOptionIndex: 0,
      explanation: 'Adding direct Data Labels and removing redundant axis lines maximizes the data-to-ink ratio and speeds up comprehension.',
    },
    q2: {
      questionText: 'When formatting large currency numbers on a chart (such as ₦48,150,000), why is custom number formatting like ₦#,##0.0,,"M" (displaying ₦48.2M) helpful?',
      options: [
        'Abbreviating millions ("M") or thousands ("K") prevents long 9-digit labels from overlapping and colliding on chart bars',
        'It changes the actual underlying numbers in the source table to 48',
        'It converts Naira into Euros',
        'It hides negative numbers',
      ],
      correctOptionIndex: 0,
      explanation: 'Display scaling in K or M keeps chart labels concise and readable while preserving exact precision in the underlying cells.',
    },
    q3: {
      questionText: 'Why should you uncheck "Autofit column widths on update" inside PivotTable Options when PivotTables sit on the same sheet as formatted elements?',
      options: [
        'So clicking a Slicer or refreshing the PivotTable does not suddenly resize worksheet columns and squash your KPI cards or charts',
        'Because Autofit deletes Slicers',
        'Because Autofit disables formulas',
        'To make the file read-only',
      ],
      correctOptionIndex: 0,
      explanation: 'Disabling "Autofit column widths on update" in PivotTable Options keeps your column widths locked when filters change.',
    },
  },
  'lvl-5-mod-8': {
    q1: {
      questionText: 'How do you create a dynamic dashboard header that automatically changes to say "Executive Sales Overview — Lagos" when the user clicks "Lagos" on the Slicer?',
      formulaContext: '="Executive Sales Overview — " & Pivot_Engine!B1',
      options: [
        'Write a concatenation formula referencing the filtered PivotTable header cell (="Executive Sales Overview — " & Pivot_Engine!B1) and link your title to it',
        'Type the region name manually every time someone clicks a button',
        'Use Conditional Formatting Data Bars',
        'Dynamic titles require external plugins',
      ],
      correctOptionIndex: 0,
      explanation: 'Concatenating a descriptive label with the cell displaying the active Pivot filter selection updates the header automatically on every Slicer click.',
    },
    q2: {
      questionText: 'When sharing an interactive dashboard with managers, how do you protect your formulas from accidental deletion while still letting users click Slicers?',
      options: [
        'Ensure Slicers are unlocked (or check "Use PivotTable & PivotChart" when running Review > Protect Sheet)',
        'Save the dashboard as a static JPEG image',
        'Delete the Pivot_Engine sheet before sending',
        'Encrypt the computer hard drive',
      ],
      correctOptionIndex: 0,
      explanation: 'Protecting the worksheet while allowing Slicer/Pivot interaction prevents accidental formula edits while keeping interactive filtering live.',
    },
    q3: {
      questionText: 'What is the benefit of hiding intermediate calculation sheets (like Pivot_Engine) before distributing the final workbook to executives?',
      options: [
        'Executives open directly to the clean Dashboard tab without being confused by backstage helper tables',
        'Hidden sheets calculate 10x faster',
        'Excel requires at least one hidden sheet',
        'Hiding a sheet deletes its data permanently',
      ],
      correctOptionIndex: 0,
      explanation: 'Right-clicking helper tabs and selecting Hide keeps the user experience focused on the executive dashboard while all backstage formulas continue working.',
    },
  },
  'lvl-5-mod-9': {
    q1: {
      questionText: 'New October sales rows have just been pasted at the bottom of your source Excel Table (tbl_Sales). What single action updates all connected Power Queries, PivotTables, KPI cards, and PivotCharts across the entire workbook?',
      options: [
        'Click Data tab > Refresh All (or press Ctrl + Alt + F5)',
        'Rebuild every PivotTable and chart from scratch',
        'Close and reopen Windows',
        'Use Format Painter on the dashboard',
      ],
      correctOptionIndex: 0,
      explanation: 'Because the pipeline is built on a structured Excel Table, clicking Data > Refresh All (Ctrl + Alt + F5) updates every PivotCache and chart in one click.',
    },
    q2: {
      questionText: 'If you add a brand-new column (e.g., "Discount_Amount") to your source Excel Table, how do you make that new field appear in your PivotTable Fields list?',
      options: [
        'Right-click the PivotTable and click Refresh—the new table column appears in the Field List automatically',
        'Delete the PivotTable and start over',
        'Copy and paste the column onto the dashboard',
        'Save the file as .csv',
      ],
      correctOptionIndex: 0,
      explanation: 'Refreshing any PivotTable connected to an Excel Table automatically pulls newly added table columns into the PivotTable Field List.',
    },
    q3: {
      questionText: 'How can you configure a PivotTable so it refreshes its cache automatically every time someone opens the Excel workbook file?',
      options: [
        'Right-click PivotTable > PivotTable Options > Data tab > check "Refresh data when opening the file"',
        'Rename the file to Refresh.xlsx',
        'Put the file in the Recycle Bin',
        'Turn off Gridlines',
      ],
      correctOptionIndex: 0,
      explanation: 'Checking "Refresh data when opening the file" in PivotTable Options ensures stakeholders always see up-to-date figures upon opening.',
    },
  },
  'lvl-5-mod-10': {
    q1: {
      questionText: 'When presenting an interactive Excel dashboard to leadership, what structure makes your executive briefing persuasive and action-oriented?',
      options: [
        'Headline Metric Status -> Root-Cause Driver (shown via Slicer drill-down) -> Quantified Business Recommendation',
        'Explain every Excel keyboard shortcut you used for 30 minutes',
        'Read every row of the raw dataset out loud',
        'Only show the colors of the dashboard without mentioning any numbers',
      ],
      correctOptionIndex: 0,
      explanation: 'Start with the headline takeaway, demonstrate the root cause live using your Slicers, and propose a concrete action backed by the numbers.',
    },
    q2: {
      questionText: 'Before printing or exporting an Excel Dashboard to a 1-page PDF for a board pack, which Page Layout settings ensure it doesn\'t split awkwardly across 4 pages?',
      options: [
        'Page Layout > Orientation: Landscape, Set Print Area, and Scale to Fit: Width = 1 page, Height = 1 page',
        'Change all fonts to size 4',
        'Delete half the charts before printing',
        'Save the file as .txt',
      ],
      correctOptionIndex: 0,
      explanation: 'Setting Print Area with Landscape orientation and Fit to 1 Page Wide by 1 Page Tall exports a crisp, single-page executive PDF.',
    },
    q3: {
      questionText: 'If an executive asks a live "What-If" question during your presentation (e.g., "How did Cloud Subscriptions perform in Abuja specifically in Q3?"), how should you answer using your dashboard?',
      options: [
        'Click "Abuja", "Cloud Subscriptions", and "Q3" on your dashboard Slicers to filter the KPIs and charts live on screen',
        'Tell them you need 3 days to build a new spreadsheet',
        'Open a calculator app on your phone',
        'Type random numbers into the KPI cards',
      ],
      correctOptionIndex: 0,
      explanation: 'Connected Slicers let you answer ad-hoc multidimensional questions live in seconds during a meeting.',
    },
  },

  // ================= LEVEL 6: REAL-WORLD DATA ANALYSIS PROJECTS =================
  'lvl-6-mod-1': {
    q1: {
      questionText: 'In Project 1 (Sales Performance Analysis), given Units, Unit_Price, Discount_Pct, and Unit_Cost, which formula calculates Net Revenue after discount for an invoice row?',
      formulaContext: '=[@Units] * [@Unit_Price] * (1 - [@Discount_Pct])',
      options: [
        '=[@Units] * [@Unit_Price] * (1 - [@Discount_Pct])',
        '=[@Units] + [@Unit_Price] - [@Discount_Pct]',
        '=[@Unit_Cost] / [@Discount_Pct]',
        '=SUM([@Units], [@Discount_Pct])',
      ],
      correctOptionIndex: 0,
      explanation: 'Gross Revenue is Units * Unit_Price; multiplying by (1 - Discount_Pct) yields Net Revenue after the percentage discount.',
    },
    q2: {
      questionText: 'How is Gross Profit Margin % calculated from Net_Revenue and Total_Cost, while safely preventing #DIV/0! on zero-revenue rows?',
      formulaContext: '=IFERROR(([@Net_Revenue] - [@Total_Cost]) / [@Net_Revenue], 0)',
      options: [
        '=IFERROR(([@Net_Revenue] - [@Total_Cost]) / [@Net_Revenue], 0)',
        '=[@Total_Cost] / [@Net_Revenue]',
        '=[@Net_Revenue] - [@Total_Cost]',
        '=AVERAGE([@Net_Revenue], [@Total_Cost])',
      ],
      correctOptionIndex: 0,
      explanation: 'Gross Margin % is (Net Revenue - Total Cost) / Net Revenue, wrapped in IFERROR(..., 0) to handle zero-revenue edge cases cleanly.',
    },
    q3: {
      questionText: 'In the Project 1 commercial findings, Port Harcourt showed strong unit sales volume in Q3, yet net margin dropped sharply. What did the data reveal as the root cause?',
      options: [
        'An unapproved spike in discount percentages (14% average discount) on hardware orders eroded net profit margin',
        'Port Harcourt closed all its offices',
        'Excel calculated multiplication wrong',
        'Customers stopped buying hardware completely',
      ],
      correctOptionIndex: 0,
      explanation: 'Separating Volume from Discount_Pct and Margin % exposed that aggressive discounting—not lower unit demand—caused the margin dip.',
    },
  },
  'lvl-6-mod-2': {
    q1: {
      questionText: 'In Project 2 (Customer Purchasing & Retention Analysis), how is Average Order Value (AOV) calculated for each customer account?',
      formulaContext: '=[@Total_Spend] / [@Total_Orders]',
      options: [
        '=[@Total_Spend] * [@Total_Orders]',
        '=[@Total_Spend] / [@Total_Orders]',
        '=[@Total_Orders] / [@Total_Spend]',
        '=COUNT([@Total_Spend])',
      ],
      correctOptionIndex: 1,
      explanation: 'Average Order Value (AOV) equals a customer\'s Total Spend divided by their Total Orders.',
    },
    q2: {
      questionText: 'Using reporting reference date $B$2 and Last_Purchase_Date in G5, you calculate Days_Inactive in H5. Which IFS formula classifies <90 days as "Active", 90–180 days as "At Risk", and >180 days as "Churned"?',
      formulaContext: '=IFS(H5<90, "Active", H5<=180, "At Risk", H5>180, "Churned")',
      options: [
        '=IFS(H5<90, "Active", H5<=180, "At Risk", H5>180, "Churned")',
        '=IF(H5<90, "Active", "Churned")',
        '=SUMIFS(H5, "<90", "Active")',
        '=XLOOKUP(H5, 90, "Active")',
      ],
      correctOptionIndex: 0,
      explanation: 'IFS evaluates conditions in order: first <90 ("Active"), then <=180 ("At Risk"), and finally >180 ("Churned").',
    },
    q3: {
      questionText: 'Why should Days Since Last Purchase be calculated against a locked Reporting Date cell ($B$2) rather than typing a hardcoded date inside 500 individual formulas?',
      options: [
        'Updating the single date cell $B$2 refreshes inactivity days and retention status across the entire customer base immediately',
        'Excel does not allow dates inside formulas',
        'Hardcoded dates delete customer names',
        '$B$2 formats the sheet in bold',
      ],
      correctOptionIndex: 0,
      explanation: 'Centralizing the reporting date in an absolute reference cell ($B$2) makes the entire retention model reusable every week or month.',
    },
  },
  'lvl-6-mod-3': {
    q1: {
      questionText: 'In Project 3 (Inventory & Stock Movement Analysis), what is the reconciliation formula for Closing_Stock?',
      formulaContext: '=[@Opening_Stock] + [@Units_Received] - [@Units_Dispatched]',
      options: [
        '=[@Opening_Stock] - [@Units_Received] + [@Units_Dispatched]',
        '=[@Opening_Stock] + [@Units_Received] - [@Units_Dispatched]',
        '=[@Opening_Stock] * [@Units_Received]',
        '=AVERAGE([@Opening_Stock], [@Units_Dispatched])',
      ],
      correctOptionIndex: 1,
      explanation: 'Closing Stock equals Opening Stock plus new stock received into the warehouse minus units dispatched/sold.',
    },
    q2: {
      questionText: 'Which formula flags a SKU as "REORDER NOW" if Closing_Stock is at or below Reorder_Level, "Overstocked" if Closing_Stock exceeds 3x Reorder_Level, and "Optimal" otherwise?',
      formulaContext: '=IFS([@Closing_Stock]<=[@Reorder_Level], "REORDER NOW", [@Closing_Stock]>(3*[@Reorder_Level]), "Overstocked", TRUE, "Optimal")',
      options: [
        '=IFS([@Closing_Stock]<=[@Reorder_Level], "REORDER NOW", [@Closing_Stock]>(3*[@Reorder_Level]), "Overstocked", TRUE, "Optimal")',
        '=SUMIF([@Closing_Stock], "REORDER NOW")',
        '=COUNTIFS([@Closing_Stock], [@Reorder_Level])',
        '=PROPER([@Closing_Stock])',
      ],
      correctOptionIndex: 0,
      explanation: 'Using IFS (or nested IF) checks the critical stockout threshold first, then the overstock threshold, and defaults to "Optimal".',
    },
    q3: {
      questionText: 'How do you calculate the total naira capital tied up in "Overstocked" items specifically inside "Zone-A"?',
      formulaContext: '=SUMIFS(tbl_Stock[Stock_Value], tbl_Stock[Reorder_Status], "Overstocked", tbl_Stock[Warehouse_Zone], "Zone-A")',
      options: [
        '=SUMIFS(tbl_Stock[Stock_Value], tbl_Stock[Reorder_Status], "Overstocked", tbl_Stock[Warehouse_Zone], "Zone-A")',
        '=COUNTIFS(tbl_Stock[Reorder_Status], "Overstocked")',
        '=XLOOKUP("Zone-A", tbl_Stock[Warehouse_Zone], tbl_Stock[Stock_Value])',
        '=MAX(tbl_Stock[Stock_Value])',
      ],
      correctOptionIndex: 0,
      explanation: 'SUMIFS aggregates Stock_Value filtered simultaneously by Reorder_Status = "Overstocked" and Warehouse_Zone = "Zone-A".',
    },
  },
  'lvl-6-mod-4': {
    q1: {
      questionText: 'In Project 4 (Business Expense & Budget Variance Analysis), if Budget is in C2 (₦4,200,000) and Actual Spend is in D2 (₦5,124,000), what does =C2 - D2 (-₦924,000) indicate?',
      formulaContext: '=Budget - Actual_Spend',
      options: [
        'An unfavorable cost overrun of ₦924,000 (22.0% over budget)',
        'A favorable cost saving of ₦924,000',
        'A formula syntax error',
        'That the department spent zero naira',
      ],
      correctOptionIndex: 0,
      explanation: 'When Actual Spend exceeds Budget, Budget - Actual is negative (-₦924,000), signaling an unfavorable budget overrun.',
    },
    q2: {
      questionText: 'Management wants to flag any expense line that exceeds its budget by more than the tolerance percentage stored in cell $E$1 (10%). Which formula is dynamic when the tolerance in $E$1 is adjusted?',
      formulaContext: '=IF(([@Actual_Spend]-[@Budget])/[@Budget] > $E$1, "Over Budget (>Tolerance)", "Within Tolerance")',
      options: [
        '=IF(([@Actual_Spend]-[@Budget])/[@Budget] > $E$1, "Over Budget (>Tolerance)", "Within Tolerance")',
        '=IF([@Actual_Spend] > 10, "Over Budget")',
        '=SUM([@Budget], $E$1)',
        '=VLOOKUP($E$1, [@Budget], 1)',
      ],
      correctOptionIndex: 0,
      explanation: 'Referencing $E$1 with dollar signs lets finance managers test 5%, 10%, or 15% overrun thresholds instantly.',
    },
    q3: {
      questionText: 'When a departmental expense table is filtered by Cost Center on the sheet, why is =SUBTOTAL(9, tbl_Expenses[Actual_Spend]) superior to =SUM(tbl_Expenses[Actual_Spend])?',
      formulaContext: '=SUBTOTAL(9, tbl_Expenses[Actual_Spend])',
      options: [
        'SUBTOTAL(9, ...) dynamically sums only the currently visible filtered rows so the bottom total always matches what is shown on screen',
        'SUBTOTAL divides the total by 9',
        'SUM does not work on Excel Tables',
        'SUBTOTAL hides negative variances',
      ],
      correctOptionIndex: 0,
      explanation: 'Function number 9 in SUBTOTAL calculates the sum of visible cells only, updating live as you filter departments.',
    },
  },
  'lvl-6-mod-5': {
    q1: {
      questionText: 'In Project 5 (Employee & Operational SLA Performance), each support ticket has Resolved_Hours and Target_SLA_Hours. Which formula evaluates ticket-level SLA compliance?',
      formulaContext: '=IF([@Resolved_Hours] <= [@Target_SLA_Hours], "Met", "Breached")',
      options: [
        '=IF([@Resolved_Hours] <= [@Target_SLA_Hours], "Met", "Breached")',
        '=IF([@Resolved_Hours] > [@Target_SLA_Hours], "Met", "Breached")',
        '=AVERAGE([@Resolved_Hours], [@Target_SLA_Hours])',
        '=COUNT([@Resolved_Hours])',
      ],
      correctOptionIndex: 0,
      explanation: 'A ticket meets its Service Level Agreement (SLA) when actual resolution time is less than or equal to the target SLA window.',
    },
    q2: {
      questionText: 'How do you calculate an agent\'s SLA Compliance Percentage from a raw ticket table using COUNTIFS?',
      formulaContext: '=COUNTIFS(Tickets[Agent], A2, Tickets[SLA_Status], "Met") / COUNTIF(Tickets[Agent], A2)',
      options: [
        '=COUNTIFS(Tickets[Agent], A2, Tickets[SLA_Status], "Met") / COUNTIF(Tickets[Agent], A2)',
        '=SUM(Tickets[Resolved_Hours]) * 100',
        '=MAX(Tickets[CSAT_Score])',
        '=COUNTIF(Tickets[Agent], A2)',
      ],
      correctOptionIndex: 0,
      explanation: 'Dividing the agent\'s "Met" tickets (COUNTIFS) by their total closed tickets (COUNTIF) yields their exact SLA compliance rate.',
    },
    q3: {
      questionText: 'In Project 5, cross-tabulating Ticket Priority against Shift in a PivotTable revealed that high-priority SLA breaches clustered during Afternoon shift handover. Why is this insight valuable?',
      options: [
        'It proves the bottleneck is a shift-overlap scheduling gap rather than blaming individual agents unfairly',
        'It shows the company should delete all Afternoon tickets',
        'It proves CSAT scores are unrelated to resolution time',
        'It means PivotTables cannot analyze time data',
      ],
      correctOptionIndex: 0,
      explanation: 'Cross-tabulating operational dimensions pinpoints systemic process bottlenecks (shift handover staffing) so management fixes the root cause.',
    },
  },
  'lvl-6-mod-6': {
    q1: {
      questionText: 'In Project 6 (Final End-to-End Capstone Dashboard), what is the correct end-to-end workflow order for building a production-grade Excel analysis workbook?',
      options: [
        'Build charts first -> clean data later -> check for duplicates last',
        '1) Audit & Clean Raw Data -> 2) Enrich with Lookups/Calculated Columns in an Excel Table -> 3) Build & Reconcile Pivot Engine -> 4) Design Interactive Dashboard & Executive Briefing',
        'Type numbers manually into shapes without using any tables or PivotTables',
        'Merge all cells on Sheet1 and color them bright yellow',
      ],
      correctOptionIndex: 1,
      explanation: 'A disciplined pipeline (Clean Data -> Enriched Table -> Reconciled Pivot Engine -> Interactive Dashboard & Memo) guarantees accuracy and maintainability.',
    },
    q2: {
      questionText: 'Before publishing your Capstone Dashboard to stakeholders, you click each Region and Quarter Slicer button one by one. What are you testing during this QA step?',
      options: [
        'That every KPI card, dynamic title, and PivotChart updates in sync via Report Connections without throwing #REF!/#DIV/0! errors or resizing columns',
        'Whether clicking a Slicer changes the Windows desktop wallpaper',
        'Whether Slicers delete the raw data sheet',
        'How loud the mouse click sounds',
      ],
      correctOptionIndex: 0,
      explanation: 'Interactive QA testing verifies that all Report Connections, IFERROR guards, and locked column widths hold up under every filter combination.',
    },
    q3: {
      questionText: 'What makes your completed 6-Project Excel Workbook Portfolio stand out to hiring managers and business clients?',
      options: [
        'Clean tabular data models, dynamic formulas (XLOOKUP, SUMIFS, IFS, IFERROR), reconciled PivotTables, interactive Slicers, and concise data-backed business recommendations',
        'Having 50 different font styles in one sheet',
        'Pasting static screenshots with no working formulas',
        'Hiding all negative numbers so every project looks 100% perfect',
      ],
      correctOptionIndex: 0,
      explanation: 'Employers and clients value auditable, error-free workbooks that turn messy data into clear, actionable commercial decisions.',
    },
  },
};

export function createTopicAlignedLessonQuiz(
  levelNum: number,
  moduleId: string,
  lessonId: string,
  moduleTitle: string,
  isSecondLessonLab: boolean
): Quiz {
  const seed = MODULE_QUIZ_BANK[moduleId] || MODULE_QUIZ_BANK['lvl-1-mod-1'];
  const cacheEntry = (youtubeRecommendationsCache as Record<string, any>)[lessonId];
  const primaryVideo =
    cacheEntry?.recommendations?.find((r: any) => r.status === 'approved' && r.isPrimary) ||
    cacheEntry?.recommendations?.[0];

  const videoTitleNote = primaryVideo?.title
    ? ` (Aligned with video: "${primaryVideo.title}")`
    : '';

  const q1Source = isSecondLessonLab && seed.labQ1 ? seed.labQ1 : seed.q1;
  const q2Source = isSecondLessonLab && seed.labQ2 ? seed.labQ2 : seed.q2;
  const q3Source = isSecondLessonLab && seed.labQ3 ? seed.labQ3 : seed.q3;

  // For Lesson 2 (Hands-On Lab), rotate option order slightly or frame with practical application while keeping 100% accuracy
  const buildQuestion = (
    qSeed: {
      questionText: string;
      formulaContext?: string;
      options: string[];
      correctOptionIndex: number;
      explanation: string;
    },
    qNum: number
  ): QuizQuestion => {
    if (!isSecondLessonLab) {
      return {
        id: `${lessonId}-q${qNum}`,
        quizId: `quiz-${lessonId}`,
        questionText: qSeed.questionText,
        formulaContext: qSeed.formulaContext,
        options: qSeed.options,
        correctOptionIndex: qSeed.correctOptionIndex,
        explanation: qSeed.explanation,
      };
    }

    // Rotate options by 1 position for Lesson 2 so students don't memorize option letter positions between Lesson 1 and Lesson 2
    const len = qSeed.options.length;
    const rotatedOptions = qSeed.options.map((_, idx) => qSeed.options[(idx + 1) % len]);
    const newCorrectIdx = (qSeed.correctOptionIndex - 1 + len) % len;

    return {
      id: `${lessonId}-q${qNum}`,
      quizId: `quiz-${lessonId}`,
      questionText:
        qNum === 1
          ? `[Applied Scenario — ${moduleTitle}] ${qSeed.questionText}`
          : qSeed.questionText,
      formulaContext: qSeed.formulaContext,
      options: rotatedOptions,
      correctOptionIndex: newCorrectIdx,
      explanation: qSeed.explanation,
    };
  };

  return {
    id: `quiz-${lessonId}`,
    lessonId,
    moduleId,
    title: `${moduleTitle} — Video & Topic Quiz${videoTitleNote}`,
    passingScorePercent: 67,
    questions: [
      buildQuestion(q1Source, 1),
      buildQuestion(q2Source, 2),
      buildQuestion(q3Source, 3),
    ],
  };
}
