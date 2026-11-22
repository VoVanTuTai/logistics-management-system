#!/usr/bin/env python3
"""
Generate an Organic, Natural, Human-Drawn-on-Draw.io Overall System Architecture Diagram (Vertical A4 Portrait)
for Nexus Logistics:
  - Natural human asymmetry & generous white breathing space (NOT rigid wall-to-wall symmetric swimlanes!)
  - Short, direct 90° orthogonal arrows (NO long artificial perimeter rails!)
  - Bold distinct-colored dashed boundaries ONLY around genuine logical clusters:
      * API Gateway accent:        Bold Teal (#0F766E)
      * Backend Microservices:     Bold Indigo (#6366F1)
      * RabbitMQ Event Bus:        Bold Amber (#D97706)
      * Data & Storage Layer:      Bold Docker Blue (#0284C7)
  - 100% verified against actual codebase (4 Web Apps + 2 React Native Mobile APKs, 13 Microservices, 12 DBs, etc.)

Outputs:
  1. docs/architecture/diagrams/nexus-system-architecture.drawio
  2. docs/architecture/diagrams/nexus-system-architecture.svg
  3. Replaces old 4-tier architecture SVGs in docs/graduation-thesis/
"""

import base64
import html as html_lib
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "architecture" / "diagrams"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SVG_PATH = OUT_DIR / "nexus-system-architecture.svg"
DRAWIO_PATH = OUT_DIR / "nexus-system-architecture.drawio"

REPLACE_TARGETS = [
    ROOT / "docs/graduation-thesis/diagrams/architecture/01-architecture-deployment-4-tier.svg",
    ROOT / "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/02-architecture-deployment-4-tier.svg",
]

W, H = 1180, 1370
FONT = "Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif"

COL_GW = "#0F766E"
COL_MS = "#6366F1"
COL_MS_TXT = "#3730A3"
COL_MQ = "#D97706"
COL_MQ_TXT = "#B45309"
COL_DATA = "#0284C7"
COL_DATA_TXT = "#0369A1"


def esc(s: str) -> str:
    return html_lib.escape(str(s), quote=True)


# =============================================================================
# CRISP OFFICIAL TECH LOGOS & ABSTRACT AI ICON
# =============================================================================

