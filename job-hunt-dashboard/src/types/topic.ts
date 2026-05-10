export interface TopicCategory {
  id: string
  name: string
  description: string
}

export interface StudyMaterial {
  id: string
  type: 'article' | 'video' | 'book' | 'course' | 'note' | 'link'
  title: string
  url?: string
  notes: string
  createdAt: string
}

export interface Topic {
  id: string
  categoryId: string
  name: string
  confidence: 1 | 2 | 3 | 4 | 5
  materials: StudyMaterial[]
  acceptedQuestionIds: string[]
  deadlineId?: string
  createdAt: string
  updatedAt: string
}