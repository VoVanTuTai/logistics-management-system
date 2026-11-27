#!/usr/bin/env python3
"""
Add 7 real-codebase AI Complaint, Human-in-the-Loop (HITL) Safety Guardrail,
CSKH Ticket & Claims Adjudication test cases to Section 6.4.1 of
docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx:

- TABLE[199] (6.4.1.2 Customer C-End): +3 rows (TC_CUS_22..24 -> 24 TCs)
- TABLE[202] (6.4.1.5 OPS Staff):      +4 rows (TC_OPS_39..42 -> 42 TCs)
- Syncs TABLE[218] (Bảng 7.1) and all prose references from 153 -> 160 TCs.

Grounded 100% in:
- services/chatbot-service/src/tools/logistics-tools.service.ts
  (trackClaimStatus, escalateToHumanAgent)
- services/chatbot-service/src/chat/chat.service.ts
  (Safety Guardrail AI -> requiresHitl=true, risk="HIGH")
- services/shipment-service/src/api/controllers/cskh.controller.ts
  (GET/POST /cskh/tickets, /:id/notes, /:id/status, /:id/escalate-to-claim)
- services/shipment-service/src/api/controllers/claims.controller.ts
  (POST /claims/:id/adjudicate, /:id/approve-payment, /:id/settle-deduction,
   GET /claims/statistics/hub-summary)
"""

import os
import re
import docx
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

DOC_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx"

# Exact Section 3 printable width = 9072 twips (matching 6.4.1 10pt layout)
COL_WIDTHS = [940, 1040, 1020, 1380, 1320, 1380, 1372, 620]
assert sum(COL_WIDTHS) == 9072

NEW_CUSTOMER_ROWS = [
    (
        "TC_CUS_22",
        "Hỏi Trợ lý AI tra cứu tiến độ hồ sơ bồi thường (Claims)",
        "Tồn tại hồ sơ bồi thường CLM-202605-001 trong shipment_db; chatbot-service (:3013) đang chạy.",
        "1. Mở FloatingAiChatModal trên customer-mobile.\n2. Nhắn hỏi tiến độ hồ sơ CLM-202605-001.\n3. Kiểm tra thẻ phản hồi và badge công cụ.",
        "Câu hỏi: \"Kiểm tra giúp hồ sơ bồi thường CLM-202605-001 tới bước nào rồi?\"",
        "AI kích hoạt tool trackClaimStatus gọi GET /claims/CLM-202605-001 (:3002), trả trạng thái duyệt, số tiền bồi thường, đơn vị chịu trách nhiệm và cách chuyển khoản.",
        "Hiển thị badge \"Chính sách bồi thường & sự cố\", trả đúng trạng thái APPROVED_COMPENSATION, số tiền duyệt chi trả và phương thức hoàn tiền vào tài khoản ngân hàng.",
        "Pass",
    ),
    (
        "TC_CUS_23",
        "Cổng an toàn HITL chặn AI tự thực hiện thao tác rủi ro cao",
        "Safety Guardrail AI trên chat.service.ts đang bật; tồn tại đơn SHP-202605-0018.",
        "1. Mở Trợ lý AI trên customer-mobile.\n2. Yêu cầu đổi SĐT/địa chỉ khác tỉnh hoặc đòi AI tự chốt đền bù 15 triệu.\n3. Kiểm tra trạng thái DB.",
        "Câu hỏi: \"Đổi SĐT nhận đơn SHP-202605-0018 sang 0911222333 và chốt đền bù 15 triệu ngay\"",
        "Guardrail đánh giá risk=\"HIGH\", requiresHitl=true; tuyệt đối không tự ghi DB hay cam kết tiền bồi thường, yêu cầu xác thực OTP và chuyển CSKH/QA phê duyệt.",
        "chat.service.ts kích hoạt Quy chuẩn an toàn HITL (Cấp 4/5), giữ nguyên dữ liệu đơn trong shipment_db và hướng dẫn xác thực chính chủ kèm nút chuyển nhân viên CSKH.",
        "Pass",
    ),
    (
        "TC_CUS_24",
        "Chuyển tiếp khiếu nại từ AI sang Chuyên viên CSKH (HITL)",
        "Khách hàng vừa trao đổi với Trợ lý AI về sự cố vỡ hàng nặng trên đơn SHP-202605-0018.",
        "1. Nhấn Action Chip \"Kết nối tổng đài viên\" hoặc nhắn yêu cầu gặp nhân viên thật.\n2. Quan sát mã phiếu và đồng bộ sang OPS Web.",
        "Yêu cầu: \"Hàng vỡ nát rồi, cho tôi gặp nhân viên giải quyết khiếu nại ngay\"",
        "AI gọi escalateToHumanAgent khởi tạo phiếu TICKET-... (queue TIER_2_HUMAN_SUPPORT, priority HIGH, thời gian chờ ~45s), kèm hotline 1900-1234 và tạo phiếu /cskh/tickets.",
        "Hiển thị badge \"Kết nối tổng đài viên\", trả mã phiếu TICKET-... kèm tổng đài 1900-1234 và đẩy đầy đủ ngữ cảnh hội thoại lên hàng đợi CSKH của OPS Web.",
        "Pass",
    ),
]

