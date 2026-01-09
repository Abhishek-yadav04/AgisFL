import React from 'react'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'orbit'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'cyan'
  text?: string
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'spinner',
  color = 'blue',
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: { container: 'w-6 h-6', dot: 'w-1.5 h-1.5', bar: 'w-1 h-4' },
    md: { container: 'w-10 h-10', dot: 'w-2.5 h-2.5', bar: 'w-1.5 h-6' },
    lg: { container: 'w-16 h-16', dot: 'w-4 h-4', bar: 'w-2 h-8' },
    xl: { container: 'w-24 h-24', dot: 'w-6 h-6', bar: 'w-3 h-12' }
  }

  const colorClasses = {
    blue: {
      primary: 'border-blue-500 bg-blue-500',
      secondary: 'border-blue-300 bg-blue-300',
      gradient: 'from-blue-400 to-cyan-400'
    },
    green: {
      primary: 'border-green-500 bg-green-500',
      secondary: 'border-green-300 bg-green-300',
      gradient: 'from-green-400 to-emerald-400'
    },
    red: {
      primary: 'border-red-500 bg-red-500',
      secondary: 'border-red-300 bg-red-300',
      gradient: 'from-red-400 to-pink-400'
    },
    yellow: {
      primary: 'border-yellow-500 bg-yellow-500',
      secondary: 'border-yellow-300 bg-yellow-300',
      gradient: 'from-yellow-400 to-orange-400'
    },
    purple: {
      primary: 'border-purple-500 bg-purple-500',
      secondary: 'border-purple-300 bg-purple-300',
      gradient: 'from-purple-400 to-pink-400'
    },
    cyan: {
      primary: 'border-cyan-500 bg-cyan-500',
      secondary: 'border-cyan-300 bg-cyan-300',
      gradient: 'from-cyan-400 to-blue-400'
    }
  }

  const renderSpinner = () => {
    const colors = colorClasses[color]
    const sizes = sizeClasses[size]

    switch (variant) {
      case 'dots':
        return (
          <div className={`flex space-x-1 ${sizes.container}`}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`${sizes.dot} ${colors.primary} rounded-full`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        )

      case 'pulse':
        return (
          <motion.div
            className={`${sizes.container} bg-gradient-to-r ${colors.gradient} rounded-full`}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )

      case 'bars':
        return (
          <div className={`flex items-end space-x-1 ${sizes.container}`}>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`${sizes.bar} ${colors.primary} rounded-sm`}
                animate={{
                  scaleY: [1, 2, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        )

      case 'orbit':
        return (
          <div className={`relative ${sizes.container}`}>
            <motion.div
              className={`absolute inset-0 border-2 ${colors.secondary} rounded-full opacity-20`}
            />
            <motion.div
              className={`absolute inset-1 border-2 ${colors.primary} border-t-transparent rounded-full`}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div
              className={`absolute top-0 left-1/2 w-2 h-2 ${colors.primary} rounded-full transform -translate-x-1/2`}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{ transformOrigin: `0 ${parseInt(sizes.container.split(' ')[0].replace('w-', '')) * 2}px` }}
            />
          </div>
        )

      default: // spinner
        return (
          <div className="relative">
            <motion.div
              className={`${sizes.container} border-3 ${colors.secondary} border-t-transparent rounded-full`}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div
              className={`absolute inset-1 border-2 ${colors.primary} border-t-transparent border-r-transparent rounded-full`}
              animate={{ rotate: -360 }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>
        )
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {renderSpinner()}
      </motion.div>
      {text && (
        <motion.p 
          className="text-gray-400 mt-4 text-sm font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

export default LoadingSpinner