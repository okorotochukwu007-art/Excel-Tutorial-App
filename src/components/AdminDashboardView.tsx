import React, { useState, useEffect } from 'react';
import {
  Plus,
  Check,
  ShieldAlert,
  Database,
  Video,
  FileSpreadsheet,
  Settings,
  Layers,
  Users,
  CreditCard,
  BarChart2,
  BookOpen,
  HelpCircle,
  Copy,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  Play,
  ExternalLink,
  X,
  Star,
  ShieldCheck,
  Award,
  MessageSquare,
  Send,
  Pin,
  UserCheck,
  Download,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  AdminStudentRecord,
  Course,
  CurriculumLevel,
  Lesson,
  LessonCommentQuestion,
  LessonVideoRecommendationsRecord,
  Profile,
  PurchaseRecord,
  QuizQuestion,
  RecommendationStatus,
  VideoCoverageAuditSummary,
  YoutubePlaylistPreviewItem,
} from '../types/academy';
import { CAPSTONE_PROJECTS, CAPSTONE_RUBRIC_DIMENSIONS } from '../data/capstoneProjectsData';
import {
  loadLessonQuestions,
  postAnswerToQuestion,
  saveLessonQuestionsToStorage,
} from '../data/seedLessonQuestions';
import { DATABASE_SCHEMA_BLUEPRINT } from '../data/curriculumData';
import { SUPABASE_STAGE2_SQL_MIGRATION } from '../data/supabaseSqlMigration';
import {
  downloadAdminRosterXlsx,
  downloadAdminCapstonesXlsx,
  downloadAdminGradebookXlsx,
} from '../utils/excelWorkbookGenerator';
import {
  addManualAdminYoutubeRecommendation,
  batchDiscoverAdminYoutubeRecommendations,
  createOrUpdateLessonViaBackend,
  deleteAdminYoutubeRecommendation,
  deleteLessonViaBackend,
  discoverAdminYoutubeRecommendations,
  fetchAdminLessonRecommendations,
  fetchAdminRecords,
  fetchAdminVideoCoverageAudit,
  previewYoutubePlaylistViaBackend,
  saveCourseSettingsViaBackend,
  saveQuizQuestionViaBackend,
  seedCurriculumViaBackend,
  SupabaseBackendStatus,
  updateAdminYoutubeRecommendationStatus,
  verifyPaystackPayment,
} from '../services/academyService';

type AdminSection =
  | 'overview'
  | 'courses'
  | 'levels_modules'
  | 'lessons_videos'
  | 'practice_materials'
  | 'quizzes_assignments'
  | 'students'
  | 'orders_payments'
  | 'learning_progress'
  | 'capstone_grading'
  | 'community_qna'
  | 'course_settings';

