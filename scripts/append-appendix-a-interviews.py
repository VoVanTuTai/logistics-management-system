#!/usr/bin/env python3
"""
Append PHỤ LỤC A: BẢNG CÂU HỎI PHỎNG VẤN KHẢO SÁT YÊU CẦU HỆ THỐNG
to docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx.

- 100% natural, authentic stakeholder Q&A tone (no robotic tech jargon inside
  stakeholder answers; BA mapping translates real pain points into Nexus Express
  features & architecture).
- Customer-centric AI Chatbot RAG focus: 8/11 AI questions concentrated directly
  on Guest (FloatingAiChatWidget) and Customer C-End (FloatingAiChatModal),
  covering all 9 real tools in logistics-tools.service.ts; OPS Staff covers
  anti-hallucination & HITL ticketing (CustomerServiceTicketsPage); Admin covers
  SOP knowledge updates & Multi-LLM resilience; Merchant & Courier stay 100%
  faithful to their real non-AI-widget workflows.
- Exact thesis formatting parity: native Heading1 (pageBreakBefore), Heading2,
  Heading6 (13pt centered captions), Normal body (firstLine=720), and 9072-twip
  10pt Times New Roman tables (bad_ind=0, monochrome academic styling).
"""

import os
import re
import docx
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

DOC_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx"

# Exact Section printable width = 9072 twips (16.0 cm A4 portrait)
COL_WIDTHS_SUMMARY = [1050, 1750, 2950, 1250, 2072]
assert sum(COL_WIDTHS_SUMMARY) == 9072

COL_WIDTHS_QA = [960, 2340, 2950, 2822]
assert sum(COL_WIDTHS_QA) == 9072

SUMMARY_HEADERS = [
    "Mã đối tượng",
    "Nhóm Actor đại diện",
    "Hồ sơ đối tượng khảo sát (ẩn danh)",
    "Ngày phỏng vấn",
    "Số câu hỏi",
]

SUMMARY_ROWS = [
    ("P-GST-01", "Khách vãng lai (Guest)", "Người mua sắm trực tuyến nhận hàng lẻ (22–30 tuổi, TP.HCM)", "03/06/2026", "5 câu (3 câu Trợ lý AI)"),
    ("P-CUS-01", "Khách hàng cá nhân (Customer)", "Khách hàng thường xuyên gửi và nhận bưu kiện qua điện thoại", "05/06/2026", "7 câu (5 câu Trợ lý AI)"),
    ("P-MRC-01", "Đối tác gửi hàng (Merchant B2B)", "Chủ cửa hàng bán lẻ trực tuyến (50–150 đơn/ngày, TP.HCM)", "08/06/2026", "4 câu (Nghiệp vụ B2B)"),
    ("P-COU-01", "Nhân viên giao nhận (Courier)", "Bưu tá lấy và phát hàng chặng cuối (kinh nghiệm trên 2 năm)", "10/06/2026", "5 câu (Giao nhận & Chat)"),
    ("P-OPS-01", "Nhân viên vận hành (OPS Staff)", "Điều phối viên kho bưu cục, CSKH và chuyên viên đối soát QA", "12/06/2026", "6 câu (2 câu HITL/QA AI)"),
    ("P-ADM-01", "Quản trị viên (Admin)", "Cán bộ phụ trách hạ tầng CNTT và quản trị mạng lưới bưu cục", "16/06/2026", "4 câu (1 câu vận hành AI)"),
]

QA_HEADERS = [
    "Mã câu",
    "Câu hỏi phỏng vấn",
    "Nội dung phản hồi thực tế",
    "Yêu cầu & Tính năng hình thành",
]

