import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  AttemptDeliveryResult,
  DeliveryAttempt,
  DeliveryAttemptSnapshot,
  DeliveryFailResult,
  DeliveryFailResultSnapshot,
  DeliverySuccessResult,
  DeliverySuccessResultSnapshot,
  MarkDeliveryFailInput,
  MarkDeliverySuccessInput,
  RecordDeliveryAttemptInput,
} from '../../domain/entities/delivery-attempt.entity';
import type { IdempotencyRecord } from '../../domain/entities/idempotency-record.entity';
import type { NdrCase, NdrCaseSnapshot } from '../../domain/entities/ndr-case.entity';
import type { OtpRecord, OtpRecordSnapshot } from '../../domain/entities/otp-record.entity';
import type { Pod, PodSnapshot } from '../../domain/entities/pod.entity';
import type { ReturnCase, ReturnCaseSnapshot } from '../../domain/entities/return-case.entity';
import { DeliveryAttemptRepository } from '../../domain/repositories/delivery-attempt.repository';
import { IdempotencyRecordRepository } from '../../domain/repositories/idempotency-record.repository';
import { NdrCaseRepository } from '../../domain/repositories/ndr-case.repository';
import { OtpRecordRepository } from '../../domain/repositories/otp-record.repository';
import { PodRepository } from '../../domain/repositories/pod.repository';
import { ReturnCaseRepository } from '../../domain/repositories/return-case.repository';
import { DeliveryOutboxService } from '../../messaging/outbox/delivery-outbox.service';

type DeliveryIdempotencyScope = 'delivery.success' | 'delivery.fail';

@Injectable()
export class DeliveryService {
  constructor(
    @Inject(DeliveryAttemptRepository)
    private readonly deliveryAttemptRepository: DeliveryAttemptRepository,
    @Inject(PodRepository)
    private readonly podRepository: PodRepository,
    @Inject(OtpRecordRepository)
    private readonly otpRecordRepository: OtpRecordRepository,
    @Inject(NdrCaseRepository)
    private readonly ndrCaseRepository: NdrCaseRepository,
    @Inject(ReturnCaseRepository)
    private readonly returnCaseRepository: ReturnCaseRepository,
    @Inject(IdempotencyRecordRepository)
    private readonly idempotencyRecordRepository: IdempotencyRecordRepository,
    private readonly deliveryOutboxService: DeliveryOutboxService,
  ) {}

  async createAttempt(
    input: RecordDeliveryAttemptInput,
  ): Promise<AttemptDeliveryResult> {
    if (!input.shipmentCode) {
      throw new BadRequestException('shipmentCode is required.');
    }

    const deliveryAttempt = await this.deliveryAttemptRepository.create({
      shipmentCode: input.shipmentCode,
      taskId: input.taskId ?? null,
      courierId: input.courierId ?? null,
      locationCode: input.locationCode ?? null,
      actor: input.actor ?? null,
      note: input.note ?? null,
      occurredAt: this.parseDate(input.occurredAt),
      status: 'ATTEMPTED',
    });

    let otpRecord: OtpRecord | null = null;

    if (input.sendOtp) {
      otpRecord = await this.otpRecordRepository.createSent({
        shipmentCode: input.shipmentCode,
        otpCode: input.otpCode ?? null,
        sentBy: input.actor ?? null,
      });
    }

    await this.deliveryOutboxService.enqueueDeliveryAttempted(deliveryAttempt);

    if (otpRecord) {
      await this.deliveryOutboxService.enqueueOtpSent(
        otpRecord,
        deliveryAttempt.shipmentCode,
      );
    }

    return {
      deliveryAttempt,
      otpRecord,
    };
  }

