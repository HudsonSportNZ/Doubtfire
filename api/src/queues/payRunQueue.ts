import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from './client';

export const PAY_RUN_QUEUE = 'pay-run';

export interface PayRunJobData {
  payRunId: string;
  tenantId: string;
  idempotencyKey: string;
}

export const payRunQueue = new Queue<PayRunJobData>(PAY_RUN_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

/**
 * Worker processes pay run calculation jobs.
 * Import and start this in server.ts to begin processing.
 */
export function createPayRunWorker(
  processor: (job: Job<PayRunJobData>) => Promise<void>,
): Worker<PayRunJobData> {
  return new Worker<PayRunJobData>(PAY_RUN_QUEUE, processor, {
    connection: redisConnection,
    concurrency: 5,
  });
}
