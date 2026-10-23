export type UserRole = 'visitor' | 'student_demo' | 'admin_demo' | 'admin';

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  isDemoSession: boolean;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  oneTimePrice: number;
  currency: 'NGN' | 'USD' | 'GHS' | 'KES' | 'ZAR';
  status: 'published' | 'draft';
  lifetimeAccessEntitlement: boolean;
  previewLessonCount: number;
  updatedAt: string;
}

export interface LessonResource {
  id: string;
  lessonId: string;
  fileName: string;
  fileDescription: string;
  downloadUrl?: string;
  fileFormat: 'XLSX Practice Workbook' | 'XLSX Template (CSV Demo)' | 'CSV Raw Dataset' | string;
  assignmentInstructions: string;
  expectedOutcome: string;
  sampleCsvContent: string;
}

export interface YoutubePlaylistPreviewItem {
  videoId: string;
  title: string;
  description: string;
  position: number;
  privacyStatus: string;
  thumbnailUrl?: string;
  eligible: boolean;
}

export type RecommendationStatus = 'candidate' | 'approved' | 'rejected';

export interface SuitabilityEvidence {
  audioLanguageTag: string | null;
  textLanguageTag?: string | null;
  hasClosedCaptions: boolean;
  isEmbeddable: boolean;
  isPublic: boolean;
  isAgeRestricted: boolean;
  topicMatchScore: number; // 0-40
  beginnerSignalScore: number; // 0-25
  channelTeachingScore: number; // 0-20
  durationScore: number; // 0-15
  totalRankScore: number; // 0-100
  evidenceSummary: string[];
  cautionNotes: string[];
}

export interface YoutubeVideoRecommendation {
  videoId: string;
  lessonId: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  description: string;
  thumbnailUrl: string;
  durationIso?: string;
  durationFormatted: string;
  durationSeconds: number;
  publishedAt?: string;
  viewCount?: number;
  likeCount?: number;
  whatYouWillLearn: string;
  suitabilityLabel:
    | 'Admin Approved · Beginner Suitable'
    | 'Strong Beginner Match (Metadata Evidence)'
    | 'Moderate Match (Needs Admin Review)'
    | 'Manual Admin Selection';
  evidence: SuitabilityEvidence;
  status: RecommendationStatus;
  isPrimary: boolean;
  source: 'youtube_discovery' | 'manual_url';
  discoveredAt: string;
  approvedAt?: string | null;
}

export type LessonVideoCoverageState =
  | 'approved'
  | 'awaiting_review'
  | 'missing_videos'
  | 'broken_video'
  | 'search_error';

export type StudentRecommendationState =
  | 'approved_available'
  | 'searching_or_awaiting_approval'
  | 'no_suitable_video'
  | 'technical_error';

export interface LessonVideoRecommendationsRecord {
  lessonId: string;
  searchQueryUsed: string;
  lastRefreshedAt: string | null;
  lastSuccessfulSearchAt?: string | null;
  lastError?: string | null;
  reviewReason?: string | null;
  brokenVideoIds?: string[];
  recommendations: YoutubeVideoRecommendation[];
}

export interface VideoCoverageAuditItem {
  lessonId: string;
  levelNumber: number;
  levelTitle: string;
  moduleId: string;
  moduleOrder: number;
  moduleTitle: string;
  lessonOrder: number;
  lessonTitle: string;
  isFreePreview: boolean;
  state: LessonVideoCoverageState;
  approvedCount: number;
  candidateCount: number;
  brokenCount: number;
  primaryVideoId: string | null;
  primaryVideoTitle: string | null;
  primaryChannelTitle: string | null;
  primaryDuration: string | null;
  primarySuitabilityLabel: string | null;
  primaryRankScore: number | null;
  searchQueryUsed: string;
  lastRefreshedAt: string | null;
  lastError: string | null;
  reviewReason: string | null;
}

