"""
API Versioning and Compatibility Management
Provides comprehensive API versioning, deprecation handling, and backward compatibility
"""

import re
import logging
from typing import Dict, List, Any, Optional, Callable, Union, Tuple
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, field
import functools
import inspect

from fastapi import Request, Response, HTTPException, Depends
from fastapi.routing import APIRouter
from fastapi.responses import JSONResponse

logger = logging.getLogger("api.versioning")

class VersioningStrategy(Enum):
    """API versioning strategies"""
    HEADER = "header"
    URL_PATH = "url_path"
    QUERY_PARAMETER = "query_parameter"
    MEDIA_TYPE = "media_type"

@dataclass
class APIVersion:
    """API version metadata"""
    version: str
    release_date: datetime
    status: str = "stable"  # stable, deprecated, beta, alpha
    deprecation_date: Optional[datetime] = None
    sunset_date: Optional[datetime] = None
    breaking_changes: List[str] = field(default_factory=list)
    new_features: List[str] = field(default_factory=list)
    migration_guide: Optional[str] = None
    
    def is_deprecated(self) -> bool:
        """Check if version is deprecated"""
        return self.status == "deprecated"
    
    def is_sunset(self) -> bool:
        """Check if version is past sunset date"""
        return self.sunset_date and datetime.utcnow() > self.sunset_date
    
    def days_until_sunset(self) -> Optional[int]:
        """Get days until version sunset"""
        if not self.sunset_date:
            return None
        
        delta = self.sunset_date - datetime.utcnow()
        return delta.days if delta.days > 0 else 0

@dataclass
class VersionedEndpoint:
    """Versioned API endpoint metadata"""
    path: str
    method: str
    version: str
    handler: Callable
    deprecated_in: Optional[str] = None
    removed_in: Optional[str] = None
    replaced_by: Optional[str] = None
    breaking_changes: List[str] = field(default_factory=list)

class VersionParser:
    """Parse and validate API versions"""
    
    VERSION_PATTERN = re.compile(r'^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([a-zA-Z0-9\-\.]+))?$')
    
    @classmethod
    def parse_version(cls, version_str: str) -> Tuple[int, int, int, Optional[str]]:
        """Parse version string into components"""
        if not version_str:
            raise ValueError("Version string cannot be empty")
        
        match = cls.VERSION_PATTERN.match(version_str.strip())
        if not match:
            raise ValueError(f"Invalid version format: {version_str}")
        
        major = int(match.group(1))
        minor = int(match.group(2) or 0)
        patch = int(match.group(3) or 0)
        prerelease = match.group(4)
        
        return major, minor, patch, prerelease
    
    @classmethod
    def normalize_version(cls, version_str: str) -> str:
        """Normalize version string"""
        major, minor, patch, prerelease = cls.parse_version(version_str)
        normalized = f"v{major}.{minor}.{patch}"
        
        if prerelease:
            normalized += f"-{prerelease}"
        
        return normalized
    
    @classmethod
    def compare_versions(cls, version1: str, version2: str) -> int:
        """Compare two versions (-1: v1 < v2, 0: v1 == v2, 1: v1 > v2)"""
        v1_parts = cls.parse_version(version1)
        v2_parts = cls.parse_version(version2)
        
        # Compare major, minor, patch
        for i in range(3):
            if v1_parts[i] < v2_parts[i]:
                return -1
            elif v1_parts[i] > v2_parts[i]:
                return 1
        
        # Compare prerelease
        v1_pre = v1_parts[3]
        v2_pre = v2_parts[3]
        
        if v1_pre is None and v2_pre is not None:
            return 1  # Release > prerelease
        elif v1_pre is not None and v2_pre is None:
            return -1  # Prerelease < release
        elif v1_pre is not None and v2_pre is not None:
            if v1_pre < v2_pre:
                return -1
            elif v1_pre > v2_pre:
                return 1
        
        return 0
    
    @classmethod
    def is_compatible(cls, requested_version: str, supported_versions: List[str]) -> bool:
        """Check if requested version is compatible with supported versions"""
        try:
            req_major, req_minor, _, _ = cls.parse_version(requested_version)
            
            for supported in supported_versions:
                sup_major, sup_minor, _, _ = cls.parse_version(supported)
                
                # Same major version and minor version >= requested
                if sup_major == req_major and sup_minor >= req_minor:
                    return True
            
            return False
        except ValueError:
            return False

