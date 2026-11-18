#!/usr/bin/env python3
"""
Generate a Zero-Crossing, Organic, Human-Drawn-on-Draw.io Inter-Service Communication Model
("Mô hình Giao tiếp giữa các Dịch vụ") for Nexus Logistics:
  - MATHEMATICALLY PLANAR LAYOUT: ZERO (0) intersecting arrows across the entire diagram!
  - Genuine human asymmetry & generous white space (NO brick-wall aligned edges, NO rigid grids)
  - 100% verified against actual codebase (services/*/src/):
      * Clients <-> API Gateway BFF (:3000) <-> Redis 7 Pub/Sub (/ws/chat)
      * DT_COMMERCE -> Gateway (Partner HMAC); shipment-service -> DT_COMMERCE (Status Webhook)
      * Sync HTTP/REST Hub: Gateway -> shipment -> pricing; pickup/manifest/delivery/scan -> shipment;
        delivery -> scan; dispatch -> pickup & masterdata; auth -> masterdata; payment <-> SePay
      * Realtime WS Proxy: Gateway <-> scan (:3006, /ws/locations) & dispatch (:3004, /ws/tasks)
      * AI Chatbot (:3013): Gateway -> SSE; Tools <-> Sync (:3002, :3012) & CQRS tracking (:3008)
      * Async RabbitMQ: 9 Write Services Outbox -> domain.events (:5672)
        -> <svc>.q -> retry.10s -> retry.1m -> .dlq -> 6 Domain Consumers + 2 CQRS Read Projections

Outputs:
  1. docs/architecture/diagrams/nexus-service-communication.drawio
  2. docs/architecture/diagrams/nexus-service-communication.svg
"""

import base64
import html as html_lib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "architecture" / "diagrams"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SVG_PATH = OUT_DIR / "nexus-service-communication.svg"
DRAWIO_PATH = OUT_DIR / "nexus-service-communication.drawio"

W, H = 1280, 1130
FONT = "Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif"

COL_GW = "#0F766E"
COL_GW_TXT = "#115E59"
COL_SYNC = "#2563EB"
COL_SYNC_TXT = "#1D4ED8"
COL_RT = "#7C3AED"
COL_RT_TXT = "#5B21B6"
COL_MQ = "#D97706"
COL_MQ_TXT = "#B45309"
COL_RED = "#DC2626"
COL_RED_TXT = "#991B1B"


def esc(s: str) -> str:
    return html_lib.escape(str(s), quote=True)


# =============================================================================
# CRISP COMPONENT LOGOS & ICONS
# =============================================================================

