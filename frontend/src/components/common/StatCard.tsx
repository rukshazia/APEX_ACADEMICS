import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = false,
}) => {
  return (
    <div
      className={`p-5 rounded-xl border transition-all ${
        highlight
          ? 'bg-status-warning/5 border-status-warning/30 shadow-card'
          : 'bg-white border-brd shadow-subtle hover:border-brd/90 hover:shadow-card'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-txt-muted">
            {title}
          </p>
          <h3 className="text-2xl font-bold tracking-tight text-txt-primary">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-txt-secondary leading-snug">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-bg-highlight text-navy-800 border border-brd shrink-0">
            <Icon className="w-5 h-5 text-brand-blue" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3.5 pt-3 border-t border-brd-subtle flex items-center text-xs">
          <span
            className={`font-semibold inline-flex items-center space-x-1 ${
              trend.positive ? 'text-status-success' : 'text-status-danger'
            }`}
          >
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span>{trend.value}</span>
          </span>
          <span className="ml-1.5 text-txt-muted">vs previous term</span>
        </div>
      )}
    </div>
  );
};
