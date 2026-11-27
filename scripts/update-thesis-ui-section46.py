#!/usr/bin/env python3
"""
Embed all 13 Studio-Grade Brand UI Layout & Feature SVG Plates (Hinh 4.8..4.20)
into Section 4.6 of docs/BaoCaoKLTN_TranTanTai_VoVanTuTai_version4_final.docx:
  - 4.6.1 merchant-web:    Hinh 4.8 (Layout) + Hinh 4.9 (Create Order IATA & Single-Line Table)
  - 4.6.2 ops-web:         Hinh 4.10 (Layout) + Hinh 4.11 (Manifest & COD VietQR) + Hinh 4.12 (Stray 24h CCTV)
  - 4.6.3 courier-mobile:  Hinh 4.13 (Home & Scan POD) + Hinh 4.14 (NDR, COD VietQR & Ops Chat)
  - 4.6.4 admin-web:       Hinh 4.15 (Dashboard) + Hinh 4.16 (Mobile Override & 4-Tier Hub/Zone)
  - 4.6.5 customer-mobile: Hinh 4.17 (Home & AI Rich Card) + Hinh 4.18 (Create Order IATA & Timeline)
  - 4.6.6 guest-web:       Hinh 4.19 (Public Portal & AI Widget) + Hinh 4.20 (Public Track & IATA Calculator)
"""

import copy
import os
import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches

DOC_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai_version4_final.docx"

UI_SECTIONS = [
    ("4.6.1.", [
        ("docs/architecture/diagrams/ui-merchant-web-layout.png", 6.3,
         "Hình 4.8 Thiết kế bố cục tổng quan Cổng Đối tác gửi hàng (merchant-web)"),
        ("docs/architecture/diagrams/ui-merchant-create-and-list.png", 6.3,
         "Hình 4.9 Giao diện Tạo vận đơn (5 nhóm hàng hóa, IATA V/6000) và Danh sách đơn chuẩn 1 dòng"),
    ]),
    ("4.6.2.", [
        ("docs/architecture/diagrams/ui-ops-web-layout.png", 6.3,
         "Hình 4.10 Thiết kế bố cục điều hành Trung tâm khai thác (ops-web)"),
        ("docs/architecture/diagrams/ui-ops-manifest-cod.png", 6.3,
         "Hình 4.11 Giao diện Đóng bao niêm phong (Manifest/Seal) và Quyết toán công nợ COD qua VietQR"),
        ("docs/architecture/diagrams/ui-ops-stray-investigation.png", 6.3,
         "Hình 4.12 Giao diện Giám định đơn lạc (Chain of Custody) và Cửa sổ điều trần CCTV 24 giờ"),
    ]),
    ("4.6.3.", [
        ("docs/architecture/diagrams/ui-courier-mobile-layout.png", 6.2,
         "Hình 4.13 Thiết kế bố cục Bảng điều phối và Quét mã POD ngoại tuyến (courier-mobile)"),
        ("docs/architecture/diagrams/ui-courier-ndr-cod-chat.png", 6.2,
         "Hình 4.14 Giao diện Báo cáo sự cố NDR, Nộp tiền COD VietQR và Chat Ops thời gian thực"),
    ]),
    ("4.6.4.", [
        ("docs/architecture/diagrams/ui-admin-web-layout.png", 6.3,
         "Hình 4.15 Thiết kế bố cục tổng quan Quản trị hệ thống (admin-web)"),
        ("docs/architecture/diagrams/ui-admin-rbac-hub.png", 6.3,
         "Hình 4.16 Giao diện Ma trận phân quyền Mobile (Override) và Mạng lưới Hub 4 cấp / Zone"),
    ]),
    ("4.6.5.", [
        ("docs/architecture/diagrams/ui-customer-mobile-layout.png", 6.2,
         "Hình 4.17 Thiết kế bố cục Trang chủ và Trợ lý AI Hybrid RAG Rich Card (customer-mobile)"),
        ("docs/architecture/diagrams/ui-customer-order-timeline.png", 6.2,
         "Hình 4.18 Giao diện Tạo đơn cá nhân tính cước IATA và Chi tiết hành trình vận đơn (Timeline)"),
    ]),
    ("4.6.6.", [
        ("docs/architecture/diagrams/ui-guest-web-layout.png", 6.3,
         "Hình 4.19 Thiết kế bố cục Cổng tra cứu công khai và Trợ lý AI nổi (guest-web)"),
        ("docs/architecture/diagrams/ui-guest-tracking-pricing.png", 6.3,
         "Hình 4.20 Giao diện Kết quả tra cứu hành trình ẩn PII và Công cụ ước tính cước IATA V/6000"),
    ]),
]


