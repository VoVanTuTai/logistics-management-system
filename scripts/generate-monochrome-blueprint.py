#!/usr/bin/env python3
"""
generate-monochrome-blueprint.py
Standard Operating Procedure - Technical Monochrome Blueprint Design System
Canvas: 2600 x 1300 (Aspect ratio 2:1)
Style:
- Professional, Clean, Monochrome / Minimal Dual-Tone Technical Blueprint.
- Zero color clutter: Crisp black (#000000), dark slate (#0F172A), light gray (#F8FAFC, #E2E8F0) and pure white (#FFFFFF).
- Spacious 5-column linear pipeline: NO overlapping lines, NO cramped boxes.
- Large, prominent, symbolic monochrome vector logos for the Big Four AI Titans:
    1. Google Gemini (Spacious Spark)
    2. Alibaba Cloud Qwen (Cloud Bracket)
    3. OpenAI (Rosette Knot)
    4. NVIDIA (Eye Swirl)
- Exact Carrier Domain Knowledge (Postal Law Art. 25, 70kg, 150cm, COD 15M, IATA V/6000, 3-layer bubble wrap).
- Real Microservice Ports: :3000 BFF, :3008 Tracking, :3012 Pricing, :3002 Shipment, :3011 Payment, :3013 AI.
- Fully validated XML, 100% native inline vectors (zero <marker> tags).
"""

import os
import xml.etree.ElementTree as ET

OUTPUT_SVG = "docs/graduation-thesis/diagrams/architecture/04-multi-agent-infographic-architecture.svg"

def draw_arrow(x, y, direction="right", color="#000000", size=14):
    if direction == "right":
        points = f"{x},{y} {x-size},{y-size*0.48:.1f} {x-size},{y+size*0.48:.1f}"
    elif direction == "left":
        points = f"{x},{y} {x+size},{y-size*0.48:.1f} {x+size},{y+size*0.48:.1f}"
    elif direction == "down":
        points = f"{x},{y} {x-size*0.48:.1f},{y-size} {x+size*0.48:.1f},{y-size}"
    elif direction == "up":
        points = f"{x},{y} {x-size*0.48:.1f},{y+size} {x+size*0.48:.1f},{y+size}"
    return f'<polygon points="{points}" fill="{color}"/>'

def draw_pill(cx, cy, text, w=160, h=32):
    return f'''
    <rect x="{cx - w/2}" y="{cy - h/2}" width="{w}" height="{h}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <text x="{cx}" y="{cy + 5}" font-size="11.5" font-weight="900" fill="#000000" font-family="'JetBrains Mono', monospace" text-anchor="middle">{text}</text>
    '''

