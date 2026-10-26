#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE PAGE 2 - DECISION & INTENT MATRIX (ACADEMIC BLUEPRINT - LARGE TYPOGRAPHY)
===================================================================================
Bản vẽ Kỹ thuật Tiêu chuẩn: Ma trận Điều phối Ý định Nghiệp vụ & Cấu trúc Thẻ Giao diện
Thuộc Figma Page 2: Process Automation & AI Pipeline (Mã bản vẽ: DOC-PROC-DECISION-02).

Quy chuẩn kỹ thuật & Học thuật (Chuẩn mực Đồ án Tốt nghiệp Đại học):
- Tập trung vào nền tảng lý thuyết Khoa học Máy tính & Nghiệp vụ Bưu chính Logistics:
  1. Nhận dạng mẫu chuỗi bằng Biểu thức chính quy (Regex Pattern Matching).
  2. Truy vấn CSDL quan hệ theo Khóa chính & Ngữ cảnh phiên (Session Context).
  3. Bảng luật quyết định nghiệp vụ (Decision Matrix / Rule-based System).
  4. Công thức định lượng quy chuẩn quốc tế IATA (Volumetric Weight Calculation).
  5. Kiểm soát truy cập phân quyền & Che mờ bảo vệ dữ liệu (Data Masking & Privacy).
