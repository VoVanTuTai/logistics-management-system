#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE DOCUMENT EXTRACTION & METADATA DIAGRAMS (THEORY & LOGISTICS REALITY)
=============================================================================
Bản vẽ Kỹ thuật Sư phạm Trực quan:
Minh họa quy trình tiền xử lý, phân giải (Parsing), làm sạch (Cleaning),
lọc (Filtering) và rút trích Văn bản thuần (Plain text) cùng Siêu dữ liệu (Metadata)
từ các nguồn dữ liệu đầu vào đa định dạng (MD, PDF, HTML, CSV).

Sinh 2 phiên bản:
1. Phiên bản Giáo trình Chuẩn (04-document-text-and-metadata-extraction.svg):
   Mô phỏng 100% hình mẫu tham khảo (TXT, PDF, HTML, CSV | Year: 2024, Author: ABC, Topic: AI).
2. Phiên bản Ứng dụng Thực tế Hệ thống Nexus Logistics (04-logistics-document-metadata-extraction.svg):
   Áp dụng trực tiếp vào nghiệp vụ bưu chính (MD SOPs, PDF Thông tư, HTML Sổ tay, CSV Biểu cước
   | Source: 02-claim-policy.md, Section: Điều 4.2 BBBT, Topic: Bồi thường hư hỏng).
