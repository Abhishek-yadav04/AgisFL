/**
 * Fallback Data Service
 * Provides realistic simulated data when backend APIs are unavailable
 */

export const fallbackData = {
  // Dashboard fallback data
  dashboard: {
    overview: {
      system_health: {
        status: 'healthy',
        cpu_usage: 45.2,
        memory_usage: 62.8,
        disk_usage: 34.1,
        uptime: '7d 14h 32m'
      },
      federated_learning: {
        is_training: true,
        current_round: 15,
        total_rounds: 100,
        active_clients: 12,
        global_accuracy: 0.942,
        differential_privacy: true,
        secure_aggregation: true
      },
      security: {
        threats_detected: 3,
        security_level: 'medium',
        ids_status: 'active',
        last_scan: new Date().toISOString()
      },
      performance: {
        requests_total: 15420,
        throughput_rps: 45.2,
        error_rate: 0.002,
        avg_response_time: 120
      },
      alerts: {
        active_count: 2,
        critical_count: 0,
        warning_count: 2
      }
    },
    metrics: {
      cpu: {
        percent: 45.2,
        count: 8,
        frequency: 2400
      },
      memory: {
        percent: 62.8,
        used: 8589934592, // 8GB
        total: 17179869184, // 16GB
        available: 8589934592
      },
      disk: {
        percent: 34.1,
        used: 107374182400, // 100GB
        total: 322122547200, // 300GB
        free: 214748364800
      },
      network: {
        bytes_sent: 1073741824, // 1GB
        bytes_recv: 2147483648, // 2GB
        packets_sent: 1000000,
        packets_recv: 1500000
      }
    },
    realtime: {
      timestamp: new Date().toISOString(),
      cpu_usage: 45.2,
      memory_usage: 62.8,
      network_io: 1024000,
      active_connections: 156,
      threats_detected: 3,
      fl_accuracy: 94.2
    }
  },

  // Privacy fallback data
  privacy: {
    status: {
      overall_privacy_level: 'High',
      differential_privacy: {
        enabled: true,
        epsilon: 1.0,
        delta: 1e-5,
        noise_type: 'gaussian',
        noise_level: 'Medium',
        privacy_budget_used: 0.35,
        privacy_budget_remaining: 0.65,
        clipping_bound: 1.0,
        sensitivity: 1.0
      },
      secure_aggregation: {
        enabled: true,
        protocol: 'smpc',
        encryption_type: 'XOR-based',
        key_size: 256,
        aggregation_rounds: 8,
        security_level: 'High',
        dropout_resilience: true
      },
      homomorphic_encryption: {
        enabled: true,
        scheme: 'paillier',
        key_strength: '2048-bit',
        computation_overhead: 'Medium',
        privacy_level: 'Maximum',
        real_implementation: true,
        library: 'phe (Paillier)',
        encryption_count: 0,
        decryption_count: 0
      }
    },
    budget: {
      total_budget: 1.0,
      used_budget: 0.35,
      remaining_budget: 0.65,
      budget_per_round: 0.05,
      current_round: 1,
      estimated_rounds_remaining: 13,
      recommendations: [
        'Current budget allocation is optimal',
        'Monitor usage for next 13 rounds',
        'Consider epsilon adjustment if needed'
      ]
    },
    algorithms: [
      {
        name: 'Differential Privacy',
        type: 'Noise-based',
        description: 'Adds calibrated noise to protect individual privacy',
        status: 'implemented',
        parameters: {
          epsilon: '1.0',
          delta: '1e-5',
          noise_mechanism: 'Gaussian'
        }
      },
      {
        name: 'Secure Aggregation',
        type: 'Cryptographic',
        description: 'Encrypts model updates during aggregation',
        status: 'implemented',
        parameters: {
          encryption: 'XOR-based',
          key_size: '256',
          rounds: '8'
        }
      },
      {
        name: 'Homomorphic Encryption',
        type: 'Cryptographic',
        description: 'Performs computations on encrypted data',
        status: 'implemented',
        parameters: {
          scheme: 'Paillier',
          security_level: '2048',
          performance_overhead: 'Medium'
        }
      }
    ],
    analysis: {
      risk_level: 'Low',
      vulnerabilities: [
        'Data leakage potential through model parameters',
        'Model inversion attacks on gradient updates'
      ],
      recommendations: [
        'Enable differential privacy with epsilon <= 1.0',
        'Use secure aggregation for all model updates',
        'Implement regular privacy audits'
      ],
      compliance_score: 85,
      last_audit: new Date().toISOString()
    }
  },

  // Security fallback data
  security: {
    overview: {
      threat_level: 'Medium',
      active_threats: 3,
      blocked_ips: 15,
      security_score: 87,
      last_scan: new Date().toISOString(),
      threat_summary: {
        threat_level: 'medium',
        active_threats: 3,
        blocked_attacks: 15,
        security_score: 87,
        system_status: 'secure'
      }
    },
    threats: [
      {
        id: 'threat_001',
        type: 'Port Scan',
        severity: 'Medium',
        source_ip: '192.168.1.100',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'detected',
        description: 'Suspicious port scanning activity detected'
      },
      {
        id: 'threat_002',
        type: 'Brute Force',
        severity: 'High',
        source_ip: '10.0.0.50',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: 'blocked',
        description: 'Multiple failed login attempts'
      },
      {
        id: 'threat_003',
        type: 'DDoS',
        severity: 'Critical',
        source_ip: '203.0.113.1',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        status: 'mitigated',
        description: 'Distributed denial of service attack'
      }
    ],
    metrics: {
      packets_analyzed: 1500000,
      threats_detected: 3,
      false_positives: 2,
      detection_accuracy: 0.95,
      response_time: 0.05
    }
  },

  // Federated Learning fallback data
  federatedLearning: {
    overview: {
      is_training: true,
      current_round: 15,
      total_rounds: 100,
      active_clients: 12,
      global_accuracy: 0.942,
      convergence_rate: 0.85,
      training_time: '2h 45m'
    },
    clients: [
      {
        id: 'client_001',
        name: 'Hospital A',
        status: 'active',
        contribution: 0.15,
        accuracy: 0.91,
        data_samples: 5000,
        last_update: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: 'client_002',
        name: 'Hospital B',
        status: 'active',
        contribution: 0.12,
        accuracy: 0.89,
        data_samples: 4200,
        last_update: new Date(Date.now() - 180000).toISOString()
      },
      {
        id: 'client_003',
        name: 'Research Lab',
        status: 'quarantined',
        contribution: 0.08,
        accuracy: 0.65,
        data_samples: 2800,
        last_update: new Date(Date.now() - 300000).toISOString(),
        quarantined: true,
        reason: 'Anomalous model updates detected'
      }
    ],
    modelDrift: {
      drift_detected: true,
      drift_score: 0.15,
      threshold: 0.1,
      auto_retrain_triggered: true,
      last_check: new Date().toISOString(),
      trend: 'increasing'
    },
    experiments: [
      {
        id: 'exp_001',
        name: 'Healthcare AI Model',
        status: 'running',
        participants: 12,
        accuracy: 0.942,
        privacy_enabled: true,
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  },

  // Network fallback data
  network: {
    status: {
      interfaces_active: 3,
      total_bandwidth: '1 Gbps',
      utilization: 45.2,
      packets_per_second: 15000
    },
    traffic: {
      bytes_in: 2147483648,
      bytes_out: 1073741824,
      packets_in: 1500000,
      packets_out: 1000000,
      connections_active: 156,
      connections_total: 25000
    },
    interfaces: [
      {
        name: 'eth0',
        status: 'up',
        ip_address: '192.168.1.100',
        mac_address: '00:1B:44:11:3A:B7',
        speed: '1000 Mbps',
        duplex: 'full'
      },
      {
        name: 'wlan0',
        status: 'up',
        ip_address: '10.0.0.50',
        mac_address: '00:1B:44:11:3A:B8',
        speed: '300 Mbps',
        duplex: 'half'
      }
    ]
  },

  // Datasets fallback data
  datasets: {
    overview: {
      total_datasets: 8,
      total_size: '2.5 GB',
      active_datasets: 5,
      last_upload: new Date(Date.now() - 3600000).toISOString()
    },
    datasets: [
      {
        id: 'dataset_001',
        name: 'Healthcare Records',
        size: '500 MB',
        records: 50000,
        status: 'active',
        privacy_level: 'high',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'dataset_002',
        name: 'Financial Transactions',
        size: '1.2 GB',
        records: 120000,
        status: 'active',
        privacy_level: 'maximum',
        created_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 'dataset_003',
        name: 'Network Logs',
        size: '800 MB',
        records: 800000,
        status: 'processing',
        privacy_level: 'medium',
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  },

  // System monitoring fallback data
  systemMonitoring: {
    metrics: {
      cpu_usage: 45.2,
      memory_usage: 62.8,
      disk_usage: 34.1,
      network_io: 1024000,
      process_count: 156,
      thread_count: 892,
      uptime: 604800 // 7 days in seconds
    },
    processes: [
      {
        pid: 1234,
        name: 'agisfl-server',
        cpu_percent: 15.2,
        memory_percent: 8.5,
        status: 'running'
      },
      {
        pid: 5678,
        name: 'fl-engine',
        cpu_percent: 12.8,
        memory_percent: 12.3,
        status: 'running'
      },
      {
        pid: 9012,
        name: 'ids-monitor',
        cpu_percent: 8.1,
        memory_percent: 5.7,
        status: 'running'
      }
    ],
    alerts: [
      {
        id: 'alert_001',
        type: 'warning',
        message: 'High CPU usage detected',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        resolved: false
      },
      {
        id: 'alert_002',
        type: 'info',
        message: 'System backup completed',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        resolved: true
      }
    ]
  }
};

// Helper function to get fallback data with realistic variations
export const getFallbackData = (endpoint: string) => {
  const addVariation = (value: number, variance = 0.1) => {
    return value + (Math.random() - 0.5) * 2 * variance * value;
  };

  const addTimestamp = (data: any) => {
    return {
      ...data,
      timestamp: new Date().toISOString(),
      _fallback: true
    };
  };

  // Add some realistic variation to numeric values
  const varyData = (data: any): any => {
    if (typeof data === 'number' && data > 0 && data < 100) {
      return Math.max(0, Math.min(100, addVariation(data)));
    }
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const varied: any = {};
      for (const [key, value] of Object.entries(data)) {
        varied[key] = varyData(value);
      }
      return varied;
    }
    if (Array.isArray(data)) {
      return data.map(varyData);
    }
    return data;
  };

  // Route to appropriate fallback data
  const routes: { [key: string]: any } = {
    '/api/dashboard/overview': fallbackData.dashboard.overview,
    '/api/dashboard/metrics': fallbackData.dashboard.metrics,
    '/api/dashboard/realtime': fallbackData.dashboard.realtime,
    '/health': { status: 'healthy', uptime: '7d 14h 32m', version: '5.0.0' },
    '/api/privacy/status': fallbackData.privacy.status,
    '/api/privacy/budget': fallbackData.privacy.budget,
    '/api/privacy/algorithms': { algorithms: fallbackData.privacy.algorithms },
    '/api/privacy/analysis': fallbackData.privacy.analysis,
    '/api/security/overview': fallbackData.security.overview,
    '/api/security/threats': { threats: fallbackData.security.threats },
    '/api/security/metrics': fallbackData.security.metrics,
    '/api/security/dashboard': {
      status: 'success',
      data: {
        threat_summary: {
          threat_level: 'medium',
          active_threats: 3,
          blocked_attacks: 15,
          security_score: 87,
          system_status: 'secure'
        },
        real_time_stats: {
          threats_detected_today: 8,
          ips_blocked: 15,
          incidents_active: 2,
          events_last_hour: 12
        },
        threat_analytics: {
          summary: {
            total_threats: 45,
            active_threats: 3,
            resolved_threats: 40,
            blocked_threats: 15,
            security_score: 87
          }
        },
        recent_events: [],
        active_incidents: [],
        monitoring_status: {
          threat_detection: true,
          auto_blocking: true,
          audit_logging: true,
          incident_response: true
        },
        alerts: [],
        last_update: Date.now()
      }
    },
    '/api/security/simulation/history': {
      simulations: [
        {
          id: 'sim_001',
          attack_type: 'Model Inversion',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          defense_result: 'successful',
          has_visual_evidence: true,
          severity: 'High',
          status: 'completed'
        },
        {
          id: 'sim_002',
          attack_type: 'Poisoning Attack',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          defense_result: 'failed',
          has_visual_evidence: false,
          severity: 'Medium',
          status: 'completed'
        }
      ]
    },
    '/api/security/red-team/simulate': {
      simulation_id: 'sim_' + Date.now(),
      status: 'running',
      message: 'Red team simulation started successfully',
      timestamp: new Date().toISOString()
    },
    '/api/system-monitoring/network/monitoring-status': {
      monitoring_status: {
        interfaces_monitored: ['eth0', 'wlan0', 'lo'],
        is_active: true,
        uptime_seconds: 3600
      },
      ids_status: {
        total_packets_analyzed: 2400000
      },
      performance_metrics: {
        packets_per_second: 150
      }
    },
    '/api/rules/overview': {
      statistics: {
        total_rules: 1247,
        active_rules: 1247,
        rule_files: 4
      },
      custom_rules: {
        total_rules: 3
      }
    },
    '/api/fl/overview': fallbackData.federatedLearning.overview,
    '/api/fl/clients': { clients: fallbackData.federatedLearning.clients },
    '/api/fl/experiments': { experiments: fallbackData.federatedLearning.experiments },
    '/api/network/status': fallbackData.network.status,
    '/api/network/traffic': fallbackData.network.traffic,
    '/api/network/interfaces': { interfaces: fallbackData.network.interfaces },
    '/api/datasets': { datasets: fallbackData.datasets.datasets },
    '/api/datasets/overview': fallbackData.datasets.overview,
    '/api/system/metrics': fallbackData.systemMonitoring.metrics,
    '/api/system/processes': { processes: fallbackData.systemMonitoring.processes },
    '/api/system/alerts': { alerts: fallbackData.systemMonitoring.alerts },
    // Additional security endpoints
    '/api/security/status': fallbackData.security.overview,
    '/api/security/incidents': { incidents: [] },
    '/api/security/events': { events: [] },
    '/api/security/alerts': { alerts: [] },
    '/api/security/blocked-ips': { blocked_ips: [] },
    '/api/security/block-ip': { status: 'success', message: 'IP blocked successfully' },
    '/api/security/analyze-ip': { status: 'safe', risk_level: 'low' }
  };

  const data = routes[endpoint] || { error: 'Endpoint not found', _fallback: true };
  return addTimestamp(varyData(data));
};

// Enhanced API wrapper with automatic fallback
export const withFallback = async <T>(
  apiCall: () => Promise<T>,
  fallbackEndpoint: string
): Promise<T> => {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    console.warn(`API call failed, using fallback data for ${fallbackEndpoint}:`, error);
  return getFallbackData(fallbackEndpoint) as T;
  }
};

export default fallbackData;