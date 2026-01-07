
import { 
  Activity, AlertCircle, ArrowLeft, BrainCircuit, Coffee, 
  ExternalLink, Eye, History, Loader2, Lock, Save, ShieldAlert, 
  ShieldCheck, Sparkles, Target, Trophy, Upload, Zap 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import AIAssistant from './components/AIAssistant';
import SubjectCard from './components/SubjectCard';
import TTSPlayer from './components/TTSPlayer';
import { SUBJECT_INFO } from './constants';
import { 
  evaluateSelfExplanation, generateQuiz, generateWeaknessAutopsy, 
  getCognitiveLoadStatus, summarizePDFContent 
} from './services/geminiService';
import { FailureSignature, LessonSummary, QuizQuestion, Subject, UserProfile } from './types';

// Animation Variants
const pageTransition = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.3, 
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    x: 10,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<'intro' | 'onboarding' | 'dashboard' | 'subject'>('intro');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [currentSummary, setCurrentSummary] = useState<LessonSummary | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isQuizzing, setIsQuizzing] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [diagnosticNotes, setDiagnosticNotes] = useState<string[]>([]);
  const [showExaminerEye, setShowExaminerEye] = useState(false);

  const [sessionStart, setSessionStart] = useState<number>(Date.now());
  const [sessionErrors, setSessionErrors] = useState(0);
  const [cognitiveAction, setCognitiveAction] = useState<{ action: string; message: string } | null>(null);
  const [selfExplanation, setSelfExplanation] = useState('');
  const [isEvaluatingExplanation, setIsEvaluatingExplanation] = useState(false);
  const [explanationFeedback, setExplanationFeedback] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(true);

  const initialProgress = Object.values(Subject).map(subj => ({
    subject: subj,
    progress: 0,
    lastActivity: 'None',
    completedQuizzes: 0,
    timeToMasteryWeeks: 4,
    diagnosticNotes: [],
    failureSignatures: [],
    masteryPrerequisitesMet: false
  }));

  useEffect(() => {
    // Attempt to load the active profile from local storage
    const activeProfileName = localStorage.getItem('manyora_active_profile_name');
    if (activeProfileName) {
      const stored = localStorage.getItem(`manyora_profile_${activeProfileName}`);
      if (stored) {
        setProfile(JSON.parse(stored));
        setView('dashboard');
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && isFocusMode && profile) {
        const updated = { ...profile, noExcusesMetric: Math.max(0, (profile.noExcusesMetric || 100) - 5) };
        saveProfile(updated);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [profile, isFocusMode]);

  const saveProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem(`manyora_profile_${updatedProfile.name}`, JSON.stringify(updatedProfile));
    localStorage.setItem('manyora_active_profile_name', updatedProfile.name);
  };

  const handleBeginClick = () => {
    const name = nameInput.trim();
    if (!name) return;
    
    const stored = localStorage.getItem(`manyora_profile_${name}`);
    let activeProfile: UserProfile;

    if (stored) {
      activeProfile = JSON.parse(stored);
    } else {
      activeProfile = {
        name, 
        progress: initialProgress, 
        theme: 'light', 
        masteryScore: 0,
        noExcusesMetric: 100, 
        learningStyle: 'Practical', 
        streakImprovement: 0
      };
      localStorage.setItem(`manyora_profile_${name}`, JSON.stringify(activeProfile));
    }
    
    setProfile(activeProfile);
    localStorage.setItem('manyora_active_profile_name', name);
    setView('dashboard');
  };

  const checkCognitiveLoad = async (errors: number) => {
    const duration = Math.round((Date.now() - sessionStart) / 60000);
    const status = await getCognitiveLoadStatus(errors, duration);
    setCognitiveAction(status);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSubject || !profile) return;
    setIsProcessing(true);
    setSessionStart(Date.now());
    setSessionErrors(0);
    setCognitiveAction(null);
    setCurrentSummary(null);

    try {
      const pdfjsLib = (window as any).pdfjsLib;
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
      }
      const summary = await summarizePDFContent(fullText, selectedSubject);
      setCurrentSummary(summary);
      
      const subjProgress = profile.progress.find(p => p.subject === selectedSubject);
      const failures = subjProgress?.failureSignatures.map(f => f.concept) || [];
      const quiz = await generateQuiz(summary.summary, selectedSubject, failures);
      setQuizQuestions(quiz);
    } catch (error) {
      alert("Analysis error.");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitQuiz = async () => {
    if (!selectedSubject || !profile) return;
    setIsProcessing(true);
    const score = quizQuestions.filter((q, i) => userAnswers[i] === q.correctAnswer).length;
    const errors = quizQuestions.length - score;
    setSessionErrors(prev => prev + errors);
    
    const newFailures: FailureSignature[] = [];
    quizQuestions.forEach((q, i) => {
      if (userAnswers[i] !== q.correctAnswer) {
        newFailures.push({
          concept: q.conceptTag,
          timesFailed: 1,
          lastFailedDate: new Date().toISOString(),
          trapType: "Logical Gap"
        });
      }
    });

    const diagnostics = await generateWeaknessAutopsy(userAnswers, quizQuestions, selectedSubject);
    setDiagnosticNotes(diagnostics);
    setQuizScore(score);
    
    const newProgress = profile.progress.map(p => {
      if (p.subject === selectedSubject) {
        const mergedFailures = [...p.failureSignatures];
        newFailures.forEach(nf => {
          const idx = mergedFailures.findIndex(mf => mf.concept === nf.concept);
          if (idx > -1) mergedFailures[idx].timesFailed++;
          else mergedFailures.push(nf);
        });
        return { 
          ...p, 
          progress: Math.min(100, p.progress + (score * 5)),
          failureSignatures: mergedFailures.slice(-10),
          diagnosticNotes: [...p.diagnosticNotes, ...diagnostics].slice(-5)
        };
      }
      return p;
    });

    saveProfile({ ...profile, progress: newProgress, masteryScore: profile.masteryScore + (score * 2) });
    await checkCognitiveLoad(sessionErrors + errors);
    setIsProcessing(false);
  };

  const handleExplanation = async () => {
    if (!selfExplanation.trim()) return;
    setIsEvaluatingExplanation(true);
    const result = await evaluateSelfExplanation(quizQuestions[0]?.question || "The module concept", selfExplanation);
    setExplanationFeedback(result.feedback);
    if (profile) {
      saveProfile({ ...profile, masteryScore: profile.masteryScore + (result.quality / 10) });
    }
    setIsEvaluatingExplanation(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500">
      <AnimatePresence mode="wait">
        {view === 'intro' && (
          <motion.div 
            key="intro" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950 text-center"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center mb-8 shadow-2xl"
            >
              <Sparkles className="text-white" size={40} strokeWidth={2.25} />
            </motion.div>
            <h1 className="text-5xl font-black mb-4 tracking-tighter">Manyora</h1>
            <p className="text-lg text-slate-400 font-medium mb-12">Elite academic rigor, powered by machine intelligence.</p>
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: '#4338ca' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('onboarding')} 
              className="w-full max-w-xs py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/10 transition-all"
            >
              Begin Journey
            </motion.button>
          </motion.div>
        )}

        {view === 'onboarding' && (
          <motion.div 
            key="onboarding" 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950"
          >
            <div className="w-full max-w-md bg-white dark:bg-slate-900 p-10 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800">
              <h2 className="text-3xl font-black mb-2 tracking-tighter">Enter Identity</h2>
              <p className="text-slate-400 text-sm font-medium mb-8">Creating your localized study environment...</p>
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={nameInput} 
                    onChange={e => setNameInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleBeginClick()}
                    className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-indigo-600 transition-all pl-12" 
                  />
                  <Sparkles className="absolute left-4 top-4 text-slate-400" size={18} />
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: '#4338ca' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBeginClick} 
                className="w-full mt-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck size={20} />
                Access Dashboard
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(view === 'dashboard' || view === 'subject') && profile && (
        <>
          <nav className="glass sticky top-0 z-40 p-4 flex justify-between items-center px-6 md:px-12 border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView('dashboard'); setSelectedSubject(null); }}>
              <div className="w-9 h-9 bg-black dark:bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-md">M</div>
              <span className="text-xl font-black tracking-tighter">Manyora</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                <Save size={14} className="text-indigo-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Auto-Saved
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Elite Rank</span>
                  <span className="text-sm font-black text-indigo-600">{Math.floor(profile.masteryScore)} RP</span>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${profile.noExcusesMetric > 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <Activity size={18} strokeWidth={2.25} />
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto p-6 md:p-12 pb-32 overflow-hidden">
            <AnimatePresence mode="wait">
              {view === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  variants={pageTransition}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <header className="mb-12">
                    <motion.h1 variants={fadeUpVariants} className="text-4xl md:text-6xl font-black tracking-tighter mb-4">Focus, {profile.name}.</motion.h1>
                    <motion.div variants={fadeUpVariants} className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <Target size={16} strokeWidth={2.25} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Integrity: {profile.noExcusesMetric}%</span>
                      </div>
                      <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <History size={16} strokeWidth={2.25} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reinforcement Active</span>
                      </div>
                    </motion.div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {Object.values(Subject).map((subj) => (
                      <motion.div key={subj} variants={fadeUpVariants}>
                        <SubjectCard 
                          subject={subj} 
                          progress={profile.progress.find(p => p.subject === subj)?.progress || 0}
                          onClick={s => { setSelectedSubject(s); setView('subject'); }}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {view === 'subject' && selectedSubject && (
                <motion.div 
                  key="subject"
                  variants={pageTransition}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.div variants={fadeUpVariants} className="flex items-center justify-between mb-10">
                    <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors">
                      <ArrowLeft size={14} strokeWidth={2.25} /> Back
                    </button>
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900 text-white rounded-2xl">
                      <ShieldCheck size={14} strokeWidth={2.25} className="text-indigo-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Focus Active</span>
                    </div>
                  </motion.div>

                  {cognitiveAction && (
                    <motion.div 
                      variants={fadeUpVariants}
                      className={`mb-10 p-6 rounded-[32px] flex items-center gap-5 border-2 ${cognitiveAction.action === 'stop' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}
                    >
                      <div className={`p-4 rounded-2xl ${cognitiveAction.action === 'stop' ? 'bg-rose-600' : 'bg-amber-600'} text-white`}>
                        {cognitiveAction.action === 'stop' ? <ShieldAlert size={24} strokeWidth={2.25} /> : <Coffee size={24} strokeWidth={2.25} />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">Cognitive Load Governor</h4>
                        <p className="text-xs font-bold text-slate-500">{cognitiveAction.message}</p>
                      </div>
                    </motion.div>
                  )}

                  {!currentSummary ? (
                    <motion.div 
                      variants={fadeUpVariants}
                      className={`p-12 md:p-20 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900/50`}
                    >
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 text-slate-300"><Upload size={32} strokeWidth={2.25} /></div>
                      <h2 className="text-3xl font-black mb-3 tracking-tighter">Ready for Mastery?</h2>
                      <p className="text-slate-400 max-w-sm mx-auto mb-10 text-sm font-medium">Upload your syllabus PDF to begin adaptive distillation.</p>
                      <label className="cursor-pointer">
                        <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                        <motion.div 
                          whileHover={{ scale: 1.02, backgroundColor: '#4338ca' }}
                          whileTap={{ scale: 0.98 }}
                          className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl text-lg shadow-xl transition-all"
                        >
                          Begin Distillation
                        </motion.div>
                      </label>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                      <div className="lg:col-span-2 space-y-10">
                        <motion.div variants={fadeUpVariants} className="bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3 mb-8">
                             <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Lesson Essential</div>
                             <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Exam Aligned</div>
                          </div>
                          <h1 className="text-3xl md:text-5xl font-black mb-8 tracking-tight">{currentSummary.title}</h1>
                          <p className="text-lg leading-relaxed opacity-80 mb-10">{currentSummary.summary}</p>
                          <TTSPlayer text={currentSummary.summary} />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                            <div className="p-7 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100/40">
                              <h4 className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-blue-600 mb-4"><ExternalLink size={14} strokeWidth={2.25} /> Real-World</h4>
                              <p className="text-xs font-bold opacity-75 leading-relaxed">{currentSummary.realWorldApplication}</p>
                            </div>
                            <div className="p-7 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-100/40">
                              <h4 className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-amber-600 mb-4"><Eye size={14} strokeWidth={2.25} /> Examiner</h4>
                              <p className="text-xs font-bold opacity-75 leading-relaxed">{currentSummary.examinerInsights}</p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div variants={fadeUpVariants}>
                          {isQuizzing ? (
                            <div className="bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800">
                              {quizScore !== null ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                  <Trophy size={64} strokeWidth={2.25} className="mx-auto text-yellow-400 mb-6" />
                                  <h3 className="text-3xl font-black mb-3">Diagnostics Complete</h3>
                                  <p className="text-lg text-slate-400 mb-10">Performance: {quizScore}/{quizQuestions.length}</p>
                                  
                                  <div className="max-w-lg mx-auto space-y-3 mb-12">
                                    {diagnosticNotes.map((note, i) => (
                                      <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center gap-4 text-left border border-slate-100 dark:border-slate-700"
                                      >
                                        <ShieldAlert size={18} strokeWidth={2.25} className="text-rose-600 shrink-0" />
                                        <p className="text-xs font-bold">{note}</p>
                                      </motion.div>
                                    ))}
                                  </div>

                                  <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-8 rounded-[32px] mb-10 text-left">
                                    <h4 className="font-black uppercase text-[10px] tracking-widest text-indigo-600 mb-4">Self-Explanation Enforcement</h4>
                                    <textarea 
                                      value={selfExplanation} 
                                      onChange={e => setSelfExplanation(e.target.value)} 
                                      className="w-full h-28 bg-white dark:bg-slate-800 p-5 rounded-2xl outline-none border-2 border-transparent focus:border-indigo-600 font-bold mb-5 transition-all"
                                      placeholder="Explain your core reasoning..."
                                    />
                                    <motion.button 
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={handleExplanation} 
                                      disabled={isEvaluatingExplanation || !selfExplanation} 
                                      className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl disabled:opacity-50 text-sm shadow-md transition-all"
                                    >
                                      {isEvaluatingExplanation ? <Loader2 className="animate-spin" strokeWidth={2.25} /> : "Verify Logic"}
                                    </motion.button>
                                    {explanationFeedback && <p className="mt-4 p-3 bg-white dark:bg-slate-950 rounded-2xl text-[11px] font-black text-emerald-600 border border-emerald-100">{explanationFeedback}</p>}
                                  </div>

                                  <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsQuizzing(false)} 
                                    className="px-10 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl"
                                  >
                                    Finish Module
                                  </motion.button>
                                </motion.div>
                              ) : (
                                <div className="space-y-12">
                                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-8">
                                    <span className="font-black text-[10px] uppercase tracking-widest text-indigo-600">Simulated Exam</span>
                                    <button onClick={() => setShowExaminerEye(!showExaminerEye)} className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${showExaminerEye ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                      <Eye size={12} strokeWidth={2.25} className="inline mr-1" /> Examiner's Eye {showExaminerEye ? 'On' : 'Off'}
                                    </button>
                                  </div>
                                  {quizQuestions.map((q, idx) => (
                                    <motion.div key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}>
                                      <p className="text-xl font-black mb-6 leading-tight">{q.question}</p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {q.options.map((opt, oIdx) => (
                                          <button 
                                            key={oIdx} 
                                            onClick={() => { const a = [...userAnswers]; a[idx] = oIdx; setUserAnswers(a); }}
                                            className={`text-left p-5 rounded-2xl border-2 transition-all font-bold text-sm ${userAnswers[idx] === oIdx ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 shadow-sm' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-indigo-200 hover:bg-indigo-50/20'}`}
                                          >
                                            {opt}
                                          </button>
                                        ))}
                                      </div>
                                      {showExaminerEye && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 p-5 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100/50">
                                          <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200">Tip: {q.examinerTip}</p>
                                        </motion.div>
                                      )}
                                    </motion.div>
                                  ))}
                                  <motion.button 
                                    whileHover={{ scale: 1.02, backgroundColor: '#4338ca' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={submitQuiz} 
                                    className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl text-xl shadow-xl flex items-center justify-center gap-3 transition-all"
                                  >
                                    Analyze <Zap size={20} strokeWidth={2.25} fill="currentColor" />
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <motion.button 
                              whileHover={{ scale: 1.02, backgroundColor: '#0f172a' }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => { setIsQuizzing(true); setQuizScore(null); setUserAnswers([]); setExplanationFeedback(null); setSelfExplanation(''); }} 
                              className="w-full py-16 bg-slate-900 dark:bg-indigo-600 text-white rounded-[32px] font-black text-2xl shadow-xl flex items-center justify-center gap-5 group transition-all"
                            >
                              <BrainCircuit size={32} strokeWidth={2.25} className="group-hover:rotate-12 transition-transform" /> Begin Assessment
                            </motion.button>
                          )}
                        </motion.div>
                      </div>

                      <div className="space-y-10">
                         <motion.div variants={fadeUpVariants} className="bg-white dark:bg-slate-900 p-10 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-800">
                           <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-8 flex items-center gap-2"><Lock size={12} strokeWidth={2.25} /> Prerequisites</h4>
                           <div className="space-y-3">
                             {currentSummary.prerequisites.map((p, i) => (
                               <div key={i} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                 <ShieldCheck size={14} strokeWidth={2.25} className="text-emerald-500" />
                                 <span className="text-[11px] font-black text-slate-500">{p} Mastery</span>
                               </div>
                             ))}
                           </div>
                         </motion.div>

                         {profile.progress.find(p => p.subject === selectedSubject)?.failureSignatures.length! > 0 && (
                           <motion.div variants={fadeUpVariants} className="bg-white dark:bg-slate-900 p-10 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-800">
                             <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-8 flex items-center gap-2"><AlertCircle size={12} strokeWidth={2.25} /> Failure Signatures</h4>
                             <div className="space-y-3">
                                {profile.progress.find(p => p.subject === selectedSubject)?.failureSignatures.map((f, i) => (
                                   <div key={i} className="p-4 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl border-l-4 border-rose-600">
                                      <p className="text-[11px] font-black text-rose-900 dark:text-rose-200">Trap: {f.concept}</p>
                                   </div>
                                ))}
                             </div>
                           </motion.div>
                         )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </>
      )}

      <AIAssistant />
    </div>
  );
};

export default App;
