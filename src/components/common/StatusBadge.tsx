import React from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Star } from 'lucide-react';

export interface StatusBadgeProps {
  status: string;
  type?: 'tender' | 'submission' | 'evaluation' | 'compliance';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfigs = {
  tender: {
    voorbereiding: { color: 'bg-gray-100 text-gray-800', icon: Clock },
    concept: { color: 'bg-gray-100 text-gray-800', icon: Clock },
    gepubliceerd: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    actief: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    gesloten: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    'in-beoordeling': { color: 'bg-orange-100 text-orange-800', icon: Clock },
    beoordeeld: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
    'juridisch-getoetst': { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
    gegund: { color: 'bg-green-100 text-green-800', icon: Star },
    afgerond: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
  },
  submission: {
    ingediend: { color: 'bg-blue-100 text-blue-800', icon: Clock },
    'in-behandeling': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    goedgekeurd: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    afgewezen: { color: 'bg-red-100 text-red-800', icon: XCircle },
    gegund: { color: 'bg-purple-100 text-purple-800', icon: Star }
  },
  evaluation: {
    aanwezig: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    inconsistent: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
    ontbreekt: { color: 'bg-red-100 text-red-800', icon: XCircle }
  },
  compliance: {
    compliant: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    'niet-compliant': { color: 'bg-red-100 text-red-800', icon: XCircle },
    onduidelijk: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
  }
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-2 py-1 text-sm',
  lg: 'px-3 py-1 text-base'
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

export default function StatusBadge({ 
  status, 
  type = 'tender', 
  size = 'md', 
  showIcon = true 
}: StatusBadgeProps) {
  const config = statusConfigs[type]?.[status as keyof typeof statusConfigs[typeof type]] || 
    { color: 'bg-gray-100 text-gray-800', icon: Clock };
  
  const Icon = config.icon;
  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${config.color} ${sizeClasses[size]}`}>
      {showIcon && <Icon className={`mr-1 ${iconSizes[size]}`} />}
      {displayStatus}
    </span>
  );
}