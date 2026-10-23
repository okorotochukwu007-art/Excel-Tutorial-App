/**
 * In-Browser Excel Formula Parsing & Evaluation Engine
 * Supports cell references (A1, $B$2, C3:D10), arithmetic, comparison, logic,
 * lookups (VLOOKUP, XLOOKUP, INDEX/MATCH), math (SUM, AVERAGE, COUNTIF, SUMIFS),
 * text (CONCAT, TRIM, UPPER, PROPER, TEXTJOIN), and detailed syntax error diagnosis.
 */

export interface CellPosition {
  col: number; // 0-indexed (0 = A, 1 = B)
  row: number; // 0-indexed (0 = row 1, 1 = row 2)
}

export interface GridCellData {
  raw: string | number;
  formatted?: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'empty';
}

export type SpreadsheetGrid = (string | number)[][];

export interface FormulaDiagnostic {
  type: 'error' | 'warning' | 'tip';
  code?: '#N/A' | '#VALUE!' | '#REF!' | '#DIV/0!' | '#NAME?' | '#NUM!' | '#NULL!' | 'SYNTAX_ERROR';
  title: string;
  message: string;
  suggestedFix?: string;
  fixedFormula?: string;
  highlightRange?: [number, number];
}

export interface FormulaEvaluationResult {
  rawFormula: string;
  normalizedFormula: string;
  result: string | number | boolean | null;
  displayValue: string;
  isError: boolean;
  errorCode?: string;
  evaluationSteps: string[];
  diagnostic?: FormulaDiagnostic;
  affectedCells?: string[];
}

/**
 * Convert column index (0-based) to letter (0 -> A, 25 -> Z, 26 -> AA)
 */
export function colIndexToLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Convert column letter to 0-based index ('A' -> 0, 'Z' -> 25, 'AA' -> 26)
 */
