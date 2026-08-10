import * as assert from 'assert';

import {
  formatDistrictName,
  formatProvinceName,
  formatWardName,
  normalizeDistrictKey,
  normalizeWardKey,
  parseVietnameseAddress,
} from '../vietnamese-address-parser.utility';

export function runAddressParserTests(): void {
  // Test formatting
  assert.strictEqual(formatWardName('P. 02'), 'Phường 2');
  assert.strictEqual(formatWardName('P.05'), 'Phường 5');
  assert.strictEqual(formatWardName('Phường Bến Nghé'), 'Phường Bến Nghé');
  assert.strictEqual(formatWardName('Xã Tân Nhựt'), 'Xã Tân Nhựt');

  assert.strictEqual(formatDistrictName('Q. 01'), 'Quận 1');
  assert.strictEqual(formatDistrictName('Q.5'), 'Quận 5');
  assert.strictEqual(formatDistrictName('Quận Đống Đa'), 'Quận Đống Đa');

  assert.strictEqual(formatProvinceName('TPHCM'), 'Hồ Chí Minh');
  assert.strictEqual(formatProvinceName('TP. HCM'), 'Hồ Chí Minh');
  assert.strictEqual(formatProvinceName('HN'), 'Hà Nội');

  // Test normalized keys
  assert.strictEqual(normalizeWardKey('Phường 02'), '2');
  assert.strictEqual(normalizeWardKey('P. 2'), '2');
  assert.strictEqual(normalizeWardKey('Phường Bến Nghé'), 'BEN NGHE');
  assert.strictEqual(normalizeDistrictKey('Quận 01'), '1');
  assert.strictEqual(normalizeDistrictKey('Q. 1'), '1');

  // Test full parsing
  const stdResult = parseVietnameseAddress(
    '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
  );
  assert.strictEqual(stdResult.province, 'Hồ Chí Minh');
  assert.strictEqual(stdResult.district, 'Quận 1');
  assert.strictEqual(stdResult.ward, 'Phường Bến Thành');
  assert.strictEqual(stdResult.detail, '123 Nguyễn Trãi');

  const abbrevResult = parseVietnameseAddress('Số 45 Lê Lợi, P.02, Q.5, TPHCM');
  assert.strictEqual(abbrevResult.province, 'Hồ Chí Minh');
  assert.strictEqual(abbrevResult.district, 'Quận 5');
  assert.strictEqual(abbrevResult.ward, 'Phường 2');
  assert.strictEqual(abbrevResult.detail, 'Số 45 Lê Lợi');

  const fallbackResult = parseVietnameseAddress('123 Nguyễn Trãi', {
    province: 'Hà Nội',
    district: 'Quận Đống Đa',
    ward: 'Phường Láng Hạ',
  });
  assert.strictEqual(fallbackResult.province, 'Hà Nội');
  assert.strictEqual(fallbackResult.district, 'Quận Đống Đa');
  assert.strictEqual(fallbackResult.ward, 'Phường Láng Hạ');
}

runAddressParserTests();
