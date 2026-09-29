#!/usr/bin/env python3
"""
generate-chatbot-subsystem-architecture.py
Generates the clean, high-level structural component architecture diagram for the Nexus AI Chatbot Subsystem
for Figma Page 1 (Section 1.4A) in the Nexus Logistics Management System graduation thesis.

Outputs to:
  docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-architecture-ai-chatbot-subsystem.svg

Style:
  Monochrome Technical Blueprint (Trắng - Đen - Xám chuẩn kỹ thuật)
  High-Level Architecture Overview: Concise, uncluttered, focused on structural components and topology.
  Zero explanatory paragraphs, zero redundant walls of text, zero emojis.
  Strict Figma Compatibility: 100% inline vector shapes (<polygon>, <rect>, <ellipse>, <path>), ZERO SVG <marker> tags.
"""

import xml.etree.ElementTree as ET
import os

OUTPUT_FILE = "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-architecture-ai-chatbot-subsystem.svg"

def comp_glyph(x, y):
    """Clean UML Component Glyph [=]"""
    return f'''
    <g transform="translate({x}, {y})">
      <rect x="0" y="0" width="18" height="13" rx="1.5" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <rect x="-3.5" y="2" width="5" height="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <rect x="-3.5" y="8" width="5" height="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    </g>'''

