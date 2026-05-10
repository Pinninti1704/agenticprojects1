import { create } from 'zustand'
import type { ScrapedQuestionSet, InterviewQuestion, ScrapedQuestionStatus } from '@/types/question'
import { generateId, nowISO } from '@/lib/utils'
import { loadFromStorage, saveToStorage } from '@/services/storage'

interface QuestionState {
  questionSets: ScrapedQuestionSet[]
  acceptedQuestions: Record<string, InterviewQuestion[]>
}

interface QuestionActions {
  addQuestionSet: (topicId: string, source: string, questions: Omit<InterviewQuestion, 'id'>[]) => ScrapedQuestionSet
  acceptQuestionSet: (setId: string) => void
  rejectQuestionSet: (setId: string) => void
  acceptSingleQuestion: (setId: string, questionId: string) => void
  rejectSingleQuestion: (setId: string, questionId: string) => void
  getQuestionsForTopic: (topicId: string) => InterviewQuestion[]
  getPendingSets: () => ScrapedQuestionSet[]
}

const STORAGE_KEY = 'questions'

export const useQuestionStore = create<QuestionState & QuestionActions>((set, get) => ({
  ...loadFromStorage<QuestionState>(STORAGE_KEY, { questionSets: [], acceptedQuestions: {} }),

  addQuestionSet: (topicId, source, questions) => {
    const questionSet: ScrapedQuestionSet = {
      id: generateId(),
      topicId,
      source,
      questions: questions.map((q) => ({ ...q, id: generateId() })),
      status: 'pending_review',
      scrapedAt: nowISO(),
    }
    set((s) => {
      const next = { questionSets: [...s.questionSets, questionSet] }
      saveToStorage(STORAGE_KEY, { ...s, ...next })
      return next
    })
    return questionSet
  },

  acceptQuestionSet: (setId) => {
    set((s) => {
      const set = s.questionSets.find((qs) => qs.id === setId)
      if (!set) return s
      const accepted = s.acceptedQuestions[set.topicId] || []
      const questionSets = s.questionSets.map((qs) =>
        qs.id === setId ? { ...qs, status: 'accepted' as ScrapedQuestionStatus } : qs
      )
      const acceptedQuestions = {
        ...s.acceptedQuestions,
        [set.topicId]: [...accepted, ...set.questions],
      }
      saveToStorage(STORAGE_KEY, { ...s, questionSets, acceptedQuestions })
      return { questionSets, acceptedQuestions }
    })
  },

  rejectQuestionSet: (setId) => {
    set((s) => {
      const questionSets = s.questionSets.map((qs) =>
        qs.id === setId ? { ...qs, status: 'rejected' as ScrapedQuestionStatus } : qs
      )
      saveToStorage(STORAGE_KEY, { ...s, questionSets })
      return { questionSets }
    })
  },

  acceptSingleQuestion: (setId, questionId) => {
    set((s) => {
      const set = s.questionSets.find((qs) => qs.id === setId)
      if (!set) return s
      const question = set.questions.find((q) => q.id === questionId)
      if (!question) return s
      const accepted = s.acceptedQuestions[set.topicId] || []
      const remainingQuestions = set.questions.filter((q) => q.id !== questionId)
      const questionSets = s.questionSets.map((qs) =>
        qs.id === setId ? { ...qs, questions: remainingQuestions, status: remainingQuestions.length === 0 ? 'accepted' as ScrapedQuestionStatus : qs.status } : qs
      )
      const acceptedQuestions = {
        ...s.acceptedQuestions,
        [set.topicId]: [...accepted, question],
      }
      saveToStorage(STORAGE_KEY, { ...s, questionSets, acceptedQuestions })
      return { questionSets, acceptedQuestions }
    })
  },

  rejectSingleQuestion: (setId, questionId) => {
    set((s) => {
      const set = s.questionSets.find((qs) => qs.id === setId)
      if (!set) return s
      const remainingQuestions = set.questions.filter((q) => q.id !== questionId)
      const questionSets = s.questionSets.map((qs) =>
        qs.id === setId
          ? { ...qs, questions: remainingQuestions, status: remainingQuestions.length === 0 ? 'rejected' as ScrapedQuestionStatus : qs.status }
          : qs
      )
      saveToStorage(STORAGE_KEY, { ...s, questionSets })
      return { questionSets }
    })
  },

  getQuestionsForTopic: (topicId) => get().acceptedQuestions[topicId] || [],
  getPendingSets: () => get().questionSets.filter((qs) => qs.status === 'pending_review'),
}))