#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE RAG CORE COMPONENTS PIPELINE DIAGRAMS (THEORY & LOGISTICS REALITY)
===========================================================================
Bản vẽ Kỹ thuật Sư phạm Trực quan:
Mô phỏng kiến trúc "Hình 9: Tổng quan các thành phần chính của RAG" theo tài liệu AIO2025.

Sinh 2 phiên bản:
1. Phiên bản Giáo trình Chuẩn (05-rag-core-components-pipeline.svg):
   Mô phỏng 100% hình mẫu tham khảo (Document Loaders -> Document -> Splitter -> Chunks
   -> Embedding Model -> Vectors -> Vector Store -> Retriever (k=1) <- Query -> the most relevant chunk).
2. Phiên bản Ứng dụng Thực tế Hệ thống Nexus Logistics (05-logistics-core-components-pipeline.svg):
   Tích hợp trực tiếp các thành phần code và tham số thực tế:
   - Loaders: ingest.ts (MD, PDF, CSV)
   - Schema: page_content, sourceFile, sectionTitle
   - Splitter: chunker.ts (250w, overlap 40w)
   - Embedding Model: text-embedding-3-small (1536-D)
   - Vector Store: vector-index.json / pgvector
   - Retriever: k=3, Cosine Similarity (minScore=0.20)
   - Result: Điều 4.2 BBBT 24h (Score: 0.88)
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

