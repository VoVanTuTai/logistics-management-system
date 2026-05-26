# Payment Service

COD (Cash on Delivery) payment management for Nexus Express System.

## Port

- Default: `3011`

## Database

- `payment_db` (PostgreSQL via Prisma)

## Setup

```bash
npm install
npm run db:prepare
npm run start:dev
```

For staging after the COD settlement schema change, run `npm run db:prepare`
inside `services/payment-service` before starting the service. This applies the
Prisma schema with `hubCode` on `CodRecord` plus settlement batch tables.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/cod/records` | Create COD record (internal, from event) |
| POST | `/cod/collect` | Courier confirms COD collection |
| POST | `/cod/remit` | Courier/Ops confirms cash remittance |
| GET | `/cod/shipment/:code` | Get COD record by shipment code |
| GET | `/cod/courier/:id` | List COD records by courier |
| GET | `/cod/summary/:id` | COD summary stats for courier |
| GET | `/cod/settlements/daily` | Daily COD settlement summary by date, hub and courier |
| POST | `/cod/settlements` | Create cash COD settlement batch and QR |
| GET | `/cod/settlements/:id/qr` | Get QR details for an existing settlement batch |
| POST | `/cod/settlements/:id/confirm` | Confirm batch remittance and mark records remitted |
| GET | `/cod/bank-info` | Company bank account info |
| GET | `/cod/qr?amount=X&memo=Y` | VietQR URL for bank transfer |

## Domain Events Published

- `cod.collected` — Courier confirmed payment collection
- `cod.collection_failed` — Collection failed (delivery failed)
- `cod.remitted` — Cash remitted to company

## Environment Variables

```
COMPANY_BANK_NAME=Vietcombank
COMPANY_BANK_ACCOUNT_NUMBER=1234567890
COMPANY_BANK_ACCOUNT_NAME=CONG TY TNHH NEXUS EXPRESS
COMPANY_BANK_BIN=970436
```

Update these with real company bank info for VietQR generation.
