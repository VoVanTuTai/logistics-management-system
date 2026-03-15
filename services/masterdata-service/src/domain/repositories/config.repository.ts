import { Config, ConfigWriteInput } from '../entities/config.entity';

export abstract class ConfigRepository {
  abstract list(): Promise<Config[]>;
  abstract findById(id: string): Promise<Config | null>;
  abstract create(input: ConfigWriteInput): Promise<Config>;
  abstract update(id: string, input: Partial<ConfigWriteInput>): Promise<Config>;
}
