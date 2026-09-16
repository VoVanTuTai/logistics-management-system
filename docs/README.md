# 📚 Nexus Logistics Documentation Hub

Chào mừng bạn đến với trung tâm tài liệu kỹ thuật và nghiệp vụ của dự án **Nexus Logistics Management System**.

Thư mục `docs/` được quy hoạch thành các phân nhóm module rõ ràng, giúp nhóm phát triển, Thầy hướng dẫn và Hội đồng thẩm định dễ dàng định vị, tra cứu và nghiên cứu theo từng chuyên đề.

---

## 🗺️ Bản Đồ Phân Loại Tài Liệu (Documentation Directory Map)

```
docs/
├── README.md                           # 📖 File này: Mục lục tổng quan toàn bộ tài liệu
├── PROJECT-OVERVIEW.md                 # 🏗️ [GỐC] Bức tranh tổng thể 13 microservices (Source of Truth)
├── AI-REPORT-HANDOFF.md                # ✍️ [GỐC] Cẩm nang viết báo cáo khóa luận không sai lệch kiến trúc
├── demo-script.md                      # 🎬 Kịch bản thực hành demo hệ thống khi bảo vệ
│
├── architecture/                       # 🏛️ Thiết kế kiến trúc, microservices & sơ đồ tuần tự
│   ├── ai-chatbot-service-architecture.md # Báo cáo học thuật & kiến trúc AI Chatbot RAG
│   ├── system-design-summary.md        # Tóm tắt nguyên tắc kiến trúc & quyền sở hữu dữ liệu
│   └── diagrams/                       # Bộ sưu tập sơ đồ Mermaid cho 5 nhóm người dùng
│
├── business-sop/                       # 📦 Quy chuẩn nghiệp vụ bưu chính & quy trình vận hành (SOP)
│   ├── CHINH-SACH-PHAN-TANG-MERCHANT-VA-CUOC-CHUYEN-HOAN.md # Quy chuẩn 3 tầng khách hàng & cước hoàn tự động
│   ├── fragile-and-insurance-sop.md    # Nghiệp vụ tiếp nhận hàng dễ vỡ & bảo hiểm khai giá
│   ├── order-intake-fragile-and-insurance-specification.md # Đặc tả kỹ thuật tạo đơn bưu cục
│   ├── order-lifecycle-report.md       # Vòng đời bưu phẩm từ lấy -> trung chuyển -> phát -> hoàn
│   ├── payment-cod-settlement-implementation-plan.md # Quy chuẩn đối soát & giải ngân COD
│   └── business-completion-high-priority-plan.md # Kế hoạch hoàn thiện tính năng bưu chính
│
├── knowledge-base/                     # 🧠 Kho tri thức chuẩn hóa dành cho AI Assistant (RAG Engine)
│   ├── 01-pricing-and-iata-weight.md   # Biểu phí, nấc vượt cân, công thức thể tích IATA V/6000
│   ├── 02-insurance-and-claim-policy.md# Bảo hiểm khai giá & bồi hoàn Điều 25 Luật Bưu chính
│   ├── 03-prohibited-and-restricted-goods.md # Danh mục hàng cấm bay, pin lithium, SOP đóng gói
│   ├── 04-delivery-process-and-faq.md  # Quy trình giao lại 3 lần, lưu kho 5 ngày, bảo mật COD
│   ├── vector-index.json               # Cơ sở dữ liệu Vector lưu trữ embeddings
│   └── README.md                       # Hướng dẫn nạp tri thức mới bằng lệnh tự động
│
├── runbook/                            # ⚡ Sổ tay vận hành, DevOps & triển khai môi trường
│   ├── local-dev.md                    # Hướng dẫn khởi chạy môi trường phát triển cục bộ
│   ├── trial-deploy.md                 # Hướng dẫn triển khai môi trường staging/trial
│   ├── github-deploy-rules.md          # Quy chuẩn CI/CD và quy tắc merge branch GitHub
│   ├── migrations.md                   # Hướng dẫn migrate và seed database Prisma
│   ├── test-accounts.md                # Danh sách tài khoản kiểm thử cho từng vai trò
│   ├── id-code-rules.md                # Quy ước đặt mã bưu cục, vận đơn, túi hàng, chuyến xe
│   ├── sepay-cod-runbook.md            # Hướng dẫn tích hợp cổng thanh toán SePay/VietQR
│   └── troubleshooting.md              # Khắc phục các sự cố thường gặp
│
├── service-description/                # 🔌 Đặc tả dịch vụ & Tích hợp đối tác bên ngoài
│   ├── auth-service.md                 # Cơ chế xác thực opaque token & quản lý phiên
│   ├── marketplace-order-integration-api.md # Chuẩn API tiếp nhận đơn từ sàn TMĐT
│   └── partner-qa/                     # Biên bản hỏi đáp & onboarding đối tác DT-Commerce
│
├── reports/                            # 📊 Báo cáo đánh giá, kiểm thử & mức độ sẵn sàng
│   ├── admin-module-report.md          # Báo cáo kiểm thử phân hệ quản trị (Admin)
│   ├── ops-web-production-readiness-report.md # Báo cáo đánh giá mức độ sẵn sàng phân hệ Vận hành
│   └── test-cases/                     # Bộ tài liệu Word ghi nhận các ca kiểm thử (85-100 testcases)
│
├── research/                           # 🔬 Tài liệu nghiên cứu học thuật & lý thuyết RAG
│   └── AIO2026-RAG-System-Reading.pdf  # Giáo trình chuyên sâu về RAG từ AI VIET NAM (AIO2026)
│
├── prompts/                            # 💬 Bộ tài liệu Prompt packs phát triển Frontend & Backend
│   └── (Tập hợp các file Bo_Prompt_*.docx phục vụ phát triển giao diện và logic)
│
└── images/                             # 🎨 Sơ đồ đồ họa .drawio, ảnh PNG kiến trúc & SVG logos
```