export function letterToColIndex(letter: string): number {
  const clean = letter.toUpperCase().replace(/[^A-Z]/g, '');
  let index = 0;
  for (let i = 0; i < clean.length; i++) {
    index = index * 26 + (clean.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Parse cell address like 'A1', '$B$3', 'C12' into { col, row }
 */
export function parseCellAddress(addr: string): { col: number; row: number; colLocked: boolean; rowLocked: boolean } | null {
  const match = addr.trim().match(/^(\$?)([A-Z]+)(\$?)([0-9]+)$/i);
  if (!match) return null;
  const colLocked = match[1] === '$';
  const col = letterToColIndex(match[2]);
  const rowLocked = match[3] === '$';
  const row = parseInt(match[4], 10) - 1;
  return { col, row, colLocked, rowLocked };
}

/**
 * Parse range address like 'A1:B10' or '$A$2:$C$20'
 */
export function parseRangeAddress(rangeStr: string): {
  start: { col: number; row: number };
  end: { col: number; row: number };
} | null {
  const parts = rangeStr.split(':');
  if (parts.length !== 2) return null;
  const start = parseCellAddress(parts[0]);
  const end = parseCellAddress(parts[1]);
  if (!start || !end) return null;

  return {
    start: {
      col: Math.min(start.col, end.col),
      row: Math.min(start.row, end.row),
    },
    end: {
      col: Math.max(start.col, end.col),
      row: Math.max(start.row, end.row),
    },
  };
}

/**
 * Extract values from a grid for a given range (e.g. 'B2:B10')
 */
export function getRangeValues(grid: SpreadsheetGrid, rangeStr: string): (string | number)[] {
  const parsed = parseRangeAddress(rangeStr);
  if (!parsed) {
    const single = parseCellAddress(rangeStr);
    if (single && grid[single.row] && grid[single.row][single.col] !== undefined) {
      return [grid[single.row][single.col]];
    }
    return [];
  }

  const values: (string | number)[] = [];
  for (let r = parsed.start.row; r <= parsed.end.row; r++) {
    for (let c = parsed.start.col; c <= parsed.end.col; c++) {
      if (grid[r] && grid[r][c] !== undefined) {
        values.push(grid[r][c]);
      } else {
        values.push('');
      }
    }
  }
  return values;
}

/**
 * Extract 2D matrix of values for a given range (useful for VLOOKUP / INDEX)
 */
export function getRangeMatrix(grid: SpreadsheetGrid, rangeStr: string): (string | number)[][] {
  const parsed = parseRangeAddress(rangeStr);
  if (!parsed) return [];
  const matrix: (string | number)[][] = [];
  for (let r = parsed.start.row; r <= parsed.end.row; r++) {
    const row: (string | number)[] = [];
    for (let c = parsed.start.col; c <= parsed.end.col; c++) {
      if (grid[r] && grid[r][c] !== undefined) {
        row.push(grid[r][c]);
      } else {
        row.push('');
      }
    }
    matrix.push(row);
  }
  return matrix;
}

/**
 * Known Excel Functions supported in our Playground
 */
export const SUPPORTED_FUNCTIONS: Record<string, {
  name: string;
  category: 'Math & Stats' | 'Lookup & Reference' | 'Logic' | 'Text' | 'Date & Time';
  syntax: string;
  description: string;
  example: string;
}> = {
  SUM: {
    name: 'SUM',
    category: 'Math & Stats',
    syntax: '=SUM(number1, [number2], ... or range)',
    description: 'Adds all numbers in a range of cells.',
    example: '=SUM(E2:E10)',
  },
  AVERAGE: {
    name: 'AVERAGE',
    category: 'Math & Stats',
    syntax: '=AVERAGE(range)',
    description: 'Returns the numerical average (arithmetic mean) of its arguments.',
    example: '=AVERAGE(E2:E10)',
  },
  COUNT: {
    name: 'COUNT',
    category: 'Math & Stats',
    syntax: '=COUNT(range)',
    description: 'Counts the number of cells that contain numbers.',
    example: '=COUNT(E2:E10)',
  },
  COUNTA: {
    name: 'COUNTA',
    category: 'Math & Stats',
    syntax: '=COUNTA(range)',
    description: 'Counts the number of cells that are not empty.',
    example: '=COUNTA(B2:B10)',
  },
  COUNTBLANK: {
    name: 'COUNTBLANK',
    category: 'Math & Stats',
    syntax: '=COUNTBLANK(range)',
    description: 'Counts empty cells in a specified range of cells.',
    example: '=COUNTBLANK(C2:C10)',
  },
  MIN: {
    name: 'MIN',
    category: 'Math & Stats',
    syntax: '=MIN(range)',
    description: 'Returns the smallest number in a set of values.',
    example: '=MIN(E2:E10)',
  },
  MAX: {
    name: 'MAX',
    category: 'Math & Stats',
    syntax: '=MAX(range)',
    description: 'Returns the largest number in a set of values.',
    example: '=MAX(E2:E10)',
  },
  ROUND: {
    name: 'ROUND',
    category: 'Math & Stats',
    syntax: '=ROUND(number, num_digits)',
    description: 'Rounds a number to a specified number of digits.',
    example: '=ROUND(AVERAGE(E2:E10), 2)',
  },
  COUNTIF: {
    name: 'COUNTIF',
    category: 'Math & Stats',
    syntax: '=COUNTIF(range, criteria)',
    description: 'Counts the number of cells within a range that meet the given condition.',
    example: '=COUNTIF(C2:C10, "East")',
  },
  COUNTIFS: {
    name: 'COUNTIFS',
    category: 'Math & Stats',
    syntax: '=COUNTIFS(criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
    description: 'Counts the number of times that all criteria are met across multiple ranges.',
    example: '=COUNTIFS(C2:C10, "East", D2:D10, "Technology")',
  },
  SUMIF: {
    name: 'SUMIF',
    category: 'Math & Stats',
    syntax: '=SUMIF(range, criteria, [sum_range])',
    description: 'Adds the cells specified by a given condition or criteria.',
    example: '=SUMIF(C2:C10, "East", E2:E10)',
  },
  SUMIFS: {
    name: 'SUMIFS',
    category: 'Math & Stats',
    syntax: '=SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
    description: 'Adds cells in a range that meet multiple criteria.',
    example: '=SUMIFS(E2:E10, C2:C10, "East", D2:D10, "Furniture")',
  },
  AVERAGEIF: {
    name: 'AVERAGEIF',
    category: 'Math & Stats',
    syntax: '=AVERAGEIF(range, criteria, [average_range])',
    description: 'Computes the average for the cells specified by a given condition.',
    example: '=AVERAGEIF(C2:C10, "West", E2:E10)',
  },
  IF: {
    name: 'IF',
    category: 'Logic',
    syntax: '=IF(logical_test, value_if_true, [value_if_false])',
    description: 'Checks whether a condition is met, returning one value if TRUE, and another if FALSE.',
    example: '=IF(E2>=500, "High Value", "Standard")',
  },
  IFS: {
    name: 'IFS',
    category: 'Logic',
    syntax: '=IFS(logical_test1, value_if_true1, [logical_test2, value_if_true2], ...)',
    description: 'Checks multiple conditions and returns a value corresponding to the first TRUE condition.',
    example: '=IFS(E2>1000, "Tier 1", E2>500, "Tier 2", TRUE, "Tier 3")',
  },
  AND: {
    name: 'AND',
    category: 'Logic',
    syntax: '=AND(logical1, [logical2], ...)',
    description: 'Returns TRUE if all of its arguments evaluate to TRUE.',
    example: '=AND(E2>100, F2>5)',
  },
  OR: {
    name: 'OR',
    category: 'Logic',
    syntax: '=OR(logical1, [logical2], ...)',
    description: 'Returns TRUE if any argument is TRUE, and FALSE if all arguments are FALSE.',
    example: '=OR(C2="East", C2="West")',
  },
  NOT: {
    name: 'NOT',
    category: 'Logic',
    syntax: '=NOT(logical)',
    description: 'Reverses the logic of its argument.',
    example: '=NOT(C2="East")',
  },
  IFERROR: {
    name: 'IFERROR',
    category: 'Logic',
    syntax: '=IFERROR(value, value_if_error)',
    description: 'Returns value_if_error if formula evaluates to an error; otherwise returns the formula result.',
    example: '=IFERROR(VLOOKUP("E-999", A2:E10, 5, FALSE), "Not Found")',
  },
  VLOOKUP: {
    name: 'VLOOKUP',
    category: 'Lookup & Reference',
    syntax: '=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])',
    description: 'Looks up a value in the leftmost column of a table and returns a value in the same row from a specified column.',
    example: '=VLOOKUP("E-101", A2:E10, 5, FALSE)',
  },
  XLOOKUP: {
    name: 'XLOOKUP',
    category: 'Lookup & Reference',
    syntax: '=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode])',
    description: 'Modern successor to VLOOKUP: searches a range or array and returns an item corresponding to the first match found.',
    example: '=XLOOKUP("E-102", A2:A10, E2:E10, "Not Found")',
  },
  INDEX: {
    name: 'INDEX',
    category: 'Lookup & Reference',
    syntax: '=INDEX(array, row_num, [column_num])',
    description: 'Returns a value or reference of the cell at the intersection of a particular row and column.',
    example: '=INDEX(E2:E10, 3)',
  },
  MATCH: {
    name: 'MATCH',
    category: 'Lookup & Reference',
    syntax: '=MATCH(lookup_value, lookup_array, [match_type])',
    description: 'Returns the relative position of an item in an array that matches a specified value.',
    example: '=MATCH("E-103", A2:A10, 0)',
  },
  CONCAT: {
    name: 'CONCAT',
    category: 'Text',
    syntax: '=CONCAT(text1, [text2], ...)',
    description: 'Combines the text from multiple ranges and/or strings.',
    example: '=CONCAT(B2, " - ", C2)',
  },
  TEXTJOIN: {
    name: 'TEXTJOIN',
    category: 'Text',
    syntax: '=TEXTJOIN(delimiter, ignore_empty, text1, [text2], ...)',
    description: 'Combines the text from multiple ranges and/or strings with a specified delimiter.',
    example: '=TEXTJOIN(", ", TRUE, B2:B5)',
  },
  TRIM: {
    name: 'TRIM',
    category: 'Text',
    syntax: '=TRIM(text)',
    description: 'Removes all leading and trailing spaces from text except for single spaces between words.',
    example: '=TRIM(B2)',
  },
  UPPER: {
    name: 'UPPER',
    category: 'Text',
    syntax: '=UPPER(text)',
    description: 'Converts text to all uppercase letters.',
    example: '=UPPER(B2)',
  },
  LOWER: {
    name: 'LOWER',
    category: 'Text',
    syntax: '=LOWER(text)',
    description: 'Converts all letters in a text string to lowercase.',
    example: '=LOWER(B2)',
  },
  PROPER: {
    name: 'PROPER',
    category: 'Text',
    syntax: '=PROPER(text)',
    description: 'Capitalizes the first letter in each word of a text value.',
    example: '=PROPER(B2)',
  },
  LEN: {
    name: 'LEN',
    category: 'Text',
    syntax: '=LEN(text)',
    description: 'Returns the number of characters in a text string.',
    example: '=LEN(B2)',
  },
  LEFT: {
    name: 'LEFT',
    category: 'Text',
    syntax: '=LEFT(text, [num_chars])',
    description: 'Returns the specified number of characters from the start of a text string.',
    example: '=LEFT(A2, 3)',
  },
  RIGHT: {
    name: 'RIGHT',
    category: 'Text',
    syntax: '=RIGHT(text, [num_chars])',
    description: 'Returns the specified number of characters from the end of a text string.',
    example: '=RIGHT(A2, 3)',
  },
  MID: {
    name: 'MID',
    category: 'Text',
    syntax: '=MID(text, start_num, num_chars)',
    description: 'Returns characters from the middle of a text string, given a starting position and length.',
    example: '=MID(A2, 3, 3)',
  },
  TODAY: {
    name: 'TODAY',
    category: 'Date & Time',
    syntax: '=TODAY()',
    description: 'Returns the current date.',
    example: '=TODAY()',
  },
};

/**
 * Diagnostic Linter: analyzes formula text before/during evaluation
 * to give beginner-friendly advice on common mistakes.
 */
export function diagnoseFormula(formula: string, grid: SpreadsheetGrid): FormulaDiagnostic | null {
  const trimmed = formula.trim();

  // 1. Missing leading equals sign
  if (!trimmed.startsWith('=')) {
    // Check if it looks like a formula function
    const upper = trimmed.toUpperCase();
    for (const fn of Object.keys(SUPPORTED_FUNCTIONS)) {
      if (upper.startsWith(fn + '(')) {
        return {
          type: 'warning',
          code: 'SYNTAX_ERROR',
          title: 'Missing Leading Equals Sign (=)',
          message: `In Excel, all formulas must begin with an equals sign (=). Without it, Excel treats "${trimmed}" as plain text instead of calculating.`,
          suggestedFix: `Add "=" to the beginning: =${trimmed}`,
          fixedFormula: `=${trimmed}`,
        };
      }
    }
    return null;
  }

  const body = trimmed.substring(1).trim();

  // 2. Unbalanced Parentheses
  let openCount = 0;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '(') openCount++;
    if (body[i] === ')') openCount--;
    if (openCount < 0) {
      return {
        type: 'error',
        code: 'SYNTAX_ERROR',
        title: 'Unexpected Closing Parenthesis ")"',
        message: 'You have a closing parenthesis ")" with no matching opening "(" before it.',
        suggestedFix: 'Remove the extra closing parenthesis.',
      };
    }
  }
  if (openCount > 0) {
    const fixed = trimmed + ')'.repeat(openCount);
    const suffix = openCount === 1 ? 'is ")"' : 'es ")"';
    const isOrEs = openCount === 1 ? 'is' : 'es';
    const missingParens = ')'.repeat(openCount);
    return {
      type: 'error',
      code: 'SYNTAX_ERROR',
      title: `Missing ${openCount} Closing Parenthes${suffix}`,
      message: `Excel formulas require every opening "(" to have a matching closing ")". You are missing ${openCount} closing parenthes${isOrEs}.`,
      suggestedFix: `Close the formula with "${missingParens}"`,
      fixedFormula: fixed,
    };
  }

  // 3. Typo in common function name (e.g., =VLOOKP, =XLOOKP, =SUMM, =AVERGE)
  const fnMatch = body.match(/^([A-Z_]+)\s*\(/i);
  if (fnMatch) {
    const typedFn = fnMatch[1].toUpperCase();
    if (!SUPPORTED_FUNCTIONS[typedFn]) {
      // Find closest supported function name
      const candidates = Object.keys(SUPPORTED_FUNCTIONS);
      let bestMatch = '';
      for (const cand of candidates) {
        if (cand.startsWith(typedFn) || typedFn.startsWith(cand) || cand.includes(typedFn) || typedFn.includes(cand)) {
          bestMatch = cand;
          break;
        }
      }
      if (bestMatch) {
        const fixed = '=' + bestMatch + body.substring(typedFn.length);
        return {
          type: 'error',
          code: '#NAME?',
          title: `Unrecognized Function Name: "${typedFn}"`,
          message: `Excel does not recognize the function name "${typedFn}". Did you mean "${bestMatch}"? In Excel, a typo in a function name causes a #NAME? error.`,
          suggestedFix: `Replace "${typedFn}" with "${bestMatch}"`,
          fixedFormula: fixed,
        };
      }
    }
  }

  // 4. Semicolon used instead of colon in range (e.g., A2;A10 instead of A2:A10)
  const semiRangeMatch = body.match(/([A-Z]+[0-9]+);([A-Z]+[0-9]+)/i);
  if (semiRangeMatch) {
    const fixed = trimmed.replace(/([A-Z]+[0-9]+);([A-Z]+[0-9]+)/i, '$1:$2');
    return {
      type: 'warning',
      code: 'SYNTAX_ERROR',
      title: 'Range Syntax: Colon (:) Expected Instead of Semicolon (;)',
      message: `In Excel, a continuous range of cells uses a colon (like ${semiRangeMatch[1]}:${semiRangeMatch[2]}), not a semicolon.`,
      suggestedFix: `Change to "${semiRangeMatch[1]}:${semiRangeMatch[2]}"`,
      fixedFormula: fixed,
    };
  }

  // 5. Unquoted string in IF condition, e.g. =IF(C2=East, ...) instead of =IF(C2="East", ...)
  const unquotedIfMatch = body.match(/IF\s*\(\s*([A-Z]+[0-9]+)\s*(=|<>|>|<|>=|<=)\s*([A-Za-z]+)\s*,/i);
  if (unquotedIfMatch) {
    const unquotedText = unquotedIfMatch[3];
    if (!['TRUE', 'FALSE'].includes(unquotedText.toUpperCase())) {
      const fixed = trimmed.replace(
        new RegExp(`(IF\\s*\\(\\s*[A-Z]+[0-9]+\\s*(?:=|<>|>|<|>=|<=)\\s*)${unquotedText}(\\s*,)`, 'i'),
        `$1"${unquotedText}"$2`
      );
      return {
        type: 'warning',
        code: '#NAME?',
        title: `Unquoted Text String: "${unquotedText}"`,
        message: `In Excel, literal text must be wrapped in double quotes (e.g. "${unquotedText}"). Without quotes, Excel thinks "${unquotedText}" is a named range or function and produces #NAME?.`,
        suggestedFix: `Wrap text in double quotes: "${unquotedText}"`,
        fixedFormula: fixed,
      };
    }
  }

  // 6. VLOOKUP exact match warning: if 4th parameter omitted
  const vlookupMatch = body.match(/VLOOKUP\s*\(([^,]+),([^,]+),([^,)]+)\)/i);
  if (vlookupMatch) {
    const fixed = trimmed.replace(/VLOOKUP\s*\(([^,]+),([^,]+),([^,)]+)\)/i, 'VLOOKUP($1,$2,$3, FALSE)');
    return {
      type: 'tip',
      title: 'VLOOKUP Best Practice: Specify Exact Match (FALSE)',
      message: 'When using VLOOKUP, omitting the 4th argument defaults to TRUE (approximate match), which can return wrong rows on unsorted data. In 99% of business lookups, pass FALSE or 0 for exact match.',
      suggestedFix: 'Add FALSE as the 4th argument for reliable exact matching',
      fixedFormula: fixed,
    };
  }

  // 7. XLOOKUP range dimension mismatch check
  const xlookupMatch = body.match(/XLOOKUP\s*\(\s*([^,]+)\s*,\s*([A-Z0-9$:]+)\s*,\s*([A-Z0-9$:]+)/i);
  if (xlookupMatch) {
    const range1 = parseRangeAddress(xlookupMatch[2]);
    const range2 = parseRangeAddress(xlookupMatch[3]);
    if (range1 && range2) {
      const height1 = range1.end.row - range1.start.row + 1;
      const height2 = range2.end.row - range2.start.row + 1;
      if (height1 !== height2) {
        return {
          type: 'error',
          code: '#VALUE!',
          title: 'XLOOKUP Dimension Mismatch (#VALUE!)',
          message: `The lookup range (${xlookupMatch[2]} has ${height1} rows) and return range (${xlookupMatch[3]} has ${height2} rows) must have the exact same number of rows. Otherwise Excel returns #VALUE!.`,
          suggestedFix: `Make both ranges the same row length (e.g. ${xlookupMatch[2].split(':')[0]}:${xlookupMatch[2].split(':')[0][0]}${range1.start.row + height1})`,
        };
      }
    }
  }

  // 8. SUMIFS range dimension mismatch check
  const sumifsMatch = body.match(/SUMIFS\s*\(\s*([A-Z0-9$:]+)\s*,\s*([A-Z0-9$:]+)\s*,/i);
  if (sumifsMatch) {
    const sumRange = parseRangeAddress(sumifsMatch[1]);
    const critRange = parseRangeAddress(sumifsMatch[2]);
    if (sumRange && critRange) {
      const hSum = sumRange.end.row - sumRange.start.row + 1;
      const hCrit = critRange.end.row - critRange.start.row + 1;
      if (hSum !== hCrit) {
        return {
          type: 'error',
          code: '#VALUE!',
          title: 'SUMIFS Range Dimension Mismatch (#VALUE!)',
          message: `The sum_range (${sumifsMatch[1]} with ${hSum} rows) and criteria_range (${sumifsMatch[2]} with ${hCrit} rows) must be identical in size, or Excel returns #VALUE!.`,
          suggestedFix: 'Ensure all ranges in SUMIFS cover the exact same row span',
        };
      }
    }
  }

  return null;
}

/**
 * Split top-level comma-separated arguments inside a function call
 * respecting nested parentheses and quoted strings.
 */
function splitArguments(argString: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;

  for (let i = 0; i < argString.length; i++) {
    const char = argString[i];
    if (char === '"' && (i === 0 || argString[i - 1] !== '\\')) {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '(' && !inQuotes) {
      depth++;
      current += char;
    } else if (char === ')' && !inQuotes) {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0 && !inQuotes) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim().length > 0) {
    args.push(current.trim());
  }
  return args;
}

/**
 * Clean and parse a criterion (e.g. ">50", "<=100", "=East", "East", "<>West")
 */
function testCriteria(value: string | number, criteria: string | number): boolean {
  if (typeof criteria === 'number') {
    return Number(value) === criteria;
  }
  const critStr = String(criteria).trim();
  const valNum = Number(value);
  const isValNum = !isNaN(valNum) && value !== '';

  if (critStr.startsWith('>=')) {
    const target = Number(critStr.substring(2).trim());
    return isValNum && valNum >= target;
  }
  if (critStr.startsWith('<=')) {
    const target = Number(critStr.substring(2).trim());
    return isValNum && valNum <= target;
  }
  if (critStr.startsWith('<>')) {
    const target = critStr.substring(2).trim().replace(/^"|"$/g, '');
    return String(value).toLowerCase() !== target.toLowerCase();
  }
  if (critStr.startsWith('>')) {
    const target = Number(critStr.substring(1).trim());
    return isValNum && valNum > target;
  }
  if (critStr.startsWith('<')) {
    const target = Number(critStr.substring(1).trim());
    return isValNum && valNum < target;
  }
  if (critStr.startsWith('=')) {
    const target = critStr.substring(1).trim().replace(/^"|"$/g, '');
    return String(value).toLowerCase() === target.toLowerCase();
  }

  // Exact match (case insensitive)
  const cleanTarget = critStr.replace(/^"|"$/g, '');
  return String(value).toLowerCase() === cleanTarget.toLowerCase();
}

/**
 * Main recursive evaluator for formula expressions
 */
export function evaluateExpression(
  expr: string,
  grid: SpreadsheetGrid,
  steps: string[] = []
): { value: any; isError: boolean; errorCode?: string } {
  const trimmed = expr.trim();

  // If empty
  if (!trimmed) return { value: '', isError: false };

  // Remove leading equals sign if present
  const cleanExpr = trimmed.startsWith('=') ? trimmed.substring(1).trim() : trimmed;

  // 1. Quoted string literal e.g. "East" or "Hello"
  if (cleanExpr.startsWith('"') && cleanExpr.endsWith('"') && cleanExpr.length >= 2) {
    return { value: cleanExpr.slice(1, -1), isError: false };
  }

  // 2. Pure number literal
  if (!isNaN(Number(cleanExpr)) && cleanExpr !== '') {
    return { value: Number(cleanExpr), isError: false };
  }

  // 3. Boolean literals
  if (cleanExpr.toUpperCase() === 'TRUE') return { value: true, isError: false };
  if (cleanExpr.toUpperCase() === 'FALSE') return { value: false, isError: false };

  // 4. Single Cell Reference e.g. A1, $B$3, C10
  const cellMatch = cleanExpr.match(/^(\$?)([A-Z]+)(\$?)([0-9]+)$/i);
  if (cellMatch) {
    const parsed = parseCellAddress(cleanExpr);
    if (parsed) {
      const r = parsed.row;
      const c = parsed.col;
      if (grid[r] && grid[r][c] !== undefined) {
        const val = grid[r][c];
        steps.push(`Resolved ${cleanExpr.toUpperCase()} → ${JSON.stringify(val)}`);
        return { value: val, isError: false };
      }
      steps.push(`Resolved ${cleanExpr.toUpperCase()} → Empty/0`);
      return { value: 0, isError: false };
    }
  }

  // 5. Function Call e.g. SUM(...), XLOOKUP(...)
  const fnMatch = cleanExpr.match(/^([A-Z_]+)\s*\((.*)\)$/is);
  if (fnMatch) {
    const fnName = fnMatch[1].toUpperCase();
    const innerArgs = fnMatch[2];
    const args = splitArguments(innerArgs);

    steps.push(`Evaluating function ${fnName} with ${args.length} argument(s)`);

    switch (fnName) {
      case 'SUM': {
        let total = 0;
        for (const arg of args) {
          if (arg.includes(':')) {
            const vals = getRangeValues(grid, arg);
            vals.forEach((v) => {
              const n = Number(v);
              if (!isNaN(n)) total += n;
            });
          } else {
            const ev = evaluateExpression(arg, grid, steps);
            const n = Number(ev.value);
            if (!isNaN(n)) total += n;
          }
        }
        return { value: total, isError: false };
      }

      case 'AVERAGE': {
        let total = 0;
        let count = 0;
        for (const arg of args) {
          if (arg.includes(':')) {
            const vals = getRangeValues(grid, arg);
            vals.forEach((v) => {
              const n = Number(v);
              if (!isNaN(n) && v !== '') {
                total += n;
                count++;
              }
            });
          } else {
            const ev = evaluateExpression(arg, grid, steps);
            const n = Number(ev.value);
            if (!isNaN(n) && ev.value !== '') {
              total += n;
              count++;
            }
          }
        }
        if (count === 0) return { value: '#DIV/0!', isError: true, errorCode: '#DIV/0!' };
        return { value: Number((total / count).toFixed(4)), isError: false };
      }

      case 'COUNT': {
        let count = 0;
        for (const arg of args) {
          if (arg.includes(':')) {
            const vals = getRangeValues(grid, arg);
            vals.forEach((v) => {
              if (typeof v === 'number' || (!isNaN(Number(v)) && String(v).trim() !== '')) count++;
            });
          } else {
            const ev = evaluateExpression(arg, grid, steps);
            if (typeof ev.value === 'number') count++;
          }
        }
        return { value: count, isError: false };
      }

      case 'COUNTA': {
        let count = 0;
        for (const arg of args) {
          if (arg.includes(':')) {
            const vals = getRangeValues(grid, arg);
            vals.forEach((v) => {
              if (v !== '' && v !== null && v !== undefined) count++;
            });
          } else {
            const ev = evaluateExpression(arg, grid, steps);
            if (ev.value !== '' && ev.value !== null && ev.value !== undefined) count++;
          }
        }
        return { value: count, isError: false };
      }

      case 'COUNTBLANK': {
        let count = 0;
        if (args[0] && args[0].includes(':')) {
          const vals = getRangeValues(grid, args[0]);
          vals.forEach((v) => {
            if (v === '' || v === null || v === undefined) count++;
          });
        }
        return { value: count, isError: false };
      }

      case 'MIN': {
        let min = Infinity;
        for (const arg of args) {
          const vals = arg.includes(':') ? getRangeValues(grid, arg) : [evaluateExpression(arg, grid, steps).value];
          vals.forEach((v) => {
            const n = Number(v);
            if (!isNaN(n) && v !== '' && n < min) min = n;
          });
        }
        return { value: min === Infinity ? 0 : min, isError: false };
      }

      case 'MAX': {
        let max = -Infinity;
        for (const arg of args) {
          const vals = arg.includes(':') ? getRangeValues(grid, arg) : [evaluateExpression(arg, grid, steps).value];
          vals.forEach((v) => {
            const n = Number(v);
            if (!isNaN(n) && v !== '' && n > max) max = n;
          });
        }
        return { value: max === -Infinity ? 0 : max, isError: false };
      }

      case 'ROUND': {
        if (args.length < 1) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const numEv = evaluateExpression(args[0], grid, steps);
        const digitsEv = args[1] ? evaluateExpression(args[1], grid, steps) : { value: 0 };
        const factor = Math.pow(10, Number(digitsEv.value) || 0);
        return { value: Math.round(Number(numEv.value) * factor) / factor, isError: false };
      }

      case 'COUNTIF': {
        if (args.length < 2) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const vals = getRangeValues(grid, args[0]);
        const critEv = evaluateExpression(args[1], grid, steps);
        let count = 0;
        vals.forEach((v) => {
          if (testCriteria(v, critEv.value)) count++;
        });
        steps.push(`COUNTIF: tested ${vals.length} cells against "${critEv.value}", matched ${count}`);
        return { value: count, isError: false };
      }

      case 'COUNTIFS': {
        if (args.length < 2 || args.length % 2 !== 0) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const pairs: { vals: (string | number)[]; crit: any }[] = [];
        for (let i = 0; i < args.length; i += 2) {
          const vals = getRangeValues(grid, args[i]);
          const crit = evaluateExpression(args[i + 1], grid, steps).value;
          pairs.push({ vals, crit });
        }
        const len = pairs[0].vals.length;
        let count = 0;
        for (let rowIdx = 0; rowIdx < len; rowIdx++) {
          const allMatch = pairs.every((p) => testCriteria(p.vals[rowIdx], p.crit));
          if (allMatch) count++;
        }
        return { value: count, isError: false };
      }

      case 'SUMIF': {
        if (args.length < 2) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const critRange = getRangeValues(grid, args[0]);
        const crit = evaluateExpression(args[1], grid, steps).value;
        const sumRange = args[2] ? getRangeValues(grid, args[2]) : critRange;
        let sum = 0;
        for (let i = 0; i < critRange.length; i++) {
          if (testCriteria(critRange[i], crit)) {
            const n = Number(sumRange[i]);
            if (!isNaN(n)) sum += n;
          }
        }
        steps.push(`SUMIF: condition "${crit}" produced sum of ${sum}`);
        return { value: sum, isError: false };
      }

      case 'SUMIFS': {
        if (args.length < 3) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const sumVals = getRangeValues(grid, args[0]);
        const pairs: { vals: (string | number)[]; crit: any }[] = [];
        for (let i = 1; i < args.length; i += 2) {
          const vals = getRangeValues(grid, args[i]);
          const crit = evaluateExpression(args[i + 1], grid, steps).value;
          pairs.push({ vals, crit });
        }
        let total = 0;
        for (let i = 0; i < sumVals.length; i++) {
          const allMatch = pairs.every((p) => testCriteria(p.vals[i], p.crit));
          if (allMatch) {
            const n = Number(sumVals[i]);
            if (!isNaN(n)) total += n;
          }
        }
        return { value: total, isError: false };
      }

      case 'AVERAGEIF': {
        if (args.length < 2) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const critRange = getRangeValues(grid, args[0]);
        const crit = evaluateExpression(args[1], grid, steps).value;
        const avgRange = args[2] ? getRangeValues(grid, args[2]) : critRange;
        let sum = 0;
        let count = 0;
        for (let i = 0; i < critRange.length; i++) {
          if (testCriteria(critRange[i], crit)) {
            const n = Number(avgRange[i]);
            if (!isNaN(n)) {
              sum += n;
              count++;
            }
          }
        }
        if (count === 0) return { value: '#DIV/0!', isError: true, errorCode: '#DIV/0!' };
        return { value: Number((sum / count).toFixed(4)), isError: false };
      }

      case 'IF': {
        if (args.length < 2) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const cond = evaluateCondition(args[0], grid, steps);
        steps.push(`IF: logical test "${args[0]}" evaluated to ${cond}`);
        if (cond) {
          return evaluateExpression(args[1], grid, steps);
        } else {
          return args[2] !== undefined ? evaluateExpression(args[2], grid, steps) : { value: false, isError: false };
        }
      }

      case 'IFS': {
        if (args.length < 2 || args.length % 2 !== 0) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        for (let i = 0; i < args.length; i += 2) {
          const cond = evaluateCondition(args[i], grid, steps);
          if (cond) {
            steps.push(`IFS: condition #${(i / 2) + 1} "${args[i]}" is TRUE → returning "${args[i + 1]}"`);
            return evaluateExpression(args[i + 1], grid, steps);
          }
        }
        return { value: '#N/A', isError: true, errorCode: '#N/A' };
      }

      case 'AND': {
        const results = args.map((a) => evaluateCondition(a, grid, steps));
        return { value: results.every(Boolean), isError: false };
      }

      case 'OR': {
        const results = args.map((a) => evaluateCondition(a, grid, steps));
        return { value: results.some(Boolean), isError: false };
      }

      case 'NOT': {
        const cond = evaluateCondition(args[0] || 'FALSE', grid, steps);
        return { value: !cond, isError: false };
      }

      case 'IFERROR': {
        if (args.length < 2) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const primary = evaluateExpression(args[0], grid, steps);
        if (primary.isError) {
          steps.push(`IFERROR caught error ${primary.errorCode || '#ERROR'} → returning fallback`);
          return evaluateExpression(args[1], grid, steps);
        }
        return primary;
      }

      case 'VLOOKUP': {
        if (args.length < 3) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const lookupVal = evaluateExpression(args[0], grid, steps).value;
        const matrix = getRangeMatrix(grid, args[1]);
        const colIdx = Number(evaluateExpression(args[2], grid, steps).value);

        if (isNaN(colIdx) || colIdx < 1) {
          return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        }
        if (matrix.length === 0 || colIdx > matrix[0].length) {
          return { value: '#REF!', isError: true, errorCode: '#REF!' };
        }

        const cleanLookup = String(lookupVal).trim().toLowerCase();
        let foundRow: (string | number)[] | null = null;

        for (const row of matrix) {
          const rowVal = String(row[0]).trim().toLowerCase();
          if (rowVal === cleanLookup) {
            foundRow = row;
            break;
          }
        }

        if (!foundRow) {
          steps.push(`VLOOKUP: lookup_value "${lookupVal}" not found in column 1 → #N/A`);
          return { value: '#N/A', isError: true, errorCode: '#N/A' };
        }

        const resultVal = foundRow[colIdx - 1];
        steps.push(`VLOOKUP: found "${lookupVal}" → col ${colIdx} value is ${JSON.stringify(resultVal)}`);
        return { value: resultVal, isError: false };
      }

      case 'XLOOKUP': {
        if (args.length < 3) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const lookupVal = evaluateExpression(args[0], grid, steps).value;
        const lookupArr = getRangeValues(grid, args[1]);
        const returnArr = getRangeValues(grid, args[2]);
        const notFoundVal = args[3] ? evaluateExpression(args[3], grid, steps).value : '#N/A';

        if (lookupArr.length !== returnArr.length) {
          return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        }

        const cleanLookup = String(lookupVal).trim().toLowerCase();
        let matchIdx = -1;
        for (let i = 0; i < lookupArr.length; i++) {
          if (String(lookupArr[i]).trim().toLowerCase() === cleanLookup) {
            matchIdx = i;
            break;
          }
        }

        if (matchIdx === -1) {
          if (args[3]) {
            steps.push(`XLOOKUP: value "${lookupVal}" not found → using if_not_found: "${notFoundVal}"`);
            return { value: notFoundVal, isError: false };
          }
          steps.push(`XLOOKUP: value "${lookupVal}" not found in lookup_array → #N/A`);
          return { value: '#N/A', isError: true, errorCode: '#N/A' };
        }

        const res = returnArr[matchIdx];
        steps.push(`XLOOKUP: matched at index ${matchIdx + 1} → returning ${JSON.stringify(res)}`);
        return { value: res, isError: false };
      }

      case 'INDEX': {
        if (args.length < 2) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const matrix = getRangeMatrix(grid, args[0]);
        const rowNum = Number(evaluateExpression(args[1], grid, steps).value);
        const colNum = args[2] ? Number(evaluateExpression(args[2], grid, steps).value) : 1;

        if (rowNum < 1 || rowNum > matrix.length) {
          return { value: '#REF!', isError: true, errorCode: '#REF!' };
        }
        const row = matrix[rowNum - 1];
        if (colNum < 1 || colNum > row.length) {
          return { value: '#REF!', isError: true, errorCode: '#REF!' };
        }
        return { value: row[colNum - 1], isError: false };
      }

      case 'MATCH': {
        if (args.length < 2) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const lookupVal = evaluateExpression(args[0], grid, steps).value;
        const arr = getRangeValues(grid, args[1]);
        const cleanLookup = String(lookupVal).trim().toLowerCase();
        let matchIdx = -1;
        for (let i = 0; i < arr.length; i++) {
          if (String(arr[i]).trim().toLowerCase() === cleanLookup) {
            matchIdx = i + 1; // 1-indexed relative position in Excel
            break;
          }
        }
        if (matchIdx === -1) return { value: '#N/A', isError: true, errorCode: '#N/A' };
        return { value: matchIdx, isError: false };
      }

      case 'CONCAT':
      case 'CONCATENATE': {
        let str = '';
        for (const arg of args) {
          if (arg.includes(':')) {
            const vals = getRangeValues(grid, arg);
            str += vals.join('');
          } else {
            const ev = evaluateExpression(arg, grid, steps);
            str += String(ev.value ?? '');
          }
        }
        return { value: str, isError: false };
      }

      case 'TEXTJOIN': {
        if (args.length < 3) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
        const delimiter = String(evaluateExpression(args[0], grid, steps).value ?? '');
        const ignoreEmpty = evaluateExpression(args[1], grid, steps).value === true || String(args[1]).toUpperCase() === 'TRUE';
        const parts: string[] = [];
        for (let i = 2; i < args.length; i++) {
          const arg = args[i];
          if (arg.includes(':')) {
            const vals = getRangeValues(grid, arg);
            vals.forEach((v) => {
              if (!ignoreEmpty || (v !== '' && v !== null && v !== undefined)) {
                parts.push(String(v));
              }
            });
          } else {
            const ev = evaluateExpression(arg, grid, steps);
            if (!ignoreEmpty || (ev.value !== '' && ev.value !== null && ev.value !== undefined)) {
              parts.push(String(ev.value));
            }
          }
        }
        return { value: parts.join(delimiter), isError: false };
      }

      case 'TRIM': {
        const ev = evaluateExpression(args[0] || '""', grid, steps);
        return { value: String(ev.value ?? '').trim().replace(/\s+/g, ' '), isError: false };
      }

      case 'UPPER': {
        const ev = evaluateExpression(args[0] || '""', grid, steps);
        return { value: String(ev.value ?? '').toUpperCase(), isError: false };
      }

      case 'LOWER': {
        const ev = evaluateExpression(args[0] || '""', grid, steps);
        return { value: String(ev.value ?? '').toLowerCase(), isError: false };
      }

      case 'PROPER': {
        const ev = evaluateExpression(args[0] || '""', grid, steps);
        const s = String(ev.value ?? '').toLowerCase();
        return {
          value: s.replace(/\b([a-z])/g, (m) => m.toUpperCase()),
          isError: false,
        };
      }

      case 'LEN': {
        const ev = evaluateExpression(args[0] || '""', grid, steps);
        return { value: String(ev.value ?? '').length, isError: false };
      }

      case 'LEFT': {
        const text = String(evaluateExpression(args[0] || '""', grid, steps).value ?? '');
        const count = args[1] ? Number(evaluateExpression(args[1], grid, steps).value) : 1;
        return { value: text.substring(0, isNaN(count) ? 1 : count), isError: false };
      }

      case 'RIGHT': {
        const text = String(evaluateExpression(args[0] || '""', grid, steps).value ?? '');
        const count = args[1] ? Number(evaluateExpression(args[1], grid, steps).value) : 1;
        const validCount = isNaN(count) ? 1 : count;
        return { value: text.substring(Math.max(0, text.length - validCount)), isError: false };
      }

      case 'MID': {
        const text = String(evaluateExpression(args[0] || '""', grid, steps).value ?? '');
        const start = Number(evaluateExpression(args[1] || '1', grid, steps).value) - 1; // 1-indexed to 0-indexed
        const len = Number(evaluateExpression(args[2] || '1', grid, steps).value);
        return { value: text.substring(Math.max(0, start), Math.max(0, start) + len), isError: false };
      }

      case 'TODAY': {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return { value: `${yyyy}-${mm}-${dd}`, isError: false };
      }

      default: {
        return { value: '#NAME?', isError: true, errorCode: '#NAME?' };
      }
    }
  }

  // 6. Binary Operators (+, -, *, /, &, etc.)
  // Handle string concatenation &
  if (cleanExpr.includes('&')) {
    const parts = splitTopLevelOperator(cleanExpr, '&');
    if (parts.length > 1) {
      const evaluated = parts.map((p) => evaluateExpression(p, grid, steps).value);
      return { value: evaluated.join(''), isError: false };
    }
  }

  // Handle + and -
  const addSubParts = splitAddSub(cleanExpr);
  if (addSubParts.length > 1) {
    let acc = 0;
    for (const item of addSubParts) {
      const ev = evaluateExpression(item.expr, grid, steps);
      const n = Number(ev.value);
      if (isNaN(n)) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
      acc = item.op === '+' ? acc + n : acc - n;
    }
    return { value: acc, isError: false };
  }

  // Handle * and /
  const mulDivParts = splitMulDiv(cleanExpr);
  if (mulDivParts.length > 1) {
    let acc: number | null = null;
    for (const item of mulDivParts) {
      const ev = evaluateExpression(item.expr, grid, steps);
      const n = Number(ev.value);
      if (isNaN(n)) return { value: '#VALUE!', isError: true, errorCode: '#VALUE!' };
      if (acc === null) {
        acc = n;
      } else if (item.op === '*') {
        acc = acc * n;
      } else {
        if (n === 0) return { value: '#DIV/0!', isError: true, errorCode: '#DIV/0!' };
        acc = acc / n;
      }
    }
    return { value: acc ?? 0, isError: false };
  }

  return { value: cleanExpr, isError: false };
}

/**
 * Evaluate logical condition (e.g. C2="East", E2>=500, F2<>0)
 */
function evaluateCondition(condExpr: string, grid: SpreadsheetGrid, steps: string[]): boolean {
  const trimmed = condExpr.trim();
  const ops = ['>=', '<=', '<>', '=', '>', '<'];

  for (const op of ops) {
    const parts = splitTopLevelOperator(trimmed, op);
    if (parts.length === 2) {
      const left = evaluateExpression(parts[0], grid, steps).value;
      const right = evaluateExpression(parts[1], grid, steps).value;

      const leftNum = Number(left);
      const rightNum = Number(right);
      const bothNumbers = !isNaN(leftNum) && !isNaN(rightNum) && left !== '' && right !== '';

      if (op === '=') {
        return String(left).toLowerCase() === String(right).toLowerCase();
      }
      if (op === '<>') {
        return String(left).toLowerCase() !== String(right).toLowerCase();
      }
      if (bothNumbers) {
        if (op === '>') return leftNum > rightNum;
        if (op === '<') return leftNum < rightNum;
        if (op === '>=') return leftNum >= rightNum;
        if (op === '<=') return leftNum <= rightNum;
      } else {
        if (op === '>') return String(left) > String(right);
        if (op === '<') return String(left) < String(right);
        if (op === '>=') return String(left) >= String(right);
        if (op === '<=') return String(left) <= String(right);
      }
    }
  }

  // Single boolean or number
  const single = evaluateExpression(trimmed, grid, steps).value;
  return Boolean(single && single !== 'FALSE' && single !== 0);
}

/**
 * Split an expression by an operator only at the top level
 */
function splitTopLevelOperator(expr: string, op: string): string[] {
  let depth = 0;
  let inQuotes = false;
  for (let i = 0; i <= expr.length - op.length; i++) {
    const c = expr[i];
    if (c === '"') inQuotes = !inQuotes;
    if (!inQuotes) {
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (depth === 0 && expr.substring(i, i + op.length) === op) {
        return [expr.substring(0, i).trim(), expr.substring(i + op.length).trim()];
      }
    }
  }
  return [expr];
}

function splitAddSub(expr: string): { op: '+' | '-'; expr: string }[] {
  const tokens: { op: '+' | '-'; expr: string }[] = [];
  let depth = 0;
  let inQuotes = false;
  let lastIdx = 0;
  let currentOp: '+' | '-' = '+';

  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '"') inQuotes = !inQuotes;
    if (!inQuotes) {
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (depth === 0 && (c === '+' || c === '-') && i > 0 && expr[i - 1] !== '(') {
        tokens.push({ op: currentOp, expr: expr.substring(lastIdx, i).trim() });
        currentOp = c as '+' | '-';
        lastIdx = i + 1;
      }
    }
  }
  if (lastIdx < expr.length) {
    tokens.push({ op: currentOp, expr: expr.substring(lastIdx).trim() });
  }
  return tokens;
}

function splitMulDiv(expr: string): { op: '*' | '/'; expr: string }[] {
  const tokens: { op: '*' | '/'; expr: string }[] = [];
  let depth = 0;
  let inQuotes = false;
  let lastIdx = 0;
  let currentOp: '*' | '/' = '*';

  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '"') inQuotes = !inQuotes;
    if (!inQuotes) {
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (depth === 0 && (c === '*' || c === '/') && i > 0) {
        tokens.push({ op: currentOp, expr: expr.substring(lastIdx, i).trim() });
        currentOp = c as '*' | '/';
        lastIdx = i + 1;
      }
    }
  }
  if (lastIdx < expr.length) {
    tokens.push({ op: currentOp, expr: expr.substring(lastIdx).trim() });
  }
  return tokens;
}

