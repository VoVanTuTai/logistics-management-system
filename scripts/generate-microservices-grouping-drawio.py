#!/usr/bin/env python3
"""
Generate an Organic, Human-Drawn-on-Draw.io Microservices Grouping / DDD Bounded Contexts Diagram
("Phân nhóm các Microservice trong hệ thống") for Nexus Logistics:
  - 100% verified against actual codebase (all 14 active NestJS services in ecosystem.config.cjs
    and all 12 PostgreSQL DBs in init-multiple-dbs.sql + stateless pricing + local vector store)
  - Academic DDD Strategic Decomposition:
      1. Edge & API Composition (1):     gateway-bff (:3000)
      2. Core Logistics Domain (6):      shipment (:3002), pickup (:3003), dispatch (:3004),
                                         manifest (:3005), scan (:3006), delivery (:3007)
      3. Commercial & Finance (2):       pricing (:3012), payment (:3011)
      4. CQRS Read & AI Intelligence (3):tracking (:3008), reporting (:3009), chatbot (:3013)
      5. Platform & Generic (2):         auth (:3010), masterdata (:3001)
  - Organic asymmetric silhouette (NO brick walls, NO rigid grids, ZERO intersecting arrows!)

Outputs:
  1. docs/architecture/diagrams/nexus-microservices-grouping.drawio
  2. docs/architecture/diagrams/nexus-microservices-grouping.svg
"""

import base64
import html as html_lib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "architecture" / "diagrams"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SVG_PATH = OUT_DIR / "nexus-microservices-grouping.svg"
DRAWIO_PATH = OUT_DIR / "nexus-microservices-grouping.drawio"

W, H = 1280, 960
FONT = "Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif"

COL_EDGE = "#0F766E"
COL_EDGE_TXT = "#115E59"
COL_CORE = "#2563EB"
COL_CORE_TXT = "#1D4ED8"
COL_FIN = "#059669"
COL_FIN_TXT = "#047857"
COL_AI = "#7C3AED"
COL_AI_TXT = "#5B21B6"
COL_PLT = "#D97706"
COL_PLT_TXT = "#B45309"


def esc(s: str) -> str:
    return html_lib.escape(str(s), quote=True)


# =============================================================================
# CRISP DOMAIN GROUP ICONS
# =============================================================================

