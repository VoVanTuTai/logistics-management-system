import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CustomerProfile,
  CustomerProfileListFilters,
  CustomerProfileWriteInput,
} from '../../domain/entities/customer-profile.entity';
import { CustomerProfileRepository } from '../../domain/repositories/customer-profile.repository';

@Injectable()
export class CustomerProfilesService {
  constructor(
    @Inject(CustomerProfileRepository)
    private readonly customerProfileRepository: CustomerProfileRepository,
  ) {}

  async list(filters: CustomerProfileListFilters = {}): Promise<CustomerProfile[]> {
    return this.customerProfileRepository.list(filters);
  }

  async getById(id: string): Promise<CustomerProfile> {
    const profile = await this.customerProfileRepository.findById(id);

    if (!profile) {
      throw new NotFoundException(`CustomerProfile with ID "${id}" was not found.`);
    }

    return profile;
  }

  async getByUserId(userId: string): Promise<CustomerProfile> {
    const profile = await this.customerProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException(`CustomerProfile for user "${userId}" was not found.`);
    }

    return profile;
  }

  async create(input: CustomerProfileWriteInput): Promise<CustomerProfile> {
    const normalizedInput = this.normalizeWriteInput(input);

    const existingByUserId = await this.customerProfileRepository.findByUserId(
      normalizedInput.userId,
    );
    if (existingByUserId) {
      throw new ConflictException(
        `CustomerProfile for user "${normalizedInput.userId}" already exists.`,
      );
    }

    if (normalizedInput.phone) {
      const existingByPhone = await this.customerProfileRepository.findByPhone(
        normalizedInput.phone,
      );
      if (existingByPhone) {
        throw new ConflictException(
          `CustomerProfile with phone "${normalizedInput.phone}" already exists.`,
        );
      }
    }

    return this.customerProfileRepository.create(normalizedInput);
  }

  async upsertByUserId(
    userId: string,
    input: CustomerProfileWriteInput,
  ): Promise<CustomerProfile> {
    const normalizedInput = this.normalizeWriteInput({
      ...input,
      userId,
    });

    return this.customerProfileRepository.upsertByUserId(userId, normalizedInput);
  }

  async update(
    id: string,
    input: Partial<CustomerProfileWriteInput>,
  ): Promise<CustomerProfile> {
    await this.getById(id);

    return this.customerProfileRepository.update(id, input);
  }

  async remove(
    id: string,
  ): Promise<{ deleted: boolean; customerProfileId: string | null }> {
    const deleted = await this.customerProfileRepository.remove(id);

    return {
      deleted,
      customerProfileId: deleted ? id : null,
    };
  }

  private normalizeWriteInput(
    input: CustomerProfileWriteInput,
  ): CustomerProfileWriteInput {
    const userId = input.userId?.trim();
    const fullName = input.fullName?.trim();

    if (!userId) {
      throw new BadRequestException('userId is required.');
    }

    if (!fullName) {
      throw new BadRequestException('fullName is required.');
    }

    return {
      userId,
      fullName,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      defaultAddress: input.defaultAddress?.trim() || null,
    };
  }
}