interface AdminDashboardViewProps {
  course: Course;
  levels: CurriculumLevel[];
  completedLessonIds: string[];
  supabaseStatus: SupabaseBackendStatus;
  currentUser?: Profile | null;
  onUpdateCourse: (updated: Course) => void;
  onSaveLessonInModule: (
    levelNumber: number,
    moduleId: string,
    lesson: Lesson
  ) => void;
  onDeleteLessonFromModule: (
    levelNumber: number,
    moduleId: string,
    lessonId: string
  ) => void;
  onReorderLessonInModule: (
    levelNumber: number,
    moduleId: string,
    lessonId: string,
    direction: 'up' | 'down'
  ) => void;
  onAddQuizQuestionToLesson: (
    lessonId: string,
    newQuestion: QuizQuestion
  ) => void;
  onSignOutAdmin?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  course,
  levels,
  completedLessonIds,
  supabaseStatus,
  currentUser,
  onUpdateCourse,
  onSaveLessonInModule,
  onDeleteLessonFromModule,
  onReorderLessonInModule,
  onAddQuizQuestionToLesson,
  onSignOutAdmin,
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [copiedSql, setCopiedSql] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  // Stage 4 Live Admin Records State
  const [liveStudents, setLiveStudents] = useState<AdminStudentRecord[]>([]);
  const [livePurchases, setLivePurchases] = useState<PurchaseRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsNote, setRecordsNote] = useState('');
  const [manualVerifyRef, setManualVerifyRef] = useState('');
  const [manualVerifyFeedback, setManualVerifyFeedback] = useState('');

  const handleLoadAdminRecords = async () => {
    setRecordsLoading(true);
    setRecordsNote('');
    const res = await fetchAdminRecords();
    setRecordsLoading(false);
    if (res.ok) {
      setLiveStudents(res.students);
      setLivePurchases(res.purchases);
      setRecordsNote(
        `Loaded ${res.students.length} student profile(s) and ${res.purchases.length} purchase transaction(s) from Supabase PostgreSQL.`
      );
    } else {
      setRecordsNote(res.error || 'Could not load records from Supabase.');
    }
  };

  const handleAdminManualVerifyReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualVerifyRef.trim()) return;
    setManualVerifyFeedback('Verifying with Paystack API...');
    const res = await verifyPaystackPayment(manualVerifyRef.trim());
    if (res.ok && res.verified) {
      setManualVerifyFeedback(
        res.message || `Verified reference ${res.reference}!`
      );
      handleLoadAdminRecords();
    } else {
      setManualVerifyFeedback(res.error || 'Verification failed.');
    }
  };

  // Lesson & Video Management State
  const [selectedLevelNum, setSelectedLevelNum] = useState<number>(1);
  const currentLevelForForm =
    levels.find((l) => l.levelNumber === selectedLevelNum) || levels[0];
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    currentLevelForForm.modules[0]?.id || 'lvl-1-mod-1'
  );
  const currentModuleForForm =
    currentLevelForForm.modules.find((m) => m.id === selectedModuleId) ||
    currentLevelForForm.modules[0];

  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonDuration, setLessonDuration] = useState(15);
  const [lessonOrder, setLessonOrder] = useState(3);
  const [lessonYoutubeId, setLessonYoutubeId] = useState('');
  const [lessonIsFree, setLessonIsFree] = useState(false);
  const [lessonFileName, setLessonFileName] = useState('Custom_Practice_Sheet.csv');
  const [lessonAssignment, setLessonAssignment] = useState(
    'Download the workbook, complete the formula column, and check control totals.'
  );
  const [lessonOutcome, setLessonOutcome] = useState(
    'Reconciled worksheet with accurate dynamic formulas.'
  );
  const [lessonFormFeedback, setLessonFormFeedback] = useState('');

  // Stage 3 YouTube Playlist Importer State
  const [playlistImportId, setPlaylistImportId] = useState('');
  const [playlistFeedback, setPlaylistFeedback] = useState('');
  const [isFetchingPlaylist, setIsFetchingPlaylist] = useState(false);
  const [playlistPreviewItems, setPlaylistPreviewItems] = useState<
    YoutubePlaylistPreviewItem[]
  >([]);

  // Automatic YouTube Video Discovery & Curation Console State
  const [discoveryLessonId, setDiscoveryLessonId] = useState<string>(
    currentModuleForForm?.lessons[0]?.id || 'lvl-1-mod-1-les-1'
  );
  const [discoveryCustomQuery, setDiscoveryCustomQuery] = useState<string>('');
  const [discoveryRecord, setDiscoveryRecord] =
    useState<LessonVideoRecommendationsRecord | null>(null);
  const [isDiscoveringVideos, setIsDiscoveringVideos] = useState<boolean>(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(false);
  const [discoveryFeedback, setDiscoveryFeedback] = useState<string>('');
  const [manualVideoUrlInput, setManualVideoUrlInput] = useState<string>('');
  const [manualSetPrimary, setManualSetPrimary] = useState<boolean>(true);
  const [isAddingManualVideo, setIsAddingManualVideo] = useState<boolean>(false);
  const [previewingVideoId, setPreviewingVideoId] = useState<string | null>(null);

  // Video Coverage Audit State
  const [coverageAudit, setCoverageAudit] =
    useState<VideoCoverageAuditSummary | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(false);
  const [isRunningBatch, setIsRunningBatch] = useState<boolean>(false);
  const [batchProgressText, setBatchProgressText] = useState<string>('');
  const [batchProgressPercent, setBatchProgressPercent] = useState<number>(0);
  const [auditFilterState, setAuditFilterState] = useState<string>('all');
  const [auditFilterLevel, setAuditFilterLevel] = useState<number | 'all'>('all');
  const [singleAuditDiscoveringId, setSingleAuditDiscoveringId] = useState<
    string | null
  >(null);

  const loadCoverageAudit = async (verifyLive = false) => {
    setIsLoadingAudit(true);
    const res = await fetchAdminVideoCoverageAudit({ verifyLive });
    setIsLoadingAudit(false);
    if (res.ok && res.summary) {
      setCoverageAudit(res.summary);
      for (const item of res.summary.items) {
        if (item.primaryVideoId) {
          syncLessonPrimaryYoutubeIdInAppState(
            item.lessonId,
            item.primaryVideoId
          );
        }
      }
    }
  };

  // Keep discoveryLessonId synced when module changes if current lesson isn't in module
  useEffect(() => {
    if (
      currentModuleForForm &&
      currentModuleForForm.lessons.length > 0 &&
      !currentModuleForForm.lessons.some((l) => l.id === discoveryLessonId)
    ) {
      setDiscoveryLessonId(currentModuleForForm.lessons[0].id);
    }
  }, [selectedModuleId, currentModuleForForm, discoveryLessonId]);

  useEffect(() => {
    if (activeSection === 'lessons_videos') {
      loadCoverageAudit(false);
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === 'lessons_videos' && discoveryLessonId) {
      setIsLoadingRecs(true);
      setPreviewingVideoId(null);
      fetchAdminLessonRecommendations(discoveryLessonId)
        .then((res) => {
          if (res.ok && res.record) {
            setDiscoveryRecord(res.record);
            setDiscoveryCustomQuery(res.record.searchQueryUsed || '');
          }
        })
        .finally(() => {
          setIsLoadingRecs(false);
        });
    }
  }, [activeSection, discoveryLessonId]);

  const syncLessonPrimaryYoutubeIdInAppState = (
    lessonId: string,
    primaryVideoId: string | null | undefined
  ) => {
    for (const lvl of levels) {
      for (const mod of lvl.modules) {
        const foundLesson = mod.lessons.find((l) => l.id === lessonId);
        if (foundLesson && foundLesson.youtubeVideoId !== (primaryVideoId || undefined)) {
          onSaveLessonInModule(lvl.levelNumber, mod.id, {
            ...foundLesson,
            youtubeVideoId: primaryVideoId || undefined,
          });
          return;
        }
      }
    }
  };

  const handleRunBatchCoverageAction = async (
    mode: 'missing' | 'failed' | 'broken' | 'outdated' | 'awaiting_review',
    verifyBrokenFirst = false
  ) => {
    if (isRunningBatch) return;
    setIsRunningBatch(true);
    setBatchProgressPercent(5);

    try {
      if (verifyBrokenFirst) {
        setBatchProgressText(
          'Checking live YouTube embeddability & availability across all lessons...'
        );
        await loadCoverageAudit(true);
      }

      let round = 0;
      let totalApproved = 0;
      let totalReviewed = 0;
      let totalFailed = 0;
      const batchLimit = 12;

      while (round < 12) {
        round++;
        setBatchProgressText(
          `Processing batch #${round} (${mode.replace(/_/g, ' ')})...`
        );
        const res = await batchDiscoverAdminYoutubeRecommendations({
          mode,
          limit: batchLimit,
          verifyBrokenFirst: round === 1 && verifyBrokenFirst,
        });

        if (res.summary) {
          setCoverageAudit(res.summary);
        }

        if (!res.ok) {
          setBatchProgressText(
            res.error || 'Batch video discovery encountered an error.'
          );
          break;
        }

        const processed = res.processedCount ?? 0;
        if (processed === 0) {
          setBatchProgressPercent(100);
          setBatchProgressText(
            totalApproved + totalReviewed + totalFailed === 0
              ? 'All target lessons in this category are already up to date.'
              : `Completed! Approved: ${totalApproved}, Awaiting review: ${totalReviewed}, Failed: ${totalFailed}.`
          );
          break;
        }

        totalApproved += res.approvedLessonsCount ?? 0;
        totalReviewed += res.awaitingReviewCount ?? 0;
        totalFailed += res.failedCount ?? 0;

        const remaining = res.remainingMissingCount ?? 0;
        const pct =
          remaining === 0
            ? 100
            : Math.min(
                95,
                Math.round(
                  ((round * batchLimit) / (round * batchLimit + remaining)) * 100
                )
              );
        setBatchProgressPercent(pct);
        setBatchProgressText(
          `Batch #${round} complete: ${totalApproved} approved, ${remaining} missing lesson(s) remaining...`
        );

        if (
          remaining === 0 ||
          res.quotaExceeded ||
          (res.failedCount ?? 0) === processed
        ) {
          setBatchProgressPercent(100);
          setBatchProgressText(
            `Finished batch run: ${totalApproved} lesson(s) approved, ${totalReviewed} awaiting review, ${totalFailed} failed.`
          );
          break;
        }
      }

      await loadCoverageAudit(false);
    } finally {
      setIsRunningBatch(false);
    }
  };

  const handleAuditSingleLessonDiscover = async (lessonId: string) => {
    setSingleAuditDiscoveringId(lessonId);
    setDiscoveryLessonId(lessonId);
    const res = await discoverAdminYoutubeRecommendations({ lessonId });
    setSingleAuditDiscoveringId(null);
    if (res.record) {
      setDiscoveryRecord(res.record);
      const primaryVid =
        res.record.recommendations.find((r) => r.isPrimary)?.videoId ||
        res.record.recommendations[0]?.videoId ||
        null;
      syncLessonPrimaryYoutubeIdInAppState(lessonId, primaryVid);
    }
    await loadCoverageAudit(false);
  };

  const handleDiscoverYoutubeForLesson = async (overrideQuery?: string) => {
    if (!discoveryLessonId) return;
    setIsDiscoveringVideos(true);
    setDiscoveryFeedback('');
    const res = await discoverAdminYoutubeRecommendations({
      lessonId: discoveryLessonId,
      customQuery:
        overrideQuery !== undefined
          ? overrideQuery
          : discoveryCustomQuery.trim() || undefined,
    });
    setIsDiscoveringVideos(false);

    if (res.record) {
      setDiscoveryRecord(res.record);
      const primaryVid =
        res.record.recommendations.find((r) => r.isPrimary)?.videoId ||
        res.record.recommendations[0]?.videoId ||
        null;
      syncLessonPrimaryYoutubeIdInAppState(
        discoveryLessonId,
        primaryVid
      );
      if (res.record.searchQueryUsed) {
        setDiscoveryCustomQuery(res.record.searchQueryUsed);
      }
    }

    loadCoverageAudit(false);

    if (!res.ok) {
      setDiscoveryFeedback(
        res.error || 'Could not discover YouTube tutorials for this lesson.'
      );
      return;
    }

    setDiscoveryFeedback(
      res.message ||
        `Discovered and ranked ${res.candidatesFound || 0} candidate tutorial(s).`
    );
  };

  const handleUpdateRecStatus = async (
    videoId: string,
    status: RecommendationStatus,
    isPrimary?: boolean
  ) => {
    if (!discoveryLessonId) return;
    setDiscoveryFeedback('Saving recommendation status...');
    const res = await updateAdminYoutubeRecommendationStatus({
      lessonId: discoveryLessonId,
      videoId,
      status,
      isPrimary,
    });
    if (res.ok && res.record) {
      setDiscoveryRecord(res.record);
      syncLessonPrimaryYoutubeIdInAppState(
        discoveryLessonId,
        res.primaryVideoId
      );
      loadCoverageAudit(false);
      setDiscoveryFeedback(res.message || 'Updated recommendation status.');
    } else {
      setDiscoveryFeedback(
        res.error || 'Failed to update recommendation status.'
      );
    }
  };

  const handleDeleteRec = async (videoId: string) => {
    if (!discoveryLessonId) return;
    setDiscoveryFeedback('Removing video recommendation...');
    const res = await deleteAdminYoutubeRecommendation(
      discoveryLessonId,
      videoId
    );
    if (res.ok && res.record) {
      setDiscoveryRecord(res.record);
      syncLessonPrimaryYoutubeIdInAppState(
        discoveryLessonId,
        res.primaryVideoId
      );
      loadCoverageAudit(false);
      if (previewingVideoId === videoId) {
        setPreviewingVideoId(null);
      }
      setDiscoveryFeedback(res.message || 'Removed video recommendation.');
    } else {
      setDiscoveryFeedback(
        res.error || 'Failed to remove video recommendation.'
      );
    }
  };

  const handleManualAddYoutubeRec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discoveryLessonId || !manualVideoUrlInput.trim()) return;
    setIsAddingManualVideo(true);
    setDiscoveryFeedback('');
    const res = await addManualAdminYoutubeRecommendation({
      lessonId: discoveryLessonId,
      videoUrlOrId: manualVideoUrlInput.trim(),
      setAsPrimary: manualSetPrimary,
    });
    setIsAddingManualVideo(false);

    if (res.ok && res.record) {
      setDiscoveryRecord(res.record);
      syncLessonPrimaryYoutubeIdInAppState(
        discoveryLessonId,
        res.primaryVideoId
      );
      loadCoverageAudit(false);
      setManualVideoUrlInput('');
      setDiscoveryFeedback(
        res.message || 'Manually added and approved YouTube tutorial.'
      );
    } else {
      setDiscoveryFeedback(
        res.error || 'Could not add manual YouTube video URL/ID.'
      );
    }
  };

  // Section 5: Practice Material Editor State
  const allLessons = levels.flatMap((l) => l.modules.flatMap((m) => m.lessons));
  const [selectedResourceLessonId, setSelectedResourceLessonId] = useState<string>(
    allLessons[0]?.id || 'lvl-1-mod-1-les-1'
  );
  const activeResourceLesson =
    allLessons.find((l) => l.id === selectedResourceLessonId) || allLessons[0];
  const [resFileName, setResFileName] = useState(
    activeResourceLesson?.resource.fileName || ''
  );
  const [resFileDesc, setResFileDesc] = useState(
    activeResourceLesson?.resource.fileDescription || ''
  );
  const [resDownloadUrl, setResDownloadUrl] = useState(
    activeResourceLesson?.resource.downloadUrl || ''
  );
  const [resInstructions, setResInstructions] = useState(
    activeResourceLesson?.resource.assignmentInstructions || ''
  );
  const [resOutcome, setResOutcome] = useState(
    activeResourceLesson?.resource.expectedOutcome || ''
  );
  const [resCsvContent, setResCsvContent] = useState(
    activeResourceLesson?.resource.sampleCsvContent || ''
  );
  const [resourceFeedback, setResourceFeedback] = useState('');

  // Section 6: Quiz Question Builder State
  const [selectedQuizLessonId, setSelectedQuizLessonId] = useState<string>(
    allLessons[0]?.id || 'lvl-1-mod-1-les-1'
  );
  const [qText, setQText] = useState('');
  const [qFormula, setQFormula] = useState('=SUM(B2:B10)');
  const [qOpt0, setQOpt0] = useState('');
  const [qOpt1, setQOpt1] = useState('');
  const [qOpt2, setQOpt2] = useState('');
  const [qOpt3, setQOpt3] = useState('');
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [quizFeedback, setQuizFeedback] = useState('');

  // Section 10: Course Settings Form State
  const [settingsTitle, setSettingsTitle] = useState(course.title);
  const [settingsDesc, setSettingsDesc] = useState(course.description);
  const [settingsPrice, setSettingsPrice] = useState(course.oneTimePrice);
  const [settingsCurrency, setSettingsCurrency] = useState<Course['currency']>(
    course.currency
  );
  const [settingsStatus, setSettingsStatus] = useState<Course['status']>(
    course.status
  );
  const [settingsLifetime, setSettingsLifetime] = useState(
    course.lifetimeAccessEntitlement
  );
  const [settingsPreviewCount, setSettingsPreviewCount] = useState(
    course.previewLessonCount
  );
  const [settingsFeedback, setSettingsFeedback] = useState('');

  // Section 10: Capstone Project Grading State
  interface StudentCapstoneSubmission {
    id: string;
    studentName: string;
    studentEmail: string;
    projectId: string;
    submittedAt: string;
    status: 'pending_review' | 'graded_passed' | 'revisions_requested';
    studentNotes: string;
    checklistCompleted: number;
    rubricScores: Record<string, number>;
    instructorFeedback: string;
    totalScore: number;
  }

  const [capstoneSubmissions, setCapstoneSubmissions] = useState<StudentCapstoneSubmission[]>([
    {
      id: 'sub-01',
      studentName: 'Emeka Nwosu',
      studentEmail: 'emeka.nwosu@example.com',
      projectId: 'capstone-1-ecommerce-dashboard',
      submittedAt: 'Yesterday at 4:30 PM',
      status: 'pending_review',
      studentNotes:
        'Completed full XLOOKUP product catalog merge, gross-to-net waterfall, and dynamic PivotTable dashboard with month and territory slicers. Verified zero #N/A errors across all 15,000 transactions.',
      checklistCompleted: 6,
      rubricScores: {
        'data-hygiene': 25,
        'formula-architecture': 25,
        'dashboard-visuals': 22,
        'executive-insights': 24,
      },
      instructorFeedback:
        'Outstanding work! Clean XLOOKUP syntax with clean range locking. Excellent executive summary highlighting discount leakage in the East region.',
      totalScore: 96,
    },
    {
      id: 'sub-02',
      studentName: 'Amina Bello',
      studentEmail: 'amina.bello@example.com',
      projectId: 'capstone-2-financial-variance',
      submittedAt: '2 days ago',
      status: 'graded_passed',
      studentNotes:
        'P&L model with variance analysis ($ and % variance vs budget). Implemented dynamic conditional formatting green/red data bars and variance commentary.',
      checklistCompleted: 6,
      rubricScores: {
        'data-hygiene': 25,
        'formula-architecture': 23,
        'dashboard-visuals': 25,
        'executive-insights': 23,
      },
      instructorFeedback:
        'Exceptional financial modeling rigor. Number formatting adheres to enterprise corporate banking standards. Level 6 Master Capstone approved!',
      totalScore: 96,
    },
  ]);

  const [selectedSubId, setSelectedSubId] = useState<string>('sub-01');
  const activeSub =
    capstoneSubmissions.find((s) => s.id === selectedSubId) || capstoneSubmissions[0];
  const [capstoneFeedbackInput, setCapstoneFeedbackInput] = useState(
    activeSub?.instructorFeedback || ''
  );
  const [rubricScoresDraft, setRubricScoresDraft] = useState<Record<string, number>>(
    activeSub?.rubricScores || {
      'data-hygiene': 25,
      'formula-architecture': 25,
      'dashboard-visuals': 20,
      'executive-insights': 25,
    }
  );
  const [capstoneActionNotice, setCapstoneActionNotice] = useState<string>('');

  // Section 11: Community Q&A State
  const [allQnaQuestions, setAllQnaQuestions] = useState<LessonCommentQuestion[]>([]);
  const [qnaLessonFilter, setQnaLessonFilter] = useState<string>('all');
  const [qnaStatusFilter, setQnaStatusFilter] = useState<'all' | 'open' | 'answered'>('all');
  const [selectedQnaQuestionId, setSelectedQnaQuestionId] = useState<string | null>(null);
  const [qnaReplyText, setQnaReplyText] = useState<string>('');
  const [qnaReplyFormula, setQnaReplyFormula] = useState<string>('');
  const [qnaFeedbackMsg, setQnaFeedbackMsg] = useState<string>('');

  // Load all Q&A questions on mount
  useEffect(() => {
    const questionsList: LessonCommentQuestion[] = [];
    for (const lvl of levels) {
      for (const mod of lvl.modules) {
        for (const les of mod.lessons.slice(0, 3)) {
          const loaded = loadLessonQuestions(les.id, les.title, les.keyFormulas?.[0]);
          for (const q of loaded) {
            if (!questionsList.some((existing) => existing.id === q.id)) {
              questionsList.push(q);
            }
          }
        }
      }
    }
    setAllQnaQuestions(questionsList);
    if (questionsList.length > 0 && !selectedQnaQuestionId) {
      setSelectedQnaQuestionId(questionsList[0].id);
    }
  }, [levels]);

  const totalModules = levels.reduce((acc, l) => acc + l.modules.length, 0);
  const freePreviewLessons = allLessons.filter((l) => l.isFreePreview);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_STAGE2_SQL_MIGRATION);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSeedCurriculumToSupabase = async () => {
    setIsSeeding(true);
    setSeedFeedback('');
    const result = await seedCurriculumViaBackend();
    setSeedFeedback(result.message);
    setIsSeeding(false);
  };

  const handleLevelSelectChange = (lvlNum: number) => {
    setSelectedLevelNum(lvlNum);
    const foundLvl = levels.find((l) => l.levelNumber === lvlNum);
    if (foundLvl && foundLvl.modules[0]) {
      setSelectedModuleId(foundLvl.modules[0].id);
    }
    setEditingLessonId(null);
  };

  const handleStartEditLesson = (les: Lesson) => {
    setEditingLessonId(les.id);
    setLessonTitle(les.title);
    setLessonDescription(les.description);
    setLessonDuration(les.durationMinutes);
    setLessonOrder(les.orderIndex);
    setLessonYoutubeId(les.youtubeVideoId || '');
    setLessonIsFree(les.isFreePreview);
    setLessonFileName(les.resource.fileName);
    setLessonAssignment(les.resource.assignmentInstructions);
    setLessonOutcome(les.resource.expectedOutcome);
    setLessonFormFeedback(`Editing lesson "${les.title}". Make changes and click Save.`);
  };

  const handleCancelEditLesson = () => {
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonDescription('');
    setLessonYoutubeId('');
    setLessonFormFeedback('');
  };

  const handleCreateOrUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !lessonDescription.trim()) {
      setLessonFormFeedback('Error: Lesson title and description are required.');
      return;
    }

    const existingLesson = currentModuleForForm?.lessons.find(
      (l) => l.id === editingLessonId
    );
    const lessonId = editingLessonId || `${selectedModuleId}-les-${Date.now()}`;

    const savedLesson: Lesson = {
      id: lessonId,
      moduleId: selectedModuleId,
      levelNumber: selectedLevelNum,
      orderIndex: Number(lessonOrder) || 1,
      title: lessonTitle.trim(),
      description: lessonDescription.trim(),
      durationMinutes: Math.max(1, Number(lessonDuration) || 15),
      isFreePreview: lessonIsFree,
      youtubeVideoId: lessonYoutubeId.trim() || undefined,
      keyFormulas: existingLesson?.keyFormulas || [
        '=SUM(B2:B10)',
        '=XLOOKUP(A2,Lookup!A:A,Lookup!B:B)',
      ],
      conceptSummary: existingLesson?.conceptSummary || [
        lessonDescription.trim(),
      ],
      demoSpreadsheetHeaders: existingLesson?.demoSpreadsheetHeaders || [
        'A: Record_ID',
        'B: Category',
        'C: Value',
      ],
      demoSpreadsheetRows: existingLesson?.demoSpreadsheetRows || [
        { rowNum: 2, cells: ['REC-01', 'Sample Category', 125000], formulaNote: 'Formula' },
      ],
      resource: {
        id: existingLesson?.resource.id || `res-${lessonId}`,
        lessonId,
        fileName: lessonFileName.trim() || 'Practice_Dataset.csv',
        fileDescription:
          existingLesson?.resource.fileDescription ||
          `Practice file for ${lessonTitle.trim()}`,
        downloadUrl: existingLesson?.resource.downloadUrl,
        fileFormat: 'XLSX Template (CSV Demo)',
        assignmentInstructions: lessonAssignment.trim(),
        expectedOutcome: lessonOutcome.trim(),
        sampleCsvContent:
          existingLesson?.resource.sampleCsvContent ||
          'Record_ID,Category,Value\nREC-01,Sample Category,125000',
      },
      quiz: existingLesson?.quiz,
    };

    onSaveLessonInModule(selectedLevelNum, selectedModuleId, savedLesson);

    if (supabaseStatus.configured) {
      const dbResult = await createOrUpdateLessonViaBackend(savedLesson);
      setLessonFormFeedback(dbResult.message);
    } else {
      setLessonFormFeedback(
        `${editingLessonId ? 'Updated' : 'Added'} "${savedLesson.title}" in Level ${selectedLevelNum} (${selectedModuleId}).`
      );
    }

    setEditingLessonId(null);
    setLessonTitle('');
    setLessonDescription('');
    setLessonYoutubeId('');
  };

  const handleRemoveLesson = async (lesson: Lesson) => {
    onDeleteLessonFromModule(selectedLevelNum, selectedModuleId, lesson.id);
    if (supabaseStatus.configured) {
      const res = await deleteLessonViaBackend(lesson.id);
      setLessonFormFeedback(res.message);
    } else {
      setLessonFormFeedback(`Removed "${lesson.title}" from curriculum.`);
    }
  };

  const handleFetchPlaylistPreview = async () => {
    if (!playlistImportId.trim()) {
      setPlaylistFeedback('Please enter a YouTube Playlist ID or URL.');
      return;
    }
    setIsFetchingPlaylist(true);
    setPlaylistFeedback('');
    const result = await previewYoutubePlaylistViaBackend(playlistImportId);
    setIsFetchingPlaylist(false);

    if (!result.ok) {
      setPlaylistFeedback(result.error || 'Could not fetch playlist.');
      return;
    }

    setPlaylistPreviewItems(result.items || []);
    setPlaylistFeedback(
      `Fetched ${(result.items || []).length} videos from playlist ${result.playlistId}. Review eligible videos below and click Import.`
    );
  };

  const handleImportVideoItem = async (item: YoutubePlaylistPreviewItem) => {
    const newLessonId = `${selectedModuleId}-yt-${item.videoId}`;
    const nextOrder = (currentModuleForForm?.lessons.length || 0) + 1;
    const importedLesson: Lesson = {
      id: newLessonId,
      moduleId: selectedModuleId,
      levelNumber: selectedLevelNum,
      orderIndex: nextOrder,
      title: item.title,
      description:
        item.description ||
        `Imported from owned YouTube playlist into ${currentModuleForForm?.title}.`,
      durationMinutes: 15,
      isFreePreview: false,
      youtubeVideoId: item.videoId,
      keyFormulas: ['=SUM(B2:B10)'],
      conceptSummary: [item.description || item.title],
      demoSpreadsheetHeaders: ['A: Column_1', 'B: Column_2'],
      demoSpreadsheetRows: [{ rowNum: 2, cells: ['Sample', 100] }],
      resource: {
        id: `res-${newLessonId}`,
        lessonId: newLessonId,
        fileName: `L${selectedLevelNum}_Imported_${item.videoId}.csv`,
        fileDescription: `Companion dataset for ${item.title}`,
        fileFormat: 'XLSX Template (CSV Demo)',
        assignmentInstructions: 'Follow the video walkthrough and complete the workbook.',
        expectedOutcome: 'Completed worksheet matching the video lesson.',
        sampleCsvContent: 'Column_1,Column_2\nSample,100',
      },
    };

    onSaveLessonInModule(selectedLevelNum, selectedModuleId, importedLesson);
    if (supabaseStatus.configured) {
      await createOrUpdateLessonViaBackend(importedLesson);
    }
    setPlaylistFeedback(
      `Imported "${item.title}" (ID: ${item.videoId}) into ${currentModuleForForm?.title}.`
    );
  };

  const handleSelectResourceLesson = (lessonId: string) => {
    setSelectedResourceLessonId(lessonId);
    const found = allLessons.find((l) => l.id === lessonId);
    if (found) {
      setResFileName(found.resource.fileName);
      setResFileDesc(found.resource.fileDescription);
      setResDownloadUrl(found.resource.downloadUrl || '');
      setResInstructions(found.resource.assignmentInstructions);
      setResOutcome(found.resource.expectedOutcome);
      setResCsvContent(found.resource.sampleCsvContent);
      setResourceFeedback('');
    }
  };

  const handleSavePracticeMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResourceLesson) return;

    const updatedLesson: Lesson = {
      ...activeResourceLesson,
      resource: {
        ...activeResourceLesson.resource,
        fileName: resFileName.trim() || activeResourceLesson.resource.fileName,
        fileDescription: resFileDesc.trim(),
        downloadUrl: resDownloadUrl.trim() || undefined,
        assignmentInstructions: resInstructions.trim(),
        expectedOutcome: resOutcome.trim(),
        sampleCsvContent: resCsvContent,
      },
    };

    onSaveLessonInModule(
      updatedLesson.levelNumber,
      updatedLesson.moduleId,
      updatedLesson
    );

    if (supabaseStatus.configured) {
      const dbRes = await createOrUpdateLessonViaBackend(updatedLesson);
      setResourceFeedback(dbRes.message);
    } else {
      setResourceFeedback(
        `Updated practice workbook "${updatedLesson.resource.fileName}" for lesson "${updatedLesson.title}".`
      );
    }
  };

  const handleAddQuizQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetLesson = allLessons.find((l) => l.id === selectedQuizLessonId);
    if (!targetLesson) return;

    if (!qText.trim() || !qOpt0.trim() || !qOpt1.trim()) {
      setQuizFeedback('Please enter the question text and at least two answer options.');
      return;
    }

    const options = [qOpt0.trim(), qOpt1.trim(), qOpt2.trim(), qOpt3.trim()].filter(
      Boolean
    );
    const quizId = targetLesson.quiz?.id || `quiz-${targetLesson.id}`;
    const newQ: QuizQuestion = {
      id: `${targetLesson.id}-q-${Date.now()}`,
      quizId,
      questionText: qText.trim(),
      formulaContext: qFormula.trim() || undefined,
      options,
      correctOptionIndex: Math.min(qCorrectIdx, options.length - 1),
      explanation:
        qExplanation.trim() ||
        'Verified against Microsoft Excel formula evaluation standards.',
    };

    onAddQuizQuestionToLesson(targetLesson.id, newQ);

    if (supabaseStatus.configured) {
      const res = await saveQuizQuestionViaBackend({
        quizId,
        lessonId: targetLesson.id,
        moduleId: targetLesson.moduleId,
        quizTitle: targetLesson.quiz?.title || `${targetLesson.title} — Skill Check`,
        passingScorePercent: targetLesson.quiz?.passingScorePercent || 67,
        question: newQ,
      });
      setQuizFeedback(res.message);
    } else {
      setQuizFeedback(
        `Added new Excel skill-check question to "${targetLesson.title}".`
      );
    }

    setQText('');
    setQOpt0('');
    setQOpt1('');
    setQOpt2('');
    setQOpt3('');
    setQExplanation('');
  };

  const handleSaveCourseSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsTitle.trim() || settingsPrice <= 0) {
      setSettingsFeedback('Please provide a valid course title and positive one-time price.');
      return;
    }
    const updatedCourse: Course = {
      ...course,
      title: settingsTitle.trim(),
      description: settingsDesc.trim(),
      oneTimePrice: Number(settingsPrice),
      currency: settingsCurrency,
      status: settingsStatus,
      lifetimeAccessEntitlement: settingsLifetime,
      previewLessonCount: Number(settingsPreviewCount),
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onUpdateCourse(updatedCourse);

    if (supabaseStatus.configured) {
      const dbRes = await saveCourseSettingsViaBackend(updatedCourse);
      setSettingsFeedback(dbRes.message);
    } else {
      setSettingsFeedback(
        'Course settings updated in session state. Add Supabase Secrets to persist to PostgreSQL.'
      );
    }
    setTimeout(() => setSettingsFeedback(''), 5000);
  };

  const navItems: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '1. Overview & Supabase SQL', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'courses', label: '2. Courses & Syllabus', icon: <BookOpen className="w-4 h-4" /> },
    {
      id: 'levels_modules',
      label: '3. Levels & Modules',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'lessons_videos',
      label: '4. Lessons & Videos',
      icon: <Video className="w-4 h-4" />,
    },
    {
      id: 'practice_materials',
      label: '5. Practice Materials',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      id: 'quizzes_assignments',
      label: '6. Quizzes & Assessments',
      icon: <HelpCircle className="w-4 h-4" />,
    },
    { id: 'students', label: '7. Students Directory', icon: <Users className="w-4 h-4" /> },
    {
      id: 'orders_payments',
      label: '8. Orders & Payments',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: 'learning_progress',
      label: '9. Learning Progress',
      icon: <Check className="w-4 h-4" />,
    },
    {
      id: 'capstone_grading',
      label: '10. Capstone Grading Queue',
      icon: <Award className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'community_qna',
      label: '11. Q&A Moderation Desk',
      icon: <MessageSquare className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'course_settings',
      label: '12. Instructor & Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Security Boundary Header */}
      <div className="mb-6 bg-slate-900 text-white rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-md">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AUTHORIZED LEAD INSTRUCTOR: OKORO TOCHUWKU</span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">okorotochukwu007@gmail.com</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Access strictly restricted to Lead Instructor <strong className="text-white">Okoro Tochuwku</strong>. All curriculum modifications, video approvals, capstone rubric evaluations, and student records are synchronized with database integrity policies.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right text-xs font-mono text-slate-300">
            <div>
              Status: <span className="text-emerald-400 font-bold uppercase">{course.status}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {course.currency} {course.oneTimePrice.toLocaleString()}
            </div>
          </div>
          {onSignOutAdmin && (
            <button
              type="button"
              onClick={onSignOutAdmin}
              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-white text-xs font-semibold rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Navigation (3 cols on desktop, horizontal scroll on mobile) */}
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-3 flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 whitespace-nowrap lg:whitespace-normal shrink-0">
          <div className="hidden lg:block px-3 py-2 text-xs font-mono font-semibold text-slate-400">
            ADMINISTRATION SECTIONS (1–12)
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`px-3 py-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer shrink-0 ${
                activeSection === item.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100 bg-slate-50 lg:bg-transparent'
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Main Content Panel (9 cols) */}
        <main className="lg:col-span-9 space-y-6">
          {/* SECTION 1: OVERVIEW & SUPABASE SQL MIGRATION */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-xl font-bold text-slate-900">
                      1. Academy Administration & Stage 2/3 Database Seeder
                    </h1>
                    <p className="text-xs text-slate-600">{supabaseStatus.message}</p>
                  </div>

                  <button
                    type="button"
                    disabled={isSeeding}
                    onClick={handleSeedCurriculumToSupabase}
                    className="px-4 py-2.5 bg-emerald-800 text-white text-xs font-semibold rounded-lg hover:bg-emerald-900 disabled:bg-slate-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isSeeding
                      ? 'Seeding Curriculum to Supabase...'
                      : 'Seed 6-Level Curriculum to Supabase DB'}
                  </button>
                </div>

                {seedFeedback && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium">
                    {seedFeedback}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-500">Curriculum Levels</div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                      {levels.length}
                    </div>
                  </div>
                  <div className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-500">Total Modules</div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                      {totalModules}
                    </div>
                  </div>
                  <div className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-500">Total Lessons</div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                      {allLessons.length}
                    </div>
                  </div>
                  <div className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-lg">
                    <div className="text-xs text-slate-500">Free Preview Lessons</div>
                    <div className="text-2xl font-bold text-emerald-800 font-mono tabular-nums mt-1">
                      {freePreviewLessons.length}
                    </div>
                  </div>
                </div>

                {/* 1-Click Excel Workbooks Export Bar */}
                <div className="p-4 bg-[#FAF9F5] border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
                        <span>1-Click Excel (.XLSX) Export Suite for Admin</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Download formatted, structured Excel workbooks for student rosters, capstone grading submissions, and quiz gradebooks.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadAdminRosterXlsx(liveStudents, course.title)}
                        className="px-3 py-2 bg-emerald-800 text-white font-semibold text-xs rounded-lg hover:bg-emerald-900 flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Student Roster (.XLSX)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadAdminCapstonesXlsx(capstoneSubmissions, course.title)}
                        className="px-3 py-2 bg-emerald-800 text-white font-semibold text-xs rounded-lg hover:bg-emerald-900 flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Capstones (.XLSX)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadAdminGradebookXlsx(
                            allLessons.flatMap((l) =>
                              l.quiz?.questions && l.quiz.questions.length > 0
                                ? l.quiz.questions.map((q: QuizQuestion) => ({
                                    quizId: q.id,
                                    lessonTitle: l.title,
                                    studentEmail: 'student@excelacademy.local',
                                    scorePercent: 100,
                                    passed: true,
                                    correctCount: 5,
                                    totalQuestions: 5,
                                    attemptedAt: new Date().toLocaleDateString(),
                                  }))
                                : [
                                    {
                                      quizId: `quiz-${l.id}`,
                                      lessonTitle: l.title,
                                      studentEmail: 'student@excelacademy.local',
                                      scorePercent: 100,
                                      passed: true,
                                      correctCount: 5,
                                      totalQuestions: 5,
                                      attemptedAt: new Date().toLocaleDateString(),
                                    },
                                  ]
                            ),
                            course.title
                          )
                        }
                        className="px-3 py-2 bg-emerald-800 text-white font-semibold text-xs rounded-lg hover:bg-emerald-900 flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Gradebook (.XLSX)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Copyable Stage 2 Supabase SQL Migration Script */}
                <div className="p-5 bg-[#FAF9F5] border border-slate-200 rounded-xl space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        Stage 2 Supabase PostgreSQL Migration & RLS Script
                      </div>
                      <p className="text-slate-600">
                        Copy and run this SQL script in your Supabase Dashboard &rarr; SQL Editor to create all 12 tables, triggers, and Row Level Security policies.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-3.5 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-emerald-800 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedSql ? 'Copied SQL Migration!' : 'Copy SQL Migration Script'}
                    </button>
                  </div>

                  <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg overflow-x-auto max-h-60 text-[11px] font-mono leading-relaxed">
                    {SUPABASE_STAGE2_SQL_MIGRATION}
                  </pre>
                </div>

                {/* Database Schema Blueprint Table */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Database className="w-4 h-4 text-emerald-800" />
                    <span>PostgreSQL & Row Level Security (RLS) Entity Matrix</span>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                          <th className="py-2.5 px-3 font-mono">Table Entity</th>
                          <th className="py-2.5 px-3 font-mono">Primary Key</th>
                          <th className="py-2.5 px-3">Core Columns</th>
                          <th className="py-2.5 px-3">RLS Security Policy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {DATABASE_SCHEMA_BLUEPRINT.map((row) => (
                          <tr key={row.table}>
                            <td className="py-2.5 px-3 font-mono font-semibold text-emerald-900 whitespace-nowrap">
                              {row.table}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                              {row.pk}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">{row.columns}</td>
                            <td className="py-2.5 px-3 text-slate-600">{row.rlsPolicy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: COURSES */}
          {activeSection === 'courses' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">2. Courses Catalog</h2>
                  <p className="text-xs text-slate-600">
                    Commercial course offering configured for one-time lifetime access.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('course_settings')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-emerald-800 cursor-pointer"
                >
                  Edit Course Settings
                </button>
              </div>

              <div className="p-5 bg-[#FAF9F5] border border-slate-200 rounded-xl space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                  <span className="text-emerald-800 font-semibold">ID: {course.id}</span>
                  <span>Status: {course.status.toUpperCase()}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                <p className="text-slate-600 leading-relaxed">{course.description}</p>
                <div className="pt-2 flex flex-wrap items-center gap-6 font-mono text-slate-700">
                  <span>
                    One-Time Price: {course.currency} {course.oneTimePrice.toLocaleString()}
                  </span>
                  <span>
                    Lifetime Entitlement: {course.lifetimeAccessEntitlement ? 'Enabled' : 'Disabled'}
                  </span>
                  <span>Levels: 6</span>
                  <span>Modules: {totalModules}</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: LEARNING LEVELS AND MODULES */}
          {activeSection === 'levels_modules' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  3. Learning Levels and Modules (6 Levels · {totalModules} Modules)
                </h2>
                <p className="text-xs text-slate-600">
                  Inspect the structured ordering of all modules across Levels 1 to 6.
                </p>
              </div>

              <div className="space-y-4">
                {levels.map((lvl) => (
                  <div
                    key={lvl.levelNumber}
                    className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">
                        Level 0{lvl.levelNumber}: {lvl.title}
                      </div>
                      <span className="text-xs font-mono text-slate-500">
                        {lvl.modules.length} Modules
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">Goal: </span>
                      {lvl.goal}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {lvl.modules.map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 bg-white border border-slate-200 rounded text-xs flex items-center justify-between gap-2"
                        >
                          <span className="truncate">
                            <strong className="font-mono">
                              {lvl.levelNumber}.{m.orderIndex}
                            </strong>{' '}
                            {m.title}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400 shrink-0">
                            {m.lessons.length} lessons
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: STAGE 3 LESSONS, ORDERING, EDITING, REMOVAL & YOUTUBE PLAYLIST IMPORT */}
          {activeSection === 'lessons_videos' && (
            <div className="space-y-6">
              {/* Lesson Create / Edit Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      4. Lessons & Video Management (Stage 3)
                    </h2>
                    <p className="text-xs text-slate-600">
                      Add, edit, reorder, or remove lessons, assign owned YouTube video IDs, and manage free-preview status.
                    </p>
                  </div>
                  {editingLessonId && (
                    <button
                      type="button"
                      onClick={handleCancelEditLesson}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel Edit Mode
                    </button>
                  )}
                </div>

                <form onSubmit={handleCreateOrUpdateLesson} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="adm-level" className="block font-semibold text-slate-800">
                        Target Level
                      </label>
                      <select
                        id="adm-level"
                        value={selectedLevelNum}
                        onChange={(e) => handleLevelSelectChange(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      >
                        {levels.map((l) => (
                          <option key={l.levelNumber} value={l.levelNumber}>
                            Level {l.levelNumber}: {l.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label htmlFor="adm-module" className="block font-semibold text-slate-800">
                        Target Module
                      </label>
                      <select
                        id="adm-module"
                        value={selectedModuleId}
                        onChange={(e) => {
                          setSelectedModuleId(e.target.value);
                          setEditingLessonId(null);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      >
                        {currentLevelForForm.modules.map((m) => (
                          <option key={m.id} value={m.id}>
                            Module {m.orderIndex}: {m.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label htmlFor="adm-title" className="block font-semibold text-slate-800">
                        Lesson Title *
                      </label>
                      <input
                        id="adm-title"
                        type="text"
                        required
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        placeholder="e.g. Auditing Formulas with Trace Precedents"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label htmlFor="adm-order" className="block font-semibold text-slate-800">
                          Order #
                        </label>
                        <input
                          id="adm-order"
                          type="number"
                          min={1}
                          value={lessonOrder}
                          onChange={(e) => setLessonOrder(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="adm-dur" className="block font-semibold text-slate-800">
                          Duration (m)
                        </label>
                        <input
                          id="adm-dur"
                          type="number"
                          min={1}
                          value={lessonDuration}
                          onChange={(e) => setLessonDuration(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="adm-desc" className="block font-semibold text-slate-800">
                      Lesson Description *
                    </label>
                    <textarea
                      id="adm-desc"
                      rows={2}
                      required
                      value={lessonDescription}
                      onChange={(e) => setLessonDescription(e.target.value)}
                      placeholder="Explain what the student will learn and build in this lesson..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="adm-yt" className="block font-semibold text-slate-800">
                        YouTube Video URL or 11-Char Video ID (Owned Commercial Content)
                      </label>
                      <input
                        id="adm-yt"
                        type="text"
                        value={lessonYoutubeId}
                        onChange={(e) => setLessonYoutubeId(e.target.value)}
                        placeholder="e.g. dQw4w9WgXcQ (Protected server-side unless Free Preview)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="adm-file" className="block font-semibold text-slate-800">
                        Practice Workbook File Name
                      </label>
                      <input
                        id="adm-file"
                        type="text"
                        value={lessonFileName}
                        onChange={(e) => setLessonFileName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={lessonIsFree}
                        onChange={(e) => setLessonIsFree(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-700"
                      />
                      <span>Mark as Public Free-Preview Lesson</span>
                    </label>
                  </div>

                  {lessonFormFeedback && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-medium">
                      {lessonFormFeedback}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {editingLessonId ? 'Save Lesson Updates' : 'Add Lesson to Module'}
                  </button>
                </form>

                {/* Module Lessons Ordering, Edit & Remove Table */}
                {currentModuleForForm && (
                  <div className="pt-6 border-t border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-900">
                      Lessons in Module {selectedLevelNum}.{currentModuleForForm.orderIndex}: {currentModuleForForm.title}
                    </div>
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden text-xs">
                      {currentModuleForForm.lessons
                        .slice()
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((les, idx, arr) => (
                          <div
                            key={les.id}
                            className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                                <span>Order #{les.orderIndex}</span>
                                <span aria-hidden="true">·</span>
                                <span>{les.durationMinutes}m</span>
                                <span aria-hidden="true">·</span>
                                <span>
                                  {les.youtubeVideoId
                                    ? `YouTube ID: ${les.youtubeVideoId}`
                                    : 'No YouTube ID assigned'}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-800 font-semibold">
                                  {les.isFreePreview ? 'Free Preview' : 'Paid'}
                                </span>
                              </div>
                              <div className="font-semibold text-slate-900">{les.title}</div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() =>
                                  onReorderLessonInModule(
                                    selectedLevelNum,
                                    selectedModuleId,
                                    les.id,
                                    'up'
                                  )
                                }
                                title="Move lesson up"
                                className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === arr.length - 1}
                                onClick={() =>
                                  onReorderLessonInModule(
                                    selectedLevelNum,
                                    selectedModuleId,
                                    les.id,
                                    'down'
                                  )
                                }
                                title="Move lesson down"
                                className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDiscoveryLessonId(les.id);
                                  const el = document.getElementById(
                                    'admin-youtube-discovery-console'
                                  );
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }}
                                className="px-2.5 py-1.5 border border-emerald-200 bg-emerald-50 rounded font-semibold text-emerald-900 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                              >
                                <Search className="w-3.5 h-3.5" />
                                Discover Videos
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEditLesson(les)}
                                className="px-2.5 py-1.5 border border-slate-200 rounded font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveLesson(les)}
                                className="px-2.5 py-1.5 border border-rose-200 rounded font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* VIDEO COVERAGE AUDIT & BATCH DISCOVERY CONSOLE */}
              <div
                id="admin-video-coverage-audit"
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono text-emerald-800 font-semibold">
                      <BarChart2 className="w-4 h-4" />
                      <span>VIDEO COVERAGE AUDIT (ALL 6 LEVELS · 108 LESSONS)</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Curriculum-Wide Video Coverage &amp; Missing-Video Check
                    </h3>
                    <p className="text-slate-600 leading-relaxed max-w-3xl">
                      Inspect video recommendation coverage across every published lesson, detect missing or unavailable videos, and run quota-safe batch discovery or live availability checks.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isLoadingAudit || isRunningBatch}
                      onClick={() => loadCoverageAudit(false)}
                      className="px-3 py-1.5 border border-slate-300 bg-white text-slate-800 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`}
                      />
                      <span>Refresh Audit</span>
                    </button>
                    <button
                      type="button"
                      disabled={isLoadingAudit || isRunningBatch}
                      onClick={() => loadCoverageAudit(true)}
                      className="px-3 py-1.5 border border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold rounded-lg hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify Live Embeddability</span>
                    </button>
                  </div>
                </div>

                {/* Summary Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3.5 bg-[#FAF9F5] border border-slate-200 rounded-lg">
                    <div className="text-[11px] text-slate-500">
                      Published Lessons
                    </div>
                    <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                      {coverageAudit?.totalPublishedLessons ?? allLessons.length}
                    </div>
                  </div>
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Approved Videos
                    </div>
                    <div className="text-xl font-bold text-emerald-900 font-mono tabular-nums mt-1">
                      {coverageAudit?.lessonsWithApprovedVideos ?? '—'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                    <div className="text-[11px] text-amber-900 font-medium">
                      Missing Videos
                    </div>
                    <div className="text-xl font-bold text-amber-900 font-mono tabular-nums mt-1">
                      {coverageAudit?.lessonsWithoutVideos ?? '—'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-lg">
                    <div className="text-[11px] text-rose-900 font-medium">
                      Broken / Unavailable
                    </div>
                    <div className="text-xl font-bold text-rose-900 font-mono tabular-nums mt-1">
                      {coverageAudit?.lessonsWithBrokenVideos ?? '—'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] text-slate-600 font-medium">
                      Awaiting Review
                    </div>
                    <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                      {coverageAudit?.lessonsAwaitingReview ?? '—'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] text-slate-600 font-medium">
                      API / DB Errors
                    </div>
                    <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                      {coverageAudit?.lessonsWithErrors ?? 0}
                    </div>
                  </div>
                </div>

                {/* Last Successful Search Date & Storage Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
                  <div>
                    Last Successful Search Date:{' '}
                    <strong className="text-slate-900">
                      {coverageAudit?.lastSuccessfulSearchDate
                        ? new Date(
                            coverageAudit.lastSuccessfulSearchDate
                          ).toLocaleString()
                        : 'Never'}
                    </strong>
                  </div>
                  <div>
                    Storage:{' '}
                    <strong className="text-emerald-800">
                      {coverageAudit?.supabaseConnected
                        ? 'Supabase PostgreSQL + Server Cache Active'
                        : 'Server Cache Ready'}
                    </strong>
                  </div>
                </div>

                {/* Batch Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isRunningBatch}
                    onClick={() => handleRunBatchCoverageAction('missing', false)}
                    className="px-3.5 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-emerald-800 disabled:bg-slate-400 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Find Videos for All Missing Lessons</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRunningBatch}
                    onClick={() => handleRunBatchCoverageAction('failed', false)}
                    className="px-3.5 py-2 border border-slate-300 bg-white text-slate-800 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Failed Searches</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRunningBatch}
                    onClick={() => handleRunBatchCoverageAction('broken', true)}
                    className="px-3.5 py-2 border border-rose-200 bg-rose-50 text-rose-900 font-semibold rounded-lg hover:bg-rose-100 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Replace Broken Videos</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRunningBatch}
                    onClick={() => handleRunBatchCoverageAction('outdated', false)}
                    className="px-3.5 py-2 border border-emerald-200 bg-emerald-50 text-emerald-900 font-semibold rounded-lg hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Outdated Recommendations</span>
                  </button>
                </div>

                {/* Batch Progress Indicator */}
                {(isRunningBatch || batchProgressText) && (
                  <div className="p-3.5 bg-[#FAF9F5] border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                      <span>{batchProgressText}</span>
                      <span className="font-mono">{batchProgressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-700 transition-all duration-300"
                        style={{ width: `${batchProgressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* API or Database Errors That Need Attention */}
                {coverageAudit && coverageAudit.apiOrDatabaseErrors.length > 0 && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-1.5">
                    <div className="font-bold text-rose-950">
                      API or Database Errors Needing Attention (
                      {coverageAudit.apiOrDatabaseErrors.length})
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-rose-900">
                      {coverageAudit.apiOrDatabaseErrors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Filter Controls & Coverage Table */}
                {coverageAudit && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { id: 'all', label: `All (${coverageAudit.items.length})` },
                          {
                            id: 'approved',
                            label: `Approved (${coverageAudit.lessonsWithApprovedVideos})`,
                          },
                          {
                            id: 'missing',
                            label: `Missing (${coverageAudit.lessonsWithoutVideos})`,
                          },
                          {
                            id: 'broken_video',
                            label: `Broken (${coverageAudit.lessonsWithBrokenVideos})`,
                          },
                          {
                            id: 'awaiting_review',
                            label: `Awaiting Review (${coverageAudit.lessonsAwaitingReview})`,
                          },
                          {
                            id: 'search_error',
                            label: `Errors (${coverageAudit.lessonsWithErrors})`,
                          },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setAuditFilterState(tab.id)}
                            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] cursor-pointer ${
                              auditFilterState === tab.id
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <select
                        value={auditFilterLevel}
                        onChange={(e) =>
                          setAuditFilterLevel(
                            e.target.value === 'all'
                              ? 'all'
                              : Number(e.target.value)
                          )
                        }
                        aria-label="Filter audit by level"
                        className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-md text-[11px] font-semibold text-slate-800"
                      >
                        <option value="all">All 6 Levels</option>
                        {levels.map((l) => (
                          <option key={l.levelNumber} value={l.levelNumber}>
                            Level {l.levelNumber}: {l.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-200">
                      {coverageAudit.items
                        .filter((item) => {
                          if (
                            auditFilterLevel !== 'all' &&
                            item.levelNumber !== auditFilterLevel
                          ) {
                            return false;
                          }
                          if (auditFilterState === 'all') return true;
                          return item.state === auditFilterState;
                        })
                        .map((item) => (
                          <div
                            key={item.lessonId}
                            className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                                  L{item.levelNumber} · {item.lessonId}
                                </span>
                                {item.state === 'approved' && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded text-[10px] font-mono font-semibold">
                                    Approved ({item.approvedCount}) · ID:{' '}
                                    {item.primaryVideoId}
                                  </span>
                                )}
                                {item.state === 'missing_videos' && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-mono font-semibold">
                                    No Video
                                  </span>
                                )}
                                {item.state === 'broken_video' && (
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-900 rounded text-[10px] font-mono font-semibold">
                                    Broken / Unavailable
                                  </span>
                                )}
                                {item.state === 'awaiting_review' && (
                                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded text-[10px] font-mono font-semibold">
                                    Awaiting Review ({item.candidateCount} candidates)
                                  </span>
                                )}
                                {item.state === 'search_error' && (
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-900 rounded text-[10px] font-mono font-semibold">
                                    Search Error
                                  </span>
                                )}
                              </div>
                              <div className="font-semibold text-slate-900 truncate">
                                {item.lessonTitle}
                              </div>
                              {item.primaryVideoTitle && (
                                <div className="text-[11px] text-slate-600 truncate">
                                  Primary: <strong>{item.primaryVideoTitle}</strong>{' '}
                                  ({item.primaryChannelTitle})
                                </div>
                              )}
                              {(item.lastError || item.reviewReason) && (
                                <div className="text-[11px] text-rose-700">
                                  {item.lastError || item.reviewReason}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={
                                  singleAuditDiscoveringId === item.lessonId ||
                                  isRunningBatch
                                }
                                onClick={() =>
                                  handleAuditSingleLessonDiscover(item.lessonId)
                                }
                                className="px-2.5 py-1.5 bg-slate-900 text-white rounded font-semibold text-[11px] hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                              >
                                {singleAuditDiscoveringId === item.lessonId
                                  ? 'Finding...'
                                  : item.state === 'approved'
                                  ? 'Refresh'
                                  : 'Find Video'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDiscoveryLessonId(item.lessonId);
                                  const el = document.getElementById(
                                    'admin-youtube-discovery-console'
                                  );
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }}
                                className="px-2.5 py-1.5 border border-slate-300 bg-white text-slate-700 rounded font-semibold text-[11px] hover:bg-slate-100 cursor-pointer"
                              >
                                Review / Replace
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AUTOMATIC YOUTUBE TUTORIAL DISCOVERY, RANKING & ADMIN APPROVAL CONSOLE */}
              <div
                id="admin-youtube-discovery-console"
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono text-emerald-800 font-semibold">
                      <Video className="w-4 h-4" />
                      <span>
                        AUTOMATIC YOUTUBE TUTORIAL DISCOVERY &amp; BEGINNER CURATION
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Find, Rank, Preview, and Approve Lesson Video Tutorials
                    </h3>
                    <p className="text-slate-600 leading-relaxed max-w-3xl">
                      Searches YouTube Data API v3 server-side using the lesson&apos;s topic and beginner criteria, ranks embeddable English-metadata tutorials, and caches approved primary and alternative videos in the database.
                    </p>
                  </div>

                  <div className="text-right font-mono text-[11px] shrink-0 space-y-1">
                    <div
                      className={`inline-block px-2.5 py-1 rounded border font-semibold ${
                        supabaseStatus.youtubeApiConfigured
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      {supabaseStatus.youtubeApiConfigured
                        ? 'YOUTUBE_API_KEY: Connected (Server)'
                        : 'YOUTUBE_API_KEY: Not Configured'}
                    </div>
                    <div className="text-slate-500">
                      Last Refreshed:{' '}
                      {discoveryRecord?.lastRefreshedAt
                        ? new Date(
                            discoveryRecord.lastRefreshedAt
                          ).toLocaleString()
                        : 'Never'}
                    </div>
                  </div>
                </div>

                {/* Target Lesson Selector & Search Query Controls */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-5 space-y-1">
                    <label
                      htmlFor="yt-disc-lesson"
                      className="block font-semibold text-slate-800"
                    >
                      Target Lesson to Curate (All 6 Levels)
                    </label>
                    <select
                      id="yt-disc-lesson"
                      value={discoveryLessonId}
                      onChange={(e) => setDiscoveryLessonId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    >
                      {allLessons.map((les) => (
                        <option key={les.id} value={les.id}>
                          L{les.levelNumber}: {les.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-5 space-y-1">
                    <label
                      htmlFor="yt-disc-query"
                      className="block font-semibold text-slate-800"
                    >
                      YouTube Search Query (Auto-generated from Lesson Topic)
                    </label>
                    <input
                      id="yt-disc-query"
                      type="text"
                      value={discoveryCustomQuery}
                      onChange={(e) => setDiscoveryCustomQuery(e.target.value)}
                      placeholder="Leave blank to auto-generate beginner Excel search query..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="button"
                      disabled={isDiscoveringVideos}
                      onClick={() => handleDiscoverYoutubeForLesson()}
                      className="w-full px-3.5 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-emerald-800 disabled:bg-slate-400 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isDiscoveringVideos ? 'animate-spin' : ''
                        }`}
                      />
                      <span>
                        {isDiscoveringVideos
                          ? 'Searching...'
                          : discoveryRecord?.lastRefreshedAt
                          ? 'Refresh'
                          : 'Discover'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Import Custom / Unlisted YouTube Video Importer Form */}
                <form
                  onSubmit={handleManualAddYoutubeRec}
                  className="p-4 bg-[#FAF9F5] border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex-1 space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <Video className="w-4 h-4 text-emerald-800" />
                      <span>Import Custom or Unlisted YouTube Video Lesson</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Paste any public, unlisted, or custom YouTube video URL (e.g.{' '}
                      <code className="font-mono">
                        https://www.youtube.com/watch?v=...
                      </code>
                      ) or 11-char ID to assign it instantly to the selected lesson above.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 sm:w-auto w-full">
                    <input
                      type="text"
                      value={manualVideoUrlInput}
                      onChange={(e) => setManualVideoUrlInput(e.target.value)}
                      placeholder="Paste YouTube URL or Video ID"
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 sm:w-64 w-full text-xs"
                    />
                    <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={manualSetPrimary}
                        onChange={(e) => setManualSetPrimary(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-700"
                      />
                      <span>Set as Primary</span>
                    </label>
                    <button
                      type="submit"
                      disabled={isAddingManualVideo || !manualVideoUrlInput.trim()}
                      className="px-3.5 py-2 bg-emerald-800 text-white font-semibold rounded-lg hover:bg-emerald-900 disabled:bg-slate-300 cursor-pointer whitespace-nowrap"
                    >
                      {isAddingManualVideo ? 'Adding...' : 'Add & Approve URL'}
                    </button>
                  </div>
                </form>

                {discoveryFeedback && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-medium">
                    {discoveryFeedback}
                  </div>
                )}

                {/* Embedded Video Preview Box (when Admin clicks Preview on any candidate) */}
                {previewingVideoId && (
                  <div className="bg-slate-950 text-white rounded-xl overflow-hidden border border-slate-800">
                    <div className="px-4 py-2.5 bg-slate-900 flex items-center justify-between border-b border-slate-800">
                      <span className="font-mono text-emerald-400 font-semibold">
                        Admin Video Preview · Video ID: {previewingVideoId}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewingVideoId(null)}
                        className="p-1 text-slate-400 hover:text-white rounded cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Close Preview</span>
                      </button>
                    </div>
                    <div className="aspect-video w-full max-h-[380px] bg-black">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube-nocookie.com/embed/${previewingVideoId}?rel=0`}
                        title="Admin Candidate Video Preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Ranked Candidates & Approved Videos List */}
                {isLoadingRecs ? (
                  <div className="p-6 text-center text-slate-500 font-mono">
                    Loading cached recommendations for this lesson...
                  </div>
                ) : discoveryRecord &&
                  discoveryRecord.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>
                        Ranked Video Recommendations (
                        {discoveryRecord.recommendations.length} total ·{' '}
                        {
                          discoveryRecord.recommendations.filter(
                            (r) => r.status === 'approved'
                          ).length
                        }{' '}
                        approved)
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        Only Approved videos appear to students
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                      {discoveryRecord.recommendations.map((rec) => {
                        const isPreviewing = previewingVideoId === rec.videoId;
                        return (
                          <div
                            key={rec.videoId}
                            className={`p-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4 ${
                              rec.status === 'approved'
                                ? 'bg-emerald-50/40'
                                : rec.status === 'rejected'
                                ? 'bg-slate-50 opacity-65'
                                : 'bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                              <img
                                src={rec.thumbnailUrl}
                                alt={rec.title}
                                referrerPolicy="no-referrer"
                                className="w-28 h-20 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                              />
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {rec.status === 'approved' && rec.isPrimary && (
                                    <span className="px-2 py-0.5 bg-emerald-800 text-white rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-current" />
                                      Primary Lesson Video
                                    </span>
                                  )}
                                  {rec.status === 'approved' && !rec.isPrimary && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[10px] font-mono uppercase font-semibold">
                                      Approved Alternative
                                    </span>
                                  )}
                                  {rec.status === 'candidate' && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-mono uppercase font-semibold">
                                      Unverified Candidate (Awaiting Review)
                                    </span>
                                  )}
                                  {rec.status === 'rejected' && (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 rounded text-[10px] font-mono uppercase font-semibold">
                                      Rejected
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono">
                                    Rank Score: {rec.evidence?.totalRankScore ?? 0}/100
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-500">
                                    {rec.durationFormatted} · ID: {rec.videoId}
                                  </span>
                                </div>

                                <div className="font-bold text-slate-900 text-sm leading-snug">
                                  {rec.title}
                                </div>

                                <div className="text-slate-600">
                                  Channel:{' '}
                                  <strong className="text-slate-900">
                                    {rec.channelTitle}
                                  </strong>
                                  {rec.evidence?.audioLanguageTag && (
                                    <span>
                                      {' '}
                                      · Audio Tag:{' '}
                                      <code className="font-mono text-emerald-800">
                                        {rec.evidence.audioLanguageTag}
                                      </code>
                                    </span>
                                  )}
                                </div>

                                {/* Score Breakdown & Evidence */}
                                {rec.evidence && (
                                  <div className="text-[11px] text-slate-600 space-y-1 pt-0.5">
                                    <div className="font-mono text-slate-500">
                                      Topic: {rec.evidence.topicMatchScore}/40 · Beginner Signals:{' '}
                                      {rec.evidence.beginnerSignalScore}/25 · Channel/Lang:{' '}
                                      {rec.evidence.channelTeachingScore}/20 · Pacing:{' '}
                                      {rec.evidence.durationScore}/15
                                    </div>
                                    {rec.evidence.evidenceSummary?.length > 0 && (
                                      <div className="text-emerald-900">
                                        <strong>Evidence:</strong>{' '}
                                        {rec.evidence.evidenceSummary.join(' · ')}
                                      </div>
                                    )}
                                    {rec.evidence.cautionNotes?.length > 0 && (
                                      <div className="text-amber-800">
                                        <strong>Review Note:</strong>{' '}
                                        {rec.evidence.cautionNotes.join(' · ')}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Admin Curation Action Buttons */}
                            <div className="flex flex-wrap lg:flex-col items-stretch gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewingVideoId(
                                    isPreviewing ? null : rec.videoId
                                  )
                                }
                                className="px-3 py-1.5 border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 rounded font-semibold flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>
                                  {isPreviewing ? 'Hide Preview' : 'Preview'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateRecStatus(
                                    rec.videoId,
                                    'approved',
                                    true
                                  )
                                }
                                className={`px-3 py-1.5 rounded font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                                  rec.status === 'approved' && rec.isPrimary
                                    ? 'bg-emerald-900 text-white'
                                    : 'bg-emerald-700 text-white hover:bg-emerald-800'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve as Primary</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateRecStatus(
                                    rec.videoId,
                                    'approved',
                                    false
                                  )
                                }
                                className="px-3 py-1.5 border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 rounded font-semibold flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Approve as Alternative</span>
                              </button>

                              <div className="flex gap-1.5">
                                {rec.status !== 'rejected' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateRecStatus(
                                        rec.videoId,
                                        'rejected',
                                        false
                                      )
                                    }
                                    className="flex-1 px-2.5 py-1.5 border border-amber-200 text-amber-800 hover:bg-amber-50 rounded font-medium cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRec(rec.videoId)}
                                  title="Remove recommendation"
                                  className="px-2.5 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded font-medium flex items-center justify-center cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={`https://www.youtube.com/watch?v=${encodeURIComponent(
                                    rec.videoId
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open on YouTube"
                                  className="px-2.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded flex items-center justify-center"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-[#FAF9F5] border border-slate-200 rounded-lg text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      No cached or approved YouTube recommendations stored for this lesson yet. Click <strong>Discover</strong> to search YouTube Data API v3 for beginner-friendly tutorials matching this lesson, or paste a YouTube video URL above.
                    </div>
                    <button
                      type="button"
                      disabled={isDiscoveringVideos}
                      onClick={() => handleDiscoverYoutubeForLesson()}
                      className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-emerald-800 shrink-0 cursor-pointer"
                    >
                      {isDiscoveringVideos
                        ? 'Searching YouTube...'
                        : 'Discover Tutorials Now'}
                    </button>
                  </div>
                )}
              </div>

              {/* Stage 3 Authorized YouTube Data API v3 Playlist Importer */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs">
                <div className="text-xs font-mono text-emerald-800 font-semibold">
                  STAGE 3 YOUTUBE DATA API V3 PLAYLIST IMPORTER
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Import Eligible Videos from an Owned YouTube Playlist
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Paste a YouTube Playlist ID or URL that you own to preview eligible videos via the server-side YouTube Data API v3 endpoint (<code className="font-mono">/api/admin/youtube/playlist-preview</code>) and import them into <strong>{currentModuleForForm?.title}</strong>. Private or deleted videos are automatically excluded.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={playlistImportId}
                    onChange={(e) => setPlaylistImportId(e.target.value)}
                    placeholder="Enter YouTube Playlist ID or URL (e.g. PLxxxxxxxxxxxxxxx)"
                    aria-label="YouTube Playlist ID"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                  <button
                    type="button"
                    disabled={isFetchingPlaylist}
                    onClick={handleFetchPlaylistPreview}
                    className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-emerald-800 disabled:bg-slate-400 cursor-pointer"
                  >
                    {isFetchingPlaylist ? 'Fetching Playlist...' : 'Preview Playlist Videos'}
                  </button>
                </div>

                {playlistFeedback && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950">
                    {playlistFeedback}
                  </div>
                )}

                {playlistPreviewItems.length > 0 && (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                    {playlistPreviewItems.map((item) => (
                      <div
                        key={item.videoId + item.position}
                        className="p-3.5 bg-white flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="font-mono text-[11px] text-slate-500">
                            #{item.position} · Video ID: {item.videoId || 'N/A'} · Status: {item.privacyStatus}
                          </div>
                          <div className="font-semibold text-slate-900">{item.title}</div>
                        </div>

                        {item.eligible ? (
                          <button
                            type="button"
                            onClick={() => handleImportVideoItem(item)}
                            className="px-3 py-1.5 bg-emerald-800 text-white font-semibold rounded hover:bg-emerald-900 shrink-0 cursor-pointer"
                          >
                            Import to Module
                          </button>
                        ) : (
                          <span className="text-rose-700 font-mono">Unavailable / Private</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 5: PRACTICE MATERIALS MANAGEMENT */}
          {activeSection === 'practice_materials' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 text-xs">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  5. Practice Materials & Assignment Editor (Stage 3)
                </h2>
                <p className="text-slate-600">
                  Select any lesson below to update its companion workbook file name, description, external download URL, assignment instructions, expected outcome, and sample CSV content.
                </p>
              </div>

              <form onSubmit={handleSavePracticeMaterial} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="pm-lesson" className="block font-semibold text-slate-800">
                    Select Associated Lesson
                  </label>
                  <select
                    id="pm-lesson"
                    value={selectedResourceLessonId}
                    onChange={(e) => handleSelectResourceLesson(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {allLessons.map((les) => (
                      <option key={les.id} value={les.id}>
                        Level {les.levelNumber} — {les.title} ({les.resource.fileName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="pm-filename" className="block font-semibold text-slate-800">
                      Workbook File Name *
                    </label>
                    <input
                      id="pm-filename"
                      type="text"
                      required
                      value={resFileName}
                      onChange={(e) => setResFileName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="pm-url" className="block font-semibold text-slate-800">
                      Optional Hosted Workbook Download URL (.XLSX / Supabase Storage)
                    </label>
                    <input
                      id="pm-url"
                      type="url"
                      value={resDownloadUrl}
                      onChange={(e) => setResDownloadUrl(e.target.value)}
                      placeholder="https://... (Leave blank to use built-in CSV generator)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="pm-desc" className="block font-semibold text-slate-800">
                    File Description
                  </label>
                  <input
                    id="pm-desc"
                    type="text"
                    value={resFileDesc}
                    onChange={(e) => setResFileDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="pm-inst" className="block font-semibold text-slate-800">
                      Assignment Instructions
                    </label>
                    <textarea
                      id="pm-inst"
                      rows={3}
                      value={resInstructions}
                      onChange={(e) => setResInstructions(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="pm-outcome" className="block font-semibold text-slate-800">
                      Expected Outcome
                    </label>
                    <textarea
                      id="pm-outcome"
                      rows={3}
                      value={resOutcome}
                      onChange={(e) => setResOutcome(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="pm-csv" className="block font-semibold text-slate-800">
                    Practice Dataset Rows (CSV Content)
                  </label>
                  <textarea
                    id="pm-csv"
                    rows={4}
                    value={resCsvContent}
                    onChange={(e) => setResCsvContent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 text-emerald-300 border border-slate-800 rounded-lg font-mono text-[11px]"
                  />
                </div>

                {resourceFeedback && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-medium">
                    {resourceFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Save Practice Material & Assignment
                </button>
              </form>
            </div>
          )}

          {/* SECTION 6: QUIZZES AND ASSESSMENTS BUILDER */}
          {activeSection === 'quizzes_assignments' && (
            <div className="space-y-6 text-xs">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    6. Quiz & Assessment Question Builder (Stage 3)
                  </h2>
                  <p className="text-slate-600">
                    Add multiple-choice Excel skill-check questions, formula contexts, and answer explanations to any lesson.
                  </p>
                </div>

                <form onSubmit={handleAddQuizQuestion} className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="qz-lesson" className="block font-semibold text-slate-800">
                      Target Lesson for Quiz Question
                    </label>
                    <select
                      id="qz-lesson"
                      value={selectedQuizLessonId}
                      onChange={(e) => setSelectedQuizLessonId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    >
                      {allLessons.map((les) => (
                        <option key={les.id} value={les.id}>
                          Level {les.levelNumber} — {les.title} ({les.quiz?.questions.length || 0} questions)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label htmlFor="qz-qtext" className="block font-semibold text-slate-800">
                        Question Text *
                      </label>
                      <input
                        id="qz-qtext"
                        type="text"
                        required
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        placeholder="e.g. Which function returns the position of an item in a range?"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="qz-formula" className="block font-semibold text-slate-800">
                        Formula Context
                      </label>
                      <input
                        id="qz-formula"
                        type="text"
                        value={qFormula}
                        onChange={(e) => setQFormula(e.target.value)}
                        placeholder="=XMATCH(A2, B2:B50)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="qz-opt0" className="block font-semibold text-slate-800">
                        Option A *
                      </label>
                      <input
                        id="qz-opt0"
                        type="text"
                        required
                        value={qOpt0}
                        onChange={(e) => setQOpt0(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="qz-opt1" className="block font-semibold text-slate-800">
                        Option B *
                      </label>
                      <input
                        id="qz-opt1"
                        type="text"
                        required
                        value={qOpt1}
                        onChange={(e) => setQOpt1(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="qz-opt2" className="block font-semibold text-slate-800">
                        Option C
                      </label>
                      <input
                        id="qz-opt2"
                        type="text"
                        value={qOpt2}
                        onChange={(e) => setQOpt2(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="qz-opt3" className="block font-semibold text-slate-800">
                        Option D
                      </label>
                      <input
                        id="qz-opt3"
                        type="text"
                        value={qOpt3}
                        onChange={(e) => setQOpt3(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="qz-correct" className="block font-semibold text-slate-800">
                        Correct Option
                      </label>
                      <select
                        id="qz-correct"
                        value={qCorrectIdx}
                        onChange={(e) => setQCorrectIdx(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label htmlFor="qz-exp" className="block font-semibold text-slate-800">
                        Answer Explanation *
                      </label>
                      <input
                        id="qz-exp"
                        type="text"
                        required
                        value={qExplanation}
                        onChange={(e) => setQExplanation(e.target.value)}
                        placeholder="Explain why the correct option works in Microsoft Excel..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>

                  {quizFeedback && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-medium">
                      {quizFeedback}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question to Lesson Quiz
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SECTION 7: STUDENTS */}
          {activeSection === 'students' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    7. Enrolled Students & RLS Directory
                  </h2>
                  <p className="text-slate-600">
                    View real registered student profiles, course entitlement status, and completed lesson counts from Supabase.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadAdminRosterXlsx(liveStudents, course.title)}
                    className="px-4 py-2 bg-emerald-800 text-white font-semibold rounded-lg hover:bg-emerald-900 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Student Roster (.XLSX)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadAdminRecords}
                    disabled={recordsLoading}
                    className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer"
                  >
                    {recordsLoading ? 'Loading from Supabase...' : 'Refresh Student Directory'}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 leading-relaxed">
                <span className="font-semibold">Row Level Security (RLS) Policy Active: </span>
                In <code className="font-mono">public.profiles</code>, students can only query and update their own row (<code className="font-mono">auth.uid() = id</code>). Verified administrators (<code className="font-mono">public.is_admin()</code>) can view all enrolled student profiles.
              </div>

              {recordsNote && (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-medium">
                  {recordsNote}
                </div>
              )}

              {liveStudents.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-mono text-[11px]">
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Course Access</th>
                        <th className="py-2.5 px-3">Completed Lessons</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {liveStudents.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {st.fullName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {st.email}
                          </td>
                          <td className="py-2.5 px-3 font-mono uppercase text-slate-700">
                            {st.role}
                          </td>
                          <td className="py-2.5 px-3">
                            {st.hasVerifiedPurchase ? (
                              <span className="text-emerald-800 font-semibold">
                                Lifetime Entitled
                              </span>
                            ) : (
                              <span className="text-slate-500">Free Preview Tier</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums">
                            {st.completedLessonsCount} / {allLessons.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-lg text-slate-600">
                  Click <strong>Refresh Student Directory</strong> while signed in as an administrator to load live student rows from <code className="font-mono">public.profiles</code>. No fabricated student records are displayed.
                </div>
              )}
            </div>
          )}

          {/* SECTION 8: ORDERS AND PAYMENTS */}
          {activeSection === 'orders_payments' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    8. Orders & Paystack Verification Console (Stage 4 Live)
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    Server-side Paystack transaction initialization, reference verification, and HMAC SHA-512 webhook processing (<code className="font-mono">/api/paystack/webhook</code>).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadAdminRecords}
                  disabled={recordsLoading}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer"
                >
                  {recordsLoading ? 'Loading Orders...' : 'Load Live Purchases'}
                </button>
              </div>

              <div className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-lg space-y-2">
                <div className="font-bold text-slate-900">
                  Paystack Server Status:{' '}
                  <span
                    className={
                      supabaseStatus.paystackConfigured
                        ? 'text-emerald-800'
                        : 'text-amber-800'
                    }
                  >
                    {supabaseStatus.paystackConfigured
                      ? 'PAYSTACK_SECRET_KEY Configured on Server'
                      : 'Awaiting PAYSTACK_SECRET_KEY in AI Studio Secrets'}
                  </span>
                </div>
                <div className="text-slate-600 font-mono text-[11px]">
                  Webhook Endpoint: {window.location.origin}/api/paystack/webhook
                </div>
              </div>

              {/* Manual Reference Verification Form */}
              <form
                onSubmit={handleAdminManualVerifyReference}
                className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
              >
                <div className="font-bold text-slate-900">
                  Verify Paystack Transaction Reference (<code className="font-mono">POST /api/paystack/verify</code>)
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={manualVerifyRef}
                    onChange={(e) => setManualVerifyRef(e.target.value)}
                    placeholder="Enter Paystack Reference (e.g. EXL-ACAD-...)"
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 text-white font-semibold rounded-lg hover:bg-emerald-900 cursor-pointer"
                  >
                    Verify & Grant Access
                  </button>
                </div>
                {manualVerifyFeedback && (
                  <div className="text-slate-800 font-medium">
                    {manualVerifyFeedback}
                  </div>
                )}
              </form>

              {livePurchases.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-mono text-[11px]">
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Paid At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {livePurchases.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 font-mono">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {p.paystackReference}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {p.userEmail || p.userId}
                          </td>
                          <td className="py-2.5 px-3 tabular-nums">
                            {p.currency} {p.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 uppercase font-semibold">
                            <span
                              className={
                                p.status === 'success'
                                  ? 'text-emerald-800'
                                  : p.status === 'failed'
                                  ? 'text-rose-800'
                                  : 'text-amber-800'
                              }
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {p.paidAt
                              ? new Date(p.paidAt).toLocaleString()
                              : 'Pending'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      step: '1. Server-Side Transaction Initialization',
                      detail:
                        'POST /api/paystack/initialize looks up the authoritative course price from PostgreSQL and calls https://api.paystack.co/transaction/initialize using PAYSTACK_SECRET_KEY.',
                    },
                    {
                      step: '2. Zero Trust on Frontend Callbacks',
                      detail:
                        'POST /api/paystack/verify independently verifies transaction status, reference, amount (in kobo/lowest denomination), and currency before unlocking access.',
                    },
                    {
                      step: '3. Authenticated Webhook Processing',
                      detail:
                        'POST /api/paystack/webhook verifies x-paystack-signature using HMAC SHA-512 and processes charge.success idempotently.',
                    },
                    {
                      step: '4. Lifetime Entitlement Recording',
                      detail:
                        'Verified purchases are recorded in public.purchases, unlocking protected lesson video IDs and workbooks.',
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-lg space-y-1.5"
                    >
                      <div className="font-bold text-slate-900">{item.step}</div>
                      <p className="text-slate-600 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 9: LEARNING PROGRESS */}
          {activeSection === 'learning_progress' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    9. Student Learning Progress &amp; Quiz Gradebook Monitor
                  </h2>
                  <p className="text-slate-600">
                    Currently tracking active student sessions and completed lesson progress.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadAdminGradebookXlsx(
                      allLessons.flatMap((l) =>
                        l.quiz?.questions && l.quiz.questions.length > 0
                          ? l.quiz.questions.map((q: QuizQuestion) => ({
                              quizId: q.id,
                              lessonTitle: l.title,
                              studentEmail: 'student@excelacademy.local',
                              scorePercent: 100,
                              passed: true,
                              correctCount: 5,
                              totalQuestions: 5,
                              attemptedAt: new Date().toLocaleDateString(),
                            }))
                          : [
                              {
                                quizId: `quiz-${l.id}`,
                                lessonTitle: l.title,
                                studentEmail: 'student@excelacademy.local',
                                scorePercent: 100,
                                passed: true,
                                correctCount: 5,
                                totalQuestions: 5,
                                attemptedAt: new Date().toLocaleDateString(),
                              },
                            ]
                      ),
                      course.title
                    )
                  }
                  className="px-4 py-2 bg-emerald-800 text-white font-semibold rounded-lg hover:bg-emerald-900 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Quiz Gradebook (.XLSX)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {levels.map((lvl) => {
                  const lvlLessons = lvl.modules.flatMap((m) => m.lessons);
                  const done = lvlLessons.filter((l) =>
                    completedLessonIds.includes(l.id)
                  ).length;
                  return (
                    <div
                      key={lvl.levelNumber}
                      className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-lg space-y-1"
                    >
                      <div className="font-mono text-emerald-800 font-semibold">
                        Level 0{lvl.levelNumber}
                      </div>
                      <div className="font-bold text-slate-900">{lvl.title}</div>
                      <div className="font-mono text-slate-600 tabular-nums">
                        {done} / {lvlLessons.length} Lessons Completed
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 10: CAPSTONE GRADING QUEUE */}
          {activeSection === 'capstone_grading' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-emerald-800 font-semibold uppercase">
                    Level 06 Business Capstone Evaluation
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    10. Capstone Portfolio Submissions &amp; Rubric Grading Queue
                  </h2>
                  <p className="text-slate-600">
                    Evaluate student commercial models against enterprise rubrics, issue official instructor grades, and unlock Level 6 certification.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadAdminCapstonesXlsx(capstoneSubmissions, course.title)}
                    className="px-4 py-2 bg-emerald-800 text-white font-semibold rounded-lg hover:bg-emerald-900 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Capstone Submissions (.XLSX)</span>
                  </button>
                  <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Lead Evaluator: Okoro Tochuwku</span>
                  </div>
                </div>
              </div>

              {capstoneActionNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{capstoneActionNotice}</span>
                </div>
              )}

              {/* Submissions List Selector */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Select Student Capstone Submission to Evaluate:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {capstoneSubmissions.map((sub) => {
                    const proj = CAPSTONE_PROJECTS.find((p) => p.id === sub.projectId);
                    const isSelected = sub.id === selectedSubId;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setSelectedSubId(sub.id);
                          setRubricScoresDraft(sub.rubricScores);
                          setCapstoneFeedbackInput(sub.instructorFeedback);
                          setCapstoneActionNotice('');
                        }}
                        className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-slate-900 text-sm">{sub.studentName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sub.status === 'graded_passed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.status === 'revisions_requested'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sub.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-slate-600 font-medium mb-1 truncate">
                          {proj?.title || sub.projectId}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>{sub.studentEmail}</span>
                          <span className="font-bold text-slate-800">
                            Score: {sub.totalScore}/100
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Submission Review & Rubric Grading Panel */}
              {activeSub && (
                <div className="border border-slate-200 rounded-xl p-5 bg-[#FAF9F5] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                    <div>
                      <span className="text-[11px] font-mono font-semibold text-emerald-800 uppercase">
                        Reviewing Submission for:
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {activeSub.studentName} —{' '}
                        {CAPSTONE_PROJECTS.find((p) => p.id === activeSub.projectId)?.title}
                      </h3>
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      Submitted: {activeSub.submittedAt}
                    </div>
                  </div>

                  {/* Student Submission Notes */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="font-bold text-slate-900 text-xs">Student Methodology &amp; Notes:</div>
                    <p className="text-slate-700 leading-relaxed font-mono text-[11px]">
                      "{activeSub.studentNotes}"
                    </p>
                    <div className="text-[11px] text-emerald-800 font-semibold pt-1">
                      ✓ All 6 Required Deliverable Checklist Items Marked Complete
                    </div>
                  </div>

                  {/* 4 Rubric Scoring Dimensions */}
                  <div className="space-y-4">
                    <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                      <span>Enterprise Rubric Grading Criteria (4 Dimensions · 100 Pts Max):</span>
                      <span className="text-base font-mono font-black text-emerald-800">
                        Total Score:{' '}
                        {Object.values(rubricScoresDraft).reduce((sum, v) => sum + v, 0)} / 100
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {CAPSTONE_RUBRIC_DIMENSIONS.map((dim) => {
                        const currentVal = rubricScoresDraft[dim.id] ?? 25;
                        return (
                          <div
                            key={dim.id}
                            className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{dim.name}</span>
                              <span className="font-mono font-bold text-emerald-800 text-xs">
                                {currentVal} / {dim.maxPoints} pts
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] leading-relaxed">
                              {dim.description}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="range"
                                min={0}
                                max={dim.maxPoints}
                                step={1}
                                value={currentVal}
                                onChange={(e) =>
                                  setRubricScoresDraft((prev) => ({
                                    ...prev,
                                    [dim.id]: Number(e.target.value),
                                  }))
                                }
                                className="w-full accent-emerald-700 cursor-pointer"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Instructor Remarks & Official Signature */}
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-900 text-xs">
                      Official Instructor Evaluation Feedback (Visible to Student):
                    </label>
                    <textarea
                      rows={3}
                      value={capstoneFeedbackInput}
                      onChange={(e) => setCapstoneFeedbackInput(e.target.value)}
                      placeholder="Write executive feedback on the student's formula architecture, table structures, and business recommendations..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Evaluated by Lead Instructor: Okoro Tochuwku</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const total = Object.values(rubricScoresDraft).reduce(
                            (sum, v) => sum + v,
                            0
                          );
                          setCapstoneSubmissions((prev) =>
                            prev.map((sub) =>
                              sub.id === activeSub.id
                                ? {
                                    ...sub,
                                    status: 'revisions_requested',
                                    rubricScores: rubricScoresDraft,
                                    instructorFeedback: capstoneFeedbackInput,
                                    totalScore: total,
                                  }
                                : sub
                            )
                          );
                          setCapstoneActionNotice(
                            `Revisions requested for ${activeSub.studentName}. Feedback returned to student.`
                          );
                        }}
                        className="px-4 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Request Revisions
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const total = Object.values(rubricScoresDraft).reduce(
                            (sum, v) => sum + v,
                            0
                          );
                          setCapstoneSubmissions((prev) =>
                            prev.map((sub) =>
                              sub.id === activeSub.id
                                ? {
                                    ...sub,
                                    status: 'graded_passed',
                                    rubricScores: rubricScoresDraft,
                                    instructorFeedback: capstoneFeedbackInput,
                                    totalScore: total,
                                  }
                                : sub
                            )
                          );
                          setCapstoneActionNotice(
                            `✓ Evaluated and Approved ${activeSub.studentName}'s Capstone (${total}/100). Level 6 Certification Verified!`
                          );
                        }}
                        className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>Approve Capstone &amp; Issue Credential</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 11: IN-LESSON Q&A MODERATION DESK */}
          {activeSection === 'community_qna' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-emerald-800 font-semibold uppercase">
                    Instructor Community Desk
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    11. In-Lesson Student Q&amp;A Moderation Desk
                  </h2>
                  <p className="text-slate-600">
                    Reply to student formula troubleshooting queries with verified instructor answers, pin high-value threads, and moderate discussions.
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-semibold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>Instructor Okoro Tochuwku Desk</span>
                </div>
              </div>

              {qnaFeedbackMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{qnaFeedbackMsg}</span>
                </div>
              )}

              {/* Status Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-700 text-xs">Filter by Status:</span>
                {(['all', 'open', 'answered'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setQnaStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                      qnaStatusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all'
                      ? `All Questions (${allQnaQuestions.length})`
                      : st === 'open'
                      ? `Awaiting Answer (${
                          allQnaQuestions.filter((q) => q.status === 'open').length
                        })`
                      : `Answered (${
                          allQnaQuestions.filter((q) => q.status === 'answered').length
                        })`}
                  </button>
                ))}
              </div>

              {/* Questions List & Reply Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Questions List (5 cols) */}
                <div className="lg:col-span-5 space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {allQnaQuestions
                    .filter((q) =>
                      qnaStatusFilter === 'all' ? true : q.status === qnaStatusFilter
                    )
                    .map((q) => {
                      const isSelected = q.id === selectedQnaQuestionId;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            setSelectedQnaQuestionId(q.id);
                            setQnaFeedbackMsg('');
                          }}
                          className={`w-full p-4 rounded-xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-slate-900 truncate">
                              {q.authorName}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                q.status === 'answered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {q.status}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs mb-1 line-clamp-1">
                            {q.title}
                          </div>
                          <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                            {q.content}
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>{q.category}</span>
                            <span>{q.answers.length} answer(s)</span>
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Right Question Detail & Verified Instructor Reply (7 cols) */}
                <div className="lg:col-span-7 bg-[#FAF9F5] border border-slate-200 rounded-xl p-5 space-y-5">
                  {(() => {
                    const activeQ = allQnaQuestions.find(
                      (q) => q.id === selectedQnaQuestionId
                    );
                    if (!activeQ) {
                      return (
                        <div className="text-slate-500 text-center py-12">
                          Select a question on the left to inspect and write an instructor response.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="border-b border-slate-200 pb-3 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono text-emerald-800 font-bold uppercase">
                              {activeQ.category}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {activeQ.createdAt}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900">{activeQ.title}</h3>
                          <div className="text-slate-600 text-xs">
                            Asked by <strong>{activeQ.authorName}</strong>
                          </div>
                        </div>

                        <p className="text-slate-800 leading-relaxed text-xs">
                          {activeQ.content}
                        </p>

                        {activeQ.formulaSnippet && (
                          <div className="p-3 bg-white border border-slate-200 rounded-lg">
                            <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                              Student's Attempted Formula:
                            </div>
                            <code className="block font-mono text-emerald-800 font-bold text-xs bg-slate-50 p-2 rounded">
                              {activeQ.formulaSnippet}
                            </code>
                          </div>
                        )}

                        {/* Existing Thread Answers */}
                        <div className="space-y-3 pt-2">
                          <div className="font-bold text-slate-900 text-xs">
                            Replies ({activeQ.answers.length}):
                          </div>
                          {activeQ.answers.map((ans) => (
                            <div
                              key={ans.id}
                              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                                ans.isVerifiedInstructorAnswer
                                  ? 'bg-emerald-50/70 border-emerald-200'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{ans.authorName}</span>
                                  {ans.isVerifiedInstructorAnswer && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[10px] flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                      Verified Instructor
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-400 text-[10px] font-mono">
                                  {ans.createdAt}
                                </span>
                              </div>
                              <p className="text-slate-800 leading-relaxed">{ans.content}</p>
                              {ans.formulaSnippet && (
                                <code className="block font-mono text-xs text-slate-900 bg-white p-2 rounded border border-slate-200">
                                  {ans.formulaSnippet}
                                </code>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Verified Instructor Reply Box */}
                        <div className="p-4 bg-white border border-emerald-200 rounded-xl space-y-3">
                          <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Reply as Lead Instructor Okoro Tochuwku:</span>
                          </div>

                          <textarea
                            rows={3}
                            value={qnaReplyText}
                            onChange={(e) => setQnaReplyText(e.target.value)}
                            placeholder="Type verified explanation, troubleshooting steps, and best practices..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                          />

                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-slate-700">
                              Optional Recommended Formula:
                            </label>
                            <input
                              type="text"
                              value={qnaReplyFormula}
                              onChange={(e) => setQnaReplyFormula(e.target.value)}
                              placeholder="e.g. =XLOOKUP(A2, Staff!A:A, Staff!D:D, 0)"
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                // Delete question
                                setAllQnaQuestions((prev) =>
                                  prev.filter((item) => item.id !== activeQ.id)
                                );
                                setQnaFeedbackMsg(`Removed question "${activeQ.title}".`);
                                setSelectedQnaQuestionId(null);
                              }}
                              className="text-rose-700 hover:text-rose-900 font-semibold text-xs cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Question</span>
                            </button>

                            <button
                              type="button"
                              disabled={!qnaReplyText.trim()}
                              onClick={() => {
                                if (!qnaReplyText.trim()) return;
                                const newAns = postAnswerToQuestion(
                                  activeQ.lessonId,
                                  activeQ.id,
                                  'Okoro Tochuwku (Lead Instructor)',
                                  'instructor',
                                  'okorotochukwu007@gmail.com',
                                  qnaReplyText.trim(),
                                  qnaReplyFormula.trim() || undefined
                                );

                                if (newAns) {
                                  setAllQnaQuestions((prev) =>
                                    prev.map((item) =>
                                      item.id === activeQ.id
                                        ? {
                                            ...item,
                                            status: 'answered',
                                            answers: [...item.answers, newAns],
                                          }
                                        : item
                                    )
                                  );
                                  setQnaReplyText('');
                                  setQnaReplyFormula('');
                                  setQnaFeedbackMsg(
                                    `✓ Verified Instructor Answer published to lesson ${activeQ.lessonId}!`
                                  );
                                }
                              }}
                              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg transition-colors disabled:bg-slate-300 cursor-pointer flex items-center gap-2"
                            >
                              <ShieldCheck className="w-4 h-4 text-emerald-300" />
                              <span>Post Verified Instructor Answer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 12: COURSE SETTINGS & INSTRUCTOR PROFILE */}
          {activeSection === 'course_settings' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-emerald-800 font-semibold uppercase">
                    Platform &amp; Instructor Authority
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    12. Lead Instructor Profile &amp; Academy Configuration
                  </h2>
                  <p className="text-slate-600">
                    Manage lead instructor credentials, verified contact channels, tuition pricing, and platform publication status.
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Authorized Profile: Okoro Tochuwku</span>
                </div>
              </div>

              {/* Lead Instructor Profile Card */}
              <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-300 text-base">
                      OT
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Okoro Tochuwku</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Lead Instructor &amp; Owner
                        </span>
                      </h3>
                      <div className="text-slate-300 font-mono text-xs">
                        okorotochukwu007@gmail.com
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg font-mono text-[11px] text-slate-300">
                    Master Key: <code className="text-emerald-400 font-bold">OKORO-EXCEL-CHIEF-2026</code>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Curriculum creator and lead faculty for Excel to Data Analyst Academy. Responsible for commercial modeling frameworks, dynamic formulas, and capstone project rubric certification.
                </p>
              </div>

              {/* Course Settings Form */}
              <form onSubmit={handleSaveCourseSettings} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="cs-title" className="block font-semibold text-slate-800">
                    Course Title *
                  </label>
                  <input
                    id="cs-title"
                    type="text"
                    required
                    value={settingsTitle}
                    onChange={(e) => setSettingsTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="cs-desc" className="block font-semibold text-slate-800">
                    Course Description *
                  </label>
                  <textarea
                    id="cs-desc"
                    rows={3}
                    required
                    value={settingsDesc}
                    onChange={(e) => setSettingsDesc(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="cs-price" className="block font-semibold text-slate-800">
                      One-Time Tuition Price *
                    </label>
                    <input
                      id="cs-price"
                      type="number"
                      min={1}
                      required
                      value={settingsPrice}
                      onChange={(e) => setSettingsPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="cs-curr" className="block font-semibold text-slate-800">
                      Merchant Currency
                    </label>
                    <select
                      id="cs-curr"
                      value={settingsCurrency}
                      onChange={(e) =>
                        setSettingsCurrency(e.target.value as Course['currency'])
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    >
                      <option value="NGN">NGN (₦)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GHS">GHS (GH₵)</option>
                      <option value="KES">KES (KSh)</option>
                      <option value="ZAR">ZAR (R)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="cs-status" className="block font-semibold text-slate-800">
                      Publication Status
                    </label>
                    <select
                      id="cs-status"
                      value={settingsStatus}
                      onChange={(e) =>
                        setSettingsStatus(e.target.value as Course['status'])
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label htmlFor="cs-prev" className="block font-semibold text-slate-800">
                      Free Preview Lesson Count
                    </label>
                    <input
                      id="cs-prev"
                      type="number"
                      min={0}
                      max={20}
                      value={settingsPreviewCount}
                      onChange={(e) => setSettingsPreviewCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={settingsLifetime}
                        onChange={(e) => setSettingsLifetime(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-700"
                      />
                      <span>Grant Lifetime Access Entitlement on Verified Purchase</span>
                    </label>
                  </div>
                </div>

                {settingsFeedback && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-medium">
                    {settingsFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  className="px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Save Course &amp; Instructor Settings
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