def build_architecture_svg():
    width = 3600
    height = 1750
    lines = []

    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # Double Technical Blueprint Frame
    lines.append(f'''
  <!-- Double Technical Blueprint Frame -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <rect x="20" y="20" width="{width - 40}" height="{height - 40}" fill="none" stroke="#000000" stroke-width="2.6"/>
  <rect x="32" y="32" width="{width - 64}" height="{height - 64}" fill="none" stroke="#000000" stroke-width="1.2"/>

  <style>
    text {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }}
    
    .hdr-title {{ font-size: 25px; font-weight: 800; fill: #000000; letter-spacing: -0.4px; }}
    .hdr-sub {{ font-size: 14.5px; font-weight: 500; fill: #475569; }}
    .meta-tag {{ font-size: 12px; font-weight: 700; fill: #0F172A; font-family: ui-monospace, Menlo, monospace; }}
    
    .tier-header {{ font-size: 14px; font-weight: 800; fill: #000000; letter-spacing: 0.8px; text-transform: uppercase; }}
    .tier-tag {{ font-size: 12px; font-weight: 600; fill: #64748B; font-family: ui-monospace, monospace; }}
    
    .comp-title {{ font-size: 15px; font-weight: 800; fill: #000000; letter-spacing: -0.2px; }}
    .comp-sub {{ font-size: 12px; font-weight: 600; fill: #64748B; }}
    .comp-tech {{ font-size: 11px; font-weight: 700; fill: #334155; font-family: ui-monospace, Menlo, monospace; }}
    
    .bullet-item {{ font-size: 12.5px; font-weight: 500; fill: #1E293B; }}
    .bullet-bold {{ font-weight: 700; fill: #000000; }}
    .bullet-code {{ font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; font-weight: 600; fill: #0F172A; }}
    
    .bus-tag {{ font-size: 11.5px; font-weight: 700; fill: #000000; font-family: ui-monospace, Menlo, monospace; text-transform: uppercase; }}
    
    .tb-lbl {{ font-size: 10px; font-weight: 700; fill: #64748B; font-family: ui-monospace, monospace; text-transform: uppercase; }}
    .tb-val {{ font-size: 12px; font-weight: 800; fill: #000000; font-family: ui-monospace, monospace; }}
  </style>
''')

    margin_x = 70
    content_w = width - margin_x * 2  # 3460px

    # =========================================================================
    # HEADER BAR (y: 45, h: 80)
    # =========================================================================
    lines.append(f'''
  <!-- HEADER BAR -->
  <g id="HeaderBar" transform="translate({margin_x}, 45)">
    <rect width="{content_w}" height="80" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.8"/>
    
    <text x="24" y="34" class="hdr-title">HÌNH 1.4A: SƠ ĐỒ KIẾN TRÚC TỔNG QUAN PHÂN HỆ AI CHATBOT (HIGH-LEVEL COMPONENT TOPOLOGY)</text>
    <text x="24" y="58" class="hdr-sub">Kiến trúc khối tổng thể: Kênh tương tác người dùng, Cổng tiếp nhận bảo mật, Lõi suy luận nghiệp vụ, Cơ sở tri thức và Tích hợp ngoại vi</text>
    
    <!-- System Metadata Badges -->
    <g transform="translate({content_w - 680}, 22)">
      <rect width="210" height="36" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <text x="105" y="23" text-anchor="middle" class="meta-tag">SYS: NEXUS LMS</text>

      <rect x="225" y="0" width="220" height="36" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <text x="335" y="23" text-anchor="middle" class="meta-tag">PORT: 3009 (REST/SSE)</text>

      <rect x="460" y="0" width="210" height="36" rx="3" fill="#000000"/>
      <text x="565" y="23" text-anchor="middle" class="meta-tag" fill="#FFFFFF">OVERVIEW TOPOLOGY</text>
    </g>
  </g>
''')

    # =========================================================================
    # TẦNG 1: KÊNH TƯƠNG TÁC NGƯỜI DÙNG (y: 145, h: 225)
    # =========================================================================
    t1_y = 145
    t1_h = 225
    c_w = 820
    c_gap = (content_w - c_w * 4) // 3  # 60px

    lines.append(f'''
  <!-- TIER 1: CLIENT PRESENTATION CHANNELS -->
  <g id="Tier_1_Clients" transform="translate({margin_x}, {t1_y})">
    <rect width="{content_w}" height="{t1_h}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>
    <rect width="{content_w}" height="32" rx="6" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
    <text x="18" y="21" class="tier-header">TẦNG 1: KÊNH TƯƠNG TÁC NGƯỜI DÙNG (PRESENTATION &amp; CLIENT CHANNELS)</text>
    <text x="{content_w - 18}" y="21" text-anchor="end" class="tier-tag">GIAO DIỆN CLIENT • REST &amp; SERVER-SENT EVENTS</text>

    <!-- Client 1: Merchant Dashboard -->
    <g transform="translate(0, 42)">
      <rect width="{c_w}" height="170" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {c_w},0 L {c_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{c_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Merchant Web Dashboard</text>
      <text x="230" y="20" class="comp-sub">• Kênh Shop &amp; Chủ hàng</text>
      {comp_glyph(c_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Giao diện ngăn kéo (Chat Drawer):</tspan> Tích hợp góc phải màn hình quản trị Shop.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Nghiệp vụ hỗ trợ:</tspan> Tra cứu bưu gửi hàng loạt, tính cước nấc vượt, đối soát COD.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Hiển thị trực quan:</tspan> Thẻ vận đơn tương tác kèm nút hành động nhanh (Quick Reply).</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-tech">Nền tảng:</tspan> React 18 • TypeScript • Tailwind CSS • HTTP/1.1 REST Client</text>
      </g>
    </g>

    <!-- Client 2: Customer Tracking Portal -->
    <g transform="translate({c_w + c_gap}, 42)">
      <rect width="{c_w}" height="170" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {c_w},0 L {c_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{c_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Customer Tracking Portal</text>
      <text x="235" y="20" class="comp-sub">• Kênh Người nhận công khai</text>
      {comp_glyph(c_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Widget tra cứu công khai:</tspan> Tra cứu hành trình bưu kiện không cần đăng nhập.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Luồng sinh từ tức thì (SSE):</tspan> Nhận stream token dạng máy đánh chữ trực tiếp.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Bảo vệ định danh:</tspan> Tự động che số điện thoại và địa chỉ giao hàng nhạy cảm.</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-tech">Nền tảng:</tspan> Public Tracking Web • EventSource SSE Consumer</text>
      </g>
    </g>

    <!-- Client 3: Mobile Driver App -->
    <g transform="translate({(c_w + c_gap) * 2}, 42)">
      <rect width="{c_w}" height="170" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {c_w},0 L {c_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{c_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Driver Courier Mobile App</text>
      <text x="230" y="20" class="comp-sub">• Kênh Bưu tá phát hàng</text>
      {comp_glyph(c_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Trợ lý nghiệp vụ tuyến:</tspan> Tra cứu quy chuẩn phát hàng, đồng kiểm, lưu kho.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Hướng dẫn lập biên bản:</tspan> Chỉ dẫn chụp ảnh 4 góc và lập hồ sơ hàng móp vỡ.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Cảnh báo thu hộ:</tspan> Nhắc nhở hạn mức tiền COD nộp về bưu cục trung tâm.</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-tech">Nền tảng:</tspan> React Native (iOS / Android) • REST Mobile Client</text>
      </g>
    </g>

    <!-- Client 4: Admin Management Console -->
    <g transform="translate({(c_w + c_gap) * 3}, 42)">
      <rect width="{c_w}" height="170" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {c_w},0 L {c_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{c_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Operations &amp; Admin Console</text>
      <text x="245" y="20" class="comp-sub">• Kênh Điều hành &amp; CSKH</text>
      {comp_glyph(c_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Hàng đợi chuyển giao (Handover):</tspan> Tiếp nhận phiên từ AI sang nhân viên tư vấn.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Quản trị tri thức:</tspan> Kích hoạt reindex tự động khi cập nhật văn bản SOP mới.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Giám sát hệ thống:</tspan> Theo dõi độ trễ (Latency ms), tỷ lệ tìm thấy văn bản trích dẫn.</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-tech">Nền tảng:</tspan> Next.js Enterprise Portal • Quản trị nội bộ</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR 1 -> 2
    # =========================================================================
    c12_y = t1_y + t1_h
    lines.append(f'''
  <!-- BUS 1 -> 2 -->
  <g id="Bus_T1_T2">
    <line x1="180" y1="{c12_y + 20}" x2="{width - 180}" y2="{c12_y + 20}" stroke="#000000" stroke-width="1.8"/>
    
    <line x1="{margin_x + c_w // 2}" y1="{c12_y}" x2="{margin_x + c_w // 2}" y2="{c12_y + 20}" stroke="#000000" stroke-width="1.4"/>
    <line x1="{margin_x + c_w + c_gap + c_w // 2}" y1="{c12_y}" x2="{margin_x + c_w + c_gap + c_w // 2}" y2="{c12_y + 20}" stroke="#000000" stroke-width="1.4"/>
    <line x1="{margin_x + (c_w + c_gap) * 2 + c_w // 2}" y1="{c12_y}" x2="{margin_x + (c_w + c_gap) * 2 + c_w // 2}" y2="{c12_y + 20}" stroke="#000000" stroke-width="1.4"/>
    <line x1="{margin_x + (c_w + c_gap) * 3 + c_w // 2}" y1="{c12_y}" x2="{margin_x + (c_w + c_gap) * 3 + c_w // 2}" y2="{c12_y + 20}" stroke="#000000" stroke-width="1.4"/>

    <line x1="{width // 2}" y1="{c12_y + 20}" x2="{width // 2}" y2="{c12_y + 40}" stroke="#000000" stroke-width="1.8"/>
    <polygon points="{width // 2 - 6},{c12_y + 34} {width // 2},{c12_y + 42} {width // 2 + 6},{c12_y + 34}" fill="#000000"/>

    <rect x="{width // 2 - 200}" y="{c12_y + 9}" width="400" height="22" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <text x="{width // 2}" y="{c12_y + 24}" text-anchor="middle" class="bus-tag">HTTP/1.1 REST • SERVER-SENT EVENTS (SSE) • TCP :3009</text>
  </g>
''')

    # =========================================================================
    # TẦNG 2: CỔNG TIẾP NHẬN & BẢO MẬT (y: 410, h: 225)
    # =========================================================================
    t2_y = 410
    t2_h = 225
    b2_w = (content_w - 40) // 3  # 1140px

    lines.append(f'''
  <!-- TIER 2: ADMISSION, SECURITY & SESSION -->
  <g id="Tier_2_Admission_Security" transform="translate({margin_x}, {t2_y})">
    <rect width="{content_w}" height="{t2_h}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>
    <rect width="{content_w}" height="32" rx="6" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
    <text x="18" y="21" class="tier-header">TẦNG 2: CỔNG TIẾP NHẬN, ĐIỀU KHIỂN &amp; HÀNG RÀO BẢO MẬT DỮ LIỆU</text>
    <text x="{content_w - 18}" y="21" text-anchor="end" class="tier-tag">GATEWAY &amp; CONTROLLER • PII GUARDRAIL • SESSION MANAGER</text>

    <!-- Component 2.1: ChatController -->
    <g transform="translate(0, 42)">
      <rect width="{b2_w}" height="170" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {b2_w},0 L {b2_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{b2_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Chatbot API Controller</text>
      <text x="210" y="20" class="comp-sub">• Điều phối kết nối API &amp; Stream</text>
      {comp_glyph(b2_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Cổng REST tiêu chuẩn:</tspan> <tspan class="bullet-code">POST /api/v1/chat/message</tspan> nhận DTO trả JSON hoàn chỉnh.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Cổng Stream thời gian thực:</tspan> <tspan class="bullet-code">POST /api/v1/chat/stream</tspan> đẩy SSE chunk theo token.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Cổng quản trị tri thức:</tspan> <tspan class="bullet-code">POST /api/v1/chat/ingest</tspan> kích hoạt nạp lại vector SOP.</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-tech">Cơ chế bảo vệ:</tspan> Rate Limiting 60 req/phút • Lọc tin nhắn rỗng • NestJS Controller</text>
      </g>
    </g>

    <!-- Component 2.2: PIISanitizerGuard -->
    <g transform="translate({b2_w + 20}, 42)">
      <rect width="{b2_w}" height="170" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {b2_w},0 L {b2_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{b2_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Hàng rào Bảo vệ Dữ liệu Cá nhân (PII Guardrail)</text>
      <text x="420" y="20" class="comp-sub">• NĐ 13/2023 &amp; Luật Bưu chính</text>
      {comp_glyph(b2_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Mặt nạ số điện thoại tự động:</tspan> Che 4 số giữa SĐT người nhận (<tspan class="bullet-code">098****321</tspan>).</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Phân quyền thông tin (RBAC):</tspan> Khách vãng lai chỉ xem quận/huyện, bắt buộc có mã đơn.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Chống can thiệp prompt:</tspan> Chặn các câu lệnh phá vỡ vai trò (Anti Prompt-Injection).</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-tech">Cách ly tài chính:</tspan> Không để lộ số tài khoản và thông tin đối soát COD của Shop.</text>
      </g>
    </g>

    <!-- Component 2.3: SessionMemoryManager -->
    <g transform="translate({(b2_w + 20) * 2}, 42)">
      <rect width="{b2_w}" height="170" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {b2_w},0 L {b2_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{b2_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Quản lý Phiên &amp; Ngữ cảnh Hội thoại (Session)</text>
      <text x="390" y="20" class="comp-sub">• Multi-turn Memory</text>
      {comp_glyph(b2_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Định danh phiên duy nhất:</tspan> Gắn kết mã chuỗi <tspan class="bullet-code">conv-timestamp-uuid</tspan> xuyên suốt đối thoại.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Bộ nhớ cửa sổ trượt (K=6):</tspan> Lưu giữ 6 lượt tin nhắn gần nhất để hiểu đại từ ("nó", "đơn này").</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Truy vết thực thể tự động:</tspan> Tự động ghi nhớ mã vận đơn đã nhắc để tra cứu bước tiếp.</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-tech">Vòng đời bộ nhớ:</tspan> Tự giải phóng sau 30 phút • Đo lường độ trễ xử lý (Latency ms).</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR 2 -> 3
    # =========================================================================
    c23_y = t2_y + t2_h
    lines.append(f'''
  <!-- BUS 2 -> 3 -->
  <g id="Bus_T2_T3">
    <line x1="220" y1="{c23_y + 20}" x2="{width - 220}" y2="{c23_y + 20}" stroke="#000000" stroke-width="1.8"/>
    
    <line x1="{margin_x + b2_w // 2}" y1="{c23_y}" x2="{margin_x + b2_w // 2}" y2="{c23_y + 20}" stroke="#000000" stroke-width="1.4"/>
    <line x1="{margin_x + b2_w + 20 + b2_w // 2}" y1="{c23_y}" x2="{margin_x + b2_w + 20 + b2_w // 2}" y2="{c23_y + 20}" stroke="#000000" stroke-width="1.4"/>
    <line x1="{margin_x + (b2_w + 20) * 2 + b2_w // 2}" y1="{c23_y}" x2="{margin_x + (b2_w + 20) * 2 + b2_w // 2}" y2="{c23_y + 20}" stroke="#000000" stroke-width="1.4"/>

    <line x1="{width // 2}" y1="{c23_y + 20}" x2="{width // 2}" y2="{c23_y + 40}" stroke="#000000" stroke-width="1.8"/>
    <polygon points="{width // 2 - 6},{c23_y + 34} {width // 2},{c23_y + 42} {width // 2 + 6},{c23_y + 34}" fill="#000000"/>

    <rect x="{width // 2 - 210}" y="{c23_y + 9}" width="420" height="22" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <text x="{width // 2}" y="{c23_y + 24}" text-anchor="middle" class="bus-tag">DỮ LIỆU ĐÃ KHỬ PII &amp; ĐIỀU PHỐI NỘI BỘ (IN-PROCESS IO)</text>
  </g>
''')

    # =========================================================================
    # TẦNG 3: LÕI SUY LUẬN & ĐIỀU PHỐI NGHIỆP VỤ (y: 675, h: 225)
    # =========================================================================
    t3_y = 675
    t3_h = 225
    b3_w = (content_w - 40) // 3  # 1140px

    lines.append(f'''
  <!-- TIER 3: REASONING & ORCHESTRATION CORE -->
  <g id="Tier_3_Cognitive_Core" transform="translate({margin_x}, {t3_y})">
    <rect width="{content_w}" height="{t3_h}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>
    <rect width="{content_w}" height="32" rx="6" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
    <text x="18" y="21" class="tier-header">TẦNG 3: LÕI SUY LUẬN, PHÂN TÍCH Ý ĐỊNH &amp; ĐIỀU PHỐI TÁC VỤ (ORCHESTRATION CORE)</text>
    <text x="{content_w - 18}" y="21" text-anchor="end" class="tier-tag">INTENT CLASSIFIER • LOGISTICS TOOLS ENGINE • PROMPT BUILDER</text>

    <!-- Component 3.1: QueryProcessor & IntentRouter -->
    <g transform="translate(0, 42)">
      <rect width="{b3_w}" height="170" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {b3_w},0 L {b3_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{b3_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Bộ Phân tích Câu hỏi &amp; Rẽ nhánh Ý định</text>
      <text x="325" y="20" class="comp-sub">• Intent Router</text>
      {comp_glyph(b3_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Chuẩn hóa tiếng Việt:</tspan> Khử dấu, đưa về dạng chuẩn NFD, bóc tách đại từ.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Trích xuất thực thể (Regex):</tspan> Tự bắt mã vận đơn (<tspan class="bullet-code">NX-XXXX</tspan>, <tspan class="bullet-code">101XXXXXXXXX</tspan>), cân nặng, kích thước.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Phân loại 5 nhóm ý định:</tspan> Tra cứu đơn, Báo giá cước, Sự cố đền bù, Lưu kho, Hỏi chính sách.</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-tech">Cơ chế rẽ nhánh kép (Dual-Engine):</tspan> Câu hỏi hành động ➔ Gọi Live Tools; Câu hỏi lý thuyết ➔ RAG.</text>
      </g>
    </g>

    <!-- Component 3.2: LogisticsToolsService -->
    <g transform="translate({b3_w + 20}, 42)">
      <rect width="{b3_w}" height="170" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {b3_w},0 L {b3_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{b3_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Dịch vụ Công cụ Logistics (Tools Service)</text>
      <text x="310" y="20" class="comp-sub">• Live Action Caller</text>
      {comp_glyph(b3_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Công cụ Tra cứu đơn (trackShipment):</tspan> Lấy hành trình thực tế, bưu tá giao, mốc giờ.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Công cụ Tính cước (calculateFee):</tspan> Quy đổi thể tích IATA (<tspan class="bullet-code">D×R×C/5000</tspan>), tính cước nấc vượt.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Công cụ Sự cố &amp; Lưu kho:</tspan> Khởi tạo vé bồi thường <tspan class="bullet-code">CLM</tspan>, kiểm tra quá hạn Điều 18 &amp; 28.</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-tech">Công cụ Chuyển tiếp (handoverToAgent):</tspan> Bắn cờ khẩn cấp đưa khách vào hàng đợi tổng đài viên.</text>
      </g>
    </g>

    <!-- Component 3.3: InContextPromptBuilder -->
    <g transform="translate({(b3_w + 20) * 2}, 42)">
      <rect width="{b3_w}" height="170" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {b3_w},0 L {b3_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{b3_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Bộ Lắp ráp Ngữ cảnh Đa tầng (Prompt Assembler)</text>
      <text x="380" y="20" class="comp-sub">• 4 Context Layers</text>
      {comp_glyph(b3_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Tầng 1 - Định danh hệ thống:</tspan> Thiết lập vai trò Trợ lý AI Logistics Nexus trung thực, chuẩn xác.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Tầng 2 - Đoạn trích tri thức RAG:</tspan> Đính kèm Top-5 đoạn trích SOP có trích dẫn điều khoản.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Tầng 3 - Dữ liệu động từ Tools:</tspan> Ghép kết quả trả về từ API đơn hàng / bảng giá thời gian thực.</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-tech">Tầng 4 - Lịch sử hội thoại:</tspan> Nạp 6 lượt tin nhắn gần nhất • Khóa tham số Temperature = 0.2.</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR 3 -> BOTTOM PILLARS (SPLIT BUS)
    # =========================================================================
    c34_y = t3_y + t3_h
    lines.append(f'''
  <!-- SPLIT BUS 3 -> 4 & 5 -->
  <g id="Bus_T3_Bottom">
    <line x1="180" y1="{c34_y + 22}" x2="{width - 180}" y2="{c34_y + 22}" stroke="#000000" stroke-width="1.8"/>
    
    <!-- Connectors down from Tier 3 -->
    <line x1="{margin_x + b3_w // 2}" y1="{c34_y}" x2="{margin_x + b3_w // 2}" y2="{c34_y + 22}" stroke="#000000" stroke-width="1.4"/>
    <line x1="{margin_x + b3_w + 20 + b3_w // 2}" y1="{c34_y}" x2="{margin_x + b3_w + 20 + b3_w // 2}" y2="{c34_y + 22}" stroke="#000000" stroke-width="1.4"/>
    <line x1="{margin_x + (b3_w + 20) * 2 + b3_w // 2}" y1="{c34_y}" x2="{margin_x + (b3_w + 20) * 2 + b3_w // 2}" y2="{c34_y + 22}" stroke="#000000" stroke-width="1.4"/>

    <!-- Left Drop to Tier 4 (Knowledge Base) -->
    <line x1="{margin_x + 850}" y1="{c34_y + 22}" x2="{margin_x + 850}" y2="{c34_y + 44}" stroke="#000000" stroke-width="1.8"/>
    <polygon points="{margin_x + 844},{c34_y + 38} {margin_x + 850},{c34_y + 46} {margin_x + 856},{c34_y + 38}" fill="#000000"/>
    <rect x="{margin_x + 630}" y="{c34_y + 11}" width="440" height="22" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <text x="{margin_x + 850}" y="{c34_y + 26}" text-anchor="middle" class="bus-tag">TRUY VẤN VÉC-TƠ TRI THỨC (SEMANTIC VECTOR RETRIEVAL)</text>

    <!-- Right Drop to Tier 5 (Microservices & LLMs) -->
    <line x1="{margin_x + 2580}" y1="{c34_y + 22}" x2="{margin_x + 2580}" y2="{c34_y + 44}" stroke="#000000" stroke-width="1.8"/>
    <polygon points="{margin_x + 2574},{c34_y + 38} {margin_x + 2580},{c34_y + 46} {margin_x + 2586},{c34_y + 38}" fill="#000000"/>
    <rect x="{margin_x + 2360}" y="{c34_y + 11}" width="440" height="22" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <text x="{margin_x + 2580}" y="{c34_y + 26}" text-anchor="middle" class="bus-tag">GỌI MICROSERVICES NỘI BỘ &amp; CỔNG KẾT NỐI MÔ HÌNH AI</text>
  </g>
''')

    # =========================================================================
    # TẦNG 4 & 5: SONG SONG HAI KHỐI DƯỚI (y: 945, h: 295)
    # =========================================================================
    p_y = 945
    p_h = 295
    p_w = (content_w - 40) // 2  # 1710px
    sub_w = (p_w - 30) // 2       # 840px

    lines.append(f'''
  <!-- BOTTOM TIER 4: KNOWLEDGE BASE & VECTOR REPOSITORY (LEFT PILLAR) -->
  <g id="Tier_4_Knowledge_Base" transform="translate({margin_x}, {p_y})">
    <rect width="{p_w}" height="{p_h}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>
    <rect width="{p_w}" height="32" rx="6" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
    <text x="18" y="21" class="tier-header">TẦNG 4: CƠ SỞ TRI THỨC BƯU CHÍNH &amp; KHO CHỈ MỤC VÉC-TƠ (KNOWLEDGE BASE &amp; VECTOR STORE)</text>

    <!-- Sub-block 4.1: Markdown SOP Documents -->
    <g transform="translate(15, 42)">
      <rect width="{sub_w}" height="235" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {sub_w},0 L {sub_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{sub_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Tài liệu Quy trình Chuẩn (9 SOPs)</text>
      <text x="260" y="20" class="comp-sub">• docs/knowledge-base/</text>
      {comp_glyph(sub_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">SOP Đóng gói &amp; Hàng dễ vỡ:</tspan> Quy cách bọc xốp bóng khí 3 lớp, dán tem cảnh báo.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">SOP Biểu cước &amp; Phụ phí:</tspan> Bảng giá tiêu chuẩn, cước vùng xa Metro, cước IATA.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">SOP Khiếu nại &amp; Bồi thường:</tspan> Hạn mức tối đa 100% khai giá hoặc 4x cước bưu phẩm.</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-bold">SOP Lưu kho &amp; Xử lý vô chủ:</tspan> Áp dụng chặt chẽ Điều 18 &amp; 28 Luật Bưu chính 2010.</text>
        <text x="0" y="104" class="bullet-item">• <tspan class="bullet-bold">Kỹ thuật phân đoạn AST:</tspan> Cắt theo Heading Markdown, cửa sổ 250 từ, gối đầu 40 từ.</text>
        <text x="0" y="126" class="bullet-item">• <tspan class="bullet-tech">Quy mô corpus:</tspan> Toàn bộ 9 văn bản SOP được chia thành đúng <tspan class="bullet-bold">62 Chunks tri thức</tspan>.</text>
      </g>
    </g>

    <!-- Sub-block 4.2: Vector Store Repository -->
    <g transform="translate({sub_w + 30}, 42)">
      <rect width="{sub_w}" height="235" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {sub_w},0 L {sub_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{sub_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Kho Chỉ mục Véc-tơ &amp; Tìm kiếm Lai</text>
      <text x="270" y="20" class="comp-sub">• In-Memory Vector Store</text>
      {comp_glyph(sub_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Tệp lưu trữ vật lý:</tspan> <tspan class="bullet-code">vector-index.json</tspan> lưu trữ 62 vector embeddings đa chiều.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Bộ đệm RAM tốc độ cao:</tspan> Tải sẵn vector vào RAM, tính tích vô hướng Dot-Product &lt; 5ms.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Công thức tìm kiếm lai:</tspan> Điểm = <tspan class="bullet-bold">0.70 × CosineSim + 0.35 × Khớp từ điển Logistics</tspan>.</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-bold">Từ điển chuyên ngành:</tspan> Tự động mở rộng từ đồng nghĩa: hỏng, móp, vỡ, đền bù, lưu kho.</text>
        <text x="0" y="104" class="bullet-item">• <tspan class="bullet-bold">Lọc ngưỡng phù hợp:</tspan> Cắt bỏ kết quả &lt; 0.58, lấy Top K=5 đoạn trích có điểm cao nhất.</text>
        <text x="0" y="126" class="bullet-item">• <tspan class="bullet-tech">Tối ưu ngữ cảnh:</tspan> Giới hạn tối đa 2 chunks từ cùng một SOP để tránh tràn context.</text>
      </g>
    </g>
  </g>

  <!-- BOTTOM TIER 5: INFRASTRUCTURE INTEGRATIONS (RIGHT PILLAR) -->
  <g id="Tier_5_Downstream_Mesh" transform="translate({margin_x + p_w + 40}, {p_y})">
    <rect width="{p_w}" height="{p_h}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>
    <rect width="{p_w}" height="32" rx="6" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
    <text x="18" y="21" class="tier-header">TẦNG 5: TÍCH HỢP NGOẠI VI - LƯỚI MICROSERVICES &amp; CỔNG KẾT NỐI AI</text>

    <!-- Sub-block 5.1: Microservices Mesh -->
    <g transform="translate(15, 42)">
      <rect width="{sub_w}" height="235" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {sub_w},0 L {sub_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{sub_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Lưới Microservices Nghiệp vụ Nội bộ</text>
      <text x="270" y="20" class="comp-sub">• REST Mesh via Gateway :3000</text>
      {comp_glyph(sub_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Shipment Service (:3002):</tspan> Cung cấp thông tin vận đơn, trạng thái bưu kiện, bưu tá.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Pricing Service (:3003):</tspan> Bảng cước dịch vụ Chuẩn / Hỏa tốc, phụ phí liên tỉnh.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Incident Service (:3008):</tspan> Mở hồ sơ bồi thường, quản lý biên bản bất thường CLM.</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-bold">Hub Service (:3004):</tspan> Kiểm tra thời gian lưu kho bưu phẩm tại các trung tâm SOC.</text>
        <text x="0" y="104" class="bullet-item">• <tspan class="bullet-bold">Notification Service (:3012):</tspan> Bắn thông báo đẩy tức thời tới ứng dụng Bưu tá.</text>
        <text x="0" y="126" class="bullet-item">• <tspan class="bullet-tech">Chịu lỗi:</tspan> Circuit Breaker timeout 2000ms, cơ chế phòng vệ khi dịch vụ sập.</text>
      </g>
    </g>

    <!-- Sub-block 5.2: LLM Providers & Adapters -->
    <g transform="translate({sub_w + 30}, 42)">
      <rect width="{sub_w}" height="235" rx="4" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <path d="M 0,0 L {sub_w},0 L {sub_w},30 L 0,30 Z" fill="#FFFFFF"/>
      <line x1="0" y1="30" x2="{sub_w}" y2="30" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="14" y="20" class="comp-title">Cổng Kết nối Mô hình AI (LLM Adapters)</text>
      <text x="290" y="20" class="comp-sub">• Gemini / OpenAI / Offline Hash</text>
      {comp_glyph(sub_w - 26, 8)}

      <g transform="translate(14, 46)">
        <text x="0" y="16" class="bullet-item">• <tspan class="bullet-bold">Mô hình chính (Priority 1):</tspan> Google Gemini 3.6 Flash &amp; gemini-embedding-001.</text>
        <text x="0" y="38" class="bullet-item">• <tspan class="bullet-bold">Mô hình dự phòng (Priority 2):</tspan> OpenAI GPT-4o-mini &amp; text-embedding-3-small.</text>
        <text x="0" y="60" class="bullet-item">• <tspan class="bullet-bold">Chế độ ngoại tuyến (Priority 3):</tspan> Thuật toán băm chuỗi nội bộ sinh vector 768 chiều.</text>
        <text x="0" y="82" class="bullet-item">• <tspan class="bullet-bold">Khóa nhiệt độ suy luận:</tspan> Cố định <tspan class="bullet-bold">Temperature = 0.2</tspan> triệt tiêu hiện tượng bịa đặt số liệu.</text>
        <text x="0" y="104" class="bullet-item">• <tspan class="bullet-bold">Độ trễ xử lý (p95):</tspan> Phản hồi REST 280ms - 450ms; Token đầu tiên SSE &lt; 50ms.</text>
        <text x="0" y="126" class="bullet-item">• <tspan class="bullet-tech">Độ tin cậy:</tspan> Tự động chuyển đổi giữa 3 providers đảm bảo hệ thống luôn sẵn sàng 99.9%.</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # FORMAL ENGINEERING TITLE BLOCK (y: 1260 to 1360 or bottom)
    # =========================================================================
    tb_w = 900
    tb_h = 95
    tb_x = width - margin_x - tb_w
    tb_y = height - margin_x - tb_h + 30

    lines.append(f'''
  <!-- FORMAL TECHNICAL TITLE BLOCK -->
  <g id="Technical_Title_Block" transform="translate({tb_x}, {tb_y})">
    <rect width="{tb_w}" height="{tb_h}" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    
    <line x1="0" y1="32" x2="{tb_w}" y2="32" stroke="#000000" stroke-width="1"/>
    <line x1="0" y1="64" x2="{tb_w}" y2="64" stroke="#000000" stroke-width="1"/>
    <line x1="490" y1="0" x2="490" y2="{tb_h}" stroke="#000000" stroke-width="1"/>
    <line x1="695" y1="32" x2="695" y2="{tb_h}" stroke="#000000" stroke-width="1"/>

    <!-- Row 1 -->
    <text x="14" y="15" class="tb-lbl">ĐỒ ÁN TỐT NGHIỆP KỸ SƯ CÔNG NGHỆ THÔNG TIN</text>
    <text x="14" y="27" class="tb-val">HỆ THỐNG QUẢN LÝ VẬN TẢI &amp; LOGISTICS TOÀN TRÌNH (NEXUS LMS)</text>
    
    <text x="504" y="15" class="tb-lbl">PHÂN HỆ / SUBSYSTEM</text>
    <text x="504" y="27" class="tb-val">services/chatbot-service (:3009)</text>

    <!-- Row 2 -->
    <text x="14" y="47" class="tb-lbl">TÊN BẢN VẼ / DRAWING TITLE</text>
    <text x="14" y="59" class="tb-val">KIẾN TRÚC TỔNG QUAN PHÂN HỆ AI CHATBOT (OVERVIEW TOPOLOGY)</text>

    <text x="504" y="47" class="tb-lbl">MÃ BẢN VẼ / DOC ID</text>
    <text x="504" y="59" class="tb-val">ARCH-LMS-CB-04A</text>

    <text x="709" y="47" class="tb-lbl">PHIÊN BẢN / REVISION</text>
    <text x="709" y="59" class="tb-val">v2.2 (OVERVIEW)</text>

    <!-- Row 3 -->
    <text x="14" y="78" class="tb-lbl">MÔ HÌNH KIẾN TRÚC / ARCHITECTURE MODEL</text>
    <text x="14" y="90" class="tb-val">5-TIER LAYERED &amp; HEXAGONAL COMPONENT TOPOLOGY</text>

    <text x="504" y="78" class="tb-lbl">NGÀY PHÁT HÀNH</text>
    <text x="504" y="90" class="tb-val">2026-09-29</text>

    <text x="709" y="78" class="tb-lbl">ĐỊNH DẠNG / TỶ LỆ</text>
    <text x="709" y="90" class="tb-val">1:1 VECTOR BLUEPRINT</text>
  </g>
''')

    # Left-hand Quick Architecture Summary Note
    lines.append(f'''
  <!-- Architectural Summary Note on Bottom Left -->
  <g id="Architecture_Notes" transform="translate({margin_x}, {tb_y})">
    <rect width="1710" height="{tb_h}" rx="3" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
    <text x="16" y="20" class="tb-lbl">NGUYÊN LÝ VẬN HÀNH KIẾN TRÚC CỐT LÕI (ARCHITECTURE SUMMARY):</text>
    <text x="16" y="40" class="bullet-item">1. <tspan class="bullet-bold">Phân tách rõ ràng hai luồng:</tspan> Luồng hỏi chính sách đi qua Chỉ mục Véc-tơ SOP (RAG); Luồng hỏi đơn hàng kích hoạt Live Tools gọi Microservices.</text>
    <text x="16" y="60" class="bullet-item">2. <tspan class="bullet-bold">Bảo vệ dữ liệu nghiêm ngặt:</tspan> 100% dữ liệu đi qua Hàng rào PII Sanitizer trước khi nạp vào Lõi suy luận, đảm bảo tính hợp pháp và an toàn thông tin.</text>
    <text x="16" y="80" class="bullet-item">3. <tspan class="bullet-bold">Dự phòng ba cấp độ (Triple Fallback):</tspan> Ưu tiên Gemini Flash ➔ Dự phòng OpenAI GPT-4o-mini ➔ Chế độ băm Offline khi mất kết nối mạng bên ngoài.</text>
  </g>
''')

    lines.append('</svg>')
    return '\n'.join(lines)

def main():
    print(f"Generating Clean High-Level AI Chatbot Architecture Overview Diagram for Figma Page 1...")
    svg_content = build_architecture_svg()

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(svg_content)

    print(f"Successfully generated: {OUTPUT_FILE}")
    print(f"File size: {os.path.getsize(OUTPUT_FILE):,} bytes")

    # Validate XML parsing
    try:
        ET.fromstring(svg_content)
        print("SVG XML Validation: PASSED (Well-formed XML)")
    except Exception as e:
        print(f"SVG XML Validation ERROR: {e}")
        raise

if __name__ == "__main__":
    main()
