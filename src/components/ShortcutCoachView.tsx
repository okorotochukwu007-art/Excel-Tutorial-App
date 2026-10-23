import React, { useState, useEffect, useRef } from 'react';
import {
  Keyboard,
  Zap,
  Timer,
  Flame,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Search,
  Command,
  Laptop,
  Apple,
  Sparkles,
  BookOpen,
  ArrowRight,
  Check,
  Info,
  ChevronRight,
  Play,
  Award,
} from 'lucide-react';
import {
  EXCEL_SHORTCUTS,
  SHORTCUT_SPEED_QUESTIONS,
  ExcelShortcut,
  ShortcutCategory,
} from '../data/excelShortcutsData';

interface ShortcutCoachViewProps {
  onNavigateToLessons?: () => void;
}

export const ShortcutCoachView: React.FC<ShortcutCoachViewProps> = ({
  onNavigateToLessons,
}) => {
  // OS Mode: 'windows' or 'mac'
  const [osMode, setOsMode] = useState<'windows' | 'mac'>('windows');

  // Arena Mode: 'blitz' (timed challenge), 'drills' (interactive practice), 'library' (searchable cheat sheet)
  const [arenaMode, setArenaMode] = useState<'blitz' | 'drills' | 'library'>('blitz');

  // Active category filter for Library & Drills
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ----------------------------------------------------
  // TIMED SPEED BLITZ STATE
  // ----------------------------------------------------
  const [blitzActive, setBlitzActive] = useState<boolean>(false);
  const [blitzFinished, setBlitzFinished] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ----------------------------------------------------
  // INTERACTIVE DRILL STATE
  // ----------------------------------------------------
  const [drillIndex, setDrillIndex] = useState<number>(0);
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [drillSuccess, setDrillSuccess] = useState<boolean | null>(null);

  // Filtered shortcuts for Library
  const filteredShortcuts = EXCEL_SHORTCUTS.filter((s) => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      s.name.toLowerCase().includes(q) ||
      s.action.toLowerCase().includes(q) ||
      s.windowsDisplay.toLowerCase().includes(q) ||
      s.macDisplay.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // Current question for Speed Blitz
  const currentQ = SHORTCUT_SPEED_QUESTIONS[currentQuestionIdx % SHORTCUT_SPEED_QUESTIONS.length];

  // ----------------------------------------------------
  // TIMER TICKER
  // ----------------------------------------------------
  useEffect(() => {
    if (blitzActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setBlitzActive(false);
            setBlitzFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [blitzActive, timeLeft]);

  const handleStartBlitz = () => {
    setTimeLeft(60);
    setScore(0);
    setComboStreak(0);
    setBestStreak(0);
    setAnsweredCount(0);
    setCurrentQuestionIdx(0);
    setLastAnswerCorrect(null);
    setBlitzFinished(false);
    setBlitzActive(true);
  };

  const handleAnswerBlitz = (isCorrect: boolean) => {
    if (!blitzActive) return;

    setAnsweredCount((prev) => prev + 1);
    if (isCorrect) {
      const multiplier = comboStreak >= 5 ? 3 : comboStreak >= 2 ? 2 : 1;
      const pts = 100 * multiplier;
      setScore((prev) => prev + pts);
      setComboStreak((prev) => {
        const next = prev + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
      setLastAnswerCorrect(true);
    } else {
      setComboStreak(0);
      setLastAnswerCorrect(false);
    }

    setTimeout(() => {
      setLastAnswerCorrect(null);
      setCurrentQuestionIdx((prev) => prev + 1);
    }, 450);
  };

  // ----------------------------------------------------
  // PHYSICAL KEYBOARD LISTENER (DRILL MODE)
  // ----------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (arenaMode !== 'drills') return;

      // Prevent conflicting browser shortcuts in drill mode (e.g. Ctrl+D bookmark, Ctrl+T new tab)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        if (e.key !== 'F12' && e.key !== 'r') {
          e.preventDefault();
        }
      }

      const keys: string[] = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.metaKey) keys.push('Cmd');

      const k = e.key.toUpperCase();
      if (!['CONTROL', 'ALT', 'SHIFT', 'META'].includes(k)) {
        keys.push(k);
      }

      setPressedKeys(keys);

      const targetShortcut = EXCEL_SHORTCUTS[drillIndex % EXCEL_SHORTCUTS.length];
      const targetKeys = osMode === 'windows' ? targetShortcut.windowsKeys : targetShortcut.macKeys;

      // Check matching
      const targetUpper = targetKeys.map((k) => k.toUpperCase());
      const pressedUpper = keys.map((k) => k.toUpperCase());

      const match =
        targetUpper.length === pressedUpper.length &&
        targetUpper.every((k) => pressedUpper.includes(k));

      if (match) {
        setDrillSuccess(true);
        setTimeout(() => {
          setDrillSuccess(null);
          setPressedKeys([]);
          setDrillIndex((prev) => prev + 1);
        }, 800);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [arenaMode, drillIndex, osMode]);

  // Performance Rank
  const getBlitzRank = (finalScore: number) => {
    if (finalScore >= 1800) return { rank: 'Spreadsheet Ninja', tier: 'Top 1%' };
    if (finalScore >= 1200) return { rank: 'Formula Prodigy', tier: 'Top 5%' };
    if (finalScore >= 800) return { rank: 'Speed Analyst', tier: 'Top 15%' };
    if (finalScore >= 400) return { rank: 'Shortcut Enthusiast', tier: 'Top 35%' };
    return { rank: 'Keyboard Apprentice', tier: 'Developing' };
  };

  const categories: ShortcutCategory[] = [
    'Formulas & Calculation',
    'Navigation & Selection',
    'Data & Filtering',
    'Formatting & Alignment',
    'Editing & Clipboard',
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-800 pb-20">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Keyboard className="w-3.5 h-3.5" />
                  Muscle Memory Coach
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Windows &amp; Mac Supported
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Excel Keyboard Shortcut Arena
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Build unstoppable spreadsheet speed. Train workplace muscle memory
                with timed flashcard sprints, interactive keystroke drills, and
                instant reference guides.
              </p>
            </div>

            {/* OS Mode Toggle (Windows vs Mac) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="bg-slate-800 p-1.5 rounded-xl border border-slate-700 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOsMode('windows')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    osMode === 'windows'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Windows (PC)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOsMode('mac')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    osMode === 'mac'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5" />
                  <span>macOS (Apple)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* MODE TABS */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setArenaMode('blitz')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                arenaMode === 'blitz'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>60s Speed Blitz</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400/20 text-amber-300 font-mono">
                Timed
              </span>
            </button>

            <button
              type="button"
              onClick={() => setArenaMode('drills')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                arenaMode === 'drills'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400'
              }`}
            >
              <Keyboard className="w-4 h-4 text-emerald-400" />
              <span>Interactive Keystroke Drill</span>
            </button>

            <button
              type="button"
              onClick={() => setArenaMode('library')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                arenaMode === 'library'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Shortcut Library &amp; Tips</span>
              <span className="font-mono text-[10px] text-slate-400">
                ({EXCEL_SHORTCUTS.length})
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Platform: {osMode === 'windows' ? 'Windows Standard Layout' : 'Apple macOS Layout'}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* MODE 1: TIMED 60s SPEED BLITZ */}
        {/* ---------------------------------------------------- */}
        {arenaMode === 'blitz' && (
          <div className="space-y-6">
            {!blitzActive && !blitzFinished && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mx-auto shadow-inner">
                  <Zap className="w-8 h-8 fill-current" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">
                    60-Second Keyboard Speed Blitz
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                    Test your reflex speed! Answer as many shortcut questions as
                    you can before the clock expires. Maintain combo streaks for
                    multiplier bonuses.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto text-xs font-mono">
                  <div>
                    <div className="text-slate-400 uppercase text-[10px]">Time</div>
                    <div className="font-bold text-slate-900 text-base">60s</div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase text-[10px]">Multiplier</div>
                    <div className="font-bold text-emerald-700 text-base">Up to 3x</div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase text-[10px]">OS</div>
                    <div className="font-bold text-slate-900 text-base">
                      {osMode === 'windows' ? 'PC' : 'Mac'}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleStartBlitz}
                    className="px-8 py-3.5 bg-slate-900 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start 60-Second Challenge</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE BLITZ GAMEPLAY */}
            {blitzActive && (
              <div className="max-w-2xl mx-auto space-y-4">
                {/* Timer & Score Strip */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-mono font-bold text-lg text-amber-400">
                      {timeLeft}s
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Score</div>
                      <div className="text-xl font-black font-mono text-emerald-400">
                        {score} pts
                      </div>
                    </div>
                  </div>

                  {comboStreak >= 2 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs font-mono font-bold text-amber-300 animate-pulse">
                      <Flame className="w-4 h-4 fill-current text-orange-400" />
                      <span>{comboStreak}x Streak ({comboStreak >= 5 ? '3x Multiplier' : '2x Multiplier'})</span>
                    </div>
                  )}

                  <div className="text-right text-xs font-mono text-slate-400">
                    Question #{answeredCount + 1}
                  </div>
                </div>

                {/* Question Card */}
                <div
                  className={`bg-white border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm transition-all ${
                    lastAnswerCorrect === true
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : lastAnswerCorrect === false
                      ? 'border-rose-500 ring-2 ring-rose-500/30'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-1 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-600 uppercase">
                      Action Required:
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 pt-1">
                      {currentQ.prompt}
                    </h2>
                    <p className="text-xs text-slate-500 max-w-md mx-auto pt-1">
                      {currentQ.scenario}
                    </p>
                  </div>

                  {/* 4 Multi-Choice Option Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {currentQ.options.map((opt, idx) => {
                      // Adjust label for Mac if needed
                      let displayLabel = opt.label;
                      if (osMode === 'mac') {
                        if (opt.label === 'Alt + =') displayLabel = '⌥ Option + ⌘ Cmd + =';
                        else if (opt.label === 'Ctrl + D') displayLabel = '⌘ Cmd + D';
                        else if (opt.label === 'Ctrl + T') displayLabel = '⌘ Cmd + T';
                        else if (opt.label === 'Ctrl + 1') displayLabel = '⌘ Cmd + 1';
                        else if (opt.label === 'Ctrl + Shift + L') displayLabel = '⌘ Cmd + Shift + F';
                        else if (opt.label === 'Ctrl + Down Arrow') displayLabel = '⌘ Cmd + Down Arrow';
                        else if (opt.label === 'Ctrl + Alt + V') displayLabel = '⌘ Cmd + Control + V';
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAnswerBlitz(opt.isCorrect)}
                          className="p-4 rounded-xl border border-slate-300 hover:border-slate-900 hover:bg-slate-50 text-slate-800 font-mono font-bold text-sm transition-all flex items-center justify-between cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          <span>{displayLabel}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* BLITZ RESULTS SCREEN */}
            {blitzFinished && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mx-auto">
                  <Trophy className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold uppercase text-emerald-800">
                    Speed Sprint Complete!
                  </span>
                  <h2 className="text-3xl font-black text-slate-900">
                    {score} Points
                  </h2>
                  <div className="text-sm font-semibold text-slate-700">
                    Rank:{' '}
                    <span className="text-emerald-800 font-bold">
                      {getBlitzRank(score).rank}
                    </span>{' '}
                    ({getBlitzRank(score).tier})
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono max-w-md mx-auto">
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase">Answered</div>
                    <div className="text-base font-bold text-slate-900">
                      {answeredCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase">Best Streak</div>
                    <div className="text-base font-bold text-amber-600">
                      {bestStreak}x 🔥
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase">Accuracy</div>
                    <div className="text-base font-bold text-emerald-700">
                      {answeredCount > 0 ? Math.round((score / (answeredCount * 100)) * 100) : 0}%
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleStartBlitz}
                    className="px-6 py-3 bg-slate-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Play Again</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setArenaMode('library')}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    <span>Browse All Shortcuts</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MODE 2: INTERACTIVE KEYSTROKE DRILLS */}
        {/* ---------------------------------------------------- */}
        {arenaMode === 'drills' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {(() => {
              const currentDrill = EXCEL_SHORTCUTS[drillIndex % EXCEL_SHORTCUTS.length];
              const targetKeys = osMode === 'windows' ? currentDrill.windowsKeys : currentDrill.macKeys;
              const display = osMode === 'windows' ? currentDrill.windowsDisplay : currentDrill.macDisplay;

              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-mono font-bold text-emerald-800 uppercase">
                      Interactive Drill #{drillIndex + 1} of {EXCEL_SHORTCUTS.length}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {currentDrill.category}
                    </span>
                  </div>

                  <div className="space-y-2 text-center">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      {currentDrill.action}
                    </h2>
                    <p className="text-xs text-slate-600 max-w-lg mx-auto">
                      {currentDrill.description}
                    </p>
                  </div>

                  {/* VIRTUAL KEYBOARD / TARGET KEY CAPS */}
                  <div className="py-6 flex flex-col items-center justify-center space-y-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Target Key Combination:
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      {targetKeys.map((key, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <kbd className="px-4 py-2.5 bg-slate-100 border-2 border-slate-300 border-b-4 rounded-xl font-mono text-base font-bold text-slate-800 shadow-sm min-w-[50px] text-center select-none">
                            {key}
                          </kbd>
                          {i < targetKeys.length - 1 && (
                            <span className="text-slate-400 font-bold text-lg">+</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Instruction prompt */}
                    <div className="pt-2 text-xs font-mono text-slate-500 text-center">
                      ⚡ Press this exact combination on your physical keyboard now, or click below:
                    </div>

                    {/* Feedback result */}
                    {drillSuccess && (
                      <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 font-bold text-xs flex items-center gap-2 animate-bounce">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Perfect Keystroke! Advancing to next drill...</span>
                      </div>
                    )}

                    {/* On-Screen Click Alternative */}
                    <div className="pt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDrillSuccess(true);
                          setTimeout(() => {
                            setDrillSuccess(null);
                            setDrillIndex((prev) => prev + 1);
                          }, 600);
                        }}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>I Pressed It (Next Drill)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDrillIndex((prev) => prev + 1)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Skip
                      </button>
                    </div>
                  </div>

                  {/* Workplace Pro-Tip Card */}
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1 text-xs">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Workplace Speed Secret:</span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed">
                      {currentDrill.workplaceProTip}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MODE 3: SEARCHABLE SHORTCUT LIBRARY */}
        {/* ---------------------------------------------------- */}
        {arenaMode === 'library' && (
          <div className="space-y-6">
            {/* Search & Category Filter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shortcuts by name or action (e.g. 'sum', 'filter', 'absolute', 'table')..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-sans border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
                      selectedCategory === 'All'
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Shortcuts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShortcuts.map((sc) => {
                const keyDisplay = osMode === 'windows' ? sc.windowsDisplay : sc.macDisplay;

                return (
                  <div
                    key={sc.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-400 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 uppercase">
                          {sc.category}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-800 font-semibold">
                          {sc.difficulty}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {sc.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-snug">
                        {sc.action}
                      </p>

                      {/* Prominent Keycaps */}
                      <div className="pt-2">
                        <kbd className="px-3 py-1.5 bg-slate-900 text-white font-mono font-bold text-xs rounded-lg inline-block shadow-xs border border-slate-800">
                          {keyDisplay}
                        </kbd>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                      <strong className="text-slate-800">Pro Tip: </strong>
                      {sc.workplaceProTip}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTTOM PROMPT: RETURN TO CURRICULUM */}
        {onNavigateToLessons && (
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-1">
              <h3 className="text-base font-bold">
                Apply these shortcuts in your Excel practice workbooks
              </h3>
              <p className="text-xs text-slate-300">
                Put your keyboard speed to work on hands-on business datasets.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToLessons}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shrink-0 shadow-sm"
            >
              <span>Back to Course Lessons</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
