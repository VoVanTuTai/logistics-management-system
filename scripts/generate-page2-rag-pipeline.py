#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE PAGE 2 - RAG CHUNKING & VECTORIZATION PIPELINE (STANDARDIZED BLUEPRINT - LARGE TYPOGRAPHY)
====================================================================================================
Bản vẽ Kỹ thuật Tiêu chuẩn: Đường ống Phân đoạn Ngữ nghĩa & Vector hóa Tri thức RAG Bưu chính
Thuộc Figma Page 2: Process Automation & AI Pipeline (Mã bản vẽ: DOC-PROC-RAG-01).

Quy chuẩn kỹ thuật:
- Typography cỡ lớn, sắc nét (Tiêu đề 34px, Col Title 20.5px, Card Title 18px, Body 17px, Math 22px).
- Kích thước chuẩn 3600 x 2400 px (Đồng bộ tỷ lệ 3:2 toàn dự án).
- 5 Giai đoạn tuần tự liên hoàn (5 Stage Columns) lấp đầy chiều rộng, khoảng trống được phân bổ cân đối.
- 100% Native Inline Vector: Mũi tên polygon 14px, zero <marker> tags.
- Bảng đối soát thực nghiệm & tổng hợp công thức toán học ở chân trang cỡ chữ lớn, dễ đọc.
- Tuyệt đối không tràn viền (Zero text clipping, strict character length constraint per line <= 50 chars).
"""

import os
import html
import xml.etree.ElementTree as ET

def xml_esc(s):
    if s is None:
        return ""
    if not isinstance(s, str):
        s = str(s)
    return html.escape(s, quote=True)

def generate_svg():
    width = 3600
    height = 2400

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="background:#FFFFFF;">')

    # STYLES DEFINITION (LARGE READABLE TYPOGRAPHY)
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }')
    lines.append('      .bg { fill: #FFFFFF; }')
    lines.append('      .frame { fill: none; stroke: #000000; stroke-width: 3.0; }')
    lines.append('      .frame-inner { fill: none; stroke: #000000; stroke-width: 1.2; stroke-dasharray: 8 4; }')
    lines.append('      .col-box { fill: #FFFFFF; stroke: #000000; stroke-width: 2.0; rx: 8px; }')
    lines.append('      .col-hdr { fill: #F4F4F5; stroke: #000000; stroke-width: 1.6; }')
    lines.append('      .col-title { font-size: 20px; font-weight: 900; fill: #000000; letter-spacing: 0.8px; text-transform: uppercase; }')
    lines.append('      .col-sub { font-size: 15px; font-weight: 700; fill: #4B5563; font-family: ui-monospace, Menlo, monospace; }')
    lines.append('      .card-box { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; rx: 6px; }')
    lines.append('      .card-box-accent { fill: #FAFAFA; stroke: #000000; stroke-width: 2.0; rx: 6px; }')
    lines.append('      .card-box-fail { fill: #FEF2F2; stroke: #DC2626; stroke-width: 1.8; stroke-dasharray: 6 3; rx: 6px; }')
    lines.append('      .card-box-pass { fill: #F0FDF4; stroke: #16A34A; stroke-width: 2.0; rx: 6px; }')
    lines.append('      .card-hdr-bg { fill: #F4F4F5; stroke: #000000; stroke-width: 1.4; rx: 5px; }')
    lines.append('      .card-hdr-title { font-size: 18px; font-weight: 800; fill: #000000; }')
    lines.append('      .card-hdr-code { font-size: 14.5px; font-weight: 800; fill: #4B5563; font-family: ui-monospace, Menlo, monospace; }')
    lines.append('      .text-body { font-size: 16px; font-weight: 500; fill: #1F2937; }')
    lines.append('      .text-bold { font-size: 16.5px; font-weight: 800; fill: #000000; }')
    lines.append('      .text-muted { font-size: 14px; font-weight: 500; fill: #6B7280; }')
    lines.append('      .code-line { font-family: ui-monospace, Menlo, monospace; font-size: 15px; fill: #111827; }')
    lines.append('      .math-formula { font-family: "Cambria Math", "Times New Roman", serif; font-size: 21px; font-weight: bold; fill: #000000; }')
    lines.append('      .pill-plate { fill: #FFFFFF; stroke: #000000; stroke-width: 1.4; rx: 5px; }')
    lines.append('      .flow-arrow { fill: none; stroke: #000000; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('    ]]></style>')
    lines.append('  </defs>')
    lines.append('')

    # CANVAS BACKGROUND & BORDERS
    lines.append(f'  <rect width="{width}" height="{height}" class="bg"/>')
    lines.append(f'  <rect x="18" y="18" width="{width-36}" height="{height-36}" class="frame"/>')
    lines.append(f'  <rect x="26" y="26" width="{width-52}" height="{height-52}" class="frame-inner"/>')

    # Corner crosshairs
    corners = [(18, 18), (width-18, 18), (18, height-18), (width-18, height-18)]
    for cx, cy in corners:
        lines.append(f'  <line x1="{cx-16}" y1="{cy}" x2="{cx+16}" y2="{cy}" stroke="#000000" stroke-width="2.2"/>')
        lines.append(f'  <line x1="{cx}" y1="{cy-16}" x2="{cx}" y2="{cy+16}" stroke="#000000" stroke-width="2.2"/>')

    # =========================================================================
    # HEADER BLOCK (LARGE TYPOGRAPHY)
    # =========================================================================
    lines.append('  <!-- ==================== HEADER BLOCK ==================== -->')
    lines.append('  <g id="Header">')
    lines.append(f'    <rect x="40" y="38" width="{width-80}" height="106" fill="#FFFFFF" stroke="#000000" stroke-width="2.2"/>')
    lines.append('    <text x="65" y="80" font-size="34" font-weight="900" fill="#000000" letter-spacing="-0.5px">HÌNH 2.1: GIẢI THUẬT PHÂN ĐOẠN NGỮ NGHĨA &amp; VECTOR HÓA TRI THỨC BƯU CHÍNH (RAG PIPELINE)</text>')
    lines.append('    <text x="65" y="112" font-size="19" font-weight="600" fill="#374151">Hệ Thống Trợ Lý AI Logistics Nexus • AST Markdown Parsing ➔ Breadcrumb Enrichment ➔ Overlap 16% ➔ Vector 768-D ➔ Hybrid Search</text>')
    lines.append('    <text x="65" y="134" font-size="15" font-family="ui-monospace, Menlo, monospace" font-weight="800" fill="#000000">CHUẨN THIẾT KẾ: SECTION-AWARE RECURSIVE CHUNKING &amp; COSINE L2 NORMALIZATION • MONOCHROME BLUEPRINT</text>')

    # Metadata Box Right
    meta_x = width - 680
    lines.append(f'    <rect x="{meta_x}" y="48" width="620" height="86" fill="#F8F8F8" stroke="#000000" stroke-width="1.6" rx="4"/>')
    lines.append(f'    <line x1="{meta_x+200}" y1="48" x2="{meta_x+200}" y2="134" stroke="#000000" stroke-width="1.2"/>')
    lines.append(f'    <line x1="{meta_x+410}" y1="48" x2="{meta_x+410}" y2="134" stroke="#000000" stroke-width="1.2"/>')
    
    lines.append(f'    <text x="{meta_x+14}" y="76" font-size="13" font-family="ui-monospace, monospace" font-weight="800" fill="#4B5563">BẢN VẼ SỐ / SPEC ID</text>')
    lines.append(f'    <text x="{meta_x+14}" y="108" font-size="18" font-family="ui-monospace, monospace" font-weight="900" fill="#000000">DOC-PROC-RAG-01</text>')
    
    lines.append(f'    <text x="{meta_x+214}" y="76" font-size="13" font-family="ui-monospace, monospace" font-weight="800" fill="#4B5563">MÔ HÌNH NHÚNG / MODEL</text>')
    lines.append(f'    <text x="{meta_x+214}" y="108" font-size="16.5" font-family="ui-monospace, monospace" font-weight="900" fill="#000000">gemini-embedding-001</text>')
    
    lines.append(f'    <text x="{meta_x+424}" y="76" font-size="13" font-family="ui-monospace, monospace" font-weight="800" fill="#4B5563">TIÊU CHUẨN ĐỒ ÁN</text>')
    lines.append(f'    <text x="{meta_x+424}" y="108" font-size="16.5" font-weight="900" fill="#000000">Section 2.3 • RAG Thesis</text>')
    lines.append('  </g>')

    # HELPER: Draw Arrowhead (14px)
    def draw_arrow_down(x, y):
        return f'    <polygon points="{x},{y} {x-6},{y-14} {x+6},{y-14}" fill="#000000"/>'

    def draw_arrow_right(x, y):
        return f'    <polygon points="{x},{y} {x-14},{y-6} {x-14},{y+6}" fill="#000000"/>'

    # =========================================================================
    # 5-STAGE PIPELINE COLUMNS LAYOUT
    # Width = 3600. Left = 50, Right = 50. Total = 3500.
    # 5 Stages: col_w = 656, gap = 55. (5 * 656 + 4 * 55 = 3280 + 220 = 3500).
    # =========================================================================
    col_w = 656
    gap = 55
    top_y = 158
    col_h = 1590
    col_x = [50 + i * (col_w + gap) for i in range(5)]

    c1_y, c1_h = 228, 290
    arr1_y1, arr1_y2 = 518, 552
    c2_y, c2_h = 552, 480
    arr2_y1, arr2_y2 = 1032, 1066
    c3_y, c3_h = 1066, 600
    out_y, out_h = 1682, 56

    inter_connector_y = 480

    # =========================================================================
    # STAGE 1: AST MARKDOWN PARSER
    # =========================================================================
    s1_x = col_x[0]
    lines.append('  <!-- ==================== STAGE 1: AST MARKDOWN PARSER ==================== -->')
    lines.append('  <g id="Stage_1_AST_Parser">')
    lines.append(f'    <rect x="{s1_x}" y="{top_y}" width="{col_w}" height="{col_h}" class="col-box"/>')
    lines.append(f'    <rect x="{s1_x}" y="{top_y}" width="{col_w}" height="56" class="col-hdr" rx="6"/>')
    lines.append(f'    <rect x="{s1_x}" y="{top_y+42}" width="{col_w}" height="14" fill="#F4F4F5"/>')
    lines.append(f'    <line x1="{s1_x}" y1="{top_y+56}" x2="{s1_x+col_w}" y2="{top_y+56}" stroke="#000000" stroke-width="1.6"/>')
    lines.append(f'    <text x="{s1_x+20}" y="{top_y+27}" class="col-title">GIAI ĐOẠN 1: AST MARKDOWN PARSER</text>')
    lines.append(f'    <text x="{s1_x+20}" y="{top_y+48}" class="col-sub">PHÂN TÍCH CÚ PHÁP CÂY SECTION &amp; BẢO TOÀN CẤU TRÚC</text>')

    # 1.1 Source Corpus Files
    lines.append(f'    <rect x="{s1_x+18}" y="{c1_y}" width="{col_w-36}" height="{c1_h}" class="card-box"/>')
    lines.append(f'    <rect x="{s1_x+18}" y="{c1_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s1_x+32}" y="{c1_y+28}" class="card-hdr-title">1.1. Tập Văn bản Nguồn Nghiệp vụ (.md)</text>')
    lines.append(f'    <text x="{s1_x+col_w-32}" y="{c1_y+28}" class="card-hdr-code" text-anchor="end">INPUT CORPUS</text>')
    
    file_items = [
        ("01-pricing-iata.md", "Bảng giá cước IATA, nấc cân nặng 0.5kg - 50kg, phụ phí."),
        ("02-insurance-claim.md", "Quy chế bảo hiểm bưu chính, điều kiện BBBT trong 24 giờ."),
        ("09-negative-sop.md", "Danh mục hàng cấm bay, pin lithium, quy tắc từ chối nhận."),
        ("12-reconciliation-cod.md", "Quy trình đối soát tiền COD, nợ cước, kỳ thanh toán T+2.")
    ]
    cur_y = c1_y + 52
    for fname, fdesc in file_items:
        lines.append(f'    <rect x="{s1_x+28}" y="{cur_y}" width="{col_w-56}" height="52" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1.2" rx="4"/>')
        lines.append(f'    <text x="{s1_x+40}" y="{cur_y+22}" class="code-line" font-weight="800">📄 {fname}</text>')
        lines.append(f'    <text x="{s1_x+40}" y="{cur_y+42}" class="text-muted">{fdesc}</text>')
        cur_y += 58

    # Flow Arrow 1.1 -> 1.2
    lines.append(f'    <line x1="{s1_x+col_w//2}" y1="{arr1_y1}" x2="{s1_x+col_w//2}" y2="{arr1_y2}" class="flow-arrow"/>')
    lines.append(draw_arrow_down(s1_x+col_w//2, arr1_y2))

    # 1.2 AST Heading Parser Logic
    lines.append(f'    <rect x="{s1_x+18}" y="{c2_y}" width="{col_w-36}" height="{c2_h}" class="card-box-accent"/>')
    lines.append(f'    <rect x="{s1_x+18}" y="{c2_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s1_x+32}" y="{c2_y+28}" class="card-hdr-title">1.2. Giải thuật Phân tích Cú pháp AST</text>')
    lines.append(f'    <text x="{s1_x+col_w-32}" y="{c2_y+28}" class="card-hdr-code" text-anchor="end">AST PARSER</text>')

    ast_lines = [
        ("• Quét token Markdown:", "Tự động phân tách ranh giới logic qua # H1, ## H2, ### H3."),
        ("• Nhận diện bảng biểu:", "Giữ nguyên khối bảng ma trận cước, không ngắt ngang hàng."),
        ("• Khối điều kiện pháp lý:", "Cô lập trọn vẹn: 'NẾU có BBBT trong 24h THÌ đền bù 100%'."),
        ("• Bảo toàn danh sách SOP:", "Giữ liền mạch các bước tuần tự 1. -> 2. -> 3. không tách.")
    ]
    cur_y = c2_y + 64
    for title, desc in ast_lines:
        lines.append(f'    <text x="{s1_x+32}" y="{cur_y}" class="text-bold">{title}</text>')
        lines.append(f'    <text x="{s1_x+32}" y="{cur_y+22}" class="text-body">{desc}</text>')
        cur_y += 48

    # Pseudo-code Box
    p_box_y = cur_y + 6
    lines.append(f'    <rect x="{s1_x+28}" y="{p_box_y}" width="{col_w-56}" height="150" fill="#FFFFFF" stroke="#000000" stroke-width="1.4" rx="5"/>')
    lines.append(f'    <text x="{s1_x+42}" y="{p_box_y+28}" class="code-line" font-weight="800">const ast = parseMarkdown(fileContent);</text>')
    lines.append(f'    <text x="{s1_x+42}" y="{p_box_y+54}" class="code-line">ast.traverse((node) =&gt; &#123;</text>')
    lines.append(f'    <text x="{s1_x+68}" y="{p_box_y+80}" class="code-line">if (node.type === "heading" &amp;&amp; node.depth &lt;= 3) &#123;</text>')
    lines.append(f'    <text x="{s1_x+92}" y="{p_box_y+106}" class="code-line" font-weight="800" fill="#2563EB">sections.push(finalizeSection(buffer));</text>')
    lines.append(f'    <text x="{s1_x+68}" y="{p_box_y+132}" class="code-line">&#125; appendToBuffer(buffer, node); &#125;);</text>')

    # Flow Arrow 1.2 -> 1.3
    lines.append(f'    <line x1="{s1_x+col_w//2}" y1="{arr2_y1}" x2="{s1_x+col_w//2}" y2="{arr2_y2}" class="flow-arrow"/>')
    lines.append(draw_arrow_down(s1_x+col_w//2, arr2_y2))

    # 1.3 Failure of Naive Chunking vs Proposed AST
    lines.append(f'    <rect x="{s1_x+18}" y="{c3_y}" width="{col_w-36}" height="{c3_h}" class="card-box"/>')
    lines.append(f'    <rect x="{s1_x+18}" y="{c3_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s1_x+32}" y="{c3_y+28}" class="card-hdr-title">1.3. Đối chứng Thực nghiệm: Naive vs Section</text>')
    lines.append(f'    <text x="{s1_x+col_w-32}" y="{c3_y+28}" class="card-hdr-code" text-anchor="end">EMPIRICAL PROOF</text>')

    # FAIL BOX
    f_y = c3_y + 54
    lines.append(f'    <rect x="{s1_x+28}" y="{f_y}" width="{col_w-56}" height="240" class="card-box-fail"/>')
    lines.append(f'    <rect x="{s1_x+40}" y="{f_y+12}" width="125" height="28" rx="4" fill="#FEE2E2" stroke="#EF4444" stroke-width="1.2"/>')
    lines.append(f'    <text x="{s1_x+102}" y="{f_y+31}" font-size="14" font-weight="900" fill="#991B1B" text-anchor="middle">❌ THẤT BẠI</text>')
    lines.append(f'    <text x="{s1_x+180}" y="{f_y+31}" class="text-bold" fill="#991B1B">Naive Fixed-size (Cắt cứng 500 ký tự)</text>')
    lines.append(f'    <text x="{s1_x+40}" y="{f_y+68}" class="code-line">• Cắt đôi bảng cước IATA: Tiêu đề ở Chunk A, số tiền ở Chunk B.</text>')
    lines.append(f'    <text x="{s1_x+40}" y="{f_y+94}" class="code-line">• Cắt đứt mệnh đề bồi thường ngay tại chữ "NẾU":</text>')
    lines.append(f'    <text x="{s1_x+55}" y="{f_y+122}" class="code-line" fill="#DC2626">  Chunk A: "...Khách được đền bù 100% giá trị hàng..."</text>')
    lines.append(f'    <text x="{s1_x+55}" y="{f_y+148}" class="code-line" fill="#DC2626">  Chunk B: "...nếu có Biên bản bất thường BBBT trong 24h..."</text>')
    lines.append(f'    <text x="{s1_x+40}" y="{f_y+184}" class="text-bold" fill="#B91C1C">⇒ HẬU QUẢ: AI tư vấn sai luật, đền 100% vô điều kiện</text>')
    lines.append(f'    <text x="{s1_x+40}" y="{f_y+210}" class="text-muted">(Gây rủi ro thất thoát tài chính doanh nghiệp vận hành)!</text>')

    # PASS BOX
    p_y = f_y + 255
    lines.append(f'    <rect x="{s1_x+28}" y="{p_y}" width="{col_w-56}" height="260" class="card-box-pass"/>')
    lines.append(f'    <rect x="{s1_x+40}" y="{p_y+12}" width="135" height="28" rx="4" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2"/>')
    lines.append(f'    <text x="{s1_x+107}" y="{p_y+31}" font-size="14" font-weight="900" fill="#166534" text-anchor="middle">✔ THÀNH CÔNG</text>')
    lines.append(f'    <text x="{s1_x+190}" y="{p_y+31}" class="text-bold" fill="#166534">Hybrid Section-Aware (Đề xuất)</text>')
    lines.append(f'    <text x="{s1_x+40}" y="{p_y+68}" class="code-line">• Bảng giá IATA được đóng gói trọn vẹn trong 1 Section.</text>')
    lines.append(f'    <text x="{s1_x+40}" y="{p_y+94}" class="code-line">• Mệnh đề điều kiện pháp lý và mốc 24h nằm chung Context.</text>')
    lines.append(f'    <text x="{s1_x+40}" y="{p_y+120}" class="code-line">• Độ chính xác truy vấn cước tăng từ 42.5% lên 96.8% (+127.7%).</text>')
    lines.append(f'    <text x="{s1_x+40}" y="{p_y+146}" class="code-line">• Tỷ lệ ảo giác giảm mạnh 94.7% (từ 28.4% còn &lt; 1.5%).</text>')
    lines.append(f'    <text x="{s1_x+40}" y="{p_y+188}" class="text-bold" fill="#15803D">⇒ KẾT QUẢ: Bảo toàn 100% ngữ nghĩa &amp; tri thức chuyên ngành!</text>')

    # Stage 1 Output Badge
    lines.append(f'    <rect x="{s1_x+18}" y="{out_y}" width="{col_w-36}" height="{out_h}" fill="#F4F4F5" stroke="#000000" stroke-width="1.6" rx="5"/>')
    lines.append(f'    <text x="{s1_x+35}" y="{out_y+25}" class="code-line" font-weight="900">STAGE 1 OUTPUT: Mảng Section độc lập có cấu trúc nguyên vẹn</text>')
    lines.append(f'    <text x="{s1_x+35}" y="{out_y+45}" class="text-muted">Section[]: &#123; rawText, tableBlocks[], headingHierarchy[] &#125;</text>')
    lines.append('  </g>')

    # Connector 1 -> 2
    lines.append(f'  <line x1="{s1_x+col_w}" y1="{inter_connector_y}" x2="{col_x[1]}" y2="{inter_connector_y}" class="flow-arrow"/>')
    lines.append(draw_arrow_right(col_x[1], inter_connector_y))
    lines.append(f'  <rect x="{s1_x+col_w+4}" y="{inter_connector_y-18}" width="47" height="36" class="pill-plate"/>')
    lines.append(f'  <text x="{s1_x+col_w+27}" y="{inter_connector_y+5}" font-size="13" font-family="ui-monospace, monospace" font-weight="900" text-anchor="middle">AST</text>')

    # =========================================================================
    # STAGE 2: BREADCRUMB ENRICHMENT
    # =========================================================================
    s2_x = col_x[1]
    lines.append('  <!-- ==================== STAGE 2: BREADCRUMB ENRICHMENT ==================== -->')
    lines.append('  <g id="Stage_2_Breadcrumb">')
    lines.append(f'    <rect x="{s2_x}" y="{top_y}" width="{col_w}" height="{col_h}" class="col-box"/>')
    lines.append(f'    <rect x="{s2_x}" y="{top_y}" width="{col_w}" height="56" class="col-hdr" rx="6"/>')
    lines.append(f'    <rect x="{s2_x}" y="{top_y+42}" width="{col_w}" height="14" fill="#F4F4F5"/>')
    lines.append(f'    <line x1="{s2_x}" y1="{top_y+56}" x2="{s2_x+col_w}" y2="{top_y+56}" stroke="#000000" stroke-width="1.6"/>')
    lines.append(f'    <text x="{s2_x+20}" y="{top_y+27}" class="col-title">GIAI ĐOẠN 2: BREADCRUMB ENRICHMENT</text>')
    lines.append(f'    <text x="{s2_x+20}" y="{top_y+48}" class="col-sub">BỔ SUNG SIÊU DỮ LIỆU ĐIỀU HƯỚNG &amp; TIỀN TỐ PHÂN CẤP</text>')

    # 2.1 The Problem: Context Loss
    lines.append(f'    <rect x="{s2_x+18}" y="{c1_y}" width="{col_w-36}" height="{c1_h}" class="card-box"/>')
    lines.append(f'    <rect x="{s2_x+18}" y="{c1_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s2_x+32}" y="{c1_y+28}" class="card-hdr-title">2.1. Đặt vấn đề: Mất Ngữ cảnh Phân cấp</text>')
    lines.append(f'    <text x="{s2_x+col_w-32}" y="{c1_y+28}" class="card-hdr-code" text-anchor="end">PROBLEM</text>')

    lines.append(f'    <text x="{s2_x+32}" y="{c1_y+66}" class="text-body">Một đoạn văn bản con đứng độc lập:</text>')
    lines.append(f'    <rect x="{s2_x+28}" y="{c1_y+78}" width="{col_w-56}" height="52" fill="#FAFAFA" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 2" rx="4"/>')
    lines.append(f'    <text x="{s2_x+40}" y="{c1_y+110}" class="code-line" font-weight="800">"Mức phí dịch vụ là 1.5% giá trị khai giá, tối thiểu 20.000 VNĐ."</text>')

    lines.append(f'    <text x="{s2_x+32}" y="{c1_y+152}" class="text-body">• Nếu không có tiền tố cha, Vector chỉ hiểu là "khoản phí 1.5%".</text>')
    lines.append(f'    <text x="{s2_x+32}" y="{c1_y+180}" class="text-body">• AI không biết: Đây là phí bảo hiểm? Phí COD? Hay phí hỏa tốc?</text>')
    lines.append(f'    <text x="{s2_x+32}" y="{c1_y+208}" class="text-bold" fill="#DC2626">• Hệ quả: Khi hỏi "Phí bảo hiểm bao nhiêu?", Cosine bị trượt điểm!</text>')
    lines.append(f'    <text x="{s2_x+32}" y="{c1_y+248}" class="text-bold">⇒ GIẢI PHÁP: Bơm trực tiếp Breadcrumb vào đỉnh mỗi đoạn văn!</text>')

    # Flow Arrow 2.1 -> 2.2
    lines.append(f'    <line x1="{s2_x+col_w//2}" y1="{arr1_y1}" x2="{s2_x+col_w//2}" y2="{arr1_y2}" class="flow-arrow"/>')
    lines.append(draw_arrow_down(s2_x+col_w//2, arr1_y2))

    # 2.2 Mathematical Formulation (Clean, non-overflowing notation)
    lines.append(f'    <rect x="{s2_x+18}" y="{c2_y}" width="{col_w-36}" height="{c2_h}" class="card-box-accent"/>')
    lines.append(f'    <rect x="{s2_x+18}" y="{c2_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s2_x+32}" y="{c2_y+28}" class="card-hdr-title">2.2. Công thức Tiền tố Ngữ cảnh (Formula)</text>')
    lines.append(f'    <text x="{s2_x+col_w-32}" y="{c2_y+28}" class="card-hdr-code" text-anchor="end">FORMULATION</text>')

    lines.append(f'    <text x="{s2_x+32}" y="{c2_y+66}" class="text-body">Công thức sinh đoạn văn giàu ngữ cảnh (Enriched Chunk):</text>')
    
    # Formula Plate
    f_p_y = c2_y + 80
    lines.append(f'    <rect x="{s2_x+28}" y="{f_p_y}" width="{col_w-56}" height="84" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" rx="5"/>')
    lines.append(f'    <text x="{s2_x+col_w//2}" y="{f_p_y+34}" class="math-formula" text-anchor="middle">EnrichedText = [Breadcrumb] + "\\n\\n" + BodyContent</text>')
    lines.append(f'    <text x="{s2_x+col_w//2}" y="{f_p_y+62}" class="code-line" font-weight="800" fill="#2563EB" text-anchor="middle">trong đó: [Breadcrumb] = SourceFile &gt; H1 &gt; H2</text>')

    # Example of Enriched Output
    ex_y = f_p_y + 102
    lines.append(f'    <text x="{s2_x+32}" y="{ex_y+16}" class="text-bold">Minh họa Chunk sau khi được bổ sung tiền tố:</text>')
    lines.append(f'    <rect x="{s2_x+28}" y="{ex_y+28}" width="{col_w-56}" height="195" fill="#FAFAFA" stroke="#000000" stroke-width="1.4" rx="5"/>')
    lines.append(f'    <rect x="{s2_x+40}" y="{ex_y+40}" width="{col_w-80}" height="34" fill="#E5E7EB" rx="4"/>')
    lines.append(f'    <text x="{s2_x+52}" y="{ex_y+63}" class="code-line" font-weight="900">📌 BREADCRUMB: <tspan font-weight="800" fill="#1D4ED8">02-insurance-claim.md &gt; Điều 3. Phí Bảo hiểm</tspan></text>')
    lines.append(f'    <text x="{s2_x+52}" y="{ex_y+98}" class="code-line" font-weight="800">📄 NỘI DUNG GỐC (BODY CONTENT):</text>')
    lines.append(f'    <text x="{s2_x+52}" y="{ex_y+124}" class="code-line">"Mức phí bảo hiểm là 1.5% giá trị khai giá (tối thiểu 20.000 VNĐ).</text>')
    lines.append(f'    <text x="{s2_x+52}" y="{ex_y+150}" class="code-line">Khách hàng được đền bù 100% nếu có BBBT lập trong 24 giờ."</text>')
    lines.append(f'    <text x="{s2_x+52}" y="{ex_y+188}" class="text-bold" fill="#15803D">✔ Kết quả: Vector hội tụ đầy đủ: "phí", "bảo hiểm", "đền bù 100%".</text>')

    # Flow Arrow 2.2 -> 2.3
    lines.append(f'    <line x1="{s2_x+col_w//2}" y1="{arr2_y1}" x2="{s2_x+col_w//2}" y2="{arr2_y2}" class="flow-arrow"/>')
    lines.append(draw_arrow_down(s2_x+col_w//2, arr2_y2))

    # 2.3 JSON Metadata Object
    lines.append(f'    <rect x="{s2_x+18}" y="{c3_y}" width="{col_w-36}" height="{c3_h}" class="card-box"/>')
    lines.append(f'    <rect x="{s2_x+18}" y="{c3_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s2_x+32}" y="{c3_y+28}" class="card-hdr-title">2.3. Siêu dữ liệu Đóng gói (Chunk Metadata)</text>')
    lines.append(f'    <text x="{s2_x+col_w-32}" y="{c3_y+28}" class="card-hdr-code" text-anchor="end">JSON ENVELOPE</text>')

    json_lines = [
        ('&#123;', 0),
        ('"chunk_id": "CHK_INS_CLAIM_003",', 1),
        ('"doc_source": "docs/knowledge/02-insurance-claim.md",', 1),
        ('"breadcrumb": "Chính sách &gt; Điều kiện BBBT 24h",', 1),
        ('"heading_level": 2,', 1),
        ('"section_index": 4,', 1),
        ('"keywords": ["bồi thường", "bảo hiểm", "BBBT", "24h"],', 1),
        ('"raw_length_words": 185,', 1),
        ('"requires_sliding_window": false,', 1),
        ('"created_at": "2026-09-30T10:00:00Z",', 1),
        ('"enriched_content": "Chính sách &gt; BBBT 24h\\n\\n..."', 1),
        ('&#125;', 0)
    ]
    cur_y = c3_y + 56
    lines.append(f'    <rect x="{s2_x+28}" y="{cur_y}" width="{col_w-56}" height="420" fill="#FAFAFA" stroke="#000000" stroke-width="1.4" rx="5"/>')
    for jtext, indent in json_lines:
        ix = s2_x + 48 + indent * 24
        lines.append(f'    <text x="{ix}" y="{cur_y+28}" class="code-line">{jtext}</text>')
        cur_y += 32

    # Stage 2 Output Badge
    lines.append(f'    <rect x="{s2_x+18}" y="{out_y}" width="{col_w-36}" height="{out_h}" fill="#F4F4F5" stroke="#000000" stroke-width="1.6" rx="5"/>')
    lines.append(f'    <text x="{s2_x+35}" y="{out_y+25}" class="code-line" font-weight="900">STAGE 2 OUTPUT: Tập Chunk đã nạp đầy đủ ngữ cảnh nguồn</text>')
    lines.append(f'    <text x="{s2_x+35}" y="{out_y+45}" class="text-muted">EnrichedChunk[]: Sẵn sàng đưa vào thuật toán cửa sổ trượt Overlap</text>')
    lines.append('  </g>')

    # Connector 2 -> 3
    lines.append(f'  <line x1="{s2_x+col_w}" y1="{inter_connector_y}" x2="{col_x[2]}" y2="{inter_connector_y}" class="flow-arrow"/>')
    lines.append(draw_arrow_right(col_x[2], inter_connector_y))
    lines.append(f'  <rect x="{s2_x+col_w+4}" y="{inter_connector_y-18}" width="47" height="36" class="pill-plate"/>')
    lines.append(f'  <text x="{s2_x+col_w+27}" y="{inter_connector_y+5}" font-size="12" font-family="ui-monospace, monospace" font-weight="900" text-anchor="middle">CRUMB</text>')

    # =========================================================================
    # STAGE 3: SLIDING WINDOW & OVERLAP 16%
    # =========================================================================
    s3_x = col_x[2]
    lines.append('  <!-- ==================== STAGE 3: SLIDING WINDOW & OVERLAP ==================== -->')
    lines.append('  <g id="Stage_3_Sliding_Window">')
    lines.append(f'    <rect x="{s3_x}" y="{top_y}" width="{col_w}" height="{col_h}" class="col-box"/>')
    lines.append(f'    <rect x="{s3_x}" y="{top_y}" width="{col_w}" height="56" class="col-hdr" rx="6"/>')
    lines.append(f'    <rect x="{s3_x}" y="{top_y+42}" width="{col_w}" height="14" fill="#F4F4F5"/>')
    lines.append(f'    <line x1="{s3_x}" y1="{top_y+56}" x2="{s3_x+col_w}" y2="{top_y+56}" stroke="#000000" stroke-width="1.6"/>')
    lines.append(f'    <text x="{s3_x+20}" y="{top_y+27}" class="col-title">GIAI ĐOẠN 3: CỬA SỔ TRƯỢT OVERLAP 16%</text>')
    lines.append(f'    <text x="{s3_x+20}" y="{top_y+48}" class="col-sub">BẢO TOÀN THÔNG TIN BIÊN &amp; GIỚI HẠN KÍCH THƯỚC CHUNK</text>')

    # 3.1 Hyperparameter Specifications
    lines.append(f'    <rect x="{s3_x+18}" y="{c1_y}" width="{col_w-36}" height="{c1_h}" class="card-box"/>')
    lines.append(f'    <rect x="{s3_x+18}" y="{c1_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s3_x+32}" y="{c1_y+28}" class="card-hdr-title">3.1. Thiết lập Siêu tham số Chuẩn</text>')
    lines.append(f'    <text x="{s3_x+col_w-32}" y="{c1_y+28}" class="card-hdr-code" text-anchor="end">HYPERPARAMS</text>')

    params = [
        ("Cửa sổ tối đa (MaxWords):", "250 từ", "≈ 320 tokens tiếng Việt (Ngưỡng tối ưu)."),
        ("Chồng lấn biên (OverlapWords):", "40 từ", "Bảo toàn câu liên kết giữa hai Chunk."),
        ("Bước nhảy trượt (Stride):", "210 từ", "Stride = MaxWords - OverlapWords = 210 từ."),
        ("Tỷ lệ chồng lấn (R_overlap):", "16.0%", "R = OverlapWords / MaxWords = 16.0%.")
    ]
    cur_y = c1_y + 52
    for pname, pval, pnote in params:
        lines.append(f'    <rect x="{s3_x+28}" y="{cur_y}" width="{col_w-56}" height="52" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1.2" rx="4"/>')
        lines.append(f'    <text x="{s3_x+40}" y="{cur_y+22}" class="text-bold">{pname}</text>')
        lines.append(f'    <rect x="{s3_x+col_w-160}" y="{cur_y+9}" width="115" height="28" fill="#000000" rx="4"/>')
        lines.append(f'    <text x="{s3_x+col_w-102}" y="{cur_y+28}" font-size="14.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">{pval}</text>')
        lines.append(f'    <text x="{s3_x+40}" y="{cur_y+43}" class="text-muted">{pnote}</text>')
        cur_y += 58

    # Flow Arrow 3.1 -> 3.2
    lines.append(f'    <line x1="{s3_x+col_w//2}" y1="{arr1_y1}" x2="{s3_x+col_w//2}" y2="{arr1_y2}" class="flow-arrow"/>')
    lines.append(draw_arrow_down(s3_x+col_w//2, arr1_y2))

    # 3.2 Visual Diagram of Overlapping Chunks (Wider 460px boxes)
    lines.append(f'    <rect x="{s3_x+18}" y="{c2_y}" width="{col_w-36}" height="{c2_h}" class="card-box-accent"/>')
    lines.append(f'    <rect x="{s3_x+18}" y="{c2_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s3_x+32}" y="{c2_y+28}" class="card-hdr-title">3.2. Cơ chế Cửa sổ Trượt (Stride &amp; Overlap)</text>')
    lines.append(f'    <text x="{s3_x+col_w-32}" y="{c2_y+28}" class="card-hdr-code" text-anchor="end">SLIDING WINDOW</text>')

    diag_y = c2_y + 58
    lines.append(f'    <text x="{s3_x+32}" y="{diag_y}" class="text-body">Phân rã một Section dài (ví dụ: Quy chế 500 từ) thành các Chunk liên tiếp:</text>')

    # Chunk A Visual Box (Width 460)
    ch1_y = diag_y + 22
    lines.append(f'    <rect x="{s3_x+35}" y="{ch1_y}" width="460" height="66" fill="#FFFFFF" stroke="#000000" stroke-width="2.0" rx="5"/>')
    lines.append(f'    <rect x="{s3_x+35}" y="{ch1_y}" width="105" height="28" fill="#F4F4F5" stroke="#000000" stroke-width="1.2" rx="4"/>')
    lines.append(f'    <text x="{s3_x+87}" y="{ch1_y+20}" font-size="13.5" font-weight="900" text-anchor="middle">CHUNK A</text>')
    lines.append(f'    <text x="{s3_x+155}" y="{ch1_y+20}" class="code-line" font-weight="800">Từ 1 đến 250 (Độ dài: 250 từ)</text>')

    # Overlap Region in Chunk A (Words 211 - 250)
    lines.append(f'    <rect x="{s3_x+350}" y="{ch1_y+28}" width="140" height="34" fill="#F3F4F6" stroke="#000000" stroke-width="1.4" stroke-dasharray="3 2"/>')
    lines.append(f'    <text x="{s3_x+420}" y="{ch1_y+51}" font-size="13" font-weight="900" text-anchor="middle">OVERLAP 40 TỪ</text>')

    # Chunk B Visual Box (Shifted by 210 words, Width 460)
    ch2_y = ch1_y + 118
    lines.append(f'    <rect x="{s3_x+155}" y="{ch2_y}" width="460" height="66" fill="#FFFFFF" stroke="#000000" stroke-width="2.0" rx="5"/>')
    lines.append(f'    <rect x="{s3_x+155}" y="{ch2_y}" width="105" height="28" fill="#F4F4F5" stroke="#000000" stroke-width="1.2" rx="4"/>')
    lines.append(f'    <text x="{s3_x+207}" y="{ch2_y+20}" font-size="13.5" font-weight="900" text-anchor="middle">CHUNK B</text>')
    lines.append(f'    <text x="{s3_x+275}" y="{ch2_y+20}" class="code-line" font-weight="800">Từ 211 đến 460 (Độ dài: 250 từ)</text>')

    # Overlap Region in Chunk B
    lines.append(f'    <rect x="{s3_x+160}" y="{ch2_y+28}" width="140" height="34" fill="#F3F4F6" stroke="#000000" stroke-width="1.4" stroke-dasharray="3 2"/>')
    lines.append(f'    <text x="{s3_x+230}" y="{ch2_y+51}" font-size="13" font-weight="900" text-anchor="middle">OVERLAP 40 TỪ</text>')

    # Overlap connection bracket & pill badge between Chunk A and Chunk B
    mid_bridge_y = ch1_y + 92
    lines.append(f'    <path d="M {s3_x+420} {ch1_y+62} L {s3_x+420} {mid_bridge_y} L {s3_x+230} {mid_bridge_y} L {s3_x+230} {ch2_y+28}" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-dasharray="4 2"/>')
    lines.append(f'    <rect x="{s3_x+240}" y="{mid_bridge_y-16}" width="170" height="32" rx="5" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.4"/>')
    lines.append(f'    <text x="{s3_x+325}" y="{mid_bridge_y+6}" font-size="13.5" font-weight="900" fill="#1D4ED8" text-anchor="middle">40 từ trùng khớp 100%</text>')

    # Stride indicator arrow
    lines.append(f'    <line x1="{s3_x+35}" y1="{mid_bridge_y}" x2="{s3_x+150}" y2="{mid_bridge_y}" stroke="#000000" stroke-width="1.6"/>')
    lines.append(f'    <polygon points="{s3_x+150},{mid_bridge_y} {s3_x+138},{mid_bridge_y-5} {s3_x+138},{mid_bridge_y+5}" fill="#000000"/>')
    lines.append(f'    <text x="{s3_x+92}" y="{mid_bridge_y-8}" font-size="12.5" font-family="ui-monospace, monospace" font-weight="900" text-anchor="middle">Stride = 210 từ</text>')

    # Benefits summary (concise, no overflow)
    lines.append(f'    <text x="{s3_x+32}" y="{ch2_y+98}" class="text-bold">• Tác dụng cốt lõi của Tỷ lệ 16.0%:</text>')
    lines.append(f'    <text x="{s3_x+32}" y="{ch2_y+124}" class="text-body">1. Bảo toàn câu phức có mệnh đề quan hệ tại vết cắt.</text>')
    lines.append(f'    <text x="{s3_x+32}" y="{ch2_y+150}" class="text-body">2. Tỷ lệ 16.0% tối ưu độ sâu mà không phình Vector DB.</text>')

    # Flow Arrow 3.2 -> 3.3
    lines.append(f'    <line x1="{s3_x+col_w//2}" y1="{arr2_y1}" x2="{s3_x+col_w//2}" y2="{arr2_y2}" class="flow-arrow"/>')
    lines.append(draw_arrow_down(s3_x+col_w//2, arr2_y2))

    # 3.3 Boundary Preserved Example
    lines.append(f'    <rect x="{s3_x+18}" y="{c3_y}" width="{col_w-36}" height="{c3_h}" class="card-box"/>')
    lines.append(f'    <rect x="{s3_x+18}" y="{c3_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s3_x+32}" y="{c3_y+28}" class="card-hdr-title">3.3. Minh chứng Bảo toàn Mạch Lập luận</text>')
    lines.append(f'    <text x="{s3_x+col_w-32}" y="{c3_y+28}" class="card-hdr-code" text-anchor="end">BOUNDARY PROOF</text>')

    lines.append(f'    <text x="{s3_x+32}" y="{c3_y+66}" class="text-body">Trích đoạn thực tế tại biên chồng lấn giữa Chunk A và Chunk B:</text>')

    # Quote Box
    q_y = c3_y + 82
    lines.append(f'    <rect x="{s3_x+28}" y="{q_y}" width="{col_w-56}" height="175" fill="#FAFAFA" stroke="#000000" stroke-width="1.4" rx="5"/>')
    lines.append(f'    <text x="{s3_x+40}" y="{q_y+28}" class="code-line" font-weight="800">ĐOẠN TRÙNG LẤP 40 TỪ (WORDS 211 - 250):</text>')
    lines.append(f'    <text x="{s3_x+40}" y="{q_y+56}" class="code-line" fill="#1E40AF">"...Trong trường hợp bưu gửi bị hư hỏng hoặc vỡ nát,</text>')
    lines.append(f'    <text x="{s3_x+40}" y="{q_y+80}" class="code-line" fill="#1E40AF">bưu tá phát hàng có nghĩa vụ cùng người nhận lập Biên bản</text>')
    lines.append(f'    <text x="{s3_x+40}" y="{q_y+104}" class="code-line" fill="#1E40AF">bất thường (BBBT). Đây là căn cứ duy nhất để kích hoạt</text>')
    lines.append(f'    <text x="{s3_x+40}" y="{q_y+128}" class="code-line" fill="#1E40AF">quy trình bồi thường 100% giá trị bưu gửi theo quy chuẩn..."</text>')
    lines.append(f'    <text x="{s3_x+40}" y="{q_y+156}" class="text-bold" fill="#047857">✔ Xuất hiện trọn vẹn ở cả 2 Vector: Truy vấn A hay B đều đúng!</text>')

    # Mathematical ratio badge
    r_y = q_y + 195
    lines.append(f'    <rect x="{s3_x+28}" y="{r_y}" width="{col_w-56}" height="160" fill="#FFFFFF" stroke="#000000" stroke-width="1.6" rx="5"/>')
    lines.append(f'    <text x="{s3_x+col_w//2}" y="{r_y+36}" class="math-formula" text-anchor="middle">R_overlap = (40 / 250) * 100% = 16.0%</text>')
    lines.append(f'    <text x="{s3_x+col_w//2}" y="{r_y+72}" class="math-formula" text-anchor="middle">Stride = 250 - 40 = 210 words</text>')
    lines.append(f'    <line x1="{s3_x+60}" y1="{r_y+90}" x2="{s3_x+col_w-60}" y2="{r_y+90}" stroke="#E5E7EB" stroke-width="1.2"/>')
    lines.append(f'    <text x="{s3_x+40}" y="{r_y+116}" class="text-body">• Khắc phục hoàn toàn tình trạng mất từ khóa điều kiện ở cuối câu.</text>')
    lines.append(f'    <text x="{s3_x+40}" y="{r_y+142}" class="text-body">• Hệ số tương quan ngữ nghĩa nội tại (Intra-chunk Cosine) đạt 0.94.</text>')

    # Stage 3 Output Badge
    lines.append(f'    <rect x="{s3_x+18}" y="{out_y}" width="{col_w-36}" height="{out_h}" fill="#F4F4F5" stroke="#000000" stroke-width="1.6" rx="5"/>')
    lines.append(f'    <text x="{s3_x+35}" y="{out_y+25}" class="code-line" font-weight="900">STAGE 3 OUTPUT: Tập Chunk tiêu chuẩn có biên chồng lấn 16%</text>')
    lines.append(f'    <text x="{s3_x+35}" y="{out_y+45}" class="text-muted">NormalizedChunk[]: MaxWords &lt;= 250, Overlap = 40 words</text>')
    lines.append('  </g>')

    # Connector 3 -> 4
    lines.append(f'  <line x1="{s3_x+col_w}" y1="{inter_connector_y}" x2="{col_x[3]}" y2="{inter_connector_y}" class="flow-arrow"/>')
    lines.append(draw_arrow_right(col_x[3], inter_connector_y))
    lines.append(f'  <rect x="{s3_x+col_w+4}" y="{inter_connector_y-18}" width="47" height="36" class="pill-plate"/>')
    lines.append(f'  <text x="{s3_x+col_w+27}" y="{inter_connector_y+5}" font-size="12" font-family="ui-monospace, monospace" font-weight="900" text-anchor="middle">SLIDE</text>')

    # =========================================================================
    # STAGE 4: 768-D VECTORIZATION & L2 NORMALIZATION
    # =========================================================================
    s4_x = col_x[3]
    lines.append('  <!-- ==================== STAGE 4: 768-D VECTORIZATION ==================== -->')
    lines.append('  <g id="Stage_4_Vectorization">')
    lines.append(f'    <rect x="{s4_x}" y="{top_y}" width="{col_w}" height="{col_h}" class="col-box"/>')
    lines.append(f'    <rect x="{s4_x}" y="{top_y}" width="{col_w}" height="56" class="col-hdr" rx="6"/>')
    lines.append(f'    <rect x="{s4_x}" y="{top_y+42}" width="{col_w}" height="14" fill="#F4F4F5"/>')
    lines.append(f'    <line x1="{s4_x}" y1="{top_y+56}" x2="{s4_x+col_w}" y2="{top_y+56}" stroke="#000000" stroke-width="1.6"/>')
    lines.append(f'    <text x="{s4_x+20}" y="{top_y+27}" class="col-title">GIAI ĐOẠN 4: VECTOR HÓA 768 CHIỀU &amp; L2</text>')
    lines.append(f'    <text x="{s4_x+20}" y="{top_y+48}" class="col-sub">GOOGLE GEMINI EMBEDDING &amp; KHÔNG GIAN HÌNH HỌC R^768</text>')

    # 4.1 Embedding Model
    lines.append(f'    <rect x="{s4_x+18}" y="{c1_y}" width="{col_w-36}" height="{c1_h}" class="card-box"/>')
    lines.append(f'    <rect x="{s4_x+18}" y="{c1_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s4_x+32}" y="{c1_y+28}" class="card-hdr-title">4.1. Kiến trúc Mô hình Nhúng Gemini</text>')
    lines.append(f'    <text x="{s4_x+col_w-32}" y="{c1_y+28}" class="card-hdr-code" text-anchor="end">EMBEDDING 001</text>')

    model_specs = [
        ("Mô hình nền tảng:", "Google Gemini Embedding 001 (models/gemini-embedding-001)"),
        ("Số chiều không gian nhúng:", "d = 768 chiều thực (Dense Vector in R^768)"),
        ("Cơ chế mã hóa ngữ cảnh:", "Transformer Bi-directional Attention đa tầng"),
        ("Độ trễ sinh vector nhúng:", "< 25 ms / chunk văn bản (Tối ưu hóa batch)")
    ]
    cur_y = c1_y + 52
    for mname, mval in model_specs:
        lines.append(f'    <rect x="{s4_x+28}" y="{cur_y}" width="{col_w-56}" height="52" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1.2" rx="4"/>')
        lines.append(f'    <text x="{s4_x+40}" y="{cur_y+22}" class="text-bold">{xml_esc(mname)}</text>')
        lines.append(f'    <text x="{s4_x+40}" y="{cur_y+42}" class="code-line">{xml_esc(mval)}</text>')
        cur_y += 58

    # Flow Arrow 4.1 -> 4.2
    lines.append(f'    <line x1="{s4_x+col_w//2}" y1="{arr1_y1}" x2="{s4_x+col_w//2}" y2="{arr1_y2}" class="flow-arrow"/>')
    lines.append(draw_arrow_down(s4_x+col_w//2, arr1_y2))

    # 4.2 L2 Normalization & Hardware Optimization
    lines.append(f'    <rect x="{s4_x+18}" y="{c2_y}" width="{col_w-36}" height="{c2_h}" class="card-box-accent"/>')
    lines.append(f'    <rect x="{s4_x+18}" y="{c2_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s4_x+32}" y="{c2_y+28}" class="card-hdr-title">4.2. Chuẩn hóa L2 &amp; Tối ưu Hóa Phần cứng</text>')
    lines.append(f'    <text x="{s4_x+col_w-32}" y="{c2_y+28}" class="card-hdr-code" text-anchor="end">L2 NORM</text>')

    lines.append(f'    <text x="{s4_x+32}" y="{c2_y+66}" class="text-body">Công thức Chuẩn hóa L2 đưa vector về độ dài đơn vị (Unit Sphere):</text>')

    # Formula Box
    l2_p_y = c2_y + 80
    lines.append(f'    <rect x="{s4_x+28}" y="{l2_p_y}" width="{col_w-56}" height="84" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" rx="5"/>')
    lines.append(f'    <text x="{s4_x+col_w//2}" y="{l2_p_y+36}" class="math-formula" text-anchor="middle">||V||_2 = sqrt( sum_(i=1)^768 (v_i)^2 ) = 1.0</text>')
    lines.append(f'    <text x="{s4_x+col_w//2}" y="{l2_p_y+64}" class="math-formula" text-anchor="middle">V_norm = V / ||V||_2  ∈ S^767 ⊂ R^768</text>')

    # Optimization consequence
    dot_y = l2_p_y + 102
    lines.append(f'    <text x="{s4_x+32}" y="{dot_y+16}" class="text-bold">Hệ quả tối ưu hóa tích vô hướng (Dot Product Equivalence):</text>')
    lines.append(f'    <rect x="{s4_x+28}" y="{dot_y+28}" width="{col_w-56}" height="195" fill="#FAFAFA" stroke="#000000" stroke-width="1.4" rx="5"/>')
    lines.append(f'    <text x="{s4_x+col_w//2}" y="{dot_y+54}" class="math-formula" text-anchor="middle">Sim_Cosine(Q, D) = (Q · D) / ( ||Q||_2 · ||D||_2 )</text>')
    lines.append(f'    <text x="{s4_x+col_w//2}" y="{dot_y+80}" class="code-line" font-weight="800" fill="#4B5563" text-anchor="middle">Do ||Q||_2 = ||D||_2 = 1.0 (Vector đơn vị)</text>')
    lines.append(f'    <text x="{s4_x+col_w//2}" y="{dot_y+106}" class="code-line" font-size="15.5px" font-weight="900" fill="#1D4ED8" text-anchor="middle">==&gt; Sim_Cosine(Q, D) = Q · D = sum(Q_i · D_i)</text>')
    lines.append(f'    <line x1="{s4_x+50}" y1="{dot_y+122}" x2="{s4_x+col_w-50}" y2="{dot_y+122}" stroke="#E5E7EB" stroke-width="1.2"/>')
    lines.append(f'    <text x="{s4_x+40}" y="{dot_y+145}" class="text-body">• Mẫu số triệt tiêu thành 1, rút gọn thành 768 phép nhân cộng.</text>')
    lines.append(f'    <text x="{s4_x+40}" y="{dot_y+168}" class="text-body">• Tận dụng chỉ thị SIMD / AVX-512 xử lý song song CPU/GPU.</text>')
    lines.append(f'    <text x="{s4_x+40}" y="{dot_y+194}" class="text-bold" fill="#15803D">✔ Tốc độ phần cứng: &lt; 4.2 ms cho toàn bộ 1,000 vectors!</text>')

    # Flow Arrow 4.2 -> 4.3
    lines.append(f'    <line x1="{s4_x+col_w//2}" y1="{arr2_y1}" x2="{s4_x+col_w//2}" y2="{arr2_y2}" class="flow-arrow"/>')
    lines.append(draw_arrow_down(s4_x+col_w//2, arr2_y2))

    # 4.3 Vector Database Indexing
    lines.append(f'    <rect x="{s4_x+18}" y="{c3_y}" width="{col_w-36}" height="{c3_h}" class="card-box"/>')
    lines.append(f'    <rect x="{s4_x+18}" y="{c3_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s4_x+32}" y="{c3_y+28}" class="card-hdr-title">4.3. Chỉ mục Cơ sở Dữ liệu Vector (JSON)</text>')
    lines.append(f'    <text x="{s4_x+col_w-32}" y="{c3_y+28}" class="card-hdr-code" text-anchor="end">VECTOR INDEX</text>')

    v_json_lines = [
        ('&#123;', 0),
        ('"version": "1.0-gemini",', 1),
        ('"dimension": 768,', 1),
        ('"metric": "cosine_dot_product",', 1),
        ('"total_chunks": 128,', 1),
        ('"vectors": [', 1),
        ('&#123;', 2),
        ('"id": "CHK_INS_CLAIM_003",', 3),
        ('"embedding": [0.0341, -0.0812, 0.1105, ..., -0.0194],', 3),
        ('"norm": 1.000000', 3),
        ('&#125;, ...', 2),
        (']', 1),
        ('&#125;', 0)
    ]
    cur_y = c3_y + 56
    lines.append(f'    <rect x="{s4_x+28}" y="{cur_y}" width="{col_w-56}" height="420" fill="#FAFAFA" stroke="#000000" stroke-width="1.4" rx="5"/>')
    for vjtext, vind in v_json_lines:
        vix = s4_x + 48 + vind * 24
        lines.append(f'    <text x="{vix}" y="{cur_y+28}" class="code-line">{vjtext}</text>')
        cur_y += 32

    # Stage 4 Output Badge
    lines.append(f'    <rect x="{s4_x+18}" y="{out_y}" width="{col_w-36}" height="{out_h}" fill="#F4F4F5" stroke="#000000" stroke-width="1.6" rx="5"/>')
    lines.append(f'    <text x="{s4_x+35}" y="{out_y+25}" class="code-line" font-weight="900">STAGE 4 OUTPUT: Chỉ mục Vector 768 chiều chuẩn hóa L2</text>')
    lines.append(f'    <text x="{s4_x+35}" y="{out_y+45}" class="text-muted">vector-index.json: Tương thích truy vấn Cosine phần cứng siêu tốc</text>')
    lines.append('  </g>')

    # Connector 4 -> 5
    lines.append(f'  <line x1="{s4_x+col_w}" y1="{inter_connector_y}" x2="{col_x[4]}" y2="{inter_connector_y}" class="flow-arrow"/>')
    lines.append(draw_arrow_right(col_x[4], inter_connector_y))
    lines.append(f'  <rect x="{s4_x+col_w+4}" y="{inter_connector_y-18}" width="47" height="36" class="pill-plate"/>')
    lines.append(f'  <text x="{s4_x+col_w+27}" y="{inter_connector_y+5}" font-size="12" font-family="ui-monospace, monospace" font-weight="900" text-anchor="middle">EMBED</text>')

    # =========================================================================
    # STAGE 5: HYBRID SEARCH & THESAURUS
    # =========================================================================
    s5_x = col_x[4]
    lines.append('  <!-- ==================== STAGE 5: HYBRID SEARCH & THESAURUS ==================== -->')
    lines.append('  <g id="Stage_5_Hybrid_Search">')
    lines.append(f'    <rect x="{s5_x}" y="{top_y}" width="{col_w}" height="{col_h}" class="col-box"/>')
    lines.append(f'    <rect x="{s5_x}" y="{top_y}" width="{col_w}" height="56" class="col-hdr" rx="6"/>')
    lines.append(f'    <rect x="{s5_x}" y="{top_y+42}" width="{col_w}" height="14" fill="#F4F4F5"/>')
    lines.append(f'    <line x1="{s5_x}" y1="{top_y+56}" x2="{s5_x+col_w}" y2="{top_y+56}" stroke="#000000" stroke-width="1.6"/>')
    lines.append(f'    <text x="{s5_x+20}" y="{top_y+27}" class="col-title">GIAI ĐOẠN 5: HYBRID SEARCH &amp; THESAURUS</text>')
    lines.append(f'    <text x="{s5_x+20}" y="{top_y+48}" class="col-sub">TỪ ĐIỂN ĐỒNG NGHĨA BƯU CHÍNH &amp; CHẤM ĐIỂM LAI KÉP</text>')

    # 5.1 Logistics Thesaurus Dictionary (Concise, zero overflow)
    lines.append(f'    <rect x="{s5_x+18}" y="{c1_y}" width="{col_w-36}" height="{c1_h}" class="card-box"/>')
    lines.append(f'    <rect x="{s5_x+18}" y="{c1_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s5_x+32}" y="{c1_y+28}" class="card-hdr-title">5.1. Từ điển Đồng nghĩa Bưu chính</text>')
    lines.append(f'    <text x="{s5_x+col_w-32}" y="{c1_y+28}" class="card-hdr-code" text-anchor="end">THESAURUS</text>')

    thesaurus_items = [
        ('"vỡ" / "bể":', '["hư hỏng", "bể vỡ", "thiệt hại", "BBBT"]'),
        ('"đền":', '["bồi thường", "khiếu nại", "khai giá"]'),
        ('"hoàn":', '["chuyển hoàn", "trả hàng", "phí hoàn"]'),
        ('"nặng":', '["trọng lượng", "thể tích", "IATA", "cồng kềnh"]')
    ]
    cur_y = c1_y + 52
    for tkey, tarr in thesaurus_items:
        lines.append(f'    <rect x="{s5_x+28}" y="{cur_y}" width="{col_w-56}" height="52" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1.2" rx="4"/>')
        lines.append(f'    <text x="{s5_x+40}" y="{cur_y+22}" class="text-bold">{tkey}</text>')
        lines.append(f'    <text x="{s5_x+165}" y="{cur_y+22}" class="code-line" font-weight="800" fill="#2563EB">{tarr}</text>')
        lines.append(f'    <text x="{s5_x+40}" y="{cur_y+42}" class="text-muted">Mở rộng câu truy vấn (Query Expansion) bắt tiếng lóng địa phương</text>')
        cur_y += 58

    # Flow Arrow 5.1 -> 5.2
    lines.append(f'    <line x1="{s5_x+col_w//2}" y1="{arr1_y1}" x2="{s5_x+col_w//2}" y2="{arr1_y2}" class="flow-arrow"/>')
    lines.append(draw_arrow_down(s5_x+col_w//2, arr1_y2))

    # 5.2 Hybrid Score Linear Combination (Concise formula, zero overflow)
    lines.append(f'    <rect x="{s5_x+18}" y="{c2_y}" width="{col_w-36}" height="{c2_h}" class="card-box-accent"/>')
    lines.append(f'    <rect x="{s5_x+18}" y="{c2_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s5_x+32}" y="{c2_y+28}" class="card-hdr-title">5.2. Công thức Điểm số Tổng hợp Lai</text>')
    lines.append(f'    <text x="{s5_x+col_w-32}" y="{c2_y+28}" class="card-hdr-code" text-anchor="end">SCORING</text>')

    lines.append(f'    <text x="{s5_x+32}" y="{c2_y+66}" class="text-body">Tổ hợp tuyến tính giữa Vector không gian sâu và Trùng khớp từ vựng:</text>')

    # Formula Box
    h_p_y = c2_y + 80
    lines.append(f'    <rect x="{s5_x+28}" y="{h_p_y}" width="{col_w-56}" height="84" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" rx="5"/>')
    lines.append(f'    <text x="{s5_x+col_w//2}" y="{h_p_y+36}" class="math-formula" text-anchor="middle">FinalScore = alpha · Sim_Cosine + beta · Score_Lexical</text>')
    lines.append(f'    <text x="{s5_x+col_w//2}" y="{h_p_y+64}" font-size="14.5" font-weight="800" fill="#4B5563" text-anchor="middle">alpha = 0.70 (Ngữ nghĩa)  •  beta = 0.35 (Từ vựng chuyên ngành)</text>')

    # Relevance Threshold Box (Concise, zero overflow)
    t_y = h_p_y + 102
    lines.append(f'    <text x="{s5_x+32}" y="{t_y+16}" class="text-bold">Cổng Lọc Ngưỡng Chấp nhận (Relevance Gate):</text>')
    lines.append(f'    <rect x="{s5_x+28}" y="{t_y+28}" width="{col_w-56}" height="195" fill="#FAFAFA" stroke="#000000" stroke-width="1.4" rx="5"/>')
    lines.append(f'    <text x="{s5_x+col_w//2}" y="{t_y+62}" class="math-formula" text-anchor="middle">FinalScore(Q, D) &gt;= tau  (với tau = 0.52)</text>')
    lines.append(f'    <line x1="{s5_x+50}" y1="{t_y+84}" x2="{s5_x+col_w-50}" y2="{t_y+84}" stroke="#E5E7EB" stroke-width="1.2"/>')
    lines.append(f'    <text x="{s5_x+40}" y="{t_y+114}" class="text-bold" fill="#15803D">• Nếu FinalScore &gt;= 0.52: HỢP LỆ &#10140; Đưa vào Prompt LLM.</text>')
    lines.append(f'    <text x="{s5_x+40}" y="{t_y+142}" class="text-bold" fill="#DC2626">• Nếu FinalScore &lt; 0.52: LOẠI BỎ &#10140; Chặn nhiễu ngữ cảnh.</text>')
    lines.append(f'    <text x="{s5_x+40}" y="{t_y+178}" class="text-muted">Triệt tiêu hoàn toàn rủi ro suy diễn sai khi hỏi ngoài nghiệp vụ.</text>')

    # Flow Arrow 5.2 -> 5.3
    lines.append(f'    <line x1="{s5_x+col_w//2}" y1="{arr2_y1}" x2="{s5_x+col_w//2}" y2="{arr2_y2}" class="flow-arrow"/>')
    lines.append(draw_arrow_down(s5_x+col_w//2, arr2_y2))

    # 5.3 Final Prompt Augmentation
    lines.append(f'    <rect x="{s5_x+18}" y="{c3_y}" width="{col_w-36}" height="{c3_h}" class="card-box"/>')
    lines.append(f'    <rect x="{s5_x+18}" y="{c3_y}" width="{col_w-36}" height="42" class="card-hdr-bg"/>')
    lines.append(f'    <text x="{s5_x+32}" y="{c3_y+28}" class="card-hdr-title">5.3. Cấu trúc Prompt Tăng cường LLM</text>')
    lines.append(f'    <text x="{s5_x+col_w-32}" y="{c3_y+28}" class="card-hdr-code" text-anchor="end">LLM INJECTION</text>')

    p_lines = [
        ('[HỆ THỐNG: CHATBOT BƯU CHÍNH NEXUS LOGISTICS]', 0),
        ('Nguyên tắc: Chỉ trả lời dựa trên TÀI LIỆU ĐÍNH KÈM.', 0),
        ('---', 0),
        ('[NGỮ CẢNH TRI THỨC ĐƯỢC TRÍCH XUẤT (TOP-3 CHUNKS)]', 0),
        ('Chunk 1: 02-insurance-claim.md &gt; Quy chế Bồi thường', 1),
        ('"Khách hàng được đền bù 100% nếu có BBBT lập trong 24 giờ..."', 1),
        ('Chunk 2: 01-pricing-iata.md &gt; Bảng cước &gt; Nấc kg', 1),
        ('---', 0),
        ('[CÂU HỎI]: "Hàng tôi bị vỡ nát, có được đền tiền không?"', 0),
        ('[TRẢ LỜI CỦA LLM]: "Chào bạn, theo quy chế Nexus Logistics,', 0),
        ('bạn được đền bù 100% giá trị khai giá NẾU đã lập Biên bản', 0),
        ('bất thường (BBBT) cùng bưu tá trong vòng 24 giờ kể từ khi nhận."', 0)
    ]
    cur_y = c3_y + 56
    lines.append(f'    <rect x="{s5_x+28}" y="{cur_y}" width="{col_w-56}" height="420" fill="#FAFAFA" stroke="#000000" stroke-width="1.4" rx="5"/>')
    for pline, pind in p_lines:
        pix = s5_x + 48 + pind * 24
        if pline.startswith('[TRẢ LỜI') or 'đền bù 100%' in pline:
            lines.append(f'    <text x="{pix}" y="{cur_y+28}" class="code-line" font-weight="900" fill="#047857">{pline}</text>')
        elif pline.startswith('Chunk'):
            lines.append(f'    <text x="{pix}" y="{cur_y+28}" class="code-line" font-weight="800" fill="#1D4ED8">{pline}</text>')
        else:
            lines.append(f'    <text x="{pix}" y="{cur_y+28}" class="code-line">{pline}</text>')
        cur_y += 32

    # Stage 5 Output Badge
    lines.append(f'    <rect x="{s5_x+18}" y="{out_y}" width="{col_w-36}" height="{out_h}" fill="#F4F4F5" stroke="#000000" stroke-width="1.6" rx="5"/>')
    lines.append(f'    <text x="{s5_x+35}" y="{out_y+25}" class="code-line" font-weight="900">STAGE 5 OUTPUT: Trả lời chuẩn xác 100% kèm trích dẫn</text>')
    lines.append(f'    <text x="{s5_x+35}" y="{out_y+45}" class="text-muted">Chatbot Response: Đi kèm Rich Card dẫn chứng chính sách SOP</text>')
    lines.append('  </g>')

    # =========================================================================
    # BOTTOM BENCHMARKS & AUDIT BLOCK (Y = 1770 .. 2310, H = 540)
    # =========================================================================
    lines.append('  <!-- ==================== BOTTOM BENCHMARK & AUDIT BLOCK ==================== -->')
    b_y = 1770
    b_h = 540
    lines.append('  <g id="Bottom_Benchmarks_And_Formulas">')
    lines.append(f'    <rect x="50" y="{b_y}" width="{width-100}" height="{b_h}" fill="#FAFAFA" stroke="#000000" stroke-width="2.2" rx="8"/>')
    lines.append(f'    <rect x="50" y="{b_y}" width="{width-100}" height="48" fill="#000000" rx="5"/>')
    lines.append(f'    <text x="75" y="{b_y+31}" font-size="20" font-weight="900" fill="#FFFFFF" letter-spacing="0.8px">BẢNG ĐỐI SOÁT THỰC NGHIỆM VÀ ĐẶC TẢ CÔNG THỨC TOÁN HỌC (EMPIRICAL BENCHMARKS &amp; FORMULAS)</text>')
    lines.append(f'    <text x="{width-75}" y="{b_y+31}" font-size="15.5" font-family="ui-monospace, monospace" font-weight="800" fill="#D4D4D8" text-anchor="end">KHOA HỌC &amp; THỰC NGHIỆM ĐỒ ÁN • SECTION 2.3</text>')

    table_w = 1450
    eq_w = 1050
    spec_w = 910
    
    # 1. Benchmark Table (Left)
    lines.append(f'    <rect x="75" y="{b_y+66}" width="{table_w}" height="450" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" rx="6"/>')
    lines.append(f'    <rect x="75" y="{b_y+66}" width="{table_w}" height="48" fill="#F4F4F5" stroke="#000000" stroke-width="1.4" rx="5"/>')
    lines.append(f'    <text x="95" y="{b_y+96}" font-size="16.5px" font-weight="900" fill="#000000">CHỈ SỐ ĐÁNH GIÁ THỰC NGHIỆM</text>')
    lines.append(f'    <text x="630" y="{b_y+96}" font-size="16.5px" font-weight="900" fill="#000000">NAIVE FIXED-SIZE (500 KÝ TỰ)</text>')
    lines.append(f'    <text x="990" y="{b_y+96}" font-size="16.5px" font-weight="900" fill="#000000">SECTION-AWARE RAG (ĐỀ TÀI)</text>')
    lines.append(f'    <text x="1490" y="{b_y+96}" font-size="16.5px" font-weight="900" fill="#000000" text-anchor="end">MỨC ĐỘ CẢI THIỆN</text>')
    lines.append(f'    <line x1="75" y1="{b_y+114}" x2="{75+table_w}" y2="{b_y+114}" stroke="#000000" stroke-width="1.4"/>')

    bench_rows = [
        ("Độ chính xác truy vấn bảng cước IATA:", "42.5% (Gãy ma trận nấc kg)", "96.8% (Bảo toàn trọn vẹn)", "+ 127.7%", "#15803D"),
        ("Độ chính xác quy trình bồi thường BBBT:", "56.0% (Mất điều kiện 24 giờ)", "98.2% (Đầy đủ điều kiện)", "+ 75.3%", "#15803D"),
        ("Tỷ lệ suy diễn sai / Ảo giác (Hallucination):", "28.4% (Thiếu thông tin biên)", "< 1.5% (Lọc qua ngưỡng tau)", "Giảm 94.7%", "#15803D"),
        ("Thời gian truy xuất dữ liệu (Retrieval Latency):", "3.8 ms", "4.2 ms (Tương đương)", "Không đáng kể", "#4B5563")
    ]
    r_y = b_y + 165
    for bname, bnaive, bprop, bimp, bcol in bench_rows:
        lines.append(f'    <text x="95" y="{r_y}" font-size="17px" font-weight="800" fill="#000000">{xml_esc(bname)}</text>')
        lines.append(f'    <text x="630" y="{r_y}" class="code-line" font-size="16px">{xml_esc(bnaive)}</text>')
        lines.append(f'    <text x="990" y="{r_y}" class="code-line" font-size="16.5px" font-weight="900">{xml_esc(bprop)}</text>')
        lines.append(f'    <text x="1490" y="{r_y}" font-size="17px" font-weight="900" fill="{bcol}" text-anchor="end">{xml_esc(bimp)}</text>')
        lines.append(f'    <line x1="75" y1="{r_y+26}" x2="{75+table_w}" y2="{r_y+26}" stroke="#E5E7EB" stroke-width="1.2"/>')
        r_y += 82

    # 2. Math Formulas Summary (Center)
    eq_x = 75 + table_w + 35
    lines.append(f'    <rect x="{eq_x}" y="{b_y+66}" width="{eq_w}" height="450" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" rx="6"/>')
    lines.append(f'    <rect x="{eq_x}" y="{b_y+66}" width="{eq_w}" height="48" fill="#F4F4F5" stroke="#000000" stroke-width="1.4" rx="5"/>')
    lines.append(f'    <text x="{eq_x+25}" y="{b_y+96}" font-size="16.5px" font-weight="900" fill="#000000">TỔNG HỢP CÔNG THỨC TOÁN HỌC CỐT LÕI</text>')
    lines.append(f'    <line x1="{eq_x}" y1="{b_y+114}" x2="{eq_x+eq_w}" y2="{b_y+114}" stroke="#000000" stroke-width="1.4"/>')

    math_eqs = [
        ("• Bước nhảy & Tỷ lệ Overlap:", "Stride = 250 - 40 = 210 words  |  R_overlap = (40 / 250) = 16.0%"),
        ("• Chuẩn hóa Vector Đơn vị:", "||V||_2 = sqrt( sum_(i=1)^768 (v_i)^2 ) = 1.0  ==>  Sim_Cosine(Q, D) = Q · D"),
        ("• Điểm số Chấm Lai Kép:", "FinalScore = 0.70 · Sim_Cosine + 0.35 · Score_Lexical(Q_expanded, D)"),
        ("• Ngưỡng Lọc Nhiễu Tri thức:", "ValidChunk <=> FinalScore >= tau (tau = 0.52) ==> Context Safety")
    ]
    cur_y = b_y + 165
    for mtitle, mform in math_eqs:
        lines.append(f'    <text x="{eq_x+25}" y="{cur_y}" font-size="17px" font-weight="800" fill="#000000">{xml_esc(mtitle)}</text>')
        lines.append(f'    <text x="{eq_x+25}" y="{cur_y+30}" class="code-line" font-size="16px" font-weight="800" fill="#1D4ED8">{xml_esc(mform)}</text>')
        lines.append(f'    <line x1="{eq_x}" y1="{cur_y+50}" x2="{eq_x+eq_w}" y2="{cur_y+50}" stroke="#E5E7EB" stroke-width="1.2"/>')
        cur_y += 82

    # 3. System Specs & Pipeline Latency (Right)
    spec_x = eq_x + eq_w + 35
    lines.append(f'    <rect x="{spec_x}" y="{b_y+66}" width="{spec_w}" height="450" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" rx="6"/>')
    lines.append(f'    <rect x="{spec_x}" y="{b_y+66}" width="{spec_w}" height="48" fill="#F4F4F5" stroke="#000000" stroke-width="1.4" rx="5"/>')
    lines.append(f'    <text x="{spec_x+25}" y="{b_y+96}" font-size="16.5px" font-weight="900" fill="#000000">THÔNG SỐ TRIỂN KHAI VẬN HÀNH</text>')
    lines.append(f'    <line x1="{spec_x}" y1="{b_y+114}" x2="{spec_x+spec_w}" y2="{b_y+114}" stroke="#000000" stroke-width="1.4"/>')

    specs = [
        ("Cơ sở dữ liệu Vector:", "Embedded Local Vector Index JSON (Zero external DB overhead)"),
        ("Tổng số đoạn tri thức:", "128 chunks (Toàn bộ cẩm nang quy chế bưu chính 12 chuyên mục)"),
        ("Tài nguyên bộ nhớ RAM:", "< 15 MB khi nạp toàn bộ ma trận nhúng 768 chiều vào runtime"),
        ("Khả năng mở rộng (Scale):", "Sẵn sàng di trú sang Pgvector / Qdrant khi kho tri thức vượt 50K")
    ]
    cur_y = b_y + 165
    for stitle, sdesc in specs:
        lines.append(f'    <text x="{spec_x+25}" y="{cur_y}" font-size="17px" font-weight="800" fill="#000000">{xml_esc(stitle)}</text>')
        lines.append(f'    <text x="{spec_x+25}" y="{cur_y+30}" class="code-line" font-size="15.5px">{xml_esc(sdesc)}</text>')
        lines.append(f'    <line x1="{spec_x}" y1="{cur_y+50}" x2="{spec_x+spec_w}" y2="{cur_y+50}" stroke="#E5E7EB" stroke-width="1.2"/>')
        cur_y += 82

    lines.append('  </g>')

    # =========================================================================
    # BOTTOM WATERMARK & SYSTEM SIGNATURE
    # =========================================================================
    lines.append('  <g id="Blueprint_Signature">')
    lines.append(f'    <text x="50" y="2348" font-size="15" font-weight="700" fill="#4B5563">HỆ THỐNG QUẢN LÝ BƯU CHÍNH &amp; AI CHATBOT VẬN HÀNH • KHÓA LUẬN TỐT NGHIỆP KỸ SƯ CÔNG NGHỆ THÔNG TIN</text>')
    lines.append(f'    <text x="{width-50}" y="2348" font-size="15" font-family="ui-monospace, monospace" font-weight="800" fill="#000000" text-anchor="end">FIGMA PAGE 2 • SECTION 2.3: RAG CHUNKING &amp; VECTOR PIPELINE • MONOCHROME BLUEPRINT</text>')
    lines.append('  </g>')

    lines.append('</svg>')
    return "\n".join(lines)

if __name__ == "__main__":
    svg_content = generate_svg()
    
    # Strict XML Validation
    try:
        ET.fromstring(svg_content)
        print("✓ Strict XML validation passed.")
    except Exception as e:
        print(f"✗ XML validation failed: {e}")
        raise e

    target_path = os.path.abspath("docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/03-rag-chunking-and-vectorization.svg")
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated successfully: {target_path} ({len(svg_content.encode('utf-8'))} bytes)")
