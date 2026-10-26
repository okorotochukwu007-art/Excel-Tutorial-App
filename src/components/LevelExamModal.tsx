import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Download,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { EndOfLevelExam, LevelCertificate, QuizAttempt } from '../types/academy';
import {
  downloadLevelCertificatePdf,
  getCertificateDataForLevel,
} from '../utils/pdfCertificateGenerator';

interface LevelExamModalProps {
  exam: EndOfLevelExam;
  studentName: string;
  studentEmail?: string;
  isOpen: boolean;
  canExportCertificate?: boolean;
  onClose: () => void;
  onRecordExamAttempt: (attempt: QuizAttempt) => void;
  onOpenCertificatePreview: (cert: LevelCertificate) => void;
  onAdvanceToNextLevel?: (nextLevelNumber: number) => void;
}

export const LevelExamModal: React.FC<LevelExamModalProps> = ({
  exam,
  studentName,
  studentEmail,
  isOpen,
  canExportCertificate = false,
  onClose,
  onRecordExamAttempt,
  onOpenCertificatePreview,
  onAdvanceToNextLevel,
}) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentQuestionIdx(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setShowReview(false);
    }
  }, [exam.levelNumber, isOpen]);

  if (!isOpen) return null;

  const currentQ = exam.questions[currentQuestionIdx];
  const totalQuestions = exam.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const calculateResults = () => {
    let correct = 0;
    exam.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        correct++;
      }
    });
    const scorePercent = Math.round((correct / totalQuestions) * 100);
    const passed = scorePercent >= exam.passingScorePercent;
    return { correct, scorePercent, passed };
  };

  const handleSubmitExam = () => {
    const { correct, scorePercent, passed } = calculateResults();
    setIsSubmitted(true);
    setShowReview(!passed);

    onRecordExamAttempt({
      id: `attempt-exam-lvl-${exam.levelNumber}-${Date.now()}`,
      quizId: `exam-lvl-${exam.levelNumber}`,
      lessonTitle: exam.title,
      scorePercent,
      passed,
      totalQuestions,
      correctCount: correct,
      attemptedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isSimulatedLocal: true,
    });
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setShowReview(false);
    setCurrentQuestionIdx(0);
  };

  const results = isSubmitted ? calculateResults() : null;
  const certificateData: LevelCertificate | null = results
    ? getCertificateDataForLevel(
        exam.levelNumber,
        studentName,
        studentEmail,
        results.scorePercent
      )
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-6">
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-700 text-[10px] font-mono font-bold uppercase tracking-wider">
                End of Level {exam.levelNumber} General Quiz
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Passing Score: {exam.passingScorePercent}% · Unlimited Retakes Allowed
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              {exam.title}
            </h3>
            <p className="text-xs text-slate-300">
              {exam.levelNumber < 6
                ? `Pass this General Quiz (${exam.passingScorePercent}%+) to unlock Level ${exam.levelNumber + 1} and earn your Level ${exam.levelNumber} Certificate.`
                : `Pass this final Capstone General Quiz (${exam.passingScorePercent}%+) to complete Level 6 and earn your Master Certificate.`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        {!isSubmitted ? (
          /* ACTIVE EXAM QUESTION VIEW */
          <div className="p-6 space-y-6">
            {/* Progress Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-slate-700">
                  Question {currentQuestionIdx + 1} of {totalQuestions}
                </span>
                <span className="text-slate-500">
                  {answeredCount} of {totalQuestions} answered
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-700 h-full transition-all"
                  style={{
                    width: `${((currentQuestionIdx + 1) / totalQuestions) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Question Text & Formula Context */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {currentQ.questionText}
              </h4>

              {currentQ.formulaContext && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500">
                    Formula Context:
                  </span>
                  <code className="px-2.5 py-1 bg-white border border-slate-300 rounded font-mono text-xs text-emerald-900 font-semibold shadow-xs">
                    {currentQ.formulaContext}
                  </code>
                </div>
              )}
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentQ.id] === optIdx;
                const letter = String.fromCharCode(65 + optIdx);
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-600 text-slate-900 shadow-xs ring-1 ring-emerald-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="leading-relaxed pt-0.5">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Question Navigation Controls */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
              <button
                type="button"
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  currentQuestionIdx > 0
                    ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentQuestionIdx < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentQuestionIdx((p) =>
                        Math.min(totalQuestions - 1, p + 1)
                      )
                    }
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    Next Question
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitExam}
                    className="px-6 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Level {exam.levelNumber} General Quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* EXAM RESULTS & NEXT LEVEL UNLOCK VIEW */
          <div className="p-6 space-y-6">
            {results && results.passed ? (
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-md">
                  <Award className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider">
                    Level {exam.levelNumber} General Quiz Passed!
                  </span>
                  <h4 className="text-2xl font-black text-slate-900">
                    Congratulations, {studentName}!
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                    You scored{' '}
                    <strong className="text-emerald-900 font-bold font-mono">
                      {results.scorePercent}%
                    </strong>{' '}
                    ({results.correct} of {totalQuestions} correct) on the Level{' '}
                    {exam.levelNumber} General Quiz.{' '}
                    {exam.levelNumber < 6
                      ? `Level ${exam.levelNumber + 1} is now unlocked for you!`
                      : 'You have completed all 6 curriculum levels!'}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  {exam.levelNumber < 6 && onAdvanceToNextLevel && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onAdvanceToNextLevel(exam.levelNumber + 1);
                      }}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                    >
                      <span>Continue to Level {exam.levelNumber + 1}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {certificateData && canExportCertificate ? (
                    <>
                      <button
                        type="button"
                        onClick={() => downloadLevelCertificatePdf(certificateData)}
                        className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Certificate (.PDF)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenCertificatePreview(certificateData)}
                        className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-emerald-800" />
                        <span>Preview Certificate</span>
                      </button>
                    </>
                  ) : (
                    <div className="w-full pt-2 text-[11px] font-medium text-emerald-900 bg-emerald-100/70 border border-emerald-300 rounded-xl px-4 py-2.5">
                      Exam Pass Recorded! Complete all modules, pass all 6 level exams, and submit all 4 real-life projects to your instructor on the <strong>My Learning</strong> page to unlock your official Certificate export.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  Almost There! Retake Anytime to Pass
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  You scored{' '}
                  <strong className="font-mono text-amber-900">
                    {results?.scorePercent}%
                  </strong>{' '}
                  ({results?.correct} of {totalQuestions} correct). A score of{' '}
                  <strong>{exam.passingScorePercent}%</strong> is required to pass Level {exam.levelNumber}
                  {exam.levelNumber < 6 ? ` and move on to Level ${exam.levelNumber + 1}` : ''}.
                  Review the explanations below and retake the quiz—you can take it as many times as you need!
                </p>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center gap-2 mx-auto cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Level {exam.levelNumber} General Quiz Now</span>
                </button>
              </div>
            )}

            {/* Answer Review Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h5 className="text-sm font-bold text-slate-900">
                  Question Review &amp; Formula Explanations
                </h5>
                <button
                  type="button"
                  onClick={() => setShowReview((prev) => !prev)}
                  className="text-xs text-emerald-800 font-semibold hover:underline cursor-pointer"
                >
                  {showReview ? 'Hide Explanations' : 'Show All Explanations'}
                </button>
              </div>

              {showReview && (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {exam.questions.map((q, idx) => {
                    const chosenIdx = selectedAnswers[q.id];
                    const isCorrect = chosenIdx === q.correctOptionIndex;
                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border text-xs space-y-2 ${
                          isCorrect
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900">
                            Q{idx + 1}: {q.questionText}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-rose-100 text-rose-900'
                            }`}
                          >
                            {isCorrect ? 'Correct' : 'Needs Review'}
                          </span>
                        </div>

                        <div className="text-slate-600">
                          <strong>Your Answer:</strong>{' '}
                          {chosenIdx !== undefined
                            ? q.options[chosenIdx]
                            : 'Unanswered'}
                        </div>

                        {!isCorrect && (
                          <div className="text-emerald-900 font-semibold">
                            <strong>Correct Answer:</strong>{' '}
                            {q.options[q.correctOptionIndex]}
                          </div>
                        )}

                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 leading-relaxed">
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake General Quiz (Unlimited Attempts)
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

