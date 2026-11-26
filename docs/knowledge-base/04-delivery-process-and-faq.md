# Quy Trình Giao Nhận, Xử Lý Giao Thất Bại & Câu Hỏi Thường Gặp (FAQ)

## 1. Quy Trình Phát Hàng & Số Lần Giao Lại
- **Số lần giao tối đa:** Mỗi đơn hàng được giao tận nơi tối đa 03 lần hoàn toàn miễn phí.
- **Thời gian liên hệ:** Bưu tá gọi điện trước khi phát tối thiểu 02 - 03 cuộc gọi (không yêu cầu khoảng cách thời gian giữa các cuộc gọi để đảm bảo năng suất giao hàng 80 - 120 đơn/ngày).
- **Trường hợp giao không thành công (NDR - Non-Delivery Report):**
  - Bưu tá sẽ cập nhật lý do cụ thể trên ứng dụng (Không liên lạc được, Khách hẹn ngày khác, Sai địa chỉ, Khách từ chối nhận).
  - Khách hàng nhận được tin nhắn SMS / thông báo ứng dụng về việc giao không thành công kèm số điện thoại bưu tá để chủ động hẹn lại.

## 2. Quy Định Lưu Kho Bưu Cục & Chuyển Hoàn
- **Ý nghĩa trạng thái 'Lưu kho chờ phát lại' (STORED_FOR_REDELIVERY):** Đơn hàng đang được lưu giữ an toàn tại bưu cục phát do bưu tá chưa phát hàng thành công ở lần phát trước đó (người nhận bận hoặc hẹn lại giờ).
- **Thời gian lưu kho miễn phí:** Tối đa 05 ngày làm việc tại bưu cục phát để bưu tá tiếp tục sắp xếp phát hàng lại tận nhà cho khách hoặc chờ khách đến nhận tại quầy.
- **Chuyển hoàn bưu gửi:** Sau thời hạn 05 ngày nếu người nhận không nhận hàng hoặc người gửi yêu cầu hoàn, đơn hàng sẽ được kích hoạt tiến trình chuyển hoàn về lại cho người gửi (Shop).

## 3. Quy Định Đổi Địa Chỉ Nhận & Hẹn Giờ Giao
- Người nhận có thể yêu cầu đổi địa chỉ nhận hàng trong cùng quận/huyện miễn phí bằng cách liên hệ tổng đài hoặc thao tác trên ứng dụng Customer Mobile trước khi đơn hàng chuyển sang trạng thái "Đang giao hàng" (Out For Delivery).
- Nếu đổi sang tỉnh/thành phố khác, bưu gửi sẽ áp dụng cước chuyển tiếp phát sinh theo bảng cước hiện hành.

## 4. Quyền Riêng Tư Dữ Liệu Tài Chính Người Nhận
- Khi người nhận tra cứu mã vận đơn trên cổng trực tuyến, hệ thống chỉ hiển thị: Tên hàng hóa, Cân nặng, Trạng thái hành trình và **Số tiền thu hộ COD cần thanh toán**.
- Biểu phí vận chuyển chi tiết, mức chiết khấu thương mại và công thức tính cước của Chủ shop/Người gửi được bảo mật tuyệt đối.

