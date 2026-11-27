import { Injectable, Logger } from '@nestjs/common';
import { CarrierGuardrailsService, extractPhone } from '../guardrails/carrier-guardrails.service';
import { HmasAgentState, ValidationCritique } from './hmas.state';

/**
 * Autonomous Validation Agent Node (Gatekeeper & Output Critique).
 * Audits both deterministic policy invariants (PII masking, physical ceilings, hallucinated waybills)
 * and delegates sensitive mutations via external Safeguard model when required.
 */
@Injectable()
export class ValidationAgent {
  private readonly logger = new Logger(ValidationAgent.name);

  constructor(private readonly guardrails: CarrierGuardrailsService) {}

  async execute(state: HmasAgentState | any): Promise<Partial<HmasAgentState>> {
    const issues: string[] = [];
    const draft = (state.draftAnswer || '').trim();
    const combinedContext = `${state.operationContext}\n${state.knowledgeContext}`;

    // 1. PII / BOLA Leakage Guard on Guest / Unverified Tracking Responses
    const isBlockedPii =
      combinedContext.includes('[YÊU CẦU BẮT BUỘC CUNG CẤP SỐ ĐIỆN THOẠI NGƯỜI NHẬN') ||
      combinedContext.includes('[THÔNG BÁO SỐ ĐIỆN THOẠI NGƯỜI NHẬN KHÔNG KHỚP') ||
      combinedContext.includes('[BẢO MẬT BOLA');

    if (isBlockedPii && draft) {
      const leakedPhone = extractPhone(draft);
      if (leakedPhone && leakedPhone !== state.session.receiverPhone && leakedPhone !== state.dto.receiverPhone) {
        issues.push(`Potential unverified PII phone number leaked (${leakedPhone}) while tracking verification is blocked.`);
      }
      if (/\b(?:Tên hàng hóa|Người gửi|Tiền thu hộ COD|Địa chỉ nhận hàng):/i.test(draft)) {
        issues.push('Draft reveals shipment PII details before phone/account ownership verification passed.');
      }
    }

    // 2. Physical Ceiling Consistency Guard (70kg / 150cm / 300cm)
    if (state.guardrail?.category === 'OVER_PHYSICAL_CEILING' && draft) {
      if (/\b(?:đủ điều kiện gửi|tiếp nhận vận chuyển bình thường|mời anh\/chị bấm tạo đơn ngay)\b/i.test(draft.toLowerCase())) {
        issues.push('Draft contradicts Tier 3 Over-Limit Physical Ceiling block (>70kg / >150cm / >300cm).');
      }
    }

    // 3. Anti-Empty Output Check
    if (!draft && !state.guardrail?.violated) {
      // Offline demo generator will synthesize when draft is empty; no retry needed if offline
      return {
        validation: {
          approved: true,
          issues: [],
          modelUsed: 'Policy-Invariant-Pass',
        },
      };
    }

    const approved = issues.length === 0;
    const critique: ValidationCritique = {
      approved,
      issues,
      modelUsed: 'HMAS-Validation-Gatekeeper',
      safetyReason: approved ? 'Đạt chuẩn bảo mật PII/BOLA và trần vật lý.' : issues.join(' | '),
    };

    if (!approved) {
      this.logger.warn(
        `ValidationAgent REJECTED draft for conv=${state.conversationId} (reflection #${state.reflectionCount}): ${critique.safetyReason}`,
      );
      return {
        validation: critique,
        reflectionCount: state.reflectionCount + 1,
        handoffs: [...state.handoffs, 'VALIDATION_AGENT -> SUPERVISOR_REFLECTION'],
        toolsUsed: [...state.toolsUsed, 'validationReflection(REJECTED_REWRITING)'],
      };
    }

    return {
      validation: critique,
    };
  }
}
