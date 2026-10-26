# QUY TRÌNH NGHIỆP VỤ BƯU CHÍNH & VẬN HÀNH (CARRIER SOP)
## GIÁM ĐỊNH ĐƠN LẠC, THẤT THOÁT HÀNG HÓA & PHÂN TÍCH CHUỖI VẾT QUÉT (CHAIN OF CUSTODY)

---

- **Mã tài liệu**: `SOP-OPS-QA-004`
- **Phiên bản**: `v2.0` (Đồng bộ chuẩn thiết kế bảng vận đơn 38px & lưu trữ MinIO S3)
- **Phạm vi áp dụng**: Trung tâm Kiểm soát Chất lượng Dịch vụ (Service Quality / QA Lead), Ban Giám sát Vận hành (Master Ops Command Center), Ban Điều hành Xe Tuyến (Linehaul Fleet), và Giám đốc/Thủ kho các Hub Trung chuyển & Bưu cục trên toàn mạng lưới Nexus Logistics.
- **Màn hình triển khai**: `/app/function-groups/service-quality/stray-investigation`
- **Ngày hiệu lực**: Tháng 10/2026

---

## 1. MỤC ĐÍCH & NGUYÊN TẮC CỐT LÕI

### 1.1 Mục đích
Xây dựng hành lang pháp lý và quy chuẩn công nghệ giám định chuỗi vết quét thao tác (Chain of Custody Audit Trail) khép kín, truy vết chính xác vị trí và thời điểm phát sinh đứt gãy hành trình đơn hàng, bảo vệ quyền lợi của bưu tá/lái xe thông qua cửa sổ giải trình 24 giờ, triệt tiêu tối đa chi phí bồi thường bằng quy trình rà soát kho cứu đơn, và tự động liên kết chế tài bồi thường minh bạch khi phát sinh vi phạm.

### 1.2 Bốn nguyên tắc vận hành tối thượng
1. **Dữ liệu log là bằng chứng pháp lý duy nhất**: Không kết luận dựa trên suy đoán cảm tính; mọi phán quyết trách nhiệm phải căn cứ trên đối chiếu log quét barcode, cân nặng thực tế qua từng trạm, và video camera CCTV bàn dỡ.
2. **Quyền phản biện 24 giờ (Hearing Window)**: Không quy chụp trách nhiệm bồi thường ngay lập tức khi phát hiện đơn mất tín hiệu. Bắt buộc kích hoạt cửa sổ giải trình 24h cho đơn vị tình nghi trích xuất dữ liệu camera CCTV.
3. **Cứu đơn là ưu tiên số 1 (Salvage over Settle)**: Tìm thấy hàng trong kho, đưa hàng về luồng phát bình thường luôn tốt hơn phán quyết bồi thường tài chính.
4. **Dữ liệu đa phương tiện lưu trữ tập trung trên MinIO**: Video camera trích xuất, ảnh chụp hiện trường xe tải, biên bản giao nhận phải lưu trữ tập trung tại cụm MinIO Object Storage (`nexus-pod-images`) theo đúng định danh hồ sơ.

---

## 2. PHÂN LOẠI 4 NHÓM ĐIỂM ĐỨT GÃY HÀNH TRÌNH (BREAK POINT TAXONOMY)

| Mã Điểm Đứt Gãy | Tên Nghiệp Vụ | Dấu Hiệu Nhận Diện (Trigger Condition) | Đơn Vị Tình Nghi Mặc Định |
| :--- | :--- | :--- | :--- |
| `WAREHOUSE_STALE_LOSS` | **Tồn kho mất tích tại Hub** | Đơn hàng đã có vết quét `SCAN_INBOUND` nhận kiện tại Hub/Bưu cục nhưng lưu kho $>48\text{h}$ không phát sinh `SCAN_OUTBOUND` hoặc không được đóng vào bao tải chuyển tiếp. | Hub Trung chuyển nhận kiện hoặc Bưu cục phát |
| `LINEHAUL_IN_TRANSIT_LOSS` | **Thất lạc trên xe tuyến đường trục** | Đơn hàng đã đóng trong bao tải xuất bến. Khi xe đến Hub đích, kiểm tra phát hiện: bao tải bị rách/rạch góc, cân nặng bao hụt so với lúc xuất, hoặc dây chì kẹp seal sau thùng xe có dấu vết cắt nối. | Đội xe tuyến liên tỉnh (`LINEHAUL_FLEET`) / Lái xe phụ trách |
| `MISROUTED_SORTING` | **Phân loại nhầm luồng / Sai tuyến đích** | Đơn hàng bị nhân viên chia chọn bắn nhầm vào bao tải của tuyến khác, hoặc chuyển đi bưu cục không thuộc tuyến phát của người nhận. | Tổ chia chọn / Băng chuyền phân loại của Hub xuất |
| `LAST_MILE_UNACCOUNTED` | **Mất tích sau khi xuất giao cho Shipper** | Đơn hàng đã `DISPATCH` bàn giao cho bưu tá giao hàng nhưng đến cuối ca không có kết quả giao thành công, không có lý do hoàn kho (NDR) và không bàn giao lại hàng vật lý cho thủ kho. | Bưu tá phát hàng (`LAST_MILE_COURIER`) |

