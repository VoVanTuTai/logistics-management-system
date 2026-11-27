#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE VISUAL PARADIGM STANDARD DOMAIN MODEL DIAGRAM (OMG UML 2.5)
===================================================================
Bản vẽ Sơ đồ Miền Nghiệp vụ Toàn Hệ thống Nexus Logistics Express
Thiết kế theo chuẩn nhận diện Visual Paradigm Enterprise Edition:
- Chuẩn UML 2.5 Class Diagram với 3 ngăn (Compartments): Header (Stereotype + Name), Attributes (+ field : Type), Operations (+ method() : Type).
- Khung Phân hệ Bounded Context với Folder-Tab đặc trưng của Visual Paradigm.
- Nhận diện trực quan Visual Paradigm: Icon tròn [C], [AR], [VO], [DS], [EVT] tại header thẻ.
- Bảng màu Visual Paradigm Modern Enterprise: Soft header accents, nền thẻ trắng ngà sang trọng, viền thanh mảnh sắc sảo.
- Ký hiệu quan hệ UML 2.5 chuẩn:
  + Composition (Hình thoi đen đặc ◆) cho quan hệ sở hữu phụ thuộc vòng đời.
  + Aggregation (Hình thoi trắng rỗng ◇) cho quan hệ tập hợp lỏng.
  + Association (Đường nét liền) kèm Bản số (Multiplicity: 1, 0..1, 1..*, *) và Nhãn vai trò (+creates >, +assigned to >).
  + Dependency / Event Subscription (Đường nét đứt - - - >) cho luồng RabbitMQ Event Bus.
