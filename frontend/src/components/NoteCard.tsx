import { Link } from 'react-router-dom';
import { Clock, Tag, FileText, ArrowRight } from 'lucide-react';
import type { Note } from '../types';

interface NoteCardProps {
  note: Note;
}

export default function NoteCard({ note }: NoteCardProps) {
  const createdDate = new Date(note.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      to={`/notes/${note.id}`}
      className="card group hover:border-indigo-500/50 hover:shadow-indigo-500/5 transition-all duration-300 block"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-100 group-hover:text-indigo-400 transition-colors truncate">
            {note.title}
          </h3>
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">
            {note.content}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 transition-colors shrink-0 mt-1" />
      </div>

      <div className="flex items-center gap-4 mt-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          {createdDate}
        </div>

        {note.word_count > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <FileText className="w-3.5 h-3.5" />
            {note.word_count} words
          </div>
        )}

        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-gray-500" />
            <div className="flex gap-1.5 flex-wrap">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="badge bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
