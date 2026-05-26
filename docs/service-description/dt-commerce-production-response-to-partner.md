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

## 2. Mapping Shop Production Dùng Để Test

Nexus sẽ cấp 1 shop production dùng riêng cho kiểm thử có kiểm soát.

```text
sellerId/shopId: CHO_CAP
shopName: CHO_CAP
merchantId: CHO_CAP
sender.name: CHO_CAP
sender.phone: CHO_CAP
sender.address: CHO_CAP
sender.ward: CHO_CAP
sender.district: CHO_CAP
sender.province: CHO_CAP
sender.hubCode: CHO_CAP
```

Trạng thái:

```text
sellerId/shopId: CHO_CAP
shopName: CHO_CAP
merchantId: CHO_CAP
senderHubCode: CHO_CAP
Đã có đầy đủ địa chỉ sender: chưa
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

sellerId/shopId: CHO_CAP
shopName: CHO_CAP
merchantId: CHO_CAP
senderHubCode: CHO_CAP
Đã có đầy đủ địa chỉ sender: chưa
```

---

## Việc Nexus Cần Hoàn Tất Trước Khi dt-commerce Gửi Đơn Test

- Cấp credential production qua kênh bảo mật riêng.
- Tạo/mapping 1 shop production dùng cho kiểm thử.
- Whitelist IP `103.179.172.220` hoặc xác nhận production không yêu cầu whitelist.
- Enable endpoint `GET /merchant/integrations/health`.
- Enable endpoint `POST /merchant/integrations/orders`.
- Đăng ký webhook `POST https://api.dt-commerce.site/api/v1/shipments/webhooks/nexus`.
- Gửi `webhook.ping` sau khi dt-commerce xác nhận đã bật nhận webhook.

*Nexus Express — Integration Team*
