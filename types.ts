
export enum Subject {
  Maths = 'Maths',
  English = 'English',
  Science = 'Combined Science',
  Business = 'Business Enterprise',
  Accounts = 'Accounts'
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  examinerTip: string;
  difficultyTier: 1 | 2 | 3;
  conceptTag: string; // Used for "Failure Signatures"
}

export interface LessonSummary {
  subject: Subject;
  title: string;
  summary: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  keyTerms: string[];
  suggestedNextTopic: string;
  realWorldApplication: string;
  examinerInsights: string;
  prerequisites: string[]; // For Prerequisite Locking logic
}

export interface FailureSignature {
  concept: string;
  timesFailed: number;
  lastFailedDate: string;
  trapType: string; // e.g., "Calculation Error", "Conceptual Gap"
}

export interface UserProgress {
  subject: Subject;
  progress: number;
  lastActivity: string;
  completedQuizzes: number;
  timeToMasteryWeeks: number;
  diagnosticNotes: string[];
  failureSignatures: FailureSignature[];
  masteryPrerequisitesMet: boolean;
}

export interface UserProfile {
  name: string;
  progress: UserProgress[];
  theme: 'light' | 'dark';
  masteryScore: number;
  noExcusesMetric: number; // 0-100 score of discipline
  learningStyle: 'Visual' | 'Auditory' | 'Practical';
  streakImprovement: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
