# Marketplace Order Integration API

Tai lieu nay mo ta hop dong API de san thuong mai dien tu gui don hang sang Nexus Express tao van don va, neu can, tao yeu cau lay hang.

Trang thai: Adapter `/merchant/integrations/*` da duoc implement trong `gateway-bff`; can deploy gateway va cau hinh credential/marketplace merchant production truoc khi mo outbound cho doi tac.

## 1. Base URL

Production:

```text
https://ops.nexus-ex.site
```

Sandbox/UAT:

```text
https://uat-api.nexus-ex.site
```

Neu chua co UAT domain, hai ben thong nhat domain/IP test rieng truoc khi go-live.

## 2. Authentication

Tat ca request tu san phai co API key va chu ky HMAC.

Headers bat buoc:

```http
X-Nexus-Partner-Code: SHOPEE
X-Nexus-Api-Key: <api_key>
X-Nexus-Timestamp: 2026-05-26T10:30:00+07:00
X-Nexus-Nonce: 8f3f7e66-8a4f-4f0d-a7c6-8c9d4d6c5d1a
X-Nexus-Signature: <hmac_sha256_signature>
Content-Type: application/json
```

Cach tinh signature:

```text
signature = HMAC_SHA256(
  secret,
  METHOD + "\n" +
  PATH + "\n" +
  X-Nexus-Timestamp + "\n" +
  X-Nexus-Nonce + "\n" +
  SHA256(raw_request_body)
)
```

Quy tac:

- `X-Nexus-Timestamp` chi hop le trong vong 5 phut.
- `X-Nexus-Nonce` khong duoc lap lai trong vong 24 gio.
- `raw_request_body` phai dung byte body thuc te gui len server.
- API key va secret duoc cap rieng cho tung san/tung shop group.

## 3. Idempotency

De tranh tao trung van don, moi don tu san phai co khoa idempotency:

```text
platform + shopId + externalOrderId
```

Client gui qua header:

```http
Idempotency-Key: SHOPEE:SHOP123:240526ABC
```

Neu request duoc gui lai voi cung `Idempotency-Key`, he thong tra ve cung `shipmentCode` da tao truoc do.

## 4. Create Order

Tao van don tu don hang ben san.

```http
POST /merchant/integrations/orders
```

### Request Body

```json
{
  "external": {
    "platform": "DT_COMMERCE",
    "shopId": "9f8a2776-a0d3-4013-ac02-6784166eadd6",
    "externalOrderId": "order-id",
    "externalOrderCode": "EMX9000004",
    "orderCreatedAt": "2026-05-26T10:20:00+07:00",
    "orderStatus": "READY_TO_SHIP"
  },
  "merchant": {
    "merchantId": "41100000",
    "shopName": "DT Commerce Marketplace"
  },
  "sender": {
    "name": "Seller contact name",
    "phone": "seller pickup phone",
    "address": "seller pickup address",
    "ward": "seller pickup ward",
    "district": "seller pickup district",
    "province": "Ho Chi Minh",
    "hubCode": "HCM-001"
  },
  "receiver": {
    "name": "Nguyen Van A",
    "phone": "0909000000",
    "address": "44 Ho Tung Mau, Cau Giay",
    "ward": "Dich Vong",
    "district": "Cau Giay",
    "province": "Ha Noi",
    "note": "Goi truoc khi giao"
  },
  "parcel": {
    "items": [
      {
        "sku": "SKU001",
        "name": "Ao thun",
        "quantity": 2,
        "unitPrice": 150000
      }
    ],
    "weightGram": 800,
    "lengthCm": 25,
    "widthCm": 20,
    "heightCm": 10,
    "declaredValue": 300000
  },
  "service": {
    "serviceType": "STANDARD",
    "pickupType": "PICKUP",
    "expectedPickupAt": "2026-05-26T14:00:00+07:00"
  },
  "payment": {
    "codAmount": 300000,
    "shippingFee": 30000,
    "payer": "RECEIVER"
  },
  "options": {
    "autoCreatePickup": true,
    "printLabelFormat": "A6"
  }
}
```

### Field Rules

| Field | Required | Note |
| --- | --- | --- |
| `external.platform` | Yes | Ma san, vi du `SHOPEE`, `TIKTOK`, `LAZADA`. |
| `external.shopId` | Yes | Ma seller/shop ben san, dung de doi soat va idempotency; voi DT_COMMERCE khong dung de map sang merchant Nexus rieng. |
| `external.externalOrderId` | Yes | Ma don duy nhat ben san. |
| `merchant.merchantId` | Yes | Ma merchant trong Nexus. Voi DT_COMMERCE la merchant marketplace co dinh `41100000`. |
| `sender.phone` | Yes | So dien thoai lay hang dong theo ho so seller/don hang. |
| `sender.address` | Yes | Dia chi lay hang dong theo ho so seller/don hang. |
| `receiver.name` | Yes | Ten nguoi nhan. |
| `receiver.phone` | Yes | So dien thoai nguoi nhan. |
| `receiver.address` | Yes | Dia chi giao hang. |
| `parcel.items` | Yes | It nhat 1 item. |
| `parcel.weightGram` | Yes | Trong luong gram, > 0. |
| `payment.codAmount` | No | Mac dinh `0` neu khong thu COD. |
| `service.serviceType` | Yes | `STANDARD`, `EXPRESS`, `SAME_DAY`. |

## 5. Create Order Response

Thanh cong:

```http
201 Created
```

