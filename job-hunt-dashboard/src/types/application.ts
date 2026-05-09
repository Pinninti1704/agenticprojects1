export type ApplicationStage =
  | 'wishlist' | 'applied' | 'phone_screen' | 'online_assessment'
  | 'technical_interview' | 'onsite' | 'offer' | 'rejected' | 'withdrawn'

export const APPLICATION_STAGES: ApplicationStage[] = [
  'wishlist', 'applied', 'phone_screen', 'online_assessment',
  'technical_interview', 'onsite', 'offer', 'rejected', 'withdrawn',
]

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  wishlist: 'Wishlist', applied: 'Applied', phone_screen: 'Phone Screen',
  online_assessment: 'Online Assessment', technical_interview: 'Technical Interview',
  onsite: 'Onsite', offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn',
}

export const STAGE_COLORS: Record<ApplicationStage, string> = {
  wishlist: '#6b7280', applied: '#3b82f6', phone_screen: '#f59e0b',
  online_assessment: '#8b5cf6', technical_interview: '#ec4899',
  onsite: '#6366f1', offer: '#22c55e', rejected: '#ef4444', withdrawn: '#6b7280',
}

export interface JobApplication {
  id: string
  company: string
  role: string
  stage: ApplicationStage
  notes: string
  nextFollowUp?: string
  url?: string
  createdAt: string
  updatedAt: string
}