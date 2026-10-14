#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE BESPOKE LOGISTICS RAG CORE ARCHITECTURE & RUNTIME PIPELINE (V2 - LARGE TEXT & STRICT PROJECT CONTEXT)
=============================================================================================================
Bản vẽ Kỹ thuật Sư phạm Chuyên biệt cho Hệ thống Bưu chính Nexus Logistics.
- Kích thước chữ to, đậm, rõ ràng (Title: 30-32px, Headers: 18-20px, Body: 15-16px, Code: 14-15px).
- Bám sát 100% mã nguồn thực tế:
  * @NEXUS/chatbot-service (Port 3013, NestJS)
  * services/chatbot-service/src/rag/chunker.service.ts (maxWordsPerChunk=250, overlapWords=40)
  * services/chatbot-service/src/rag/vector-store.service.ts
  * docs/knowledge-base/vector-index.json (3MB) & docs/knowledge-base/*.md
  * services/chatbot-service/src/chat/chat.service.ts (gpt-4o-mini, temp=0.2)
  * API Gateway BFF (Port 3000), Merchant Web Dashboard, Tracking-Service (Port 3008)
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
    width = 1720
    height = 1180

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # STYLES DEFINITION (LARGE HIGH-LEGIBILITY ENTERPRISE TYPOGRAPHY)
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }')
    lines.append('      .main-title { font-size: 30px; font-weight: 900; fill: #0F172A; text-anchor: middle; letter-spacing: -0.4px; }')
    lines.append('      .sub-title { font-family: ui-monospace, Menlo, monospace; font-size: 15.5px; font-weight: 700; fill: #0284C7; text-anchor: middle; }')
    lines.append('      .lane-hdr { font-family: ui-monospace, Menlo, monospace; font-size: 15px; font-weight: 800; fill: #FFFFFF; }')
    lines.append('      .card-title { font-size: 18.5px; font-weight: 800; fill: #0F172A; }')
    lines.append('      .card-tech { font-family: ui-monospace, Menlo, monospace; font-size: 13.5px; font-weight: 700; fill: #2563EB; }')
    lines.append('      .card-body { font-size: 14.5px; fill: #334155; line-height: 1.45; }')
    lines.append('      .card-highlight { font-size: 14.5px; font-weight: 700; fill: #059669; }')
    lines.append('      .badge-txt { font-family: ui-monospace, monospace; font-size: 12.5px; font-weight: 800; text-anchor: middle; }')
    lines.append('      .code-pill-txt { font-family: ui-monospace, Menlo, monospace; font-size: 13px; font-weight: 700; }')
    lines.append('      .flow-arrow { fill: none; stroke: #0F172A; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .flow-arrow-blue { fill: none; stroke: #0284C7; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .flow-arrow-green { fill: none; stroke: #059669; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .arrowhead { fill: #0F172A; }')
    lines.append('      .arrowhead-blue { fill: #0284C7; }')
    lines.append('      .arrowhead-green { fill: #059669; }')
    lines.append('      .caption-txt { font-family: "Times New Roman", Times, serif; font-size: 22px; font-weight: 600; fill: #0F172A; text-anchor: middle; }')
    lines.append('    ]]></style>')

    # Drop Shadows & Gradients
    lines.append('    <filter id="cardShadow" x="-3%" y="-3%" width="106%" height="108%" filterUnits="userSpaceOnUse">')
    lines.append('      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0F172A" flood-opacity="0.08"/>')
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
    def arrow_head(x, y, direction="right", size=12, fill_class="arrowhead"):
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
    lines.append(f'    <text x="{width/2}" y="42" class="main-title">KIẾN TRÚC CỐT LÕI &amp; VẬN HÀNH PHÂN HỆ AI RAG (@NEXUS/chatbot-service)</text>')
    lines.append(f'    <text x="{width/2}" y="70" class="sub-title">NEXUS LOGISTICS AGENTIC RAG SYSTEM: CORE COMPONENTS &amp; RUNTIME PIPELINE</text>')
    lines.append(f'    <line x1="60" y1="86" x2="{width-60}" y2="86" stroke="#CBD5E1" stroke-width="2.0"/>')
    lines.append('  </g>')

    # Margins and grid
    margin_x = 80
    content_w = width - margin_x * 2  # 1560

    # =========================================================================
    # LANE 1: OFFLINE INGESTION (Y: 104 - 404, Height: 300)
    # =========================================================================
    lane1_y, lane1_h = 104, 300
    lines.append('  <!-- ==================== LANE 1: OFFLINE INGESTION ==================== -->')
    lines.append('  <g id="Lane_1_Offline_Ingestion">')
    # Lane Container
    lines.append(f'    <rect x="{margin_x}" y="{lane1_y}" width="{content_w}" height="{lane1_h}" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.0" filter="url(#cardShadow)"/>')
    # Lane Header Bar
    lines.append(f'    <rect x="{margin_x}" y="{lane1_y}" width="{content_w}" height="38" rx="10" fill="#0F172A"/>')
    lines.append(f'    <text x="{margin_x+24}" y="{lane1_y+25}" class="lane-hdr">PHÂN TẦNG 1: TIỀN XỬ LÝ &amp; LẬP CHỈ MỤC TRI THỨC BƯU CHÍNH (OFFLINE INGESTION PIPELINE)</text>')
    lines.append(f'    <rect x="{margin_x+content_w-220}" y="{lane1_y+7}" width="200" height="24" rx="4" fill="#1E293B"/>')
    lines.append(f'    <text x="{margin_x+content_w-120}" y="{lane1_y+24}" class="badge-txt" fill="#38BDF8">OFFLINE BATCH INGEST</text>')

    # Station 1.1: Knowledge Sources Loader (docs/knowledge-base/*.md)
    s1_w, s1_h = 360, 235
    s1_x, s1_y = margin_x + 20, lane1_y + 48
    lines.append(f'    <!-- Station 1.1: Loaders -->')
    lines.append(f'    <rect x="{s1_x}" y="{s1_y}" width="{s1_w}" height="{s1_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.8"/>')
    lines.append(f'    <rect x="{s1_x+12}" y="{s1_y+12}" width="165" height="24" rx="4" fill="#EFF6FF"/>')
    lines.append(f'    <text x="{s1_x+94}" y="{s1_y+29}" class="badge-txt" fill="#1D4ED8">KNOWLEDGE REPOSITORY</text>')
    lines.append(f'    <text x="{s1_x+12}" y="{s1_y+62}" class="card-title">1. Document Loaders</text>')
    lines.append(f'    <text x="{s1_x+12}" y="{s1_y+84}" class="card-tech">docs/knowledge-base/*.md</text>')
    lines.append(f'    <text x="{s1_x+12}" y="{s1_y+110}" class="card-body">• Nạp 9 tệp SOP bưu chính chuẩn hóa</text>')
    lines.append(f'    <text x="{s1_x+12}" y="{s1_y+132}" class="card-body">• 02-insurance-and-claim-policy.md</text>')
    lines.append(f'    <text x="{s1_x+12}" y="{s1_y+154}" class="card-body">• 01-pricing-and-iata-weight.md</text>')
    lines.append(f'    <text x="{s1_x+12}" y="{s1_y+176}" class="card-body">• 03-prohibited-goods, 05-cod-finance</text>')
    lines.append(f'    <rect x="{s1_x+12}" y="{s1_y+188}" width="{s1_w-24}" height="32" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>')
    lines.append(f'    <text x="{s1_x+22}" y="{s1_y+209}" class="code-pill-txt" fill="#0F172A">Schema: {{ content, sourceFile, title }}</text>')

    # Arrow 1.1 -> 1.2
    arr1_x1 = s1_x + s1_w
    arr1_x2 = arr1_x1 + 35
    arr1_y = s1_y + s1_h / 2
    lines.append(f'    <line x1="{arr1_x1}" y1="{arr1_y}" x2="{arr1_x2}" y2="{arr1_y}" class="flow-arrow"/>')
    lines.append(arrow_head(arr1_x2, arr1_y, "right", 11))

    # Station 1.2: ChunkerService (chunker.service.ts)
    s2_w, s2_h = 365, 235
    s2_x, s2_y = arr1_x2, lane1_y + 48
    lines.append(f'    <!-- Station 1.2: Splitter -->')
    lines.append(f'    <rect x="{s2_x}" y="{s2_y}" width="{s2_w}" height="{s2_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.8"/>')
    lines.append(f'    <rect x="{s2_x+12}" y="{s2_y+12}" width="155" height="24" rx="4" fill="#FEF3C7"/>')
    lines.append(f'    <text x="{s2_x+89}" y="{s2_y+29}" class="badge-txt" fill="#B45309">CHUNKER SERVICE</text>')
    lines.append(f'    <text x="{s2_x+12}" y="{s2_y+62}" class="card-title">2. Text Splitter</text>')
    lines.append(f'    <text x="{s2_x+12}" y="{s2_y+84}" class="card-tech">services/.../chunker.service.ts</text>')
    lines.append(f'    <text x="{s2_x+12}" y="{s2_y+110}" class="card-body">• Regex Heading: /^(#{{1,4}})\\s+(.+)$/</text>')
    lines.append(f'    <text x="{s2_x+12}" y="{s2_y+132}" class="card-body">• maxWordsPerChunk: 250 từ (~325 tok)</text>')
    lines.append(f'    <text x="{s2_x+12}" y="{s2_y+154}" class="card-body">• overlapWords: 40 từ (~16% gối đầu)</text>')
    lines.append(f'    <text x="{s2_x+12}" y="{s2_y+176}" class="card-body">• tokenEstimate: Math.round(words * 1.3)</text>')
    lines.append(f'    <rect x="{s2_x+12}" y="{s2_y+188}" width="{s2_w-24}" height="32" rx="4" fill="#FFFFFF" stroke="#F59E0B" stroke-width="1.2"/>')
    lines.append(f'    <text x="{s2_x+22}" y="{s2_y+209}" class="code-pill-txt" fill="#B45309">id: ${{fileName}}#chunk-${{seq}}</text>')

    # Arrow 1.2 -> 1.3
    arr2_x1 = s2_x + s2_w
    arr2_x2 = arr2_x1 + 35
    lines.append(f'    <line x1="{arr2_x1}" y1="{arr1_y}" x2="{arr2_x2}" y2="{arr1_y}" class="flow-arrow"/>')
    lines.append(arrow_head(arr2_x2, arr1_y, "right", 11))

    # Station 1.3: Knowledge Chunks
    s3_w, s3_h = 365, 235
    s3_x, s3_y = arr2_x2, lane1_y + 48
    lines.append(f'    <!-- Station 1.3: Chunks -->')
    lines.append(f'    <rect x="{s3_x}" y="{s3_y}" width="{s3_w}" height="{s3_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.8"/>')
    lines.append(f'    <rect x="{s3_x+12}" y="{s3_y+12}" width="160" height="24" rx="4" fill="#ECFDF5"/>')
    lines.append(f'    <text x="{s3_x+92}" y="{s3_y+29}" class="badge-txt" fill="#047857">PARSED CHUNKS (142)</text>')
    lines.append(f'    <text x="{s3_x+12}" y="{s3_y+62}" class="card-title">3. Standard Chunks</text>')
    lines.append(f'    <text x="{s3_x+12}" y="{s3_y+84}" class="card-tech">Kho 142 đoạn tri thức bưu chính</text>')
    
    # 3 chunk pills
    lines.append(f'    <rect x="{s3_x+12}" y="{s3_y+98}" width="{s3_w-24}" height="36" rx="4" fill="#FFFFFF" stroke="#059669" stroke-width="1.5"/>')
    lines.append(f'    <text x="{s3_x+20}" y="{s3_y+120}" class="code-pill-txt" fill="#0F172A">#chunk-4: Điều 4.2 Lập BBBT 24h</text>')

    lines.append(f'    <rect x="{s3_x+12}" y="{s3_y+140}" width="{s3_w-24}" height="36" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>')
    lines.append(f'    <text x="{s3_x+20}" y="{s3_y+162}" class="code-pill-txt" fill="#475569">#chunk-2: Cước IATA (DxRxC)/6000</text>')

    lines.append(f'    <rect x="{s3_x+12}" y="{s3_y+182}" width="{s3_w-24}" height="36" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>')
    lines.append(f'    <text x="{s3_x+20}" y="{s3_y+204}" class="code-pill-txt" fill="#475569">#chunk-1: Pin Lithium &gt; 100Wh cấm bay</text>')

    # Arrow 1.3 -> 1.4
    arr3_x1 = s3_x + s3_w
    arr3_x2 = arr3_x1 + 35
    lines.append(f'    <line x1="{arr3_x1}" y1="{arr1_y}" x2="{arr3_x2}" y2="{arr1_y}" class="flow-arrow"/>')
    lines.append(arrow_head(arr3_x2, arr1_y, "right", 11))

    # Station 1.4: EmbeddingService (embedding.service.ts)
    s4_w, s4_h = 365, 235
    s4_x, s4_y = arr3_x2, lane1_y + 48
    lines.append(f'    <!-- Station 1.4: Embedding Model -->')
    lines.append(f'    <rect x="{s4_x}" y="{s4_y}" width="{s4_w}" height="{s4_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.8"/>')
    lines.append(f'    <rect x="{s4_x+12}" y="{s4_y+12}" width="165" height="24" rx="4" fill="#F3E8FF"/>')
    lines.append(f'    <text x="{s4_x+94}" y="{s4_y+29}" class="badge-txt" fill="#7E22CE">EMBEDDING SERVICE</text>')
    lines.append(f'    <text x="{s4_x+12}" y="{s4_y+62}" class="card-title">4. OpenAI Embedder</text>')
    lines.append(f'    <text x="{s4_x+12}" y="{s4_y+84}" class="card-tech">text-embedding-3-small</text>')
    lines.append(f'    <text x="{s4_x+12}" y="{s4_y+110}" class="card-body">• Chiều không gian vector: 1536-D</text>')
    lines.append(f'    <text x="{s4_x+12}" y="{s4_y+132}" class="card-body">• Chuẩn hóa vector: L2 Normalized (||v||=1)</text>')
    lines.append(f'    <text x="{s4_x+12}" y="{s4_y+154}" class="card-body">• Batch calling qua OpenAI REST API</text>')
    
    # Vector bar graphic
    lines.append(f'    <rect x="{s4_x+12}" y="{s4_y+175}" width="{s4_w-24}" height="42" rx="4" fill="url(#vectorGrad)"/>')
    lines.append(f'    <text x="{s4_x+s4_w/2}" y="{s4_y+201}" font-family="ui-monospace, monospace" font-size="13px" font-weight="900" fill="#FFFFFF" text-anchor="middle">[0.0142, -0.0381, ..., 0.0891]</text>')

    lines.append('  </g>')

    # Routing from Embedding to Vector Store in Lane 2
    emb_cx = s4_x + s4_w / 2  # 1532.5
    vs_cx = 1435  # center of Station 2.4
    lines.append('  <!-- ==================== Drop Trunk to Vector Store ==================== -->')
    lines.append(f'    <path d="M {emb_cx} {s4_y+s4_h} L {emb_cx} 420 L {vs_cx} 420 L {vs_cx} 480" class="flow-arrow"/>')
    lines.append(arrow_head(vs_cx, 485, "down", 13))
    lines.append(f'    <rect x="{emb_cx-130}" y="407" width="260" height="26" rx="4" fill="#0F172A"/>')
    lines.append(f'    <text x="{emb_cx}" y="424" class="badge-txt" fill="#38BDF8">NẠP TẬP VECTOR ĐA CHIỀU (1536-D)</text>')

    # =========================================================================
    # LANE 2: VECTOR STORE & ONLINE RETRIEVAL (Y: 440 - 750, Height: 310)
    # =========================================================================
    lane2_y, lane2_h = 440, 310
    lines.append('  <!-- ==================== LANE 2: VECTOR REPOSITORY & RETRIEVAL ==================== -->')
    lines.append('  <g id="Lane_2_Runtime_Retrieval">')
    # Lane Container
    lines.append(f'    <rect x="{margin_x}" y="{lane2_y}" width="{content_w}" height="{lane2_h}" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.0" filter="url(#cardShadow)"/>')
    # Lane Header Bar
    lines.append(f'    <rect x="{margin_x}" y="{lane2_y}" width="{content_w}" height="38" rx="10" fill="#0F172A"/>')
    lines.append(f'    <text x="{margin_x+24}" y="{lane2_y+25}" class="lane-hdr">PHÂN TẦNG 2: KHO LƯU TRỮ VECTOR &amp; BỘ MÁY TRUY HỒI ĐỒNG THỜI (ONLINE RETRIEVAL RUNTIME)</text>')
    lines.append(f'    <rect x="{margin_x+content_w-220}" y="{lane2_y+7}" width="200" height="24" rx="4" fill="#1E293B"/>')
    lines.append(f'    <text x="{margin_x+content_w-120}" y="{lane2_y+24}" class="badge-txt" fill="#38BDF8">ONLINE SUB-50MS QUERY</text>')

    # Station 2.1: Merchant Touchpoint (ChatWidget.tsx / Mobile)
    q_w, q_h = 350, 245
    q_x, q_y = margin_x + 20, lane2_y + 48
    lines.append(f'    <!-- Station 2.1: Query Touchpoint -->')
    lines.append(f'    <rect x="{q_x}" y="{q_y}" width="{q_w}" height="{q_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.8"/>')
    lines.append(f'    <rect x="{q_x+12}" y="{q_y+12}" width="160" height="24" rx="4" fill="#EFF6FF"/>')
    lines.append(f'    <text x="{q_x+92}" y="{q_y+29}" class="badge-txt" fill="#1D4ED8">USER TOUCHPOINT</text>')
    lines.append(f'    <text x="{q_x+12}" y="{q_y+62}" class="card-title">5. Merchant Touchpoint</text>')
    lines.append(f'    <text x="{q_x+12}" y="{q_y+84}" class="card-tech">Merchant Web (Port 3000 -&gt; 3013)</text>')
    lines.append(f'    <text x="{q_x+12}" y="{q_y+110}" class="card-body">Truy vấn thực tế từ Chủ shop / Khách:</text>')
    
    # User Chat Bubble
    lines.append(f'    <rect x="{q_x+12}" y="{q_y+120}" width="{q_w-24}" height="68" rx="8" fill="#0284C7"/>')
    lines.append(f'    <text x="{q_x+22}" y="{q_y+145}" font-size="14.5px" font-weight="700" fill="#FFFFFF">"Đơn NEX-88291 bị bể vỡ do</text>')
    lines.append(f'    <text x="{q_x+22}" y="{q_y+170}" font-size="14.5px" font-weight="700" fill="#FFFFFF">bưu tá giao thì xử lý thế nào?"</text>')

    lines.append(f'    <text x="{q_x+12}" y="{q_y+212}" font-size="13px" font-weight="700" fill="#64748B">• Role: MERCHANT | Mã đơn: NEX-88291</text>')
    lines.append(f'    <text x="{q_x+12}" y="{q_y+232}" font-size="13px" font-weight="700" fill="#64748B">• Endpoint: POST /api/v1/chat/message</text>')

    # Arrow 2.1 -> 2.2
    arr4_x1 = q_x + q_w
    arr4_x2 = arr4_x1 + 35
    arr4_y = q_y + q_h / 2
    lines.append(f'    <line x1="{arr4_x1}" y1="{arr4_y}" x2="{arr4_x2}" y2="{arr4_y}" class="flow-arrow"/>')
    lines.append(arrow_head(arr4_x2, arr4_y, "right", 11))

    # Station 2.2: Query Vectorizer & Router (chat.service.ts)
    qv_w, qv_h = 330, 245
    qv_x, qv_y = arr4_x2, lane2_y + 48
    lines.append(f'    <!-- Station 2.2: Query Vectorizer -->')
    lines.append(f'    <rect x="{qv_x}" y="{qv_y}" width="{qv_w}" height="{qv_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.8"/>')
    lines.append(f'    <rect x="{qv_x+12}" y="{qv_y+12}" width="165" height="24" rx="4" fill="#F3E8FF"/>')
    lines.append(f'    <text x="{qv_x+94}" y="{qv_y+29}" class="badge-txt" fill="#7E22CE">INTENT &amp; EMBEDDER</text>')
    lines.append(f'    <text x="{qv_x+12}" y="{qv_y+62}" class="card-title">6. Query Embedder</text>')
    lines.append(f'    <text x="{qv_x+12}" y="{qv_y+84}" class="card-tech">services/.../chat.service.ts</text>')
    lines.append(f'    <text x="{qv_x+12}" y="{qv_y+110}" class="card-body">• Phát hiện Intent: BỒI_THƯỜNG_SỰ_CỐ</text>')
    lines.append(f'    <text x="{qv_x+12}" y="{qv_y+132}" class="card-body">• Nhận diện mã AWB: NEX-88291</text>')
    lines.append(f'    <text x="{qv_x+12}" y="{qv_y+154}" class="card-body">• Sinh vector câu hỏi: q ∈ ℝ¹⁵³⁶</text>')
    
    lines.append(f'    <rect x="{qv_x+12}" y="{qv_y+172}" width="{qv_w-24}" height="42" rx="4" fill="#FFFFFF" stroke="#C084FC" stroke-width="1.5"/>')
    lines.append(f'    <text x="{qv_x+qv_w/2}" y="{qv_y+198}" font-family="ui-monospace, monospace" font-size="13px" font-weight="700" fill="#7E22CE" text-anchor="middle">q = Embed("Đơn NEX-88291...")</text>')

    # Arrow 2.2 -> 2.3
    arr5_x1 = qv_x + qv_w
    arr5_x2 = arr5_x1 + 35
    lines.append(f'    <line x1="{arr5_x1}" y1="{arr4_y}" x2="{arr5_x2}" y2="{arr4_y}" class="flow-arrow"/>')
    lines.append(arrow_head(arr5_x2, arr4_y, "right", 11))

    # Station 2.3: Grounded Retriever (VectorStoreService.search)
    ret_w, ret_h = 385, 245
    ret_x, ret_y = arr5_x2, lane2_y + 48
    lines.append(f'    <!-- Station 2.3: Retriever -->')
    lines.append(f'    <rect x="{ret_x}" y="{ret_y}" width="{ret_w}" height="{ret_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.8"/>')
    lines.append(f'    <rect x="{ret_x+12}" y="{ret_y+12}" width="165" height="24" rx="4" fill="#FEF3C7"/>')
    lines.append(f'    <text x="{ret_x+94}" y="{ret_y+29}" class="badge-txt" fill="#B45309">RETRIEVER ENGINE</text>')
    lines.append(f'    <text x="{ret_x+12}" y="{ret_y+62}" class="card-title">7. Grounded Retriever</text>')
    lines.append(f'    <text x="{ret_x+12}" y="{ret_y+84}" class="card-tech">VectorStoreService.search()</text>')
    lines.append(f'    <text x="{ret_x+12}" y="{ret_y+110}" class="card-body">• Thuật toán: Cosine Similarity Matching</text>')
    lines.append(f'    <text x="{ret_x+12}" y="{ret_y+132}" class="card-body">• Tham số hệ thống: k = 3, minScore = 0.20</text>')
    lines.append(f'    <text x="{ret_x+12}" y="{ret_y+154}" class="card-body">• Lọc Domain: 02-insurance-claim-policy</text>')
    
    lines.append(f'    <rect x="{ret_x+12}" y="{ret_y+172}" width="{ret_w-24}" height="42" rx="4" fill="#FFFFFF" stroke="#F59E0B" stroke-width="1.5"/>')
    lines.append(f'    <text x="{ret_x+ret_w/2}" y="{ret_y+198}" font-family="ui-monospace, monospace" font-size="14px" font-weight="900" fill="#B45309" text-anchor="middle">CosineSim(q, v) = (q · v) / (||q|| ||v||)</text>')

    # Bi-directional Bus between Retriever and Vector Store
    # ret_x + ret_w to vs_x (gap: 55px)
    bus_x1 = ret_x + ret_w
    bus_x2 = bus_x1 + 55
    bus_mid = (bus_x1 + bus_x2) / 2
    lines.append('    <!-- Bi-directional Query/Result Bus -->')
    lines.append(f'    <line x1="{bus_x1}" y1="{ret_y+80}" x2="{bus_x2}" y2="{ret_y+80}" class="flow-arrow"/>')
    lines.append(arrow_head(bus_x2, ret_y+80, "right", 10))
    lines.append(f'    <text x="{bus_mid}" y="{ret_y+70}" font-family="ui-monospace, monospace" font-size="12px" font-weight="800" fill="#2563EB" text-anchor="middle">q-vector</text>')

    lines.append(f'    <line x1="{bus_x2}" y1="{ret_y+150}" x2="{bus_x1}" y2="{ret_y+150}" class="flow-arrow-blue"/>')
    lines.append(arrow_head(bus_x1, ret_y+150, "left", 10, "arrowhead-blue"))
    lines.append(f'    <text x="{bus_mid}" y="{ret_y+170}" font-family="ui-monospace, monospace" font-size="12px" font-weight="800" fill="#0284C7" text-anchor="middle">Top-3 Hits</text>')

    # Station 2.4: Central Vector Store Service (vector-store.service.ts)
    vs_w, vs_h = 390, 245
    vs_x, vs_y = bus_x2, lane2_y + 48
    lines.append(f'    <!-- Station 2.4: Vector Store -->')
    lines.append(f'    <rect x="{vs_x}" y="{vs_y}" width="{vs_w}" height="{vs_h}" rx="8" fill="#F8FAFC" stroke="#0F172A" stroke-width="2.2"/>')
    lines.append(f'    <rect x="{vs_x+12}" y="{vs_y+12}" width="195" height="24" rx="4" fill="#0F172A"/>')
    lines.append(f'    <text x="{vs_x+109}" y="{vs_y+29}" class="badge-txt" fill="#38BDF8">VECTOR STORE SERVICE</text>')
    lines.append(f'    <text x="{vs_x+12}" y="{vs_y+62}" class="card-title">8. Vector Repository</text>')
    lines.append(f'    <text x="{vs_x+12}" y="{vs_y+84}" class="card-tech">docs/knowledge-base/vector-index.json</text>')
    lines.append(f'    <text x="{vs_x+12}" y="{vs_y+110}" class="card-body">• In-Memory Vector Store nạp khi start app (3MB)</text>')
    lines.append(f'    <text x="{vs_x+12}" y="{vs_y+132}" class="card-body">• Quản lý 142 Chunks bưu chính &amp; 1536-D Vectors</text>')
    lines.append(f'    <text x="{vs_x+12}" y="{vs_y+154}" class="card-body">• Sẵn sàng đồng bộ sang PostgreSQL pgvector</text>')
    
    # Store records badge
    lines.append(f'    <rect x="{vs_x+12}" y="{vs_y+172}" width="{vs_w-24}" height="46" rx="4" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.5"/>')
    lines.append(f'    <text x="{vs_x+20}" y="{vs_y+192}" font-family="ui-monospace, monospace" font-size="12.5px" font-weight="700" fill="#0F172A">Tuple: (vector: 1536-D, content,</text>')
    lines.append(f'    <text x="{vs_x+20}" y="{vs_y+210}" font-family="ui-monospace, monospace" font-size="12.5px" font-weight="700" fill="#2563EB">metadata: {{sourceFile, sectionTitle, tokens}})</text>')

    lines.append('  </g>')

    # Routing from Retriever down into Lane 3 (Grounded In-Context Generation)
    ret_cx = ret_x + ret_w / 2  # 1047.5
    rc_cx = margin_x + 20 + 245  # 345
    lines.append('  <!-- ==================== Drop Trunk to Lane 3 ==================== -->')
    lines.append(f'    <path d="M {ret_cx} {ret_y+ret_h} L {ret_cx} 765 L {rc_cx} 765 L {rc_cx} 825" class="flow-arrow-blue"/>')
    lines.append(arrow_head(rc_cx, 830, "down", 13, "arrowhead-blue"))
    lines.append(f'    <rect x="580" y="752" width="270" height="26" rx="4" fill="#0284C7"/>')
    lines.append(f'    <text x="715" y="769" class="badge-txt" fill="#FFFFFF">TRÍCH XUẤT TOP-1 RELEVANT CHUNK</text>')

    # =========================================================================
    # LANE 3: GROUNDED GENERATION (Y: 785 - 1055, Height: 270)
    # =========================================================================
    lane3_y, lane3_h = 785, 270
    lines.append('  <!-- ==================== LANE 3: GROUNDED GENERATION ==================== -->')
    lines.append('  <g id="Lane_3_Grounded_Generation">')
    # Lane Container
    lines.append(f'    <rect x="{margin_x}" y="{lane3_y}" width="{content_w}" height="{lane3_h}" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.0" filter="url(#cardShadow)"/>')
    # Lane Header Bar
    lines.append(f'    <rect x="{margin_x}" y="{lane3_y}" width="{content_w}" height="38" rx="10" fill="#0F172A"/>')
    lines.append(f'    <text x="{margin_x+24}" y="{lane3_y+25}" class="lane-hdr">PHÂN TẦNG 3: TRÍCH XUẤT CHUẨN XÁC &amp; TỔNG HỢP CÂU TRẢ LỜI CÓ CĂN CỨ PHÁP LÝ (GROUNDED GENERATION)</text>')
    lines.append(f'    <rect x="{margin_x+content_w-220}" y="{lane3_y+7}" width="200" height="24" rx="4" fill="#1E293B"/>')
    lines.append(f'    <text x="{margin_x+content_w-120}" y="{lane3_y+24}" class="badge-txt" fill="#38BDF8">ANTI-HALLUCINATION</text>')

    # Station 3.1: Most Relevant Chunk Card
    rc_w, rc_h = 490, 205
    rc_x, rc_y = margin_x + 20, lane3_y + 48
    lines.append(f'    <!-- Station 3.1: Relevant Chunk -->')
    lines.append(f'    <rect x="{rc_x}" y="{rc_y}" width="{rc_w}" height="{rc_h}" rx="8" fill="#FFFFFF" stroke="#059669" stroke-width="2.4"/>')
    lines.append(f'    <rect x="{rc_x}" y="{rc_y}" width="{rc_w}" height="34" rx="6" fill="#059669"/>')
    lines.append(f'    <text x="{rc_x+16}" y="{rc_y+23}" font-size="15px" font-weight="900" fill="#FFFFFF">TOP-1 RELEVANT CHUNK</text>')
    lines.append(f'    <rect x="{rc_x+rc_w-130}" y="{rc_y+5}" width="120" height="24" rx="4" fill="#047857"/>')
    lines.append(f'    <text x="{rc_x+rc_w-70}" y="{rc_y+21}" class="badge-txt" fill="#FFFFFF">SCORE: 0.88</text>')

    lines.append(f'    <text x="{rc_x+16}" y="{rc_y+62}" font-size="15px" font-weight="800" fill="#0F172A">Điều 4.2: Quy chế bồi thường bưu phẩm hư hỏng bể vỡ</text>')
    lines.append(f'    <text x="{rc_x+16}" y="{rc_y+86}" class="card-body">"Khi phát hiện bưu phẩm/bưu kiện bị bể vỡ trong quá trình vận chuyển,</text>')
    lines.append(f'    <text x="{rc_x+16}" y="{rc_y+108}" class="card-body">bưu cục phát lập Biên bản bất thường (BBBT) trong vòng 24 giờ."</text>')
    lines.append(f'    <text x="{rc_x+16}" y="{rc_y+134}" class="card-highlight">• Mức đền bù: 100% giá trị khai giá đối với đơn có bảo hiểm</text>')
    lines.append(f'    <text x="{rc_x+16}" y="{rc_y+156}" class="card-highlight">• Ngưỡng duyệt tự động hệ thống: Tối đa 2.000.000 VNĐ</text>')
    lines.append(f'    <rect x="{rc_x+16}" y="{rc_y+168}" width="{rc_w-32}" height="26" rx="4" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1.2"/>')
    lines.append(f'    <text x="{rc_x+24}" y="{rc_y+185}" class="code-pill-txt" fill="#15803D">Nguồn: 02-insurance-and-claim-policy.md#chunk-4</text>')

    # Arrow 3.1 -> 3.2
    arr6_x1 = rc_x + rc_w
    arr6_x2 = arr6_x1 + 45
    arr6_y = rc_y + rc_h / 2
    lines.append(f'    <line x1="{arr6_x1}" y1="{arr6_y}" x2="{arr6_x2}" y2="{arr6_y}" class="flow-arrow"/>')
    lines.append(arrow_head(arr6_x2, arr6_y, "right", 11))

    # Station 3.2: ChatService Composer (chat.service.ts)
    llm_w, llm_h = 440, 205
    llm_x, llm_y = arr6_x2, lane3_y + 48
    lines.append(f'    <!-- Station 3.2: In-Context Generator -->')
    lines.append(f'    <rect x="{llm_x}" y="{llm_y}" width="{llm_w}" height="{llm_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.8"/>')
    lines.append(f'    <rect x="{llm_x+12}" y="{llm_y+12}" width="180" height="24" rx="4" fill="#F3E8FF"/>')
    lines.append(f'    <text x="{llm_x+102}" y="{llm_y+29}" class="badge-txt" fill="#7E22CE">LLM RESPONSE COMPOSER</text>')
    lines.append(f'    <text x="{llm_x+12}" y="{llm_y+62}" class="card-title">10. Grounded Generator</text>')
    lines.append(f'    <text x="{llm_x+12}" y="{llm_y+84}" class="card-tech">services/.../chat.service.ts</text>')
    lines.append(f'    <text x="{llm_x+12}" y="{llm_y+110}" class="card-body">• Model: OpenAI gpt-4o-mini (temperature = 0.2)</text>')
    lines.append(f'    <text x="{llm_x+12}" y="{llm_y+132}" class="card-body">• Ghép Top-3 Chunks vào System Prompt bưu chính</text>')
    lines.append(f'    <text x="{llm_x+12}" y="{llm_y+154}" class="card-body">• Anti-hallucination: Buộc trích dẫn số hiệu điều khoản</text>')
    lines.append(f'    <text x="{llm_x+12}" y="{llm_y+176}" class="card-body">• Nhận diện mã NEX-88291 để sinh deep-link Action</text>')

    # Arrow 3.2 -> 3.3
    arr7_x1 = llm_x + llm_w
    arr7_x2 = arr7_x1 + 45
    lines.append(f'    <line x1="{arr7_x1}" y1="{arr6_y}" x2="{arr7_x2}" y2="{arr6_y}" class="flow-arrow"/>')
    lines.append(arrow_head(arr7_x2, arr6_y, "right", 11))

    # Station 3.3: Final Grounded Logistics Response Card
    res_w, res_h = 540, 205
    res_x, res_y = arr7_x2, lane3_y + 48
    lines.append(f'    <!-- Station 3.3: Grounded Response -->')
    lines.append(f'    <rect x="{res_x}" y="{res_y}" width="{res_w}" height="{res_h}" rx="8" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.4"/>')
    lines.append(f'    <rect x="{res_x}" y="{res_y}" width="{res_w}" height="34" rx="6" fill="#0284C7"/>')
    lines.append(f'    <text x="{res_x+16}" y="{res_y+23}" font-size="14.5px" font-weight="900" fill="#FFFFFF">PHẢN HỒI GỬI SHOP (GROUNDED RESPONSE)</text>')
    lines.append(f'    <rect x="{res_x+res_w-110}" y="{res_y+5}" width="100" height="24" rx="4" fill="#0369A1"/>')
    lines.append(f'    <text x="{res_x+res_w-60}" y="{res_y+21}" class="badge-txt" fill="#FFFFFF">VERIFIED</text>')

    lines.append(f'    <text x="{res_x+16}" y="{res_y+62}" font-size="14px" font-weight="700" fill="#0F172A">"Theo Điều 4.2 Quy chế Bồi thường, đơn hàng NEX-88291 được xử lý:</text>')
    lines.append(f'    <text x="{res_x+16}" y="{res_y+86}" class="card-highlight">• 100% Giá trị khai giá (Đối với đơn có đăng ký bảo hiểm)</text>')
    lines.append(f'    <text x="{res_x+16}" y="{res_y+108}" font-size="14px" fill="#DC2626" font-weight="700">• Điều kiện bắt buộc: Bưu cục phát phải lập BBBT trong vòng 24 giờ."</text>')
    lines.append(f'    <text x="{res_x+16}" y="{res_y+130}" font-size="13px" fill="#2563EB" font-weight="600">[Trích dẫn: 02-insurance-and-claim-policy.md - Điều 4.2]</text>')
    
    # Action Button Pills
    lines.append(f'    <rect x="{res_x+16}" y="{res_y+145}" width="240" height="34" rx="6" fill="#059669"/>')
    lines.append(f'    <text x="{res_x+136}" y="{res_y+167}" class="badge-txt" fill="#FFFFFF">TẠO YÊU CẦU BỒI THƯỜNG</text>')

    lines.append(f'    <rect x="{res_x+268}" y="{res_y+145}" width="220" height="34" rx="6" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.2"/>')
    lines.append(f'    <text x="{res_x+378}" y="{res_y+167}" class="badge-txt" fill="#334155">XEM BIÊN BẢN BBBT</text>')

    lines.append('  </g>')

    # =========================================================================
    # CAPTION (BOTTOM)
    # =========================================================================
    lines.append('  <!-- ==================== CAPTION ==================== -->')
    lines.append(f'  <text x="{width/2}" y="1120" class="caption-txt">Hình 2.5: Tổng quan các thành phần cốt lõi và vận hành Phân hệ AI RAG trong Hệ thống Quản trị Bưu chính Nexus Logistics.</text>')
    lines.append(f'  <text x="{width/2}" y="1148" font-size="14.5px" font-weight="600" fill="#64748B" text-anchor="middle">Thiết kế đồng bộ bám sát kiến trúc mã nguồn @NEXUS/chatbot-service - Phục vụ Thuyết minh Khóa luận Tốt nghiệp Kỹ sư CNTT</text>')

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