"""

import os
import math
import html
import xml.etree.ElementTree as ET

def xml_esc(s):
    if s is None:
        return ""
    if not isinstance(s, str):
        s = str(s)
    return html.escape(s, quote=True)

def generate_extraction_svg(mode="standard"):
    """
    mode: 'standard' (giáo trình gốc) hoặc 'logistics' (áp dụng vào hệ thống thực tế)
    """
    width = 760
    height = 1080

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # STYLES DEFINITION (CLEAN TEXTBOOK PEDAGOGICAL STYLE)
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }')
    lines.append('      .doc-title { font-family: "Times New Roman", Times, serif; font-size: 32px; font-weight: 700; fill: #000000; text-anchor: middle; }')
    lines.append('      .doc-sub { font-size: 13.5px; font-weight: 700; fill: #2563EB; text-anchor: middle; letter-spacing: 0.3px; }')
    lines.append('      .funnel-step { font-family: "Times New Roman", Times, serif; font-size: 23px; font-weight: 600; fill: #000000; text-anchor: start; }')
    lines.append('      .funnel-sub { font-size: 12px; font-weight: 600; fill: #4B5563; text-anchor: start; }')
    lines.append('      .lbl-main { font-family: "Times New Roman", Times, serif; font-size: 26px; font-weight: 700; fill: #000000; text-anchor: middle; }')
    lines.append('      .lbl-sub { font-size: 13.5px; font-weight: 600; fill: #4B5563; text-anchor: middle; }')
    lines.append('      .tag-txt { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 14px; font-weight: 700; fill: #000000; text-anchor: middle; }')
    lines.append('      .badge-txt { font-size: 15px; font-weight: 900; fill: #FFFFFF; text-anchor: middle; }')
    lines.append('      .doc-badge-sub { font-size: 12px; font-weight: 700; fill: #4B5563; text-anchor: middle; }')
    lines.append('      .caption-txt { font-family: "Times New Roman", Times, serif; font-size: 22px; font-weight: 500; fill: #000000; text-anchor: middle; }')
    lines.append('      .flow-arrow { fill: none; stroke: #000000; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .arrowhead { fill: #000000; }')
    lines.append('      .plain-txt-content { font-size: 11px; fill: #1E293B; }')
    lines.append('      .plain-txt-bold { font-size: 11.5px; font-weight: 700; fill: #000000; }')
    lines.append('    ]]></style>')
    lines.append('  </defs>')
    lines.append('')

    # BACKGROUND
    lines.append(f'  <rect width="{width}" height="{height}" fill="#FFFFFF"/>')

    # HELPER: Arrowhead
    def arrow_head(x, y, direction="down", size=14):
        if direction == "down":
            return f'  <polygon points="{x},{y} {x-size*0.6},{y-size} {x+size*0.6},{y-size}" class="arrowhead"/>'
        elif direction == "up":
            return f'  <polygon points="{x},{y} {x-size*0.6},{y+size} {x+size*0.6},{y+size}" class="arrowhead"/>'
        elif direction == "right":
            return f'  <polygon points="{x},{y} {x-size},{y-size*0.6} {x-size},{y+size*0.6}" class="arrowhead"/>'
        elif direction == "left":
            return f'  <polygon points="{x},{y} {x+size},{y-size*0.6} {x+size},{y+size*0.6}" class="arrowhead"/>'

    center_x = width / 2 # 380

    # =========================================================================
    # 1. TOP HEADER: "Documents"
    # =========================================================================
    lines.append('  <!-- ==================== TOP TITLE ==================== -->')
    if mode == "standard":
        lines.append(f'  <text x="{center_x}" y="56" class="doc-title">Documents</text>')
    else:
        lines.append(f'  <text x="{center_x}" y="48" class="doc-title">Tài liệu Nghiệp vụ (Documents)</text>')
        lines.append(f'  <text x="{center_x}" y="70" class="doc-sub">KHO DỮ LIỆU ĐẦU VÀO ĐA ĐỊNH DẠNG TRONG HỆ THỐNG NEXUS LOGISTICS</text>')

    # =========================================================================
    # 2. 4 INPUT DOCUMENT ICONS (MD/TXT, PDF, HTML, CSV)
    # =========================================================================
    lines.append('  <!-- ==================== 4 INPUT DOCUMENTS ==================== -->')
    if mode == "standard":
        docs_data = [
            {"type": "TXT", "sub": "", "badge_color": "#38BDF8", "cx": 145},
            {"type": "PDF", "sub": "", "badge_color": "#DC2626", "cx": 305},
            {"type": "HTML", "sub": "", "badge_color": "#EA580C", "cx": 455},
            {"type": "CSV", "sub": "", "badge_color": "#86EFAC", "cx": 615}
        ]
    else:
        docs_data = [
            {"type": "MD", "sub": "SOP Bưu chính", "badge_color": "#2563EB", "cx": 145},
            {"type": "PDF", "sub": "Thông tư Vận tải", "badge_color": "#DC2626", "cx": 305},
            {"type": "HTML", "sub": "Sổ tay Portal", "badge_color": "#EA580C", "cx": 455},
            {"type": "CSV", "sub": "Biểu cước IATA", "badge_color": "#16A34A", "cx": 615}
        ]

    doc_w, doc_h = 88, 108
    doc_y = 92
    fold_size = 22

    for d in docs_data:
        dx = d["cx"] - doc_w / 2
        lines.append(f'  <g id="Doc_{d["type"]}">')

        # Document Outline with Folded Corner
        lines.append(f'    <path d="M {dx+8} {doc_y} L {dx+doc_w-fold_size} {doc_y} L {dx+doc_w} {doc_y+fold_size} L {dx+doc_w} {doc_y+doc_h-8} A 8 8 0 0 1 {dx+doc_w-8} {doc_y+doc_h} L {dx+8} {doc_y+doc_h} A 8 8 0 0 1 {dx} {doc_y+doc_h-8} L {dx} {doc_y+8} A 8 8 0 0 1 {dx+8} {doc_y} Z" fill="#FFFFFF" stroke="#000000" stroke-width="3.2" stroke-linejoin="round"/>')

        # Folded flap
        flap_fill = "#EF4444" if d["type"] == "PDF" else "#F3F4F6"
        lines.append(f'    <path d="M {dx+doc_w-fold_size} {doc_y} L {dx+doc_w-fold_size} {doc_y+fold_size} A 2 2 0 0 0 {dx+doc_w-fold_size+2} {doc_y+fold_size} L {dx+doc_w} {doc_y+fold_size} Z" fill="{flap_fill}" stroke="#000000" stroke-width="2.6" stroke-linejoin="round"/>')

        if d["type"] in ("TXT", "MD"):
            # Badge on the bottom
            badge_h = 30
            badge_y = doc_y + doc_h - badge_h - 10
            lines.append(f'    <rect x="{dx-6}" y="{badge_y}" width="{doc_w+12}" height="{badge_h}" rx="6" fill="{d["badge_color"]}" stroke="#000000" stroke-width="3.2"/>')
            lines.append(f'    <text x="{d["cx"]}" y="{badge_y+21}" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1px">{d["type"]}</text>')

        elif d["type"] == "PDF":
            # PDF red badge
            badge_h = 30
            badge_y = doc_y + doc_h - badge_h - 10
            lines.append(f'    <rect x="{dx-6}" y="{badge_y}" width="{doc_w+12}" height="{badge_h}" rx="6" fill="#DC2626" stroke="#000000" stroke-width="3.2"/>')
            lines.append(f'    <text x="{d["cx"]}" y="{badge_y+21}" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1px">PDF</text>')

        elif d["type"] == "HTML":
            # HTML code bracket symbol `< >` above badge
            lines.append(f'    <text x="{d["cx"]}" y="{doc_y+38}" font-size="18" font-weight="900" fill="#EA580C" text-anchor="middle">&lt; &gt;</text>')
            badge_h = 30
            badge_y = doc_y + doc_h - badge_h - 10
            lines.append(f'    <rect x="{dx-6}" y="{badge_y}" width="{doc_w+12}" height="{badge_h}" rx="6" fill="#EA580C" stroke="#000000" stroke-width="3.2"/>')
            lines.append(f'    <text x="{d["cx"]}" y="{badge_y+21}" font-size="14.5" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5px">HTML</text>')

        elif d["type"] == "CSV":
            # CSV spreadsheet grid above badge
            gw = 46
            gh = 24
            gx = d["cx"] - gw / 2
            gy = doc_y + 18
            lines.append(f'    <rect x="{gx}" y="{gy}" width="{gw}" height="{gh}" fill="#BBF7D0" stroke="#000000" stroke-width="2.2"/>')
            lines.append(f'    <line x1="{gx+gw/3}" y1="{gy}" x2="{gx+gw/3}" y2="{gy+gh}" stroke="#000000" stroke-width="2.0"/>')
            lines.append(f'    <line x1="{gx+gw*2/3}" y1="{gy}" x2="{gx+gw*2/3}" y2="{gy+gh}" stroke="#000000" stroke-width="2.0"/>')
            lines.append(f'    <line x1="{gx}" y1="{gy+gh/2}" x2="{gx+gw}" y2="{gy+gh/2}" stroke="#000000" stroke-width="2.0"/>')

            badge_h = 30
            badge_y = doc_y + doc_h - badge_h - 10
            lines.append(f'    <rect x="{dx-6}" y="{badge_y}" width="{doc_w+12}" height="{badge_h}" rx="6" fill="{d["badge_color"]}" stroke="#000000" stroke-width="3.2"/>')
            lines.append(f'    <text x="{d["cx"]}" y="{badge_y+21}" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1px">CSV</text>')

        # Sub-label for logistics mode
        if mode == "logistics" and d["sub"]:
            lines.append(f'    <text x="{d["cx"]}" y="{doc_y+doc_h+20}" class="doc-badge-sub">{xml_esc(d["sub"])}</text>')

        lines.append('  </g>')

    # =========================================================================
    # 3. CONNECTING WIRES TO FUNNEL
    # =========================================================================
    lines.append('  <!-- ==================== CONNECTING WIRES ==================== -->')
    lines.append('  <g id="Connecting_Wires">')
    wire_drop_y = 236 if mode == "standard" else 248
    lines.append(f'    <path d="M 145 205 L 145 {wire_drop_y} A 12 12 0 0 0 157 {wire_drop_y+12} L {center_x} {wire_drop_y+12}" class="flow-arrow"/>')
    lines.append(f'    <path d="M 305 205 L 305 {wire_drop_y} A 12 12 0 0 0 317 {wire_drop_y+12} L {center_x} {wire_drop_y+12}" class="flow-arrow"/>')
    lines.append(f'    <path d="M 455 205 L 455 {wire_drop_y} A 12 12 0 0 1 443 {wire_drop_y+12} L {center_x} {wire_drop_y+12}" class="flow-arrow"/>')
    lines.append(f'    <path d="M 615 205 L 615 {wire_drop_y} A 12 12 0 0 1 603 {wire_drop_y+12} L {center_x} {wire_drop_y+12}" class="flow-arrow"/>')

    # Central drop into funnel
    lines.append(f'    <line x1="{center_x}" y1="{wire_drop_y+12}" x2="{center_x}" y2="285" class="flow-arrow"/>')
    lines.append(arrow_head(center_x, 290, "down", 14))
    lines.append('  </g>')

    # =========================================================================
    # 4. FUNNEL & COG GEAR (MIDDLE)
    # =========================================================================
    lines.append('  <!-- ==================== FUNNEL & GEAR ==================== -->')
    lines.append('  <g id="Funnel_Group">')

    funnel_w = 236
    funnel_x = center_x - funnel_w / 2 # 262
    funnel_top_y = 295
    spout_w = 42
    spout_top_y = 420
    spout_bot_y = 505

    # Funnel Top Rim
    lines.append(f'    <rect x="{funnel_x}" y="{funnel_top_y}" width="{funnel_w}" height="28" rx="8" fill="#FDE047" stroke="#000000" stroke-width="4.0"/>')
    lines.append(f'    <line x1="{funnel_x+10}" y1="{funnel_top_y+16}" x2="{funnel_x+funnel_w-10}" y2="{funnel_top_y+16}" stroke="#000000" stroke-width="3.0"/>')

    # Conical Funnel Body
    cone_p1 = f"{funnel_x+6} {funnel_top_y+28}"
    cone_p2 = f"{center_x - spout_w/2} {spout_top_y}"
    cone_p3 = f"{center_x + spout_w/2} {spout_top_y}"
    cone_p4 = f"{funnel_x+funnel_w-6} {funnel_top_y+28}"
    lines.append(f'    <polygon points="{cone_p1} {cone_p2} {cone_p3} {cone_p4}" fill="#FDE047" stroke="#000000" stroke-width="4.0" stroke-linejoin="round"/>')

    # Narrow Spout (Pipe) with angled bottom
    lines.append(f'    <polygon points="{center_x-spout_w/2},{spout_top_y} {center_x-spout_w/2},{spout_bot_y+10} {center_x+spout_w/2},{spout_bot_y-8} {center_x+spout_w/2},{spout_top_y}" fill="#FDE047" stroke="#000000" stroke-width="4.0" stroke-linejoin="round"/>')

    # Mechanical Cog Gear with Trapezoidal Teeth
    gear_cx = center_x - 65 # 315
    gear_cy = 380
    gear_r_outer = 40
    gear_r_inner = 28
    gear_r_hole = 14
    num_cogs = 8

    cog_points = []
    angle_step = 2 * math.pi / num_cogs
    for i in range(num_cogs):
        base_angle = i * angle_step
        a1 = base_angle - angle_step * 0.22
        a2 = base_angle - angle_step * 0.12
        a3 = base_angle + angle_step * 0.12
        a4 = base_angle + angle_step * 0.22

        p1 = f"{gear_cx + gear_r_inner * math.cos(a1):.1f},{gear_cy + gear_r_inner * math.sin(a1):.1f}"
        p2 = f"{gear_cx + gear_r_outer * math.cos(a2):.1f},{gear_cy + gear_r_outer * math.sin(a2):.1f}"
        p3 = f"{gear_cx + gear_r_outer * math.cos(a3):.1f},{gear_cy + gear_r_outer * math.sin(a3):.1f}"
        p4 = f"{gear_cx + gear_r_inner * math.cos(a4):.1f},{gear_cy + gear_r_inner * math.sin(a4):.1f}"
        cog_points.extend([p1, p2, p3, p4])

    lines.append(f'    <polygon points="{" ".join(cog_points)}" fill="#D1D5DB" stroke="#000000" stroke-width="3.6" stroke-linejoin="round"/>')
    lines.append(f'    <circle cx="{gear_cx}" cy="{gear_cy}" r="{gear_r_hole}" fill="#FFFFFF" stroke="#000000" stroke-width="3.6"/>')
    lines.append('  </g>')

    # Left Text: Funnel Processing Steps
    lines.append('  <!-- ==================== FUNNEL STEPS TEXT ==================== -->')
    lines.append('  <g id="Funnel_Steps_Text">')
    text_x = 55 if mode == "logistics" else 75
    if mode == "standard":
        lines.append(f'    <text x="{text_x}" y="330" class="funnel-step">Parsing</text>')
        lines.append(f'    <text x="{text_x}" y="370" class="funnel-step">Cleaning</text>')
        lines.append(f'    <text x="{text_x}" y="410" class="funnel-step">Filtering</text>')
        lines.append(f'    <text x="{text_x}" y="450" class="funnel-step">...</text>')
    else:
        lines.append(f'    <text x="{text_x}" y="322" class="funnel-step">Parsing</text>')
        lines.append(f'    <text x="{text_x}" y="338" class="funnel-sub">Cắt tiêu đề AST (#, ##)</text>')
        lines.append(f'    <text x="{text_x}" y="368" class="funnel-step">Cleaning</text>')
        lines.append(f'    <text x="{text_x}" y="384" class="funnel-sub">Loại bỏ cú pháp rác &amp; tag</text>')
        lines.append(f'    <text x="{text_x}" y="414" class="funnel-step">Filtering</text>')
        lines.append(f'    <text x="{text_x}" y="430" class="funnel-sub">Trượt cửa sổ (250w/40w)</text>')
        lines.append(f'    <text x="{text_x}" y="460" class="funnel-step">...</text>')
    lines.append('  </g>')

    # =========================================================================
    # 5. BRANCHING PATHS OUT OF SPOUT
    # =========================================================================
    lines.append('  <!-- ==================== BRANCHING ARROWS ==================== -->')
    lines.append('  <g id="Branching_Arrows">')
    target_left_x = 225
    target_right_x = 535

    lines.append(f'    <path d="M {center_x} 505 L {center_x} 535 C {center_x} 560, {target_left_x} 545, {target_left_x} 585" class="flow-arrow"/>')
    lines.append(arrow_head(target_left_x, 590, "down", 14))

    lines.append(f'    <path d="M {center_x} 505 L {center_x} 535 C {center_x} 560, {target_right_x} 545, {target_right_x} 585" class="flow-arrow"/>')
    lines.append(arrow_head(target_right_x, 590, "down", 14))
    lines.append('  </g>')

    # =========================================================================
    # 6. BOTTOM-LEFT: PLAIN TEXT DOCUMENT
    # =========================================================================
    lines.append('  <!-- ==================== PLAIN TEXT DOCUMENT ==================== -->')
    lines.append('  <g id="Plain_Text_Group">')
    pt_w, pt_h = 210, 245
    pt_x = target_left_x - pt_w / 2 # 120
    pt_y = 600
    pt_fold = 44

    # Outer Document Body with Folded Corner
    lines.append(f'    <path d="M {pt_x+16} {pt_y} L {pt_x+pt_w-pt_fold} {pt_y} L {pt_x+pt_w} {pt_y+pt_fold} L {pt_x+pt_w} {pt_y+pt_h-16} A 16 16 0 0 1 {pt_x+pt_w-16} {pt_y+pt_h} L {pt_x+16} {pt_y+pt_h} A 16 16 0 0 1 {pt_x} {pt_y+pt_h-16} L {pt_x} {pt_y+16} A 16 16 0 0 1 {pt_x+16} {pt_y} Z" fill="#EBF5FF" stroke="#000000" stroke-width="4.0" stroke-linejoin="round"/>')

    # Folded Flap (Golden yellow #FBBF24)
    lines.append(f'    <path d="M {pt_x+pt_w-pt_fold} {pt_y} L {pt_x+pt_w-pt_fold} {pt_y+pt_fold} A 3 3 0 0 0 {pt_x+pt_w-pt_fold+3} {pt_y+pt_fold} L {pt_x+pt_w} {pt_y+pt_fold} Z" fill="#FBBF24" stroke="#000000" stroke-width="3.5" stroke-linejoin="round"/>')

    if mode == "standard":
        # 4 Thick Horizontal Text Bars
        line_x1 = pt_x + 26
        lines.append(f'    <line x1="{line_x1}" y1="{pt_y+70}" x2="{pt_x+pt_w-35}" y2="{pt_y+70}" stroke="#000000" stroke-width="6.5" stroke-linecap="round"/>')
        lines.append(f'    <line x1="{line_x1}" y1="{pt_y+110}" x2="{pt_x+pt_w-25}" y2="{pt_y+110}" stroke="#000000" stroke-width="6.5" stroke-linecap="round"/>')
        lines.append(f'    <line x1="{line_x1}" y1="{pt_y+150}" x2="{pt_x+pt_w-40}" y2="{pt_y+150}" stroke="#000000" stroke-width="6.5" stroke-linecap="round"/>')
        lines.append(f'    <line x1="{line_x1}" y1="{pt_y+190}" x2="{pt_x+pt_w-65}" y2="{pt_y+190}" stroke="#000000" stroke-width="6.5" stroke-linecap="round"/>')
    else:
        # Realistic plain text lines from 02-insurance-and-claim-policy.md
        tx = pt_x + 14
        lines.append(f'    <rect x="{tx}" y="{pt_y+14}" width="120" height="20" rx="3" fill="#3B82F6"/>')
        lines.append(f'    <text x="{tx+60}" y="{pt_y+28}" font-size="10.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">SOP BỒI THƯỜNG</text>')
        
        lines.append(f'    <text x="{tx}" y="{pt_y+62}" class="plain-txt-bold">Điều 4.2: Quy chế bể vỡ</text>')
        lines.append(f'    <text x="{tx}" y="{pt_y+84}" class="plain-txt-content">• Bưu gửi bị bể vỡ khi nhận</text>')
        lines.append(f'    <text x="{tx}" y="{pt_y+104}" class="plain-txt-content">  có Biên bản bất thường</text>')
        lines.append(f'    <text x="{tx}" y="{pt_y+124}" class="plain-txt-content">  (BBBT) lập trong 24 giờ</text>')
        lines.append(f'    <text x="{tx}" y="{pt_y+144}" class="plain-txt-content">  sẽ bồi thường 100%</text>')
        lines.append(f'    <text x="{tx}" y="{pt_y+164}" class="plain-txt-content">  giá trị khai giá hàng.</text>')
        lines.append(f'    <text x="{tx}" y="{pt_y+190}" font-size="11" font-weight="700" fill="#15803D">• Hạn mức duyệt tự động: 2M</text>')
        lines.append(f'    <text x="{tx}" y="{pt_y+214}" font-size="10.5" font-style="italic" fill="#2563EB">[Cửa sổ 250 từ thuần túy]</text>')

    # Label: Plain text
    lines.append(f'    <text x="{target_left_x}" y="{pt_y+pt_h+38}" class="lbl-main">Plain text</text>')
    if mode == "logistics":
        lines.append(f'    <text x="{target_left_x}" y="{pt_y+pt_h+58}" class="lbl-sub">(Văn bản thô đã bóc tách định dạng)</text>')
    lines.append('  </g>')

    # =========================================================================
    # 7. BOTTOM-RIGHT: 3 METADATA CHEVRON TAGS
    # =========================================================================
    lines.append('  <!-- ==================== METADATA CHEVRONS ==================== -->')
    lines.append('  <g id="Metadata_Group">')

    tag_w = 320
    tag_h = 64
    tag_x = target_right_x - tag_w / 2 # 375
    notch = 32

    if mode == "standard":
        tags_data = [
            {"y": 600, "fill": "#FEF08A", "text": "Year: 2024"},
            {"y": 685, "fill": "#BFDBFE", "text": "Author: ABC"},
            {"y": 770, "fill": "#FECDD3", "text": "Topic: AI"}
        ]
    else:
        tags_data = [
            {"y": 600, "fill": "#FEF08A", "text": "sourceFile: 02-claim-policy.md"},
            {"y": 685, "fill": "#BFDBFE", "text": "sectionTitle: Điều 4.2 BBBT"},
            {"y": 770, "fill": "#FECDD3", "text": "chunkId: #CLM-02 • 248 words"}
        ]

    for t in tags_data:
        ty = t["y"]
        p1 = f"{tag_x+notch},{ty}"
        p2 = f"{tag_x+tag_w},{ty}"
        p3 = f"{tag_x+tag_w},{ty+tag_h}"
        p4 = f"{tag_x+notch},{ty+tag_h}"
        p5 = f"{tag_x},{ty+tag_h/2}"
        lines.append(f'    <polygon points="{p1} {p2} {p3} {p4} {p5}" fill="{t["fill"]}" stroke="#000000" stroke-width="3.5" stroke-linejoin="round"/>')

        txt_cx = tag_x + notch + (tag_w - notch) / 2
        lines.append(f'    <text x="{txt_cx}" y="{ty+39}" class="tag-txt">{xml_esc(t["text"])}</text>')

    # Label: Metadata
    lines.append(f'    <text x="{target_right_x}" y="{tags_data[2]["y"]+tag_h+46}" class="lbl-main">Metadata</text>')
    if mode == "logistics":
        lines.append(f'    <text x="{target_right_x}" y="{tags_data[2]["y"]+tag_h+66}" class="lbl-sub">(Siêu dữ liệu định danh dùng lọc &amp; trích dẫn)</text>')
    lines.append('  </g>')

    # =========================================================================
    # 8. CAPTION AT BOTTOM
    # =========================================================================
    lines.append('  <!-- ==================== ACADEMIC CAPTION ==================== -->')
    lines.append('  <g id="Academic_Caption">')
    if mode == "standard":
        lines.append(f'    <text x="{center_x}" y="980" class="caption-txt">')
        lines.append(f'      <tspan x="{center_x}" dy="0">Hình 4: Minh họa quy trình rút trích</tspan>')
        lines.append(f'      <tspan x="{center_x}" dy="30">văn bản từ các nguồn dữ liệu.</tspan>')
        lines.append('    </text>')
    else:
        lines.append(f'    <text x="{center_x}" y="985" class="caption-txt">')
        lines.append(f'      <tspan x="{center_x}" dy="0">Hình 2.4: Quy trình tiền xử lý, bóc tách cấu trúc và rút trích siêu dữ liệu</tspan>')
        lines.append(f'      <tspan x="{center_x}" dy="30">từ tài liệu bưu chính trong Hệ thống Nexus Logistics.</tspan>')
        lines.append('    </text>')
    lines.append('  </g>')

    lines.append('</svg>')
    return "\n".join(lines)

if __name__ == "__main__":
    # 1. Standard Textbook Version (Replicating exact sample)
    std_svg = generate_extraction_svg(mode="standard")
    ET.fromstring(std_svg)
    std_path = "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/04-document-text-and-metadata-extraction.svg"
    os.makedirs(os.path.dirname(std_path), exist_ok=True)
    with open(std_path, "w", encoding="utf-8") as f:
        f.write(std_svg)
    print(f"✓ Generated standard version: {std_path} ({len(std_svg.encode('utf-8'))} bytes)")

    # 2. Logistics Applied Version (Nexus Logistics specific)
    log_svg = generate_extraction_svg(mode="logistics")
    ET.fromstring(log_svg)
    log_path = "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/04-logistics-document-metadata-extraction.svg"
    with open(log_path, "w", encoding="utf-8") as f:
        f.write(log_svg)
    print(f"✓ Generated logistics version: {log_path} ({len(log_svg.encode('utf-8'))} bytes)")
