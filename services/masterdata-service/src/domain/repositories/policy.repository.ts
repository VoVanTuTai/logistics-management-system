import {
  Policy,
  PolicyCreateInput,
  PolicyListQuery,
  PolicyStatus,
  PolicyUpdateInput,
} from '../entities/policy.entity';

export abstract class PolicyRepository {
  abstract listPublic(category?: string): Promise<Policy[]>;
  abstract findPublicBySlug(slug: string): Promise<Policy | null>;
  abstract listAdmin(query?: PolicyListQuery): Promise<{ items: Policy[]; total: number }>;
  abstract findById(id: string): Promise<Policy | null>;
  abstract findBySlug(slug: string): Promise<Policy | null>;
  abstract create(input: PolicyCreateInput, actorUsername?: string | null): Promise<Policy>;
  abstract update(
    id: string,
    input: PolicyUpdateInput,
    actorUsername?: string | null,
  ): Promise<Policy>;
  abstract updateStatus(
    id: string,
    status: PolicyStatus,
    actorUsername?: string | null,
  ): Promise<Policy>;
  abstract delete(id: string): Promise<boolean>;
}
