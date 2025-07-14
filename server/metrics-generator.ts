import { storage } from "./storage";
import { logger } from "./logger";

class MetricsGenerator {
  private intervalId: NodeJS.Timeout | null = null;
  private cpuBase = 30;
  private memoryBase = 50;
  private networkBase = 25;

  start() {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      try {
        // Generate realistic varying metrics
        const cpuVariation = Math.sin(Date.now() / 10000) * 15 + Math.random() * 10;
        const memoryVariation = Math.cos(Date.now() / 15000) * 20 + Math.random() * 8;
        const networkVariation = Math.sin(Date.now() / 8000) * 25 + Math.random() * 15;

        const metrics = [
          {
            metricType: 'cpu',
            component: 'AI Detection Engine',
            value: Math.max(5, Math.min(95, this.cpuBase + cpuVariation)).toString(),
            unit: 'percent',
            status: 'normal'
          },
          {
            metricType: 'memory',
            component: 'Data Pipeline',
            value: Math.max(10, Math.min(90, this.memoryBase + memoryVariation)).toString(),
            unit: 'percent',
            status: 'normal'
          },
          {
            metricType: 'network',
            component: 'Network Monitor',
            value: Math.max(5, Math.min(80, this.networkBase + networkVariation)).toString(),
            unit: 'percent',
            status: 'normal'
          }
        ];

        for (const metric of metrics) {
          await storage.createSystemMetric(metric);
        }

        // Occasionally change base values for more dynamic behavior
        if (Math.random() < 0.1) {
          this.cpuBase = 20 + Math.random() * 40;
          this.memoryBase = 30 + Math.random() * 50;
          this.networkBase = 15 + Math.random() * 35;
        }

      } catch (error) {
        logger.error('Error generating metrics:', error);
      }
    }, 5000); // Generate metrics every 5 seconds

    logger.info('Metrics generator started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Metrics generator stopped');
    }
  }
}

export const metricsGenerator = new MetricsGenerator();