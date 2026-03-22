import {
  Config,
  ConfigListFilters,
  ConfigWriteInput,
} from '../entities/config.entity';

export abstract class ConfigRepository {
  abstract list(filters?: ConfigListFilters): Promise<Config[]>;
  abstract findById(id: string): Promise<Config | null>;
  abstract findByKey(key: string): Promise<Config | null>;
  abstract create(input: ConfigWriteInput): Promise<Config>;
  abstract update(id: string, input: Partial<ConfigWriteInput>): Promise<Config>;
}
