import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  Database,
  HardDrive,
  Clock,
  StickyNote,
  Filter,
} from 'lucide-react';
import NoteCard from '../components/NoteCard';
import { fetchNotes } from '../api/client';
import type { Note, NotesResponse } from '../types';

export default function Notes() {
  const [data, setData] = useState<NotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchNotes();
      setData(res);
    } catch {
      setError('Failed to load notes. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const allTags = useMemo(() => {
    if (!data?.notes) return [];
    const tagSet = new Set<string>();
    data.notes.forEach((n) => n.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [data]);

  const filteredNotes = useMemo(() => {
    if (!data?.notes) return [];
    let notes: Note[] = data.notes;

    if (search.trim()) {
      const q = search.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      );
    }

    if (selectedTag) {
      notes = notes.filter((n) => n.tags?.includes(selectedTag));
    }

    return notes;
  }, [data, search, selectedTag]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Notes</h1>
          <p className="text-gray-400 mt-1">
            {data ? `${data.count} note${data.count !== 1 ? 's' : ''}` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadNotes}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link to="/notes/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Note
          </Link>
        </div>
      </div>

      {/* Cache status banner */}
      {data && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
            data.cached
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
        >
          {data.cached ? (
            <HardDrive className="w-4 h-4 shrink-0" />
          ) : (
            <Database className="w-4 h-4 shrink-0" />
          )}
          <span>
            Served from <strong>{data.source}</strong>
          </span>
          {data.cached && data.ttl_remaining > 0 && (
            <span className="flex items-center gap-1 ml-auto text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              TTL: {data.ttl_remaining}s remaining
            </span>
          )}
        </div>
      )}

      {/* Search and filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <button
              onClick={() => setSelectedTag(null)}
              className={`badge border transition-colors ${
                !selectedTag
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`badge border transition-colors ${
                  tag === selectedTag
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Notes list */}
      {!loading && filteredNotes.length === 0 && data && (
        <div className="text-center py-20">
          <StickyNote className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400">
            {search || selectedTag ? 'No matching notes' : 'No notes yet'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {search || selectedTag
              ? 'Try adjusting your search or filter.'
              : 'Create your first note to get started.'}
          </p>
          {!search && !selectedTag && (
            <Link to="/notes/new" className="btn-primary inline-flex items-center gap-2 mt-6">
              <Plus className="w-4 h-4" />
              Create Note
            </Link>
          )}
        </div>
      )}

      {filteredNotes.length > 0 && (
        <div className="grid gap-4">
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