---

## 🎯 Hướng Dẫn Tra Cứu Theo Mục Đích (Quick Finder)

| Bạn đang tìm kiếm điều gì? | Hãy xem tài liệu này |
| :--- | :--- |
| **Báo cáo khóa luận về phân hệ AI Chatbot RAG** | [`docs/architecture/ai-chatbot-service-architecture.md`](architecture/ai-chatbot-service-architecture.md) |
| **Bản vẽ tổng thể 13 microservices & luồng dữ liệu** | [`docs/PROJECT-OVERVIEW.md`](PROJECT-OVERVIEW.md) |
| **Phân tầng khách hàng (3-Tier) & Cước hoàn tự động** | [`docs/business-sop/CHINH-SACH-PHAN-TANG-MERCHANT-VA-CUOC-CHUYEN-HOAN.md`](business-sop/CHINH-SACH-PHAN-TANG-MERCHANT-VA-CUOC-CHUYEN-HOAN.md) |
| **Biểu phí bưu chính, bảo hiểm hàng vỡ & công thức IATA** | [`docs/knowledge-base/`](knowledge-base/) |
| **Quy trình tiếp nhận hàng dễ vỡ và bồi thường bưu chính** | [`docs/business-sop/NGHIEP-VU-TIEP-NHAN-HANG-DE-VO-VA-BAO-HIEM.md`](business-sop/NGHIEP-VU-TIEP-NHAN-HANG-DE-VO-VA-BAO-HIEM.md) |
| **Sơ đồ Mermaid quy trình luồng của từng ứng dụng** | [`docs/architecture/diagrams/`](architecture/diagrams/) |
| **Hướng dẫn chạy hệ thống ở máy cá nhân (Local Dev)** | [`docs/runbook/local-dev.md`](runbook/local-dev.md) |
| **Tài khoản mật khẩu đăng nhập các vai trò (Ops, Merchant, Admin)** | [`docs/runbook/test-accounts.md`](runbook/test-accounts.md) |
| **Lý thuyết học thuật về RAG (Hybrid Search, RRF, Cross-Encoder)** | [`docs/research/AIO2026-RAG-System-Reading.pdf`](research/AIO2026-RAG-System-Reading.pdf) |