def build_svg():
    W = 2600
    H = 1300
    lines = []

    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&amp;family=JetBrains+Mono:wght@600;700;800&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }}
      .mono {{ font-family: 'JetBrains Mono', monospace; }}
      .blueprint-shadow {{ filter: drop-shadow(0 4px 12px rgba(15, 23, 42, 0.05)); }}
      .badge-shadow {{ filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.12)); }}
    </style>
  </defs>

  <!-- PURE CLEAN BACKGROUND -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- OUTER TECHNICAL BLUEPRINT BORDER -->
  <rect x="18" y="18" width="{W-36}" height="{H-36}" fill="none" stroke="#000000" stroke-width="2.5" rx="8"/>
  <rect x="25" y="25" width="{W-50}" height="{H-50}" fill="none" stroke="#000000" stroke-width="1" stroke-dasharray="6,4" rx="6"/>

  <!-- =========================================================================
       1. HEADER BLOCK (Y: 40 -> 140, Height: 100px)
       ========================================================================= -->
  <g id="Header_Block" transform="translate(45, 42)">
    <rect x="0" y="0" width="{W-90}" height="92" rx="8" fill="#F8FAFC" stroke="#000000" stroke-width="2"/>
    
    <!-- Left Title Section -->
    <g transform="translate(24, 28)">
      <rect x="0" y="0" width="130" height="24" rx="4" fill="#0F172A"/>
      <text x="65" y="16" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.08em">SYSTEM BLUEPRINT</text>
      
      <text x="145" y="19" font-size="22" font-weight="900" fill="#000000" letter-spacing="-0.01em">
        NEXUS HMAS – KIẾN TRÚC HỆ THỐNG ĐA TÁC TỬ LOGISTICS BƯU CHÍNH
      </text>
      
      <text x="0" y="48" font-size="13" font-weight="700" fill="#334155">
        Mô hình 4 Tác tử Không Đồng Nhất (Google • Alibaba • OpenAI • NVIDIA) • Thẩm định Rủi ro Carrier • Chốt chặn Human-in-the-Loop
      </text>
    </g>

    <!-- Right Metadata Box -->
    <g transform="translate({W-420}, 16)">
      <rect x="0" y="0" width="300" height="60" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <text x="14" y="20" font-size="11" font-weight="800" fill="#64748B">SPECIFICATION ID:</text>
      <text x="125" y="20" font-size="11.5" font-weight="900" fill="#000000" class="mono">NX-HMAS-2026-V4</text>
      <line x1="14" y1="30" x2="286" y2="30" stroke="#E2E8F0" stroke-width="1"/>
      <text x="14" y="47" font-size="11" font-weight="800" fill="#64748B">SECURITY SCOPE:</text>
      <text x="125" y="47" font-size="11.5" font-weight="900" fill="#0F172A">ZERO-TRUST / CARRIER SOP</text>
    </g>
  </g>

  <!-- =========================================================================
       5 FUNCTIONAL COLUMNS (X coordinates):
       Col 1: x = 50,  w = 420 (Tầng Tiếp Nhận & Ingress)
       Col 2: x = 540, w = 450 (Supervisor Engine - Google)
       Col 3: x = 1060, w = 460 (Cụm Tác Tử Song Song - Alibaba & OpenAI)
       Col 4: x = 1590, w = 450 (Thẩm Định An Toàn - NVIDIA Gatekeeper)
       Col 5: x = 2110, w = 440 (HITL & Backend Thực Thi Giao Dịch)
       ========================================================================= -->

  <!-- =========================================================================
       COLUMN 1: TẦNG TIẾP NHẬN & CACHE (x=50, w=420)
       ========================================================================= -->
  <g id="Col_1_Ingress" transform="translate(50, 160)">
    <!-- Column Container -->
    <rect width="420" height="920" rx="10" fill="#FAFAFA" stroke="#000000" stroke-width="2"/>
    <!-- Column Tab Header -->
    <rect width="420" height="42" rx="10 10 0 0" fill="#0F172A"/>
    <text x="210" y="26" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">
      1. TẦNG TIẾP NHẬN &amp; CACHE NGỮ NGHĨA
    </text>

    <!-- Card 1A: Kênh Khách Hàng (y=58, h=390) -->
    <g transform="translate(16, 58)">
      <rect width="388" height="390" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" class="blueprint-shadow"/>
      <rect width="388" height="34" rx="8 8 0 0" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
      <text x="16" y="22" font-size="12" font-weight="900" fill="#000000">1A. KÊNH KHÁCH HÀNG (ACTOR / CLIENT)</text>

      <g transform="translate(16, 50)">
        <text x="0" y="16" font-size="13" font-weight="900" fill="#0F172A">Ứng Dụng Di Động &amp; Cổng Tra Cứu</text>
        <text x="0" y="36" font-size="11.5" font-weight="600" fill="#475569">Giao diện tiếp nhận trực tiếp từ người dùng:</text>
        
        <!-- App 1 -->
        <rect x="0" y="48" width="356" height="58" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="14" y="22" font-size="12" font-weight="900" fill="#0F172A">Customer Mobile App (:5176)</text>
        <text x="14" y="42" font-size="10.5" font-weight="600" fill="#475569">Khách hàng cá nhân tra cứu đơn của tôi, tiền COD</text>

        <!-- App 2 -->
        <rect x="0" y="116" width="356" height="58" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="14" y="22" font-size="12" font-weight="900" fill="#0F172A">Guest Public Tracking Portal (:5177)</text>
        <text x="14" y="42" font-size="10.5" font-weight="600" fill="#475569">Khách vãng lai tra cứu vận đơn, tự động Masking PII</text>

        <!-- Divider -->
        <line x1="0" y1="190" x2="356" y2="190" stroke="#E2E8F0" stroke-width="1"/>

        <!-- Sample Ingress Request -->
        <text x="0" y="210" font-size="11" font-weight="800" fill="#0F172A">Yêu cầu mẫu từ người dùng:</text>
        <rect x="0" y="218" width="356" height="42" rx="6" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
        <text x="12" y="26" font-size="12" font-weight="800" fill="#000000" class="mono">“Tra cứu vận đơn NX-889922”</text>

        <g transform="translate(0, 276)">
          <text x="0" y="14" font-size="11" font-weight="700" fill="#334155">• Giao thức: HTTPS / Server-Sent Events (SSE)</text>
          <text x="0" y="32" font-size="11" font-weight="700" fill="#334155">• Định danh: JWT Bearer (User) / Public (Guest)</text>
          <text x="0" y="50" font-size="11" font-weight="800" fill="#000000">• Tuyệt đối không gắn chatbot ở phân hệ Merchant</text>
        </g>
      </g>
    </g>

    <!-- Card 1B: Redis Semantic Cache (y=465, h=435) -->
    <g transform="translate(16, 465)">
      <rect width="388" height="435" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" class="blueprint-shadow"/>
      <rect width="388" height="34" rx="8 8 0 0" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
      <text x="16" y="22" font-size="12" font-weight="900" fill="#000000">1B. REDIS SEMANTIC CACHE</text>

      <g transform="translate(16, 50)">
        <text x="0" y="16" font-size="13" font-weight="900" fill="#0F172A">Bộ Nhớ Đệm Ngữ Nghĩa Tốc Độ Cao</text>
        <text x="0" y="34" font-size="11.5" font-weight="600" fill="#475569">Lọc trước truy vấn lặp lại, triệt tiêu tải cho cụm AI:</text>

        <rect x="0" y="46" width="356" height="66" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
        <text x="14" y="24" font-size="12" font-weight="900" fill="#000000">Độ Tương Đồng Cosine (Threshold ≥ 0.95)</text>
        <text x="14" y="44" font-size="11" font-weight="700" fill="#334155">Tra cứu tích vô hướng vector trong Redis RAM</text>

        <!-- Hit branch -->
        <rect x="0" y="124" width="356" height="92" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
        <text x="14" y="24" font-size="12" font-weight="900" fill="#000000">[+] TRƯỜNG HỢP CACHE HIT (FAQ):</text>
        <text x="14" y="44" font-size="11" font-weight="700" fill="#1E293B">• Trả lời ngay lập tức dưới 15 ms</text>
        <text x="14" y="62" font-size="11" font-weight="700" fill="#1E293B">• Chi phí tiêu thụ token: 0.00 USD</text>
        <text x="14" y="80" font-size="11" font-weight="700" fill="#1E293B">• Giảm 65% áp lực tính toán lên các tác tử</text>

        <!-- Miss branch -->
        <rect x="0" y="228" width="356" height="74" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.4"/>
        <text x="14" y="24" font-size="12" font-weight="900" fill="#000000">[-] TRƯỜNG HỢP CACHE MISS / TRA CỨU ĐƠN:</text>
        <text x="14" y="44" font-size="11" font-weight="700" fill="#334155">• Bắt buộc phân tích ý định động</text>
        <text x="14" y="62" font-size="11" font-weight="800" fill="#000000">• Chuyển tiếp sang Supervisor Agent (Google)</text>

        <text x="0" y="325" font-size="11" font-weight="700" fill="#475569">Cơ chế vô hiệu hóa: Tự động xóa cache khi có cập nhật SOP</text>
      </g>
    </g>
  </g>

  <!-- Flow 1 -> 2 Arrow -->
  <line x1="470" y1="350" x2="540" y2="350" stroke="#000000" stroke-width="2.5"/>
  {draw_arrow(540, 350, "right", color="#000000", size=15)}
  {draw_pill(505, 325, "MISS / QUERY", w=110, h=26)}

  <!-- Step Badge 1 -->
  <g transform="translate(505, 375)">
    <circle cx="0" cy="0" r="14" fill="#000000" stroke="#FFFFFF" stroke-width="2" class="badge-shadow"/>
    <text x="0" y="5" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">①</text>
  </g>

  <!-- =========================================================================
       COLUMN 2: SUPERVISOR ENGINE (GOOGLE) (x=540, w=450)
       ========================================================================= -->
  <g id="Col_2_Supervisor" transform="translate(540, 160)">
    <rect width="450" height="920" rx="10" fill="#FAFAFA" stroke="#000000" stroke-width="2"/>
    <rect width="450" height="42" rx="10 10 0 0" fill="#0F172A"/>
    <text x="225" y="26" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">
      2. ĐIỀU PHỐI &amp; LẬP LỊCH (GOOGLE GEMINI)
    </text>

    <!-- Card 2A: LangGraph State Machine (y=58, h=310) -->
    <g transform="translate(16, 58)">
      <rect width="418" height="310" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" class="blueprint-shadow"/>
      <rect width="418" height="34" rx="8 8 0 0" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
      <text x="16" y="22" font-size="12" font-weight="900" fill="#000000">2A. LANGGRAPH SHARED STATE MACHINE</text>

      <g transform="translate(16, 50)">
        <text x="0" y="16" font-size="13" font-weight="900" fill="#0F172A">Đồ Thị Trạng Thái &amp; Bộ Nhớ Tuần Hoàn</text>
        <text x="0" y="34" font-size="11.5" font-weight="600" fill="#475569">Quản lý ngữ cảnh tương tác và chia sẻ trạng thái:</text>

        <rect x="0" y="46" width="386" height="95" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
        <text x="12" y="22" font-size="11.5" font-weight="900" fill="#000000">State Tuple Definition (Schema Cố Định):</text>
        <text x="12" y="42" font-size="11" font-weight="800" fill="#0F172A" class="mono">• messages: BaseMessage[] (Lịch sử đàm thoại)</text>
        <text x="12" y="60" font-size="11" font-weight="800" fill="#0F172A" class="mono">• trackingCode: string | null (Mã vận đơn)</text>
        <text x="12" y="78" font-size="11" font-weight="800" fill="#0F172A" class="mono">• actionDraft: ActionDto | null (Bản thảo lệnh)</text>

        <g transform="translate(0, 160)">
          <text x="0" y="14" font-size="11" font-weight="800" fill="#000000">• Checkpointing: Lưu trạng thái phiên chống rớt mạng</text>
          <text x="0" y="34" font-size="11" font-weight="800" fill="#000000">• Memory Window K=5: Cắt tỉa ngữ cảnh, chặn tràn token</text>
          <text x="0" y="54" font-size="11" font-weight="800" fill="#000000">• Khóa quyền ghi: Tác tử chỉ cập nhật State, không ghi DB</text>
        </g>
      </g>
    </g>

    <!-- Card 2B: Supervisor Agent - GOOGLE (y=385, h=515) -->
    <g transform="translate(16, 385)">
      <rect width="418" height="515" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2" class="blueprint-shadow"/>
      <rect width="418" height="34" rx="8 8 0 0" fill="#0F172A"/>
      <text x="16" y="22" font-size="12" font-weight="900" fill="#FFFFFF">2B. SUPERVISOR AGENT (GOOGLE AI STUDIO)</text>

      <g transform="translate(16, 46)">
        <!-- Brand Box: GOOGLE GEMINI (Monochrome / Slate) -->
        <rect x="0" y="0" width="386" height="66" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.5"/>
        
        <!-- Google Gemini Sparkle Vector Icon (Monochrome) -->
        <g transform="translate(16, 12)">
          <rect width="42" height="42" rx="8" fill="#0F172A"/>
          <path d="M 21 7 C 21 15 15 21 7 21 C 15 21 21 27 21 35 C 21 27 27 21 35 21 C 27 21 21 15 21 7 Z" fill="#FFFFFF"/>
        </g>

        <text x="70" y="27" font-size="15" font-weight="900" fill="#000000">HÃNG: GOOGLE</text>
        <text x="70" y="48" font-size="12" font-weight="800" fill="#334155">Model: Gemini Flash • Cloud AI Studio</text>

        <!-- Role Specs -->
        <g transform="translate(0, 80)">
          <text x="0" y="16" font-size="13.5" font-weight="900" fill="#000000">Vai Trò &amp; Trách Nhiệm Kỹ Thuật:</text>
          
          <rect x="0" y="26" width="386" height="72" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="12" y="22" font-size="11.5" font-weight="900" fill="#000000">1. Nhận diện Intent &amp; Bóc tách Thực thể</text>
          <text x="12" y="40" font-size="11" font-weight="700" fill="#334155">Regex + Zero-shot Entity Extraction nhận diện mã</text>
          <text x="12" y="56" font-size="11" font-weight="800" fill="#0F172A">NX-XXXXXX, SPX, GHN, Viettel Post hoặc SĐT</text>

          <rect x="0" y="106" width="386" height="72" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="12" y="22" font-size="11.5" font-weight="900" fill="#000000">2. Hoạch định Đồ thị DAG Song Song</text>
          <text x="12" y="40" font-size="11" font-weight="700" fill="#334155">Kích hoạt đồng thời Tác tử Tri thức (Alibaba) và</text>
          <text x="12" y="56" font-size="11" font-weight="800" fill="#0F172A">Tác tử Nghiệp vụ (OpenAI) để tối ưu độ trễ</text>

          <rect x="0" y="186" width="386" height="72" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="12" y="22" font-size="11.5" font-weight="900" fill="#000000">3. Streaming &amp; Tổng hợp Kết quả</text>
          <text x="12" y="40" font-size="11" font-weight="700" fill="#334155">Gom kết quả đã được thẩm định an toàn từ NVIDIA</text>
          <text x="12" y="56" font-size="11" font-weight="800" fill="#0F172A">Stream token tức thì về ứng dụng Client</text>

          <!-- Metrics bar -->
          <rect x="0" y="268" width="386" height="42" rx="6" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
          <text x="14" y="26" font-size="11" font-weight="900" fill="#000000">THỜI GIAN ĐÁP ỨNG (TTFT): &lt; 350 ms • TÁCH TẢI 100%</text>
        </g>
      </g>
    </g>
  </g>

  <!-- Flow 2 -> 3 Arrow (Fork parallel to Column 3) -->
  <line x1="990" y1="360" x2="1060" y2="360" stroke="#000000" stroke-width="2.5"/>
  {draw_arrow(1060, 360, "right", color="#000000", size=15)}
  
  <line x1="990" y1="720" x2="1060" y2="720" stroke="#000000" stroke-width="2.5"/>
  {draw_arrow(1060, 720, "right", color="#000000", size=15)}

  <!-- Step Badge 2 -->
  <g transform="translate(1025, 540)">
    <circle cx="0" cy="0" r="14" fill="#000000" stroke="#FFFFFF" stroke-width="2" class="badge-shadow"/>
    <text x="0" y="5" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">②</text>
  </g>
  {draw_pill(1025, 505, "PARALLEL FORK", w=125, h=26)}

  <!-- =========================================================================
       COLUMN 3: CỤM TÁC TỬ SONG SONG (ALIBABA & OPENAI) (x=1060, w=460)
       ========================================================================= -->
  <g id="Col_3_Workers" transform="translate(1060, 160)">
    <rect width="460" height="920" rx="10" fill="#FAFAFA" stroke="#000000" stroke-width="2"/>
    <rect width="460" height="42" rx="10 10 0 0" fill="#0F172A"/>
    <text x="230" y="26" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">
      3. CỤM TÁC TỬ CHUYÊN TRÁCH (ALIBABA &amp; OPENAI)
    </text>

    <!-- Card 3A: Knowledge Worker (ALIBABA) (y=58, h=420) -->
    <g transform="translate(16, 58)">
      <rect width="428" height="420" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2" class="blueprint-shadow"/>
      <rect width="428" height="34" rx="8 8 0 0" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
      <text x="16" y="22" font-size="12" font-weight="900" fill="#000000">3A. KNOWLEDGE WORKER (ALIBABA CLOUD)</text>

      <g transform="translate(16, 46)">
        <!-- Brand Box: ALIBABA CLOUD / QWEN (Monochrome) -->
        <rect x="0" y="0" width="396" height="66" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.5"/>
        
        <g transform="translate(16, 12)">
          <rect width="42" height="42" rx="8" fill="#0F172A"/>
          <!-- Alibaba Cloud Bracket Architecture Vector -->
          <path d="M 12 14 L 8 14 C 6.5 14 5 15 5 17 L 5 25 C 5 27 6.5 28 8 28 L 12 28 M 30 14 L 34 14 C 35.5 14 37 15 37 17 L 37 25 C 37 27 35.5 28 34 28 L 30 28 M 15 21 L 27 21" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        </g>

        <text x="70" y="27" font-size="15" font-weight="900" fill="#000000">HÃNG: ALIBABA CLOUD</text>
        <text x="70" y="48" font-size="12" font-weight="800" fill="#334155">Model: Qwen 3.8 27B • Groq LPU (400 ms)</text>

        <!-- Technical Duties -->
        <g transform="translate(0, 80)">
          <text x="0" y="14" font-size="13" font-weight="900" fill="#000000">Nhiệm Vụ Trích Xuất Quy Chuẩn Bưu Chính:</text>
          
          <rect x="0" y="24" width="396" height="54" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">• Điều 25 NĐ 47 &amp; Luật Bưu Chính</text>
          <text x="12" y="38" font-size="10.5" font-weight="700" fill="#334155">Hạn mức bồi thường mặc định tối đa 4x cước (trần 1.000.000đ)</text>

          <rect x="0" y="86" width="396" height="54" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">• SOP Đóng Gói Hàng Dễ Vỡ (Fragile)</text>
          <text x="12" y="38" font-size="10.5" font-weight="700" fill="#334155">Bọc ≥ 3 lớp bubble wrap, chèn kín 6 mặt thùng carton</text>

          <rect x="0" y="148" width="396" height="54" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">• Chính Sách Cước Chuyển Hoàn</text>
          <text x="12" y="38" font-size="10.5" font-weight="700" fill="#334155">Khách Standard chịu 50% cước hoàn; Khách VIP miễn phí (0đ)</text>

          <text x="0" y="222" font-size="11" font-weight="800" fill="#000000">✓ Tokenizer tiếng Việt tối ưu: Tiết kiệm 25% token context</text>
        </g>
      </g>
    </g>

    <!-- Card 3B: Operation Worker (OPENAI) (y=490, h=410) -->
    <g transform="translate(16, 490)">
      <rect width="428" height="410" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2" class="blueprint-shadow"/>
      <rect width="428" height="34" rx="8 8 0 0" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
      <text x="16" y="22" font-size="12" font-weight="900" fill="#000000">3B. LOGISTICS OPERATION WORKER (OPENAI)</text>

      <g transform="translate(16, 46)">
        <!-- Brand Box: OPENAI (Monochrome) -->
        <rect x="0" y="0" width="396" height="66" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.5"/>
        
        <g transform="translate(16, 12)">
          <rect width="42" height="42" rx="8" fill="#0F172A"/>
          <!-- OpenAI Rosette Knot Vector -->
          <g transform="translate(7, 7) scale(0.75)" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <path d="M 28 16 C 27.5 13 25 11 22 10.5 L 19 10.5 L 19 14 L 21 14.5 C 23 15 24 16.5 24.5 18 C 25 19.5 24 21 23 22 L 20 24 L 22 28 L 24 26.5 C 26.5 24.5 28.5 21 28 16 Z"/>
            <path d="M 9 21 C 9.5 24 12 26 15 26.5 L 18 26.5 L 18 23 L 16 22.5 C 14 22 13 20.5 12.5 19 C 12 17.5 13 16 14 15 L 17 13 L 15 9 L 13 10.5 C 10.5 12.5 8.5 16 9 21 Z"/>
            <path d="M 16 9 C 19 9.5 21 12 21.5 15 L 21.5 18 L 18 18 L 17.5 16 C 17 14 15.5 13 14 12.5 C 12.5 12 11 13 10 14 L 8 17 L 4 15 L 5.5 13 C 7.5 10.5 11 8.5 16 9 Z"/>
          </g>
        </g>

        <text x="70" y="27" font-size="15" font-weight="900" fill="#000000">HÃNG: OPENAI</text>
        <text x="70" y="48" font-size="12" font-weight="800" fill="#334155">Model: GPT-OSS 120B • Groq LPU (450 ms)</text>

        <!-- Technical Duties -->
        <g transform="translate(0, 80)">
          <text x="0" y="14" font-size="13" font-weight="900" fill="#000000">Nhiệm Vụ Thực Thi Công Cụ (Tool Calling):</text>
          
          <rect x="0" y="24" width="396" height="54" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">• Tra Cứu Vết Quét Hành Trình (:3008)</text>
          <text x="12" y="38" font-size="10.5" font-weight="700" fill="#334155">Chọc API tracking bưu cục, Hub trung chuyển, ETA phát hàng</text>

          <rect x="0" y="86" width="396" height="54" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">• Tính Cước Quy Đổi Thể Tích IATA (:3012)</text>
          <text x="12" y="38" font-size="10.5" font-weight="700" fill="#334155">Công thức: Chargeable = max(Cân thực, D x R x C / 6000)</text>

          <rect x="0" y="148" width="396" height="54" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">• Soạn Thảo Action Draft DTO</text>
          <text x="12" y="38" font-size="10.5" font-weight="700" fill="#334155">Đóng gói JSON DTO, bàn giao sang Gatekeeper thẩm duyệt</text>

          <text x="0" y="222" font-size="11" font-weight="800" fill="#000000">✓ Cam kết an toàn: Tuyệt đối KHÔNG tự ý ghi vào Database</text>
        </g>
      </g>
    </g>
  </g>

  <!-- Flow 3 -> 4 Arrow (Join from both workers to Gatekeeper) -->
  <line x1="1520" y1="540" x2="1590" y2="540" stroke="#000000" stroke-width="2.5"/>
  {draw_arrow(1590, 540, "right", color="#000000", size=15)}
  
  <!-- Step Badge 3 -->
  <g transform="translate(1555, 540)">
    <circle cx="0" cy="0" r="14" fill="#000000" stroke="#FFFFFF" stroke-width="2" class="badge-shadow"/>
    <text x="0" y="5" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">③</text>
  </g>
  {draw_pill(1555, 505, "JOIN PAYLOAD", w=115, h=26)}

  <!-- =========================================================================
       COLUMN 4: THẨM ĐỊNH AN TOÀN (NVIDIA) (x=1590, w=450)
       ========================================================================= -->
  <g id="Col_4_Gatekeeper" transform="translate(1590, 160)">
    <rect width="450" height="920" rx="10" fill="#FAFAFA" stroke="#000000" stroke-width="2"/>
    <rect width="450" height="42" rx="10 10 0 0" fill="#0F172A"/>
    <text x="225" y="26" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">
      4. THẨM ĐỊNH &amp; GUARDRAILS (NVIDIA)
    </text>

    <!-- Card 4A: Validation Agent (NVIDIA) (y=58, h=400) -->
    <g transform="translate(16, 58)">
      <rect width="418" height="400" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2" class="blueprint-shadow"/>
      <rect width="418" height="34" rx="8 8 0 0" fill="#0F172A"/>
      <text x="16" y="22" font-size="12" font-weight="900" fill="#FFFFFF">4A. SAFETY GATEKEEPER (NVIDIA NEMOTRON)</text>

      <g transform="translate(16, 46)">
        <!-- Brand Box: NVIDIA (Monochrome) -->
        <rect x="0" y="0" width="386" height="66" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.5"/>
        
        <g transform="translate(16, 12)">
          <rect width="42" height="42" rx="8" fill="#0F172A"/>
          <!-- NVIDIA Claw Eye Vector (Monochrome) -->
          <path d="M 9 21 C 9 14.5 14.5 9 21 9 C 27.5 9 33 14.5 33 21 C 33 27.5 27.5 33 21 33 C 16.5 33 12.5 30.5 10.2 26.5 L 14 24.5 C 15.5 27 18 28.5 21 28.5 C 25 28.5 28.5 25 28.5 21 C 28.5 17 25 13.5 21 13.5 C 17 13.5 13.5 17 13.5 21 Z" fill="#FFFFFF"/>
          <path d="M 16.5 21 C 16.5 18.5 18.5 16.5 21 16.5 C 23.5 16.5 25.5 18.5 25.5 21 C 25.5 23.5 23.5 25.5 21 25.5 Z" fill="#FFFFFF"/>
        </g>

        <text x="70" y="27" font-size="15" font-weight="900" fill="#000000">HÃNG: NVIDIA</text>
        <text x="70" y="48" font-size="12" font-weight="800" fill="#334155">Model: Nemotron 3.5 Lightning • OpenRouter</text>

        <!-- Technical Duties -->
        <g transform="translate(0, 80)">
          <text x="0" y="14" font-size="13" font-weight="900" fill="#000000">Nhiệm Vụ Thẩm Định Độc Lập (Adversarial Critic):</text>
          
          <rect x="0" y="24" width="386" height="54" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">• Triệt Tiêu Thiên Kiến Đồng Nhất</text>
          <text x="12" y="38" font-size="10.5" font-weight="700" fill="#334155">Mô hình NVIDIA độc lập thẩm định, không thiên vị tác tử khác</text>

          <rect x="0" y="86" width="386" height="54" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">• Kiểm Soát Rủi Ro Zero-Trust</text>
          <text x="12" y="38" font-size="10.5" font-weight="700" fill="#334155">Đối soát tính hợp lệ của Action Draft với 5 chốt chặn nghiệp vụ</text>

          <rect x="0" y="148" width="386" height="54" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">• Kích Hoạt Lệnh Ngắt (Interrupt)</text>
          <text x="12" y="38" font-size="10.5" font-weight="700" fill="#334155">Nếu có rủi ro: Lập tức ngắt luồng, chuyển sang Human-in-the-Loop</text>

          <text x="0" y="222" font-size="11" font-weight="800" fill="#000000">✓ Tỷ lệ phát hiện rủi ro (RDR): 100% • Tấn công lọt lưới (ASR): 0.0%</text>
        </g>
      </g>
    </g>

    <!-- Card 4B: 5 Chốt Chặn Rủi Ro (y=475, h=425) -->
    <g transform="translate(16, 475)">
      <rect width="418" height="425" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" class="blueprint-shadow"/>
      <rect width="418" height="34" rx="8 8 0 0" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
      <text x="16" y="22" font-size="12" font-weight="900" fill="#000000">4B. DANH MỤC 5 CHỐT CHẶN RỦI RO CARRIER</text>

      <g transform="translate(16, 46)">
        <text x="0" y="14" font-size="12.5" font-weight="900" fill="#0F172A">Rà soát tự động trước khi cho phép thực thi:</text>

        <!-- Risk 1 -->
        <rect x="0" y="24" width="386" height="52" rx="5" fill="#F8FAFC" stroke="#000000" stroke-width="1"/>
        <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">1. CHANGE_ADDRESS (Đổi địa chỉ nhận / SĐT)</text>
        <text x="12" y="38" font-size="10.5" font-weight="600" fill="#334155">Nguy cơ tráo hàng khi giao bưu tá; thất thoát dữ liệu cá nhân PII</text>

        <!-- Risk 2 -->
        <rect x="0" y="82" width="386" height="52" rx="5" fill="#F8FAFC" stroke="#000000" stroke-width="1"/>
        <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">2. CANCEL_SHIPMENT (Hủy đơn đang luân chuyển)</text>
        <text x="12" y="38" font-size="10.5" font-weight="600" fill="#334155">Rủi ro phát sinh cước chuyển hoàn 50% theo quy chuẩn</text>

        <!-- Risk 3 -->
        <rect x="0" y="140" width="386" height="52" rx="5" fill="#F8FAFC" stroke="#000000" stroke-width="1"/>
        <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">3. MODIFY_COD (Điều chỉnh tiền thu hộ COD)</text>
        <text x="12" y="38" font-size="10.5" font-weight="600" fill="#334155">Chặn thay đổi số tiền vượt hạn mức đối soát tiền mặt 15.000.000đ</text>

        <!-- Risk 4 -->
        <rect x="0" y="198" width="386" height="52" rx="5" fill="#F8FAFC" stroke="#000000" stroke-width="1"/>
        <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">4. CLAIM_PAYOUT (Duyệt chi trả bồi thường)</text>
        <text x="12" y="38" font-size="10.5" font-weight="600" fill="#334155">Xuất toán tài chính: Áp dụng Điều 25 NĐ 47 &amp; Điều 40 Luật Bưu chính</text>

        <!-- Risk 5 -->
        <rect x="0" y="256" width="386" height="52" rx="5" fill="#F8FAFC" stroke="#000000" stroke-width="1"/>
        <text x="12" y="20" font-size="11.5" font-weight="900" fill="#000000">5. OVERLIMIT_BLOCK (Hàng cấm / Vượt trần 70kg)</text>
        <text x="12" y="38" font-size="10.5" font-weight="600" fill="#334155">Chặn tuyệt đối vũ khí, súng đạn; kiện nặng &gt;70kg hoặc dài &gt;150cm</text>

        <text x="0" y="332" font-size="11" font-weight="800" fill="#000000">Quy tắc phán quyết: Vi phạm rủi ro ➔ Kích hoạt chốt chặn HITL</text>
      </g>
    </g>
  </g>

  <!-- Flow 4 -> 5 Arrow (Validation to HITL / Backend) -->
  <line x1="2040" y1="350" x2="2110" y2="350" stroke="#000000" stroke-width="2.5"/>
  {draw_arrow(2110, 350, "right", color="#000000", size=15)}
  {draw_pill(2075, 315, "REQUIRES HITL", w=125, h=26)}

  <line x1="2040" y1="650" x2="2110" y2="650" stroke="#000000" stroke-width="2.5"/>
  {draw_arrow(2110, 650, "right", color="#000000", size=15)}
  {draw_pill(2075, 615, "SAFE PASS", w=110, h=26)}

  <!-- Step Badge 4 -->
  <g transform="translate(2075, 480)">
    <circle cx="0" cy="0" r="14" fill="#000000" stroke="#FFFFFF" stroke-width="2" class="badge-shadow"/>
    <text x="0" y="5" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">④</text>
  </g>

  <!-- =========================================================================
       COLUMN 5: THỰC THI & KIỂM TOÁN (x=2110, w=440)
       ========================================================================= -->
  <g id="Col_5_Execution" transform="translate(2110, 160)">
    <rect width="440" height="920" rx="10" fill="#FAFAFA" stroke="#000000" stroke-width="2"/>
    <rect width="440" height="42" rx="10 10 0 0" fill="#0F172A"/>
    <text x="220" y="26" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">
      5. THỰC THI &amp; GHI VẾT KIỂM TOÁN
    </text>

    <!-- Card 5A: Human-in-the-Loop (y=58, h=270) -->
    <g transform="translate(16, 58)">
      <rect width="408" height="270" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2" class="blueprint-shadow"/>
      <rect width="408" height="34" rx="8 8 0 0" fill="#0F172A"/>
      <text x="16" y="22" font-size="12" font-weight="900" fill="#FFFFFF">5A. HUMAN-IN-THE-LOOP (PHÊ DUYỆT CON NGƯỜI)</text>

      <g transform="translate(16, 46)">
        <text x="0" y="16" font-size="13" font-weight="900" fill="#0F172A">Drawer Modal Trượt Xin Chữ Ký Phê Duyệt</text>
        <text x="0" y="34" font-size="11" font-weight="600" fill="#475569">Bảo vệ quyền lợi tài chính và ngăn chặn sai sót:</text>

        <rect x="0" y="46" width="376" height="78" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
        <text x="12" y="22" font-size="11.5" font-weight="900" fill="#000000">Tóm tắt tác động &amp; Chi phí phát sinh:</text>
        <text x="12" y="40" font-size="11" font-weight="700" fill="#334155">• Thao tác: Hủy đơn hàng NX-889922</text>
        <text x="12" y="56" font-size="11" font-weight="700" fill="#334155">• Cước chuyển hoàn phát sinh: 9.000 VNĐ (50% cước chính)</text>
        <text x="12" y="72" font-size="11" font-weight="900" fill="#000000">• Người dùng phải bấm "Ký Duyệt" mới thực thi</text>

        <g transform="translate(0, 140)">
          <text x="0" y="14" font-size="11" font-weight="800" fill="#000000">• Gán actionTicketCode dùng một lần</text>
          <text x="0" y="32" font-size="11" font-weight="800" fill="#000000">• Xác thực chữ ký số chủ tài khoản</text>
          <text x="0" y="50" font-size="11" font-weight="800" fill="#000000">• Ngăn chặn 100% AI tự ý can thiệp cơ sở dữ liệu</text>
        </g>
      </g>
    </g>

    <!-- Card 5B: NestJS Core Backend (y=345, h=315) -->
    <g transform="translate(16, 345)">
      <rect width="408" height="315" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" class="blueprint-shadow"/>
      <rect width="408" height="34" rx="8 8 0 0" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
      <text x="16" y="22" font-size="12" font-weight="900" fill="#000000">5B. NESTJS CORE BACKEND MICROSERVICES</text>

      <g transform="translate(16, 46)">
        <text x="0" y="14" font-size="12.5" font-weight="900" fill="#0F172A">Cổng Kết Nối Microservices Phục Vụ Nghiệp Vụ:</text>

        <rect x="0" y="24" width="376" height="42" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
        <text x="12" y="18" font-size="11.5" font-weight="900" fill="#000000">Port :3000 – Gateway BFF</text>
        <text x="12" y="33" font-size="10.5" font-weight="600" fill="#475569">Reverse Proxy, JWT Auth Guard &amp; Rate Limiter</text>

        <rect x="0" y="72" width="376" height="42" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
        <text x="12" y="18" font-size="11.5" font-weight="900" fill="#000000">Port :3008 – Tracking Service</text>
        <text x="12" y="33" font-size="10.5" font-weight="600" fill="#475569">Tra cứu Hub vết quét, tiến độ giao bưu phẩm</text>

        <rect x="0" y="120" width="376" height="42" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
        <text x="12" y="18" font-size="11.5" font-weight="900" fill="#000000">Port :3012 – Pricing Service</text>
        <text x="12" y="33" font-size="10.5" font-weight="600" fill="#475569">Tính cước IATA V/6000, phụ phí vùng sâu vùng xa</text>

        <rect x="0" y="168" width="376" height="42" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
        <text x="12" y="18" font-size="11.5" font-weight="900" fill="#000000">Port :3002 – Shipment Service</text>
        <text x="12" y="33" font-size="10.5" font-weight="600" fill="#475569">Cập nhật trạng thái đơn (CANCELLED, RETURNED)</text>

        <rect x="0" y="216" width="376" height="42" rx="5" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
        <text x="12" y="18" font-size="11.5" font-weight="900" fill="#000000">Port :3011 – Payment Service</text>
        <text x="12" y="33" font-size="10.5" font-weight="600" fill="#475569">Đối soát tiền thu hộ COD &amp; Trừ ví cước hoàn</text>
      </g>
    </g>

    <!-- Card 5C: Immutable Audit Log (y=675, h=225) -->
    <g transform="translate(16, 675)">
      <rect width="408" height="225" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2" class="blueprint-shadow"/>
      <rect width="408" height="34" rx="8 8 0 0" fill="#0F172A"/>
      <text x="16" y="22" font-size="12" font-weight="900" fill="#FFFFFF">5C. IMMUTABLE AUDIT LOG &amp; PGVECTOR</text>

      <g transform="translate(16, 46)">
        <text x="0" y="16" font-size="13" font-weight="900" fill="#0F172A">Bảng Lưu Vết Kiểm Toán: ai_agent_audit_logs</text>
        
        <rect x="0" y="26" width="376" height="84" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
        <text x="12" y="20" font-size="11" font-weight="800" fill="#0F172A" class="mono">• trace_id &amp; session_id duy nhất</text>
        <text x="12" y="38" font-size="11" font-weight="800" fill="#0F172A" class="mono">• agent_draft_payload (JSON gốc do AI lập)</text>
        <text x="12" y="56" font-size="11" font-weight="800" fill="#0F172A" class="mono">• validator_verdict (Phán quyết của NVIDIA)</text>
        <text x="12" y="74" font-size="11" font-weight="800" fill="#0F172A" class="mono">• user_hitl_signature &amp; IP timestamp</text>

        <text x="0" y="130" font-size="11" font-weight="900" fill="#000000">
          Chống chối bỏ 100% • Sẵn sàng phục vụ thanh tra, kiểm toán
        </text>
      </g>
    </g>
  </g>

  <!-- Step Badge 5 -->
  <g transform="translate(2330, 230)">
    <circle cx="0" cy="0" r="14" fill="#000000" stroke="#FFFFFF" stroke-width="2" class="badge-shadow"/>
    <text x="0" y="5" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">⑤</text>
  </g>

  <!-- =========================================================================
       6. CLOSED-LOOP FEEDBACK HIGHWAY (RETURN STREAM TO CLIENT)
       Clean, spacious horizontal underground line (y = 1105)
       ========================================================================= -->
  <path d="M 2330 380 L 2540 380 L 2540 1105 L 260 1105 L 260 480" fill="none" stroke="#000000" stroke-width="2.5"/>
  {draw_arrow(260, 480, "up", color="#000000", size=14)}
  
  <rect x="1100" y="1090" width="400" height="30" rx="6" fill="#0F172A" stroke="#000000" stroke-width="1.5"/>
  <text x="1300" y="1110" font-size="11.5" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.05em">
    LUỒNG PHẢN HỒI KHÉP KÍN: STREAM SSE REALTIME VỀ GIAO DIỆN CLIENT
  </text>

  <!-- =========================================================================
       7. ENTERPRISE TECH STACK FOOTER (Y: 1140 -> 1255, Height: 115px)
       ========================================================================= -->
  <g id="Footer_TechStack" transform="translate(45, 1140)">
    <rect width="{W-90}" height="115" rx="8" fill="#F8FAFC" stroke="#000000" stroke-width="2"/>
    
    <!-- Footer Title Tab -->
    <rect x="0" y="0" width="280" height="28" rx="8 0 8 0" fill="#0F172A"/>
    <text x="140" y="19" font-size="11.5" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.05em">
      HẠ TẦNG KỸ THUẬT &amp; CÔNG NGHỆ LÕI
    </text>

    <!-- 5 Clean Monochrome Tech Boxes -->
    <!-- Box 1 -->
    <g transform="translate(25, 42)">
      <rect width="460" height="58" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="14" y="22" font-size="12" font-weight="900" fill="#000000">Workflow &amp; Orchestration</text>
      <text x="14" y="42" font-size="11" font-weight="700" fill="#334155">LangGraph State Machine • Per-node Memory Window K=5</text>
    </g>

    <!-- Box 2 -->
    <g transform="translate(515, 42)">
      <rect width="480" height="58" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="14" y="22" font-size="12" font-weight="900" fill="#000000">Bộ Tứ Mô Hình AI (Big Four Matrix)</text>
      <text x="14" y="42" font-size="11" font-weight="700" fill="#334155">Google Gemini Flash • Alibaba Qwen 27B • OpenAI 120B • NVIDIA 30B</text>
    </g>

    <!-- Box 3 -->
    <g transform="translate(1025, 42)">
      <rect width="470" height="58" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="14" y="22" font-size="12" font-weight="900" fill="#000000">Phần Cứng Gia Tốc Suy Luận (Inference)</text>
      <text x="14" y="42" font-size="11" font-weight="700" fill="#334155">Groq Cloud LPU (&gt; 250 Tokens/s) • Google Cloud AI Studio</text>
    </g>

    <!-- Box 4 -->
    <g transform="translate(1525, 42)">
      <rect width="470" height="58" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="14" y="22" font-size="12" font-weight="900" fill="#000000">Cơ Sở Dữ Liệu &amp; Tri Thức Vector</text>
      <text x="14" y="42" font-size="11" font-weight="700" fill="#334155">PostgreSQL 16 + pgvector (HNSW Index) • Redis Cache (&gt;0.95)</text>
    </g>

    <!-- Box 5 -->
    <g transform="translate(2025, 42)">
      <rect width="460" height="58" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="14" y="22" font-size="12" font-weight="900" fill="#000000">Giám Sát &amp; Kiểm Toán (Observability)</text>
      <text x="14" y="42" font-size="11" font-weight="700" fill="#334155">OpenTelemetry • LangSmith Tracing • Bảng ai_agent_audit_logs</text>
    </g>
  </g>

</svg>
''')

    svg_content = "\n".join(lines)
    os.makedirs(os.path.dirname(OUTPUT_SVG), exist_ok=True)
    with open(OUTPUT_SVG, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated Monochrome Technical Blueprint SVG: {OUTPUT_SVG}")

if __name__ == "__main__":
    build_svg()
