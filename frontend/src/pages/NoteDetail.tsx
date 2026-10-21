import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  FileText,
  AlignLeft,
  Trash2,
  Edit3,
  Loader2,
} from 'lucide-react';
import { fetchNote, deleteNote } from '../api/client';
import type { Note } from '../types';

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadNote = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNote(Number(id));
      setNote(data);
    } catch {
      setError('Failed to load note. It may not exist.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteNote(Number(id));
      navigate('/notes', { replace: true });
    } catch {
      setError('Failed to delete note.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="space-y-4">
        <Link to="/notes" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Notes
        </Link>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400">{error || 'Note not found.'}</p>
          <Link to="/notes" className="btn-secondary inline-block mt-4">
            Go to Notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back navigation */}
      <Link to="/notes" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Notes
      </Link>

      {/* Note header */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">{note.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/notes/${note.id}`}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger flex items-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-6 flex-wrap text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Created: {formatDate(note.created_at)}
        </div>
        {note.updated_at && note.updated_at !== note.created_at && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Updated: {formatDate(note.updated_at)}
          </div>
        )}
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="w-4 h-4 text-gray-500" />
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="badge bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 py-1 px-3"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-6 p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-sm">
        {note.word_count > 0 && (
          <div className="flex items-center gap-2 text-gray-400">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-white">{note.word_count}</span> words
          </div>
        )}
        {note.summary && (
          <div className="flex items-center gap-2 text-gray-400">
            <AlignLeft className="w-4 h-4 text-purple-400" />
            Summary available
          </div>
        )}
      </div>

      {/* Summary */}
      {note.summary && (
        <div className="card border-purple-500/20 bg-purple-500/5">
          <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
            <AlignLeft className="w-4 h-4" />
            AI Summary (Go Worker)
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">{note.summary}</p>
        </div>
      )}

      {/* Content */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Content</h3>
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{note.content}</p>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Note</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete &ldquo;{note.title}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
