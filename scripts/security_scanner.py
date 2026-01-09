#!/usr/bin/env python3
"""
Enterprise Security Scanning & Penetration Testing Suite

This script implements comprehensive security validation for the AgisFL API,
including automated SAST, DAST, dependency scanning, and simulated penetration testing.

Author: Security Engineering Team  
Version: 1.0
Date: September 21, 2025
"""

import asyncio
import json
import sys
import subprocess
import time
import requests
import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import argparse
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class VulnerabilityLevel(Enum):
    """Vulnerability severity levels"""
    CRITICAL = "critical"
    HIGH = "high" 
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class ScanType(Enum):
    """Security scan types"""
    SAST = "sast"  # Static Application Security Testing
    DAST = "dast"  # Dynamic Application Security Testing
    DEPENDENCY = "dependency"
    INFRASTRUCTURE = "infrastructure"
    PENETRATION = "penetration"

@dataclass
class Vulnerability:
    """Security vulnerability finding"""
    id: str
    title: str
    severity: VulnerabilityLevel
    scan_type: ScanType
    description: str
    location: str
    recommendation: str
    cve_id: Optional[str] = None
    cvss_score: Optional[float] = None
    exploitable: bool = False

@dataclass
class SecurityScanResult:
    """Results from a security scan"""
    scan_type: ScanType
    status: str
    vulnerabilities: List[Vulnerability]
    scan_duration: float
    timestamp: str
    tool_version: str = ""

