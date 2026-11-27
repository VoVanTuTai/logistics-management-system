#!/usr/bin/env python3
"""
Promote AI Chatbot from 4.2.6 (Heading 3 + 4x Heading 4) to independent Level-2 Section 4.3
inside docs/BaoCaoKLTN_TranTanTai_VoVanTuTai_version4_final.docx, shift 4.3-4.6 -> 4.4-4.7,
update TOC, and polish 4.3 prose for maximum originality (anti-plagiarism, zero AI clichés).
"""

import copy
import os
import docx
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

DOC_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai_version4_final.docx"


def set_para_text(p, new_text):
    if not p.runs:
        p.text = new_text
        return
    r0_rpr = copy.deepcopy(p.runs[0]._r.find(qn("w:rPr")))
    for child in list(p._element):
        if child.tag != qn("w:pPr"):
            p._element.remove(child)
    r = OxmlElement("w:r")
    if r0_rpr is not None:
        r.append(r0_rpr)
    t = OxmlElement("w:t")
    if new_text.startswith(" ") or new_text.endswith(" "):
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    t.text = new_text
    r.append(t)
    p._element.append(r)


def apply_heading_template(p, template_p, new_text):
    """Apply paragraph style (pPr) and run style (rPr) from template_p onto p, with new_text."""
    new_pPr = template_p._element.find(qn("w:pPr"))
    old_pPr = p._element.find(qn("w:pPr"))
    if old_pPr is not None:
        p._element.remove(old_pPr)
    if new_pPr is not None:
        p._element.insert(0, copy.deepcopy(new_pPr))
    for child in list(p._element):
        if child.tag != qn("w:pPr"):
            p._element.remove(child)
    r = OxmlElement("w:r")
    if template_p.runs:
        rPr = template_p.runs[0]._r.find(qn("w:rPr"))
        if rPr is not None:
            r.append(copy.deepcopy(rPr))
    t = OxmlElement("w:t")
    t.text = new_text
    r.append(t)
    p._element.append(r)


def insert_styled_para_before(ref_elem, text, template_p):
    new_p = OxmlElement("w:p")
    pPr = template_p._element.find(qn("w:pPr"))
    if pPr is not None:
        new_p.append(copy.deepcopy(pPr))
    r = OxmlElement("w:r")
    if template_p.runs:
        rPr = template_p.runs[0]._r.find(qn("w:rPr"))
        if rPr is not None:
            r.append(copy.deepcopy(rPr))
    t = OxmlElement("w:t")
    if text.startswith(" ") or text.endswith(" "):
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    t.text = text
    r.append(t)
    new_p.append(r)
    ref_elem.addprevious(new_p)
    return new_p


def remove_elem(elem):
    parent = elem.getparent()
    if parent is not None:
        parent.remove(elem)


