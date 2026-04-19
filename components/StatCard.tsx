import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  trend,
  subtitle,
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/50',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
  };

  const selectedColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 transition-colors">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
              {typeof value === 'number' ? value.toFixed(2) : value}
            </h3>
            <span className="text-lg font-medium text-gray-500 dark:text-gray-400 transition-colors">{unit}</span>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg border transition-colors duration-300 ${selectedColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center gap-1 text-xs">
            {trend === 'up' && (
              <>
                <span className="text-green-600 dark:text-green-400">↑</span>
                <span className="text-gray-600 dark:text-gray-400">Trending up</span>
              </>
            )}
            {trend === 'down' && (
              <>
                <span className="text-red-600 dark:text-red-400">↓</span>
                <span className="text-gray-600 dark:text-gray-400">Trending down</span>
              </>
            )}
            {trend === 'stable' && (
              <>
                <span className="text-gray-400 dark:text-gray-500">→</span>
                <span className="text-gray-600 dark:text-gray-400">Stable</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}