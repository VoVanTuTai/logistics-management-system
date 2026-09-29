#!/usr/bin/env python3
"""
generate-chatbot-subsystem-architecture.py
Academic-Grade System Architecture Diagram for the AI Chatbot Subsystem (Nexus AI Assistant).
Designed for Graduation Thesis (Đồ án tốt nghiệp / Báo cáo khoa học) & Figma Page 1 (Section 1.4A).

Design Principles:
- Strict Human-Architected Engineering Blueprint: No weird icons, no diagonal slash ribbons, no AI gimmicks.
- Standard A4 Portrait Aspect Ratio: Width 2000px, Height 2830px (1 : 1.4142).
- Clean rectangular containers with unified header bars (Title on left, English spec on right).
- Spacious, clear inter-tier visual highways (80px - 90px gaps) for prominent directional connecting arrows.
- Standard engineering color palette: System Navy (#003D9B), Action Blue (#0052CC), Slate Grays (#0F172A, #334155, #CBD5E1), Soft Blueprint Fills (#F8FAFC, #EFF6FF).
- 100% Native Vector Figma Compatible: ZERO SVG <marker> tags, 100% inline vectors.

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
    width = 2000
    height = 2830
    lines = []

    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # Double Technical Border
    lines.append(f'''
  <!-- Academic Blueprint Double Border (A4 Portrait Format) -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <rect x="20" y="20" width="{width - 40}" height="{height - 40}" fill="none" stroke="#003D9B" stroke-width="2.5"/>
  <rect x="30" y="30" width="{width - 60}" height="{height - 60}" fill="none" stroke="#CBD5E1" stroke-width="1.2"/>

  <style>
    text {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }}
    
    .hdr-title {{ font-size: 21px; font-weight: 800; fill: #FFFFFF; letter-spacing: -0.3px; }}
    .hdr-sub {{ font-size: 13px; font-weight: 500; fill: #DAE2FF; }}
    .hdr-meta-lbl {{ font-size: 11px; font-weight: 700; fill: #FFFFFF; font-family: ui-monospace, Menlo, monospace; letter-spacing: 0.5px; }}
    
    .tier-title {{ font-size: 14.5px; font-weight: 800; fill: #003D9B; letter-spacing: 0.6px; text-transform: uppercase; }}
    .tier-sub {{ font-size: 11px; font-weight: 600; fill: #475569; font-family: ui-monospace, Menlo, monospace; }}
    
    .comp-title {{ font-size: 14px; font-weight: 700; fill: #0F172A; letter-spacing: -0.2px; }}
    .comp-stereo {{ font-size: 11px; font-weight: 600; fill: #0052CC; font-family: ui-monospace, Menlo, monospace; }}
    .comp-txt {{ font-size: 12px; font-weight: 400; fill: #334155; line-height: 1.45; }}
    .comp-txt-bold {{ font-size: 12px; font-weight: 700; fill: #0F172A; }}
    .comp-code {{ font-size: 11px; font-weight: 600; fill: #0052CC; font-family: ui-monospace, Menlo, monospace; }}
    
    .tag-rect {{ fill: #F1F5F9; stroke: #CBD5E1; stroke-width: 1; rx: 4px; }}
    .tag-txt {{ font-size: 10.5px; font-weight: 600; fill: #003D9B; font-family: ui-monospace, Menlo, monospace; }}
    
    .math-formula {{ font-size: 12.5px; font-weight: 700; fill: #003D9B; font-family: ui-monospace, Menlo, monospace; }}
    .guard-text {{ font-size: 11.5px; font-weight: 700; fill: #003D9B; font-family: ui-monospace, Menlo, monospace; }}
    
    .flow-badge {{ font-size: 12px; font-weight: 800; fill: #FFFFFF; font-family: ui-monospace, Menlo, monospace; }}
    .flow-arrow-lbl {{ font-size: 11.5px; font-weight: 700; fill: #003D9B; font-family: ui-monospace, Menlo, monospace; }}
    
    .flow-step-title {{ font-size: 12px; font-weight: 700; fill: #0F172A; }}
    .flow-step-desc {{ font-size: 11px; font-weight: 500; fill: #475569; }}
    
    .footer-title {{ font-size: 11.5px; font-weight: 800; fill: #003D9B; text-transform: uppercase; letter-spacing: 0.5px; }}
    .footer-val {{ font-size: 11.5px; font-weight: 600; fill: #0F172A; font-family: ui-monospace, Menlo, monospace; }}
  </style>
''')

    # Utility Functions
    def draw_arrow_head(x2, y2, direction="right", color="#003D9B", size=6):
        """Draws standard vector arrowhead."""
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
        """Draws numbered circle badge indicating architectural sequence."""
        return f'''
      <g transform="translate({bx}, {by})">
        <circle cx="0" cy="0" r="13" fill="#003D9B" stroke="#FFFFFF" stroke-width="2"/>
        <text x="0" y="4.5" text-anchor="middle" class="flow-badge">{number}</text>
      </g>'''

    def draw_store_box(cx, cy, cw, ch, title, sub_stereo, bullet_lines):
        """Draws a clean, standard architectural data store card."""
        d_svg = []
        d_svg.append(f'''
      <g transform="translate({cx}, {cy})">
        <rect width="{cw}" height="{ch}" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <rect width="{cw}" height="28" rx="6" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
        <text x="14" y="19" class="comp-stereo">{escape(sub_stereo)}</text>
        <text x="14" y="48" class="comp-title" style="color:#003D9B; font-size:13px;">{escape(title)}</text>''')
        cur_y = 70
        for line in bullet_lines:
            d_svg.append(f'<text x="14" y="{cur_y}" class="comp-txt">{escape(line)}</text>')
            cur_y += 20
        d_svg.append('      </g>')
        return '\n'.join(d_svg)

    # Layout Dimensions
    margin_x = 55
    content_w = 1840  # Leaves 50px on right for clean return SSE stream

    # =========================================================================
    # HEADER BAR (y: 45, h: 76)
    # =========================================================================
    lines.append(f'''
  <!-- HEADER BAR (SYSTEM BRAND BLUE: #003D9B) -->
  <g id="HeaderBar" transform="translate({margin_x}, 45)">
    <rect width="{content_w}" height="76" rx="8" fill="#003D9B"/>
    <rect x="0" y="72" width="{content_w}" height="4" fill="#0052CC"/>
    
    <text x="24" y="32" class="hdr-title">HÌNH 1.4A: KIẾN TRÚC PHÂN TẦNG VÀ ĐIỀU PHỐI PHÂN HỆ AI CHATBOT (NEXUS AI ASSISTANT)</text>
    <text x="24" y="56" class="hdr-sub">Mô hình kiến trúc phân tầng chuẩn học thuật (4-Tier Layered Architecture) • Tối ưu hóa khổ A4 dọc báo cáo Đồ án tốt nghiệp</text>
    
    <!-- Academic Specification Badges -->
    <g transform="translate({content_w - 530}, 20)">
      <rect x="0" y="0" width="160" height="36" rx="4" fill="#00296B" stroke="#0052CC" stroke-width="1.2"/>
      <text x="80" y="22" text-anchor="middle" class="hdr-meta-lbl">A4 PORTRAIT SPEC</text>
      
      <rect x="175" y="0" width="170" height="36" rx="4" fill="#00296B" stroke="#0052CC" stroke-width="1.2"/>
      <text x="260" y="22" text-anchor="middle" class="hdr-meta-lbl">4-TIER MULTI-LAYER</text>
      
      <rect x="360" y="0" width="160" height="36" rx="4" fill="#00296B" stroke="#0052CC" stroke-width="1.2"/>
      <text x="440" y="22" text-anchor="middle" class="hdr-meta-lbl">HYBRID RAG + TOOLS</text>
    </g>
  </g>''')

    # Common Column Sizing
    col_gap = 20
    box_w = (content_w - 48 - col_gap * 2) // 3  # (1840 - 88) // 3 = 584px

    # =========================================================================
    # TIER 1: TẦNG TRÌNH DIỄN & ỨNG DỤNG CLIENT (y: 145, h: 200)
    # =========================================================================
    t1_y = 145
    t1_h = 200
    lines.append(f'''
  <!-- ================= TIER 1: CLIENT & PRESENTATION LAYER ================= -->
  <g id="Tier1_Presentation" transform="translate({margin_x}, {t1_y})">
    <!-- Tier Boundary Container -->
    <rect width="{content_w}" height="{t1_h}" rx="8" fill="#F8FAFC" stroke="#003D9B" stroke-width="1.8"/>
    <!-- Clean Horizontal Header Bar -->
    <rect width="{content_w}" height="36" rx="8" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
    <text x="20" y="23" class="tier-title">TẦNG 1: TRÌNH DIỄN &amp; ỨNG DỤNG CLIENT</text>
    <text x="{content_w - 20}" y="23" text-anchor="end" class="tier-sub">[TIER 1: PRESENTATION &amp; CLIENT APPLICATIONS - PROTOCOL: HTTPS / REST / SSE STREAM]</text>''')

    # 1.1 Merchant Web Portal
    lines.append(f'''
    <!-- 1.1 Merchant Web Portal -->
    <g transform="translate(24, 46)">
      <rect width="{box_w}" height="140" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="18" y="24" class="comp-stereo">«Client Application · Next.js 14»</text>
      <text x="18" y="46" class="comp-title">Cổng Thương Nhân (Merchant Web)</text>
      <text x="18" y="70" class="comp-txt">• Trợ lý đàm thoại tra cứu trạng thái vận đơn, cước phí, tạo đơn tức thời.</text>
      <text x="18" y="90" class="comp-txt">• Render thẻ giao diện động (Dynamic Shipment Card, Bảng kê chi phí).</text>
      <g transform="translate(18, 106)">
        <rect width="190" height="20" class="tag-rect"/>
        <text x="10" y="14" class="tag-txt">HTTPS POST /api/v1/chat</text>
        <rect x="200" y="0" width="160" height="20" class="tag-rect"/>
        <text x="210" y="14" class="tag-txt">EventSource SSE Stream</text>
      </g>
    </g>''')

    # 1.2 Courier Mobile App
    lines.append(f'''
    <!-- 1.2 Courier Mobile App -->
    <g transform="translate({24 + box_w + col_gap}, 46)">
      <rect width="{box_w}" height="140" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="18" y="24" class="comp-stereo">«Mobile Application · React Native»</text>
      <text x="18" y="46" class="comp-title">Ứng Dụng Bưu Tá (Courier Mobile)</text>
      <text x="18" y="70" class="comp-txt">• Hỗ trợ tra cứu quy trình giao phát và hướng dẫn xử lý sự cố hiện trường.</text>
      <text x="18" y="90" class="comp-txt">• Khởi tạo biên bản sự cố bưu phẩm (hư hỏng/mất mát) đính kèm ảnh chụp.</text>
      <g transform="translate(18, 106)">
        <rect width="170" height="20" class="tag-rect"/>
        <text x="10" y="14" class="tag-txt">HTTPS REST JSON (TLS 1.3)</text>
        <rect x="180" y="0" width="160" height="20" class="tag-rect"/>
        <text x="190" y="14" class="tag-txt">JWT Authenticated Session</text>
      </g>
    </g>''')

    # 1.3 Operations & CSKH Portal
    lines.append(f'''
    <!-- 1.3 Operations & CSKH Portal -->
    <g transform="translate({24 + (box_w + col_gap)*2}, 46)">
      <rect width="{box_w}" height="140" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="18" y="24" class="comp-stereo">«SPA Web Application · React»</text>
      <text x="18" y="46" class="comp-title">Cổng Điều Hành (Operations Console)</text>
      <text x="18" y="70" class="comp-txt">• Giám sát nhật ký hội thoại &amp; can thiệp tư vấn viên (Human-in-the-loop).</text>
      <text x="18" y="90" class="comp-txt">• Quản trị kho tài liệu quy chuẩn SOP bưu chính và kích hoạt nhúng véc-tơ.</text>
      <g transform="translate(18, 106)">
        <rect width="150" height="20" class="tag-rect"/>
        <text x="10" y="14" class="tag-txt">RESTful Admin APIs</text>
        <rect x="160" y="0" width="170" height="20" class="tag-rect"/>
        <text x="170" y="14" class="tag-txt">WebSocket Event Monitor</text>
      </g>
    </g>''')

    lines.append('  </g>')

    # =========================================================================
    # SPACIOUS CONNECTOR TIER 1 -> TIER 2 (Gap: 80px)
    # =========================================================================
    t1_to_t2_gap = 80
    flow_1_x = margin_x + content_w // 2
    arrow_1_start = t1_y + t1_h
    arrow_1_end = arrow_1_start + t1_to_t2_gap

    lines.append(f'''
  <!-- Spacious Connector Tier 1 -> Tier 2 (Highlighting Arrow Flow) -->
  <line x1="{flow_1_x}" y1="{arrow_1_start}" x2="{flow_1_x}" y2="{arrow_1_end}" stroke="#003D9B" stroke-width="2.6"/>
  {draw_arrow_head(flow_1_x, arrow_1_end, direction="down", color="#003D9B", size=8)}
  {draw_flow_badge(flow_1_x - 38, arrow_1_start + t1_to_t2_gap // 2, "1")}
  
  <!-- Flow 1 Protocol Badge -->
  <g transform="translate({flow_1_x + 18}, {arrow_1_start + t1_to_t2_gap // 2 - 14})">
    <rect width="450" height="28" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
    <text x="12" y="18" class="flow-arrow-lbl">ChatRequestDTO [POST :3009 (Ingress) / HTTPS REST &amp; SSE Stream]</text>
  </g>''')

    # =========================================================================
    # TIER 2: TẦNG CỔNG DỊCH VỤ, BẢO MẬT & QUẢN LÝ PHIÊN (y: 425, h: 200)
    # =========================================================================
    t2_y = arrow_1_end
    t2_h = 200
    lines.append(f'''
  <!-- ================= TIER 2: GATEWAY, GUARDRAILS & SESSION ================= -->
  <g id="Tier2_GatewaySecurity" transform="translate({margin_x}, {t2_y})">
    <!-- Tier Boundary Container -->
    <rect width="{content_w}" height="{t2_h}" rx="8" fill="#F8FAFC" stroke="#003D9B" stroke-width="1.8"/>
    <!-- Clean Horizontal Header Bar -->
    <rect width="{content_w}" height="36" rx="8" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
    <text x="20" y="23" class="tier-title">TẦNG 2: CỔNG DỊCH VỤ, BẢO MẬT &amp; QUẢN LÝ PHIÊN</text>
    <text x="{content_w - 20}" y="23" text-anchor="end" class="tier-sub">[TIER 2: API GATEWAY, SECURITY GUARDRAILS &amp; CONTEXT BUFFER]</text>''')

    # 2.1 Ingress API Controller
    lines.append(f'''
    <!-- 2.1 Ingress API Controller -->
    <g transform="translate(24, 46)">
      <rect width="{box_w}" height="140" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="18" y="24" class="comp-stereo">«REST / SSE Controller · Port :3009»</text>
      <text x="18" y="46" class="comp-title">Bộ Điều Khiển Cổng (API Controller)</text>
      <text x="18" y="70" class="comp-txt">• Tiếp nhận payload HTTP POST ChatRequestDTO; quản lý kết nối EventSource SSE.</text>
      <text x="18" y="90" class="comp-txt">• Xác thực chữ ký số JWT Token; phân quyền truy cập theo vai trò (RBAC).</text>
      <g transform="translate(18, 106)">
        <rect width="160" height="20" class="tag-rect"/>
        <text x="10" y="14" class="tag-txt">Rate Limit: 60 req/phút</text>
        <rect x="170" y="0" width="170" height="20" class="tag-rect"/>
        <text x="180" y="14" class="tag-txt">Input Schema Validation</text>
      </g>
    </g>''')

    # 2.2 Security Guardrails & PII Sanitizer
    lines.append(f'''
    <!-- 2.2 Security Guardrails & PII Sanitizer -->
    <g transform="translate({24 + box_w + col_gap}, 46)">
      <rect width="{box_w}" height="140" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="18" y="24" class="comp-stereo">«Security Guardrail · Preprocessing Filter»</text>
      <text x="18" y="46" class="comp-title">Hàng Rào Bảo Mật &amp; Khử Dữ Liệu PII</text>
      <text x="18" y="70" class="comp-txt">• Khử thông tin nhận dạng cá nhân (PII Masking): Che giấu số điện thoại, CCCD qua Regex.</text>
      <text x="18" y="90" class="comp-txt">• Phòng vệ tiêm nhiễm lệnh (Prompt Injection Defense): Chặn câu lệnh thao túng.</text>
      <g transform="translate(18, 106)">
        <rect width="170" height="20" class="tag-rect"/>
        <text x="10" y="14" class="tag-txt">Regex Rule-Based Filter</text>
        <rect x="180" y="0" width="170" height="20" class="tag-rect"/>
        <text x="190" y="14" class="tag-txt">Unicode Normalization</text>
      </g>
    </g>''')

    # 2.3 Session Buffer & Context Manager
    lines.append(f'''
    <!-- 2.3 Session Buffer & Context Manager -->
    <g transform="translate({24 + (box_w + col_gap)*2}, 46)">
      <rect width="{box_w}" height="140" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="18" y="24" class="comp-stereo">«Stateful Context Buffer · Redis / In-Memory»</text>
      <text x="18" y="46" class="comp-title">Quản Lý Phiên &amp; Bộ Đệm Ngữ Cảnh</text>
      <text x="18" y="70" class="comp-txt">• Cửa sổ trượt ngữ cảnh (Sliding Window K=6 lượt): Lưu vết hội thoại liền trước.</text>
      <text x="18" y="90" class="comp-txt">• Khử hiện tượng mất ngữ cảnh: Duy trì mã đơn hàng và thực thể đang đàm thoại.</text>
      <g transform="translate(18, 106)">
        <rect width="170" height="20" class="tag-rect"/>
        <text x="10" y="14" class="tag-txt">Sliding Window K=6 turns</text>
        <rect x="180" y="0" width="160" height="20" class="tag-rect"/>
        <text x="190" y="14" class="tag-txt">Session TTL: 30 phút</text>
      </g>
    </g>''')

    lines.append('  </g>')

    # =========================================================================
    # SPACIOUS CONNECTOR TIER 2 -> TIER 3 (Gap: 85px)
    # =========================================================================
    t2_to_t3_gap = 85
    flow_2_x = margin_x + content_w // 2
    arrow_2_start = t2_y + t2_h
    arrow_2_end = arrow_2_start + t2_to_t3_gap

    lines.append(f'''
  <!-- Spacious Connector Tier 2 -> Tier 3 (Highlighting Arrow Flow) -->
  <line x1="{flow_2_x}" y1="{arrow_2_start}" x2="{flow_2_x}" y2="{arrow_2_end}" stroke="#003D9B" stroke-width="2.6"/>
  {draw_arrow_head(flow_2_x, arrow_2_end, direction="down", color="#003D9B", size=8)}
  {draw_flow_badge(flow_2_x - 38, arrow_2_start + t2_to_t3_gap // 2, "2")}
  
  <!-- Flow 2 Ingress Payload Badge -->
  <g transform="translate({flow_2_x + 18}, {arrow_2_start + t2_to_t3_gap // 2 - 14})">
    <rect width="520" height="28" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
    <text x="12" y="18" class="flow-arrow-lbl">SanitizedMessage + ContextArray[role, text] -> [AI PIPELINE INGRESS BUS]</text>
  </g>''')

    # =========================================================================
    # TIER 3: TẦNG ĐIỀU PHỐI SUY LUẬN, TRUY XUẤT RAG & CÔNG CỤ (y: 710, h: 840)
    # =========================================================================
    t3_y = arrow_2_end
    t3_h = 840
    lines.append(f'''
  <!-- ================= TIER 3: AI CORE ORCHESTRATION, RAG & TOOLING ================= -->
  <g id="Tier3_AICore" transform="translate({margin_x}, {t3_y})">
    <!-- Tier Boundary Container -->
    <rect width="{content_w}" height="{t3_h}" rx="8" fill="#F8FAFC" stroke="#003D9B" stroke-width="2"/>
    <!-- Clean Horizontal Header Bar -->
    <rect width="{content_w}" height="36" rx="8" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
    <text x="20" y="23" class="tier-title">TẦNG 3: LÕI ĐIỀU PHỐI SUY LUẬN, TRUY XUẤT RAG &amp; CÔNG CỤ</text>
    <text x="{content_w - 20}" y="23" text-anchor="end" class="tier-sub">[TIER 3: CORE AI ORCHESTRATION - INTENT ROUTER, HYBRID RAG &amp; TOOL CALLING ENGINE]</text>''')

    c3_w = box_w  # 584px
    c3a_x = 24
    c3b_x = 24 + c3_w + col_gap
    c3c_x = c3b_x + c3_w + col_gap

    # -------------------------------------------------------------------------
    # KHỐI 3A: ĐỊNH TUYẾN Ý ĐỊNH & PHÂN LUỒNG QUYẾT ĐỊNH (c3a_x)
    # -------------------------------------------------------------------------
    lines.append(f'''
    <!-- 3A: Phân loại ý định & Định tuyến NLU -->
    <g transform="translate({c3a_x}, 46)">
      <rect width="{c3_w}" height="{t3_h - 66}" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="18" y="24" class="comp-stereo">«Decision &amp; NLU Router»</text>
      <text x="18" y="46" class="comp-title">1. Phân Tích &amp; Định Tuyến Ý Định</text>
      
      <text x="18" y="70" class="comp-txt">• Chuẩn hóa câu hỏi, bóc tách thực thể: Mã vận đơn <tspan class="comp-code">NX-XXXX</tspan>, Mã sự cố.</text>
      <text x="18" y="90" class="comp-txt">• Xác định mục tiêu: Tra cứu quy trình SOP hay Thao tác dữ liệu nghiệp vụ.</text>

      <!-- Standard Decision Diamond -->
      <g transform="translate({c3_w//2}, 230)">
        <!-- Diamond Shape -->
        <polygon points="0,-48 125,0 0,48 -125,0" fill="#EFF6FF" stroke="#003D9B" stroke-width="1.8"/>
        <text x="0" y="-6" text-anchor="middle" class="comp-title" style="fill:#003D9B; font-size:12.5px;">PHÂN LOẠI Ý ĐỊNH</text>
        <text x="0" y="12" text-anchor="middle" class="comp-stereo">(INTENT ROUTER)</text>

        <!-- Branch 1: Policy SOP Query (To RAG) -->
        <line x1="125" y1="0" x2="{c3_w//2 - 12}" y2="0" stroke="#003D9B" stroke-width="2"/>
        {draw_arrow_head(c3_w//2 - 12, 0, direction="right", color="#003D9B", size=6)}
        <text x="135" y="-8" class="guard-text">[policy_sop]</text>
        <text x="135" y="14" class="comp-txt" style="font-size:10.5px; fill:#475569;">Nhánh RAG</text>

        <!-- Branch 2: Live Tool Call (To Tool Orchestrator) -->
        <path d="M 0 48 L 0 110 L {c3_w//2 - 12} 110" fill="none" stroke="#003D9B" stroke-width="2"/>
        {draw_arrow_head(c3_w//2 - 12, 110, direction="right", color="#003D9B", size=6)}
        <text x="15" y="103" class="guard-text">[live_tool]</text>
        <text x="15" y="126" class="comp-txt" style="font-size:10.5px; fill:#475569;">Nhánh Tool API</text>

        <!-- Branch 3: Hybrid RAG + Tool Call -->
        <path d="M 0 -48 L 0 -90 L {c3_w//2 - 12} -90" fill="none" stroke="#003D9B" stroke-width="2"/>
        {draw_arrow_head(c3_w//2 - 12, -90, direction="right", color="#003D9B", size=6)}
        <text x="15" y="-98" class="guard-text">[hybrid_task]</text>
        <text x="15" y="-76" class="comp-txt" style="font-size:10.5px; fill:#475569;">Song song RAG &amp; Tool</text>
      </g>

      <!-- Technical Rule Specifications Box -->
      <g transform="translate(18, 405)">
        <rect width="{c3_w - 36}" height="350" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="16" y="24" class="comp-title" style="font-size:13px; fill:#003D9B;">Quy Tắc Định Tuyến &amp; Bóc Tách Thực Thể:</text>
        
        <text x="16" y="50" class="comp-txt-bold">1. Nhánh Policy SOP (Quy chuẩn):</text>
        <text x="16" y="68" class="comp-txt">• Hỏi đáp quy định bưu gửi, quy cách đóng gói chất lỏng.</text>
        <text x="16" y="86" class="comp-txt">• Thời hiệu khiếu nại và mức bồi thường (Luật Bưu chính).</text>

        <text x="16" y="116" class="comp-txt-bold">2. Nhánh Live Tool (Công cụ thời gian thực):</text>
        <text x="16" y="134" class="comp-txt">• Tra cứu tiến độ vận đơn <tspan class="comp-code">NX-XXXX</tspan>, tính cước IATA.</text>
        <text x="16" y="152" class="comp-txt">• Khởi tạo biên bản sự cố và cảnh báo hàng lưu kho.</text>

        <text x="16" y="182" class="comp-txt-bold">3. Nhánh Hỗn Hợp (Hybrid Task):</text>
        <text x="16" y="200" class="comp-txt">• Tra cứu trạng thái kiện hàng thời gian thực.</text>
        <text x="16" y="218" class="comp-txt">• Đồng thời trích xuất điều khoản bồi thường theo SOP.</text>

        <text x="16" y="248" class="comp-txt-bold">4. Cơ chế Dự phòng (Fallback):</text>
        <text x="16" y="266" class="comp-txt">• Tự động chuyển tiếp câu hỏi mở sang mô hình LLM.</text>
        <text x="16" y="284" class="comp-txt">• Áp dụng chỉ thị an toàn nghiêm ngặt, chặn ảo giác.</text>

        <line x1="16" y1="305" x2="{c3_w - 52}" y2="305" stroke="#E2E8F0" stroke-width="1"/>
        <text x="16" y="328" class="comp-code">Hiệu năng định tuyến: Latency &lt; 8ms (Non-blocking)</text>
      </g>
    </g>''')

    # Flow Badge 3
    lines.append(f'''
    {draw_flow_badge(c3a_x + c3_w - 18, 275, "3")}''')

    # -------------------------------------------------------------------------
    # KHỐI 3B: BỘ TRUY XUẤT TRI THỨC LAI (HYBRID RAG RETRIEVAL ENGINE) (c3b_x)
    # -------------------------------------------------------------------------
    lines.append(f'''
    <!-- 3B: Bộ Truy Xuất Tri Thức Lai (Hybrid RAG) -->
    <g transform="translate({c3b_x}, 46)">
      <rect width="{c3_w}" height="{t3_h - 66}" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="18" y="24" class="comp-stereo">«Hybrid Retrieval Subsystem · Dense + Sparse»</text>
      <text x="18" y="46" class="comp-title">2. Bộ Truy Xuất Tri Thức Lai (Hybrid RAG)</text>

      <!-- Academic Hybrid Formula Card -->
      <g transform="translate(18, 66)">
        <rect width="{c3_w - 36}" height="88" rx="6" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1.2"/>
        <text x="14" y="22" class="comp-title" style="font-size:11.5px; fill:#003D9B;">CÔNG THỨC ĐIỂM SỐ TRUY XUẤT LAI (HYBRID SCORE):</text>
        <text x="14" y="48" class="math-formula">Score(q, d) = α · CosineSim(vq, vd) + (1 - α) · BM25(q, d)</text>
        <text x="14" y="72" class="comp-txt" style="font-size:11px; fill:#003D9B;">Trọng số tối ưu: α = 0.70 (Ngữ nghĩa) và (1 - α) = 0.30 (Từ khóa)</text>
      </g>

      <!-- Step 2.1: Dual Search -->
      <g transform="translate(18, 166)">
        <rect width="{c3_w - 36}" height="175" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="14" y="22" class="comp-title" style="font-size:12.5px; fill:#0F172A;">Thuật toán Tìm kiếm Song song (Dual Search):</text>
        <text x="14" y="46" class="comp-txt-bold">• Nhánh 1: Truy xuất Ngữ nghĩa Véc-tơ (Dense):</text>
        <text x="22" y="66" class="comp-txt">Vector hóa câu hỏi 768 chiều; Cosine Sim trên 62 chunks SOP.</text>
        <text x="14" y="96" class="comp-txt-bold">• Nhánh 2: Khớp Từ Khóa Chính Xác (Sparse BM25):</text>
        <text x="22" y="116" class="comp-txt">Quét từ khóa chuyên ngành: <tspan class="comp-code">hàng vỡ</tspan>, <tspan class="comp-code">cồng kềnh</tspan>, <tspan class="comp-code">đồng kiểm</tspan>.</text>
        <text x="14" y="150" class="comp-code">Thực thi song song bất đồng bộ hoàn thành trong &lt; 5ms</text>
      </g>

      <!-- Step 2.2: Re-ranking & Threshold Filter -->
      <g transform="translate(18, 353)">
        <rect width="{c3_w - 36}" height="215" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="14" y="22" class="comp-title" style="font-size:12.5px; fill:#0F172A;">Lọc Ngưỡng &amp; Tái Xếp Hạng (Re-ranking):</text>
        <text x="14" y="46" class="comp-txt-bold">• Lọc Ngưỡng Tương Đồng Tuyệt Đối:</text>
        <text x="22" y="66" class="comp-txt">Loại bỏ toàn bộ tài liệu có điểm <tspan class="comp-code">Score &lt; 0.58</tspan>.</text>
        <text x="22" y="86" class="comp-txt">Ngăn chặn triệt để hiện tượng mô hình bịa đặt (Zero Hallucination).</text>
        <text x="14" y="114" class="comp-txt-bold">• Chiến Lược Chọn Lọc Top-K:</text>
        <text x="22" y="134" class="comp-txt">Lấy tối đa 5 đoạn tri thức SOP có điểm tương đồng cao nhất.</text>
        <text x="14" y="162" class="comp-txt-bold">• Bảo Toàn Thứ Tự Trích Dẫn:</text>
        <text x="22" y="182" class="comp-txt">Giữ nguyên số thứ tự văn bản SOP và điều khoản luật định.</text>
        <text x="14" y="202" class="comp-code" style="fill:#003D9B;">Đầu ra RAG: 5 Chunks SOP tối ưu nhất đóng gói vào Prompt</text>
      </g>

      <!-- Step 2.3: Grounding Reference -->
      <g transform="translate(18, 580)">
        <rect width="{c3_w - 36}" height="175" rx="6" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1.2"/>
        <text x="14" y="22" class="comp-title" style="font-size:12.5px; fill:#003D9B;">Cơ sở Ngữ liệu Tri thức Quy chuẩn (Knowledge):</text>
        <text x="14" y="44" class="comp-txt">• 9 văn bản SOP nghiệp vụ (SOP-01 đến 09) bưu chính.</text>
        <text x="14" y="64" class="comp-txt">• Phân tách thành 62 Chunks chuẩn hóa ngữ cảnh.</text>
        <text x="14" y="88" class="comp-txt">• Bộ quy tắc quy đổi cước IATA: <tspan class="comp-code">(D×R×C)/5000</tspan> và biểu phí.</text>
        <text x="14" y="112" class="comp-txt">• Căn cứ pháp lý: Bồi thường 100% (Luật Bưu chính).</text>
        <line x1="14" y1="134" x2="{c3_w - 52}" y2="134" stroke="#BFDBFE" stroke-width="1"/>
        <text x="14" y="156" class="comp-code">Độ tin cậy: 100% khớp văn bản quy chuẩn chính thức</text>
      </g>
    </g>''')

    # -------------------------------------------------------------------------
    # KHỐI 3C: BỘ ĐIỀU PHỐI CÔNG CỤ & TỔNG HỢP NGỮ CẢNH (c3c_x)
    # -------------------------------------------------------------------------
    lines.append(f'''
    <!-- 3C: Điều phối công cụ & Lắp ráp Prompt -->
    <g transform="translate({c3c_x}, 46)">
      <rect width="{c3_w}" height="{t3_h - 66}" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="18" y="24" class="comp-stereo">«Tool Orchestration &amp; Prompt Assembly»</text>
      <text x="18" y="46" class="comp-title">3. Điều Phối Công Cụ &amp; Lắp Ráp Ngữ Cảnh</text>

      <!-- 3.1 Tool Calling Dispatcher -->
      <g transform="translate(18, 66)">
        <rect width="{c3_w - 36}" height="175" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="14" y="22" class="comp-title" style="font-size:12.5px; fill:#0F172A;">Điều Phối Công Cụ Thời Gian Thực (Tool Dispatcher):</text>
        <text x="14" y="44" class="comp-txt">• Thực thi Function Calling: Map câu hỏi sang API Microservices.</text>
        <text x="14" y="66" class="comp-txt">• <tspan class="comp-code">trackShipment(code):</tspan> Lấy trạng thái &amp; vị trí đơn hàng (:3002).</text>
        <text x="14" y="88" class="comp-txt">• <tspan class="comp-code">calculateShippingFee(d,r,c,w):</tspan> Tính cước IATA (:3003).</text>
        <text x="14" y="110" class="comp-txt">• <tspan class="comp-code">reportIncident(id, reason):</tspan> Khởi tạo hồ sơ sự cố (:3008).</text>
        <text x="14" y="132" class="comp-txt">• <tspan class="comp-code">checkStorageAgeing():</tspan> Cảnh báo hàng tồn kho &gt; 30 ngày (:3004).</text>
        <text x="14" y="156" class="comp-code" style="fill:#003D9B;">Circuit Breaker: Timeout 2000ms bảo vệ an toàn hệ thống</text>
      </g>

      <!-- 3.2 Context Sandwich Prompt Assembler (Clean Light Rows, No Rainbow Stacks) -->
      <g transform="translate(18, 253)">
        <rect width="{c3_w - 36}" height="305" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="14" y="22" class="comp-title" style="font-size:12.5px; fill:#003D9B;">Lắp Ráp Ngữ Cảnh 4 Tầng (Context Sandwich Prompt):</text>
        
        <!-- Tier 1 Sandwich Row -->
        <g transform="translate(12, 32)">
          <rect width="{c3_w - 60}" height="52" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
          <text x="10" y="18" class="comp-title" style="fill:#003D9B; font-size:11px;">TẦNG 1: CHỈ THỊ HỆ THỐNG VÀ ĐỊNH DANH (SYSTEM DIRECTIVES)</text>
          <text x="10" y="36" class="comp-txt" style="font-size:10.5px;">Định danh Trợ lý Nexus; Giọng văn khách quan; Cấm bịa đặt; Ràng buộc JSON Schema.</text>
        </g>

        <!-- Tier 2 Sandwich Row -->
        <g transform="translate(12, 92)">
          <rect width="{c3_w - 60}" height="52" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
          <text x="10" y="18" class="comp-title" style="fill:#003D9B; font-size:11px;">TẦNG 2: TRI THỨC TRÍCH DẪN TỪ VECTOR STORE (TOP-5 RETRIEVED CHUNKS)</text>
          <text x="10" y="36" class="comp-txt" style="font-size:10.5px;">5 đoạn tài liệu SOP có điểm tương đồng cao nhất; Căn cứ pháp lý &amp; điều khoản bồi thường.</text>
        </g>

        <!-- Tier 3 Sandwich Row -->
        <g transform="translate(12, 152)">
          <rect width="{c3_w - 60}" height="52" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
          <text x="10" y="18" class="comp-title" style="fill:#003D9B; font-size:11px;">TẦNG 3: DỮ LIỆU THỰC TẾ TỪ LIVE SERVICES (LIVE DTO PAYLOAD)</text>
          <text x="10" y="36" class="comp-txt" style="font-size:10.5px;">Dữ liệu vận đơn thực tế, vị trí bưu tá, cước phí được trả về từ Microservices nội bộ.</text>
        </g>

        <!-- Tier 4 Sandwich Row -->
        <g transform="translate(12, 212)">
          <rect width="{c3_w - 60}" height="52" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
          <text x="10" y="18" class="comp-title" style="fill:#003D9B; font-size:11px;">TẦNG 4: LỊCH SỬ HỘI THOẠI ĐA LƯỢT (SLIDING CONVERSATION BUFFER)</text>
          <text x="10" y="36" class="comp-txt" style="font-size:10.5px;">Mảng 6 lượt tương tác gần nhất giữa Người dùng và Trợ lý ảo để giữ trọn vẹn ngữ cảnh.</text>
        </g>

        <text x="14" y="288" class="comp-code" style="fill:#003D9B;">Cấu hình suy luận: Temperature = 0.2 (Triệt tiêu hoàn toàn ảo giác AI)</text>
      </g>

      <!-- 3.3 SSE Streaming Serializer -->
      <g transform="translate(18, 570)">
        <rect width="{c3_w - 36}" height="185" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="14" y="22" class="comp-title" style="font-size:12.5px; fill:#0F172A;">Bộ Phát Luồng Phản Hồi (SSE Stream Publisher):</text>
        <text x="14" y="44" class="comp-txt">• <tspan class="comp-txt-bold">Nhận Luồng Token từ LLM:</tspan> Tiếp nhận từng chunk ký tự từ LLM.</text>
        <text x="14" y="72" class="comp-txt">• <tspan class="comp-txt-bold">Đẩy Tức Thì Về Client:</tspan> Truyền qua SSE với độ trễ TTFT &lt; 500ms.</text>
        <text x="14" y="100" class="comp-txt">• <tspan class="comp-txt-bold">JSON DTO Packing:</tspan> Chuyển đổi Function Call sang DTO hợp lệ.</text>
        <text x="14" y="128" class="comp-txt">• <tspan class="comp-txt-bold">Đóng Ngắt An Toàn:</tspan> Phát sự kiện <tspan class="comp-code">[DONE]</tspan> khi hoàn tất phiên.</text>
        <text x="14" y="162" class="comp-code">Giao thức luồng: text/event-stream • Tối ưu hóa trải nghiệm</text>
      </g>
    </g>''')

    lines.append('  </g>')

    # =========================================================================
    # SPACIOUS CONNECTORS TIER 3 -> TIER 4 (Gap: 90px)
    # Aligned directly with Centers of Column 4A, Column 4B, and Column 4C
    # =========================================================================
    t3_to_t4_gap = 90
    arrow_3_start = t3_y + t3_h
    arrow_3_end = arrow_3_start + t3_to_t4_gap

    p_w = c3_w  # 584px

    # Left Connector: Exactly aligned with center of Column 4A
    conn_left_x = margin_x + 24 + p_w // 2
    # Center Connector: Exactly aligned with center of Column 4B
    conn_mid_x = margin_x + 24 + p_w + col_gap + p_w // 2
    # Right Connector: Exactly aligned with center of Column 4C
    conn_right_x = margin_x + 24 + (p_w + col_gap) * 2 + p_w // 2

    lines.append(f'''
  <!-- Spacious Connectors Tier 3 -> Tier 4 (Highlighting 3-way Downward Arrows) -->
  <!-- Left Arrow: Vector Retrieval Flow (To Column 4A) -->
  <line x1="{conn_left_x}" y1="{arrow_3_start}" x2="{conn_left_x}" y2="{arrow_3_end}" stroke="#003D9B" stroke-width="2.6"/>
  {draw_arrow_head(conn_left_x, arrow_3_end, direction="down", color="#003D9B", size=8)}
  {draw_flow_badge(conn_left_x - 36, arrow_3_start + t3_to_t4_gap // 2, "4a")}
  
  <g transform="translate({conn_left_x + 16}, {arrow_3_start + t3_to_t4_gap // 2 - 14})">
    <rect width="250" height="28" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
    <text x="12" y="18" class="flow-arrow-lbl">Query Vector &amp; SOP Chunks</text>
  </g>

  <!-- Center Arrow: Microservices API Call Flow (To Column 4B) -->
  <line x1="{conn_mid_x}" y1="{arrow_3_start}" x2="{conn_mid_x}" y2="{arrow_3_end}" stroke="#003D9B" stroke-width="2.6"/>
  {draw_arrow_head(conn_mid_x, arrow_3_end, direction="down", color="#003D9B", size=8)}
  {draw_flow_badge(conn_mid_x - 36, arrow_3_start + t3_to_t4_gap // 2, "4b")}
  
  <g transform="translate({conn_mid_x + 16}, {arrow_3_start + t3_to_t4_gap // 2 - 14})">
    <rect width="260" height="28" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
    <text x="12" y="18" class="flow-arrow-lbl">Live Order DTO Calls (:3000)</text>
  </g>

  <!-- Right Arrow: LLM Inference Request Flow (To Column 4C) -->
  <line x1="{conn_right_x}" y1="{arrow_3_start}" x2="{conn_right_x}" y2="{arrow_3_end}" stroke="#003D9B" stroke-width="2.6"/>
  {draw_arrow_head(conn_right_x, arrow_3_end, direction="down", color="#003D9B", size=8)}
  {draw_flow_badge(conn_right_x - 36, arrow_3_start + t3_to_t4_gap // 2, "6")}
  
  <g transform="translate({conn_right_x + 16}, {arrow_3_start + t3_to_t4_gap // 2 - 14})">
    <rect width="250" height="28" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
    <text x="12" y="18" class="flow-arrow-lbl">Context Sandwich Prompt [TLS 1.3]</text>
  </g>''')

    # =========================================================================
    # TIER 4: TẦNG DỮ LIỆU, DỊCH VỤ NGHIỆP VỤ & NỀN TẢNG LLM (y: 1640, h: 540)
    # =========================================================================
    t4_y = arrow_3_end
    t4_h = 540
    lines.append(f'''
  <!-- ================= TIER 4: DATA, SERVICES & FOUNDATION MODELS ================= -->
  <g id="Tier4_DataServicesModels" transform="translate({margin_x}, {t4_y})">
    <!-- Tier Boundary Container -->
    <rect width="{content_w}" height="{t4_h}" rx="8" fill="#F8FAFC" stroke="#003D9B" stroke-width="1.8"/>
    <!-- Clean Horizontal Header Bar -->
    <rect width="{content_w}" height="36" rx="8" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
    <text x="20" y="23" class="tier-title">TẦNG 4: LƯU TRỮ TRI THỨC, DỊCH VỤ NGHIỆP VỤ &amp; MÔ HÌNH NỀN TẢNG</text>
    <text x="{content_w - 20}" y="23" text-anchor="end" class="tier-sub">[TIER 4: KNOWLEDGE PERSISTENCE, BACKEND MICROSERVICES &amp; FOUNDATION LLMS]</text>''')

    # -------------------------------------------------------------------------
    # PHÂN VÙNG 4A: KHO TRI THỨC & DỮ LIỆU (Clean Standard Store Cards)
    # -------------------------------------------------------------------------
    lines.append(f'''
    <!-- 4A: Knowledge & Data Stores -->
    <g transform="translate(24, 46)">
      <rect width="{p_w}" height="{t4_h - 62}" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="18" y="24" class="comp-stereo">«Data Persistence &amp; Vector Stores»</text>
      <text x="18" y="46" class="comp-title">A. Kho Tri Thức &amp; Cơ Sở Dữ Liệu</text>
      
      <!-- Store 1: Vector Knowledge Cache -->
      {draw_store_box(18, 62, p_w - 36, 195, "1. Kho Véc-tơ Tri Thức (Vector Cache)", "«In-Memory Vector Cache · 768-dim»", [
          "• Cấu trúc: 62 vector embeddings chuẩn 768 chiều tương ứng 62 chunks SOP.",
          "• Tốc độ: Toàn bộ nạp sẵn vào RAM (In-Memory), độ trễ tìm kiếm < 5ms.",
          "• Thuật toán khớp: Cosine Similarity ma trận véc-tơ; Tự động giải phóng khi restart.",
          "• Nạp lại: API POST /ingest cho phép Admin cập nhật tri thức mới tức thời."
      ])}

      <!-- Store 2: SOP Document Repository -->
      {draw_store_box(18, 270, p_w - 36, 195, "2. Kho Tài Liệu Quy Chuẩn SOP Bưu Chính", "«Document Store · AST Markdown Repo»", [
          "• 9 văn bản SOP: SOP-01 Đóng gói, SOP-02 Biểu cước, SOP-04 Khiếu nại...",
          "• Định dạng: AST Markdown Header Level, giữ nguyên cấu trúc điều khoản luật.",
          "• Pháp lý: Quy chiếu trực tiếp Điều 18 & 25 Luật Bưu chính Việt Nam.",
          "• Phân đoạn: 62 chunks có độ dài trung bình 240 từ, bảo toàn ngữ cảnh."
      ])}
    </g>''')

    # -------------------------------------------------------------------------
    # PHÂN VÙNG 4B: LƯỚI DỊCH VỤ NGHIỆP VỤ LOGISTICS (Microservices Backend)
    # -------------------------------------------------------------------------
    lines.append(f'''
    <!-- 4B: Logistics Backend Microservices Mesh -->
    <g transform="translate({24 + p_w + col_gap}, 46)">
      <rect width="{p_w}" height="{t4_h - 62}" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="18" y="24" class="comp-stereo">«Domain Microservices · Node.js / Express»</text>
      <text x="18" y="46" class="comp-title">B. Lưới Dịch Vụ Nghiệp Vụ Logistics</text>

      <!-- Microservice Card 1: ShipmentService -->
      <g transform="translate(18, 62)">
        <rect width="{p_w - 36}" height="90" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="16" y="22" class="comp-stereo">«Microservice · Port :3002»</text>
        <text x="16" y="42" class="comp-title" style="font-size:13px;">ShipmentService: Vận Đơn &amp; Lộ Trình</text>
        <text x="16" y="62" class="comp-txt">• Tra cứu trạng thái kiện hàng theo mã <tspan class="comp-code">NX-XXXX</tspan>, bưu tá phát.</text>
        <text x="16" y="78" class="comp-code">API Endpoint: GET /api/v1/shipments/:code • DB: PostgreSQL</text>
      </g>

      <!-- Microservice Card 2: PricingService -->
      <g transform="translate(18, 162)">
        <rect width="{p_w - 36}" height="90" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="16" y="22" class="comp-stereo">«Microservice · Port :3003»</text>
        <text x="16" y="42" class="comp-title" style="font-size:13px;">PricingService: Cước Phí Vận Chuyển</text>
        <text x="16" y="62" class="comp-txt">• Bảng cước chuẩn IATA, công thức thể tích <tspan class="comp-code">(D×R×C)/5000</tspan>, phụ phí.</text>
        <text x="16" y="78" class="comp-code">API Endpoint: POST /api/v1/pricing/calculate • Latency &lt; 15ms</text>
      </g>

      <!-- Microservice Card 3: IncidentService -->
      <g transform="translate(18, 262)">
        <rect width="{p_w - 36}" height="90" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="16" y="22" class="comp-stereo">«Microservice · Port :3008»</text>
        <text x="16" y="42" class="comp-title" style="font-size:13px;">IncidentService: Xử Lý Khiếu Nại &amp; Sự Cố</text>
        <text x="16" y="62" class="comp-txt">• Tiếp nhận báo cáo bưu phẩm vỡ, rách bao bì; Khởi tạo hồ sơ bồi thường.</text>
        <text x="16" y="78" class="comp-code">API Endpoint: POST /api/v1/incidents/create • Gắn mã CLM</text>
      </g>

      <!-- Microservice Card 4: HubService -->
      <g transform="translate(18, 362)">
        <rect width="{p_w - 36}" height="90" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="16" y="22" class="comp-stereo">«Microservice · Port :3004»</text>
        <text x="16" y="42" class="comp-title" style="font-size:13px;">HubService: Kiểm Soát Tồn Kho Trung Chuyển</text>
        <text x="16" y="62" class="comp-txt">• Cảnh báo kiện hàng tồn kho quá 30 ngày (SOP-08); Phối hợp điều hướng.</text>
        <text x="16" y="78" class="comp-code">API Endpoint: GET /api/v1/hubs/storage-ageing • Kho trung chuyển</text>
      </g>
    </g>''')

    # -------------------------------------------------------------------------
    # PHÂN VÙNG 4C: MÔ HÌNH NỀN TẢNG ĐA TẦNG (Foundation LLM & Embedder)
    # -------------------------------------------------------------------------
    lines.append(f'''
    <!-- 4C: Foundation LLM & Inference Models -->
    <g transform="translate({24 + (p_w + col_gap)*2}, 46)">
      <rect width="{p_w}" height="{t4_h - 62}" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="18" y="24" class="comp-stereo">«External Cloud AI &amp; Local Embedder»</text>
      <text x="18" y="46" class="comp-title">C. Mô Hình Ngôn Ngữ Lớn &amp; Suy Luận</text>

      <!-- LLM 1: Primary Model (Gemini 2.0 / 1.5 Flash) -->
      <g transform="translate(18, 62)">
        <rect width="{p_w - 36}" height="120" rx="6" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1.2"/>
        <text x="16" y="22" class="comp-stereo" style="fill:#003D9B;">«Primary Cloud LLM · Google AI Studio»</text>
        <text x="16" y="42" class="comp-title" style="font-size:13px;">1. Mô Hình Suy Luận: Gemini 1.5 / 2.0 Flash</text>
        <text x="16" y="64" class="comp-txt">• Hỗ trợ Function Calling native; Sinh tham số gọi hàm chuẩn xác.</text>
        <text x="16" y="84" class="comp-txt">• Cửa sổ ngữ cảnh cực lớn (1M tokens), xử lý mượt tài liệu quy chuẩn.</text>
        <g transform="translate(16, 94)">
          <rect width="160" height="18" class="tag-rect"/>
          <text x="8" y="13" class="tag-txt">Model: gemini-1.5-flash</text>
          <rect x="170" y="0" width="140" height="18" class="tag-rect"/>
          <text x="178" y="13" class="tag-txt">Temperature = 0.2</text>
        </g>
      </g>

      <!-- LLM 2: Fallback Model (OpenAI GPT-4o-mini) -->
      <g transform="translate(18, 195)">
        <rect width="{p_w - 36}" height="120" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="16" y="22" class="comp-stereo">«Secondary Fallback LLM · OpenAI API»</text>
        <text x="16" y="42" class="comp-title" style="font-size:13px;">2. Mô Hình Dự Phòng: GPT-4o-mini</text>
        <text x="16" y="64" class="comp-txt">• Tự động chuyển tiếp khi Primary LLM gặp sự cố hoặc vượt Rate Limit.</text>
        <text x="16" y="84" class="comp-txt">• Đảm bảo độ sẵn sàng của hệ thống trợ lý ảo đạt 99.9% liên tục 24/7.</text>
        <g transform="translate(16, 94)">
          <rect width="140" height="18" class="tag-rect"/>
          <text x="8" y="13" class="tag-txt">Model: gpt-4o-mini</text>
          <rect x="150" y="0" width="180" height="18" class="tag-rect"/>
          <text x="158" y="13" class="tag-txt">Failover Circuit Breaker</text>
        </g>
      </g>

      <!-- LLM 3: Text Vectorizer (Local / Cloud Embedder) -->
      <g transform="translate(18, 328)">
        <rect width="{p_w - 36}" height="120" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="16" y="22" class="comp-stereo">«Text Embedding Model · Vectorizer»</text>
        <text x="16" y="42" class="comp-title" style="font-size:13px;">3. Vector Hóa: Text-Embedding-004</text>
        <text x="16" y="64" class="comp-txt">• Thuật toán nhúng véc-tơ chuyển đổi văn bản sang không gian 768 chiều.</text>
        <text x="16" y="84" class="comp-txt">• Tối ưu hóa cho ngữ nghĩa tiếng Việt chuyên ngành logistics &amp; bưu chính.</text>
        <g transform="translate(16, 94)">
          <rect width="180" height="18" class="tag-rect"/>
          <text x="8" y="13" class="tag-txt">text-embedding-004 (768-dim)</text>
          <rect x="190" y="0" width="160" height="18" class="tag-rect"/>
          <text x="198" y="13" class="tag-txt">Cosine Match &lt; 5ms</text>
        </g>
      </g>
    </g>''')

    lines.append('  </g>')

    # =========================================================================
    # RETURN STREAM FLOW (Tier 4 LLM / SSE Publisher back to Tier 1 Client)
    # Runs cleanly along the 50px right corridor with a clean horizontal pill
    # =========================================================================
    return_x = width - 42
    t1_return_y = t1_y + 115
    t4_return_y = t4_y + 120

    lines.append(f'''
  <!-- Return Stream Flow Line from Tier 4 (LLM/SSE) back to Tier 1 Client -->
  <path d="M {margin_x + content_w} {t4_return_y} L {return_x} {t4_return_y} L {return_x} {t1_return_y} L {margin_x + content_w} {t1_return_y}"
        fill="none" stroke="#0052CC" stroke-width="2.2" stroke-dasharray="6,4"/>
  {draw_arrow_head(margin_x + content_w, t1_return_y, direction="left", color="#0052CC", size=7)}
  {draw_flow_badge(return_x, (t4_return_y + t1_return_y) // 2 - 20, "7")}
  
  <!-- Clean Horizontal Badge on the Return Corridor (Positioned in Inter-Tier Gap 1->2) -->
  <g transform="translate({margin_x + content_w - 390}, {arrow_1_start + t1_to_t2_gap // 2 - 14})">
    <rect width="380" height="28" rx="4" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
    <text x="12" y="18" class="comp-code" style="fill:#003D9B; font-weight:700;">⑦ SSE STREAM PHẢN HỒI REALTIME (TTFT &lt; 500MS)</text>
  </g>''')

    # =========================================================================
    # FOOTER BAR & ACADEMIC METADATA BLUEPRINT (y: 2360, h: 410)
    # =========================================================================
    ft_y = 2360
    ft_h = 410
    lines.append(f'''
  <!-- ================= FOOTER: 7-STEP WORKFLOW & BLUEPRINT METADATA ================= -->
  <g id="Footer_Specification" transform="translate({margin_x}, {ft_y})">
    <!-- Outer Container -->
    <rect width="{content_w}" height="{ft_h}" rx="8" fill="#F8FAFC" stroke="#003D9B" stroke-width="1.8"/>
    
    <!-- Top Box: 7-Step Architectural Execution Sequence (Academic Flow) -->
    <g transform="translate(20, 16)">
      <rect width="{content_w - 40}" height="205" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="20" y="24" class="footer-title">CHU TRÌNH THỰC THI 7 BƯỚC CỦA HỆ THỐNG TRỢ LÝ ẢO (7-STEP INTERACTION LIFECYCLE):</text>
      
      <!-- 7 Steps Table Grid (3 Balanced Columns) -->
      <g transform="translate(20, 36)">
        <!-- Col 1: Steps 1 & 2 -->
        <g transform="translate(0, 0)">
          <text x="0" y="18" class="flow-step-title"><tspan style="fill:#003D9B; font-weight:800;">① Khởi tạo yêu cầu:</tspan> Client gửi payload qua HTTPS Ingress <tspan class="comp-code">:3009</tspan>.</text>
          <text x="0" y="38" class="flow-step-desc">Payload chứa nội dung tin nhắn, conversationId và token xác thực JWT hợp lệ.</text>

          <text x="0" y="80" class="flow-step-title"><tspan style="fill:#003D9B; font-weight:800;">② Bảo mật &amp; Phiên:</tspan> Khử PII bằng Regex, ngăn Prompt Injection.</text>
          <text x="0" y="100" class="flow-step-desc">Che giấu số điện thoại khách hàng, bóc tách thực thể và khôi phục ngữ cảnh 6 lượt.</text>
        </g>

        <!-- Col 2: Steps 3 & 4 -->
        <g transform="translate(600, 0)">
          <text x="0" y="18" class="flow-step-title"><tspan style="fill:#003D9B; font-weight:800;">③ Phân luồng NLU:</tspan> Cây quyết định định tuyến ý định (Policy / Tool / Hỗn hợp).</text>
          <text x="0" y="38" class="flow-step-desc">Tối ưu hóa tài nguyên, không gọi API Microservices dư thừa khi chỉ hỏi đáp chính sách.</text>

          <text x="0" y="80" class="flow-step-title"><tspan style="fill:#003D9B; font-weight:800;">④ Truy xuất song song:</tspan> Tìm kiếm RAG lai (Dense + Sparse) &amp; Gọi API Tool.</text>
          <text x="0" y="100" class="flow-step-desc">Lọc tài liệu theo ngưỡng Score ≥ 0.58 và lấy dữ liệu vận đơn thực tế từ cổng <tspan class="comp-code">:3000</tspan>.</text>
        </g>

        <!-- Col 3: Steps 5, 6 & 7 -->
        <g transform="translate(1200, 0)">
          <text x="0" y="18" class="flow-step-title"><tspan style="fill:#003D9B; font-weight:800;">⑤ Ghép Prompt 4 Tầng:</tspan> Context Sandwich (Directives + SOP + DTO + History).</text>
          <text x="0" y="38" class="flow-step-desc">Khóa Temperature = 0.2 triệt tiêu ảo giác, bảo đảm chuẩn xác theo văn bản quy chuẩn.</text>

          <text x="0" y="80" class="flow-step-title"><tspan style="fill:#003D9B; font-weight:800;">⑥ Suy luận AI &amp; ⑦ SSE Stream:</tspan> LLM sinh token đẩy thời gian thực về Client.</text>
          <text x="0" y="100" class="flow-step-desc">Người dùng thấy phản hồi xuất hiện tức thì (&lt; 500ms); Đóng ngắt luồng [DONE] an toàn.</text>
        </g>
      </g>
    </g>

    <!-- Bottom Box: Academic Thesis Blueprint Metadata Table -->
    <g transform="translate(20, 238)">
      <rect width="{content_w - 40}" height="152" rx="6" fill="#EFF6FF" stroke="#003D9B" stroke-width="1.3"/>
      
      <!-- Table Header -->
      <rect width="{content_w - 40}" height="32" rx="6" fill="#003D9B"/>
      <text x="20" y="21" class="hdr-meta-lbl" style="font-size:12px;">THÔNG TIN BẢN VẼ KIẾN TRÚC ĐỒ ÁN TỐT NGHIỆP (ACADEMIC THESIS SPECIFICATION - A4 PORTRAIT)</text>

      <!-- Metadata Grid: 2 Columns -->
      <g transform="translate(20, 46)">
        <!-- Col 1 -->
        <g transform="translate(0, 0)">
          <text x="0" y="20" class="footer-title">Đề Tài Tốt Nghiệp:</text>
          <text x="170" y="20" class="footer-val">HỆ THỐNG QUẢN LÝ VẬN TẢI &amp; LOGISTICS TOÀN TRÌNH (NEXUS LMS)</text>

          <text x="0" y="48" class="footer-title">Phân Hệ Thiết Kế:</text>
          <text x="170" y="48" class="footer-val">Phân hệ Trợ lý AI Đàm thoại (Chatbot Subsystem · Port :3009)</text>

          <text x="0" y="76" class="footer-title">Tiêu Chuẩn Kiến Trúc:</text>
          <text x="170" y="76" class="footer-val">ISO/IEC 42010 · 4-Tier Layered Architecture · Engineering Blueprint</text>
        </g>

        <!-- Col 2 -->
        <g transform="translate(900, 0)">
          <text x="0" y="20" class="footer-title">Thuật Toán Cốt Lõi:</text>
          <text x="170" y="20" class="footer-val">Hybrid Search (Dense Cosine + Sparse BM25) · Tool Calling Dispatcher</text>

          <text x="0" y="48" class="footer-title">Cơ Chế Phản Hồi:</text>
          <text x="170" y="48" class="footer-val">Server-Sent Events (SSE Stream) · Low Latency (TTFT &lt; 500ms)</text>

          <text x="0" y="76" class="footer-title">Mã Bản Vẽ &amp; Bản Quyền:</text>
          <text x="170" y="76" class="footer-val" style="fill:#003D9B; font-weight:800;">ARCH-LMS-CB-04A · Phiên bản v7.0 (Chuẩn Khổ A4 Dọc Đồ Án)</text>
        </g>
      </g>
    </g>
  </g>''')

    lines.append('</svg>')

    full_svg = '\n'.join(lines)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(full_svg)

    print(f"Generating Clean Academic A4-Portrait Architecture Diagram for AI Chatbot Subsystem...")
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
