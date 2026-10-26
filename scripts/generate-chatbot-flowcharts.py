#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE CHATBOT ALGORITHM FLOWCHARTS
=============================================================================
Bản vẽ Sơ đồ Thuật toán Kỹ thuật Đồ án Tốt nghiệp (OMG ISO/IEC Flowchart Standard):
1. PHẦN A: Thuật toán Phân đoạn Ngữ nghĩa (Chunking) & Vector hóa Dữ liệu Tri thức (Ingestion Pipeline).
2. PHẦN B: Thuật toán Vận hành Thời gian thực & Suy luận của Chatbot (Runtime Inference & Tool Calling Pipeline).

Đặc trưng thiết kế:
- Phong cách Đen Trắng Kỹ Thuật (Monochrome Engineering Flowchart): Rõ nét, tối giản, thanh lịch.
- Chuẩn ký hiệu hình học lưu đồ thuật toán: Terminal (Oval), Process (Rect), Decision (Diamond), I/O (Parallelogram), Data Store (Cylinder).
- Không dùng <marker> SVG: Toàn bộ đầu mũi tên vẽ bằng polygon nội suy trực tiếp để tương thích 100% khi kéo thả chỉnh sửa trong Figma / Draw.io.
- Tọa độ lưới chuẩn xác, các khối được phân nhóm <g> rành mạch, dễ dàng click chọn và sửa nội dung thủ công.
"""

import os
import math
import html

def xml_esc(s):
    if s is None:
        return ""
    if not isinstance(s, str):
        s = str(s)
    return html.escape(s, quote=True)

def generate_svg():
    width = 3300
    height = 2300

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="background:#FFFFFF;">')

    # STYLES DEFINITION
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      text { font-family: "Segoe UI", Arial, sans-serif; }')
    lines.append('      .bg { fill: #FFFFFF; }')
    lines.append('      .frame { fill: none; stroke: #000000; stroke-width: 2.5; }')
    lines.append('      .frame-inner { fill: none; stroke: #555555; stroke-width: 0.8; stroke-dasharray: 6 3; }')
    lines.append('      .col-box { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; rx: 6px; }')
    lines.append('      .col-hdr { fill: #000000; }')
    lines.append('      .col-hdr-txt { font-size: 16px; font-weight: bold; fill: #FFFFFF; letter-spacing: 0.5px; }')
    lines.append('      .col-hdr-sub { font-size: 11.5px; fill: #E5E7EB; font-family: "Courier New", monospace; }')
    lines.append('      .term-shape { fill: #FFFFFF; stroke: #000000; stroke-width: 2.0; }')
    lines.append('      .term-txt { font-size: 12.5px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .proc-shape { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; rx: 4px; }')
    lines.append('      .proc-alt { fill: #FAFAFA; stroke: #000000; stroke-width: 1.5; rx: 4px; }')
    lines.append('      .proc-txt-title { font-size: 12.5px; font-weight: bold; fill: #000000; }')
    lines.append('      .proc-txt-desc { font-size: 11px; fill: #222222; line-height: 1.4; }')
    lines.append('      .proc-code { font-family: "Courier New", monospace; font-size: 10.5px; font-weight: bold; fill: #000000; }')
    lines.append('      .dec-shape { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; }')
    lines.append('      .dec-txt { font-size: 11.5px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .io-shape { fill: #F9FAFB; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .io-txt-title { font-size: 12.5px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .io-txt-desc { font-size: 11px; fill: #333333; text-anchor: middle; }')
    lines.append('      .store-body { fill: #F4F4F5; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .store-ellipse { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .store-txt-title { font-size: 12.5px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .store-txt-sub { font-family: "Courier New", monospace; font-size: 10.5px; fill: #444444; text-anchor: middle; }')
    lines.append('      .flow-line { stroke: #000000; stroke-width: 1.4; fill: none; }')
    lines.append('      .flow-arrow { fill: #000000; stroke: #000000; stroke-width: 0.5; }')
    lines.append('      .flow-lbl { font-family: "Courier New", monospace; font-size: 10.5px; font-weight: bold; fill: #000000; }')
    lines.append('      .pill-lbl { fill: #FFFFFF; stroke: #000000; stroke-width: 0.8; rx: 3px; }')
    lines.append('      .t-main { font-size: 20px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }')
    lines.append('      .t-sub { font-size: 12px; fill: #4B5563; }')
    lines.append('    ]]></style>')
    lines.append('  </defs>')
    lines.append('')

    # CANVAS BACKGROUND & BORDERS
    lines.append(f'  <rect width="{width}" height="{height}" class="bg"/>')
    lines.append(f'  <rect x="18" y="18" width="{width-36}" height="{height-36}" class="frame"/>')
    lines.append(f'  <rect x="25" y="25" width="{width-50}" height="{height-50}" class="frame-inner"/>')
    lines.append('')

    # HEADER BLOCK
    lines.append('  <!-- ==================== HEADER ==================== -->')
    lines.append('  <g id="Header">')
    lines.append(f'    <rect x="36" y="36" width="{width-72}" height="80" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>')
    lines.append('    <text x="56" y="70" class="t-main">SƠ ĐỒ THUẬT TOÁN: QUY TRÌNH PHÂN ĐOẠN DỮ LIỆU (CHUNKING) VÀ VẬN HÀNH THỜI GIAN THỰC CỦA CHATBOT</text>')
    lines.append('    <text x="56" y="98" class="t-sub">Đồ Án Tốt Nghiệp Kỹ Sư CNTT • Phân Hệ Trợ Lý AI Logistics (@NEXUS/chatbot-service :3013) • Chuẩn Lưu Đồ Thuật Toán ISO/IEC 5807</text>')
    lines.append(f'    <rect x="{width-430}" y="44" width="380" height="64" fill="#F8F8F8" stroke="#000000" stroke-width="1.2"/>')
    lines.append(f'    <text x="{width-415}" y="70" font-family="Segoe UI, Arial" font-size="13" font-weight="bold" fill="#000000">MÃ BẢN VẼ: FLOW-AI-RAG-01</text>')
    lines.append(f'    <text x="{width-415}" y="92" font-family="Courier New, monospace" font-size="11" fill="#444444">ISO/IEC 5807 FLOWCHART • HANDCRAFTED</text>')
    lines.append('  </g>')
    lines.append('')

    # HELPER FUNCTIONS TO DRAW ARROWS AND SHAPES
    def draw_down_arrow(x, y1, y2, label=None, label_side="right"):
        res = []
        res.append(f'    <line x1="{x}" y1="{y1}" x2="{x}" y2="{y2-6}" class="flow-line"/>')
        res.append(f'    <polygon points="{x},{y2} {x-4},{y2-8} {x+4},{y2-8}" class="flow-arrow"/>')
        if label:
            lx = x + 10 if label_side == "right" else x - len(label)*7 - 10
            ly = (y1 + y2) / 2 + 4
            res.append(f'    <text x="{lx}" y="{ly}" class="flow-lbl">{xml_esc(label)}</text>')
        return "\n".join(res)

    def draw_right_arrow(x1, y, x2, label=None):
        res = []
        res.append(f'    <line x1="{x1}" y1="{y}" x2="{x2-6}" y2="{y}" class="flow-line"/>')
        res.append(f'    <polygon points="{x2},{y} {x2-8},{y-4} {x2-8},{y+4}" class="flow-arrow"/>')
        if label:
            res.append(f'    <text x="{(x1+x2)/2}" y="{y-8}" text-anchor="middle" class="flow-lbl">{xml_esc(label)}</text>')
        return "\n".join(res)

    def draw_left_arrow(x1, y, x2, label=None):
        res = []
        res.append(f'    <line x1="{x1}" y1="{y}" x2="{x2+6}" y2="{y}" class="flow-line"/>')
        res.append(f'    <polygon points="{x2},{y} {x2+8},{y-4} {x2+8},{y+4}" class="flow-arrow"/>')
        if label:
            res.append(f'    <text x="{(x1+x2)/2}" y="{y-8}" text-anchor="middle" class="flow-lbl">{xml_esc(label)}</text>')
        return "\n".join(res)

    def draw_polyline_arrow(points):
        res = []
        pts_str = " ".join([f"{p[0]},{p[1]}" for p in points])
        res.append(f'    <polyline points="{pts_str}" class="flow-line"/>')
        p_last = points[-1]
        p_prev = points[-2]
        dx = p_last[0] - p_prev[0]
        dy = p_last[1] - p_prev[1]
        if abs(dy) >= abs(dx):
            if dy > 0:
                res.append(f'    <polygon points="{p_last[0]},{p_last[1]} {p_last[0]-4},{p_last[1]-8} {p_last[0]+4},{p_last[1]-8}" class="flow-arrow"/>')
            else:
                res.append(f'    <polygon points="{p_last[0]},{p_last[1]} {p_last[0]-4},{p_last[1]+8} {p_last[0]+4},{p_last[1]+8}" class="flow-arrow"/>')
        else:
            if dx > 0:
                res.append(f'    <polygon points="{p_last[0]},{p_last[1]} {p_last[0]-8},{p_last[1]-4} {p_last[0]-8},{p_last[1]+4}" class="flow-arrow"/>')
            else:
                res.append(f'    <polygon points="{p_last[0]},{p_last[1]} {p_last[0]+8},{p_last[1]-4} {p_last[0]+8},{p_last[1]+4}" class="flow-arrow"/>')
        return "\n".join(res)

    def terminal_node(cx, cy, w, h, text, subtext=""):
        res = []
        res.append(f'    <rect x="{cx - w/2}" y="{cy - h/2}" width="{w}" height="{h}" rx="{h/2}" class="term-shape"/>')
        if subtext:
            res.append(f'    <text x="{cx}" y="{cy - 2}" class="term-txt">{xml_esc(text)}</text>')
            res.append(f'    <text x="{cx}" y="{cy + 13}" font-family="Courier New, monospace" font-size="10.5" fill="#444444" text-anchor="middle">{xml_esc(subtext)}</text>')
        else:
            res.append(f'    <text x="{cx}" y="{cy + 4}" class="term-txt">{xml_esc(text)}</text>')
        return "\n".join(res)

    def process_box(cx, cy, w, h, title, details, is_alt=False):
        res = []
        cls_name = "proc-alt" if is_alt else "proc-shape"
        res.append(f'    <rect x="{cx - w/2}" y="{cy - h/2}" width="{w}" height="{h}" class="{cls_name}"/>')
        top_y = cy - h/2 + 20
        res.append(f'    <text x="{cx - w/2 + 18}" y="{top_y}" class="proc-txt-title">{xml_esc(title)}</text>')
        res.append(f'    <line x1="{cx - w/2 + 18}" y1="{top_y + 6}" x2="{cx + w/2 - 18}" y2="{top_y + 6}" stroke="#000000" stroke-width="0.8"/>')
        line_y = top_y + 24
        for d in details:
            if d.startswith("`"):
                res.append(f'    <text x="{cx - w/2 + 18}" y="{line_y}" class="proc-code">{xml_esc(d.replace("`", ""))}</text>')
            else:
                res.append(f'    <text x="{cx - w/2 + 18}" y="{line_y}" class="proc-txt-desc">{xml_esc(d)}</text>')
            line_y += 18
        return "\n".join(res)

    def decision_diamond(cx, cy, w, h, q1, q2=""):
        res = []
        p1 = f"{cx},{cy - h/2}"
        p2 = f"{cx + w/2},{cy}"
        p3 = f"{cx},{cy + h/2}"
        p4 = f"{cx - w/2},{cy}"
        res.append(f'    <polygon points="{p1} {p2} {p3} {p4}" class="dec-shape"/>')
        if q2:
            res.append(f'    <text x="{cx}" y="{cy - 2}" class="dec-txt">{xml_esc(q1)}</text>')
            res.append(f'    <text x="{cx}" y="{cy + 13}" class="dec-txt">{xml_esc(q2)}</text>')
        else:
            res.append(f'    <text x="{cx}" y="{cy + 4}" class="dec-txt">{xml_esc(q1)}</text>')
        return "\n".join(res)

    def io_parallelogram(cx, cy, w, h, title, desc):
        res = []
        skew = 20
        x1 = cx - w/2 + skew
        y1 = cy - h/2
        x2 = cx + w/2
        y2 = cy - h/2
        x3 = cx + w/2 - skew
        y3 = cy + h/2
        x4 = cx - w/2
        y4 = cy + h/2
        res.append(f'    <polygon points="{x1},{y1} {x2},{y2} {x3},{y3} {x4},{y4}" class="io-shape"/>')
        res.append(f'    <text x="{cx}" y="{cy - 4}" class="io-txt-title">{xml_esc(title)}</text>')
        res.append(f'    <text x="{cx}" y="{cy + 13}" class="io-txt-desc">{xml_esc(desc)}</text>')
        return "\n".join(res)

    def data_store_cylinder(cx, cy, w, h, title, file_path, record_count):
        res = []
        rx = w / 2
        ry = 12
        y_top = cy - h/2
        y_bot = cy + h/2
        path_d = f"M {cx-rx},{y_top+ry} L {cx-rx},{y_bot-ry} A {rx} {ry} 0 0 0 {cx+rx} {y_bot-ry} L {cx+rx},{y_top+ry} Z"
        res.append(f'    <path d="{path_d}" class="store-body"/>')
        res.append(f'    <ellipse cx="{cx}" cy="{y_bot-ry}" rx="{rx}" ry="{ry}" class="store-ellipse"/>')
        res.append(f'    <ellipse cx="{cx}" cy="{y_top+ry}" rx="{rx}" ry="{ry}" class="store-ellipse"/>')
        res.append(f'    <text x="{cx}" y="{cy - 2}" class="store-txt-title">{xml_esc(title)}</text>')
        res.append(f'    <text x="{cx}" y="{cy + 14}" class="store-txt-sub">{xml_esc(file_path)}</text>')
        res.append(f'    <text x="{cx}" y="{cy + 28}" font-family="Segoe UI, Arial" font-size="10" fill="#222222" text-anchor="middle">[{xml_esc(record_count)}]</text>')
        return "\n".join(res)

    # =========================================================================
    # PART A (LEFT COLUMN): DATA INGESTION & CHUNKING ALGORITHM
    # X = 50 to 1570 (W = 1520), Center Axis = 810
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHẦN A: THUẬT TOÁN PHÂN ĐOẠN NGỮ NGHĨA & VECTOR HÓA TRI THỨC -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Part_A_Chunking_Algorithm">')
    lines.append('    <rect x="50" y="135" width="1520" height="2060" class="col-box"/>')
    lines.append('    <rect x="50" y="135" width="1520" height="42" class="col-hdr"/>')
    lines.append('    <text x="75" y="162" class="col-hdr-txt">PHẦN A: THUẬT TOÁN PHÂN ĐOẠN NGỮ NGHĨA (CHUNKING) &amp; VECTOR HÓA TRI THỨC</text>')
    lines.append('    <text x="1060" y="162" class="col-hdr-sub">OFFLINE PIPELINE • ChunkerService • VectorStoreService</text>')

    ax = 810  # Center axis for Part A

    # A1. Terminal Start
    lines.append(terminal_node(ax, 215, 440, 44, "BẮT ĐẦU: KHỞI ĐỘNG INGESTION PIPELINE", "npm run ingest / ChunkerService.chunkMarkdown()"))
    lines.append(draw_down_arrow(ax, 237, 275))

    # A2. Input Data (Markdown Files)
    lines.append(io_parallelogram(ax, 305, 560, 56, "ĐỌC TỆP NGUỒN MARKDOWN (.md)", "docs/knowledge-base/ (10 tệp SOP bưu chính, biểu phí, bảo hiểm, khiếu nại)"))
    lines.append(draw_down_arrow(ax, 333, 375))

    # A3. Process: AST Heading Parser
    lines.append(process_box(ax, 430, 640, 100, "BƯỚC 1: PHÂN TÍCH CÚ PHÁP HEADING AST", [
        "• Quét từng dòng văn bản, kiểm tra Regex phân cấp: ^(#{1,4})\\s+(.+)$",
        "• Nhận diện phân cấp tiêu đề Markdown: H1 (Chính sách), H2 (Điều khoản), H3/H4 (Mục con)",
        "• Tách các ranh giới Section độc lập, ngăn cắt ngang bảng cước & điều khoản pháp lý"
    ]))
    lines.append(draw_down_arrow(ax, 480, 525))

    # A4. Process: Section Buffering
    lines.append(process_box(ax, 580, 640, 100, "BƯỚC 2: GOM CỤM DỮ LIỆU THEO SECTION", [
        "• Trích xuất nội dung văn bản thuần: currentBuffer.join('\\n').trim()",
        "• Lưu trữ mảng đối tượng cấu trúc: sections = [{ title, level, text }]",
        "• Khởi tạo bộ đếm chuỗi phân đoạn: chunkSeq = 1"
    ]))
    lines.append(draw_down_arrow(ax, 630, 675))

    # A5. Loop over Sections
    lines.append(process_box(ax, 725, 640, 90, "BƯỚC 3: DUYỆT TỪNG SECTION & ĐẾM TỔNG TỪ", [
        "• Tách danh sách từ đơn: words = section.text.split(/\\s+/)",
        "• Xác định tổng số lượng từ của Section: W = words.length",
        "• Tham số ngưỡng kỹ thuật: MaxWords = 250 từ, Overlap = 40 từ"
    ]))
    lines.append(draw_down_arrow(ax, 770, 825))

    # A6. Decision Diamond: Word Count Threshold
    lines.append(decision_diamond(ax, 880, 360, 100, "Section có W <= 250 từ?", "(Ngưỡng MaxWords/Chunk)"))

    # Branch Left: W <= 250 (YES) -> Single Chunk
    branch_left_x = 460
    lines.append(draw_polyline_arrow([(ax - 180, 880), (branch_left_x, 880), (branch_left_x, 965)]))
    lines.append(f'    <rect x="477" y="855" width="135" height="22" class="pill-lbl"/>')
    lines.append(f'    <text x="545" y="870" text-anchor="middle" class="flow-lbl">[ĐÚNG: W &lt;= 250]</text>')

    lines.append(process_box(branch_left_x, 1045, 420, 145, "NHÁNH 1: TẠO SINGLE CHUNK", [
        "• Không cần cắt xẻ, giữ nguyên vẹn 100% ngữ cảnh gốc",
        "• ID phân đoạn: `${fileName}#chunk-${seq}`",
        "• Tiêu đề: `section.title` | Cấp độ: `section.level`",
        "• Nội dung: `section.text`",
        "• charCount = text.length | tokenEstimate = W * 1.3"
    ]))

    # Branch Right: W > 250 (NO) -> Sliding Window Overlap
    branch_right_x = 1160
    lines.append(draw_polyline_arrow([(ax + 180, 880), (branch_right_x, 880), (branch_right_x, 965)]))
    lines.append(f'    <rect x="1007" y="855" width="135" height="22" class="pill-lbl"/>')
    lines.append(f'    <text x="1075" y="870" text-anchor="middle" class="flow-lbl">[SAI: W &gt; 250 từ]</text>')

    lines.append(process_box(branch_right_x, 1045, 480, 145, "NHÁNH 2: CỬA SỔ TRƯỢT (SLIDING WINDOW)", [
        "• Khởi tạo con trỏ: start = 0",
        "• Cửa sổ cắt: end = min(start + 250, W)",
        "• Bước nhảy Stride = 250 - 40 = 210 từ | Overlap = 40 từ (16%)",
        "• Đặt tên Breadcrumb: `${title} (phần ${k})`",
        "• Tịnh tiến: start += 210 cho đến khi duyệt hết toàn bộ Section"
    ], is_alt=True))

    # Convergence (Join point)
    lines.append(draw_polyline_arrow([(branch_left_x, 1118), (branch_left_x, 1180), (ax, 1180)]))
    lines.append(draw_polyline_arrow([(branch_right_x, 1118), (branch_right_x, 1180), (ax, 1180)]))

    # A7. Process: Metadata Enrichment
    lines.append(draw_down_arrow(ax, 1180, 1225))
    lines.append(process_box(ax, 1285, 660, 110, "BƯỚC 4: ĐÓNG GÓI SIÊU DỮ LIỆU (METADATA ENRICHMENT)", [
        "• Gắn nhãn Breadcrumb: Tệp Nguồn > Tiêu Đề Mục Cha > Phân Đoạn Con",
        "• Cấu trúc DTO KnowledgeChunk: id, sourceFile, sectionTitle, level, content",
        "• Bổ sung charCount, tokenEstimate để kiểm soát chiều dài ngữ cảnh Token",
        "• Đẩy vào mảng tổng: allChunks.push(chunk)"
    ]))
    lines.append(draw_down_arrow(ax, 1340, 1385))

    # A8. Loop: Embedding Generation
    lines.append(process_box(ax, 1465, 660, 145, "BƯỚC 5: TẠO EMBEDDING VECTOR BẰNG AI", [
        "• Duyệt từng Chunk trong allChunks: Nạp văn bản vào Embedding Model",
        "• Model sử dụng: Google `models/gemini-embedding-001` (hoặc OpenAI text-embedding-3)",
        "• Kích thước Vector: D = 768 chiều thực (Không gian ngữ nghĩa R^768)",
        "• Chuẩn hóa L2-norm: ||V||_2 = 1.0 (Phục vụ tích vô hướng Cosine siêu tốc)",
        "• Gắn vector tương ứng vào đối tượng: chunk.embedding = [v_1, v_2, ..., v_768]"
    ]))
    lines.append(draw_down_arrow(ax, 1538, 1585))

    # A9. Data Store: Save to vector-index.json
    lines.append(data_store_cylinder(ax, 1650, 520, 105, "LƯU TRỮ VÀO TỆP CHỈ MỤC VECTOR INDEX", "docs/knowledge-base/vector-index.json", "44 Chunks • 10 Tệp SOP Nghiệp Vụ • 2.99 MB"))
    lines.append(draw_down_arrow(ax, 1705, 1755))

    # A10. Terminal End
    lines.append(terminal_node(ax, 1785, 460, 44, "KẾT THÚC: KHO TRI THỨC SẴN SÀNG", "Đã nạp vào RAM lúc khởi động (In-Memory Cosine Store)"))

    # Visual Architecture Box for Chunking Logic
    lines.append('    <rect x="100" y="1860" width="1420" height="270" fill="#FBFBFB" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 2" rx="4"/>')
    lines.append('    <text x="125" y="1890" font-size="13" font-weight="bold" fill="#000000">GIẢI THÍCH TOÁN HỌC &amp; ĐẶC TẢ THUẬT TOÁN SLIDING WINDOW TRONG CHUNKER:</text>')
    lines.append('    <text x="125" y="1918" font-size="12" fill="#222222">• Công thức xác định bước trượt: Stride = MaxWords - Overlap = 250 - 40 = 210 từ.</text>')
    lines.append('    <text x="125" y="1942" font-size="12" fill="#222222">• Tỷ lệ chồng lấn bảo toàn ngữ cảnh: R_overlap = Overlap / MaxWords = 40 / 250 = 16.0%.</text>')
    lines.append('    <text x="125" y="1966" font-size="12" fill="#222222">• Khắc phục lỗi đứt gãy ngữ cảnh (Context Fragmentation): Nếu đoạn văn bị cắt ngang giữa bảng tính cước và điều kiện,</text>')
    lines.append('    <text x="140" y="1988" font-size="12" fill="#222222">vùng đệm 40 từ gối đầu giúp Chunk tiếp theo vẫn giữ trọn mệnh đề "NẾU hàng dễ vỡ có mua bảo hiểm khai giá...".</text>')
    lines.append('    <text x="125" y="2014" font-size="12" fill="#222222">• Tốc độ Ingestion: Toàn bộ 10 tệp nghiệp vụ được phân đoạn và vector hóa trong dưới 4.5 giây.</text>')
    lines.append('    <text x="125" y="2038" font-size="12" font-family="Courier New, monospace" font-weight="bold" fill="#000000">• JSON Record Schema: { id, sourceFile, sectionTitle, level, content, charCount, tokenEstimate, embedding[768] }</text>')
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # PART B (RIGHT COLUMN): RUNTIME INFERENCE & TOOL CALLING ALGORITHM
    # X = 1730 to 3250 (W = 1520), Center Axis = 2490
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHẦN B: THUẬT TOÁN VẬN HÀNH THỜI GIAN THỰC CỦA CHATBOT     -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Part_B_Chatbot_Runtime_Algorithm">')
    lines.append('    <rect x="1730" y="135" width="1520" height="2060" class="col-box"/>')
    lines.append('    <rect x="1730" y="135" width="1520" height="42" class="col-hdr"/>')
    lines.append('    <text x="1755" y="162" class="col-hdr-txt">PHẦN B: THUẬT TOÁN VẬN HÀNH THỜI GIAN THỰC &amp; SUY LUẬN CỦA CHATBOT</text>')
    lines.append('    <text x="2700" y="162" class="col-hdr-sub">ONLINE INFERENCE • ChatService • LogisticsToolsService</text>')

    bx = 2490  # Center axis for Part B

    # B1. Terminal Start
    lines.append(terminal_node(bx, 215, 460, 44, "BẮT ĐẦU: TIẾP NHẬN TRUY VẤN CLIENT", "POST /api/v1/chat/message hoặc /stream"))
    lines.append(draw_down_arrow(bx, 237, 275))

    # B2. Input DTO
    lines.append(io_parallelogram(bx, 305, 600, 56, "DỮ LIỆU ĐẦU VÀO (ChatRequestDto)", "{ message: string, userId?: string, senderRole: 'GUEST'|'USER', conversationId }"))
    lines.append(draw_down_arrow(bx, 333, 375))

    # B3. NLP Router & Intent Normalization
    lines.append(process_box(bx, 430, 700, 105, "BƯỚC 1: TIỀN XỬ LÝ & BÓC TÁCH Ý ĐỊNH (NLP ROUTER)", [
        "• Chuẩn hóa Unicode tiếng Việt: NFD, xóa dấu tiếng Việt, chuyển chữ thường",
        "• Quét Regex phát hiện mã vận đơn: /\\b(NX[-_]?[A-Z0-9]{4,14}|101\\d{9}|...)\\b/",
        "• Quét Regex phát hiện mã khiếu nại: /\\b(CLM[-_]?[A-Z0-9]+)\\b/",
        "• Phân loại Intent: Tra cứu đơn, Khiếu nại đền bù, Tính cước IATA, Gặp nhân viên CSKH con người"
    ]))
    lines.append(draw_down_arrow(bx, 483, 535))

    # B4. Multi-Way Intent Dispatcher (Decision Diamond)
    lines.append(decision_diamond(bx, 590, 380, 100, "Phát hiện Intent gọi Tool?", "(Regex Match / Keyword Analysis)"))

    # Split: Tools Calling (Left Branch b_tool_x = 2100) vs Direct Query (Right Branch b_direct_x = 2880)
    b_tool_x = 2100
    b_direct_x = 2880

    lines.append(draw_polyline_arrow([(bx - 190, 590), (b_tool_x, 590), (b_tool_x, 655)]))
    lines.append(f'    <rect x="2125" y="565" width="150" height="22" class="pill-lbl"/>')
    lines.append(f'    <text x="2200" y="580" text-anchor="middle" class="flow-lbl">[CÓ INTENT / REGEX]</text>')

    lines.append(draw_polyline_arrow([(bx + 190, 590), (b_direct_x, 590), (b_direct_x, 860), (bx + 160, 860)]))
    lines.append(f'    <rect x="2697" y="565" width="165" height="22" class="pill-lbl"/>')
    lines.append(f'    <text x="2780" y="580" text-anchor="middle" class="flow-lbl">[KHÔNG: HỎI TRI THỨC]</text>')

    # B5. Dynamic Tool Calling Execution Box (b_tool_x)
    lines.append(process_box(b_tool_x, 745, 540, 170, "THỰC THI DYNAMIC TOOLS (FUNCTION CALLING)", [
        "1. Tra cứu đơn: `trackShipment(code)` -> tracking-service (:3008)",
        "   * NẾU Guest: Che PII (SĐT, Tên, Số nhà) bảo mật theo Luật Bưu chính",
        "   * NẾU User: Hiển thị đầy đủ timeline & thẻ bưu gửi ShipmentCard",
        "2. Đơn cá nhân: `getUserShipments(userId)` -> Liệt kê 5 đơn gần nhất",
        "3. Tính cước: `calculatePricing(route, weight, dims)` -> IATA V/6000",
        "4. Tiến độ bồi thường: `trackClaimStatus(claimCode)` -> Trả về tiền duyệt",
        "5. Cần người hỗ trợ: `escalateToHumanAgent()` -> Tạo ticket HIGH_PRIORITY"
    ], is_alt=True))

    lines.append(draw_polyline_arrow([(b_tool_x, 830), (b_tool_x, 860), (bx - 160, 860)]))

    # B6. Parallel RAG Semantic Search
    lines.append(draw_down_arrow(bx, 640, 895))
    lines.append(process_box(bx, 975, 700, 150, "BƯỚC 2: TÌM KIẾM TRI THỨC NGỮ NGHĨA HYBRID RAG", [
        "• Sinh vector câu hỏi: V_query = Embedding(user_message) [768 chiều thực]",
        "• Tính độ tương đồng Cosine với 44 Chunks trong In-Memory Vector Store:",
        "  `Cosine(V_q, V_i) = (V_q · V_i) / (||V_q|| * ||V_i||)`",
        "• Điểm tổng hợp Hybrid: `FinalScore = 0.70 * Cosine + 0.35 * LexicalScore`",
        "• Lọc ngưỡng nghiêm ngặt: `Điểm >= 0.52` (Loại bỏ triệt để đoạn văn rác gây nhiễu)",
        "• Trích xuất Top-3 Chunks liên quan nhất kèm Citation (Tệp nguồn, Tiêu đề mục)"
    ]))
    lines.append(draw_down_arrow(bx, 1050, 1095))

    # B7. Context Assembler
    lines.append(process_box(bx, 1165, 700, 130, "BƯỚC 3: TỔNG HỢP NGỮ CẢNH (CONTEXT ASSEMBLER)", [
        "• Ngữ cảnh 1: Dữ liệu thời gian thực từ Dynamic Tools (Hành trình / Bảng cước / Hồ sơ)",
        "• Ngữ cảnh 2: Tri thức quy chuẩn từ RAG (Biểu phí, Quy định bồi thường Điều 25)",
        "• Ngữ cảnh 3: Cảnh báo bảo mật PII (Yêu cầu đăng nhập nếu người dùng hỏi đơn riêng tư)",
        "• Cấu trúc hóa System Prompt: Đóng vai Chuyên viên Vận hành Cao cấp Nexus"
    ]))
    lines.append(draw_down_arrow(bx, 1230, 1275))

    # B8. LLM Inference & Dual Engine Fallback
    lines.append(process_box(bx, 1370, 700, 180, "BƯỚC 4: SUY LUẬN LLM VỚI DUAL-ENGINE FALLBACK", [
        "• ĐỘNG CƠ ƯU TIÊN 1: Google Gemini API (gemini-flash-latest / gemini-3.6-flash)",
        "  - Tốc độ suy luận siêu tốc: Thời gian phản hồi < 1.2 giây",
        "  - Cấu hình suy luận: Temperature = 0.2 (Chính xác, chống ảo giác hallucination)",
        "• CƠ CHẾ DỰ PHÒNG CHỊU LỖI (FALLBACK ENGINE):",
        "  - NẾU Gemini gặp sự cố 429 Rate Limit hoặc 503 Service Unavailable:",
        "  - Hệ thống tự động chuyển tiếp liền mạch sang OpenAI `gpt-4o-mini`",
        "  - Đảm bảo tính sẵn sàng hệ thống (High Availability) đạt 99.9%"
    ]))
    lines.append(draw_down_arrow(bx, 1460, 1515))

    # B9. Decision: Response Mode (SSE Streaming vs REST)
    lines.append(decision_diamond(bx, 1570, 360, 100, "Chế độ phản hồi?", "SSE Stream hay REST?"))

    # Branch Left: SSE Streaming
    stream_x = 2120
    lines.append(draw_polyline_arrow([(bx - 180, 1570), (stream_x, 1570), (stream_x, 1640)]))
    lines.append(f'    <rect x="2147" y="1545" width="135" height="22" class="pill-lbl"/>')
    lines.append(f'    <text x="2215" y="1560" text-anchor="middle" class="flow-lbl">[SSE STREAMING]</text>')

    lines.append(process_box(stream_x, 1710, 420, 130, "XUẤT DÒNG SỰ KIỆN (SSE)", [
        "• Bắn event `metadata`: { citations, tools }",
        "• Bắn event `token`: Gõ máy chữ nhịp 25ms",
        "• Bắn event `done`: { latencyMs, cards }",
        "• Trải nghiệm mượt mà, phản hồi tức thời"
    ]))

    # Branch Right: Non-streaming REST
    rest_x = 2860
    lines.append(draw_polyline_arrow([(bx + 180, 1570), (rest_x, 1570), (rest_x, 1640)]))
    lines.append(f'    <rect x="2697" y="1545" width="135" height="22" class="pill-lbl"/>')
    lines.append(f'    <text x="2765" y="1560" text-anchor="middle" class="flow-lbl">[REST JSON]</text>')

    lines.append(process_box(rest_x, 1710, 420, 130, "ĐÓNG GÓI JSON HOÀN CHỈNH", [
        "• DTO: ChatResponseDto",
        "• Trường: answer, citations, toolsUsed",
        "• Trường: shipmentCards (nếu có đơn)",
        "• Đo lường thời gian thực thi: latencyMs"
    ]))

    # Join to Output
    lines.append(draw_polyline_arrow([(stream_x, 1775), (stream_x, 1835), (bx, 1835)]))
    lines.append(draw_polyline_arrow([(rest_x, 1775), (rest_x, 1835), (bx, 1835)]))
    lines.append(draw_down_arrow(bx, 1835, 1875))

    # B10. Output Client Delivery
    lines.append(io_parallelogram(bx, 1905, 580, 56, "HIỂN THỊ GIAO DIỆN CLIENT (Rich UI Cards & Markdown)", "Mobile App (:8082) • Guest Web (:5177) • Ops Dashboard (:5173)"))
    lines.append(draw_down_arrow(bx, 1933, 1975))

    # B11. Terminal End
    lines.append(terminal_node(bx, 2005, 420, 44, "KẾT THÚC: HOÀN TẤT PHIÊN TƯƠNG TÁC", "Sẵn sàng nhận truy vấn tiếp theo trong Hội thoại"))

    # Visual Architecture Box for Runtime Guard
    lines.append('    <rect x="1780" y="2060" width="1420" height="75" fill="#FBFBFB" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 2" rx="4"/>')
    lines.append('    <text x="1805" y="2084" font-size="12.5" font-weight="bold" fill="#000000">CƠ CHẾ BẢO MẬT &amp; CHUYỂN GIAO CON NGƯỜI (HUMAN-IN-THE-LOOP - HITL):</text>')
    lines.append('    <text x="1805" y="2106" font-size="11.5" fill="#222222">• PII Sanitizer: Khách vãng lai tra cứu đơn người khác sẽ bị ẩn 60% ký tự nhạy cảm, ngăn rò rỉ dữ liệu theo Điều 6 Luật Bưu chính.</text>')
    lines.append('    <text x="1805" y="2124" font-size="11.5" fill="#222222">• Human Escalation: Khi gặp khiếu nại vỡ nát hoặc yêu cầu gặp người thật, AI tự động tạo Ticket đẩy vào `HIGH_PRIORITY_QUEUE` của Trưởng Hub.</text>')
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # CONNECTOR BRIDGE BETWEEN PART A AND PART B (DATA FLOW CORRIDOR)
    # Connecting vector-index.json (Part A) to Vector Store Service (Part B)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- LIÊN KẾT LUỒNG DỮ LIỆU GIỮA HAI THUẬT TOÁN (DATA BRIDGE)   -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Data_Bridge_Connection">')
    bridge_y = 1650
    lines.append(f'    <line x1="{ax + 260}" y1="{bridge_y}" x2="1670" y2="{bridge_y}" stroke="#000000" stroke-width="1.8" stroke-dasharray="6 3"/>')
    lines.append(f'    <polyline points="1670,{bridge_y} 1670,975 {bx - 350},975" stroke="#000000" stroke-width="1.8" stroke-dasharray="6 3" fill="none"/>')
    lines.append(f'    <polygon points="{bx - 350},975 {bx - 358},971 {bx - 358},979" class="flow-arrow"/>')
    lines.append('    <rect x="1575" y="1265" width="140" height="70" class="pill-lbl"/>')
    lines.append('    <text x="1645" y="1290" font-family="Segoe UI, Arial" font-size="11" font-weight="bold" fill="#000000" text-anchor="middle">ĐỒNG BỘ DỮ LIỆU</text>')
    lines.append('    <text x="1645" y="1308" font-family="Courier New, monospace" font-size="9.5" fill="#333333" text-anchor="middle">vector-index.json</text>')
    lines.append('    <text x="1645" y="1323" font-family="Segoe UI, Arial" font-size="9.5" fill="#555555" text-anchor="middle">nạp vào RAM Bộ nhớ</text>')
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # FOOTER & ISO/IEC STANDARD LEGEND
    # =========================================================================
    lines.append('  <!-- ==================== FOOTER & LEGEND ==================== -->')
    lines.append('  <g id="Footer_Legend">')
    lines.append(f'    <rect x="50" y="2210" width="{width-100}" height="65" fill="#FAFAFA" stroke="#000000" stroke-width="1.2"/>')
    lines.append('    <text x="75" y="2248" font-size="12.5" font-weight="bold" fill="#000000">KÝ HIỆU LƯU ĐỒ THUẬT TOÁN CHUẨN ISO/IEC 5807:</text>')

    # Legend symbols:
    # 1. Terminal Oval
    lines.append('    <rect x="420" y="2232" width="60" height="24" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>')
    lines.append('    <text x="490" y="2248" font-size="11" fill="#000000">: Bắt đầu / Kết thúc (Terminal)</text>')

    # 2. Process Rect
    lines.append('    <rect x="710" y="2232" width="50" height="24" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>')
    lines.append('    <text x="770" y="2248" font-size="11" fill="#000000">: Khối Xử lý thao tác (Process Step)</text>')

    # 3. Decision Diamond
    lines.append('    <polygon points="1040,2230 1060,2244 1040,2258 1020,2244" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>')
    lines.append('    <text x="1070" y="2248" font-size="11" fill="#000000">: Khối Rẽ nhánh điều kiện (Decision)</text>')

    # 4. Input/Output Parallelogram
    lines.append('    <polygon points="1350,2232 1395,2232 1385,2256 1340,2256" fill="#F9FAFB" stroke="#000000" stroke-width="1.4"/>')
    lines.append('    <text x="1405" y="2248" font-size="11" fill="#000000">: Khối Nhập / Xuất dữ liệu (Data I/O)</text>')

    # 5. Cylinder
    lines.append('    <ellipse cx="1700" cy="2236" rx="15" ry="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>')
    lines.append('    <rect x="1685" y="2236" width="30" height="15" fill="#F4F4F5" stroke="#000000" stroke-width="1.2"/>')
    lines.append('    <ellipse cx="1700" cy="2251" rx="15" ry="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>')
    lines.append('    <text x="1725" y="2248" font-size="11" fill="#000000">: Tệp dữ liệu / Chỉ mục Vector (Data Store)</text>')

    lines.append(f'    <text x="{width-480}" y="2248" font-size="11" font-style="italic" fill="#555555">Dễ dàng chỉnh sửa thủ công trên Figma / Draw.io (100% Vector)</text>')
    lines.append('  </g>')

    lines.append('</svg>')
    return "\n".join(lines)

if __name__ == "__main__":
    svg_content = generate_svg()
    target_path = os.path.abspath("docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/04-flowchart-chunking-and-chatbot-runtime.svg")
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated successfully: {target_path} ({len(svg_content.encode('utf-8'))} bytes)")
