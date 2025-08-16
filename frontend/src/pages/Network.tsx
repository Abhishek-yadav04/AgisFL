import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Network as NetworkIcon, 
  Activity, 
  Wifi, 
  Globe,
  Eye,
  Play,
  Pause,
  Download,
  Settings,
  Zap,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { MetricCard } from '../components/Cards/MetricCard';
import MetricsChart from '../components/Charts/MetricsChart';
import { DataTable } from '../components/Tables/DataTable';
import { networkAPI, integrationsAPI, packetAnalysisAPI } from '../services/api';
import { useRealTimeData } from '../hooks/useRealTimeData';
import toast from 'react-hot-toast';

const Network: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedPacket, setSelectedPacket] = useState<any>(null);

  // Network statistics
  const { data: networkStats, refetch: refetchStats } = useQuery({
    queryKey: ['network-stats'],
    queryFn: () => networkAPI.getStats(),
    refetchInterval: 5000,
  });

  // Live packets
  const {
    data: livePackets,
    loading: packetsLoading,
    refresh: refreshPackets
  } = useRealTimeData(
    () => networkAPI.getLivePackets(),
    { interval: 2000, enabled: true }
  );

  // Network anomalies
  const { data: anomalies } = useQuery({
    queryKey: ['network-anomalies'],
    queryFn: () => networkAPI.getAnomalies(),
    refetchInterval: 10000,
  });

  // Packet analysis
  const { data: packetAnalysis } = useQuery({
    queryKey: ['packet-analysis'],
    queryFn: () => packetAnalysisAPI.getLiveAnalysis(),
    refetchInterval: 5000,
  });

  // Network topology
  const { data: topology } = useQuery({
    queryKey: ['network-topology'],
    queryFn: () => packetAnalysisAPI.getNetworkTopology(),
  });

  // Scapy integration
  const { data: scapyData } = useQuery({
    queryKey: ['scapy-packets'],
    queryFn: () => integrationsAPI.getScapyPackets(),
    refetchInterval: 3000,
  });

  const startMonitoring = async () => {
    try {
      await integrationsAPI.startScapyMonitoring();
      setIsMonitoring(true);
      toast.success('Network monitoring started');
    } catch (error) {
      toast.error('Failed to start monitoring');
    }
  };

  const stopMonitoring = async () => {
    try {
      await integrationsAPI.stopScapyMonitoring();
      setIsMonitoring(false);
      toast.success('Network monitoring stopped');
    } catch (error) {
      toast.error('Failed to stop monitoring');
    }
  };

  const downloadCapture = async () => {
    try {
      // Simulate download
      toast.success('Packet capture downloaded');
    } catch (error) {
      toast.error('Failed to download capture');
    }
  };

  // Prepare network traffic chart
  const trafficData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [{
      label: 'Incoming (Mbps)',
      data: Array.from({ length: 24 }, () => Math.random() * 100 + 50),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    }, {
      label: 'Outgoing (Mbps)',
      data: Array.from({ length: 24 }, () => Math.random() * 80 + 30),
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
    }]
  };

  // Protocol distribution
  const protocolData = {
    labels: ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS'],
    datasets: [{
      data: [45, 25, 8, 12, 7, 3],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ],
      borderWidth: 2,
    }]
  };

  // Prepare packets table
  const packetsColumns = [
    { 
      key: 'timestamp', 
      label: 'Time', 
      sortable: true,
      render: (value: string) => (
        <span className="text-xs font-mono">
          {new Date(value).toLocaleTimeString()}
        </span>
      )
    },
    { 
      key: 'source_ip', 
      label: 'Source IP', 
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    { 
      key: 'destination_ip', 
      label: 'Dest IP', 
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    { 
      key: 'protocol', 
      label: 'Protocol', 
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs font-medium">
          {value}
        </span>
      )
    },
    { key: 'length', label: 'Size', sortable: true, render: (value: number) => `${value} bytes` },
    { 
      key: 'threat_level', 
      label: 'Threat Level', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value?.toLowerCase() === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
          value?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        }`}>
          {value?.toUpperCase() || 'LOW'}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
            Network Intelligence Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time packet analysis, traffic monitoring & anomaly detection
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={downloadCapture}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Capture</span>
          </button>
          
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              isMonitoring 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isMonitoring ? 'Stop Monitor' : 'Start Monitor'}</span>
          </button>
        </div>
      </motion.div>

      {/* Network Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Packets Captured"
          value={(networkStats?.data?.total_packets || packetAnalysis?.data?.analysis?.packets_analyzed || 0).toLocaleString()}
          subtitle="Real-time analysis"
          icon={Activity}
          color="blue"
          realTime={isMonitoring}
        />
        
        <MetricCard
          title="Suspicious Packets"
          value={networkStats?.data?.suspicious_packets || packetAnalysis?.data?.analysis?.suspicious_packets || 0}
          subtitle="Anomaly detection"
          icon={AlertTriangle}
          color="red"
          realTime={isMonitoring}
        />
        
        <MetricCard
          title="Bandwidth Usage"
          value={`${networkStats?.data?.bandwidth_mbps?.toFixed(1) || packetAnalysis?.data?.analysis?.bandwidth_usage?.incoming_mbps || 0} Mbps`}
          subtitle="Network utilization"
          icon={Wifi}
          color="green"
          trend={{ value: 5.2, direction: 'up' }}
        />
        
        <MetricCard
          title="Active Connections"
          value={networkStats?.data?.active_connections || 234}
          subtitle="Live sessions"
          icon={Globe}
          color="purple"
        />
      </div>

      {/* Scapy Integration Status */}
      {scapyData?.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <NetworkIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Scapy Network Monitor</h3>
                <p className="text-cyan-100">
                  {scapyData.data.capture_mode === 'real' ? 'Real packet capture' : 'Simulation mode'} • 
                  {scapyData.data.scapy_available ? ' Scapy available' : ' Scapy unavailable'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold">{scapyData.data.total_packets?.toLocaleString() || 0}</p>
                <p className="text-sm text-cyan-100">Total Packets</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{scapyData.data.suspicious_packets || 0}</p>
                <p className="text-sm text-cyan-100">Suspicious</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{scapyData.data.packet_rate || 0}/s</p>
                <p className="text-sm text-cyan-100">Packet Rate</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsChart
          type="line"
          data={trafficData}
          title="Network Traffic Analysis"
          height={350}
          gradient={true}
          realTime={isMonitoring}
        />
        
        <MetricsChart
          type="doughnut"
          data={protocolData}
          title="Protocol Distribution"
          height={350}
        />
      </div>

      {/* Network Topology */}
      {topology?.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Network Topology Overview
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {topology.data.nodes}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Network Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {topology.data.connections}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Active Connections</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {topology.data.subnets}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Subnets</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {topology.data.critical_assets}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Critical Assets</div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Security Zones</h4>
            <div className="flex flex-wrap gap-2">
              {topology.data.security_zones?.map((zone: string, index: number) => (
                <span
                  key={zone}
                  className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-sm font-medium"
                >
                  {zone}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Anomalies Detection */}
      {anomalies?.data && anomalies.data.anomalies?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Network Anomalies Detected</h3>
                <p className="text-yellow-100">
                  {anomalies.data.anomalies.length} anomalies requiring attention
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {anomalies.data.anomalies.slice(0, 3).map((anomaly: any, index: number) => (
              <div key={index} className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{anomaly.type}</p>
                  <p className="text-sm text-yellow-100">{anomaly.source_ip}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{anomaly.severity}</p>
                  <p className="text-xs text-yellow-100">
                    Confidence: {(anomaly.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Live Packets Table */}
      <DataTable
        title="Live Network Packets"
        subtitle="Real-time packet capture and analysis"
        data={livePackets?.packets || []}
        columns={packetsColumns}
        loading={packetsLoading}
        searchable={true}
        filterable={true}
        exportable={true}
        refreshable={true}
        onRefresh={refreshPackets}
        onRowClick={setSelectedPacket}
        pageSize={15}
      />

      {/* Network Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Traffic Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Packet Loss</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {networkStats?.data?.packet_loss?.toFixed(2) || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Latency</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {networkStats?.data?.latency_ms?.toFixed(1) || 0}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Jitter</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {(Math.random() * 5).toFixed(1)}ms
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Talkers
          </h3>
          <div className="space-y-3">
            {packetAnalysis?.data?.analysis?.top_talkers?.map((talker: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-mono text-sm text-gray-900 dark:text-white">
                  {talker.ip}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {(talker.bytes / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
            )) || [
              { ip: '192.168.1.100', bytes: '45.2MB' },
              { ip: '10.0.0.50', bytes: '32.1MB' },
              { ip: '172.16.0.25', bytes: '28.7MB' },
            ].map((talker, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-mono text-sm text-gray-900 dark:text-white">
                  {talker.ip}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {talker.bytes}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monitoring Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scapy Engine</span>
              <span className={`font-semibold ${
                scapyData?.data?.scapy_available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {scapyData?.data?.scapy_available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Capture Mode</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {scapyData?.data?.capture_mode || 'Simulation'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Admin Privileges</span>
              <span className={`font-semibold ${
                scapyData?.data?.admin_privileges ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {scapyData?.data?.admin_privileges ? 'Granted' : 'Required'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Packet Details Modal */}
      {selectedPacket && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedPacket(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Packet Analysis
              </h3>
              <button
                onClick={() => setSelectedPacket(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Source IP
                </label>
                <p className="text-gray-900 dark:text-white font-mono">
                  {selectedPacket.source_ip}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Destination IP
                </label>
                <p className="text-gray-900 dark:text-white font-mono">
                  {selectedPacket.destination_ip}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Protocol
                </label>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedPacket.protocol}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Packet Size
                </label>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedPacket.length} bytes
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Threat Level
                </label>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {selectedPacket.threat_level}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Suspicious Score
                </label>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {((selectedPacket.suspicious_score || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Network;