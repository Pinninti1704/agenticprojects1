import type { InterviewQuestion, AnswerScore, StarStory, StarScore, OutreachParams, OutreachVariant, JobMatchResult } from '@/types/agent'

export interface AiProvider {
  generateInterviewQuestions(jdTitle: string, count: number): InterviewQuestion[]
  generateFeedback(question: string, answer: string): AnswerScore
  generateStarStory(prompt: string): Omit<StarStory, 'id' | 'createdAt'>
  scoreStarStory(story: Omit<StarStory, 'id' | 'createdAt'>): StarScore
  generateOutreachMessage(params: OutreachParams): OutreachVariant[]
  analyzeJobMatch(jdText: string, skills: string[]): JobMatchResult
  generateResumeBullets(missingSkill: string): string[]
}