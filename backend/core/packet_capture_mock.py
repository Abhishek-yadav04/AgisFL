"""Mock packet capture for when Scapy is not available"""

import time
import random
from typing import Dict, List, Any
from dataclasses import dataclass, asdict

@dataclass
class MockPacketInfo:
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

class MockPacketCapture:
    def __init__(self):
        self.is_capturing = False
        self.captured_packets: List[MockPacketInfo] = []
        self.interface = "Mock Interface"
        
    def get_network_interfaces(self) -> List[str]:
        return ["Ethernet", "Wi-Fi", "Local Area Connection"]
    
    def select_best_interface(self) -> str:
        return "Ethernet"
    
    def start_capture(self, interface: str = None):
        import logging
        logger = logging.getLogger("core.packet_capture_mock")
        self.is_capturing = True
        self.interface = interface or "Ethernet"
        logger.info(f"Mock packet capture started on {self.interface}")
        # Generate some mock packets
        self._generate_mock_packets()
        return True
    
    def stop_capture(self):
        """Stop mock packet capture with proper status tracking"""
        import logging
        logger = logging.getLogger("core.packet_capture_mock")
        was_capturing = self.is_capturing
        self.is_capturing = False
        
        if was_capturing:
            logger.info(f"Mock packet capture stopped successfully. Interface: {self.interface}")
        else:
            logger.info("Mock packet capture was already stopped")
        
        return True
    
    def _generate_mock_packets(self):
        """Generate realistic mock packets"""
        mock_ips = ["192.168.1.1", "10.0.0.1", "172.16.0.1", "8.8.8.8", "1.1.1.1"]
        protocols = ["TCP", "UDP", "ICMP"]
        
        for i in range(50):
            packet = MockPacketInfo(
                timestamp=time.time() - random.randint(0, 3600),
                src_ip=random.choice(mock_ips),
                dst_ip=random.choice(mock_ips),
                src_port=random.randint(1024, 65535),
                dst_port=random.choice([80, 443, 22, 21, 25, 53]),
                protocol=random.choice(protocols),
                size=random.randint(64, 1500),
                payload=f"Mock payload {i}",
                is_malicious=random.random() < 0.1,  # 10% malicious
                threat_type="mock_threat" if random.random() < 0.1 else "",
                threat_score=random.randint(0, 100) if random.random() < 0.1 else 0
            )
            self.captured_packets.append(packet)
    
    def get_recent_packets(self, limit: int = 100) -> List[Dict]:
        if not self.captured_packets:
            self._generate_mock_packets()
        recent = self.captured_packets[-limit:] if self.captured_packets else []
        return [asdict(packet) for packet in recent]
    
    def get_malicious_packets(self, limit: int = 50) -> List[Dict]:
        if not self.captured_packets:
            self._generate_mock_packets()
        malicious = [packet for packet in self.captured_packets if packet.is_malicious]
        recent_malicious = malicious[-limit:] if malicious else []
        return [asdict(packet) for packet in recent_malicious]
    
    def get_stats(self) -> Dict:
        if not self.captured_packets:
            self._generate_mock_packets()
            
        total_packets = len(self.captured_packets)
        malicious_count = sum(1 for p in self.captured_packets if p.is_malicious)
        
        return {
            "is_capturing": self.is_capturing,
            "interface": self.interface,
            "total_packets": total_packets,
            "malicious_packets": malicious_count,
            "detection_rate": f"{(malicious_count/total_packets*100):.1f}%" if total_packets > 0 else "0%",
            "scapy_available": False,
            "mock_mode": True,
            "protocol_distribution": {"TCP": 30, "UDP": 15, "ICMP": 5},
            "threat_types": {"mock_threat": malicious_count},
            "top_sources": {"192.168.1.1": 20, "10.0.0.1": 15},
            "top_destinations": {"8.8.8.8": 25, "1.1.1.1": 10}
        }

# Global mock instance
mock_packet_capture = MockPacketCapture()