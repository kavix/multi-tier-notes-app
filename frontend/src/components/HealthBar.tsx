import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Database,
  Server,
  Cpu,
  HardDrive,
} from 'lucide-react';
import type { TierStatus } from '../types';

interface TierInfo {
  name: string;
  status: TierStatus;
  icon: 'backend' | 'redis' | 'postgres' | 'worker';
}

interface HealthBarProps {
  tiers: TierInfo[];
}

const iconMap = {
  backend: Server,
  redis: HardDrive,
  postgres: Database,
  worker: Cpu,
};

const statusConfig: Record<TierStatus, { color: string; bgColor: string; borderColor: string; Icon: typeof CheckCircle2 }> = {
  healthy: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    Icon: CheckCircle2,
  },
  degraded: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    Icon: AlertTriangle,
  },
  down: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    Icon: XCircle,
  },
  unknown: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    Icon: HelpCircle,
  },
};

export default function HealthBar({ tiers }: HealthBarProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {tiers.map((tier) => {
        const config = statusConfig[tier.status];
        const TierIcon = iconMap[tier.icon];
        const StatusIcon = config.Icon;

        return (
          <div
            key={tier.name}
            className={`${config.bgColor} border ${config.borderColor} rounded-xl p-4 flex items-center gap-4 transition-all duration-300`}
          >
            <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
              <TierIcon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{tier.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
                <span className={`text-xs font-medium capitalize ${config.color}`}>
                  {tier.status}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
