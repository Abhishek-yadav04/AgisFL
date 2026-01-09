#!/usr/bin/env python3
"""
Enterprise API Discovery & Contract Generation Tool

This script implements automated Abstract Syntax Tree (AST) parsing to discover
all API endpoints in the codebase and generate machine-readable contracts.

Author: Lead Engineering Team
Version: 1.0
Date: September 21, 2025
"""

import ast
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, asdict
from enum import Enum
import yaml
import argparse
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EndpointStatus(Enum):
    """Endpoint implementation status"""
    IMPLEMENTED = "implemented"
    MOCK = "mock"
    STUB = "stub"
    NOT_REGISTERED = "not_registered"
    UNKNOWN = "unknown"

class HTTPMethod(Enum):
    """HTTP methods"""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"
    OPTIONS = "OPTIONS"
    HEAD = "HEAD"

@dataclass
class Parameter:
    """API parameter definition"""
    name: str
    type: str
    required: bool = True
    description: str = ""
    default: Any = None
    location: str = "query"  # query, path, body, header

@dataclass
class Response:
    """API response definition"""
    status_code: int
    description: str
    schema: Dict[str, Any] = None
    headers: Dict[str, str] = None

@dataclass
class Endpoint:
    """API endpoint definition"""
    path: str
    method: HTTPMethod
    function_name: str
    file_path: str
    line_number: int
    parameters: List[Parameter]
    responses: List[Response]
    tags: List[str]
    summary: str = ""
    description: str = ""
    status: EndpointStatus = EndpointStatus.UNKNOWN
    security: List[str] = None
    dependencies: List[str] = None

