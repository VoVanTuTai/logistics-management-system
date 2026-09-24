# Nexus Express System - Project Overview

## 1. Mục đích tài liệu

Tài liệu này tổng hợp bức tranh chuẩn của hệ thống **Nexus Express System** để làm nền cho báo cáo, tài liệu thiết kế, tài liệu vận hành và tài liệu hướng dẫn phát triển.

Nội dung tập trung vào:

- Bối cảnh bài toán logistics mà hệ thống giải quyết.
- Kiến trúc tổng quan và cách các service phối hợp.
- Phạm vi chức năng theo từng nhóm người dùng.
- Vai trò của từng ứng dụng frontend và backend service.
- Quy tắc sở hữu dữ liệu, event, trạng thái vận đơn và luồng nghiệp vụ chính.
- Ghi chú triển khai thực tế trong repository hiện tại.

Lưu ý đặt tên: trong mã nguồn vẫn còn một số package dùng tiền tố `@NEXUS/...` do lịch sử scaffold. Khi viết báo cáo hoặc tài liệu chính thức, tên sản phẩm nên thống nhất là **Nexus Express System**.

## 2. Tổng quan đề tài

**Nexus Express System** là hệ thống quản lý vận hành logistics/chuyển phát nhanh thế hệ mới, mô phỏng toàn diện các nghiệp vụ cốt lõi của doanh nghiệp last-mile và hub-and-spoke logistics hiện đại.

Hệ thống quản lý toàn bộ vòng đời vận đơn từ lúc merchant/khách hàng tạo đơn, tính cước tự động chuẩn IATA, điều phối lấy hàng, phân loại và đóng bao tại hub, trung chuyển xe tải liên tỉnh (Linehaul), giao hàng chặng cuối, xử lý giao thất bại/NDR, hoàn hàng tự động, đối soát COD đa kênh, cho đến cổng tra cứu công khai và trợ lý trí tuệ nhân tạo (AI Logistics Assistant RAG) phục vụ 24/7.

Thông tin chính:

| Hạng mục | Mô tả |
| --- | --- |
| Tên hệ thống | Nexus Express System |
| Loại dự án | Nền tảng quản lý logistics/chuyển phát nhanh bưu chính đa kênh |
| Kiến trúc | 15 Microservices + API Gateway/BFF + Event-driven architecture |
| Client Applications | 6 ứng dụng chuyên biệt: 4 Web (React/Vite) + 2 Mobile (Expo/React Native) |
| Backend chính | NestJS 10, TypeScript, Prisma ORM, PostgreSQL 16 (Database per service) |
| Frontend web | React 18, Vite 5, TypeScript, TailwindCSS, Zustand |
| Mobile apps | Expo 54, React Native 0.81, TypeScript, Offline Queue |
| Trí tuệ nhân tạo (AI) | `@NEXUS/chatbot-service` (Port 3013): Google Gemini 3 Flash / OpenAI GPT-4o-mini, Hybrid RAG + 5 Realtime Tools, SSE Streaming |
| Động cơ định giá | `@NEXUS/pricing-service` (Port 3012): Unified Multi-platform Engine, IATA $V/6000$, 3 cước vùng chuẩn hóa |
| Messaging | RabbitMQ 3.13 topic exchange `domain.events` + Outbox Relay Pattern |
| Object storage | MinIO/S3-compatible storage lưu trữ ảnh POD chữ ký |
| Local infrastructure | Docker Compose đa container độc lập |

## 3. Bài toán và mục tiêu

Trong vận hành logistics chuyển phát nhanh, một vận đơn bưu chính trải qua chuỗi hành trình phức tạp: khách hàng/chủ shop tạo đơn, ops duyệt/lập yêu cầu lấy hàng, shipper lấy hàng tại bưu cục/kho gửi, trung tâm khai thác (Hub) quét mã phân loại (inbound/outbound), đóng bao niêm phong seal, xếp lên các chuyến xe tải đường dài (Linehaul), trung chuyển qua mạng lưới Hub 4 cấp, shipper chặng cuối giao hàng và thu hộ tiền COD, xử lý giao thất bại (NDR), hoàn hàng theo chính sách phân tầng, và bộ phận kế toán đối soát giải ngân tự động.

Nếu toàn bộ nghiệp vụ nằm trong một khối monolithic, hệ thống sẽ gặp tắc nghẽn nghiêm trọng tại các điểm nóng có tần suất đọc/ghi cực lớn (quét mã barcode hàng loạt, định giá đơn hàng tức thời, streaming phản hồi từ AI, tracking hành trình và đối soát COD). Do đó, dự án được thiết kế theo kiến trúc **15 Microservices độc lập**, tuân thủ nguyên tắc Domain-Driven Design (DDD), phân định ranh giới sở hữu dữ liệu (Database per service) và giao tiếp phi đồng bộ thông qua RabbitMQ.

Mục tiêu chính:

- Quản lý trọn vẹn vòng đời vận đơn từ khởi tạo, trung chuyển qua mạng lưới Hub 4 cấp đến phát thành công, xử lý ngoại lệ hoặc hoàn hàng.
- Tách bạch 15 miền nghiệp vụ: shipment, pickup, dispatch, manifest, scan, delivery, tracking, reporting, payment, pricing, auth, masterdata, chatbot, linehaul và gateway-bff.
- Cung cấp giao diện trực quan cho 6 ứng dụng chuyên biệt phục vụ 5 nhóm người dùng từ nội bộ đến đối tác và khách hàng cá nhân.
- Ứng dụng Hybrid RAG kết hợp Dynamic Function Calling cho trợ lý AI hỗ trợ tra cứu hành trình, ước tính cước phí và giải đáp chính sách bưu chính tức thì.
- Thống nhất động cơ định giá liên nền tảng (Web Merchant, Mobile Khách hàng, Web Khách vãng lai, AI Chatbot) chuẩn công thức quy đổi thể tích hàng không IATA $V/6000$.
- Áp dụng triệt để Database per service, Outbox Relay Pattern và Idempotency Key bảo đảm tính toàn vẹn dữ liệu ngay cả khi mất kết nối mạng (offline-first cho mobile).

## 4. Nhóm người dùng

| Nhóm người dùng | Ứng dụng tương tác | Vai trò chính |
| --- | --- | --- |
| **System Admin** | `admin-web` (:5173) | Quản lý tài khoản, phân quyền RBAC, danh mục Hub 4 cấp, khu vực (zone), lý do NDR, cấu hình tham số toàn hệ thống và kiểm toán audit log. |
| **Ops / Nhân viên vận hành** | `ops-web` (:5175) | Giám sát bảng điều khiển thời gian thực, điều phối pickup, gán việc shipper, quản lý bảng kê manifest/đóng bao, quét mã kho, xử lý NDR, hoàn hàng và đối soát giải ngân COD. |
| **Merchant / Chủ shop B2B** | `merchant-web` (:5176) | Tạo đơn hàng loạt, in phiếu gửi bưu chính có mã vạch, đặt lịch lấy hàng tận nơi, theo dõi tiến độ giao hàng, nhận tiền đối soát COD qua SePay/VietQR. |
| **Shipper / Tài xế chặng cuối** | `courier-mobile` (:8081) | Tiếp nhận nhiệm vụ lấy/giao, quét mã vạch bằng camera, chụp ảnh bằng chứng giao hàng (POD), xác thực mã OTP người nhận, cập nhật NDR, hỗ trợ lưu trữ hàng đợi ngoại tuyến (offline queue). |
| **Khách hàng cá nhân (C-End)** | `customer-mobile` (:8082) & `guest-web` (:5174) | Tạo đơn gửi hàng lẻ, ước tính cước phí đa dịch vụ, tra cứu hành trình trực tiếp không cần đăng nhập, trò chuyện giải đáp 24/7 cùng trợ lý AI Logistics RAG. |

## 5. Phạm vi chức năng cốt lõi

Hệ thống bao phủ đầy đủ các phân hệ nghiệp vụ bưu chính logistics hiện đại:

