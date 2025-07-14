import { db } from "./db";
import { users, incidents, threats, aiInsights, attackPaths, systemMetrics } from "@shared/schema";

async function seedData() {
  console.log('Adding sample enterprise security data...');

  try {
    // Add sample users
    await db.insert(users).values([
      {
        username: 'admin',
        password: 'admin',
        email: 'admin@agiesfl.com',
        role: 'administrator'
      },
      {
        username: 'analyst',
        password: 'admin',
        email: 'analyst@agiesfl.com',
        role: 'analyst'
      }
    ]).onConflictDoNothing();

    // Add sample threats
    await db.insert(threats).values([
      {
        threatId: 'THR-001',
        name: 'Suspicious Network Activity',
        type: 'network_intrusion',
        severity: 'high',
        description: 'Unusual traffic patterns detected from external IP',
        sourceIp: '192.168.1.100',
        targetIp: '10.0.0.50',
        isActive: true,
        confidence: '0.95'
      },
      {
        threatId: 'THR-002',
        name: 'Malware Detection',
        type: 'malware',
        severity: 'critical',
        description: 'Trojan detected in user workstation',
        sourceIp: '10.0.0.25',
        targetIp: '10.0.0.1',
        isActive: true,
        confidence: '0.98'
      }
    ]).onConflictDoNothing();

    // Add sample incidents
    await db.insert(incidents).values([
      {
        incidentId: 'INC-001',
        title: 'Security Breach Investigation',
        description: 'Potential data exfiltration detected',
        severity: 'high',
        type: 'Data Breach',
        status: 'investigating',
        assigneeId: 1,
        riskScore: '8.5'
      },
      {
        incidentId: 'INC-002',
        title: 'Failed Login Attempts',
        description: 'Multiple failed authentication attempts from same IP',
        severity: 'medium',
        type: 'Authentication Failure',
        status: 'open',
        assigneeId: 2,
        riskScore: '6.2'
      }
    ]).onConflictDoNothing();

    // Add sample AI insights
    await db.insert(aiInsights).values([
      {
        type: 'threat_intelligence',
        title: 'Anomalous Network Pattern',
        description: 'ML model detected unusual communication patterns',
        severity: 'medium',
        confidence: '0.87',
        data: { pattern_type: 'lateral_movement', affected_nodes: 3 }
      },
      {
        type: 'prediction',
        title: 'Potential Attack Vector',
        description: 'System predicts high probability of attack on web servers',
        severity: 'high',
        confidence: '0.92',
        data: { target_systems: ['web-01', 'web-02'], probability: 0.92 }
      }
    ]).onConflictDoNothing();

    // Add sample attack paths
    await db.insert(attackPaths).values([
      {
        name: 'Lateral Movement Path',
        sourceNode: 'workstation-01',
        targetNode: 'server-db-01',
        pathData: { 
          steps: ['initial_access', 'privilege_escalation', 'lateral_movement'],
          techniques: ['T1078', 'T1068', 'T1021']
        },
        riskLevel: 'high',
        compromisedAssets: 3,
        attackVectors: 2
      }
    ]).onConflictDoNothing();

    console.log('✅ Sample data added successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }

    // Add sample incidents with realistic enterprise data
    const sampleIncidents = [
      {
        incidentId: 'INC-2025-001',
        title: 'Advanced Persistent Threat Detected',
        description: 'Suspicious lateral movement detected across multiple endpoints in the finance department. Network analysis shows unauthorized access patterns consistent with APT tactics.',
        severity: 'Critical',
        type: 'APT Activity',
        status: 'investigating',
        riskScore: '95.5',
        metadata: {
          affectedSystems: ['FIN-WS-001', 'FIN-WS-007', 'FIN-SRV-DC01'],
          attackVectors: ['Spear Phishing', 'Credential Dumping', 'Lateral Movement'],
          iocs: ['hash:a1b2c3d4', 'domain:evil.com', 'ip:185.220.101.42']
        }
      },
      {
        incidentId: 'INC-2025-002', 
        title: 'Ransomware Attempt Blocked',
        description: 'Endpoint protection successfully blocked ransomware encryption attempt. File integrity monitoring detected suspicious file modifications.',
        severity: 'High',
        type: 'Malware Detection',
        status: 'analyzing',
        riskScore: '87.2',
        metadata: {
          affectedSystems: ['HR-WS-012'],
          malwareFamily: 'BlackCat',
          encryptionAttempts: 247
        }
      },
      {
        incidentId: 'INC-2025-003',
        title: 'Data Exfiltration Attempt',
        description: 'Unusual network traffic patterns indicate potential data exfiltration from customer database server.',
        severity: 'High',
        type: 'Data Exfiltration',
        status: 'open',
        riskScore: '89.7'
      }
    ];

    for (const incident of sampleIncidents) {
      await db.insert(incidents).values(incident).onConflictDoNothing();
    }

    // Add FL-IDS specific incidents
    await db.insert(incidents).values([
    {
      incidentId: "INC-FL-2024-001",
      title: "FL-IDS Anomaly: Coordinated Attack Pattern",
      description: "Federated Learning model detected sophisticated distributed attack pattern across multiple network segments with 94.7% confidence.",
      severity: "critical",
      type: "FL-IDS Detection",
      status: "investigating",
      riskScore: 95,
      assignedTo: "alice.smith@company.com",
      metadata: {
        flDetectionRound: 12,
        participatingNodes: ["node_rf_001", "node_if_002", "node_nn_003"],
        anomalyScore: -0.847,
        detectionMethod: "Federated Learning Ensemble",
        privacyBudget: 1.0,
        byzantineNodesDetected: 0,
        sourceIps: ["192.168.1.100", "10.0.0.50", "172.16.0.25"],
        affectedSystems: ["web-server-01", "database-cluster", "api-gateway"],
        timeline: [
          { time: "2024-01-15T10:00:00Z", event: "FL model convergence achieved" },
          { time: "2024-01-15T10:02:00Z", event: "Anomaly detected across nodes" },
          { time: "2024-01-15T10:05:00Z", event: "Byzantine fault tolerance activated" },
          { time: "2024-01-15T10:15:00Z", event: "Escalated to SOC with 94.7% confidence" }
        ]
      }
    },
    {
      incidentId: "INC-2024-001",
      title: "Suspicious Network Activity Detected",
      description: "Multiple failed authentication attempts from external IP addresses indicating potential brute force attack.",
      severity: "high",
      type: "Authentication",
      status: "investigating",
      riskScore: 85,
      assignedTo: "alice.smith@company.com",
      metadata: {
        sourceIps: ["192.168.1.100", "10.0.0.50"],
        affectedSystems: ["web-server-01", "database-cluster"],
        timeline: [
          { time: "2024-01-15T10:00:00Z", event: "Initial detection" },
          { time: "2024-01-15T10:15:00Z", event: "Escalated to SOC" }
        ]
      }
    },
    

    // Add sample threats with realistic IOCs
    const sampleThreats = [
      {
        threatId: 'THR-87654321',
        name: 'Cobalt Strike Beacon Communication',
        type: 'C2 Communication',
        severity: 'Critical',
        description: 'Command and control beacon communication detected. HTTP requests to known C2 infrastructure.',
        sourceIp: '192.168.1.105',
        targetIp: '185.220.101.42',
        confidence: '94.7',
        isActive: true,
        metadata: {
          beaconInterval: '60s',
          protocol: 'HTTPS',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      {
        threatId: 'THR-87654322',
        name: 'Credential Harvesting Activity',
        type: 'Credential Access',
        severity: 'High', 
        description: 'Unauthorized access to Windows credential store. LSASS process manipulation detected.',
        sourceIp: '192.168.1.87',
        confidence: '89.3',
        isActive: true,
        metadata: {
          technique: 'T1003.001',
          tools: ['Mimikatz', 'ProcDump']
        }
      },
      {
        threatId: 'THR-87654323',
        name: 'Suspicious PowerShell Execution',
        type: 'Execution',
        severity: 'Medium',
        description: 'Obfuscated PowerShell script execution with base64 encoding detected.',
        sourceIp: '192.168.1.142',
        confidence: '76.8',
        isActive: true
      }
    ];

    for (const threat of sampleThreats) {
      await db.insert(threats).values(threat).onConflictDoNothing();
    }

    // Add AI insights with advanced threat intelligence
    const sampleInsights = [
      {
        type: 'threat_intelligence',
        title: 'APT29 TTPs Identified',
        description: 'Machine learning correlation engine identified tactics, techniques, and procedures consistent with APT29 (Cozy Bear) threat group. High confidence attribution based on infrastructure overlap and behavioral patterns.',
        severity: 'Critical',
        confidence: '91.2',
        data: {
          mitreTechniques: ['T1566.001', 'T1003.001', 'T1055'],
          confidence_factors: ['Infrastructure overlap', 'TTP similarity', 'Timeline correlation'],
          attribution_score: 0.912
        }
      },
      {
        type: 'correlation',
        title: 'Multi-Vector Coordinated Attack',
        description: 'Graph neural network analysis identified coordinated attack pattern across 7 endpoints. Attack kill chain shows clear progression from initial access to data exfiltration.',
        severity: 'High', 
        confidence: '87.4',
        data: {
          affected_endpoints: 7,
          attack_duration: '4.2 hours',
          kill_chain_completion: '85%'
        }
      },
      {
        type: 'prediction',
        title: 'Incident Volume Forecast',
        description: 'Predictive analytics indicate 23% increase in incident volume expected over next 72 hours based on threat landscape trends.',
        severity: 'Medium',
        confidence: '79.6',
        data: {
          predicted_incidents: 34,
          timeframe: '72 hours',
          confidence_interval: '±12%'
        }
      }
    ];

    for (const insight of sampleInsights) {
      await db.insert(aiInsights).values(insight).onConflictDoNothing();
    }

    // Add attack path data
    const sampleAttackPaths = [
      {
        name: 'Finance Department Compromise Path',
        sourceNode: 'External Email',
        targetNode: 'FIN-DC-01',
        pathData: {
          nodes: [
            { id: 'email', type: 'entry_point', compromised: true },
            { id: 'fin-ws-001', type: 'workstation', compromised: true },
            { id: 'fin-ws-007', type: 'workstation', compromised: true },
            { id: 'fin-dc-01', type: 'domain_controller', compromised: false }
          ],
          edges: [
            { from: 'email', to: 'fin-ws-001', method: 'spear_phishing' },
            { from: 'fin-ws-001', to: 'fin-ws-007', method: 'lateral_movement' },
            { from: 'fin-ws-007', to: 'fin-dc-01', method: 'privilege_escalation' }
          ]
        },
        riskLevel: 'Critical',
        compromisedAssets: 3,
        attackVectors: 4
      },
      {
        name: 'HR Database Access Chain',
        sourceNode: 'Phishing Email',
        targetNode: 'HR-DB-PROD',
        pathData: {
          nodes: [
            { id: 'phishing', type: 'entry_point', compromised: true },
            { id: 'hr-ws-012', type: 'workstation', compromised: true },
            { id: 'hr-db-prod', type: 'database', compromised: false }
          ]
        },
        riskLevel: 'High',
        compromisedAssets: 2,
        attackVectors: 2
      }
    ];

    for (const path of sampleAttackPaths) {
      await db.insert(attackPaths).values(path).onConflictDoNothing();
    }

    console.log('✅ Enterprise security sample data added successfully');
    console.log('📊 Added:', sampleIncidents.length, 'incidents');
    console.log('🛡️ Added:', sampleThreats.length, 'threats');
    console.log('🧠 Added:', sampleInsights.length, 'AI insights');
    console.log('🔗 Added:', sampleAttackPaths.length, 'attack paths');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run if called directly
seedData().then(() => {
  console.log('🎯 Database seeding completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Seeding failed:', error);
  process.exit(1);
});

export { seedData };