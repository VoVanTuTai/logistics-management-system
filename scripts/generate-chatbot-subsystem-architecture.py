#!/usr/bin/env python3
"""
generate-chatbot-subsystem-architecture.py
Figma-Native Master Enterprise Architecture Blueprint for
Nexus Logistics AI Chatbot & Hybrid RAG Subsystem.

Refinement based on user feedback:
- INCREASE FONT SIZE TO PRIORITIZE CONTENT PRESENTATION:
  * Substantially increased typography scale across all architectural modules.
  * Headers boosted to 17.5-20px (900 Extrabold).
  * Main Title boosted to 38px, Section Titles to 21px.
  * Card body text, technical chips, and layer labels boosted to 14-16.5px.
  * Formulas, routing rules, and metrics boosted for immediate legibility at whole-page zoom.
  * Zero label collisions: adjusted tag lengths and container widths for pristine clarity.
- HARMONIOUS LIGHTER TECH TONES:
  * Dedicated technical conduit colors (#0284C7, #7C3AED, #D97706, #059669).
  * High-contrast navy slate text (#1E293B, #1E3A8A, #334155).
- 100% NATIVE INLINE VECTOR (Zero <marker> tags, Figma compatible, valid XML).

Outputs:
  docs/graduation-thesis/diagrams/architecture/03-architecture-ai-chatbot-subsystem.svg
  docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-architecture-ai-chatbot-subsystem.svg
"""

import os
import html
import re
import xml.etree.ElementTree as ET

OUTPUT_FILES = [
    "docs/graduation-thesis/diagrams/architecture/03-architecture-ai-chatbot-subsystem.svg",
    "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-architecture-ai-chatbot-subsystem.svg"
]

def xml_esc(s):
    if s is None:
        return ""
    clean = str(s).replace("&amp;", "&")
    return html.escape(clean, quote=True)

def draw_arrow(x, y, direction="right", color="#0284C7", size=18):
    if direction == "right":
        points = f"{x},{y} {x-size},{y-size*0.5:.1f} {x-size},{y+size*0.5:.1f}"
    elif direction == "left":
        points = f"{x},{y} {x+size},{y-size*0.5:.1f} {x+size},{y+size*0.5:.1f}"
    elif direction == "down":
        points = f"{x},{y} {x-size*0.5:.1f},{y-size} {x+size*0.5:.1f},{y-size}"
    elif direction == "up":
        points = f"{x},{y} {x-size*0.5:.1f},{y+size} {x+size*0.5:.1f},{y+size}"
    return f'<polygon points="{points}" fill="{color}"/>'