1. **Quản trị định danh & bảo mật (Auth & RBAC):** Đăng nhập, refresh/logout token bảo mật dạng opaque, kiểm soát quyền truy cập chi tiết theo vai trò và hỗ trợ cấp quyền override trên ứng dụng di động.
2. **Quản trị dữ liệu danh mục (Master Data):** Mạng lưới bưu cục/Hub 4 cấp (Mega Hub, Regional Hub, Provincial Hub, Post Office/Station), bảng khu vực phân vùng địa lý, danh mục lý do giao thất bại (NDR) và thông tin cấu hình merchant.
3. **Động cơ định giá đa nền tảng (Unified Pricing Engine):** Tính cước vận chuyển tức thời theo 3 vùng cước chuẩn hóa (Nội tỉnh / Trục chính / Liên tỉnh), nấc cân lũy tiến và công thức thể tích hàng không IATA $(\text{Dài} \times \text{Rộng} \times \text{Cao}) / 6000$, hỗ trợ tự động bóc tách tiền tố hành chính tỉnh/thành phố.
4. **Vòng đời bưu gửi (Shipment Lifecycle):** Tiếp nhận đơn hàng, lưu snapshot giá cước bất biến, quản trị máy trạng thái (State Machine) từ khởi tạo đến phát thành công hoặc chuyển hoàn.
5. **Điều phối lấy hàng (Pickup & Dispatch):** Lập yêu cầu lấy hàng, phê duyệt tự động/thủ công, phân công nhiệm vụ cho tài xế thu gom theo khu vực phụ trách.
6. **Khai thác kho & Quét mã (Scan Hub):** Quét mã vạch (Barcode/QR) xác nhận lấy hàng, quét nhập kho (Inbound), quét xuất kho (Outbound), ghi nhận mốc thời gian và vị trí vật lý tức thời với cơ chế Idempotency chống ghi trùng.
7. **Đóng túi & Niêm phong (Manifest & Sealing):** Gom các vận đơn lẻ vào bao/túi chuyên dụng, đóng seal an ninh với mã số độc nhất, giao nhận nguyên bao giữa các Hub khai thác.
8. **Vận chuyển đường dài (Linehaul Transit):** Quản lý chuyến xe tải trung chuyển liên tỉnh, cấp tem niêm phong xe (mã `XT`), kết nối các tuyến trục Bắc - Trung - Nam.
9. **Giao hàng chặng cuối & Xử lý ngoại lệ (Last-mile & NDR):** Ghi nhận kết quả giao hàng với chữ ký/ảnh chụp POD, xác thực mã OTP 6 số gửi tới người nhận, ghi nhận sự cố phát thất bại (NDR), kích hoạt quy trình giao lại tối đa 3 lần hoặc khởi tạo luồng chuyển hoàn (Return).
10. **Tài chính & Thu hộ COD (Payment & Settlement):** Quản lý dòng tiền thu hộ COD, tự động gom phiên đối soát theo ngày/bưu cục/shipper, tích hợp cổng thanh toán SePay/VietQR tự động quét biến động số dư và khấu trừ phí hoàn hàng.
11. **Tra cứu & Báo cáo thời gian thực (Tracking & Analytics):** Mô hình hóa dữ liệu đọc (Read Model) dạng timeline trực quan cho khách hàng tra cứu và báo cáo chỉ số hiệu suất KPI (sản lượng, tỷ lệ phát thành công, thời gian hoàn thành).
12. **Trợ lý AI Logistics RAG (Smart Chatbot):** Hỗ trợ tư vấn khách hàng 24/7 thông qua kiến trúc Hybrid RAG + 5 công cụ tra cứu dữ liệu động, trả lời streaming tức thì và cách ly phiên trò chuyện an toàn.

## 6. Kiến trúc tổng quan

Hệ thống triển khai theo mô hình kiến trúc phân tán hiện đại: toàn bộ ứng dụng Client giao tiếp qua cổng duy nhất **`gateway-bff`**, Gateway thực hiện chuyển tiếp đồng bộ (HTTP/SSE) đến các microservice nghiệp vụ, trong khi các sự kiện thay đổi trạng thái bưu phẩm được phát tán phi đồng bộ qua RabbitMQ.

```text
================================ CLIENT TIER (6 APPS) ================================
  admin-web        ops-web        merchant-web    courier-mobile   customer-mobile   guest-web
   (:5173)         (:5175)          (:5176)          (:8081)           (:8082)        (:5174)
      \               \                |               /                 /              /
       \               \               |              /                 /              /
        =======================> [ gateway-bff :3000 ] <==============================
                                       |
    +----------------------------------+----------------------------------+
    | Synchronous HTTP / SSE Streaming                                   |
    v                                                                     v
[ auth-service :3010 ]                                          [ chatbot-service :3013 ]
  (auth_db)                                                       (RAG Vector Store)
[ masterdata-service :3001 ]                                    [ pricing-service :3012 ]
  (masterdata_db)                                                 (IATA Engine - In-memory)
[ shipment-service :3002 ]                                      [ payment-service :3011 ]
  (shipment_db)                                                   (payment_db)
[ pickup-service :3003 ]                                        [ delivery-service :3007 ]
  (pickup_db)                                                     (delivery_db)
[ dispatch-service :3004 ]                                      [ manifest-service :3005 ]
  (dispatch_db)                                                   (manifest_db)
[ scan-service :3006 ]                                          [ linehaul-service :3014 ]
  (scan_db)                                                       (Hub-to-hub transit)
    |
    +--------> Outbox Relay Pattern publishes Domain Events
    |
    v
=================== ASYNCHRONOUS EVENT BUS (RabbitMQ topic: domain.events) ===================
    |
    +---> tracking-service (:3008 / tracking_db)  ==> Chiếu lược đồ Timeline & vị trí bưu gửi
    +---> reporting-service (:3009 / reporting_db) ==> Chiếu lược đồ KPI, tỷ lệ giao, báo cáo
    +---> payment-service   (:3011 / payment_db)   ==> Tiếp nhận sự kiện tạo đơn / thu hộ COD
    +---> shipment-service  (:3002 / shipment_db)  ==> Cập nhật máy trạng thái vòng đời đơn hàng
```

Nguyên tắc kiến trúc:

| Nguyên tắc | Hiện thực cụ thể trong hệ thống |
| --- | --- |
| **Database per service** | Mỗi microservice sở hữu CSDL/Schema PostgreSQL riêng biệt, bảo đảm tính độc lập hoàn toàn và chống coupling trực tiếp giữa các miền dữ liệu. |
| **Cổng vào Gateway/BFF** | Toàn bộ ứng dụng Client Web/Mobile kết nối qua `gateway-bff`, đóng vai trò bảo vệ biên giới, proxy định tuyến, xác thực perimeter và stream SSE từ AI. |
| **Hướng sự kiện (Event-driven)** | Các mốc biến động quan trọng (`shipment.created`, `scan.inbound`, `delivery.delivered`, `cod.collected`) đều phát sinh event lên RabbitMQ để các dịch vụ khác tiêu thụ. |
| **Outbox Relay Pattern** | Dữ liệu nghiệp vụ và bản ghi sự kiện Outbox được ghi vào database trong cùng một Database Transaction trước, sau đó tiến trình background worker đọc và publish lên RabbitMQ, loại bỏ rủi ro mất mát event (at-least-once delivery). |
| **Phân định rõ thẩm quyền dữ liệu** | `shipment-service` nắm quyền quyết định trạng thái nghiệp vụ; `scan-service` nắm giữ lịch sử quét và tọa độ vật lý; `tracking-service` và `reporting-service` chỉ là các Read Model phục vụ tra cứu tốc độ cao. |
| **Cơ chế Idempotency** | Mọi thao tác quét barcode, xác nhận giao hàng và thanh toán đều gắn với `idempotencyKey` duy nhất, cho phép thực hiện lại thao tác an toàn khi mạng chập chờn mà không sợ trùng lặp dữ liệu. |

## 7. Cấu trúc repository