export interface VideoCoverageAuditSummary {
  totalPublishedLessons: number;
  lessonsWithApprovedVideos: number;
  lessonsWithoutVideos: number;
  lessonsWithBrokenVideos: number;
  lessonsAwaitingReview: number;
  lessonsWithErrors: number;
  lastSuccessfulSearchDate: string | null;
  youtubeApiConfigured: boolean;
  supabaseConnected: boolean;
  apiOrDatabaseErrors: string[];
  items: VideoCoverageAuditItem[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  formulaContext?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  moduleId: string;
  title: string;
  passingScorePercent: number;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  lessonTitle: string;
  scorePercent: number;
  passed: boolean;
  totalQuestions: number;
  correctCount: number;
  attemptedAt: string;
  isSimulatedLocal: boolean;
}

export interface SpreadsheetDemoRow {
  rowNum: number;
  cells: (string | number)[];
  formulaNote?: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  levelNumber: number;
  orderIndex: number;
  title: string;
  description: string;
  durationMinutes: number;
  isFreePreview: boolean;
  youtubeVideoId?: string; // Reserved for authorized YouTube ID/URL in Stage 3
  keyFormulas: string[];
  conceptSummary: string[];
  demoSpreadsheetHeaders: string[];
  demoSpreadsheetRows: SpreadsheetDemoRow[];
  resource: LessonResource;
  quiz?: Quiz;
}

export interface Module {
  id: string;
  levelNumber: number;
  orderIndex: number;
  title: string;
  summary: string;
  lessons: Lesson[];
}

export interface ProjectBrief {
  id: string;
  projectNumber: number;
  title: string;
  category: string;
  businessProblem: string;
  sampleDatasetDescription: string;
  sampleHeaders: string[];
  sampleRows: (string | number)[][];
  objectives: string[];
  stepByStepInstructions: string[];
  requiredExcelSkills: string[];
  expectedDeliverables: string[];
  reviewChecklist: string[];
  modelSolutionExplanation: string;
  sampleCsvContent: string;
}

export interface CurriculumLevel {
  levelNumber: number;
  title: string;
  shortDescription: string;
  goal: string;
  keySkills: string[];
  practicalOutcome: string;
  modules: Module[];
  projects?: ProjectBrief[];
}

export interface ProjectSubmissionState {
  projectId: string;
  completedChecklistItems: number[];
  notes: string;
  status: 'not_started' | 'in_progress' | 'completed_local';
  updatedAt?: string;
}

export interface PurchaseRecord {
  id: string;
  userId: string;
  userEmail?: string;
  courseId: string;
  paystackReference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  paidAt: string | null;
  createdAt: string;
}

export interface AdminStudentRecord {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  completedLessonsCount: number;
  hasVerifiedPurchase: boolean;
}

export interface LevelCertificate {
  certificateId: string;
  studentName: string;
  studentEmail: string;
  levelNumber: number | 'all';
  levelTitle: string;
  credentialTitle: string;
  issuedDate: string;
  verificationHash: string;
  scorePercent?: number;
  instructorName: string;
}

export interface EndOfLevelExam {
  levelNumber: number;
  title: string;
  subtitle: string;
  description: string;
  passingScorePercent: number;
  totalQuestions: number;
  questions: QuizQuestion[];
}

export type LessonQuestionCategory =
  | 'Formula Troubleshooting'
  | 'General Question'
  | 'Exercise Help'
  | 'Excel Error (#N/A, #VALUE!)'
  | 'Tip or Shortcut';

export interface LessonQuestionAnswer {
  id: string;
  questionId: string;
  authorName: string;
  authorRole: 'instructor' | 'admin' | 'teaching_assistant' | 'student';
  authorEmail?: string;
  content: string;
  formulaSnippet?: string;
  createdAt: string;
  isVerifiedInstructorAnswer: boolean;
  upvotes: number;
}

export interface LessonCommentQuestion {
  id: string;
  lessonId: string;
  authorName: string;
  authorEmail?: string;
  authorRole: 'student' | 'admin' | 'instructor';
  title: string;
  content: string;
  formulaSnippet?: string;
  category: LessonQuestionCategory;
  status: 'answered' | 'open';
  upvotes: number;
  createdAt: string;
  answers: LessonQuestionAnswer[];
}

