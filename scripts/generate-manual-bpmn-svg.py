#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE MANUAL CLAIM RESOLUTION BPMN SVG (LARGE HIGH-CONTRAST VECTOR BLUEPRINT)
================================================================================
Bản vẽ Kỹ thuật Vector: Quy trình Xử lý Sự cố & Khiếu nại Thủ công (As-Is / Manual SOP)
Dành cho Figma Page 2: Section 2.1 & Thuyết minh Khóa luận tốt nghiệp.
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

    # STYLES
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }')
    lines.append('      .bg { fill: #FFFFFF; }')
    lines.append('      .frame { fill: none; stroke: #000000; stroke-width: 3.2; }')
    lines.append('      .frame-inner { fill: none; stroke: #000000; stroke-width: 1.4; stroke-dasharray: 8 4; }')
    lines.append('      .pool-border { fill: #FFFFFF; stroke: #000000; stroke-width: 2.6; }')
    lines.append('      .pool-hdr { fill: #18181B; stroke: #000000; stroke-width: 2.2; }')
    lines.append('      .lane-hdr { fill: #F4F4F5; stroke: #000000; stroke-width: 1.8; }')
    lines.append('      .lane-divider { stroke: #000000; stroke-width: 1.8; stroke-dasharray: 6 4; }')
    lines.append('      .flow-line { fill: none; stroke: #000000; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .assoc-line { fill: none; stroke: #4B5563; stroke-width: 1.8; stroke-dasharray: 5 4; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .gw-diamond { fill: #FFFFFF; stroke: #000000; stroke-width: 2.6; }')
    lines.append('      .gw-cross { stroke: #000000; stroke-width: 4.0; stroke-linecap: round; }')
    lines.append('      .gw-label { font-size: 21px; font-weight: 900; fill: #000000; text-anchor: middle; }')
    lines.append('      .cond-plate { fill: #FFFFFF; stroke: #000000; stroke-width: 1.6; rx: 6px; }')
    lines.append('      .cond-text { font-size: 18px; font-weight: 800; fill: #000000; font-family: ui-monospace, Menlo, monospace; text-anchor: middle; }')
    lines.append('      .cond-text-alert { font-size: 18px; font-weight: 900; fill: #DC2626; font-family: ui-monospace, Menlo, monospace; text-anchor: middle; }')
    lines.append('      .cond-text-success { font-size: 18px; font-weight: 900; fill: #15803D; font-family: ui-monospace, Menlo, monospace; text-anchor: middle; }')
    lines.append('    ]]></style>')
    lines.append('  </defs>')

    # Background
    lines.append(f'  <rect width="{width}" height="{height}" class="bg"/>')

    # Blueprint Border
    lines.append(f'  <rect x="30" y="30" width="{width - 60}" height="{height - 60}" class="frame"/>')
    lines.append(f'  <rect x="42" y="42" width="{width - 84}" height="{height - 84}" class="frame-inner"/>')

    # Top Blueprint Header
    lines.append('  <g id="Header_Bar">')
    lines.append('    <rect x="42" y="42" width="3516" height="110" fill="#F8FAFC" stroke="#000000" stroke-width="1.8"/>')
    lines.append('    <text x="75" y="88" font-size="34px" font-weight="900" fill="#000000" letter-spacing="0.5px">QUY TRÌNH XỬ LÝ SỰ CỐ &amp; BỒI THƯỜNG THỦ CÔNG (AS-IS / MANUAL SOP)</text>')
    lines.append('    <text x="75" y="125" font-size="18.5px" font-weight="700" fill="#4B5563">CHUẨN OMG BPMN 2.0 • PHÂN TÍCH HIỆN TRẠNG &amp; QUY TRÌNH DỰ PHÒNG THỦ CÔNG KHI SẬP DỊCH VỤ SỐ</text>')
    lines.append('    <rect x="2900" y="65" width="620" height="65" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>')
    lines.append('    <text x="2925" y="93" font-family="ui-monospace, Menlo, monospace" font-size="16px" font-weight="800" fill="#000000">MÃ BẢN VẼ: DOC-BPMN-MANUAL-00</text>')
    lines.append('    <text x="2925" y="118" font-family="ui-monospace, Menlo, monospace" font-size="14.5px" fill="#DC2626" font-weight="700">SLA: 3 - 5 NGÀY • 100% THỦ CÔNG • EXCEL &amp; KÝ GIẤY</text>')
    lines.append('  </g>')

    # Pool & Lanes Geometry
    pool_x = 75
    pool_y = 180
    pool_w = 3450
    pool_h = 2150
    pool_hdr_w = 65

    lane_hdr_w = 75
    lane1_y = pool_y
    lane1_h = 500
    lane2_y = lane1_y + lane1_h
    lane2_h = 550
    lane3_y = lane2_y + lane2_h
    lane3_h = 550
    lane4_y = lane3_y + lane3_h
    lane4_h = 550

    # Pool Container
    lines.append(f'  <rect x="{pool_x}" y="{pool_y}" width="{pool_w}" height="{pool_h}" class="pool-border"/>')

    # Pool Header Vertical
    lines.append(f'  <g id="Pool_Header">')
    lines.append(f'    <rect x="{pool_x}" y="{pool_y}" width="{pool_hdr_w}" height="{pool_h}" class="pool-hdr"/>')
    ph_cx = pool_x + pool_hdr_w / 2
    ph_cy = pool_y + pool_h / 2
    lines.append(f'    <text x="{ph_cx}" y="{ph_cy}" font-size="22px" font-weight="900" fill="#FFFFFF" text-anchor="middle" transform="rotate(-90 {ph_cx} {ph_cy})" letter-spacing="1.5px">HỆ THỐNG VẬN HÀNH BƯU CHÍNH NEXUS — QUY TRÌNH THỦ CÔNG (AS-IS)</text>')
    lines.append('  </g>')

    # Lanes
    lanes_meta = [
        (lane1_y, lane1_h, "LÀN 1: KHÁCH HÀNG / MERCHANT (Giao tiếp & Cung cấp hồ sơ)"),
        (lane2_y, lane2_h, "LÀN 2: BỘ PHẬN CSKH & TỔNG ĐÀI (Nhập Excel, Kiểm tra chứng từ & Đề xuất)"),
        (lane3_y, lane3_h, "LÀN 3: BƯU CỤC PHÁT & KHO TRUNG CHUYỂN (Lục tìm BBBT giấy & Giám định)"),
        (lane4_y, lane4_h, "LÀN 4: LÃNH ĐẠO & KẾ TOÁN TÀI CHÍNH (Ký duyệt Tờ trình & Chi tiền Ngân hàng)")
    ]

    for ly, lh, ltitle in lanes_meta:
        lines.append(f'  <g id="Lane_{ltitle[:10]}">')
        lines.append(f'    <rect x="{pool_x + pool_hdr_w}" y="{ly}" width="{lane_hdr_w}" height="{lh}" class="lane-hdr"/>')
        lh_cx = pool_x + pool_hdr_w + lane_hdr_w / 2
        lh_cy = ly + lh / 2
        lines.append(f'    <text x="{lh_cx}" y="{lh_cy}" font-size="19px" font-weight="800" fill="#18181B" text-anchor="middle" transform="rotate(-90 {lh_cx} {lh_cy})">{xml_esc(ltitle)}</text>')
        if ly > pool_y:
            lines.append(f'    <line x1="{pool_x + pool_hdr_w}" y1="{ly}" x2="{pool_x + pool_w}" y2="{ly}" class="lane-divider"/>')
        lines.append('  </g>')

    # Helper Arrow
    def draw_arrow(tip_x, tip_y, direction):
        if direction == "right":
            return f'<polygon points="{tip_x},{tip_y} {tip_x-17},{tip_y-7} {tip_x-17},{tip_y+7}" fill="#000000"/>'
        elif direction == "left":
            return f'<polygon points="{tip_x},{tip_y} {tip_x+17},{tip_y-7} {tip_x+17},{tip_y+7}" fill="#000000"/>'
        elif direction == "down":
            return f'<polygon points="{tip_x},{tip_y} {tip_x-7},{tip_y-17} {tip_x+7},{tip_y-17}" fill="#000000"/>'
        elif direction == "up":
            return f'<polygon points="{tip_x},{tip_y} {tip_x-7},{tip_y+17} {tip_x+7},{tip_y+17}" fill="#000000"/>'
        return ""

    def draw_assoc_arrow(tip_x, tip_y, direction):
        if direction == "up":
            return f'<polygon points="{tip_x},{tip_y} {tip_x-6},{tip_y+13} {tip_x+6},{tip_y+13}" fill="#4B5563"/>'
        elif direction == "down":
            return f'<polygon points="{tip_x},{tip_y} {tip_x-6},{tip_y-13} {tip_x+6},{tip_y-13}" fill="#4B5563"/>'
        return ""

    def draw_cond_plate(cx, cy, text, w=220, h=38, status="default"):
        cls = "cond-text"
        if status == "alert":
            cls = "cond-text-alert"
        elif status == "success":
            cls = "cond-text-success"
        res = []
        res.append(f'    <rect x="{cx - w/2}" y="{cy - h/2}" width="{w}" height="{h}" class="cond-plate"/>')
        res.append(f'    <text x="{cx}" y="{cy + 6}" class="{cls}">{xml_esc(text)}</text>')
        return "\n".join(res)

    def get_task_icon(task_type, x, y):
        if task_type == "user":
            return f'''<g transform="translate({x},{y})">
              <circle cx="12" cy="7" r="5.2" fill="none" stroke="#000000" stroke-width="2.0"/>
              <path d="M 2 22 C 2 15, 7 14, 12 14 C 17 14, 22 15, 22 22" fill="none" stroke="#000000" stroke-width="2.0"/>
            </g>'''
        elif task_type == "manual":
            return f'''<g transform="translate({x},{y})">
              <path d="M 5 22 V 10 C 5 8.5 7.5 8.5 7.5 10 V 7 C 7.5 5.5 10 5.5 10 7 V 6 C 10 4.5 12.5 4.5 12.5 6 V 8 C 12.5 7 15 7 15 8.5 V 13 C 15 16 12.5 22 10 22 Z" fill="none" stroke="#000000" stroke-width="1.8" stroke-linejoin="round"/>
            </g>'''
        elif task_type == "send":
            return f'''<g transform="translate({x},{y})">
              <rect x="2" y="3" width="20" height="15" fill="#000000" rx="2"/>
              <polyline points="2,3 12,11 22,3" stroke="#FFFFFF" stroke-width="1.8" fill="none"/>
            </g>'''
        return ""

    def draw_activity(x, y, w, h, lines_text, task_type="user", task_code=None):
        res = []
        res.append(f'  <g id="Activity_{task_code or lines_text[0][:10].replace(" ", "_")}">')
        res.append(f'    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="2.4"/>')
        icon_svg = get_task_icon(task_type, x + 14, y + 12)
        if icon_svg:
            res.append(icon_svg)
        if task_code:
            res.append(f'    <text x="{x + w - 16}" y="{y + 26}" font-size="15px" font-family="ui-monospace, monospace" font-weight="800" fill="#4B5563" text-anchor="end">{xml_esc(task_code)}</text>')
        if len(lines_text) == 1:
            res.append(f'    <text x="{x + w/2}" y="{y + h/2 + 8}" font-size="22px" font-weight="800" fill="#000000" text-anchor="middle">{xml_esc(lines_text[0])}</text>')
        elif len(lines_text) == 2:
            res.append(f'    <text x="{x + w/2}" y="{y + h/2 - 6}" font-size="21.5px" font-weight="800" fill="#000000" text-anchor="middle">{xml_esc(lines_text[0])}</text>')
            res.append(f'    <text x="{x + w/2}" y="{y + h/2 + 26}" font-size="21.5px" font-weight="800" fill="#000000" text-anchor="middle">{xml_esc(lines_text[1])}</text>')
        res.append('  </g>')
        return "\n".join(res)

    def draw_gateway(cx, cy, gw_type="xor", label_text=None, label_pos="top"):
        r = 44
        res = []
        res.append(f'  <g id="GW_at_{int(cx)}_{int(cy)}">')
        res.append(f'    <polygon points="{cx},{cy-r} {cx+r},{cy} {cx},{cy+r} {cx-r},{cy}" class="gw-diamond"/>')
        if gw_type == "xor":
            cr = 17
            res.append(f'    <line x1="{cx-cr}" y1="{cy-cr}" x2="{cx+cr}" y2="{cy+cr}" class="gw-cross"/>')
            res.append(f'    <line x1="{cx-cr}" y1="{cy+cr}" x2="{cx+cr}" y2="{cy-cr}" class="gw-cross"/>')
        if label_text:
            ly = cy - r - 16 if label_pos == "top" else cy + r + 28
            res.append(f'    <text x="{cx}" y="{ly}" class="gw-label">{xml_esc(label_text)}</text>')
        res.append('  </g>')
        return "\n".join(res)

    def draw_start_event(cx, cy, label):
        r = 30
        res = []
        res.append(f'  <g id="Start_at_{int(cx)}_{int(cy)}">')
        res.append(f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#FFFFFF" stroke="#15803D" stroke-width="3.0"/>')
        res.append(f'    <text x="{cx}" y="{cy+52}" font-size="18.5px" font-weight="900" fill="#000000" text-anchor="middle">{xml_esc(label)}</text>')
        res.append('  </g>')
        return "\n".join(res)

    def draw_end_event(cx, cy, label, end_type="none"):
        r = 30
        res = []
        stroke_col = "#DC2626" if end_type == "terminate" else "#000000"
        res.append(f'  <g id="End_at_{int(cx)}_{int(cy)}">')
        res.append(f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#FFFFFF" stroke="{stroke_col}" stroke-width="4.8"/>')
        if end_type == "terminate":
            res.append(f'    <circle cx="{cx}" cy="{cy}" r="14" fill="#DC2626"/>')
        res.append(f'    <text x="{cx}" y="{cy+52}" font-size="18px" font-weight="900" fill="{stroke_col}" text-anchor="middle">{xml_esc(label)}</text>')
        res.append('  </g>')
        return "\n".join(res)

    def draw_data_store(x, y, w, h, title, sub):
        rx = w / 2
        ry = 16
        res = []
        res.append(f'  <g id="DataStore_{title[:10].replace(" ", "_")}">')
        res.append(f'    <path d="M {x} {y+ry} V {y+h-ry} A {rx} {ry} 0 0 0 {x+w} {y+h-ry} V {y+ry}" fill="#FAFAFA" stroke="#4B5563" stroke-width="2.2"/>')
        res.append(f'    <ellipse cx="{x+rx}" cy="{y+ry}" rx="{rx}" ry="{ry}" fill="#F4F4F5" stroke="#4B5563" stroke-width="2.2"/>')
        res.append(f'    <text x="{x+rx}" y="{y+50}" font-size="20.5px" font-weight="800" fill="#000000" text-anchor="middle">{xml_esc(title)}</text>')
        res.append(f'    <text x="{x+rx}" y="{y+78}" font-size="16px" font-family="ui-monospace, monospace" font-weight="700" fill="#4B5563" text-anchor="middle">{xml_esc(sub)}</text>')
        res.append('  </g>')
        return "\n".join(res)

    # =========================================================================
    # LANE 1: KHÁCH HÀNG (Y = 200..700, Mid Y = 450)
    # =========================================================================
    lines.append('  <!-- ==================== LANE 1: CUSTOMER ==================== -->')
    lines.append(draw_start_event(270, 420, "Phát hiện sự cố"))
    lines.append(draw_activity(380, 350, 330, 140, ["Gọi điện tổng đài hoặc", "gửi email khiếu nại"], task_type="user", task_code="TASK-M1.1"))
    lines.append(f'    <line x1="300" y1="420" x2="380" y2="420" class="flow-line"/>')
    lines.append(draw_arrow(380, 420, "right"))

    # Flow Cust -> CSKH
    lines.append(f'    <line x1="545" y1="490" x2="545" y2="900" class="flow-line"/>')
    lines.append(draw_arrow(545, 900, "down"))

    # Task Cust provide more docs
    lines.append(draw_activity(1220, 350, 330, 140, ["Bổ sung ảnh biên bản giấy", "& Hóa đơn qua email/Zalo"], task_type="user", task_code="TASK-M1.2"))

    # End Events in Lane 1
    lines.append(draw_end_event(3350, 350, "Nhận tiền bồi thường"))
    lines.append(draw_end_event(3350, 490, "Bác bỏ khiếu nại", end_type="terminate"))

    # =========================================================================
    # LANE 2: CSKH & TỔNG ĐÀI (Y = 700..1240, Mid Y = 970)
    # =========================================================================
    lines.append('  <!-- ==================== LANE 2: CSKH ==================== -->')
    lines.append(draw_activity(380, 900, 330, 140, ["Ghi nhận thông tin vào", "Sổ theo dõi / File Excel"], task_type="user", task_code="TASK-M2.1"))
    lines.append(draw_activity(800, 900, 330, 140, ["Kiểm tra tính hợp lệ của", "biên bản ký nhận & Ảnh"], task_type="user", task_code="TASK-M2.2"))
    lines.append(f'    <line x1="710" y1="970" x2="800" y2="970" class="flow-line"/>')
    lines.append(draw_arrow(800, 970, "right"))

    # Data Store Excel
    lines.append(draw_data_store(380, 1080, 330, 95, "Sổ theo dõi & File Excel", "[DOC-01] Quản lý sự cố thủ công"))
    lines.append(f'    <line x1="545" y1="1080" x2="545" y2="1040" class="assoc-line"/>')
    lines.append(draw_assoc_arrow(545, 1040, "up"))

    # Gateway Docs Complete?
    lines.append(draw_gateway(1250, 970, gw_type="xor", label_text="Hồ sơ đủ chứng từ?", label_pos="top"))
    lines.append(f'    <line x1="1130" y1="970" x2="1206" y2="970" class="flow-line"/>')
    lines.append(draw_arrow(1206, 970, "right"))

    # Branch Missing Docs -> Cust M1.2
    lines.append(f'    <line x1="1250" y1="926" x2="1250" y2="490" class="flow-line"/>')
    lines.append(draw_arrow(1250, 490, "up"))
    lines.append(draw_cond_plate(1250, 710, "[Thiếu chứng từ / Mờ]", w=240, h=40, status="alert"))

    # Flow Cust M1.2 back to CSKH M2.2
    lines.append(f'    <line x1="1385" y1="490" x2="1385" y2="580" class="flow-line"/>')
    lines.append(f'    <line x1="1385" y1="580" x2="965" y2="580" class="flow-line"/>')
    lines.append(f'    <line x1="965" y1="580" x2="965" y2="900" class="flow-line"/>')
    lines.append(draw_arrow(965, 900, "down"))

    # Branch Docs OK -> Hub M3.1 (Lane 3)
    lines.append(f'    <line x1="1250" y1="1014" x2="1250" y2="1440" class="flow-line"/>')
    lines.append(draw_arrow(1250, 1440, "down"))
    lines.append(draw_cond_plate(1250, 1220, "[Đầy đủ chứng từ]", w=210, h=40, status="success"))

    # CSKH Calculate Loss & Draft Proposal
    lines.append(draw_activity(1750, 900, 330, 140, ["Tra cứu bảng quy chế &", "Tính mức bồi hoàn trên Excel"], task_type="user", task_code="TASK-M2.3"))
    lines.append(draw_activity(2180, 900, 330, 140, ["In Tờ trình đề xuất", "bồi thường ký giấy tay"], task_type="user", task_code="TASK-M2.4"))
    lines.append(f'    <line x1="2080" y1="970" x2="2180" y2="970" class="flow-line"/>')
    lines.append(draw_arrow(2180, 970, "right"))

    # CSKH Notify Result
    lines.append(draw_activity(2900, 900, 330, 140, ["Gửi email & Gọi điện thoại", "thông báo kết quả cho khách"], task_type="send", task_code="TASK-M2.5"))

    # =========================================================================
    # LANE 3: BƯU CỤC & KHO TRUNG CHUYỂN (Y = 1240..1780, Mid Y = 1510)
    # =========================================================================
    lines.append('  <!-- ==================== LANE 3: OPERATIONS & HUB ==================== -->')
    lines.append(draw_activity(1085, 1440, 330, 140, ["Lục tìm Biên bản bất", "thường (BBBT) giấy lưu kho"], task_type="user", task_code="TASK-M3.1"))
    lines.append(draw_activity(1480, 1440, 330, 140, ["Lấy lời khai bưu tá &", "Trích xuất camera băng chuyền"], task_type="manual", task_code="TASK-M3.2"))
    lines.append(f'    <line x1="1415" y1="1510" x2="1480" y2="1510" class="flow-line"/>')
    lines.append(draw_arrow(1480, 1510, "right"))

    lines.append(draw_activity(1880, 1440, 330, 140, ["Lập & Ký biên bản giám", "định nguyên nhân tổn thất"], task_type="user", task_code="TASK-M3.3"))
    lines.append(f'    <line x1="1810" y1="1510" x2="1880" y2="1510" class="flow-line"/>')
    lines.append(draw_arrow(1880, 1510, "right"))

    # Data Store Physical Archive
    lines.append(draw_data_store(1085, 1620, 330, 95, "Kho Biên bản giấy BBBT", "[DOC-02] Lưu trữ hồ sơ bưu cục"))
    lines.append(f'    <line x1="1250" y1="1620" x2="1250" y2="1580" class="assoc-line"/>')
    lines.append(draw_assoc_arrow(1250, 1580, "up"))

    # Flow Hub M3.3 back to CSKH M2.3
    lines.append(f'    <line x1="2045" y1="1440" x2="2045" y2="1340" class="flow-line"/>')
    lines.append(f'    <line x1="2045" y1="1340" x2="1915" y2="1340" class="flow-line"/>')
    lines.append(f'    <line x1="1915" y1="1340" x2="1915" y2="1040" class="flow-line"/>')
    lines.append(draw_arrow(1915, 1040, "up"))
    lines.append(draw_cond_plate(1980, 1340, "[Biên bản giấy hoàn tất]", w=240, h=38))

    # Flow CSKH M2.4 down to Manager M4.1 (Lane 4)
    lines.append(f'    <line x1="2345" y1="1040" x2="2345" y2="1980" class="flow-line"/>')
    lines.append(draw_arrow(2345, 1980, "down"))
    lines.append(draw_cond_plate(2345, 1510, "[Trình ký hồ sơ giấy]", w=230, h=38))

    # =========================================================================
    # LANE 4: LÃNH ĐẠO & KẾ TOÁN (Y = 1780..2320, Mid Y = 2050)
    # =========================================================================
    lines.append('  <!-- ==================== LANE 4: FINANCE & MANAGEMENT ==================== -->')
    lines.append(draw_activity(2180, 1980, 330, 140, ["Trưởng phòng CSKH xem", "xét Tờ trình & Ký phê duyệt"], task_type="user", task_code="TASK-M4.1"))

    # Gateway Manager Approve?
    lines.append(draw_gateway(2620, 2050, gw_type="xor", label_text="Lãnh đạo phê duyệt?", label_pos="top"))
    lines.append(f'    <line x1="2510" y1="2050" x2="2576" y2="2050" class="flow-line"/>')
    lines.append(draw_arrow(2576, 2050, "right"))

    # Approved Branch -> Accountant M4.2
    lines.append(draw_activity(2770, 1980, 330, 140, ["Kế toán lập Ủy nhiệm chi", "(UNC) & Trình Giám đốc ký"], task_type="user", task_code="TASK-M4.2"))
    lines.append(f'    <line x1="2664" y1="2050" x2="2770" y2="2050" class="flow-line"/>')
    lines.append(draw_arrow(2770, 2050, "right"))
    lines.append(draw_cond_plate(2717, 2010, "[Phê duyệt]", w=130, h=34, status="success"))

    # Rejected Branch -> CSKH M2.5
    lines.append(f'    <line x1="2620" y1="2094" x2="2620" y2="2180" class="flow-line"/>')
    lines.append(f'    <line x1="2620" y1="2180" x2="3065" y2="2180" class="flow-line"/>')
    lines.append(f'    <line x1="3065" y1="2180" x2="3065" y2="1040" class="flow-line"/>')
    lines.append(draw_arrow(3065, 1040, "up"))
    lines.append(draw_cond_plate(2840, 2180, "[Bác bỏ / Từ chối bồi thường]", w=280, h=38, status="alert"))

    # Accountant Transfer Manual M4.3
    lines.append(draw_activity(3180, 1980, 260, 140, ["Thực hiện chuyển khoản", "thủ công qua e-Banking"], task_type="user", task_code="TASK-M4.3"))
    lines.append(f'    <line x1="3100" y1="2050" x2="3180" y2="2050" class="flow-line"/>')
    lines.append(draw_arrow(3180, 2050, "right"))

    # End Event Lane 4
    lines.append(draw_end_event(3500, 2050, "Đóng chứng từ kế toán"))
    lines.append(f'    <line x1="3440" y1="2050" x2="3470" y2="2050" class="flow-line"/>')
    lines.append(draw_arrow(3470, 2050, "right"))

    # Flow Accountant Done -> CSKH M2.5 (Notify Success)
    lines.append(f'    <line x1="3310" y1="1980" x2="3310" y2="1180" class="flow-line"/>')
    lines.append(f'    <line x1="3310" y1="1180" x2="3150" y2="1180" class="flow-line"/>')
    lines.append(f'    <line x1="3150" y1="1180" x2="3150" y2="1040" class="flow-line"/>')
    lines.append(draw_arrow(3150, 1040, "up"))
    lines.append(draw_cond_plate(3230, 1180, "[Đã chuyển tiền]", w=170, h=34, status="success"))

    # CSKH Notify -> Cust End Events (Success & Reject)
    lines.append(f'    <line x1="3230" y1="930" x2="3350" y2="930" class="flow-line"/>')
    lines.append(f'    <line x1="3350" y1="930" x2="3350" y2="380" class="flow-line"/>')
    lines.append(draw_arrow(3350, 380, "up"))
    lines.append(draw_cond_plate(3350, 650, "[Báo bồi hoàn]", w=160, h=34, status="success"))

    lines.append(f'    <line x1="3230" y1="970" x2="3300" y2="970" class="flow-line"/>')
    lines.append(f'    <line x1="3300" y1="970" x2="3300" y2="490" class="flow-line"/>')
    lines.append(f'    <line x1="3300" y1="490" x2="3320" y2="490" class="flow-line"/>')
    lines.append(draw_arrow(3320, 490, "right"))
    lines.append(draw_cond_plate(3300, 780, "[Báo từ chối]", w=150, h=34, status="alert"))

    lines.append('</svg>')
    return "\n".join(lines)

def main():
    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams"))
    os.makedirs(target_dir, exist_ok=True)
    target_svg = os.path.join(target_dir, "00-bpmn-manual-claim-resolution.svg")

    print(f"Generating Manual Claim BPMN Vector SVG to:\n  {target_svg}")
    svg_content = generate_svg()

    # SVG XML Validation
    try:
        ET.fromstring(svg_content)
        print(">> Strict XML Validation Passed: Valid SVG.")
    except Exception as e:
        print(f"!! SVG Validation Failed: {e}")
        raise

    target_svgs = [
        target_svg,
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../docs/graduation-thesis/diagrams/bpmn/00-bpmn-manual-claim-resolution.svg"))
    ]

    for s_path in target_svgs:
        os.makedirs(os.path.dirname(s_path), exist_ok=True)
        with open(s_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f">> Successfully generated BPMN SVG file: {os.path.getsize(s_path)} bytes at:\n   {s_path}")

if __name__ == "__main__":
    main()
