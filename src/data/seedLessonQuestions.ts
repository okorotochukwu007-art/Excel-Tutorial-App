import { LessonCommentQuestion, LessonQuestionAnswer, LessonQuestionCategory } from '../types/academy';

const STORAGE_PREFIX = 'excel_academy_qna_';

/**
 * Default pre-seeded Q&A threads with verified instructor answers tailored to key topics
 */
const SEEDED_QUESTIONS_BY_TOPIC: Record<string, LessonCommentQuestion[]> = {
  general: [
    {
      id: 'q-seed-1',
      lessonId: 'default',
      authorName: 'Emeka Nwosu',
      authorRole: 'student',
      title: 'Should I type formulas in uppercase or lowercase?',
      content:
        'When typing functions like sum or xlookup, does Excel care if I use capital letters (=SUM) or lowercase (=sum)?',
      category: 'Tip or Shortcut',
      status: 'answered',
      upvotes: 8,
      createdAt: '2 days ago',
      answers: [
        {
          id: 'ans-seed-1',
          questionId: 'q-seed-1',
          authorName: 'Dr. O. Tochukwu (Lead Instructor)',
          authorRole: 'instructor',
          content:
            'Excel is completely case-insensitive for formula names! You can type =sum(...) or =SUM(...). Pro tip: type them in lowercase—when you press Enter, Excel will automatically convert it to uppercase if the function name was spelled correctly. If it stays lowercase, you know you made a spelling mistake!',
          formulaSnippet: '=SUM(B2:B10)',
          createdAt: '1 day ago',
          isVerifiedInstructorAnswer: true,
          upvotes: 14,
        },
      ],
    },
    {
      id: 'q-seed-2',
      lessonId: 'default',
      authorName: 'Amina Bello',
      authorRole: 'student',
      title: 'My formula returns #VALUE! error — what am I doing wrong?',
      content:
        'I followed the video to calculate the difference between budget and actual, but cell F2 gives #VALUE!. The columns have amounts in them.',
      category: 'Excel Error (#N/A, #VALUE!)',
      status: 'answered',
      upvotes: 12,
      createdAt: '3 days ago',
      answers: [
        {
          id: 'ans-seed-2',
          questionId: 'q-seed-2',
          authorName: 'Dr. O. Tochukwu (Lead Instructor)',
          authorRole: 'instructor',
          content:
            'A #VALUE! error almost always means one of the cells contains text or rogue spaces instead of a clean number. Check if your amount has a manually typed currency symbol, comma as decimal, or extra space. If you used =TRIM or re-format the cell as Number, Excel can do the math cleanly.',
          formulaSnippet: '=D2 - E2',
          createdAt: '2 days ago',
          isVerifiedInstructorAnswer: true,
          upvotes: 19,
        },
      ],
    },
  ],
  formulas: [
    {
      id: 'q-seed-f1',
      lessonId: 'default',
      authorName: 'Babajide Adeleke',
      authorRole: 'student',
      title: 'When should I press F4 to lock a formula?',
      content:
        'I dragged my tax rate formula down 50 rows, but all rows below row 2 returned 0. Why did this happen?',
      category: 'Formula Troubleshooting',
      status: 'answered',
      upvotes: 15,
      createdAt: '1 day ago',
      answers: [
        {
          id: 'ans-seed-f1',
          questionId: 'q-seed-f1',
          authorName: 'Dr. O. Tochukwu (Lead Instructor)',
          authorRole: 'instructor',
          content:
            'This is the classic absolute reference rule! When you drag a formula down, Excel shifts references down by 1 row (G1 becomes G2, then G3, which are blank). Press F4 while clicking cell G1 to lock it as $G$1. The dollar signs anchor the cell so it stays pointing to your rate cell for all 50 rows.',
          formulaSnippet: '=C2 * $G$1',
          createdAt: '18 hours ago',
          isVerifiedInstructorAnswer: true,
          upvotes: 27,
        },
      ],
    },
    {
      id: 'q-seed-f2',
      lessonId: 'default',
      authorName: 'Chioma Okoro',
      authorRole: 'student',
      title: 'XLOOKUP vs VLOOKUP: What if the return column is to the left?',
      content:
        'In our company database, Customer ID is in Column C, but Customer Name is in Column A. Can XLOOKUP look to the left?',
      category: 'Formula Troubleshooting',
      status: 'answered',
      upvotes: 10,
      createdAt: '2 days ago',
      answers: [
        {
          id: 'ans-seed-f2',
          questionId: 'q-seed-f2',
          authorName: 'Academic Teaching Team',
          authorRole: 'instructor',
          content:
            'Yes, absolutely! Unlike VLOOKUP (which could only look to the right), XLOOKUP can look in any direction—left, right, up, or down. Just pass Column C as lookup_array and Column A as return_array. It works seamlessly!',
          formulaSnippet: '=XLOOKUP(D2, C:C, A:A, "Not Found")',
          createdAt: '1 day ago',
          isVerifiedInstructorAnswer: true,
          upvotes: 18,
        },
      ],
    },
  ],
};

