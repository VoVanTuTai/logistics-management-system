#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate a Figma-Native, Presentation-Grade, Clean, Borderless & Visual RAG Core Components Pipeline SVG
for Nexus Logistics Management System.

Canvas: 1920 x 1080 (Standard 16:9 Presentation Frame)

Optimizations for Figma & Slide Presentation:
1. Unitless font-size (e.g., font-size="24" instead of "24px"): Prevents Figma 72/96 DPI scaling shrinkage bug.
2. 100% Inline presentation attributes (font-family, stroke, stroke-width, fill): Guarantees Figma does not strip styles.
3. Extra-Large Presentation Typography:
   - Header: 26 (Title), 16 (Subtitle)
   - Section Titles: 20
   - Component Titles: 22
   - Spec Badges / Pills: 14.5
   - Explanatory Subtext: 16
   - Graphics Content: 13.5 - 15.5
4. Bolder, high-impact directional arrows (stroke-width 5.5, arrowhead size 24; Bus line stroke 6.5, arrowhead 28).
5. Clean air gaps: zero text-arrow collisions, zero text-bus collisions, zero footer overlaps.
6. 100% Native vector, zero <marker> tags, valid XML.
"""

import xml.etree.ElementTree as ET

FONT_SANS = 'Inter, Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
FONT_MONO = 'JetBrains Mono, ui-monospace, Menlo, Consolas, monospace'

def draw_arrow(x, y, direction="right", color="#0F172A", size=24):
    if direction == "right":
        points = f"{x},{y} {x-size},{y-size*0.55:.1f} {x-size},{y+size*0.55:.1f}"
    elif direction == "left":
        points = f"{x},{y} {x+size},{y-size*0.55:.1f} {x+size},{y+size*0.55:.1f}"
    elif direction == "down":
        points = f"{x},{y} {x-size*0.55:.1f},{y-size} {x+size*0.55:.1f},{y-size}"
    elif direction == "up":
        points = f"{x},{y} {x-size*0.55:.1f},{y+size} {x+size*0.55:.1f},{y+size}"
    return f'<polygon points="{points}" fill="{color}"/>'

def build_svg():
    W, H = 1920, 1080
    lines = []
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">')
    
    # Definitions
    lines.append('  <defs>')
    lines.append('    <style>')
    lines.append('      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;family=JetBrains+Mono:wght@500;600;700;800&amp;display=swap");')
    lines.append('    </style>')
    
    # Gradients
    lines.append('    <linearGradient id="titleGrad" x1="0" y1="0" x2="1" y2="0">')
    lines.append('      <stop offset="0%" stop-color="#0F172A"/>')
    lines.append('      <stop offset="100%" stop-color="#1E293B"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="tensorGrad" x1="0" y1="0" x2="1" y2="0">')
    lines.append('      <stop offset="0%" stop-color="#2563EB"/>')
    lines.append('      <stop offset="50%" stop-color="#7C3AED"/>')
    lines.append('      <stop offset="100%" stop-color="#DB2777"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="dbGrad" x1="0" y1="0" x2="0" y2="1">')
    lines.append('      <stop offset="0%" stop-color="#BAE6FD"/>')
    lines.append('      <stop offset="100%" stop-color="#E0F2FE"/>')
    lines.append('    </linearGradient>')
    lines.append('    <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">')
    lines.append('      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.08"/>')
    lines.append('    </filter>')
    lines.append('  </defs>')

    # Background (Clean, crisp pure white)
    lines.append(f'  <rect width="{W}" height="{H}" fill="#FFFFFF"/>')

    # =========================================================================
    # HEADER (Height: 88)
    # =========================================================================
    lines.append('  <!-- Header Bar -->')
    lines.append('  <rect x="40" y="24" width="1840" height="88" rx="8" fill="url(#titleGrad)"/>')
    lines.append(f'  <text x="70" y="62" font-family="{FONT_SANS}" font-size="26" font-weight="900" fill="#FFFFFF" letter-spacing="-0.3px">HÌNH 2.5: CÁC THÀNH PHẦN CỐT LÕI CỦA PHÂN HỆ AI RAG TRONG HỆ THỐNG QUẢN TRỊ BƯU CHÍNH</text>')
    lines.append(f'  <text x="70" y="93" font-family="{FONT_SANS}" font-size="16" font-weight="500" fill="#94A3B8">Sơ đồ Kiến trúc Luồng Xử lý Trực quan • Phân hệ @nexus/chatbot-service (:3013) • Nạp ngoại tuyến &amp; Truy hồi lai</text>')
    
    # Header Badges
    lines.append('  <rect x="1510" y="38" width="350" height="60" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1.6"/>')
    lines.append(f'  <text x="1685" y="63" font-family="{FONT_MONO}" font-size="14" font-weight="800" fill="#38BDF8" text-anchor="middle">ARCH-RAG-COMP-03</text>')
    lines.append(f'  <text x="1685" y="83" font-family="{FONT_MONO}" font-size="12" font-weight="700" fill="#CBD5E1" text-anchor="middle">100% NATIVE VECTOR • FIGMA COMPATIBLE</text>')

    # =========================================================================
    # SECTION 1 LABEL: OFFLINE INGESTION PIPELINE
    # =========================================================================
    lines.append('  <!-- Section 1 Header (Borderless) -->')
    lines.append('  <g transform="translate(50, 140)">')
    lines.append('    <circle cx="14" cy="14" r="8" fill="#2563EB"/>')
    lines.append(f'    <text x="34" y="22" font-family="{FONT_SANS}" font-size="20" font-weight="900" fill="#0F172A">TIẾN TRÌNH NGOẠI TUYẾN: NẠP &amp; LẬP CHỈ MỤC TRI THỨC BƯU CHÍNH (OFFLINE INGESTION)</text>')
    lines.append(f'    <text x="1820" y="22" font-family="{FONT_MONO}" font-size="14.5" font-weight="700" fill="#64748B" text-anchor="end">AST Markdown Parser • Breadcrumbs • Sliding Window 16% • MRL 512-D</text>')
    lines.append('  </g>')

    # -------------------------------------------------------------------------
    # STAGE 1: 5 NODES (Y center ~ 285)
    # Centers:
    # Node 1: X = 195
    # Node 2: X = 545
    # Node 3: X = 905
    # Node 4: X = 1260
    # Node 5: X = 1625
    # -------------------------------------------------------------------------

    # --- NODE 1: Document Loaders ---
    lines.append('  <!-- Node 1: Document Loaders -->')
    lines.append('  <g id="node-loaders" transform="translate(60, 174)">')
    # Graphic: Layered Files
    lines.append('    <g transform="translate(35, 0)">')
    # Back sheet
    lines.append('      <rect x="24" y="0" width="125" height="100" rx="5" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.4"/>')
    lines.append('      <rect x="36" y="14" width="75" height="6" rx="2" fill="#CBD5E1"/>')
    lines.append('      <rect x="36" y="26" width="95" height="5" rx="2" fill="#E2E8F0"/>')
    # Mid sheet
    lines.append('      <rect x="12" y="12" width="125" height="100" rx="5" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.4"/>')
    lines.append('      <rect x="24" y="26" width="85" height="6" rx="2" fill="#94A3B8"/>')
    lines.append('      <rect x="24" y="38" width="95" height="5" rx="2" fill="#CBD5E1"/>')
    # Front sheet
    lines.append('      <rect x="0" y="24" width="125" height="100" rx="5" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" filter="url(#softGlow)"/>')
    lines.append('      <rect x="10" y="35" width="48" height="24" rx="3" fill="#EF4444"/>')
    lines.append(f'      <text x="34" y="52" font-family="{FONT_MONO}" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">.MD</text>')
    lines.append(f'      <text x="66" y="52" font-family="{FONT_MONO}" font-size="14.5" font-weight="800" fill="#0F172A">02-insurance</text>')
    lines.append('      <rect x="10" y="68" width="105" height="7" rx="2" fill="#64748B"/>')
    lines.append('      <rect x="10" y="80" width="95" height="5" rx="2" fill="#94A3B8"/>')
    lines.append('      <rect x="10" y="91" width="80" height="5" rx="2" fill="#CBD5E1"/>')
    lines.append('      <rect x="10" y="102" width="100" height="5" rx="2" fill="#E2E8F0"/>')
    # Fold corner
    lines.append('      <polygon points="107,24 125,42 107,42" fill="#E2E8F0"/>')
    lines.append('      <polygon points="107,24 125,42 125,24" fill="#FFFFFF"/>')
    lines.append('    </g>')
    # Title & Badges
    lines.append(f'    <text x="135" y="158" font-family="{FONT_SANS}" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">1. Tài liệu SOP Bưu chính</text>')
    lines.append('    <rect x="-5" y="172" width="280" height="36" rx="18" fill="#EFF6FF"/>')
    lines.append(f'    <text x="135" y="196" font-family="{FONT_MONO}" font-size="14.5" font-weight="700" fill="#1D4ED8" text-anchor="middle">Kho 9 SOP • AST Parser (#H1..#H3)</text>')
    lines.append(f'    <text x="135" y="232" font-family="{FONT_SANS}" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">Bảo toàn bảng cước • SHA-256 Reload</text>')
    lines.append('  </g>')

    # Arrow 1 -> 2 (Extra-Bold Presentation Connector, 100% Inline)
    lines.append('  <line x1="335" y1="248" x2="375" y2="248" stroke="#0F172A" stroke-width="5.5" stroke-linecap="round"/>')
    lines.append(f'  {draw_arrow(395, 248, "right", "#0F172A", 24)}')

    # --- NODE 2: Semantic Splitter ---
    lines.append('  <!-- Node 2: Semantic Splitter -->')
    lines.append('  <g id="node-splitter" transform="translate(405, 174)">')
    # Graphic: Sliding Window Illustration
    lines.append('    <g transform="translate(15, 15)">')
    # Ruler / Stream
    lines.append('      <rect x="0" y="26" width="270" height="14" rx="3" fill="#E2E8F0"/>')
    # Window 1
    lines.append('      <rect x="0" y="6" width="150" height="48" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="2"/>')
    lines.append(f'      <text x="54" y="37" font-family="{FONT_MONO}" font-size="15" font-weight="800" fill="#1D4ED8" text-anchor="middle">W1: 250 từ</text>')
    # Overlap Zone
    lines.append('      <rect x="108" y="6" width="54" height="78" rx="4" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.8" stroke-dasharray="4,2"/>')
    lines.append(f'      <text x="135" y="61" font-family="{FONT_MONO}" font-size="12.5" font-weight="900" fill="#B45309" text-anchor="middle">GỐI ĐẦU</text>')
    lines.append(f'      <text x="135" y="75" font-family="{FONT_MONO}" font-size="11.5" font-weight="800" fill="#B45309" text-anchor="middle">40w (16%)</text>')
    # Window 2
    lines.append('      <rect x="110" y="36" width="160" height="48" rx="6" fill="#F0FDF4" stroke="#10B981" stroke-width="2"/>')
    lines.append(f'      <text x="205" y="67" font-family="{FONT_MONO}" font-size="15" font-weight="800" fill="#047857" text-anchor="middle">W2: 250 từ</text>')
    # Stride Line
    lines.append('      <line x1="0" y1="98" x2="110" y2="98" stroke="#64748B" stroke-width="1.6" stroke-dasharray="3,2"/>')
    lines.append(f'      <text x="55" y="114" font-family="{FONT_MONO}" font-size="13" font-weight="700" fill="#64748B" text-anchor="middle">Stride = 210w</text>')
    lines.append('    </g>')
    # Title & Badges
    lines.append(f'    <text x="150" y="158" font-family="{FONT_SANS}" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">2. Bộ phân tách Ngữ nghĩa</text>')
    lines.append('    <rect x="5" y="172" width="290" height="36" rx="18" fill="#FFFBEB"/>')
    lines.append(f'    <text x="150" y="196" font-family="{FONT_MONO}" font-size="14.5" font-weight="700" fill="#B45309" text-anchor="middle">Sliding Window (250w / 40w Overlap)</text>')
    lines.append(f'    <text x="150" y="232" font-family="{FONT_SANS}" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">Khắc phục triệt để lỗi cắt ngang điều khoản</text>')
    lines.append('  </g>')

    # Arrow 2 -> 3 (Extra-Bold Presentation Connector)
    lines.append('  <line x1="695" y1="248" x2="735" y2="248" stroke="#0F172A" stroke-width="5.5" stroke-linecap="round"/>')
    lines.append(f'  {draw_arrow(755, 248, "right", "#0F172A", 24)}')

    # --- NODE 3: Parsed SOP Chunks ---
    lines.append('  <!-- Node 3: Parsed Chunks -->')
    lines.append('  <g id="node-chunks" transform="translate(765, 174)">')
    # Graphic: Stacked SOP Cards
    lines.append('    <g transform="translate(10, 10)">')
    # Breadcrumb Header
    lines.append('      <rect x="0" y="0" width="270" height="28" rx="5" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1.4"/>')
    lines.append(f'      <text x="135" y="20" font-family="{FONT_MONO}" font-size="13" font-weight="700" fill="#475569" text-anchor="middle">Breadcrumb: File &gt; H1 &gt; H2 &gt; H3</text>')
    # Chunk 1
    lines.append('      <rect x="0" y="34" width="270" height="34" rx="5" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.4"/>')
    lines.append('      <rect x="8" y="40" width="76" height="22" rx="3" fill="#E0F2FE"/>')
    lines.append(f'      <text x="46" y="56" font-family="{FONT_MONO}" font-size="12" font-weight="800" fill="#0369A1" text-anchor="middle">#chunk-01</text>')
    lines.append(f'      <text x="92" y="57" font-family="{FONT_SANS}" font-size="14" font-weight="700" fill="#0F172A">Quy đổi = (D x R x C)/6000</text>')
    # Chunk 2 (Highlighted)
    lines.append('      <rect x="0" y="74" width="270" height="38" rx="5" fill="#F0FDF4" stroke="#10B981" stroke-width="2" filter="url(#softGlow)"/>')
    lines.append('      <rect x="8" y="82" width="76" height="22" rx="3" fill="#059669"/>')
    lines.append(f'      <text x="46" y="98" font-family="{FONT_MONO}" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">#chunk-04</text>')
    lines.append(f'      <text x="92" y="99" font-family="{FONT_SANS}" font-size="14" font-weight="800" fill="#047857">Điều 4.2 Lập BBBT trong 24h</text>')
    lines.append('    </g>')
    # Title & Badges
    lines.append(f'    <text x="145" y="158" font-family="{FONT_SANS}" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">3. Chunks Bưu chính Chuẩn</text>')
    lines.append('    <rect x="10" y="172" width="270" height="36" rx="18" fill="#F0FDF4"/>')
    lines.append(f'    <text x="145" y="196" font-family="{FONT_MONO}" font-size="14.5" font-weight="700" fill="#047857" text-anchor="middle">35 Chunks Bưu chính (~142 KB)</text>')
    lines.append(f'    <text x="145" y="232" font-family="{FONT_SANS}" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">Gắn tiền tố Breadcrumb • Giữ nguyên biểu mẫu</text>')
    lines.append('  </g>')

    # Arrow 3 -> 4 (Extra-Bold Presentation Connector)
    lines.append('  <line x1="1045" y1="248" x2="1085" y2="248" stroke="#0F172A" stroke-width="5.5" stroke-linecap="round"/>')
    lines.append(f'  {draw_arrow(1105, 248, "right", "#0F172A", 24)}')

    # --- NODE 4: Embedding Model ---
    lines.append('  <!-- Node 4: Embedding Model -->')
    lines.append('  <g id="node-embedder" transform="translate(1115, 174)">')
    # Graphic: Neural MRL Ribbon
    lines.append('    <g transform="translate(10, 10)">')
    # MRL Pill
    lines.append('      <rect x="0" y="0" width="280" height="32" rx="6" fill="#F5F3FF" stroke="#8B5CF6" stroke-width="1.6"/>')
    lines.append(f'      <text x="140" y="21" font-family="{FONT_MONO}" font-size="13" font-weight="800" fill="#6D28D9" text-anchor="middle">MRL 1536-D ➔ 512-D (Tiết kiệm 67% RAM)</text>')
    # Vector Tensor Gradient Bar
    lines.append('      <rect x="0" y="38" width="280" height="40" rx="6" fill="url(#tensorGrad)" filter="url(#softGlow)"/>')
    lines.append(f'      <text x="140" y="64" font-family="{FONT_MONO}" font-size="15" font-weight="900" fill="#FFFFFF" text-anchor="middle">[ +0.0241, -0.0512, ..., +0.0894 ]</text>')
    # L2-Norm
    lines.append('      <rect x="0" y="84" width="280" height="26" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.4"/>')
    lines.append(f'      <text x="140" y="102" font-family="{FONT_MONO}" font-size="13" font-weight="800" fill="#0F172A" text-anchor="middle">||v||₂ = 1.0  ➔  Cosine Sim = Dot Product</text>')
    lines.append('    </g>')
    # Title & Badges
    lines.append(f'    <text x="150" y="158" font-family="{FONT_SANS}" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">4. Mô hình Nhúng Vector</text>')
    lines.append('    <rect x="10" y="172" width="280" height="36" rx="18" fill="#F5F3FF"/>')
    lines.append(f'    <text x="150" y="196" font-family="{FONT_MONO}" font-size="14.5" font-weight="700" fill="#6D28D9" text-anchor="middle">text-embedding-3-small (MRL 512-D)</text>')
    lines.append(f'    <text x="150" y="232" font-family="{FONT_SANS}" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">Tích vô hướng SIMD siêu tốc quét &lt; 0.8ms</text>')
    lines.append('  </g>')

    # Arrow 4 -> 5 (Extra-Bold Presentation Connector)
    lines.append('  <line x1="1405" y1="248" x2="1445" y2="248" stroke="#0F172A" stroke-width="5.5" stroke-linecap="round"/>')
    lines.append(f'  {draw_arrow(1465, 248, "right", "#0F172A", 24)}')

    # --- NODE 5: In-Memory Vector Store ---
    lines.append('  <!-- Node 5: In-Memory Vector Store -->')
    lines.append('  <g id="node-store" transform="translate(1475, 174)">')
    # Graphic: 3D Isometric Cylinder Database
    lines.append('    <g transform="translate(35, 10)">')
    # Body
    lines.append('      <path d="M 30 38 L 30 92 A 85 20 0 0 0 200 92 L 200 38 Z" fill="url(#dbGrad)" stroke="#0284C7" stroke-width="2"/>')
    lines.append('      <path d="M 30 56 A 85 18 0 0 0 200 56" fill="none" stroke="#0284C7" stroke-width="1.4" stroke-dasharray="4,3"/>')
    lines.append('      <path d="M 30 74 A 85 18 0 0 0 200 74" fill="none" stroke="#0284C7" stroke-width="1.4" stroke-dasharray="4,3"/>')
    # Top Cap
    lines.append('      <ellipse cx="115" cy="38" rx="85" ry="20" fill="#E0F2FE" stroke="#0284C7" stroke-width="2"/>')
    # File Tag (Optimized width & text)
    lines.append('      <rect x="50" y="25" width="130" height="24" rx="4" fill="#0F172A"/>')
    lines.append(f'      <text x="115" y="42" font-family="{FONT_MONO}" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">vector-index.json</text>')
    # Badges below
    lines.append('      <rect x="30" y="100" width="82" height="24" rx="4" fill="#0284C7"/>')
    lines.append(f'      <text x="71" y="117" font-family="{FONT_MONO}" font-size="12.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">RAM: 142KB</text>')
    lines.append('      <rect x="118" y="100" width="82" height="24" rx="4" fill="#059669"/>')
    lines.append(f'      <text x="159" y="117" font-family="{FONT_MONO}" font-size="12.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">COST: 0 VNĐ</text>')
    lines.append('    </g>')
    # Title & Badges
    lines.append(f'    <text x="150" y="158" font-family="{FONT_SANS}" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">5. Kho Vector Bộ nhớ đệm</text>')
    lines.append('    <rect x="15" y="172" width="270" height="36" rx="18" fill="#E0F2FE"/>')
    lines.append(f'    <text x="150" y="196" font-family="{FONT_MONO}" font-size="14.5" font-weight="700" fill="#0284C7" text-anchor="middle">In-Memory Heap (Node.js RAM)</text>')
    lines.append(f'    <text x="150" y="232" font-family="{FONT_SANS}" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">Không độ trễ mạng • Chuẩn bị sẵn pgvector</text>')
    lines.append('  </g>')

    # =========================================================================
    # HIGHWAY BUS: FROM VECTOR STORE DOWN TO HYBRID RETRIEVER
    # =========================================================================
    lines.append('  <!-- Connection Highway: Vector Store down to Hybrid Retriever -->')
    lines.append('  <path d="M 1625 418 L 1625 460 L 685 460 L 685 525" fill="none" stroke="#0284C7" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>')
    lines.append(f'  {draw_arrow(685, 540, "down", "#0284C7", 28)}')
    
    # Central Bus Pill
    lines.append('  <g transform="translate(870, 436)">')
    lines.append('    <rect x="0" y="0" width="520" height="48" rx="24" fill="#0284C7" filter="url(#softGlow)"/>')
    lines.append(f'    <text x="260" y="31" font-family="{FONT_MONO}" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">⚡ ĐỒNG BỘ CHỈ MỤC (IN-MEMORY RETRIEVAL BUS)</text>')
    lines.append('  </g>')

    # =========================================================================
    # SECTION 2 LABEL: RUNTIME QUERY & HYBRID RETRIEVAL PIPELINE
    # Title shortened slightly so it clears the blue highway bus at x=685 cleanly!
    # =========================================================================
    lines.append('  <!-- Section 2 Header (Borderless) -->')
    lines.append('  <g transform="translate(50, 508)">')
    lines.append('    <circle cx="14" cy="14" r="8" fill="#059669"/>')
    lines.append(f'    <text x="34" y="22" font-family="{FONT_SANS}" font-size="20" font-weight="900" fill="#0F172A">TIẾN TRÌNH THỜI GIAN THỰC: TRUY VẤN &amp; TRUY HỒI LAI</text>')
    lines.append(f'    <text x="1820" y="22" font-family="{FONT_MONO}" font-size="14.5" font-weight="700" fill="#059669" text-anchor="end">Intent Detection • Logistics Thesaurus • Hybrid Search (Cosine + BM25) • Rich Actions</text>')
    lines.append('  </g>')

    # -------------------------------------------------------------------------
    # STAGE 2: 4 NODES (Y center ~ 685)
    # Centers:
    # Node 6: X = 230
    # Node 7: X = 680
    # Node 8: X = 1145
    # Node 9: X = 1630
    # -------------------------------------------------------------------------

    # --- NODE 6: User Query & Thesaurus ---
    lines.append('  <!-- Node 6: User Query -->')
    lines.append('  <g id="node-query" transform="translate(60, 545)">')
    # Graphic: Modern Chat Bubble & Chips
    lines.append('    <g transform="translate(10, 10)">')
    # Bubble
    lines.append('      <rect x="0" y="0" width="340" height="70" rx="8" fill="#0284C7" filter="url(#softGlow)"/>')
    lines.append(f'      <text x="16" y="28" font-family="{FONT_SANS}" font-size="15.5" font-weight="700" fill="#FFFFFF">"Đơn hàng NEX-88291 bị bể vỡ do bưu tá</text>')
    lines.append(f'      <text x="16" y="52" font-family="{FONT_SANS}" font-size="15.5" font-weight="700" fill="#FFFFFF">làm rơi thì quy chế bồi thường thế nào?"</text>')
    lines.append('      <polygon points="25,70 45,70 20,82" fill="#0284C7"/>')
    # Entity Chips
    lines.append('      <rect x="0" y="86" width="160" height="32" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.6"/>')
    lines.append(f'      <text x="80" y="107" font-family="{FONT_MONO}" font-size="14" font-weight="800" fill="#1D4ED8" text-anchor="middle">AWB: NEX-88291</text>')
    
    lines.append('      <rect x="170" y="86" width="170" height="32" rx="6" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.6"/>')
    lines.append(f'      <text x="255" y="107" font-family="{FONT_MONO}" font-size="13.5" font-weight="800" fill="#B45309" text-anchor="middle">Intent: CLAIM_DAMAGE</text>')
    
    # Thesaurus chip
    lines.append('      <rect x="0" y="126" width="340" height="30" rx="6" fill="#FFFBEB" stroke="#F59E0B" stroke-width="1.4"/>')
    lines.append(f'      <text x="170" y="146" font-family="{FONT_MONO}" font-size="13" font-weight="700" fill="#92400E" text-anchor="middle">Từ điển: "vỡ" ➔ ["hư hỏng", "bể vỡ", "BBBT"]</text>')
    lines.append('    </g>')
    # Title & Badges
    lines.append(f'    <text x="180" y="190" font-family="{FONT_SANS}" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">6. Truy vấn &amp; Bóc tách Thực thể</text>')
    lines.append('    <rect x="30" y="204" width="300" height="36" rx="18" fill="#EFF6FF"/>')
    lines.append(f'    <text x="180" y="228" font-family="{FONT_MONO}" font-size="14.5" font-weight="700" fill="#1D4ED8" text-anchor="middle">Merchant Web (:5173) • HTTP/2 SSE</text>')
    lines.append(f'    <text x="180" y="264" font-family="{FONT_SANS}" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">Bóc tách Regex mã vận đơn &amp; Mở rộng BM25</text>')
    lines.append('  </g>')

    # Arrow 6 -> 7 (Extra-Bold Presentation Connector)
    lines.append('  <line x1="420" y1="642" x2="485" y2="642" stroke="#0F172A" stroke-width="5.5" stroke-linecap="round"/>')
    lines.append(f'  {draw_arrow(505, 642, "right", "#0F172A", 24)}')

    # --- NODE 7: Hybrid Retriever ---
    lines.append('  <!-- Node 7: Hybrid Retriever -->')
    lines.append('  <g id="node-retriever" transform="translate(515, 545)">')
    # Graphic: Dual Funnel Stream
    lines.append('    <g transform="translate(10, 10)">')
    # Dense Stream
    lines.append('      <rect x="0" y="0" width="330" height="40" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.8"/>')
    lines.append('      <rect x="8" y="8" width="86" height="24" rx="4" fill="#2563EB"/>')
    lines.append(f'      <text x="51" y="25" font-family="{FONT_MONO}" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">DENSE 70%</text>')
    lines.append(f'      <text x="102" y="26" font-family="{FONT_SANS}" font-size="14.5" font-weight="700" fill="#1E40AF">Sim_Cosine(q, d) = q · d</text>')
    
    # Sparse Stream
    lines.append('      <rect x="0" y="48" width="330" height="40" rx="6" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.8"/>')
    lines.append('      <rect x="8" y="56" width="86" height="24" rx="4" fill="#D97706"/>')
    lines.append(f'      <text x="51" y="73" font-family="{FONT_MONO}" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">SPARSE 30%</text>')
    lines.append(f'      <text x="102" y="74" font-family="{FONT_SANS}" font-size="14" font-weight="700" fill="#92400E">BM25: "BBBT", "SLA 24h", "bể vỡ"</text>')
    
    # Fusion Formula Box
    lines.append('      <rect x="0" y="96" width="330" height="58" rx="6" fill="#F0FDF4" stroke="#10B981" stroke-width="2" filter="url(#softGlow)"/>')
    lines.append(f'      <text x="165" y="120" font-family="{FONT_MONO}" font-size="15" font-weight="900" fill="#065F46" text-anchor="middle">FinalScore = 0.70·Sim + 0.30·BM25</text>')
    lines.append(f'      <text x="165" y="142" font-family="{FONT_MONO}" font-size="13.5" font-weight="700" fill="#047857" text-anchor="middle">Ngưỡng Lọc: Score ≥ 0.52 (Triệt tiêu nhiễu)</text>')
    lines.append('    </g>')
    # Title & Badges
    lines.append(f'    <text x="175" y="190" font-family="{FONT_SANS}" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">7. Bộ truy hồi Lai (Hybrid Fusion)</text>')
    lines.append('    <rect x="25" y="204" width="300" height="36" rx="18" fill="#F0FDF4"/>')
    lines.append(f'    <text x="175" y="228" font-family="{FONT_MONO}" font-size="14.5" font-weight="700" fill="#047857" text-anchor="middle">Cosine + BM25 (Trọng số 70/30)</text>')
    lines.append(f'    <text x="175" y="264" font-family="{FONT_SANS}" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">Bắt trúng thuật ngữ bưu chính &amp; Lọc bỏ chunk rác</text>')
    lines.append('  </g>')

    # Arrow 7 -> 8 (Extra-Bold Presentation Connector)
    lines.append('  <line x1="875" y1="642" x2="945" y2="642" stroke="#0F172A" stroke-width="5.5" stroke-linecap="round"/>')
    lines.append(f'  {draw_arrow(965, 642, "right", "#0F172A", 24)}')

    # --- NODE 8: Top Grounded Chunk ---
    lines.append('  <!-- Node 8: Top Grounded Chunk -->')
    lines.append('  <g id="node-grounded" transform="translate(980, 545)">')
    # Graphic: Verified Legal Excerpt Card
    lines.append('    <g transform="translate(10, 10)">')
    # Outer Card with Green Accent
    lines.append('      <rect x="0" y="0" width="345" height="152" rx="8" fill="#F0FDF4" stroke="#10B981" stroke-width="2" filter="url(#softGlow)"/>')
    # Card Header
    lines.append('      <rect x="0" y="0" width="345" height="32" rx="6" fill="#059669"/>')
    lines.append(f'      <text x="14" y="22" font-family="{FONT_SANS}" font-size="14" font-weight="900" fill="#FFFFFF">Điều 4.2: Bồi thường hàng bể vỡ</text>')
    lines.append('      <rect x="250" y="5" width="85" height="22" rx="4" fill="#047857"/>')
    lines.append(f'      <text x="292" y="20" font-family="{FONT_MONO}" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">SCORE 0.91</text>')
    # Excerpt Content (Concise & safely within bounds)
    lines.append(f'      <text x="14" y="52" font-family="{FONT_SANS}" font-size="13.5" font-style="italic" fill="#14532D">"Hàng bể vỡ: Bưu cục phát phải lập Biên bản</text>')
    lines.append(f'      <text x="14" y="72" font-family="{FONT_SANS}" font-size="13.5" font-style="italic" font-weight="800" fill="#DC2626">bất thường (BBBT) trong vòng 24 giờ."</text>')
    lines.append(f'      <text x="14" y="96" font-family="{FONT_MONO}" font-size="13" font-weight="800" fill="#047857">• Đền bù 100% khai giá (đơn bảo hiểm)</text>')
    lines.append(f'      <text x="14" y="117" font-family="{FONT_MONO}" font-size="13" font-weight="800" fill="#047857">• Duyệt tự động: Tối đa 2.000.000 VNĐ</text>')
    lines.append(f'      <text x="14" y="139" font-family="{FONT_MONO}" font-size="12" fill="#64748B">[Nguồn: 02-insurance-policy.md#chunk-4]</text>')
    lines.append('    </g>')
    # Title & Badges
    lines.append(f'    <text x="180" y="190" font-family="{FONT_SANS}" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">8. Căn cứ Pháp lý (Grounding Truth)</text>')
    lines.append('    <rect x="30" y="204" width="300" height="36" rx="18" fill="#F0FDF4"/>')
    lines.append(f'    <text x="180" y="228" font-family="{FONT_MONO}" font-size="14.5" font-weight="700" fill="#047857" text-anchor="middle">Top-1 Score: 0.91 (Căn cứ Điều 4.2)</text>')
    lines.append(f'    <text x="180" y="264" font-family="{FONT_SANS}" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">Ràng buộc SLA 24h • Triệt tiêu 100% ảo giác</text>')
    lines.append('  </g>')

    # Arrow 8 -> 9 (Extra-Bold Presentation Connector)
    lines.append('  <line x1="1350" y1="642" x2="1420" y2="642" stroke="#0F172A" stroke-width="5.5" stroke-linecap="round"/>')
    lines.append(f'  {draw_arrow(1440, 642, "right", "#0F172A", 24)}')

    # --- NODE 9: Grounded Response & Action Cards ---
    lines.append('  <!-- Node 9: Response & Actions -->')
    lines.append('  <g id="node-response" transform="translate(1450, 545)">')
    # Graphic: AI Answer Box with Action Buttons
    lines.append('    <g transform="translate(10, 10)">')
    # Bubble
    lines.append('      <rect x="0" y="0" width="390" height="96" rx="8" fill="#F0F9FF" stroke="#7DD3FC" stroke-width="1.8" filter="url(#softGlow)"/>')
    lines.append(f'      <text x="16" y="25" font-family="{FONT_SANS}" font-size="15" font-weight="800" fill="#0369A1">🤖 Trợ lý Nexus AI phản hồi:</text>')
    lines.append(f'      <text x="16" y="47" font-family="{FONT_SANS}" font-size="14" fill="#0F172A">"Theo <tspan font-weight="bold" fill="#0284C7">Điều 4.2</tspan>, đơn <tspan font-weight="bold">NEX-88291</tspan> bị vỡ được xử lý:</text>')
    lines.append(f'      <text x="16" y="67" font-family="{FONT_SANS}" font-size="14" font-weight="700" fill="#059669">• Đền bù 100% khai giá (đơn có bảo hiểm).</text>')
    lines.append(f'      <text x="16" y="87" font-family="{FONT_SANS}" font-size="14" font-weight="700" fill="#DC2626">• Bắt buộc: Đã có Biên bản (BBBT) lập trong 24h."</text>')
    # Action Buttons
    lines.append('      <g transform="translate(0, 106)">')
    lines.append('        <rect x="0" y="0" width="190" height="46" rx="6" fill="#059669" filter="url(#softGlow)"/>')
    lines.append(f'        <text x="95" y="29" font-family="{FONT_MONO}" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">📝 TẠO BỒI THƯỜNG</text>')
    lines.append('        <rect x="200" y="0" width="190" height="46" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>')
    lines.append(f'        <text x="295" y="29" font-family="{FONT_MONO}" font-size="14" font-weight="800" fill="#0F172A" text-anchor="middle">🔍 TRA CỨU BBBT</text>')
    lines.append('      </g>')
    lines.append('    </g>')
    # Title & Badges
    lines.append(f'    <text x="205" y="190" font-family="{FONT_SANS}" font-size="22" font-weight="800" fill="#0F172A" text-anchor="middle">9. Phản hồi LLM &amp; Thẻ Hành động</text>')
    lines.append('    <rect x="45" y="204" width="320" height="36" rx="18" fill="#F0FDF4"/>')
    lines.append(f'    <text x="205" y="228" font-family="{FONT_MONO}" font-size="14.5" font-weight="700" fill="#047857" text-anchor="middle">Faithfulness 99.8% • Relevance 97.6%</text>')
    lines.append(f'    <text x="205" y="264" font-family="{FONT_SANS}" font-size="16" font-weight="600" fill="#334155" text-anchor="middle">Gemini 1.5 Flash / Groq • Rich Action Dispatcher</text>')
    lines.append('  </g>')

    # =========================================================================
    # FOOTER BAR (Height: 82)
    # =========================================================================
    lines.append('  <!-- Footer Bar -->')
    lines.append('  <rect x="40" y="964" width="1840" height="82" rx="8" fill="#0F172A"/>')
    lines.append(f'  <text x="70" y="996" font-family="{FONT_SANS}" font-size="15" font-weight="800" fill="#38BDF8">CÔNG THỨC TOÁN HỌC CỐT LÕI (CORE RAG FORMULAS):</text>')
    lines.append(f'  <text x="70" y="1025" font-family="{FONT_MONO}" font-size="13.5" fill="#E2E8F0">Sim(q, d) = q · d (khi ||q||₂ = ||d||₂ = 1.0)   |   FinalScore = 0.70·Sim_Cosine + 0.30·Score_BM25 (Ngưỡng Tau ≥ 0.52)</text>')

    # Legend on right (Starts at x=1260 to give full room to formulas)
    lines.append('  <g transform="translate(1260, 990)">')
    lines.append('    <line x1="0" y1="18" x2="35" y2="18" stroke="#CBD5E1" stroke-width="4.5"/>')
    lines.append(f'    {draw_arrow(35, 18, "right", "#CBD5E1", 16)}')
    lines.append(f'    <text x="45" y="24" font-family="{FONT_SANS}" font-size="14.5" font-weight="700" fill="#CBD5E1">Ngoại tuyến</text>')

    lines.append('    <line x1="160" y1="18" x2="195" y2="18" stroke="#0284C7" stroke-width="5.0"/>')
    lines.append(f'    {draw_arrow(195, 18, "right", "#0284C7", 16)}')
    lines.append(f'    <text x="205" y="24" font-family="{FONT_SANS}" font-size="14.5" font-weight="700" fill="#38BDF8">Đồng bộ &amp; Truy vấn</text>')

    lines.append('    <line x1="380" y1="18" x2="415" y2="18" stroke="#10B981" stroke-width="4.5"/>')
    lines.append(f'    {draw_arrow(415, 18, "right", "#10B981", 16)}')
    lines.append(f'    <text x="425" y="24" font-family="{FONT_SANS}" font-size="14.5" font-weight="700" fill="#34D399">Phản hồi &amp; Hành động</text>')
    lines.append('  </g>')

    lines.append('</svg>')
    
    svg_content = '\n'.join(lines)
    return svg_content

if __name__ == '__main__':
    content = build_svg()
    
    # Strict XML Validation
    ET.fromstring(content)
    print("✓ Strict XML validation PASSED!")
    
    if '<marker' in content:
        raise ValueError("Error: <marker> tag found!")
    print("✓ Marker check PASSED (0 <marker> tags).")
    
    # Save as the official Page 2 Section 2.3 RAG master diagram
    p = "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/03-rag-core-components-pipeline.svg"
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✓ Saved official master diagram to {p}")
