#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE BESPOKE LOGISTICS DOCUMENT PREPROCESSING & METADATA HUB (V2 - LARGE TEXT & STRICT CODEBASE REFS)
=======================================================================================================
Bản vẽ Kỹ thuật Sư phạm Chuyên biệt cho Hệ thống Bưu chính Nexus Logistics.
- Kích thước chữ to, đậm, rõ ràng (Title: 30px, Headers: 18px, Body: 15px, Code: 14px).
- Bám sát 100% mã nguồn thực tế:
  * docs/knowledge-base/ (02-insurance-and-claim-policy.md, 01-pricing-and-iata-weight.md, 03-prohibited, 05-cod)
  * services/chatbot-service/src/rag/chunker.service.ts
  * Trích xuất song song Plain Text Payload và Phiếu Siêu dữ liệu Định danh (Logistics Metadata Manifest Slip).
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
    width = 1520
    height = 1040

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # STYLES DEFINITION (LARGE HIGH-LEGIBILITY ENTERPRISE TYPOGRAPHY)
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }')
    lines.append('      .main-title { font-size: 28px; font-weight: 900; fill: #0F172A; text-anchor: middle; letter-spacing: -0.4px; }')
    lines.append('      .sub-title { font-family: ui-monospace, Menlo, monospace; font-size: 15px; font-weight: 700; fill: #0284C7; text-anchor: middle; }')
    lines.append('      .zone-tag { font-size: 12px; font-weight: 800; fill: #FFFFFF; font-family: ui-monospace, monospace; text-anchor: middle; }')
    lines.append('      .card-hdr { font-size: 16.5px; font-weight: 800; fill: #0F172A; }')
    lines.append('      .card-body { font-size: 14.5px; fill: #334155; line-height: 1.45; }')
    lines.append('      .card-code { font-family: ui-monospace, Menlo, monospace; font-size: 13px; font-weight: 700; fill: #1D4ED8; }')
    lines.append('      .hub-step-title { font-size: 17.5px; font-weight: 800; fill: #0F172A; text-anchor: middle; }')
    lines.append('      .hub-step-desc { font-size: 14px; font-weight: 500; fill: #475569; text-anchor: middle; }')
    lines.append('      .hub-step-code { font-family: ui-monospace, monospace; font-size: 13px; font-weight: 700; fill: #B45309; text-anchor: middle; }')
    lines.append('      .manifest-label { font-size: 14.5px; font-weight: 700; fill: #475569; }')
    lines.append('      .manifest-val { font-family: ui-monospace, monospace; font-size: 14.5px; font-weight: 700; fill: #0F172A; }')
    lines.append('      .caption-txt { font-family: "Times New Roman", Times, serif; font-size: 22px; font-weight: 600; fill: #0F172A; text-anchor: middle; }')
    lines.append('      .flow-arrow { fill: none; stroke: #0F172A; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .flow-arrow-dashed { fill: none; stroke: #0284C7; stroke-width: 2.4; stroke-dasharray: 6,4; }')
    lines.append('      .arrowhead { fill: #0F172A; }')
    lines.append('      .arrowhead-blue { fill: #0284C7; }')
    lines.append('    ]]></style>')

    # Drop Shadow Filter
    lines.append('    <filter id="cardShadow" x="-4%" y="-4%" width="108%" height="110%" filterUnits="userSpaceOnUse">')
    lines.append('      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0F172A" flood-opacity="0.08"/>')
    lines.append('    </filter>')
    lines.append('  </defs>')
    lines.append('')

    # BACKGROUND
    lines.append(f'  <rect width="{width}" height="{height}" fill="#F8FAFC"/>')

    # HELPER: Arrowhead
    def arrow_head(x, y, direction="down", size=12):
        if direction == "down":
            return f'  <polygon points="{x},{y} {x-size*0.55},{y-size} {x+size*0.55},{y-size}" class="arrowhead"/>'
        elif direction == "up":
            return f'  <polygon points="{x},{y} {x-size*0.55},{y+size} {x+size*0.55},{y+size}" class="arrowhead"/>'
        elif direction == "right":
            return f'  <polygon points="{x},{y} {x-size},{y-size*0.55} {x-size},{y+size*0.55}" class="arrowhead"/>'
        elif direction == "left":
            return f'  <polygon points="{x},{y} {x+size},{y-size*0.55} {x+size},{y+size*0.55}" class="arrowhead"/>'

    # =========================================================================
    # 1. TOP BANNER: LOGISTICS SYSTEM IDENTITY
    # =========================================================================
    lines.append('  <!-- ==================== HEADER ==================== -->')
    lines.append('  <g id="Header_Banner">')
    lines.append(f'    <text x="{width/2}" y="42" class="main-title">TRUNG TÂM TIỀN XỬ LÝ &amp; RÚT TRÍCH SIÊU DỮ LIỆU TÀI LIỆU BƯU CHÍNH</text>')
    lines.append(f'    <text x="{width/2}" y="68" class="sub-title">NEXUS LOGISTICS KNOWLEDGE PREPROCESSING &amp; METADATA EXTRACTION HUB</text>')
    lines.append(f'    <line x1="60" y1="84" x2="{width-60}" y2="84" stroke="#CBD5E1" stroke-width="2.0"/>')
    lines.append('  </g>')

    # =========================================================================
    # 2. ZONE 1: 4 INPUT LOGISTICS DOCUMENTS (Y: 104 - 244)
    # =========================================================================
    lines.append('  <!-- ==================== ZONE 1: INPUT LOGISTICS DOCUMENTS ==================== -->')
    lines.append('  <g id="Zone1_Input_Docs">')

    docs = [
        {
            "tag": "SOP BỒI THƯỜNG", "tag_bg": "#DC2626",
            "file": "02-insurance-and-claim-policy.md",
            "title": "Quy chế Bồi thường & BBBT",
            "rule": "Bể vỡ trong 24h đền 100% khai giá",
            "cx": 215
        },
        {
            "tag": "CƯỚC IATA", "tag_bg": "#2563EB",
            "file": "01-pricing-and-iata-weight.md",
            "title": "Quy chuẩn Trọng lượng Quy đổi",
            "rule": "Công thức IATA: (D x R x C) / 6000",
            "cx": 575
        },
        {
            "tag": "AN NINH HÀNG CẤM", "tag_bg": "#D97706",
            "file": "03-prohibited-and-restricted-goods.md",
            "title": "Kiểm soát Hàng Cấm Vận chuyển",
            "rule": "Pin Lithium > 100Wh cấm bay đường không",
            "cx": 940
        },
        {
            "tag": "TÀI CHÍNH COD", "tag_bg": "#059669",
            "file": "05-cod-policy-and-finance.md",
            "title": "Chính sách Thu hộ & Ví Shop",
            "rule": "Đối soát tự động kỳ T+2 Thứ 3 & Thứ 5",
            "cx": 1300
        }
    ]

    card_w, card_h = 330, 134
    for d in docs:
        x = d["cx"] - card_w / 2
        y = 104
        lines.append(f'    <!-- Document Card: {d["file"]} -->')
        lines.append(f'    <rect x="{x}" y="{y}" width="{card_w}" height="{card_h}" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8" filter="url(#cardShadow)"/>')
        
        # Header Badge
        lines.append(f'    <rect x="{x+14}" y="{y+12}" width="165" height="24" rx="4" fill="{d["tag_bg"]}"/>')
        lines.append(f'    <text x="{x+96}" y="{y+29}" class="zone-tag">{xml_esc(d["tag"])}</text>')
        
        # File path
        lines.append(f'    <text x="{x+14}" y="{y+56}" class="card-code">{xml_esc(d["file"])}</text>')
        # Title
        lines.append(f'    <text x="{x+14}" y="{y+80}" class="card-hdr">{xml_esc(d["title"])}</text>')
        # Rule
        lines.append(f'    <text x="{x+14}" y="{y+104}" class="card-body">• {xml_esc(d["rule"])}</text>')

    lines.append('  </g>')

    # Connections from Zone 1 to Zone 2 Hub
    lines.append('  <!-- ==================== Ingestion Inflow Lines ==================== -->')
    lines.append('  <g id="Inflow_Lines">')
    lines.append('    <line x1="215" y1="238" x2="215" y2="270" class="flow-arrow"/>')
    lines.append('    <line x1="575" y1="238" x2="575" y2="270" class="flow-arrow"/>')
    lines.append('    <line x1="940" y1="238" x2="940" y2="270" class="flow-arrow"/>')
    lines.append('    <line x1="1300" y1="238" x2="1300" y2="270" class="flow-arrow"/>')
    lines.append('    <line x1="215" y1="270" x2="1300" y2="270" class="flow-arrow"/>')
    # Center funnel down into Zone 2 Conveyor
    lines.append(f'    <line x1="{width/2}" y1="270" x2="{width/2}" y2="310" class="flow-arrow"/>')
    lines.append(arrow_head(width/2, 315, "down", 13))
    lines.append('  </g>')

    # =========================================================================
    # 3. ZONE 2: LOGISTICS PREPROCESSING & PARSING HUB (Y: 320 - 510)
    # =========================================================================
    lines.append('  <!-- ==================== ZONE 2: CONVEYOR & PARSING HUB ==================== -->')
    lines.append('  <g id="Zone2_Parsing_Hub">')
    hub_x, hub_y, hub_w, hub_h = 60, 320, 1400, 190
    lines.append(f'    <rect x="{hub_x}" y="{hub_y}" width="{hub_w}" height="{hub_h}" rx="12" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.6" filter="url(#cardShadow)"/>')
    
    # Hub Title Banner
    lines.append(f'    <rect x="{hub_x}" y="{hub_y}" width="{hub_w}" height="42" rx="10" fill="#0F172A"/>')
    lines.append(f'    <text x="{hub_x+24}" y="{hub_y+28}" font-size="16.5px" font-weight="900" fill="#FFFFFF">BĂNG CHUYỀN PHÂN GIẢI &amp; CHUẨN HÓA TRI THỨC BƯU CHÍNH (services/chatbot-service/src/rag/chunker.service.ts)</text>')
    lines.append(f'    <rect x="{hub_x+hub_w-180}" y="{hub_y+8}" width="160" height="26" rx="4" fill="#1E293B"/>')
    lines.append(f'    <text x="{hub_x+hub_w-100}" y="{hub_y+25}" font-size="12.5px" font-weight="800" fill="#38BDF8" font-family="ui-monospace, monospace" text-anchor="middle">CHUNKER ENGINE</text>')

    # 3 Processing Nodes inside Hub
    mod_w, mod_h = 410, 125
    mod_y = hub_y + 54

    modules = [
        {
            "cx": hub_x + 225,
            "badge": "MODULE 01: AST INSPECTOR", "badge_bg": "#EFF6FF", "badge_txt": "#1D4ED8",
            "title": "Phân giải Cấu trúc AST",
            "d1": "Bóc tách cây tiêu đề (#, ##, ###) qua Regex",
            "d2": "Gán nhãn phân cấp: currentDoc > currentSectionTitle",
            "code": "headingMatch = line.match(/^(#{1,4})\\s+(.+)$/)"
        },
        {
            "cx": hub_x + 700,
            "badge": "MODULE 02: TEXT SANITIZER", "badge_bg": "#FEF3C7", "badge_txt": "#B45309",
            "title": "Làm sạch & Chuẩn hóa",
            "d1": "Loại bỏ cú pháp rác, tag HTML & ảnh nhúng",
            "d2": "Chuẩn hóa khoảng trắng & ước tính tokens",
            "code": "tokenEstimate: Math.round(words.length * 1.3)"
        },
        {
            "cx": hub_x + 1175,
            "badge": "MODULE 03: SLIDING WINDOW", "badge_bg": "#ECFDF5", "badge_txt": "#047857",
            "title": "Cắt đoạn Trượt Ngữ cảnh",
            "d1": "maxWordsPerChunk = 250 từ (~325 tokens)",
            "d2": "overlapWords = 40 từ (~16% gối đầu liên kết)",
            "code": "start += maxWordsPerChunk - overlapWords"
        }
    ]

    for m in modules:
        mx = m["cx"] - mod_w / 2
        lines.append(f'    <rect x="{mx}" y="{mod_y}" width="{mod_w}" height="{mod_h}" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.8"/>')
        
        # Module Pill
        lines.append(f'    <rect x="{mx+14}" y="{mod_y+10}" width="210" height="22" rx="4" fill="{m["badge_bg"]}"/>')
        lines.append(f'    <text x="{mx+119}" y="{mod_y+26}" font-size="11.5px" font-weight="800" fill="{m["badge_txt"]}" font-family="ui-monospace, monospace" text-anchor="middle">{xml_esc(m["badge"])}</text>')

        # Title
        lines.append(f'    <text x="{m["cx"]}" y="{mod_y+55}" class="hub-step-title">{xml_esc(m["title"])}</text>')
        # Details
        lines.append(f'    <text x="{m["cx"]}" y="{mod_y+78}" class="hub-step-desc">{xml_esc(m["d1"])}</text>')
        lines.append(f'    <text x="{m["cx"]}" y="{mod_y+98}" class="hub-step-desc">{xml_esc(m["d2"])}</text>')
        # Code reference
        lines.append(f'    <text x="{m["cx"]}" y="{mod_y+118}" class="hub-step-code">{xml_esc(m["code"])}</text>')

    # Arrows connecting Module 1 -> 2 -> 3
    lines.append(f'    <line x1="{hub_x+430}" y1="{mod_y+mod_h/2}" x2="{hub_x+495}" y2="{mod_y+mod_h/2}" class="flow-arrow"/>')
    lines.append(arrow_head(hub_x+495, mod_y+mod_h/2, "right", 11))

    lines.append(f'    <line x1="{hub_x+905}" y1="{mod_y+mod_h/2}" x2="{hub_x+970}" y2="{mod_y+mod_h/2}" class="flow-arrow"/>')
    lines.append(arrow_head(hub_x+970, mod_y+mod_h/2, "right", 11))

    lines.append('  </g>')

    # Routing from Hub down into 2 Specialized Output Lanes
    lines.append('  <!-- ==================== Dual Branching Lines ==================== -->')
    lines.append('  <g id="Dual_Branching_Lanes">')
    # Center drop from Hub bottom (Y: 510 to 546)
    lines.append(f'    <line x1="{width/2}" y1="510" x2="{width/2}" y2="546" class="flow-arrow"/>')
    # Branch left to X=400 and right to X=1120
    lines.append(f'    <path d="M {width/2} 546 L 400 546 L 400 590" class="flow-arrow"/>')
    lines.append(arrow_head(400, 595, "down", 13))

    lines.append(f'    <path d="M {width/2} 546 L 1120 546 L 1120 590" class="flow-arrow"/>')
    lines.append(arrow_head(1120, 595, "down", 13))

    # Badge labels along branching lines
    lines.append('    <rect x="250" y="533" width="300" height="28" rx="5" fill="#0284C7"/>')
    lines.append('    <text x="400" y="552" font-size="13px" font-weight="800" fill="#FFFFFF" font-family="ui-monospace, monospace" text-anchor="middle">NHÁNH 1: PLAIN TEXT PAYLOAD</text>')

    lines.append('    <rect x="970" y="533" width="300" height="28" rx="5" fill="#0F172A"/>')
    lines.append('    <text x="1120" y="552" font-size="13px" font-weight="800" fill="#FFFFFF" font-family="ui-monospace, monospace" text-anchor="middle">NHÁNH 2: METADATA MANIFEST</text>')
    lines.append('  </g>')

    # =========================================================================
    # 4. ZONE 3: DUAL STANDARDIZED LOGISTICS OUTPUTS (Y: 605 - 895)
    # =========================================================================
    lines.append('  <!-- ==================== ZONE 3: DUAL LOGISTICS OUTPUTS ==================== -->')
    lines.append('  <g id="Zone3_Outputs">')

    # OUTPUT 1 (LEFT): CLEAN PLAIN TEXT PAYLOAD (248 WORDS CHUNK)
    out1_x, out1_y, out1_w, out1_h = 80, 605, 650, 290
    lines.append(f'    <rect x="{out1_x}" y="{out1_y}" width="{out1_w}" height="{out1_h}" rx="10" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.4" filter="url(#cardShadow)"/>')
    
    # Header bar
    lines.append(f'    <rect x="{out1_x}" y="{out1_y}" width="{out1_w}" height="40" rx="8" fill="#0284C7"/>')
    lines.append(f'    <text x="{out1_x+20}" y="{out1_y+26}" font-size="16px" font-weight="900" fill="#FFFFFF">GÓI TRI THỨC THUẦN TÚY (PLAIN TEXT PAYLOAD)</text>')
    lines.append(f'    <rect x="{out1_x+out1_w-145}" y="{out1_y+7}" width="130" height="26" rx="4" fill="#0369A1"/>')
    lines.append(f'    <text x="{out1_x+out1_w-80}" y="{out1_y+24}" font-size="12px" font-weight="800" fill="#FFFFFF" font-family="ui-monospace, monospace" text-anchor="middle">248 WORDS (~322 TOK)</text>')

    # Excerpt Content inside Document
    ctx_y = out1_y + 68
    lines.append(f'    <text x="{out1_x+20}" y="{ctx_y}" font-size="16px" font-weight="800" fill="#0F172A">Trích đoạn Điều 4.2: Quy chế bồi thường bưu phẩm bể vỡ</text>')
    
    lines.append(f'    <text x="{out1_x+20}" y="{ctx_y+30}" class="card-body">"Khi phát hiện bưu phẩm/bưu kiện bị bể vỡ hoặc hư hỏng một phần</text>')
    lines.append(f'    <text x="{out1_x+20}" y="{ctx_y+54}" class="card-body">trong quá trình vận chuyển, bưu cục phát có trách nhiệm lập Biên bản</text>')
    lines.append(f'    <text x="{out1_x+20}" y="{ctx_y+78}" class="card-body">bất thường (BBBT) xác nhận hiện trạng trong vòng 24 giờ kể từ khi phát.</text>')
    lines.append(f'    <text x="{out1_x+20}" y="{ctx_y+104}" font-size="14.5px" font-weight="700" fill="#15803D">• Mức bồi thường: 100% giá trị khai giá đối với đơn có bảo hiểm.</text>')
    lines.append(f'    <text x="{out1_x+20}" y="{ctx_y+128}" font-size="14.5px" font-weight="700" fill="#15803D">• Ngưỡng duyệt tự động (Auto-Approval): Tối đa 2.000.000 VNĐ."</text>')

    # Badge footer
    lines.append(f'    <rect x="{out1_x+20}" y="{out1_y+out1_h-45}" width="{out1_w-40}" height="30" rx="4" fill="#F0F9FF" stroke="#BAE6FD" stroke-width="1.5"/>')
    lines.append(f'    <text x="{out1_x+out1_w/2}" y="{out1_y+out1_h-25}" font-size="13px" font-weight="700" fill="#0284C7" text-anchor="middle">Đầu vào cho Mô hình Nhúng: OpenAI text-embedding-3-small (1536-D)</text>')

    # OUTPUT 2 (RIGHT): LOGISTICS METADATA MANIFEST SLIP
    out2_x, out2_y, out2_w, out2_h = 790, 605, 650, 290
    lines.append(f'    <rect x="{out2_x}" y="{out2_y}" width="{out2_w}" height="{out2_h}" rx="10" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.4" filter="url(#cardShadow)"/>')
    
    # Header bar
    lines.append(f'    <rect x="{out2_x}" y="{out2_y}" width="{out2_w}" height="40" rx="8" fill="#0F172A"/>')
    lines.append(f'    <text x="{out2_x+20}" y="{out2_y+26}" font-size="16px" font-weight="900" fill="#FFFFFF">PHIẾU SIÊU DỮ LIỆU ĐỊNH DANH (METADATA MANIFEST)</text>')
    lines.append(f'    <rect x="{out2_x+out2_w-135}" y="{out2_y+7}" width="120" height="26" rx="4" fill="#334155"/>')
    lines.append(f'    <text x="{out2_x+out2_w-75}" y="{out2_y+24}" font-size="11.5px" font-weight="800" fill="#38BDF8" font-family="ui-monospace, monospace" text-anchor="middle">VALIDATED SLIP</text>')

    # Structured Manifest Rows
    manifest_rows = [
        ("id", "02-insurance-and-claim-policy.md#chunk-4", "#2563EB"),
        ("sourceFile", "docs/knowledge-base/02-insurance-and-claim-policy.md", "#0F172A"),
        ("sectionTitle", "Điều 4.2 > Quy chế bồi thường hàng bể vỡ", "#0F172A"),
        ("domainScope", "INSURANCE_AND_CLAIM (Bảo hiểm & Khiếu nại)", "#D97706"),
        ("slaDeadline", "24 giờ (Thời hạn lập Biên bản bất thường BBBT)", "#DC2626"),
        ("autoApprove", "True (Số tiền duyệt tự động <= 2.000.000 VNĐ)", "#059669")
    ]

    m_y = out2_y + 70
    for field, val, val_col in manifest_rows:
        lines.append(f'    <text x="{out2_x+20}" y="{m_y}" class="manifest-label">{xml_esc(field)}:</text>')
        lines.append(f'    <text x="{out2_x+135}" y="{m_y}" class="manifest-val" fill="{val_col}">{xml_esc(val)}</text>')
        m_y += 30

    # Badge footer
    lines.append(f'    <rect x="{out2_x+20}" y="{out2_y+out2_h-45}" width="{out2_w-40}" height="30" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>')
    lines.append(f'    <text x="{out2_x+out2_w/2}" y="{out2_y+out2_h-25}" font-size="13px" font-weight="700" fill="#475569" text-anchor="middle">Sử dụng phục vụ Lọc Siêu dữ liệu (Metadata Filtering) &amp; Trích dẫn Pháp lý</text>')

    lines.append('  </g>')

    # =========================================================================
    # 5. ACADEMIC CAPTION (BOTTOM)
    # =========================================================================
    lines.append('  <!-- ==================== CAPTION ==================== -->')
    lines.append(f'  <text x="{width/2}" y="970" class="caption-txt">Hình 2.4: Trung tâm tiền xử lý, bóc tách cấu trúc AST và rút trích siêu dữ liệu tài liệu bưu chính trong Hệ thống Nexus Logistics.</text>')
    lines.append(f'  <text x="{width/2}" y="1000" font-size="14.5px" font-weight="600" fill="#64748B" text-anchor="middle">Thiết kế chuẩn hóa bám sát ChunkerService (@NEXUS/chatbot-service) - Phục vụ Thuyết minh Khóa luận Tốt nghiệp Kỹ sư CNTT</text>')

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

    # Target path
    target_path = "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/04-logistics-document-metadata-extraction.svg"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"✓ Generated successfully: {target_path} ({len(svg_content.encode('utf-8'))} bytes)")