/**
 * Generate initial contextual Q&A questions for any lesson
 */
export function getInitialSeedQuestionsForLesson(
  lessonId: string,
  lessonTitle = 'Excel Practical Lesson',
  primaryFormula = '=SUM(B2:B10)'
): LessonCommentQuestion[] {
  const isLookup = lessonTitle.toLowerCase().includes('lookup');
  const isCleaning = lessonTitle.toLowerCase().includes('clean') || lessonTitle.toLowerCase().includes('format');
  const isPivot = lessonTitle.toLowerCase().includes('pivot') || lessonTitle.toLowerCase().includes('analy');
  const isDashboard = lessonTitle.toLowerCase().includes('dashboard') || lessonTitle.toLowerCase().includes('chart');

  let topicSpecificQ: LessonCommentQuestion;

  if (isLookup) {
    topicSpecificQ = {
      id: `seed-${lessonId}-1`,
      lessonId,
      authorName: 'Kelechi Umeh',
      authorRole: 'student',
      title: 'What does the if_not_found argument do in this formula?',
      content: `In the lesson walkthrough for ${lessonTitle}, the instructor included a fourth parameter in quotes. What happens if I leave it out?`,
      category: 'Formula Troubleshooting',
      status: 'answered',
      upvotes: 9,
      createdAt: '1 day ago',
      answers: [
        {
          id: `seed-ans-${lessonId}-1`,
          questionId: `seed-${lessonId}-1`,
          authorName: 'Dr. O. Tochukwu (Lead Instructor)',
          authorRole: 'instructor',
          content:
            'If you omit the if_not_found argument, Excel will return a default #N/A error whenever a match is not found. By providing a clean message like "Missing Record" or "Not Found", your reports stay executive-ready and clean without ugly error codes!',
          formulaSnippet: primaryFormula,
          createdAt: '18 hours ago',
          isVerifiedInstructorAnswer: true,
          upvotes: 15,
        },
      ],
    };
  } else if (isCleaning) {
    topicSpecificQ = {
      id: `seed-${lessonId}-1`,
      lessonId,
      authorName: 'Farida Usman',
      authorRole: 'student',
      title: 'Why didn\'t TRIM remove the space in "John  Doe"?',
      content: `I applied TRIM to customer records, but there are still double spaces between the first and last name. How do I fix this?`,
      category: 'Excel Error (#N/A, #VALUE!)',
      status: 'answered',
      upvotes: 11,
      createdAt: '2 days ago',
      answers: [
        {
          id: `seed-ans-${lessonId}-1`,
          questionId: `seed-${lessonId}-1`,
          authorName: 'Dr. O. Tochukwu (Lead Instructor)',
          authorRole: 'instructor',
          content:
            'Excel\'s standard TRIM function removes all leading and trailing spaces, but sometimes imported web/CRM data contains non-breaking spaces (ASCII code 160). You can wrap it with CLEAN and SUBSTITUTE: =TRIM(CLEAN(SUBSTITUTE(A2, CHAR(160), " "))).',
          formulaSnippet: '=TRIM(CLEAN(A2))',
          createdAt: '1 day ago',
          isVerifiedInstructorAnswer: true,
          upvotes: 21,
        },
      ],
    };
  } else if (isPivot) {
    topicSpecificQ = {
      id: `seed-${lessonId}-1`,
      lessonId,
      authorName: 'Tariq Al-Mansoor',
      authorRole: 'student',
      title: 'My PivotTable is showing "Count of Revenue" instead of "Sum of Revenue"',
      content: `When I drag Revenue into the Values box, Excel defaults to Count instead of Sum. Why does it do that?`,
      category: 'Exercise Help',
      status: 'answered',
      upvotes: 14,
      createdAt: '3 days ago',
      answers: [
        {
          id: `seed-ans-${lessonId}-1`,
          questionId: `seed-${lessonId}-1`,
          authorName: 'Dr. O. Tochukwu (Lead Instructor)',
          authorRole: 'instructor',
          content:
            'Excel defaults to Count if even a single cell in that column contains text or is completely blank! Click the field in Values > Value Field Settings > select "Sum". Then check your source data to make sure every row has a real number.',
          formulaSnippet: '=SUM(tbl_Sales[Revenue])',
          createdAt: '2 days ago',
          isVerifiedInstructorAnswer: true,
          upvotes: 23,
        },
      ],
    };
  } else if (isDashboard) {
    topicSpecificQ = {
      id: `seed-${lessonId}-1`,
      lessonId,
      authorName: 'Ngozi Eze',
      authorRole: 'student',
      title: 'How do I keep chart sizes aligned neatly?',
      content: `When I resize my KPI cards and PivotCharts, they end up slightly crooked or unevenly spaced. What shortcut was used in the video?`,
      category: 'Tip or Shortcut',
      status: 'answered',
      upvotes: 7,
      createdAt: '1 day ago',
      answers: [
        {
          id: `seed-ans-${lessonId}-1`,
          questionId: `seed-${lessonId}-1`,
          authorName: 'Academic Teaching Team',
          authorRole: 'instructor',
          content:
            'Hold down the Alt key while resizing or moving any chart, card, or slicer! Alt forces the edges to snap directly to the cell grid lines, giving you perfect alignment effortlessly.',
          createdAt: '16 hours ago',
          isVerifiedInstructorAnswer: true,
          upvotes: 16,
        },
      ],
    };
  } else {
    topicSpecificQ = {
      id: `seed-${lessonId}-1`,
      lessonId,
      authorName: 'Oluwaseun Bakare',
      authorRole: 'student',
      title: `Practice question regarding ${lessonTitle}`,
      content: `I am working through the practice workbook for this lesson. Is there a shortcut to highlight the whole table quickly?`,
      category: 'Tip or Shortcut',
      status: 'answered',
      upvotes: 6,
      createdAt: '1 day ago',
      answers: [
        {
          id: `seed-ans-${lessonId}-1`,
          questionId: `seed-${lessonId}-1`,
          authorName: 'Dr. O. Tochukwu (Lead Instructor)',
          authorRole: 'instructor',
          content:
            'Click anywhere inside your data table and press Ctrl + A (Cmd + A on Mac). If you press it once, it selects the current contiguous data range without selecting the whole empty sheet!',
          formulaSnippet: primaryFormula,
          createdAt: '12 hours ago',
          isVerifiedInstructorAnswer: true,
          upvotes: 11,
        },
      ],
    };
  }

  return [topicSpecificQ, ...SEEDED_QUESTIONS_BY_TOPIC.general];
}

