import axios from 'axios';
import type {
  HealthResponse,
  VisitsResponse,
  NotesResponse,
  Note,
  NoteCreatePayload,
  NoteUpdatePayload,
  WorkerStatusResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/health');
  return data;
}

export async function fetchVisits(): Promise<VisitsResponse> {
  const { data } = await api.get<VisitsResponse>('/visits');
  return data;
}

export async function fetchNotes(): Promise<NotesResponse> {
  const { data } = await api.get<NotesResponse>('/notes');
  return data;
}

export async function fetchNote(id: number): Promise<Note> {
  const { data } = await api.get<Note>(`/notes/${id}`);
  return data;
}

export async function createNote(payload: NoteCreatePayload): Promise<Note> {
  const { data } = await api.post<Note>('/notes', payload);
  return data;
}

export async function updateNote(id: number, payload: NoteUpdatePayload): Promise<Note> {
  const { data } = await api.put<Note>(`/notes/${id}`, payload);
  return data;
}

export async function deleteNote(id: number): Promise<void> {
  await api.delete(`/notes/${id}`);
}

export async function fetchWorkerStatus(): Promise<WorkerStatusResponse> {
  const { data } = await api.get<WorkerStatusResponse>('/worker/status');
  return data;
}

export default api;