```text
logistics-management-system/
  apps/
    admin-web/          Web quản trị hệ thống, phân quyền RBAC và cấu hình danh mục (:5173)
    ops-web/            Web vận hành trung tâm khai thác, điều phối kho, manifest, COD (:5175)
    merchant-web/       Web cho chủ shop B2B tạo đơn hàng loạt, in phiếu, đối soát COD (:5176)
    courier-mobile/     Ứng dụng di động Expo/React Native cho tài xế giao/lấy hàng (:8081)
    customer-mobile/    Ứng dụng di động Expo/React Native cho khách hàng cá nhân C-End (:8082)
    guest-web/          Web công khai tra cứu vận đơn, tạo đơn lẻ, tính cước và AI Chatbot (:5174)

  services/
    gateway-bff/        API Gateway/BFF, media upload, chat nội bộ, SSE proxy cho AI (:3000)
    auth-service/       Quản lý tài khoản, phiên đăng nhập opaque token, profile quyền (:3010)
    masterdata-service/ Danh mục Hub 4 cấp, bảng phân vùng zone, cấu hình NDR reason (:3001)
    shipment-service/   Quản lý vòng đời bưu phẩm, snapshot giá cước, máy trạng thái đơn (:3002)
    pickup-service/     Quản lý yêu cầu lấy hàng tận nơi từ merchant (:3003)
    dispatch-service/   Điều phối và phân công nhiệm vụ cho tài xế (:3004)
    manifest-service/   Quản lý đóng túi/bao bưu gửi (Manifest), niêm phong kẹp chì seal (:3005)
    scan-service/       Ghi nhận sự kiện quét mã vạch (Pickup/Inbound/Outbound), chống ghi trùng (:3006)
    delivery-service/   Giao hàng chặng cuối, chụp ảnh POD, mã OTP 6 số, xử lý NDR/Return (:3007)
    tracking-service/   Read model tổng hợp lịch sử hành trình vận chuyển thời gian thực (:3008)
    reporting-service/  Read model tổng hợp chỉ số KPI, hiệu suất giao hàng và thống kê (:3009)
    payment-service/    Quản lý thu hộ COD, gom phiên đối soát, tích hợp SePay/VietQR webhook (:3011)
    pricing-service/    Động cơ định giá đa nền tảng chuẩn IATA V/6000, 3 vùng cước chuẩn hóa (:3012)
    chatbot-service/    Trợ lý AI Logistics RAG, Gemini 3 Flash / GPT-4o-mini, 5 dynamic tools (:3013)
    linehaul-service/   Quản lý tuyến xe tải trung chuyển liên tỉnh, cấp tem xe XT (:3014)

  packages/
    messaging/          Thư viện dùng chung kết nối RabbitMQ, outbox relay và consumer
    shared/             Các kiểu dữ liệu TypeScript, enum trạng thái và hằng số dùng chung
    testing/            Tiện ích và mock data phục vụ viết bài kiểm thử tự động
    ui/                 Bộ thư viện thành phần giao diện dùng chung giữa các ứng dụng web

  contracts/
    events/             Quy chuẩn định dạng payload của các Domain Events
    openapi/            Hợp đồng giao tiếp API RESTful theo chuẩn OpenAPI/Swagger

  docs/
    architecture/       Tài liệu thiết kế kiến trúc phân tán và sơ đồ tuần tự hệ thống
    business-sop/       Bộ quy chuẩn nghiệp vụ bưu chính (phân tầng, cước hoàn, hàng dễ vỡ)
    knowledge-base/     Kho tri thức logistics chuẩn hóa dạng Markdown & Vector Index cho AI
    runbook/            Sổ tay hướng dẫn dev cục bộ, chạy migration database và danh sách tài khoản
    service-description/ Mô tả chi tiết giao diện API và cơ chế tích hợp đối tác sàn TMĐT

  infra/
    dev/                Docker Compose cục bộ cho PostgreSQL, RabbitMQ, Redis, MinIO
    prod/               Cấu hình Docker Compose và manifest triển khai môi trường Production

  scripts/              Tập lệnh tự động hóa cài đặt, di chuyển dữ liệu (seed) và khởi chạy
```

Ghi chú triển khai: repository hiện không có `package.json` root; mỗi app/service có package script riêng. Khi build/test/start nên chạy lệnh trong đúng thư mục app/service tương ứng hoặc dùng các script tổng hợp như `run-all.ps1`, `run-all-mac.sh`, `Makefile`.

## 8. Tech stack

### Backend & AI Services

| Công nghệ | Vai trò |
| --- | --- |
| Node.js 20+ & TypeScript 5+ | Môi trường runtime và ngôn ngữ lập trình chính cho toàn bộ backend microservices. |
| NestJS 10 | Framework xây dựng kiến trúc module, DI (Dependency Injection), controller và filter/guard. |
| Prisma ORM | Object-Relational Mapping thao tác với PostgreSQL an toàn kiểu (type-safe). |
| PostgreSQL 16 | CSDL quan hệ chính theo mô hình độc lập Database per service. |
| RabbitMQ 3.13 | Message broker chịu trách nhiệm định tuyến domain events qua topic exchange `domain.events`. |
| amqplib | Thư viện client giao tiếp RabbitMQ tại các dịch vụ có pub/sub sự kiện. |
| MinIO / AWS S3 SDK | Lưu trữ object nhị phân: ảnh chụp bằng chứng giao hàng (POD), hóa đơn, chứng từ. |
| Redis | Lưu trữ cache phân tán, rate limiting và pub/sub cho module realtime chat. |
| Google Gemini 3 Flash / OpenAI GPT-4o-mini | Mô hình ngôn ngữ lớn (LLM) phục vụ trợ lý AI Logistics RAG với cơ chế Fallback tự động. |
| Vector Index & In-memory Embeddings | Lưu trữ 768-dim vector embeddings phục vụ truy xuất tri thức bưu chính (RAG Engine). |

### Frontend Web (4 Apps)

| Công nghệ | Vai trò |
| --- | --- |
| React 18 | Thư viện xây dựng giao diện người dùng component-based. |
| Vite 5 | Công cụ đóng gói (bundler) và máy chủ phát triển siêu tốc (HMR). |
| TypeScript | Đảm bảo tính toàn vẹn kiểu dữ liệu xuyên suốt các tầng giao diện. |
| TailwindCSS | Framework utility-first CSS thiết kế giao diện hiện đại, responsive. |
| React Router v6 | Định tuyến trang (routing) cho admin-web, ops-web, merchant-web và guest-web. |
| TanStack React Query v5 | Quản lý server state, tự động cache, refetch và invalidate dữ liệu nghiệp vụ. |
| Zustand | Quản lý client state: phiên đăng nhập, giỏ hàng, thông tin cấu hình và UI modal. |
| Lucide React | Bộ icon hiện đại, tối ưu dung lượng cho toàn bộ ứng dụng web. |
| Recharts | Trực quan hóa dữ liệu biểu đồ KPI, sản lượng và doanh thu tại Dashboard vận hành. |

### Mobile Applications (2 Apps)

| Công nghệ | Vai trò |
| --- | --- |
| Expo 54 | Nền tảng phát triển ứng dụng di động đa nền tảng (iOS, Android, Web). |
| React Native 0.81 | Bộ khung xây dựng giao diện native mượt mà cho tài xế và khách hàng cá nhân. |
| React Navigation v6 | Điều hướng màn hình (Stack, Bottom Tabs). |
| Expo Camera & Barcode Scanner | Quét mã vạch vận đơn, mã QR thanh toán và chụp ảnh POD chữ ký. |
| Expo Secure Store | Lưu trữ mã định danh thiết bị, token xác thực an toàn trong Keychain/Keystore. |
| NetInfo + Offline Queue | Cơ chế phát hiện trạng thái mạng và lưu trữ tác vụ cục bộ để tự động retry khi có kết nối. |

## 9. Danh mục ứng dụng client (6 Apps)

