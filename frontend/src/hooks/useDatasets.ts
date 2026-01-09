import { useState, useEffect, useCallback } from 'react'
import { apiService } from '../services/apiService'
import {
  Dataset,
  DatasetStatistics,
  DatasetRecommendation,
  DatasetFilter,
  // DatasetAnalysis, // Removed unused import
  // DatasetVisualization // Removed unused import
} from '../types'

export const useDatasets = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [statistics, setStatistics] = useState<DatasetStatistics | null>(null)
  const [recommendations, setRecommendations] = useState<DatasetRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DatasetFilter>({
    search: '',
    data_type: '',
    sort_by: 'upload_date',
    sort_order: 'desc',
    page: 1,
    per_page: 20
  })

  const loadDatasets = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [datasetsRes, statsRes, recsRes] = await Promise.all([
        apiService.getDatasets(filters),
        apiService.getDatasetStatistics(),
        apiService.getDatasetRecommendations()
      ])

      if (datasetsRes.status === 'success') {
        setDatasets(datasetsRes.datasets || [])
      }

      if (statsRes.status === 'success') {
        setStatistics(statsRes.overview)
      }

      if (recsRes.status === 'success') {
        setRecommendations(recsRes.recommendations || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load datasets')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const uploadDataset = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name.replace(/\.[^/.]+$/, ""))
    formData.append('description', `Uploaded dataset: ${file.name}`)
    formData.append('data_type', file.name.split('.').pop()?.toLowerCase() || 'unknown')

    try {
      const response = await apiService.uploadDataset(formData)
      if (response.status === 'success') {
        loadDatasets() // Refresh the list
        return response
      } else {
        throw new Error(response.message || 'Upload failed')
      }
    } catch (err) {
      throw err
    }
  }, [loadDatasets])

  const getDatasetAnalysis = useCallback(async (datasetId: string) => {
    try {
      const response = await apiService.getDatasetAnalysis(datasetId)
      if (response.status === 'success') {
        return response.analysis
      }
      throw new Error('Failed to get analysis')
    } catch (err) {
      throw err
    }
  }, [])

  const getDatasetVisualization = useCallback(async (datasetId: string) => {
    try {
      const response = await apiService.getDatasetVisualization(datasetId)
      if (response.status === 'success') {
        return response.visualization
      }
      throw new Error('Failed to get visualization')
    } catch (err) {
      throw err
    }
  }, [])

  const downloadDataset = useCallback(async (datasetId: string, datasetName: string) => {
    try {
      const blob = await apiService.downloadDataset(datasetId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${datasetName}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      throw err
    }
  }, [])

  const deleteDataset = useCallback(async (datasetId: string) => {
    try {
      await apiService.deleteDataset(datasetId)
      loadDatasets() // Refresh the list
    } catch (err) {
      throw err
    }
  }, [loadDatasets])

  useEffect(() => {
    loadDatasets()
  }, [loadDatasets])

  return {
    datasets,
    statistics,
    recommendations,
    loading,
    error,
    filters,
    setFilters,
    loadDatasets,
    uploadDataset,
    getDatasetAnalysis,
    getDatasetVisualization,
    downloadDataset,
    deleteDataset
  }
}
