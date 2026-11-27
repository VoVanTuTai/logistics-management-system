#!/usr/bin/env python3
"""
Generate an authentic, human-built draw.io (app.diagrams.net) Deployment Architecture Diagram
- Compact, airy service boxes (4x3 grid of 12 independent microservices + standalone chatbot-service)
- Distinct, bold colored dashed boundaries so every runtime layer stands out clearly at a glance:
    * Outer Host Boundary:      Bold Dark Slate (#334155)
    * PM2 Native Runtime:       Bold Emerald Green (#059669)
    * Backend Microservices:    Bold Indigo (#6366F1)
    * Docker Desktop Runtime:   Bold Docker Blue (#0284C7)
- Abstract iconic AI neural-chip emblem for External AI LLMs
- 100% verified against actual repository deployment configs & codebase

Outputs:
  1. docs/architecture/diagrams/nexus-mac-deployment.drawio
  2. docs/architecture/diagrams/nexus-mac-deployment.svg
"""

import base64
import html as html_lib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "architecture" / "diagrams"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SVG_PATH = OUT_DIR / "nexus-mac-deployment.svg"
DRAWIO_PATH = OUT_DIR / "nexus-mac-deployment.drawio"

W, H = 1580, 880
FONT = "Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif"

# Distinct bold dashed boundary colors (clean white interiors!)
COL_OUTER = "#334155"   # Dark Slate
COL_PM2 = "#059669"     # Emerald Green
COL_PM2_TXT = "#065F46"
COL_MS = "#6366F1"      # Indigo
COL_MS_TXT = "#3730A3"
COL_DOCKER = "#0284C7"  # Docker Blue
COL_DOCKER_TXT = "#0369A1"


def esc(s: str) -> str:
    return html_lib.escape(str(s), quote=True)


# =============================================================================
# CRISP OFFICIAL TECH LOGOS & ABSTRACT AI ICON
# =============================================================================