| App | Đối tượng | Port | Vai trò & Tính năng chính | Lệnh vận hành |
| --- | --- | :---: | --- | --- |
| **`admin-web`** | Quản trị viên (Admin) | `5173` | Quản lý tài khoản toàn hệ thống, phân quyền RBAC, danh mục Hub 4 cấp, bảng vùng cước (Zone), lý do giao thất bại (NDR), tham số hệ thống và nhật ký kiểm toán. | `pnpm run dev`<br>`pnpm run build`<br>`pnpm run test:smoke` |
| **`ops-web`** | Nhân viên vận hành (Ops) | `5175` | Dashboard giám sát thời gian thực, quản lý đơn hàng, duyệt yêu cầu pickup, phân công shipper, đóng bao manifest, quét mã kho Inbound/Outbound, xử lý sự cố NDR, hoàn hàng, đối soát COD. | `pnpm run dev`<br>`pnpm run build`<br>`pnpm run test:smoke` |
| **`merchant-web`** | Chủ shop B2B (Merchant) | `5176` | Tạo đơn hàng loạt (Excel/Form), in phiếu gửi bưu chính chuẩn A6/A7, đặt lịch lấy hàng tận nơi, tra cứu trạng thái đơn, theo dõi lịch sử đối soát và nhận tiền COD qua VietQR. | `pnpm run dev`<br>`pnpm run build` |
| **`courier-mobile`** | Tài xế giao/lấy (Courier) | `8081` | Quản lý danh sách nhiệm vụ trong ngày, quét barcode nhận hàng, chụp ảnh ký nhận POD, nhập mã OTP 6 số xác thực người nhận, báo cáo NDR, hỗ trợ hoạt động ngoại tuyến (Offline-first). | `pnpm run start`<br>`pnpm run typecheck`<br>`pnpm run test:maestro` |
| **`customer-mobile`** | Khách cá nhân C-End | `8082` | Ứng dụng di động cho người gửi lẻ: tính cước tự động, tạo đơn bưu gửi, tra cứu hành trình theo thời gian thực, quản lý sổ địa chỉ, tích hợp cửa sổ trò chuyện nổi cùng trợ lý AI Logistics RAG. | `pnpm run start`<br>`pnpm run typecheck` |
| **`guest-web`** | Khách vãng lai & Tra cứu | `5174` | Cổng thông tin công khai: tra cứu hành trình vận đơn qua timeline trực quan, ước tính cước phí bưu chính IATA đa dịch vụ, tạo đơn khách vãng lai, trò chuyện cùng trợ lý ảo AI. | `pnpm run dev`<br>`pnpm run build` |

## 10. Danh mục backend microservices (15 Services)

| Service | Port | Database | Trách nhiệm & Nghiệp vụ chính |
| --- | :---: | --- | --- |
| **`gateway-bff`** | `3000` | `chat_db` + Redis | Điểm truy cập duy nhất (Single Entrypoint) cho 6 Client apps; proxy định tuyến, xác thực perimeter, upload ảnh POD qua MinIO/S3, tích hợp sàn TMĐT, SSE proxy cho AI chatbot streaming. |
| **`masterdata-service`** | `3001` | `masterdata_db` | Quản trị danh mục bưu cục/Hub 4 cấp (Mega Hub, Regional, Provincial, Post Office), bảng phân vùng Zone địa lý, danh mục lý do NDR, cấu hình merchant profile. |
| **`shipment-service`** | `3002` | `shipment_db` | Nguồn chân lý (Source of Truth) cho trạng thái nghiệp vụ và vòng đời bưu phẩm; quản lý máy trạng thái (State Machine), lưu trữ snapshot giá cước bất biến khi tạo đơn. |
| **`pickup-service`** | `3003` | `pickup_db` | Quản lý vòng đời yêu cầu lấy hàng tận nơi từ merchant: khởi tạo, duyệt, hủy và phân tách danh sách bưu kiện cần lấy. |
| **`dispatch-service`** | `3004` | `dispatch_db` | Quản lý nhiệm vụ (Tasks) điều phối tài xế: gán việc shipper theo tuyến, tái phân bổ khi quá tải và cập nhật tiến độ theo thời gian thực. |
| **`manifest-service`** | `3005` | `manifest_db` | Quản lý bảng kê và túi bưu gửi: gom nhiều vận đơn lẻ vào bao hàng (mã `MB`), niêm phong kẹp chì an ninh (Seal), xác nhận bàn giao nguyên niêm giữa các hub. |
| **`scan-service`** | `3006` | `scan_db` | Nguồn chân lý cho tọa độ vật lý và lịch sử quét mã vạch: ghi nhận các mốc quét lấy (Pickup), quét nhập kho (Inbound), quét xuất kho (Outbound) với cơ chế Idempotency chống trùng. |
| **`delivery-service`** | `3007` | `delivery_db` | Quản lý kết quả phát hàng chặng cuối: xác nhận phát thành công với chữ ký số/ảnh POD, xác thực mã OTP 6 số, xử lý sự cố phát thất bại (NDR) và điều phối luồng chuyển hoàn (Return Case). |
| **`tracking-service`** | `3008` | `tracking_db` | Read model phi tập trung phục vụ tra cứu tốc độ cao: tiêu thụ các domain events từ RabbitMQ để dựng timeline hành trình chi tiết của bưu gửi. |
| **`reporting-service`** | `3009` | `reporting_db` | Read model tổng hợp phân tích: tính toán KPI theo ngày/tháng, sản lượng bưu cục, tỷ lệ giao đúng hạn SLA, hiệu suất shipper và báo cáo tài chính. |
| **`auth-service`** | `3010` | `auth_db` | Quản lý danh tính người dùng, cấp phát và thu hồi phiên đăng nhập Opaque Token, quản lý quyền hạn RBAC và nhật ký bảo mật Admin Audit. |
| **`payment-service`** | `3011` | `payment_db` | Nguồn chân lý cho đối soát tài chính & COD: ghi nhận tiền thu hộ, gom phiên đối soát tự động (Settlement Batch), tích hợp Webhook SePay/VietQR quét biến động số dư. |
| **`pricing-service`** | `3012` | *(In-memory)* | Động cơ định giá chuẩn hóa đa nền tảng: tính cước bưu chính dựa trên 3 vùng (Nội tỉnh / Trục chính / Liên tỉnh), nấc vượt cân lũy tiến và công thức quy đổi thể tích hàng không IATA $V/6000$. |
| **`chatbot-service`** | `3013` | Vector Store | Phân hệ trợ lý trí tuệ nhân tạo chuyên biệt: kiến trúc Hybrid RAG + 5 công cụ tra cứu động (Dynamic Tools), mô hình Google Gemini 3 Flash kết hợp Fallback OpenAI GPT-4o-mini, truyền dữ liệu dạng SSE streaming. |
| **`linehaul-service`** | `3014` | *(In-transit)* | Quản lý các chuyến xe tải trung chuyển đường dài giữa các trung tâm khai thác (Hub-to-Hub transit), điều phối xe, tài xế và cấp tem niêm phong thùng xe (mã `XT`). |

## 11. Phân định thẩm quyền dữ liệu (Data Ownership)

| Miền dữ liệu | Service sở hữu (Source of Truth) | Nguyên tắc thiết kế |
| --- | --- | --- |
| Tài khoản, Session, Opaque Token, Quyền hạn | `auth-service` | Duy nhất sở hữu bảng User và phân quyền; các service khác chỉ nhận user context qua Gateway. |
| Danh mục Bưu cục/Hub, Tuyến, Vùng Zone, Lý do NDR | `masterdata-service` | Dữ liệu danh mục nền tảng toàn hệ thống, cung cấp cho các service khác qua API nội bộ. |
| Vòng đời bưu phẩm & `currentStatus` | `shipment-service` | Sở hữu máy trạng thái đơn hàng; mọi thay đổi trạng thái đều phải thông qua kiểm tra hợp lệ tại đây. |
| Bảng báo giá cước & Công thức IATA | `pricing-service` | Nguồn tính toán cước; khi đơn hàng tạo thành công, giá cước được snapshot vào metadata của `shipment-service`. |
| Yêu cầu lấy hàng (Pickup Request) | `pickup-service` | Quản lý trạng thái và danh sách hàng cần lấy từ kho người gửi. |
| Phân bổ công việc (Task Assignment) | `dispatch-service` | Quản lý danh sách nhiệm vụ gán cho tài xế giao/nhận. |
| Bảng kê Manifest, Túi hàng (Bag), Kẹp chì Seal | `manifest-service` | Quản lý quy cách đóng gói cấp 2 (túi bưu gửi) luân chuyển giữa các Hub. |
| Lịch sử quét mã & Tọa độ vật lý hiện tại | `scan-service` | Nguồn chân lý cho vị trí thực tế của bưu phẩm; chống ghi nhận trùng lặp bằng Idempotency. |
| Kết quả phát, Bằng chứng POD, OTP, NDR, Hoàn hàng | `delivery-service` | Nguồn chân lý cho kết quả giao hàng và quy trình xử lý khiếu nại/giao lại/chuyển hoàn. |
| Sổ cái thu hộ COD, Phiên đối soát, Giao dịch SePay | `payment-service` | Nguồn chân lý cho tiền thu hộ COD, lịch sử thanh toán và giải ngân qua tài khoản ngân hàng. |
| Chuyến xe trung chuyển liên tỉnh (Linehaul Trip) | `linehaul-service` | Quản lý điều động xe tải đường dài, tem niêm phong xe `XT` và lịch trình kết nối liên miền. |
| Ngữ cảnh hội thoại & Bộ nhớ Vector RAG | `chatbot-service` | Quản lý phiên hội thoại AI, lịch sử tin nhắn và cơ sở dữ liệu Vector Index tri thức bưu chính. |
| Timeline hành trình bưu phẩm | `tracking-service` | Read Model tổng hợp từ các domain events, tối ưu cho khách hàng tra cứu tốc độ mili-giây. |
| Báo cáo thống kê, KPI vận hành & Doanh thu | `reporting-service` | Read Model phân tích tổng hợp từ các sự kiện trong hệ thống. |

