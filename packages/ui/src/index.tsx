import React from 'react';
import type { RiskLevel, ConfidenceLevel } from '@landslide/types';

export interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function getRiskLevelStyles(level: RiskLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-950/80',
        text: 'text-red-300',
        border: 'border-red-600'
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-950/80',
        text: 'text-orange-300',
        border: 'border-orange-500'
      };
    case 'MEDIUM':
      return {
        bg: 'bg-yellow-950/80',
        text: 'text-yellow-300',
        border: 'border-yellow-500'
      };
    case 'LOW':
    default:
      return {
        bg: 'bg-emerald-950/80',
        text: 'text-emerald-300',
        border: 'border-emerald-600'
      };
  }
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  const styles = getRiskLevelStyles(level);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${styles.bg} ${styles.text} ${styles.border} ${className}`}
    >
      {level}
    </span>
  );
};

export interface ConfidenceIndicatorProps {
  confidence: ConfidenceLevel;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ confidence }) => {
  const bars = confidence === 'HIGH' ? 3 : confidence === 'MEDIUM' ? 2 : 1;
  return (
    <div className="flex items-center gap-1" title={`Confidence: ${confidence}`}>
      <span className="text-xs text-slate-400 font-mono mr-1">{confidence}</span>
      <div className="flex items-end gap-0.5 h-3">
        <div className="w-1 h-1.5 bg-sky-400 rounded-xs" />
        <div className={`w-1 h-2.5 rounded-xs ${bars >= 2 ? 'bg-sky-400' : 'bg-slate-700'}`} />
        <div className={`w-1 h-3 rounded-xs ${bars >= 3 ? 'bg-sky-400' : 'bg-slate-700'}`} />
      </div>
    </div>
  );
};
