# AI Report Handoff - Nexus Express System

## Mục đích

File này dùng để đưa cho một AI khác khi cần hỗ trợ viết báo cáo, thuyết minh thiết kế, mô tả kiến trúc hoặc giải thích nghiệp vụ của **Nexus Express System**.

Mục tiêu là giúp AI hiểu hệ thống theo đúng bối cảnh, không nhầm source of truth, không tự suy diễn sai service, trạng thái, event hoặc phạm vi chức năng.

## Cách dùng nhanh

Khi làm việc với AI khác, hãy gửi theo thứ tự:

1. File này: `docs/AI-REPORT-HANDOFF.md`
2. Tổng quan chuẩn: `docs/PROJECT-OVERVIEW.md`
3. Nếu cần viết sâu kiến trúc: thêm `docs/architecture/`
4. Nếu cần viết sâu luồng vận đơn: thêm `docs/order-lifecycle-report.md`
5. Nếu cần viết API/event: thêm `contracts/events/` và `contracts/openapi/`
6. Nếu cần viết hướng dẫn chạy hệ thống: thêm `docs/runbook/local-dev.md`, `docs/runbook/migrations.md`, `docs/runbook/test-accounts.md`

Không cần gửi toàn bộ source code ngay từ đầu. Chỉ gửi source theo từng chương hoặc từng service khi AI cần đối chiếu chi tiết.

## Master prompt để copy cho AI khác

```text
Bạn là trợ lý kỹ thuật hỗ trợ tôi viết báo cáo cho hệ thống Nexus Express System.

Hệ thống của tôi là một nền tảng quản lý logistics/chuyển phát nhanh theo kiến trúc 15 microservices, gồm 6 ứng dụng client (4 Web React/Vite + 2 Mobile Expo/React Native), gateway BFF, 15 backend domain services, PostgreSQL database-per-service, RabbitMQ event-driven communication, tracking/reporting read models, động cơ định giá đa nền tảng IATA V/6000, trợ lý AI Logistics RAG với Google Gemini & OpenAI, COD settlement và quản lý chuyến xe trung chuyển Linehaul.

Trước khi viết, hãy đọc kỹ các tài liệu tôi gửi, ưu tiên theo thứ tự:
1. README.md (Báo cáo tổng quan dự án & sơ đồ kiến trúc chuẩn)
2. docs/PROJECT-OVERVIEW.md (Bức tranh kỹ thuật chi tiết 15 microservices)
3. docs/architecture/ai-chatbot-service-architecture.md
4. Các tài liệu business-sop/runbook/contracts/source code mà tôi gửi thêm

Nguyên tắc bắt buộc:
- Không tự bịa service, database, event, API hoặc trạng thái nếu tài liệu không nói rõ.
- Nếu có mâu thuẫn giữa tài liệu cũ và docs/PROJECT-OVERVIEW.md, ưu tiên docs/PROJECT-OVERVIEW.md.
- Khi mô tả source of truth, phải nhớ:
  - shipment-service sở hữu trạng thái nghiệp vụ/currentStatus của vận đơn.
  - scan-service sở hữu scan event/current location.
  - tracking-service và reporting-service chỉ là read model/projection từ events.
  - payment-service là source of truth cho COD settlement.
  - pricing-service tính phí/quote chuẩn hóa toàn hệ thống (bản NEXUS_RATES_2026_05), không có database riêng.
  - chatbot-service là microservice AI chuyên biệt (Port 3013), tích hợp Hybrid RAG + 5 Dynamic Tools + SSE streaming.
  - linehaul-service quản lý chuyến xe tải trung chuyển liên tỉnh giữa các Hub (Port 3014).
- 4 trụ cột nghiệp vụ cốt lõi:
  1. Động cơ định giá chuẩn hóa IATA V/6000, 3 vùng cước (Nội tỉnh / Trục chính / Liên tỉnh), tự động bóc tách tiền tố hành chính.
  2. Phân tầng khách hàng 3 cấp (Guest, Standard SME, VIP Enterprise) và chính sách cước hoàn tự động (Return Fee SOP).
  3. Tiếp nhận hàng dễ vỡ & quy trình bảo hiểm bồi thường 100% (Điều 25 Luật Bưu chính).
  4. Mạng lưới Hub 4 cấp (Mega Hub -> Regional Hub -> Provincial Hub -> Local Station) và điều phối Linehaul.
- Viết bằng tiếng Việt học thuật, dễ hiểu, phù hợp báo cáo tốt nghiệp/kỹ thuật.
- Khi viết từng chương, hãy nêu rõ phạm vi, mục tiêu, thành phần, luồng xử lý, dữ liệu vào/ra, ưu điểm thiết kế và giới hạn nếu có.
- Nếu thiếu thông tin, hãy hỏi lại hoặc ghi rõ "cần đối chiếu thêm source/tài liệu", không suy đoán chắc chắn.

Nhiệm vụ của bạn:
Hỗ trợ tôi viết báo cáo hoàn chỉnh cho Nexus Express System, bao gồm tổng quan đề tài, phân tích yêu cầu, kiến trúc hệ thống, thiết kế dữ liệu, thiết kế service, luồng nghiệp vụ, event-driven architecture, triển khai, kiểm thử, đánh giá và hướng phát triển.
```