- Loại bỏ triệt để các thuật ngữ phóng đại ("đao to búa lớn", "100% Token", "13 microservices").
- Typography cỡ lớn, rõ nét (Tiêu đề card 22px, Nội dung chính 20.5px, Mockup 18-20px).
- Bố cục 3 cột trực giao 1:1 theo 5 hàng ngang, độ dài câu căn chỉnh chuẩn xác không tràn viền.
- 100% Native Inline Vector, zero <marker> tags, vượt qua kiểm tra Strict XML.
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

    # STYLES DEFINITION (LARGE READABLE TYPOGRAPHY - SOLID ACADEMIC GROUNDING)
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }')
    lines.append('      .bg { fill: #FFFFFF; }')
    lines.append('      .frame { fill: none; stroke: #000000; stroke-width: 3.0; }')
    lines.append('      .frame-inner { fill: none; stroke: #000000; stroke-width: 1.2; stroke-dasharray: 8 4; }')
    lines.append('      .col-box { fill: #FAFAFA; stroke: #000000; stroke-width: 2.0; rx: 8px; }')
    lines.append('      .col-hdr-bar { fill: #000000; rx: 6px; }')
    lines.append('      .col-hdr-txt { font-size: 22.5px; font-weight: 900; fill: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase; }')
    lines.append('      .col-hdr-sub { font-size: 16px; font-weight: 700; fill: #E5E7EB; font-family: ui-monospace, Menlo, monospace; }')
    lines.append('      .card-box { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; rx: 8px; }')
    lines.append('      .card-hdr-bg { fill: #F4F4F5; stroke: #000000; stroke-width: 1.4; rx: 6px; }')
    lines.append('      .card-title { font-size: 22px; font-weight: 800; fill: #000000; }')
    lines.append('      .card-tag { font-size: 15px; font-weight: 800; fill: #1F2937; font-family: ui-monospace, Menlo, monospace; }')
    lines.append('      .txt-main { font-size: 20px; font-weight: 500; fill: #1F2937; }')
    lines.append('      .txt-bold { font-size: 20px; font-weight: 800; fill: #000000; }')
    lines.append('      .txt-code { font-size: 18.5px; font-family: ui-monospace, Menlo, monospace; font-weight: 700; fill: #111827; }')
    lines.append('      .flow-arrow { stroke: #000000; stroke-width: 2.4; fill: none; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .mockup-frame { fill: #FFFFFF; stroke: #000000; stroke-width: 1.6; rx: 6px; }')
    lines.append('      .mockup-hdr { fill: #F4F4F5; stroke: #000000; stroke-width: 1.2; rx: 5px; }')
    lines.append('      .mockup-btn { fill: #000000; rx: 5px; }')
    lines.append('      .mockup-btn-txt { font-size: 16.5px; font-weight: 800; fill: #FFFFFF; text-anchor: middle; }')
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
    # HEADER BLOCK (ACADEMIC, REFINED TYPOGRAPHY)
    # =========================================================================
    lines.append('  <!-- ==================== HEADER BLOCK ==================== -->')
    lines.append('  <g id="Header">')
    lines.append(f'    <rect x="40" y="38" width="{width-80}" height="106" fill="#FFFFFF" stroke="#000000" stroke-width="2.2"/>')
    lines.append('    <text x="65" y="78" font-size="32" font-weight="900" fill="#000000" letter-spacing="-0.5px">HÌNH 3.1: MA TRẬN ĐIỀU PHỐI Ý ĐỊNH NGHIỆP VỤ VÀ CẤU TRÚC GIAO DIỆN PHẢN HỒI</text>')
    lines.append('    <text x="65" y="110" font-size="19.5" font-weight="600" fill="#374151">Kiến Trúc Tương Tác Trợ Lý Ảo Logistics: Phân Loại Ý Định ➔ Xử Lý Nghiệp Vụ CSDL ➔ Thẻ Tương Tác Phản Hồi (Rich UI Cards)</text>')
    lines.append('    <text x="65" y="133" font-size="15.5" font-family="ui-monospace, Menlo, monospace" font-weight="800" fill="#000000">MÔ HÌNH THIẾT KẾ: DECISION LOGIC MATRIX • BẢN VẼ BLUEPRINT TIÊU CHUẨN • TYPOGRAPHY CỠ LỚN</text>')
    
    # Metadata Box Right
    meta_x = width - 640
    lines.append(f'    <rect x="{meta_x}" y="48" width="580" height="86" fill="#F8F8F8" stroke="#000000" stroke-width="1.6" rx="4"/>')
    lines.append(f'    <text x="{meta_x+20}" y="78" font-family="Segoe UI, Arial" font-size="19" font-weight="900" fill="#000000">MÃ BẢN VẼ: DOC-PROC-DECISION-02</text>')
    lines.append(f'    <text x="{meta_x+20}" y="102" font-family="ui-monospace, Menlo, monospace" font-size="16" font-weight="700" fill="#1F2937">FIGMA PAGE 2 • SECTION 2.2</text>')
    lines.append(f'    <text x="{meta_x+20}" y="124" font-family="ui-monospace, Menlo, monospace" font-size="14.5" fill="#4B5563">3 CỘT ĐIỀU PHỐI • 5 CA NGHIỆP VỤ CƠ BẢN</text>')
    lines.append('  </g>')

    # HELPER: Draw Arrowhead (14px)
    def draw_arrow(x, y, direct="right"):
        if direct == "right":
            return f'    <polygon points="{x},{y} {x-14},{y-6} {x-14},{y+6}" fill="#000000"/>'
        elif direct == "left":
            return f'    <polygon points="{x},{y} {x+14},{y-6} {x+14},{y+6}" fill="#000000"/>'
        elif direct == "down":
            return f'    <polygon points="{x},{y} {x-6},{y-14} {x+6},{y-14}" fill="#000000"/>'
        elif direct == "up":
            return f'    <polygon points="{x},{y} {x-6},{y+14} {x+6},{y+14}" fill="#000000"/>'

    # =========================================================================
    # 3 COLUMNS GEOMETRY:
    # Col 1: X = 50, W = 980 (X: 50..1030)
    # Col 2: X = 1100, W = 1180 (X: 1100..2280) - Gap 1: 70px (1030..1100)
    # Col 3: X = 2350, W = 1200 (X: 2350..3550) - Gap 2: 70px (2280..2350)
    # Total Height: Y = 160 to 2260 (H = 2100)
    # 5 Rows: Each row height = 370px, Gap between rows = 45px
    # Row 1: Y = 220..590
    # Row 2: Y = 635..1005
    # Row 3: Y = 1050..1420
    # Row 4: Y = 1465..1835
    # Row 5: Y = 1880..2250
    # =========================================================================

    # Column 1 Box & Full Top Bar
    lines.append('  <!-- ==================== COLUMN 1: INTENT CLASSIFICATION ==================== -->')
    lines.append('  <g id="Col_1_Intent">')
    lines.append('    <rect x="50" y="160" width="980" height="2100" class="col-box"/>')
    lines.append('    <rect x="50" y="160" width="980" height="46" class="col-hdr-bar"/>')
    lines.append('    <text x="75" y="191" class="col-hdr-txt">1. TIẾP NHẬN &amp; PHÂN LOẠI Ý ĐỊNH</text>')
    lines.append('    <text x="1010" y="190" class="col-hdr-sub" text-anchor="end">Nhận dạng chuỗi • Trích xuất tham số</text>')
    lines.append('  </g>')

    # Column 2 Box & Full Top Bar
    lines.append('  <!-- ==================== COLUMN 2: ORCHESTRATION & SERVICES ==================== -->')
    lines.append('  <g id="Col_2_Orchestration">')
    lines.append('    <rect x="1100" y="160" width="1180" height="2100" class="col-box"/>')
    lines.append('    <rect x="1100" y="160" width="1180" height="46" class="col-hdr-bar"/>')
    lines.append('    <text x="1125" y="191" class="col-hdr-txt">2. ĐIỀU PHỐI LOGIC NGHIỆP VỤ &amp; CSDL</text>')
    lines.append('    <text x="2260" y="190" class="col-hdr-sub" text-anchor="end">Truy vấn CSDL • Bảng luật quyết định • IATA</text>')
    lines.append('  </g>')

    # Column 3 Box & Full Top Bar
    lines.append('  <!-- ==================== COLUMN 3: RICH UI CARD RESPONSES ==================== -->')
    lines.append('  <g id="Col_3_Rich_Cards">')
    lines.append('    <rect x="2350" y="160" width="1200" height="2100" class="col-box"/>')
    lines.append('    <rect x="2350" y="160" width="1200" height="46" class="col-hdr-bar"/>')
    lines.append('    <text x="2375" y="191" class="col-hdr-txt">3. CẤU TRÚC GIAO DIỆN PHẢN HỒI (RICH CARDS)</text>')
    lines.append('    <text x="3530" y="190" class="col-hdr-sub" text-anchor="end">JSON Schema Contract • Thẻ tương tác</text>')
    lines.append('  </g>')
    lines.append('')

    # HELPER: Draw Row Card in Col 1 or Col 2 (High Typography & 4 Core Lines with 58px Spacing)
    def draw_lane_card(x, y, w, h, title, tag, items):
        res = []
        res.append(f'    <rect x="{x}" y="{y}" width="{w}" height="{h}" class="card-box"/>')
        header_h = 48
        res.append(f'    <rect x="{x}" y="{y}" width="{w}" height="{header_h}" class="card-hdr-bg"/>')
        
        # Badge on right
        badge_w = len(tag) * 10.5 + 24
        badge_x = x + w - badge_w - 14
        res.append(f'    <rect x="{badge_x}" y="{y + 8}" width="{badge_w}" height="32" rx="5" fill="#E5E7EB" stroke="#4B5563" stroke-width="1.0"/>')
        res.append(f'    <text x="{badge_x + badge_w/2}" y="{y + 29}" class="card-tag" text-anchor="middle">{xml_esc(tag)}</text>')
        
        # Title on left
        res.append(f'    <text x="{x + 18}" y="{y + 32}" class="card-title">{xml_esc(title)}</text>')
        res.append(f'    <line x1="{x}" y1="{y + header_h}" x2="{x + w}" y2="{y + header_h}" stroke="#000000" stroke-width="1.4"/>')

        curr_y = y + header_h + 52
        for it in items:
            prefix, bold_txt, norm_txt = it
            res.append(f'    <text x="{x + 20}" y="{curr_y}">')
            if prefix:
                res.append(f'      <tspan class="txt-main">{xml_esc(prefix)} </tspan>')
            if bold_txt:
                res.append(f'      <tspan class="txt-bold">{xml_esc(bold_txt)}: </tspan>')
            if norm_txt:
                res.append(f'      <tspan class="txt-main">{xml_esc(norm_txt)}</tspan>')
            res.append('    </text>')
            curr_y += 58
        return "\n".join(res)

    # =========================================================================
    # ROW 1: CASE 1 - TRACKING_EXACT (Y = 220..590, H = 370, Center Y = 405)
    # =========================================================================
    r1_y = 220
    r1_h = 370
    cy1 = r1_y + r1_h / 2.0 # 405

    # Col 1: Card 1 (Academic, clear, grounded in pattern matching)
    lines.append(draw_lane_card(70, r1_y, 940, r1_h, "Ý định 1: Tra cứu đơn lẻ (TRACKING_EXACT)", "REGEX MATCHING", [
        ("•", "Câu hỏi", "\"Đơn hàng NX-884920489 hiện đang ở đâu rồi shop?\""),
        ("•", "Mô hình", "Nhận dạng mẫu chuỗi bằng Regex: ^(NX|CLM)-\\d{6,}$"),
        ("•", "Kỹ thuật", "Bóc tách trực tiếp mã đơn, không cần qua bộ phân loại NLP"),
        ("•", "Đầu ra", "Tham số trackingCode = \"NX-884920489\" chuyển tiếp sang CSDL")
    ]))

    # Arrow Col 1 -> Col 2
    lines.append(f'  <line x1="1010" y1="{cy1}" x2="1100" y2="{cy1}" class="flow-arrow"/>')
    lines.append(draw_arrow(1100, cy1, "right"))

    # Col 2: Card 1 (Relational lookup & timeline aggregation)
    lines.append(draw_lane_card(1120, r1_y, 1140, r1_h, "Xử lý 1: Truy vấn Vận đơn (Shipment Lookup)", "DATABASE QUERY", [
        ("•", "Mô hình CSDL", "Truy vấn bảng đơn hàng theo khóa chính (Primary Key Index Lookup)"),
        ("•", "Kiểm tra", "Xác thực mã đơn tồn tại và trích xuất trạng thái hành trình thực tế"),
        ("•", "Tổng hợp", "4 mốc: Đã tạo đơn ➔ Đã lấy hàng ➔ Đang trung chuyển ➔ Đang giao"),
        ("•", "Đóng gói", "Cấu trúc dữ liệu theo chuẩn JSON Schema: ORDER_TRACKING_CARD")
    ]))

    # Arrow Col 2 -> Col 3
    lines.append(f'  <line x1="2260" y1="{cy1}" x2="2350" y2="{cy1}" class="flow-arrow"/>')
    lines.append(draw_arrow(2350, cy1, "right"))

    # Col 3: Mockup 1 (ORDER_TRACKING_CARD)
    lines.append(f'  <g id="Mockup_Card_1">')
    lines.append(f'    <rect x="2370" y="{r1_y}" width="1160" height="{r1_h}" class="card-box"/>')
    lines.append(f'    <rect x="2370" y="{r1_y}" width="1160" height="48" class="card-hdr-bg"/>')
    lines.append(f'    <text x="2388" y="{r1_y + 32}" class="card-title">MẪU GIAO DIỆN: ORDER_TRACKING_CARD (Thẻ Truy Vết Vận Đơn)</text>')
    lines.append(f'    <rect x="{2370 + 1160 - 210}" y="{r1_y + 8}" width="195" height="32" rx="5" fill="#E5E7EB" stroke="#4B5563" stroke-width="1.0"/>')
    lines.append(f'    <text x="{2370 + 1160 - 112}" y="{r1_y + 29}" class="card-tag" text-anchor="middle">WIDGET INTERACTIVE</text>')
    lines.append(f'    <line x1="2370" y1="{r1_y + 48}" x2="{2370 + 1160}" y2="{r1_y + 48}" stroke="#000000" stroke-width="1.4"/>')

    # Inner Mockup Frame
    m_x, m_y, m_w, m_h = 2390, r1_y + 56, 1120, 298
    lines.append(f'    <rect x="{m_x}" y="{m_y}" width="{m_w}" height="{m_h}" class="mockup-frame"/>')
    lines.append(f'    <rect x="{m_x}" y="{m_y}" width="{m_w}" height="42" class="mockup-hdr"/>')
    lines.append(f'    <text x="{m_x + 18}" y="{m_y + 28}" font-size="19px" font-weight="900" fill="#000000">MÃ VẬN ĐƠN: NX-884920489</text>')
    lines.append(f'    <rect x="{m_x + 360}" y="{m_y + 7}" width="180" height="28" fill="#000000" rx="4"/>')
    lines.append(f'    <text x="{m_x + 450}" y="{m_y + 26}" font-size="14.5px" font-weight="800" fill="#FFFFFF" text-anchor="middle">ĐANG GIAO HÀNG</text>')
    lines.append(f'    <text x="{m_x + m_w - 18}" y="{m_y + 28}" font-size="17px" font-weight="700" fill="#4B5563" text-anchor="end">Dự kiến: Hôm nay 17:30</text>')

    # Stepper in Mockup
    s_y = m_y + 88
    steps = [
        ("ĐÃ TẠO ĐƠN", "08:15 28/09"),
        ("ĐÃ NHẬP KHO", "14:20 28/09"),
        ("TRUNG CHUYỂN", "22:45 28/09"),
        ("ĐANG GIAO HÀNG", "09:10 Hôm nay")
    ]
    for i, st in enumerate(steps):
        sx = m_x + 110 + i * 270
        lines.append(f'      <circle cx="{sx}" cy="{s_y}" r="18" fill="#000000"/>')
        lines.append(f'      <circle cx="{sx}" cy="{s_y}" r="8" fill="#FFFFFF"/>')
        lines.append(f'      <text x="{sx}" y="{s_y + 36}" font-size="17px" font-weight="800" fill="#000000" text-anchor="middle">{st[0]}</text>')
        lines.append(f'      <text x="{sx}" y="{s_y + 58}" font-size="15px" font-weight="600" fill="#4B5563" text-anchor="middle">{st[1]}</text>')
        if i < len(steps) - 1:
            lines.append(f'      <line x1="{sx + 24}" y1="{s_y}" x2="{sx + 246}" y2="{s_y}" stroke="#000000" stroke-width="3.2"/>')

    # Shipper info bar & Button
    b_y = m_y + 182
    lines.append(f'    <rect x="{m_x + 20}" y="{b_y}" width="{m_w - 40}" height="100" fill="#FAFAFA" stroke="#000000" stroke-width="1.2" rx="5"/>')
    lines.append(f'    <text x="{m_x + 36}" y="{b_y + 32}" font-size="18.5px" font-weight="800" fill="#000000">Tài xế giao hàng: Nguyễn Văn Phát • Bưu cục Tân Bình (Hub TP.HCM)</text>')
    lines.append(f'    <text x="{m_x + 36}" y="{b_y + 60}" font-size="17.5px" fill="#374151">Số điện thoại liên hệ: <tspan font-weight="800">0982-xxx-456</tspan> • Biển số xe: 59-P1 882.91 • Giao trước: 17:30</text>')
    lines.append(f'    <text x="{m_x + 36}" y="{b_y + 86}" font-size="16.5px" fill="#4B5563">Ghi chú: Cho khách xem hàng • Tiền thu hộ COD: 0 VNĐ (Đã thanh toán trực tuyến)</text>')
    
    # Action button
    lines.append(f'    <rect x="{m_x + m_w - 250}" y="{b_y + 25}" width="210" height="50" class="mockup-btn"/>')
    lines.append(f'    <text x="{m_x + m_w - 145}" y="{b_y + 56}" class="mockup-btn-txt">GỌI CHO TÀI XẾ</text>')
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # ROW 2: CASE 2 - AMBIGUOUS_ORDER (Y = 635..1005, H = 370, Center Y = 820)
    # =========================================================================
    r2_y = 635
    r2_h = 370
    cy2 = r2_y + r2_h / 2.0 # 820

    # Col 1: Card 2 (Session context & disambiguation)
    lines.append(draw_lane_card(70, r2_y, 940, r2_h, "Ý định 2: Thiếu mã vận đơn (AMBIGUOUS_ORDER)", "SESSION CONTEXT", [
        ("•", "Câu hỏi", "\"Đơn hàng gần đây của tôi đã được giao tới nơi chưa?\""),
        ("•", "Vấn đề", "Câu hỏi thiếu tham số định danh, cần giải quyết nhập nhằng"),
        ("•", "Cơ chế", "Khai thác ngữ cảnh phiên: Lấy userId từ phiên đăng nhập"),
        ("•", "Đầu ra", "Ý định RECENT_ORDERS kèm userId chuyển sang truy vấn danh sách")
    ]))

    # Arrow Col 1 -> Col 2
    lines.append(f'  <line x1="1010" y1="{cy2}" x2="1100" y2="{cy2}" class="flow-arrow"/>')
    lines.append(draw_arrow(1100, cy2, "right"))

    # Col 2: Card 2 (Filter & Sort by User ID)
    lines.append(draw_lane_card(1120, r2_y, 1140, r2_h, "Xử lý 2: Phân giải Đơn hàng (Disambiguation)", "FILTER & SORT", [
        ("•", "Mô hình CSDL", "Truy vấn danh sách: SELECT * WHERE userId = ? AND status != 'DELIVERED'"),
        ("•", "Sắp xếp", "Sắp xếp theo ngày tạo mới nhất (ORDER BY createdAt DESC LIMIT 3)"),
        ("•", "Rẽ nhánh", "Nếu có 1 đơn: Chuyển sang Ca 1; Nếu nhiều đơn: Tạo danh sách thẻ con"),
        ("•", "Đóng gói", "Cấu trúc dữ liệu theo chuẩn JSON Schema: ORDER_CAROUSEL_CARD")
    ]))

    # Arrow Col 2 -> Col 3
    lines.append(f'  <line x1="2260" y1="{cy2}" x2="2350" y2="{cy2}" class="flow-arrow"/>')
    lines.append(draw_arrow(2350, cy2, "right"))

    # Col 3: Mockup 2 (ORDER_CAROUSEL_CARD)
    lines.append(f'  <g id="Mockup_Card_2">')
    lines.append(f'    <rect x="2370" y="{r2_y}" width="1160" height="{r2_h}" class="card-box"/>')
    lines.append(f'    <rect x="2370" y="{r2_y}" width="1160" height="48" class="card-hdr-bg"/>')
    lines.append(f'    <text x="2388" y="{r2_y + 32}" class="card-title">MẪU GIAO DIỆN: ORDER_CAROUSEL_CARD (Thẻ Danh Sách Trượt Ngang)</text>')
    lines.append(f'    <rect x="{2370 + 1160 - 200}" y="{r2_y + 8}" width="185" height="32" rx="5" fill="#E5E7EB" stroke="#4B5563" stroke-width="1.0"/>')
    lines.append(f'    <text x="{2370 + 1160 - 107}" y="{r2_y + 29}" class="card-tag" text-anchor="middle">CAROUSEL SLIDER</text>')
    lines.append(f'    <line x1="2370" y1="{r2_y + 48}" x2="{2370 + 1160}" y2="{r2_y + 48}" stroke="#000000" stroke-width="1.4"/>')

    # 3 Mini Cards inside Carousel
    mini_w = 355
    mini_h = 298
    cards_data = [
        ("NX-992140", "ĐANG GIAO HÀNG", "Tai nghe không dây Sony WH", "Dự kiến: Hôm nay 16:00", "0 VNĐ", True),
        ("NX-884920", "TRUNG CHUYỂN", "Áo thun thể thao nam Pro", "Dự kiến: Ngày mai 10:00", "240.000 VNĐ", False),
        ("NX-771032", "ĐÃ LẤY HÀNG", "Giày thể thao chạy bộ Ultra", "Dự kiến: 03/10/2026", "450.000 VNĐ", False)
    ]
    for idx, cd in enumerate(cards_data):
        cx = 2390 + idx * 375
        lines.append(f'      <rect x="{cx}" y="{r2_y + 56}" width="{mini_w}" height="{mini_h}" class="mockup-frame"/>')
        lines.append(f'      <rect x="{cx}" y="{r2_y + 56}" width="{mini_w}" height="40" class="mockup-hdr"/>')
        lines.append(f'      <text x="{cx + 14}" y="{r2_y + 82}" font-size="17px" font-weight="900" fill="#000000">ĐƠN #{cd[0]}</text>')
        tag_fill = "#000000" if cd[5] else "#E5E7EB"
        tag_txt = "#FFFFFF" if cd[5] else "#000000"
        lines.append(f'      <rect x="{cx + mini_w - 145}" y="{r2_y + 62}" width="135" height="28" fill="{tag_fill}" rx="4"/>')
        lines.append(f'      <text x="{cx + mini_w - 77}" y="{r2_y + 81}" font-size="14px" font-weight="800" fill="{tag_txt}" text-anchor="middle">{cd[1]}</text>')
        # Content
        lines.append(f'      <text x="{cx + 16}" y="{r2_y + 126}" font-size="17.5px" font-weight="800" fill="#000000">{cd[2]}</text>')
        lines.append(f'      <text x="{cx + 16}" y="{r2_y + 156}" font-size="16px" fill="#4B5563">• {cd[3]}</text>')
        lines.append(f'      <text x="{cx + 16}" y="{r2_y + 184}" font-size="16px" fill="#4B5563">• Thu hộ COD: <tspan font-weight="800" fill="#000000">{cd[4]}</tspan></text>')
        lines.append(f'      <line x1="{cx + 16}" y1="{r2_y + 208}" x2="{cx + mini_w - 16}" y2="{r2_y + 208}" stroke="#E5E7EB" stroke-width="1.2"/>')
        lines.append(f'      <text x="{cx + 16}" y="{r2_y + 232}" font-size="14px" font-style="italic" fill="#6B7280">Bấm nút để theo dõi vị trí hoặc hẹn giờ.</text>')
        # Button
        lines.append(f'      <rect x="{cx + 16}" y="{r2_y + 248}" width="{mini_w - 32}" height="46" class="mockup-btn"/>')
        lines.append(f'      <text x="{cx + mini_w/2}" y="{r2_y + 277}" class="mockup-btn-txt">CHỌN XEM ĐƠN NÀY</text>')
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # ROW 3: CASE 3 - DAMAGE_CLAIM (Y = 1050..1420, H = 370, Center Y = 1235)
    # =========================================================================
    r3_y = 1050
    r3_h = 370
    cy3 = r3_y + r3_h / 2.0 # 1235

    # Col 1: Card 3 (Rule-based keyword intent classification)
    lines.append(draw_lane_card(70, r3_y, 940, r3_h, "Ý định 3: Báo hàng hư hỏng (DAMAGE_CLAIM)", "RULE-BASED INTENT", [
        ("•", "Câu hỏi", "\"Hàng gốm sứ nhận được bị vỡ nát, tôi muốn yêu cầu đền bù!\""),
        ("•", "Mô hình", "Phân loại theo tập từ khóa nghiệp vụ: {vỡ, bể, móp, hỏng, đền bù}"),
        ("•", "Kỹ thuật", "Nhận diện sự cố bưu gửi để kích hoạt quy trình khiếu nại"),
        ("•", "Đầu ra", "Ngữ cảnh khiếu nại (incidentType = 'DAMAGED') chuyển sang thẩm định")
    ]))

    # Arrow Col 1 -> Col 2
    lines.append(f'  <line x1="1010" y1="{cy3}" x2="1100" y2="{cy3}" class="flow-arrow"/>')
    lines.append(draw_arrow(1100, cy3, "right"))

    # Col 2: Card 3 (Decision Matrix / Rule-based Evaluation)
    lines.append(draw_lane_card(1120, r3_y, 1140, r3_h, "Xử lý 3: Thẩm định Bồi thường (Decision Table)", "DECISION TABLE", [
        ("•", "Mô hình", "Bảng ma trận quyết định (Decision Table) đánh giá 3 điều kiện"),
        ("•", "Thẩm định", "1. Đơn đã phát hàng? • 2. Có BBBT xác nhận? • 3. Trong 24 giờ?"),
        ("•", "Quyết định", "Đủ 3 điều kiện và giá trị <= 2.000.000đ ➔ Tự động duyệt bồi hoàn"),
        ("•", "Đóng gói", "Khởi tạo hồ sơ #CLM-202610-88392 và thẻ CLAIM_STATUS_CARD")
    ]))

    # Arrow Col 2 -> Col 3
    lines.append(f'  <line x1="2260" y1="{cy3}" x2="2350" y2="{cy3}" class="flow-arrow"/>')
    lines.append(draw_arrow(2350, cy3, "right"))

    # Col 3: Mockup 3 (CLAIM_STATUS_CARD)
    lines.append(f'  <g id="Mockup_Card_3">')
    lines.append(f'    <rect x="2370" y="{r3_y}" width="1160" height="{r3_h}" class="card-box"/>')
    lines.append(f'    <rect x="2370" y="{r3_y}" width="1160" height="48" class="card-hdr-bg"/>')
    lines.append(f'    <text x="2388" y="{r3_y + 32}" class="card-title">MẪU GIAO DIỆN: CLAIM_STATUS_CARD (Hồ Sơ Đền Bù Sự Cố Tự Động)</text>')
    lines.append(f'    <rect x="{2370 + 1160 - 210}" y="{r3_y + 8}" width="195" height="32" rx="5" fill="#E5E7EB" stroke="#4B5563" stroke-width="1.0"/>')
    lines.append(f'    <text x="{2370 + 1160 - 112}" y="{r3_y + 29}" class="card-tag" text-anchor="middle">AUTO RESOLUTION</text>')
    lines.append(f'    <line x1="2370" y1="{r3_y + 48}" x2="{2370 + 1160}" y2="{r3_y + 48}" stroke="#000000" stroke-width="1.4"/>')

    m3_x, m3_y, m3_w, m3_h = 2390, r3_y + 56, 1120, 298
    lines.append(f'    <rect x="{m3_x}" y="{m3_y}" width="{m3_w}" height="{m3_h}" class="mockup-frame"/>')
    lines.append(f'    <rect x="{m3_x}" y="{m3_y}" width="{m3_w}" height="42" class="mockup-hdr"/>')
    lines.append(f'    <text x="{m3_x + 18}" y="{m3_y + 28}" font-size="19px" font-weight="900" fill="#000000">HỒ SƠ SỰ CỐ: #CLM-88392</text>')
    lines.append(f'    <rect x="{m3_x + 330}" y="{m3_y + 7}" width="190" height="28" fill="#000000" rx="4"/>')
    lines.append(f'    <text x="{m3_x + 425}" y="{m3_y + 26}" font-size="14.5px" font-weight="800" fill="#FFFFFF" text-anchor="middle">ĐÃ DUYỆT BỒI THƯỜNG</text>')
    lines.append(f'    <text x="{m3_x + m3_w - 18}" y="{m3_y + 28}" font-size="17px" font-weight="700" fill="#4B5563" text-anchor="end">Thời gian: 45 phút</text>')

    # Content Box
    lines.append(f'    <rect x="{m3_x + 20}" y="{m3_y + 54}" width="{m3_w - 40}" height="154" fill="#FAFAFA" stroke="#000000" stroke-width="1.2" rx="5"/>')
    lines.append(f'    <text x="{m3_x + 36}" y="{m3_y + 84}" font-size="18.5px" font-weight="800" fill="#000000">Căn cứ thẩm định: Biên bản bất thường (BBBT) lập lúc giao nhận có chữ ký bưu tá.</text>')
    lines.append(f'    <text x="{m3_x + 36}" y="{m3_y + 112}" font-size="17.5px" fill="#374151">• Vận đơn áp dụng: <tspan font-weight="800">NX-884920489</tspan> • Phân loại: Hàng gốm sứ vỡ hỏng 100% khi vận chuyển</text>')
    lines.append(f'    <text x="{m3_x + 36}" y="{m3_y + 138}" font-size="17.5px" fill="#374151">• Giá trị khai giá: <tspan font-weight="800">1.500.000 VNĐ</tspan> (Áp dụng mức đền bù tối đa 100% giá trị bưu gửi)</text>')
    lines.append(f'    <text x="{m3_x + 36}" y="{m3_y + 166}" font-size="19px" fill="#374151">• Số tiền duyệt chi trả: <tspan font-weight="900" font-size="20px" fill="#15803D">1.500.000 VNĐ</tspan> (Giải ngân vào tài khoản Shop)</text>')
    lines.append(f'    <text x="{m3_x + 36}" y="{m3_y + 192}" font-size="15px" font-style="italic" fill="#4B5563">• Căn cứ pháp lý: Điều 4.2 - Quy chế xử lý bồi thường thiệt hại hàng hóa bưu chính Nexus.</text>')

    # Buttons
    lines.append(f'    <rect x="{m3_x + 20}" y="{m3_y + 224}" width="310" height="48" class="mockup-btn"/>')
    lines.append(f'    <text x="{m3_x + 175}" y="{m3_y + 254}" class="mockup-btn-txt">XÁC NHẬN NHẬN TIỀN (2H)</text>')
    lines.append(f'    <rect x="{m3_x + 350}" y="{m3_y + 224}" width="310" height="48" fill="#FFFFFF" stroke="#000000" stroke-width="1.6" rx="5"/>')
    lines.append(f'    <text x="{m3_x + 505}" y="{m3_y + 254}" font-size="16px" font-weight="800" fill="#000000" text-anchor="middle">TẢI BIÊN BẢN BỒI THƯỜNG (PDF)</text>')
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # ROW 4: CASE 4 - PRICING_IATA (Y = 1465..1835, H = 370, Center Y = 1650)
    # =========================================================================
    r4_y = 1465
    r4_h = 370
    cy4 = r4_y + r4_h / 2.0 # 1650

    # Col 1: Card 4 (Quantitative parameter extraction)
    lines.append(draw_lane_card(70, r4_y, 940, r4_h, "Ý định 4: Dự toán cước phí (PRICING_CALC)", "PARAM EXTRACTION", [
        ("•", "Câu hỏi", "\"Kiện hàng 50x40x30 cm nặng 3kg gửi Hà Nội vào Sài Gòn giá bao nhiêu?\""),
        ("•", "Mô hình", "Trích xuất tham số: Dài=50, Rộng=40, Cao=30 (cm), Nặng=3.0 (kg)"),
        ("•", "Tuyến đường", "Xác định cặp địa danh: Điểm gửi (Hà Nội) ➔ Điểm nhận (TP.HCM)"),
        ("•", "Đầu ra", "Bộ 5 tham số đầu vào chuyển tiếp sang động cơ tính toán cước")
    ]))

    # Arrow Col 1 -> Col 2
    lines.append(f'  <line x1="1010" y1="{cy4}" x2="1100" y2="{cy4}" class="flow-arrow"/>')
    lines.append(draw_arrow(1100, cy4, "right"))

    # Col 2: Card 4 (IATA Formula & Zone-based Pricing)
    lines.append(draw_lane_card(1120, r4_y, 1140, r4_h, "Xử lý 4: Tính cước theo chuẩn IATA (Pricing)", "IATA FORMULA", [
        ("•", "Quy chuẩn IATA", "W_vol = (Dài x Rộng x Cao) / 6000 = (50x40x30)/6000 = 10.0 kg"),
        ("•", "Nguyên tắc cước", "W_chargeable = max(W_thực, W_vol) = max(3.0, 10.0) = 10.0 kg"),
        ("•", "Bảng giá", "Cước nấc 10kg tuyến Liên miền: 130.000đ + Phụ phí - Chiết khấu"),
        ("•", "Đóng gói", "Tính tổng cước = 123.250đ và thẻ IATA_PRICING_CARD")
    ]))

    # Arrow Col 2 -> Col 3
    lines.append(f'  <line x1="2260" y1="{cy4}" x2="2350" y2="{cy4}" class="flow-arrow"/>')
    lines.append(draw_arrow(2350, cy4, "right"))

    # Col 3: Mockup 4 (IATA_PRICING_CARD)
    lines.append(f'  <g id="Mockup_Card_4">')
    lines.append(f'    <rect x="2370" y="{r4_y}" width="1160" height="{r4_h}" class="card-box"/>')
    lines.append(f'    <rect x="2370" y="{r4_y}" width="1160" height="48" class="card-hdr-bg"/>')
    lines.append(f'    <text x="2388" y="{r4_y + 32}" class="card-title">MẪU GIAO DIỆN: IATA_PRICING_CARD (Dự Toán Cước Quy Đổi IATA)</text>')
    lines.append(f'    <rect x="{2370 + 1160 - 230}" y="{r4_y + 8}" width="215" height="32" rx="5" fill="#E5E7EB" stroke="#4B5563" stroke-width="1.0"/>')
    lines.append(f'    <text x="{2370 + 1160 - 122}" y="{r4_y + 29}" class="card-tag" text-anchor="middle">IATA CALCULATOR</text>')
    lines.append(f'    <line x1="2370" y1="{r4_y + 48}" x2="{2370 + 1160}" y2="{r4_y + 48}" stroke="#000000" stroke-width="1.4"/>')

    m4_x, m4_y, m4_w, m4_h = 2390, r4_y + 56, 1120, 298
    lines.append(f'    <rect x="{m4_x}" y="{m4_y}" width="{m4_w}" height="{m4_h}" class="mockup-frame"/>')
    lines.append(f'    <rect x="{m4_x}" y="{m4_y}" width="{m4_w}" height="42" class="mockup-hdr"/>')
    lines.append(f'    <text x="{m4_x + 18}" y="{m4_y + 28}" font-size="19px" font-weight="900" fill="#000000">DỰ TOÁN CƯỚC: HÀ NỘI ➔ TP. HỒ CHÍ MINH</text>')
    lines.append(f'    <rect x="{m4_x + m4_w - 210}" y="{m4_y + 7}" width="190" height="28" fill="#000000" rx="4"/>')
    lines.append(f'    <text x="{m4_x + m4_w - 115}" y="{m4_y + 26}" font-size="14.5px" font-weight="800" fill="#FFFFFF" text-anchor="middle">CHUẨN IATA (V/6000)</text>')

    # Weight Comparison Box
    lines.append(f'    <rect x="{m4_x + 20}" y="{m4_y + 54}" width="{m4_w - 40}" height="94" fill="#FAFAFA" stroke="#000000" stroke-width="1.2" rx="5"/>')
    lines.append(f'    <text x="{m4_x + 36}" y="{m4_y + 84}" font-size="18.5px" font-weight="800" fill="#000000">Kích thước: 50 x 40 x 30 cm • Cân nặng thực tế: 3.0 kg</text>')
    lines.append(f'    <text x="{m4_x + 36}" y="{m4_y + 112}" font-size="17.5px" fill="#374151">Trọng lượng thể tích IATA: <tspan font-weight="800">10.0 kg</tspan> [ (50x40x30)/6000 ] ➔ Trọng lượng tính cước: <tspan font-weight="900">10.0 kg</tspan></text>')
    lines.append(f'    <text x="{m4_x + 36}" y="{m4_y + 134}" font-size="15px" fill="#6B7280">Nguyên tắc: Tính cước theo giá trị lớn hơn giữa cân nặng thực tế và thể tích quy đổi.</text>')

    # Fee Breakdown
    lines.append(f'    <text x="{m4_x + 36}" y="{m4_y + 172}" font-size="17.5px" fill="#374151">Cước tiêu chuẩn (Chuyển phát nhanh 48h): <tspan font-weight="800">130.000 VNĐ</tspan></text>')
    lines.append(f'    <text x="{m4_x + 36}" y="{m4_y + 198}" font-size="17.5px" fill="#374151">Phụ phí kiện cồng kềnh: <tspan font-weight="800">+15.000 VNĐ</tspan> • Chiết khấu Shop thân thiết: <tspan font-weight="800">-21.750 VNĐ</tspan></text>')
    lines.append(f'    <text x="{m4_x + 36}" y="{m4_y + 226}" font-size="19.5px" font-weight="900" fill="#000000">TỔNG CƯỚC TẠM TÍNH: 123.250 VNĐ <tspan font-size="16px" font-weight="500" fill="#4B5563">(Đã gồm thuế GTGT &amp; Bảo hiểm tiêu chuẩn)</tspan></text>')

    # Button
    lines.append(f'    <rect x="{m4_x + 20}" y="{m4_y + 242}" width="280" height="48" class="mockup-btn"/>')
    lines.append(f'    <text x="{m4_x + 160}" y="{m4_y + 272}" class="mockup-btn-txt">TẠO ĐƠN VỚI GIÁ NÀY</text>')
    lines.append(f'    <rect x="{m4_x + 320}" y="{m4_y + 242}" width="280" height="48" fill="#FFFFFF" stroke="#000000" stroke-width="1.6" rx="5"/>')
    lines.append(f'    <text x="{m4_x + 460}" y="{m4_y + 272}" font-size="16px" font-weight="800" fill="#000000" text-anchor="middle">XEM BẢNG GIÁ CHI TIẾT (PDF)</text>')
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # ROW 5: CASE 5 - GUEST_LOOKUP & DATA MASKING (Y = 1880..2250, H = 370)
    # =========================================================================
    r5_y = 1880
    r5_h = 370
    cy5 = r5_y + r5_h / 2.0 # 2065

    # Col 1: Card 5 (Access Control & Data Minimization Principle)
    lines.append(draw_lane_card(70, r5_y, 940, r5_h, "Ý định 5: Tra cứu vãng lai (GUEST_LOOKUP)", "ACCESS CONTROL", [
        ("•", "Câu hỏi", "\"Tra cứu đơn NX-884920489 cho biết ai nhận và tiền thu hộ bao nhiêu?\""),
        ("•", "Mô hình", "Kiểm soát truy cập dựa trên vai trò: Nhận diện khách vãng lai (GUEST)"),
        ("•", "Nguyên tắc", "Áp dụng nguyên tắc tối thiểu hóa dữ liệu (Data Minimization)"),
        ("•", "Đầu ra", "Thiết lập cờ requireMasking = true chuyển tiếp sang bộ lọc dữ liệu")
    ]))

    # Arrow Col 1 -> Col 2
    lines.append(f'  <line x1="1010" y1="{cy5}" x2="1100" y2="{cy5}" class="flow-arrow"/>')
    lines.append(draw_arrow(1100, cy5, "right"))

    # Col 2: Card 5 (Data Masking Rules & Privacy Protection)
    lines.append(draw_lane_card(1120, r5_y, 1140, r5_h, "Xử lý 5: Che mờ Dữ liệu Nhạy cảm (Data Masking)", "DATA PRIVACY", [
        ("•", "Kỹ thuật", "Mặt nạ dữ liệu (Data Masking) để bảo vệ quyền riêng tư người dùng"),
        ("•", "Quy tắc che", "SĐT: 098***3456 (Ẩn 4 số giữa) • Họ tên: N*** V** A • Ẩn số nhà"),
        ("•", "Bảo mật", "Ẩn 100% số tiền COD và giá trị khai giá để tránh lộ thông tin tài chính"),
        ("•", "Đóng gói", "Xuất dữ liệu đã che mờ theo JSON Schema: MASKED_PUBLIC_CARD")
    ]))

    # Arrow Col 2 -> Col 3
    lines.append(f'  <line x1="2260" y1="{cy5}" x2="2350" y2="{cy5}" class="flow-arrow"/>')
    lines.append(draw_arrow(2350, cy5, "right"))

    # Col 3: Mockup 5 (MASKED_PUBLIC_CARD)
    lines.append(f'  <g id="Mockup_Card_5">')
    lines.append(f'    <rect x="2370" y="{r5_y}" width="1160" height="{r5_h}" class="card-box"/>')
    lines.append(f'    <rect x="2370" y="{r5_y}" width="1160" height="48" class="card-hdr-bg"/>')
    lines.append(f'    <text x="2388" y="{r5_y + 32}" class="card-title">MẪU GIAO DIỆN: MASKED_PUBLIC_CARD (Thẻ Che Giấu Thông Tin Cá Nhân)</text>')
    lines.append(f'    <rect x="{2370 + 1160 - 200}" y="{r5_y + 8}" width="185" height="32" rx="5" fill="#E5E7EB" stroke="#4B5563" stroke-width="1.0"/>')
    lines.append(f'    <text x="{2370 + 1160 - 107}" y="{r5_y + 29}" class="card-tag" text-anchor="middle">DATA MASKED</text>')
    lines.append(f'    <line x1="2370" y1="{r5_y + 48}" x2="{2370 + 1160}" y2="{r5_y + 48}" stroke="#000000" stroke-width="1.4"/>')

    m5_x, m5_y, m5_w, m5_h = 2390, r5_y + 56, 1120, 298
    lines.append(f'    <rect x="{m5_x}" y="{m5_y}" width="{m5_w}" height="{m5_h}" class="mockup-frame"/>')
    lines.append(f'    <rect x="{m5_x}" y="{m5_y}" width="{m5_w}" height="42" class="mockup-hdr"/>')
    lines.append(f'    <text x="{m5_x + 18}" y="{m5_y + 28}" font-size="19px" font-weight="900" fill="#000000">MÃ VẬN ĐƠN: NX-884920489</text>')
    lines.append(f'    <rect x="{m5_x + 360}" y="{m5_y + 7}" width="200" height="28" fill="#000000" rx="4"/>')
    lines.append(f'    <text x="{m5_x + 460}" y="{m5_y + 26}" font-size="14.5px" font-weight="800" fill="#FFFFFF" text-anchor="middle">ĐÃ CHE MỜ THÔNG TIN</text>')
    lines.append(f'    <text x="{m5_x + m5_w - 18}" y="{m5_y + 28}" font-size="17px" font-weight="700" fill="#4B5563" text-anchor="end">Khách vãng lai (Công khai)</text>')

    # Content
    lines.append(f'    <rect x="{m5_x + 20}" y="{m5_y + 54}" width="{m5_w - 40}" height="154" fill="#FAFAFA" stroke="#000000" stroke-width="1.2" rx="5"/>')
    lines.append(f'    <text x="{m5_x + 36}" y="{m5_y + 84}" font-size="18.5px" font-weight="800" fill="#000000">Trạng thái bưu gửi: Đang trung chuyển tại Trung tâm phân loại Cầu Giấy (Hà Nội)</text>')
    lines.append(f'    <text x="{m5_x + 36}" y="{m5_y + 112}" font-size="17.5px" fill="#374151">• Người nhận: <tspan font-weight="800">N*** V** A</tspan> • Số điện thoại: <tspan font-weight="800">098***3456</tspan> (Đã che 4 số ở giữa)</text>')
    lines.append(f'    <text x="{m5_x + 36}" y="{m5_y + 138}" font-size="17.5px" fill="#374151">• Địa chỉ giao hàng: <tspan font-weight="800">Phường Dịch Vọng Hậu, Cầu Giấy, Hà Nội</tspan> (Đã ẩn số nhà)</text>')
    lines.append(f'    <text x="{m5_x + 36}" y="{m5_y + 166}" font-size="17.5px" fill="#374151">• Tiền thu hộ COD: <tspan font-weight="800">****** VNĐ</tspan> (Bảo mật tài chính theo quy định bưu chính)</text>')
    lines.append(f'    <text x="{m5_x + 36}" y="{m5_y + 192}" font-size="15px" font-style="italic" fill="#4B5563">Lưu ý: Bạn đang tra cứu công khai. Vui lòng đăng nhập OTP để mở toàn bộ thông tin đơn hàng.</text>')

    # Button
    lines.append(f'    <rect x="{m5_x + 20}" y="{m5_y + 224}" width="310" height="48" class="mockup-btn"/>')
    lines.append(f'    <text x="{m5_x + 175}" y="{m5_y + 254}" class="mockup-btn-txt">ĐĂNG NHẬP OTP XÁC THỰC</text>')
    lines.append(f'    <rect x="{m5_x + 350}" y="{m5_y + 224}" width="310" height="48" fill="#FFFFFF" stroke="#000000" stroke-width="1.6" rx="5"/>')
    lines.append(f'    <text x="{m5_x + 505}" y="{m5_y + 254}" font-size="16px" font-weight="800" fill="#000000" text-anchor="middle">TẢI APP DI ĐỘNG THEO DÕI</text>')
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # FOOTER & LEGEND (LARGE TYPOGRAPHY)
    # =========================================================================
    lines.append('  <!-- ==================== FOOTER & LEGEND ==================== -->')
    lines.append('  <g id="Footer_Legend">')
    lines.append(f'    <rect x="40" y="{height-105}" width="{width-80}" height="80" fill="#FAFAFA" stroke="#000000" stroke-width="1.8" rx="6"/>')
    lines.append(f'    <text x="65" y="{height-62}" font-size="17px" font-family="ui-monospace, monospace" font-weight="900" fill="#000000">QUY TẮC ĐIỀU PHỐI Ý ĐỊNH &amp; PHẢN HỒI GIAO DIỆN (INTENT TO RICH CARD MAPPING):</text>')

    lines.append(f'    <rect x="65" y="{height-46}" width="75" height="24" fill="#000000" rx="4"/>')
    lines.append(f'    <text x="102" y="{height-29}" font-size="13px" font-weight="800" fill="#FFFFFF" text-anchor="middle">INTENT</text>')
    lines.append(f'    <text x="150" y="{height-29}" font-size="16px" font-weight="700" fill="#000000">: Phân loại ý định &amp; Bóc tách tham số</text>')

    lines.append(f'    <rect x="560" y="{height-46}" width="70" height="24" fill="#F4F4F5" stroke="#000000" stroke-width="1.2" rx="4"/>')
    lines.append(f'    <text x="595" y="{height-29}" font-size="13px" font-weight="800" fill="#000000" text-anchor="middle">LOGIC</text>')
    lines.append(f'    <text x="640" y="{height-29}" font-size="16px" font-weight="700" fill="#000000">: Xử lý CSDL, Bảng luật quyết định &amp; Chuẩn IATA</text>')

    lines.append(f'    <rect x="1140" y="{height-46}" width="85" height="24" fill="#FFFFFF" stroke="#000000" stroke-width="1.4" rx="4"/>')
    lines.append(f'    <text x="1182" y="{height-29}" font-size="13px" font-weight="800" fill="#000000" text-anchor="middle">UI CARD</text>')
    lines.append(f'    <text x="1235" y="{height-29}" font-size="16px" font-weight="700" fill="#000000">: Đóng gói Thẻ tương tác phản hồi trực quan</text>')

    lines.append(f'    <line x1="1720" y1="{height-34}" x2="1780" y2="{height-34}" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <polygon points="1780,{height-34} 1766,{height-39} 1766,{height-29}" fill="#000000"/>')
    lines.append(f'    <text x="1795" y="{height-29}" font-size="16px" font-weight="700" fill="#000000">: Luồng điều phối trực giao 90° (Manhattan Flow)</text>')

    lines.append(f'    <text x="{width-65}" y="{height-29}" text-anchor="end" font-size="15.5px" font-style="italic" font-weight="700" fill="#4B5563">100% Native Inline Vector • Chuẩn Kỹ Thuật Đồ Án Tốt Nghiệp</text>')
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

    target_path = os.path.abspath("docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/02-sequence-and-decision-matrix.svg")
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated successfully: {target_path} ({len(svg_content.encode('utf-8'))} bytes)")
