// Enhanced Dataset Types
export interface Dataset {
  id: string;
  name: string;
  description?: string;
  size_mb: number;
  file_path: string;
  upload_date: string;
  status: 'processing' | 'ready' | 'error';
  owner: string;
  privacy_level: 'public' | 'private' | 'internal';
  type: string;
  tags: string[];
  version: string;
  processing_status: string;
  quality_score?: number;
  analysis?: DatasetAnalysis;
  visualization?: DatasetVisualization;
  last_modified?: string;
}

export interface DatasetAnalysis {
  shape: {
    rows: number;
    columns: number;
  };
  columns: string[];
  dtypes: Record<string, string>;
  missing_values: Record<string, number>;
  missing_percentage: Record<string, number>;
  numeric_stats?: Record<string, any>;
  categorical_stats?: Record<string, any>;
  correlations?: Record<string, any>;
  outliers?: Record<string, number>;
}

export interface DatasetVisualization {
  distributions?: Record<string, any>;
  correlations?: {
    columns: string[];
    matrix: number[][];
  };
  time_series?: Record<string, any>;
  categorical_plots?: Record<string, any>;
}

export interface DatasetQualityMetrics {
  overall_score: number;
  analysis: DatasetAnalysis;
  last_updated: string;
}

export interface DatasetRecommendation {
  dataset_id: string;
  name: string;
  reason: string;
  score: number;
}

export interface DatasetStatistics {
  total_datasets: number;
  total_size_mb: number;
  average_quality_score: number;
  type_distribution: Record<string, number>;
  recent_uploads: Dataset[];
}

export interface DatasetFilter {
  search?: string;
  data_type?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface DatasetUploadRequest {
  name: string;
  description?: string;
  data_type?: string;
  tags?: string;
  privacy_level?: string;
}

export interface DatasetTransformation {
  type: 'normalize' | 'scale' | 'encode' | 'filter';
  parameters?: Record<string, any>;
}

export interface BatchOperation {
  type: 'delete' | 'tag' | 'move';
  dataset_ids: string[];
  parameters?: Record<string, any>;
}

// API Response Types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  status: 'success';
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
  filters?: Record<string, any>;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface DatasetState {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  statistics: DatasetStatistics | null;
  recommendations: DatasetRecommendation[];
  filters: DatasetFilter;
  loading: LoadingState;
  uploadProgress: number;
}