import type {
  CreateDeliveryAttemptInput,
  DeliveryAttempt,
  UpdateDeliveredAttemptInput,
  UpdateFailedAttemptInput,
} from '../entities/delivery-attempt.entity';

export abstract class DeliveryAttemptRepository {
  abstract findById(id: string): Promise<DeliveryAttempt | null>;

  abstract create(input: CreateDeliveryAttemptInput): Promise<DeliveryAttempt>;

  abstract markDelivered(
    id: string,
    input: UpdateDeliveredAttemptInput,
  ): Promise<DeliveryAttempt>;

  abstract markFailed(
    id: string,
    input: UpdateFailedAttemptInput,
  ): Promise<DeliveryAttempt>;
}