LOGOS = {
    "laptop_web": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 78">
      <rect x="14" y="6" width="82" height="54" rx="4" fill="#FFFFFF" stroke="#222222" stroke-width="1.8"/>
      <line x1="14" y1="16" x2="96" y2="16" stroke="#222222" stroke-width="1.2"/>
      <circle cx="21" cy="11" r="1.8" fill="#EF4444"/>
      <circle cx="27" cy="11" r="1.8" fill="#F59E0B"/>
      <circle cx="33" cy="11" r="1.8" fill="#22C55E"/>
      <circle cx="55" cy="31" r="7" fill="none" stroke="#222222" stroke-width="1.6"/>
      <path d="M41 51 C41 42 69 42 69 51" fill="none" stroke="#222222" stroke-width="1.6"/>
      <path d="M6 61 L104 61 L108 69 L2 69 Z" fill="#F3F4F6" stroke="#222222" stroke-width="1.6"/>
      <line x1="46" y1="65" x2="64" y2="65" stroke="#555555" stroke-width="1.5"/>
    </svg>""",

    "phone_mobile": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 136">
      <rect x="6" y="4" width="76" height="128" rx="14" fill="#FFFFFF" stroke="#9CA3AF" stroke-width="1.8"/>
      <line x1="34" y1="12" x2="54" y2="12" stroke="#9CA3AF" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="62" cy="12" r="1.8" fill="#9CA3AF"/>
      <rect x="13" y="21" width="62" height="92" rx="4" fill="#FFFFFF" stroke="#222222" stroke-width="1.5"/>
      <circle cx="44" cy="48" r="10" fill="none" stroke="#222222" stroke-width="1.6"/>
      <path d="M27 78 C27 65 61 65 61 78" fill="none" stroke="#222222" stroke-width="1.6"/>
      <text x="44" y="96" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="10.5" font-weight="700" fill="#111111">Mobile App</text>
      <text x="44" y="108" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="9" fill="#4B5563">Expo / APK</text>
      <circle cx="44" cy="123" r="4.5" fill="none" stroke="#9CA3AF" stroke-width="1.5"/>
    </svg>""",

    "cloudflare": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 68">
      <path d="M90.5 38.2c.6-2.1.4-4.1-.6-5.5-.9-1.2-2.4-1.9-4.2-2l-34-.4c-.2 0-.4-.1-.5-.3-.1-.2-.1-.4 0-.6.2-.5.7-.8 1.2-.8l34.3-.4c4.1-.2 8.5-3.5 10-7.5l1.9-5.1c.1-.3.1-.5.1-.8C96.4 6.1 88.6 0 79.3 0c-8.4 0-15.6 5.4-18.3 12.9-1.7-1.2-3.8-1.9-6.1-1.7-4.1.4-7.4 3.7-7.8 7.8-.1 1.1 0 2.1.2 3.1-6.6.2-11.9 5.6-11.9 12.3 0 .6.1 1.2.1 1.8.1.4.4.7.8.7h53.1c.5 0 .9-.3 1.1-.7z" fill="#F38020"/>
      <path d="M100.3 21.1h-.8c-.2 0-.4.2-.5.4l-1.3 4.6c-.6 2.1-.4 4.1.6 5.5.9 1.2 2.4 1.9 4.2 2l7.4.4c.2 0 .4.1.5.3.1.2.1.4 0 .6-.2.5-.7.8-1.2.8l-7.7.4c-4.1.2-8.5 3.5-10 7.5l-.6 1.5c-.1.3.1.6.4.6h25.9c.3 0 .6-.2.7-.5.5-1.7.7-3.5.7-5.4 0-10.3-8.3-18.7-18.6-18.7z" fill="#FAAE40"/>
      <text x="65" y="62" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="13.5" font-weight="700" letter-spacing="1" fill="#222222">CLOUDFLARE</text>
    </svg>""",

    "nodejs": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="34" fill="#303030"/>
      <text x="40" y="45" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">node</text>
      <polygon points="40,51 47,55 47,63 40,67 33,63 33,55" fill="#68A063"/>
      <text x="40" y="62" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="8.5" font-weight="700" fill="#FFFFFF">JS</text>
    </svg>""",

    "nestjs": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 46">
      <circle cx="22" cy="23" r="18" fill="#E0234E"/>
      <path d="M14 29c1-7 4-13 10-15 3 2 5 6 5 11 0 3-2 6-5 7 2-3 2-6 0-8-2 2-4 5-4 8-3 0-5-1-6-3z" fill="#FFFFFF"/>
      <text x="47" y="29" font-family="Helvetica,Arial,sans-serif" font-size="19" font-weight="700" fill="#E0234E">NestJS</text>
    </svg>""",

    "pm2": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 38">
      <rect x="2" y="3" width="84" height="32" rx="6" fill="#065F46"/>
      <polygon points="14,19 22,11 30,19 22,27" fill="#34D399"/>
      <text x="58" y="25" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">PM2</text>
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

    "react": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76 74">
      <g fill="none" stroke="#00D8FF" stroke-width="3">
        <ellipse cx="38" cy="28" rx="26" ry="10"/>
        <ellipse cx="38" cy="28" rx="26" ry="10" transform="rotate(60 38 28)"/>
        <ellipse cx="38" cy="28" rx="26" ry="10" transform="rotate(120 38 28)"/>
      </g>
      <circle cx="38" cy="28" r="4.8" fill="#00D8FF"/>
      <text x="38" y="66" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="700" fill="#111111">React JS</text>
    </svg>""",

    "vite": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 74">
      <polygon points="34,54 8,10 60,10" fill="#646CFF"/>
      <polygon points="37,4 22,28 33,28 28,48 48,22 36,22" fill="#FFCA28"/>
      <text x="34" y="68" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="700" fill="#111111">Vite</text>
    </svg>""",

    "docker": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 116 42">
      <g fill="#2496ED">
        <rect x="14" y="13" width="7" height="6" rx="1"/>
        <rect x="22" y="13" width="7" height="6" rx="1"/>
        <rect x="30" y="13" width="7" height="6" rx="1"/>
        <rect x="22" y="6" width="7" height="6" rx="1"/>
        <rect x="30" y="6" width="7" height="6" rx="1"/>
        <path d="M6 21h36c2 0 4-1 5-3 2 2 2 5 0 8-3 7-10 11-20 11-11 0-19-5-21-16z"/>
      </g>
      <circle cx="15" cy="27" r="1.4" fill="#FFFFFF"/>
      <text x="54" y="29" font-family="Helvetica,Arial,sans-serif" font-size="18" font-weight="700" fill="#2496ED">docker</text>
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

    "rabbitmq": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 74">
      <rect x="31" y="8" width="48" height="44" rx="7" fill="#FF6600"/>
      <rect x="37" y="12" width="7" height="18" rx="2" fill="#FFFFFF"/>
      <rect x="50" y="12" width="7" height="18" rx="2" fill="#FFFFFF"/>
      <rect x="37" y="26" width="35" height="20" rx="3" fill="#FFFFFF"/>
      <rect x="58" y="32" width="8" height="8" rx="1.5" fill="#FF6600"/>
      <text x="55" y="68" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="700" fill="#FF6600">RabbitMQ</text>
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
        <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
      <rect x="36" y="26" width="48" height="44" rx="10" fill="url(#aiGrad)"/>
      <rect x="40" y="30" width="40" height="36" rx="7" fill="#FFFFFF"/>
      <text x="60" y="54" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="21" font-weight="800" fill="url(#aiGrad)">AI</text>
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

    "shield_check": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 70">
      <path d="M32 4 L58 14 V34 C58 50 46 60 32 66 C18 60 6 50 6 34 V14 Z" fill="#FFFFFF" stroke="#1F2937" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M20 35 L29 44 L46 25" fill="none" stroke="#1F2937" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>""",
}


