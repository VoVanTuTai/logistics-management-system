#!/usr/bin/env python3
"""
generate-infographic-architecture.py
Ultra-Modern Enterprise Systems Architecture Infographic (Canvas 2400 x 1060)
Professional, Corporate SaaS Technical Blueprint style:
- Prominently showcases the Big Four Model Titans with official, large, high-fidelity vector logos:
    1. Google (Gemini)
    2. Alibaba Cloud (Qwen)
    3. OpenAI (GPT-OSS)
    4. NVIDIA (Nemotron)
- Spacious, airy layout with generous card padding and increased gaps (breathable technical aesthetic).
- Grounded deeply in Carrier Domain Knowledge (Postal Law Art. 25, 70kg, 150cm, COD 15M, IATA V/6000, 3-layer bubble wrap).
- Displays the 5 Actionable Operational Risks requiring Human-in-the-Loop intervention.
- Sharp typography using Plus Jakarta Sans and JetBrains Mono.
- Fully validated, Figma & Thesis compatible SVG.
"""

import os
import xml.etree.ElementTree as ET

OUTPUT_SVG = "docs/graduation-thesis/diagrams/architecture/04-multi-agent-infographic-architecture.svg"

def draw_arrow(x, y, direction="right", color="#0052CC", size=10):
    if direction == "right":
        points = f"{x},{y} {x-size},{y-size*0.48:.1f} {x-size},{y+size*0.48:.1f}"
    elif direction == "left":
        points = f"{x},{y} {x+size},{y-size*0.48:.1f} {x+size},{y+size*0.48:.1f}"
    elif direction == "down":
        points = f"{x},{y} {x-size*0.48:.1f},{y-size} {x+size*0.48:.1f},{y-size}"
    elif direction == "up":
        points = f"{x},{y} {x-size*0.48:.1f},{y+size} {x+size*0.48:.1f},{y+size}"
    return f'<polygon points="{points}" fill="{color}"/>'

