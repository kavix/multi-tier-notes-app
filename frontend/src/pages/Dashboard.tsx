import { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  Eye,
  RefreshCw,
  Server,
  Database,
  HardDrive,
  Cpu,
} from 'lucide-react';
import HealthBar from '../components/HealthBar';
import WorkerBadge from '../components/WorkerBadge';
import { fetchHealth, fetchVisits, fetchWorkerStatus } from '../api/client';
import type { HealthResponse, VisitsResponse, WorkerStatusResponse, TierStatus } from '../types';

function parseTierStatus(value: string): TierStatus {
  const v = value.toLowerCase();
  if (v === 'healthy' || v === 'connected' || v === 'ok' || v === 'up') return 'healthy';
  if (v === 'degraded') return 'degraded';
  if (v === 'down' || v === 'disconnected' || v === 'error') return 'down';
  return 'unknown';
}

export default function Dashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [visits, setVisits] = useState<VisitsResponse | null>(null);
  const [worker, setWorker] = useState<WorkerStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, v, w] = await Promise.allSettled([
        fetchHealth(),
        fetchVisits(),
        fetchWorkerStatus(),
      ]);
      if (h.status === 'fulfilled') setHealth(h.value);
      if (v.status === 'fulfilled') setVisits(v.value);
      if (w.status === 'fulfilled') setWorker(w.value);

      if (h.status === 'rejected' && v.status === 'rejected' && w.status === 'rejected') {
        setError('Unable to connect to the backend. Make sure the server is running on port 8000.');
      }
    } catch {
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const tiers = health
    ? [
        { name: 'Backend API', status: parseTierStatus(health.status), icon: 'backend' as const },
        { name: 'Redis Cache', status: parseTierStatus(health.redis), icon: 'redis' as const },
        { name: 'PostgreSQL', status: parseTierStatus(health.postgres), icon: 'postgres' as const },
        { name: 'Go Worker', status: parseTierStatus(health.worker), icon: 'worker' as const },
      ]
    : [
        { name: 'Backend API', status: 'unknown' as TierStatus, icon: 'backend' as const },
        { name: 'Redis Cache', status: 'unknown' as TierStatus, icon: 'redis' as const },
        { name: 'PostgreSQL', status: 'unknown' as TierStatus, icon: 'postgres' as const },
        { name: 'Go Worker', status: 'unknown' as TierStatus, icon: 'worker' as const },
      ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Monitor the health of all tiers</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Health status */}
      <section>
        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          System Health
        </h2>
        <HealthBar tiers={tiers} />
      </section>

      {/* Stats cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visit counter */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Visits</p>
              <p className="text-2xl font-bold text-white">
                {visits ? visits.visits.toLocaleString() : '—'}
              </p>
            </div>
          </div>
          {visits && (
            <div className="text-xs text-gray-500">
              Source: <span className="text-gray-400">{visits.source}</span>
            </div>
          )}
        </div>

        {/* Worker status */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Worker Status</p>
              <div className="mt-1">
                {worker ? (
                  <WorkerBadge status={worker.worker_status} compact />
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>
            </div>
          </div>
          {worker && (
            <div className="text-xs text-gray-500">
              Processed: <span className="text-gray-400">{worker.processed_count}</span> jobs
            </div>
          )}
        </div>

        {/* Architecture overview */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Architecture</p>
              <p className="text-lg font-semibold text-white">4-Tier</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5" /> Python Backend (FastAPI)
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5" /> Redis Cache Layer
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5" /> PostgreSQL Database
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" /> Go Background Worker
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