## Bản đồ hiểu hệ thống

AI cần hiểu hệ thống theo 6 lớp, từ tổng quan đến chi tiết:

| Lớp | Cần hiểu | Tài liệu/source nên đọc |
| --- | --- | --- |
| Bối cảnh nghiệp vụ | Logistics last-mile, hub-and-spoke, 3-tier customer, return SOP, fragile goods Điều 25 | `docs/PROJECT-OVERVIEW.md`, `docs/business-sop/` |
| Kiến trúc | 15 Microservices, gateway BFF, event-driven, database-per-service, read model | `docs/PROJECT-OVERVIEW.md`, `docs/architecture/` |
| AI & Trợ lý thông minh | Hybrid RAG, 768-dim Vector Embeddings, 5 Dynamic Tools, Fallback LLM | `docs/architecture/ai-chatbot-service-architecture.md`, `docs/knowledge-base/` |
| Service ownership | Service nào sở hữu dữ liệu nào, service nào chỉ là projection | `docs/PROJECT-OVERVIEW.md`, `docs/architecture/system-design-summary.md` |
| Event flow | Event publish/consume, RabbitMQ exchange, outbox pattern | `docs/PROJECT-OVERVIEW.md`, `contracts/events/` |
| API/client | 6 client apps gọi gateway, gateway route sang 15 services | `contracts/openapi/`, `services/gateway-bff/` |
| Triển khai/kiểm thử | Docker Compose, env vars, db prepare, seed, build/test | `docs/runbook/`, package scripts từng app/service |

## Những điểm không được hiểu sai

| Chủ đề | Cách hiểu đúng |
| --- | --- |
| Gateway | `gateway-bff` là entry point duy nhất cho 6 client apps, proxy đến 15 domain services; không phải owner của nghiệp vụ shipment/pickup/delivery. |
| Auth | `auth-service` quản lý user/session/token. Gateway auth hiện thiên về perimeter check tùy cấu hình. |
| Shipment status | `shipment-service` là service quyết định trạng thái nghiệp vụ chính của vận đơn. |
| Current location | `scan-service` là source of truth cho scan event và vị trí hiện tại. |
| Tracking | `tracking-service` dựng timeline/current view từ event, không quyết định trạng thái gốc. |
| Reporting | `reporting-service` aggregate KPI/read model từ event, không xử lý nghiệp vụ write-side. |
| COD | `payment-service` quản lý COD record, settlement batch, payment webhook SePay và remittance. |
| Pricing | `pricing-service` tính quote/rate chuẩn hóa toàn hệ thống theo công thức IATA $V/6000$ và 3 vùng; shipment lưu snapshot pricing khi tạo đơn. |
| AI Chatbot | `chatbot-service` (:3013) là microservice độc lập, chạy RAG + 5 tools động; không trực tiếp sửa DB mà gọi qua Gateway/services. |
| Linehaul | `linehaul-service` (:3014) quản lý chuyến xe tải trung chuyển liên tỉnh hub-to-hub và cấp tem niêm phong xe `XT`. |
| Database | Local dev dùng một PostgreSQL container nhưng vẫn theo nguyên tắc database-per-service tuyệt đối. |
| Monorepo | Repo không có root `package.json`; mỗi app/service có package script riêng. |

