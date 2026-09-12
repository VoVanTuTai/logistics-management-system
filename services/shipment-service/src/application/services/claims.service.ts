import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type {
  ClaimStatus,
  CompensationClaim,
  IncidentType,
  Prisma,
  ResponsiblePartyType,
  RootCauseCategory,
} from '@prisma/client';

export interface CreateClaimInput {
  shipmentCode: string;
  customerName?: string;
  customerPhone?: string;
  originHubCode: string;
  destinationHubCode: string;
  incidentType: IncidentType;
  declaredValue?: number;
  codAmount?: number;
  claimRequestedAmount?: number;
  reportedBy: string;
  declaredWeightKg?: number;
  packageDescription: string;
  damageDescription?: string;
}

export interface AdjudicateClaimInput {
  responsibleParty: ResponsiblePartyType;
  responsibleEntityCode?: string;
  responsibleEntityName?: string;
  liabilityRatioPercent: number;
  rootCause: RootCauseCategory;
  approvedCompensationAmount: number;
  penaltyAmount: number;
  adjudicationNotes?: string;
  adjudicatedBy: string;
}

export interface HubClaimStatisticItem {
  hubCode: string;
  hubName: string;
  zoneCode: string;
  totalShipmentsHandled: number;
  damagedCount: number;
  lostCount: number;
  totalIncidentCount: number;
  totalCompensationCost: number;
  penaltyAssignedAmount: number;
  penaltyRecoveredAmount: number;
  lossAndDamageRate: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  topRootCause: string;
}

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters?: {
    search?: string;
    status?: ClaimStatus;
    incidentType?: IncidentType;
    responsibleParty?: ResponsiblePartyType;
  }): Promise<CompensationClaim[]> {
    const where: Prisma.CompensationClaimWhereInput = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.incidentType) where.incidentType = filters.incidentType;
    if (filters?.responsibleParty) where.responsibleParty = filters.responsibleParty;

    if (filters?.search) {
      const term = filters.search.trim();
      where.OR = [
        { claimCode: { contains: term, mode: 'insensitive' } },
        { shipmentCode: { contains: term, mode: 'insensitive' } },
        { customerName: { contains: term, mode: 'insensitive' } },
        { packageDescription: { contains: term, mode: 'insensitive' } },
      ];
    }

    return this.prisma.compensationClaim.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
    });
  }

  async getById(id: string): Promise<CompensationClaim> {
    const found = await this.prisma.compensationClaim.findFirst({
      where: {
        OR: [{ id }, { claimCode: id }, { shipmentCode: id }],
      },
    });

    if (!found) {
      throw new NotFoundException(`Claim ${id} not found.`);
    }

    return found;
  }

  async create(input: CreateClaimInput): Promise<CompensationClaim> {
    const claimCode = `CLM-202609-${String(Date.now()).slice(-3)}`;

    // Ensure shipment exists
    await this.prisma.shipment.upsert({
      where: { code: input.shipmentCode },
      update: {},
      create: {
        code: input.shipmentCode,
        currentStatus: 'EXCEPTION',
      },
    });

    return this.prisma.compensationClaim.create({
      data: {
        claimCode,
        shipmentCode: input.shipmentCode,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        originHubCode: input.originHubCode,
        destinationHubCode: input.destinationHubCode,
        incidentType: input.incidentType,
        declaredValue: input.declaredValue ?? 0,
        codAmount: input.codAmount ?? 0,
        claimRequestedAmount: input.claimRequestedAmount ?? 0,
        reportedBy: input.reportedBy,
        declaredWeightKg: input.declaredWeightKg ?? 0,
        packageDescription: input.packageDescription,
        damageDescription: input.damageDescription,
        status: 'PENDING_INSPECTION',
      },
    });
  }

  async adjudicate(id: string, input: AdjudicateClaimInput): Promise<CompensationClaim> {
    const item = await this.getById(id);

    return this.prisma.compensationClaim.update({
      where: { id: item.id },
      data: {
        status: 'LIABILITY_DETERMINED',
        responsibleParty: input.responsibleParty,
        responsibleEntityCode: input.responsibleEntityCode,
        responsibleEntityName: input.responsibleEntityName,
        liabilityRatioPercent: input.liabilityRatioPercent,
        rootCause: input.rootCause,
        approvedCompensationAmount: input.approvedCompensationAmount,
        penaltyAmount: input.penaltyAmount,
        adjudicationNotes: input.adjudicationNotes,
        adjudicatedAt: new Date(),
        adjudicatedBy: input.adjudicatedBy,
      },
    });
  }

  async approvePayment(id: string): Promise<CompensationClaim> {
    const item = await this.getById(id);

    return this.prisma.compensationClaim.update({
      where: { id: item.id },
      data: {
        status: 'APPROVED_COMPENSATION',
        merchantPaidAt: new Date(),
      },
    });
  }

  async settleDeduction(id: string): Promise<CompensationClaim> {
    const item = await this.getById(id);

    return this.prisma.compensationClaim.update({
      where: { id: item.id },
      data: {
        status: 'SETTLED',
        hubDeductedAt: new Date(),
      },
    });
  }

  async getHubStatistics(): Promise<HubClaimStatisticItem[]> {
    const claims = await this.prisma.compensationClaim.findMany();
    const shipments = await this.prisma.shipment.findMany({
      select: {
        code: true,
        currentStatus: true,
        metadata: true,
      },
    });

    const hubMap = new Map<string, { code: string; name: string; zone: string; count: number }>();

    for (const s of shipments) {
      const meta = (s.metadata as Record<string, any>) || {};
      const originCode = meta.originHubCode || meta.sender?.hubCode;
      const originName = meta.originHubName || meta.senderAddress || originCode;
      const destCode = meta.receiverHubCode || meta.receiver?.hubCode;
      const destName = meta.receiverHubName || meta.receiverAddress || destCode;

      if (originCode) {
        const existing = hubMap.get(originCode) || {
          code: originCode,
          name: originName,
          zone: originCode.startsWith('001') ? 'ZONE_NORTH' : originCode.startsWith('048') ? 'ZONE_CENTRAL' : 'ZONE_SOUTH',
          count: 0,
        };
        existing.count += 1;
        hubMap.set(originCode, existing);
      }

      if (destCode && destCode !== originCode) {
        const existing = hubMap.get(destCode) || {
          code: destCode,
          name: destName,
          zone: destCode.startsWith('001') ? 'ZONE_NORTH' : destCode.startsWith('048') ? 'ZONE_CENTRAL' : 'ZONE_SOUTH',
          count: 0,
        };
        existing.count += 1;
        hubMap.set(destCode, existing);
      }
    }

    const hubs = Array.from(hubMap.values());

    return hubs.map((h) => {
      const hubClaims = claims.filter(
        (c) => c.originHubCode === h.code || c.responsibleEntityCode === h.code,
      );

      const damagedCount = hubClaims.filter((c) => c.incidentType === 'DAMAGED').length;
      const lostCount = hubClaims.filter((c) => c.incidentType === 'LOST_IN_TRANSIT').length;
      const totalIncidentCount = damagedCount + lostCount;
      const totalCompensationCost = hubClaims.reduce(
        (sum, c) => sum + (c.approvedCompensationAmount || c.claimRequestedAmount || 0),
        0,
      );
      const penaltyAssignedAmount = hubClaims.reduce((sum, c) => sum + (c.penaltyAmount || 0), 0);
      const penaltyRecoveredAmount = hubClaims
        .filter((c) => Boolean(c.hubDeductedAt))
        .reduce((sum, c) => sum + (c.penaltyAmount || 0), 0);

      const rate = h.count > 0 ? (totalIncidentCount / h.count) * 100 : 0;
      const lossAndDamageRate = Number(rate.toFixed(3));

      let riskLevel: HubClaimStatisticItem['riskLevel'] = 'LOW';
      if (lossAndDamageRate > 0.04 || totalCompensationCost > 10000000) {
        riskLevel = 'CRITICAL';
      } else if (lossAndDamageRate > 0.02 || totalCompensationCost > 5000000) {
        riskLevel = 'HIGH';
      } else if (lossAndDamageRate > 0.01) {
        riskLevel = 'MEDIUM';
      }

      return {
        hubCode: h.code,
        hubName: h.name,
        zoneCode: h.zone,
        totalShipmentsHandled: h.count,
        damagedCount,
        lostCount,
        totalIncidentCount,
        totalCompensationCost,
        penaltyAssignedAmount,
        penaltyRecoveredAmount,
        lossAndDamageRate,
        riskLevel,
        topRootCause: hubClaims.length > 0 ? (hubClaims[0].rootCause || 'Vi phạm quy chuẩn đóng gói') : 'Không phát sinh sự cố',
      };
    });
  }
}
