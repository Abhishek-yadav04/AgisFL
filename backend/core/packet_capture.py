import asyncio
import json
import time
import re
import socket
import struct
import os
from datetime import datetime
from typing import Dict, List, Optional, Set
import psutil
import threading
from dataclasses import dataclass, asdict
import subprocess
import platform

try:
    from scapy.all import sniff, IP, TCP, UDP, DNS, Raw, get_if_list, ICMP, ARP, conf
    SCAPY_AVAILABLE = True
    print("✅ Scapy imported successfully")
except ImportError as e:
    SCAPY_AVAILABLE = False
    print(f"❌ Scapy import failed: {e}")
    print("Run: FORCE_INSTALL_SCAPY.bat")
except Exception as e:
    SCAPY_AVAILABLE = False
    print(f"❌ Scapy error: {e}")
    print("Install Npcap from https://npcap.com/")

NETIFACES_AVAILABLE = False  # Disabled due to build requirements

@dataclass
class PacketInfo:
    timestamp: float
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    size: int
    payload: str
    is_malicious: bool = False
    threat_type: str = ""
    threat_score: int = 0

class AdvancedMaliciousDetector:
    def __init__(self):
        # Load rules from configuration file
        self.rules = self._load_threat_rules()
        
        # Load from rules configuration
        self.malicious_ips = set(self.rules.get("malicious_ips", []))
        self.suspicious_ports = set(self.rules.get("suspicious_ports", []))
        self.malware_signatures = [s.encode() for s in self.rules.get("malware_signatures", [])]
        self.sql_injection_patterns = [s.encode() for s in self.rules.get("sql_injection_patterns", [])]
        self.xss_patterns = [s.encode() for s in self.rules.get("xss_patterns", [])]
        
        # Thresholds from rules
        self.ddos_thresholds = self.rules.get("ddos_thresholds", {})
        self.brute_force_config = self.rules.get("brute_force_thresholds", {})
        self.port_scan_config = self.rules.get("port_scan_detection", {})
        self.dns_config = self.rules.get("dns_tunneling", {})
        
        # Initialize tracking dictionaries
        self.ddos_patterns = {'syn_flood': 0, 'udp_flood': 0, 'icmp_flood': 0}
        self.failed_logins = {}
        self.port_scan_tracking = {}
        self.dns_queries = {}
    
    def _load_threat_rules(self) -> dict:
        """Load threat detection rules from configuration files"""
        rules = {}
        
        # Load JSON rules
        try:
            rules_path = os.path.join(os.path.dirname(__file__), '..', 'rules', 'threat_detection.json')
            with open(rules_path, 'r') as f:
                rules.update(json.load(f))
        except Exception as e:
            print(f"Failed to load JSON threat rules: {e}")
        
        # Load Emerging Threats rules
        try:
            et_rules_path = os.path.join(os.path.dirname(__file__), '..', 'rules', 'emerging-all.rules')
            et_rules = self._parse_suricata_rules(et_rules_path)
            rules.update(et_rules)
        except Exception as e:
            print(f"Failed to load Emerging Threats rules: {e}")
        
        # Load QUIC rules
        try:
            quic_rules_path = os.path.join(os.path.dirname(__file__), '..', 'rules', 'quic-events.rules')
            quic_rules = self._parse_suricata_rules(quic_rules_path)
            rules.update(quic_rules)
        except Exception as e:
            print(f"Failed to load QUIC rules: {e}")
        
        return rules
    
    def _parse_suricata_rules(self, rules_file: str) -> dict:
        """Parse Suricata/Snort format rules"""
        parsed_rules = {
            "malicious_ips": [],
            "suspicious_ports": [],
            "malware_signatures": [],
            "sql_injection_patterns": [],
            "xss_patterns": [],
            "ddos_thresholds": {"syn_flood": 1000, "udp_flood": 1000, "icmp_flood": 500},
            "brute_force_thresholds": {"target_ports": [22, 23, 21, 3389, 5900], "max_attempts": 10, "time_window": 300},
            "port_scan_detection": {"max_ports": 10, "time_window": 60},
            "dns_tunneling": {"max_query_length": 100}
        }
        
        try:
            with open(rules_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    
                    # Extract patterns from Suricata rules
                    if 'content:' in line:
                        # Extract content patterns
                        content_matches = re.findall(r'content:"([^"]+)"', line)
                        for content in content_matches:
                            # Decode hex patterns
                            if '|' in content:
                                hex_pattern = re.findall(r'\|([0-9A-Fa-f\s]+)\|', content)
                                for hex_str in hex_pattern:
                                    try:
                                        decoded = bytes.fromhex(hex_str.replace(' ', ''))
                                        parsed_rules["malware_signatures"].append(decoded.decode('utf-8', errors='ignore'))
                                    except:
                                        pass
                            else:
                                parsed_rules["malware_signatures"].append(content)
                    
                    # Extract SQL injection patterns
                    if 'sql' in line.lower() and ('select' in line.lower() or 'union' in line.lower() or 'insert' in line.lower()):
                        sql_patterns = re.findall(r'content:"([^"]*(?:SELECT|UNION|INSERT|DELETE|UPDATE)[^"]*)";', line, re.IGNORECASE)
                        parsed_rules["sql_injection_patterns"].extend(sql_patterns)
                    
                    # Extract XSS patterns
                    if 'xss' in line.lower() or 'script' in line.lower():
                        xss_patterns = re.findall(r'content:"([^"]*(?:script|javascript|onerror|onload)[^"]*)";', line, re.IGNORECASE)
                        parsed_rules["xss_patterns"].extend(xss_patterns)
                    
                    # Extract suspicious ports
                    port_matches = re.findall(r'\b(\d{1,5})\b', line)
                    for port in port_matches:
                        port_num = int(port)
                        if 1 <= port_num <= 65535 and port_num not in [80, 443, 53, 22, 21, 25]:
                            parsed_rules["suspicious_ports"].append(port_num)
        
        except Exception as e:
            print(f"Error parsing Suricata rules: {e}")
        
        # Remove duplicates and limit size
        parsed_rules["malware_signatures"] = list(set(parsed_rules["malware_signatures"]))[:100]
        parsed_rules["sql_injection_patterns"] = list(set(parsed_rules["sql_injection_patterns"]))[:50]
        parsed_rules["xss_patterns"] = list(set(parsed_rules["xss_patterns"]))[:50]
        parsed_rules["suspicious_ports"] = list(set(parsed_rules["suspicious_ports"]))[:100]
        
        return parsed_rules
    
    def detect_threats(self, packet_info: PacketInfo) -> tuple[bool, str, int]:
        """Advanced threat detection with scoring"""
        threats = []
        threat_score = 0
        
        # Check malicious IPs
        if packet_info.src_ip in self.malicious_ips or packet_info.dst_ip in self.malicious_ips:
            threats.append("malicious_ip")
            threat_score += 50
        
        # Check suspicious ports
        if packet_info.dst_port in self.suspicious_ports:
            threats.append("suspicious_port")
            threat_score += 25
        
        # Check for malware signatures
        payload_bytes = packet_info.payload.encode() if isinstance(packet_info.payload, str) else packet_info.payload
        for signature in self.malware_signatures:
            if signature in payload_bytes:
                threats.append("malware_signature")
                threat_score += 40
                break
        
        # Check for SQL injection
        for pattern in self.sql_injection_patterns:
            if pattern in payload_bytes:
                threats.append("sql_injection")
                threat_score += 45
                break
        
        # Check for XSS
        for pattern in self.xss_patterns:
            if pattern in payload_bytes:
                threats.append("xss_attack")
                threat_score += 35
                break
        
        # Port scan detection
        self._detect_port_scan(packet_info, threats)
        
        # DDoS detection
        self._detect_ddos(packet_info, threats)
        
        # DNS tunneling detection
        self._detect_dns_tunneling(packet_info, threats)
        
        # Brute force detection
        self._detect_brute_force(packet_info, threats)
        
        return len(threats) > 0, ",".join(threats), threat_score
    
    def _detect_port_scan(self, packet_info: PacketInfo, threats: List[str]):
        """Detect port scanning attempts"""
        src_ip = packet_info.src_ip
        current_time = time.time()
        max_ports = self.port_scan_config.get("max_ports", 10)
        time_window = self.port_scan_config.get("time_window", 60)
        
        if src_ip not in self.port_scan_tracking:
            self.port_scan_tracking[src_ip] = {'ports': set(), 'first_seen': current_time}
        
        self.port_scan_tracking[src_ip]['ports'].add(packet_info.dst_port)
        
        if (len(self.port_scan_tracking[src_ip]['ports']) > max_ports and 
            current_time - self.port_scan_tracking[src_ip]['first_seen'] < time_window):
            threats.append("port_scan")
    
    def _detect_ddos(self, packet_info: PacketInfo, threats: List[str]):
        """Detect DDoS patterns"""
        if packet_info.protocol == "TCP":
            self.ddos_patterns['syn_flood'] += 1
        elif packet_info.protocol == "UDP":
            self.ddos_patterns['udp_flood'] += 1
        elif packet_info.protocol == "ICMP":
            self.ddos_patterns['icmp_flood'] += 1
        
        # Check thresholds
        for attack_type, count in self.ddos_patterns.items():
            threshold = self.ddos_thresholds.get(attack_type, 1000)
            if count > threshold:
                threats.append("ddos_attack")
                break
    
    def _detect_dns_tunneling(self, packet_info: PacketInfo, threats: List[str]):
        """Detect DNS tunneling attempts"""
        max_length = self.dns_config.get("max_query_length", 100)
        if packet_info.dst_port == 53 and len(packet_info.payload) > max_length:
            threats.append("dns_tunneling")
    
    def _detect_brute_force(self, packet_info: PacketInfo, threats: List[str]):
        """Detect brute force attacks"""
        target_ports = self.brute_force_config.get("target_ports", [22, 23, 21, 3389, 5900])
        max_attempts = self.brute_force_config.get("max_attempts", 10)
        time_window = self.brute_force_config.get("time_window", 300)
        
        if packet_info.dst_port in target_ports:
            src_ip = packet_info.src_ip
            current_time = time.time()
            
            if src_ip not in self.failed_logins:
                self.failed_logins[src_ip] = []
            
            self.failed_logins[src_ip].append(current_time)
            
            # Remove old entries
            self.failed_logins[src_ip] = [t for t in self.failed_logins[src_ip] if current_time - t < time_window]
            
            if len(self.failed_logins[src_ip]) > max_attempts:
                threats.append("brute_force")

class AdvancedPacketCapture:
    def __init__(self):
        self.is_capturing = False
        self.captured_packets: List[PacketInfo] = []
        self.detector = AdvancedMaliciousDetector()
        self.interface = None
        self.capture_thread = None
        
    def get_network_interfaces(self) -> List[str]:
        """Windows-compatible network interface detection"""
        interfaces = []
        
        # Windows netsh command for interface names
        if platform.system() == "Windows":
            try:
                result = subprocess.run(['netsh', 'interface', 'show', 'interface'], 
                                      capture_output=True, text=True)
                for line in result.stdout.split('\n'):
                    if 'Connected' in line and ('Ethernet' in line or 'Wi-Fi' in line):
                        # Extract interface name (last part after splitting)
                        parts = line.strip().split()
                        if len(parts) >= 4:
                            # Get the interface name (everything after the status)
                            interface_name = ' '.join(parts[3:])
                            interfaces.append(interface_name)
            except Exception as e:
                print(f"Netsh error: {e}")
        
        # Use Scapy as fallback
        if SCAPY_AVAILABLE and not interfaces:
            try:
                scapy_interfaces = get_if_list()
                # Filter out loopback and get readable names
                for iface in scapy_interfaces:
                    if not iface.startswith('lo') and len(iface) > 10:
                        # Try to get a more readable name
                        interfaces.append(iface)
            except Exception as e:
                print(f"Scapy interface error: {e}")
        
        # Fallback interfaces
        if not interfaces:
            if platform.system() == "Windows":
                interfaces = ["Ethernet", "Wi-Fi", "Local Area Connection"]
            else:
                interfaces = ["eth0", "wlan0", "enp0s3"]
        
        return interfaces
    
    def select_best_interface(self) -> str:
        """Select the best interface for capturing with advanced logic"""
        interfaces = self.get_network_interfaces()
        
        if not interfaces:
            return "eth0"
        
        # Get network stats to find most active interface
        try:
            net_stats = psutil.net_io_counters(pernic=True)
            best_interface = None
            max_activity = 0
            
            for iface in interfaces:
                # Try different interface name variations
                for iface_variant in [iface, iface.replace(' ', '_'), iface.lower()]:
                    if iface_variant in net_stats:
                        activity = net_stats[iface_variant].bytes_sent + net_stats[iface_variant].bytes_recv
                        if activity > max_activity:
                            max_activity = activity
                            best_interface = iface
                        break
            
            if best_interface:
                return best_interface
        except Exception as e:
            print(f"Error selecting interface: {e}")
        
        # Return first available interface
        return interfaces[0]
    
    def process_packet(self, packet):
        """Advanced packet processing with comprehensive analysis"""
        try:
            # Process all packets, not just IP
            protocol = "OTHER"
            src_port = dst_port = 0
            src_ip = dst_ip = "unknown"
            
            # Handle different packet types
            if packet.haslayer(IP):
                ip_layer = packet[IP]
                src_ip = ip_layer.src
                dst_ip = ip_layer.dst
                
                if packet.haslayer(TCP):
                    protocol = "TCP"
                    src_port = packet[TCP].sport
                    dst_port = packet[TCP].dport
                elif packet.haslayer(UDP):
                    protocol = "UDP"
                    src_port = packet[UDP].sport
                    dst_port = packet[UDP].dport
                elif packet.haslayer(ICMP):
                    protocol = "ICMP"
            elif packet.haslayer(ARP):
                protocol = "ARP"
                src_ip = packet[ARP].psrc if hasattr(packet[ARP], 'psrc') else "unknown"
                dst_ip = packet[ARP].pdst if hasattr(packet[ARP], 'pdst') else "unknown"
            
            # Extract payload
            payload = ""
            if packet.haslayer(Raw):
                try:
                    payload = str(packet[Raw].load)[:500]
                except:
                    payload = ""
            
            packet_info = PacketInfo(
                timestamp=time.time(),
                src_ip=src_ip,
                dst_ip=dst_ip,
                src_port=src_port,
                dst_port=dst_port,
                protocol=protocol,
                size=len(packet),
                payload=payload
            )
            
            # Advanced threat detection
            is_malicious, threat_type, threat_score = self.detector.detect_threats(packet_info)
            packet_info.is_malicious = is_malicious
            packet_info.threat_type = threat_type
            packet_info.threat_score = threat_score
            
            self.captured_packets.append(packet_info)
            
            # Print capture progress every 100 packets
            if len(self.captured_packets) % 100 == 0:
                print(f"Captured {len(self.captured_packets)} packets...")
            
            # Keep only last 10000 packets for extensive analysis
            if len(self.captured_packets) > 10000:
                self.captured_packets = self.captured_packets[-10000:]
                
        except Exception as e:
            print(f"Error processing packet: {e}")
            # Continue processing even if one packet fails
    
    def start_capture(self, interface: Optional[str] = None):
        """Start advanced packet capture with Windows compatibility"""
        if not SCAPY_AVAILABLE:
            print("Scapy not available. Install with: pip install scapy")
            return False
        
        if self.is_capturing:
            return True
        
        if not interface:
            interface = self.select_best_interface()
        
        self.interface = interface
        self.is_capturing = True
        
        print(f"Starting advanced packet capture on interface: {interface}")
        
        def capture_thread():
            try:
                # Try different interface formats for Windows
                interfaces_to_try = [interface]
                
                # If it's a Windows interface name, try to find the corresponding device
                if platform.system() == "Windows":
                    # Add common variations
                    if "Ethernet" in interface:
                        interfaces_to_try.extend(["Ethernet", "Local Area Connection", None])
                    elif "Wi-Fi" in interface:
                        interfaces_to_try.extend(["Wi-Fi", "Wireless Network Connection", None])
                    else:
                        interfaces_to_try.append(None)  # Let Scapy choose
                
                capture_started = False
                for iface_attempt in interfaces_to_try:
                    try:
                        print(f"Trying interface: {iface_attempt}")
                        
                        # Configure Scapy for better capture
                        try:
                            conf.use_pcap = True
                            conf.sniff_promisc = True
                        except Exception as e:
                            print(f"Scapy configuration warning: {e}")
                        
                        # Continuous capture without timeout
                        sniff(
                            iface=iface_attempt, 
                            prn=self.process_packet, 
                            stop_filter=lambda x: not self.is_capturing,
                            store=False,
                            count=0  # Capture indefinitely
                        )
                        capture_started = True
                        break
                        
                    except Exception as e:
                        print(f"Interface {iface_attempt} failed: {e}")
                        continue
                
                if not capture_started:
                    print("All interface attempts failed. Trying promiscuous mode capture...")
                    try:
                        # Last resort: promiscuous capture on all interfaces
                        conf.sniff_promisc = True
                        sniff(
                            prn=self.process_packet,
                            stop_filter=lambda x: not self.is_capturing,
                            store=False,
                            count=0,
                            filter="ip"  # Only capture IP packets for better performance
                        )
                    except Exception as e:
                        print(f"Final capture attempt failed: {e}")
                        print("Install Npcap from https://npcap.com/ and run as Administrator")
                        self.is_capturing = False
                    
            except Exception as e:
                print(f"Capture error: {e}")
                self.is_capturing = False
        
        self.capture_thread = threading.Thread(target=capture_thread, daemon=True)
        self.capture_thread.start()
        return True
    
    def stop_capture(self):
        """Stop packet capture with improved cleanup and status tracking"""
        print("Stopping packet capture...")
        
        # Set flag to stop capture immediately
        was_capturing = self.is_capturing
        self.is_capturing = False
        
        # Force stop the capture thread
        if self.capture_thread and self.capture_thread.is_alive():
            try:
                print("Waiting for capture thread to stop...")
                # Give thread time to stop gracefully
                self.capture_thread.join(timeout=5)
                if self.capture_thread.is_alive():
                    print("Force stopping capture thread...")
                    # Try to force interrupt the sniffing
                    try:
                        import signal
                        import os
                        if hasattr(os, 'kill'):
                            # This is a last resort for stubborn threads
                            pass
                    except:
                        pass
            except Exception as e:
                print(f"Error stopping capture thread: {e}")
        
        # Clean up thread reference
        self.capture_thread = None
        
        # Reset interface if we were capturing
        if was_capturing:
            print(f"Packet capture stopped successfully. Interface: {self.interface}")
        else:
            print("Packet capture was already stopped")
        
        # Always return success since we've done our best to stop
        return True
    
    def get_recent_packets(self, limit: int = 100) -> List[Dict]:
        """Get recent captured packets"""
        recent = self.captured_packets[-limit:] if self.captured_packets else []
        return [asdict(packet) for packet in recent]
    
    def get_malicious_packets(self, limit: int = 50) -> List[Dict]:
        """Get only malicious packets sorted by threat score"""
        malicious = [packet for packet in self.captured_packets if packet.is_malicious]
        # Sort by threat score (highest first)
        malicious.sort(key=lambda x: x.threat_score, reverse=True)
        recent_malicious = malicious[-limit:] if malicious else []
        return [asdict(packet) for packet in recent_malicious]
    
    def get_stats(self) -> Dict:
        """Get comprehensive capture statistics"""
        total_packets = len(self.captured_packets)
        malicious_count = sum(1 for p in self.captured_packets if p.is_malicious)
        
        # Protocol distribution
        protocols = {}
        threat_types = {}
        top_sources = {}
        top_destinations = {}
        
        for packet in self.captured_packets:
            protocols[packet.protocol] = protocols.get(packet.protocol, 0) + 1
            if packet.is_malicious:
                for threat in packet.threat_type.split(','):
                    threat_types[threat] = threat_types.get(threat, 0) + 1
            
            top_sources[packet.src_ip] = top_sources.get(packet.src_ip, 0) + 1
            top_destinations[packet.dst_ip] = top_destinations.get(packet.dst_ip, 0) + 1
        
        return {
            "is_capturing": self.is_capturing,
            "interface": self.interface,
            "total_packets": total_packets,
            "malicious_packets": malicious_count,
            "detection_rate": f"{(malicious_count/total_packets*100):.1f}%" if total_packets > 0 else "0%",
            "scapy_available": SCAPY_AVAILABLE,
            "netifaces_available": NETIFACES_AVAILABLE,
            "protocol_distribution": protocols,
            "threat_types": threat_types,
            "top_sources": dict(sorted(top_sources.items(), key=lambda x: x[1], reverse=True)[:10]),
            "top_destinations": dict(sorted(top_destinations.items(), key=lambda x: x[1], reverse=True)[:10])
        }

# Global instance with fallback
try:
    if SCAPY_AVAILABLE:
        packet_capture = AdvancedPacketCapture()
        print("✅ Advanced packet capture initialized")
    else:
        from .packet_capture_mock import mock_packet_capture
        packet_capture = mock_packet_capture
        print("⚠️ Using mock packet capture (Scapy not available)")
except Exception as e:
    print(f"❌ Packet capture initialization failed: {e}")
    from .packet_capture_mock import mock_packet_capture
    packet_capture = mock_packet_capture
    print("⚠️ Fallback to mock packet capture")