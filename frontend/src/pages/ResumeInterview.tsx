import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FriendlyErrorCard from '../components/FriendlyErrorCard';
import api from '../services/api';
import { getFriendlyError } from '../services/errorHelper';
import type { FriendlyError } from '../services/errorHelper';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock,
  BookOpen, Code, Sparkles, AlertTriangle,
  ListTodo, ShieldCheck, HelpCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface QuestionDetails {
  question: string;
  difficulty: string;
  topic: string;
  reference: string;
  why_selected: string;
  estimated_time: number;
}

interface QuestionAudit {
  id: number;
  question: string;
  topic: string;
  difficulty: string;
  expected_answer: string;
  user_answer: string;
  score: number;
  mistakes: string[];
  suggestions: string[];
  better_answer: string;
}

interface LearningPlanDay {
  day: string;
  focus: string;
  tasks: string[];
  why_critical: string;
}

interface LearningPlanWeek {
  week: string;
  focus: string;
  milestones: string[];
  why_critical: string;
}

interface RecommendedTech {
  name: string;
  importance: string;
  recruiter_expectation: string;
  where_to_learn: string;
  estimated_learning_time: string;
}

interface RecommendedProject {
  title: string;
  description: string;
  skills_gained: string[];
  difficulty_level: string;
}

interface RecommendedCert {
  name: string;
  issuer: string;
  career_value: string;
}

interface LearningResource {
  title: string;
  url: string;
  type: string;
}

interface InterviewReport {
  overall_readiness: number;
  overall_score?: number;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  confidence_score: number;
  grammar_score: number;
  strong_topics: string[];
  weak_topics: string[];
  recruiter_summary: string;
  recruiter_verdict?: string;
  recommended_technologies?: string[];
  estimated_preparation_time?: string;
  question_audits: QuestionAudit[];
  roadmap: {
    seven_day_plan: LearningPlanDay[];
    thirty_day_plan: LearningPlanWeek[];
    recommended_technologies: RecommendedTech[];
    recommended_projects: RecommendedProject[];
    recommended_certifications: RecommendedCert[];
    learning_resources: LearningResource[];
  };
}