## 12. Kiến trúc cơ sở dữ liệu (Database Architecture)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc **Database per service**. Trong môi trường phát triển cục bộ (Local Dev), các cơ sở dữ liệu được khởi tạo độc lập thông qua script `infra/dev/postgres/init-multiple-dbs.sql`:

```sql
CREATE DATABASE auth_db;
CREATE DATABASE masterdata_db;
CREATE DATABASE shipment_db;
CREATE DATABASE pickup_db;
CREATE DATABASE dispatch_db;
CREATE DATABASE manifest_db;
CREATE DATABASE scan_db;
CREATE DATABASE delivery_db;
CREATE DATABASE tracking_db;
CREATE DATABASE reporting_db;
CREATE DATABASE payment_db;
CREATE DATABASE chat_db;
```

Mỗi microservice sở hữu một schema Prisma riêng biệt, phản ánh đúng bounded context của mình:

| Service | Các Model chính trong CSDL |
| --- | --- |
| `auth-service` | `UserAccount`, `AuthSession`, `MobilePermissionProfile`, `MobilePermissionOverride`, `AdminAuditLog`, `OutboxEvent` |
| `masterdata-service` | `Hub`, `Zone`, `NdrReason`, `Config`, `MerchantProfile`, `AdminAuditLog`, `OutboxEvent` |
| `shipment-service` | `Shipment`, `ChangeRequest`, `OutboxEvent` |
| `pickup-service` | `PickupRequest`, `PickupItem`, `OutboxEvent` |
| `dispatch-service` | `Task`, `TaskAssignment`, `OpsAuditLog`, `OutboxEvent` |
| `manifest-service` | `Manifest`, `ManifestItem`, `SealRecord`, `ReceiveRecord`, `OpsAuditLog`, `OutboxEvent` |
| `scan-service` | `ScanEvent`, `CurrentLocation`, `IdempotencyRecord`, `OpsAuditLog`, `OutboxEvent` |
| `delivery-service` | `DeliveryAttempt`, `Pod`, `OtpRecord`, `NdrCase`, `ReturnCase`, `IdempotencyRecord`, `OpsAuditLog`, `OutboxEvent` |
| `tracking-service` | `TimelineEvent`, `TrackingCurrent`, `TrackingIndex` |
| `reporting-service` | `KpiDaily`, `KpiMonthly`, `AggregationJob`, `ShipmentStatusProjection` |
| `payment-service` | `CodRecord`, `CodSettlementBatch`, `CodSettlementPaymentEvent`, `CodSettlementItem`, `IdempotencyRecord`, `OutboxEvent` |
| `chatbot-service` | In-memory Vector Index (768-dim embeddings lưu tại `vector-index.json`) + Context Memory Isolation |

## 13. Kiến trúc hướng sự kiện (Event-driven Architecture)

Toàn bộ thông tin biến động trạng thái được phát tán qua RabbitMQ với cấu hình topic exchange:

```text
Exchange: domain.events
Type: topic
Durable: true
Queue naming: {service-name}.q (ví dụ: tracking-service.q, shipment-service.q)
Retry/DLQ convention: {service-name}.retry.* / {service-name}.dlq
```

Danh mục Domain Events tiêu biểu:

| Nhóm nghiệp vụ | Tên Event | Ý nghĩa nghiệp vụ |
| --- | --- | --- |
| **Shipment** | `shipment.created` | Vận đơn mới được tạo thành công cùng snapshot giá cước. |
| **Pickup** | `pickup.requested`<br>`pickup.approved` | Merchant yêu cầu lấy hàng; Ops duyệt yêu cầu lấy hàng. |
| **Dispatch** | `task.assigned`<br>`task.completed` | Gán nhiệm vụ cho tài xế; Tài xế hoàn tất công việc. |
| **Manifest** | `manifest.sealed`<br>`manifest.received`<br>`manifest.unsealed` | Đóng bao niêm phong seal; Bưu cục nhận bao; Mở bao kiểm đếm. |
| **Scan** | `scan.pickup_confirmed`<br>`scan.inbound`<br>`scan.outbound` | Shipper quét nhận hàng; Quét nhập kho khai thác; Quét xuất kho. |
| **Linehaul** | `linehaul.dispatched`<br>`linehaul.arrived` | Xe tải đường dài xuất phát; Xe tải tới trung tâm đích. |
| **Delivery** | `delivery.attempted`<br>`delivery.delivered`<br>`delivery.failed`<br>`ndr.created`<br>`return.started`<br>`return.completed` | Điểm phát hàng; Giao thành công (POD/OTP); Giao thất bại; Ghi nhận biên bản NDR; Khởi động luồng chuyển hoàn; Hoàn hàng về shop thành công. |
| **Payment** | `cod.collected`<br>`cod.collection_failed`<br>`cod.remitted` | Thu tiền COD thành công; Khách không trả COD; Đã giải ngân chuyển khoản cho người gửi qua SePay. |
| **Master / Auth** | `auth.session_created`<br>`auth.session_revoked`<br>`masterdata.updated` | Đăng nhập mới; Đăng xuất/Thu hồi phiên; Cập nhật danh mục bưu cục/cấu hình. |

Luồng publish/consume ở mức tổng quan:

| Service | Publish | Consume |
| --- | --- | --- |
| `shipment-service` | `shipment.created` | Pickup/task/scan/manifest/delivery/NDR/return events để cập nhật `currentStatus`. |
| `pickup-service` | `pickup.requested`, `pickup.approved` | Tùy flow pickup hiện hành. |
| `dispatch-service` | `task.assigned` | `pickup.approved`, `delivery.failed`, `return.started`, `return.completed`. |
| `manifest-service` | `manifest.sealed`, `manifest.received`, `manifest.unsealed` | `scan.outbound`. |
| `scan-service` | `scan.pickup_confirmed`, `scan.inbound`, `scan.outbound` | `manifest.sealed`. |
| `delivery-service` | `delivery.attempted`, `delivery.delivered`, `delivery.failed`, `ndr.created`, `return.started`, `return.completed` | `task.assigned`. |
| `payment-service` | `cod.collected`, `cod.collection_failed`, `cod.remitted` | `shipment.created`. |
| `tracking-service` | Không publish | Business events để dựng timeline/current tracking. |
| `reporting-service` | Không publish | Business events để aggregate KPI và projection. |

## 14. Vòng đời vận đơn

Vòng đời vận đơn được quyết định bởi `shipment-service`. Các service khác phát sinh sự kiện nghiệp vụ; `shipment-service` tiêu thụ event hợp lệ và cập nhật trạng thái theo state machine.

Luồng chuẩn:

```text
CREATED
-> UPDATED / PICKUP_REQUESTED
-> TASK_ASSIGNED
-> PICKUP_COMPLETED
-> MANIFEST_SEALED
-> SEND_GOODS
-> IN_TRANSIT
-> SCAN_INBOUND
-> SCAN_OUTBOUND / TASK_ASSIGNED
-> DELIVERED
```

Luồng giao thất bại/hoàn:

```text
DELIVERY_FAILED
-> NDR_CREATED
-> RETURN_STARTED
-> RETURN_COMPLETED
```

Trạng thái terminal thường gặp:

- `DELIVERED`
- `RETURN_COMPLETED`
- `CANCELLED`

Các trạng thái vận hành phụ có thể xuất hiện tùy flow:

- `MANIFEST_RECEIVED`
- `MANIFEST_UNSEALED`
- `INVENTORY_CHECK`
- `EXCEPTION`

## 15. Luồng nghiệp vụ tiêu biểu

### 15.1 Tạo đơn và pickup