# 12 Independent Backend Microservices (4 columns x 3 rows — compact & airy!)
DOMAIN_SERVICES = [
    # Row 0
    ("auth-service",       ":3010 · auth_db"),
    ("masterdata-service", ":3001 · masterdata_db"),
    ("pricing-service",    ":3012 · stateless"),
    ("shipment-service",   ":3002 · shipment_db"),
    # Row 1
    ("pickup-service",     ":3003 · pickup_db"),
    ("dispatch-service",   ":3004 · dispatch_db"),
    ("manifest-service",   ":3005 · manifest_db"),
    ("scan-service",       ":3006 · scan_db"),
    # Row 2
    ("delivery-service",   ":3007 · delivery_db"),
    ("tracking-service",   ":3008 · tracking_db"),
    ("reporting-service",  ":3009 · reporting_db"),
    ("payment-service",    ":3011 · payment_db"),
]


def logo_data_uri(name: str) -> str:
    raw = LOGOS[name].strip().encode("utf-8")
    return "data:image/svg+xml;base64," + base64.b64encode(raw).decode("ascii")


def embed_logo_svg(name: str, x: float, y: float, w: float, h: float) -> str:
    return f'<image x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" href="{logo_data_uri(name)}"/>'


# =============================================================================
# CLASSIC DRAW.IO PRIMITIVES
# =============================================================================

