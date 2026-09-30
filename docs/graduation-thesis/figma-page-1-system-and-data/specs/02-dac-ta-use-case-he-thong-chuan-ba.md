# TÀI LIỆU ĐẶC TẢ USE CASE TỔNG QUÁT HỆ THỐNG NEXUS LOGISTICS (CHUẨN BA / SRS)

> **Tài liệu Phân tích Nghiệp vụ Phần mềm (Business Analysis & System Requirements Specification - BA/SRS)**  
> **Dự án:** Hệ thống Quản trị & Vận hành Logistics Đa kênh Nexus Enterprise (Nexus Enterprise Logistics Platform)  
> **Tiêu chuẩn chất lượng phần mềm:** IEEE 830 / ISO/IEC 25010 / UML 2.5 Specification (Object Management Group - OMG)  
> **Cơ sở dữ liệu kiểm chứng:** File đặc tả chức năng thực tế [`Danh_sach_chuc_nang_theo_Actor.xlsx`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/diagrams/Danh_sach_chuc_nang_theo_Actor.xlsx) (Cả 2 sheet `Danh sach chuc nang` và `Tong quan`)  
> **Sơ đồ Vector Blueprint tham chiếu:** [`01-use-case-general-system.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/diagrams/01-use-case-general-system.svg) (Bản vẽ REV.18 — Expanded Layout $6000 \times 3900\text{ px}$, Khoảng cách phân hệ $\ge 180\text{ px}$)  
> **Phiên bản tài liệu:** 8.0 (Definitive Production Alignment — Khớp chuẩn 1:1 toàn bộ 82 chức năng thực có, 7 Tác nhân, 6 Phân hệ nghiệp vụ & Cổng Xác thực Trung tâm)

---

## 1. CƠ SỞ KHOA HỌC & KIẾN TRÚC PHẦN MỀM TỔNG THỂ

Hệ thống **Nexus Enterprise Logistics Platform** là giải pháp nền tảng phục vụ chuỗi cung ứng thương mại điện tử đa kênh và chuyển phát bưu chính liên tỉnh. Toàn bộ các chức năng và tác nhân được thiết kế, kiểm thử và ánh xạ 1:1 với hiện trạng mã nguồn thực tế:

### 1.1. Mạng lưới 15 Backend Microservices
1. `gateway-bff (:3000)`: API Gateway trung tâm, điều phối xác thực, PII Sanitizer và AI streaming.
2. `auth-service (:3001)`: Quản lý phiên làm việc Opaque Bearer token, RBAC, tài khoản và audit logs.
3. `masterdata-service (:3002)`: Danh mục bưu cục Hubs 4 cấp, phân vùng zones, cấu hình hệ thống, hồ sơ merchant và danh mục lý do NDR.
4. `pricing-service (:3003)`: Động cơ tính cước IATA, thể tích quy đổi $VW = (D \times R \times C)/6000$, phụ phí và bảo hiểm.
5. `shipment-service (:3004)`: Vòng đời vận đơn, yêu cầu sửa đổi thông tin (change requests), hủy đơn, và in phiếu gửi A6/A7/hàng loạt.
6. `pickup-service (:3005)`: Quản lý lịch hẹn lấy hàng tận nơi từ người gửi / Merchant.
7. `scan-service (:3006)`: Quét mã vạch tiếp nhận gom hàng, Inbound, Outbound và viễn trắc GPS thời gian thực.
8. `manifest-service (:3007)`: Đóng gói bao tải trung chuyển Manifest, niêm kẹp chì an ninh và cấp tem niêm phong xe tải `XT`.
9. `dispatch-service (:3008)`: Phân công ca vận chuyển, gán việc shipper lấy & phát, và tối ưu hóa tuyến đường giao.
10. `delivery-service (:3010)`: Vận hành giao hàng chặng cuối (last-mile), e-POD, chụp ảnh & chữ ký số, xác thực OTP 6 số, báo thất bại NDR và chuyển hoàn RTS.
11. `payment-service (:3009)`: Thu hộ COD tiền mặt, nộp tiền VietQR động, webhook ngân hàng SePay, quyết toán ca và giải ngân đối soát.
12. `tracking-service (:3011)`: Lộ trình bưu gửi công khai (khử PII Masking) và viễn trắc nội bộ (full telemetry audit).
13. `reporting-service (:3012)`: Báo cáo dòng tiền, lịch sử đối soát SePay/VietQR, khấu trừ cước hoàn phân tầng và hiệu suất vận hành.
14. `chatbot-service (:3013)`: Động cơ phân loại ý định (Intent), trích xuất thực thể, Hybrid RAG 768-D Vector Embeddings, 5 Dynamic Tools, Fallback Google Gemini 3 Flash / OpenAI GPT-4o-mini, và SSE Streaming.
15. `notification-service (:3014)`: Quản lý thông báo đa kênh thời gian thực qua Webhook và SSE.

### 1.2. Mạng lưới 06 Ứng dụng Client (Frontend / Mobile)
1. `guest-web (:5177)`: Cổng tra cứu công khai, ước tính cước IATA, hỏi đáp AI Chatbot và tạo đơn vãng lai.
2. `customer-mobile (:8082)`: Ứng dụng di động dành cho Khách hàng cá nhân C-End (tạo đơn gửi lẻ, quản lý sổ địa chỉ, tra cứu realtime, xác thực OTP 6 số).
3. `merchant-web (:5174)`: Cổng thông tin dành cho Chủ Shop B2B (tạo đơn Web Portal, in phiếu A6/A7, in hàng loạt, quản lý đơn, đặt pickup, đối soát COD).
4. `courier-mobile (:8081)`: Ứng dụng dành cho Bưu tá giao nhận (quản lý nhiệm vụ ngày, bản đồ lộ trình GPS, scan pickup, liên hệ người nhận, xác thực OTP, chụp ảnh POD & chữ ký, xác nhận giao thành công, báo cáo NDR, hẹn lại ngày phát Reschedule, thu COD tiền mặt, nộp tiền VietQR).
5. `ops-web (:5173)`: Cổng điều hành dành cho Nhân sự Bưu cục & Hub (Dashboard thời gian thực, tra cứu nội bộ, tạo đơn tại quầy, duyệt pickup, gán việc shipper, manifest & đóng bao, seal kẹp chì, xe Linehaul, tem XT, xuất kho Outbound, nhập kho Inbound, gỡ bao chia chọn, handoff bưu tá, xử lý NDR, đối soát giải ngân COD, duyệt quyết toán thủ công).
6. `admin-web (:5175)`: Cổng quản trị dành cho System Admin (quản trị tài khoản toàn hệ thống, phân công nhân sự & tuyến, RBAC Matrix, permission override mobile, Hubs 4 cấp, Zones địa lý, danh mục lý do NDR, cấu hình tham số hệ thống, kiểm toán nhật ký Audit Log).

---

## 2. DANH MỤC 7 TÁC NHÂN THỰC TẾ TRÊN HỆ THỐNG (7 REAL ACTORS)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc **bám sát 100% dữ liệu từ file Excel `Danh_sach_chuc_nang_theo_Actor.xlsx`** (kết hợp đối chiếu giữa 2 sheet `Danh sach chuc nang` và `Tong quan` cùng mã nguồn `courier-mobile`), chia thành 7 tác nhân với trách nhiệm và quyền hạn độc lập:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       7 TÁC NHÂN THỰC TẾ TRÊN HỆ THỐNG NEXUS LOGISTICS                                  │
├────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────┤
│ NHÓM ĐỐI TÁC NGOẠI VI & NGƯỜI DÙNG CUỐI                │ NHÓM VẬN HÀNH, QUẢN TRỊ NỘI BỘ & HỆ THỐNG NỀN TẢNG            │
├────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 1. Khách Vãng Lai (GUEST)                              │ 4. Nhân Viên Vận Hành (OPS STAFF - Bưu Cục & Hub)              │
│    • Ứng dụng: guest-web :5177                         │    • Ứng dụng: ops-web :5173 & courier-mobile                 │
│    • Số chức năng: 9 UCs                               │    • Số chức năng: 19 UCs                                     │
│                         ▲                              │                         │                                     │
│                         │ <<generalizes>>              │                         ▼ <<generalizes>>                     │
│ 2. Khách Hàng Cá Nhân (CUSTOMER C-End)                 │ 5. Nhân Viên Giao Hàng (SHIPPER - Chặng Cuối)                 │
│    • Ứng dụng: customer-mobile :8082                   │    • Ứng dụng: courier-mobile :8081                           │
│    • Số chức năng: 6 UCs                               │    • Số chức năng: 13 UCs                                     │
│                                                        ├───────────────────────────────────────────────────────────────┤
│ 3. Người Gửi Hàng (MERCHANT - Chủ Shop B2B)            │ 6. Quản Trị Viên (SYSTEM ADMIN)                               │
│    • Ứng dụng: merchant-web :5174                      │    • Ứng dụng: admin-web :5175                                 │
│    • Số chức năng: 15 UCs                              │    • Số chức năng: 11 UCs                                     │
│                                                        ├───────────────────────────────────────────────────────────────┤
│                                                        │ 7. Trợ Lý AI & Hệ Thống (SYSTEM & AI ENGINE)                  │
│                                                        │    • Nền tảng: chatbot-service & microservices nền            │
│                                                        │    • Số chức năng: 9 UCs                                      │
└────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────┘
```

### Bảng Phân Tích Chi Tiết 7 Tác Nhân

| STT | Tác nhân (Actor) | Mã Role / Client App | Số UC trong Excel | Trách nhiệm & Quyền hạn nghiệp vụ thực tế |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Khách Vãng Lai** | `GUEST`<br>`guest-web :5177` | **9** | Người dùng vãng lai truy cập tự do không cần đăng nhập. Tra cứu trạng thái bưu kiện công khai (`UC-AI-01a`), ước tính cước phí IATA (`UC-AI-02`), tạo đơn hàng vãng lai (`UC-ORD-01c`), trò chuyện trợ lý AI 24/7 (`UC-AI-04`), thực thi 5 Dynamic Tools AI (`UC-AI-05`). |
| **2** | **Khách Hàng Cá Nhân** | `CUSTOMER`<br>`customer-mobile :8082` | **6** | Người dùng cá nhân cài app di động. **Kế thừa toàn bộ quyền của Khách Vãng Lai (`CUSTOMER ──▷ GUEST`)**. Thực hiện tạo đơn gửi lẻ (`UC-ORD-01b`), quản lý sổ địa chỉ (`UC-ORD-08`), tra cứu hành trình realtime (`UC-AI-01b`), xác thực mã OTP 6 số nhận hàng (`UC-DEL-03`), đăng nhập bảo mật (`UC-AUTH-01`). |
| **3** | **Người Gửi Hàng (Merchant)** | `MERCHANT`<br>`merchant-web :5174` | **15** | Chủ shop kinh doanh B2B. Đăng nhập/xuất (`UC-AUTH-01`, `UC-AUTH-02`), quản lý tài khoản (`UC-AUTH-03`), tạo đơn Web Portal (`UC-ORD-01a`), in vận đơn hàng loạt (`UC-ORD-06`), quản lý/lọc đơn (`UC-ORD-02`), sửa thông tin đơn (`UC-ORD-03`), hủy đơn (`UC-ORD-04`), đặt lịch hẹn pickup (`UC-ORD-09`), tra cứu tiến độ (`UC-AI-01c`), in phiếu A6/A7 (`UC-ORD-05`), gắn tem Dễ Vỡ (`UC-ORD-07`), theo dõi chuyển hoàn RTS (`UC-DEL-08`), lịch sử đối soát SePay/VietQR (`UC-FIN-05`), khấu trừ cước hoàn phân tầng (`UC-FIN-07`). |
| **4** | **Nhân Viên Giao Hàng (Shipper)** | `SHIPPER`<br>`courier-mobile :8081` | **13** | Bưu tá chặng cuối tại hiện trường. Đăng nhập/xuất (`UC-AUTH-01`, `UC-AUTH-02`), quản lý danh sách nhiệm vụ ngày (`UC-DEL-01`), bản đồ lộ trình giao hàng GPS (`UC-DEL-01a`), xác nhận lấy hàng Scan Pickup (`UC-HUB-02c`), liên hệ người nhận (`UC-DEL-02`), xác thực OTP 6 số (`UC-DEL-03`), chụp ảnh POD & chữ ký số (`UC-DEL-04`), xác nhận giao thành công (`UC-DEL-05`), cập nhật sự cố NDR (`UC-DEL-06`), hẹn lại ngày phát Reschedule (`UC-DEL-06a`), thu COD tiền mặt (`UC-FIN-01`), nộp tiền COD VietQR (`UC-FIN-02`). |
| **5** | **Nhân Viên Vận Hành (Ops Staff)** | `OPS`<br>`ops-web :5173` | **19** | Nhân sự điều hành tại bưu cục và kho trung chuyển Hub. **Kế thừa quyền bưu tá hiện trường (`OPS ──▷ SHIPPER`)**. Giám sát Dashboard thời gian thực (`UC-HUB-01`), tra cứu hành trình nội bộ (`UC-HUB-01a`), tạo đơn tại quầy Walk-in (`UC-HUB-01b`), duyệt yêu cầu lấy hàng (`UC-HUB-02a`), gán việc shipper lấy & phát (`UC-HUB-02b`), bảng kê manifest & đóng bao (`UC-HUB-02`), đóng seal niêm kẹp chì (`UC-HUB-03`), quản lý xe Linehaul (`UC-HUB-04`), cấp tem xe tải XT (`UC-HUB-05`), xuất kho Outbound (`UC-HUB-06`), nhập kho Inbound (`UC-HUB-07`), gỡ bao chia chọn (`UC-HUB-08`), handoff bưu tá (`UC-HUB-09`), xử lý sự cố NDR (`UC-DEL-07`), tạo chuyển hoàn RTS (`UC-DEL-08`), đối soát giải ngân COD & VietQR (`UC-FIN-04`), duyệt quyết toán COD thủ công (`UC-FIN-03`). |
| **6** | **Quản Trị Viên (System Admin)** | `SYSTEM_ADMIN`<br>`admin-web :5175` | **11** | Quản trị viên cấp cao toàn hệ thống. Quản trị tài khoản toàn hệ thống (`UC-ADM-01`), phân công nhân sự & tuyến (`UC-ADM-02`), quản trị phân quyền RBAC Matrix (`UC-ADM-03`), phân quyền mobile override (`UC-ADM-04`), quản lý danh mục Hub 4 cấp (`UC-ADM-05`), quản lý khu vực / Zone địa lý (`UC-ADM-06`), quản lý danh mục lý do NDR (`UC-ADM-07`), cấu hình tham số hệ thống (`UC-ADM-08`), kiểm toán nhật ký hệ thống Audit Log (`UC-ADM-09`), đăng nhập/xuất (`UC-AUTH-01`, `UC-AUTH-02`). |
| **7** | **Trợ Lý AI & Hệ Thống (System & AI Engine)** | `SYSTEM_AI`<br>`chatbot & backend` | **9** | Tác nhân hỗ trợ tự động hóa (Supporting System Actor). Động cơ định giá chuẩn hóa IATA $V/6000$ (`UC-AI-03`), truy xuất tri thức bưu chính Hybrid RAG (`UC-AI-06`), thực thi 5 Dynamic Tools (`UC-AI-05`), cơ chế Fallback Gemini Flash / GPT-4o-mini, SSE Streaming & cách ly session (`UC-AI-07`), chuyển giao sự kiện Outbox Relay & RabbitMQ (`UC-ADM-10`), chiếu dữ liệu Read Model Timeline & KPI (`UC-ADM-11`), khớp nối SePay tự động & khấu trừ cước hoàn (`UC-FIN-06`). |

---

## 3. CẤU TRÚC 6 PHÂN HỆ NGHIỆP VỤ & CỔNG XÁC THỰC BẢO MẬT (PACKAGES)

Hệ thống được tổ chức khoa học theo 6 Business Packages cộng với Central Authentication & Security Gateway:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             RANH GIỚI HỆ THỐNG: NEXUS ENTERPRISE LOGISTICS PLATFORM                                     │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                          ★ CỔNG XÁC THỰC & BẢO MẬT HỆ THỐNG (auth-service • gateway-bff)                                │
│   • UC-AUTH-01: Đăng nhập hệ thống (Core Auth Hub)                                                                     │
│   • UC-AUTH-02: Đăng xuất hệ thống ──<<extend>>──▷ UC-AUTH-01                                                          │
│   • UC-AUTH-03: Quản lý thông tin tài khoản ──<<include>>──▷ UC-AUTH-01                                                 │
├──────────────────────────────────────────┬──────────────────────────────────────────┬──────────────────────────────────┤
│ CỘT TRÁI (LEFT COLUMN)                   │ CỘT TRUNG TÂM (CENTER COLUMN)            │ CỘT PHẢI (RIGHT COLUMN)          │
├──────────────────────────────────────────┼──────────────────────────────────────────┼──────────────────────────────────┤
│ PHÂN HỆ 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG  │ PHÂN HỆ 4: TÀI CHÍNH, THU HỘ COD         │ PHÂN HỆ 2: BƯU CỤC, ĐIỀU PHỐI &  │
│ (shipment-service • pickup-service)      │ & ĐỐI SOÁT                               │ TRUNG CHUYỂN                     │
│  [UC-ORD-01] Tạo đơn gửi (<<abstract>>)  │ (payment-service • reporting-service)    │ (scan • manifest • dispatch)     │
│   ├── UC-ORD-01a: Tạo đơn Web Portal     │  • UC-FIN-01: Thu hộ tiền mặt COD        │  • UC-HUB-01: Dashboard vận hành │
│   ├── UC-ORD-01b: Tạo đơn gửi hàng lẻ    │  • UC-FIN-02: Nộp COD qua VietQR         │  • UC-HUB-01a: Tra cứu nội bộ    │
│   └── UC-ORD-01c: Tạo đơn vãng lai       │  • UC-FIN-03: Duyệt quyết toán thủ công  │  • UC-HUB-01b: Tạo đơn tại quầy  │
│  • UC-ORD-02: Quản lý & Lọc đơn          │  • UC-FIN-04: Đối soát giải ngân VietQR  │  • UC-HUB-02a: Duyệt pickup      │
│  • UC-ORD-03: Yêu cầu đổi thông tin giao │  • UC-FIN-05: Lịch sử đối soát SePay     │  • UC-HUB-02b: Gán việc shipper  │
│  • UC-ORD-04: Hủy đơn hàng               │  • UC-FIN-06: Khớp nối SePay tự động     │  • UC-HUB-02c: Xác nhận lấy hàng │
│  • UC-ORD-05: In phiếu gửi A6/A7         │  • UC-FIN-07: Khấu trừ hoàn phân tầng    │  • UC-HUB-02: Bảng kê manifest   │
│  • UC-ORD-06: In vận đơn hàng loạt       │                                          │  • UC-HUB-03: Đóng seal niêm chì │
│  • UC-ORD-07: Gắn tem Hàng Dễ Vỡ         │                                          │  • UC-HUB-04: Tuyến Linehaul     │
│  • UC-ORD-08: Quản lý sổ địa chỉ         │                                          │  • UC-HUB-05: Cấp tem niêm xe XT │
│  • UC-ORD-09: Đặt lịch hẹn lấy hàng      │                                          │  • UC-HUB-06: Xuất kho Outbound  │
│                                          │                                          │  • UC-HUB-07: Nhập kho Inbound   │
│                                          │                                          │  • UC-HUB-08: Gỡ bao chia chọn   │
│                                          │                                          │  • UC-HUB-09: Handoff bưu tá     │
├──────────────────────────────────────────┼──────────────────────────────────────────┼──────────────────────────────────┤
│ PHÂN HỆ 5: TRỢ LÝ AI LOGISTICS RAG       │                                          │ PHÂN HỆ 3: GIAO HÀNG CHẶNG CUỐI  │
│ & TRA CỨU HÀNH TRÌNH                     │                                          │ & XỬ LÝ SỰ CỐ                    │
│ (chatbot-service • tracking-service)     │                                          │ (delivery-service • shipment)    │
│  [UC-AI-01] Tra cứu hành trình (Abs)     │                                          │  • UC-DEL-01: Quản lý nhiệm vụ   │
│   ├── UC-AI-01a: Tra cứu công khai       │                                          │  • UC-DEL-01a: Bản đồ GPS        │
│   ├── UC-AI-01b: Tra cứu realtime        │                                          │  • UC-DEL-02: Liên hệ người nhận │
│   └── UC-AI-01c: Tra cứu Merchant        │                                          │  • UC-DEL-03: Xác thực OTP 6 số  │
│  • UC-AI-02: Ước tính cước phí IATA      │                                          │  • UC-DEL-04: Chụp ảnh POD & Ký  │
│  • UC-AI-03: Động cơ IATA V/6000         │                                          │  • UC-DEL-05: Giao thành công    │
│  • UC-AI-04: Trò chuyện AI 24/7          │                                          │  • UC-DEL-06: Báo sự cố NDR      │
│  • UC-AI-05: Thực thi 5 Dynamic Tools    │                                          │  • UC-DEL-06a: Hẹn lại ngày phát │
│  • UC-AI-06: Truy xuất Hybrid RAG        │                                          │  • UC-DEL-07: Xử lý sự cố NDR    │
│  • UC-AI-07: SSE Streaming & Session     │                                          │  • UC-DEL-08: Tạo chuyển hoàn RTS│
│                                          ├──────────────────────────────────────────┴──────────────────────────────────┤
│                                          │ PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG, RBAC & CẤU HÌNH (masterdata • auth-service)   │
│                                          │  • UC-ADM-01: Quản trị tài khoản toàn hệ thống  • UC-ADM-06: Quản lý khu vực Zone           │
│                                          │  • UC-ADM-02: Phân công nhân sự & Tuyến         • UC-ADM-07: Danh mục lý do NDR             │
│                                          │  • UC-ADM-03: Quản trị phân quyền RBAC Matrix   • UC-ADM-08: Cấu hình tham số hệ thống      │
│                                          │  • UC-ADM-04: Phân quyền mobile override        • UC-ADM-09: Kiểm toán nhật ký hệ thống     │
│                                          │  • UC-ADM-05: Quản lý danh mục Hub 4 cấp        • UC-ADM-10: Outbox Relay & RabbitMQ        │
│                                          │                                                 • UC-ADM-11: Read Model Timeline & KPI      │
└──────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. BẢNG ÁNH XẠ 1:1 TOÀN BỘ 82 CHỨC NĂNG THỰC TẾ (TRACEABILITY MATRIX)

Toàn bộ 82 chức năng trong file Excel `Danh_sach_chuc_nang_theo_Actor.xlsx` và mã nguồn thực tế được mô hình hóa thành các Use Cases chuẩn UML 2.5 với quan hệ kết hợp (Association) tường minh:

### 4.1. Khách Vãng Lai (Guest) — 9 Chức năng
| STT Excel | Tên chức năng trong Excel | Mã Use Case | Phân hệ (Package) | Mối quan hệ trong UML 2.5 |
| :---: | :--- | :---: | :---: | :--- |
| **#1** | Tra cứu bưu kiện công khai | `UC-AI-01a` | P5: AI & Tracking | Kế thừa từ `UC-AI-01: Tra cứu hành trình bưu phẩm` |
| **#2** | Tính cước tự động chuẩn IATA | `UC-AI-02` | P5: AI & Tracking | `<<include>>` sang `UC-AI-03: Động cơ cước IATA V/6000` |
| **#3** | Tạo đơn hàng khách vãng lai | `UC-ORD-01c` | P1: Đơn hàng | Kế thừa từ `UC-ORD-01: Tạo đơn gửi bưu phẩm` |
| **#4** | Cửa sổ trò chuyện trợ lý AI | `UC-AI-04` | P5: AI & Tracking | `<<include>>` sang `UC-AI-05: Thực thi 5 Dynamic Tools AI` |
| **#5** | Tool tra cứu bưu kiện AI | `UC-AI-05` | P5: AI & Tracking | Dynamic Tool: `track_shipment` |
| **#6** | Tool ước tính cước phí AI | `UC-AI-05` | P5: AI & Tracking | Dynamic Tool: `calculate_shipping_rate` |
| **#7** | Tool tra cứu hàng cấm gửi AI | `UC-AI-05` | P5: AI & Tracking | Dynamic Tool: `get_prohibited_goods_policy` |
| **#8** | Tool chính sách bồi thường AI | `UC-AI-05` | P5: AI & Tracking | Dynamic Tool: `get_compensation_claim_policy` |
| **#9** | Tool tìm bưu cục gần nhất AI | `UC-AI-05` | P5: AI & Tracking | Dynamic Tool: `find_nearest_post_office` |

### 4.2. Khách Hàng Cá Nhân (Customer C-End) — 6 Chức năng
| STT Excel | Tên chức năng trong Excel | Mã Use Case | Phân hệ (Package) | Mối quan hệ trong UML 2.5 |
| :---: | :--- | :---: | :---: | :--- |
| **-** | *(Kế thừa tính năng Khách Vãng Lai)* | `CUSTOMER ──▷ GUEST` | Toàn hệ thống | Kế thừa toàn bộ quyền tra cứu và tư vấn công khai |
| **#1** | Tạo đơn gửi hàng lẻ | `UC-ORD-01b` | P1: Đơn hàng | Kế thừa từ `UC-ORD-01: Tạo đơn gửi bưu phẩm` |
| **#2** | Tính cước tự động chuẩn IATA | `UC-AI-02` | P5: AI & Tracking | Kế thừa qua `CUSTOMER ──▷ GUEST` |
| **#3** | Tra cứu hành trình realtime | `UC-AI-01b` | P5: AI & Tracking | Kế thừa từ `UC-AI-01: Tra cứu hành trình bưu phẩm` |
| **#4** | Quản lý sổ địa chỉ | `UC-ORD-08` | P1: Đơn hàng | Association trực tiếp từ `Khách Hàng Cá Nhân` |
| **#5** | Cửa sổ chat nổi trợ lý AI | `UC-AI-04` | P5: AI & Tracking | Kế thừa qua `CUSTOMER ──▷ GUEST` |
| **#6** | Xác thực nhận hàng OTP 6 số | `UC-DEL-03` | P3: Giao hàng & NDR | Được `UC-DEL-05: Xác nhận giao thành công` `<<include>>` |

### 4.3. Người Gửi Hàng (Merchant / Chủ Shop B2B) — 15 Chức năng
| STT Excel | Tên chức năng trong Excel | Mã Use Case | Phân hệ (Package) | Mối quan hệ trong UML 2.5 |
| :---: | :--- | :---: | :---: | :--- |
| **#1** | Đăng nhập hệ thống | `UC-AUTH-01` | Auth Gateway | Core Hub, kết nối qua hành lang bảo mật |
| **#2** | Đăng xuất hệ thống | `UC-AUTH-02` | Auth Gateway | `<<extend>>` sang `UC-AUTH-01` |
| **#3** | Quản lý thông tin tài khoản | `UC-AUTH-03` | Auth Gateway | `<<include>>` sang `UC-AUTH-01` |
| **#4** | Tạo đơn hàng (Portal Web) | `UC-ORD-01a` | P1: Đơn hàng | Kế thừa từ `UC-ORD-01: Tạo đơn gửi bưu phẩm` |
| **#5** | In vận đơn hàng loạt | `UC-ORD-06` | P1: Đơn hàng | `<<extend>>` sang `UC-ORD-02: Quản lý danh sách & Lọc đơn` |
| **#6** | Quản lý & Lọc danh sách đơn | `UC-ORD-02` | P1: Đơn hàng | Association trực tiếp từ `Merchant` |
| **#7** | Sửa thông tin giao hàng | `UC-ORD-03` | P1: Đơn hàng | Association trực tiếp từ `Merchant` |
| **#8** | Hủy đơn hàng | `UC-ORD-04` | P1: Đơn hàng | Association trực tiếp từ `Merchant` |
| **#9** | Đặt lịch hẹn lấy hàng Pickup | `UC-ORD-09` | P1: Đơn hàng | Association trực tiếp từ `Merchant` |
| **#10**| Tra cứu tiến độ (Merchant) | `UC-AI-01c` | P5: AI & Tracking | Kế thừa từ `UC-AI-01: Tra cứu hành trình bưu phẩm` |
| **#11**| In phiếu gửi chuẩn A6/A7 | `UC-ORD-05` | P1: Đơn hàng | `<<include>>` từ `UC-ORD-01: Tạo đơn gửi bưu phẩm` |
| **#12**| Gắn tem Hàng Dễ Vỡ | `UC-ORD-07` | P1: Đơn hàng | `<<extend>>` sang `UC-ORD-01: Tạo đơn gửi bưu phẩm` |
| **#13**| Quản lý & Theo dõi chuyển hoàn | `UC-DEL-08` | P3: Giao hàng & NDR | Được `UC-DEL-07: Xử lý sự cố NDR` `<<include>>` |
| **#14**| Lịch sử đối soát SePay/VietQR | `UC-FIN-05` | P4: Tài chính & COD | Association trực tiếp từ `Merchant` |
| **#15**| Khấu trừ cước hoàn phân tầng | `UC-FIN-07` | P4: Tài chính & COD | `<<extend>>` sang `UC-FIN-05` |

### 4.4. Nhân Viên Giao Hàng (Shipper / Chặng Cuối) — 13 Chức năng
| STT Excel | Tên chức năng trong Excel | Mã Use Case | Phân hệ (Package) | Mối quan hệ trong UML 2.5 |
| :---: | :--- | :---: | :---: | :--- |
| **#1** | Đăng nhập hệ thống | `UC-AUTH-01` | Auth Gateway | Core Hub, kết nối qua hành lang bảo mật |
| **#2** | Đăng xuất hệ thống | `UC-AUTH-02` | Auth Gateway | `<<extend>>` sang `UC-AUTH-01` |
| **#3** | Quản lý nhiệm vụ lấy/giao | `UC-DEL-01` | P3: Giao hàng & NDR | Association trực tiếp từ `Shipper` |
| **#4** | Bản đồ lộ trình giao hàng GPS | `UC-DEL-01a` | P3: Giao hàng & NDR | Association trực tiếp từ `Shipper`, `<<extend>>` sang `UC-DEL-01` |
| **#5** | Xác nhận lấy hàng (Scan Pickup) | `UC-HUB-02c` | P2: Bưu cục & Hub | `<<include>>` sang `UC-HUB-02b: Gán việc shipper` |
| **#6** | Liên hệ người nhận | `UC-DEL-02` | P3: Giao hàng & NDR | Association trực tiếp từ `Shipper` |
| **#7** | Xác thực mã OTP 6 chữ số | `UC-DEL-03` | P3: Giao hàng & NDR | `<<include>>` từ `UC-DEL-05: Xác nhận giao thành công` |
| **#8** | Chụp ảnh POD & Chữ ký số | `UC-DEL-04` | P3: Giao hàng & NDR | `<<include>>` từ `UC-DEL-05: Xác nhận giao thành công` |
| **#9** | Xác nhận đã giao thành công | `UC-DEL-05` | P3: Giao hàng & NDR | Core Hub của P3, kết nối trực tiếp từ `Shipper` |
| **#10**| Cập nhật NDR / Báo sự cố | `UC-DEL-06` | P3: Giao hàng & NDR | Association trực tiếp từ `Shipper`, `<<extend>>` sang `UC-DEL-05` |
| **#11**| Hẹn lại ngày phát (Reschedule) | `UC-DEL-06a` | P3: Giao hàng & NDR | Association trực tiếp từ `Shipper`, `<<extend>>` sang `UC-DEL-06` |
| **#12**| Thu hộ tiền mặt COD | `UC-FIN-01` | P4: Tài chính & COD | Association trực tiếp từ `Shipper` |
| **#13**| Nộp tiền COD qua VietQR | `UC-FIN-02` | P4: Tài chính & COD | `<<include>>` sang `UC-FIN-01` |

### 4.5. Nhân Viên Vận Hành (Ops Staff - Bưu Cục & Hub) — 19 Chức năng
| STT Excel | Tên chức năng trong Excel | Mã Use Case | Phân hệ (Package) | Mối quan hệ trong UML 2.5 |
| :---: | :--- | :---: | :---: | :--- |
| **-** | *(Kế thừa quyền Bưu tá gom/phát)* | `OPS ──▷ SHIPPER` | Hiện trường | Kế thừa quyền gom/phát trên `courier-mobile` |
| **#1** | Đăng nhập hệ thống | `UC-AUTH-01` | Auth Gateway | Core Hub, kết nối qua hành lang bảo mật |
| **#2** | Đăng xuất hệ thống | `UC-AUTH-02` | Auth Gateway | `<<extend>>` sang `UC-AUTH-01` |
| **#3** | Giám sát Dashboard thời gian thực | `UC-HUB-01` | P2: Bưu cục & Hub | Association trực tiếp từ `Ops Staff` |
| **#4** | Tra cứu hành trình nội bộ | `UC-HUB-01a` | P2: Bưu cục & Hub | Association trực tiếp từ `Ops Staff` |
| **#5** | Tạo đơn hàng tại quầy (Walk-in) | `UC-HUB-01b` | P2: Bưu cục & Hub | Association trực tiếp từ `Ops Staff` |
| **#6** | Duyệt yêu cầu lấy hàng Pickup | `UC-HUB-02a` | P2: Bưu cục & Hub | `<<include>>` sang `UC-HUB-02b` |
| **#7** | Gán việc shipper lấy & phát | `UC-HUB-02b` | P2: Bưu cục & Hub | Association trực tiếp từ `Ops Staff` |
| **#8** | Bảng kê manifest & Đóng bao | `UC-HUB-02` | P2: Bưu cục & Hub | Được `UC-HUB-06` và `UC-HUB-07` `<<include>>` |
| **#9** | Đóng seal niêm kẹp chì an ninh | `UC-HUB-03` | P2: Bưu cục & Hub | `<<include>>` từ `UC-HUB-02: Bảng kê manifest` |
| **#10**| Quản lý chuyến xe Linehaul | `UC-HUB-04` | P2: Bưu cục & Hub | Kết nối qua hành lang khe trống giữa Hàng 3 & 4 |
| **#11**| Cấp tem niêm phong xe tải (XT) | `UC-HUB-05` | P2: Bưu cục & Hub | `<<include>>` từ `UC-HUB-04: Tuyến Linehaul` |
| **#12**| Quét xuất kho Outbound | `UC-HUB-06` | P2: Bưu cục & Hub | `<<include>>` sang `UC-HUB-02` |
| **#13**| Quét nhập kho Inbound | `UC-HUB-07` | P2: Bưu cục & Hub | `<<include>>` sang `UC-HUB-02` và `UC-HUB-09` |
| **#14**| Gỡ bao & Kiểm đếm chia chọn | `UC-HUB-08` | P2: Bưu cục & Hub | `<<include>>` từ `UC-HUB-09: Handoff bưu tá` |
| **#15**| Quét bàn giao bưu kiện (handoff) | `UC-HUB-09` | P2: Bưu cục & Hub | Kết nối qua hành lang khe trống giữa Hàng 6 & 7 |
| **#16**| Xử lý sự cố phát thất bại (NDR) | `UC-DEL-07` | P3: Giao hàng & NDR | Kết nối qua hành lang ngang giữa P2 và P3 |
| **#17**| Quản lý & Tạo chuyển hoàn RTS | `UC-DEL-08` | P3: Giao hàng & NDR | `<<include>>` từ `UC-DEL-07: Xử lý sự cố NDR` |
| **#18**| Đối soát giải ngân COD & VietQR | `UC-FIN-04` | P4: Tài chính & COD | Kết nối qua hành lang ngang vào Cột 2 của P4 |
| **#19**| Phê duyệt quyết toán COD thủ công| `UC-FIN-03` | P4: Tài chính & COD | Kết nối qua hành lang phải của P4 vào Hàng 3 |

### 4.6. Quản Trị Viên (System Admin) — 11 Chức năng
| STT Excel | Tên chức năng trong Excel | Mã Use Case | Phân hệ (Package) | Mối quan hệ trong UML 2.5 |
| :---: | :--- | :---: | :---: | :--- |
| **#1** | Đăng nhập hệ thống | `UC-AUTH-01` | Auth Gateway | Core Hub, kết nối qua hành lang bảo mật |
| **#2** | Đăng xuất hệ thống | `UC-AUTH-02` | Auth Gateway | `<<extend>>` sang `UC-AUTH-01` |
| **#3** | Quản trị tài khoản toàn hệ thống | `UC-ADM-01` | P6: Quản trị & RBAC | Association trực tiếp từ `System Admin` |
| **#4** | Phân công nhân sự & Tuyến | `UC-ADM-02` | P6: Quản trị & RBAC | `<<include>>` từ `UC-ADM-01` |
| **#5** | Quản trị phân quyền RBAC Matrix | `UC-ADM-03` | P6: Quản trị & RBAC | `<<include>>` từ `UC-ADM-01` |
| **#6** | Phân quyền mobile override | `UC-ADM-04` | P6: Quản trị & RBAC | `<<extend>>` sang `UC-ADM-03` |
| **#7** | Quản lý danh mục Hub 4 cấp | `UC-ADM-05` | P6: Quản trị & RBAC | Association trực tiếp từ `System Admin` |
| **#8** | Quản lý khu vực / Zone địa lý | `UC-ADM-06` | P6: Quản trị & RBAC | `<<include>>` từ `UC-ADM-05` |
| **#9** | Danh mục lý do giao NDR | `UC-ADM-07` | P6: Quản trị & RBAC | Association trực tiếp từ `System Admin` |
| **#10**| Cấu hình tham số hệ thống | `UC-ADM-08` | P6: Quản trị & RBAC | Association trực tiếp từ `System Admin` |
| **#11**| Kiểm toán nhật ký hệ thống | `UC-ADM-09` | P6: Quản trị & RBAC | Association trực tiếp từ `System Admin` |

### 4.7. Trợ Lý AI & Hệ Thống (System & AI Engine) — 9 Chức năng
| STT Excel | Tên chức năng trong Excel | Mã Use Case | Phân hệ (Package) | Mối quan hệ trong UML 2.5 |
| :---: | :--- | :---: | :---: | :--- |
| **#1** | Động cơ định giá chuẩn IATA | `UC-AI-03` | P5: AI & Tracking | Association từ `Supporting System` qua hành lang đáy |
| **#2** | Truy xuất tri thức Hybrid RAG | `UC-AI-06` | P5: AI & Tracking | `<<include>>` từ `UC-AI-05: Thực thi 5 Dynamic Tools` |
| **#3** | Thực thi 5 Dynamic Tools AI | `UC-AI-05` | P5: AI & Tracking | Association từ `Supporting System` qua hành lang đáy |
| **#4** | Fallback mô hình ngôn ngữ LLM | `UC-AI-06` | P5: AI & Tracking | Tích hợp bên trong khối RAG & Fallback |
| **#5** | Phản hồi dạng dòng SSE Streaming | `UC-AI-07` | P5: AI & Tracking | `<<include>>` từ `UC-AI-05` |
| **#6** | Cách ly phiên trò chuyện an toàn | `UC-AI-07` | P5: AI & Tracking | Tích hợp bên trong cơ chế quản lý Session |
| **#7** | Chuyển giao Outbox Relay RabbitMQ| `UC-ADM-10` | P6: Quản trị & RBAC | Association từ `Supporting System` qua hành lang đáy |
| **#8** | Chiếu Read Model Timeline & KPI | `UC-ADM-11` | P6: Quản trị & RBAC | `<<include>>` từ `UC-ADM-10` |
| **#9** | Khớp nối SePay & Khấu trừ hoàn | `UC-FIN-06` | P4: Tài chính & COD | Association từ `Supporting System` qua hành lang đáy |

---

## 5. BẢNG TRUY XUẤT CONTROLLER & ENDPOINT MICROSERVICES

| Mã UC | Tên Trường hợp Sử dụng (Use Case) | Microservice Phụ Trách | Controller / Service | Endpoint & HTTP Method |
| :---: | :--- | :---: | :--- | :--- |
| `UC-AUTH-01` | Đăng nhập hệ thống | `auth-service (:3001)` | `auth.controller.ts` | `POST /auth/login` |
| `UC-AUTH-02` | Đăng xuất hệ thống | `auth-service (:3001)` | `auth.controller.ts` | `POST /auth/logout` |
| `UC-AUTH-03` | Quản lý thông tin tài khoản | `auth-service (:3001)` | `auth.controller.ts` | `GET/PUT /auth/own-profile` |
| `UC-ORD-01a` | Tạo đơn Web Portal | `shipment-service (:3004)` | `shipment.controller.ts` | `POST /shipments` |
| `UC-ORD-01b` | Tạo đơn gửi hàng lẻ | `shipment-service (:3004)` | `shipment.controller.ts` | `POST /shipments/retail` |
| `UC-ORD-01c` | Tạo đơn khách vãng lai | `shipment-service (:3004)` | `shipment.controller.ts` | `POST /shipments/guest` |
| `UC-ORD-02` | Quản lý danh sách & Lọc đơn | `shipment-service (:3004)` | `shipment.controller.ts` | `GET /shipments` |
| `UC-ORD-03` | Yêu cầu đổi thông tin giao | `shipment-service (:3004)` | `change-request.controller.ts`| `POST /change-requests` |
| `UC-ORD-04` | Hủy đơn hàng | `shipment-service (:3004)` | `shipment.controller.ts` | `POST /shipments/:id/cancel` |
| `UC-ORD-05` | In phiếu gửi chuẩn A6/A7 | `gateway-bff (:3000)` | `merchant-integrations.ts` | `POST /merchant/labels/print` |
| `UC-ORD-06` | In vận đơn hàng loạt | `gateway-bff (:3000)` | `merchant-integrations.ts` | `POST /merchant/labels/bulk` |
| `UC-ORD-07` | Gắn tem Hàng Dễ Vỡ | `shipment-service (:3004)` | `shipment.controller.ts` | `PATCH /shipments/:id/fragile` |
| `UC-ORD-08` | Quản lý sổ địa chỉ | `shipment-service (:3004)` | `address-book.controller.ts` | `GET/POST /addresses` |
| `UC-ORD-09` | Đặt lịch hẹn lấy hàng Pickup | `pickup-service (:3005)` | `pickup.controller.ts` | `POST /pickups` |
| `UC-HUB-01` | Giám sát Dashboard vận hành | `gateway-bff (:3000)` | `ops-dashboard.controller.ts` | `GET /ops/dashboard/realtime` |
| `UC-HUB-01a`| Tra cứu hành trình nội bộ | `tracking-service (:3011)` | `tracking.controller.ts` | `GET /tracking/internal/:code` |
| `UC-HUB-01b`| Tạo đơn tại quầy (Walk-in) | `shipment-service (:3004)` | `shipment.controller.ts` | `POST /shipments/walk-in` |
| `UC-HUB-02` | Bảng kê manifest & Đóng bao | `manifest-service (:3007)` | `manifest.controller.ts` | `POST /manifests/bagging` |
| `UC-HUB-02a`| Phê duyệt yêu cầu lấy hàng | `pickup-service (:3005)` | `pickup.controller.ts` | `PATCH /pickups/:id/approve` |
| `UC-HUB-02b`| Gán việc shipper lấy & phát | `dispatch-service (:3008)` | `dispatch.controller.ts` | `POST /dispatch/assign` |
| `UC-HUB-02c`| Xác nhận lấy (Scan Pickup) | `scan-service (:3006)` | `scan.controller.ts` | `POST /scans/pickup` |
| `UC-HUB-03` | Đóng seal niêm kẹp chì | `manifest-service (:3007)` | `manifest.controller.ts` | `POST /manifests/seal` |
| `UC-HUB-04` | Quản lý chuyến xe Linehaul | `manifest-service (:3007)` | `linehaul.controller.ts` | `GET/POST /linehaul/trips` |
| `UC-HUB-05` | Cấp tem niêm phong xe (XT) | `manifest-service (:3007)` | `linehaul.controller.ts` | `POST /linehaul/vehicle-seal` |
| `UC-HUB-06` | Quét xuất kho Outbound | `scan-service (:3006)` | `scan.controller.ts` | `POST /scans/outbound` |
| `UC-HUB-07` | Quét nhập kho Inbound | `scan-service (:3006)` | `scan.controller.ts` | `POST /scans/inbound` |
| `UC-HUB-08` | Gỡ bao & Kiểm đếm chia chọn | `manifest-service (:3007)` | `manifest.controller.ts` | `POST /manifests/unbag` |
| `UC-HUB-09` | Bàn giao bưu tá (handoff) | `dispatch-service (:3008)` | `dispatch.controller.ts` | `POST /dispatch/handoff` |
| `UC-DEL-01` | Quản lý danh sách nhiệm vụ | `delivery-service (:3010)` | `delivery.controller.ts` | `GET /delivery/tasks/today` |
| `UC-DEL-01a`| Bản đồ lộ trình giao hàng GPS | `delivery-service (:3010)` & `courier-mobile` | `delivery.controller.ts` & `delivery-map.screen.tsx` | `GET /delivery/tasks/route-map` |
| `UC-DEL-02` | Liên hệ người nhận | `delivery-service (:3010)` | `delivery.controller.ts` | `POST /delivery/call-mask` |
| `UC-DEL-03` | Xác thực mã OTP 6 chữ số | `delivery-service (:3010)` | `delivery.controller.ts` | `POST /delivery/verify-otp` |
| `UC-DEL-04` | Chụp ảnh POD & Chữ ký số | `delivery-service (:3010)` | `delivery.controller.ts` | `POST /delivery/upload-pod` |
| `UC-DEL-05` | Xác nhận giao thành công | `delivery-service (:3010)` | `delivery.controller.ts` | `POST /delivery/success` |
| `UC-DEL-06` | Cập nhật sự cố thất bại NDR | `delivery-service (:3010)` | `delivery.controller.ts` | `POST /delivery/fail` |
| `UC-DEL-06a`| Hẹn lại ngày phát (Reschedule) | `delivery-service (:3010)` & `courier-mobile` | `delivery.controller.ts` & `delivery-reschedule.tsx` | `POST /delivery/reschedule` |
| `UC-DEL-07` | Xử lý sự cố phát thất bại | `delivery-service (:3010)` | `ndr-resolution.ts` | `PATCH /delivery/ndr/:id/resolve` |
| `UC-DEL-08` | Quản lý & Tạo chuyển hoàn RTS | `delivery-service (:3010)` | `rts.controller.ts` | `POST /delivery/rts` |
| `UC-FIN-01` | Thu hộ tiền mặt COD | `payment-service (:3009)` | `cod.controller.ts` | `POST /cod/collect-cash` |
| `UC-FIN-02` | Nộp tiền COD qua VietQR | `payment-service (:3009)` | `cod.controller.ts` | `POST /cod/generate-qr` |
| `UC-FIN-03` | Duyệt quyết toán COD thủ công | `payment-service (:3009)` | `cod.controller.ts` | `POST /cod/remittance/approve` |
| `UC-FIN-04` | Đối soát giải ngân & VietQR | `payment-service (:3009)` | `cod.controller.ts` | `POST /cod/settlements/disburse` |
| `UC-FIN-05` | Lịch sử đối soát SePay/VietQR | `payment-service (:3009)` | `statement.controller.ts` | `GET /cod/statements/history` |
| `UC-FIN-06` | Khớp nối SePay tự động | `payment-service (:3009)` | `sepay-webhook.controller.ts` | `POST /webhooks/sepay` |
| `UC-FIN-07` | Khấu trừ cước hoàn phân tầng | `reporting-service (:3012)` | `settlement.controller.ts` | `POST /settlement/rts-deduct` |
| `UC-AI-01a` | Tra cứu trạng thái bưu kiện | `tracking-service (:3011)` | `tracking.controller.ts` | `GET /tracking/public/:code` |
| `UC-AI-01b` | Tra cứu hành trình realtime | `tracking-service (:3011)` | `tracking.controller.ts` | `GET /tracking/realtime/:code` |
| `UC-AI-01c` | Tra cứu tiến độ (Merchant) | `tracking-service (:3011)` | `tracking.controller.ts` | `GET /tracking/merchant/:code` |
| `UC-AI-02` | Ước tính cước phí IATA | `pricing-service (:3003)` | `pricing.controller.ts` | `POST /quotes` |
| `UC-AI-03` | Động cơ cước IATA V/6000 | `pricing-service (:3003)` | `pricing.engine.ts` | $\max(W_{\text{act}}, \frac{D \cdot R \cdot C}{6000})$ |
| `UC-AI-04` | Trò chuyện trợ lý AI 24/7 | `chatbot-service (:3013)` | `chat.controller.ts` | `POST /ai-assistant/chat/stream` |
| `UC-AI-05` | Thực thi 5 Dynamic Tools AI | `chatbot-service (:3013)` | `tools/` | Function Calling execution |
| `UC-AI-06` | Truy xuất RAG & Fallback LLM | `chatbot-service (:3013)` | `rag.service.ts` | Vector Embeddings Cosine Search |
| `UC-AI-07` | SSE Streaming & Session | `chatbot-service (:3013)` | `stream.service.ts` | Server-Sent Events Pipe |
| `UC-ADM-01` | Quản trị tài khoản toàn hệ thống| `auth-service (:3001)` | `users.controller.ts` | `GET/POST/PUT /users` |
| `UC-ADM-02` | Phân công nhân sự & Tuyến | `masterdata-service (:3002)` | `staff.controller.ts` | `POST /masterdata/staff/assign` |
| `UC-ADM-03` | Quản trị phân quyền RBAC | `auth-service (:3001)` | `rbac.controller.ts` | `GET/PUT /auth/rbac-matrix` |
| `UC-ADM-04` | Phân quyền mobile override | `auth-service (:3001)` | `mobile-override.ts` | `POST /auth/mobile-override` |
| `UC-ADM-05` | Quản lý danh mục Hub 4 cấp | `masterdata-service (:3002)` | `hub.controller.ts` | `GET/POST/PUT /masterdata/hubs` |
| `UC-ADM-06` | Quản lý khu vực / Zone | `masterdata-service (:3002)` | `zone.controller.ts` | `GET/POST/PUT /masterdata/zones` |
| `UC-ADM-07` | Danh mục lý do giao NDR | `masterdata-service (:3002)` | `ndr-reason.controller.ts` | `GET/POST/PUT /masterdata/ndr` |
| `UC-ADM-08` | Cấu hình tham số hệ thống | `masterdata-service (:3002)` | `config.controller.ts` | `GET/PUT /masterdata/configs` |
| `UC-ADM-09` | Kiểm toán nhật ký hệ thống | `auth-service (:3001)` | `audit.controller.ts` | `GET /auth/admin-audit` |
| `UC-ADM-10` | Outbox Relay & RabbitMQ | `backend background` | `outbox-relay.worker.ts` | At-least-once message dispatch |
| `UC-ADM-11` | Read Model Timeline & KPI | `backend background` | `read-model.consumer.ts` | CQRS Projection Update |

---

## 6. KẾT LUẬN & ĐÁNH GIÁ CHUẨN MỰC TÀI LIỆU BA

1. **Chuẩn mực OMG UML 2.5:**
   - Phân biệt rõ ràng quan hệ Association, Generalization (thực chất qua cây kế thừa đa hình), Dependency `<<include>>` (bước con bắt buộc) và `<<extend>>` (bước mở rộng có điều kiện).
   - Tuyệt đối không lạm dụng "Login Spaghetti": Phân quyền bảo mật được quản trị tại Central Auth Gateway kết hợp tiền điều kiện (Pre-conditions) trong hồ sơ đặc tả chức năng.
2. **Chuẩn mực Bản vẽ Kỹ thuật Công nghiệp (Industrial Line Art):**
   - Không sử dụng màu mè AI (AI hallucinated gradient/icons).
   - Đường nét đen trắng kỹ thuật cao monochrome, viền nét rõ ràng, phân cấp trực quan theo độ dày stroke: Phân hệ (1.4px dash), Use Case Core (2.4px), Use Case Chuẩn (1.3px), Use Case Mở rộng (1.2px dash), Use Case Abstract (nền xám nhẹ `<<abstract>>`).
3. **Chuẩn mực Vector Tương thích 100% Figma:**
   - Loại bỏ hoàn toàn thẻ `<marker>` (thường bị lỗi mất đầu mũi tên khi import vào Figma).
   - Thay thế toàn bộ bằng thẻ `<polygon>` vector hình học tọa độ thực, đảm bảo hiển thị hoàn hảo trên mọi phần mềm đồ họa vector chuyên nghiệp (Figma, Adobe Illustrator, Inkscape).
4. **Bảo đảm Zero-Crossing (Không Giao Cắt Lộn Xộn):**
   - Áp dụng triệt để định tuyến hành lang vuông góc (Orthogonal Corridor Routing) và sắp xếp Use Case theo ái lực miền tác nhân (Domain Affinity Ordering).
   - 100% đường liên kết không cắt ngang qua bất kỳ hình elip hay phân hệ nào khác.
5. **Bố Cục Không Gian Thoáng Đạt & Khoảng Cách Phân Hệ Rộng Rãi ($\ge 180\text{ px}$):**
   - Kích thước canvas mở rộng lên $6000 \times 3900\text{ px}$ (ranh giới hệ thống $4880 \times 3300\text{ px}$).
   - Khoảng cách giữa các cột phân hệ (Horizontal Gutters): **$180\text{ px}$** (Cột 1 sang Cột 2 $X \in [2140, 2320]$, Cột 2 sang Cột 3 $X \in [3420, 3600]$).
   - Khoảng cách giữa các tầng phân hệ (Vertical Gutters): **$180\text{ px}$** tại đại lộ ngang trung tâm ($Y \in [1360, 1540]$) và **$160\text{ px}$** giữa Phân hệ 3 và Phân hệ 6 ($Y \in [2400, 2560]$).
   - Các tuyến liên kết song song được cấp luồng di chuyển cách nhau $20\text{--}40\text{ px}$, không chồng chéo, đáp ứng hoàn hảo tiêu chuẩn in ấn khổ lớn (A0/A1) và trình bày trong luận văn tốt nghiệp.
