import type { Pod, UpsertPodInput } from '../entities/pod.entity';

export abstract class PodRepository {
  abstract upsertForAttempt(input: UpsertPodInput): Promise<Pod>;
}