---

## 3. QUY TRÌNH 4 GIAI ĐOẠN GIÁM ĐỊNH KHÉP KÍN

```
[ Giai đoạn 1: AI Engine bắt điểm đứt gãy ]
                    │
                    ▼
[ Giai đoạn 2: Mở Cửa sổ Giải trình 24h (IN_HEARING) ]
   ├── Nộp video CCTV / Biên bản lên MinIO
   └── (Hỗ trợ gia hạn +12h khi cần trích xuất liên Hub)
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
[ Giai đoạn 3: TÌM THẤY HÀNG ]   [ Giai đoạn 4: HẾT HẠN GIẢI TRÌNH ]
 - Xác nhận hoàn kho & cứu đơn     - QA Lead ký phán quyết chế tài
 - Đóng hồ sơ: RESOLVED_FOUND      - Chuyển bồi thường: ESCALATED_TO_CLAIM
 - Tiết kiệm 100% tiền bồi hoàn    - Tự động tạo Compensation Claim
```

### 3.1 Giai đoạn 1: Phát hiện tự động & Đánh giá sơ bộ
- **Hệ thống Audit Engine**: Tự động rà soát cơ sở dữ liệu vận đơn mỗi giờ, quét các kiện mất tín hiệu quá thời gian cam kết luân chuyển (SLA).
- **Tính toán Báo cáo sơ bộ**:
  - Xác định loại điểm đứt gãy (`breakPointType`).
  - Gợi ý Đơn vị tình nghi số 1 (`suspectPartyName` / `suspectPartyCode`).
  - Đánh giá Độ tin cậy thuật toán (`confidenceScorePercent` từ 70% đến 99%).
  - Đề xuất số tiền chế tài dự kiến (`suggestedCompensationAmount`).

### 3.2 Giai đoạn 2: Cửa sổ Giải trình & Phản biện 24 Giờ (`IN_HEARING`)
1. Hồ sơ chuyển sang trạng thái `IN_HEARING` và hiển thị đồng hồ đếm ngược 24h.
2. Thông báo tự động gửi về ứng dụng vận hành của Hub/Lái xe bị tình nghi.
3. **Quyền nộp bằng chứng phản biện**:
   - Đơn vị bị tình nghi trích xuất video camera CCTV tại khu vực cửa nhập dỡ hàng hoặc camera hành trình xe tải.
   - Nộp video / biên bản lên hệ thống: Điền họ tên người nộp, khung giờ trích xuất camera, nội dung giải trình và liên kết video (hỗ trợ link MinIO S3 hoặc Google Drive bàn dỡ).
4. **Chính sách gia hạn**: Nếu cần trích xuất dữ liệu camera liên tỉnh hoặc từ phía đối tác thứ ba, đơn vị được phép yêu cầu gia hạn thêm **12 giờ** (tối đa 1 lần/vụ việc).

### 3.3 Giai đoạn 3: Rà soát Kho & Cứu đơn (`RESOLVED_FOUND`)
- Trong thời gian mở giải trình, Thủ kho Trưởng và Tổ kiểm kê phải tiến hành rà soát thực địa kho (kiểm tra sau các chân kệ pallet, góc chân băng chuyền, khu vực hàng sai luồng, thùng hàng chờ hoàn).
- **Thao tác cứu đơn**:
  - Nhấp nút **"Đã Tìm Thấy Hàng Trong Kho (Cứu Đơn)"**.
  - Bắt buộc nhập: Vị trí cụ thể tìm thấy (`foundLocation`), Nhân sự xác nhận (`foundOperator`), và Ghi chú hiện trạng niêm phong hàng hóa.
  - Hệ thống tự động đóng hồ sơ giám định với trạng thái `RESOLVED_FOUND`, huỷ bỏ cảnh báo bồi thường, ghi nhận số tiền tiết kiệm bảo toàn 100% cho công ty.

### 3.4 Giai đoạn 4: Phán quyết Trách nhiệm & Tự động Liên kết Bồi thường (`ESCALATED_TO_CLAIM`)
- Nếu hết thời hạn 24h (hoặc thời gian gia hạn) mà đơn vị bị tình nghi không cung cấp được video camera chứng minh đã bàn giao kiện hàng hợp lệ:
  1. Cán bộ QA / Trưởng ban Vận hành xem xét toàn bộ chuỗi vết quét và nội dung phản biện (nếu có).
  2. Nhấp nút **"Xác Nhận Phán Quyết & Chuyển Bồi Thường"**.
  3. Nhập tên cán bộ phán quyết (`adjudicator`) và Kết luận chế tài (`finalNotes`).
  4. Hệ thống tự động:
     - Chuyển trạng thái hồ sơ sang `ESCALATED_TO_CLAIM`.
     - Sinh tự động 1 **Hồ sơ Bồi thường (Compensation Claim)** mới bên phân hệ `ClaimsLiability` (`/app/function-groups/service-quality/claims`).
     - Gán trách nhiệm 100% cho đơn vị vi phạm (`responsibleParty`), số tiền phạt bằng 100% giá trị bồi hoàn để chuyển Phòng Kế toán khấu trừ lương/KPI vận hành.