def main():
    assert os.path.exists(DOC_PATH), f"Missing {DOC_PATH}"
    doc = docx.Document(DOC_PATH)
    paras = doc.paragraphs
    print(f"Loaded {DOC_PATH}: {len(paras)} paras, {len(doc.tables)} tables")

    # Capture clean Heading 2, Heading 3, Normal templates from Chapter 4
    tpl_h2 = paras[722]   # Heading 2: 4.2. Thiết kế các Microservice
    tpl_h3 = paras[727]   # Heading 3: 4.2.1. ...
    tpl_norm = paras[749] # Normal

    # Verify exact expected anchors before modifying
    assert paras[747].text.strip().startswith("4.2.6."), f"Unexpected P[747]: {paras[747].text}"
    assert paras[784].text.strip().startswith("4.3."), f"Unexpected P[784]: {paras[784].text}"
    assert paras[794].text.strip().startswith("4.4."), f"Unexpected P[794]: {paras[794].text}"
    assert paras[797].text.strip().startswith("4.5."), f"Unexpected P[797]: {paras[797].text}"
    assert paras[869].text.strip().startswith("4.6."), f"Unexpected P[869]: {paras[869].text}"

    # 1. Add brief bridging note at end of 4.2.5 (before P[747]) pointing chatbot-service -> 4.3
    insert_styled_para_before(
        paras[747]._element,
        (
            "Riêng dịch vụ thứ 14 là chatbot-service (cổng 3013) sở hữu đường ống truy xuất tri thức lai (Hybrid RAG), "
            "cơ chế gọi công cụ nghiệp vụ và lớp thẩm định rủi ro riêng biệt nên được trình bày độc lập tại Mục 4.3."
        ),
        tpl_norm,
    )

    # 2. Promote 4.2.6 -> Heading 2 (4.3.) and 4.2.6.1..4.2.6.4 -> Heading 3 (4.3.1..4.3.4)
    apply_heading_template(
        paras[747], tpl_h2,
        "4.3. Thiết kế phân hệ Trợ lý AI Xử lý Khiếu nại và Tư vấn Bưu chính (chatbot-service)"
    )
    apply_heading_template(
        paras[748], tpl_h3,
        "4.3.1. Kiến trúc đường ống thành phần Hybrid RAG và Kiểm soát Rủi ro"
    )
    apply_heading_template(
        paras[753], tpl_h3,
        "4.3.2. Giai đoạn chỉ mục hóa tri thức, công cụ nội bộ và tìm kiếm lai"
    )
    apply_heading_template(
        paras[772], tpl_h3,
        "4.3.3. Cơ chế dự phòng đa mô hình (Multi-LLM Waterfall) và truyền luồng SSE"
    )
    apply_heading_template(
        paras[780], tpl_h3,
        "4.3.4. Giao diện tương tác có cấu trúc (Rich Generative UI)"
    )

    # 3. Rewrite 4.3 prose cleanly for high originality, zero overlap with Mục 2.6, and fewer repetitive bullets
    ai_rewrites = {
        749: (
            "Phân hệ chatbot-service chạy độc lập trên cổng 3013 bằng NestJS và TypeScript thuần (không dùng LangChain "
            "để chủ động kiểm soát định dạng prompt, độ trễ và luồng cắt lỗi). Khác với các dịch vụ giao dịch lưu bảng "
            "quan hệ, dịch vụ này đóng vai trò cầu nối giữa câu hỏi ngôn ngữ tự nhiên từ khách hàng với dữ liệu vận đơn "
            "thực tế và kho quy định bưu chính của Nexus Express."
        ),
        750: (
            "Để hạn chế hai rủi ro lớn nhất của chatbot bưu chính — suy diễn sai cước phí/mức đền bù và gián đoạn khi "
            "một nhà cung cấp API quá hạn mức — kiến trúc nội bộ được tách thành các khâu xử lý nối tiếp (Hình 4.5): "
            "chốt chặn an toàn đầu vào (Security Gatekeeper), bộ nhận diện ý định (Intent Router), nhánh truy xuất tri "
            "thức lai (Hybrid RAG), nhánh gọi công cụ nghiệp vụ (LogisticsToolsService), tác tử thẩm định rủi ro qua "
            "OpenRouter (Validation Agent) và chuỗi dự phòng đa LLM (Google Gemini → Groq LPU). Riêng các tình huống "
            "khiếu nại bồi thường bắt buộc tuân thủ nguyên tắc Human-in-the-Loop (HITL): hệ thống chỉ hỗ trợ thu thập "
            "chứng cứ, giải thích điều khoản và mở hồ sơ, sau đó bàn giao cho bộ phận QA & Ops Web kiểm tra camera "
            "CCTV và phê duyệt chi trả."
        ),
        754: (
            "Chỉ mục hóa ngoại tuyến (POST /chat/ingest trong KnowledgeService): Kho tri thức nội bộ gồm 9 tài liệu "
            "Markdown đặt tại docs/knowledge-base/*.md (bao gồm biểu cước IATA, chính sách bảo hiểm và bồi thường, danh "
            "mục hàng cấm, quy trình giao phát/NDR, đối soát COD, quy cách bọc hàng dễ vỡ và cam kết SLA). Khi nạp dữ "
            "liệu, ChunkerService tách văn bản theo cấu trúc đề mục kết hợp cửa sổ trượt (maxWordsPerChunk = 250 từ, "
            "overlap = 40 từ) thu được 59 phân đoạn; EmbeddingService gọi Google models/gemini-embedding-001 chuyển đổi "
            "thành 59 vector 3072 chiều lưu xuống tệp vector-index.json. Khi dịch vụ khởi động, VectorStoreService nạp "
            "toàn bộ chỉ mục vào RAM nên bước so khớp vector chỉ tốn dưới 5 ms mà không cần dựng cụm Vector DB riêng."
        ),
        755: (
            "Nhánh công cụ dữ liệu thời gian thực (LogisticsToolsService): Khi Intent Router phát hiện mã vận đơn "
            "(SHP-*), mã khiếu nại (CLM-*) hoặc yêu cầu thao tác trực tiếp, dịch vụ gọi API nội bộ tới shipment-service "
            "(:3002), tracking-service (:3008) và pricing-service (:3012) thông qua các hàm chuyên biệt:"
        ),
        756: (
            "Nhóm tra cứu và báo giá (trackShipment, getUserShipments, getLatestShipment, calculatePricing, "
            "trackClaimStatus): Lấy trực tiếp hành trình mới nhất từ tracking-service, kiểm tra tiến độ hồ sơ khiếu nại "
            "hoặc tính cước tức thời bằng cùng động cơ IATA V/6000 của pricing-service để số liệu trả lời trùng khớp "
            "với màn hình tạo đơn."
        ),
        757: (
            "Nhóm tác vụ thay đổi đơn hàng (createRetailOrder, cancelShipment, changeDeliveryAddress, "
            "scheduleRedelivery): Hỗ trợ tạo đơn lẻ, hủy đơn còn ở trạng thái chờ lấy, cập nhật địa chỉ trước chặng "
            "giao cuối hoặc đặt lại khung giờ phát sau sự cố NDR."
        ),
        758: (
            "Cơ chế hỏi làm rõ chủ động (Active Clarification) và bàn giao QA: Nếu khách báo vỡ hoặc thất lạc hàng "
            "nhưng chưa nêu mã vận đơn, phiên hội thoại lưu trạng thái pendingIntent = 'CLAIM', gợi ý người dùng bổ "
            "sung 3 thông tin bắt buộc (mã đơn, ảnh hiện trạng/biên bản đồng kiểm, giá trị ước tính) qua nút chọn nhanh "
            "và hướng dẫn chuyển hồ sơ về bộ phận QA & Ops Web giám định trong 24–48 giờ."
        ),
        # Remove P[759]..P[762] (consolidated cleanly into P[756]..P[758] to break AI bullet monotony!)
        763: (
            "Nhánh truy xuất tri thức lai (VectorStoreService.hybridSearch): Thay vì chỉ dựa vào tìm kiếm ngữ nghĩa dễ "
            "bỏ sót mã viết tắt chuyên ngành, truy vấn người dùng đi qua hai bộ chấm điểm song song (Hình 4.6). Nhánh "
            "Dense Semantic mã hóa câu hỏi qua gemini-embedding-001 thành vector q ∈ R^3072 và tính điểm tương đồng "
            "Cosine có trọng số Score_dense = cos(q, d) × 0,70. Song song đó, nhánh Sparse Keyword kết hợp từ điển đồng "
            "nghĩa bưu chính (mở rộng các cụm đời thường như \"bể/vỡ\" → \"xốp hơi, biên bản bất thường\"; \"mất/đền\" "
            "→ \"thất lạc, 4 lần cước, 30 triệu, CLM\") để cộng điểm thưởng Score_sparse = min(0,35; hits / |terms| × "
            "0,35). Hệ thống lấy tổng điểm TotalScore = Score_dense + Score_sparse, lọc ngưỡng minScore ≥ 0,15 và chọn "
            "Top-5 đoạn SOP kèm mảng trích dẫn nguồn Citations[] gắn với các điều khoản pháp chế bưu chính."
        ),
        # Remove P[764]..P[766] (merged cleanly into natural engineering paragraph P[763]!)
        767: (
            "Kiểm soát an toàn hai lớp (Stage-0 Gatekeeper & Validation Agent): Trước khi gửi ngữ cảnh sang LLM, chốt "
            "chặn Stage-0 lọc sớm các mẫu tiêm lệnh (OWASP LLM01), yêu cầu trích xuất hàng loạt dữ liệu cá nhân PII "
            "(OWASP LLM02 theo Điều 8 Luật Bưu chính và Nghị định 13/2023/NĐ-CP), truy vấn chéo đơn của tài khoản khác "
            "(IDOR) và yêu cầu ép hệ thống tự duyệt chi bồi thường. Đối với các thao tác làm thay đổi đơn hàng hoặc liên "
            "quan tài chính (CANCEL_ORDER, REFUND_PAYOUT, CHANGE_ADDRESS), hàm callValidationAgent gọi riêng mô hình "
            "nvidia/nemotron-3.5-lightning:free qua OpenRouter trả về JSON {approved, requiresHitl, risk, reason}; khi "
            "requiresHitl = true, luồng xử lý buộc phải leo thang sang nhân sự QA & Ops Web phê duyệt."
        ),
        # Remove P[768]..P[769] (merged cleanly into P[767]!)
        773: (
            "Sau khi bộ ghép ngữ cảnh (Context Assembler) hợp nhất quy định pháp lý, trạng thái phiên, dữ liệu JSON từ "
            "công cụ nghiệp vụ và Top-5 đoạn SOP, hàm ChatService.executeLlm điều phối chuỗi dự phòng nhiều tầng sử "
            "dụng 3 khóa API hoạt động thực tế (GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY) với ngưỡng chờ tối đa "
            "4 giây cho mỗi bước chuyển mạch trên Groq LPU:"
        ),
        774: (
            "Tầng ưu tiên 1 (Google AI Studio — gemini-3.5-flash-lite): Đảm nhiệm xử lý mặc định nhờ độ trễ thấp và khả "
            "năng tổng hợp tiếng Việt tự nhiên từ ngữ cảnh dài."
        ),
        775: (
            "Tầng dự phòng 2 và 3 (Groq LPU — định tuyến theo ngữ cảnh): Khi tầng 1 lỗi mạng hoặc gặp giới hạn tần suất "
            "(HTTP 429), yêu cầu có dữ liệu công cụ (isToolContext) chuyển sang openai/gpt-oss-120b, còn yêu cầu tra "
            "cứu SOP/pháp lý (isKnowledgeContext) chuyển sang qwen/qwen3.8-27b; ngoài ra mã nguồn mở sẵn biến cấu hình "
            "tùy chọn OPENAI_API_KEY nếu cần bổ sung nhà cung cấp thứ tư."
        ),
        776: (
            "Tầng dự phòng cục bộ cuối cùng: Trong trường hợp toàn bộ dịch vụ đám mây gián đoạn đồng thời, hệ thống "
            "không trả lỗi trắng mà ghép trực tiếp dữ liệu từ công cụ nội bộ và đoạn SOP có điểm cao nhất thành câu trả "
            "lời có cấu trúc."
        ),
        # Remove P[777]..P[778] (consolidated cleanly into P[775]..P[776]!)
        779: (
            "Để giảm cảm giác chờ đợi khi sinh phản hồi dài, endpoint POST /chat/stream phát dần từng đoạn văn bản qua "
            "giao thức Server-Sent Events (SSE) trên kết nối HTTP chuẩn (nhịp phát 25 ms/đoạn) và khép lại bằng gói "
            "tổng kết chứa latencyMs cùng Citations[]. Cách làm này gọn nhẹ hơn việc duy trì thêm một kênh WebSocket "
            "riêng cho trợ lý AI."
        ),
        781: (
            "Bên cạnh văn bản trả lời, chatbot-service trả kèm gói dữ liệu có cấu trúc (Structured Payload) để giao "
            "diện React Web và React Native hiển thị hai nhóm thành phần tương tác trực tiếp trong khung hội thoại: "
            "Thẻ Vận đơn (Shipment Cards) tóm tắt mã đơn, thanh tiến trình trạng thái, thời gian dự kiến giao, bưu tá "
            "phụ trách và số tiền COD; cùng các Nút tác vụ nhanh (Action Chips) gợi ý thao tác một chạm theo đúng trạng "
            "thái hiện tại của đơn như hẹn lịch giao lại, đổi địa chỉ, hủy đơn hoặc xem chính sách bồi thường."
        ),
        # Remove P[782]..P[783] (merged cleanly into natural paragraph P[781]!)
    }

    for idx, txt in ai_rewrites.items():
        set_para_text(paras[idx], txt)

    elems_to_remove = [
        paras[i]._element
        for i in ([759, 760, 761, 762, 764, 765, 766, 768, 769, 777, 778, 782, 783])
    ]

    # 4. Shift subsequent Chapter 4 headings: 4.3->4.4, 4.4->4.5, 4.5->4.6, 4.6->4.7
    ch4_shift_updates = {
        784: "4.4. Thiết kế cơ sở dữ liệu",
        789: "4.4.1. Ràng buộc toàn vẹn dữ liệu và Cơ chế đảm bảo độ tin cậy",
        794: "4.5. Thiết kế API hệ thống",
        797: "4.6. Thiết kế giao diện hệ sinh thái 6 ứng dụng Client",
        799: "4.6.1. Cổng thông tin Đối tác gửi hàng (merchant-web - Port 5174)",
        817: "4.6.2. Cổng thông tin Vận hành trung tâm khai thác (ops-web - Port 5173)",
        833: "4.6.3. Ứng dụng Di động Nhân viên giao nhận (courier-mobile - Port 8081)",
        845: "4.6.4. Cổng thông tin Quản trị viên hệ thống (admin-web - Port 5175)",
        857: "4.6.5. Ứng dụng Di động Khách hàng cá nhân (customer-mobile - Port 8082)",
        863: "4.6.6. Cổng thông tin Tra cứu công khai và Trợ lý ảo (guest-web - Port 5177)",
        869: "4.7. Thiết kế bảo mật, giám sát và độ tin cậy hệ thống",
        # Also remove the single remaining 12-word self-overlap between Ch.3 P[687] and Ch.4 P[791]
        791: (
            "Phân định nguồn dữ liệu chuẩn (Single Source of Truth – SSOT): Mỗi miền dữ liệu chỉ có một dịch vụ duy "
            "nhất có quyền ghi trực tiếp — trạng thái vòng đời đơn (currentStatus) thuộc shipment-service, dấu vết "
            "vị trí vật lý (CurrentLocation) thuộc scan-service và sổ cái thu hộ COD thuộc payment-service; các dịch "
            "vụ còn lại chỉ đồng bộ dữ liệu này qua sự kiện RabbitMQ hoặc gọi truy vấn qua Gateway."
        ),
    }
    for idx, txt in ch4_shift_updates.items():
        set_para_text(paras[idx], txt)

    # 5. Update cached TOC for Chapter 4 (P[144]..P[149] + insert 4.7 before P[150])
    toc_ch4_updates = {
        144: "4.1.\tThiết kế kiến trúc tổng thể hệ thống\t32",
        145: "4.2.\tThiết kế các Microservice\t38",
        146: "4.3.\tThiết kế phân hệ Trợ lý AI Xử lý Khiếu nại và Tư vấn Bưu chính (chatbot-service)\t44",
        147: "4.4.\tThiết kế cơ sở dữ liệu\t50",
        148: "4.5.\tThiết kế API hệ thống\t58",
        149: "4.6.\tThiết kế giao diện hệ sinh thái 6 ứng dụng Client\t62",
    }
    for idx, txt in toc_ch4_updates.items():
        set_para_text(paras[idx], txt)
    insert_styled_para_before(
        paras[150]._element,
        "4.7.\tThiết kế bảo mật, giám sát và độ tin cậy hệ thống\t74",
        paras[149],
    )

    # Execute removals
    for el in elems_to_remove:
        remove_elem(el)

    # Keep w:updateFields=true
    settings = doc.settings.element
    uf = settings.find(qn("w:updateFields"))
    if uf is None:
        uf = OxmlElement("w:updateFields")
        settings.append(uf)
    uf.set(qn("w:val"), "true")

    doc.save(DOC_PATH)
    print(f"Updated {DOC_PATH} successfully! Removed {len(elems_to_remove)} redundant bullet elements.")


if __name__ == "__main__":
    main()
