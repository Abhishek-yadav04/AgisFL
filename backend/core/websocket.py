"""Enterprise WebSocket Manager with Advanced Features"""

import asyncio
import json
import time
import logging
import uuid
import hashlib
import hmac
from datetime import datetime, timezone, timedelta
from typing import Set, Dict, Any, Optional, List, Tuple, Callable
from collections import defaultdict, deque
from dataclasses import dataclass, asdict, field
from enum import Enum
import threading
import weakref
import zlib
import base64

import psutil
from fastapi import WebSocket, HTTPException
import structlog
import redis.asyncio as redis
from pydantic import BaseModel, Field, validator

logger = structlog.get_logger(__name__)

class WebSocketConfig:
    """Enterprise WebSocket Configuration"""
    # Connection Management
    max_connections = 10000
    max_connections_per_ip = 100
    max_connections_per_user = 50
    connection_timeout = 3600  # 1 hour
    heartbeat_interval = 30
    heartbeat_timeout = 90

    # Message Handling
    max_message_size = 10 * 1024 * 1024  # 10MB
    max_messages_per_minute = 1000
    max_burst_messages = 100
    message_queue_size = 1000
    compression_enabled = True
    compression_threshold = 1024  # Compress messages > 1KB

    # Security
    enable_authentication = True
    token_validation_enabled = True
    rate_limiting_enabled = True
    ip_whitelist_enabled = False
    ip_blacklist_enabled = True

    # Performance
    enable_redis_backing = True
    redis_channel_prefix = "ws:"
    broadcast_batch_size = 100
    cleanup_interval = 60
    metrics_interval = 10

    # Enterprise Features
    enable_message_persistence = True
    enable_audit_logging = True
    enable_geo_tracking = True
    enable_device_fingerprinting = True
    enable_load_balancing = True

config = WebSocketConfig()

class WebSocketEventType(Enum):
    """WebSocket Event Types"""
    CONNECTION_ESTABLISHED = "connection_established"
    CONNECTION_CLOSED = "connection_closed"
    HEARTBEAT = "heartbeat"
    HEARTBEAT_ACK = "heartbeat_ack"
    SYSTEM_UPDATE = "system_update"
    SECURITY_ALERT = "security_alert"
    FL_UPDATE = "fl_update"
    METRICS_UPDATE = "metrics_update"
    USER_MESSAGE = "user_message"
    BROADCAST = "broadcast"
    TOPIC_MESSAGE = "topic_message"
    ERROR = "error"
    RATE_LIMITED = "rate_limited"
    AUTH_REQUIRED = "auth_required"
    SUBSCRIPTION_CONFIRMED = "subscription_confirmed"
    UNSUBSCRIPTION_CONFIRMED = "unsubscription_confirmed"
    SYSTEM_DATA_RESPONSE = "system_data_response"

class ConnectionState(Enum):
    """WebSocket Connection States"""
    CONNECTING = "connecting"
    CONNECTED = "connected"
    AUTHENTICATING = "authenticating"
    AUTHENTICATED = "authenticated"
    SUBSCRIBING = "subscribing"
    ACTIVE = "active"
    DISCONNECTING = "disconnecting"
    DISCONNECTED = "disconnected"
    ERROR = "error"

@dataclass
class RateLimiter:
    """Advanced Rate Limiter with Burst Handling"""
    max_requests: int
    window_seconds: int
    burst_limit: int = None

    requests: deque = field(default_factory=lambda: deque(maxlen=1000))
    burst_tokens: int = field(default=0)
    last_burst_refill: float = field(default_factory=time.time)

    def __post_init__(self):
        if self.burst_limit is None:
            self.burst_limit = self.max_requests // 4

    def is_allowed(self) -> Tuple[bool, float]:
        """Check if request is allowed, return (allowed, retry_after)"""
        current_time = time.time()

        # Clean old requests
        while self.requests and current_time - self.requests[0] > self.window_seconds:
            self.requests.popleft()

        # Refill burst tokens
        time_since_refill = current_time - self.last_burst_refill
        if time_since_refill >= 1.0:  # Refill every second
            refill_amount = int(time_since_refill * (self.max_requests / self.window_seconds))
            self.burst_tokens = min(self.burst_limit, self.burst_tokens + refill_amount)
            self.last_burst_refill = current_time

        # Check rate limit
        if len(self.requests) >= self.max_requests:
            oldest_request = self.requests[0]
            retry_after = self.window_seconds - (current_time - oldest_request)
            return False, max(0, retry_after)

        # Check burst limit
        if self.burst_tokens <= 0:
            retry_after = 1.0 - (current_time - self.last_burst_refill)
            return False, max(0, retry_after)

        return True, 0.0

    def record_request(self):
        """Record a successful request"""
        current_time = time.time()
        self.requests.append(current_time)
        self.burst_tokens = max(0, self.burst_tokens - 1)

