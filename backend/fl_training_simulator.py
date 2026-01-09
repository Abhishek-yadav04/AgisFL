"""
FL Training Simulator
Simulates actual federated learning training
"""

import asyncio
import random
from datetime import datetime, timezone

class FLTrainingSimulator:
    def __init__(self):
        self.is_running = False
        self.task = None
    
    async def start_training(self, experiment_id: str, rounds: int = 10):
        """Start FL training simulation"""
        if self.is_running:
            return False
        
        from fl_state_manager import fl_state_manager
        self.is_running = True
        fl_state_manager.update_training_status(True, experiment_id)
        fl_state_manager.state["total_rounds"] = rounds
        fl_state_manager.state["active_clients"] = 5
        fl_state_manager.save_state()
        
        # Start background training task
        self.task = asyncio.create_task(self._training_loop(rounds))
        return True
    
    async def stop_training(self):
        """Stop FL training simulation"""
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        
        from fl_state_manager import fl_state_manager
        fl_state_manager.update_training_status(False)
        return True
    
    async def _training_loop(self, total_rounds: int):
        """Main training simulation loop"""
        try:
            from fl_state_manager import fl_state_manager
            for round_num in range(1, total_rounds + 1):
                if not self.is_running:
                    break
                
                # Simulate training round
                await asyncio.sleep(3)  # 3 seconds per round
                
                # Simulate accuracy improvement
                base_accuracy = 0.6
                improvement = (round_num / total_rounds) * 0.3  # Up to 30% improvement
                noise = random.uniform(-0.02, 0.02)  # Small random noise
                accuracy = min(0.95, base_accuracy + improvement + noise)
                
                # Update both regular and advanced state
                fl_state_manager.update_round(round_num, accuracy)
                fl_state_manager.update_advanced_round(round_num, accuracy)
                
                print(f"FL Training - Round {round_num}/{total_rounds}, Accuracy: {accuracy:.3f}")
            
            # Training completed
            if self.is_running:
                fl_state_manager.update_training_status(False)
                fl_state_manager.update_advanced_training_status(False)
                print("FL Training completed successfully")
            
        except asyncio.CancelledError:
            print("FL Training cancelled")
        except Exception as e:
            print(f"FL Training error: {e}")
            from fl_state_manager import fl_state_manager
            fl_state_manager.update_training_status(False)
            fl_state_manager.update_advanced_training_status(False)
        finally:
            self.is_running = False

# Global simulator instance
fl_simulator = FLTrainingSimulator()