class VersionExtractor:
    """Extract version information from requests"""
    
    def __init__(self, strategy: VersioningStrategy, config: Dict[str, Any]):
        self.strategy = strategy
        self.config = config
    
    def extract_version(self, request: Request) -> Optional[str]:
        """Extract version from request"""
        if self.strategy == VersioningStrategy.HEADER:
            return self._extract_from_header(request)
        elif self.strategy == VersioningStrategy.URL_PATH:
            return self._extract_from_path(request)
        elif self.strategy == VersioningStrategy.QUERY_PARAMETER:
            return self._extract_from_query(request)
        elif self.strategy == VersioningStrategy.MEDIA_TYPE:
            return self._extract_from_media_type(request)
        
        return None
    
    def _extract_from_header(self, request: Request) -> Optional[str]:
        """Extract version from header"""
        header_name = self.config.get("header_name", "API-Version")
        return request.headers.get(header_name)
    
    def _extract_from_path(self, request: Request) -> Optional[str]:
        """Extract version from URL path"""
        path = request.url.path
        pattern = self.config.get("path_pattern", r'/v(\d+(?:\.\d+)?)')
        
        match = re.search(pattern, path)
        return f"v{match.group(1)}" if match else None
    
    def _extract_from_query(self, request: Request) -> Optional[str]:
        """Extract version from query parameter"""
        param_name = self.config.get("query_param", "version")
        return request.query_params.get(param_name)
    
    def _extract_from_media_type(self, request: Request) -> Optional[str]:
        """Extract version from Accept header media type"""
        accept_header = request.headers.get("Accept", "")
        pattern = self.config.get("media_type_pattern", r'application/vnd\.agisfl\.v(\d+(?:\.\d+)?)\+json')
        
        match = re.search(pattern, accept_header)
        return f"v{match.group(1)}" if match else None

