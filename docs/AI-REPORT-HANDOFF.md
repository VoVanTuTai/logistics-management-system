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

Hệ thống của tôi là một nền tảng quản lý logistics/chuyển phát nhanh theo kiến trúc microservices, gồm frontend web, mobile courier app, gateway BFF, nhiều backend domain services, PostgreSQL database-per-service, RabbitMQ event-driven communication, tracking/reporting read models, COD settlement và pricing.

Trước khi viết, hãy đọc kỹ các tài liệu tôi gửi, ưu tiên theo thứ tự:
1. docs/AI-REPORT-HANDOFF.md
2. docs/PROJECT-OVERVIEW.md
3. Các tài liệu architecture/runbook/contracts/source code mà tôi gửi thêm

Nguyên tắc bắt buộc:
- Không tự bịa service, database, event, API hoặc trạng thái nếu tài liệu không nói rõ.
- Nếu có mâu thuẫn giữa tài liệu cũ và docs/PROJECT-OVERVIEW.md, ưu tiên docs/PROJECT-OVERVIEW.md.
- Khi mô tả source of truth, phải nhớ:
  - shipment-service sở hữu trạng thái nghiệp vụ/currentStatus của vận đơn.
  - scan-service sở hữu scan event/current location.
  - tracking-service và reporting-service chỉ là read model/projection từ events.
  - payment-service là source of truth cho COD settlement.
  - pricing-service tính phí/quote, không có database riêng.
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
| Bối cảnh nghiệp vụ | Logistics last-mile, merchant, ops, courier, hub, shipment, COD, tracking | `docs/PROJECT-OVERVIEW.md`, `docs/order-lifecycle-report.md` |
| Kiến trúc | Microservices, gateway BFF, event-driven, database-per-service, read model | `docs/PROJECT-OVERVIEW.md`, `docs/architecture/` |
| Service ownership | Service nào sở hữu dữ liệu nào, service nào chỉ là projection | `docs/PROJECT-OVERVIEW.md`, `docs/architecture/data-ownership.md` |
| Event flow | Event publish/consume, RabbitMQ exchange, outbox pattern | `docs/PROJECT-OVERVIEW.md`, `docs/architecture/events.md`, `contracts/events/` |
| API/client | Frontend gọi gateway, gateway route sang service | `contracts/openapi/`, `services/gateway-bff/`, app README |
| Triển khai/kiểm thử | Docker Compose, env vars, db prepare, seed, build/test | `docs/runbook/`, package scripts từng app/service |

## Những điểm không được hiểu sai

| Chủ đề | Cách hiểu đúng |
| --- | --- |
| Gateway | `gateway-bff` là entry point cho web/mobile client, proxy đến domain services; không phải owner của nghiệp vụ shipment/pickup/delivery. |
| Auth | `auth-service` quản lý user/session/token. Gateway auth hiện thiên về perimeter check tùy cấu hình. |
| Shipment status | `shipment-service` là service quyết định trạng thái nghiệp vụ chính của vận đơn. |
| Current location | `scan-service` là source of truth cho scan event và vị trí hiện tại. |
| Tracking | `tracking-service` dựng timeline/current view từ event, không quyết định trạng thái gốc. |
| Reporting | `reporting-service` aggregate KPI/read model từ event, không xử lý nghiệp vụ write-side. |
| COD | `payment-service` quản lý COD record, settlement batch, payment webhook và remittance. |
| Pricing | `pricing-service` tính quote/rate; shipment lưu snapshot pricing khi tạo đơn. |
| Database | Local dev dùng một PostgreSQL container nhưng vẫn theo nguyên tắc database-per-service. |
| Monorepo | Repo không có root `package.json`; mỗi app/service có package script riêng. |

## Dàn ý báo cáo đề xuất

### Chương 1 - Tổng quan đề tài

- Lý do chọn đề tài.
- Bài toán quản lý logistics/chuyển phát nhanh.
- Mục tiêu hệ thống.
- Phạm vi chức năng.
- Đối tượng sử dụng.
- Ý nghĩa thực tiễn và ý nghĩa kỹ thuật.

### Chương 2 - Cơ sở lý thuyết và công nghệ

- Kiến trúc microservices.
- API Gateway/BFF.
- Event-driven architecture.
- Database-per-service.
- Outbox pattern.
- Idempotency.
- Read model/CQRS mức ứng dụng.
- Tổng quan NestJS, React, Expo, Prisma, PostgreSQL, RabbitMQ, Docker Compose.

### Chương 3 - Phân tích yêu cầu hệ thống

- Yêu cầu chức năng theo nhóm người dùng: admin, ops, merchant, courier, public tracking.
- Yêu cầu phi chức năng: mở rộng, bảo trì, tin cậy, đồng bộ bất đồng bộ, kiểm soát trùng lặp, theo dõi vận đơn.
- Phân rã miền nghiệp vụ.
- Luồng nghiệp vụ chính: tạo đơn, pickup, hub/manifest, delivery, NDR/return, COD, tracking/reporting.

### Chương 4 - Thiết kế kiến trúc hệ thống

- Sơ đồ tổng quan client -> gateway -> services -> database/RabbitMQ.
- Vai trò từng frontend app.
- Vai trò từng backend service.
- Data ownership.
- Gateway routing.
- Event-driven flow.
- Outbox và idempotency.
- Lý do chọn microservices thay vì monolithic.

### Chương 5 - Thiết kế dữ liệu và service

- Database-per-service.
- Các model chính của từng service.
- Quan hệ logic giữa dữ liệu qua event, không qua join trực tiếp cross-database.
- Thiết kế shipment state machine.
- Thiết kế scan/current location.
- Thiết kế tracking timeline.
- Thiết kế reporting projection.
- Thiết kế COD settlement.

### Chương 6 - Thiết kế và hiện thực giao diện

- `admin-web`: quản trị user/master data/config.
- `ops-web`: vận hành shipment/pickup/task/manifest/scan/NDR/COD.
- `merchant-web`: tạo đơn, pickup, tracking, in vận đơn.
- `courier-mobile`: task, scan, POD/OTP, offline retry.
- `public-tracking`: tra cứu vận đơn công khai.
- Cách frontend gọi gateway và xử lý loading/empty/error/success states.

### Chương 7 - Triển khai và kiểm thử

- Môi trường local dev.
- Docker Compose infrastructure.
- Cách prepare database và seed.
- Build/typecheck/smoke/e2e/mobile testing.
- Các test hoặc kiểm tra đã có trong repo.
- Các giới hạn hiện tại khi kiểm thử.

### Chương 8 - Đánh giá và hướng phát triển

- Kết quả đạt được.
- Ưu điểm kiến trúc.
- Hạn chế hiện tại.
- Hướng phát triển: production auth/permission, observability, versioned migrations, stronger owner checks, monitoring, CI/CD, scale workers, improve event retry/DLQ dashboard.

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

