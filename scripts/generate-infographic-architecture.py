#!/usr/bin/env python3
"""
generate-infographic-architecture.py
Ultra-Modern Production-Grade Architecture Infographic (Widescreen Canvas 2160 x 1320)
Strictly adhering to Modern Technical Architecture Infographic Standard (AGENTS.md Section 5)

Key Enhancements in this revision:
1. Generously spaced card layout with increased breathing room (no crowded elements).
2. Highly prominent, descriptive text labels and pill badges on all arrows and communication buses.
3. Crystal-clear distinction of roles:
   - LangGraph: StateGraph Orchestration, Shared State Channel, Checkpoints & HITL interrupt()
   - LangChain: Tool Calling (@tool), Hybrid RAG Retriever, Multi-LLM BaseChatModel Adapters
4. Heterogeneous Big 4 AI Models:
   - Supervisor: Gemini 3.6 Flash (Google AI Studio Free)
   - Knowledge Agent: Qwen 2.5 32B Instruct (Alibaba / Groq LPU Free)
   - Operation Agent: Llama 3.3 70B Versatile (Meta / Groq LPU Free)
   - Validation Agent: Llama-3.1-Nemotron-70B (NVIDIA NIM Free)
5. 4 Production Pillars: Semantic Cache (Redis), HA Failover Cascade, Observability (OpenTelemetry), Memory Hygiene (Sliding Window K=5)
"""

import os
import html
import xml.etree.ElementTree as ET

OUTPUT_SVG = "docs/graduation-thesis/diagrams/architecture/04-multi-agent-infographic-architecture.svg"

