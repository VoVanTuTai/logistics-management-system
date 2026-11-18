#!/usr/bin/env python3
"""
Generate an Organic, Zero-Crossing, Human-Drawn-on-Draw.io Architecture Diagram
for the Database-per-Service Data Organization Principle
("Nguyên tắc Tổ chức Dữ liệu theo Database-per-Service") in Nexus Logistics:
  - 100% verified against actual codebase:
      * infra/dev/postgres/init-multiple-dbs.sql (12 isolated PostgreSQL 16 databases)
      * 9 Write Services (Prisma + OutboxEvent table in same ACID transaction)
      * 2 CQRS Read Services (tracking_db, reporting_db — Prisma, zero outbox)
      * 1 Edge BFF (gateway-bff -> chat_db via pg.Pool + MinIO S3 nexus-pod-images + Redis 7 Pub/Sub)
      * 2 Non-RDBMS / Stateless Services (pricing-service stateless, chatbot-service vector-index.json 3072-D)
      * Zero Cross-DB SQL JOINs / Foreign Keys; linked strictly via Logical Keys (shipmentCode, hubCode, courierId)
        and Eventual Consistency via RabbitMQ domain.events

Outputs:
  1. docs/architecture/diagrams/nexus-database-per-service.drawio
  2. docs/architecture/diagrams/nexus-database-per-service.svg
"""

import base64
import html as html_lib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "architecture" / "diagrams"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SVG_PATH = OUT_DIR / "nexus-database-per-service.svg"
DRAWIO_PATH = OUT_DIR / "nexus-database-per-service.drawio"

W, H = 1300, 1060
FONT = "Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif"

COL_BLUE = "#2563EB"
COL_BLUE_TXT = "#1D4ED8"
COL_TEAL = "#0F766E"
COL_TEAL_TXT = "#115E59"
COL_PURPLE = "#7C3AED"
COL_PURPLE_TXT = "#5B21B6"
COL_AMBER = "#D97706"
COL_AMBER_TXT = "#B45309"
COL_RED = "#DC2626"
COL_RED_TXT = "#991B1B"


def esc(s: str) -> str:
    return html_lib.escape(str(s), quote=True)


# =============================================================================
# CRISP DATABASE & STORAGE ICONS
# =============================================================================

