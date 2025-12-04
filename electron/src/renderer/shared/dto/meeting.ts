export type MeetingPhase = 'pre' | 'in' | 'post'

export type Meeting = {
  id: string
  title: string
  phase: MeetingPhase
  scheduledAt?: string
}