## Dàn ý báo cáo đề xuất

### Chương 1 - Tổng quan đề tài

- Lý do chọn đề tài.
- Bài toán quản lý logistics/chuyển phát nhanh bưu chính đa kênh.
- Mục tiêu hệ thống.
- Phạm vi chức năng: 15 microservices và 6 client applications.
- Đối tượng sử dụng: Admin, Ops, Merchant, Courier, Khách hàng cá nhân C-End.
- Ý nghĩa thực tiễn và ý nghĩa kỹ thuật.

### Chương 2 - Cơ sở lý thuyết và công nghệ

- Kiến trúc microservices và API Gateway/BFF.
- Event-driven architecture và Message Broker (RabbitMQ topic exchange).
- Database-per-service, Transactional Outbox Pattern, Idempotency.
- Read model/CQRS-lite phân tách đọc/ghi.
- Kiến trúc Hybrid RAG (Retrieval-Augmented Generation), Vector Embeddings và Dynamic Function Calling.
- Tổng quan NestJS 10, React 18, Expo 54 / React Native 0.81, Prisma, PostgreSQL 16, Docker Compose.

### Chương 3 - Phân tích yêu cầu hệ thống

- Yêu cầu chức năng theo 5 nhóm người dùng trên 6 client applications.
- 4 quy chuẩn nghiệp vụ bưu chính cốt lõi:
  1. Định giá chuẩn hóa đa nền tảng theo quy tắc hàng không IATA $V/6000$.
  2. Phân tầng khách hàng 3 cấp và cước hoàn tự động (Reverse Logistics).
  3. Tiếp nhận hàng dễ vỡ & quy trình bảo hiểm bồi thường 100% (Điều 25 Luật Bưu chính).
  4. Mạng lưới Hub 4 cấp và điều phối xe tải Linehaul.
- Yêu cầu phi chức năng: độ trễ thấp, streaming phản hồi từ AI, kiểm soát trùng lặp quét mã (Idempotency), hỗ trợ ngoại tuyến (Offline queue trên mobile).

### Chương 4 - Thiết kế kiến trúc hệ thống

- Sơ đồ tổng thể 6 client apps -> Gateway BFF -> 15 domain services -> PostgreSQL / RabbitMQ.
- Phân định ranh giới thẩm quyền dữ liệu (Data Ownership).
- Kiến trúc phân hệ AI Chatbot RAG (`@NEXUS/chatbot-service` :3013).
- Cơ chế Outbox Relay và định tuyến sự kiện qua RabbitMQ topic exchange `domain.events`.
- So sánh ưu điểm vượt trội của kiến trúc Microservices so với Monolithic.

### Chương 5 - Thiết kế dữ liệu và các microservices

- Database-per-service: Cấu trúc 11 database PostgreSQL độc lập và schema Prisma tương ứng.
- Thiết kế máy trạng thái vận đơn (`shipment-service`).
- Thiết kế lịch sử quét mã và định vị vật lý (`scan-service`).
- Thiết kế dòng tiền COD và gom phiên đối soát tự động (`payment-service`).
- Thiết kế lược đồ đọc tốc độ cao (`tracking-service` & `reporting-service`).
- Thiết kế cơ sở dữ liệu Vector Index tri thức logistics cho AI Assistant.

