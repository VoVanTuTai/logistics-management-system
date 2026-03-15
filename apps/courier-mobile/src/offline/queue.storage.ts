import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppStore } from '../store/appStore';
import type { OfflineJob } from './queue.types';

const OFFLINE_QUEUE_STORAGE_KEY = 'courier-mobile.offline-queue';

export async function getOfflineQueue(): Promise<OfflineJob[]> {
  const rawValue = await AsyncStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    return JSON.parse(rawValue) as OfflineJob[];
  } catch {
    return [];
  }
}

export async function setOfflineQueue(queue: OfflineJob[]): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  useAppStore.getState().setOfflinePendingCount(queue.length);
}

export async function enqueueOfflineJob(job: OfflineJob): Promise<void> {
  const currentQueue = await getOfflineQueue();
  const nextQueue = currentQueue.filter(
    (currentJob) => currentJob.idempotencyKey !== job.idempotencyKey,
  );
  nextQueue.push(job);
  await setOfflineQueue(nextQueue);
}

export async function updateOfflineJob(job: OfflineJob): Promise<void> {
  const currentQueue = await getOfflineQueue();
  const nextQueue = currentQueue.map((currentJob) =>
    currentJob.id === job.id ? job : currentJob,
  );
  await setOfflineQueue(nextQueue);
}

export async function removeOfflineJob(jobId: string): Promise<void> {
  const currentQueue = await getOfflineQueue();
  const nextQueue = currentQueue.filter((job) => job.id !== jobId);
  await setOfflineQueue(nextQueue);
}
