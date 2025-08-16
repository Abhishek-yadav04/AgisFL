import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Database, 
  Upload, 
  Download, 
  Trash2, 
  Eye,
  BarChart3,
  Settings,
  Plus,
  FileText,
  Shield,
  Brain
} from 'lucide-react';
import { MetricCard } from '../components/Cards/MetricCard';
import { DataTable } from '../components/Tables/DataTable';
import { datasetsAPI, militaryAPI } from '../services/api';
import toast from 'react-hot-toast';

const Datasets: React.FC = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<any>(null);

  // Datasets
  const { data: datasets, refetch: refetchDatasets } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => datasetsAPI.getDatasets(),
    refetchInterval: 30000,
  });

  // Dataset overview
  const { data: overview } = useQuery({
    queryKey: ['datasets-overview'],
    queryFn: () => datasetsAPI.getOverview(),
  });

  // Military datasets
  const { data: militaryDatasets } = useQuery({
    queryKey: ['military-datasets'],
    queryFn: () => militaryAPI.getDatasetsOverview(),
  });

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', uploadFile.name);
    formData.append('description', `Uploaded dataset: ${uploadFile.name}`);

    try {
      await datasetsAPI.uploadDataset(formData);
      toast.success('Dataset uploaded successfully');
      setShowUploadModal(false);
      setUploadFile(null);
      refetchDatasets();
    } catch (error) {
      toast.error('Failed to upload dataset');
    } finally {
      setUploading(false);
    }
  };

  const downloadDataset = async (datasetId: string) => {
    try {
      // Simulate download
      toast.success('Dataset download started');
    } catch (error) {
      toast.error('Failed to download dataset');
    }
  };

  const deleteDataset = async (datasetId: string) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return;

    try {
      await datasetsAPI.deleteDataset(datasetId);
      toast.success('Dataset deleted successfully');
      refetchDatasets();
    } catch (error) {
      toast.error('Failed to delete dataset');
    }
  };

  // Prepare datasets table
  const datasetsColumns = [
    { 
      key: 'name', 
      label: 'Dataset Name', 
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {row.description}
            </p>
          </div>
        </div>
      )
    },
    { 
      key: 'size_mb', 
      label: 'Size', 
      sortable: true,
      render: (value: number) => `${value.toFixed(1)} MB`
    },
    { 
      key: 'samples', 
      label: 'Samples', 
      sortable: true,
      render: (value: number) => value.toLocaleString()
    },
    { 
      key: 'features', 
      label: 'Features', 
      sortable: true
    },
    { 
      key: 'quality_score', 
      label: 'Quality', 
      sortable: true,
      render: (value: number) => (
        <span className={`font-semibold ${
          value >= 90 ? 'text-green-600 dark:text-green-400' :
          value >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
          'text-red-600 dark:text-red-400'
        }`}>
          {value}%
        </span>
      )
    },
    { 
      key: 'fl_suitability', 
      label: 'FL Suitability', 
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          {(value * 100).toFixed(1)}%
        </span>
      )
    },
    { 
      key: 'privacy_level', 
      label: 'Privacy', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value?.toLowerCase() === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
          value?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        }`}>
          {value?.toUpperCase() || 'UNKNOWN'}
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Data Management Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive dataset management for federated learning & security research
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-500 hover:to-blue-500 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Dataset</span>
          </button>
          
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </button>
        </div>
      </motion.div>

      {/* Dataset Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Datasets"
          value={datasets?.data?.length || overview?.data?.total_datasets || 0}
          subtitle="Available for training"
          icon={Database}
          color="blue"
        />
        
        <MetricCard
          title="Total Samples"
          value={(datasets?.data?.reduce((sum: number, ds: any) => sum + (ds.samples || 0), 0) || overview?.data?.total_samples || 0).toLocaleString()}
          subtitle="Training data points"
          icon={BarChart3}
          color="green"
        />
        
        <MetricCard
          title="Average Quality"
          value={`${overview?.data?.average_quality_score || 
            (datasets?.data?.length > 0 
              ? Math.round(datasets.data.reduce((sum: number, ds: any) => sum + (ds.quality_score || 0), 0) / datasets.data.length)
              : 0)}%`}
          subtitle="Data quality score"
          icon={Shield}
          color="purple"
        />
        
        <MetricCard
          title="Total Size"
          value={`${(overview?.data?.total_size_mb || 
            datasets?.data?.reduce((sum: number, ds: any) => sum + (ds.size_mb || 0), 0) || 0).toFixed(1)} MB`}
          subtitle="Storage usage"
          icon={FileText}
          color="orange"
        />
      </div>

      {/* Military Datasets Overview */}
      {militaryDatasets?.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Military-Grade Datasets</h3>
                <p className="text-indigo-100">
                  Enterprise security datasets for advanced FL training
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold">
                {Object.keys(militaryDatasets.data.datasets || {}).length}
              </p>
              <p className="text-sm text-indigo-100">Active Datasets</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(militaryDatasets.data.datasets || {}).slice(0, 4).map(([name, info]: [string, any]) => (
              <div key={name} className="bg-white/10 rounded-xl p-4 text-center">
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-xs text-indigo-100 mt-1">
                  {info.samples?.toLocaleString()} samples
                </p>
                <p className="text-xs text-indigo-100">
                  Accuracy: {(info.accuracy * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Datasets Table */}
      <DataTable
        title="Available Datasets"
        subtitle="Manage and analyze datasets for federated learning"
        data={datasets?.data || []}
        columns={datasetsColumns}
        searchable={true}
        filterable={true}
        exportable={true}
        refreshable={true}
        onRefresh={() => refetchDatasets()}
        onRowClick={setSelectedDataset}
        pageSize={10}
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowUploadModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Upload Dataset
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  accept=".csv,.json,.parquet,.xlsx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
                />
              </div>
              
              {uploadFile && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {uploadFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Size: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={handleFileUpload}
                  disabled={!uploadFile || uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Dataset Details Modal */}
      {selectedDataset && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedDataset(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Dataset Details: {selectedDataset.name}
              </h3>
              <button
                onClick={() => setSelectedDataset(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Description
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedDataset.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Size
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {selectedDataset.size_mb} MB
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Samples
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {selectedDataset.samples?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Features
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {selectedDataset.features}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Quality Score
                    </label>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {selectedDataset.quality_score}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    FL Suitability
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(selectedDataset.fl_suitability || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {((selectedDataset.fl_suitability || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Privacy Level
                  </label>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {selectedDataset.privacy_level}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Upload Date
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedDataset.upload_date || selectedDataset.last_updated).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedDataset.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {selectedDataset.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => downloadDataset(selectedDataset.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              
              <button
                onClick={() => deleteDataset(selectedDataset.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
              
              <button
                onClick={() => setSelectedDataset(null)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Datasets;