#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generator for Nexus AI Chatbot Subsystem Use Case Diagram.
Clean Monochrome Technical Blueprint Style.
Complies with OMG UML 2.5 / IEEE 830 / ISO/IEC 25010 Standards.
Designed for Graduation Thesis (Đồ án tốt nghiệp) and Vector Editing in Figma.
"""

import os
import math

def generate_svg():
    width = 2600
    height = 1560

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">')
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      .bg { fill: #FFFFFF; }')
    lines.append('      .frame { fill: none; stroke: #000000; stroke-width: 2.2; }')
    lines.append('      .frame-inner { fill: none; stroke: #666666; stroke-width: 0.8; stroke-dasharray: 6 3; }')
    lines.append('      .sys-border { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; }')
    lines.append('      .sys-header { fill: #F0F4F8; stroke: #000000; stroke-width: 1.6; }')
    lines.append('      .t-sys { font-family: "Segoe UI", Arial, sans-serif; font-size: 16.5px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }')
    lines.append('      .pkg-body { fill: #FAFAFA; stroke: #000000; stroke-width: 1.6; }')
    lines.append('      .pkg-tab { fill: #E2E8F0; stroke: #000000; stroke-width: 1.6; }')
    lines.append('      .t-pkg { font-family: "Segoe UI", Arial, sans-serif; font-size: 15.5px; font-weight: bold; fill: #000000; }')
    lines.append('      ')
    lines.append('      .t-actor-name { font-family: "Segoe UI", Arial, sans-serif; font-size: 19px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-actor-sub { font-family: "Segoe UI", Arial, sans-serif; font-size: 14px; font-weight: 500; fill: #374151; text-anchor: middle; }')
    lines.append('      .t-actor-app { font-family: "Courier New", monospace; font-size: 13.5px; font-weight: bold; fill: #111827; text-anchor: middle; }')
    lines.append('      ')
    lines.append('      .uc-core { fill: #FFFFFF; stroke: #000000; stroke-width: 2.0; }')
    lines.append('      .uc { fill: #FFFFFF; stroke: #000000; stroke-width: 1.6; }')
    lines.append('      .uc-abstract { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; stroke-dasharray: 6 3; }')
    lines.append('      .uc-ext { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; stroke-dasharray: 5 3; }')
    lines.append('      ')
    lines.append('      .t-ucid { font-family: "Courier New", monospace; font-size: 15px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-uc-title { font-family: "Segoe UI", Arial, sans-serif; font-size: 14.5px; font-weight: 600; fill: #111111; text-anchor: middle; }')
    lines.append('      .t-uc-abs { font-family: "Segoe UI", Arial, sans-serif; font-size: 15px; font-weight: bold; font-style: italic; fill: #111111; text-anchor: middle; }')
    lines.append('      .t-rel-abs { font-family: "Segoe UI", Arial, sans-serif; font-size: 13px; font-style: italic; font-weight: bold; fill: #4B5563; text-anchor: middle; }')
    lines.append('      ')
    lines.append('      .assoc { stroke: #000000; stroke-width: 1.4; fill: none; }')
    lines.append('      .gen-line { stroke: #000000; stroke-width: 1.8; fill: none; }')
    lines.append('      .gen-arrow { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; }')
    lines.append('      .dep-line { stroke: #000000; stroke-width: 1.5; stroke-dasharray: 5 3; fill: none; }')
    lines.append('      .dep-arrow { fill: #000000; stroke: #000000; stroke-width: 0.5; }')
    lines.append('      .pill-plate { fill: #FFFFFF; stroke: #000000; stroke-width: 1.2; rx: 4px; }')
    lines.append('      .t-pill { font-family: "Courier New", monospace; font-size: 12.5px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('    ]]></style>')
    lines.append('  </defs>')
    lines.append('')
    lines.append('  <!-- CANVAS BACKGROUND & BORDER -->')
    lines.append(f'  <rect width="{width}" height="{height}" class="bg"/>')
    lines.append(f'  <rect x="16" y="16" width="{width-32}" height="{height-32}" class="frame"/>')
    lines.append(f'  <rect x="22" y="22" width="{width-44}" height="{height-44}" class="frame-inner"/>')
    lines.append('')

    # HEADER BLOCK
    lines.append('  <!-- ==================== HEADER ==================== -->')
    lines.append('  <g id="Header">')
    lines.append(f'    <rect x="30" y="28" width="{width-60}" height="80" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>')
    lines.append('    <text x="50" y="63" font-family="Segoe UI, Arial" font-size="25" font-weight="bold" fill="#000000" letter-spacing="0.3px">SƠ ĐỒ USE CASE PHÂN HỆ TRỢ LÝ AI LOGISTICS (AI CHATBOT &amp; TOOL CALLING ENGINE)</text>')
    lines.append('    <text x="50" y="90" font-family="Segoe UI, Arial" font-size="15.5" fill="#4B5563">Kiến Trúc RAG Đa Tầng • 5 Dynamic Tools Nghiệp Vụ • Chuyển Mạch Mô Hình Kép Gemini &amp; Groq • Chuẩn OMG UML 2.5</text>')
    lines.append(f'    <rect x="{width-430}" y="34" width="380" height="68" fill="#F9FAFB" stroke="#000000" stroke-width="1.3"/>')
    lines.append(f'    <text x="{width-415}" y="56" font-family="Segoe UI, Arial" font-size="14" font-weight="bold" fill="#000000">MÃ BẢN VẼ: UC-SUB-AI-01</text>')
    lines.append(f'    <text x="{width-415}" y="75" font-family="Courier New, monospace" font-size="13" font-weight="bold" fill="#1F2937">PHÂN HỆ AI • UML 2.5</text>')
    lines.append(f'    <text x="{width-415}" y="93" font-family="Segoe UI, Arial" font-size="12" fill="#6B7280">100% NATIVE VECTOR • 300 DPI READY</text>')
    lines.append('  </g>')
    lines.append('')

    # SYSTEM BOUNDARY
    sb_x = 260
    sb_y = 118
    sb_w = 1980
    sb_h = 1335
    lines.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    lines.append('  <g id="System_Boundary">')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="980" height="36" class="sys-header"/>')
    lines.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«subsystem» PHÂN HỆ TRỢ LÝ AI LOGISTICS RAG &amp; TOOL CALLING (ai-assistant-service)</text>')
    lines.append('  </g>')
    lines.append('')

    # HELPER FUNCTIONS
    def xml_esc(text):
        s = str(text)
        s = s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

    def uc(cx, cy, rx, ry, ucid, title, uctype="uc"):
        res = []
        res.append(f'    <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" class="{uctype}"/>')
        safe_title = xml_esc(title)
        if uctype == "uc-abstract":
            res.append(f'    <text x="{cx}" y="{cy-14}" class="t-rel-abs">«abstract»</text>')
            res.append(f'    <text x="{cx}" y="{cy+3}" class="t-ucid">{ucid}</text>')
            res.append(f'    <text x="{cx}" y="{cy+21}" class="t-uc-abs">{safe_title}</text>')
        else:
            res.append(f'    <text x="{cx}" y="{cy-8}" class="t-ucid">{ucid}</text>')
            res.append(f'    <text x="{cx}" y="{cy+14}" class="t-uc-title">{safe_title}</text>')
        return "\n".join(res)

    def ellipse_point(cx, cy, rx, ry, from_x, from_y):
        dx = from_x - cx
        dy = from_y - cy
        if dx == 0 and dy == 0:
            return cx, cy
        angle = math.atan2(dy, dx)
        return cx + rx * math.cos(angle), cy + ry * math.sin(angle)

    def direct_assoc(x1, y1, cx, cy, rx, ry):
        x2, y2 = ellipse_point(cx, cy, rx, ry, x1, y1)
        return f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" class="assoc"/>'

    def direct_dep_arrow(cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2, label="«include»", label_offset=14):
        x1, y1 = ellipse_point(cx1, cy1, rx1, ry1, cx2, cy2)
        x2, y2 = ellipse_point(cx2, cy2, rx2, ry2, cx1, cy1)
        dx = x2 - x1
        dy = y2 - y1
        dist = math.hypot(dx, dy)
        if dist == 0:
            return ""
        ux = dx / dist
        uy = dy / dist
        tip_x = x2
        tip_y = y2
        base_x = tip_x - ux * 12
        base_y = tip_y - uy * 12
        p1_x = base_x - uy * 5.5
        p1_y = base_y + ux * 5.5
        p2_x = base_x + uy * 5.5
        p2_y = base_y - ux * 5.5

        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        lbl_x = mid_x - uy * label_offset
        lbl_y = mid_y + ux * label_offset

        clean_label = label.replace('<<', '«').replace('>>', '»')

        res = []
        res.append(f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{base_x:.1f}" y2="{base_y:.1f}" class="dep-line"/>')
        res.append(f'    <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" class="dep-arrow"/>')
        if clean_label:
            pill_w = len(clean_label) * 7.5 + 14
            pill_h = 20
            res.append(f'    <rect x="{lbl_x - pill_w/2:.1f}" y="{lbl_y - pill_h/2:.1f}" width="{pill_w:.1f}" height="{pill_h}" class="pill-plate"/>')
            res.append(f'    <text x="{lbl_x:.1f}" y="{lbl_y+4.5:.1f}" class="t-pill">{clean_label}</text>')
        return "\n".join(res)

    def manhattan_dep_arrow(points, label="«include»", lbl_x=None, lbl_y=None):
        res = []
        clean_label = label.replace('<<', '«').replace('>>', '»')
        
        p_penult = points[-2]
        p_last = points[-1]
        dx = p_last[0] - p_penult[0]
        dy = p_last[1] - p_penult[1]
        dist = math.hypot(dx, dy)
        ux = dx / dist if dist != 0 else 0
        uy = dy / dist if dist != 0 else 1
        
        tip_x = p_last[0]
        tip_y = p_last[1]
        base_x = tip_x - ux * 12
        base_y = tip_y - uy * 12
        p1_x = base_x - uy * 5.5
        p1_y = base_y + ux * 5.5
        p2_x = base_x + uy * 5.5
        p2_y = base_y - ux * 5.5

        all_pts = list(points[:-1]) + [(base_x, base_y)]
        all_pts_str = " ".join([f"{px:.1f},{py:.1f}" for px, py in all_pts])
        res.append(f'    <polyline points="{all_pts_str}" class="dep-line"/>')
        res.append(f'    <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" class="dep-arrow"/>')

        if clean_label and lbl_x is not None and lbl_y is not None:
            pill_w = len(clean_label) * 7.5 + 14
            pill_h = 20
            res.append(f'    <rect x="{lbl_x - pill_w/2:.1f}" y="{lbl_y - pill_h/2:.1f}" width="{pill_w:.1f}" height="{pill_h}" class="pill-plate"/>')
            res.append(f'    <text x="{lbl_x:.1f}" y="{lbl_y+4.5:.1f}" class="t-pill">{clean_label}</text>')
        return "\n".join(res)

    def direct_gen_arrow(cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2):
        x1, y1 = ellipse_point(cx1, cy1, rx1, ry1, cx2, cy2)
        x2, y2 = ellipse_point(cx2, cy2, rx2, ry2, cx1, cy1)
        dx = x2 - x1
        dy = y2 - y1
        dist = math.hypot(dx, dy)
        if dist == 0:
            return ""
        ux = dx / dist
        uy = dy / dist
        tip_x = x2
        tip_y = y2
        base_x = tip_x - ux * 14
        base_y = tip_y - uy * 14
        p1_x = base_x - uy * 7
        p1_y = base_y + ux * 7
        p2_x = base_x + uy * 7
        p2_y = base_y - ux * 7

        res = []
        res.append(f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{base_x:.1f}" y2="{base_y:.1f}" class="gen-line"/>')
        res.append(f'    <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" class="gen-arrow"/>')
        return "\n".join(res)

    def actor_stick(cx, cy, name, role, app):
        safe_name = xml_esc(name)
        safe_role = xml_esc(role)
        safe_app = xml_esc(app)
        res = []
        safe_id = name.replace(" ", "_").replace("&", "_").replace("(", "").replace(")", "").replace("__", "_")
        res.append(f'  <g id="Actor_{safe_id}">')
        res.append(f'    <circle cx="{cx}" cy="{cy-40}" r="22" fill="#FFFFFF" stroke="#000000" stroke-width="2.5"/>')
        res.append(f'    <line x1="{cx}" y1="{cy-18}" x2="{cx}" y2="{cy+24}" stroke="#000000" stroke-width="2.5" stroke-linecap="round"/>')
        res.append(f'    <line x1="{cx-28}" y1="{cy+3}" x2="{cx+28}" y2="{cy+3}" stroke="#000000" stroke-width="2.5" stroke-linecap="round"/>')
        res.append(f'    <line x1="{cx}" y1="{cy+24}" x2="{cx-22}" y2="{cy+68}" stroke="#000000" stroke-width="2.5" stroke-linecap="round"/>')
        res.append(f'    <line x1="{cx}" y1="{cy+24}" x2="{cx+22}" y2="{cy+68}" stroke="#000000" stroke-width="2.5" stroke-linecap="round"/>')
        res.append(f'    <text x="{cx}" y="{cy+96}" class="t-actor-name">{safe_name}</text>')
        res.append(f'    <text x="{cx}" y="{cy+118}" class="t-actor-sub">{safe_role}</text>')
        res.append(f'    <rect x="{cx-92}" y="{cy+128}" width="184" height="26" rx="4" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="0.9"/>')
        res.append(f'    <text x="{cx}" y="{cy+145}" class="t-actor-app">{safe_app}</text>')
        res.append('  </g>')
        return "\n".join(res)

    def actor_system_box(cx, cy, w, h, name, role, tech):
        safe_name = xml_esc(name)
        safe_role = xml_esc(role)
        safe_tech = xml_esc(tech)
        x = cx - w/2
        y = cy - h/2
        res = []
        safe_id = name.replace(" ", "_").replace("&", "_").replace("(", "").replace(")", "").replace("__", "_")
        res.append(f'  <g id="Actor_Sys_{safe_id}">')
        res.append(f'    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.8"/>')
        res.append(f'    <rect x="{x}" y="{y}" width="{w}" height="28" rx="6" fill="#F0F4F8" stroke="#000000" stroke-width="1.2"/>')
        res.append(f'    <text x="{cx}" y="{y+19}" class="t-rel-abs">«system actor»</text>')
        res.append(f'    <text x="{cx}" y="{y+48}" class="t-actor-name">{safe_name}</text>')
        res.append(f'    <text x="{cx}" y="{y+70}" class="t-actor-sub">{safe_role}</text>')
        res.append(f'    <rect x="{x+12}" y="{y+78}" width="{w-24}" height="24" rx="4" fill="#E5E7EB"/>')
        res.append(f'    <text x="{cx}" y="{y+94}" class="t-actor-app">{safe_tech}</text>')
        res.append('  </g>')
        return "\n".join(res)

    def pkg_folder(x, y, w, h, tab_w, title, pkg_id):
        tab_h = 32
        res = []
        res.append(f'  <g id="{pkg_id}">')
        res.append(f'    <rect x="{x}" y="{y+tab_h}" width="{w}" height="{h-tab_h}" rx="5" class="pkg-body"/>')
        res.append(f'    <path d="M {x},{y+tab_h} L {x},{y+4} Q {x},{y} {x+4},{y} L {x+tab_w-15},{y} L {x+tab_w},{y+tab_h} Z" class="pkg-tab"/>')
        safe_title = xml_esc(title)
        res.append(f'    <text x="{x+18}" y="{y+21}" class="t-pkg">{safe_title}</text>')
        return "\n".join(res)

    # =========================================================================
    # PACKAGES & USE CASES (COMPACT & SNUG LAYOUT, PROMINENT TYPOGRAPHY)
    # =========================================================================

    # -------------------------------------------------------------------------
    # PACKAGE 1: GIAO TIẾP & ĐIỀU PHỐI HỘI THOẠI (Top Left)
    # Span: X = 280 to 1220 (W = 940, H = 485), Y = 160 to 645
    # -------------------------------------------------------------------------
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 1: GIAO TIẾP & ĐIỀU PHỐI HỘI THOẠI                -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(280, 160, 940, 485, 540, "PHÂN NHÓM 1: GIAO TIẾP &amp; ĐIỀU PHỐI HỘI THOẠI — sse • intent • session", "Pkg_AI_Conversation"))

    # Col 1: Primary User Interactions (cx = 490)
    lines.append(uc(490, 245, 165, 36, "UC-AI-01", "Trò chuyện Trợ lý AI RAG 24/7", "uc-core"))
    lines.append(uc(490, 355, 160, 35, "UC-AI-04", "Cô lập phiên &amp; Lưu lịch sử chat", "uc-core"))
    lines.append(uc(490, 465, 165, 36, "UC-AI-03", "Nhận diện ý định &amp; Lọc PII bảo mật", "uc-core"))
    lines.append(uc(490, 575, 160, 35, "UC-AI-05", "Gợi ý câu hỏi nhanh theo ngữ cảnh", "uc-ext"))

    # Col 2: Streaming & Infrastructure (cx = 990)
    lines.append(uc(990, 245, 165, 36, "UC-AI-02", "Phản hồi tức thời qua SSE Streaming", "uc-core"))
    lines.append(uc(990, 355, 160, 35, "UC-AI-06", "Rate Limit &amp; Chống spam tin nhắn", "uc"))
    lines.append(uc(990, 465, 160, 35, "UC-AI-07", "Tái cấu trúc câu hỏi (Query Rewriter)", "uc"))

    # Relationships in Pkg 1 (Clean Straight Connections):
    lines.append(direct_dep_arrow(490, 245, 165, 36, 490, 355, 160, 35, "«include»", -14))
    lines.append(direct_dep_arrow(490, 355, 160, 35, 490, 465, 165, 36, "«include»", -14))
    lines.append(direct_dep_arrow(490, 575, 160, 35, 490, 465, 165, 36, "«extend»", -14))
    lines.append(direct_dep_arrow(490, 245, 165, 36, 990, 245, 165, 36, "«include»", 14))
    lines.append(direct_dep_arrow(490, 355, 160, 35, 990, 355, 160, 35, "«include»", 14))
    lines.append(direct_dep_arrow(490, 465, 165, 36, 990, 465, 160, 35, "«include»", 14))
    lines.append('  </g>')
    lines.append('')

    # -------------------------------------------------------------------------
    # PACKAGE 3: TRUY XUẤT TRI THỨC RAG & VẬN HÀNH MÔ HÌNH (Top Right)
    # Span: X = 1280 to 2220 (W = 940, H = 485), Y = 160 to 645 (Gap between Pkg1 and Pkg3 = 60px)
    # -------------------------------------------------------------------------
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 3: TRUY XUẤT TRI THỨC RAG & VẬN HÀNH MÔ HÌNH       -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(1280, 160, 940, 485, 580, "PHÂN NHÓM 3: TRUY XUẤT TRI THỨC RAG &amp; VẬN HÀNH MÔ HÌNH — hybrid • llm", "Pkg_AI_RAG_Ops"))

    # Col 1: RAG Engine (cx = 1510)
    lines.append(uc(1510, 245, 165, 36, "UC-AI-RAG-01", "Tìm kiếm tri thức Hybrid (BM25+Vector)", "uc-core"))
    lines.append(uc(1510, 355, 160, 35, "UC-AI-RAG-02", "Đóng gói ngữ cảnh Sandwich Prompt", "uc-core"))
    lines.append(uc(1510, 465, 165, 36, "UC-AI-RAG-03", "Chuyển mạch mô hình kép Gemini / Groq", "uc-core"))
    lines.append(uc(1510, 575, 160, 35, "UC-AI-RAG-04", "Suy thoái mềm (Graceful Degradation)", "uc-ext"))

    # Col 2: Admin Ops (cx = 1990)
    lines.append(uc(1990, 245, 160, 36, "UC-AI-ADM-01", "Nạp &amp; Đồng bộ tri thức bưu chính", "uc-core"))
    lines.append(uc(1990, 355, 160, 35, "UC-AI-ADM-02", "Cấu hình Prompt Engineering", "uc"))
    lines.append(uc(1990, 465, 160, 35, "UC-AI-ADM-03", "Giám sát độ trễ &amp; Chi phí Token", "uc-core"))
    lines.append(uc(1990, 575, 160, 35, "UC-AI-ADM-04", "Kiểm thử hồi quy bộ câu hỏi đánh giá", "uc"))

    # Relationships in Pkg 3:
    lines.append(direct_dep_arrow(1510, 245, 165, 36, 1510, 355, 160, 35, "«include»", -14))
    lines.append(direct_dep_arrow(1510, 355, 160, 35, 1510, 465, 165, 36, "«include»", -14))
    lines.append(direct_dep_arrow(1510, 575, 160, 35, 1510, 465, 165, 36, "«extend»", -14))
    lines.append(direct_dep_arrow(1990, 245, 160, 36, 1510, 245, 165, 36, "«include»", 14))
    lines.append(direct_dep_arrow(1990, 355, 160, 35, 1510, 465, 165, 36, "«include»", -14))
    lines.append(direct_dep_arrow(1990, 575, 160, 35, 1990, 465, 160, 35, "«extend»", 14))

    # Cross package link from SSE Streaming (990, 245) to Hybrid Search (1510, 245):
    lines.append(direct_dep_arrow(990, 245, 165, 36, 1510, 245, 165, 36, "«include»", 14))
    lines.append('  </g>')
    lines.append('')

    # -------------------------------------------------------------------------
    # PACKAGE 2: BỘ 5 CÔNG CỤ NGHIỆP VỤ TỰ ĐỘNG (Dynamic Tool Calling Engine)
    # Span: X = 280 to 2220 (W = 1940, H = 745), Y = 695 to 1440 (Gap = 50px!)
    # -------------------------------------------------------------------------
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 2: BỘ 5 CÔNG CỤ NGHIỆP VỤ TỰ ĐỘNG (TOOL ENGINE)   -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(280, 695, 1940, 745, 620, "PHÂN NHÓM 2: BỘ 5 CÔNG CỤ NGHIỆP VỤ TỰ ĐỘNG — dynamic tool calling engine", "Pkg_AI_Tools"))

    # Tier 0: Top Center Abstract Tool Handler (cx = 1250, cy = 775)
    lines.append(uc(1250, 775, 205, 38, "UC-AI-TOOL-00", "Khung Điều Phối &amp; Gọi Công Cụ Động", "uc-abstract"))

    # Cross Link from UC-AI-03 (Intent Router at 490, 465) to UC-AI-TOOL-00 (1250, 775) via Inter-Package Corridor (y=670)
    lines.append(manhattan_dep_arrow([(490, 501), (490, 670), (1250, 670), (1250, 737)], "«extend»", 870, 670))

    # Tier 1: The 5 Business Tools (cy = 915)
    lines.append(uc(450, 915, 142, 36, "UC-AI-TOOL-01", "Tra cứu vận đơn (track)", "uc-core"))
    lines.append(uc(850, 915, 145, 36, "UC-AI-TOOL-02", "Tính cước IATA (rate)", "uc-core"))
    lines.append(uc(1250, 915, 150, 36, "UC-AI-TOOL-03", "Hàng cấm gửi (prohibited)", "uc-core"))
    lines.append(uc(1650, 915, 152, 36, "UC-AI-TOOL-04", "Bồi thường (compensation)", "uc-core"))
    lines.append(uc(2050, 915, 145, 36, "UC-AI-TOOL-05", "Tìm bưu cục (post_office)", "uc-core"))

    # Generalization arrows from 5 Tools to Abstract Framework (Crisp white triangle)
    lines.append(direct_gen_arrow(450, 915, 142, 36, 1250, 775, 205, 38))
    lines.append(direct_gen_arrow(850, 915, 145, 36, 1250, 775, 205, 38))
    lines.append(direct_gen_arrow(1250, 915, 150, 36, 1250, 775, 205, 38))
    lines.append(direct_gen_arrow(1650, 915, 152, 36, 1250, 775, 205, 38))
    lines.append(direct_gen_arrow(2050, 915, 145, 36, 1250, 775, 205, 38))

    # Tier 2: Specialized Business Logic Rules (cy = 1055)
    lines.append(uc(450, 1055, 148, 36, "UC-AI-RULE-01", "Giải mã vận đơn 12 ký tự số", "uc"))
    lines.append(uc(850, 1055, 152, 36, "UC-AI-RULE-02", "Quy đổi thể tích IATA V/6000 3 vùng", "uc"))
    lines.append(uc(1250, 1055, 158, 36, "UC-AI-RULE-03", "Phân loại chất nổ, pin, chất lỏng", "uc"))
    lines.append(uc(1650, 1055, 158, 36, "UC-AI-RULE-04", "Quy đổi bồi thường 100% giá trị", "uc"))
    lines.append(uc(2050, 1055, 152, 36, "UC-AI-RULE-05", "Định vị bưu cục theo Quận/Huyện", "uc"))

    # Direct vertical include links from tools to rules (Perfect zero-crossing straight corridors):
    lines.append(direct_dep_arrow(450, 915, 142, 36, 450, 1055, 148, 36, "«include»", 14))
    lines.append(direct_dep_arrow(850, 915, 145, 36, 850, 1055, 152, 36, "«include»", 14))
    lines.append(direct_dep_arrow(1250, 915, 150, 36, 1250, 1055, 158, 36, "«include»", 14))
    lines.append(direct_dep_arrow(1650, 915, 152, 36, 1650, 1055, 158, 36, "«include»", 14))
    lines.append(direct_dep_arrow(2050, 915, 145, 36, 2050, 1055, 152, 36, "«include»", 14))

    # Tier 3: Validation, Execution & Natural Language Formatting (cy = 1205)
    lines.append(uc(650, 1205, 175, 36, "UC-AI-EXEC-01", "Xác thực tham số Schema Zod / Pydantic", "uc-core"))
    lines.append(uc(1250, 1205, 175, 36, "UC-AI-EXEC-02", "Bảo vệ PII &amp; Kiểm duyệt dữ liệu ra", "uc"))
    lines.append(uc(1850, 1205, 175, 36, "UC-AI-EXEC-03", "Biên dịch JSON sang ngôn ngữ tự nhiên", "uc-core"))

    # Links connecting rules to execution pipeline:
    lines.append(direct_dep_arrow(450, 1055, 148, 36, 650, 1205, 175, 36, "«include»", 14))
    lines.append(direct_dep_arrow(850, 1055, 152, 36, 650, 1205, 175, 36, "«include»", -14))
    lines.append(direct_dep_arrow(1250, 1055, 158, 36, 1250, 1205, 175, 36, "«include»", 14))
    lines.append(direct_dep_arrow(1650, 1055, 158, 36, 1250, 1205, 175, 36, "«include»", -14))
    lines.append(direct_dep_arrow(2050, 1055, 152, 36, 1850, 1205, 175, 36, "«include»", 14))

    # Horizontal execution pipeline:
    lines.append(direct_dep_arrow(650, 1205, 175, 36, 1250, 1205, 175, 36, "«include»", 14))
    lines.append(direct_dep_arrow(1250, 1205, 175, 36, 1850, 1205, 175, 36, "«include»", 14))

    # Tier 4: National Postal Legal & Safety Compliance Anchor (cy = 1355)
    lines.append(uc(1250, 1355, 205, 38, "UC-AI-LEGAL-01", "Tuân thủ Điều 25 Luật Bưu Chính &amp; ICAO", "uc-core"))
    lines.append(direct_dep_arrow(1250, 1205, 175, 36, 1250, 1355, 205, 38, "«include»", 14))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # ACTORS (LEFT: HUMAN END-USERS, RIGHT: ADMIN & EXTERNAL SYSTEMS)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- ACTORS (LEFT: END-USERS, RIGHT: ADMIN & EXTERNAL SYSTEMS) -->')
    lines.append('  <!-- ========================================================= -->')

    # LEFT FLANK (HUMAN END-USERS, cx = 135)
    # Guest at cy = 215, Customer at cy = 500 (Clean spacing, zero overlap)
    lines.append(actor_stick(135, 215, "Khách Vãng Lai", "(Guest - Người dùng tự do)", "guest-web :5177"))
    lines.append(actor_stick(135, 500, "Khách Hàng Cá Nhân", "(Customer C-End)", "customer-mobile :8082"))

    # Generalization: Customer -> Guest
    lines.append('  <g id="Gen_Customer_Guest">')
    lines.append('    <line x1="135" y1="420" x2="135" y2="385" class="gen-line"/>')
    lines.append('    <polygon points="135,372 127,390 143,390" class="gen-arrow"/>')
    lines.append('    <text x="175" y="405" class="t-rel-abs">«specializes»</text>')
    lines.append('  </g>')

    # RIGHT FLANK (cx = 2420, logically aligned with their respective interacting packages!)
    # 1. Admin at cy = 230 (Interacts with Pkg 3 Admin Ops at y=245..575)
    lines.append(actor_stick(2420, 230, "Quản Trị Kỹ Thuật AI", "(AI / System Admin)", "admin-web :5175"))
    
    # 2. Vector DB at cy = 405 (Interacts with Pkg 3 RAG Search & Ingestion at y=245)
    lines.append(actor_system_box(2420, 405, 250, 102, "Cơ Sở Dữ Liệu Vector", "(Knowledge Store)", "ChromaDB / Qdrant 768-D"))
    
    # 3. LLM Providers at cy = 575 (Interacts with Model Switching y=465)
    lines.append(actor_system_box(2420, 575, 250, 102, "Mô Hình Ngôn Ngữ Lớn", "(LLM Providers API)", "Gemini 2.5 • Groq Llama 3.3"))
    
    # 4. Core Logistics ERP at cy = 1060 (Interacts with Pkg 2 Tools & Rules at y=915..1205)
    lines.append(actor_system_box(2420, 1060, 250, 102, "Hệ Thống Logistics Cốt Lõi", "(Core Logistics ERP)", "REST Services • microservices"))

    # =========================================================================
    # ASSOCIATIONS (DIRECT STRAIGHT & CLEAN ROUTING)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- ACTOR ASSOCIATIONS                                        -->')
    lines.append('  <!-- ========================================================= -->')

    g_pt = (175, 215)
    c_pt = (175, 500)
    adm_pt = (2380, 230)

    vec_pt = (2295, 405)
    llm_pt = (2295, 575)
    core_pt = (2295, 1060)

    # 1. Guest -> UC-AI-01 (Chat RAG) & UC-AI-05 (Quick Prompts)
    lines.append('  <!-- Guest associations -->')
    lines.append(direct_assoc(g_pt[0], g_pt[1], 490, 245, 165, 36))
    lines.append(direct_assoc(g_pt[0], g_pt[1], 490, 575, 160, 35))

    # 2. Customer -> UC-AI-04 (Session History Persistence)
    lines.append('  <!-- Customer associations -->')
    lines.append(direct_assoc(c_pt[0], c_pt[1], 490, 355, 160, 35))

    # 3. AI Admin -> UC-AI-ADM-01, 02, 03, 04 (Directly to adjacent Pkg 3)
    lines.append('  <!-- AI Admin associations -->')
    lines.append(direct_assoc(adm_pt[0], adm_pt[1], 1990, 245, 160, 36))
    lines.append(direct_assoc(adm_pt[0], adm_pt[1], 1990, 355, 160, 35))
    lines.append(direct_assoc(adm_pt[0], adm_pt[1], 1990, 465, 160, 35))
    lines.append(direct_assoc(adm_pt[0], adm_pt[1], 1990, 575, 160, 35))

    # 4. Vector DB -> UC-AI-RAG-01 (Hybrid Search) & UC-AI-ADM-01 (Ingestion)
    lines.append('  <!-- Vector DB associations -->')
    lines.append(direct_assoc(vec_pt[0], vec_pt[1], 1510, 245, 165, 36))
    lines.append(direct_assoc(vec_pt[0], vec_pt[1], 1990, 245, 160, 36))

    # 5. LLM Providers -> UC-AI-RAG-03 (Model Switching) & UC-AI-ADM-03 (Token/Latency)
    lines.append('  <!-- LLM Providers associations -->')
    lines.append(direct_assoc(llm_pt[0], llm_pt[1], 1510, 465, 165, 36))
    lines.append(direct_assoc(llm_pt[0], llm_pt[1], 1990, 465, 160, 35))

    # 6. Core Logistics ERP -> Tools (Tool 5 post_office & EXEC-03 REST Dispatch)
    lines.append('  <!-- Core Logistics ERP associations -->')
    lines.append(direct_assoc(core_pt[0], core_pt[1], 2050, 915, 145, 36))
    lines.append(direct_assoc(core_pt[0], core_pt[1], 1850, 1205, 175, 36))

    # =========================================================================
    # FOOTER & LEGEND
    # =========================================================================
    lines.append('  <!-- ==================== FOOTER & LEGEND ==================== -->')
    lines.append('  <g id="Footer_Legend">')
    lines.append(f'    <rect x="30" y="{height-85}" width="{width-60}" height="60" fill="#FAFAFA" stroke="#000000" stroke-width="1.4" rx="4"/>')
    lines.append(f'    <text x="50" y="{height-49}" font-family="Segoe UI, Arial" font-size="14.5" font-weight="bold" fill="#000000">CHÚ GIẢI THIẾT KẾ (OMG UML 2.5):</text>')
    
    # Legend items
    lg_items = [
        ("Tác nhân Người (Human)", 340),
        ("Tác nhân Hệ thống (System)", 580),
        ("Use Case Cốt lõi", 830),
        ("Use Case Mở rộng", 1020),
        ("Use Case Trừu tượng", 1220),
        ("Liên kết (Association)", 1440),
        ("Kế thừa (Generalization)", 1680),
        ("«include» Bắt buộc", 1930),
        ("«extend» Mở rộng điều kiện", 2160)
    ]
    for text, lx in lg_items:
        lines.append(f'    <text x="{lx}" y="{height-49}" font-family="Segoe UI, Arial" font-size="13.5" font-weight="600" fill="#1F2937">• {text}</text>')
    lines.append('  </g>')

    lines.append('</svg>')
    return "\n".join(lines)

def main():
    svg_content = generate_svg()
    targets = [
        os.path.abspath("docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-use-case-ai-chatbot-subsystem.svg"),
        os.path.abspath("docs/graduation-thesis/diagrams/use-case/02-use-case-ai-chatbot-subsystem.svg")
    ]
    for target_path in targets:
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"Generated successfully: {target_path} ({len(svg_content.encode('utf-8'))} bytes)")

if __name__ == "__main__":
    main()
