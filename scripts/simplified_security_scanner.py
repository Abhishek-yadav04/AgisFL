#!/usr/bin/env python3
"""
Simplified Enterprise Security Scanner
=====================================

Focuses on critical security vulnerabilities that can be detected without
external tools like bandit or semgrep. Performs custom security analysis
and basic penetration testing.

Author: Security Engineering Team
Version: 1.0
Date: September 21, 2025
"""

import asyncio
import json
import sys
import time
import requests
import os
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
from datetime import datetime

class VulnerabilityLevel(Enum):
    """Vulnerability severity levels"""
    CRITICAL = "critical"
    HIGH = "high" 
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

@dataclass
class Vulnerability:
    """Security vulnerability finding"""
    id: str
    title: str
    severity: VulnerabilityLevel
    description: str
    location: str
    recommendation: str
    exploitable: bool = False

class SimplifiedSecurityScanner:
    """Simplified security scanner focused on critical issues"""
    
    def __init__(self, project_root: str, target_url: str = "http://localhost:8000"):
        self.project_root = Path(project_root)
        self.target_url = target_url
        self.vulnerabilities: List[Vulnerability] = []
        
    async def run_security_scan(self) -> Dict[str, Any]:
        """Run simplified security scan"""
        print("🛡️  Starting Simplified Enterprise Security Scan")
        
        # Run focused security checks
        await self._check_hardcoded_secrets()
        await self._check_debug_configurations()
        await self._check_insecure_patterns()
        await self._check_authentication_issues()
        
        # Check if server is running for DAST tests
        if await self._check_server_availability():
            await self._run_api_security_tests()
        else:
            print("⚠️  Server not available - skipping dynamic tests")
        
        # Generate report
        return self._generate_security_report()
    
    async def _check_hardcoded_secrets(self):
        """Check for hardcoded secrets and credentials"""
        print("🔍 Checking for hardcoded secrets...")
        
        secret_patterns = {
            'passwords': [
                r'password\s*=\s*["\'][^"\']{3,}["\']',
                r'passwd\s*=\s*["\'][^"\']{3,}["\']',
                r'pwd\s*=\s*["\'][^"\']{3,}["\']'
            ],
            'api_keys': [
                r'api_key\s*=\s*["\'][^"\']{10,}["\']',
                r'apikey\s*=\s*["\'][^"\']{10,}["\']',
                r'secret_key\s*=\s*["\'][^"\']{10,}["\']'
            ],
            'tokens': [
                r'token\s*=\s*["\'][^"\']{10,}["\']',
                r'access_token\s*=\s*["\'][^"\']{10,}["\']',
                r'auth_token\s*=\s*["\'][^"\']{10,}["\']'
            ],
            'database_urls': [
                r'DATABASE_URL\s*=\s*["\'][^"\']+["\']',
                r'db_url\s*=\s*["\'][^"\']+["\']'
            ]
        }
        
        # Scan Python files in backend directory only
        backend_dir = self.project_root / "backend"
        if backend_dir.exists():
            for py_file in backend_dir.rglob("*.py"):
                await self._scan_file_for_secrets(py_file, secret_patterns)
    
    async def _scan_file_for_secrets(self, file_path: Path, patterns: Dict[str, List[str]]):
        """Scan a single file for secret patterns"""
        try:
            # Skip virtual environment and large files
            if 'venv' in str(file_path) or 'env' in str(file_path):
                return
                
            if file_path.stat().st_size > 1024 * 1024:  # Skip files > 1MB
                return
                
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            for category, pattern_list in patterns.items():
                for pattern in pattern_list:
                    matches = re.finditer(pattern, content, re.IGNORECASE)
                    for match in matches:
                        line_num = content[:match.start()].count('\n') + 1
                        
                        # Skip common false positives
                        if self._is_false_positive(match.group(), category):
                            continue
                        
                        vuln = Vulnerability(
                            id=f"SECRETS-{category.upper()}-{hash(str(file_path) + str(line_num)) % 10000}",
                            title=f"Hardcoded {category.replace('_', ' ').title()}",
                            severity=VulnerabilityLevel.CRITICAL,
                            description=f"Hardcoded {category} found: {match.group()[:50]}...",
                            location=f"{file_path.relative_to(self.project_root)}:{line_num}",
                            recommendation=f"Move {category} to environment variables or secure vault",
                            exploitable=True
                        )
                        self.vulnerabilities.append(vuln)
                        
        except Exception as e:
            print(f"Warning: Could not scan {file_path}: {e}")
    
    def _is_false_positive(self, match_text: str, category: str) -> bool:
        """Check if the match is likely a false positive"""
        false_positives = [
            'password = ""',
            'password = None',
            'password = "password"',
            'password = "test"',
            'password = "demo"',
            'api_key = ""',
            'token = ""',
            'secret_key = "your_secret_here"',
            'JWT_SECRET_KEY = secrets.token_urlsafe',  # This is actually secure
        ]
        
        return any(fp in match_text for fp in false_positives)
    
    async def _check_debug_configurations(self):
        """Check for debug mode and development configurations"""
        print("🔍 Checking debug configurations...")
        
        debug_patterns = [
            r'debug\s*=\s*True',
            r'DEBUG\s*=\s*True',
            r'development\s*=\s*True',
            r'testing\s*=\s*True'
        ]
        
        config_files = [
            self.project_root / "backend" / "main.py",
            self.project_root / "backend" / "config" / "production_config.py",
            self.project_root / ".env",
            self.project_root / "docker-compose.yml"
        ]
        
        for config_file in config_files:
            if config_file.exists():
                await self._scan_file_for_debug_config(config_file, debug_patterns)
    
    async def _scan_file_for_debug_config(self, file_path: Path, patterns: List[str]):
        """Scan file for debug configurations"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            for pattern in patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    
                    vuln = Vulnerability(
                        id=f"DEBUG-{hash(str(file_path) + str(line_num)) % 10000}",
                        title="Debug Mode Enabled",
                        severity=VulnerabilityLevel.HIGH,
                        description=f"Debug mode enabled in production file: {match.group()}",
                        location=f"{file_path.relative_to(self.project_root)}:{line_num}",
                        recommendation="Disable debug mode in production environments"
                    )
                    self.vulnerabilities.append(vuln)
                    
        except Exception as e:
            print(f"Warning: Could not scan {file_path}: {e}")
    
    async def _check_insecure_patterns(self):
        """Check for insecure coding patterns"""
        print("🔍 Checking for insecure patterns...")
        
        insecure_patterns = {
            'sql_injection': [
                r'\.execute\s*\(\s*["\'].+%s',
                r'\.format\s*\(.+\).+execute',
                r'f["\'].+\{.+\}.+execute'
            ],
            'command_injection': [
                r'os\.system\s*\(',
                r'subprocess\.call\s*\(',
                r'eval\s*\(',
                r'exec\s*\('
            ],
            'weak_crypto': [
                r'hashlib\.md5',
                r'hashlib\.sha1',
                r'random\.random\(\)',
                r'random\.choice\('
            ]
        }
        
        backend_dir = self.project_root / "backend"
        if backend_dir.exists():
            for py_file in backend_dir.rglob("*.py"):
                await self._scan_file_for_insecure_patterns(py_file, insecure_patterns)
    
    async def _scan_file_for_insecure_patterns(self, file_path: Path, patterns: Dict[str, List[str]]):
        """Scan file for insecure patterns"""
        try:
            # Skip virtual environment files
            if 'venv' in str(file_path) or 'env' in str(file_path):
                return
                
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            for category, pattern_list in patterns.items():
                for pattern in pattern_list:
                    matches = re.finditer(pattern, content, re.IGNORECASE)
                    for match in matches:
                        line_num = content[:match.start()].count('\n') + 1
                        
                        severity = VulnerabilityLevel.HIGH if category in ['sql_injection', 'command_injection'] else VulnerabilityLevel.MEDIUM
                        
                        vuln = Vulnerability(
                            id=f"PATTERN-{category.upper()}-{hash(str(file_path) + str(line_num)) % 10000}",
                            title=f"Insecure Pattern: {category.replace('_', ' ').title()}",
                            severity=severity,
                            description=f"Potentially insecure {category} pattern: {match.group()}",
                            location=f"{file_path.relative_to(self.project_root)}:{line_num}",
                            recommendation=self._get_pattern_recommendation(category)
                        )
                        self.vulnerabilities.append(vuln)
                        
        except Exception as e:
            print(f"Warning: Could not scan {file_path}: {e}")
    
    def _get_pattern_recommendation(self, pattern_type: str) -> str:
        """Get recommendation for insecure patterns"""
        recommendations = {
            'sql_injection': 'Use parameterized queries or ORM with proper escaping',
            'command_injection': 'Avoid system calls with user input; use safer alternatives',
            'weak_crypto': 'Use cryptographically secure algorithms (SHA-256, bcrypt, etc.)'
        }
        return recommendations.get(pattern_type, 'Follow secure coding best practices')
    
    async def _check_authentication_issues(self):
        """Check authentication implementation for issues"""
        print("🔍 Checking authentication implementation...")
        
        auth_file = self.project_root / "backend" / "core" / "enterprise_auth.py"
        if auth_file.exists():
            await self._analyze_auth_implementation(auth_file)
    
    async def _analyze_auth_implementation(self, auth_file: Path):
        """Analyze authentication implementation"""
        try:
            with open(auth_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for common auth issues
            auth_checks = [
                {
                    'pattern': r'JWT_SECRET_KEY\s*=\s*["\'][^"\']{1,20}["\']',
                    'issue': 'Weak JWT Secret',
                    'severity': VulnerabilityLevel.HIGH,
                    'recommendation': 'Use a strong, randomly generated JWT secret (at least 32 characters)'
                },
                {
                    'pattern': r'bcrypt\.hashpw\(.+rounds\s*=\s*[1-9][^0-9]',
                    'issue': 'Weak Bcrypt Rounds',
                    'severity': VulnerabilityLevel.MEDIUM,
                    'recommendation': 'Use at least 12 rounds for bcrypt hashing'
                },
                {
                    'pattern': r'expires_delta.*timedelta\(minutes\s*=\s*[0-9]{3,}',
                    'issue': 'Long Token Expiration',
                    'severity': VulnerabilityLevel.MEDIUM,
                    'recommendation': 'Use shorter token expiration times (15-30 minutes for access tokens)'
                }
            ]
            
            for check in auth_checks:
                matches = re.finditer(check['pattern'], content, re.IGNORECASE)
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    
                    vuln = Vulnerability(
                        id=f"AUTH-{check['issue'].replace(' ', '_').upper()}-{line_num}",
                        title=check['issue'],
                        severity=check['severity'],
                        description=f"Authentication issue: {match.group()}",
                        location=f"{auth_file.relative_to(self.project_root)}:{line_num}",
                        recommendation=check['recommendation']
                    )
                    self.vulnerabilities.append(vuln)
                    
        except Exception as e:
            print(f"Warning: Could not analyze auth file: {e}")
    
    async def _check_server_availability(self) -> bool:
        """Check if target server is available"""
        try:
            response = requests.get(f"{self.target_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    async def _run_api_security_tests(self):
        """Run basic API security tests"""
        print("🔍 Running API security tests...")
        
        # Test basic security headers
        await self._test_security_headers()
        
        # Test authentication bypass
        await self._test_auth_bypass()
        
        # Test rate limiting
        await self._test_rate_limiting()
    
    async def _test_security_headers(self):
        """Test for security headers"""
        try:
            response = requests.get(f"{self.target_url}/health", timeout=5)
            
            required_headers = {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age'
            }
            
            for header, expected in required_headers.items():
                if header not in response.headers:
                    vuln = Vulnerability(
                        id=f"HEADER-MISSING-{header.replace('-', '_').upper()}",
                        title=f"Missing Security Header: {header}",
                        severity=VulnerabilityLevel.MEDIUM,
                        description=f"Security header {header} is not set",
                        location="/health endpoint",
                        recommendation=f"Add {header}: {expected} header to all responses"
                    )
                    self.vulnerabilities.append(vuln)
                elif expected not in response.headers[header]:
                    vuln = Vulnerability(
                        id=f"HEADER-WEAK-{header.replace('-', '_').upper()}",
                        title=f"Weak Security Header: {header}",
                        severity=VulnerabilityLevel.LOW,
                        description=f"Security header {header} has weak value: {response.headers[header]}",
                        location="/health endpoint",
                        recommendation=f"Strengthen {header} header value to include {expected}"
                    )
                    self.vulnerabilities.append(vuln)
                    
        except Exception as e:
            print(f"Warning: Could not test security headers: {e}")
    
    async def _test_auth_bypass(self):
        """Test for authentication bypass"""
        try:
            # Try accessing protected endpoints without authentication
            protected_endpoints = [
                "/api/fl/experiments",
                "/api/datasets/list",
                "/api/admin/users"
            ]
            
            for endpoint in protected_endpoints:
                try:
                    response = requests.get(f"{self.target_url}{endpoint}", timeout=5)
                    
                    if response.status_code == 200:
                        vuln = Vulnerability(
                            id=f"AUTH-BYPASS-{endpoint.replace('/', '_').upper()}",
                            title="Authentication Bypass",
                            severity=VulnerabilityLevel.CRITICAL,
                            description=f"Protected endpoint {endpoint} accessible without authentication",
                            location=endpoint,
                            recommendation="Implement proper authentication middleware for all protected endpoints",
                            exploitable=True
                        )
                        self.vulnerabilities.append(vuln)
                        
                except requests.exceptions.RequestException:
                    pass  # Endpoint might not exist, which is fine
                    
        except Exception as e:
            print(f"Warning: Could not test auth bypass: {e}")
    
    async def _test_rate_limiting(self):
        """Test rate limiting implementation"""
        try:
            endpoint = f"{self.target_url}/api/auth/login"
            
            # Send rapid requests
            responses = []
            for i in range(10):
                try:
                    response = requests.post(
                        endpoint,
                        json={"username": f"test{i}", "password": "test"},
                        timeout=2
                    )
                    responses.append(response.status_code)
                except:
                    break
            
            # Check if any rate limiting occurred
            rate_limited = any(status == 429 for status in responses)
            
            if not rate_limited and len(responses) >= 8:
                vuln = Vulnerability(
                    id="RATE-LIMIT-MISSING",
                    title="Missing Rate Limiting",
                    severity=VulnerabilityLevel.MEDIUM,
                    description="No rate limiting detected on authentication endpoint",
                    location="/api/auth/login",
                    recommendation="Implement rate limiting to prevent brute force attacks"
                )
                self.vulnerabilities.append(vuln)
                
        except Exception as e:
            print(f"Warning: Could not test rate limiting: {e}")
    
    def _generate_security_report(self) -> Dict[str, Any]:
        """Generate security report"""
        total_vulns = len(self.vulnerabilities)
        
        severity_counts = {severity.value: 0 for severity in VulnerabilityLevel}
        for vuln in self.vulnerabilities:
            severity_counts[vuln.severity.value] += 1
        
        # Calculate security score
        security_score = self._calculate_security_score(severity_counts, total_vulns)
        risk_level = self._determine_risk_level(severity_counts)
        
        report = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "scanner_version": "simplified-1.0",
                "target_url": self.target_url,
                "project_root": str(self.project_root)
            },
            "executive_summary": {
                "total_vulnerabilities": total_vulns,
                "security_score": security_score,
                "risk_level": risk_level,
                "deployment_ready": severity_counts["critical"] == 0 and severity_counts["high"] <= 2
            },
            "vulnerability_breakdown": {
                "by_severity": severity_counts
            },
            "detailed_findings": [asdict(vuln) for vuln in self.vulnerabilities],
            "recommendations": self._generate_recommendations(severity_counts)
        }
        
        return report
    
    def _calculate_security_score(self, severity_counts: dict, total_vulns: int) -> float:
        """Calculate security score"""
        if total_vulns == 0:
            return 100.0
        
        weights = {"critical": 40, "high": 20, "medium": 10, "low": 5, "info": 1}
        total_weight = sum(severity_counts[sev] * weights[sev] for sev in weights)
        max_possible = total_vulns * weights["critical"]
        
        return max(0, 100 - (total_weight / max_possible * 100)) if max_possible > 0 else 100
    
    def _determine_risk_level(self, severity_counts: dict) -> str:
        """Determine risk level"""
        if severity_counts["critical"] > 0:
            return "CRITICAL"
        elif severity_counts["high"] >= 3:
            return "HIGH"
        elif severity_counts["high"] > 0 or severity_counts["medium"] >= 5:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _generate_recommendations(self, severity_counts: dict) -> List[str]:
        """Generate security recommendations"""
        recommendations = []
        
        if severity_counts["critical"] > 0:
            recommendations.append("🚨 IMMEDIATE: Fix all critical vulnerabilities before deployment")
        
        if severity_counts["high"] > 0:
            recommendations.append("⚠️  HIGH: Address high-severity issues within 7 days")
        
        recommendations.extend([
            "🔒 Implement comprehensive input validation",
            "🛡️  Enable all security headers",
            "📊 Set up security monitoring and alerting",
            "🔄 Schedule regular security scans"
        ])
        
        return recommendations

async def main():
    """Main entry point"""
    project_root = sys.argv[1] if len(sys.argv) > 1 else "."
    target_url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8000"
    
    scanner = SimplifiedSecurityScanner(project_root, target_url)
    
    try:
        report = await scanner.run_security_scan()
        
        # Save report
        output_file = "simplified_security_report.json"
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        # Print summary
        print(f"\n{'='*80}")
        print("🛡️  ENTERPRISE SECURITY SCAN COMPLETE")
        print(f"{'='*80}")
        print(f"Security Score: {report['executive_summary']['security_score']:.1f}/100")
        print(f"Risk Level: {report['executive_summary']['risk_level']}")
        print(f"Total Vulnerabilities: {report['executive_summary']['total_vulnerabilities']}")
        print(f"Deployment Ready: {'✅ YES' if report['executive_summary']['deployment_ready'] else '❌ NO'}")
        
        print(f"\nBreakdown by Severity:")
        for severity, count in report['vulnerability_breakdown']['by_severity'].items():
            if count > 0:
                print(f"  {severity.upper()}: {count}")
        
        print(f"\nDetailed report saved to: {output_file}")
        
        # Return appropriate exit code
        if not report['executive_summary']['deployment_ready']:
            print(f"\n❌ CRITICAL ISSUES FOUND - Deployment blocked!")
            return 1
        else:
            print(f"\n✅ Security scan passed - Ready for deployment")
            return 0
            
    except Exception as e:
        print(f"❌ Security scan failed: {e}")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)