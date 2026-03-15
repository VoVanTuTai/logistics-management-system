import { Zone, ZoneWriteInput } from '../entities/zone.entity';

export abstract class ZoneRepository {
  abstract list(): Promise<Zone[]>;
  abstract findById(id: string): Promise<Zone | null>;
  abstract create(input: ZoneWriteInput): Promise<Zone>;
  abstract update(id: string, input: Partial<ZoneWriteInput>): Promise<Zone>;
}
