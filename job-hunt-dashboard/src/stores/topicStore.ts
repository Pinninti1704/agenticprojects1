import { create } from 'zustand'
import type { Topic, TopicCategory, StudyMaterial } from '@/types/topic'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import { generateId, nowISO } from '@/lib/utils'
import { loadFromStorage, saveToStorage } from '@/services/storage'

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
      const next = { topics: [...s.topics, topic] }
      saveToStorage(STORAGE_KEY, { ...s, ...next })
      return next
    })
    return topic
  },

  updateTopic: (id, updates) => {
    set((s) => {
      const topics = s.topics.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: nowISO() } : t
      )
      saveToStorage(STORAGE_KEY, { ...s, topics })
      return { topics }
    })
  },

  deleteTopic: (id) => {
    set((s) => {
      const topics = s.topics.filter((t) => t.id !== id)
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
      saveToStorage(STORAGE_KEY, { ...s, topics })
      return { topics }
    })
  },

  addMaterial: (topicId, material) => {
    const newMaterial: StudyMaterial = {
      ...material,
      id: generateId(),
      createdAt: nowISO(),
    }
    set((s) => {
      const topics = s.topics.map((t) =>
        t.id === topicId
          ? { ...t, materials: [...t.materials, newMaterial], updatedAt: nowISO() }
          : t
      )
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
      saveToStorage(STORAGE_KEY, { ...s, topics })
      return { topics }
    })
  },

  setSelectedTopicId: (id) => {
    set((s) => {
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