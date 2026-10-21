import { useEffect, useState, useCallback } from 'react';
import {
  Cpu,
  RefreshCw,
  Inbox,
  CheckCircle2,
  Activity,
  Zap,
} from 'lucide-react';
import WorkerBadge from '../components/WorkerBadge';
import { fetchWorkerStatus } from '../api/client';
import type { WorkerStatusResponse } from '../types';

export default function WorkerStatus() {
  const [data, setData] = useState<WorkerStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWorkerStatus();
      setData(res);
    } catch {
      setError('Failed to fetch worker status. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Worker Status</h1>
          <p className="text-gray-400 mt-1">Monitor the Go background worker</p>
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

      {data && (
        <>
          {/* Status badge */}
          <div className="card flex items-center gap-6">
            <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Cpu className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Worker Process</p>
              <WorkerBadge status={data.worker_status} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-sm text-gray-400">Queue Length</p>
              </div>
              <p className="text-4xl font-bold text-white">{data.queue_length}</p>
              <p className="text-xs text-gray-500 mt-2">
                {data.queue_length === 0
                  ? 'All jobs processed'
                  : `${data.queue_length} job${data.queue_length !== 1 ? 's' : ''} waiting`}
              </p>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm text-gray-400">Processed</p>
              </div>
              <p className="text-4xl font-bold text-white">{data.processed_count}</p>
              <p className="text-xs text-gray-500 mt-2">Total jobs completed</p>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm text-gray-400">Throughput</p>
              </div>
              <p className="text-4xl font-bold text-white">
                {data.processed_count > 0 ? '~' : ''}
                {data.processed_count}
              </p>
              <p className="text-xs text-gray-500 mt-2">Jobs processed total</p>
            </div>
          </div>

          {/* Worker info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              Worker Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-sm text-gray-400">Language</span>
                <span className="text-sm text-gray-200 font-medium">Go</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-sm text-gray-400">Capabilities</span>
                <span className="text-sm text-gray-200 font-medium">Word Count, Summarization</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-sm text-gray-400">Queue Backend</span>
                <span className="text-sm text-gray-200 font-medium">Redis</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-400">Auto-refresh</span>
                <span className="text-sm text-gray-200 font-medium">Every 10 seconds</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
