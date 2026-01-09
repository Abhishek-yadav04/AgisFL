#!/usr/bin/env python3
"""
AgisFL Redis Data Manager
Comprehensive Redis data storage and retrieval system for all application data
"""

import asyncio
import json
import logging
import time
from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timezone, timedelta
import redis
from dataclasses import dataclass, asdict
from enum import Enum

from config.enterprise_config import get_redis_config

logger = logging.getLogger(__name__)

class DataType(Enum):
    """Redis data types"""
    STRING = "string"
    HASH = "hash"
    LIST = "list"
    SET = "set"
    ZSET = "zset"
    STREAM = "stream"

class RedisDataManager:
    """Comprehensive Redis data manager for AgisFL application"""

    def __init__(self):
        self.config = get_redis_config()
        self.client = None
        self.pubsub = None
        self.initialized = False

    async def initialize(self):
        """Initialize Redis connection"""
        try:
            self.client = redis.Redis(
                host=self.config.host,
                port=self.config.port,
                db=self.config.db,
                password=self.config.password,
                socket_timeout=self.config.socket_timeout,
                socket_connect_timeout=self.config.socket_connect_timeout,
                decode_responses=True,
                retry_on_timeout=True,
                max_connections=20
            )

            # Test connection. Treat connection failures as non-fatal in dev/test.
            try:
                pong = self.client.ping()
                logger.info(f"Redis connected: {pong}")
            except Exception as e:
                # Non-fatal: application can continue without Redis (use in-memory fallbacks)
                logger.warning(f"Failed to connect to Redis (non-fatal): {e}")
                self.client = None
                self.initialized = False
                return

            # Initialize data structures
            await self._initialize_data_structures()

            self.initialized = True
            logger.info("Redis Data Manager initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Redis: {e}")
            # Don't raise here to avoid crashing startup; leave initialized False
            self.client = None
            self.initialized = False
            return

    async def _initialize_data_structures(self):
        """Initialize Redis data structures and schemas"""
        try:
            # Create indexes and schemas
            await self._create_user_schema()
            await self._create_session_schema()
            await self._create_fl_schema()
            await self._create_security_schema()
            await self._create_monitoring_schema()
            await self._create_cache_schema()
            await self._create_task_schema()

            logger.info("Redis data structures initialized")

        except Exception as e:
            logger.error(f"❌ Failed to initialize data structures: {e}")

    async def _create_user_schema(self):
        """Create user data schema"""
        # User sessions index
        self.client.sadd("schema:users:sessions", "active_sessions")
        self.client.sadd("schema:users:profiles", "user_profiles")
        self.client.sadd("schema:users:permissions", "user_permissions")
        self.client.sadd("schema:users:activity", "user_activity_log")

    async def _create_session_schema(self):
        """Create session data schema"""
        self.client.sadd("schema:sessions:active", "active_sessions")
        self.client.sadd("schema:sessions:expired", "expired_sessions")
        self.client.sadd("schema:sessions:blacklist", "blacklisted_sessions")

    async def _create_fl_schema(self):
        """Create federated learning data schema"""
        self.client.sadd("schema:fl:models", "global_models")
        self.client.sadd("schema:fl:clients", "client_registry")
        self.client.sadd("schema:fl:runs", "training_runs")
        self.client.sadd("schema:fl:metrics", "training_metrics")
        self.client.sadd("schema:fl:checkpoints", "model_checkpoints")

    async def _create_security_schema(self):
        """Create security data schema"""
        self.client.sadd("schema:security:events", "security_events")
        self.client.sadd("schema:security:threats", "detected_threats")
        self.client.sadd("schema:security:audit", "audit_log")
        self.client.sadd("schema:security:rate_limits", "rate_limit_data")

    async def _create_monitoring_schema(self):
        """Create monitoring data schema"""
        self.client.sadd("schema:monitoring:metrics", "system_metrics")
        self.client.sadd("schema:monitoring:logs", "application_logs")
        self.client.sadd("schema:monitoring:alerts", "system_alerts")
        self.client.sadd("schema:monitoring:performance", "performance_data")

    async def _create_cache_schema(self):
        """Create cache data schema"""
        self.client.sadd("schema:cache:api", "api_responses")
        self.client.sadd("schema:cache:models", "model_cache")
        self.client.sadd("schema:cache:datasets", "dataset_cache")
        self.client.sadd("schema:cache:config", "configuration_cache")

    async def _create_task_schema(self):
        """Create task management schema"""
        self.client.sadd("schema:tasks:queue", "task_queue")
        self.client.sadd("schema:tasks:processing", "processing_tasks")
        self.client.sadd("schema:tasks:completed", "completed_tasks")
        self.client.sadd("schema:tasks:failed", "failed_tasks")

    # ==========================================
    # USER MANAGEMENT
    # ==========================================

    async def store_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Store user profile data"""
        try:
            key = f"user:profile:{user_id}"
            profile_data['updated_at'] = datetime.now(timezone.utc).isoformat()
            self.client.hset(key, mapping=profile_data)
            self.client.expire(key, 86400 * 30)  # 30 days
            return True
        except Exception as e:
            logger.error(f"Failed to store user profile: {e}")
            return False

    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve user profile data"""
        try:
            key = f"user:profile:{user_id}"
            data = self.client.hgetall(key)
            return data if data else None
        except Exception as e:
            logger.error(f"Failed to get user profile: {e}")
            return None

    async def store_user_session(self, session_id: str, user_id: str, session_data: Dict[str, Any]) -> bool:
        """Store user session data"""
        try:
            key = f"session:{session_id}"
            session_data.update({
                'user_id': user_id,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'last_activity': datetime.now(timezone.utc).isoformat()
            })

            self.client.hset(key, mapping=session_data)
            self.client.expire(key, 3600)  # 1 hour

            # Add to active sessions set
            self.client.sadd("sessions:active", session_id)
            return True
        except Exception as e:
            logger.error(f"Failed to store user session: {e}")
            return False

    async def get_user_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve user session data"""
        try:
            key = f"session:{session_id}"
            data = self.client.hgetall(key)
            if data:
                # Update last activity
                self.client.hset(key, 'last_activity', datetime.now(timezone.utc).isoformat())
                return data
            return None
        except Exception as e:
            logger.error(f"Failed to get user session: {e}")
            return None

    async def invalidate_session(self, session_id: str) -> bool:
        """Invalidate user session"""
        try:
            key = f"session:{session_id}"
            self.client.delete(key)
            self.client.srem("sessions:active", session_id)
            return True
        except Exception as e:
            logger.error(f"Failed to invalidate session: {e}")
            return False

    # ==========================================
    # FEDERATED LEARNING DATA
    # ==========================================

    async def store_global_model(self, model_id: str, model_data: Dict[str, Any]) -> bool:
        """Store global model data"""
        try:
            key = f"fl:model:{model_id}"
            model_data.update({
                'stored_at': datetime.now(timezone.utc).isoformat(),
                'version': model_data.get('version', 1)
            })

            self.client.hset(key, mapping=model_data)
            self.client.sadd("fl:models", model_id)
            return True
        except Exception as e:
            logger.error(f"Failed to store global model: {e}")
            return False

    async def get_global_model(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve global model data"""
        try:
            key = f"fl:model:{model_id}"
            data = self.client.hgetall(key)
            return data if data else None
        except Exception as e:
            logger.error(f"Failed to get global model: {e}")
            return None

    async def store_training_metrics(self, run_id: str, round_num: int, metrics: Dict[str, Any]) -> bool:
        """Store training metrics for a round"""
        try:
            key = f"fl:metrics:{run_id}:{round_num}"
            metrics_data = {
                'run_id': run_id,
                'round': round_num,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'metrics': json.dumps(metrics)
            }

            self.client.hset(key, mapping=metrics_data)
            self.client.expire(key, 86400 * 7)  # 7 days

            # Add to metrics index
            self.client.zadd(f"fl:metrics:{run_id}", {str(round_num): round_num})
            return True
        except Exception as e:
            logger.error(f"Failed to store training metrics: {e}")
            return False

    async def get_training_metrics(self, run_id: str, round_num: Optional[int] = None) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """Get training metrics"""
        try:
            if round_num is not None:
                key = f"fl:metrics:{run_id}:{round_num}"
                data = self.client.hgetall(key)
                if data and 'metrics' in data:
                    data['metrics'] = json.loads(data['metrics'])
                return data if data else None
            else:
                # Get all rounds for this run
                rounds_key = f"fl:metrics:{run_id}"
                round_nums = self.client.zrange(rounds_key, 0, -1)
                metrics = []

                for round_num in round_nums:
                    key = f"fl:metrics:{run_id}:{round_num}"
                    data = self.client.hgetall(key)
                    if data and 'metrics' in data:
                        data['metrics'] = json.loads(data['metrics'])
                        metrics.append(data)

                return metrics
        except Exception as e:
            logger.error(f"Failed to get training metrics: {e}")
            return None

    async def register_fl_client(self, client_id: str, client_data: Dict[str, Any]) -> bool:
        """Register FL client"""
        try:
            key = f"fl:client:{client_id}"
            client_data.update({
                'registered_at': datetime.now(timezone.utc).isoformat(),
                'status': client_data.get('status', 'offline'),
                'last_seen': datetime.now(timezone.utc).isoformat()
            })

            self.client.hset(key, mapping=client_data)
            self.client.sadd("fl:clients", client_id)

            # Update client status
            status_key = f"fl:client:status:{client_data['status']}"
            self.client.sadd(status_key, client_id)

            return True
        except Exception as e:
            logger.error(f"Failed to register FL client: {e}")
            return False

    async def update_client_status(self, client_id: str, status: str) -> bool:
        """Update FL client status"""
        try:
            key = f"fl:client:{client_id}"

            # Remove from old status set
            old_status = self.client.hget(key, 'status')
            if old_status:
                old_status_key = f"fl:client:status:{old_status}"
                self.client.srem(old_status_key, client_id)

            # Update status
            self.client.hset(key, 'status', status)
            self.client.hset(key, 'last_seen', datetime.now(timezone.utc).isoformat())

            # Add to new status set
            new_status_key = f"fl:client:status:{status}"
            self.client.sadd(new_status_key, client_id)

            return True
        except Exception as e:
            logger.error(f"Failed to update client status: {e}")
            return False

    async def get_fl_clients(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get FL clients"""
        try:
            if status:
                status_key = f"fl:client:status:{status}"
                client_ids = self.client.smembers(status_key)
            else:
                client_ids = self.client.smembers("fl:clients")

            clients = []
            for client_id in client_ids:
                key = f"fl:client:{client_id}"
                data = self.client.hgetall(key)
                if data:
                    clients.append(data)

            return clients
        except Exception as e:
            logger.error(f"Failed to get FL clients: {e}")
            return []

    # ==========================================
    # CACHING SYSTEM
    # ==========================================

    async def cache_api_response(self, endpoint: str, response_data: Any, ttl: int = 300) -> bool:
        """Cache API response"""
        try:
            key = f"cache:api:{endpoint}"
            cache_data = {
                'data': json.dumps(response_data),
                'cached_at': datetime.now(timezone.utc).isoformat(),
                'ttl': ttl
            }

            self.client.hset(key, mapping=cache_data)
            self.client.expire(key, ttl)
            return True
        except Exception as e:
            logger.error(f"Failed to cache API response: {e}")
            return False

    async def get_cached_api_response(self, endpoint: str) -> Optional[Any]:
        """Get cached API response"""
        try:
            key = f"cache:api:{endpoint}"
            data = self.client.hgetall(key)

            if data and 'data' in data:
                return json.loads(data['data'])
            return None
        except Exception as e:
            logger.error(f"Failed to get cached API response: {e}")
            return None

    async def cache_model_data(self, model_id: str, model_data: Dict[str, Any], ttl: int = 1800) -> bool:
        """Cache model data"""
        try:
            key = f"cache:model:{model_id}"
            cache_data = {
                'data': json.dumps(model_data),
                'cached_at': datetime.now(timezone.utc).isoformat(),
                'ttl': ttl
            }

            self.client.hset(key, mapping=cache_data)
            self.client.expire(key, ttl)
            return True
        except Exception as e:
            logger.error(f"Failed to cache model data: {e}")
            return False

    async def get_cached_model_data(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get cached model data"""
        try:
            key = f"cache:model:{model_id}"
            data = self.client.hgetall(key)

            if data and 'data' in data:
                return json.loads(data['data'])
            return None
        except Exception as e:
            logger.error(f"Failed to get cached model data: {e}")
            return None

    # ==========================================
    # SECURITY & MONITORING
    # ==========================================

    async def log_security_event(self, event_type: str, event_data: Dict[str, Any]) -> bool:
        """Log security event"""
        try:
            event_id = f"sec_{int(time.time() * 1000)}"
            key = f"security:event:{event_id}"

            event_data.update({
                'event_id': event_id,
                'event_type': event_type,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'severity': event_data.get('severity', 'medium')
            })

            self.client.hset(key, mapping=event_data)
            self.client.expire(key, 86400 * 30)  # 30 days

            # Add to event index
            self.client.zadd("security:events", {event_id: time.time()})
            self.client.sadd(f"security:events:{event_type}", event_id)

            return True
        except Exception as e:
            logger.error(f"Failed to log security event: {e}")
            return False

    async def get_security_events(self, event_type: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get security events"""
        try:
            if event_type:
                event_ids = self.client.smembers(f"security:events:{event_type}")
            else:
                event_ids = self.client.zrange("security:events", 0, limit - 1, desc=True)

            events = []
            for event_id in event_ids[:limit]:
                key = f"security:event:{event_id}"
                data = self.client.hgetall(key)
                if data:
                    events.append(data)

            return events
        except Exception as e:
            logger.error(f"Failed to get security events: {e}")
            return []

    async def store_system_metrics(self, metrics: Dict[str, Any]) -> bool:
        """Store system metrics"""
        try:
            timestamp = int(time.time())
            key = f"metrics:system:{timestamp}"

            metrics_data = {
                'timestamp': datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat(),
                'metrics': json.dumps(metrics)
            }

            self.client.hset(key, mapping=metrics_data)
            self.client.expire(key, 86400 * 7)  # 7 days

            # Add to metrics timeline
            self.client.zadd("metrics:timeline", {str(timestamp): timestamp})

            return True
        except Exception as e:
            logger.error(f"Failed to store system metrics: {e}")
            return False

    async def get_system_metrics(self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Get system metrics"""
        try:
            if start_time and end_time:
                start_ts = int(start_time.timestamp())
                end_ts = int(end_time.timestamp())
                timestamps = self.client.zrangebyscore("metrics:timeline", start_ts, end_ts)
            else:
                timestamps = self.client.zrange("metrics:timeline", 0, -1)

            metrics = []
            for ts in timestamps:
                key = f"metrics:system:{ts}"
                data = self.client.hgetall(key)
                if data and 'metrics' in data:
                    data['metrics'] = json.loads(data['metrics'])
                    metrics.append(data)

            return metrics
        except Exception as e:
            logger.error(f"Failed to get system metrics: {e}")
            return []

    # ==========================================
    # TASK MANAGEMENT
    # ==========================================

    async def queue_task(self, task_type: str, task_data: Dict[str, Any], priority: int = 0) -> Optional[str]:
        """Queue a task for processing"""
        try:
            task_id = f"task_{int(time.time() * 1000)}_{task_type}"

            task_info = {
                'task_id': task_id,
                'task_type': task_type,
                'data': json.dumps(task_data),
                'priority': priority,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'status': 'queued'
            }

            # Store task data
            key = f"task:data:{task_id}"
            self.client.hset(key, mapping=task_info)

            # Add to appropriate queue
            queue_key = f"queue:{task_type}"
            self.client.zadd(queue_key, {task_id: priority})

            # Add to general task queue
            self.client.zadd("queue:tasks", {task_id: priority})

            return task_id
        except Exception as e:
            logger.error(f"Failed to queue task: {e}")
            return None

    async def get_next_task(self, task_type: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get next task from queue"""
        try:
            if task_type:
                queue_key = f"queue:{task_type}"
            else:
                queue_key = "queue:tasks"

            # Get highest priority task (lowest score)
            task_ids = self.client.zrange(queue_key, 0, 0)
            if not task_ids:
                return None

            task_id = task_ids[0]
            key = f"task:data:{task_id}"

            # Get task data
            task_data = self.client.hgetall(key)
            if not task_data:
                # Clean up orphaned task
                self.client.zrem(queue_key, task_id)
                return None

            # Mark as processing
            self.client.hset(key, 'status', 'processing')
            self.client.hset(key, 'started_at', datetime.now(timezone.utc).isoformat())

            # Remove from queue
            self.client.zrem(queue_key, task_id)

            # Parse task data
            if 'data' in task_data:
                task_data['data'] = json.loads(task_data['data'])

            return task_data
        except Exception as e:
            logger.error(f"Failed to get next task: {e}")
            return None

    async def complete_task(self, task_id: str, result: Optional[Dict[str, Any]] = None) -> bool:
        """Mark task as completed"""
        try:
            key = f"task:data:{task_id}"

            update_data = {
                'status': 'completed',
                'completed_at': datetime.now(timezone.utc).isoformat()
            }

            if result:
                update_data['result'] = json.dumps(result)

            self.client.hset(key, mapping=update_data)
            self.client.expire(key, 86400 * 7)  # Keep completed tasks for 7 days

            return True
        except Exception as e:
            logger.error(f"Failed to complete task: {e}")
            return False

    # ==========================================
    # RATE LIMITING
    # ==========================================

    async def check_rate_limit(self, identifier: str, limit: int, window: int) -> tuple[bool, int]:
        """Check rate limit for an identifier"""
        try:
            key = f"ratelimit:{identifier}"
            current_time = int(time.time())

            # Remove old entries outside the window
            self.client.zremrangebyscore(key, 0, current_time - window)

            # Count current requests in window
            request_count = self.client.zcard(key)

            if request_count >= limit:
                # Get time until next request is allowed
                oldest_request = self.client.zrange(key, 0, 0, withscores=True)
                if oldest_request:
                    reset_time = int(oldest_request[0][1]) + window
                    remaining = max(0, reset_time - current_time)
                else:
                    remaining = window
                return False, remaining

            # Add current request
            self.client.zadd(key, {str(current_time): current_time})
            self.client.expire(key, window)

            return True, 0
        except Exception as e:
            logger.error(f"Failed to check rate limit: {e}")
            return True, 0  # Allow on error

    # ==========================================
    # UTILITY METHODS
    # ==========================================

    async def get_stats(self) -> Dict[str, Any]:
        """Get Redis usage statistics"""
        try:
            info = self.client.info()
            return {
                'redis_version': info.get('redis_version', 'Unknown'),
                'uptime_seconds': info.get('uptime_in_seconds', 0),
                'connected_clients': info.get('connected_clients', 0),
                'used_memory_human': info.get('used_memory_human', 'Unknown'),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'databases': len([k for k in info.keys() if k.startswith('db')]),
                'data_manager_initialized': self.initialized
            }
        except Exception as e:
            logger.error(f"Failed to get Redis stats: {e}")
            return {'error': str(e)}

    async def cleanup_expired_data(self) -> Dict[str, int]:
        """Clean up expired data"""
        try:
            cleaned = {
                'expired_sessions': 0,
                'expired_cache': 0,
                'old_metrics': 0,
                'completed_tasks': 0
            }

            # This is handled automatically by Redis TTL, but we can add manual cleanup if needed
            return cleaned
        except Exception as e:
            logger.error(f"Failed to cleanup expired data: {e}")
            return {'error': str(e)}

    async def backup_data(self, backup_key: str) -> bool:
        """Create a backup of critical data"""
        try:
            # This would typically involve dumping data to a file or external storage
            # For now, we'll just mark the backup time
            backup_info = {
                'backup_key': backup_key,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'status': 'completed'
            }

            self.client.hset(f"backup:{backup_key}", mapping=backup_info)
            return True
        except Exception as e:
            logger.error(f"Failed to backup data: {e}")
            return False

    async def shutdown(self):
        """Shutdown Redis connection"""
        try:
            if self.client:
                self.client.close()
            self.initialized = False
            logger.info("Redis Data Manager shutdown complete")
        except Exception as e:
            logger.error(f"Error during Redis shutdown: {e}")

# Global Redis data manager instance
redis_data_manager = RedisDataManager()

async def get_redis_data_manager() -> RedisDataManager:
    """Get the global Redis data manager instance"""
    if not redis_data_manager.initialized:
        await redis_data_manager.initialize()
    return redis_data_manager