### Chương 6 - Thiết kế và hiện thực giao diện (6 Client Apps)

- `admin-web`: Quản trị tài khoản, phân quyền RBAC, danh mục Hub 4 cấp, bảng vùng cước.
- `ops-web`: Vận hành trung tâm khai thác, duyệt pickup, gán việc shipper, manifest, scan, NDR, đối soát COD.
- `merchant-web`: Tạo đơn hàng loạt, in phiếu bưu chính A6/A7, quản lý lịch sử đơn và nhận tiền COD.
- `courier-mobile`: Nhiệm vụ lấy/giao, quét mã barcode, chụp ảnh POD, nhập OTP, lưu trữ offline queue.
- `customer-mobile`: Ứng dụng di động cho khách gửi lẻ, ước tính cước, theo dõi đơn, trò chuyện nổi với AI.
- `guest-web`: Cổng tra cứu công khai, ước tính cước IATA, tạo đơn khách vãng lai, trò chuyện cùng trợ lý AI.

### Chương 7 - Triển khai và kiểm thử

- Môi trường phát triển cục bộ với Docker Compose.
- Chiến lược migration và seed dữ liệu chuẩn cho từng service.
- Kiểm thử tích hợp, kiểm thử khói (Smoke Test), kiểm thử E2E và kiểm thử di động (Maestro).
- Đánh giá hiệu năng gọi đồng thời và cơ chế chống trùng quét mã.

### Chương 8 - Đánh giá và hướng phát triển

- Tổng kết kết quả đạt được: vận hành trơn tru 15 microservices và 6 client apps.
- Ưu điểm kiến trúc: phân tách bounded context rõ ràng, độ tin cậy cao, AI hỗ trợ tức thì, định giá đồng nhất 100%.
- Hạn chế hiện tại và hướng phát triển: mở rộng microservice tối ưu tuyến đường giao hàng thông minh (Route Optimization), tích hợp IoT cảm biến nhiệt độ/va đập trong thùng xe Linehaul, mở rộng đa cổng thanh toán quốc tế, nâng cấp observability (OpenTelemetry & Grafana).

## Checklist khi AI viết từng phần báo cáo

Trước khi viết một mục, AI nên tự kiểm tra:

- Mục này thuộc chương nào và phục vụ câu hỏi nào của báo cáo?
- Có đang mô tả đúng service owner không?
- Có phân biệt write model và read model không?
- Có nhầm tracking/reporting thành source of truth không?
- Có nêu được input, process, output của luồng không?
- Có dùng thuật ngữ thống nhất: shipment, pickup, dispatch, manifest, scan, delivery, NDR, return, COD, tracking, reporting không?
- Có cần trích thêm source hoặc contract không?
- Có phần nào đang suy đoán mà chưa có tài liệu xác nhận không?

## Prompt mẫu để viết từng chương

### Viết chương tổng quan

```text
Dựa trên docs/PROJECT-OVERVIEW.md và docs/AI-REPORT-HANDOFF.md, hãy viết Chương 1 - Tổng quan đề tài cho báo cáo tốt nghiệp.

Yêu cầu:
- Viết bằng tiếng Việt học thuật, rõ ràng.
- Có các mục: lý do chọn đề tài, bài toán, mục tiêu, phạm vi, đối tượng sử dụng, ý nghĩa đề tài.
- Không đi quá sâu vào code.
- Không bịa chức năng ngoài phạm vi tài liệu.
```

### Viết chương kiến trúc

```text
Dựa trên docs/PROJECT-OVERVIEW.md, docs/architecture/ và contracts/events/, hãy viết chương Thiết kế kiến trúc hệ thống.

Yêu cầu:
- Giải thích microservices, gateway BFF, database-per-service, RabbitMQ event-driven architecture, outbox pattern, read model.
- Nêu rõ vai trò từng service.
- Nêu rõ data ownership.
- Có đoạn giải thích vì sao shipment-service, scan-service, tracking-service, reporting-service phải tách vai trò.
- Văn phong báo cáo kỹ thuật, dễ hiểu cho giảng viên.
```