---

## 4. QUY CHUẨN LƯU TRỮ ĐA PHƯƠNG TIỆN MINIO OBJECT STORAGE

Tất cả video trích xuất CCTV, ảnh chụp seal thùng xe, và biên bản giám định hiện trường bắt buộc tuân theo quy chuẩn lưu trữ MinIO S3:

- **Public Endpoint**: `https://minio.nexus-ex.site`
- **Bucket**: `nexus-pod-images`
- **Đường dẫn chuẩn (Object Key)**:
  - Video/Ảnh bằng chứng đơn lạc: `cskh-evidence/{ticketCode}/cctv-{timestamp}.mp4` hoặc `cskh-evidence/{investigationCode}/...`
  - Ảnh giám định hư hại / biên bản bồi thường: `claims-evidence/{claimCode}/inspection-{timestamp}.jpg`
- **Yêu cầu kỹ thuật video**:
  - Định dạng hỗ trợ: `video/mp4` (H.264/AAC) hoặc `video/webm`.
  - Trình phát tích hợp: Hỗ trợ Lightbox xem trực tiếp trên trình duyệt bằng thẻ `<video controls autoPlay>` mà không cần tải về máy tính cá nhân.
  - Tự động chuẩn hoá: Sử dụng tiện ích `normalizeMinioMediaUrl()` để map mọi địa chỉ nội bộ (`http://minio:9000`) về domain HTTPS bảo mật chính thức.

---

## 5. TIÊU CHUẨN THIẾT KẾ BẢNG VẬN ĐƠN ĐỒNG BỘ TOÀN HỆ THỐNG

Giao diện bảng danh sách hồ sơ giám định đơn lạc tuân thủ nghiêm ngặt theo **Carrier Domain Knowledge (AGENTS.md Section 3 & 4)**:

1. **Chiều cao dòng chuẩn 38px (Strict Single-Line Text Row)**:
   - `whiteSpace: 'nowrap'`, chiều cao `38px`, `verticalAlign: 'middle'`.
   - Tuyệt đối không xếp chồng các dòng phụ subline làm phình to dòng.
   - Text dài dùng `text-overflow: ellipsis`, hiển thị đầy đủ qua tooltip `title` khi rê chuột.
2. **Cột Mã Vận Đơn bôi đen mượt mà (Clean Selectable Monospace Tracking Code)**:
   - Font Monospace chuẩn: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`.
   - Màu chữ: `var(--ops-primary, #0052cc)`.
   - Thuộc tính bắt buộc: `user-select: text !important; -webkit-user-select: text !important; cursor: text; whiteSpace: 'nowrap'; display: inline-block`.
   - Không bọc mã trong `<button>`, cho phép người dùng bôi đen kéo chuột dọc từ trên xuống dưới để copy hàng loạt mã vận đơn bằng `Ctrl+C` / `Cmd+C`.
3. **Drawer trượt chi tiết (Slide-Over Drawer)**:
   - Nhấp vào bất kỳ dòng nào hoặc nút xem `Eye` trên bảng sẽ mở Drawer trượt mượt mà từ bên phải màn hình (rộng 760px).
   - Drawer chứa đầy đủ 3 khu vực: (1) Báo cáo giám định sơ bộ, (2) Domino Timeline vết quét thao tác, (3) Danh sách video CCTV và bằng chứng phản biện kèm trình phát video.
4. **Tùy biến cột & Xuất dữ liệu**:
   - Tích hợp `TableColumnPicker` cho phép người dùng bật/tắt hiển thị cột tùy theo vai trò.
   - Tích hợp `useResizableColumns` cho phép kéo dãn độ rộng từng cột chuột và ghi nhớ vào `localStorage`.
   - Nút "Xuất Excel" xuất toàn bộ danh sách vụ việc ra file CSV/Excel UTF-8 có BOM tiếng Việt chuẩn xác.
5. **Nguyên tắc Kiểm tra Toàn cảnh trước khi Phán quyết (Mandatory Full-Context Review before Action)**:
   - Tuyệt đối KHÔNG đặt các nút thao tác phán quyết trực tiếp ngoài bảng danh sách nhằm triệt tiêu rủi ro bấm nhầm hoặc kết luận vội vàng khi chưa đối soát log.
   - Nhân viên vận hành/QA bắt buộc phải nhấp chuột vào dòng đơn để mở Drawer trượt xem toàn cảnh: đối chiếu báo cáo sơ bộ, xem độ tin cậy AI, rà soát chuỗi vết quét Domino, và kiểm tra video camera CCTV bàn dỡ rồi mới được thực hiện các nút thao tác (Cứu đơn, Phán quyết bồi thường, Nộp phản biện, Gia hạn).
