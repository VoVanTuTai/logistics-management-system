#!/usr/bin/env python3
"""
generate_distributed_fig1_blueprint.py
Generates Figure 1 for Paper 2 following AGENTS.md Section 5 (Modern Technical Architecture
Infographic: SaaS Card-Based Pastel Semantic Coding, numbered badges 1-6, brand tech icons,
Runtime Flow Summary Card, and Tech Stack Footer Bar), 100% aligned with:
  - services/scan-service/src/application/services/scans.service.ts
  - services/scan-service/src/messaging/outbox/scan-outbox-relay.service.ts
  - services/shipment-service/src/messaging/outbox/shipment-outbox-relay.service.ts
  - services/shipment-service/src/domain/state-machine/shipment-state-machine.ts
  - services/shipment-service/src/messaging/consumers/shipment-rabbitmq-consumer.service.ts
  - services/tracking-service/src/infrastructure/prisma/tracking-projection.store.ts
  - services/reporting-service/src/messaging/consumers/reporting-rabbitmq-consumer.service.ts
"""

import xml.etree.ElementTree as ET
from pathlib import Path
import subprocess

OUT_DIR = Path(__file__).resolve().parent / "diagrams"
OUT_DIR.mkdir(parents=True, exist_ok=True)
SVG_PATH = OUT_DIR / "fig1-distributed-outbox-cqrs-infographic.svg"
PNG_PATH = OUT_DIR / "fig1-distributed-outbox-cqrs-infographic.png"

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


def ortho_arrow(pts, dashed=False, end_dir="right", color="#334155", stroke_w=2.1):
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
        f'<circle cx="{cx}" cy="{cy}" r="13.5" fill="{bg}" stroke="#FFFFFF" stroke-width="2.4" filter="url(#cardShadow)"/>',
        f'<text x="{cx}" y="{cy + 4.5}" font-family="{FONT_SANS}" font-size="13" font-weight="800" fill="#FFFFFF" text-anchor="middle">{esc(n)}</text>',
    ])


