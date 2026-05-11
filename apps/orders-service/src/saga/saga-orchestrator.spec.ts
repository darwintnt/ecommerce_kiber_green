import { Test, TestingModule } from '@nestjs/testing';
import { SagaOrchestrator } from './saga-orchestrator';
import { SagaStep } from './saga-step.interface';
import { RpcException } from '@nestjs/microservices';

describe('SagaOrchestrator', () => {
  const createMockStep = (
    name: string,
    executeResult: boolean = true,
    compensateResult: any = undefined,
  ): SagaStep => ({
    getName: () => name,
    execute: jest.fn().mockResolvedValue(executeResult),
    compensate: jest.fn().mockResolvedValue(compensateResult),
  });

  describe('execute', () => {
    it('should execute all steps in order when all succeed', async () => {
      const step1 = createMockStep('Step 1');
      const step2 = createMockStep('Step 2');
      const step3 = createMockStep('Step 3');
      const orchestrator = new SagaOrchestrator([step1, step2, step3]);

      const context = { order: { id: 'order_123' } };
      await orchestrator.execute(context);

      expect(step1.execute).toHaveBeenCalledWith(context);
      expect(step2.execute).toHaveBeenCalledWith(context);
      expect(step3.execute).toHaveBeenCalledWith(context);
    });

    it('should stop and compensate when a step fails', async () => {
      const step1 = createMockStep('Step 1');
      const step2 = createMockStep('Step 2', false);
      const step3 = createMockStep('Step 3');
      const orchestrator = new SagaOrchestrator([step1, step2, step3]);

      const context = { order: { id: 'order_123' } };

      await expect(orchestrator.execute(context)).rejects.toThrow(
        '[Saga Fail]: Step 2',
      );

      expect(step1.execute).toHaveBeenCalled();
      expect(step2.execute).toHaveBeenCalled();
      expect(step3.execute).not.toHaveBeenCalled();
    });

    it('should compensate only executed steps in reverse order when a step fails', async () => {
      const step1 = createMockStep('Step 1');
      const step2 = createMockStep('Step 2', false);
      const step3 = createMockStep('Step 3');
      const orchestrator = new SagaOrchestrator([step1, step2, step3]);

      const context = { order: { id: 'order_123' } };

      try {
        await orchestrator.execute(context);
      } catch (e) {
        // Expected to throw
      }

      // step3 was never executed (step2 failed before it could run)
      // So only step1 was executed and should be compensated (in reverse = step1 only)
      expect(step1.compensate).toHaveBeenCalledWith(context);
      expect(step2.compensate).not.toHaveBeenCalled();
      expect(step3.compensate).not.toHaveBeenCalled();
    });

    it('should not compensate steps not yet executed', async () => {
      const step1 = createMockStep('Step 1');
      const step2 = createMockStep('Step 2', false); // fails
      const step3 = createMockStep('Step 3');
      const orchestrator = new SagaOrchestrator([step1, step2, step3]);

      const context = { order: { id: 'order_123' } };

      try {
        await orchestrator.execute(context);
      } catch (e) {
        // Expected to throw
      }

      // step3 was never executed, so should not be compensated
      expect(step3.compensate).not.toHaveBeenCalled();
    });
  });

  describe('compensation failure handling', () => {
    it('should continue compensating even if a compensate step throws', async () => {
      const step1 = createMockStep('Step 1', true, undefined);
      const step2 = createMockStep('Step 2', false, undefined);

      // step1 compensate throws
      step1.compensate.mockRejectedValue(new Error('Compensate error'));

      const orchestrator = new SagaOrchestrator([step1, step2]);
      const context = { order: { id: 'order_123' } };

      // Should still throw the saga error
      await expect(orchestrator.execute(context)).rejects.toThrow(
        '[Saga Fail]: Step 2',
      );

      // step1 compensate threw, step2 compensate should not be called (step2 never executed)
      expect(step2.compensate).not.toHaveBeenCalled();
    });
  });

  describe('empty steps', () => {
    it('should handle empty steps array gracefully', async () => {
      const orchestrator = new SagaOrchestrator([]);
      const context = { order: { id: 'order_123' } };

      await expect(orchestrator.execute(context)).resolves.not.toThrow();
    });
  });
});
