// ============================================
// MEETINGS API
// API functions for meeting operations
// ============================================

import api from '../apiClient';
import type {
  Meeting,
  MeetingCreate,
  MeetingUpdate,
  MeetingWithParticipants,
  MeetingListResponse,
  MeetingFilters,
} from '../../shared/dto/meeting';

const ENDPOINT = '/meetings';

export const meetingsApi = {
  /**
   * List all meetings with optional filters
   */
  list: async (filters?: MeetingFilters): Promise<MeetingListResponse> => {
    return api.get<MeetingListResponse>(`${ENDPOINT}/`, filters as Record<string, string | number | undefined>);
  },

  /**
   * Get a single meeting by ID
   */
  get: async (id: string): Promise<MeetingWithParticipants> => {
    return api.get<MeetingWithParticipants>(`${ENDPOINT}/${id}`);
  },

  /**
   * Create a new meeting
   */
  create: async (data: MeetingCreate): Promise<Meeting> => {
    return api.post<Meeting>(`${ENDPOINT}/`, data);
  },

  /**
   * Update a meeting
   */
  update: async (id: string, data: MeetingUpdate): Promise<Meeting> => {
    return api.put<Meeting>(`${ENDPOINT}/${id}`, data);
  },

  /**
   * Delete a meeting
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`${ENDPOINT}/${id}`);
  },

  /**
   * Add participant to meeting
   */
  addParticipant: async (meetingId: string, userId: string, role: string = 'attendee'): Promise<Meeting> => {
    return api.post<Meeting>(`${ENDPOINT}/${meetingId}/participants`, null);
  },

  /**
   * Update meeting phase
   */
  updatePhase: async (id: string, phase: 'pre' | 'in' | 'post'): Promise<Meeting> => {
    return api.patch<Meeting>(`${ENDPOINT}/${id}/phase`, { phase });
  },
};

export default meetingsApi;
