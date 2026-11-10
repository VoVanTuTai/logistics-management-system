#!/usr/bin/env python3
"""
generate_paper1_fig1_infographic.py
Generates Figure 1 for Paper 1 following AGENTS.md Section 5 (Modern Technical Architecture
Infographic: SaaS Card-Based Pastel Semantic Coding, numbered badges 1-6, brand tech icons,
Step Summary Card, and Tech Stack Footer Bar), 100% aligned with:
  services/chatbot-service/src/chat/chat.service.ts
  services/chatbot-service/src/rag/vector-store.service.ts
  services/chatbot-service/src/tools/logistics-tools.service.ts
"""

import xml.etree.ElementTree as ET
from pathlib import Path
import subprocess

OUT_DIR = Path(__file__).resolve().parent / "diagrams"
OUT_DIR.mkdir(parents=True, exist_ok=True)
SVG_PATH = OUT_DIR / "fig1-guardrailed-agent-architecture.svg"
PNG_PATH = OUT_DIR / "fig1-guardrailed-agent-architecture.png"

FONT_SANS = "'Inter', 'Helvetica Neue', Arial, sans-serif"
FONT_MONO = "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace"


def esc(s: str) -> str:
    s = str(s).replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def arrow_head(x: float, y: float, d: str = "right", color: str = "#334155", sz: float = 9.0) -> str:
    w = sz * 0.56
    if d == "right":
        return f'<polygon points="{x},{y} {x-sz},{y-w} {x-sz},{y+w}" fill="{color}"/>'
    if d == "left":
        return f'<polygon points="{x},{y} {x+sz},{y-w} {x+sz},{y+w}" fill="{color}"/>'
    if d == "down":
        return f'<polygon points="{x},{y} {x-w},{y-sz} {x+w},{y-sz}" fill="{color}"/>'
    return f'<polygon points="{x},{y} {x-w},{y+sz} {x+w},{y+sz}" fill="{color}"/>'


def ortho_arrow(pts, dashed=False, end_dir="right", color="#334155", stroke_w=2.0):
    p_str = " ".join(f"{x},{y}" for x, y in pts)
    dash = ' stroke-dasharray="6 4"' if dashed else ""
    ex, ey = pts[-1]
    return (
        f'<polyline points="{p_str}" fill="none" stroke="{color}" stroke-width="{stroke_w}" '
        f'stroke-linejoin="round"{dash}/>\n'
        + arrow_head(ex, ey, end_dir, color=color, sz=9.0)
    )


def num_badge(cx: float, cy: float, n: str, bg: str = "#1D4ED8") -> str:
    return "\n".join([
        f'<circle cx="{cx}" cy="{cy}" r="14" fill="{bg}" stroke="#FFFFFF" stroke-width="2.5" filter="url(#cardShadow)"/>',
        f'<text x="{cx}" y="{cy + 4.8}" font-family="{FONT_SANS}" font-size="13.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">{esc(n)}</text>',
    ])


def pill_tag(x: float, y: float, text: str, bg: str = "#1E293B", fg: str = "#FFFFFF", fs: float = 10.5) -> str:
    w = len(text) * (fs * 0.60) + 14
    return "\n".join([
        f'<rect x="{x}" y="{y}" width="{w:.1f}" height="20" rx="10" fill="{bg}"/>',
        f'<text x="{x + w/2:.1f}" y="{y + 13.8}" font-family="{FONT_MONO}" font-size="{fs}" font-weight="700" fill="{fg}" text-anchor="middle">{esc(text)}</text>',
    ])


