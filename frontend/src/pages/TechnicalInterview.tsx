import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { 
  Code, ArrowLeft, ArrowRight, Loader2, CheckCircle2, 
  AlertTriangle, AlertCircle, Compass, HelpCircle,
  Clock, Laptop, Layers, Hourglass
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const TECH_TOPICS = ['Python', 'Java', 'JavaScript', 'React', 'FastAPI', 'SQL'];

const TECH_META: Record<string, { logo: string; diff: string; qs: string; mins: string }> = {
  'Python': { logo: '🐍', diff: 'Intermediate', qs: '15 Questions', mins: '20 Minutes' },
  'Java': { logo: '☕', diff: 'Advanced', qs: '18 Questions', mins: '25 Minutes' },
  'JavaScript': { logo: '⚛️', diff: 'Intermediate', qs: '15 Questions', mins: '20 Minutes' },
  'React': { logo: '⚡', diff: 'Advanced', qs: '15 Questions', mins: '20 Minutes' },
  'FastAPI': { logo: '🚀', diff: 'Intermediate', qs: '12 Questions', mins: '15 Minutes' },
  'SQL': { logo: '🗄️', diff: 'Intermediate', qs: '15 Questions', mins: '15 Minutes' },
};



const TechnicalInterview: React.FC = () => {
  const [topic, setTopic] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<any>(null);
  const [, setLoadingStats] = useState(true);

  // New state variables for question count configuration
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedCount, setSelectedCount] = useState<number>(5);
  const [showConfigModal, setShowConfigModal] = useState<string | null>(null);

  // New batch evaluation states
  const [answersMap, setAnswersMap] = useState<Record<number, string>>({});
  const [batchResult, setBatchResult] = useState<any | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/interview/technical/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load tech stats', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const startInterview = async (selectedTopic: string, countVal: number) => {
    setTopic(selectedTopic);
    setLoadingQuestion(true);
    setError(null);
    setQuestion(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswer('');
    setShowConfigModal(null);
    setAnswersMap({});
    setBatchResult(null);
    setExpandedIndex(0);
    
    try {
      const res = await api.post('/api/interview/technical/start', { 
        topic: selectedTopic,
        count: countVal
      });
      const qList = res.data.questions || [];
      if (qList.length === 0) {
        throw new Error("No questions returned by the server.");
      }
      setQuestions(qList);
      setQuestion(qList[0]);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to fetch practice questions. Please try again.');
      setTopic(null);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !question || !topic) return;

    setError(null);

    // Save the current answer draft
    const updatedAnswers = { ...answersMap, [currentQuestionIndex]: answer };
    setAnswersMap(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      // Go to next question locally without evaluating
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setQuestion(questions[nextIdx]);
      setAnswer(updatedAnswers[nextIdx] || '');
    } else {
      // Last question completed! Call backend to batch-evaluate the answers
      setSubmittingAnswer(true);
      try {
        const payload = {
          topic,
          answers: questions.map((q, idx) => ({
            question: q,
            user_answer: updatedAnswers[idx] || ''
          }))
        };
        const res = await api.post('/api/interview/technical/submit-batch', payload);
        setBatchResult(res.data);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.detail || 'Failed to evaluate answers. Please try again.');
      } finally {
        setSubmittingAnswer(false);
      }
    }
  };

  const handleReset = () => {
    setTopic(null);
    setQuestion(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswer('');
    setError(null);
    setShowConfigModal(null);
    setAnswersMap({});
    setBatchResult(null);
    setExpandedIndex(0);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-600">
      <SEO title="Technical Interview Practice | NexPrep AI" description="Practice technical coding and system design questions." noindex={true} />
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-6">
        
        {/* Navigation & Actions */}
        <div className="flex justify-between items-center pb-4 border-b border-[#ECECEC] mb-5">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-small-label font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          {topic && (
            <button aria-label="Action button"
              onClick={handleReset}
              className="text-small-label font-bold text-blue-600 hover:underline"
            >
              Choose different topic
            </button>
          )}
        </div>

        {/* Title & Introduction Block */}
        <div className="space-y-3 max-w-3xl text-left mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
            <Code size={22} />
          </div>
          <h1 className="text-page-title font-bold text-slate-900 tracking-tight">
            Technical Practice Arena
          </h1>
          <p className="text-body-custom text-slate-500 leading-relaxed">
            Test and grow your framework or language fluency. Answer tailored, conceptual engineering questions and review ideal reference answers compiled by AI.
          </p>
        </div>

        {error && (
          <div className="p-5 bg-red-50/50 border border-red-100 rounded-xl text-red-655 text-small-label font-semibold flex items-center gap-3 max-w-2xl">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Topic Selection Overview */}
        {!topic && (
          <div className="space-y-16">
            
            {/* Summary statistics cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {[
                { label: "Available Techs", val: stats?.stats?.available_technologies || 6, icon: <Laptop size={16} /> },
                { label: "Total Questions", val: `${stats?.stats?.total_questions || 825}+`, icon: <HelpCircle size={16} /> },
                { label: "Difficulty Levels", val: "Easy • Med • Hard", icon: <Layers size={16} /> },
                { label: "Avg Practice Time", val: stats?.stats?.average_practice_time || "20 Mins", icon: <Clock size={16} /> },
                { label: "Est. Completion", val: stats?.stats?.estimated_completion_time || "12 Hours", icon: <Hourglass size={16} /> }
              ].map((item, idx) => (
                <div key={idx} className="p-8 bg-white border border-[#ECECEC] rounded-[20px] shadow-minimal text-left space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
                    {item.icon}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
                    <span className="text-card-title font-bold text-slate-800 mt-1 block">{item.val}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Topic Selection Grid */}
            <div className="space-y-6 text-left">
              <h2 className="text-small-label font-bold text-slate-400 uppercase tracking-widest block">Choose a technology to start</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {TECH_TOPICS.map((t) => {
                  const meta = TECH_META[t];
                  const dynamicQuestions = stats?.topics?.[t]?.questions || (t === 'Python' ? 120 : t === 'Java' ? 140 : t === 'JavaScript' ? 150 : t === 'React' ? 165 : t === 'FastAPI' ? 115 : 130);
                  return (
                    <div
                      key={t}
                      onClick={() => setShowConfigModal(t)}
                      className="cursor-pointer p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] bg-white hover:border-slate-350 shadow-minimal hover:shadow-minimal-hover transition-all flex flex-col justify-between min-h-[260px] relative group"
                    >
                      {/* Header: Logo & Tag */}
                      <div className="flex justify-between items-center">
                        <span className="text-3xl filter saturate-100 group-hover:scale-110 transition-transform">{meta.logo}</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100/50 px-2.5 py-0.5 rounded-lg uppercase tracking-wider block">
                          AI Personalized
                        </span>
                      </div>

                      {/* Middle: Title & Meta tags */}
                      <div className="space-y-3 mt-6">
                        <h3 className="text-card-title font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {t}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded">
                            {dynamicQuestions} Qs
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded">
                            Easy • Med • Hard
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded">
                            {meta.mins}
                          </span>
                        </div>
                      </div>

                      {/* Footer: Start Button */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                        <span>Start Practice →</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Practice Configuration Overlay / Modal */}
            {showConfigModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-xl max-w-sm w-full mx-4 space-y-6 text-center">
                  <div className="text-3xl">{TECH_META[showConfigModal]?.logo}</div>
                  <div>
                    <h3 className="text-card-title font-bold text-slate-900">
                      Configure {showConfigModal} Practice
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      Select how many questions you'd like to practice in this session.
                    </p>
                  </div>

                  {/* Range Options */}
                  <div className="grid grid-cols-4 gap-3">
                    {[5, 10, 15, 20].map((num) => (
                      <button aria-label="Action button"
                        key={num}
                        type="button"
                        onClick={() => setSelectedCount(num)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                          selectedCount === num
                            ? "border-blue-600 bg-blue-50/50 text-blue-600 shadow-sm"
                            : "border-[#ECECEC] hover:border-slate-350 text-slate-655"
                        }`}
                      >
                        {num} Qs
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button aria-label="Action button"
                      type="button"
                      onClick={() => setShowConfigModal(null)}
                      className="flex-1 btn-glass py-3.5 text-xs font-bold text-slate-700 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button aria-label="Action button"
                      type="button"
                      onClick={() => startInterview(showConfigModal, selectedCount)}
                      className="flex-1 btn-primary py-3.5 text-xs font-bold rounded-xl"
                    >
                      Start Now
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Question formulation loader */}
        {loadingQuestion && (
          <div className="bg-white p-10 md:p-14 rounded-[20px] border border-[#ECECEC] shadow-minimal max-w-xl mx-auto text-center flex flex-col items-center justify-center gap-4 animate-pulse-subtle">
            <div className="spinner animate-spin"></div>
            <h3 className="text-small-label font-bold text-slate-900">Formulating Question</h3>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
              NexPrep AI is selecting a challenging technical concept in {topic}...
            </p>
          </div>
        )}

        {/* Question and Answer Panel */}
        {topic && question && !batchResult && !loadingQuestion && (
          <div className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal max-w-3xl mx-auto space-y-8 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-small-label font-bold text-slate-400 uppercase tracking-wider">
                Topic: {topic} ({currentQuestionIndex + 1} of {questions.length})
              </span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                Technical Round
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="text-small-label font-bold text-slate-400 uppercase tracking-wider">Question</h2>
              <p className="text-body-custom font-bold text-slate-900 leading-relaxed bg-slate-50/50 p-6 rounded-xl border border-[#ECECEC]">
                {question}
              </p>
            </div>

            <form aria-label="Form" onSubmit={submitAnswer} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-small-label font-bold text-slate-400 uppercase tracking-wider">
                  Your Answer
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Explain your approach, list technical specifics, and supply key patterns..."
                  required
                  rows={8}
                  disabled={submittingAnswer}
                  className="w-full rounded-[20px] border border-[#ECECEC] px-5 py-4 text-small-label leading-relaxed font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:bg-slate-50"
                ></textarea>
                <div className="text-right text-[10px] text-slate-400 mt-1 font-bold">
                  {answer.length} characters (Min 50 characters recommended)
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                {currentQuestionIndex > 0 ? (
                  <button aria-label="Action button"
                    type="button"
                    onClick={() => {
                      const updated = { ...answersMap, [currentQuestionIndex]: answer };
                      setAnswersMap(updated);
                      const prevIdx = currentQuestionIndex - 1;
                      setCurrentQuestionIndex(prevIdx);
                      setQuestion(questions[prevIdx]);
                      setAnswer(updated[prevIdx] || '');
                    }}
                    className="btn-glass flex items-center gap-2 px-6 py-3.5 text-xs font-bold uppercase rounded-xl transition-all"
                  >
                    <ArrowLeft size={14} />
                    Previous Question
                  </button>
                ) : (
                  <div></div>
                )}

                <button aria-label="Action button"
                  type="submit"
                  disabled={submittingAnswer || answer.trim().length < 5}
                  className="btn-primary flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  {submittingAnswer ? (
                    <>
                      <Loader2 size={13} className="animate-spin shrink-0" />
                      Evaluating Session...
                    </>
                  ) : currentQuestionIndex < questions.length - 1 ? (
                    <>
                      Next Question
                      <ArrowRight size={14} />
                    </>
                  ) : (
                    <>
                      Submit Practice Session
                      <CheckCircle2 size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/*        {/* Batch Evaluation Output Panel */}
        {batchResult && (
          <div className="space-y-10 animate-fade-in text-left">
            {/* Top Score Indicator */}
            <div className="bg-white p-8 rounded-[20px] border border-[#ECECEC] shadow-minimal flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2">
                <span className="text-small-label font-bold text-slate-400 uppercase tracking-wider">Evaluation Result</span>
                <h3 className="text-card-title font-bold text-slate-900 mt-1">
                  Topic: {topic} ({questions.length} Questions)
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xl">
                  {batchResult.general_feedback}
                </p>
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-small-label font-bold text-slate-400 uppercase tracking-wider block">Overall Score</span>
                  <span className="text-page-title font-bold text-blue-650 block mt-1">
                    {batchResult.overall_score}/10
                  </span>
                </div>
                <div className="w-1.5 h-12 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ height: `${batchResult.overall_score * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Individual question evaluations */}
            <div className="space-y-6">
              <h3 className="text-small-label font-bold text-slate-400 uppercase tracking-widest block pl-1">Question Reviews</h3>
              {batchResult.evaluations.map((evalItem: any, idx: number) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <div key={idx} className="bg-white border border-[#ECECEC] rounded-[20px] shadow-minimal overflow-hidden transition-all duration-300">
                    {/* Collapsible Header */}
                    <div 
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="flex justify-between items-center p-6 cursor-pointer bg-slate-50/30 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <div className="text-left space-y-1.5 max-w-[75%]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Question {idx + 1} of {questions.length}</span>
                        <h4 className="text-xs font-bold text-slate-800 leading-relaxed">{evalItem.question}</h4>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-100/50 px-3 py-1 rounded-xl">
                          {evalItem.overall_score}/10
                        </span>
                        <span className="text-slate-400 text-xs font-bold w-16 text-right select-none">{isExpanded ? 'Collapse ▲' : 'Expand ▼'}</span>
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    {isExpanded && (
                      <div className="p-8 space-y-8 text-left animate-fade-in border-t border-slate-50">
                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Strengths */}
                          <div className="space-y-4">
                            <h5 className="font-bold text-slate-800 text-xs flex items-center gap-2 border-b border-[#ECECEC] pb-2">
                              <CheckCircle2 size={16} className="text-green-500" />
                              Strengths
                            </h5>
                            <ul className="space-y-3">
                              {evalItem.strengths.map((str: string, sIdx: number) => (
                                <li key={sIdx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1.5"></span>
                                  {str}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Weaknesses */}
                          <div className="space-y-4">
                            <h5 className="font-bold text-slate-800 text-xs flex items-center gap-2 border-b border-[#ECECEC] pb-2">
                              <AlertTriangle size={16} className="text-orange-500" />
                              Improvement Areas
                            </h5>
                            <ul className="space-y-3">
                              {evalItem.weaknesses.map((weak: string, wIdx: number) => (
                                <li key={wIdx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5"></span>
                                  {weak}
                                </li>
                              ))}
                            </ul>
                            {evalItem.mistakes && evalItem.mistakes.length > 0 && (
                              <div className="pt-4 border-t border-[#ECECEC] mt-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Key Mistakes</span>
                                <ul className="space-y-1.5">
                                  {evalItem.mistakes.map((mis: string, mIdx: number) => (
                                    <li key={mIdx} className="text-xs font-semibold text-red-655 flex items-start gap-2 leading-relaxed">
                                      <span className="shrink-0">•</span>
                                      {mis}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Suggestions */}
                        <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
                          <h5 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                            <Compass size={16} className="text-blue-600" />
                            Suggestions
                          </h5>
                          <ul className="space-y-2">
                            {evalItem.suggestions.map((sug: string, sugIdx: number) => (
                              <li key={sugIdx} className="flex items-start gap-2 text-xs text-slate-655 leading-relaxed font-semibold">
                                <span className="w-1 h-1 rounded-full bg-blue-650 shrink-0 mt-2"></span>
                                {sug}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Answers Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {evalItem.better_answer && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Better Version (Rephrased Answer)</span>
                              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-[#ECECEC] italic">
                                "{evalItem.better_answer}"
                              </p>
                            </div>
                          )}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Perfect Answer (Ideal Reference)</span>
                            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-[#ECECEC] whitespace-pre-line font-mono">
                              {evalItem.best_answer}
                            </p>
                          </div>
                        </div>

                        {/* Tip Card */}
                        <div className="bg-blue-50/20 border border-blue-100/40 p-5 rounded-xl flex gap-3">
                          <HelpCircle className="text-blue-600 shrink-0 mt-0.5" size={16} />
                          <div>
                            <h6 className="font-bold text-slate-850 text-[10px] uppercase tracking-wider">Interviewer Tip</h6>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{evalItem.interview_tip}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Back to Arena Button */}
            <div className="flex justify-center pt-6">
              <button aria-label="Action button"
                type="button"
                onClick={handleReset}
                className="btn-primary flex items-center gap-1.5 px-8 py-4 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-[1.02]"
              >
                Back to Arena
                <CheckCircle2 size={14} />
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TechnicalInterview;