LOGOS = {
    "laptop_web": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 68">
      <rect x="12" y="5" width="72" height="46" rx="4" fill="#FFFFFF" stroke="#222222" stroke-width="1.8"/>
      <line x1="12" y1="14" x2="84" y2="14" stroke="#222222" stroke-width="1.2"/>
      <circle cx="19" cy="9.5" r="1.6" fill="#EF4444"/>
      <circle cx="24.5" cy="9.5" r="1.6" fill="#F59E0B"/>
      <circle cx="30" cy="9.5" r="1.6" fill="#22C55E"/>
      <circle cx="48" cy="27" r="6" fill="none" stroke="#222222" stroke-width="1.5"/>
      <path d="M36 44 C36 36 60 36 60 44" fill="none" stroke="#222222" stroke-width="1.5"/>
      <path d="M4 52 L92 52 L95 60 L1 60 Z" fill="#F3F4F6" stroke="#222222" stroke-width="1.6"/>
    </svg>""",

    "phone_mobile": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58 88">
      <rect x="5" y="3" width="48" height="82" rx="9" fill="#FFFFFF" stroke="#6B7280" stroke-width="1.8"/>
      <line x1="22" y1="9" x2="36" y2="9" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="10" y="15" width="38" height="54" rx="3" fill="#FFFFFF" stroke="#222222" stroke-width="1.4"/>
      <circle cx="29" cy="33" r="6.5" fill="none" stroke="#222222" stroke-width="1.5"/>
      <path d="M18 52 C18 43 40 43 40 52" fill="none" stroke="#222222" stroke-width="1.5"/>
      <circle cx="29" cy="77" r="3" fill="none" stroke="#6B7280" stroke-width="1.4"/>
    </svg>""",

    "react_mini": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 40">
      <g fill="none" stroke="#00D8FF" stroke-width="2.4">
        <ellipse cx="22" cy="20" rx="17" ry="6.5"/>
        <ellipse cx="22" cy="20" rx="17" ry="6.5" transform="rotate(60 22 20)"/>
        <ellipse cx="22" cy="20" rx="17" ry="6.5" transform="rotate(120 22 20)"/>
      </g>
      <circle cx="22" cy="20" r="3.2" fill="#00D8FF"/>
    </svg>""",

    "expo_mini": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 40">
      <path d="M7 33 L20 7 C21 5 23 5 24 7 L37 33 C38 35 35 36 33 34 L22 15 L11 34 C9 36 6 35 7 33 Z" fill="#111827"/>
    </svg>""",

    "nestjs": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 46">
      <circle cx="22" cy="23" r="18" fill="#E0234E"/>
      <path d="M14 29c1-7 4-13 10-15 3 2 5 6 5 11 0 3-2 6-5 7 2-3 2-6 0-8-2 2-4 5-4 8-3 0-5-1-6-3z" fill="#FFFFFF"/>
      <text x="47" y="29" font-family="Helvetica,Arial,sans-serif" font-size="19" font-weight="700" fill="#E0234E">NestJS</text>
    </svg>""",

    "prisma": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 38">
      <path d="M19 4 L6 26 L16 33 L31 28 Z" fill="#0C344B"/>
      <path d="M19 8 L17 30 L28 26.5 Z" fill="#FFFFFF" opacity="0.22"/>
      <text x="40" y="25" font-family="Helvetica,Arial,sans-serif" font-size="17" font-weight="700" fill="#0C344B">Prisma</text>
    </svg>""",

    "rest_api": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92 66">
      <path d="M22 50h48c8 0 14-6 14-13.5 0-6.8-5-12.5-11.6-13.3C70.6 13.4 62 6 51.5 6c-8.7 0-16.3 5.2-19.5 12.8-1.4-.4-2.8-.6-4.3-.6-7.6 0-13.7 6.1-13.7 13.7 0 .7.1 1.4.2 2C10.1 35.6 7 39.8 7 44.7 7 47.8 9.6 50 13 50h9z" fill="#FFFFFF" stroke="#0EA5E9" stroke-width="3.2"/>
      <text x="46" y="32" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="13.5" font-weight="800" fill="#0284C7">REST</text>
      <text x="46" y="45" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="800" fill="#0369A1">API</text>
    </svg>""",

    "websocket": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 94 56">
      <rect x="4" y="6" width="86" height="44" rx="8" fill="#F0F9FF" stroke="#0284C7" stroke-width="2.2"/>
      <path d="M18 22 L38 22 M33 17 L38 22 L33 27" fill="none" stroke="#0284C7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M38 35 L18 35 M23 30 L18 35 L23 40" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="64" y="33" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="15" font-weight="800" fill="#0F172A">WS</text>
    </svg>""",

    "jwt_lock": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 74 56">
      <rect x="4" y="6" width="66" height="44" rx="8" fill="#F0FDF4" stroke="#16A34A" stroke-width="2.2"/>
      <path d="M20 26 V20 A6 6 0 0 1 32 20 V26" fill="none" stroke="#15803D" stroke-width="2.2"/>
      <rect x="16" y="26" width="20" height="14" rx="2" fill="#16A34A"/>
      <text x="52" y="34" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="10.8" font-weight="800" fill="#15803D">AUTH</text>
    </svg>""",

    "postgres": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 74">
      <path d="M55 6c-14 0-24 9-24 21 0 9 5 16 12 19l-1 11c0 3 2 5 5 5 2 0 4-1 5-3l2-7h4l1 7c1 2 3 3 5 3 3 0 5-2 5-5l-1-9c7-4 11-11 11-21 0-12-10-21-24-21z" fill="#336791"/>
      <path d="M45 20c-4 0-7 3-7 8 0 4 2 8 6 9" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M65 20c4 0 7 3 7 8 0 4-2 8-6 9" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="49" cy="23" r="2.1" fill="#FFFFFF"/>
      <circle cx="61" cy="23" r="2.1" fill="#FFFFFF"/>
      <path d="M55 27v16c0 3-2 5-4 5" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>
      <text x="55" y="71" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="700" fill="#336791">PostgreSQL 16</text>
    </svg>""",

    "rabbitmq_horiz": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 148 44">
      <rect x="4" y="4" width="38" height="36" rx="6" fill="#FF6600"/>
      <rect x="9" y="8" width="6" height="14" rx="1.5" fill="#FFFFFF"/>
      <rect x="19" y="8" width="6" height="14" rx="1.5" fill="#FFFFFF"/>
      <rect x="9" y="19" width="28" height="16" rx="2.5" fill="#FFFFFF"/>
      <rect x="26" y="24" width="6" height="6" rx="1.2" fill="#FF6600"/>
      <text x="52" y="28" font-family="Helvetica,Arial,sans-serif" font-size="17" font-weight="700" fill="#FF6600">RabbitMQ</text>
    </svg>""",

    "redis": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 74">
      <polygon points="50,34 22,44 50,54 78,44" fill="#A41E11"/>
      <polygon points="50,24 22,34 50,44 78,34" fill="#C62828"/>
      <polygon points="50,12 22,22 50,32 78,22" fill="#DC382D"/>
      <circle cx="42" cy="21" r="3" fill="#FFFFFF"/>
      <polygon points="55,17 59,23 51,23" fill="#FFFFFF"/>
      <rect x="46" y="24" width="6" height="4" fill="#FFFFFF"/>
      <text x="50" y="69" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="13" font-weight="700" fill="#DC382D">redis</text>
    </svg>""",

    "minio": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 74">
      <rect x="26" y="8" width="48" height="44" rx="8" fill="#C72C48"/>
      <path d="M35 42 V20 L50 33 L65 20 V42" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="50" y="68" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12.5" font-weight="700" fill="#C72C48">MinIO S3</text>
    </svg>""",

    "rag_vector": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76 66">
      <rect x="10" y="6" width="40" height="50" rx="4" fill="#FFFFFF" stroke="#111111" stroke-width="2"/>
      <line x1="18" y1="18" x2="42" y2="18" stroke="#6B7280" stroke-width="2"/>
      <line x1="18" y1="27" x2="38" y2="27" stroke="#6B7280" stroke-width="2"/>
      <line x1="18" y1="36" x2="34" y2="36" stroke="#6B7280" stroke-width="2"/>
      <circle cx="49" cy="40" r="13" fill="#EFF6FF" stroke="#2563EB" stroke-width="2.4"/>
      <line x1="58" y1="49" x2="68" y2="59" stroke="#2563EB" stroke-width="3.2" stroke-linecap="round"/>
      <text x="49" y="44" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="9.5" font-weight="700" fill="#1D4ED8">RAG</text>
    </svg>""",

    "ai_abstract": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 88">
      <defs>
        <linearGradient id="aiGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3B82F6"/>
          <stop offset="50%" stop-color="#7C3AED"/>
          <stop offset="100%" stop-color="#EC4899"/>
        </linearGradient>
      </defs>
      <g stroke="#6366F1" stroke-width="2" stroke-linecap="round" opacity="0.8">
        <line x1="22" y1="26" x2="38" y2="36"/>
        <line x1="16" y1="48" x2="36" y2="48"/>
        <line x1="24" y1="68" x2="38" y2="58"/>
        <line x1="98" y1="26" x2="82" y2="36"/>
        <line x1="104" y1="48" x2="84" y2="48"/>
        <line x1="96" y1="68" x2="82" y2="58"/>
        <line x1="60" y1="12" x2="60" y2="26"/>
        <line x1="60" y1="70" x2="60" y2="82"/>
      </g>
      <circle cx="22" cy="26" r="4.5" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2.2"/>
      <circle cx="16" cy="48" r="4.5" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.2"/>
      <circle cx="24" cy="68" r="4.5" fill="#FFFFFF" stroke="#EC4899" stroke-width="2.2"/>
      <circle cx="98" cy="26" r="4.5" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2.2"/>
      <circle cx="104" cy="48" r="4.5" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.2"/>
      <circle cx="96" cy="68" r="4.5" fill="#FFFFFF" stroke="#EC4899" stroke-width="2.2"/>
      <circle cx="60" cy="12" r="4" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2.2"/>
      <circle cx="60" cy="82" r="4" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2.2"/>
      <rect x="36" y="26" width="48" height="44" rx="10" fill="url(#aiGrad4)"/>
      <rect x="40" y="30" width="40" height="36" rx="7" fill="#FFFFFF"/>
      <text x="60" y="54" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="21" font-weight="800" fill="url(#aiGrad4)">AI</text>
      <path d="M88 12 C88.5 16.5 90.5 18.5 95 19 C90.5 19.5 88.5 21.5 88 26 C87.5 21.5 85.5 19.5 81 19 C85.5 18.5 87.5 16.5 88 12 Z" fill="#7C3AED"/>
      <path d="M32 10 C32.3 13 33.5 14.2 36.5 14.5 C33.5 14.8 32.3 16 32 19 C31.7 16 30.5 14.8 27.5 14.5 C30.5 14.2 31.7 13 32 10 Z" fill="#3B82F6"/>
    </svg>""",

    "webhook": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 62">
      <circle cx="40" cy="17" r="8" fill="none" stroke="#E11D48" stroke-width="3"/>
      <circle cx="22" cy="46" r="8" fill="none" stroke="#2563EB" stroke-width="3"/>
      <circle cx="58" cy="46" r="8" fill="none" stroke="#16A34A" stroke-width="3"/>
      <line x1="35" y1="24" x2="26" y2="39" stroke="#374151" stroke-width="2.6"/>
      <line x1="45" y1="24" x2="54" y2="39" stroke="#374151" stroke-width="2.6"/>
      <line x1="30" y1="46" x2="50" y2="46" stroke="#374151" stroke-width="2.6"/>
    </svg>""",

    "vietqr": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 68">
      <rect x="14" y="4" width="52" height="52" rx="4" fill="#FFFFFF" stroke="#111111" stroke-width="2"/>
      <rect x="20" y="10" width="14" height="14" fill="none" stroke="#111111" stroke-width="2.4"/>
      <rect x="24" y="14" width="6" height="6" fill="#111111"/>
      <rect x="46" y="10" width="14" height="14" fill="none" stroke="#111111" stroke-width="2.4"/>
      <rect x="50" y="14" width="6" height="6" fill="#111111"/>
      <rect x="20" y="36" width="14" height="14" fill="none" stroke="#111111" stroke-width="2.4"/>
      <rect x="24" y="40" width="6" height="6" fill="#111111"/>
      <rect x="44" y="36" width="6" height="6" fill="#DC2626"/>
      <rect x="53" y="36" width="7" height="6" fill="#1D4ED8"/>
      <rect x="44" y="45" width="7" height="5" fill="#1D4ED8"/>
      <rect x="54" y="45" width="6" height="5" fill="#DC2626"/>
    </svg>""",
}


def logo_data_uri(name: str) -> str:
    raw = LOGOS[name].strip().encode("utf-8")
    return "data:image/svg+xml;base64," + base64.b64encode(raw).decode("ascii")


def embed_logo_svg(name: str, x: float, y: float, w: float, h: float) -> str:
    return f'<image x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" href="{logo_data_uri(name)}"/>'


# =============================================================================
# CLASSIC DRAW.IO PRIMITIVES
# =============================================================================

def box(x, y, w, h, title=None, title_align="left", dashed=False, dash_pattern="9,5",
        sw=1.4, stroke="#111111", fill="#FFFFFF", title_color="#111111", title_size=13.5):
    da = f' stroke-dasharray="{dash_pattern}"' if dashed else ""
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{da}/>']
    if title:
        if title_align == "left":
            out.append(f'<text x="{x+10}" y="{y+21}" font-family="{FONT}" font-size="{title_size}" font-weight="700" fill="{title_color}">{esc(title)}</text>')
        else:
            out.append(f'<text x="{x+w/2:.1f}" y="{y+21}" text-anchor="middle" font-family="{FONT}" font-size="{title_size}" font-weight="700" fill="{title_color}">{esc(title)}</text>')
    return "\n".join(out)


def label(x, y, text, size=11.5, bold=False, color="#111111", align="middle"):
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
        pw = max(len(ln) for ln in lines) * 6.8 + 12
        ph = len(lines) * 14.5 + 6
        out.append(f'<rect x="{tx - pw/2:.1f}" y="{ty - ph/2:.1f}" width="{pw:.1f}" height="{ph:.1f}" fill="#FFFFFF" fill-opacity="0.96"/>')
        for i, ln in enumerate(lines):
            ly = ty - (len(lines) - 1) * 7.2 + i * 14.5 + 4
            out.append(f'<text x="{tx:.1f}" y="{ly:.1f}" text-anchor="middle" font-family="{FONT}" font-size="11.5" font-weight="700" fill="#111111">{esc(ln)}</text>')
    return "\n".join(out)


# 12 Independent Backend Microservices (3 cols x 4 rows inside natural asymmetric cluster)
SERVICES_GRID = [
    # Row 0: Core & Pricing
    ("auth-service",       ":3010 · auth_db"),
    ("masterdata-service", ":3001 · masterdata_db"),
    ("pricing-service",    ":3012 · stateless"),
    # Row 1: Order & Pickup
    ("shipment-service",   ":3002 · shipment_db"),
    ("pickup-service",     ":3003 · pickup_db"),
    ("dispatch-service",   ":3004 · dispatch_db"),
    # Row 2: Hub & Delivery
    ("manifest-service",   ":3005 · manifest_db"),
    ("scan-service",       ":3006 · scan_db"),
    ("delivery-service",   ":3007 · delivery_db"),
    # Row 3: Finance & CQRS Read (payment bottom-left right above SePay! tracking/reporting right above RabbitMQ!)
    ("payment-service",    ":3011 · payment_db"),
    ("tracking-service",   ":3008 · tracking_db"),
    ("reporting-service",  ":3009 · reporting_db"),
]

GX0, GY0 = 76, 466
CW, CH = 208, 48
GX, GY = 16, 14


def svc_xy(idx):
    r, c = divmod(idx, 3)
    return GX0 + c * (CW + GX), GY0 + r * (CH + GY), CW, CH


# =============================================================================
# BUILD ORGANIC HUMAN-DRAWN DRAW.IO SVG (1180 x 1370)
# =============================================================================

def build_svg():
    parts = []
    parts.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="#FFFFFF"/>')

    # =========================================================================
    # 1. TOP: CLIENTS (Natural compact pair — NOT wall-to-wall stretched!)
    # =========================================================================
    # Web Clients (x = 95 .. 465)
    parts.append(box(95, 38, 370, 120, "Web Clients (React / Vite)", title_align="left"))
    parts.append(embed_logo_svg("laptop_web", 112, 74, 86, 62))
    parts.append(embed_logo_svg("react_mini", 412, 46, 36, 34))
    parts.append(label(216, 86, "• Ops Web (:5173) — Hub & CSKH", size=11, align="start"))
    parts.append(label(216, 104, "• Merchant Web (:5174) — Chủ shop", size=11, align="start"))
    parts.append(label(216, 122, "• Admin Web (:5175) — Quản trị", size=11, align="start"))
    parts.append(label(216, 140, "• Guest Tracking (:5177) — Tra cứu", size=11, align="start"))

    # Mobile Clients (x = 528 .. 796)
    parts.append(box(528, 38, 268, 120, "Mobile Clients (React Native)", title_align="left"))
    parts.append(embed_logo_svg("phone_mobile", 544, 68, 52, 78))
    parts.append(embed_logo_svg("expo_mini", 752, 48, 28, 26))
    parts.append(label(610, 96, "• Customer Mobile", size=11.5, bold=True, align="start"))
    parts.append(label(620, 111, "APK · Đặt & theo dõi đơn", size=10, color="#4B5563", align="start"))
    parts.append(label(610, 132, "• Courier Mobile", size=11.5, bold=True, align="start"))
    parts.append(label(620, 147, "APK · Scan mã & POD", size=10, color="#4B5563", align="start"))

    # =========================================================================
    # 2. UPPER-MID: API GATEWAY BFF + DT_COMMERCE (Natural offset + direct arrow!)
    # =========================================================================
    parts.append(box(195, 224, 530, 122, "API Gateway BFF (:3000)", title_align="left",
                     sw=2.2, stroke=COL_GW, title_color=COL_GW))
    parts.append(embed_logo_svg("nestjs", 214, 256, 82, 32))
    parts.append(embed_logo_svg("jwt_lock", 316, 253, 56, 40))
    parts.append(embed_logo_svg("rest_api", 394, 250, 64, 46))
    parts.append(embed_logo_svg("websocket", 480, 253, 68, 40))
    parts.append(label(460, 314, "Single Entrypoint · Opaque Token RBAC · Rate Limit (2,400 req/min)", size=11.0, bold=True))
    parts.append(label(460, 333, "WS Hub: /ws/chat, /ws/tasks, /ws/locations · S3 Presign · chat_db · HMAC", size=10.3, color="#4B5563"))

    # DT_COMMERCE floating naturally to the right of API Gateway!
    parts.append(box(865, 234, 225, 102, "DT_COMMERCE", title_align="left"))
    parts.append(embed_logo_svg("webhook", 880, 266, 62, 48))
    parts.append(label(952, 286, "api.truongam.tech", size=11.2, bold=True, align="start"))
    parts.append(label(952, 304, "Partner HMAC API", size=10, color="#4B5563", align="start"))
    parts.append(label(952, 319, "& Status Webhook", size=10, color="#4B5563", align="start"))

    # =========================================================================
    # 3. MIDDLE: BACKEND MICROSERVICES (Left-Center) + AI CHATBOT & LLMs (Right)
    # =========================================================================
    # Bold Indigo dashed cluster (x = 54 .. 756, w = 702 — leaves natural open space on right!)
    parts.append(box(54, 422, 702, 316, "Backend Microservices (12 Independent Services)",
                     title_align="left", dashed=True, dash_pattern="9,5",
                     sw=2.4, stroke=COL_MS, title_color=COL_MS_TXT, title_size=13.5))
    parts.append(embed_logo_svg("nestjs", 548, 428, 66, 25))
    parts.append(embed_logo_svg("prisma", 624, 429, 74, 23))

    for idx, (sn, sp) in enumerate(SERVICES_GRID):
        sx, sy, sw, sh = svc_xy(idx)
        parts.append(box(sx, sy, sw, sh, sw=1.25))
        parts.append(label(sx + sw / 2, sy + 20, sn, size=11.5, bold=True))
        parts.append(label(sx + sw / 2, sy + 36, sp, size=9.8, color="#4B5563"))

    # Independent AI Chatbot Box floating cleanly on the Right (x = 842 .. 1126)
    parts.append(box(842, 444, 284, 178, "chatbot-service (:3013)", title_align="left", sw=1.5))
    parts.append(embed_logo_svg("nestjs", 860, 480, 82, 32))
    parts.append(embed_logo_svg("rag_vector", 968, 472, 66, 56))
    parts.append(label(984, 550, "Hybrid RAG + Function Calling", size=11.2, bold=True))
    parts.append(label(984, 568, "Tools → shipment, tracking, pricing", size=10.2, color="#4B5563"))
    parts.append(label(984, 586, "POST /message · /stream (SSE)", size=10, color="#1D4ED8", bold=True))
    parts.append(label(984, 604, "Safety Guardrail (HITL)", size=10, color="#4B5563"))

    # External AI LLMs floating directly beneath chatbot-service (short direct arrow!)
    parts.append(box(864, 690, 240, 148, "External AI LLMs", title_align="center"))
    parts.append(embed_logo_svg("ai_abstract", 930, 720, 108, 80))
    parts.append(label(984, 816, "Cloud LLM & Embedding APIs", size=10.8, bold=True))
    parts.append(label(984, 830, "(Chi tiết tại sơ đồ AI riêng)", size=9.6, color="#4B5563"))

    # =========================================================================
    # 4. LOWER-MID: SEPAY PAYMENT (Left) + RABBITMQ EVENT BUS (Center)
    # Compact organic sizes — NOT a stretched wall-to-wall bar!
    # =========================================================================
    # SePay directly beneath payment-service!
    parts.append(box(54, 826, 214, 128, "SePay Payment", title_align="left"))
    parts.append(embed_logo_svg("vietqr", 68, 862, 64, 54))
    parts.append(label(142, 882, "qr.sepay.vn", size=11, bold=True, align="start"))
    parts.append(label(142, 899, "VietQR động", size=10, color="#4B5563", align="start"))
    parts.append(label(142, 916, "& COD Webhook", size=10, color="#4B5563", align="start"))

    # RabbitMQ compact box directly beneath tracking/reporting & write services!
    parts.append(box(392, 834, 364, 108, dashed=True, dash_pattern="8,5", sw=2.4, stroke=COL_MQ))
    parts.append(embed_logo_svg("rabbitmq_horiz", 412, 850, 134, 42))
    parts.append(label(554, 872, "AMQP (:5672)", size=12, bold=True, color=COL_MQ_TXT, align="start"))
    parts.append(label(554, 889, "domain.events", size=10.8, color="#4B5563", align="start"))
    parts.append(label(574, 918, "Outbox Publish (9 Write Services) → CQRS Consume", size=10.2, bold=True, color="#374151"))

    # =========================================================================
    # 5. BOTTOM: DATA & STORAGE LAYER — BOLD DOCKER BLUE DASHED (#0284C7)
    # Naturally offset right (x = 128 .. 1126), generous white space around!
    # =========================================================================
    parts.append(box(128, 1076, 998, 224, dashed=True, dash_pattern="9,5", sw=2.5, stroke=COL_DATA))

    # 1. PostgreSQL 16
    parts.append(box(154, 1102, 260, 136))
    parts.append(embed_logo_svg("postgres", 232, 1110, 104, 68))
    parts.append(label(284, 1196, ":15432 → 5432 · 12 Isolated DBs", size=10.8, bold=True))
    parts.append(label(284, 1213, "11 DBs (Prisma) + chat_db (pg Pool)", size=9.6, color="#4B5563"))
    parts.append(label(284, 1228, "Zero Cross-DB Joins", size=9.5, color="#1D4ED8", bold=True))

    # 2. Redis 7
    parts.append(box(442, 1102, 194, 136))
    parts.append(embed_logo_svg("redis", 494, 1112, 90, 66))
    parts.append(label(539, 1196, ":6379 TCP", size=10.8, bold=True))
    parts.append(label(539, 1213, "Pub/Sub: gateway-bff:chat", size=9.8, color="#4B5563"))
    parts.append(label(539, 1228, "Realtime Chat Sync", size=9.5, color="#DC2626", bold=True))

    # 3. MinIO S3
    parts.append(box(664, 1102, 212, 136))
    parts.append(embed_logo_svg("minio", 726, 1112, 88, 66))
    parts.append(label(770, 1196, ":9000 API / :9001 UI", size=10.8, bold=True))
    parts.append(label(770, 1213, "Bucket: nexus-pod-images", size=9.6, color="#4B5563", bold=True))
    parts.append(label(770, 1228, "POD · cskh-evidence/ · claims/", size=9.4, color="#4B5563"))

    # 4. Local Vector Store
    parts.append(box(904, 1102, 198, 136))
    parts.append(embed_logo_svg("rag_vector", 968, 1116, 70, 60))
    parts.append(label(1003, 1196, "Local Vector Store", size=11, bold=True))
    parts.append(label(1003, 1213, "vector-index.json (3072-D)", size=9.6, color="#1D4ED8", bold=True))
    parts.append(label(1003, 1228, "SOP & Policy Knowledge", size=9.5, color="#4B5563"))

    parts.append(label(154, 1278, "Data & Storage Layer (PostgreSQL 16 · Redis 7 · MinIO S3 · Local Vector Store)",
                       size=13.5, bold=True, color=COL_DATA_TXT, align="start"))

    # =========================================================================
    # SHORT, DIRECT, NATURAL 90° BLACK ARROWS (ZERO PERIMETER RAILS!)
    # =========================================================================

    # 1. Web Clients & Mobile Clients -> API Gateway BFF
    parts.append(arrow([(280, 158), (280, 224)], "HTTPS / WSS", (280, 190)))
    parts.append(arrow([(640, 158), (640, 224)], "HTTPS / WSS", (640, 190)))

    # 2. DT_COMMERCE -> API Gateway BFF (Inbound Partner HMAC API) & Backend (shipment-service) -> DT_COMMERCE (Outbound Status Webhook)
    parts.append(arrow([(865, 276), (725, 276)], "Partner HMAC", (795, 259)))
    parts.append(arrow([(738, 422), (738, 366), (966, 366), (966, 336)], "Webhook (shipment)", (888, 351), dashed=True))

    # 3. API Gateway BFF -> Backend Microservices & AI Chatbot
    parts.append(arrow([(425, 346), (425, 422)], "REST + WS Proxy", (425, 384)))
    parts.append(arrow([(680, 346), (680, 404), (984, 404), (984, 444)], "HTTP / SSE", (892, 404)))

    # 4. chatbot-service <-> Backend Microservices (Tool Calling :3002, :3008, :3012)
    parts.append(arrow([(842, 535), (756, 535)], "Tools", (799, 518), both=True))

    # 5. chatbot-service <-> External AI LLMs (Short straight vertical arrow!)
    parts.append(arrow([(984, 622), (984, 690)], "HTTPS API", (984, 656), both=True))

    # 6. payment-service (row 3, col 0 -> x=76..284, y=652..700) <-> SePay Payment (Short straight drop!)
    parts.append(arrow([(161, 700), (161, 826)], "VietQR / COD", (161, 778), both=True))

    # 7. Backend Microservices -> RabbitMQ (Publish) & RabbitMQ -> CQRS Read (Consume)
    parts.append(arrow([(475, 738), (475, 834)], "Publish", (475, 782), dashed=True))
    parts.append(arrow([(648, 834), (648, 700)], "CQRS Consume", (648, 782), dashed=True))

    # 8. Backend Microservices (11 DB services) -> PostgreSQL 16 (Clean vertical drop between SePay & RabbitMQ!)
    parts.append(arrow([(324, 738), (324, 1102)], "Prisma SQL\n(11 DBs)", (324, 920)))

    # 9. API Gateway BFF -> MinIO S3, Redis 7 & PostgreSQL chat_db
    # Uses the clean natural open corridor at x = 800 (between Microservices right=756 and AI left=842)!
    parts.append('<path d="M 725 322 L 800 322 L 800 1018 L 368 1018" fill="none" stroke="#111111" stroke-width="1.4" stroke-dasharray="5,4"/>')
    parts.append(arrow([(368, 1018), (368, 1102)], "chat_db (pg)", (418, 1018), dashed=True))
    parts.append(arrow([(539, 1018), (539, 1102)], "Redis Pub/Sub", (600, 1018), dashed=True))
    parts.append(arrow([(770, 1018), (770, 1102)], "MinIO S3 API", (770, 1054), dashed=True))

    # 10. chatbot-service -> Local Vector Store (Clean right-side drop beside External AI LLMs!)
    parts.append(arrow([(1126, 540), (1148, 540), (1148, 1018), (1003, 1018), (1003, 1102)],
                       "Cosine Search\n(RAG Index)", (1003, 1018), both=True))

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
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


# =============================================================================
# BUILD NATIVE EDITABLE DRAW.IO XML (100% SYNCHRONIZED ORGANIC LAYOUT!)
# =============================================================================

def build_drawio():
    cells = []
    seq = [2]

    def nid():
        v = str(seq[0])
        seq[0] += 1
        return v

    def add_rect(x, y, w, h, title="", align="left", dashed=False, dash_pat="9 5",
                 sw=1.4, stroke="#111111", valign="top", font_size=13.5, font_color="#111111"):
        cid = nid()
        st = (
            f"rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor={stroke};"
            f"strokeWidth={sw};verticalAlign={valign};align={align};fontFamily=Helvetica;fontSize={font_size};"
            f"fontStyle=1;fontColor={font_color};spacingLeft=8;spacingTop=5;"
        )
        if dashed:
            st += f"dashed=1;dashPattern={dash_pat};"
        cells.append(
            f'        <mxCell id="{cid}" value="{esc(title)}" style="{st}" vertex="1" parent="1">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>\n'
            f'        </mxCell>'
        )
        return cid

    def add_img(logo_name, x, y, w, h):
        cid = nid()
        uri = logo_data_uri(logo_name)
        st = f"shape=image;html=1;verticalAlign=top;verticalLabelPosition=bottom;labelBackgroundColor=#ffffff;imageAspect=0;aspect=fixed;image={uri};"
        cells.append(
            f'        <mxCell id="{cid}" value="" style="{st}" vertex="1" parent="1">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>\n'
            f'        </mxCell>'
        )
        return cid

    def add_txt(x, y, w, h, val, size=10.5, bold=False, color="#111111", align="center"):
        cid = nid()
        fs = "1" if bold else "0"
        st = f"text;html=1;strokeColor=none;fillColor=none;align={align};verticalAlign=middle;whiteSpace=wrap;fontFamily=Helvetica;fontSize={size};fontStyle={fs};fontColor={color};"
        cells.append(
            f'        <mxCell id="{cid}" value="{esc(val)}" style="{st}" vertex="1" parent="1">\n'
            f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>\n'
            f'        </mxCell>'
        )
        return cid

    def add_edge(src, tgt, val="", dashed=False, both=False, wps=None):
        cid = nid()
        st = (
            "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"
            "strokeColor=#111111;strokeWidth=1.4;fontFamily=Helvetica;fontSize=11.5;fontStyle=1;"
            "fontColor=#111111;labelBackgroundColor=#FFFFFF;endArrow=classic;endFill=1;"
        )
        if dashed:
            st += "dashed=1;dashPattern=5 4;"
        if both:
            st += "startArrow=classic;startFill=1;"
        wp = ""
        if wps:
            wp = '<Array as="points">' + "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in wps) + "</Array>"
        cells.append(
            f'        <mxCell id="{cid}" value="{esc(val)}" style="{st}" edge="1" parent="1" source="{src}" target="{tgt}">\n'
            f'          <mxGeometry relative="1" as="geometry">{wp}</mxGeometry>\n'
            f'        </mxCell>'
        )
        return cid

    # Clients
    web_id = add_rect(95, 38, 370, 120, "Web Clients (React / Vite)")
    add_img("laptop_web", 112, 74, 86, 62)
    add_img("react_mini", 412, 46, 36, 34)
    add_txt(212, 68, 240, 82, "• Ops Web (:5173) — Hub &amp; CSKH<br/>• Merchant Web (:5174) — Chủ shop<br/>• Admin Web (:5175) — Quản trị<br/>• Guest Tracking (:5177) — Tra cứu", size=10.5, align="left")

    mob_id = add_rect(528, 38, 268, 120, "Mobile Clients (React Native)")
    add_img("phone_mobile", 544, 68, 52, 78)
    add_img("expo_mini", 752, 48, 28, 26)
    add_txt(606, 76, 182, 76, "<b>• Customer Mobile</b><br/>APK · Đặt &amp; theo dõi đơn<br/><b>• Courier Mobile</b><br/>APK · Scan mã &amp; POD", size=10.2, align="left")

    # Gateway & DT_COMMERCE
    gw_id = add_rect(195, 224, 530, 122, "API Gateway BFF (:3000)", sw=2.2, stroke=COL_GW, font_color=COL_GW)
    add_img("nestjs", 214, 256, 82, 32)
    add_img("jwt_lock", 316, 253, 56, 40)
    add_img("rest_api", 394, 250, 64, 46)
    add_img("websocket", 480, 253, 68, 40)
    add_txt(205, 300, 510, 42, "<b>Single Entrypoint · Opaque Token RBAC · Rate Limit (2,400 req/min)</b><br/>WS Hub: /ws/chat, /ws/tasks, /ws/locations · S3 Presign · chat_db · HMAC", size=10.2)

    dt_id = add_rect(865, 234, 225, 102, "DT_COMMERCE")
    add_img("webhook", 880, 266, 62, 48)
    add_txt(948, 268, 136, 56, "<b>api.truongam.tech</b><br/>Partner HMAC API<br/>&amp; Status Webhook", size=10, align="left")

    # Microservices Cluster
    ms_id = add_rect(54, 422, 702, 316, "Backend Microservices (12 Independent Services)",
                     dashed=True, sw=2.4, stroke=COL_MS, font_color=COL_MS_TXT)
    add_img("nestjs", 548, 428, 66, 25)
    add_img("prisma", 624, 429, 74, 23)

    svc_ids = {}
    for idx, (sn, sp) in enumerate(SERVICES_GRID):
        sx, sy, sw, sh = svc_xy(idx)
        sid = add_rect(sx, sy, sw, sh, f"<b>{sn}</b><br/><font color='#4B5563' style='font-size:9.5px;font-weight:400'>{sp}</font>",
                       align="center", valign="middle", sw=1.25, font_size=11)
        svc_ids[sn] = sid

    # AI Chatbot & External AI LLMs
    ai_id = add_rect(842, 444, 284, 178, "chatbot-service (:3013)", sw=1.5)
    add_img("nestjs", 860, 480, 82, 32)
    add_img("rag_vector", 968, 472, 66, 56)
    add_txt(852, 536, 264, 78, "<b>Hybrid RAG + Function Calling</b><br/>Tools → shipment, tracking, pricing<br/><font color='#1D4ED8'><b>POST /message · /stream (SSE)</b></font><br/>Safety Guardrail (HITL)", size=10)

    llm_id = add_rect(864, 690, 240, 148, "External AI LLMs", align="center")
    add_img("ai_abstract", 930, 720, 108, 80)
    add_txt(872, 802, 224, 34, "<b>Cloud LLM &amp; Embedding APIs</b><br/>(Chi tiết tại sơ đồ AI riêng)", size=9.8)

    # SePay & RabbitMQ
    sp_id = add_rect(54, 826, 214, 128, "SePay Payment")
    add_img("vietqr", 68, 862, 64, 54)
    add_txt(138, 864, 124, 64, "<b>qr.sepay.vn</b><br/>VietQR động<br/>&amp; COD Webhook", size=10, align="left")

    mq_id = add_rect(392, 834, 364, 108, "", dashed=True, dash_pat="8 5", sw=2.4, stroke=COL_MQ)
    add_img("rabbitmq_horiz", 412, 850, 134, 42)
    add_txt(550, 856, 196, 42, "<font color='#B45309'><b>AMQP (:5672)</b></font><br/>domain.events", size=10.8, align="left")
    add_txt(400, 902, 348, 30, "<b>Outbox Publish (9 Write Services) → CQRS Consume</b>", size=9.8)

    # Data & Storage Layer
    add_rect(128, 1076, 998, 224, "", dashed=True, sw=2.5, stroke=COL_DATA)
    add_txt(148, 1260, 740, 28, "<b>Data &amp; Storage Layer (PostgreSQL 16 · Redis 7 · MinIO S3 · Local Vector Store)</b>",
            size=13, color=COL_DATA_TXT, align="left")

    pg_id = add_rect(154, 1102, 260, 136)
    add_img("postgres", 232, 1110, 104, 68)
    add_txt(160, 1184, 248, 50, "<b>:15432 → 5432 · 12 Isolated DBs</b><br/>11 DBs (Prisma) + chat_db (pg Pool)<br/><font color='#1D4ED8'><b>Zero Cross-DB Joins</b></font>", size=9.6)

    rd_id = add_rect(442, 1102, 194, 136)
    add_img("redis", 494, 1112, 90, 66)
    add_txt(448, 1184, 182, 50, "<b>:6379 TCP</b><br/>Pub/Sub: gateway-bff:chat<br/><font color='#DC2626'><b>Realtime Chat Sync</b></font>", size=9.8)

    mn_id = add_rect(664, 1102, 212, 136)
    add_img("minio", 726, 1112, 88, 66)
    add_txt(670, 1184, 200, 50, "<b>:9000 API / :9001 UI</b><br/><b>Bucket: nexus-pod-images</b><br/>POD · cskh-evidence/ · claims/", size=9.5)

    vs_id = add_rect(904, 1102, 198, 136)
    add_img("rag_vector", 968, 1116, 70, 60)
    add_txt(910, 1184, 186, 50, "<b>Local Vector Store</b><br/><font color='#1D4ED8'><b>vector-index.json (3072-D)</b></font><br/>SOP &amp; Policy Knowledge", size=9.6)

    # Edges
    add_edge(web_id, gw_id, "HTTPS / WSS")
    add_edge(mob_id, gw_id, "HTTPS / WSS")
    add_edge(dt_id, gw_id, "Partner HMAC")
    add_edge(ms_id, dt_id, "Webhook (shipment)", dashed=True, wps=[(738, 366), (966, 366)])
    add_edge(gw_id, ms_id, "REST + WS Proxy")
    add_edge(gw_id, ai_id, "HTTP / SSE", wps=[(680, 404), (984, 404)])
    add_edge(ai_id, ms_id, "Tools", both=True)
    add_edge(ai_id, llm_id, "HTTPS API", both=True)
    add_edge(svc_ids["payment-service"], sp_id, "VietQR / COD", both=True)
    add_edge(ms_id, mq_id, "Publish", dashed=True)
    add_edge(mq_id, svc_ids["reporting-service"], "CQRS Consume", dashed=True)
    add_edge(ms_id, pg_id, "Prisma SQL (11 DBs)")
    add_edge(gw_id, pg_id, "chat_db (pg)", dashed=True, wps=[(800, 322), (800, 1018), (368, 1018)])
    add_edge(gw_id, rd_id, "Redis Pub/Sub", dashed=True, wps=[(800, 322), (800, 1018), (539, 1018)])
    add_edge(gw_id, mn_id, "MinIO S3 API", dashed=True, wps=[(800, 322), (800, 1018), (770, 1018)])
    add_edge(ai_id, vs_id, "Cosine Search (RAG)", both=True, wps=[(1148, 540), (1148, 1018), (1003, 1018)])

    return f"""<mxfile host="app.diagrams.net" modified="2026-11-18T08:52:00.000Z" agent="Antigravity" version="24.7.17" type="device">
  <diagram id="nexus-system-architecture-organic" name="Nexus System Architecture">
    <mxGraphModel dx="1220" dy="1410" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{W}" pageHeight="{H}" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
{chr(10).join(cells)}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
"""


def main():
    svg = build_svg()
    SVG_PATH.write_text(svg, encoding="utf-8")
    print(f"[OK] SVG:    {SVG_PATH} ({len(svg):,} bytes)")

    dio = build_drawio()
    DRAWIO_PATH.write_text(dio, encoding="utf-8")
    print(f"[OK] drawio: {DRAWIO_PATH} ({len(dio):,} bytes)")

    for tgt in REPLACE_TARGETS:
        if tgt.parent.exists():
            shutil.copy2(SVG_PATH, tgt)
            print(f"[OK] Replaced old diagram: {tgt}")


if __name__ == "__main__":
    main()