def semantic_card(
    x: float, y: float, w: float, h: float,
    step_num: str, title: str, subtitle: str,
    fill: str, border: str, header_bg: str, header_fg: str,
    badge_bg: str, lines: list, footer_chip: str = ""
) -> str:
    title_x = x + 34 if step_num else x + 14
    out = [
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="13" fill="{fill}" stroke="{border}" stroke-width="1.8" filter="url(#cardShadow)"/>',
        f'<path d="M {x} {y+42} L {x} {y+13} Q {x} {y} {x+13} {y} L {x+w-13} {y} Q {x+w} {y} {x+w} {y+13} L {x+w} {y+42} Z" fill="{header_bg}"/>',
        f'<line x1="{x}" y1="{y+42}" x2="{x+w}" y2="{y+42}" stroke="{border}" stroke-width="1.2"/>',
        f'<text x="{title_x}" y="{y+20}" font-family="{FONT_SANS}" font-size="13.8" font-weight="800" fill="{header_fg}">{esc(title)}</text>',
        f'<text x="{title_x}" y="{y+36}" font-family="{FONT_MONO}" font-size="10.8" font-weight="600" fill="{header_fg}" opacity="0.88">{esc(subtitle)}</text>',
        num_badge(x + 14, y + 18, step_num, bg=badge_bg) if step_num else "",
    ]
    cy = y + 61
    for kind, txt in lines:
        if kind == "bold":
            out.append(f'<text x="{x+14}" y="{cy}" font-family="{FONT_SANS}" font-size="12.2" font-weight="800" fill="#0F172A">{esc(txt)}</text>')
            cy += 19
        elif kind == "mono":
            out.append(f'<text x="{x+14}" y="{cy}" font-family="{FONT_MONO}" font-size="11.2" font-weight="700" fill="#1E293B">{esc(txt)}</text>')
            cy += 18
        elif kind == "note":
            out.append(f'<rect x="{x+12}" y="{cy-13}" width="{w-24}" height="22" rx="6" fill="#FFFFFF" stroke="{border}" stroke-width="1.1" stroke-dasharray="4 3"/>')
            out.append(f'<text x="{x+20}" y="{cy+2}" font-family="{FONT_MONO}" font-size="10.8" font-weight="800" fill="#0F172A">{esc(txt)}</text>')
            cy += 26
        else:
            out.append(f'<text x="{x+14}" y="{cy}" font-family="{FONT_SANS}" font-size="11.8" font-weight="500" fill="#1E293B">{esc(txt)}</text>')
            cy += 18.5

    if footer_chip:
        out.append(pill_tag(x + 12, y + h - 28, footer_chip, bg=badge_bg, fg="#FFFFFF", fs=10.0))
    return "\n".join([s for s in out if s])


