export type PolicyStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type PolicyCategory =
  | 'GENERAL'
  | 'SHIPMENT'
  | 'DELIVERY'
  | 'PROHIBITED_GOODS'
  | 'COMPENSATION'
  | 'RETURN'
  | 'CUSTOMER_RESPONSIBILITY'
  | 'COMPANY_RESPONSIBILITY';

export interface PolicyVersionDto {
  id: string;
  version: number;
  title: string;
  category: PolicyCategory;
  summary: string | null;
  status: PolicyStatus;
  changeNote: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface PolicyDto {
  id: string;
  title: string;
  slug: string;
  category: PolicyCategory;
  summary: string | null;
  content: string;
  status: PolicyStatus;
  version: number;
  displayOrder: number;
  metadata: Record<string, unknown> | null;
  effectiveDate: string | null;
  publishedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  versions?: PolicyVersionDto[];
}

export interface PolicyFilters {
  category?: PolicyCategory | '';
  status?: PolicyStatus | '';
  q?: string;
  page?: number;
  limit?: number;
}

export interface PolicyWriteInput {
  title: string;
  slug?: string;
  category: PolicyCategory;
  summary?: string | null;
  content: string;
  status?: PolicyStatus;
  displayOrder?: number;
  effectiveDate?: string | null;
  metadata?: Record<string, unknown> | null;
  changeNote?: string | null;
  createNewVersion?: boolean;
}

export const CATEGORY_LABELS: Record<PolicyCategory, { label: string; badgeClass: string }> = {
  GENERAL: { label: 'Quy định chung', badgeClass: 'badge-blue' },
  SHIPMENT: { label: 'Gửi hàng & Tạo đơn', badgeClass: 'badge-teal' },
  DELIVERY: { label: 'Lấy & Giao nhận', badgeClass: 'badge-indigo' },
  PROHIBITED_GOODS: { label: 'Hàng cấm / Hạn chế', badgeClass: 'badge-red' },
  COMPENSATION: { label: 'Khiếu nại & Bồi thường', badgeClass: 'badge-amber' },
  RETURN: { label: 'Chuyển hoàn', badgeClass: 'badge-purple' },
  CUSTOMER_RESPONSIBILITY: { label: 'Quyền & Nghĩa vụ KH', badgeClass: 'badge-emerald' },
  COMPANY_RESPONSIBILITY: { label: 'Miễn trừ trách nhiệm', badgeClass: 'badge-slate' },
};

export const STATUS_LABELS: Record<PolicyStatus, { label: string; badgeClass: string; color: string }> = {
  DRAFT: { label: 'Bản nháp (DRAFT)', badgeClass: 'badge-warning', color: '#f59e0b' },
  PUBLISHED: { label: 'Đã công bố (PUBLISHED)', badgeClass: 'badge-success', color: '#10b981' },
  ARCHIVED: { label: 'Đã lưu trữ (ARCHIVED)', badgeClass: 'badge-secondary', color: '#6b7280' },
};
