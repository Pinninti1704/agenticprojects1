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
  deleteAcceptedQuestion: (topicId: string, questionId: string) => void
  getQuestionsForTopic: (topicId: string) => InterviewQuestion[]
  getPendingSets: () => ScrapedQuestionSet[]
}

const STORAGE_KEY = 'questions'

function questionSetsEqual(a: ScrapedQuestionSet[], b: ScrapedQuestionSet[]): boolean {
  if (a.length !== b.length) return false
  return a.every((item, i) => item.id === b[i].id && item.status === b[i].status)
}

function acceptedQuestionsEqual(a: Record<string, InterviewQuestion[]>, b: Record<string, InterviewQuestion[]>): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    const arrA = a[key]
    const arrB = b[key]
    if (!arrB) return false
    if (arrA.length !== arrB.length) return false
    if (!arrA.every((item, i) => item.id === arrB[i].id)) return false
  }
  return true
}

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
      if (!set) return {}
      const accepted = s.acceptedQuestions[set.topicId] || []
      const questionSets = s.questionSets.map((qs) =>
        qs.id === setId ? { ...qs, status: 'accepted' as ScrapedQuestionStatus } : qs
      )
      if (questionSetsEqual(s.questionSets, questionSets)) return {}
      const acceptedQuestions = {
        ...s.acceptedQuestions,
        [set.topicId]: [...accepted, ...set.questions],
      }
      if (acceptedQuestionsEqual(s.acceptedQuestions, acceptedQuestions)) return {}
      saveToStorage(STORAGE_KEY, { ...s, questionSets, acceptedQuestions })
      return { questionSets, acceptedQuestions }
    })
  },

  rejectQuestionSet: (setId) => {
    set((s) => {
      const questionSets = s.questionSets.map((qs) =>
        qs.id === setId ? { ...qs, status: 'rejected' as ScrapedQuestionStatus } : qs
      )
      if (questionSetsEqual(s.questionSets, questionSets)) return {}
      saveToStorage(STORAGE_KEY, { ...s, questionSets })
      return { questionSets }
    })
  },

  acceptSingleQuestion: (setId, questionId) => {
    set((s) => {
      const set = s.questionSets.find((qs) => qs.id === setId)
      if (!set) return {}
      const question = set.questions.find((q) => q.id === questionId)
      if (!question) return {}
      const accepted = s.acceptedQuestions[set.topicId] || []
      const remainingQuestions = set.questions.filter((q) => q.id !== questionId)
      const questionSets = s.questionSets.map((qs) =>
        qs.id === setId ? { ...qs, questions: remainingQuestions, status: remainingQuestions.length === 0 ? 'accepted' as ScrapedQuestionStatus : qs.status } : qs
      )
      const acceptedQuestions = {
        ...s.acceptedQuestions,
        [set.topicId]: [...accepted, question],
      }
      if (acceptedQuestionsEqual(s.acceptedQuestions, acceptedQuestions)) return {}
      saveToStorage(STORAGE_KEY, { ...s, questionSets, acceptedQuestions })
      return { questionSets, acceptedQuestions }
    })
  },

  rejectSingleQuestion: (setId, questionId) => {
    set((s) => {
      const set = s.questionSets.find((qs) => qs.id === setId)
      if (!set) return {}
      const remainingQuestions = set.questions.filter((q) => q.id !== questionId)
      const questionSets = s.questionSets.map((qs) =>
        qs.id === setId
          ? { ...qs, questions: remainingQuestions, status: remainingQuestions.length === 0 ? 'rejected' as ScrapedQuestionStatus : qs.status }
          : qs
      )
      if (questionSetsEqual(s.questionSets, questionSets)) return {}
      saveToStorage(STORAGE_KEY, { ...s, questionSets })
      return { questionSets }
    })
  },

  deleteAcceptedQuestion: (topicId, questionId) => set((s) => {
    const current = s.acceptedQuestions[topicId] || []
    const acceptedQuestions = {
      ...s.acceptedQuestions,
      [topicId]: current.filter((q) => q.id !== questionId),
    }
    if (acceptedQuestionsEqual(s.acceptedQuestions, acceptedQuestions)) return {}
    saveToStorage(STORAGE_KEY, { ...s, acceptedQuestions })
    return { acceptedQuestions }
  }),

  getQuestionsForTopic: (topicId) => get().acceptedQuestions[topicId] || [],
  getPendingSets: () => get().questionSets.filter((qs) => qs.status === 'pending_review'),
}))