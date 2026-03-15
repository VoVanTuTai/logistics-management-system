import type {
  CreateManifestInput,
  Manifest,
  ReceiveManifestInput,
  SealManifestInput,
  UpdateManifestInput,
} from '../entities/manifest.entity';

export abstract class ManifestRepository {
  abstract list(): Promise<Manifest[]>;
  abstract findById(id: string): Promise<Manifest | null>;
  abstract findByShipmentCode(shipmentCode: string): Promise<Manifest | null>;
  abstract create(input: CreateManifestInput): Promise<Manifest>;
  abstract update(id: string, input: UpdateManifestInput): Promise<Manifest>;
  abstract seal(id: string, input: SealManifestInput): Promise<Manifest>;
  abstract receive(id: string, input: ReceiveManifestInput): Promise<Manifest>;
}
