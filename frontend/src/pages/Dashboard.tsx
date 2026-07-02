import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { 
  FileText, Code, Users, CheckCircle2, AlertCircle, Sparkles, 
  ArrowUpRight, Lock, ChevronRight, Activity, Calendar
} from 'lucide-react';

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

interface DashboardStats {
  total_interviews: number;
  average_score: number;
  recent_activity: Array<{
    type: string;
    date: string;
    score: number;
  }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [resumeHistory, setResumeHistory] = useState<ResumeHistoryItem[]>([]);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, historyRes, practiceHistoryRes] = await Promise.all([
          api.get('/api/users/stats'),
          api.get('/api/resume/history'),
          api.get('/api/history')
        ]);
        setStats(statsRes.data);
        setResumeHistory(historyRes.data);
        setHistoryItems(practiceHistoryRes.data);
      } catch (err) {
        setError('Failed to load dashboard metrics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="spinner mb-4 animate-spin"></div>
          <p className="text-small-label text-slate-400 font-medium">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  const latestResume = resumeHistory[0] || null;
  const latestATS = latestResume ? latestResume.ats_score : 0;
  const latestReadiness = latestResume ? latestResume.interview_readiness : 0;
  const missingSkillsCount = latestResume ? latestResume.missing_skills.length : 0;
  
  // Gamification Metrics
  const totalInterviews = stats?.total_interviews || 0;
  const practiceStreak = totalInterviews > 0 ? 3 : 0;
  const userXP = totalInterviews * 150 + (latestATS > 80 ? 250 : 100);
  const userLevel = Math.floor(userXP / 400) + 1;
  const xpProgress = (userXP % 400) / 4; // Percent toward next level

  // Visual Journey states
  const stepUpload = latestResume !== null;
  const stepRAG = latestResume !== null;
  const stepATS = latestATS > 0;
  const stepInterview = totalInterviews > 0;
  const stepTechnical = stats?.recent_activity?.some(a => a.type.toLowerCase().includes('technical')) || false;

  // Group history items by topic
  const getTopicStats = (topicName: string, type: 'technical' | 'hr') => {
    const matching = historyItems.filter(item => 
      item.interview_type === type && 
      item.topic.toLowerCase() === topicName.toLowerCase()
    );
    if (matching.length === 0) return { count: 0, avgScore: 0 };
    const sum = matching.reduce((acc, curr) => acc + curr.score, 0);
    return {
      count: matching.length,
      avgScore: Math.round((sum / matching.length) * 10) / 10
    };
  };

  const techTopicsList = ['Python', 'Java', 'JavaScript', 'React', 'FastAPI', 'SQL'];
  const hrTopicsList = ['Tell me about yourself', 'Why should we hire you?', 'Strengths?', 'Weaknesses?', 'Career Goals?'];

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-600">
      <Navbar />
      
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 sm:px-8 py-[72px] space-y-10">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-[#ECECEC]">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100/50 px-3 py-1 rounded-full uppercase tracking-wider">
                NexPrep Workspace
              </span>
              <span className="text-small-label text-slate-400 font-medium">Level {userLevel} ({userXP} XP)</span>
            </div>
            <h1 className="text-page-title font-bold text-slate-900 tracking-tight leading-none">
              Welcome, {user?.username || 'Candidate'}
            </h1>
          </div>

          {/* Minimalist XP tracker */}
          <div className="w-full md:w-64 space-y-1.5 text-left">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>XP Level Progress</span>
              <span>{Math.round(xpProgress)}%</span>
            </div>
            <div className="w-full bg-slate-200/40 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Primary Stats Summary Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white h-[160px] p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal text-left flex flex-col justify-between">
            <span className="text-small-label text-slate-450 uppercase tracking-wider block font-medium">ATS Score</span>
            <span className="text-metric-ats font-bold text-slate-900 block mt-1.5">{latestATS > 0 ? `${latestATS}%` : 'N/A'}</span>
          </div>
          <div className="bg-white h-[160px] p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal text-left flex flex-col justify-between">
            <span className="text-small-label text-slate-455 uppercase tracking-wider block font-medium">Readiness</span>
            <span className="text-metric-readiness font-bold text-slate-900 block mt-1.5">{latestReadiness > 0 ? `${latestReadiness}%` : 'N/A'}</span>
          </div>
          <div className="bg-white h-[160px] p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal text-left flex flex-col justify-between">
            <span className="text-small-label text-slate-455 uppercase tracking-wider block font-medium">Streak</span>
            <span className="text-metric-streak font-bold text-slate-900 block mt-1.5">{practiceStreak} Days</span>
          </div>
          <div className="bg-white h-[160px] p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal text-left flex flex-col justify-between">
            <span className="text-small-label text-slate-455 uppercase tracking-wider block font-medium">Mock Sessions</span>
            <span className="text-metric-sessions font-bold text-slate-900 block mt-1.5">{totalInterviews} Stats</span>
          </div>
        </div>

        {/* Asymmetrical Prominent Upload CTA Card */}
        <div className="bg-white border border-[#ECECEC] rounded-[20px] p-6 shadow-minimal flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left">
          <div className="space-y-1.5 max-w-3xl">
            <h2 className="text-card-title font-bold text-slate-900 tracking-tight">
              Ready to verify your profile compatibility?
            </h2>
            <p className="text-desc text-slate-500 leading-relaxed">
              Upload your resume to retrieve RAG-based interview questions, audit formatting keywords, and receive a customized 30-day learning roadmap.
            </p>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <Link
              to="/resume"
              className="w-full md:w-auto btn-primary flex items-center justify-center gap-2 px-6 py-3.5 text-[15px] font-semibold rounded-xl"
            >
              🚀 Analyze New Resume
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl text-red-655 text-xs font-semibold flex items-center gap-2 max-w-xl">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Content Layout split column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Timeline and Modules */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Journey Timeline */}
            <div className="bg-white p-5 sm:p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal text-left space-y-6">
              <h3 className="text-card-title font-bold text-slate-900 tracking-tight pb-2.5 border-b border-[#ECECEC] flex items-center gap-2">
                <Activity size={18} className="text-blue-600" />
                Preparation Journey
              </h3>
              
              <div className="relative border-l border-slate-100 ml-3.5 pl-6 space-y-6">
                {[
                  { label: "Resume Upload", status: stepUpload ? "completed" : "current", desc: "Upload your resume PDF to begin semantic indexing.", path: "/resume" },
                  { label: "ATS Compatibility Scan", status: stepRAG ? (stepATS ? "completed" : "current") : "locked", desc: "Calculate keyword compatibility against Stripe JDs.", path: "/resume" },
                  { label: "Mock AI Interview Session", status: stepATS ? (stepInterview ? "completed" : "current") : "locked", desc: "Practice 20-25 questions generated from RAG chunks.", path: "/resume" },
                  { label: "Practice Arenas (Technical / HR)", status: stepInterview ? (stepTechnical ? "completed" : "current") : "locked", desc: "Test coding languages and STAR behavioral scenarios.", path: "/technical" }
                ].map((step, idx) => (
                  <div key={idx} className="relative group">
                    {/* Node marker */}
                    <div className={`absolute -left-[33px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center border shadow-sm transition-all ${
                      step.status === 'completed' ? 'bg-green-50 border-green-200 text-green-655' :
                      step.status === 'current' ? 'bg-blue-50 border-blue-200 text-blue-600 animate-pulse' :
                      'bg-slate-50 border-slate-100 text-slate-400'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle2 size={11} />
                      ) : step.status === 'current' ? (
                        <Sparkles size={11} />
                      ) : (
                        <Lock size={9} />
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-small-label font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {step.label}
                      </h4>
                      <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                        {step.desc}
                      </p>
                      {step.status !== 'locked' && (
                        <Link to={step.path} className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 pt-0.5 w-fit">
                          Execute Step <ChevronRight size={11} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modules Grid */}
            <div className="bg-white p-5 sm:p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal text-left space-y-5">
              <h3 className="text-card-title font-bold text-slate-900 tracking-tight pb-2.5 border-b border-[#ECECEC] flex items-center gap-2">
                <Code size={18} className="text-blue-600" />
                Suite Modules
              </h3>
              <div className="divide-y divide-[#ECECEC]">
                {[
                  { title: "Technical Coding Arena", desc: "Practice frameworks and languages with immediate grading audits.", path: "/technical", icon: <Code size={14} /> },
                  { title: "HR Behavioral Practice", desc: "Train situational communication skills using the STAR structure.", path: "/hr", icon: <Users size={14} /> },
                  { title: "Resume Intelligence Scorecard", desc: "Check formatting parameters, missing keywords, and version deltas.", path: "/resume", icon: <FileText size={14} /> }
                ].map((mod, idx) => (
                  <div key={idx} className="flex justify-between items-center py-4 group hover:px-1 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50/60 text-blue-655 flex items-center justify-center border border-blue-100/30 shrink-0">
                        {mod.icon}
                      </div>
                      <div>
                        <span className="text-small-label font-bold text-slate-850 group-hover:text-blue-600 transition-colors block">{mod.title}</span>
                        <span className="text-xs text-slate-400 font-semibold block mt-0.5">{mod.desc}</span>
                      </div>
                    </div>
                    <Link to={mod.path} className="w-7 h-7 rounded-lg hover:bg-slate-50 border border-transparent hover:border-[#ECECEC] flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
                      {/* Minimalist Tech Practice Card */}
            <div className="bg-white h-[160px] p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal text-left flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h4 className="text-card-title font-bold text-slate-900 leading-tight">Technical Practice</h4>
                  <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                    Train coding patterns, algorithms, and system designs.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30 shrink-0">
                  <Code size={14} />
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-[11px] font-medium text-slate-400">32% Completed</span>
                <Link to="/technical" className="text-xs font-bold text-blue-650 hover:underline">
                  Arena →
                </Link>
              </div>
            </div>

            {/* AI Coach Suggestion Widget */}
            <div className="bg-white h-[160px] p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal text-left flex flex-col justify-between">
              <div className="flex items-center gap-2 pb-2 border-b border-[#ECECEC]">
                <div className="w-6 h-6 rounded-lg bg-blue-50/60 text-blue-650 flex items-center justify-center border border-blue-100/30 shrink-0">
                  <Sparkles size={11} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">AI Suggestions</span>
              </div>

              <div className="text-xs font-semibold leading-relaxed text-slate-650 py-1.5 line-clamp-2">
                {missingSkillsCount > 0 ? (
                  <p>Missing keyword "{latestResume?.missing_skills[0]}" which decreases your ATS score compatibility.</p>
                ) : (
                  <p>Practice Python data structures today to raise your Technical rating to level 4.</p>
                )}
              </div>

              <div className="border-t border-[#ECECEC] pt-2 flex justify-end">
                <Link to="/resume" className="text-[11px] font-bold text-blue-650 hover:underline">
                  Scorecard →
                </Link>
              </div>
            </div>

            {/* Consistency Calendar Widget */}
            <div className="bg-white h-[160px] p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal text-left flex flex-col justify-between">
              <div className="flex justify-between items-center pb-2 border-b border-[#ECECEC]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  Consistency
                </span>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-[#ECECEC] px-2 py-0.5 rounded">Streak: {practiceStreak}d</span>
              </div>
              
              <div className="flex gap-1 overflow-hidden py-1 justify-between">
                {Array.from({ length: 11 }).map((_, idx) => {
                  const isActive = idx % 3 === 0 || idx % 7 === 1;
                  return (
                    <div
                      key={idx}
                      className={`w-[18px] h-[18px] rounded ${
                        isActive ? 'bg-blue-600/90' : 'bg-slate-100'
                      } border border-slate-200/30 shrink-0`}
                    />
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Charts & Recent Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-8 border-t border-[#ECECEC]">
          
          {/* Topic Proficiency Matrix */}
          <div className="lg:col-span-8 space-y-6 text-left animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-[#ECECEC]">
              <h3 className="text-card-title font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                Topic Proficiency Matrix
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Based on recent arena practices</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Technical Arena Proficiency */}
              <div className="bg-white p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Code size={14} className="text-blue-600" />
                    Technical Coding
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">6 Core Skills</span>
                </div>

                <div className="space-y-4">
                  {techTopicsList.map(t => {
                    const { count, avgScore } = getTopicStats(t, 'technical');
                    let statusLabel = "Not Started";
                    let badgeColor = "bg-slate-50 text-slate-400 border-slate-200/50";
                    if (count > 0) {
                      if (avgScore >= 8.5) {
                        statusLabel = "Excellent";
                        badgeColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                      } else if (avgScore >= 7.0) {
                        statusLabel = "Fluent";
                        badgeColor = "bg-blue-50 text-blue-600 border-blue-100";
                      } else {
                        statusLabel = "Needs Work";
                        badgeColor = "bg-amber-50 text-amber-600 border-amber-100";
                      }
                    }

                    return (
                      <div key={t} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">{t}</span>
                          <div className="flex items-center gap-2">
                            {count > 0 && (
                              <span className="text-[10px] text-slate-400 font-bold">
                                {count} Qs • Avg: {avgScore}/10
                              </span>
                            )}
                            <span className={`text-[9px] font-bold uppercase border px-2 py-0.5 rounded-md ${badgeColor}`}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              statusLabel === 'Excellent' ? 'bg-emerald-500' :
                              statusLabel === 'Fluent' ? 'bg-blue-500' :
                              statusLabel === 'Needs Work' ? 'bg-amber-500' :
                              'bg-slate-200'
                            }`}
                            style={{ width: count > 0 ? `${avgScore * 10}%` : '0%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* HR Behavioral Arena Proficiency */}
              <div className="bg-white p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} className="text-blue-600" />
                    HR Behavioral
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">5 Core Prompts</span>
                </div>

                <div className="space-y-4">
                  {hrTopicsList.map(t => {
                    const { count, avgScore } = getTopicStats(t, 'hr');
                    let statusLabel = "Not Started";
                    let badgeColor = "bg-slate-50 text-slate-400 border-slate-200/50";
                    if (count > 0) {
                      if (avgScore >= 8.5) {
                        statusLabel = "Excellent";
                        badgeColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                      } else if (avgScore >= 7.0) {
                        statusLabel = "Fluent";
                        badgeColor = "bg-blue-50 text-blue-600 border-blue-100";
                      } else {
                        statusLabel = "Needs Work";
                        badgeColor = "bg-amber-50 text-amber-600 border-amber-100";
                      }
                    }

                    // Truncate display topic name for clean UX alignment
                    const displayTopic = t.length > 22 ? t.substring(0, 22) + '...' : t;

                    return (
                      <div key={t} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700" title={t}>{displayTopic}</span>
                          <div className="flex items-center gap-2">
                            {count > 0 && (
                              <span className="text-[10px] text-slate-400 font-bold">
                                {count} Qs • Avg: {avgScore}/10
                              </span>
                            )}
                            <span className={`text-[9px] font-bold uppercase border px-2 py-0.5 rounded-md ${badgeColor}`}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              statusLabel === 'Excellent' ? 'bg-emerald-500' :
                              statusLabel === 'Fluent' ? 'bg-blue-500' :
                              statusLabel === 'Needs Work' ? 'bg-amber-500' :
                              'bg-slate-200'
                            }`}
                            style={{ width: count > 0 ? `${avgScore * 10}%` : '0%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="lg:col-span-4 space-y-5 text-left">
            <h3 className="text-card-title font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              Recent Activity
            </h3>
            
            <div className="bg-white p-5 sm:p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal space-y-3">
              {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                stats.recent_activity.map((activity, idx) => (
                  <div key={idx} className="flex justify-between items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{activity.type} Assessment</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{activity.date}</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-650 bg-blue-50/50 border border-blue-100/50 px-2.5 py-0.5 rounded-lg">
                      {activity.type === 'Resume RAG' ? `Readiness: ${Math.round(activity.score * 10)}%` : `Score: ${activity.score}/10`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs font-medium py-3">No activity logged.</div>
              )}
            </div>
          </div>

        </div>

      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
