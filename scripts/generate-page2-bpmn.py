#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE PAGE 2 - BPMN 2.0 WORKFLOW (LARGE HIGH-READABILITY TYPOGRAPHY BLUEPRINT)
================================================================================
Bản vẽ Kỹ thuật Chuẩn OMG BPMN 2.0: Quy trình Tự động hóa Xử lý Sự cố & Khiếu nại
Thuộc Figma Page 2: Process Automation & AI Pipeline (Mã bản vẽ: DOC-PROC-BPMN-01).

Quy chuẩn kỹ thuật nâng cấp:
- Typography cực đại, độ tương phản cao (Tiêu đề 34px, Header Lane 24px, Task Title 23-24px, Gateways 21px, Condition Plates 18px).
- Tuyệt đối rõ nét khi thu nhỏ xem toàn cảnh trên màn hình laptop hoặc in ấn tài liệu thuyết minh.
- Tuân thủ nghiêm ngặt tiêu chuẩn OMG BPMN 2.0 & Camunda Best Practice Guidelines:
  + Cú pháp Verb + Object (Động từ + Đối tượng), tối đa 2 dòng.
  + Đầy đủ Task Type Markers ở góc trên trái (👤 User, ⚙️ Service, 📋 Business Rule, ✉️ Send, ✋ Manual).
  + Đầy đủ Sự kiện: Start Message ✉️, Boundary Timer ⏱️ (SLA 24h), Catch Message ✉️, End Message ✉️, End Terminate ⚫.
  + Đầy đủ Artifacts: Data Objects (Trang gấp góc), Data Stores (Cylinder), Text Annotations (Ngoặc vuông '[').
  + Cổng phân nhánh: Exclusive Gateway (XOR '×') và Parallel Gateway (AND '+') Fork/Join.