def pill_tag(cx: float, cy: float, text: str, bg: str = "#1E293B", fg: str = "#FFFFFF", fs: float = 9.8, border: str = "") -> str:
    w = len(text) * (fs * 0.62) + 14
    b_attr = f' stroke="{border}" stroke-width="1.1"' if border else ""
    return "\n".join([
        f'<rect x="{cx - w/2:.1f}" y="{cy - 10}" width="{w:.1f}" height="20" rx="10" fill="{bg}"{b_attr}/>',
        f'<text x="{cx}" y="{cy + 3.6}" font-family="{FONT_MONO}" font-size="{fs}" font-weight="800" fill="{fg}" text-anchor="middle">{esc(text)}</text>',
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
        f'<text x="{title_x}" y="{y+19.5}" font-family="{FONT_SANS}" font-size="13.5" font-weight="800" fill="{header_fg}">{esc(title)}</text>',
        f'<text x="{title_x}" y="{y+35.5}" font-family="{FONT_MONO}" font-size="10.5" font-weight="600" fill="{header_fg}" opacity="0.9">{esc(subtitle)}</text>',
        num_badge(x + 14, y + 18, step_num, bg=badge_bg) if step_num else "",
    ]
    cy = y + 60
    for kind, txt in lines:
        if kind == "bold":
            out.append(f'<text x="{x+13}" y="{cy}" font-family="{FONT_SANS}" font-size="11.8" font-weight="800" fill="#0F172A">{esc(txt)}</text>')
            cy += 18.5
        elif kind == "mono":
            out.append(f'<text x="{x+13}" y="{cy}" font-family="{FONT_MONO}" font-size="10.6" font-weight="700" fill="#1E293B">{esc(txt)}</text>')
            cy += 17.5
        elif kind == "note":
            out.append(f'<rect x="{x+11}" y="{cy-12.5}" width="{w-22}" height="22" rx="6" fill="#FFFFFF" stroke="{border}" stroke-width="1.2" stroke-dasharray="4 3"/>')
            out.append(f'<text x="{x+19}" y="{cy+2}" font-family="{FONT_MONO}" font-size="10.4" font-weight="800" fill="#0F172A">{esc(txt)}</text>')
            cy += 25
        else:
            out.append(f'<text x="{x+13}" y="{cy}" font-family="{FONT_SANS}" font-size="11.5" font-weight="500" fill="#1E293B">{esc(txt)}</text>')
            cy += 18.0

    if footer_chip:
        chip_w = len(footer_chip) * 6.1 + 14
        out.append(pill_tag(x + 13 + chip_w / 2, y + h - 18, footer_chip, bg=badge_bg, fg="#FFFFFF", fs=9.6))
    return "\n".join([s for s in out if s])


def build_svg():
    W, H = 1600, 868
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

        # Header Banner
        f'<rect x="18" y="14" width="{W-36}" height="68" rx="14" fill="url(#hdrGrad)" filter="url(#cardShadow)"/>',
        f'<text x="38" y="42" font-family="{FONT_SANS}" font-size="20.2" font-weight="800" fill="#FFFFFF" letter-spacing="0.2">NEXUS EVENT-DRIVEN OUTBOX &amp; CQRS ARCHITECTURE WITH TTL/DLQ CONTROL</text>',
        f'<text x="38" y="65" font-family="{FONT_MONO}" font-size="12.0" font-weight="600" fill="#DBEAFE">NestJS 10 Microservices  •  Isolated PG 16 DBs  •  Dual-Layer P2002 Dedup  •  RabbitMQ 3.13  •  5-Level Control</text>',
        f'<rect x="{W-262}" y="25" width="224" height="46" rx="10" fill="#0F172A" fill-opacity="0.35" stroke="#93C5FD" stroke-width="1.2"/>',
        f'<text x="{W-150}" y="45" font-family="{FONT_MONO}" font-size="11.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">FIG. 1  •  LIVE CLUSTER RUNTIME</text>',
        f'<text x="{W-150}" y="62" font-family="{FONT_MONO}" font-size="10.4" font-weight="600" fill="#BFDBFE" text-anchor="middle">4 Core Event DBs (12 Total) + RMQ</text>',

        # Three Dashed Bounded Containers (AGENTS.md Section 5)
        f'<rect x="18" y="102" width="450" height="690" rx="16" fill="#F8FAFC" stroke="#818CF8" stroke-width="1.9" stroke-dasharray="8 5"/>',
        f'<rect x="34" y="88" width="320" height="22" rx="11" fill="#EEF2FF" stroke="#818CF8" stroke-width="1.3"/>',
        f'<text x="194" y="103" font-family="{FONT_MONO}" font-size="10.8" font-weight="800" fill="#3730A3" text-anchor="middle">1. COMMAND INGESTION &amp; OUTBOX (ACID)</text>',

        f'<rect x="532" y="102" width="454" height="690" rx="16" fill="#FFFBEB" fill-opacity="0.45" stroke="#F59E0B" stroke-width="1.9" stroke-dasharray="8 5"/>',
        f'<rect x="548" y="88" width="334" height="22" rx="11" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.3"/>',
        f'<text x="715" y="103" font-family="{FONT_MONO}" font-size="10.8" font-weight="800" fill="#92400E" text-anchor="middle">2. RABBITMQ BROKER &amp; TTL / DLQ CONTROL</text>',

        f'<rect x="1060" y="102" width="522" height="690" rx="16" fill="#F8FAFC" stroke="#38BDF8" stroke-width="1.9" stroke-dasharray="8 5"/>',
        f'<rect x="1076" y="88" width="368" height="22" rx="11" fill="#E0F2FE" stroke="#38BDF8" stroke-width="1.3"/>',
        f'<text x="1260" y="103" font-family="{FONT_MONO}" font-size="10.8" font-weight="800" fill="#075985" text-anchor="middle">3. DOMAIN FSM AUTHORITY, CQRS VIEWS &amp; SUMMARY</text>',
    ]

    # DRAW CONNECTORS FIRST so pills & cards sit cleanly above lines
    # 1 -> 2 (Ingress -> ScanService)
    parts.append(ortho_arrow([(243, 256), (243, 280)], color="#1D4ED8", stroke_w=2.3, end_dir="down"))
    # 2 -> 3 (ScanService -> Outbox Relays)
    parts.append(ortho_arrow([(243, 534), (243, 558)], color="#059669", stroke_w=2.3, end_dir="down"))
    # 3 -> 4a (Col 1 Relay -> Col 2 domain.events in 64px aisle x=468..532)
    parts.append(ortho_arrow([(454, 670), (500, 670), (500, 200), (546, 200)], color="#2563EB", stroke_w=2.4, end_dir="right"))
    # 4a <-> 4b (Queue <-> TTL Retry Loop)
    parts.append(ortho_arrow([(675, 424), (675, 456)], color="#D97706", stroke_w=2.2, end_dir="down"))
    parts.append(ortho_arrow([(855, 456), (855, 424)], dashed=True, color="#B45309", stroke_w=2.0, end_dir="up"))
    # Col 2 -> Col 3 (3 clean fan-out paths in 74px aisle x=986..1060)
    parts.append(ortho_arrow([(972, 224), (1020, 224), (1020, 212), (1074, 212)], color="#DC2626", stroke_w=2.3, end_dir="right"))
    parts.append(ortho_arrow([(972, 294), (1020, 294), (1020, 412), (1074, 412)], color="#0284C7", stroke_w=2.3, end_dir="right"))
    parts.append(ortho_arrow([(972, 354), (1006, 354), (1006, 496), (1074, 496)], dashed=True, color="#D97706", stroke_w=2.1, end_dir="right"))

    # Pills along corridors (zero overlap with crossing lines)
    parts.append(pill_tag(500, 440, "532ms dwell", bg="#1E293B", fg="#FFFFFF", fs=9.4))
    parts.append(pill_tag(675, 440, "NACK (<2)", bg="#92400E", fg="#FFFFFF", fs=9.2))
    parts.append(pill_tag(855, 440, "TTL Re-route", bg="#FFFBEB", fg="#92400E", fs=9.2, border="#D97706"))
    parts.append(pill_tag(1020, 186, "AMQP Push", bg="#DC2626", fg="#FFFFFF", fs=9.2))
    parts.append(pill_tag(1020, 318, "AMQP Push", bg="#0284C7", fg="#FFFFFF", fs=9.2))
    parts.append(pill_tag(1032, 496, "HTTP Pull", bg="#D97706", fg="#FFFFFF", fs=9.2))

    # ---- COLUMN 1 CARDS ----
    parts.append(semantic_card(
        32, 118, 422, 138,
        "1", "PDA Clients & API Gateway BFF", "POST /scans/inbound | /pickup | /outbound",
        fill="#FFFFFF", border="#94A3B8", header_bg="#EFF6FF", header_fg="#1E3A8A", badge_bg="#1D4ED8",
        lines=[
            ("bold", "Synthetic Concurrency & Burst Ingress (c = 1..100):"),
            ("mono", "• Payload: shipmentCode + locationCode + idempotencyKey"),
            ("mono", "• Fast ACK edge: p50 = 21.2 ms (zero downstream block)"),
            ("text", "• Redis 7 scoped strictly to BFF chat WS pub/sub"),
        ],
    ))

    parts.append(semantic_card(
        32, 282, 422, 252,
        "2", "ScanService — Dual Idempotency", "ScansService + scan_db (PG 16)",
        fill="#ECFDF5", border="#34D399", header_bg="#D1FAE5", header_fg="#065F46", badge_bg="#059669",
        lines=[
            ("bold", "Lock Guard & Two-Tier Deduplication Flow:"),
            ("mono", "1. Guard : Sync HTTP ShipmentService (400 if locked)"),
            ("mono", "   Override only for INVENTORY_CHECK or RETURN scan"),
            ("mono", "2. Layer 1: IdempotencyRecord lookup -> 1.825ms replay"),
            ("mono", "3. Layer 2: ScanEvent INSERT (@unique -> P2002 recovery)"),
            ("mono", "4. Owner : Upsert CurrentLocation + OpsAuditLog"),
            ("mono", "5. Enqueue: OutboxEvent(status='PENDING', eventId)"),
            ("note", "Exp 3: 500 writes -> 150/150 DB rows | 7.52x @ c=25"),
        ],
    ))

    parts.append(semantic_card(
        32, 560, 422, 218,
        "3", "Transactional Outbox & Relays", "T_poll = 1,000 ms  •  Batch Cap B = 50",
        fill="#EFF6FF", border="#60A5FA", header_bg="#DBEAFE", header_fg="#1E3A8A", badge_bg="#2563EB",
        lines=[
            ("bold", "Heterogeneous Broker Publishing Relays:"),
            ("mono", "• ScanOutboxRelayService (HTTP Mgmt Sequential):"),
            ("mono", "  1.67 ms/msg (599.9 msg/s) -> marks publishedAt"),
            ("mono", "• ShipmentOutboxRelay (AMQP Confirm) + Batch-50 Probe:"),
            ("mono", "  0.59 ms/msg Seq (2.84x) | 0.058 ms Probe (28.25x)"),
            ("note", "Exp 2A: Dwell 532.0 ms = 99.7% of Tracking E2E lag"),
        ],
    ))

    # ---- COLUMN 2 CARDS ----
    parts.append(semantic_card(
        546, 118, 426, 306,
        "4", "RabbitMQ 3.13 Topic Exchange & Queues", "domain.events (Durable)  •  65 Active Bindings",
        fill="#EEF2FF", border="#818CF8", header_bg="#E0E7FF", header_fg="#312E81", badge_bg="#4F46E5",
        lines=[
            ("bold", "Persistent Topic Routing (delivery_mode = 2):"),
            ("mono", "• scan.inbound | scan.outbound | scan.pickup_confirmed"),
            ("mono", "• shipment.created | task.assigned | delivery.*"),
            ("mono", "• ndr.created | return.* | manifest.*"),
            ("bold", "Autonomous Bounded-Context Queues:"),
            ("mono", "[Q1] shipment-service.q  -> AMQP Push (noAck: false)"),
            ("mono", "[Q2] tracking-service.q  -> AMQP Push (1.03 ms lag)"),
            ("mono", "[Q3] reporting-service.q -> HTTP Pull (/get, B=20)"),
            ("note", "Exp 2B: 200-burst drains in 4 B=50 ticks (3,817 ms)"),
        ],
    ))

    parts.append(semantic_card(
        546, 456, 426, 322,
        "4b", "TTL Retry & Human DLQ Escalation", "moveToRetryOrDlq()  •  5-Level Control Gate",
        fill="#FEF3C7", border="#F59E0B", header_bg="#FDE68A", header_fg="#92400E", badge_bg="#D97706",
        lines=[
            ("bold", "Bounded Retry Ladder (Zero Healthy Traffic Stall):"),
            ("mono", "• Stage 0: ACK main + push .retry.10s (retry=0)"),
            ("mono", "• Stage 1: .retry.10s (10 s TTL -> domain.events/retry)"),
            ("mono", "• Stage 2: .retry.1m  (60 s TTL -> domain.events/retry)"),
            ("mono", "• Stage 3: .dlq       (retry>=2 -> Human Quarantine)"),
            ("bold", "Controlled Fault Injection Results (Exp 4B, N=10):"),
            ("mono", "• 5/5 delayed parents self-healed @ 10.36 s (100%)"),
            ("mono", "• 5/5 poison events isolated in .dlq @ 71.97 s"),
            ("note", "Level 5 Control: Operators reconcile .dlq + locks via Ops"),
        ],
    ))

    # ---- COLUMN 3 CARDS ----
    parts.append(semantic_card(
        1074, 118, 494, 194,
        "5", "ShipmentService — Authority FSM", "ShipmentStateMachine + shipment_db",
        fill="#FEF2F2", border="#F87171", header_bg="#FEE2E2", header_fg="#991B1B", badge_bg="#DC2626",
        lines=[
            ("bold", "Single-Writer Lifecycle Guardrail (0.19 ms hop):"),
            ("mono", "• 19 states, 15 consumed events, VALID_TRANSITIONS map"),
            ("mono", "• Terminals locked: DELIVERED, RETURN_COMPLETED, CANCELLED"),
            ("mono", "• Exp 4A Safety: 60/60 (100%) OOO attacks rejected"),
            ("note", "Audit F3 (Proposed): Async unlock race (18/20 vs 20/20)"),
        ],
    ))

    parts.append(semantic_card(
        1074, 330, 494, 224,
        "6", "Decoupled CQRS Read Projections", "tracking_db & reporting_db (PG 16)",
        fill="#E0F2FE", border="#38BDF8", header_bg="#BAE6FD", header_fg="#075985", badge_bg="#0284C7",
        lines=[
            ("bold", "TrackingService (Operational Point Reads, Zero JOIN):"),
            ("mono", "• TimelineEvent (P2002) + TrackingCurrent (p50=13.0 ms)"),
            ("mono", "• 65.6% lower p95 tail vs Sync RDBMS (15.7 vs 45.7 ms)"),
            ("bold", "ReportingService (Analytical 8-Way KPI Rollups):"),
            ("mono", "• AggregationJob P2002: 0/50 dup leaks | 895 ms E2E"),
            ("note", "Audit F1/F2 (Proposed): Skew guard & post-commit Ack"),
        ],
    ))

    # Step Summary Card (AGENTS.md Section 5)
    parts.append(f'<rect x="1074" y="572" width="494" height="206" rx="13" fill="#FFFFFF" stroke="#64748B" stroke-width="1.6" filter="url(#cardShadow)"/>')
    parts.append(f'<rect x="1074" y="572" width="494" height="34" rx="10" fill="#1E293B"/>')
    parts.append(f'<text x="1090" y="594" font-family="{FONT_SANS}" font-size="13.0" font-weight="800" fill="#FFFFFF">END-TO-END FLOW &amp; CONTROL SUMMARY (STEPS 1-6)</text>')
    steps_sum = [
        ("1", "#1D4ED8", "Burst ingress returns 21.2 ms fast-path HTTP ACK."),
        ("2", "#059669", "Lock guard + L1/L2 P2002 guarantee 150/150 dedup."),
        ("3", "#2563EB", "Outbox polling (532 ms dwell); Batch-50 Probe: 28.25x."),
        ("4", "#D97706", "TTL .retry heals 5/5 (10.4s); poison -> human .dlq."),
        ("5", "#DC2626", "19-state FSM whitelist preserves 60/60 terminal safety."),
        ("6", "#0284C7", "CQRS views cut read p95 -65.6%; proposed fixes F1-F3."),
    ]
    sy = 623
    for sn, col, stxt in steps_sum:
        parts.append(f'<circle cx="1095" cy="{sy-4}" r="9.5" fill="{col}"/>')
        parts.append(f'<text x="1095" y="{sy}" font-family="{FONT_SANS}" font-size="10.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">{sn}</text>')
        parts.append(f'<text x="1113" y="{sy}" font-family="{FONT_SANS}" font-size="11.3" font-weight="600" fill="#1E293B">{esc(stxt)}</text>')
        sy += 21.5
    parts.append(f'<rect x="1086" y="746" width="470" height="22" rx="6" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>')
    parts.append(f'<text x="1321" y="761" font-family="{FONT_MONO}" font-size="10.2" font-weight="700" fill="#334155" text-anchor="middle">Single-Writer DB Ownership + 5-Level Human Control (.dlq / Locks)</text>')

    # Footer Tech Stack Summary Bar (AGENTS.md Section 5)
    parts.append(f'<rect x="18" y="804" width="{W-36}" height="50" rx="12" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>')
    parts.append(f'<rect x="28" y="814" width="150" height="30" rx="15" fill="#1D4ED8"/>')
    parts.append(f'<text x="103" y="833.5" font-family="{FONT_SANS}" font-size="11.8" font-weight="800" fill="#FFFFFF" text-anchor="middle">CORE TECH STACK</text>')

    brands = [
        (194, "#E0234E", "NestJS 10 (TypeScript)", "N", 196),
        (404, "#2563EB", "PostgreSQL 16 (Isolated DBs)", "P", 242),
        (660, "#0F172A", "Prisma ORM (P2002 Dedup)", "R", 216),
        (890, "#EA580C", "RabbitMQ 3.13 (AMQP + DLX)", "M", 232),
        (1136, "#059669", "Node.js 26 + amqplib Confirm", "A", 234),
        (1384, "#0284C7", "Docker Alpine + Ops Web", "D", 184),
    ]
    for bx, col, lbl, sym, bw in brands:
        parts.append(f'<rect x="{bx}" y="813" width="{bw}" height="32" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>')
        parts.append(f'<circle cx="{bx+16}" cy="829" r="10" fill="{col}"/>')
        parts.append(f'<text x="{bx+16}" y="833" font-family="{FONT_MONO}" font-size="10.8" font-weight="800" fill="#FFFFFF" text-anchor="middle">{sym}</text>')
        parts.append(f'<text x="{bx+32}" y="833" font-family="{FONT_SANS}" font-size="11.2" font-weight="700" fill="#0F172A">{esc(lbl)}</text>')

    parts.append('</svg>')
    svg_text = "\n".join(parts)
    ET.fromstring(svg_text)
    SVG_PATH.write_text(svg_text, encoding="utf-8")
    print(f"[OK] Validated Infographic SVG saved to {SVG_PATH}")

    html_wrap = OUT_DIR / "_render_fig1_infographic.html"
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
    print(f"[OK] High-DPI Infographic PNG rendered to {PNG_PATH}")


if __name__ == "__main__":
    build_svg()