  async markSuccess(
    input: MarkDeliverySuccessInput,
  ): Promise<DeliverySuccessResult> {
    this.assertTerminalInput(input.shipmentCode, input.idempotencyKey, input.occurredAt);

    const scopedIdempotencyKey = this.buildScopedIdempotencyKey(
      'delivery.success',
      input.idempotencyKey,
    );
    const existingRecord = await this.idempotencyRecordRepository.findByKey(
      scopedIdempotencyKey,
    );

    if (existingRecord) {
      return this.toSuccessResult(existingRecord);
    }

    let deliveryAttempt = await this.getOrCreateAttemptForSuccess(input);

    let pod: Pod | null = null;
    let otpRecord: OtpRecord | null = null;

    if (
      input.podImageUrl !== undefined ||
      input.podNote !== undefined ||
      input.podCapturedBy !== undefined
    ) {
      pod = await this.podRepository.upsertForAttempt({
        deliveryAttemptId: deliveryAttempt.id,
        imageUrl: input.podImageUrl ?? null,
        note: input.podNote ?? null,
        capturedBy: input.podCapturedBy ?? input.actor ?? null,
        capturedAt: input.occurredAt ?? null,
      });
    }

    if (input.otpCode !== undefined) {
      otpRecord = await this.otpRecordRepository.verifyLatestForShipment({
        shipmentCode: input.shipmentCode,
        otpCode: input.otpCode ?? null,
        verifiedBy: input.actor ?? null,
        verifiedAt: input.occurredAt ?? null,
      });
    }

    const result: DeliverySuccessResult = {
      kind: 'success',
      deliveryAttempt,
      pod,
      otpRecord,
    };

    await this.deliveryOutboxService.enqueueDeliveryDelivered(deliveryAttempt);

    if (pod) {
      await this.deliveryOutboxService.enqueuePodCaptured(
        pod,
        deliveryAttempt.shipmentCode,
        deliveryAttempt.actor,
        deliveryAttempt.locationCode,
      );
    }

    if (otpRecord) {
      await this.deliveryOutboxService.enqueueOtpVerified(
        otpRecord,
        deliveryAttempt.shipmentCode,
      );
    }

    await this.idempotencyRecordRepository.createIfAbsent({
      idempotencyKey: scopedIdempotencyKey,
      scope: 'delivery.success',
      responsePayload: this.toSuccessSnapshot(result),
    });

    return result;
  }

  async markFail(
    input: MarkDeliveryFailInput,
  ): Promise<DeliveryFailResult> {
    this.assertTerminalInput(input.shipmentCode, input.idempotencyKey, input.occurredAt);

    const scopedIdempotencyKey = this.buildScopedIdempotencyKey(
      'delivery.fail',
      input.idempotencyKey,
    );
    const existingRecord = await this.idempotencyRecordRepository.findByKey(
      scopedIdempotencyKey,
    );

    if (existingRecord) {
      return this.toFailResult(existingRecord);
    }

    const deliveryAttempt = await this.getOrCreateAttemptForFail(input);

    let ndrCase: NdrCase | null = null;
    let returnCase: ReturnCase | null = null;

    if (input.createNdr !== false) {
      ndrCase = await this.ndrCaseRepository.create({
        shipmentCode: input.shipmentCode,
        deliveryAttemptId: deliveryAttempt.id,
        reasonCode: input.failReasonCode ?? null,
        note: input.note ?? null,
      });
    }

    if (input.startReturn) {
      returnCase = await this.returnCaseRepository.create({
        shipmentCode: input.shipmentCode,
        ndrCaseId: ndrCase?.id ?? null,
        note: input.note ?? null,
      });
    }

    const result: DeliveryFailResult = {
      kind: 'fail',
      deliveryAttempt,
      ndrCase,
      returnCase,
    };

    await this.deliveryOutboxService.enqueueDeliveryFailed(deliveryAttempt);

    if (ndrCase) {
      await this.deliveryOutboxService.enqueueNdrCreated(ndrCase);
    }

    if (returnCase) {
      await this.deliveryOutboxService.enqueueReturnStarted(returnCase);
    }

    await this.idempotencyRecordRepository.createIfAbsent({
      idempotencyKey: scopedIdempotencyKey,
      scope: 'delivery.fail',
      responsePayload: this.toFailSnapshot(result),
    });

    return result;
  }