1. Merchant tạo shipment trên `merchant-web`.
2. `gateway-bff` forward request đến `shipment-service`.
3. `shipment-service` gọi/tính pricing, tạo shipment và publish `shipment.created`.
4. Merchant hoặc ops tạo pickup request qua `pickup-service`.
5. Ops duyệt pickup request, `pickup-service` publish `pickup.approved`.
6. `dispatch-service` tạo/gán pickup task cho courier và publish `task.assigned`.
7. Courier nhận task trên `courier-mobile`.
8. Courier scan pickup, `scan-service` ghi scan và publish `scan.pickup_confirmed`.
9. `shipment-service`, `tracking-service`, `reporting-service` cập nhật trạng thái/read model từ event.

### 15.2 Trung chuyển qua hub

1. Ops tạo manifest/bag và thêm các shipment.
2. Ops seal manifest tại hub gốc, `manifest-service` publish `manifest.sealed`.
3. Hàng được gửi đi, scan outbound/inbound được ghi nhận qua `scan-service`.
4. Nếu qua nhiều hub, chu kỳ `SCAN_INBOUND -> SEND_GOODS -> IN_TRANSIT -> SCAN_INBOUND` có thể lặp lại.
5. Khi hàng đến hub giao cuối, hệ thống/ops gán delivery task cho courier.

### 15.3 Giao hàng, NDR và return

1. Courier nhận delivery task.
2. Nếu giao thành công, courier gửi POD/OTP và idempotency key.
3. `delivery-service` ghi delivery attempt, POD/OTP, publish `delivery.delivered`.
4. Nếu giao thất bại, courier chọn lý do, `delivery-service` publish `delivery.failed` và có thể tạo `ndr.created`.
5. Ops xử lý NDR: giao lại, exception hoặc bắt đầu hoàn hàng.
6. Return flow publish `return.started` và `return.completed` khi hoàn tất.

### 15.4 COD settlement

1. `payment-service` consume `shipment.created` để tạo `CodRecord` nếu đơn có COD.
2. Khi giao thành công và thu COD, ops/courier flow cập nhật record thành collected và publish `cod.collected`.
3. Ops tạo settlement batch theo ngày/hub/courier.
4. Hệ thống tạo thông tin chuyển khoản/VietQR.
5. SePay webhook hoặc thao tác xác nhận cập nhật remittance và publish `cod.remitted`.

### 15.5 Chuẩn hóa định giá đa nền tảng (Unified Multi-platform Pricing Engine)

Hệ thống triển khai một công cụ định giá chuẩn hóa duy nhất tại `@NEXUS/pricing-service` (bản phát hành biểu phí `NEXUS_RATES_2026_05`). Mọi ứng dụng client (Web Merchant, Mobile Khách hàng, Web Khách vãng lai và cả Trợ lý ảo AI) đều áp dụng một thuật toán và biểu phí thống nhất, triệt tiêu hoàn toàn sự sai lệch cước:

1. **Công thức tính trọng lượng tính cước (Chargeable Weight):**
   Tuân thủ nghiêm ngặt quy định Hiệp hội Vận tải Hàng không Quốc tế (IATA):
   $$\text{Trọng lượng quy đổi thể tích } (kg) = \frac{\text{Dài (cm)} \times \text{Rộng (cm)} \times \text{Cao (cm)}}{6000}$$
   $$\text{Trọng lượng tính cước } W = \max(\text{Trọng lượng thực tế}, \text{Trọng lượng thể tích})$$

2. **Quy tắc phân 3 vùng cước chuẩn hóa:**
   - **Nội tỉnh (Intra-province):** Tỉnh/thành phố gửi trùng tỉnh/thành phố nhận (phụ phí tuyến vùng = 0đ).
   - **Trục chính (Metro Corridor):** Tuyến kết nối đặc biệt giữa 2 đầu cầu kinh tế trọng điểm Hà Nội $\leftrightarrow$ TP. Hồ Chí Minh (phụ phí tuyến vùng = 7.000đ).
   - **Liên tỉnh (Inter-province):** Tuyến vận chuyển giữa các tỉnh thành khác nhau trên cả nước (phụ phí tuyến vùng = 12.000đ).

3. **Biểu phí cơ sở & nấc vượt cân lũy tiến:**
   - *Giao Tiết Kiệm (Economy):* Cước gốc 18.000đ (cho 2kg đầu), vượt cân +3.500đ/0.5kg tiếp theo.
   - *Giao Tiêu Chuẩn (Standard):* Cước gốc 28.000đ (cho 2kg đầu), vượt cân +5.000đ/0.5kg tiếp theo.
   - *Giao Hỏa Tốc (Express):* Cước gốc 42.000đ (cho 1kg đầu), vượt cân +8.000đ/0.5kg tiếp theo.

4. **Tự động bóc tách tiền tố hành chính (Administrative Normalization):**
   Cơ chế regex chuẩn hóa tự động loại bỏ các tiền tố `"Tỉnh"`, `"Thành phố"`, `"TP."`, `"Tp"`, khoảng trắng thừa và dấu thanh tiếng Việt; tích hợp bảng ánh xạ bí danh (Alias Mapping: *Sài Gòn* $\to$ *TP. Hồ Chí Minh*, *TP HCM* $\to$ *Hồ Chí Minh*), bảo đảm mọi nền tảng gửi dữ liệu dạng tự do đều nhận được kết quả định giá chính xác tuyệt đối.

5. **Tối ưu trải nghiệm (Debounce 300ms):**
   Form tạo đơn trên Web và Mobile áp dụng kỹ thuật Debounce 300ms khi người dùng thay đổi kích thước/khối lượng, giúp giảm hơn 80% số lượng request tính cước dư thừa lên backend Gateway.

### 15.6 Chính sách phân tầng khách hàng & Cước hoàn tự động (3-Tier Customer Model & Reverse Logistics)

Hệ thống phân tầng khách hàng thành 3 nhóm đối tượng rõ rệt để áp dụng chính sách ưu đãi và xử lý cước chuyển hoàn (Reverse Logistics) tự động:

| Tiêu chí | Khách vãng lai (Guest) | Chủ shop tiêu chuẩn (Standard SME) | Khách doanh nghiệp (VIP Enterprise) |
| :--- | :--- | :--- | :--- |
| **Định danh** | Khách lẻ, không ký hợp đồng | Chủ shop online có tài khoản hệ thống | Doanh nghiệp ký hợp đồng cam kết sản lượng |
| **Giá cước gửi** | 100% biểu cước chuẩn | Giảm 5% trên biểu cước chuẩn | Chiết khấu 15% - 25% theo hợp đồng khung |
| **Cước chuyển hoàn** | **50% cước chiều đi** | **50% cước chiều đi** | **Miễn phí 100% (0đ)** |
| **Cơ chế thanh toán hoàn** | Thu tiền mặt / quét mã VietQR khi Shipper phát trả kiện hàng tận tay | **Khấu trừ tự động** vào bảng kê đối soát COD (COD Batch Settlement) của kỳ gần nhất | Ghi nhận công nợ hợp đồng tháng, thanh toán chuyển khoản định kỳ |

*Quy trình cước hoàn:* Khi đơn hàng rơi vào trạng thái `DELIVERY_FAILED` sau 3 lần phát và kích hoạt `RETURN_STARTED`, hệ thống kiểm tra hạng khách hàng:
- Với Guest: Tạo yêu cầu thu cước hoàn khi tài xế giao trả hàng.
- Với Standard SME: `payment-service` tự động sinh bản ghi nợ cước hoàn và trừ trực tiếp vào số tiền COD giải ngân.
- Với VIP Enterprise: Hệ thống ghi nhận phí 0đ theo thỏa thuận hợp đồng.

### 15.7 Quy trình tiếp nhận hàng dễ vỡ & Bồi thường bảo hiểm 100% (SOP Bảo Hiểm Bưu Chính)

Để bảo vệ quyền lợi khách hàng và chuẩn hóa nghiệp vụ vận hành, hệ thống thiết lập bộ quy chuẩn nghiêm ngặt tuân thủ **Điều 25 Luật Bưu chính Việt Nam**:

1. **Quy cách đóng gói bắt buộc cho hàng dễ vỡ:**
   - Hàng gốm sứ, thủy tinh, đồ điện tử phải bọc tối thiểu 3 - 4 lớp màng xốp bóng khí (bubble wrap) với độ dày tối thiểu 5cm.
   - Thùng carton chịu lực 3 - 5 lớp, chèn xốp hoặc mút định hình 6 mặt, không có khoảng trống lắc dịch chuyển.
   - Hệ thống tự động gán nhãn tem cảnh báo `[FRAGILE - HÀNG DỄ VỠ - XIN NHẸ TAY]` trên phiếu gửi in ra.