def draw_arrow(x, y, direction="right", color="#1D4ED8", size=14):
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
    W = 2160
    H = 1320
    lines = []

    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&amp;family=JetBrains+Mono:wght@700;800;900&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }}
      .mono {{ font-family: 'JetBrains Mono', monospace; }}
      .card-shadow {{ filter: drop-shadow(0 6px 20px rgba(15, 23, 42, 0.08)); }}
      .subtle-shadow {{ filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.06)); }}
      .glow-green {{ filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.35)); }}
      .glow-indigo {{ filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.28)); }}
    </style>

    <!-- Gradients -->
    <linearGradient id="topPillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#1E40AF"/>
    </linearGradient>

    <linearGradient id="supervisorCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E40AF"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>

    <linearGradient id="cacheGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0FDF4"/>
      <stop offset="100%" stop-color="#DCFCE7"/>
    </linearGradient>

    <linearGradient id="obsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAF5FF"/>
      <stop offset="100%" stop-color="#F3E8FF"/>
    </linearGradient>

    <linearGradient id="langgraphHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#312E81"/>
      <stop offset="50%" stop-color="#4338CA"/>
      <stop offset="100%" stop-color="#1E1B4B"/>
    </linearGradient>

    <!-- Gemini Sparkle Gradient -->
    <linearGradient id="geminiSparkle" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93C5FD"/>
      <stop offset="50%" stop-color="#F472B6"/>
      <stop offset="100%" stop-color="#FBBF24"/>
    </linearGradient>
  </defs>

  <!-- PURE CLEAN WHITE BACKGROUND -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- =========================================================================
       1. TOP HEADER BANNER (PILL WITH DELIVERY TRUCK ICON)
       ========================================================================= -->
  <g id="Header_Banner" transform="translate({W//2}, 45)">
    <rect x="-530" y="-23" width="1060" height="46" rx="23" fill="url(#topPillGrad)" class="card-shadow"/>
    
    <!-- White Delivery Truck Icon -->
    <g transform="translate(-490, -11)">
      <path d="M 0 5 L 14 5 L 18 10 L 25 10 L 25 17 L 0 17 Z" fill="#FFFFFF"/>
      <rect x="0" y="2" width="13" height="15" fill="#FFFFFF" rx="1"/>
      <circle cx="6" cy="18" r="3" fill="#1E40AF" stroke="#FFFFFF" stroke-width="1.8"/>
      <circle cx="19" cy="18" r="3" fill="#1E40AF" stroke="#FFFFFF" stroke-width="1.8"/>
    </g>

    <text x="-445" y="8" font-size="20" font-weight="900" fill="#FFFFFF" letter-spacing="-0.01em">
      Multi-Agent Logistics Architecture – Phiên Bản Vận Hành Doanh Nghiệp (Production-Grade)
    </text>

    <!-- Subtitle below pill -->
    <text x="0" y="46" font-size="14" font-weight="700" fill="#475569" text-anchor="middle" font-style="italic">
      Phối hợp LangGraph (StateGraph Điều Phối) + LangChain (Công Cụ &amp; RAG) với 4 Họ AI Big 4 (Google, Alibaba, Meta, NVIDIA)
    </text>
  </g>

  <!-- =========================================================================
       OVERHEAD ROOFTOP HIGHWAY FOR ROUTE ⑤ (y=96) - ZERO COLLISION HIGHWAY
       ========================================================================= -->
  <path d="M 1260 730 L 1260 96 L 775 96 L 775 160" fill="none" stroke="#1D4ED8" stroke-width="3" stroke-dasharray="8,5"/>
  {draw_arrow(775, 160, "down", color="#1D4ED8", size=12)}

  <!-- Number Badge ⑤ Protected Pill on Rooftop Highway -->
  <g transform="translate(1015, 96)">
    <rect x="-240" y="-16" width="480" height="32" rx="16" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="2" class="subtle-shadow"/>
    <circle cx="-218" cy="0" r="11" fill="#1D4ED8"/>
    <text x="-218" y="4" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">5</text>
    <text x="12" y="4" font-size="11.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">
      ⑤ Cập nhật DB &amp; Ghi Audit Log thành công ➔ Báo cáo về Supervisor Agent
    </text>
  </g>

  <!-- =========================================================================
       2. LEFT COLUMN: KHÁCH HÀNG (WEB/APP) (x=45, y=160, w=165)
       ========================================================================= -->
  <g id="Col_Customer" transform="translate(45, 160)">
    <!-- Speech bubble -->
    <rect x="0" y="0" width="165" height="78" rx="10" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1.8"/>
    <polygon points="20,78 35,78 25,90" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1.8"/>
    <rect x="18" y="76" width="20" height="4" fill="#EFF6FF"/>
    
    <circle cx="25" cy="20" r="2.5" fill="#3B82F6"/>
    <circle cx="35" cy="20" r="2.5" fill="#3B82F6"/>
    <circle cx="45" cy="20" r="2.5" fill="#3B82F6"/>

    <text x="25" y="42" font-size="12.5" font-weight="800" fill="#1E40AF">"Hủy vận đơn</text>
    <text x="25" y="62" font-size="12.5" font-weight="800" fill="#1E40AF">NX001"</text>

    <!-- User Illustration Container -->
    <rect x="0" y="100" width="165" height="160" rx="16" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="2" class="subtle-shadow"/>
    
    <!-- Stylized Flat Character -->
    <circle cx="82" cy="145" r="25" fill="#FDBA74"/>
    <path d="M 58 140 C 58 122 71 116 94 116 C 105 116 108 123 108 130 C 102 125 89 125 80 132 Z" fill="#1E293B"/>
    <path d="M 54 188 C 54 170 69 165 82 165 C 95 165 110 170 110 188 Z" fill="#3B82F6"/>
    <rect x="93" y="160" width="16" height="28" rx="3" fill="#1E293B"/>
    <rect x="95" y="162" width="12" height="22" rx="2" fill="#93C5FD"/>

    <text x="82" y="222" font-size="15" font-weight="900" fill="#0F172A" text-anchor="middle">Khách hàng</text>
    <text x="82" y="242" font-size="12" font-weight="700" fill="#64748B" text-anchor="middle">(Web / Mobile App)</text>
  </g>

  <!-- =========================================================================
       EVOLUTION 1: SEMANTIC CACHING GATEWAY (REDIS VECTOR) (x=245, y=150, w=245, h=200)
       ========================================================================= -->
  <g id="Card_SemanticCache" transform="translate(245, 150)">
    <rect width="245" height="200" rx="14" fill="url(#cacheGrad)" stroke="#10B981" stroke-width="2" class="card-shadow"/>
    
    <!-- Top Pill Badge -->
    <rect x="12" y="10" width="221" height="24" rx="4" fill="#059669"/>
    <text x="122" y="26" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">⚡ SEMANTIC CACHE GATEWAY</text>

    <!-- Bolt Icon -->
    <g transform="translate(208, 12)">
      <polygon points="12,2 5,14 11,14 9,22 17,10 11,10" fill="#FBBF24"/>
    </g>

    <text x="12" y="58" font-size="15.5" font-weight="900" fill="#065F46">Redis Vector Cache</text>
    <text x="12" y="76" font-size="11.5" font-weight="700" fill="#047857">(Cosine Similarity ≥ 0.95)</text>

    <!-- 3 Metrics Boxes with expanded spacing -->
    <g transform="translate(12, 88)">
      <rect width="221" height="30" rx="4" fill="#FFFFFF" stroke="#A7F3D0" stroke-width="1"/>
      <text x="8" y="19" font-size="11" font-weight="800" fill="#047857">🚀 Trả về ngay:</text>
      <text x="100" y="19" font-size="11" font-weight="900" fill="#059669">&lt; 15ms (0$ LLM)</text>

      <rect y="36" width="221" height="30" rx="4" fill="#FFFFFF" stroke="#A7F3D0" stroke-width="1"/>
      <text x="8" y="55" font-size="11" font-weight="800" fill="#047857">📉 Tiết kiệm Token:</text>
      <text x="120" y="55" font-size="11" font-weight="900" fill="#059669">Giảm 60% chi phí</text>

      <rect y="72" width="221" height="30" rx="4" fill="#FFFFFF" stroke="#A7F3D0" stroke-width="1"/>
      <text x="8" y="91" font-size="11" font-weight="800" fill="#047857">❓ Cache Miss:</text>
      <text x="105" y="91" font-size="10.5" font-weight="700" fill="#1D4ED8">Chuyển Supervisor</text>
    </g>
  </g>

  <!-- Number Badge ① on connecting highway line -->
  <line x1="210" y1="242" x2="245" y2="242" stroke="#1D4ED8" stroke-width="3"/>
  {draw_arrow(245, 242, "right", color="#1D4ED8", size=12)}
  <g transform="translate(227, 226)">
    <circle cx="0" cy="0" r="12" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="2"/>
    <text x="0" y="4" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">1</text>
  </g>

  <!-- Arrow: Cache Hit -> Back to Customer (Direct Return) -->
  <path d="M 330 350 L 330 380 L 125 380 L 125 330" fill="none" stroke="#10B981" stroke-width="2.8" stroke-dasharray="6,4"/>
  {draw_arrow(125, 330, "up", color="#10B981", size=11)}
  <g transform="translate(225, 380)">
    <rect x="-85" y="-12" width="170" height="24" rx="6" fill="#ECFDF5" stroke="#10B981" stroke-width="1.2" class="subtle-shadow"/>
    <text x="0" y="4" font-size="10" font-weight="900" fill="#047857" text-anchor="middle">
      ⚡ CACHE HIT: &lt;15ms (0$ LLM)
    </text>
  </g>

  <!-- Arrow: Cache Miss -> Supervisor with clear prominent label -->
  <line x1="490" y1="242" x2="540" y2="242" stroke="#1D4ED8" stroke-width="3"/>
  {draw_arrow(540, 242, "right", color="#1D4ED8", size=13)}
  <g transform="translate(515, 226)">
    <rect x="-42" y="-11" width="84" height="22" rx="4" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.2" class="subtle-shadow"/>
    <text x="0" y="4" font-size="10" font-weight="900" fill="#1D4ED8" text-anchor="middle">
      MISS ➔ DAG
    </text>
  </g>

  <!-- =========================================================================
       3. CENTRAL CORE: LANGGRAPH MULTI-AGENT STATEGRAPH RUNTIME CONTAINER
       (x=530, y=120, w=1060, h=590) - GENEROUS BREATHING SPACE
       ========================================================================= -->
  <rect x="530" y="120" width="1060" height="590" rx="20" fill="#F8FAFF" stroke="#6366F1" stroke-width="2.2" stroke-dasharray="8,5" class="glow-indigo"/>

  <!-- PROMINENT LANGGRAPH BANNER HEADER -->
  <g transform="translate(1060, 120)">
    <rect x="-410" y="-22" width="820" height="44" rx="22" fill="url(#langgraphHeaderGrad)" stroke="#818CF8" stroke-width="2" class="card-shadow"/>
    
    <!-- LangGraph Node Graph Connected Icon -->
    <g transform="translate(-375, -9)">
      <circle cx="5" cy="5" r="4" fill="#38BDF8"/>
      <circle cx="21" cy="5" r="4" fill="#38BDF8"/>
      <circle cx="13" cy="18" r="4" fill="#38BDF8"/>
      <line x1="5" y1="5" x2="21" y2="5" stroke="#FFFFFF" stroke-width="2"/>
      <line x1="5" y1="5" x2="13" y2="18" stroke="#FFFFFF" stroke-width="2"/>
      <line x1="21" y1="5" x2="13" y2="18" stroke="#FFFFFF" stroke-width="2"/>
    </g>

    <text x="-335" y="7" font-size="15" font-weight="900" fill="#FFFFFF" letter-spacing="0.02em">
      🌐 LANGGRAPH STATEGRAPH RUNTIME ENGINE
    </text>
    <text x="-35" y="7" font-size="14" font-weight="400" fill="#A5B4FC">|</text>
    <text x="-20" y="7" font-size="12.5" font-weight="700" fill="#E0E7FF">
      StateGraph DAG • Tuần Hoàn Tuple Trạng Thái • Checkpoint &amp; Ngắt HITL
    </text>
  </g>

  <!-- =========================================================================
       SUPERVISOR AGENT CARD (x=550, y=160, w=455, h=190)
       ========================================================================= -->
  <g id="Card_Supervisor" transform="translate(550, 160)">
    <rect width="455" height="190" rx="14" fill="url(#supervisorCardGrad)" stroke="#1D4ED8" stroke-width="2" class="card-shadow"/>
    
    <!-- Top Role Badge -->
    <rect x="18" y="12" width="285" height="24" rx="4" fill="#3B82F6"/>
    <text x="160" y="28" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">★ CHỈ HUY ĐIỀU PHỐI (GOOGLE ARCHITECTURE)</text>

    <!-- Gemini Sparkle Icon -->
    <g transform="translate(405, 12)">
      <path d="M 14 0 C 14 8 20 14 28 14 C 20 14 14 20 14 28 C 14 20 8 14 0 14 C 8 14 14 8 14 0 Z" fill="url(#geminiSparkle)"/>
    </g>

    <text x="18" y="65" font-size="17.5" font-weight="900" fill="#FFFFFF">Supervisor Agent</text>
    <text x="185" y="65" font-size="13" font-weight="800" fill="#93C5FD">(Gemini 3.6 Flash - Google Free)</text>

    <!-- LangChain Integration Pill inside Supervisor -->
    <g transform="translate(18, 77)">
      <rect width="230" height="20" rx="4" fill="#1E293B" stroke="#60A5FA" stroke-width="1"/>
      <text x="10" y="14" font-size="9.5" font-weight="800" fill="#93C5FD">🦜 LangChain Multi-LLM Adapter</text>
    </g>

    <!-- 3 Core Highlight Capabilities -->
    <g transform="translate(18, 106)">
      <text x="0" y="12" font-size="12" font-weight="700" fill="#67E8F9">• Phân tích Intent:</text>
      <text x="115" y="12" font-size="11.5" font-weight="500" fill="#E2E8F0">FAQ, tra cứu cước hay yêu cầu hủy đơn</text>

      <text x="0" y="32" font-size="12" font-weight="700" fill="#67E8F9">• Lập kế hoạch DAG:</text>
      <text x="128" y="32" font-size="11.5" font-weight="500" fill="#E2E8F0">Chia việc cho Sub-agents theo StateGraph</text>

      <text x="0" y="52" font-size="12" font-weight="700" fill="#67E8F9">• Tổng hợp SSE Stream:</text>
      <text x="150" y="52" font-size="11.5" font-weight="500" fill="#E2E8F0">Gom dữ liệu trả về realtime cho Client</text>

      <text x="0" y="72" font-size="11" font-weight="700" fill="#FBBF24">⚡ Tích hợp Fallback Cascade: Groq ➔ Gemini ➔ vLLM</text>
    </g>
  </g>

  <!-- =========================================================================
       EVOLUTION 4: CONTEXT MEMORY WITH PROGRESSIVE SUMMARIZER (x=1035, y=160, w=535, h=190)
       ========================================================================= -->
  <g id="Card_ContextMemory" transform="translate(1035, 160)">
    <rect width="535" height="190" rx="14" fill="#FFFFFF" stroke="#6366F1" stroke-width="2" class="card-shadow"/>
    
    <!-- Top Role Badge -->
    <rect x="18" y="12" width="265" height="24" rx="4" fill="#EEF2FF" stroke="#A5B4FC" stroke-width="1"/>
    <text x="150" y="28" font-size="11" font-weight="900" fill="#4338CA" text-anchor="middle">🧠 LANGGRAPH STATE TUPLE (SHARED STATE)</text>

    <!-- Blue Database Cylinder Icon -->
    <g transform="translate(485, 12)">
      <ellipse cx="14" cy="8" rx="14" ry="5" fill="#4F46E5"/>
      <path d="M 0 8 L 0 24 C 0 28 6 31 14 31 C 22 31 28 28 28 24 L 28 8 Z" fill="#818CF8" opacity="0.8"/>
      <ellipse cx="14" cy="16" rx="14" ry="4.5" fill="none" stroke="#FFFFFF" stroke-width="1"/>
      <ellipse cx="14" cy="24" rx="14" ry="4.5" fill="none" stroke="#FFFFFF" stroke-width="1"/>
    </g>

    <text x="18" y="65" font-size="16.5" font-weight="900" fill="#0F172A">Context &amp; Shared State</text>
    <text x="225" y="65" font-size="12.5" font-weight="700" fill="#4F46E5">(Central State Channel)</text>

    <!-- Progressive Memory Hygiene Block (Evolution Highlight) -->
    <g transform="translate(18, 82)">
      <rect width="498" height="44" rx="6" fill="#EEF2FF" stroke="#818CF8" stroke-width="1.2"/>
      <text x="10" y="18" font-size="11.5" font-weight="800" fill="#3730A3">🗜️ Cơ Chế Kiểm Soát Bộ Nhớ (Progressive Memory Hygiene):</text>
      <text x="10" y="36" font-size="10.5" font-weight="600" fill="#334155">• Sliding Window: Giữ nguyên văn K=5 lượt gần nhất | Tóm tắt nền (Cap ≤ 1500 tokens)</text>

      <rect y="50" width="240" height="28" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
      <text x="10" y="68" font-size="11" font-weight="700" fill="#0F172A">👤 messages &amp; userContext</text>

      <rect x="255" y="50" width="243" height="28" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
      <text x="265" y="68" font-size="11" font-weight="700" fill="#0F172A">⏳ actionDraft &amp; hitlStatus</text>
    </g>
  </g>

  <!-- Horizontal connector: Supervisor <-> Context & Memory -->
  <line x1="1005" y1="245" x2="1035" y2="245" stroke="#4F46E5" stroke-width="2.5"/>
  {draw_arrow(1035, 245, "right", color="#4F46E5", size=9)}
  {draw_arrow(1005, 245, "left", color="#4F46E5", size=9)}

  <!-- =========================================================================
       ARROW ②: DISTRIBUTION HIGHWAY BUS FROM SUPERVISOR DOWN TO 3 SUB-AGENTS
       Positioned at y=390 with plenty of breathing space and clear branch labels!
       ========================================================================= -->
  <line x1="775" y1="350" x2="775" y2="390" stroke="#1D4ED8" stroke-width="3"/>
  <line x1="710" y1="390" x2="1430" y2="390" stroke="#1D4ED8" stroke-width="3"/>
  
  <!-- Branch 1 into Knowledge Agent -->
  <line x1="710" y1="390" x2="710" y2="430" stroke="#1D4ED8" stroke-width="3"/>
  {draw_arrow(710, 430, "down", color="#1D4ED8", size=13)}

  <!-- Branch 2 into Operation Agent -->
  <line x1="1070" y1="390" x2="1070" y2="430" stroke="#1D4ED8" stroke-width="3"/>
  {draw_arrow(1070, 430, "down", color="#1D4ED8", size=13)}

  <!-- Branch 3 into Validation Agent -->
  <line x1="1430" y1="390" x2="1430" y2="430" stroke="#1D4ED8" stroke-width="3"/>
  {draw_arrow(1430, 430, "down", color="#1D4ED8", size=13)}

  <!-- Central Badge ② with highly clear, descriptive pill label -->
  <g transform="translate(1070, 390)">
    <rect x="-240" y="-15" width="480" height="30" rx="15" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="2" class="subtle-shadow"/>
    <circle cx="-218" cy="0" r="11" fill="#1D4ED8"/>
    <text x="-218" y="4" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">2</text>
    <text x="12" y="4" font-size="11.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">
      ② StateGraph Router: Phân chia tác vụ chuyên môn cho 3 Sub-Agents
    </text>
  </g>

  <!-- Branch 1 Label Pill -->
  <g transform="translate(710, 412)">
    <rect x="-80" y="-10" width="160" height="20" rx="4" fill="#E0F2FE" stroke="#0284C7" stroke-width="1"/>
    <text x="0" y="4" font-size="9" font-weight="800" fill="#0369A1" text-anchor="middle">⬇ Nhánh Tra Cứu RAG</text>
  </g>

  <!-- Branch 2 Label Pill -->
  <g transform="translate(1070, 412)">
    <rect x="-85" y="-10" width="170" height="20" rx="4" fill="#DCFCE7" stroke="#15803D" stroke-width="1"/>
    <text x="0" y="4" font-size="9" font-weight="800" fill="#166534" text-anchor="middle">⬇ Nhánh Gọi API Nghiệp Vụ</text>
  </g>

  <!-- Branch 3 Label Pill -->
  <g transform="translate(1430, 412)">
    <rect x="-85" y="-10" width="170" height="20" rx="4" fill="#FCE7F3" stroke="#DC2626" stroke-width="1"/>
    <text x="0" y="4" font-size="9" font-weight="800" fill="#991B1B" text-anchor="middle">⬇ Nhánh Thẩm Định An Toàn</text>
  </g>

  <!-- =========================================================================
       SUB-AGENT A: KNOWLEDGE AGENT (QWEN 2.5 32B - ALIBABA) (x=550, y=430, w=325, h=220)
       ========================================================================= -->
  <g id="Card_KnowledgeAgent" transform="translate(550, 430)">
    <rect width="325" height="220" rx="14" fill="#F0F9FF" stroke="#38BDF8" stroke-width="2" class="card-shadow"/>
    
    <!-- Role Pill Badge -->
    <rect x="15" y="10" width="255" height="24" rx="4" fill="#0284C7"/>
    <text x="142" y="26" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">📖 TRÍCH XUẤT RAG (ALIBABA ARCH)</text>

    <!-- Logo icon -->
    <g transform="translate(285, 12)">
      <polygon points="12,2 22,8 22,20 12,26 2,20 2,8" fill="none" stroke="#0284C7" stroke-width="2"/>
      <circle cx="12" cy="14" r="3" fill="#0284C7"/>
    </g>

    <text x="15" y="56" font-size="15.5" font-weight="900" fill="#0F172A">Knowledge Agent</text>
    <text x="150" y="56" font-size="12" font-weight="800" fill="#0284C7">(Qwen 2.5 32B / Groq)</text>

    <!-- LangChain Badge inside Knowledge Agent -->
    <g transform="translate(15, 65)">
      <rect width="295" height="20" rx="3" fill="#E0F2FE" stroke="#0284C7" stroke-width="0.8"/>
      <text x="10" y="14" font-size="9.5" font-weight="800" fill="#0369A1">🦜 LangChain Hybrid RAG &amp; Document Splitter</text>
    </g>

    <!-- Distinct Function Highlights with relaxed padding -->
    <g transform="translate(15, 92)">
      <rect width="295" height="35" rx="4" fill="#FFFFFF" stroke="#BAE6FD" stroke-width="1"/>
      <text x="8" y="15" font-size="10.5" font-weight="800" fill="#0369A1">🇻🇳 Tokenizer Tiếng Việt:</text>
      <text x="8" y="29" font-size="9.5" font-weight="600" fill="#334155">Tiết kiệm 25% token context so với model phương Tây</text>

      <rect y="42" width="295" height="35" rx="4" fill="#FFFFFF" stroke="#BAE6FD" stroke-width="1"/>
      <text x="8" y="57" font-size="10.5" font-weight="800" fill="#0369A1">⚖️ Luật Bưu chính (Đ.25):</text>
      <text x="8" y="71" font-size="9.5" font-weight="600" fill="#334155">Đền bù 4x cước, quy chuẩn SOP bọc bubble wrap ≥3 lớp</text>

      <rect y="84" width="295" height="35" rx="4" fill="#FFFFFF" stroke="#BAE6FD" stroke-width="1"/>
      <text x="8" y="99" font-size="10.5" font-weight="800" fill="#0369A1">🔍 Vector Citations 100%:</text>
      <text x="8" y="113" font-size="9.5" font-weight="600" fill="#334155">Neo nguồn trích dẫn từ PostgreSQL pgvector</text>
    </g>
  </g>

  <!-- =========================================================================
       SUB-AGENT B: LOGISTICS OPERATION AGENT (LLAMA 3.3 70B - META) (x=910, y=430, w=325, h=220)
       ========================================================================= -->
  <g id="Card_OperationAgent" transform="translate(910, 430)">
    <rect width="325" height="220" rx="14" fill="#F0FDF4" stroke="#4ADE80" stroke-width="2" class="card-shadow"/>
    
    <!-- Role Pill Badge -->
    <rect x="15" y="10" width="255" height="24" rx="4" fill="#059669"/>
    <text x="142" y="26" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">⚡ TOOL CALLING &amp; APIS (META ARCH)</text>

    <!-- Infinity / Meta Tool Icon -->
    <g transform="translate(285, 12)">
      <path d="M 4 14 C 4 8 10 8 15 14 C 20 20 26 20 26 14 C 26 8 20 8 15 14 C 10 20 4 20 4 14 Z" fill="none" stroke="#059669" stroke-width="2.5"/>
    </g>

    <text x="15" y="56" font-size="15.5" font-weight="900" fill="#065F46">Operation Agent</text>
    <text x="145" y="56" font-size="12" font-weight="800" fill="#059669">(Llama 3.3 70B / Groq)</text>

    <!-- LangChain Badge inside Operation Agent -->
    <g transform="translate(15, 65)">
      <rect width="295" height="20" rx="3" fill="#DCFCE7" stroke="#059669" stroke-width="0.8"/>
      <text x="10" y="14" font-size="9.5" font-weight="800" fill="#065F46">🦜 LangChain Tool Calling (@tool) &amp; JSON DTO</text>
    </g>

    <!-- Distinct Function Highlights with relaxed padding -->
    <g transform="translate(15, 92)">
      <rect width="295" height="35" rx="4" fill="#FFFFFF" stroke="#BBF7D0" stroke-width="1"/>
      <text x="8" y="15" font-size="10.5" font-weight="800" fill="#15803D">🔍 Tra cứu Vận đơn:</text>
      <text x="8" y="29" font-size="9.5" font-weight="600" fill="#334155">GET :3008 (Vị trí Hub, Shipper, Mốc GPS)</text>

      <rect y="42" width="295" height="35" rx="4" fill="#FFFFFF" stroke="#BBF7D0" stroke-width="1"/>
      <text x="8" y="57" font-size="10.5" font-weight="800" fill="#15803D">📐 Tính cước IATA:</text>
      <text x="8" y="71" font-size="9.5" font-weight="600" fill="#334155">Cân nặng quy đổi V/6000, phụ phí vùng miền</text>

      <rect y="84" width="295" height="35" rx="4" fill="#FFFFFF" stroke="#BBF7D0" stroke-width="1"/>
      <text x="8" y="99" font-size="10.5" font-weight="800" fill="#15803D">📝 Soạn Thảo Lệnh (Draft):</text>
      <text x="8" y="113" font-size="9.5" font-weight="600" fill="#334155">Soạn JSON DTO chuẩn, chưa tự ý ghi vào DB</text>
    </g>
  </g>

  <!-- =========================================================================
       SUB-AGENT C: VALIDATION AGENT (LLAMA-3.1-NEMOTRON-70B - NVIDIA) (x=1270, y=430, w=325, h=220)
       ========================================================================= -->
  <g id="Card_ValidationAgent" transform="translate(1270, 430)">
    <rect width="325" height="220" rx="14" fill="#FDF2F8" stroke="#F472B6" stroke-width="2" class="card-shadow"/>
    
    <!-- Role Pill Badge -->
    <rect x="15" y="10" width="265" height="24" rx="4" fill="#DC2626"/>
    <text x="147" y="26" font-size="9.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">🛡️ AN TOÀN &amp; GUARDRAIL (NVIDIA ARCH)</text>

    <!-- Shield Icon -->
    <g transform="translate(290, 12)">
      <path d="M 12 2 L 22 7 L 22 15 C 22 21 12 26 12 26 C 12 26 2 21 2 15 L 2 7 Z" fill="#DC2626"/>
      <path d="M 8 13 L 11 16 L 17 10" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    </g>

    <text x="15" y="56" font-size="15" font-weight="900" fill="#831843">Validation Agent</text>
    <text x="140" y="56" font-size="11.5" font-weight="800" fill="#BE185D">(Nemotron-70B / NVIDIA)</text>

    <!-- LangChain Badge inside Validation Agent -->
    <g transform="translate(15, 65)">
      <rect width="295" height="20" rx="3" fill="#FCE7F3" stroke="#DC2626" stroke-width="0.8"/>
      <text x="10" y="14" font-size="9.5" font-weight="800" fill="#991B1B">🦜 LangChain Structured Output Guardrail</text>
    </g>

    <!-- Distinct Function Highlights with relaxed padding -->
    <g transform="translate(15, 92)">
      <rect width="295" height="35" rx="4" fill="#FFFFFF" stroke="#FECDD3" stroke-width="1"/>
      <text x="8" y="15" font-size="10.5" font-weight="800" fill="#BE123C">🛡️ NeMo Guardrails:</text>
      <text x="8" y="29" font-size="9.5" font-weight="600" fill="#334155">Reward Model kiểm toán an toàn &amp; phân quyền</text>

      <rect y="42" width="295" height="35" rx="4" fill="#FFFFFF" stroke="#FECDD3" stroke-width="1"/>
      <text x="8" y="57" font-size="10.5" font-weight="800" fill="#BE123C">🛑 Thẩm định Nghiệp vụ:</text>
      <text x="8" y="71" font-size="9.5" font-weight="600" fill="#334155">Đã xuất kho xe tải = CẤM HỦY (Zero-Trust)</text>

      <rect y="84" width="295" height="35" rx="4" fill="#FFFFFF" stroke="#FECDD3" stroke-width="1"/>
      <text x="8" y="99" font-size="10.5" font-weight="800" fill="#BE123C">⚖️ Khử Thiên Kiến Đồng Nhất:</text>
      <text x="8" y="113" font-size="9.5" font-weight="700" fill="#DC2626">Kiểm duyệt chéo độc lập đầu ra Meta Llama</text>
    </g>
  </g>

  <!-- Horizontal Two-way Collaboration Arrow between Operation & Validation with Prominent Pill Badge ③ -->
  <line x1="1235" y1="540" x2="1270" y2="540" stroke="#1D4ED8" stroke-width="2.8"/>
  {draw_arrow(1270, 540, "right", color="#1D4ED8", size=10)}
  {draw_arrow(1235, 540, "left", color="#1D4ED8", size=10)}
  <g transform="translate(1252, 515)">
    <rect x="-95" y="-12" width="190" height="24" rx="5" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.2" class="subtle-shadow"/>
    <text x="0" y="4" font-size="9.5" font-weight="900" fill="#1D4ED8" text-anchor="middle">
      ③ Bàn giao Draft DTO kiểm toán
    </text>
  </g>

  <!-- =========================================================================
       EVOLUTION 2: MULTI-PROVIDER FALLBACK & CIRCUIT BREAKER BANNER
       Positioned horizontally with breathing space below sub-agents!
       ========================================================================= -->
  <g id="Banner_Fallback" transform="translate(550, 665)">
    <rect width="1045" height="34" rx="8" fill="#FFFBEB" stroke="#F59E0B" stroke-width="1.5" class="subtle-shadow"/>
    
    <g transform="translate(18, 7)">
      <circle cx="10" cy="10" r="10" fill="#F59E0B"/>
      <path d="M 6 10 L 9 13 L 14 7" fill="none" stroke="#FFFFFF" stroke-width="1.8"/>
      <text x="30" y="14" font-size="11.5" font-weight="900" fill="#92400E">CƠ CHẾ DỰ PHÒNG HA (FAILOVER CASCADE):</text>
      <text x="315" y="14" font-size="11.5" font-weight="700" fill="#1D4ED8">1. Groq LPU (400 t/s)</text>
      <text x="470" y="14" font-size="11" font-weight="600" fill="#64748B">➔ [Nếu 429/Timeout]</text>
      <text x="625" y="14" font-size="11.5" font-weight="700" fill="#2563EB">2. Gemini 3.6 Flash</text>
      <text x="780" y="14" font-size="11" font-weight="600" fill="#64748B">➔ [Nếu Offline/Mất mạng]</text>
      <text x="945" y="14" font-size="11.5" font-weight="800" fill="#059669">3. vLLM Local</text>
    </g>
  </g>

  <!-- =========================================================================
       5. LOWER TIER (LEFT): RAG PIPELINE & PGVECTOR (x=550, y=730, w=325)
       ========================================================================= -->
  <!-- Vertical Drop from Knowledge Agent to RAG Pipeline -->
  <line x1="710" y1="650" x2="710" y2="730" stroke="#10B981" stroke-width="2.8"/>
  {draw_arrow(710, 730, "down", color="#10B981", size=12)}

  <!-- Box: Quy trình RAG (x=550, y=730, w=325, h=165) -->
  <g id="Box_RagPipeline" transform="translate(550, 730)">
    <rect width="325" height="165" rx="14" fill="#ECFDF5" stroke="#34D399" stroke-width="1.8" stroke-dasharray="5,4" class="card-shadow"/>
    
    <rect x="15" y="10" width="190" height="22" rx="4" fill="#059669"/>
    <text x="110" y="25" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">QUY TRÌNH NẠP &amp; TRUY XUẤT RAG</text>

    <!-- Sub-step 1 -->
    <circle cx="28" cy="55" r="10" fill="#10B981"/>
    <text x="28" y="59" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">1</text>
    <text x="48" y="55" font-size="12" font-weight="800" fill="#0F172A">Chunking tài liệu AST</text>
    <text x="48" y="70" font-size="10.5" font-weight="600" fill="#64748B">(Giữ nguyên cấu trúc SOP bưu chính)</text>

    <!-- Sub-step 2 -->
    <circle cx="28" cy="95" r="10" fill="#10B981"/>
    <text x="28" y="99" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">2</text>
    <text x="48" y="95" font-size="12" font-weight="800" fill="#0F172A">MRL Embedding (Matryoshka)</text>
    <text x="48" y="110" font-size="10.5" font-weight="600" fill="#64748B">(Rút gọn 256 chiều, giảm 75% RAM)</text>

    <!-- Sub-step 3 -->
    <circle cx="28" cy="135" r="10" fill="#10B981"/>
    <text x="28" y="139" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">3</text>
    <text x="48" y="135" font-size="12" font-weight="800" fill="#0F172A">Hybrid Retrieval (Cosine + BM25)</text>
    <text x="48" y="150" font-size="10.5" font-weight="600" fill="#64748B">(Trích dẫn nguồn neo 100% điều khoản)</text>
  </g>

  <!-- Vertical Drop to Vector DB -->
  <line x1="710" y1="895" x2="710" y2="925" stroke="#10B981" stroke-width="2.8"/>
  {draw_arrow(710, 925, "down", color="#10B981", size=11)}

  <!-- Box: Vector DB (x=550, y=925, w=325, h=80) -->
  <g id="Box_VectorDb" transform="translate(550, 925)">
    <rect width="325" height="80" rx="14" fill="#FFFFFF" stroke="#059669" stroke-width="2" class="card-shadow"/>
    
    <g transform="translate(20, 22)">
      <circle cx="10" cy="10" r="9" fill="none" stroke="#059669" stroke-width="2.5"/>
      <line x1="17" y1="17" x2="25" y2="25" stroke="#059669" stroke-width="2.5" stroke-linecap="round"/>
    </g>

    <text x="70" y="34" font-size="15" font-weight="900" fill="#065F46">Vector Database</text>
    <text x="70" y="56" font-size="12.5" font-weight="700" fill="#047857">(pgvector / PostgreSQL Core DB)</text>
  </g>

  <!-- =========================================================================
       6. LOWER TIER (CENTER): CHỐT CHẶN HITL (x=910, y=730, w=325) [BƯỚC 4]
       ========================================================================= -->
  <!-- Drop from Validation Agent to HITL with Prominent Route Label ④ -->
  <line x1="1430" y1="650" x2="1430" y2="720" stroke="#DC2626" stroke-width="2.8"/>
  <line x1="1430" y1="720" x2="1070" y2="720" stroke="#DC2626" stroke-width="2.8"/>
  <line x1="1070" y1="720" x2="1070" y2="730" stroke="#DC2626" stroke-width="2.8"/>
  {draw_arrow(1070, 730, "down", color="#DC2626", size=12)}

  <!-- Protected Number Badge ④ Pill Label on HITL Trigger Route -->
  <g transform="translate(1250, 720)">
    <rect x="-180" y="-14" width="360" height="28" rx="14" fill="#FFFFFF" stroke="#DC2626" stroke-width="2" class="subtle-shadow"/>
    <circle cx="-160" cy="0" r="11" fill="#DC2626"/>
    <text x="-160" y="4" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">4</text>
    <text x="15" y="4" font-size="11" font-weight="900" fill="#DC2626" text-anchor="middle">
      ④ Thao tác nhạy cảm ➔ Kích hoạt LangGraph interrupt()
    </text>
  </g>

  <!-- Box: HITL Container (x=910, y=730, w=325, h=275) -->
  <g id="Card_Hitl" transform="translate(910, 730)">
    <rect width="325" height="275" rx="14" fill="#FFFBEB" stroke="#F59E0B" stroke-width="2" class="card-shadow"/>
    
    <rect x="15" y="10" width="245" height="24" rx="4" fill="#D97706"/>
    <text x="137" y="26" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">👤 LANGGRAPH INTERRUPT() (HITL)</text>

    <text x="15" y="56" font-size="15.5" font-weight="900" fill="#78350F">Human-in-the-Loop</text>
    <text x="15" y="74" font-size="11.5" font-weight="700" fill="#B45309">Chốt chặn phê duyệt của Người Dùng</text>

    <!-- Simulated UI Drawer Card -->
    <g transform="translate(15, 84)">
      <rect width="295" height="115" rx="8" fill="#FFFFFF" stroke="#FCD34D" stroke-width="1.5"/>
      <text x="10" y="22" font-size="11.5" font-weight="900" fill="#B45309">⚠️ Xác nhận yêu cầu hủy đơn hàng</text>
      
      <text x="10" y="42" font-size="10.5" font-weight="600" fill="#475569">Mã đơn: <tspan font-weight="800" fill="#0F172A">NX001</tspan> | Phí hoàn dự kiến: <tspan font-weight="800" fill="#DC2626">15.000đ</tspan></text>
      <text x="10" y="58" font-size="10.5" font-weight="600" fill="#475569">Tác tử AI chỉ chuẩn bị bản thảo (Proposal Draft).</text>

      <!-- 2 Action Buttons -->
      <g transform="translate(10, 72)">
        <rect width="125" height="32" rx="6" fill="#DC2626"/>
        <text x="62" y="20" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">Đồng ý hủy</text>
      </g>
      <g transform="translate(145, 72)">
        <rect width="140" height="32" rx="6" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>
        <text x="70" y="20" font-size="11" font-weight="800" fill="#475569" text-anchor="middle">Bỏ qua / Giữ lại</text>
      </g>
    </g>

    <text x="15" y="226" font-size="11" font-weight="800" fill="#92400E">Cơ chế kỹ thuật LangGraph:</text>
    <text x="15" y="244" font-size="10.5" font-weight="600" fill="#78350F">Lệnh interrupt() tạm dừng luồng an toàn,</text>
    <text x="15" y="260" font-size="10.5" font-weight="600" fill="#78350F">chờ nhận tín hiệu confirm mới resume().</text>
  </g>

  <!-- Horizontal Arrow from HITL to Backend Execution with clear descriptive label -->
  <line x1="1235" y1="810" x2="1270" y2="810" stroke="#1D4ED8" stroke-width="2.8"/>
  {draw_arrow(1270, 810, "right", color="#1D4ED8", size=12)}
  <g transform="translate(1252, 785)">
    <rect x="-85" y="-12" width="170" height="24" rx="5" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.2" class="subtle-shadow"/>
    <text x="0" y="4" font-size="9.5" font-weight="900" fill="#1D4ED8" text-anchor="middle">
      resume() sau khi nhấn Duyệt
    </text>
  </g>

  <!-- =========================================================================
       7. LOWER TIER (RIGHT): KIỂM TRA ĐIỀU KIỆN & THỰC THI (x=1270, y=730, w=325)
       ========================================================================= -->
  <!-- Box: Backend Action Check (x=1270, y=730, w=325, h=165) -->
  <g id="Card_BackendCheck" transform="translate(1270, 730)">
    <rect width="325" height="165" rx="14" fill="#F8FAFC" stroke="#64748B" stroke-width="2" class="card-shadow"/>
    
    <rect x="15" y="10" width="235" height="22" rx="4" fill="#334155"/>
    <text x="132" y="25" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">KIỂM TRA ĐIỀU KIỆN &amp; THỰC THI</text>

    <!-- Mini Sub-step 1 -->
    <rect x="15" y="44" width="295" height="30" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="25" y="63" font-size="11" font-weight="700" fill="#0F172A">Check quyền sở hữu đơn hàng (Ownership)</text>

    <!-- Mini Sub-step 2 -->
    <rect x="15" y="82" width="295" height="30" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="25" y="101" font-size="11" font-weight="700" fill="#0F172A">Check trạng thái đơn tại thời điểm thực tế</text>

    <!-- Mini Sub-step 3 -->
    <rect x="15" y="120" width="295" height="30" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    <text x="25" y="139" font-size="11" font-weight="700" fill="#DC2626">Cập nhật CANCELLED &amp; Ghi Audit Log</text>
  </g>

  <!-- Vertical Drop to Audit DB -->
  <line x1="1430" y1="895" x2="1430" y2="925" stroke="#1D4ED8" stroke-width="2.8"/>
  {draw_arrow(1430, 925, "down", color="#1D4ED8", size=11)}

  <!-- Box: Audit Trail DB (x=1270, y=925, w=325, h=80) -->
  <g id="Box_AuditDb" transform="translate(1270, 925)">
    <rect width="325" height="80" rx="14" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="2" class="card-shadow"/>
    
    <g transform="translate(20, 22)">
      <rect x="0" y="0" width="22" height="22" rx="3" fill="#1D4ED8"/>
      <path d="M 6 11 L 10 15 L 18 7" fill="none" stroke="#FFFFFF" stroke-width="2.2"/>
    </g>

    <text x="65" y="34" font-size="15" font-weight="900" fill="#1E40AF">Audit Trail Database</text>
    <text x="65" y="56" font-size="12.5" font-weight="700" fill="#1D4ED8">(ai_agent_audit_logs - Bất biến)</text>
  </g>

  <!-- =========================================================================
       8. RIGHT COLUMN: OBSERVABILITY, BACKEND, FRAMEWORK MATRIX & STEP SUMMARY
       (x=1650, w=460) - EXPANDED WIDTH FOR SUPREME READABILITY
       ========================================================================= -->

  <!-- CARD 8.1: OBSERVABILITY & TRACING (x=1650, y=125, w=460, h=225) -->
  <g id="Card_Observability" transform="translate(1650, 125)">
    <rect width="460" height="225" rx="16" fill="url(#obsGrad)" stroke="#A855F7" stroke-width="2" class="card-shadow"/>
    
    <!-- Top Pill Badge -->
    <rect x="18" y="12" width="285" height="24" rx="4" fill="#7E22CE"/>
    <text x="160" y="28" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">📡 OBSERVABILITY &amp; TRACING</text>

    <!-- Radar / Activity Icon -->
    <g transform="translate(405, 12)">
      <circle cx="12" cy="12" r="10" fill="none" stroke="#7E22CE" stroke-width="2"/>
      <circle cx="12" cy="12" r="5" fill="none" stroke="#7E22CE" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="2" fill="#7E22CE"/>
    </g>

    <text x="18" y="60" font-size="16.5" font-weight="900" fill="#581C87">LangSmith / Arize Phoenix</text>
    <text x="260" y="60" font-size="12.5" font-weight="700" fill="#9333EA">(OpenTelemetry)</text>

    <!-- 4 Observability Metrics Boxes with comfortable spacing -->
    <g transform="translate(18, 74)">
      <rect width="424" height="30" rx="4" fill="#FFFFFF" stroke="#E9D5FF" stroke-width="1"/>
      <text x="10" y="19" font-size="11.5" font-weight="800" fill="#6B21A8">🔍 Trace ID Xuyên Suốt:</text>
      <text x="165" y="19" font-size="11" font-weight="600" fill="#334155">Đồng bộ từ Gateway -> Các Agent Nodes</text>

      <rect y="36" width="424" height="30" rx="4" fill="#FFFFFF" stroke="#E9D5FF" stroke-width="1"/>
      <text x="10" y="55" font-size="11.5" font-weight="800" fill="#6B21A8">⏱️ Per-Node Latency:</text>
      <text x="155" y="55" font-size="11" font-weight="600" fill="#334155">Đo độ trễ chính xác từng bước (ms)</text>

      <rect y="72" width="424" height="30" rx="4" fill="#FFFFFF" stroke="#E9D5FF" stroke-width="1"/>
      <text x="10" y="91" font-size="11.5" font-weight="800" fill="#6B21A8">💰 Token Burn Analytics:</text>
      <text x="165" y="91" font-size="11" font-weight="600" fill="#334155">Theo dõi chi phí token theo thời gian thực</text>

      <rect y="108" width="424" height="30" rx="4" fill="#FFFFFF" stroke="#E9D5FF" stroke-width="1"/>
      <text x="10" y="127" font-size="11.5" font-weight="800" fill="#DC2626">🚨 Circuit Catching:</text>
      <text x="145" y="127" font-size="11" font-weight="700" fill="#BE123C">Bắt điểm đứt gãy khi luồng bị gián đoạn</text>
    </g>
  </g>

  <!-- Telemetry Tap Line: LangGraph -> Observability with prominent label -->
  <line x1="1590" y1="215" x2="1650" y2="215" stroke="#9333EA" stroke-width="2.5" stroke-dasharray="5,4"/>
  {draw_arrow(1650, 215, "right", color="#9333EA", size=10)}
  <g transform="translate(1620, 195)">
    <rect x="-48" y="-10" width="96" height="20" rx="4" fill="#FAF5FF" stroke="#A855F7" stroke-width="1.2" class="subtle-shadow"/>
    <text x="0" y="4" font-size="9" font-weight="900" fill="#7E22CE" text-anchor="middle">OTEL TELEMETRY</text>
  </g>

  <!-- CARD 8.2: BACKEND NESTJS CONTAINER (x=1650, y=365, w=460, h=225) -->
  <g id="Card_Backend" transform="translate(1650, 365)">
    <rect width="460" height="225" rx="16" fill="#FEF3C7" stroke="#FBBF24" stroke-width="2" class="card-shadow"/>
    
    <!-- Role Pill Badge -->
    <rect x="20" y="12" width="285" height="24" rx="4" fill="#D97706"/>
    <text x="162" y="28" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">💾 THỰC THI GIAO DỊCH &amp; AUDIT TRAIL</text>

    <!-- Green Checkmark Icon -->
    <g transform="translate(405, 12)">
      <circle cx="14" cy="14" r="14" fill="#10B981"/>
      <path d="M 8 14 L 12 18 L 20 10" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
    </g>

    <text x="20" y="62" font-size="17.5" font-weight="900" fill="#78350F">Backend Microservices</text>
    <text x="250" y="62" font-size="13" font-weight="800" fill="#92400E">(NestJS Core)</text>

    <!-- 4 Function Bullet Boxes with relaxed padding -->
    <g transform="translate(20, 76)">
      <rect width="420" height="30" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
      <text x="10" y="19" font-size="11.5" font-weight="800" fill="#1E293B">✓  Kiểm tra quyền:</text>
      <text x="145" y="19" font-size="11" font-weight="600" fill="#475569">Xác thực JWT Token &amp; Shop Role</text>

      <rect y="36" width="420" height="30" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
      <text x="10" y="55" font-size="11.5" font-weight="800" fill="#1E293B">✓  Đối chiếu điều kiện:</text>
      <text x="165" y="55" font-size="11" font-weight="600" fill="#475569">Check ràng buộc nghiệp vụ lần cuối</text>

      <rect y="72" width="420" height="30" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
      <text x="10" y="91" font-size="11.5" font-weight="800" fill="#1E293B">✓  Thực thi giao dịch:</text>
      <text x="160" y="91" font-size="11" font-weight="600" fill="#475569">UPDATE shipments thành CANCELLED</text>

      <rect y="108" width="420" height="30" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
      <text x="10" y="127" font-size="11.5" font-weight="800" fill="#1E293B">✓  Ghi Audit Log:</text>
      <text x="140" y="127" font-size="11" font-weight="700" fill="#DC2626">Lưu vết AI + chữ ký HITL chống chối bỏ</text>
    </g>
  </g>

  <!-- CARD 8.3: HỆ THỐNG LOGISTICS APIS CONTAINER (x=1650, y=605, w=460, h=90) -->
  <g id="Card_LogisticsApis" transform="translate(1650, 605)">
    <rect width="460" height="90" rx="14" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1.8" class="card-shadow"/>
    <text x="230" y="26" font-size="13.5" font-weight="900" fill="#0F172A" text-anchor="middle">Hệ thống Logistics APIs Nội Bộ (NestJS :3000 - :3012)</text>

    <!-- Mini API Button Pills -->
    <g transform="translate(18, 36)">
      <rect width="130" height="40" rx="6" fill="#F0F9FF" stroke="#BAE6FD" stroke-width="1.2"/>
      <text x="65" y="25" font-size="11" font-weight="800" fill="#0369A1" text-anchor="middle">🔍 Tra cứu (:3008)</text>
    </g>

    <g transform="translate(162, 36)">
      <rect width="125" height="40" rx="6" fill="#FEF2F2" stroke="#FECACA" stroke-width="1.2"/>
      <text x="62" y="25" font-size="11" font-weight="800" fill="#991B1B" text-anchor="middle">🛑 Hủy đơn (:3002)</text>
    </g>

    <g transform="translate(302, 36)">
      <rect width="140" height="40" rx="6" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1.2"/>
      <text x="70" y="25" font-size="11" font-weight="800" fill="#166534" text-anchor="middle">⚖️ Bồi thường (:3010)</text>
    </g>
  </g>

  <!-- Two-way link Backend <-> Logistics APIs -->
  <line x1="1880" y1="590" x2="1880" y2="605" stroke="#1E293B" stroke-width="2"/>
  {draw_arrow(1880, 605, "down", color="#1E293B", size=8)}
  {draw_arrow(1880, 590, "up", color="#1E293B", size=8)}

  <!-- Two-way connector between Operation Agent & Backend APIs with prominent label -->
  <path d="M 1590 515 L 1650 515" fill="none" stroke="#1D4ED8" stroke-width="2.8"/>
  {draw_arrow(1650, 515, "right", color="#1D4ED8", size=12)}
  <g transform="translate(1620, 495)">
    <rect x="-48" y="-10" width="96" height="20" rx="4" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="1.2" class="subtle-shadow"/>
    <text x="0" y="4" font-size="9" font-weight="900" fill="#1D4ED8" text-anchor="middle">REST Tool Call</text>
  </g>

  <!-- Connection from Backend Execution to Backend Card with clear label -->
  <path d="M 1590 810 L 1650 810" fill="none" stroke="#D97706" stroke-width="2.8"/>
  {draw_arrow(1650, 810, "right", color="#D97706", size=12)}
  <g transform="translate(1620, 790)">
    <rect x="-42" y="-10" width="84" height="20" rx="4" fill="#FFFBEB" stroke="#D97706" stroke-width="1.2" class="subtle-shadow"/>
    <text x="0" y="4" font-size="9" font-weight="900" fill="#D97706" text-anchor="middle">Lệnh Ghi DB</text>
  </g>

  <!-- =========================================================================
       CARD 8.4: DUAL-FRAMEWORK ARCHITECTURAL MATRIX (LANGGRAPH vs. LANGCHAIN)
       (x=1650, y=715, w=460, h=230)
       ========================================================================= -->
  <g id="Card_FrameworkRoles" transform="translate(1650, 715)">
    <rect width="460" height="230" rx="14" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2" class="card-shadow"/>
    <rect width="460" height="36" rx="14 14 0 0" fill="#312E81"/>
    <text x="230" y="24" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">
      ⚡ PHÂN ĐỊNH VAI TRÒ: LANGGRAPH vs. LANGCHAIN
    </text>

    <!-- Column 1: LangGraph (State & Orchestrator - "Bộ Não") -->
    <g transform="translate(15, 48)">
      <rect width="208" height="168" rx="8" fill="#EEF2FF" stroke="#A5B4FC" stroke-width="1.2"/>
      <rect x="8" y="8" width="192" height="22" rx="4" fill="#4338CA"/>
      <text x="104" y="23" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">🌐 LANGGRAPH (BỘ NÃO)</text>
      
      <text x="8" y="46" font-size="10" font-weight="800" fill="#3730A3">• StateGraph DAG:</text>
      <text x="8" y="60" font-size="9.5" font-weight="600" fill="#334155">Đồ thị điều phối luồng chu trình</text>
      
      <text x="8" y="78" font-size="10" font-weight="800" fill="#3730A3">• Shared Context State:</text>
      <text x="8" y="92" font-size="9.5" font-weight="600" fill="#334155">Tuần hoàn tuple trạng thái tập trung</text>
      
      <text x="8" y="110" font-size="10" font-weight="800" fill="#3730A3">• Human-in-the-Loop:</text>
      <text x="8" y="124" font-size="9.5" font-weight="600" fill="#334155">Lệnh ngắt interrupt() an toàn</text>
      
      <text x="8" y="142" font-size="10" font-weight="800" fill="#3730A3">• State Checkpointing:</text>
      <text x="8" y="156" font-size="9.5" font-weight="600" fill="#334155">Lưu snapshot chống sập phiên</text>
    </g>

    <!-- Column 2: LangChain (Tools & Integrator - "Đôi Tay") -->
    <g transform="translate(237, 48)">
      <rect width="208" height="168" rx="8" fill="#ECFDF5" stroke="#86EFAC" stroke-width="1.2"/>
      <rect x="8" y="8" width="192" height="22" rx="4" fill="#059669"/>
      <text x="104" y="23" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">🦜 LANGCHAIN (CÔNG CỤ)</text>
      
      <text x="8" y="46" font-size="10" font-weight="800" fill="#065F46">• Multi-LLM Adapters:</text>
      <text x="8" y="60" font-size="9.5" font-weight="600" fill="#334155">Chuẩn hóa 4 hãng AI Big 4</text>
      
      <text x="8" y="78" font-size="10" font-weight="800" fill="#065F46">• Tool Calling (@tool):</text>
      <text x="8" y="92" font-size="9.5" font-weight="600" fill="#334155">Đóng gói API :3008, :3012</text>
      
      <text x="8" y="110" font-size="10" font-weight="800" fill="#065F46">• Hybrid RAG Pipeline:</text>
      <text x="8" y="124" font-size="9.5" font-weight="600" fill="#334155">Loader + Splitter + pgvector</text>
      
      <text x="8" y="142" font-size="10" font-weight="800" fill="#065F46">• Structured Parsers:</text>
      <text x="8" y="156" font-size="9.5" font-weight="600" fill="#334155">Ép kiểu JSON DTO NestJS</text>
    </g>
  </g>

  <!-- CARD 8.5: STEP SUMMARY CARD (BOTTOM RIGHT) (x=1650, y=960, w=460, h=180) -->
  <g id="Card_StepSummary" transform="translate(1650, 960)">
    <rect width="460" height="180" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8" class="card-shadow"/>
    <rect width="460" height="34" rx="14 14 0 0" fill="#0F4C81"/>
    <text x="230" y="23" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">Tóm tắt luồng hoạt động khép kín (6 Bước)</text>

    <!-- 6 Summary items in 2 Columns with generous spacing -->
    <g transform="translate(18, 48)">
      <!-- Col 1 -->
      <circle cx="9" cy="9" r="8" fill="#1D4ED8"/>
      <text x="9" y="13" font-size="9" font-weight="900" fill="#FFFFFF" text-anchor="middle">1</text>
      <text x="25" y="13" font-size="11" font-weight="700" fill="#0F172A">Người dùng gửi yêu cầu</text>

      <circle cx="9" cy="45" r="8" fill="#1D4ED8"/>
      <text x="9" y="49" font-size="9" font-weight="900" fill="#FFFFFF" text-anchor="middle">2</text>
      <text x="25" y="49" font-size="11" font-weight="700" fill="#0F172A">Supervisor lập kế hoạch DAG</text>

      <circle cx="9" cy="81" r="8" fill="#1D4ED8"/>
      <text x="9" y="85" font-size="9" font-weight="900" fill="#FFFFFF" text-anchor="middle">3</text>
      <text x="25" y="85" font-size="11" font-weight="700" fill="#0F172A">Sub-Agents phối hợp RAG &amp; Tool</text>

      <!-- Col 2 -->
      <g transform="translate(225, 0)">
        <circle cx="9" cy="9" r="8" fill="#1D4ED8"/>
        <text x="9" y="13" font-size="9" font-weight="900" fill="#FFFFFF" text-anchor="middle">4</text>
        <text x="25" y="13" font-size="11" font-weight="700" fill="#0F172A">Xác nhận với khách (HITL)</text>

        <circle cx="9" cy="45" r="8" fill="#1D4ED8"/>
        <text x="9" y="49" font-size="9" font-weight="900" fill="#FFFFFF" text-anchor="middle">5</text>
        <text x="25" y="49" font-size="11" font-weight="700" fill="#0F172A">Thực thi giao dịch &amp; Ghi Audit</text>

        <circle cx="9" cy="81" r="8" fill="#1D4ED8"/>
        <text x="9" y="85" font-size="9" font-weight="900" fill="#FFFFFF" text-anchor="middle">6</text>
        <text x="25" y="85" font-size="11" font-weight="700" fill="#0F172A">Tổng hợp phản hồi SSE Stream</text>
      </g>
    </g>
  </g>

  <!-- =========================================================================
       ARROW ⑥: THỰC THI GIAO DỊCH -> KHÁCH HÀNG (UNDERGROUND HIGHWAY at y=1035)
       ========================================================================= -->
  <path d="M 1260 1005 L 1260 1035 L 125 1035 L 125 435" fill="none" stroke="#1D4ED8" stroke-width="3.2"/>
  {draw_arrow(125, 435, "up", color="#1D4ED8", size=14)}

  <!-- Number Badge ⑥ Protected Pill on Underground Highway with prominent text -->
  <g transform="translate(800, 1035)">
    <rect x="-260" y="-16" width="520" height="32" rx="16" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="2.2" class="subtle-shadow"/>
    <circle cx="-238" cy="0" r="11" fill="#1D4ED8"/>
    <text x="-238" y="4" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">6</text>
    <text x="12" y="4" font-size="11.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">
      ⑥ Hoàn tất giao dịch: Tổng hợp kết quả &amp; Stream SSE realtime về Client
    </text>
  </g>

  <!-- =========================================================================
       9. BOTTOM TECH STACK FOOTER BAR (x=45, y=1175, w=2070, h=98)
       ========================================================================= -->
  <g id="Bar_TechStack" transform="translate(45, 1175)">
    <rect width="2070" height="98" rx="16" fill="#F0F7FF" stroke="#BAE6FD" stroke-width="2" class="card-shadow"/>
    
    <!-- Left Blue Pill Badge -->
    <rect x="0" y="0" width="230" height="34" rx="16 0 16 0" fill="#0284C7"/>
    <text x="115" y="22" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">Hạ tầng &amp; Công nghệ</text>

    <!-- 6 Technology Items Spaced Generously Across 2070px -->
    <!-- Item 1: Framework AI -->
    <g transform="translate(35, 50)">
      <circle cx="16" cy="16" r="15" fill="#EEF2FF"/>
      <circle cx="10" cy="12" r="2.5" fill="#4F46E5"/>
      <circle cx="22" cy="12" r="2.5" fill="#4F46E5"/>
      <circle cx="16" cy="22" r="2.5" fill="#4F46E5"/>
      <line x1="10" y1="12" x2="22" y2="12" stroke="#4F46E5" stroke-width="1.2"/>
      <line x1="10" y1="12" x2="16" y2="22" stroke="#4F46E5" stroke-width="1.2"/>
      <line x1="22" y1="12" x2="16" y2="22" stroke="#4F46E5" stroke-width="1.2"/>

      <text x="42" y="14" font-size="12.5" font-weight="800" fill="#0F172A">AI Orchestration</text>
      <text x="42" y="29" font-size="11.5" font-weight="600" fill="#4F46E5">LangGraph (State) + LangChain</text>
    </g>

    <line x1="360" y1="45" x2="360" y2="88" stroke="#CBD5E1" stroke-width="1.2"/>

    <!-- Item 2: Cloud Free-Tier -->
    <g transform="translate(390, 50)">
      <circle cx="16" cy="16" r="15" fill="#E0F2FE"/>
      <polygon points="17,5 10,17 16,17 15,27 22,15 16,15" fill="#0284C7"/>
      
      <text x="42" y="14" font-size="12.5" font-weight="800" fill="#0F172A">Cloud Free-Tier</text>
      <text x="42" y="29" font-size="11.5" font-weight="600" fill="#64748B">Groq LPU + Google AI Studio</text>
    </g>

    <line x1="720" y1="45" x2="720" y2="88" stroke="#CBD5E1" stroke-width="1.2"/>

    <!-- Item 3: Semantic Cache & DB -->
    <g transform="translate(750, 50)">
      <circle cx="16" cy="16" r="15" fill="#E0F2FE"/>
      <ellipse cx="16" cy="10" rx="8" ry="3" fill="#0284C7"/>
      <path d="M 8 10 L 8 22 C 8 24 11 26 16 26 C 21 26 24 24 24 22 L 24 10 Z" fill="#0284C7" opacity="0.8"/>

      <text x="42" y="14" font-size="12.5" font-weight="800" fill="#0F172A">Database &amp; Caching</text>
      <text x="42" y="29" font-size="11.5" font-weight="600" fill="#64748B">PostgreSQL + pgvector &amp; Redis</text>
    </g>

    <line x1="1100" y1="45" x2="1100" y2="88" stroke="#CBD5E1" stroke-width="1.2"/>

    <!-- Item 4: Heterogeneous Models -->
    <g transform="translate(1130, 50)">
      <circle cx="16" cy="16" r="15" fill="#E0F2FE"/>
      <!-- Multi-star icon -->
      <polygon points="16,4 19,12 28,12 21,17 24,25 16,20 8,25 11,17 4,12 13,12" fill="#0284C7"/>

      <text x="42" y="14" font-size="12.5" font-weight="800" fill="#0F172A">Bộ Tứ Big 4 (Heterogeneous)</text>
      <text x="42" y="29" font-size="11" font-weight="700" fill="#1E40AF">Google • Alibaba • Meta • NVIDIA</text>
    </g>

    <line x1="1470" y1="45" x2="1470" y2="88" stroke="#CBD5E1" stroke-width="1.2"/>

    <!-- Item 5: Observability -->
    <g transform="translate(1500, 50)">
      <circle cx="16" cy="16" r="15" fill="#F3E8FF"/>
      <circle cx="16" cy="16" r="7.5" fill="none" stroke="#7E22CE" stroke-width="2"/>
      <circle cx="16" cy="16" r="2.5" fill="#7E22CE"/>

      <text x="42" y="14" font-size="12.5" font-weight="800" fill="#0F172A">Observability</text>
      <text x="42" y="29" font-size="11.5" font-weight="600" fill="#64748B">LangSmith / OpenTelemetry</text>
    </g>

    <line x1="1810" y1="45" x2="1810" y2="88" stroke="#CBD5E1" stroke-width="1.2"/>

    <!-- Item 6: API Gateway -->
    <g transform="translate(1840, 50)">
      <circle cx="16" cy="16" r="15" fill="#FEE2E2"/>
      <path d="M 9 22 C 9 14 13 10 18 10 C 23 10 27 14 27 22 Z" fill="#E11D48"/>
      <polygon points="12,12 10,7 16,10" fill="#E11D48"/>
      <polygon points="24,12 26,7 20,10" fill="#E11D48"/>

      <text x="42" y="14" font-size="12.5" font-weight="800" fill="#0F172A">API Gateway</text>
      <text x="42" y="29" font-size="11.5" font-weight="600" fill="#64748B">NestJS Gateway BFF</text>
    </g>
  </g>

</svg>
''')

    svg_content = "\n".join(lines)
    os.makedirs(os.path.dirname(OUTPUT_SVG), exist_ok=True)
    with open(OUTPUT_SVG, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated Production-Grade Architecture SVG: {OUTPUT_SVG}")

if __name__ == "__main__":
    build_svg()