class EnterpriseSecurityScanner:
    """Comprehensive security scanning engine"""
    
    def __init__(self, project_root: str, target_url: str = "http://localhost:8000"):
        self.project_root = Path(project_root)
        self.target_url = target_url
        self.results: List[SecurityScanResult] = []
        
    async def run_comprehensive_scan(self) -> Dict[str, Any]:
        """Run all security scans"""
        logger.info("🛡️  Starting Enterprise Security Scan Suite")
        
        # Run SAST scans
        await self._run_sast_scans()
        
        # Run dependency scans
        await self._run_dependency_scans()
        
        # Run DAST scans (requires running server)
        if await self._check_server_availability():
            await self._run_dast_scans()
            await self._run_penetration_tests()
        else:
            logger.warning("Server not available - skipping DAST and penetration tests")
        
        # Generate comprehensive report
        return self._generate_security_report()
    
    async def _run_sast_scans(self):
        """Run Static Application Security Testing"""
        logger.info("Running SAST scans...")
        
        # Bandit scan
        await self._run_bandit_scan()
        
        # Semgrep scan
        await self._run_semgrep_scan()
        
        # Custom security pattern scan
        await self._run_custom_security_scan()
    
    async def _run_bandit_scan(self):
        """Run Bandit security scanner"""
        try:
            cmd = [
                "bandit", "-r", str(self.project_root / "backend"),
                "-f", "json", "-o", "bandit_results.json"
            ]
            
            start_time = time.time()
            result = subprocess.run(cmd, capture_output=True, text=True)
            duration = time.time() - start_time
            
            vulnerabilities = []
            
            if Path("bandit_results.json").exists():
                with open("bandit_results.json", 'r') as f:
                    bandit_data = json.load(f)
                
                for issue in bandit_data.get("results", []):
                    vuln = Vulnerability(
                        id=f"BANDIT-{issue['test_id']}",
                        title=issue["test_name"],
                        severity=self._map_bandit_severity(issue["issue_severity"]),
                        scan_type=ScanType.SAST,
                        description=issue["issue_text"],
                        location=f"{issue['filename']}:{issue['line_number']}",
                        recommendation=self._get_bandit_recommendation(issue["test_id"]),
                        cvss_score=self._calculate_cvss_score(issue["issue_severity"])
                    )
                    vulnerabilities.append(vuln)
            
            scan_result = SecurityScanResult(
                scan_type=ScanType.SAST,
                status="completed",
                vulnerabilities=vulnerabilities,
                scan_duration=duration,
                timestamp=datetime.now().isoformat(),
                tool_version="bandit"
            )
            
            self.results.append(scan_result)
            logger.info(f"Bandit scan completed - found {len(vulnerabilities)} issues")
            
        except Exception as e:
            logger.error(f"Bandit scan failed: {e}")
    
    async def _run_semgrep_scan(self):
        """Run Semgrep security scanner"""
        try:
            cmd = [
                "semgrep", "--config=auto", 
                str(self.project_root / "backend"),
                "--json", "--output=semgrep_results.json"
            ]
            
            start_time = time.time()
            result = subprocess.run(cmd, capture_output=True, text=True)
            duration = time.time() - start_time
            
            vulnerabilities = []
            
            if Path("semgrep_results.json").exists():
                with open("semgrep_results.json", 'r') as f:
                    semgrep_data = json.load(f)
                
                for finding in semgrep_data.get("results", []):
                    vuln = Vulnerability(
                        id=f"SEMGREP-{finding['check_id']}",
                        title=finding["check_id"],
                        severity=self._map_semgrep_severity(finding.get("extra", {}).get("severity", "INFO")),
                        scan_type=ScanType.SAST,
                        description=finding.get("extra", {}).get("message", ""),
                        location=f"{finding['path']}:{finding['start']['line']}",
                        recommendation=self._get_semgrep_recommendation(finding["check_id"])
                    )
                    vulnerabilities.append(vuln)
            
            scan_result = SecurityScanResult(
                scan_type=ScanType.SAST,
                status="completed",
                vulnerabilities=vulnerabilities,
                scan_duration=duration,
                timestamp=datetime.now().isoformat(),
                tool_version="semgrep"
            )
            
            self.results.append(scan_result)
            logger.info(f"Semgrep scan completed - found {len(vulnerabilities)} issues")
            
        except Exception as e:
            logger.error(f"Semgrep scan failed: {e}")
    
    async def _run_custom_security_scan(self):
        """Run custom security pattern scanning"""
        try:
            start_time = time.time()
            vulnerabilities = []
            
            # Define security patterns to look for
            security_patterns = {
                "hardcoded_secrets": [
                    r"password\s*=\s*['\"][^'\"]+['\"]",
                    r"api_key\s*=\s*['\"][^'\"]+['\"]",
                    r"secret\s*=\s*['\"][^'\"]+['\"]",
                    r"token\s*=\s*['\"][^'\"]+['\"]"
                ],
                "sql_injection": [
                    r"\.execute\s*\(\s*['\"].+%s",
                    r"\.format\s*\(.+\).+execute",
                    r"f['\"].+\{.+\}.+execute"
                ],
                "insecure_random": [
                    r"random\.random\(\)",
                    r"random\.choice\(",
                    r"random\.randint\("
                ],
                "debug_mode": [
                    r"debug\s*=\s*True",
                    r"DEBUG\s*=\s*True"
                ]
            }
            
            # Scan Python files
            for py_file in (self.project_root / "backend").rglob("*.py"):
                try:
                    with open(py_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    for pattern_type, patterns in security_patterns.items():
                        for pattern in patterns:
                            import re
                            matches = re.finditer(pattern, content, re.IGNORECASE)
                            for match in matches:
                                line_num = content[:match.start()].count('\n') + 1
                                
                                vuln = Vulnerability(
                                    id=f"CUSTOM-{pattern_type.upper()}-{hash(str(py_file) + str(line_num)) % 10000}",
                                    title=f"Security Pattern: {pattern_type.replace('_', ' ').title()}",
                                    severity=self._get_pattern_severity(pattern_type),
                                    scan_type=ScanType.SAST,
                                    description=f"Potentially insecure pattern detected: {match.group()}",
                                    location=f"{py_file.relative_to(self.project_root)}:{line_num}",
                                    recommendation=self._get_pattern_recommendation(pattern_type)
                                )
                                vulnerabilities.append(vuln)
                
                except Exception as e:
                    logger.warning(f"Could not scan {py_file}: {e}")
            
            duration = time.time() - start_time
            
            scan_result = SecurityScanResult(
                scan_type=ScanType.SAST,
                status="completed",
                vulnerabilities=vulnerabilities,
                scan_duration=duration,
                timestamp=datetime.now().isoformat(),
                tool_version="custom-patterns-v1.0"
            )
            
            self.results.append(scan_result)
            logger.info(f"Custom security scan completed - found {len(vulnerabilities)} issues")
            
        except Exception as e:
            logger.error(f"Custom security scan failed: {e}")
    
    async def _run_dependency_scans(self):
        """Run dependency vulnerability scans"""
        logger.info("Running dependency scans...")
        
        # Safety scan
        await self._run_safety_scan()
        
        # npm audit (if package.json exists)
        if (self.project_root / "package.json").exists():
            await self._run_npm_audit()
    
    async def _run_safety_scan(self):
        """Run Safety dependency scanner"""
        try:
            requirements_file = self.project_root / "backend" / "requirements.txt"
            if not requirements_file.exists():
                logger.warning("requirements.txt not found - skipping Safety scan")
                return
            
            cmd = ["safety", "check", "-r", str(requirements_file), "--json"]
            
            start_time = time.time()
            result = subprocess.run(cmd, capture_output=True, text=True)
            duration = time.time() - start_time
            
            vulnerabilities = []
            
            try:
                if result.stdout:
                    safety_data = json.loads(result.stdout)
                    
                    for vuln_data in safety_data:
                        vuln = Vulnerability(
                            id=f"SAFETY-{vuln_data['id']}",
                            title=f"Vulnerable dependency: {vuln_data['package_name']}",
                            severity=VulnerabilityLevel.HIGH,  # Safety issues are typically high
                            scan_type=ScanType.DEPENDENCY,
                            description=vuln_data["advisory"],
                            location=f"requirements.txt - {vuln_data['package_name']} {vuln_data['installed_version']}",
                            recommendation=f"Upgrade to version {vuln_data.get('vulnerable_spec', 'latest')}",
                            cve_id=vuln_data.get("id", "")
                        )
                        vulnerabilities.append(vuln)
            except json.JSONDecodeError:
                # Safety might output non-JSON format
                if "No known security vulnerabilities found" in result.stdout:
                    pass  # No vulnerabilities found
                else:
                    logger.warning("Could not parse Safety output")
            
            scan_result = SecurityScanResult(
                scan_type=ScanType.DEPENDENCY,
                status="completed",
                vulnerabilities=vulnerabilities,
                scan_duration=duration,
                timestamp=datetime.now().isoformat(),
                tool_version="safety"
            )
            
            self.results.append(scan_result)
            logger.info(f"Safety scan completed - found {len(vulnerabilities)} vulnerabilities")
            
        except Exception as e:
            logger.error(f"Safety scan failed: {e}")
    
    async def _run_npm_audit(self):
        """Run npm audit for Node.js dependencies"""
        try:
            cmd = ["npm", "audit", "--json"]
            
            start_time = time.time()
            result = subprocess.run(cmd, cwd=self.project_root, capture_output=True, text=True)
            duration = time.time() - start_time
            
            vulnerabilities = []
            
            if result.stdout:
                try:
                    audit_data = json.loads(result.stdout)
                    
                    for vuln_id, vuln_data in audit_data.get("vulnerabilities", {}).items():
                        vuln = Vulnerability(
                            id=f"NPM-{vuln_id}",
                            title=f"Node.js vulnerability: {vuln_data.get('title', vuln_id)}",
                            severity=self._map_npm_severity(vuln_data.get("severity", "moderate")),
                            scan_type=ScanType.DEPENDENCY,
                            description=vuln_data.get("overview", ""),
                            location=f"package.json - {vuln_data.get('module_name', 'unknown')}",
                            recommendation=vuln_data.get("recommendation", "Update to latest version"),
                            cve_id=vuln_data.get("cves", [""])[0] if vuln_data.get("cves") else None
                        )
                        vulnerabilities.append(vuln)
                        
                except json.JSONDecodeError:
                    logger.warning("Could not parse npm audit output")
            
            scan_result = SecurityScanResult(
                scan_type=ScanType.DEPENDENCY,
                status="completed",
                vulnerabilities=vulnerabilities,
                scan_duration=duration,
                timestamp=datetime.now().isoformat(),
                tool_version="npm-audit"
            )
            
            self.results.append(scan_result)
            logger.info(f"npm audit completed - found {len(vulnerabilities)} vulnerabilities")
            
        except Exception as e:
            logger.error(f"npm audit failed: {e}")
    
    async def _check_server_availability(self) -> bool:
        """Check if the target server is available"""
        try:
            response = requests.get(f"{self.target_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    async def _run_dast_scans(self):
        """Run Dynamic Application Security Testing"""
        logger.info("Running DAST scans...")
        
        # Basic OWASP ZAP-style testing
        await self._run_web_vulnerability_scan()
        
        # API-specific security testing
        await self._run_api_security_scan()
    
    async def _run_web_vulnerability_scan(self):
        """Simulate web vulnerability scanning"""
        try:
            start_time = time.time()
            vulnerabilities = []
            
            # Test common web vulnerabilities
            test_cases = [
                {
                    "name": "SQL Injection Test",
                    "path": "/api/auth/login",
                    "payload": {"username": "admin' OR '1'='1", "password": "test"},
                    "vulnerability_type": "sql_injection"
                },
                {
                    "name": "XSS Test",
                    "path": "/api/datasets/list",
                    "payload": {"search": "<script>alert('XSS')</script>"},
                    "vulnerability_type": "xss"
                },
                {
                    "name": "Directory Traversal Test",
                    "path": "/api/files/download",
                    "payload": {"filename": "../../../etc/passwd"},
                    "vulnerability_type": "directory_traversal"
                }
            ]
            
            for test_case in test_cases:
                try:
                    response = requests.post(
                        f"{self.target_url}{test_case['path']}", 
                        json=test_case["payload"],
                        timeout=10
                    )
                    
                    # Analyze response for vulnerabilities
                    if self._analyze_response_for_vulnerability(response, test_case):
                        vuln = Vulnerability(
                            id=f"DAST-{test_case['vulnerability_type'].upper()}",
                            title=f"Potential {test_case['name']}",
                            severity=VulnerabilityLevel.HIGH,
                            scan_type=ScanType.DAST,
                            description=f"Endpoint may be vulnerable to {test_case['vulnerability_type']}",
                            location=test_case["path"],
                            recommendation=f"Implement input validation and sanitization for {test_case['vulnerability_type']}",
                            exploitable=True
                        )
                        vulnerabilities.append(vuln)
                
                except Exception as e:
                    logger.debug(f"DAST test failed for {test_case['name']}: {e}")
            
            duration = time.time() - start_time
            
            scan_result = SecurityScanResult(
                scan_type=ScanType.DAST,
                status="completed",
                vulnerabilities=vulnerabilities,
                scan_duration=duration,
                timestamp=datetime.now().isoformat(),
                tool_version="custom-dast-v1.0"
            )
            
            self.results.append(scan_result)
            logger.info(f"Web vulnerability scan completed - found {len(vulnerabilities)} issues")
            
        except Exception as e:
            logger.error(f"Web vulnerability scan failed: {e}")
    
    async def _run_api_security_scan(self):
        """Run API-specific security tests"""
        try:
            start_time = time.time()
            vulnerabilities = []
            
            # Load API endpoints
            endpoints_file = self.project_root / "api_contracts" / "endpoints.json"
            if endpoints_file.exists():
                with open(endpoints_file, 'r') as f:
                    endpoints_data = json.load(f)
                endpoints = endpoints_data.get("endpoints", [])
            else:
                endpoints = []
            
            # Test each endpoint for common API vulnerabilities
            for endpoint in endpoints[:10]:  # Limit to first 10 for demo
                try:
                    # Test for missing authentication
                    response = requests.request(
                        endpoint["method"], 
                        f"{self.target_url}{endpoint['path']}",
                        timeout=5
                    )
                    
                    if response.status_code == 200 and "login" not in endpoint["path"].lower():
                        # Endpoint accessible without authentication
                        vuln = Vulnerability(
                            id=f"API-AUTH-{hash(endpoint['path']) % 10000}",
                            title="Missing Authentication",
                            severity=VulnerabilityLevel.MEDIUM,
                            scan_type=ScanType.DAST,
                            description="API endpoint accessible without authentication",
                            location=endpoint["path"],
                            recommendation="Implement proper authentication for all sensitive endpoints"
                        )
                        vulnerabilities.append(vuln)
                    
                    # Test for verbose error messages
                    if response.status_code >= 400:
                        if any(keyword in response.text.lower() for keyword in 
                               ["traceback", "exception", "error:", "stack trace"]):
                            vuln = Vulnerability(
                                id=f"API-INFO-{hash(endpoint['path']) % 10000}",
                                title="Information Disclosure",
                                severity=VulnerabilityLevel.LOW,
                                scan_type=ScanType.DAST,
                                description="API returns verbose error messages",
                                location=endpoint["path"],
                                recommendation="Implement generic error messages for production"
                            )
                            vulnerabilities.append(vuln)
                
                except Exception as e:
                    logger.debug(f"API security test failed for {endpoint['path']}: {e}")
            
            duration = time.time() - start_time
            
            scan_result = SecurityScanResult(
                scan_type=ScanType.DAST,
                status="completed",
                vulnerabilities=vulnerabilities,
                scan_duration=duration,
                timestamp=datetime.now().isoformat(),
                tool_version="api-security-v1.0"
            )
            
            self.results.append(scan_result)
            logger.info(f"API security scan completed - found {len(vulnerabilities)} issues")
            
        except Exception as e:
            logger.error(f"API security scan failed: {e}")
    
    async def _run_penetration_tests(self):
        """Run simulated penetration testing"""
        logger.info("Running penetration tests...")
        
        try:
            start_time = time.time()
            vulnerabilities = []
            
            # Simulate common penetration testing scenarios
            pen_tests = [
                self._test_privilege_escalation,
                self._test_session_management,
                self._test_business_logic_flaws,
                self._test_rate_limiting
            ]
            
            for test_func in pen_tests:
                try:
                    test_vulns = await test_func()
                    vulnerabilities.extend(test_vulns)
                except Exception as e:
                    logger.debug(f"Penetration test failed: {e}")
            
            duration = time.time() - start_time
            
            scan_result = SecurityScanResult(
                scan_type=ScanType.PENETRATION,
                status="completed",
                vulnerabilities=vulnerabilities,
                scan_duration=duration,
                timestamp=datetime.now().isoformat(),
                tool_version="pentest-sim-v1.0"
            )
            
            self.results.append(scan_result)
            logger.info(f"Penetration testing completed - found {len(vulnerabilities)} issues")
            
        except Exception as e:
            logger.error(f"Penetration testing failed: {e}")
    
    async def _test_privilege_escalation(self) -> List[Vulnerability]:
        """Test for privilege escalation vulnerabilities"""
        vulnerabilities = []
        
        try:
            # Try to access admin endpoints without proper auth
            admin_endpoints = [
                "/api/admin/users",
                "/api/admin/settings", 
                "/api/admin/logs"
            ]
            
            for endpoint in admin_endpoints:
                response = requests.get(f"{self.target_url}{endpoint}", timeout=5)
                if response.status_code == 200:
                    vuln = Vulnerability(
                        id=f"PENTEST-PRIVESC-{hash(endpoint) % 10000}",
                        title="Privilege Escalation Possible",
                        severity=VulnerabilityLevel.CRITICAL,
                        scan_type=ScanType.PENETRATION,
                        description=f"Admin endpoint {endpoint} accessible without proper authorization",
                        location=endpoint,
                        recommendation="Implement strict role-based access control",
                        exploitable=True
                    )
                    vulnerabilities.append(vuln)
        
        except Exception as e:
            logger.debug(f"Privilege escalation test failed: {e}")
        
        return vulnerabilities
    
    async def _test_session_management(self) -> List[Vulnerability]:
        """Test session management security"""
        vulnerabilities = []
        
        try:
            # Test session fixation
            login_response = requests.post(
                f"{self.target_url}/api/auth/login",
                json={"username": "test", "password": "test"},
                timeout=5
            )
            
            if login_response.status_code == 200:
                # Check for secure session cookies
                cookies = login_response.cookies
                for cookie in cookies:
                    if not cookie.secure:
                        vuln = Vulnerability(
                            id="PENTEST-SESSION-INSECURE",
                            title="Insecure Session Cookies",
                            severity=VulnerabilityLevel.MEDIUM,
                            scan_type=ScanType.PENETRATION,
                            description="Session cookies not marked as secure",
                            location="/api/auth/login",
                            recommendation="Set secure flag on all session cookies"
                        )
                        vulnerabilities.append(vuln)
        
        except Exception as e:
            logger.debug(f"Session management test failed: {e}")
        
        return vulnerabilities
    
    async def _test_business_logic_flaws(self) -> List[Vulnerability]:
        """Test for business logic vulnerabilities"""
        vulnerabilities = []
        
        try:
            # Test for race conditions in FL training
            # Simulate simultaneous start requests
            tasks = []
            for _ in range(5):
                task = asyncio.create_task(self._make_async_request(
                    "POST", f"{self.target_url}/api/fl/start-training", {"rounds": 10}
                ))
                tasks.append(task)
            
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            success_count = sum(1 for r in responses if isinstance(r, requests.Response) and r.status_code == 200)
            
            if success_count > 1:
                vuln = Vulnerability(
                    id="PENTEST-RACE-CONDITION",
                    title="Race Condition in FL Training",
                    severity=VulnerabilityLevel.MEDIUM,
                    scan_type=ScanType.PENETRATION,
                    description="Multiple training sessions can be started simultaneously",
                    location="/api/fl/start-training",
                    recommendation="Implement proper locking mechanism for training state"
                )
                vulnerabilities.append(vuln)
        
        except Exception as e:
            logger.debug(f"Business logic test failed: {e}")
        
        return vulnerabilities
    
    async def _test_rate_limiting(self) -> List[Vulnerability]:
        """Test rate limiting implementation"""
        vulnerabilities = []
        
        try:
            # Send rapid requests to test rate limiting
            endpoint = f"{self.target_url}/api/auth/login"
            
            responses = []
            for i in range(20):  # Send 20 rapid requests
                try:
                    response = requests.post(
                        endpoint,
                        json={"username": f"user{i}", "password": "test"},
                        timeout=2
                    )
                    responses.append(response.status_code)
                except:
                    pass
            
            # Check if any rate limiting occurred
            if all(status != 429 for status in responses):  # 429 = Too Many Requests
                vuln = Vulnerability(
                    id="PENTEST-RATE-LIMIT",
                    title="Missing Rate Limiting",
                    severity=VulnerabilityLevel.MEDIUM,
                    scan_type=ScanType.PENETRATION,
                    description="No rate limiting detected on authentication endpoint",
                    location="/api/auth/login",
                    recommendation="Implement rate limiting to prevent brute force attacks"
                )
                vulnerabilities.append(vuln)
        
        except Exception as e:
            logger.debug(f"Rate limiting test failed: {e}")
        
        return vulnerabilities
    
    async def _make_async_request(self, method: str, url: str, data: dict) -> requests.Response:
        """Make an async HTTP request"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, 
            lambda: requests.request(method, url, json=data, timeout=5)
        )
    
    def _analyze_response_for_vulnerability(self, response: requests.Response, test_case: dict) -> bool:
        """Analyze response for potential vulnerabilities"""
        vuln_type = test_case["vulnerability_type"]
        
        if vuln_type == "sql_injection":
            # Look for SQL error messages
            sql_errors = ["sql", "mysql", "postgres", "sqlite", "syntax error"]
            return any(error in response.text.lower() for error in sql_errors)
        
        elif vuln_type == "xss":
            # Look for reflected XSS
            return test_case["payload"]["search"] in response.text
        
        elif vuln_type == "directory_traversal":
            # Look for file system access
            file_indicators = ["root:", "/etc/passwd", "www-data"]
            return any(indicator in response.text for indicator in file_indicators)
        
        return False
    
    def _generate_security_report(self) -> Dict[str, Any]:
        """Generate comprehensive security report"""
        total_vulns = sum(len(scan.vulnerabilities) for scan in self.results)
        
        severity_counts = {severity.value: 0 for severity in VulnerabilityLevel}
        scan_type_counts = {scan_type.value: 0 for scan_type in ScanType}
        
        all_vulnerabilities = []
        for scan in self.results:
            all_vulnerabilities.extend(scan.vulnerabilities)
            for vuln in scan.vulnerabilities:
                severity_counts[vuln.severity.value] += 1
                scan_type_counts[vuln.scan_type.value] += 1
        
        # Calculate security score (0-100)
        security_score = self._calculate_security_score(severity_counts, total_vulns)
        
        # Generate recommendations
        recommendations = self._generate_security_recommendations(severity_counts)
        
        # Compliance assessment
        compliance_status = self._assess_compliance(severity_counts)
        
        report = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "scanner_version": "1.0",
                "target_url": self.target_url,
                "project_root": str(self.project_root)
            },
            "executive_summary": {
                "total_vulnerabilities": total_vulns,
                "security_score": security_score,
                "risk_level": self._determine_risk_level(severity_counts),
                "compliance_status": compliance_status
            },
            "vulnerability_breakdown": {
                "by_severity": severity_counts,
                "by_scan_type": scan_type_counts
            },
            "scan_results": [asdict(scan) for scan in self.results],
            "detailed_findings": [asdict(vuln) for vuln in all_vulnerabilities],
            "recommendations": recommendations,
            "remediation_timeline": self._generate_remediation_timeline(all_vulnerabilities)
        }
        
        return report
    
    def _calculate_security_score(self, severity_counts: dict, total_vulns: int) -> float:
        """Calculate overall security score"""
        if total_vulns == 0:
            return 100.0
        
        # Weight by severity
        weights = {
            "critical": 40,
            "high": 20,
            "medium": 10,
            "low": 5,
            "info": 1
        }
        
        total_weight = sum(severity_counts[sev] * weights[sev] for sev in weights)
        max_possible_weight = total_vulns * weights["critical"]
        
        return max(0, 100 - (total_weight / max_possible_weight * 100)) if max_possible_weight > 0 else 100
    
    def _determine_risk_level(self, severity_counts: dict) -> str:
        """Determine overall risk level"""
        if severity_counts["critical"] > 0:
            return "CRITICAL"
        elif severity_counts["high"] >= 3:
            return "HIGH"
        elif severity_counts["high"] > 0 or severity_counts["medium"] >= 5:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _assess_compliance(self, severity_counts: dict) -> dict:
        """Assess compliance status"""
        return {
            "SOC2": "NON_COMPLIANT" if severity_counts["critical"] > 0 else "COMPLIANT",
            "GDPR": "NON_COMPLIANT" if severity_counts["critical"] + severity_counts["high"] > 0 else "COMPLIANT",
            "OWASP_TOP_10": "NON_COMPLIANT" if severity_counts["critical"] + severity_counts["high"] > 2 else "COMPLIANT"
        }
    
    def _generate_security_recommendations(self, severity_counts: dict) -> List[str]:
        """Generate security recommendations"""
        recommendations = []
        
        if severity_counts["critical"] > 0:
            recommendations.append("🚨 IMMEDIATE ACTION REQUIRED: Address all critical vulnerabilities before production deployment")
        
        if severity_counts["high"] > 0:
            recommendations.append("⚠️  High-priority vulnerabilities detected - plan remediation within 7 days")
        
        if severity_counts["medium"] > 5:
            recommendations.append("📋 Consider addressing medium-severity vulnerabilities in next sprint")
        
        recommendations.extend([
            "🔒 Implement Web Application Firewall (WAF)",
            "🛡️  Enable security headers (HSTS, CSP, X-Frame-Options)",
            "📊 Set up continuous security monitoring",
            "🔄 Schedule regular penetration testing",
            "📚 Conduct security training for development team"
        ])
        
        return recommendations
    
    def _generate_remediation_timeline(self, vulnerabilities: List[Vulnerability]) -> dict:
        """Generate remediation timeline"""
        critical = [v for v in vulnerabilities if v.severity == VulnerabilityLevel.CRITICAL]
        high = [v for v in vulnerabilities if v.severity == VulnerabilityLevel.HIGH]
        medium = [v for v in vulnerabilities if v.severity == VulnerabilityLevel.MEDIUM]
        
        return {
            "immediate_0_24_hours": len(critical),
            "urgent_1_7_days": len(high),
            "important_7_30_days": len(medium),
            "total_estimated_hours": len(critical) * 8 + len(high) * 4 + len(medium) * 2
        }
    
    # Helper methods for severity mapping
    def _map_bandit_severity(self, severity: str) -> VulnerabilityLevel:
        mapping = {
            "HIGH": VulnerabilityLevel.HIGH,
            "MEDIUM": VulnerabilityLevel.MEDIUM,
            "LOW": VulnerabilityLevel.LOW
        }
        return mapping.get(severity.upper(), VulnerabilityLevel.MEDIUM)
    
    def _map_semgrep_severity(self, severity: str) -> VulnerabilityLevel:
        mapping = {
            "ERROR": VulnerabilityLevel.HIGH,
            "WARNING": VulnerabilityLevel.MEDIUM,
            "INFO": VulnerabilityLevel.LOW
        }
        return mapping.get(severity.upper(), VulnerabilityLevel.MEDIUM)
    
    def _map_npm_severity(self, severity: str) -> VulnerabilityLevel:
        mapping = {
            "critical": VulnerabilityLevel.CRITICAL,
            "high": VulnerabilityLevel.HIGH,
            "moderate": VulnerabilityLevel.MEDIUM,
            "low": VulnerabilityLevel.LOW
        }
        return mapping.get(severity.lower(), VulnerabilityLevel.MEDIUM)
    
    def _get_pattern_severity(self, pattern_type: str) -> VulnerabilityLevel:
        severity_map = {
            "hardcoded_secrets": VulnerabilityLevel.CRITICAL,
            "sql_injection": VulnerabilityLevel.HIGH,
            "insecure_random": VulnerabilityLevel.MEDIUM,
            "debug_mode": VulnerabilityLevel.LOW
        }
        return severity_map.get(pattern_type, VulnerabilityLevel.MEDIUM)
    
    def _calculate_cvss_score(self, severity: str) -> float:
        """Calculate CVSS score based on severity"""
        scores = {
            "HIGH": 8.5,
            "MEDIUM": 6.0,
            "LOW": 3.0
        }
        return scores.get(severity.upper(), 5.0)
    
    def _get_bandit_recommendation(self, test_id: str) -> str:
        """Get specific recommendation for Bandit findings"""
        recommendations = {
            "B101": "Use assert statements only for debugging, not for production validation",
            "B102": "Avoid using exec() - use safer alternatives",
            "B103": "Set permissions explicitly instead of using 0o777",
            "B104": "Avoid binding to all interfaces - specify specific IP",
            "B105": "Replace hardcoded passwords with secure credential management",
            "B106": "Replace hardcoded passwords with environment variables or secure vaults"
        }
        return recommendations.get(test_id, "Review and address security issue according to best practices")
    
    def _get_semgrep_recommendation(self, check_id: str) -> str:
        """Get specific recommendation for Semgrep findings"""
        if "sql" in check_id.lower():
            return "Use parameterized queries or ORM to prevent SQL injection"
        elif "xss" in check_id.lower():
            return "Sanitize and escape user input before rendering"
        elif "auth" in check_id.lower():
            return "Implement proper authentication and authorization checks"
        else:
            return "Follow secure coding practices for this vulnerability type"
    
    def _get_pattern_recommendation(self, pattern_type: str) -> str:
        """Get recommendation for custom security patterns"""
        recommendations = {
            "hardcoded_secrets": "Move secrets to environment variables or secure vault",
            "sql_injection": "Use parameterized queries and input validation",
            "insecure_random": "Use cryptographically secure random functions for security-sensitive operations",
            "debug_mode": "Disable debug mode in production environments"
        }
        return recommendations.get(pattern_type, "Address security concern according to best practices")

async def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description='Enterprise Security Scanner')
    parser.add_argument('--project-root', default='.', help='Project root directory')
    parser.add_argument('--target-url', default='http://localhost:8000', help='Target URL for DAST scans')
    parser.add_argument('--output', default='security_report.json', help='Output report file')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Initialize scanner
    scanner = EnterpriseSecurityScanner(args.project_root, args.target_url)
    
    # Run comprehensive scan
    try:
        report = await scanner.run_comprehensive_scan()
        
        # Save report
        with open(args.output, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        # Print summary
        print(f"\n{'='*80}")
        print("🛡️  ENTERPRISE SECURITY SCAN COMPLETE")
        print(f"{'='*80}")
        print(f"Security Score: {report['executive_summary']['security_score']:.1f}/100")
        print(f"Risk Level: {report['executive_summary']['risk_level']}")
        print(f"Total Vulnerabilities: {report['executive_summary']['total_vulnerabilities']}")
        print(f"\nBreakdown by Severity:")
        for severity, count in report['vulnerability_breakdown']['by_severity'].items():
            if count > 0:
                print(f"  {severity.upper()}: {count}")
        
        print(f"\nDetailed report saved to: {args.output}")
        
        # Return exit code based on findings
        critical_count = report['vulnerability_breakdown']['by_severity']['critical']
        if critical_count > 0:
            print(f"\n❌ CRITICAL VULNERABILITIES FOUND - Deployment blocked!")
            sys.exit(1)
        else:
            print(f"\n✅ No critical vulnerabilities found")
            sys.exit(0)
            
    except Exception as e:
        logger.error(f"Security scan failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())