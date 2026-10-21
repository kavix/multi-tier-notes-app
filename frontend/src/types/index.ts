export interface HealthResponse {
  status: string;
  postgres: string;
  redis: string;
  worker: string;
}

export interface VisitsResponse {
  visits: number;
  source: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  word_count: number;
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface NotesResponse {
  notes: Note[];
  cached: boolean;
  source: string;
  ttl_remaining: number;
  count: number;
}

export interface NoteCreatePayload {
  title: string;
  content: string;
  tags: string[];
}

export interface NoteUpdatePayload {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface WorkerStatusResponse {
  queue_length: number;
  processed_count: number;
  worker_status: string;
}

export type TierStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