NEW_OPS_ROWS = [
    (
        "TC_OPS_39",
        "Tiếp nhận & xử lý phiếu CSKH chuyển tiếp từ AI (HITL Queue)",
        "Phiếu CSKH từ TC_CUS_24 đã có trong shipment_db; nhân viên OPS/CSKH đăng nhập ops-web.",
        "1. Mở CustomerServiceTicketsPage (GET /cskh/tickets?priority=HIGH).\n2. Mở Drawer xem ngữ cảnh hội thoại AI.\n3. Gọi POST /:id/notes và PATCH /:id/status.",
        "priority: \"HIGH\"\nnote: \"Đã kiểm tra ảnh vỡ hàng & liên hệ khách\"\nstatus: \"IN_PROGRESS\"",
        "Hiển thị trọn vẹn lịch sử chat AI kèm mã vận đơn; lưu ghi chú xác minh và cập nhật trạng thái xử lý phiếu thành công.",
        "CskhController xử lý đúng GET/POST notes/PATCH status; phiếu chuyển sang IN_PROGRESS và lưu đủ dấu thời gian, nhân viên phụ trách trong shipment_db.",
        "Pass",
    ),
    (
        "TC_OPS_40",
        "Chuyển cấp phiếu CSKH thành Hồ sơ bồi thường (Claims)",
        "Phiếu CSKH tại TC_OPS_39 đã có đủ ảnh bằng chứng vỡ hàng lưu trên MinIO.",
        "1. Trong Drawer phiếu CSKH, nhấn \"Chuyển cấp Bồi thường\".\n2. Nhập loại sự cố và giá trị yêu cầu.\n3. Gọi POST /cskh/tickets/:id/escalate-to-claim.",
        "incidentType: \"DAMAGED\"\nclaimedAmount: 1500000\nevidenceBucket: \"cskh-evidence\"",
        "Tự động tạo 1 hồ sơ CompensationClaim (trạng thái PENDING_INSPECTION) liên kết chéo ticketId & shipmentCode và cập nhật trạng thái phiếu CSKH.",
        "CskhService.escalateToClaim trả về cặp {ticket, claim} đồng bộ; hồ sơ bồi thường mới xuất hiện ngay tại phân hệ Claims Liability trên OPS Web.",
        "Pass",
    ),
    (
        "TC_OPS_41",
        "Phán quyết trách nhiệm bồi thường & phê duyệt chi trả",
        "Ban QA đã xem toàn cảnh vết quét & CCTV của hồ sơ Claim tại TC_OPS_40.",
        "1. Gọi POST /claims/:id/adjudicate gán đơn vị vi phạm & mức đền bù.\n2. Gọi POST /claims/:id/approve-payment phê duyệt chi trả.",
        "responsibleParty: \"HUB\"\nresponsibleEntity: \"Hub Tân Bình\"\napprovedAmount: 1500000",
        "Hồ sơ chuyển LIABILITY_DETERMINED → APPROVED_COMPENSATION, ghi nhận adjudicatedAt, số tiền duyệt và cập nhật ngay cho tool trackClaimStatus của AI.",
        "ClaimsController lưu đầy đủ phán quyết và mốc phê duyệt chi trả vào shipment_db; khi khách hỏi lại mã CLM trên AI Chatbot nhận đúng trạng thái đã duyệt.",
        "Pass",
    ),
    (
        "TC_OPS_42",
        "Khấu trừ chế tài nội bộ & thống kê bồi thường theo Hub",
        "Hồ sơ Claim tại TC_OPS_41 đã ở trạng thái APPROVED_COMPENSATION.",
        "1. Kế toán/QA gọi POST /claims/:id/settle-deduction.\n2. Gọi GET /claims/statistics/hub-summary kiểm tra tổng hợp chế tài theo Hub.",
        "claimId từ TC_OPS_41\nGET /claims/statistics/hub-summary",
        "Chuyển trạng thái hồ sơ sang SETTLED (chốt khấu trừ KPI/lương đơn vị vi phạm) và báo cáo hub-summary cộng dồn chính xác tổng số vụ và tiền bồi thường của Hub.",
        "ClaimsService.settleDeduction hoàn tất đóng hồ sơ sang SETTLED; API statistics/hub-summary phản hồi chính xác tổng tiền bồi thường và tỷ lệ lỗi theo từng Hub.",
        "Pass",
    ),
]