```json
{
  "success": true,
  "data": {
    "shipmentCode": "SHP260526A1B2C3",
    "externalOrderId": "240526ABC",
    "platform": "SHOPEE",
    "status": "CREATED",
    "trackingUrl": "https://tracking.nexus-ex.site/SHP260526A1B2C3",
    "pickup": {
      "pickupCode": "PU2605260001",
      "status": "REQUESTED"
    },
    "label": {
      "format": "A6",
      "url": "https://ops.nexus-ex.site/merchant/shipment/shipments/SHP260526A1B2C3/label"
    },
    "createdAt": "2026-05-26T10:30:05+07:00"
  }
}
```

Neu request trung `Idempotency-Key`:

```http
200 OK
```

```json
{
  "success": true,
  "data": {
    "shipmentCode": "SHP260526A1B2C3",
    "externalOrderId": "240526ABC",
    "status": "CREATED",
    "idempotent": true
  }
}
```

## 6. Query Order

Tra cuu van don theo ma don ben san.

```http
GET /merchant/integrations/orders/{platform}/{shopId}/{externalOrderId}
```

Response:

```json
{
  "success": true,
  "data": {
    "shipmentCode": "SHP260526A1B2C3",
    "externalOrderId": "240526ABC",
    "currentStatus": "PICKUP_COMPLETED",
    "trackingUrl": "https://tracking.nexus-ex.site/SHP260526A1B2C3",
    "updatedAt": "2026-05-26T15:10:00+07:00"
  }
}
```

## 7. Cancel Order

Huy don khi don chua vao trang thai khong cho phep huy.

```http
POST /merchant/integrations/orders/{platform}/{shopId}/{externalOrderId}/cancel
```

Request:

```json
{
  "reason": "CUSTOMER_CANCELLED"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "shipmentCode": "SHP260526A1B2C3",
    "status": "CANCELLED",
    "cancelledAt": "2026-05-26T11:00:00+07:00"
  }
}
```

## 8. Error Response

Tat ca loi tra ve cung format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "receiver.phone is required",
    "details": [
      {
        "field": "receiver.phone",
        "reason": "required"
      }
    ],
    "requestId": "req_01HYZP7A4N"
  }
}
```

### Error Codes

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Payload thieu/sai dinh dang. |
| 401 | `UNAUTHORIZED` | API key khong hop le hoac thieu auth header. |
| 403 | `SIGNATURE_INVALID` | HMAC signature sai. |
| 404 | `MERCHANT_NOT_FOUND` | Merchant marketplace chua duoc cau hinh hoac merchantId khong dung. |
| 409 | `DUPLICATE_ORDER` | Don da ton tai nhung khac payload/idempotency. |
| 409 | `CANNOT_CANCEL` | Trang thai hien tai khong cho phep huy. |
| 422 | `UNSUPPORTED_SERVICE_TYPE` | Loai dich vu khong duoc ho tro. |
| 429 | `RATE_LIMITED` | Vuot gioi han request. |
| 500 | `INTERNAL_ERROR` | Loi noi bo. |
| 503 | `SERVICE_UNAVAILABLE` | He thong tam thoi khong san sang. |

## 9. Rate Limit

Mac dinh:

```text
100 requests/minute/shop
1000 requests/minute/partner
```

Khi vuot gioi han:

```http
429 Too Many Requests
Retry-After: 30
```

## 10. Curl Example

```bash
curl -X POST "https://ops.nexus-ex.site/merchant/integrations/orders" \
  -H "Content-Type: application/json" \
  -H "X-Nexus-Partner-Code: SHOPEE" \
  -H "X-Nexus-Api-Key: <api_key>" \
  -H "X-Nexus-Timestamp: 2026-05-26T10:30:00+07:00" \
  -H "X-Nexus-Nonce: 8f3f7e66-8a4f-4f0d-a7c6-8c9d4d6c5d1a" \
  -H "X-Nexus-Signature: <signature>" \
  -H "Idempotency-Key: SHOPEE:SHOP123:240526ABC" \
  --data @create-order.json
```

## 11. Mapping Vao He Thong Nexus

Khi nhan don tu san, Nexus can map sang service noi bo:

1. Tao shipment qua `shipment-service`.
2. Luu thong tin don san trong `metadata.external`, trong do `external.shopId` giu nguyen sellerId/shopId de doi soat.
3. Luu `merchant` la marketplace merchant co dinh neu partner la DT_COMMERCE.
4. Luu sender/receiver/parcel/payment/service trong `metadata`; `sender` co the thay doi theo tung don.
5. Neu `options.autoCreatePickup=true`, tao pickup request qua `pickup-service`.
6. Tra ve `shipmentCode` va `trackingUrl` cho san.

Endpoint noi bo hien co:

```http
POST /merchant/shipment/shipments
POST /merchant/pickup/pickups
```

Endpoint `/merchant/integrations/orders` la lop adapter de doi tac khong phai biet chi tiet cac service noi bo.

## 12. Go-Live Checklist

- Cap API key/secret cho doi tac.
- Cau hinh merchant marketplace co dinh cho DT_COMMERCE; khong map `external.shopId` thanh merchant rieng.
- Xac nhan hub routing theo `sender.province`/`sender.ward`, hoac thong nhat bang mapping provinceCode -> hubCode neu bat buoc gui `sender.hubCode`.
- Thong nhat service type va bang gia.
- Test tao don thuong, don COD, don huy, don lap idempotency.
- Test rate limit va retry.
- Test tracking URL.
- Chot webhook/callback neu san can nhan cap nhat trang thai tu Nexus.
