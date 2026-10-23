import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Code,
  Copy,
  Check,
  Wand2,
  BookOpen,
  Trophy,
  Table,
  Terminal,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  CheckCheck,
} from 'lucide-react';
import {
  evaluateExcelFormula,
  colIndexToLetter,
  SUPPORTED_FUNCTIONS,
  SpreadsheetGrid,
  FormulaEvaluationResult,
} from '../utils/excelFormulaEngine';
import {
  PLAYGROUND_DATASETS,
  PLAYGROUND_CHALLENGES,
  PlaygroundDataset,
  PlaygroundChallenge,
} from '../data/playgroundDatasets';

interface FormulaPlaygroundViewProps {
  initialFormula?: string;
  initialDatasetId?: string;
  onNavigateToLessons?: () => void;
}

export const FormulaPlaygroundView: React.FC<FormulaPlaygroundViewProps> = ({
  initialFormula = '=SUM(E2:E11)',
  initialDatasetId = 'sales',
  onNavigateToLessons,
}) => {
  // Active dataset
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(initialDatasetId);
  const currentDataset = useMemo(
    () => PLAYGROUND_DATASETS.find((d) => d.id === selectedDatasetId) || PLAYGROUND_DATASETS[0],
    [selectedDatasetId]
  );

  // Editable grid state (headers are row 0, data is row 1+)
  const [gridData, setGridData] = useState<(string | number)[][]>([]);

  // Formula bar state
  const [formulaInput, setFormulaInput] = useState<string>(initialFormula);
  const [evaluationResult, setEvaluationResult] = useState<FormulaEvaluationResult | null>(null);

  // Active cell selection
  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number } | null>({
    col: 4,
    row: 1, // E2 by default
  });

  // UI tabs & panels
  const [activeTab, setActiveTab] = useState<'sandbox' | 'challenges' | 'cheatsheet'>('sandbox');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(
    PLAYGROUND_CHALLENGES[0].id
  );
  const [challengeStatus, setChallengeStatus] = useState<Record<string, { passed: boolean; message: string }>>({});
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [editingCell, setEditingCell] = useState<{ col: number; row: number } | null>(null);
  const [editingCellValue, setEditingCellValue] = useState<string>('');

  // Initialize grid when dataset changes
  useEffect(() => {
    const rawMatrix: (string | number)[][] = [
      currentDataset.headers,
      ...currentDataset.rows.map((r) => [...r]),
    ];
    setGridData(rawMatrix);
  }, [currentDataset]);

  // Recalculate formula when grid or formula changes
  useEffect(() => {
    if (gridData.length > 0 && formulaInput.trim()) {
      const res = evaluateExcelFormula(formulaInput, gridData);
      setEvaluationResult(res);
    }
  }, [formulaInput, gridData]);

  // Handle auto-fix click
  const handleApplyAutoFix = (fixed: string) => {
    setFormulaInput(fixed);
  };

  // Reset current dataset to original values
  const handleResetDataset = () => {
    const rawMatrix: (string | number)[][] = [
      currentDataset.headers,
      ...currentDataset.rows.map((r) => [...r]),
    ];
    setGridData(rawMatrix);
  };

  // Cell editing commit
  const handleSaveCellEdit = (colIdx: number, rowIdx: number) => {
    if (editingCell) {
      const newGrid = gridData.map((row) => [...row]);
      const parsedNum = Number(editingCellValue);
      newGrid[rowIdx][colIdx] =
        !isNaN(parsedNum) && editingCellValue.trim() !== ''
          ? parsedNum
          : editingCellValue;
      setGridData(newGrid);
      setEditingCell(null);
    }
  };

  // Cell click handler
  const handleCellClick = (colIdx: number, rowIdx: number) => {
    setSelectedCell({ col: colIdx, row: rowIdx });
  };

  // Check current challenge
  const activeChallenge = useMemo(
    () => PLAYGROUND_CHALLENGES.find((c) => c.id === selectedChallengeId) || PLAYGROUND_CHALLENGES[0],
    [selectedChallengeId]
  );

  const handleValidateChallenge = () => {
    if (!evaluationResult) return;
    const outcome = activeChallenge.validate(evaluationResult.result, formulaInput);
    setChallengeStatus((prev) => ({
      ...prev,
      [activeChallenge.id]: outcome,
    }));
  };

  // Calculate highlighted cells based on formula
  const isCellHighlighted = (colIdx: number, rowIdx: number): boolean => {
    if (!evaluationResult || !evaluationResult.affectedCells) return false;
    const colLetter = colIndexToLetter(colIdx);
    const rowNum = rowIdx + 1;
    const cellAddr = `${colLetter}${rowNum}`;

    for (const ref of evaluationResult.affectedCells) {
      if (ref.includes(':')) {
        const [startStr, endStr] = ref.replace(/\$/g, '').split(':');
        const startMatch = startStr.match(/^([A-Z]+)([0-9]+)$/);
        const endMatch = endStr.match(/^([A-Z]+)([0-9]+)$/);
        if (startMatch && endMatch) {
          const sCol = startMatch[1];
          const sRow = parseInt(startMatch[2], 10);
          const eCol = endMatch[1];
          const eRow = parseInt(endMatch[2], 10);
          if (
            colLetter >= sCol &&
            colLetter <= eCol &&
            rowNum >= sRow &&
            rowNum <= eRow
          ) {
            return true;
          }
        }
      } else {
        const cleanRef = ref.replace(/\$/g, '');
        if (cleanRef === cellAddr) return true;
      }
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-800 pb-20">
      {/* TOP HEADER */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Terminal className="w-3.5 h-3.5" />
                  Live Formula Sandbox &amp; Engine
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Excel Syntax Evaluator v2.0
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                In-Browser Excel Formula Playground
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Test Excel formulas live on sample business sheets. Get instant
                calculations, plain-English error diagnoses, and 1-click auto-fix
                suggestions.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveTab('sandbox')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'sandbox'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Table className="w-4 h-4" />
                <span>Formula Sandbox</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('challenges')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'challenges'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Guided Challenges</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                  {PLAYGROUND_CHALLENGES.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cheatsheet')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'cheatsheet'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Formula Reference</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* DATASET PICKER & CONTROL BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Dataset:
            </span>
            {PLAYGROUND_DATASETS.map((ds) => (
              <button
                key={ds.id}
                type="button"
                onClick={() => {
                  setSelectedDatasetId(ds.id);
                  if (ds.suggestedFormulas[0]) {
                    setFormulaInput(ds.suggestedFormulas[0].formula);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                  selectedDatasetId === ds.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                {ds.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDataset}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              title="Reset data cells to original values"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sample Data</span>
            </button>
          </div>
        </div>

        {/* GUIDED CHALLENGE BANNER (when challenges tab active) */}
        {activeTab === 'challenges' && (
          <div className="mb-6 bg-white border border-emerald-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {activeChallenge.difficulty}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Category: {activeChallenge.category}
                </span>
              </div>

              {/* Challenge Selector */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                {PLAYGROUND_CHALLENGES.map((ch, idx) => {
                  const status = challengeStatus[ch.id];
                  const isCurrent = ch.id === activeChallenge.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        setSelectedChallengeId(ch.id);
                        if (ch.datasetId !== selectedDatasetId) {
                          setSelectedDatasetId(ch.datasetId);
                        }
                        if (ch.starterFormula) {
                          setFormulaInput(ch.starterFormula);
                        }
                      }}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-emerald-800 text-white font-bold'
                          : status?.passed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {status?.passed && <Check className="w-3 h-3 text-emerald-600" />}
                      <span>Challenge #{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {activeChallenge.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">Business Scenario: </span>
                  {activeChallenge.scenario}
                </p>
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs text-emerald-950 font-medium">
                  🎯 <span className="font-bold">Goal:</span> {activeChallenge.goal}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Formula Hint:</span>
                  </div>
                  <div className="text-xs font-mono text-slate-600 break-all bg-white p-2 rounded border border-slate-200">
                    {activeChallenge.hint}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleValidateChallenge}
                    className="w-full px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check My Formula Result</span>
                  </button>
                </div>
              </div>
            </div>

            {challengeStatus[activeChallenge.id] && (
              <div
                className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 ${
                  challengeStatus[activeChallenge.id].passed
                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 font-semibold'
                    : 'bg-amber-100 border border-amber-300 text-amber-900'
                }`}
              >
                {challengeStatus[activeChallenge.id].passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  {challengeStatus[activeChallenge.id].message}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXCEL FORMULA BAR (MAIN INTERACTION) */}
        <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Active Cell:
              </span>
              <span className="px-2.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-emerald-700">
                {selectedCell
                  ? `${colIndexToLetter(selectedCell.col)}${selectedCell.row + 1}`
                  : 'FX'}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">
                Type any formula starting with <code className="font-bold text-slate-800">=</code>
              </span>
            </div>

            {/* Quick recipe dropdown buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] text-slate-500 font-semibold">Try Formula:</span>
              {currentDataset.suggestedFormulas.slice(0, 4).map((f) => (
                <button
                  key={f.title}
                  type="button"
                  onClick={() => setFormulaInput(f.formula)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded text-[11px] font-mono text-slate-700 transition-colors shrink-0 cursor-pointer"
                  title={f.explanation}
                >
                  {f.formula.split('(')[0]}()
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 flex flex-col sm:flex-row items-stretch gap-3">
            {/* fx icon */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center font-serif italic font-bold text-emerald-800 text-base shrink-0 select-none">
                fx
              </div>
            </div>

            {/* Formula Input Box */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const res = evaluateExcelFormula(formulaInput, gridData);
                    setEvaluationResult(res);
                  }
                }}
                placeholder="Type an Excel formula, e.g. =SUM(E2:E11) or =XLOOKUP('ORD-104', A2:A11, E2:E11)"
                className="w-full h-11 px-4 text-sm font-mono font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const res = evaluateExcelFormula(formulaInput, gridData);
                  setEvaluationResult(res);
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Evaluate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(formulaInput);
                  setCopiedFormula(true);
                  setTimeout(() => setCopiedFormula(false), 2000);
                }}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Copy formula text"
              >
                {copiedFormula ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {copiedFormula ? 'Copied' : 'Copy'}
                </span>
              </button>
            </div>
          </div>

          {/* CALCULATION RESULT BADGE & ERROR EXPLAINER */}
          {evaluationResult && (
            <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Calculated Result:
                  </span>
                  <div
                    className={`px-4 py-1.5 rounded-lg font-mono text-base font-bold shadow-sm flex items-center gap-2 ${
                      evaluationResult.isError
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : typeof evaluationResult.result === 'number'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-blue-100 text-blue-900 border border-blue-300'
                    }`}
                  >
                    {evaluationResult.isError ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{evaluationResult.displayValue || 'Empty'}</span>
                  </div>
                </div>

                {evaluationResult.affectedCells && evaluationResult.affectedCells.length > 0 && (
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">Referenced Cells:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-emerald-800 font-semibold">
                      {evaluationResult.affectedCells.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* INSTANT ERROR EXPLAINER CARD */}
              {evaluationResult.diagnostic && (
                <div
                  className={`p-4 rounded-xl border space-y-2.5 ${
                    evaluationResult.diagnostic.type === 'error'
                      ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                      : evaluationResult.diagnostic.type === 'warning'
                      ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                      : 'bg-blue-50/90 border-blue-200 text-blue-950'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {evaluationResult.diagnostic.type === 'error' ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      ) : evaluationResult.diagnostic.type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      ) : (
                        <Info className="w-5 h-5 text-blue-600 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-75">
                          {evaluationResult.diagnostic.type === 'error'
                            ? 'Error Diagnosis & Why This Happened'
                            : 'Formula Best Practice & Hint'}
                        </div>
                        <div className="text-sm font-bold">
                          {evaluationResult.diagnostic.title}
                        </div>
                      </div>
                    </div>

                    {evaluationResult.diagnostic.code && (
                      <span className="px-2.5 py-1 rounded font-mono font-bold text-xs bg-white/80 border border-rose-300 text-rose-800">
                        {evaluationResult.diagnostic.code}
                      </span>
                    )}
                  </div>

                  <p className="text-xs leading-relaxed pl-7">
                    {evaluationResult.diagnostic.message}
                  </p>

                  {evaluationResult.diagnostic.fixedFormula && (
                    <div className="pt-2 pl-7 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold">Recommended Fix:</span>
                      <code className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded border border-slate-300">
                        {evaluationResult.diagnostic.fixedFormula}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          evaluationResult.diagnostic?.fixedFormula &&
                          handleApplyAutoFix(evaluationResult.diagnostic.fixedFormula)
                        }
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Apply Auto-Fix</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* EVALUATION STEPS ACCORDION */}
              {evaluationResult.evaluationSteps.length > 0 && (
                <details className="text-xs text-slate-600 pt-1 group">
                  <summary className="font-semibold text-slate-700 cursor-pointer hover:text-slate-900 flex items-center gap-1.5 select-none">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Step-by-Step Formula Evaluation Breakdown</span>
                  </summary>
                  <div className="mt-2 p-3 bg-white border border-slate-200 rounded-lg font-mono space-y-1.5 text-[11px] text-slate-700">
                    {evaluationResult.evaluationSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-slate-400 select-none">Step {idx + 1}:</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* SPREADSHEET TABLE GRID (INTERACTIVE) */}
        <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Table className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold tracking-wide">
                Spreadsheet Grid: {currentDataset.name}
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                ({gridData.length > 0 ? gridData.length - 1 : 0} rows ×{' '}
                {currentDataset.headers.length} columns)
              </span>
            </div>

            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Double-click any cell to edit value &amp; recalculate</span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full border-collapse text-left font-sans text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 sticky top-0 z-10 select-none">
                  <th className="w-12 px-2 py-2 text-center text-slate-400 font-mono text-[11px] border-r border-slate-300 bg-slate-200/80">
                    #
                  </th>
                  {currentDataset.headers.map((h, colIdx) => (
                    <th
                      key={colIdx}
                      className="px-3.5 py-2 font-semibold text-slate-800 border-r border-slate-300 font-mono text-xs whitespace-nowrap"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{h}</span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {colIndexToLetter(colIdx)}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {gridData.slice(1).map((row, rowIdx) => {
                  const actualRowNumber = rowIdx + 2; // Row 1 is headers, so data starts at row 2 in Excel
                  return (
                    <tr
                      key={rowIdx}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Row index column */}
                      <td className="px-2 py-2 text-center font-mono text-[11px] text-slate-500 bg-slate-100/70 border-r border-slate-300 font-semibold select-none">
                        {actualRowNumber}
                      </td>

                      {/* Cells */}
                      {row.map((cellVal, colIdx) => {
                        const isSelected =
                          selectedCell?.col === colIdx &&
                          selectedCell?.row === rowIdx + 1;
                        const isHighlighted = isCellHighlighted(colIdx, rowIdx + 1);
                        const isEditing =
                          editingCell?.col === colIdx &&
                          editingCell?.row === rowIdx + 1;

                        const isNumeric =
                          typeof cellVal === 'number' ||
                          (!isNaN(Number(cellVal)) && cellVal !== '');

                        return (
                          <td
                            key={colIdx}
                            onClick={() => handleCellClick(colIdx, rowIdx + 1)}
                            onDoubleClick={() => {
                              setEditingCell({ col: colIdx, row: rowIdx + 1 });
                              setEditingCellValue(String(cellVal));
                            }}
                            className={`px-3.5 py-2 border-r border-slate-200 text-xs transition-colors cursor-cell relative ${
                              isSelected
                                ? 'bg-emerald-100/80 ring-2 ring-emerald-600 ring-inset font-semibold text-slate-900'
                                : isHighlighted
                                ? 'bg-emerald-50 text-emerald-950 font-medium'
                                : 'text-slate-700'
                            }`}
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                type="text"
                                value={editingCellValue}
                                onChange={(e) => setEditingCellValue(e.target.value)}
                                onBlur={() => handleSaveCellEdit(colIdx, rowIdx + 1)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveCellEdit(colIdx, rowIdx + 1);
                                  } else if (e.key === 'Escape') {
                                    setEditingCell(null);
                                  }
                                }}
                                className="w-full px-1 py-0.5 font-mono text-xs border border-emerald-600 rounded bg-white text-slate-900 focus:outline-none"
                              />
                            ) : (
                              <span
                                className={`block ${
                                  isNumeric ? 'text-right font-mono' : 'text-left'
                                }`}
                              >
                                {typeof cellVal === 'number'
                                  ? cellVal.toLocaleString()
                                  : String(cellVal)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div>
              Tip: Click any cell to inspect its coordinate in the Formula Bar.
            </div>
            <div className="font-mono text-[11px]">
              Ready · Press Enter in Formula Bar to Evaluate
            </div>
          </div>
        </div>

        {/* CHEATSHEET & FORMULA RECIPE LIBRARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Preset Formulas for this Dataset */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Formula Recipes for {currentDataset.badge}
              </h3>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {currentDataset.suggestedFormulas.map((rec) => (
                <div
                  key={rec.title}
                  onClick={() => setFormulaInput(rec.formula)}
                  className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-lg transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-800">
                      {rec.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {rec.category}
                    </span>
                  </div>
                  <code className="text-xs font-mono font-semibold text-emerald-800 block truncate">
                    {rec.formula}
                  </code>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {rec.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Functions Quick Reference */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Supported Excel Functions Reference
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {Object.keys(SUPPORTED_FUNCTIONS).length} Functions Built-in
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {Object.values(SUPPORTED_FUNCTIONS).map((fn) => (
                <div
                  key={fn.name}
                  onClick={() => setFormulaInput(fn.example)}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-400 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-emerald-800">
                      {fn.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {fn.category}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 truncate">
                    {fn.syntax}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {fn.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM CALL TO ACTION: BACK TO LESSONS */}
        {onNavigateToLessons && (
          <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold">
                Ready to continue your guided curriculum?
              </h3>
              <p className="text-xs text-slate-300">
                Jump back into your course video lessons, practice workbooks, and
                assessments.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToLessons}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
            >
              <span>Return to Lesson Curriculum</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
