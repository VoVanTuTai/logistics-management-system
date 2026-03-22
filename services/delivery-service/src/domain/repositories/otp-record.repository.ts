import type {
  OtpRecord,
  SendOtpInput,
  VerifyOtpInput,
} from '../entities/otp-record.entity';

export abstract class OtpRecordRepository {
  abstract createSent(input: SendOtpInput): Promise<OtpRecord>;

  abstract verifyLatestForShipment(input: VerifyOtpInput): Promise<OtpRecord>;
}