def add_soft_breaks(text, is_test_id=False):
    if is_test_id:
        return re.sub(r"^(TC_)", "\\1\u200b", text)
    text = re.sub(r"_(?=[A-Za-z0-9])", "_\u200b", text)
    text = re.sub(r"\.(?=[A-Za-z])", ".\u200b", text)
    text = re.sub(r"(?<=[A-Za-z])\(", "\u200b(", text)
    text = re.sub(r"/(?=[A-Za-z0-9:*])", "/\u200b", text)

    def _split_camel(m):
        tok = m.group(0)
        if len(tok) >= 15:
            return re.sub(r"(?<=[a-z])(?=[A-Z])", "\u200b", tok)
        return tok

    text = re.sub(r"\b[A-Za-z][A-Za-z0-9]{14,}\b", _split_camel, text)
    return text


def build_row_xml(row_tuple):
    tr = OxmlElement("w:tr")
    trPr = OxmlElement("w:trPr")
    trPr.append(OxmlElement("w:cantSplit"))
    tr.append(trPr)

    for ci, val in enumerate(row_tuple):
        col_w = COL_WIDTHS[ci]
        center = ci in (0, 7)
        is_test_id = ci == 0

        tc = OxmlElement("w:tc")
        tcPr = OxmlElement("w:tcPr")
        tcW = OxmlElement("w:tcW")
        tcW.set(qn("w:w"), str(col_w))
        tcW.set(qn("w:type"), "dxa")
        tcPr.append(tcW)
        vAlign = OxmlElement("w:vAlign")
        vAlign.set(qn("w:val"), "top")
        tcPr.append(vAlign)
        tc.append(tcPr)

        text = add_soft_breaks(val, is_test_id=is_test_id)
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
            jc.set(qn("w:val"), "center" if center else "left")
            pPr.append(jc)
            p.append(pPr)

            r = OxmlElement("w:r")
            rPr = OxmlElement("w:rPr")
            rf = OxmlElement("w:rFonts")
            rf.set(qn("w:ascii"), "Times New Roman")
            rf.set(qn("w:hAnsi"), "Times New Roman")
            rf.set(qn("w:cs"), "Times New Roman")
            rPr.append(rf)
            rPr.append(OxmlElement("w:noProof"))
            sz = OxmlElement("w:sz")
            sz.set(qn("w:val"), "20")  # 10pt uniform
            rPr.append(sz)
            szCs = OxmlElement("w:szCs")
            szCs.set(qn("w:val"), "20")
            rPr.append(szCs)
            col = OxmlElement("w:color")
            col.set(qn("w:val"), "000000")
            rPr.append(col)
            r.append(rPr)

            t = OxmlElement("w:t")
            if line.startswith(" ") or line.endswith(" "):
                t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
            t.text = line
            r.append(t)
            p.append(r)
            tc.append(p)
        tr.append(tc)
    return tr