class VersionManager:
    """Manage API versions and compatibility"""
    
    def __init__(self, default_version: str = "v1.0.0"):
        self.versions: Dict[str, APIVersion] = {}
        self.endpoints: Dict[str, List[VersionedEndpoint]] = {}
        self.default_version = default_version
        self.extractor: Optional[VersionExtractor] = None
        
        # Compatibility matrix
        self.compatibility_matrix: Dict[str, List[str]] = {}
        
        # Migration handlers
        self.migration_handlers: Dict[Tuple[str, str], Callable] = {}
    
    def register_version(self, version: APIVersion):
        """Register a new API version"""
        normalized_version = VersionParser.normalize_version(version.version)
        version.version = normalized_version
        
        self.versions[normalized_version] = version
        logger.info(f"Registered API version: {normalized_version}")
    
    def register_endpoint(self, endpoint: VersionedEndpoint):
        """Register a versioned endpoint"""
        endpoint.version = VersionParser.normalize_version(endpoint.version)
        endpoint_key = f"{endpoint.method}:{endpoint.path}"
        
        if endpoint_key not in self.endpoints:
            self.endpoints[endpoint_key] = []
        
        self.endpoints[endpoint_key].append(endpoint)
        
        # Sort by version (newest first)
        self.endpoints[endpoint_key].sort(
            key=lambda ep: ep.version,
            reverse=True
        )
        
        logger.debug(f"Registered endpoint: {endpoint_key} v{endpoint.version}")
    
    def set_version_extractor(self, strategy: VersioningStrategy, config: Dict[str, Any]):
        """Set version extraction strategy"""
        self.extractor = VersionExtractor(strategy, config)
    
    def add_compatibility(self, version: str, compatible_versions: List[str]):
        """Add version compatibility mapping"""
        normalized_version = VersionParser.normalize_version(version)
        self.compatibility_matrix[normalized_version] = [
            VersionParser.normalize_version(v) for v in compatible_versions
        ]
    
    def add_migration_handler(
        self,
        from_version: str,
        to_version: str,
        handler: Callable[[Dict[str, Any]], Dict[str, Any]]
    ):
        """Add data migration handler between versions"""
        from_norm = VersionParser.normalize_version(from_version)
        to_norm = VersionParser.normalize_version(to_version)
        
        self.migration_handlers[(from_norm, to_norm)] = handler
        logger.info(f"Added migration handler: {from_norm} -> {to_norm}")
    
    def get_requested_version(self, request: Request) -> str:
        """Get requested version from request"""
        if not self.extractor:
            return self.default_version
        
        extracted_version = self.extractor.extract_version(request)
        
        if not extracted_version:
            return self.default_version
        
        try:
            return VersionParser.normalize_version(extracted_version)
        except ValueError:
            logger.warning(f"Invalid version format: {extracted_version}")
            return self.default_version
    
    def find_compatible_endpoint(
        self,
        method: str,
        path: str,
        requested_version: str
    ) -> Optional[VersionedEndpoint]:
        """Find compatible endpoint for requested version"""
        endpoint_key = f"{method}:{path}"
        
        if endpoint_key not in self.endpoints:
            return None
        
        endpoints = self.endpoints[endpoint_key]
        
        # First, try exact match
        for endpoint in endpoints:
            if endpoint.version == requested_version:
                return endpoint
        
        # Then, try compatible versions
        compatible_versions = self.compatibility_matrix.get(requested_version, [])
        
        for endpoint in endpoints:
            if endpoint.version in compatible_versions:
                return endpoint
        
        # Finally, find the best compatible version based on semantic versioning
        try:
            for endpoint in endpoints:
                if VersionParser.is_compatible(requested_version, [endpoint.version]):
                    return endpoint
        except ValueError:
            pass
        
        return None
    
    def migrate_data(
        self,
        data: Dict[str, Any],
        from_version: str,
        to_version: str
    ) -> Dict[str, Any]:
        """Migrate data between versions"""
        migration_key = (from_version, to_version)
        
        if migration_key in self.migration_handlers:
            try:
                return self.migration_handlers[migration_key](data)
            except Exception as e:
                logger.error(f"Migration failed {from_version} -> {to_version}: {e}")
        
        # Return original data if no migration handler
        return data
    
    def get_version_info(self, version: str = None) -> Dict[str, Any]:
        """Get version information"""
        if version:
            normalized = VersionParser.normalize_version(version)
            
            if normalized not in self.versions:
                raise HTTPException(404, f"Version {version} not found")
            
            version_obj = self.versions[normalized]
            
            return {
                "version": version_obj.version,
                "status": version_obj.status,
                "release_date": version_obj.release_date.isoformat(),
                "deprecation_date": version_obj.deprecation_date.isoformat() if version_obj.deprecation_date else None,
                "sunset_date": version_obj.sunset_date.isoformat() if version_obj.sunset_date else None,
                "days_until_sunset": version_obj.days_until_sunset(),
                "breaking_changes": version_obj.breaking_changes,
                "new_features": version_obj.new_features,
                "migration_guide": version_obj.migration_guide
            }
        
        # Return all versions
        versions_info = []
        
        for version_obj in sorted(self.versions.values(), key=lambda v: v.version, reverse=True):
            versions_info.append({
                "version": version_obj.version,
                "status": version_obj.status,
                "release_date": version_obj.release_date.isoformat(),
                "deprecation_date": version_obj.deprecation_date.isoformat() if version_obj.deprecation_date else None,
                "sunset_date": version_obj.sunset_date.isoformat() if version_obj.sunset_date else None,
                "days_until_sunset": version_obj.days_until_sunset()
            })
        
        return {
            "versions": versions_info,
            "default_version": self.default_version,
            "latest_version": versions_info[0]["version"] if versions_info else self.default_version
        }
    
    def check_deprecation_warnings(self, version: str) -> List[Dict[str, Any]]:
        """Check for deprecation warnings"""
        warnings = []
        
        if version not in self.versions:
            return warnings
        
        version_obj = self.versions[version]
        
        if version_obj.is_deprecated():
            warning = {
                "type": "deprecation",
                "message": f"API version {version} is deprecated",
                "deprecation_date": version_obj.deprecation_date.isoformat() if version_obj.deprecation_date else None
            }
            
            if version_obj.sunset_date:
                days_left = version_obj.days_until_sunset()
                warning["sunset_date"] = version_obj.sunset_date.isoformat()
                warning["days_until_sunset"] = days_left
                
                if days_left and days_left <= 30:
                    warning["severity"] = "high"
                    warning["message"] += f" and will be sunset in {days_left} days"
                else:
                    warning["severity"] = "medium"
            
            warnings.append(warning)
        
        return warnings

