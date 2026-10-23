import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  Send,
  ThumbsUp,
  Search,
  Plus,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Copy,
  CheckCheck,
  Code,
  Filter,
  User,
  Sparkles,
} from 'lucide-react';
import {
  LessonCommentQuestion,
  LessonQuestionAnswer,
  LessonQuestionCategory,
  Profile,
} from '../types/academy';
import {
  loadLessonQuestions,
  postStudentQuestion,
  postAnswerToQuestion,
  upvoteQuestion,
  upvoteAnswer,
} from '../data/seedLessonQuestions';

interface LessonQnAViewProps {
  lessonId: string;
  lessonTitle: string;
  primaryFormula?: string;
  currentUser?: Profile;
}

const CATEGORIES: LessonQuestionCategory[] = [
  'Formula Troubleshooting',
  'Excel Error (#N/A, #VALUE!)',
  'Exercise Help',
  'General Question',
  'Tip or Shortcut',
];

export const LessonQnAView: React.FC<LessonQnAViewProps> = ({
  lessonId,
  lessonTitle,
  primaryFormula = '=SUM(B2:B10)',
  currentUser,
}) => {
  const [questions, setQuestions] = useState<LessonCommentQuestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [onlyVerified, setOnlyVerified] = useState(false);

  // New question form state
  const [isAsking, setIsAsking] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] =
    useState<LessonQuestionCategory>('Formula Troubleshooting');
  const [newContent, setNewContent] = useState('');
  const [newFormula, setNewFormula] = useState('');
  const [postFeedback, setPostFeedback] = useState('');

  // Reply form state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyFormula, setReplyFormula] = useState('');
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  // Load questions whenever lessonId changes
  useEffect(() => {
    const loaded = loadLessonQuestions(lessonId, lessonTitle, primaryFormula);
    setQuestions(loaded);
    setIsAsking(false);
    setReplyingToId(null);
  }, [lessonId, lessonTitle, primaryFormula]);

  const isUserAdminOrInstructor =
    currentUser?.role === 'admin_demo' ||
    currentUser?.role === ('admin' as any) ||
    currentUser?.email.includes('admin') ||
    currentUser?.email.includes('instructor');

  const handleCopyFormula = (formulaText: string) => {
    navigator.clipboard.writeText(formulaText);
    setCopiedFormula(formulaText);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const authorName = currentUser?.fullName || 'Student Learner';
    const authorEmail = currentUser?.email || 'student@academy.local';
    const authorRole = isUserAdminOrInstructor ? 'instructor' : 'student';

    const created = postStudentQuestion(
      lessonId,
      authorName,
      authorEmail,
      authorRole,
      newTitle,
      newContent,
      newCategory,
      newFormula
    );

    setQuestions((prev) => [created, ...prev]);
    setNewTitle('');
    setNewContent('');
    setNewFormula('');
    setIsAsking(false);
    setPostFeedback('Your question has been posted to the lesson discussion!');
    setTimeout(() => setPostFeedback(''), 4000);
  };

  const handlePostReply = (questionId: string) => {
    if (!replyContent.trim()) return;

    const authorName = isUserAdminOrInstructor
      ? `${currentUser?.fullName || 'Academic Instructor'} (Instructor)`
      : currentUser?.fullName || 'Student Learner';

    const authorRole = isUserAdminOrInstructor ? 'instructor' : 'student';
    const authorEmail = currentUser?.email || 'learner@academy.local';

    const createdAnswer = postAnswerToQuestion(
      lessonId,
      questionId,
      authorName,
      authorRole,
      authorEmail,
      replyContent,
      replyFormula
    );

    if (createdAnswer) {
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === questionId) {
            return {
              ...q,
              status: 'answered',
              answers: [...q.answers, createdAnswer],
            };
          }
          return q;
        })
      );
    }

    setReplyContent('');
    setReplyFormula('');
    setReplyingToId(null);
  };

  const handleUpvoteQuestion = (qId: string) => {
    upvoteQuestion(lessonId, qId);
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, upvotes: q.upvotes + 1 } : q))
    );
  };

  const handleUpvoteAnswer = (qId: string, aId: string) => {
    upvoteAnswer(lessonId, qId, aId);
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            answers: q.answers.map((a) =>
              a.id === aId ? { ...a, upvotes: a.upvotes + 1 } : a
            ),
          };
        }
        return q;
      })
    );
  };

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    if (selectedCategory !== 'All' && q.category !== selectedCategory) return false;
    if (onlyVerified && !q.answers.some((a) => a.isVerifiedInstructorAnswer)) return false;
    if (!searchQuery.trim()) return true;
    const s = searchQuery.toLowerCase();
    return (
      q.title.toLowerCase().includes(s) ||
      q.content.toLowerCase().includes(s) ||
      (q.formulaSnippet && q.formulaSnippet.toLowerCase().includes(s)) ||
      q.answers.some(
        (a) =>
          a.content.toLowerCase().includes(s) ||
          (a.formulaSnippet && a.formulaSnippet.toLowerCase().includes(s))
      )
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER & ACTION BAR */}
      <div className="bg-[#FAF9F5] border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold uppercase tracking-wider">
                In-Lesson Q&amp;A &amp; Discussion
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {questions.length} Question{questions.length === 1 ? '' : 's'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Formula Troubleshooting &amp; Community Q&amp;A
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              Ask questions about this specific lesson, troubleshoot your formulas, or learn from verified answers provided by Dr. O. Tochukwu and the instructor team.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAsking((prev) => !prev)}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors self-start md:self-auto shrink-0"
          >
            {isAsking ? (
              <span>Cancel Question</span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Ask a Question</span>
              </>
            )}
          </button>
        </div>

        {postFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{postFeedback}</span>
          </div>
        )}

        {/* SEARCH & FILTER CONTROLS */}
        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search troubleshooting questions, formulas, error codes..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-emerald-700"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] font-semibold ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Topics
            </button>

            {CATEGORIES.slice(0, 3).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer text-[11px] font-medium ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.split(' ')[0]}
              </button>
            ))}

            <label className="flex items-center gap-1.5 text-[11px] text-slate-700 ml-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
              />
              <span className="font-semibold text-emerald-900">Verified Instructor Answers Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* NEW QUESTION FORM (COLLAPSIBLE) */}
      {isAsking && (
        <form
          onSubmit={handleCreateQuestion}
          className="bg-white border-2 border-emerald-600/40 rounded-xl p-5 sm:p-6 space-y-4 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              Ask Question or Report a Formula Issue
            </h4>
            <span className="text-xs text-slate-500">
              Posting as: <strong>{currentUser?.fullName || 'Student Learner'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Question Title
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Why does my SUMIFS formula return #VALUE! or 0?"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-emerald-700"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as LessonQuestionCategory)
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-emerald-700 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-800">
              Details &amp; What You Observed
            </label>
            <textarea
              required
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Describe what you typed in Excel, what row or column you are working on, and the expected vs actual result..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-emerald-700 leading-relaxed"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-800 flex items-center justify-between">
              <span>Your Formula or Error Snippet (Optional)</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Helps instructors spot syntax errors immediately
              </span>
            </label>
            <input
              type="text"
              value={newFormula}
              onChange={(e) => setNewFormula(e.target.value)}
              placeholder="e.g. =SUMIFS(B2:B50, C2:C50, &quot;Lagos&quot;, D2:D50)"
              className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-emerald-900 focus:bg-white focus:outline-emerald-700"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAsking(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post Question</span>
            </button>
          </div>
        </form>
      )}

      {/* QUESTIONS LIST */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">
              No questions found matching your filter
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Be the first to ask a question or formula troubleshooting scenario for &ldquo;{lessonTitle}&rdquo;!
            </p>
            <button
              type="button"
              onClick={() => setIsAsking(true)}
              className="px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 cursor-pointer"
            >
              Ask the First Question
            </button>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const hasVerified = q.answers.some(
              (a) => a.isVerifiedInstructorAnswer
            );

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* QUESTION TOP BAR */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-mono font-bold">
                        {q.category}
                      </span>
                      {hasVerified && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          Answered by Instructor
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      {q.createdAt}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {q.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {q.content}
                  </p>

                  {/* Formula Code Snippet in Question */}
                  {q.formulaSnippet && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <Code className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <code className="text-xs font-mono text-emerald-900 font-semibold flex-1 truncate">
                        {q.formulaSnippet}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyFormula(q.formulaSnippet!)}
                        className="text-slate-500 hover:text-emerald-800 transition-colors shrink-0 p-1 cursor-pointer"
                        title="Copy formula"
                      >
                        {copiedFormula === q.formulaSnippet ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {q.authorName}
                      </span>
                      <span>·</span>
                      <span>
                        {q.answers.length} Repl
                        {q.answers.length === 1 ? 'y' : 'ies'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpvoteQuestion(q.id)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <ThumbsUp className="w-3 h-3 text-slate-500" />
                        <span>Helpful ({q.upvotes})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setReplyingToId((prev) => (prev === q.id ? null : q.id))
                        }
                        className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                      >
                        {replyingToId === q.id ? 'Cancel Reply' : 'Reply'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ANSWERS / REPLIES LIST */}
                {q.answers.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                      Instructor &amp; Community Responses ({q.answers.length}):
                    </div>

                    <div className="space-y-2.5">
                      {q.answers.map((ans) => (
                        <div
                          key={ans.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                            ans.isVerifiedInstructorAnswer
                              ? 'bg-emerald-50/70 border-emerald-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {ans.authorName}
                              </span>
                              {ans.isVerifiedInstructorAnswer && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-white font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  Verified Instructor Answer
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {ans.createdAt}
                            </span>
                          </div>

                          <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                            {ans.content}
                          </p>

                          {ans.formulaSnippet && (
                            <div className="flex items-center gap-2 p-2 bg-white border border-emerald-200 rounded-lg">
                              <Code className="w-3 h-3 text-emerald-700 shrink-0" />
                              <code className="text-[11px] font-mono text-emerald-950 font-bold flex-1 truncate">
                                {ans.formulaSnippet}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopyFormula(ans.formulaSnippet!)}
                                className="text-slate-500 hover:text-emerald-800 transition-colors shrink-0 p-0.5 cursor-pointer"
                                title="Copy formula"
                              >
                                {copiedFormula === ans.formulaSnippet ? (
                                  <CheckCheck className="w-3 h-3 text-emerald-700" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}

                          <div className="flex items-center justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleUpvoteAnswer(q.id, ans.id)}
                              className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <ThumbsUp className="w-2.5 h-2.5 text-slate-400" />
                              <span>Helpful ({ans.upvotes})</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INLINE REPLY FORM */}
                {replyingToId === q.id && (
                  <div className="pt-3 border-t border-slate-100 bg-slate-50/70 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        Replying as:{' '}
                        <strong className="text-emerald-900">
                          {isUserAdminOrInstructor
                            ? `${currentUser?.fullName || 'Instructor'} (Verified Instructor)`
                            : currentUser?.fullName || 'Learner'}
                        </strong>
                      </span>
                      {isUserAdminOrInstructor && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-mono text-[10px] font-bold">
                          ✓ Verified Badge Attached
                        </span>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your explanation or solution steps..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-emerald-700"
                    />

                    <input
                      type="text"
                      value={replyFormula}
                      onChange={(e) => setReplyFormula(e.target.value)}
                      placeholder="Optional formula fix: e.g. =SUMIFS(B2:B50, C2:C50, &quot;Lagos&quot;)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-emerald-900 focus:outline-emerald-700"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyingToId(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePostReply(q.id)}
                        className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Post Reply</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