## 5. Chính Sách Cước Phí Chuyển Hoàn (Return Policy & Return Fee)
Khi đơn hàng giao không thành công sau 03 lần phát (NDR) hoặc người nhận từ chối nhận hàng (bom hàng), bưu gửi được chuyển hoàn về địa chỉ người gửi theo quy chuẩn:
- **Mô hình Chính sách Linh hoạt theo Hợp đồng (Rule-based Configurable Policy):**
  - **Mức Chuẩn Mặc Định (Standard Tier - Khách lẻ / Shop thông thường):** Áp dụng thu **50% cước vận chuyển chiều đi** (Forward Shipping Fee) nhằm bù đắp chi phí phương tiện, kho bãi, nhân công bốc dỡ chiều về và ngăn chặn tình trạng tạo đơn ảo gây lãng phí tài nguyên logistics.
  - **Cấu hình Ưu Đãi Doanh Nghiệp (VIP Enterprise Tier):** Áp dụng **0 VNĐ (Miễn phí chuyển hoàn 100%)** đối với các đối tác thương mại điện tử chiến lược, các nhãn hàng hoặc chủ shop đạt cam kết sản lượng lớn (ví dụ trên 1.000 đơn/tháng) như một chính sách chiết khấu thương mại.
  - **Cấu hình Đồng Giá (Flat Fee):** Hỗ trợ thiết lập mức phí hoàn cố định (ví dụ: 10.000 VNĐ/kiện) theo thỏa thuận khung hợp đồng riêng.
- **Bên chịu chi phí cước hoàn:** **Người gửi (Shop / Merchant)** chịu chi phí này vì người nhận đã từ chối nhận bưu gửi.
- **Hình thức thu tiền cước chuyển hoàn:**
  - *Đối với Shop có tài khoản ký hợp đồng:* Hệ thống tự động khấu trừ vào **Bảng kê đối soát tiền thu hộ COD (COD Settlement Batch)** của kỳ thanh toán tiếp theo hoặc trừ vào số dư Ví điện tử của Shop.
  - *Đối với Khách gửi hàng lẻ tại bưu cục:* Bưu tá phát hoàn hoặc giao dịch viên tại bưu cục thu tiền mặt hoặc quét mã VietQR khi bàn giao lại bưu kiện cho người gửi (Return POD).

## 6. Dịch Vụ Shipper Đến Tận Nhà Lấy Hàng (Pickup Service)
- **Cước phí dịch vụ lấy hàng:** **Hoàn toàn miễn phí 100% (0 VNĐ)**. Khách hàng/Shop không phải trả thêm bất kỳ phụ phí lấy hàng tận nơi nào, chỉ thanh toán cước phí vận chuyển thông thường.
- **Thời gian bưu tá đến lấy hàng:** Bưu tá tiếp nhận lệnh điều phối và đến lấy hàng tận nhà trong vòng 02 đến 04 giờ sau khi tạo đơn thành công, theo ca sáng (trước 12:00) hoặc ca chiều (trước 18:00).
- **Hẹn giờ giao lại hàng (Redelivery):** Khách hàng có thể hẹn lại thời gian phát hàng phù hợp (hẹn buổi chiều, hẹn ngày mai, hẹn cuối tuần) bằng cách phản hồi tin nhắn hoặc thông báo cho bưu tá qua ứng dụng.

## 7. Quy Chuẩn Thông Báo Khi Đơn Hàng Đang Phát (Out For Delivery Alert SOP)
Khi bưu tá xuất kho đi phát hàng (`OUT_FOR_DELIVERY` / `DELIVERING`), hệ thống phân định thông báo rõ ràng theo 2 đối tượng:
- **Đối với Khách Nhận (Recipient):**
  - Thông báo kiện hàng đang được bưu tá phụ trách tuyến trực tiếp đi phát, kèm thông tin họ tên và số điện thoại bưu tá.
  - Nhắc nhở người nhận chú ý điện thoại để bưu tá liên hệ giao hàng.
  - **Tiện ích hẹn phát lại thông minh:** Nếu hôm nay người nhận bận việc hoặc vắng nhà, khách có thể hẹn lại lịch giao hàng sang ngày mai hoặc khung giờ khác trực tiếp qua AI Chatbot hoàn toàn miễn phí.
- **Đối với Khách Gửi (Shop / Merchant):**
  - Thông báo minh bạch cho Shop biết đơn hàng đang được bưu tá phát đến người nhận (kèm tên người nhận, địa chỉ và số điện thoại).
  - Trấn an Shop yên tâm vì bưu tá đang trên tuyến và hệ thống sẽ cập nhật ngay kết quả giao hàng thành công hoặc báo cáo đối soát.