class VersionedRouter:
    """Router with automatic version handling"""
    
    def __init__(self, version_manager: VersionManager, base_path: str = ""):
        self.version_manager = version_manager
        self.base_path = base_path
        self.routers: Dict[str, APIRouter] = {}
    
    def get_router(self, version: str) -> APIRouter:
        """Get router for specific version"""
        normalized_version = VersionParser.normalize_version(version)
        
        if normalized_version not in self.routers:
            self.routers[normalized_version] = APIRouter(
                prefix=f"{self.base_path}/{normalized_version}" if self.base_path else f"/{normalized_version}",
                tags=[f"API {normalized_version}"]
            )
        
        return self.routers[normalized_version]
    
    def add_endpoint(
        self,
        version: str,
        path: str,
        methods: List[str],
        handler: Callable,
        **kwargs
    ):
        """Add versioned endpoint"""
        router = self.get_router(version)
        
        for method in methods:
            # Register endpoint with version manager
            endpoint = VersionedEndpoint(
                path=path,
                method=method.upper(),
                version=version,
                handler=handler
            )
            
            self.version_manager.register_endpoint(endpoint)
            
            # Add to router
            router.add_api_route(
                path,
                handler,
                methods=[method.upper()],
                **kwargs
            )
    
    def deprecate_endpoint(
        self,
        version: str,
        path: str,
        method: str,
        deprecated_in: str,
        removed_in: Optional[str] = None,
        replaced_by: Optional[str] = None
    ):
        """Mark endpoint as deprecated"""
        endpoint_key = f"{method.upper()}:{path}"
        
        if endpoint_key in self.version_manager.endpoints:
            for endpoint in self.version_manager.endpoints[endpoint_key]:
                if endpoint.version == VersionParser.normalize_version(version):
                    endpoint.deprecated_in = deprecated_in
                    endpoint.removed_in = removed_in
                    endpoint.replaced_by = replaced_by
                    break

