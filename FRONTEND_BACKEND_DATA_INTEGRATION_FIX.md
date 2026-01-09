# Frontend-Backend Data Integration Audit & Fix Plan

## Issues Identified

### 1. FL Activity Status Showing 0 in Dashboard
- **Problem**: Frontend expecting different field names than backend provides
- **Backend returns**: `training_active`, `current_round`, `metrics.accuracy`
- **Frontend expects**: `is_training`, `active_clients`, `global_accuracy`

### 2. API Response Mapping Issues
- FL status endpoint returns minimal data
- Missing real-time client count
- Accuracy field not properly mapped
- System metrics using fallback values

### 3. WebSocket Real-Time Updates Not Working
- Frontend connects but receives no FL updates
- Missing broadcast mechanism for training progress
- No live client status updates

### 4. Data Fetching Intervals Too Aggressive
- Frontend polling every 2 seconds causing cache thrashing
- Multiple concurrent API calls for same data
- No debouncing or intelligent caching

## Fix Implementation Plan

### Phase 1: API Response Standardization
1. Fix FL status endpoint response format
2. Add proper client count tracking
3. Ensure all metrics use real engine data
4. Add missing fields for dashboard

### Phase 2: Real-Time Data Integration
1. Enable WebSocket broadcasting for FL events
2. Add live training progress updates
3. Implement client status change notifications
4. Add system metric streaming

### Phase 3: Frontend Data Mapping
1. Update service layer to handle correct field names
2. Add fallback values for offline scenarios
3. Implement intelligent caching strategy
4. Add error boundaries for data failures

### Phase 4: Performance Optimization
1. Reduce polling frequency for stable data
2. Implement WebSocket for real-time updates
3. Add data debouncing and deduplication
4. Cache frequently accessed metrics

## Files to Modify
- backend/api/federated_learning.py
- backend/api/metrics.py
- frontend/src/services/realTimeApi.ts
- frontend/src/hooks/useFLMetrics.ts
- frontend/src/hooks/useSystemMetrics.ts
- frontend/src/pages/Dashboard.tsx