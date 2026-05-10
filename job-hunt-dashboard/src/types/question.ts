export type QuestionDifficulty = 'easy' | 'medium' | 'hard'
export type QuestionType = 'technical' | 'behavioral' | 'situational' | 'coding'

export interface InterviewQuestion {
  id: string
  text: string
  difficulty: QuestionDifficulty
  type: QuestionType
  source?: string
  hints?: string[]
}

export type ScrapedQuestionStatus = 'pending_review' | 'accepted' | 'rejected'

export interface ScrapedQuestionSet {
  id: string
  topicId: string
  source: string
  questions: InterviewQuestion[]
  status: ScrapedQuestionStatus
  scrapedAt: string
}