### Viết chương luồng nghiệp vụ

```text
Dựa trên docs/PROJECT-OVERVIEW.md và docs/order-lifecycle-report.md, hãy viết phần Luồng nghiệp vụ vận đơn.

Yêu cầu:
- Mô tả tuần tự từ tạo đơn, pickup, hub/manifest, scan inbound/outbound, delivery, NDR/return, COD, tracking/reporting.
- Với mỗi bước, nêu actor, frontend, gateway/service xử lý, event phát sinh nếu có, trạng thái vận đơn liên quan.
- Không tự thêm trạng thái ngoài tài liệu.
```

### Viết chương thiết kế dữ liệu

```text
Dựa trên docs/PROJECT-OVERVIEW.md và Prisma schema/source tôi gửi thêm, hãy viết phần Thiết kế dữ liệu.

Yêu cầu:
- Trình bày theo database-per-service.
- Mỗi service nêu các model chính và trách nhiệm dữ liệu.
- Nhấn mạnh không join trực tiếp database giữa service; đồng bộ qua event/read model.
- Nếu model nào chưa rõ field chi tiết, ghi theo mức khái niệm thay vì bịa thuộc tính.
```

## Prompt mẫu để yêu cầu AI đối chiếu source

```text
Tôi sẽ gửi source code của một service. Hãy đọc và trả lời:
1. Service này chịu trách nhiệm gì?
2. Các controller/API chính là gì?
3. Các model/entity chính là gì?
4. Service publish/consume event nào?
5. Có áp dụng outbox/idempotency/state machine/audit không?
6. Nội dung này nên đưa vào phần nào của báo cáo?

Không viết lan man. Nếu source không đủ để kết luận, hãy nói rõ cần file nào tiếp theo.
```

## Bộ tài liệu nên giữ làm source of truth

| Mục đích | File/thư mục |
| --- | --- |
| Tổng quan chuẩn | `docs/PROJECT-OVERVIEW.md` |
| Handoff cho AI viết báo cáo | `docs/AI-REPORT-HANDOFF.md` |
| Luồng vận đơn | `docs/order-lifecycle-report.md` |
| Kiến trúc | `docs/architecture/overview.md`, `docs/architecture/services.md` |
| Data ownership | `docs/architecture/data-ownership.md` |
| Event architecture | `docs/architecture/events.md`, `contracts/events/` |
| Status machine | `docs/architecture/status-machine.md` |
| Failure/retry | `docs/architecture/failure-handling.md` |
| API contracts | `contracts/openapi/` |
| Local dev | `docs/runbook/local-dev.md` |
| Test accounts | `docs/runbook/test-accounts.md` |
| Quy tắc mã | `docs/runbook/id-code-rules.md`, `luat-sinh-ma.txt` |

## Cách chia nhỏ khi gửi cho AI có giới hạn context

Nếu AI không nhận được nhiều file cùng lúc, chia theo batch:

1. Batch nền: `AI-REPORT-HANDOFF.md` + `PROJECT-OVERVIEW.md`
2. Batch kiến trúc: `docs/architecture/overview.md`, `services.md`, `data-ownership.md`
3. Batch event: `docs/architecture/events.md`, `contracts/events/event-types.md`, payload JSON liên quan
4. Batch nghiệp vụ: `docs/order-lifecycle-report.md`, các Mermaid docs nếu cần vẽ sequence/use case
5. Batch service cụ thể: chỉ gửi source của service đang viết
6. Batch giao diện: gửi README/source của app tương ứng

Mỗi batch nên yêu cầu AI tóm tắt lại điều đã hiểu trước khi viết nội dung chính. Điều này giúp phát hiện hiểu sai sớm.