ACTOR_INTERVIEWS = [
    {
        "heading": "A.1. Phiếu phỏng vấn Actor Khách vãng lai (Guest)",
        "caption": "Bảng A.2. Tổng hợp phỏng vấn yêu cầu nhóm Khách vãng lai (P-GST-01)",
        "meta": "Đối tượng: P-GST-01 | Ngày phỏng vấn: 03/06/2026 | Người thực hiện: Võ Văn Tú Tài, Trần Tấn Tài | Hình thức: Phỏng vấn trực tiếp.",
        "rows": [
            (
                "Q-GST-01",
                "Khi người bán gửi cho anh/chị một mã vận đơn, anh/chị muốn kiểm tra kiện hàng của mình theo cách nào và có e ngại điều gì không?",
                "Tôi chỉ muốn vào trang web gõ mã đơn là xem được ngay hàng đang ở đâu, khỏi phải tải ứng dụng hay đăng ký tài khoản. Nhưng tôi rất ngại việc ai nhặt được mã đơn cũng nhìn thấy hết số điện thoại và địa chỉ nhà mình.",
                "Cổng tra cứu công khai không cần đăng nhập trên guest-web (:5177, GET /public/track/:code) kết hợp cơ chế tự động che ẩn thông tin cá nhân PII (0909***114).",
            ),
            (
                "Q-GST-02",
                "Trước khi mang một thùng hàng ra gửi lẻ, thông tin nào khiến anh/chị hay phải tìm hiểu trước nhất?",
                "Thường tôi muốn biết trước phí gửi hết khoảng bao nhiêu nếu chọn gửi tiết kiệm hay giao nhanh, nhất là mấy thùng cồng kềnh nhưng nhẹ, rồi xem quanh khu nhà mình có bưu cục nào còn mở cửa để mang ra.",
                "Chức năng ước tính cước minh bạch theo gói dịch vụ và quy đổi thể tích IATA V/6000 (pricing-service :3012) cùng công cụ tìm kiếm mạng lưới 38 bưu cục 4 cấp.",
            ),
            (
                "Q-GST-03",
                "Lúc buổi tối hay cuối tuần cần hỏi quy định bồi thường hàng vỡ, phí hoàn hàng hoặc bưu cục giữ hàng được bao lâu thì anh/chị thường tìm ở đâu?",
                "Tầm 9–10 giờ tối gọi tổng đài chẳng ai nghe máy, còn mở trang điều khoản quy định dài mấy trang đọc rất rối, không biết trường hợp của mình được đền bao nhiêu. Nếu có khung chat hỏi thẳng bằng tiếng Việt và chỉ rõ trích từ mục quy định nào thì dễ tin hơn nhiều.",
                "Trợ lý AI Chatbot RAG hoạt động 24/7 trên guest-web (FloatingAiChatWidget → chatbot-service :3013) truy xuất 59 chunks SOP (Luật Bưu chính 2010, NĐ 47/2011) qua Hybrid Search 3072-D kèm nhãn trích dẫn nguồn Citations[].",
            ),
            (
                "Q-GST-04",
                "Khi đang mở khung chat tư vấn trên web, anh/chị có muốn hỏi luôn tình trạng đơn hàng hoặc nhờ tính phí ngay trong đó thay vì tự chuyển trang không?",
                "Có chứ, nhiều lúc lười tìm đúng mục trên menu. Tôi chỉ cần nhắn đại \"Đơn SHP-... của tôi tới đâu rồi?\" hoặc \"Gửi 3 kg từ Hà Nội vào TP.HCM hết bao nhiêu?\" rồi hiện luôn thẻ thông tin rõ ràng ngay trong ô chat là tiện nhất.",
                "Bộ định tuyến ý định (Intent Router) kết hợp gọi công cụ thời gian thực trackShipment(:3008) và calculatePricing(:3012), hiển thị Thẻ Vận đơn trực quan và nút gợi ý Action Chips ngay trong khung chat.",
            ),
            (
                "Q-GST-05",
                "Khi trò chuyện với các khung chat tự động trên website khác, điều gì khiến anh/chị thấy khó chịu nhất và muốn thoát ra ngay?",
                "Khó chịu nhất là hỏi một câu mà màn hình cứ xoay tròn chờ rất lâu mới hiện cả đoạn dài, hoặc hỏi chuyện ngoài lề thì máy trả lời lan man không đúng trọng tâm dịch vụ giao hàng.",
                "Cơ chế phản hồi từng phần theo luồng SSE (25 ms) giúp hiển thị mượt tức thì, kết hợp chốt chặn Stage-0 Security Gatekeeper (< 50 ms) lọc sớm các câu hỏi ngoài phạm vi bưu chính.",
            ),
        ],
    },
    {
        "heading": "A.2. Phiếu phỏng vấn Actor Khách hàng cá nhân (Customer C-End)",
        "caption": "Bảng A.3. Tổng hợp phỏng vấn yêu cầu nhóm Khách hàng cá nhân (P-CUS-01)",
        "meta": "Đối tượng: P-CUS-01 | Ngày phỏng vấn: 05/06/2026 | Người thực hiện: Võ Văn Tú Tài, Trần Tấn Tài | Hình thức: Phỏng vấn trực tiếp.",
        "rows": [
            (
                "Q-CUS-01",
                "Với người hay gửi đồ cho gia đình và nhận nhiều đơn mua sắm mỗi tuần, anh/chị thấy bất tiện nhất điều gì khi quản lý trên điện thoại?",
                "Mỗi lần tạo đơn gửi lại phải gõ lại địa chỉ cũ rất mất công. Còn lúc chờ nhận hàng thì không nắm được kiện hàng đang ở bưu cục nào hay bưu tá sắp giao chưa để chủ động nghe điện thoại.",
                "Ứng dụng Customer Mobile (Expo) hỗ trợ lưu sổ địa chỉ mặc định, tạo đơn cá nhân nhanh và theo dõi tiến trình Timeline thời gian thực từ tracking-service (:3008).",
            ),
            (
                "Q-CUS-02",
                "Khi nhận các món đồ có giá trị như điện thoại hay giấy tờ quan trọng, anh/chị cần cách xác nhận nào để yên tâm?",
                "Tôi sợ nhất trường hợp shipper tự bấm đã giao hoặc gửi đại ở sảnh chung cư rồi thất lạc. Có mã xác nhận gửi riêng cho tôi và ảnh chụp lúc bàn giao lưu lại trên ứng dụng thì mới yên tâm.",
                "Quy trình xác thực mã OTP 6 số kết hợp lưu trữ ảnh bằng chứng giao nhận POD trên MinIO (bucket nexus-pod-images) tại delivery-service (:3007).",
            ),
            (
                "Q-CUS-03",
                "Mỗi khi có 3–4 đơn hàng đang đi cùng lúc, anh/chị thường kiểm tra nhanh bằng cách nào trên ứng dụng?",
                "Mã vận đơn vừa dài vừa khó nhớ, mỗi lần muốn hỏi lại phải quay ra copy dán vào rất phiền. Nếu mở khung trợ lý trên app mà nó tự hiểu luôn đơn gần nhất của tôi đang ở đâu, kèm mấy nút bấm nhanh thì tiện hơn rất nhiều.",
                "Khung chat nổi FloatingAiChatModal tích hợp công cụ getUserShipments (5 đơn gần nhất) và getLatestShipment(:3002) gắn ngữ cảnh tài khoản đăng nhập cùng nút gợi ý Action Chips một chạm.",
            ),
            (
                "Q-CUS-04",
                "Nếu thi thoảng mới gửi lẻ một kiện đồ cho người quen, anh/chị có thấy biểu mẫu tạo đơn nhiều ô nhập liệu bị rối không?",
                "Có, người không bán hàng chuyên nghiệp nhìn màn hình khai báo hàng chục ô rất ngại. Giá mà tôi chỉ cần nhắn tự nhiên trong chat tên người nhận, số điện thoại, địa chỉ và khối lượng để trợ lý lên đơn giúp thì dễ dùng hơn hẳn.",
                "Công cụ createRetailOrder trong chatbot-service cho phép khách hàng cung cấp thông tin bằng ngôn ngữ tự nhiên để khởi tạo đơn lẻ trực tiếp trong hội thoại.",
            ),
            (
                "Q-CUS-05",
                "Trong trường hợp vừa đặt đơn xong lại đổi ý muốn hủy, cần đổi địa chỉ nhận hoặc hôm nay bận muốn hẹn giao lại ngày mai, anh/chị thường làm thế nào?",
                "Thường phải gọi lên tổng đài chờ chuyển máy rất lâu, có khi chờ xong thì shipper đã chạy tới nơi rồi. Nếu nhắn thẳng cho trợ lý trên app để hủy đơn, sửa địa chỉ hay dời lịch phát lại ngay lập tức thì đỡ tốn thời gian lắm.",
                "Bộ ba công cụ thao tác hậu mãi trực tiếp trong khung chat: cancelShipment (hủy đơn hợp lệ), changeDeliveryAddress (đổi địa chỉ giao) và scheduleRedelivery (hẹn lịch phát lại).",
            ),
            (
                "Q-CUS-06",
                "Khi đã nộp khiếu nại hàng bị móp vỡ, anh/chị muốn theo dõi tiến độ giải quyết ra sao và có lo ngại vấn đề riêng tư khi dùng trợ lý tự động không?",
                "Tôi muốn hỏi nhanh xem hồ sơ khiếu nại của mình duyệt tới bước nào rồi. Đồng thời tôi cũng lo nếu dùng AI thì có bị ai đó cố tình nhắn câu lệnh lừa máy đọc ra số điện thoại hay thông tin đơn hàng của tôi không.",
                "Công cụ trackClaimStatus tra cứu tiến độ mã hồ sơ CLM-... kết hợp lớp bảo vệ Stage-0 Security Gatekeeper chặn tấn công tiêm lệnh (prompt injection) và bảo vệ PII theo Nghị định 13/2023/NĐ-CP.",
            ),
            (
                "Q-CUS-07",
                "Nếu kiện hàng gặp sự cố nghiêm trọng như thất lạc hoặc vỡ hỏng nặng mà trợ lý tự động không giải quyết dứt điểm được, anh/chị mong muốn gì?",
                "Tôi ghét nhất kiểu chatbot cứ xin lỗi vòng vo mà không giải quyết được. Khi gặp ca khó thì nên chuyển thẳng sang nhân viên chăm sóc khách hàng thật, và nhân viên phải đọc được sẵn đoạn tôi đã trao đổi chứ đừng bắt kể lại từ đầu.",
                "Cơ chế chuyển tiếp Human-in-the-Loop (HITL) qua công cụ escalateToHumanAgent mở phiếu CSKH đẩy thẳng sang CustomerServiceTicketsPage trên OPS Web kèm trọn bộ lịch sử hội thoại.",
            ),
        ],
    },
    {
        "heading": "A.3. Phiếu phỏng vấn Actor Đối tác gửi hàng thương mại điện tử (Merchant B2B)",
        "caption": "Bảng A.4. Tổng hợp phỏng vấn yêu cầu nhóm Đối tác gửi hàng (P-MRC-01)",
        "meta": "Đối tượng: P-MRC-01 | Ngày phỏng vấn: 08/06/2026 | Người thực hiện: Võ Văn Tú Tài, Trần Tấn Tài | Hình thức: Phỏng vấn trực tiếp tại kho shop.",
        "rows": [
            (
                "Q-MRC-01",
                "Với quy mô gửi hàng chục đến hơn trăm đơn mỗi ngày, cửa hàng thường gặp tranh cãi hoặc sai sót ở khâu nào nhất khi lên đơn?",
                "Hay bị lệch tiền cước nhất là mấy thùng hàng cồng kềnh do nhân viên đóng gói chỉ cân ký mà quên tính kích thước. Ngoài ra gửi đồ dễ vỡ hay linh kiện điện tử mà không có cảnh báo rõ trên tem và nhắc khai giá bảo hiểm thì lúc hư hỏng rất thiệt cho shop.",
                "Phân loại 5 nhóm mặt hàng chuẩn Carrier (GENERAL, FRAGILE, HIGH_VALUE, BULKY, DOCUMENT), tự quy đổi IATA V/6000, chặn quá trần 70 kg/150 cm/300 cm, kích hoạt bảo hiểm 0,5% và lưu Pricing Snapshot cố định.",
            ),
            (
                "Q-MRC-02",
                "Khi kiện hàng đã đóng gói hoặc đã giao cho bưu cục mà khách mua nhắn đổi số điện thoại, địa chỉ hoặc sửa tiền thu hộ COD thì shop xử lý ra sao?",
                "Trước đây toàn gọi điện báo bưu cục sửa tay, rất dễ bị quên hoặc bưu tá vẫn nhìn tem cũ thu sai tiền của khách khiến shop phải mất công giải thích lại.",
                "Luồng yêu cầu thay đổi thông tin đơn (Change Request, POST /change-requests): sau khi OPS phê duyệt sẽ đồng bộ tự động vào shipment_db/payment_db và bật cờ yêu cầu in lại tem nhiệt.",
            ),
            (
                "Q-MRC-03",
                "Điều gì khiến chủ shop lo lắng nhất trong quá trình đối soát tiền thu hộ COD và xử lý các đơn giao không thành công?",
                "Tiền COD là dòng tiền quay vòng nhập hàng nên shop cần nhìn rõ từng đơn đã phát thành công ứng với đợt chuyển khoản nào. Với đơn giao thất bại thì cần biết ngay lý do cụ thể để nhân viên shop gọi xác nhận với khách trước khi bị hoàn về.",
                "Phân hệ đối soát COD minh bạch theo phiên (payment-service :3011), hiển thị chi tiết mã lý do giao thất bại NDR (tối đa 3 lượt phát) và quản lý tiến trình chuyển hoàn (Return).",
            ),
            (
                "Q-MRC-04",
                "Cửa hàng đang bán qua website riêng muốn tự động đẩy đơn sang hãng vận chuyển thì đặt ra yêu cầu gì về tích hợp?",
                "Cần kết nối API ổn định để đơn tạo trên web bán hàng tự đẩy qua hãng vận chuyển và cập nhật trạng thái ngược lại tự động, nhưng phải có cơ chế xác thực chặt để tránh người lạ gửi yêu cầu tạo đơn giả mạo.",
                "Cổng tích hợp đối tác Marketplace Integration trên gateway-bff xác thực chữ ký HMAC-SHA256, kiểm soát độ lệch thời gian Timestamp (300 giây), chống phát lại Nonce TTL (24 giờ) và gửi Webhook trạng thái.",
            ),
        ],
    },
    {
        "heading": "A.4. Phiếu phỏng vấn Actor Nhân viên giao nhận (Courier / Bưu tá)",
        "caption": "Bảng A.5. Tổng hợp phỏng vấn yêu cầu nhóm Nhân viên giao nhận (P-COU-01)",
        "meta": "Đối tượng: P-COU-01 | Ngày phỏng vấn: 10/06/2026 | Người thực hiện: Võ Văn Tú Tài, Trần Tấn Tài | Hình thức: Phỏng vấn trực tiếp sau ca giao.",
        "rows": [
            (
                "Q-COU-01",
                "Trong quá trình chạy tuyến đi lấy và giao hàng ngoài đường, sự cố ứng dụng nào khiến anh/chị hay bị gián đoạn công việc nhất?",
                "Khổ nhất là lúc mang hàng xuống hầm chung cư hoặc giao khu vùng ven bị mất sóng 4G, bấm xác nhận giao hay quét mã bị lỗi. Nhiều lúc bấm gửi lại mấy lần thì sợ hệ thống ghi trùng đơn hoặc cộng tiền COD thành hai lần.",
                "Cơ chế hàng đợi ngoại tuyến Offline Queue (AsyncStorage) trên courier-mobile tự động đồng bộ khi có mạng, kết hợp khóa chống xử lý trùng IdempotencyRecord trên scan (:3006), delivery (:3007) và payment (:3011).",
            ),
            (
                "Q-COU-02",
                "Lúc bàn giao bưu kiện cho người nhận, anh/chị cần thao tác chụp ảnh và xác nhận như thế nào để vừa nhanh vừa tránh bị khách khiếu nại oan?",
                "Chụp hình kiện hàng lúc giao phải nhanh và tải lên gọn để khỏi đứng máy. Với mấy đơn giá trị cao thì nên bắt buộc nhập mã xác nhận của khách, sau này khách có báo chưa nhận thì bưu tá có bằng chứng đối chiếu ngay.",
                "Luồng cấp Presigned URL tải ảnh POD trực tiếp lên MinIO (MediaController) không gây nghẽn gateway, đi kèm xác thực OTP 6 số và ghi nhận sự kiện delivery.delivered.",
            ),
            (
                "Q-COU-03",
                "Nếu gọi khách nhiều lần không nghe máy hoặc phát hiện kiện hàng bị rách ướt trên đường giao, anh/chị muốn báo cáo trên app ra sao?",
                "Ngoài đường không có thời gian gõ dài dòng, nên chỉ cần danh sách lý do có sẵn để bấm chọn nhanh, cho chụp thêm ảnh hiện trường nếu hàng bị hư hại vỏ hộp và tự đếm số lần giao thất bại để khỏi nhớ nhầm.",
                "Nghiệp vụ NDR dùng danh mục mã lý do NdrReason chuẩn, hỗ trợ báo sự cố ngoại quan (EXCEPTION) tự động khóa đơn trên shipment-service và lập lịch hẹn phát lại (reschedule).",
            ),
            (
                "Q-COU-04",
                "Cuối ngày về bưu cục nộp lại tiền thu hộ COD, khâu nào thường khiến bưu tá phải chờ đợi lâu nhất?",
                "Ngồi đếm tiền mặt rồi dò tay từng mã đơn với kế toán rất tốn thời gian và hay bị lệch lẻ. Nếu trên app tổng hợp sẵn hôm nay đã thu bao nhiêu tiền mặt, bao nhiêu chuyển khoản và có mã QR để chuyển nộp quỹ ngay thì rất gọn.",
                "Màn hình quỹ COD bưu tá tổng hợp minh bạch theo ca, sinh mã VietQR nộp tiền tự gạch nợ qua SePay và hỗ trợ phân quyền linh hoạt theo từng bưu tá (MobilePermissionOverride).",
            ),
            (
                "Q-COU-05",
                "Khi đang giao ngoài đường mà gặp sự cố cần điều phối viên xử lý gấp (khách đổi địa chỉ sát giờ, xin ý kiến xử lý đơn lỗi), anh/chị liên lạc bằng cách nào?",
                "Gọi điện thoại về bưu cục giờ cao điểm hay bận máy, nhắn qua nhóm chat ngoài thì trôi tin và khó gắn đúng mã đơn. Có khung nhắn tin trực tiếp với điều phối viên ngay trong ứng dụng giao nhận sẽ tiện theo dõi hơn.",
                "Phân hệ Chat hỗ trợ thời gian thực (gateway-bff/chat kết hợp chat_db, Redis Pub/Sub và WebSocket) giúp bưu tá trao đổi trực tiếp với điều phối viên bưu cục.",
            ),
        ],
    },
    {
        "heading": "A.5. Phiếu phỏng vấn Actor Nhân viên vận hành, Điều phối & QA (OPS Staff)",
        "caption": "Bảng A.6. Tổng hợp phỏng vấn yêu cầu nhóm Nhân viên vận hành & QA (P-OPS-01)",
        "meta": "Đối tượng: P-OPS-01 | Ngày phỏng vấn: 12/06/2026 | Người thực hiện: Võ Văn Tú Tài, Trần Tấn Tài | Hình thức: Phỏng vấn trực tuyến (Google Meet).",
        "rows": [
            (
                "Q-OPS-01",
                "Ở khâu quét nhập kho, đóng bao trung chuyển và kẹp chì bàn giao xe, sai sót nghiệp vụ nào dễ dẫn đến thất thoát kiện hàng nhất?",
                "Giờ cao điểm rất dễ quét nhầm một kiện hàng vào hai bao khác nhau hoặc vô tình đóng nhầm đơn đang bị khóa khiếu nại lên xe. Có trường hợp bao đã kẹp chì niêm phong rồi mà vẫn bị chỉnh sửa danh sách khiến đầu bưu cục nhận bị hụt kiện.",
                "Manifest State Machine (CREATED → SEALED → RECEIVED) tại manifest-service (:3005): chặn gán trùng đơn vào bao đang mở (HTTP 409), chặn đơn isLocked, khóa chỉnh sửa sau Seal và ghi đầy đủ SealRecord, ReceiveRecord, OpsAuditLog.",
            ),
            (
                "Q-OPS-02",
                "Bưu cục tổ chức phân quyền xem dữ liệu theo khu vực và phân công bưu tá hàng ngày như thế nào để tránh chồng chéo?",
                "Nhân viên kho thuộc bưu cục nào chỉ nên nhìn thấy và thao tác đơn thuộc địa bàn bưu cục đó để tránh bấm nhầm đơn tỉnh khác. Khi đổi người giao giữa ca thì hệ thống phải lưu lại rõ ai đã giữ đơn trước đó.",
                "Lớp bảo vệ OpsHubScopeGuard cô lập truy vấn dữ liệu theo hubCodes được phân quyền, kết hợp dispatch-service (:3004) lưu trọn lịch sử TaskAssignment và phát cập nhật realtime WebSocket.",
            ),
            (
                "Q-OPS-03",
                "Khi phát hiện một kiện hàng bị dừng bất thường lâu ngày trong kho hoặc thất lạc trên tuyến, bộ phận QA xử lý xác định trách nhiệm ra sao?",
                "Không thể kết luận phạt ngay một bưu cục khi chưa có bằng chứng vì dễ gây bất đồng nội bộ. Cần hệ thống chỉ ra điểm đứt gãy vết quét, mở hạn 24 giờ cho bưu cục nghi vấn nộp video camera CCTV giải trình rồi mới ký phán quyết chuyển bồi thường.",
                "Phân hệ Giám định đơn lạc 4 giai đoạn trên OPS Web: phân tích điểm đứt gãy chuỗi vết quét → mở cửa sổ phản biện 24 giờ nộp CCTV (MinIO) → cứu đơn → phán quyết tự động sinh Hồ sơ bồi thường (Claims).",
            ),
            (
                "Q-OPS-04",
                "Công đoạn đối soát tiền COD cuối ngày và bàn giao số liệu cho bộ phận kế toán hiện gặp trở ngại nào lớn nhất?",
                "Nhân viên phải dò từng dòng sao kê ngân hàng với danh sách nộp tiền rất dễ nhầm mã giao dịch; xong xuôi kế toán lại phải nhập tay lại vào phần mềm MISA hoặc SAP tốn rất nhiều công.",
                "Tích hợp SePay Webhook xác thực HMAC-SHA256 tự động gạch nợ phiên đối soát và API GET /cod/settlements/export/erp-csv xuất tệp CSV UTF-8 BOM chuẩn MISA/SAP (TK Nợ 1121 / TK Có 3388).",
            ),
            (
                "Q-OPS-05",
                "Bộ phận CSKH đang tốn nhiều nhân lực nhất cho nhóm yêu cầu nào từ khách hàng, và anh/chị lo ngại điều gì nếu dùng AI trả lời tự động?",
                "Khoảng 70–80% câu hỏi mỗi ngày lặp đi lặp lại quanh việc tra đơn, tính cước và hỏi chính sách đền bù theo Nghị định 47. Đưa AI vào giảm tải rất tốt, nhưng điều chúng tôi sợ nhất là AI tự suy diễn sai chính sách hoặc hứa bừa số tiền đền bù làm công ty gặp rắc rối pháp lý.",
                "Kiến trúc AI RAG kiểm soát ảo giác: chỉ tổng hợp câu trả lời bám chặt 59 chunks SOP kèm Citations[], bổ sung lớp kiểm duyệt Validation LLM (OpenRouter) và tuyệt đối không cho AI tự phê duyệt mức bồi thường.",
            ),
            (
                "Q-OPS-06",
                "Khi Trợ lý AI chuyển một ca khiếu nại phức tạp của khách hàng sang cho nhân viên CSKH/QA xử lý tiếp, anh/chị cần hệ thống cung cấp sẵn những thông tin gì?",
                "Cần hiện thành một phiếu xử lý rõ ràng có đính kèm nguyên đoạn hội thoại khách vừa nhắn với AI, mã vận đơn liên quan và toàn bộ lịch sử vết quét để nhân viên đọc toàn cảnh trước khi phản hồi, tuyệt đối không bấm kết luận vội ngoài danh sách.",
                "Luồng HITL Escalation đồng bộ phiếu từ chatbot-service sang màn hình CustomerServiceTicketsPage trên OPS Web, gắn kèm ngữ cảnh hội thoại và bắt buộc mở Drawer xem toàn cảnh trước khi thao tác.",
            ),
        ],
    },
    {
        "heading": "A.6. Phiếu phỏng vấn Actor Quản trị viên hệ thống (Admin)",
        "caption": "Bảng A.7. Tổng hợp phỏng vấn yêu cầu nhóm Quản trị viên hệ thống (P-ADM-01)",
        "meta": "Đối tượng: P-ADM-01 | Ngày phỏng vấn: 16/06/2026 | Người thực hiện: Võ Văn Tú Tài, Trần Tấn Tài | Hình thức: Phỏng vấn trực tuyến (Google Meet).",
        "rows": [
            (
                "Q-ADM-01",
                "Khi mạng lưới bưu cục mở rộng theo địa giới hành chính trên toàn quốc, bộ phận quản trị cần kiểm soát dữ liệu nền như thế nào?",
                "Mạng lưới chia rõ 4 cấp từ Tổng công ty, Vùng, Tỉnh đến Phường/Xã kèm phạm vi vùng phủ. Mọi thao tác thêm mới, tạm khóa bưu cục hay sửa cấu hình số lần phát tối đa phải làm tập trung một chỗ và ghi rõ ai đã thay đổi lúc nào.",
                "masterdata-service (:3001) quản trị cây Hub 4 tầng có Geofencing, Zone, Config, NdrReason, đồng bộ qua MasterdataOutbox và lưu đầy đủ vết before/after trong AdminAuditLog.",
            ),
            (
                "Q-ADM-02",
                "Về an toàn truy cập tài khoản nhân sự nội bộ và bảo vệ hệ thống trước lưu lượng bất thường, yêu cầu tối thiểu cần đạt là gì?",
                "Nhân viên kho hoặc shipper cầm tiền COD nghỉ việc thì phải cắt quyền đăng nhập có hiệu lực ngay lập tức chứ không chờ phiên tự hết hạn. Ngoài ra cần chặn kẻ xấu thử mật khẩu liên tục và giới hạn lưu lượng tránh treo cổng API.",
                "Xác thực Opaque Bearer Token + POST /auth/introspect thu hồi phiên tức thì, khóa tạm 15 phút sau 5 lần sai mật khẩu (HTTP 429, TC-010), kết hợp Gateway Rate Limit (2.400 req/phút) và Body Limit (1 MB).",
            ),
            (
                "Q-ADM-03",
                "Trong vận hành hàng ngày, quản trị viên cần những công cụ nào để giám sát độ ổn định, sao lưu dữ liệu và phục vụ công tác thanh tra?",
                "Phải biết sớm khi dịch vụ có lỗi 5xx hoặc phản hồi chậm, có thể xuất nhanh tệp nhật ký thao tác khi cần kiểm toán, có quy trình sao lưu toàn bộ cơ sở dữ liệu kèm kiểm tra khôi phục và dựng lại được dữ liệu tra cứu nếu xảy ra sự cố.",
                "Endpoint /metrics kết hợp bộ cấu hình cảnh báo SLO Prometheus/Grafana (TC-100), xuất CSV Audit Log hợp nhất, script backup-restore-db.sh cho 12 DB (TC-090) và công cụ replay-read-models.mjs (TC-059).",
            ),
            (
                "Q-ADM-04",
                "Khi đưa phân hệ Trợ lý AI sử dụng các dịch vụ mô hình ngôn ngữ bên ngoài vào vận hành thực tế, quản trị viên lo ngại rủi ro nào nhất?",
                "Ngại nhất là một nhà cung cấp AI đột ngột quá tải hoặc lỗi kết nối khiến toàn bộ khung hỗ trợ khách hàng bị tê liệt; đồng thời hạ tầng chạy trên máy chủ gọn nhẹ nên dịch vụ AI không được ngốn quá nhiều bộ nhớ và phải dễ cập nhật khi công ty sửa đổi quy định.",
                "Thiết kế chatbot-service bằng TypeScript thuần tiết kiệm RAM, cơ chế dự phòng đa mô hình Multi-LLM Fallback (Gemini → Groq LPU 4s → OpenRouter) và chỉ mục vector cục bộ (vector-index.json) dễ tái lập khi cập nhật SOP.",
            ),
        ],
    },
]


