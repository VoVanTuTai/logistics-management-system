# Nexus Logistics AI Knowledge Base (Kho Tri Thức RAG)

Thư mục này chứa toàn bộ kho tài liệu tri thức nghiệp vụ dùng cho hệ thống **AI Chatbot RAG (Retrieval-Augmented Generation)** của Nexus Logistics.

## 1. Cấu Trúc Tài Liệu Hiện Tại
- `01-pricing-and-iata-weight.md`: Biểu phí, nấc cơ bản 0.5kg, nấc vượt cân, phụ phí vùng miền và công thức quy đổi thể tích IATA ($V/6000$).
- `02-insurance-and-claim-policy.md`: Gói bảo hiểm tiêu chuẩn (Điều 25 Luật Bưu chính), Gói bảo hiểm 100% và quy trình bồi hoàn khiếu nại.
- `03-prohibited-and-restricted-goods.md`: Danh mục hàng cấm bay, hàng gửi có điều kiện, quy chuẩn đóng gói hàng dễ vỡ SOP.
- `04-delivery-process-and-faq.md`: Quy trình giao nhận, xử lý sự cố phát hàng (NDR 3 lần), lưu kho 5 ngày, bảo mật tài chính người nhận.

## 2. Cách Bổ Sung Tài Liệu Mới (Rất Đơn Giản)
Khi doanh nghiệp ban hành thêm quy chế hoặc chính sách mới, bạn chỉ cần:
1. Tạo một file Markdown mới (ví dụ: `05-quy-dinh-giao-hang-nong-san.md`) đặt vào thư mục này.
2. Soạn thảo văn bản có các tiêu đề phân cấp rõ ràng (`#`, `##`, `###`).
3. Chạy lệnh nạp dữ liệu:
   ```bash
   npm run rag:ingest
   ```
4. Hệ thống sẽ tự động phân tích (Chunking), tính toán vector embedding và cập nhật vào cơ sở dữ liệu Vector Store mà không cần phải can thiệp sửa code hay huấn luyện lại mô hình AI!
