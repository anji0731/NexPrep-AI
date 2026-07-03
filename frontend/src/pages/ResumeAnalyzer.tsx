import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FriendlyErrorCard from '../components/FriendlyErrorCard';
import api from '../services/api';
import { getFriendlyError } from '../services/errorHelper';
import type { FriendlyError } from '../services/errorHelper';
import {
  ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle,
  AlertCircle, Activity, ListTodo, Upload, Target, Sparkles,
  Star, DollarSign, Building2, ChevronDown, ChevronUp, Compass, Landmark
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface ResumeHistoryItem {
  id: number;
  filename: string;
  version: number;
  uploaded_at: string;
  ats_score: number;
  interview_readiness: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
}

interface CareerPath {
  role_name: string;
  match_percentage: number;
  expected_salary: string;
  why_suitable: string;
  missing_skills: string[];
  learning_difficulty: string;
}

interface ResumeInsights {
  strongest_section: string;
  weakest_section: string;
  best_project: string;
  missing_certifications: string[];
  missing_projects: string[];
  resume_writing_quality: string;
  formatting_score: number;
  grammar_score: number;
  technical_depth: string;
}

interface RecruiterDecision {
  decision_status: string;
  reason: string;
  next_steps: string[];
}

interface JdCompatibility {
  job_match_score: number;
  matching_skills: string[];
  matching_technologies: string[];
  matching_projects: string[];
  missing_skills: string[];
  missing_keywords: string[];
  missing_certifications: string[];
  suggested_improvements: string[];
  final_recommendation: string;
  explanation: string;
  overall_match_label?: string;
  recruiter_verdict?: string;
  expected_salary_fit?: string;
}

interface RecruiterFeedback {
  impressed_by: string;
  biggest_weaknesses: string;
  what_should_be_improved: string;
  shortlist_decision: string;
  shortlist_confidence: number;
}

interface CompanyRecommendation {
  company_name: string;
  why_profile_fits: string;
  recommended_role: string;
  preparation_level: string;
}

interface SalaryPrediction {
  country: string;
  currency: string;
  entry_level_salary: number;
  average_salary: number;
  best_case_salary: number;
  justification: string;
}

interface ReadinessBreakdown {
  technical_readiness: number;
  communication_readiness: number;
  problem_solving: number;
  resume_quality: number;
  project_strength: number;
  overall_hiring_probability: number;
}

interface RoadmapPhase {
  phase: string;
  skills: string[];
  projects: string[];
  courses: string[];
  interview_preparation: string[];
}

interface MetricDetail {
  value: number;
  reason: string;
  explanation: string;
  strength: string;
  weakness: string;
}

interface ProfessionalAnalysisReport {
  overall_ats_score: MetricDetail;
  jd_match_percentage: MetricDetail;
  recruiter_confidence: MetricDetail;
  interview_readiness: MetricDetail;
  hiring_probability: MetricDetail;
}

interface JdMatchReport {
  overall_match_percentage: number;
  matched_skills: string[];
  matched_technologies: string[];
  missing_skills: string[];
  missing_technologies: string[];
  missing_keywords: string[];
  critical_improvements: string[];
  must_have_skills: string[];
  nice_to_have_skills: string[];
  recruiter_verdict: string;
}

interface AnalysisResult {
  id: number;
  filename: string;
  version: number;
  ats_score: number;
  interview_readiness: number;
  strengths: string[];
  weaknesses: string[];
  matched_jd_keywords: string[];
  missing_skills: string[];
  missing_jd_keywords: string[];
  priority_skills: string[];
  feedback_categories?: {
    formatting_score: number;
    grammar_score: number;
    skills_coverage: number;
    project_quality: number;
    formatting_feedback: string;
    grammar_feedback: string;
    skills_feedback: string;
    projects_feedback: string;
  };
  improvement_plan: string[];
  applicable_jobs?: string[];
  resume_brief_description?: string;
  jd_match_status?: string;
  job_description?: string | null;
  profile_summary?: string;

  // New Career Intelligence Engine properties
  recommended_career_paths?: CareerPath[];
  recruiter_resume_summary?: string;
  jd_compatibility?: JdCompatibility | null;
  ai_recruiter_feedback?: RecruiterFeedback;
  top_companies?: CompanyRecommendation[];
  salary_prediction?: SalaryPrediction;
  interview_readiness_breakdown?: ReadinessBreakdown;
  career_roadmap?: RoadmapPhase[];

  // AI Career Match Engine sub-fields
  career_level_detection?: {
    detected_level: string;
    confidence_percentage: number;
  };
  company_match_recommendations?: {
    recommended_types: string[];
    top_hiring_companies: string[];
  };
  recruiter_verdict_model?: {
    star_rating: number;
    rating_label: string;
    explanation: string;
  };
  professional_analysis_report?: ProfessionalAnalysisReport;
  jd_match_report?: JdMatchReport;
  resume_insights?: ResumeInsights;
  recruiter_decision?: RecruiterDecision;
}

const LOADING_STEPS = [
  { title: 'Uploading your resume...', subtitle: 'We are receiving your resume and preparing it for review.', icon: '📄' },
  { title: 'Reading your resume...', subtitle: 'Our system is carefully scanning your experience and skills.', icon: '🔍' },
  { title: 'Comparing your resume with the Job Description...', subtitle: 'Matching your background against the role requirements.', icon: '💼' },
  { title: 'Analyzing your skills and experience...', subtitle: 'Reviewing your qualifications and career story.', icon: '🧠' },
  { title: 'Calculating ATS compatibility...', subtitle: 'Estimating how closely your resume fits the role.', icon: '📊' },
  { title: 'Preparing personalized career insights...', subtitle: 'Generating tailored recommendations for your next steps.', icon: '🎯' },
  { title: 'Finalizing your personalized report...', subtitle: 'Putting the finishing touches on your career report.', icon: '✅' }
];

const LOADING_MESSAGES = [
  '✔ Reading your resume...',
  '✔ Understanding your technical skills...',
  '✔ Reviewing your projects...',
  '✔ Matching with the Job Description...',
  '✔ Calculating ATS Score...',
  '✔ Finding suitable job roles...',
  '✔ Preparing interview recommendations...',
  '✔ Finalizing your personalized report...'
];

const ResumeAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jdMode, setJdMode] = useState<'text' | 'file'>('text');
  const [jdFile, setJdFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [friendlyError, setFriendlyError] = useState<FriendlyError | null>(null);
  const [friendlyRetry, setFriendlyRetry] = useState<(() => void) | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [history, setHistory] = useState<ResumeHistoryItem[]>([]);
  const [viewHistoryId, setViewHistoryId] = useState<number | null>(null);

  // Versions comparison state
  const [compResume1, setCompResume1] = useState<ResumeHistoryItem | null>(null);
  const [compResume2, setCompResume2] = useState<ResumeHistoryItem | null>(null);

  // Accordion/Collapsible state for complex UI categories
  const [expandedRoadmap, setExpandedRoadmap] = useState<Record<string, boolean>>({
    "30 Days Plan": true,
    "60 Days Plan": false,
    "90 Days Plan": false
  });

  const [expandedCareerPath, setExpandedCareerPath] = useState<number | null>(0);

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      setCompResume1(history[0]);
      setCompResume2(history[1] || null);
    }
  }, [history]);

  // Timed progress indicator for friendly loading steps
  useEffect(() => {
    let interval: any;
    if (loading) {
      setPipelineStep(0);
      interval = setInterval(() => {
        setPipelineStep((prev) => {
          if (prev < LOADING_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 20000); // 20 seconds per step to align with Ollama Cloud analysis times
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    let messageInterval: any;
    if (loading) {
      setLoadingMessageIndex(0);
      messageInterval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 15000); // 15 seconds per loading message rotation
    }
    return () => clearInterval(messageInterval);
  }, [loading]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/resume/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setFriendlyError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setFriendlyError(null);
    }
  };

  const loadHistoricAnalysis = async (id: number) => {
    setLoading(true);
    setError(null);
    setFriendlyError(null);
    setViewHistoryId(id);
    try {
      const res = await api.get(`/api/resume/${id}`);
      setResult(res.data);
    } catch (err: any) {
      console.error(err);
      const friendly = getFriendlyError(err);
      setFriendlyError(friendly);
      setFriendlyRetry(() => () => loadHistoricAnalysis(id));
      setViewHistoryId(null);
    } finally {
      setLoading(false);
    }
  };

  const submitAnalysis = async () => {
    setLoading(true);
    setError(null);
    setFriendlyError(null);
    setResult(null);
    setViewHistoryId(null);

    // Verify file accessibility (handles virtual cloud files like Google Drive)
    if (file) {
      try {
        await file.slice(0, 1024).arrayBuffer();
        if (file.size === 0) throw new Error("Empty file");
      } catch (e) {
        setError("Cloud file could not be read. Please download this file to your device first.");
        setLoading(false);
        return;
      }
    }

    if (jdFile && jdMode === 'file') {
      try {
        await jdFile.slice(0, 1024).arrayBuffer();
        if (jdFile.size === 0) throw new Error("Empty file");
      } catch (e) {
        setError("Job Description cloud file could not be read. Please download this file to your device first.");
        setLoading(false);
        return;
      }
    }

    const formData = new FormData();
    if (file) formData.append('file', file);
    if (jdMode === 'text') {
      formData.append('job_description', jobDescription.trim());
    } else if (jdFile) {
      formData.append('jd_file', jdFile);
    }

    try {
      const res = await api.post('/api/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      const friendly = getFriendlyError(err);
      setFriendlyError(friendly);
      setFriendlyRetry(() => submitAnalysis);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isJdProvided = jdMode === 'text' ? !!jobDescription.trim() : !!jdFile;
    if (!file || !isJdProvided) {
      setError('Both a resume PDF file and a Job Description are required.');
      return;
    }

    await submitAnalysis();
  };

  const toggleRoadmap = (phase: string) => {
    setExpandedRoadmap(prev => ({ ...prev, [phase]: !prev[phase] }));
  };

  // Format predicted currency values nicely
  const formatCurrency = (val: number | undefined, currencyCode = "USD") => {
    if (val === undefined) return "N/A";
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    });
    return formatter.format(val);
  };

  // Reveal animation setups
  const revealVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-600">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 sm:px-8 pt-6 pb-16">

        {/* Navigation & Header Block */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-4 border-b border-[#ECECEC]">
          <div className="text-left max-w-3xl">
            <h1 className="text-page-title font-bold text-slate-900 tracking-tight">
              AI Career Intelligence Engine
            </h1>
            <p className="text-body-custom text-slate-500 leading-relaxed mt-[12px]">
              NEXPrep's flagship intelligence model. Upload your resume PDF for an automated, multi-dimensional assessment covering career fits, salary estimates, roadmap milestones, and professional recruiter feedback.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0 pt-1">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-small-label font-medium text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
            {result && (
              <button
                onClick={() => { setResult(null); setViewHistoryId(null); setFile(null); }}
                className="text-small-label font-bold text-blue-600 hover:underline"
              >
                Analyze new resume
              </button>
            )}
          </div>
        </div>

        <div className="mt-[32px] space-y-8">

          {error && !friendlyError && (
            <div className="p-5 bg-red-50/50 border border-red-100 rounded-xl text-red-655 text-small-label font-semibold flex items-center gap-3 max-w-2xl">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {friendlyError && (
            <FriendlyErrorCard
              error={friendlyError}
              onAction={() => {
                if (friendlyRetry) {
                  friendlyRetry();
                }
                setFriendlyError(null);
              }}
            />
          )}

          {/* LOADING STATE */}
          {loading && (
            <div className="bg-white p-10 md:p-14 rounded-[20px] border border-[#ECECEC] shadow-minimal max-w-2xl mx-auto text-center space-y-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl">
                  ⏳
                </div>
                <div>
                  <h3 className="text-card-title font-bold text-slate-900">Analyzing Your Resume</h3>
                  <p className="text-body-custom text-slate-500 mt-2 max-w-xl mx-auto">
                    Please wait a moment while we prepare your personalized report.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm text-slate-500 font-medium">
                  <span>Estimated remaining time</span>
                  <span>{Math.max(60, 60 + (LOADING_STEPS.length - pipelineStep - 1) * 20)} sec</span>
                </div>

                <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="absolute inset-y-0 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((pipelineStep + 1) / LOADING_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  <div className="absolute inset-0 bg-white/10" />
                </div>

                <div className="space-y-3 min-h-[108px] flex flex-col items-center justify-center">
                  <span className="text-sm font-semibold text-slate-600 uppercase tracking-widest block">
                    {LOADING_MESSAGES[loadingMessageIndex]}
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={pipelineStep}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.35 }}
                      className="space-y-2 text-center"
                    >
                      <div className="text-5xl leading-none">{LOADING_STEPS[pipelineStep].icon}</div>
                      <h4 className="text-lg font-semibold text-slate-900">{LOADING_STEPS[pipelineStep].title}</h4>
                      <p className="text-sm text-slate-500 max-w-lg leading-relaxed">{LOADING_STEPS[pipelineStep].subtitle}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-medium">
                Thank you for your patience. We're preparing a personalized report tailored specifically to your resume.
              </p>
            </div>
          )}

          {/* INPUT FORM PANEL */}
          {!result && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Form Column */}
              <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-8 text-left">
                <h2 className="text-card-title font-bold text-slate-900 border-b border-[#ECECEC] pb-4">Analyze New Profile</h2>

                {/* Drag-and-drop Upload Area */}
                <div className="space-y-3">
                  <label className="block text-small-label font-bold text-slate-450 uppercase tracking-wider">
                    Resume PDF File <span className="text-red-500">*</span>
                  </label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-[20px] p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${file ? 'border-blue-500 bg-blue-50/10' : 'border-slate-200 hover:border-slate-350 bg-slate-50/20'
                      }`}
                    onClick={() => document.getElementById('resume-file-input')?.click()}
                  >
                    <input
                      type="file"
                      id="resume-file-input"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="w-12 h-12 rounded-xl bg-blue-50/60 text-blue-650 flex items-center justify-center border border-blue-100/30">
                      <Upload size={20} />
                    </div>

                    {file ? (
                      <div className="space-y-1">
                        <span className="text-body-custom font-bold text-slate-800 block">{file.name}</span>
                        <span className="text-small-label text-slate-400 font-semibold block">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-body-custom font-bold text-slate-700 block">Drag & drop your resume here, or <span className="text-blue-600 hover:underline">browse</span></span>
                        <span className="text-small-label text-slate-400 font-semibold block">Only PDF files are supported (Max 10MB)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Job Description box */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-small-label font-bold text-slate-455 uppercase tracking-wider">
                      Target Job Description <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 bg-slate-50 border border-slate-200/60 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setJdMode('text')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${jdMode === 'text' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        Paste Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setJdMode('file')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${jdMode === 'file' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        Upload PDF
                      </button>
                    </div>
                  </div>

                  {jdMode === 'text' ? (
                    <textarea
                      id="jd-textarea"
                      rows={6}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the target job description here to audit keyword compatibility and missing technical skillsets (Required)..."
                      className="w-full rounded-[20px] border border-[#ECECEC] px-5 py-4 text-small-label leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
                    ></textarea>
                  ) : (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          setJdFile(e.dataTransfer.files[0]);
                          setError(null);
                        }
                      }}
                      className={`border-2 border-dashed rounded-[20px] p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${jdFile ? 'border-blue-500 bg-blue-50/10' : 'border-slate-200 hover:border-slate-350 bg-slate-50/20'
                        }`}
                      onClick={() => document.getElementById('jd-file-input')?.click()}
                    >
                      <input
                        type="file"
                        id="jd-file-input"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setJdFile(e.target.files[0]);
                            setError(null);
                          }
                        }}
                      />
                      <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-650 flex items-center justify-center border border-blue-100/30">
                        <Upload size={18} />
                      </div>
                      {jdFile ? (
                        <div className="space-y-1">
                          <span className="text-body-custom font-bold text-slate-800 block">{jdFile.name}</span>
                          <span className="text-small-label text-slate-400 font-semibold block">{(jdFile.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-body-custom font-bold text-slate-700 block">Drag & drop JD PDF here, or <span className="text-blue-600 hover:underline">browse</span></span>
                          <span className="text-small-label text-slate-400 font-semibold block">Only PDF files are supported</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={!file || (jdMode === 'text' ? !jobDescription.trim() : !jdFile)}
                    className="btn-primary px-8 py-4 text-xs font-bold uppercase tracking-wider shadow-sm rounded-xl disabled:opacity-50 disabled:pointer-events-none"
                  >
                    🚀 Start Analysis Pipeline
                  </button>
                </div>
              </form>

              {/* Sidebar Column (History list) */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6 text-left">
                  <h3 className="text-card-title font-bold text-slate-900 border-b border-[#ECECEC] pb-4">Version History</h3>

                  {history.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                      {history.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => loadHistoricAnalysis(item.id)}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${viewHistoryId === item.id
                            ? 'border-blue-500 bg-blue-50/10'
                            : 'border-[#ECECEC] hover:border-slate-350 hover:bg-slate-50/30'
                            }`}
                        >
                          <div className="space-y-1">
                            <span className="text-small-label font-bold text-slate-800 block group-hover:text-blue-600 transition-colors">V{item.version}: {item.filename.length > 18 ? item.filename.slice(0, 15) + '...' : item.filename}</span>
                            <span className="text-[11px] text-slate-400 font-semibold block">{new Date(item.uploaded_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-small-label font-bold text-slate-900 block">ATS: {item.ats_score}%</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-450 text-small-label font-medium">
                      No history found. Upload a resume to create version V1.
                    </div>
                  )}
                </div>

                {/* Version comparison card widget */}
                {history.length > 1 && compResume1 && (
                  <div className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6 text-left">
                    <h3 className="text-card-title font-bold text-slate-900 border-b border-[#ECECEC] pb-4">Version Compare</h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        <span>Base Version</span>
                        <span>Target Version</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={compResume1.id}
                          onChange={(e) => setCompResume1(history.find(h => h.id === parseInt(e.target.value)) || null)}
                          className="rounded-xl border border-[#ECECEC] p-3 text-small-label focus:outline-none"
                        >
                          {history.map(h => <option key={h.id} value={h.id}>V{h.version}</option>)}
                        </select>

                        <select
                          value={compResume2?.id || ""}
                          onChange={(e) => setCompResume2(history.find(h => h.id === parseInt(e.target.value)) || null)}
                          className="rounded-xl border border-[#ECECEC] p-3 text-small-label focus:outline-none"
                        >
                          <option value="">None</option>
                          {history.map(h => <option key={h.id} value={h.id}>V{h.version}</option>)}
                        </select>
                      </div>

                      {compResume2 && (
                        <div className="pt-4 border-t border-[#ECECEC] space-y-2 text-small-label font-semibold">
                          <div className="flex justify-between items-center text-slate-700">
                            <span>ATS Score Delta:</span>
                            <span className={`${compResume1.ats_score >= compResume2.ats_score ? 'text-green-600' : 'text-red-500'}`}>
                              {compResume1.ats_score >= compResume2.ats_score ? '+' : ''}{compResume1.ats_score - compResume2.ats_score}%
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-700">
                            <span>Readiness Delta:</span>
                            <span className={`${compResume1.interview_readiness >= compResume2.interview_readiness ? 'text-green-600' : 'text-red-500'}`}>
                              {compResume1.interview_readiness >= compResume2.interview_readiness ? '+' : ''}{compResume1.interview_readiness - compResume2.interview_readiness}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* RESULTS DISPLAY DASHBOARD */}
          {result && !loading && (
            <div className="space-y-12 text-left">

              {/* Top overview row with scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* ATS circular ring score */}
                <div className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal flex flex-col items-center text-center">
                  <span className="text-small-label font-bold text-slate-400 uppercase tracking-widest">ATS Compatibility</span>

                  <div className="relative w-32 h-32 flex items-center justify-center mt-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="54" className="stroke-slate-100" strokeWidth="5" fill="transparent" />
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        className="stroke-blue-600"
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 54}
                        strokeDashoffset={2 * Math.PI * 54 * (1 - result.ats_score / 100)}
                      />
                    </svg>
                    <span className="absolute inset-0 grid place-items-center text-metric-ats leading-none font-bold text-slate-900">{result.ats_score}%</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-6 leading-relaxed font-semibold">
                    Compiled using tokenized job description matching checks.
                  </p>
                </div>

                {/* Interview readiness circular ring score */}
                <div className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal flex flex-col items-center text-center">
                  <span className="text-small-label font-bold text-slate-400 uppercase tracking-widest">Interview Readiness</span>

                  <div className="relative w-32 h-32 flex items-center justify-center mt-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="54" className="stroke-slate-100" strokeWidth="5" fill="transparent" />
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        className="stroke-green-500"
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 54}
                        strokeDashoffset={2 * Math.PI * 54 * (1 - result.interview_readiness / 100)}
                      />
                    </svg>
                    <span className="absolute inset-0 grid place-items-center text-metric-readiness leading-none font-bold text-slate-900">{result.interview_readiness}%</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-6 leading-relaxed font-semibold">
                    Derived from strengths, skills analysis, and projects coverage ratios.
                  </p>
                </div>

                {/* Start Interview CTA button card */}
                <div className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal flex flex-col justify-between items-center text-center space-y-6">
                  <div className="space-y-2">
                    <span className="text-small-label font-bold text-slate-400 uppercase tracking-widest block">Launch Practice</span>
                    <h3 className="text-card-title font-bold text-slate-800">Ready to test your resume profile?</h3>
                    <p className="text-xs text-slate-450 font-semibold leading-relaxed max-w-[240px] mx-auto">
                      Practice a customized mock interview generated from your resume profile.
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      setLoading(true);
                      setFriendlyError(null);
                      try {
                        const res = await api.post('/api/resume-interview/start', {
                          resume_analysis_id: result.id,
                          job_description: result.job_description || ""
                        });
                        window.location.href = `/resume-interview/${res.data.session_id}`;
                      } catch (err: any) {
                        console.error('Failed to start resume interview:', err);
                        const friendly = getFriendlyError(err);
                        setFriendlyError(friendly);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full btn-primary flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider rounded-xl"
                  >
                    Start Resume Mock Interview
                    <ArrowRight size={14} />
                  </button>
                </div>

              </div>

              {/* SECTION: Professional Analysis Report */}
              {result.professional_analysis_report && (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6"
                >
                  <div className="flex items-center gap-3 border-b border-[#ECECEC] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                      <Activity size={18} />
                    </div>
                    <h2 className="text-card-title font-bold text-slate-900">Professional Analysis Report</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {Object.entries({
                      "Overall ATS Score": result.professional_analysis_report.overall_ats_score,
                      "JD Match %": result.professional_analysis_report.jd_match_percentage,
                      "Recruiter Confidence": result.professional_analysis_report.recruiter_confidence,
                      "Interview Readiness": result.professional_analysis_report.interview_readiness,
                      "Hiring Probability": result.professional_analysis_report.hiring_probability
                    }).map(([title, metric], idx) => {
                      if (!metric) return null;
                      return (
                        <div key={idx} className="p-6 bg-slate-50/30 rounded-2xl border border-[#ECECEC] flex flex-col md:flex-row gap-6 items-start">
                          <div className="flex flex-col items-center shrink-0 w-full md:w-32 text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
                            <div className="relative w-20 h-20 flex items-center justify-center mt-3">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="40" cy="40" r="34" className="stroke-slate-150" strokeWidth="4" fill="transparent" />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="34"
                                  className="stroke-blue-600"
                                  strokeWidth="4"
                                  fill="transparent"
                                  strokeDasharray={2 * Math.PI * 34}
                                  strokeDashoffset={2 * Math.PI * 34 * (1 - metric.value / 100)}
                                />
                              </svg>
                              <span className="absolute text-sm font-bold text-slate-900">{metric.value}%</span>
                            </div>
                          </div>

                          <div className="flex-1 space-y-3 text-left">
                            <div>
                              <span className="text-xs font-bold text-slate-800 uppercase block tracking-wide">Reason</span>
                              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">{metric.reason}</p>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-800 uppercase block tracking-wide">Explanation</span>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">{metric.explanation}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                              <div className="flex gap-2 items-start">
                                <span className="inline-block px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-bold text-[9px] uppercase border border-green-100 mt-0.5">Strength</span>
                                <p className="text-xs text-slate-655 font-semibold">{metric.strength}</p>
                              </div>
                              <div className="flex gap-2 items-start">
                                <span className="inline-block px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-bold text-[9px] uppercase border border-red-100 mt-0.5">Weakness</span>
                                <p className="text-xs text-slate-655 font-semibold">{metric.weakness}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* SECTION: JD Match Report */}
              {result.jd_match_report && (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-8"
                >
                  <div className="flex items-center gap-3 border-b border-[#ECECEC] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                      <Target size={18} />
                    </div>
                    <h2 className="text-card-title font-bold text-slate-900">JD Match Report</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Match Score & Verdict */}
                    <div className="lg:col-span-4 p-6 bg-slate-50/50 rounded-[16px] border border-[#ECECEC] flex flex-col items-center text-center space-y-4">
                      <span className="text-small-label font-bold text-slate-400 uppercase tracking-wider">Overall Match</span>

                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="46" className="stroke-slate-100" strokeWidth="6" fill="transparent" />
                          <circle
                            cx="56"
                            cy="56"
                            r="46"
                            className="stroke-blue-600"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 46}
                            strokeDashoffset={2 * Math.PI * 46 * (1 - result.jd_match_report.overall_match_percentage / 100)}
                          />
                        </svg>
                        <span className="absolute inset-0 grid place-items-center text-2xl font-bold text-slate-900">{result.jd_match_report.overall_match_percentage}%</span>
                      </div>

                      <div className="pt-4 border-t border-slate-200 w-full">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Recruiter Verdict</span>
                        <p className="text-xs text-slate-700 font-semibold leading-relaxed p-3 bg-blue-50/40 rounded-xl border border-blue-100/40">
                          {result.jd_match_report.recruiter_verdict}
                        </p>
                      </div>
                    </div>

                    {/* Right Column: Breakdown Lists */}
                    <div className="lg:col-span-8 space-y-6 text-xs font-semibold">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Matched Column */}
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block">✓ Matched Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {result.jd_match_report.matched_skills.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-100">{s}</span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block">✓ Matched Technologies</span>
                            <div className="flex flex-wrap gap-1">
                              {result.jd_match_report.matched_technologies.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-100">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Missing Column */}
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-red-655 font-bold uppercase tracking-wider block">✗ Missing Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {result.jd_match_report.missing_skills.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-100">{s}</span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] text-red-655 font-bold uppercase tracking-wider block">✗ Missing Technologies</span>
                            <div className="flex flex-wrap gap-1">
                              {result.jd_match_report.missing_technologies.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-100">{s}</span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">✗ Missing Keywords</span>
                            <div className="flex flex-wrap gap-1">
                              {result.jd_match_report.missing_keywords.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-slate-50 text-slate-600 border border-slate-200">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#ECECEC] pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Must Have / Nice to Have */}
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">★ Must Have Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {result.jd_match_report.must_have_skills.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">{s}</span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">☆ Nice To Have Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {result.jd_match_report.nice_to_have_skills.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Critical Improvements */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-orange-700 font-bold uppercase tracking-wider block">⚠️ Critical Improvements Needed</span>
                          <ul className="list-disc pl-4 text-slate-655 space-y-1">
                            {result.jd_match_report.critical_improvements.map((imp, idx) => (
                              <li key={idx} className="leading-relaxed">{imp}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SECTION: Recruiter Final Decision */}
              {result.recruiter_decision && (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className={`p-8 sm:p-10 rounded-[20px] border shadow-minimal space-y-6 text-left ${result.recruiter_decision.decision_status.toLowerCase() === 'strong hire' ? 'bg-green-50/20 border-green-200' :
                    result.recruiter_decision.decision_status.toLowerCase() === 'interview recommended' ? 'bg-indigo-50/20 border-indigo-200' :
                      result.recruiter_decision.decision_status.toLowerCase() === 'shortlist' ? 'bg-blue-50/20 border-blue-200' :
                        result.recruiter_decision.decision_status.toLowerCase() === 'needs improvement' ? 'bg-orange-50/20 border-orange-200' :
                          'bg-red-50/20 border-red-200'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/50 pb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${result.recruiter_decision.decision_status.toLowerCase() === 'strong hire' ? 'bg-green-100 text-green-700 border-green-200' :
                        result.recruiter_decision.decision_status.toLowerCase() === 'interview recommended' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                          result.recruiter_decision.decision_status.toLowerCase() === 'shortlist' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            result.recruiter_decision.decision_status.toLowerCase() === 'needs improvement' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                              'bg-red-100 text-red-700 border-red-200'
                        }`}>
                        <CheckCircle2 size={18} />
                      </div>
                      <h2 className="text-card-title font-bold text-slate-900">Recruiter Final Decision</h2>
                    </div>
                    <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border ${result.recruiter_decision.decision_status.toLowerCase() === 'strong hire' ? 'bg-green-500 text-white border-green-600' :
                      result.recruiter_decision.decision_status.toLowerCase() === 'interview recommended' ? 'bg-indigo-600 text-white border-indigo-700' :
                        result.recruiter_decision.decision_status.toLowerCase() === 'shortlist' ? 'bg-blue-600 text-white border-blue-700' :
                          result.recruiter_decision.decision_status.toLowerCase() === 'needs improvement' ? 'bg-orange-500 text-white border-orange-600' :
                            'bg-red-500 text-white border-red-600'
                      }`}>
                      {result.recruiter_decision.decision_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start text-xs font-semibold">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Decision Reason</span>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white/60 p-4 rounded-xl border border-slate-200/40">
                        {result.recruiter_decision.reason}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Recommended Next Steps</span>
                      <ul className="space-y-2">
                        {result.recruiter_decision.next_steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3 bg-white/60 p-3 rounded-xl border border-slate-200/40 leading-relaxed font-semibold text-slate-700">
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-650 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="mt-0.5">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SECTION: Resume Insights */}
              {result.resume_insights && (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6"
                >
                  <div className="flex items-center gap-3 border-b border-[#ECECEC] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                      <Sparkles size={18} />
                    </div>
                    <h2 className="text-card-title font-bold text-slate-900">Resume Insights</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Formatting Score */}
                    <div className="p-5 bg-slate-50/30 border border-[#ECECEC] rounded-2xl text-center space-y-2 flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Formatting Score</span>
                      <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100/30">
                        {result.resume_insights.formatting_score}%
                      </div>
                    </div>

                    {/* Grammar Score */}
                    <div className="p-5 bg-slate-50/30 border border-[#ECECEC] rounded-2xl text-center space-y-2 flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Grammar Score</span>
                      <div className="w-16 h-16 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold text-lg border border-green-100/30">
                        {result.resume_insights.grammar_score}%
                      </div>
                    </div>

                    {/* Resume Writing Quality */}
                    <div className="p-5 bg-slate-50/30 border border-[#ECECEC] rounded-2xl text-center space-y-2 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Writing Quality</span>
                      <span className="text-sm font-bold text-slate-800">{result.resume_insights.resume_writing_quality}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-4 text-xs font-semibold">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">★ Strongest Section</span>
                        <p className="text-slate-800 font-bold mt-1 text-sm">{result.resume_insights.strongest_section}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">⚠️ Weakest Section</span>
                        <p className="text-slate-800 font-bold mt-1 text-sm">{result.resume_insights.weakest_section}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">💡 Best Project</span>
                        <p className="text-slate-700 leading-relaxed mt-1">{result.resume_insights.best_project}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">⚡ Technical Depth</span>
                        <p className="text-slate-700 leading-relaxed mt-1">{result.resume_insights.technical_depth}</p>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs font-semibold">
                      <div className="space-y-2">
                        <span className="text-[10px] text-orange-700 font-bold uppercase tracking-wider block">Missing Certifications Gaps</span>
                        <div className="flex flex-wrap gap-1.5">
                          {result.resume_insights.missing_certifications.map((cert, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded bg-orange-50 text-orange-700 border border-orange-100">{cert}</span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-red-655 font-bold uppercase tracking-wider block">Recommended Projects to Build</span>
                        <ul className="list-disc pl-4 text-slate-655 space-y-1">
                          {result.resume_insights.missing_projects.map((proj, idx) => (
                            <li key={idx} className="leading-relaxed">{proj}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SECTION 3: Job Description Compatibility */}
              {result.job_description && result.jd_compatibility && (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6"
                >
                  <div className="flex items-center gap-3 border-b border-[#ECECEC] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                      <Target size={18} />
                    </div>
                    <h2 className="text-card-title font-bold text-slate-900">Job Description Compatibility</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left: compatibility scores */}
                    <div className="lg:col-span-4 p-6 bg-slate-50/50 rounded-[16px] border border-[#ECECEC] flex flex-col items-center text-center space-y-4">
                      <span className="text-small-label font-bold text-slate-400 uppercase tracking-wider">Job Match Score</span>

                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="46" className="stroke-slate-100" strokeWidth="6" fill="transparent" />
                          <circle
                            cx="56"
                            cy="56"
                            r="46"
                            className="stroke-blue-600"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 46}
                            strokeDashoffset={2 * Math.PI * 46 * (1 - (result.jd_compatibility.job_match_score || 0) / 100)}
                          />
                        </svg>
                        <span className="absolute inset-0 grid place-items-center text-metric-ats font-bold text-slate-900">{result.jd_compatibility.job_match_score}%</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Recommendation</span>
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase ${result.jd_compatibility.final_recommendation.toLowerCase().includes('excellent') ? 'bg-green-50 text-green-700 border border-green-150' :
                          result.jd_compatibility.final_recommendation.toLowerCase().includes('good') ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                            result.jd_compatibility.final_recommendation.toLowerCase().includes('moderate') ? 'bg-orange-50 text-orange-700 border border-orange-150' :
                              'bg-red-50 text-red-700 border border-red-150'
                          }`}>
                          {result.jd_compatibility.final_recommendation}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed font-semibold pt-2 border-t border-slate-200 w-full">
                        {result.jd_compatibility.explanation}
                      </p>
                    </div>

                    {/* Right: details lists */}
                    <div className="lg:col-span-8 space-y-6 text-xs font-semibold">

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Matching elements */}
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block">✓ Matching Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {result.jd_compatibility.matching_skills.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-100">{s}</span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block">✓ Matching Technologies</span>
                            <div className="flex flex-wrap gap-1">
                              {result.jd_compatibility.matching_technologies.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-100">{s}</span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block">✓ Matching Projects</span>
                            <ul className="list-disc pl-4 text-slate-655 space-y-1">
                              {result.jd_compatibility.matching_projects.map((s, idx) => <li key={idx}>{s}</li>)}
                            </ul>
                          </div>
                        </div>

                        {/* Missing elements */}
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-red-655 font-bold uppercase tracking-wider block">✗ Missing Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {result.jd_compatibility.missing_skills.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">{s}</span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] text-red-655 font-bold uppercase tracking-wider block">✗ Missing Keywords</span>
                            <div className="flex flex-wrap gap-1">
                              {result.jd_compatibility.missing_keywords.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">{s}</span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] text-red-655 font-bold uppercase tracking-wider block">✗ Missing Certifications</span>
                            <div className="flex flex-wrap gap-1">
                              {result.jd_compatibility.missing_certifications.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Improvements */}
                      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 space-y-2">
                        <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider block">Suggested Resume Improvements</span>
                        <ul className="list-decimal pl-4 space-y-1.5 text-slate-655">
                          {result.jd_compatibility.suggested_improvements.map((s, idx) => <li key={idx}>{s}</li>)}
                        </ul>
                      </div>

                    </div>

                  </div>
                </motion.div>
              )}

              {/* SECTION 1: AI Career Match */}
              {result.recommended_career_paths && result.recommended_career_paths.length > 0 && (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6"
                >
                  <div className="flex items-center gap-3 border-b border-[#ECECEC] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                      <Compass size={18} />
                    </div>
                    <h2 className="text-card-title font-bold text-slate-900">Recommended Career Paths</h2>
                  </div>

                  <div className="space-y-4">
                    {result.recommended_career_paths.map((path, idx) => {
                      const isExpanded = expandedCareerPath === idx;
                      return (
                        <div key={idx} className="border border-[#ECECEC] rounded-[16px] overflow-hidden bg-slate-50/10">
                          <button
                            type="button"
                            onClick={() => setExpandedCareerPath(isExpanded ? null : idx)}
                            className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-6 text-left hover:bg-slate-50/40 transition-colors gap-4"
                          >
                            <div className="space-y-1">
                              <span className="text-small-label font-bold text-slate-800 block">{path.role_name}</span>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Match Score</span>
                                <span className="text-sm font-bold text-blue-600">{path.match_percentage}% Match</span>
                              </div>
                              <div className="w-8 h-8 rounded-lg bg-white border border-[#ECECEC] flex items-center justify-center text-slate-450 shrink-0 shadow-sm">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="p-6 pt-0 border-t border-[#ECECEC] space-y-4 text-xs font-semibold">
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Why Suitable</span>
                                    <p className="text-slate-655 leading-relaxed">{path.why_suitable}</p>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Expected Salary</span>
                                      <span className="text-slate-800 font-bold block text-sm mt-0.5">{path.expected_salary}</span>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Learning Difficulty</span>
                                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold mt-1 uppercase ${path.learning_difficulty.toLowerCase() === 'easy' ? 'bg-green-50 text-green-700 border border-green-150' :
                                        path.learning_difficulty.toLowerCase() === 'medium' ? 'bg-orange-50 text-orange-700 border border-orange-150' :
                                          'bg-red-50 text-red-700 border border-red-150'
                                        }`}>
                                        {path.learning_difficulty}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-2 border-t border-slate-100 pt-4">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Missing Skills Gaps</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {path.missing_skills.map((s, sIdx) => (
                                        <span key={sIdx} className="px-2 py-1 text-[10px] font-bold rounded bg-red-50 text-red-700 border border-red-100">
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* SECTION 2: Resume Summary (Recruiter View) */}
              {result.recruiter_resume_summary && (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h2 className="text-card-title font-bold text-slate-900 leading-none">AI Recruiter Summary</h2>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mt-1">Candid Profile Overview</span>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-200/50 relative">
                    <span className="absolute top-2 left-3 text-4xl text-slate-200 font-serif pointer-events-none">“</span>
                    <p className="text-body-custom text-slate-700 italic font-semibold leading-relaxed pl-4 pr-2">
                      {result.recruiter_resume_summary}
                    </p>
                    <span className="absolute bottom-1 right-4 text-4xl text-slate-200 font-serif pointer-events-none">”</span>
                  </div>
                </motion.div>
              )}

              {/* SECTION 4: AI Recruiter Feedback */}
              {result.ai_recruiter_feedback && (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6"
                >
                  <div className="flex items-center gap-3 border-b border-[#ECECEC] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                      <Activity size={18} />
                    </div>
                    <h2 className="text-card-title font-bold text-slate-900">AI Recruiter Feedback</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left checklist shortlist decision */}
                    <div className="lg:col-span-4 p-6 bg-slate-50/50 rounded-[16px] border border-[#ECECEC] text-center space-y-4">
                      <span className="text-small-label font-bold text-slate-450 uppercase tracking-wider block">Shortlist Verdict</span>

                      <span className={`inline-block px-4 py-1.5 rounded-xl text-sm font-bold uppercase ${result.ai_recruiter_feedback.shortlist_decision.toLowerCase() === 'yes' ? 'bg-green-50 text-green-700 border border-green-150' :
                        result.ai_recruiter_feedback.shortlist_decision.toLowerCase() === 'maybe' ? 'bg-orange-50 text-orange-700 border border-orange-150' :
                          'bg-red-50 text-red-700 border border-red-150'
                        }`}>
                        {result.ai_recruiter_feedback.shortlist_decision}
                      </span>

                      <div className="space-y-2 pt-2 border-t border-slate-200 w-full">
                        <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>Shortlist Confidence</span>
                          <span>{result.ai_recruiter_feedback.shortlist_confidence}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-650 h-full rounded-full" style={{ width: `${result.ai_recruiter_feedback.shortlist_confidence}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Right: detailed feedback lists */}
                    <div className="lg:col-span-8 space-y-6 text-xs font-semibold leading-relaxed text-slate-655">

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-450 uppercase tracking-wider block">What Impressed The Recruiter</span>
                        <p className="p-4 bg-slate-50/40 border border-[#ECECEC] rounded-xl">{result.ai_recruiter_feedback.impressed_by}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-455 uppercase tracking-wider block">Biggest Weaknesses</span>
                        <p className="p-4 bg-slate-50/40 border border-[#ECECEC] rounded-xl text-orange-655">{result.ai_recruiter_feedback.biggest_weaknesses}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-455 uppercase tracking-wider block">What Should Be Improved</span>
                        <p className="p-4 bg-slate-50/40 border border-[#ECECEC] rounded-xl">{result.ai_recruiter_feedback.what_should_be_improved}</p>
                      </div>

                    </div>

                  </div>
                </motion.div>
              )}

              {/* SECTION 5: Top Companies */}
              {result.top_companies && result.top_companies.length > 0 && (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6"
                >
                  <div className="flex items-center gap-3 border-b border-[#ECECEC] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                      <Building2 size={18} />
                    </div>
                    <h2 className="text-card-title font-bold text-slate-900">Recommended Companies</h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-4 pr-4">Company Name</th>
                          <th className="py-4 px-4">Recommended Role</th>
                          <th className="py-4 px-4">Why Profile Fits</th>
                          <th className="py-4 pl-4 text-right">Prep Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {result.top_companies.map((company, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-4 pr-4 font-bold text-slate-900 flex items-center gap-2">
                              <span>🏢 {company.company_name}</span>
                            </td>
                            <td className="py-4 px-4">{company.recommended_role}</td>
                            <td className="py-4 px-4 text-slate-500 leading-relaxed max-w-sm">{company.why_profile_fits}</td>
                            <td className="py-4 pl-4 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${company.preparation_level.toLowerCase() === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                                company.preparation_level.toLowerCase() === 'medium' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                  'bg-green-50 text-green-600 border border-green-100'
                                }`}>
                                {company.preparation_level} prep
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* SECTION 6: Salary Prediction */}
              {result.salary_prediction && (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6"
                >
                  <div className="flex items-center gap-3 border-b border-[#ECECEC] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <h2 className="text-card-title font-bold text-slate-900 leading-none">Salary Prediction Matrix</h2>
                      <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mt-1">Based in {result.salary_prediction.country}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Entry level */}
                    <div className="p-6 bg-slate-50/50 rounded-xl border border-[#ECECEC] space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Entry Level Salary</span>
                      <span className="text-xl font-bold text-slate-800 block">
                        {formatCurrency(result.salary_prediction.entry_level_salary, result.salary_prediction.currency)}
                      </span>
                    </div>

                    {/* Average level */}
                    <div className="p-6 bg-slate-50/50 rounded-xl border border-[#ECECEC] space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Industry Salary</span>
                      <span className="text-xl font-bold text-blue-600 block">
                        {formatCurrency(result.salary_prediction.average_salary, result.salary_prediction.currency)}
                      </span>
                    </div>

                    {/* Best Case level */}
                    <div className="p-6 bg-slate-50/50 rounded-xl border border-[#ECECEC] space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Best Case Salary</span>
                      <span className="text-xl font-bold text-green-600 block">
                        {formatCurrency(result.salary_prediction.best_case_salary, result.salary_prediction.currency)}
                      </span>
                    </div>

                  </div>

                  <p className="p-4 bg-slate-50/30 border border-[#ECECEC] rounded-xl text-xs font-semibold leading-relaxed text-slate-500">
                    <strong>Calculation Justification:</strong> {result.salary_prediction.justification}
                  </p>
                </motion.div>
              )}

              {/* SECTION 7: Interview Readiness Detailed Breakdown */}
              {result.interview_readiness_breakdown && (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6"
                >
                  <div className="flex items-center gap-3 border-b border-[#ECECEC] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                      <Activity size={18} />
                    </div>
                    <h2 className="text-card-title font-bold text-slate-900">AI Readiness Dimensions</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                      { label: "Technical Readiness", score: result.interview_readiness_breakdown.technical_readiness, color: "bg-blue-600" },
                      { label: "Communication Readiness", score: result.interview_readiness_breakdown.communication_readiness, color: "bg-green-500" },
                      { label: "Problem Solving Capacity", score: result.interview_readiness_breakdown.problem_solving, color: "bg-purple-600" },
                      { label: "Resume Structural Quality", score: result.interview_readiness_breakdown.resume_quality, color: "bg-indigo-650" },
                      { label: "Project Strengths Metric", score: result.interview_readiness_breakdown.project_strength, color: "bg-orange-500" },
                      { label: "Overall Hiring Probability", score: result.interview_readiness_breakdown.overall_hiring_probability, color: "bg-teal-600" }
                    ].map((item, idx) => (
                      <div key={idx} className="p-5 bg-slate-50/50 rounded-xl border border-[#ECECEC] space-y-3 font-semibold">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-700">{item.label}</span>
                          <span className="text-slate-900 font-bold">{item.score}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.score}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* SECTION 8: Collapsible Career Roadmap */}
              {result.career_roadmap && result.career_roadmap.length > 0 && (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6"
                >
                  <div className="flex items-center gap-3 border-b border-[#ECECEC] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                      <ListTodo size={18} />
                    </div>
                    <h2 className="text-card-title font-bold text-slate-900">Career Preparation Roadmap</h2>
                  </div>

                  <div className="space-y-4 text-left">
                    {result.career_roadmap.map((roadmap, idx) => {
                      const isExpanded = expandedRoadmap[roadmap.phase];
                      return (
                        <div key={idx} className="border border-[#ECECEC] rounded-[16px] overflow-hidden bg-slate-50/10">
                          <button
                            type="button"
                            onClick={() => toggleRoadmap(roadmap.phase)}
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50/40 transition-colors font-bold text-slate-800 text-small-label"
                          >
                            <span className="flex items-center gap-2">
                              <Landmark size={15} className="text-blue-600" />
                              {roadmap.phase}
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-white border border-[#ECECEC] flex items-center justify-center text-slate-450 shrink-0 shadow-sm">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="p-6 pt-0 border-t border-[#ECECEC] space-y-4 text-xs font-semibold leading-relaxed">
                                  <div className="space-y-2">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Skills to Learn</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {roadmap.skills.map((s, sIdx) => (
                                        <span key={sIdx} className="px-3 py-1.5 rounded-lg bg-white border border-[#ECECEC] text-slate-700 shadow-sm">
                                          🎯 {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-2 border-t border-slate-100 pt-3">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Recommended Projects</span>
                                    <ul className="list-disc pl-4 text-slate-655 space-y-1">
                                      {roadmap.projects.map((proj, pIdx) => (
                                        <li key={pIdx}>{proj}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="space-y-2 border-t border-slate-100 pt-3">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Suggested Courses</span>
                                    <ul className="list-disc pl-4 text-slate-655 space-y-1">
                                      {roadmap.courses.map((course, cIdx) => (
                                        <li key={cIdx}>{course}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="space-y-2 border-t border-slate-100 pt-3">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Interview Preparation</span>
                                    <ul className="list-disc pl-4 text-slate-655 space-y-1">
                                      {roadmap.interview_preparation.map((prep, ipIdx) => (
                                        <li key={ipIdx}>{prep}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Resume Health Details matrix */}
              <div className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6 text-left">
                <h2 className="text-card-title font-bold text-slate-900 pb-3 border-b border-[#ECECEC] flex items-center gap-3">
                  <Activity size={22} className="text-blue-600" />
                  Resume Health Parameters
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                  {/* Formatting */}
                  <div className="p-5 bg-slate-50/50 rounded-xl border border-[#ECECEC] space-y-3">
                    <div className="flex justify-between items-center text-small-label font-bold">
                      <span className="text-slate-700">Formatting</span>
                      <span className="text-blue-600">{result.feedback_categories?.formatting_score || 85}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full" style={{ width: `${result.feedback_categories?.formatting_score || 85}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                      {result.feedback_categories?.formatting_feedback || "Clear PDF font hierarchies and standard header definitions."}
                    </p>
                  </div>

                  {/* Grammar */}
                  <div className="p-5 bg-slate-50/50 rounded-xl border border-[#ECECEC] space-y-3">
                    <div className="flex justify-between items-center text-small-label font-bold">
                      <span className="text-slate-700">Grammar & Syntax</span>
                      <span className="text-green-600">{result.feedback_categories?.grammar_score || 90}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full" style={{ width: `${result.feedback_categories?.grammar_score || 90}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                      {result.feedback_categories?.grammar_feedback || "Excellent use of active action verbs; zero syntax typos detected."}
                    </p>
                  </div>

                  {/* Skills Coverage */}
                  <div className="p-5 bg-slate-50/50 rounded-xl border border-[#ECECEC] space-y-3">
                    <div className="flex justify-between items-center text-small-label font-bold">
                      <span className="text-slate-700">Skills Coverage</span>
                      <span className="text-purple-600">{result.feedback_categories?.skills_coverage || 80}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full" style={{ width: `${result.feedback_categories?.skills_coverage || 80}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                      {result.feedback_categories?.skills_feedback || "Solid coverage of core frameworks and language keyword indices."}
                    </p>
                  </div>

                  {/* Project Quality */}
                  <div className="p-5 bg-slate-50/50 rounded-xl border border-[#ECECEC] space-y-3">
                    <div className="flex justify-between items-center text-small-label font-bold">
                      <span className="text-slate-700">Project Quality</span>
                      <span className="text-orange-600">{result.feedback_categories?.project_quality || 75}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full" style={{ width: `${result.feedback_categories?.project_quality || 75}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-455 leading-relaxed font-semibold">
                      {result.feedback_categories?.projects_feedback || "Good description of technical impact; needs quantitative metrics."}
                    </p>
                  </div>

                </div>
              </div>

              {/* AI Career Match Engine Section */}
              {(!result.recommended_career_paths || result.recommended_career_paths.length === 0) ? (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-4 text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-50/60 text-orange-600 flex items-center justify-center border border-orange-100/30 mx-auto">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-small-label font-bold text-slate-800">Historical Report Cache</h3>
                  <p className="text-xs text-slate-450 max-w-md mx-auto leading-relaxed font-semibold">
                    This analysis report was generated with an older version of the Career Engine. Please click "Analyze new resume" above and re-upload your resume with the target Job Description to generate all dynamic compatibility matrices.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  variants={revealVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="bg-white p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6 text-left"
                >
                  <div className="flex items-center gap-3 border-b border-[#ECECEC] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                      <Compass size={18} />
                    </div>
                    <h2 className="text-card-title font-bold text-slate-900 leading-none">AI Career Match Engine</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Left Column: Roles & Resume Summary (S1 & S2) */}
                    <div className="lg:col-span-6 space-y-6">

                      {/* S1: Suitable Career Roles */}
                      <div className="space-y-3">
                        <span className="text-small-label text-slate-400 font-bold uppercase tracking-wider block">1. Suitable Career Roles</span>
                        <div className="space-y-2">
                          {result.recommended_career_paths?.slice(0, 10).map((role, idx) => (
                            <div key={idx} className="p-3 bg-slate-50/50 rounded-xl border border-[#ECECEC] text-xs font-semibold flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <span className="text-slate-800 font-bold block">✓ {role.role_name}</span>
                                <p className="text-slate-500 font-normal leading-relaxed">{role.why_suitable}</p>
                              </div>
                              <span className="text-blue-600 font-bold shrink-0">{role.match_percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* S2: AI Resume Summary */}
                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        <span className="text-small-label text-slate-400 font-bold uppercase tracking-wider block">2. AI Resume Summary</span>
                        <div className="p-4 bg-slate-50/50 rounded-xl border border-[#ECECEC] text-xs font-semibold leading-relaxed text-slate-700 italic">
                          "{result.recruiter_resume_summary || result.profile_summary}"
                        </div>
                      </div>

                    </div>

                    {/* Right Column: JD Compatibility, Career Level, Companies, Verdict (S3, S4, S5, S6) */}
                    <div className="lg:col-span-6 space-y-6">

                      {/* S3: Job Description Compatibility */}
                      <div className="space-y-3">
                        <span className="text-small-label text-slate-400 font-bold uppercase tracking-wider block">3. Job Description Compatibility</span>
                        {result.job_description && result.jd_compatibility ? (
                          <div className="p-4 bg-slate-50/50 rounded-xl border border-[#ECECEC] text-xs font-semibold space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                              <span className="text-slate-700">Overall Match</span>
                              <span className="text-blue-600 font-bold">{result.jd_compatibility.job_match_score}% ({result.jd_compatibility.overall_match_label || 'High Match'})</span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase block">Matched Skills</span>
                              <div className="flex flex-wrap gap-1">
                                {result.jd_compatibility.matching_skills?.slice(0, 6).map((s, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-100">{s}</span>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase block">Missing Skills & Technologies</span>
                              <div className="flex flex-wrap gap-1">
                                {result.jd_compatibility.missing_skills?.slice(0, 6).map((s, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">{s}</span>
                                ))}
                                {result.jd_compatibility.missing_keywords?.slice(0, 6).map((s, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">{s}</span>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
                              <span className="text-[10px] text-slate-400 uppercase block">Verdict</span>
                              <p className="text-slate-655 font-normal leading-relaxed">
                                {result.jd_compatibility.recruiter_verdict || result.jd_compatibility.explanation}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50/50 rounded-xl border border-[#ECECEC] text-xs font-semibold text-slate-450 text-center leading-relaxed">
                            No Job Description uploaded. Upload a Job Description to receive detailed compatibility analysis.
                          </div>
                        )}
                      </div>

                      {/* S4: Career Level Detection */}
                      {result.career_level_detection && (
                        <div className="space-y-2 border-t border-slate-100 pt-4">
                          <span className="text-small-label text-slate-400 font-bold uppercase tracking-wider block">4. Career Level Detection</span>
                          <div className="p-3 bg-slate-50/50 rounded-xl border border-[#ECECEC] text-xs font-semibold flex justify-between items-center">
                            <span className="text-slate-800">Detected Level: <strong className="text-slate-900 font-bold">{result.career_level_detection.detected_level}</strong></span>
                            <span className="text-blue-650 font-bold">Confidence: {result.career_level_detection.confidence_percentage}%</span>
                          </div>
                        </div>
                      )}

                      {/* S5: Company Recommendations */}
                      {result.company_match_recommendations && (
                        <div className="space-y-3 border-t border-slate-100 pt-4 text-xs font-semibold">
                          <span className="text-small-label text-slate-400 font-bold uppercase tracking-wider block">5. Company Recommendations</span>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase block">Fit Profiles</span>
                              <div className="flex flex-wrap gap-1">
                                {result.company_match_recommendations.recommended_types?.map((t, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-655 border border-slate-200/50">{t}</span>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase block">Top Hiring Matches</span>
                              <div className="flex flex-wrap gap-1">
                                {result.company_match_recommendations.top_hiring_companies?.map((c, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">{c}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* S6: Recruiter Verdict Rating Card */}
                      {result.recruiter_verdict_model && (
                        <div className="space-y-2 border-t border-slate-100 pt-4">
                          <span className="text-small-label text-slate-400 font-bold uppercase tracking-wider block">6. Recruiter Verdict</span>
                          <div className="p-4 bg-slate-50/50 rounded-xl border border-[#ECECEC] text-xs font-semibold space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex text-amber-400">
                                {Array.from({ length: 5 }).map((_, sIdx) => (
                                  <Star
                                    key={sIdx}
                                    size={14}
                                    fill={sIdx < result.recruiter_verdict_model!.star_rating ? "currentColor" : "none"}
                                    className="stroke-amber-400"
                                  />
                                ))}
                              </div>
                              <span className="text-slate-900 font-bold">{result.recruiter_verdict_model.rating_label}</span>
                            </div>
                            <p className="text-slate-500 font-normal leading-relaxed border-t border-slate-200/50 pt-2">
                              {result.recruiter_verdict_model.explanation}
                            </p>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                </motion.div>
              )}

              {/* Strengths & Weaknesses Grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">

                {/* Strengths */}
                <div className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal">
                  <h3 className="text-card-title font-bold text-slate-900 border-b border-[#ECECEC] pb-4 mb-6 flex items-center gap-3">
                    <CheckCircle2 className="text-green-500" size={22} />
                    Strengths
                  </h3>
                  <ul className="space-y-4">
                    {result.strengths?.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs text-slate-600 leading-relaxed font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-2"></span>
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal">
                  <h3 className="text-card-title font-bold text-slate-900 border-b border-[#ECECEC] pb-4 mb-6 flex items-center gap-3">
                    <AlertTriangle className="text-orange-500" size={22} />
                    Gaps & Areas of Improvement
                  </h3>
                  <ul className="space-y-4">
                    {result.weaknesses?.map((weak, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs text-slate-600 leading-relaxed font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-2"></span>
                        {weak}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Actionable recommendations list */}
              <div className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-6 text-left">
                <h3 className="text-card-title font-bold text-slate-900 pb-3 border-b border-[#ECECEC] flex items-center gap-3">
                  <ListTodo size={22} className="text-blue-650" />
                  Actionable Optimization Steps
                </h3>
                <ul className="space-y-4 pt-2">
                  {result.improvement_plan?.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3.5 text-xs text-slate-600 leading-relaxed font-semibold">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="mt-0.5">{rec}</p>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}
        </div>

        {/* NexPrep AI Roadmap Section */}
        <div className="mt-16 border-t border-[#ECECEC] pt-12 pb-8 text-left">
          <div className="max-w-3xl">
            <h2 className="text-section-title font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>NexPrep AI Roadmap</span>
            </h2>
            <p className="text-desc text-slate-500 mt-2 leading-relaxed font-semibold">
              Discover the engineering timeline and upcoming features designed to make NexPrep the ultimate intelligent hiring and evaluation assistant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

            {/* Version 1.0 */}
            <div className="bg-white p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                    Version 1.0
                  </span>
                </div>
                <ul className="space-y-2.5 mt-4">
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-655">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Resume Intelligence
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-655">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    JD Matching
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-655">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Career Suggestions
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-655">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Resume Mock Interview
                  </li>
                </ul>
              </div>
            </div>

            {/* Version 2.0 */}
            <div className="bg-white p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-blue-750 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                    Version 2.0 · Coming Soon
                  </span>
                </div>
                <ul className="space-y-2.5 mt-4">
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Voice Interview
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Speech Analysis
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Confidence Detection
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    AI Conversation
                  </li>
                </ul>
              </div>
            </div>

            {/* Version 3.0 */}
            <div className="bg-white p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                    Version 3.0 · Coming Soon
                  </span>
                </div>
                <ul className="space-y-2.5 mt-4">
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Camera Proctoring
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Face Detection
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Eye Tracking
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Cheating Detection
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default ResumeAnalyzer;
