import type { BaseJobMessage, JobResult } from '../queue/types.js';

export interface JobProcessor<TPayload = unknown> {
  readonly jobName: string;
  readonly queueName: string;

  /**
   * Executes the background task logic.
   */
  process(message: BaseJobMessage<TPayload>): Promise<JobResult>;
}