LOGOS = {
    "edge_gw": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 48">
      <rect x="4" y="6" width="52" height="36" rx="6" fill="#F0FDFA" stroke="#0F766E" stroke-width="2.2"/>
      <path d="M14 18 H34 M29 13 L34 18 L29 23" fill="none" stroke="#0F766E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M46 30 H26 M31 25 L26 30 L31 35" fill="none" stroke="#0284C7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>""",

    "parcel_core": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 50">
      <polygon points="27,4 49,15 27,26 5,15" fill="#EFF6FF" stroke="#2563EB" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="5,15 27,26 27,46 5,35" fill="#FFFFFF" stroke="#2563EB" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="49,15 27,26 27,46 49,35" fill="#DBEAFE" stroke="#2563EB" stroke-width="2" stroke-linejoin="round"/>
      <line x1="16" y1="9.5" x2="38" y2="20.5" stroke="#1D4ED8" stroke-width="1.8"/>
    </svg>""",

    "finance_coin": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 50">
      <circle cx="27" cy="25" r="19" fill="#ECFDF5" stroke="#059669" stroke-width="2.2"/>
      <circle cx="27" cy="25" r="13.5" fill="none" stroke="#34D399" stroke-width="1.4" stroke-dasharray="3,2"/>
      <text x="27" y="31" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="18" font-weight="800" fill="#047857">₫</text>
    </svg>""",

    "cqrs_ai": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 50">
      <rect x="4" y="8" width="32" height="34" rx="4" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2"/>
      <rect x="10" y="27" width="5" height="9" fill="#7C3AED"/>
      <rect x="18" y="20" width="5" height="16" fill="#2563EB"/>
      <rect x="26" y="14" width="5" height="22" fill="#0F766E"/>
      <circle cx="42" cy="18" r="10" fill="#FFFFFF" stroke="#7C3AED" stroke-width="2"/>
      <text x="42" y="21.5" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="9.5" font-weight="800" fill="#5B21B6">AI</text>
    </svg>""",

    "platform_key": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 48">
      <circle cx="19" cy="24" r="10" fill="#FFFBEB" stroke="#D97706" stroke-width="2.2"/>
      <circle cx="19" cy="24" r="3.5" fill="#D97706"/>
      <path d="M29 24 H50 M42 24 V31 M48 24 V33" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
    </svg>""",

    "nestjs_mini": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 38">
      <circle cx="19" cy="19" r="16" fill="#E0234E"/>
      <path d="M12 24c1-6 4-11 9-13 3 2 5 5 5 10 0 3-2 5-4 6 2-2 2-5 0-7-2 2-3 4-4 7-3 0-5-1-6-3z" fill="#FFFFFF"/>
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
            out.append(f'<text x="{x+10}" y="{y+20}" font-family="{FONT}" font-size="{title_size}" font-weight="700" fill="{title_color}">{esc(title)}</text>')
        else:
            out.append(f'<text x="{x+w/2:.1f}" y="{y+20}" text-anchor="middle" font-family="{FONT}" font-size="{title_size}" font-weight="700" fill="{title_color}">{esc(title)}</text>')
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
            out.append(f'<text x="{tx:.1f}" y="{ly:.1f}" text-anchor="middle" font-family="{FONT}" font-size="10.4" font-weight="700" fill="#111111">{esc(ln)}</text>')
    return "\n".join(out)


def svc_card_svg(x, y, w, h, name, port_db, desc, accent="#1D4ED8", border="#111111", sw=1.3):
    parts = [
        box(x, y, w, h, sw=sw, stroke=border),
        label(x + 12, y + 20, name, size=11.4, bold=True, color="#111111", align="start"),
        label(x + w - 10, y + 20, port_db, size=9.4, bold=True, color=accent, align="end"),
        label(x + 12, y + 38, desc, size=9.4, color="#4B5563", align="start"),
    ]
    return "\n".join(parts)


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
             sw=1.4, stroke="#111111", valign="top", font_size=12, font_color="#111111"):
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
            "strokeColor=#111111;strokeWidth=1.4;fontFamily=Helvetica;fontSize=10.4;fontStyle=1;"
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
        return f"""<mxfile host="app.diagrams.net" modified="2026-11-18T10:55:00.000Z" agent="Antigravity" version="24.7.17" type="device">
  <diagram id="nexus-microservices-grouping" name="{esc(self.name)}">
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
    d = DrawioBuilder(W, H, "Nexus Microservices Grouping (DDD)")

    # =========================================================================
    # GROUP 1 (TOP CENTER-LEFT): EDGE & API COMPOSITION (1 Service — Bold Teal)
    # Staggered organically (x = 278..858, y = 34..136) — open breathing space both sides!
    # =========================================================================
    p.append(box(278, 34, 580, 102, dashed=True, sw=2.3, stroke=COL_EDGE))
    p.append(img_svg("edge_gw", 294, 52, 52, 42))
    p.append(label(358, 56, "1. Edge & API Composition Layer (1 Service)", size=12.5, bold=True, color=COL_EDGE_TXT, align="start"))
    p.append(box(356, 68, 484, 54, sw=1.6, stroke=COL_EDGE))
    p.append(img_svg("nestjs_mini", 368, 81, 26, 26))
    p.append(label(404, 88, "gateway-bff", size=11.8, bold=True, align="start"))
    p.append(label(828, 88, ":3000 · chat_db (pg) · Redis · S3", size=9.6, bold=True, color=COL_EDGE_TXT, align="end"))
    p.append(label(404, 108, "Single Entrypoint · Opaque Token · Rate Limit · REST/WS · Partner HMAC", size=9.3, color="#4B5563", align="start"))

    g1_id = d.rect(278, 34, 580, 102, "1. Edge & API Composition Layer (1 Service)", dashed=True, sw=2.3, stroke=COL_EDGE, font_color=COL_EDGE_TXT)
    d.rect(356, 68, 484, 54, "gateway-bff (:3000 · chat_db pg · Redis · S3)\nSingle Entrypoint · Opaque Token · REST/WS Proxy · HMAC", align="left", valign="middle", sw=1.6, stroke=COL_EDGE, font_size=10)

    # =========================================================================
    # GROUP 2 (MIDDLE-LEFT): CORE LOGISTICS DOMAIN (6 Services — Bold Blue Dashed)
    # Organic parcel-lifecycle layout (x = 46..776, y = 206..588)
    # =========================================================================
    p.append(box(46, 206, 730, 382, dashed=True, sw=2.4, stroke=COL_CORE))
    p.append(img_svg("parcel_core", 60, 218, 38, 36))
    p.append(label(106, 236, "2. Core Logistics Domain — Vận hành Lõi (6 Services)", size=12.8, bold=True, color=COL_CORE_TXT, align="start"))
    p.append(label(106, 252, "Domain trung tâm quản lý trọn vòng đời vận đơn: First-Mile → Hub/Mid-Mile → Last-Mile", size=9.5, color="#4B5563", align="start"))

    # Focal Center Order Hub: shipment-service (:3002)
    p.append(svc_card_svg(156, 272, 494, 54,
                          "shipment-service", ":3002 · shipment_db",
                          "Vận đơn trung tâm · Giám định đơn lạc · Hồ sơ bồi thường (Claims) · CSKH · Webhook",
                          accent=COL_CORE_TXT, border=COL_CORE, sw=1.7))

    # Stage Labels (subtle architectural tags inside Core Logistics!)
    p.append(label(72, 356, "FIRST-MILE (LẤY HÀNG)", size=9.2, bold=True, color="#6B7280", align="start"))
    p.append(svc_card_svg(72, 366, 214, 56, "pickup-service", ":3003 · pickup_db", "Tạo & duyệt yêu cầu lấy hàng", accent=COL_CORE_TXT))
    p.append(svc_card_svg(72, 438, 214, 56, "dispatch-service", ":3004 · dispatch_db", "Điều phối bưu tá · /ws/tasks", accent=COL_CORE_TXT))

    p.append(label(308, 372, "MID-MILE (TRUNG CHUYỂN HUB)", size=9.2, bold=True, color="#6B7280", align="start"))
    p.append(svc_card_svg(308, 382, 214, 56, "manifest-service", ":3005 · manifest_db", "Đóng bao · Kẹp chì seal · Đường trục", accent=COL_CORE_TXT))
    p.append(svc_card_svg(308, 454, 214, 56, "scan-service", ":3006 · scan_db", "Quét In/Out · GPS /ws/locations", accent=COL_CORE_TXT))

    p.append(label(544, 362, "LAST-MILE (GIAO & HOÀN)", size=9.2, bold=True, color="#6B7280", align="start"))
    p.append(box(544, 372, 208, 128, sw=1.35))
    p.append(label(556, 394, "delivery-service", size=11.4, bold=True, align="start"))
    p.append(label(556, 412, ":3007 · delivery_db", size=9.4, bold=True, color=COL_CORE_TXT, align="start"))
    p.append(label(556, 434, "• Giao phát & ảnh POD", size=9.4, color="#4B5563", align="start"))
    p.append(label(556, 452, "• Xác thực OTP đơn giá trị cao", size=9.4, color="#4B5563", align="start"))
    p.append(label(556, 470, "• Xử lý lỗi NDR (phát lại 3x)", size=9.4, color="#4B5563", align="start"))
    p.append(label(556, 488, "• Chuyển hoàn (Return / RTO)", size=9.4, color="#4B5563", align="start"))

    # Light subtle workflow progression note inside Core Logistics bottom
    p.append(label(72, 542, "Đều tuân thủ Database-per-Service (Prisma) + Transactional Outbox đẩy sự kiện lên RabbitMQ.", size=9.5, color="#374151", align="start"))
    p.append(label(72, 560, "Luồng nghiệp vụ:  pickup / dispatch  →  manifest / scan  →  delivery  (cập nhật trạng thái về shipment)", size=9.3, bold=True, color=COL_CORE_TXT, align="start"))
    # Clean mini horizontal arrows between stages inside Core Logistics
    p.append(arrow([(286, 408), (308, 408)], sw=1.2))
    p.append(arrow([(522, 412), (544, 412)], sw=1.2))

    g2_id = d.rect(46, 206, 730, 382, "2. Core Logistics Domain — Vận hành Lõi (6 Services)", dashed=True, sw=2.4, stroke=COL_CORE, font_color=COL_CORE_TXT)
    d.rect(156, 272, 494, 54, "shipment-service (:3002 · shipment_db)\nVận đơn trung tâm · Giám định · Claims · CSKH · Webhook", align="left", valign="middle", sw=1.7, stroke=COL_CORE, font_size=10)
    d.rect(72, 366, 214, 56, "pickup-service (:3003 · pickup_db)\nTạo & duyệt lấy hàng", align="left", valign="middle", font_size=9.8)
    d.rect(72, 438, 214, 56, "dispatch-service (:3004 · dispatch_db)\nĐiều phối · /ws/tasks", align="left", valign="middle", font_size=9.8)
    d.rect(308, 382, 214, 56, "manifest-service (:3005 · manifest_db)\nĐóng bao · Kẹp chì seal", align="left", valign="middle", font_size=9.8)
    d.rect(308, 454, 214, 56, "scan-service (:3006 · scan_db)\nQuét In/Out · GPS /ws/locations", align="left", valign="middle", font_size=9.8)
    d.rect(544, 372, 208, 128, "delivery-service (:3007 · delivery_db)\nPOD · OTP · NDR · Chuyển hoàn", align="left", valign="middle", font_size=9.8)

    # =========================================================================
    # GROUP 3 (MIDDLE-RIGHT UPPER): COMMERCIAL & FINANCE (2 Services — Bold Emerald)
    # Staggered HIGHER than Core Logistics (y = 186..406, x = 858..1234)!
    # =========================================================================
    p.append(box(858, 186, 376, 224, dashed=True, sw=2.4, stroke=COL_FIN))
    p.append(img_svg("finance_coin", 872, 198, 36, 34))
    p.append(label(916, 214, "3. Commercial & Finance (2 Services)", size=12.2, bold=True, color=COL_FIN_TXT, align="start"))
    p.append(label(916, 230, "Tính cước, thu hộ COD & đối soát tài chính", size=9.4, color="#4B5563", align="start"))

    p.append(svc_card_svg(880, 250, 332, 62,
                          "pricing-service", ":3012 · Stateless",
                          "Tính cước tức thì · Thể tích IATA (V/6000) · 3 tầng trần",
                          accent=COL_FIN_TXT))
    p.append(svc_card_svg(880, 326, 332, 64,
                          "payment-service", ":3011 · payment_db",
                          "Quản lý COD · Đối soát ví shop · SePay VietQR/Webhook",
                          accent=COL_FIN_TXT))

    g3_id = d.rect(858, 186, 376, 224, "3. Commercial & Finance (2 Services)", dashed=True, sw=2.4, stroke=COL_FIN, font_color=COL_FIN_TXT)
    d.rect(880, 250, 332, 62, "pricing-service (:3012 · Stateless)\nTính cước IATA V/6000 · 3 tầng trần", align="left", valign="middle", font_size=9.8)
    d.rect(880, 326, 332, 64, "payment-service (:3011 · payment_db)\nCOD · Đối soát ví · SePay VietQR", align="left", valign="middle", font_size=9.8)

    # =========================================================================
    # GROUP 4 (MIDDLE-RIGHT LOWER): CQRS READ & AI INTELLIGENCE (3 Services — Bold Purple)
    # Extends LOWER & slightly wider left (x = 828..1234, y = 480..842) — natural asymmetry!
    # =========================================================================
    p.append(box(828, 480, 406, 362, dashed=True, sw=2.4, stroke=COL_AI))
    p.append(img_svg("cqrs_ai", 842, 494, 40, 36))
    p.append(label(890, 510, "4. CQRS Read & AI Intelligence (3 Services)", size=12.2, bold=True, color=COL_AI_TXT, align="start"))
    p.append(label(890, 526, "Mô hình đọc tách biệt (zero outbox) & Trợ lý AI RAG", size=9.4, color="#4B5563", align="start"))

    p.append(svc_card_svg(852, 548, 358, 62,
                          "tracking-service", ":3008 · tracking_db",
                          "CQRS Read Model · Dựng Timeline hành trình thời gian thực",
                          accent=COL_AI_TXT))
    p.append(svc_card_svg(852, 626, 358, 62,
                          "reporting-service", ":3009 · reporting_db",
                          "CQRS Read Model · Tổng hợp KPI, SLA & Dashboard vận hành",
                          accent=COL_AI_TXT))
    p.append(svc_card_svg(852, 704, 358, 114,
                          "chatbot-service", ":3013 · vector-index.json",
                          "Trợ lý AI xử lý khiếu nại & CSKH (Hybrid RAG 3072-D)",
                          accent=COL_AI_TXT, border=COL_AI, sw=1.6))
    p.append(label(864, 762, "• Function Calling Tools (:3002, :3008, :3012)", size=9.3, color="#374151", align="start"))
    p.append(label(864, 780, "• OWASP Guardrail · OpenRouter HITL · Multi-LLM Waterfall", size=9.3, color="#5B21B6", bold=True, align="start"))
    p.append(label(864, 798, "• Stream phản hồi SSE kèm Citations[]", size=9.3, color="#4B5563", align="start"))

    g4_id = d.rect(828, 480, 406, 362, "4. CQRS Read & AI Intelligence (3 Services)", dashed=True, sw=2.4, stroke=COL_AI, font_color=COL_AI_TXT)
    d.rect(852, 548, 358, 62, "tracking-service (:3008 · tracking_db)\nCQRS Read · Timeline hành trình", align="left", valign="middle", font_size=9.8)
    d.rect(852, 626, 358, 62, "reporting-service (:3009 · reporting_db)\nCQRS Read · KPI & Dashboard", align="left", valign="middle", font_size=9.8)
    d.rect(852, 704, 358, 114, "chatbot-service (:3013 · vector-index.json)\nHybrid RAG · Tools · Guardrail HITL · SSE", align="left", valign="middle", sw=1.6, stroke=COL_AI, font_size=9.8)

    # =========================================================================
    # GROUP 5 (BOTTOM-LEFT): PLATFORM & GENERIC SUBDOMAIN (2 Services — Bold Amber)
    # Indented right (x = 112..724, y = 660..834) — organic stepped base!
    # =========================================================================
    p.append(box(112, 660, 612, 174, dashed=True, sw=2.4, stroke=COL_PLT))
    p.append(img_svg("platform_key", 126, 672, 42, 34))
    p.append(label(176, 688, "5. Platform & Generic Subdomain — Nền tảng Dùng chung (2 Services)", size=12.2, bold=True, color=COL_PLT_TXT, align="start"))
    p.append(label(176, 704, "Xác thực tập trung, phân quyền RBAC & dữ liệu danh mục chuẩn dùng chung toàn hệ thống", size=9.4, color="#4B5563", align="start"))

    p.append(svc_card_svg(134, 724, 270, 88,
                          "auth-service", ":3010 · auth_db",
                          "Opaque Token · Refresh Session",
                          accent=COL_PLT_TXT))
    p.append(label(146, 780, "• RBAC 5 vai trò & quyền Mobile", size=9.2, color="#4B5563", align="start"))
    p.append(label(146, 797, "• Nhật ký kiểm toán AdminAuditLog", size=9.2, color="#4B5563", align="start"))

    p.append(svc_card_svg(426, 724, 276, 88,
                          "masterdata-service", ":3001 · masterdata_db",
                          "Danh mục Hub · Zone · Tuyến phân vùng",
                          accent=COL_PLT_TXT))
    p.append(label(438, 780, "• Mã lý do NDR · Hồ sơ Shop/Khách", size=9.2, color="#4B5563", align="start"))
    p.append(label(438, 797, "• Phiên bản Chính sách (PolicyVersion)", size=9.2, color="#4B5563", align="start"))

    g5_id = d.rect(112, 660, 612, 174, "5. Platform & Generic Subdomain (2 Services)", dashed=True, sw=2.4, stroke=COL_PLT, font_color=COL_PLT_TXT)
    d.rect(134, 724, 270, 88, "auth-service (:3010 · auth_db)\nOpaque Token · RBAC 5 roles · AuditLog", align="left", valign="middle", font_size=9.8)
    d.rect(426, 724, 276, 88, "masterdata-service (:3001 · masterdata_db)\nHub · Zone · NDR · Policy", align="left", valign="middle", font_size=9.8)

    # =========================================================================
    # CLEAN PLANAR MACRO DEPENDENCY ARROWS BETWEEN DOMAIN GROUPS (ZERO CROSSINGS!)
    # =========================================================================

    # Edge -> Core Logistics (straight vertical drop!)
    p.append(arrow([(444, 136), (444, 206)], "REST / WS Proxy", (444, 171)))

    # Edge -> Commercial & Finance (clean right-and-down step!)
    p.append(arrow([(858, 86), (1046, 86), (1046, 186)], "Pricing / COD API", (968, 86)))

    # Core Logistics <-> Commercial & Finance (short direct horizontal!)
    p.append(arrow([(776, 304), (858, 304)], "IATA / COD", (817, 288), both=True))

    # Core Logistics -> CQRS Read & AI (short direct dashed horizontal — RabbitMQ CQRS + Tools!)
    p.append(arrow([(776, 540), (828, 540)], "CQRS", (802, 524), dashed=True))

    # Core Logistics -> Platform & Generic (short direct vertical drop!)
    p.append(arrow([(418, 588), (418, 660)], "Hub / Policy Lookup", (418, 624)))

    # Commercial & Finance -> CQRS Read & AI (short dashed vertical drop for COD reporting / AI pricing tool!)
    p.append(arrow([(1046, 410), (1046, 480)], "COD Events / Tool", (1046, 445), dashed=True, both=True))

    # Edge -> Platform (clean subtle left rail for Token Introspect — ZERO crossing!)
    p.append(arrow([(278, 86), (26, 86), (26, 748), (112, 748)], "Introspect", (68, 732), dashed=True))

    # Mirror macro edges to Draw.io
    d.edge(g1_id, g2_id, "REST / WS Proxy")
    d.edge(g1_id, g3_id, "Pricing / COD API", wps=[(1046, 86)])
    d.edge(g2_id, g3_id, "IATA / COD", both=True)
    d.edge(g2_id, g4_id, "CQRS", dashed=True)
    d.edge(g2_id, g5_id, "Hub / Policy Lookup")
    d.edge(g3_id, g4_id, "COD Events / Tool", dashed=True, both=True)
    d.edge(g1_id, g5_id, "Introspect", dashed=True, wps=[(26, 86), (26, 748)])

    # =========================================================================
    # CASUAL UNBOXED SUMMARY LINE AT BOTTOM (y = 892..924)
    # =========================================================================
    p.append(label(112, 896, "Tổng hợp phân rã DDD (14 Microservices):   1 Edge BFF  +  6 Core Logistics  +  2 Commercial & Finance  +  3 CQRS & AI  +  2 Platform",
                   size=10.8, bold=True, color="#1F2937", align="start"))
    p.append(label(112, 918, "Độc lập dữ liệu tuyệt đối (Database-per-Service):   12 PostgreSQL DBs tách biệt  ·  1 Stateless (pricing)  ·  1 Local Vector Store (chatbot)",
                   size=10, color="#4B5563", align="start"))

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
