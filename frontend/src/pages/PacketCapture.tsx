import React, { useState, useEffect, useCallback } from 'react';
import {
  Play, Square, Activity, Shield, AlertTriangle, Network, Download,
  Wifi, WifiOff, RefreshCw, Zap, Eye, Settings,
  BarChart3, TrendingUp, Clock, Server, Globe, Filter,
  Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle,
  XCircle, Database, FileText, Cpu, HardDrive, Monitor,
  Lock, Target,
  Bell, BellOff, Archive,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { comprehensiveAPI } from '../services/comprehensiveAPI';

interface PacketInfo {
  timestamp: number;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  size: number;
  payload: string;
  is_malicious: boolean;
  threat_type: string;
  threat_score?: number;
  threat_confidence?: number;
  geo_src?: any;
  geo_dst?: any;
  dns_info?: any;
  http_info?: any;
  tls_info?: any;
  entropy_score?: number;
  compression_ratio?: number;
  session_id?: string;
  flow_key?: string;
  flags?: string[];
  tags?: string[];
}

interface CaptureStats {
  is_capturing: boolean;
  interface: string;
  total_packets: number;
  malicious_packets: number;
  detection_rate: string;
  scapy_available: boolean;
  uptime?: number;
  packets_per_second?: number;
  protocol_distribution?: Record<string, number>;
  threat_types?: Record<string, number>;
  top_sources?: Record<string, number>;
  top_destinations?: Record<string, number>;
  geo_distribution?: Record<string, number>;
  hourly_traffic?: Record<string, number>;
  average_packet_size?: number;
  threat_detection_stats?: any;
  compliance_status?: any;
  system_health?: any;
  alerts_active?: number;
  capture_start_time?: number;
  capture_duration?: number;
  memory_usage_mb?: number;
  cpu_usage_percent?: number;
}

interface EnterpriseFeatures {
  advanced_threat_detection: boolean;
  behavioral_analysis: boolean;
  anomaly_detection: boolean;
  machine_learning_classification: boolean;
  threat_intelligence_integration: boolean;
  compliance_monitoring: boolean;
  audit_logging: boolean;
  real_time_alerting: boolean;
  geo_enrichment: boolean;
  session_tracking: boolean;
  flow_analysis: boolean;
  protocol_analysis: boolean;
  performance_monitoring: boolean;
  health_monitoring: boolean;
  configuration_management: boolean;
  statistics_aggregation: boolean;
}

interface ThreatIntelligence {
  total_detections: number;
  true_positives: number;
  false_positives: number;
  accuracy: number;
  threat_breakdown: Record<string, number>;
  rules_active: number;
}

interface ComplianceStatus {
  gdpr_compliant: boolean;
  pci_compliant: boolean;
  hipaa_compliant: boolean;
  last_check: number;
  violations?: string[];
  policies_checked?: string[];
}

interface SystemHealth {
  healthy: boolean;
  memory: { usage_percent: number; healthy: boolean };
  cpu: { usage_percent: number; healthy: boolean };
  disk: { usage_percent: number; healthy: boolean };
  network: { healthy: boolean };
  timestamp: number;
}

interface ActiveAlert {
  id: string;
  timestamp: number;
  severity: string;
  title: string;
  description: string;
  packet_info?: any;
  status: string;
}

interface PerformanceMetrics {
  packet_capture: {
    packet_sizes_avg?: number;
    processing_times_avg?: number;
    count?: number;
  };
  system: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_connections: number;
  };
}

interface AuditEntry {
  timestamp: string;
  packet_id: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  size: number;
  is_malicious: boolean;
  threat_score: number;
  threat_type: string;
  user: string;
  action: string;
}

interface Configuration {
  capture: {
    interface?: string;
    promiscuous_mode: boolean;
    buffer_size: number;
    timeout?: number;
  };
  detection: {
    enabled_rules: string[];
    threat_threshold: number;
    false_positive_tolerance: number;
  };
  enterprise: {
    audit_logging: boolean;
    compliance_monitoring: boolean;
    alerting: boolean;
    geo_enrichment: boolean;
  };
  performance: {
    max_packets: number;
    processing_workers: number;
    stats_interval: number;
  };
}

interface AdvancedAnalytics {
  total_packets: number;
  unique_ips: number;
  total_bytes: number;
  threats_detected: number;
  protocol_distribution: Record<string, number>;
  hourly_traffic: number[];
  top_talkers: [string, number][];
  geo_distribution: Record<string, number>;
}

interface ExportData {
  json_packets: number;
  csv_packets: number;
  pcap_packets: number;
}

