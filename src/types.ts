export interface ConversationMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Memory {
  id: string;
  userId: string;
  title: string;
  approximateDate: string;
  category: 'Career' | 'Personal' | 'Decisions' | 'Projects' | 'Health' | 'Relationships' | 'Milestone' | string;
  whatHappened: string;
  importantContext: string;
  goalsOrDecisions: string;
  whatChanged: string;
  whatRemainsUnclear: string;
  keyLessons: string[];
  tags: string[];
  conversation: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
  userNotes?: string;
}

export interface StructuredMemoryDraft {
  title: string;
  approximateDate: string;
  category: string;
  whatHappened: string;
  importantContext: string;
  goalsOrDecisions: string;
  whatChanged: string;
  whatRemainsUnclear: string;
  keyLessons: string[];
  tags: string[];
}

export interface ContextRecoveryResult {
  answer: string;
  citedMemoryIds: string[];
  keyInsights: string[];
}

export interface ThenVsNowResult {
  thenSummary: {
    goals: string[];
    context: string;
    challenges: string[];
  };
  nowSummary: {
    currentDirection: string;
    progress: string;
    newChallenges: string[];
  };
  whatChanged: {
    importantChanges: string[];
    mindsetShift: string;
    unforeseenDevelopments: string;
  };
}

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