- Dog-eared Notes (Ghi chú gấp góc) màu vàng kèm neo chỉ dẫn nghiệp vụ then chốt (IATA V/6000, Trần vật lý 70kg, Giải trình 24h & Bồi thường 100%).
- 100% Native Inline Vector: Tương thích hoàn hảo Figma, Draw.io và in ấn đồ án tốt nghiệp A4/A3.
"""

import os
import html

def xml_esc(s):
    if s is None:
        return ""
    return html.escape(str(s), quote=True)

class VisualParadigmDomainBuilder:
    def __init__(self, width=3600, height=2400):
        self.w = width
        self.h = height
        self.lines = []
        self._init_canvas()

    def _init_canvas(self):
        self.lines.append('<?xml version="1.0" encoding="UTF-8"?>')
        self.lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="background:#FFFFFF;">')
        self.lines.append('  <defs>')
        self.lines.append('    <style type="text/css"><![CDATA[')
        self.lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }')
        self.lines.append('      .mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }')
        self.lines.append('      .bg { fill: #FFFFFF; }')
        self.lines.append('      .frame-outer { fill: none; stroke: #0F172A; stroke-width: 3.0; }')
        self.lines.append('      .frame-inner { fill: none; stroke: #475569; stroke-width: 1.0; stroke-dasharray: 8 4; }')
        self.lines.append('      .title-main { font-size: 34px; font-weight: 900; fill: #0F172A; letter-spacing: 0.5px; }')
        self.lines.append('      .title-sub { font-size: 18px; font-weight: 700; fill: #475569; }')
        self.lines.append('      .title-badge { font-family: ui-monospace, Menlo, monospace; font-size: 15px; font-weight: 800; fill: #0F172A; }')
        self.lines.append('      .pkg-bg { fill: #F8FAFC; stroke: #64748B; stroke-width: 1.6; stroke-dasharray: 6 3; rx: 6px; }')
        self.lines.append('      .pkg-tab { stroke: #64748B; stroke-width: 1.6; rx: 4px; }')
        self.lines.append('      .pkg-tab-title { font-size: 13.5px; font-weight: 900; fill: #FFFFFF; letter-spacing: 0.5px; }')
        self.lines.append('      .pkg-sub { font-size: 12px; font-weight: 700; font-family: ui-monospace, Menlo, monospace; fill: #475569; }')
        self.lines.append('      .cls-box { fill: #FFFFFF; stroke-width: 1.6; rx: 5px; }')
        self.lines.append('      .cls-hdr-txt { font-size: 16px; font-weight: 900; }')
        self.lines.append('      .cls-stereo { font-size: 11px; font-style: italic; font-weight: 700; }')
        self.lines.append('      .cls-db-tag { font-family: ui-monospace, Menlo, monospace; font-size: 10px; font-weight: 700; }')
        self.lines.append('      .cls-attr { font-family: ui-monospace, Menlo, monospace; font-size: 12px; font-weight: 700; fill: #1E293B; }')
        self.lines.append('      .cls-meth { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; font-weight: 700; fill: #0F172A; }')
        self.lines.append('      .cls-badge-txt { font-family: ui-monospace, Menlo, monospace; font-size: 10px; font-weight: 900; fill: #FFFFFF; text-anchor: middle; }')
        self.lines.append('      .multiplicity { font-family: ui-monospace, Menlo, monospace; font-size: 13px; font-weight: 900; fill: #0F172A; }')
        self.lines.append('      .role-label { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; font-weight: 800; fill: #1E3A8A; }')
        self.lines.append('      .conn-line { fill: none; stroke: #0F172A; stroke-width: 1.8; }')
        self.lines.append('      .conn-event { fill: none; stroke: #D97706; stroke-width: 1.8; stroke-dasharray: 6 3; }')
        self.lines.append('      .note-line { fill: none; stroke: #B45309; stroke-width: 1.4; stroke-dasharray: 4 3; }')
        self.lines.append('    ]]></style>')
        self.lines.append('  </defs>')
        self.lines.append('  <rect width="100%" height="100%" class="bg"/>')
        self.lines.append('  <rect x="18" y="18" width="3564" height="2364" class="frame-outer"/>')
        self.lines.append('  <rect x="26" y="26" width="3548" height="2348" class="frame-inner"/>')

    def add_header(self):
        # Header banner (Y: 38 -> 144)
        self.lines.append('  <!-- ==================== SYSTEM HEADER ==================== -->')
        self.lines.append('  <g id="SystemHeader">')
        self.lines.append('    <rect x="38" y="38" width="3524" height="106" fill="#F8FAFC" stroke="#0F172A" stroke-width="2.0" rx="6"/>')
        self.lines.append('    <line x1="2880" y1="38" x2="2880" y2="144" stroke="#CBD5E1" stroke-width="1.5"/>')
        self.lines.append('    <text x="65" y="78" class="title-main">SƠ ĐỒ MIỀN NGHIỆP VỤ TỔNG THỂ TOÀN HỆ THỐNG (GLOBAL DOMAIN MODEL)</text>')
        self.lines.append('    <text x="65" y="106" class="title-sub">Hệ Thống Quản Trị &amp; Vận Hành Logistics Đa Kênh Nexus Enterprise • Kiến Trúc Bounded Contexts &amp; Aggregate Roots • Chuẩn OMG UML 2.5 / Visual Paradigm</text>')
        self.lines.append('    <text x="65" y="130" class="title-badge">TIÊU CHUẨN: DDD STRATEGIC &amp; TACTICAL PATTERN • 6 BOUNDED CONTEXTS • 11 DATABASE-PER-SERVICE • TRANSACTIONAL OUTBOX &amp; CQRS EVENT BUS</text>')
        self.lines.append('    <text x="2905" y="72" font-size="14" font-weight="800" fill="#64748B">BẢN VẼ KỸ THUẬT: <tspan font-weight="900" fill="#0F172A">DOC-DATA-DOMAIN-01</tspan></text>')
        self.lines.append('    <text x="2905" y="98" font-size="14" font-weight="800" fill="#64748B">PHIÊN BẢN: <tspan font-weight="900" fill="#1D4ED8">REV.2026-VP (ENTERPRISE EDITION)</tspan></text>')
        self.lines.append('    <text x="2905" y="124" font-size="13" font-weight="800" fill="#059669">TRẠNG THÁI: CHUẨN HÓA 100% PRISMA CODEBASE</text>')
        self.lines.append('  </g>')

    def draw_package(self, px, py, pw, ph, tab_w, title, sub_title, pkg_color="#1E3A8A"):
        """Draw Visual Paradigm standard package with folder tab."""
        res = []
        tab_h = 28
        res.append(f'  <!-- Package: {title} -->')
        # Body
        res.append(f'  <rect x="{px}" y="{py}" width="{pw}" height="{ph}" class="pkg-bg"/>')
        # Tab
        res.append(f'  <rect x="{px}" y="{py}" width="{tab_w}" height="{tab_h}" fill="{pkg_color}" class="pkg-tab"/>')
        res.append(f'  <text x="{px + 12}" y="{py + 19}" class="pkg-tab-title">{xml_esc(title)}</text>')
        res.append(f'  <text x="{px + tab_w + 14}" y="{py + 19}" class="pkg-sub">{xml_esc(sub_title)}</text>')
        return "\n".join(res)

    def draw_class(self, cx, cy, cw, name, stereotype, db_tag, attrs, meths, theme="blue"):
        """
        Draw a Visual Paradigm standard 3-compartment class.
        theme: 'blue' (Core/SSOT), 'amber' (First-Mile), 'green' (Transit), 'wine' (Last-Mile), 'slate' (Master), 'purple' (ReadModel/AI)
        """
        color_map = {
            "blue":   {"hdr": "#1E3A8A", "txt": "#FFFFFF", "border": "#1E3A8A", "badge": "#2563EB", "badge_txt": "AR"},
            "slate":  {"hdr": "#334155", "txt": "#FFFFFF", "border": "#334155", "badge": "#475569", "badge_txt": "E"},
            "amber":  {"hdr": "#9A6800", "txt": "#FFFFFF", "border": "#9A6800", "badge": "#D97706", "badge_txt": "AR"},
            "green":  {"hdr": "#166534", "txt": "#FFFFFF", "border": "#166534", "badge": "#059669", "badge_txt": "AR"},
            "wine":   {"hdr": "#831843", "txt": "#FFFFFF", "border": "#831843", "badge": "#9D174D", "badge_txt": "AR"},
            "purple": {"hdr": "#581C87", "txt": "#FFFFFF", "border": "#581C87", "badge": "#7E22CE", "badge_txt": "CQRS"},
            "vo":     {"hdr": "#047857", "txt": "#FFFFFF", "border": "#047857", "badge": "#10B981", "badge_txt": "VO"},
            "ds":     {"hdr": "#6D28D9", "txt": "#FFFFFF", "border": "#6D28D9", "badge": "#8B5CF6", "badge_txt": "DS"},
        }
        cfg = color_map.get(theme, color_map["blue"])

        hdr_h = 44
        attr_row_h = 19
        meth_row_h = 19
        attrs_h = len(attrs) * attr_row_h + 10
        meths_h = len(meths) * meth_row_h + 10
        total_h = hdr_h + attrs_h + meths_h

        res = []
        # Main Outer Box
        res.append(f'  <!-- Class: {name} -->')
        res.append(f'  <g id="class_{name}">')
        res.append(f'    <rect x="{cx}" y="{cy}" width="{cw}" height="{total_h}" class="cls-box" stroke="{cfg["border"]}"/>')

        # Compartment 1: Header
        res.append(f'    <path d="M {cx} {cy+5} A 5 5 0 0 1 {cx+5} {cy} L {cx+cw-5} {cy} A 5 5 0 0 1 {cx+cw} {cy+5} L {cx+cw} {cy+hdr_h} L {cx} {cy+hdr_h} Z" fill="{cfg["hdr"]}"/>')
        res.append(f'    <text x="{cx + 12}" y="{cy + 17}" class="cls-stereo" fill="#E2E8F0">«{stereotype}»</text>')
        res.append(f'    <text x="{cx + 12}" y="{cy + 36}" class="cls-hdr-txt" fill="{cfg["txt"]}">{xml_esc(name)}</text>')

        # DB Tag & VP Badge
        res.append(f'    <text x="{cx + cw - 48}" y="{cy + 34}" class="cls-db-tag" fill="#CBD5E1" text-anchor="end">[{db_tag}]</text>')
        # Round icon badge
        badge_x = cx + cw - 26
        badge_y = cy + 22
        res.append(f'    <circle cx="{badge_x}" cy="{badge_y}" r="11" fill="{cfg["badge"]}" stroke="#FFFFFF" stroke-width="1.2"/>')
        res.append(f'    <text x="{badge_x}" y="{badge_y + 4}" class="cls-badge-txt">{cfg["badge_txt"]}</text>')

        # Compartment 2: Attributes
        res.append(f'    <line x1="{cx}" y1="{cy + hdr_h}" x2="{cx + cw}" y2="{cy + hdr_h}" stroke="{cfg["border"]}" stroke-width="1.4"/>')
        attr_y = cy + hdr_h + 16
        for attr in attrs:
            res.append(f'    <text x="{cx + 10}" y="{attr_y}" class="cls-attr">{xml_esc(attr)}</text>')
            attr_y += attr_row_h

        # Compartment 3: Operations
        meth_sep_y = cy + hdr_h + attrs_h
        res.append(f'    <line x1="{cx}" y1="{meth_sep_y}" x2="{cx + cw}" y2="{meth_sep_y}" stroke="{cfg["border"]}" stroke-width="1.2" stroke-dasharray="3 2"/>')
        meth_y = meth_sep_y + 16
        for meth in meths:
            res.append(f'    <text x="{cx + 10}" y="{meth_y}" class="cls-meth">{xml_esc(meth)}</text>')
            meth_y += meth_row_h

        res.append('  </g>')
        return "\n".join(res), total_h

    def draw_dogear_note(self, nx, ny, nw, nh, title, lines, anchor_x=None, anchor_y=None):
        """Draw Visual Paradigm classic yellow folded note with connector line."""
        fold = 16
        pts = f"{nx},{ny} {nx+nw-fold},{ny} {nx+nw},{ny+fold} {nx+nw},{ny+nh} {nx},{ny+nh}"
        res = []
        res.append(f'  <!-- Dog-eared Note: {title} -->')
        res.append(f'  <polygon points="{pts}" fill="#FEF9C3" stroke="#854D0E" stroke-width="1.6"/>')
        res.append(f'  <polygon points="{nx+nw-fold},{ny} {nx+nw-fold},{ny+fold} {nx+nw},{ny+fold}" fill="#FDE047" stroke="#854D0E" stroke-width="1.4"/>')
        res.append(f'  <text x="{nx + 12}" y="{ny + 22}" font-size="13" font-weight="900" fill="#854D0E">«Note: {xml_esc(title)}»</text>')
        ly = ny + 40
        for l in lines:
            res.append(f'  <text x="{nx + 12}" y="{ly}" font-size="11.5" font-weight="700" fill="#1F2937">{xml_esc(l)}</text>')
            ly += 17

        if anchor_x is not None and anchor_y is not None:
            # Anchor connector
            start_x = nx if anchor_x < nx else (nx + nw if anchor_x > nx + nw else nx + nw/2)
            start_y = ny + nh/2
            res.append(f'  <circle cx="{anchor_x}" cy="{anchor_y}" r="4.0" fill="#854D0E"/>')
            res.append(f'  <line x1="{start_x}" y1="{start_y}" x2="{anchor_x}" y2="{anchor_y}" class="note-line"/>')
        return "\n".join(res)

    def draw_composition(self, x1, y1, x2, y2, mult1="1", mult2="1..*", role=""):
        """Draw UML Composition (Black Diamond at x1,y1)."""
        res = []
        # Black diamond at source
        res.append(f'  <polygon points="{x1},{y1} {x1+8},{y1-5} {x1+16},{y1} {x1+8},{y1+5}" fill="#0F172A" stroke="#0F172A"/>')
        res.append(f'  <line x1="{x1+16}" y1="{y1}" x2="{x2}" y2="{y2}" class="conn-line"/>')
        if mult1:
            res.append(f'  <text x="{x1+22}" y="{y1-8}" class="multiplicity">{mult1}</text>')
        if mult2:
            res.append(f'  <text x="{x2-30}" y="{y2-8}" class="multiplicity">{mult2}</text>')
        if role:
            mx = (x1 + x2) / 2
            my = (y1 + y2) / 2 - 8
            res.append(f'  <text x="{mx}" y="{my}" class="role-label" text-anchor="middle">{xml_esc(role)}</text>')
        return "\n".join(res)

    def draw_aggregation(self, x1, y1, x2, y2, mult1="1", mult2="0..*", role=""):
        """Draw UML Aggregation (Hollow Diamond at x1,y1)."""
        res = []
        res.append(f'  <polygon points="{x1},{y1} {x1+8},{y1-5} {x1+16},{y1} {x1+8},{y1+5}" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.6"/>')
        res.append(f'  <line x1="{x1+16}" y1="{y1}" x2="{x2}" y2="{y2}" class="conn-line"/>')
        if mult1:
            res.append(f'  <text x="{x1+22}" y="{y1-8}" class="multiplicity">{mult1}</text>')
        if mult2:
            res.append(f'  <text x="{x2-30}" y="{y2-8}" class="multiplicity">{mult2}</text>')
        if role:
            mx = (x1 + x2) / 2
            my = (y1 + y2) / 2 - 8
            res.append(f'  <text x="{mx}" y="{my}" class="role-label" text-anchor="middle">{xml_esc(role)}</text>')
        return "\n".join(res)

    def draw_association(self, points, mult1="1", mult2="1..*", role=""):
        """Draw Manhattan directed association."""
        res = []
        pts_str = " ".join([f"{pt[0]},{pt[1]}" for pt in points])
        res.append(f'  <polyline points="{pts_str}" class="conn-line"/>')
        # Arrowhead at last point
        lx, ly = points[-1]
        px, py = points[-2]
        if lx > px: # right
            res.append(f'  <polygon points="{lx},{ly} {lx-12},{ly-5} {lx-12},{ly+5}" fill="#0F172A"/>')
        elif lx < px: # left
            res.append(f'  <polygon points="{lx},{ly} {lx+12},{ly-5} {lx+12},{ly+5}" fill="#0F172A"/>')
        elif ly > py: # down
            res.append(f'  <polygon points="{lx},{ly} {lx-5},{ly-12} {lx+5},{ly-12}" fill="#0F172A"/>')
        elif ly < py: # up
            res.append(f'  <polygon points="{lx},{ly} {lx-5},{ly+12} {lx+5},{ly+12}" fill="#0F172A"/>')

        fx, fy = points[0]
        if mult1:
            res.append(f'  <text x="{fx+10}" y="{fy-8}" class="multiplicity">{mult1}</text>')
        if mult2:
            res.append(f'  <text x="{lx-25}" y="{ly-8}" class="multiplicity">{mult2}</text>')
        if role:
            mid_idx = len(points) // 2
            mx, my = points[mid_idx]
            res.append(f'  <rect x="{mx-60}" y="{my-18}" width="120" height="20" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.0" rx="3"/>')
            res.append(f'  <text x="{mx}" y="{my-4}" class="role-label" text-anchor="middle">{xml_esc(role)}</text>')
        return "\n".join(res)

    def draw_event_dependency(self, points, event_name=""):
        """Draw RabbitMQ Event Bus dependency arrow (dashed orange line)."""
        res = []
        pts_str = " ".join([f"{pt[0]},{pt[1]}" for pt in points])
        res.append(f'  <polyline points="{pts_str}" class="conn-event"/>')
        lx, ly = points[-1]
        px, py = points[-2]
        if ly > py: # down
            res.append(f'  <polyline points="{lx-6},{ly-10} {lx},{ly} {lx+6},{ly-10}" fill="none" stroke="#D97706" stroke-width="2.0"/>')
        elif lx > px: # right
            res.append(f'  <polyline points="{lx-10},{ly-6} {lx},{ly} {lx-10},{ly+6}" fill="none" stroke="#D97706" stroke-width="2.0"/>')

        if event_name:
            mid_idx = len(points) // 2
            mx, my = points[mid_idx]
            res.append(f'  <rect x="{mx-90}" y="{my-16}" width="180" height="22" fill="#FFFBEB" stroke="#F59E0B" stroke-width="1.2" rx="4"/>')
            res.append(f'  <text x="{mx}" y="{my}" font-size="11" font-weight="900" fill="#B45309" text-anchor="middle" font-family="ui-monospace, Menlo, monospace">«pub/sub: {xml_esc(event_name)}»</text>')
        return "\n".join(res)

    def add_footer_legend(self):
        """Draw Visual Paradigm notation legend bar."""
        ly = 2270
        res = []
        res.append('  <!-- ==================== VISUAL PARADIGM NOTATION LEGEND ==================== -->')
        res.append(f'  <g id="VPLegend">')
        res.append(f'    <rect x="38" y="{ly}" width="3524" height="96" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.8" rx="6"/>')
        res.append(f'    <rect x="58" y="{ly+16}" width="150" height="26" fill="#0F172A" rx="4"/>')
        res.append(f'    <text x="133" y="{ly+34}" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">VP NOTATION GUIDE</text>')

        # Item 1: Aggregate Root
        res.append(f'    <rect x="235" y="{ly+18}" width="24" height="22" fill="#1E3A8A" rx="3"/>')
        res.append(f'    <circle cx="270" cy="{ly+29}" r="8" fill="#2563EB"/>')
        res.append(f'    <text x="270" y="{ly+32}" font-size="9" font-weight="900" fill="#FFFFFF" text-anchor="middle">AR</text>')
        res.append(f'    <text x="290" y="{ly+33}" font-size="12" font-weight="800" fill="#0F172A">Aggregate Root (Gốc tập hợp, kiểm soát toàn vẹn)</text>')

        # Item 2: Entity
        res.append(f'    <rect x="625" y="{ly+18}" width="24" height="22" fill="#334155" rx="3"/>')
        res.append(f'    <circle cx="660" cy="{ly+29}" r="8" fill="#475569"/>')
        res.append(f'    <text x="660" y="{ly+32}" font-size="9" font-weight="900" fill="#FFFFFF" text-anchor="middle">E</text>')
        res.append(f'    <text x="680" y="{ly+33}" font-size="12" font-weight="800" fill="#0F172A">Domain Entity (Thực thể con có vòng đời)</text>')

        # Item 3: Value Object
        res.append(f'    <rect x="980" y="{ly+18}" width="24" height="22" fill="#047857" rx="3"/>')
        res.append(f'    <circle cx="1015" cy="{ly+29}" r="8" fill="#10B981"/>')
        res.append(f'    <text x="1015" y="{ly+32}" font-size="9" font-weight="900" fill="#FFFFFF" text-anchor="middle">VO</text>')
        res.append(f'    <text x="1035" y="{ly+33}" font-size="12" font-weight="800" fill="#0F172A">Value Object (Đối tượng giá trị bất biến)</text>')

        # Item 4: Domain Service
        res.append(f'    <rect x="1350" y="{ly+18}" width="24" height="22" fill="#6D28D9" rx="3"/>')
        res.append(f'    <circle cx="1385" cy="{ly+29}" r="8" fill="#8B5CF6"/>')
        res.append(f'    <text x="1385" y="{ly+32}" font-size="9" font-weight="900" fill="#FFFFFF" text-anchor="middle">DS</text>')
        res.append(f'    <text x="1405" y="{ly+33}" font-size="12" font-weight="800" fill="#0F172A">Domain Service (Dịch vụ miền tính toán)</text>')

        # Line 2: Connectors
        # Composition
        res.append(f'    <polygon points="235,{ly+68} 243,{ly+63} 251,{ly+68} 243,{ly+73}" fill="#0F172A"/>')
        res.append(f'    <line x1="251" y1="{ly+68}" x2="280" y2="{ly+68}" stroke="#0F172A" stroke-width="2"/>')
        res.append(f'    <text x="290" y="{ly+72}" font-size="12" font-weight="800" fill="#0F172A">Composition (Sở hữu phụ thuộc 1:N)</text>')

        # Aggregation
        res.append(f'    <polygon points="625,{ly+68} 633,{ly+63} 641,{ly+68} 633,{ly+73}" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.6"/>')
        res.append(f'    <line x1="641" y1="{ly+68}" x2="670" y2="{ly+68}" stroke="#0F172A" stroke-width="2"/>')
        res.append(f'    <text x="680" y="{ly+72}" font-size="12" font-weight="800" fill="#0F172A">Aggregation (Tập hợp lỏng 0..*)</text>')

        # Cross Context Association
        res.append(f'    <line x1="980" y1="{ly+68}" x2="1015" y2="{ly+68}" stroke="#0F172A" stroke-width="1.8"/>')
        res.append(f'    <polygon points="1015,{ly+68} 1007,{ly+64} 1007,{ly+72}" fill="#0F172A"/>')
        res.append(f'    <text x="1035" y="{ly+72}" font-size="12" font-weight="800" fill="#0F172A">Logical Association (Liên kết qua Business Key: shipmentCode, hubCode)</text>')

        # Event Bus
        res.append(f'    <line x1="1620" y1="{ly+68}" x2="1655" y2="{ly+68}" stroke="#D97706" stroke-width="1.8" stroke-dasharray="5 3"/>')
        res.append(f'    <polyline points="1648,{ly+64} 1655,{ly+68} 1648,{ly+72}" fill="none" stroke="#D97706" stroke-width="2"/>')
        res.append(f'    <text x="1670" y="{ly+72}" font-size="12" font-weight="800" fill="#B45309">RabbitMQ Outbox Event Bus (Phi đồng bộ at-least-once)</text>')

        # Summary Note
        res.append(f'    <rect x="2520" y="{ly+14}" width="1020" height="68" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.0" rx="4"/>')
        res.append(f'    <text x="2540" y="{ly+36}" font-size="12" font-weight="900" fill="#1E3A8A">NGUYÊN TẮC TOÀN VẸN MIỀN (DDD INVARIANT RULE):</text>')
        res.append(f'    <text x="2540" y="{ly+54}" font-size="11.5" font-weight="700" fill="#334155">Tuyệt đối không có Foreign Key vật lý nối chéo giữa các Database. Mọi giao dịch liên miền thực hiện qua Business Key và</text>')
        res.append(f'    <text x="2540" y="{ly+70}" font-size="11.5" font-weight="800" fill="#059669">Transactional Outbox Pattern đảm bảo Event Sourcing, Idempotent Consumer và CQRS Eventual Consistency.</text>')

        res.append('  </g>')
        return "\n".join(res)

    def build(self):
        self.add_header()

        # =========================================================================
        # 1. BOUNDED CONTEXT PACKAGES (6 MIỀN NGHIỆP VỤ)
        # =========================================================================

        # PACKAGE 1: IDENTITY & MASTERDATA (Top-Left, X: 50, Y: 160, W: 820, H: 860)
        self.lines.append(self.draw_package(50, 160, 830, 880, 360, "PACKAGE 1: IDENTITY & MASTER DATA", "Bounded Context: auth_db (:3010) • masterdata_db (:3001)", "#1E3A8A"))

        c_user, _ = self.draw_class(75, 205, 370, "UserAccount", "Aggregate Root", "auth_db",
            [
                "+ id : Int {PK, AutoInc}",
                "+ username : String(50) {Unique}",
                "+ passwordHash : String",
                "+ fullName : String(100)",
                "+ phone : String(20)",
                "+ role : UserRoleEnum {ADMIN, OPS, SHIPPER...}",
                "+ status : UserStatusEnum {ACTIVE, SUSPENDED}",
                "+ assignedHubId : Int [0..1] {Ref: Hub.id}"
            ],
            [
                "+ authenticate(password) : Boolean",
                "+ changePassword(oldPwd, newPwd) : void",
                "+ assignRole(newRole, operator) : void"
            ],
            theme="slate"
        )
        self.lines.append(c_user)

        c_sess, _ = self.draw_class(485, 205, 370, "AuthSession", "Entity", "auth_db",
            [
                "+ id : Int {PK}",
                "+ token : String(128) {Opaque Bearer, Indexed}",
                "+ userAccountId : Int {FK: UserAccount.id}",
                "+ expiresAt : DateTime",
                "+ deviceFingerprint : String [0..1]",
                "+ status : SessionStatusEnum {ACTIVE, REVOKED}"
            ],
            [
                "+ isValid() : Boolean",
                "+ revokeSession(reason) : void",
                "+ touchActivity() : void"
            ],
            theme="slate"
        )
        self.lines.append(c_sess)

        c_hub, _ = self.draw_class(75, 495, 370, "Hub", "Aggregate Root", "masterdata_db",
            [
                "+ id : Int {PK}",
                "+ hubCode : String(20) {Unique, SSOT}",
                "+ name : String(120)",
                "+ level : HubLevelEnum {L1_MEGA, L2_REGIONAL...}",
                "+ address : String",
                "+ provinceId : Int",
                "+ districtId : Int",
                "+ latitude : Decimal",
                "+ longitude : Decimal",
                "+ boundaryPolygon : Geometry [0..1]"
            ],
            [
                "+ resolveResponsibleHub(lat, lng) : Hub",
                "+ validateOperationCeiling(weight, dims) : Boolean"
            ],
            theme="slate"
        )
        self.lines.append(c_hub)

        c_merch, _ = self.draw_class(485, 495, 370, "MerchantProfile", "Entity", "masterdata_db",
            [
                "+ id : Int {PK}",
                "+ userAccountId : Int {Unique, Ref: UserAccount.id}",
                "+ businessName : String",
                "+ bankAccountNumber : String",
                "+ bankCode : String(20)",
                "+ pickupAddressDefault : String",
                "+ autoSettlementThreshold : Decimal",
                "+ ratingScore : Decimal"
            ],
            [
                "+ updateBankDetails(acc, bank) : void",
                "+ configureCodPolicy(threshold) : void"
            ],
            theme="slate"
        )
        self.lines.append(c_merch)

        c_courier_assign, _ = self.draw_class(75, 785, 370, "CourierAreaAssignment", "Entity", "masterdata_db",
            [
                "+ id : Int {PK}",
                "+ courierId : Int {Ref: UserAccount.id}",
                "+ hubId : Int {Ref: Hub.id}",
                "+ wardCode : String",
                "+ assignedPolygon : Geometry [0..1]",
                "+ activeStatus : Boolean",
                "+ shiftType : ShiftEnum {MORNING, EVENING}"
            ],
            [
                "+ containsLocation(lat, lng) : Boolean",
                "+ reassignArea(newCourierId) : void"
            ],
            theme="slate"
        )
        self.lines.append(c_courier_assign)

        c_cust, _ = self.draw_class(485, 785, 370, "CustomerProfile", "Entity", "masterdata_db",
            [
                "+ id : Int {PK}",
                "+ phone : String(20) {Unique}",
                "+ fullName : String",
                "+ defaultCompensationBank : String [0..1]",
                "+ defaultBankAccount : String [0..1]",
                "+ loyaltyTier : LoyaltyTierEnum {STANDARD, VIP}",
                "+ registeredAt : DateTime"
            ],
            [
                "+ registerDirectCompensationBank(...) : void",
                "+ updateContactPhone(newPhone) : void"
            ],
            theme="slate"
        )
        self.lines.append(c_cust)


        # PACKAGE 2: FIRST-MILE PICKUP & PRICING (Bottom-Left, X: 50, Y: 1080, W: 830, H: 650)
        self.lines.append(self.draw_package(50, 1080, 830, 650, 360, "PACKAGE 2: FIRST-MILE PICKUP & PRICING", "Bounded Context: pickup_db (:3003) • pricing-service (:3012)", "#9A6800"))

        c_pickup, _ = self.draw_class(75, 1125, 370, "PickupRequest", "Aggregate Root", "pickup_db",
            [
                "+ id : Int {PK}",
                "+ pickupCode : String(30) {Unique, SSOT}",
                "+ merchantId : Int {Ref: MerchantProfile.id}",
                "+ assignedHubId : Int {Ref: Hub.id}",
                "+ assignedCourierId : Int [0..1]",
                "+ scheduledDate : Date",
                "+ timeSlot : TimeSlotEnum {SLOT_1, SLOT_2}",
                "+ status : PickupRequestStatusEnum {SUBMITTED, ASSIGNED, COMPLETED}",
                "+ expectedQuantity : Int"
            ],
            [
                "+ assignToCourier(courierId) : void",
                "+ confirmPickedUp(actualQty) : void",
                "+ cancelPickup(reason) : void"
            ],
            theme="amber"
        )
        self.lines.append(c_pickup)

        c_pickup_item, _ = self.draw_class(485, 1125, 370, "PickupItem", "Entity", "pickup_db",
            [
                "+ id : Int {PK}",
                "+ pickupRequestId : Int {FK: PickupRequest.id}",
                "+ shipmentCode : String(30) {Ref: Shipment.code}",
                "+ scannedAt : DateTime [0..1]",
                "+ weightCaptured : Decimal",
                "+ conditionStatus : ConditionEnum {INTACT, DAMAGED}"
            ],
            [
                "+ verifyTrackingCode(code) : Boolean",
                "+ markAsCollected() : void"
            ],
            theme="amber"
        )
        self.lines.append(c_pickup_item)

        c_pricing, _ = self.draw_class(75, 1420, 370, "PricingEngine", "Domain Service", "pricing-service",
            [
                "+ tariffMatrix : Json {3 Zones: Intra, Metro, Inter}",
                "+ volumetricDivisor : Int = 6000 {IATA Standard}",
                "+ insuranceRate : Decimal = 0.005 {0.5% declaredValue}",
                "+ minInsuranceFee : Decimal = 10000"
            ],
            [
                "+ calculateChargeableWeight(D, R, C, W) : Decimal",
                "+ quoteShippingFee(origin, dest, weight) : QuoteResult",
                "+ evaluatePhysicalCeilings(weight, dims) : ValidationResult"
            ],
            theme="ds"
        )
        self.lines.append(c_pricing)

        # Note for Pricing: IATA Formula & 3-Tier Physical Ceilings
        note_pricing = self.draw_dogear_note(485, 1420, 370, 160, "Định Giá IATA & 3 Tầng Trần Vật Lý", [
            "1. Cước thể tích IATA: CW = max(W, (D x R x C)/6000).",
            "2. Tầng 1 (Tiêu chuẩn): W ≤ 20kg, cạnh ≤ 60cm (xe máy).",
            "3. Tầng 2 (Cồng kềnh): W 21-70kg, cạnh ≤ 150cm (xe tải).",
            "4. Tầng 3 (Vượt trần mạng lưới): W > 70kg hoặc",
            "   D+R+C > 300cm ➔ CHẶN TẠO ĐƠN (422 Unprocessable)."
        ], anchor_x=445, anchor_y=1480)
        self.lines.append(note_pricing)


        # PACKAGE 3: CORE SHIPMENT & CLAIMS (Top-Center, X: 920, Y: 160, W: 870, H: 880)
        self.lines.append(self.draw_package(920, 160, 870, 880, 380, "PACKAGE 3: CORE SHIPMENT & CLAIMS (SSOT)", "Bounded Context: shipment_db (:3002) • Core Order State Machine", "#1E3A8A"))

        c_shipment, _ = self.draw_class(945, 205, 395, "Shipment", "Aggregate Root", "shipment_db",
            [
                "+ id : Int {PK}",
                "+ trackingCode : String(30) {Unique, SSOT}",
                "+ merchantId : Int [0..1] {Ref: MerchantProfile.id}",
                "+ currentStatus : ShipmentStatusEnum {CREATED, PICKUP_PENDING...",
                "+ serviceType : ServiceTypeEnum {STANDARD, EXPRESS, SAVER}",
                "+ senderAddress : AddressValueObject",
                "+ receiverAddress : AddressValueObject",
                "+ declaredValue : Decimal [0..1] {Require if HIGH_VALUE}",
                "+ insuranceTier : InsuranceEnum {STANDARD, COMPREHENSIVE_100}",
                "+ itemClassification : ItemClassEnum {GENERAL, FRAGILE, BULKY...}",
                "+ chargeableWeight : Decimal",
                "+ totalShippingFee : Decimal {Snapshot Immutable}",
                "+ codAmount : Decimal",
                "+ isFragile : Boolean {SOP: 3-Layer Bubble Wrap}"
            ],
            [
                "+ createShipment(dto) : Shipment",
                "+ transitionStatus(newStatus, actor) : void",
                "+ lockSnapshotPricing(quote) : void",
                "+ initiateCancellation(reason) : void",
                "+ appendOutboxEvent(eventType, payload) : void"
            ],
            theme="blue"
        )
        self.lines.append(c_shipment)

        c_ship_item, _ = self.draw_class(1365, 205, 395, "ShipmentItem", "Entity", "shipment_db",
            [
                "+ id : Int {PK}",
                "+ shipmentId : Int {FK: Shipment.id}",
                "+ productName : String",
                "+ quantity : Int",
                "+ weightGrams : Int",
                "+ lengthCm : Int",
                "+ widthCm : Int",
                "+ heightCm : Int"
            ],
            [
                "+ calculateItemVolumetricWeight() : Decimal",
                "+ validateItemDimensionCeiling() : Boolean"
            ],
            theme="blue"
        )
        self.lines.append(c_ship_item)

        c_investigation, _ = self.draw_class(945, 620, 395, "InvestigationCase", "Aggregate Root", "shipment_db",
            [
                "+ id : Int {PK}",
                "+ caseCode : String(30) {Unique}",
                "+ shipmentCode : String {Ref: Shipment.trackingCode}",
                "+ breakPoint : BreakPointEnum {WAREHOUSE_STALE, LINEHAUL_LOSS...}",
                "+ suspectParty : String {Đơn vị tình nghi số 1}",
                "+ confidenceScore : Decimal {AI Audit Engine %}",
                "+ status : InvestigationStatusEnum {IN_HEARING, RESOLVED, ESCALATED}",
                "+ hearingDeadline : DateTime {24h Dispute Window}"
            ],
            [
                "+ openDisputeHearingWindow(24h) : void",
                "+ submitCctvDefense(party, cctvUrl) : void",
                "+ resolveFoundInWarehouse(location) : void",
                "+ escalateToCompensationClaim() : CompensationClaim"
            ],
            theme="blue"
        )
        self.lines.append(c_investigation)

        c_claim, _ = self.draw_class(1365, 620, 395, "CompensationClaim", "Entity", "shipment_db",
            [
                "+ id : Int {PK}",
                "+ claimCode : String(30) {Unique}",
                "+ investigationCaseId : Int {FK: InvestigationCase.id}",
                "+ shipmentCode : String",
                "+ declaredValueSnapshot : Decimal",
                "+ compensationAmount : Decimal {100% Goods Value}",
                "+ responsibleParty : String {Khấu trừ chế tài KPI/Lương}",
                "+ payoutStatus : PayoutStatusEnum {PENDING, TRANSFERRED, REJECTED}",
                "+ recipientBankAccount : String",
                "+ adjudicatorNotes : String"
            ],
            [
                "+ approveCompensation100Percent(adjudicator) : void",
                "+ triggerSePayBankPayout() : PayoutResult"
            ],
            theme="blue"
        )
        self.lines.append(c_claim)

        # Note for Core Shipment: State Machine & 24h Dispute SOP
        note_shipment = self.draw_dogear_note(1365, 435, 395, 160, "Quy Trình Giám Định & Bồi Thường 100%", [
            "1. Audit Engine bắt 4 điểm đứt gãy vết quét (STALE, LINEHAUL...).",
            "2. Kích hoạt Cửa sổ Giải trình 24h (IN_HEARING): Đơn vị",
            "   tình nghi nộp video CCTV bàn dỡ lưu trữ trên MinIO S3.",
            "3. Nếu tìm thấy: Thao tác 'Cứu đơn' ➔ Đưa về luồng chuẩn.",
            "4. Hết 24h không chứng minh được ➔ Tự động sinh Hồ sơ",
            "   Bồi thường 100% giá trị khai báo, trừ chế tài đơn vị vi phạm."
        ], anchor_x=1340, anchor_y=680)
        self.lines.append(note_shipment)


        # PACKAGE 4: MID-MILE HUB TRANSIT & LINEHAUL (Top-Right, X: 1830, Y: 160, W: 850, H: 880)
        self.lines.append(self.draw_package(1830, 160, 850, 880, 380, "PACKAGE 4: MID-MILE HUB TRANSIT & LINEHAUL", "Bounded Context: manifest_db (:3005) • scan_db (:3006) • linehaul (:3014)", "#166534"))

        c_bag, _ = self.draw_class(1855, 205, 380, "ManifestBag", "Aggregate Root", "manifest_db",
            [
                "+ id : Int {PK}",
                "+ bagCode : String(30) {Unique, Mã MB...}",
                "+ originHubId : Int {Ref: Hub.id}",
                "+ destinationHubId : Int {Ref: Hub.id}",
                "+ currentSealCode : String [0..1] {Unique}",
                "+ status : BagStatusEnum {OPEN, SEALED, IN_TRANSIT, UNSEALED}",
                "+ totalItemCount : Int",
                "+ totalWeightKg : Decimal"
            ],
            [
                "+ addShipmentToBag(shipmentCode) : void",
                "+ closeAndSealBag(sealCode, operator) : void",
                "+ verifyAndUnseal(sealCode, operator) : UnsealResult"
            ],
            theme="green"
        )
        self.lines.append(c_bag)

        c_seal, _ = self.draw_class(2260, 205, 385, "SealRecord", "Value Object", "manifest_db",
            [
                "+ sealCode : String(30) {Unique}",
                "+ bagId : Int {FK: ManifestBag.id}",
                "+ sealedBy : String",
                "+ sealedAt : DateTime",
                "+ sealIntegrityStatus : IntegrityEnum {INTACT, BROKEN, TAMPERED}",
                "+ unsealedAt : DateTime [0..1]"
            ],
            [
                "+ verifySealMatching(inputCode) : Boolean",
                "+ flagTamperedSeal(reason) : void"
            ],
            theme="vo"
        )
        self.lines.append(c_seal)

        c_scan, _ = self.draw_class(1855, 495, 380, "ScanAuditLog", "Entity", "scan_db",
            [
                "+ id : Int {PK}",
                "+ barcodeScanned : String(50) {Shipment / Bag / Seal}",
                "+ scanType : ScanTypeEnum {PICKUP, INBOUND, OUTBOUND, SORT}",
                "+ hubId : Int {Ref: Hub.id}",
                "+ operatorId : Int {Ref: UserAccount.id}",
                "+ latitude : Decimal",
                "+ longitude : Decimal",
                "+ idempotencyKey : String {Chống bắn mã trùng}",
                "+ scannedAt : DateTime"
            ],
            [
                "+ validateScanIdempotency() : Boolean",
                "+ resolveGeofenceAccuracy() : Boolean"
            ],
            theme="green"
        )
        self.lines.append(c_scan)

        c_linehaul, _ = self.draw_class(2260, 495, 385, "LinehaulTrip", "Aggregate Root", "linehaul_db",
            [
                "+ id : Int {PK}",
                "+ tripCode : String(30) {Unique, Tem XT...}",
                "+ truckLicensePlate : String(20)",
                "+ driverName : String",
                "+ originMegaHubId : Int",
                "+ destMegaHubId : Int",
                "+ departureTime : DateTime",
                "+ arrivalEstimated : DateTime",
                "+ tripStatus : TripStatusEnum {SCHEDULED, DISPATCHED, ARRIVED}"
            ],
            [
                "+ attachManifestBags(bagCodes) : void",
                "+ dispatchTruck(sealCode) : void",
                "+ completeInboundAtDestination() : void"
            ],
            theme="green"
        )
        self.lines.append(c_linehaul)

        c_gps, _ = self.draw_class(1855, 785, 380, "CourierCurrentLocation", "Entity", "scan_db",
            [
                "+ id : Int {PK}",
                "+ courierId : Int {Unique, Ref: UserAccount.id}",
                "+ latitude : Decimal",
                "+ longitude : Decimal",
                "+ speedKmh : Decimal [0..1]",
                "+ batteryLevel : Int [0..1]",
                "+ lastHeartbeatAt : DateTime"
            ],
            [
                "+ updateTelemetry(lat, lng, battery) : void",
                "+ isHeartbeatStale(maxSeconds=60) : Boolean"
            ],
            theme="green"
        )
        self.lines.append(c_gps)

        c_loc, _ = self.draw_class(2260, 785, 385, "CurrentLocation", "Entity", "scan_db",
            [
                "+ id : Int {PK}",
                "+ barcode : String {Unique, SSOT Location}",
                "+ currentHubId : Int [0..1] {Ref: Hub.id}",
                "+ currentHubName : String",
                "+ lastScanType : ScanTypeEnum",
                "+ lastUpdatedAt : DateTime"
            ],
            [
                "+ updateCurrentLocation(hubId, scanType) : void"
            ],
            theme="green"
        )
        self.lines.append(c_loc)


        # PACKAGE 5: LAST-MILE DELIVERY & COD (Top-Right/Spanning, X: 2720, Y: 160, W: 830, H: 880)
        self.lines.append(self.draw_package(2720, 160, 830, 880, 360, "PACKAGE 5: LAST-MILE & COD SETTLEMENT", "Bounded Context: delivery_db (:3007) • payment_db (:3011)", "#831843"))

        c_delivery, _ = self.draw_class(2745, 205, 375, "DeliveryAttempt", "Aggregate Root", "delivery_db",
            [
                "+ id : Int {PK}",
                "+ shipmentCode : String(30) {Ref: Shipment.trackingCode}",
                "+ courierId : Int {Ref: UserAccount.id}",
                "+ attemptCount : Int = 1 {Max = 3}",
                "+ status : DeliveryStatusEnum {OUT_FOR_DELIVERY, SUCCESS, FAILED_NDR}",
                "+ startedAt : DateTime",
                "+ completedAt : DateTime [0..1]"
            ],
            [
                "+ recordSuccessfulDelivery(pod, otp) : void",
                "+ recordNdrIncident(reason, rescheduleDate) : void",
                "+ triggerReturnToSender() : ReturnCase"
            ],
            theme="wine"
        )
        self.lines.append(c_delivery)

        c_pod, _ = self.draw_class(3145, 205, 380, "PodEvidence", "Value Object", "delivery_db",
            [
                "+ id : Int {PK}",
                "+ deliveryAttemptId : Int {FK: DeliveryAttempt.id}",
                "+ signatureImageUrl : String {MinIO S3 Bucket}",
                "+ parcelProofImageUrl : String {MinIO S3 Bucket}",
                "+ receiverNationalId : String [0..1]",
                "+ capturedLatitude : Decimal",
                "+ capturedLongitude : Decimal"
            ],
            [
                "+ uploadToMinioS3(buffer) : PresignedUrl",
                "+ verifyDeliveryProximity(destCoord) : Boolean"
            ],
            theme="vo"
        )
        self.lines.append(c_pod)

        c_ndr, _ = self.draw_class(2745, 495, 375, "NdrCase", "Entity", "delivery_db",
            [
                "+ id : Int {PK}",
                "+ deliveryAttemptId : Int",
                "+ shipmentCode : String",
                "+ ndrReasonCode : String {Ref: NdrReason.code}",
                "+ customerNote : String [0..1]",
                "+ nextDeliveryDate : Date [0..1]",
                "+ attemptNumber : Int",
                "+ isFinalFailure : Boolean {If attempt >= 3}"
            ],
            [
                "+ rescheduleDelivery(newDate) : void",
                "+ markAsDeadLetterReturn() : void"
            ],
            theme="wine"
        )
        self.lines.append(c_ndr)

        c_otp, _ = self.draw_class(3145, 495, 380, "OtpRecord", "Value Object", "delivery_db",
            [
                "+ shipmentCode : String",
                "+ otpCodeHash : String(6 digits)",
                "+ recipientPhone : String",
                "+ expiresAt : DateTime",
                "+ isVerified : Boolean",
                "+ verifiedAt : DateTime [0..1]"
            ],
            [
                "+ verifyOtp(candidate) : Boolean",
                "+ resendOtp(retryCount) : void"
            ],
            theme="vo"
        )
        self.lines.append(c_otp)

        c_cod, _ = self.draw_class(2745, 785, 375, "CodRecord", "Entity", "payment_db",
            [
                "+ id : Int {PK}",
                "+ shipmentCode : String {Unique}",
                "+ merchantId : Int",
                "+ courierId : Int",
                "+ codAmount : Decimal",
                "+ collectionStatus : CodStatusEnum {PENDING, COLLECTED, REMITTED}",
                "+ collectedAt : DateTime [0..1]",
                "+ paymentMethod : PaymentMethodEnum {CASH, VIETQR_DYNAMIC}"
            ],
            [
                "+ confirmCashCollected(courierId) : void",
                "+ matchSePayBankWebhook(txnId, amount) : void"
            ],
            theme="wine"
        )
        self.lines.append(c_cod)

        c_settle, _ = self.draw_class(3145, 785, 380, "CodSettlementBatch", "Aggregate Root", "payment_db",
            [
                "+ id : Int {PK}",
                "+ batchCode : String(30) {Unique}",
                "+ merchantId : Int {Ref: MerchantProfile.id}",
                "+ totalCodCollected : Decimal",
                "+ deductedShippingFees : Decimal",
                "+ netPayoutAmount : Decimal",
                "+ settlementStatus : SettlementStatusEnum {OPEN, TRANSFERRED}",
                "+ bankTransactionRef : String [0..1]"
            ],
            [
                "+ aggregateDailySettlement(merchantId) : Batch",
                "+ executeAutomatedBankTransfer() : PayoutResult"
            ],
            theme="wine"
        )
        self.lines.append(c_settle)


        # PACKAGE 6: CQRS READ MODELS & AI SUBSYSTEM (Bottom-Right/Spanning, X: 920, Y: 1080, W: 2630, H: 650)
        self.lines.append(self.draw_package(920, 1080, 2630, 650, 390, "PACKAGE 6: CQRS READ MODELS & AI SUBSYSTEM", "Bounded Context: tracking_db (:3008) • reporting_db (:3009) • chatbot (:3013)", "#581C87"))

        c_timeline, _ = self.draw_class(945, 1125, 395, "TimelineEvent", "Read Model", "tracking_db",
            [
                "+ id : Int {PK, AutoInc}",
                "+ shipmentCode : String {Indexed}",
                "+ eventType : String {PICKED_UP, INBOUND_HUB, OUT_FOR_DELIVERY...}",
                "+ hubName : String",
                "+ operatorRole : String {Masked if Public}",
                "+ timestamp : DateTime",
                "+ publicDescription : String {Tiếng Việt thân thiện}"
            ],
            [
                "+ projectFromScanEvent(msg) : void",
                "+ projectFromDeliveryAttempt(msg) : void"
            ],
            theme="purple"
        )
        self.lines.append(c_timeline)

        c_track_curr, _ = self.draw_class(1365, 1125, 395, "TrackingCurrent", "Read Model", "tracking_db",
            [
                "+ shipmentCode : String {PK}",
                "+ latestStatus : ShipmentStatusEnum",
                "+ currentLocationName : String",
                "+ expectedDeliveryDate : Date",
                "+ isDelivered : Boolean",
                "+ hasException : Boolean",
                "+ lastUpdated : DateTime"
            ],
            [
                "+ updateCurrentSnapshot(event) : void",
                "+ queryPublicTracking(phone, code) : TrackingDto"
            ],
            theme="purple"
        )
        self.lines.append(c_track_curr)

        c_kpi, _ = self.draw_class(1855, 1125, 380, "KpiDaily", "Read Model", "reporting_db",
            [
                "+ id : Int {PK}",
                "+ reportDate : Date",
                "+ hubId : Int [0..1]",
                "+ totalShipmentsCreated : Int",
                "+ totalDeliveredSuccess : Int",
                "+ totalFailedNdr : Int",
                "+ successRatePercent : Decimal",
                "+ totalCodRemitted : Decimal"
            ],
            [
                "+ aggregateEndOfDayMetrics() : void",
                "+ exportMacroReport() : ReportData"
            ],
            theme="purple"
        )
        self.lines.append(c_kpi)

        c_rag_chunk, _ = self.draw_class(2260, 1125, 385, "KnowledgeChunk", "Vector Store", "chatbot_lake",
            [
                "+ chunkId : String(36) {PK, UUID}",
                "+ documentTitle : String {Decree 47, SOP, Policies}",
                "+ contentText : String(1500 chars)",
                "+ embeddingVector : Float[768] {Google Gemini / Cohere}",
                "+ sectionPath : String",
                "+ effectiveDate : Date"
            ],
            [
                "+ computeCosineSimilarity(queryVec) : Float",
                "+ retrieveRelevantSop(intent) : List<Chunk>"
            ],
            theme="purple"
        )
        self.lines.append(c_rag_chunk)

        c_ai_agent, _ = self.draw_class(2745, 1125, 375, "MultiAgentRouter", "AI Service", "chatbot_engine",
            [
                "+ activeSupervisorModel : String = 'Gemini 3.6 Flash'",
                "+ fallbackProvider : String = 'OpenAI GPT-4o-mini'",
                "+ registeredTools : List<Tool> = [track, quote, create, escalate]",
                "+ vectorIndexCache : Cache"
            ],
            [
                "+ routeIntent(userMessage) : IntentResult",
                "+ executeDynamicToolCalling(tool, args) : ToolOutput",
                "+ streamSseResponse(prompt) : TokenStream"
            ],
            theme="ds"
        )
        self.lines.append(c_ai_agent)

        c_chat_log, _ = self.draw_class(3145, 1125, 380, "ChatSessionLog", "Entity", "chat_db",
            [
                "+ sessionId : String {PK, UUID}",
                "+ userPhone : String [0..1]",
                "+ intentClassified : String",
                "+ ragCitations : List<String>",
                "+ humanEscalated : Boolean",
                "+ latencyMs : Int",
                "+ createdAt : DateTime"
            ],
            [
                "+ logConversationTurn(...) : void",
                "+ exportBenchmarkingMetric() : Metric"
            ],
            theme="purple"
        )
        self.lines.append(c_chat_log)


        # =========================================================================
        # 2. CONNECTORS & ASSOCIATIONS (UML 2.5 MANHATTAN ROUTING)
        # =========================================================================

        # 1. UserAccount -> AuthSession (Composition 1 -> 0..*)
        self.lines.append(self.draw_composition(445, 300, 485, 300, mult1="1", mult2="0..*", role="+has active sessions"))

        # 2. Hub -> CourierAreaAssignment (Aggregation 1 -> 0..*)
        self.lines.append(self.draw_aggregation(260, 745, 260, 785, mult1="1", mult2="0..*", role=""))

        # 3. PickupRequest -> PickupItem (Composition 1 -> 1..*)
        self.lines.append(self.draw_composition(445, 1220, 485, 1220, mult1="1", mult2="1..*", role="+contains items"))

        # 4. Shipment -> ShipmentItem (Composition 1 -> 1..*)
        self.lines.append(self.draw_composition(1340, 300, 1365, 300, mult1="1", mult2="1..*", role="+packages"))

        # 5. ManifestBag -> SealRecord (Composition 1 -> 1)
        self.lines.append(self.draw_composition(2235, 300, 2260, 300, mult1="1", mult2="1", role="+sealed by"))

        # 6. DeliveryAttempt -> PodEvidence (Composition 1 -> 1)
        self.lines.append(self.draw_composition(3120, 300, 3145, 300, mult1="1", mult2="1", role="+proof of delivery"))

        # 7. DeliveryAttempt -> NdrCase (Composition 1 -> 0..1)
        self.lines.append(self.draw_composition(2930, 455, 2930, 495, mult1="1", mult2="0..1", role="+exception"))

        # 8. InvestigationCase -> CompensationClaim (Composition 1 -> 0..1)
        self.lines.append(self.draw_composition(1340, 720, 1365, 720, mult1="1", mult2="0..1", role="+escalates to claim"))

        # 9. CodSettlementBatch -> CodRecord (Aggregation 1 -> 1..*)
        self.lines.append(self.draw_aggregation(3145, 880, 3120, 880, mult1="1", mult2="1..*", role="+settles collections"))

        # 10. Logical Association: PickupRequest -> Hub (Ref: assignedHubId)
        self.lines.append(self.draw_association([(260, 1125), (260, 1050), (200, 1050), (200, 745)], mult1="*", mult2="1", role="[assignedHubId]"))

        # 11. Logical Association: PickupItem -> Shipment (Ref: shipmentCode)
        self.lines.append(self.draw_association([(855, 1220), (900, 1220), (900, 400), (945, 400)], mult1="1", mult2="1", role="[shipmentCode]"))

        # 12. Logical Association: Shipment -> ManifestBag (Gom đơn vào bao MB)
        self.lines.append(self.draw_association([(1760, 300), (1805, 300), (1805, 300), (1855, 300)], mult1="1..*", mult2="1", role="[manifestBagCode]"))

        # 13. Logical Association: ManifestBag -> LinehaulTrip (Xếp bao lên xe tải XT)
        self.lines.append(self.draw_association([(2045, 455), (2045, 475), (2260, 475), (2260, 495)], mult1="1..*", mult2="1", role="[linehaulTripCode]"))

        # 14. Logical Association: Shipment -> DeliveryAttempt (Giao hàng chặng cuối)
        self.lines.append(self.draw_association([(1760, 360), (2700, 360), (2700, 300), (2745, 300)], mult1="1", mult2="1..*", role="[trackingCode]"))

        # 15. Logical Association: DeliveryAttempt -> CodRecord (Thu hộ tiền COD)
        self.lines.append(self.draw_association([(2930, 745), (2930, 785)], mult1="1", mult2="1", role="[shipmentCode]"))

        # 16. Event Bus: Shipment Outbox -> TimelineEvent (RabbitMQ topic: domain.events)
        self.lines.append(self.draw_event_dependency([(1140, 580), (1140, 1060), (1140, 1125)], event_name="shipment.status_updated"))

        # 17. Event Bus: ScanAuditLog -> CurrentLocation & Timeline (RabbitMQ)
        self.lines.append(self.draw_event_dependency([(1855, 600), (1800, 600), (1800, 1100), (1340, 1100), (1340, 1125)], event_name="scan.inbound_outbound"))

        # 18. Event Bus: DeliveryAttempt -> Reporting KpiDaily (RabbitMQ)
        self.lines.append(self.draw_event_dependency([(2930, 455), (2930, 475), (2700, 475), (2700, 1070), (2045, 1070), (2045, 1125)], event_name="delivery.success_kpi"))

        # 19. MultiAgentRouter -> KnowledgeChunk & Tools (AI Query & Calling)
        self.lines.append(self.draw_association([(2745, 1220), (2645, 1220)], mult1="1", mult2="*", role="«vector similarity»"))

        # =========================================================================
        # 3. NOTATION LEGEND (FOOTER STRIP)
        # =========================================================================
        self.lines.append(self.add_footer_legend())

        self.lines.append('</svg>')
        return "\n".join(self.lines)

if __name__ == "__main__":
    builder = VisualParadigmDomainBuilder()
    svg_content = builder.build()

    out_paths = [
        "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/03-overall-conceptual-erd.svg",
        "docs/graduation-thesis/diagrams/erd/00-overall-conceptual-erd.svg",
        "docs/graduation-thesis/diagrams/architecture/00-visual-paradigm-domain-model.svg"
    ]

    for p in out_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"Generated Visual Paradigm Domain Model: {p} ({len(svg_content.encode('utf-8'))} bytes)")
