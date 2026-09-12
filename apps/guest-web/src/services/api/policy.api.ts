import { apiClient } from '../client';

export type PolicyCategory =
  | 'GENERAL'
  | 'SHIPMENT'
  | 'DELIVERY'
  | 'PROHIBITED_GOODS'
  | 'COMPENSATION'
  | 'RETURN'
  | 'CUSTOMER_RESPONSIBILITY'
  | 'COMPANY_RESPONSIBILITY';

export interface PublicPolicyItem {
  id: string;
  title: string;
  slug: string;
  category: PolicyCategory;
  summary: string | null;
  content: string;
  version: number;
  displayOrder: number;
  effectiveDate: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export const CATEGORY_NAMES: Record<PolicyCategory, string> = {
  GENERAL: 'Quy định chung',
  SHIPMENT: 'Gửi hàng & Tạo đơn',
  DELIVERY: 'Lấy hàng & Giao phát',
  PROHIBITED_GOODS: 'Hàng cấm & Hạn chế',
  COMPENSATION: 'Khiếu nại & Bồi thường',
  RETURN: 'Chuyển hoàn bưu gửi',
  CUSTOMER_RESPONSIBILITY: 'Nghĩa vụ khách hàng',
  COMPANY_RESPONSIBILITY: 'Trách nhiệm bưu chính',
};

export const listPublishedPolicies = async (category?: string): Promise<PublicPolicyItem[]> => {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  const data = await apiClient<PublicPolicyItem[]>(`/public/masterdata/policies${query}`, {
    method: 'GET',
  });
  return Array.isArray(data) ? data : [];
};

export const getPolicyBySlug = async (slug: string): Promise<PublicPolicyItem | null> => {
  try {
    return await apiClient<PublicPolicyItem>(
      `/public/masterdata/policies/${encodeURIComponent(slug)}`,
      { method: 'GET' },
    );
  } catch {
    return null;
  }
};

export const policyApi = {
  listPublishedPolicies,
  getPolicyBySlug,
};