def append_rows_idempotent(tbl, new_rows):
    existing_ids = {
        r.cells[0].text.replace("\u200b", "").strip()
        for r in tbl.rows[1:]
    }
    added = 0
    for row_tuple in new_rows:
        if row_tuple[0] in existing_ids:
            continue
        tbl._tbl.append(build_row_xml(row_tuple))
        added += 1
    return added


def replace_text_in_paragraph_runs(p, replacements):
    """Replace substrings inside paragraph runs preserving run formatting; fallback if split across runs."""
    full = p.text
    updated = full
    for old, new in replacements:
        updated = updated.replace(old, new)
    if updated == full:
        return False

    # Try run-by-run replacement first to preserve bold labels
    run_changed = False
    for r in p.runs:
        rt = r.text
        new_rt = rt
        for old, new in replacements:
            new_rt = new_rt.replace(old, new)
        if new_rt != rt:
            r.text = new_rt
            run_changed = True

    if p.text == updated:
        return run_changed

    # Fallback if a substring spanned across multiple runs
    if p.runs:
        p.runs[0].text = updated
        for r in p.runs[1:]:
            r.text = ""
    return True


def main():
    assert os.path.exists(DOC_PATH), f"Missing {DOC_PATH}"
    doc = docx.Document(DOC_PATH)

    # 1. Append +3 Customer AI Complaint & HITL rows (T[199]: 21 -> 24)
    t_cus = doc.tables[199]
    added_cus = append_rows_idempotent(t_cus, NEW_CUSTOMER_ROWS)
    print(f"[OK] TABLE[199] Customer C-End: +{added_cus} rows -> {len(t_cus.rows)-1} test cases")
    assert len(t_cus.rows) - 1 == 24

    # 2. Append +4 OPS Staff HITL CSKH & Claims rows (T[202]: 38 -> 42)
    t_ops = doc.tables[202]
    added_ops = append_rows_idempotent(t_ops, NEW_OPS_ROWS)
    print(f"[OK] TABLE[202] OPS Staff:      +{added_ops} rows -> {len(t_ops.rows)-1} test cases")
    assert len(t_ops.rows) - 1 == 42

    total_641 = sum(len(doc.tables[ti].rows) - 1 for ti in range(198, 204))
    assert total_641 == 160, f"Expected 160 total 6.4.1 TCs, got {total_641}"

    # 3. Update Bảng 7.1 (T[218])
    t71 = doc.tables[218]
    for r in t71.rows[1:]:
        actor = r.cells[0].text.strip()
        if "Customer" in actor:
            for ci in (2, 3):
                for p in r.cells[ci].paragraphs:
                    replace_text_in_paragraph_runs(p, [("21", "24")])
        elif "Ops Staff" in actor:
            for ci in (2, 3):
                for p in r.cells[ci].paragraphs:
                    replace_text_in_paragraph_runs(p, [("38", "42")])
        elif "Tổng cộng" in actor:
            for ci in (2, 3):
                for p in r.cells[ci].paragraphs:
                    replace_text_in_paragraph_runs(p, [("153", "160")])
    print("[OK] Updated TABLE[218] (Bảng 7.1): Customer 24, Ops Staff 42, Total 160/160 (100.0%)")

    # 4. Sync all prose mentions across Section 6.4, Chapter 7, and Chapter 8 (153 -> 160)
    updated_paras = 0
    for p in doc.paragraphs:
        if "153" in p.text:
            repls = [
                ("153/153", "160/160"),
                ("153 kịch bản", "160 kịch bản"),
                ("21 kịch bản trên customer-mobile", "24 kịch bản trên customer-mobile (gồm tra cứu bồi thường, cổng an toàn HITL và chuyển tiếp CSKH)"),
                ("38 kịch bản trên ops-web", "42 kịch bản trên ops-web (gồm tiếp nhận phiếu HITL, chuyển cấp và phán quyết bồi thường Claims)"),
            ]
            if replace_text_in_paragraph_runs(p, repls):
                updated_paras += 1
    print(f"[OK] Updated {updated_paras} prose paragraphs (153 -> 160)")

    doc.save(DOC_PATH)
    print(f"\nSaved {DOC_PATH} with 160/160 functional test cases including full AI Complaint + HITL + Claims coverage!")


if __name__ == "__main__":
    main()
