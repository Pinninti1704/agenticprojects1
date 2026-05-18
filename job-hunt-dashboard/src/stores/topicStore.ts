import { create } from 'zustand'
import type { Topic, TopicCategory, StudyMaterial } from '@/types/topic'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import { generateId, nowISO } from '@/lib/utils'
import { loadFromStorage, saveToStorage } from '@/services/storage'

function topicsEqual(a: Topic[], b: Topic[]): boolean {
  if (a.length !== b.length) return false
  return a.every((t, i) => {
    const o = b[i]
    return t.id === o.id && t.confidence === o.confidence && t.name === o.name
      && t.categoryId === o.categoryId && t.deadlineId === o.deadlineId
      && t.materials.length === o.materials.length
      && t.acceptedQuestionIds.length === o.acceptedQuestionIds.length
  })
}

interface TopicState {
  topics: Topic[]
  categories: TopicCategory[]
  selectedTopicId: string | null
}

interface TopicActions {
  addTopic: (categoryId: string, name: string, confidence?: 1 | 2 | 3 | 4 | 5) => Topic
  updateTopic: (id: string, updates: Partial<Topic>) => void
  deleteTopic: (id: string) => void
  updateConfidence: (id: string, confidence: 1 | 2 | 3 | 4 | 5) => void
  addMaterial: (topicId: string, material: Omit<StudyMaterial, 'id' | 'createdAt'>) => void
  removeMaterial: (topicId: string, materialId: string) => void
  setSelectedTopicId: (id: string | null) => void
  getTopicById: (id: string) => Topic | undefined
  getTopicsByCategory: (categoryId: string) => Topic[]
  getTopicsCoveredPercent: () => number
}

const STORAGE_KEY = 'topics'

const defaultState = {
  topics: [] as Topic[],
  categories: DEFAULT_CATEGORIES,
  selectedTopicId: null as string | null,
}

export const useTopicStore = create<TopicState & TopicActions>((set, get) => ({
  ...loadFromStorage(STORAGE_KEY, defaultState),

  addTopic: (categoryId, name, confidence = 1) => {
    const topic: Topic = {
      id: generateId(),
      categoryId,
      name,
      confidence,
      materials: [],
      acceptedQuestionIds: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }
    set((s) => {
      const topics = [...s.topics, topic]
      saveToStorage(STORAGE_KEY, { ...s, topics })
      return { topics }
    })
    return topic
  },

  updateTopic: (id, updates) => {
    set((s) => {
      const topics = s.topics.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: nowISO() } : t
      )
      if (topicsEqual(s.topics, topics)) return {}
      saveToStorage(STORAGE_KEY, { ...s, topics })
      return { topics }
    })
  },

  deleteTopic: (id) => {
    set((s) => {
      const topics = s.topics.filter((t) => t.id !== id)
      if (topicsEqual(s.topics, topics)) return {}
      const selectedTopicId = s.selectedTopicId === id ? null : s.selectedTopicId
      saveToStorage(STORAGE_KEY, { ...s, topics, selectedTopicId })
      return { topics, selectedTopicId }
    })
  },

  updateConfidence: (id, confidence) => {
    set((s) => {
      const topics = s.topics.map((t) =>
        t.id === id ? { ...t, confidence, updatedAt: nowISO() } : t
      )
      if (topicsEqual(s.topics, topics)) return {}
      saveToStorage(STORAGE_KEY, { ...s, topics })
      return { topics }
    })
  },

  addMaterial: (topicId, material) => {
    const newMaterial: StudyMaterial = {
      ...material, id: generateId(), createdAt: nowISO(),
    }
    set((s) => {
      const topics = s.topics.map((t) =>
        t.id === topicId
          ? { ...t, materials: [...t.materials, newMaterial], updatedAt: nowISO() }
          : t
      )
      if (topicsEqual(s.topics, topics)) return {}
      saveToStorage(STORAGE_KEY, { ...s, topics })
      return { topics }
    })
  },

  removeMaterial: (topicId, materialId) => {
    set((s) => {
      const topics = s.topics.map((t) =>
        t.id === topicId
          ? { ...t, materials: t.materials.filter((m) => m.id !== materialId), updatedAt: nowISO() }
          : t
      )
      if (topicsEqual(s.topics, topics)) return {}
      saveToStorage(STORAGE_KEY, { ...s, topics })
      return { topics }
    })
  },

  setSelectedTopicId: (id) => {
    set((s) => {
      if (s.selectedTopicId === id) return {}
      saveToStorage(STORAGE_KEY, { ...s, selectedTopicId: id })
      return { selectedTopicId: id }
    })
  },

  getTopicById: (id) => get().topics.find((t) => t.id === id),
  getTopicsByCategory: (categoryId) => get().topics.filter((t) => t.categoryId === categoryId),
  getTopicsCoveredPercent: () => {
    const { topics } = get()
    if (topics.length === 0) return 0
    return Math.round((topics.filter((t) => t.confidence >= 3).length / topics.length) * 100)
  },
}))