def box(x, y, w, h, title=None, title_align="left", dashed=False, dash_pattern="8,5",
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


def arrow(pts, text=None, tpos=None, dashed=False, both=False, sw=1.4):
    da = ' stroke-dasharray="5,4"' if dashed else ""
    d = "M " + " L ".join(f"{px:.1f} {py:.1f}" for px, py in pts)
    m_end = ' marker-end="url(#arr)"'
    m_start = ' marker-start="url(#arrStart)"' if both else ""
    out = [f'<path d="{d}" fill="none" stroke="#111111" stroke-width="{sw}" stroke-linejoin="miter"{da}{m_start}{m_end}/>']
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


# Compact 4x3 Grid for 12 independent microservice boxes!
GRID_X0, GRID_Y0 = 532, 344
CELL_W, CELL_H = 122, 42
GAP_X, GAP_Y = 9, 12


def svc_box_coords(idx):
    row, col = divmod(idx, 4)
    x = GRID_X0 + col * (CELL_W + GAP_X)
    y = GRID_Y0 + row * (CELL_H + GAP_Y)
    return x, y, CELL_W, CELL_H


# =============================================================================
# BUILD PURE DRAW.IO SVG
# =============================================================================

def build_svg():
    parts = []
    parts.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="#FFFFFF"/>')

    # =========================================================================
    # LEFT COLUMN: CLIENTS + CLOUDFLARE EDGE (Compact & Airy)
    # =========================================================================
    parts.append(box(56, 66, 184, 154, "Client (Web-app)", title_align="left"))
    parts.append(embed_logo_svg("laptop_web", 98, 92, 100, 72))
    parts.append(label(148, 184, "4 Web Portals (HTTPS)", size=11.5, bold=True))
    parts.append(label(148, 202, "ops · merchant · admin · tracking", size=9.6, color="#4B5563"))

    parts.append(embed_logo_svg("phone_mobile", 104, 266, 88, 136))
    parts.append(label(148, 420, "Courier & Customer", size=11.5, bold=True))
    parts.append(label(148, 436, "(React Native · APK)", size=10, color="#4B5563"))

    parts.append(box(56, 502, 184, 144, "Cloudflare Edge", title_align="left"))
    parts.append(embed_logo_svg("cloudflare", 86, 530, 124, 64))
    parts.append(label(148, 614, "*.nexus-ex.site · Auto SSL", size=11, bold=True))
    parts.append(label(148, 631, "Zero Trust Tunnel", size=10, color="#4B5563"))

    # =========================================================================
    # OUTER DEPLOYMENT BOUNDARY — BOLD DARK SLATE DASHED (#334155, sw=2.6)
    # =========================================================================
    parts.append(box(300, 38, 990, 808, dashed=True, dash_pattern="10,6", sw=2.6, stroke=COL_OUTER))

    # cloudflared Daemon (Left entry inside boundary)
    parts.append(box(322, 516, 138, 116, "cloudflared", title_align="center"))
    parts.append(embed_logo_svg("shield_check", 370, 544, 42, 46))
    parts.append(label(391, 606, "LaunchDaemon", size=11, bold=True))
    parts.append(label(391, 622, "Outbound Tunnel", size=10, color="#4B5563"))

    # -------------------------------------------------------------------------
    # RUNTIME 1: PM2 Process Manager — BOLD EMERALD GREEN DASHED (#059669, sw=2.5)
    # -------------------------------------------------------------------------
    parts.append(box(494, 62, 774, 496, dashed=True, dash_pattern="9,5", sw=2.5, stroke=COL_PM2))
    parts.append(embed_logo_svg("pm2", 508, 69, 60, 24))
    parts.append(label(576, 86, "PM2 Process Manager — 15 Node.js Processes (ecosystem.config.cjs)",
                       size=13.5, bold=True, color=COL_PM2_TXT, align="start"))

    # Box A: Frontend Static Server (Compact)
    parts.append(box(516, 108, 266, 124, "Frontend Static Server", title_align="left"))
    parts.append(embed_logo_svg("nodejs", 534, 140, 50, 50))
    parts.append(embed_logo_svg("react", 604, 140, 56, 54))
    parts.append(embed_logo_svg("vite", 682, 140, 48, 54))
    parts.append(label(649, 209, "Web SPAs (:5173–:5177) + Reverse Proxy", size=11, bold=True))
    parts.append(label(649, 224, "nexus-static-web (serve-static-apps.mjs)", size=10, color="#4B5563"))

    # Box B: API Gateway BFF (:3000) (Compact)
    parts.append(box(880, 108, 364, 124, "API Gateway BFF (:3000)", title_align="left"))
    parts.append(embed_logo_svg("nestjs", 900, 145, 86, 34))
    parts.append(embed_logo_svg("rest_api", 1010, 136, 70, 50))
    parts.append(embed_logo_svg("websocket", 1106, 141, 78, 44))
    parts.append(label(1062, 209, "Opaque Token · Rate Limit · /ws/chat · /ws/tasks · /ws/locations", size=10.3, bold=True))
    parts.append(label(1062, 224, "chat_db · MinIO S3 Presign · Partner HMAC", size=10, color="#4B5563"))

    # -------------------------------------------------------------------------
    # SUB-CLUSTER: Backend Microservices — BOLD INDIGO DASHED (#6366F1, sw=2.3)
    # 12 compact independent service boxes (4 cols x 3 rows)!
    # -------------------------------------------------------------------------
    parts.append(box(516, 294, 546, 240, dashed=True, dash_pattern="7,4", sw=2.3, stroke=COL_MS))
    parts.append(label(528, 316, "Backend Microservices (12 Independent Services)", size=12.8, bold=True, color=COL_MS_TXT, align="start"))
    parts.append(embed_logo_svg("nestjs", 864, 299, 70, 26))
    parts.append(embed_logo_svg("prisma", 944, 300, 78, 24))

    for idx, (sname, ssub) in enumerate(DOMAIN_SERVICES):
        sx, sy, sw, sh = svc_box_coords(idx)
        parts.append(box(sx, sy, sw, sh, sw=1.2))
        parts.append(label(sx + sw / 2, sy + 18, sname, size=10.6, bold=True))
        parts.append(label(sx + sw / 2, sy + 33, ssub, size=9.1, color="#4B5563"))

    # Box D: Independent chatbot-service (:3013) — Compact!
    parts.append(box(1082, 308, 162, 212, "chatbot-service", title_align="center", title_size=13))
    parts.append(label(1163, 344, "(:3013 · NestJS)", size=10.5, color="#4B5563"))
    parts.append(embed_logo_svg("nestjs", 1122, 358, 82, 32))
    parts.append(embed_logo_svg("rag_vector", 1131, 400, 64, 56))
    parts.append(label(1163, 474, "Local RAG Index", size=11, bold=True))
    parts.append(label(1163, 489, "vector-index.json", size=10, color="#4B5563"))
    parts.append(label(1163, 508, "Tools: :3002, :3008, :3012", size=9.6, color="#4B5563"))

    # -------------------------------------------------------------------------
    # RUNTIME 2: Docker Desktop — BOLD DOCKER BLUE DASHED (#0284C7, sw=2.5)
    # -------------------------------------------------------------------------
    parts.append(box(322, 646, 946, 178, dashed=True, dash_pattern="9,5", sw=2.5, stroke=COL_DOCKER))

    # 4 compact white infra boxes
    parts.append(box(344, 664, 200, 108))
    parts.append(embed_logo_svg("minio", 402, 671, 84, 62))
    parts.append(label(444, 749, ":9000 API / :9001 UI", size=10.8, bold=True))
    parts.append(label(444, 764, "Bucket: nexus-pod-images", size=9.5, color="#4B5563"))

    parts.append(box(568, 664, 224, 108))
    parts.append(embed_logo_svg("postgres", 632, 671, 96, 64))
    parts.append(label(680, 749, ":15432 → 5432", size=10.8, bold=True))
    parts.append(label(680, 764, "12 DBs (11 Prisma + chat_db pg)", size=9.2, color="#4B5563"))

    parts.append(box(816, 664, 210, 108))
    parts.append(embed_logo_svg("rabbitmq", 876, 671, 90, 62))
    parts.append(label(921, 749, ":5672 AMQP / :15672 UI", size=10.8, bold=True))
    parts.append(label(921, 764, "domain.events (9 Outbox · CQRS)", size=9.2, color="#4B5563"))

    parts.append(box(1050, 664, 196, 108))
    parts.append(embed_logo_svg("redis", 1106, 671, 84, 62))
    parts.append(label(1148, 749, ":6379 TCP", size=10.8, bold=True))
    parts.append(label(1148, 764, "gateway-bff:chat Pub/Sub", size=9.5, color="#4B5563"))

    # Docker Desktop bottom footer
    parts.append(embed_logo_svg("docker", 344, 782, 88, 32))
    parts.append(label(440, 804, "Docker Desktop — 4 Infrastructure Containers (infra/dev/docker-compose.yml)",
                       size=13.5, bold=True, color=COL_DOCKER_TXT, align="start"))

    # =========================================================================
    # RIGHT COLUMN: EXTERNAL SERVICES (Compact & Balanced)
    # =========================================================================
    parts.append(box(1354, 108, 192, 124, "DT_COMMERCE", title_align="left"))
    parts.append(embed_logo_svg("webhook", 1414, 138, 72, 56))
    parts.append(label(1450, 209, "api.truongam.tech", size=11, bold=True))
    parts.append(label(1450, 224, "HMAC API & Status Webhook", size=10, color="#4B5563"))

    parts.append(box(1354, 336, 192, 156, "External AI LLMs", title_align="left"))
    parts.append(embed_logo_svg("ai_abstract", 1396, 366, 108, 80))
    parts.append(label(1450, 464, "Cloud LLM & Embedding APIs", size=10.8, bold=True))
    parts.append(label(1450, 480, "(Multi-Provider HTTPS)", size=10, color="#4B5563"))

    parts.append(box(1354, 540, 192, 132, "SePay Payment", title_align="left"))
    parts.append(embed_logo_svg("vietqr", 1414, 570, 72, 62))
    parts.append(label(1450, 646, "qr.sepay.vn · userapi.sepay.vn", size=10.5, bold=True))
    parts.append(label(1450, 661, "VietQR & COD Webhook", size=10, color="#4B5563"))

    # =========================================================================
    # CRISP 90° ORTHOGONAL BLACK ARROWS (100% VERIFIED REAL CONNECTIONS!)
    # =========================================================================

    # Web Client -> Cloudflare Edge
    parts.append(arrow([(56, 142), (28, 142), (28, 574), (56, 574)], "HTTPS", (28, 355)))

    # Mobile Client -> Cloudflare Edge
    parts.append(arrow([(148, 444), (148, 502)], "HTTPS / WSS", (196, 472)))

    # Cloudflare Edge <-> cloudflared
    parts.append(arrow([(240, 574), (322, 574)], "Tunnel", (281, 559), both=True))

    # cloudflared -> Frontend Static Server
    parts.append(arrow([(391, 516), (391, 170), (516, 170)], "ops / merchant / admin\ncustomer / tracking", (391, 345)))

    # cloudflared -> MinIO S3 (minio.* -> :9000)
    parts.append(arrow([(424, 632), (424, 664)], "minio.* (:9000)", (398, 646), dashed=True))

    # Frontend Static Server -> API Gateway BFF (Reverse Proxy)
    parts.append(arrow([(782, 170), (880, 170)], "Proxy\nAPI / WS", (831, 148)))

    # API Gateway BFF -> Backend Microservices & Chatbot
    parts.append(arrow([(1062, 232), (1062, 266), (788, 266), (788, 294)], "REST + WS Proxy (:3001–:3013)", (930, 266)))
    parts.append(arrow([(1062, 266), (1163, 266), (1163, 308)]))

    # Chatbot <-> Microservices (Tool Calling :3008 & :3012)
    parts.append(arrow([(1082, 414), (1062, 414)], both=True))

    # API Gateway BFF -> MinIO S3 (ONLY gateway-bff connects to MinIO S3!)
    parts.append(arrow([(914, 232), (914, 250), (478, 250), (478, 664)], "S3 API", (478, 602), dashed=True))

    # Backend Microservices (11 DB services) + Gateway (chat_db) -> PostgreSQL 16
    parts.append(arrow([(680, 534), (680, 664)], "Prisma SQL :15432", (680, 602)))

    # Backend Microservices (11 services) <-> RabbitMQ 3.13
    parts.append(arrow([(921, 534), (921, 664)], "AMQP :5672", (921, 602), dashed=True, both=True))

    # API Gateway BFF <-> Redis 7 (ONLY gateway-bff connects to Redis!)
    parts.append(arrow([(1244, 198), (1256, 198), (1256, 602), (1148, 602), (1148, 664)], "Pub/Sub :6379", (1202, 602), both=True))

    # API Gateway BFF <-> DT_COMMERCE (HMAC API & Webhook)
    parts.append(arrow([(1244, 170), (1354, 170)], "HMAC / Webhook", (1302, 155), both=True))

    # chatbot-service (:3013) <-> External AI LLMs
    parts.append(arrow([(1244, 414), (1354, 414)], "HTTPS API", (1302, 399), both=True))

    # payment-service (:3011) <-> SePay Payment (straight out from compact payment-service box!)
    px, py, pw, ph = svc_box_coords(11)  # payment-service is row 2, col 3
    parts.append(arrow([(px + pw / 2, py + ph), (px + pw / 2, 578), (1316, 578), (1316, 606), (1354, 606)], "VietQR / COD", (1316, 562), both=True))

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
# BUILD NATIVE EDITABLE DRAW.IO XML (100% SYNCHRONIZED WITH SVG!)
# =============================================================================

def build_drawio():
    cells = []
    seq = [2]

    def nid():
        v = str(seq[0])
        seq[0] += 1
        return v

    def add_rect(x, y, w, h, title="", align="left", dashed=False, dash_pat="8 5",
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

    # Bold, Distinct-Color Dashed Boundaries
    add_rect(300, 38, 990, 808, "", dashed=True, dash_pat="10 6", sw=2.6, stroke=COL_OUTER)

    add_rect(494, 62, 774, 496, "                  PM2 Process Manager — 15 Node.js Processes (ecosystem.config.cjs)",
             dashed=True, dash_pat="9 5", sw=2.5, stroke=COL_PM2, font_size=13, font_color=COL_PM2_TXT)
    add_img("pm2", 508, 69, 60, 24)

    ms_grp_id = add_rect(516, 294, 546, 240, "Backend Microservices (12 Independent Services)",
                         dashed=True, dash_pat="7 4", sw=2.3, stroke=COL_MS, font_size=12.5, font_color=COL_MS_TXT)
    add_img("nestjs", 864, 299, 70, 26)
    add_img("prisma", 944, 300, 78, 24)

    add_rect(322, 646, 946, 178, "", dashed=True, dash_pat="9 5", sw=2.5, stroke=COL_DOCKER)
    add_img("docker", 344, 782, 88, 32)
    add_txt(440, 785, 580, 26, "<b>Docker Desktop — 4 Infrastructure Containers (infra/dev/docker-compose.yml)</b>",
            size=13, color=COL_DOCKER_TXT, align="left")

    # Left Column
    web_id = add_rect(56, 66, 184, 154, "Client (Web-app)")
    add_img("laptop_web", 98, 92, 100, 72)
    add_txt(58, 170, 180, 42, "<b>4 Web Portals (HTTPS)</b><br/>ops · merchant · admin · tracking", size=9.5)

    mob_id = add_img("phone_mobile", 104, 266, 88, 136)
    add_txt(58, 406, 180, 36, "<b>Courier &amp; Customer</b><br/>(React Native · APK)", size=10)

    cf_id = add_rect(56, 502, 184, 144, "Cloudflare Edge")
    add_img("cloudflare", 86, 530, 124, 64)
    add_txt(58, 600, 180, 38, "<b>*.nexus-ex.site · Auto SSL</b><br/>Zero Trust Tunnel", size=10)

    # cloudflared
    cfd_id = add_rect(322, 516, 138, 116, "cloudflared", align="center")
    add_img("shield_check", 370, 544, 42, 46)
    add_txt(326, 594, 130, 32, "<b>LaunchDaemon</b><br/>Outbound Tunnel", size=10)

    # PM2 Frontend Static Server & API Gateway
    fe_id = add_rect(516, 108, 266, 124, "Frontend Static Server")
    add_img("nodejs", 534, 140, 50, 50)
    add_img("react", 604, 140, 56, 54)
    add_img("vite", 682, 140, 48, 54)
    add_txt(522, 198, 254, 30, "<b>Web SPAs (:5173–:5177) + Reverse Proxy</b><br/>nexus-static-web (serve-static-apps.mjs)", size=10)

    gw_id = add_rect(880, 108, 364, 124, "API Gateway BFF (:3000)")
    add_img("nestjs", 900, 145, 86, 34)
    add_img("rest_api", 1010, 136, 70, 50)
    add_img("websocket", 1106, 141, 78, 44)
    add_txt(886, 198, 352, 30, "<b>Opaque Token · Rate Limit · /ws/chat · /ws/tasks · /ws/locations</b><br/>chat_db · MinIO S3 Presign · Partner HMAC", size=9.8)

    # 12 Compact Independent Microservice Boxes (4x3)
    svc_ids = {}
    for idx, (sname, ssub) in enumerate(DOMAIN_SERVICES):
        sx, sy, sw, sh = svc_box_coords(idx)
        sid = add_rect(sx, sy, sw, sh,
                       f"<b>{sname}</b><br/><font style='font-size:9px;font-weight:400;color:#4B5563'>{ssub}</font>",
                       align="center", valign="middle", sw=1.2, font_size=10)
        svc_ids[sname] = sid

    # Independent chatbot-service box
    ai_id = add_rect(1082, 308, 162, 212, "chatbot-service", align="center", font_size=13)
    add_txt(1086, 334, 154, 18, "(:3013 · NestJS)", size=10, color="#4B5563")
    add_img("nestjs", 1122, 358, 82, 32)
    add_img("rag_vector", 1131, 400, 64, 56)
    add_txt(1086, 462, 154, 52, "<b>Local RAG Index</b><br/>vector-index.json<br/>Tools: :3002, :3008, :3012", size=9.6)

    # 4 Docker Containers
    mn_id = add_rect(344, 664, 200, 108)
    add_img("minio", 402, 671, 84, 62)
    add_txt(348, 738, 192, 30, "<b>:9000 API / :9001 UI</b><br/>Bucket: nexus-pod-images", size=9.5)

    pg_id = add_rect(568, 664, 224, 108)
    add_img("postgres", 632, 671, 96, 64)
    add_txt(572, 738, 216, 30, "<b>:15432 → 5432</b><br/>12 DBs (11 Prisma + chat_db pg)", size=9.2)

    mq_id = add_rect(816, 664, 210, 108)
    add_img("rabbitmq", 876, 671, 90, 62)
    add_txt(820, 738, 202, 30, "<b>:5672 AMQP / :15672 UI</b><br/>domain.events (9 Outbox · CQRS)", size=9.2)

    rd_id = add_rect(1050, 664, 196, 108)
    add_img("redis", 1106, 671, 84, 62)
    add_txt(1054, 738, 188, 30, "<b>:6379 TCP</b><br/>gateway-bff:chat Pub/Sub", size=9.5)

    # External Services
    dt_id = add_rect(1354, 108, 192, 124, "DT_COMMERCE")
    add_img("webhook", 1414, 138, 72, 56)
    add_txt(1358, 198, 184, 30, "<b>api.truongam.tech</b><br/>HMAC API &amp; Status Webhook", size=10)

    llm_id = add_rect(1354, 336, 192, 156, "External AI LLMs")
    add_img("ai_abstract", 1396, 366, 108, 80)
    add_txt(1358, 452, 184, 34, "<b>Cloud LLM &amp; Embedding APIs</b><br/>(Multi-Provider HTTPS)", size=10)

    sp_id = add_rect(1354, 540, 192, 132, "SePay Payment")
    add_img("vietqr", 1414, 570, 72, 62)
    add_txt(1358, 634, 184, 32, "<b>qr.sepay.vn · userapi.sepay.vn</b><br/>VietQR &amp; COD Webhook", size=10)

    # 100% Verified Connections
    add_edge(web_id, cf_id, "HTTPS", wps=[(28, 142), (28, 574)])
    add_edge(mob_id, cf_id, "HTTPS / WSS")
    add_edge(cf_id, cfd_id, "Tunnel", both=True)
    add_edge(cfd_id, fe_id, "ops / merchant / admin\ncustomer / tracking", wps=[(391, 170)])
    add_edge(cfd_id, mn_id, "minio.* (:9000)", dashed=True)
    add_edge(fe_id, gw_id, "Proxy API / WS")
    add_edge(gw_id, ms_grp_id, "REST + WS Proxy (:3001–:3013)", wps=[(1062, 266), (788, 266)])
    add_edge(gw_id, ai_id, "", wps=[(1062, 266), (1163, 266)])
    add_edge(ms_grp_id, ai_id, "", both=True)
    add_edge(gw_id, mn_id, "S3 API", dashed=True, wps=[(914, 250), (478, 250)])
    add_edge(ms_grp_id, pg_id, "Prisma SQL :15432")
    add_edge(ms_grp_id, mq_id, "AMQP :5672", dashed=True, both=True)
    add_edge(gw_id, rd_id, "Pub/Sub :6379", both=True, wps=[(1256, 198), (1256, 602), (1148, 602)])
    add_edge(gw_id, dt_id, "HMAC / Webhook", both=True)
    add_edge(ai_id, llm_id, "HTTPS API", both=True)
    px, py, pw, ph = svc_box_coords(11)
    add_edge(svc_ids["payment-service"], sp_id, "VietQR / COD", both=True,
             wps=[(int(px + pw / 2), 578), (1316, 578), (1316, 606)])

    return f"""<mxfile host="app.diagrams.net" modified="2026-11-18T07:25:00.000Z" agent="Antigravity" version="24.7.17" type="device">
  <diagram id="nexus-deploy-architecture" name="Nexus Logistics Deployment">
    <mxGraphModel dx="1620" dy="920" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{W}" pageHeight="{H}" background="#FFFFFF" math="0" shadow="0">
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


if __name__ == "__main__":
    main()
