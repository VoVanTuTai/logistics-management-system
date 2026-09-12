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

export interface PolicyVersion {
  id: string;
  policyId: string;
  version: number;
  title: string;
  category: PolicyCategory;
  summary: string | null;
  content: string;
  status: PolicyStatus;
  changeNote: string | null;
  createdBy: string | null;
  createdAt: Date;
}

export interface Policy {
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
  effectiveDate: Date | null;
  publishedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  versions?: PolicyVersion[];
}

export interface PolicyPublicView {
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

export interface PolicyAdminView {
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
  versions?: Array<{
    id: string;
    version: number;
    title: string;
    category: PolicyCategory;
    summary: string | null;
    status: PolicyStatus;
    changeNote: string | null;
    createdBy: string | null;
    createdAt: string;
  }>;
}

export interface PolicyCreateInput {
  title: string;
  slug?: string;
  category?: PolicyCategory;
  summary?: string | null;
  content: string;
  status?: PolicyStatus;
  displayOrder?: number;
  effectiveDate?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PolicyUpdateInput {
  title?: string;
  slug?: string;
  category?: PolicyCategory;
  summary?: string | null;
  content?: string;
  status?: PolicyStatus;
  displayOrder?: number;
  effectiveDate?: string | null;
  metadata?: Record<string, unknown> | null;
  changeNote?: string | null;
  createNewVersion?: boolean;
}

export interface PolicyListQuery {
  category?: PolicyCategory;
  status?: PolicyStatus;
  q?: string;
  page?: number;
  limit?: number;
}