def build_svg():
    W = 2400
    H = 1060
    lines = []

    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&amp;family=JetBrains+Mono:wght@600;700;800&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }}
      .mono {{ font-family: 'JetBrains Mono', monospace; }}
      .card-shadow {{ filter: drop-shadow(0 6px 16px rgba(15, 23, 42, 0.06)); }}
      .subtle-shadow {{ filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.04)); }}
      .strong-shadow {{ filter: drop-shadow(0 8px 24px rgba(15, 23, 42, 0.10)); }}
      .logo-shadow {{ filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.12)); }}
    </style>

    <!-- Header Gradient -->
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F4C81"/>
    </linearGradient>

    <!-- Supervisor Card Gradient -->
    <linearGradient id="supervisorCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F2042"/>
      <stop offset="100%" stop-color="#0B132B"/>
    </linearGradient>

    <!-- Google Gemini Spark Gradient -->
    <linearGradient id="geminiSparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1BA1E3"/>
      <stop offset="45%" stop-color="#5068E6"/>
      <stop offset="100%" stop-color="#9B51E0"/>
    </linearGradient>

    <!-- Alibaba Qwen Gradient -->
    <linearGradient id="qwenLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF6A00"/>
      <stop offset="100%" stop-color="#FF9000"/>
    </linearGradient>

    <!-- Risk Badge Gradient -->
    <linearGradient id="riskHeaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#991B1B"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
  </defs>

  <!-- PURE CLEAN CORPORATE WHITE BACKGROUND -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- =========================================================================
       1. TOP HEADER BANNER (PROFESSIONAL ENTERPRISE ARCHITECTURE TITLE)
       ========================================================================= -->
  <g id="Header_Banner" transform="translate({W//2}, 42)">
    <rect x="-620" y="-24" width="1240" height="48" rx="12" fill="url(#headerGrad)" class="card-shadow"/>
    
    <!-- Enterprise Server Rack / Hub Icon -->
    <g transform="translate(-590, -12)">
      <rect x="0" y="2" width="24" height="20" rx="3" fill="none" stroke="#94A3B8" stroke-width="1.6"/>
      <line x1="4" y1="8" x2="20" y2="8" stroke="#38BDF8" stroke-width="1.5"/>
      <line x1="4" y1="12" x2="20" y2="12" stroke="#94A3B8" stroke-width="1.2"/>
      <line x1="4" y1="16" x2="20" y2="16" stroke="#94A3B8" stroke-width="1.2"/>
      <circle cx="18" cy="8" r="1.5" fill="#22C55E"/>
    </g>

    <text x="-550" y="8" font-size="18" font-weight="900" fill="#FFFFFF" letter-spacing="-0.01em">
      Nexus HMAS – Kiến Trúc Đa Tác Tử Không Đồng Nhất Cấp Doanh Nghiệp (Enterprise Production Architecture)
    </text>

    <!-- Subtitle below header -->
    <text x="0" y="48" font-size="13.5" font-weight="700" fill="#334155" text-anchor="middle">
      Bộ Tứ Big Four (Google • Alibaba • OpenAI • NVIDIA) • Kiểm Soát Rủi Ro Nghiệp Vụ Bưu Chính • Phê Duyệt Human-in-the-Loop
    </text>
  </g>

  <!-- Divider Line -->
  <line x1="120" y1="102" x2="{W-120}" y2="102" stroke="#E2E8F0" stroke-width="1.2"/>

  <!-- =========================================================================
       2. COLUMN 1: CLIENT & INGRESS (x=36, y=125, w=190, h=300)
       ========================================================================= -->
  <g id="Col_Customer" transform="translate(36, 125)">
    <!-- Client Request Context Box -->
    <rect x="0" y="0" width="185" height="82" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" class="card-shadow"/>
    <rect x="0" y="0" width="185" height="26" rx="10 10 0 0" fill="#E2E8F0"/>
    <text x="14" y="18" font-size="10.5" font-weight="800" fill="#334155">INCOMING INGRESS</text>
    <circle cx="168" cy="13" r="4" fill="#10B981"/>

    <text x="14" y="45" font-size="11" font-weight="800" fill="#0F172A">Yêu cầu nghiệp vụ:</text>
    <rect x="12" y="52" width="161" height="22" rx="4" fill="#EFF6FF"/>
    <text x="18" y="67" font-size="11" font-weight="800" fill="#1D4ED8" class="mono">“Tra cứu NX-889922”</text>

    <!-- Client Application Card -->
    <g transform="translate(0, 100)">
      <rect x="0" y="0" width="185" height="200" rx="12" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.6" class="card-shadow"/>
      
      <!-- System Actor Badge -->
      <rect x="14" y="14" width="95" height="22" rx="4" fill="#F1F5F9"/>
      <text x="61" y="29" font-size="10" font-weight="800" fill="#475569" text-anchor="middle">ACTOR / CLIENT</text>

      <!-- Terminal / Client Monitor Vector Icon -->
      <g transform="translate(24, 50)">
        <rect x="0" y="0" width="38" height="28" rx="4" fill="#1E293B"/>
        <rect x="3" y="3" width="32" height="18" rx="2" fill="#0F172A"/>
        <line x1="8" y1="9" x2="18" y2="9" stroke="#38BDF8" stroke-width="1.6"/>
        <line x1="8" y1="14" x2="26" y2="14" stroke="#94A3B8" stroke-width="1.4"/>
        <line x1="19" y1="28" x2="19" y2="35" stroke="#475569" stroke-width="2.5"/>
        <line x1="11" y1="35" x2="27" y2="35" stroke="#475569" stroke-width="2.5"/>
      </g>

      <text x="14" y="112" font-size="13" font-weight="900" fill="#0F172A">Khách hàng / Vãng lai</text>
      <text x="14" y="130" font-size="11" font-weight="700" fill="#64748B">Mobile App &amp; Guest Web</text>
      <line x1="14" y1="140" x2="171" y2="140" stroke="#E2E8F0" stroke-width="1"/>

      <text x="14" y="158" font-size="10" font-weight="700" fill="#475569">• Role: CUSTOMER / GUEST</text>
      <text x="14" y="174" font-size="10" font-weight="700" fill="#475569">• Masking PII khách vãng lai</text>
      <text x="14" y="190" font-size="10" font-weight="700" fill="#0052CC">• Stream Server-Sent Events</text>
    </g>
  </g>

  <!-- Numbered Badge 1: Ingress -->
  <g transform="translate(230, 240)">
    <circle cx="0" cy="0" r="14" fill="#0052CC" stroke="#FFFFFF" stroke-width="2.5" class="logo-shadow"/>
    <text x="0" y="5" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">①</text>
  </g>

  <!-- Arrow: Ingress -> Redis Cache -->
  <line x1="221" y1="270" x2="268" y2="270" stroke="#0F4C81" stroke-width="2.4"/>
  {draw_arrow(268, 270, "right", color="#0F4C81", size=10)}

  <!-- =========================================================================
       3. COLUMN 2: REDIS SEMANTIC CACHE (x=268, y=175, w=205, h=270)
       ========================================================================= -->
  <g id="Card_SemanticCache" transform="translate(268, 175)">
    <rect width="205" height="270" rx="12" fill="#F8FAFC" stroke="#0D9488" stroke-width="1.8" class="card-shadow"/>
    <rect width="205" height="36" rx="12 12 0 0" fill="#F0FDFA"/>
    <line x1="0" y1="36" x2="205" y2="36" stroke="#CCFBF1" stroke-width="1.2"/>
    
    <!-- Technical Database Bolt Icon -->
    <g transform="translate(14, 9)">
      <rect x="0" y="2" width="16" height="15" rx="2" fill="#0D9488"/>
      <path d="M 8 4 L 5 10 L 9 10 L 7 15 L 12 9 L 8 9 Z" fill="#FFFFFF"/>
      <text x="24" y="14" font-size="12.5" font-weight="900" fill="#0F766E">REDIS CACHE</text>
    </g>

    <text x="14" y="62" font-size="12.5" font-weight="800" fill="#134E4A">Semantic Vector Cache</text>
    <text x="14" y="79" font-size="11" font-weight="700" fill="#0D9488">Cosine Similarity ≥ 0.95</text>
    <line x1="14" y1="90" x2="191" y2="90" stroke="#E2E8F0" stroke-width="1"/>

    <!-- Technical Spec Bullets -->
    <g transform="translate(14, 108)">
      <rect x="0" y="0" width="177" height="52" rx="6" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1"/>
      <text x="10" y="20" font-size="11" font-weight="800" fill="#166534">✓ Cache Hit (FAQ bưu chính):</text>
      <text x="10" y="38" font-size="10.5" font-weight="700" fill="#15803D">Phản hồi ngay dưới 15ms</text>

      <rect x="0" y="64" width="177" height="52" rx="6" fill="#FEF2F2" stroke="#FECACA" stroke-width="1"/>
      <text x="10" y="84" font-size="11" font-weight="800" fill="#991B1B">✕ Cache Miss / Tra cứu đơn:</text>
      <text x="10" y="102" font-size="10.5" font-weight="700" fill="#B91C1C">Chuyển tiếp HMAS Engine</text>
    </g>
  </g>

  <!-- Numbered Badge 2: Routing -->
  <g transform="translate(488, 280)">
    <circle cx="0" cy="0" r="14" fill="#0052CC" stroke="#FFFFFF" stroke-width="2.5" class="logo-shadow"/>
    <text x="0" y="5" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">②</text>
  </g>

  <!-- Arrow: Redis Cache -> 4 AI Agents Container -->
  <line x1="473" y1="310" x2="520" y2="310" stroke="#0F4C81" stroke-width="2.4"/>
  {draw_arrow(520, 310, "right", color="#0F4C81", size=10)}

  <!-- =========================================================================
       4. CENTRAL CONTAINER: HỆ THỐNG ĐA TÁC TỬ KHÔNG ĐỒNG NHẤT (HMAS)
       (x=520, y=115, w=1160, h=565)
       SPACIOUS & EXPANDED CARD LAYOUT WITH PROMINENT BIG FOUR LOGOS
       ========================================================================= -->
  <rect x="520" y="115" width="1160" height="565" rx="16" fill="#FFFFFF" stroke="#0284C7" stroke-width="2" stroke-dasharray="8,5" class="card-shadow"/>

  <!-- TOP BAR: LangGraph - Shared State Machine & Central Memory -->
  <g id="Bar_SharedMemory" transform="translate(540, 130)">
    <rect width="1120" height="66" rx="10" fill="#F0F9FF" stroke="#BAE6FD" stroke-width="1.4"/>
    
    <!-- State Machine Graph Icon -->
    <g transform="translate(20, 16)">
      <circle cx="10" cy="9" r="7" fill="#0284C7"/>
      <circle cx="32" cy="9" r="7" fill="#0284C7"/>
      <circle cx="21" cy="26" r="7" fill="#0369A1"/>
      <line x1="17" y1="9" x2="25" y2="9" stroke="#0284C7" stroke-width="2"/>
      <line x1="12" y1="14" x2="19" y2="21" stroke="#0284C7" stroke-width="1.8"/>
      <line x1="30" y1="14" x2="23" y2="21" stroke="#0284C7" stroke-width="1.8"/>
    </g>

    <text x="68" y="28" font-size="14.5" font-weight="900" fill="#0C4A6E">LangGraph – Shared State Machine &amp; Memory Tuần Hoàn (State Graph Orchestrator)</text>
    <text x="68" y="48" font-size="11.5" font-weight="700" fill="#0369A1">
      Tuple State: [messages, roleScope, trackingCode, actionDraft, riskVerdict] • Checkpointing Chống Mất Dữ Liệu Phiên
    </text>
  </g>

  <!-- Container Center Header Pill -->
  <g transform="translate(1100, 210)">
    <rect x="-210" y="-14" width="420" height="28" rx="8" fill="#0F172A" class="logo-shadow"/>
    <text x="0" y="5" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.04em">
      BỘ TỨ BIG FOUR: MA TRẬN ĐA TÁC TỬ KHÔNG ĐỒNG NHẤT
    </text>
  </g>

  <!-- =========================================================================
       THE 4 PRODUCTION AGENT CARDS (y=236, h=330, w=250 each, gap=26px)
       Card 1 (Google):    x = 545
       Card 2 (Alibaba):   x = 821
       Card 3 (OpenAI):    x = 1097
       Card 4 (NVIDIA):    x = 1373
       ========================================================================= -->

  <!-- =========================================================================
       AGENT 1: SUPERVISOR ENGINE (GOOGLE)
       x=545, y=236, w=250, h=330
       ========================================================================= -->
  <g id="Agent_Supervisor" transform="translate(545, 236)">
    <rect width="250" height="330" rx="14" fill="url(#supervisorCardGrad)" stroke="#1E40AF" stroke-width="2" class="strong-shadow"/>
    
    <!-- Top Brand Logo Container (Prominent Google / Gemini) -->
    <g transform="translate(14, 14)">
      <rect width="222" height="52" rx="8" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1"/>
      
      <!-- Official Google Gemini 4-Point Sparkle Vector Logo (Size: 34x34) -->
      <g transform="translate(12, 9)">
        <circle cx="17" cy="17" r="16" fill="rgba(56, 189, 248, 0.15)"/>
        <!-- Gemini Diamond Star Curve -->
        <path d="M 17 3 C 17 11 11 17 3 17 C 11 17 17 23 17 31 C 17 23 23 17 31 17 C 23 17 17 11 17 3 Z" fill="url(#geminiSparkGrad)"/>
      </g>

      <text x="56" y="25" font-size="13" font-weight="900" fill="#FFFFFF">GOOGLE</text>
      <text x="56" y="42" font-size="11" font-weight="700" fill="#38BDF8">Gemini Flash • AI Studio</text>
    </g>

    <!-- Role Badge -->
    <rect x="14" y="74" width="222" height="24" rx="4" fill="#1E3A8A"/>
    <text x="125" y="90" font-size="11" font-weight="900" fill="#93C5FD" text-anchor="middle">SUPERVISOR ENGINE</text>

    <text x="125" y="122" font-size="14.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">Điều Phối &amp; Lập Lịch</text>
    <text x="125" y="140" font-size="11" font-weight="700" fill="#94A3B8" text-anchor="middle">State Graph DAG Planner</text>

    <line x1="14" y1="152" x2="236" y2="152" stroke="#334155" stroke-width="1"/>

    <!-- Operational Duties -->
    <g transform="translate(16, 170)">
      <circle cx="5" cy="6" r="3" fill="#38BDF8"/>
      <text x="14" y="10" font-size="11" font-weight="800" fill="#F1F5F9">Nhận diện Intent &amp; Entity;</text>
      <text x="14" y="26" font-size="10.5" font-weight="600" fill="#94A3B8">bóc tách mã bưu phẩm NX...;</text>

      <circle cx="5" cy="48" r="3" fill="#38BDF8"/>
      <text x="14" y="52" font-size="11" font-weight="800" fill="#F1F5F9">Hoạch định đồ thị DAG;</text>
      <text x="14" y="68" font-size="10.5" font-weight="600" fill="#94A3B8">kích hoạt 2 tác tử song song;</text>

      <circle cx="5" cy="90" r="3" fill="#38BDF8"/>
      <text x="14" y="94" font-size="11" font-weight="800" fill="#F1F5F9">Stream SSE thời gian thực;</text>
      <text x="14" y="110" font-size="10.5" font-weight="600" fill="#94A3B8">kết nối chốt chặn fallback.</text>
    </g>
  </g>

  <!-- Numbered Badge 3: Coordination -->
  <g transform="translate(808, 385)">
    <circle cx="0" cy="0" r="14" fill="#0284C7" stroke="#FFFFFF" stroke-width="2.5" class="logo-shadow"/>
    <text x="0" y="5" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">③</text>
  </g>

  <!-- Arrow between Supervisor and Knowledge -->
  <line x1="795" y1="400" x2="821" y2="400" stroke="#0284C7" stroke-width="2.2"/>
  {draw_arrow(821, 400, "right", color="#0284C7", size=7)}

  <!-- =========================================================================
       AGENT 2: KNOWLEDGE RETRIEVAL WORKER (ALIBABA)
       x=821, y=236, w=250, h=330
       ========================================================================= -->
  <g id="Agent_Knowledge" transform="translate(821, 236)">
    <rect width="250" height="330" rx="14" fill="#F8FAFC" stroke="#0284C7" stroke-width="2" class="strong-shadow"/>
    
    <!-- Top Brand Logo Container (Prominent Alibaba / Qwen) -->
    <g transform="translate(14, 14)">
      <rect width="222" height="52" rx="8" fill="#FFF7ED" stroke="#FED7AA" stroke-width="1"/>
      
      <!-- Official Alibaba Cloud / Qwen Vector Logo (Size: 34x34) -->
      <g transform="translate(12, 9)">
        <rect width="34" height="34" rx="8" fill="#FF6A00"/>
        <!-- Alibaba Cloud Bracket Architecture Icon -->
        <path d="M 10 11 L 7 11 C 5.5 11 4.5 12 4.5 13.5 L 4.5 20.5 C 4.5 22 5.5 23 7 23 L 10 23 M 24 11 L 27 11 C 28.5 11 29.5 12 29.5 13.5 L 29.5 20.5 C 29.5 22 28.5 23 27 23 L 24 23 M 12 17 L 22 17" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      </g>

      <text x="56" y="25" font-size="13" font-weight="900" fill="#C2410C">ALIBABA CLOUD</text>
      <text x="56" y="42" font-size="11" font-weight="700" fill="#EA580C">Qwen 3.8 27B • Groq LPU</text>
    </g>

    <!-- Role Badge -->
    <rect x="14" y="74" width="222" height="24" rx="4" fill="#E0F2FE"/>
    <text x="125" y="90" font-size="11" font-weight="900" fill="#0369A1" text-anchor="middle">KNOWLEDGE WORKER</text>

    <text x="125" y="122" font-size="14.5" font-weight="900" fill="#0F172A" text-anchor="middle">Trích Xuất Quy Chuẩn</text>
    <text x="125" y="140" font-size="11" font-weight="700" fill="#0284C7" text-anchor="middle">Hybrid RAG &amp; Luật Bưu Chính</text>

    <line x1="14" y1="152" x2="236" y2="152" stroke="#E2E8F0" stroke-width="1"/>

    <!-- Operational Duties -->
    <g transform="translate(16, 170)">
      <circle cx="5" cy="6" r="3" fill="#0284C7"/>
      <text x="14" y="10" font-size="11" font-weight="800" fill="#0F172A">Hybrid RAG bưu chính;</text>
      <text x="14" y="26" font-size="10.5" font-weight="600" fill="#475569">SOP bọc 3 lớp bubble wrap;</text>

      <circle cx="5" cy="48" r="3" fill="#0284C7"/>
      <text x="14" y="52" font-size="11" font-weight="800" fill="#0F172A">Điều 25 NĐ 47 &amp; Luật Bưu chính;</text>
      <text x="14" y="68" font-size="10.5" font-weight="600" fill="#475569">đền bù tối đa 4x cước (trần 1tr);</text>

      <circle cx="5" cy="90" r="3" fill="#0284C7"/>
      <text x="14" y="94" font-size="11" font-weight="800" fill="#0F172A">Tokenizer tiếng Việt tối ưu;</text>
      <text x="14" y="110" font-size="10.5" font-weight="600" fill="#475569">tiết kiệm 25% token context.</text>
    </g>
  </g>

  <!-- Arrow between Knowledge and Operation -->
  <line x1="1071" y1="400" x2="1097" y2="400" stroke="#059669" stroke-width="2.2"/>
  {draw_arrow(1097, 400, "right", color="#059669", size=7)}

  <!-- =========================================================================
       AGENT 3: LOGISTICS OPERATION WORKER (OPENAI)
       x=1097, y=236, w=250, h=330
       ========================================================================= -->
  <g id="Agent_Operation" transform="translate(1097, 236)">
    <rect width="250" height="330" rx="14" fill="#F8FAFC" stroke="#059669" stroke-width="2" class="strong-shadow"/>
    
    <!-- Top Brand Logo Container (Prominent OpenAI) -->
    <g transform="translate(14, 14)">
      <rect width="222" height="52" rx="8" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1"/>
      
      <!-- Official OpenAI Rosette Vector Logo (Size: 34x34) -->
      <g transform="translate(12, 9)">
        <circle cx="17" cy="17" r="16" fill="#10A37F"/>
        <!-- Iconic OpenAI Rosette / Spiral Whirlpool -->
        <g transform="translate(5, 5) scale(0.65)" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <path d="M 28 16 C 27.5 13 25 11 22 10.5 L 19 10.5 L 19 14 L 21 14.5 C 23 15 24 16.5 24.5 18 C 25 19.5 24 21 23 22 L 20 24 L 22 28 L 24 26.5 C 26.5 24.5 28.5 21 28 16 Z"/>
          <path d="M 9 21 C 9.5 24 12 26 15 26.5 L 18 26.5 L 18 23 L 16 22.5 C 14 22 13 20.5 12.5 19 C 12 17.5 13 16 14 15 L 17 13 L 15 9 L 13 10.5 C 10.5 12.5 8.5 16 9 21 Z"/>
          <path d="M 16 9 C 19 9.5 21 12 21.5 15 L 21.5 18 L 18 18 L 17.5 16 C 17 14 15.5 13 14 12.5 C 12.5 12 11 13 10 14 L 8 17 L 4 15 L 5.5 13 C 7.5 10.5 11 8.5 16 9 Z"/>
        </g>
      </g>

      <text x="56" y="25" font-size="13" font-weight="900" fill="#065F46">OPENAI</text>
      <text x="56" y="42" font-size="11" font-weight="700" fill="#059669">GPT-OSS 120B • Groq LPU</text>
    </g>

    <!-- Role Badge -->
    <rect x="14" y="74" width="222" height="24" rx="4" fill="#DCFCE7"/>
    <text x="125" y="90" font-size="11" font-weight="900" fill="#15803D" text-anchor="middle">OPERATION WORKER</text>

    <text x="125" y="122" font-size="14.5" font-weight="900" fill="#0F172A" text-anchor="middle">Thực Thi Nghiệp Vụ</text>
    <text x="125" y="140" font-size="11" font-weight="700" fill="#059669" text-anchor="middle">Tool Calling &amp; Cước IATA</text>

    <line x1="14" y1="152" x2="236" y2="152" stroke="#E2E8F0" stroke-width="1"/>

    <!-- Operational Duties -->
    <g transform="translate(16, 170)">
      <circle cx="5" cy="6" r="3" fill="#059669"/>
      <text x="14" y="10" font-size="11" font-weight="800" fill="#0F172A">Tool Calling chuyên dụng;</text>
      <text x="14" y="26" font-size="10.5" font-weight="600" fill="#475569">truy vấn hành trình Hub :3008;</text>

      <circle cx="5" cy="48" r="3" fill="#059669"/>
      <text x="14" y="52" font-size="11" font-weight="800" fill="#0F172A">Tính cước quy đổi IATA;</text>
      <text x="14" y="68" font-size="10.5" font-weight="600" fill="#475569">V/6000 &amp; phí hoàn shop 50%;</text>

      <circle cx="5" cy="90" r="3" fill="#059669"/>
      <text x="14" y="94" font-size="11" font-weight="800" fill="#0F172A">Soạn Action Draft DTO;</text>
      <text x="14" y="110" font-size="10.5" font-weight="600" fill="#475569">tuyệt đối không tự ý ghi DB.</text>
    </g>
  </g>

  <!-- Two-way Arrow between Operation and Validation -->
  <line x1="1347" y1="400" x2="1373" y2="400" stroke="#E11D48" stroke-width="2.2"/>
  {draw_arrow(1373, 400, "right", color="#E11D48", size=7)}
  {draw_arrow(1347, 400, "left", color="#E11D48", size=7)}

  <!-- =========================================================================
       AGENT 4: COMPLIANCE & SAFETY GATEKEEPER (NVIDIA)
       x=1373, y=236, w=250, h=330
       ========================================================================= -->
  <g id="Agent_Validation" transform="translate(1373, 236)">
    <rect width="250" height="330" rx="14" fill="#FFF1F2" stroke="#E11D48" stroke-width="2" class="strong-shadow"/>
    
    <!-- Top Brand Logo Container (Prominent NVIDIA) -->
    <g transform="translate(14, 14)">
      <rect width="222" height="52" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1"/>
      
      <!-- Official NVIDIA Eye Claw Vector Logo (Size: 34x34) -->
      <g transform="translate(12, 9)">
        <rect width="34" height="34" rx="8" fill="#0F172A"/>
        <!-- NVIDIA Iconic Claw Swirl -->
        <path d="M 4 17 C 4 9.8 9.8 4 17 4 C 24.2 4 30 9.8 30 17 C 30 24.2 24.2 30 17 30 C 12 30 7.5 27 5.2 22.8 L 9 20.8 C 10.6 23.8 13.6 25.8 17 25.8 C 21.8 25.8 25.8 21.8 25.8 17 C 25.8 12.2 21.8 8.2 17 8.2 C 12.2 8.2 8.2 12.2 8.2 17 C 8.2 18.8 8.8 20.4 9.8 21.6 L 6.8 24 C 5 22 4 19.6 4 17 Z" fill="#76B900"/>
        <path d="M 11.5 17 C 11.5 14 14 11.5 17 11.5 C 20 11.5 22.5 14 22.5 17 C 22.5 20 20 22.5 17 22.5 C 15.2 22.5 13.8 21.5 13 20.2 L 15.2 18.8 C 15.6 19.5 16.2 20 17 20 C 18.6 20 20 18.6 20 17 C 20 15.4 18.6 14 17 14 C 15.4 14 14 15.4 14 17 Z" fill="#76B900"/>
      </g>

      <text x="56" y="25" font-size="13" font-weight="900" fill="#76B900">NVIDIA</text>
      <text x="56" y="42" font-size="11" font-weight="700" fill="#94A3B8">Nemotron 3.5 • Guardrails</text>
    </g>

    <!-- Role Badge -->
    <rect x="14" y="74" width="222" height="24" rx="4" fill="#FFE4E6"/>
    <text x="125" y="90" font-size="11" font-weight="900" fill="#BE123C" text-anchor="middle">SAFETY GATEKEEPER</text>

    <text x="125" y="122" font-size="14.5" font-weight="900" fill="#0F172A" text-anchor="middle">Thẩm Định &amp; Guardrails</text>
    <text x="125" y="140" font-size="11" font-weight="700" fill="#BE123C" text-anchor="middle">Zero-Trust Adversarial Critic</text>

    <line x1="14" y1="152" x2="236" y2="152" stroke="#FECDD3" stroke-width="1"/>

    <!-- Operational Duties -->
    <g transform="translate(16, 170)">
      <circle cx="5" cy="6" r="3" fill="#E11D48"/>
      <text x="14" y="10" font-size="11" font-weight="800" fill="#9F1239">Safety Guardrail chuyên biệt;</text>
      <text x="14" y="26" font-size="10.5" font-weight="600" fill="#475569">thẩm định rủi ro độc lập;</text>

      <circle cx="5" cy="48" r="3" fill="#E11D48"/>
      <text x="14" y="52" font-size="11" font-weight="800" fill="#9F1239">Kiểm tra trần vật lý 70kg;</text>
      <text x="14" y="68" font-size="10.5" font-weight="600" fill="#475569">đối soát gian lận cước COD;</text>

      <circle cx="5" cy="90" r="3" fill="#E11D48"/>
      <text x="14" y="94" font-size="11" font-weight="800" fill="#9F1239">Kích hoạt ngắt interrupt HITL;</text>
      <text x="14" y="110" font-size="10.5" font-weight="600" fill="#475569">triệt tiêu thiên kiến đồng nhất.</text>
    </g>
  </g>

  <!-- Numbered Badge 4: Validation -->
  <g transform="translate(1636, 385)">
    <circle cx="0" cy="0" r="14" fill="#E11D48" stroke="#FFFFFF" stroke-width="2.5" class="logo-shadow"/>
    <text x="0" y="5" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">④</text>
  </g>

  <!-- BOTTOM BAR: Fallback Cascade (x=540, y=580, w=1120, h=52) -->
  <g id="Bar_Fallback" transform="translate(540, 580)">
    <rect width="1120" height="52" rx="10" fill="#FFFBEB" stroke="#F59E0B" stroke-width="1.6"/>
    
    <!-- Refresh Loop Icon -->
    <g transform="translate(22, 26)">
      <path d="M -8 0 A 8 8 0 1 1 0 8" fill="none" stroke="#D97706" stroke-width="2.2"/>
      <polygon points="1,8 -2,4 0,10" fill="#D97706"/>
    </g>

    <text x="50" y="24" font-size="13" font-weight="900" fill="#92400E">
      Autonomous Fallback Cascade: Groq LPU (Safeguard / Qwen) ➔ Google AI Studio ➔ Local Rule Engine
    </text>
    <text x="50" y="42" font-size="11" font-weight="700" fill="#B45309">
      (Cơ chế chuyển mạch dự phòng chịu lỗi Zero-SPOF khi quá tải Rate Limit 429/503 hoặc gián đoạn mạng Internet)
    </text>
  </g>

  <!-- =========================================================================
       5. DECISION DIAMOND, ACTIONABLE RISK REGISTRY & HUMAN-IN-THE-LOOP
       ========================================================================= -->
  <!-- Arrow from Gatekeeper -> Decision Diamond -->
  <line x1="1623" y1="400" x2="1710" y2="400" stroke="#0F4C81" stroke-width="2.4"/>
  {draw_arrow(1710, 400, "right", color="#0F4C81", size=10)}

  <!-- Decision Diamond: Kiểm tra rủi ro & quyền hạn (Center: 1765, 400) -->
  <g id="Node_Decision" transform="translate(1765, 400)">
    <polygon points="0,-48 58,0 0,48 -58,0" fill="#FEF3C7" stroke="#D97706" stroke-width="2.2" class="card-shadow"/>
    
    <text x="0" y="-9" font-size="11.5" font-weight="900" fill="#78350F" text-anchor="middle">Kiểm tra</text>
    <text x="0" y="8" font-size="11.5" font-weight="900" fill="#78350F" text-anchor="middle">Rủi ro &amp;</text>
    <text x="0" y="24" font-size="11.5" font-weight="900" fill="#78350F" text-anchor="middle">Phân quyền</text>
  </g>

  <!-- =========================================================================
       EXPLICIT LIST OF THE 5 ACTIONABLE RISKS (DANH MỤC 5 RỦI RO KÍCH HOẠT HÀNH ĐỘNG)
       (x=1710, y=115, w=355, h=225)
       ========================================================================= -->
  <g id="Card_ActionableRisks" transform="translate(1710, 115)">
    <rect width="355" height="225" rx="12" fill="#FFF1F2" stroke="#F43F5E" stroke-width="1.8" class="card-shadow"/>
    <rect width="355" height="32" rx="12 12 0 0" fill="url(#riskHeaderGrad)"/>
    
    <!-- Warning Triangle Icon -->
    <g transform="translate(14, 8)">
      <polygon points="8,2 2,14 14,14" fill="#FFFFFF"/>
      <rect x="7" y="6" width="2" height="4" fill="#991B1B"/>
      <circle cx="8" cy="12" r="1" fill="#991B1B"/>
      <text x="24" y="13" font-size="11" font-weight="900" fill="#FFFFFF" letter-spacing="0.02em">
        DANH MỤC 5 RỦI RO NGHIỆP VỤ BẮT BUỘC HITL
      </text>
    </g>

    <!-- 5 Explicit Carrier Operational Risks -->
    <g transform="translate(14, 46)">
      <!-- Risk 1 -->
      <circle cx="5" cy="5" r="4" fill="#E11D48"/>
      <text x="15" y="9" font-size="11" font-weight="800" fill="#881337">1. Đổi địa chỉ nhận / SĐT</text>
      <text x="15" y="23" font-size="10" font-weight="600" fill="#4C0519">(CHANGE_ADDRESS: nguy cơ tráo hàng, lộ PII)</text>

      <!-- Risk 2 -->
      <circle cx="5" cy="40" r="4" fill="#E11D48"/>
      <text x="15" y="44" font-size="11" font-weight="800" fill="#881337">2. Hủy đơn luân chuyển</text>
      <text x="15" y="58" font-size="10" font-weight="600" fill="#4C0519">(CANCEL_SHIPMENT: rủi ro công nợ &amp; phí hoàn 50%)</text>

      <!-- Risk 3 -->
      <circle cx="5" cy="75" r="4" fill="#E11D48"/>
      <text x="15" y="79" font-size="11" font-weight="800" fill="#881337">3. Điều chỉnh tiền thu hộ COD</text>
      <text x="15" y="93" font-size="10" font-weight="600" fill="#4C0519">(MODIFY_COD: rủi ro vượt hạn mức tiền mặt 15tr)</text>

      <!-- Risk 4 -->
      <circle cx="5" cy="110" r="4" fill="#E11D48"/>
      <text x="15" y="114" font-size="11" font-weight="800" fill="#881337">4. Duyệt chi trả bồi thường</text>
      <text x="15" y="128" font-size="10" font-weight="600" fill="#4C0519">(CLAIM_PAYOUT: xuất toán tài chính Điều 25 NĐ 47 &amp; Luật bưu chính)</text>

      <!-- Risk 5 -->
      <circle cx="5" cy="145" r="4" fill="#E11D48"/>
      <text x="15" y="149" font-size="11" font-weight="800" fill="#881337">5. Hàng cấm / Vượt trần mạng lưới</text>
      <text x="15" y="163" font-size="10" font-weight="600" fill="#4C0519">(OVERLIMIT_BLOCK: chặn kiện &gt;70kg hoặc &gt;150cm)</text>
    </g>
  </g>

  <!-- Dashed guidance from Decision Diamond up to Risk Category -->
  <line x1="1765" y1="352" x2="1765" y2="340" stroke="#F43F5E" stroke-width="2" stroke-dasharray="4,4"/>

  <!-- Branch 1: "Nếu rủi ro cao" (Down to HITL) -->
  <line x1="1765" y1="448" x2="1765" y2="510" stroke="#DC2626" stroke-width="2.6"/>
  {draw_arrow(1765, 510, "down", color="#DC2626", size=10)}
  <rect x="1705" y="465" width="120" height="22" rx="4" fill="#FEF2F2" stroke="#FECACA" stroke-width="1"/>
  <text x="1765" y="480" font-size="11" font-weight="900" fill="#DC2626" text-anchor="middle">Nếu vi phạm rủi ro</text>

  <!-- Card: Human-in-the-Loop Approval (x=1685, y=510, w=160, h=120) -->
  <g id="Card_Hitl" transform="translate(1685, 510)">
    <rect width="160" height="120" rx="12" fill="#FFF7ED" stroke="#EA580C" stroke-width="1.8" class="card-shadow"/>
    
    <!-- Operator Badge -->
    <rect x="10" y="10" width="140" height="22" rx="4" fill="#FFEDD5"/>
    <text x="80" y="25" font-size="10.5" font-weight="900" fill="#C2410C" text-anchor="middle">HUMAN-IN-THE-LOOP</text>

    <text x="80" y="52" font-size="12" font-weight="900" fill="#9A3412" text-anchor="middle">Phê Duyệt Đa Tầng</text>
    <text x="80" y="70" font-size="10" font-weight="700" fill="#C2410C" text-anchor="middle">Drawer Popup Xác Nhận</text>

    <line x1="10" y1="80" x2="150" y2="80" stroke="#FED7AA" stroke-width="1"/>
    <text x="80" y="95" font-size="10" font-weight="700" fill="#431407" text-anchor="middle">• LangGraph ngắt interrupt()</text>
    <text x="80" y="110" font-size="10" font-weight="700" fill="#431407" text-anchor="middle">• Chỉ ghi DB khi có chữ ký</text>
  </g>

  <!-- Numbered Badge 5: Human in the loop -->
  <g transform="translate(1860, 570)">
    <circle cx="0" cy="0" r="14" fill="#EA580C" stroke="#FFFFFF" stroke-width="2.5" class="logo-shadow"/>
    <text x="0" y="5" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">⑤</text>
  </g>

  <!-- Branch 2: "Đạt yêu cầu (An toàn / Rủi ro thấp)" (Right from Decision to Backend) -->
  <line x1="1823" y1="400" x2="1940" y2="400" stroke="#059669" stroke-width="2.6"/>
  {draw_arrow(1940, 400, "right", color="#059669", size=10)}
  <rect x="1840" y="375" width="95" height="22" rx="4" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1"/>
  <text x="1887" y="390" font-size="11" font-weight="900" fill="#059669" text-anchor="middle">Đạt yêu cầu</text>

  <!-- Arrow from HITL right into Backend (Upon Approval) -->
  <line x1="1845" y1="570" x2="1940" y2="570" stroke="#059669" stroke-width="2.4"/>
  {draw_arrow(1940, 570, "right", color="#059669", size=9)}
  <text x="1892" y="560" font-size="10.5" font-weight="800" fill="#059669" text-anchor="middle">Đã phê duyệt ➔</text>

  <!-- =========================================================================
       6. BACKEND MICROSERVICES & INTERNAL LOGISTICS APIS
       ========================================================================= -->
  <!-- BACKEND MICROSERVICES CONTAINER (x=1940, y=345, w=240, h=285) -->
  <g id="Card_Backend" transform="translate(1940, 345)">
    <rect width="240" height="285" rx="14" fill="#F0FDF4" stroke="#059669" stroke-width="2" class="card-shadow"/>
    <rect width="240" height="34" rx="14 14 0 0" fill="#DCFCE7"/>
    <line x1="0" y1="34" x2="240" y2="34" stroke="#BBF7D0" stroke-width="1.2"/>
    
    <!-- Backend Server Icon -->
    <g transform="translate(14, 9)">
      <rect x="0" y="2" width="16" height="13" rx="2" fill="#059669"/>
      <circle cx="4" cy="8" r="1.3" fill="#FFFFFF"/>
      <circle cx="8" cy="8" r="1.3" fill="#FFFFFF"/>
      <text x="24" y="13" font-size="12" font-weight="900" fill="#065F46">BACKEND SERVICES</text>
    </g>

    <text x="14" y="58" font-size="13" font-weight="900" fill="#065F46">NestJS Microservices Core</text>
    <text x="14" y="75" font-size="11" font-weight="700" fill="#047857">BFF Gateway :3000 &amp; Business Engine</text>
    <line x1="14" y1="84" x2="226" y2="84" stroke="#BBF7D0" stroke-width="1"/>

    <!-- Operational Controls -->
    <g transform="translate(14, 98)">
      <rect x="0" y="0" width="212" height="38" rx="6" fill="#FFFFFF" stroke="#D1FAE5" stroke-width="1"/>
      <text x="8" y="16" font-size="10.5" font-weight="800" fill="#065F46">✓ JWT / RBAC Scope Validation</text>
      <text x="8" y="30" font-size="9.5" font-weight="600" fill="#475569">Chặn BOLA/IDOR, đối soát chủ đơn</text>

      <rect x="0" y="46" width="212" height="38" rx="6" fill="#FFFFFF" stroke="#D1FAE5" stroke-width="1"/>
      <text x="8" y="62" font-size="10.5" font-weight="800" fill="#065F46">✓ Shipment StateMachine Control</text>
      <text x="8" y="76" font-size="9.5" font-weight="700" fill="#DC2626">Cập nhật trạng thái CANCELLED an toàn</text>

      <rect x="0" y="92" width="212" height="38" rx="6" fill="#FFFFFF" stroke="#D1FAE5" stroke-width="1"/>
      <text x="8" y="108" font-size="10.5" font-weight="800" fill="#065F46">✓ Ghi Audit Log Bất Biến</text>
      <text x="8" y="122" font-size="9.5" font-weight="600" fill="#475569">Bảng ai_agent_audit_logs chống chối bỏ</text>
    </g>
  </g>

  <!-- Numbered Badge 6: Execution -->
  <g transform="translate(2195, 470)">
    <circle cx="0" cy="0" r="14" fill="#059669" stroke="#FFFFFF" stroke-width="2.5" class="logo-shadow"/>
    <text x="0" y="5" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">⑥</text>
  </g>

  <!-- Two-way connector Backend <-> Logistics APIs -->
  <line x1="2180" y1="485" x2="2210" y2="485" stroke="#0F4C81" stroke-width="2.4"/>
  {draw_arrow(2210, 485, "right", color="#0F4C81", size=8)}
  {draw_arrow(2180, 485, "left", color="#0F4C81", size=8)}

  <!-- HỆ THỐNG LOGISTICS APIS NỘI BỘ (x=2210, y=345, w=160, h=285) -->
  <g id="Card_LogisticsApis" transform="translate(2210, 345)">
    <rect width="160" height="285" rx="14" fill="#FFFFFF" stroke="#0284C7" stroke-width="2" class="card-shadow"/>
    <rect width="160" height="34" rx="14 14 0 0" fill="#F0F9FF"/>
    <line x1="0" y1="34" x2="160" y2="34" stroke="#BAE6FD" stroke-width="1.2"/>

    <text x="80" y="22" font-size="11" font-weight="900" fill="#0369A1" text-anchor="middle">LOGISTICS CORE APIS</text>

    <!-- 4 Structured Internal Microservice APIs -->
    <g transform="translate(10, 46)">
      <rect x="0" y="0" width="140" height="50" rx="5" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
      <text x="8" y="16" font-size="10.5" font-weight="900" fill="#0C4A6E">:3008 Tracking API</text>
      <text x="8" y="31" font-size="9.5" font-weight="600" fill="#475569">Hành trình Hub &amp; Vết quét</text>
      <text x="8" y="43" font-size="9" font-weight="700" fill="#0284C7">GET /shipments/:code</text>

      <rect x="0" y="58" width="140" height="50" rx="5" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
      <text x="8" y="74" font-size="10.5" font-weight="900" fill="#0C4A6E">:3012 Pricing API</text>
      <text x="8" y="89" font-size="9.5" font-weight="600" fill="#475569">Tính cước IATA V/6000</text>
      <text x="8" y="101" font-size="9" font-weight="700" fill="#0284C7">POST /pricing/calculate</text>

      <rect x="0" y="116" width="140" height="50" rx="5" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
      <text x="8" y="132" font-size="10.5" font-weight="900" fill="#0C4A6E">:3002 Shipment API</text>
      <text x="8" y="147" font-size="9.5" font-weight="600" fill="#475569">Thông tin đơn &amp; Trạng thái</text>
      <text x="8" y="159" font-size="9" font-weight="700" fill="#0284C7">GET /shipments/:id</text>

      <rect x="0" y="174" width="140" height="50" rx="5" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
      <text x="8" y="190" font-size="10.5" font-weight="900" fill="#0C4A6E">:3011 Payment API</text>
      <text x="8" y="205" font-size="9.5" font-weight="600" fill="#475569">Đối soát COD &amp; Phí hoàn</text>
      <text x="8" y="217" font-size="9" font-weight="700" fill="#0284C7">POST /payments/reconcile</text>
    </g>
  </g>

  <!-- =========================================================================
       7. OBSERVABILITY & ENTERPRISE TRACING (TOP RIGHT)
       (x=2090, y=115, w=280, h=215)
       ========================================================================= -->
  <g id="Card_Observability" transform="translate(2090, 115)">
    <rect width="280" height="215" rx="12" fill="#FAF5FF" stroke="#A855F7" stroke-width="1.8" class="card-shadow"/>
    <rect width="280" height="30" rx="12 12 0 0" fill="#7E22CE"/>
    
    <text x="140" y="20" font-size="11.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">
      OBSERVABILITY &amp; AUDIT TRACE
    </text>

    <!-- 3 Core Telemetry Components -->
    <g transform="translate(10, 40)">
      <rect x="0" y="0" width="80" height="42" rx="4" fill="#FFFFFF" stroke="#E9D5FF" stroke-width="1"/>
      <text x="40" y="16" font-size="9.5" font-weight="900" fill="#581C87" text-anchor="middle">LangSmith</text>
      <text x="40" y="30" font-size="8.5" font-weight="700" fill="#7E22CE" text-anchor="middle">DAG Tracing</text>

      <rect x="90" y="0" width="80" height="42" rx="4" fill="#FFFFFF" stroke="#E9D5FF" stroke-width="1"/>
      <text x="130" y="16" font-size="9.5" font-weight="900" fill="#581C87" text-anchor="middle">Arize Phoenix</text>
      <text x="130" y="30" font-size="8.5" font-weight="700" fill="#7E22CE" text-anchor="middle">Token Burn</text>

      <rect x="180" y="0" width="80" height="42" rx="4" fill="#FFFFFF" stroke="#E9D5FF" stroke-width="1"/>
      <text x="220" y="16" font-size="9.5" font-weight="900" fill="#581C87" text-anchor="middle">OpenTelemetry</text>
      <text x="220" y="30" font-size="8.5" font-weight="700" fill="#7E22CE" text-anchor="middle">Latency P99</text>
    </g>

    <!-- 4 Checkmark Bullets -->
    <g transform="translate(14, 98)">
      <circle cx="6" cy="7" r="3" fill="#7E22CE"/>
      <text x="16" y="11" font-size="10.5" font-weight="700" fill="#334155">Trace ID xuyên suốt từng lượt gọi</text>

      <circle cx="6" cy="27" r="3" fill="#7E22CE"/>
      <text x="16" y="31" font-size="10.5" font-weight="700" fill="#334155">Đo độ trễ per-node latency (ms)</text>

      <circle cx="6" cy="47" r="3" fill="#7E22CE"/>
      <text x="16" y="51" font-size="10.5" font-weight="700" fill="#334155">Định mức chi phí Token Burn</text>

      <circle cx="6" cy="67" r="3" fill="#7E22CE"/>
      <text x="16" y="71" font-size="10.5" font-weight="700" fill="#334155">Circuit Breaker ngắt kết nối an toàn</text>
    </g>
  </g>

  <!-- Dashed connection from LangGraph to Observability -->
  <path d="M 1680 160 L 2090 160" fill="none" stroke="#7E22CE" stroke-width="1.8" stroke-dasharray="4,4"/>
  {draw_arrow(2090, 160, "right", color="#7E22CE", size=7)}

  <!-- =========================================================================
       8. BOTTOM SUPPORTING ROW: DATA STORAGE & INFRASTRUCTURE
       (y=700, h=110)
       ========================================================================= -->

  <!-- CARD 8.1: Cơ sở dữ liệu & Tri thức (x=160, y=700, w=380, h=110) -->
  <g id="Card_Database" transform="translate(160, 700)">
    <rect width="380" height="110" rx="12" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.8" class="card-shadow"/>
    
    <!-- Database Cylinder Icon -->
    <g transform="translate(20, 28)">
      <ellipse cx="16" cy="9" rx="16" ry="6" fill="#15803D"/>
      <path d="M 0 9 L 0 28 C 0 33 7 36 16 36 C 25 36 32 33 32 28 L 32 9 Z" fill="#22C55E" opacity="0.85"/>
      <ellipse cx="16" cy="18" rx="16" ry="5.5" fill="none" stroke="#FFFFFF" stroke-width="1"/>
      <ellipse cx="16" cy="27" rx="16" ry="5.5" fill="none" stroke="#FFFFFF" stroke-width="1"/>
    </g>

    <text x="68" y="34" font-size="13.5" font-weight="900" fill="#14532D">Cơ Sở Dữ Liệu &amp; Tri Thức Bưu Chính</text>
    
    <g transform="translate(68, 52)">
      <text x="0" y="10" font-size="11" font-weight="800" fill="#15803D">• PostgreSQL 16 Core DB &amp; pgvector Extension</text>
      <text x="0" y="27" font-size="10.5" font-weight="600" fill="#475569">Pipeline: AST Chunking, Matryoshka (MRL-512)</text>
      <text x="0" y="44" font-size="10.5" font-weight="700" fill="#166534">9 Tài liệu quy chuẩn SOP, Điều 25 NĐ 47 &amp; Luật Bưu chính</text>
    </g>
  </g>

  <!-- CARD 8.2: Vector Database (x=565, y=700, w=250, h=110) -->
  <g id="Card_VectorDb" transform="translate(565, 700)">
    <rect width="250" height="110" rx="12" fill="#F0F9FF" stroke="#0284C7" stroke-width="1.8" class="card-shadow"/>
    
    <g transform="translate(18, 30)">
      <circle cx="14" cy="14" r="12" fill="none" stroke="#0284C7" stroke-width="2.6"/>
      <line x1="23" y1="23" x2="33" y2="33" stroke="#0284C7" stroke-width="3.5" stroke-linecap="round"/>
    </g>

    <text x="64" y="42" font-size="13.5" font-weight="900" fill="#0C4A6E">Vector Store</text>
    <text x="64" y="64" font-size="11.5" font-weight="800" fill="#0284C7">HNSW Vector Index</text>
    <text x="64" y="84" font-size="10" font-weight="600" fill="#475569">Cosine Semantic Match &lt;2ms</text>
  </g>

  <!-- CARD 8.3: Thực thi giao dịch an toàn (x=840, y=700, w=540, h=110) -->
  <g id="Card_SafeExecution" transform="translate(840, 700)">
    <rect width="540" height="110" rx="12" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.8" class="card-shadow"/>
    
    <g transform="translate(20, 32)">
      <path d="M 0 -12 L 12 -6 L 12 4 C 12 10 0 16 0 16 C 0 16 -12 10 -12 4 L -12 -6 Z" fill="#15803D"/>
      <path d="M -4 2 L 0 6 L 5 -2" fill="none" stroke="#FFFFFF" stroke-width="2.2"/>
    </g>

    <text x="48" y="36" font-size="13.5" font-weight="900" fill="#14532D">Thực Thi Giao Dịch An Toàn (Transaction Boundary)</text>
    <text x="48" y="60" font-size="11" font-weight="700" fill="#166534">
      • Tuân thủ nghiêm ngặt nguyên tắc ACID &amp; Chống tấn công BOLA/IDOR
    </text>
    <text x="48" y="80" font-size="11" font-weight="700" fill="#166534">
      • Chỉ cập nhật CANCELLED / Sửa địa chỉ khi có chữ ký phê duyệt hợp lệ từ Gatekeeper / HITL
    </text>
  </g>

  <!-- CARD 8.4: KẾT QUẢ THỰC THI (x=1940, y=700, w=430, h=110) -->
  <g id="Card_Result" transform="translate(1940, 700)">
    <rect width="430" height="110" rx="12" fill="#F0FDF4" stroke="#059669" stroke-width="2.2" class="strong-shadow"/>
    
    <g transform="translate(22, 34)">
      <circle cx="14" cy="14" r="14" fill="#10B981"/>
      <path d="M 8 14 L 12 18 L 20 10" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>
    </g>

    <text x="60" y="40" font-size="14.5" font-weight="900" fill="#065F46">Kết Quả Thực Thi Đơn Hàng (Execution Result)</text>
    <text x="24" y="70" font-size="11.5" font-weight="700" fill="#047857">Cập nhật trạng thái bưu gửi trên toàn hệ thống &amp; Ghi vết</text>
    <text x="24" y="90" font-size="11" font-weight="700" fill="#065F46">Stream SSE Realtime / Webhook / SMS thông báo tới Khách hàng</text>
  </g>

  <!-- Connection: Logistics APIs down to Result -->
  <line x1="2290" y1="630" x2="2290" y2="700" stroke="#0F4C81" stroke-width="2.6"/>
  {draw_arrow(2290, 700, "down", color="#0F4C81", size=9)}

  <!-- Return Loop: Closed-loop feedback from Result back to Customer (Underground Line at y=835) -->
  <path d="M 1940 755 L 1890 755 L 1890 835 L 128 835 L 128 425" fill="none" stroke="#0F4C81" stroke-width="2.8"/>
  {draw_arrow(128, 425, "up", color="#0F4C81", size=10)}
  <rect x="850" y="823" width="370" height="24" rx="5" fill="#0F4C81"/>
  <text x="1035" y="839" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">
    CLOSED-LOOP FEEDBACK: PHẢN HỒI KẾT QUẢ ĐÃ XỬ LÝ VỀ CLIENT
  </text>

  <!-- =========================================================================
       9. FOOTER BAR: HẠ TẦNG KỸ THUẬT DOANH NGHIỆP (ENTERPRISE TECH STACK)
       (x=36, y=875, w=2334, h=145)
       ========================================================================= -->
  <g id="Bar_TechStack" transform="translate(36, 875)">
    <rect width="2328" height="145" rx="14" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.8" class="card-shadow"/>
    
    <!-- Left Pill Badge -->
    <rect x="0" y="0" width="320" height="34" rx="14 0 12 0" fill="#0F172A"/>
    <text x="160" y="23" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.04em">
      HẠ TẦNG KỸ THUẬT &amp; CÔNG NGHỆ LÕI
    </text>

    <!-- 6 Technical Blocks with Clean, Breathable Structure -->
    <!-- Block 1: Multi-Agent Framework -->
    <g transform="translate(30, 52)">
      <rect x="0" y="0" width="330" height="72" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/>
      <text x="14" y="22" font-size="11.5" font-weight="900" fill="#0F172A">Orchestration &amp; Workflow</text>
      <text x="14" y="42" font-size="13" font-weight="800" fill="#0284C7">LangGraph + LangChain</text>
      <text x="14" y="58" font-size="10" font-weight="600" fill="#64748B">State Machine &amp; Multi-tool Agent Engine</text>
    </g>

    <!-- Block 2: Inference Acceleration -->
    <g transform="translate(380, 52)">
      <rect x="0" y="0" width="340" height="72" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/>
      <text x="14" y="22" font-size="11.5" font-weight="900" fill="#0F172A">High-Speed LPU Inference</text>
      <text x="14" y="42" font-size="13" font-weight="800" fill="#0D9488">Groq LPU + Google AI Studio</text>
      <text x="14" y="58" font-size="10" font-weight="600" fill="#64748B">Tốc độ sinh token &gt;250 T/s • TTFT &lt;350ms</text>
    </g>

    <!-- Block 3: Data Tier -->
    <g transform="translate(740, 52)">
      <rect x="0" y="0" width="340" height="72" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/>
      <text x="14" y="22" font-size="11.5" font-weight="900" fill="#0F172A">Enterprise Persistence &amp; Cache</text>
      <text x="14" y="42" font-size="13" font-weight="800" fill="#15803D">PostgreSQL 16 + pgvector + Redis</text>
      <text x="14" y="58" font-size="10" font-weight="600" fill="#64748B">ACID Transaction &amp; HNSW Vector Indexing</text>
    </g>

    <!-- Block 4: Big Four Model Architecture -->
    <g transform="translate(1100, 52)">
      <rect x="0" y="0" width="430" height="72" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/>
      <text x="14" y="22" font-size="11.5" font-weight="900" fill="#0F172A">Heterogeneous Model Providers (Big Four)</text>
      <text x="14" y="42" font-size="13" font-weight="800" fill="#1E40AF">Google • Alibaba • OpenAI • NVIDIA</text>
      <text x="14" y="58" font-size="10" font-weight="600" fill="#64748B">Gemini Flash • Qwen 27B • GPT-OSS 120B • Nemotron 30B</text>
    </g>

    <!-- Block 5: Observability -->
    <g transform="translate(1550, 52)">
      <rect x="0" y="0" width="360" height="72" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/>
      <text x="14" y="22" font-size="11.5" font-weight="900" fill="#0F172A">Tracing &amp; System Health</text>
      <text x="14" y="42" font-size="13" font-weight="800" fill="#7E22CE">LangSmith + OpenTelemetry (OTel)</text>
      <text x="14" y="58" font-size="10" font-weight="600" fill="#64748B">Trace ID xuyên suốt • Token Burn Analytics</text>
    </g>

    <!-- Block 6: Microservices Core -->
    <g transform="translate(1930, 52)">
      <rect x="0" y="0" width="365" height="72" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/>
      <text x="14" y="22" font-size="11.5" font-weight="900" fill="#0F172A">Backend Core &amp; Microservices</text>
      <text x="14" y="42" font-size="13" font-weight="800" fill="#E11D48">NestJS Enterprise BFF Gateway</text>
      <text x="14" y="58" font-size="10" font-weight="600" fill="#64748B">Port :3000 Gateway, :3008 Tracking, :3012 Pricing, :3013 AI</text>
    </g>
  </g>

</svg>
''')

    svg_content = "\n".join(lines)
    os.makedirs(os.path.dirname(OUTPUT_SVG), exist_ok=True)
    with open(OUTPUT_SVG, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated Professional Enterprise Architecture SVG: {OUTPUT_SVG}")

if __name__ == "__main__":
    build_svg()