const PacketCapture: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stats, setStats] = useState<CaptureStats | null>(null);
  const [packets, setPackets] = useState<PacketInfo[]>([]);
  const [maliciousPackets, setMaliciousPackets] = useState<PacketInfo[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'malicious' | 'stats' | 'analytics' | 'enterprise' | 'threats' | 'compliance' | 'health' | 'alerts' | 'performance' | 'audit' | 'config' | 'export'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProtocol, setFilterProtocol] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<Set<number>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(3000);

  // Enterprise state
  const [enterpriseFeatures, setEnterpriseFeatures] = useState<EnterpriseFeatures | null>(null);
  const [threatIntelligence, setThreatIntelligence] = useState<ThreatIntelligence | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('24h');
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [configuration, setConfiguration] = useState<Configuration | null>(null);
  const [exportDataState, setExportDataState] = useState<ExportData | null>(null);

  const toggleDetails = (index: number) => {
    setShowDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Enhanced fetch functions with enterprise features
  const fetchInterfaces = useCallback(async () => {
    try {
      const data = await comprehensiveAPI.packetCapture.interfaces();
      setInterfaces(data.interfaces || []);
      setSelectedInterface(data.recommended || data.interfaces?.[0] || '');
    } catch (error) {
      console.error('Backend not available:', error);
      setInterfaces(['Ethernet', 'Wi-Fi', 'Local Area Connection']);
      setSelectedInterface('Ethernet');
    }
  }, []);

  const fetchStats = useCallback(async () => {
    if (!autoRefresh) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const data = await comprehensiveAPI.packetCapture.status();
      clearTimeout(timeoutId);

      setStats(data);
      setIsCapturing(data.is_capturing);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Request timeout - backend may be starting');
      } else {
        console.error('Backend connection error:', error);
        setStats({
          is_capturing: false,
          interface: 'Backend Offline',
          total_packets: 0,
          malicious_packets: 0,
          detection_rate: '0%',
          scapy_available: false
        });
      }
    }
  }, [autoRefresh]);

  const fetchPackets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await comprehensiveAPI.packetCapture.packets(200);
      setPackets(data.packets || []);
    } catch (error) {
      console.error('Failed to fetch packets:', error);
      setPackets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMaliciousPackets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await comprehensiveAPI.packetCapture.malicious(100);
      setMaliciousPackets(data.malicious_packets || []);
    } catch (error) {
      console.error('Failed to fetch malicious packets:', error);
      setMaliciousPackets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enterprise fetch functions
  const fetchEnterpriseFeatures = useCallback(async () => {
    try {
      const data = await comprehensiveAPI.packetCapture.enterpriseFeatures();
      setEnterpriseFeatures(data.enterprise_features);
    } catch (error) {
      console.error('Failed to fetch enterprise features:', error);
    }
  }, []);

  const fetchThreatIntelligence = useCallback(async () => {
    try {
      const data = await comprehensiveAPI.packetCapture.threatIntelligence();
      setThreatIntelligence(data.threat_intelligence);
    } catch (error) {
      console.error('Failed to fetch threat intelligence:', error);
    }
  }, []);

  const fetchComplianceStatus = useCallback(async () => {
    try {
      const data = await comprehensiveAPI.packetCapture.compliance();
      setComplianceStatus(data.compliance);
    } catch (error) {
      console.error('Failed to fetch compliance status:', error);
    }
  }, []);

  const fetchSystemHealth = useCallback(async () => {
    try {
      const data = await comprehensiveAPI.packetCapture.health();
      setSystemHealth(data.health);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  }, []);

  const fetchActiveAlerts = useCallback(async () => {
    try {
      const data = await comprehensiveAPI.packetCapture.alerts();
      setActiveAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch active alerts:', error);
      setActiveAlerts([]);
    }
  }, []);

  const fetchPerformanceMetrics = useCallback(async () => {
    try {
      const data = await comprehensiveAPI.packetCapture.performance();
      setPerformanceMetrics(data.performance);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const data = await comprehensiveAPI.packetCapture.auditLogs();
      setAuditLogs(data.audit_logs || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setAuditLogs([]);
    }
  }, []);

  const fetchConfiguration = useCallback(async () => {
    try {
      const data = await comprehensiveAPI.packetCapture.configuration();
      setConfiguration(data.configuration);
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
    }
  }, []);

  const fetchAdvancedAnalytics = useCallback(async () => {
    try {
      const data = await comprehensiveAPI.packetCapture.advancedAnalytics(analyticsTimeframe);
      setAdvancedAnalytics(data.analytics);
    } catch (error) {
      console.error('Failed to fetch advanced analytics:', error);
    }
  }, [analyticsTimeframe]);

  const fetchExportData = useCallback(async () => {
    try {
      const data = await comprehensiveAPI.packetCapture.export();
      setExportDataState(data.export);
    } catch (error) {
      console.error('Failed to fetch export data:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    fetchInterfaces();
    fetchStats();
    fetchEnterpriseFeatures();
  }, [fetchInterfaces, fetchStats, fetchEnterpriseFeatures]);

  // Auto-refresh stats and packets
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStats();
      if (isCapturing) {
        fetchPackets();
        if (activeTab === 'malicious') {
          fetchMaliciousPackets();
        }
      }

      // Enterprise auto-refresh based on active tab
      if (activeTab === 'threats') fetchThreatIntelligence();
      if (activeTab === 'compliance') fetchComplianceStatus();
      if (activeTab === 'health') fetchSystemHealth();
      if (activeTab === 'alerts') fetchActiveAlerts();
      if (activeTab === 'performance') fetchPerformanceMetrics();
      if (activeTab === 'audit') fetchAuditLogs();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isCapturing, activeTab]);

  // Control functions
  const startCapture = async () => {
    try {
      setIsLoading(true);
      await comprehensiveAPI.packetCapture.start(selectedInterface);

      toast.success('Packet capture started successfully');
      setIsCapturing(true);
      fetchStats();
      // Auto-refresh packets when capturing
      if (autoRefresh) {
        fetchPackets();
      }
    } catch (error) {
      console.error('Failed to start capture:', error);
      toast.error('Failed to start capture');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCapture = async () => {
    try {
      setIsLoading(true);
      await comprehensiveAPI.packetCapture.stop();

      toast.success('Packet capture stopped');
      setIsCapturing(false);
      fetchStats();
    } catch (error) {
      console.error('Failed to stop capture:', error);
      toast.error('Failed to stop capture');
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp && timestamp !== 0) return '-';
    const ts = Number(timestamp);
    if (Number.isNaN(ts)) return '-';
    // Support seconds or milliseconds
    const maybeMillis = ts > 1e12 ? ts : ts * 1000;
    return new Date(maybeMillis).toLocaleTimeString();
  };

  const getThreatColor = (threatType: string) => {
    const t = String(threatType || '').toLowerCase();
    if (t.includes('malicious_ip')) return 'text-red-600 bg-red-50 border-red-200';
    if (t.includes('suspicious_port')) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (t.includes('suspicious_payload')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (t.includes('malicious_domain')) return 'text-purple-600 bg-purple-50 border-purple-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getProtocolColor = (protocol: string) => {
    const p = String(protocol || '').toUpperCase();
    switch (p) {
      case 'TCP': return 'text-blue-600 bg-blue-50';
      case 'UDP': return 'text-green-600 bg-green-50';
      case 'ICMP': return 'text-yellow-600 bg-yellow-50';
      case 'HTTP': return 'text-purple-600 bg-purple-50';
      case 'HTTPS': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Filter packets based on search and protocol
  const filteredPackets = packets.filter(packet => {
    const proto = packet.protocol || '';
    const matchesSearch = searchTerm === '' ||
      String(packet.src_ip || '').includes(searchTerm) ||
      String(packet.dst_ip || '').includes(searchTerm) ||
      proto.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProtocol = filterProtocol === 'all' || proto.toUpperCase() === filterProtocol.toUpperCase();

    return matchesSearch && matchesProtocol;
  });

  const exportData = () => {
    try {
      let dataToExport: PacketInfo[] | CaptureStats | null = null;
      let filename = '';

      switch (activeTab) {
        case 'all':
          dataToExport = filteredPackets;
          filename = 'network_traffic_export.json';
          break;
        case 'malicious':
          dataToExport = maliciousPackets;
          filename = 'threat_intelligence_export.json';
          break;
        case 'stats':
          dataToExport = stats;
          filename = 'capture_stats_export.json';
          break;
        default:
          toast.error('No data to export for this tab.');
          return;
      }

      if (!dataToExport || (Array.isArray(dataToExport) && dataToExport.length === 0)) {
        toast.error('No data available to export');
        return;
      }

      const exportData = {
        export_timestamp: new Date().toISOString(),
        total_records: Array.isArray(dataToExport) ? dataToExport.length : 1,
        capture_status: isCapturing ? 'active' : 'stopped',
        interface: stats?.interface || 'unknown',
        data: dataToExport
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported data successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-400/30">
                  <img src="/src/assets/icons/packet-capture.svg" alt="Packet Capture" className="w-7 h-7 brightness-0 invert" />
                </div>
                Advanced Packet Capture & Analysis
              </h1>
              <p className="text-blue-200 text-lg font-medium">Enterprise-Grade Network Intelligence with Autonomous Threat Detection & Real-Time Analytics</p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                stats?.scapy_available
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {stats?.scapy_available ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {stats?.scapy_available ? 'Backend Connected' : 'Backend Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Control Panel */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interface & Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <label className="text-white font-medium">Network Interface:</label>
                </div>
                <select
                  value={selectedInterface}
                  onChange={(e) => setSelectedInterface(e.target.value)}
                  className="bg-slate-800/50 text-white px-4 py-2 rounded-xl border border-slate-600/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  disabled={isCapturing}
                >
                  {interfaces.map(iface => (
                    <option key={iface} value={iface} className="bg-slate-800">{iface}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={isCapturing ? stopCapture : startCapture}
                  disabled={isLoading}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCapturing
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                  }`}
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : isCapturing ? (
                    <Square className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  {isLoading ? 'Processing...' : isCapturing ? 'Stop Capture' : 'Start Capture'}
                </button>

                <button
                  onClick={fetchPackets}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Enhanced Stats Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-4 border border-blue-500/30 hover:border-blue-400/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm font-medium">Total Packets</span>
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats?.total_packets || 0}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Live Capture
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl p-4 border border-red-500/30 hover:border-red-400/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm font-medium">Active Threats</span>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-3xl font-bold text-red-400 mb-1">{stats?.malicious_packets || 0}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Detected
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm font-medium">Detection Rate</span>
                  <Zap className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400 mb-1">{stats?.detection_rate || '0%'}</div>
                <div className="text-xs text-slate-400">AI Accuracy</div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-4 border border-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm font-medium">Packets/sec</span>
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-purple-400 mb-1">{stats?.packets_per_second || 0}</div>
                <div className="text-xs text-slate-400">Throughput</div>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          {stats && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                isCapturing
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isCapturing ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
                {isCapturing ? 'Capturing Active' : 'Capture Stopped'}
              </div>

              <div className="text-slate-300 text-sm">
                Interface: <span className="text-white font-medium">{stats.interface || 'None'}</span>
              </div>

              <div className="text-slate-300 text-sm">
                Detection Rate: <span className="text-green-400 font-medium">{stats.detection_rate || '0%'}</span>
              </div>

              {stats.interface === 'Backend Offline' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Backend Offline - Start server first
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Enterprise Search & Filters */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10 shadow-xl">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3 flex-1 min-w-80">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Search className="w-4 h-4 text-blue-400" />
              </div>
              <input
                type="text"
                placeholder="Search by IP address, port, protocol, or threat type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-slate-800/50 text-white px-4 py-3 rounded-xl border border-slate-600/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterProtocol}
                onChange={(e) => setFilterProtocol(e.target.value)}
                className="bg-slate-800/50 text-white px-4 py-3 rounded-xl border border-slate-600/50 focus:outline-none focus:border-blue-400 transition-all"
              >
                <option value="all">All Protocols</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
                <option value="HTTP">HTTP</option>
                <option value="HTTPS">HTTPS</option>
                <option value="ARP">ARP</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoRefresh" className="text-slate-300 text-sm font-medium">Auto-refresh</label>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-slate-800/50 text-white px-3 py-2 rounded-lg border border-slate-600/50 focus:outline-none focus:border-blue-400 text-sm"
                >
                  <option value={1000}>1s</option>
                  <option value={3000}>3s</option>
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Filters Row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-600/30">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 text-sm font-medium">View:</span>
            </div>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              All Traffic
            </button>

            <button
              onClick={() => setActiveTab('malicious')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'malicious'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              Threats Only
            </button>

            <div className="ml-auto flex items-center gap-2">
              <Download className="w-4 h-4 text-slate-400" />
              <button 
                onClick={exportData}
                className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600/50 transition-all"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Enterprise Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {[
            { 
              id: 'all', 
              label: 'Network Traffic', 
              icon: Activity, 
              count: filteredPackets.length,
              description: 'All captured packets',
              color: 'blue'
            },
            { 
              id: 'malicious', 
              label: 'Threat Intelligence', 
              icon: Shield, 
              count: maliciousPackets.length,
              description: 'Detected security threats',
              color: 'red'
            },
            { 
              id: 'stats', 
              label: 'Performance Analytics', 
              icon: BarChart3,
              count: stats?.total_packets ?? 0,
              description: 'Real-time metrics',
              color: 'green'
            },
            { 
              id: 'analytics', 
              label: 'Network Insights', 
              icon: TrendingUp,
              count: 0,
              description: 'Advanced analytics',
              color: 'purple'
            },
            {
              id: 'enterprise',
              label: 'Enterprise Features',
              icon: Settings,
              count: enterpriseFeatures ? Object.values(enterpriseFeatures).filter(Boolean).length : 0,
              description: 'Enterprise capabilities',
              color: 'indigo'
            },
            {
              id: 'threats',
              label: 'Threat Detection',
              icon: Target,
              count: threatIntelligence?.total_detections ?? 0,
              description: 'AI threat analysis',
              color: 'orange'
            },
            {
              id: 'compliance',
              label: 'Compliance',
              icon: Lock,
              count: complianceStatus ? (complianceStatus.violations?.length ?? 0) : 0,
              description: 'Regulatory compliance',
              color: 'teal'
            },
            {
              id: 'health',
              label: 'System Health',
              icon: Monitor,
              count: systemHealth ? (systemHealth.healthy ? 1 : 0) : 0,
              description: 'System monitoring',
              color: 'cyan'
            },
            {
              id: 'alerts',
              label: 'Active Alerts',
              icon: Bell,
              count: activeAlerts.length,
              description: 'Security alerts',
              color: 'yellow'
            },
            {
              id: 'performance',
              label: 'Performance',
              icon: Zap,
              count: performanceMetrics ? 1 : 0,
              description: 'Performance metrics',
              color: 'pink'
            },
            {
              id: 'audit',
              label: 'Audit Logs',
              icon: FileText,
              count: auditLogs.length,
              description: 'Audit trail',
              color: 'gray'
            },
            {
              id: 'config',
              label: 'System Configuration',
              icon: Settings,
              count: 0,
              description: 'System settings',
              color: 'slate'
            },
            {
              id: 'analytics',
              label: 'Advanced Analytics',
              icon: TrendingUp,
              count: advancedAnalytics ? advancedAnalytics.total_packets : 0,
              description: 'Network insights',
              color: 'indigo'
            },
            {
              id: 'export',
              label: 'Export Data',
              icon: Download,
              count: exportDataState ? exportDataState.json_packets + exportDataState.csv_packets + exportDataState.pcap_packets : 0,
              description: 'Data export',
              color: 'emerald'
            }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                // Trigger data fetching for specific tabs
                if (tab.id === 'all') fetchPackets();
                if (tab.id === 'malicious') fetchMaliciousPackets();
                if (tab.id === 'enterprise') fetchEnterpriseFeatures();
                if (tab.id === 'threats') fetchThreatIntelligence();
                if (tab.id === 'compliance') fetchComplianceStatus();
                if (tab.id === 'health') fetchSystemHealth();
                if (tab.id === 'alerts') fetchActiveAlerts();
                if (tab.id === 'performance') fetchPerformanceMetrics();
                if (tab.id === 'audit') fetchAuditLogs();
                if (tab.id === 'config') fetchConfiguration();
              }}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all whitespace-nowrap min-w-max shadow-lg hover:shadow-xl transform hover:scale-105 ${
                activeTab === tab.id
                  ? `bg-${tab.color}-600 text-white shadow-${tab.color}-500/20`
                  : 'bg-white/10 text-blue-200 hover:bg-white/20 border border-white/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm font-bold">{tab.label}</div>
                <div className={`text-xs ${activeTab === tab.id ? 'text-white/80' : 'text-slate-400'}`}>
                  {tab.description}
                </div>
              </div>
              {tab.count !== undefined && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  activeTab === tab.id 
                    ? 'bg-white/20 text-white' 
                    : `bg-${tab.color}-500/20 text-${tab.color}-300`
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Enhanced Content */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {activeTab === 'all' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Captured Packets</h3>
                <div className="text-slate-400 text-sm">
                  Showing {filteredPackets.length} of {packets.length} packets
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                  <span className="ml-3 text-blue-200">Loading packets...</span>
                </div>
              ) : filteredPackets.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl border border-blue-400/30 inline-block mb-6">
                    <Network className="w-16 h-16 text-blue-400 mx-auto" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-3">No Network Traffic Captured</div>
                  <div className="text-blue-200 mb-6 text-lg">Start packet capture to begin monitoring your network infrastructure</div>
                  <button
                    onClick={startCapture}
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl font-semibold text-lg transition-all flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Play className="w-6 h-6" />
                    Initialize Network Monitoring
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPackets.map((packet, index) => (
                    <div key={index} className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-2xl border border-slate-600/30 overflow-hidden hover:border-blue-400/30 transition-all shadow-lg hover:shadow-xl">
                      <div
                        className="p-6 cursor-pointer hover:bg-slate-700/20 transition-colors"
                        onClick={() => toggleDetails(index)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`px-3 py-2 rounded-xl text-sm font-bold ${getProtocolColor(packet.protocol)} shadow-lg`}>
                              {packet.protocol}
                            </div>
                            <div className="text-white font-mono text-lg font-semibold">
                              {packet.src_ip}:{packet.src_port} 
                              <span className="text-blue-400 mx-2">→</span>
                              {packet.dst_ip}:{packet.dst_port}
                            </div>
                            <div className="text-slate-400 text-sm font-medium bg-slate-700/50 px-3 py-1 rounded-lg">
                              {packet.size} bytes
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-slate-400 text-sm font-medium">
                              {formatTimestamp(packet.timestamp)}
                            </div>
                            {packet.is_malicious && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-300 border border-red-500/30 rounded-xl text-sm font-semibold shadow-lg">
                                <AlertTriangle className="w-4 h-4" />
                                SECURITY THREAT
                                <div className={`px-2 py-1 rounded-lg text-xs font-bold ${getThreatColor(packet.threat_type)}`}>
                                  {packet.threat_type}
                                </div>
                              </div>
                            )}
                            {showDetails.has(index) ? (
                              <ChevronUp className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                            )}
                          </div>
                        </div>

                        {/* Packet metadata row */}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-400" />
                            <span className="text-slate-300">Source:</span>
                            <span className="text-white font-mono font-medium">{packet.src_ip}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-green-400" />
                            <span className="text-slate-300">Destination:</span>
                            <span className="text-white font-mono font-medium">{packet.dst_ip}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <span className="text-slate-300">Port:</span>
                            <span className="text-white font-mono font-medium">{packet.src_port} → {packet.dst_port}</span>
                          </div>
                        </div>
                      </div>

                      {showDetails.has(index) && (
                        <div className="px-6 pb-6 border-t border-slate-600/30 bg-slate-800/20">
                          <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                                <span className="text-slate-400 font-medium">Source IP:</span>
                                <span className="text-white font-mono font-semibold">{packet.src_ip}</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                                <span className="text-slate-400 font-medium">Source Port:</span>
                                <span className="text-white font-mono font-semibold">{packet.src_port}</span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                                <span className="text-slate-400 font-medium">Destination IP:</span>
                                <span className="text-white font-mono font-semibold">{packet.dst_ip}</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                                <span className="text-slate-400 font-medium">Destination Port:</span>
                                <span className="text-white font-mono font-semibold">{packet.dst_port}</span>
                              </div>
                            </div>
                          </div>
                          
                          {packet.payload && (
                            <div className="mt-6">
                              <div className="flex items-center gap-2 mb-3">
                                <Eye className="w-4 h-4 text-blue-400" />
                                <span className="text-slate-300 font-medium">Packet Payload Analysis:</span>
                              </div>
                              <div className="p-4 bg-black/40 rounded-xl border border-slate-600/30">
                                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap break-all leading-relaxed">
                                  {packet.payload.length > 1000 ? packet.payload.substring(0, 1000) + '...' : packet.payload}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'malicious' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Detected Threats</h3>
                <button
                  onClick={fetchMaliciousPackets}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Threats
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
                  <span className="ml-3 text-red-200">Loading threats...</span>
                </div>
              ) : maliciousPackets.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30 inline-block mb-6">
                    <Shield className="w-16 h-16 text-green-400 mx-auto" />
                  </div>
                  <div className="text-2xl font-bold text-green-400 mb-3">Network Security Status: SECURE</div>
                  <div className="text-blue-200 mb-6 text-lg">Advanced threat detection systems are actively monitoring your network infrastructure</div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-xl text-sm font-semibold">
                      ✅ Zero Active Threats
                    </div>
                    <div className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-sm font-semibold">
                      🔍 AI Monitoring Active
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {maliciousPackets.map((packet, index) => (
                    <div key={index} className="bg-gradient-to-r from-red-900/20 to-red-800/10 border border-red-500/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-500/20 rounded-xl border border-red-400/30">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                          </div>
                          <div>
                            <div className="text-white font-bold text-xl mb-1">Security Threat Detected</div>
                            <div className="text-red-200 text-sm">Advanced AI threat detection system has identified malicious network activity</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-200 text-sm mb-1">Threat Level</div>
                          <div className={`px-3 py-1 rounded-xl text-sm font-bold ${getThreatColor(packet.threat_type)}`}>
                            {packet.threat_type?.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-600/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Globe className="w-4 h-4 text-red-400" />
                              <span className="text-red-200 font-medium">Source Analysis</span>
                            </div>
                            <div className="text-white font-mono text-lg font-semibold">{packet.src_ip}:{packet.src_port}</div>
                            <div className="text-slate-400 text-sm mt-1">Suspicious source endpoint detected</div>
                          </div>
                          
                          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-600/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Server className="w-4 h-4 text-red-400" />
                              <span className="text-red-200 font-medium">Target Analysis</span>
                            </div>
                            <div className="text-white font-mono text-lg font-semibold">{packet.dst_ip}:{packet.dst_port}</div>
                            <div className="text-slate-400 text-sm mt-1">Potential attack target identified</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-600/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity className="w-4 h-4 text-blue-400" />
                              <span className="text-slate-300 font-medium">Traffic Details</span>
                            </div>
                            <div className="text-white text-lg font-semibold">{packet.protocol} Protocol</div>
                            <div className="text-slate-400 text-sm">Packet Size: {packet.size} bytes</div>
                          </div>

                          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-600/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-purple-400" />
                              <span className="text-slate-300 font-medium">Detection Time</span>
                            </div>
                            <div className="text-white text-lg font-semibold">{formatTimestamp(packet.timestamp)}</div>
                            <div className="text-slate-400 text-sm">Real-time threat detection</div>
                          </div>
                        </div>
                      </div>

                      {packet.payload && (
                        <div className="mt-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Eye className="w-4 h-4 text-red-400" />
                            <span className="text-red-200 font-medium text-lg">Malicious Payload Analysis</span>
                          </div>
                          <div className="p-6 bg-black/40 rounded-xl border border-red-500/30">
                            <div className="text-red-300 text-sm mb-3 font-medium">⚠️ WARNING: This payload contains potentially malicious content</div>
                            <pre className="text-red-400 text-sm font-mono whitespace-pre-wrap break-all leading-relaxed bg-black/20 p-4 rounded-lg">
                              {packet.payload.length > 800 ? packet.payload.substring(0, 800) + '...' : packet.payload}
                            </pre>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-sm font-semibold">
                            🚨 IMMEDIATE ATTENTION REQUIRED
                          </div>
                          <div className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-sm font-semibold">
                            🔍 AI ANALYSIS COMPLETE
                          </div>
                        </div>
                        <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Mitigate Threat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Enterprise Network Analytics</h3>
                  <p className="text-blue-200">Real-time performance metrics and security intelligence dashboard</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-xl text-sm font-semibold">
                    🔴 LIVE DATA
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Report
                  </button>
                </div>
              </div>

              {/* Enhanced Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <Activity className="w-8 h-8 text-blue-400" />
                    <span className="text-blue-200 text-sm font-medium">Total Traffic</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{stats.total_packets}</div>
                  <div className="text-blue-300 text-sm flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Network packets captured
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-2xl p-6 border border-red-500/30 hover:border-red-400/50 transition-all shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                    <span className="text-red-200 text-sm font-medium">Security Threats</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{stats.malicious_packets}</div>
                  <div className="text-red-300 text-sm flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Active security incidents
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-2xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <Zap className="w-8 h-8 text-green-400" />
                    <span className="text-green-200 text-sm font-medium">AI Detection Rate</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{stats.detection_rate}</div>
                  <div className="text-green-300 text-sm flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    Threat detection accuracy
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <Server className="w-8 h-8 text-purple-400" />
                    <span className="text-purple-200 text-sm font-medium">System Performance</span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{stats.packets_per_second || 0}</div>
                  <div className="text-purple-300 text-sm flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    Packets per second
                  </div>
                </div>
              </div>

              {/* System Status Dashboard */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30 mb-8">
                <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                  <Settings className="w-6 h-6 text-blue-400" />
                  Enterprise System Status
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-xl">
                    <span className="text-slate-300 font-medium">Capture Status:</span>
                    <span className={`font-bold ${isCapturing ? 'text-green-400' : 'text-red-400'}`}>
                      {isCapturing ? '● ACTIVE' : '● STOPPED'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-xl">
                    <span className="text-slate-300 font-medium">Network Interface:</span>
                    <span className="text-white font-mono font-semibold">{stats.interface || 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-xl">
                    <span className="text-slate-300 font-medium">AI Engine:</span>
                    <span className={`font-bold ${stats.scapy_available ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.scapy_available ? '● OPERATIONAL' : '● OFFLINE'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-xl">
                    <span className="text-slate-300 font-medium">Threat Database:</span>
                    <span className="text-green-400 font-bold">● UPDATED</span>
                  </div>
                </div>
              </div>

              {/* Protocol Distribution Chart */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                  Protocol Distribution Analysis
                </h4>
                <div className="space-y-4">
                  {stats?.protocol_distribution && Object.entries(stats.protocol_distribution).map(([protocol, count]) => {
                    const total = Number(stats?.total_packets || 0);
                    const percentage = total > 0 ? String(((Number(count as number) / total) * 100).toFixed(1)) : '0';
                    return (
                      <div key={protocol} className="flex items-center gap-4">
                        <div className="w-20 text-right">
                          <span className="text-slate-300 font-medium">{protocol}</span>
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-slate-700 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-1000"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-16 text-right">
                          <span className="text-blue-400 font-bold">{percentage}%</span>
                        </div>
                        <div className="w-20 text-right">
                          <span className="text-slate-400 text-sm">{count as number} packets</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'enterprise' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Enterprise Packet Capture Features</h3>
                  <p className="text-blue-200">Advanced enterprise-grade network security and monitoring capabilities</p>
                </div>
                <button
                  onClick={fetchEnterpriseFeatures}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Features
                </button>
              </div>

              {enterpriseFeatures ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(enterpriseFeatures).map(([feature, enabled]) => (
                    <div key={feature} className={`p-6 rounded-2xl border transition-all ${
                      enabled
                        ? 'bg-green-900/20 border-green-500/30 hover:border-green-400/50'
                        : 'bg-red-900/20 border-red-500/30 hover:border-red-400/50'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-white font-semibold capitalize">
                          {feature.replace(/_/g, ' ')}
                        </h4>
                        {enabled ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-400" />
                        )}
                      </div>
                      <div className={`text-sm ${enabled ? 'text-green-200' : 'text-red-200'}`}>
                        {enabled ? 'Active and operational' : 'Feature not available'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Settings className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
                  <div className="text-2xl font-bold text-white mb-3">Loading Enterprise Features</div>
                  <div className="text-indigo-200">Retrieving enterprise capabilities...</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'threats' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Advanced Threat Intelligence</h3>
                  <p className="text-orange-200">AI-powered threat detection and analysis system</p>
                </div>
                <button
                  onClick={fetchThreatIntelligence}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Intelligence
                </button>
              </div>

              {threatIntelligence ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 rounded-2xl p-6 border border-orange-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <Target className="w-8 h-8 text-orange-400" />
                        <span className="text-orange-200 text-sm font-medium">Total Detections</span>
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">{threatIntelligence.total_detections}</div>
                      <div className="text-orange-300 text-sm">Threat events detected</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-2xl p-6 border border-green-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                        <span className="text-green-200 text-sm font-medium">True Positives</span>
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">{threatIntelligence.true_positives}</div>
                      <div className="text-green-300 text-sm">Accurate detections</div>
                    </div>

                    <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-2xl p-6 border border-red-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <XCircle className="w-8 h-8 text-red-400" />
                        <span className="text-red-200 text-sm font-medium">False Positives</span>
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">{threatIntelligence.false_positives}</div>
                      <div className="text-red-300 text-sm">False alarms</div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-6 border border-blue-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <Zap className="w-8 h-8 text-blue-400" />
                        <span className="text-blue-200 text-sm font-medium">AI Accuracy</span>
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">{threatIntelligence.accuracy}%</div>
                      <div className="text-blue-300 text-sm">Detection accuracy</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                    <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                      <BarChart3 className="w-6 h-6 text-orange-400" />
                      Threat Type Distribution
                    </h4>
                    <div className="space-y-4">
                      {threatIntelligence.threat_breakdown && Object.entries(threatIntelligence.threat_breakdown).map(([threat, count]) => (
                        <div key={threat} className="flex items-center gap-4">
                          <div className="w-32 text-right">
                            <span className="text-slate-300 font-medium capitalize">
                              {threat.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="w-full bg-slate-700 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-1000"
                                style={{ width: `${(count as number) / Math.max(...Object.values(threatIntelligence.threat_breakdown)) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-16 text-right">
                            <span className="text-orange-400 font-bold">{count as number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Target className="w-16 h-16 text-orange-400 mx-auto mb-6" />
                  <div className="text-2xl font-bold text-white mb-3">Loading Threat Intelligence</div>
                  <div className="text-orange-200">Analyzing threat detection data...</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Compliance Monitoring</h3>
                  <p className="text-teal-200">Regulatory compliance and data protection monitoring</p>
                </div>
                <button
                  onClick={fetchComplianceStatus}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check Compliance
                </button>
              </div>

              {complianceStatus ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { name: 'GDPR', compliant: complianceStatus.gdpr_compliant, color: 'blue' },
                      { name: 'PCI DSS', compliant: complianceStatus.pci_compliant, color: 'green' },
                      { name: 'HIPAA', compliant: complianceStatus.hipaa_compliant, color: 'purple' }
                    ].map(standard => (
                      <div key={standard.name} className={`p-6 rounded-2xl border transition-all ${
                        standard.compliant
                          ? 'bg-green-900/20 border-green-500/30'
                          : 'bg-red-900/20 border-red-500/30'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-white font-bold text-xl">{standard.name}</h4>
                          {standard.compliant ? (
                            <CheckCircle className="w-8 h-8 text-green-400" />
                          ) : (
                            <XCircle className="w-8 h-8 text-red-400" />
                          )}
                        </div>
                        <div className={`text-sm font-medium ${
                          standard.compliant ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {standard.compliant ? 'Compliant' : 'Non-compliant'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {complianceStatus.violations && complianceStatus.violations.length > 0 && (
                    <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-500/30 rounded-2xl p-6">
                      <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        Compliance Violations
                      </h4>
                      <div className="space-y-4">
                        {complianceStatus.violations.map((violation, index) => (
                          <div key={index} className="flex items-center gap-4 p-4 bg-red-900/20 rounded-xl border border-red-500/20">
                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <span className="text-red-200 capitalize">{violation.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Lock className="w-16 h-16 text-teal-400 mx-auto mb-6" />
                  <div className="text-2xl font-bold text-white mb-3">Checking Compliance</div>
                  <div className="text-teal-200">Verifying regulatory compliance...</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'health' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">System Health Monitoring</h3>
                  <p className="text-cyan-200">Real-time system performance and health metrics</p>
                </div>
                <button
                  onClick={fetchSystemHealth}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check Health
                </button>
              </div>

              {systemHealth ? (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                      systemHealth.healthy
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {systemHealth.healthy ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Overall System Health: {systemHealth.healthy ? 'HEALTHY' : 'DEGRADED'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      {
                        name: 'Memory',
                        usage: systemHealth.memory.usage_percent,
                        healthy: systemHealth.memory.healthy,
                        icon: Database,
                        color: 'blue'
                      },
                      {
                        name: 'CPU',
                        usage: systemHealth.cpu.usage_percent,
                        healthy: systemHealth.cpu.healthy,
                        icon: Cpu,
                        color: 'green'
                      },
                      {
                        name: 'Disk',
                        usage: systemHealth.disk.usage_percent,
                        healthy: systemHealth.disk.healthy,
                        icon: HardDrive,
                        color: 'purple'
                      },
                      {
                        name: 'Network',
                        usage: systemHealth.network.healthy ? 0 : 100,
                        healthy: systemHealth.network.healthy,
                        icon: Network,
                        color: 'cyan'
                      }
                    ].map(metric => (
                      <div key={metric.name} className={`p-6 rounded-2xl border transition-all ${
                        metric.healthy
                          ? 'bg-green-900/20 border-green-500/30'
                          : 'bg-red-900/20 border-red-500/30'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <metric.icon className={`w-8 h-8 ${metric.healthy ? 'text-green-400' : 'text-red-400'}`} />
                          <span className={`text-sm font-medium ${
                            metric.healthy ? 'text-green-200' : 'text-red-200'
                          }`}>
                            {metric.name}
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-2">
                          {metric.name === 'Network' ? (metric.healthy ? 'OK' : 'FAIL') : `${metric.usage.toFixed(1)}%`}
                        </div>
                        <div className={`text-sm ${metric.healthy ? 'text-green-300' : 'text-red-300'}`}>
                          {metric.healthy ? 'Normal' : 'Warning'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Monitor className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
                  <div className="text-2xl font-bold text-white mb-3">Monitoring System Health</div>
                  <div className="text-cyan-200">Checking system performance...</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Active Security Alerts</h3>
                  <p className="text-yellow-200">Real-time security alerts and notifications</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={fetchActiveAlerts}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Alerts
                  </button>
                  <button className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-all flex items-center gap-2">
                    <BellOff className="w-4 h-4" />
                    Acknowledge All
                  </button>
                </div>
              </div>

              {activeAlerts.length > 0 ? (
                <div className="space-y-6">
                  {activeAlerts.map((alert, index) => (
                    <div key={alert.id || index} className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/10 border border-yellow-500/30 rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-yellow-500/20 rounded-xl border border-yellow-400/30">
                            <AlertTriangle className="w-6 h-6 text-yellow-400" />
                          </div>
                          <div>
                            <div className="text-white font-bold text-xl mb-1">{alert.title}</div>
                            <div className="text-yellow-200 text-sm">{alert.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-200 text-sm mb-1">Severity</div>
                          <div className={`px-3 py-1 rounded-xl text-sm font-bold ${
                            alert.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                            alert.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {alert.severity?.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {alert.packet_info && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                          <div className="space-y-4">
                            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-600/30">
                              <div className="flex items-center gap-2 mb-2">
                                <Globe className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-200 font-medium">Source Analysis</span>
                              </div>
                              <div className="text-white font-mono text-lg font-semibold">
                                {alert.packet_info.src_ip}:{alert.packet_info.src_port}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-600/30">
                              <div className="flex items-center gap-2 mb-2">
                                <Server className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-200 font-medium">Target Analysis</span>
                              </div>
                              <div className="text-white font-mono text-lg font-semibold">
                                {alert.packet_info.dst_ip}:{alert.packet_info.dst_port}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-slate-400 text-sm">
                          {new Date(alert.timestamp * 1000).toLocaleString()}
                        </div>
                        <button className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Acknowledge Alert
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
                  <div className="text-2xl font-bold text-green-400 mb-3">All Clear</div>
                  <div className="text-blue-200 mb-6 text-lg">No active security alerts detected</div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-xl text-sm font-semibold">
                      ✅ Zero Active Alerts
                    </div>
                    <div className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-sm font-semibold">
                      🔍 Continuous Monitoring
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Performance Metrics</h3>
                  <p className="text-pink-200">Detailed performance analysis and system metrics</p>
                </div>
                <button
                  onClick={fetchPerformanceMetrics}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Update Metrics
                </button>
              </div>

              {performanceMetrics ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                      <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                        <Activity className="w-6 h-6 text-blue-400" />
                        Packet Capture Performance
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Avg Packet Size:</span>
                          <span className="text-blue-400 font-bold">
                            {performanceMetrics.packet_capture?.packet_sizes_avg ? performanceMetrics.packet_capture.packet_sizes_avg.toFixed(1) : 'N/A'} bytes
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Processing Time:</span>
                          <span className="text-blue-400 font-bold">
                            {performanceMetrics.packet_capture?.processing_times_avg ? performanceMetrics.packet_capture.processing_times_avg.toFixed(3) : 'N/A'} ms
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Packets Processed:</span>
                          <span className="text-blue-400 font-bold">
                            {performanceMetrics.packet_capture?.count || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                      <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                        <Server className="w-6 h-6 text-green-400" />
                        System Performance
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">CPU Usage:</span>
                          <span className="text-green-400 font-bold">
                            {performanceMetrics.system?.cpu_usage ? performanceMetrics.system.cpu_usage.toFixed(1) : 'N/A'}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Memory Usage:</span>
                          <span className="text-green-400 font-bold">
                            {performanceMetrics.system?.memory_usage ? performanceMetrics.system.memory_usage.toFixed(1) : 'N/A'}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Disk Usage:</span>
                          <span className="text-green-400 font-bold">
                            {performanceMetrics.system?.disk_usage ? performanceMetrics.system.disk_usage.toFixed(1) : 'N/A'}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Network Connections:</span>
                          <span className="text-green-400 font-bold">
                            {performanceMetrics.system?.network_connections || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Zap className="w-16 h-16 text-pink-400 mx-auto mb-6" />
                  <div className="text-2xl font-bold text-white mb-3">Analyzing Performance</div>
                  <div className="text-pink-200">Collecting performance metrics...</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Audit Logs</h3>
                  <p className="text-gray-200">Comprehensive audit trail of all packet capture activities</p>
                </div>
                <button
                  onClick={fetchAuditLogs}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Logs
                </button>
              </div>

              {auditLogs.length > 0 ? (
                <div className="space-y-4">
                  {auditLogs.map((log, index) => (
                    <div key={index} className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-2xl border border-slate-600/30 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
                            log.is_malicious ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                          }`}>
                            {log.is_malicious ? 'THREAT' : 'NORMAL'}
                          </div>
                          <div className="text-white font-mono text-lg font-semibold">
                            {log.src_ip}:{log.src_port} → {log.dst_ip}:{log.dst_port}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-400 text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                          <div className="text-slate-300 text-sm mt-1">
                            User: {log.user}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-400 font-medium">Protocol:</span>
                          <span className="text-white font-semibold">{log.protocol}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-400 font-medium">Size:</span>
                          <span className="text-white font-semibold">{log.size} bytes</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-400 font-medium">Action:</span>
                          <span className="text-blue-400 font-semibold capitalize">{log.action.replace(/_/g, ' ')}</span>
                        </div>
                      </div>

                      {log.threat_type && log.threat_type !== 'none' && (
                        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-red-200 font-medium">Threat Details</span>
                          </div>
                          <div className="text-red-300">
                            Type: {log.threat_type} | Score: {log.threat_score}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                  <div className="text-2xl font-bold text-white mb-3">No Audit Logs</div>
                  <div className="text-gray-200">Audit logs will appear here as activities are logged</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">System Configuration</h3>
                  <p className="text-slate-200">Packet capture system configuration and settings</p>
                </div>
                <button
                  onClick={fetchConfiguration}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Config
                </button>
              </div>

              {configuration ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                      <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                        <Network className="w-6 h-6 text-blue-400" />
                        Capture Configuration
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Interface:</span>
                          <span className="text-blue-400 font-bold">
                            {configuration.capture.interface || 'Auto-detect'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Promiscuous Mode:</span>
                          <span className={`font-bold ${
                            configuration.capture.promiscuous_mode ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {configuration.capture.promiscuous_mode ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Buffer Size:</span>
                          <span className="text-blue-400 font-bold">
                            {configuration.capture.buffer_size} bytes
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                      <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                        <Shield className="w-6 h-6 text-red-400" />
                        Detection Configuration
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Threat Threshold:</span>
                          <span className="text-red-400 font-bold">
                            {configuration.detection.threat_threshold}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Active Rules:</span>
                          <span className="text-red-400 font-bold">
                            {configuration.detection.enabled_rules.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">False Positive Tolerance:</span>
                          <span className="text-red-400 font-bold">
                            {(configuration.detection.false_positive_tolerance * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                    <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                      <Settings className="w-6 h-6 text-purple-400" />
                      Enterprise Features
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(configuration.enterprise).map(([feature, enabled]) => (
                        <div key={feature} className={`p-4 rounded-xl border text-center ${
                          enabled
                            ? 'bg-green-900/20 border-green-500/30'
                            : 'bg-red-900/20 border-red-500/30'
                        }`}>
                          <div className={`text-sm font-medium mb-2 capitalize ${
                            enabled ? 'text-green-300' : 'text-red-300'
                          }`}>
                            {feature.replace(/_/g, ' ')}
                          </div>
                          <div className={`text-xs ${
                            enabled ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {enabled ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Settings className="w-16 h-16 text-slate-400 mx-auto mb-6" />
                  <div className="text-2xl font-bold text-white mb-3">Loading Configuration</div>
                  <div className="text-slate-200">Retrieving system configuration...</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Advanced Network Analytics</h3>
                  <p className="text-indigo-200">Comprehensive network traffic analysis and insights</p>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={analyticsTimeframe}
                    onChange={(e) => setAnalyticsTimeframe(e.target.value)}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                  <button
                    onClick={fetchAdvancedAnalytics}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Analyze Data
                  </button>
                </div>
              </div>

              {advancedAnalytics ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-6 border border-blue-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <Globe className="w-8 h-8 text-blue-400" />
                        <span className="text-blue-200 text-sm font-medium">Total Packets</span>
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">{advancedAnalytics.total_packets.toLocaleString()}</div>
                      <div className="text-blue-300 text-sm">Captured packets</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-2xl p-6 border border-green-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <Network className="w-8 h-8 text-green-400" />
                        <span className="text-green-200 text-sm font-medium">Unique IPs</span>
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">{advancedAnalytics.unique_ips.toLocaleString()}</div>
                      <div className="text-green-300 text-sm">Active endpoints</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-2xl p-6 border border-purple-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <Server className="w-8 h-8 text-purple-400" />
                        <span className="text-purple-200 text-sm font-medium">Data Volume</span>
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">{(advancedAnalytics.total_bytes / 1024 / 1024).toFixed(1)} MB</div>
                      <div className="text-purple-300 text-sm">Transferred data</div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 rounded-2xl p-6 border border-orange-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <AlertTriangle className="w-8 h-8 text-orange-400" />
                        <span className="text-orange-200 text-sm font-medium">Threats Detected</span>
                      </div>
                      <div className="text-4xl font-bold text-white mb-2">{advancedAnalytics.threats_detected}</div>
                      <div className="text-orange-300 text-sm">Security events</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                      <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 text-blue-400" />
                        Protocol Distribution
                      </h4>
                      <div className="space-y-4">
                        {Object.entries(advancedAnalytics.protocol_distribution).map(([protocol, count]) => (
                          <div key={protocol} className="flex items-center gap-4">
                            <div className="w-20 text-right">
                              <span className="text-slate-300 font-medium">{protocol}</span>
                            </div>
                            <div className="flex-1">
                              <div className="w-full bg-slate-700 rounded-full h-3">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-1000"
                                  style={{ width: `${(count as number) / Math.max(...Object.values(advancedAnalytics.protocol_distribution)) * 100}%` }}
                                />
                              </div>
                            </div>
                            <div className="w-16 text-right">
                              <span className="text-blue-400 font-bold">{count as number}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                      <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                        Hourly Traffic Pattern
                      </h4>
                      <div className="space-y-3">
                        {advancedAnalytics.hourly_traffic.map((count, hour) => (
                          <div key={hour} className="flex items-center gap-4">
                            <div className="w-12 text-right">
                              <span className="text-slate-300 text-sm">{hour.toString().padStart(2, '0')}:00</span>
                            </div>
                            <div className="flex-1">
                              <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${(count / Math.max(...advancedAnalytics.hourly_traffic)) * 100}%` }}
                                />
                              </div>
                            </div>
                            <div className="w-16 text-right">
                              <span className="text-green-400 font-bold text-sm">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                    <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                      <Server className="w-6 h-6 text-purple-400" />
                      Top Talkers (Source IPs)
                    </h4>
                    <div className="space-y-4">
                      {advancedAnalytics.top_talkers.slice(0, 10).map(([ip, count], index) => (
                        <div key={ip} className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                          <div className="w-8 text-center">
                            <span className="text-purple-400 font-bold">#{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <span className="text-white font-mono font-semibold">{ip}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-purple-400 font-bold">{count} packets</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                    <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                      <Globe className="w-6 h-6 text-cyan-400" />
                      Geographic Distribution
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(advancedAnalytics.geo_distribution).slice(0, 9).map(([country, count]) => (
                        <div key={country} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                          <div className="text-white font-semibold mb-2">{country}</div>
                          <div className="text-cyan-400 font-bold">{count} packets</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <BarChart3 className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
                  <div className="text-2xl font-bold text-white mb-3">Analyzing Network Data</div>
                  <div className="text-indigo-200">Generating advanced analytics...</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Data Export</h3>
                  <p className="text-emerald-200">Export packet capture data and analytics in various formats</p>
                </div>
                <button
                  onClick={fetchExportData}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Prepare Export
                </button>
              </div>

              {exportDataState ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-2xl p-6 border border-emerald-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <FileText className="w-8 h-8 text-emerald-400" />
                        <span className="text-emerald-200 text-sm font-medium">JSON Export</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">{exportDataState.json_packets} packets</div>
                      <button className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all">
                        Download JSON
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-6 border border-blue-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <FileSpreadsheet className="w-8 h-8 text-blue-400" />
                        <span className="text-blue-200 text-sm font-medium">CSV Export</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">{exportDataState.csv_packets} packets</div>
                      <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all">
                        Download CSV
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-2xl p-6 border border-purple-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <Archive className="w-8 h-8 text-purple-400" />
                        <span className="text-purple-200 text-sm font-medium">PCAP Export</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">{exportDataState.pcap_packets} packets</div>
                      <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all">
                        Download PCAP
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                    <h4 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
                      <Settings className="w-6 h-6 text-slate-400" />
                      Export Configuration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Include Metadata:</span>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-white text-sm">Yes</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Compress Files:</span>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-white text-sm">Yes</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Time Range:</span>
                          <select className="px-3 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm">
                            <option>All Data</option>
                            <option>Last Hour</option>
                            <option>Last 24 Hours</option>
                            <option>Last 7 Days</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Filter Threats:</span>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-white text-sm">Only Threats</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Download className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
                  <div className="text-2xl font-bold text-white mb-3">Preparing Export Data</div>
                  <div className="text-emerald-200">Gathering data for export...</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PacketCapture;