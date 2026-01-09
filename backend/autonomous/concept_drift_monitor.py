"""Mock Concept Drift Monitor for AutoFL"""

class ConceptDriftMonitor:
    def __init__(self):
        pass
    
    async def start_monitoring(self, config: dict):
        return {"status": "monitoring", "config": config}