def insert_image_before(ref_elem, img_path, width_in, doc):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(img_path, width=Inches(width_in))
    ref_elem.addprevious(p._element)
    return p


def insert_caption_before(ref_elem, text, tpl_h5):
    new_p = OxmlElement("w:p")
    pPr = tpl_h5._element.find(qn("w:pPr"))
    if pPr is not None:
        new_p.append(copy.deepcopy(pPr))
    r = OxmlElement("w:r")
    if tpl_h5.runs:
        rPr = tpl_h5.runs[0]._r.find(qn("w:rPr"))
        if rPr is not None:
            r.append(copy.deepcopy(rPr))
    t = OxmlElement("w:t")
    t.text = text
    r.append(t)
    new_p.append(r)
    ref_elem.addprevious(new_p)
    return new_p


def remove_elem(el):
    parent = el.getparent()
    if parent is not None:
        parent.remove(el)


def main():
    assert os.path.exists(DOC_PATH), f"Missing {DOC_PATH}"
    for _, items in UI_SECTIONS:
        for img_p, _, _ in items:
            assert os.path.exists(img_p), f"Missing {img_p}"

    doc = docx.Document(DOC_PATH)
    paras = doc.paragraphs

    anchors = {}
    idx_47 = None
    tpl_h5 = None
    for i, p in enumerate(paras):
        t = p.text.strip()
        st = p.style.name if p.style else ""
        if "toc" in st.lower():
            continue
        for prefix, _ in UI_SECTIONS:
            if t.startswith(prefix) and st == "Heading 3":
                anchors[prefix] = i
        if t.startswith("4.7.") and st == "Heading 2":
            idx_47 = i
        if t.startswith("Hình 4.8") and st == "Heading 5" and tpl_h5 is None:
            tpl_h5 = p

    assert len(anchors) == 6 and idx_47 is not None and tpl_h5 is not None, f"Anchors error: {anchors}, 4.7={idx_47}"

    ordered = [anchors[prefix] for prefix, _ in UI_SECTIONS] + [idx_47]
    elems_to_remove = []
    total_inserted = 0

    for s_idx, (prefix, items) in enumerate(UI_SECTIONS):
        start_i = ordered[s_idx]
        end_i = ordered[s_idx + 1]
        next_heading_el = paras[end_i]._element

        for j in range(start_i + 1, end_i):
            pj = paras[j]
            has_img = bool(pj._element.findall(".//" + qn("w:drawing")) or pj._element.findall(".//" + qn("w:pict")))
            stj = pj.style.name if pj.style else ""
            if has_img or stj == "Heading 5" or pj.text.strip().startswith("Hình 4."):
                elems_to_remove.append(pj._element)

        for img_path, width_in, caption in items:
            insert_image_before(next_heading_el, img_path, width_in, doc)
            insert_caption_before(next_heading_el, caption, tpl_h5)
            total_inserted += 1

    for el in elems_to_remove:
        remove_elem(el)

    doc.save(DOC_PATH)
    print(f"Updated Section 4.6 cleanly: removed {len(elems_to_remove)} previous UI elements, embedded {total_inserted} Studio UI Plates (Hinh 4.8..4.20)!")


if __name__ == "__main__":
    main()
