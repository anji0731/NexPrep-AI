import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { History, Eye, Trash2, X, ArrowLeft, Loader2, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, Compass, Bookmark, HelpCircle, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

interface InterviewItem {
  id: number;
  interview_type: string;
  topic: string;
  question: string;
  user_answer: string;
  score: number;
  date: string;
  evaluation: {
    overall_score: number;
    strengths: string[];
    weaknesses: string[];
    mistakes: string[];
    suggestions: string[];
    best_answer: string;
    better_answer?: string;
    interview_tip: string;
    next_step: string;
    communication_score?: number;
    confidence_score?: number;
    professionalism_score?: number;
    grammar_score?: number;
  };
}

const InterviewHistory: React.FC = () => {
  const [historyList, setHistoryList] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InterviewItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/history');
      setHistoryList(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch interview history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this interview record?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/history/${id}`);
      setHistoryList(historyList.filter(item => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete history item.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter List
  const filteredList = historyList.filter(item => {
    const matchesSearch = item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || item.interview_type.toLowerCase() === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="spinner animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-600">
      <SEO title="Interview History | NexPrep AI" description="View your past interview sessions and analytics." noindex={true} />
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-6">
        
        {/* Navigation & Actions */}
        <div className="flex justify-between items-center pb-4 border-b border-[#ECECEC] mb-5">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-small-label font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>

        {/* Title & Introduction Block */}
        <div className="space-y-3 max-w-3xl text-left mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center border border-blue-100/30">
            <History size={22} />
          </div>
          <h1 className="text-page-title font-bold text-slate-900 tracking-tight">
            Interview History & Analytics
          </h1>
          <p className="text-body-custom text-slate-500 leading-relaxed">
            Review past mock interview reports, check technical feedback lists, and search through questions to refine your preparation patterns.
          </p>
        </div>

        {error && (
          <div className="p-5 bg-red-50/50 border border-red-100 rounded-xl text-red-655 text-small-label font-semibold flex items-center gap-3 max-w-2xl">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters and search row */}
        {historyList.length > 0 && (
          <div className="bg-white p-6 rounded-[20px] border border-[#ECECEC] shadow-minimal flex flex-col sm:flex-row items-center gap-4 text-left">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search topics or question keywords..."
                className="pl-10 w-full rounded-[12px] border border-[#ECECEC] px-3 py-3 text-xs focus:outline-none focus:border-blue-500 transition-all font-mono"
              />
            </div>

            {/* Filter select */}
            <div className="relative w-full sm:w-56">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Filter size={15} />
              </span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-10 w-full rounded-[12px] border border-[#ECECEC] px-3 py-3 text-xs focus:outline-none appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Modules</option>
                <option value="technical">Technical Practice</option>
                <option value="hr">HR Practice</option>
              </select>
            </div>
          </div>
        )}

        {/* Chronological Timeline or Empty State */}
        {filteredList.length === 0 ? (
          <div className="bg-white p-10 md:p-14 rounded-[20px] border border-[#ECECEC] shadow-minimal text-center max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100/50">
              <History size={26} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-card-title font-bold text-slate-900">No mock sessions recorded</h3>
              <p className="text-xs text-slate-450 font-semibold leading-relaxed max-w-xs mx-auto">
                Practicing mock interviews helps boost scores and confidence. Launch a technical or HR interview session!
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Link to="/technical" className="btn-glass px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-800 rounded-xl">
                Practice Technical
              </Link>
              <Link to="/hr" className="btn-glass px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 rounded-xl">
                Practice HR
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative border-l border-slate-200/50 ml-4 pl-8 space-y-8 text-left">
            {filteredList.map((item) => (
              <div key={item.id} className="relative group">
                
                {/* Timeline node dot */}
                <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                </div>

                {/* Timeline Card */}
                <div className="bg-white p-8 rounded-[20px] border border-[#ECECEC] shadow-minimal group-hover:border-slate-350 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase ${
                        item.interview_type === 'technical'
                          ? 'bg-blue-50 text-blue-650 border border-blue-100'
                          : 'bg-green-50 text-green-700 border border-green-100'
                      }`}>
                        {item.interview_type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(item.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-small-label group-hover:text-blue-600 transition-colors">
                      {item.topic}
                    </h3>
                    
                    <p className="text-xs text-slate-450 leading-relaxed font-semibold max-w-xl line-clamp-1 italic">
                      "{item.question}"
                    </p>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Score Rating</span>
                      <span className="text-small-label font-bold text-slate-900 mt-1 block">{item.score}/10</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button aria-label="Action button"
                        onClick={() => setSelectedItem(item)}
                        className="btn-glass inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-800 rounded-xl"
                      >
                        <Eye size={13} />
                        View Report
                      </button>
                      <button aria-label="Action button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="btn-glass inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-red-600 rounded-xl"
                      >
                        {deletingId === item.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

        {/* View Details Modal Overlay */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
            <div className="bg-white rounded-[20px] border border-[#ECECEC] max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-fade-in relative space-y-8 text-left">
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-[#ECECEC] px-8 py-5 flex justify-between items-center z-10">
                <div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    selectedItem.interview_type === 'technical'
                      ? 'bg-blue-50 text-blue-650 border border-blue-100'
                      : 'bg-green-50 text-green-700 border border-green-100'
                  }`}>
                    {selectedItem.interview_type} round
                  </span>
                  <h3 className="text-small-label font-bold text-slate-950 mt-2">
                    Topic: {selectedItem.topic}
                  </h3>
                </div>
                <button aria-label="Action button"
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-655 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-8 pb-8 space-y-8">
                
                {/* Question & Answer Card */}
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question</span>
                    <p className="text-xs font-bold text-slate-800 bg-slate-50 p-5 rounded-xl border border-[#ECECEC] mt-2 leading-relaxed">
                      {selectedItem.question}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Answer</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-5 rounded-xl border border-[#ECECEC] mt-2 leading-relaxed whitespace-pre-wrap font-mono">
                      {selectedItem.user_answer}
                    </p>
                  </div>
                </div>

                {/* Score indicators */}
                <div className="border-t border-slate-100 pt-6">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Scores</span>
                  {selectedItem.interview_type === 'hr' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-[#ECECEC] text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Overall</span>
                        <span className="text-small-label font-bold text-blue-650 block mt-1">{selectedItem.score}/10</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-[#ECECEC] text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Communication</span>
                        <span className="text-small-label font-bold text-slate-700 block mt-1">{selectedItem.evaluation.communication_score || 8}/10</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-[#ECECEC] text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Confidence</span>
                        <span className="text-small-label font-bold text-slate-700 block mt-1">{selectedItem.evaluation.confidence_score || 8}/10</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-[#ECECEC] text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Professional</span>
                        <span className="text-small-label font-bold text-slate-700 block mt-1">{selectedItem.evaluation.professionalism_score || 8}/10</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-[#ECECEC] text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Grammar</span>
                        <span className="text-small-label font-bold text-slate-700 block mt-1">{selectedItem.evaluation.grammar_score || 8}/10</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-5 rounded-xl border border-[#ECECEC] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500">Overall AI Score Rating</span>
                        <span className="text-[9px] text-slate-400 block mt-1">Based on engineering conceptual accuracy</span>
                      </div>
                      <span className="text-small-label font-bold text-blue-600">{selectedItem.score}/10</span>
                    </div>
                  )}
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                  <div>
                    <h4 className="text-small-label font-bold text-slate-900 flex items-center gap-2 mb-3">
                      <CheckCircle2 size={18} className="text-green-500" />
                      Strengths
                    </h4>
                    <ul className="space-y-3">
                      {selectedItem.evaluation.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-650 leading-relaxed font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1.5"></span>
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-small-label font-bold text-slate-900 flex items-center gap-2 mb-3">
                      <AlertTriangle size={18} className="text-orange-500" />
                      Areas of Improvement
                    </h4>
                    <ul className="space-y-3">
                      {selectedItem.evaluation.weaknesses.map((weak, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-655 leading-relaxed font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5"></span>
                          {weak}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-small-label font-bold text-slate-900 flex items-center gap-2 mb-3">
                    <Compass size={18} className="text-blue-650" />
                    Improvement Suggestions
                  </h4>
                  <ul className="space-y-3">
                    {selectedItem.evaluation.suggestions.map((sug, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-650 leading-relaxed font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
                        {sug}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Answer comparisons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                  {selectedItem.evaluation.better_answer && (
                    <div className="space-y-2">
                      <h4 className="text-small-label font-bold text-slate-900 flex items-center gap-2">
                        <Bookmark size={18} className="text-blue-600" />
                        Rephrased Answer
                      </h4>
                      <p className="text-xs text-slate-650 leading-relaxed bg-slate-50 p-4 rounded-xl border border-[#ECECEC] italic font-semibold">
                        "{selectedItem.evaluation.better_answer}"
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-small-label font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles size={18} className="text-blue-600" />
                      Perfect Answer Reference
                    </h4>
                    <p className="text-xs text-slate-650 leading-relaxed bg-slate-50 p-4 rounded-xl border border-[#ECECEC] whitespace-pre-line font-mono font-semibold">
                      {selectedItem.evaluation.best_answer}
                    </p>
                  </div>
                </div>

                {/* Interviewer Tip */}
                <div className="bg-blue-50/20 border border-blue-100/40 p-5 rounded-xl flex gap-3">
                  <HelpCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">Interviewer Tip</h5>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-semibold">
                      {selectedItem.evaluation.interview_tip}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-8 py-4 flex justify-end">
                <button aria-label="Action button"
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default InterviewHistory;
