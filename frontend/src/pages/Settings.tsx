import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Shield, Bell, Save, Eye, EyeOff, Activity, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import AgisIcon from '../components/UI/AgisIcon'
import toast from 'react-hot-toast'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [profileData, setProfileData] = useState({
    full_name: 'Administrator',
    email: 'admin@agisfl.com',
    username: 'admin',
    role: 'admin'
  })

  const [securityData, setSecurityData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    two_factor_enabled: false,
    session_timeout: 30
  })

  const [notificationData, setNotificationData] = useState({
    email_notifications: true,
    security_alerts: true,
    system_updates: true,
    fl_training_updates: true
  })

  const [apiMonitoringData, setApiMonitoringData] = useState({
    endpoints: [],
    logs: [],
    total: 0,
    healthy: 0,
    degraded: 0,
    failed: 0
  })

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'api-monitoring', name: 'API Monitoring', icon: Activity }
  ]

  const saveSettings = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch API monitoring data
  useEffect(() => {
    const fetchApiMonitoringData = async () => {
      try {
        const [endpointsResponse, logsResponse] = await Promise.all([
          fetch('http://localhost:8000/api/ecosystem/endpoints'),
          fetch('http://localhost:8000/api/ecosystem/logs')
        ])

        if (endpointsResponse.ok) {
          const endpointsData = await endpointsResponse.json()
          setApiMonitoringData(prev => ({
            ...prev,
            ...endpointsData
          }))
        }

        if (logsResponse.ok) {
          const logsData = await logsResponse.json()
          setApiMonitoringData(prev => ({
            ...prev,
            logs: logsData.logs
          }))
        }
      } catch (error) {
        console.error('Failed to fetch API monitoring data:', error)
      }
    }

    fetchApiMonitoringData()
    const interval = setInterval(fetchApiMonitoringData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
          <AgisIcon size={32} className="text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Profile Information</h3>
          <p className="text-gray-400">Update your account details</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
          <input
            type="text"
            value={profileData.full_name}
            onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, full_name: e.target.value }))}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, email: e.target.value }))}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
          <input
            type="text"
            value={profileData.username}
            onChange={(e) => setProfileData((prev: typeof profileData) => ({ ...prev, username: e.target.value }))}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
          <input
            type="text"
            value={profileData.role}
            disabled
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={securityData.current_password}
                onChange={(e) => setSecurityData((prev: typeof securityData) => ({ ...prev, current_password: e.target.value }))}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
            <input
              type="password"
              value={securityData.new_password}
              onChange={(e) => setSecurityData((prev: typeof securityData) => ({ ...prev, new_password: e.target.value }))}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={securityData.confirm_password}
              onChange={(e) => setSecurityData((prev: typeof securityData) => ({ ...prev, confirm_password: e.target.value }))}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Security Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div>
              <h4 className="text-white font-medium">Two-Factor Authentication</h4>
              <p className="text-gray-400 text-sm">Add extra security to your account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securityData.two_factor_enabled}
                onChange={(e) => setSecurityData((prev: typeof securityData) => ({ ...prev, two_factor_enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Session Timeout</label>
            <select
              value={securityData.session_timeout}
              onChange={(e) => setSecurityData((prev: typeof securityData) => ({ ...prev, session_timeout: parseInt(e.target.value) }))}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {Object.entries(notificationData).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div>
                <h4 className="text-white font-medium capitalize">
                  {key.replace(/_/g, ' ')}
                </h4>
                <p className="text-gray-400 text-sm">
                  {key === 'email_notifications' && 'Receive notifications via email'}
                  {key === 'security_alerts' && 'Get notified about security events'}
                  {key === 'system_updates' && 'System maintenance and updates'}
                  {key === 'fl_training_updates' && 'Federated learning training progress'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => setNotificationData((prev: typeof notificationData) => ({ ...prev, [key]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderApiMonitoringTab = () => (
    <div className="space-y-6">
      {/* API Health Overview */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">API Health Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-700/30 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <span className="text-gray-400 text-sm">Total Endpoints</span>
            </div>
            <div className="text-2xl font-bold text-white mt-2">{apiMonitoringData.total}</div>
          </div>
          <div className="bg-gray-700/30 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-gray-400 text-sm">Healthy</span>
            </div>
            <div className="text-2xl font-bold text-green-400 mt-2">{apiMonitoringData.healthy}</div>
          </div>
          <div className="bg-gray-700/30 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <span className="text-gray-400 text-sm">Degraded</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400 mt-2">{apiMonitoringData.degraded}</div>
          </div>
          <div className="bg-gray-700/30 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-400" />
              <span className="text-gray-400 text-sm">Failed</span>
            </div>
            <div className="text-2xl font-bold text-red-400 mt-2">{apiMonitoringData.failed}</div>
          </div>
        </div>
      </div>

      {/* Endpoint Status */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Endpoint Status</h3>
        <div className="bg-gray-700/30 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {apiMonitoringData.endpoints.length > 0 ? (
              <div className="divide-y divide-gray-600/50">
                {apiMonitoringData.endpoints.slice(0, 20).map((endpoint: any, index: number) => (
                  <div key={index} className="p-4 hover:bg-gray-600/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          endpoint.status === 'active' ? 'bg-green-400' :
                          endpoint.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                        <div>
                          <div className="text-white font-medium">{endpoint.path}</div>
                          <div className="text-gray-400 text-sm">{endpoint.method} • {endpoint.response_time_ms}ms</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          endpoint.status === 'active' ? 'text-green-400' :
                          endpoint.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {endpoint.status}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {new Date(endpoint.last_checked).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    {endpoint.error && (
                      <div className="mt-2 text-red-400 text-sm bg-red-900/20 p-2 rounded">
                        {endpoint.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Loading endpoint data...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Logs */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent API Logs</h3>
        <div className="bg-gray-700/30 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {apiMonitoringData.logs.length > 0 ? (
              <div className="divide-y divide-gray-600/50">
                {apiMonitoringData.logs.slice(0, 10).map((log: any, index: number) => (
                  <div key={index} className="p-4 hover:bg-gray-600/20">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        log.level === 'ERROR' ? 'bg-red-400' :
                        log.level === 'WARNING' ? 'bg-yellow-400' : 'bg-blue-400'
                      }`}></div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{log.endpoint}</div>
                        <div className="text-gray-400 text-sm">{log.message}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          log.level === 'ERROR' ? 'text-red-400' :
                          log.level === 'WARNING' ? 'text-yellow-400' : 'text-blue-400'
                        }`}>
                          {log.level}
                        </div>
                        <div className="text-gray-400 text-xs flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                        {log.response_time_ms && (
                          <div className="text-gray-400 text-xs">
                            {log.response_time_ms}ms
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent logs available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
            <AgisIcon size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-400 to-gray-300 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-400 mt-2">Manage your account and preferences</p>
          </div>
        </div>
        <button
          onClick={saveSettings}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'api-monitoring' && renderApiMonitoringTab()}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Settings