import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo' | 'pink' | 'cyan';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  loading?: boolean;
  onClick?: () => void;
  badge?: string;
  realTime?: boolean;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
  green: 'from-green-500 to-green-600 shadow-green-500/25',
  purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
  yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/25',
  red: 'from-red-500 to-red-600 shadow-red-500/25',
  indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/25',
  pink: 'from-pink-500 to-pink-600 shadow-pink-500/25',
  cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/25',
};

const iconColorClasses = {
  blue: 'text-blue-100',
  green: 'text-green-100',
  purple: 'text-purple-100',
  yellow: 'text-yellow-100',
  red: 'text-red-100',
  indigo: 'text-indigo-100',
  pink: 'text-pink-100',
  cyan: 'text-cyan-100',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  loading = false,
  onClick,
  badge,
  realTime = false
}) => {
  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up': return <TrendingUp className="w-3 h-3" />;
      case 'down': return <TrendingDown className="w-3 h-3" />;
      case 'neutral': return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      case 'neutral': return 'text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'relative overflow-hidden rounded-2xl p-6 shadow-lg cursor-pointer group',
        `bg-gradient-to-br ${colorClasses[color]}`,
        onClick && 'hover:shadow-xl transition-all duration-300'
      )}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white/90 tracking-wide">
                {title}
              </h3>
              {badge && (
                <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full font-medium">
                  {badge}
                </span>
              )}
              {realTime && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-xs text-white/80 font-medium">LIVE</span>
                </div>
              )}
            </div>
            
            <p className="text-3xl font-bold text-white mb-1 tracking-tight">
              {value}
            </p>
            
            {subtitle && (
              <p className="text-sm text-white/75 mb-2">
                {subtitle}
              </p>
            )}
            
            {trend && (
              <div className={clsx(
                'flex items-center space-x-1 text-xs font-medium',
                getTrendColor()
              )}>
                {getTrendIcon()}
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-white/60">vs last period</span>
              </div>
            )}
          </div>
          
          <div className={clsx(
            'p-3 rounded-xl bg-white/10 backdrop-blur-sm',
            iconColorClasses[color]
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};