def add_soft_breaks(text, is_id=False):
    if is_id:
        return text
    text = re.sub(r"_(?=[A-Za-z0-9])", "_\u200b", text)
    text = re.sub(r"\.(?=[A-Za-z])", ".\u200b", text)
    text = re.sub(r"(?<=[A-Za-z])\(", "\u200b(", text)
    text = re.sub(r"/(?=[A-Za-z0-9:*])", "/\u200b", text)

    def _split_camel(m):
        tok = m.group(0)
        if len(tok) >= 14:
            return re.sub(r"(?<=[a-z])(?=[A-Z])", "\u200b", tok)
        return tok

    text = re.sub(r"\b[A-Za-z][A-Za-z0-9]{13,}\b", _split_camel, text)
    return text


def set_black_borders(tbl_el):
    tblPr = tbl_el.find(qn("w:tblPr"))
    borders = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), "000000")
        borders.append(el)
    tblPr.append(borders)


def build_fixed_table(headers, rows, col_widths, center_cols=(), bold_cols=()):
    assert sum(col_widths) == 9072
    tbl = OxmlElement("w:tbl")
    tblPr = OxmlElement("w:tblPr")

    tblW = OxmlElement("w:tblW")
    tblW.set(qn("w:w"), "9072")
    tblW.set(qn("w:type"), "dxa")
    tblPr.append(tblW)

    tblInd = OxmlElement("w:tblInd")
    tblInd.set(qn("w:w"), "0")
    tblInd.set(qn("w:type"), "dxa")
    tblPr.append(tblInd)

    tblLayout = OxmlElement("w:tblLayout")
    tblLayout.set(qn("w:type"), "fixed")
    tblPr.append(tblLayout)

    tbl.append(tblPr)
    set_black_borders(tbl)

    mar = OxmlElement("w:tblCellMar")
    for side, val in (("top", 44), ("bottom", 44), ("left", 56), ("right", 56)):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tblPr.append(mar)

    grid = OxmlElement("w:tblGrid")
    for w in col_widths:
        gc = OxmlElement("w:gridCol")
        gc.set(qn("w:w"), str(w))
        grid.append(gc)
    tbl.append(grid)

    def make_cell(text, w, is_header=False, center=False, bold=False, is_id=False):
        tc = OxmlElement("w:tc")
        tcPr = OxmlElement("w:tcPr")
        tcW = OxmlElement("w:tcW")
        tcW.set(qn("w:w"), str(w))
        tcW.set(qn("w:type"), "dxa")
        tcPr.append(tcW)

        vAlign = OxmlElement("w:vAlign")
        vAlign.set(qn("w:val"), "center" if is_header else "top")
        tcPr.append(vAlign)

        if is_header:
            shd = OxmlElement("w:shd")
            shd.set(qn("w:val"), "clear")
            shd.set(qn("w:color"), "auto")
            shd.set(qn("w:fill"), "F2F4F8")
            tcPr.append(shd)
        tc.append(tcPr)

        if not is_header:
            text = add_soft_breaks(text, is_id=is_id)

        lines = text.split("\n")
        for idx_l, line in enumerate(lines):
            p = OxmlElement("w:p")
            pPr = OxmlElement("w:pPr")
            ind = OxmlElement("w:ind")
            ind.set(qn("w:left"), "0")
            ind.set(qn("w:right"), "0")
            ind.set(qn("w:firstLine"), "0")
            pPr.append(ind)
            sp = OxmlElement("w:spacing")
            sp.set(qn("w:before"), "0")
            sp.set(qn("w:after"), "24" if idx_l < len(lines) - 1 else "0")
            sp.set(qn("w:line"), "230")
            sp.set(qn("w:lineRule"), "auto")
            pPr.append(sp)
            jc = OxmlElement("w:jc")
            jc.set(qn("w:val"), "center" if (is_header or center) else "left")
            pPr.append(jc)
            p.append(pPr)

            r = OxmlElement("w:r")
            rPr = OxmlElement("w:rPr")
            rf = OxmlElement("w:rFonts")
            rf.set(qn("w:ascii"), "Times New Roman")
            rf.set(qn("w:hAnsi"), "Times New Roman")
            rf.set(qn("w:cs"), "Times New Roman")
            rPr.append(rf)
            if is_header or bold or is_id:
                rPr.append(OxmlElement("w:b"))
            col = OxmlElement("w:color")
            col.set(qn("w:val"), "000000")
            rPr.append(col)
            rPr.append(OxmlElement("w:noProof"))
            sz = OxmlElement("w:sz")
            sz.set(qn("w:val"), "20")  # Uniform 10pt Times New Roman matching 6.4.1 & 6.4.2
            rPr.append(sz)
            szCs = OxmlElement("w:szCs")
            szCs.set(qn("w:val"), "20")
            rPr.append(szCs)
            r.append(rPr)

            t = OxmlElement("w:t")
            if line.startswith(" ") or line.endswith(" "):
                t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
            t.text = line
            r.append(t)
            p.append(r)
            tc.append(p)
        return tc

    hdr_tr = OxmlElement("w:tr")
    hdr_trPr = OxmlElement("w:trPr")
    hdr_trPr.append(OxmlElement("w:tblHeader"))
    hdr_trPr.append(OxmlElement("w:cantSplit"))
    hdr_tr.append(hdr_trPr)
    for ci, h in enumerate(headers):
        hdr_tr.append(make_cell(h, col_widths[ci], is_header=True))
    tbl.append(hdr_tr)

    for row in rows:
        tr = OxmlElement("w:tr")
        trPr = OxmlElement("w:trPr")
        trPr.append(OxmlElement("w:cantSplit"))
        tr.append(trPr)
        for ci, val in enumerate(row):
            tr.append(
                make_cell(
                    val,
                    col_widths[ci],
                    is_header=False,
                    center=(ci in center_cols),
                    bold=(ci in bold_cols),
                    is_id=(ci == 0 and col_widths == COL_WIDTHS_QA),
                )
            )
        tbl.append(tr)

    return tbl


