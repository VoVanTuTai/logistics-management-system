# Phản Hồi Onboarding Production — Nexus Express → dt-commerce

> Ngày phản hồi: 2026-05-26
> Từ: Nexus Express — Đội ngũ Kỹ thuật Tích hợp
> Đến: dt-commerce — Đội ngũ Kỹ thuật
> Chủ đề: Phản hồi thông tin production integration Nexus

Chào team dt-commerce,

Nexus đã nhận thông tin triển khai production Kubernetes của bên bạn và webhook URL:

```text
POST https://api.dt-commerce.site/api/v1/shipments/webhooks/nexus
```

Dưới đây là trạng thái phản hồi theo 5 nhóm thông tin bên bạn yêu cầu.

---

## 1. Credential Production

Credential production sẽ được Nexus gửi qua kênh bảo mật riêng, không gửi trong email/chat công khai.

```text
PROD_NEXUS_PARTNER_CODE=DT_COMMERCE
PROD_NEXUS_API_KEY=<gui_qua_kenh_bao_mat>
PROD_NEXUS_API_SECRET=<gui_qua_kenh_bao_mat>
PROD_NEXUS_WEBHOOK_SECRET=<gui_qua_kenh_bao_mat>
```

Trạng thái:

```text
Đã có credential: chưa gửi qua kênh bảo mật
```

---

## 2. Marketplace Merchant Production Dùng Để Test

Nexus sẽ dùng một merchant marketplace production cố định cho DT_COMMERCE. Seller/shop cụ thể vẫn nằm trong `external.shopId` để đối soát, còn địa chỉ lấy hàng lấy động từ hồ sơ seller trong dt-commerce.

```text
merchantId: 41100000
shopName: DT Commerce Marketplace
external.shopId: sellerId/shopId của dt-commerce
sender.*: địa chỉ lấy hàng động theo từng seller/don hang
sender.hubCode: không bắt buộc nếu Nexus route theo sender.province/sender.ward
```

Trạng thái:

```text
Marketplace merchantId: 41100000
external.shopId dùng cho đối soát seller: xác nhận
sender pickup address động theo đơn: xác nhận
senderHubCode: chờ chốt nếu production bắt buộc hubCode
```

---

## 3. Xác Nhận Kết Nối Production

Base URL production:

```text
https://ops.nexus-ex.site
```

Outbound IP dt-commerce cần whitelist:

```text
103.179.172.220
```

Endpoint cần kiểm tra:

```text
GET  /merchant/integrations/health
POST /merchant/integrations/orders
```

Trạng thái hiện tại:

```text
Whitelist IP: chưa xong
Endpoint production: chưa bật
```

Ghi chú: Nexus sẽ phản hồi lại trạng thái `đã bật` sau khi endpoint `/merchant/integrations/*` được enable trên production và health check nội bộ thành công.

---

## 4. Xác Nhận Test An Toàn

Quy tắc test production có kiểm soát:

```json
{
  "options": {
    "autoCreatePickup": false
  }
}
```

Với cấu hình trên, đơn test chỉ được dùng để tạo vận đơn/mapping kiểm thử và không được phát sinh pickup hoặc giao hàng thật.

Trạng thái:

```text
No-pickup: đã xác nhận theo nghiệp vụ, chờ xác nhận lại sau khi endpoint production bật
```

---

## 5. Xác Nhận Webhook

Webhook URL dt-commerce cung cấp:

```text
POST https://api.dt-commerce.site/api/v1/shipments/webhooks/nexus
```

Nexus sẽ đăng ký URL này cho partner `DT_COMMERCE` trên production. Sau khi dt-commerce thông báo đã bật nhận webhook, Nexus sẽ gửi `webhook.ping` để kiểm tra kết nối và chữ ký.

Trạng thái:

```text
Webhook: chưa đăng ký
```

---

## Tóm Tắt Cho dt-commerce

```text
Đã có credential: chưa
Whitelist IP: chưa xong
Endpoint production: chưa bật
No-pickup: đã xác nhận theo nghiệp vụ, chờ xác nhận lại sau khi endpoint production bật
Webhook: chưa đăng ký

Marketplace merchantId: 41100000
external.shopId dùng cho đối soát seller: xác nhận
sender pickup address động theo đơn: xác nhận
senderHubCode: chờ chốt nếu production bắt buộc hubCode
```

---

## Việc Nexus Cần Hoàn Tất Trước Khi dt-commerce Gửi Đơn Test

- Cấp credential production qua kênh bảo mật riêng.
- Cấu hình merchant marketplace production cố định `41100000`.
- Xác nhận routing theo `sender.province`/`sender.ward`, hoặc cấp mapping provinceCode -> hubCode nếu bắt buộc `sender.hubCode`.
- Whitelist IP `103.179.172.220` hoặc xác nhận production không yêu cầu whitelist.
- Enable endpoint `GET /merchant/integrations/health`.
- Enable endpoint `POST /merchant/integrations/orders`.
- Đăng ký webhook `POST https://api.dt-commerce.site/api/v1/shipments/webhooks/nexus`.
- Gửi `webhook.ping` sau khi dt-commerce xác nhận đã bật nhận webhook.

*Nexus Express — Integration Team*
