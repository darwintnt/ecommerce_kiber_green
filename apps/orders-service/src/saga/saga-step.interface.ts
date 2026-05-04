export interface SagaStep {
  getName(): string;
  execute(context: any): Promise<boolean>;
  compensate(context: any): Promise<void>;
}
