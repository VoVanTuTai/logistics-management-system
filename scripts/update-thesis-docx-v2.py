#!/usr/bin/env python3
"""
Produce BaoCaoKLTN_TranTanTai_VoVanTuTai_version2.docx from version1 (1).docx:
  1. Replaces Hình 4.1..4.5 with latest 100%-code-verified 2x Retina PNGs (correct aspect ratios).
  2. Inserts Hình 4.6 (RAG Overview) & Hình 4.7 (RAG Pipeline) into Section 4.2.6 and shifts
     existing Ch.4 UI screenshots Hình 4.6..4.30 -> Hình 4.8..4.32.
  3. Removes fake Section 5.6.12 (Linehaul service DB + Hình 5.19 + Tables 5.74..5.79) cleanly.
  4. Fixes ALL 10 architectural mismatches across Abstract, Ch.1, Ch.4, Ch.5, Ch.6, Ch.7, Ch.8:
       - 14 microservices (not 15/16), no linehaul-service (:3014)
       - 12 PostgreSQL DBs (9 Write + 2 CQRS Read + 1 chat_db via pg.Pool)
       - Actual AI stack: gemini-3.5-flash-lite + Groq (openai/gpt-oss-120b, qwen/qwen3.8-27b)
         + OpenRouter (nvidia/nemotron-3.5-lightning:free), 3072-D, 59 chunks, Top-5, Cosine + Thesaurus
         (removes LangChain, GPT-4o-mini, Gemini 3.6/3 Flash, Llama Guard 3 8B, BM25, 768-D claims)
       - Actual deployment: Apple Silicon Mac + PM2 (15 processes) + Docker Desktop (4 infra containers)
         + Cloudflare Zero Trust Tunnel (*.nexus-ex.site) — matching Hình 4.2
       - Rate limit 2,400 req/min, raw WebSocket (no Socket.io), tracking-service reads tracking_db (no Redis)
       - Exact insurance tiers (1M-10M: 0.5%, 10M-30M: 1.0%, cap 30M VND; standard cap 1M VND / 4x fee)
       - Fixes typos ("đên thầy", "chì chì", missing spaces in API endpoints)
  5. Rewrites AI-heavy promotional prose into natural, objective Vietnamese engineering thesis style
     and removes copy-paste bloat between Chapter 7 and Chapter 8.
  6. Enables w:updateFields in word/settings.xml so Word refreshes TOC / List of Figures / Tables cleanly.
"""

import re
import struct
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from docx import Document
from docx.shared import Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

ROOT = Path(__file__).resolve().parent.parent
SRC_DOCX = ROOT / "docs" / "BaoCaoKLTN_TranTanTai_VoVanTuTai_version1 (1).docx"
DST_DOCX = ROOT / "docs" / "BaoCaoKLTN_TranTanTai_VoVanTuTai_version2.docx"
DIAG_DIR = ROOT / "docs" / "architecture" / "diagrams"


def png_dimensions(path: Path):
    data = path.read_bytes()
    w, h = struct.unpack(">II", data[16:24])
    return w, h


def set_para_text(para, text, bold_prefix=None):
    """Replace paragraph text cleanly while preserving paragraph style (pPr) & font inheritance."""
    # Capture first run's explicit font name/size if set
    ref_font_name = None
    ref_font_size = None
    for r in para.runs:
        if r.font.name:
            ref_font_name = r.font.name
        if r.font.size:
            ref_font_size = r.font.size
        if ref_font_name or ref_font_size:
            break

    # Remove existing runs
    for r in list(para.runs):
        r._element.getparent().remove(r._element)

    if bold_prefix and text.startswith(bold_prefix):
        r1 = para.add_run(bold_prefix)
        r1.bold = True
        if ref_font_name:
            r1.font.name = ref_font_name
        if ref_font_size:
            r1.font.size = ref_font_size
        rest = text[len(bold_prefix):]
        if rest:
            r2 = para.add_run(rest)
            if ref_font_name:
                r2.font.name = ref_font_name
            if ref_font_size:
                r2.font.size = ref_font_size
    else:
        r = para.add_run(text)
        if ref_font_name:
            r.font.name = ref_font_name
        if ref_font_size:
            r.font.size = ref_font_size


def set_cell_text(cell, text, bold=None):
    """Update a table cell while preserving its original paragraph style, alignment, and run font."""
    if not cell.paragraphs:
        cell.text = text
        return
    p0 = cell.paragraphs[0]
    # Remove extra paragraphs if any
    for extra in list(cell.paragraphs[1:]):
        extra._element.getparent().remove(extra._element)
    ref_bold = None
    ref_name = None
    ref_size = None
    for r in p0.runs:
        if ref_bold is None and r.bold is not None:
            ref_bold = r.bold
        if not ref_name and r.font.name:
            ref_name = r.font.name
        if not ref_size and r.font.size:
            ref_size = r.font.size
    for r in list(p0.runs):
        r._element.getparent().remove(r._element)
    r = p0.add_run(text)
    if bold is not None:
        r.bold = bold
    elif ref_bold is not None:
        r.bold = ref_bold
    if ref_name:
        r.font.name = ref_name
    if ref_size:
        r.font.size = ref_size


def replace_table_rows(table, new_rows):
    """Replace table data rows cleanly by cloning row XML templates to preserve borders/widths/shading."""
    header_tr = table.rows[0]._tr
    template_tr = table.rows[1]._tr if len(table.rows) > 1 else header_tr
    from copy import deepcopy
    tpl_copy = deepcopy(template_tr)

    # Update header row
    for ci, val in enumerate(new_rows[0]):
        if ci < len(table.rows[0].cells):
            set_cell_text(table.rows[0].cells[ci], val, bold=True)

    # Remove all old body rows
    for old_row in list(table.rows[1:]):
        old_row._tr.getparent().remove(old_row._tr)

    # Append new body rows
    tbl_el = table._tbl
    for rdata in new_rows[1:]:
        new_tr = deepcopy(tpl_copy)
        tbl_el.append(new_tr)
        # Re-read last row via python-docx wrapper
        row_obj = table.rows[-1]
        for ci, val in enumerate(rdata):
            if ci < len(row_obj.cells):
                set_cell_text(row_obj.cells[ci], val, bold=False)


def replace_image_in_paragraph(para, img_path: Path, max_width_in=6.2, max_height_in=7.6):
    """Replace paragraph's embedded image cleanly with exact aspect ratio."""
    w_px, h_px = png_dimensions(img_path)
    aspect = h_px / w_px
    w_in = max_width_in
    h_in = w_in * aspect
    if h_in > max_height_in:
        h_in = max_height_in
        w_in = h_in / aspect

    # Clear old runs/drawings in paragraph
    for child in list(para._element):
        if child.tag != qn("w:pPr"):
            para._element.remove(child)
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = para.add_run()
    run.add_picture(str(img_path), width=Inches(w_in), height=Inches(h_in))


def insert_paragraph_after(anchor_para, text="", style=None, alignment=None):
    """Insert a new paragraph immediately after anchor_para."""
    new_p = OxmlElement("w:p")
    anchor_para._element.addnext(new_p)
    from docx.text.paragraph import Paragraph
    p = Paragraph(new_p, anchor_para._parent)
    if style:
        try:
            p.style = style
        except Exception:
            pass
    if alignment is not None:
        p.alignment = alignment
    if text:
        p.add_run(text)
    return p


def insert_figure_after(anchor_para, img_path: Path, caption_text: str, caption_style, max_width_in=6.2, max_height_in=7.4):
    """Insert centered image paragraph + caption paragraph right after anchor_para; returns caption_para."""
    w_px, h_px = png_dimensions(img_path)
    aspect = h_px / w_px
    w_in = max_width_in
    h_in = w_in * aspect
    if h_in > max_height_in:
        h_in = max_height_in
        w_in = h_in / aspect

    img_p = insert_paragraph_after(anchor_para, "", alignment=WD_ALIGN_PARAGRAPH.CENTER)
    img_p.add_run().add_picture(str(img_path), width=Inches(w_in), height=Inches(h_in))

    cap_p = insert_paragraph_after(img_p, caption_text, style=caption_style, alignment=WD_ALIGN_PARAGRAPH.CENTER)
    return cap_p


def find_para(doc, substr):
    for p in doc.paragraphs:
        if substr in p.text:
            return p
    return None