- Kích thước canvas: 3600 x 2400 px (3:2 đồng bộ toàn dự án).
- 100% Native Inline Vector, 0 thẻ <marker>, 100% Strict XML Validation.
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

    # STYLES DEFINITION (LARGE HIGH-CONTRAST TYPOGRAPHY)
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
    lines.append('      .gw-plus { stroke: #000000; stroke-width: 4.0; stroke-linecap: round; }')
    lines.append('      .gw-label { font-size: 21px; font-weight: 900; fill: #000000; text-anchor: middle; }')
    lines.append('      .cond-plate { fill: #FFFFFF; stroke: #000000; stroke-width: 1.6; rx: 6px; }')
    lines.append('      .cond-text { font-size: 18px; font-weight: 800; fill: #000000; font-family: ui-monospace, Menlo, monospace; text-anchor: middle; }')
    lines.append('      .cond-text-alert { font-size: 18px; font-weight: 900; fill: #DC2626; font-family: ui-monospace, Menlo, monospace; text-anchor: middle; }')
    lines.append('      .cond-text-success { font-size: 18px; font-weight: 900; fill: #15803D; font-family: ui-monospace, Menlo, monospace; text-anchor: middle; }')
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
    lines.append('    <text x="65" y="80" font-size="34" font-weight="900" fill="#000000" letter-spacing="-0.5px">HÌNH 4.1: SƠ ĐỒ TIẾN TRÌNH BPMN 2.0 - TỰ ĐỘNG HÓA TIẾP NHẬN &amp; XỬ LÝ KHIẾU NẠI</text>')
    lines.append('    <text x="65" y="112" font-size="19" font-weight="600" fill="#374151">Hệ Thống Quản Lý Bưu Chính Nexus • Phân Định 4 Swimlanes, 3 Cổng Rẽ Nhánh (Gateways), Động Cơ DMN &amp; Hậu Kiểm HITL</text>')
    lines.append('    <text x="65" y="134" font-size="15" font-family="ui-monospace, Menlo, monospace" font-weight="800" fill="#000000">CHUẨN THIẾT KẾ: OMG BPMN 2.0 / CAMUNDA BEST PRACTICES • LARGE TYPOGRAPHY SCALE • ZERO TEXT-BLOAT</text>')
    
    # Metadata Box Right
    meta_x = width - 640
    lines.append(f'    <rect x="{meta_x}" y="48" width="580" height="86" fill="#F8F8F8" stroke="#000000" stroke-width="1.6" rx="4"/>')
    lines.append(f'    <text x="{meta_x+20}" y="78" font-family="Segoe UI, Arial" font-size="20" font-weight="900" fill="#000000">MÃ BẢN VẼ: DOC-PROC-BPMN-01</text>')
    lines.append(f'    <text x="{meta_x+20}" y="103" font-family="ui-monospace, Menlo, monospace" font-size="16" font-weight="700" fill="#1F2937">FIGMA PAGE 2 • SECTION 2.1</text>')
    lines.append(f'    <text x="{meta_x+20}" y="125" font-family="ui-monospace, Menlo, monospace" font-size="14.5" fill="#4B5563">4 LANES • 12 TASKS • 3 GATEWAYS • 2 DATA STORES</text>')
    lines.append('  </g>')

    # =========================================================================
    # VECTOR HELPER FUNCTIONS (LARGE VISIBLE SHAPES)
    # =========================================================================
    def draw_arrow(x, y, direct="right"):
        if direct == "right":
            return f'    <polygon points="{x},{y} {x-17},{y-7} {x-17},{y+7}" fill="#000000"/>'
        elif direct == "left":
            return f'    <polygon points="{x},{y} {x+17},{y-7} {x+17},{y+7}" fill="#000000"/>'
        elif direct == "down":
            return f'    <polygon points="{x},{y} {x-7},{y-17} {x+7},{y-17}" fill="#000000"/>'
        elif direct == "up":
            return f'    <polygon points="{x},{y} {x-7},{y+17} {x+7},{y+17}" fill="#000000"/>'

    def draw_assoc_arrow(x, y, direct="down"):
        if direct == "down":
            return f'    <polygon points="{x},{y} {x-6},{y-13} {x+6},{y-13}" fill="#4B5563"/>'
        elif direct == "up":
            return f'    <polygon points="{x},{y} {x-6},{y+13} {x+6},{y+13}" fill="#4B5563"/>'
        elif direct == "right":
            return f'    <polygon points="{x},{y} {x-13},{y-6} {x-13},{y+6}" fill="#4B5563"/>'
        elif direct == "left":
            return f'    <polygon points="{x},{y} {x+13},{y-6} {x+13},{y+6}" fill="#4B5563"/>'

    def draw_cond_plate(cx, cy, text, w=240, h=42, status="normal"):
        cls = "cond-text"
        if status == "alert":
            cls = "cond-text-alert"
        elif status == "success":
            cls = "cond-text-success"
        res = []
        res.append(f'    <rect x="{cx - w/2}" y="{cy - h/2}" width="{w}" height="{h}" class="cond-plate"/>')
        res.append(f'    <text x="{cx}" y="{cy + 6}" class="{cls}">{xml_esc(text)}</text>')
        return "\n".join(res)

    # BPMN Task Type Icons (Enlarged 26x26)
    def get_task_icon(task_type, x, y):
        if task_type == "user":
            return f'''<g transform="translate({x},{y})">
              <circle cx="12" cy="7" r="5.2" fill="none" stroke="#000000" stroke-width="2.0"/>
              <path d="M 2 22 C 2 15, 7 14, 12 14 C 17 14, 22 15, 22 22" fill="none" stroke="#000000" stroke-width="2.0"/>
            </g>'''
        elif task_type == "service":
            return f'''<g transform="translate({x},{y})">
              <circle cx="12" cy="12" r="4.8" fill="none" stroke="#000000" stroke-width="2.0"/>
              <path d="M 12 2 L 12 5 M 12 19 L 12 22 M 2 12 L 5 12 M 19 12 L 22 12 M 5 5 L 7.5 7.5 M 16.5 16.5 L 19 19 M 5 19 L 7.5 16.5 M 16.5 7.5 L 19 5" stroke="#000000" stroke-width="2.0" stroke-linecap="round"/>
            </g>'''
        elif task_type == "business_rule":
            return f'''<g transform="translate({x},{y})">
              <rect x="2" y="2" width="20" height="18" fill="none" stroke="#000000" stroke-width="2.0" rx="2.5"/>
              <line x1="2" y1="8" x2="22" y2="8" stroke="#000000" stroke-width="1.8"/>
              <line x1="10" y1="2" x2="10" y2="20" stroke="#000000" stroke-width="1.8"/>
              <line x1="2" y1="14" x2="22" y2="14" stroke="#000000" stroke-width="1.8"/>
            </g>'''
        elif task_type == "send":
            return f'''<g transform="translate({x},{y})">
              <rect x="2" y="3" width="20" height="15" fill="#000000" rx="2"/>
              <polyline points="2,3 12,11 22,3" stroke="#FFFFFF" stroke-width="1.8" fill="none"/>
            </g>'''
        elif task_type == "manual":
            return f'''<g transform="translate({x},{y})">
              <path d="M 5 22 V 10 C 5 8.5 7.5 8.5 7.5 10 V 7 C 7.5 5.5 10 5.5 10 7 V 6 C 10 4.5 12.5 4.5 12.5 6 V 8 C 12.5 7 15 7 15 8.5 V 13 C 15 16 12.5 22 10 22 Z" fill="none" stroke="#000000" stroke-width="1.8" stroke-linejoin="round"/>
            </g>'''
        return ""

    # BPMN Activity Task Box (Large Typography: Title 21.5-23px bold, zero overflow)
    def draw_activity(x, y, w, h, lines_text, task_type="user", task_code=None):
        res = []
        res.append(f'  <g id="Activity_{task_code or lines_text[0][:10].replace(" ", "_")}">')
        res.append(f'    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="2.4"/>')
        
        # Icon in top left
        icon_svg = get_task_icon(task_type, x + 14, y + 12)
        if icon_svg:
            res.append(icon_svg)
            
        # Task code in upper-right
        if task_code:
            res.append(f'    <text x="{x + w - 16}" y="{y + 26}" font-size="15px" font-family="ui-monospace, monospace" font-weight="800" fill="#4B5563" text-anchor="end">{xml_esc(task_code)}</text>')

        # Center Text (Verb + Object, font-size 21.5px bold)
        if len(lines_text) == 1:
            res.append(f'    <text x="{x + w/2}" y="{y + h/2 + 8}" font-size="22.5px" font-weight="800" fill="#000000" text-anchor="middle">{xml_esc(lines_text[0])}</text>')
        elif len(lines_text) == 2:
            res.append(f'    <text x="{x + w/2}" y="{y + h/2 - 6}" font-size="21.5px" font-weight="800" fill="#000000" text-anchor="middle">{xml_esc(lines_text[0])}</text>')
            res.append(f'    <text x="{x + w/2}" y="{y + h/2 + 26}" font-size="21.5px" font-weight="800" fill="#000000" text-anchor="middle">{xml_esc(lines_text[1])}</text>')
        elif len(lines_text) >= 3:
            res.append(f'    <text x="{x + w/2}" y="{y + h/2 - 18}" font-size="20.5px" font-weight="800" fill="#000000" text-anchor="middle">{xml_esc(lines_text[0])}</text>')
            res.append(f'    <text x="{x + w/2}" y="{y + h/2 + 9}" font-size="20.5px" font-weight="800" fill="#000000" text-anchor="middle">{xml_esc(lines_text[1])}</text>')
            res.append(f'    <text x="{x + w/2}" y="{y + h/2 + 35}" font-size="17px" font-weight="600" fill="#4B5563" text-anchor="middle">{xml_esc(lines_text[2])}</text>')

        res.append('  </g>')
        return "\n".join(res)

    # BPMN Gateway (88x88 diamond, r=44)
    def draw_gateway(cx, cy, gw_type="xor", label_text=None, label_pos="top"):
        r = 44
        res = []
        res.append(f'  <g id="GW_at_{int(cx)}_{int(cy)}">')
        res.append(f'    <polygon points="{cx},{cy-r} {cx+r},{cy} {cx},{cy+r} {cx-r},{cy}" class="gw-diamond"/>')
        if gw_type == "xor":
            cr = 17
            res.append(f'    <line x1="{cx-cr}" y1="{cy-cr}" x2="{cx+cr}" y2="{cy+cr}" class="gw-cross"/>')
            res.append(f'    <line x1="{cx-cr}" y1="{cy+cr}" x2="{cx+cr}" y2="{cy-cr}" class="gw-cross"/>')
        elif gw_type == "parallel":
            pr = 20
            res.append(f'    <line x1="{cx}" y1="{cy-pr}" x2="{cx}" y2="{cy+pr}" class="gw-plus"/>')
            res.append(f'    <line x1="{cx-pr}" y1="{cy}" x2="{cx+pr}" y2="{cy}" class="gw-plus"/>')
            
        if label_text:
            ly = cy - r - 16 if label_pos == "top" else cy + r + 28
            res.append(f'    <text x="{cx}" y="{ly}" class="gw-label">{xml_esc(label_text)}</text>')
        res.append('  </g>')
        return "\n".join(res)

    # BPMN Start Event (Enlarged r=30)
    def draw_start_event(cx, cy, label):
        r = 30
        res = []
        res.append(f'  <g id="Start_at_{int(cx)}_{int(cy)}">')
        res.append(f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#FFFFFF" stroke="#15803D" stroke-width="3.0"/>')
        # Envelope icon
        res.append(f'    <rect x="{cx-13}" y="{cy-9}" width="26" height="18" fill="none" stroke="#15803D" stroke-width="2.0" rx="2"/>')
        res.append(f'    <polyline points="{cx-13},{cy-9} {cx},{cy} {cx+13},{cy-9}" fill="none" stroke="#15803D" stroke-width="2.0"/>')
        res.append(f'    <text x="{cx}" y="{cy+52}" font-size="18.5px" font-weight="900" fill="#000000" text-anchor="middle">{xml_esc(label)}</text>')
        res.append('  </g>')
        return "\n".join(res)

    # BPMN End Event (Enlarged r=30)
    def draw_end_event(cx, cy, label, end_type="none"):
        r = 30
        res = []
        stroke_col = "#DC2626" if end_type == "terminate" else "#000000"
        res.append(f'  <g id="End_at_{int(cx)}_{int(cy)}">')
        res.append(f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#FFFFFF" stroke="{stroke_col}" stroke-width="4.8"/>')
        if end_type == "terminate":
            res.append(f'    <circle cx="{cx}" cy="{cy}" r="14" fill="#DC2626"/>')
        elif end_type == "message":
            res.append(f'    <rect x="{cx-13}" y="{cy-9}" width="26" height="18" fill="#000000" rx="2"/>')
            res.append(f'    <polyline points="{cx-13},{cy-9} {cx},{cy} {cx+13},{cy-9}" fill="none" stroke="#FFFFFF" stroke-width="2.0"/>')
        res.append(f'    <text x="{cx}" y="{cy+52}" font-size="18px" font-weight="900" fill="{stroke_col}" text-anchor="middle">{xml_esc(label)}</text>')
        res.append('  </g>')
        return "\n".join(res)

    # BPMN Boundary Timer Event (Enlarged r=24)
    def draw_boundary_timer(cx, cy, label=None, label_pos="bottom"):
        r = 24
        res = []
        res.append(f'  <g id="BoundaryTimer_at_{int(cx)}_{int(cy)}">')
        res.append(f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#FFFFFF" stroke="#DC2626" stroke-width="2.2"/>')
        res.append(f'    <circle cx="{cx}" cy="{cy}" r="{r-4.5}" fill="none" stroke="#DC2626" stroke-width="1.8"/>')
        res.append(f'    <line x1="{cx}" y1="{cy}" x2="{cx}" y2="{cy-10}" stroke="#DC2626" stroke-width="2.2" stroke-linecap="round"/>')
        res.append(f'    <line x1="{cx}" y1="{cy}" x2="{cx+8}" y2="{cy+4}" stroke="#DC2626" stroke-width="2.2" stroke-linecap="round"/>')
        if label:
            ly = cy + 42 if label_pos == "bottom" else cy - 32
            res.append(f'    <text x="{cx}" y="{ly}" font-size="16px" font-weight="900" font-family="ui-monospace, monospace" fill="#DC2626" text-anchor="middle">{xml_esc(label)}</text>')
        res.append('  </g>')
        return "\n".join(res)

    # BPMN Intermediate Catch Message Event (Enlarged r=26)
    def draw_intermediate_message(cx, cy, label=None):
        r = 26
        res = []
        res.append(f'  <g id="IntermediateMsg_at_{int(cx)}_{int(cy)}">')
        res.append(f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#FFFFFF" stroke="#000000" stroke-width="2.2"/>')
        res.append(f'    <circle cx="{cx}" cy="{cy}" r="{r-4.5}" fill="none" stroke="#000000" stroke-width="1.8"/>')
        res.append(f'    <rect x="{cx-11}" y="{cy-8}" width="22" height="16" fill="none" stroke="#000000" stroke-width="1.8" rx="1.5"/>')
        res.append(f'    <polyline points="{cx-11},{cy-8} {cx},{cy} {cx+11},{cy-8}" fill="none" stroke="#000000" stroke-width="1.8"/>')
        if label:
            res.append(f'    <text x="{cx}" y="{cy+50}" font-size="18px" font-weight="900" fill="#000000" text-anchor="middle">{xml_esc(label)}</text>')
        res.append('  </g>')
        return "\n".join(res)

    # BPMN Data Object (Enlarged 330x95)
    def draw_data_object(x, y, w, h, title, doc_code=None):
        fold = 18
        pts = f"{x},{y} {x+w-fold},{y} {x+w},{y+fold} {x+w},{y+h} {x},{y+h}"
        res = []
        res.append(f'  <g id="DataObject_{title[:10].replace(" ", "_")}">')
        res.append(f'    <polygon points="{pts}" fill="#FAFAFA" stroke="#4B5563" stroke-width="2.2"/>')
        res.append(f'    <polygon points="{x+w-fold},{y} {x+w-fold},{y+fold} {x+w},{y+fold}" fill="#E5E7EB" stroke="#4B5563" stroke-width="1.8"/>')
        res.append(f'    <text x="{x + w/2}" y="{y + 42}" font-size="20.5px" font-weight="800" fill="#000000" text-anchor="middle">{xml_esc(title)}</text>')
        if doc_code:
            res.append(f'    <text x="{x + w/2}" y="{y + 72}" font-size="16px" font-family="ui-monospace, monospace" font-weight="700" fill="#4B5563" text-anchor="middle">{xml_esc(doc_code)}</text>')
        res.append('  </g>')
        return "\n".join(res)

    # BPMN Data Store (Enlarged 330x95)
    def draw_data_store(x, y, w, h, title, store_code=None):
        res = []
        ry = 16
        res.append(f'  <g id="DataStore_{title[:10].replace(" ", "_")}">')
        res.append(f'    <path d="M {x} {y+ry} V {y+h-ry} A {w/2} {ry} 0 0 0 {x+w} {y+h-ry} V {y+ry}" fill="#FAFAFA" stroke="#4B5563" stroke-width="2.2"/>')
        res.append(f'    <ellipse cx="{x+w/2}" cy="{y+ry}" rx="{w/2}" ry="{ry}" fill="#F4F4F5" stroke="#4B5563" stroke-width="2.2"/>')
        res.append(f'    <text x="{x + w/2}" y="{y + 50}" font-size="20.5px" font-weight="800" fill="#000000" text-anchor="middle">{xml_esc(title)}</text>')
        if store_code:
            res.append(f'    <text x="{x + w/2}" y="{y + 78}" font-size="16px" font-family="ui-monospace, monospace" font-weight="700" fill="#4B5563" text-anchor="middle">{xml_esc(store_code)}</text>')
        res.append('  </g>')
        return "\n".join(res)

    # BPMN Text Annotation Bracket '['
    def draw_annotation(x, y, w, h, text_lines, target_x, target_y):
        res = []
        res.append(f'  <g id="Annotation_{text_lines[0][:8].replace(" ", "_")}">')
        res.append(f'    <path d="M {x+18} {y} H {x} V {y+h} H {x+18}" fill="none" stroke="#4B5563" stroke-width="2.4"/>')
        curr_y = y + 28
        for tl in text_lines:
            res.append(f'    <text x="{x+22}" y="{curr_y}" font-size="17px" font-family="ui-monospace, monospace" font-weight="800" fill="#1F2937">{xml_esc(tl)}</text>')
            curr_y += 24
        res.append(f'    <line x1="{x}" y1="{y+h/2}" x2="{target_x}" y2="{target_y}" stroke="#4B5563" stroke-width="1.6" stroke-dasharray="5 3"/>')
        res.append('  </g>')
        return "\n".join(res)

    # =========================================================================
    # POOL & SWIMLANES GEOMETRY
    # =========================================================================
    pool_x = 50
    pool_y = 160
    pool_w = 3500
    pool_h = 2160
    lane_h = 540

    lanes_data = [
        ("LÀN 1: KHÁCH HÀNG / MERCHANT", "KÊNH NGƯỜI DÙNG & TÁC NHÂN KHỞI TẠO (CUSTOMER TOUCHPOINTS)"),
        ("LÀN 2: TIẾP NHẬN & AI CHATBOT", "CỔNG THÔNG TIN TỰ ĐỘNG & XỬ LÝ NGÔN NGỮ TỰ NHIÊN (AI INGESTION)"),
        ("LÀN 3: XỬ LÝ TỰ ĐỘNG & DMN LÕI", "ĐỘNG CƠ QUY TẮC NGHIỆP VỤ & QUYẾT TOÁN CỐT LÕI (CORE & DMN ENGINE)"),
        ("LÀN 4: HẬU KIỂM & TRỌNG TÀI", "GIÁM ĐỊNH VẬN HÀNH & GIẢI QUYẾT TRANH CHẤP HITL (HUMAN AUDIT & ARBITRATION)")
    ]

    lines.append('  <!-- ==================== POOL & SWIMLANES ==================== -->')
    lines.append('  <g id="BPMN_Pool">')
    lines.append(f'    <rect x="{pool_x}" y="{pool_y}" width="{pool_w}" height="{pool_h}" class="pool-border"/>')
    
    # Outer Organization Pool Header (Leftmost Bar)
    lines.append(f'    <rect x="{pool_x}" y="{pool_y}" width="70" height="{pool_h}" class="pool-hdr"/>')
    lines.append(f'    <text x="{pool_x+39}" y="{pool_y + pool_h//2}" transform="rotate(-90, {pool_x+39}, {pool_y + pool_h//2})" text-anchor="middle" font-size="24px" font-weight="900" fill="#FFFFFF" letter-spacing="3.0px">NEXUS LOGISTICS SYSTEM • COLLABORATION POOL</text>')

    # Individual Swimlanes
    for i, (ltitle, lsub) in enumerate(lanes_data):
        ly = pool_y + i * lane_h
        cy = ly + lane_h // 2
        # Lane Header Bar
        lines.append(f'    <rect x="{pool_x+70}" y="{ly}" width="95" height="{lane_h}" class="lane-hdr"/>')
        lines.append(f'    <text x="{pool_x+122}" y="{cy}" transform="rotate(-90, {pool_x+122}, {cy})" text-anchor="middle" font-size="22px" font-weight="900" fill="#000000" letter-spacing="1.0px">{xml_esc(ltitle)}</text>')
        # Lane divider line
        if i > 0:
            lines.append(f'    <line x1="{pool_x+70}" y1="{ly}" x2="{pool_x+pool_w}" y2="{ly}" class="lane-divider"/>')

    lines.append('  </g>')

    # =========================================================================
    # LANE 1: KHÁCH HÀNG / MERCHANT (Y = 160 .. 700, Mid Y = 430)
    # =========================================================================
    lines.append('  <!-- ==================== LANE 1: CUSTOMER ==================== -->')
    lines.append('  <g id="Lane_1_Customer">')

    # Data Object 1: [DATA-01] BBBT & Ảnh POD
    lines.append(draw_data_object(420, 195, 330, 95, "Biên bản bất thường (BBBT)", "[DATA-01] Ảnh kiện hàng & POD"))
    # Dotted Association down to Task 1.1
    lines.append(f'    <line x1="585" y1="290" x2="585" y2="335" class="assoc-line"/>')
    lines.append(draw_assoc_arrow(585, 335, "down"))

    # Start Event 1 (Message Start ✉️)
    lines.append(draw_start_event(320, 407, "Sự cố hàng hóa"))
    # Flow Start -> Task 1.1
    lines.append(f'    <line x1="350" y1="407" x2="420" y2="407" class="flow-line"/>')
    lines.append(draw_arrow(420, 407, "right"))

    # User Task 1.1: Gửi khiếu nại (330x145, font 21.5px)
    lines.append(draw_activity(420, 335, 330, 145, ["Gửi yêu cầu khiếu nại", "& Upload chứng từ hư hại"], task_type="user", task_code="TASK-1.1"))

    # Send Task 1.2: Yêu cầu bổ sung tài liệu
    lines.append(draw_activity(1260, 335, 330, 145, ["Yêu cầu bổ sung tài liệu", "& Hình ảnh xác thực BBBT"], task_type="send", task_code="TASK-1.2"))

    # Boundary Timer Event ⏱️ on Task 1.2 bottom edge
    lines.append(draw_boundary_timer(1480, 480, "SLA: 24h", label_pos="bottom"))
    # Flow from Timer -> End Terminate Event 1
    lines.append(f'    <line x1="1480" y1="504" x2="1480" y2="570" class="flow-line"/>')
    lines.append(f'    <line x1="1480" y1="570" x2="1590" y2="570" class="flow-line"/>')
    lines.append(draw_arrow(1590, 570, "right"))
    # End Terminate Event 1
    lines.append(draw_end_event(1620, 570, "Hủy do quá hạn 24h", end_type="terminate"))

    # Intermediate Message Catch Event 1 (Nhận ảnh BBBT bổ sung)
    lines.append(draw_intermediate_message(1740, 407, "Cập nhật BBBT"))
    # Flow Task 1.2 -> Catch Event
    lines.append(f'    <line x1="1590" y1="407" x2="1714" y2="407" class="flow-line"/>')
    lines.append(draw_arrow(1714, 407, "right"))

    lines.append('  </g>')

    # =========================================================================
    # LANE 2: TIẾP NHẬN & AI CHATBOT (Y = 700 .. 1240, Mid Y = 970)
    # =========================================================================
    lines.append('  <!-- ==================== LANE 2: INGESTION & AI ==================== -->')
    lines.append('  <g id="Lane_2_AI_Chatbot">')

    # Service Task 2.1: Tiếp nhận & Phân tích OCR
    lines.append(draw_activity(720, 895, 330, 145, ["Trích xuất OCR tài liệu", "& Phân loại sự cố sơ bộ"], task_type="service", task_code="TASK-2.1"))

    # Flow from Lane 1 User Task 1.1 -> Service Task 2.1 (Orthogonal 90°)
    lines.append(f'    <line x1="750" y1="407" x2="780" y2="407" class="flow-line"/>')
    lines.append(f'    <line x1="780" y1="407" x2="780" y2="895" class="flow-line"/>')
    lines.append(draw_arrow(780, 895, "down"))

    # Flow from Lane 1 Catch Event -> Service Task 2.1 (Loop back)
    lines.append(f'    <line x1="1766" y1="407" x2="1830" y2="407" class="flow-line"/>')
    lines.append(f'    <line x1="1830" y1="407" x2="1830" y2="830" class="flow-line"/>')
    lines.append(f'    <line x1="1830" y1="830" x2="910" y2="830" class="flow-line"/>')
    lines.append(f'    <line x1="910" y1="830" x2="910" y2="895" class="flow-line"/>')
    lines.append(draw_arrow(910, 895, "down"))

    # Data Store 1: CSDL Vận đơn & POD
    lines.append(draw_data_store(720, 1085, 330, 95, "CSDL Vận đơn & POD", "[DS-01] PostgreSQL / Redis"))
    # Dotted Association Store -> Task 2.1
    lines.append(f'    <line x1="885" y1="1085" x2="885" y2="1040" class="assoc-line"/>')
    lines.append(draw_assoc_arrow(885, 1040, "up"))

    # Exclusive Gateway 1 (XOR): Hồ sơ hợp lệ?
    lines.append(draw_gateway(1210, 967, gw_type="xor", label_text="Hồ sơ hợp lệ?", label_pos="top"))
    # Flow Task 2.1 -> GW1
    lines.append(f'    <line x1="1050" y1="967" x2="1166" y2="967" class="flow-line"/>')
    lines.append(draw_arrow(1166, 967, "right"))

    # GW1 Branch [Thiếu chứng từ] -> Lane 1 Send Task 1.2
    lines.append(f'    <line x1="1210" y1="923" x2="1210" y2="520" class="flow-line"/>')
    lines.append(f'    <line x1="1210" y1="520" x2="1380" y2="520" class="flow-line"/>')
    lines.append(f'    <line x1="1380" y1="520" x2="1380" y2="480" class="flow-line"/>')
    lines.append(draw_arrow(1380, 480, "up"))
    lines.append(draw_cond_plate(1210, 725, "[Thiếu chứng từ / Ảnh mờ]", w=270, h=40, status="alert"))

    lines.append('  </g>')

    # =========================================================================
    # LANE 3: XỬ LÝ TỰ ĐỘNG & DMN LÕI (Y = 1240 .. 1780, Mid Y = 1510)
    # =========================================================================
    lines.append('  <!-- ==================== LANE 3: CORE ENGINE & DMN ==================== -->')
    lines.append('  <g id="Lane_3_Core_Engine">')

    # GW1 Branch [Đầy đủ & Hợp lệ] -> Service Task 3.1 (Lane 3)
    lines.append(f'    <line x1="1210" y1="1011" x2="1210" y2="1470" class="flow-line"/>')
    lines.append(f'    <line x1="1210" y1="1470" x2="1300" y2="1470" class="flow-line"/>')
    lines.append(draw_arrow(1300, 1470, "right"))
    lines.append(draw_cond_plate(1210, 1245, "[Đầy đủ & Hợp lệ]", w=210, h=40, status="success"))

    # Service Task 3.1: Đối soát chéo dữ liệu & Tính tổn thất
    lines.append(draw_activity(1300, 1395, 330, 145, ["Đối soát dữ liệu vận đơn", "& Tính toán mức tổn thất"], task_type="service", task_code="TASK-3.1"))

    # Data Store 2: Kho Quy chế SOP (Milvus)
    lines.append(draw_data_store(1300, 1585, 330, 95, "Kho Quy chế Bưu chính", "[DS-02] Milvus SOP Vector DB"))
    # Dotted Association Store 2 -> Task 3.1
    lines.append(f'    <line x1="1465" y1="1585" x2="1465" y2="1540" class="assoc-line"/>')
    lines.append(draw_assoc_arrow(1465, 1540, "up"))

    # Business Rule Task 3.2: Đánh giá Ma trận Quyết định DMN
    lines.append(draw_activity(1710, 1395, 330, 145, ["Đánh giá Ma trận Quyết định", "(DMN Business Rule Engine)"], task_type="business_rule", task_code="RULE-3.2"))
    # Flow Task 3.1 -> Rule Task
    lines.append(f'    <line x1="1630" y1="1470" x2="1710" y2="1470" class="flow-line"/>')
    lines.append(draw_arrow(1710, 1470, "right"))

    # Text Annotation for DMN Rules
    lines.append(draw_annotation(1710, 1285, 330, 56, ["Quy chế bồi thường:", "Điều 14 Quyết định 28/Nexus"], 1875, 1395))

    # Exclusive Gateway 2 (XOR): Duyệt nhanh?
    lines.append(draw_gateway(2090, 1470, gw_type="xor", label_text="Duyệt nhanh?", label_pos="top"))
    # Flow Rule Task -> GW2
    lines.append(f'    <line x1="2040" y1="1470" x2="2046" y2="1470" class="flow-line"/>')
    lines.append(draw_arrow(2046, 1470, "right"))

    # ---------------- FAST-TRACK AUTO PAYMENT (Lane 3) ----------------
    # Parallel Gateway 1 Fork (AND +)
    lines.append(draw_gateway(2440, 1470, gw_type="parallel", label_text="Tách luồng", label_pos="bottom"))
    # Flow GW2 -> Fork (Fast-track)
    lines.append(f'    <line x1="2134" y1="1470" x2="2396" y2="1470" class="flow-line"/>')
    lines.append(draw_arrow(2396, 1470, "right"))
    lines.append(draw_cond_plate(2265, 1470, "[Duyệt tự động: ≤ 500k]", w=210, h=38, status="success"))

    # Parallel Branch 1: Service Task 3.3A (Giải ngân Napas/VietQR)
    lines.append(draw_activity(2560, 1305, 310, 140, ["Tự động giải ngân", "qua VietQR / Napas 247"], task_type="service", task_code="TASK-3.3A"))
    # Flow Fork -> Service Task
    lines.append(f'    <line x1="2440" y1="1426" x2="2440" y2="1375" class="flow-line"/>')
    lines.append(f'    <line x1="2440" y1="1375" x2="2560" y2="1375" class="flow-line"/>')
    lines.append(draw_arrow(2560, 1375, "right"))

    # Text Annotation for Payment Gateway
    lines.append(draw_annotation(2560, 1228, 310, 48, ["Cổng Napas 247: SLA < 3 phút"], 2715, 1305))

    # Parallel Branch 2: Send Task 3.3B (Gửi hóa đơn & Thông báo)
    lines.append(draw_activity(2560, 1495, 310, 140, ["Gửi thông báo & Hóa đơn", "đền bù qua Email / SMS"], task_type="send", task_code="TASK-3.3B"))
    # Flow Fork -> Send Task
    lines.append(f'    <line x1="2440" y1="1514" x2="2440" y2="1565" class="flow-line"/>')
    lines.append(f'    <line x1="2440" y1="1565" x2="2560" y2="1565" class="flow-line"/>')
    lines.append(draw_arrow(2560, 1565, "right"))

    # Parallel Gateway 2 Join (AND +) - Clean standard BPMN join
    lines.append(draw_gateway(2950, 1470, gw_type="parallel", label_text=None))
    # Flow Service Task -> Join
    lines.append(f'    <line x1="2870" y1="1375" x2="2950" y2="1375" class="flow-line"/>')
    lines.append(f'    <line x1="2950" y1="1375" x2="2950" y2="1426" class="flow-line"/>')
    lines.append(draw_arrow(2950, 1426, "down"))
    # Flow Send Task -> Join
    lines.append(f'    <line x1="2870" y1="1565" x2="2950" y2="1565" class="flow-line"/>')
    lines.append(f'    <line x1="2950" y1="1565" x2="2950" y2="1514" class="flow-line"/>')
    lines.append(draw_arrow(2950, 1514, "up"))

    # End Message Event 2: Hoàn tất bồi thường tự động
    lines.append(draw_end_event(3120, 1470, "Hoàn tất bồi thường tự động", end_type="message"))
    # Flow Join -> End Event
    lines.append(f'    <line x1="2994" y1="1470" x2="3090" y2="1470" class="flow-line"/>')
    lines.append(draw_arrow(3090, 1470, "right"))

    lines.append('  </g>')

    # =========================================================================
    # LANE 4: HẬU KIỂM & TRỌNG TÀI HITL (Y = 1780 .. 2320, Mid Y = 2050)
    # =========================================================================
    lines.append('  <!-- ==================== LANE 4: HITL ARBITRATION ==================== -->')
    lines.append('  <g id="Lane_4_HITL_Audit">')

    # Flow from GW2 (Lane 3) -> User Task 4.1 (Lane 4)
    lines.append(f'    <line x1="2090" y1="1514" x2="2090" y2="2010" class="flow-line"/>')
    lines.append(f'    <line x1="2090" y1="2010" x2="2150" y2="2010" class="flow-line"/>')
    lines.append(draw_arrow(2150, 2010, "right"))
    lines.append(draw_cond_plate(2090, 1750, "[Nghi vấn hoặc Giá trị > 500k]", w=280, h=40, status="alert"))

    # User Task 4.1: Phân công thẩm định viên & Khởi tạo Dossier
    lines.append(draw_activity(2150, 1940, 290, 145, ["Phân công thẩm định", "& Mở Dossier hồ sơ"], task_type="user", task_code="TASK-4.1"))

    # Data Object 2: Dossier Hồ sơ Thẩm tra
    lines.append(draw_data_object(2150, 2150, 290, 85, "Dossier Hồ sơ Thẩm tra", "[DATA-02] Báo cáo chi tiết vụ việc"))
    # Dotted Association Task 4.1 -> Data Object 2
    lines.append(f'    <line x1="2295" y1="2085" x2="2295" y2="2150" class="assoc-line"/>')
    lines.append(draw_assoc_arrow(2295, 2150, "down"))

    # Manual Task 4.2: Giám định băng chuyền kho & Đối soát bưu tá
    lines.append(draw_activity(2490, 1940, 290, 145, ["Giám định băng chuyền", "& Đối soát bưu tá"], task_type="manual", task_code="TASK-4.2"))
    # Flow Task 4.1 -> Task 4.2
    lines.append(f'    <line x1="2440" y1="2010" x2="2490" y2="2010" class="flow-line"/>')
    lines.append(draw_arrow(2490, 2010, "right"))

    # User Task 4.3: Hội đồng Trọng tài đánh giá & Phán quyết
    lines.append(draw_activity(2830, 1940, 290, 145, ["Hội đồng Trọng tài", "thẩm tra & phán quyết"], task_type="user", task_code="TASK-4.3"))
    # Flow Task 4.2 -> Task 4.3
    lines.append(f'    <line x1="2780" y1="2010" x2="2830" y2="2010" class="flow-line"/>')
    lines.append(draw_arrow(2830, 2010, "right"))

    # Exclusive Gateway 3 (XOR): Phán quyết?
    lines.append(draw_gateway(3210, 2010, gw_type="xor", label_text="Phán quyết?", label_pos="top"))
    # Flow Task 4.3 -> GW3
    lines.append(f'    <line x1="3120" y1="2010" x2="3166" y2="2010" class="flow-line"/>')
    lines.append(draw_arrow(3166, 2010, "right"))

    # GW3 Branch 1: [Chấp thuận] -> Flow goes straight RIGHT to End Event 3
    lines.append(f'    <line x1="3254" y1="2010" x2="3380" y2="2010" class="flow-line"/>')
    lines.append(draw_arrow(3380, 2010, "right"))
    lines.append(draw_cond_plate(3317, 2010, "[Chấp thuận]", w=100, h=30, status="success"))

    # End Event 3 (None End): Hoàn tất qua Trọng tài
    lines.append(draw_end_event(3410, 2010, "Hoàn tất trọng tài", end_type="none"))

    # GW3 Branch 2: [Từ chối / Gian lận] -> Flow goes DOWN then RIGHT to End Event 4
    lines.append(f'    <line x1="3210" y1="2054" x2="3210" y2="2170" class="flow-line"/>')
    lines.append(f'    <line x1="3210" y1="2170" x2="3380" y2="2170" class="flow-line"/>')
    lines.append(draw_arrow(3380, 2170, "right"))
    lines.append(draw_cond_plate(3210, 2112, "[Bác bỏ / Gian lận]", w=160, h=34, status="alert"))

    # End Terminate Event 4: Từ chối bồi thường & Đóng hồ sơ
    lines.append(draw_end_event(3410, 2170, "Bác bỏ hồ sơ", end_type="terminate"))

    lines.append('  </g>')

    # =========================================================================
    # BOTTOM WATERMARK & SYSTEM SIGNATURE
    # =========================================================================
    lines.append('  <!-- ==================== SIGNATURE ==================== -->')
    lines.append('  <g id="Blueprint_Signature">')
    lines.append(f'    <text x="50" y="2352" font-size="15" font-weight="700" fill="#4B5563">HỆ THỐNG QUẢN LÝ BƯU CHÍNH &amp; AI CHATBOT VẬN HÀNH • KHÓA LUẬN TỐT NGHIỆP KỸ SƯ CÔNG NGHỆ THÔNG TIN</text>')
    lines.append(f'    <text x="{width-50}" y="2352" font-size="15" font-family="ui-monospace, monospace" font-weight="800" fill="#000000" text-anchor="end">FIGMA PAGE 2 • SECTION 2.1: BPMN 2.0 WORKFLOW • MONOCHROME BLUEPRINT</text>')
    lines.append('  </g>')

    lines.append('</svg>')
    return "\n".join(lines)

if __name__ == "__main__":
    out_dir = "/Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "01-bpmn-incident-claim-resolution.svg")

    svg_content = generate_svg()

    # Validate Strict XML
    try:
        ET.fromstring(svg_content)
        print("✓ Strict XML validation passed.")
    except ET.ParseError as e:
        print(f"✗ XML Parse Error: {e}")
        raise

    target_files = [
        out_file,
        "/Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/diagrams/bpmn/01-bpmn-incident-claim-resolution.svg"
    ]

    for f_path in target_files:
        os.makedirs(os.path.dirname(f_path), exist_ok=True)
        with open(f_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"Generated successfully: {f_path} ({len(svg_content)} bytes)")
