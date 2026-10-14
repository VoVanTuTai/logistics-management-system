#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE TECHNICAL MONOCHROME/BLUEPRINT RAG ARCHITECTURE SVG
============================================================
Designed for:
1. True Engineering / Technical Publication Standard (Bản vẽ kỹ thuật, chuẩn đồ án tốt nghiệp)
2. 1:1 Theoretical Topology of Modern RAG (3 Giai đoạn: Indexing, Retrieval, Generation)
3. Full Nexus Logistics Real Integration (Chia 6000, Điều 4.2 BBBT 24h, In-Memory 1536-D, Thesaurus)
4. 100% Native Inline Vector Icons (Bespoke Logistics Icons, ZERO Emojis, Zero <marker> tags, Figma-safe)
5. Enlarge Typography & Generous Layout (Chữ to, đậm, rõ nét, không đè viền, không tràn khung)

Output:
  docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/03-rag-core-components-pipeline.svg
"""

import os
import html
import xml.etree.ElementTree as ET

def xml_esc(s):
    if s is None:
        return ""
    return html.escape(str(s), quote=True)

# =============================================================================
# BESPOKE NEXUS LOGISTICS SVG VECTOR ICONS (ZERO EMOJIS, 100% NATIVE VECTORS)
# =============================================================================

def icon_nexus_crest():
    """Nexus Logistics Master Brand Crest (Hexagonal supply chain chevron node)"""
    return '''<g class="icon-nexus-crest">
      <polygon points="22,2 41,13 41,33 22,44 3,33 3,13" fill="#F8FAFC" stroke="#0F172A" stroke-width="2.4"/>
      <polygon points="22,6 37,15 37,31 22,40 7,31 7,15" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.4"/>
      <path d="M 14 30 L 14 16 L 30 30 L 30 16" fill="none" stroke="#0F172A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="18,12 22,8 26,12" fill="none" stroke="#0284C7" stroke-width="2.4" stroke-linecap="round"/>
    </g>'''

def icon_policy_dossier():
    """Component 1: Logistics Policy & Dossier Document with Parcel Barcode"""
    return '''<g class="icon-dossier">
      <path d="M 1 5 L 8 5 L 10 8 L 22 8 A 2 2 0 0 1 24 10 L 24 22 A 2 2 0 0 1 22 24 L 3 24 A 2 2 0 0 1 1 22 Z" fill="#F1F5F9" stroke="#0F172A" stroke-width="1.6"/>
      <rect x="4" y="12" width="16" height="9" rx="1" fill="#FFFFFF" stroke="#64748B" stroke-width="0.9"/>
      <line x1="6.5" y1="14" x2="6.5" y2="19" stroke="#0F172A" stroke-width="1.2"/>
      <line x1="9.5" y1="14" x2="9.5" y2="19" stroke="#0F172A" stroke-width="2"/>
      <line x1="13" y1="14" x2="13" y2="19" stroke="#0F172A" stroke-width="1"/>
      <line x1="16" y1="14" x2="16" y2="19" stroke="#0F172A" stroke-width="1.7"/>
      <circle cx="18" cy="6" r="2.4" fill="#0284C7"/>
    </g>'''

def icon_ast_chunks():
    """Component 2: AST Markdown Slicing & Sliding Window Overlap Blocks"""
    return '''<g class="icon-chunks">
      <rect x="1" y="2" width="14" height="10" rx="1.5" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.5"/>
      <rect x="9" y="8" width="14" height="10" rx="1.5" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.5"/>
      <rect x="5" y="14" width="14" height="10" rx="1.5" fill="#F8FAFC" stroke="#64748B" stroke-width="1.5" stroke-dasharray="2,1"/>
      <line x1="11" y1="11" x2="21" y2="11" stroke="#0F172A" stroke-width="1.1"/>
      <line x1="11" y1="15" x2="18" y2="15" stroke="#0F172A" stroke-width="1.1"/>
    </g>'''

def icon_merchant_terminal():
    """Component 3: Logistics Merchant Terminal & Smart Consignor Scanner Console"""
    return '''<g class="icon-merchant">
      <rect x="1" y="2" width="24" height="21" rx="3" fill="#F0F9FF" stroke="#0284C7" stroke-width="1.6"/>
      <line x1="1" y1="8" x2="25" y2="8" stroke="#0284C7" stroke-width="1.1"/>
      <polygon points="13,10 18,13 13,16 8,13" fill="#BAE6FD" stroke="#0369A1" stroke-width="1"/>
      <polygon points="8,13 13,16 13,20.5 8,17.5" fill="#7DD3FC" stroke="#0369A1" stroke-width="1"/>
      <polygon points="18,13 13,16 13,20.5 18,17.5" fill="#38BDF8" stroke="#0369A1" stroke-width="1"/>
      <circle cx="5" cy="5" r="1.4" fill="#0284C7"/>
      <circle cx="10" cy="5" r="1.4" fill="#64748B"/>
    </g>'''

def icon_neural_embedding():
    """Component 4: Multi-Dimensional Neural Transformer & Tensor Lattice"""
    return '''<g class="icon-embedding">
      <polygon points="13,1 23,6.5 23,18.5 13,24 3,18.5 3,6.5" fill="#FAF5FF" stroke="#7C3AED" stroke-width="1.6"/>
      <line x1="13" y1="1" x2="13" y2="24" stroke="#7C3AED" stroke-width="1.1" stroke-dasharray="2,1"/>
      <line x1="3" y1="6.5" x2="23" y2="18.5" stroke="#7C3AED" stroke-width="1.1" stroke-dasharray="2,1"/>
      <line x1="3" y1="18.5" x2="23" y2="6.5" stroke="#7C3AED" stroke-width="1.1" stroke-dasharray="2,1"/>
      <circle cx="13" cy="12.5" r="3.2" fill="#7C3AED"/>
      <circle cx="13" cy="1" r="1.6" fill="#6D28D9"/>
      <circle cx="23" cy="6.5" r="1.6" fill="#6D28D9"/>
      <circle cx="23" cy="18.5" r="1.6" fill="#6D28D9"/>
      <circle cx="13" cy="24" r="1.6" fill="#6D28D9"/>
      <circle cx="3" cy="18.5" r="1.6" fill="#6D28D9"/>
      <circle cx="3" cy="6.5" r="1.6" fill="#6D28D9"/>
    </g>'''

def icon_vector_store():
    """Component 6: In-Memory Spatial Vector Database Bank & Platters"""
    return '''<g class="icon-vector-store">
      <ellipse cx="13" cy="6" rx="11" ry="4" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5"/>
      <path d="M 2 6 L 2 13 A 11 4 0 0 0 24 13 L 24 6" fill="none" stroke="#0284C7" stroke-width="1.5"/>
      <path d="M 2 13 L 2 20 A 11 4 0 0 0 24 20 L 24 13" fill="none" stroke="#0284C7" stroke-width="1.5"/>
      <circle cx="7.5" cy="13" r="1.5" fill="#0369A1"/>
      <circle cx="13" cy="14" r="1.8" fill="#0284C7"/>
      <circle cx="18.5" cy="12.5" r="1.5" fill="#0369A1"/>
    </g>'''

def icon_similarity_radar():
    """Component 7: Semantic Cosine Radar & Vector Angle Reticle"""
    return '''<g class="icon-similarity">
      <circle cx="13" cy="13" r="11" fill="#F0FDF4" stroke="#059669" stroke-width="1.6"/>
      <circle cx="13" cy="13" r="6" fill="none" stroke="#059669" stroke-width="1" stroke-dasharray="2,2"/>
      <line x1="13" y1="2" x2="13" y2="24" stroke="#059669" stroke-width="1"/>
      <line x1="2" y1="13" x2="24" y2="13" stroke="#059669" stroke-width="1"/>
      <line x1="13" y1="13" x2="21" y2="7" stroke="#7C3AED" stroke-width="2"/>
      <line x1="13" y1="13" x2="22" y2="13" stroke="#0284C7" stroke-width="2"/>
      <circle cx="13" cy="13" r="2.4" fill="#059669"/>
    </g>'''

def icon_topk_stack():
    """Component 8: Top-K Ranked Context Hierarchy & Priority Filter"""
    return '''<g class="icon-topk">
      <rect x="2" y="3" width="22" height="5" rx="1.3" fill="#F1F5F9" stroke="#64748B" stroke-width="1.3"/>
      <rect x="4" y="10" width="18" height="5" rx="1.3" fill="#E2E8F0" stroke="#475569" stroke-width="1.3"/>
      <rect x="6" y="17" width="14" height="5.5" rx="1.3" fill="#DCFCE7" stroke="#059669" stroke-width="1.5"/>
      <polygon points="20,1 25,1 25,8.5 22.5,6.5 20,8.5" fill="#059669"/>
    </g>'''

def icon_llm_core():
    """Component 9: Enterprise Generative AI Engine & Microprocessor Core"""
    return '''<g class="icon-llm">
      <rect x="3" y="3" width="20" height="20" rx="3.5" fill="#FAF5FF" stroke="#7C3AED" stroke-width="1.6"/>
      <rect x="7.5" y="7.5" width="11" height="11" rx="1.8" fill="#F5F3FF" stroke="#6D28D9" stroke-width="1.2"/>
      <line x1="8" y1="1" x2="8" y2="3" stroke="#7C3AED" stroke-width="1.4"/>
      <line x1="13" y1="1" x2="13" y2="3" stroke="#7C3AED" stroke-width="1.4"/>
      <line x1="18" y1="1" x2="18" y2="3" stroke="#7C3AED" stroke-width="1.4"/>
      <line x1="8" y1="23" x2="8" y2="25" stroke="#7C3AED" stroke-width="1.4"/>
      <line x1="13" y1="23" x2="13" y2="25" stroke="#7C3AED" stroke-width="1.4"/>
      <line x1="18" y1="23" x2="18" y2="25" stroke="#7C3AED" stroke-width="1.4"/>
      <line x1="1" y1="8" x2="3" y2="8" stroke="#7C3AED" stroke-width="1.4"/>
      <line x1="1" y1="13" x2="3" y2="13" stroke="#7C3AED" stroke-width="1.4"/>
      <line x1="1" y1="18" x2="3" y2="18" stroke="#7C3AED" stroke-width="1.4"/>
      <line x1="23" y1="8" x2="25" y2="8" stroke="#7C3AED" stroke-width="1.4"/>
      <line x1="23" y1="13" x2="25" y2="13" stroke="#7C3AED" stroke-width="1.4"/>
      <line x1="23" y1="18" x2="25" y2="18" stroke="#7C3AED" stroke-width="1.4"/>
      <path d="M 13 9 L 14.3 12.2 L 17.5 13 L 14.3 13.8 L 13 17 L 11.7 13.8 L 8.5 13 L 11.7 12.2 Z" fill="#7C3AED"/>
    </g>'''

def icon_resolution_seal():
    """Component 10: Official Logistics Resolution Certificate with Verification Seal"""
    return '''<g class="icon-resolution">
      <path d="M 3 2 L 17 2 L 23 8 L 23 23 A 1.8 1.8 0 0 1 21.2 24.8 L 4.8 24.8 A 1.8 1.8 0 0 1 3 23 Z" fill="#F0FDF4" stroke="#059669" stroke-width="1.6"/>
      <polyline points="16.5,2 16.5,8.5 23,8.5" fill="none" stroke="#059669" stroke-width="1.4"/>
      <line x1="6.5" y1="12" x2="14.5" y2="12" stroke="#047857" stroke-width="1.2"/>
      <line x1="6.5" y1="15.5" x2="12" y2="15.5" stroke="#047857" stroke-width="1.2"/>
      <circle cx="15.5" cy="19" r="4.2" fill="#BBF7D0" stroke="#059669" stroke-width="1.3"/>
      <polyline points="13.8,19 14.8,20.2 17.2,18" fill="none" stroke="#047857" stroke-width="1.4" stroke-linecap="round"/>
    </g>'''

# =============================================================================
# MAIN GENERATOR FUNCTION
# =============================================================================

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
    lines.append('  </defs>')

    # Background: Crisp Technical White
    lines.append('  <rect width="1920" height="1080" fill="#FFFFFF"/>')

    # Blueprint Border Frame (Engineering Double Border - Soft & Refined)
    lines.append('  <rect x="18" y="18" width="1884" height="1044" fill="none" stroke="#CBD5E1" stroke-width="2.2"/>')
    lines.append('  <rect x="26" y="26" width="1868" height="1028" fill="none" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="6,4"/>')

    # =========================================================================
    # HEADER BLOCK (EXTRA LARGE, PROMINENT TYPOGRAPHY)
    # =========================================================================
    lines.append('  <!-- ==================== HEADER BLOCK ==================== -->')
    lines.append('  <g id="Header_Block" transform="translate(36, 32)">')
    lines.append('    <rect x="0" y="0" width="1848" height="84" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>')
    
    # Master Nexus Logistics Crest Emblem
    lines.append(f'    <g transform="translate(18, 20)">{icon_nexus_crest()}</g>')
    lines.append('    <text x="78" y="38" font-size="27" font-weight="900" fill="#0F172A" letter-spacing="-0.3px">Hình 2.3: Sơ đồ luồng hoạt động của mô hình RAG trong hệ thống Nexus Logistics</text>')
    lines.append('    <text x="78" y="67" font-size="16.5" font-weight="600" fill="#334155">Quy trình 3 giai đoạn: Đánh chỉ mục ngoại tuyến (Indexing) • Truy xuất ngữ cảnh trực tuyến (Retrieval) • Sinh phản hồi tăng cường (Generation)</text>')
    
    # Academic Reference Pill
    lines.append('    <rect x="1420" y="18" width="410" height="48" rx="5" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.4"/>')
    lines.append('    <text x="1625" y="48" font-size="16" font-weight="800" fill="#1E293B" text-anchor="middle">Hệ Thống Nexus Logistics • Đồ Án Tốt Nghiệp</text>')
    lines.append('  </g>')

    # =========================================================================
    # PHASE BOUNDARY BANDS (OFFLINE vs ONLINE)
    # =========================================================================
    # Top Phase Band: Indexing (Offline)
    lines.append('  <!-- Phase 1 Background Band -->')
    lines.append('  <rect x="36" y="124" width="1848" height="364" rx="6" fill="#FAFAFA" stroke="#E2E8F0" stroke-width="1.3"/>')
    lines.append('  <rect x="46" y="133" width="455" height="34" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1.4"/>')
    lines.append('  <text x="62" y="156" class="mono" font-size="15.5" font-weight="900" fill="#1D4ED8">GIAI ĐOẠN 1: INDEXING (NGOẠI TUYẾN / OFFLINE)</text>')
    lines.append('  <text x="515" y="156" font-size="15.5" font-weight="700" fill="#334155">Bóc tách AST Markdown • Sliding Window (250w/40w) • Nhúng Vector 1536-D • Nạp In-Memory Vector Store</text>')

    # Bottom Phase Band: Retrieval & Generation (Online)
    lines.append('  <!-- Phase 2 & 3 Background Band -->')
    lines.append('  <rect x="36" y="496" width="1848" height="430" rx="6" fill="#FAFAFA" stroke="#E2E8F0" stroke-width="1.3"/>')
    
    # Left pill for Phase 2&3 (Contained to avoid overlap with central card)
    lines.append('  <rect x="46" y="505" width="580" height="34" rx="4" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.4"/>')
    lines.append('  <text x="62" y="528" class="mono" font-size="15" font-weight="900" fill="#047857">GIAI ĐOẠN 2 &amp; 3: RETRIEVAL &amp; GENERATION (TRỰC TUYẾN / ONLINE)</text>')
    
    # Clean non-overlapping middle badge for Retrieval
    lines.append('  <rect x="945" y="505" width="195" height="34" rx="4" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.4"/>')
    lines.append('  <text x="1042" y="528" class="mono" font-size="14.5" font-weight="900" fill="#047857" text-anchor="middle">VECTOR RETRIEVAL</text>')

    # Clean non-overlapping right badge for Hybrid Search & Grounding (Between Highway & Answer Token!)
    lines.append('  <rect x="1330" y="505" width="345" height="34" rx="4" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1.4"/>')
    lines.append('  <text x="1502" y="528" font-size="15" font-weight="700" fill="#065F46" text-anchor="middle">Tìm kiếm tương đồng (Hybrid) • Top-K Context</text>')

    # =========================================================================
    # COMPONENT 1: DOCUMENTS (TOP LEFT, X=50, Y=175)
    # =========================================================================
    lines.append('  <!-- COMPONENT 1: DOCUMENTS -->')
    lines.append('  <g id="Comp_Documents" transform="translate(50, 175)">')
    lines.append('    <rect x="0" y="0" width="270" height="302" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>')
    lines.append('    <rect x="0" y="0" width="270" height="46" rx="6" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.8"/>')
    lines.append(f'    <g transform="translate(12, 11)">{icon_policy_dossier()}</g>')
    lines.append('    <text x="44" y="30" font-size="18" font-weight="900" fill="#0F172A">Tài Liệu Bưu Chính</text>')
    lines.append('    <text x="135" y="62" class="mono" font-size="13.5" font-weight="700" fill="#64748B" text-anchor="middle">Documents (Markdown / Policy)</text>')
    
    # Doc items (Exact real files in docs/knowledge-base/ with clean filenames)
    docs_data = [
        ("01-pricing-weight.md", "Bảng cước & Quy đổi / 6000", "#1E293B", "#EFF6FF", "#BFDBFE"),
        ("02-insurance-policy.md", "Bồi thường & BBBT trong 24h", "#1E293B", "#F0FDF4", "#BBF7D0"),
        ("03-prohibited-goods.md", "Hàng cấm & Miễn trừ đền bù", "#1E293B", "#FEF2F2", "#FECACA"),
    ]
    for idx, (doc_name, doc_desc, col, bg, border) in enumerate(docs_data):
        dy = 73 + idx * 70
        lines.append(f'    <g transform="translate(12, {dy})">')
        lines.append(f'      <rect x="0" y="0" width="246" height="60" rx="4" fill="{bg}" stroke="{border}" stroke-width="1.3"/>')
        lines.append(f'      <text x="12" y="24" class="mono" font-size="13.5" font-weight="800" fill="{col}">{xml_esc(doc_name)}</text>')
        lines.append(f'      <text x="12" y="47" font-size="14.5" font-weight="700" fill="#334155">{xml_esc(doc_desc)}</text>')
        lines.append('    </g>')
    lines.append('  </g>')

    # Arrow 1: Documents -> Chunks (Horizontal)
    lines.append('  <!-- Arrow: Documents -> Chunks -->')
    lines.append('  <line x1="320" y1="326" x2="355" y2="326" stroke="#0F172A" stroke-width="2.4"/>')
    lines.append('  <polygon points="361,326 348,321 348,331" fill="#0F172A"/>')

    # =========================================================================
    # COMPONENT 2: CHUNKS (TOP X=363, Y=175)
    # =========================================================================
    lines.append('  <!-- COMPONENT 2: CHUNKS -->')
    lines.append('  <g id="Comp_Chunks" transform="translate(363, 175)">')
    lines.append('    <rect x="0" y="0" width="265" height="302" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>')
    lines.append('    <rect x="0" y="0" width="265" height="46" rx="6" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.8"/>')
    lines.append(f'    <g transform="translate(12, 11)">{icon_ast_chunks()}</g>')
    lines.append('    <text x="44" y="30" font-size="18" font-weight="900" fill="#0F172A">Phân Mảnh (Chunks)</text>')
    lines.append('    <text x="132" y="62" class="mono" font-size="13.5" font-weight="700" fill="#64748B" text-anchor="middle">AST Markdown Recursive Split</text>')

    # Chunk 1 (Real ID: 01-pricing-and-iata-weight.md#chunk-2)
    lines.append('    <g transform="translate(12, 73)">')
    lines.append('      <rect x="0" y="0" width="241" height="62" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.3"/>')
    lines.append('      <text x="10" y="21" class="mono" font-size="13.5" font-weight="800" fill="#0284C7">#chunk-2 (01-pricing...)</text>')
    lines.append('      <text x="10" y="41" class="mono" font-size="16" font-weight="900" fill="#0F172A">Cước = (DxRxC) / 6000</text>')
    lines.append('      <text x="10" y="57" font-size="13" font-weight="600" fill="#475569">Quy đổi thể tích đường bộ</text>')
    lines.append('    </g>')

    # Chunk 2 (Real ID: 02-insurance-and-claim-policy.md#chunk-4)
    lines.append('    <g transform="translate(12, 142)">')
    lines.append('      <rect x="0" y="0" width="241" height="62" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.3"/>')
    lines.append('      <text x="10" y="21" class="mono" font-size="13.5" font-weight="800" fill="#059669">#chunk-4 (02-insurance...)</text>')
    lines.append('      <text x="10" y="41" font-size="15.5" font-weight="900" fill="#0F172A">Điều 2. Đền 100% khai giá</text>')
    lines.append('      <text x="10" y="57" font-size="13" font-weight="600" fill="#475569">Khi có BBBT &amp; bảo hiểm bưu gửi</text>')
    lines.append('    </g>')

    # Sliding window spec
    lines.append('    <g transform="translate(12, 211)">')
    lines.append('      <rect x="0" y="0" width="241" height="78" rx="4" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.2" stroke-dasharray="3,3"/>')
    lines.append('      <text x="120" y="25" class="mono" font-size="14.5" font-weight="900" fill="#1E293B" text-anchor="middle">Sliding Window Specs:</text>')
    lines.append('      <text x="120" y="48" class="mono" font-size="14" font-weight="700" fill="#334155" text-anchor="middle">Chunk Size: 250 words</text>')
    lines.append('      <text x="120" y="69" class="mono" font-size="14" font-weight="700" fill="#334155" text-anchor="middle">Overlap: 40 words (16%)</text>')
    lines.append('    </g>')
    lines.append('  </g>')

    # =========================================================================
    # COMPONENT 3: USER QUERY (BOTTOM LEFT, X=50, Y=555)
    # =========================================================================
    lines.append('  <!-- COMPONENT 3: USER QUERY -->')
    lines.append('  <g id="Comp_User_Query" transform="translate(50, 555)">')
    lines.append('    <rect x="0" y="0" width="578" height="260" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>')
    lines.append('    <rect x="0" y="0" width="578" height="46" rx="6" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.8"/>')
    lines.append(f'    <g transform="translate(14, 11)">{icon_merchant_terminal()}</g>')
    lines.append('    <text x="46" y="30" font-size="18" font-weight="900" fill="#0F172A">Truy Vấn Chủ Hàng / Merchant (User Query)</text>')
    
    # Query text box
    lines.append('    <rect x="14" y="55" width="550" height="118" rx="4" fill="#F0F9FF" stroke="#BAE6FD" stroke-width="1.4"/>')
    lines.append('    <text x="24" y="78" class="mono" font-size="14.5" font-weight="900" fill="#0369A1">CÂU HỎI ĐẦU VÀO (INPUT STRING):</text>')
    lines.append('    <text x="24" y="104" font-size="17" font-weight="800" fill="#0F172A">"Kiện hàng NEX-88291 bị bể vỡ do bưu tá làm rơi,</text>')
    lines.append('    <text x="24" y="130" font-size="17" font-weight="800" fill="#0F172A">thì quy chế bồi thường giải quyết thế nào?"</text>')
    lines.append('    <text x="24" y="156" class="mono" font-size="13.5" font-weight="800" fill="#0284C7">[Trích xuất: AWB = NEX-88291 | Intent = CLAIM_DAMAGE | Action = LOOKUP_POLICY]</text>')

    # Routing explanation box
    lines.append('    <rect x="14" y="180" width="550" height="68" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="24" y="202" class="mono" font-size="14.5" font-weight="900" fill="#1E293B">Hai luồng xử lý song song (Dual Pipeline Dispatch):</text>')
    lines.append('    <text x="24" y="222" font-size="14.5" font-weight="600" fill="#475569">1. Đi vào Embedding Model để tạo Query Vector q (Giai đoạn Retrieval)</text>')
    lines.append('    <text x="24" y="240" font-size="14.5" font-weight="600" fill="#475569">2. Cầu nối trực tiếp (Prompt Bridge) vào LLM Generator (Giai đoạn Generation)</text>')
    lines.append('  </g>')

    # =========================================================================
    # COMPONENT 4: THE CENTRAL EMBEDDING MODEL (X=665, Y=290)
    # =========================================================================
    lines.append('  <!-- COMPONENT 4: EMBEDDING MODEL (CENTRAL ENCODER) -->')
    lines.append('  <g id="Comp_Embedding_Model" transform="translate(665, 290)">')
    lines.append('    <rect x="0" y="0" width="245" height="385" rx="6" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2"/>')
    lines.append('    <rect x="0" y="0" width="245" height="46" rx="6" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2"/>')
    lines.append(f'    <g transform="translate(14, 11)">{icon_neural_embedding()}</g>')
    lines.append('    <text x="46" y="30" font-size="18.5" font-weight="900" fill="#6D28D9">Embedding Model</text>')
    
    # Neural Network Graphic (Clean, Gentle Vector Style)
    lines.append('    <g transform="translate(25, 56)">')
    lines.append('      <rect x="0" y="0" width="195" height="162" rx="4" fill="#FAF5FF" stroke="#E9D5FF" stroke-width="1.2"/>')
    
    # Layer 1: Input (3 nodes)
    lines.append('      <circle cx="35" cy="38" r="9" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.2"/>')
    lines.append('      <circle cx="35" cy="81" r="9" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.2"/>')
    lines.append('      <circle cx="35" cy="124" r="9" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.2"/>')

    # Layer 2: Hidden (4 nodes)
    lines.append('      <circle cx="98" cy="26" r="9" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.2"/>')
    lines.append('      <circle cx="98" cy="63" r="9" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.2"/>')
    lines.append('      <circle cx="98" cy="100" r="9" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.2"/>')
    lines.append('      <circle cx="98" cy="137" r="9" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.2"/>')

    # Layer 3: Output (3 nodes)
    lines.append('      <circle cx="160" cy="38" r="9" fill="#FFFFFF" stroke="#059669" stroke-width="2.2"/>')
    lines.append('      <circle cx="160" cy="81" r="9" fill="#FFFFFF" stroke="#059669" stroke-width="2.2"/>')
    lines.append('      <circle cx="160" cy="124" r="9" fill="#FFFFFF" stroke="#059669" stroke-width="2.2"/>')

    # Synapses
    synapses = [
        (35,38,98,26),(35,38,98,63),(35,81,98,63),(35,81,98,100),(35,124,98,100),(35,124,98,137),
        (98,26,160,38),(98,63,160,38),(98,63,160,81),(98,100,160,81),(98,137,160,124)
    ]
    for x1,y1,x2,y2 in synapses:
        lines.append(f'      <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#D8B4FE" stroke-width="1.4"/>')
    lines.append('    </g>')

    # Specs (Exact from embedding.service.ts)
    lines.append('    <g transform="translate(15, 230)">')
    lines.append('      <text x="107" y="20" class="mono" font-size="16" font-weight="900" fill="#0F172A" text-anchor="middle">Gemini / OpenAI</text>')
    lines.append('      <rect x="5" y="32" width="205" height="30" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('      <text x="107" y="53" class="mono" font-size="15" font-weight="800" fill="#334155" text-anchor="middle">Dim: 1536-D (Dense)</text>')
    lines.append('      <text x="107" y="84" class="mono" font-size="14" font-weight="700" fill="#64748B" text-anchor="middle">Batch Embedding API</text>')
    lines.append('      <text x="107" y="108" class="mono" font-size="14.5" font-weight="900" fill="#059669" text-anchor="middle">Chuẩn hóa: ||v||₂ = 1.0</text>')
    lines.append('    </g>')
    lines.append('  </g>')

    # Connector 1: Chunks -> Embedding Model
    lines.append('  <!-- Path: Chunks -> Embedding Model -->')
    lines.append('  <path d="M 628 326 L 646 326 L 646 410 L 660 410" fill="none" stroke="#0F172A" stroke-width="2.4"/>')
    lines.append('  <polygon points="665,410 652,405 652,415" fill="#0F172A"/>')
    lines.append('  <rect x="612" y="352" width="68" height="26" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.3"/>')
    lines.append('  <text x="646" y="370" class="mono" font-size="13.5" font-weight="900" fill="#1E293B" text-anchor="middle">Chunks</text>')

    # Connector 2: User Query -> Embedding Model
    lines.append('  <!-- Path: User Query -> Embedding Model -->')
    lines.append('  <path d="M 628 650 L 646 650 L 646 560 L 660 560" fill="none" stroke="#0F172A" stroke-width="2.4"/>')
    lines.append('  <polygon points="665,560 652,555 652,565" fill="#0F172A"/>')
    lines.append('  <rect x="614" y="585" width="64" height="26" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.3"/>')
    lines.append('  <text x="646" y="603" class="mono" font-size="13.5" font-weight="900" fill="#1E293B" text-anchor="middle">Query</text>')

    # =========================================================================
    # COMPONENT 5: TENSORS / VECTORS (THEORETICAL MATRIX BRACKETS)
    # =========================================================================
    # 5.1 Document Vectors (Top, X=945, Y=175)
    lines.append('  <!-- COMPONENT 5.1: DOCUMENT VECTORS -->')
    lines.append('  <g id="Comp_Doc_Vectors" transform="translate(945, 175)">')
    lines.append('    <rect x="0" y="0" width="175" height="175" rx="6" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.8"/>')
    lines.append('    <text x="88" y="28" class="mono" font-size="16" font-weight="900" fill="#0284C7" text-anchor="middle">Doc Vectors (d)</text>')
    
    # Bracket graphic
    lines.append('    <g transform="translate(25, 42)">')
    lines.append('      <text x="0" y="30" font-family="Cambria, serif" font-size="38" fill="#0F172A">[</text>')
    lines.append('      <text x="110" y="30" font-family="Cambria, serif" font-size="38" fill="#0F172A">]</text>')
    lines.append('      <text x="20" y="28" class="mono" font-size="15.5" font-weight="900" fill="#0F172A">+0.024</text>')
    lines.append('      <text x="20" y="52" class="mono" font-size="15.5" font-weight="900" fill="#0F172A">-0.051</text>')
    lines.append('      <text x="40" y="70" class="mono" font-size="16" font-weight="900" fill="#64748B">...</text>')
    lines.append('      <text x="20" y="92" class="mono" font-size="15.5" font-weight="900" fill="#0F172A">+0.089</text>')
    lines.append('      <text x="0" y="96" font-family="Cambria, serif" font-size="38" fill="#0F172A">[</text>')
    lines.append('      <text x="110" y="96" font-family="Cambria, serif" font-size="38" fill="#0F172A">]</text>')
    lines.append('    </g>')
    lines.append('    <text x="88" y="158" class="mono" font-size="14.5" font-weight="900" fill="#334155" text-anchor="middle">d ∈ ℝ¹⁵³⁶ (L2-norm)</text>')
    lines.append('  </g>')

    # Path Embedding Model -> Document Vectors
    lines.append('  <!-- Path: Embedding -> Doc Vectors -->')
    lines.append('  <path d="M 910 410 L 928 410 L 928 262 L 940 262" fill="none" stroke="#0284C7" stroke-width="2.4"/>')
    lines.append('  <polygon points="945,262 932,257 932,267" fill="#0284C7"/>')

    # Path Document Vectors -> Vector Store
    lines.append('  <!-- Path: Doc Vectors -> Vector Store -->')
    lines.append('  <line x1="1120" y1="262" x2="1150" y2="262" stroke="#0284C7" stroke-width="2.4"/>')
    lines.append('  <polygon points="1155,262 1142,257 1142,267" fill="#0284C7"/>')

    # 5.2 Query Vector (Bottom, X=945, Y=560 - Aligned with Radar Reticle!)
    lines.append('  <!-- COMPONENT 5.2: QUERY VECTOR -->')
    lines.append('  <g id="Comp_Query_Vector" transform="translate(945, 560)">')
    lines.append('    <rect x="0" y="0" width="175" height="162" rx="6" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.8"/>')
    lines.append('    <text x="88" y="28" class="mono" font-size="16" font-weight="900" fill="#7C3AED" text-anchor="middle">Query Vector (q)</text>')
    
    # Bracket graphic
    lines.append('    <g transform="translate(25, 38)">')
    lines.append('      <text x="0" y="28" font-family="Cambria, serif" font-size="38" fill="#0F172A">[</text>')
    lines.append('      <text x="110" y="28" font-family="Cambria, serif" font-size="38" fill="#0F172A">]</text>')
    lines.append('      <text x="20" y="25" class="mono" font-size="15.5" font-weight="900" fill="#0F172A">-0.031</text>')
    lines.append('      <text x="20" y="48" class="mono" font-size="15.5" font-weight="900" fill="#0F172A">+0.084</text>')
    lines.append('      <text x="40" y="65" class="mono" font-size="16" font-weight="900" fill="#64748B">...</text>')
    lines.append('      <text x="20" y="85" class="mono" font-size="15.5" font-weight="900" fill="#0F172A">-0.012</text>')
    lines.append('      <text x="0" y="88" font-family="Cambria, serif" font-size="38" fill="#0F172A">[</text>')
    lines.append('      <text x="110" y="88" font-family="Cambria, serif" font-size="38" fill="#0F172A">]</text>')
    lines.append('    </g>')
    lines.append('    <text x="88" y="148" class="mono" font-size="14.5" font-weight="900" fill="#334155" text-anchor="middle">q ∈ ℝ¹⁵³⁶ (L2-norm)</text>')
    lines.append('  </g>')

    # Path Embedding Model -> Query Vector (Straight & Clean Manhattan)
    lines.append('  <!-- Path: Embedding -> Query Vector -->')
    lines.append('  <path d="M 910 560 L 928 560 L 928 641 L 940 641" fill="none" stroke="#7C3AED" stroke-width="2.4"/>')
    lines.append('  <polygon points="945,641 932,636 932,646" fill="#7C3AED"/>')

    # Path Query Vector -> Similarity Search (Straight Line directly into Reticle!)
    lines.append('  <!-- Path: Query Vector -> Similarity Search -->')
    lines.append('  <line x1="1120" y1="641" x2="1150" y2="641" stroke="#7C3AED" stroke-width="2.4"/>')
    lines.append('  <polygon points="1155,641 1142,636 1142,646" fill="#7C3AED"/>')

    # =========================================================================
    # COMPONENT 6: VECTOR STORE (TOP, X=1155, Y=175)
    # =========================================================================
    lines.append('  <!-- COMPONENT 6: VECTOR STORE -->')
    lines.append('  <g id="Comp_Vector_Store" transform="translate(1155, 175)">')
    lines.append('    <rect x="0" y="0" width="245" height="302" rx="6" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.8"/>')
    lines.append('    <rect x="0" y="0" width="245" height="46" rx="6" fill="#F0FDF4" stroke="#0284C7" stroke-width="1.8"/>')
    lines.append(f'    <g transform="translate(14, 11)">{icon_vector_store()}</g>')
    lines.append('    <text x="46" y="30" font-size="18.5" font-weight="900" fill="#0369A1">Vector Store</text>')
    
    # Cylinder graphic (Gentle Blue)
    lines.append('    <g transform="translate(68, 54)">')
    lines.append('      <path d="M 0 16 L 0 58 A 55 16 0 0 0 110 58 L 110 16 Z" fill="#F0F9FF" stroke="#0284C7" stroke-width="1.5"/>')
    lines.append('      <path d="M 0 36 A 55 14 0 0 0 110 36" fill="none" stroke="#0284C7" stroke-width="1.2" stroke-dasharray="3,2"/>')
    lines.append('      <ellipse cx="55" cy="16" rx="55" ry="16" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5"/>')
    lines.append('      <text x="55" y="22" class="mono" font-size="13.5" font-weight="900" fill="#0369A1" text-anchor="middle">VECTOR INDEX</text>')
    lines.append('    </g>')

    # Database Specs (Exact from vector-store.service.ts and vector-index.json)
    lines.append('    <g transform="translate(14, 140)">')
    lines.append('      <rect x="0" y="0" width="217" height="150" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('      <text x="12" y="27" class="mono" font-size="14.5" font-weight="900" fill="#0F172A">• File: vector-index.json</text>')
    lines.append('      <text x="12" y="54" class="mono" font-size="14.5" font-weight="700" fill="#334155">• Store: In-Memory Cache</text>')
    lines.append('      <text x="12" y="81" class="mono" font-size="14.5" font-weight="700" fill="#334155">• Metric: Cosine Distance</text>')
    lines.append('      <text x="12" y="108" class="mono" font-size="14.5" font-weight="700" fill="#334155">• Chunks: 44 Chunks (1536-D)</text>')
    lines.append('      <text x="12" y="135" class="mono" font-size="14.5" font-weight="900" fill="#059669">• Latency: &lt; 0.5 ms / query</text>')
    lines.append('    </g>')
    lines.append('  </g>')

    # =========================================================================
    # STRAIGHT VERTICAL HIGHWAY: VECTOR STORE (TOP) -> SIMILARITY SEARCH (BOTTOM)
    # =========================================================================
    lines.append('  <!-- STRAIGHT VERTICAL CONNECTOR: Vector Store -> Similarity Search -->')
    lines.append('  <line x1="1277" y1="477" x2="1277" y2="550" stroke="#0284C7" stroke-width="2.6"/>')
    lines.append('  <polygon points="1277,555 1271,542 1283,542" fill="#0284C7"/>')
    lines.append('  <rect x="1182" y="500" width="190" height="28" rx="4" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.4"/>')
    lines.append('  <text x="1277" y="519" class="mono" font-size="14" font-weight="900" fill="#0369A1" text-anchor="middle">Feed Doc Embeddings</text>')

    # =========================================================================
    # COMPONENT 7: SIMILARITY SEARCH & HYBRID MATCH (BOTTOM, X=1155, Y=555)
    # =========================================================================
    lines.append('  <!-- COMPONENT 7: SIMILARITY SEARCH -->')
    lines.append('  <g id="Comp_Similarity_Search" transform="translate(1155, 555)">')
    lines.append('    <rect x="0" y="0" width="245" height="260" rx="6" fill="#FFFFFF" stroke="#059669" stroke-width="1.8"/>')
    lines.append('    <rect x="0" y="0" width="245" height="46" rx="6" fill="#F0FDF4" stroke="#059669" stroke-width="1.8"/>')
    lines.append(f'    <g transform="translate(14, 11)">{icon_similarity_radar()}</g>')
    lines.append('    <text x="46" y="30" font-size="18" font-weight="900" fill="#065F46">Similarity Search</text>')
    
    # Bespoke Semantic Radar & Cosine Angle Reticle Box (Technical Engineering Graphic)
    lines.append('    <g transform="translate(12, 54)">')
    lines.append('      <rect x="0" y="0" width="221" height="64" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>')
    # Radar reticle circle
    lines.append('      <circle cx="38" cy="32" r="24" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1.2"/>')
    lines.append('      <circle cx="38" cy="32" r="14" fill="none" stroke="#86EFAC" stroke-width="0.9" stroke-dasharray="2,2"/>')
    lines.append('      <line x1="38" y1="8" x2="38" y2="56" stroke="#86EFAC" stroke-width="0.9"/>')
    lines.append('      <line x1="14" y1="32" x2="62" y2="32" stroke="#86EFAC" stroke-width="0.9"/>')
    # Vector q (Query, purple)
    lines.append('      <line x1="38" y1="32" x2="56" y2="19" stroke="#7C3AED" stroke-width="2.4"/>')
    lines.append('      <polygon points="59,17 52,18 54,22" fill="#7C3AED"/>')
    lines.append('      <text x="56" y="14" class="mono" font-size="12" font-weight="900" fill="#7C3AED">q</text>')
    # Vector d (Doc, blue)
    lines.append('      <line x1="38" y1="32" x2="57" y2="38" stroke="#0284C7" stroke-width="2.4"/>')
    lines.append('      <polygon points="60,39 55,35 53,39" fill="#0284C7"/>')
    lines.append('      <text x="58" y="48" class="mono" font-size="12" font-weight="900" fill="#0284C7">d</text>')
    # Angle arc & text readout
    lines.append('      <path d="M 49 24 A 14 14 0 0 1 50 35" fill="none" stroke="#059669" stroke-width="1.5"/>')
    lines.append('      <text x="80" y="26" class="mono" font-size="15" font-weight="900" fill="#065F46">cos(θ) = 0.91</text>')
    lines.append('      <text x="80" y="44" font-size="13.5" font-weight="700" fill="#047857">Độ tương đồng góc</text>')
    lines.append('      <text x="80" y="58" class="mono" font-size="12.5" font-weight="700" fill="#64748B">Góc kẹp: θ ≈ 24.5°</text>')
    lines.append('    </g>')

    # Formula & Hybrid Weights Box (Exact from vector-store.service.ts line 173)
    lines.append('    <g transform="translate(12, 124)">')
    lines.append('      <rect x="0" y="0" width="221" height="88" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('      <text x="12" y="25" class="mono" font-size="14" font-weight="800" fill="#0284C7">• Dense (Cosine): 70% (0.7x)</text>')
    lines.append('      <text x="12" y="50" class="mono" font-size="14" font-weight="800" fill="#D97706">• Keyword/Thesaurus: +0.35</text>')
    lines.append('      <text x="12" y="75" class="mono" font-size="14" font-weight="800" fill="#059669">• Ngưỡng lọc: Score ≥ 0.15</text>')
    lines.append('    </g>')

    lines.append('    <text x="122" y="238" class="mono" font-size="14" font-weight="900" fill="#0F172A" text-anchor="middle">Cosine + Logistics Thesaurus</text>')
    lines.append('  </g>')

    # Arrow 7 -> 8: Similarity Search -> Top-K Context
    lines.append('  <!-- Path: Similarity Search -> Top-K Context -->')
    lines.append('  <line x1="1400" y1="685" x2="1425" y2="685" stroke="#0F172A" stroke-width="2.4"/>')
    lines.append('  <polygon points="1430,685 1417,680 1417,690" fill="#0F172A"/>')

    # =========================================================================
    # COMPONENT 8: TOP-K CONTEXT (BOTTOM, X=1430, Y=555)
    # =========================================================================
    lines.append('  <!-- COMPONENT 8: TOP-K CONTEXT -->')
    lines.append('  <g id="Comp_TopK_Context" transform="translate(1430, 555)">')
    lines.append('    <rect x="0" y="0" width="205" height="260" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>')
    lines.append('    <rect x="0" y="0" width="205" height="46" rx="6" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.8"/>')
    lines.append(f'    <g transform="translate(12, 11)">{icon_topk_stack()}</g>')
    lines.append('    <text x="44" y="30" font-size="18" font-weight="900" fill="#0F172A">Top-K Context</text>')

    # Top 1 chunk
    lines.append('    <g transform="translate(10, 54)">')
    lines.append('      <rect x="0" y="0" width="185" height="74" rx="4" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1.3"/>')
    lines.append('      <text x="10" y="22" class="mono" font-size="14" font-weight="900" fill="#065F46">TOP 1 (Score: 0.91)</text>')
    lines.append('      <text x="10" y="44" font-size="15.5" font-weight="900" fill="#047857">Điều 4.2: BBBT 24h</text>')
    lines.append('      <text x="10" y="64" font-size="13.5" font-weight="600" fill="#14532D">Hàng bể vỡ có biên bản</text>')
    lines.append('    </g>')

    # Top 2 chunk
    lines.append('    <g transform="translate(10, 134)">')
    lines.append('      <rect x="0" y="0" width="185" height="70" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.3"/>')
    lines.append('      <text x="10" y="21" class="mono" font-size="13.5" font-weight="800" fill="#475569">TOP 2 (Score: 0.84)</text>')
    lines.append('      <text x="10" y="42" font-size="14.5" font-weight="700" fill="#1E293B">Bảng Cước Quy Đổi</text>')
    lines.append('      <text x="10" y="61" class="mono" font-size="14" font-weight="900" fill="#0284C7">TLTT = (DxRxC)/6000</text>')
    lines.append('    </g>')

    lines.append('    <text x="102" y="225" class="mono" font-size="14.5" font-weight="900" fill="#DC2626" text-anchor="middle">Grounded Knowledge</text>')
    lines.append('    <text x="102" y="244" font-size="13.5" font-weight="700" fill="#64748B" text-anchor="middle">Triệt tiêu hoàn toàn ảo giác</text>')
    lines.append('  </g>')

    # Arrow 8 -> 9: Top-K Context -> LLM
    lines.append('  <!-- Path: Top-K Context -> LLM Engine -->')
    lines.append('  <line x1="1635" y1="685" x2="1660" y2="685" stroke="#0F172A" stroke-width="2.4"/>')
    lines.append('  <polygon points="1665,685 1652,680 1652,690" fill="#0F172A"/>')

    # =========================================================================
    # COMPONENT 9: LLM ENGINE (BOTTOM, X=1665, Y=555)
    # =========================================================================
    lines.append('  <!-- COMPONENT 9: LLM ENGINE -->')
    lines.append('  <g id="Comp_LLM_Engine" transform="translate(1665, 555)">')
    lines.append('    <rect x="0" y="0" width="215" height="260" rx="6" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.8"/>')
    lines.append('    <rect x="0" y="0" width="215" height="46" rx="6" fill="#F5F3FF" stroke="#7C3AED" stroke-width="1.8"/>')
    lines.append(f'    <g transform="translate(14, 11)">{icon_llm_core()}</g>')
    lines.append('    <text x="46" y="30" font-size="18" font-weight="900" fill="#6D28D9">LLM Generator</text>')

    # Prompt Composition Formula (Spacious layout)
    lines.append('    <g transform="translate(10, 52)">')
    lines.append('      <rect x="0" y="0" width="195" height="110" rx="4" fill="#FAF5FF" stroke="#E9D5FF" stroke-width="1.3"/>')
    lines.append('      <text x="10" y="21" class="mono" font-size="14" font-weight="900" fill="#6D28D9">Prompt Augmentation:</text>')
    lines.append('      <text x="10" y="43" font-size="13.5" font-weight="700" fill="#1E293B">1. System: Quy chế Bưu tá</text>')
    lines.append('      <text x="10" y="65" font-size="13.5" font-weight="800" fill="#047857">2. Context: Điều 4.2 BBBT</text>')
    lines.append('      <text x="10" y="87" font-size="13.5" font-weight="800" fill="#0284C7">3. User: NEX-88291 bể vỡ</text>')
    lines.append('      <text x="10" y="103" class="mono" font-size="12" font-weight="600" fill="#64748B">Output JSON + Action Schema</text>')
    lines.append('    </g>')

    # Model Badge (Gentle, Professional - Cleanly contained inside card with zero overflow!)
    lines.append('    <rect x="10" y="172" width="195" height="66" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>')
    lines.append('    <text x="107" y="196" font-size="14.5" font-weight="900" fill="#0F172A" text-anchor="middle">Gemini Flash • GPT-4o</text>')
    lines.append('    <text x="107" y="220" class="mono" font-size="12" font-weight="700" fill="#64748B" text-anchor="middle">Temp = 0.1 • Zero Bias</text>')
    lines.append('  </g>')

    # =========================================================================
    # COMPONENT 10: GROUNDED ANSWER DOCUMENT (TOP RIGHT, X=1420, Y=175)
    # =========================================================================
    lines.append('  <!-- COMPONENT 10: GROUNDED ANSWER & ACTION (TOP RIGHT, X=1420, Y=175) -->')
    lines.append('  <g id="Comp_Answer_Doc" transform="translate(1420, 175)">')
    lines.append('    <rect x="0" y="0" width="460" height="302" rx="6" fill="#FFFFFF" stroke="#059669" stroke-width="1.8"/>')
    lines.append('    <rect x="0" y="0" width="460" height="46" rx="6" fill="#F0FDF4" stroke="#059669" stroke-width="1.8"/>')
    lines.append(f'    <g transform="translate(14, 11)">{icon_resolution_seal()}</g>')
    lines.append('    <text x="46" y="30" font-size="18" font-weight="900" fill="#065F46">Văn Bản Phản Hồi &amp; Thẻ Hành Động</text>')
    
    # Grounded text response box
    lines.append('    <g transform="translate(14, 52)">')
    lines.append('      <rect x="0" y="0" width="432" height="154" rx="4" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1.3"/>')
    
    # Dual Top Badges: Citation on left, Audit stamp on right (Zero collision!)
    lines.append('      <rect x="12" y="8" width="230" height="25" rx="3" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1.1"/>')
    lines.append('      <text x="20" y="25" class="mono" font-size="12.5" font-weight="900" fill="#1D4ED8">CĂN CỨ: 02-insurance-policy.md</text>')

    lines.append('      <g transform="translate(255, 8)">')
    lines.append('        <rect x="0" y="0" width="165" height="25" rx="3" fill="#DCFCE7" stroke="#059669" stroke-width="1.1"/>')
    lines.append('        <circle cx="12" cy="12.5" r="5.5" fill="#059669"/>')
    lines.append('        <polyline points="9.5,12.5 11.5,14.5 14.5,10.5" fill="none" stroke="#FFFFFF" stroke-width="1.4"/>')
    lines.append('        <text x="25" y="17" class="mono" font-size="12" font-weight="900" fill="#047857">NEXUS VERIFIED • 24H</text>')
    lines.append('      </g>')

    # Grounded answer lines (Safe margins, large crisp typography)
    lines.append('      <text x="14" y="55" font-size="15" font-weight="600" fill="#0F172A">"Theo <tspan font-weight="bold" fill="#0284C7">Điều 4.2 Quy chế Bồi thường</tspan>, đơn hàng <tspan class="mono" font-weight="bold">NEX-88291</tspan></text>')
    lines.append('      <text x="14" y="78" font-size="15" font-weight="600" fill="#0F172A">bị bể vỡ do bưu tá làm rơi sẽ được giải quyết:</text>')
    lines.append('      <text x="14" y="101" font-size="15" font-weight="900" fill="#059669">• Đền 100% giá trị khai giá (khi có bảo hiểm bưu gửi).</text>')
    lines.append('      <text x="14" y="123" font-size="15" font-weight="900" fill="#DC2626">• Điều kiện: Lập biên bản BBBT trong 24h."</text>')
    lines.append('      <text x="14" y="143" font-size="13.5" font-weight="700" fill="#64748B">• Cước vận chuyển đã tính theo chuẩn thể tích (DxRxC)/6000.</text>')
    lines.append('    </g>')

    # 2 Action triggers (Textbook clean outline cards with mini bespoke vector glyphs)
    lines.append('    <g transform="translate(14, 214)">')
    # Button 1: Claim request (Green)
    lines.append('      <g transform="translate(0, 0)">')
    lines.append('        <rect x="0" y="0" width="210" height="44" rx="4" fill="#059669"/>')
    lines.append('        <g transform="translate(12, 13)">')
    lines.append('          <path d="M 1 3 L 8 0 L 15 3 L 15 9 A 8 8 0 0 1 8 16 A 8 8 0 0 1 1 9 Z" fill="#047857" stroke="#FFFFFF" stroke-width="1.2"/>')
    lines.append('          <line x1="8" y1="5" x2="8" y2="11" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>')
    lines.append('          <line x1="5" y1="8" x2="11" y2="8" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>')
    lines.append('        </g>')
    lines.append('        <text x="116" y="28" class="mono" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">TẠO YÊU CẦU ĐỀN BÙ</text>')
    lines.append('      </g>')

    # Button 2: BBBT lookup (White outline)
    lines.append('      <g transform="translate(222, 0)">')
    lines.append('        <rect x="0" y="0" width="210" height="44" rx="4" fill="#FFFFFF" stroke="#334155" stroke-width="1.5"/>')
    lines.append('        <g transform="translate(12, 13)">')
    lines.append('          <rect x="1" y="1" width="12" height="15" rx="1.5" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.2"/>')
    lines.append('          <line x1="4" y1="5" x2="10" y2="5" stroke="#0F172A" stroke-width="1"/>')
    lines.append('          <line x1="4" y1="8" x2="8" y2="8" stroke="#0F172A" stroke-width="1"/>')
    lines.append('          <circle cx="12" cy="11" r="3.5" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.2"/>')
    lines.append('          <line x1="14.5" y1="13.5" x2="17" y2="16" stroke="#0284C7" stroke-width="1.4" stroke-linecap="round"/>')
    lines.append('        </g>')
    lines.append('        <text x="116" y="28" class="mono" font-size="14" font-weight="900" fill="#0F172A" text-anchor="middle">TRA CỨU BIÊN BẢN BBBT</text>')
    lines.append('      </g>')
    lines.append('    </g>')

    lines.append('    <text x="230" y="283" class="mono" font-size="13.5" font-weight="800" fill="#475569" text-anchor="middle">Grounded Output • Xác thực chéo cơ sở dữ liệu khiếu nại</text>')
    lines.append('  </g>')

    # Straight vertical arrow from LLM Engine up into Answer Card
    lines.append('  <!-- Path: LLM Generator UP -> Answer Document -->')
    lines.append('  <line x1="1772" y1="555" x2="1772" y2="487" stroke="#0F172A" stroke-width="2.4"/>')
    lines.append('  <polygon points="1772,480 1766,493 1778,493" fill="#0F172A"/>')
    lines.append('  <rect x="1697" y="506" width="150" height="28" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.4"/>')
    lines.append('  <text x="1772" y="525" class="mono" font-size="13.5" font-weight="900" fill="#1E293B" text-anchor="middle">Answer Token</text>')

    # =========================================================================
    # LONG BOTTOM USER PROMPT BRIDGE DIRECTLY INTO LLM
    # =========================================================================
    lines.append('  <!-- Long User Prompt Bridge directly into LLM -->')
    lines.append('  <path d="M 339 815 L 339 862 L 1772 862 L 1772 822" fill="none" stroke="#475569" stroke-width="2.4" stroke-dasharray="7,4"/>')
    lines.append('  <polygon points="1772,815 1766,828 1778,828" fill="#475569"/>')
    
    # Bridge Pill Label (Gentle light badge, human crafted)
    lines.append('  <rect x="730" y="845" width="600" height="34" rx="4" fill="#FFFFFF" stroke="#64748B" stroke-width="1.4"/>')
    lines.append('  <text x="1030" y="868" class="mono" font-size="15" font-weight="900" fill="#1E293B" text-anchor="middle">Đường dẫn câu hỏi gốc của người dùng (User Prompt Bridge)</text>')

    # =========================================================================
    # FOOTER BAR (CLEAN, GENTLE ACADEMIC / TECHNICAL FORMULATIONS & LEGEND)
    # =========================================================================
    lines.append('  <!-- ==================== FOOTER BAR ==================== -->')
    lines.append('  <g id="Footer_Bar" transform="translate(36, 934)">')
    lines.append('    <rect x="0" y="0" width="1848" height="114" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>')
    
    # Row 1: Title and Legend
    lines.append('    <text x="24" y="32" font-size="17.5" font-weight="900" fill="#0F172A">GHI CHÚ KỸ THUẬT &amp; CÔNG THỨC TOÁN HỌC ÁP DỤNG:</text>')
    
    # Legend (Gentle colors on light background)
    lines.append('    <g transform="translate(980, 14)">')
    lines.append('      <line x1="0" y1="16" x2="26" y2="16" stroke="#2563EB" stroke-width="3.5"/>')
    lines.append('      <polygon points="26,16 16,11 16,21" fill="#2563EB"/>')
    lines.append('      <text x="34" y="22" class="mono" font-size="15.5" font-weight="900" fill="#1D4ED8">1. Indexing (Ngoại tuyến)</text>')

    lines.append('      <line x1="270" y1="16" x2="296" y2="16" stroke="#059669" stroke-width="3.5"/>')
    lines.append('      <polygon points="296,16 286,11 286,21" fill="#059669"/>')
    lines.append('      <text x="304" y="22" class="mono" font-size="15.5" font-weight="900" fill="#047857">2. Retrieval (Truy xuất)</text>')

    lines.append('      <line x1="550" y1="16" x2="576" y2="16" stroke="#7C3AED" stroke-width="3.5"/>')
    lines.append('      <polygon points="576,16 566,11 566,21" fill="#7C3AED"/>')
    lines.append('      <text x="584" y="22" class="mono" font-size="15.5" font-weight="900" fill="#6D28D9">3. Generation (Sinh phản hồi)</text>')
    lines.append('    </g>')

    # Row 2 & 3: Mathematical formulas (Large, crisp, dark text on light gray)
    lines.append('    <text x="24" y="66" class="mono" font-size="16" font-weight="800" fill="#1E293B">• Tương đồng Cosine: cos(q, d) = (q · d) / (||q||₂ ||d||₂) = q · d  (Đã chuẩn hóa vector đơn vị L2-norm)</text>')
    lines.append('    <text x="24" y="96" class="mono" font-size="16" font-weight="800" fill="#1E293B">• Điểm tìm kiếm kết hợp: Score = 0.70·Sim_Cosine + Bonus_Thesaurus (≤ 0.35)   |   • Ngưỡng lọc: Score ≥ 0.15   |   • Cân nặng quy đổi: (Dài × Rộng × Cao) / 6000</text>')
    lines.append('  </g>')

    lines.append('</svg>')
    return '\n'.join(lines)

def main():
    target_paths = [
        os.path.abspath("docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/03-rag-core-components-pipeline.svg"),
        os.path.abspath("docs/graduation-thesis/diagrams/architecture/02-architecture-rag-core-components-pipeline.svg"),
    ]
    svg_content = generate_svg()
    
    # Validate XML once
    ET.fromstring(svg_content)
    
    for path in target_paths:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"SUCCESS: SVG written to:\n  {path}")

if __name__ == "__main__":
    main()
