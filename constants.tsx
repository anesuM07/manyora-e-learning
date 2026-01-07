import React from 'react';
import { Subject } from './types';
import { 
  Sigma, 
  Languages, 
  Atom, 
  TrendingUp, 
  BarChart3 
} from 'lucide-react';

export const SUBJECT_INFO = {
  [Subject.Maths]: {
    icon: <Sigma strokeWidth={2.25} className="w-8 h-8 text-blue-600" />,
    color: 'bg-blue-50/60',
    gradient: 'from-blue-600 to-indigo-700',
    borderColor: 'border-blue-200/40',
    textColor: 'text-blue-900',
    accentColor: 'blue',
    shadow: 'shadow-blue-200/40'
  },
  [Subject.English]: {
    icon: <Languages strokeWidth={2.25} className="w-8 h-8 text-emerald-600" />,
    color: 'bg-emerald-50/60',
    gradient: 'from-emerald-500 to-teal-700',
    borderColor: 'border-emerald-200/40',
    textColor: 'text-emerald-900',
    accentColor: 'emerald',
    shadow: 'shadow-emerald-200/40'
  },
  [Subject.Science]: {
    icon: <Atom strokeWidth={2.25} className="w-8 h-8 text-violet-600" />,
    color: 'bg-violet-50/60',
    gradient: 'from-violet-600 to-purple-800',
    borderColor: 'border-violet-200/40',
    textColor: 'text-violet-900',
    accentColor: 'violet',
    shadow: 'shadow-violet-200/40'
  },
  [Subject.Business]: {
    icon: <TrendingUp strokeWidth={2.25} className="w-8 h-8 text-amber-600" />,
    color: 'bg-amber-50/60',
    gradient: 'from-amber-500 to-orange-700',
    borderColor: 'border-amber-200/40',
    textColor: 'text-amber-900',
    accentColor: 'amber',
    shadow: 'shadow-amber-200/40'
  },
  [Subject.Accounts]: {
    icon: <BarChart3 strokeWidth={2.25} className="w-8 h-8 text-rose-600" />,
    color: 'bg-rose-50/60',
    gradient: 'from-rose-600 to-pink-800',
    borderColor: 'border-rose-200/40',
    textColor: 'text-rose-900',
    accentColor: 'rose',
    shadow: 'shadow-rose-200/40'
  }
};