# Middleware for version handling
class VersioningMiddleware:
    """Middleware to handle API versioning"""
    
    def __init__(self, version_manager: VersionManager):
        self.version_manager = version_manager
    
    async def __call__(self, request: Request, call_next: Callable) -> Response:
        """Process request with version handling"""
        # Extract requested version
        requested_version = self.version_manager.get_requested_version(request)
        
        # Add version to request state
        request.state.api_version = requested_version
        
        # Check if version exists
        if requested_version not in self.version_manager.versions:
            return JSONResponse(
                status_code=400,
                content={
                    "error": "unsupported_version",
                    "message": f"API version {requested_version} is not supported",
                    "supported_versions": list(self.version_manager.versions.keys())
                }
            )
        
        # Check if version is sunset
        version_obj = self.version_manager.versions[requested_version]
        if version_obj.is_sunset():
            return JSONResponse(
                status_code=410,
                content={
                    "error": "version_sunset",
                    "message": f"API version {requested_version} is no longer available",
                    "sunset_date": version_obj.sunset_date.isoformat()
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add version headers to response
        response.headers["API-Version"] = requested_version
        response.headers["API-Supported-Versions"] = ",".join(self.version_manager.versions.keys())
        
        # Add deprecation warnings
        warnings = self.version_manager.check_deprecation_warnings(requested_version)
        if warnings:
            response.headers["API-Deprecation-Warning"] = ";".join(
                f"{w['type']}:{w['message']}" for w in warnings
            )
        
        return response

# Decorators for version handling
def versioned_endpoint(
    version_manager: VersionManager,
    version: str,
    deprecated_in: Optional[str] = None,
    removed_in: Optional[str] = None
):
    """Decorator for versioned endpoints"""
    def decorator(func):
        # Add endpoint metadata
        if not hasattr(func, '_versioning_info'):
            func._versioning_info = {}
        
        func._versioning_info[version] = {
            "deprecated_in": deprecated_in,
            "removed_in": removed_in,
            "handler": func
        }
        
        @functools.wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            # Check version compatibility
            requested_version = getattr(request.state, 'api_version', version_manager.default_version)
            
            # Add deprecation warnings to response if needed
            warnings = version_manager.check_deprecation_warnings(requested_version)
            
            result = await func(request, *args, **kwargs)
            
            # Add warnings to response if it's a JSONResponse
            if isinstance(result, JSONResponse) and warnings:
                result.headers["API-Deprecation-Warning"] = ";".join(
                    f"{w['type']}:{w['message']}" for w in warnings
                )
            
            return result
        
        return wrapper
    
    return decorator

# Global version manager
global_version_manager = VersionManager()

# Utility functions
def setup_versioning(
    default_version: str = "v1.0.0",
    strategy: VersioningStrategy = VersioningStrategy.HEADER,
    config: Dict[str, Any] = None
):
    """Setup API versioning"""
    global global_version_manager
    
    global_version_manager = VersionManager(default_version)
    global_version_manager.set_version_extractor(strategy, config or {})
    
    logger.info(f"API versioning setup with strategy: {strategy.value}")

def register_api_version(
    version: str,
    status: str = "stable",
    release_date: Optional[datetime] = None,
    **kwargs
) -> APIVersion:
    """Register new API version"""
    api_version = APIVersion(
        version=version,
        status=status,
        release_date=release_date or datetime.utcnow(),
        **kwargs
    )
    
    global_version_manager.register_version(api_version)
    return api_version

# Export key classes and functions
__all__ = [
    'VersioningStrategy',
    'APIVersion',
    'VersionedEndpoint',
    'VersionParser',
    'VersionExtractor',
    'VersionManager',
    'VersionedRouter',
    'VersioningMiddleware',
    'global_version_manager',
    'setup_versioning',
    'register_api_version',
    'versioned_endpoint'
]

# Create a router for versioning endpoints
router = APIRouter(prefix="/api/versioning", tags=["API Versioning"])

@router.get("/versions")
async def get_api_versions():
    """Get all available API versions"""
    return {
        "versions": [
            {"version": "v1", "status": "stable", "deprecated": False},
            {"version": "v2", "status": "beta", "deprecated": False}
        ],
        "current": "v2",
        "supported": ["v1", "v2"]
    }

@router.get("/compatibility")
async def get_compatibility_info():
    """Get API compatibility information"""
    return {
        "backward_compatible": True,
        "migration_guide": "/docs/migration",
        "breaking_changes": []
    }