  async handleTaskAssigned(payload: {
    shipment_code?: string | null;
    data?: Record<string, unknown>;
  }): Promise<{ accepted: boolean; shipmentCode: string | null }> {
    const task = this.readObject(payload.data?.task);
    const taskType = this.readString(task?.taskType)?.toUpperCase() ?? null;
    const shipmentCode =
      payload.shipment_code ??
      this.readString(task?.shipmentCode) ??
      null;

    if (!shipmentCode) {
      return {
        accepted: false,
        shipmentCode: null,
      };
    }

    if (taskType && taskType !== 'DELIVERY') {
      return {
        accepted: false,
        shipmentCode,
      };
    }

    return {
      accepted: true,
      shipmentCode,
    };
  }

  private async getOrCreateAttemptForSuccess(
    input: MarkDeliverySuccessInput,
  ): Promise<DeliveryAttempt> {
    if (input.deliveryAttemptId) {
      const existingAttempt = await this.deliveryAttemptRepository.findById(
        input.deliveryAttemptId,
      );

      if (!existingAttempt) {
        throw new NotFoundException(
          `Delivery attempt "${input.deliveryAttemptId}" was not found.`,
        );
      }

      return this.deliveryAttemptRepository.markDelivered(input.deliveryAttemptId, {
        locationCode: input.locationCode ?? null,
        actor: input.actor ?? null,
        note: input.note ?? null,
        occurredAt: this.parseDate(input.occurredAt),
      });
    }

    return this.deliveryAttemptRepository.create({
      shipmentCode: input.shipmentCode,
      taskId: input.taskId ?? null,
      courierId: input.courierId ?? null,
      locationCode: input.locationCode ?? null,
      actor: input.actor ?? null,
      note: input.note ?? null,
      occurredAt: this.parseDate(input.occurredAt),
      status: 'DELIVERED',
    });
  }

  private async getOrCreateAttemptForFail(
    input: MarkDeliveryFailInput,
  ): Promise<DeliveryAttempt> {
    if (input.deliveryAttemptId) {
      const existingAttempt = await this.deliveryAttemptRepository.findById(
        input.deliveryAttemptId,
      );

      if (!existingAttempt) {
        throw new NotFoundException(
          `Delivery attempt "${input.deliveryAttemptId}" was not found.`,
        );
      }

      return this.deliveryAttemptRepository.markFailed(input.deliveryAttemptId, {
        locationCode: input.locationCode ?? null,
        actor: input.actor ?? null,
        note: input.note ?? null,
        occurredAt: this.parseDate(input.occurredAt),
        failReasonCode: input.failReasonCode ?? null,
      });
    }

    return this.deliveryAttemptRepository.create({
      shipmentCode: input.shipmentCode,
      taskId: input.taskId ?? null,
      courierId: input.courierId ?? null,
      locationCode: input.locationCode ?? null,
      actor: input.actor ?? null,
      note: input.note ?? null,
      occurredAt: this.parseDate(input.occurredAt),
      status: 'FAILED',
      failReasonCode: input.failReasonCode ?? null,
    });
  }

  private assertTerminalInput(
    shipmentCode: string,
    idempotencyKey: string,
    occurredAt?: string | null,
  ): void {
    if (!shipmentCode) {
      throw new BadRequestException('shipmentCode is required.');
    }

    if (!idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required.');
    }

    if (occurredAt && Number.isNaN(new Date(occurredAt).getTime())) {
      throw new BadRequestException('occurredAt must be a valid ISO date.');
    }
  }

  private buildScopedIdempotencyKey(
    scope: DeliveryIdempotencyScope,
    idempotencyKey: string,
  ): string {
    return `${scope}:${idempotencyKey}`;
  }