def build_architecture_svg():
    W = 1760
    H = 1860
    lines = []

    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800;900&amp;family=JetBrains+Mono:wght@700;800;900&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
      .mono {{ font-family: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace; }}
      .node-shadow {{ filter: drop-shadow(0 4px 14px rgba(30, 41, 59, 0.05)); }}
      .hub-shadow {{ filter: drop-shadow(0 6px 20px rgba(30, 41, 59, 0.08)); }}
      .flow-badge {{ font-family: 'JetBrains Mono', monospace; font-size: 17px; font-weight: 900; fill: #FFFFFF; }}
    </style>

    <linearGradient id="dbGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EDE9FE"/>
      <stop offset="100%" stop-color="#DDD6FE"/>
    </linearGradient>
  </defs>

  <!-- PURE CRISP WHITE CANVAS (PRINT & PRESENTATION READY) -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- =========================================================================
       DIAGRAM TITLE HEADER (LARGE & PROMINENT)
       ========================================================================= -->
  <g id="Diagram_Header" transform="translate(880, 50)">
    <rect x="-50" y="-32" width="100" height="30" rx="15" fill="#FAF5FF" stroke="#7C3AED" stroke-width="2.0"/>
    <text x="0" y="-12" class="mono" font-size="14.5" font-weight="900" fill="#7C3AED" text-anchor="middle">AI-RAG-ARCH-03</text>

    <text x="0" y="28" font-size="38" font-weight="900" fill="#1E3A8A" text-anchor="middle" letter-spacing="-0.02em">KIẾN TRÚC PHÂN HỆ AI CHATBOT VÀ CƠ CHẾ RAG LAI</text>
    <text x="0" y="60" font-size="18" font-weight="700" fill="#475569" text-anchor="middle">Nexus Express System • Hybrid Retrieval-Augmented Generation Architecture</text>
  </g>''')

    # Grid parameters:
    m_x = 70
    c4_w = 370
    c4_gap = 46.6
    c3_w = 500
    c3_gap = 60.0

    # =========================================================================
    # SECTION 1: TIỀN XỬ LÝ & ĐÓNG GÓI TRI THỨC (OFFLINE CHUNKING)
    # 4 Abstract Stage Cards (h: 245)
    # =========================================================================
    s1_title_y = 142
    s1_card_y = 172
    s1_card_h = 245

    lines.append(f'''  <!-- ================= SECTION 1: OFFLINE KNOWLEDGE PIPELINE ================= -->
  <g id="Section1_KnowledgeChunkingPipeline">
    <text x="880" y="{s1_title_y}" font-size="21" font-weight="900" fill="#334155" letter-spacing="1.5px" text-anchor="middle">PHẦN I: TIỀN XỬ LÝ &amp; ĐÁNH CHỈ MỤC VÉC-TƠ (OFFLINE PIPELINE)</text>''')

    # --- Card 1.1: Raw Knowledge Base Corpus ---
    c1_x = m_x
    lines.append(f'''    <!-- Step 1.1: Raw Knowledge Base Corpus -->
    <g transform="translate({c1_x}, {s1_card_y})" class="node-shadow">
      <rect x="0" y="0" width="{c4_w}" height="{s1_card_h}" rx="12" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.0"/>
      <rect x="0" y="0" width="{c4_w}" height="44" rx="12" fill="#EFF6FF" stroke="#0284C7" stroke-width="2.0"/>
      <text x="16" y="28" font-size="17" font-weight="900" fill="#0369A1">1. Tài Liệu SOP Bưu Chính</text>
      <text x="{c4_w - 16}" y="28" class="mono" font-size="13" font-weight="900" fill="#0284C7" text-anchor="end">«docs/»</text>

      <!-- ABSTRACT VISUAL: Abstract Wireframe Document Structure -->
      <g transform="translate(16, 54)">
        <rect x="0" y="0" width="{c4_w - 32}" height="136" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        
        <!-- Abstract Document Wireframe Preview -->
        <g transform="translate(14, 14)">
          <path d="M 0 0 L 105 0 L 125 20 L 125 108 L 0 108 Z" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.6"/>
          <polygon points="105,0 105,20 125,20" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.4"/>
          
          <rect x="8" y="8" width="34" height="18" rx="3" fill="#0284C7"/>
          <text x="25" y="21" class="mono" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">.MD</text>
          <text x="46" y="22" font-size="12" font-weight="900" fill="#1E293B">SOP Corpus</text>

          <!-- Abstract Document Wireframe Bars & Matrix -->
          <rect x="8" y="32" width="108" height="6" rx="2" fill="#93C5FD"/>
          <rect x="8" y="42" width="66" height="4" rx="2" fill="#CBD5E1"/>
          
          <!-- Abstract Table Grid -->
          <g transform="translate(8, 52)">
            <rect x="0" y="0" width="108" height="48" rx="3" fill="#F1F5F9" stroke="#94A3B8" stroke-width="0.8"/>
            <rect x="0" y="0" width="108" height="14" fill="#E2E8F0"/>
            <line x1="54" y1="0" x2="54" y2="48" stroke="#94A3B8" stroke-width="0.8"/>
            <line x1="0" y1="14" x2="108" y2="14" stroke="#94A3B8" stroke-width="0.8"/>
            <line x1="0" y1="31" x2="108" y2="31" stroke="#94A3B8" stroke-width="0.8"/>
            
            <circle cx="27" cy="7" r="3" fill="#0284C7"/>
            <circle cx="81" cy="7" r="3" fill="#0284C7"/>
            <rect x="8" y="21" width="36" height="3" rx="1.5" fill="#64748B"/>
            <rect x="64" y="21" width="34" height="3" rx="1.5" fill="#059669"/>
            <rect x="8" y="38" width="36" height="3" rx="1.5" fill="#64748B"/>
            <rect x="64" y="38" width="34" height="3" rx="1.5" fill="#D97706"/>
          </g>
        </g>

        <!-- Right Side Abstract Meta Chips (Larger Font) -->
        <g transform="translate(166, 16)">
          <rect x="0" y="0" width="156" height="32" rx="5" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.2"/>
          <text x="78" y="21" class="mono" font-size="13.5" font-weight="900" fill="#0284C7" text-anchor="middle">SOP Document Base</text>

          <rect x="0" y="38" width="156" height="32" rx="5" fill="#F0FDF4" stroke="#059669" stroke-width="1.2"/>
          <text x="78" y="59" class="mono" font-size="13.5" font-weight="900" fill="#047857" text-anchor="middle">UTF-8 Markdown</text>

          <rect x="0" y="76" width="156" height="32" rx="5" fill="#FAF5FF" stroke="#7C3AED" stroke-width="1.2"/>
          <text x="78" y="97" class="mono" font-size="13.5" font-weight="900" fill="#6D28D9" text-anchor="middle">SHA-256 Checksum</text>
        </g>
      </g>

      <!-- Abstract Bottom Specification Plate (Enhanced Font) -->
      <g transform="translate(16, 200)">
        <rect x="0" y="0" width="{c4_w - 32}" height="32" rx="5" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.3"/>
        <text x="{(c4_w - 32)//2}" y="21" class="mono" font-size="14" font-weight="900" fill="#0284C7" text-anchor="middle">&#10003; Cấu Trúc Heading AST Chuẩn Hóa</text>
      </g>
    </g>''')

    # Connector 1.1 -> 1.2
    arr1_x1 = c1_x + c4_w
    arr1_x2 = arr1_x1 + c4_gap
    arr1_y = s1_card_y + s1_card_h // 2
    lines.append(f'''    <!-- Connector 1.1 -> 1.2 -->
    <line x1="{arr1_x1}" y1="{arr1_y}" x2="{arr1_x2}" y2="{arr1_y}" stroke="#0284C7" stroke-width="3.8"/>
    {draw_arrow(arr1_x2, arr1_y, "right", "#0284C7", 18)}
    <circle cx="{(arr1_x1 + arr1_x2)//2}" cy="{arr1_y - 25}" r="18" fill="#0284C7" stroke="#FFFFFF" stroke-width="2.6"/>
    <text x="{(arr1_x1 + arr1_x2)//2}" y="{arr1_y - 19}" text-anchor="middle" class="flow-badge">1</text>''')

    # --- Card 1.2: AST Heading Parser ---
    c2_x = c1_x + c4_w + c4_gap
    lines.append(f'''    <!-- Step 1.2: AST Heading Parser -->
    <g transform="translate({c2_x}, {s1_card_y})" class="node-shadow">
      <rect x="0" y="0" width="{c4_w}" height="{s1_card_h}" rx="12" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.0"/>
      <rect x="0" y="0" width="{c4_w}" height="44" rx="12" fill="#EFF6FF" stroke="#0284C7" stroke-width="2.0"/>
      <text x="16" y="28" font-size="17" font-weight="900" fill="#0369A1">2. Bộ Bóc Tách Cây AST</text>
      <text x="{c4_w - 16}" y="28" class="mono" font-size="13" font-weight="900" fill="#0284C7" text-anchor="end">«AST Parser»</text>

      <!-- ABSTRACT VISUAL: AST Hierarchy Graph -->
      <g transform="translate(16, 54)">
        <rect x="0" y="0" width="{c4_w - 32}" height="136" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>

        <rect x="88" y="8" width="162" height="28" rx="5" fill="#0284C7"/>
        <text x="169" y="26" class="mono" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">Root: Markdown AST</text>

        <path d="M 135 36 L 135 48 L 65 48 L 65 58" fill="none" stroke="#0284C7" stroke-width="2.2"/>
        <path d="M 203 36 L 203 48 L 273 48 L 273 58" fill="none" stroke="#7C3AED" stroke-width="2.2"/>

        <rect x="10" y="58" width="112" height="26" rx="4" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.4"/>
        <text x="66" y="75" font-size="13" font-weight="900" fill="#0369A1" text-anchor="middle"># H1: Cước Phí</text>

        <line x1="66" y1="84" x2="66" y2="98" stroke="#0284C7" stroke-width="1.8"/>
        <rect x="6" y="98" width="120" height="26" rx="4" fill="#F0FDF4" stroke="#059669" stroke-width="1.3"/>
        <text x="66" y="115" class="mono" font-size="11.5" font-weight="900" fill="#047857" text-anchor="middle">| Table (Intact) |</text>

        <rect x="214" y="58" width="118" height="26" rx="4" fill="#FAF5FF" stroke="#7C3AED" stroke-width="1.4"/>
        <text x="273" y="75" font-size="13" font-weight="900" fill="#6D28D9" text-anchor="middle"># H1: Bồi Thường</text>

        <line x1="273" y1="84" x2="273" y2="98" stroke="#7C3AED" stroke-width="1.8"/>
        <rect x="208" y="98" width="126" height="26" rx="4" fill="#FFFBEB" stroke="#D97706" stroke-width="1.3"/>
        <text x="271" y="115" class="mono" font-size="11.5" font-weight="900" fill="#B45309" text-anchor="middle">## H2: SLA &amp; Claim</text>
      </g>

      <!-- Abstract Bottom Specification Plate (Enhanced Font) -->
      <g transform="translate(16, 200)">
        <rect x="0" y="0" width="{c4_w - 32}" height="32" rx="5" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.3"/>
        <text x="{(c4_w - 32)//2}" y="21" class="mono" font-size="13.5" font-weight="900" fill="#0284C7" text-anchor="middle">AST Hierarchy • Breadcrumb Injection</text>
      </g>
    </g>''')

    # Connector 1.2 -> 1.3
    arr2_x1 = c2_x + c4_w
    arr2_x2 = arr2_x1 + c4_gap
    lines.append(f'''    <!-- Connector 1.2 -> 1.3 -->
    <line x1="{arr2_x1}" y1="{arr1_y}" x2="{arr2_x2}" y2="{arr1_y}" stroke="#0284C7" stroke-width="3.8"/>
    {draw_arrow(arr2_x2, arr1_y, "right", "#0284C7", 18)}
    <circle cx="{(arr2_x1 + arr2_x2)//2}" cy="{arr1_y - 25}" r="18" fill="#0284C7" stroke="#FFFFFF" stroke-width="2.6"/>
    <text x="{(arr2_x1 + arr2_x2)//2}" y="{arr1_y - 19}" text-anchor="middle" class="flow-badge">2</text>''')

    # --- Card 1.3: Sliding Window Chunker Engine ---
    c3_x = c2_x + c4_w + c4_gap
    lines.append(f'''    <!-- Step 1.3: Sliding Window Chunker Engine -->
    <g transform="translate({c3_x}, {s1_card_y})" class="node-shadow">
      <rect x="0" y="0" width="{c4_w}" height="{s1_card_h}" rx="12" fill="#FFFFFF" stroke="#D97706" stroke-width="2.0"/>
      <rect x="0" y="0" width="{c4_w}" height="44" rx="12" fill="#FFFBEB" stroke="#D97706" stroke-width="2.0"/>
      <text x="16" y="28" font-size="17" font-weight="900" fill="#B45309">3. Cửa Sổ Trượt</text>
      <text x="{c4_w - 16}" y="28" class="mono" font-size="13" font-weight="900" fill="#D97706" text-anchor="end">«Overlap: 16%»</text>

      <!-- ABSTRACT VISUAL: Timeline Ruler & Dual Overlap Window -->
      <g transform="translate(16, 54)">
        <rect x="0" y="0" width="{c4_w - 32}" height="136" rx="8" fill="#FFFDF5" stroke="#FDE68A" stroke-width="1.2"/>

        <rect x="14" y="14" width="310" height="10" rx="3" fill="#E2E8F0"/>
        <line x1="14" y1="19" x2="324" y2="19" stroke="#94A3B8" stroke-width="1.2" stroke-dasharray="6,4"/>
        <text x="169" y="10" class="mono" font-size="11" font-weight="900" fill="#475569" text-anchor="middle">Token Word Stream [0 .. N]</text>

        <rect x="14" y="32" width="176" height="32" rx="4" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.6"/>
        <text x="76" y="53" class="mono" font-size="13.5" font-weight="900" fill="#1D4ED8" text-anchor="middle">Chunk 1 [0..250]</text>

        <rect x="142" y="32" width="48" height="64" rx="3" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.6" stroke-dasharray="3,2"/>
        <text x="166" y="62" class="mono" font-size="11" font-weight="900" fill="#B45309" text-anchor="middle">GỐI ĐẦU</text>
        <text x="166" y="75" class="mono" font-size="11" font-weight="900" fill="#B45309" text-anchor="middle">40 TỪ</text>

        <rect x="142" y="64" width="182" height="32" rx="4" fill="#F0FDF4" stroke="#10B981" stroke-width="1.6"/>
        <text x="256" y="85" class="mono" font-size="13.5" font-weight="900" fill="#047857" text-anchor="middle">Chunk 2 [210..460]</text>

        <line x1="14" y1="114" x2="142" y2="114" stroke="#B45309" stroke-width="2.0"/>
        <polygon points="14,114 21,110 21,118" fill="#B45309"/>
        <polygon points="142,114 135,110 135,118" fill="#B45309"/>
        <text x="78" y="126" class="mono" font-size="12.5" font-weight="900" fill="#B45309" text-anchor="middle">Stride = 210 từ / bước</text>
      </g>

      <!-- Abstract Bottom Specification Plate (Enhanced Font) -->
      <g transform="translate(16, 200)">
        <rect x="0" y="0" width="{c4_w - 32}" height="32" rx="5" fill="#FFFBEB" stroke="#D97706" stroke-width="1.3"/>
        <text x="{(c4_w - 32)//2}" y="21" class="mono" font-size="13.5" font-weight="900" fill="#B45309" text-anchor="middle">Cửa Sổ: 250 Từ • Gối Đầu: 40 Từ (16%)</text>
      </g>
    </g>''')

    # Connector 1.3 -> 1.4
    arr3_x1 = c3_x + c4_w
    arr3_x2 = arr3_x1 + c4_gap
    lines.append(f'''    <!-- Connector 1.3 -> 1.4 -->
    <line x1="{arr3_x1}" y1="{arr1_y}" x2="{arr3_x2}" y2="{arr1_y}" stroke="#7C3AED" stroke-width="3.8"/>
    {draw_arrow(arr3_x2, arr1_y, "right", "#7C3AED", 18)}
    <circle cx="{(arr3_x1 + arr3_x2)//2}" cy="{arr1_y - 25}" r="18" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2.6"/>
    <text x="{(arr3_x1 + arr3_x2)//2}" y="{arr1_y - 19}" text-anchor="middle" class="flow-badge">3</text>''')

    # --- Card 1.4: Vectorization & Storage ---
    c4_x = c3_x + c4_w + c4_gap
    lines.append(f'''    <!-- Step 1.4: Vectorization & Storage -->
    <g transform="translate({c4_x}, {s1_card_y})" class="node-shadow">
      <rect x="0" y="0" width="{c4_w}" height="{s1_card_h}" rx="12" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.0"/>
      <rect x="0" y="0" width="{c4_w}" height="44" rx="12" fill="#FAF5FF" stroke="#7C3AED" stroke-width="2.0"/>
      <text x="16" y="28" font-size="17" font-weight="900" fill="#6D28D9">4. Kho Véc-tơ &amp; Nhúng</text>
      <text x="{c4_w - 16}" y="28" class="mono" font-size="13" font-weight="900" fill="#7C3AED" text-anchor="end">«RAM Cache»</text>

      <!-- ABSTRACT VISUAL: 3D Vector Space & In-Memory DB -->
      <g transform="translate(16, 54)">
        <rect x="0" y="0" width="{c4_w - 32}" height="136" rx="8" fill="#FAF5FF" stroke="#E9D5FF" stroke-width="1.2"/>

        <g transform="translate(16, 16)">
          <line x1="10" y1="80" x2="80" y2="80" stroke="#94A3B8" stroke-width="1.8"/>
          <line x1="10" y1="80" x2="10" y2="10" stroke="#94A3B8" stroke-width="1.8"/>
          <line x1="10" y1="80" x2="55" y2="105" stroke="#94A3B8" stroke-width="1.8"/>
          <text x="85" y="84" class="mono" font-size="12" font-weight="900" fill="#475569">X</text>
          <text x="8" y="6" class="mono" font-size="12" font-weight="900" fill="#475569">Y</text>
          <text x="60" y="112" class="mono" font-size="12" font-weight="900" fill="#475569">Z</text>

          <line x1="10" y1="80" x2="65" y2="25" stroke="#2563EB" stroke-width="2.6"/>
          <polygon points="65,25 55,27 60,33" fill="#2563EB"/>
          <text x="68" y="24" class="mono" font-size="13" font-weight="900" fill="#2563EB">v_Q</text>

          <line x1="10" y1="80" x2="75" y2="50" stroke="#7C3AED" stroke-width="2.6"/>
          <polygon points="75,50 65,49 68,56" fill="#7C3AED"/>
          <text x="78" y="54" class="mono" font-size="13" font-weight="900" fill="#7C3AED">v_D</text>

          <path d="M 38 54 A 30 30 0 0 1 45 66" fill="none" stroke="#D97706" stroke-width="1.8"/>
          <text x="46" y="58" class="mono" font-size="12" font-weight="900" fill="#D97706">θ</text>
        </g>

        <g transform="translate(178, 12)">
          <path d="M 20 28 L 20 86 A 55 16 0 0 0 130 86 L 130 28 Z" fill="url(#dbGrad)" stroke="#7C3AED" stroke-width="1.8"/>
          <ellipse cx="75" cy="28" rx="55" ry="16" fill="#FAF5FF" stroke="#7C3AED" stroke-width="1.8"/>
          
          <rect x="26" y="16" width="98" height="24" rx="4" fill="#7C3AED"/>
          <text x="75" y="33" class="mono" font-size="12.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">RAM Cache</text>

          <rect x="16" y="94" width="118" height="28" rx="5" fill="#059669"/>
          <text x="75" y="113" class="mono" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">&lt; 5ms Cosine</text>
        </g>
      </g>

      <!-- Abstract Bottom Specification Plate (Enhanced Font) -->
      <g transform="translate(16, 200)">
        <rect x="0" y="0" width="{c4_w - 32}" height="32" rx="5" fill="#FAF5FF" stroke="#7C3AED" stroke-width="1.3"/>
        <text x="{(c4_w - 32)//2}" y="21" class="mono" font-size="13.5" font-weight="900" fill="#6D28D9" text-anchor="middle">text-embedding-004 • In-Memory Dot Product</text>
      </g>
    </g>
  </g>''')

    # =========================================================================
    # HIGHWAY CONNECTOR: SECTION 1 -> SECTION 2
    # Spacious breathing corridor (y: 417 to 545)
    # =========================================================================
    c4_center_x = c4_x + c4_w // 2  # 1505
    bus_y = 482
    bus_w = 1160
    bus_x = 280
    bus_right = bus_x + bus_w  # 1440

    lines.append(f'''  <!-- Highway Knowledge Conduit: Section 1 Feed into Section 2 -->
  <g id="Connector_Section1_To_Section2">
    <path d="M {c4_center_x} {s1_card_y + s1_card_h} L {c4_center_x} {bus_y + 21} L {bus_right} {bus_y + 21}" fill="none" stroke="#7C3AED" stroke-width="3.8" stroke-dasharray="8,5"/>
    {draw_arrow(bus_right, bus_y + 21, "left", "#7C3AED", 18)}

    <circle cx="{c4_center_x - 45}" cy="{bus_y + 21}" r="18" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2.6"/>
    <text x="{c4_center_x - 45}" y="{bus_y + 27}" text-anchor="middle" class="flow-badge">4</text>

    <!-- Prominent Knowledge Bus Bar (Enhanced Font) -->
    <g transform="translate({bus_x}, {bus_y})" class="hub-shadow">
      <rect x="0" y="0" width="{bus_w}" height="42" rx="8" fill="#FAF5FF" stroke="#7C3AED" stroke-width="2.2"/>
      <circle cx="30" cy="21" r="13" fill="#7C3AED"/>
      <text x="30" y="26" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">⚡</text>
      <text x="56" y="27" class="mono" font-size="15.5" font-weight="900" fill="#6D28D9">KNOWLEDGE BUS: In-Memory Vector Index (Dynamic RAM Cache • &lt; 5ms)</text>
    </g>
  </g>''')

    # =========================================================================
    # SECTION 2: ĐIỀU PHỐI & SUY LUẬN RAG TRỰC TUYẾN
    # =========================================================================
    s2_title_y = 582
    lines.append(f'''  <!-- ================= SECTION 2: RUNTIME INFERENCE ARCHITECTURE ================= -->
  <g id="Section2_RuntimeOrchestration">
    <text x="880" y="{s2_title_y}" font-size="21" font-weight="900" fill="#334155" letter-spacing="1.5px" text-anchor="middle">PHẦN II: ĐIỀU PHỐI TRUY VẤN &amp; SUY LUẬN RAG (RUNTIME PIPELINE)</text>''')

    # -------------------------------------------------------------------------
    # TIER 2.1: CLIENT CHANNELS (3 Sleek Cards)
    # y: 618, h: 82, card_w = 500, gap = 60
    # -------------------------------------------------------------------------
    t21_y = 618
    t21_h = 82

    # Client 1: Merchant Web
    cl1_x = m_x
    lines.append(f'''    <!-- Client Channel 1: Merchant Web -->
    <g transform="translate({cl1_x}, {t21_y})" class="node-shadow">
      <rect x="0" y="0" width="{c3_w}" height="{t21_h}" rx="10" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.0"/>
      <rect x="0" y="0" width="{c3_w}" height="32" rx="10" fill="#EFF6FF" stroke="#0284C7" stroke-width="2.0"/>
      <text x="16" y="22" font-size="16.5" font-weight="900" fill="#0369A1">1. Cổng Chủ Hàng (Merchant Web)</text>
      <text x="{c3_w - 16}" y="22" class="mono" font-size="13" font-weight="900" fill="#0284C7" text-anchor="end">React 18 / Vite (:5174)</text>

      <g transform="translate(16, 40)">
        <rect x="0" y="4" width="46" height="30" rx="3" fill="#F8FAFC" stroke="#0284C7" stroke-width="1.2"/>
        <rect x="0" y="4" width="46" height="8" rx="2" fill="#E2E8F0"/>
        <rect x="6" y="16" width="22" height="3" rx="1" fill="#0284C7"/>
        <rect x="6" y="22" width="34" height="2" rx="1" fill="#CBD5E1"/>
      </g>
      <g transform="translate(74, 48)">
        <text x="0" y="18" font-size="15" font-weight="800" fill="#1E293B">Web Dashboard • <tspan class="mono" font-weight="900" fill="#0284C7">HTTPS / WSS Stream</tspan></text>
      </g>
    </g>''')

    # Client 2: Shipper Mobile App
    cl2_x = cl1_x + c3_w + c3_gap
    lines.append(f'''    <!-- Client Channel 2: Shipper Mobile App -->
    <g transform="translate({cl2_x}, {t21_y})" class="node-shadow">
      <rect x="0" y="0" width="{c3_w}" height="{t21_h}" rx="10" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.0"/>
      <rect x="0" y="0" width="{c3_w}" height="32" rx="10" fill="#FAF5FF" stroke="#7C3AED" stroke-width="2.0"/>
      <text x="16" y="22" font-size="16.5" font-weight="900" fill="#6D28D9">2. Ứng Dụng Bưu Tá (Shipper Mobile)</text>
      <text x="{c3_w - 16}" y="22" class="mono" font-size="13" font-weight="900" fill="#7C3AED" text-anchor="end">React Native (:8082)</text>

      <g transform="translate(16, 40)">
        <rect x="10" y="2" width="24" height="34" rx="4" fill="#F8FAFC" stroke="#7C3AED" stroke-width="1.2"/>
        <rect x="14" y="8" width="16" height="20" rx="1" fill="#FAF5FF"/>
      </g>
      <g transform="translate(62, 48)">
        <text x="0" y="18" font-size="15" font-weight="800" fill="#1E293B">Mobile Operations • <tspan class="mono" font-weight="900" fill="#6D28D9">WSS Push</tspan></text>
      </g>
    </g>''')

    # Client 3: Public Tracking Widget
    cl3_x = cl2_x + c3_w + c3_gap
    lines.append(f'''    <!-- Client Channel 3: Public Tracking Widget -->
    <g transform="translate({cl3_x}, {t21_y})" class="node-shadow">
      <rect x="0" y="0" width="{c3_w}" height="{t21_h}" rx="10" fill="#FFFFFF" stroke="#059669" stroke-width="2.0"/>
      <rect x="0" y="0" width="{c3_w}" height="32" rx="10" fill="#F0FDF4" stroke="#059669" stroke-width="2.0"/>
      <text x="16" y="22" font-size="16.5" font-weight="900" fill="#047857">3. Cổng Tra Cứu (Public Portal)</text>
      <text x="{c3_w - 16}" y="22" class="mono" font-size="13" font-weight="900" fill="#059669" text-anchor="end">React / AntD (:5177)</text>

      <g transform="translate(16, 40)">
        <rect x="0" y="6" width="46" height="26" rx="3" fill="#F8FAFC" stroke="#059669" stroke-width="1.2"/>
        <circle cx="16" cy="19" r="5" fill="none" stroke="#059669" stroke-width="1.4"/>
        <line x1="20" y1="23" x2="25" y2="28" stroke="#059669" stroke-width="1.4"/>
      </g>
      <g transform="translate(74, 48)">
        <text x="0" y="18" font-size="15" font-weight="800" fill="#1E293B">Public Search • <tspan class="mono" font-weight="900" fill="#047857">HTTPS REST</tspan></text>
      </g>
    </g>''')

    # Transit Highway 1 (Corridor: 700 to 818, 118px clearance)
    gw_bus_y = 735
    gw_y = 818
    cl1_center_x = cl1_x + c3_w // 2  # 320
    cl3_center_x = cl3_x + c3_w // 2  # 1440

    lines.append(f'''    <!-- Transit Highway 1: Clients to Gateway -->
    <path d="M {cl1_center_x} {t21_y + t21_h} L {cl1_center_x} {gw_bus_y} L {cl3_center_x} {gw_bus_y} L {cl3_center_x} {t21_y + t21_h}" fill="none" stroke="#0284C7" stroke-width="3.4" stroke-dasharray="8,5"/>
    <line x1="880" y1="{t21_y + t21_h}" x2="880" y2="{gw_bus_y}" stroke="#0284C7" stroke-width="3.4" stroke-dasharray="8,5"/>

    <line x1="880" y1="{gw_bus_y}" x2="880" y2="{gw_y}" stroke="#0284C7" stroke-width="3.8"/>
    {draw_arrow(880, gw_y, "down", "#0284C7", 18)}

    <circle cx="880" cy="{gw_bus_y + 26}" r="18" fill="#0284C7" stroke="#FFFFFF" stroke-width="2.6"/>
    <text x="880" y="{gw_bus_y + 32}" text-anchor="middle" class="flow-badge">5</text>

    <!-- Pill Plate (Enhanced Font) -->
    <g transform="translate(640, {gw_bus_y + 48})" class="node-shadow">
      <rect x="0" y="0" width="480" height="38" rx="8" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.2"/>
      <text x="240" y="24" class="mono" font-size="16" font-weight="900" fill="#0284C7" text-anchor="middle">HTTPS POST /api/v1/chat/stream</text>
    </g>''')

    # -------------------------------------------------------------------------
    # TIER 2.2: INGRESS GATEWAY & SECURITY GUARDRAILS (Hub Card, h: 100)
    # y: 818, h: 100
    # -------------------------------------------------------------------------
    gw_w = 1620
    gw_h = 100

    lines.append(f'''    <!-- Tier 2.2: Ingress Gateway & Security Guardrails -->
    <g transform="translate({m_x}, {gw_y})" class="hub-shadow">
      <rect x="0" y="0" width="{gw_w}" height="{gw_h}" rx="12" fill="#F0F9FF" stroke="#0284C7" stroke-width="2.4"/>
      
      <g transform="translate(20, 14)">
        <polygon points="16,2 30,6 30,20 16,30 2,20 2,6" fill="#0284C7"/>
        <path d="M 9 15 L 14 20 L 23 10" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <text x="64" y="33" font-size="19.5" font-weight="900" fill="#0369A1">Cổng Tiếp Nhận &amp; Hàng Rào An Toàn (Ingress Gateway &amp; PII Sanitizer)</text>

      <!-- 3 Abstract Security Pods (Enhanced Font) -->
      <g transform="translate(20, 52)">
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="510" height="36" rx="6" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.4"/>
          <text x="18" y="24" font-size="15" font-weight="900" fill="#0369A1">🛡️ Rate Limiter (Token Bucket: <tspan class="mono" font-weight="800" fill="#334155">20 req/min</tspan>)</text>
        </g>

        <g transform="translate(535, 0)">
          <rect x="0" y="0" width="515" height="36" rx="6" fill="#FFFFFF" stroke="#059669" stroke-width="1.4"/>
          <text x="18" y="24" font-size="15" font-weight="900" fill="#047857">🔒 PII Masking Filter (<tspan class="mono" font-weight="800" fill="#334155">Regex / NER Anonymization</tspan>)</text>
        </g>

        <g transform="translate(1075, 0)">
          <rect x="0" y="0" width="505" height="36" rx="6" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.4"/>
          <text x="18" y="24" font-size="15" font-weight="900" fill="#6D28D9">🧠 Session Buffer (<tspan class="mono" font-weight="800" fill="#334155">Rolling 6 Turns History</tspan>)</text>
        </g>
      </g>
    </g>''')

    # Transit Highway 2 (Corridor: 918 to 1038, 120px clearance)
    orch_y = 1038
    lines.append(f'''    <!-- Transit Highway 2: Gateway to AI Orchestrator -->
    <line x1="880" y1="{gw_y + gw_h}" x2="880" y2="{orch_y}" stroke="#7C3AED" stroke-width="3.8"/>
    {draw_arrow(880, orch_y, "down", "#7C3AED", 18)}

    <circle cx="880" cy="{gw_y + gw_h + 26}" r="18" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2.6"/>
    <text x="880" y="{gw_y + gw_h + 32}" text-anchor="middle" class="flow-badge">6</text>

    <!-- Pill Plate (Enhanced Font) -->
    <g transform="translate(580, {gw_y + gw_h + 48})" class="node-shadow">
      <rect x="0" y="0" width="600" height="38" rx="8" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.2"/>
      <text x="300" y="24" class="mono" font-size="16" font-weight="900" fill="#7C3AED" text-anchor="middle">Sanitized Query + Session Context Buffer</text>
    </g>''')

    # -------------------------------------------------------------------------
    # TIER 2.3: CORE AI ORCHESTRATOR HUB (3 Columns, h: 295)
    # y: 1038, h: 295, w: 500 each, gap: 60
    # -------------------------------------------------------------------------
    orch_h = 295

    lines.append(f'''    <!-- Tier 2.3: Core AI Orchestrator (3 Columns) -->
    <g id="Tier_2_3_AI_Orchestrator">''')

    # --- Column 2.3A: Intent Classifier & Semantic Router ---
    col_a_x = m_x
    lines.append(f'''      <!-- Column 2.3A: Intent Classifier & Router -->
      <g transform="translate({col_a_x}, {orch_y})" class="node-shadow">
        <rect x="0" y="0" width="{c3_w}" height="{orch_h}" rx="12" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.0"/>
        <rect x="0" y="0" width="{c3_w}" height="42" rx="12" fill="#EFF6FF" stroke="#0284C7" stroke-width="2.0"/>
        <text x="16" y="27" font-size="18" font-weight="900" fill="#0369A1">A. Phân Loại Ý Định &amp; Router</text>
        <text x="{c3_w - 16}" y="27" class="mono" font-size="13" font-weight="900" fill="#0284C7" text-anchor="end">«Rule + Regex Switch»</text>

        <!-- ABSTRACT VISUAL: MUX Circuit -->
        <g transform="translate(18, 52)">
          <rect x="0" y="0" width="{c3_w - 36}" height="136" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
          
          <rect x="10" y="44" width="104" height="48" rx="6" fill="#2563EB"/>
          <text x="62" y="66" class="mono" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">Input Query</text>
          <text x="62" y="81" class="mono" font-size="10.5" font-weight="800" fill="#BFDBFE" text-anchor="middle">[Tokenized]</text>

          <circle cx="148" cy="68" r="14" fill="#0284C7" stroke="#BAE6FD" stroke-width="2"/>
          <text x="148" y="73" class="mono" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">MUX</text>

          <line x1="114" y1="68" x2="134" y2="68" stroke="#2563EB" stroke-width="2.6"/>

          <!-- 4 Target Wires (Comfortable 174px Width) -->
          <path d="M 162 68 L 200 68 L 226 24 L 274 24" fill="none" stroke="#7C3AED" stroke-width="2.4"/>
          <circle cx="277" cy="24" r="4" fill="#7C3AED"/>
          <rect x="284" y="12" width="174" height="24" rx="4" fill="#FAF5FF" stroke="#7C3AED" stroke-width="1.2"/>
          <text x="371" y="28" class="mono" font-size="11.5" font-weight="900" fill="#6D28D9" text-anchor="middle">➔ RAG Lai (Cột B)</text>

          <path d="M 162 68 L 226 53 L 274 53" fill="none" stroke="#0284C7" stroke-width="2.4"/>
          <circle cx="277" cy="53" r="4" fill="#0284C7"/>
          <rect x="284" y="41" width="174" height="24" rx="4" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.2"/>
          <text x="371" y="57" class="mono" font-size="11" font-weight="900" fill="#0369A1" text-anchor="middle">➔ trackShipment(:3002)</text>

          <path d="M 162 68 L 226 83 L 274 83" fill="none" stroke="#D97706" stroke-width="2.4"/>
          <circle cx="277" cy="83" r="4" fill="#D97706"/>
          <rect x="284" y="71" width="174" height="24" rx="4" fill="#FFFBEB" stroke="#D97706" stroke-width="1.2"/>
          <text x="371" y="87" class="mono" font-size="11" font-weight="900" fill="#B45309" text-anchor="middle">➔ calculateFee(:3003)</text>

          <path d="M 162 68 L 200 68 L 226 112 L 274 112" fill="none" stroke="#DC2626" stroke-width="2.4"/>
          <circle cx="277" cy="112" r="4" fill="#DC2626"/>
          <rect x="284" y="100" width="174" height="24" rx="4" fill="#FEF2F2" stroke="#DC2626" stroke-width="1.2"/>
          <text x="371" y="116" class="mono" font-size="11" font-weight="900" fill="#B91C1C" text-anchor="middle">➔ reportIncident(:3008)</text>
        </g>

        <!-- Abstract Router Chips (Enhanced Font) -->
        <g transform="translate(18, 202)">
          <rect x="0" y="0" width="226" height="34" rx="5" fill="#F8FAFC" stroke="#7C3AED" stroke-width="1.3"/>
          <text x="113" y="22" class="mono" font-size="13" font-weight="900" fill="#6D28D9" text-anchor="middle">Q&amp;A Intent ➔ RAG Core</text>

          <rect x="238" y="0" width="226" height="34" rx="5" fill="#F8FAFC" stroke="#0284C7" stroke-width="1.3"/>
          <text x="351" y="22" class="mono" font-size="12.5" font-weight="900" fill="#0369A1" text-anchor="middle">AWB Regex ➔ /NX-[0-9]&#123;6,10&#125;/i</text>
        </g>

        <g transform="translate(18, 248)">
          <rect x="0" y="0" width="{c3_w - 36}" height="34" rx="5" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.3"/>
          <text x="{(c3_w - 36)//2}" y="22" class="mono" font-size="14.5" font-weight="900" fill="#0369A1" text-anchor="middle">Fast Routing (&lt; 2ms) • Fallback to RAG</text>
        </g>
      </g>''')

    # --- Column 2.3B: Hybrid Retrieval Engine ---
    col_b_x = col_a_x + c3_w + c3_gap
    lines.append(f'''      <!-- Column 2.3B: Hybrid Retrieval Engine -->
      <g transform="translate({col_b_x}, {orch_y})" class="node-shadow">
        <rect x="0" y="0" width="{c3_w}" height="{orch_h}" rx="12" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.2"/>
        <rect x="0" y="0" width="{c3_w}" height="42" rx="12" fill="#FAF5FF" stroke="#7C3AED" stroke-width="2.2"/>
        <text x="16" y="27" font-size="18" font-weight="900" fill="#6D28D9">B. Hồi Xuất Lai (Hybrid RAG)</text>
        <text x="{c3_w - 16}" y="27" class="mono" font-size="13" font-weight="900" fill="#7C3AED" text-anchor="end">«Dense 70% + Sparse 30%»</text>

        <!-- ABSTRACT VISUAL: Dual Stream Search & Fusion -->
        <g transform="translate(18, 52)">
          <rect x="0" y="0" width="{c3_w - 36}" height="136" rx="8" fill="#FAF5FF" stroke="#E9D5FF" stroke-width="1.2"/>

          <g transform="translate(12, 12)">
            <rect x="0" y="0" width="220" height="48" rx="6" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.4"/>
            <text x="10" y="20" class="mono" font-size="13" font-weight="900" fill="#0369A1">Dense Vector (Cosine RAM)</text>
            <text x="10" y="38" class="mono" font-size="12" font-weight="800" fill="#2563EB">Sim(Q, D) = Q · D (Cosine Metric) &lt; 5ms</text>
          </g>

          <g transform="translate(12, 74)">
            <rect x="0" y="0" width="220" height="48" rx="6" fill="#FFFBEB" stroke="#D97706" stroke-width="1.4"/>
            <text x="10" y="20" class="mono" font-size="13" font-weight="900" fill="#B45309">Sparse Lexical (BM25 Match)</text>
            <text x="10" y="38" class="mono" font-size="12" font-weight="800" fill="#D97706">Keyword &amp; Domain Lexicon</text>
          </g>

          <path d="M 232 36 L 274 36 L 304 65" fill="none" stroke="#0284C7" stroke-width="2.6"/>
          <path d="M 232 98 L 274 98 L 304 71" fill="none" stroke="#D97706" stroke-width="2.6"/>

          <circle cx="330" cy="68" r="23" fill="#7C3AED" stroke="#E9D5FF" stroke-width="2.4"/>
          <text x="330" y="65" class="mono" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">FUSION</text>
          <text x="330" y="78" class="mono" font-size="11" font-weight="900" fill="#FDE047" text-anchor="middle">70 / 30</text>

          <line x1="353" y1="68" x2="388" y2="68" stroke="#7C3AED" stroke-width="2.6"/>
          {draw_arrow(393, 68, "right", "#7C3AED", 12)}

          <g transform="translate(398, 14)">
            <rect x="0" y="0" width="56" height="19" rx="3" fill="#059669"/>
            <text x="28" y="14" class="mono" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">#1 0.94</text>

            <rect x="0" y="25" width="56" height="19" rx="3" fill="#10B981"/>
            <text x="28" y="39" class="mono" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">#2 0.88</text>

            <rect x="0" y="50" width="56" height="19" rx="3" fill="#34D399"/>
            <text x="28" y="64" class="mono" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">#3 0.82</text>

            <rect x="0" y="75" width="56" height="19" rx="3" fill="#6EE7B7"/>
            <text x="28" y="89" class="mono" font-size="11" font-weight="900" fill="#065F46" text-anchor="middle">#4 0.76</text>

            <rect x="0" y="100" width="56" height="19" rx="3" fill="#A7F3D0"/>
            <text x="28" y="114" class="mono" font-size="11" font-weight="900" fill="#065F46" text-anchor="middle">#5 0.71</text>
          </g>
        </g>

        <!-- Abstract Fusion Formula Plate (Enhanced Font) -->
        <g transform="translate(18, 202)">
          <rect x="0" y="0" width="{c3_w - 36}" height="34" rx="5" fill="#FAF5FF" stroke="#A855F7" stroke-width="1.3"/>
          <text x="{(c3_w - 36)//2}" y="22" class="mono" font-size="14.5" font-weight="900" fill="#7C3AED" text-anchor="middle">Score = 0.70 × Sim_Dense + 0.30 × Score_Sparse</text>
        </g>

        <g transform="translate(18, 248)">
          <rect x="0" y="0" width="{c3_w - 36}" height="34" rx="5" fill="#F0FDF4" stroke="#059669" stroke-width="1.3"/>
          <text x="{(c3_w - 36)//2}" y="22" class="mono" font-size="14.5" font-weight="900" fill="#047857" text-anchor="middle">&#10003; Trích Xuất Top-K Chunks Phù Hợp Nhất</text>
        </g>
      </g>''')

    # --- Column 2.3C: Tool Dispatcher & Live Microservices ---
    col_c_x = col_b_x + c3_w + c3_gap
    lines.append(f'''      <!-- Column 2.3C: Tool Dispatcher & Live Microservices -->
      <g transform="translate({col_c_x}, {orch_y})" class="node-shadow">
        <rect x="0" y="0" width="{c3_w}" height="{orch_h}" rx="12" fill="#FFFFFF" stroke="#059669" stroke-width="2.0"/>
        <rect x="0" y="0" width="{c3_w}" height="42" rx="12" fill="#F0FDF4" stroke="#059669" stroke-width="2.0"/>
        <text x="16" y="27" font-size="18" font-weight="900" fill="#047857">C. Điều Phối Live Tools</text>
        <text x="{c3_w - 16}" y="27" class="mono" font-size="13" font-weight="900" fill="#059669" text-anchor="end">«Microservices Mesh»</text>

        <!-- ABSTRACT VISUAL: Microservices Mesh & Circuit Breaker -->
        <g transform="translate(18, 52)">
          <rect x="0" y="0" width="{c3_w - 36}" height="136" rx="8" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1.2"/>

          <g transform="translate(10, 12)">
            <rect x="0" y="0" width="214" height="34" rx="5" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.3"/>
            <circle cx="16" cy="17" r="6" fill="#0284C7"/>
            <text x="28" y="22" class="mono" font-size="11.5" font-weight="900" fill="#0369A1">shipment-service (:3002)</text>
          </g>

          <g transform="translate(10, 52)">
            <rect x="0" y="0" width="214" height="34" rx="5" fill="#FFFFFF" stroke="#D97706" stroke-width="1.3"/>
            <circle cx="16" cy="17" r="6" fill="#D97706"/>
            <text x="28" y="22" class="mono" font-size="11.5" font-weight="900" fill="#B45309">pricing-service (:3003)</text>
          </g>

          <g transform="translate(10, 92)">
            <rect x="0" y="0" width="214" height="34" rx="5" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.3"/>
            <circle cx="16" cy="17" r="6" fill="#DC2626"/>
            <text x="28" y="22" class="mono" font-size="11.5" font-weight="900" fill="#B91C1C">incident-service (:3008)</text>
          </g>

          <line x1="224" y1="29" x2="250" y2="68" stroke="#059669" stroke-width="2.2"/>
          <line x1="224" y1="68" x2="250" y2="68" stroke="#059669" stroke-width="2.2"/>
          <line x1="224" y1="109" x2="250" y2="68" stroke="#059669" stroke-width="2.2"/>

          <!-- Circuit Breaker Box (Enhanced Font) -->
          <g transform="translate(250, 28)">
            <rect x="0" y="0" width="204" height="82" rx="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5"/>
            <rect x="0" y="0" width="204" height="26" rx="6" fill="#FEF2F2"/>
            <text x="102" y="18" class="mono" font-size="11.5" font-weight="900" fill="#DC2626" text-anchor="middle">CIRCUIT BREAKER [2000ms]</text>
            
            <circle cx="28" cy="54" r="11" fill="#10B981"/>
            <text x="28" y="59" class="mono" font-size="11.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">ON</text>
            <text x="46" y="49" font-size="13" font-weight="900" fill="#1E293B">State: CLOSED</text>
            <text x="46" y="66" class="mono" font-size="11.5" font-weight="800" fill="#059669">Normal Operation</text>
          </g>
        </g>

        <!-- Abstract Microservices Chips (Enhanced Font) -->
        <g transform="translate(18, 202)">
          <rect x="0" y="0" width="226" height="34" rx="5" fill="#F8FAFC" stroke="#0284C7" stroke-width="1.3"/>
          <text x="113" y="22" class="mono" font-size="13" font-weight="900" fill="#0369A1" text-anchor="middle">Live DTOs: Orders &amp; Tariffs</text>

          <rect x="238" y="0" width="226" height="34" rx="5" fill="#F8FAFC" stroke="#DC2626" stroke-width="1.3"/>
          <text x="351" y="22" class="mono" font-size="13" font-weight="900" fill="#B91C1C" text-anchor="middle">Auto Isolation (&gt; 2000ms)</text>
        </g>

        <g transform="translate(18, 248)">
          <rect x="0" y="0" width="{c3_w - 36}" height="34" rx="5" fill="#F0FDF4" stroke="#059669" stroke-width="1.3"/>
          <text x="{(c3_w - 36)//2}" y="22" class="mono" font-size="14.5" font-weight="900" fill="#047857" text-anchor="middle">API Latency &lt; 180ms • Resilient Fallback</text>
        </g>
      </g>
    </g>''')

    # Transit Highway 3 (Corridor: 1333 to 1450, 117px clearance)
    sw_y = 1450
    orch_bus_y = orch_y + orch_h + 24  # 1357

    lines.append(f'''    <!-- Transit Highway 3: Orchestrator to Prompt Assembler -->
    <path d="M {col_a_x + c3_w//2} {orch_y + orch_h} L {col_a_x + c3_w//2} {orch_bus_y} L {col_c_x + c3_w//2} {orch_bus_y} L {col_c_x + c3_w//2} {orch_y + orch_h}" fill="none" stroke="#D97706" stroke-width="3.4" stroke-dasharray="8,5"/>
    <line x1="880" y1="{orch_y + orch_h}" x2="880" y2="{orch_bus_y}" stroke="#D97706" stroke-width="3.4" stroke-dasharray="8,5"/>

    <line x1="880" y1="{orch_bus_y}" x2="880" y2="{sw_y}" stroke="#D97706" stroke-width="3.8"/>
    {draw_arrow(880, sw_y, "down", "#D97706", 18)}

    <circle cx="880" cy="{orch_bus_y + 26}" r="18" fill="#D97706" stroke="#FFFFFF" stroke-width="2.6"/>
    <text x="880" y="{orch_bus_y + 32}" text-anchor="middle" class="flow-badge">7</text>

    <!-- Pill Plate (Enhanced Font) -->
    <g transform="translate(540, {orch_bus_y + 48})" class="node-shadow">
      <rect x="0" y="0" width="680" height="38" rx="8" fill="#FFFFFF" stroke="#D97706" stroke-width="2.2"/>
      <text x="340" y="24" class="mono" font-size="16" font-weight="900" fill="#B45309" text-anchor="middle">Aggregated Context: SOP Chunks + Live DTOs + History</text>
    </g>''')

    # -------------------------------------------------------------------------
    # TIER 2.4: CONTEXT SANDWICH PROMPT & LLM STREAMING ENGINE (h: 232)
    # y: 1450, h: 232
    # Left: Context Sandwich (w: 960)
    # Right: Foundation LLM (w: 600)
    # -------------------------------------------------------------------------
    t24_y = sw_y
    t24_h = 232
    sw_w = 960
    llm_w = 600
    llm_x = m_x + sw_w + 60

    # Left Column: Context Sandwich Prompt Assembler (Abstract 4-Deck Stack)
    lines.append(f'''    <!-- Tier 2.4: Context Sandwich & LLM Engine -->
    <!-- Left Column: Context Sandwich Prompt (960px) -->
    <g transform="translate({m_x}, {t24_y})" class="node-shadow">
      <rect x="0" y="0" width="{sw_w}" height="{t24_h}" rx="12" fill="#FFFFFF" stroke="#D97706" stroke-width="2.0"/>
      <rect x="0" y="0" width="{sw_w}" height="42" rx="12" fill="#FFFBEB" stroke="#D97706" stroke-width="2.0"/>
      <text x="16" y="27" font-size="18" font-weight="900" fill="#92400E">Cấu Trúc Bánh Mì Kẹp Ngữ Cảnh (Context Sandwich Architecture)</text>
      <text x="{sw_w - 16}" y="27" class="mono" font-size="13.5" font-weight="900" fill="#B45309" text-anchor="end">«Zero Hallucination Standard»</text>

      <!-- ABSTRACT 4-DECK PHYSICAL SANDWICH LAYERS (Enhanced Font) -->
      <g transform="translate(18, 50)">
        <!-- Layer 1: Top Bun -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="{sw_w - 36}" height="36" rx="5" fill="#F8FAFC" stroke="#475569" stroke-width="1.4"/>
          <rect x="0" y="0" width="180" height="36" rx="5" fill="#475569"/>
          <text x="90" y="23" class="mono" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">TẦNG 1: DIRECTIVES</text>
          <text x="194" y="24" font-size="15" font-weight="800" fill="#1E293B">System Directives &amp; Role Anchoring (Anti-Hallucination Constraints)</text>
        </g>

        <!-- Layer 2: SOP Chunks -->
        <g transform="translate(0, 43)">
          <rect x="0" y="0" width="{sw_w - 36}" height="36" rx="5" fill="#FAF5FF" stroke="#7C3AED" stroke-width="1.4"/>
          <rect x="0" y="0" width="180" height="36" rx="5" fill="#7C3AED"/>
          <text x="90" y="23" class="mono" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">TẦNG 2: SOP CHUNKS</text>
          <text x="194" y="24" font-size="15" font-weight="800" fill="#6D28D9">Retrieved Knowledge Chunks (Top-K Semantics + Source Metadata)</text>
        </g>

        <!-- Layer 3: Live DTOs -->
        <g transform="translate(0, 86)">
          <rect x="0" y="0" width="{sw_w - 36}" height="36" rx="5" fill="#F0FDF4" stroke="#059669" stroke-width="1.4"/>
          <rect x="0" y="0" width="180" height="36" rx="5" fill="#059669"/>
          <text x="90" y="23" class="mono" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">TẦNG 3: LIVE DTOs</text>
          <text x="194" y="24" font-size="15" font-weight="800" fill="#047857">Real-time Microservices DTOs (Order Tracking, Pricing, Incident Status)</text>
        </g>

        <!-- Layer 4: History -->
        <g transform="translate(0, 129)">
          <rect x="0" y="0" width="{sw_w - 36}" height="36" rx="5" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.4"/>
          <rect x="0" y="0" width="180" height="36" rx="5" fill="#0284C7"/>
          <text x="90" y="23" class="mono" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">TẦNG 4: CONVERSATION</text>
          <text x="194" y="24" font-size="15" font-weight="800" fill="#0369A1">Multi-Turn Conversation Buffer (Rolling 6 Turns Short-Term History)</text>
        </g>
      </g>
    </g>''')

    # Inference Connector
    inj_y = t24_y + t24_h // 2
    lines.append(f'''    <!-- Defined Inference Injection Highway (Badge 8) -->
    <line x1="{m_x + sw_w}" y1="{inj_y}" x2="{llm_x}" y2="{inj_y}" stroke="#7C3AED" stroke-width="3.8"/>
    {draw_arrow(llm_x, inj_y, "right", "#7C3AED", 18)}
    
    <circle cx="{(m_x + sw_w + llm_x)//2}" cy="{inj_y - 25}" r="18" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2.6"/>
    <text x="{(m_x + sw_w + llm_x)//2}" y="{inj_y - 19}" text-anchor="middle" class="flow-badge">8</text>''')

    # Right Column: Foundation LLM Engine & SSE Streaming
    lines.append(f'''    <!-- Right Column: Foundation LLM Engine & SSE Streaming (600px) -->
    <g transform="translate({llm_x}, {t24_y})" class="node-shadow">
      <rect x="0" y="0" width="{llm_w}" height="{t24_h}" rx="12" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.0"/>
      <rect x="0" y="0" width="{llm_w}" height="42" rx="12" fill="#FAF5FF" stroke="#7C3AED" stroke-width="2.0"/>
      <text x="16" y="27" font-size="18" font-weight="900" fill="#6D28D9">Mô Hình Nền Tảng &amp; Phát Luồng SSE</text>
      <text x="{llm_w - 16}" y="27" class="mono" font-size="13.5" font-weight="900" fill="#7C3AED" text-anchor="end">«Streaming Core»</text>

      <!-- ABSTRACT VISUAL: LLM & Stream Publisher (Enhanced Font) -->
      <g transform="translate(18, 50)">
        <!-- LLM API Box -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="{llm_w - 36}" height="76" rx="6" fill="#F8FAFC" stroke="#7C3AED" stroke-width="1.3"/>
          <g transform="translate(14, 12)">
            <rect x="0" y="0" width="62" height="52" rx="4" fill="#FAF5FF" stroke="#7C3AED" stroke-width="1.4"/>
            <text x="31" y="22" class="mono" font-size="12" font-weight="900" fill="#6D28D9" text-anchor="middle">Gemini</text>
            <text x="31" y="39" class="mono" font-size="12" font-weight="900" fill="#6D28D9" text-anchor="middle">Flash</text>
          </g>
          <g transform="translate(90, 20)">
            <text x="0" y="18" font-size="16.5" font-weight="900" fill="#1E293B">Google Gemini 1.5 / 2.5 Flash API</text>
            <text x="0" y="40" class="mono" font-size="13.5" font-weight="800" fill="#6D28D9">1M Tokens Context • Strict JSON Schema • TTFT &lt; 500ms</text>
          </g>
        </g>

        <!-- SSE Publisher Box -->
        <g transform="translate(0, 86)">
          <rect x="0" y="0" width="{llm_w - 36}" height="76" rx="6" fill="#F0FDF4" stroke="#059669" stroke-width="1.3"/>
          <g transform="translate(14, 12)">
            <rect x="0" y="0" width="62" height="52" rx="4" fill="#FFFFFF" stroke="#059669" stroke-width="1.4"/>
            <text x="31" y="31" class="mono" font-size="13.5" font-weight="900" fill="#047857" text-anchor="middle">SSE</text>
          </g>
          <g transform="translate(90, 20)">
            <text x="0" y="18" font-size="16.5" font-weight="900" fill="#047857">Bộ Phát Luồng (SSE Event Publisher)</text>
            <text x="0" y="40" class="mono" font-size="13.5" font-weight="800" fill="#047857">text/event-stream • Token Streaming &amp; Rich UI Cards</text>
          </g>
        </g>
      </g>
    </g>
  </g>''')

    # =========================================================================
    # DEFINED RETURN STREAM CONNECTOR: SSE Publisher -> Client Interfaces (Badge 9)
    # =========================================================================
    ret_y1 = t24_y + t24_h  # 1450 + 232 = 1682
    ret_bar_y = ret_y1 + 40  # 1722
    client_return_target_y = t21_y + t21_h // 2  # 618 + 41 = 659
    ret_left_margin_x = 32

    lines.append(f'''  <!-- Defined Return Stream Loop: Realtime Event Stream to Clients (Badge 9) -->
  <g id="Return_Stream_Highway">
    <path d="M {llm_x + llm_w//2} {ret_y1} L {llm_x + llm_w//2} {ret_bar_y} L {ret_left_margin_x} {ret_bar_y} L {ret_left_margin_x} {client_return_target_y} L {m_x} {client_return_target_y}" fill="none" stroke="#059669" stroke-width="3.5" stroke-dasharray="8,5"/>
    {draw_arrow(m_x, client_return_target_y, "right", "#059669", 18)}

    <circle cx="{llm_x + 100}" cy="{ret_bar_y}" r="18" fill="#059669" stroke="#FFFFFF" stroke-width="2.6"/>
    <text x="{llm_x + 100}" y="{ret_bar_y + 6}" text-anchor="middle" class="flow-badge">9</text>

    <!-- Return Stream Pill Plate (Enhanced Font) -->
    <g transform="translate(370, {ret_bar_y - 19})" class="node-shadow">
      <rect x="0" y="0" width="720" height="38" rx="8" fill="#F0FDF4" stroke="#059669" stroke-width="2.2"/>
      <text x="360" y="24" class="mono" font-size="15.5" font-weight="900" fill="#047857" text-anchor="middle">⚡ LUỒNG PHẢN HỒI (SSE STREAMING): Real-time Tokens &amp; Structured UI Cards</text>
    </g>
  </g>''')

    # =========================================================================
    # ARCHITECTURAL FOOTNOTE BAR (y: 1782, h: 44, w: 1620, x: 70)
    # =========================================================================
    lines.append(f'''  <!-- Architectural Footnote (Enhanced Font) -->
  <g id="Technical_Note" transform="translate({m_x}, 1782)">
    <rect x="0" y="0" width="{gw_w}" height="44" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.4"/>
    <circle cx="24" cy="22" r="5" fill="#7C3AED"/>
    <text x="42" y="27" font-size="15" font-weight="800" fill="#1E293B">Kiến trúc: <tspan font-weight="700" fill="#334155">RAG Lai In-Memory (&lt; 5ms) kết hợp Microservices Mesh • Prompt Bánh Mì Kẹp triệt tiêu ảo giác • Streaming qua SSE.</tspan></text>
  </g>

</svg>''')

    svg_content = "\n".join(lines)

    # Sanitize any raw unescaped '&' and '<' characters
    svg_content = re.sub(r'&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[a-fA-F0-9]+);)', '&amp;', svg_content)

    return svg_content

def main():
    svg_content = build_architecture_svg()

    # Validate XML
    try:
        ET.fromstring(svg_content)
        print("XML Syntax Validation: PASSED (Well-formed XML)")
    except ET.ParseError as e:
        print(f"XML Validation FAILED: {e}")
        return 1

    # Write to target files
    for file_path in OUTPUT_FILES:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"Successfully generated {file_path} ({len(svg_content.encode('utf-8'))} bytes)")

    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
