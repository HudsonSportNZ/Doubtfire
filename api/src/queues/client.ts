import IORedis from 'ioredis';
import { config } from '../config';

export const redisConnection = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error', err);
});
