import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type {
  BreakPointType,
  DisputeStatus,
  InvestigationCase,
  InvestigationPriority,
  InvestigationStatus,
  Prisma,
  ResponsiblePartyType,
  RootCauseCategory,
} from '@prisma/client';

export interface CreateDisputeInput {
  submittedBy: string;
  partyCode: string;
  partyName: string;
  cctvVideoUrl?: string;
  cctvTimestampRange?: string;
  handoverSlipUrl?: string;
  notes: string;
}

export interface ResolveFoundInput {
  foundLocation: string;
  resolutionNote: string;
  operator: string;
}

export interface EscalateClaimInput {
  adjudicator: string;
  finalNotes?: string;
}

@Injectable()
export class InvestigationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters?: {
    search?: string;
    status?: InvestigationStatus;
    breakPointType?: BreakPointType;
  }): Promise<InvestigationCase[]> {
    const where: Prisma.InvestigationCaseWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.breakPointType) {
      where.breakPointType = filters.breakPointType;
    }

    if (filters?.search) {
      const term = filters.search.trim();
      where.OR = [
        { investigationCode: { contains: term, mode: 'insensitive' } },
        { shipmentCode: { contains: term, mode: 'insensitive' } },
        { customerName: { contains: term, mode: 'insensitive' } },
        { packageDescription: { contains: term, mode: 'insensitive' } },
      ];
    }

    return this.prisma.investigationCase.findMany({
      where,
      include: {
        auditTrail: {
          orderBy: { timestamp: 'asc' },
        },
        disputeEvidences: {
          orderBy: { submittedAt: 'desc' },
        },
      },
      orderBy: { openedAt: 'desc' },
    });
  }

  async getById(id: string): Promise<InvestigationCase> {
    const found = await this.prisma.investigationCase.findFirst({
      where: {
        OR: [{ id }, { investigationCode: id }, { shipmentCode: id }],
      },
      include: {
        auditTrail: {
          orderBy: { timestamp: 'asc' },
        },
        disputeEvidences: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!found) {
      throw new NotFoundException(`Investigation case ${id} not found.`);
    }

    return found;
  }

  async create(input: {
    shipmentCode: string;
    breakPointType: BreakPointType;
    suspectPartyType?: ResponsiblePartyType;
    suspectPartyCode: string;
    suspectPartyName: string;
    breakPointDescription?: string;
    priority?: InvestigationPriority;
    suggestedCompensationAmount?: number;
  }): Promise<InvestigationCase> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { code: input.shipmentCode },
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment ${input.shipmentCode} not found in database.`);
    }

    const meta = (shipment.metadata as Record<string, any>) || {};
    const investigationCode = `INV-202609-${String(Date.now()).slice(-3)}`;

    return this.prisma.investigationCase.create({
      data: {
        investigationCode,
        shipmentCode: shipment.code,
        customerName: meta.senderName || meta.sender?.name || 'Khách hàng',
        customerPhone: meta.senderPhone || meta.sender?.phone || shipment.receiverPhone,
        originHubCode: meta.originHubCode || meta.sender?.hubCode || '00101W001',
        originHubName: meta.originHubName || 'Bưu cục gốc',
        destinationHubCode: meta.receiverHubCode || meta.receiver?.hubCode || '003079B001',
        destinationHubName: meta.receiverHubName || 'Bưu cục phát',
        declaredValue: meta.codAmount || 0,
        declaredWeightKg: meta.weightKg || 1.0,
        packageDescription: meta.packageDescription || `Kiện hàng ${shipment.code} (${meta.serviceType || 'STANDARD'})`,
        status: 'IN_HEARING',
        priority: input.priority || 'NORMAL',
        breakPointType: input.breakPointType,
        suspectPartyType: input.suspectPartyType || 'TRANSIT_HUB',
        suspectPartyCode: input.suspectPartyCode,
        suspectPartyName: input.suspectPartyName,
        confidenceScorePercent: 85,
        suggestedRootCause: 'WAREHOUSE_INVENTORY_LOSS',
        suggestedCompensationAmount: input.suggestedCompensationAmount ?? meta.codAmount ?? 0,
        breakPointDescription: input.breakPointDescription || 'Đơn hàng phát sinh bất thường cần thẩm tra.',
        hearingDeadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: {
        auditTrail: true,
        disputeEvidences: true,
      },
    });
  }

  async submitDispute(id: string, input: CreateDisputeInput): Promise<InvestigationCase> {
    const item = await this.getById(id);

    await this.prisma.investigationDispute.create({
      data: {
        investigationCaseId: item.id,
        submittedBy: input.submittedBy,
        partyCode: input.partyCode,
        partyName: input.partyName,
        cctvVideoUrl: input.cctvVideoUrl,
        cctvTimestampRange: input.cctvTimestampRange,
        handoverSlipUrl: input.handoverSlipUrl,
        notes: input.notes,
        status: 'PENDING_REVIEW',
      },
    });

    return this.getById(item.id);
  }

  async resolveFound(id: string, input: ResolveFoundInput): Promise<InvestigationCase> {
    const item = await this.getById(id);
    const now = new Date();

    await this.prisma.investigationAuditScan.create({
      data: {
        investigationCaseId: item.id,
        timestamp: now,
        locationCode: item.destinationHubCode || item.originHubCode,
        locationName: item.destinationHubName || item.originHubName || 'Kho trung chuyển',
        action: `Đã tìm thấy hàng thất lạc tại: ${input.foundLocation}`,
        operator: input.operator,
        anomalyNote: input.resolutionNote,
      },
    });

    await this.prisma.investigationCase.update({
      where: { id: item.id },
      data: {
        status: 'RESOLVED_FOUND',
        foundLocation: input.foundLocation,
        resolutionNote: input.resolutionNote,
        closedAt: now,
      },
    });

    return this.getById(item.id);
  }

  async extendHearing(id: string, hours = 12): Promise<InvestigationCase> {
    const item = await this.getById(id);
    const currentDeadline = item.hearingDeadlineAt ? new Date(item.hearingDeadlineAt) : new Date();
    currentDeadline.setHours(currentDeadline.getHours() + hours);

    await this.prisma.investigationCase.update({
      where: { id: item.id },
      data: {
        hearingDeadlineAt: currentDeadline,
      },
    });

    return this.getById(item.id);
  }

  async escalateClaim(id: string, input: EscalateClaimInput): Promise<{
    case: InvestigationCase;
    claimCode: string;
  }> {
    const item = await this.getById(id);
    const now = new Date();
    const claimCode = `CLM-202609-${String(Date.now()).slice(-3)}`;

    // 1. Create corresponding claim
    await this.prisma.compensationClaim.create({
      data: {
        claimCode,
        shipmentCode: item.shipmentCode,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        originHubCode: item.originHubCode,
        destinationHubCode: item.destinationHubCode,
        incidentType: 'LOST_IN_TRANSIT',
        reportedAt: now,
        reportedBy: `${input.adjudicator} (Từ điều tra ${item.investigationCode})`,
        declaredValue: item.declaredValue,
        codAmount: item.declaredValue,
        claimRequestedAmount: item.suggestedCompensationAmount,
        approvedCompensationAmount: item.suggestedCompensationAmount,
        penaltyAmount: item.suggestedCompensationAmount,
        status: 'LIABILITY_DETERMINED',
        responsibleParty: item.suspectPartyType,
        responsibleEntityCode: item.suspectPartyCode,
        responsibleEntityName: item.suspectPartyName,
        liabilityRatioPercent: 100,
        rootCause: item.suggestedRootCause,
        adjudicationNotes: `Chuyển tiếp từ kết luận điều tra ${item.investigationCode}. Ghi chú: ${input.finalNotes ?? ''}`,
        adjudicatedAt: now,
        adjudicatedBy: input.adjudicator,
        declaredWeightKg: item.declaredWeightKg,
        packageDescription: item.packageDescription,
        damageDescription: 'Kiện hàng thất lạc, kết thúc 24h giải trình không tìm thấy.',
      },
    });

    // 2. Update investigation status
    await this.prisma.investigationCase.update({
      where: { id: item.id },
      data: {
        status: 'ESCALATED_TO_CLAIM',
        linkedClaimCode: claimCode,
        closedAt: now,
        resolutionNote: `Đã kết luận phán quyết trách nhiệm. Chuyển sang hồ sơ bồi thường ${claimCode}.`,
      },
    });

    const updated = await this.getById(item.id);
    return { case: updated, claimCode };
  }
}