class APIDiscoveryEngine:
    """Main engine for discovering and analyzing API endpoints"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.api_directory = self.project_root / "backend" / "api"
        self.main_file = self.project_root / "backend" / "main.py"
        self.endpoints: List[Endpoint] = []
        self.registered_routers: Set[str] = set()
        
    def discover_endpoints(self) -> List[Endpoint]:
        """Main discovery method"""
        logger.info(f"Starting API discovery in {self.project_root}")
        
        # First, discover registered routers
        self._discover_registered_routers()
        
        # Then scan all API files
        if self.api_directory.exists():
            self._scan_api_directory()
        else:
            logger.warning(f"API directory not found: {self.api_directory}")
        
        # Analyze endpoint status
        self._analyze_endpoint_status()
        
        logger.info(f"Discovered {len(self.endpoints)} endpoints")
        return self.endpoints
    
    def _discover_registered_routers(self):
        """Discover which routers are registered in main.py"""
        if not self.main_file.exists():
            logger.warning(f"Main file not found: {self.main_file}")
            return
        
        try:
            with open(self.main_file, 'r', encoding='utf-8') as f:
                content = f.read()
                tree = ast.parse(content)
                
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    # Look for app.include_router calls
                    if (hasattr(node.func, 'attr') and 
                        node.func.attr == 'include_router'):
                        
                        if node.args:
                            # Extract router name from first argument
                            if isinstance(node.args[0], ast.Name):
                                router_name = node.args[0].id
                                self.registered_routers.add(router_name)
                            elif isinstance(node.args[0], ast.Attribute):
                                router_name = node.args[0].attr
                                self.registered_routers.add(router_name)
                        
        except Exception as e:
            logger.error(f"Error parsing main.py: {e}")
    
    def _scan_api_directory(self):
        """Scan all Python files in the API directory"""
        for file_path in self.api_directory.rglob("*.py"):
            if file_path.name.startswith("__"):
                continue
                
            try:
                self._parse_api_file(file_path)
            except Exception as e:
                logger.error(f"Error parsing {file_path}: {e}")
    
    def _parse_api_file(self, file_path: Path):
        """Parse a single API file for endpoints"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                tree = ast.parse(content)
        except Exception as e:
            logger.error(f"Failed to parse {file_path}: {e}")
            return
        
        # Look for FastAPI router definitions
        router_name = None
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if (isinstance(target, ast.Name) and 
                        target.id == "router" and
                        isinstance(node.value, ast.Call)):
                        router_name = "router"
                        break
        
        # Look for route decorators
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                endpoint = self._extract_endpoint_from_function(
                    node, file_path, router_name
                )
                if endpoint:
                    self.endpoints.append(endpoint)
    
    def _extract_endpoint_from_function(self, func_node: ast.FunctionDef, 
                                      file_path: Path, router_name: str) -> Optional[Endpoint]:
        """Extract endpoint information from a function node"""
        
        # Look for route decorators
        route_info = self._extract_route_decorator(func_node)
        if not route_info:
            return None
        
        path, method = route_info
        
        # Extract parameters
        parameters = self._extract_parameters(func_node)
        
        # Extract docstring for description
        docstring = ast.get_docstring(func_node) or ""
        
        # Determine tags from file path
        tags = self._determine_tags(file_path)
        
        endpoint = Endpoint(
            path=path,
            method=method,
            function_name=func_node.name,
            file_path=str(file_path.relative_to(self.project_root)),
            line_number=func_node.lineno,
            parameters=parameters,
            responses=[],  # Will be populated later
            tags=tags,
            description=docstring,
            summary=docstring.split('\n')[0] if docstring else func_node.name
        )
        
        return endpoint
    
    def _extract_route_decorator(self, func_node: ast.FunctionDef) -> Optional[tuple]:
        """Extract route path and method from decorators"""
        for decorator in func_node.decorator_list:
            if isinstance(decorator, ast.Call):
                # Handle @router.get("/path") style
                if (hasattr(decorator.func, 'attr') and 
                    decorator.func.attr in ['get', 'post', 'put', 'delete', 'patch']):
                    
                    method = HTTPMethod(decorator.func.attr.upper())
                    
                    # Extract path from first argument
                    if decorator.args and isinstance(decorator.args[0], ast.Str):
                        path = decorator.args[0].s
                        return path, method
                    elif decorator.args and isinstance(decorator.args[0], ast.Constant):
                        path = decorator.args[0].value
                        return path, method
        
        return None
    
    def _extract_parameters(self, func_node: ast.FunctionDef) -> List[Parameter]:
        """Extract parameters from function signature"""
        parameters = []
        
        for arg in func_node.args.args:
            if arg.arg in ['self', 'cls']:
                continue
                
            param = Parameter(
                name=arg.arg,
                type=self._extract_type_annotation(arg.annotation) if arg.annotation else "Any",
                required=True,  # Will be refined based on defaults
                location="query"  # Default, will be refined
            )
            parameters.append(param)
        
        return parameters
    
    def _extract_type_annotation(self, annotation) -> str:
        """Extract type from annotation node"""
        if isinstance(annotation, ast.Name):
            return annotation.id
        elif isinstance(annotation, ast.Constant):
            return str(annotation.value)
        elif isinstance(annotation, ast.Attribute):
            return annotation.attr
        else:
            return "Any"
    
    def _determine_tags(self, file_path: Path) -> List[str]:
        """Determine API tags based on file path"""
        relative_path = file_path.relative_to(self.api_directory)
        parts = relative_path.parts[:-1]  # Exclude filename
        
        if not parts:
            return [file_path.stem.replace('_', ' ').title()]
        
        return [part.replace('_', ' ').title() for part in parts]
    
    def _analyze_endpoint_status(self):
        """Analyze implementation status of each endpoint"""
        for endpoint in self.endpoints:
            endpoint.status = self._determine_endpoint_status(endpoint)
    
    def _determine_endpoint_status(self, endpoint: Endpoint) -> EndpointStatus:
        """Determine the implementation status of an endpoint"""
        
        # Check if the router is registered
        router_file = Path(endpoint.file_path)
        router_module = router_file.stem
        
        if router_module not in self.registered_routers and "router" not in self.registered_routers:
            return EndpointStatus.NOT_REGISTERED
        
        # Try to detect mock responses by reading the function
        try:
            file_path = self.project_root / endpoint.file_path
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Look for mock indicators
            if any(indicator in content.lower() for indicator in 
                   ['mock', 'stub', 'placeholder', 'not implemented', 'todo']):
                return EndpointStatus.MOCK
            
            # Look for real implementation indicators
            if any(indicator in content.lower() for indicator in 
                   ['database', 'db.', 'session', 'query', 'crud']):
                return EndpointStatus.IMPLEMENTED
            
            return EndpointStatus.STUB
            
        except Exception:
            return EndpointStatus.UNKNOWN
    
    def generate_endpoints_json(self, output_path: str):
        """Generate machine-readable endpoints.json"""
        endpoints_data = {
            "metadata": {
                "generated_at": "2025-09-21T00:00:00Z",
                "project_root": str(self.project_root),
                "total_endpoints": len(self.endpoints),
                "discovery_engine_version": "1.0"
            },
            "endpoints": [asdict(endpoint) for endpoint in self.endpoints],
            "statistics": self._generate_statistics()
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(endpoints_data, f, indent=2, default=str)
        
        logger.info(f"Generated endpoints.json: {output_path}")
    
    def generate_openapi_spec(self, output_path: str):
        """Generate preliminary OpenAPI specification"""
        spec = {
            "openapi": "3.0.3",
            "info": {
                "title": "AgisFL Enterprise API",
                "description": "Enterprise-grade Federated Learning Platform API",
                "version": "1.0.0",
                "contact": {
                    "name": "AgisFL Engineering Team",
                    "email": "engineering@agisfl.com"
                }
            },
            "servers": [
                {
                    "url": "http://localhost:8000",
                    "description": "Development server"
                },
                {
                    "url": "https://api.agisfl.com",
                    "description": "Production server"
                }
            ],
            "paths": {},
            "components": {
                "securitySchemes": {
                    "bearerAuth": {
                        "type": "http",
                        "scheme": "bearer",
                        "bearerFormat": "JWT"
                    }
                },
                "schemas": {}
            },
            "tags": []
        }
        
        # Generate paths
        for endpoint in self.endpoints:
            path_key = endpoint.path
            if path_key not in spec["paths"]:
                spec["paths"][path_key] = {}
            
            method_key = endpoint.method.value.lower()
            spec["paths"][path_key][method_key] = {
                "summary": endpoint.summary,
                "description": endpoint.description,
                "tags": endpoint.tags,
                "parameters": self._generate_openapi_parameters(endpoint.parameters),
                "responses": self._generate_openapi_responses(endpoint),
                "x-implementation-status": endpoint.status.value,
                "x-source-file": endpoint.file_path,
                "x-function-name": endpoint.function_name
            }
            
            # Add mock header for non-implemented endpoints
            if endpoint.status in [EndpointStatus.MOCK, EndpointStatus.STUB]:
                spec["paths"][path_key][method_key]["x-mock"] = True
        
        # Generate tags
        all_tags = set()
        for endpoint in self.endpoints:
            all_tags.update(endpoint.tags)
        
        spec["tags"] = [{"name": tag, "description": f"{tag} related endpoints"} 
                       for tag in sorted(all_tags)]
        
        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(spec, f, default_flow_style=False, sort_keys=False)
        
        logger.info(f"Generated OpenAPI spec: {output_path}")
    
    def _generate_openapi_parameters(self, parameters: List[Parameter]) -> List[Dict]:
        """Generate OpenAPI parameter definitions"""
        openapi_params = []
        for param in parameters:
            openapi_params.append({
                "name": param.name,
                "in": param.location,
                "required": param.required,
                "description": param.description,
                "schema": {"type": param.type.lower() if param.type in ["String", "Integer", "Boolean"] else "string"}
            })
        return openapi_params
    
    def _generate_openapi_responses(self, endpoint: Endpoint) -> Dict:
        """Generate OpenAPI response definitions"""
        responses = {
            "200": {
                "description": "Successful response",
                "content": {
                    "application/json": {
                        "schema": {"type": "object"}
                    }
                }
            }
        }
        
        # Add mock header for non-implemented endpoints
        if endpoint.status in [EndpointStatus.MOCK, EndpointStatus.STUB]:
            responses["200"]["headers"] = {
                "X-Data-Source": {
                    "description": "Indicates mock data source",
                    "schema": {"type": "string", "enum": ["MOCK"]}
                }
            }
        
        return responses
    
    def _generate_statistics(self) -> Dict[str, Any]:
        """Generate discovery statistics"""
        status_counts = {}
        for status in EndpointStatus:
            status_counts[status.value] = sum(1 for e in self.endpoints if e.status == status)
        
        method_counts = {}
        for method in HTTPMethod:
            method_counts[method.value] = sum(1 for e in self.endpoints if e.method == method)
        
        return {
            "by_status": status_counts,
            "by_method": method_counts,
            "registered_routers": list(self.registered_routers),
            "coverage": {
                "implemented_percentage": (status_counts.get("implemented", 0) / len(self.endpoints) * 100) if self.endpoints else 0,
                "registered_percentage": ((len(self.endpoints) - status_counts.get("not_registered", 0)) / len(self.endpoints) * 100) if self.endpoints else 0
            }
        }
    
    def generate_baseline_test_script(self, output_path: str):
        """Generate automated baseline test script"""
        test_script = '''#!/usr/bin/env python3
"""
Automated API Baseline Testing Script
Generated by API Discovery Engine

This script validates all discovered endpoints against their contracts.
"""

import asyncio
import json
import sys
from typing import Dict, List
import httpx
import pytest
from datetime import datetime

class BaselineTestResult:
    def __init__(self):
        self.passed = []
        self.mock_validated = []
        self.not_implemented = []
        self.failed = []
        self.total_endpoints = 0

class APIBaselineTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()
        self.results = BaselineTestResult()
    
    async def run_baseline_tests(self, endpoints_file: str) -> BaselineTestResult:
        """Run baseline tests for all endpoints"""
        with open(endpoints_file, 'r') as f:
            endpoints_data = json.load(f)
        
        endpoints = endpoints_data['endpoints']
        self.results.total_endpoints = len(endpoints)
        
        print(f"Running baseline tests for {len(endpoints)} endpoints...")
        
        try:
            for endpoint in endpoints:
                await self._test_endpoint(endpoint)
            return self.results
        finally:
            # Ensure the underlying httpx AsyncClient is closed even if tests fail
            try:
                await self.client.aclose()
            except Exception:
                logger.exception("Failed to close AsyncClient in APIBaselineTester")
    
    async def _test_endpoint(self, endpoint: Dict):
        """Test a single endpoint"""
        try:
            url = f"{self.base_url}{endpoint['path']}"
            method = endpoint['method'].lower()
            
            # Make request
            if method == 'get':
                response = await self.client.get(url)
            elif method == 'post':
                response = await self.client.post(url, json={})
            elif method == 'put':
                response = await self.client.put(url, json={})
            elif method == 'delete':
                response = await self.client.delete(url)
            else:
                response = await self.client.request(method.upper(), url)
            
            # Categorize result
            if response.status_code == 404:
                self.results.not_implemented.append({
                    'endpoint': endpoint,
                    'status_code': response.status_code,
                    'error': 'Endpoint not found'
                })
            elif response.status_code == 200:
                # Check for mock header
                if response.headers.get('X-Data-Source') == 'MOCK':
                    self.results.mock_validated.append({
                        'endpoint': endpoint,
                        'status_code': response.status_code,
                        'response_size': len(response.content)
                    })
                else:
                    self.results.passed.append({
                        'endpoint': endpoint,
                        'status_code': response.status_code,
                        'response_size': len(response.content)
                    })
            else:
                self.results.failed.append({
                    'endpoint': endpoint,
                    'status_code': response.status_code,
                    'error': response.text[:200]
                })
                
        except Exception as e:
            self.results.failed.append({
                'endpoint': endpoint,
                'status_code': 0,
                'error': str(e)
            })
    
    def generate_report(self, output_file: str):
        """Generate baseline test report"""
        report = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'total_endpoints': self.results.total_endpoints,
                'base_url': self.base_url
            },
            'summary': {
                'passed': len(self.results.passed),
                'mock_validated': len(self.results.mock_validated),
                'not_implemented': len(self.results.not_implemented),
                'failed': len(self.results.failed)
            },
            'details': {
                'passed': self.results.passed,
                'mock_validated': self.results.mock_validated,
                'not_implemented': self.results.not_implemented,
                'failed': self.results.failed
            }
        }
        
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\\nBaseline Test Report Generated: {output_file}")
        print(f"PASSED: {len(self.results.passed)}")
        print(f"MOCK_VALIDATED: {len(self.results.mock_validated)}")
        print(f"NOT_IMPLEMENTED: {len(self.results.not_implemented)}")
        print(f"FAILED: {len(self.results.failed)}")

async def main():
    if len(sys.argv) != 2:
        print("Usage: python baseline_test.py <endpoints.json>")
        sys.exit(1)
    
    endpoints_file = sys.argv[1]
    tester = APIBaselineTester()
    results = await tester.run_baseline_tests(endpoints_file)
    tester.generate_report('baseline_test_report.json')

if __name__ == "__main__":
    asyncio.run(main())
'''
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(test_script)
        
        # Make executable
        os.chmod(output_path, 0o755)
        logger.info(f"Generated baseline test script: {output_path}")

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description='Enterprise API Discovery & Contract Generation')
    parser.add_argument('--project-root', default='.', help='Project root directory')
    parser.add_argument('--output-dir', default='./api_contracts', help='Output directory')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)
    
    # Initialize discovery engine
    engine = APIDiscoveryEngine(args.project_root)
    
    # Discover endpoints
    endpoints = engine.discover_endpoints()
    
    if not endpoints:
        logger.warning("No endpoints discovered!")
        sys.exit(1)
    
    # Generate outputs
    engine.generate_endpoints_json(output_dir / 'endpoints.json')
    engine.generate_openapi_spec(output_dir / 'openapi.yaml')
    engine.generate_baseline_test_script(output_dir / 'baseline_test.py')
    
    # Print summary
    print(f"\n{'='*60}")
    print("ENTERPRISE API DISCOVERY COMPLETE")
    print(f"{'='*60}")
    print(f"Total Endpoints Discovered: {len(endpoints)}")
    print(f"Output Directory: {output_dir}")
    print(f"Generated Files:")
    print(f"  - endpoints.json (machine-readable contract)")
    print(f"  - openapi.yaml (OpenAPI 3.0 specification)")
    print(f"  - baseline_test.py (automated testing script)")
    print(f"\nNext Steps:")
    print(f"1. Review generated contracts")
    print(f"2. Run baseline tests: python {output_dir}/baseline_test.py {output_dir}/endpoints.json")
    print(f"3. Update OpenAPI spec with detailed schemas")
    print(f"4. Configure CI pipeline for continuous validation")

if __name__ == "__main__":
    main()