LOGOS = {
    "clients": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92 60">
      <rect x="4" y="6" width="52" height="35" rx="3" fill="#FFFFFF" stroke="#111111" stroke-width="1.8"/>
      <line x1="4" y1="14" x2="56" y2="14" stroke="#111111" stroke-width="1.2"/>
      <circle cx="10" cy="10" r="1.3" fill="#EF4444"/>
      <circle cx="15" cy="10" r="1.3" fill="#F59E0B"/>
      <circle cx="20" cy="10" r="1.3" fill="#22C55E"/>
      <path d="M1 42 L60 42 L62 48 L-1 48 Z" fill="#F3F4F6" stroke="#111111" stroke-width="1.5"/>
      <rect x="65" y="13" width="23" height="40" rx="4" fill="#FFFFFF" stroke="#2563EB" stroke-width="1.8"/>
      <rect x="68" y="19" width="17" height="25" rx="1.5" fill="#EFF6FF" stroke="#2563EB" stroke-width="1"/>
      <circle cx="76.5" cy="49" r="1.5" fill="#2563EB"/>
    </svg>""",

    "nestjs": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 42">
      <circle cx="20" cy="21" r="16" fill="#E0234E"/>
      <path d="M13 26c1-6 4-11 9-13 3 2 5 5 5 10 0 3-2 5-4 6 2-2 2-5 0-7-2 2-3 4-4 7-3 0-5-1-6-3z" fill="#FFFFFF"/>
      <text x="43" y="27" font-family="Helvetica,Arial,sans-serif" font-size="18" font-weight="700" fill="#E0234E">NestJS</text>
    </svg>""",

    "rest_api": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 48">
      <rect x="3" y="4" width="74" height="40" rx="7" fill="#EFF6FF" stroke="#0284C7" stroke-width="2"/>
      <text x="40" y="22" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="800" fill="#0284C7">HTTP</text>
      <text x="40" y="36" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="11" font-weight="800" fill="#0369A1">REST</text>
    </svg>""",

    "websocket": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 48">
      <rect x="3" y="4" width="74" height="40" rx="7" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2"/>
      <path d="M13 18 L31 18 M26 14 L31 18 L26 22" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M31 30 L13 30 M18 26 L13 30 L18 34" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="54" y="29" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="13.5" font-weight="800" fill="#5B21B6">WS</text>
    </svg>""",

    "webhook": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 52">
      <circle cx="35" cy="14" r="7" fill="none" stroke="#E11D48" stroke-width="2.6"/>
      <circle cx="19" cy="40" r="7" fill="none" stroke="#2563EB" stroke-width="2.6"/>
      <circle cx="51" cy="40" r="7" fill="none" stroke="#16A34A" stroke-width="2.6"/>
      <line x1="30" y1="20" x2="23" y2="33" stroke="#374151" stroke-width="2.2"/>
      <line x1="40" y1="20" x2="47" y2="33" stroke="#374151" stroke-width="2.2"/>
      <line x1="26" y1="40" x2="44" y2="40" stroke="#374151" stroke-width="2.2"/>
    </svg>""",

    "vietqr": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 54">
      <rect x="6" y="4" width="46" height="46" rx="4" fill="#FFFFFF" stroke="#111111" stroke-width="1.9"/>
      <rect x="12" y="10" width="11" height="11" fill="none" stroke="#111111" stroke-width="2.1"/>
      <rect x="15.5" y="13.5" width="4" height="4" fill="#111111"/>
      <rect x="35" y="10" width="11" height="11" fill="none" stroke="#111111" stroke-width="2.1"/>
      <rect x="38.5" y="13.5" width="4" height="4" fill="#111111"/>
      <rect x="12" y="33" width="11" height="11" fill="none" stroke="#111111" stroke-width="2.1"/>
      <rect x="15.5" y="36.5" width="4" height="4" fill="#111111"/>
      <rect x="33" y="33" width="5.5" height="5" fill="#DC2626"/>
      <rect x="40.5" y="33" width="5.5" height="5" fill="#1D4ED8"/>
      <rect x="33" y="39.5" width="5.5" height="4.5" fill="#1D4ED8"/>
      <rect x="40.5" y="39.5" width="5.5" height="4.5" fill="#DC2626"/>
    </svg>""",

    "redis_horiz": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 116 40">
      <polygon points="22,25 5,32 22,38 39,32" fill="#A41E11"/>
      <polygon points="22,17 5,24 22,30 39,24" fill="#C62828"/>
      <polygon points="22,8 5,15 22,22 39,15" fill="#DC382D"/>
      <circle cx="17" cy="14" r="1.9" fill="#FFFFFF"/>
      <polygon points="26,12 29,16 23,16" fill="#FFFFFF"/>
      <text x="46" y="26" font-family="Helvetica,Arial,sans-serif" font-size="15.5" font-weight="800" fill="#DC382D">Redis 7</text>
    </svg>""",

    "rabbitmq_horiz": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 42">
      <rect x="4" y="4" width="36" height="34" rx="6" fill="#FF6600"/>
      <rect x="9" y="8" width="5.5" height="13" rx="1.5" fill="#FFFFFF"/>
      <rect x="18.5" y="8" width="5.5" height="13" rx="1.5" fill="#FFFFFF"/>
      <rect x="9" y="18" width="26" height="15" rx="2.5" fill="#FFFFFF"/>
      <rect x="25" y="23" width="5.5" height="5.5" rx="1.2" fill="#FF6600"/>
      <text x="48" y="27" font-family="Helvetica,Arial,sans-serif" font-size="16.5" font-weight="700" fill="#FF6600">RabbitMQ</text>
    </svg>""",

    "outbox_db": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 50">
      <ellipse cx="22" cy="10" rx="17" ry="5.5" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.8"/>
      <path d="M5 10 V36 A17 5.5 0 0 0 39 36 V10" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="1.8"/>
      <path d="M5 20 A17 5.5 0 0 0 39 20" fill="none" stroke="#93C5FD" stroke-width="1.4"/>
      <rect x="34" y="20" width="32" height="23" rx="4" fill="#FFFBEB" stroke="#D97706" stroke-width="1.9"/>
      <path d="M38 26 L50 34 L62 26" fill="none" stroke="#D97706" stroke-width="1.7" stroke-linecap="round"/>
    </svg>""",

    "rag_ai": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 50">
      <rect x="5" y="5" width="32" height="39" rx="4" fill="#FFFFFF" stroke="#111111" stroke-width="1.8"/>
      <line x1="12" y1="15" x2="31" y2="15" stroke="#6B7280" stroke-width="1.7"/>
      <line x1="12" y1="22" x2="28" y2="22" stroke="#6B7280" stroke-width="1.7"/>
      <line x1="12" y1="29" x2="24" y2="29" stroke="#6B7280" stroke-width="1.7"/>
      <circle cx="40" cy="31" r="11" fill="#EFF6FF" stroke="#2563EB" stroke-width="2.1"/>
      <line x1="48" y1="39" x2="55" y2="46" stroke="#2563EB" stroke-width="2.6" stroke-linecap="round"/>
      <text x="40" y="34.5" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="8" font-weight="800" fill="#1D4ED8">RAG</text>
    </svg>""",

    "dlq_shield": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 38">
      <polygon points="21,3 38,33 4,33" fill="#FEF2F2" stroke="#DC2626" stroke-width="2" stroke-linejoin="round"/>
      <line x1="21" y1="13" x2="21" y2="22" stroke="#DC2626" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="21" cy="27.5" r="1.6" fill="#DC2626"/>
    </svg>""",
}


def logo_uri(name: str) -> str:
    return "data:image/svg+xml;base64," + base64.b64encode(LOGOS[name].strip().encode("utf-8")).decode("ascii")


def img_svg(name, x, y, w, h):
    return f'<image x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" href="{logo_uri(name)}"/>'


def box(x, y, w, h, title=None, title_align="left", dashed=False, dash_pattern="9,5",
        sw=1.4, stroke="#111111", fill="#FFFFFF", title_color="#111111", title_size=12):
    da = f' stroke-dasharray="{dash_pattern}"' if dashed else ""
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{da}/>']
    if title:
        if title_align == "left":
            out.append(f'<text x="{x+10}" y="{y+19}" font-family="{FONT}" font-size="{title_size}" font-weight="700" fill="{title_color}">{esc(title)}</text>')
        else:
            out.append(f'<text x="{x+w/2:.1f}" y="{y+19}" text-anchor="middle" font-family="{FONT}" font-size="{title_size}" font-weight="700" fill="{title_color}">{esc(title)}</text>')
    return "\n".join(out)


def label(x, y, text, size=10.5, bold=False, color="#111111", align="middle"):
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
        pw = max(len(ln) for ln in lines) * 6.3 + 10
        ph = len(lines) * 13.5 + 5
        out.append(f'<rect x="{tx - pw/2:.1f}" y="{ty - ph/2:.1f}" width="{pw:.1f}" height="{ph:.1f}" fill="#FFFFFF" fill-opacity="0.96"/>')
        for i, ln in enumerate(lines):
            ly = ty - (len(lines) - 1) * 6.8 + i * 13.5 + 3.8
            out.append(f'<text x="{tx:.1f}" y="{ly:.1f}" text-anchor="middle" font-family="{FONT}" font-size="10.5" font-weight="700" fill="#111111">{esc(ln)}</text>')
    return "\n".join(out)


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
             sw=1.4, stroke="#111111", valign="top", font_size=11.8, font_color="#111111"):
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

    def txt(self, x, y, w, h, val, size=9.8, bold=False, color="#111111", align="center"):
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
            "strokeColor=#111111;strokeWidth=1.4;fontFamily=Helvetica;fontSize=10.5;fontStyle=1;"
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
        return f"""<mxfile host="app.diagrams.net" modified="2026-11-18T10:30:00.000Z" agent="Antigravity" version="24.7.17" type="device">
  <diagram id="nexus-service-communication-planar" name="{esc(self.name)}">
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


def build():
    p = [f'<rect x="0" y="0" width="{W}" height="{H}" fill="#FFFFFF"/>']
    d = DrawioBuilder(W, H, "Nexus Inter-Service Communication Model")

    # =========================================================================
    # TOP ROW (y = 34..144): Clients <-> API Gateway BFF <-> Redis 7 Pub/Sub
    # Completely straight horizontal connections — ZERO crossings!
    # =========================================================================
    p.append(box(70, 44, 188, 94, "Clients", title_align="center", title_size=12))
    p.append(img_svg("clients", 118, 66, 90, 54))
    p.append(label(164, 130, "4 Web · 2 Mobile APK", size=9.4, color="#4B5563"))

    cli_id = d.rect(70, 44, 188, 94, "Clients\n4 Web · 2 Mobile APK", align="center")
    d.img("clients", 118, 66, 90, 54)

    p.append(box(378, 34, 440, 112, "API Gateway BFF (:3000)", title_align="left",
                 sw=2.2, stroke=COL_GW, title_color=COL_GW_TXT, title_size=12.8))
    p.append(img_svg("nestjs", 394, 62, 82, 30))
    p.append(img_svg("rest_api", 492, 58, 64, 38))
    p.append(img_svg("websocket", 572, 58, 64, 38))
    p.append(label(726, 74, "REST Proxy (:3001–:3013)", size=10, bold=True))
    p.append(label(726, 91, "/ws/chat · /ws/tasks · /ws/locations", size=9.1, color="#5B21B6", bold=True))
    p.append(label(598, 130, "Opaque Token RBAC · Rate Limit (2,400/m) · HMAC Auth · S3 Presign", size=9.2, color="#4B5563"))

    gw_id = d.rect(378, 34, 440, 112, "API Gateway BFF (:3000)", sw=2.2, stroke=COL_GW, font_color=COL_GW_TXT)
    d.img("nestjs", 394, 62, 82, 30)
    d.img("rest_api", 492, 58, 64, 38)
    d.img("websocket", 572, 58, 64, 38)
    d.txt(644, 60, 168, 40, "<b>REST Proxy (:3001–:3013)</b><br/><font color='#5B21B6'>/ws/chat · tasks · locations</font>", size=9.2)

    # Redis 7 Pub/Sub sits right next to Gateway on Top-Right (short direct horizontal arrow!)
    p.append(box(964, 46, 256, 86, stroke=COL_RT, sw=1.7))
    p.append(img_svg("redis_horiz", 976, 67, 108, 38))
    p.append(label(1094, 76, "Pub/Sub (:6379)", size=10.4, bold=True, color="#DC2626", align="start"))
    p.append(label(1094, 93, "gateway-bff:chat", size=9.5, bold=True, color="#374151", align="start"))
    p.append(label(1094, 109, "Sync /ws/chat realtime", size=9, color="#6B7280", align="start"))

    rd_id = d.rect(964, 46, 256, 86, "Redis 7 Pub/Sub (:6379)\ngateway-bff:chat · /ws/chat", align="center", valign="middle", stroke=COL_RT, sw=1.7, font_size=10)

    # =========================================================================
    # MIDDLE-LEFT FLOATING: DT_COMMERCE (Right beside shipment-service & under Clients!)
    # Eliminates ALL cross-diagram webhook lines!
    # =========================================================================
    p.append(box(44, 240, 198, 104, "DT_COMMERCE", title_align="left", title_size=11.5))
    p.append(img_svg("webhook", 110, 266, 62, 46))
    p.append(label(143, 323, "api.truongam.tech", size=10, bold=True))
    p.append(label(143, 337, "HMAC (In) · Webhook (Out)", size=8.8, color="#4B5563"))

    dt_id = d.rect(44, 240, 198, 104, "DT_COMMERCE\napi.truongam.tech")
    d.img("webhook", 110, 266, 62, 46)

    # =========================================================================
    # MIDDLE-CENTER: ORGANIC SYNC HTTP/REST CLUSTER (x = 296..876, y = 212..588)
    # Planar ordering: shipment left, pricing right; scan right (near WS); dispatch below pickup!
    # =========================================================================
    p.append(box(296, 212, 580, 376, dashed=True, sw=2.3, stroke=COL_SYNC))
    p.append(label(580, 234, "Sync HTTP / REST (Nội bộ phản hồi ngay)", size=11.8, bold=True, color=COL_SYNC_TXT, align="start"))

    # Focal Top Row: shipment-service (:3002) + pricing-service (:3012)
    p.append(box(318, 258, 212, 62, "shipment-service (:3002)", title_align="center", sw=1.8, stroke=COL_SYNC, title_color=COL_SYNC_TXT, title_size=11.5))
    p.append(label(424, 294, "Core Order Hub · shipment_db", size=9.4, bold=True))
    p.append(label(424, 309, "Outbound Webhook (retry 3x)", size=9, color="#B45309"))

    p.append(box(616, 262, 184, 56, "pricing-service (:3012)", title_align="center", title_size=11))
    p.append(label(708, 296, "Stateless · IATA Fee", size=9.3, color="#1D4ED8", bold=True))
    p.append(label(708, 310, "Không DB / AMQP", size=8.7, color="#6B7280"))

    # Lifecycle Row (y = 372..430): pickup | manifest | delivery -> scan (scan on far right for clean WS!)
    p.append(box(316, 372, 124, 56, "pickup (:3003)", title_align="center", title_size=10.6))
    p.append(label(378, 406, "Lấy hàng", size=9, color="#4B5563"))

    p.append(box(454, 378, 126, 52, "manifest (:3005)", title_align="center", title_size=10.6))
    p.append(label(517, 412, "Đóng bao · seal", size=9, color="#4B5563"))

    p.append(box(594, 374, 126, 56, "delivery (:3007)", title_align="center", title_size=10.6))
    p.append(label(657, 408, "POD · NDR · Hoàn", size=8.9, color="#4B5563"))

    p.append(box(742, 372, 116, 58, "scan (:3006)", title_align="center", title_size=10.6))
    p.append(label(800, 406, "In/Out · GPS", size=9, color="#5B21B6", bold=True))

    # Bottom Row (y = 496..560): dispatch (under pickup!) -> masterdata <- auth | payment (above SePay!)
    p.append(box(316, 496, 132, 62, "dispatch (:3004)", title_align="center", title_size=10.6))
    p.append(label(382, 530, "Điều phối · WS", size=9, color="#5B21B6", bold=True))
    p.append(label(382, 545, "dispatch_db", size=8.6, color="#6B7280"))

    p.append(box(476, 504, 134, 54, "masterdata (:3001)", title_align="center", title_size=10.5))
    p.append(label(543, 538, "Hub · Zone · NDR", size=8.9, color="#4B5563"))

    p.append(box(636, 506, 98, 50, "auth (:3010)", title_align="center", title_size=10.5))
    p.append(label(685, 539, "Opaque · RBAC", size=8.6, color="#4B5563"))

    p.append(box(748, 496, 110, 62, "payment (:3011)", title_align="center", title_size=10.6))
    p.append(label(803, 530, "COD · Ví shop", size=8.9, color="#0F766E", bold=True))
    p.append(label(803, 545, "payment_db", size=8.6, color="#6B7280"))

    # Sync Draw.io mirror
    d.rect(296, 212, 580, 376, "Sync HTTP / REST", align="right", dashed=True, sw=2.3, stroke=COL_SYNC, font_color=COL_SYNC_TXT)
    shp_id = d.rect(318, 258, 212, 62, "shipment-service (:3002)\nCore Order Hub · Webhook", align="center", valign="middle", sw=1.8, stroke=COL_SYNC, font_color=COL_SYNC_TXT, font_size=10.4)
    prc_id = d.rect(616, 262, 184, 56, "pricing-service (:3012)\nStateless · IATA Fee", align="center", valign="middle", font_size=10)
    pck_id = d.rect(316, 372, 124, 56, "pickup (:3003)", align="center", valign="middle", font_size=10)
    mnf_id = d.rect(454, 378, 126, 52, "manifest (:3005)", align="center", valign="middle", font_size=10)
    dlv_id = d.rect(594, 374, 126, 56, "delivery (:3007)", align="center", valign="middle", font_size=10)
    scn_id = d.rect(742, 372, 116, 58, "scan (:3006)\n/ws/locations", align="center", valign="middle", font_size=9.8)
    dsp_id = d.rect(316, 496, 132, 62, "dispatch (:3004)\n/ws/tasks", align="center", valign="middle", font_size=9.8)
    mst_id = d.rect(476, 504, 134, 54, "masterdata (:3001)", align="center", valign="middle", font_size=9.8)
    aut_id = d.rect(636, 506, 98, 50, "auth (:3010)", align="center", valign="middle", font_size=9.8)
    pay_id = d.rect(748, 496, 110, 62, "payment (:3011)\nCOD · SePay", align="center", valign="middle", font_size=9.8)

    # =========================================================================
    # MIDDLE-RIGHT FLOATING: chatbot-service (:3013) — Positioned below y=464 WS lane!
    # So SSE stops at y=514, Tools shoots straight left at y=560 — ZERO CROSSINGS!
    # =========================================================================
    p.append(box(964, 482, 276, 120, "chatbot-service (:3013)", title_align="left", sw=1.6, stroke=COL_RT, title_color=COL_RT_TXT, title_size=11.5))
    p.append(img_svg("rag_ai", 976, 514, 54, 46))
    p.append(label(1040, 526, "POST /chat/stream (SSE)", size=9.8, bold=True, color="#1D4ED8", align="start"))
    p.append(label(1040, 544, "Sync Function Calling:", size=9.4, bold=True, color="#374151", align="start"))
    p.append(label(1040, 560, "• shipment (:3002) · pricing (:3012)", size=8.9, color="#4B5563", align="start"))
    p.append(label(1040, 576, "• tracking (:3008) + RAG Index", size=8.9, color="#4B5563", align="start"))

    bot_id = d.rect(964, 482, 276, 120, "chatbot-service (:3013)\nSSE · Tools (:3002/08/12)", align="center", valign="middle", stroke=COL_RT, sw=1.6, font_color=COL_RT_TXT, font_size=9.8)

    # SePay Payment floats directly under payment-service (:3011) (x=676..908, y=624..680)
    p.append(box(676, 624, 232, 56, stroke="#111111", sw=1.3))
    p.append(img_svg("vietqr", 686, 629, 44, 44))
    p.append(label(738, 647, "SePay Payment", size=10.3, bold=True, align="start"))
    p.append(label(738, 663, "qr.sepay.vn · COD Webhook", size=9, color="#4B5563", align="start"))

    sp_id = d.rect(676, 624, 232, 56, "SePay Payment\nqr.sepay.vn · COD Webhook", align="center", valign="middle", font_size=9.6)

    # =========================================================================
    # LOWER SECTION: ORGANIC ASYNC EVENT-DRIVEN MESH (x = 92..1186, y = 716..1040)
    # =========================================================================
    p.append(box(92, 716, 1094, 326, dashed=True, sw=2.3, stroke=COL_MQ))

    # 1. Outbox Publishers (9 Write Services)
    p.append(box(118, 746, 224, 198, "Outbox (9 Write Services)", title_align="center", title_size=11.2))
    p.append(img_svg("outbox_db", 196, 772, 68, 48))
    p.append(label(230, 836, "DB Write + outbox_events", size=9.8, bold=True, color="#1D4ED8"))
    p.append(label(230, 854, "ACID Transaction → Relay", size=9.3, color="#374151"))
    p.append(label(230, 878, "shipment.created · pickup.*", size=9, color="#4B5563"))
    p.append(label(230, 894, "task.assigned · manifest.*", size=9, color="#4B5563"))
    p.append(label(230, 910, "scan.* · delivery.* · ndr.*", size=9, color="#4B5563"))
    p.append(label(230, 926, "return.* · cod.* · masterdata.*", size=9, color="#4B5563"))

    # 2. RabbitMQ Broker
    p.append(box(406, 780, 188, 128, "Topic Exchange", title_align="center", sw=1.8, stroke=COL_MQ, title_color=COL_MQ_TXT, title_size=11.2))
    p.append(img_svg("rabbitmq_horiz", 432, 808, 136, 40))
    p.append(label(500, 866, "domain.events", size=11, bold=True, color="#B45309"))
    p.append(label(500, 884, "AMQP :5672 · Topic", size=9.5, color="#374151"))
    p.append(label(500, 898, "idempotency_key + Ack", size=8.9, color="#6B7280"))

    # 3. Resilient Retry & DLQ Chain (True RabbitMQ DLX/TTL Backoff: Main <-> retry.10s / retry.1m, >2x -> .dlq!)
    p.append(box(654, 744, 186, 40))
    p.append(label(747, 768, "Main Queue (<svc>.q)", size=9.8, bold=True, color="#1D4ED8"))

    p.append(box(654, 816, 82, 38))
    p.append(label(695, 832, "retry.10s", size=9.2, bold=True, color="#B45309"))
    p.append(label(695, 846, "TTL 10s (#1)", size=8.2, color="#6B7280"))

    p.append(box(758, 816, 82, 38))
    p.append(label(799, 832, "retry.1m", size=9.2, bold=True, color="#B45309"))
    p.append(label(799, 846, "TTL 60s (#2)", size=8.2, color="#6B7280"))

    p.append(box(664, 882, 168, 42, stroke=COL_RED, sw=1.5))
    p.append(img_svg("dlq_shield", 674, 888, 30, 28))
    p.append(label(762, 900, "Dead-Letter (.dlq)", size=9.3, bold=True, color=COL_RED_TXT))
    p.append(label(762, 914, "Cách ly lỗi > 2x", size=8.6, color="#991B1B"))

    # True RabbitMQ DLX/TTL arrows: Main <-> retry.10s, Main <-> retry.1m, Main --(>2x)--> .dlq
    p.append(arrow([(695, 784), (695, 816)], both=True))
    p.append(arrow([(799, 784), (799, 816)], both=True))
    p.append(arrow([(747, 784), (747, 882)], dashed=True, stroke=COL_RED))

    # 4. Consumers on Right
    p.append(box(904, 740, 254, 114, "Domain Consumers (6)", title_align="left", title_size=11, title_color=COL_SYNC_TXT))
    p.append(label(916, 776, "• shipment.q (15 events)", size=9.4, bold=True, align="start"))
    p.append(label(916, 793, "• dispatch.q (7 events)", size=9.4, align="start"))
    p.append(label(916, 810, "• payment.q (created, task)", size=9.4, align="start"))
    p.append(label(916, 827, "• delivery · manifest · scan", size=9.4, align="start"))
    p.append(label(916, 843, "Đồng bộ chéo không khóa", size=8.9, color="#6B7280", align="start"))

    p.append(box(896, 878, 262, 102, "CQRS Read Projections (2)", title_align="left", sw=1.7, stroke=COL_GW, title_color=COL_GW_TXT, title_size=11))
    p.append(label(908, 914, "• tracking-service (:3008)", size=9.6, bold=True, color="#0F766E", align="start"))
    p.append(label(918, 929, "Timeline hành trình (zero outbox)", size=8.9, color="#4B5563", align="start"))
    p.append(label(908, 949, "• reporting-service (:3009)", size=9.6, bold=True, color="#0F766E", align="start"))
    p.append(label(918, 964, "KPI & Dashboard (zero outbox)", size=8.9, color="#4B5563", align="start"))

    p.append(label(116, 1004, "Async Event-Driven Mesh (RabbitMQ AMQP :5672 · Outbox · Retry/DLQ · CQRS)",
                   size=12, bold=True, color=COL_MQ_TXT, align="start"))
    p.append(label(116, 1024, "At-least-once delivery + Idempotent consumers (event_id & idempotency_key)",
                   size=9.5, color="#6B7280", align="start"))

    # Async Draw.io mirror
    d.rect(92, 716, 1094, 326, "", dashed=True, sw=2.3, stroke=COL_MQ)
    d.txt(110, 988, 620, 26, "<b>Async Event-Driven Mesh (RabbitMQ AMQP :5672 · Outbox · Retry/DLQ · CQRS)</b>", size=11.5, color=COL_MQ_TXT, align="left")
    ob_id = d.rect(118, 746, 224, 198, "Outbox (9 Write Services)\nDB + outbox_events → Relay", align="center", valign="middle", font_size=10)
    ex_id = d.rect(406, 780, 188, 128, "RabbitMQ Topic Exchange\ndomain.events (:5672)", align="center", valign="middle", sw=1.8, stroke=COL_MQ, font_color=COL_MQ_TXT, font_size=10.2)
    q1_id = d.rect(654, 744, 186, 40, "Main Queue (<svc>.q)", align="center", valign="middle", font_size=9.8)
    r1_id = d.rect(654, 814, 86, 38, "retry.10s", align="center", valign="middle", font_size=9.5)
    r2_id = d.rect(754, 814, 86, 38, "retry.1m", align="center", valign="middle", font_size=9.5)
    dl_id = d.rect(672, 882, 168, 42, "Dead-Letter (.dlq)", align="center", valign="middle", stroke=COL_RED, sw=1.5, font_color=COL_RED_TXT, font_size=9.5)
    dc_id = d.rect(904, 740, 254, 114, "Domain Consumers (6)\nshipment.q · dispatch.q · payment.q\ndelivery · manifest · scan", align="center", valign="middle", font_size=9.5)
    cq_id = d.rect(896, 878, 262, 102, "CQRS Read Projections (2)\ntracking (:3008) · reporting (:3009)", align="center", valign="middle", sw=1.7, stroke=COL_GW, font_color=COL_GW_TXT, font_size=9.6)

    # =========================================================================
    # CASUAL UNBOXED LEGEND AT BOTTOM-LEFT (y = 1074..1106)
    # =========================================================================
    p.append('<path d="M 102 1086 L 146 1086" fill="none" stroke="#111111" stroke-width="1.5" marker-end="url(#arr)"/>')
    p.append(label(156, 1090, "HTTP / REST Đồng bộ", size=10, color="#374151", align="start"))

    p.append('<path d="M 312 1086 L 356 1086" fill="none" stroke="#111111" stroke-width="1.5" stroke-dasharray="5,4" marker-end="url(#arr)"/>')
    p.append(label(366, 1090, "Bất đồng bộ (RabbitMQ / Webhook)", size=10, color="#374151", align="start"))

    p.append('<path d="M 592 1086 L 636 1086" fill="none" stroke="#111111" stroke-width="1.5" marker-start="url(#arrStart)" marker-end="url(#arr)"/>')
    p.append(label(646, 1090, "Hai chiều (WS / PubSub / AI Tools)", size=10, color="#374151", align="start"))

    # =========================================================================
    # MATHEMATICALLY PLANAR ARROWS — ZERO (0) INTERSECTIONS ANYWHERE!!
    # =========================================================================

    # 1. Clients <-> Gateway (straight horizontal)
    p.append(arrow([(258, 90), (378, 90)], "HTTPS / WSS", (318, 74), both=True))

    # 2. Gateway <-> Redis 7 Pub/Sub (straight horizontal — ZERO crossing!)
    p.append(arrow([(818, 88), (964, 88)], "/ws/chat PubSub", (891, 72), both=True))

    # 3. DT_COMMERCE -> Gateway (Partner HMAC — clean upper-left L-turn, ZERO crossing!)
    p.append(arrow([(143, 240), (143, 178), (414, 178), (414, 146)], "Partner HMAC", (272, 178)))

    # 4. shipment-service -> DT_COMMERCE (Status Webhook — short straight horizontal left, ZERO crossing!)
    p.append(arrow([(318, 289), (242, 289)], "Webhook", (280, 273), dashed=True))

    # 5. Gateway -> Sync REST Hub (short straight drop into shipment-service, ZERO crossing!)
    p.append(arrow([(476, 146), (476, 258)], "REST Proxy", (476, 180)))

    # 6. Gateway <-> scan (:3006) & dispatch (:3004) (/ws/tasks & /ws/locations)
    # Drops cleanly at x=772 -> right to x=906 -> down to open corridor y=462 -> left to scan & dispatch!
    p.append(arrow([(772, 146), (772, 178), (906, 178), (906, 462), (418, 462), (418, 496)],
                   "/ws/tasks\n/ws/locations", (906, 300), both=True))
    p.append(arrow([(800, 462), (800, 430)]))

    # 7. Gateway <-> chatbot-service (HTTP Request / SSE Stream Back) — runs OUTSIDE right of x=906 at x=942! ZERO crossing!
    p.append(arrow([(818, 126), (942, 126), (942, 516), (964, 516)], "HTTP / SSE", (942, 370), both=True))

    # 8. chatbot-service <-> Sync (:3002, :3012) — runs at y=562 (BELOW y=516 SSE & BELOW y=462 WS)! ZERO crossing!
    p.append(arrow([(964, 562), (876, 562)], "Tools\n:3002/12", (920, 562), both=True))

    # 9. chatbot-service <-> CQRS tracking-service (:3008) — clean right outer path! ZERO crossing!
    p.append(arrow([(1140, 602), (1140, 676), (1222, 676), (1222, 928), (1158, 928)], "Track\n:3008", (1222, 796), both=True))

    # 10. Inside Sync Cluster (1): Clean, planar, zero-crossing service-to-service calls!
    p.append(arrow([(530, 290), (616, 290)], "IATA Fee", (573, 275)))
    # pickup, manifest, delivery, scan -> shipment (clean horizontal collector at y=346)
    p.append('<path d="M 378 372 L 378 346 L 800 346 L 800 372" fill="none" stroke="#111111" stroke-width="1.35"/>')
    p.append('<path d="M 517 378 L 517 346" fill="none" stroke="#111111" stroke-width="1.35"/>')
    p.append('<path d="M 657 374 L 657 346" fill="none" stroke="#111111" stroke-width="1.35"/>')
    p.append(arrow([(424, 346), (424, 320)], "GET Guard / Lookup", (594, 346)))
    # delivery -> scan (NDR scan check — straight right!)
    p.append(arrow([(720, 402), (742, 402)]))
    # dispatch -> pickup (straight up at x=352, completely left of x=418 WS branch!)
    p.append(arrow([(352, 496), (352, 428)], "Pickup", (326, 462)))
    # dispatch -> masterdata & auth -> masterdata
    p.append(arrow([(448, 530), (476, 530)]))
    p.append(arrow([(636, 530), (610, 530)]))

    # 11. payment -> SePay (short straight vertical drop! ZERO crossing!)
    p.append(arrow([(803, 558), (803, 624)], "VietQR", (803, 598), both=True))

    # 12. Sync Write Services -> Async Outbox (clean left-side step! ZERO crossing!)
    p.append(arrow([(358, 588), (358, 650), (230, 650), (230, 746)], "ACID Write (9 Services)", (294, 650), dashed=True))

    # 13. Inside Async Mesh: Outbox -> RabbitMQ -> Main Queue -> Consumers (ZERO crossings!)
    p.append(arrow([(342, 844), (406, 844)], "Publish", (374, 829), dashed=True))
    p.append(arrow([(594, 844), (624, 844), (624, 764), (654, 764)], "Route", (624, 804), dashed=True))
    p.append(arrow([(840, 764), (904, 764)], "Deliver", (872, 748), dashed=True))
    p.append(arrow([(840, 764), (870, 764), (870, 928), (896, 928)], dashed=True))

    # Mirror all edges to Draw.io XML
    d.edge(cli_id, gw_id, "HTTPS / WSS", both=True)
    d.edge(gw_id, rd_id, "/ws/chat PubSub", both=True)
    d.edge(dt_id, gw_id, "Partner HMAC", wps=[(143, 178), (414, 178)])
    d.edge(shp_id, dt_id, "Webhook", dashed=True)
    d.edge(gw_id, shp_id, "REST Proxy")
    d.edge(gw_id, dsp_id, "/ws/tasks · /ws/locations", both=True, wps=[(772, 178), (906, 178), (906, 462), (418, 462)])
    d.edge(gw_id, scn_id, "", both=True, wps=[(906, 462), (800, 462)])
    d.edge(gw_id, bot_id, "HTTP / SSE", both=True, wps=[(942, 126), (942, 516)])
    d.edge(bot_id, pay_id, "Tools :3002/12", both=True)
    d.edge(bot_id, cq_id, "Track :3008", both=True, wps=[(1140, 676), (1222, 676), (1222, 928)])
    d.edge(shp_id, prc_id, "IATA Fee")
    d.edge(pck_id, shp_id, "GET Guard / Lookup")
    d.edge(mnf_id, shp_id)
    d.edge(dlv_id, shp_id)
    d.edge(scn_id, shp_id)
    d.edge(dlv_id, scn_id)
    d.edge(dsp_id, pck_id, "Pickup")
    d.edge(dsp_id, mst_id)
    d.edge(aut_id, mst_id)
    d.edge(pay_id, sp_id, "VietQR", both=True)
    d.edge(dsp_id, ob_id, "ACID Write (9 Services)", dashed=True, wps=[(358, 650), (230, 650)])
    d.edge(ob_id, ex_id, "Publish", dashed=True)
    d.edge(ex_id, q1_id, "Route", dashed=True, wps=[(624, 844), (624, 764)])
    d.edge(q1_id, r1_id, "", both=True)
    d.edge(q1_id, r2_id, "", both=True)
    d.edge(q1_id, dl_id, "", dashed=True)
    d.edge(q1_id, dc_id, "Deliver", dashed=True)
    d.edge(q1_id, cq_id, "", dashed=True, wps=[(870, 764), (870, 928)])

    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#111111"/>
    </marker>
    <marker id="arrStart" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 10 1 L 0 5 L 10 9 z" fill="#111111"/>
    </marker>
  </defs>
{chr(10).join(p)}
</svg>
"""
    SVG_PATH.write_text(svg, encoding="utf-8")
    DRAWIO_PATH.write_text(d.render(), encoding="utf-8")
    print(f"[OK] SVG:    {SVG_PATH} ({len(svg):,} bytes)")
    print(f"[OK] drawio: {DRAWIO_PATH}")


if __name__ == "__main__":
    build()
