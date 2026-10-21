import { Cpu } from 'lucide-react';

interface WorkerBadgeProps {
  status: string;
  compact?: boolean;
}

export default function WorkerBadge({ status, compact = false }: WorkerBadgeProps) {
  const isActive = status === 'active' || status === 'running' || status === 'healthy';
  const isIdle = status === 'idle';

  const color = isActive
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : isIdle
      ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      : 'text-red-400 bg-red-500/10 border-red-500/30';

  if (compact) {
    return (
      <span className={`badge border ${color} gap-1.5`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : isIdle ? 'bg-yellow-400' : 'bg-red-400'}`} />
        {status}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${color}`}>
      <Cpu className="w-4 h-4" />
      <span className="text-sm font-medium capitalize">{status}</span>
    </div>
  );
}
