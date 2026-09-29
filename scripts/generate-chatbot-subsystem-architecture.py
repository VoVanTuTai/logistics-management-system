#!/usr/bin/env python3
"""
generate-chatbot-subsystem-architecture.py
Academic-grade 4-Tier Layered System Architecture for the AI Chatbot Subsystem (Nexus AI Assistant).
Designed for Graduation Thesis (Đồ án tốt nghiệp / Báo cáo khoa học) & Figma Page 1 (Section 1.4A).

Key Characteristics:
- 100% Academic & Theoretical: Pure software engineering layered architecture (IEEE 1471 / ISO 42010).
- Zero gimmicky "AI-generated" UI buttons, fake chips, dummy phone numbers, or marketing fluff.
- Strict System Design Notations: UML 2.0 component glyphs, boundary ports, interface lollipops,
  decision diamond with formal guard conditions, database platter cylinders, layered context assembly.
- Authoritative System Brand Blue Palette:
  - Primary Navy: #003D9B (--stitch-primary)
  - Nexus Brand Blue: #0052CC (--stitch-primary-container)
  - Tech Accent Blue: #1D4ED8 / #2563EB
  - Subtle Blue Backgrounds: #F0F7FF / #EFF6FF / #F8FAFC
- 100% Native Vector Figma Compatible: Inline vectors (<rect>, <polygon>, <circle>, <ellipse>, <path>, <text>),
  ZERO SVG <marker> tags.

Outputs:
  docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-architecture-ai-chatbot-subsystem.svg
"""

import xml.etree.ElementTree as ET
import html
import os

OUTPUT_FILE = "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-architecture-ai-chatbot-subsystem.svg"

def escape(text):
    return html.escape(str(text))