## 8. Quy Chuẩn Hẹn Giao Lại Qua AI Chatbot & Thao Tác Quét Tồn Kho (Automated Redelivery & Inventory Check SOP)
Khi khách hàng bận và yêu cầu hẹn giao lại (ví dụ hẹn ngày mai, sáng mai, chiều mai) thông qua AI Chatbot:
1. **Tự động gọi API hệ thống:** Chatbot tự động phân tích ý định và kích hoạt API ghi nhận lịch hẹn trên hệ thống điều phối bưu chính (`delivery-service` / `dispatch-service`).
2. **Quy chuẩn Carrier SOP cho Bưu tá (Shipper):**
   - Bưu tá phụ trách tuyến **KHÔNG CẦN phải thao tác lập "Kiện vấn đề" hay biên bản sự cố (NDR)** trên ứng dụng di động làm gián đoạn hành trình hay phải rời khỏi app.
   - Nhiệm vụ duy nhất của bưu tá: Mang kiện hàng về bưu cục phát vào cuối ca giao nhận.
3. **Quy chuẩn Carrier SOP cho Vận hành Bưu cục (OPS Hub):**
   - Bộ phận OPS thực hiện thao tác **Quét tồn kho (`INVENTORY_CHECK`)** tại bưu cục phát để quản lý kiện hàng chờ phát lại.
   - Vào ca làm việc sáng hôm sau, hệ thống tự động đưa kiện vào danh sách phân bổ tuyến phát lại đúng theo lịch hẹn ưu tiên cho khách.
4. **Chính sách cước phát lại:** Miễn phí phát lại hoàn toàn 100% (0 VNĐ) theo quy chuẩn phát tối đa 03 lần của Nexus Logistics.

## 9. Quy Chuẩn Giữ Hàng Tại Bưu Cục & Tự Đến Lấy (Hold at Hub / PUDO - Customer Self-Pickup SOP)

### 9.1. Tình Huống Thực Tế & Kích Hoạt Tự Động
- **Bối cảnh vận hành:** Khách hàng làm việc văn phòng (8:00 - 19:00), vắng nhà ban ngày khi shipper đi phát, không có người nhận hộ.
- **Kích hoạt qua AI Chatbot:** Khách chỉ cần nhắn yêu cầu giữ hàng qua Chatbot (ví dụ: *"Đơn này bưu cục giữ lại giúp mình nhé, tối tan ca khoảng 19h30 mình tự ghé bưu cục phát lấy hàng"*).
- **Chuyển đổi hình thức bưu gửi:** Hệ thống tự động ghi nhận chuyển phương thức giao nhận từ *"Giao tận nhà"* sang *"Tự đến lấy tại quầy bưu cục"* (Hold for Pickup / PUDO).

### 9.2. Quy Chuẩn Carrier SOP cho Bưu Tá (Shipper)
- Bưu tá tuyến được giải phóng khỏi lệnh phát tận nhà cho đơn hàng này.
- Bưu tá **không cần lập biên bản sự cố hay kiện vấn đề** trên app di động.
- Kiện hàng được lưu giữ an toàn tại quầy giao dịch bưu cục phát.

### 9.3. Quy Chuẩn Carrier SOP cho Vận Hành Bưu Cục (OPS Hub)
- Bộ phận OPS thực hiện thao tác **Quét tồn kho (`INVENTORY_CHECK`)** tại bưu cục phát.
- Dán nhãn định vị PUDO và phân loại kiện hàng vào khu vực giá kệ giữ hàng chờ khách nhận tại quầy giao dịch.
- **Thời hạn lưu giữ miễn phí:** Bưu cục lưu kho miễn phí tối đa **05 ngày làm việc** (0 VNĐ).

