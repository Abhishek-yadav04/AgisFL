import { storage } from "../storage";
import { InsertFLClient, InsertFLModel, InsertAlert } from "@shared/schema";

export class FederatedLearningCoordinator {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  private trainingRound = 156;
  private modelAccuracy = 0.973;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Federated Learning coordinator started');
    
    // Update FL status every 30 seconds
    this.interval = setInterval(async () => {
      await this.updateFLStatus();
    }, 30000);

    // Simulate federated learning process
    this.simulateTraining();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('Federated Learning coordinator stopped');
  }

  private async simulateTraining() {
    // Simulate clients joining and training
    const clientIds = ['client-004', 'client-005', 'client-006', 'client-007', 'client-008'];
    
    for (const clientId of clientIds) {
      const client: InsertFLClient = {
        clientId,
        status: Math.random() > 0.3 ? 'active' : 'inactive',
        modelAccuracy: Math.random() * 0.05 + 0.95, // 95-100%
        trainingRounds: Math.floor(Math.random() * 50 + 100), // 100-150 rounds
        dataContribution: Math.floor(Math.random() * 2000 + 500), // 500-2500 samples
      };

      await storage.createOrUpdateFLClient(client);
    }
  }

  private async updateFLStatus() {
    try {
      // Simulate model training progress
      if (Math.random() < 0.3) { // 30% chance of new training round
        this.trainingRound++;
        this.modelAccuracy = Math.min(0.999, this.modelAccuracy + Math.random() * 0.001);

        // Create new model version
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

        // Create alert for significant accuracy improvements
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

      // Randomly update client statuses
      const clients = await storage.getFLClients();
      for (const client of clients) {
        if (Math.random() < 0.1) { // 10% chance of status change
          const statuses = ['active', 'training', 'inactive', 'reconnecting'];
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          await storage.updateFLClientStatus(client.clientId, newStatus);
        }
      }

    } catch (error) {
      console.error('Error updating FL status:', error);
    }
  }

  async addClient(clientId: string) {
    const client: InsertFLClient = {
      clientId,
      status: 'active',
      modelAccuracy: Math.random() * 0.05 + 0.95,
      trainingRounds: 0,
      dataContribution: 0,
    };

    return await storage.createOrUpdateFLClient(client);
  }

  async removeClient(clientId: string) {
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