/**
 * High-level evaluator that runs diagnostics, tracks evaluation steps,
 * and formats the final result for UI display.
 */
export function evaluateExcelFormula(
  formula: string,
  grid: SpreadsheetGrid
): FormulaEvaluationResult {
  const raw = formula.trim();
  const steps: string[] = [];

  // Check diagnostics first
  const diag = diagnoseFormula(raw, grid);
  if (diag && diag.type === 'error') {
    return {
      rawFormula: raw,
      normalizedFormula: raw,
      result: diag.code || '#VALUE!',
      displayValue: diag.code || '#VALUE!',
      isError: true,
      errorCode: diag.code,
      evaluationSteps: [`Syntax analysis failed: ${diag.title}`],
      diagnostic: diag,
    };
  }

  // Collect affected cell references
  const cellRefMatches = raw.match(/\$?[A-Z]+\$?[0-9]+(?::\$?[A-Z]+\$?[0-9]+)?/gi) || [];
  const affectedCells = Array.from(new Set(cellRefMatches.map((c) => c.toUpperCase())));

  const evalResult = evaluateExpression(raw, grid, steps);

  let display = '';
  if (evalResult.isError) {
    display = String(evalResult.value);
  } else if (typeof evalResult.value === 'number') {
    display = Number.isInteger(evalResult.value)
      ? evalResult.value.toLocaleString()
      : evalResult.value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  } else if (typeof evalResult.value === 'boolean') {
    display = evalResult.value ? 'TRUE' : 'FALSE';
  } else if (evalResult.value === null || evalResult.value === undefined) {
    display = '';
  } else {
    display = String(evalResult.value);
  }

  // Attach tip/warning diagnostic if present
  let finalDiag = diag;
  if (!finalDiag && evalResult.isError) {
    // Generate explanation for runtime Excel errors
    if (evalResult.errorCode === '#N/A') {
      finalDiag = {
        type: 'error',
        code: '#N/A',
        title: '#N/A Error: Value Not Available',
        message: 'The lookup formula could not find an exact match in the target lookup array. If using XLOOKUP, specify the 4th argument [if_not_found] to return a friendly message like "Not Found".',
      };
    } else if (evalResult.errorCode === '#DIV/0!') {
      finalDiag = {
        type: 'error',
        code: '#DIV/0!',
        title: '#DIV/0! Error: Division by Zero',
        message: 'A formula attempted to divide a number by zero or by an empty cell. Wrap your formula in =IFERROR(..., 0) or check that your divisor cell contains a non-zero value.',
      };
    } else if (evalResult.errorCode === '#REF!') {
      finalDiag = {
        type: 'error',
        code: '#REF!',
        title: '#REF! Error: Invalid Cell Reference',
        message: 'The formula refers to a cell, column, or row that does not exist in the referenced table range (e.g. col_index_num exceeds the number of table columns).',
      };
    } else if (evalResult.errorCode === '#VALUE!') {
      finalDiag = {
        type: 'error',
        code: '#VALUE!',
        title: '#VALUE! Error: Incorrect Data Type or Dimension',
        message: 'A mathematical formula encountered text where a number was expected, or array ranges in XLOOKUP/SUMIFS have different row lengths.',
      };
    }
  }

  return {
    rawFormula: raw,
    normalizedFormula: raw.startsWith('=') ? raw : `=${raw}`,
    result: evalResult.value,
    displayValue: display,
    isError: evalResult.isError,
    errorCode: evalResult.errorCode,
    evaluationSteps: steps,
    diagnostic: finalDiag || undefined,
    affectedCells,
  };
}
