
import { motion } from 'framer-motion';
import { ArrowRight, Star, Zap } from 'lucide-react';
import React from 'react';
import { SUBJECT_INFO } from '../constants';
import { Subject } from '../types';

interface SubjectCardProps {
  subject: Subject;
  onClick: (subject: Subject) => void;
  progress: number;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick, progress }) => {
  const info = SUBJECT_INFO[subject];

  // Determine mastery level colors and effects
  const getMasteryLevel = () => {
    if (progress >= 80) return { label: 'Expert', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]', iconColor: 'text-yellow-500' };
    if (progress >= 40) return { label: 'Intermediate', glow: '', iconColor: 'text-slate-400' };
    return { label: 'Beginner', glow: '', iconColor: 'text-slate-300' };
  };

  const mastery = getMasteryLevel();

  return (
    <motion.button
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(subject)}
      className={`relative w-full text-left p-8 md:p-10 rounded-[40px] border-2 ${info.borderColor} ${info.color} shadow-[0_15px_45px_rgba(0,0,0,0.02)] hover:shadow-[0_45px_90px_rgba(0,0,0,0.06)] transition-all group overflow-hidden bg-white dark:bg-slate-900/50`}
    >
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className="p-5 md:p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:rotate-6 group-hover:scale-105 transition-all duration-500">
          {info.icon}
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1">
             <motion.span 
               animate={progress >= 90 ? { scale: [1, 1.1, 1] } : {}}
               transition={{ repeat: Infinity, duration: 2 }}
               className={`text-4xl md:text-5xl font-black tracking-tighter transition-colors leading-none ${progress >= 80 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}
             >
               {progress}
             </motion.span>
             <span className="text-sm font-black text-slate-300 dark:text-slate-600">%</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {progress >= 80 ? <Star size={10} strokeWidth={2.25} className="text-yellow-400 fill-yellow-400" /> : <Zap size={10} strokeWidth={2.25} className={`${mastery.iconColor} fill-current`} />}
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              {mastery.label}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mb-10 relative z-10">
        <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 leading-none tracking-tighter">{subject}</h3>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm md:text-base leading-relaxed tracking-tight line-clamp-2">
          Master the fundamentals of {subject} with our adaptive AI modules.
        </p>
      </div>
      
      <div className="flex items-center justify-between gap-4 md:gap-6 relative z-10">
        <div className="flex-1">
          <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-4 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "circOut", delay: 0.5 }}
              className={`h-full rounded-full relative transition-all duration-500 ${mastery.glow} ${
                progress >= 80 
                  ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600' 
                  : `bg-gradient-to-r ${info.gradient}`
              }`}
            >
              <div className="absolute inset-0 w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" style={{ animationDuration: '2.5s' }} />
              </div>
              {progress >= 95 && (
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              )}
            </motion.div>
          </div>
        </div>
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-900 dark:bg-slate-700 text-white shadow-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:shadow-indigo-500/30 group-hover:scale-110 transition-all duration-300">
          <ArrowRight size={24} strokeWidth={2.25} />
        </div>
      </div>
      
      <div className={`absolute -right-16 -top-16 w-48 h-48 ${info.color} rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-700`} />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 dark:to-white/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </motion.button>
  );
};

export default SubjectCard;