const ResumeInterview: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [friendlyError, setFriendlyError] = useState<FriendlyError | null>(null);
  const [friendlyRetry, setFriendlyRetry] = useState<(() => void) | null>(null);

  // Session states
  const [currentIdx, setCurrentIdx] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDetails | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [report, setReport] = useState<InterviewReport | null>(null);

  // Active test states
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [evaluating, setEvaluating] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef<any | null>(null);
  const saveTimeoutRef = useRef<any | null>(null);

  // Load Session details on start
  useEffect(() => {
    fetchSessionDetails();
    return () => {
      stopTimer();
      clearSaveTimeout();
    };
  }, [sessionId]);

  // Start timer once session loads
  useEffect(() => {
    if (!isCompleted && currentQuestion) {
      setTimeLeft(currentQuestion.estimated_time || 120);
      startTimer();
    } else {
      stopTimer();
    }
  }, [isCompleted, currentQuestion]);

  useEffect(() => {
    if (!isCompleted && currentQuestion && timeLeft === 0 && !evaluating) {
      handleNext(true);
    }
  }, [timeLeft, isCompleted, currentQuestion, evaluating]);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (totalSec: number) => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const fetchSessionDetails = async () => {
    setLoading(true);
    setFriendlyError(null);
    try {
      const res = await api.get(`/api/resume-interview/${sessionId}`);
      const data = res.data;
      setCurrentIdx(data.current_question_index);
      setTotalQuestions(data.total_questions);
      setIsCompleted(data.is_completed);
      setAnswers(data.answers || {});

      if (data.is_completed) {
        setReport(data.report);
      } else {
        setCurrentQuestion(data.current_question);
        setCurrentAnswer(data.answers[data.current_question_index.toString()] || '');
        setTimeLeft(data.current_question.estimated_time || 120);
      }
    } catch (err: any) {
      console.error(err);
      const friendly = getFriendlyError(err);
      setFriendlyError(friendly);
      setFriendlyRetry(() => fetchSessionDetails);
    } finally {
      setLoading(false);
    }
  };

  // Autosave Logic (Debounced)
  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCurrentAnswer(val);
    setSaveStatus('unsaved');

    clearSaveTimeout();
    saveTimeoutRef.current = setTimeout(() => {
      triggerAutosave(val);
    }, 2000);
  };

  const clearSaveTimeout = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  };

  const triggerAutosave = async (ansText: string) => {
    setSaveStatus('saving');
    try {
      await api.post(`/api/resume-interview/${sessionId}/answer`, {
        answer: ansText
      });
      setAnswers(prev => ({ ...prev, [currentIdx.toString()]: ansText }));
      setSaveStatus('saved');
    } catch (err) {
      console.error('Autosave failed:', err);
      setSaveStatus('unsaved');
    }
  };

  const handleNext = async (autoAdvance = false) => {
    if (evaluating) return;
    if (!autoAdvance && !currentAnswer.trim()) return;

    clearSaveTimeout();
    setEvaluating(true);
    setFriendlyError(null);
    try {
      const res = await api.post(`/api/resume-interview/${sessionId}/answer`, {
        answer: currentAnswer,
        question_index: currentIdx
      });
      const data = res.data;

      if (data.is_completed) {
        await handleSubmit();
      } else {
        setCurrentIdx(data.current_question_index);
        const nextQ = data.next_question;
        setCurrentQuestion(nextQ);
        const nextSaved = answers[(data.current_question_index).toString()] || '';
        setCurrentAnswer(nextSaved);
        setTimeLeft(nextQ.estimated_time || 120);
        setSaveStatus('saved');
      }
    } catch (err: any) {
      console.error(err);
      const friendly = getFriendlyError(err);
      setFriendlyError(friendly);
      setFriendlyRetry(() => () => handleNext(autoAdvance));
    } finally {
      setEvaluating(false);
    }
  };

  const handlePrev = () => {
    if (currentIdx === 0) return;
    clearSaveTimeout();
    triggerAutosave(currentAnswer);
    const prevIdx = currentIdx - 1;
    setCurrentIdx(prevIdx);
    fetchSessionDetails();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFriendlyError(null);
    stopTimer();
    try {
      const res = await api.post(`/api/resume-interview/${sessionId}/submit`);
      setReport(res.data);
      setIsCompleted(true);
    } catch (err: any) {
      console.error(err);
      const friendly = getFriendlyError(err);
      setFriendlyError(friendly);
      setFriendlyRetry(() => handleSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
        <Navbar />
        <div className="flex-1 max-w-4xl w-full mx-auto px-6 sm:px-8 py-[120px] space-y-8 animate-pulse text-left">
          <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
          <div className="p-8 bg-white border border-[#ECECEC] rounded-[20px] space-y-6 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
              <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="space-y-3">
              <div className="h-3 w-20 bg-slate-150 rounded-sm"></div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-250 w-1/3 rounded-full"></div>
              </div>
            </div>
            <div className="p-6 bg-slate-50/50 border border-slate-150 rounded-xl space-y-3">
              <div className="h-3 w-16 bg-slate-200 rounded-sm"></div>
              <div className="h-5 w-3/4 bg-slate-200 rounded-md"></div>
              <div className="h-3 w-1/2 bg-slate-150 rounded-sm"></div>
            </div>
            <div className="h-32 w-full bg-slate-50/30 border border-slate-150 rounded-xl"></div>
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
              <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center pt-4 space-y-3">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-650 rounded-full animate-spin"></div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">Preparing your interview session. Please hold on a moment.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    return <AIWaitingScreen />;
  }

  // Define framer-motion variants
  const revealVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-600">
      <Navbar />

      {friendlyError && (
        <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-8 mt-6">
          <FriendlyErrorCard
            error={friendlyError}
            onAction={() => {
              if (friendlyRetry) {
                friendlyRetry();
              }
              setFriendlyError(null);
            }}
          />
        </div>
      )}

      {/* 1. MOCK INTERVIEW SCREEN */}
      {!isCompleted && currentQuestion && (
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 sm:px-8 py-[120px] flex flex-col justify-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            className="bg-white rounded-[20px] border border-[#ECECEC] shadow-minimal p-8 md:p-12 relative overflow-hidden space-y-8 text-left w-full"
          >
            {evaluating && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 z-10 transition-all">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">Saving response & adapting path...</span>
              </div>
            )}

            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg uppercase tracking-wider block w-fit">
                  AI Resume-Based Interview
                </span>
                <span className="text-xs font-medium text-slate-450 block leading-relaxed max-w-md">
                  Think before you type—quality matters more than speed
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${saveStatus === 'saved' ? 'bg-green-50 text-green-700 border-green-100' :
                    saveStatus === 'saving' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
                      'bg-orange-50 text-orange-700 border-orange-100'
                  }`}>
                  {saveStatus === 'saved' ? 'Autosaved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes'}
                </span>

                <div className={`flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-lg border ${timeLeft <= 15 ? 'bg-red-50 border-red-100 text-red-700 animate-pulse' : 'bg-slate-50 border-slate-200/60 text-slate-500'
                  }`}>
                  <Clock size={13} />
                  <span className={timeLeft <= 15 ? 'text-red-600 font-bold' : ''}>
                    {timeLeft > 0 ? formatTime(timeLeft) : "Time's Up!"}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-455 tracking-wider">
                <span>PROGRESS</span>
                <span>QUESTION {currentIdx + 1} OF {totalQuestions}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-slate-50/50 rounded-xl border border-[#ECECEC] p-6 md:p-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-blue-50 text-blue-600 border border-blue-100">
                  {currentQuestion.topic}
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${currentQuestion.difficulty === 'easy' ? 'bg-green-50 text-green-700 border border-green-100' :
                    currentQuestion.difficulty === 'hard' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-orange-50 text-orange-700 border-orange-100'
                  }`}>
                  {currentQuestion.difficulty.toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-snug">
                {currentQuestion.question}
              </h2>
              <div className="text-[10px] text-slate-450 font-semibold flex items-start gap-1.5 pt-2 border-t border-slate-100">
                <HelpCircle size={14} className="shrink-0 mt-0.5 text-blue-600" />
                <span><strong>Selected because:</strong> {currentQuestion.why_selected}</span>
              </div>
            </div>

            {/* Input Answer */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label htmlFor="answer-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Answer
                </label>
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Estimated answer time: {currentQuestion?.estimated_time || 120} sec
                </span>
              </div>
              <textarea
                id="answer-input"
                rows={6}
                value={currentAnswer}
                onChange={handleAnswerChange}
                placeholder="Type your response here. Try to describe your architectural decisions, tools, and technical outcomes..."
                className="w-full px-5 py-4 rounded-[20px] border border-[#ECECEC] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none text-slate-800 text-xs leading-relaxed transition-all font-mono bg-slate-50/10 placeholder:text-slate-400/80 shadow-inner"
                disabled={evaluating}
              ></textarea>
            </div>

            {/* Footer Navigation */}
            <div className="flex flex-col gap-3 xl:flex-row items-start xl:items-center justify-between border-t border-slate-100 pt-6">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0 || evaluating}
                className="btn-glass flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-655 rounded-xl shadow-sm"
              >
                <ArrowLeft size={14} />
                Previous
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  <span>Remaining</span>
                  <span className="font-bold text-slate-800">{timeLeft > 0 ? formatTime(timeLeft) : '00:00'}</span>
                </div>
                {currentIdx + 1 < totalQuestions ? (
                  <button
                    onClick={() => handleNext(false)}
                    disabled={evaluating || !currentAnswer.trim()}
                    className="btn-primary flex items-center gap-2 px-6 py-2.5 text-xs font-bold"
                  >
                    {evaluating ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Adapting next...
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={evaluating || !currentAnswer.trim()}
                    className="btn-primary flex items-center gap-2 px-6 py-2.5 text-xs font-bold"
                  >
                    Submit Interview
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        </main>
      )}

      {/* 2. COMPLETED ASSESSMENT REPORT SCREEN */}
      {isCompleted && report && (
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 sm:px-8 py-[120px] space-y-12">

          <div className="flex justify-between items-center pb-4 border-b border-[#ECECEC]">
            <Link to="/resume" className="inline-flex items-center gap-2 text-small-label font-medium text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} />
              Back to Resume Intelligence
            </Link>
            <button
              onClick={() => window.print()}
              className="btn-glass px-5 py-2.5 text-xs font-bold text-slate-800 rounded-xl"
            >
              Print Report
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Score Gauges and Rings */}
            <div className="lg:col-span-4 space-y-8">

              {/* Overall readiness card */}
              <div className="bg-white p-8 rounded-[20px] border border-[#ECECEC] shadow-minimal text-center flex flex-col items-center">
                <span className="text-small-label font-bold text-slate-400 uppercase tracking-widest">Overall Score / Readiness</span>

                {/* Radial progress ring */}
                <div className="relative w-32 h-32 flex items-center justify-center mt-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="54" className="stroke-slate-100" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      className="stroke-blue-600"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - (report.overall_score ?? report.overall_readiness) / 100)}
                    />
                  </svg>
                  <span className="absolute inset-0 grid place-items-center text-metric-readiness leading-none font-bold text-slate-950">{report.overall_score ?? report.overall_readiness}%</span>
                </div>

                <span className="text-xs font-semibold text-slate-400 mt-6 leading-relaxed">
                  Your aggregated score across technical, behavioral, and adaptive prompts.
                </span>
              </div>

              {/* Recruiter Verdict card */}
              <div className="bg-white p-8 rounded-[20px] border border-[#ECECEC] shadow-minimal text-center flex flex-col items-center">
                <span className="text-small-label font-bold text-slate-400 uppercase tracking-widest">Final Recruiter Verdict</span>
                <span className={`text-[15px] font-bold mt-4 px-4 py-2 rounded-xl border block w-full ${report.recruiter_verdict === 'Suitable for Interview' ? 'bg-green-50 text-green-700 border-green-100' :
                    report.recruiter_verdict === 'Needs Improvement' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      'bg-red-50 text-red-700 border-red-100'
                  }`}>
                  {report.recruiter_verdict || 'Needs Improvement'}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 mt-4 leading-relaxed block">
                  Based on answer technical accuracy, problem solving approach, and role suitability.
                </span>
              </div>

              {/* Estimated Prep Time card */}
              {report.estimated_preparation_time && (
                <div className="bg-white p-8 rounded-[20px] border border-[#ECECEC] shadow-minimal text-center flex flex-col items-center">
                  <span className="text-small-label font-bold text-slate-400 uppercase tracking-widest">Estimated Prep Time</span>
                  <span className="text-xl font-bold mt-4 text-slate-800 block">
                    ⏳ {report.estimated_preparation_time}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 mt-3 leading-relaxed block">
                    Targeted study recommendation to cover all weaknesses and gaps.
                  </span>
                </div>
              )}

              {/* Answers Audit summary */}
              <div className="bg-white p-8 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6 text-left">
                <h3 className="text-card-title font-bold text-slate-900 border-b border-[#ECECEC] pb-4 uppercase tracking-wider">Answer Performance</h3>

                {/* Strong Answers */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Strong Answers ({report.question_audits.filter((q: any) => q.score >= 7).length})
                  </h4>
                  {report.question_audits.filter((q: any) => q.score >= 7).length > 0 ? (
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {report.question_audits.filter((q: any) => q.score >= 7).map((q: any, idx: number) => (
                        <div key={idx} className="text-xs font-semibold text-slate-655 flex items-start gap-2">
                          <span className="shrink-0 text-[10px] text-green-600 font-bold bg-green-50 border border-green-100 px-1.5 py-0.5 rounded">Q{q.id}</span>
                          <span className="truncate">{q.question}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-400 italic">No highly-scored answers.</p>
                  )}
                </div>

                {/* Weak Answers */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Weak Answers ({report.question_audits.filter((q: any) => q.score < 7).length})
                  </h4>
                  {report.question_audits.filter((q: any) => q.score < 7).length > 0 ? (
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {report.question_audits.filter((q: any) => q.score < 7).map((q: any, idx: number) => (
                        <div key={idx} className="text-xs font-semibold text-slate-655 flex items-start gap-2">
                          <span className="shrink-0 text-[10px] text-red-650 font-bold bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">Q{q.id}</span>
                          <span className="truncate">{q.question}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-400 italic">No weak responses flagged.</p>
                  )}
                </div>
              </div>

              {/* Recommended Technologies card */}
              {report.recommended_technologies && report.recommended_technologies.length > 0 && (
                <div className="bg-white p-8 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-3 text-left">
                  <h4 className="text-small-label font-bold text-slate-700 uppercase tracking-wider">Recommended Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.recommended_technologies.map((tech: string, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-650 border border-blue-100">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-scores metrics card */}
              <div className="bg-white p-8 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6 text-left">
                <h3 className="text-card-title font-bold text-slate-900 border-b border-[#ECECEC] pb-4 uppercase tracking-wider">Dimension Analysis</h3>

                {/* Score 1: Technical */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Technical Score</span>
                    <span>{report.technical_score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${report.technical_score}%` }}></div>
                  </div>
                </div>

                {/* Score 2: Communication */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Communication</span>
                    <span>{report.communication_score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-600 h-full rounded-full" style={{ width: `${report.communication_score}%` }}></div>
                  </div>
                </div>

                {/* Score 3: Problem Solving */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Problem Solving</span>
                    <span>{report.problem_solving_score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: `${report.problem_solving_score}%` }}></div>
                  </div>
                </div>

                {/* Score 4: Confidence */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Confidence Score</span>
                    <span>{report.confidence_score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-orange-655 h-full rounded-full" style={{ width: `${report.confidence_score}%` }}></div>
                  </div>
                </div>

                {/* Score 5: Grammar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Grammar correctness</span>
                    <span>{report.grammar_score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-650 h-full rounded-full" style={{ width: `${report.grammar_score}%` }}></div>
                  </div>
                </div>

              </div>

              {/* Strong / Weak Topic Tags */}
              <div className="bg-white p-8 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6 text-left">
                <div className="space-y-3">
                  <h4 className="text-small-label font-bold text-green-600 uppercase tracking-wider">Strengths Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.strong_topics.map((t, idx) => (
                      <span key={idx} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-50 text-green-700 border border-green-100">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-small-label font-bold text-red-655 uppercase tracking-wider">Gaps / Weak Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.weak_topics.map((t, idx) => (
                      <span key={idx} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-700 border border-red-100">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Right main panel: Recruiter Summary, Question Reviews, Roadmap */}
            <div className="lg:col-span-8 space-y-8 text-left">

              {/* Recruiter Summary */}
              <div className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-4">
                <h2 className="text-card-title font-bold text-slate-900 border-b border-[#ECECEC] pb-4 flex items-center gap-3">
                  <ShieldCheck className="text-blue-600" size={22} />
                  NexPrep AI Interview Report
                </h2>
                <p className="text-body-custom text-slate-650 leading-relaxed font-semibold">
                  {report.recruiter_summary}
                </p>
                <div className="pt-4 border-t border-slate-100 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Generated by NexPrep AI
                </div>
              </div>

              {/* Learning Roadmap section */}
              <div className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-8">
                <h2 className="text-card-title font-bold text-slate-900 border-b border-[#ECECEC] pb-4 flex items-center gap-3">
                  <ListTodo className="text-blue-600" size={22} />
                  Personalized 30-Day Learning Plan
                </h2>

                {/* 7-Day Plan */}
                <div className="space-y-4">
                  <h3 className="text-small-label font-bold text-slate-800 flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    7-Day Action Plan
                  </h3>
                  <div className="space-y-4">
                    {report.roadmap.seven_day_plan.map((item, idx) => (
                      <div key={idx} className="p-5 bg-slate-50/50 rounded-xl border border-[#ECECEC] text-xs space-y-2">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{item.day}: {item.focus}</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-slate-500 font-medium">
                          {item.tasks.map((task, tIdx) => <li key={tIdx}>{task}</li>)}
                        </ul>
                        <div className="text-[10px] text-slate-450 font-semibold italic pt-1 border-t border-slate-200/50">
                          <strong>Why critical:</strong> {item.why_critical}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 30-Day Plan */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h3 className="text-small-label font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen size={16} className="text-blue-600" />
                    30-Day Milestones
                  </h3>
                  <div className="space-y-4">
                    {report.roadmap.thirty_day_plan.map((item, idx) => (
                      <div key={idx} className="p-5 bg-slate-50/50 rounded-xl border border-[#ECECEC] text-xs space-y-2">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{item.week}: {item.focus}</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-slate-500 font-medium">
                          {item.milestones.map((ms, mIdx) => <li key={mIdx}>{ms}</li>)}
                        </ul>
                        <div className="text-[10px] text-slate-450 font-semibold italic pt-1 border-t border-slate-200/50">
                          <strong>Why critical:</strong> {item.why_critical}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Tech with explanations */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h3 className="text-small-label font-bold text-slate-800 flex items-center gap-2">
                    <Code size={16} className="text-blue-600" />
                    Recommended Tech Stack Additions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.roadmap.recommended_technologies.map((tech, idx) => (
                      <div key={idx} className="p-5 rounded-xl border border-[#ECECEC] shadow-sm flex flex-col justify-between text-xs font-semibold">
                        <div>
                          <span className="font-bold text-slate-900 block">{tech.name}</span>
                          <span className="text-[11px] text-slate-450 mt-2 block leading-relaxed">{tech.importance}</span>
                          <span className="text-[10px] text-slate-400 mt-2 block italic leading-relaxed border-t border-slate-100 pt-2">
                            <strong>Recruiter expects:</strong> {tech.recruiter_expectation}
                          </span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          <span>Study: {tech.where_to_learn}</span>
                          <span>Time: {tech.estimated_learning_time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h3 className="text-small-label font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-600" />
                    Recommended Projects to Build
                  </h3>
                  <div className="space-y-4">
                    {report.roadmap.recommended_projects.map((proj, idx) => (
                      <div key={idx} className="p-5 bg-slate-50/50 rounded-xl border border-[#ECECEC] text-xs space-y-2">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{proj.title}</span>
                          <span className="text-[9px] uppercase bg-blue-50 text-blue-650 border border-blue-100 px-2 rounded">{proj.difficulty_level}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{proj.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {proj.skills_gained.map((s, sIdx) => (
                            <span key={sIdx} className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-200 text-slate-650">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Detailed Question Review List */}
              <div className="space-y-8">
                <h2 className="text-card-title font-bold text-slate-900 uppercase tracking-wider">Question-by-Question Assessment</h2>

                {report.question_audits.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-[20px] border border-[#ECECEC] shadow-minimal p-8 md:p-10 space-y-6">
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {item.id}
                        </span>
                        <span className="text-[9px] font-bold uppercase bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                          {item.topic}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${item.difficulty === 'easy' ? 'bg-green-55 text-green-700' :
                            item.difficulty === 'hard' ? 'bg-red-55 text-red-700' :
                              'bg-orange-55 text-orange-700'
                          }`}>
                          {item.difficulty}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${item.score >= 8 ? 'bg-green-50 text-green-600 border border-green-100' :
                          item.score >= 5 ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                            'bg-red-50 text-red-650 border border-red-100'
                        }`}>
                        Score: {item.score}/10
                      </span>
                    </div>

                    {/* Question text */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Question</span>
                      <p className="text-small-label font-bold text-slate-900 mt-1 leading-snug">{item.question}</p>
                    </div>

                    {/* Expected Answer */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Expected Ideal Answer</span>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-semibold">{item.expected_answer}</p>
                    </div>

                    {/* Candidate Answer */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Your Response</span>
                      <p className="text-xs text-slate-700 mt-1.5 leading-relaxed bg-slate-50/30 p-3 rounded-xl border border-[#ECECEC] font-mono">
                        {item.user_answer || "No response recorded."}
                      </p>
                    </div>

                    {/* Technical Mistakes */}
                    {item.mistakes?.length > 0 && (
                      <div className="p-4 bg-orange-50/30 rounded-xl border border-orange-100/50">
                        <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider block flex items-center gap-1.5">
                          <AlertTriangle size={12} />
                          Identified Mistakes / Gaps
                        </span>
                        <ul className="list-disc pl-4 space-y-1 mt-2 text-xs text-slate-655 font-semibold leading-relaxed">
                          {item.mistakes.map((mistake, mIdx) => <li key={mIdx}>{mistake}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Improvement Suggestions */}
                    {item.suggestions?.length > 0 && (
                      <div>
                        <span className="text-[9px] font-bold text-green-600 uppercase tracking-wider block flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Suggestions for refinement
                        </span>
                        <ul className="list-disc pl-4 space-y-1 mt-1.5 text-xs text-slate-600">
                          {item.suggestions.map((suggestion, sIdx) => <li key={sIdx}>{suggestion}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Better Answer Recommendation */}
                    {item.better_answer && (
                      <div className="p-4 bg-blue-50/20 rounded-xl border border-blue-100/40">
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block flex items-center gap-1">
                          <Sparkles size={12} />
                          Polished Answer Benchmark
                        </span>
                        <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{item.better_answer}</p>
                      </div>
                    )}

                  </div>
                ))}
              </div>

            </div>
          </div>
        </main>
      )}

    </div>
  );
};

const STATUS_TEXTS = [
  "Reading your responses...",
  "Understanding context...",
  "Measuring confidence...",
  "Checking technical accuracy...",
  "Generating personalized feedback...",
  "Finalizing interview report..."
];

const SPEECH_BUBBLES = [
  "💬 \"Hmm... interesting answer!\"",
  "💬 \"Analyzing like a pro...\"",
  "💬 \"Checking confidence level...\"",
  "💬 \"Almost done...\"",
  "💬 \"Looking smart!\"",
  "💬 \"Crunching thousands of AI signals...\"",
  "💬 \"This answer deserves extra attention!\""
];

const TIPS = [
  "💡 Tip: Great interviews aren't about perfect answers—they're about clear thinking and confidence.",
  "💡 Tip: AI is preparing personalized suggestions.",
  "💡 Tip: Your report will include strengths and improvement areas.",
  "💡 Tip: Almost there... thanks for your patience!"
];

const RobotMascot: React.FC<{
  isBlinking: boolean;
  isWinking: boolean;
  mousePos: { x: number; y: number };
}> = ({ isBlinking, isWinking, mousePos }) => {
  const robotRef = useRef<HTMLDivElement>(null);
  const [headOffset, setHeadOffset] = useState({ x: 0, y: 0, rotate: 0 });
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!robotRef.current) return;
    const rect = robotRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = mousePos.x - centerX;
    const dy = mousePos.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const maxEyeOffset = 4;
    const maxHeadOffset = 6;
    const maxRotation = 8; // degrees

    const factor = Math.min(dist / 200, 1);

    const eyeX = (dx / dist) * maxEyeOffset * factor;
    const eyeY = (dy / dist) * maxEyeOffset * factor;

    const headX = (dx / dist) * maxHeadOffset * factor;
    const headY = (dy / dist) * maxHeadOffset * factor;
    const rotate = (dx / window.innerWidth) * maxRotation;

    setEyeOffset({ x: eyeX, y: eyeY });
    setHeadOffset({ x: headX, y: headY, rotate });
  }, [mousePos]);

  return (
    <div ref={robotRef} className="relative w-48 h-48 flex items-center justify-center">
      <div className="absolute w-32 h-6 bg-blue-500/20 blur-xl rounded-full bottom-2 animate-[pulse_2s_infinite]" />

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="w-full h-full flex flex-col items-center justify-center relative"
      >
        <svg viewBox="0 0 150 150" className="w-40 h-40 overflow-visible">
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <circle cx="20" cy="30" r="1.5" fill="#8B5CF6" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="130" cy="40" r="2.2" fill="#60A5FA" className="animate-ping" style={{ animationDuration: '4s' }} />

          {/* Body */}
          <path d="M 45 105 Q 75 90 105 105 Q 115 130 75 135 Q 35 130 45 105 Z" fill="url(#bodyGrad)" />
          <rect x="55" y="110" width="40" height="15" rx="4" fill="#1E293B" />
          <line x1="60" y1="117" x2="90" y2="117" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />

          {/* Head */}
          <g style={{
            transform: `translate(${headOffset.x}px, ${headOffset.y}px) rotate(${headOffset.rotate}deg)`,
            transformOrigin: '75px 85px',
            transition: 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}>
            <line x1="75" y1="55" x2="75" y2="30" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" />
            <circle cx="75" cy="25" r="7" fill="#8B5CF6" filter="url(#glow)" className="animate-[pulse_1.5s_infinite]" />
            <circle cx="75" cy="25" r="3" fill="#FFF" />

            <rect x="65" y="80" width="20" height="10" rx="2" fill="#4B5563" />

            <rect x="25" y="58" width="10" height="15" rx="3" fill="#6B7280" />
            <rect x="115" y="58" width="10" height="15" rx="3" fill="#6B7280" />

            <rect x="30" y="45" width="90" height="42" rx="16" fill="url(#headGrad)" filter="url(#glow)" />
            <rect x="38" y="50" width="74" height="28" rx="10" fill="#0F172A" />

            <g style={{
              transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
              transition: 'transform 0.1s ease-out'
            }}>
              <ellipse
                cx="58"
                cy="64"
                rx="7"
                ry={isBlinking || isWinking ? 1 : 7}
                fill="#60A5FA"
                filter="url(#glow)"
              />
              <circle cx="58" cy="64" r="2.5" fill="#FFF" opacity={isBlinking || isWinking ? 0 : 1} />

              <ellipse
                cx="92"
                cy="64"
                rx="7"
                ry={isBlinking ? 1 : 7}
                fill="#60A5FA"
                filter="url(#glow)"
              />
              <circle cx="92" cy="64" r="2.5" fill="#FFF" opacity={isBlinking ? 0 : 1} />
            </g>
          </g>
        </svg>
      </motion.div>
    </div>
  );
};

const AIWaitingScreen: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isWinking, setIsWinking] = useState(false);

  const [statusIdx, setStatusIdx] = useState(0);
  const [bubbleIdx, setBubbleIdx] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  // Prevent refresh and disable back button
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Evaluation is in progress. Please do not close or refresh the page.";
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.35) {
        setIsWinking(true);
        setTimeout(() => setIsWinking(false), 250);
      } else {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 180);
      }
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx(prev => (prev + 1) % STATUS_TEXTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBubbleIdx(prev => (prev + 1) % SPEECH_BUBBLES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIdx(prev => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const floatingVariants = (delay = 0, duration = 6) => ({
    animate: {
      y: [0, -15, 0],
      x: [0, 8, 0],
      opacity: [0.15, 0.45, 0.15],
      transition: {
        repeat: Infinity,
        duration,
        delay,
        ease: "easeInOut" as const
      }
    }
  });

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none justify-between">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto px-6 py-12 space-y-8 text-center">
        {/* Mascot container */}
        <div className="relative flex flex-col items-center justify-center w-full min-h-[260px]">
          {/* Speech bubble */}
          <div className="mb-4 h-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={bubbleIdx}
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -15 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="relative bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-md border border-slate-800 flex items-center justify-center max-w-[260px] mx-auto select-none"
              >
                {SPEECH_BUBBLES[bubbleIdx]}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-slate-800 transform rotate-45"></div>
              </motion.div>
            </AnimatePresence>
          </div>

          <RobotMascot isBlinking={isBlinking} isWinking={isWinking} mousePos={mousePos} />

          {/* Floating decorations */}
          <motion.span
            variants={floatingVariants(0, 5)}
            animate="animate"
            className="absolute top-8 left-12 text-lg select-none"
          >
            ✨
          </motion.span>
          <motion.span
            variants={floatingVariants(1, 6)}
            animate="animate"
            className="absolute top-16 right-10 text-md select-none"
          >
            ⚡
          </motion.span>
          <motion.span
            variants={floatingVariants(2, 7)}
            animate="animate"
            className="absolute bottom-20 left-10 font-mono text-xs opacity-25 select-none text-blue-600 font-bold"
          >
            1 0
          </motion.span>
          <motion.span
            variants={floatingVariants(3.5, 5.5)}
            animate="animate"
            className="absolute bottom-12 right-12 font-mono text-xs opacity-20 select-none text-indigo-500 font-bold"
          >
            0 1
          </motion.span>
          <motion.span
            variants={floatingVariants(1.5, 4.5)}
            animate="animate"
            className="absolute top-36 left-16 text-sm select-none"
          >
            💙
          </motion.span>
        </div>

        {/* Headings */}
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            🤖 Hold Tight!
          </h1>
          <div className="space-y-1">
            <p className="text-base font-bold text-slate-700">
              Our AI engine is evaluating your interview answers.
            </p>
            <p className="text-sm font-semibold text-slate-450">
              This usually takes only a few seconds.
            </p>
          </div>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-md mx-auto">
            Sit back and relax while we analyze your responses, communication, confidence, and technical accuracy.
          </p>
        </div>

        {/* Progress Bar & Status */}
        <div className="w-full space-y-4 max-w-sm mx-auto">
          <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full filter blur-[1px]"
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-3 min-h-[48px]">
            <div className="flex gap-1.5 items-center justify-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={statusIdx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="text-[11px] text-slate-500 font-bold uppercase tracking-widest"
              >
                {STATUS_TEXTS[statusIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Tip Card */}
        <div className="w-full max-w-md mx-auto h-[72px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tipIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-center shadow-sm"
            >
              <p className="text-xs text-slate-655 font-semibold">
                {TIPS[tipIdx]}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResumeInterview;
