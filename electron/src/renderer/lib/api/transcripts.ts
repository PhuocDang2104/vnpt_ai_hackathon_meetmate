/**
 * Transcripts API Client
 */
import { apiClient } from '../apiClient';

export interface TranscriptChunk {
  id: string;
  meeting_id: string;
  chunk: string;
  speaker: string;
  time_start: number;
  time_end: number;
  is_final: boolean;
  confidence?: number;
  lang?: string;
  question?: boolean;
  seq?: number;
  created_at?: string;
}

export interface TranscriptChunksResponse {
  chunks: TranscriptChunk[];
  total: number;
}

/**
 * List transcript chunks for a meeting
 */
export const list = async (meetingId: string): Promise<TranscriptChunksResponse> => {
  const response = await apiClient.get(`/transcripts/meeting/${meetingId}/chunks`);
  return response.data;
};

/**
 * Ingest a single transcript chunk
 */
export const ingest = async (meetingId: string, chunk: Omit<TranscriptChunk, 'id' | 'created_at'>): Promise<void> => {
  await apiClient.post(`/transcripts/${meetingId}/chunks`, chunk);
};

/**
 * Extract actions/decisions/risks from transcript
 */
export const extract = async (meetingId: string): Promise<{
  actions: any[];
  decisions: any[];
  risks: any[];
}> => {
  const response = await apiClient.post(`/transcripts/${meetingId}/extract`);
  return response.data;
};

export const transcriptsApi = {
  list,
  ingest,
  extract,
};

export default transcriptsApi;