  private parseDate(value?: string | null): Date {
    if (!value) {
      return new Date();
    }

    return new Date(value);
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private readObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private toSuccessResult(record: IdempotencyRecord): DeliverySuccessResult {
    const payload = record.responsePayload;

    if (payload.kind !== 'success') {
      throw new BadRequestException('Stored idempotency payload is not success.');
    }

    return {
      kind: 'success',
      deliveryAttempt: this.toDeliveryAttempt(payload.deliveryAttempt),
      pod: payload.pod ? this.toPod(payload.pod) : null,
      otpRecord: payload.otpRecord ? this.toOtpRecord(payload.otpRecord) : null,
    };
  }

  private toFailResult(record: IdempotencyRecord): DeliveryFailResult {
    const payload = record.responsePayload;

    if (payload.kind !== 'fail') {
      throw new BadRequestException('Stored idempotency payload is not fail.');
    }

    return {
      kind: 'fail',
      deliveryAttempt: this.toDeliveryAttempt(payload.deliveryAttempt),
      ndrCase: payload.ndrCase ? this.toNdrCase(payload.ndrCase) : null,
      returnCase: payload.returnCase ? this.toReturnCase(payload.returnCase) : null,
    };
  }

  private toSuccessSnapshot(
    result: DeliverySuccessResult,
  ): DeliverySuccessResultSnapshot {
    return {
      kind: 'success',
      deliveryAttempt: this.toDeliveryAttemptSnapshot(result.deliveryAttempt),
      pod: result.pod ? this.toPodSnapshot(result.pod) : null,
      otpRecord: result.otpRecord ? this.toOtpRecordSnapshot(result.otpRecord) : null,
    };
  }

  private toFailSnapshot(result: DeliveryFailResult): DeliveryFailResultSnapshot {
    return {
      kind: 'fail',
      deliveryAttempt: this.toDeliveryAttemptSnapshot(result.deliveryAttempt),
      ndrCase: result.ndrCase ? this.toNdrCaseSnapshot(result.ndrCase) : null,
      returnCase: result.returnCase
        ? this.toReturnCaseSnapshot(result.returnCase)
        : null,
    };
  }

  private toDeliveryAttemptSnapshot(
    deliveryAttempt: DeliveryAttempt,
  ): DeliveryAttemptSnapshot {
    return {
      id: deliveryAttempt.id,
      shipmentCode: deliveryAttempt.shipmentCode,
      taskId: deliveryAttempt.taskId,
      courierId: deliveryAttempt.courierId,
      locationCode: deliveryAttempt.locationCode,
      actor: deliveryAttempt.actor,
      note: deliveryAttempt.note,
      status: deliveryAttempt.status,
      failReasonCode: deliveryAttempt.failReasonCode,
      occurredAt: deliveryAttempt.occurredAt.toISOString(),
      createdAt: deliveryAttempt.createdAt.toISOString(),
      updatedAt: deliveryAttempt.updatedAt.toISOString(),
    };
  }

  private toOtpRecordSnapshot(otpRecord: OtpRecord): OtpRecordSnapshot {
    return {
      id: otpRecord.id,
      shipmentCode: otpRecord.shipmentCode,
      otpCode: otpRecord.otpCode,
      status: otpRecord.status,
      sentBy: otpRecord.sentBy,
      verifiedBy: otpRecord.verifiedBy,
      sentAt: otpRecord.sentAt ? otpRecord.sentAt.toISOString() : null,
      verifiedAt: otpRecord.verifiedAt ? otpRecord.verifiedAt.toISOString() : null,
      createdAt: otpRecord.createdAt.toISOString(),
      updatedAt: otpRecord.updatedAt.toISOString(),
    };
  }

  private toPodSnapshot(pod: Pod): PodSnapshot {
    return {
      id: pod.id,
      deliveryAttemptId: pod.deliveryAttemptId,
      imageUrl: pod.imageUrl,
      note: pod.note,
      capturedBy: pod.capturedBy,
      capturedAt: pod.capturedAt.toISOString(),
      createdAt: pod.createdAt.toISOString(),
      updatedAt: pod.updatedAt.toISOString(),
    };
  }

  private toNdrCaseSnapshot(ndrCase: NdrCase): NdrCaseSnapshot {
    return {
      id: ndrCase.id,
      shipmentCode: ndrCase.shipmentCode,
      deliveryAttemptId: ndrCase.deliveryAttemptId,
      reasonCode: ndrCase.reasonCode,
      note: ndrCase.note,
      status: ndrCase.status,
      rescheduleAt: ndrCase.rescheduleAt
        ? ndrCase.rescheduleAt.toISOString()
        : null,
      createdAt: ndrCase.createdAt.toISOString(),
      updatedAt: ndrCase.updatedAt.toISOString(),
    };
  }

  private toReturnCaseSnapshot(returnCase: ReturnCase): ReturnCaseSnapshot {
    return {
      id: returnCase.id,
      shipmentCode: returnCase.shipmentCode,
      ndrCaseId: returnCase.ndrCaseId,
      note: returnCase.note,
      status: returnCase.status,
      startedAt: returnCase.startedAt ? returnCase.startedAt.toISOString() : null,
      completedAt: returnCase.completedAt
        ? returnCase.completedAt.toISOString()
        : null,
      createdAt: returnCase.createdAt.toISOString(),
      updatedAt: returnCase.updatedAt.toISOString(),
    };
  }

  private toDeliveryAttempt(snapshot: DeliveryAttemptSnapshot): DeliveryAttempt {
    return {
      id: snapshot.id,
      shipmentCode: snapshot.shipmentCode,
      taskId: snapshot.taskId,
      courierId: snapshot.courierId,
      locationCode: snapshot.locationCode,
      actor: snapshot.actor,
      note: snapshot.note,
      status: snapshot.status,
      failReasonCode: snapshot.failReasonCode,
      occurredAt: new Date(snapshot.occurredAt),
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
    };
  }

  private toOtpRecord(snapshot: OtpRecordSnapshot): OtpRecord {
    return {
      id: snapshot.id,
      shipmentCode: snapshot.shipmentCode,
      otpCode: snapshot.otpCode,
      status: snapshot.status,
      sentBy: snapshot.sentBy,
      verifiedBy: snapshot.verifiedBy,
      sentAt: snapshot.sentAt ? new Date(snapshot.sentAt) : null,
      verifiedAt: snapshot.verifiedAt ? new Date(snapshot.verifiedAt) : null,
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
    };
  }

  private toPod(snapshot: PodSnapshot): Pod {
    return {
      id: snapshot.id,
      deliveryAttemptId: snapshot.deliveryAttemptId,
      imageUrl: snapshot.imageUrl,
      note: snapshot.note,
      capturedBy: snapshot.capturedBy,
      capturedAt: new Date(snapshot.capturedAt),
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
    };
  }

  private toNdrCase(snapshot: NdrCaseSnapshot): NdrCase {
    return {
      id: snapshot.id,
      shipmentCode: snapshot.shipmentCode,
      deliveryAttemptId: snapshot.deliveryAttemptId,
      reasonCode: snapshot.reasonCode,
      note: snapshot.note,
      status: snapshot.status,
      rescheduleAt: snapshot.rescheduleAt ? new Date(snapshot.rescheduleAt) : null,
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
    };
  }

  private toReturnCase(snapshot: ReturnCaseSnapshot): ReturnCase {
    return {
      id: snapshot.id,
      shipmentCode: snapshot.shipmentCode,
      ndrCaseId: snapshot.ndrCaseId,
      note: snapshot.note,
      status: snapshot.status,
      startedAt: snapshot.startedAt ? new Date(snapshot.startedAt) : null,
      completedAt: snapshot.completedAt ? new Date(snapshot.completedAt) : null,
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
    };
  }
}
