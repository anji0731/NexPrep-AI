import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Code, Users, History, ChevronDown, Star, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import SEO from '../components/SEO';

const FAQ_ITEMS = [
  {
    question: "How does the RAG Resume analysis pipeline work?",
    answer: "When you upload your resume, NexPrep AI segments the document into semantic chunks using PyMuPDF. We then convert those chunks into vector embeddings using Sentence Transformers, indexing them in a localized FAISS store. This allows our LLM system to retrieve only the most relevant sections of your resume for evaluation, preventing data loss and generic questions."
  },
  {
    question: "Is the ATS score calculated using an AI model?",
    answer: "No, the ATS score uses deterministic backend logic to evaluate file formatting, contact availability, and key headers, combined with a tokenized job description match. The AI (Llama 3.3 via Groq) is only used to explain the gaps and suggest exactly how to fix them."
  },
  {
    question: "Can I practice both Technical and behavioral HR interviews?",
    answer: "Yes! NexPrep AI provides a dedicated Technical Practice Arena for backend, database, and frontend frameworks, alongside HR Interview Practice which scores answer delivery, communication, structure, confidence, and grammatical correctness."
  },
  {
    question: "Will the mock interview questions be unique for every session?",
    answer: "Absolutely. Every time you start an AI Resume-Based Interview, NexPrep AI compiles a customized pool of 20–25 unique questions dynamically generated from your FAISS resume chunks and optional Job Description. No generic pre-defined template is used."
  }
];

const TESTIMONIALS = [
  {
    name: "Sarah Jenkins",
    role: "Software Engineer at Vercel",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    quote: "NexPrep AI's RAG-guided resume mock interview was identical to my technical screening at Vercel. I knew exactly which gaps to patch beforehand."
  },
  {
    name: "Devon Chen",
    role: "Backend Engineer at Stripe",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    quote: "The ATS match and missing skills checklist allowed me to tweak my resume for compatibility. Landing interviews has been twice as easy since."
  },
  {
    name: "Elena Rostova",
    role: "Product Designer at Linear",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    quote: "As a designer, I appreciate high-fidelity tools. NexPrep is incredibly polished, easy to navigate, and the personalized learning plan is gold."
  },
  {
    name: "Marcus Aurelius",
    role: "Frontend Lead at Notion",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    quote: "The HR behavioral session gave me actionable suggestions on confidence markers. It completely resolved my nervous interview stuttering."
  },
  {
    name: "Priya Sharma",
    role: "Data Engineer at Apple",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    quote: "Practice questions were tailored specifically to my resume's Apache Spark experience. The dynamic questions are extremely realistic."
  },
  {
    name: "James Kowalski",
    role: "Security Analyst at Google",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    quote: "NexPrep is hands down the best tool I've used for practice interviews. The dynamic feedback is on par with senior engineering mentors."
  }
];

