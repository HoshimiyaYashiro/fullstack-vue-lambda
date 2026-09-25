export interface BaseJobMessage<TPayload = unknown> {
  jobId: string;
  jobType: string;
  tenantId?: string;
  createdAt: string;
  payload: TPayload;
}

export interface JobResult {
  jobId: string;
  status: 'SUCCESS' | 'FAILED';
  recordsProcessed: number;
  details?: Record<string, unknown>;
  error?: string;
}
