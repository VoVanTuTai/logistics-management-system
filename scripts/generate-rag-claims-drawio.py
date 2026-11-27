#!/usr/bin/env python3
"""
Generate TWO True Component-Flow Architecture Diagrams (Classic Draw.io Style)
showing HOW components collaborate and pass data artifacts to produce the claim-handling result:
  1. nexus-rag-claims-overview.{svg,drawio}  — Clean Component Architecture Overview (compact blocks + clear data flow)
  2. nexus-rag-claims-pipeline.{svg,drawio}  — Detailed Component Interaction Architecture (Offline Indexing + Online Hybrid RAG & Claims Execution)

100% verified against actual codebase:
  - chunker.service.ts:      Heading split + Sliding Window (250 words, 40 overlap) -> 59 chunks
  - embedding.service.ts:    models/gemini-embedding-001 (3072-D)
  - vector-store.service.ts: vector-index.json (RAM), 0.70*Cosine + min(0.35, Keyword/Thesaurus), minScore>=0.15, Top-5
  - chat.service.ts:         Stage-0 OWASP/Financial Block, Intent Router, trackClaimStatus/trackShipment, Active Clarification,
                             OpenRouter Validation Agent (nvidia/nemotron-3.5-lightning:free), Grounded Prompt Builder,
                             Multi-LLM Waterfall (gemini-3.5-flash-lite -> Groq gpt-oss-120b / qwen3.8-27b)
"""

import base64
import html as html_lib
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "architecture" / "diagrams"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FONT = "Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif"

COL_BLUE = "#0284C7"
COL_BLUE_TXT = "#0369A1"
COL_INDIGO = "#6366F1"
COL_INDIGO_TXT = "#3730A3"
COL_TEAL = "#0F766E"
COL_TEAL_TXT = "#115E59"
COL_AMBER = "#D97706"
COL_AMBER_TXT = "#B45309"
COL_RED = "#DC2626"
COL_RED_TXT = "#991B1B"


def esc(s: str) -> str:
    return html_lib.escape(str(s), quote=True)


# =============================================================================
# CRISP COMPONENT LOGOS & ICONS
# =============================================================================