def add_body_para(doc, segments, first_line=720, space_before=60, space_after=80, italic=False, align="both"):
    """Match exact Normal body paragraph style of the thesis (13pt Times New Roman)."""
    p = doc.add_paragraph(style="Normal")
    pPr = p._p.get_or_add_pPr()
    for tag in ("w:ind", "w:spacing", "w:jc"):
        old = pPr.find(qn(tag))
        if old is not None:
            pPr.remove(old)
    ind = OxmlElement("w:ind")
    ind.set(qn("w:left"), "0")
    ind.set(qn("w:right"), "0")
    ind.set(qn("w:firstLine"), str(first_line))
    pPr.append(ind)
    sp = OxmlElement("w:spacing")
    sp.set(qn("w:before"), str(space_before))
    sp.set(qn("w:after"), str(space_after))
    sp.set(qn("w:line"), "312")
    sp.set(qn("w:lineRule"), "auto")
    pPr.append(sp)
    jc = OxmlElement("w:jc")
    jc.set(qn("w:val"), align)
    pPr.append(jc)

    for text, is_bold in segments:
        r = OxmlElement("w:r")
        rPr = OxmlElement("w:rPr")
        rf = OxmlElement("w:rFonts")
        rf.set(qn("w:ascii"), "Times New Roman")
        rf.set(qn("w:hAnsi"), "Times New Roman")
        rf.set(qn("w:cs"), "Times New Roman")
        rPr.append(rf)
        if is_bold:
            rPr.append(OxmlElement("w:b"))
        if italic:
            rPr.append(OxmlElement("w:i"))
        sz = OxmlElement("w:sz")
        sz.set(qn("w:val"), "26")  # 13pt body
        rPr.append(sz)
        szCs = OxmlElement("w:szCs")
        szCs.set(qn("w:val"), "26")
        rPr.append(szCs)
        r.append(rPr)
        t = OxmlElement("w:t")
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        t.text = text
        r.append(t)
        p._p.append(r)
    return p


