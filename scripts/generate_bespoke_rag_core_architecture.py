#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE BESPOKE LOGISTICS RAG CORE ARCHITECTURE & RUNTIME PIPELINE
==================================================================
Bản vẽ Kỹ thuật Sư phạm Chuyên biệt cho Hệ thống Bưu chính Nexus Logistics.
Mô hình hóa toàn diện các thành phần cốt lõi và chu trình vận hành RAG thực tế:
- Làn 1: Offline Knowledge Ingestion & Vector Indexing (ingest.ts, chunker.ts, text-embedding-3-small)
- Làn 2: Vector Repository & Online Hybrid Retrieval (vector-index.json, retriever.ts, Cosine Sim k=3)
- Làn 3: Grounded In-Context Generation & Logistics Response (gpt-4o-mini, Điều 4.2 BBBT, SLA 24h)
Mang đậm phong cách kiến trúc Logistics: Vận đơn, SOP bưu chính, SLA, Ngưỡng bồi thường, HNSW/Cosine.
"""

import os
import html
import xml.etree.ElementTree as ET

def xml_esc(s):
    if s is None:
        return ""
    if not isinstance(s, str):
        s = str(s)
    return html.escape(s, quote=True)

def generate_svg():
    width = 1420
    height = 960

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # STYLES DEFINITION (ENTERPRISE LOGISTICS ARCHITECTURE BLUEPRINT)
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }')
    lines.append('      .main-title { font-size: 22px; font-weight: 900; fill: #0F172A; text-anchor: middle; letter-spacing: -0.3px; }')
    lines.append('      .sub-title { font-family: ui-monospace, Menlo, monospace; font-size: 13px; font-weight: 700; fill: #0284C7; text-anchor: middle; }')
    lines.append('      .lane-hdr { font-family: ui-monospace, Menlo, monospace; font-size: 12px; font-weight: 800; fill: #FFFFFF; }')
    lines.append('      .lane-sub { font-size: 11px; font-weight: 600; fill: #94A3B8; }')
    lines.append('      .card-title { font-size: 13.5px; font-weight: 800; fill: #0F172A; }')
    lines.append('      .card-tech { font-family: ui-monospace, Menlo, monospace; font-size: 11px; font-weight: 700; fill: #2563EB; }')
    lines.append('      .card-body { font-size: 11.5px; fill: #334155; line-height: 1.4; }')
    lines.append('      .card-highlight { font-size: 11px; font-weight: 700; fill: #059669; }')
    lines.append('      .badge-txt { font-family: ui-monospace, monospace; font-size: 10px; font-weight: 800; text-anchor: middle; }')
    lines.append('      .flow-arrow { fill: none; stroke: #0F172A; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .flow-arrow-blue { fill: none; stroke: #0284C7; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .flow-arrow-dashed { fill: none; stroke: #059669; stroke-width: 2.0; stroke-dasharray: 6,4; }')
    lines.append('      .arrowhead { fill: #0F172A; }')
    lines.append('      .arrowhead-blue { fill: #0284C7; }')
    lines.append('      .arrowhead-green { fill: #059669; }')
    lines.append('      .caption-txt { font-family: "Times New Roman", Times, serif; font-size: 20px; font-weight: 600; fill: #0F172A; text-anchor: middle; }')
    lines.append('    ]]></style>')

    # Drop Shadows & Gradients
    lines.append('    <filter id="cardShadow" x="-4%" y="-4%" width="108%" height="110%" filterUnits="userSpaceOnUse">')
    lines.append('      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0F172A" flood-opacity="0.07"/>')
    lines.append('    </filter>')
    lines.append('    <linearGradient id="vectorGrad" x1="0%" y1="0%" x2="100%" y2="0%">')
    lines.append('      <stop offset="0%" stop-color="#0284C7"/>')
    lines.append('      <stop offset="50%" stop-color="#38BDF8"/>')
    lines.append('      <stop offset="100%" stop-color="#0D9488"/>')
    lines.append('    </linearGradient>')
    lines.append('  </defs>')
    lines.append('')

    # BACKGROUND
    lines.append(f'  <rect width="{width}" height="{height}" fill="#F8FAFC"/>')

    # ARROWHEAD HELPER
    def arrow_head(x, y, direction="right", size=10, fill_class="arrowhead"):
        if direction == "right":
            return f'  <polygon points="{x},{y} {x-size},{y-size*0.55} {x-size},{y+size*0.55}" class="{fill_class}"/>'
        elif direction == "left":
            return f'  <polygon points="{x},{y} {x+size},{y-size*0.55} {x+size},{y+size*0.55}" class="{fill_class}"/>'
        elif direction == "down":
            return f'  <polygon points="{x},{y} {x-size*0.55},{y-size} {x+size*0.55},{y-size}" class="{fill_class}"/>'
        elif direction == "up":
            return f'  <polygon points="{x},{y} {x-size*0.55},{y+size} {x+size*0.55},{y+size}" class="{fill_class}"/>'

    # =========================================================================
    # 0. HEADER SECTION
    # =========================================================================
    lines.append('  <!-- ==================== HEADER ==================== -->')
    lines.append('  <g id="Header_Banner">')
    lines.append(f'    <text x="{width/2}" y="38" class="main-title">KIẾN TRÚC THÀNH PHẦN CỐT LÕI &amp; VẬN HÀNH PHÂN HỆ RAG BƯU CHÍNH</text>')
    lines.append(f'    <text x="{width/2}" y="60" class="sub-title">NEXUS LOGISTICS AGENTIC RAG SYSTEM: CORE COMPONENTS &amp; RUNTIME PIPELINE</text>')
    lines.append(f'    <line x1="50" y1="74" x2="{width-50}" y2="74" stroke="#CBD5E1" stroke-width="1.6"/>')
    lines.append('  </g>')

    # =========================================================================
    # LANE 1: OFFLINE KNOWLEDGE INGESTION & VECTOR INDEXING (Y: 90 - 330)
    # =========================================================================
    lane1_y, lane1_h = 88, 235
    lines.append('  <!-- ==================== LANE 1: OFFLINE INGESTION ==================== -->')
    lines.append('  <g id="Lane_1_Offline_Ingestion">')
    # Lane Container
    lines.append(f'    <rect x="50" y="{lane1_y}" width="{width-100}" height="{lane1_h}" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.8" filter="url(#cardShadow)"/>')
    # Lane Header Bar
    lines.append(f'    <rect x="50" y="{lane1_y}" width="{width-100}" height="32" rx="10" fill="#0F172A"/>')
    lines.append(f'    <text x="70" y="{lane1_y+21}" class="lane-hdr">PHÂN TẦNG 1: TIỀN XỬ LÝ &amp; LẬP CHỈ MỤC TRI THỨC BƯU CHÍNH (OFFLINE INGESTION PIPELINE)</text>')
    lines.append(f'    <rect x="{width-230}" y="{lane1_y+6}" width="165" height="20" rx="4" fill="#1E293B"/>')
    lines.append(f'    <text x="{width-147}" y="{lane1_y+20}" class="badge-txt" fill="#38BDF8">OFFLINE BATCH JOB</text>')

    # Station 1.1: Document Loaders (scripts/rag/ingest.ts)
    s1_x, s1_y, s1_w, s1_h = 75, lane1_y + 46, 260, 168
    lines.append(f'    <!-- Station 1.1: Loaders -->')
    lines.append(f'    <rect x="{s1_x}" y="{s1_y}" width="{s1_w}" height="{s1_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.6"/>')
    lines.append(f'    <rect x="{s1_x+10}" y="{s1_y+10}" width="105" height="20" rx="4" fill="#EFF6FF"/>')
    lines.append(f'    <text x="{s1_x+62}" y="{s1_y+24}" class="badge-txt" fill="#1D4ED8">LOADER ENGINE</text>')
    lines.append(f'    <text x="{s1_x+10}" y="{s1_y+48}" class="card-title">1. Document Loaders</text>')
    lines.append(f'    <text x="{s1_x+10}" y="{s1_y+66}" class="card-tech">scripts/rag/ingest.ts</text>')
    lines.append(f'    <text x="{s1_x+10}" y="{s1_y+88}" class="card-body">• Nạp 5 tệp SOP bưu chính (.md)</text>')
    lines.append(f'    <text x="{s1_x+10}" y="{s1_y+106}" class="card-body">• Bóc tách Markdown Frontmatter</text>')
    lines.append(f'    <text x="{s1_x+10}" y="{s1_y+124}" class="card-body">• Trích xuất Schema chuẩn:</text>')
    lines.append(f'    <rect x="{s1_x+10}" y="{s1_y+134}" width="{s1_w-20}" height="24" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.0"/>')
    lines.append(f'    <text x="{s1_x+20}" y="{s1_y+150}" font-family="ui-monospace, monospace" font-size="10.5" font-weight="700" fill="#0F172A">{{ page_content, id, metadata }}</text>')

    # Arrow 1.1 -> 1.2
    lines.append(f'    <line x1="{s1_x+s1_w}" y1="{s1_y+s1_h/2}" x2="{s1_x+s1_w+35}" y2="{s1_y+s1_h/2}" class="flow-arrow"/>')
    lines.append(arrow_head(s1_x+s1_w+35, s1_y+s1_h/2, "right", 10))

    # Station 1.2: Sliding Window Splitter (scripts/rag/chunker.ts)
    s2_x, s2_y, s2_w, s2_h = s1_x + s1_w + 35, lane1_y + 46, 275, 168
    lines.append(f'    <!-- Station 1.2: Splitter -->')
    lines.append(f'    <rect x="{s2_x}" y="{s2_y}" width="{s2_w}" height="{s2_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.6"/>')
    lines.append(f'    <rect x="{s2_x+10}" y="{s2_y+10}" width="125" height="20" rx="4" fill="#FEF3C7"/>')
    lines.append(f'    <text x="{s2_x+72}" y="{s2_y+24}" class="badge-txt" fill="#B45309">SLIDING CHUNKER</text>')
    lines.append(f'    <text x="{s2_x+10}" y="{s2_y+48}" class="card-title">2. Text Splitter</text>')
    lines.append(f'    <text x="{s2_x+10}" y="{s2_y+66}" class="card-tech">scripts/rag/chunker.ts</text>')
    lines.append(f'    <text x="{s2_x+10}" y="{s2_y+88}" class="card-body">• Cắt phân đoạn tối đa: 250 từ</text>')
    lines.append(f'    <text x="{s2_x+10}" y="{s2_y+106}" class="card-body">• Cửa sổ trượt (Overlap): 40 từ (~16%)</text>')
    lines.append(f'    <text x="{s2_x+10}" y="{s2_y+124}" class="card-body">• Bảo toàn ngữ cảnh tiêu đề AST:</text>')
    lines.append(f'    <rect x="{s2_x+10}" y="{s2_y+134}" width="{s2_w-20}" height="24" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.0"/>')
    lines.append(f'    <text x="{s2_x+16}" y="{s2_y+150}" font-family="ui-monospace, monospace" font-size="10" font-weight="700" fill="#B45309">currentDocTitle &gt; sectionTitle</text>')

    # Arrow 1.2 -> 1.3
    lines.append(f'    <line x1="{s2_x+s2_w}" y1="{s2_y+s2_h/2}" x2="{s2_x+s2_w+35}" y2="{s2_y+s2_h/2}" class="flow-arrow"/>')
    lines.append(arrow_head(s2_x+s2_w+35, s2_y+s2_h/2, "right", 10))

    # Station 1.3: Logistics Knowledge Chunks
    s3_x, s3_y, s3_w, s3_h = s2_x + s2_w + 35, lane1_y + 46, 280, 168
    lines.append(f'    <!-- Station 1.3: Chunks -->')
    lines.append(f'    <rect x="{s3_x}" y="{s3_y}" width="{s3_w}" height="{s3_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.6"/>')
    lines.append(f'    <rect x="{s3_x+10}" y="{s3_y+10}" width="115" height="20" rx="4" fill="#ECFDF5"/>')
    lines.append(f'    <text x="{s3_x+67}" y="{s3_y+24}" class="badge-txt" fill="#047857">KNOWLEDGE CHUNKS</text>')
    lines.append(f'    <text x="{s3_x+10}" y="{s3_y+48}" class="card-title">3. Standard Chunks</text>')
    lines.append(f'    <text x="{s3_x+10}" y="{s3_y+66}" class="card-tech">Kho dữ liệu đoạn văn bưu chính</text>')
    
    # 3 mini chunk pills
    lines.append(f'    <rect x="{s3_x+10}" y="{s3_y+76}" width="{s3_w-20}" height="24" rx="4" fill="#FFFFFF" stroke="#059669" stroke-width="1.2"/>')
    lines.append(f'    <text x="{s3_x+18}" y="{s3_y+92}" font-family="ui-monospace, monospace" font-size="10" font-weight="700" fill="#0F172A">#CLM-02-P1: Điều 4.2 Lập BBBT 24h</text>')

    lines.append(f'    <rect x="{s3_x+10}" y="{s3_y+106}" width="{s3_w-20}" height="24" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.0"/>')
    lines.append(f'    <text x="{s3_x+18}" y="{s3_y+122}" font-family="ui-monospace, monospace" font-size="10" font-weight="600" fill="#475569">#PRC-01-P2: Cước IATA (DxRxC)/5000</text>')

    lines.append(f'    <rect x="{s3_x+10}" y="{s3_y+136}" width="{s3_w-20}" height="24" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.0"/>')
    lines.append(f'    <text x="{s3_x+18}" y="{s3_y+152}" font-family="ui-monospace, monospace" font-size="10" font-weight="600" fill="#475569">#PRO-03-P1: Pin Lithium &gt; 100Wh cấm</text>')

    # Arrow 1.3 -> 1.4
    lines.append(f'    <line x1="{s3_x+s3_w}" y1="{s3_y+s3_h/2}" x2="{s3_x+s3_w+35}" y2="{s3_y+s3_h/2}" class="flow-arrow"/>')
    lines.append(arrow_head(s3_x+s3_w+35, s3_y+s3_h/2, "right", 10))

    # Station 1.4: Embedding Model (OpenAI API)
    s4_x, s4_y, s4_w, s4_h = s3_x + s3_w + 35, lane1_y + 46, 290, 168
    lines.append(f'    <!-- Station 1.4: Embedding Model -->')
    lines.append(f'    <rect x="{s4_x}" y="{s4_y}" width="{s4_w}" height="{s4_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.6"/>')
    lines.append(f'    <rect x="{s4_x+10}" y="{s4_y+10}" width="125" height="20" rx="4" fill="#F3E8FF"/>')
    lines.append(f'    <text x="{s4_x+72}" y="{s4_y+24}" class="badge-txt" fill="#7E22CE">EMBEDDING MODEL</text>')
    lines.append(f'    <text x="{s4_x+10}" y="{s4_y+48}" class="card-title">4. OpenAI Embedder</text>')
    lines.append(f'    <text x="{s4_x+10}" y="{s4_y+66}" class="card-tech">text-embedding-3-small</text>')
    lines.append(f'    <text x="{s4_x+10}" y="{s4_y+88}" class="card-body">• Chiều không gian vector: 1536-D</text>')
    lines.append(f'    <text x="{s4_x+10}" y="{s4_y+106}" class="card-body">• Chuẩn hóa vector: L2 Normalized</text>')
    lines.append(f'    <text x="{s4_x+10}" y="{s4_y+124}" class="card-body">• Output vector số thực đa chiều:</text>')
    
    # Vector bar graphic
    lines.append(f'    <rect x="{s4_x+10}" y="{s4_y+134}" width="{s4_w-20}" height="24" rx="4" fill="url(#vectorGrad)"/>')
    lines.append(f'    <text x="{s4_x+s4_w/2}" y="{s4_y+150}" font-family="ui-monospace, monospace" font-size="10.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">[0.0142, -0.0381, ..., 0.0891]</text>')

    lines.append('  </g>')

    # Routing Arrow from Lane 1 Embedding down into Central Vector Store in Lane 2
    emb_cx = s4_x + s4_w / 2
    # vs_x will be defined below, let's calculate vs_cx:
    # ret_x + ret_w + 55, vs_w = 300 -> vs_cx = 1010 + 55 + 150 = 1215
    lines.append('  <!-- ==================== Drop Trunk to Vector Store ==================== -->')
    lines.append(f'    <path d="M {emb_cx} {s4_y+s4_h} L {emb_cx} 355 L 1215 355 L 1215 425" class="flow-arrow"/>')
    lines.append(arrow_head(1215, 430, "down", 11))
    lines.append(f'    <rect x="{emb_cx-90}" y="343" width="180" height="22" rx="4" fill="#0F172A"/>')
    lines.append(f'    <text x="{emb_cx}" y="358" class="badge-txt" fill="#38BDF8">NẠP TẬP VECTOR ĐA CHIỀU</text>')

    # =========================================================================
    # LANE 2: VECTOR REPOSITORY & ONLINE RETRIEVAL (Y: 385 - 635)
    # =========================================================================
    lane2_y, lane2_h = 385, 250
    lines.append('  <!-- ==================== LANE 2: VECTOR REPOSITORY & RETRIEVAL ==================== -->')
    lines.append('  <g id="Lane_2_Runtime_Retrieval">')
    # Lane Container
    lines.append(f'    <rect x="50" y="{lane2_y}" width="{width-100}" height="{lane2_h}" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.8" filter="url(#cardShadow)"/>')
    # Lane Header Bar
    lines.append(f'    <rect x="50" y="{lane2_y}" width="{width-100}" height="32" rx="10" fill="#0F172A"/>')
    lines.append(f'    <text x="70" y="{lane2_y+21}" class="lane-hdr">PHÂN TẦNG 2: KHO LƯU TRỮ VECTOR &amp; BỘ MÁY TRUY HỒI ĐỒNG THỜI (ONLINE RETRIEVAL RUNTIME)</text>')
    lines.append(f'    <rect x="{width-230}" y="{lane2_y+6}" width="165" height="20" rx="4" fill="#1E293B"/>')
    lines.append(f'    <text x="{width-147}" y="{lane2_y+20}" class="badge-txt" fill="#38BDF8">ONLINE SUB-50MS QUERY</text>')

    # Station 2.1 (Far Left): Merchant Query Touchpoint (ChatWidget.tsx)
    q_x, q_y, q_w, q_h = 75, lane2_y + 46, 280, 185
    lines.append(f'    <!-- Station 2.1: Query Touchpoint -->')
    lines.append(f'    <rect x="{q_x}" y="{q_y}" width="{q_w}" height="{q_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.6"/>')
    lines.append(f'    <rect x="{q_x+10}" y="{q_y+10}" width="125" height="20" rx="4" fill="#EFF6FF"/>')
    lines.append(f'    <text x="{q_x+72}" y="{q_y+24}" class="badge-txt" fill="#1D4ED8">USER TOUCHPOINT</text>')
    lines.append(f'    <text x="{q_x+10}" y="{q_y+48}" class="card-title">5. Merchant Query</text>')
    lines.append(f'    <text x="{q_x+10}" y="{q_y+66}" class="card-tech">ChatWidget.tsx (Khách hỏi)</text>')
    lines.append(f'    <text x="{q_x+10}" y="{q_y+88}" class="card-body">Câu hỏi thực tế từ Chủ shop/Khách:</text>')
    
    # User Chat Bubble
    lines.append(f'    <rect x="{q_x+10}" y="{q_y+96}" width="{q_w-20}" height="50" rx="6" fill="#0284C7"/>')
    lines.append(f'    <text x="{q_x+18}" y="{q_y+115}" font-size="11" font-weight="700" fill="#FFFFFF">"Hàng bị bể vỡ do bưu tá giao</text>')
    lines.append(f'    <text x="{q_x+18}" y="{q_y+133}" font-size="11" font-weight="700" fill="#FFFFFF">thì xử lý khiếu nại thế nào?"</text>')

    lines.append(f'    <text x="{q_x+10}" y="{q_y+164}" font-size="10.5" font-weight="600" fill="#64748B">• Metadata Context: Role=MERCHANT</text>')

    # Arrow 2.1 -> 2.2
    lines.append(f'    <line x1="{q_x+q_w}" y1="{q_y+q_h/2}" x2="{q_x+q_w+30}" y2="{q_y+q_h/2}" class="flow-arrow"/>')
    lines.append(arrow_head(q_x+q_w+30, q_y+q_h/2, "right", 10))

    # Station 2.2: Query Vectorizer
    qv_x, qv_y, qv_w, qv_h = q_x + q_w + 30, lane2_y + 46, 250, 185
    lines.append(f'    <!-- Station 2.2: Query Vectorizer -->')
    lines.append(f'    <rect x="{qv_x}" y="{qv_y}" width="{qv_w}" height="{qv_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.6"/>')
    lines.append(f'    <rect x="{qv_x+10}" y="{qv_y+10}" width="125" height="20" rx="4" fill="#F3E8FF"/>')
    lines.append(f'    <text x="{qv_x+72}" y="{qv_y+24}" class="badge-txt" fill="#7E22CE">QUERY EMBEDDER</text>')
    lines.append(f'    <text x="{qv_x+10}" y="{qv_y+48}" class="card-title">6. Query Vectorizer</text>')
    lines.append(f'    <text x="{qv_x+10}" y="{qv_y+66}" class="card-tech">text-embedding-3-small</text>')
    lines.append(f'    <text x="{qv_x+10}" y="{qv_y+88}" class="card-body">• Mã hóa câu hỏi thành Vector</text>')
    lines.append(f'    <text x="{qv_x+10}" y="{qv_y+106}" class="card-body">• Vector truy vấn q ∈ ℝ¹⁵³⁶</text>')
    lines.append(f'    <text x="{qv_x+10}" y="{qv_y+124}" class="card-body">• Giữ nguyên ngữ nghĩa bưu chính</text>')
    
    lines.append(f'    <rect x="{qv_x+10}" y="{qv_y+138}" width="{qv_w-20}" height="32" rx="4" fill="#FFFFFF" stroke="#C084FC" stroke-width="1.2"/>')
    lines.append(f'    <text x="{qv_x+qv_w/2}" y="{qv_y+158}" font-family="ui-monospace, monospace" font-size="10" font-weight="700" fill="#7E22CE" text-anchor="middle">q = Embed("Hàng bị bể vỡ...")</text>')

    # Arrow 2.2 -> 2.3
    lines.append(f'    <line x1="{qv_x+qv_w}" y1="{qv_y+qv_h/2}" x2="{qv_x+qv_w+30}" y2="{qv_y+qv_h/2}" class="flow-arrow"/>')
    lines.append(arrow_head(qv_x+qv_w+30, qv_y+qv_h/2, "right", 10))

    # Station 2.3: Grounded Retriever (scripts/rag/retriever.ts)
    ret_x, ret_y, ret_w, ret_h = qv_x + qv_w + 30, lane2_y + 46, 310, 185
    lines.append(f'    <!-- Station 2.3: Retriever -->')
    lines.append(f'    <rect x="{ret_x}" y="{ret_y}" width="{ret_w}" height="{ret_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.6"/>')
    lines.append(f'    <rect x="{ret_x+10}" y="{ret_y+10}" width="125" height="20" rx="4" fill="#FEF3C7"/>')
    lines.append(f'    <text x="{ret_x+72}" y="{ret_y+24}" class="badge-txt" fill="#B45309">RETRIEVER ENGINE</text>')
    lines.append(f'    <text x="{ret_x+10}" y="{ret_y+48}" class="card-title">7. Grounded Retriever</text>')
    lines.append(f'    <text x="{ret_x+10}" y="{ret_y+66}" class="card-tech">scripts/rag/retriever.ts</text>')
    lines.append(f'    <text x="{ret_x+10}" y="{ret_y+88}" class="card-body">• Thuật toán: Cosine Similarity</text>')
    lines.append(f'    <text x="{ret_x+10}" y="{ret_y+106}" class="card-body">• Tham số hệ thống: k = 3 chunks</text>')
    lines.append(f'    <text x="{ret_x+10}" y="{ret_y+124}" class="card-body">• Ngưỡng lọc điểm: minScore = 0.20</text>')
    lines.append(f'    <text x="{ret_x+10}" y="{ret_y+142}" class="card-body">• Lọc Domain: CLAIM_COMPENSATION</text>')
    
    lines.append(f'    <rect x="{ret_x+10}" y="{ret_y+152}" width="{ret_w-20}" height="24" rx="4" fill="#FFFFFF" stroke="#F59E0B" stroke-width="1.2"/>')
    lines.append(f'    <text x="{ret_x+ret_w/2}" y="{ret_y+168}" font-family="ui-monospace, monospace" font-size="10.5" font-weight="800" fill="#B45309" text-anchor="middle">CosineSim(q, v) = (q · v)/(||q|| ||v||)</text>')

    # Bi-directional Arrow between Retriever and Vector Store
    # ret_x + ret_w = 975, vs_x = 1045. Gap is 70px!
    gap_mid_x = (ret_x + ret_w + ret_x + ret_w + 65) / 2
    lines.append('    <!-- Bi-directional Query/Result Flow -->')
    lines.append(f'    <line x1="{ret_x+ret_w}" y1="{ret_y+65}" x2="{ret_x+ret_w+60}" y2="{ret_y+65}" class="flow-arrow"/>')
    lines.append(arrow_head(ret_x+ret_w+60, ret_y+65, "right", 9))
    lines.append(f'    <text x="{gap_mid_x}" y="{ret_y+56}" font-family="ui-monospace, monospace" font-size="9" font-weight="700" fill="#2563EB" text-anchor="middle">q-vector</text>')

    lines.append(f'    <line x1="{ret_x+ret_w+60}" y1="{ret_y+115}" x2="{ret_x+ret_w}" y2="{ret_y+115}" class="flow-arrow-blue"/>')
    lines.append(arrow_head(ret_x+ret_w, ret_y+115, "left", 9, "arrowhead-blue"))
    lines.append(f'    <text x="{gap_mid_x}" y="{ret_y+130}" font-family="ui-monospace, monospace" font-size="9" font-weight="700" fill="#0284C7" text-anchor="middle">Top-k Hits</text>')

    # Station 2.4 (Far Right): Central Logistics Vector Store
    vs_x, vs_y, vs_w, vs_h = ret_x + ret_w + 65, lane2_y + 46, 300, 185
    lines.append(f'    <!-- Station 2.4: Vector Store -->')
    lines.append(f'    <rect x="{vs_x}" y="{vs_y}" width="{vs_w}" height="{vs_h}" rx="8" fill="#F8FAFC" stroke="#0F172A" stroke-width="2.0"/>')
    lines.append(f'    <rect x="{vs_x+10}" y="{vs_y+10}" width="145" height="20" rx="4" fill="#0F172A"/>')
    lines.append(f'    <text x="{vs_x+82}" y="{vs_y+24}" class="badge-txt" fill="#38BDF8">LOGISTICS VECTOR STORE</text>')
    lines.append(f'    <text x="{vs_x+10}" y="{vs_y+48}" class="card-title">8. Vector Repository</text>')
    lines.append(f'    <text x="{vs_x+10}" y="{vs_y+66}" class="card-tech">vector-index.json / pgvector</text>')
    lines.append(f'    <text x="{vs_x+10}" y="{vs_y+88}" class="card-body">• Inverted In-Memory Store (Dev/Eval)</text>')
    lines.append(f'    <text x="{vs_x+10}" y="{vs_y+106}" class="card-body">• PostgreSQL + pgvector (Production)</text>')
    lines.append(f'    <text x="{vs_x+10}" y="{vs_y+124}" class="card-body">• Chỉ mục không gian: HNSW / Cosine</text>')
    
    # Store records badge
    lines.append(f'    <rect x="{vs_x+10}" y="{vs_y+138}" width="{vs_w-20}" height="34" rx="4" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.2"/>')
    lines.append(f'    <text x="{vs_x+18}" y="{vs_y+153}" font-family="ui-monospace, monospace" font-size="10" font-weight="700" fill="#0F172A">Tuple: (vector: 1536-D, text,</text>')
    lines.append(f'    <text x="{vs_x+18}" y="{vs_y+167}" font-family="ui-monospace, monospace" font-size="10" font-weight="700" fill="#2563EB">metadata: {{source, category, sla}})</text>')

    lines.append('  </g>')

    # Routing from Retriever down into Lane 3 (Grounded In-Context Generation)
    # Retriever center is ret_x + ret_w/2 = 665 + 155 = 820
    # rc target center is rc_x + rc_w/2 = 75 + 210 = 285
    lines.append('  <!-- ==================== Drop Trunk to Lane 3 ==================== -->')
    lines.append(f'    <path d="M {ret_x+ret_w/2} {ret_y+ret_h} L {ret_x+ret_w/2} 652 L 285 652 L 285 715" class="flow-arrow-blue"/>')
    lines.append(arrow_head(285, 720, "down", 11, "arrowhead-blue"))
    lines.append('    <rect x="440" y="640" width="220" height="24" rx="4" fill="#0284C7"/>')
    lines.append('    <text x="550" y="656" class="badge-txt" fill="#FFFFFF">TRÍCH XUẤT TOP-1 RELEVANT CHUNK</text>')

    # =========================================================================
    # LANE 3: GROUNDED GENERATION & RICH LOGISTICS RESPONSE (Y: 675 - 885)
    # =========================================================================
    lane3_y, lane3_h = 675, 205
    lines.append('  <!-- ==================== LANE 3: GROUNDED GENERATION ==================== -->')
    lines.append('  <g id="Lane_3_Grounded_Generation">')
    # Lane Container
    lines.append(f'    <rect x="50" y="{lane3_y}" width="{width-100}" height="{lane3_h}" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.8" filter="url(#cardShadow)"/>')
    # Lane Header Bar
    lines.append(f'    <rect x="50" y="{lane3_y}" width="{width-100}" height="32" rx="10" fill="#0F172A"/>')
    lines.append(f'    <text x="70" y="{lane3_y+21}" class="lane-hdr">PHÂN TẦNG 3: TRÍCH XUẤT CHUẨN XÁC &amp; TỔNG HỢP CÂU TRẢ LỜI CÓ CĂN CỨ PHÁP LÝ (GROUNDED GENERATION)</text>')
    lines.append(f'    <rect x="{width-230}" y="{lane3_y+6}" width="165" height="20" rx="4" fill="#1E293B"/>')
    lines.append(f'    <text x="{width-147}" y="{lane3_y+20}" class="badge-txt" fill="#38BDF8">ANTI-HALLUCINATION</text>')

    # Station 3.1: Most Relevant Chunk Card
    rc_x, rc_y, rc_w, rc_h = 75, lane3_y + 44, 420, 145
    lines.append(f'    <!-- Station 3.1: Relevant Chunk -->')
    lines.append(f'    <rect x="{rc_x}" y="{rc_y}" width="{rc_w}" height="{rc_h}" rx="8" fill="#FFFFFF" stroke="#059669" stroke-width="2.0"/>')
    lines.append(f'    <rect x="{rc_x}" y="{rc_y}" width="{rc_w}" height="28" rx="6" fill="#059669"/>')
    lines.append(f'    <text x="{rc_x+12}" y="{rc_y+19}" font-size="12" font-weight="900" fill="#FFFFFF">TOP-1 RELEVANT CHUNK</text>')
    lines.append(f'    <rect x="{rc_x+rc_w-105}" y="{rc_y+5}" width="95" height="18" rx="3" fill="#047857"/>')
    lines.append(f'    <text x="{rc_x+rc_w-57}" y="{rc_y+17}" class="badge-txt" fill="#FFFFFF">SCORE: 0.88</text>')

    lines.append(f'    <text x="{rc_x+12}" y="{rc_y+46}" font-size="12" font-weight="800" fill="#0F172A">Điều 4.2: Quy chế bồi thường bưu gửi hư hỏng bể vỡ</text>')
    lines.append(f'    <text x="{rc_x+12}" y="{rc_y+65}" class="card-body">"Khi phát hiện bưu phẩm/bưu kiện bị bể vỡ trong quá trình vận chuyển,</text>')
    lines.append(f'    <text x="{rc_x+12}" y="{rc_y+83}" class="card-body">bưu cục phát lập Biên bản bất thường (BBBT) trong vòng 24 giờ."</text>')
    lines.append(f'    <text x="{rc_x+12}" y="{rc_y+103}" class="card-highlight">• Mức đền bù: 100% giá trị khai giá | Ngưỡng duyệt tự động: 2 Triệu VNĐ</text>')
    lines.append(f'    <text x="{rc_x+12}" y="{rc_y+123}" font-family="ui-monospace, monospace" font-size="10.5" font-weight="700" fill="#2563EB">Nguồn trích dẫn: 02-claim-policy.md (Chunk ID: #CLM-02-P1)</text>')

    # Arrow 3.1 -> 3.2
    lines.append(f'    <line x1="{rc_x+rc_w}" y1="{rc_y+rc_h/2}" x2="{rc_x+rc_w+35}" y2="{rc_y+rc_h/2}" class="flow-arrow"/>')
    lines.append(arrow_head(rc_x+rc_w+35, rc_y+rc_h/2, "right", 10))

    # Station 3.2: In-Context LLM Generator
    llm_x, llm_y, llm_w, llm_h = rc_x + rc_w + 35, lane3_y + 44, 340, 145
    lines.append(f'    <!-- Station 3.2: In-Context Generator -->')
    lines.append(f'    <rect x="{llm_x}" y="{llm_y}" width="{llm_w}" height="{llm_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.6"/>')
    lines.append(f'    <rect x="{llm_x+10}" y="{llm_y+10}" width="140" height="20" rx="4" fill="#F3E8FF"/>')
    lines.append(f'    <text x="{llm_x+80}" y="{llm_y+24}" class="badge-txt" fill="#7E22CE">IN-CONTEXT GENERATOR</text>')
    lines.append(f'    <text x="{llm_x+10}" y="{llm_y+48}" class="card-title">10. LLM Response Composer</text>')
    lines.append(f'    <text x="{llm_x+10}" y="{llm_y+66}" class="card-tech">gpt-4o-mini (temperature = 0.2)</text>')
    lines.append(f'    <text x="{llm_x+10}" y="{llm_y+88}" class="card-body">• Ghép Top-3 Context vào System Prompt</text>')
    lines.append(f'    <text x="{llm_x+10}" y="{llm_y+106}" class="card-body">• Anti-hallucination: Buộc trích dẫn điều khoản</text>')
    lines.append(f'    <text x="{llm_x+10}" y="{llm_y+124}" class="card-body">• Nhận diện mã AWB và sinh nút Action</text>')

    # Arrow 3.2 -> 3.3
    lines.append(f'    <line x1="{llm_x+llm_w}" y1="{llm_y+llm_h/2}" x2="{llm_x+llm_w+35}" y2="{llm_y+llm_h/2}" class="flow-arrow"/>')
    lines.append(arrow_head(llm_x+llm_w+35, llm_y+llm_h/2, "right", 10))

    # Station 3.3: Final Grounded Logistics Response Card
    res_x, res_y, res_w, res_h = llm_x + llm_w + 35, lane3_y + 44, 430, 145
    lines.append(f'    <!-- Station 3.3: Grounded Response -->')
    lines.append(f'    <rect x="{res_x}" y="{res_y}" width="{res_w}" height="{res_h}" rx="8" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.0"/>')
    lines.append(f'    <rect x="{res_x}" y="{res_y}" width="{res_w}" height="28" rx="6" fill="#0284C7"/>')
    lines.append(f'    <text x="{res_x+12}" y="{res_y+19}" font-size="12" font-weight="900" fill="#FFFFFF">PHẢN HỒI GỬI SHOP (GROUNDED RESPONSE)</text>')
    lines.append(f'    <rect x="{res_x+res_w-95}" y="{res_y+5}" width="85" height="18" rx="3" fill="#0369A1"/>')
    lines.append(f'    <text x="{res_x+res_w-52}" y="{rc_y+17}" class="badge-txt" fill="#FFFFFF">VERIFIED</text>')

    lines.append(f'    <text x="{res_x+12}" y="{res_y+46}" font-size="11.5" font-weight="700" fill="#0F172A">"Theo Điều 4.2 Quy chế Bồi thường, đơn hàng bể vỡ được đền:</text>')
    lines.append(f'    <text x="{res_x+12}" y="{res_y+65}" class="card-highlight">• 100% Giá trị khai giá (Đối với đơn có đăng ký bảo hiểm hàng hóa)</text>')
    lines.append(f'    <text x="{res_x+12}" y="{res_y+83}" font-size="11" fill="#DC2626" font-weight="700">• Điều kiện bắt buộc: Bưu cục phát phải lập BBBT trong 24 giờ."</text>')
    
    # Action Button Pill
    lines.append(f'    <rect x="{res_x+12}" y="{res_y+98}" width="180" height="24" rx="4" fill="#059669"/>')
    lines.append(f'    <text x="{res_x+102}" y="{res_y+114}" class="badge-txt" fill="#FFFFFF">TẠO YÊU CẦU BỒI THƯỜNG</text>')

    lines.append(f'    <rect x="{res_x+202}" y="{res_y+98}" width="180" height="24" rx="4" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.0"/>')
    lines.append(f'    <text x="{res_x+292}" y="{res_y+114}" class="badge-txt" fill="#475569">XEM ĐIỀU KHOẢN SOP</text>')

    lines.append('  </g>')

    # =========================================================================
    # CAPTION (BOTTOM)
    # =========================================================================
    lines.append('  <!-- ==================== CAPTION ==================== -->')
    lines.append(f'  <text x="{width/2}" y="915" class="caption-txt">Hình 2.5: Tổng quan các thành phần cốt lõi và vận hành Phân hệ RAG trong Hệ thống Quản lý Bưu chính Nexus Logistics.</text>')
    lines.append(f'  <text x="{width/2}" y="938" font-size="12" font-weight="600" fill="#64748B" text-anchor="middle">Thiết kế đồng bộ theo mô hình kiến trúc AI chuyên sâu - Phục vụ Thuyết minh Khóa luận Tốt nghiệp Kỹ sư CNTT</text>')

    lines.append('</svg>')
    return "\n".join(lines)

if __name__ == "__main__":
    svg_content = generate_svg()

    # Strict XML Validation
    try:
        ET.fromstring(svg_content)
        print("✓ Strict XML validation passed.")
    except Exception as e:
        print(f"✗ XML validation failed: {e}")
        raise e

    # Target path: overwrite 05-logistics-core-components-pipeline.svg
    target_path = "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/05-logistics-core-components-pipeline.svg"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"✓ Generated successfully: {target_path} ({len(svg_content.encode('utf-8'))} bytes)")
