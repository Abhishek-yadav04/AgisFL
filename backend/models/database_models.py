"""
Database Models for AgisFL
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import String as SQLite_UUID
try:
    from backend.config.database_config import Base, db_manager
except Exception:
    # Fallback for running module directly from backend directory
    try:
        from config.database_config import Base, db_manager
    except Exception:
        from ..config.database_config import Base, db_manager

# Use PostgreSQL UUID if available, otherwise String for SQLite
def get_uuid_column():
    if db_manager.is_postgresql:
        return Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    else:
        return Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}
    id = get_uuid_column()
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime(timezone=True), nullable=True)

class FLExperiment(Base):
    __tablename__ = "fl_experiments"
    __table_args__ = {'extend_existing': True}
    id = get_uuid_column()
    name = Column(String(255), nullable=False)
    description = Column(Text)
    algorithm = Column(String(100), nullable=False)
    status = Column(String(50), default="created")
    rounds_completed = Column(Integer, default=0)
    total_rounds = Column(Integer, default=10)
    current_accuracy = Column(String(50), default="0.0")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(String(255), default="system")
    hyperparameters = Column(JSON, default=dict)
    results = Column(JSON, default=dict)

class FLClient(Base):
    __tablename__ = "fl_clients"
    __table_args__ = {'extend_existing': True}
    id = get_uuid_column()
    client_id = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="offline")
    location = Column(String(255))
    last_seen = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    performance_metrics = Column(JSON, default=dict)

class Dataset(Base):
    __tablename__ = "datasets"
    __table_args__ = {'extend_existing': True}
    id = get_uuid_column()
    name = Column(String(255), nullable=False)
    description = Column(Text)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    owner = Column(String(255), default="system")
    schema_info = Column(JSON, default=dict)

class SecurityEvent(Base):
    __tablename__ = "security_events"
    __table_args__ = {'extend_existing': True}
    id = get_uuid_column()
    event_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)
    source = Column(String(255), nullable=False)
    ip_address = Column(String(45))
    details = Column(JSON, default=dict)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))