const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Section variants that control stagger
  const sectionVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1, // 100ms stagger delay
      }
    }
  };

  // Standard entry animation for section titles, descriptions, and normal child elements
  const childVariants = {
    hidden: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : 40 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.3 : 0.6, // 0.6s duration
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
      }
    }
  };

  // Stagger variants specifically for cards or lists
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : 40 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: shouldReduceMotion ? 0.3 : 0.6, 
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
      } 
    }
  };

  // Interactive hover states for motion elements
  const hoverVariants = shouldReduceMotion ? {} : {
    y: -6, 
    scale: 1.02, 
    transition: {
      duration: 0.25, 
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "NexPrep AI",
    "url": "https://nex-prep-ai.vercel.app/"
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NexPrep AI Career Assistant",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0"
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] selection:bg-blue-600/10 selection:text-blue-600">
      <SEO 
        title="NexPrep AI | AI Resume Analyzer & Mock Interview Preparation"
        description="Your ultimate AI Career Assistant. Get an ATS Resume Checker, Technical Interview Practice, and HR Interview Practice. Transform your resume feedback into job offers."
        canonical="https://nex-prep-ai.vercel.app/"
        schema={[websiteSchema, softwareSchema, faqSchema]}
      />
      <Navbar />
      
      <main>
      {/* Hero Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="relative py-[120px] overflow-hidden gradient-bg bg-dot-pattern"
      >
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Side: Brand Value Copy */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left space-y-8">
            
            {/* Trust Badge Pill */}
            <motion.div
              variants={childVariants}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-small-label font-bold bg-blue-50 text-blue-600 border border-blue-100/50 w-fit"
            >
              <Sparkles size={14} className="animate-pulse" />
              ✨ AI-Powered Resume Intelligence
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={childVariants}
              className="text-hero-title text-slate-900 leading-[1.1] tracking-tight"
            >
              Your <span className="text-blue-600">AI Career Assistant</span> Starts Here
            </motion.h1>

            {/* Supporting Text */}
            <motion.p
              variants={childVariants}
              className="text-body-custom text-slate-500 max-w-xl leading-relaxed"
            >
              Master your career preparation with an advanced AI Resume Analyzer and ATS Resume Checker. Get personalized resume feedback and ace your next role with realistic Technical Interview Practice and HR Interview Practice.
            </motion.p>

            {/* Primary & Secondary Buttons */}
            <motion.div
              variants={childVariants}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                to="/register"
                className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-wider rounded-xl"
              >
                🚀 Analyze My Resume
              </Link>
              <Link
                to="/login"
                className="btn-glass flex items-center justify-center gap-1.5 px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-650 rounded-xl"
              >
                ▶ Watch Demo
              </Link>
            </motion.div>

            {/* Trust Indicators badges below CTA */}
            <motion.div
              variants={childVariants}
              className="grid grid-cols-2 gap-4 pt-8 border-t border-[#ECECEC] max-w-lg"
            >
              {[
                "Resume Intelligence",
                "ATS Analysis",
                "Resume-Based AI Interviews",
                "Technical Mock Interviews",
                "HR Interview Practice",
                "Personalized Feedback"
              ].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-small-label font-medium text-slate-500 hover:text-blue-600 transition-colors">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] shrink-0 font-bold">✓</span>
                  <span>{badge}</span>
                </div>
              ))}
            </motion.div>

          </div>

          {/* Hero Right Side: Interactive Dashboard Mockup Preview */}
          <div className="lg:col-span-5 w-full">
            <motion.div
              variants={childVariants}
              className="bg-white border border-[#ECECEC] rounded-[20px] shadow-minimal p-6 space-y-6 relative group overflow-hidden"
            >
              {/* Browser bar top */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 block"></span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Console.nexprep.ai</span>
                <span className="w-5 h-5 rounded bg-slate-100"></span>
              </div>

              {/* Upload status card */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-[#ECECEC] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50/60 text-blue-600 flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 block">resume_developer.pdf</span>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Size: 2.4 MB</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg">
                  ✓ Indexed
                </span>
              </div>

              {/* Score matrix columns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/50 rounded-xl border border-[#ECECEC] text-left relative overflow-hidden">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">ATS Match Compatibility</span>
                  <span className="text-xl font-bold text-slate-900 block mt-15">92%</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-blue-600 h-full w-[92%] rounded-full"></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-xl border border-[#ECECEC] text-left relative overflow-hidden">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Interview Readiness</span>
                  <span className="text-xl font-bold text-slate-900 block mt-15">88%</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-green-500 h-full w-[88%] rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Skills Analysis Tag Matrix */}
              <div className="space-y-2 text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Extracted Key Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {["React", "TypeScript", "Node.js", "Python", "SQL", "Docker"].map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 text-[9px] font-bold rounded-lg bg-blue-50/50 border border-blue-150 text-blue-600">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Feedback Bubble */}
              <div className="p-4 bg-blue-50/20 border border-blue-100/40 rounded-xl text-left">
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block flex items-center gap-1.5">
                  <Sparkles size={12} />
                  AI Suggestion Feedback
                </span>
                <p className="text-[10px] text-slate-650 font-semibold leading-relaxed mt-1.5">
                  "Your ATS score is 92%. Improve keyword coverage with AI-powered semantic matching and optimized retrieval techniques"
                </p>
              </div>

            </motion.div>
          </div>

        </div>
      </motion.section>

      {/* Metrics Row */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="bg-white border-y border-[#ECECEC] py-[120px]"
      >
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "12k+", label: "Interviews Handled" },
            { value: "98.2%", label: "ATS Match Accuracy" },
            { value: "4.92 / 5", label: "User Satisfaction" },
            { value: "30%", label: "Avg Salary Lift" }
          ].map((metric, idx) => (
            <motion.div key={idx} variants={childVariants} className="space-y-2">
              <span className="text-[48px] font-bold text-slate-900 tracking-tight leading-none block">{metric.value}</span>
              <span className="text-small-label text-slate-400 font-semibold block uppercase tracking-wider">{metric.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        id="features" 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-[120px] bg-slate-50/50 border-b border-slate-100"
      >
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <motion.div variants={childVariants} className="text-center max-w-3xl mx-auto mb-24">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Suite Modules</span>
            <h2 className="text-section-title font-bold text-slate-900 tracking-tight mt-6">
              Everything you need for comprehensive interview preparation
            </h2>
            <p className="mt-4 text-body-custom text-slate-500">
              We focus on building core AI intelligence modules that offer resume review and authentic mock interview AI scenarios.
            </p>
          </motion.div>

          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Module 1: Resume Analysis */}
            <motion.div 
              variants={cardVariants} 
              whileHover={hoverVariants}
              className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal hover:border-slate-350 hover:shadow-minimal-hover transition-[box-shadow,border-color] duration-250 ease-out text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center mb-8 border border-blue-100/30">
                <FileText size={20} />
              </div>
              <h3 className="text-card-title font-semibold text-slate-900 mb-4">Resume Intelligence</h3>
              <p className="text-body-custom text-slate-500 leading-relaxed">
                Upload your PDF resume to receive a comprehensive ATS score, strengths, weaknesses, missing skills, and detailed suggestions.
              </p>
            </motion.div>

            {/* Module 2: Technical Practice */}
            <motion.div 
              variants={cardVariants} 
              whileHover={hoverVariants}
              className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal hover:border-slate-350 hover:shadow-minimal-hover transition-[box-shadow,border-color] duration-250 ease-out text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center mb-8 border border-blue-100/30">
                <Code size={20} />
              </div>
              <h3 className="text-card-title font-semibold text-slate-900 mb-4">Technical Practice Arena</h3>
              <p className="text-body-custom text-slate-500 leading-relaxed">
                Practice technical interviews using AI across multiple technologies. Answer tailored questions and get model answers.
              </p>
            </motion.div>

            {/* Module 3: HR Practice */}
            <motion.div 
              variants={cardVariants} 
              whileHover={hoverVariants}
              className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal hover:border-slate-350 hover:shadow-minimal-hover transition-[box-shadow,border-color] duration-250 ease-out text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center mb-8 border border-blue-100/30">
                <Users size={20} />
              </div>
              <h3 className="text-card-title font-semibold text-slate-900 mb-4">HR Interview Practice</h3>
              <p className="text-body-custom text-slate-500 leading-relaxed">
                Practice behavioral and HR interviews with personalized AI feedback. Get rated on communication, confidence, and grammar.
              </p>
            </motion.div>

            {/* Module 4: Interview History */}
            <motion.div 
              variants={cardVariants} 
              whileHover={hoverVariants}
              className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal hover:border-slate-350 hover:shadow-minimal-hover transition-[box-shadow,border-color] duration-250 ease-out text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center mb-8 border border-blue-100/30">
                <History size={20} />
              </div>
              <h3 className="text-card-title font-semibold text-slate-900 mb-4">Interview Insights</h3>
              <p className="text-body-custom text-slate-500 leading-relaxed">
                Store every mock session to track your growth over time. Review past feedback, delete sessions, or study suggestions.
              </p>
            </motion.div>

            {/* Module 5: RAG-Guided AI */}
            <motion.div 
              variants={cardVariants} 
              whileHover={hoverVariants}
              className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal hover:border-slate-350 hover:shadow-minimal-hover transition-[box-shadow,border-color] duration-250 ease-out text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center mb-8 border border-blue-100/30">
                <Sparkles size={20} />
              </div>
              <h3 className="text-card-title font-semibold text-slate-900 mb-4">RAG Resume-Based Prep</h3>
              <p className="text-body-custom text-slate-500 leading-relaxed">
                Generate highly personalized questions dynamically mapped directly from your RAG resume chunks and target job descriptions.
              </p>
            </motion.div>

            {/* Module 6: Clean white theme */}
            <motion.div 
              variants={cardVariants} 
              whileHover={hoverVariants}
              className="bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal hover:border-slate-350 hover:shadow-minimal-hover transition-[box-shadow,border-color] duration-250 ease-out text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50/60 text-blue-600 flex items-center justify-center mb-8 border border-blue-100/30">
                <Star size={20} />
              </div>
              <h3 className="text-card-title font-semibold text-slate-900 mb-4">Clean Spacing Layout</h3>
              <p className="text-body-custom text-slate-500 leading-relaxed">
                A premium, clutter-free dashboard inspired by Stripe and Notion. No neon effects, no distractingly heavy purple glows.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-[120px] bg-white"
      >
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <motion.div variants={childVariants} className="text-center max-w-3xl mx-auto mb-24">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Lifecycle</span>
            <h2 className="text-section-title font-bold text-slate-900 tracking-tight mt-6">
              Get ready in four simple steps
            </h2>
            <p className="mt-4 text-body-custom text-slate-500">
              We've streamlined the interview preparation pipeline to be as efficient as possible.
            </p>
          </motion.div>

          <motion.div 
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8 relative"
          >
            {[
              { num: 1, title: "Create Account", desc: "Register with email or use our simulated Google login." },
              { num: 2, title: "Upload Resume", desc: "Get an immediate ATS compatibility analysis and advice." },
              { num: 3, title: "Mock Interviews", desc: "Answer technical and behavioral questions generated by AI." },
              { num: 4, title: "Analyze & Improve", desc: "Study strengths, correct mistakes, and memorize ideal answers." }
            ].map((step) => (
              <motion.div 
                key={step.num}
                variants={cardVariants}
                whileHover={hoverVariants}
                className="text-center bg-slate-50/50 p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal hover:border-slate-350 hover:shadow-minimal-hover transition-[box-shadow,border-color] duration-250 ease-out relative"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50/60 text-blue-600 font-bold text-xs flex items-center justify-center mx-auto mb-6 border border-blue-100/30">
                  {step.num}
                </div>
                <h4 className="text-card-title font-bold text-slate-900 mb-2">{step.title}</h4>
                <p className="text-xs text-slate-400 font-semibold">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-[120px] bg-slate-50/30 border-y border-slate-100 overflow-hidden"
      >
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <motion.div variants={childVariants} className="text-center max-w-3xl mx-auto mb-24">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Testimonials</span>
            <h2 className="text-section-title font-bold text-slate-900 tracking-tight mt-6">Candidate Success Stories</h2>
          </motion.div>
        </div>

        {/* Ticker Container with side gradients */}
        <motion.div 
          variants={childVariants}
          className="relative w-full overflow-hidden py-4"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>
          
          <div 
            className="flex gap-8 w-max animate-ticker hover:[animation-play-state:paused] px-4"
            style={shouldReduceMotion ? { animation: 'none', transform: 'none', flexWrap: 'wrap', justifyContent: 'center', width: '100%' } : undefined}
          >
            {(shouldReduceMotion ? TESTIMONIALS : [...TESTIMONIALS, ...TESTIMONIALS]).map((item, idx) => (
              <div 
                key={idx} 
                className="w-[380px] bg-white p-8 sm:p-10 rounded-[20px] border border-[#ECECEC] shadow-minimal flex flex-col justify-between shrink-0 hover:border-blue-500/30 transition-all hover:scale-[1.01]"
              >
                <p className="text-xs font-semibold text-slate-650 italic leading-relaxed text-left">
                  "{item.quote}"
                </p>
                <div className="flex items-center gap-3.5 mt-6 pt-4 border-t border-slate-100">
                  <img src={item.image} alt={item.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  <div className="text-left">
                    <h5 className="font-bold text-slate-900 text-xs">{item.name}</h5>
                    <span className="text-[10px] text-slate-400 font-semibold">{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* FAQs */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-[120px] bg-white"
      >
        <div className="max-w-3xl mx-auto px-4">
          <motion.div variants={childVariants} className="text-center mb-20">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Support</span>
            <h2 className="text-section-title font-bold text-slate-900 tracking-tight mt-6">Frequently Asked Questions</h2>
          </motion.div>
          <motion.div variants={sectionVariants} className="space-y-4">
            {FAQ_ITEMS.map((faq, index) => {
              const active = activeFaq === index;
              return (
                <motion.div 
                  key={index} 
                  variants={cardVariants}
                  className="border border-[#ECECEC] rounded-[20px] overflow-hidden bg-slate-50/20"
                >
                  <button aria-label="Action button"
                    onClick={() => setActiveFaq(active ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left font-bold text-slate-800 text-xs hover:bg-slate-50/50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${active ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-6 pt-0 border-t border-slate-105 text-xs leading-relaxed text-slate-500 font-medium text-left">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