/**
 * Load questions for a lesson from localStorage (or fallback to seed)
 */
export function loadLessonQuestions(
  lessonId: string,
  lessonTitle?: string,
  primaryFormula?: string
): LessonCommentQuestion[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${lessonId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading lesson questions from localStorage:', e);
  }

  const seeded = getInitialSeedQuestionsForLesson(lessonId, lessonTitle, primaryFormula);
  saveLessonQuestionsToStorage(lessonId, seeded);
  return seeded;
}

/**
 * Save questions array to localStorage
 */
export function saveLessonQuestionsToStorage(
  lessonId: string,
  questions: LessonCommentQuestion[]
): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${lessonId}`, JSON.stringify(questions));
  } catch (e) {
    console.warn('Failed writing lesson questions to localStorage:', e);
  }
}

/**
 * Post a new question from student
 */
export function postStudentQuestion(
  lessonId: string,
  authorName: string,
  authorEmail: string,
  authorRole: 'student' | 'admin' | 'instructor',
  title: string,
  content: string,
  category: LessonQuestionCategory,
  formulaSnippet?: string
): LessonCommentQuestion {
  const currentQuestions = loadLessonQuestions(lessonId);

  const newQuestion: LessonCommentQuestion = {
    id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    lessonId,
    authorName: authorName.trim() || 'Learner',
    authorEmail,
    authorRole,
    title: title.trim(),
    content: content.trim(),
    category,
    formulaSnippet: formulaSnippet?.trim() || undefined,
    status: 'open',
    upvotes: 1,
    createdAt: 'Just now',
    answers: [],
  };

  const updated = [newQuestion, ...currentQuestions];
  saveLessonQuestionsToStorage(lessonId, updated);
  return newQuestion;
}

/**
 * Post an answer/reply to a question (instructor or student)
 */
export function postAnswerToQuestion(
  lessonId: string,
  questionId: string,
  authorName: string,
  authorRole: 'instructor' | 'admin' | 'teaching_assistant' | 'student',
  authorEmail: string,
  content: string,
  formulaSnippet?: string
): LessonQuestionAnswer | null {
  const currentQuestions = loadLessonQuestions(lessonId);
  const qIdx = currentQuestions.findIndex((q) => q.id === questionId);
  if (qIdx === -1) return null;

  const isInstructor = authorRole === 'instructor' || authorRole === 'admin';

  const newAnswer: LessonQuestionAnswer = {
    id: `ans-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    questionId,
    authorName: authorName.trim() || (isInstructor ? 'Verified Instructor' : 'Learner'),
    authorRole,
    authorEmail,
    content: content.trim(),
    formulaSnippet: formulaSnippet?.trim() || undefined,
    createdAt: 'Just now',
    isVerifiedInstructorAnswer: isInstructor,
    upvotes: isInstructor ? 3 : 1,
  };

  currentQuestions[qIdx].answers.push(newAnswer);
  currentQuestions[qIdx].status = 'answered';

  saveLessonQuestionsToStorage(lessonId, currentQuestions);
  return newAnswer;
}

/**
 * Upvote a question
 */
export function upvoteQuestion(lessonId: string, questionId: string): void {
  const currentQuestions = loadLessonQuestions(lessonId);
  const q = currentQuestions.find((item) => item.id === questionId);
  if (q) {
    q.upvotes += 1;
    saveLessonQuestionsToStorage(lessonId, currentQuestions);
  }
}

/**
 * Upvote an answer
 */
export function upvoteAnswer(
  lessonId: string,
  questionId: string,
  answerId: string
): void {
  const currentQuestions = loadLessonQuestions(lessonId);
  const q = currentQuestions.find((item) => item.id === questionId);
  if (q) {
    const a = q.answers.find((ans) => ans.id === answerId);
    if (a) {
      a.upvotes += 1;
      saveLessonQuestionsToStorage(lessonId, currentQuestions);
    }
  }
}