@dataclass
class WebSocketConnection:
    """Enterprise WebSocket Connection with Advanced Tracking"""
    websocket: WebSocket
    client_id: str
    connection_id: str
    state: ConnectionState = ConnectionState.CONNECTING

    # Authentication
    user_id: Optional[str] = None
    username: Optional[str] = None
    roles: List[str] = field(default_factory=list)
    permissions: List[str] = field(default_factory=list)
    is_authenticated: bool = False

    # Connection Info
    client_info: Dict[str, Any] = field(default_factory=dict)
    device_fingerprint: Optional[str] = None
    geo_info: Dict[str, Any] = field(default_factory=dict)

    # Timestamps
    connected_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_heartbeat: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    # Subscriptions & Messaging
    subscriptions: Set[str] = field(default_factory=set)
    message_count: int = 0
    bytes_sent: int = 0
    bytes_received: int = 0

    # Rate Limiting
    rate_limiter: RateLimiter = field(default_factory=lambda: RateLimiter(
        max_requests=config.max_messages_per_minute,
        window_seconds=60,
        burst_limit=config.max_burst_messages
    ))

    # Message Queue
    message_queue: asyncio.Queue = field(default_factory=lambda: asyncio.Queue(maxsize=config.message_queue_size))

    # Connection Health
    ping_count: int = 0
    pong_count: int = 0
    consecutive_misses: int = 0

    def __post_init__(self):
        if not self.connection_id:
            self.connection_id = str(uuid.uuid4())

    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.now(timezone.utc)

    def update_heartbeat(self):
        """Update heartbeat timestamp"""
        self.last_heartbeat = datetime.now(timezone.utc)
        self.consecutive_misses = 0

    def record_ping(self):
        """Record ping sent"""
        self.ping_count += 1

    def record_pong(self):
        """Record pong received"""
        self.pong_count += 1
        self.update_heartbeat()

    def is_healthy(self) -> bool:
        """Check if connection is healthy"""
        if self.state in [ConnectionState.DISCONNECTING, ConnectionState.DISCONNECTED, ConnectionState.ERROR]:
            return False

        time_since_heartbeat = (datetime.now(timezone.utc) - self.last_heartbeat).total_seconds()
        return time_since_heartbeat < config.heartbeat_timeout

    def get_connection_info(self) -> Dict[str, Any]:
        """Get comprehensive connection information"""
        return {
            "client_id": self.client_id,
            "connection_id": self.connection_id,
            "state": self.state.value,
            "user_id": self.user_id,
            "username": self.username,
            "is_authenticated": self.is_authenticated,
            "connected_at": self.connected_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "last_heartbeat": self.last_heartbeat.isoformat(),
            "subscriptions": list(self.subscriptions),
            "message_count": self.message_count,
            "bytes_sent": self.bytes_sent,
            "bytes_received": self.bytes_received,
            "ping_count": self.ping_count,
            "pong_count": self.pong_count,
            "client_info": self.client_info,
            "device_fingerprint": self.device_fingerprint,
            "geo_info": self.geo_info
        }