def main():
    print(f"Loading {SRC_DOCX} ...")
    doc = Document(str(SRC_DOCX))

    # =========================================================================
    # 1. REMOVE FAKE SECTION 5.6.12 (Linehaul service DB + Hình 5.19 + Tables)
    # =========================================================================
    body = doc.element.body
    children = list(body)
    start_idx = None
    end_idx = None
    for idx, el in enumerate(children):
        if el.tag == qn("w:p"):
            txt = "".join(t.text for t in el.findall(".//" + qn("w:t")) if t.text).strip()
            if txt.startswith("5.6.12 Thiết kế cơ sở dữ liệu Linehaul service"):
                start_idx = idx
            elif start_idx is not None and txt.startswith("CHƯƠNG 6"):
                end_idx = idx
                break
    if start_idx is not None and end_idx is not None:
        removed = 0
        for el in children[start_idx:end_idx]:
            body.remove(el)
            removed += 1
        print(f"[OK] Removed fake Section 5.6.12 Linehaul DB ({removed} XML elements: E{start_idx}..E{end_idx-1})")
    else:
        print("[WARN] Could not locate Section 5.6.12 range!")

    # Remove stale TOC lines for Linehaul (Hình 5.19 & Bảng 5.74..5.79)
    toc_removed = 0
    for p in list(doc.paragraphs):
        if p.style.name.lower().startswith("toc") and ("Linehaul" in p.text or "Bảng 5.75" in p.text or "Bảng 5.79" in p.text):
            p._element.getparent().remove(p._element)
            toc_removed += 1
    print(f"[OK] Cleaned {toc_removed} stale Linehaul TOC entries")

    # =========================================================================
    # 2. REPLACE HÌNH 4.1..4.5 WITH LATEST 100%-CODE-VERIFIED PNGs
    # =========================================================================
    fig_map = {
        "Hình 4.1 Sơ đồ kiến trúc tổng thể hệ thống": DIAG_DIR / "nexus-system-architecture.png",
        "Hình 4.2 Mô hình triển khai hệ thống": DIAG_DIR / "nexus-mac-deployment.png",
        "Hình 4.3 Mô hình giao tiếp giữa các service": DIAG_DIR / "nexus-service-communication.png",
        "Hình 4.4 Phân nhóm các Microservice trong hệ thống": DIAG_DIR / "nexus-microservices-grouping.png",
        "Hình 4.5 Nguyên tắc tổ chức dữ liệu theo database per service": DIAG_DIR / "nexus-database-per-service.png",
    }
    cap_style = None
    for idx, p in enumerate(doc.paragraphs):
        t = p.text.strip()
        if t in fig_map and not p.style.name.lower().startswith("toc"):
            cap_style = p.style
            if idx > 0:
                replace_image_in_paragraph(doc.paragraphs[idx - 1], fig_map[t])
                print(f"[OK] Updated image for {t} -> {fig_map[t].name}")

    # =========================================================================
    # 3. SHIFT CH.4 FIGURE CAPTIONS Hình 4.5..4.30 -> Hình 4.7..4.32
    #    (so 4.2.6 inserts Hình 4.5 & Hình 4.6 cleanly BEFORE 4.3's Hình 4.7!)
    # =========================================================================
    shifted = 0
    for p in doc.paragraphs:
        if p.style.name.lower().startswith("toc"):
            continue
        m = re.match(r"^Hình 4\.(\d+)(\s+.*)$", p.text.strip())
        if m:
            num = int(m.group(1))
            if num >= 5:
                set_para_text(p, f"Hình 4.{num + 2}{m.group(2)}")
                shifted += 1
    print(f"[OK] Shifted {shifted} Ch.4 figure captions (4.5..4.30 -> 4.7..4.32)")

    # =========================================================================
    # 4. REWRITE ABSTRACT, LỜI CẢM ƠN & CHAPTER 1 (Accurate + Natural Style)
    # =========================================================================
    para_rewrites = [
        # Abstract (EN)
        (
            "The platform is developed using NestJS, TypeScript, React, React Native, PostgreSQL, RabbitMQ, Docker, and LangChain",
            "The platform is developed using NestJS, TypeScript, React, React Native (Expo), PostgreSQL 16, RabbitMQ, Redis, MinIO S3, and a custom Hybrid RAG AI service integrating Google Gemini, Groq LPU, and OpenRouter. The backend comprises 14 independent microservices following the Database-per-Service pattern (12 isolated PostgreSQL databases plus stateless pricing and an in-memory vector store), deployed via PM2, Docker Desktop, and Cloudflare Zero Trust Tunnel.",
            None,
        ),
        # Abstract (VI)
        (
            "Hệ thống được phát triển bằng NestJS, TypeScript, React, React Native, PostgreSQL, RabbitMQ, Docker và thư viện LangChain",
            "Hệ thống được xây dựng trên nền tảng NestJS, TypeScript, React, React Native (Expo), PostgreSQL 16, RabbitMQ, Redis, MinIO S3 và phân hệ trợ lý AI Hybrid RAG tích hợp đa nhà cung cấp (Google Gemini, Groq LPU, OpenRouter). Kiến trúc backend gồm 14 microservice độc lập theo nguyên tắc Database-per-Service (12 cơ sở dữ liệu PostgreSQL tách biệt, kết hợp dịch vụ tính cước stateless và kho vector lưu trong RAM), được triển khai vận hành thực tế bằng PM2, Docker Desktop và Cloudflare Zero Trust Tunnel.",
            None,
        ),
        # Lời cảm ơn typo
        (
            "cảm ơn sâu sắc đên thầy Huỳnh Nam",
            "Đặc biệt, nhóm xin chân thành cảm ơn thầy Huỳnh Nam, giảng viên hướng dẫn, đã tận tình định hướng, góp ý chuyên môn và hỗ trợ nhóm trong suốt quá trình thực hiện và hoàn thiện khóa luận.",
            None,
        ),
        # Ch.1 1.2.1 & 1.2.2
        (
            "Quản lý toàn diện vòng đời vận đơn (Shipment Lifecycle):",
            "Quản lý xuyên suốt vòng đời vận đơn (Shipment Lifecycle): Theo dõi trạng thái bưu kiện từ lúc khởi tạo, lấy hàng tận nơi, đóng bao niêm phong kẹp chì seal, trung chuyển qua mạng lưới Hub 4 cấp đến khi phát hàng kèm ảnh POD và xử lý hoàn hàng hoặc khiếu nại.",
            "Quản lý xuyên suốt vòng đời vận đơn (Shipment Lifecycle):",
        ),
        (
            "Về mặt kiến trúc và backend: Xây dựng hoàn chỉnh 15 Microservices",
            "Về mặt kiến trúc và backend: Xây dựng 14 microservices độc lập bằng NestJS, TypeScript và Prisma ORM (riêng gateway-bff kết nối chat_db qua pg.Pool), quản trị 12 cơ sở dữ liệu PostgreSQL tách biệt và liên kết sự kiện bất đồng bộ qua RabbitMQ theo mẫu Transactional Outbox và CQRS.",
            "Về mặt kiến trúc và backend:",
        ),
        (
            "Về phân hệ Trí tuệ nhân tạo (AI): Triển khai microservice chatbot-service",
            "Về phân hệ Trí tuệ nhân tạo (AI): Xây dựng microservice chatbot-service tích hợp Google Gemini (gemini-3.5-flash-lite) kết hợp dự phòng Groq LPU (openai/gpt-oss-120b, qwen/qwen3.8-27b) và tác tử kiểm soát rủi ro OpenRouter (nvidia/nemotron-3.5-lightning:free), ứng dụng Hybrid RAG (vector 3072 chiều), gọi công cụ nghiệp vụ động và truyền phản hồi theo luồng SSE.",
            "Về phân hệ Trí tuệ nhân tạo (AI):",
        ),
        # Ch.1 1.3 Yêu cầu ban đầu (khử AI hype)
        (
            "Hệ thống quản lý và trung chuyển bưu kiện Nexus Express System được định hướng phát triển nhằm đáp ứng toàn diện",
            "Hệ thống quản lý và trung chuyển bưu kiện Nexus Express được xây dựng nhằm đáp ứng nhu cầu vận hành thực tế của các nhóm người dùng trong quy trình chuyển phát nhanh từ khâu nhận đơn đến giao phát và đối soát COD.",
            None,
        ),
        (
            "Đối với các đối tác gửi hàng (Merchant), hệ thống cần mang đến trải nghiệm liền mạch xuyên suốt",
            "Đối với các đối tác gửi hàng (Merchant), hệ thống hỗ trợ quy trình xuyên suốt từ tạo đơn, in phiếu gửi, đặt lịch lấy hàng, theo dõi trạng thái vận đơn đến đối soát tiền thu hộ COD và xử lý yêu cầu đổi thông tin hoặc chuyển hoàn.",
            None,
        ),
        # Ch.1 1.4.1 & 1.5.1
        (
            "Công nghệ trí tuệ nhân tạo (AI): Mô hình ngôn ngữ lớn (Google Gemini, OpenAI)",
            "Công nghệ trí tuệ nhân tạo (AI): Kết hợp các mô hình ngôn ngữ lớn (Google Gemini, Groq LPU, OpenRouter), tìm kiếm lai Hybrid RAG với vector 3072 chiều, gọi công cụ tra cứu nghiệp vụ thời gian thực (Function Calling), kiểm soát an toàn đầu vào/đầu ra và truyền phản hồi theo luồng Server-Sent Events (SSE).",
            "Công nghệ trí tuệ nhân tạo (AI):",
        ),
        (
            "Nghiên cứu và đóng góp giải pháp tích hợp trí tuệ nhân tạo tạo sinh thế hệ mới thông qua kiến trúc Hybrid RAG kết hợp Vector Embeddings 768 chiều",
            "Trình bày cách tích hợp trợ lý AI dựa trên kiến trúc Hybrid RAG (vector 3072 chiều kết hợp từ điển đồng nghĩa ngành), gọi công cụ tra cứu thời gian thực (Function Calling) và cơ chế kiểm soát rủi ro Human-in-the-Loop, làm cơ sở tham khảo cho các hệ thống thông tin doanh nghiệp có yêu cầu cao về độ chính xác nghiệp vụ.",
            None,
        ),
        # Ch.1 1.6.2 & 1.6.3
        (
            "Hệ thống được thiết kế theo Kiến trúc 15 Microservices kết hợp API Gateway",
            "Hệ thống được thiết kế theo kiến trúc 14 Microservices kết hợp API Gateway / BFF Pattern và Event-Driven Architecture:",
            None,
        ),
        (
            "Backend Services (15 dịch vụ):",
            "Backend Services (14 dịch vụ): Node.js 20+, NestJS 10, TypeScript, Prisma ORM (riêng gateway-bff dùng pg.Pool cho chat_db).",
            "Backend Services (14 dịch vụ):",
        ),
        (
            "Cơ sở dữ liệu & Lưu trữ: PostgreSQL theo nguyên tắc Database-per-service (11 cơ sở dữ liệu",
            "Cơ sở dữ liệu & Lưu trữ: PostgreSQL 16 theo nguyên tắc Database-per-Service (12 cơ sở dữ liệu độc lập), MinIO S3 (bucket nexus-pod-images) lưu ảnh POD và chứng cứ CSKH, Redis 7 hỗ trợ kênh Pub/Sub chat thời gian thực.",
            "Cơ sở dữ liệu & Lưu trữ:",
        ),
        (
            "Trí tuệ nhân tạo (AI): tích hợp Google Gemini 3 Flash",
            "Trí tuệ nhân tạo (AI): Tích hợp Google Gemini (gemini-3.5-flash-lite), Groq LPU (openai/gpt-oss-120b, qwen/qwen3.8-27b) và OpenRouter (nvidia/nemotron-3.5-lightning:free) với Hybrid RAG (vector 3072 chiều) và giao thức Server-Sent Events (SSE).",
            "Trí tuệ nhân tạo (AI):",
        ),
        (
            "Chương 4 - Thiết kế hệ thống: Trình bày kiến trúc tổng thể, mô hình triển khai, thiết kế chi tiết 15 microservices",
            "Chương 4 - Thiết kế hệ thống: Trình bày kiến trúc tổng thể, mô hình triển khai thực tế, cơ chế giao tiếp liên dịch vụ, phân nhóm 14 microservices theo DDD, nguyên tắc Database-per-Service, phân hệ AI RAG xử lý khiếu nại và thiết kế API.",
            "Chương 4 - Thiết kế hệ thống:",
        ),

        # =====================================================================
        # CHAPTER 4 — COMPLETE SYNCHRONIZATION WITH ALL 7 NEW DIAGRAMS + NATURAL PROSE
        # =====================================================================
        (
            "Hệ thống Nexus Express System (NXS) được thiết kế và hiện thực hóa theo kiến trúc Microservices phân tán hiện đại",
            "Hệ thống Nexus Express được thiết kế theo kiến trúc Microservices kết hợp mô hình Backend-For-Frontend (BFF) và truyền thông hướng sự kiện (Event-Driven Architecture). Cách tiếp cận này giúp phân tách rõ các miền nghiệp vụ (Bounded Context) theo phương pháp Thiết kế hướng miền (DDD), tránh phụ thuộc chéo trực tiếp vào cơ sở dữ liệu chung và cho phép mở rộng riêng từng dịch vụ chịu tải lớn như tra cứu hành trình hoặc quét mã kho.",
            None,
        ),
        (
            "4.1.1. Sơ đồ kiến trúc tổng thể 15 Microservices và Cổng Gateway BFF",
            "4.1.1. Sơ đồ kiến trúc tổng thể 14 Microservices và Cổng Gateway BFF",
            None,
        ),
        (
            "Tầng Ứng dụng Client (6 Apps): Bao gồm 6 ứng dụng độc lập phục vụ 5 nhóm tác nhân",
            "Tầng Ứng dụng Client (6 Apps): Gồm 4 ứng dụng Web phát triển bằng React 18 và Vite (ops-web :5173, merchant-web :5174, admin-web :5175, guest-web :5177) cùng 2 ứng dụng Di động React Native / Expo xuất file APK (Customer Mobile và Courier Mobile).",
            "Tầng Ứng dụng Client (6 Apps):",
        ),
        (
            "Tầng Cổng giao tiếp tập trung (API Gateway / BFF Tier): Dịch vụ gateway-bff",
            "Tầng Cổng giao tiếp trung tâm (API Gateway BFF - cổng 3000): Là điểm tiếp nhận duy nhất (Single Entrypoint) cho toàn bộ lưu lượng HTTPS/WSS từ 6 ứng dụng client và các yêu cầu tích hợp đối tác HMAC từ DT_COMMERCE (api.truongam.tech). Gateway đảm nhiệm xác thực JWT RBAC, giới hạn tần suất truy cập (2.400 req/phút), điều phối WebSocket (/ws/chat, /ws/tasks, /ws/locations), cấp URL ký sẵn (S3 Presign) tải ảnh lên MinIO, lưu lịch sử chat vào chat_db (pg.Pool) và chuyển tiếp luồng HTTP/SSE tới chatbot-service.",
            "Tầng Cổng giao tiếp trung tâm (API Gateway BFF - cổng 3000):",
        ),
        (
            "Tầng Dịch vụ nghiệp vụ (Core Microservices Tier): Bao gồm 15 microservices độc lập",
            "Tầng Dịch vụ nghiệp vụ (12 Domain Microservices + chatbot-service): Gồm 12 dịch vụ lõi vận hành trên cổng 3001–3012 (auth, masterdata, pricing, shipment, pickup, dispatch, manifest, scan, delivery, payment, tracking, reporting) và phân hệ trợ lý AI chatbot-service (:3013). Trong đó, pricing-service hoạt động không trạng thái (stateless), shipment-service đảm nhiệm bắn Status Webhook ra DT_COMMERCE, payment-service giao tiếp trực tiếp với SePay (qr.sepay.vn), còn chatbot-service gọi API công cụ nội bộ và các cloud LLM bên ngoài.",
            "Tầng Dịch vụ nghiệp vụ (12 Domain Microservices + chatbot-service):",
        ),
        (
            "Tầng Hạ tầng lưu trữ và Truyền thông sự kiện (Infrastructure Tier): Bao gồm cụm 11 cơ sở dữ liệu",
            "Tầng Hạ tầng lưu trữ và Truyền thông sự kiện: Gồm RabbitMQ 3.13 (AMQP :5672, topic exchange domain.events) nhận sự kiện từ 9 dịch vụ ghi (Outbox) để cập nhật chéo và chiếu sang CQRS Read Model; cùng 4 thành phần lưu trữ chuyên biệt gồm PostgreSQL 16 (12 cơ sở dữ liệu độc lập: 11 DB Prisma và chat_db dùng pg.Pool), Redis 7 (:6379 cho Pub/Sub gateway-bff:chat), MinIO S3 (:9000/:9001, bucket nexus-pod-images chứa ảnh POD và thư mục cskh-evidence/, claims/) và Local Vector Store (vector-index.json 3072 chiều).",
            "Tầng Hạ tầng lưu trữ và Truyền thông sự kiện:",
        ),
        (
            "Trong mô hình trên, gateway-bff đóng vai trò là cổng giao tiếp biên giới duy nhất.",
            "Trong mô hình Hình 4.1, mọi yêu cầu từ người dùng cuối đều đi qua gateway-bff; các dịch vụ nghiệp vụ bên trong chỉ lắng nghe trên mạng nội bộ và không mở cổng trực tiếp ra Internet. Nhờ vậy, việc kiểm soát xác thực, giới hạn tải và ghi nhật ký truy cập được tập trung tại một điểm duy nhất.",
            None,
        ),
        # 4.1.2 Deployment (Mac Apple Silicon + PM2 + Docker Desktop + Cloudflare Tunnel!)
        (
            "Trong môi trường phát triển cục bộ và thử nghiệm, toàn bộ hạ tầng hệ thống được container hóa",
            "Để tối ưu tài nguyên bộ nhớ khi triển khai đầy đủ 14 microservices và các cổng web trên máy chủ Apple Silicon (macOS, 16 GB RAM), hệ thống áp dụng mô hình triển khai lai (Hybrid Native + Container) kết hợp PM2, Docker Desktop và Cloudflare Zero Trust Tunnel như minh họa ở Hình 4.2.",
            None,
        ),
        (
            "Mô hình triển khai phân định rõ các container hạ tầng độc lập: Cụm CSDL PostgreSQL được khởi tạo tự động 11 database",
            "Cụ thể, toàn bộ lưu lượng Internet từ 4 cổng Web và 2 ứng dụng Mobile APK đều đi qua một cổng vào bảo mật duy nhất là Cloudflare Edge (*.nexus-ex.site, tự động cấp SSL/TLS) nối vào tiến trình cloudflared (LaunchDaemon) mà không cần mở cổng router hay IP tĩnh. Bên trong máy chủ, PM2 quản lý trực tiếp 15 tiến trình Node.js gọn nhẹ (ecosystem.config.cjs) gồm máy chủ web tĩnh kiêm reverse proxy (nexus-static-web), gateway-bff (:3000), 12 dịch vụ nghiệp vụ (:3001–:3012) và chatbot-service (:3013), giúp tiết kiệm hơn 80% RAM so với đóng gói toàn bộ thành 23–25 container Docker. Bốn thành phần hạ tầng có trạng thái gồm PostgreSQL 16 (12 DB độc lập), RabbitMQ 3.13, Redis 7 và MinIO S3 chạy ổn định trong 4 container Docker Desktop (infra/dev/docker-compose.yml).",
            None,
        ),
        # 4.1.3 Inter-service communication (Sync + Realtime + Async RabbitMQ DLX/TTL + Partner)
        (
            "Để cân bằng giữa hiệu năng phản hồi tức thì cho người dùng và khả năng chịu tải cao, hệ thống kết hợp linh hoạt hai mô hình giao tiếp:",
            "Để cân bằng giữa thời gian phản hồi tức thì và tính tách rời (loose coupling) giữa các dịch vụ, hệ thống kết hợp ba cơ chế giao tiếp chính như thể hiện tại Hình 4.3:",
            None,
        ),
        (
            "Giao tiếp đồng bộ (Synchronous HTTP/RESTful & SSE): Áp dụng cho các truy vấn cần kết quả ngay lập tức",
            "Giao tiếp đồng bộ (Synchronous HTTP/REST): Dùng cho các thao tác cần kết quả ngay như định tuyến từ gateway-bff xuống các dịch vụ, shipment-service gọi pricing-service (:3012) tính cước IATA, hay các dịch vụ pickup, manifest, delivery, scan gọi GET /shipments/:code (GET Guard / Lookup) để kiểm tra điều kiện khóa đơn trước khi thao tác. Riêng chatbot-service giao tiếp qua HTTP/SSE hai chiều với Gateway và gọi các công cụ tra cứu trực tiếp sang shipment (:3002), pricing (:3012) và tracking (:3008).",
            "Giao tiếp đồng bộ (Synchronous HTTP/REST):",
        ),
        (
            "Giao tiếp hướng sự kiện phi đồng bộ (Event-Driven Architecture): Áp dụng cho toàn bộ các mốc biến động trạng thái bưu kiện",
            "Giao tiếp thời gian thực và bất đồng bộ hướng sự kiện: Kênh WebSocket hoạt động trực tiếp qua gateway-bff gồm /ws/chat đồng bộ qua Redis 7 Pub/Sub (kênh gateway-bff:chat), /ws/tasks nối tới dispatch-service (:3004) và /ws/locations nối tới scan-service (:3006). Đối với luồng đồng bộ trạng thái liên dịch vụ, 9 dịch vụ ghi áp dụng mẫu Transactional Outbox đẩy sự kiện lên RabbitMQ topic exchange domain.events (:5672). Mỗi consumer vận hành cơ chế thử lại có độ trễ bằng Dead-Letter Exchange và TTL (Main Queue <svc>.q ↔ retry.10s / retry.1m, quá 2 lần lỗi mới chuyển sang <svc>.dlq) kèm khóa chống trùng idempotency_key, phân phối tới 6 nhóm Domain Consumers và 2 CQRS Read Projections thuần đọc (tracking-service và reporting-service). Về tích hợp đối tác, DT_COMMERCE gửi đơn vào gateway-bff qua Partner HMAC, trong khi shipment-service trực tiếp bắn Status Webhook (thử lại tối đa 3 lần) về api.truongam.tech.",
            "Giao tiếp thời gian thực và bất đồng bộ hướng sự kiện:",
        ),
        (
            "Các chuyến xe tải trung chuyển đường dài giữa các Hub (Linehaul Transit) được giám sát chặt chẽ bởi linehaul-service (Port 3014).",
            "Nghiệp vụ gom bao và bàn giao các chuyến xe tải trung chuyển đường dài giữa các Hub (Linehaul Transit) được tích hợp trực tiếp trong manifest-service (cổng 3005) cùng chu trình kẹp chì niêm phong seal (SealRecord) và xác nhận nhận hàng tại Hub đích (ReceiveRecord), giúp tránh phân mảnh giao dịch khi đóng bao và xuất chuyến.",
            None,
        ),
        # 4.2 Microservices Grouping (14 services, 5 DDD groups)
        (
            "Toàn bộ nền tảng Nexus Express System được chia thành 15 microservices độc lập thuộc 6 nhóm nghiệp vụ chính:",
            "Theo hướng tiếp cận phân rã miền nghiệp vụ DDD (Hình 4.4), 14 microservices của hệ thống được tổ chức thành 5 nhóm chức năng rõ ràng: (1) Edge & API Composition Layer (gateway-bff); (2) Core Logistics Domain gồm 6 dịch vụ vận hành lõi (shipment, pickup, dispatch, manifest, scan, delivery); (3) Commercial & Finance (pricing, payment); (4) CQRS Read & AI Intelligence (tracking, reporting, chatbot); và (5) Platform & Generic Subdomain (auth, masterdata).",
            None,
        ),
        (
            "Bảng 4.1 Danh mục 15 Microservices và phân công trách nhiệm dữ liệu",
            "Bảng 4.1 Danh mục 14 Microservices và phân công trách nhiệm dữ liệu",
            None,
        ),
        (
            "Dịch vụ Cổng giao tiếp biên giới (gateway-bff - Port 3000):",
            "Dịch vụ Cổng giao tiếp trung tâm (gateway-bff - Port 3000): Là điểm tiếp nhận duy nhất cho toàn bộ 6 ứng dụng Client Web và Mobile cùng đối tác DT_COMMERCE (HMAC). Gateway thực hiện xác thực JWT RBAC, giới hạn tần suất 2.400 req/phút, định tuyến REST/WebSocket đến 13 dịch vụ nội bộ theo tiền tố URL (/merchant/*, /ops/*, /courier/*, /customer/*, /public/*, /api/*, /chat/*), cấp URL ký sẵn tải ảnh lên MinIO, lưu hội thoại vào chat_db (pg.Pool) và chuyển tiếp luồng SSE từ chatbot-service.",
            "Dịch vụ Cổng giao tiếp trung tâm (gateway-bff - Port 3000):",
        ),
        (
            "4.2.3. Nhóm Dịch vụ Thu gom, Vận hành Kho bãi và Tuyến xe Linehaul",
            "4.2.3. Nhóm Dịch vụ Thu gom, Điều phối và Vận hành Kho bãi (First-Mile & Mid-Mile)",
            None,
        ),
        (
            "Dịch vụ Bảng kê và Đóng bao niêm phong (manifest-service - Port 3005):",
            "Dịch vụ Bảng kê, Đóng bao và Trung chuyển liên Hub (manifest-service - Port 3005): Quản lý quy trình gom vận đơn vào bao trung chuyển (mã MB), niêm phong kẹp chì an ninh (SealRecord) và xác nhận bàn giao chuyến xe đường trục giữa các trung tâm khai thác (ReceiveRecord).",
            "Dịch vụ Bảng kê, Đóng bao và Trung chuyển liên Hub (manifest-service - Port 3005):",
        ),
        # Remove linehaul-service paragraph in 4.2.3 (handled separately below by deleting paragraph!)
        # 4.2.4 Insurance tiers fix
        (
            "Hệ thống thiết lập cơ chế Bảo hiểm khai giá (Declared Value Insurance): Miễn phí bảo hiểm cơ bản cho hàng hóa dưới 1.000.000đ; thu phí 0.5% giá trị khai báo đối với hàng hóa từ 1.000.000đ đến 20.000.000đ.",
            "Hệ thống áp dụng cơ chế Bảo hiểm khai giá (Declared Value Insurance) phân tầng rõ ràng: gói Tiêu chuẩn mặc định áp dụng mức bồi thường tối thiểu 4 lần cước dịch vụ đã thu (mức trần trách nhiệm 1.000.000 VNĐ/đơn đối với bưu gửi không khai giá theo Điều 25 Nghị định 47/2011/NĐ-CP và Điều 40 Luật Bưu chính 2010); gói Bảo hiểm khai giá toàn diện thu phí 0,5% đối với hàng hóa từ 1.000.000đ đến 10.000.000đ (tối thiểu 5.000đ) và 1,0% đối với hàng hóa từ 10.000.000đ đến 30.000.000đ (yêu cầu hóa đơn VAT), bồi thường 100% giá trị thiệt hại thực tế theo hạn mức trần 30.000.000 VNĐ/đơn.",
            None,
        ),

        # =====================================================================
        # 4.2.6 AI CHATBOT — 100% MATCHING CODE + NEW RAG DIAGRAMS + NATURAL STYLE
        # =====================================================================
        (
            "4.2.6. Phân hệ Trợ lý Trí tuệ Nhân tạo AI Logistics Đa tác tử (chatbot-service - Port 3013)",
            "4.2.6. Phân hệ Trợ lý AI Xử lý Khiếu nại và Tư vấn Bưu chính (chatbot-service - Port 3013)",
            None,
        ),
        (
            "4.2.6.1. Tổng quan phân hệ và Kiến trúc Heterogeneous Multi-Agent (HMAS)",
            "4.2.6.1. Tổng quan kiến trúc thành phần Hybrid RAG và Kiểm soát Rủi ro",
            None,
        ),
        (
            "Phân hệ chatbot-service là điểm đột phá công nghệ sáng giá nhất",
            "Phân hệ chatbot-service vận hành độc lập trên cổng 3013 (nền tảng NestJS, viết thuần TypeScript không phụ thuộc LangChain), phục vụ tra cứu vận đơn, dự toán cước phí, giải đáp chính sách bưu chính và tiếp nhận khiếu nại cho người dùng Web và Mobile.",
            None,
        ),
        (
            "Khác biệt hoàn toàn với kiến trúc Single-Agent RAG truyền thống vốn dễ gặp rủi ro quá tải ngữ cảnh",
            "Thay vì phụ thuộc vào một mô hình ngôn ngữ duy nhất dễ bị gián đoạn hoặc tự suy diễn mức bồi thường sai quy định, dịch vụ được tổ chức theo mô hình đường ống thành phần kết hợp đa nhà cung cấp (Hình 4.5): tách biệt chốt chặn an toàn đầu vào (Security Gatekeeper), bộ định tuyến ý định (Intent Router), nhánh truy xuất tri thức lai (Hybrid RAG Retrieval), nhánh công cụ dữ liệu thời gian thực (Logistics Tools), tác tử kiểm duyệt rủi ro (Validation Agent qua OpenRouter) và chuỗi dự phòng đa LLM (Google Gemini → Groq LPU). Đặc biệt, hệ thống áp dụng nguyên tắc Human-in-the-Loop (HITL): trợ lý AI chỉ thu thập chứng cứ, giải thích căn cứ pháp lý và mở hồ sơ, tuyệt đối không tự duyệt chuyển tiền bồi thường mà bàn giao sang bộ phận QA & Ops Web thẩm định CCTV và chi trả.",
            None,
        ),
        (
            "4.2.6.2. Chi tiết 4 Tác tử Chuyên biệt trong Hệ thống HMAS",
            "4.2.6.2. Cơ chế hoạt động chi tiết từ Offline Indexing đến Online Execution",
            None,
        ),
        (
            "Supervisor Agent (Tác tử Điều phối & Giám sát Trung tâm - Google Gemini 3.6 Flash):",
            "Giai đoạn Offline Indexing (POST /chat/ingest - KnowledgeService): Kho tri thức gồm 9 tài liệu Markdown chuẩn hóa (docs/knowledge-base/*.md về biểu cước IATA, bảo hiểm & bồi thường, hàng cấm, giao phát/NDR, COD, đóng gói hàng dễ vỡ, SLA) được ChunkerService tách theo cấu trúc tiêu đề kết hợp cửa sổ trượt (maxWordsPerChunk = 250 từ, overlap = 40 từ) tạo thành 59 phân đoạn (chunks). Sau đó, EmbeddingService gọi Google models/gemini-embedding-001 chuyển đổi sang vector 3072 chiều và lưu tại vector-index.json, được VectorStoreService nạp sẵn vào RAM khi khởi động giúp tìm kiếm dưới 5ms.",
            "Giai đoạn Offline Indexing (POST /chat/ingest - KnowledgeService):",
        ),
        (
            "Operation Agent (Tác tử Thực thi Nghiệp vụ Vận hành - Groq LPU & Meta Llama 3.3 70B):",
            "Nhánh Công cụ nghiệp vụ thời gian thực (LogisticsToolsService): Khi Intent Router nhận diện mã vận đơn (SHP-*) hoặc mã khiếu nại (CLM-*), hệ thống gọi trực tiếp các API nội bộ (shipment-service :3002, tracking-service :3008, pricing-service :3012) qua tập công cụ sau:",
            "Nhánh Công cụ nghiệp vụ thời gian thực (LogisticsToolsService):",
        ),
        (
            "escalateToHumanAgent(session_id, issue_summary, priority):",
            "Active Clarification & Bàn giao QA (Human-in-the-Loop): Khi khách báo hàng bể vỡ hoặc thất lạc nhưng chưa cung cấp mã vận đơn, hệ thống lưu trạng thái phiên (pendingIntent = 'CLAIM'), chủ động hỏi bổ sung 3 thông tin bắt buộc (mã vận đơn, ảnh hiện trạng/biên bản đồng kiểm, giá trị ước tính) kèm các nút chọn nhanh Action Chips và hướng dẫn bàn giao hồ sơ sang bộ phận QA & Ops Web giám định trong 24–48 giờ.",
            "Active Clarification & Bàn giao QA (Human-in-the-Loop):",
        ),
        (
            "Knowledge Agent (Tác tử Truy xuất Tri thức Nghiệp vụ SOP - Groq LPU & Qwen 2.5 32B):",
            "Nhánh Truy xuất tri thức lai (Hybrid Retrieval Engine - VectorStoreService.hybridSearch): Câu hỏi người dùng được xử lý song song qua hai nhánh rồi hợp nhất điểm số (như minh họa tại Hình 4.6):",
            "Nhánh Truy xuất tri thức lai (Hybrid Retrieval Engine - VectorStoreService.hybridSearch):",
        ),
        (
            "Kho tri thức chuẩn hóa 9 tài liệu SOP:",
            "Nhánh Dense Semantic (trọng số 0,70): Mã hóa câu hỏi qua gemini-embedding-001 thành vector truy vấn q ∈ R^3072 và tính độ tương đồng Cosine với 59 vector phân đoạn trong RAM: Score_dense = cos(q, d) × 0,70.",
            "Nhánh Dense Semantic (trọng số 0,70):",
        ),
        (
            "Truy xuất tương đồng Cosine (Cosine Similarity):",
            "Nhánh Sparse Keyword & Từ điển đồng nghĩa ngành (Logistics Thesaurus): Mở rộng từ khóa nghiệp vụ (ví dụ: hỏng/vỡ/bể → bể vỡ, xốp hơi, biên bản bất thường; mất/đền → thất lạc, 4 lần cước, 30 triệu, CLM) để tính điểm thưởng từ khóa Score_sparse = min(0,35; hits / |terms| × 0,35). Hai nhánh cộng gộp thành TotalScore = Score_dense + Score_sparse, lọc ngưỡng minScore ≥ 0,15 và lấy Top-5 đoạn tri thức kèm danh sách trích dẫn Citations[].",
            "Nhánh Sparse Keyword & Từ điển đồng nghĩa ngành (Logistics Thesaurus):",
        ),
        (
            "Validation Agent / Safety Gatekeeper (Tác tử Kiểm soát An toàn & Tuân thủ - Groq Safeguard & NVIDIA Nemotron):",
            "Chốt chặn An toàn Stage-0 và Validation Agent (OpenRouter - nvidia/nemotron-3.5-lightning:free): Hệ thống kết hợp hai lớp kiểm soát độc lập để ngăn rủi ro bảo mật và tài chính:",
            "Chốt chặn An toàn Stage-0 và Validation Agent (OpenRouter - nvidia/nemotron-3.5-lightning:free):",
        ),
        (
            "Kiểm soát an toàn đầu vào (Input Guard):",
            "Chốt chặn Stage-0 (Security Gatekeeper): Kiểm tra ngay trước khi gọi LLM nhằm chặn các mẫu tấn công tiêm lệnh (OWASP LLM01), yêu cầu xuất hàng loạt dữ liệu cá nhân PII (OWASP LLM02 theo Điều 8 Luật Bưu chính & NĐ 13/2023), truy cập chéo đơn của người khác (IDOR) và chặn dứt điểm các yêu cầu ép AI tự duyệt chuyển tiền bồi thường.",
            "Chốt chặn Stage-0 (Security Gatekeeper):",
        ),
        (
            "Kiểm soát an toàn và tuân thủ đầu ra (Output Guard):",
            "Validation Agent (callValidationAgent): Với các thao tác làm thay đổi trạng thái đơn hàng hoặc liên quan tài chính (CANCEL_ORDER, REFUND_PAYOUT, CHANGE_ADDRESS), dịch vụ gọi mô hình nvidia/nemotron-3.5-lightning:free qua OpenRouter trả về JSON cấu trúc {approved, requiresHitl, risk, reason}. Nếu phát hiện rủi ro cao (requiresHitl = true), yêu cầu được leo thang bắt buộc sang nhân sự QA & Ops Web phê duyệt.",
            "Validation Agent (callValidationAgent):",
        ),
        (
            "4.2.6.3. Cơ chế Dự phòng 5 tầng (5-Tier Resilience Cascade) và Luồng Truyền dữ liệu SSE",
            "4.2.6.3. Cơ chế Dự phòng Đa mô hình (Multi-LLM Waterfall) và Truyền luồng SSE",
            None,
        ),
        (
            "Cơ chế Chuyển đổi Dự phòng 5 tầng (5-Tier Resilience Cascade): Nhằm đảm bảo chỉ số sẵn sàng cao (High Availability đạt 99.99%)",
            "Sau khi Context Assembler ghép ngữ cảnh hợp lệ (quy định pháp lý NĐ 47/Luật Bưu chính + dữ liệu phiên + JSON đơn hàng/khiếu nại thực tế + Top-5 đoạn SOP), hàm ChatService.executeLlm thực thi chuỗi gọi mô hình dự phòng theo thứ tự (timeout 4 giây cho mỗi bước fallback) sử dụng 3 API key hoạt động thực tế (GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY):",
            None,
        ),
        (
            "Tier 1 (Tầng 1 - Điều phối chính): Google Gemini 3.6 Flash",
            "Bước 1 (Primary LLM - Google AI Studio): Mô hình gemini-3.5-flash-lite xử lý chính câu hỏi dựa trên toàn bộ ngữ cảnh đã ghép, đảm bảo tốc độ phản hồi nhanh và diễn đạt tiếng Việt tự nhiên.",
            "Bước 1 (Primary LLM - Google AI Studio):",
        ),
        (
            "Tier 2 (Tầng 2 - Tác vụ vận hành): Groq LPU với Meta Llama 3.3 70B",
            "Bước 2 (Operation Fallback - Groq LPU): Nếu bước 1 gặp lỗi hoặc vượt hạn mức (HTTP 429) và ngữ cảnh có dữ liệu thời gian thực từ công cụ nghiệp vụ (isToolContext), hệ thống chuyển sang openai/gpt-oss-120b trên Groq LPU (timeout 4 giây).",
            "Bước 2 (Operation Fallback - Groq LPU):",
        ),
        (
            "Tier 3 (Tầng 3 - Tác vụ tri thức): Groq LPU với Qwen 2.5 32B",
            "Bước 3 (Knowledge Fallback - Groq LPU): Nếu ngữ cảnh thuộc nhóm tra cứu quy định SOP/pháp lý (isKnowledgeContext) hoặc bước 2 không phản hồi kịp, hệ thống chuyển sang qwen/qwen3.8-27b trên Groq LPU (timeout 4 giây).",
            "Bước 3 (Knowledge Fallback - Groq LPU):",
        ),
        (
            "Tier 4 (Tầng 4 - Dự phòng toàn diện): OpenAI GPT-4o-mini",
            "Bước 4 (Dự phòng mở rộng - OpenAI Compatible): Hỗ trợ cấu hình tùy chọn qua biến môi trường OPENAI_API_KEY nếu doanh nghiệp cần bổ sung thêm nhà cung cấp dự phòng thứ tư (hiện để trống trong môi trường triển khai thực tế để tối ưu chi phí).",
            "Bước 4 (Dự phòng mở rộng - OpenAI Compatible):",
        ),
        (
            "Tier 5 (Tầng 5 - Cứu hộ nội bộ Offline Semantic Demo Engine):",
            "Bước 5 (Fallback cục bộ khi mất kết nối đám mây): Trường hợp toàn bộ API LLM bên ngoài đều gián đoạn, dịch vụ trả về phản hồi có cấu trúc trực tiếp từ kết quả công cụ tra cứu và đoạn trích SOP phù hợp nhất, tránh lỗi trắng màn hình.",
            "Bước 5 (Fallback cục bộ khi mất kết nối đám mây):",
        ),
        (
            "Giao thức Server-Sent Events (SSE) với Tốc độ Sinh nhịp gõ 25ms:",
            "Giao thức truyền luồng Server-Sent Events (SSE): Endpoint POST /chat/stream trả kết quả về giao diện người dùng theo từng đoạn văn bản nhỏ qua kết nối HTTP chuẩn (khoảng cách phát mỗi đoạn 25ms) kèm sự kiện kết thúc chứa latencyMs và Citations[], giúp giao diện hiển thị phản hồi sớm hơn và gọn nhẹ hơn so với việc mở thêm kết nối WebSocket riêng cho chatbot.",
            "Giao thức truyền luồng Server-Sent Events (SSE):",
        ),
        (
            "Điểm khác biệt vượt trội của phân hệ AI Logistics so với các chatbot thông thường",
            "Bên cạnh nội dung văn bản, phản hồi từ chatbot-service trả kèm cấu trúc dữ liệu (Structured Payload) để giao diện Web (React) và Mobile (React Native) hiển thị trực tiếp các thành phần tương tác:",
            None,
        ),

        # 4.3 Database-per-Service (matching Hình 4.7!)
        (
            "Hệ thống tuân thủ nghiêm ngặt nguyên tắc Database-per-service: mỗi microservice sở hữu một cơ sở dữ liệu hoặc schema",
            "Hệ thống áp dụng nguyên tắc Database-per-Service kết hợp lưu trữ đa mô hình (Polyglot Persistence) như trình bày ở Hình 4.7. Toàn bộ 12 cơ sở dữ liệu quan hệ trên PostgreSQL 16 (khởi tạo qua infra/dev/postgres/init-multiple-dbs.sql) được cấp chuỗi kết nối DATABASE_URL riêng cho từng dịch vụ: 9 cơ sở dữ liệu ghi nghiệp vụ (Prisma + OutboxEvent), 2 cơ sở dữ liệu đọc CQRS thuần đọc (tracking_db, reporting_db, không có Outbox) và chat_db do gateway-bff quản lý trực tiếp qua pg.Pool. Hai dịch vụ còn lại không dùng RDBMS là pricing-service (stateless in-memory rules) và chatbot-service (Local Vector Store vector-index.json nạp RAM). Các dịch vụ tuyệt đối không thực hiện SQL JOIN hoặc đặt khóa ngoại vật lý liên cơ sở dữ liệu, mà liên kết qua khóa logic có đánh chỉ mục (shipmentCode, hubCode, courierId).",
            None,
        ),
        (
            "Bảng 4.2 Thiết kế 11 Cơ sở dữ liệu PostgreSQL và CSDL Vector RAG",
            "Bảng 4.2 Thiết kế 12 Cơ sở dữ liệu PostgreSQL và các kho lưu trữ chuyên biệt",
            None,
        ),
        (
            "Để đảm bảo tính nhất quán dữ liệu xuyên suốt 15 microservices độc lập",
            "Để đảm bảo tính nhất quán dữ liệu giữa 14 microservices độc lập mà không dùng giao dịch phân tán hai pha (2PC), hệ thống áp dụng các quy tắc kỹ thuật sau:",
            None,
        ),

        # =====================================================================
        # CHAPTER 6 — REAL DEPLOYMENT (Mac Apple Silicon + PM2 + 4 Docker + Cloudflare)
        # =====================================================================
        (
            "6.1.1. Môi trường máy chủ triển khai thực tế trên VPS",
            "6.1.1. Môi trường máy chủ triển khai thực tế (Apple Silicon + PM2 + Docker + Cloudflare)",
            None,
        ),
        (
            "Để kiểm chứng năng lực vận hành trong điều kiện thực tế của một nền tảng bưu chính trực tuyến, hệ thống Nexus Express System đã được triển khai và cấu hình vận hành hoàn chỉnh trên một máy chủ riêng ảo (VPS",
            "Để vận hành trọn vẹn 14 microservices, các ứng dụng web và 4 dịch vụ hạ tầng với mức tiêu thụ bộ nhớ hợp lý, hệ thống được triển khai thực tế trên máy chủ Apple Silicon (macOS, chip Apple M4, 16 GB RAM). Thay vì chạy 23–25 container Docker gây tốn RAM, toàn bộ 15 tiến trình Node.js được quản lý trực tiếp bằng PM2 (ecosystem.config.cjs), 4 thành phần hạ tầng có trạng thái chạy trong Docker Desktop và toàn bộ tên miền *.nexus-ex.site được công khai an toàn qua Cloudflare Zero Trust Tunnel (cloudflared).",
            None,
        ),
        (
            "Bảng 6.1. Thông số cấu hình môi trường máy chủ VPS thực tế",
            "Bảng 6.1. Thông số cấu hình môi trường triển khai thực tế",
            None,
        ),
        (
            "• services/: Chứa mã nguồn của 15 microservices backend độc lập",
            "• services/: Chứa mã nguồn của 14 microservices backend độc lập (12 dịch vụ nghiệp vụ NestJS, 1 dịch vụ gateway-bff và 1 dịch vụ chatbot-service).",
            "• services/:",
        ),
        (
            "• infra/: Chứa toàn bộ kịch bản hạ tầng phát triển cục bộ (infra/dev) và kịch bản triển khai môi trường máy chủ VPS",
            "• infra/: Chứa cấu hình Docker Compose khởi chạy 4 container hạ tầng nền tảng (PostgreSQL 16, RabbitMQ 3.13, Redis 7, MinIO S3) và kịch bản init-multiple-dbs.sql khởi tạo 12 cơ sở dữ liệu độc lập.",
            "• infra/:",
        ),
        (
            "Phân hệ chatbot-service vận hành độc lập trên cổng 3013, chịu trách nhiệm cung cấp năng lực trợ lý ảo AI thông minh dựa trên kiến trúc Đa tác tử không đồng nhất (HMAS).",
            "Phân hệ chatbot-service vận hành độc lập trên cổng 3013, cung cấp năng lực tra cứu vận đơn, giải đáp quy định bưu chính và tiếp nhận khiếu nại qua kiến trúc Hybrid RAG (vector 3072 chiều) kết hợp chuỗi dự phòng đa mô hình (Gemini → Groq LPU → OpenRouter Validation) và truyền luồng SSE.",
            None,
        ),
        (
            "Sau khi hoàn thiện các phân hệ chức năng, hệ thống Nexus Express System được triển khai thực tế trên máy chủ riêng ảo VPS tại địa chỉ IP 103.82.20.51.",
            "Sau khi hoàn thiện các phân hệ chức năng, toàn bộ hệ thống Nexus Express được đưa vào vận hành thực tế theo mô hình Hybrid (PM2 + Docker Desktop + Cloudflare Tunnel) với hệ thống tên miền chính thức *.nexus-ex.site, phục vụ đồng thời 4 cổng Web và 2 ứng dụng di động Android APK.",
            None,
        ),
        (
            "6.3.1. Bản đồ định tuyến tên miền và phân luồng dịch vụ qua Nginx Reverse Proxy",
            "6.3.1. Bản đồ định tuyến tên miền và phân luồng dịch vụ qua Cloudflare Tunnel",
            None,
        ),
        (
            "Trên máy chủ VPS, Nginx đóng vai trò là Host-level Reverse Proxy tiếp nhận toàn bộ lưu lượng cổng 80",
            "Lưu lượng truy cập từ trình duyệt Web và ứng dụng Mobile APK đều đi vào Cloudflare Edge qua giao thức HTTPS/WSS (tự động cấp chứng chỉ SSL/TLS cho *.nexus-ex.site), sau đó đi qua đường hầm outbound bảo mật cloudflared (LaunchDaemon) về máy chủ nội bộ. Các cổng web được phục vụ bởi tiến trình nexus-static-web (scripts/serve-static-apps.mjs), đồng thời chuyển tiếp toàn bộ đường dẫn API (/ops/*, /merchant/*, /admin/*, /customer/*, /courier/*, /public/*, /api/*, /chat/*, /ws/*) trực tiếp sang gateway-bff (:3000).",
            None,
        ),
        (
            "Bảng 6.3. Bản đồ định tuyến tên miền chính thức và phân luồng dịch vụ qua Nginx",
            "Bảng 6.3. Bản đồ định tuyến tên miền chính thức qua Cloudflare Tunnel và Static Reverse Proxy",
            None,
        ),
        (
            "6.3.2. Đóng gói Container hóa và danh mục Container vận hành bằng Docker Compose",
            "6.3.2. Danh mục 15 Tiến trình PM2 và 4 Container Hạ tầng Docker Desktop",
            None,
        ),
        (
            "Toàn bộ hệ thống được đóng gói và quản lý tập trung thông qua Docker Compose với file cấu hình infra/prod/docker-compose.yml.",
            "Hệ thống tách riêng phần ứng dụng Node.js (chạy trực tiếp qua PM2 với file ecosystem.config.cjs, tổng mức chiếm dụng RAM khoảng 500 MB) và phần hạ tầng lưu trữ/hàng đợi (đóng gói trong 4 container Docker Desktop tại infra/dev/docker-compose.yml) như liệt kê trong Bảng 6.4:",
            None,
        ),
        (
            "Bảng 6.4. Danh mục hệ thống Container vận hành bằng Docker Compose trên VPS",
            "Bảng 6.4. Danh mục 15 tiến trình PM2 và 4 container hạ tầng Docker Desktop",
            None,
        ),
        (
            "Tuân thủ nghiêm ngặt nguyên tắc Database-per-service của kiến trúc Microservices, hệ thống phân chia rõ ràng ranh giới sở hữu dữ liệu. Mặc dù cùng vận hành trên một cụm container PostgreSQL tối ưu tài nguyên trên VPS",
            "Theo nguyên tắc Database-per-Service, dù cùng nằm trên một container PostgreSQL 16 (:15432 → 5432) để tiết kiệm tài nguyên, hệ thống khởi tạo 12 cơ sở dữ liệu tách biệt qua script infra/dev/postgres/init-multiple-dbs.sql và cấp kết nối riêng cho từng dịch vụ như Bảng 6.5:",
            None,
        ),
        (
            "Bảng 6.5. Danh mục 12 Cơ sở dữ liệu PostgreSQL độc lập trên máy chủ VPS",
            "Bảng 6.5. Danh mục 12 Cơ sở dữ liệu PostgreSQL độc lập trong hệ thống",
            None,
        ),
        (
            "Trong môi trường triển khai thực tế trên mạng Internet, an toàn thông tin là yêu cầu tiên quyết. Toàn bộ các tên miền phụ của hệ thống đều được cấp chứng chỉ bảo mật số SSL/TLS thông qua Let's Encrypt",
            "Toàn bộ các tên miền con thuộc *.nexus-ex.site được Cloudflare Edge tự động mã hóa bằng SSL/TLS (HTTPS/WSS), không cần mở cổng 80/443 trên mạng cục bộ và tránh lộ địa chỉ IP gốc của máy chủ.",
            None,
        ),
        (
            "• Để xử lý vấn đề này, quy trình build tự động của hệ thống nhúng trực tiếp biến môi trường GATEWAY_PUBLIC_URL=https://ops.nexus-ex.site",
            "• Để xử lý triệt để lỗi Mixed Content trên trình duyệt, mỗi ứng dụng Web gọi API theo cùng gốc tên miền HTTPS (same-origin) hoặc qua địa chỉ HTTPS chính thức, sau đó nexus-static-web chuyển tiếp nội bộ về gateway-bff (http://127.0.0.1:3000) và nâng cấp kết nối WebSocket (HTTP 101 Switching Protocols) an toàn.",
            None,
        ),
        (
            "• Giới hạn tần suất truy cập (Rate Limiting): Kích hoạt GATEWAY_RATE_LIMIT_ENABLED=true với cửa sổ thời gian GATEWAY_RATE_LIMIT_WINDOW_MS=60000 (1 phút) và ngưỡng tối đa GATEWAY_RATE_LIMIT_MAX=120",
            "• Giới hạn tần suất truy cập (Rate Limiting): Kích hoạt GATEWAY_RATE_LIMIT_ENABLED=true với cửa sổ 60 giây và ngưỡng mặc định 2.400 req/phút (GATEWAY_RATE_LIMIT_MAX=2400 trong gateway-http-controls.ts) phù hợp cho lưu lượng quét mã kho và cập nhật realtime, bỏ qua /health và /metrics.",
            "• Giới hạn tần suất truy cập (Rate Limiting):",
        ),
        (
            "• Kiểm soát nguồn gốc truy cập (CORS Policy): Thiết lập danh sách trắng CORS_ORIGINS bao gồm toàn bộ tên miền chính thức (*.nexus-ex.site) và địa chỉ IP VPS",
            "• Kiểm soát nguồn gốc truy cập (CORS Policy): Thiết lập danh sách trắng CORS_ORIGINS chỉ cho phép các tên miền chính thức thuộc *.nexus-ex.site và môi trường kiểm thử nội bộ.",
            "• Kiểm soát nguồn gốc truy cập (CORS Policy):",
        ),
        (
            "6.3.6. Quy trình tự động hóa triển khai và kiểm thử sức khỏe dịch vụ trên VPS",
            "6.3.6. Quy trình khởi chạy hạ tầng và kiểm thử sức khỏe dịch vụ",
            None,
        ),
        (
            "Quy trình triển khai trên VPS được thiết kế tự động hóa hoàn toàn thông qua kịch bản Bash Shell scripts/deploy-vps.sh",
            "Quy trình khởi chạy môi trường thực tế trên máy chủ Apple Silicon được chuẩn hóa theo các bước tuần tự:",
            None,
        ),
        (
            "1. Tải và kiểm tra các biến môi trường cấu hình tại infra/prod/.env.",
            "1. Khởi chạy 4 container hạ tầng nền tảng (postgres, rabbitmq, redis, minio) qua docker compose -f infra/dev/docker-compose.yml up -d và chờ trạng thái healthy.",
            None,
        ),
        (
            "2. Biên dịch đồng thời các Docker images của các dịch vụ backend",
            "2. Kiểm tra khởi tạo 12 cơ sở dữ liệu PostgreSQL (init-multiple-dbs.sql) và đồng bộ lược đồ Prisma cho 11 dịch vụ nghiệp vụ; chat_db được gateway-bff tự động chạy migration qua pg.Pool khi khởi động.",
            None,
        ),
        (
            "3. Khởi chạy cụm hạ tầng nền tảng (postgres, rabbitmq, redis, minio)",
            "3. Biên dịch mã nguồn TypeScript cho 14 microservices và build bản production (dist/) cho các ứng dụng Web React/Vite.",
            None,
        ),
        (
            "4. Tự động kiểm tra và khởi tạo 12 cơ sở dữ liệu PostgreSQL vật lý (ensure_databases).",
            "4. Khởi động đồng loạt 15 tiến trình Node.js bằng lệnh pm2 start ecosystem.config.cjs (tự động khởi động lại khi lỗi, giới hạn bộ nhớ 500 MB/service).",
            None,
        ),
        (
            "5. Khởi chạy container tạm thời node:20-alpine kết nối vào mạng nội bộ Docker để thực thi lệnh prisma db push",
            "5. Kiểm tra tiến trình cloudflared LaunchDaemon đang kết nối ổn định tới Cloudflare Edge cho các tên miền *.nexus-ex.site.",
            None,
        ),
        (
            "6. Tự động nạp dữ liệu mẫu ban đầu (seed_auth_demo_data",
            "6. Nạp dữ liệu danh mục Hub 4 cấp, Zone, tài khoản mẫu và thực thi POST /chat/ingest để đồng bộ 59 phân đoạn SOP (3072 chiều) cho chatbot-service.",
            None,
        ),
        (
            "7. Khởi chạy toàn bộ stack dịch vụ bằng lệnh docker compose up -d --remove-orphans.",
            "7. Kiểm tra trạng thái chạy của toàn bộ tiến trình qua pm2 status và xác minh phản hồi HTTP 200 tại các endpoint /health qua HTTPS (https://ops.nexus-ex.site/health).",
            None,
        ),
        (
            "8. Kích hoạt vòng lặp kiểm tra sức khỏe tự động (wait_http_health)",
            "8. Đóng gói và cài đặt 2 ứng dụng di động Customer Mobile và Courier Mobile (React Native/Expo) kết nối trực tiếp về gateway qua tên miền HTTPS.",
            None,
        ),
        (
            "Kết quả kiểm tra thực tế cho thấy toàn bộ 25 container của hệ thống đều vận hành ổn định trên máy chủ VPS",
            "Kết quả vận hành thực tế cho thấy cả 15 tiến trình PM2 và 4 container hạ tầng Docker Desktop hoạt động ổn định, đáp ứng tốt các kịch bản kiểm thử trên 4 cổng Web và 2 ứng dụng Mobile APK.",
            None,
        ),
        # 6.4.3 Nhận xét (clean separation between 153 functional TCs and 100 readiness TCs)
        (
            "Hệ thống Nexus Express System đã bao phủ toàn diện và vượt qua đầy đủ các bài kiểm tra thực tế: toàn bộ 153/153",
            "Về kiểm thử chức năng (Mục 6.4.1), toàn bộ 153/153 kịch bản bao phủ 69 Use Case của 6 nhóm tác nhân đều đạt kết quả đúng kỳ vọng. Các luồng cốt lõi từ tạo đơn, tính cước IATA V/6000, điều phối lấy/giao hàng, đóng bao niêm phong manifest, phát hàng kèm ảnh POD/OTP, xử lý NDR/chuyển hoàn đến đối soát COD qua SePay đều hoạt động ổn định.",
            None,
        ),
        (
            "Phần bảo mật và hạ tầng hiện đã có nền tảng vững chắc cho một hệ thống phân tán triển khai thực tế trên máy chủ VPS",
            "Về kiểm thử kỹ thuật và mức độ sẵn sàng vận hành (Mục 6.4.2), hệ thống đạt 83/100 tiêu chí (83,0%). Các hạng mục nền tảng như xác thực JWT, kiểm soát tải tại gateway-bff (Rate Limit 2.400 req/phút, Body Limit 1 MB), HTTPS qua Cloudflare Tunnel, truyền thông bất đồng bộ RabbitMQ (Outbox + DLX/TTL Retry) và cô lập 12 cơ sở dữ liệu PostgreSQL đều đạt yêu cầu. 17 tiêu chí chưa đạt chủ yếu thuộc nhóm hạ tầng doanh nghiệp quy mô lớn (như tách riêng linehaul-service quản lý đội xe, Saga compensation đầy đủ, mTLS nội bộ, backup tự động lên cloud và Distributed Tracing), được ghi nhận làm hướng phát triển tiếp theo.",
            None,
        ),
        (
            "Kết quả 83 PASS / 17 FAILED tương ứng 83.0% PASS. Đây là mức đánh giá hợp lý:",
            "Việc đánh giá tách bạch giữa kiểm thử chức năng (153/153 đạt) và kiểm thử tiêu chuẩn production (83/100 đạt) phản ánh trung thực phạm vi đạt được của đồ án tốt nghiệp cũng như các hạng mục cần đầu tư thêm khi mở rộng lên quy mô thương mại.",
            None,
        ),

        # =====================================================================
        # CHAPTER 7 — NATURAL ACADEMIC PROSE + 100% REAL ARCHITECTURE FACTS
        # =====================================================================
        (
            "Mục tiêu cốt lõi của chương này là đánh giá toàn diện mức độ đáp ứng của hệ thống quản lý logistics bưu chính đa kênh Nexus Express System sau quá trình phân tích, thiết kế và triển khai thực tế trên máy chủ VPS",
            "Chương này đánh giá mức độ đáp ứng của hệ thống Nexus Express sau khi triển khai thực tế trên hạ tầng Apple Silicon (PM2 + 4 Docker containers + Cloudflare Tunnel) với tên miền *.nexus-ex.site. Việc đánh giá tập trung vào hai khía cạnh: mức độ đầy đủ của 69 Use Case nghiệp vụ và các chỉ số kỹ thuật định lượng về độ trễ, thông lượng, bảo mật biên và chất lượng phân hệ trợ lý AI Hybrid RAG.",
            None,
        ),
        (
            "Bên cạnh việc kiểm thử chu trình vận hành khép kín của vận đơn (tạo đơn, tiếp nhận bưu gửi, nhập kho bưu cục, đóng bao manifest, điều phối xe tuyến trung chuyển linehaul",
            "Bên cạnh luồng vận hành vận đơn khép kín qua 6 nhóm tác nhân, chương này trình bày kết quả thực nghiệm định lượng đối với phân hệ chatbot-service trên bộ dữ liệu N = 100 kịch bản bưu chính và an toàn thông tin (đo lường Groundedness, Tool Accuracy, độ trễ phản hồi và kiểm định thống kê Wilcoxon Signed-Rank Test cùng hệ số Cohen's d).",
            None,
        ),
        (
            "Đánh giá hiệu năng được tiến hành nhằm xác định các chỉ số kỹ thuật vận hành cốt lõi của hệ thống khi chạy thực tế trên máy chủ VPS",
            "Đánh giá hiệu năng được thực hiện trên môi trường triển khai thực tế (Apple Silicon M4, 16 GB RAM, PM2 + 4 Docker containers qua Cloudflare Tunnel), tập trung vào các API có tần suất gọi cao: xác thực JWT, tạo đơn kèm tính cước IATA, tra cứu Read Model hành trình, quét mã kho, tải ảnh POD lên MinIO và truyền luồng SSE từ chatbot-service.",
            None,
        ),
        (
            "Đánh giá bảo mật được tiến hành nhằm kiểm tra các lớp phòng thủ đa tầng (Defense in Depth) của hệ thống trong môi trường phân tán: cơ chế phòng vệ chu vi tại API Gateway/BFF (lọc nguồn gốc CORS cho đúng 7 subdomain chính thức, giới hạn tần suất truy cập Rate Limiting 120",
            "Đánh giá bảo mật kiểm tra các lớp kiểm soát truy cập gồm: phòng vệ lớp biên tại gateway-bff (lọc nguồn gốc CORS cho *.nexus-ex.site, giới hạn tần suất 2.400 req/phút, giới hạn tải trọng 1 MB), xác thực JWT và phân quyền RBAC ngăn truy cập chéo dữ liệu giữa các tài khoản (BOLA/IDOR), xác thực Partner HMAC (DT_COMMERCE) và kiểm tra chữ ký Webhook thanh toán SePay.",
            None,
        ),
        (
            "Quá trình kiểm thử chức năng được triển khai trực tiếp trên môi trường máy chủ VPS (103.82.20.51)",
            "Quá trình kiểm thử chức năng được tiến hành trên môi trường triển khai thực tế với đầy đủ tài khoản thuộc 6 nhóm tác nhân. Kết quả 153 kịch bản kiểm thử (Mục 6.4.1) được tổng hợp trong Bảng 7.1:",
            None,
        ),
        (
            "Đo lường hiệu năng kỹ thuật được thực hiện trên môi trường máy chủ VPS (103.82.20.51, Ubuntu 22.04 LTS",
            "Đo lường hiệu năng được thực hiện trên môi trường triển khai thực tế (macOS Apple M4, 16 GB RAM, PM2 15 tiến trình + 4 container Docker Desktop qua Cloudflare Tunnel). Bảng 7.2 tổng hợp độ trễ và thông lượng đo được:",
            None,
        ),
        (
            "Bảng 7.2. Kết quả đo lường hiệu năng và độ trễ phản hồi trên máy chủ VPS",
            "Bảng 7.2. Kết quả đo lường hiệu năng và độ trễ phản hồi trên môi trường triển khai thực tế",
            None,
        ),
        (
            "Phân tích kết quả tại Bảng 7.2 cho thấy thời gian phản hồi trung bình của đa số các dịch vụ đều nằm dưới 200 ms, đáp ứng xuất sắc tiêu chuẩn",
            "Kết quả tại Bảng 7.2 cho thấy thời gian phản hồi trung bình của phần lớn API nghiệp vụ đều dưới 200 ms. Tác vụ tra cứu hành trình tại tracking-service đạt 32 ms nhờ đọc trực tiếp từ Read Model PostgreSQL (tracking_db) đã tách biệt khỏi CSDL ghi của shipment-service. Thao tác quét mã đạt 62 ms nhờ đẩy sự kiện bất đồng bộ qua RabbitMQ. Đối với chatbot-service, thời gian xuất hiện từ đầu tiên (TTFT) đạt 420 ms qua SSE.",
            None,
        ),
        (
            "Bộ thực nghiệm tự động hóa N = 100 kịch bản đã thu được các kết quả định lượng hết sức ấn tượng:",
            "Thực nghiệm tự động trên bộ N = 100 kịch bản ghi nhận tỷ lệ đạt 89,0% (vượt ngưỡng mục tiêu 85,0%), điểm chất lượng trung bình 85,18 ± 19,79 / 100 và điểm Likert trung bình 4,19 / 5,00. Ở nhóm kịch bản tấn công an toàn, chốt chặn Stage-0 kết hợp Validation Agent đạt tỷ lệ phát hiện rủi ro 100,0% (ASR = 0,0%).",
            None,
        ),
        (
            "Dữ liệu Bảng 7.4 và Bảng 7.5 minh chứng tính ưu việt của phân hệ HMAS: 87.0% câu trả lời đạt mức Tốt và Xuất sắc (Level 4 và Level 5). Trong nhóm an toàn bảo mật (ADVERSARIAL_SAFETY), tác tử Security Gatekeeper (Llama Guard 3 8B)",
            "Từ Bảng 7.4 và Bảng 7.5 có thể thấy 87,0% phản hồi đạt mức Tốt và Xuất sắc (Level 4–5). Riêng nhóm an toàn bảo mật (ADVERSARIAL_SAFETY), lớp chốt chặn Stage-0 OWASP/PII kết hợp Validation Agent (OpenRouter nvidia/nemotron-3.5-lightning:free) chặn được toàn bộ 28/28 kịch bản tiêm lệnh, lộ PII và ép duyệt chi bồi thường.",
            None,
        ),
        (
            "Bộ lọc kiểm soát chu vi tại Gateway-BFF phát huy tối đa hiệu quả trong việc ngăn chặn các hành vi tấn công từ Internet: cấu hình giới hạn tần suất Rate Limiting (120",
            "Ở lớp biên, gateway-bff xử lý đúng các kiểm thử giới hạn tần suất (trả mã HTTP 429 khi vượt ngưỡng cấu hình 2.400 req/phút), từ chối payload vượt 1 MB, kiểm tra nguồn gốc CORS cho *.nexus-ex.site và xác thực chữ ký HMAC cho đối tác DT_COMMERCE cũng như Webhook thanh toán SePay.",
            None,
        ),
        (
            "Toàn bộ 25 Docker containers (15 microservices nghiệp vụ, 12 cơ sở dữ liệu PostgreSQL độc lập, Nginx Reverse Proxy",
            "Trong quá trình kiểm thử vận hành, toàn bộ 15 tiến trình Node.js quản lý bởi PM2 và 4 container hạ tầng Docker Desktop (PostgreSQL 16, RabbitMQ 3.13, Redis 7, MinIO S3) cùng đường hầm cloudflared duy trì trạng thái ổn định (Healthy). Các endpoint /health và /metrics hỗ trợ theo dõi nhanh mức sử dụng CPU, RAM và tình trạng hàng đợi RabbitMQ.",
            None,
        ),
        (
            "Các kết quả kiểm thử định lượng và định tính cho thấy kiến trúc phân tán Microservices kết hợp hướng sự kiện (Event-Driven Architecture) là một lựa chọn hoàn toàn đúng đắn",
            "Các kết quả thực nghiệm cho thấy việc tổ chức hệ thống thành 14 microservices độc lập theo nguyên tắc Database-per-Service (12 cơ sở dữ liệu PostgreSQL) giúp cô lập sự cố tốt hơn và giảm tranh chấp khóa bảng giữa luồng ghi (Write Path) và luồng đọc tra cứu (Read Path).",
            None,
        ),
        (
            "Đặc biệt, kết quả thực nghiệm học thuật trên bộ dữ liệu N = 100 kịch bản đã chứng minh sức mạnh vượt trội của kiến trúc Đa tác tử dị thể HMAS",
            "Đối với phân hệ trợ lý AI, việc tách rõ 4 lớp xử lý gồm Security Gatekeeper, Hybrid RAG (kết hợp Dense Cosine 3072 chiều và Sparse Keyword/Thesaurus), Logistics Tools và Multi-LLM Waterfall (Gemini → Groq LPU → OpenRouter Validation) giúp giảm tỷ lệ sai lệch thông tin từ 18,8% ở Baseline 1 xuống còn 5,2% và đạt độ chính xác gọi công cụ 100,0% trên tập thử nghiệm.",
            None,
        ),
        (
            "Việc triển khai thành công hệ sinh thái trên máy chủ VPS thực tế với hệ thống tên miền chính thức (*.nexus-ex.site) và chứng chỉ bảo mật SSL Let's Encrypt",
            "Việc vận hành thực tế toàn bộ hệ thống trên Apple Silicon qua PM2, Docker Desktop và Cloudflare Tunnel (*.nexus-ex.site) cho thấy tính khả thi của kiến trúc lai trong điều kiện nguồn lực phần cứng giới hạn, đồng thời ứng dụng di động React Native/Expo đáp ứng tốt thao tác quét mã và đồng bộ ngoại tuyến.",
            None,
        ),
        # 7.5 Ưu điểm (natural concise)
        (
            "1. Kiến trúc phân tán chuẩn mực và cô lập dữ liệu tuyệt đối: Áp dụng triệt để nguyên lý Microservices",
            "1. Cô lập dữ liệu rõ ràng theo Database-per-Service: 14 microservices tách bạch 12 cơ sở dữ liệu PostgreSQL độc lập (kèm pricing stateless và vector store trong RAM), kết hợp gateway-bff tập trung hóa xác thực, định tuyến và kiểm soát tải.",
            "1. Cô lập dữ liệu rõ ràng theo Database-per-Service:",
        ),
        (
            "2. Nền tảng điều phối sự kiện (Event-Driven Architecture) vững chắc: Sử dụng RabbitMQ làm xương sống",
            "2. Đồng bộ sự kiện an toàn qua RabbitMQ: Áp dụng Transactional Outbox trên 9 dịch vụ ghi, kết hợp hàng đợi thử lại theo TTL (retry.10s, retry.1m, .dlq) và khóa Idempotency nhằm hạn chế mất sự kiện hoặc xử lý trùng lặp.",
            "2. Đồng bộ sự kiện an toàn qua RabbitMQ:",
        ),
        (
            "3. Quy trình nghiệp vụ bưu chính khép kín và tự động hóa cao:",
            "3. Bao phủ trọn chu trình vận đơn bưu chính: Đáp ứng nghiệp vụ cho 6 nhóm tác nhân từ tạo đơn, tính cước IATA (V/6000), đóng bao niêm phong manifest, giao phát POD/OTP, xử lý NDR/chuyển hoàn đến đối soát COD tự động qua SePay và tích hợp đối tác DT_COMMERCE.",
            "3. Bao phủ trọn chu trình vận đơn bưu chính:",
        ),
        (
            "4. Phân hệ Trợ lý Trí tuệ Nhân tạo Đa tác tử HMAS tiên phong và an toàn: Đột phá trong việc",
            "4. Trợ lý AI Hybrid RAG có kiểm soát an toàn HITL: Kết hợp tra cứu 9 tài liệu SOP bưu chính với gọi công cụ thời gian thực, áp dụng chốt chặn OWASP/PII và bàn giao các quyết định bồi thường tài chính về bộ phận QA & Ops Web.",
            "4. Trợ lý AI Hybrid RAG có kiểm soát an toàn HITL:",
        ),
        (
            "5. Hỗ trợ vận hành thực địa đa nền tảng tối ưu:",
            "5. Hỗ trợ đa nền tảng Web và Mobile: Cung cấp 4 cổng Web cho quản trị/vận hành/shop/tra cứu công khai cùng 2 ứng dụng di động React Native/Expo (Customer Mobile và Courier Mobile) hỗ trợ quét mã camera và hàng đợi ngoại tuyến.",
            "5. Hỗ trợ đa nền tảng Web và Mobile:",
        ),
        (
            "6. Triển khai hoàn chỉnh trên hạ tầng máy chủ thực tế: Đóng gói và vận hành ổn định 25 container",
            "6. Triển khai gọn nhẹ, tiết kiệm tài nguyên: Kết hợp PM2 (15 tiến trình Node.js), 4 container hạ tầng Docker Desktop và Cloudflare Zero Trust Tunnel (*.nexus-ex.site), giúp hệ thống chạy ổn định trong khoảng 500 MB RAM cho tầng ứng dụng.",
            "6. Triển khai gọn nhẹ, tiết kiệm tài nguyên:",
        ),
        # 7.6 Hạn chế (accurate to Mac single-node deployment!)
        (
            "1. Kiến trúc triển khai trên một nút máy chủ vật lý duy nhất (Single-Node Docker Compose):",
            "1. Triển khai trên một nút máy chủ vật lý đơn lẻ (Single-Node): Toàn bộ 15 tiến trình PM2 và 4 container Docker hiện chạy trên một máy chủ duy nhất, chưa triển khai trên cụm nhiều nút (như Kubernetes) nên chưa có khả năng tự động co giãn ngang (HPA) hoặc chuyển đổi dự phòng phần cứng (HA Failover).",
            "1. Triển khai trên một nút máy chủ vật lý đơn lẻ (Single-Node):",
        ),
        (
            "3. Phân hệ vận tải đường dài Linehaul chưa tích hợp cảm biến IoT phần cứng:",
            "3. Nghiệp vụ vận tải đường trục (Linehaul) chưa tách dịch vụ độc lập và chưa có IoT: Hiện quy trình đóng bao và bàn giao chuyến xe được gộp chung trong manifest-service, chưa tách riêng phân hệ quản lý đội xe tải chuyên sâu hoặc tích hợp thiết bị định vị GPS phần cứng và cân đo kích thước tự động DWS.",
            "3. Nghiệp vụ vận tải đường trục (Linehaul) chưa tách dịch vụ độc lập và chưa có IoT:",
        ),
        (
            "4. Quy trình sao lưu và phục hồi dữ liệu đám mây tự động chưa hoàn thiện: Hệ thống hiện phụ thuộc vào các ổ đĩa lưu trữ cục bộ (Docker Volumes) trên ổ SSD của máy chủ VPS",
            "4. Sao lưu và phục hồi dữ liệu còn thủ công: Dữ liệu 12 cơ sở dữ liệu PostgreSQL và MinIO hiện lưu trên Docker Volumes cục bộ, chưa xây dựng lịch tự động sao lưu lên lưu trữ đám mây và chưa kiểm thử quy trình khôi phục thảm họa định kỳ.",
            "4. Sao lưu và phục hồi dữ liệu còn thủ công:",
        ),

        # =====================================================================
        # CHAPTER 8 — CONCISE, HUMBLE, DEDUPLICATED (NO COPY-PASTE FROM CH.7!)
        # =====================================================================
        (
            "Sau quá trình phân tích yêu cầu nghiệp vụ, thiết kế kiến trúc phân tán, phát triển phần mềm và triển khai đo kiểm thực nghiệm, hệ thống quản lý logistics bưu chính đa kênh Nexus Express System đã hoàn thành xuất sắc toàn diện",
            "Qua quá trình phân tích, thiết kế, xây dựng và kiểm thử thực tế, đề tài đã hoàn thành các mục tiêu đề ra đối với hệ thống quản lý chuyển phát nhanh đa kênh Nexus Express. Các kết quả chính đạt được gồm:",
            None,
        ),
        (
            "Về mặt kiến trúc phần mềm, hệ thống đã áp dụng chuẩn mực mô hình kiến trúc Microservices phân tán với 15 dịch vụ",
            "Về kiến trúc phần mềm: Xây dựng hoàn chỉnh 14 microservices độc lập trên nền NestJS và TypeScript (gateway-bff, 12 dịch vụ nghiệp vụ và chatbot-service), tổ chức theo mô hình Monorepo và phân nhóm 5 miền chức năng theo hướng tiếp cận DDD.",
            "Về kiến trúc phần mềm:",
        ),
        (
            "Về mặt thiết kế và phân vùng dữ liệu, hệ thống đã triển khai nghiêm ngặt nguyên lý Database-per-service với 12 cơ sở dữ liệu PostgreSQL độc lập.",
            "Về tổ chức dữ liệu và giao tiếp: Tách biệt 12 cơ sở dữ liệu PostgreSQL độc lập (9 DB ghi, 2 DB đọc CQRS và chat_db qua pg.Pool) kết hợp pricing stateless, MinIO S3, Redis 7 và Local Vector Store. Dữ liệu liên miền được đồng bộ bất đồng bộ qua RabbitMQ (Transactional Outbox, DLX/TTL Retry/DLQ, Idempotency) mà không dùng SQL JOIN chéo.",
            "Về tổ chức dữ liệu và giao tiếp:",
        ),
        (
            "Về kiểm soát truy cập và phòng vệ chu vi, hệ thống đã triển khai mô hình API Gateway / BFF tập trung hóa thông qua gateway-bff.",
            "Về kiểm soát truy cập: Tập trung hóa toàn bộ lưu lượng tại gateway-bff với xác thực JWT, phân quyền RBAC 5 vai trò, lọc nguồn gốc CORS (*.nexus-ex.site), giới hạn tải trọng 1 MB, Rate Limiting 2.400 req/phút và xác thực đối tác HMAC (DT_COMMERCE).",
            "Về kiểm soát truy cập:",
        ),
        (
            "Về ứng dụng Trí tuệ Nhân tạo (AI), đề tài đã ghi nhận một đóng góp khoa học và công nghệ mang tính tiên phong:",
            "Về phân hệ trợ lý AI: Xây dựng chatbot-service ứng dụng Hybrid RAG (vector 3072 chiều từ gemini-embedding-001 kết hợp từ điển đồng nghĩa logistics) trên 9 tài liệu SOP, gọi công cụ nghiệp vụ động, dự phòng đa nhà cung cấp (Google Gemini → Groq LPU → OpenRouter Validation) và tuân thủ nguyên tắc Human-in-the-Loop khi xử lý khiếu nại. Thực nghiệm trên N = 100 kịch bản đạt Groundedness 94,8%, Tool Accuracy 100,0%, điểm Likert 4,19/5,00 (Wilcoxon p < 0,001) và chặn toàn bộ các kịch bản tấn công an toàn.",
            "Về phân hệ trợ lý AI:",
        ),
        (
            "Về chức năng nghiệp vụ và trải nghiệm người dùng, hệ thống đã xây dựng hệ sinh thái giao diện đa nền tảng",
            "Về ứng dụng đa nền tảng và kiểm thử: Hoàn thiện 4 cổng Web (React/Vite) và 2 ứng dụng di động React Native/Expo (Customer Mobile, Courier Mobile), vượt qua 153/153 kịch bản kiểm thử chức năng (69 Use Cases) và 83/100 tiêu chí kỹ thuật.",
            "Về ứng dụng đa nền tảng và kiểm thử:",
        ),
        (
            "Về môi trường triển khai thực tế, toàn bộ hệ sinh thái đã được đóng gói bằng Docker và vận hành ổn định trên cụm 25 containers trên máy chủ VPS",
            "Về triển khai thực tế: Vận hành ổn định toàn bộ 15 tiến trình PM2, 4 container hạ tầng Docker Desktop và Cloudflare Zero Trust Tunnel trên tên miền *.nexus-ex.site, với độ trễ phản hồi trung bình các API lõi dưới 200 ms.",
            "Về triển khai thực tế:",
        ),
        # 8.2 Hạn chế (concise summary — NOT copy-pasted from 7.6!)
        (
            "Mặc dù hệ thống Nexus Express System đã hoàn thành xuất sắc các mục tiêu cốt lõi",
            "Bên cạnh các kết quả đạt được, nhóm nhận thấy hệ thống vẫn còn một số hạn chế cần tiếp tục khắc phục (đã phân tích chi tiết ở Mục 7.6):",
            None,
        ),
        (
            "Thứ nhất, kiến trúc triển khai thực tế trên một nút máy chủ vật lý duy nhất (Single-Node Docker Compose):",
            "• Hạ tầng đơn nút (Single-Node): Chạy toàn bộ PM2 và Docker trên một máy chủ vật lý nên chưa có tự động co giãn (HPA) và dự phòng phần cứng đa nút.",
            "• Hạ tầng đơn nút (Single-Node):",
        ),
        (
            "Thứ hai, quy mô kiểm thử hiệu năng chịu tải dừng ở mức học thuật:",
            "• Phạm vi kiểm thử tải: Các kịch bản đo hiệu năng dừng ở quy mô thử nghiệm vừa và nhỏ, chưa kiểm thử chịu tải cực hạn (Stress Testing) hàng chục nghìn truy cập đồng thời.",
            "• Phạm vi kiểm thử tải:",
        ),
        (
            "Thứ ba, quy trình vận tải đường dài Linehaul chưa tích hợp cảm biến IoT phần cứng:",
            "• Chưa tách riêng dịch vụ đội xe Linehaul và thiết bị IoT: Quy trình trung chuyển hiện gộp trong manifest-service, chưa kết nối định vị GPS phần cứng trên xe tải hoặc cân đo kích thước tự động DWS.",
            "• Chưa tách riêng dịch vụ đội xe Linehaul và thiết bị IoT:",
        ),
        (
            "Thứ tư, phân hệ Trí tuệ Nhân tạo còn phụ thuộc vào API LLM đám mây thương mại:",
            "• Phụ thuộc API LLM đám mây: chatbot-service đang gọi các dịch vụ bên ngoài (Google AI Studio, Groq, OpenRouter), chịu ảnh hưởng bởi độ trễ mạng và hạn mức API; chưa tự triển khai mô hình nội bộ (On-premise LLM).",
            "• Phụ thuộc API LLM đám mây:",
        ),
        (
            "Thứ năm, cơ chế sao lưu và phục hồi dữ liệu đám mây tự động chưa hoàn thiện:",
            "• Sao lưu và giám sát nâng cao: Chưa thiết lập đường ống sao lưu tự động 12 DB PostgreSQL/MinIO lên đám mây và chưa triển khai Distributed Tracing (OpenTelemetry/Jaeger).",
            "• Sao lưu và giám sát nâng cao:",
        ),
        (
            "Thứ sáu, quy trình CI/CD và kiểm thử tải tự động chưa toàn diện:",
            "• Tự động hóa CI/CD: Quy trình build và triển khai hiện thực hiện bán tự động qua script, chưa tích hợp pipeline CI/CD đầy đủ (SAST, Contract Testing, triển khai tự động).",
            "• Tự động hóa CI/CD:",
        ),
        # 8.3.2 & 8.3.3 minor "15 microservices" fixes
        (
            "2. Bảo mật truyền thông nội bộ với mTLS: Triển khai giao thức bảo mật hai chiều (Mutual TLS) và cơ chế ký số request nội bộ giữa 15 microservices",
            "2. Bảo mật truyền thông nội bộ với mTLS: Triển khai Mutual TLS cho các kết nối nội bộ giữa 14 microservices khi mở rộng lên cụm đa nút, hạn chế rủi ro nghe lén hoặc giả mạo dịch vụ.",
            "2. Bảo mật truyền thông nội bộ với mTLS:",
        ),
        (
            "2. Xây dựng hệ sinh thái giám sát và quan sát toàn diện (Observability Stack): Triển khai bộ công cụ Prometheus",
            "2. Hoàn thiện hệ sinh thái giám sát (Observability Stack): Kết hợp Prometheus/Grafana với OpenTelemetry và Jaeger để theo dõi dấu vết phân tán (Distributed Tracing) xuyên suốt 14 microservices và hàng đợi RabbitMQ.",
            "2. Hoàn thiện hệ sinh thái giám sát (Observability Stack):",
        ),
        # 8.4 Kết luận chung (humble, clean, natural!)
        (
            "Khóa luận tốt nghiệp đã hoàn thành xuất sắc mục tiêu nghiên cứu, thiết kế và phát triển",
            "Khóa luận đã cơ bản hoàn thành các mục tiêu nghiên cứu, thiết kế và xây dựng hệ thống quản lý chuyển phát nhanh đa kênh Nexus Express, kết hợp kiến trúc phân tán Microservices hướng sự kiện với trợ lý AI Hybrid RAG có kiểm soát an toàn.",
            None,
        ),
        (
            "Về mặt kỹ thuật kiến trúc phần mềm, hệ thống đã chứng minh tính đúng đắn và hiệu quả vượt bậc của mô hình phân tán 15 microservices",
            "Về mặt kỹ thuật, hệ thống chứng minh tính khả thi của việc tổ chức 14 microservices theo nguyên tắc Database-per-Service (12 cơ sở dữ liệu PostgreSQL độc lập), truyền thông sự kiện bất đồng bộ qua RabbitMQ và kiểm soát truy cập tập trung tại gateway-bff.",
            None,
        ),
        (
            "Về mặt nghiên cứu ứng dụng trí tuệ nhân tạo, đề tài ghi dấu ấn đột phá với Phân hệ Trợ lý AI Đa tác tử dị thể HMAS",
            "Về ứng dụng AI, phân hệ chatbot-service với Hybrid RAG trên 9 tài liệu SOP, gọi công cụ nghiệp vụ thời gian thực và cơ chế bàn giao HITL cho bộ phận QA đã hỗ trợ giải quyết các bài toán tra cứu và khiếu nại bưu chính có kiểm chứng bằng thực nghiệm.",
            None,
        ),
        (
            "Về mặt thực tiễn ứng dụng, Nexus Express System không dừng lại ở mức mô phỏng phòng thí nghiệm, mà đã được đóng gói và vận hành ổn định trên hạ tầng máy chủ VPS",
            "Về mặt ứng dụng thực tiễn, hệ thống được triển khai và chạy thử nghiệm ổn định trên môi trường thực tế (PM2 + Docker Desktop + Cloudflare Tunnel) với tên miền *.nexus-ex.site, phục vụ đầy đủ 6 nhóm tác nhân trên cả Web và ứng dụng di động Android.",
            None,
        ),
        (
            "Nhìn lại toàn bộ quá trình nghiên cứu và thực nghiệm, đề tài đã đạt được đầy đủ các mục tiêu đề ra ban đầu, đồng thời tạo ra một sản phẩm phần mềm hoàn chỉnh, có tính ứng dụng cao và giàu giá trị học thuật.",
            "Kết quả đạt được là cơ sở kỹ thuật quan trọng để nhóm tiếp tục mở rộng, hoàn thiện các tính năng còn thiếu và hướng tới triển khai ở quy mô lớn hơn trong tương lai.",
            None,
        ),
    ]

    applied_paras = 0
    for needle, new_text, bold_pref in para_rewrites:
        matched = False
        for p in doc.paragraphs:
            if p.style.name.lower().startswith("toc"):
                continue
            if needle in p.text:
                set_para_text(p, new_text, bold_prefix=bold_pref)
                applied_paras += 1
                matched = True
                break
        if not matched:
            print(f"[WARN] Paragraph not found for: {needle[:65]!r}")
    print(f"[OK] Rewrote {applied_paras}/{len(para_rewrites)} paragraphs cleanly")

    # Delete the obsolete linehaul-service paragraph in Section 4.2.3
    lh_p = find_para(doc, "Dịch vụ Điều phối xe tải trung chuyển Linehaul (linehaul-service - Port 3014):")
    if lh_p is not None:
        lh_p._element.getparent().remove(lh_p._element)
        print("[OK] Removed obsolete linehaul-service paragraph in Section 4.2.3")

    # =========================================================================
    # 5. INSERT NEW HÌNH 4.5 (RAG OVERVIEW) & HÌNH 4.6 (RAG PIPELINE) IN 4.2.6
    # =========================================================================
    p_rag1_anchor = find_para(doc, "Thay vì phụ thuộc vào một mô hình ngôn ngữ duy nhất")
    if p_rag1_anchor is not None:
        insert_figure_after(
            p_rag1_anchor,
            DIAG_DIR / "nexus-rag-claims-overview.png",
            "Hình 4.5 Sơ đồ tổng quan kiến trúc RAG xử lý khiếu nại",
            cap_style,
            max_width_in=6.2,
            max_height_in=6.8,
        )
        print("[OK] Inserted Hình 4.5 (nexus-rag-claims-overview.png) in 4.2.6.1")

    p_rag2_anchor = find_para(doc, "Validation Agent (callValidationAgent): Với các thao tác làm thay đổi trạng thái")
    if p_rag2_anchor is not None:
        insert_figure_after(
            p_rag2_anchor,
            DIAG_DIR / "nexus-rag-claims-pipeline.png",
            "Hình 4.6 Cơ chế hoạt động chi tiết pipeline RAG và Multi-LLM Waterfall",
            cap_style,
            max_width_in=6.2,
            max_height_in=7.4,
        )
        print("[OK] Inserted Hình 4.6 (nexus-rag-claims-pipeline.png) in 4.2.6.2")

    # =========================================================================
    # 6. UPDATE ALL ARCHITECTURAL & DEPLOYMENT TABLES (100% CODE-VERIFIED!)
    # =========================================================================

    # Locate tables robustly by header signature
    def find_table(header_substr):
        for t in doc.tables:
            r0 = " | ".join(c.text.strip() for c in t.rows[0].cells)
            if header_substr in r0:
                return t
        return None

    # Table 4.1: 14 Microservices grouped into 5 DDD domains
    t41 = find_table("Nhóm nghiệp vụ | Tên Microservice")
    if t41 is not None:
        replace_table_rows(t41, [
            ["Nhóm nghiệp vụ (DDD)", "Tên Microservice", "Port", "Vai trò & Trách nhiệm chính", "Thẩm quyền dữ liệu (SSOT)"],
            ["1. Edge & API Composition", "gateway-bff", "3000", "Điểm vào duy nhất (Single Entrypoint) cho 6 Client Apps & DT_COMMERCE (HMAC); JWT RBAC, Rate Limit (2.400/m), REST/WS Proxy, S3 Presign, SSE Proxy.", "chat_db (pg.Pool) · Redis 7 · MinIO S3 (không sở hữu DB nghiệp vụ logistics)."],
            ["2. Core Logistics Domain", "shipment-service", "3002", "Nguồn chân lý trạng thái vận đơn (State Machine), giám định đơn lạc, hồ sơ bồi thường (Claims), CSKH và bắn Status Webhook sang DT_COMMERCE.", "shipment_db: Shipment, ChangeRequest, InvestigationCase, CompensationClaim, CskhTicket, OutboxEvent."],
            ["2. Core Logistics Domain", "pickup-service", "3003", "Tiếp nhận, phê duyệt và quản lý yêu cầu lấy hàng tận nơi từ kho người gửi (First-Mile).", "pickup_db: PickupRequest, PickupItem, OutboxEvent."],
            ["2. Core Logistics Domain", "dispatch-service", "3004", "Điều phối và phân công nhiệm vụ lấy/giao cho bưu tá; đồng bộ tác vụ thời gian thực qua /ws/tasks.", "dispatch_db: Task, TaskAssignment, OpsAuditLog, OutboxEvent."],
            ["2. Core Logistics Domain", "manifest-service", "3005", "Đóng bao trung chuyển (mã MB), kẹp chì niêm phong seal và xác nhận bàn giao chuyến xe đường trục giữa các Hub.", "manifest_db: Manifest, ManifestItem, SealRecord, ReceiveRecord, OutboxEvent."],
            ["2. Core Logistics Domain", "scan-service", "3006", "Ghi nhận sự kiện quét mã (Pickup/Inbound/Outbound) kèm Idempotency và cập nhật vị trí GPS bưu tá (/ws/locations).", "scan_db: ScanEvent, CurrentLocation, CourierCurrentLocation, IdempotencyRecord, OutboxEvent."],
            ["2. Core Logistics Domain", "delivery-service", "3007", "Phát hàng chặng cuối (Last-Mile), ảnh POD, xác thực OTP, xử lý sự cố NDR (tối đa 3 lần) và chuyển hoàn (Return).", "delivery_db: DeliveryAttempt, Pod, OtpRecord, NdrCase, ReturnCase, IdempotencyRecord, OutboxEvent."],
            ["3. Commercial & Finance", "pricing-service", "3012", "Động cơ tính cước tức thì chuẩn IATA (V/6000), 3 vùng cước, phụ phí bảo hiểm và kiểm tra 3 tầng trần vật lý.", "Stateless (In-memory Rules — không có DB riêng; lưu snapshot cước vào shipment_db)."],
            ["3. Commercial & Finance", "payment-service", "3011", "Quản lý thu hộ COD, gom phiên đối soát ví shop, khấu trừ cước hoàn và tích hợp SePay VietQR/Webhook.", "payment_db: CodRecord, CodSettlementBatch, CodSettlementPaymentEvent, IdempotencyRecord, OutboxEvent."],
            ["4. CQRS Read & AI", "tracking-service", "3008", "CQRS Read Model thuần đọc: tiêu thụ sự kiện domain.events để dựng Timeline hành trình tốc độ cao (zero outbox).", "tracking_db: TimelineEvent, TrackingCurrent, TrackingIndex (Read Model)."],
            ["4. CQRS Read & AI", "reporting-service", "3009", "CQRS Read Model phân tích: tiêu thụ sự kiện tổng hợp KPI theo ngày/tháng, SLA và Dashboard (zero outbox).", "reporting_db: KpiDaily, KpiMonthly, AggregationJob, ShipmentStatusProjection (Read Model)."],
            ["4. CQRS Read & AI", "chatbot-service", "3013", "Trợ lý AI Hybrid RAG xử lý khiếu nại & CSKH, Function Calling (:3002/:3008/:3012), OpenRouter Validation HITL, Waterfall Gemini/Groq, SSE.", "Local Vector Store: vector-index.json (59 chunks × 3072-D nạp sẵn RAM)."],
            ["5. Platform & Generic", "auth-service", "3010", "Xác thực tài khoản, phiên đăng nhập JWT, phân quyền RBAC 5 vai trò, quyền Mobile và nhật ký quản trị.", "auth_db: UserAccount, AuthSession, MobilePermissionProfile, AdminAuditLog, OutboxEvent."],
            ["5. Platform & Generic", "masterdata-service", "3001", "Danh mục dùng chung: mạng lưới Hub 4 cấp, Zone, mã lý do NDR, hồ sơ Shop/Khách và phiên bản chính sách.", "masterdata_db: Hub, Zone, NdrReason, MerchantProfile, CustomerProfile, PolicyVersion, OutboxEvent."],
        ])
        print("[OK] Updated Table 4.1 (14 microservices, 5 DDD groups)")

    # Table 4.2: 12 PostgreSQL DBs + Specialized Stores (no linehaul!)
    t42 = find_table("Tên Microservice | Cơ sở dữ liệu")
    if t42 is not None:
        replace_table_rows(t42, [
            ["Tên Microservice", "Kho dữ liệu", "Các Model / Bảng dữ liệu chính", "Trách nhiệm & Thẩm quyền dữ liệu (SSOT)"],
            ["auth-service", "auth_db (Prisma)", "UserAccount, AuthSession, MobilePermissionProfile, MobilePermissionOverride, AdminAuditLog, OutboxEvent", "Quản trị danh tính, phiên đăng nhập, phân quyền RBAC và nhật ký kiểm toán."],
            ["masterdata-service", "masterdata_db (Prisma)", "Hub, Zone, NdrReason, Config, MerchantProfile, CustomerProfile, CourierAreaAssignment, Policy, PolicyVersion, OutboxEvent", "Danh mục Hub 4 cấp, phân vùng Zone, mã NDR, hồ sơ người gửi/nhận và chính sách."],
            ["shipment-service", "shipment_db (Prisma)", "Shipment, ChangeRequest, InvestigationCase, InvestigationAuditScan, InvestigationDispute, CompensationClaim, CskhTicket, CourierRating, OutboxEvent", "Nguồn chân lý vận đơn, giám định đơn lạc, hồ sơ bồi thường (Claims) và CSKH."],
            ["pickup-service", "pickup_db (Prisma)", "PickupRequest, PickupItem, OutboxEvent", "Quản lý yêu cầu lấy hàng tận nơi và danh sách kiện hàng cần thu gom."],
            ["dispatch-service", "dispatch_db (Prisma)", "Task, TaskAssignment, OpsAuditLog, OutboxEvent", "Phân công và lịch sử giao việc lấy/phát hàng cho bưu tá."],
            ["manifest-service", "manifest_db (Prisma)", "Manifest, ManifestItem, SealRecord, ReceiveRecord, OpsAuditLog, OutboxEvent", "Đóng bao trung chuyển (MB), niêm phong seal và bàn giao chuyến xe liên Hub."],
            ["scan-service", "scan_db (Prisma)", "ScanEvent, CurrentLocation, CourierCurrentLocation, CourierLocationHistory, IdempotencyRecord, OpsAuditLog, OutboxEvent", "Lịch sử quét mã vạch, vị trí kiện hàng và lộ trình GPS bưu tá."],
            ["delivery-service", "delivery_db (Prisma)", "DeliveryAttempt, Pod, OtpRecord, NdrCase, ReturnCase, IdempotencyRecord, OpsAuditLog, OutboxEvent", "Kết quả giao phát, ảnh POD, OTP, biên bản NDR và luồng chuyển hoàn."],
            ["payment-service", "payment_db (Prisma)", "CodRecord, CodSettlementBatch, CodSettlementItem, CodSettlementPaymentEvent, IdempotencyRecord, OutboxEvent", "Sổ cái tiền thu hộ COD, phiên quyết toán và giao dịch SePay/VietQR."],
            ["tracking-service", "tracking_db (Prisma)", "TimelineEvent, TrackingCurrent, TrackingIndex", "CQRS Read Model lưu dòng thời gian hành trình (zero outbox)."],
            ["reporting-service", "reporting_db (Prisma)", "KpiDaily, KpiMonthly, AggregationJob, ShipmentStatusProjection", "CQRS Read Model tổng hợp KPI, sản lượng và tỷ lệ SLA (zero outbox)."],
            ["gateway-bff", "chat_db (pg.Pool) · MinIO S3 · Redis 7", "chat_conversations, chat_messages, chat_read_receipts, chat_audit_logs; Bucket nexus-pod-images; Pub/Sub gateway-bff:chat", "Lưu lịch sử chat nội bộ qua pg.Pool (không dùng Prisma), quản lý ảnh POD/CCTV và đồng bộ chat realtime."],
            ["pricing-service", "Stateless (In-memory)", "Ma trận cước IATA (V/6000), 3 vùng cước, 3 tầng trần vật lý", "Không có DB riêng; tính cước tức thì và lưu snapshot vào shipment_db."],
            ["chatbot-service", "vector-index.json (RAM)", "59 phân đoạn SOP × vector 3072 chiều (gemini-embedding-001)", "Kho vector cục bộ nạp sẵn RAM cho tìm kiếm lai (Cosine + Keyword/Thesaurus) dưới 5ms."],
        ])
        print("[OK] Updated Table 4.2 (12 PostgreSQL DBs + Polyglot stores)")

    # Table 4.3: Remove linehaul-service row
    t43 = find_table("Nhóm Microservice | Phương thức")
    if t43 is not None:
        for row in list(t43.rows):
            if "linehaul-service" in row.cells[0].text.lower():
                row._tr.getparent().remove(row._tr)
                print("[OK] Removed linehaul-service row from Table 4.3")

    # Table 6.1: Real Mac Apple Silicon + PM2 + Docker + Cloudflare environment
    t61 = find_table("Thành phần môi trường | Thông số kỹ thuật")
    if t61 is not None:
        replace_table_rows(t61, [
            ["Thành phần môi trường", "Thông số kỹ thuật / Phiên bản", "Ghi chú & Mục đích sử dụng"],
            ["Máy chủ vận hành", "Apple Silicon (macOS 15, Chip Apple M4)", "Máy chủ triển khai thực tế chạy đồng thời PM2 và Docker Desktop."],
            ["Bộ nhớ trong (RAM)", "16.0 GB Unified Memory", "Chạy mượt 15 tiến trình PM2 (~500 MB) và 4 container hạ tầng Docker."],
            ["Trình quản lý tiến trình", "PM2 Process Manager (ecosystem.config.cjs)", "Quản lý 15 tiến trình Node.js (14 microservices + nexus-static-web), tự khởi động lại khi lỗi."],
            ["Nền tảng Container", "Docker Desktop & Docker Compose v2", "Chạy đúng 4 container hạ tầng có trạng thái: PostgreSQL 16, RabbitMQ 3.13, Redis 7, MinIO S3."],
            ["Cổng vào & Bảo mật biên", "Cloudflare Edge + cloudflared (LaunchDaemon)", "Zero Trust Tunnel nối outbound an toàn, cấp SSL/TLS tự động cho *.nexus-ex.site không cần mở port router."],
            ["Môi trường Node.js", "Node.js 20+ LTS (Native ARM64)", "Thực thi trực tiếp mã nguồn NestJS đã biên dịch (dist/main.js) và static reverse proxy."],
            ["Quản lý Monorepo", "pnpm 9.x Workspace", "Quản lý đồng bộ mã nguồn 6 ứng dụng client và 14 backend microservices."],
        ])
        print("[OK] Updated Table 6.1 (Apple Silicon + PM2 + Docker + Cloudflare)")

    # Table 6.2: Tech Stack (remove LangChain, GPT-4o-mini, Socket.io, 15 services)
    t62 = find_table("Phân tầng hệ thống | Công nghệ / Thư viện")
    if t62 is not None:
        replace_table_rows(t62, [
            ["Phân tầng hệ thống", "Công nghệ / Thư viện", "Phiên bản", "Vai trò & Chức năng trong hệ thống"],
            ["Tầng Web Frontend", "React, Vite, TypeScript, TailwindCSS, Zustand, TanStack Query", "React 18, Vite 5, TS 5", "Xây dựng 4 cổng Web (Ops, Merchant, Admin, Guest Tracking) phản hồi nhanh."],
            ["Tầng Mobile App", "React Native, Expo, Expo Camera, AsyncStorage", "RN 0.81, Expo 54", "Xây dựng 2 ứng dụng di động xuất APK (Customer Mobile & Courier Mobile), hỗ trợ quét mã vạch và Offline Queue."],
            ["Tầng Backend Services", "NestJS, Node.js, Prisma ORM, pg (Pool), Class-Validator", "NestJS 10, Node 20, Prisma 5", "Xây dựng 14 microservices độc lập; 11 dịch vụ dùng Prisma và gateway-bff dùng pg.Pool cho chat_db."],
            ["Tầng Trí tuệ Nhân tạo", "Google Gemini, Groq LPU, OpenRouter, Hybrid RAG, SSE", "gemini-3.5-flash-lite, gpt-oss-120b, qwen3.8-27b, nemotron-3.5", "Phân hệ chatbot-service viết thuần TypeScript (không dùng LangChain), vector 3072 chiều, kiểm soát HITL và truyền luồng SSE."],
            ["Tầng Cơ sở dữ liệu", "PostgreSQL 16, Prisma Client, node-postgres", "PostgreSQL 16 Alpine", "Lưu trữ 12 cơ sở dữ liệu tách biệt theo nguyên tắc Database-per-Service (9 Write + 2 CQRS Read + chat_db)."],
            ["Tầng Realtime & Pub/Sub", "WebSocket chuẩn (HTTP Upgrade / ws), Redis 7", "Redis 7 Alpine", "Đồng bộ kênh chat realtime /ws/chat qua Redis Pub/Sub (gateway-bff:chat) và proxy WS /ws/tasks, /ws/locations."],
            ["Tầng Lưu trữ đối tượng", "MinIO Object Storage (@aws-sdk/client-s3)", "MinIO (S3 API)", "Lưu trữ ảnh POD và chứng cứ CSKH/Claims trong bucket nexus-pod-images qua presigned URL."],
            ["Tầng Trục sự kiện", "RabbitMQ, amqplib", "RabbitMQ 3.13 Management", "Truyền thông bất đồng bộ Topic Exchange domain.events, Outbox Relay và DLX/TTL Retry (10s / 1m / DLQ)."],
            ["Tầng Tích hợp & Thanh toán", "SePay Webhook/VietQR, DT_COMMERCE Partner HMAC", "SePay v2, HMAC-SHA256", "Tạo mã VietQR động, đối soát COD tự động qua SePay và liên thông đơn hàng/Status Webhook với DT_COMMERCE."],
        ])
        print("[OK] Updated Table 6.2 (accurate tech stack)")

    # Table 6.2.14 (Chatbot API table — T[199])
    for t in doc.tables:
        if len(t.columns) == 2 and len(t.rows) >= 5 and "multi-agent-health" in t.rows[1].cells[0].text:
            set_cell_text(t.rows[1].cells[1], "Kiểm tra trạng thái sẵn sàng kết nối tới 3 nhà cung cấp AI đang cấu hình (Google Gemini, Groq LPU, OpenRouter).", bold=False)
            set_cell_text(t.rows[4].cells[1], "Nạp, chia đoạn (250 từ / overlap 40) và đồng bộ 9 tài liệu SOP vào Vector Store 3072 chiều (vector-index.json).", bold=False)
            set_cell_text(t.rows[5].cells[1], "Kiểm tra trạng thái hoạt động của tiến trình chatbot-service (:3013).", bold=False)
            print("[OK] Updated Chatbot API table in 6.2.14")
            break

    # Table 6.3: Cloudflare Tunnel Domain Routing (matching Hình 4.2!)
    t63 = find_table("Tên miền chính thức | Giao thức & Cổng")
    if t63 is not None:
        replace_table_rows(t63, [
            ["Tên miền chính thức", "Giao thức", "Đích nội bộ (qua cloudflared)", "Vai trò & Chức năng phục vụ"],
            ["ops.nexus-ex.site", "HTTPS / WSS", "nexus-static-web (:5173) → gateway-bff (:3000)", "Cổng điều hành Hub/bưu cục, quản lý khiếu nại và chuyển tiếp API/WS về Gateway BFF."],
            ["merchant.nexus-ex.site", "HTTPS / WSS", "nexus-static-web (:5174) → gateway-bff (:3000)", "Cổng đối tác gửi hàng B2B: tạo đơn, in nhãn A6, đặt lịch lấy hàng và đối soát COD."],
            ["admin.nexus-ex.site", "HTTPS / WSS", "nexus-static-web (:5175) → gateway-bff (:3000)", "Cổng quản trị viên: tài khoản, phân quyền RBAC, Hub 4 cấp, Zone và chính sách."],
            ["tracking.nexus-ex.site", "HTTPS", "nexus-static-web (:5177) → gateway-bff (:3000)", "Cổng tra cứu công khai (guest-web): xem hành trình vận đơn, dự toán cước IATA và hỏi đáp AI."],
            ["minio.nexus-ex.site", "HTTPS", "Docker MinIO S3 (:9000)", "Phục vụ tải lên/hiển thị ảnh bằng chứng giao hàng POD và tệp chứng cứ CSKH (bucket nexus-pod-images)."],
            ["Mobile APKs (Customer & Courier)", "HTTPS / WSS", "Cloudflare Edge → cloudflared → gateway-bff (:3000)", "2 ứng dụng Android APK (React Native/Expo) gọi trực tiếp REST API và WebSocket qua tên miền HTTPS."],
        ])
        print("[OK] Updated Table 6.3 (Cloudflare Tunnel routing)")

    # Table 6.4: 15 PM2 Processes + 4 Docker Infra Containers (matching Hình 4.2!)
    t64 = find_table("Tên Container | Nhóm chức năng")
    if t64 is not None:
        replace_table_rows(t64, [
            ["Thành phần / Tiến trình", "Môi trường chạy", "Cổng nội bộ", "Phân nhóm", "Vai trò vận hành thực tế"],
            ["postgres (PostgreSQL 16)", "Docker Desktop", "15432 → 5432", "Hạ tầng dữ liệu", "Quản trị 12 cơ sở dữ liệu độc lập (init-multiple-dbs.sql), volume postgres_data."],
            ["rabbitmq (RabbitMQ 3.13)", "Docker Desktop", "5672 / 15672", "Message Broker", "Topic Exchange domain.events, Outbox delivery và DLX/TTL Retry/DLQ."],
            ["redis (Redis 7)", "Docker Desktop", "6379", "Pub/Sub Realtime", "Kênh Pub/Sub gateway-bff:chat phục vụ đồng bộ /ws/chat (chỉ gateway-bff kết nối)."],
            ["minio (MinIO S3)", "Docker Desktop", "9000 / 9001", "Object Storage", "Lưu ảnh POD và chứng cứ cskh-evidence/ trong bucket nexus-pod-images."],
            ["nexus-static-web", "PM2 (Node.js)", "5173–5177", "Static Web + Proxy", "Phục vụ 4 Web SPAs (serve-static-apps.mjs) và proxy API/WS sang :3000 (~15 MB RAM)."],
            ["gateway-bff", "PM2 (Node.js)", "3000", "Edge Gateway BFF", "Single Entrypoint, JWT RBAC, Rate Limit (2.400/m), WS Hub, S3 Presign, chat_db (pg.Pool), Partner HMAC."],
            ["masterdata-service", "PM2 (Node.js)", "3001", "Platform", "Hub 4 cấp, Zone, mã NDR, hồ sơ Shop/Khách, PolicyVersion (masterdata_db)."],
            ["shipment-service", "PM2 (Node.js)", "3002", "Core Logistics", "Vận đơn trung tâm, giám định đơn lạc, Claims, CSKH, Status Webhook DT_COMMERCE (shipment_db)."],
            ["pickup-service", "PM2 (Node.js)", "3003", "Core Logistics", "Tiếp nhận và phê duyệt yêu cầu lấy hàng tận nơi (pickup_db)."],
            ["dispatch-service", "PM2 (Node.js)", "3004", "Core Logistics", "Điều phối công việc bưu tá và kênh /ws/tasks (dispatch_db)."],
            ["manifest-service", "PM2 (Node.js)", "3005", "Core Logistics", "Đóng bao MB, kẹp chì seal và bàn giao chuyến xe trung chuyển liên Hub (manifest_db)."],
            ["scan-service", "PM2 (Node.js)", "3006", "Core Logistics", "Quét mã Inbound/Outbound (Idempotency) và GPS bưu tá /ws/locations (scan_db)."],
            ["delivery-service", "PM2 (Node.js)", "3007", "Core Logistics", "Phát hàng chặng cuối, POD, OTP, xử lý NDR và chuyển hoàn (delivery_db)."],
            ["tracking-service", "PM2 (Node.js)", "3008", "CQRS Read Model", "Chiếu sự kiện dựng Timeline hành trình vận đơn (tracking_db, zero outbox)."],
            ["reporting-service", "PM2 (Node.js)", "3009", "CQRS Read Model", "Chiếu sự kiện tổng hợp KPI, SLA và Dashboard (reporting_db, zero outbox)."],
            ["auth-service", "PM2 (Node.js)", "3010", "Platform", "Xác thực JWT, phân quyền RBAC 5 vai trò và quyền Mobile (auth_db)."],
            ["payment-service", "PM2 (Node.js)", "3011", "Finance & COD", "Sổ cái COD, đối soát ví shop và tích hợp SePay VietQR/Webhook (payment_db)."],
            ["pricing-service", "PM2 (Node.js)", "3012", "Finance & Pricing", "Động cơ tính cước IATA V/6000 và 3 tầng trần vật lý (Stateless, không DB)."],
            ["chatbot-service", "PM2 (Node.js)", "3013", "AI Intelligence", "Trợ lý AI Hybrid RAG (vector-index.json 3072-D), Function Calling, HITL Validation và SSE."],
        ])
        print("[OK] Updated Table 6.4 (15 PM2 processes + 4 Docker containers)")

    # Table 6.5: Fix chat_db ownership (ONLY gateway-bff, pg.Pool!)
    t65 = find_table("Tên Cơ sở dữ liệu | Service sở hữu độc quyền")
    if t65 is not None:
        for row in t65.rows:
            if row.cells[0].text.strip() == "chat_db":
                set_cell_text(row.cells[1], "gateway-bff (pg.Pool)", bold=False)
                set_cell_text(row.cells[2], "Lịch sử hội thoại và tin nhắn nội bộ (chat_conversations, chat_messages, chat_read_receipts, chat_audit_logs); không dùng Prisma.", bold=False)
                print("[OK] Fixed chat_db ownership in Table 6.5")

    # Table 6.4.2 (TC-039, TC-040, TC-081..089) & Analysis table T[222]
    for t in doc.tables:
        if len(t.columns) in (4, 6):
            for row in t.rows:
                c0 = row.cells[0].text.strip()
                if c0 == "TC-039":
                    set_cell_text(row.cells[1], "manifest / linehaul", bold=False)
                    set_cell_text(row.cells[2], "Tách riêng dịch vụ quản lý đội xe tải đường trục (Linehaul Fleet)", bold=False)
                    if len(row.cells) == 6:
                        set_cell_text(row.cells[5], "Nghiệp vụ đóng bao/seal/trung chuyển đã gộp trong manifest-service; chưa tách microservice quản lý đội xe GPS độc lập.", bold=False)
                    else:
                        set_cell_text(row.cells[3], "Hiện đã tích hợp đóng bao/seal/trung chuyển trong manifest-service (:3005); đề xuất tách dịch vụ quản lý đội xe tải riêng ở giai đoạn mở rộng.", bold=False)
                elif c0 == "TC-040":
                    set_cell_text(row.cells[1], "ops-web / manifest", bold=False)
                    if len(row.cells) == 6:
                        set_cell_text(row.cells[5], "Đã có đóng bao và kẹp chì trong manifest-service; chưa tích hợp GPS phần cứng theo dõi xe tải liên tỉnh.", bold=False)
                    else:
                        set_cell_text(row.cells[3], "Đã hỗ trợ đóng bao và kẹp chì seal trong manifest-service; chưa có cảm biến GPS phần cứng gắn trên xe tải.", bold=False)
                elif c0 == "TC-081":
                    set_cell_text(row.cells[1], "PM2 + Docker", bold=False)
                    set_cell_text(row.cells[2], "Khởi chạy đầy đủ 15 tiến trình PM2 + 4 container hạ tầng", bold=False)
                    if len(row.cells) == 6:
                        set_cell_text(row.cells[5], "ecosystem.config.cjs chạy 15 tiến trình Node.js + infra/dev/docker-compose.yml chạy 4 hạ tầng.", bold=False)
                elif c0 == "TC-084":
                    set_cell_text(row.cells[2], "Cấu hình CORS/HTTPS cho tên miền *.nexus-ex.site", bold=False)
                elif c0 == "TC-085":
                    set_cell_text(row.cells[2], "Kịch bản khởi chạy PM2, khởi tạo DB và seed dữ liệu", bold=False)
                elif c0 == "TC-089":
                    if len(row.cells) == 6:
                        set_cell_text(row.cells[5], "Hiện triển khai single-node (PM2 + Docker Desktop); chưa dùng Kubernetes rolling/blue-green.", bold=False)
                    else:
                        set_cell_text(row.cells[3], "Hiện triển khai single-node (PM2 + Docker Desktop); chưa có Kubernetes rolling/blue-green orchestration.", bold=False)
                elif c0 == "TC-098":
                    set_cell_text(row.cells[2], "Validate cấu hình hạ tầng Docker Compose và PM2", bold=False)

    # Table 7.2: Fix tracking-service (remove Redis!) & ai-logistics-agent -> chatbot-service!
    t72 = find_table("Nghiệp vụ kiểm thử | Dịch vụ phụ trách")
    if t72 is not None:
        for row in t72.rows:
            s = row.cells[1].text.strip()
            if "tracking-service" in s:
                set_cell_text(row.cells[1], "tracking-service (tracking_db)", bold=False)
            elif "ai-logistics-agent" in s:
                set_cell_text(row.cells[1], "chatbot-service (SSE)", bold=False)
        print("[OK] Fixed Table 7.2 (tracking_db without Redis & chatbot-service name)")

    # =========================================================================
    # 7. GLOBAL POLISH: API SPACING TYPOS IN CHAPTER 6 TABLES & LEFTOVER TYPOS
    # =========================================================================
    fixed_api_spaces = 0
    for t in doc.tables:
        for row in t.rows:
            for cell in row.cells:
                txt = cell.text
                new_txt = re.sub(r"\b(GET|POST|PUT|PATCH|DELETE)(/)", r"\1 \2", txt)
                new_txt = new_txt.replace("/ :", "/:")
                new_txt = new_txt.replace("chì chì", "chì")
                if new_txt != txt:
                    set_cell_text(cell, new_txt)
                    fixed_api_spaces += 1
    print(f"[OK] Fixed {fixed_api_spaces} API spacing / typo cells across tables")

    # Clean remaining small mentions in body paragraphs (e.g. "103.82.20.51", "VPS" in Ch.6-8 captions/headers)
    for p in doc.paragraphs:
        if p.style.name.lower().startswith("toc"):
            continue
        t = p.text
        if "LEVEL 9 - Triển khai, build và môi trường VPS" in t:
            set_para_text(p, "LEVEL 9 - Triển khai, build và môi trường vận hành thực tế")
        elif "Kiểm tra khả năng chạy production-ish trên một VPS" in t:
            set_para_text(p, "Kiểm tra khả năng chạy đồng bộ 15 tiến trình PM2, 4 container hạ tầng Docker Desktop, biến môi trường, healthcheck và Cloudflare Tunnel.")

    # Save version2.docx
    doc.save(str(DST_DOCX))
    print(f"[OK] Saved {DST_DOCX} ({DST_DOCX.stat().st_size:,} bytes)")

    # =========================================================================
    # 8. ENABLE w:updateFields IN word/settings.xml SO WORD AUTO-UPDATES TOC!
    # =========================================================================
    tmp_zip = DST_DOCX.with_suffix(".tmp.docx")
    with zipfile.ZipFile(DST_DOCX, "r") as zin, zipfile.ZipFile(tmp_zip, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "word/settings.xml":
                s = data.decode("utf-8")
                if "updateFields" not in s:
                    s = s.replace("</w:settings>", '<w:updateFields w:val="true"/></w:settings>')
                data = s.encode("utf-8")
            zout.writestr(item, data)
    tmp_zip.replace(DST_DOCX)
    print("[OK] Enabled auto-update TOC/Fields flag in word/settings.xml")


if __name__ == "__main__":
    main()
