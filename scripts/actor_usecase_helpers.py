#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE ACTOR-SPECIFIC USE CASE DIAGRAMS (MONOCHROME UML 2.5 BLUEPRINT)
========================================================================
Thiết kế và kết xuất bộ sơ đồ Use Case chi tiết cho từng tác nhân (Actor-specific Use Case Diagrams)
phục vụ viết thuyết minh Khóa luận tốt nghiệp:
1. Actor Quản Trị Viên (System Admin) - admin-web (11 Use Cases)
2. Actor Nhân Viên Vận Hành (Ops Staff - Bưu Cục & Hub) - ops-web (19 Use Cases)
3. Actor Nhân Viên Giao Hàng (Shipper / Courier) - courier-mobile (13 Use Cases)
4. Actor Người Gửi Hàng (Merchant / Chủ Shop B2B) - merchant-web (15 Use Cases)
5. Actor Khách Hàng Cá Nhân (Customer C-End) - customer-app (6 Use Cases)
6. Actor Khách Vãng Lai (Guest / Tra Cứu Công Khai) - public-tracking (9 Use Cases)

Đặc điểm kỹ thuật:
- Chuẩn OMG UML 2.5, Monochrome Technical Blueprint Design System.
- 100% Native Inline Vector, KHÔNG sử dụng thẻ <marker> (Tương thích hoàn hảo Figma & In ấn 300 DPI).
- Mã chức năng chuẩn hóa (UC-ADM-xx, UC-OPS-xx, UC-DRV-xx, UC-MER-xx, UC-CUS-xx, UC-GST-xx).
- Phân định rõ Use Case [Kế thừa] vs [MỚI] để làm nổi bật đóng góp của đề tài.
- Trình bày dạng các Phân hệ nghiệp vụ (UML Packages) có ranh giới rõ ràng, không giao cắt đường kẻ.
"""

import os
import math

def xml_esc(text):
    s = str(text)
    # Normalize previously escaped entities to avoid double-escaping
    s = s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

def calc_ellipse_point(cx, cy, rx, ry, from_x, from_y):
    dx = from_x - cx
    dy = from_y - cy
    if dx == 0 and dy == 0:
        return cx, cy
    angle = math.atan2(dy, dx)
    return cx + rx * math.cos(angle), cy + ry * math.sin(angle)

def draw_pill_plate(x, y, text, plate_type="new"):
    w = len(text) * 8.5 + 14
    h = 20
    rx = 3
    if plate_type == "new":
        fill = "#000000"
        text_color = "#FFFFFF"
        stroke = "#000000"
    elif plate_type == "inherit":
        fill = "#EEEEEE"
        text_color = "#444444"
        stroke = "#999999"
    else:
        fill = "#FFFFFF"
        text_color = "#000000"
        stroke = "#666666"
        
    res = [
        f'      <rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="0.8"/>',
        f'      <text x="{x + w/2:.1f}" y="{y + 14.5:.1f}" font-family="Segoe UI, Arial" font-size="11.5" font-weight="bold" fill="{text_color}" text-anchor="middle">{xml_esc(text)}</text>'
    ]
    return "\n".join(res), w

def draw_usecase(cx, cy, rx, ry, ucid, title, status="MỚI", is_abstract=False):
    res = []
    dash = ' stroke-dasharray="5 3"' if is_abstract else ''
    res.append(f'    <g id="UC_{ucid}">')
    res.append(f'      <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"{dash}/>')
    
    # Status pill & UCID typography
    plate_type = "new" if status.upper() == "MỚI" else "inherit"
    pill_text = "MỚI" if status.upper() == "MỚI" else "KẾ THỪA"
    
    if rx <= 112:
        ucid_size = 13.5
        ucid_w = len(ucid) * 8.2
        pill_w = 34 if status.upper() == "MỚI" else 58
        pill_h = 18
        pill_font_size = 10.5
        gap = 6
        total_w = ucid_w + gap + pill_w
        start_x = cx - total_w / 2
        ucid_center_x = start_x + ucid_w / 2
        pill_x = start_x + ucid_w + gap
        res.append(f'      <text x="{ucid_center_x:.1f}" y="{cy - 5:.1f}" font-family="Courier New, monospace" font-size="{ucid_size}" font-weight="bold" fill="#000000" text-anchor="middle">{xml_esc(ucid)}</text>')
        
        # Pill Plate
        if plate_type == "new":
            fill, text_color, stroke = "#000000", "#FFFFFF", "#000000"
        elif plate_type == "inherit":
            fill, text_color, stroke = "#EEEEEE", "#444444", "#999999"
        else:
            fill, text_color, stroke = "#FFFFFF", "#000000", "#666666"
        res.append(f'      <rect x="{pill_x:.1f}" y="{cy - 17:.1f}" width="{pill_w:.1f}" height="{pill_h}" rx="3.5" fill="{fill}" stroke="{stroke}" stroke-width="0.9"/>')
        res.append(f'      <text x="{pill_x + pill_w/2:.1f}" y="{cy - 4:.1f}" font-family="Segoe UI, Arial" font-size="{pill_font_size}" font-weight="bold" fill="{text_color}" text-anchor="middle">{xml_esc(pill_text)}</text>')
        
        title_font_size = 13.5 if len(title) > 24 else 14.5
        title_y = cy + 15
    else:
        ucid_size = 15.0
        ucid_w = len(ucid) * 9.0
        pill_w = 40 if status.upper() == "MỚI" else 66
        pill_h = 20
        pill_font_size = 11.5
        gap = 7
        total_w = ucid_w + gap + pill_w
        start_x = cx - total_w / 2
        ucid_center_x = start_x + ucid_w / 2
        pill_x = start_x + ucid_w + gap
        res.append(f'      <text x="{ucid_center_x:.1f}" y="{cy - 6:.1f}" font-family="Courier New, monospace" font-size="{ucid_size}" font-weight="bold" fill="#000000" text-anchor="middle">{xml_esc(ucid)}</text>')
        
        # Pill Plate
        if plate_type == "new":
            fill, text_color, stroke = "#000000", "#FFFFFF", "#000000"
        elif plate_type == "inherit":
            fill, text_color, stroke = "#EEEEEE", "#444444", "#999999"
        else:
            fill, text_color, stroke = "#FFFFFF", "#000000", "#666666"
        res.append(f'      <rect x="{pill_x:.1f}" y="{cy - 19:.1f}" width="{pill_w:.1f}" height="{pill_h}" rx="4" fill="{fill}" stroke="{stroke}" stroke-width="0.9"/>')
        res.append(f'      <text x="{pill_x + pill_w/2:.1f}" y="{cy - 5:.1f}" font-family="Segoe UI, Arial" font-size="{pill_font_size}" font-weight="bold" fill="{text_color}" text-anchor="middle">{xml_esc(pill_text)}</text>')
        
        title_font_size = 14.5 if len(title) > 28 else (15.5 if len(title) > 23 else 16.5)
        title_y = cy + 17
    
    # Lower row: Title
    font_style = ' font-style="italic"' if is_abstract else ''
    res.append(f'      <text x="{cx}" y="{title_y}" font-family="Segoe UI, Arial" font-size="{title_font_size}" font-weight="600" fill="#111111" text-anchor="middle"{font_style}>{xml_esc(title)}</text>')
    res.append('    </g>')
    return "\n".join(res)

def draw_actor(cx, cy, name, role, app, metric_text=""):
    res = []
    safe_id = name.replace(" ", "_").replace("/", "_").replace("&", "_")
    res.append(f'  <g id="Actor_{safe_id}">')
    # Stick figure (Enlarged head & bolder limbs)
    res.append(f'    <circle cx="{cx}" cy="{cy-56}" r="28" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>')
    res.append(f'    <line x1="{cx}" y1="{cy-28}" x2="{cx}" y2="{cy+32}" stroke="#000000" stroke-width="2.8" stroke-linecap="round"/>')
    lines_arm = cy - 2
    res.append(f'    <line x1="{cx-38}" y1="{lines_arm}" x2="{cx+38}" y2="{lines_arm}" stroke="#000000" stroke-width="2.8" stroke-linecap="round"/>')
    res.append(f'    <line x1="{cx}" y1="{cy+32}" x2="{cx-30}" y2="{cy+82}" stroke="#000000" stroke-width="2.8" stroke-linecap="round"/>')
    res.append(f'    <line x1="{cx}" y1="{cy+32}" x2="{cx+30}" y2="{cy+82}" stroke="#000000" stroke-width="2.8" stroke-linecap="round"/>')
    
    # Typography
    res.append(f'    <text x="{cx}" y="{cy+116}" font-family="Segoe UI, Arial" font-size="23" font-weight="bold" fill="#000000" text-anchor="middle">{xml_esc(name)}</text>')
    res.append(f'    <text x="{cx}" y="{cy+140}" font-family="Segoe UI, Arial" font-size="16" font-weight="500" fill="#4B5563" text-anchor="middle">{xml_esc(role)}</text>')
    
    # App box
    app_w = len(app) * 9.5 + 32
    res.append(f'    <rect x="{cx - app_w/2:.1f}" y="{cy+152}" width="{app_w:.1f}" height="32" rx="4" fill="#000000"/>')
    res.append(f'    <text x="{cx}" y="{cy+173}" font-family="Courier New, monospace" font-size="14.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">{xml_esc(app)}</text>')
    
    # Metric badge if any
    if metric_text:
        m_w = len(metric_text) * 8.5 + 28
        res.append(f'    <rect x="{cx - m_w/2:.1f}" y="{cy+192}" width="{m_w:.1f}" height="28" rx="4" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="0.9"/>')
        res.append(f'    <text x="{cx}" y="{cy+210}" font-family="Segoe UI, Arial" font-size="13.5" font-weight="600" fill="#374151" text-anchor="middle">{xml_esc(metric_text)}</text>')
        
    res.append('  </g>')
    return "\n".join(res)

def draw_header(width, main_title, sub_title, drawing_code, actor_code):
    res = []
    res.append('  <!-- ==================== HEADER ==================== -->')
    res.append('  <g id="Header">')
    res.append(f'    <rect x="24" y="24" width="{width-48}" height="82" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>')
    res.append(f'    <text x="44" y="58" font-family="Segoe UI, Arial" font-size="22" font-weight="bold" fill="#000000" letter-spacing="0.3px">{xml_esc(main_title)}</text>')
    res.append(f'    <text x="44" y="85" font-family="Segoe UI, Arial" font-size="15.5" fill="#4B5563">{xml_esc(sub_title)}</text>')
    
    box_w = 390
    res.append(f'    <rect x="{width - 24 - box_w}" y="30" width="{box_w - 6}" height="70" fill="#F9FAFB" stroke="#000000" stroke-width="1.3"/>')
    res.append(f'    <text x="{width - 24 - box_w + 14}" y="52" font-family="Segoe UI, Arial" font-size="14" font-weight="bold" fill="#000000">MÃ BẢN VẼ: {xml_esc(drawing_code)}</text>')
    res.append(f'    <text x="{width - 24 - box_w + 14}" y="71" font-family="Courier New, monospace" font-size="13" font-weight="bold" fill="#1F2937">TÁC NHÂN: {xml_esc(actor_code)} • UML 2.5</text>')
    res.append(f'    <text x="{width - 24 - box_w + 14}" y="89" font-family="Segoe UI, Arial" font-size="12" fill="#6B7280">100% NATIVE VECTOR • 300 DPI READY</text>')
    res.append('  </g>')
    return "\n".join(res)

def draw_package(x, y, w, h, tab_w, title, pkg_id, tab_x_offset=0):
    tab_h = 36
    tx = x + tab_x_offset
    res = []
    res.append(f'  <g id="{pkg_id}">')
    res.append(f'    <rect x="{x}" y="{y+tab_h}" width="{w}" height="{h-tab_h}" rx="5" fill="#FAFAFA" stroke="#000000" stroke-width="1.6"/>')
    res.append(f'    <path d="M {tx},{y+tab_h} L {tx},{y+4} Q {tx},{y} {tx+4},{y} L {tx+tab_w-15},{y} L {tx+tab_w},{y+tab_h} Z" fill="#E2E8F0" stroke="#000000" stroke-width="1.6"/>')
    res.append(f'    <text x="{tx+16}" y="{y+24}" font-family="Segoe UI, Arial" font-size="16.5" font-weight="bold" fill="#000000">{xml_esc(title)}</text>')
    res.append('  </g>')
    return "\n".join(res)

def draw_assoc_line(x1, y1, cx, cy, rx, ry):
    x2, y2 = calc_ellipse_point(cx, cy, rx, ry, x1, y1)
    return f'  <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#222222" stroke-width="1.3" fill="none"/>'

def draw_assoc_polyline(points, cx, cy, rx, ry):
    """Draws a polyline from point 0 to N-1, and calculates intersection with ellipse for endpoint"""
    last_x, last_y = points[-1]
    prev_x, prev_y = points[-2] if len(points) >= 2 else (last_x, last_y)
    x_end, y_end = calc_ellipse_point(cx, cy, rx, ry, prev_x, prev_y)
    
    pts_str = " ".join([f"{p[0]:.1f},{p[1]:.1f}" for p in points[:-1]]) + f" {x_end:.1f},{y_end:.1f}"
    return f'  <polyline points="{pts_str}" stroke="#222222" stroke-width="1.3" fill="none"/>'

def draw_dependency_arrow(cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2, label="«include»", label_offset=14):
    x1, y1 = calc_ellipse_point(cx1, cy1, rx1, ry1, cx2, cy2)
    x2, y2 = calc_ellipse_point(cx2, cy2, rx2, ry2, cx1, cy1)
    dx = x2 - x1
    dy = y2 - y1
    dist = math.hypot(dx, dy)
    if dist == 0:
        return ""
    ux = dx / dist
    uy = dy / dist
    
    tip_x, tip_y = x2, y2
    base_x = tip_x - ux * 10
    base_y = tip_y - uy * 10
    p1_x = base_x - uy * 4.5
    p1_y = base_y + ux * 4.5
    p2_x = base_x + uy * 4.5
    p2_y = base_y - ux * 4.5
    
    mid_x = (x1 + x2) / 2
    mid_y = (y1 + y2) / 2
    lbl_x = mid_x - uy * label_offset
    lbl_y = mid_y + ux * label_offset
    
    res = [
        f'  <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{base_x:.1f}" y2="{base_y:.1f}" stroke="#000000" stroke-width="1.4" stroke-dasharray="5 3" fill="none"/>',
        f'  <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" fill="#000000" stroke="#000000" stroke-width="0.5"/>'
    ]
    if label:
        pill_w = len(label) * 7.5 + 14
        pill_h = 20
        res.append(f'  <rect x="{lbl_x - pill_w/2:.1f}" y="{lbl_y - pill_h/2:.1f}" width="{pill_w:.1f}" height="{pill_h}" fill="#FFFFFF" stroke="#000000" stroke-width="1.1" rx="3.5"/>')
        res.append(f'  <text x="{lbl_x:.1f}" y="{lbl_y + 4.0:.1f}" font-family="Courier New, monospace" font-size="11.5" font-weight="bold" fill="#000000" text-anchor="middle">{xml_esc(label)}</text>')
    return "\n".join(res)

def draw_manhattan_dep_arrow(points, label="«include»", pill_x=None, pill_y=None):
    if len(points) < 2:
        return ""
    p_last = points[-1]
    p_prev = points[-2]
    dx = p_last[0] - p_prev[0]
    dy = p_last[1] - p_prev[1]
    dist = math.hypot(dx, dy)
    if dist == 0:
        return ""
    ux = dx / dist
    uy = dy / dist
    
    tip_x, tip_y = p_last
    base_x = tip_x - ux * 11
    base_y = tip_y - uy * 11
    p1_x = base_x - uy * 5.0
    p1_y = base_y + ux * 5.0
    p2_x = base_x + uy * 5.0
    p2_y = base_y - ux * 5.0
    
    # Path line points up to base
    pts_copy = list(points[:-1]) + [(base_x, base_y)]
    pts_str = " ".join([f"{p[0]:.1f},{p[1]:.1f}" for p in pts_copy])
    
    res = [
        f'  <polyline points="{pts_str}" stroke="#000000" stroke-width="1.4" stroke-dasharray="5 3" fill="none"/>',
        f'  <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" fill="#000000" stroke="#000000" stroke-width="0.5"/>'
    ]
    if label:
        if pill_x is None or pill_y is None:
            # Default to midpoint of longest segment
            mid_idx = len(points) // 2
            pill_x = (points[mid_idx-1][0] + points[mid_idx][0]) / 2
            pill_y = (points[mid_idx-1][1] + points[mid_idx][1]) / 2
        pill_w = len(label) * 7.5 + 14
        pill_h = 20
        res.append(f'  <rect x="{pill_x - pill_w/2:.1f}" y="{pill_y - pill_h/2:.1f}" width="{pill_w:.1f}" height="{pill_h}" fill="#FFFFFF" stroke="#000000" stroke-width="1.1" rx="3.5"/>')
        res.append(f'  <text x="{pill_x:.1f}" y="{pill_y + 4.0:.1f}" font-family="Courier New, monospace" font-size="11.5" font-weight="bold" fill="#000000" text-anchor="middle">{xml_esc(label)}</text>')
    return "\n".join(res)

def draw_distributed_actor_assocs(actor_cx, actor_cy, targets):
    """
    Draws association lines from actor to multiple use case targets.
    Distributes start positions vertically on actor's right side to avoid overlapping/clumping.
    """
    sorted_targets = sorted(targets, key=lambda t: t[1])
    n = len(sorted_targets)
    if n == 0:
        return ""
    res = []
    y_spread = 110
    y_start = actor_cy - y_spread / 2
    for i, (tcx, tcy, trx, try_) in enumerate(sorted_targets):
        orig_y = y_start + (i / max(1, n - 1)) * y_spread if n > 1 else actor_cy
        orig_x = actor_cx + 38
        res.append(draw_assoc_line(orig_x, orig_y, tcx, tcy, trx, try_))
    return "\n".join(res)



def draw_footer_legend(width, height):
    y = height - 76
    res = []
    res.append('  <!-- ==================== FOOTER & LEGEND ==================== -->')
    res.append('  <g id="Footer_Legend">')
    res.append(f'    <rect x="24" y="{y}" width="{width-48}" height="56" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>')
    
    items = [
        ("Tác nhân (Actor)", "actor"),
        ("Use Case", "uc"),
        ("MỚI (Đề tài)", "new_pill"),
        ("Kế thừa", "inherit_pill"),
        ("Liên kết (Assoc)", "line"),
        ("«include» Bắt buộc", "dep_inc"),
        ("«extend» Mở rộng", "dep_ext")
    ]
    
    start_x = 55 if width >= 1520 else 44
    gap = 205 if width >= 1520 else 195
    for idx, (label, itype) in enumerate(items):
        ix = start_x + idx * gap
        if itype == "actor":
            res.append(f'    <circle cx="{ix}" cy="{y+28}" r="10" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>')
            res.append(f'    <text x="{ix+20}" y="{y+34}" font-family="Segoe UI, Arial" font-size="14" font-weight="600" fill="#000000">{xml_esc(label)}</text>')
        elif itype == "uc":
            res.append(f'    <ellipse cx="{ix+14}" cy="{y+28}" rx="16" ry="11" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>')
            res.append(f'    <text x="{ix+38}" y="{y+34}" font-family="Segoe UI, Arial" font-size="14" font-weight="600" fill="#000000">{xml_esc(label)}</text>')
        elif itype == "new_pill":
            res.append(f'    <rect x="{ix}" y="{y+18}" width="42" height="20" rx="3.5" fill="#000000"/>')
            res.append(f'    <text x="{ix+21}" y="{y+33}" font-family="Segoe UI, Arial" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle">MỚI</text>')
            res.append(f'    <text x="{ix+50}" y="{y+34}" font-family="Segoe UI, Arial" font-size="14" font-weight="600" fill="#000000">{xml_esc(label)}</text>')
        elif itype == "inherit_pill":
            res.append(f'    <rect x="{ix}" y="{y+18}" width="60" height="20" rx="3.5" fill="#EEEEEE" stroke="#999999" stroke-width="0.9"/>')
            res.append(f'    <text x="{ix+30}" y="{y+33}" font-family="Segoe UI, Arial" font-size="11" font-weight="bold" fill="#444444" text-anchor="middle">KẾ THỪA</text>')
            res.append(f'    <text x="{ix+68}" y="{y+34}" font-family="Segoe UI, Arial" font-size="14" font-weight="600" fill="#000000">{xml_esc(label)}</text>')
        elif itype == "line":
            res.append(f'    <line x1="{ix}" y1="{y+28}" x2="{ix+30}" y2="{y+28}" stroke="#000000" stroke-width="1.8"/>')
            res.append(f'    <text x="{ix+38}" y="{y+34}" font-family="Segoe UI, Arial" font-size="14" font-weight="600" fill="#000000">{xml_esc(label)}</text>')
        elif itype == "dep_inc":
            res.append(f'    <line x1="{ix}" y1="{y+28}" x2="{ix+26}" y2="{y+28}" stroke="#000000" stroke-width="1.6" stroke-dasharray="4 3"/>')
            res.append(f'    <polygon points="{ix+31},{y+28} {ix+23},{y+24} {ix+23},{y+32}" fill="#000000"/>')
            res.append(f'    <text x="{ix+38}" y="{y+34}" font-family="Segoe UI, Arial" font-size="14" font-weight="600" fill="#000000">{xml_esc(label)}</text>')
        elif itype == "dep_ext":
            res.append(f'    <line x1="{ix}" y1="{y+28}" x2="{ix+26}" y2="{y+28}" stroke="#000000" stroke-width="1.6" stroke-dasharray="4 3"/>')
            res.append(f'    <polygon points="{ix+31},{y+28} {ix+23},{y+24} {ix+23},{y+32}" fill="#000000"/>')
            res.append(f'    <text x="{ix+38}" y="{y+34}" font-family="Segoe UI, Arial" font-size="14" font-weight="600" fill="#000000">{xml_esc(label)}</text>')
            
    res.append('  </g>')
    return "\n".join(res)

def wrap_svg(width, height, content):
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">',
        '  <defs>',
        '    <style type="text/css"><![CDATA[',
        '      .bg { fill: #FFFFFF; }',
        '      .frame { fill: none; stroke: #000000; stroke-width: 2.2; }',
        '      .frame-inner { fill: none; stroke: #666666; stroke-width: 0.8; stroke-dasharray: 6 3; }',
        '      .sys-border { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; }',
        '      .sys-header { fill: #F0F4F8; stroke: #000000; stroke-width: 1.6; }',
        '      .t-sys { font-family: "Segoe UI", Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }',
        '    ]]></style>',
        '  </defs>',
        '  <!-- BACKGROUND -->',
        f'  <rect width="{width}" height="{height}" class="bg"/>',
        f'  <rect x="12" y="12" width="{width-24}" height="{height-24}" class="frame"/>',
        f'  <rect x="18" y="18" width="{width-36}" height="{height-36}" class="frame-inner"/>',
        content,
        '</svg>'
    ]
    return "\n".join(lines)
