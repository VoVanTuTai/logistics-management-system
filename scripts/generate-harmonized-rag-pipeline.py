#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE HARMONIZED RAG ARCHITECTURE SVG (THEORY + NEXUS SYSTEM MASTERPIECE)
===========================================================================
Phối hợp giữa:
1. Sơ đồ lý thuyết chuẩn (Hình 3: 3 Giai đoạn Indexing, Retrieval, Generation)
2. Hệ thống thực tế Nexus Logistics (Chia 6000, Điều 4.2 BBBT 24h, Milvus, MRL 512-D, Action Cards)
3. Phong cách Blueprint Kỹ thuật số Cao cấp (Figma Page 2, 100% Native Vector, No Markers).

Output file:
  docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/03-rag-core-components-pipeline.svg
"""

import os
import html
import xml.etree.ElementTree as ET

def xml_esc(s):
    if s is None:
        return ""
    return html.escape(str(s), quote=True)

def generate_svg():
    width = 1920
    height = 1080

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">')
    
    # STYLES & DEFINITIONS
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700;800;900&display=swap");')
    lines.append('      text { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }')
    lines.append('      .mono { font-family: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace; }')
    lines.append('    ]]></style>')

    # GRADIENTS & FILTERS
    lines.append('    <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="0">')
    lines.append('      <stop offset="0%" stop-color="#0F172A"/>')
    lines.append('      <stop offset="100%" stop-color="#1E293B"/>')
    lines.append('    </linearGradient>')

    lines.append('    <linearGradient id="indexingGrad" x1="0" y1="0" x2="0" y2="1">')
    lines.append('      <stop offset="0%" stop-color="#F8FAFC"/>')
    lines.append('      <stop offset="100%" stop-color="#F1F5F9"/>')
    lines.append('    </linearGradient>')

    lines.append('    <linearGradient id="retrievalGrad" x1="0" y1="0" x2="0" y2="1">')
    lines.append('      <stop offset="0%" stop-color="#F0FDF4"/>')
    lines.append('      <stop offset="100%" stop-color="#DCFCE7"/>')
    lines.append('    </linearGradient>')

    lines.append('    <linearGradient id="generationGrad" x1="0" y1="0" x2="0" y2="1">')
    lines.append('      <stop offset="0%" stop-color="#F5F3FF"/>')
    lines.append('      <stop offset="100%" stop-color="#EDE9FE"/>')
    lines.append('    </linearGradient>')

    lines.append('    <linearGradient id="tensorGrad" x1="0" y1="0" x2="1" y2="0">')
    lines.append('      <stop offset="0%" stop-color="#2563EB"/>')
    lines.append('      <stop offset="50%" stop-color="#7C3AED"/>')
    lines.append('      <stop offset="100%" stop-color="#DB2777"/>')
    lines.append('    </linearGradient>')

    lines.append('    <linearGradient id="dbGrad" x1="0" y1="0" x2="0" y2="1">')
    lines.append('      <stop offset="0%" stop-color="#38BDF8"/>')
    lines.append('      <stop offset="100%" stop-color="#0284C7"/>')
    lines.append('    </linearGradient>')

    lines.append('    <filter id="softShadow" x="-8%" y="-8%" width="116%" height="116%">')
    lines.append('      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.06"/>')
    lines.append('    </filter>')
    lines.append('    <filter id="accentGlow" x="-15%" y="-15%" width="130%" height="130%">')
    lines.append('      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#2563EB" flood-opacity="0.14"/>')
    lines.append('    </filter>')
    lines.append('  </defs>')

    # Background
    lines.append('  <rect width="1920" height="1080" fill="#FFFFFF"/>')

    # Subtle Blueprint Grid dots
    lines.append('  <pattern id="blueprintGrid" width="40" height="40" patternUnits="userSpaceOnUse">')
    lines.append('    <circle cx="20" cy="20" r="1.2" fill="#E2E8F0"/>')
    lines.append('  </pattern>')
    lines.append('  <rect width="1920" height="1080" fill="url(#blueprintGrid)"/>')

    # TOP HEADER BAR
    lines.append('  <g id="Top_Header_Bar">')
    lines.append('    <rect x="40" y="24" width="1840" height="88" rx="10" fill="url(#headerGrad)"/>')
    lines.append('    <text x="70" y="60" font-size="24" font-weight="900" fill="#FFFFFF" letter-spacing="-0.3px">HÌNH 2.3: KIẾN TRÚC MÔ HÌNH RAG TIÊU CHUẨN TRONG HỆ THỐNG NEXUS LOGISTICS</text>')
    lines.append('    <text x="70" y="91" font-size="15" font-weight="500" fill="#94A3B8">Quy trình 3 Giai đoạn Chuẩn: Đánh chỉ mục (Indexing) • Truy xuất (Retrieval) • Sinh phản hồi (Generation) • Tích hợp Tri thức Bưu chính</text>')
    
    # Metadata Badge
    lines.append('    <rect x="1490" y="38" width="370" height="60" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1.6"/>')
    lines.append('    <text x="1675" y="63" class="mono" font-size="13.5" font-weight="800" fill="#38BDF8" text-anchor="middle">RAG-ARCHITECTURE-PIPELINE</text>')
    lines.append('    <text x="1675" y="83" class="mono" font-size="11.5" font-weight="700" fill="#CBD5E1" text-anchor="middle">THEORY + LOGISTICS KNOWLEDGE FUSION</text>')
    lines.append('  </g>')

    # =========================================================================
    # PHASE 1: INDEXING PHASE (TOP ZONE)
    # =========================================================================
    lines.append('  <!-- ==================== PHASE 1: INDEXING (OFFLINE) ==================== -->')
    lines.append('  <g id="Zone_1_Indexing">')
    lines.append('    <rect x="40" y="130" width="1840" height="370" rx="12" fill="url(#indexingGrad)" stroke="#CBD5E1" stroke-width="1.8" filter="url(#softShadow)"/>')
    
    # Phase Tag
    lines.append('    <rect x="60" y="148" width="410" height="34" rx="6" fill="#0F172A"/>')
    lines.append('    <text x="75" y="171" class="mono" font-size="13" font-weight="800" fill="#38BDF8">GIAI ĐOẠN 1: INDEXING (ĐÁNH CHỈ MỤC NGOẠI TUYẾN)</text>')
    lines.append('    <text x="490" y="171" font-size="14" font-weight="600" fill="#475569">Bóc tách AST Markdown • Sliding Window 16% • Nhúng vector MRL 512-D • Nạp cơ sở dữ liệu Milvus</text>')

    # 1.1 Documents
    lines.append('    <!-- 1.1 Documents -->')
    lines.append('    <g id="P1_Documents" transform="translate(70, 205)">')
    lines.append('      <rect x="0" y="0" width="220" height="260" rx="10" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" filter="url(#softShadow)"/>')
    lines.append('      <rect x="0" y="0" width="220" height="42" rx="10" fill="#F1F5F9" stroke="#0F172A" stroke-width="2"/>')
    lines.append('      <text x="110" y="27" font-size="15" font-weight="800" fill="#0F172A" text-anchor="middle">📁 Tài Liệu Bưu Chính</text>')
    
    # Doc items
    docs = [
        ("01-pricing.md", "Bảng cước &amp; Quy đổi 6000", "#2563EB", "#EFF6FF"),
        ("02-claim-policy.md", "Điều 4.2 BBBT trong 24h", "#059669", "#F0FDF4"),
        ("03-prohibited.md", "Hàng cấm bay &amp; Miễn trừ", "#DC2626", "#FEF2F2"),
    ]
    for idx, (fname, fdesc, color, bg) in enumerate(docs):
        dy = 54 + idx * 64
        lines.append(f'      <g transform="translate(12, {dy})">')
        lines.append(f'        <rect x="0" y="0" width="196" height="54" rx="6" fill="{bg}" stroke="{color}" stroke-width="1.4"/>')
        lines.append(f'        <text x="12" y="22" class="mono" font-size="12.5" font-weight="800" fill="{color}">{fname}</text>')
        lines.append(f'        <text x="12" y="42" font-size="11.5" font-weight="600" fill="#475569">{fdesc}</text>')
        lines.append('      </g>')
    lines.append('    </g>')

    # Arrow 1.1 -> 1.2
    lines.append('    <!-- Arrow 1.1 -> 1.2 -->')
    lines.append('    <line x1="290" y1="335" x2="335" y2="335" stroke="#0F172A" stroke-width="4" stroke-linecap="round"/>')
    lines.append('    <polygon points="350,335 330,325 330,345" fill="#0F172A"/>')

    # 1.2 Chunks
    lines.append('    <!-- 1.2 Chunks -->')
    lines.append('    <g id="P1_Chunks" transform="translate(360, 205)">')
    lines.append('      <rect x="0" y="0" width="260" height="260" rx="10" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" filter="url(#softShadow)"/>')
    lines.append('      <rect x="0" y="0" width="260" height="42" rx="10" fill="#F8FAFC" stroke="#0F172A" stroke-width="2"/>')
    lines.append('      <text x="130" y="27" font-size="15" font-weight="800" fill="#0F172A" text-anchor="middle">📄 Chunks (Phân Mảnh)</text>')
    
    # Chunk cards
    lines.append('      <g transform="translate(12, 52)">')
    lines.append('        <rect x="0" y="0" width="236" height="60" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.4"/>')
    lines.append('        <rect x="8" y="8" width="70" height="20" rx="3" fill="#2563EB"/>')
    lines.append('        <text x="43" y="22" class="mono" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">#chunk-01</text>')
    lines.append('        <text x="86" y="23" class="mono" font-size="11.5" font-weight="700" fill="#1E40AF">01-pricing.md</text>')
    lines.append('        <text x="10" y="47" font-size="12" font-weight="700" fill="#0F172A">Quy đổi thể tích = (DxRxC)/6000</text>')
    lines.append('      </g>')

    lines.append('      <g transform="translate(12, 120)">')
    lines.append('        <rect x="0" y="0" width="236" height="60" rx="6" fill="#F0FDF4" stroke="#10B981" stroke-width="1.8"/>')
    lines.append('        <rect x="8" y="8" width="70" height="20" rx="3" fill="#059669"/>')
    lines.append('        <text x="43" y="22" class="mono" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">#chunk-04</text>')
    lines.append('        <text x="86" y="23" class="mono" font-size="11.5" font-weight="700" fill="#065F46">02-claim.md</text>')
    lines.append('        <text x="10" y="47" font-size="12" font-weight="800" fill="#047857">Điều 4.2 Lập BBBT trong 24h</text>')
    lines.append('      </g>')

    lines.append('      <g transform="translate(12, 188)">')
    lines.append('        <rect x="0" y="0" width="236" height="58" rx="6" fill="#FFFBEB" stroke="#F59E0B" stroke-width="1.2"/>')
    lines.append('        <text x="118" y="26" class="mono" font-size="12" font-weight="700" fill="#B45309" text-anchor="middle">Sliding Window (250w / 40w)</text>')
    lines.append('        <text x="118" y="46" font-size="11.5" font-weight="500" fill="#78350F" text-anchor="middle">Giữ nguyên ngữ cảnh điều khoản</text>')
    lines.append('      </g>')
    lines.append('    </g>')

    # Arrow 1.2 -> 1.3
    lines.append('    <!-- Arrow 1.2 -> 1.3 -->')
    lines.append('    <line x1="620" y1="335" x2="685" y2="335" stroke="#0F172A" stroke-width="4" stroke-linecap="round"/>')
    lines.append('    <polygon points="700,335 680,325 680,345" fill="#0F172A"/>')

    # 1.3 Embedding Model (Central Neural Network)
    lines.append('    <!-- 1.3 Embedding Model -->')
    lines.append('    <g id="P1_Embedding_Model" transform="translate(710, 205)">')
    lines.append('      <rect x="0" y="0" width="270" height="260" rx="10" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" filter="url(#softShadow)"/>')
    lines.append('      <rect x="0" y="0" width="270" height="42" rx="10" fill="#F5F3FF" stroke="#0F172A" stroke-width="2"/>')
    lines.append('      <text x="135" y="27" font-size="15" font-weight="800" fill="#6D28D9" text-anchor="middle">🧠 Embedding Model</text>')
    
    # Neural net diagram
    lines.append('      <g transform="translate(35, 55)">')
    # Layer 1
    lines.append('        <circle cx="20" cy="20" r="10" fill="#2563EB"/>')
    lines.append('        <circle cx="20" cy="55" r="10" fill="#2563EB"/>')
    lines.append('        <circle cx="20" cy="90" r="10" fill="#2563EB"/>')
    # Layer 2
    lines.append('        <circle cx="100" cy="10" r="9" fill="#7C3AED"/>')
    lines.append('        <circle cx="100" cy="40" r="9" fill="#7C3AED"/>')
    lines.append('        <circle cx="100" cy="70" r="9" fill="#7C3AED"/>')
    lines.append('        <circle cx="100" cy="100" r="9" fill="#7C3AED"/>')
    # Layer 3
    lines.append('        <circle cx="180" cy="35" r="10" fill="#DB2777"/>')
    lines.append('        <circle cx="180" cy="75" r="10" fill="#DB2777"/>')
    # Connectors
    for y1 in [20, 55, 90]:
        for y2 in [10, 40, 70, 100]:
            lines.append(f'        <line x1="20" y1="{y1}" x2="100" y2="{y2}" stroke="#CBD5E1" stroke-width="1.2"/>')
    for y2 in [10, 40, 70, 100]:
        for y3 in [35, 75]:
            lines.append(f'        <line x1="100" y1="{y2}" x2="180" y2="{y3}" stroke="#CBD5E1" stroke-width="1.2"/>')
    lines.append('      </g>')
    
    lines.append('      <rect x="15" y="180" width="240" height="34" rx="6" fill="#F5F3FF" stroke="#8B5CF6" stroke-width="1.4"/>')
    lines.append('      <text x="135" y="202" class="mono" font-size="12.5" font-weight="800" fill="#6D28D9" text-anchor="middle">text-embedding-3-small</text>')
    lines.append('      <text x="135" y="235" font-size="12" font-weight="600" fill="#64748B" text-anchor="middle">MRL 1536-D ➔ 512-D (Tiết kiệm 67% RAM)</text>')
    lines.append('    </g>')

    # Arrow 1.3 -> 1.4
    lines.append('    <!-- Arrow 1.3 -> 1.4 -->')
    lines.append('    <line x1="980" y1="335" x2="1045" y2="335" stroke="#0F172A" stroke-width="4" stroke-linecap="round"/>')
    lines.append('    <polygon points="1060,335 1040,325 1040,345" fill="#0F172A"/>')

    # 1.4 Document Vectors
    lines.append('    <!-- 1.4 Document Vectors -->')
    lines.append('    <g id="P1_Doc_Vectors" transform="translate(1070, 205)">')
    lines.append('      <rect x="0" y="0" width="250" height="260" rx="10" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" filter="url(#softShadow)"/>')
    lines.append('      <rect x="0" y="0" width="250" height="42" rx="10" fill="#F8FAFC" stroke="#0F172A" stroke-width="2"/>')
    lines.append('      <text x="125" y="27" font-size="15" font-weight="800" fill="#0F172A" text-anchor="middle">📊 Document Embeddings</text>')
    
    # Vector box
    lines.append('      <g transform="translate(15, 60)">')
    lines.append('        <text x="10" y="24" class="mono" font-size="13" font-weight="800" fill="#2563EB">v_chunk01 =</text>')
    lines.append('        <rect x="0" y="34" width="220" height="38" rx="6" fill="url(#tensorGrad)"/>')
    lines.append('        <text x="110" y="58" class="mono" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">[ +0.024, -0.051, ..., +0.089 ]</text>')
    
    lines.append('        <text x="10" y="104" class="mono" font-size="13" font-weight="800" fill="#059669">v_chunk04 =</text>')
    lines.append('        <rect x="0" y="114" width="220" height="38" rx="6" fill="#059669"/>')
    lines.append('        <text x="110" y="138" class="mono" font-size="13.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">[ +0.091, +0.043, ..., -0.018 ]</text>')
    lines.append('      </g>')
    lines.append('      <text x="125" y="240" class="mono" font-size="11.5" font-weight="700" fill="#64748B" text-anchor="middle">Dimension: 512 | ||v||₂ = 1.0</text>')
    lines.append('    </g>')

    # Arrow 1.4 -> 1.5
    lines.append('    <!-- Arrow 1.4 -> 1.5 -->')
    lines.append('    <line x1="1320" y1="335" x2="1395" y2="335" stroke="#0F172A" stroke-width="4" stroke-linecap="round"/>')
    lines.append('    <polygon points="1410,335 1390,325 1390,345" fill="#0F172A"/>')

    # 1.5 Vector Store (Milvus DB)
    lines.append('    <!-- 1.5 Vector Store -->')
    lines.append('    <g id="P1_Vector_Store" transform="translate(1420, 205)">')
    lines.append('      <rect x="0" y="0" width="430" height="260" rx="10" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.4" filter="url(#accentGlow)"/>')
    lines.append('      <rect x="0" y="0" width="430" height="42" rx="10" fill="#E0F2FE" stroke="#0284C7" stroke-width="2"/>')
    lines.append('      <text x="215" y="27" font-size="15" font-weight="900" fill="#0369A1" text-anchor="middle">🗄️ Vector Store (Milvus / In-Memory)</text>')
    
    # DB Cylinder Illustration
    lines.append('      <g transform="translate(25, 60)">')
    lines.append('        <path d="M 0 25 L 0 85 A 65 18 0 0 0 130 85 L 130 25 Z" fill="url(#dbGrad)" stroke="#0284C7" stroke-width="1.8"/>')
    lines.append('        <path d="M 0 45 A 65 15 0 0 0 130 45" fill="none" stroke="#0284C7" stroke-width="1.2" stroke-dasharray="3,3"/>')
    lines.append('        <path d="M 0 65 A 65 15 0 0 0 130 65" fill="none" stroke="#0284C7" stroke-width="1.2" stroke-dasharray="3,3"/>')
    lines.append('        <ellipse cx="65" cy="25" rx="65" ry="16" fill="#BAE6FD" stroke="#0284C7" stroke-width="1.8"/>')
    lines.append('        <text x="65" y="30" class="mono" font-size="12" font-weight="900" fill="#0369A1" text-anchor="middle">MILVUS DB</text>')
    lines.append('      </g>')

    # Specs table on right of cylinder
    lines.append('      <g transform="translate(175, 56)">')
    lines.append('        <rect x="0" y="0" width="235" height="135" rx="6" fill="#F0F9FF" stroke="#BAE6FD" stroke-width="1.4"/>')
    lines.append('        <text x="14" y="24" class="mono" font-size="12" font-weight="800" fill="#0284C7">• Collection: nexus_kb</text>')
    lines.append('        <text x="14" y="46" class="mono" font-size="12" font-weight="700" fill="#334155">• Index: HNSW (M=16, ef=64)</text>')
    lines.append('        <text x="14" y="68" class="mono" font-size="12" font-weight="700" fill="#334155">• Metric: Cosine (Inner Prod)</text>')
    lines.append('        <text x="14" y="90" class="mono" font-size="12" font-weight="700" fill="#334155">• Capacity: 35 Chunks (~142KB)</text>')
    lines.append('        <text x="14" y="115" class="mono" font-size="12" font-weight="900" fill="#059669">• Search Latency: &lt; 0.8 ms</text>')
    lines.append('      </g>')

    lines.append('      <rect x="25" y="202" width="385" height="38" rx="6" fill="#0F172A"/>')
    lines.append('      <text x="217" y="226" class="mono" font-size="12.5" font-weight="800" fill="#38BDF8" text-anchor="middle">⚡ SẴN SÀNG TRUY XUẤT NGỮ CẢNH THỜI GIAN THỰC</text>')
    lines.append('    </g>')
    lines.append('  </g>')

    # =========================================================================
    # PHASE 2 & 3: RETRIEVAL & GENERATION (BOTTOM ZONES)
    # =========================================================================
    lines.append('  <!-- ==================== PHASE 2: RETRIEVAL (ONLINE) ==================== -->')
    lines.append('  <g id="Zone_2_Retrieval">')
    lines.append('    <rect x="40" y="525" width="1070" height="425" rx="12" fill="url(#retrievalGrad)" stroke="#86EFAC" stroke-width="1.8" filter="url(#softShadow)"/>')
    
    # Phase Tag 2
    lines.append('    <rect x="60" y="542" width="410" height="34" rx="6" fill="#065F46"/>')
    lines.append('    <text x="75" y="565" class="mono" font-size="13" font-weight="800" fill="#A7F3D0">GIAI ĐOẠN 2: RETRIEVAL (TRUY XUẤT NGỮ CẢNH)</text>')
    # Two subtitle segments split around the vertical pipe at x=775
    lines.append('    <text x="490" y="565" font-size="13.5" font-weight="600" fill="#047857">Truy vấn người dùng • Query Embedding</text>')
    lines.append('    <text x="815" y="565" font-size="13.5" font-weight="600" fill="#047857">Hybrid Search (70% Cosine + 30% BM25) • Top-K Context</text>')

    # 2.1 User & Query
    lines.append('    <!-- 2.1 User & Query -->')
    lines.append('    <g id="P2_User_Query" transform="translate(70, 595)">')
    lines.append('      <rect x="0" y="0" width="270" height="330" rx="10" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" filter="url(#softShadow)"/>')
    lines.append('      <rect x="0" y="0" width="270" height="42" rx="10" fill="#F8FAFC" stroke="#0F172A" stroke-width="2"/>')
    lines.append('      <text x="135" y="27" font-size="15" font-weight="800" fill="#0F172A" text-anchor="middle">👤 Người Dùng / Merchant</text>')
    
    # Avatar
    lines.append('      <circle cx="50" cy="80" r="22" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.8"/>')
    lines.append('      <circle cx="50" cy="74" r="8" fill="#0284C7"/>')
    lines.append('      <path d="M 36 94 A 14 14 0 0 1 64 94 Z" fill="#0284C7"/>')
    lines.append('      <text x="85" y="75" font-size="14" font-weight="800" fill="#0F172A">Chủ Shop Gửi Hàng</text>')
    lines.append('      <text x="85" y="93" class="mono" font-size="11.5" font-weight="600" fill="#64748B">Merchant App / Web</text>')

    # Speech bubble query
    lines.append('      <g transform="translate(15, 115)">')
    lines.append('        <rect x="0" y="0" width="240" height="110" rx="8" fill="#0284C7" filter="url(#softShadow)"/>')
    lines.append('        <text x="14" y="26" font-size="13" font-weight="700" fill="#FFFFFF">"Kiện hàng NEX-88291 bị</text>')
    lines.append('        <text x="14" y="48" font-size="13" font-weight="700" fill="#FFFFFF">bể vỡ do bưu tá làm rơi thì</text>')
    lines.append('        <text x="14" y="70" font-size="13" font-weight="700" fill="#FFFFFF">quy chế bồi thường thế nào?"</text>')
    lines.append('        <rect x="14" y="80" width="100" height="20" rx="4" fill="#0369A1"/>')
    lines.append('        <text x="64" y="94" class="mono" font-size="10.5" font-weight="800" fill="#BAE6FD" text-anchor="middle">AWB: NEX-88291</text>')
    lines.append('      </g>')

    lines.append('      <rect x="15" y="240" width="240" height="65" rx="6" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1.2"/>')
    lines.append('      <text x="135" y="262" class="mono" font-size="11.5" font-weight="800" fill="#065F46" text-anchor="middle">Intent: CLAIM_DAMAGE</text>')
    lines.append('      <text x="135" y="284" font-size="11" font-weight="600" fill="#047857" text-anchor="middle">Regex: AWB + Từ khóa "bể vỡ"</text>')
    lines.append('    </g>')

    # Arrow User Query -> Query Vector (via Embedding Model)
    lines.append('    <!-- Arrow User -> Query Vector -->')
    lines.append('    <path d="M 340 760 L 390 760" fill="none" stroke="#0F172A" stroke-width="4" stroke-linecap="round"/>')
    lines.append('    <polygon points="405,760 385,750 385,770" fill="#0F172A"/>')

    # 2.2 Query Vector
    lines.append('    <!-- 2.2 Query Vector -->')
    lines.append('    <g id="P2_Query_Vector" transform="translate(415, 630)">')
    lines.append('      <rect x="0" y="0" width="200" height="260" rx="10" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" filter="url(#softShadow)"/>')
    lines.append('      <rect x="0" y="0" width="200" height="42" rx="10" fill="#F5F3FF" stroke="#0F172A" stroke-width="2"/>')
    lines.append('      <text x="100" y="27" font-size="14.5" font-weight="800" fill="#6D28D9" text-anchor="middle">🎯 Query Vector</text>')
    
    lines.append('      <g transform="translate(15, 60)">')
    lines.append('        <text x="10" y="20" class="mono" font-size="12" font-weight="800" fill="#7C3AED">Embedding q:</text>')
    lines.append('        <rect x="0" y="32" width="170" height="70" rx="6" fill="#7C3AED"/>')
    lines.append('        <text x="85" y="60" class="mono" font-size="12.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">[ -0.031, +0.084,</text>')
    lines.append('        <text x="85" y="82" class="mono" font-size="12.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">..., -0.012 ]</text>')
    lines.append('      </g>')
    lines.append('      <text x="100" y="195" class="mono" font-size="11.5" font-weight="700" fill="#64748B" text-anchor="middle">Mã hóa bởi cùng</text>')
    lines.append('      <text x="100" y="215" class="mono" font-size="11.5" font-weight="700" fill="#6D28D9" text-anchor="middle">text-embedding-3</text>')
    lines.append('      <text x="100" y="240" class="mono" font-size="11" font-weight="600" fill="#94A3B8" text-anchor="middle">||q||₂ = 1.0</text>')
    lines.append('    </g>')

    # Arrow 2.2 -> 2.3
    lines.append('    <!-- Arrow Query Vector -> Similarity Search -->')
    lines.append('    <line x1="615" y1="760" x2="655" y2="760" stroke="#0F172A" stroke-width="4" stroke-linecap="round"/>')
    lines.append('    <polygon points="670,760 650,750 650,770" fill="#0F172A"/>')

    # Arrow Down from Vector Store (P1.5) to Similarity Search (P2.3)
    # Centered at x=775 (exact horizontal center of Similarity Search box 680 + 95 = 775)
    lines.append('    <!-- Highway Pipe from Vector Store down to Similarity Search -->')
    lines.append('    <path d="M 1635 465 L 1635 500 L 775 500 L 775 615" fill="none" stroke="#0284C7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
    lines.append('    <polygon points="775,630 765,610 785,610" fill="#0284C7"/>')

    # 2.3 Similarity Search (Hybrid Match)
    lines.append('    <!-- 2.3 Similarity Search -->')
    lines.append('    <g id="P2_Similarity_Search" transform="translate(680, 630)">')
    lines.append('      <rect x="0" y="0" width="190" height="260" rx="10" fill="#FFFFFF" stroke="#059669" stroke-width="2.2" filter="url(#softShadow)"/>')
    lines.append('      <rect x="0" y="0" width="190" height="42" rx="10" fill="#DCFCE7" stroke="#059669" stroke-width="2"/>')
    lines.append('      <text x="95" y="27" font-size="14" font-weight="900" fill="#065F46" text-anchor="middle">🔍 Similarity Search</text>')
    
    # Magnifying Glass Icon
    lines.append('      <g transform="translate(65, 55)">')
    lines.append('        <circle cx="25" cy="25" r="20" fill="none" stroke="#059669" stroke-width="4.5"/>')
    lines.append('        <line x1="40" y1="40" x2="58" y2="58" stroke="#059669" stroke-width="5.5" stroke-linecap="round"/>')
    lines.append('        <circle cx="25" cy="25" r="10" fill="#10B981" opacity="0.25"/>')
    lines.append('      </g>')

    lines.append('      <g transform="translate(10, 130)">')
    lines.append('        <rect x="0" y="0" width="170" height="34" rx="5" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.2"/>')
    lines.append('        <text x="85" y="22" class="mono" font-size="11.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">Dense: Cosine (70%)</text>')
    
    lines.append('        <rect x="0" y="42" width="170" height="34" rx="5" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.2"/>')
    lines.append('        <text x="85" y="64" class="mono" font-size="11.5" font-weight="800" fill="#B45309" text-anchor="middle">Sparse: BM25 (30%)</text>')
    lines.append('      </g>')
    lines.append('      <text x="95" y="238" class="mono" font-size="11" font-weight="800" fill="#065F46" text-anchor="middle">Threshold: Score ≥ 0.52</text>')
    lines.append('    </g>')

    # Arrow 2.3 -> 2.4
    lines.append('    <!-- Arrow Similarity Search -> Top-K Context -->')
    lines.append('    <line x1="870" y1="760" x2="905" y2="760" stroke="#0F172A" stroke-width="4" stroke-linecap="round"/>')
    lines.append('    <polygon points="920,760 900,750 900,770" fill="#0F172A"/>')

    # 2.4 Top-K Context
    lines.append('    <!-- 2.4 Top-K Context -->')
    lines.append('    <g id="P2_TopK_Context" transform="translate(930, 595)">')
    lines.append('      <rect x="0" y="0" width="170" height="330" rx="10" fill="#FFFFFF" stroke="#059669" stroke-width="2" filter="url(#softShadow)"/>')
    lines.append('      <rect x="0" y="0" width="170" height="42" rx="10" fill="#F0FDF4" stroke="#059669" stroke-width="2"/>')
    lines.append('      <text x="85" y="27" font-size="14.5" font-weight="800" fill="#065F46" text-anchor="middle">📑 Top-K Context</text>')
    
    # Ranked Chunks
    lines.append('      <g transform="translate(10, 55)">')
    lines.append('        <rect x="0" y="0" width="150" height="78" rx="6" fill="#DCFCE7" stroke="#10B981" stroke-width="1.8"/>')
    lines.append('        <rect x="6" y="6" width="60" height="18" rx="3" fill="#059669"/>')
    lines.append('        <text x="36" y="19" class="mono" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">TOP 1</text>')
    lines.append('        <text x="72" y="19" class="mono" font-size="11" font-weight="800" fill="#065F46">Score: 0.91</text>')
    lines.append('        <text x="8" y="42" font-size="11.5" font-weight="800" fill="#047857">Điều 4.2: BBBT</text>')
    lines.append('        <text x="8" y="62" font-size="11" font-weight="600" fill="#14532D">Hàng vỡ lập trong 24h</text>')
    lines.append('      </g>')

    lines.append('      <g transform="translate(10, 142)">')
    lines.append('        <rect x="0" y="0" width="150" height="78" rx="6" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.2"/>')
    lines.append('        <rect x="6" y="6" width="60" height="18" rx="3" fill="#64748B"/>')
    lines.append('        <text x="36" y="19" class="mono" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">TOP 2</text>')
    lines.append('        <text x="72" y="19" class="mono" font-size="11" font-weight="800" fill="#475569">Score: 0.84</text>')
    lines.append('        <text x="8" y="42" font-size="11.5" font-weight="700" fill="#334155">Cước Quy Đổi</text>')
    lines.append('        <text x="8" y="62" class="mono" font-size="10.5" font-weight="600" fill="#475569">(DxRxC)/6000</text>')
    lines.append('      </g>')

    lines.append('      <rect x="10" y="235" width="150" height="80" rx="6" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1.2"/>')
    lines.append('      <text x="75" y="258" class="mono" font-size="11" font-weight="800" fill="#DC2626" text-anchor="middle">RAG Grounding</text>')
    lines.append('      <text x="75" y="278" font-size="11" font-weight="600" fill="#991B1B" text-anchor="middle">Triệt tiêu 100%</text>')
    lines.append('      <text x="75" y="296" font-size="11" font-weight="600" fill="#991B1B" text-anchor="middle">ảo giác (Hallucination)</text>')
    lines.append('    </g>')
    lines.append('  </g>')

    # =========================================================================
    # PHASE 3: GENERATION (BOTTOM-RIGHT ZONE)
    # =========================================================================
    lines.append('  <!-- ==================== PHASE 3: GENERATION (AUGMENTATION) ==================== -->')
    lines.append('  <g id="Zone_3_Generation">')
    lines.append('    <rect x="1130" y="525" width="750" height="425" rx="12" fill="url(#generationGrad)" stroke="#C4B5FD" stroke-width="1.8" filter="url(#softShadow)"/>')
    
    # Phase Tag 3
    lines.append('    <rect x="1150" y="542" width="320" height="34" rx="6" fill="#5B21B6"/>')
    lines.append('    <text x="1165" y="565" class="mono" font-size="12.5" font-weight="800" fill="#DDD6FE">GIAI ĐOẠN 3: GENERATION (SINH PHẢN HỒI)</text>')
    lines.append('    <text x="1485" y="565" font-size="13" font-weight="600" fill="#6D28D9">Prompt Augmentation • LLM Engine • Action Cards</text>')

    # 3.1 LLM Engine (Core Brain)
    lines.append('    <!-- 3.1 LLM Engine -->')
    lines.append('    <g id="P3_LLM_Engine" transform="translate(1150, 595)">')
    lines.append('      <rect x="0" y="0" width="280" height="330" rx="10" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.2" filter="url(#accentGlow)"/>')
    lines.append('      <rect x="0" y="0" width="280" height="42" rx="10" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2"/>')
    lines.append('      <text x="140" y="27" font-size="15" font-weight="900" fill="#6D28D9" text-anchor="middle">🧠 LLM Engine (Sinh Ngữ Cảnh)</text>')
    
    # Brain Dual Hemisphere Icon
    lines.append('      <g transform="translate(105, 55)">')
    # Left hemisphere (Creative/Generative - Magenta)
    lines.append('        <path d="M 30 10 A 25 35 0 0 0 10 50 A 20 25 0 0 0 25 75 L 30 75 Z" fill="#DB2777" opacity="0.9"/>')
    # Right hemisphere (Analytical/Grounded - Blue)
    lines.append('        <path d="M 35 10 A 25 35 0 0 1 55 50 A 20 25 0 0 1 40 75 L 35 75 Z" fill="#2563EB" opacity="0.9"/>')
    # Neural sparks
    lines.append('        <circle cx="32" cy="18" r="3.5" fill="#FFFFFF"/>')
    lines.append('        <circle cx="20" cy="42" r="3.5" fill="#FFFFFF"/>')
    lines.append('        <circle cx="45" cy="42" r="3.5" fill="#FFFFFF"/>')
    lines.append('      </g>')

    # Prompt Composition Spec Box
    lines.append('      <g transform="translate(15, 142)">')
    lines.append('        <rect x="0" y="0" width="250" height="110" rx="6" fill="#F5F3FF" stroke="#DDD6FE" stroke-width="1.2"/>')
    lines.append('        <text x="12" y="22" class="mono" font-size="11.5" font-weight="800" fill="#6D28D9">Prompt Augmentation:</text>')
    lines.append('        <text x="12" y="44" font-size="12" font-weight="700" fill="#1E293B">1. System Prompt (Quy chuẩn)</text>')
    lines.append('        <text x="12" y="66" font-size="12" font-weight="700" fill="#047857">2. Top-K Context (Điều 4.2)</text>')
    lines.append('        <text x="12" y="88" font-size="12" font-weight="700" fill="#0284C7">3. User Question ("bể vỡ...")</text>')
    lines.append('      </g>')
    
    lines.append('      <rect x="15" y="265" width="250" height="50" rx="6" fill="#5B21B6"/>')
    lines.append('      <text x="140" y="286" class="mono" font-size="12.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">Gemini 1.5 / GPT-4o</text>')
    lines.append('      <text x="140" y="304" font-size="11" font-weight="500" fill="#DDD6FE" text-anchor="middle">Temp = 0.1 • Top-p = 0.95 (Zero Bias)</text>')
    lines.append('    </g>')

    # Arrow Top-K Context -> LLM Engine
    lines.append('    <!-- Arrow Top-K Context -> LLM -->')
    lines.append('    <line x1="1100" y1="760" x2="1140" y2="760" stroke="#0F172A" stroke-width="4" stroke-linecap="round"/>')
    lines.append('    <polygon points="1150,760 1130,750 1130,770" fill="#0F172A"/>')

    # Arrow User Query Directly to LLM (Theoretical Pipeline Bottom Bridge)
    # Routed cleanly through y=952 between bottom of zones and footer bar
    lines.append('    <!-- Long User Prompt Bridge directly into LLM -->')
    lines.append('    <path d="M 205 925 L 205 952 L 1290 952 L 1290 935" fill="none" stroke="#0F172A" stroke-width="3" stroke-dasharray="8 4" stroke-linecap="round" stroke-linejoin="round"/>')
    lines.append('    <polygon points="1290,925 1282,940 1298,940" fill="#0F172A"/>')
    lines.append('    <rect x="670" y="940" width="280" height="24" rx="4" fill="#0F172A"/>')
    lines.append('    <text x="810" y="956" class="mono" font-size="11" font-weight="700" fill="#F8FAFC" text-anchor="middle">Nạp Nguyên Văn Câu Hỏi Người Dùng</text>')

    # Arrow 3.1 LLM -> 3.2 Output Answer
    lines.append('    <!-- Arrow LLM -> Answer -->')
    lines.append('    <line x1="1430" y1="760" x2="1470" y2="760" stroke="#0F172A" stroke-width="4" stroke-linecap="round"/>')
    lines.append('    <polygon points="1485,760 1465,750 1465,770" fill="#0F172A"/>')

    # 3.2 Grounded Answer & Action Card
    lines.append('    <!-- 3.2 Grounded Answer & Action Card -->')
    lines.append('    <g id="P3_Answer_Card" transform="translate(1495, 595)">')
    lines.append('      <rect x="0" y="0" width="365" height="330" rx="10" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" filter="url(#softShadow)"/>')
    lines.append('      <rect x="0" y="0" width="365" height="42" rx="10" fill="#F0FDF4" stroke="#0F172A" stroke-width="2"/>')
    lines.append('      <text x="182" y="27" font-size="15" font-weight="900" fill="#065F46" text-anchor="middle">📝 Phản Hồi Bưu Chính &amp; Thẻ Hành Động</text>')
    
    # Response speech card
    lines.append('      <g transform="translate(15, 52)">')
    lines.append('        <rect x="0" y="0" width="335" height="152" rx="8" fill="#F0F9FF" stroke="#BAE6FD" stroke-width="1.6"/>')
    lines.append('        <text x="14" y="24" font-size="13" font-weight="800" fill="#0369A1">🤖 Trợ lý AI Nexus phản hồi:</text>')
    lines.append('        <text x="14" y="46" font-size="12.5" font-weight="500" fill="#0F172A">"Theo <tspan font-weight="bold" fill="#0284C7">Điều 4.2 Quy chế Bồi thường</tspan>, đơn hàng</text>')
    lines.append('        <text x="14" y="66" class="mono" font-size="12.5" font-weight="800" fill="#0284C7">NEX-88291 <tspan font-family="Inter" font-weight="normal" fill="#0F172A">bị bể vỡ sẽ được giải quyết:</tspan></text>')
    lines.append('        <text x="14" y="88" font-size="12.5" font-weight="700" fill="#059669">• Đền 100% khai giá (đã có gói bảo hiểm).</text>')
    lines.append('        <text x="14" y="108" font-size="12.5" font-weight="700" fill="#DC2626">• Điều kiện: Đã lập Biên bản (BBBT) trong 24h.</text>')
    lines.append('        <text x="14" y="128" font-size="12" font-weight="600" fill="#475569">• Cước vận chuyển đã tính theo chuẩn (DxRxC)/6000."</text>')
    lines.append('        <text x="14" y="144" class="mono" font-size="10.5" fill="#64748B">[Trích xuất: 02-claim-policy.md#chunk-4]</text>')
    lines.append('      </g>')

    # 2 Action Buttons
    lines.append('      <g transform="translate(15, 215)">')
    lines.append('        <rect x="0" y="0" width="162" height="42" rx="6" fill="#059669" filter="url(#softShadow)"/>')
    lines.append('        <text x="81" y="26" class="mono" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">📝 TẠO ĐỀN BÙ</text>')
    
    lines.append('        <rect x="173" y="0" width="162" height="42" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>')
    lines.append('        <text x="254" y="26" class="mono" font-size="12" font-weight="800" fill="#0F172A" text-anchor="middle">🔍 TRA CỨU BBBT</text>')
    lines.append('      </g>')

    lines.append('      <rect x="15" y="268" width="335" height="48" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('      <text x="182" y="288" class="mono" font-size="11.5" font-weight="700" fill="#0F172A" text-anchor="middle">Faithfulness 99.8% • Answer Relevance 97.6%</text>')
    lines.append('      <text x="182" y="305" font-size="11" font-weight="500" fill="#64748B" text-anchor="middle">Xác thực chéo cơ sở dữ liệu Tracking &amp; Khiếu nại</text>')
    lines.append('    </g>')
    lines.append('  </g>')

    # =========================================================================
    # FOOTER BAR (MATHEMATICAL FOUNDATION & LEGEND)
    # =========================================================================
    lines.append('  <!-- ==================== FOOTER BAR ==================== -->')
    lines.append('  <g id="Footer_Bar" transform="translate(40, 975)">')
    lines.append('    <rect x="0" y="0" width="1840" height="80" rx="10" fill="#0F172A"/>')
    
    # Row 1: Title on left, Legend on right
    lines.append('    <text x="30" y="30" font-size="13.5" font-weight="800" fill="#38BDF8">ĐẶC TẢ TOÁN HỌC &amp; NGUYÊN LÝ HOẠT ĐỘNG (MATHEMATICAL FORMULATIONS):</text>')
    
    # Legend right aligned cleanly inside footer bar (width 1840)
    lines.append('    <g transform="translate(1120, 14)">')
    lines.append('      <line x1="0" y1="14" x2="30" y2="14" stroke="#38BDF8" stroke-width="4"/>')
    lines.append('      <polygon points="30,14 18,8 18,20" fill="#38BDF8"/>')
    lines.append('      <text x="38" y="18" font-size="13" font-weight="700" fill="#BAE6FD">1. Indexing (Ngoại tuyến)</text>')

    lines.append('      <line x1="225" y1="14" x2="255" y2="14" stroke="#34D399" stroke-width="4"/>')
    lines.append('      <polygon points="255,14 243,8 243,20" fill="#34D399"/>')
    lines.append('      <text x="263" y="18" font-size="13" font-weight="700" fill="#A7F3D0">2. Retrieval (Truy xuất)</text>')

    lines.append('      <line x1="440" y1="14" x2="470" y2="14" stroke="#C084FC" stroke-width="4"/>')
    lines.append('      <polygon points="470,14 458,8 458,20" fill="#C084FC"/>')
    lines.append('      <text x="478" y="18" font-size="13" font-weight="700" fill="#DDD6FE">3. Generation (Sinh phản hồi)</text>')
    lines.append('    </g>')

    # Row 2: Mathematical formulations spanning full width
    lines.append('    <text x="30" y="58" class="mono" font-size="12" fill="#E2E8F0">• Cosine Similarity: cos(q, d) = q · d (L2-Normalized)   |   • Hybrid Score = 0.70·Sim_Dense + 0.30·Score_BM25   |   • Trọng Lượng Quy Đổi: (DxRxC)/6000 (Chuẩn Vận Tải Đường Bộ)</text>')
    lines.append('  </g>')

    lines.append('</svg>')
    return '\n'.join(lines)

def main():
    target_path = os.path.abspath("docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/03-rag-core-components-pipeline.svg")
    print(f"Generating Harmonized RAG Pipeline SVG to:\n  {target_path}")
    svg_content = generate_svg()
    
    # Ensure directory
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    
    # Validate XML
    ET.fromstring(svg_content)
    print("SUCCESS: SVG generated and validated with zero XML errors!")

if __name__ == "__main__":
    main()
