#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generator for Nexus Master UML Use Case Diagram in Visual Paradigm Modern Enterprise Style.
Optimized for: A4 PORTRAIT (Khổ A4 dọc: 2800 x 3960 px - ISO 216 1:1.414 ratio)
Standard: OMG UML 2.5 / IEEE 830 / ISO/IEC 25010
Zero overlaps, dedicated behind-the-actor highway corridors, 100% native vector, perfectly formatted for thesis reports.
"""

import os
import math

def generate_svg():
    # Exact A4 Portrait Dimensions (2800 x 3960, ratio 1:1.4142857)
    width = 2800
    height = 3960

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">')
    lines.append('  <defs>')
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
    lines.append('      .t-main { font-family: "Segoe UI", Arial, sans-serif; font-size: 26px; font-weight: bold; fill: #0F2942; letter-spacing: 0.3px; }')
    lines.append('      .t-sub { font-family: "Segoe UI", Arial, sans-serif; font-size: 14px; fill: #475569; }')
    lines.append('      .t-boundary { font-family: "Segoe UI", Arial, sans-serif; font-size: 15px; font-weight: bold; fill: #1E3A5F; letter-spacing: 0.5px; }')
    lines.append('      .t-pkg { font-family: "Segoe UI", Arial, sans-serif; font-size: 14.5px; font-weight: bold; fill: #1E3A5F; }')
    lines.append('      .t-actor { font-family: "Segoe UI", Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #0F2942; text-anchor: middle; }')
    lines.append('      .t-role { font-family: "Segoe UI", Arial, sans-serif; font-size: 12.5px; font-weight: 500; fill: #475569; text-anchor: middle; }')
    lines.append('      .t-app { font-family: "Courier New", monospace; font-size: 11.5px; font-weight: bold; fill: #2B4C6F; text-anchor: middle; }')
    lines.append('      ')
    lines.append('      .t-ucid { font-family: "Segoe UI", Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #1E4273; text-anchor: middle; }')
    lines.append('      .t-uc { font-family: "Segoe UI", Arial, sans-serif; font-size: 14px; font-weight: 600; fill: #0F172A; text-anchor: middle; }')
    lines.append('      .t-uc-abs { font-family: "Segoe UI", Arial, sans-serif; font-size: 13.5px; font-weight: bold; font-style: italic; fill: #334155; text-anchor: middle; }')
    lines.append('      .t-rel { font-family: "Segoe UI", Arial, sans-serif; font-size: 12px; font-style: italic; font-weight: bold; fill: #1E3A5F; text-anchor: middle; }')
    lines.append('      .t-badge { font-family: "Segoe UI", Arial, sans-serif; font-size: 11.5px; font-weight: bold; fill: #1E3A5F; text-anchor: middle; }')
    lines.append('')
    lines.append('      /* ===== SHAPES & STROKES ===== */')
    lines.append('      .bg { fill: #FBFCFE; }')
    lines.append('      .frame { fill: none; stroke: #335A88; stroke-width: 2; }')
    lines.append('      .frame-inner { fill: none; stroke: #94A3B8; stroke-width: 0.8; }')
    lines.append('      .sys-border { fill: #FFFFFF; stroke: #2D4A70; stroke-width: 2; }')
    lines.append('      .sys-header { fill: url(#vp-sys-header-grad); stroke: #2D4A70; stroke-width: 1.4; }')
    lines.append('      .pkg-body { fill: #F8FAFD; stroke: #4C769E; stroke-width: 1.3; }')
    lines.append('      .pkg-tab { fill: url(#vp-pkg-tab-grad); stroke: #4C769E; stroke-width: 1.3; }')
    lines.append('      .gateway-body { fill: #F6F9FD; stroke: #2D5B88; stroke-width: 1.6; stroke-dasharray: 6 3.5; }')
    lines.append('      .gateway-tab { fill: #DCE8F4; stroke: #2D5B88; stroke-width: 1.4; }')
    lines.append('')
    lines.append('      /* Use Cases (Visual Paradigm 2.5D Shading - Pure Vector Native) */')
    lines.append('      .uc-core { fill: url(#vp-grad-core); stroke: #204B76; stroke-width: 2; }')
    lines.append('      .uc { fill: url(#vp-grad-std); stroke: #4C769E; stroke-width: 1.3; }')
    lines.append('      .uc-abstract { fill: url(#vp-grad-abs); stroke: #475569; stroke-width: 1.5; stroke-dasharray: 5 3; }')
    lines.append('      .uc-ext { fill: url(#vp-grad-ext); stroke: #4C769E; stroke-width: 1.3; stroke-dasharray: 5 3; }')
    lines.append('')
    lines.append('      /* Actors */')
    lines.append('      .actor-head { fill: #FFFFFF; stroke: #0F2942; stroke-width: 2.2; }')
    lines.append('      .actor-body { stroke: #0F2942; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .sys-actor-box { fill: #EDF4FA; stroke: #2E5B88; stroke-width: 1.6; rx: 6px; }')
    lines.append('')
    lines.append('      /* Connectors & Arrows */')
    lines.append('      .assoc { stroke: #243B53; stroke-width: 1.4; fill: none; }')
    lines.append('      .assoc-corr { stroke: #243B53; stroke-width: 1.4; fill: none; stroke-linejoin: round; }')
    lines.append('      .gen-line { stroke: #243B53; stroke-width: 1.6; fill: none; stroke-linejoin: round; }')
    lines.append('      .gen-arrow { fill: #FFFFFF; stroke: #243B53; stroke-width: 1.6; }')
    lines.append('      .dep-line { stroke: #334E68; stroke-width: 1.3; stroke-dasharray: 5 3; fill: none; stroke-linejoin: round; }')
    lines.append('      .dep-arrow { fill: #334E68; stroke: #334E68; stroke-width: 0.5; }')
    lines.append('      .badge-rect { fill: url(#vp-badge-grad); stroke: #4C769E; stroke-width: 0.8; rx: 4px; }')
    lines.append('      .pill-plate { fill: #FFFFFF; stroke: #94A3B8; stroke-width: 0.8; rx: 4px; }')
    lines.append('      .tool-box { fill: #F0F6FC; stroke: #3B82F6; stroke-width: 1.2; stroke-dasharray: 4 3; rx: 6px; }')
    lines.append('    ]]></style>')
    lines.append('  </defs>')
    lines.append('')
    lines.append('  <!-- CANVAS BACKGROUND & DOUBLE BORDER -->')
    lines.append(f'  <rect width="{width}" height="{height}" class="bg"/>')
    lines.append(f'  <rect x="16" y="16" width="{width-32}" height="{height-32}" class="frame"/>')
    lines.append(f'  <rect x="22" y="22" width="{width-44}" height="{height-44}" class="frame-inner"/>')
    lines.append('')

    # HEADER BLOCK (A4 Portrait Top)
    lines.append('  <!-- ==================== HEADER ==================== -->')
    lines.append('  <g id="Header">')
    lines.append(f'    <rect x="33" y="33" width="{width-60}" height="84" fill="#0F2438" fill-opacity="0.04" rx="4"/>')
    lines.append(f'    <rect x="30" y="30" width="{width-60}" height="84" fill="#FFFFFF" stroke="#335A88" stroke-width="1.6"/>')
    lines.append('    <text x="50" y="65" class="t-main">SƠ ĐỒ USE CASE TỔNG QUÁT HỆ THỐNG NEXUS LOGISTICS (CHUẨN VISUAL PARADIGM)</text>')
    lines.append('    <text x="50" y="96" class="t-sub">Mô hình hóa Toàn diện 82 Yêu cầu Nghiệp vụ Thực có • 7 Tác nhân • 6 Phân hệ • Khổ A4 Dọc Phục vụ Báo cáo Luận văn &amp; SRS</text>')
    lines.append(f'    <rect x="{width-450}" y="40" width="400" height="64" fill="url(#vp-sys-header-grad)" stroke="#335A88" stroke-width="1.1"/>')
    lines.append(f'    <text x="{width-435}" y="65" font-family="\'Segoe UI\', Arial" font-size="13" font-weight="bold" fill="#0F2942">MÃ BẢN VẼ: UC-SYS-A4-01</text>')
    lines.append(f'    <text x="{width-435}" y="88" font-family="\'Segoe UI\', Arial" font-size="11.5" fill="#334E68">OMG UML 2.5 • VISUAL PARADIGM</text>')
    lines.append('  </g>')
    lines.append('')

    # SYSTEM BOUNDARY (X: 350 to 2450, Width: 2100, Height: 3790)
    sb_x = 350
    sb_y = 130
    sb_w = 2100
    sb_h = 3790
    lines.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    lines.append('  <g id="System_Boundary">')
    lines.append(f'    <rect x="{sb_x+3}" y="{sb_y+3}" width="{sb_w}" height="{sb_h}" rx="8" fill="#0F2438" fill-opacity="0.03"/>')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="950" height="34" class="sys-header"/>')
    lines.append(f'    <text x="{sb_x+20}" y="{sb_y+22}" class="t-boundary">«system» RANH GIỚI HỆ THỐNG: NEXUS PLATFORM (15 MICROSERVICES)</text>')
    lines.append('  </g>')
    lines.append('')

    # HELPER FUNCTIONS
    def uc(cx, cy, rx, ry, ucid, title, uctype="uc"):
        res = []
        res.append(f'    <ellipse cx="{cx+2:.1f}" cy="{cy+2.5:.1f}" rx="{rx}" ry="{ry}" fill="#0F2438" fill-opacity="0.07"/>')
        res.append(f'    <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" class="{uctype}"/>')
        safe_title = title.replace('&amp;', '&').replace('&', '&amp;')
        if uctype == "uc-abstract":
            res.append(f'    <text x="{cx}" y="{cy-13}" class="t-rel">«abstract»</text>')
            res.append(f'    <text x="{cx}" y="{cy+1}" class="t-ucid">{ucid}</text>')
            res.append(f'    <text x="{cx}" y="{cy+18}" class="t-uc-abs">{safe_title}</text>')
        else:
            res.append(f'    <text x="{cx}" y="{cy-5}" class="t-ucid">{ucid}</text>')
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

    def rounded_path_d(points, radius=18):
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

    def path_to_ellipse(points, cx, cy, rx, ry, stroke_class="assoc-corr", radius=18, label=None, label_pt=None):
        if not points:
            return ""
        last_x, last_y = points[-1]
        x2, y2 = ellipse_point(cx, cy, rx, ry, last_x, last_y)
        all_pts = points + [(x2, y2)]
        d_str = rounded_path_d(all_pts, radius=radius)
        res = [f'    <path d="{d_str}" class="{stroke_class}"/>']
        if label and label_pt:
            badge_x, badge_y = label_pt
            safe_label = label.replace('&amp;', '&').replace('&', '&amp;')
            b_w = len(label) * 8.5 + 20
            b_h = 22
            res.append(f'    <rect x="{badge_x - b_w/2 + 1:.1f}" y="{badge_y - b_h/2 + 1:.1f}" width="{b_w:.1f}" height="{b_h}" rx="4" fill="#0F2438" fill-opacity="0.06"/>')
            res.append(f'    <rect x="{badge_x - b_w/2:.1f}" y="{badge_y - b_h/2:.1f}" width="{b_w:.1f}" height="{b_h}" rx="4" class="badge-rect"/>')
            res.append(f'    <text x="{badge_x:.1f}" y="{badge_y + 4:.1f}" class="t-badge">[{safe_label}]</text>')
        return "\n".join(res)

    def direct_dep_arrow(cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2, label="«include»", label_offset=16):
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
        p1_x = base_x - uy * 6
        p1_y = base_y + ux * 6
        p2_x = base_x + uy * 6
        p2_y = base_y - ux * 6

        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        lbl_x = mid_x - uy * label_offset
        lbl_y = mid_y + ux * label_offset

        clean_label = label.replace('<<', '«').replace('>>', '»')

        res = []
        res.append(f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{base_x:.1f}" y2="{base_y:.1f}" class="dep-line"/>')
        res.append(f'    <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" class="dep-arrow"/>')
        if clean_label:
            pill_w = len(clean_label) * 8 + 16
            pill_h = 20
            res.append(f'    <rect x="{lbl_x - pill_w/2 + 1:.1f}" y="{lbl_y - pill_h/2:.1f}" width="{pill_w:.1f}" height="{pill_h}" rx="3" fill="#0F2438" fill-opacity="0.06"/>')
            res.append(f'    <rect x="{lbl_x - pill_w/2:.1f}" y="{lbl_y - pill_h/2 - 1:.1f}" width="{pill_w:.1f}" height="{pill_h}" rx="3" class="pill-plate"/>')
            res.append(f'    <text x="{lbl_x:.1f}" y="{lbl_y+4:.1f}" class="t-rel">{clean_label}</text>')
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
        base_x = tip_x - ux * 15
        base_y = tip_y - uy * 15
        p1_x = base_x - uy * 8
        p1_y = base_y + ux * 8
        p2_x = base_x + uy * 8
        p2_y = base_y - ux * 8

        res = []
        res.append(f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{base_x:.1f}" y2="{base_y:.1f}" class="gen-line"/>')
        res.append(f'    <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" class="gen-arrow"/>')
        return "\n".join(res)

    def actor_stick(cx, cy, name, role, app):
        safe_name = name.replace('&amp;', '&').replace('&', '&amp;')
        safe_role = role.replace('&amp;', '&').replace('&', '&amp;')
        safe_app = app.replace('&amp;', '&').replace('&', '&amp;')
        res = []
        safe_id = name.replace(" ", "_").replace("&", "_").replace("(", "").replace(")", "").replace("__", "_")
        res.append(f'  <g id="Actor_{safe_id}">')
        res.append(f'    <circle cx="{cx+2}" cy="{cy-38}" r="20" fill="#0F2438" fill-opacity="0.08"/>')
        res.append(f'    <circle cx="{cx}" cy="{cy-40}" r="20" class="actor-head"/>')
        res.append(f'    <line x1="{cx}" y1="{cy-20}" x2="{cx}" y2="{cy+20}" class="actor-body"/>')
        res.append(f'    <line x1="{cx-28}" y1="{cy+6}" x2="{cx}" y2="{cy-8}" class="actor-body"/>')
        res.append(f'    <line x1="{cx}" y1="{cy-8}" x2="{cx+28}" y2="{cy+6}" class="actor-body"/>')
        res.append(f'    <line x1="{cx}" y1="{cy+20}" x2="{cx-22}" y2="{cy+58}" class="actor-body"/>')
        res.append(f'    <line x1="{cx}" y1="{cy+20}" x2="{cx+22}" y2="{cy+58}" class="actor-body"/>')
        res.append(f'    <text x="{cx}" y="{cy+84}" class="t-actor">{safe_name}</text>')
        res.append(f'    <text x="{cx}" y="{cy+104}" class="t-role">{safe_role}</text>')
        res.append(f'    <text x="{cx}" y="{cy+122}" class="t-app">{safe_app}</text>')
        res.append('  </g>')
        return "\n".join(res)

    def pkg_folder(x, y, w, h, tab_w, title, pkg_id, is_gateway=False):
        tab_h = 34
        res = []
        res.append(f'  <g id="{pkg_id}">')
        body_class = "gateway-body" if is_gateway else "pkg-body"
        tab_class = "gateway-tab" if is_gateway else "pkg-tab"
        res.append(f'    <rect x="{x+2}" y="{y+tab_h+2}" width="{w}" height="{h-tab_h}" rx="5" fill="#0F2438" fill-opacity="0.03"/>')
        res.append(f'    <rect x="{x}" y="{y+tab_h}" width="{w}" height="{h-tab_h}" rx="5" class="{body_class}"/>')
        res.append(f'    <path d="M {x},{y+tab_h} L {x},{y+5} Q {x},{y} {x+5},{y} L {x+tab_w-20},{y} L {x+tab_w},{y+tab_h} Z" class="{tab_class}"/>')
        safe_title = title.replace('&amp;', '&').replace('&', '&amp;')
        res.append(f'    <text x="{x+20}" y="{y+22}" class="t-pkg">{safe_title}</text>')
        return "\n".join(res)

    # =========================================================================
    # PACKAGES & USE CASES IN A4 PORTRAIT TWO-COLUMN LAYOUT
    # =========================================================================

    # -------------------------------------------------------------------------
    # CENTRAL AUTH & SECURITY GATEWAY (Top Center)
    # Span: X = 760 to 2040 (W = 1280, H = 250), Y = 175 to 425
    # -------------------------------------------------------------------------
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- CỔNG XÁC THỰC & BẢO MẬT HỆ THỐNG                         -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(760, 175, 1280, 250, 680, "CỔNG XÁC THỰC & BẢO MẬT HỆ THỐNG (auth-service • gateway-bff)", "Pkg_Central_Auth_Gateway", is_gateway=True))
    lines.append(uc(1400, 275, 170, 35, "UC-AUTH-01", "Đăng nhập hệ thống (Core Auth Hub)", "uc-core"))
    lines.append(uc(1010, 365, 145, 28, "UC-AUTH-02", "Đăng xuất hệ thống", "uc-ext"))
    lines.append(uc(1790, 365, 155, 28, "UC-AUTH-03", "Quản lý thông tin tài khoản", "uc-core"))
    lines.append(direct_dep_arrow(1010, 365, 145, 28, 1400, 275, 170, 35, "«extend»", -15))
    lines.append(direct_dep_arrow(1400, 275, 170, 35, 1790, 365, 155, 28, "«include»", 15))
    lines.append('  </g>')
    lines.append('')

    # -------------------------------------------------------------------------
    # ROW 1 (Y = 445 to 1575, H = 1130):
    # Left: PHÂN HỆ 1 (Đơn hàng) | Right: PHÂN HỆ 2 (Bưu cục & Trung chuyển)
    # -------------------------------------------------------------------------

    # PKG 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG (Left: X = 370 to 1390, W = 1020)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG                   -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(370, 445, 1020, 1130, 680, "PHÂN HỆ 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG — shipment • pickup", "Pkg_1_Order_Management"))

    # Col 1: Creation & Core operations
    lines.append(uc(580, 525, 142, 28, "UC-ORD-01a", "Tạo đơn hàng Web Portal", "uc-core"))
    lines.append(uc(580, 655, 142, 28, "UC-ORD-01b", "Tạo đơn gửi hàng lẻ", "uc-core"))
    lines.append(uc(580, 785, 142, 28, "UC-ORD-01c", "Tạo đơn khách vãng lai", "uc"))
    lines.append(uc(580, 925, 142, 28, "UC-ORD-03", "Yêu cầu đổi thông tin giao", "uc"))
    lines.append(uc(580, 1055, 142, 28, "UC-ORD-04", "Hủy đơn hàng chưa lấy", "uc"))
    lines.append(uc(580, 1195, 145, 28, "UC-ORD-02", "Quản lý &amp; Lọc danh sách đơn", "uc-core"))
    lines.append(uc(580, 1335, 145, 28, "UC-ORD-09", "Đặt lịch hẹn lấy hàng Pickup", "uc-core"))
    lines.append(uc(580, 1475, 142, 28, "UC-ORD-08", "Quản lý sổ địa chỉ", "uc"))

    # Col 2: Abstract Hub, Label Print, Batch Print
    lines.append(uc(1170, 655, 155, 32, "UC-ORD-01", "Tạo đơn gửi bưu phẩm", "uc-abstract"))
    lines.append(uc(1170, 835, 145, 28, "UC-ORD-05", "In nhãn phiếu gửi A6/A7", "uc-core"))
    lines.append(uc(1170, 1005, 145, 28, "UC-ORD-07", "Gắn tem Hàng Dễ Vỡ [FRAGILE]", "uc-ext"))
    lines.append(uc(1170, 1195, 145, 28, "UC-ORD-06", "In nhiều vận đơn hàng loạt", "uc-core"))

    # Relationships in Pkg 1: (100% NON-INTERSECTING)
    lines.append(direct_gen_arrow(580, 525, 142, 28, 1170, 655, 155, 32))
    lines.append(direct_gen_arrow(580, 655, 142, 28, 1170, 655, 155, 32))
    lines.append(direct_gen_arrow(580, 785, 142, 28, 1170, 655, 155, 32))
    lines.append(direct_dep_arrow(1170, 655, 155, 32, 1170, 835, 145, 28, "«include»", 16))
    lines.append(direct_dep_arrow(1170, 1005, 145, 28, 1170, 835, 145, 28, "«extend»", 16))
    lines.append(direct_dep_arrow(1170, 1195, 145, 28, 580, 1195, 145, 28, "«extend»", -15))
    lines.append('  </g>')
    lines.append('')

    # PKG 2: BƯU CỤC, ĐIỀU PHỐI & TRUNG CHUYỂN (Right: X = 1410 to 2430, W = 1020)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 2: BƯU CỤC, ĐIỀU PHỐI & TRUNG CHUYỂN              -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(1410, 445, 1020, 1130, 680, "PHÂN HỆ 2: BƯU CỤC & TRUNG CHUYỂN — scan • manifest • dispatch", "Pkg_2_Hub_Sortation"))

    # Col 1 (Hub Linehaul & Manifest ordered top to bottom): cx = 1630
    lines.append(uc(1630, 545, 142, 28, "UC-HUB-05", "Cấp tem niêm phong xe tải (XT)", "uc"))
    lines.append(uc(1630, 685, 145, 28, "UC-HUB-04", "Quản lý chuyến xe tải Linehaul", "uc-core"))
    lines.append(uc(1630, 835, 145, 28, "UC-HUB-02", "Bảng kê manifest &amp; Đóng bao", "uc-core"))
    lines.append(uc(1630, 985, 142, 28, "UC-HUB-03", "Đóng seal niêm kẹp chì an ninh", "uc"))
    lines.append(uc(1630, 1165, 142, 28, "UC-HUB-08", "Gỡ bao &amp; Kiểm đếm chia chọn", "uc"))
    lines.append(uc(1630, 1365, 145, 28, "UC-HUB-09", "Quét bàn giao bưu tá (handoff)", "uc-core"))

    # Col 2 (Facing Ops Staff): cx = 2210
    lines.append(uc(2210, 525, 142, 28, "UC-HUB-01", "Giám sát Dashboard thời gian thực", "uc-core"))
    lines.append(uc(2210, 645, 142, 28, "UC-HUB-01a", "Tra cứu hành trình đơn nội bộ", "uc"))
    lines.append(uc(2210, 765, 142, 28, "UC-HUB-01b", "Tạo đơn hàng tại quầy (Walk-in)", "uc-core"))
    lines.append(uc(2210, 885, 145, 28, "UC-HUB-02a", "Phê duyệt yêu cầu lấy hàng Pickup", "uc-core"))
    lines.append(uc(2210, 1005, 145, 28, "UC-HUB-02b", "Gán việc shipper (lấy &amp; phát)", "uc-core"))
    lines.append(uc(2210, 1125, 142, 28, "UC-HUB-02c", "Xác nhận lấy hàng (Scan Pickup)", "uc"))
    lines.append(uc(2210, 1275, 142, 28, "UC-HUB-06", "Quét xuất kho Outbound", "uc-core"))
    lines.append(uc(2210, 1425, 142, 28, "UC-HUB-07", "Quét nhập kho Inbound", "uc-core"))

    # Relationships in Pkg 2:
    lines.append(direct_dep_arrow(2210, 885, 145, 28, 2210, 1005, 145, 28, "«include»", 16))
    lines.append(direct_dep_arrow(2210, 1125, 142, 28, 2210, 1005, 145, 28, "«include»", 16))
    lines.append(direct_dep_arrow(1630, 685, 145, 28, 1630, 545, 142, 28, "«include»", -15))
    lines.append(direct_dep_arrow(1630, 685, 145, 28, 1630, 835, 145, 28, "«include»", 16))
    lines.append(direct_dep_arrow(1630, 835, 145, 28, 1630, 985, 142, 28, "«include»", 16))
    lines.append(direct_dep_arrow(2210, 1275, 142, 28, 1630, 835, 145, 28, "«include»", 15))
    lines.append(direct_dep_arrow(2210, 1425, 142, 28, 1630, 1165, 142, 28, "«include»", -15))
    lines.append(direct_dep_arrow(1630, 1165, 142, 28, 1630, 1365, 145, 28, "«include»", 16))
    lines.append('  </g>')
    lines.append('')

    # -------------------------------------------------------------------------
    # ROW 2 (Y = 1595 to 2755, H = 1160):
    # Left: PHÂN HỆ 5 (AI RAG & Tracking) | Right: PHÂN HỆ 3 (Giao hàng & Sự cố)
    # -------------------------------------------------------------------------

    # PKG 5: TRỢ LÝ AI LOGISTICS RAG & TRA CỨU HÀNH TRÌNH (Left: X = 370 to 1390, W = 1020)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 5: TRỢ LÝ AI LOGISTICS RAG & TRA CỨU HÀNH TRÌNH   -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(370, 1595, 1020, 1160, 700, "PHÂN HỆ 5: TRỢ LÝ AI LOGISTICS RAG & TRA CỨU — chatbot • tracking", "Pkg_5_AI_RAG_Tracking"))

    # Col 1:
    # Top sub-block: 3 Tracking variations (01a, 01b, 01c)
    lines.append(uc(580, 1675, 142, 28, "UC-AI-01a", "Tra cứu bưu kiện công khai", "uc"))
    lines.append(uc(580, 1795, 142, 28, "UC-AI-01b", "Tra cứu hành trình realtime", "uc-core"))
    lines.append(uc(580, 1915, 142, 28, "UC-AI-01c", "Tra cứu tiến độ (Merchant)", "uc-core"))
    # Mid sub-block: Pricing & AI Assistant
    lines.append(uc(580, 2055, 145, 28, "UC-AI-02", "Ước tính cước phí bưu chính IATA", "uc-core"))
    lines.append(uc(580, 2205, 150, 30, "UC-AI-04", "Trò chuyện cùng trợ lý AI 24/7", "uc-core"))
    # Lower sub-block: Streaming & Session
    lines.append(uc(580, 2365, 145, 28, "UC-AI-07", "Phản hồi dạng dòng SSE Streaming", "uc-core"))
    lines.append(uc(580, 2525, 142, 28, "UC-AI-07a", "Cách ly phiên an toàn (Session)", "uc"))

    # Col 2:
    # Abstract Tracking Hub at Y = 1795 (aligned with 01a, 01b, 01c!):
    lines.append(uc(1170, 1795, 155, 30, "UC-AI-01", "Tra cứu hành trình bưu phẩm", "uc-abstract"))
    # Pricing Engine at Y = 2055 (aligned with 02!):
    lines.append(uc(1170, 2055, 150, 28, "UC-AI-03", "Động cơ cước chuẩn IATA V/6000", "uc-core"))
    # Hybrid RAG at Y = 2205 (aligned with 04!):
    lines.append(uc(1170, 2205, 150, 28, "UC-AI-06", "Truy xuất tri thức Hybrid RAG", "uc-core"))
    lines.append(uc(1170, 2365, 142, 28, "UC-AI-06a", "Fallback mô hình LLM (Gemini/GPT)", "uc"))

    # 5 Dynamic Tools Container (placed cleanly under 06a):
    lines.append('    <!-- 5 DYNAMIC FUNCTION CALLING TOOLS -->')
    lines.append('    <rect x="1015" y="2445" width="310" height="275" class="tool-box"/>')
    lines.append('    <text x="1170" y="2467" class="t-rel">«5 Dynamic Function Calling Tools»</text>')
    lines.append(uc(1170, 2495, 138, 23, "UC-AI-05a", "Tool: Tra cứu vận đơn (track)", "uc"))
    lines.append(uc(1170, 2545, 138, 23, "UC-AI-05b", "Tool: Tính cước tự động (calc)", "uc"))
    lines.append(uc(1170, 2595, 138, 23, "UC-AI-05c", "Tool: Tra hàng cấm gửi (policy)", "uc"))
    lines.append(uc(1170, 2645, 138, 23, "UC-AI-05d", "Tool: Chính sách bồi thường 100%", "uc"))
    lines.append(uc(1170, 2695, 138, 23, "UC-AI-05e", "Tool: Tìm bưu cục gần nhất (geo)", "uc"))

    # Relationships in Pkg 5: (100% COLLISION FREE!)
    # Top cluster: 01a, 01b, 01c generalize cleanly into UC-AI-01:
    lines.append(direct_gen_arrow(580, 1675, 142, 28, 1170, 1795, 155, 30))
    lines.append(direct_gen_arrow(580, 1795, 142, 28, 1170, 1795, 155, 30))
    lines.append(direct_gen_arrow(580, 1915, 142, 28, 1170, 1795, 155, 30))
    # Mid cluster: Pure horizontal includes:
    lines.append(direct_dep_arrow(580, 2055, 145, 28, 1170, 2055, 150, 28, "«include»", -15))
    lines.append(direct_dep_arrow(580, 2205, 150, 30, 1170, 2205, 150, 28, "«include»", -15))
    # Vertical chains:
    lines.append(direct_dep_arrow(580, 2205, 150, 30, 580, 2365, 145, 28, "«include»", 16))
    lines.append(direct_dep_arrow(580, 2365, 145, 28, 580, 2525, 142, 28, "«include»", 16))
    lines.append(direct_dep_arrow(1170, 2205, 150, 28, 1170, 2365, 142, 28, "«include»", 16))
    lines.append(direct_dep_arrow(1170, 2365, 142, 28, 1170, 2445, 138, 23, "«include tools»", 16))
    lines.append('  </g>')
    lines.append('')

    # PKG 3: GIAO HÀNG CHẶNG CUỐI & XỬ LÝ SỰ CỐ (Right: X = 1410 to 2430, W = 1020)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 3: GIAO HÀNG CHẶNG CUỐI & XỬ LÝ SỰ CỐ            -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(1410, 1595, 1020, 1160, 680, "PHÂN HỆ 3: GIAO HÀNG CHẶNG CUỐI & SỰ CỐ — delivery • shipment", "Pkg_3_Delivery_NDR"))

    # Col 1 (POD, OTP, NDR, RTS): cx = 1630
    lines.append(uc(1630, 1725, 142, 28, "UC-DEL-03", "Xác thực mã OTP 6 chữ số", "uc-core"))
    lines.append(uc(1630, 1885, 142, 28, "UC-DEL-04", "Chụp ảnh POD &amp; Chữ ký số", "uc-core"))
    lines.append(uc(1630, 2125, 145, 28, "UC-DEL-07", "Xử lý sự cố phát thất bại (NDR)", "uc-core"))
    lines.append(uc(1630, 2345, 145, 28, "UC-DEL-08", "Quản lý &amp; Tạo chuyển hoàn RTS", "uc-core"))

    # Col 2 (Facing Shipper Directly): cx = 2210
    lines.append(uc(2210, 1685, 142, 28, "UC-DEL-01", "Quản lý danh sách nhiệm vụ giao", "uc-core"))
    lines.append(uc(2210, 1805, 142, 28, "UC-DEL-01a", "Bản đồ lộ trình giao hàng GPS", "uc"))
    lines.append(uc(2210, 1925, 142, 28, "UC-DEL-02", "Liên hệ người nhận (ẩn số)", "uc"))
    lines.append(uc(2210, 2065, 145, 28, "UC-DEL-05", "Xác nhận giao thành công", "uc-core"))
    lines.append(uc(2210, 2225, 142, 28, "UC-DEL-06", "Cập nhật sự cố thất bại NDR", "uc"))
    lines.append(uc(2210, 2365, 142, 28, "UC-DEL-06a", "Hẹn lại ngày phát (Reschedule)", "uc-ext"))

    # Relationships in Pkg 3:
    lines.append(direct_dep_arrow(2210, 1805, 142, 28, 2210, 1685, 142, 28, "«extend»", 15))
    lines.append(direct_dep_arrow(2210, 2065, 145, 28, 1630, 1725, 142, 28, "«include»", -15))
    lines.append(direct_dep_arrow(2210, 2065, 145, 28, 1630, 1885, 142, 28, "«include»", 15))
    lines.append(direct_dep_arrow(2210, 2225, 142, 28, 2210, 2065, 145, 28, "«extend»", 15))
    lines.append(direct_dep_arrow(2210, 2365, 142, 28, 2210, 2225, 142, 28, "«extend»", 15))
    lines.append(direct_dep_arrow(1630, 2125, 145, 28, 1630, 2345, 145, 28, "«include»", 16))
    lines.append('  </g>')
    lines.append('')

    # -------------------------------------------------------------------------
    # ROW 3 (Y = 2775 to 3905, H = 1130):
    # Left: PHÂN HỆ 4 (Tài chính & COD) | Right: PHÂN HỆ 6 (Quản trị & RBAC)
    # -------------------------------------------------------------------------

    # PKG 4: TÀI CHÍNH, THU HỘ COD & ĐỐI SOÁT (Left: X = 370 to 1390, W = 1020)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 4: TÀI CHÍNH, THU HỘ COD & ĐỐI SOÁT               -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(370, 2775, 1020, 1130, 680, "PHÂN HỆ 4: TÀI CHÍNH, COD & ĐỐI SOÁT — payment-service • reporting", "Pkg_4_Finance_COD"))

    # Col 1: Reconciliation, Deduction, Settlement
    lines.append(uc(580, 2885, 142, 28, "UC-FIN-05", "Lịch sử đối soát SePay/VietQR", "uc-core"))
    lines.append(uc(580, 3045, 142, 28, "UC-FIN-07", "Khấu trừ cước hoàn phân tầng", "uc-ext"))
    lines.append(uc(580, 3245, 145, 28, "UC-FIN-04", "Đối soát giải ngân COD &amp; VietQR", "uc-core"))
    lines.append(uc(580, 3425, 145, 28, "UC-FIN-03", "Phê duyệt quyết toán COD thủ công", "uc"))

    # Col 2: COD Collection & Auto Reconciliation
    lines.append(uc(1170, 2885, 142, 28, "UC-FIN-01", "Thu hộ tiền mặt COD", "uc-core"))
    lines.append(uc(1170, 3045, 142, 28, "UC-FIN-02", "Nộp tiền COD qua VietQR", "uc-core"))
    lines.append(uc(1170, 3245, 145, 28, "UC-FIN-06", "Khớp nối SePay &amp; Khấu trừ tự động", "uc-core"))

    # Relationships in Pkg 4: (100% PURE VERTICAL & HORIZONTAL)
    lines.append(direct_dep_arrow(580, 3045, 142, 28, 580, 2885, 142, 28, "«extend»", 16))
    lines.append(direct_dep_arrow(1170, 3045, 142, 28, 1170, 2885, 142, 28, "«include»", 16))
    lines.append(direct_dep_arrow(580, 3425, 145, 28, 580, 3245, 145, 28, "«extend»", 16))
    # Pure horizontal inclusion line at Y = 3245:
    lines.append(direct_dep_arrow(1170, 3245, 145, 28, 580, 3245, 145, 28, "«include»", -15))
    lines.append('  </g>')
    lines.append('')

    # PKG 6: QUẢN TRỊ HỆ THỐNG, RBAC & CẤU HÌNH (Right: X = 1410 to 2430, W = 1020)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG, RBAC & CẤU HÌNH             -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(1410, 2775, 1020, 1130, 680, "PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG & RBAC — masterdata • auth-service", "Pkg_6_Admin_RBAC"))

    # Col 1 (Sub-col for Zone & Outbox): cx = 1630
    lines.append(uc(1630, 2885, 142, 28, "UC-ADM-02", "Phân công nhân sự &amp; Tuyến", "uc"))
    lines.append(uc(1630, 3025, 142, 28, "UC-ADM-06", "Quản lý khu vực / Zone địa lý", "uc"))
    lines.append(uc(1630, 3165, 142, 28, "UC-ADM-04", "Phân quyền mobile override", "uc-ext"))
    lines.append(uc(1630, 3425, 145, 28, "UC-ADM-10", "Chuyển giao Outbox &amp; RabbitMQ", "uc-core"))
    lines.append(uc(1630, 3625, 145, 28, "UC-ADM-11", "Chiếu Read Model Timeline &amp; KPI", "uc-core"))

    # Col 2 (Facing Admin Directly): cx = 2210
    lines.append(uc(2210, 2885, 142, 28, "UC-ADM-01", "Quản lý tài khoản toàn hệ thống", "uc-core"))
    lines.append(uc(2210, 3025, 142, 28, "UC-ADM-05", "Quản lý danh mục Hub 4 cấp", "uc-core"))
    lines.append(uc(2210, 3165, 145, 28, "UC-ADM-03", "Quản lý phân quyền RBAC Matrix", "uc-core"))
    lines.append(uc(2210, 3305, 142, 28, "UC-ADM-07", "Danh mục lý do giao NDR", "uc"))
    lines.append(uc(2210, 3445, 142, 28, "UC-ADM-08", "Cấu hình tham số hệ thống", "uc-core"))
    lines.append(uc(2210, 3585, 142, 28, "UC-ADM-09", "Kiểm toán nhật ký hệ thống", "uc-core"))

    # Relationships in Pkg 6:
    lines.append(direct_dep_arrow(2210, 2885, 142, 28, 1630, 2885, 142, 28, "«include»", -15))
    lines.append(direct_dep_arrow(2210, 3025, 142, 28, 1630, 3025, 142, 28, "«include»", -15))
    lines.append(direct_dep_arrow(1630, 3165, 142, 28, 2210, 3165, 145, 28, "«extend»", 15))
    lines.append(direct_dep_arrow(1630, 3425, 145, 28, 1630, 3625, 145, 28, "«include»", 16))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # 7 ACTORS SPECIFICATION (LEFT & RIGHT FLANKS)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- 7 ACTORS (OPTIMIZED POSITIONING & ZERO INTERSECTIONS)     -->')
    lines.append('  <!-- ========================================================= -->')

    # LEFT FLANK (cx = 150):
    lines.append(actor_stick(150, 750, "Người Gửi Hàng (Merchant)", "(Chủ Shop B2B • 15 UCs)", "merchant-web :5174"))
    lines.append(actor_stick(150, 1680, "Khách Vãng Lai (Guest)", "(Người dùng tự do • 9 UCs)", "guest-web :5177"))
    lines.append(actor_stick(150, 2100, "Khách Hàng Cá Nhân", "(Customer C-End • 6 UCs)", "customer-mobile :8082"))

    # Generalization: Customer -> Guest (Customer inherits & specializes Guest)
    lines.append('  <g id="Gen_Customer_Guest">')
    lines.append('    <line x1="150" y1="1810" x2="150" y2="1750" class="gen-line"/>')
    lines.append('    <polygon points="150,1735 142,1755 158,1755" class="gen-arrow"/>')
    lines.append('  </g>')

    # RIGHT FLANK (cx = 2650):
    lines.append(actor_stick(2650, 750, "Nhân Viên Vận Hành", "(Ops Staff Bưu Cục & Hub • 19 UCs)", "ops-web :5173"))
    lines.append(actor_stick(2650, 1900, "Nhân Viên Giao Hàng", "(Shipper Chặng Cuối • 13 UCs)", "courier-mobile :8081"))
    lines.append(actor_stick(2650, 3150, "Quản Trị Viên (Admin)", "(System Admin • 11 UCs)", "admin-web :5175"))

    # Supporting System Actor (Bottom Right):
    lines.append('  <g id="Actor_System_AI">')
    lines.append('    <rect x="2492" y="3672" width="280" height="96" rx="6" fill="#0F2438" fill-opacity="0.06"/>')
    lines.append('    <rect x="2490" y="3670" width="280" height="96" class="sys-actor-box"/>')
    lines.append('    <text x="2630" y="3696" class="t-rel">«supporting system actor»</text>')
    lines.append('    <text x="2630" y="3718" class="t-actor">Trợ Lý AI &amp; Hệ Thống</text>')
    lines.append('    <text x="2630" y="3738" class="t-role">chatbot-service • outbox relay</text>')
    lines.append('    <text x="2630" y="3754" class="t-app">Event Bus &amp; Read Models</text>')
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # CONNECTIONS (ACTORS TO USE CASES) - CEILING CHANNELS & CLEAN RUNWAYS
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- ACTOR ASSOCIATIONS (DEDICATED ZERO-COLLISION RUNWAYS)     -->')
    lines.append('  <!-- ========================================================= -->')

    m_hand_fwd = (178, 750)
    m_hand_back = (122, 750)

    g_hand_fwd = (178, 1680)

    c_hand_fwd = (178, 2100)
    c_hand_back = (122, 2100)

    ops_hand_fwd = (2622, 750)
    ops_hand_back = (2678, 750)

    ship_hand_fwd = (2622, 1900)
    ship_hand_back = (2678, 1900)

    adm_hand_fwd = (2622, 3150)
    adm_hand_back = (2678, 3150)

    sys_hand = (2490, 3720)

    # -------------------------------------------------------------------------
    # 1. MERCHANT (m_hand)
    # -------------------------------------------------------------------------
    # Direct fan-out into adjacent Pkg 1 Use Cases:
    lines.append(path_to_ellipse([(m_hand_fwd[0], m_hand_fwd[1]), (220, 750), (220, 525)], 580, 525, 142, 28, radius=14)) # UC-ORD-01a
    lines.append(direct_line(m_hand_fwd[0], m_hand_fwd[1], 580, 925, 142, 28, "assoc")) # UC-ORD-03
    lines.append(direct_line(m_hand_fwd[0], m_hand_fwd[1], 580, 1055, 142, 28, "assoc")) # UC-ORD-04
    lines.append(direct_line(m_hand_fwd[0], m_hand_fwd[1], 580, 1195, 145, 28, "assoc")) # UC-ORD-02
    lines.append(direct_line(m_hand_fwd[0], m_hand_fwd[1], 580, 1335, 145, 28, "assoc")) # UC-ORD-09

    # Merchant -> Auth Hub (Behind-the-actor corridor at X = 70 -> Top Gateway Y = 265):
    lines.append(path_to_ellipse([(m_hand_back[0], m_hand_back[1]), (70, 750), (70, 265)], 1400, 275, 170, 35, radius=16, label="Merchant", label_pt=(70, 480))) # UC-AUTH-01

    # Merchant -> Progress tracking (UC-AI-01c) via Behind-the-actor corridor X = 90:
    lines.append(path_to_ellipse([(m_hand_back[0], m_hand_back[1]), (90, 750), (90, 1915)], 580, 1915, 142, 28, radius=16, label="Merchant", label_pt=(90, 1350))) # UC-AI-01c

    # Merchant -> Finance settlement (UC-FIN-05) via Behind-the-actor corridor X = 50:
    lines.append(path_to_ellipse([(m_hand_back[0], m_hand_back[1]), (50, 750), (50, 2885)], 580, 2885, 142, 28, radius=16, label="Merchant", label_pt=(50, 2650))) # UC-FIN-05

    # -------------------------------------------------------------------------
    # 2. GUEST USER (g_hand at Y = 1680)
    # -------------------------------------------------------------------------
    # Direct fan-out to public use cases:
    lines.append(direct_line(g_hand_fwd[0], g_hand_fwd[1], 580, 1675, 142, 28, "assoc")) # UC-AI-01a
    # Guest -> UC-AI-02 (Ước tính cước) & UC-AI-04 (Chatbot AI) via dedicated runway X = 250:
    lines.append(path_to_ellipse([(g_hand_fwd[0], g_hand_fwd[1]), (250, 1680), (250, 2055)], 580, 2055, 145, 28, radius=16)) # UC-AI-02
    lines.append(path_to_ellipse([(g_hand_fwd[0], g_hand_fwd[1]), (250, 1680), (250, 2205)], 580, 2205, 150, 30, radius=16)) # UC-AI-04

    # Guest -> UC-ORD-01c (Tạo đơn khách vãng lai) via clean runway X = 250 going up:
    lines.append(path_to_ellipse([(g_hand_fwd[0], g_hand_fwd[1]), (250, 1680), (250, 785)], 580, 785, 142, 28, radius=16, label="Guest", label_pt=(250, 1260))) # UC-ORD-01c

    # -------------------------------------------------------------------------
    # 3. CUSTOMER (c_hand at Y = 1850)
    # -------------------------------------------------------------------------
    # Direct connection to personal realtime tracking:
    lines.append(path_to_ellipse([(c_hand_fwd[0], c_hand_fwd[1]), (280, 2100), (280, 1795)], 580, 1795, 142, 28, radius=16, label="Customer", label_pt=(280, 1950))) # UC-AI-01b
    # Inherits UC-AI-04, 02, 01a from Guest via «specializes»!

    # Customer -> Pkg 1 (UC-ORD-01b & UC-ORD-08) via corridor at X = 290 & X = 310:
    lines.append(path_to_ellipse([(c_hand_fwd[0], c_hand_fwd[1]), (290, 2100), (290, 655)], 580, 655, 142, 28, radius=16, label="Customer", label_pt=(290, 1450))) # UC-ORD-01b
    lines.append(path_to_ellipse([(c_hand_fwd[0], c_hand_fwd[1]), (310, 2100), (310, 1475)], 580, 1475, 142, 28, radius=16, label="Customer", label_pt=(310, 1660))) # UC-ORD-08

    # Customer -> Auth Hub via Behind-the-actor corridor X = 70:
    lines.append(path_to_ellipse([(c_hand_back[0], c_hand_back[1]), (70, 2100), (70, 285)], 1400, 275, 170, 35, radius=16, label="Customer", label_pt=(70, 1050))) # UC-AUTH-01

    # Customer -> OTP Verification (UC-DEL-03) via Avenue between Row 1 & Row 2 at Y = 1585:
    lines.append(path_to_ellipse([(c_hand_fwd[0], c_hand_fwd[1]), (330, 2100), (330, 1585), (1630, 1585)], 1630, 1725, 142, 28, radius=16, label="Customer", label_pt=(1520, 1585))) # UC-DEL-03

    # -------------------------------------------------------------------------
    # 4. OPS STAFF (ops_hand at Y = 750)
    # -------------------------------------------------------------------------
    # Direct fan-out into adjacent Pkg 2 Col 2:
    lines.append(direct_line(ops_hand_fwd[0], ops_hand_fwd[1], 2210, 525, 142, 28, "assoc")) # UC-HUB-01
    lines.append(direct_line(ops_hand_fwd[0], ops_hand_fwd[1], 2210, 645, 142, 28, "assoc")) # UC-HUB-01a
    lines.append(direct_line(ops_hand_fwd[0], ops_hand_fwd[1], 2210, 765, 142, 28, "assoc")) # UC-HUB-01b
    lines.append(direct_line(ops_hand_fwd[0], ops_hand_fwd[1], 2210, 885, 145, 28, "assoc")) # UC-HUB-02a
    lines.append(direct_line(ops_hand_fwd[0], ops_hand_fwd[1], 2210, 1005, 145, 28, "assoc")) # UC-HUB-02b
    lines.append(direct_line(ops_hand_fwd[0], ops_hand_fwd[1], 2210, 1275, 142, 28, "assoc")) # UC-HUB-06
    lines.append(direct_line(ops_hand_fwd[0], ops_hand_fwd[1], 2210, 1425, 142, 28, "assoc")) # UC-HUB-07

    # Ops Staff -> Linehaul (UC-HUB-04) via Pkg 2 ceiling corridor Y = 490 (zero crossing!):
    lines.append(path_to_ellipse([(ops_hand_fwd[0], ops_hand_fwd[1]), (2470, 750), (2470, 490), (1630, 490)], 1630, 685, 145, 28, radius=16)) # UC-HUB-04

    # Ops Staff -> Auth Hub via Behind-the-actor corridor X = 2710 -> Gateway Y = 265:
    lines.append(path_to_ellipse([(ops_hand_back[0], ops_hand_back[1]), (2710, 750), (2710, 265)], 1400, 275, 170, 35, radius=16, label="Ops Staff", label_pt=(2710, 480))) # UC-AUTH-01

    # Ops Staff -> NDR xử lý (UC-DEL-07) via Central Blvd X = 1400 (entering from LEFT side of Pkg 3, bypassing Col 2 completely):
    lines.append(path_to_ellipse([(ops_hand_back[0], ops_hand_back[1]), (2750, 750), (2750, 1585), (1400, 1585), (1400, 2125)], 1630, 2125, 145, 28, radius=16, label="Ops Staff", label_pt=(2000, 1585))) # UC-DEL-07

    # Ops Staff -> Đối soát COD (UC-FIN-04) via Behind-the-actor X = 2760 -> Avenue Y = 2765 -> Central Blvd X = 1400 -> Top of 04:
    lines.append(path_to_ellipse([(ops_hand_back[0], ops_hand_back[1]), (2760, 750), (2760, 2765), (1400, 2765), (1400, 3165), (580, 3165)], 580, 3245, 145, 28, radius=16, label="Ops Staff", label_pt=(1800, 2765))) # UC-FIN-04

    # -------------------------------------------------------------------------
    # 5. SHIPPER (ship_hand at Y = 1900)
    # -------------------------------------------------------------------------
    # Direct fan-out into adjacent Pkg 3 Col 2 (Completely empty runway, zero vertical lines!):
    lines.append(direct_line(ship_hand_fwd[0], ship_hand_fwd[1], 2210, 1685, 142, 28, "assoc")) # UC-DEL-01
    lines.append(direct_line(ship_hand_fwd[0], ship_hand_fwd[1], 2210, 1805, 142, 28, "assoc")) # UC-DEL-01a
    lines.append(direct_line(ship_hand_fwd[0], ship_hand_fwd[1], 2210, 1925, 142, 28, "assoc")) # UC-DEL-02
    lines.append(direct_line(ship_hand_fwd[0], ship_hand_fwd[1], 2210, 2065, 145, 28, "assoc")) # UC-DEL-05
    lines.append(direct_line(ship_hand_fwd[0], ship_hand_fwd[1], 2210, 2225, 142, 28, "assoc")) # UC-DEL-06
    lines.append(direct_line(ship_hand_fwd[0], ship_hand_fwd[1], 2210, 2365, 142, 28, "assoc")) # UC-DEL-06a

    # Shipper -> Scan Pickup (UC-HUB-02c) via Behind-the-actor corridor X = 2730 -> Gap Y = 1125:
    lines.append(path_to_ellipse([(ship_hand_back[0], ship_hand_back[1]), (2730, 1900), (2730, 1125)], 2210, 1125, 142, 28, radius=16, label="Shipper", label_pt=(2730, 1450))) # UC-HUB-02c

    # Shipper -> Thu COD & VietQR (UC-FIN-01, 02) via Behind-the-actor corridor X = 2720 -> Avenue Y = 2765:
    lines.append(path_to_ellipse([(ship_hand_back[0], ship_hand_back[1]), (2720, 1900), (2720, 2765), (1330, 2765), (1330, 2885)], 1170, 2885, 142, 28, radius=16, label="Shipper", label_pt=(2100, 2765))) # UC-FIN-01
    lines.append(path_to_ellipse([(ship_hand_back[0], ship_hand_back[1]), (2720, 1900), (2720, 2765), (1350, 2765), (1350, 3045)], 1170, 3045, 142, 28, radius=16)) # UC-FIN-02

    # Shipper -> Auth Hub via Behind-the-actor corridor X = 2730 -> Gateway Y = 285:
    lines.append(path_to_ellipse([(ship_hand_back[0], ship_hand_back[1]), (2730, 1900), (2730, 285)], 1400, 275, 170, 35, radius=16, label="Shipper", label_pt=(2730, 1050))) # UC-AUTH-01

    # -------------------------------------------------------------------------
    # 6. SYSTEM ADMIN (adm_hand at Y = 3150)
    # -------------------------------------------------------------------------
    # Direct fan-out into adjacent Pkg 6 Col 2:
    lines.append(direct_line(adm_hand_fwd[0], adm_hand_fwd[1], 2210, 2885, 142, 28, "assoc")) # UC-ADM-01
    lines.append(direct_line(adm_hand_fwd[0], adm_hand_fwd[1], 2210, 3025, 142, 28, "assoc")) # UC-ADM-05
    lines.append(direct_line(adm_hand_fwd[0], adm_hand_fwd[1], 2210, 3165, 145, 28, "assoc")) # UC-ADM-03
    lines.append(direct_line(adm_hand_fwd[0], adm_hand_fwd[1], 2210, 3305, 142, 28, "assoc")) # UC-ADM-07
    lines.append(direct_line(adm_hand_fwd[0], adm_hand_fwd[1], 2210, 3445, 142, 28, "assoc")) # UC-ADM-08
    lines.append(direct_line(adm_hand_fwd[0], adm_hand_fwd[1], 2210, 3585, 142, 28, "assoc")) # UC-ADM-09

    # Admin -> Auth Hub via Behind-the-actor corridor X = 2750 -> Gateway Y = 305:
    lines.append(path_to_ellipse([(adm_hand_back[0], adm_hand_back[1]), (2750, 3150), (2750, 305)], 1400, 275, 170, 35, radius=16, label="Admin", label_pt=(2750, 2500))) # UC-AUTH-01

    # -------------------------------------------------------------------------
    # 7. SYSTEM & AI (sys_hand at Y = 3720)
    # -------------------------------------------------------------------------
    # System -> Outbox RabbitMQ & Read Model Timeline (UC-ADM-10, 11):
    lines.append(path_to_ellipse([(sys_hand[0], sys_hand[1]), (1850, 3720), (1850, 3425)], 1630, 3425, 145, 28, radius=16, label="System", label_pt=(1850, 3520))) # UC-ADM-10
    lines.append(path_to_ellipse([(sys_hand[0], sys_hand[1]), (1850, 3720), (1850, 3625)], 1630, 3625, 145, 28, radius=16)) # UC-ADM-11

    # System -> SePay Khớp nối tự động (UC-FIN-06) via bottom avenue Y = 3785:
    lines.append(path_to_ellipse([(sys_hand[0], sys_hand[1]), (2450, 3720), (2450, 3785), (1330, 3785), (1330, 3245)], 1170, 3245, 145, 28, radius=16, label="System", label_pt=(1950, 3785))) # UC-FIN-06

    # System -> IATA engine (UC-AI-03) via bottom avenue Y = 3815 -> Central Blvd X = 1400 (bypassing Pkg 4 completely!):
    lines.append(path_to_ellipse([(sys_hand[0], sys_hand[1]), (2450, 3720), (2450, 3815), (1400, 3815), (1400, 2055)], 1170, 2055, 150, 28, radius=16, label="System & AI", label_pt=(2200, 3815))) # UC-AI-03

    lines.append('</svg>')
    return "\n".join(lines)

if __name__ == "__main__":
    svg_content = generate_svg()
    target_path = os.path.abspath("docs/graduation-thesis/figma-page-1-system-and-data/diagrams/01-use-case-general-system.svg")
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated successfully: {target_path} ({len(svg_content.encode('utf-8'))} bytes)")
