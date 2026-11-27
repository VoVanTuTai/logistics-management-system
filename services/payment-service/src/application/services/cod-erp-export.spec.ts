import * as assert from 'node:assert/strict';
import { test } from 'node:test';

import { CodService } from './cod.service';

function createCodServiceFixture() {
  const mockBatch = {
    id: 'batch_01',
    settlementCode: 'COD-20260518-003P001-AB12CD',
    reportDate: new Date('2026-05-18T00:00:00.000Z'),
    hubCode: '003P001',
    courierId: '30000001',
    totalAmount: 1750000,
    status: 'CONFIRMED' as const,
    qrUrl: null,
    transferMemo: 'COD-20260518-003P001-AB12CD',
    createdBy: 'ops_acc_01',
    confirmedBy: 'sepay_webhook',
    confirmedAt: new Date('2026-05-18T08:30:00.000Z'),
    confirmedNote: 'Auto reconciled',
    createdAt: new Date('2026-05-18T08:00:00.000Z'),
    updatedAt: new Date('2026-05-18T08:30:00.000Z'),
    items: [
      { id: 'i1', batchId: 'batch_01', codRecordId: 'c1', shipmentCode: 'SHP-01', amount: 1000000 },
      { id: 'i2', batchId: 'batch_01', codRecordId: 'c2', shipmentCode: 'SHP-02', amount: 750000 },
    ],
  };

  const codRecordRepository = {
    listForDailySettlement: async () => [],
    listSettlementBatches: async () => [mockBatch],
  } as never;

  const idempotencyRepository = {} as never;

  return new CodService(
    codRecordRepository,
    idempotencyRepository,
  );
}

test('TC-050: exports UTF-8 BOM MISA and SAP multi-bank ERP accounting CSV with debit 1121 / credit 3388', async () => {
  const service = createCodServiceFixture();

  const misa = await service.exportSettlementsErpCsv({
    date: '2026-05-18',
    hubCode: '003P001',
    format: 'MISA',
    bankCode: 'VCB',
  });
  assert.equal(misa.format, 'MISA');
  assert.equal(misa.bankCode, 'VCB');
  assert.equal(misa.rowCount, 1);
  assert.equal(misa.totalAmount, 1750000);
  assert.ok(misa.csv.startsWith('\uFEFFNgayChungTu,SoChungTu,DienGiai,TaiKhoanNo,TaiKhoanCo,SoTienVND'));
  assert.ok(misa.csv.includes(',1121,3388,1750000,VCB,'));

  const sap = await service.exportSettlementsErpCsv({
    date: '2026-05-18',
    format: 'SAP',
    bankCode: 'TCB',
  });
  assert.equal(sap.format, 'SAP');
  assert.equal(sap.bankCode, 'TCB');
  assert.ok(sap.csv.startsWith('\uFEFFPostingDate,DocumentNo,Reference,DebitGL,CreditGL,Amount,Currency'));
  assert.ok(sap.csv.includes(',1121,3388,1750000,VND,TCB,'));
});
