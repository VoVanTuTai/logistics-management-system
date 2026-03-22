import { createHash, timingSafeEqual } from 'crypto';

import { Injectable } from '@nestjs/common';

@Injectable()
export class HashService {
  digest(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  verify(value: string, hashedValue: string): boolean {
    const expected = Buffer.from(this.digest(value));
    const actual = Buffer.from(hashedValue);

    if (expected.length !== actual.length) {
      return false;
    }

    return timingSafeEqual(expected, actual);
  }
}
