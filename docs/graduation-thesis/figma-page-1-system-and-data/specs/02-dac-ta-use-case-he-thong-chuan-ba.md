# TÀI LIỆU ĐẶC TẢ USE CASE TỔNG QUÁT HỆ THỐNG NEXUS LOGISTICS (CHUẨN BA / SRS)

> **Tài liệu Phân tích Nghiệp vụ Phần mềm (Business Analysis & System Requirements Specification - BA/SRS)**  
> **Dự án:** Hệ thống Quản trị & Vận hành Logistics Đa kênh Nexus Enterprise (Nexus Enterprise Logistics Platform)  
> **Tiêu chuẩn chất lượng phần mềm:** IEEE 830 / ISO/IEC 25010 / UML 2.5 Specification (Object Management Group - OMG)  
> **Sơ đồ Vector Blueprint tham chiếu:** [`01-use-case-general-system.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/diagrams/01-use-case-general-system.svg)  
> **Phiên bản:** 4.0 (Enterprise Definitive Release — Tích hợp Cây kế thừa Tác nhân & Đa hình Nghiệp vụ)

---

## 1. CƠ SỞ KHOA HỌC & KIẾN TRÚC PHẦN MỀM TỔNG THỂ

Hệ thống **Nexus Enterprise Logistics Platform** là giải pháp nền tảng phục vụ chuỗi cung ứng thương mại điện tử đa kênh và chuyển phát bưu chính liên tỉnh. Hệ thống được xây dựng trên kiến trúc **Microservices phân tán** bao gồm:
- **15 Backend Microservices** vận hành trên nền tảng NestJS, Prisma ORM, cơ sở dữ liệu PostgreSQL, message broker RabbitMQ và bộ đệm Redis.
- **06 Ứng dụng Client (Frontend / Mobile)** phục vụ từng nhóm tác nhân chuyên biệt:
  1. `guest-web (:5177)`: Cổng tra cứu công khai và hỏi đáp AI dành cho khách vãng lai.
  2. `customer-mobile`: Ứng dụng di động dành cho Người nhận hàng (tra cứu, e-POD, hẹn giờ, khiếu nại BBBT 24h).
  3. `merchant-web (:5174)`: Cổng thông tin dành cho Chủ Shop / Doanh nghiệp gửi hàng (tạo đơn, Excel bulk, Webhook sàn TMĐT, đối soát COD, rút tiền).
  4. `courier-mobile`: Ứng dụng dành cho Bưu tá giao nhận chặng cuối (nhận tuyến, giao hàng, thu COD mặt/VietQR, ký BBBT, nộp tiền ca).
  5. `ops-web (:5173)`: Cổng điều hành dành cho Điều phối viên Bưu cục & Kho trung chuyển (bàn quét mã vạch, manifest bao tải, phân tuyến, thẩm định đền bù $\le 500\text{k}$).
  6. `admin-web (:5175)`: Cổng quản trị dành cho Ban Giám đốc & Kế toán trưởng (RBAC, cấu hình bảng cước IATA, duyệt chi đền bù $> 500\text{k}$, đối soát tài chính, CMS RAG 768-D).

Nhằm khắc phục triệt để tình trạng "sơ đồ sơ sài, thiếu tính đồ sộ của một hệ thống thực tế và thiếu quan hệ kế thừa hướng đối tượng" khi bảo vệ trước Hội đồng Chấm thi / Đồ án Tốt nghiệp, tài liệu này chuẩn hóa toàn bộ các mối quan hệ:
1. **Quan hệ Kế thừa Tác nhân (Actor Generalization)**: Phân tầng trách nhiệm theo mô hình hướng đối tượng (OOP) từ Actor trừu tượng gốc `Người dùng Hệ thống` đến các Actor nghiệp vụ chuyên biệt.
2. **Quan hệ Kế thừa Use Case (Use Case Generalization / Specialization)**: Mô hình hóa các hành vi nghiệp vụ đa hình (Polymorphism) như Tạo đơn (Lẻ / Bulk / Webhook), Thanh toán COD (Tiền mặt / VietQR SePay / Ví cước), Tra cứu (Public / Telemetry), và Xác thực (Password / OTP / SSO).
3. **Quan hệ Bao hàm Bắt buộc (`<<include>>`)** & **Mở rộng có Điều kiện (`<<extend>>`)**: Ràng buộc chặt chẽ các quy chuẩn nghiệp vụ bưu chính (SOP).

---

## 2. CÂY PHÂN CẤP KẾ THỪA TÁC NHÂN (ACTOR GENERALIZATION HIERARCHY)

Trong chuẩn **UML 2.5**, Tác nhân (Actor) có thể kế thừa từ một Tác nhân khác. Mối quan hệ kế thừa (Generalization) được biểu diễn bằng **đường nét liền với mũi tên tam giác rỗng hướng về phía Tác nhân cha (`──▷`)**. Tác nhân con tự động thừa hưởng toàn bộ các Use Case và quyền hạn mà Tác nhân cha sở hữu, đồng thời bổ sung thêm các Use Case đặc thù của riêng mình.

### 2.1. Cấu trúc Cây Kế thừa 3 Tầng (3-Tier Actor Inheritance Tree)

```
                              [ Người dùng Hệ thống ]
                             (System User - Abstract)
                             ▲                      ▲
           ┌─────────────────┘                      └─────────────────┐
           │                                                          │
  [ Khách hàng ]                                          [ Nhân sự Vận hành Nội bộ ]
(Customer - Abstract)                                      (Internal Staff - Abstract)
     ▲          ▲                                              ▲          ▲          ▲
     │          │                                              │          │          │
┌────┴───┐  ┌───┴────────────────┐                             │          │          │
│ Khách  │  │ User Đã định danh  │                             │          │          │
│vãng lai│  │(Auth User-Abstract)│                             │          │          │
└────────┘  └────▲───────────────┘                             │          │          │
                 │                                             │          │          │
         ┌───────┴───────┐                                     │          │          │
         │               │                                     │          │          │
┌────────┴───────┐ ┌─────┴──────────┐                          │          │          │
│Người nhận hàng │ │Chủ Shop/Người gửi│                  ┌───────┴─────┐  │          │
│  (Recipient)   │ │  (Merchant)    │                  │  Bưu tá     │  │          │
└────────────────┘ └────────────────┘                  │ (Courier)   │  │          │
                                                       └─────────────┘  │          │
                                                                 ┌──────┴─────┐    │
                                                                 │Điều phối Hub│   │
                                                                 │  (Hub Ops) │    │
                                                                 └────────────┘    │
                                                                            ┌──────┴──────┐
                                                                            │Quản trị &   │
                                                                            │Kế toán Admin│
                                                                            └─────────────┘
```

### 2.2. Ma trận Phân tích Hồ sơ & Bản chất Kế thừa của Tác nhân

| Cấp bậc | Tác nhân (Actor) | Loại hình | Kế thừa từ (Parent) | Ý nghĩa Kế thừa & Quyền hạn Thừa hưởng |
| :---: | :--- | :---: | :---: | :--- |
| **Gốc** | **Người dùng Hệ thống** *(System User)* | Trừu tượng *(Abstract)* | *None (Root)* | Đại diện cho bất kỳ cá nhân nào tương tác với hệ thống. Thừa hưởng chung 2 tính năng cơ bản: Tra cứu lộ trình bưu gửi (`UC-G04`) và Hỏi đáp tự nhiên với Trợ lý AI (`UC-39`). |
| **Tầng 1** | **Khách hàng** *(Customer)* | Trừu tượng *(Abstract)* | `System User` | Đối tác ngoại vi sử dụng dịch vụ bưu chính. Thừa hưởng toàn bộ quyền của `System User`, đồng thời có quyền khiếu nại bưu gửi và gửi phản hồi chất lượng. |
| **Tầng 2** | **Khách vãng lai** *(Guest / Anonymous)* | Cụ thể *(Concrete)* | `Customer` | Khách truy cập web chưa đăng nhập tài khoản (`guest-web :5177`). Thừa hưởng tra cứu công khai nhưng bị áp dụng Khử định danh PII Masking (`UC-37`) để bảo mật thông tin người nhận. |
| **Tầng 2** | **Người dùng Đã định danh** *(Authenticated User)* | Trừu tượng *(Abstract)* | `Customer` | Người dùng đã xác thực danh tính qua hệ thống xác thực tập trung (`auth-service`). Thừa hưởng toàn bộ Use Case xác thực (`UC-G05`), quản lý hồ sơ và nhận thông báo cá nhân. |
| **Tầng 3** | **Người nhận hàng** *(Consignee / Recipient)* | Cụ thể *(Concrete)* | `Authenticated User` | Khách hàng nhận bưu phẩm, đăng nhập qua `customer-mobile` bằng SĐT/OTP. Thừa hưởng quyền nhận hàng (`UC-16`), thanh toán VietQR (`UC-28`), hẹn lại giờ giao (`UC-19`), và lập Biên bản Bất thường (BBBT) trong 24h (`UC-20`). |
| **Tầng 3** | **Chủ Shop / Người gửi** *(Merchant / Shipper)* | Cụ thể *(Concrete)* | `Authenticated User` | Đối tác kinh doanh ký hợp đồng bưu chính, sử dụng `merchant-web :5174`. Thừa hưởng quyền Tạo đơn (`UC-G01`), yêu cầu lấy hàng (`UC-06`), đối soát COD định kỳ (`UC-32`), rút tiền Ví COD (`UC-33`), và nộp khiếu nại bồi thường (`UC-G02`). |
| **Tầng 1** | **Nhân sự Vận hành Nội bộ** *(Internal Staff)* | Trừu tượng *(Abstract)* | `System User` | Cán bộ công nhân viên thuộc tổ chức logistics. Thừa hưởng quyền đăng nhập nghiệp vụ, điểm danh ca làm việc, tra cứu viễn trắc nội bộ (`UC-36`), và định vị GPS (`UC-38`). |
| **Tầng 2** | **Bưu tá giao nhận** *(Courier / Driver)* | Cụ thể *(Concrete)* | `Internal Staff` | Nhân viên giao nhận hiện trường sử dụng `courier-mobile`. Thực hiện gom hàng (`UC-10`), phát hàng (`UC-16`), thu COD mặt (`UC-27`), báo NDR (`UC-18`), ký xác nhận BBBT hiện trường (`UC-23`), và nộp quyết toán ca (`UC-30`). |
| **Tầng 2** | **Điều phối viên Bưu cục** *(Hub Ops Coordinator)* | Cụ thể *(Concrete)* | `Internal Staff` | Trưởng ca hoặc nhân viên kho sử dụng `ops-web :5173`. Thực hiện quét Inbound/Outbound (`UC-11`, `UC-12`), đóng/tiếp nhận Manifest bao tải (`UC-13`, `UC-14`), phân tuyến bưu tá (`UC-15`), và thẩm định bồi thường $\le 500\text{k}$ (`UC-24`). |
| **Tầng 2** | **Quản trị & Kế toán trưởng** *(Admin & Chief Accountant)* | Cụ thể *(Concrete)* | `Internal Staff` | Cán bộ cấp cao sử dụng `admin-web :5175`. Quản trị phân quyền RBAC (`UC-48`), cấu hình bảng cước IATA (`UC-50`), phê duyệt bồi thường $> 500\text{k}$ (`UC-25`), đối soát ngân hàng SePay (`UC-31`), và CMS tri thức RAG (`UC-54`). |

---

## 3. DANH MỤC 60 TRƯỜNG HỢP SỬ DỤNG THEO 7 PHÂN HỆ NGHIỆP VỤ (USE CASE CATALOG)

Hệ thống được tổ chức thành **7 Phân hệ chức năng (Packages)** với tổng cộng **60 Trường hợp sử dụng** (gồm 5 Use Case cha trừu tượng làm gốc kế thừa nghiệp vụ và 55 Use Case cụ thể):

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                      HỆ THỐNG QUẢN TRỊ & VẬN HÀNH LOGISTICS ĐA KÊNH NEXUS ENTERPRISE                   │
├───────────────────────────────────┬───────────────────────────────────┬────────────────────────────────┤
│ 1. TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG   │ 2. KHO BÃI & GIAO HÀNG CHẶNG CUỐI │ 3. XỬ LÝ SỰ CỐ & BỒI THƯỜNG    │
│  [UC-G01] Tạo đơn vận chuyển (Gen)│  • UC-10: Quét tiếp nhận gom hàng │  [UC-G02] Xử lý sự cố/khiếu nại│
│   ├── UC-01: Tạo đơn lẻ thủ công  │  • UC-11: Quét nhập kho Inbound   │   ├── UC-20: BBBT bể vỡ 24h    │
│   ├── UC-02: Tạo đơn Excel bulk   │  • UC-12: Quét xuất kho Outbound  │   ├── UC-21: Mất hàng/Trễ SLA  │
│   └── UC-03: Đồng bộ Webhook TMĐT │  • UC-13: Đóng bao Manifest niêm chì│  └── UC-22: Sai lệch cân nặng│
│  • UC-04: Tính cước quy đổi IATA  │  • UC-14: Nhận bao tải đầu tuyến  │  • UC-23: Bưu tá ký số BBBT    │
│  • UC-05: In nhãn Barcode/Phiếu   │  • UC-15: Phân tuyến & Task bưu tá│  • UC-24: Thẩm định (<= 500k)  │
│  • UC-06: Yêu cầu bưu tá lấy hàng │  • UC-16: Giao hàng chặng cuối    │  • UC-25: Phê duyệt (> 500k)   │
│  • UC-07: Hủy đơn/Sửa SĐT, địa chỉ│  • UC-17: Ký nhận e-POD & Ảnh     │  • UC-26: Hòa giải & Hiện trường│
│  • UC-08: Quản lý & Lọc đơn đa kênh│ • UC-18: Báo giao thất bại NDR   │                                │
│  • UC-09: In nhãn hàng loạt (Bulk)│  • UC-19: Hẹn lại ngày / Chuyển hoàn│                               │
├───────────────────────────────────┼───────────────────────────────────┼────────────────────────────────┤
│ 4. ĐỐI SOÁT TÀI CHÍNH & VÍ COD    │ 5. TRUY VẾT & VIỄN TRẮC HÀNH TRÌNH│ 6. TRỢ LÝ ẢO AI & ĐỘNG CƠ RAG  │
│  [UC-G03] Thanh toán/Thu COD (Gen)│  [UC-G04] Tra cứu bưu gửi (Gen)   │  • UC-39: Hỏi đáp AI tự nhiên  │
│   ├── UC-27: Thu tiền mặt tại điểm│   ├── UC-35: Tra cứu công khai PII│  • UC-40: Bóc tách Intent/Entity│
│   ├── UC-28: Quét VietQR SePay    │   └── UC-36: Viễn trắc Audit Logs │  • UC-41: RAG 768-D Semantic   │
│   └── UC-29: Cấn trừ Ví cước      │  • UC-37: Khử định danh PII Mask  │  • UC-42: Tư vấn cước IATA     │
│  • UC-30: Quyết toán ca nộp tiền  │  • UC-38: Định vị GPS thời gian   │  • UC-43: Hướng dẫn BBBT AI    │
│  • UC-31: Đối soát SePay Webhook  │          thực phương tiện         │  • UC-44: Sinh thẻ Rich Card   │
│  • UC-32: Bảng kê COD định kỳ     │                                   │                                │
│  • UC-33: Rút tiền Ví COD về NH   │                                   │                                │
│  • UC-34: Báo cáo dòng tiền & Nợ  │                                   │                                │
├───────────────────────────────────┴───────────────────────────────────┴────────────────────────────────┤
│ 7. QUẢN TRỊ HỆ THỐNG, DANH MỤC & BẢO MẬT (auth-service • masterdata-service • reporting-service)       │
│  [UC-G05] Xác thực người dùng (Gen) ──├── UC-45: Đăng nhập Email/Mật khẩu                              │
│                                       ├── UC-46: Đăng nhập OTP SMS                                     │
│                                       └── UC-47: Đăng nhập SSO Doanh nghiệp                            │
│  • UC-48: Phân quyền RBAC người dùng       • UC-52: Hồ sơ Merchant, Chiết khấu & Kho lấy hàng          │
│  • UC-49: Quản lý danh mục Hub & Bưu cục   • UC-53: Quản lý danh mục lý do giao thất bại (NDR) & SLA   │
│  • UC-50: Cấu hình Bảng cước & IATA        • UC-54: CMS Quản trị Tri thức RAG 768-D                   │
│  • UC-51: Phân vùng địa lý Tuyến phát      • UC-55: Giám sát Nhật ký kiểm toán bảo mật (Audit Logs)     │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. ĐẶC TẢ CHI TIẾT CÁC CỤM KẾ THỪA & USE CASE TRỌNG TÂM (CORE BUSINESS SPECS)

### 4.1. Cụm Kế thừa UC-G01: Tạo Đơn Vận chuyển & Chuyên biệt hóa (Specialization)
- **Use Case cha:** `UC-G01: Tạo đơn vận chuyển (Shipment Creation) <<abstract>>`
- **Tác nhân kích hoạt:** Chủ Shop / Người gửi *(Merchant)*.
- **Bản chất kế thừa:** Trong thực tế bưu chính, việc tạo đơn hàng không diễn ra theo một cách thức duy nhất. Để đáp ứng đa dạng khách hàng từ shop nhỏ lẻ đến các thương hiệu lớn với hàng ngàn đơn mỗi ngày, hệ thống chuyên biệt hóa (Specializes) thành 3 hình thức đa hình:
  1. `UC-01: Tạo đơn lẻ thủ công (Manual Single Order)`: Dành cho bưu gửi đột xuất. Merchant nhập từng trường thông tin người nhận, địa chỉ, COD, kích thước và dịch vụ cộng thêm qua giao diện biểu mẫu trực quan.
  2. `UC-02: Tạo đơn tệp Excel hàng loạt (Bulk Batch Upload)`: Dành cho các đợt xuất kho lớn. Merchant tải tệp `.xlsx`/`.csv` theo mẫu chuẩn. Backend tiến hành phân tích cú pháp (parsing), kiểm tra hợp lệ dữ liệu song song (parallel validation), và tạo hàng loạt bản ghi đơn hàng chỉ trong vài giây.
  3. `UC-03: Đồng bộ đơn tự động qua Webhook Sàn TMĐT (E-commerce Webhook Sync)`: Dành cho các nhà bán hàng đa kênh liên kết gian hàng Shopee, TikTok Shop, Lazada. Khi khách đặt hàng trên sàn, Webhook đẩy payload JSON về `gateway-bff (:3000)` để tự động khởi tạo vận đơn mà không cần con người thao tác.
- **Quan hệ Bao hàm Bắt buộc (`<<include>>`):**
  - Cả 3 hình thức tạo đơn trên đều **bắt buộc** gọi sang:
    - `UC-04: Tính cước quy đổi IATA & Phụ phí`: Áp dụng quy tắc $VW = (D \times R \times C) / 5000$, lấy $\max(W_{actual}, VW)$ để tính cước chính xác.
    - `UC-05: In nhãn vận đơn Barcode / Phiếu gửi`: Sinh mã vạch chuẩn Code 128 / QR Code và xuất tệp PDF/ZPL kích thước $100 \times 150\text{ mm}$ để dán lên kiện hàng.
- **Quan hệ Mở rộng có Điều kiện (`<<extend>>`):**
  - `UC-05` được mở rộng bởi `UC-09: In nhãn hàng loạt (Bulk Batch Print)`: Khi Merchant chọn in từ 10 đến 500 đơn cùng lúc, hệ thống gộp các trang nhãn thành 1 tệp in duy nhất để tối ưu hóa máy in nhiệt công nghiệp.

---

### 4.2. Cụm Kế thừa UC-G02: Xử lý Sự cố & Khiếu nại Bồi thường (Incident & Claim Management)
- **Use Case cha:** `UC-G02: Xử lý sự cố & Khiếu nại bưu gửi <<abstract>>`
- **Tác nhân kích hoạt:** Người nhận hàng *(Recipient)*, Chủ Shop *(Merchant)*.
- **Tác nhân tham gia:** Bưu tá *(Courier)*, Điều phối Hub *(Ops)*, Quản trị & Kế toán *(Admin)*.
- **Bản chất kế thừa:** Nghiệp vụ bồi thường bưu chính phân loại theo bản chất thiệt hại:
  1. `UC-20: Khiếu nại Hàng hư hỏng / Bể vỡ (BBBT 24h)`: Kiện hàng bị biến dạng, móp méo, đổ vỡ chất lỏng hoặc dập nát sản phẩm bên trong. **Ràng buộc cứng:** Khách hàng phải khai báo trong vòng 24 giờ kể từ mốc giao hàng thực tế ($\Delta t \le 24\text{h}$) theo quy chuẩn bưu chính Việt Nam.
  2. `UC-21: Khiếu nại Hàng thất lạc / Quá hạn cam kết SLA`: Kiện hàng không có quét viễn trắc mới trong 72 giờ hoặc quá thời hạn giao cam kết mà không rõ vị trí.
  3. `UC-22: Khiếu nại Sai lệch trọng lượng tính cước`: Tranh chấp khi bưu cục cân lại (Re-weight Scan) phát hiện chênh lệch dẫn đến phát sinh phụ phí truy thu cước.
- **Quan hệ Bao hàm Bắt buộc (`<<include>>`):**
  - `UC-20` `<<include>>` `UC-23: Bưu tá đồng kiểm & Ký số BBBT hiện trường`: Khi phát hiện hàng vỡ ngay lúc nhận, bưu tá và khách hàng lập Biên bản Bất thường ngay trên `courier-mobile`, chụp 3 góc ảnh hiện trường và bưu tá ký số xác thực.
  - `UC-G02` `<<include>>` `UC-24: Thẩm định hồ sơ sự cố & Phân định lỗi (Hub Ops)`: Mọi hồ sơ khiếu nại đều phải qua khâu thẩm tra của điều phối viên kho để xác định lỗi thuộc về khâu đóng gói của Shop, khâu trung chuyển xe tải hay bưu tá phát.
- **Quan hệ Mở rộng Phân cấp Bồi thường (`<<extend>>`):**
  - `UC-24` `<<extend>>` `UC-25: Phê duyệt bồi thường cấp cao (> 500k)`:
    - **Điểm mở rộng (Extension Point):** `Giá trị bồi thường yêu cầu > 500.000 VNĐ`.
    - Khi khoản đền bù vượt hạn mức cơ sở của Bưu cục ($\le 500\text{k}$), hệ thống tự động luân chuyển hồ sơ lên Ban Giám đốc và Kế toán trưởng (`admin-web`) phê duyệt giải ngân và chế tài trách nhiệm nhân sự.
  - `UC-24` `<<extend>>` `UC-26: Hòa giải tranh chấp & Trích xuất chứng cứ hiện trường`: Kích hoạt khi khách hàng không đồng ý với kết quả thẩm định ban đầu, chuyển sang quy trình điều tra đối chất chứng cứ camera kho bãi.

---

### 4.3. Cụm Kế thừa UC-G03: Thanh toán / Thu tiền COD & Chuyên biệt hóa Đa kênh
- **Use Case cha:** `UC-G03: Thanh toán / Thu tiền cước & COD <<abstract>>`
- **Tác nhân kích hoạt:** Người nhận hàng *(Recipient)*, Bưu tá *(Courier)*.
- **Bản chất kế thừa:** Phản ánh các phương thức thanh toán trong nền kinh tế số:
  1. `UC-27: Thu tiền mặt COD tại điểm phát`: Phương thức truyền thống. Bưu tá thu tiền mặt trực tiếp từ người nhận, đếm tiền và xác nhận trên app di động.
  2. `UC-28: Thanh toán Chuyển khoản VietQR SePay động`: Bưu tá bật mã QR động trên điện thoại (hoặc in sẵn trên tem bưu gửi). Mã QR chứa sẵn số tiền COD chính xác và mã nội dung chuyển khoản định danh duy nhất (ví dụ: `SEPAY NX89421VN`). Khách dùng ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank,...) quét mã thanh toán 1-chạm.
  3. `UC-29: Cấn trừ Ví cước trả trước / Hạn mức công nợ`: Dành cho tiền cước vận chuyển của Merchant có hợp đồng doanh nghiệp, tự động trừ vào số dư ký quỹ hoặc hạn mức công nợ chu kỳ 30 ngày.
- **Luồng xử lý quyết toán & Đối soát dòng tiền:**
  - `UC-30: Quyết toán ca nộp tiền COD bưu tá về thủ quỹ`: Cuối mỗi ca làm việc, bưu tá phải bàn giao toàn bộ số tiền mặt COD thu được về thủ quỹ bưu cục để khóa sổ ca phát.
  - `UC-31: Tự động đối soát ngân hàng qua SePay Webhook`: Khi khách quét mã VietQR thành công, cổng thanh toán SePay gửi Webhook tức thời về `payment-service (:3009)` để tự động gạch nợ đơn hàng trong vòng 2 giây mà không cần con người đối soát thủ công.
  - `UC-32: Lập bảng kê đối soát định kỳ & Cấn trừ cước`: Định kỳ thứ 2, 4, 6 hàng tuần, hệ thống tổng hợp bảng kê COD của từng Merchant, cấn trừ cước vận chuyển và phí bảo hiểm, rồi ghi nhận số dư khả dụng vào Ví COD của Merchant.
  - `UC-33: Yêu cầu rút tiền Ví COD về tài khoản ngân hàng`: Merchant tạo lệnh rút tiền, hệ thống chi hộ tự động chuyển tiền về tài khoản ngân hàng chính chủ của Merchant.

---

### 4.4. Cụm Kế thừa UC-G04: Tra cứu Hành trình Bưu gửi (Shipment Tracking & Telemetry)
- **Use Case cha:** `UC-G04: Tra cứu hành trình bưu gửi <<abstract>>`
- **Tác nhân kích hoạt:** Khách vãng lai *(Guest)*, Người nhận *(Recipient)*, Chủ Shop *(Merchant)*, Nhân sự Nội bộ *(Internal Staff)*.
- **Bản chất kế thừa:**
  1. `UC-35: Tra cứu lộ trình công khai (Public Tracking)`: Dành cho người dùng bên ngoài qua Web Portal hoặc Chatbot.
     - **Quan hệ `<<include>>` `UC-37: Khử định danh PII Masking`:** Để bảo đảm an toàn dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP, hệ thống tự động che mờ số điện thoại (`098****321`), họ tên (`Ng***** V** A**`) và địa chỉ chi tiết của người nhận, chỉ hiển thị quận/huyện và lộ trình di chuyển của bưu phẩm.
  2. `UC-36: Tra cứu viễn trắc nội bộ (Internal Telemetry & Audit Logs)`: Dành riêng cho nhân sự vận hành và quản trị. Hiển thị toàn bộ dữ liệu thô: tọa độ GPS quét mã, mã nhân viên thực hiện quét (Staff ID), số hiệu bao tải Manifest chứa bưu phẩm, lịch sử thay đổi trạng thái và nhật ký điều phối.
     - **Quan hệ `<<include>>` `UC-38: Định vị GPS thời gian thực phương tiện & Bưu tá`:** Hiển thị vị trí trực thơi gian thực của xe tải chở hàng hoặc bưu tá đang trên đường đi phát.

---

### 4.5. Phân hệ 6: Trợ lý ảo AI & Động cơ Tri thức RAG (AI Assistant & Semantic RAG)
- **Use Case trọng tâm:** `UC-39: Hỏi đáp tự nhiên với Trợ lý AI (Conversational AI Assistant)`
- **Tác nhân:** Toàn bộ người dùng kế thừa từ `System User`.
- **Quan hệ Bao hàm Bắt buộc (`<<include>>`):**
  - `UC-39` `<<include>>` `UC-40: Bóc tách Ý định (Intent Classification) & Thực thể (Entity Extraction)`: Sử dụng mô hình ngôn ngữ phân loại câu hỏi thành các nhóm nghiệp vụ (`EXACT_ORDER`, `IATA_PRICING`, `CLAIM_FILING`, `POLICY_INQUIRY`) và trích xuất mã vận đơn, kích thước, khối lượng.
  - `UC-39` `<<include>>` `UC-41: Truy xuất ngữ nghĩa từ Kho tri thức RAG 768-D (Semantic Retrieval)`: Tìm kiếm vector tương đồng trên cơ sở tri thức các chính sách bưu chính, biểu phí và hướng dẫn đóng gói.
- **Quan hệ Mở rộng Giao diện Trực quan (`<<extend>>`):**
  - `UC-39` `<<extend>>` `UC-44: Sinh thẻ phản hồi trực quan (Rich Card Generator)`: Thay vì chỉ trả về câu chữ thông thường, hệ thống tự động sinh các thành phần UI tương tác sinh động:
    - *Tracking Timeline Stepper Card*: Thể hiện các nấc giao hàng.
    - *Volumetric IATA Pricing Card*: Chi tiết từng bước tính $W_{actual}$ vs $VW$.
    - *Claim Incident Filing Dialog Card*: Form nộp ảnh bằng chứng bể vỡ 24h.

---

### 4.6. Cụm Kế thừa UC-G05: Xác thực Người dùng & Phân quyền RBAC
- **Use Case cha:** `UC-G05: Xác thực người dùng (User Authentication) <<abstract>>`
- **Bản chất kế thừa:**
  1. `UC-45: Đăng nhập Email & Mật khẩu`: Phương thức chuẩn cho Merchant và Nhân viên văn phòng trên Web Portal.
  2. `UC-46: Đăng nhập OTP SMS Số điện thoại`: Phương thức nhanh, không cần nhớ mật khẩu cho Người nhận hàng và Bưu tá trên Mobile App.
  3. `UC-47: Đăng nhập SSO Doanh nghiệp (Enterprise Single Sign-On)`: Xác thực tập trung qua tài khoản tổ chức (Google Workspace / Microsoft Azure AD) cho ban quản trị và kế toán.
- **Quản trị Phân quyền:**
  - `UC-48: Phân quyền RBAC người dùng`: Gán quyền hạn chi tiết theo vai trò (`GUEST`, `RECIPIENT`, `MERCHANT`, `COURIER`, `HUB_OPS`, `ADMIN`, `CHIEF_ACCOUNTANT`), kiểm soát truy cập ở tầng API Gateway và dịch vụ microservices.

---

## 5. MA TRẬN PHÂN QUYỀN TRUY CẬP RBAC ĐẦY ĐỦ (COMPLETE RBAC ACCESS MATRIX)

Ký hiệu quyền:
- **C** *(Create)*: Khởi tạo dữ liệu mới.
- **R** *(Read)*: Xem / Tra cứu thông tin.
- **U** *(Update)*: Cập nhật / Chỉnh sửa trạng thái.
- **D** *(Delete)*: Hủy bỏ / Xóa dữ liệu.
- **-**: Không có quyền truy cập.

| Mã UC | Tên Trường hợp Sử dụng (Use Case Name) | Khách vãng lai | Người nhận | Chủ Shop | Bưu tá | Điều phối Hub | Admin & Kế toán |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **UC-01** | Tạo đơn lẻ thủ công | - | - | **C** | - | **C** | **C** |
| **UC-02** | Tạo đơn tệp Excel hàng loạt (Bulk) | - | - | **C** | - | - | **C** |
| **UC-03** | Đồng bộ đơn tự động Webhook Sàn TMĐT | - | - | **C/U** | - | - | **C/U** |
| **UC-04** | Tính cước quy đổi IATA & Phụ phí | **R** | **R** | **R** | **R** | **R** | **R/U** |
| **UC-05** | In nhãn vận đơn Barcode / Phiếu gửi | - | - | **R** | **R** | **R** | **R** |
| **UC-06** | Yêu cầu bưu tá đến lấy hàng (Pickup) | - | - | **C/R** | **R/U** | **R/U** | **R/U** |
| **UC-07** | Hủy đơn / Sửa địa chỉ, SĐT, tiền COD | - | - | **U/D** | - | **U** | **U/D** |
| **UC-08** | Quản lý & Lọc danh sách bưu gửi đa kênh | - | - | **R** | - | **R** | **R** |
| **UC-09** | In nhãn hàng loạt (Bulk Batch Print) | - | - | **R** | - | **R** | **R** |
| **UC-10** | Quét mã tiếp nhận gom hàng (Pickup Scan) | - | - | - | **C/U** | **C/U** | **R** |
| **UC-11** | Quét mã phân loại nhập kho (Inbound Hub) | - | - | - | - | **C/U** | **R** |
| **UC-12** | Quét mã xuất kho trung chuyển (Outbound Hub)| - | - | - | - | **C/U** | **R** |
| **UC-13** | Đóng bao tải Manifest & Niêm chì điện tử | - | - | - | - | **C/U** | **R** |
| **UC-14** | Tiếp nhận bao tải liên tỉnh & Đối kiểm | - | - | - | - | **C/U** | **R** |
| **UC-15** | Phân tuyến tự động & Điều phối task bưu tá | - | - | - | - | **C/U** | **R/U** |
| **UC-16** | Thực hiện giao hàng chặng cuối (Last-Mile)| - | **R** | **R** | **C/U** | **R** | **R** |
| **UC-17** | Ký nhận điện tử e-POD & Chụp ảnh chứng từ| - | **U** | **R** | **C/U** | **R** | **R** |
| **UC-18** | Báo phát không thành công (NDR - 3 lần) | - | **R** | **R** | **C/U** | **R/U** | **R** |
| **UC-19** | Hẹn lại ngày giao / Chuyển hoàn (RTS) | - | **U** | **U** | **R** | **C/U** | **R** |
| **UC-20** | Khiếu nại Hàng hư hỏng / Bể vỡ (BBBT 24h)| - | **C/R** | **C/R** | **R** | **R** | **R** |
| **UC-21** | Khiếu nại Hàng thất lạc / Quá hạn SLA | - | **C/R** | **C/R** | - | **R** | **R** |
| **UC-22** | Khiếu nại Sai lệch trọng lượng tính cước| - | - | **C/R** | - | **R** | **R** |
| **UC-23** | Bưu tá đồng kiểm & Ký số BBBT hiện trường| - | **U** | - | **C/U** | **R** | **R** |
| **UC-24** | Thẩm định hồ sơ sự cố (Hub Ops $\le 500\text{k}$)| - | - | - | - | **C/U** | **R** |
| **UC-25** | Phê duyệt bồi thường cấp cao ($> 500\text{k}$) | - | - | - | - | - | **C/U** |
| **UC-26** | Hòa giải tranh chấp & Trích xuất chứng cứ | - | **R** | **R** | **R** | **U** | **C/U** |
| **UC-27** | Thu tiền mặt COD tại địa chỉ nhận | - | **U** | - | **C/U** | **R** | **R** |
| **UC-28** | Thanh toán Chuyển khoản VietQR SePay động | - | **C** | - | **R** | **R** | **R** |
| **UC-29** | Cấn trừ Ví cước trả trước / Hạn mức | - | - | **U** | - | - | **C/U** |
| **UC-30** | Quyết toán ca nộp tiền bưu tá về thủ quỹ | - | - | - | **C** | **U** | **R/U** |
| **UC-31** | Tự động đối soát ngân hàng qua SePay Webhook| - | - | - | - | - | **C/U** |
| **UC-32** | Lập bảng kê đối soát định kỳ & Cấn trừ cước| - | - | **R** | - | - | **C/U** |
| **UC-33** | Yêu cầu rút tiền Ví COD về tài khoản NH | - | - | **C/R** | - | - | **U** |
| **UC-34** | Báo cáo dòng tiền, công nợ & Doanh thu | - | - | **R** | - | **R** | **C/R/U** |
| **UC-35** | Tra cứu lộ trình công khai (PII Masking)| **R** | **R** | **R** | **R** | **R** | **R** |
| **UC-36** | Tra cứu viễn trắc nội bộ (Full Telemetry)| - | - | - | **R** | **R** | **R** |
| **UC-37** | Khử định danh PII Masking Sanitization | **R** | **R** | - | - | - | - |
| **UC-38** | Định vị GPS thời gian thực xe & Bưu tá | - | **R** | **R** | **R/U** | **R** | **R** |
| **UC-39** | Tương tác hỏi đáp hội thoại với Trợ lý AI | **R** | **R** | **R** | **R** | **R** | **R** |
| **UC-40** | Bóc tách Ý định (Intent) & Thực thể (Entity)| **R** | **R** | **R** | **R** | **R** | **R** |
| **UC-41** | Truy xuất ngữ nghĩa từ Kho RAG 768-D | **R** | **R** | **R** | **R** | **R** | **R** |
| **UC-42** | Tư vấn cước IATA & Tính thể tích tự động | **R** | **R** | **R** | **R** | **R** | **R** |
| **UC-43** | Hướng dẫn lập hồ sơ khiếu nại & BBBT AI | - | **C/R** | **C/R** | - | - | - |
| **UC-44** | Sinh thẻ phản hồi trực quan (Rich Card) | **R** | **R** | **R** | **R** | **R** | **R** |
| **UC-45** | Đăng nhập Email & Mật khẩu | - | - | **R** | - | **R** | **R** |
| **UC-46** | Đăng nhập OTP SMS Số điện thoại | - | **R** | - | **R** | - | - |
| **UC-47** | Đăng nhập SSO Doanh nghiệp | - | - | - | - | **R** | **R** |
| **UC-48** | Phân quyền vai trò người dùng (RBAC Matrix)| - | - | - | - | - | **C/R/U/D** |
| **UC-49** | Quản lý danh mục Bưu cục & Kho trung chuyển| - | - | - | - | **R** | **C/R/U/D** |
| **UC-50** | Cấu hình Bảng cước vận chuyển & Phụ phí IATA| - | - | **R** | - | **R** | **C/R/U/D** |
| **UC-51** | Cấu hình Phân vùng địa lý Tuyến phát | - | - | - | - | **R/U** | **C/R/U/D** |
| **UC-52** | Quản lý hồ sơ Merchant, Chiết khấu & Kho | - | - | **R/U** | - | **R** | **C/R/U/D** |
| **UC-53** | Quản lý danh mục lý do giao thất bại & SLA | - | - | - | **R** | **R** | **C/R/U/D** |
| **UC-54** | CMS Quản trị Tri thức RAG & Nạp tài liệu | - | - | - | - | - | **C/R/U/D** |
| **UC-55** | Giám sát Nhật ký kiểm toán bảo mật (Audit Logs)| - | - | - | - | **R** | **R/D** |

---

## 6. HƯỚNG DẪN TRẢ LỜI PHẢN BIỆN HỘI ĐỒNG CHẤM KHÓA LUẬN (ACADEMIC DEFENSE FAQ)

Dưới đây là cẩm nang trả lời các câu hỏi hóc búa của Hội đồng Chấm thi / Thầy Cô phản biện liên quan đến Sơ đồ Use Case và Mô hình Nghiệp vụ:

### Câu hỏi 1: Tại sao sơ đồ Use Case của em lại có quá nhiều Use Case (60 trường hợp) và phân thành tới 7 Phân hệ? Hệ thống có bị vẽ "quá tay" (Over-engineering) so với thực tế triển khai không?
> **Trả lời mẫu của Sinh viên / Tác giả:**  
> *"Dạ kính thưa Thầy/Cô trong Hội đồng, sơ đồ Use Case này hoàn toàn không phải là mô hình lý thuyết được vẽ thêm, mà là sự phản ánh chính xác 1:1 từ mã nguồn của 15 Backend Microservices và 6 Ứng dụng Client hiện hành trong kho mã nguồn của Dự án Nexus.  
> Trong một hệ thống logistics thực tế, quy trình không chỉ đơn thuần dừng lại ở việc 'Tạo đơn' và 'Giao hàng', mà còn bao gồm trọn vẹn vòng đời nghiệp vụ: gom hàng chặng đầu (First-mile), đóng mở bao tải liên tỉnh (Manifest linehaul), giao chặng cuối (Last-mile), ghi nhận thất bại (NDR 3 lần), chuyển hoàn (RTS), đối soát tự động qua cổng VietQR SePay, lập biên bản bất thường (BBBT) trong 24h, và tích hợp Trợ lý AI RAG 768-D.  
> Việc phân rã thành 7 Phân hệ và 60 Use Cases tuân thủ nghiêm ngặt nguyên lý Phân tách Trách nhiệm (Separation of Concerns) và tiêu chuẩn IEEE 830, giúp hệ thống đạt độ kết dính cao (High Cohesion) và ghép nối lỏng (Low Coupling)."*

### Câu hỏi 2: Tại sao em lại áp dụng quan hệ Kế thừa (Generalization) cho cả Tác nhân (Actor) và Trường hợp sử dụng (Use Case)? Bản chất của hai loại kế thừa này khác nhau như thế nào?
> **Trả lời mẫu của Sinh viên / Tác giả:**  
> *"Dạ thưa Thầy/Cô, trong chuẩn UML 2.5 của OMG, Kế thừa là một quan hệ cốt lõi thể hiện tính Đa hình (Polymorphism) và Tái sử dụng (Reusability) trong Phân tích & Thiết kế Hướng đối tượng (OOAD):  
> 1. **Về Kế thừa Tác nhân (Actor Generalization):** Chúng em xây dựng cây kế thừa 3 tầng với gốc là `Người dùng Hệ thống (System User)`. Nhờ kế thừa, tất cả các tác nhân con như `Người nhận hàng` và `Chủ Shop` tự động thừa hưởng các quyền chung từ `Authenticated User` (như xác thực hệ thống, quản lý hồ sơ cá nhân) và từ `System User` (như hỏi đáp AI, tra cứu bưu gửi). Điều này giúp sơ đồ tránh được việc phải vẽ hàng chục đường Association trùng lặp từ mỗi tác nhân tới các Use Case chung, làm cho biểu đồ trong sáng và chuẩn mực.  
> 2. **Về Kế thừa Use Case (Use Case Generalization):** Thể hiện sự chuyên biệt hóa hành vi. Ví dụ, `Tạo đơn vận chuyển (UC-G01)` là một Use Case trừu tượng định nghĩa hợp đồng chung (cần địa chỉ, cân nặng, cước). Các Use Case con gồm `Tạo đơn lẻ`, `Tạo đơn Excel bulk`, và `Đồng bộ Webhook TMĐT` là các hiện thực cụ thể khác nhau về mặt dữ liệu đầu vào nhưng đều tuân theo cùng một nghiệp vụ cốt lõi và cùng chia sẻ quan hệ `<<include>>` với `Tính cước IATA` và `In nhãn Barcode`."*

### Câu hỏi 3: Phân biệt rõ sự khác nhau giữa quan hệ `<<include>>` và `<<extend>>` trong phân hệ Giao hàng chặng cuối và Xử lý khiếu nại?
> **Trả lời mẫu của Sinh viên / Tác giả:**  
> *"Dạ thưa Thầy/Cô:  
> - **Quan hệ `<<include>>` (Bao hàm bắt buộc):** Luồng sự kiện chính của Use Case gốc luôn luôn phải thực thi Use Case được include. Ví dụ: Khi bưu tá thực hiện `Giao hàng chặng cuối (UC-16)`, bắt buộc phải thực hiện `Ký nhận điện tử e-POD (UC-17)` để có chứng từ pháp lý hoàn thành đơn hàng. Khi khách gửi `Khiếu nại bể vỡ 24h (UC-20)`, bắt buộc phải có `Bưu tá ký số BBBT hiện trường (UC-23)`.  
> - **Quan hệ `<<extend>>` (Mở rộng có điều kiện):** Use Case mở rộng chỉ được kích hoạt tại Điểm mở rộng (Extension Point) khi xảy ra một sự kiện hoặc điều kiện đặc biệt. Ví dụ: Khi thực hiện `Giao hàng (UC-16)`, nếu người nhận không nghe máy hoặc vắng nhà, luồng mới kích hoạt `Báo phát không thành công (NDR - UC-18)`. Khi `Thẩm định bồi thường (UC-24)`, chỉ khi giá trị yêu cầu vượt quá hạn mức 500.000 VNĐ, hệ thống mới kích hoạt `Phê duyệt bồi thường cấp cao (UC-25)` của Quản trị & Kế toán trưởng."*

### Câu hỏi 4: Cơ chế Khử định danh PII Masking và Đối soát VietQR SePay giải quyết bài toán thực tế nào trong doanh nghiệp?
> **Trả lời mẫu của Sinh viên / Tác giả:**  
> *"Dạ thưa Thầy/Cô:  
> 1. **Khử định danh PII Masking (`UC-37`):** Giúp bưu chính bảo vệ quyền riêng tư người nhận theo Nghị định 13/2023/NĐ-CP. Khi khách vãng lai hoặc bất kỳ ai có mã vận đơn tra cứu lộ trình trên Web/Chatbot, hệ thống che mờ số điện thoại và địa chỉ nhà riêng để tránh lộ thông tin đơn hàng cho các bên lừa đảo 'giao hàng COD giả mạo'.  
> 2. **Đối soát VietQR SePay (`UC-28`, `UC-31`):** Giải quyết bài toán thất thoát và chôn vốn COD của các doanh nghiệp chuyển phát. Thay vì bưu tá cầm nhiều tiền mặt trong ngày dễ bị cướp giật hoặc chậm nộp ca, khách quét mã VietQR động trực tiếp. Dòng tiền chảy thẳng về tài khoản ngân hàng bưu chính và SePay gửi Webhook gạch nợ tức thì trong 2 giây, giúp kế toán đối soát tự động 100% không cần rà soát sao kê thủ công."*

---

> **Kết luận:** Bản đặc tả này cùng với bản vẽ vector [`01-use-case-general-system.svg`](file:///Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/diagrams/01-use-case-general-system.svg) tạo thành bộ tài liệu chuẩn mực cấp Doanh nghiệp (Enterprise-Grade), đáp ứng toàn diện mọi tiêu chí khắt khe nhất của Hội đồng Chấm thi, Đồ án Tốt nghiệp và Kiểm định Chất lượng Phần mềm Quốc tế.