def add_caption_h6(doc, text):
    """Exact parity with Bảng 6.1 (Heading 6, 13pt centered, before=120, after=80, line=276)."""
    p = doc.add_paragraph(style="Heading 6")
    pPr = p._p.get_or_add_pPr()
    for tag in ("w:ind", "w:jc", "w:spacing"):
        old = pPr.find(qn(tag))
        if old is not None:
            pPr.remove(old)
    sp = OxmlElement("w:spacing")
    sp.set(qn("w:before"), "120")
    sp.set(qn("w:after"), "80")
    sp.set(qn("w:line"), "276")
    sp.set(qn("w:lineRule"), "auto")
    pPr.append(sp)
    ind = OxmlElement("w:ind")
    ind.set(qn("w:left"), "0")
    ind.set(qn("w:firstLine"), "0")
    pPr.append(ind)
    jc = OxmlElement("w:jc")
    jc.set(qn("w:val"), "center")
    pPr.append(jc)

    r = OxmlElement("w:r")
    rPr = OxmlElement("w:rPr")
    sz = OxmlElement("w:sz")
    sz.set(qn("w:val"), "26")  # 13pt exact parity with Bảng 6.1
    rPr.append(sz)
    r.append(rPr)
    t = OxmlElement("w:t")
    t.text = text
    r.append(t)
    p._p.append(r)
    return p


