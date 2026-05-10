import type { TopicCategory } from '@/types/topic'
import type { ApplicationStage } from '@/types/application'

export const DEFAULT_CATEGORIES: TopicCategory[] = [
  { id: 'dsa', name: 'Data Structures & Algorithms', description: 'Arrays, trees, graphs, DP, etc.' },
  { id: 'system-design', name: 'System Design', description: 'Distributed systems, scalability, architecture' },
  { id: 'behavioral', name: 'Behavioral', description: 'STAR method, leadership, conflict resolution' },
  { id: 'cloud-devops', name: 'Cloud & DevOps', description: 'AWS, Docker, K8s, CI/CD' },
  { id: 'ai-ml', name: 'AI & Machine Learning', description: 'ML basics, LLMs, MLOps' },
  { id: 'domain', name: 'Domain Knowledge', description: 'Industry-specific topics' },
]

export const APPLICATION_DEFAULT_STAGES: ApplicationStage[] = [
  'wishlist', 'applied', 'phone_screen', 'online_assessment',
  'technical_interview', 'onsite', 'offer',
]

export const STUDY_TIME_SLOTS = [15, 30, 45, 60, 90, 120]