def build_svg():
    W, H = 1480, 830
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
        '<defs>',
        '  <linearGradient id="hdrGrad" x1="0%" y1="0%" x2="100%" y2="0%">',
        '    <stop offset="0%" stop-color="#1E3A8A"/>',
        '    <stop offset="55%" stop-color="#1D4ED8"/>',
        '    <stop offset="100%" stop-color="#2563EB"/>',
        '  </linearGradient>',
        '  <filter id="cardShadow" x="-4%" y="-4%" width="108%" height="112%">',
        '    <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#0F172A" flood-opacity="0.08"/>',
        '  </filter>',
        '</defs>',
        f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>',

        # Header Banner (AGENTS.md Rule 5: Royal Blue #1D4ED8 / #1E3A8A)
        f'<rect x="18" y="14" width="{W-36}" height="68" rx="14" fill="url(#hdrGrad)" filter="url(#cardShadow)"/>',
        f'<text x="38" y="42" font-family="{FONT_SANS}" font-size="20.5" font-weight="800" fill="#FFFFFF" letter-spacing="0.2">GUARDRAILED AI AGENT ARCHITECTURE WITH HYBRID RAG &amp; TOOL CALLING</text>',
        f'<text x="38" y="65" font-family="{FONT_MONO}" font-size="12.2" font-weight="600" fill="#DBEAFE">services/chatbot-service (:3013, NestJS 10)  •  Deterministic Guards  •  3,072-d Hybrid RAG  •  HITL ActionChip &amp; 24h QA Escalation</text>',
        f'<rect x="{W-235}" y="25" width="198" height="46" rx="10" fill="#0F172A" fill-opacity="0.35" stroke="#93C5FD" stroke-width="1.2"/>',
        f'<text x="{W-136}" y="45" font-family="{FONT_MONO}" font-size="11.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">FIG. 1  •  REAL KLTN FLOW</text>',
        f'<text x="{W-136}" y="62" font-family="{FONT_MONO}" font-size="10.5" font-weight="600" fill="#BFDBFE" text-anchor="middle">Code-Verified Runtime</text>',

        # Dashed Runtime Enclosing Boundary (AGENTS.md Rule 5: #A5B4FC dashed wrapper)
        f'<rect x="268" y="96" width="1194" height="656" rx="16" fill="#F8FAFC" stroke="#818CF8" stroke-width="2.0" stroke-dasharray="8 5"/>',
        f'<rect x="284" y="82" width="380" height="21" rx="10.5" fill="#EEF2FF" stroke="#818CF8" stroke-width="1.3"/>',
        f'<text x="474" y="96.5" font-family="{FONT_MONO}" font-size="11.0" font-weight="800" fill="#3730A3" text-anchor="middle">ChatService.handleMessage() Runtime Container</text>',
    ]

    # DRAW CONNECTORS FIRST so cards/badges cleanly sit above line endpoints where needed
    # 1 -> 2 (Client -> Stage 0 Guards)
    parts.append(ortho_arrow([(240, 200), (290, 200)], color="#1D4ED8", stroke_w=2.3, end_dir="right"))
    # 2 -> 3 (Stage 0 -> Stage 1 Intent Router & Tools)
    parts.append(ortho_arrow([(475, 326), (475, 356)], color="#DC2626", stroke_w=2.3, end_dir="down"))
    # 3 <-> Microservices (Stage 1 Tools -> Backend Microservices & Ops Web)
    parts.append(ortho_arrow([(290, 515), (242, 515)], dashed=True, color="#059669", stroke_w=2.0, end_dir="left"))
    # 3 -> 4 (Stage 1 context -> Stage 2 Hybrid RAG)
    parts.append(ortho_arrow([(662, 420), (678, 420), (678, 250), (696, 250)], color="#0284C7", stroke_w=2.2, end_dir="right"))
    # 3 -> 5 (Tool Context directly -> Stage 3-4 LLM Synthesis)
    parts.append(ortho_arrow([(662, 575), (696, 575)], color="#059669", stroke_w=2.2, end_dir="right"))
    # 4 -> 5 (RAG Chunks -> LLM Prompt Synthesis)
    parts.append(ortho_arrow([(880, 412), (880, 438)], color="#0284C7", stroke_w=2.2, end_dir="down"))
    # 5 -> 6 (LLM Response -> HITL Gate & UI Output)
    parts.append(ortho_arrow([(1066, 540), (1084, 540), (1084, 285), (1102, 285)], color="#D97706", stroke_w=2.3, end_dir="right"))
    # 6 -> Client (feedback dashed arrow cleanly inside top aisle y=111)
    parts.append(ortho_arrow([(1270, 126), (1270, 111), (130, 111), (130, 118)], dashed=True, color="#D97706", stroke_w=1.8, end_dir="down"))

    # ① Left Column Top: Client Touchpoints (Slate #FFFFFF / #CBD5E1)
    parts.append(semantic_card(
        18, 120, 222, 240,
        "1", "Client Channels", "ChatController (:3013)",
        fill="#FFFFFF", border="#94A3B8", header_bg="#EFF6FF", header_fg="#1E3A8A", badge_bg="#1D4ED8",
        lines=[
            ("bold", "Caller Roles & Channels:"),
            ("text", "• CUSTOMER / SHOP Web & Mobile"),
            ("text", "• GUEST Public Tracking Portal"),
            ("mono", "POST /api/v1/chat/message"),
            ("mono", "POST /api/v1/chat/stream (SSE)"),
            ("bold", "Session Context Map:"),
            ("mono", "sessions<convId, Context>"),
            ("text", "Tracks selectedCode, slots, phone"),
        ],
        footer_chip="DTO Validated Ingress"
    ))

    # Left Column Bottom: Core Backend Microservices & Ops Web QA
    parts.append(semantic_card(
        x=18, y=382, w=222, h=350,
        step_num="", title="Core Microservices", subtitle="REST + Ops Web QA Workflow",
        fill="#FFFFFF", border="#94A3B8", header_bg="#F1F5F9", header_fg="#0F172A", badge_bg="#475569",
        lines=[
            ("bold", "Live Logistics Microservices:"),
            ("mono", "• tracking-service (:3008)"),
            ("text", "  Milestones & scan timeline"),
            ("mono", "• pricing-service (:3012)"),
            ("text", "  Tariff tiers & IATA billing"),
            ("mono", "• shipment-service (:3002)"),
            ("text", "  Order status & safe cancel"),
            ("bold", "Human QA Complaint Desk:"),
            ("mono", "• Ops Web (:5173) /claims"),
            ("text", "  Stray investigation & 24h"),
            ("text", "  CCTV/MinIO hearing window"),
            ("note", "AI never settles payouts"),
        ],
        footer_chip="Bounded Microservices"
    ))

    # ② Center-Left Top: Stage 0 Deterministic Guards (Rose/Red #FEF2F2 / #F87171)
    parts.append(semantic_card(
        x=292, y=126, w=370, h=198,
        step_num="2", title="Stage 0: Deterministic Guardrails", subtitle="Pre-Router Security & Policy Filters",
        fill="#FEF2F2", border="#F87171", header_bg="#FEE2E2", header_fg="#991B1B", badge_bg="#DC2626",
        lines=[
            ("text", "• Prohibited Goods Regex (explosives, acids, live pets)"),
            ("text", "• 3-Tier Physical Ceilings: <=70 kg, <=150 cm, D+R+C<=300 cm"),
            ("text", "• OWASP Prompt-Override & BOLA/IDOR Attack Filter"),
            ("text", "• isForcePayoutAttack: Stage 0 claim payout block"),
            ("note", "Short-circuits unsafe inputs -> 29/29 Stages 0-5"),
        ],
    ))

    # ③ Center-Left Bottom: Stage 1 Intent Router & Tools (Operations Mint #ECFDF5 / #34D399)
    parts.append(semantic_card(
        x=292, y=358, w=370, h=374,
        step_num="3", title="Stage 1: Intent Router & Tool Calling", subtitle="LogisticsToolsService + Guest PII Masking",
        fill="#ECFDF5", border="#34D399", header_bg="#D1FAE5", header_fg="#065F46", badge_bg="#059669",
        lines=[
            ("bold", "Rule & Session Slot Router:"),
            ("text", "Routes tracking, pricing, cancel, redelivery, claim"),
            ("bold", "Read-Only & Pricing Tools:"),
            ("mono", "• trackShipment / getUserShipments"),
            ("mono", "• calculatePricing (W_chg = max(W, LWH/6000))"),
            ("mono", "• calculateReturnFee / getStorageAgingPolicy"),
            ("mono", "• trackClaimStatus / getWaybillFormatPolicy"),
            ("bold", "Dynamic Guest PII Redaction:"),
            ("text", "Masks phone (0912****678) & street until 4-digit match"),
            ("bold", "Human CSKH/QA Escalation Tool:"),
            ("mono", "• escalateToHumanAgent() -> CSKH / Ops Web"),
            ("note", "Routing fixed (Nov 10): 6/6 collisions resolved"),
        ],
    ))

    # ④ Center-Right Top: Stage 2 Hybrid RAG Grounding (Knowledge Cyan #E0F2FE / #38BDF8)
    parts.append(semantic_card(
        x=698, y=126, w=368, h=284,
        step_num="4", title="Stage 2: Hybrid RAG Grounding", subtitle="VectorStoreService + EmbeddingService",
        fill="#E0F2FE", border="#38BDF8", header_bg="#BAE6FD", header_fg="#075985", badge_bg="#0284C7",
        lines=[
            ("bold", "9 Official Carrier SOP Docs -> 59 Chunks:"),
            ("text", "ChunkerService: heading split, <=250w, 40w overlap"),
            ("bold", "Dense Semantic Vector Search:"),
            ("mono", "models/gemini-embedding-001 (3,072 dims)"),
            ("text", "In-memory cosine over vector-index.json"),
            ("bold", "Vietnamese Lexical & Synonym Boost:"),
            ("text", "Diacritic strip + 13-entry logistics SYNONYMS map"),
            ("mono", "S(q,d) = 0.70*CosSim + min(0.35, 0.35*hits/|T|)"),
            ("text", "Filter: topK = 5, minScore = 0.15 -> Citations[]"),
            ("note", "Measured: Hit@1 100.0% (39/39) vs 92.3% Dense"),
        ],
    ))

    # ⑤ Center-Right Bottom: Stage 3-4 Multi-Provider LLM Waterfall (Blue/Slate #EFF6FF / #60A5FA)
    parts.append(semantic_card(
        x=698, y=440, w=368, h=292,
        step_num="5", title="Stage 3-4: Multi-Provider LLM Waterfall", subtitle="ChatService.executeLlm() (T = 0.20)",
        fill="#EFF6FF", border="#60A5FA", header_bg="#DBEAFE", header_fg="#1E3A8A", badge_bg="#2563EB",
        lines=[
            ("bold", "Prompt Grounding Context Concatenation:"),
            ("text", "[User/Role Info] + [Tool Context] + [Top-5 SOPs]"),
            ("bold", "Provider Fallback Cascade (Active Live Stack):"),
            ("mono", "[1] Google AI Studio: gemini-3.5-flash-lite"),
            ("mono", "[2] Groq LPU (Ops):   openai/gpt-oss-120b"),
            ("mono", "[3] Groq LPU (SOP):   qwen/qwen3.8-27b"),
            ("mono", "[4] Fallback: gpt-4o-mini -> Offline Temp."),
            ("bold", "Auxiliary Validation & Health Diagnostic:"),
            ("mono", "/multi-agent-health: nemotron-3.5-lightning"),
            ("note", "Honest audit: Critic not yet wired inside main flow"),
        ],
    ))

    # ⑥ Right Top: Mandatory HITL Gate & Structured Output (HITL Amber #FEF3C7 / #F59E0B)
    parts.append(semantic_card(
        x=1104, y=126, w=338, h=306,
        step_num="6", title="HITL Control Gate & Output", subtitle="Pre-Execution Lock + UI Rich Cards",
        fill="#FEF3C7", border="#F59E0B", header_bg="#FDE68A", header_fg="#92400E", badge_bg="#D97706",
        lines=[
            ("bold", "Human-in-the-Loop (HITL) Barriers:"),
            ("text", "• cancelShipment & addressChange emit ActionChip"),
            ("text", "  ('Confirm' UI lock); mutates only on user click"),
            ("text", "• Over-limit cargo (>70kg/150cm) -> FTL/Split"),
            ("text", "• COD >15M / Claims -> CSKH & 24h QA Hearing"),
            ("note", "Evaluated: 29/29 (100%) risk & HITL blocked"),
            ("bold", "Structured Response Payload:"),
            ("mono", "answer + citations[] + ShipmentCardDto[]"),
            ("mono", "actionChips[] (Confirm / Login / Phone / Escalate)"),
            ("text", "Eval (N=100): 97.0% Pass, Tier 4.44/5, p50 2.30s"),
        ],
    ))

    # Right Bottom: Step Summary Card (AGENTS.md Rule 5 requirement!)
    parts.append(f'<rect x="1104" y="454" width="338" height="278" rx="13" fill="#FFFFFF" stroke="#64748B" stroke-width="1.6" filter="url(#cardShadow)"/>')
    parts.append(f'<rect x="1104" y="454" width="338" height="36" rx="10" fill="#1E293B"/>')
    parts.append(f'<text x="1120" y="477" font-family="{FONT_SANS}" font-size="13.2" font-weight="800" fill="#FFFFFF">RUNTIME FLOW SUMMARY (STEPS 1-6)</text>')
    steps_sum = [
        ("1", "#1D4ED8", "Ingest query + load ChatSessionContext."),
        ("2", "#DC2626", "Screen contraband, <=70kg/150cm, OWASP, payouts."),
        ("3", "#059669", "Route intent, mask Guest PII, call REST tools."),
        ("4", "#0284C7", "Run 3,072-d Hybrid RAG + 13-term synonyms."),
        ("5", "#2563EB", "Ground reply via Gemini/Groq fallback waterfall."),
        ("6", "#D97706", "Enforce ActionChip HITL / QA handoff & Cards."),
    ]
    sy = 515
    for sn, col, stxt in steps_sum:
        parts.append(f'<circle cx="1125" cy="{sy-4}" r="10.5" fill="{col}"/>')
        parts.append(f'<text x="1125" y="{sy}" font-family="{FONT_SANS}" font-size="11.2" font-weight="800" fill="#FFFFFF" text-anchor="middle">{sn}</text>')
        parts.append(f'<text x="1144" y="{sy}" font-family="{FONT_SANS}" font-size="11.8" font-weight="600" fill="#1E293B">{esc(stxt)}</text>')
        sy += 35
    parts.append(f'<rect x="1116" y="698" width="314" height="24" rx="6" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>')
    parts.append(f'<text x="1273" y="714" font-family="{FONT_MONO}" font-size="10.4" font-weight="700" fill="#334155" text-anchor="middle">Single Pipeline != Autonomous Multi-Agent</text>')

    # Footer Tech Stack Summary Bar (AGENTS.md Rule 5 requirement + vector brand icons)
    parts.append(f'<rect x="18" y="766" width="{W-36}" height="50" rx="12" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>')
    parts.append(f'<rect x="28" y="776" width="142" height="30" rx="15" fill="#1D4ED8"/>')
    parts.append(f'<text x="99" y="795.5" font-family="{FONT_SANS}" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">KLTN TECH STACK</text>')

    # Brand vector badges along the footer bar (verified real technologies only)
    brands = [
        (184, "#E0234E", "NestJS 10", "N", 136),
        (332, "#2563EB", "Gemini 3.5 Flash-Lite", "G", 196),
        (540, "#0284C7", "gemini-embedding-001 (3,072d)", "E", 248),
        (800, "#059669", "Groq Qwen 3.8 & GPT-OSS 120B", "Q", 252),
        (1064, "#7C3AED", "OpenRouter Nemotron 3.5", "O", 204),
        (1280, "#334155", "REST / Prisma / MinIO", "P", 168),
    ]
    for bx, col, lbl, sym, bw in brands:
        parts.append(f'<rect x="{bx}" y="775" width="{bw}" height="32" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>')
        parts.append(f'<circle cx="{bx+16}" cy="791" r="10" fill="{col}"/>')
        parts.append(f'<text x="{bx+16}" y="795" font-family="{FONT_MONO}" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">{sym}</text>')
        parts.append(f'<text x="{bx+32}" y="795" font-family="{FONT_SANS}" font-size="11.6" font-weight="700" fill="#0F172A">{esc(lbl)}</text>')

    parts.append('</svg>')
    svg_text = "\n".join(parts)
    ET.fromstring(svg_text)
    SVG_PATH.write_text(svg_text, encoding="utf-8")
    print(f"[OK] Saved strict XML SVG to {SVG_PATH}")

    html_wrap = OUT_DIR / "_render_paper1_fig1.html"
    html_wrap.write_text(
        f'<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fff;">'
        f'<img src="{SVG_PATH.name}" style="display:block;width:{W}px;height:{H}px;"/></body></html>',
        encoding="utf-8",
    )
    cmd = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=2",
        f"--window-size={W},{H}",
        f"--screenshot={PNG_PATH}",
        html_wrap.as_uri(),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    html_wrap.unlink(missing_ok=True)
    if res.returncode != 0:
        raise RuntimeError(f"Chrome render failed: {res.stderr}")
    print(f"[OK] High-DPI PNG rendered to {PNG_PATH}")


if __name__ == "__main__":
    build_svg()
