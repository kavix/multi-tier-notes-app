import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, StickyNote } from 'lucide-react';
import NoteForm from '../components/NoteForm';
import { createNote } from '../api/client';
import type { NoteCreatePayload } from '../types';

export default function CreateNote() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: NoteCreatePayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const note = await createNote(payload);
      navigate(`/notes/${note.id}`, { replace: true });
    } catch {
      setError('Failed to create note. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/notes" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Notes
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
          <StickyNote className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Create Note</h1>
          <p className="text-gray-400 text-sm mt-0.5">Add a new note to your collection</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="card">
        <NoteForm onSubmit={handleSubmit} isSubmitting={submitting} />
      </div>
    </div>
  );
}