def build_architecture_svg():
    width = 3600
    height = 2500
    lines = []

    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # Double Technical Border
    lines.append(f'''
  <!-- Academic Blueprint Double Border -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <rect x="24" y="24" width="{width - 48}" height="{height - 48}" fill="none" stroke="#003D9B" stroke-width="2.5"/>
  <rect x="36" y="36" width="{width - 72}" height="{height - 72}" fill="none" stroke="#CBD5E1" stroke-width="1.2"/>

  <style>
    text {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }}
    
    .hdr-title {{ font-size: 27px; font-weight: 800; fill: #FFFFFF; letter-spacing: -0.3px; }}
    .hdr-sub {{ font-size: 15px; font-weight: 500; fill: #DAE2FF; }}
    .hdr-meta-lbl {{ font-size: 12px; font-weight: 700; fill: #FFFFFF; font-family: ui-monospace, Menlo, monospace; letter-spacing: 0.5px; }}
    
    .tier-title {{ font-size: 16px; font-weight: 800; fill: #003D9B; letter-spacing: 0.8px; text-transform: uppercase; }}
    .tier-sub {{ font-size: 12px; font-weight: 600; fill: #475569; font-family: ui-monospace, Menlo, monospace; }}
    
    .comp-title {{ font-size: 15px; font-weight: 700; fill: #0F172A; letter-spacing: -0.2px; }}
    .comp-stereo {{ font-size: 12px; font-weight: 600; fill: #0052CC; font-family: ui-monospace, Menlo, monospace; }}
    .comp-lbl {{ font-size: 12px; font-weight: 700; fill: #334155; text-transform: uppercase; letter-spacing: 0.4px; }}
    .comp-txt {{ font-size: 12.5px; font-weight: 400; fill: #334155; line-height: 1.45; }}
    .comp-code {{ font-size: 12px; font-weight: 600; fill: #0F172A; font-family: ui-monospace, Menlo, monospace; }}
    
    .math-formula {{ font-size: 14.5px; font-weight: 700; fill: #003D9B; font-family: ui-monospace, Menlo, monospace; }}
    .guard-text {{ font-size: 12.5px; font-weight: 700; fill: #003D9B; font-family: ui-monospace, Menlo, monospace; }}
    
    .port-label {{ font-size: 11.5px; font-weight: 700; fill: #003D9B; font-family: ui-monospace, Menlo, monospace; }}
    .flow-badge {{ font-size: 12.5px; font-weight: 800; fill: #FFFFFF; font-family: ui-monospace, Menlo, monospace; }}
    .flow-step-title {{ font-size: 12.5px; font-weight: 700; fill: #0F172A; }}
    .flow-step-desc {{ font-size: 12px; font-weight: 500; fill: #475569; }}
    
    .footer-title {{ font-size: 12px; font-weight: 800; fill: #003D9B; text-transform: uppercase; letter-spacing: 0.6px; }}
    .footer-val {{ font-size: 12px; font-weight: 600; fill: #0F172A; font-family: ui-monospace, Menlo, monospace; }}
  </style>
''')

    # Utility Functions for Standard System Design Geometric Symbols
    def draw_uml_component_glyph(gx, gy):
        """Draws the official UML 2.0 Component symbol (rectangle with two tabs on the left edge)."""
        return f'''
      <g transform="translate({gx}, {gy})">
        <rect x="0" y="0" width="22" height="16" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.3" rx="1.5"/>
        <rect x="-4" y="2.5" width="8" height="4" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2" rx="0.8"/>
        <rect x="-4" y="9.5" width="8" height="4" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2" rx="0.8"/>
      </g>'''

    def draw_port_square(px, py, label, text_pos="top"):
        """Draws a standard UML boundary port box."""
        tx = px + 6
        if text_pos == "top":
            ty = py - 7
            anchor = "middle"
        elif text_pos == "bottom":
            ty = py + 22
            anchor = "middle"
        elif text_pos == "left":
            tx = px - 9
            ty = py + 9
            anchor = "end"
        else:
            tx = px + 21
            ty = py + 9
            anchor = "start"

        return f'''
      <g>
        <rect x="{px}" y="{py}" width="12" height="12" fill="#FFFFFF" stroke="#003D9B" stroke-width="2"/>
        <text x="{tx}" y="{ty}" text-anchor="{anchor}" class="port-label">{escape(label)}</text>
      </g>'''

    def draw_interface_lollipop(lx, ly, label, direction="right"):
        """Draws a standard UML provided interface (Lollipop: circle + stem)."""
        if direction == "right":
            stem = f'<line x1="{lx}" y1="{ly}" x2="{lx + 20}" y2="{ly}" stroke="#0052CC" stroke-width="1.6"/>'
            circle = f'<circle cx="{lx + 27}" cy="{ly}" r="7" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.8"/>'
            lbl = f'<text x="{lx + 39}" y="{ly + 4}" class="comp-code">{escape(label)}</text>'
        elif direction == "left":
            stem = f'<line x1="{lx}" y1="{ly}" x2="{lx - 20}" y2="{ly}" stroke="#0052CC" stroke-width="1.6"/>'
            circle = f'<circle cx="{lx - 27}" cy="{ly}" r="7" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.8"/>'
            lbl = f'<text x="{lx - 39}" y="{ly + 4}" text-anchor="end" class="comp-code">{escape(label)}</text>'
        elif direction == "down":
            stem = f'<line x1="{lx}" y1="{ly}" x2="{lx}" y2="{ly + 20}" stroke="#0052CC" stroke-width="1.6"/>'
            circle = f'<circle cx="{lx}" cy="{ly + 27}" r="7" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.8"/>'
            lbl = f'<text x="{lx}" y="{ly + 46}" text-anchor="middle" class="comp-code">{escape(label)}</text>'
        else:  # up
            stem = f'<line x1="{lx}" y1="{ly}" x2="{lx}" y2="{ly - 20}" stroke="#0052CC" stroke-width="1.6"/>'
            circle = f'<circle cx="{lx}" cy="{ly - 27}" r="7" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.8"/>'
            lbl = f'<text x="{lx}" y="{ly - 38}" text-anchor="middle" class="comp-code">{escape(label)}</text>'
        return f'<g>{stem}{circle}{lbl}</g>'

    def draw_database_cylinder(cx, cy, cw, ch, title, desc_lines):
        """Draws an academic 3D platter database cylinder."""
        ry = 13
        h_body = ch - ry * 2
        d_svg = []
        d_svg.append(f'''
      <g transform="translate({cx}, {cy})">
        <!-- Body Path -->
        <path d="M 0 {ry} A {cw//2} {ry} 0 0 0 {cw} {ry} L {cw} {ry + h_body} A {cw//2} {ry} 0 0 1 0 {ry + h_body} Z"
              fill="#F8FAFC" stroke="#0052CC" stroke-width="1.6"/>
        <!-- Platter Track 1 -->
        <path d="M 0 {ry + h_body * 0.35} A {cw//2} {ry} 0 0 0 {cw} {ry + h_body * 0.35}"
              fill="none" stroke="#CBD5E1" stroke-width="1.2" stroke-dasharray="3,3"/>
        <!-- Platter Track 2 -->
        <path d="M 0 {ry + h_body * 0.68} A {cw//2} {ry} 0 0 0 {cw} {ry + h_body * 0.68}"
              fill="none" stroke="#CBD5E1" stroke-width="1.2" stroke-dasharray="3,3"/>
        <!-- Top Ellipse -->
        <ellipse cx="{cw//2}" cy="{ry}" rx="{cw//2}" ry="{ry}" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.8"/>
        <!-- UML Component Glyph -->
        {draw_uml_component_glyph(cw - 28, 6)}
        <!-- Title -->
        <text x="24" y="{ry + 30}" class="comp-title" style="fill:#003D9B;">{escape(title)}</text>
        <!-- Content Lines -->''')
        cur_y = ry + 56
        for line in desc_lines:
            d_svg.append(f'<text x="24" y="{cur_y}" class="comp-txt">{escape(line)}</text>')
            cur_y += 21
        d_svg.append('      </g>')
        return '\n'.join(d_svg)

    def draw_arrow_head(x2, y2, direction="right", color="#0052CC", size=6):
        """Draws pure vector arrowhead (no SVG markers)."""
        if direction == "right":
            return f'<polygon points="{x2},{y2} {x2-size*1.6},{y2-size} {x2-size*1.6},{y2+size}" fill="{color}"/>'
        elif direction == "left":
            return f'<polygon points="{x2},{y2} {x2+size*1.6},{y2-size} {x2+size*1.6},{y2+size}" fill="{color}"/>'
        elif direction == "down":
            return f'<polygon points="{x2},{y2} {x2-size},{y2-size*1.6} {x2+size},{y2-size*1.6}" fill="{color}"/>'
        elif direction == "up":
            return f'<polygon points="{x2},{y2} {x2-size},{y2+size*1.6} {x2+size},{y2+size*1.6}" fill="{color}"/>'
        return ''

    def draw_flow_badge(bx, by, number):
        """Draws numbered circle badge indicating architectural workflow sequence."""
        return f'''
      <g transform="translate({bx}, {by})">
        <circle cx="0" cy="0" r="13" fill="#003D9B" stroke="#FFFFFF" stroke-width="2"/>
        <text x="0" y="4.5" text-anchor="middle" class="flow-badge">{number}</text>
      </g>'''

    # Layout Dimensions
    margin_x = 70
    content_w = width - margin_x * 2  # 3460px

    # =========================================================================
    # HEADER BAR (y: 50, h: 90)
    # =========================================================================
    lines.append(f'''
  <!-- HEADER BAR (SYSTEM BRAND BLUE: #003D9B) -->
  <g id="HeaderBar" transform="translate({margin_x}, 50)">
    <rect width="{content_w}" height="90" rx="8" fill="#003D9B"/>
    <rect x="0" y="86" width="{content_w}" height="4" fill="#0052CC"/>
    
    <text x="32" y="38" class="hdr-title">HÌNH 1.4A: KIẾN TRÚC PHÂN TẦNG VÀ ĐIỀU PHỐI PHÂN HỆ AI CHATBOT (NEXUS AI ASSISTANT)</text>
    <text x="32" y="68" class="hdr-sub">Mô hình kiến trúc phân tầng (Multi-tier Architecture) tích hợp RAG lai (Hybrid Search), Điều phối công cụ (Function Calling) và Hàng rào bảo mật dữ liệu</text>
    
    <!-- Academic Specification Badges -->
    <g transform="translate({content_w - 780}, 24)">
      <rect x="0" y="0" width="180" height="42" rx="4" fill="#00296B" stroke="#0052CC" stroke-width="1.2"/>
      <text x="90" y="26" text-anchor="middle" class="hdr-meta-lbl">ISO/IEC 42010 ARCH</text>
      
      <rect x="195" y="0" width="190" height="42" rx="4" fill="#00296B" stroke="#0052CC" stroke-width="1.2"/>
      <text x="290" y="26" text-anchor="middle" class="hdr-meta-lbl">4-TIER MULTI-LAYER</text>
      
      <rect x="400" y="0" width="180" height="42" rx="4" fill="#00296B" stroke="#0052CC" stroke-width="1.2"/>
      <text x="490" y="26" text-anchor="middle" class="hdr-meta-lbl">HYBRID RAG + TOOLS</text>
      
      <rect x="595" y="0" width="165" height="42" rx="4" fill="#00296B" stroke="#0052CC" stroke-width="1.2"/>
      <text x="677" y="26" text-anchor="middle" class="hdr-meta-lbl">SSE STREAMING</text>
    </g>
  </g>''')

    # =========================================================================
    # TIER 1: TẦNG TRÌNH DIỄN & ỨNG DỤNG CLIENT (y: 165, h: 230)
    # =========================================================================
    t1_y = 165
    t1_h = 230
    lines.append(f'''
  <!-- ================= TIER 1: CLIENT & PRESENTATION LAYER ================= -->
  <g id="Tier1_Presentation" transform="translate({margin_x}, {t1_y})">
    <!-- Tier Boundary Container -->
    <rect width="{content_w}" height="{t1_h}" rx="8" fill="#F8FAFC" stroke="#003D9B" stroke-width="1.8"/>
    <!-- Tier Header Banner -->
    <path d="M 0 8 A 8 8 0 0 1 8 0 L 380 0 L 405 34 L 0 34 Z" fill="#EFF6FF" stroke="#003D9B" stroke-width="1.2"/>
    <text x="24" y="23" class="tier-title">TẦNG 1: TRÌNH DIỄN &amp; ỨNG DỤNG CLIENT</text>
    <text x="425" y="23" class="tier-sub">[TIER 1: PRESENTATION &amp; CLIENT APPLICATIONS - PROTOCOL: HTTPS / REST / SSE STREAM]</text>''')

    # 3 Client Application Component Boxes
    box_w = (content_w - 60 - 50) // 3  # (3460 - 110) // 3 = 1116px
    
    # 1.1 Merchant Portal
    lines.append(f'''
    <!-- 1.1 Merchant Web Portal -->
    <g transform="translate(30, 48)">
      <rect width="{box_w}" height="160" rx="6" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
      {draw_uml_component_glyph(box_w - 30, 12)}
      <text x="20" y="28" class="comp-stereo">«Client Application · Next.js 14»</text>
      <text x="20" y="50" class="comp-title">Cổng Thông Tin Thương Nhân (Merchant Web Portal)</text>
      <text x="20" y="76" class="comp-lbl">Vai trò &amp; Nhiệm vụ:</text>
      <text x="20" y="96" class="comp-txt">• Tiếp nhận hội thoại trực tiếp của chủ shop; gửi câu hỏi nghiệp vụ và nhận phản hồi tức thì.</text>
      <text x="20" y="116" class="comp-txt">• Render giao diện tin nhắn động: Thẻ chi tiết vận đơn (Shipment Card), Bảng kê chi phí, Trạng thái xử lý.</text>
      <text x="20" y="140" class="comp-code" style="fill:#0052CC;">Giao thức: HTTPS POST /api/v1/chat/message • EventSource SSE Stream</text>
    </g>''')

    # 1.2 Courier Mobile App
    lines.append(f'''
    <!-- 1.2 Courier Mobile App -->
    <g transform="translate({30 + box_w + 25}, 48)">
      <rect width="{box_w}" height="160" rx="6" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
      {draw_uml_component_glyph(box_w - 30, 12)}
      <text x="20" y="28" class="comp-stereo">«Mobile Application · React Native»</text>
      <text x="20" y="50" class="comp-title">Ứng Dụng Di Động Bưu Tá (Courier Mobile App)</text>
      <text x="20" y="76" class="comp-lbl">Vai trò &amp; Nhiệm vụ:</text>
      <text x="20" y="96" class="comp-txt">• Hỗ trợ tài xế tra cứu quy trình giao hàng, xử lý phát không thành công và quy định phát lại.</text>
      <text x="20" y="116" class="comp-txt">• Gửi yêu cầu lập biên bản sự cố hư hỏng/mất mát hiện trường thông qua lệnh thoại hoặc tin nhắn nhanh.</text>
      <text x="20" y="140" class="comp-code" style="fill:#0052CC;">Giao thức: HTTPS REST JSON (TLS 1.3) • JWT Authenticated Session</text>
    </g>''')

    # 1.3 Operations & CSKH Portal
    lines.append(f'''
    <!-- 1.3 Operations & CSKH Portal -->
    <g transform="translate({30 + (box_w + 25)*2}, 48)">
      <rect width="{box_w}" height="160" rx="6" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
      {draw_uml_component_glyph(box_w - 30, 12)}
      <text x="20" y="28" class="comp-stereo">«SPA Web Application · React»</text>
      <text x="20" y="50" class="comp-title">Cổng Điều Hành &amp; Chăm Sóc Khách Hàng (Operations Console)</text>
      <text x="20" y="76" class="comp-lbl">Vai trò &amp; Nhiệm vụ:</text>
      <text x="20" y="96" class="comp-txt">• Giám sát nhật ký phản hồi của trợ lý ảo; hỗ trợ can thiệp chuyển tiếp chuyên viên (Human-in-the-loop).</text>
      <text x="20" y="116" class="comp-txt">• Quản trị kho tài liệu quy chuẩn SOP: Tải lên, phân đoạn (AST Chunking) và đồng bộ vector tri thức.</text>
      <text x="20" y="140" class="comp-code" style="fill:#0052CC;">Giao thức: RESTful Admin APIs • WebSocket Event Monitoring</text>
    </g>''')

    # Boundary Port for Ingress
    lines.append(f'''
    <!-- Ingress Boundary Port on Bottom Edge of Tier 1 -->
    {draw_port_square(content_w // 2 - 6, t1_h - 6, ":3009 [REST / SSE INGRESS PORT]", text_pos="bottom")}
  </g>''')

    # Flow Connector from Tier 1 to Tier 2
    flow_1_x = margin_x + content_w // 2
    lines.append(f'''
  <!-- Connector Tier 1 -> Tier 2 -->
  <line x1="{flow_1_x}" y1="{t1_y + t1_h}" x2="{flow_1_x}" y2="{t1_y + t1_h + 38}" stroke="#003D9B" stroke-width="2"/>
  {draw_arrow_head(flow_1_x, t1_y + t1_h + 38, direction="down", color="#003D9B", size=6)}
  {draw_flow_badge(flow_1_x, t1_y + t1_h + 19, "1")}''')

    # =========================================================================
    # TIER 2: TẦNG CỔNG DỊCH VỤ, BẢO MẬT & QUẢN LÝ PHIÊN (y: 435, h: 240)
    # =========================================================================
    t2_y = 435
    t2_h = 240
    lines.append(f'''
  <!-- ================= TIER 2: GATEWAY, GUARDRAILS & SESSION ================= -->
  <g id="Tier2_GatewaySecurity" transform="translate({margin_x}, {t2_y})">
    <!-- Tier Boundary Container -->
    <rect width="{content_w}" height="{t2_h}" rx="8" fill="#F8FAFC" stroke="#003D9B" stroke-width="1.8"/>
    <!-- Tier Header Banner -->
    <path d="M 0 8 A 8 8 0 0 1 8 0 L 440 0 L 465 34 L 0 34 Z" fill="#EFF6FF" stroke="#003D9B" stroke-width="1.2"/>
    <text x="24" y="23" class="tier-title">TẦNG 2: CỔNG DỊCH VỤ, BẢO MẬT &amp; QUẢN LÝ PHIÊN</text>
    <text x="485" y="23" class="tier-sub">[TIER 2: API GATEWAY, SECURITY GUARDRAILS &amp; CONTEXT BUFFER]</text>''')

    # 3 Components in Tier 2
    # 2.1 Chatbot API Controller
    lines.append(f'''
    <!-- 2.1 Ingress API Controller -->
    <g transform="translate(30, 48)">
      <rect width="{box_w}" height="170" rx="6" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
      {draw_uml_component_glyph(box_w - 30, 12)}
      <text x="20" y="28" class="comp-stereo">«REST / SSE Controller · Port :3009»</text>
      <text x="20" y="50" class="comp-title">Bộ Điều Khiển Tiếp Nhận (Chatbot API Controller)</text>
      <text x="20" y="74" class="comp-lbl">Chức năng &amp; Ràng buộc kỹ thuật:</text>
      <text x="20" y="94" class="comp-txt">• Tiếp nhận payload HTTP POST ChatRequestDTO; điều hướng phản hồi Server-Sent Events.</text>
      <text x="20" y="114" class="comp-txt">• Xác thực chữ ký số JWT Token; phân quyền RBAC theo vai trò: GUEST, MERCHANT, ADMIN.</text>
      <text x="20" y="134" class="comp-txt">• Kiểm soát tần suất truy cập (Rate Limiting: Chặn Spam 60 req/phút); Lọc rác &amp; DTO Validation.</text>
      <text x="20" y="156" class="comp-code" style="fill:#0052CC;">Đầu vào: ChatRequestDTO • Đầu ra: Verified Validated Payload Pipeline</text>
    </g>''')

    # 2.2 Security Guardrails & PII Sanitizer
    lines.append(f'''
    <!-- 2.2 Security Guardrails & PII Sanitizer -->
    <g transform="translate({30 + box_w + 25}, 48)">
      <rect width="{box_w}" height="170" rx="6" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
      {draw_uml_component_glyph(box_w - 30, 12)}
      <text x="20" y="28" class="comp-stereo">«Security Guardrail · Preprocessing Filter»</text>
      <text x="20" y="50" class="comp-title">Hàng Rào Bảo Mật &amp; Khử Dữ Liệu PII (Security Guardrails)</text>
      <text x="20" y="74" class="comp-lbl">Chức năng &amp; Ràng buộc kỹ thuật:</text>
      <text x="20" y="94" class="comp-txt">• Khử thông tin nhận dạng cá nhân (PII Masking): Che giấu số điện thoại, CCCD người nhận qua Regex.</text>
      <text x="20" y="114" class="comp-txt">• Phòng vệ tiêm nhiễm lệnh (Prompt Injection Defense): Phát hiện và vô hiệu hóa jailbreak prompt.</text>
      <text x="20" y="134" class="comp-txt">• Chuẩn hóa cấu trúc câu truy vấn (Normalization): Loại bỏ ký tự điều khiển, chuẩn hóa dấu tiếng Việt.</text>
      <text x="20" y="156" class="comp-code" style="fill:#0052CC;">Cơ chế: Regex Rule Engine • Bảo vệ an toàn dữ liệu khách hàng &amp; tiền COD</text>
    </g>''')

    # 2.3 Session Buffer & Context Manager
    lines.append(f'''
    <!-- 2.3 Session Buffer & Context Manager -->
    <g transform="translate({30 + (box_w + 25)*2}, 48)">
      <rect width="{box_w}" height="170" rx="6" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
      {draw_uml_component_glyph(box_w - 30, 12)}
      <text x="20" y="28" class="comp-stereo">«Stateful Memory Buffer · Redis / In-Memory»</text>
      <text x="20" y="50" class="comp-title">Quản Lý Phiên &amp; Bộ Đệm Ngữ Cảnh (Session Buffer Manager)</text>
      <text x="20" y="74" class="comp-lbl">Chức năng &amp; Ràng buộc kỹ thuật:</text>
      <text x="20" y="94" class="comp-txt">• Cửa sổ trượt ngữ cảnh (Sliding Window K=6 lượt): Lưu vết lịch sử đàm thoại liền trước.</text>
      <text x="20" y="114" class="comp-txt">• Khử hiện tượng mất ngữ cảnh: Duy trì mã đơn hàng và thực thể đang đàm thoại xuyên suốt phiên.</text>
      <text x="20" y="134" class="comp-txt">• Vòng đời phiên làm việc: Hết hạn sau 30 phút không hoạt động (TTL: 1800s); Đồng bộ Web &amp; Mobile.</text>
      <text x="20" y="156" class="comp-code" style="fill:#0052CC;">Đầu ra: Trích xuất mảng lịch sử hội thoại chuẩn ContextArray[role, text]</text>
    </g>''')

    lines.append(f'''
    <!-- Port to Core Tier -->
    {draw_port_square(content_w // 2 - 6, t2_h - 6, "[SANITIZED MESSAGE & SESSION CONTEXT BUS]", text_pos="bottom")}
  </g>''')

    # Flow Connector from Tier 2 to Tier 3
    flow_2_x = margin_x + content_w // 2
    lines.append(f'''
  <!-- Connector Tier 2 -> Tier 3 -->
  <line x1="{flow_2_x}" y1="{t2_y + t2_h}" x2="{flow_2_x}" y2="{t2_y + t2_h + 38}" stroke="#003D9B" stroke-width="2"/>
  {draw_arrow_head(flow_2_x, t2_y + t2_h + 38, direction="down", color="#003D9B", size=6)}
  {draw_flow_badge(flow_2_x, t2_y + t2_h + 19, "2")}''')

    # =========================================================================
    # TIER 3: TẦNG ĐIỀU PHỐI SUY LUẬN, TRUY XUẤT RAG & CÔNG CỤ (y: 715, h: 860)
    # =========================================================================
    t3_y = 715
    t3_h = 860
    lines.append(f'''
  <!-- ================= TIER 3: AI CORE ORCHESTRATION, RAG & TOOLING ================= -->
  <g id="Tier3_AICore" transform="translate({margin_x}, {t3_y})">
    <!-- Tier Boundary Container -->
    <rect width="{content_w}" height="{t3_h}" rx="8" fill="#F8FAFC" stroke="#003D9B" stroke-width="2"/>
    <!-- Tier Header Banner -->
    <path d="M 0 8 A 8 8 0 0 1 8 0 L 590 0 L 615 34 L 0 34 Z" fill="#EFF6FF" stroke="#003D9B" stroke-width="1.2"/>
    <text x="24" y="23" class="tier-title">TẦNG 3: LÕI ĐIỀU PHỐI SUY LUẬN, TRUY XUẤT RAG &amp; CÔNG CỤ</text>
    <text x="635" y="23" class="tier-sub">[TIER 3: CORE AI ORCHESTRATION - INTENT ROUTER, HYBRID RAG &amp; TOOL CALLING ENGINE]</text>''')

    # Layout for Tier 3: 3 Major Functional Columns across 3460px
    # Column A: Phân Loại Ý Định & Định Tuyến NLU (w: 1040px)
    # Column B: Bộ Truy Xuất Tri Thức Lai - Hybrid RAG (w: 1140px)
    # Column C: Bộ Điều Phối Công Cụ & Tổng Hợp Ngữ Cảnh (w: 1140px)
    # Gap = (3460 - 60 - 1040 - 1140 - 1140) = 80px // 2 = 40px
    c3a_w = 1040
    c3b_w = 1150
    c3c_w = 1150
    c3a_x = 30
    c3b_x = 30 + c3a_w + 30
    c3c_x = c3b_x + c3b_w + 30

    # -------------------------------------------------------------------------
    # KHỐI 3A: ĐỊNH TUYẾN Ý ĐỊNH & PHÂN LUỒNG QUYẾT ĐỊNH (c3a_x)
    # -------------------------------------------------------------------------
    lines.append(f'''
    <!-- 3A: Phân loại ý định & Định tuyến NLU -->
    <g transform="translate({c3a_x}, 50)">
      <rect width="{c3a_w}" height="{t3_h - 75}" rx="6" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
      {draw_uml_component_glyph(c3a_w - 30, 14)}
      <text x="24" y="30" class="comp-stereo">«Decision &amp; NLU Router»</text>
      <text x="24" y="54" class="comp-title">1. Phân Tích Cú Pháp &amp; Định Tuyến Ý Định (Intent Router)</text>
      
      <!-- Sub-description -->
      <text x="24" y="82" class="comp-lbl">Nhiệm vụ phân loại:</text>
      <text x="24" y="104" class="comp-txt">• Chuẩn hóa Unicode NFC, bóc tách cấu trúc câu, trích xuất thực thể Entity Extractor.</text>
      <text x="24" y="124" class="comp-txt">• Bắt mẫu Regex nghiệp vụ: Mã bưu gửi <tspan class="comp-code">NX-XXXX</tspan>, Mã sự cố, Khối lượng, Kích thước.</text>
      <text x="24" y="144" class="comp-txt">• Xác định mục tiêu đàm thoại: Tra cứu quy định SOP hay Thao tác dữ liệu trực tiếp.</text>

      <!-- Formal UML Decision Diamond -->
      <g transform="translate({c3a_w//2}, 270)">
        <!-- Diamond Shape -->
        <polygon points="0,-65 175,0 0,65 -175,0" fill="#EFF6FF" stroke="#003D9B" stroke-width="2.2"/>
        <text x="0" y="-8" text-anchor="middle" class="comp-title" style="fill:#003D9B; font-size:14px;">PHÂN LOẠI Ý ĐỊNH</text>
        <text x="0" y="14" text-anchor="middle" class="comp-stereo">(INTENT DECISION)</text>

        <!-- Branch 1: Policy SOP Query (To RAG) -->
        <line x1="175" y1="0" x2="280" y2="0" stroke="#003D9B" stroke-width="2"/>
        {draw_arrow_head(280, 0, direction="right", color="#003D9B", size=6)}
        <text x="185" y="-12" class="guard-text">[intent == "policy_sop"]</text>
        <text x="185" y="18" class="comp-txt" style="font-size:11.5px; fill:#475569;">Tra cứu quy trình SOP</text>

        <!-- Branch 2: Live Tool Call (To Tool Orchestrator) -->
        <path d="M 0 65 L 0 170 L 280 170" fill="none" stroke="#003D9B" stroke-width="2"/>
        {draw_arrow_head(280, 170, direction="right", color="#003D9B", size=6)}
        <text x="25" y="160" class="guard-text">[intent == "live_tool"]</text>
        <text x="25" y="190" class="comp-txt" style="font-size:11.5px; fill:#475569;">Gọi API nghiệp vụ thời gian thực</text>

        <!-- Branch 3: Hybrid RAG + Tool Call -->
        <path d="M 0 -65 L 0 -115 L 280 -115" fill="none" stroke="#003D9B" stroke-width="2"/>
        {draw_arrow_head(280, -115, direction="right", color="#003D9B", size=6)}
        <text x="25" y="-125" class="guard-text">[intent == "hybrid_rag_tool"]</text>
        <text x="25" y="-95" class="comp-txt" style="font-size:11.5px; fill:#475569;">Kết hợp tra cứu SOP &amp; Dữ liệu đơn</text>
      </g>

      <!-- Technical Rule Specifications Box -->
      <g transform="translate(24, 520)">
        <rect width="{c3a_w - 48}" height="235" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="20" y="28" class="comp-lbl" style="fill:#003D9B;">Quy Tắc Định Tuyến &amp; Bóc Tách Thực Thể (Entity Rules):</text>
        <text x="20" y="56" class="comp-txt"><tspan style="font-weight:700;">1. Nhánh Policy SOP:</tspan> Câu hỏi chính sách đền bù bưu gửi hư hại, quy cách đóng gói chất lỏng, thời hiệu khiếu nại (Điều 18 &amp; 25 Luật Bưu chính).</text>
        <text x="20" y="86" class="comp-txt"><tspan style="font-weight:700;">2. Nhánh Live Tool:</tspan> Yêu cầu tra cứu mã bưu phẩm <tspan class="comp-code">NX-2026-XXXX</tspan>, tính cước chặng phát hỏa tốc, lập biên bản sự cố giao hàng.</text>
        <text x="20" y="116" class="comp-txt"><tspan style="font-weight:700;">3. Nhánh Hỗn Hợp:</tspan> Thương nhân hỏi đơn hàng bị vỡ thì đền bù bao nhiêu tiền ➔ Vừa gọi Tool lấy giá trị đơn, vừa tra cứu SOP mức đền bù tối đa.</text>
        <text x="20" y="146" class="comp-txt"><tspan style="font-weight:700;">4. Cơ chế Fallback:</tspan> Khi không nhận dạng được ý định rõ ràng, chuyển tiếp câu hỏi mở sang LLM với lời nhắc an toàn.</text>
        <line x1="20" y1="168" x2="{c3a_w - 68}" y2="168" stroke="#E2E8F0" stroke-width="1"/>
        <text x="20" y="194" class="comp-code" style="fill:#0052CC;">Độ trễ xử lý Router: &lt; 8ms • Phân giải song song không gây nghẽn I/O</text>
      </g>
    </g>''')

    # Flow Badge 3: Intent Classification
    lines.append(f'''
    {draw_flow_badge(c3a_x + c3a_w - 20, 320, "3")}''')

    # -------------------------------------------------------------------------
    # KHỐI 3B: BỘ TRUY XUẤT TRI THỨC LAI (HYBRID RAG RETRIEVAL ENGINE) (c3b_x)
    # -------------------------------------------------------------------------
    lines.append(f'''
    <!-- 3B: Bộ Truy Xuất Tri Thức Lai (Hybrid RAG) -->
    <g transform="translate({c3b_x}, 50)">
      <rect width="{c3b_w}" height="{t3_h - 75}" rx="6" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
      {draw_uml_component_glyph(c3b_w - 30, 14)}
      <text x="24" y="30" class="comp-stereo">«Hybrid Retrieval Subsystem · Dense + Sparse»</text>
      <text x="24" y="54" class="comp-title">2. Bộ Truy Xuất Tri Thức Lai (Hybrid RAG Engine)</text>
      
      <!-- Interface Lollipop inside header -->
      <g transform="translate({c3b_w - 240}, 28)">{draw_interface_lollipop(0, 0, "IVectorSearch", direction="right")}</g>


      <!-- Academic Hybrid Formula Card -->
      <g transform="translate(24, 82)">
        <rect width="{c3b_w - 48}" height="110" rx="5" fill="#EFF6FF" stroke="#003D9B" stroke-width="1.5"/>
        <text x="20" y="28" class="comp-lbl" style="fill:#003D9B;">CÔNG THỨC ĐIỂM SỐ TRUY XUẤT LAI (HYBRID RETRIEVAL SCORE):</text>
        <text x="20" y="60" class="math-formula">Score(q, d) = α · CosineSimilarity(vq, vd) + (1 - α) · BM25Score(q, d)</text>
        <text x="20" y="88" class="comp-txt" style="font-size:12px; fill:#003D9B;">Trong đó: Trọng số cân bằng học thuật cố định α = 0.70 (Ưu tiên ngữ nghĩa chuyên sâu) và (1 - α) = 0.30 (Khớp từ khóa chính xác)</text>
      </g>

      <!-- Step Breakdown: 2 Sub-steps -->
      <!-- Step 2.1: Dual Search -->
      <g transform="translate(24, 210)">
        <rect width="{c3b_w - 48}" height="175" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="20" y="28" class="comp-lbl">Thuật toán Tìm kiếm Song song (Dual Search Engines):</text>
        <text x="20" y="54" class="comp-txt">• <tspan style="font-weight:700;">Nhánh 1: Truy xuất Ngữ nghĩa Véc-tơ (Dense Embedding Retrieval):</tspan></text>
        <text x="32" y="74" class="comp-txt">Vector hóa câu hỏi người dùng thành mảng véc-tơ 768 chiều; Tính Cosine Similarity trên kho véc-tơ 62 chunks.</text>
        <text x="20" y="104" class="comp-txt">• <tspan style="font-weight:700;">Nhánh 2: Khớp Từ Khóa Chính Xác (Sparse Keyword / BM25 Search):</tspan></text>
        <text x="32" y="124" class="comp-txt">Quét từ khóa chuyên ngành logistics: <tspan class="comp-code">hàng cồng kềnh</tspan>, <tspan class="comp-code">hư hỏng</tspan>, <tspan class="comp-code">quá hạn lưu kho</tspan>, <tspan class="comp-code">đồng kiểm</tspan>, <tspan class="comp-code">miễn trừ</tspan>.</text>
        <text x="20" y="154" class="comp-code" style="fill:#0052CC;">Tối ưu hóa: Thực thi song song bất đồng bộ (Promise.all) hoàn thành trong &lt; 5ms</text>
      </g>

      <!-- Step 2.2: Re-ranking & Threshold Filter -->
      <g transform="translate(24, 405)">
        <rect width="{c3b_w - 48}" height="185" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="20" y="28" class="comp-lbl">Thuật toán Lọc Ngưỡng &amp; Tái Xếp Hạng (Re-ranking &amp; Thresholding):</text>
        <text x="20" y="56" class="comp-txt">• <tspan style="font-weight:700;">Lọc Ngưỡng Tương Đồng Tuyệt Đối (Relevance Cut-off):</tspan> Loại bỏ toàn bộ các đoạn văn bản có điểm <tspan class="comp-code">Score &lt; 0.58</tspan>.</text>
        <text x="20" y="78" class="comp-txt">Ngăn chặn triệt để hiện tượng mô hình trả lời bịa đặt (Zero Hallucination) khi người dùng hỏi các nội dung ngoài nghiệp vụ.</text>
        <text x="20" y="106" class="comp-txt">• <tspan style="font-weight:700;">Chiến Lược Chọn Lọc Top-K (Top-5 Selection):</tspan> Sắp xếp giảm dần và lấy tối đa 5 đoạn tri thức có điểm số cao nhất.</text>
        <text x="20" y="128" class="comp-txt">• <tspan style="font-weight:700;">Bảo Toàn Thứ Tự Trích Dẫn:</tspan> Giữ nguyên số thứ tự văn bản SOP, điều khoản và bối cảnh để LLM sinh chú thích nguồn chính xác.</text>
        <text x="20" y="160" class="comp-code" style="fill:#003D9B;">Đầu ra RAG: 5 Chunks SOP tối ưu nhất đóng gói chuẩn định dạng tài liệu ngữ cảnh</text>
      </g>

      <!-- Grounding Data Reference Box -->
      <g transform="translate(24, 610)">
        <rect width="{c3b_w - 48}" height="145" rx="5" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="20" y="26" class="comp-lbl" style="fill:#003D9B;">Cơ sở Dữ liệu Tri thức Quy chuẩn (Knowledge Base Grounding):</text>
        <text x="20" y="50" class="comp-txt">• Toàn bộ 9 văn bản SOP nghiệp vụ bưu chính (SOP-01 đến SOP-09) được phân tách thành 62 Chunks chuẩn.</text>
        <text x="20" y="72" class="comp-txt">• Bộ quy tắc quy đổi thể tích cước IATA: <tspan class="comp-code">(D×R×C)/5000</tspan> và Biểu phí bưu chính liên tỉnh 2026.</text>
        <text x="20" y="94" class="comp-txt">• Trách nhiệm pháp lý theo Luật Bưu chính: Bồi thường 100% giá trị bưu gửi có khai giá (SOP-04).</text>
        <text x="20" y="124" class="comp-code" style="fill:#0052CC;">Độ tin cậy ngữ liệu: 100% khớp văn bản ban hành chính thức • Không dùng dữ liệu trôi nổi</text>
      </g>
    </g>''')

    # Flow Badge 4A: Vector Search Flow
    lines.append(f'''
    {draw_flow_badge(c3b_x + c3b_w - 20, 260, "4a")}''')

    # -------------------------------------------------------------------------
    # KHỐI 3C: BỘ ĐIỀU PHỐI CÔNG CỤ & TỔNG HỢP NGỮ CẢNH (c3c_x)
    # -------------------------------------------------------------------------
    lines.append(f'''
    <!-- 3C: Điều phối công cụ & Lắp ráp Prompt -->
    <g transform="translate({c3c_x}, 50)">
      <rect width="{c3c_w}" height="{t3_h - 75}" rx="6" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
      {draw_uml_component_glyph(c3c_w - 30, 14)}
      <text x="24" y="30" class="comp-stereo">«Tool Orchestration &amp; Prompt Assembly»</text>
      <text x="24" y="54" class="comp-title">3. Điều Phối Công Cụ &amp; Lắp Ráp Ngữ Cảnh (Assembler)</text>

      <!-- Interface Lollipop inside header -->
      <g transform="translate({c3c_w - 240}, 28)">{draw_interface_lollipop(0, 0, "IToolDispatcher", direction="right")}</g>


      <!-- 3.1 Tool Calling Dispatcher -->
      <g transform="translate(24, 82)">
        <rect width="{c3c_w - 48}" height="175" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="20" y="26" class="comp-lbl">Bộ Điều Phối Công Cụ Thời Gian Thực (Tool Calling Dispatcher):</text>
        <text x="20" y="50" class="comp-txt">• Thực thi cơ chế Function Calling: Ánh xạ câu hỏi sang các lời gọi API Microservices nội bộ.</text>
        <text x="20" y="72" class="comp-txt">• <tspan class="comp-code">trackShipment(code):</tspan> Lấy trạng thái, vị trí hiện tại và lịch sử quét mã vạch đơn hàng (:3002).</text>
        <text x="20" y="94" class="comp-txt">• <tspan class="comp-code">calculateShippingFee(d, r, c, w):</tspan> Tính cước chuẩn IATA, phụ phí bốc xếp, cước phát vùng sâu (:3003).</text>
        <text x="20" y="116" class="comp-txt">• <tspan class="comp-code">reportIncident(orderId, reason):</tspan> Khởi tạo hồ sơ sự cố giao nhận hàng hư hỏng (:3008).</text>
        <text x="20" y="138" class="comp-txt">• <tspan class="comp-code">checkStorageAgeing():</tspan> Quét cảnh báo hàng hóa tồn đọng kho quá hạn &gt; 30 ngày (:3004).</text>
        <text x="20" y="158" class="comp-code" style="fill:#003D9B;">Cơ chế Circuit Breaker: Timeout 2000ms, tự động ngắt kết nối an toàn khi Microservice quá tải</text>
      </g>

      <!-- 3.2 4-Tier Stacked Context Sandwich Prompt Assembler -->
      <g transform="translate(24, 275)">
        <rect width="{c3c_w - 48}" height="280" rx="5" fill="#FFFFFF" stroke="#003D9B" stroke-width="1.5"/>
        <text x="20" y="26" class="comp-lbl" style="fill:#003D9B;">Cấu Trúc Lắp Ráp Ngữ Cảnh 4 Tầng (4-Tier In-Context Prompt Sandwich):</text>
        
        <!-- Tier 1 Sandwich -->
        <g transform="translate(18, 38)">
          <rect width="{c3c_w - 84}" height="48" rx="4" fill="#001848"/>
          <text x="16" y="22" class="comp-title" style="fill:#FFFFFF; font-size:12.5px;">TẦNG 1: CHỈ THỊ HỆ THỐNG VÀ ĐỊNH DANH (SYSTEM DIRECTIVES)</text>
          <text x="16" y="38" class="comp-txt" style="fill:#DAE2FF; font-size:11.5px;">Định danh Trợ lý Logistics Nexus; Giọng văn khách quan, trung thực; Cấm bịa đặt; Ràng buộc JSON Schema.</text>
        </g>

        <!-- Tier 2 Sandwich -->
        <g transform="translate(18, 94)">
          <rect width="{c3c_w - 84}" height="48" rx="4" fill="#003D9B"/>
          <text x="16" y="22" class="comp-title" style="fill:#FFFFFF; font-size:12.5px;">TẦNG 2: TRI THỨC TRÍCH DẪN TỪ VECTOR STORE (TOP-5 RETRIEVED CHUNKS)</text>
          <text x="16" y="38" class="comp-txt" style="fill:#DAE2FF; font-size:11.5px;">5 đoạn tài liệu SOP có điểm tương đồng cao nhất; Cung cấp căn cứ pháp lý &amp; điều khoản bồi thường cụ thể.</text>
        </g>

        <!-- Tier 3 Sandwich -->
        <g transform="translate(18, 150)">
          <rect width="{c3c_w - 84}" height="48" rx="4" fill="#0052CC"/>
          <text x="16" y="22" class="comp-title" style="fill:#FFFFFF; font-size:12.5px;">TẦNG 3: DỮ LIỆU THỰC TẾ TỪ LIVE SERVICES (LIVE DTO PAYLOAD)</text>
          <text x="16" y="38" class="comp-txt" style="fill:#DAE2FF; font-size:11.5px;">Dữ liệu vận đơn thực tế, vị trí bưu tá, cước phí được trả về từ các Microservices nội bộ.</text>
        </g>

        <!-- Tier 4 Sandwich -->
        <g transform="translate(18, 206)">
          <rect width="{c3c_w - 84}" height="48" rx="4" fill="#1D4ED8"/>
          <text x="16" y="22" class="comp-title" style="fill:#FFFFFF; font-size:12.5px;">TẦNG 4: LỊCH SỬ HỘI THOẠI ĐA LƯỢT (SLIDING CONVERSATION BUFFER)</text>
          <text x="16" y="38" class="comp-txt" style="fill:#DAE2FF; font-size:11.5px;">Mảng 6 lượt tương tác gần nhất giữa Người dùng và Trợ lý ảo để giữ trọn vẹn ngữ cảnh xuyên suốt.</text>
        </g>

        <text x="20" y="270" class="comp-code" style="fill:#003D9B;">Ràng buộc suy luận: Cấu hình Temperature = 0.2 (Loại trừ hoàn toàn hiện tượng ảo giác AI)</text>
      </g>

      <!-- 3.3 SSE Streaming Serializer -->
      <g transform="translate(24, 575)">
        <rect width="{c3c_w - 48}" height="180" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="20" y="26" class="comp-lbl">Bộ Phát Luồng Phản Hồi (SSE Stream Publisher &amp; Parser):</text>
        <text x="20" y="52" class="comp-txt">• <tspan style="font-weight:700;">Nhận Luồng Token từ LLM:</tspan> Tiếp nhận từng chunk ký tự phát sinh từ Cloud LLM theo chuẩn Server-Sent Events.</text>
        <text x="20" y="74" class="comp-txt">• <tspan style="font-weight:700;">Đẩy Tức Thì Về Client:</tspan> Truyền dữ liệu về giao diện Web/Mobile với độ trễ phản hồi ban đầu (TTFT) &lt; 500ms.</text>
        <text x="20" y="98" class="comp-txt">• <tspan style="font-weight:700;">JSON DTO Packing &amp; Fallback:</tspan> Khi LLM kích hoạt Tool Call, chuyển đổi cấu trúc JSON sang DTO hợp lệ.</text>
        <text x="20" y="120" class="comp-txt">• <tspan style="font-weight:700;">Đóng Ngắt Kết Nối An Toàn:</tspan> Phát sự kiện <tspan class="comp-code">[DONE]</tspan> khi hoàn tất văn bản; Ghi nhận nhật ký Token và Latency.</text>
        <text x="20" y="154" class="comp-code" style="fill:#0052CC;">Giao thức luồng: text/event-stream • Giảm tải 90% cảm giác chờ đợi của người dùng</text>
      </g>
    </g>''')

    # Flow Badge 4B & 5
    lines.append(f'''
    {draw_flow_badge(c3c_x + c3c_w - 20, 200, "4b")}
    {draw_flow_badge(c3c_x + c3c_w - 20, 480, "5")}''')

    # Boundary Port on Bottom Edge of Tier 3
    lines.append(f'''
    <!-- Boundary Ports on Bottom Edge of Tier 3 -->
    {draw_port_square(margin_x + 500, t3_y + t3_h - 6, "[VECTOR DB CACHE BUS]", text_pos="bottom")}
    {draw_port_square(margin_x + content_w // 2 - 6, t3_y + t3_h - 6, ":3000 [INTERNAL MICROSERVICES MESH]", text_pos="bottom")}
    {draw_port_square(margin_x + content_w - 500, t3_y + t3_h - 6, "[HTTPS TLS 1.3 LLM PROXY]", text_pos="bottom")}
  </g>''')

    # Connectors from Tier 3 to Tier 4
    # Left: To Knowledge & Vector Store
    # Center: To Logistics Backend Microservices
    # Right: To Foundation Cloud LLM Models
    conn_left_x = margin_x + 500
    conn_mid_x = margin_x + content_w // 2
    conn_right_x = margin_x + content_w - 500

    lines.append(f'''
  <!-- Connectors Tier 3 -> Tier 4 -->
  <!-- Left: Vector Retrieval -->
  <line x1="{conn_left_x}" y1="{t3_y + t3_h}" x2="{conn_left_x}" y2="{t3_y + t3_h + 38}" stroke="#003D9B" stroke-width="2"/>
  {draw_arrow_head(conn_left_x, t3_y + t3_h + 38, direction="down", color="#003D9B", size=6)}

  <!-- Center: Microservices API Call -->
  <line x1="{conn_mid_x}" y1="{t3_y + t3_h}" x2="{conn_mid_x}" y2="{t3_y + t3_h + 38}" stroke="#003D9B" stroke-width="2"/>
  {draw_arrow_head(conn_mid_x, t3_y + t3_h + 38, direction="down", color="#003D9B", size=6)}

  <!-- Right: LLM Inference Request -->
  <line x1="{conn_right_x}" y1="{t3_y + t3_h}" x2="{conn_right_x}" y2="{t3_y + t3_h + 38}" stroke="#003D9B" stroke-width="2"/>
  {draw_arrow_head(conn_right_x, t3_y + t3_h + 38, direction="down", color="#003D9B", size=6)}
  {draw_flow_badge(conn_right_x, t3_y + t3_h + 19, "6")}''')

    # =========================================================================
    # TIER 4: TẦNG DỮ LIỆU, DỊCH VỤ NGHIỆP VỤ & NỀN TẢNG LLM (y: 1615, h: 580)
    # =========================================================================
    t4_y = 1615
    t4_h = 580
    lines.append(f'''
  <!-- ================= TIER 4: DATA, SERVICES & FOUNDATION MODELS ================= -->
  <g id="Tier4_DataServicesModels" transform="translate({margin_x}, {t4_y})">
    <!-- Tier Boundary Container -->
    <rect width="{content_w}" height="{t4_h}" rx="8" fill="#F8FAFC" stroke="#003D9B" stroke-width="1.8"/>
    <!-- Tier Header Banner -->
    <path d="M 0 8 A 8 8 0 0 1 8 0 L 720 0 L 745 34 L 0 34 Z" fill="#EFF6FF" stroke="#003D9B" stroke-width="1.2"/>
    <text x="24" y="23" class="tier-title">TẦNG 4: LƯU TRỮ TRI THỨC, DỊCH VỤ NGHIỆP VỤ &amp; MÔ HÌNH NỀN TẢNG</text>
    <text x="765" y="23" class="tier-sub">[TIER 4: KNOWLEDGE PERSISTENCE, BACKEND MICROSERVICES &amp; FOUNDATION LLMS]</text>''')


    # 3 Partition Sections in Tier 4
    # Partition 4A: Kho Tri Thức & Dữ Liệu Lưu Trữ (w: 1110px)
    # Partition 4B: Lưới Dịch Vụ Nghiệp Vụ Logistics (w: 1120px)
    # Partition 4C: Mô Hình Ngôn Ngữ Lớn & Suy Luận (w: 1110px)
    p_w = (content_w - 60 - 50) // 3  # 1116px

    # -------------------------------------------------------------------------
    # PHÂN VÙNG 4A: KHO TRI THỨC & DỮ LIỆU (Database Platter Cylinders)
    # -------------------------------------------------------------------------
    lines.append(f'''
    <!-- 4A: Knowledge & Data Stores -->
    <g transform="translate(30, 48)">
      <rect width="{p_w}" height="{t4_h - 70}" rx="6" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
      <text x="24" y="28" class="comp-stereo">«Data Persistence &amp; Vector Stores»</text>
      <text x="24" y="50" class="comp-title">A. Kho Tri Thức &amp; Cơ Sở Dữ Liệu (Knowledge Stores)</text>
      
      <!-- Cylinder 1: Vector Knowledge Cache -->
      {draw_database_cylinder(24, 70, p_w - 48, 200, "1. Kho Véc-tơ Tri thức (Vector Embedding Cache)", [
          "• Cấu trúc: 62 vector embeddings chuẩn 768 chiều tương ứng 62 chunks văn bản.",
          "• Tốc độ truy xuất: Toàn bộ nạp sẵn vào RAM máy chủ (In-Memory), độ trễ tìm kiếm < 5ms.",
          "• Thuật toán khớp: Cosine Similarity ma trận véc-tơ; Tự động giải phóng khi khởi động lại.",
          "• Cơ chế nạp lại: API POST /ingest cho phép Admin cập nhật tri thức SOP mới tức thời.",
          "• Ràng buộc: Lưu trữ độc lập, không phụ thuộc kết nối Internet ngoại vi."
      ])}

      <!-- Cylinder 2: SOP Document Repository -->
      {draw_database_cylinder(24, 285, p_w - 48, 200, "2. Kho Tài Liệu Quy Chuẩn SOP Bưu Chính (SOP Store)", [
          "• 9 văn bản SOP nghiệp vụ: SOP-01 Quy cách đóng gói, SOP-02 Biểu cước bưu chính,",
          "  SOP-03 Bưu gửi cồng kềnh, SOP-04 Giải quyết khiếu nại, SOP-08 Lưu kho quá hạn...",
          "• Định dạng chuẩn: AST Markdown Header Level, giữ nguyên cấu trúc điều khoản luật định.",
          "• Chuẩn hóa căn cứ pháp lý: Quy chiếu trực tiếp Điều 18 & 25 Luật Bưu chính Việt Nam.",
          "• Phân đoạn tự động: 62 chunks có độ dài trung bình 240 từ, bảo toàn ngữ cảnh hoàn chỉnh."
      ])}
    </g>''')

    # -------------------------------------------------------------------------
    # PHÂN VÙNG 4B: LƯỚI DỊCH VỤ NGHIỆP VỤ LOGISTICS (Microservices Backend)
    # -------------------------------------------------------------------------
    lines.append(f'''
    <!-- 4B: Logistics Backend Microservices Mesh -->
    <g transform="translate({30 + p_w + 25}, 48)">
      <rect width="{p_w}" height="{t4_h - 70}" rx="6" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
      <text x="24" y="28" class="comp-stereo">«Domain Microservices · Node.js / Express»</text>
      <text x="24" y="50" class="comp-title">B. Lưới Dịch Vụ Nghiệp Vụ Logistics (Microservices Mesh)</text>

      <!-- Microservice Card 1: ShipmentService -->
      <g transform="translate(24, 70)">
        <rect width="{p_w - 48}" height="95" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        {draw_uml_component_glyph(p_w - 78, 10)}
        <text x="18" y="24" class="comp-stereo">«Microservice · Port :3002»</text>
        <text x="18" y="44" class="comp-title">ShipmentService: Quản Lý Vận Đơn &amp; Lộ Trình</text>
        <text x="18" y="66" class="comp-txt">• Tra cứu trạng thái kiện hàng theo mã <tspan class="comp-code">NX-XXXX</tspan>, bưu tá phát, điểm quét mã vạch.</text>
        <text x="18" y="84" class="comp-code" style="fill:#0052CC;">API Endpoint: GET /api/v1/shipments/:trackingCode • DB: PostgreSQL</text>
      </g>

      <!-- Microservice Card 2: PricingService -->
      <g transform="translate(24, 175)">
        <rect width="{p_w - 48}" height="95" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        {draw_uml_component_glyph(p_w - 78, 10)}
        <text x="18" y="24" class="comp-stereo">«Microservice · Port :3003»</text>
        <text x="18" y="44" class="comp-title">PricingService: Tính Cước Phí &amp; Phụ Phí Vận Chuyển</text>
        <text x="18" y="66" class="comp-txt">• Bảng cước chuẩn IATA, công thức thể tích <tspan class="comp-code">(D×R×C)/5000</tspan>, phụ phí hải đảo, cước bảo hiểm.</text>
        <text x="18" y="84" class="comp-code" style="fill:#0052CC;">API Endpoint: POST /api/v1/pricing/calculate • Latency &lt; 15ms</text>
      </g>

      <!-- Microservice Card 3: IncidentService -->
      <g transform="translate(24, 280)">
        <rect width="{p_w - 48}" height="95" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        {draw_uml_component_glyph(p_w - 78, 10)}
        <text x="18" y="24" class="comp-stereo">«Microservice · Port :3008»</text>
        <text x="18" y="44" class="comp-title">IncidentService: Xử Lý Khiếu Nại &amp; Bồi Thường Sự Cố</text>
        <text x="18" y="66" class="comp-txt">• Tiếp nhận báo cáo bưu phẩm vỡ, rách bao bì, mất mát; Khởi tạo hồ sơ bồi thường.</text>
        <text x="18" y="84" class="comp-code" style="fill:#0052CC;">API Endpoint: POST /api/v1/incidents/create • Tự động gắn mã hồ sơ CLM</text>
      </g>

      <!-- Microservice Card 4: HubService -->
      <g transform="translate(24, 385)">
        <rect width="{p_w - 48}" height="95" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        {draw_uml_component_glyph(p_w - 78, 10)}
        <text x="18" y="24" class="comp-stereo">«Microservice · Port :3004»</text>
        <text x="18" y="44" class="comp-title">HubService: Kiểm Soát Tồn Kho &amp; Cảnh Báo Hàng Quá Hạn</text>
        <text x="18" y="66" class="comp-txt">• Cảnh báo kiện hàng tồn kho quá 30 ngày (SOP-08); Phối hợp điều hướng hoàn hàng.</text>
        <text x="18" y="84" class="comp-code" style="fill:#0052CC;">API Endpoint: GET /api/v1/hubs/storage-ageing • Quản lý kho trung chuyển</text>
      </g>
    </g>''')

    # -------------------------------------------------------------------------
    # PHÂN VÙNG 4C: MÔ HÌNH NỀN TẢNG ĐA TẦNG (Foundation LLM & Embedder)
    # -------------------------------------------------------------------------
    lines.append(f'''
    <!-- 4C: Foundation LLM & Inference Models -->
    <g transform="translate({30 + (p_w + 25)*2}, 48)">
      <rect width="{p_w}" height="{t4_h - 70}" rx="6" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
      <text x="24" y="28" class="comp-stereo">«External Cloud AI &amp; Local Embedder»</text>
      <text x="24" y="50" class="comp-title">C. Mô Hình Ngôn Ngữ Lớn &amp; Suy Luận (Foundation LLMs)</text>

      <!-- LLM 1: Primary Model (Gemini 2.0 / 1.5 Flash) -->
      <g transform="translate(24, 70)">
        <rect width="{p_w - 48}" height="135" rx="5" fill="#EFF6FF" stroke="#003D9B" stroke-width="1.5"/>
        {draw_uml_component_glyph(p_w - 78, 12)}
        <text x="18" y="24" class="comp-stereo" style="fill:#003D9B;">«Primary Cloud LLM · Google AI Studio»</text>
        <text x="18" y="46" class="comp-title">1. Mô Hình Suy Luận Chính: Gemini 1.5 / 2.0 Flash</text>
        <text x="18" y="70" class="comp-txt">• Hỗ trợ Function Calling native; Tiếp nhận Tool Schema JSON và sinh tham số gọi hàm chuẩn xác.</text>
        <text x="18" y="90" class="comp-txt">• Tốc độ suy luận cao, hỗ trợ sinh token trực tiếp dạng Server-Sent Events (SSE) với độ trễ thấp.</text>
        <text x="18" y="110" class="comp-txt">• Cửa sổ ngữ cảnh cực lớn (1M tokens), xử lý mượt mà tài liệu quy chuẩn và bảng cước phức tạp.</text>
        <text x="18" y="126" class="comp-code" style="fill:#003D9B;">Cấu hình: gemini-1.5-flash • Temperature: 0.2 • Top-P: 0.95</text>
      </g>

      <!-- LLM 2: Fallback Model (OpenAI GPT-4o-mini) -->
      <g transform="translate(24, 215)">
        <rect width="{p_w - 48}" height="130" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        {draw_uml_component_glyph(p_w - 78, 12)}
        <text x="18" y="24" class="comp-stereo">«Secondary Fallback LLM · OpenAI API»</text>
        <text x="18" y="46" class="comp-title">2. Mô Hình Dự Phòng Độ Sẵn Sàng Cao: GPT-4o-mini</text>
        <text x="18" y="70" class="comp-txt">• Tự động chuyển tiếp khi Primary LLM gặp sự cố nghẽn mạng hoặc vượt ngưỡng Rate Limit.</text>
        <text x="18" y="90" class="comp-txt">• Khả năng tuân thủ định dạng System Prompt và JSON Schema tương thích 100%.</text>
        <text x="18" y="110" class="comp-txt">• Đảm bảo độ sẵn sàng của hệ thống trợ lý ảo đạt 99.9% cho dịch vụ chăm sóc khách hàng 24/7.</text>
        <text x="18" y="124" class="comp-code" style="fill:#0052CC;">Cấu hình: gpt-4o-mini • Dự phòng chuyển mạch tự động (Failover)</text>
      </g>

      <!-- LLM 3: Text Vectorizer (Local / Cloud Embedder) -->
      <g transform="translate(24, 355)">
        <rect width="{p_w - 48}" height="125" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        {draw_uml_component_glyph(p_w - 78, 12)}
        <text x="18" y="24" class="comp-stereo">«Text Embedding Model · Vectorizer»</text>
        <text x="18" y="46" class="comp-title">3. Bộ Vector Hóa Ngữ Nghĩa: Text-Embedding-004</text>
        <text x="18" y="70" class="comp-txt">• Thuật toán nhúng véc-tơ chuyển đổi văn bản sang không gian đa chiều 768 chiều (Dimensions: 768).</text>
        <text x="18" y="90" class="comp-txt">• Tối ưu hóa cho ngữ nghĩa tiếng Việt chuyên ngành logistics và vận tải bưu chính.</text>
        <text x="18" y="110" class="comp-txt">• Vector hóa tức thì câu hỏi của người dùng để so khớp độ tương đồng Cosine trên bộ nhớ đệm.</text>
        <text x="18" y="122" class="comp-code" style="fill:#0052CC;">Mô hình: text-embedding-004 (Google AI) / In-memory Fast Vectorizer</text>
      </g>
    </g>''')

    lines.append('  </g>')

    # Return Flow from Tier 4 to Tier 1 (Stream Output)
    lines.append(f'''
  <!-- Return Stream Flow Line from Tier 4 (LLM/SSE) back to Tier 1 Client -->
  <path d="M {margin_x + content_w - 80} {t4_y + 115} L {width - 55} {t4_y + 115} L {width - 55} {t1_y + 115} L {margin_x + content_w} {t1_y + 115}"
        fill="none" stroke="#0052CC" stroke-width="2" stroke-dasharray="6,4"/>
  {draw_arrow_head(margin_x + content_w, t1_y + 115, direction="left", color="#0052CC", size=6)}
  {draw_flow_badge(width - 55, (t4_y + t1_y)//2 + 50, "7")}
  <text x="{width - 70}" y="{(t4_y + t1_y)//2 + 80}" text-anchor="end" class="comp-code" style="fill:#003D9B; font-weight:700;">SSE STREAM PHẢN HỒI REAL-TIME VỀ CLIENT (TTFT &lt; 500MS)</text>''')

    # =========================================================================
    # FOOTER BAR & ACADEMIC METADATA BLUEPRINT (y: 2225, h: 220)
    # =========================================================================
    ft_y = 2225
    ft_h = 220
    lines.append(f'''
  <!-- ================= FOOTER: 7-STEP WORKFLOW & BLUEPRINT METADATA ================= -->
  <g id="Footer_Specification" transform="translate({margin_x}, {ft_y})">
    <rect width="{content_w}" height="{ft_h}" rx="8" fill="#F8FAFC" stroke="#003D9B" stroke-width="1.8"/>
    
    <!-- Left Box: 7-Step Architectural Execution Sequence (Academic Flow) -->
    <g transform="translate(24, 18)">
      <rect width="{content_w - 740}" height="184" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="20" y="24" class="footer-title">CHU TRÌNH THỰC THI 7 BƯỚC CỦA HỆ THỐNG TRỢ LÝ ẢO (7-STEP INTERACTION LIFECYCLE):</text>
      
      <!-- 7 Steps Table Grid -->
      <!-- 7 Steps Table Grid (3 Balanced Columns) -->
      <g transform="translate(20, 38)">
        <!-- Col 1: Steps 1 & 2 -->
        <g transform="translate(0, 0)">
          <text x="0" y="16" class="flow-step-title"><tspan style="fill:#003D9B; font-weight:800;">① Khởi tạo yêu cầu:</tspan> Client gửi payload qua HTTPS Ingress <tspan class="comp-code">:3009</tspan>.</text>
          <text x="0" y="34" class="flow-step-desc">Payload chứa nội dung tin nhắn, conversationId và token xác thực JWT hợp lệ.</text>

          <text x="0" y="68" class="flow-step-title"><tspan style="fill:#003D9B; font-weight:800;">② Bảo mật &amp; Phiên:</tspan> Khử PII bằng Regex, ngăn Prompt Injection.</text>
          <text x="0" y="86" class="flow-step-desc">Che giấu số điện thoại khách hàng, bóc tách thực thể và khôi phục ngữ cảnh 6 lượt.</text>
        </g>

        <!-- Col 2: Steps 3 & 4 -->
        <g transform="translate(890, 0)">
          <text x="0" y="16" class="flow-step-title"><tspan style="fill:#003D9B; font-weight:800;">③ Phân luồng NLU:</tspan> Cây quyết định định tuyến ý định (Policy / Tool / Hỗn hợp).</text>
          <text x="0" y="34" class="flow-step-desc">Tối ưu hóa tài nguyên, không gọi API Microservices dư thừa khi chỉ hỏi đáp chính sách.</text>

          <text x="0" y="68" class="flow-step-title"><tspan style="fill:#003D9B; font-weight:800;">④ Truy xuất song song:</tspan> Tìm kiếm RAG lai (Dense + Sparse) &amp; Gọi API Tool.</text>
          <text x="0" y="86" class="flow-step-desc">Lọc tài liệu theo ngưỡng Score ≥ 0.58 và lấy dữ liệu vận đơn thực tế từ cổng <tspan class="comp-code">:3000</tspan>.</text>
        </g>

        <!-- Col 3: Steps 5, 6 & 7 -->
        <g transform="translate(1780, 0)">
          <text x="0" y="16" class="flow-step-title"><tspan style="fill:#003D9B; font-weight:800;">⑤ Ghép Prompt 4 Tầng:</tspan> Context Sandwich (Directives + SOP + DTO + History).</text>
          <text x="0" y="34" class="flow-step-desc">Khóa Temperature = 0.2 triệt tiêu ảo giác, bảo đảm chuẩn xác theo văn bản quy chuẩn.</text>

          <text x="0" y="68" class="flow-step-title"><tspan style="fill:#003D9B; font-weight:800;">⑥ Suy luận AI &amp; ⑦ SSE Stream:</tspan> LLM sinh token đẩy thời gian thực về Client.</text>
          <text x="0" y="86" class="flow-step-desc">Người dùng thấy phản hồi xuất hiện tức thì (&lt; 500ms); Đóng ngắt luồng [DONE] an toàn.</text>
        </g>
      </g>
    </g>

    <!-- Right Box: Academic Thesis Blueprint Metadata Table -->
    <g transform="translate({content_w - 690}, 18)">
      <rect width="666" height="184" rx="6" fill="#EFF6FF" stroke="#003D9B" stroke-width="1.4"/>
      
      <!-- Table Header -->
      <rect width="666" height="36" rx="6" fill="#003D9B"/>
      <text x="24" y="24" class="hdr-meta-lbl" style="font-size:13px;">THÔNG TIN BẢN VẼ KIẾN TRÚC ĐỒ ÁN TỐT NGHIỆP</text>

      <!-- Metadata Rows -->
      <g transform="translate(24, 48)">
        <!-- Row 1 -->
        <text x="0" y="22" class="footer-title">Đề Tài Tốt Nghiệp:</text>
        <text x="180" y="22" class="footer-val">HỆ THỐNG QUẢN LÝ VẬN TẢI &amp; LOGISTICS TOÀN TRÌNH (NEXUS LMS)</text>

        <!-- Row 2 -->
        <text x="0" y="48" class="footer-title">Phân Hệ Thiết Kế:</text>
        <text x="180" y="48" class="footer-val">Phân hệ Trợ lý AI Đàm thoại (Chatbot Subsystem · Port :3009)</text>

        <!-- Row 3 -->
        <text x="0" y="74" class="footer-title">Tiêu Chuẩn Kiến Trúc:</text>
        <text x="180" y="74" class="footer-val">ISO/IEC 42010 · 4-Tier Layered Architecture · UML 2.0 Notation</text>

        <!-- Row 4 -->
        <text x="0" y="100" class="footer-title">Thuật Toán Cốt Lõi:</text>
        <text x="180" y="100" class="footer-val">Hybrid Search (Dense Cosine + Sparse BM25) · Tool Calling Dispatcher</text>

        <!-- Row 5 -->
        <text x="0" y="126" class="footer-title">Mã Bản Vẽ &amp; Bản Quyền:</text>
        <text x="180" y="126" class="footer-val" style="fill:#003D9B; font-weight:800;">ARCH-LMS-CB-04A · Phiên bản v5.0 (Hội đồng Chấm Khóa Luận)</text>
      </g>
    </g>
  </g>''')


    lines.append('</svg>')

    full_svg = '\n'.join(lines)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(full_svg)

    print(f"Generating Academic 4-Tier System Architecture Diagram for AI Chatbot Subsystem...")
    print(f"Successfully generated: {OUTPUT_FILE}")
    print(f"File size: {len(full_svg):,} bytes")

    # XML Validation
    try:
        ET.fromstring(full_svg)
        print("SVG XML Validation: PASSED (Well-formed XML)")
    except ET.ParseError as e:
        print(f"SVG XML Validation: FAILED - {e}")
        raise e

if __name__ == "__main__":
    build_architecture_svg()
