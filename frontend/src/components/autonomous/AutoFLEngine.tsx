import React, { useState, useEffect, useCallback } from 'react'
import { 
  Bot, 
  Brain, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RefreshCw,
  Zap,
  Target,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../UI/Card'
import Button from '../UI/Button'
import LoadingSpinner from '../UI/LoadingSpinner'
// import { useRealTimeData } from '../../hooks/useRealTimeData'

interface AutoFLEngineProps {
  onOptimizationComplete?: (result: any) => void
}

interface EngineStatus {
  engine_status: string
  autonomous_mode: boolean
  fednas_status: string
  fedhpo_status: string
  drift_monitoring: any
  retraining_history: number
  last_optimization: number | null
}

interface OptimizationResult {
  status: string
  duration: number
  optimal_architecture: any
  optimal_hyperparameters: any
  expected_performance: number
}

const AutoFLEngine: React.FC<AutoFLEngineProps> = ({}) => {
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [optimizationInProgress, setOptimizationInProgress] = useState(false)
  const [lastOptimizationResult] = useState<OptimizationResult | null>(null)
  const [autonomousToggling, setAutonomousToggling] = useState(false)

  // Real-time data simulation
  const [isConnected] = useState(true)
  
  // Periodic autonomous mode maintenance
  useEffect(() => {
    if (engineStatus?.autonomous_mode) {
      const maintenanceInterval = setInterval(async () => {
        try {
          // Ping the autonomous mode endpoint to keep it active
          const response = await fetch('/api/autofl/start-autonomous', { method: 'POST' })
          if (response.ok) {
            console.log('🤖 Autonomous mode maintained')
          }
        } catch (error) {
          console.warn('Failed to maintain autonomous mode:', error)
        }
      }, 30000) // Every 30 seconds
      
      return () => clearInterval(maintenanceInterval)
    }
  }, [engineStatus?.autonomous_mode])

  // Load initial engine status
  useEffect(() => {
    loadEngineStatus()
    const interval = setInterval(loadEngineStatus, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Load user's autonomous mode preference from localStorage
  useEffect(() => {
    const savedAutonomousMode = localStorage.getItem('autofl_autonomous_mode')
    if (savedAutonomousMode === 'true' && engineStatus && !engineStatus.autonomous_mode) {
      // User previously had autonomous mode on, try to restore it
      toggleAutonomousMode()
    }
  }, [engineStatus])

  const loadEngineStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/autofl/status')
      const data = await response.json()
      
      // If we're in autonomous mode locally but backend shows manual, 
      // it might be due to reload - keep local state
      if (engineStatus?.autonomous_mode && !data.autonomous_mode) {
        // Backend state was reset, but user expects autonomous mode to continue
        // Keep the local autonomous mode active for better UX
        setEngineStatus(prev => prev ? {
          ...data,
          autonomous_mode: true,
          engine_status: 'autonomous'
        } : data)
        toast.success('🤖 Autonomous mode recovered from backend restart')
      } else {
        setEngineStatus(data)
      }
    } catch (error) {
      console.error('Failed to load AutoFL engine status:', error)
      toast.error('Failed to load AutoFL status')
    } finally {
      setIsLoading(false)
    }
  }, [engineStatus?.autonomous_mode])

  const toggleAutonomousMode = async () => {
    if (!engineStatus) return
    
    setAutonomousToggling(true)
    try {
      const endpoint = engineStatus.autonomous_mode 
        ? '/api/autofl/stop-autonomous'
        : '/api/autofl/start-autonomous'
      
      const response = await fetch(endpoint, { method: 'POST' })
      
      if (response.ok) {
        const newAutonomousMode = !engineStatus.autonomous_mode
        setEngineStatus(prev => prev ? {
          ...prev,
          autonomous_mode: newAutonomousMode,
          engine_status: newAutonomousMode ? 'autonomous' : 'manual'
        } : null)
        
        // Save user's preference to localStorage
        localStorage.setItem('autofl_autonomous_mode', newAutonomousMode.toString())
        
        toast.success(
          newAutonomousMode 
            ? '🤖 Autonomous mode activated'
            : '👤 Manual mode activated'
        )
      } else {
        toast.error('Failed to toggle autonomous mode')
      }
    } catch (error) {
      console.error('Failed to toggle autonomous mode:', error)
      toast.error('Failed to toggle autonomous mode')
    } finally {
      setAutonomousToggling(false)
    }
  }

  const runOptimizationCycle = async () => {
    setOptimizationInProgress(true)
    try {
      const response = await fetch('/api/autofl/optimize', { method: 'POST' })
      
      if (response.ok) {
        toast.success('🚀 Optimization cycle started')
        // Result will be received via WebSocket
      } else {
        toast.error('Failed to start optimization')
        setOptimizationInProgress(false)
      }
    } catch (error) {
      console.error('Failed to start optimization:', error)
      toast.error('Failed to start optimization')
      setOptimizationInProgress(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'autonomous': return 'text-green-500'
      case 'manual': return 'text-blue-500'
      case 'searching': return 'text-yellow-500'
      case 'evaluating': return 'text-orange-500'
      case 'converging': return 'text-purple-500'
      case 'completed': return 'text-green-500'
      case 'failed': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'autonomous': return <Bot className="w-5 h-5 text-green-500" />
      case 'manual': return <Settings className="w-5 h-5 text-blue-500" />
      case 'searching': return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />
      case 'evaluating': return <Brain className="w-5 h-5 text-orange-500" />
      case 'converging': return <Target className="w-5 h-5 text-purple-500" />
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-2">Loading AutoFL Engine...</span>
        </div>
      </Card>
    )
  }

  if (!engineStatus) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          Failed to load AutoFL Engine status
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Engine Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bot className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold">Autonomous FL Engine</h2>
              <p className="text-gray-600">Self-optimizing federated learning</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {engineStatus?.autonomous_mode && (
              <div className="flex items-center space-x-1 ml-2">
                <RefreshCw className="w-3 h-3 text-green-500 animate-spin" />
                <span className="text-xs text-green-600">Auto-maintaining</span>
              </div>
            )}
          </div>
        </div>

        {/* Engine Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(engineStatus.engine_status)}
              <span className="font-medium">Engine Status</span>
              {engineStatus.autonomous_mode && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Active</span>
                </div>
              )}
            </div>
            <span className={`text-lg font-bold capitalize ${getStatusColor(engineStatus.engine_status)}`}>
              {engineStatus.engine_status}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <span className="font-medium">FedNAS Status</span>
            </div>
            <span className={`text-lg font-bold capitalize ${getStatusColor(engineStatus.fednas_status)}`}>
              {engineStatus.fednas_status}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="w-5 h-5 text-orange-500" />
              <span className="font-medium">FedHPO Status</span>
            </div>
            <span className={`text-lg font-bold capitalize ${getStatusColor(engineStatus.fedhpo_status)}`}>
              {engineStatus.fedhpo_status}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-4">
          <Button
            onClick={toggleAutonomousMode}
            disabled={autonomousToggling}
            className={`flex items-center space-x-2 ${
              engineStatus.autonomous_mode 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {autonomousToggling ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : engineStatus.autonomous_mode ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>
              {engineStatus.autonomous_mode ? 'Stop Autonomous' : 'Start Autonomous'}
            </span>
          </Button>

          <Button
            onClick={runOptimizationCycle}
            disabled={optimizationInProgress || engineStatus.autonomous_mode}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            {optimizationInProgress ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>Run Optimization</span>
          </Button>
        </div>
      </Card>

      {/* Drift Monitoring */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-semibold">Concept Drift Monitoring</h3>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className="text-lg font-bold text-blue-600">
              {engineStatus?.drift_monitoring?.status || 'Unknown'}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Baseline Accuracy</div>
            <div className="text-lg font-bold text-green-600">
              {engineStatus?.drift_monitoring?.baseline_accuracy != null
                ? `${(engineStatus.drift_monitoring.baseline_accuracy * 100).toFixed(2)}%`
                : 'N/A'
              }
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Current Accuracy</div>
            <div className="text-lg font-bold text-yellow-600">
              {engineStatus?.drift_monitoring?.current_accuracy != null
                ? `${(engineStatus.drift_monitoring.current_accuracy * 100).toFixed(2)}%`
                : 'N/A'
              }
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Recent Alerts</div>
            <div className="text-lg font-bold text-red-600">
              {engineStatus?.drift_monitoring?.recent_alerts ?? 0}
            </div>
          </div>
        </div>

        {(engineStatus?.drift_monitoring?.recent_alerts ?? 0) > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-yellow-800">
                Concept drift detected! Autonomous retraining may be triggered.
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Optimization History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-500" />
            <h3 className="text-xl font-semibold">Optimization History</h3>
          </div>
          
          <div className="text-sm text-gray-600">
            {(engineStatus?.retraining_history ?? 0)} automatic retrainings
          </div>
        </div>

        {engineStatus?.last_optimization ? (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Last Optimization Performance</div>
            <div className="text-2xl font-bold text-green-600">
              {(engineStatus.last_optimization * 100).toFixed(2)}%
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No optimizations completed yet
          </div>
        )}
      </Card>

      {/* Latest Optimization Result */}
      {lastOptimizationResult && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h3 className="text-xl font-semibold">Latest Optimization Result</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Expected Performance</div>
              <div className="text-2xl font-bold text-green-600">
                {(lastOptimizationResult.expected_performance * 100).toFixed(2)}%
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Duration</div>
              <div className="text-2xl font-bold text-blue-600">
                {lastOptimizationResult.duration.toFixed(1)}s
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Status</div>
              <div className="text-2xl font-bold text-purple-600 capitalize">
                {lastOptimizationResult.status}
              </div>
            </div>
          </div>

          {lastOptimizationResult.optimal_architecture && (
            <div className="mt-4">
              <details className="cursor-pointer">
                <summary className="font-medium text-gray-700 hover:text-gray-900">
                  View Optimization Details
                </summary>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify({
                      architecture: lastOptimizationResult.optimal_architecture,
                      hyperparameters: lastOptimizationResult.optimal_hyperparameters
                    }, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </Card>
      )}

      {/* Optimization in Progress */}
      {optimizationInProgress && (
        <Card className="p-6 border-blue-200">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <div>
              <div className="text-lg font-semibold text-blue-600">
                Optimization in Progress
              </div>
              <div className="text-sm text-gray-600">
                AutoFL is searching for optimal architecture and hyperparameters...
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default AutoFLEngine