### 9.4. Cơ Chế Bảo Mật Mã Nhận Hàng (Secure Pickup OTP / PIN)
- Hệ thống tự động sinh và cấp một **Mã PIN bảo mật 6 chữ số** ngẫu nhiên gửi trực tiếp cho khách qua Chatbot/SMS.
- Mã PIN này có hiệu lực trong suốt thời gian lưu giữ kiện hàng tại bưu cục phát.

### 9.5. Quy Trình Giao Nhận Tại Quầy Bưu Cục (`COUNTER_PICKUP_POD`)
1. Khách hàng đến quầy bưu cục phát (mở cửa từ 07:30 - 21:00 hàng ngày, kể cả Chủ Nhật và ngày lễ).
2. Khách xuất trình: **Số điện thoại người nhận** + đọc **Mã PIN 6 chữ số**.
3. Giao dịch viên OPS nhập mã kiểm tra đối soát thông tin kiện hàng trên phần mềm quản lý quầy giao dịch.
4. Thu tiền thu hộ COD (nếu có): Hỗ trợ thanh toán tiền mặt hoặc quét mã VietQR tĩnh/động tại quầy.
5. Giao dịch viên hoàn tất biên bản bàn giao tại quầy (**COUNTER_PICKUP_POD**), khách ký nhận hoặc chụp ảnh xác nhận và nhận kiện hàng.

## 10. Quy Chuẩn Đổi Người Nhận & Số Điện Thoại Nhận Hộ (Change Consignee / Receiver Info SOP)

### 10.1. Tình Huống Thực Tế & Kích Hoạt Tự Động
- **Bối cảnh vận hành:** Khách hàng bận đột xuất (họp, đi công tác, vắng nhà), muốn đổi sang cho người thân / bảo vệ chung cư / đồng nghiệp nhận hộ tại cùng địa chỉ đã đăng ký.
- **Kích hoạt qua AI Chatbot:** Khách chỉ cần nhắn yêu cầu (ví dụ: *"Đơn này đổi người nhận sang anh Nam, SĐT 0988112233 giúp mình để shipper gọi anh ấy nhé"*).

### 10.2. Quy Chuẩn Vận Hành Khác Biệt Giữa Đổi Địa Chỉ vs Đổi Người Nhận
- **Đổi địa chỉ giao hàng:** Có thể làm thay đổi tuyến phát, phải tính lại cước tuyến (nếu khác quận/tỉnh) và chuyển giao giữa các bưu tá khác nhau.
- **Đổi người nhận / SĐT tại cùng địa chỉ:**
  - **Hoàn toàn miễn phí 100% (0 VNĐ):** Không phát sinh phụ phí do không thay đổi phân bổ tuyến giao nhận của bưu tá.
  - Áp dụng linh hoạt ngay cả khi kiện hàng đang trên tuyến đi phát (`OUT_FOR_DELIVERY` / `DELIVERING`).

### 10.3. Đồng Bộ Tự Động Vào Ứng Dụng Bưu Tá (Courier Mobile)
- Hệ thống tự động cập nhật `receiverName` và `receiverPhone` mới vào task phát hàng của bưu tá phụ trách tuyến.
- Màn hình phát hàng trên App bưu tá tự động hiển thị số điện thoại mới kèm nút **"Gọi điện"**, giúp bưu tá bấm gọi trực tiếp cho người nhận mới mà không bị nhầm lẫn với khách hàng ban đầu.

### 10.4. Vết Quét Kiểm Toán Vận Đơn (Audit Trail)
- Hệ thống tự động ghi nhận sự kiện **`CONSIGNEE_UPDATED`** vào chuỗi lịch sử hành trình: ghi rõ tên người nhận mới, số điện thoại mới và thời điểm cập nhật nhằm phục vụ đối soát và giải trình sự cố phát hàng (nếu có).

## 11. Quy Chuẩn Kiểm Soát Cuộc Gọi & Chống "Bắn Trạng Thái Ma" (Call Attempt Audit & Anti-Ghost NDR SOP)

