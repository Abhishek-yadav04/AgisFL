import { useState, useEffect, useCallback, useMemo } from 'react'
import React from 'react'
import {
  Database,
  Upload,
  Download,
  Eye,
  HardDrive,
  Search,
  Filter,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  RefreshCw,
  Plus,
  X,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiService } from '../services/apiService'
import {
  Dataset,
  DatasetStatistics,
  DatasetFilter,
  DatasetAnalysis,
  DatasetVisualization
} from '../types'

const Datasets = () => {
  // Utility function to format file sizes
  const formatFileSize = (sizeInMB: number): string => {
    if (sizeInMB <= 0) return 'Calculating...';
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB.toFixed(2)} MB`;
  };

  // State management
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [statistics, setStatistics] = useState<DatasetStatistics | null>(null)
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [datasetAnalysis, setDatasetAnalysis] = useState<DatasetAnalysis | null>(null)
  const [datasetVisualization, setDatasetVisualization] = useState<DatasetVisualization | null>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showVisualization, setShowVisualization] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<DatasetFilter>({
    search: '',
    data_type: '',
    sort_by: 'upload_date',
    sort_order: 'desc',
    page: 1,
    per_page: 20
  })

  // Load initial data
  const loadDatasets = useCallback(async () => {
    setLoading(true)
    try {
      const [datasetsRes, statsRes, recsRes] = await Promise.all([
        apiService.getDatasets(filters),
        apiService.getDatasetStatistics(),
        apiService.getDatasetRecommendations()
      ])

      if (datasetsRes && (datasetsRes.status === 'success' || datasetsRes.success === true)) {
        setDatasets(datasetsRes.datasets || [])
      }

      if (statsRes && (statsRes.status === 'success' || statsRes.success === true)) {
        setStatistics(statsRes.overview || statsRes.data)
      }

      if (recsRes && (recsRes.status === 'success' || recsRes.success === true)) {
        // Recommendations loaded but not displayed in current UI
        console.log('Recommendations loaded:', recsRes.recommendations)
      }
    } catch (error) {
      console.error('Failed to load datasets:', error)
      toast.error('Failed to load datasets')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadDatasets()
  }, [loadDatasets])

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name.replace(/\.[^/.]+$/, ""))
      formData.append('description', `Uploaded dataset: ${file.name}`)
      formData.append('data_type', file.name.split('.').pop()?.toLowerCase() || 'unknown')

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await apiService.uploadDataset(formData)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Handle different response formats
      if (response && typeof response === 'object') {
        if (response.status === 'success' || response.success === true) {
          toast.success('Dataset uploaded successfully!')
          loadDatasets() // Refresh the list
        } else {
          const errorMessage = response.message || response.error || 'Upload failed'
          throw new Error(String(errorMessage))
        }
      } else {
        // If response is not an object, assume success for now
        toast.success('Dataset uploaded successfully!')
        loadDatasets()
      }
    } catch (error) {
      console.error('Upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload dataset'
      toast.error(errorMessage)
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000) // Reset after showing 100%
    }
  }

  // Handle dataset analysis
  const handleDatasetAnalysis = async (datasetId: string) => {
    try {
      const response = await apiService.getDatasetAnalysis(datasetId)
      if (response && (response.status === 'success' || response.success === true) && response.analysis) {
        setDatasetAnalysis(response.analysis)
        setShowAnalysis(true)
      } else {
        throw new Error(String(response?.message || 'Failed to get analysis'))
      }
    } catch (error) {
      console.error('Failed to get analysis:', error)
      toast.error('Failed to load dataset analysis')
    }
  }

  // Handle dataset visualization
  const handleDatasetVisualization = async (datasetId: string) => {
    try {
      const response = await apiService.getDatasetVisualization(datasetId)
      if (response && (response.status === 'success' || response.success === true) && response.visualization) {
        setDatasetVisualization(response.visualization)
        setShowVisualization(true)
      } else {
        throw new Error(String(response?.message || 'Failed to get visualization'))
      }
    } catch (error) {
      console.error('Failed to get visualization:', error)
      toast.error('Failed to load dataset visualization')
    }
  }

  // Handle dataset download
  const handleDownload = async (datasetId: string, datasetName: string) => {
    try {
      const blob = await apiService.downloadDataset(datasetId)
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${datasetName}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        toast.success('Download started')
      } else {
        throw new Error('No data received for download')
      }
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download dataset')
    }
  }

  // Filter datasets based on search
  const filteredDatasets = useMemo(() => {
    return datasets.filter(dataset =>
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dataset.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dataset.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [datasets, searchQuery])

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      ready: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      processing: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      error: { color: 'bg-red-500/20 text-red-400', icon: AlertCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ready
    const Icon = config.icon

    return (
      <span className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        <span className="capitalize">{status}</span>
      </span>
    )
  }

  // Quality score component
  const QualityScore = ({ score }: { score?: number }) => {
    if (!score) return null

    const getColor = (score: number) => {
      if (score >= 0.8) return 'text-green-400'
      if (score >= 0.6) return 'text-yellow-400'
      return 'text-red-400'
    }

    return (
      <div className="flex items-center space-x-1">
        <Star className={`h-4 w-4 ${getColor(score)}`} />
        <span className={`text-sm font-medium ${getColor(score)}`}>
          {(score * 100).toFixed(0)}%
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Database size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Dataset Management 
            </h1>
            <p className="text-gray-400 mt-1">Advanced data management with AI-powered insights</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Filter className="h-5 w-5" />
          </button>

          <button
            onClick={loadDatasets}
            disabled={loading}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv,.json,.xlsx,.parquet"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              className="hidden"
            />
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg transition-colors">
              <Upload className="h-5 w-5" />
              <span>Upload Dataset</span>
            </div>
          </label>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-900/50 to-emerald-800/30 backdrop-blur-sm border border-green-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Datasets</p>
                <p className="text-2xl font-bold text-white">{statistics.total_datasets}</p>
              </div>
              <Database className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-800/30 backdrop-blur-sm border border-blue-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Size</p>
                <p className="text-2xl font-bold text-white">
                  {formatFileSize(statistics.total_size_mb)}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/50 to-pink-800/30 backdrop-blur-sm border border-purple-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Quality</p>
                <p className="text-2xl font-bold text-white">{(statistics.average_quality_score * 100).toFixed(0)}%</p>
              </div>
              <Star className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/50 to-orange-800/30 backdrop-blur-sm border border-yellow-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ready</p>
                <p className="text-2xl font-bold text-white">
                  {datasets.filter(d => d.status === 'ready').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search datasets, tags, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {showFilters && (
            <div className="flex items-center space-x-2">
              <select
                value={filters.data_type || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, data_type: e.target.value }))}
                className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Types</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="parquet">Parquet</option>
              </select>

              <select
                value={filters.sort_by || 'upload_date'}
                onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value }))}
                className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="upload_date">Upload Date</option>
                <option value="name">Name</option>
                <option value="size_mb">Size</option>
              </select>

              <button
                onClick={() => setFilters(prev => ({
                  ...prev,
                  sort_order: prev.sort_order === 'asc' ? 'desc' : 'asc'
                }))}
                className="p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:bg-gray-700/50"
              >
                {filters.sort_order === 'asc' ? <SortAsc className="h-5 w-5" /> : <SortDesc className="h-5 w-5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-6 bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Uploading dataset...</span>
            <span className="text-sm text-gray-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Dataset Grid/List */}
      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {filteredDatasets.map((dataset) => (
          <div
            key={dataset.id}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Database size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white truncate max-w-48">
                    {dataset.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{dataset.type.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <QualityScore score={dataset.quality_score} />
                <StatusBadge status={dataset.status} />
              </div>
            </div>

            {dataset.description && (
              <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                {dataset.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-400">Size:</span>
                <span className="text-white ml-2 font-medium">
                  {formatFileSize(dataset.size_mb)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Uploaded:</span>
                <span className="text-white ml-2 font-medium">
                  {new Date(dataset.upload_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            {dataset.tags && dataset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {dataset.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
                {dataset.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded-lg">
                    +{dataset.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDatasetAnalysis(dataset.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg flex items-center justify-center space-x-1 transition-colors text-sm"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analyze</span>
              </button>

              <button
                onClick={() => handleDatasetVisualization(dataset.id)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg flex items-center justify-center space-x-1 transition-colors text-sm"
              >
                <PieChart className="h-4 w-4" />
                <span>Visualize</span>
              </button>

              <button
                onClick={() => handleDownload(dataset.id, dataset.name)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg flex items-center justify-center space-x-1 transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>

              <button
                onClick={() => setSelectedDataset(dataset)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg flex items-center justify-center space-x-1 transition-colors text-sm"
              >
                <Eye className="h-4 w-4" />
                <span>Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading datasets...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDatasets.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No datasets found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery ? 'Try adjusting your search criteria' : 'Upload your first dataset to get started'}
          </p>
          {!searchQuery && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv,.json,.xlsx,.parquet"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                className="hidden"
              />
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl inline-flex items-center space-x-2 shadow-lg transition-colors">
                <Plus className="h-5 w-5" />
                <span>Upload Dataset</span>
              </div>
            </label>
          )}
        </div>
      )}

      {/* Dataset Details Modal */}
      {selectedDataset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{selectedDataset.name}</h2>
                <button
                  onClick={() => setSelectedDataset(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-400 text-sm">Status</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedDataset.status} />
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Size</span>
                  <p className="text-white font-medium">{formatFileSize(selectedDataset.size_mb)}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Quality Score</span>
                  <div className="mt-1">
                    <QualityScore score={selectedDataset.quality_score} />
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Version</span>
                  <p className="text-white font-medium">{selectedDataset.version}</p>
                </div>
              </div>

              {selectedDataset.description && (
                <div>
                  <span className="text-gray-400 text-sm">Description</span>
                  <p className="text-white mt-1">{selectedDataset.description}</p>
                </div>
              )}

              {selectedDataset.tags && selectedDataset.tags.length > 0 && (
                <div>
                  <span className="text-gray-400 text-sm">Tags</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDataset.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-700/50 text-gray-300 text-sm rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => handleDownload(selectedDataset.id, selectedDataset.name)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => handleDatasetAnalysis(selectedDataset.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analyze</span>
                </button>

                <button
                  onClick={() => handleDatasetVisualization(selectedDataset.id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <PieChart className="h-4 w-4" />
                  <span>Visualize</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysis && datasetAnalysis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Dataset Analysis</h2>
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Dataset Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rows:</span>
                      <span className="text-white font-medium">{datasetAnalysis.shape.rows.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Columns:</span>
                      <span className="text-white font-medium">{datasetAnalysis.shape.columns}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Missing Values:</span>
                      <span className="text-white font-medium">
                        {Object.values(datasetAnalysis.missing_values).reduce((a, b) => a + b, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Column Types</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(datasetAnalysis.dtypes).length > 0 ? (
                      Object.entries(datasetAnalysis.dtypes).map(([column, dtype]) => (
                        <div key={column} className="flex justify-between text-sm">
                          <span className="text-gray-300 truncate max-w-32">{column}:</span>
                          <span className="text-blue-400">{dtype}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <Database size={24} className="text-gray-600 mx-auto mb-2" />
                        <span className="text-gray-500 text-sm">No column data available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualization Modal */}
      {showVisualization && datasetVisualization && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Dataset Visualization</h2>
                <button
                  onClick={() => setShowVisualization(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {datasetVisualization.distributions && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Data Distributions</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {Object.entries(datasetVisualization.distributions).map(([column]) => (
                        <div key={column} className="bg-gray-700/50 rounded-lg p-3">
                          <span className="text-gray-300 text-sm font-medium">{column}</span>
                          <div className="mt-2 text-xs text-gray-400">
                            Distribution data available
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {datasetVisualization.correlations && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Correlation Matrix</h3>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div></div>
                        {datasetVisualization.correlations.columns?.map((col, idx) => (
                          <div key={idx} className="text-gray-300 font-medium truncate">
                            {col}
                          </div>
                        ))}
                        {datasetVisualization.correlations.matrix?.map((row, rowIdx) => (
                          <React.Fragment key={rowIdx}>
                            <div className="text-gray-300 font-medium">
                              {datasetVisualization.correlations?.columns?.[rowIdx]}
                            </div>
                            {row.map((val, colIdx) => (
                              <div
                                key={colIdx}
                                className={`text-center p-1 rounded ${
                                  val > 0.7 ? 'bg-red-500/20 text-red-400' :
                                  val > 0.3 ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}
                              >
                                {val.toFixed(2)}
                              </div>
                            ))}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!datasetVisualization.distributions && !datasetVisualization.correlations && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Database size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Visualization Data Unavailable</h3>
                  <p className="text-gray-500">
                    The dataset visualization data could not be generated at this time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Datasets