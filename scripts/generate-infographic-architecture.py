#!/usr/bin/env python3
"""
generate-infographic-architecture.py
Ultra-clean, spacious, and prominent Modern Technical Architecture Infographic.
- Canvas: 1920 x 1140 (Expanded Widescreen, zero crowded text, ample padding).
- Distinct Role Tag Pills and bold capability callouts on every agent.
- Dedicated Manhattan Orthogonal Highways (Zero-collision arrows).
- Free-Tier & Open-Source models: Gemini Flash, Qwen 2.5, Llama 3.3 70B, Llama 3.1 8B, pgvector.
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
    W = 1920
    H = 1140
    lines = []

    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&amp;family=JetBrains+Mono:wght@700;800;900&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }}
      .mono {{ font-family: 'JetBrains Mono', monospace; }}
      .card-shadow {{ filter: drop-shadow(0 4px 16px rgba(15, 23, 42, 0.07)); }}
      .subtle-shadow {{ filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.05)); }}
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
  <g id="Header_Banner" transform="translate({W//2}, 42)">
    <rect x="-450" y="-22" width="900" height="46" rx="23" fill="url(#topPillGrad)" class="card-shadow"/>
    
    <!-- White Delivery Truck Icon -->
    <g transform="translate(-410, -11)">
      <path d="M 0 5 L 14 5 L 18 10 L 25 10 L 25 17 L 0 17 Z" fill="#FFFFFF"/>
      <rect x="0" y="2" width="13" height="15" fill="#FFFFFF" rx="1"/>
      <circle cx="6" cy="18" r="3" fill="#1E40AF" stroke="#FFFFFF" stroke-width="1.8"/>
      <circle cx="19" cy="18" r="3" fill="#1E40AF" stroke="#FFFFFF" stroke-width="1.8"/>
    </g>

    <text x="-375" y="8" font-size="21" font-weight="900" fill="#FFFFFF" letter-spacing="-0.01em">
      Multi-Agent Logistics Chatbot – Kiến Trúc Tổng Thể
    </text>

    <!-- Subtitle below pill -->
    <text x="0" y="44" font-size="14" font-weight="700" fill="#475569" text-anchor="middle" font-style="italic">
      Kết hợp RAG, quản lý Context/Memory, và kiểm soát giao dịch để tự động hóa quy trình hỗ trợ khách hàng
    </text>
  </g>

  <!-- =========================================================================
       2. TOP DASHED CONTAINER: SUPERVISOR & SHARED MEMORY (x=280, y=115, w=1080, h=215)
       ========================================================================= -->
  <rect x="280" y="115" width="1080" height="215" rx="16" fill="none" stroke="#A5B4FC" stroke-width="1.8" stroke-dasharray="6,4"/>

  <!-- Pill Header on border: LangChain | LangGraph -->
  <g transform="translate(360, 115)">
    <rect x="-10" y="-18" width="580" height="36" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" class="subtle-shadow"/>
    
    <!-- LangChain Parrot -->
    <g transform="translate(15, -9)">
      <path d="M 4 12 C 4 6 8 2 14 2 C 18 2 20 5 20 8 C 20 13 16 16 12 18 C 10 19 8 20 6 22 L 3 20 Z" fill="#10B981"/>
      <circle cx="12" cy="7" r="1.5" fill="#FFFFFF"/>
      <path d="M 6 16 L 0 17 L 3 14 Z" fill="#F59E0B"/>
    </g>
    <text x="45" y="6" font-size="14" font-weight="800" fill="#0F172A">LangChain</text>
    <text x="135" y="6" font-size="14" font-weight="400" fill="#94A3B8">|</text>

    <!-- LangGraph Node Graph Icon -->
    <g transform="translate(155, -8)">
      <circle cx="4" cy="5" r="3" fill="#3B82F6"/>
      <circle cx="16" cy="5" r="3" fill="#3B82F6"/>
      <circle cx="10" cy="15" r="3" fill="#3B82F6"/>
      <line x1="4" y1="5" x2="16" y2="5" stroke="#3B82F6" stroke-width="1.5"/>
      <line x1="4" y1="5" x2="10" y2="15" stroke="#3B82F6" stroke-width="1.5"/>
      <line x1="16" y1="5" x2="10" y2="15" stroke="#3B82F6" stroke-width="1.5"/>
    </g>
    <text x="185" y="6" font-size="14" font-weight="800" fill="#0F172A">LangGraph</text>

    <!-- Purple/Blue Pill Tag -->
    <rect x="280" y="-13" width="270" height="26" rx="13" fill="#3B82F6"/>
    <text x="415" y="4" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">
      Điều phối Multi-Agent Workflow
    </text>
  </g>

  <!-- SUPERVISOR AGENT CARD (x=310, y=150, w=450, h=160) -->
  <g id="Card_Supervisor" transform="translate(310, 150)">
    <rect width="450" height="160" rx="14" fill="url(#supervisorCardGrad)" stroke="#1D4ED8" stroke-width="2" class="card-shadow"/>
    
    <!-- Top Role Badge -->
    <rect x="20" y="14" width="230" height="22" rx="4" fill="#3B82F6"/>
    <text x="135" y="29" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">★ TRƯỞNG PHÒNG ĐIỀU PHỐI (CHỈ HUY)</text>

    <!-- Gemini Sparkle Icon -->
    <g transform="translate(390, 16)">
      <path d="M 14 0 C 14 8 20 14 28 14 C 20 14 14 20 14 28 C 14 20 8 14 0 14 C 8 14 14 8 14 0 Z" fill="url(#geminiSparkle)"/>
    </g>

    <text x="20" y="64" font-size="18" font-weight="900" fill="#FFFFFF">Supervisor Agent</text>
    <text x="195" y="64" font-size="13" font-weight="800" fill="#93C5FD">(Gemini Flash - Free Tier)</text>

    <!-- 3 Core Highlight Capabilities -->
    <g transform="translate(20, 86)">
      <text x="0" y="12" font-size="12" font-weight="700" fill="#67E8F9">• Phân tích Intent:</text>
      <text x="110" y="12" font-size="11.5" font-weight="500" fill="#E2E8F0">Nhận diện FAQ, tra cứu cước hay yêu cầu hủy</text>

      <text x="0" y="32" font-size="12" font-weight="700" fill="#67E8F9">• Lập kế hoạch DAG:</text>
      <text x="122" y="32" font-size="11.5" font-weight="500" fill="#E2E8F0">Chia nhỏ nhiệm vụ cho các Sub-agents</text>

      <text x="0" y="52" font-size="12" font-weight="700" fill="#67E8F9">• Tổng hợp SSE Stream:</text>
      <text x="145" y="52" font-size="11.5" font-weight="500" fill="#E2E8F0">Gom dữ liệu phản hồi mượt mà cho Client</text>
    </g>
  </g>

  <!-- CONTEXT & MEMORY CARD (x=880, y=150, w=450, h=160) -->
  <g id="Card_ContextMemory" transform="translate(880, 150)">
    <rect width="450" height="160" rx="14" fill="#F8FAFC" stroke="#60A5FA" stroke-width="1.8" stroke-dasharray="6,4" class="card-shadow"/>
    
    <!-- Top Role Badge -->
    <rect x="20" y="14" width="220" height="22" rx="4" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
    <text x="130" y="29" font-size="10.5" font-weight="900" fill="#1E40AF" text-anchor="middle">🧠 BỘ NHỚ TRẠNG THÁI CHIA SẺ</text>

    <!-- Blue Database Cylinder Icon -->
    <g transform="translate(395, 14)">
      <ellipse cx="14" cy="8" rx="14" ry="5" fill="#3B82F6"/>
      <path d="M 0 8 L 0 24 C 0 28 6 31 14 31 C 22 31 28 28 28 24 L 28 8 Z" fill="#60A5FA" opacity="0.8"/>
      <ellipse cx="14" cy="16" rx="14" ry="4.5" fill="none" stroke="#FFFFFF" stroke-width="1"/>
      <ellipse cx="14" cy="24" rx="14" ry="4.5" fill="none" stroke="#FFFFFF" stroke-width="1"/>
    </g>

    <text x="20" y="64" font-size="16" font-weight="900" fill="#0F172A">Context &amp; Memory</text>
    <text x="180" y="64" font-size="13" font-weight="700" fill="#2563EB">(Shared State via LangGraph)</text>

    <!-- 4 Memory Items in 2 Columns -->
    <g transform="translate(20, 86)">
      <rect width="195" height="26" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
      <text x="10" y="17" font-size="11" font-weight="700" fill="#334155">💬 Lịch sử hội thoại đầy đủ</text>

      <rect x="210" y="0" width="195" height="26" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
      <text x="220" y="17" font-size="11" font-weight="700" fill="#334155">👤 Thông tin vai trò User/Shop</text>

      <rect x="0" y="32" width="195" height="26" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
      <text x="10" y="49" font-size="11" font-weight="700" fill="#334155">⏳ Trạng thái xử lý đa bước</text>

      <rect x="210" y="32" width="195" height="26" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
      <text x="220" y="49" font-size="11" font-weight="700" fill="#334155">📦 Dữ liệu tạm của các Agent</text>
    </g>
  </g>

  <!-- Horizontal connector: Supervisor <-> Context & Memory -->
  <line x1="760" y1="230" x2="880" y2="230" stroke="#1D4ED8" stroke-width="2.2"/>
  {draw_arrow(880, 230, "right", color="#1D4ED8", size=10)}
  {draw_arrow(760, 230, "left", color="#1D4ED8", size=10)}
  
  <g transform="translate(820, 218)">
    <rect x="-42" y="-11" width="84" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
    <text x="0" y="4" font-size="10" font-weight="800" fill="#1D4ED8" text-anchor="middle">State Bus</text>
  </g>

  <!-- =========================================================================
       3. LEFT COLUMN: KHÁCH HÀNG (WEB/APP) (x=45, y=160, w=160)
       ========================================================================= -->
  <g id="Col_Customer" transform="translate(45, 160)">
    <!-- Speech bubble -->
    <rect x="0" y="0" width="160" height="74" rx="10" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1.8"/>
    <polygon points="20,74 35,74 25,86" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1.8"/>
    <rect x="18" y="72" width="20" height="4" fill="#EFF6FF"/> <!-- mask seam -->
    
    <!-- Three dots -->
    <circle cx="25" cy="20" r="2.5" fill="#3B82F6"/>
    <circle cx="35" cy="20" r="2.5" fill="#3B82F6"/>
    <circle cx="45" cy="20" r="2.5" fill="#3B82F6"/>

    <text x="25" y="42" font-size="12" font-weight="800" fill="#1E40AF">"Hủy vận đơn</text>
    <text x="25" y="60" font-size="12" font-weight="800" fill="#1E40AF">NX001"</text>

    <!-- User Illustration Container -->
    <rect x="0" y="95" width="160" height="155" rx="16" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="2" class="subtle-shadow"/>
    
    <!-- Stylized Flat Character -->
    <circle cx="80" cy="140" r="24" fill="#FDBA74"/>
    <path d="M 57 135 C 57 118 69 112 91 112 C 102 112 105 119 105 126 C 99 121 86 121 77 128 Z" fill="#1E293B"/>
    <path d="M 53 182 C 53 164 67 160 80 160 C 93 160 107 164 107 182 Z" fill="#3B82F6"/>
    <!-- Smartphone held -->
    <rect x="90" y="154" width="16" height="28" rx="3" fill="#1E293B"/>
    <rect x="92" y="156" width="12" height="22" rx="2" fill="#93C5FD"/>

    <text x="80" y="215" font-size="14.5" font-weight="900" fill="#0F172A" text-anchor="middle">Khách hàng</text>
    <text x="80" y="235" font-size="12" font-weight="700" fill="#64748B" text-anchor="middle">(Web / Mobile App)</text>
  </g>

  <!-- =========================================================================
       ARROW ①: Customer -> Supervisor (Spacious clear channel at y=230)
       ========================================================================= -->
  <line x1="205" y1="230" x2="310" y2="230" stroke="#1D4ED8" stroke-width="2.8"/>
  {draw_arrow(310, 230, "right", color="#1D4ED8", size=13)}

  <!-- Badge ① Protected Pill -->
  <g transform="translate(257, 230)">
    <circle cx="0" cy="0" r="14" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="2"/>
    <text x="0" y="5" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">1</text>
    
    <rect x="-42" y="18" width="84" height="22" rx="4" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="1.2"/>
    <text x="0" y="33" font-size="10.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">Gửi yêu cầu</text>
  </g>

  <!-- =========================================================================
       4. MIDDLE DASHED CONTAINER: 3 SUB-AGENTS (x=280, y=390, w=1080, h=250)
       ========================================================================= -->
  <rect x="280" y="390" width="1080" height="250" rx="16" fill="none" stroke="#A5B4FC" stroke-width="1.8" stroke-dasharray="6,4"/>

  <!-- =========================================================================
       ARROW ②: DISTRIBUTION HIGHWAY BUS FROM SUPERVISOR DOWN TO 3 SUB-AGENTS
       Zero collision: drops to y=355, branches horizontally, and drops cleanly into each card.
       ========================================================================= -->
  <line x1="535" y1="310" x2="535" y2="355" stroke="#1D4ED8" stroke-width="2.8"/>
  <line x1="475" y1="355" x2="1195" y2="355" stroke="#1D4ED8" stroke-width="2.8"/>
  
  <!-- Branch 1 into Knowledge Agent -->
  <line x1="475" y1="355" x2="475" y2="420" stroke="#1D4ED8" stroke-width="2.8"/>
  {draw_arrow(475, 420, "down", color="#1D4ED8", size=12)}

  <!-- Branch 2 into Operation Agent -->
  <line x1="820" y1="355" x2="820" y2="420" stroke="#1D4ED8" stroke-width="2.8"/>
  {draw_arrow(820, 420, "down", color="#1D4ED8", size=12)}

  <!-- Branch 3 into Validation Agent -->
  <line x1="1175" y1="355" x2="1175" y2="420" stroke="#1D4ED8" stroke-width="2.8"/>
  {draw_arrow(1175, 420, "down", color="#1D4ED8", size=12)}

  <!-- Badge ② Pill at center of distribution bus -->
  <g transform="translate(680, 355)">
    <rect x="-175" y="-14" width="350" height="28" rx="14" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="2" class="subtle-shadow"/>
    <circle cx="-155" cy="0" r="11" fill="#1D4ED8"/>
    <text x="-155" y="4" font-size="11.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">2</text>
    <text x="-135" y="4" font-size="12" font-weight="800" fill="#1D4ED8">Phân công nhiệm vụ theo Đồ thị trạng thái DAG</text>
  </g>

  <!-- =====================
       AGENT A: KNOWLEDGE AGENT (QWEN 2.5) (x=310, y=420, w=330, h=200)
       ===================== -->
  <g id="Card_KnowledgeAgent" transform="translate(310, 420)">
    <rect width="330" height="200" rx="14" fill="#F0F9FF" stroke="#38BDF8" stroke-width="2" class="card-shadow"/>
    
    <!-- Role Pill Badge -->
    <rect x="15" y="12" width="220" height="22" rx="4" fill="#0284C7"/>
    <text x="125" y="27" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">📖 CHUYÊN GIA TRI THỨC &amp; RAG</text>

    <!-- Logo icon -->
    <g transform="translate(285, 14)">
      <polygon points="12,2 22,8 22,20 12,26 2,20 2,8" fill="none" stroke="#0284C7" stroke-width="2"/>
      <circle cx="12" cy="14" r="3" fill="#0284C7"/>
    </g>

    <text x="15" y="58" font-size="16" font-weight="900" fill="#0F172A">Knowledge Agent</text>
    <text x="150" y="58" font-size="12" font-weight="800" fill="#0284C7">(Qwen 2.5 / Groq Free)</text>

    <!-- Distinct Function Highlights -->
    <g transform="translate(15, 78)">
      <rect width="300" height="32" rx="4" fill="#FFFFFF" stroke="#BAE6FD" stroke-width="1"/>
      <text x="8" y="20" font-size="11" font-weight="800" fill="#0369A1">⚖️ Luật Bưu chính:</text>
      <text x="110" y="20" font-size="10.5" font-weight="600" fill="#334155">Điều 25 (Đền bù 4x cước)</text>

      <rect y="38" width="300" height="32" rx="4" fill="#FFFFFF" stroke="#BAE6FD" stroke-width="1"/>
      <text x="8" y="58" font-size="11" font-weight="800" fill="#0369A1">📦 Quy chuẩn SOP:</text>
      <text x="115" y="58" font-size="10.5" font-weight="600" fill="#334155">Bọc bubble wrap ≥ 3 lớp</text>

      <rect y="76" width="300" height="32" rx="4" fill="#FFFFFF" stroke="#BAE6FD" stroke-width="1"/>
      <text x="8" y="96" font-size="11" font-weight="800" fill="#0369A1">🔍 Vector Citations:</text>
      <text x="122" y="96" font-size="10.5" font-weight="600" fill="#334155">Trích dẫn 100% điều khoản</text>
    </g>
  </g>

  <!-- =====================
       AGENT B: LOGISTICS OPERATION AGENT (LLAMA 3.3 70B) (x=660, y=420, w=330, h=200)
       ===================== -->
  <g id="Card_OperationAgent" transform="translate(660, 420)">
    <rect width="330" height="200" rx="14" fill="#F0FDF4" stroke="#34D399" stroke-width="2" class="card-shadow"/>
    
    <!-- Role Pill Badge -->
    <rect x="15" y="12" width="220" height="22" rx="4" fill="#059669"/>
    <text x="125" y="27" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">⚡ THAO TÁC NGHIỆP VỤ &amp; GỌI API</text>

    <!-- Infinity Icon -->
    <g transform="translate(285, 14)">
      <path d="M 4 14 C 4 8 10 8 15 14 C 20 20 26 20 26 14 C 26 8 20 8 15 14 C 10 20 4 20 4 14 Z" fill="none" stroke="#059669" stroke-width="2.5"/>
    </g>

    <text x="15" y="58" font-size="16" font-weight="900" fill="#065F46">Operation Agent</text>
    <text x="145" y="58" font-size="12" font-weight="800" fill="#059669">(Llama 3.3 70B / Groq)</text>

    <!-- Distinct Function Highlights -->
    <g transform="translate(15, 78)">
      <rect width="300" height="32" rx="4" fill="#FFFFFF" stroke="#BBF7D0" stroke-width="1"/>
      <text x="8" y="20" font-size="11" font-weight="800" fill="#15803D">🚚 Tra cứu Vận đơn:</text>
      <text x="125" y="20" font-size="10.5" font-weight="600" fill="#334155">GET :3008 (Vị trí Hub, Shipper)</text>

      <rect y="38" width="300" height="32" rx="4" fill="#FFFFFF" stroke="#BBF7D0" stroke-width="1"/>
      <text x="8" y="58" font-size="11" font-weight="800" fill="#15803D">📐 Tính cước IATA:</text>
      <text x="122" y="58" font-size="10.5" font-weight="600" fill="#334155">Cân nặng quy đổi V/6000</text>

      <rect y="76" width="300" height="32" rx="4" fill="#FFFFFF" stroke="#BBF7D0" stroke-width="1"/>
      <text x="8" y="96" font-size="11" font-weight="800" fill="#15803D">📝 Soạn Thảo Lệnh:</text>
      <text x="125" y="96" font-size="10.5" font-weight="600" fill="#334155">Chuẩn bị JSON DTO (Chưa lưu)</text>
    </g>
  </g>

  <!-- =====================
       AGENT C: VALIDATION AGENT (LLAMA 3.1 8B GUARDRAIL) (x=1010, y=420, w=330, h=200)
       ===================== -->
  <g id="Card_ValidationAgent" transform="translate(1010, 420)">
    <rect width="330" height="200" rx="14" fill="#FDF2F8" stroke="#F472B6" stroke-width="2" class="card-shadow"/>
    
    <!-- Role Pill Badge -->
    <rect x="15" y="12" width="220" height="22" rx="4" fill="#DC2626"/>
    <text x="125" y="27" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">🛡️ THANH TRA AN TOÀN &amp; RỦI RO</text>

    <!-- Shield Icon -->
    <g transform="translate(290, 14)">
      <path d="M 12 2 L 22 7 L 22 15 C 22 21 12 26 12 26 C 12 26 2 21 2 15 L 2 7 Z" fill="#DC2626"/>
      <path d="M 8 13 L 11 16 L 17 10" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    </g>

    <text x="15" y="58" font-size="16" font-weight="900" fill="#831843">Validation Agent</text>
    <text x="145" y="58" font-size="12" font-weight="800" fill="#BE185D">(Llama 3.1 8B / Free)</text>

    <!-- Distinct Function Highlights -->
    <g transform="translate(15, 78)">
      <rect width="300" height="32" rx="4" fill="#FFFFFF" stroke="#FECDD3" stroke-width="1"/>
      <text x="8" y="20" font-size="11" font-weight="800" fill="#BE123C">🔒 Check Phân Quyền:</text>
      <text x="130" y="20" font-size="10.5" font-weight="600" fill="#334155">Chặn sửa đơn người khác</text>

      <rect y="38" width="300" height="32" rx="4" fill="#FFFFFF" stroke="#FECDD3" stroke-width="1"/>
      <text x="8" y="58" font-size="11" font-weight="800" fill="#BE123C">🛑 Thẩm định Điều kiện:</text>
      <text x="145" y="58" font-size="10.5" font-weight="600" fill="#334155">Đã xuất kho xe tải = CẤM HỦY</text>

      <rect y="76" width="300" height="32" rx="4" fill="#FFFFFF" stroke="#FECDD3" stroke-width="1"/>
      <text x="8" y="96" font-size="11" font-weight="800" fill="#BE123C">⏸️ Kích hoạt Ngắt HITL:</text>
      <text x="140" y="96" font-size="10.5" font-weight="600" fill="#334155">Chờ khách ký duyệt trước khi ghi</text>
    </g>
  </g>

  <!-- Horizontal Two-way Collaboration Arrow between Operation & Validation -->
  <line x1="990" y1="520" x2="1010" y2="520" stroke="#1D4ED8" stroke-width="2.2"/>
  {draw_arrow(1010, 520, "right", color="#1D4ED8", size=8)}
  {draw_arrow(990, 520, "left", color="#1D4ED8", size=8)}

  <!-- =========================================================================
       5. LOWER TIER (LEFT): RAG PIPELINE & PGVECTOR (ALIGNED UNDER KNOWLEDGE AGENT)
       ========================================================================= -->
  <!-- Vertical Drop from Knowledge Agent to RAG Pipeline -->
  <line x1="475" y1="620" x2="475" y2="675" stroke="#10B981" stroke-width="2.5"/>
  {draw_arrow(475, 675, "down", color="#10B981", size=11)}

  <!-- Box: Quy trình RAG (x=310, y=675, w=330, h=145) -->
  <g id="Box_RagPipeline" transform="translate(310, 675)">
    <rect width="330" height="145" rx="14" fill="#ECFDF5" stroke="#34D399" stroke-width="1.8" stroke-dasharray="5,4" class="card-shadow"/>
    
    <!-- Header Pill -->
    <rect x="15" y="10" width="160" height="20" rx="4" fill="#059669"/>
    <text x="95" y="24" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">QUY TRÌNH NẠP TRI THỨC</text>

    <!-- Sub-step 1 -->
    <circle cx="28" cy="52" r="9" fill="#10B981"/>
    <text x="28" y="56" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">1</text>
    <text x="45" y="52" font-size="12" font-weight="800" fill="#0F172A">Chunking tài liệu AST</text>
    <text x="45" y="66" font-size="10.5" font-weight="600" fill="#64748B">(Giữ nguyên cấu trúc SOP bưu chính)</text>

    <!-- Sub-step 2 -->
    <circle cx="28" cy="88" r="9" fill="#10B981"/>
    <text x="28" y="92" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">2</text>
    <text x="45" y="88" font-size="12" font-weight="800" fill="#0F172A">Embedding Matryoshka (MRL 512)</text>
    <text x="45" y="102" font-size="10.5" font-weight="600" fill="#64748B">(Tối ưu 66% RAM, tìm kiếm siêu tốc)</text>

    <!-- Sub-step 3 -->
    <circle cx="28" cy="122" r="9" fill="#10B981"/>
    <text x="28" y="126" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">3</text>
    <text x="45" y="126" font-size="12" font-weight="800" fill="#0F172A">Lưu trữ chỉ mục HNSW trong DB</text>
  </g>

  <!-- Vertical Drop from RAG Pipeline to Vector DB -->
  <line x1="475" y1="820" x2="475" y2="855" stroke="#10B981" stroke-width="2.5"/>
  {draw_arrow(475, 855, "down", color="#10B981", size=11)}

  <!-- Box: Vector Database (PostgreSQL + pgvector) (x=310, y=855, w=330, h=65) -->
  <g id="Card_VectorDb" transform="translate(310, 855)">
    <rect width="330" height="65" rx="14" fill="#D1FAE5" stroke="#10B981" stroke-width="2" class="card-shadow"/>
    
    <!-- Magnifying Glass Icon -->
    <g transform="translate(25, 20)">
      <circle cx="10" cy="10" r="8" fill="none" stroke="#059669" stroke-width="2.5"/>
      <line x1="16" y1="16" x2="24" y2="24" stroke="#059669" stroke-width="2.5" stroke-linecap="round"/>
    </g>

    <text x="70" y="30" font-size="15" font-weight="900" fill="#065F46">Vector Database</text>
    <text x="70" y="50" font-size="12.5" font-weight="700" fill="#047857">(pgvector / PostgreSQL Core DB)</text>
  </g>

  <!-- =========================================================================
       6. LOWER TIER (CENTER): HUMAN-IN-THE-LOOP & THỰC THI GIAO DỊCH
       ========================================================================= -->
  <!-- Vertical Drop from Validation Agent to HITL -->
  <line x1="1175" y1="620" x2="1175" y2="675" stroke="#DC2626" stroke-width="2.5"/>
  {draw_arrow(1175, 675, "down", color="#DC2626", size=11)}

  <!-- HITL Card (x=750, y=675, w=590, h=120) -->
  <g id="Card_HITL" transform="translate(750, 675)">
    <rect width="590" height="120" rx="14" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2.2" class="card-shadow"/>
    
    <!-- Top Pill Badge -->
    <rect x="20" y="12" width="280" height="22" rx="4" fill="#D97706"/>
    <text x="160" y="27" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">👤 CHỐT CHẶN PHÊ DUYỆT CỦA CON NGƯỜI</text>

    <!-- User Avatar with Checkmark Icon -->
    <g transform="translate(25, 48)">
      <circle cx="18" cy="18" r="18" fill="#3B82F6"/>
      <path d="M 18 14 A 4 4 0 1 0 18 6 A 4 4 0 1 0 18 14 Z M 12 25 C 12 21 15 19 18 19 C 21 19 24 21 24 25 Z" fill="#FFFFFF"/>
      <circle cx="28" cy="28" r="6" fill="#10B981"/>
      <path d="M 25 28 L 27 30 L 31 26" fill="none" stroke="#FFFFFF" stroke-width="1.8"/>
    </g>

    <text x="75" y="62" font-size="16" font-weight="900" fill="#78350F">Xác nhận từ khách hàng (Human-in-the-Loop)</text>
    <text x="75" y="82" font-size="12" font-weight="600" fill="#92400E">AI hiển thị thẻ Pop-up xác nhận trực quan: Khách bấm duyệt mới ghi dữ liệu!</text>

    <!-- Mockup Buttons -->
    <g transform="translate(75, 90)">
      <rect width="110" height="22" rx="4" fill="#DC2626"/>
      <text x="55" y="15" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle">✓ ĐỒNG Ý HỦY</text>

      <rect x="120" width="85" height="22" rx="4" fill="#E2E8F0"/>
      <text x="162" y="15" font-size="10" font-weight="800" fill="#475569" text-anchor="middle">BỎ QUA</text>
    </g>
  </g>

  <!-- Vertical Link from HITL down to Execution -->
  <line x1="1045" y1="795" x2="1045" y2="845" stroke="#10B981" stroke-width="2.5"/>
  {draw_arrow(1045, 845, "down", color="#10B981", size=11)}

  <!-- Box: Thực thi giao dịch (via Backend) (x=750, y=845, w=590, h=75) -->
  <g id="Card_Execution" transform="translate(750, 845)">
    <rect width="590" height="75" rx="14" fill="#D1FAE5" stroke="#10B981" stroke-width="2" class="card-shadow"/>
    
    <!-- Green Checkmark Circle -->
    <circle cx="45" cy="38" r="18" fill="#10B981"/>
    <path d="M 37 38 L 43 44 L 53 32" fill="none" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round"/>

    <text x="80" y="35" font-size="16" font-weight="900" fill="#065F46">Thực thi giao dịch an toàn (via NestJS Backend)</text>
    <text x="80" y="56" font-size="12.5" font-weight="700" fill="#047857">Chỉ chuyển trạng thái CANCELLED khi nhận tín hiệu phê duyệt hợp lệ từ HITL</text>
  </g>

  <!-- =========================================================================
       7. RIGHT COLUMN: BACKEND (NESTJS) & LOGISTICS APIS
       ========================================================================= -->
  <!-- BACKEND NESTJS CONTAINER (x=1440, y=380, w=430, h=250) -->
  <g id="Card_Backend" transform="translate(1440, 380)">
    <rect width="430" height="250" rx="16" fill="#FEF3C7" stroke="#FBBF24" stroke-width="2" class="card-shadow"/>
    
    <!-- Role Pill Badge -->
    <rect x="20" y="14" width="270" height="22" rx="4" fill="#D97706"/>
    <text x="155" y="29" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">💾 THỰC THI GIAO DỊCH &amp; AUDIT TRAIL</text>

    <!-- Green Checkmark Icon -->
    <g transform="translate(370, 14)">
      <circle cx="16" cy="16" r="16" fill="#10B981"/>
      <path d="M 9 16 L 14 21 L 23 11" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
    </g>

    <text x="20" y="66" font-size="18" font-weight="900" fill="#78350F">Backend Microservices</text>
    <text x="240" y="66" font-size="13" font-weight="800" fill="#92400E">(NestJS Core)</text>

    <!-- 4 Clear Function Bullet Boxes -->
    <g transform="translate(20, 85)">
      <rect width="390" height="32" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
      <text x="10" y="20" font-size="11.5" font-weight="800" fill="#1E293B">✓  Kiểm tra quyền:</text>
      <text x="135" y="20" font-size="11" font-weight="600" fill="#475569">Xác thực JWT Bearer Token &amp; Shop Role</text>

      <rect y="38" width="390" height="32" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
      <text x="10" y="58" font-size="11.5" font-weight="800" fill="#1E293B">✓  Đối chiếu điều kiện:</text>
      <text x="155" y="58" font-size="11" font-weight="600" fill="#475569">Check ràng buộc nghiệp vụ lần cuối</text>

      <rect y="76" width="390" height="32" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
      <text x="10" y="96" font-size="11.5" font-weight="800" fill="#1E293B">✓  Thực thi giao dịch:</text>
      <text x="150" y="96" font-size="11" font-weight="600" fill="#475569">UPDATE bảng shipments thành CANCELLED</text>

      <rect y="114" width="390" height="32" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
      <text x="10" y="134" font-size="11.5" font-weight="800" fill="#1E293B">✓  Ghi Audit Log:</text>
      <text x="130" y="134" font-size="11" font-weight="700" fill="#DC2626">Lưu vết AI + chữ ký HITL chống chối bỏ</text>
    </g>
  </g>

  <!-- Two-way link Backend <-> Logistics APIs -->
  <line x1="1655" y1="630" x2="1655" y2="665" stroke="#1E293B" stroke-width="2"/>
  {draw_arrow(1655, 665, "down", color="#1E293B", size=9)}
  {draw_arrow(1655, 630, "up", color="#1E293B", size=9)}

  <!-- HỆ THỐNG LOGISTICS APIS CONTAINER (x=1440, y=665, w=430, h=95) -->
  <g id="Card_LogisticsApis" transform="translate(1440, 665)">
    <rect width="430" height="95" rx="14" fill="#FFFFFF" stroke="#FDE68A" stroke-width="2" class="card-shadow"/>
    <text x="215" y="26" font-size="13.5" font-weight="900" fill="#0F172A" text-anchor="middle">Hệ thống Logistics APIs Nội Bộ</text>

    <!-- Mini API Button Pills -->
    <g transform="translate(20, 38)">
      <rect width="105" height="44" rx="8" fill="#F0F9FF" stroke="#BAE6FD" stroke-width="1.2"/>
      <circle cx="25" cy="22" r="6" fill="none" stroke="#0284C7" stroke-width="2"/>
      <line x1="29" y1="26" x2="35" y2="32" stroke="#0284C7" stroke-width="2"/>
      <text x="65" y="26" font-size="10" font-weight="800" fill="#0369A1" text-anchor="middle">Tra cứu đơn</text>
    </g>

    <g transform="translate(135, 38)">
      <rect width="95" height="44" rx="8" fill="#FEF2F2" stroke="#FECACA" stroke-width="1.2"/>
      <circle cx="22" cy="22" r="7" fill="#EF4444"/>
      <path d="M 18 18 L 26 26 M 26 18 L 18 26" stroke="#FFFFFF" stroke-width="2"/>
      <text x="58" y="26" font-size="10" font-weight="800" fill="#991B1B" text-anchor="middle">Hủy đơn</text>
    </g>

    <g transform="translate(240, 38)">
      <rect width="120" height="44" rx="8" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1.2"/>
      <circle cx="24" cy="22" r="7" fill="#10B981"/>
      <path d="M 20 22 L 23 25 L 29 19" fill="none" stroke="#FFFFFF" stroke-width="1.8"/>
      <text x="70" y="26" font-size="10" font-weight="800" fill="#166534" text-anchor="middle">Khiếu nại bồi thường</text>
    </g>

    <g transform="translate(370, 38)">
      <rect width="45" height="44" rx="8" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>
      <text x="22" y="27" font-size="14" font-weight="900" fill="#64748B" text-anchor="middle">...</text>
    </g>
  </g>

  <!-- =========================================================================
       ARROW ③: SUB-AGENTS -> BACKEND (DEDICATED HIGHWAY at y=500)
       Spacious 80px channel directly from Sub-agent boundary into Backend!
       ========================================================================= -->
  <path d="M 1360 500 L 1440 500" fill="none" stroke="#1D4ED8" stroke-width="3.0"/>
  {draw_arrow(1440, 500, "right", color="#1D4ED8", size=14)}
  
  <!-- Number Badge ③ Protected Pill -->
  <g transform="translate(1400, 500)">
    <circle cx="0" cy="0" r="14" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="2"/>
    <text x="0" y="5" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">3</text>
    
    <rect x="-65" y="18" width="130" height="22" rx="4" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="1.2"/>
    <text x="0" y="33" font-size="10.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">Gọi API nghiệp vụ</text>
  </g>

  <!-- =========================================================================
       ARROW ④: BACKEND -> HITL (CLEAN HORIZONTAL CORRIDOR at y=735)
       ========================================================================= -->
  <path d="M 1440 735 L 1340 735" fill="none" stroke="#1D4ED8" stroke-width="3.0"/>
  {draw_arrow(1340, 735, "left", color="#1D4ED8", size=14)}

  <!-- Number Badge ④ Protected Pill -->
  <g transform="translate(1390, 735)">
    <circle cx="0" cy="0" r="14" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="2"/>
    <text x="0" y="5" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">4</text>
    
    <rect x="-85" y="18" width="170" height="34" rx="4" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="1.2"/>
    <text x="0" y="32" font-size="10.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">Hiển thị thông tin &amp;</text>
    <text x="0" y="46" font-size="10.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">chờ xác nhận</text>
  </g>

  <!-- =========================================================================
       ARROW ⑤: BACKEND -> CONTEXT MEMORY / LANGGRAPH (OVERHEAD ROOFTOP HIGHWAY at y=88)
       Clear overhead corridor, rises from Backend top to y=88, crosses left, drops into Memory.
       ========================================================================= -->
  <path d="M 1750 380 L 1750 88 L 1105 88 L 1105 150" fill="none" stroke="#1D4ED8" stroke-width="3.0"/>
  {draw_arrow(1105, 150, "down", color="#1D4ED8", size=14)}

  <!-- Number Badge ⑤ Protected Pill on Rooftop Highway -->
  <g transform="translate(1420, 88)">
    <rect x="-115" y="-15" width="230" height="30" rx="15" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="2" class="subtle-shadow"/>
    <circle cx="-95" cy="0" r="11" fill="#1D4ED8"/>
    <text x="-95" y="4" font-size="11.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">5</text>
    <text x="15" y="4" font-size="11.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">Trả kết quả &amp; cập nhật trạng thái</text>
  </g>

  <g transform="translate(980, 88)">
    <rect x="-65" y="-12" width="130" height="24" rx="4" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1"/>
    <text x="0" y="4" font-size="10.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">Đọc / Cập nhật Context</text>
  </g>

  <!-- =========================================================================
       ARROW ⑥: THỰC THI GIAO DỊCH -> KHÁCH HÀNG (UNDERGROUND HIGHWAY at y=945)
       Runs in the completely empty aisle below all cards, rises into Customer box.
       ========================================================================= -->
  <path d="M 1045 920 L 1045 945 L 125 945 L 125 415" fill="none" stroke="#1D4ED8" stroke-width="3.2"/>
  {draw_arrow(125, 415, "up", color="#1D4ED8", size=14)}

  <!-- Number Badge ⑥ Protected Pill on Underground Highway -->
  <g transform="translate(680, 945)">
    <rect x="-140" y="-15" width="280" height="30" rx="15" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="2" class="subtle-shadow"/>
    <circle cx="-120" cy="0" r="11" fill="#1D4ED8"/>
    <text x="-120" y="4" font-size="11.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">6</text>
    <text x="15" y="4" font-size="11.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">Tổng hợp kết quả &amp; phản hồi khách hàng</text>
  </g>

  <!-- =========================================================================
       8. STEP SUMMARY CARD (BOTTOM RIGHT) (x=1440, y=775, w=430, h=175)
       ========================================================================= -->
  <g id="Card_StepSummary" transform="translate(1440, 775)">
    <rect width="430" height="175" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8" class="card-shadow"/>
    <rect width="430" height="32" rx="14 14 0 0" fill="#0F4C81"/>
    <text x="215" y="21" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">Tóm tắt luồng hoạt động khép kín (6 Bước)</text>

    <!-- 6 Summary items in 2 Columns -->
    <g transform="translate(16, 46)">
      <!-- Col 1 -->
      <circle cx="8" cy="8" r="7" fill="#1D4ED8"/>
      <text x="8" y="11" font-size="8" font-weight="900" fill="#FFFFFF" text-anchor="middle">1</text>
      <text x="22" y="11" font-size="10.5" font-weight="700" fill="#0F172A">Người dùng gửi yêu cầu</text>

      <circle cx="8" cy="38" r="7" fill="#1D4ED8"/>
      <text x="8" y="41" font-size="8" font-weight="900" fill="#FFFFFF" text-anchor="middle">2</text>
      <text x="22" y="41" font-size="10.5" font-weight="700" fill="#0F172A">Supervisor lập kế hoạch DAG</text>

      <circle cx="8" cy="68" r="7" fill="#1D4ED8"/>
      <text x="8" y="71" font-size="8" font-weight="900" fill="#FFFFFF" text-anchor="middle">3</text>
      <text x="22" y="71" font-size="10.5" font-weight="700" fill="#0F172A">Các Sub-Agents phối hợp RAG &amp; Tool</text>

      <!-- Col 2 -->
      <g transform="translate(205, 0)">
        <circle cx="8" cy="8" r="7" fill="#1D4ED8"/>
        <text x="8" y="11" font-size="8" font-weight="900" fill="#FFFFFF" text-anchor="middle">4</text>
        <text x="22" y="11" font-size="10.5" font-weight="700" fill="#0F172A">Xác nhận với khách hàng (HITL)</text>

        <circle cx="8" cy="38" r="7" fill="#1D4ED8"/>
        <text x="8" y="41" font-size="8" font-weight="900" fill="#FFFFFF" text-anchor="middle">5</text>
        <text x="22" y="41" font-size="10.5" font-weight="700" fill="#0F172A">Thực thi giao dịch &amp; Ghi Audit Log</text>

        <circle cx="8" cy="68" r="7" fill="#1D4ED8"/>
        <text x="8" y="71" font-size="8" font-weight="900" fill="#FFFFFF" text-anchor="middle">6</text>
        <text x="22" y="71" font-size="10.5" font-weight="700" fill="#0F172A">Tổng hợp phản hồi SSE cho Client</text>
      </g>
    </g>
  </g>

  <!-- =========================================================================
       9. BOTTOM TECH STACK FOOTER BAR (x=45, y=990, w=1825, h=95)
       ========================================================================= -->
  <g id="Bar_TechStack" transform="translate(45, 990)">
    <rect width="1825" height="95" rx="14" fill="#F0F7FF" stroke="#BAE6FD" stroke-width="1.8" class="card-shadow"/>
    
    <!-- Left Blue Pill Badge -->
    <rect x="0" y="0" width="220" height="32" rx="14 0 14 0" fill="#0284C7"/>
    <text x="110" y="21" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">Hạ tầng &amp; Công nghệ</text>

    <!-- 5 Technology Items Spaced Generously Across 1825px -->
    <!-- Item 1: Framework AI -->
    <g transform="translate(30, 48)">
      <circle cx="16" cy="16" r="14" fill="#E0F2FE"/>
      <!-- Network Nodes icon -->
      <circle cx="10" cy="12" r="2.5" fill="#0284C7"/>
      <circle cx="22" cy="12" r="2.5" fill="#0284C7"/>
      <circle cx="16" cy="22" r="2.5" fill="#0284C7"/>
      <line x1="10" y1="12" x2="22" y2="12" stroke="#0284C7" stroke-width="1"/>
      <line x1="10" y1="12" x2="16" y2="22" stroke="#0284C7" stroke-width="1"/>
      <line x1="22" y1="12" x2="16" y2="22" stroke="#0284C7" stroke-width="1"/>

      <text x="40" y="14" font-size="12" font-weight="800" fill="#0F172A">Framework AI</text>
      <text x="40" y="28" font-size="11" font-weight="600" fill="#64748B">LangChain + LangGraph</text>
    </g>

    <line x1="360" y1="45" x2="360" y2="85" stroke="#CBD5E1" stroke-width="1.2"/>

    <!-- Item 2: Cloud Free-Tier -->
    <g transform="translate(390, 48)">
      <circle cx="16" cy="16" r="14" fill="#E0F2FE"/>
      <!-- Zap / Cloud icon -->
      <polygon points="17,5 10,17 16,17 15,27 22,15 16,15" fill="#0284C7"/>
      
      <text x="40" y="14" font-size="12" font-weight="800" fill="#0F172A">Cloud Free-Tier</text>
      <text x="40" y="28" font-size="11" font-weight="600" fill="#64748B">Groq LPU + Google AI Studio</text>
    </g>

    <line x1="740" y1="45" x2="740" y2="85" stroke="#CBD5E1" stroke-width="1.2"/>

    <!-- Item 3: Database & Vector -->
    <g transform="translate(770, 48)">
      <circle cx="16" cy="16" r="14" fill="#E0F2FE"/>
      <!-- Cylinders icon -->
      <ellipse cx="16" cy="10" rx="8" ry="3" fill="#0284C7"/>
      <path d="M 8 10 L 8 22 C 8 24 11 26 16 26 C 21 26 24 24 24 22 L 24 10 Z" fill="#0284C7" opacity="0.8"/>

      <text x="40" y="14" font-size="12" font-weight="800" fill="#0F172A">Database &amp; Vector</text>
      <text x="40" y="28" font-size="11" font-weight="600" fill="#64748B">PostgreSQL + pgvector</text>
    </g>

    <line x1="1120" y1="45" x2="1120" y2="85" stroke="#CBD5E1" stroke-width="1.2"/>

    <!-- Item 4: Containerization -->
    <g transform="translate(1150, 48)">
      <circle cx="16" cy="16" r="14" fill="#E0F2FE"/>
      <!-- Whale icon -->
      <path d="M 8 18 C 8 14 12 11 18 11 C 24 11 26 14 26 18 Z" fill="#0284C7"/>
      <rect x="10" y="14" width="3" height="3" fill="#FFFFFF"/>
      <rect x="14" y="14" width="3" height="3" fill="#FFFFFF"/>
      <rect x="18" y="14" width="3" height="3" fill="#FFFFFF"/>

      <text x="40" y="14" font-size="12" font-weight="800" fill="#0F172A">Containerization</text>
      <text x="40" y="28" font-size="11" font-weight="600" fill="#64748B">Docker</text>
    </g>

    <line x1="1480" y1="45" x2="1480" y2="85" stroke="#CBD5E1" stroke-width="1.2"/>

    <!-- Item 5: API Gateway -->
    <g transform="translate(1510, 48)">
      <circle cx="16" cy="16" r="14" fill="#FEE2E2"/>
      <!-- NestJS cat logo -->
      <path d="M 9 22 C 9 14 13 10 18 10 C 23 10 27 14 27 22 Z" fill="#E11D48"/>
      <polygon points="12,12 10,7 16,10" fill="#E11D48"/>
      <polygon points="24,12 26,7 20,10" fill="#E11D48"/>

      <text x="40" y="14" font-size="12" font-weight="800" fill="#0F172A">API Gateway</text>
      <text x="40" y="28" font-size="11" font-weight="600" fill="#64748B">NestJS</text>
    </g>
  </g>

</svg>
''')

    svg_content = "\n".join(lines)
    os.makedirs(os.path.dirname(OUTPUT_SVG), exist_ok=True)
    with open(OUTPUT_SVG, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated Ultra-Clean Infographic SVG: {OUTPUT_SVG}")

if __name__ == "__main__":
    build_svg()