### 11.1. Thực Trạng & Nỗi Đau "Bắn Trạng Thái Ma" (Ghost NDR / Fake Failures)
- **Hành vi gian lận vận hành:** Shipper lười đi phát hàng hoặc muốn về sớm, ngồi tại quán cà phê/xa địa chỉ nhận rồi tự ý bấm lý do thất bại "Không liên lạc được" (`CANNOT_CONTACT`) hoặc "Khách vắng nhà" để trốn tránh chỉ tiêu SLA phát hàng trong ngày.
- **Hậu quả:** Gây bức xúc cho người nhận (ở nhà cả ngày không thấy cuộc gọi nào nhưng đơn hàng báo giao không thành công), làm hỏng uy tín của Shop và hãng vận chuyển.

### 11.2. Cơ Chế Kiểm Soát 2 Lớp Bắt Buộc (Two-Factor Carrier Attempt Audit)
Trước khi hệ thống chấp nhận lý do giao thất bại "Không liên lạc được", hệ thống bắt buộc kiểm tra 2 điều kiện cứng:
1. **Kiểm soát Lịch sử Cuộc gọi (Call Attempt Audit):**
   - Bưu tá bắt buộc phải thực hiện tối thiểu **02 - 03 cuộc gọi** đến số điện thoại người nhận.
   - **Không yêu cầu khoảng cách thời gian giữa các cuộc gọi** nhằm bảo đảm năng suất giao nhận cao (80 - 120 kiện/ngày/bưu tá).
   - Nếu chưa gọi đủ tối thiểu 02 cuộc, ứng dụng bưu tá sẽ chặn thao tác và cảnh báo: *"Chưa thực hiện đủ tối thiểu 02 cuộc gọi đến khách hàng"*.
2. **Kiểm soát Tọa độ Địa lý Thực tế (GPS Geofence Verification):**
   - Tọa độ GPS thực tế của bưu tá tại thời điểm bấm thất bại bắt buộc phải nằm trong bán kính **$\le 200\text{m}$** so với tọa độ địa chỉ giao nhận của khách hàng.
   - Nếu tọa độ bưu tá cách xa $> 200\text{m}$, hệ thống kích hoạt cảnh báo chặn gian lận: *"Tọa độ GPS nằm ngoài bán kính 200m so với địa chỉ nhận hàng. Vui lòng di chuyển đến đúng địa chỉ nhận hàng trước khi báo sự cố"*.

### 11.3. AI Chatbot Tự Động Kích Hoạt Tin Nhắn Chăm Sóc Khi Có Cuộc Gọi Nhỡ (Proactive NDR Chatbot Trigger)
- Khi bưu tá đã đáp ứng đủ 2 điều kiện kiểm soát ($\ge 2$ cuộc gọi và GPS $\le 200\text{m}$) mà khách hàng thực sự bận không thể bắt máy:
  - Hệ thống tự động kích hoạt thông điệp gửi đến người nhận qua AI Chatbot / Zalo ZNS / SMS:
    *"Bưu tá [Tên bưu tá] vừa liên hệ giao đơn [Mã vận đơn] lúc [HH:mm] nhưng chưa kết nối được máy với mình ạ. Anh/chị có thể cho em xin khung giờ nghe máy thuận tiện nhất trong hôm nay (hoặc chiều nay / ngày mai) để bưu tá gọi lại nhé ạ!"*
- Khi khách hàng phản hồi khung giờ thuận tiện (ví dụ: *"Lúc nãy bận họp chưa nghe máy, tầm 14h chiều bưu tá gọi lại giao nhé"*):
  - AI Chatbot tự động ghi nhận ý định và kích hoạt công cụ `scheduleRedelivery` ghi nhận khung giờ hẹn lại vào hệ thống điều phối.
  - Thông báo khung giờ gọi lại trực tiếp trên ứng dụng của bưu tá mà không cần bưu tá phải rời khỏi app hay tạo kiện vấn đề phức tạp.

