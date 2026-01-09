import React from 'react'

interface AgisIconProps {
  size?: number
  className?: string
  variant?: 'default' | 'gradient' | 'outline'
}

const AgisIcon: React.FC<AgisIconProps> = ({ 
  size = 24, 
  className = '',
  variant = 'default'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'gradient':
        return 'fill-gradient-to-br from-blue-400 to-cyan-400'
      case 'outline':
        return 'fill-none stroke-current stroke-2'
      default:
        return 'fill-current'
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${getVariantStyles()} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle
        cx="50"
        cy="50"
        r="45"
        className={variant === 'gradient' ? 'fill-blue-600' : 'fill-current'}
        opacity="0.1"
      />
      
      {/* Main A Shape */}
      <path
        d="M25 75 L35 45 L40 45 L50 75 L45 75 L42 65 L33 65 L30 75 Z M35 55 L39 55 L37.5 50 Z"
        className={variant === 'gradient' ? 'fill-blue-400' : 'fill-current'}
      />
      
      {/* F Shape */}
      <path
        d="M55 45 L55 75 L60 75 L60 62 L70 62 L70 57 L60 57 L60 50 L72 50 L72 45 Z"
        className={variant === 'gradient' ? 'fill-cyan-400' : 'fill-current'}
      />
      
      {/* Neural Network Nodes */}
      <circle cx="20" cy="30" r="3" className="fill-blue-400" opacity="0.8" />
      <circle cx="35" cy="25" r="2.5" className="fill-cyan-400" opacity="0.8" />
      <circle cx="50" cy="20" r="3" className="fill-blue-400" opacity="0.8" />
      <circle cx="65" cy="25" r="2.5" className="fill-cyan-400" opacity="0.8" />
      <circle cx="80" cy="30" r="3" className="fill-blue-400" opacity="0.8" />
      
      {/* Connection Lines */}
      <line x1="20" y1="30" x2="35" y2="25" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="35" y1="25" x2="50" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="50" y1="20" x2="65" y2="25" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="65" y1="25" x2="80" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      
      {/* Security Shield */}
      <path
        d="M75 80 L75 85 C75 87 77 89 80 89 C83 89 85 87 85 85 L85 80 C85 78 83 76 80 76 C77 76 75 78 75 80 Z"
        className="fill-yellow-400"
        opacity="0.7"
      />
      
      {/* Data Flow Indicators */}
      <circle cx="15" cy="60" r="1.5" className="fill-green-400">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="85" cy="60" r="1.5" className="fill-green-400">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

export default AgisIcon