#!/usr/bin/env python3
"""
AgisFL Performance Monitor
Real-time performance tracking and optimization
"""

import asyncio
import time
import psutil
import aiohttp
import logging
from datetime import datetime
from typing import Dict, List, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgisFlPerformanceMonitor:
    """Real-time performance monitoring for AgisFL"""
    
    def __init__(self):
        self.monitoring = False
        self.api_base = "http://localhost:8000"
        self.performance_data = []
        self.api_response_times = {}
        
    async def start_monitoring(self):
        """Start comprehensive performance monitoring"""
        self.monitoring = True
        logger.info("AgisFL Performance Monitor started")
        
        # Start monitoring tasks
        tasks = [
            asyncio.create_task(self._monitor_system_resources()),
            asyncio.create_task(self._monitor_api_performance()),
            asyncio.create_task(self._monitor_fl_engine()),
            asyncio.create_task(self._generate_reports())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            logger.info("Performance monitoring stopped")
        finally:
            self.monitoring = False
    
    async def _monitor_system_resources(self):
        """Monitor system resource usage"""
        while self.monitoring:
            try:
                cpu_percent = psutil.cpu_percent(interval=1)
                memory = psutil.virtual_memory()
                
                resource_data = {
                    "timestamp": datetime.now().isoformat(),
                    "cpu_usage": cpu_percent,
                    "memory_usage": memory.percent,
                    "memory_available_gb": memory.available / (1024**3),
                    "processes": len(psutil.pids())
                }
                
                self.performance_data.append(resource_data)
                
                # Keep only last 1000 entries
                if len(self.performance_data) > 1000:
                    self.performance_data = self.performance_data[-1000:]
                
                # Alert on high usage
                if cpu_percent > 80:
                    logger.warning(f"HIGH CPU USAGE: {cpu_percent}%")
                
                if memory.percent > 85:
                    logger.warning(f"HIGH MEMORY USAGE: {memory.percent}%")
                
                await asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                logger.error(f"Resource monitoring error: {e}")
                await asyncio.sleep(10)
    
    async def _monitor_api_performance(self):
        """Monitor API endpoint performance"""
        endpoints = [
            "/api/fl/status",
            "/api/fl/overview",
            "/health",
            "/api/dashboard/simple-status",
            "/api/advanced-fl/engine/metrics"
        ]
        
        while self.monitoring:
            try:
                async with aiohttp.ClientSession() as session:
                    for endpoint in endpoints:
                        start_time = time.time()
                        
                        try:
                            async with session.get(
                                f"{self.api_base}{endpoint}",
                                timeout=aiohttp.ClientTimeout(total=10)
                            ) as response:
                                response_time = (time.time() - start_time) * 1000  # ms
                                
                                if endpoint not in self.api_response_times:
                                    self.api_response_times[endpoint] = []
                                
                                self.api_response_times[endpoint].append({
                                    "timestamp": datetime.now().isoformat(),
                                    "response_time_ms": response_time,
                                    "status_code": response.status
                                })
                                
                                # Keep only last 100 measurements per endpoint
                                if len(self.api_response_times[endpoint]) > 100:
                                    self.api_response_times[endpoint] = self.api_response_times[endpoint][-100:]
                                
                                # Alert on slow responses
                                if response_time > 1000:  # 1 second
                                    logger.warning(f"SLOW API RESPONSE: {endpoint} took {response_time:.1f}ms")
                                elif response_time > 50:  # 50ms target
                                    logger.info(f"API response above target: {endpoint} took {response_time:.1f}ms")
                                
                        except Exception as e:
                            logger.error(f"API monitoring error for {endpoint}: {e}")
                
                await asyncio.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logger.error(f"API monitoring error: {e}")
                await asyncio.sleep(30)
    
    async def _monitor_fl_engine(self):
        """Monitor FL engine performance"""
        while self.monitoring:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(f"{self.api_base}/api/fl/status") as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            # Log FL engine status
                            if data.get("is_training"):
                                logger.info(f"FL Training: Round {data.get('current_round', 0)}/{data.get('total_rounds', 0)}")
                            
                            # Check for performance issues
                            metrics = data.get("metrics", {})
                            if metrics.get("accuracy", 0) < 0.5:
                                logger.warning("FL model accuracy is low")
                
                await asyncio.sleep(15)  # Check every 15 seconds
                
            except Exception as e:
                logger.error(f"FL engine monitoring error: {e}")
                await asyncio.sleep(30)
    
    async def _generate_reports(self):
        """Generate periodic performance reports"""
        while self.monitoring:
            try:
                await asyncio.sleep(60)  # Generate report every minute
                
                report = self.get_performance_report()
                
                # Log summary every 5 minutes
                if len(self.performance_data) % 60 == 0:  # Every 5 minutes (60 * 5s intervals)
                    logger.info("=== PERFORMANCE REPORT ===")
                    logger.info(f"System: CPU {report['system']['avg_cpu']:.1f}% | Memory {report['system']['avg_memory']:.1f}%")
                    
                    if report['api']['endpoints']:
                        fastest = min(report['api']['endpoints'].values(), key=lambda x: x['avg_response_time'])
                        slowest = max(report['api']['endpoints'].values(), key=lambda x: x['avg_response_time'])
                        logger.info(f"API: Fastest {fastest['avg_response_time']:.1f}ms | Slowest {slowest['avg_response_time']:.1f}ms")
                    
                    logger.info("========================")
                
            except Exception as e:
                logger.error(f"Report generation error: {e}")
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "system": {},
            "api": {"endpoints": {}},
            "summary": {}
        }
        
        # System performance
        if self.performance_data:
            recent_data = self.performance_data[-12:]  # Last minute (12 * 5s)
            report["system"] = {
                "avg_cpu": sum(d["cpu_usage"] for d in recent_data) / len(recent_data),
                "avg_memory": sum(d["memory_usage"] for d in recent_data) / len(recent_data),
                "samples": len(recent_data)
            }
        
        # API performance
        for endpoint, measurements in self.api_response_times.items():
            if measurements:
                recent_measurements = measurements[-6:]  # Last minute
                avg_response_time = sum(m["response_time_ms"] for m in recent_measurements) / len(recent_measurements)
                
                report["api"]["endpoints"][endpoint] = {
                    "avg_response_time": avg_response_time,
                    "samples": len(recent_measurements),
                    "target_met": avg_response_time < 50  # 50ms target
                }
        
        # Summary
        if report["api"]["endpoints"]:
            all_response_times = [ep["avg_response_time"] for ep in report["api"]["endpoints"].values()]
            report["summary"] = {
                "overall_api_performance": sum(all_response_times) / len(all_response_times),
                "endpoints_meeting_target": sum(1 for ep in report["api"]["endpoints"].values() if ep["target_met"]),
                "total_endpoints": len(report["api"]["endpoints"])
            }
        
        return report
    
    def stop_monitoring(self):
        """Stop performance monitoring"""
        self.monitoring = False
        logger.info("Performance monitoring stopped")

async def main():
    """Main monitoring function"""
    monitor = AgisFlPerformanceMonitor()
    
    try:
        await monitor.start_monitoring()
    except KeyboardInterrupt:
        monitor.stop_monitoring()
        
        # Print final report
        print("\n" + "="*50)
        print("FINAL PERFORMANCE REPORT")
        print("="*50)
        
        report = monitor.get_performance_report()
        
        if report["system"]:
            print(f"System Performance:")
            print(f"  Average CPU: {report['system']['avg_cpu']:.1f}%")
            print(f"  Average Memory: {report['system']['avg_memory']:.1f}%")
        
        if report["api"]["endpoints"]:
            print(f"\nAPI Performance:")
            for endpoint, data in report["api"]["endpoints"].items():
                status = "✓" if data["target_met"] else "✗"
                print(f"  {status} {endpoint}: {data['avg_response_time']:.1f}ms")
        
        if report["summary"]:
            print(f"\nSummary:")
            print(f"  Overall API Performance: {report['summary']['overall_api_performance']:.1f}ms")
            print(f"  Endpoints Meeting Target: {report['summary']['endpoints_meeting_target']}/{report['summary']['total_endpoints']}")

if __name__ == "__main__":
    asyncio.run(main())