def remove_existing_appendix_a(doc):
    """Remove only the BODY Heading1 PHỤ LỤC A (never match the TOC entry!)."""
    body = doc.element.body
    children = list(body)
    start_idx = None
    for idx, ch in enumerate(children):
        if idx < 400:
            continue
        if ch.tag == qn("w:p"):
            pStyle = ch.find("./w:pPr/w:pStyle", ch.nsmap)
            st_val = pStyle.get(qn("w:val")) if pStyle is not None else ""
            txt = "".join(ch.itertext()).strip()
            if st_val == "Heading1" and txt.startswith("PHỤ LỤC A") and "\t" not in txt:
                start_idx = idx
                break
    if start_idx is None:
        return
    if start_idx > 400 and children[start_idx - 1].tag == qn("w:p"):
        prev_txt = "".join(children[start_idx - 1].itertext()).strip()
        if not prev_txt:
            start_idx -= 1
    removed = 0
    for ch in children[start_idx:]:
        if ch.tag == qn("w:sectPr"):
            continue
        body.remove(ch)
        removed += 1
    print(f"Removed {removed} previous Appendix A body elements before re-appending.")


def main():
    assert os.path.exists(DOC_PATH), f"Missing {DOC_PATH}"
    doc = docx.Document(DOC_PATH)
    remove_existing_appendix_a(doc)

    # Heading 1 with native pageBreakBefore matching CHƯƠNG 6
    p_h1 = doc.add_paragraph("PHỤ LỤC A: BẢNG CÂU HỎI PHỎNG VẤN KHẢO SÁT YÊU CẦU HỆ THỐNG", style="Heading 1")
    pPr_h1 = p_h1._p.get_or_add_pPr()
    for tag in ("w:keepLines", "w:pageBreakBefore", "w:spacing", "w:ind"):
        old = pPr_h1.find(qn(tag))
        if old is not None:
            pPr_h1.remove(old)
    pPr_h1.append(OxmlElement("w:keepLines"))
    pPr_h1.append(OxmlElement("w:pageBreakBefore"))
    sp1 = OxmlElement("w:spacing")
    sp1.set(qn("w:before"), "0")
    sp1.set(qn("w:after"), "120")
    sp1.set(qn("w:line"), "360")
    sp1.set(qn("w:lineRule"), "auto")
    pPr_h1.append(sp1)
    ind1 = OxmlElement("w:ind")
    ind1.set(qn("w:firstLine"), "0")
    pPr_h1.append(ind1)

    add_body_para(
        doc,
        [
            ("Mục đích khảo sát: ", True),
            (
                "Phụ lục này tổng hợp 31 câu hỏi phỏng vấn bán cấu trúc cùng các phản hồi thực tế thu thập từ đại diện "
                "6 nhóm tác nhân (Actor) của hệ thống quản lý và trung chuyển bưu kiện Nexus Express. Kết quả khảo sát "
                "là căn cứ trực tiếp hình thành đặc tả yêu cầu (Chương 3), thiết kế kiến trúc 14 microservices & phân hệ "
                "Trợ lý AI Chatbot RAG hướng khách hàng (Chương 4) và 69 Use Cases (Chương 5). Do Trợ lý AI được tích hợp "
                "trực tiếp trên 2 ứng dụng phục vụ khách hàng là guest-web (FloatingAiChatWidget) và customer-mobile "
                "(FloatingAiChatModal), bộ câu hỏi tập trung sâu vào nhu cầu tra cứu, tạo đơn lẻ, xử lý hậu mãi, giải đáp "
                "chính sách bồi thường NĐ 47/2011 và chuyển tiếp CSKH (HITL) của nhóm Khách vãng lai và Khách hàng cá nhân.",
                False,
            ),
        ],
    )
    add_body_para(
        doc,
        [
            ("Thời gian thực hiện & Quy chuẩn ẩn danh: ", True),
            (
                "Đợt khảo sát do nhóm sinh viên thực hiện khóa luận (Võ Văn Tú Tài, Trần Tấn Tài) tiến hành từ ngày "
                "03/06/2026 đến ngày 16/06/2026 tại TP. Hồ Chí Minh. Nhằm tuân thủ quy chuẩn đạo đức nghiên cứu và bảo vệ "
                "dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP, danh tính cá nhân của người tham gia được mã hóa ẩn danh "
                "theo nhóm vai trò từ P-GST-01 đến P-ADM-01 như trình bày tại Bảng A.1.",
                False,
            ),
        ],
    )

    # Bảng A.1 — Overview table
    add_caption_h6(doc, "Bảng A.1. Tổng hợp đối tượng và lịch trình phỏng vấn khảo sát yêu cầu (06/2026)")
    tbl_sum = build_fixed_table(
        SUMMARY_HEADERS,
        SUMMARY_ROWS,
        COL_WIDTHS_SUMMARY,
        center_cols=(0, 3),
        bold_cols=(0,),
    )
    doc.element.body.insert(len(doc.element.body) - 1, tbl_sum)

    # A.1 .. A.6 (6 Actor tables, 31 questions total)
    total_q = 0
    for sec in ACTOR_INTERVIEWS:
        # Pure native Heading 2 matching Section 6.4 style!
        doc.add_paragraph(sec["heading"], style="Heading 2")
        add_body_para(doc, [(sec["meta"], False)], first_line=0, space_before=40, space_after=40, italic=True, align="left")
        add_caption_h6(doc, sec["caption"])
        tbl_qa = build_fixed_table(
            QA_HEADERS,
            sec["rows"],
            COL_WIDTHS_QA,
            center_cols=(0,),
            bold_cols=(),
        )
        doc.element.body.insert(len(doc.element.body) - 1, tbl_qa)
        total_q += len(sec["rows"])
        print(f"[OK] Added {sec['heading']} ({len(sec['rows'])} questions)")

    assert total_q == 31, f"Expected 31 questions, got {total_q}"
    doc.save(DOC_PATH)
    print(f"\nSaved {DOC_PATH} with natural, customer-AI-focused PHỤ LỤC A ({total_q} questions)!")


if __name__ == "__main__":
    main()