LOGOS = {
    "db_blue": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 40">
      <ellipse cx="19" cy="8" rx="15" ry="5" fill="#EFF6FF" stroke="#2563EB" stroke-width="1.8"/>
      <path d="M4 8 V31 A15 5 0 0 0 34 31 V8" fill="#FFFFFF" stroke="#2563EB" stroke-width="1.8"/>
      <path d="M4 16 A15 5 0 0 0 34 16" fill="none" stroke="#93C5FD" stroke-width="1.3"/>
      <path d="M4 24 A15 5 0 0 0 34 24" fill="none" stroke="#93C5FD" stroke-width="1.3"/>
    </svg>""",

    "db_teal": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 40">
      <ellipse cx="19" cy="8" rx="15" ry="5" fill="#F0FDFA" stroke="#0F766E" stroke-width="1.8"/>
      <path d="M4 8 V31 A15 5 0 0 0 34 31 V8" fill="#FFFFFF" stroke="#0F766E" stroke-width="1.8"/>
      <path d="M4 16 A15 5 0 0 0 34 16" fill="none" stroke="#5EEAD4" stroke-width="1.3"/>
      <path d="M4 24 A15 5 0 0 0 34 24" fill="none" stroke="#5EEAD4" stroke-width="1.3"/>
    </svg>""",

    "db_amber": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 40">
      <ellipse cx="19" cy="8" rx="15" ry="5" fill="#FFFBEB" stroke="#D97706" stroke-width="1.8"/>
      <path d="M4 8 V31 A15 5 0 0 0 34 31 V8" fill="#FFFFFF" stroke="#D97706" stroke-width="1.8"/>
      <path d="M4 16 A15 5 0 0 0 34 16" fill="none" stroke="#FCD34D" stroke-width="1.3"/>
      <path d="M4 24 A15 5 0 0 0 34 24" fill="none" stroke="#FCD34D" stroke-width="1.3"/>
    </svg>""",

    "minio_mini": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <rect x="4" y="4" width="32" height="32" rx="6" fill="#C72C48"/>
      <path d="M10 29 V12 L20 22 L30 12 V29" fill="none" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>""",

    "redis_mini": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 36">
      <polygon points="21,21 5,27 21,33 37,27" fill="#A41E11"/>
      <polygon points="21,14 5,20 21,26 37,20" fill="#C62828"/>
      <polygon points="21,6 5,12 21,18 37,12" fill="#DC382D"/>
      <circle cx="17" cy="11.5" r="1.6" fill="#FFFFFF"/>
      <polygon points="24,10 27,13.5 21,13.5" fill="#FFFFFF"/>
    </svg>""",

    "ram_chip": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 40">
      <rect x="9" y="8" width="24" height="24" rx="4" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2"/>
      <rect x="14" y="13" width="14" height="14" rx="2" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.4"/>
      <g stroke="#7C3AED" stroke-width="1.8" stroke-linecap="round">
        <line x1="15" y1="3" x2="15" y2="8"/><line x1="21" y1="3" x2="21" y2="8"/><line x1="27" y1="3" x2="27" y2="8"/>
        <line x1="15" y1="32" x2="15" y2="37"/><line x1="21" y1="32" x2="21" y2="37"/><line x1="27" y1="32" x2="27" y2="37"/>
        <line x1="4" y1="15" x2="9" y2="15"/><line x1="4" y1="25" x2="9" y2="25"/>
        <line x1="33" y1="15" x2="38" y2="15"/><line x1="33" y1="25" x2="38" y2="25"/>
      </g>
    </svg>""",

    "vector_json": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 40">
      <rect x="4" y="4" width="24" height="30" rx="3" fill="#FFFFFF" stroke="#111111" stroke-width="1.8"/>
      <line x1="9" y1="12" x2="22" y2="12" stroke="#6B7280" stroke-width="1.5"/>
      <line x1="9" y1="18" x2="20" y2="18" stroke="#6B7280" stroke-width="1.5"/>
      <line x1="9" y1="24" x2="18" y2="24" stroke="#6B7280" stroke-width="1.5"/>
      <circle cx="29" cy="26" r="9" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2"/>
      <text x="29" y="29" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="6.8" font-weight="800" fill="#5B21B6">3072</text>
    </svg>""",

    "rabbitmq_horiz": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 42">
      <rect x="4" y="4" width="36" height="34" rx="6" fill="#FF6600"/>
      <rect x="9" y="8" width="5.5" height="13" rx="1.5" fill="#FFFFFF"/>
      <rect x="18.5" y="8" width="5.5" height="13" rx="1.5" fill="#FFFFFF"/>
      <rect x="9" y="18" width="26" height="15" rx="2.5" fill="#FFFFFF"/>
      <rect x="25" y="23" width="5.5" height="5.5" rx="1.2" fill="#FF6600"/>
      <text x="48" y="27" font-family="Helvetica,Arial,sans-serif" font-size="16.5" font-weight="700" fill="#FF6600">RabbitMQ</text>
    </svg>""",

    "forbid_x": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="11.5" fill="#FEF2F2" stroke="#DC2626" stroke-width="2.2"/>
      <line x1="9" y1="9" x2="19" y2="19" stroke="#DC2626" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="19" y1="9" x2="9" y2="19" stroke="#DC2626" stroke-width="2.4" stroke-linecap="round"/>
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
            out.append(f'<text x="{tx:.1f}" y="{ly:.1f}" text-anchor="middle" font-family="{FONT}" font-size="10.4" font-weight="700" fill="#111111">{esc(ln)}</text>')
    return "\n".join(out)


def db_pair_svg(x, y, w, h, svc, db_name, tables, db_icon="db_blue", accent="#1D4ED8", border="#111111", sw=1.3):
    """Compact Service -> Private DB Card showing 1-to-1 ownership clearly."""
    parts = [
        box(x, y, w, h, sw=sw, stroke=border),
        img_svg(db_icon, x + 8, y + (h - 34) / 2, 32, 34),
        label(x + 46, y + 18, svc, size=10.6, bold=True, color="#111111", align="start"),
        label(x + w - 8, y + 18, db_name, size=9.4, bold=True, color=accent, align="end"),
        label(x + 46, y + 36, tables, size=8.9, color="#4B5563", align="start"),
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
        return f"""<mxfile host="app.diagrams.net" modified="2026-11-18T11:08:00.000Z" agent="Antigravity" version="24.7.17" type="device">
  <diagram id="nexus-database-per-service" name="{esc(self.name)}">
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
    d = DrawioBuilder(W, H, "Database-per-Service Architecture")

    # =========================================================================
    # SECTION 1 (TOP-LEFT): 9 TRANSACTIONAL WRITE DBs (Bold Blue Dashed)
    # Organic asymmetric proportions (x = 46..804, y = 34..590)
    # Demonstrates strict 1-to-1 ownership + RED forbidden Cross-DB JOIN barrier!
    # =========================================================================
    p.append(box(46, 34, 758, 556, dashed=True, sw=2.4, stroke=COL_BLUE))
    p.append(label(62, 58, "1. Cơ sở dữ liệu Ghi Độc lập — Transactional Write DBs (9 DBs · PostgreSQL 16 + Prisma)",
                   size=12.5, bold=True, color=COL_BLUE_TXT, align="start"))
    p.append(label(62, 75, "Mỗi service chỉ kết nối đúng 1 DATABASE_URL riêng · Cùng ghi bảng OutboxEvent trong 1 ACID Transaction",
                   size=9.5, color="#4B5563", align="start"))

    # Focal Top Pair: shipment_db (Left)  --[X NO CROSS-DB SQL JOIN]-->  delivery_db (Right)
    p.append(db_pair_svg(68, 96, 316, 60,
                         "shipment-service (:3002)", "shipment_db",
                         "Shipment · Claims · Investigation · Outbox",
                         db_icon="db_blue", accent=COL_BLUE_TXT, border=COL_BLUE, sw=1.7))

    p.append(db_pair_svg(476, 96, 306, 60,
                         "delivery-service (:3007)", "delivery_db",
                         "DeliveryAttempt · Pod · Otp · Ndr · Return",
                         db_icon="db_blue", accent=COL_BLUE_TXT))

    # ICONIC TEXTBOOK VISUAL: Forbidden Cross-DB SQL JOIN / Foreign Key barrier!
    p.append('<line x1="384" y1="126" x2="476" y2="126" stroke="#DC2626" stroke-width="1.8" stroke-dasharray="4,3"/>')
    p.append(img_svg("forbid_x", 416, 112, 28, 28))
    p.append(label(430, 154, "Cấm SQL JOIN / FK", size=8.8, bold=True, color=COL_RED_TXT))

    # Row 2 (staggered naturally, varied widths!)
    p.append(db_pair_svg(68, 186, 224, 52, "pickup (:3003)", "pickup_db", "PickupRequest · Item · Outbox", accent=COL_BLUE_TXT))
    p.append(db_pair_svg(312, 180, 230, 52, "dispatch (:3004)", "dispatch_db", "Task · Assignment · Outbox", accent=COL_BLUE_TXT))
    p.append(db_pair_svg(560, 188, 222, 52, "manifest (:3005)", "manifest_db", "Manifest · Seal · Receive", accent=COL_BLUE_TXT))

    # Row 3 (scan_db + payment_db — slightly taller with Idempotency note!)
    p.append(db_pair_svg(68, 266, 344, 56, "scan-service (:3006)", "scan_db",
                         "ScanEvent · CurrentLocation · Idempotency · Outbox", accent=COL_BLUE_TXT))
    p.append(db_pair_svg(438, 268, 344, 56, "payment-service (:3011)", "payment_db",
                         "CodRecord · SettlementBatch · SePay · Idempotency", accent=COL_BLUE_TXT))

    # Row 4 (Platform Generic DBs: auth_db & masterdata_db — Amber cylinder accent!)
    p.append(db_pair_svg(92, 352, 312, 54, "auth-service (:3010)", "auth_db",
                         "UserAccount · AuthSession · RBAC · AuditLog", db_icon="db_amber", accent=COL_AMBER_TXT))
    p.append(db_pair_svg(434, 352, 326, 54, "masterdata-service (:3001)", "masterdata_db",
                         "Hub · Zone · NdrReason · PolicyVersion", db_icon="db_amber", accent=COL_AMBER_TXT))

    # Key Principle Callout Box inside Section 1 (explains HOW they link without SQL FK!)
    p.append(box(68, 434, 714, 132, sw=1.3, stroke="#94A3B8"))
    p.append(label(84, 456, "4 Nguyên tắc Cô lập & An toàn Dữ liệu (Data Isolation Rules):", size=10.8, bold=True, color="#1F2937", align="start"))
    p.append(label(84, 478, "• Không dùng SQL Foreign Key liên DB:  Lưu khóa logic có đánh index (shipmentCode, hubCode, courierId) thay cho FK vật lý.", size=9.6, color="#374151", align="start"))
    p.append(label(84, 498, "• Không truy cập chéo bảng (Zero Cross-DB JOIN):  Cần kiểm tra điều kiện (guard) thì gọi qua API nội bộ (GET /shipments/:code).", size=9.6, color="#374151", align="start"))
    p.append(label(84, 518, "• Nhất quán giao dịch nội bộ (Local ACID + Outbox):  Ghi bảng nghiệp vụ + bảng OutboxEvent trong cùng 1 transaction cục bộ.", size=9.6, color="#374151", align="start"))
    p.append(label(84, 540, "• An toàn ghi trùng (Idempotency):  scan_db, delivery_db, payment_db có bảng IdempotencyRecord chống duplicate khi retry.", size=9.6, color="#1D4ED8", bold=True, align="start"))

    # Draw.io mirror for Section 1
    s1_id = d.rect(46, 34, 758, 556, "1. Transactional Write DBs (9 Isolated PostgreSQL DBs · Prisma + Outbox)", dashed=True, sw=2.4, stroke=COL_BLUE, font_color=COL_BLUE_TXT)
    d.rect(68, 96, 316, 60, "shipment-service → shipment_db\nShipment · Claims · Investigation · Outbox", align="left", valign="middle", sw=1.7, stroke=COL_BLUE, font_size=9.5)
    d.rect(476, 96, 306, 60, "delivery-service → delivery_db\nDeliveryAttempt · Pod · Otp · Ndr · Return", align="left", valign="middle", font_size=9.5)
    d.rect(68, 186, 224, 52, "pickup → pickup_db", align="center", valign="middle", font_size=9.5)
    d.rect(312, 180, 230, 52, "dispatch → dispatch_db", align="center", valign="middle", font_size=9.5)
    d.rect(560, 188, 222, 52, "manifest → manifest_db", align="center", valign="middle", font_size=9.5)
    d.rect(68, 266, 344, 56, "scan-service → scan_db\nScanEvent · CurrentLocation · Idempotency", align="left", valign="middle", font_size=9.5)
    d.rect(438, 268, 344, 56, "payment-service → payment_db\nCodRecord · SettlementBatch · Idempotency", align="left", valign="middle", font_size=9.5)
    d.rect(92, 352, 312, 54, "auth-service → auth_db\nUserAccount · AuthSession · RBAC", align="left", valign="middle", font_size=9.5)
    d.rect(434, 352, 326, 54, "masterdata-service → masterdata_db\nHub · Zone · NdrReason · PolicyVersion", align="left", valign="middle", font_size=9.5)

    # =========================================================================
    # SECTION 2 (TOP-RIGHT): EDGE BFF DATA & POLYGLOT STORES (Bold Teal Dashed)
    # Staggered organically lower (y = 54..372, x = 860..1254)
    # =========================================================================
    p.append(box(860, 54, 394, 318, dashed=True, sw=2.4, stroke=COL_TEAL))
    p.append(label(876, 78, "2. Dữ liệu Biên — gateway-bff (:3000)", size=12.2, bold=True, color=COL_TEAL_TXT, align="start"))
    p.append(label(876, 95, "Chỉ duy nhất Gateway truy cập 3 kho này (Polyglot)", size=9.3, color="#4B5563", align="start"))

    p.append(db_pair_svg(882, 114, 350, 68,
                         "chat_db (PostgreSQL)", "pg.Pool (No Prisma)",
                         "chat_conversations · chat_messages · receipts",
                         db_icon="db_teal", accent=COL_TEAL_TXT, border=COL_TEAL, sw=1.5))

    p.append(db_pair_svg(882, 200, 350, 68,
                         "MinIO S3 (:9000)", "Object Storage",
                         "Bucket: nexus-pod-images (POD · cskh-evidence/)",
                         db_icon="minio_mini", accent="#C72C48"))

    p.append(db_pair_svg(882, 286, 350, 64,
                         "Redis 7 (:6379)", "In-Memory Pub/Sub",
                         "Channel: gateway-bff:chat (Ephemeral Sync)",
                         db_icon="redis_mini", accent="#DC2626"))

    d.rect(860, 54, 394, 318, "2. Edge BFF Stores — gateway-bff (:3000)", dashed=True, sw=2.4, stroke=COL_TEAL, font_color=COL_TEAL_TXT)
    d.rect(882, 114, 350, 68, "chat_db (PostgreSQL · pg.Pool)\nchat_conversations · chat_messages", align="left", valign="middle", sw=1.5, stroke=COL_TEAL, font_size=9.5)
    d.rect(882, 200, 350, 68, "MinIO S3 (:9000)\nBucket: nexus-pod-images (POD · CCTV)", align="left", valign="middle", font_size=9.5)
    d.rect(882, 286, 350, 64, "Redis 7 (:6379)\nPub/Sub: gateway-bff:chat", align="left", valign="middle", font_size=9.5)

    # =========================================================================
    # SECTION 3 (MIDDLE-RIGHT): NON-RDBMS & STATELESS SERVICES (Bold Purple Dashed)
    # Slightly narrower & indented right (x = 884..1254, y = 414..606)
    # =========================================================================
    p.append(box(884, 414, 370, 192, dashed=True, sw=2.4, stroke=COL_PURPLE))
    p.append(label(900, 438, "3. Dịch vụ Không dùng RDBMS (2 Services)", size=12, bold=True, color=COL_PURPLE_TXT, align="start"))
    p.append(label(900, 454, "Tối ưu độ trễ mili-giây, không phát sinh DB quan hệ", size=9.2, color="#4B5563", align="start"))

    p.append(db_pair_svg(906, 472, 326, 52,
                         "pricing-service (:3012)", "Stateless (No DB)",
                         "In-Memory Rules · IATA V/6000 · 3 tầng trần",
                         db_icon="ram_chip", accent=COL_PURPLE_TXT))

    p.append(db_pair_svg(906, 536, 326, 54,
                         "chatbot-service (:3013)", "vector-index.json",
                         "59 Chunks × 3072-D nạp sẵn RAM (< 5ms)",
                         db_icon="vector_json", accent=COL_PURPLE_TXT))

    d.rect(884, 414, 370, 192, "3. Non-RDBMS & Stateless Services (2 Services)", dashed=True, sw=2.4, stroke=COL_PURPLE, font_color=COL_PURPLE_TXT)
    d.rect(906, 472, 326, 52, "pricing-service (:3012) → Stateless Rules", align="left", valign="middle", font_size=9.5)
    d.rect(906, 536, 326, 54, "chatbot-service (:3013) → vector-index.json (RAM)", align="left", valign="middle", font_size=9.5)

    # =========================================================================
    # SECTION 4 (BOTTOM): EVENTUAL CONSISTENCY & CQRS READ DBs (Bold Amber Dashed)
    # Indented right (x = 96..1214, y = 668..966) — shows HOW cross-DB queries work!
    # =========================================================================
    p.append(box(96, 668, 1118, 298, dashed=True, sw=2.4, stroke=COL_AMBER))

    # Stage 4A: Outbox Relay
    p.append(box(122, 698, 238, 180, "Transactional Outbox", title_align="center", title_size=11.4))
    p.append(img_svg("db_amber", 222, 728, 38, 40))
    p.append(label(241, 786, "Đọc bảng OutboxEvent", size=9.8, bold=True, color="#1D4ED8"))
    p.append(label(241, 804, "từ 9 Write DBs (Polling)", size=9.4, color="#374151"))
    p.append(label(241, 830, "Gắn event_id +", size=9.2, color="#4B5563"))
    p.append(label(241, 845, "idempotency_key", size=9.2, color="#4B5563"))
    p.append(label(241, 864, "Chống lỗi Dual-Write", size=9.2, bold=True, color="#059669"))

    # Stage 4B: RabbitMQ Event Bus
    p.append(box(426, 728, 198, 120, "Event Bus (AMQP)", title_align="center", sw=1.8, stroke=COL_AMBER, title_color=COL_AMBER_TXT, title_size=11.4))
    p.append(img_svg("rabbitmq_horiz", 456, 756, 138, 40))
    p.append(label(525, 814, "domain.events (:5672)", size=10.6, bold=True, color="#B45309"))
    p.append(label(525, 832, "Topic Routing + DLX/TTL Retry", size=9.1, color="#4B5563"))

    # Stage 4C: 2 Isolated CQRS Read-Model DBs (Zero Outbox!)
    p.append(box(694, 692, 494, 194, "2 CQRS Read-Model DBs (PostgreSQL 16 + Prisma · Zero Outbox)", title_align="left", sw=1.7, stroke=COL_TEAL, title_color=COL_TEAL_TXT, title_size=11.4))
    p.append(db_pair_svg(714, 726, 454, 66,
                         "tracking-service (:3008)", "tracking_db",
                         "TimelineEvent · TrackingCurrent · TrackingIndex  (Tra cứu < 10ms)",
                         db_icon="db_teal", accent=COL_TEAL_TXT))
    p.append(db_pair_svg(714, 804, 454, 66,
                         "reporting-service (:3009)", "reporting_db",
                         "KpiDaily · KpiMonthly · ShipmentStatusProjection  (Báo cáo & SLA)",
                         db_icon="db_teal", accent=COL_TEAL_TXT))

    # Bottom-left title inside Section 4 (zero arrow crossings!)
    p.append(label(122, 922, "4. Giải quyết Truy vấn liên Miền không cần SQL JOIN (Eventual Consistency · Outbox → RabbitMQ → CQRS Read DBs)",
                   size=12, bold=True, color=COL_AMBER_TXT, align="start"))
    p.append(label(122, 944, "Các truy vấn tổng hợp (hành trình vận đơn, KPI toàn mạng lưới) đọc trực tiếp từ Read DB đã chiếu sẵn thay vì JOIN chéo 9 Write DBs.",
                   size=9.6, color="#4B5563", align="start"))

    # Draw.io mirror for Section 4
    d.rect(96, 668, 1118, 298, "", dashed=True, sw=2.4, stroke=COL_AMBER)
    d.txt(116, 908, 760, 26, "<b>4. Eventual Consistency &amp; CQRS Read DBs (Outbox → RabbitMQ → Read Projections)</b>", size=11.5, color=COL_AMBER_TXT, align="left")
    ob_id = d.rect(122, 698, 238, 180, "Transactional Outbox\nĐọc OutboxEvent từ 9 Write DBs", align="center", valign="middle", font_size=10)
    mq_id = d.rect(426, 728, 198, 120, "RabbitMQ domain.events\nAMQP :5672 · DLX/TTL Retry", align="center", valign="middle", sw=1.8, stroke=COL_AMBER, font_color=COL_AMBER_TXT, font_size=10)
    cq_id = d.rect(694, 692, 494, 194, "2 CQRS Read-Model DBs (Zero Outbox)\ntracking_db (:3008) · reporting_db (:3009)", align="left", valign="middle", sw=1.7, stroke=COL_TEAL, font_color=COL_TEAL_TXT, font_size=10)

    # =========================================================================
    # CLEAN ZERO-CROSSING ARROWS
    # =========================================================================
    # 9 Write DBs -> Outbox Relay (straight clean vertical drop at x=241!)
    p.append(arrow([(241, 590), (241, 698)], "ACID Outbox (9 DBs)", (241, 634), dashed=True))
    # Outbox Relay -> RabbitMQ -> CQRS Read DBs
    p.append(arrow([(360, 788), (426, 788)], "Publish", (393, 772), dashed=True))
    p.append(arrow([(624, 788), (694, 788)], "Project", (659, 772), dashed=True))

    d.edge(s1_id, ob_id, "ACID Outbox (9 DBs)", dashed=True)
    d.edge(ob_id, mq_id, "Publish", dashed=True)
    d.edge(mq_id, cq_id, "Project", dashed=True)

    # =========================================================================
    # CASUAL UNBOXED SUMMARY FOOTER (y = 1004..1038)
    # =========================================================================
    p.append(label(96, 1004, "Tổng kết kiến trúc lưu trữ (Polyglot Persistence):   12 PostgreSQL 16 DBs tách biệt (9 Write + 2 CQRS Read + 1 chat_db)  ·  MinIO S3  ·  Redis 7  ·  Vector JSON  ·  1 Stateless",
                   size=10.4, bold=True, color="#1F2937", align="start"))
    p.append(label(96, 1026, "Môi trường triển khai thực tế:  Khởi tạo tập trung qua infra/dev/postgres/init-multiple-dbs.sql (:15432), cô lập hoàn toàn schema & connection pool theo từng microservice.",
                   size=9.7, color="#4B5563", align="start"))

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
