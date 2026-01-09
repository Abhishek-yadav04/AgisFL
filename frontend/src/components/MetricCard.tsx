import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid'

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'primary' | 'success' | 'warning' | 'error'
  loading?: boolean
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend = 'neutral',
  trendValue,
  color = 'primary',
  loading = false,
}) => {
  const colorClasses = {
    primary: 'text-primary-400',
    success: 'text-success-400',
    warning: 'text-warning-400',
    error: 'text-error-400',
  }

  const trendClasses = {
    up: 'text-success-400',
    down: 'text-error-400',
    neutral: 'text-gray-400',
  }

  const TrendIcon = {
    up: ArrowUpIcon,
    down: ArrowDownIcon,
    neutral: MinusIcon,
  }[trend]

  if (loading) {
    return (
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <div className="loading-skeleton h-4 w-20" />
          <div className="loading-skeleton h-6 w-6 rounded" />
        </div>
        <div className="loading-skeleton h-8 w-16 mb-2" />
        <div className="loading-skeleton h-3 w-24" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="metric-card group"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="metric-label">{title}</h3>
        <div className={`p-2 rounded-lg bg-gray-700/50 group-hover:bg-gray-700 transition-colors ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className="metric-value">{value}</div>
          {trendValue && (
            <div className={`flex items-center text-sm font-medium ${trendClasses[trend]}`}>
              <TrendIcon className="w-3 h-3 mr-1" />
              {trendValue}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default MetricCard