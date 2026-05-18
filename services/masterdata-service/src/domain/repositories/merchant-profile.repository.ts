import {
  MerchantProfile,
  MerchantProfileListFilters,
  MerchantProfileWriteInput,
} from '../entities/merchant-profile.entity';

export abstract class MerchantProfileRepository {
  abstract list(filters?: MerchantProfileListFilters): Promise<MerchantProfile[]>;
  abstract findById(id: string): Promise<MerchantProfile | null>;
  abstract findByUsername(username: string): Promise<MerchantProfile | null>;
  abstract findByCitizenId(citizenId: string): Promise<MerchantProfile | null>;
  abstract create(input: MerchantProfileWriteInput): Promise<MerchantProfile>;
  abstract update(
    id: string,
    input: Partial<MerchantProfileWriteInput>,
  ): Promise<MerchantProfile>;
  abstract upsertByUsername(
    username: string,
    input: MerchantProfileWriteInput,
  ): Promise<MerchantProfile>;
  abstract delete(id: string): Promise<boolean>;
}