class MessagePriority(Enum):
    """Message Priority Levels"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class QueuedMessage:
    """Message in Queue with Priority"""
    message: Dict[str, Any]
    priority: MessagePriority = MessagePriority.NORMAL
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    ttl: Optional[int] = None  # Time to live in seconds
    retry_count: int = 0
    max_retries: int = 3

    def is_expired(self) -> bool:
        """Check if message is expired"""
        if self.ttl is None:
            return False
        return (datetime.now(timezone.utc) - self.timestamp).total_seconds() > self.ttl

    def should_retry(self) -> bool:
        """Check if message should be retried"""
        return self.retry_count < self.max_retries

class EnterpriseWebSocketManager:
    """Enterprise WebSocket Manager with Advanced Features"""

    def __init__(self):
        # Connection Management
        self.connections: Dict[str, WebSocketConnection] = {}
        self.connections_by_ip: Dict[str, Set[str]] = defaultdict(set)
        self.connections_by_user: Dict[str, Set[str]] = defaultdict(set)

        # Subscription Management
        self.subscriptions: Dict[str, Set[str]] = defaultdict(set)  # topic -> client_ids
        self.topic_stats: Dict[str, Dict[str, Any]] = defaultdict(dict)

        # Message Queues
        self.message_queues: Dict[str, asyncio.Queue] = {}
        self.broadcast_queue: asyncio.Queue = asyncio.Queue(maxsize=10000)

        # Redis for Clustering
        self.redis: Optional[redis.Redis] = None
        self.redis_connected: bool = False

        # Metrics and Monitoring
        self.metrics = {
            "total_connections": 0,
            "active_connections": 0,
            "total_messages_sent": 0,
            "total_messages_received": 0,
            "total_bytes_sent": 0,
            "total_bytes_received": 0,
            "connections_rejected": 0,
            "messages_dropped": 0,
            "errors": 0,
            "start_time": time.time()
        }

        # Security
        self.ip_blacklist: Set[str] = set()
        self.ip_whitelist: Set[str] = set()
        self.suspicious_ips: Dict[str, int] = defaultdict(int)

        # Background Tasks
        self.background_tasks: Set[asyncio.Task] = set()
        self.cleanup_task: Optional[asyncio.Task] = None
        self.heartbeat_task: Optional[asyncio.Task] = None
        self.metrics_task: Optional[asyncio.Task] = None
        self.redis_task: Optional[asyncio.Task] = None

        # Locks
        self.connection_lock = asyncio.Lock()
        self.subscription_lock = asyncio.Lock()

        # Compression
        self.compression_enabled = config.compression_enabled

    async def initialize(self):
        """Initialize the WebSocket manager"""
        logger.info("Initializing Enterprise WebSocket Manager")

        # Initialize Redis if enabled
        if config.enable_redis_backing:
            await self._init_redis()

        # Start background tasks
        await self._start_background_tasks()

        logger.info("Enterprise WebSocket Manager initialized successfully")

    async def _init_redis(self):
        """Initialize Redis connection for clustering"""
        try:
            self.redis = redis.Redis(
                host="localhost",
                port=6379,
                password="Rahul@10071890",
                db=0,
                decode_responses=True
            )
            await self.redis.ping()
            self.redis_connected = True
            logger.info("Redis connection established for WebSocket clustering")
        except Exception as e:
            logger.warning(f"Redis connection failed, running in standalone mode: {e}")
            self.redis_connected = False

    async def _start_background_tasks(self):
        """Start all background tasks"""
        # Cleanup task
        self.cleanup_task = asyncio.create_task(self._cleanup_task())
        self.background_tasks.add(self.cleanup_task)

        # Heartbeat task
        self.heartbeat_task = asyncio.create_task(self._heartbeat_task())
        self.background_tasks.add(self.heartbeat_task)

        # Metrics task
        self.metrics_task = asyncio.create_task(self._metrics_task())
        self.background_tasks.add(self.metrics_task)

        # Redis sync task
        if self.redis_connected:
            self.redis_task = asyncio.create_task(self._redis_sync_task())
            self.background_tasks.add(self.redis_task)

        # Message processing task
        message_task = asyncio.create_task(self._process_broadcast_queue())
        self.background_tasks.add(message_task)

    async def connect(
        self,
        websocket: WebSocket,
        client_id: str,
        user: Optional[Dict[str, Any]] = None,
        token: Optional[str] = None
    ) -> WebSocketConnection:
        """Connect a WebSocket client with enterprise features"""

        # Security checks
        client_ip = self._get_client_ip(websocket)
        if not await self._security_check(client_ip, user, token):
            await websocket.close(code=1008, reason="Connection rejected")
            raise HTTPException(status_code=403, detail="Connection rejected by security policy")

        # Connection limits check
        if not await self._connection_limits_check(client_ip, user):
            await websocket.close(code=1008, reason="Connection limit exceeded")
            raise HTTPException(status_code=429, detail="Connection limit exceeded")

        async with self.connection_lock:
            # Create connection
            connection = WebSocketConnection(
                websocket=websocket,
                client_id=client_id,
                connection_id="",
                user_id=user.get('user_id') if user else None,
                username=user.get('username') if user else None,
                roles=user.get('roles', []) if user else [],
                permissions=user.get('permissions', []) if user else [],
                is_authenticated=user is not None
            )

            # Set client info
            connection.client_info = await self._collect_client_info(websocket)
            connection.device_fingerprint = self._generate_device_fingerprint(connection.client_info)
            connection.geo_info = await self._get_geo_info(client_ip)

            # Accept WebSocket connection
            await websocket.accept()
            connection.state = ConnectionState.CONNECTED

            # Register connection
            self.connections[client_id] = connection
            self.connections_by_ip[client_ip].add(client_id)
            if connection.user_id:
                self.connections_by_user[connection.user_id].add(client_id)

            # Initialize message queue
            self.message_queues[client_id] = asyncio.Queue(maxsize=config.message_queue_size)

            # Update metrics
            self.metrics["total_connections"] += 1
            self.metrics["active_connections"] = len(self.connections)

            # Start message processing for this connection
            message_processor = asyncio.create_task(self._process_client_messages(client_id))
            self.background_tasks.add(message_processor)

            logger.info(
                "WebSocket connection established",
                client_id=client_id,
                user=connection.username,
                ip=client_ip,
                authenticated=connection.is_authenticated,
                total_connections=self.metrics["active_connections"]
            )

            # Send welcome message
            await self._send_to_client(client_id, {
                "type": WebSocketEventType.CONNECTION_ESTABLISHED.value,
                "client_id": client_id,
                "connection_id": connection.connection_id,
                "server_time": datetime.now(timezone.utc).isoformat(),
                "features": [
                    "heartbeat", "subscriptions", "real_time_data",
                    "compression", "authentication", "rate_limiting"
                ],
                "connection_info": {
                    "authenticated": connection.is_authenticated,
                    "user": connection.username,
                    "max_subscriptions": 100,
                    "compression_enabled": self.compression_enabled
                }
            })

            return connection

    async def disconnect(self, client_id: str, reason: str = "unknown") -> bool:
        """Disconnect a WebSocket client with cleanup"""
        async with self.connection_lock:
            if client_id not in self.connections:
                return False

            connection = self.connections[client_id]

            try:
                # Update state
                connection.state = ConnectionState.DISCONNECTING

                # Clean up subscriptions
                for topic in connection.subscriptions.copy():
                    await self.unsubscribe(client_id, [topic])

                # Close WebSocket
                try:
                    if hasattr(connection.websocket, 'client_state') and connection.websocket.client_state.value != 3:
                        await connection.websocket.close()
                except Exception:
                    pass

                # Clean up tracking
                client_ip = connection.client_info.get('ip', 'unknown')
                self.connections_by_ip[client_ip].discard(client_id)
                if connection.user_id:
                    self.connections_by_user[connection.user_id].discard(client_id)

                # Clean up message queue
                if client_id in self.message_queues:
                    del self.message_queues[client_id]

                # Remove connection
                del self.connections[client_id]

                # Update metrics
                self.metrics["active_connections"] = len(self.connections)

                connection.state = ConnectionState.DISCONNECTED

                logger.info(
                    "WebSocket connection closed",
                    client_id=client_id,
                    user=connection.username,
                    reason=reason,
                    duration_seconds=(datetime.now(timezone.utc) - connection.connected_at).total_seconds(),
                    messages_sent=connection.message_count,
                    bytes_sent=connection.bytes_sent,
                    remaining_connections=self.metrics["active_connections"]
                )

                return True

            except Exception as e:
                logger.error("Error during WebSocket disconnect", client_id=client_id, error=str(e))
                # Force cleanup
                self.connections.pop(client_id, None)
                self.metrics["errors"] += 1
                return False

    async def subscribe(self, client_id: str, topics: List[str], priority: MessagePriority = MessagePriority.NORMAL) -> bool:
        """Subscribe client to topics with priority"""
        if client_id not in self.connections:
            return False

        connection = self.connections[client_id]

        async with self.subscription_lock:
            for topic in topics:
                if topic not in connection.subscriptions:
                    connection.subscriptions.add(topic)
                    self.subscriptions[topic].add(client_id)

                    # Update topic stats
                    if topic not in self.topic_stats:
                        self.topic_stats[topic] = {
                            "subscriber_count": 0,
                            "message_count": 0,
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }
                    self.topic_stats[topic]["subscriber_count"] = len(self.subscriptions[topic])

        connection.update_activity()

        await self._send_to_client(client_id, {
            "type": WebSocketEventType.SUBSCRIPTION_CONFIRMED.value,
            "topics": topics,
            "total_subscriptions": len(connection.subscriptions),
            "priority": priority.value
        })

        logger.debug("Client subscribed to topics", client_id=client_id, topics=topics, priority=priority.value)
        return True

    async def unsubscribe(self, client_id: str, topics: List[str]) -> bool:
        """Unsubscribe client from topics"""
        if client_id not in self.connections:
            return False

        connection = self.connections[client_id]

        async with self.subscription_lock:
            for topic in topics:
                connection.subscriptions.discard(topic)
                self.subscriptions[topic].discard(client_id)
                if not self.subscriptions[topic]:
                    del self.subscriptions[topic]
                    self.topic_stats.pop(topic, None)

        connection.update_activity()

        await self._send_to_client(client_id, {
            "type": WebSocketEventType.UNSUBSCRIPTION_CONFIRMED.value,
            "topics": topics,
            "total_subscriptions": len(connection.subscriptions)
        })

        return True

    async def broadcast_to_topic(
        self,
        topic: str,
        message: Dict[str, Any],
        priority: MessagePriority = MessagePriority.NORMAL,
        persistent: bool = False
    ) -> int:
        """Broadcast message to all subscribers of a topic"""
        if topic not in self.subscriptions:
            return 0

        # Update topic stats
        if topic in self.topic_stats:
            self.topic_stats[topic]["message_count"] += 1

        sent_count = 0
        failed_clients = []

        # Create queued message
        queued_message = QueuedMessage(
            message={
                "type": WebSocketEventType.TOPIC_MESSAGE.value,
                "topic": topic,
                "data": message,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "priority": priority.value
            },
            priority=priority,
            ttl=300 if persistent else None  # 5 minutes TTL for persistent messages
        )

        for client_id in self.subscriptions[topic].copy():
            try:
                success = await self._queue_message_for_client(client_id, queued_message)
                if success:
                    sent_count += 1
            except Exception as e:
                logger.warning("Failed to queue message for subscriber", client_id=client_id, topic=topic, error=str(e))
                failed_clients.append(client_id)

        # Clean up failed clients
        for client_id in failed_clients:
            await self.disconnect(client_id, reason="message_queue_failure")

        # Redis broadcast for clustering
        if self.redis_connected and sent_count > 0:
            await self._redis_broadcast(topic, message, priority)

        return sent_count

    async def broadcast_to_all(
        self,
        message: Dict[str, Any],
        priority: MessagePriority = MessagePriority.NORMAL,
        filter_func: Optional[Callable[[WebSocketConnection], bool]] = None
    ) -> int:
        """Broadcast message to all connected clients with optional filtering"""
        if not self.connections:
            return 0

        sent_count = 0
        failed_clients = []

        # Create queued message
        queued_message = QueuedMessage(
            message={
                "type": WebSocketEventType.BROADCAST.value,
                "data": message,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "priority": priority.value
            },
            priority=priority
        )

        for client_id, connection in self.connections.items():
            # Apply filter if provided
            if filter_func and not filter_func(connection):
                continue

            try:
                success = await self._queue_message_for_client(client_id, queued_message)
                if success:
                    sent_count += 1
            except Exception as e:
                logger.warning("Failed to queue broadcast message", client_id=client_id, error=str(e))
                failed_clients.append(client_id)

        # Clean up failed clients
        for client_id in failed_clients:
            await self.disconnect(client_id, reason="broadcast_failure")

        return sent_count

    async def send_to_user(
        self,
        user_id: str,
        message: Dict[str, Any],
        priority: MessagePriority = MessagePriority.NORMAL
    ) -> int:
        """Send message to all connections of a specific user"""
        if user_id not in self.connections_by_user:
            return 0

        sent_count = 0
        queued_message = QueuedMessage(
            message={
                "type": WebSocketEventType.USER_MESSAGE.value,
                "data": message,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "priority": priority.value
            },
            priority=priority
        )

        for client_id in self.connections_by_user[user_id].copy():
            try:
                success = await self._queue_message_for_client(client_id, queued_message)
                if success:
                    sent_count += 1
            except Exception as e:
                logger.warning("Failed to send user message", user_id=user_id, client_id=client_id, error=str(e))

        return sent_count

    async def _queue_message_for_client(self, client_id: str, message: QueuedMessage) -> bool:
        """Queue message for specific client"""
        if client_id not in self.message_queues:
            return False

        try:
            await asyncio.wait_for(
                self.message_queues[client_id].put(message),
                timeout=1.0
            )
            return True
        except asyncio.TimeoutError:
            logger.warning("Message queue full for client", client_id=client_id)
            self.metrics["messages_dropped"] += 1
            return False

    async def _send_to_client(self, client_id: str, message: Dict[str, Any]) -> bool:
        """Send message to specific client with compression and error handling"""
        if client_id not in self.connections:
            return False

        connection = self.connections[client_id]

        # Rate limiting check
        allowed, retry_after = connection.rate_limiter.is_allowed()
        if not allowed:
            await self._send_to_client(client_id, {
                "type": WebSocketEventType.RATE_LIMITED.value,
                "retry_after": retry_after
            })
            return False

        # Compress message if enabled and large enough
        message_data = json.dumps(message)
        original_size = len(message_data.encode('utf-8'))

        if self.compression_enabled and original_size > config.compression_threshold:
            compressed_data = zlib.compress(message_data.encode('utf-8'))
            if len(compressed_data) < original_size:
                message_data = base64.b64encode(compressed_data).decode('utf-8')
                message = {"_compressed": True, "data": message_data}

        try:
            await connection.websocket.send_json(message)
            connection.rate_limiter.record_request()
            connection.message_count += 1
            connection.bytes_sent += len(message_data.encode('utf-8'))
            connection.update_activity()

            self.metrics["total_messages_sent"] += 1
            self.metrics["total_bytes_sent"] += len(message_data.encode('utf-8'))

            return True

        except Exception as e:
            logger.error("Failed to send WebSocket message", client_id=client_id, error=str(e))
            await self.disconnect(client_id, reason="send_error")
            self.metrics["errors"] += 1
            return False

    async def handle_client_message(self, client_id: str, message: Dict[str, Any]) -> bool:
        """Handle incoming message from client"""
        if client_id not in self.connections:
            return False

        connection = self.connections[client_id]
        connection.update_activity()
        self.metrics["total_messages_received"] += 1
        connection.bytes_received += len(json.dumps(message).encode('utf-8'))

        message_type = message.get("type")

        try:
            if message_type == "ping":
                connection.record_ping()
                await self._send_to_client(client_id, {
                    "type": "pong",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })

            elif message_type == "pong":
                connection.record_pong()

            elif message_type == "subscribe":
                topics = message.get("topics", [])
                priority = MessagePriority(message.get("priority", MessagePriority.NORMAL.value))
                await self.subscribe(client_id, topics, priority)

            elif message_type == "unsubscribe":
                topics = message.get("topics", [])
                await self.unsubscribe(client_id, topics)

            elif message_type == "heartbeat":
                await self._send_to_client(client_id, {
                    "type": WebSocketEventType.HEARTBEAT_ACK.value,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })

            elif message_type == "get_system_data":
                system_data = await self._get_system_data()
                await self._send_to_client(client_id, {
                    "type": "system_data_response",
                    "data": system_data
                })

            else:
                logger.warning("Unknown message type", client_id=client_id, type=message_type)
                await self._send_to_client(client_id, {
                    "type": WebSocketEventType.ERROR.value,
                    "message": f"Unknown message type: {message_type}"
                })

            return True

        except Exception as e:
            logger.error("Error handling client message", client_id=client_id, error=str(e))
            await self._send_to_client(client_id, {
                "type": WebSocketEventType.ERROR.value,
                "message": "Failed to process message"
            })
            return False

    async def _process_client_messages(self, client_id: str):
        """Process queued messages for a specific client"""
        if client_id not in self.message_queues:
            return

        queue = self.message_queues[client_id]

        while client_id in self.connections:
            try:
                # Wait for message with timeout
                message = await asyncio.wait_for(queue.get(), timeout=1.0)

                # Check if message is expired
                if message.is_expired():
                    continue

                # Send message
                success = await self._send_to_client(client_id, message.message)

                if not success and message.should_retry():
                    message.retry_count += 1
                    # Re-queue with backoff
                    await asyncio.sleep(min(2 ** message.retry_count, 30))
                    await queue.put(message)

                queue.task_done()

            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error("Error processing client message", client_id=client_id, error=str(e))
                break

    async def _process_broadcast_queue(self):
        """Process broadcast message queue"""
        while True:
            try:
                # Get batch of messages
                messages = []
                try:
                    for _ in range(config.broadcast_batch_size):
                        message = await asyncio.wait_for(self.broadcast_queue.get(), timeout=0.1)
                        messages.append(message)
                except asyncio.TimeoutError:
                    pass

                if not messages:
                    await asyncio.sleep(0.1)
                    continue

                # Process messages in batch
                for message in messages:
                    if message.is_expired():
                        continue

                    # Broadcast to all connections
                    await self.broadcast_to_all(message.message, message.priority)

                    self.broadcast_queue.task_done()

            except Exception as e:
                logger.error("Error processing broadcast queue", error=str(e))
                await asyncio.sleep(1)

    async def _security_check(self, client_ip: str, user: Optional[Dict[str, Any]], token: Optional[str]) -> bool:
        """Perform security checks before allowing connection"""
        # IP blacklist check
        if config.ip_blacklist_enabled and client_ip in self.ip_blacklist:
            logger.warning("Connection rejected: IP blacklisted", ip=client_ip)
            return False

        # IP whitelist check
        if config.ip_whitelist_enabled and client_ip not in self.ip_whitelist:
            logger.warning("Connection rejected: IP not whitelisted", ip=client_ip)
            return False

        # Suspicious IP check
        if self.suspicious_ips[client_ip] > 10:
            logger.warning("Connection rejected: Suspicious IP", ip=client_ip, attempts=self.suspicious_ips[client_ip])
            return False

        # Authentication check
        if config.enable_authentication and not user and not token:
            logger.warning("Connection rejected: Authentication required", ip=client_ip)
            return False

        return True

    async def _connection_limits_check(self, client_ip: str, user: Optional[Dict[str, Any]]) -> bool:
        """Check connection limits"""
        # Global connection limit
        if len(self.connections) >= config.max_connections:
            self.metrics["connections_rejected"] += 1
            return False

        # Per-IP limit
        if len(self.connections_by_ip[client_ip]) >= config.max_connections_per_ip:
            self.metrics["connections_rejected"] += 1
            return False

        # Per-user limit
        if user and user.get('user_id'):
            user_connections = len(self.connections_by_user[user['user_id']])
            if user_connections >= config.max_connections_per_user:
                self.metrics["connections_rejected"] += 1
                return False

        return True

    def _get_client_ip(self, websocket: WebSocket) -> str:
        """Extract client IP from WebSocket"""
        if websocket.client:
            return websocket.client.host
        return "unknown"

    async def _collect_client_info(self, websocket: WebSocket) -> Dict[str, Any]:
        """Collect comprehensive client information"""
        info = {
            "ip": self._get_client_ip(websocket),
            "user_agent": "",
            "headers": {}
        }

        # Extract headers if available
        if hasattr(websocket, 'headers'):
            info["user_agent"] = websocket.headers.get("user-agent", "")
            info["headers"] = dict(websocket.headers)

        return info

    def _generate_device_fingerprint(self, client_info: Dict[str, Any]) -> str:
        """Generate device fingerprint for tracking"""
        fingerprint_data = f"{client_info.get('ip', '')}:{client_info.get('user_agent', '')}"
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:16]

    async def _get_geo_info(self, ip: str) -> Dict[str, Any]:
        """Get geolocation information for IP"""
        # Placeholder - integrate with GeoIP service
        return {
            "country": "Unknown",
            "city": "Unknown",
            "latitude": 0.0,
            "longitude": 0.0
        }

    async def _get_system_data(self) -> Dict[str, Any]:
        """Get comprehensive system data"""
        try:
            # CPU and memory
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()

            # Disk
            try:
                disk = psutil.disk_usage('/')
            except:
                disk = psutil.disk_usage('C:\\')

            # Network
            network = psutil.net_io_counters()

            # Process information
            process_count = len(psutil.pids())

            return {
                "system": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_used_gb": round(memory.used / (1024**3), 2),
                    "memory_total_gb": round(memory.total / (1024**3), 2),
                    "disk_percent": disk.percent,
                    "disk_used_gb": round(disk.used / (1024**3), 2),
                    "disk_total_gb": round(disk.total / (1024**3), 2),
                    "network_bytes_sent": network.bytes_sent,
                    "network_bytes_recv": network.bytes_recv,
                    "process_count": process_count
                },
                "websocket": {
                    "active_connections": len(self.connections),
                    "total_subscriptions": sum(len(conn.subscriptions) for conn in self.connections.values()),
                    "messages_sent": self.metrics["total_messages_sent"],
                    "messages_received": self.metrics["total_messages_received"],
                    "bytes_sent": self.metrics["total_bytes_sent"],
                    "bytes_received": self.metrics["total_bytes_received"]
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            logger.error("Failed to collect system data", error=str(e))
            return {
                "error": "Failed to collect system data",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    async def _cleanup_task(self):
        """Background task to clean up inactive connections"""
        while True:
            try:
                await asyncio.sleep(config.cleanup_interval)

                inactive_clients = []
                suspicious_clients = []

                for client_id, connection in self.connections.items():
                    # Check for inactive connections
                    inactive_duration = (datetime.now(timezone.utc) - connection.last_activity).total_seconds()
                    if inactive_duration > config.connection_timeout:
                        inactive_clients.append(client_id)
                        continue

                    # Check for unhealthy connections
                    if not connection.is_healthy():
                        connection.consecutive_misses += 1
                        if connection.consecutive_misses >= 3:
                            suspicious_clients.append(client_id)
                    else:
                        connection.consecutive_misses = 0

                # Disconnect inactive clients
                for client_id in inactive_clients:
                    await self.disconnect(client_id, reason="timeout")

                # Disconnect suspicious clients
                for client_id in suspicious_clients:
                    await self.disconnect(client_id, reason="unhealthy")

                if inactive_clients or suspicious_clients:
                    logger.info("Cleaned up connections",
                              inactive=len(inactive_clients),
                              suspicious=len(suspicious_clients))

            except Exception as e:
                logger.error("Cleanup task error", error=str(e))
                await asyncio.sleep(config.cleanup_interval)

    async def _heartbeat_task(self):
        """Background task to send heartbeats and check connection health"""
        while True:
            try:
                await asyncio.sleep(config.heartbeat_interval)

                for client_id, connection in self.connections.items():
                    try:
                        # Send heartbeat
                        await self._send_to_client(client_id, {
                            "type": WebSocketEventType.HEARTBEAT.value,
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        })
                        connection.record_ping()

                    except Exception as e:
                        logger.debug("Heartbeat failed", client_id=client_id, error=str(e))
                        # Connection will be marked unhealthy and cleaned up by cleanup task

            except Exception as e:
                logger.error("Heartbeat task error", error=str(e))
                await asyncio.sleep(config.heartbeat_interval)

    async def _metrics_task(self):
        """Background task to collect and log metrics"""
        while True:
            try:
                await asyncio.sleep(config.metrics_interval)

                # Log current metrics
                logger.info("WebSocket metrics update", **self.metrics)

                # Update topic stats
                for topic, stats in self.topic_stats.items():
                    logger.debug("Topic stats", topic=topic, **stats)

            except Exception as e:
                logger.error("Metrics task error", error=str(e))
                await asyncio.sleep(config.metrics_interval)

    async def _redis_sync_task(self):
        """Background task to sync with Redis for clustering"""
        if not self.redis_connected:
            return

        while True:
            try:
                await asyncio.sleep(5)  # Sync every 5 seconds

                # Publish connection count
                await self.redis.set(
                    f"{config.redis_channel_prefix}connections",
                    len(self.connections)
                )

                # Listen for cluster messages
                # This would be expanded for full clustering support

            except Exception as e:
                logger.error("Redis sync task error", error=str(e))
                await asyncio.sleep(10)

    async def _redis_broadcast(self, topic: str, message: Dict[str, Any], priority: MessagePriority):
        """Broadcast message via Redis for clustering"""
        if not self.redis_connected:
            return

        try:
            cluster_message = {
                "topic": topic,
                "message": message,
                "priority": priority.value,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "websocket_manager"
            }

            await self.redis.publish(
                f"{config.redis_channel_prefix}broadcast",
                json.dumps(cluster_message)
            )

        except Exception as e:
            logger.error("Redis broadcast error", error=str(e))

    async def shutdown(self):
        """Shutdown the WebSocket manager gracefully"""
        logger.info("Shutting down Enterprise WebSocket Manager")

        # Cancel all background tasks
        for task in self.background_tasks:
            if not task.done():
                task.cancel()

        # Wait for tasks to complete
        await asyncio.gather(*self.background_tasks, return_exceptions=True)

        # Disconnect all clients
        disconnect_tasks = []
        for client_id in list(self.connections.keys()):
            disconnect_tasks.append(self.disconnect(client_id, reason="server_shutdown"))

        await asyncio.gather(*disconnect_tasks, return_exceptions=True)

        # Close Redis connection
        if self.redis_connected and self.redis:
            await self.redis.close()

        logger.info("Enterprise WebSocket Manager shutdown complete")

    def get_connection_stats(self) -> Dict[str, Any]:
        """Get comprehensive connection statistics"""
        authenticated_count = sum(1 for conn in self.connections.values() if conn.is_authenticated)
        total_subscriptions = sum(len(conn.subscriptions) for conn in self.connections.values())

        return {
            "active_connections": len(self.connections),
            "authenticated_connections": authenticated_count,
            "anonymous_connections": len(self.connections) - authenticated_count,
            "total_subscriptions": total_subscriptions,
            "unique_topics": len(self.subscriptions),
            "connections_by_ip": {ip: len(clients) for ip, clients in self.connections_by_ip.items()},
            "connections_by_user": {user: len(clients) for user, clients in self.connections_by_user.items()},
            "metrics": self.metrics.copy(),
            "topic_stats": dict(self.topic_stats),
            "uptime_seconds": int(time.time() - self.metrics["start_time"]),
            "redis_connected": self.redis_connected,
            "compression_enabled": self.compression_enabled
        }

# Create global instance
ws_manager = EnterpriseWebSocketManager()