LOGOS = {
    "user_chat": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76 62">
      <circle cx="22" cy="18" r="9" fill="#FFFFFF" stroke="#111111" stroke-width="2"/>
      <path d="M7 50 C7 37 37 37 37 50" fill="#FFFFFF" stroke="#111111" stroke-width="2"/>
      <rect x="36" y="8" width="35" height="24" rx="5" fill="#EFF6FF" stroke="#2563EB" stroke-width="2"/>
      <polygon points="44,32 38,39 50,32" fill="#EFF6FF" stroke="#2563EB" stroke-width="1.6"/>
      <line x1="43" y1="16" x2="64" y2="16" stroke="#2563EB" stroke-width="2" stroke-linecap="round"/>
      <line x1="43" y1="23" x2="58" y2="23" stroke="#60A5FA" stroke-width="2" stroke-linecap="round"/>
    </svg>""",

    "shield_red": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 62">
      <path d="M28 4 L50 13 V30 C50 44 40 53 28 58 C16 53 6 44 6 30 V13 Z" fill="#FEF2F2" stroke="#DC2626" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M18 31 L25 38 L39 22" fill="none" stroke="#DC2626" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>""",

    "router_icon": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 54">
      <circle cx="14" cy="27" r="6" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="2.2"/>
      <circle cx="48" cy="11" r="5.5" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="2"/>
      <circle cx="48" cy="27" r="5.5" fill="#FFFFFF" stroke="#0F766E" stroke-width="2"/>
      <circle cx="48" cy="43" r="5.5" fill="#FFFFFF" stroke="#D97706" stroke-width="2"/>
      <path d="M20 24 L42 12 M20 27 L42 27 M20 30 L42 42" fill="none" stroke="#111111" stroke-width="1.8"/>
    </svg>""",

    "md_docs": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66 58">
      <rect x="15" y="4" width="40" height="46" rx="3" fill="#F8FAFC" stroke="#64748B" stroke-width="1.5"/>
      <rect x="7" y="9" width="40" height="46" rx="3" fill="#FFFFFF" stroke="#111111" stroke-width="1.9"/>
      <line x1="14" y1="20" x2="39" y2="20" stroke="#1D4ED8" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="14" y1="28" x2="41" y2="28" stroke="#475569" stroke-width="1.6"/>
      <line x1="14" y1="35" x2="36" y2="35" stroke="#475569" stroke-width="1.6"/>
      <rect x="24" y="39" width="26" height="14" rx="3" fill="#1E293B"/>
      <text x="37" y="49" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="8.5" font-weight="700" fill="#FFFFFF">.MD</text>
    </svg>""",

    "chunk_icon": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 50">
      <rect x="4" y="6" width="24" height="14" rx="2" fill="#EFF6FF" stroke="#2563EB" stroke-width="1.8"/>
      <rect x="20" y="18" width="24" height="14" rx="2" fill="#DBEAFE" stroke="#1D4ED8" stroke-width="1.8"/>
      <rect x="36" y="30" width="26" height="14" rx="2" fill="#EFF6FF" stroke="#2563EB" stroke-width="1.8"/>
      <line x1="20" y1="5" x2="20" y2="45" stroke="#DC2626" stroke-width="1.4" stroke-dasharray="3,2"/>
      <line x1="36" y1="5" x2="36" y2="45" stroke="#DC2626" stroke-width="1.4" stroke-dasharray="3,2"/>
    </svg>""",

    "vector_db": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 58">
      <ellipse cx="32" cy="12" rx="22" ry="7" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="2"/>
      <path d="M10 12 V44 A22 7 0 0 0 54 44 V12" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="2"/>
      <path d="M10 23 A22 7 0 0 0 54 23" fill="none" stroke="#93C5FD" stroke-width="1.6"/>
      <path d="M10 34 A22 7 0 0 0 54 34" fill="none" stroke="#93C5FD" stroke-width="1.6"/>
      <text x="32" y="42" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="9.5" font-weight="800" fill="#1D4ED8">JSON</text>
    </svg>""",

    "fusion_icon": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 50">
      <circle cx="28" cy="25" r="18" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="2.2"/>
      <line x1="28" y1="15" x2="28" y2="35" stroke="#1D4ED8" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="18" y1="25" x2="38" y2="25" stroke="#1D4ED8" stroke-width="2.6" stroke-linecap="round"/>
    </svg>""",

    "tools_api": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 62 56">
      <circle cx="26" cy="30" r="13" fill="#F0FDFA" stroke="#0F766E" stroke-width="2.2"/>
      <circle cx="26" cy="30" r="4.5" fill="#FFFFFF" stroke="#0F766E" stroke-width="1.8"/>
      <g stroke="#0F766E" stroke-width="3.2" stroke-linecap="round">
        <line x1="26" y1="12" x2="26" y2="15"/>
        <line x1="26" y1="45" x2="26" y2="48"/>
        <line x1="8" y1="30" x2="11" y2="30"/>
        <line x1="41" y1="30" x2="44" y2="30"/>
      </g>
      <rect x="34" y="6" width="24" height="16" rx="4" fill="#0F766E"/>
      <text x="46" y="17" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="9" font-weight="700" fill="#FFFFFF">API</text>
    </svg>""",

    "prompt_box": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 52">
      <rect x="6" y="6" width="52" height="40" rx="5" fill="#FFFBEB" stroke="#D97706" stroke-width="2"/>
      <line x1="14" y1="17" x2="46" y2="17" stroke="#B45309" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="14" y1="26" x2="50" y2="26" stroke="#1D4ED8" stroke-width="2" stroke-linecap="round"/>
      <line x1="14" y1="35" x2="40" y2="35" stroke="#0F766E" stroke-width="2" stroke-linecap="round"/>
    </svg>""",

    "gemini": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 116 36">
      <defs>
        <linearGradient id="gSt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4285F4"/>
          <stop offset="55%" stop-color="#9B72CB"/>
          <stop offset="100%" stop-color="#D96570"/>
        </linearGradient>
      </defs>
      <path d="M18 3 C18.7 12.5 23 16.8 32.5 17.5 C23 18.2 18.7 22.5 18 32 C17.3 22.5 13 18.2 3.5 17.5 C13 16.8 17.3 12.5 18 3 Z" fill="url(#gSt)"/>
      <text x="39" y="23" font-family="Helvetica,Arial,sans-serif" font-size="15.5" font-weight="700" fill="#1F2937">Gemini</text>
    </svg>""",

    "groq": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 34">
      <rect x="2" y="3" width="96" height="28" rx="6" fill="#FFF7ED" stroke="#F55036" stroke-width="2"/>
      <text x="50" y="22" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="13.5" font-weight="800" fill="#F55036">Groq LPU</text>
    </svg>""",

    "openrouter": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 114 34">
      <rect x="2" y="3" width="110" height="28" rx="6" fill="#F5F3FF" stroke="#6D28D9" stroke-width="2"/>
      <text x="57" y="22" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="13" font-weight="800" fill="#6D28D9">OpenRouter</text>
    </svg>""",

    "hitl_qa": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 56">
      <circle cx="25" cy="16" r="9" fill="#FEF3C7" stroke="#B45309" stroke-width="2"/>
      <path d="M10 48 C10 35 40 35 40 48" fill="#FEF3C7" stroke="#B45309" stroke-width="2"/>
      <circle cx="48" cy="36" r="13" fill="#FFFFFF" stroke="#16A34A" stroke-width="2.2"/>
      <path d="M41 36 L46 41 L55 31" fill="none" stroke="#16A34A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>""",

    "output_card": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66 56">
      <rect x="6" y="6" width="54" height="44" rx="5" fill="#F0FDF4" stroke="#16A34A" stroke-width="2"/>
      <line x1="14" y1="18" x2="48" y2="18" stroke="#15803D" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="14" y1="27" x2="50" y2="27" stroke="#374151" stroke-width="1.8"/>
      <rect x="14" y="34" width="18" height="9" rx="3" fill="#DBEAFE" stroke="#2563EB" stroke-width="1.2"/>
      <rect x="35" y="34" width="18" height="9" rx="3" fill="#FEF3C7" stroke="#D97706" stroke-width="1.2"/>
    </svg>""",
}


def logo_uri(name: str) -> str:
    return "data:image/svg+xml;base64," + base64.b64encode(LOGOS[name].strip().encode("utf-8")).decode("ascii")


def img_svg(name, x, y, w, h):
    return f'<image x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" href="{logo_uri(name)}"/>'


def box(x, y, w, h, title=None, title_align="left", dashed=False, dash_pattern="9,5",
        sw=1.4, stroke="#111111", fill="#FFFFFF", title_color="#111111", title_size=13):
    da = f' stroke-dasharray="{dash_pattern}"' if dashed else ""
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{da}/>']
    if title:
        if title_align == "left":
            out.append(f'<text x="{x+10}" y="{y+20}" font-family="{FONT}" font-size="{title_size}" font-weight="700" fill="{title_color}">{esc(title)}</text>')
        else:
            out.append(f'<text x="{x+w/2:.1f}" y="{y+20}" text-anchor="middle" font-family="{FONT}" font-size="{title_size}" font-weight="700" fill="{title_color}">{esc(title)}</text>')
    return "\n".join(out)


def label(x, y, text, size=11, bold=False, color="#111111", align="middle"):
    fw = "700" if bold else "400"
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{align}" font-family="{FONT}" font-size="{size}" font-weight="{fw}" fill="{color}">{esc(text)}</text>'


def arrow(pts, text=None, tpos=None, dashed=False, both=False, sw=1.4, stroke="#111111"):
    da = ' stroke-dasharray="5,4"' if dashed else ""
    d = "M " + " L ".join(f"{px:.1f} {py:.1f}" for px, py in pts)
    m_end = ' marker-end="url(#arr)"'
    m_start = ' marker-start="url(#arrStart)"' if both else ""
    out = [f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="miter"{da}{m_start}{m_end}/>']
    if text and tpos:
        tx, ty = tpos
        lines = text.split("\n")
        pw = max(len(ln) for ln in lines) * 6.5 + 12
        ph = len(lines) * 14 + 6
        out.append(f'<rect x="{tx - pw/2:.1f}" y="{ty - ph/2:.1f}" width="{pw:.1f}" height="{ph:.1f}" fill="#FFFFFF" fill-opacity="0.96"/>')
        for i, ln in enumerate(lines):
            ly = ty - (len(lines) - 1) * 7 + i * 14 + 4
            out.append(f'<text x="{tx:.1f}" y="{ly:.1f}" text-anchor="middle" font-family="{FONT}" font-size="11" font-weight="700" fill="#111111">{esc(ln)}</text>')
    return "\n".join(out)


def svg_wrap(w, h, parts):
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#111111"/>
    </marker>
    <marker id="arrStart" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 10 1 L 0 5 L 10 9 z" fill="#111111"/>
    </marker>
  </defs>
{chr(10).join(parts)}
</svg>
"""


class DrawioBuilder:
    def __init__(self, w, h, name):
        self.w, self.h, self.name = w, h, name
        self.cells = []
        self.seq = 2

    def nid(self):
        v = str(self.seq)
        self.seq += 1
        return v

    def rect(self, x, y, w, h, title="", align="left", dashed=False, dash_pat="9 5",
             sw=1.4, stroke="#111111", valign="top", font_size=12.5, font_color="#111111"):
        cid = self.nid()
        st = (
            f"rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor={stroke};"
            f"strokeWidth={sw};verticalAlign={valign};align={align};fontFamily=Helvetica;fontSize={font_size};"
            f"fontStyle=1;fontColor={font_color};spacingLeft=8;spacingTop=5;"
        )
        if dashed:
            st += f"dashed=1;dashPattern={dash_pat};"
        self.cells.append(
            f'        <mxCell id="{cid}" value="{esc(title)}" style="{st}" vertex="1" parent="1">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>\n'
            f'        </mxCell>'
        )
        return cid

    def img(self, logo_name, x, y, w, h):
        cid = self.nid()
        st = f"shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;imageAspect=0;aspect=fixed;image={logo_uri(logo_name)};"
        self.cells.append(
            f'        <mxCell id="{cid}" value="" style="{st}" vertex="1" parent="1">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>\n'
            f'        </mxCell>'
        )
        return cid

    def txt(self, x, y, w, h, val, size=10, bold=False, color="#111111", align="center"):
        cid = self.nid()
        fs = "1" if bold else "0"
        st = f"text;html=1;strokeColor=none;fillColor=none;align={align};verticalAlign=middle;whiteSpace=wrap;fontFamily=Helvetica;fontSize={size};fontStyle={fs};fontColor={color};"
        self.cells.append(
            f'        <mxCell id="{cid}" value="{esc(val)}" style="{st}" vertex="1" parent="1">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>\n'
            f'        </mxCell>'
        )
        return cid

    def edge(self, src, tgt, val="", dashed=False, both=False, wps=None):
        cid = self.nid()
        st = (
            "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"
            "strokeColor=#111111;strokeWidth=1.4;fontFamily=Helvetica;fontSize=11;fontStyle=1;"
            "fontColor=#111111;labelBackgroundColor=#FFFFFF;endArrow=classic;endFill=1;"
        )
        if dashed:
            st += "dashed=1;dashPattern=5 4;"
        if both:
            st += "startArrow=classic;startFill=1;"
        wp = '<Array as="points">' + "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in wps) + "</Array>" if wps else ""
        self.cells.append(
            f'        <mxCell id="{cid}" value="{esc(val)}" style="{st}" edge="1" parent="1" source="{src}" target="{tgt}">\n'
            f'          <mxGeometry relative="1" as="geometry">{wp}</mxGeometry>\n'
            f'        </mxCell>'
        )
        return cid

    def render(self):
        return f"""<mxfile host="app.diagrams.net" modified="2026-11-18T09:24:00.000Z" agent="Antigravity" version="24.7.17" type="device">
  <diagram id="{self.name.lower().replace(' ', '-')}" name="{esc(self.name)}">
    <mxGraphModel dx="{self.w + 40}" dy="{self.h + 40}" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{self.w}" pageHeight="{self.h}" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
{chr(10).join(self.cells)}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
"""


# =============================================================================
# DIAGRAM 1: TỔNG QUAN COMPONENT ARCHITECTURE (1120 x 980)
# Compact iconic components + rich data-flow arrows showing HOW they produce the result!
# =============================================================================

def build_overview():
    W1, H1 = 1136, 980
    p = [f'<rect x="0" y="0" width="{W1}" height="{H1}" fill="#FFFFFF"/>']
    d = DrawioBuilder(W1, H1, "RAG Claims Architecture Overview")

    # 1. User Client (Top-Left)
    p.append(box(52, 48, 178, 108, "User / Merchant", title_align="center", title_size=12.5))
    p.append(img_svg("user_chat", 104, 76, 70, 56))
    p.append(label(141, 146, "Chat UI (SSE / REST)", size=10, color="#4B5563"))

    u_id = d.rect(52, 48, 178, 108, "User / Merchant", align="center")
    d.img("user_chat", 104, 76, 70, 56)
    d.txt(56, 134, 170, 18, "Chat UI (SSE / REST)", size=9.8, color="#4B5563")

    # 2. Security Gatekeeper (Top-Center — compact!)
    p.append(box(340, 48, 212, 108, "Security Gatekeeper", title_align="center", stroke=COL_RED, sw=2.0, title_color=COL_RED_TXT, title_size=12.5))
    p.append(img_svg("shield_red", 420, 76, 50, 54))
    p.append(label(446, 145, "OWASP · PII · Block Payout", size=10, color="#991B1B", bold=True))

    g_id = d.rect(340, 48, 212, 108, "Security Gatekeeper", align="center", stroke=COL_RED, sw=2.0, font_color=COL_RED_TXT)
    d.img("shield_red", 420, 76, 50, 54)
    d.txt(344, 134, 204, 18, "<b>OWASP · PII · Block Payout</b>", size=9.8, color="#991B1B")

    # 3. Intent Router (Top-Right — compact!)
    p.append(box(664, 48, 206, 108, "Intent Router", title_align="center", title_size=12.5))
    p.append(img_svg("router_icon", 738, 78, 58, 50))
    p.append(label(767, 145, "Policy / CLM / Damage / HITL", size=10, color="#4B5563"))

    r_id = d.rect(664, 48, 206, 108, "Intent Router", align="center")
    d.img("router_icon", 738, 78, 58, 50)
    d.txt(668, 134, 198, 18, "Policy / CLM / Damage / HITL", size=9.8, color="#4B5563")

    # Reject short-circuit box (far right top, natural!)
    p.append(box(942, 62, 136, 78, "Refusal", title_align="center", stroke=COL_RED, title_color=COL_RED_TXT, title_size=12))
    p.append(label(1010, 107, "Chặn vi phạm /", size=10, color="#991B1B", bold=True))
    p.append(label(1010, 123, "tự duyệt tiền", size=10, color="#991B1B", bold=True))

    rej_id = d.rect(942, 62, 136, 78, "Refusal\nChặn vi phạm /\ntự duyệt tiền", align="center", valign="middle", stroke=COL_RED, font_color=COL_RED_TXT, font_size=10.5)

    # 4. MIDDLE LEFT: Knowledge Retrieval Cluster (Bold Indigo Dashed — compact collaborating blocks!)
    p.append(box(52, 240, 496, 250, "Hybrid RAG Retrieval", dashed=True, sw=2.4, stroke=COL_INDIGO, title_color=COL_INDIGO_TXT))

    p.append(box(74, 282, 134, 90, "9 SOP .md", title_align="center", title_size=11.5))
    p.append(img_svg("md_docs", 112, 308, 58, 50))

    p.append(box(248, 282, 134, 90, "Vector Index", title_align="center", title_size=11.5))
    p.append(img_svg("vector_db", 285, 306, 60, 52))
    p.append(label(315, 368, "59 chunks · 3072-D", size=9.2, color="#1D4ED8", bold=True))

    p.append(box(196, 404, 326, 68, "Hybrid Search Engine", title_align="left", title_size=12))
    p.append(img_svg("fusion_icon", 210, 424, 42, 38))
    p.append(label(262, 442, "0.70 × Cosine + Keyword/Thesaurus", size=10.5, bold=True, color="#1D4ED8", align="start"))
    p.append(label(262, 459, "Top-5 SOP Chunks (minScore ≥ 0.15)", size=9.8, color="#4B5563", align="start"))

    rag_c = d.rect(52, 240, 496, 250, "Hybrid RAG Retrieval", dashed=True, sw=2.4, stroke=COL_INDIGO, font_color=COL_INDIGO_TXT)
    kb_id = d.rect(74, 282, 134, 90, "9 SOP .md", align="center", font_size=11.5)
    d.img("md_docs", 112, 308, 58, 50)
    vs_id = d.rect(248, 282, 134, 90, "Vector Index", align="center", font_size=11.5)
    d.img("vector_db", 285, 306, 60, 52)
    hs_id = d.rect(196, 404, 326, 68, "Hybrid Search Engine", font_size=12)
    d.img("fusion_icon", 210, 424, 42, 38)
    d.txt(258, 426, 256, 38, "<font color='#1D4ED8'><b>0.70 × Cosine + Keyword/Thesaurus</b></font><br/>Top-5 SOP Chunks (minScore ≥ 0.15)", size=9.8, align="left")

    # 5. MIDDLE RIGHT: Live Claims Tools & Risk Validation (Bold Teal Dashed — 2 compact blocks!)
    p.append(box(616, 252, 462, 224, "Live Claims Tools & Guardrail", dashed=True, sw=2.4, stroke=COL_TEAL, title_color=COL_TEAL_TXT, title_size=12.5))

    p.append(box(638, 294, 200, 158, "Logistics Tools", title_align="center", title_size=12))
    p.append(img_svg("tools_api", 708, 324, 60, 54))
    p.append(label(738, 398, "trackClaimStatus()", size=10.5, bold=True, color="#0F766E"))
    p.append(label(738, 416, "trackShipment()", size=10.2, color="#374151"))
    p.append(label(738, 434, "Active Clarification", size=9.8, color="#4B5563"))

    p.append(box(864, 294, 194, 158, "Validation Agent", title_align="center", title_size=12))
    p.append(img_svg("openrouter", 904, 328, 114, 34))
    p.append(label(961, 386, "nemotron-3.5-lightning", size=10, bold=True, color="#6D28D9"))
    p.append(label(961, 405, "Risk Check (HITL)", size=10.2, color="#374151"))
    p.append(label(961, 426, "OPENROUTER_API_KEY", size=9.2, color="#059669", bold=True))

    d.rect(616, 252, 462, 224, "Live Claims Tools & Guardrail", dashed=True, sw=2.4, stroke=COL_TEAL, font_color=COL_TEAL_TXT)
    lt_id = d.rect(638, 294, 200, 158, "Logistics Tools", align="center", font_size=12)
    d.img("tools_api", 708, 324, 60, 54)
    d.txt(644, 384, 188, 60, "<font color='#0F766E'><b>trackClaimStatus()</b></font><br/>trackShipment()<br/>Active Clarification", size=9.8)
    va_id = d.rect(864, 294, 194, 158, "Validation Agent", align="center", font_size=12)
    d.img("openrouter", 904, 328, 114, 34)
    d.txt(868, 372, 186, 68, "<font color='#6D28D9'><b>nemotron-3.5-lightning</b></font><br/>Risk Check (HITL)<br/><font color='#059669'><b>OPENROUTER_API_KEY</b></font>", size=9.5)

    # 6. LOWER-MID: Prompt Builder + LLM Waterfall (Bold Amber Dashed — compact horizontal flow!)
    p.append(box(122, 566, 876, 174, dashed=True, sw=2.4, stroke=COL_AMBER))

    p.append(box(144, 590, 212, 116, "Prompt Builder", title_align="center", title_size=12))
    p.append(img_svg("prompt_box", 218, 616, 64, 52))
    p.append(label(250, 682, "SOP + Claim + NĐ 47", size=10.2, bold=True))
    p.append(label(250, 697, "Grounded Context", size=9.6, color="#4B5563"))

    p.append(box(430, 590, 232, 116, "Primary LLM", title_align="center", title_size=12))
    p.append(img_svg("gemini", 488, 618, 116, 36))
    p.append(label(546, 672, "gemini-3.5-flash-lite", size=10.5, bold=True, color="#1D4ED8"))
    p.append(label(546, 692, "GEMINI_API_KEY", size=9.5, color="#059669", bold=True))

    p.append(box(744, 590, 232, 116, "Backup LLMs", title_align="center", title_size=12))
    p.append(img_svg("groq", 810, 618, 100, 34))
    p.append(label(860, 668, "gpt-oss-120b · qwen3.8-27b", size=10, bold=True, color="#C2410C"))
    p.append(label(860, 692, "GROQ_API_KEY", size=9.5, color="#059669", bold=True))

    p.append(label(144, 728, "Grounded Synthesis & Multi-LLM Waterfall", size=13, bold=True, color=COL_AMBER_TXT, align="start"))

    d.rect(122, 566, 876, 174, "", dashed=True, sw=2.4, stroke=COL_AMBER)
    d.txt(138, 712, 420, 24, "<b>Grounded Synthesis &amp; Multi-LLM Waterfall</b>", size=12.5, color=COL_AMBER_TXT, align="left")
    pb_id = d.rect(144, 590, 212, 116, "Prompt Builder", align="center", font_size=12)
    d.img("prompt_box", 218, 616, 64, 52)
    d.txt(150, 670, 200, 32, "<b>SOP + Claim + NĐ 47</b><br/>Grounded Context", size=9.6)
    lm1_id = d.rect(430, 590, 232, 116, "Primary LLM", align="center", font_size=12)
    d.img("gemini", 488, 618, 116, 36)
    d.txt(436, 658, 220, 42, "<font color='#1D4ED8'><b>gemini-3.5-flash-lite</b></font><br/><font color='#059669'><b>GEMINI_API_KEY</b></font>", size=9.8)
    lm2_id = d.rect(744, 590, 232, 116, "Backup LLMs", align="center", font_size=12)
    d.img("groq", 810, 618, 100, 34)
    d.txt(750, 658, 220, 42, "<font color='#C2410C'><b>gpt-oss-120b · qwen3.8-27b</b></font><br/><font color='#059669'><b>GROQ_API_KEY</b></font>", size=9.6)

    # 7. BOTTOM: Final Output & QA Human-in-the-Loop (2 compact cards!)
    p.append(box(170, 824, 300, 116, "Grounded Response", title_align="left", title_size=12.5))
    p.append(img_svg("output_card", 184, 862, 64, 54))
    p.append(label(260, 878, "Answer + Citations[]", size=11, bold=True, color="#15803D", align="start"))
    p.append(label(260, 897, "Action Chips & Policy", size=10.2, color="#374151", align="start"))
    p.append(label(260, 916, "Stream SSE về Client", size=10, color="#4B5563", align="start"))

    p.append(box(640, 824, 314, 116, "QA & Ops Web (HITL)", title_align="left", stroke=COL_AMBER, sw=2.0, title_color=COL_AMBER_TXT, title_size=12.5))
    p.append(img_svg("hitl_qa", 656, 862, 66, 54))
    p.append(label(736, 878, "Giám định & Duyệt chi", size=11, bold=True, color="#B45309", align="start"))
    p.append(label(736, 897, "CCTV · Vết quét (24–48h)", size=10.2, color="#374151", align="start"))
    p.append(label(736, 916, "AI không tự chuyển tiền", size=10, color="#DC2626", bold=True, align="start"))

    out_id = d.rect(170, 824, 300, 116, "Grounded Response")
    d.img("output_card", 184, 862, 64, 54)
    d.txt(256, 862, 206, 66, "<font color='#15803D'><b>Answer + Citations[]</b></font><br/>Action Chips &amp; Policy<br/>Stream SSE về Client", size=10, align="left")
    qa_id = d.rect(640, 824, 314, 116, "QA & Ops Web (HITL)", stroke=COL_AMBER, sw=2.0, font_color=COL_AMBER_TXT)
    d.img("hitl_qa", 656, 862, 66, 54)
    d.txt(732, 862, 214, 66, "<font color='#B45309'><b>Giám định &amp; Duyệt chi</b></font><br/>CCTV · Vết quét (24–48h)<br/><font color='#DC2626'><b>AI không tự chuyển tiền</b></font>", size=10, align="left")

    # DATA-FLOW ARROWS (Every arrow shows the exact artifact moving between components!)
    p.append(arrow([(230, 102), (340, 102)], "Claim Query", (285, 86)))
    p.append(arrow([(552, 102), (664, 102)], "Safe Query", (608, 86)))
    p.append(arrow([(446, 48), (446, 18), (1010, 18), (1010, 62)], "Vi phạm / Ép chuyển tiền", (760, 18), dashed=True, stroke=COL_RED))

    # Intent Router -> 3 Parallel Branches (zero title crossings!)
    p.append(arrow([(710, 156), (710, 198), (455, 198), (455, 404)], "Query Text", (575, 198)))
    p.append(arrow([(824, 156), (824, 294)], "CLM / SHP", (824, 224)))
    p.append(arrow([(856, 156), (856, 198), (961, 198), (961, 294)], "Risky Action", (926, 198), dashed=True))

    # Inside RAG
    p.append(arrow([(208, 327), (248, 327)], "Embed", (228, 312)))
    p.append(arrow([(315, 372), (315, 404)]))

    # Branches -> Prompt Builder
    p.append(arrow([(250, 472), (250, 590)], "Top-5 SOP\nChunks", (250, 526)))
    p.append(arrow([(738, 452), (738, 526), (310, 526), (310, 590)], "Live Claim JSON", (530, 526)))

    # Inside LLM Waterfall
    p.append(arrow([(356, 648), (430, 648)], "Prompt", (393, 632)))
    p.append(arrow([(662, 648), (744, 648)], "Fallback", (703, 632), dashed=True))

    # LLM -> Final Output & Validation -> QA HITL
    p.append(arrow([(546, 706), (546, 780), (320, 780), (320, 824)], "Synthesized Answer", (425, 780)))
    p.append(arrow([(860, 706), (860, 780), (546, 780)], dashed=True))
    p.append(arrow([(961, 452), (961, 514), (1062, 514), (1062, 882), (954, 882)], "requiresHitl", (1062, 690), dashed=True))
    p.append(arrow([(470, 882), (640, 882)], "Mở hồ sơ QA", (555, 866), dashed=True))

    d.edge(u_id, g_id, "Claim Query")
    d.edge(g_id, r_id, "Safe Query")
    d.edge(g_id, rej_id, "Vi phạm / Ép chi tiền", dashed=True, wps=[(446, 18), (1010, 18)])
    d.edge(r_id, hs_id, "Query Text", wps=[(710, 198), (455, 198)])
    d.edge(r_id, lt_id, "CLM / SHP")
    d.edge(r_id, va_id, "Risky Action", dashed=True, wps=[(856, 198), (961, 198)])
    d.edge(kb_id, vs_id, "Embed")
    d.edge(vs_id, hs_id)
    d.edge(hs_id, pb_id, "Top-5 SOP Chunks")
    d.edge(lt_id, pb_id, "Live Claim JSON", wps=[(738, 526), (310, 526)])
    d.edge(pb_id, lm1_id, "Prompt")
    d.edge(lm1_id, lm2_id, "Fallback", dashed=True)
    d.edge(lm1_id, out_id, "Synthesized Answer", wps=[(546, 780), (320, 780)])
    d.edge(va_id, qa_id, "requiresHitl", dashed=True, wps=[(961, 514), (1062, 514), (1062, 882)])
    d.edge(out_id, qa_id, "Mở hồ sơ QA", dashed=True)

    svg_path = OUT_DIR / "nexus-rag-claims-overview.svg"
    dio_path = OUT_DIR / "nexus-rag-claims-overview.drawio"
    svg_path.write_text(svg_wrap(W1, H1, p), encoding="utf-8")
    dio_path.write_text(d.render(), encoding="utf-8")
    print(f"[OK] Overview SVG:    {svg_path}")


# =============================================================================
# DIAGRAM 2: CƠ CHẾ HOẠT ĐỘNG COMPONENT-TO-COMPONENT (1220 x 1360)
# Shows EVERY processing module, input/output artifact, formula, and branch!
# =============================================================================

def build_pipeline():
    W2, H2 = 1260, 1360
    p = [f'<rect x="0" y="0" width="{W2}" height="{H2}" fill="#FFFFFF"/>']
    d = DrawioBuilder(W2, H2, "RAG Claims Working Mechanism")

    # =========================================================================
    # PHASE 1: OFFLINE INDEXING (Compact 4-component pipeline, top-left!)
    # =========================================================================
    p.append(box(44, 30, 1044, 170, "Offline Indexing Pipeline (POST /chat/ingest · KnowledgeService)",
                 dashed=True, sw=2.4, stroke=COL_BLUE, title_color=COL_BLUE_TXT, title_size=13))

    p.append(box(68, 72, 168, 108, "Knowledge Base", title_align="center", title_size=11.5))
    p.append(img_svg("md_docs", 120, 98, 62, 54))
    p.append(label(152, 168, "9 file SOP (.md)", size=10, color="#4B5563"))

    p.append(box(316, 72, 200, 108, "ChunkerService", title_align="center", title_size=11.5))
    p.append(img_svg("chunk_icon", 384, 98, 64, 48))
    p.append(label(416, 158, "Heading + Sliding Window", size=10, bold=True))
    p.append(label(416, 172, "250 words · overlap 40", size=9.6, color="#1D4ED8", bold=True))

    p.append(box(596, 72, 206, 108, "EmbeddingService", title_align="center", title_size=11.5))
    p.append(img_svg("gemini", 642, 102, 114, 34))
    p.append(label(699, 154, "gemini-embedding-001", size=10, bold=True, color="#1D4ED8"))
    p.append(label(699, 170, "Batch API → 3072-D", size=9.6, color="#4B5563"))

    p.append(box(882, 72, 182, 108, "VectorStoreService", title_align="center", title_size=11.5))
    p.append(img_svg("vector_db", 943, 98, 60, 52))
    p.append(label(973, 168, "vector-index.json (RAM)", size=9.8, color="#059669", bold=True))

    p.append(arrow([(236, 126), (316, 126)], "Raw MD", (276, 110)))
    p.append(arrow([(516, 126), (596, 126)], "59 Chunks", (556, 110)))
    p.append(arrow([(802, 126), (882, 126)], "float[3072]", (842, 110)))

    d.rect(44, 30, 1044, 170, "Offline Indexing Pipeline (POST /chat/ingest · KnowledgeService)", dashed=True, sw=2.4, stroke=COL_BLUE, font_color=COL_BLUE_TXT)
    o1 = d.rect(68, 72, 168, 108, "Knowledge Base", align="center")
    d.img("md_docs", 120, 98, 62, 54)
    o2 = d.rect(316, 72, 200, 108, "ChunkerService", align="center")
    d.img("chunk_icon", 384, 98, 64, 48)
    d.txt(322, 146, 188, 30, "<b>Heading + Sliding Window</b><br/><font color='#1D4ED8'>250 words · overlap 40</font>", size=9.5)
    o3 = d.rect(596, 72, 206, 108, "EmbeddingService", align="center")
    d.img("gemini", 642, 102, 114, 34)
    d.txt(602, 142, 194, 34, "<font color='#1D4ED8'><b>gemini-embedding-001</b></font><br/>Batch API → 3072-D", size=9.5)
    o4 = d.rect(882, 72, 182, 108, "VectorStoreService", align="center")
    d.img("vector_db", 943, 98, 60, 52)
    d.txt(886, 154, 174, 22, "<font color='#059669'><b>vector-index.json (RAM)</b></font>", size=9.5)
    d.edge(o1, o2, "Raw MD")
    d.edge(o2, o3, "59 Chunks")
    d.edge(o3, o4, "float[3072]")

    # =========================================================================
    # PHASE 2: ONLINE COMPONENT EXECUTION (ChatService.handleMessage / streamMessage)
    # =========================================================================

    # Row A (y=268..374): User Input -> Security Gatekeeper -> Intent & Session Router
    p.append(box(52, 268, 190, 106, "1. Claim Query", title_align="center", title_size=12))
    p.append(img_svg("user_chat", 110, 294, 70, 54))
    p.append(label(147, 362, "\"Bể vỡ / CLM-...\"", size=10, color="#1D4ED8", bold=True))

    p.append(box(326, 268, 226, 106, "2. Security Gatekeeper", title_align="center", stroke=COL_RED, sw=2.0, title_color=COL_RED_TXT, title_size=12))
    p.append(img_svg("shield_red", 414, 294, 48, 52))
    p.append(label(439, 362, "OWASP LLM01/02 · Payout Block", size=9.6, color="#991B1B", bold=True))

    p.append(box(646, 268, 232, 106, "3. Intent & Session Router", title_align="center", title_size=12))
    p.append(img_svg("router_icon", 734, 296, 56, 48))
    p.append(label(762, 362, "NFD Normalize · Regex CLM/SHP", size=9.6, color="#4B5563"))

    p.append(box(976, 278, 186, 86, "Direct Refusal", title_align="center", stroke=COL_RED, title_color=COL_RED_TXT, title_size=11.5))
    p.append(label(1069, 326, "Từ chối tiêm lệnh,", size=10, color="#991B1B", bold=True))
    p.append(label(1069, 344, "lộ PII hoặc tự duyệt chi", size=10, color="#991B1B", bold=True))

    # Row B (y=446..784): LEFT = Hybrid Retrieval Pipeline (5 micro-components!) | RIGHT = Live Tools & Validation (3 micro-components!)
    # --- LEFT CLUSTER: Hybrid Search Engine (Bold Indigo Dashed) ---
    p.append(box(52, 446, 586, 338, dashed=True, sw=2.3, stroke=COL_INDIGO))
    p.append(label(64, 468, "4A. Hybrid Retrieval Engine", size=12.5, bold=True, color=COL_INDIGO_TXT, align="start"))
    p.append(label(626, 468, "VectorStoreService.hybridSearch", size=10.5, bold=True, color=COL_INDIGO_TXT, align="end"))

    # Sub-component 1: Query Embedder
    p.append(box(76, 492, 240, 84, "Query Embedder", title_align="center", title_size=11.5))
    p.append(label(196, 534, "gemini-embedding-001", size=10.5, bold=True, color="#1D4ED8"))
    p.append(label(196, 554, "Query → vector q ∈ R^3072", size=10, color="#4B5563"))

    # Sub-component 2: Cosine Similarity Scorer
    p.append(box(76, 620, 240, 66, "Dense Cosine Scorer", title_align="center", title_size=11.5))
    p.append(label(196, 661, "cos(q, d) × 0.70", size=11, bold=True, color="#1D4ED8"))

    # Sub-component 3: Logistics Thesaurus Expansion
    p.append(box(370, 492, 244, 84, "Logistics Thesaurus", title_align="center", title_size=11.5))
    p.append(label(492, 532, "Mở rộng từ đồng nghĩa ngành", size=10, bold=True))
    p.append(label(492, 552, "hỏng/vỡ → bể vỡ, xốp hơi, biên bản", size=9.5, color="#4B5563"))
    p.append(label(492, 566, "mất/đền → 4x cước, 30tr, CLM", size=9.5, color="#4B5563"))

    # Sub-component 4: Keyword Bonus Scorer
    p.append(box(370, 620, 244, 66, "Sparse Keyword Scorer", title_align="center", title_size=11.5))
    p.append(label(492, 661, "min(0.35, hits / |terms| × 0.35)", size=10.5, bold=True, color="#059669"))

    # Sub-component 5: Score Fusion & Top-K Filter
    p.append(box(144, 712, 404, 54))
    p.append(img_svg("fusion_icon", 156, 719, 38, 36))
    p.append(label(206, 735, "Score Fusion & Top-K Filter", size=11.5, bold=True, align="start"))
    p.append(label(206, 753, "Total ≥ 0.15  →  Sort DESC  →  Top-5 Chunks + Citations[]", size=10, color="#1D4ED8", bold=True, align="start"))

    # --- RIGHT CLUSTER: Live Claims Execution & HITL Validation (Bold Teal Dashed) ---
    p.append(box(686, 446, 480, 338, dashed=True, sw=2.3, stroke=COL_TEAL))
    p.append(label(700, 772, "4B. Live Claims Tools & HITL Validation", size=12.5, bold=True, color=COL_TEAL_TXT, align="start"))

    p.append(box(710, 468, 206, 114, "Claim & Tracking Tools", title_align="center", title_size=11.5))
    p.append(img_svg("tools_api", 784, 494, 56, 50))
    p.append(label(813, 560, "trackClaimStatus(CLM)", size=9.8, bold=True, color="#0F766E"))
    p.append(label(813, 574, "trackShipment(:3008)", size=9.6, color="#4B5563"))

    p.append(box(944, 468, 198, 114, "Active Clarification", title_align="center", title_size=11.5))
    p.append(label(1043, 516, "Thiếu mã đơn?", size=10.5, bold=True, color="#B45309"))
    p.append(label(1043, 535, "pendingIntent = 'CLAIM'", size=9.6, color="#1D4ED8", bold=True))
    p.append(label(1043, 554, "Hỏi mã đơn + ảnh + giá trị", size=9.5, color="#4B5563"))
    p.append(label(1043, 570, "+ Action Chips", size=9.5, color="#4B5563"))

    p.append(box(744, 632, 366, 108, "Validation Agent (callValidationAgent)", title_align="left", stroke=COL_AMBER, sw=1.8, title_color=COL_AMBER_TXT, title_size=11.8))
    p.append(img_svg("openrouter", 760, 670, 110, 32))
    p.append(label(884, 682, "nvidia/nemotron-3.5-lightning:free", size=10.2, bold=True, color="#6D28D9", align="start"))
    p.append(label(884, 700, "Check CANCEL / REFUND / ADDRESS", size=9.8, color="#374151", align="start"))
    p.append(label(884, 720, "→ JSON {approved, requiresHitl, risk}", size=9.8, color="#B45309", bold=True, align="start"))

    # Row C (y=838..914): Context Assembler (Prompt Builder)
    p.append(box(274, 838, 636, 76))
    p.append(img_svg("prompt_box", 290, 850, 60, 50))
    p.append(label(366, 864, "5. Context Assembler / Prompt Builder", size=12.5, bold=True, align="start"))
    p.append(label(366, 884, "System Legal Rules (NĐ 47 & Luật BC)  +  User Session  +  Live Claim JSON  +  Top-5 RAG Chunks", size=10.2, color="#1D4ED8", bold=True, align="start"))
    p.append(label(366, 902, "Bắt buộc trả lời bám sát ngữ cảnh (Grounded — cấm tự bịa mức đền bù)", size=9.8, color="#4B5563", align="start"))

    # Row D (y=972..1122): Multi-LLM Waterfall (3 compact cascading nodes — Bold Amber Dashed!)
    p.append(box(74, 972, 1068, 152, dashed=True, sw=2.3, stroke=COL_AMBER))

    p.append(box(98, 994, 280, 96, "6A. Primary LLM (#1)", title_align="left", title_size=11.5))
    p.append(img_svg("gemini", 110, 1024, 106, 32))
    p.append(label(224, 1044, "gemini-3.5-flash-lite", size=10.2, bold=True, color="#1D4ED8", align="start"))
    p.append(label(112, 1076, "Google AI Studio · GEMINI_API_KEY", size=9.5, color="#059669", bold=True, align="start"))

    p.append(box(458, 994, 290, 96, "6B. Operation Fallback", title_align="left", title_size=11.5))
    p.append(img_svg("groq", 470, 1026, 94, 28))
    p.append(label(572, 1044, "openai/gpt-oss-120b", size=10.2, bold=True, color="#C2410C", align="start"))
    p.append(label(472, 1076, "Groq LPU (Tool/CLM) · GROQ_API_KEY", size=9.5, color="#059669", bold=True, align="start"))

    p.append(box(828, 994, 290, 96, "6C. Knowledge Fallback", title_align="left", title_size=11.5))
    p.append(img_svg("groq", 840, 1026, 94, 28))
    p.append(label(942, 1044, "qwen/qwen3.8-27b", size=10.2, bold=True, color="#C2410C", align="start"))
    p.append(label(842, 1076, "Groq LPU (RAG SOP) · GROQ_API_KEY", size=9.5, color="#059669", bold=True, align="start"))

    p.append(label(98, 1112, "6. Multi-LLM Synthesis Waterfall (ChatService.executeLlm — timeout 4s/fallback)", size=12.5, bold=True, color=COL_AMBER_TXT, align="start"))

    # Row E (y=1192..1314): Response Formatter + QA / Ops Web HITL
    p.append(box(176, 1192, 370, 118, "7. Response Formatter (cleanBotFormatting)", title_align="left", title_size=12))
    p.append(img_svg("output_card", 192, 1230, 62, 52))
    p.append(label(266, 1246, "JSON / SSE Stream Response", size=11, bold=True, color="#15803D", align="start"))
    p.append(label(266, 1265, "answer + citations[] + toolsUsed", size=10, color="#374151", align="start"))
    p.append(label(266, 1284, "Action Chips + latencyMs", size=10, color="#4B5563", align="start"))

    p.append(box(684, 1192, 368, 118, "8. QA & Ops Web Handover (HITL)", title_align="left", stroke=COL_AMBER, sw=2.0, title_color=COL_AMBER_TXT, title_size=12))
    p.append(img_svg("hitl_qa", 700, 1230, 64, 52))
    p.append(label(778, 1246, "Thẩm định & Chi trả Bồi thường", size=11, bold=True, color="#B45309", align="start"))
    p.append(label(778, 1265, "Kiểm tra CCTV · Vết quét (24h–48h)", size=10, color="#374151", align="start"))
    p.append(label(778, 1284, "Duyệt & thanh toán (3–5 ngày)", size=10, color="#DC2626", bold=True, align="start"))

    # =========================================================================
    # ALL DATA-FLOW ARROWS (CLEAN, DIRECT, ZERO CROSSINGS!)
    # =========================================================================

    # Phase 1 Vector Store -> Phase 2 Dense Cosine Scorer (clean left outer rail x=20!)
    p.append(arrow([(973, 180), (973, 226), (20, 226), (20, 653), (76, 653)], "59 Chunk Vectors (RAM)", (450, 226), dashed=True))

    # Row A horizontal flow
    p.append(arrow([(242, 321), (326, 321)], "Query", (284, 306)))
    p.append(arrow([(552, 321), (646, 321)], "Passed", (599, 306)))
    p.append(arrow([(439, 268), (439, 246), (1069, 246), (1069, 278)], "Blocked", (780, 246), dashed=True, stroke=COL_RED))

    # Router -> 4A (Single central spine x=343 -> clean T-split to Embedder & Thesaurus, ZERO header crossings!)
    p.append(arrow([(712, 374), (712, 410), (343, 410), (343, 534), (316, 534)], "Policy / Claim Text", (520, 410)))
    p.append(arrow([(343, 534), (370, 534)]))
    # Router -> 4B (CLM/SHP at x=790, No Code at x=858 — zero overlap, zero header crossing!)
    p.append(arrow([(790, 374), (790, 468)], "CLM / SHP", (790, 420)))
    p.append(arrow([(858, 374), (858, 408), (1043, 408), (1043, 468)], "No Code", (956, 408), dashed=True))

    # Inside 4A: Embedder -> Cosine, Thesaurus -> Keyword, Both -> Score Fusion
    p.append(arrow([(196, 576), (196, 620)], "q ∈ R^3072", (196, 598)))
    p.append(arrow([(492, 576), (492, 620)], "Terms", (492, 598)))
    p.append(arrow([(196, 686), (196, 712)]))
    p.append(arrow([(492, 686), (492, 712)]))

    # Inside 4B: Tools -> Validation Agent (if risky action)
    p.append(arrow([(813, 582), (813, 632)], "Risky Mutation", (874, 607), dashed=True))

    # 4A & 4B -> Step 5 (Context Assembler) — clear of 4B bottom-left title!
    p.append(arrow([(346, 766), (346, 838)], "Top-5 SOP Chunks", (346, 808)))
    p.append(arrow([(1010, 740), (1010, 808), (813, 808), (813, 838)], "Live Claim + Guardrail", (914, 808)))

    # Step 5 -> Step 6 (Multi-LLM Waterfall)
    p.append(arrow([(592, 914), (592, 944), (238, 944), (238, 994)], "Grounded Prompt", (415, 944)))
    p.append(arrow([(378, 1042), (458, 1042)], "Fail / Tool", (418, 1026), dashed=True))
    p.append(arrow([(748, 1042), (828, 1042)], "Fail / SOP", (788, 1026), dashed=True))

    # Step 6 -> Step 7 (Output) & Validation -> Step 8 (QA HITL)
    p.append(arrow([(360, 1124), (360, 1192)], "Answer Text", (360, 1156)))
    p.append(arrow([(1110, 686), (1200, 686), (1200, 1252), (1052, 1252)], "HITL\nEscalate", (1200, 960), dashed=True))
    p.append(arrow([(546, 1252), (684, 1252)], "Mở hồ sơ QA", (615, 1236), dashed=True))

    # Mirror Phase 2 to Draw.io XML
    q1 = d.rect(52, 268, 190, 106, "1. Claim Query", align="center")
    d.img("user_chat", 110, 294, 70, 54)
    q2 = d.rect(326, 268, 226, 106, "2. Security Gatekeeper", align="center", stroke=COL_RED, sw=2.0, font_color=COL_RED_TXT)
    d.img("shield_red", 414, 294, 48, 52)
    q3 = d.rect(646, 268, 232, 106, "3. Intent & Session Router", align="center")
    d.img("router_icon", 734, 296, 56, 48)
    q_rej = d.rect(976, 278, 186, 86, "Direct Refusal\nTừ chối tiêm lệnh / tự duyệt chi", align="center", valign="middle", stroke=COL_RED, font_color=COL_RED_TXT, font_size=10.2)

    d.rect(52, 446, 586, 338, "4A. Hybrid Retrieval Engine", dashed=True, sw=2.3, stroke=COL_INDIGO, font_color=COL_INDIGO_TXT)
    qe = d.rect(76, 492, 240, 84, "Query Embedder\ngemini-embedding-001 (3072-D)", align="center", valign="middle", font_size=10.5)
    dc = d.rect(76, 620, 240, 66, "Dense Cosine Scorer\ncos(q, d) × 0.70", align="center", valign="middle", font_size=10.5)
    th = d.rect(370, 492, 244, 84, "Logistics Thesaurus\nhỏng/vỡ/mất/đền → mở rộng từ", align="center", valign="middle", font_size=10.2)
    ks = d.rect(370, 620, 244, 66, "Sparse Keyword Scorer\nmin(0.35, hits / |terms| × 0.35)", align="center", valign="middle", font_size=10.2)
    fu = d.rect(144, 712, 404, 54, "Score Fusion & Top-K Filter\nTotal ≥ 0.15 → Top-5 Chunks + Citations[]", align="center", valign="middle", font_size=10.2)

    d.rect(686, 446, 480, 338, "", dashed=True, sw=2.3, stroke=COL_TEAL)
    d.txt(698, 756, 290, 22, "<b>4B. Live Claims Tools &amp; HITL Validation</b>", size=12, color=COL_TEAL_TXT, align="left")
    ct = d.rect(710, 468, 206, 114, "Claim & Tracking Tools\ntrackClaimStatus() · trackShipment()", align="center", valign="middle", font_size=10.2)
    ac = d.rect(944, 468, 198, 114, "Active Clarification\npendingIntent='CLAIM'\nHỏi mã đơn + ảnh + giá trị", align="center", valign="middle", font_size=10)
    va = d.rect(744, 632, 366, 108, "Validation Agent (OpenRouter)\nnvidia/nemotron-3.5-lightning:free\n→ {approved, requiresHitl, risk}", align="center", valign="middle", stroke=COL_AMBER, sw=1.8, font_color=COL_AMBER_TXT, font_size=10.2)

    ca = d.rect(274, 838, 636, 76, "5. Context Assembler / Prompt Builder\nSystem Legal Rules (NĐ 47 & Luật BC) + User Session + Live Claim JSON + Top-5 RAG Chunks", align="center", valign="middle", font_size=10.5)

    d.rect(74, 972, 1068, 152, "", dashed=True, sw=2.3, stroke=COL_AMBER)
    d.txt(94, 1096, 620, 22, "<b>6. Multi-LLM Synthesis Waterfall (ChatService.executeLlm)</b>", size=12, color=COL_AMBER_TXT, align="left")
    m1 = d.rect(98, 994, 280, 96, "6A. Primary LLM (#1)\ngemini-3.5-flash-lite (GEMINI_API_KEY)", align="center", valign="middle", font_size=10.2)
    m2 = d.rect(458, 994, 290, 96, "6B. Operation Fallback\nopenai/gpt-oss-120b (GROQ_API_KEY)", align="center", valign="middle", font_size=10.2)
    m3 = d.rect(828, 994, 290, 96, "6C. Knowledge Fallback\nqwen/qwen3.8-27b (GROQ_API_KEY)", align="center", valign="middle", font_size=10.2)

    rf = d.rect(176, 1192, 370, 118, "7. Response Formatter\nJSON/SSE: answer + citations[] + Action Chips", align="center", valign="middle", font_size=10.5)
    qa = d.rect(684, 1192, 368, 118, "8. QA & Ops Web Handover (HITL)\nCCTV · Vết quét (24h–48h) · Chi trả 3–5 ngày", align="center", valign="middle", stroke=COL_AMBER, sw=2.0, font_color=COL_AMBER_TXT, font_size=10.5)

    d.edge(o4, dc, "59 Chunk Vectors (RAM)", dashed=True, wps=[(973, 226), (20, 226), (20, 653)])
    d.edge(q1, q2, "Query")
    d.edge(q2, q3, "Passed")
    d.edge(q2, q_rej, "Blocked", dashed=True, wps=[(439, 246), (1069, 246)])
    d.edge(q3, qe, "Policy / Claim Text", wps=[(712, 410), (343, 410), (343, 534)])
    d.edge(q3, th, "", wps=[(712, 410), (343, 410), (343, 534)])
    d.edge(q3, ct, "CLM / SHP")
    d.edge(q3, ac, "No Code", dashed=True, wps=[(858, 408), (1043, 408)])
    d.edge(qe, dc, "q ∈ R^3072")
    d.edge(th, ks, "Terms")
    d.edge(dc, fu)
    d.edge(ks, fu)
    d.edge(ct, va, "Risky Mutation", dashed=True)
    d.edge(fu, ca, "Top-5 SOP Chunks")
    d.edge(va, ca, "Live Claim + Guardrail", wps=[(1010, 808), (813, 808)])
    d.edge(ca, m1, "Grounded Prompt", wps=[(592, 944), (238, 944)])
    d.edge(m1, m2, "Fail / Tool", dashed=True)
    d.edge(m2, m3, "Fail / SOP", dashed=True)
    d.edge(m1, rf, "Answer Text")
    d.edge(va, qa, "HITL Escalate", dashed=True, wps=[(1200, 686), (1200, 1252)])
    d.edge(rf, qa, "Mở hồ sơ QA", dashed=True)

    svg_path = OUT_DIR / "nexus-rag-claims-pipeline.svg"
    dio_path = OUT_DIR / "nexus-rag-claims-pipeline.drawio"
    svg_path.write_text(svg_wrap(W2, H2, p), encoding="utf-8")
    dio_path.write_text(d.render(), encoding="utf-8")
    print(f"[OK] Pipeline SVG:    {svg_path}")


def main():
    build_overview()
    build_pipeline()


if __name__ == "__main__":
    main()