def generate_core_components_svg(mode="standard"):
    width = 1140
    height = 760

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # STYLES DEFINITION
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }')
    lines.append('      .section-hdr { font-family: "Times New Roman", Times, serif; font-size: 26px; font-weight: 700; fill: #000000; text-anchor: start; }')
    lines.append('      .section-intro { font-family: "Times New Roman", Times, serif; font-size: 16.5px; fill: #1F2937; text-anchor: start; }')
    lines.append('      .comp-title { font-size: 18px; font-weight: 800; fill: #000000; text-anchor: middle; }')
    lines.append('      .comp-sub { font-family: "Times New Roman", Times, serif; font-size: 15.5px; font-weight: 600; fill: #000000; text-anchor: middle; }')
    lines.append('      .comp-tech { font-family: ui-monospace, Menlo, monospace; font-size: 11px; font-weight: 700; text-anchor: middle; }')
    lines.append('      .pill-txt { font-family: "Times New Roman", Times, serif; font-style: italic; font-size: 14.5px; font-weight: 600; fill: #000000; text-anchor: middle; }')
    lines.append('      .caption-txt { font-family: "Times New Roman", Times, serif; font-size: 20px; font-weight: 500; fill: #000000; text-anchor: middle; }')
    lines.append('      .flow-line { fill: none; stroke: #000000; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .arrowhead { fill: #000000; }')
    lines.append('    ]]></style>')

    # GRADIENTS FOR VECTOR EMBEDDINGS
    lines.append('    <linearGradient id="vecGrad1" x1="0%" y1="0%" x2="100%" y2="0%">')
    lines.append('      <stop offset="0%" stop-color="#0D9488"/>')
    lines.append('      <stop offset="100%" stop-color="#F43F5E"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="vecGrad2" x1="0%" y1="0%" x2="100%" y2="0%">')
    lines.append('      <stop offset="0%" stop-color="#F97316"/>')
    lines.append('      <stop offset="100%" stop-color="#22C55E"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="vecGrad3" x1="0%" y1="0%" x2="100%" y2="0%">')
    lines.append('      <stop offset="0%" stop-color="#E11D48"/>')
    lines.append('      <stop offset="100%" stop-color="#FBBF24"/>')
    lines.append('    </linearGradient>')
    lines.append('  </defs>')
    lines.append('')

    # BACKGROUND
    lines.append(f'  <rect width="{width}" height="{height}" fill="#FFFFFF"/>')

    # HELPER: Arrowhead
    def arrow_head(x, y, direction="right", size=11):
        if direction == "right":
            return f'  <polygon points="{x},{y} {x-size},{y-size*0.55} {x-size},{y+size*0.55}" class="arrowhead"/>'
        elif direction == "left":
            return f'  <polygon points="{x},{y} {x+size},{y-size*0.55} {x+size},{y+size*0.55}" class="arrowhead"/>'
        elif direction == "down":
            return f'  <polygon points="{x},{y} {x-size*0.55},{y-size} {x+size*0.55},{y-size}" class="arrowhead"/>'
        elif direction == "up":
            return f'  <polygon points="{x},{y} {x-size*0.55},{y+size} {x+size*0.55},{y+size}" class="arrowhead"/>'

    # =========================================================================
    # 1. TOP HEADER & INTRO TEXT
    # =========================================================================
    lines.append('  <!-- ==================== HEADER ==================== -->')
    lines.append('  <g id="Header_Section">')
    if mode == "standard":
        lines.append('    <text x="50" y="45" class="section-hdr">III.2.   Các thành phần cốt lõi</text>')
        lines.append('    <text x="50" y="76" class="section-intro">Để xây dựng một ứng dụng RAG với LangChain, ta cần phải hiểu về các thành phần chính như bên dưới:</text>')
    else:
        lines.append('    <text x="50" y="45" class="section-hdr">III.2.   Các thành phần cốt lõi trong Phân hệ RAG</text>')
        lines.append('    <text x="50" y="76" class="section-intro">Để xây dựng ứng dụng RAG cho Hệ thống Bưu chính Nexus, ta cần làm chủ các thành phần chính như bên dưới:</text>')
    lines.append('  </g>')

    # =========================================================================
    # 2. DOCUMENT LOADERS & INPUT ICONS (TOP-LEFT)
    # =========================================================================
    lines.append('  <!-- ==================== 1. DOCUMENT LOADERS ==================== -->')
    lines.append('  <g id="Document_Loaders_Group">')

    # 3 Miniature File Icons above Loader
    if mode == "standard":
        files_info = [
            {"x": 62, "ext": "XML", "color": "#38BDF8", "text_color": "#000000"},
            {"x": 104, "ext": "PDF", "color": "#EF4444", "text_color": "#FFFFFF"},
            {"x": 146, "ext": "TXT", "color": "#475569", "text_color": "#FFFFFF"}
        ]
    else:
        files_info = [
            {"x": 62, "ext": "MD", "color": "#0284C7", "text_color": "#FFFFFF"},
            {"x": 104, "ext": "PDF", "color": "#DC2626", "text_color": "#FFFFFF"},
            {"x": 146, "ext": "CSV", "color": "#16A34A", "text_color": "#FFFFFF"}
        ]

    file_y = 108
    fw, fh = 34, 42
    for fi in files_info:
        fx = fi["x"]
        lines.append(f'    <path d="M {fx} {file_y} L {fx+fw-8} {file_y} L {fx+fw} {file_y+8} L {fx+fw} {file_y+fh} L {fx} {file_y+fh} Z" fill="#E2E8F0" stroke="#000000" stroke-width="1.8" rx="2"/>')
        lines.append(f'    <path d="M {fx+fw-8} {file_y} L {fx+fw-8} {file_y+8} L {fx+fw} {file_y+8} Z" fill="#94A3B8"/>')
        lines.append(f'    <rect x="{fx+2}" y="{file_y+fh-15}" width="{fw-4}" height="13" rx="2" fill="{fi["color"]}"/>')
        lines.append(f'    <text x="{fx+fw/2}" y="{file_y+fh-4.5}" font-size="8.5" font-weight="900" fill="{fi["text_color"]}" text-anchor="middle">{fi["ext"]}</text>')

    # Curly bracket under files
    lines.append('    <path d="M 52 160 C 52 176, 121 168, 121 182 C 121 168, 190 176, 190 160" fill="none" stroke="#4B5563" stroke-width="1.8"/>')

    # Document Loaders Box
    ld_x, ld_y, ld_w, ld_h = 50, 192, 142, 68
    lines.append(f'    <rect x="{ld_x}" y="{ld_y}" width="{ld_w}" height="{ld_h}" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="2.6"/>')
    lines.append(f'    <text x="{ld_x+ld_w/2}" y="{ld_y+30}" class="comp-title">Document</text>')
    lines.append(f'    <text x="{ld_x+ld_w/2}" y="{ld_y+52}" class="comp-title">Loaders</text>')
    if mode == "logistics":
        lines.append(f'    <text x="{ld_x+ld_w/2}" y="{ld_y+65}" class="comp-tech" fill="#2563EB">ingest.ts</text>')
    lines.append('  </g>')

    # Arrow: Loaders -> Document
    lines.append('  <line x1="192" y1="226" x2="248" y2="226" class="flow-line"/>')
    lines.append(arrow_head(248, 226, "right", 11))

    # =========================================================================
    # 3. DOCUMENT WITH SCHEMA PILLS (TOP-CENTER-LEFT)
    # =========================================================================
    lines.append('  <!-- ==================== 2. DOCUMENT SCHEMA ==================== -->')
    lines.append('  <g id="Document_Group">')

    # Schema Pills above Document: page_content, id, metadata
    p1_x, p1_y, p1_w, p1_h = 242, 114, 136, 26
    lines.append(f'    <rect x="{p1_x}" y="{p1_y}" width="{p1_w}" height="{p1_h}" rx="13" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>')
    lines.append(f'    <text x="{p1_x+p1_w/2}" y="{p1_y+18}" class="pill-txt">page_content</text>')

    p2_x, p2_y, p2_w, p2_h = 242, 146, 48, 24
    lines.append(f'    <rect x="{p2_x}" y="{p2_y}" width="{p2_w}" height="{p2_h}" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>')
    lines.append(f'    <text x="{p2_x+p2_w/2}" y="{p2_y+17}" class="pill-txt">id</text>')

    p3_x, p3_y, p3_w, p3_h = 296, 146, 82, 24
    lines.append(f'    <rect x="{p3_x}" y="{p3_y}" width="{p3_w}" height="{p3_h}" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>')
    lines.append(f'    <text x="{p3_x+p3_w/2}" y="{p3_y+17}" class="pill-txt">metadata</text>')

    # Document Paper Icon
    doc_x, doc_y, doc_w, doc_h = 295, 185, 48, 62
    lines.append(f'    <path d="M {doc_x} {doc_y} L {doc_x+doc_w-14} {doc_y} L {doc_x+doc_w} {doc_y+14} L {doc_x+doc_w} {doc_y+doc_h} L {doc_x} {doc_y+doc_h} Z" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="2.0" rx="3"/>')
    lines.append(f'    <path d="M {doc_x+doc_w-14} {doc_y} L {doc_x+doc_w-14} {doc_y+14} L {doc_x+doc_w} {doc_y+14} Z" fill="#94A3B8"/>')
    lines.append(f'    <line x1="{doc_x+8}" y1="{doc_y+24}" x2="{doc_x+doc_w-8}" y2="{doc_y+24}" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append(f'    <line x1="{doc_x+8}" y1="{doc_y+34}" x2="{doc_x+doc_w-8}" y2="{doc_y+34}" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append(f'    <line x1="{doc_x+8}" y1="{doc_y+44}" x2="{doc_x+doc_w-14}" y2="{doc_y+44}" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>')

    # Label underneath Document
    lines.append(f'    <text x="{doc_x+doc_w/2}" y="{doc_y+doc_h+20}" font-size="16" font-weight="900" fill="#000000" text-anchor="middle">Document</text>')
    lines.append('  </g>')

    # Arrow: Document -> Splitter
    lines.append('  <line x1="360" y1="226" x2="425" y2="226" class="flow-line"/>')
    lines.append(arrow_head(425, 226, "right", 11))

    # =========================================================================
    # 4. SPLITTER (TOP-CENTER)
    # =========================================================================
    lines.append('  <!-- ==================== 3. SPLITTER ==================== -->')
    lines.append('  <g id="Splitter_Group">')
    sp_x, sp_y, sp_w, sp_h = 425, 192, 126, 68
    lines.append(f'    <rect x="{sp_x}" y="{sp_y}" width="{sp_w}" height="{sp_h}" rx="12" fill="#FFEDD5" stroke="#000000" stroke-width="2.6"/>')
    if mode == "standard":
        lines.append(f'    <text x="{sp_x+sp_w/2}" y="{sp_y+41}" class="comp-title">Splitter</text>')
    else:
        lines.append(f'    <text x="{sp_x+sp_w/2}" y="{sp_y+34}" class="comp-title">Splitter</text>')
        lines.append(f'    <text x="{sp_x+sp_w/2}" y="{sp_y+53}" class="comp-tech" fill="#C2410C">chunker.ts (250w)</text>')
    lines.append('  </g>')

    # Arrow: Splitter -> Chunks
    lines.append('  <line x1="551" y1="226" x2="620" y2="226" class="flow-line"/>')
    lines.append(arrow_head(620, 226, "right", 11))

    # =========================================================================
    # 5. CHUNKS (TOP-CENTER-RIGHT)
    # =========================================================================
    lines.append('  <!-- ==================== 4. CHUNKS ==================== -->')
    lines.append('  <g id="Chunks_Group">')
    lines.append('    <text x="668" y="166" font-size="20" font-weight="900" fill="#000000" text-anchor="middle">Chunks</text>')

    chk_w, chk_h = 76, 23
    chk_x = 630
    for idx, cy in enumerate([184, 214, 244]):
        lines.append(f'    <rect x="{chk_x}" y="{cy}" width="{chk_w}" height="{chk_h}" rx="3" fill="#E2E8F0" stroke="#000000" stroke-width="1.8"/>')
        lines.append(f'    <line x1="{chk_x+8}" y1="{cy+8}" x2="{chk_x+chk_w-8}" y2="{cy+8}" stroke="#94A3B8" stroke-width="2.2" stroke-linecap="round"/>')
        lines.append(f'    <line x1="{chk_x+8}" y1="{cy+15}" x2="{chk_x+chk_w-18}" y2="{cy+15}" stroke="#94A3B8" stroke-width="2.2" stroke-linecap="round"/>')
    lines.append('  </g>')

    # Arrow: Chunks -> Embedding Model (Diagonal Down-Right)
    lines.append('  <line x1="710" y1="236" x2="795" y2="310" class="flow-line"/>')
    lines.append(arrow_head(795, 310, "right", 11))

    # =========================================================================
    # 6. EMBEDDING MODEL (FAR-RIGHT)
    # =========================================================================
    lines.append('  <!-- ==================== 5. EMBEDDING MODEL ==================== -->')
    lines.append('  <g id="Embedding_Model_Group">')
    emb_x, emb_y, emb_w, emb_h = 795, 290, 168, 76
    lines.append(f'    <rect x="{emb_x}" y="{emb_y}" width="{emb_w}" height="{emb_h}" rx="14" fill="#F3E8FF" stroke="#000000" stroke-width="2.6"/>')
    if mode == "standard":
        lines.append(f'    <text x="{emb_x+emb_w/2}" y="{emb_y+34}" class="comp-title">Embedding</text>')
        lines.append(f'    <text x="{emb_x+emb_w/2}" y="{emb_y+56}" class="comp-title">Model</text>')
    else:
        lines.append(f'    <text x="{emb_x+emb_w/2}" y="{emb_y+30}" class="comp-title">Embedding</text>')
        lines.append(f'    <text x="{emb_x+emb_w/2}" y="{emb_y+49}" class="comp-title">Model</text>')
        lines.append(f'    <text x="{emb_x+emb_w/2}" y="{emb_y+66}" class="comp-tech" fill="#7E22CE">text-embedding-3-small</text>')
    lines.append('  </g>')

    # Arrow: Embedding Model -> Vectors (Diagonal Down-Left)
    lines.append('  <line x1="795" y1="366" x2="720" y2="445" class="flow-line"/>')
    lines.append(arrow_head(720, 445, "left", 11))

    # =========================================================================
    # 7. COLORFUL VECTORS (BOTTOM-CENTER-RIGHT)
    # =========================================================================
    lines.append('  <!-- ==================== 6. VECTOR EMBEDDINGS ==================== -->')
    lines.append('  <g id="Vectors_Group">')
    vec_w, vec_h = 78, 23
    vec_x = 636
    v_data = [
        {"y": 420, "grad": "url(#vecGrad1)"},
        {"y": 450, "grad": "url(#vecGrad2)"},
        {"y": 480, "grad": "url(#vecGrad3)"}
    ]
    for v in v_data:
        lines.append(f'    <rect x="{vec_x}" y="{v["y"]}" width="{vec_w}" height="{vec_h}" rx="2" fill="{v["grad"]}" stroke="#000000" stroke-width="1.8"/>')
    lines.append('  </g>')

    # Arrow: Vectors -> Vector Store
    lines.append('  <line x1="636" y1="462" x2="540" y2="462" class="flow-line"/>')
    lines.append(arrow_head(540, 462, "left", 11))

    # =========================================================================
    # 8. VECTOR STORE (BOTTOM-CENTER)
    # =========================================================================
    lines.append('  <!-- ==================== 7. VECTOR STORE ==================== -->')
    lines.append('  <g id="Vector_Store_Group">')
    vs_x, vs_y, vs_w, vs_h = 415, 395, 122, 136
    vs_ry = 18

    # 3D Cylinder Shape
    lines.append(f'    <path d="M {vs_x} {vs_y+vs_ry} L {vs_x} {vs_y+vs_h-vs_ry} A {vs_w/2} {vs_ry} 0 0 0 {vs_x+vs_w} {vs_y+vs_h-vs_ry} L {vs_x+vs_w} {vs_y+vs_ry} Z" fill="#DBEAFE" stroke="#000000" stroke-width="2.6"/>')
    lines.append(f'    <ellipse cx="{vs_x+vs_w/2}" cy="{vs_y+vs_ry}" rx="{vs_w/2}" ry="{vs_ry}" fill="#BFDBFE" stroke="#000000" stroke-width="2.6"/>')
    lines.append(f'    <ellipse cx="{vs_x+vs_w/2}" cy="{vs_y+vs_h-vs_ry}" rx="{vs_w/2}" ry="{vs_ry}" fill="none" stroke="#000000" stroke-width="2.6"/>')

    if mode == "standard":
        lines.append(f'    <text x="{vs_x+vs_w/2}" y="{vs_y+66}" class="comp-title">Vector</text>')
        lines.append(f'    <text x="{vs_x+vs_w/2}" y="{vs_y+90}" class="comp-title">Store</text>')
    else:
        lines.append(f'    <text x="{vs_x+vs_w/2}" y="{vs_y+58}" class="comp-title">Vector</text>')
        lines.append(f'    <text x="{vs_x+vs_w/2}" y="{vs_y+80}" class="comp-title">Store</text>')
        lines.append(f'    <text x="{vs_x+vs_w/2}" y="{vs_y+100}" class="comp-tech" fill="#1D4ED8">vector-index.json</text>')
    lines.append('  </g>')

    # Interaction lines between Vector Store and Retriever
    ret_x, ret_y, ret_w, ret_h = 205, 418, 132, 74
    lines.append('  <!-- Interactivity arrows between Vector Store & Retriever -->')
    lines.append(f'  <line x1="{vs_x}" y1="442" x2="{ret_x+ret_w}" y2="442" class="flow-line"/>')
    lines.append(arrow_head(ret_x+ret_w, 442, "left", 11))
    lines.append(f'  <line x1="{ret_x+ret_w}" y1="472" x2="{vs_x}" y2="472" class="flow-line"/>')
    lines.append(arrow_head(vs_x, 472, "right", 11))

    # =========================================================================
    # 9. RETRIEVER & QUERY (BOTTOM-LEFT)
    # =========================================================================
    lines.append('  <!-- ==================== 8. RETRIEVER & QUERY ==================== -->')
    lines.append('  <g id="Retriever_Group">')

    # Query Pink Pill above Retriever
    q_x, q_y, q_w, q_h = 220, 345, 102, 32
    lines.append(f'    <rect x="{q_x}" y="{q_y}" width="{q_w}" height="{q_h}" rx="16" fill="#FECDD3" stroke="#000000" stroke-width="2.2"/>')
    lines.append(f'    <text x="{q_x+q_w/2}" y="{q_y+21}" font-size="16" font-style="italic" font-weight="700" fill="#000000" text-anchor="middle">Query</text>')

    # Arrow: Query -> Retriever
    lines.append(f'    <line x1="{q_x+q_w/2}" y1="{q_y+q_h}" x2="{q_x+q_w/2}" y2="{ret_y}" class="flow-line"/>')
    lines.append(arrow_head(q_x+q_w/2, ret_y, "down", 11))

    # Retriever Box
    lines.append(f'    <rect x="{ret_x}" y="{ret_y}" width="{ret_w}" height="{ret_h}" rx="12" fill="#DCFCE7" stroke="#000000" stroke-width="2.6"/>')
    if mode == "standard":
        lines.append(f'    <text x="{ret_x+ret_w/2}" y="{ret_y+34}" class="comp-title">Retriever</text>')
        lines.append(f'    <text x="{ret_x+ret_w/2}" y="{ret_y+56}" class="comp-sub">(k=1)</text>')
    else:
        lines.append(f'    <text x="{ret_x+ret_w/2}" y="{ret_y+30}" class="comp-title">Retriever</text>')
        lines.append(f'    <text x="{ret_x+ret_w/2}" y="{ret_y+50}" class="comp-sub">(k = 3)</text>')
        lines.append(f'    <text x="{ret_x+ret_w/2}" y="{ret_y+66}" class="comp-tech" fill="#15803D">minScore=0.20</text>')
    lines.append('  </g>')

    # Arrow: Retriever -> The Most Relevant Chunk (pointing left)
    lines.append(f'  <line x1="{ret_x}" y1="455" x2="132" y2="455" class="flow-line"/>')
    lines.append(arrow_head(132, 455, "left", 11))

    # =========================================================================
    # 10. THE MOST RELEVANT CHUNK (FAR-BOTTOM-LEFT)
    # =========================================================================
    lines.append('  <!-- ==================== 9. RELEVANT CHUNK RESULT ==================== -->')
    lines.append('  <g id="Result_Chunk_Group">')
    if mode == "standard":
        lines.append('    <text x="86" y="380" font-family="Times New Roman, serif" font-style="italic" font-size="15.5" font-weight="700" fill="#000000" text-anchor="middle">the most</text>')
        lines.append('    <text x="86" y="402" font-family="Times New Roman, serif" font-style="italic" font-size="15.5" font-weight="700" fill="#000000" text-anchor="middle">relevant</text>')
        lines.append('    <text x="86" y="424" font-family="Times New Roman, serif" font-style="italic" font-size="15.5" font-weight="700" fill="#000000" text-anchor="middle">chunk</text>')

        res_x, res_y, res_w, res_h = 48, 439, 76, 32
        lines.append(f'    <rect x="{res_x}" y="{res_y}" width="{res_w}" height="{res_h}" rx="3" fill="#E2E8F0" stroke="#000000" stroke-width="1.8"/>')
        lines.append(f'    <line x1="{res_x+8}" y1="{res_y+10}" x2="{res_x+res_w-8}" y2="{res_y+10}" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>')
        lines.append(f'    <line x1="{res_x+8}" y1="{res_y+20}" x2="{res_x+res_w-22}" y2="{res_y+20}" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>')
    else:
        lines.append('    <text x="86" y="375" font-family="Times New Roman, serif" font-style="italic" font-size="15" font-weight="700" fill="#000000" text-anchor="middle">the most</text>')
        lines.append('    <text x="86" y="395" font-family="Times New Roman, serif" font-style="italic" font-size="15" font-weight="700" fill="#000000" text-anchor="middle">relevant</text>')
        lines.append('    <text x="86" y="415" font-family="Times New Roman, serif" font-style="italic" font-size="15" font-weight="700" fill="#000000" text-anchor="middle">chunk (Top-1)</text>')

        res_x, res_y, res_w, res_h = 42, 428, 88, 38
        lines.append(f'    <rect x="{res_x}" y="{res_y}" width="{res_w}" height="{res_h}" rx="3" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.8"/>')
        lines.append(f'    <text x="{res_x+res_w/2}" y="{res_y+16}" font-size="9.5" font-weight="800" fill="#15803D" text-anchor="middle">Điều 4.2 BBBT</text>')
        lines.append(f'    <text x="{res_x+res_w/2}" y="{res_y+30}" font-size="9" fill="#166534" text-anchor="middle">Đền bù 100%</text>')
        lines.append(f'    <text x="{res_x+res_w/2}" y="{res_y+res_h+16}" font-size="10.5" font-weight="800" fill="#15803D" text-anchor="middle">Score: 0.88</text>')
    lines.append('  </g>')

    # =========================================================================
    # 11. ACADEMIC CAPTION (BOTTOM)
    # =========================================================================
    lines.append('  <!-- ==================== CAPTION ==================== -->')
    if mode == "standard":
        lines.append(f'  <text x="{width/2}" y="670" class="caption-txt">Hình 9: Tổng quan các thành phần chính của RAG trong LangChain.</text>')
    else:
        lines.append(f'  <text x="{width/2}" y="670" class="caption-txt">Hình 2.5: Tổng quan các thành phần cốt lõi của Kiến trúc RAG trong Hệ thống Nexus Logistics.</text>')

    lines.append('</svg>')
    return "\n".join(lines)

if __name__ == "__main__":
    # 1. Standard Textbook Version (Replicating exact Hình 9)
    std_svg = generate_core_components_svg(mode="standard")
    ET.fromstring(std_svg)
    std_path = "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/05-rag-core-components-pipeline.svg"
    os.makedirs(os.path.dirname(std_path), exist_ok=True)
    with open(std_path, "w", encoding="utf-8") as f:
        f.write(std_svg)
    print(f"✓ Generated standard version: {std_path} ({len(std_svg.encode('utf-8'))} bytes)")

    # 2. Logistics Applied Version (Nexus Logistics specific)
    log_svg = generate_core_components_svg(mode="logistics")
    ET.fromstring(log_svg)
    log_path = "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/05-logistics-core-components-pipeline.svg"
    with open(log_path, "w", encoding="utf-8") as f:
        f.write(log_svg)
    print(f"✓ Generated logistics version: {log_path} ({len(log_svg.encode('utf-8'))} bytes)")
