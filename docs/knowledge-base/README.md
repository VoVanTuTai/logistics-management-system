# Nexus Logistics AI Knowledge Base (Kho Tri Thức RAG)

Thư mục này chứa toàn bộ kho tài liệu tri thức nghiệp vụ chuẩn hóa dùng cho hệ thống **AI Assistant RAG (Retrieval-Augmented Generation)** của Nexus Logistics:

## 1. Cấu Trúc Toàn Bộ 09 Bộ Tài Liệu Quy Chuẩn
- `01-pricing-and-iata-weight.md`: Biểu phí vận chuyển thời gian thực, nấc cơ sở 0.5kg, nấc vượt cân, phụ phí vùng miền và công thức quy đổi thể tích IATA ($Dài \times Rộng \times Cao / 6000$).
- `02-insurance-and-claim-policy.md`: Chính sách bảo hiểm khai giá phân tầng (0.5% - 1.0%), trần đền bù tối đa 30 triệu/đơn, tỷ lệ bồi thường hư hại một phần và thời hạn chi trả 3-5 ngày.
- `03-prohibited-and-restricted-goods.md`: Danh mục hàng cấm bay hàng không, hàng gửi có điều kiện, quy chuẩn xử lý vi phạm pháp luật.
- `04-delivery-process-and-faq.md`: Quy trình giao nhận, xử lý giao không thành công (NDR 3 lần), cước hoàn 50% chiều đi, bảo mật tài chính người nhận.
- `05-cod-policy-and-finance.md`: Chính sách quản lý tiền thu hộ COD, trần nợ tiền mặt bưu tá 15 triệu, khóa app bưu tá qua ngày, đối soát Thứ 2-4-6, trần nợ ví shop -500k.
- `06-packaging-and-fragile-goods.md`: Quy chuẩn đóng gói hàng dễ vỡ (bọc xốp 3-5 lớp, cách thành 5cm, vách ngăn), phân biệt rành mạch với hàng giá trị cao (tem an ninh OPEN VOID, bao đỏ, kiểm đếm camera, giao bằng OTP).
- `07-special-delivery-services.md`: Chính sách đồng kiểm 3 cấp độ (`KHONG_CHO_XEM`, `CHO_XEM_KHONG_THU`, `CHO_THU_HANG`), dịch vụ giao hàng một phần, đổi trả 1-đổi-1 tận nhà.
- `08-transit-time-and-network-sla.md`: Thời gian toàn trình cam kết SLA 3 miền, lịch trình xe tải trục Linehaul chạy cố định 11:00 và 21:00, đền bù trễ SLA 50% - 100% cước.
- `09-negative-exceptions-and-incident-handling.md`: Quy chuẩn xử lý toàn diện 06 kịch bản ngoại lệ / negative cases (NDR khách không nghe máy, khách từ chối nhận/bom hàng, hàng vỡ khi đồng kiểm, thất lạc 7 ngày, gian lận cân nặng DWS, hàng cấm).

## 2. Cách Bổ Sung & Đồng Bộ Tri Thức Mới
Khi doanh nghiệp ban hành thêm quy chế mới, bạn chỉ cần:
1. Tạo file Markdown mới trong thư mục này với phân cấp tiêu đề (`#`, `##`, `###`).
2. Kích hoạt Re-index tự động qua REST API:
   ```bash
   curl -X POST http://localhost:3013/api/v1/chat/ingest
   ```
3. Hệ thống Semantic Chunker sẽ tự động bóc tách thành các chunks tối ưu 250 words kèm Contextual Breadcrumbs và tính toán embedding cập nhật vào `vector-index.json` trong vài mili-giây!
