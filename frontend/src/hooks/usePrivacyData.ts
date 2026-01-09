import { useState, useEffect, useCallback } from 'react';
import { PrivacyAPI } from '../services/api';

interface PrivacyMetrics {
  differential_privacy: {
    enabled: boolean;
    epsilon: number;
    delta: number;
    noise_level: string;
    privacy_budget_used: number;
    privacy_budget_remaining: number;
  };
  secure_aggregation: {
    enabled: boolean;
    encryption_type: string;
    key_size: number;
    aggregation_rounds: number;
    security_level: string;
  };
  homomorphic_encryption: {
    enabled: boolean;
    scheme: string;
    key_strength: string;
    computation_overhead: string;
    privacy_level: string;
  };
}

interface PrivacyBudget {
  total_budget: number;
  used_budget: number;
  remaining_budget: number;
  budget_per_round: number;
  current_round: number;
  estimated_rounds_remaining: number;
  recommendations: string[];
}

interface PrivacyAlgorithms {
  algorithms: Array<{
    name: string;
    type: string;
    status: string;
    description: string;
    parameters: Record<string, string>;
  }>;
}

interface PrivacyAnalysis {
  risk_level: string;
  vulnerabilities: string[];
  recommendations: string[];
  compliance_score: number;
  last_audit: string;
  risk_factors?: Record<string, string>;
  mitigation_status?: Record<string, string>;
}

export const usePrivacyData = () => {
  const [privacyMetrics, setPrivacyMetrics] = useState<PrivacyMetrics | null>(null);
  const [privacyBudget, setPrivacyBudget] = useState<PrivacyBudget | null>(null);
  const [privacyAlgorithms, setPrivacyAlgorithms] = useState<PrivacyAlgorithms | null>(null);
  const [privacyAnalysis, setPrivacyAnalysis] = useState<PrivacyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState(true);

  const normalizeMetrics = (data: any): PrivacyMetrics | null => {
    if (!data) return null;
    // Accept backend or fallback shape
    return {
      differential_privacy: {
        enabled: data.differential_privacy?.enabled ?? data.differential_privacy?.enabled ?? false,
        epsilon: data.differential_privacy?.epsilon ?? 1.0,
        delta: data.differential_privacy?.delta ?? 1e-5,
        noise_level: data.differential_privacy?.noise_level ?? 'Medium',
        privacy_budget_used: data.differential_privacy?.privacy_budget_used ?? 0,
        privacy_budget_remaining: data.differential_privacy?.privacy_budget_remaining ?? 1,
      },
      secure_aggregation: {
        enabled: data.secure_aggregation?.enabled ?? false,
        encryption_type: data.secure_aggregation?.encryption_type ?? 'XOR-based',
        key_size: data.secure_aggregation?.key_size ?? 256,
        aggregation_rounds: data.secure_aggregation?.aggregation_rounds ?? 8,
        security_level: data.secure_aggregation?.security_level ?? 'High',
      },
      homomorphic_encryption: {
        enabled: data.homomorphic_encryption?.enabled ?? false,
        scheme: data.homomorphic_encryption?.scheme ?? 'Paillier',
        key_strength: data.homomorphic_encryption?.key_strength ?? '2048-bit',
        computation_overhead: data.homomorphic_encryption?.computation_overhead ?? 'Medium',
        privacy_level: data.homomorphic_encryption?.privacy_level ?? 'Maximum',
      },
    };
  };

  const fetchAllData = useCallback(async () => {
    console.log('🔍 usePrivacyData: Starting data fetch...');
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 usePrivacyData: Making API calls...');
      const [metricsData, budgetData, algorithmsData, analysisData] = await Promise.allSettled([
        PrivacyAPI.getPrivacyStatus(),
        PrivacyAPI.getPrivacyBudget(),
        PrivacyAPI.getPrivacyAlgorithms(),
        PrivacyAPI.getPrivacyAnalysis()
      ]);

      console.log('🔍 usePrivacyData: API responses received:', {
        metricsData: metricsData.status,
        budgetData: budgetData.status,
        algorithmsData: algorithmsData.status,
        analysisData: analysisData.status
      });

      if (metricsData.status === 'fulfilled') {
        console.log('🔍 usePrivacyData: Processing metrics data:', metricsData.value);
        setPrivacyMetrics(normalizeMetrics(metricsData.value));
      } else {
        console.error('🔍 usePrivacyData: Metrics data failed:', metricsData.reason);
      }

      if (budgetData.status === 'fulfilled') {
        console.log('🔍 usePrivacyData: Processing budget data:', budgetData.value);
        setPrivacyBudget(budgetData.value);
      } else {
        console.error('🔍 usePrivacyData: Budget data failed:', budgetData.reason);
      }

      if (algorithmsData.status === 'fulfilled') {
        console.log('🔍 usePrivacyData: Processing algorithms data:', algorithmsData.value);
        setPrivacyAlgorithms(algorithmsData.value);
      } else {
        console.error('🔍 usePrivacyData: Algorithms data failed:', algorithmsData.reason);
      }

      if (analysisData.status === 'fulfilled') {
        console.log('🔍 usePrivacyData: Processing analysis data:', analysisData.value);
        setPrivacyAnalysis(analysisData.value);
      } else {
        console.error('🔍 usePrivacyData: Analysis data failed:', analysisData.reason);
      }

      // Check if any data has fallback flag
      const hasFallback = [metricsData, budgetData, algorithmsData, analysisData]
        .some(result => result.status === 'fulfilled' && result.value?._fallback);

      console.log('🔍 usePrivacyData: Fallback detected:', hasFallback);
      setBackendConnected(!hasFallback);
      console.log('🔍 usePrivacyData: Data fetch completed successfully');
    } catch (err) {
      console.error('🔍 usePrivacyData: Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch privacy data');
      setBackendConnected(false);
    } finally {
      console.log('🔍 usePrivacyData: Setting loading to false');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    
    // Refresh data every 30 seconds  
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchAllData]); // Add fetchAllData to dependencies

  const refetch = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    privacyMetrics,
    privacyBudget,
    privacyAlgorithms,
    privacyAnalysis,
    loading,
    error,
    backendConnected,
    refetch
  };
};