2. **Chính sách bảo hiểm khai giá (Declared Value Insurance):**
   - Hàng hóa có giá trị dưới 1.000.000đ: Mặc định bảo hiểm cơ bản, phí 0đ.
   - Hàng hóa có giá trị từ 1.000.000đ - 20.000.000đ: Phí bảo hiểm 0.5% giá trị khai báo.
   - Hàng hóa trên 20.000.000đ: Bắt buộc kiểm tra niêm phong đặc biệt và thẩm định chứng từ hóa đơn GTGT.

3. **Chế tài bồi thường 100% khi xảy ra sự cố:**
   - **Trường hợp bưu gửi có khai giá & đóng gói đúng quy chuẩn:** Bồi thường **100% giá trị khai báo** nếu bưu gửi bị mất mát hoặc vỡ nát hoàn toàn do lỗi vận chuyển của Nexus.
   - **Trường hợp bưu gửi không khai giá:** Bồi thường theo quy định Điều 25 Luật Bưu chính: tối đa 04 lần cước dịch vụ bưu chính đã thu.
   - **Xác định trách nhiệm nội bộ:** Biên bản bất thường (Damage Inspection Report) chụp ảnh hiện trường, camera khai thác và lịch sử quét seal; chi phí bồi thường được khấu trừ theo tỷ lệ trách nhiệm của bưu cục làm hỏng/tài xế vi phạm.

### 15.8 Mạng lưới Hub 4 cấp & Chuyến xe trung chuyển Linehaul (4-Tier Hub Network)

Mô hình vận hành của Nexus Express System được tổ chức theo mạng lưới Hub-and-Spoke 4 cấp phân cấp rõ ràng:

```text
[ Mega Hub / Trung tâm khai thác liên vùng ] (Cấp 1: MB, MT, MN)
       ▲                               ▲
       │ Tuyến xe tải Linehaul (Tem XT)│
       ▼                               ▼
[ Regional Hub / Trung tâm trung chuyển khu vực ] (Cấp 2)
       ▲                               ▲
       │ Tuyến gom xe tải nội vùng     │
       ▼                               ▼
[ Provincial Hub / Bưu cục tỉnh, thành ] (Cấp 3)
       ▲                               ▲
       │ Xe tải nhỏ / Xe máy trung chuyển
       ▼                               ▼
[ Post Office & Station / Bưu cục giao dịch, điểm gửi hàng ] (Cấp 4)
       ▲
       │ Shipper giao/lấy tận nhà
       ▼
[ Khách hàng gửi & Người nhận chặng cuối ]
```

- **Cấp 1 - Mega Hub (Trung tâm liên vùng):** Điểm nút giao thông lớn nhất (Hà Nội, Đà Nẵng, TP. Hồ Chí Minh), trang bị băng chuyền chia chọn tự động, kết nối các luồng xe tải đường dài Linehaul.
- **Cấp 2 - Regional Hub (Trung tâm khu vực):** Tiếp nhận hàng từ các tỉnh lân cận, đóng bao gom chuyến (Manifest & Sealing).
- **Cấp 3 - Provincial Hub (Bưu cục cấp tỉnh):** Phân chia bưu kiện về các quận huyện thị xã.
- **Cấp 4 - Local Post Office / Station (Bưu cục giao dịch):** Điểm tiếp nhận bưu gửi trực tiếp từ người dân, bưu cục phát chặng cuối quản lý các shipper khu vực.

### 15.9 Phân hệ Trợ lý AI Logistics RAG & Dynamic Tool Calling

Phân hệ `@NEXUS/chatbot-service` (Port 3013) là điểm đột phá của hệ thống, cung cấp trợ lý ảo thông minh phục vụ khách hàng trên Web và Mobile:

1. **Kiến trúc Hybrid RAG:**
   - **Knowledge Base chuẩn hóa:** Chứa các tài liệu Markdown về biểu phí IATA, quy trình bồi thường Điều 25 Luật Bưu chính, danh mục hàng cấm gửi/cấm bay, quy định pin lithium và SOP đóng gói.
   - **Vector Database:** 768-dim vector embeddings được tính toán trước, cho phép truy xuất ngữ nghĩa chính xác (Semantic Search) ngay cả khi câu hỏi dùng từ ngữ địa phương hoặc tiếng lóng.

2. **Bộ 5 công cụ tra cứu động (Dynamic Tools):**
   - `track_shipment(tracking_number)`: Tra cứu hành trình thực tế từ `tracking-service`.
   - `calculate_shipping_rate(origin, destination, weight, dimensions)`: Gọi động cơ tính cước từ `pricing-service`.
   - `get_prohibited_goods_policy(item_name)`: Kiểm tra danh mục hàng cấm gửi/hạn chế bay.
   - `get_compensation_claim_policy()`: Truy xuất quy định bồi hoàn bưu chính.
   - `find_nearest_post_office(province, district)`: Tra cứu bưu cục gần nhất từ `masterdata-service`.

3. **Cơ chế Fallback thông minh & Tối ưu hiệu năng:**
   - Ưu tiên gọi **Google Gemini 3 Flash** cho tốc độ phản hồi cực nhanh; tự động chuyển đổi sang **OpenAI GPT-4o-mini** nếu xảy ra sự cố API hoặc hết hạn ngạch (Zero Downtime).
   - Áp dụng `Promise.all` xử lý song song các tác vụ gọi tool, giảm hơn 65% thời gian phản hồi (Latency).
   - Truyền dữ liệu dạng **Server-Sent Events (SSE)**, giúp giao diện hiển thị câu trả lời dạng gõ máy chữ (Typewriter Effect) chân thực và cách ly phiên trò chuyện an toàn giữa từng người dùng.

## 16. API Gateway routing

`gateway-bff` là cổng vào duy nhất cho web/mobile client.

```text
Client request
  -> gateway-bff :3000
      /auth/*      -> auth-service (:3010)
      /merchant/*  -> shipment, pickup, tracking, pricing, integration...
      /ops/*       -> domain services phục vụ vận hành (manifest, dispatch, masterdata...)
      /courier/*   -> auth, dispatch, scan, delivery, media...
      /public/*    -> tracking/payment public endpoints
      /pricing/*   -> pricing-service (:3012 - Unified multi-platform rates)
      /chatbot/*   -> chatbot-service (:3013 - SSE streaming, RAG tools, session history)
      /linehaul/*  -> linehaul-service (:3014 - Hub-to-hub trip management)
      /media/*     -> MinIO/S3 upload/download ảnh POD chữ ký
      /health      -> self health check
```

Auth gateway hiện có `GatewayAuthGuard`. Tùy cấu hình `GATEWAY_AUTH_ENABLED`, gateway có thể chỉ kiểm tra sự tồn tại của `Authorization` header ở perimeter; token/session chi tiết thuộc phạm vi `auth-service`.

## 17. Idempotency và reliability

Các điểm chống trùng chính:

| Tầng | Cơ chế |
| --- | --- |
| Courier mobile | Tạo `idempotencyKey` cố định cho mỗi delivery/scan attempt, giữ nguyên khi offline retry. |
| `scan-service` | `IdempotencyRecord` chống ghi trùng scan khi retry. |
| `delivery-service` | Scoped key như `delivery.success:{key}` hoặc `delivery.fail:{key}` để trả lại response cũ nếu request lặp. |
| `payment-service` | `IdempotencyRecord` và unique constraints cho các thao tác thanh toán/COD. |
| `reporting-service` | `AggregationJob.jobKey = event_id` unique để mỗi event chỉ project một lần. |
| Outbox relay | Ghi event vào DB trước, publish sau để giảm rủi ro mất event khi service lỗi giữa chừng. |

## 18. Quy tắc sinh mã

