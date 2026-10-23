import React, { useState } from 'react';
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
  FileCheck2,
  Sparkles,
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
  onClose: () => void;
  onRecordExamAttempt: (attempt: QuizAttempt) => void;
  onOpenCertificatePreview: (cert: LevelCertificate) => void;
}

export const LevelExamModal: React.FC<LevelExamModalProps> = ({
  exam,
  studentName,
  studentEmail,
  isOpen,
  onClose,
  onRecordExamAttempt,
  onOpenCertificatePreview,
}) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);

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
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-700 text-[10px] font-mono font-bold uppercase tracking-wider">
                Level {exam.levelNumber} Certification Exam
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Passing Score: {exam.passingScorePercent}%
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              {exam.title}
            </h3>
            <p className="text-xs text-slate-300">
              {exam.subtitle}
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
                    Submit Final Exam
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* EXAM RESULTS & CERTIFICATION UNLOCK VIEW */
          <div className="p-6 space-y-6">
            {results && results.passed ? (
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-md">
                  <Award className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider">
                    Official Certification Exam Passed!
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
                    {exam.levelNumber} Certification Exam. Your official verified completion credential is ready!
                  </p>
                </div>

                {certificateData && (
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => downloadLevelCertificatePdf(certificateData)}
                      className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Branded PDF Certificate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenCertificatePreview(certificateData)}
                      className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-emerald-800" />
                      <span>Preview Certificate</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  Keep Practicing in Excel
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  You scored{' '}
                  <strong className="font-mono text-amber-900">
                    {results?.scorePercent}%
                  </strong>
                  . A passing score of {exam.passingScorePercent}% is required to unlock your official verified certificate. You can review the answers below and retake the exam at any time.
                </p>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Exam</span>
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
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
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
                Retake Exam
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
