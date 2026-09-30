#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generator for Nexus Master UML Use Case Diagram in Visual Paradigm Modern Enterprise Style.
Standard: OMG UML 2.5 / IEEE 830 / ISO/IEC 25010
Theme: Visual Paradigm Modern Enterprise (Soft Sky Blue Gradients, 2.5D Elevation Shadows, Folder-Tab Packages, Guillemets «include»/«extend», Zero <marker> tags)
Canvas: 7500 x 4600 px
"""

import os
import math

def generate_svg():
    width = 7500
    height = 4600

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%">')
    lines.append('  <defs>')
    # Pure Vector Definitions (100% Native Figma Compatible - Zero Filters)
    lines.append('    <!-- Gradients: Modern Enterprise VP Palette -->')
    lines.append('    <linearGradient id="vp-grad-core" x1="0%" y1="0%" x2="0%" y2="100%">')
    lines.append('      <stop offset="0%" stop-color="#FFFFFF"/>')
    lines.append('      <stop offset="100%" stop-color="#E2EEF8"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="vp-grad-std" x1="0%" y1="0%" x2="0%" y2="100%">')
    lines.append('      <stop offset="0%" stop-color="#FFFFFF"/>')
    lines.append('      <stop offset="100%" stop-color="#EDF4FA"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="vp-grad-abs" x1="0%" y1="0%" x2="0%" y2="100%">')
    lines.append('      <stop offset="0%" stop-color="#F8FAFC"/>')
    lines.append('      <stop offset="100%" stop-color="#E2E8F0"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="vp-grad-ext" x1="0%" y1="0%" x2="0%" y2="100%">')
    lines.append('      <stop offset="0%" stop-color="#FFFFFF"/>')
    lines.append('      <stop offset="100%" stop-color="#F1F5F9"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="vp-pkg-tab-grad" x1="0%" y1="0%" x2="0%" y2="100%">')
    lines.append('      <stop offset="0%" stop-color="#E6F0FA"/>')
    lines.append('      <stop offset="100%" stop-color="#CFE2F2"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="vp-sys-header-grad" x1="0%" y1="0%" x2="0%" y2="100%">')
    lines.append('      <stop offset="0%" stop-color="#EDF4FA"/>')
    lines.append('      <stop offset="100%" stop-color="#D5E4F3"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="vp-badge-grad" x1="0%" y1="0%" x2="0%" y2="100%">')
    lines.append('      <stop offset="0%" stop-color="#FFFFFF"/>')
    lines.append('      <stop offset="100%" stop-color="#EDF4FA"/>')
    lines.append('    </linearGradient>')
    lines.append('')
    lines.append('    <style><![CDATA[')
    lines.append('      /* ===== TYPOGRAPHY (VISUAL PARADIGM ENTERPRISE) ===== */')
    lines.append('      .t-main { font-family: "Segoe UI", Arial, sans-serif; font-size: 26px; font-weight: bold; fill: #0F2942; letter-spacing: 0.5px; }')
    lines.append('      .t-sub { font-family: "Segoe UI", Arial, sans-serif; font-size: 14px; fill: #475569; }')
    lines.append('      .t-boundary { font-family: "Segoe UI", Arial, sans-serif; font-size: 15px; font-weight: bold; fill: #1E3A5F; letter-spacing: 0.8px; }')
    lines.append('      .t-pkg { font-family: "Segoe UI", Arial, sans-serif; font-size: 13.5px; font-weight: bold; fill: #1E3A5F; letter-spacing: 0.3px; }')
    lines.append('      .t-actor { font-family: "Segoe UI", Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #0F2942; text-anchor: middle; }')
    lines.append('      .t-role { font-family: "Segoe UI", Arial, sans-serif; font-size: 12.5px; font-weight: 500; fill: #475569; text-anchor: middle; }')
    lines.append('      .t-app { font-family: "Courier New", monospace; font-size: 11.5px; font-weight: bold; fill: #2B4C6F; text-anchor: middle; }')
    lines.append('      ')
    lines.append('      .t-ucid { font-family: "Segoe UI", Arial, sans-serif; font-size: 11.5px; font-weight: bold; fill: #244B7A; text-anchor: middle; }')
    lines.append('      .t-uc { font-family: "Segoe UI", Arial, sans-serif; font-size: 12.5px; font-weight: 600; fill: #0F172A; text-anchor: middle; }')
    lines.append('      .t-uc-abs { font-family: "Segoe UI", Arial, sans-serif; font-size: 12px; font-weight: bold; font-style: italic; fill: #334155; text-anchor: middle; }')
    lines.append('      .t-rel { font-family: "Segoe UI", Arial, sans-serif; font-size: 11px; font-style: italic; font-weight: bold; fill: #1E3A5F; text-anchor: middle; }')
    lines.append('      .t-badge { font-family: "Segoe UI", Arial, sans-serif; font-size: 11.5px; font-weight: bold; fill: #1E3A5F; text-anchor: middle; }')
    lines.append('      .t-legend { font-family: "Segoe UI", Arial, sans-serif; font-size: 12.5px; fill: #1E293B; }')
    lines.append('      .t-note { font-family: "Segoe UI", Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #0F2942; }')
    lines.append('')
    lines.append('      /* ===== SHAPES & STROKES ===== */')
    lines.append('      .bg { fill: #FBFCFE; }')
    lines.append('      .frame { fill: none; stroke: #335A88; stroke-width: 2.2; }')
    lines.append('      .frame-inner { fill: none; stroke: #94A3B8; stroke-width: 0.8; }')
    lines.append('      .sys-border { fill: #FFFFFF; stroke: #2D4A70; stroke-width: 2.2; }')
    lines.append('      .sys-header { fill: url(#vp-sys-header-grad); stroke: #2D4A70; stroke-width: 1.6; }')
    lines.append('      .pkg-body { fill: #F8FAFD; stroke: #4C769E; stroke-width: 1.4; }')
    lines.append('      .pkg-tab { fill: url(#vp-pkg-tab-grad); stroke: #4C769E; stroke-width: 1.4; }')
    lines.append('      .gateway-body { fill: #F6F9FD; stroke: #2D5B88; stroke-width: 1.8; stroke-dasharray: 6 3.5; }')
    lines.append('      .gateway-tab { fill: #DCE8F4; stroke: #2D5B88; stroke-width: 1.6; }')
    lines.append('')
    lines.append('      /* Use Cases (Visual Paradigm 2.5D Shading - Pure Vector Native) */')
    lines.append('      .uc-core { fill: url(#vp-grad-core); stroke: #204B76; stroke-width: 2.2; }')
    lines.append('      .uc { fill: url(#vp-grad-std); stroke: #4C769E; stroke-width: 1.4; }')
    lines.append('      .uc-abstract { fill: url(#vp-grad-abs); stroke: #475569; stroke-width: 1.6; stroke-dasharray: 5 3; }')
    lines.append('      .uc-ext { fill: url(#vp-grad-ext); stroke: #4C769E; stroke-width: 1.4; stroke-dasharray: 5 3; }')
    lines.append('')
    lines.append('      /* Actors */')
    lines.append('      .actor-head { fill: #FFFFFF; stroke: #0F2942; stroke-width: 2.2; }')
    lines.append('      .actor-body { stroke: #0F2942; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .sys-actor-box { fill: #EDF4FA; stroke: #2E5B88; stroke-width: 1.8; rx: 6px; }')
    lines.append('')
    lines.append('      /* Connectors & Arrows */')
    lines.append('      .assoc { stroke: #243B53; stroke-width: 1.4; fill: none; }')
    lines.append('      .assoc-corr { stroke: #243B53; stroke-width: 1.4; fill: none; stroke-linejoin: round; }')
    lines.append('      .gen-line { stroke: #243B53; stroke-width: 1.6; fill: none; stroke-linejoin: round; }')
    lines.append('      .gen-arrow { fill: #FFFFFF; stroke: #243B53; stroke-width: 1.6; }')
    lines.append('      .dep-line { stroke: #334E68; stroke-width: 1.3; stroke-dasharray: 6 3.5; fill: none; stroke-linejoin: round; }')
    lines.append('      .dep-arrow { fill: #334E68; stroke: #334E68; stroke-width: 0.5; }')
    lines.append('      .badge-rect { fill: url(#vp-badge-grad); stroke: #4C769E; stroke-width: 0.9; rx: 5px; }')
    lines.append('      .pill-plate { fill: #FFFFFF; stroke: #94A3B8; stroke-width: 0.8; rx: 4px; }')
    lines.append('    ]]></style>')
    lines.append('  </defs>')
    lines.append('')
    lines.append('  <!-- CANVAS BACKGROUND & DOUBLE BORDER -->')
    lines.append(f'  <rect width="{width}" height="{height}" class="bg"/>')
    lines.append(f'  <rect x="20" y="20" width="{width-40}" height="{height-40}" class="frame"/>')
    lines.append(f'  <rect x="26" y="26" width="{width-52}" height="{height-52}" class="frame-inner"/>')
    lines.append('')

    # HEADER BLOCK
    lines.append('  <!-- ==================== HEADER ==================== -->')
    lines.append('  <g id="Header">')
    lines.append(f'    <rect x="43" y="43" width="{width-80}" height="102" fill="#0F2438" fill-opacity="0.04" rx="4"/>')
    lines.append(f'    <rect x="40" y="40" width="{width-80}" height="102" fill="#FFFFFF" stroke="#335A88" stroke-width="1.8"/>')
    lines.append('    <text x="70" y="80" class="t-main">SƠ ĐỒ USE CASE TỔNG QUÁT HỆ THỐNG NEXUS LOGISTICS (CHUẨN VISUAL PARADIGM &amp; BA / SRS)</text>')
    lines.append('    <text x="70" y="116" class="t-sub">Mô hình hóa Toàn diện 82 Yêu cầu Nghiệp vụ Thực có • 7 Tác nhân • 6 Phân hệ Folder-Tab • Đại lộ 300px • Bo góc Bezier R=24px • Phong cách Visual Paradigm Modern Enterprise</text>')
    lines.append(f'    <rect x="{width-540}" y="52" width="490" height="78" fill="url(#vp-sys-header-grad)" stroke="#335A88" stroke-width="1.2"/>')
    lines.append(f'    <text x="{width-520}" y="82" font-family="\'Segoe UI\', Arial" font-size="14.5" font-weight="bold" fill="#0F2942">MÃ BẢN VẼ: UC-SYS-REAL-01 (REV.20-VP)</text>')
    lines.append(f'    <text x="{width-520}" y="110" font-family="\'Segoe UI\', Arial" font-size="12" fill="#334E68">TIÊU CHUẨN: OMG UML 2.5 • VISUAL PARADIGM ENTERPRISE</text>')
    lines.append('  </g>')
    lines.append('')

    # SYSTEM BOUNDARY (X: 720 to 6780, Width: 6060, Height: 3980)
    sb_x = 720
    sb_y = 170
    sb_w = 6060
    sb_h = 3980
    lines.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    lines.append('  <g id="System_Boundary">')
    lines.append(f'    <rect x="{sb_x+4}" y="{sb_y+4}" width="{sb_w}" height="{sb_h}" rx="8" fill="#0F2438" fill-opacity="0.03"/>')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="2100" height="42" class="sys-header"/>')
    lines.append(f'    <text x="{sb_x+30}" y="{sb_y+28}" class="t-boundary">«system» RANH GIỚI HỆ THỐNG: NEXUS ENTERPRISE LOGISTICS PLATFORM (15 BACKEND MICROSERVICES &amp; 6 CLIENT APPS)</text>')
    lines.append('  </g>')
    lines.append('')

    # HELPER FUNCTIONS
    def uc(cx, cy, rx, ry, ucid, title, uctype="uc"):
        res = []
        # Pure Vector 2.5D Elevation Shadow (Visual Paradigm signature, 100% Figma vector native)
        res.append(f'    <ellipse cx="{cx+3:.1f}" cy="{cy+3.5:.1f}" rx="{rx}" ry="{ry}" fill="#0F2438" fill-opacity="0.08"/>')
        res.append(f'    <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" class="{uctype}"/>')
        safe_title = title.replace('&amp;', '&').replace('&', '&amp;')
        if uctype == "uc-abstract":
            res.append(f'    <text x="{cx}" y="{cy-14}" class="t-rel">«abstract»</text>')
            res.append(f'    <text x="{cx}" y="{cy+2}" class="t-ucid">{ucid}</text>')
            res.append(f'    <text x="{cx}" y="{cy+19}" class="t-uc-abs">{safe_title}</text>')
        else:
            res.append(f'    <text x="{cx}" y="{cy-6}" class="t-ucid">{ucid}</text>')
            res.append(f'    <text x="{cx}" y="{cy+14}" class="t-uc">{safe_title}</text>')
        return "\n".join(res)

    def ellipse_point(cx, cy, rx, ry, from_x, from_y):
        dx = from_x - cx
        dy = from_y - cy
        if dx == 0 and dy == 0:
            return cx, cy
        angle = math.atan2(dy, dx)
        return cx + rx * math.cos(angle), cy + ry * math.sin(angle)

    def direct_line(x1, y1, cx, cy, rx, ry, stroke_class="assoc"):
        x2, y2 = ellipse_point(cx, cy, rx, ry, x1, y1)
        return f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" class="{stroke_class}"/>'

    def rounded_path_d(points, radius=24):
        if len(points) < 2:
            return ""
        if len(points) == 2:
            return f"M {points[0][0]:.1f} {points[0][1]:.1f} L {points[1][0]:.1f} {points[1][1]:.1f}"
        
        d = [f"M {points[0][0]:.1f} {points[0][1]:.1f}"]
        for i in range(1, len(points) - 1):
            p_prev = points[i-1]
            p_curr = points[i]
            p_next = points[i+1]
            
            dx1 = p_curr[0] - p_prev[0]
            dy1 = p_curr[1] - p_prev[1]
            d1 = math.hypot(dx1, dy1)
            
            dx2 = p_next[0] - p_curr[0]
            dy2 = p_next[1] - p_curr[1]
            d2 = math.hypot(dx2, dy2)
            
            if d1 == 0 or d2 == 0:
                d.append(f"L {p_curr[0]:.1f} {p_curr[1]:.1f}")
                continue
                
            r = min(radius, d1 / 2.0, d2 / 2.0)
            
            start_x = p_curr[0] - (dx1 / d1) * r
            start_y = p_curr[1] - (dy1 / d1) * r
            
            end_x = p_curr[0] + (dx2 / d2) * r
            end_y = p_curr[1] + (dy2 / d2) * r
            
            d.append(f"L {start_x:.1f} {start_y:.1f}")
            d.append(f"Q {p_curr[0]:.1f} {p_curr[1]:.1f} {end_x:.1f} {end_y:.1f}")
            
        d.append(f"L {points[-1][0]:.1f} {points[-1][1]:.1f}")
        return " ".join(d)

    def path_to_ellipse(points, cx, cy, rx, ry, stroke_class="assoc-corr", radius=24, label=None, label_idx=1):
        if not points:
            return ""
        last_x, last_y = points[-1]
        x2, y2 = ellipse_point(cx, cy, rx, ry, last_x, last_y)
        all_pts = points + [(x2, y2)]
        d_str = rounded_path_d(all_pts, radius=radius)
        res = [f'    <path d="{d_str}" class="{stroke_class}"/>']
        if label and 0 <= label_idx < len(points):
            badge_x, badge_y = points[label_idx]
            safe_label = label.replace('&amp;', '&').replace('&', '&amp;')
            b_w = len(label) * 9.5 + 24
            b_h = 24
            res.append(f'    <rect x="{badge_x - b_w/2 + 1.5:.1f}" y="{badge_y - b_h/2 + 1.5:.1f}" width="{b_w:.1f}" height="{b_h}" rx="5" ry="5" fill="#0F2438" fill-opacity="0.06"/>')
            res.append(f'    <rect x="{badge_x - b_w/2:.1f}" y="{badge_y - b_h/2:.1f}" width="{b_w:.1f}" height="{b_h}" rx="5" ry="5" class="badge-rect"/>')
            res.append(f'    <text x="{badge_x:.1f}" y="{badge_y + 4.5:.1f}" class="t-badge">[{safe_label}]</text>')
        return "\n".join(res)

    def direct_dep_arrow(cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2, label="«include»", label_offset=18):
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
        base_x = tip_x - ux * 13
        base_y = tip_y - uy * 13
        p1_x = base_x - uy * 6.5
        p1_y = base_y + ux * 6.5
        p2_x = base_x + uy * 6.5
        p2_y = base_y - ux * 6.5

        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        lbl_x = mid_x - uy * label_offset
        lbl_y = mid_y + ux * label_offset

        clean_label = label.replace('<<', '«').replace('>>', '»')

        res = []
        res.append(f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{base_x:.1f}" y2="{base_y:.1f}" class="dep-line"/>')
        res.append(f'    <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" class="dep-arrow"/>')
        if clean_label:
            pill_w = len(clean_label) * 8.5 + 16
            pill_h = 22
            res.append(f'    <rect x="{lbl_x - pill_w/2 + 1.5:.1f}" y="{lbl_y - pill_h/2 - 0.5:.1f}" width="{pill_w:.1f}" height="{pill_h}" rx="4" ry="4" fill="#0F2438" fill-opacity="0.06"/>')
            res.append(f'    <rect x="{lbl_x - pill_w/2:.1f}" y="{lbl_y - pill_h/2 - 2:.1f}" width="{pill_w:.1f}" height="{pill_h}" rx="4" ry="4" class="pill-plate"/>')
            res.append(f'    <text x="{lbl_x:.1f}" y="{lbl_y+4.5:.1f}" class="t-rel">{clean_label}</text>')
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
        base_x = tip_x - ux * 16
        base_y = tip_y - uy * 16
        p1_x = base_x - uy * 9
        p1_y = base_y + ux * 9
        p2_x = base_x + uy * 9
        p2_y = base_y - ux * 9

        res = []
        res.append(f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{base_x:.1f}" y2="{base_y:.1f}" class="gen-line"/>')
        res.append(f'    <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" class="gen-arrow"/>')
        return "\n".join(res)

    def actor_stick(cx, cy, name, role, app, label_pos="bottom"):
        safe_name = name.replace('&amp;', '&').replace('&', '&amp;')
        safe_role = role.replace('&amp;', '&').replace('&', '&amp;')
        safe_app = app.replace('&amp;', '&').replace('&', '&amp;')
        res = []
        safe_id = name.replace(" ", "_").replace("&", "_").replace("(", "").replace(")", "").replace("__", "_")
        res.append(f'  <g id="Actor_{safe_id}">')
        res.append(f'    <circle cx="{cx+2}" cy="{cy-42}" r="22" fill="#0F2438" fill-opacity="0.08"/>')
        res.append(f'    <circle cx="{cx}" cy="{cy-44}" r="22" class="actor-head"/>')
        res.append(f'    <line x1="{cx}" y1="{cy-22}" x2="{cx}" y2="{cy+24}" class="actor-body"/>')
        res.append(f'    <line x1="{cx-36}" y1="{cy-4}" x2="{cx+36}" y2="{cy-4}" class="actor-body"/>')
        res.append(f'    <line x1="{cx}" y1="{cy+24}" x2="{cx-28}" y2="{cy+66}" class="actor-body"/>')
        res.append(f'    <line x1="{cx}" y1="{cy+24}" x2="{cx+28}" y2="{cy+66}" class="actor-body"/>')
        if label_pos == "bottom":
            res.append(f'    <text x="{cx}" y="{cy+96}" class="t-actor">{safe_name}</text>')
            res.append(f'    <text x="{cx}" y="{cy+118}" class="t-role">{safe_role}</text>')
            res.append(f'    <text x="{cx}" y="{cy+138}" class="t-app">{safe_app}</text>')
        else:
            res.append(f'    <text x="{cx}" y="{cy-82}" class="t-actor">{safe_name}</text>')
            res.append(f'    <text x="{cx}" y="{cy-64}" class="t-role">{safe_role}</text>')
            res.append(f'    <text x="{cx}" y="{cy-48}" class="t-app">{safe_app}</text>')
        res.append('  </g>')
        return "\n".join(res)

    def pkg_folder(x, y, w, h, tab_w, title, pkg_id, is_gateway=False):
        tab_h = 38
        res = []
        res.append(f'  <g id="{pkg_id}">')
        body_class = "gateway-body" if is_gateway else "pkg-body"
        tab_class = "gateway-tab" if is_gateway else "pkg-tab"
        # Pure Vector 2.5D Soft Shadow for folder container
        res.append(f'    <rect x="{x+3}" y="{y+tab_h+3}" width="{w}" height="{h-tab_h}" rx="6" ry="6" fill="#0F2438" fill-opacity="0.04"/>')
        res.append(f'    <rect x="{x}" y="{y+tab_h}" width="{w}" height="{h-tab_h}" rx="6" ry="6" class="{body_class}"/>')
        # Folder tab at top-left with angled cut
        res.append(f'    <path d="M {x},{y+tab_h} L {x},{y+6} Q {x},{y} {x+6},{y} L {x+tab_w-22},{y} L {x+tab_w},{y+tab_h} Z" class="{tab_class}"/>')
        safe_title = title.replace('&amp;', '&').replace('&', '&amp;')
        res.append(f'    <text x="{x+25}" y="{y+24}" class="t-pkg">{safe_title}</text>')
        return "\n".join(res)

    # =========================================================================
    # PACKAGES & USE CASES (VISUAL PARADIGM FOLDER-TAB SUBSYSTEMS)
    # =========================================================================

    # -------------------------------------------------------------------------
    # CENTRAL AUTH & SECURITY GATEWAY (Column 2 Top)
    # X: 3060 to 4460, Y: 190 to 760 (W: 1400, H: 570)
    # -------------------------------------------------------------------------
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- CENTRAL AUTHENTICATION & SECURITY GATEWAY                 -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(3060, 190, 1400, 570, 720, "CỔNG XÁC THỰC & BẢO MẬT HỆ THỐNG (auth-service • gateway-bff)", "Pkg_Central_Auth_Gateway", is_gateway=True))
    lines.append(uc(3760, 390, 165, 36, "UC-AUTH-01", "Đăng nhập hệ thống (Core Auth Hub)", "uc-core"))
    lines.append(uc(3360, 620, 145, 28, "UC-AUTH-02", "Đăng xuất hệ thống", "uc-ext"))
    lines.append(uc(4160, 620, 155, 28, "UC-AUTH-03", "Quản lý thông tin tài khoản", "uc-core"))
    lines.append(direct_dep_arrow(3360, 620, 145, 28, 3760, 390, 165, 36, "«extend»", -16))
    lines.append(direct_dep_arrow(3760, 390, 165, 36, 4160, 620, 155, 28, "«include»", 16))
    lines.append('  </g>')
    lines.append('')

    # -------------------------------------------------------------------------
    # PACKAGE 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG (Column 1 Top)
    # X: 760 to 2560, Y: 190 to 1680 (W: 1800, H: 1490)
    # -------------------------------------------------------------------------
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG                   -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(760, 190, 1800, 1490, 760, "PHÂN HỆ 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG — shipment-service • pickup-service", "Pkg_1_Order_Management"))

    # Column 1 (X: 1040, Facing Merchant & Customer):
    lines.append(uc(1040, 310, 145, 27, "UC-ORD-01a", "Tạo đơn hàng Web Portal", "uc-core"))
    lines.append(uc(1040, 450, 145, 27, "UC-ORD-02", "Quản lý &amp; Lọc danh sách đơn", "uc-core"))
    lines.append(uc(1040, 590, 145, 27, "UC-ORD-03", "Yêu cầu đổi thông tin giao", "uc"))
    lines.append(uc(1040, 730, 135, 27, "UC-ORD-04", "Hủy đơn hàng chưa lấy", "uc"))
    lines.append(uc(1040, 870, 150, 28, "UC-ORD-09", "Đặt lịch hẹn lấy hàng Pickup", "uc-core"))
    lines.append(uc(1040, 1050, 140, 27, "UC-ORD-01b", "Tạo đơn gửi hàng lẻ", "uc-core"))
    lines.append(uc(1040, 1190, 135, 26, "UC-ORD-08", "Quản lý sổ địa chỉ", "uc"))
    lines.append(uc(1040, 1350, 140, 27, "UC-ORD-01c", "Tạo đơn khách vãng lai", "uc"))

    # Column 2 (X: 1660):
    lines.append(uc(1660, 310, 150, 27, "UC-ORD-06", "In nhiều vận đơn hàng loạt", "uc-core"))
    lines.append(uc(1660, 470, 155, 30, "UC-ORD-01", "Tạo đơn gửi bưu phẩm", "uc-abstract"))
    lines.append(uc(1660, 630, 140, 27, "UC-ORD-05", "In nhãn phiếu gửi A6/A7", "uc-core"))
    lines.append(uc(1660, 790, 145, 27, "UC-ORD-07", "Gắn tem Hàng Dễ Vỡ [FRAGILE]", "uc-ext"))

    # Relationships in Pkg 1:
    lines.append(direct_gen_arrow(1040, 310, 145, 27, 1660, 470, 155, 30))
    lines.append(direct_gen_arrow(1040, 1050, 140, 27, 1660, 470, 155, 30))
    lines.append(direct_gen_arrow(1040, 1350, 140, 27, 1660, 470, 155, 30))
    lines.append(direct_dep_arrow(1660, 470, 155, 30, 1660, 630, 140, 27, "«include»", 18))
    lines.append(direct_dep_arrow(1660, 790, 145, 27, 1660, 630, 140, 27, "«extend»", 18))
    lines.append(direct_dep_arrow(1660, 310, 150, 27, 1040, 450, 145, 27, "«extend»", -16))
    lines.append('  </g>')
    lines.append('')

    # -------------------------------------------------------------------------
    # PACKAGE 5: TRỢ LÝ AI LOGISTICS RAG & TRA CỨU HÀNH TRÌNH (Column 1 Bottom)
    # X: 760 to 2560, Y: 1940 to 4100 (W: 1800, H: 2160)
    # -------------------------------------------------------------------------
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 5: TRỢ LÝ AI LOGISTICS RAG & TRA CỨU HÀNH TRÌNH   -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(760, 1940, 1800, 2160, 780, "PHÂN HỆ 5: TRỢ LÝ AI LOGISTICS RAG & TRA CỨU HÀNH TRÌNH — chatbot-service • tracking", "Pkg_5_AI_RAG_Tracking"))

    # Column 1 (X: 1040, Facing Customer & Guest):
    lines.append(uc(1040, 2080, 145, 27, "UC-AI-01b", "Tra cứu hành trình realtime", "uc-core"))
    lines.append(uc(1040, 2220, 145, 27, "UC-AI-01c", "Tra cứu tiến độ (Merchant)", "uc-core"))
    lines.append(uc(1040, 2360, 145, 27, "UC-AI-01a", "Tra cứu bưu kiện công khai", "uc"))
    lines.append(uc(1040, 2520, 150, 28, "UC-AI-02", "Ước tính cước phí bưu chính IATA", "uc-core"))
    lines.append(uc(1040, 2700, 150, 30, "UC-AI-04", "Trò chuyện cùng trợ lý AI 24/7", "uc-core"))

    # Column 2 (X: 1660, AI Engine, RAG, Stream):
    lines.append(uc(1660, 2220, 155, 30, "UC-AI-01", "Tra cứu hành trình bưu phẩm", "uc-abstract"))
    lines.append(uc(1660, 2520, 155, 28, "UC-AI-03", "Động cơ cước chuẩn IATA V/6000", "uc-core"))
    lines.append(uc(1660, 2700, 155, 28, "UC-AI-06", "Truy xuất tri thức Hybrid RAG", "uc-core"))
    lines.append(uc(1660, 2860, 150, 27, "UC-AI-06a", "Fallback mô hình LLM (Gemini/GPT)", "uc"))
    lines.append(uc(1660, 3020, 150, 28, "UC-AI-07", "Phản hồi dạng dòng SSE Streaming", "uc-core"))
    lines.append(uc(1660, 3180, 150, 27, "UC-AI-07a", "Cách ly phiên an toàn (Session)", "uc"))

    # Column 3 (X: 2280, ALL 5 DYNAMIC TOOLS EXPLICITLY DRAWN):
    lines.append(uc(2280, 2520, 155, 27, "UC-AI-05a", "Tool: Tra cứu vận đơn (track)", "uc"))
    lines.append(uc(2280, 2660, 155, 27, "UC-AI-05b", "Tool: Tính cước tự động (calc)", "uc"))
    lines.append(uc(2280, 2800, 155, 27, "UC-AI-05c", "Tool: Tra hàng cấm gửi (policy)", "uc"))
    lines.append(uc(2280, 2940, 155, 27, "UC-AI-05d", "Tool: Chính sách bồi thường 100%", "uc"))
    lines.append(uc(2280, 3080, 155, 27, "UC-AI-05e", "Tool: Tìm bưu cục gần nhất (geo)", "uc"))

    # Relationships in Pkg 5:
    lines.append(direct_gen_arrow(1040, 2080, 145, 27, 1660, 2220, 155, 30))
    lines.append(direct_gen_arrow(1040, 2220, 145, 27, 1660, 2220, 155, 30))
    lines.append(direct_gen_arrow(1040, 2360, 145, 27, 1660, 2220, 155, 30))
    lines.append(direct_dep_arrow(1040, 2520, 150, 28, 1660, 2520, 155, 28, "«include»", -16))
    lines.append(direct_dep_arrow(1040, 2700, 150, 30, 1660, 2700, 155, 28, "«include»", -16))
    lines.append(direct_dep_arrow(1660, 2700, 155, 28, 1660, 2860, 150, 27, "«include»", 18))
    lines.append(direct_dep_arrow(1040, 2700, 150, 30, 1660, 3020, 150, 28, "«include»", -16))
    lines.append(direct_dep_arrow(1660, 3020, 150, 28, 1660, 3180, 150, 27, "«include»", 18))
    # Hybrid RAG Orchestrator (UC-AI-06) includes all 5 dynamic function calling tools:
    lines.append(direct_dep_arrow(1660, 2700, 155, 28, 2280, 2520, 155, 27, "«include»", 16))
    lines.append(direct_dep_arrow(1660, 2700, 155, 28, 2280, 2660, 155, 27, "«include»", 14))
    lines.append(direct_dep_arrow(1660, 2700, 155, 28, 2280, 2800, 155, 27, "«include»", 14))
    lines.append(direct_dep_arrow(1660, 2700, 155, 28, 2280, 2940, 155, 27, "«include»", 16))
    lines.append(direct_dep_arrow(1660, 2700, 155, 28, 2280, 3080, 155, 27, "«include»", 18))
    lines.append('  </g>')
    lines.append('')

    # -------------------------------------------------------------------------
    # PACKAGE 4: TÀI CHÍNH, THU HỘ COD & ĐỐI SOÁT (Column 2 Bottom)
    # X: 2860 to 4660, Y: 1940 to 3240 (W: 1800, H: 1300)
    # -------------------------------------------------------------------------
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 4: TÀI CHÍNH, THU HỘ COD & ĐỐI SOÁT               -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(2860, 1940, 1800, 1300, 740, "PHÂN HỆ 4: TÀI CHÍNH, THU HỘ COD & ĐỐI SOÁT — payment-service • reporting", "Pkg_4_Finance_COD"))

    # Column 1 (X: 3260, Facing Merchant & Ops Staff):
    lines.append(uc(3260, 2200, 150, 28, "UC-FIN-05", "Lịch sử đối soát SePay/VietQR", "uc-core"))
    lines.append(uc(3260, 2460, 150, 28, "UC-FIN-07", "Khấu trừ cước hoàn phân tầng", "uc-ext"))
    lines.append(uc(3260, 2760, 155, 28, "UC-FIN-04", "Đối soát giải ngân COD &amp; VietQR", "uc-core"))
    lines.append(uc(3260, 3040, 155, 28, "UC-FIN-03", "Phê duyệt quyết toán COD thủ công", "uc"))

    # Column 2 (X: 4260, Facing Shipper & System):
    lines.append(uc(4260, 2200, 145, 27, "UC-FIN-01", "Thu hộ tiền mặt COD", "uc-core"))
    lines.append(uc(4260, 2460, 145, 27, "UC-FIN-02", "Nộp tiền COD qua VietQR", "uc-core"))
    lines.append(uc(4260, 2760, 155, 28, "UC-FIN-06", "Khớp nối SePay &amp; Khấu trừ tự động", "uc-core"))

    # Relationships in Pkg 4 (Strictly vertical & horizontal - Zero crossings):
    lines.append(direct_dep_arrow(3260, 2460, 150, 28, 3260, 2200, 150, 28, "«extend»", 18))
    lines.append(direct_dep_arrow(4260, 2460, 145, 27, 4260, 2200, 145, 27, "«include»", 18))
    lines.append(direct_dep_arrow(3260, 3040, 155, 28, 3260, 2760, 155, 28, "«extend»", 18))
    lines.append(direct_dep_arrow(4260, 2760, 155, 28, 3260, 2760, 155, 28, "«include»", -16))
    lines.append('  </g>')
    lines.append('')

    # -------------------------------------------------------------------------
    # PACKAGE 2: BƯU CỤC, ĐIỀU PHỐI & TRUNG CHUYỂN (Column 3 Top)
    # X: 4960 to 6740, Y: 190 to 1680 (W: 1780, H: 1490)
    # -------------------------------------------------------------------------
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 2: BƯU CỤC, ĐIỀU PHỐI & TRUNG CHUYỂN              -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(4960, 190, 1780, 1490, 750, "PHÂN HỆ 2: BƯU CỤC, ĐIỀU PHỐI & TRUNG CHUYỂN — scan • manifest • dispatch", "Pkg_2_Hub_Sortation"))

    # Column 3 (X: 6440, Facing Ops Staff Directly):
    lines.append(uc(6440, 280, 145, 27, "UC-HUB-01", "Giám sát Dashboard thời gian thực", "uc-core"))
    lines.append(uc(6440, 400, 145, 27, "UC-HUB-01a", "Tra cứu hành trình đơn nội bộ", "uc"))
    lines.append(uc(6440, 520, 145, 27, "UC-HUB-01b", "Tạo đơn hàng tại quầy (Walk-in)", "uc-core"))
    lines.append(uc(6440, 640, 150, 27, "UC-HUB-02a", "Phê duyệt yêu cầu lấy hàng Pickup", "uc-core"))
    lines.append(uc(6440, 760, 150, 27, "UC-HUB-02b", "Gán việc shipper (lấy &amp; phát)", "uc-core"))
    lines.append(uc(6440, 880, 145, 27, "UC-HUB-02c", "Xác nhận lấy hàng (Scan Pickup)", "uc"))
    lines.append(uc(6440, 1000, 140, 27, "UC-HUB-06", "Quét xuất kho Outbound", "uc-core"))
    lines.append(uc(6440, 1120, 140, 27, "UC-HUB-07", "Quét nhập kho Inbound", "uc-core"))

    # Column 2 (X: 5860):
    lines.append(uc(5860, 640, 150, 28, "UC-HUB-04", "Quản lý chuyến xe tải Linehaul", "uc-core"))
    lines.append(uc(5860, 880, 155, 28, "UC-HUB-02", "Bảng kê manifest &amp; Đóng bao", "uc-core"))
    lines.append(uc(5860, 1120, 150, 27, "UC-HUB-08", "Gỡ bao &amp; Kiểm đếm chia chọn", "uc"))

    # Column 1 (X: 5260):
    lines.append(uc(5260, 640, 150, 27, "UC-HUB-05", "Cấp tem niêm phong xe tải (XT)", "uc"))
    lines.append(uc(5260, 880, 150, 27, "UC-HUB-03", "Đóng seal niêm kẹp chì an ninh", "uc"))
    lines.append(uc(5260, 1120, 150, 27, "UC-HUB-09", "Quét bàn giao bưu tá (handoff)", "uc-core"))

    # Relationships in Pkg 2:
    lines.append(direct_dep_arrow(6440, 640, 150, 27, 6440, 760, 150, 27, "«include»", 18))
    lines.append(direct_dep_arrow(6440, 880, 145, 27, 6440, 760, 150, 27, "«include»", 18))
    lines.append(direct_dep_arrow(5860, 640, 150, 28, 5260, 640, 150, 27, "«include»", -16))
    lines.append(direct_dep_arrow(5860, 640, 150, 28, 5860, 880, 155, 28, "«include»", 18))
    lines.append(direct_dep_arrow(5860, 880, 155, 28, 5260, 880, 150, 27, "«include»", -16))
    lines.append(direct_dep_arrow(6440, 1000, 140, 27, 5860, 880, 155, 28, "«include»", 16))
    lines.append(direct_dep_arrow(6440, 1120, 140, 27, 5860, 1120, 150, 27, "«include»", -16))
    lines.append(direct_dep_arrow(5860, 1120, 150, 27, 5260, 1120, 150, 27, "«include»", -16))
    lines.append('  </g>')
    lines.append('')

    # -------------------------------------------------------------------------
    # PACKAGE 3: GIAO HÀNG CHẶNG CUỐI & XỬ LÝ SỰ CỐ (Column 3 Middle)
    # X: 4960 to 6740, Y: 1940 to 3040 (W: 1780, H: 1100)
    # -------------------------------------------------------------------------
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 3: GIAO HÀNG CHẶNG CUỐI & XỬ LÝ SỰ CỐ            -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(4960, 1940, 1780, 1100, 740, "PHÂN HỆ 3: GIAO HÀNG CHẶNG CUỐI & SỰ CỐ — delivery-service • shipment", "Pkg_3_Delivery_NDR"))

    # Column 1 (X: 5260, Facing Ops Staff NDR from Corridor):
    lines.append(uc(5260, 2160, 150, 28, "UC-DEL-07", "Xử lý sự cố phát thất bại (NDR)", "uc-core"))
    lines.append(uc(5260, 2380, 150, 28, "UC-DEL-08", "Quản lý &amp; Tạo chuyển hoàn RTS", "uc-core"))

    # Column 2 (X: 5860):
    lines.append(uc(5860, 2160, 145, 27, "UC-DEL-03", "Xác thực mã OTP 6 chữ số", "uc-core"))
    lines.append(uc(5860, 2380, 145, 27, "UC-DEL-04", "Chụp ảnh POD &amp; Chữ ký số", "uc-core"))

    # Column 3 (X: 6440, Facing Shipper Directly - 6 UCs):
    lines.append(uc(6440, 2040, 145, 27, "UC-DEL-01", "Quản lý danh sách nhiệm vụ giao", "uc-core"))
    lines.append(uc(6440, 2160, 145, 27, "UC-DEL-01a", "Bản đồ lộ trình giao hàng GPS", "uc"))
    lines.append(uc(6440, 2280, 140, 26, "UC-DEL-02", "Liên hệ người nhận (ẩn số)", "uc"))
    lines.append(uc(6440, 2400, 150, 28, "UC-DEL-05", "Xác nhận giao thành công", "uc-core"))
    lines.append(uc(6440, 2520, 145, 27, "UC-DEL-06", "Cập nhật sự cố thất bại NDR", "uc"))
    lines.append(uc(6440, 2640, 145, 27, "UC-DEL-06a", "Hẹn lại ngày phát (Reschedule)", "uc-ext"))

    # Relationships in Pkg 3:
    lines.append(direct_dep_arrow(6440, 2160, 145, 27, 6440, 2040, 145, 27, "«extend»", 18))
    lines.append(direct_dep_arrow(6440, 2400, 150, 28, 5860, 2160, 145, 27, "«include»", -16))
    lines.append(direct_dep_arrow(6440, 2400, 150, 28, 5860, 2380, 145, 27, "«include»", 16))
    lines.append(direct_dep_arrow(6440, 2520, 145, 27, 6440, 2400, 150, 28, "«extend»", 18))
    lines.append(direct_dep_arrow(6440, 2640, 145, 27, 6440, 2520, 145, 27, "«extend»", 18))
    lines.append(direct_dep_arrow(5260, 2160, 150, 28, 5260, 2380, 150, 28, "«include»", 18))
    lines.append('  </g>')
    lines.append('')

    # -------------------------------------------------------------------------
    # PACKAGE 6: QUẢN TRỊ HỆ THỐNG, RBAC & CẤU HÌNH (Column 3 Bottom)
    # X: 4960 to 6740, Y: 3240 to 4100 (W: 1780, H: 860)
    # -------------------------------------------------------------------------
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG, RBAC & CẤU HÌNH             -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(4960, 3240, 1780, 860, 750, "PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG, RBAC & CẤU HÌNH — masterdata • auth-service", "Pkg_6_Admin_RBAC"))

    # Column 3 (X: 6440, Facing Admin Directly - 6 UCs):
    lines.append(uc(6440, 3360, 145, 27, "UC-ADM-01", "Quản lý tài khoản toàn hệ thống", "uc-core"))
    lines.append(uc(6440, 3490, 145, 27, "UC-ADM-05", "Quản lý danh mục Hub 4 cấp", "uc-core"))
    lines.append(uc(6440, 3620, 150, 27, "UC-ADM-03", "Quản lý phân quyền RBAC Matrix", "uc-core"))
    lines.append(uc(6440, 3750, 145, 27, "UC-ADM-07", "Danh mục lý do giao NDR", "uc"))
    lines.append(uc(6440, 3880, 145, 27, "UC-ADM-08", "Cấu hình tham số hệ thống", "uc-core"))
    lines.append(uc(6440, 4010, 145, 27, "UC-ADM-09", "Kiểm toán nhật ký hệ thống", "uc-core"))

    # Column 2 (X: 5860):
    lines.append(uc(5860, 3360, 145, 27, "UC-ADM-02", "Phân công nhân sự &amp; Tuyến", "uc"))
    lines.append(uc(5860, 3490, 145, 27, "UC-ADM-06", "Quản lý khu vực / Zone địa lý", "uc"))
    lines.append(uc(5860, 3620, 145, 27, "UC-ADM-04", "Phân quyền mobile override", "uc-ext"))

    # Column 1 (X: 5260, Facing System Actor from bottom):
    lines.append(uc(5260, 3750, 150, 27, "UC-ADM-10", "Chuyển giao Outbox &amp; RabbitMQ", "uc-core"))
    lines.append(uc(5260, 3880, 150, 27, "UC-ADM-11", "Chiếu Read Model Timeline &amp; KPI", "uc-core"))

    # Relationships in Pkg 6:
    lines.append(direct_dep_arrow(6440, 3360, 145, 27, 5860, 3360, 145, 27, "«include»", -16))
    lines.append(direct_dep_arrow(6440, 3490, 145, 27, 5860, 3490, 145, 27, "«include»", -16))
    lines.append(direct_dep_arrow(5860, 3620, 145, 27, 6440, 3620, 150, 27, "«extend»", 16))
    lines.append(direct_dep_arrow(5260, 3750, 150, 27, 5260, 3880, 150, 27, "«include»", 18))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # 7 ACTORS (SPACIOUS RUNWAYS & HIGHWAYS)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- 7 ACTORS SPECIFICATION                                    -->')
    lines.append('  <!-- ========================================================= -->')

    # Left Actors: X = 180
    lines.append(actor_stick(180, 680, "Người Gửi Hàng (Merchant)", "(Chủ Shop B2B • 15 UCs)", "merchant-web :5174"))
    lines.append(actor_stick(180, 1600, "Khách Hàng Cá Nhân", "(Customer C-End • 6 UCs)", "customer-mobile :8082"))
    lines.append(actor_stick(180, 2700, "Khách Vãng Lai (Guest)", "(Người dùng tự do • 9 UCs)", "guest-web :5177"))

    # Generalization: Customer -> Guest
    lines.append('  <g id="Gen_Customer_Guest">')
    lines.append('    <line x1="180" y1="1750" x2="180" y2="2580" class="gen-line"/>')
    lines.append('    <polygon points="180,2595 171,2575 189,2575" class="gen-arrow"/>')
    lines.append('    <rect x="70" y="2150" width="220" height="28" class="pill-plate"/>')
    lines.append('    <text x="180" y="2169" class="t-rel">«generalizes» (Kế thừa tra cứu)</text>')
    lines.append('  </g>')

    # Right Actors: X = 7320
    lines.append(actor_stick(7320, 720, "Nhân Viên Vận Hành", "(Ops Staff Bưu Cục & Hub • 19 UCs)", "ops-web :5173 • courier-mobile"))
    lines.append(actor_stick(7320, 2200, "Nhân Viên Giao Hàng", "(Shipper / Chặng Cuối • 13 UCs)", "courier-mobile :8081"))
    lines.append(actor_stick(7320, 3550, "Quản Trị Viên (Admin)", "(System Admin • 11 UCs)", "admin-web :5175"))

    # Generalization: Ops Staff -> Shipper
    lines.append('  <g id="Gen_Ops_Shipper">')
    lines.append('    <line x1="7320" y1="870" x2="7320" y2="2080" class="gen-line"/>')
    lines.append('    <polygon points="7320,2095 7311,2075 7329,2075" class="gen-arrow"/>')
    lines.append('    <rect x="7170" y="1465" width="300" height="28" class="pill-plate"/>')
    lines.append('    <text x="7320" y="1484" class="t-rel">«generalizes» (Kế thừa bưu tá hiện trường)</text>')
    lines.append('  </g>')

    # Supporting System Actor (Bottom Right):
    lines.append('  <g id="Actor_System_AI">')
    lines.append('    <rect x="7143" y="4153" width="310" height="96" rx="6" fill="#0F2438" fill-opacity="0.08"/>')
    lines.append('    <rect x="7140" y="4150" width="310" height="96" class="sys-actor-box"/>')
    lines.append('    <text x="7295" y="4178" class="t-rel">«supporting system actor»</text>')
    lines.append('    <text x="7295" y="4202" class="t-actor">Trợ Lý AI &amp; Hệ Thống</text>')
    lines.append('    <text x="7295" y="4222" class="t-role">chatbot-service • outbox relay</text>')
    lines.append('    <text x="7295" y="4238" class="t-app">Event Bus &amp; Read Model Projections</text>')
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # ASSOCIATIONS (SPACIOUS MULTI-TRACK HIGHWAYS - R=24px FILLETS)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- ACTOR ASSOCIATIONS (SPACIOUS MULTI-TRACK HIGHWAYS)        -->')
    lines.append('  <!-- ========================================================= -->')

    # Hands coordinates
    merch_hand = (270, 680)
    cust_hand = (270, 1600)
    guest_hand = (270, 2700)
    ops_hand = (7230, 720)
    shipper_hand = (7230, 2200)
    admin_hand = (7230, 3550)
    sys_hand = (7140, 4200)

    # 1. MERCHANT (merch_hand = 270, 680)
    lines.append(direct_line(merch_hand[0], merch_hand[1], 1040, 310, 145, 27, "assoc")) # UC-ORD-01a
    lines.append(direct_line(merch_hand[0], merch_hand[1], 1040, 450, 145, 27, "assoc")) # UC-ORD-02
    lines.append(direct_line(merch_hand[0], merch_hand[1], 1040, 590, 145, 27, "assoc")) # UC-ORD-03
    lines.append(direct_line(merch_hand[0], merch_hand[1], 1040, 730, 135, 27, "assoc")) # UC-ORD-04
    lines.append(direct_line(merch_hand[0], merch_hand[1], 1040, 870, 150, 28, "assoc")) # UC-ORD-09

    # Merchant -> Central Auth Gateway (Lane X=350, Ceiling Y=230):
    lines.append(path_to_ellipse([(merch_hand[0], merch_hand[1]), (350, 680), (350, 230), (3650, 230)], 3760, 390, 165, 36, radius=24, label="Merchant", label_idx=2)) # UC-AUTH-01

    # Merchant -> Package 5 (Tracking UC-AI-01c) via Lane X=430 -> Highway Y=1720:
    lines.append(path_to_ellipse([(merch_hand[0], merch_hand[1]), (430, 680), (430, 1720), (510, 1720), (510, 2220)], 1040, 2220, 145, 27, radius=24, label="Merchant", label_idx=2)) # UC-AI-01c

    # Merchant -> Package 4 (Finance: UC-FIN-05 Statement) via Lane X=510 -> Highway Y=1760:
    lines.append(path_to_ellipse([(merch_hand[0], merch_hand[1]), (510, 680), (510, 1760), (3260, 1760)], 3260, 2200, 150, 28, radius=24, label="Merchant", label_idx=2)) # UC-FIN-05

    # 2. CUSTOMER C-END (cust_hand = 270, 1600)
    lines.append(direct_line(cust_hand[0], cust_hand[1], 1040, 1050, 140, 27, "assoc")) # UC-ORD-01b
    lines.append(direct_line(cust_hand[0], cust_hand[1], 1040, 1190, 135, 26, "assoc")) # UC-ORD-08
    lines.append(direct_line(cust_hand[0], cust_hand[1], 1040, 2080, 145, 27, "assoc")) # UC-AI-01b

    # Customer -> Central Auth Gateway (Lane X=290, Ceiling Y=255):
    lines.append(path_to_ellipse([(cust_hand[0], cust_hand[1]), (290, 1600), (290, 255), (3700, 255)], 3760, 390, 165, 36, radius=24, label="Customer", label_idx=2)) # UC-AUTH-01

    # Customer -> Package 3 (OTP Verification: UC-DEL-03) via Lane X=370 -> Highway Y=1795:
    lines.append(path_to_ellipse([(cust_hand[0], cust_hand[1]), (370, 1600), (370, 1795), (5860, 1795)], 5860, 2160, 145, 27, radius=24, label="Customer", label_idx=2)) # UC-DEL-03

    # 3. GUEST USER (guest_hand = 270, 2700)
    lines.append(direct_line(guest_hand[0], guest_hand[1], 1040, 1350, 140, 27, "assoc")) # UC-ORD-01c
    lines.append(direct_line(guest_hand[0], guest_hand[1], 1040, 2360, 145, 27, "assoc")) # UC-AI-01a
    lines.append(direct_line(guest_hand[0], guest_hand[1], 1040, 2520, 150, 28, "assoc")) # UC-AI-02
    lines.append(direct_line(guest_hand[0], guest_hand[1], 1040, 2700, 150, 30, "assoc")) # UC-AI-04

    # 4. OPS STAFF (ops_hand = 7230, 720)
    lines.append(direct_line(ops_hand[0], ops_hand[1], 6440, 280, 145, 27, "assoc")) # UC-HUB-01
    lines.append(direct_line(ops_hand[0], ops_hand[1], 6440, 400, 145, 27, "assoc")) # UC-HUB-01a
    lines.append(direct_line(ops_hand[0], ops_hand[1], 6440, 520, 145, 27, "assoc")) # UC-HUB-01b
    lines.append(direct_line(ops_hand[0], ops_hand[1], 6440, 640, 150, 27, "assoc")) # UC-HUB-02a
    lines.append(direct_line(ops_hand[0], ops_hand[1], 6440, 760, 150, 27, "assoc")) # UC-HUB-02b
    lines.append(direct_line(ops_hand[0], ops_hand[1], 6440, 1000, 140, 27, "assoc")) # UC-HUB-06
    lines.append(direct_line(ops_hand[0], ops_hand[1], 6440, 1120, 140, 27, "assoc")) # UC-HUB-07

    # Ops Staff -> Package 2 Column 2 (Linehaul via inter-row gap):
    lines.append(path_to_ellipse([(ops_hand[0], ops_hand[1]), (6720, 675), (6150, 675), (6150, 640)], 5860, 640, 150, 28, radius=20)) # UC-HUB-04

    # Ops Staff -> Central Auth Gateway (Lane X=7110, Ceiling Y=315):
    lines.append(path_to_ellipse([(ops_hand[0], ops_hand[1]), (7110, 720), (7110, 315), (3850, 315)], 3760, 390, 165, 36, radius=24, label="Ops Staff", label_idx=2)) # UC-AUTH-01

    # Ops Staff -> Package 3 (NDR: UC-DEL-07) via Lane X=6830 -> Middle Highway Y=1810:
    lines.append(path_to_ellipse([(ops_hand[0], ops_hand[1]), (6830, 720), (6830, 1810), (5260, 1810)], 5260, 2160, 150, 28, radius=24, label="Ops Staff", label_idx=2)) # UC-DEL-07

    # Ops Staff -> Package 4 (Finance: UC-FIN-04 Settlement) via Lane X=6890 -> Highway Y=1885:
    lines.append(path_to_ellipse([(ops_hand[0], ops_hand[1]), (6890, 720), (6890, 1885), (3260, 1885)], 3260, 2760, 155, 28, radius=24, label="Ops Staff", label_idx=2)) # UC-FIN-04

    # Ops Staff -> Package 4 (Finance: UC-FIN-03 Manual Settlement) via Outer Lane X=6950 -> Private Gap Highway between P3 & P6 Y=3140:
    lines.append(path_to_ellipse([(ops_hand[0], ops_hand[1]), (6950, 720), (6950, 3140), (3260, 3140)], 3260, 3040, 155, 28, radius=24, label="Ops Staff", label_idx=2)) # UC-FIN-03

    # 5. SHIPPER (shipper_hand = 7230, 2200)
    lines.append(direct_line(shipper_hand[0], shipper_hand[1], 6440, 2040, 145, 27, "assoc")) # UC-DEL-01
    lines.append(direct_line(shipper_hand[0], shipper_hand[1], 6440, 2160, 145, 27, "assoc")) # UC-DEL-01a
    lines.append(direct_line(shipper_hand[0], shipper_hand[1], 6440, 2280, 140, 26, "assoc")) # UC-DEL-02
    lines.append(direct_line(shipper_hand[0], shipper_hand[1], 6440, 2400, 150, 28, "assoc")) # UC-DEL-05
    lines.append(direct_line(shipper_hand[0], shipper_hand[1], 6440, 2520, 145, 27, "assoc")) # UC-DEL-06
    lines.append(direct_line(shipper_hand[0], shipper_hand[1], 6440, 2640, 145, 27, "assoc")) # UC-DEL-06a

    # Shipper -> Package 2 (Scan Pickup: UC-HUB-02c) via Lane X=6950 -> Gap Y=880:
    lines.append(path_to_ellipse([(shipper_hand[0], shipper_hand[1]), (6950, 2200), (6950, 880)], 6440, 880, 145, 27, radius=20, label="Shipper", label_idx=1)) # UC-HUB-02c

    # Shipper -> Package 4 (Finance: UC-FIN-01 Cash COD) via Lane X=7010 -> Highway Y=1850:
    lines.append(path_to_ellipse([(shipper_hand[0], shipper_hand[1]), (7010, 2200), (7010, 1850), (4260, 1850)], 4260, 2200, 145, 27, radius=24, label="Shipper", label_idx=2)) # UC-FIN-01

    # Shipper -> Package 4 (Finance: UC-FIN-02 QR COD) via Lane X=7070 -> Highway Y=1915:
    lines.append(path_to_ellipse([(shipper_hand[0], shipper_hand[1]), (7070, 2200), (7070, 1915), (4320, 1915), (4320, 2460)], 4260, 2460, 145, 27, radius=24, label="Shipper", label_idx=2)) # UC-FIN-02

    # Shipper -> Central Auth Gateway (Lane X=7160, Ceiling Y=260):
    lines.append(path_to_ellipse([(shipper_hand[0], shipper_hand[1]), (7160, 2200), (7160, 260), (3800, 260)], 3760, 390, 165, 36, radius=24, label="Shipper", label_idx=2)) # UC-AUTH-01

    # 6. SYSTEM ADMIN (admin_hand = 7230, 3550)
    lines.append(direct_line(admin_hand[0], admin_hand[1], 6440, 3360, 145, 27, "assoc")) # UC-ADM-01
    lines.append(direct_line(admin_hand[0], admin_hand[1], 6440, 3490, 145, 27, "assoc")) # UC-ADM-05
    lines.append(direct_line(admin_hand[0], admin_hand[1], 6440, 3620, 150, 27, "assoc")) # UC-ADM-03
    lines.append(direct_line(admin_hand[0], admin_hand[1], 6440, 3750, 145, 27, "assoc")) # UC-ADM-07
    lines.append(direct_line(admin_hand[0], admin_hand[1], 6440, 3880, 145, 27, "assoc")) # UC-ADM-08
    lines.append(direct_line(admin_hand[0], admin_hand[1], 6440, 4010, 145, 27, "assoc")) # UC-ADM-09

    # Admin -> Central Auth Gateway (Lane X=7210, Ceiling Y=200):
    lines.append(path_to_ellipse([(admin_hand[0], admin_hand[1]), (7210, 3550), (7210, 200), (3880, 200)], 3760, 390, 165, 36, radius=24, label="Admin", label_idx=2)) # UC-AUTH-01

    # 7. SYSTEM & AI ENGINE (sys_hand = 7140, 4200)
    # System -> Package 6 (Outbox Relay & RabbitMQ via bottom corridor Y=4140):
    lines.append(path_to_ellipse([(sys_hand[0], sys_hand[1]), (6720, 4200), (6720, 4140), (5260, 4140)], 5260, 3750, 150, 27, radius=24, label="System", label_idx=2)) # UC-ADM-10
    lines.append(path_to_ellipse([(sys_hand[0], sys_hand[1]), (6720, 4200), (6720, 4140), (5260, 4140)], 5260, 3880, 150, 27, radius=24)) # UC-ADM-11

    # System -> Package 4 (SePay Khớp nối tự động via bottom corridor Y=4165):
    lines.append(path_to_ellipse([(sys_hand[0], sys_hand[1]), (6720, 4200), (6720, 4165), (4260, 4165)], 4260, 2760, 155, 28, radius=24, label="System", label_idx=2)) # UC-FIN-06

    # System -> Package 5 (IATA pricing, RAG, SSE Streaming) via Bottom Corridor Y=4190 & 4215:
    lines.append(path_to_ellipse([(sys_hand[0], sys_hand[1]), (6720, 4200), (6720, 4190), (1660, 4190)], 1660, 2520, 155, 28, radius=24, label="System & AI", label_idx=2)) # UC-AI-03
    lines.append(path_to_ellipse([(sys_hand[0], sys_hand[1]), (6720, 4200), (6720, 4215), (1660, 4215)], 1660, 3020, 150, 28, radius=24, label="System & AI", label_idx=2)) # UC-AI-07

    # LEGEND & TRACEABILITY MATRIX (BOTTOM AREA)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- LEGEND & ARCHITECTURAL TRACEABILITY MATRIX                -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Legend_Matrix">')
    lines.append(f'    <rect x="43" y="{height-377}" width="1500" height="340" rx="6" fill="#0F2438" fill-opacity="0.04"/>')
    lines.append(f'    <rect x="40" y="{height-380}" width="1500" height="340" fill="#FFFFFF" stroke="#335A88" stroke-width="1.4" rx="6"/>')
    lines.append(f'    <path d="M 40,{height-342} L 40,{height-374} Q 40,{height-380} 46,{height-380} L 600,{height-380} L 620,{height-342} Z" fill="url(#vp-pkg-tab-grad)" stroke="#335A88" stroke-width="1.2"/>')
    lines.append(f'    <text x="60" y="{height-356}" class="t-note">CHÚ GIẢI KÝ HIỆU CHUẨN VISUAL PARADIGM &amp; UML 2.5 (REV.20):</text>')
    
    # Legend symbols:
    lines.append(f'    <line x1="60" y1="{height-300}" x2="160" y2="{height-300}" class="assoc"/>')
    lines.append(f'    <text x="180" y="{height-295}" class="t-legend"><tspan font-weight="bold">Association (Quan hệ kết hợp trực tiếp):</tspan> Đường nối liền nét từ 7 Tác nhân đến Use Case được phân quyền kích hoạt trực tiếp.</text>')

    lines.append(f'    <line x1="60" y1="{height-260}" x2="140" y2="{height-260}" class="gen-line"/>')
    lines.append(f'    <polygon points="160,{height-260} 140,{height-265} 140,{height-255}" class="gen-arrow"/>')
    lines.append(f'    <text x="180" y="{height-255}" class="t-legend"><tspan font-weight="bold">Generalization (Kế thừa Đa hình):</tspan> Use Case [Tạo đơn, Tra cứu ──▷]; Actor: CUSTOMER ──▷ GUEST; OPS STAFF ──▷ SHIPPER.</text>')

    lines.append(f'    <line x1="60" y1="{height-220}" x2="145" y2="{height-220}" class="dep-line"/>')
    lines.append(f'    <polygon points="160,{height-220} 145,{height-225} 145,{height-215}" class="dep-arrow"/>')
    lines.append(f'    <text x="180" y="{height-215}" class="t-legend"><tspan font-weight="bold">«include» (Quan hệ Bao hàm Bắt buộc):</tspan> Bước thực thi bắt buộc (Giao hàng include POD &amp; OTP; Manifest include Niêm chì; Chat AI include 5 Dynamic Tools).</text>')

    lines.append(f'    <line x1="60" y1="{height-180}" x2="145" y2="{height-180}" class="dep-line"/>')
    lines.append(f'    <polygon points="160,{height-180} 145,{height-185} 145,{height-175}" class="dep-arrow"/>')
    lines.append(f'    <text x="180" y="{height-175}" class="t-legend"><tspan font-weight="bold">«extend» (Quan hệ Mở rộng có Điều kiện):</tspan> Tem FRAGILE mở rộng Tạo đơn; NDR/Reschedule mở rộng Giao hàng; Quyết toán thủ công mở rộng Nộp COD.</text>')

    # Ellipse types in VP theme (Pure Vector Shadows):
    lines.append(f'    <ellipse cx="78" cy="{height-102}" rx="32" ry="16" fill="#0F2438" fill-opacity="0.08"/>')
    lines.append(f'    <ellipse cx="75" cy="{height-105}" rx="32" ry="16" class="uc-abstract"/>')
    lines.append(f'    <ellipse cx="158" cy="{height-102}" rx="32" ry="16" fill="#0F2438" fill-opacity="0.08"/>')
    lines.append(f'    <ellipse cx="155" cy="{height-105}" rx="32" ry="16" class="uc-core"/>')
    lines.append(f'    <ellipse cx="238" cy="{height-102}" rx="32" ry="16" fill="#0F2438" fill-opacity="0.08"/>')
    lines.append(f'    <ellipse cx="235" cy="{height-105}" rx="32" ry="16" class="uc"/>')
    lines.append(f'    <ellipse cx="318" cy="{height-102}" rx="32" ry="16" fill="#0F2438" fill-opacity="0.08"/>')
    lines.append(f'    <ellipse cx="315" cy="{height-105}" rx="32" ry="16" class="uc-ext"/>')
    lines.append(f'    <text x="365" y="{height-100}" class="t-legend"><tspan font-weight="bold">Phân loại hình khối VP:</tspan> [Xám: «abstract» Gốc] • [Viền xanh đậm 2.2px: Cốt lõi/Core/Auth Hub] • [Viền 1.4px: Chuẩn] • [Nét đứt: Extended/Tùy chọn]</text>')

    # Traceability Matrix Box (Right):
    lines.append(f'    <rect x="1573" y="{height-377}" width="5480" height="340" rx="6" fill="#0F2438" fill-opacity="0.04"/>')
    lines.append(f'    <rect x="1570" y="{height-380}" width="5480" height="340" fill="#FFFFFF" stroke="#335A88" stroke-width="1.4" rx="6"/>')
    lines.append(f'    <path d="M 1570,{height-342} L 1570,{height-374} Q 1570,{height-380} 1576,{height-380} L 2400,{height-380} L 2420,{height-342} Z" fill="url(#vp-pkg-tab-grad)" stroke="#335A88" stroke-width="1.2"/>')
    lines.append(f'    <text x="1595" y="{height-356}" class="t-note">BẢNG ÁNH XẠ 1:1 TOÀN BỘ 82 YÊU CẦU CHỨC NĂNG THỰC CÓ (KHỚP HOÀN TOÀN FILE DANH_SACH_CHUC_NANG_THEO_ACTOR.XLSX):</text>')
    
    lines.append(f'    <text x="1600" y="{height-308}" class="t-legend">• <tspan font-weight="bold">Khách Vãng Lai (9 UCs):</tspan> Tra cứu bưu kiện công khai (UC-AI-01a), Cước IATA (UC-AI-02), Đơn vãng lai (UC-ORD-01c), Chat AI 24/7 (UC-AI-04), 5 Dynamic Tools AI riêng biệt (UC-AI-05a: track_shipment, UC-AI-05b: calculate_rate, UC-AI-05c: prohibited_goods, UC-AI-05d: compensation_claim, UC-AI-05e: nearest_post_office).</text>')
    lines.append(f'    <text x="1600" y="{height-278}" class="t-legend">• <tspan font-weight="bold">Khách Hàng Cá Nhân (6 UCs):</tspan> Kế thừa Khách vãng lai; Tạo đơn gửi lẻ (UC-ORD-01b), Quản lý sổ địa chỉ (UC-ORD-08), Tra cứu realtime (UC-AI-01b), Chat AI nổi (UC-AI-04), Xác thực OTP 6 số nhận hàng (UC-DEL-03).</text>')
    lines.append(f'    <text x="1600" y="{height-248}" class="t-legend">• <tspan font-weight="bold">Người Gửi Hàng - Merchant (15 UCs):</tspan> Đăng nhập/xuất (UC-AUTH-01,02), Tài khoản (UC-AUTH-03), Tạo đơn Web (UC-ORD-01a), Bulk print (UC-ORD-06), Quản lý/Lọc đơn (UC-ORD-02), Sửa (UC-ORD-03), Hủy (UC-ORD-04), Đặt Pickup (UC-ORD-09), Tiến độ (UC-AI-01c), In A6/A7 (UC-ORD-05), Tem FRAGILE (UC-ORD-07), Hoàn hàng RTS (UC-DEL-08), Đối soát COD (UC-FIN-05), Khấu trừ cước hoàn (UC-FIN-07).</text>')
    lines.append(f'    <text x="1600" y="{height-218}" class="t-legend">• <tspan font-weight="bold">Nhân Viên Giao Hàng - Shipper (13 UCs):</tspan> Đăng nhập/xuất (UC-AUTH-01,02), Nhiệm vụ ngày (UC-DEL-01), Bản đồ GPS (UC-DEL-01a), Scan Pickup (UC-HUB-02c), Liên hệ khách (UC-DEL-02), Xác thực OTP (UC-DEL-03), Chụp POD &amp; Ký số (UC-DEL-04), Giao thành công (UC-DEL-05), Báo NDR (UC-DEL-06), Hẹn lại ngày phát (UC-DEL-06a), Thu COD tiền mặt (UC-FIN-01), Nộp tiền VietQR (UC-FIN-02).</text>')
    lines.append(f'    <text x="1600" y="{height-188}" class="t-legend">• <tspan font-weight="bold">Nhân Viên Vận Hành - Ops Staff (19 UCs):</tspan> Dashboard (UC-HUB-01), Tra cứu nội bộ (UC-HUB-01a), Đơn tại quầy (UC-HUB-01b), Duyệt pickup (UC-HUB-02a), Gán việc shipper (UC-HUB-02b), Đóng bao (UC-HUB-02), Niêm chì (UC-HUB-03), Linehaul (UC-HUB-04), Tem XT (UC-HUB-05), Xuất kho (UC-HUB-06), Nhập kho (UC-HUB-07), Gỡ bao (UC-HUB-08), Handoff bưu tá (UC-HUB-09), Xử lý NDR (UC-DEL-07), Hoàn hàng RTS (UC-DEL-08), Đối soát VietQR (UC-FIN-04), Quyết toán thủ công (UC-FIN-03).</text>')
    lines.append(f'    <text x="1600" y="{height-158}" class="t-legend">• <tspan font-weight="bold">Quản Trị Viên - Admin (11 UCs):</tspan> Quản trị user (UC-ADM-01), Phân công (UC-ADM-02), RBAC Matrix (UC-ADM-03), Mobile override (UC-ADM-04), Hubs 4 cấp (UC-ADM-05), Zones (UC-ADM-06), Danh mục NDR (UC-ADM-07), System Config (UC-ADM-08), Audit Log (UC-ADM-09).</text>')
    lines.append(f'    <text x="1600" y="{height-128}" class="t-legend">• <tspan font-weight="bold">Trợ Lý AI &amp; Hệ Thống (9 UCs):</tspan> Động cơ IATA V/6000 (UC-AI-03), Hybrid RAG (UC-AI-06), Fallback LLM (UC-AI-06a), SSE Streaming (UC-AI-07), Session Isolation (UC-AI-07a), Outbox Relay RabbitMQ (UC-ADM-10), Read Model Timeline/KPI (UC-ADM-11), Khớp nối SePay VietQR tự động (UC-FIN-06).</text>')
    lines.append('  </g>')

    lines.append('</svg>')
    return "\n".join(lines)

if __name__ == "__main__":
    svg_content = generate_svg()
    target_path = os.path.abspath("docs/graduation-thesis/figma-page-1-system-and-data/diagrams/01-use-case-general-system.svg")
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated successfully: {target_path} ({len(svg_content.encode('utf-8'))} bytes)")
