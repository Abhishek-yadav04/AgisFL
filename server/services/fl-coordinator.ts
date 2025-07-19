
import { storage } from "../storage";
import { InsertFLClient, InsertFLModel, InsertAlert } from "@shared/schema";

export class FederatedLearningCoordinator {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  private trainingRound = 156;
  private modelAccuracy = 0.973;
  private clients: Map<string, any> = new Map();
  private trainingHistory: any[] = [];

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🤖 Federated Learning coordinator started');
    
    this.interval = setInterval(async () => {
      await this.updateFLStatus();
    }, 30000);

    this.simulateTraining();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Federated Learning coordinator stopped');
  }

  private async simulateTraining() {
    const clientIds = ['client-001', 'client-002', 'client-003', 'client-004', 'client-005'];
    
    for (const clientId of clientIds) {
      const client: InsertFLClient = {
        clientId,
        status: Math.random() > 0.3 ? 'active' : 'inactive',
        modelAccuracy: Math.random() * 0.05 + 0.95,
        trainingRounds: Math.floor(Math.random() * 50 + 100),
        dataContribution: Math.floor(Math.random() * 2000 + 500),
      };

      this.clients.set(clientId, client);
      await storage.createOrUpdateFLClient(client);
    }

    // Initialize training history
    for (let i = 0; i < 10; i++) {
      this.trainingHistory.push({
        round: this.trainingRound - (10 - i),
        accuracy: 0.85 + (i * 0.01),
        participants: Math.floor(Math.random() * 3 + 3),
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString()
      });
    }
  }

  private async updateFLStatus() {
    try {
      if (Math.random() < 0.3) {
        this.trainingRound++;
        this.modelAccuracy = Math.min(0.999, this.modelAccuracy + Math.random() * 0.001);

        const clients = await storage.getFLClients();
        const activeClients = clients.filter(c => c.status === 'active');

        const model: InsertFLModel = {
          version: this.trainingRound,
          accuracy: this.modelAccuracy,
          participantCount: activeClients.length,
          trainingRound: this.trainingRound,
          modelData: { 
            weights: `model_weights_v${this.trainingRound}`,
            parameters: activeClients.length * 1000,
            updateSize: Math.floor(Math.random() * 500 + 100) + 'KB'
          },
        };

        await storage.createFLModel(model);

        // Update training history
        this.trainingHistory.push({
          round: this.trainingRound,
          accuracy: this.modelAccuracy,
          participants: activeClients.length,
          timestamp: new Date().toISOString()
        });

        // Keep only last 20 entries
        if (this.trainingHistory.length > 20) {
          this.trainingHistory = this.trainingHistory.slice(-20);
        }

        if (this.modelAccuracy > 0.98 && this.trainingRound % 10 === 0) {
          const alert: InsertAlert = {
            type: 'info',
            title: 'Model Accuracy Milestone',
            message: `Federated learning model achieved ${(this.modelAccuracy * 100).toFixed(1)}% accuracy in round ${this.trainingRound}`,
            source: 'fl-coordinator',
          };

          await storage.createAlert(alert);
        }
      }

      // Update client statuses
      const clients = await storage.getFLClients();
      for (const client of clients) {
        if (Math.random() < 0.1) {
          const statuses = ['active', 'training', 'inactive', 'reconnecting'];
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          await storage.updateFLClientStatus(client.clientId, newStatus);
          
          // Update local cache
          if (this.clients.has(client.clientId)) {
            const cachedClient = this.clients.get(client.clientId);
            cachedClient.status = newStatus;
            this.clients.set(client.clientId, cachedClient);
          }
        }
      }

    } catch (error) {
      console.error('Error updating FL status:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      currentRound: this.trainingRound,
      modelAccuracy: this.modelAccuracy,
      activeClients: Array.from(this.clients.values()).filter(c => c.status === 'active').length,
      totalClients: this.clients.size,
      lastUpdate: new Date().toISOString()
    };
  }

  getNodes() {
    return Array.from(this.clients.values());
  }

  getTrainingHistory() {
    return this.trainingHistory;
  }

  async addClient(clientId: string) {
    const client: InsertFLClient = {
      clientId,
      status: 'active',
      modelAccuracy: Math.random() * 0.05 + 0.95,
      trainingRounds: 0,
      dataContribution: 0,
    };

    this.clients.set(clientId, client);
    return await storage.createOrUpdateFLClient(client);
  }

  async removeClient(clientId: string) {
    this.clients.delete(clientId);
    return await storage.updateFLClientStatus(clientId, 'inactive');
  }

  async getCurrentModel() {
    return await storage.getCurrentFLModel();
  }

  async getClients() {
    return await storage.getFLClients();
  }
}

export const flCoordinator = new FederatedLearningCoordinator();
