import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Shield, Lock, Mail, Activity, Database } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import Button from '../components/UI/Button'

const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@agisfl.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  
  const { login, isLoading, error } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
  }

  const features = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Military-grade encryption with zero-trust architecture and real-time threat detection'
    },
    {
      icon: Activity,
      title: 'Federated Learning',
      description: 'Distributed AI training across 500+ clients with privacy preservation and model optimization'
    },
    {
      icon: Database,
      title: 'Real-time Analytics',
      description: 'Advanced monitoring dashboard with predictive insights and automated compliance reporting'
    },
    {
      icon: Lock,
      title: 'Privacy by Design',
      description: 'Differential privacy, homomorphic encryption, and secure multi-party computation'
    }
  ]

  return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 to-blue-900/40"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}></div>
          
          {/* Enhanced Floating Elements */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${
                i % 3 === 0 ? 'w-2 h-2 bg-blue-400/30' :
                i % 3 === 1 ? 'w-3 h-3 bg-cyan-400/20' :
                'w-1.5 h-1.5 bg-indigo-400/40'
              }`}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.sin(i) * 20, 0],
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{
                duration: 4 + (i * 0.3),
                repeat: Infinity,
                delay: i * 0.2
              }}
              style={{
                left: `${5 + (i * 8)}%`,
                top: `${15 + (i * 6)}%`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 py-16">
          {/* Enhanced Logo & Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl mr-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                <img 
                  src="/src/assets/logos/agisfl-logo.svg" 
                  alt="AgisFL"
                  className="w-12 h-12 brightness-0 invert relative z-10"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">AgisFL Enterprise</h1>
                <p className="text-cyan-300 font-medium text-lg">Federated Learning Platform</p>
                <div className="flex items-center mt-2 space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">System Online</span>
                </div>
              </div>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed max-w-lg">
              Next-generation federated learning platform with enterprise-grade security, 
              real-time monitoring, and intelligent threat detection. Powering AI innovation 
              across distributed networks.
            </p>
          </motion.div>

          {/* Enhanced Features */}
          <div className="space-y-6 mb-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + (index * 0.1) }}
                className="flex items-start space-x-4 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300">
                  <feature.icon className="h-7 w-7 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-2 text-lg group-hover:text-cyan-100 transition-colors">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="grid grid-cols-3 gap-8"
          >
            <div className="text-center group">
              <div className="text-3xl font-bold text-cyan-300 mb-2 group-hover:text-cyan-200 transition-colors">99.99%</div>
              <div className="text-slate-400 text-sm font-medium">Uptime SLA</div>
              <div className="w-full bg-slate-700/50 rounded-full h-1 mt-2">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1 rounded-full w-full"></div>
              </div>
            </div>
            <div className="text-center group">
              <div className="text-3xl font-bold text-blue-300 mb-2 group-hover:text-blue-200 transition-colors">500+</div>
              <div className="text-slate-400 text-sm font-medium">Active Clients</div>
              <div className="w-full bg-slate-700/50 rounded-full h-1 mt-2">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1 rounded-full w-4/5"></div>
              </div>
            </div>
            <div className="text-center group">
              <div className="text-3xl font-bold text-green-300 mb-2 group-hover:text-green-200 transition-colors">98.7%</div>
              <div className="text-slate-400 text-sm font-medium">Model Accuracy</div>
              <div className="w-full bg-slate-700/50 rounded-full h-1 mt-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-1 rounded-full w-5/6"></div>
              </div>
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-12 flex items-center space-x-6"
          >
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-400" />
              <span className="text-slate-300 text-sm">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-blue-400" />
              <span className="text-slate-300 text-sm">End-to-End Encrypted</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <span className="text-slate-300 text-sm">24/7 Monitoring</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16 bg-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
              <img 
                src="/src/assets/logos/agisfl-logo.svg" 
                alt="AgisFL"
                className="w-12 h-12 brightness-0 invert relative z-10"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">AgisFL Enterprise</h1>
            <p className="text-cyan-300 font-medium">Federated Learning Platform</p>
            <div className="flex items-center justify-center mt-3 space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">System Online</span>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-8 border border-slate-700/50 shadow-2xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}></div>
            </div>

            <div className="relative z-10">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
                <p className="text-slate-400 text-lg">Sign in to your AgisFL account</p>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mt-4"></div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl backdrop-blur-sm"
                >
                  <p className="text-red-300 text-sm font-medium">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200 text-base"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-14 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200 text-base"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                    />
                    <span className="ml-3 text-sm text-slate-300 group-hover:text-slate-200 transition-colors">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  loading={isLoading}
                  className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {/* Enhanced Demo Credentials */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-700/30 rounded-xl backdrop-blur-sm">
                <h4 className="text-cyan-300 font-semibold mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Demo Credentials
                </h4>
                <div className="text-sm text-slate-300 space-y-2">
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="text-cyan-300 font-mono">admin@agisfl.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Password:</span>
                    <span className="text-cyan-300 font-mono">admin123</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Security Notice */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-3 text-slate-400 text-sm">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span>Secured with enterprise-grade encryption</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login