| Loại mã | Quy tắc | Ví dụ |
| --- | --- | --- |
| Mã miền/hub tổng | `001`, `002`, `003` cho Bắc/Trung/Nam | `001` |
| Mã hub/bưu cục | `<mã miền><chữ khu vực><3 số>` | `001A001`, `002C001`, `003S001` |
| Mã tuyến | Mỗi hub có tuyến `01` đến `10` | `001A001-01` |
| Mã vận đơn sàn TMĐT | `111` + 9 số | `111000000001` |
| Mã vận đơn shop | `101` + 9 số | `101000000001` |
| Mã đơn thu hồi/hoàn | `222` + 9 số | `222000000001` |
| Mã đơn khách lẻ | `333` + 9 số | `333000000001` |
| Mã bao | `MB` + 10 số | `MB0000000001` |
| Mã tem xe | `XT` + 10 số | `XT0000000001` |
| Admin username | `10000` + 3 số | `10000001` |
| Ops username | `20000` + 3 số | `20000001` |
| Courier username | `3000` + 4 số | `30000001` |
| Merchant username | `411` + 5 số | `41100001` |

## 19. Local development

### 19.1 Start infrastructure

```bash
cd infra/dev
docker compose up -d
```

Infra dev gồm:

| Thành phần | Port |
| --- | ---: |
| PostgreSQL | `15432 -> 5432` |
| RabbitMQ | `5672`, management UI `15672` |
| Redis | `6379` |
| MinIO | API `9000`, console `9001` |

### 19.2 Prepare database cho service

Chạy trong từng service có Prisma:

```bash
pnpm install
pnpm run db:prepare
```

Seed data chính thường nằm ở:

```bash
cd services/auth-service && pnpm run db:seed
cd services/masterdata-service && pnpm run db:seed
```

### 19.3 Start services và apps

Có thể dùng script tổng hợp:

```bash
./run-all-mac.sh
# hoặc trên Windows
./run-all.ps1
```

Hoặc chạy riêng từng app/service:

```bash
cd services/gateway-bff && pnpm run start:dev
cd services/pricing-service && pnpm run start:dev
cd services/chatbot-service && pnpm run start:dev
cd apps/ops-web && pnpm run dev
cd apps/merchant-web && pnpm run dev
cd apps/guest-web && pnpm run dev
cd apps/customer-mobile && pnpm run start
cd apps/courier-mobile && pnpm run start
```

## 20. Environment variables quan trọng

| Nhóm | Biến tiêu biểu |
| --- | --- |
| Gateway/service URLs | `AUTH_SERVICE_URL`, `SHIPMENT_SERVICE_URL`, `PICKUP_SERVICE_URL`, `DELIVERY_SERVICE_URL`, `PRICING_SERVICE_URL`, `CHATBOT_SERVICE_URL`, `LINEHAUL_SERVICE_URL` |
| Database | `DATABASE_URL`, `CHAT_DATABASE_URL` |
| RabbitMQ | `RABBITMQ_URL`, `DOMAIN_EVENTS_EXCHANGE`, `RABBITMQ_MANAGEMENT_PORT` |
| Outbox/reporting | `OUTBOX_RELAY_INTERVAL_MS`, `OUTBOX_RELAY_BATCH_SIZE`, `REPORTING_CONSUMER_INTERVAL_MS` |
| AI / LLM Keys | `GEMINI_API_KEY`, `OPENAI_API_KEY`, `CHATBOT_MODEL_NAME` |
| Object storage | `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`, `S3_FORCE_PATH_STYLE` |
| Frontend web | `VITE_GATEWAY_BFF_URL`, `VITE_REQUEST_TIMEOUT_MS`, `VITE_GOOGLE_MAPS_KEY` |
| Courier / Customer mobile | `EXPO_PUBLIC_GATEWAY_BASE_URL`, `EXPO_PUBLIC_REQUEST_TIMEOUT_MS`, `EXPO_PUBLIC_COURIER_ID` |
| COD/SePay | `COMPANY_BANK_*`, `SEPAY_WEBHOOK_SECRET`, `SEPAY_BANK_ACCOUNT_NUMBER`, `SEPAY_AMOUNT_TOLERANCE_VND` |
| Marketplace integration | `NEXUS_INTEGRATION_*`, `PUBLIC_TRACKING_PUBLIC_URL`, `OPS_PUBLIC_URL` |

## 21. Testing và build

Một số lệnh kiểm tra đang có trong repo:

| Phân hệ | Lệnh kiểm tra |
| --- | --- |
| Backend services (15 services) | `pnpm run build` trong từng thư mục service |
| `pricing-service` | `pnpm run test`, `pnpm run build` |
| `chatbot-service` | `pnpm run build`, `pnpm run start:dev` |
| `gateway-bff` chat | `pnpm run test:chat` |
| `ops-web` | `pnpm run test:smoke`, `pnpm run build` |
| `admin-web` | `pnpm run test:smoke`, `pnpm run test:e2e`, `pnpm run build` |
| `merchant-web` | `pnpm run build` |
| `guest-web` | `pnpm run build` |
| `customer-mobile` | `pnpm run typecheck`, `pnpm run build:web` |
| `courier-mobile` | `pnpm run typecheck`, `pnpm run test:maestro`, `pnpm run build:web` |

## 22. Tài liệu liên quan

Các tài liệu nên đọc tiếp khi viết báo cáo hoặc phát triển tính năng:

| File/thư mục | Nội dung |
| --- | --- |
| `README.md` | Tổng quan hệ thống, sơ đồ kiến trúc tổng thể và cổng vận hành. |
| `docs/AI-REPORT-HANDOFF.md` | Cẩm nang viết báo cáo khóa luận/kỹ thuật không sai lệch kiến trúc. |
| `docs/architecture/ai-chatbot-service-architecture.md` | Báo cáo chuyên sâu kiến trúc Hybrid RAG, 5 Dynamic Tools và Vector Store. |
| `docs/architecture/system-design-summary.md` | Tóm tắt nguyên tắc kiến trúc & quyền sở hữu dữ liệu 15 services. |
| `docs/architecture/diagrams/` | Bộ sưu tập sơ đồ Mermaid chi tiết cho 5 nhóm đối tượng người dùng. |
| `docs/business-sop/CHINH-SACH-PHAN-TANG-MERCHANT-VA-CUOC-CHUYEN-HOAN.md` | Quy chuẩn 3 tầng khách hàng (Guest, SME, VIP) & cước chuyển hoàn tự động. |
| `docs/business-sop/NGHIEP-VU-TIEP-NHAN-HANG-DE-VO-VA-BAO-HIEM.md` | Nghiệp vụ tiếp nhận hàng dễ vỡ & quy trình bồi thường 100% (Điều 25 Luật Bưu chính). |
| `docs/business-sop/order-lifecycle-report.md` | Vòng đời bưu phẩm từ lấy -> trung chuyển qua Hub 4 cấp -> phát -> hoàn. |
| `docs/knowledge-base/` | Kho tri thức bưu chính chuẩn hóa dạng Markdown & Vector Index cho AI. |
| `docs/runbook/` | Sổ tay hướng dẫn local dev, migration, danh sách tài khoản test và troubleshooting. |
| `contracts/events/` | Quy ước đặt tên và mẫu payload của các Domain Events. |
| `contracts/openapi/` | Đặc tả giao tiếp API RESTful theo chuẩn OpenAPI/Swagger. |
| `luat-sinh-ma.txt` | Quy tắc sinh mã vận đơn, mã bưu cục/hub, mã user, mã bao `MB`, tem xe `XT`. |

## 23. Ghi chú hiện trạng và giới hạn

Một số điểm cần nêu rõ khi viết tài liệu kỹ thuật:

- Gateway auth hiện thiên về perimeter check; logic session/token chi tiết thuộc `auth-service`.
- `tracking-service` và `reporting-service` là read model, không phải source of truth nghiệp vụ.
- `pricing-service` tính quote/rate chuẩn hóa toàn hệ thống (`NEXUS_RATES_2026_05`), không sở hữu DB riêng; shipment lưu snapshot giá khi tạo đơn.
- `chatbot-service` sử dụng mô hình Google Gemini 3 Flash với Fallback OpenAI GPT-4o-mini, tích hợp 5 dynamic tools kết nối trực tiếp đến các domain service và stream qua SSE.
- Local dev tạo nhiều DB trong cùng một PostgreSQL container, nhưng nguyên tắc thiết kế vẫn là database-per-service.
- Mỗi app/service có dependency và script riêng; repo chưa có root package script thống nhất.
- Khi viết tài liệu chính thức, luôn ưu tiên trạng thái và ownership theo `shipment-service`, schema Prisma, contract events và file overview này.
