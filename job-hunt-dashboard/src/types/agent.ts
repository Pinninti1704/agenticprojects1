export interface StarStory {
  id: string
  situation: string
  task: string
  action: string
  result: string
  reflection: string
  tags: string[]
  createdAt: string
}

export interface MockInterviewSession {
  id: string
  jdTitle: string
  questions: InterviewQuestion[]
  currentIndex: number
  startedAt: string
  completedAt?: string
}

export interface InterviewQuestion {
  id: string
  question: string
  type: 'behavioral' | 'technical' | 'coding' | 'situational'
  difficulty: 'easy' | 'medium' | 'hard'
  answer?: string
  feedback?: string
}

export interface JobMatchResult {
  matchPercent: number
  matchedSkills: string[]
  missingSkills: string[]
  criticalMissingSkills: string[]
  niceToHaveMissingSkills: string[]
  suggestions: string[]
}

export interface ScannedRole {
  company: string
  role: string
  location: string
  matchScore: number
  url: string
  reason: string
}

export interface AnswerScore {
  structure: number
  depth: number
  quantifiable: number
  overall: number
  suggestions: string[]
}

export interface StarScore {
  situation: number
  task: number
  action: number
  result: number
  overall: number
}

export interface OutreachEntry {
  id: string
  type: 'connection' | 'followup' | 'thankyou' | 'referral'
  recipient: string
  context: string
  message: string
  tone: 'professional' | 'warm' | 'direct'
  createdAt: string
  status: 'sent' | 'replied' | 'connected' | 'booked'
  followUpDate: string
}

export interface ScannedJob {
  id: string
  jdText: string
  extractedSkills: string[]
  matchResult: JobMatchResult
  scannedRoles: ScannedRole[]
  createdAt: string
}

export interface OutreachParams {
  type: 'connection' | 'followup' | 'thankyou' | 'referral'
  recipient: string
  company?: string
  role?: string
  mutualConnection?: string
  sharedInterest?: string
  articleRef?: string
  tone: 'professional' | 'warm' | 'direct'
}

export interface OutreachVariant {
  id: string
  message: string
  hook: string
}