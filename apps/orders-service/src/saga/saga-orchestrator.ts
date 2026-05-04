import { Logger } from '@nestjs/common';
import { SagaStep } from './saga-step.interface';

export class SagaOrchestrator {
  private readonly logger = new Logger(SagaOrchestrator.name);
  private executeSteps: SagaStep[] = [];

  constructor(private readonly steps: SagaStep[]) {}

  async execute(context: any): Promise<void> {
    for (const step of this.steps) {
      this.logger.log(`[Saga] execute: ${step.getName()}`);
      const success = await step.execute(context);
      if (!success) {
        this.logger.log(
          `[Saga] Starting compensation for saga: ${step.getName()}`,
        );
        await this.compensate(context);
        throw new Error(`[Saga Fail]: ${step.getName()}`);
      }
      this.executeSteps.push(step);
      this.logger.log(`[Saga] Step ${step.getName()} completed successfully`);
    }
  }

  private async compensate(context: any): Promise<void> {
    for (const step of this.executeSteps.reverse()) {
      try {
        await step.compensate(context);
        this.logger.log(`[Saga] Compensation for ${step.getName()} completed`);
      } catch {
        this.logger.error(`[Saga] Compensation failed for ${step.getName()}`);
      }
    }
  }
}
