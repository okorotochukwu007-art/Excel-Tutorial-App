import React, { useState } from 'react';
import { ArrowRight, Table, Calculator, BarChart3 } from 'lucide-react';

type EvolutionStage = 'raw' | 'formulas' | 'dashboard';

export const HeroSpreadsheetPreview: React.FC = () => {
  const [stage, setStage] = useState<EvolutionStage>('dashboard');
  const [selectedCell, setSelectedCell] = useState<{
    address: string;
    formula: string;
    explanation: string;
  }>({
    address: 'F4',
    formula: '=SUMIFS(tbl_Sales[Net_Revenue], tbl_Sales[Region], "Lagos", tbl_Sales[Quarter], "Q3")',
    explanation: 'Aggregates Q3 net revenue for the Lagos regional branch from the structured sales table.',
  });

  const stageMeta: Record<
    EvolutionStage,
    { label: string; formulaBarAddress: string; formulaBarText: string; subtitle: string }
  > = {
    raw: {
      label: '1. Raw Messy Export',
      formulaBarAddress: 'B3',
      formulaBarText: '  lagos - enterprise hardware  ',
      subtitle: 'Unformatted CSV export with inconsistent casing, extra spaces, and missing totals (Demonstration Dataset)',
    },
    formulas: {
      label: '2. Cleaned Table & XLOOKUP',
      formulaBarAddress: selectedCell.address,
      formulaBarText: selectedCell.formula,
      subtitle: 'Structured Excel Table with TRIM, XLOOKUP, and SUMIFS formulas (Click any highlighted cell)',
    },
    dashboard: {
      label: '3. Executive Pivot Dashboard',
      formulaBarAddress: 'D2',
      formulaBarText: '=GETPIVOTDATA("Net_Revenue", Pivot_Engine!$A$3, "Region", Slicer_Region)',
      subtitle: 'Interactive KPI summary, regional PivotTable, and quarterly variance bars (Demonstration Model)',
    },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between h-full">
      {/* Window Header & Stage Switcher */}
      <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-emerald-400 font-semibold">XLSX</span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-slate-200">Regional_Sales_Analysis_Demo.xlsx</span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-300 font-mono">Demonstration Data</span>
        </div>

        {/* Interactive 3-Step Evolution Control */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setStage('raw')}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              stage === 'raw' ? 'bg-emerald-700 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            1. Raw Data
          </button>
          <button
            type="button"
            onClick={() => setStage('formulas')}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              stage === 'formulas' ? 'bg-emerald-700 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            2. Formulas
          </button>
          <button
            type="button"
            onClick={() => setStage('dashboard')}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              stage === 'dashboard' ? 'bg-emerald-700 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            3. Dashboard
          </button>
        </div>
      </div>

      {/* Genuine Excel Formula Bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center gap-2 text-xs font-mono">
        <span className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-semibold min-w-[42px] text-center">
          {stageMeta[stage].formulaBarAddress}
        </span>
        <span className="text-slate-400 italic font-serif px-1 select-none">fx</span>
        <div className="bg-white border border-slate-300 rounded px-3 py-1 text-emerald-900 flex-1 overflow-x-auto whitespace-nowrap">
          {stageMeta[stage].formulaBarText}
        </div>
      </div>

      {/* Stage Subtitle */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-2">
        <span>{stageMeta[stage].subtitle}</span>
        {stage !== 'dashboard' && (
          <button
            type="button"
            onClick={() => setStage(stage === 'raw' ? 'formulas' : 'dashboard')}
            className="text-emerald-800 font-semibold hover:underline flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Next Step
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-white">
        {stage === 'raw' && (
          <div className="space-y-3">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th className="py-2 px-2.5 border-r border-slate-200 w-8 text-center">#</th>
                    <th className="py-2 px-3 border-r border-slate-200">A: raw_date</th>
                    <th className="py-2 px-3 border-r border-slate-200">B: branch_category</th>
                    <th className="py-2 px-3 border-r border-slate-200 text-right">C: qty</th>
                    <th className="py-2 px-3 text-right">D: unit_price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  <tr>
                    <td className="py-2 px-2.5 bg-slate-50 border-r border-slate-200 text-center text-slate-400">2</td>
                    <td className="py-2 px-3 border-r border-slate-200">14/07/2026</td>
                    <td className="py-2 px-3 border-r border-slate-200 bg-amber-50/70">  lagos - enterprise hardware </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right">18</td>
                    <td className="py-2 px-3 text-right">125000</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 bg-slate-50 border-r border-slate-200 text-center text-slate-400">3</td>
                    <td className="py-2 px-3 border-r border-slate-200">2026.07.19</td>
                    <td className="py-2 px-3 border-r border-slate-200">ABUJA - CLOUD SUBSCRIPTIONS</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right">45</td>
                    <td className="py-2 px-3 text-right">38000</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 bg-slate-50 border-r border-slate-200 text-center text-slate-400">4</td>
                    <td className="py-2 px-3 border-r border-slate-200">19-Jul-26</td>
                    <td className="py-2 px-3 border-r border-slate-200 bg-rose-50/70">ABUJA - CLOUD SUBSCRIPTIONS (DUP)</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right">45</td>
                    <td className="py-2 px-3 text-right">38000</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 bg-slate-50 border-r border-slate-200 text-center text-slate-400">5</td>
                    <td className="py-2 px-3 border-r border-slate-200">03/08/2026</td>
                    <td className="py-2 px-3 border-r border-slate-200">Port Harcourt - Networking</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right">12</td>
                    <td className="py-2 px-3 text-right">94000</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900">What You Fix in Levels 1–3:</p>
              <p>
                Remove duplicate row 4, split region and category using <code className="text-emerald-800">TEXTSPLIT</code> / Text to Columns, standardize dates, and apply <code className="text-emerald-800">=PROPER(TRIM(B2))</code>.
              </p>
            </div>
          </div>
        )}

        {stage === 'formulas' && (
          <div className="space-y-3">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="bg-emerald-900 text-white">
                    <th className="py-2 px-2 border-r border-emerald-800 text-center">Row</th>
                    <th className="py-2 px-2.5 border-r border-emerald-800">A: Region</th>
                    <th className="py-2 px-2.5 border-r border-emerald-800">B: Category</th>
                    <th className="py-2 px-2.5 border-r border-emerald-800 text-right">C: Units</th>
                    <th className="py-2 px-2.5 border-r border-emerald-800 text-right">D: Price</th>
                    <th className="py-2 px-2.5 border-r border-emerald-800 text-right">E: Revenue</th>
                    <th className="py-2 px-2.5 text-left">F: Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  <tr>
                    <td className="py-2 px-2 bg-slate-50 border-r border-slate-200 text-center text-slate-400">2</td>
                    <td className="py-2 px-2.5 border-r border-slate-200">Lagos</td>
                    <td className="py-2 px-2.5 border-r border-slate-200">Enterprise Hardware</td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-right">18</td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-right">125,000</td>
                    <td
                      onClick={() =>
                        setSelectedCell({
                          address: 'E2',
                          formula: '=[@Units]*[@Price]',
                          explanation: 'Structured table multiplication calculating line-item gross revenue.',
                        })
                      }
                      className="py-2 px-2.5 border-r border-slate-200 text-right bg-emerald-50 font-semibold text-emerald-900 cursor-pointer hover:bg-emerald-100"
                    >
                      2,250,000
                    </td>
                    <td
                      onClick={() =>
                        setSelectedCell({
                          address: 'F2',
                          formula: '=IF([@Revenue]>=1500000, "Above Target", "Review")',
                          explanation: 'Logical IF test checking whether invoice revenue meets the 1.5M benchmark.',
                        })
                      }
                      className="py-2 px-2.5 bg-amber-50/70 font-semibold text-slate-900 cursor-pointer hover:bg-amber-100"
                    >
                      Above Target
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 bg-slate-50 border-r border-slate-200 text-center text-slate-400">3</td>
                    <td className="py-2 px-2.5 border-r border-slate-200">Abuja</td>
                    <td className="py-2 px-2.5 border-r border-slate-200">Cloud Subscriptions</td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-right">45</td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-right">38,000</td>
                    <td
                      onClick={() =>
                        setSelectedCell({
                          address: 'E3',
                          formula: '=[@Units]*XLOOKUP([@Category], tbl_Prices[Category], tbl_Prices[Unit_Price])',
                          explanation: 'Retrieves unit price dynamically from the master pricing sheet via XLOOKUP.',
                        })
                      }
                      className="py-2 px-2.5 border-r border-slate-200 text-right bg-emerald-50 font-semibold text-emerald-900 cursor-pointer hover:bg-emerald-100"
                    >
                      1,710,000
                    </td>
                    <td className="py-2 px-2.5">Above Target</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 bg-slate-50 border-r border-slate-200 text-center text-slate-400">4</td>
                    <td className="py-2 px-2.5 border-r border-slate-200">Port Harcourt</td>
                    <td className="py-2 px-2.5 border-r border-slate-200">Networking Gear</td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-right">12</td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-right">94,000</td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-right">1,128,000</td>
                    <td className="py-2 px-2.5 text-amber-800">Review</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">Formula Inspector ({selectedCell.address}): </span>
              <span>{selectedCell.explanation}</span>
            </div>
          </div>
        )}

        {stage === 'dashboard' && (
          <div className="space-y-4">
            {/* KPI Summary Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[11px] text-slate-500">Q3 Net Revenue (Demo)</div>
                <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">₦36.47M</div>
                <div className="text-[11px] text-emerald-800 font-mono tabular-nums mt-0.5">▲ +8.5% vs Q2</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[11px] text-slate-500">Gross Margin Ratio</div>
                <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">38.4%</div>
                <div className="text-[11px] text-emerald-800 font-mono tabular-nums mt-0.5">Target: 35.0%</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[11px] text-slate-500">Top Category Share</div>
                <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">41.5%</div>
                <div className="text-[11px] text-slate-600 font-mono mt-0.5">Cloud Subscriptions</div>
              </div>
            </div>

            {/* PivotChart Horizontal Bar Comparison */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">PivotChart: Revenue by Product Line (Q3)</span>
                <span className="text-slate-500 font-mono">Slicer: All Regions</span>
              </div>

              <div className="space-y-2 text-xs font-mono tabular-nums">
                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Cloud Subscriptions</span>
                    <span className="font-semibold">₦15.13M (41.5%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded overflow-hidden">
                    <div className="bg-emerald-700 h-full w-[83%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Enterprise Hardware</span>
                    <span className="font-semibold">₦11.34M (31.1%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded overflow-hidden">
                    <div className="bg-slate-800 h-full w-[62%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Networking Gear</span>
                    <span className="font-semibold">₦5.59M (15.3%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded overflow-hidden">
                    <div className="bg-amber-600 h-full w-[31%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Managed Support</span>
                    <span className="font-semibold">₦4.41M (12.1%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded overflow-hidden">
                    <div className="bg-slate-500 h-full w-[24%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Excel Worksheet Tab Strip */}
        <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-600">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setStage('raw')}
              className={`px-2.5 py-1 rounded-t border-b-2 cursor-pointer ${
                stage === 'raw'
                  ? 'bg-slate-100 border-emerald-700 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Raw_Export
            </button>
            <button
              type="button"
              onClick={() => setStage('formulas')}
              className={`px-2.5 py-1 rounded-t border-b-2 cursor-pointer ${
                stage === 'formulas'
                  ? 'bg-slate-100 border-emerald-700 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Clean_Table
            </button>
            <button
              type="button"
              onClick={() => setStage('dashboard')}
              className={`px-2.5 py-1 rounded-t border-b-2 cursor-pointer ${
                stage === 'dashboard'
                  ? 'bg-slate-100 border-emerald-700 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Executive_Dashboard
            </button>
          </div>
          <span className="text-slate-400">Ready · Sum: ₦36,465,000</span>
        </div>
      </div>
    </div>
  );
};
