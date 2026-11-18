#!/usr/bin/env python3
"""
Generate 7 additional Studio-Grade Brand UI Feature Screens (SVG + 2x PNG)
complementing the 6 main layout plates so Section 4.6 showcases BOTH the
general layout AND the signature operational workflows of ALL 6 actors:

  1. ui-merchant-create-and-list.{svg,png}  (Hình 4.9  - Merchant: Create Order IATA + Single-Line Table)
  2. ui-ops-manifest-cod.{svg,png}          (Hình 4.11 - Ops: Shipment Table + Manifest Seal + COD VietQR)
  3. ui-ops-stray-investigation.{svg,png}   (Hình 4.12 - Ops: Stray Investigation 24h Hearing & CCTV Drawer)
  4. ui-courier-ndr-cod-chat.{svg,png}      (Hình 4.14 - Courier: NDR Report + VietQR COD + Ops Chat)
  5. ui-admin-rbac-hub.{svg,png}            (Hình 4.16 - Admin: Mobile Permission Override + 4-Tier Hub/Zone)
  6. ui-customer-order-timeline.{svg,png}   (Hình 4.18 - Customer: Create Order IATA + Live Tracking Timeline)
  7. ui-guest-tracking-pricing.{svg,png}    (Hình 4.20 - Guest: Public Tracking Result + IATA Calculator)
"""

import html
import os
import re
import subprocess

OUT_DIR = "docs/architecture/diagrams"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONT = "'Manrope','Inter','Helvetica Neue',Arial,sans-serif"
MONO = "'SF Mono','Menlo','Consolas',monospace"

C_PRIMARY = "#0052CC"
C_PRIMARY_DARK = "#003D9B"
C_PRIMARY_LIGHT = "#2563EB"
C_PRIMARY_SOFT = "#E7EFFF"
C_BG = "#F6F8FC"
C_SURFACE = "#FFFFFF"
C_TEXT = "#102548"
C_MUTED = "#5B6B86"
C_BORDER = "#DBE2F0"
C_SUCCESS = "#137F5D"
C_SUCCESS_BG = "#DCFCE7"
C_WARN = "#C26D0A"
C_WARN_BG = "#FEF3C7"
C_DANGER = "#B91C1C"
C_DANGER_BG = "#FEE2E2"
C_PURPLE = "#6D28D9"
C_PURPLE_BG = "#F3E8FF"


def esc(s):
    return html.escape(str(s), quote=True)


def txt(x, y, s, size=12, bold=False, color=C_TEXT, align="start", family=FONT):
    w = "700" if bold else "500"
    return (
        f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
        f'font-weight="{w}" fill="{color}" text-anchor="{align}">{esc(s)}</text>'
    )


def rect(x, y, w, h, fill=C_SURFACE, stroke=C_BORDER, sw=1.2, rx=10, dashed=False):
    da = ' stroke-dasharray="5,4"' if dashed else ""
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ' stroke="none"'
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{st}{da}/>'


def pill(x, y, w, h, label_str, fill=C_PRIMARY_SOFT, color=C_PRIMARY, size=10, bold=True, stroke=None):
    return (
        rect(x, y, w, h, fill=fill, stroke=stroke, sw=1, rx=h / 2)
        + txt(x + w / 2, y + h / 2 + size * 0.35, label_str, size=size, bold=bold, color=color, align="middle")
    )


def svg_wrap(w, h, inner):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#003D9B"/>
      <stop offset="55%" stop-color="#0052CC"/>
      <stop offset="100%" stop-color="#1D64E8"/>
    </linearGradient>
    <linearGradient id="navyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1F44"/>
      <stop offset="100%" stop-color="#1A3A75"/>
    </linearGradient>
    <filter id="cardShadow" x="-4%" y="-6%" width="108%" height="116%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>
  </defs>
  <rect width="{w}" height="{h}" fill="#FFFFFF"/>
  {inner}
</svg>'''


def browser_frame(x, y, w, h, url, tab_title):
    out = [
        f'<g filter="url(#cardShadow)">{rect(x, y, w, h, fill=C_BG, stroke="#CBD5E1", sw=1.5, rx=14)}</g>',
        f'<path d="M{x} {y+14} Q{x} {y} {x+14} {y} H{x+w-14} Q{x+w} {y} {x+w} {y+14} V{y+42} H{x} Z" fill="#EEF2F7" stroke="#CBD5E1" stroke-width="1"/>',
    ]
    for idx, col in enumerate(["#EF4444", "#F59E0B", "#22C55E"]):
        out.append(f'<circle cx="{x+22+idx*16}" cy="{y+21}" r="5" fill="{col}"/>')
    out.append(rect(x + 76, y + 8, 236, 26, fill="#FFFFFF", stroke="#CBD5E1", sw=1, rx=7))
    out.append(rect(x + 86, y + 14, 14, 14, fill=C_PRIMARY, stroke=None, rx=3))
    out.append(txt(x + 93, y + 25, "N", size=9.5, bold=True, color="#FFFFFF", align="middle"))
    out.append(txt(x + 108, y + 25, tab_title, size=10.5, bold=True, color=C_TEXT))
    out.append(rect(x + 324, y + 9, w - 358, 24, fill="#FFFFFF", stroke="#CBD5E1", sw=1, rx=12))
    out.append(txt(x + 340, y + 25, f"🔒  {url}", size=10.5, color=C_MUTED))
    return "\n".join(out)


def zone_footer(w, y, items):
    out = [rect(24, y, w - 48, 52, fill="#F8FAFC", stroke="#CBD5E1", sw=1.2, rx=10)]
    step = (w - 80) / len(items)
    for i, (badge, title, desc) in enumerate(items):
        bx = 42 + i * step
        out.append(f'<circle cx="{bx+11}" cy="{y+26}" r="11" fill="{C_PRIMARY}"/>')
        out.append(txt(bx + 11, y + 30, badge, size=10.5, bold=True, color="#FFFFFF", align="middle"))
        out.append(txt(bx + 30, y + 22, title, size=10.8, bold=True, color=C_TEXT))
        out.append(txt(bx + 30, y + 38, desc, size=9.6, color=C_MUTED))
    return "\n".join(out)


def phone_frame(x, y, w, h, status_time="09:41", subtitle="", dark_status=False):
    out = [f'<g filter="url(#cardShadow)">{rect(x, y, w, h, fill="#0F172A", stroke="#334155", sw=2, rx=34)}</g>']
    sx, sy, sw, sh = x + 10, y + 10, w - 20, h - 20
    out.append(rect(sx, sy, sw, sh, fill=C_BG, stroke="none", rx=26))
    st_col = "#FFFFFF" if dark_status else C_TEXT
    out.append(rect(x + w / 2 - 44, sy + 6, 88, 16, fill="#0F172A", stroke=None, rx=8))
    out.append(txt(sx + 20, sy + 18, status_time, size=10, bold=True, color=st_col))
    out.append(txt(sx + sw - 18, sy + 18, "5G  100%", size=9.5, bold=True, color=st_col, align="end"))
    if subtitle:
        out.append(txt(x + w / 2, y + h + 24, subtitle, size=11.8, bold=True, color=C_TEXT, align="middle"))
    return "\n".join(out), (sx, sy, sw, sh)


# =============================================================================
# 1. MERCHANT: CREATE ORDER (5 ITEM CATEGORIES + IATA) & SINGLE-LINE TABLE (Hình 4.9)
# =============================================================================
def build_merchant_create_and_list():
    W, H = 1280, 760
    p = []
    p.append(browser_frame(24, 18, W - 48, 658, "https://merchant.nexus-ex.site/shipments/create", "NEXUS Merchant — Tạo & Quản lý đơn"))

    # Compact left nav rail
    p.append(rect(25, 60, 176, 615, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    p.append(rect(40, 74, 26, 26, fill=C_PRIMARY, stroke=None, rx=6))
    p.append(txt(53, 92, "NX", size=10.5, bold=True, color="#FFFFFF", align="middle"))
    p.append(txt(74, 91, "NEXUS Express", size=12.5, bold=True, color=C_TEXT))
    for i, (lbl, act) in enumerate([
        ("Tổng quan", False), ("Tạo đơn hàng", True), ("Danh sách đơn", False),
        ("Yêu cầu lấy hàng", False), ("In vận đơn A6", False), ("Đối soát COD", False),
    ]):
        ny = 122 + i * 40
        if act:
            p.append(rect(36, ny, 154, 32, fill=C_PRIMARY, stroke=None, rx=8))
            p.append(txt(50, ny + 20, f"▪ {lbl}", size=11, bold=True, color="#FFFFFF"))
        else:
            p.append(txt(50, ny + 20, f"◦ {lbl}", size=10.8, color=C_MUTED))

    # Top Section (y=74..414): Create Order Form + Live IATA Quote Card
    mx = 220
    # Left Form Card (w=660)
    p.append(rect(mx, 76, 668, 336, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=12))
    p.append(txt(mx + 18, 102, "Tạo vận đơn mới — Phân loại 5 nhóm hàng & Kiểm soát 3 tầng trần", size=14, bold=True, color=C_TEXT))
    # 5 Carrier Category Chips
    cats = [
        ("Hàng thường", False, C_BG, C_MUTED),
        ("Hàng dễ vỡ (FRAGILE)", True, C_WARN_BG, C_WARN),
        ("Giá trị cao", False, C_BG, C_MUTED),
        ("Cồng kềnh", False, C_BG, C_MUTED),
        ("Tài liệu", False, C_BG, C_MUTED),
    ]
    cx = mx + 18
    for lbl, sel, bg, col in cats:
        cw = len(lbl) * 6.8 + 22
        p.append(pill(cx, 114, cw, 26, lbl, fill=bg, color=col, size=9.6, stroke=C_WARN if sel else C_BORDER))
        cx += cw + 8

    # Recipient fields (2 columns)
    fields = [
        ("Người nhận", "Nguyễn Minh Quân — 0909.882.114", mx + 18, 152, 306),
        ("Địa chỉ đích (Tự nhận vùng cước)", "128 Nguyễn Thị Minh Khai, Q.3, TP.HCM", mx + 340, 152, 310),
        ("Khối lượng thực & Kích thước (cm)", "2,4 kg  |  D 40 × R 30 × C 25 cm  →  IATA: 5,0 kg", mx + 18, 212, 390),
        ("Thu hộ COD / Giá trị khai giá", "COD: 1.250.000 đ  |  Khai giá: 2.500.000 đ", mx + 422, 212, 228),
    ]
    for flbl, fval, fx, fy, fw in fields:
        p.append(txt(fx, fy + 10, flbl, size=9.8, bold=True, color=C_MUTED))
        p.append(rect(fx, fy + 16, fw, 32, fill=C_BG, stroke=C_BORDER, sw=1, rx=8))
        p.append(txt(fx + 10, fy + 36, fval, size=10.3, bold=True, color=C_TEXT))

    # Operational Ceiling Banner + Fragile SOP alert
    p.append(rect(mx + 18, 276, 632, 54, fill="#FFFBEB", stroke="#FCD34D", sw=1, rx=10))
    p.append(pill(mx + 28, 286, 158, 22, "TẦNG 1: TIÊU CHUẨN", fill=C_SUCCESS_BG, color=C_SUCCESS, size=9))
    p.append(pill(mx + 194, 286, 198, 22, "NHÃN: HÀNG DỄ VỠ - NHẸ TAY", fill=C_WARN_BG, color=C_WARN, size=9))
    p.append(txt(mx + 28, 322, "Trọng lượng quy đổi IATA = (40×30×25)/6000 = 5,0 kg (> 2,4 kg) · Yêu cầu bọc xốp hơi ≥ 3 lớp · Trần tối đa ≤ 70kg.", size=9.5, color="#92400E"))

    # Action buttons
    p.append(rect(mx + 18, 344, 180, 36, fill=C_PRIMARY, stroke=None, rx=8))
    p.append(txt(mx + 108, 366, "Xác nhận Tạo đơn", size=11.5, bold=True, color="#FFFFFF", align="middle"))
    p.append(rect(mx + 210, 344, 156, 36, fill="#FFFFFF", stroke=C_PRIMARY, sw=1.2, rx=8))
    p.append(txt(mx + 288, 366, "In nhãn A6 / Mã vạch", size=11, bold=True, color=C_PRIMARY, align="middle"))
    p.append(txt(mx + 382, 366, "Lưu bản chụp biểu phí (Pricing Snapshot) bất biến", size=9.8, color=C_MUTED))

    # Right Live IATA Quote Panel (w=340)
    qx = mx + 684
    qw = W - qx - 42
    p.append(rect(qx, 76, qw, 336, fill="#FFFFFF", stroke="#93C5FD", sw=1.4, rx=12))
    p.append(f'<path d="M{qx} 88 Q{qx} 76 {qx+12} 76 H{qx+qw-12} Q{qx+qw} 76 {qx+qw} 88 V124 H{qx} Z" fill="url(#brandGrad)"/>')
    p.append(txt(qx + 18, 105, "Báo giá động (pricing-service :3012)", size=12.5, bold=True, color="#FFFFFF"))
    quote_lines = [
        ("Phiên bản biểu phí:", "NEXUS_RATES_2026_05", C_TEXT),
        ("Phân vùng tuyến:", "Trục chính HN ↔ HCM", C_PRIMARY),
        ("Gói dịch vụ:", "Giao Tiêu chuẩn (EXPRESS)", C_TEXT),
        ("Trọng lượng tính cước:", "5,0 kg (IATA V/6000)", C_WARN),
        ("Cước cơ bản + vượt cân:", "58.000 đ", C_TEXT),
        ("Phụ phí vùng trục chính:", "+7.000 đ", C_TEXT),
        ("Bảo hiểm khai giá (0,5%):", "+12.500 đ (Đền 100%)", C_SUCCESS),
    ]
    for i, (k, v, col) in enumerate(quote_lines):
        ly = 148 + i * 28
        p.append(txt(qx + 18, ly, k, size=10, color=C_MUTED))
        p.append(txt(qx + qw - 18, ly, v, size=10.3, bold=True, color=col, align="end"))
    p.append(f'<line x1="{qx+18}" y1="344" x2="{qx+qw-18}" y2="344" stroke="{C_BORDER}" stroke-width="1.2"/>')
    p.append(txt(qx + 18, 372, "TỔNG CƯỚC DỰ KIẾN", size=11, bold=True, color=C_TEXT))
    p.append(txt(qx + qw - 18, 376, "77.500 đ", size=20, bold=True, color=C_PRIMARY, align="end"))
    p.append(txt(qx + 18, 396, "Cước hoàn (SME): 50% cước chiều đi · Tự động cấn trừ COD", size=9.2, color=C_MUTED))

    # Bottom Section (y=428..660): Standardized Single-Line Shipment Table (AGENTS.md §3!)
    tw = W - mx - 42
    p.append(rect(mx, 428, tw, 232, fill="#FFFFFF", stroke="#D9DEF3", sw=1.3, rx=10))
    p.append(txt(mx + 16, 452, "Danh sách vận đơn chuẩn 1 dòng (Single-Line Monospace Tracking Table)", size=13, bold=True, color=C_TEXT))
    p.append(pill(mx + tw - 210, 436, 194, 22, "Quét bôi đen mượt cả cột mã đơn", fill=C_PRIMARY_SOFT, color=C_PRIMARY, size=9))
    # Table Header
    p.append(rect(mx + 1, 466, tw - 2, 32, fill="#F8FAFF", stroke="#CBD5E1", sw=1, rx=0))
    cols = [("MÃ VẬN ĐƠN", 16), ("NGƯỜI NHẬN", 172), ("TUYẾN / HUB ĐÍCH", 342), ("CÂN IATA", 522), ("TIỀN COD", 616), ("PHÍ SHIP", 726), ("TRẠNG THÁI", 826)]
    for clbl, cx_off in cols:
        p.append(txt(mx + cx_off, 486, clbl, size=9.8, bold=True, color="#1F2B6F"))
    rows = [
        ("SHP-202605-0018", "Nguyễn Minh Quân", "HCM01 → Q.3 (002C001)", "5,0 kg", "1.250.000 đ", "77.500 đ", "Đang giao hàng", C_PRIMARY_SOFT, C_PRIMARY),
        ("SHP-202605-0017", "Lê Hoàng Anh", "HCM01 → Đống Đa, HN", "1,8 kg", "890.000 đ", "35.000 đ", "Đã đóng bao MB", "#E0F2FE", "#0369A1"),
        ("SHP-202605-0016", "Phạm Thu Thảo", "HCM01 → Hải Châu, ĐN", "0,5 kg", "0 đ", "30.000 đ", "Giao thành công", C_SUCCESS_BG, C_SUCCESS),
        ("SHP-202605-0015", "Trần Quốc Bảo", "HCM01 → Thủ Đức", "3,2 kg", "420.000 đ", "25.000 đ", "Xử lý sự cố NDR", C_WARN_BG, C_WARN),
    ]
    for r_i, (code, rec, route, wt, cod, fee, st, sbg, scol) in enumerate(rows):
        ry = 498 + r_i * 38
        if r_i % 2 == 1:
            p.append(rect(mx + 1, ry, tw - 2, 38, fill="#FAFBFD", stroke=None, rx=0))
        p.append(f'<line x1="{mx+1}" y1="{ry+38}" x2="{mx+tw-1}" y2="{ry+38}" stroke="#E2E8F0" stroke-width="1"/>')
        p.append(txt(mx + 16, ry + 23, code, size=10.8, bold=True, color=C_PRIMARY, family=MONO))
        p.append(txt(mx + 172, ry + 23, rec, size=10.5, color=C_TEXT))
        p.append(txt(mx + 342, ry + 23, route, size=10.2, color=C_MUTED))
        p.append(txt(mx + 522, ry + 23, wt, size=10.3, bold=True, color=C_TEXT))
        p.append(txt(mx + 616, ry + 23, cod, size=10.3, bold=True, color=C_TEXT))
        p.append(txt(mx + 726, ry + 23, fee, size=10.3, color=C_MUTED))
        p.append(pill(mx + 826, ry + 8, 126, 22, st, fill=sbg, color=scol, size=9.2))

    p.append(zone_footer(W, 692, [
        ("1", "5 nhóm mặt hàng & 3 tầng trần", "Tự gắn nhãn FRAGILE, chặn vượt trần > 70kg / > 150cm"),
        ("2", "Tính cước IATA V/6000 tức thì", "Gọi trực tiếp pricing-service, lưu Pricing Snapshot bất biến"),
        ("3", "Bảng danh sách chuẩn 1 dòng (38px)", "Mã đơn Monospace bôi đen mượt, 1 badge trạng thái ngang"),
    ]))
    return svg_wrap(W, H, "\n".join(p))


# =============================================================================
# 2. OPS WEB: MANIFEST SEALING & COD SETTLEMENT (Hình 4.11)
# =============================================================================
def build_ops_manifest_cod():
    W, H = 1280, 760
    p = []
    p.append(browser_frame(24, 18, W - 48, 658, "https://ops.nexus-ex.site/app/transit/manifests", "NEXUS Ops — Đóng bao & Đối soát COD"))

    # Top bar
    p.append(rect(25, 60, W - 50, 52, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    p.append(rect(46, 72, 28, 28, fill=C_PRIMARY, stroke=None, rx=6))
    p.append(txt(60, 91, "NX", size=10.5, bold=True, color="#FFFFFF", align="middle"))
    p.append(txt(84, 90, "Vận chuyển tuyến & Đối soát COD Bưu cục", size=14.5, bold=True, color=C_TEXT))
    p.append(pill(420, 74, 152, 26, "Đóng bao & Niêm phong", fill=C_PRIMARY, color="#FFFFFF", size=10))
    p.append(pill(582, 74, 134, 26, "Quét xe đi / xe đến", fill=C_BG, color=C_MUTED, size=10))
    p.append(pill(726, 74, 150, 26, "Quyết toán COD Ca", fill=C_BG, color=C_MUTED, size=10))
    p.append(pill(W - 216, 74, 170, 26, "Hub: 002C001 (Mega HCM)", fill=C_PRIMARY_SOFT, color=C_PRIMARY, size=9.8))

    # Left Column (58%): Manifest Bagging & Seal Verification (manifest-service :3005)
    lx, lw = 46, 694
    p.append(rect(lx, 128, lw, 530, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=14))
    p.append(txt(lx + 20, 156, "1. Phiên Đóng bao trung chuyển & Kẹp chì niêm phong (Manifest)", size=14, bold=True, color=C_TEXT))
    p.append(txt(lx + 20, 175, "Tích hợp manifest-service (:3005) & scan-service (:3006) — Kiểm tra khóa lũy đẳng Idempotency Key", size=10, color=C_MUTED))

    # Manifest Header Summary
    p.append(rect(lx + 20, 190, lw - 40, 78, fill="#F8FAFF", stroke="#BFDBFE", sw=1.2, rx=10))
    p.append(txt(lx + 34, 214, "MÃ TEM BAO: MB-202605-09", size=13, bold=True, color=C_PRIMARY, family=MONO))
    p.append(pill(lx + 266, 198, 128, 22, "ĐÃ KẸP CHÌ SEAL", fill=C_SUCCESS_BG, color=C_SUCCESS, size=9.2))
    p.append(txt(lx + 34, 236, "Tuyến: Mega Hub TP.HCM (002C001)  →  Mega Hub Hà Nội (001C001)", size=10.5, bold=True, color=C_TEXT))
    p.append(txt(lx + 34, 255, "Mã chì Seal: SL-88421-HCM  ·  Chuyến xe: TRIP-HN08 (51C-892.14)  ·  24 kiện / 48,6 kg", size=9.8, color=C_MUTED))

    # Barcode scan bar
    p.append(rect(lx + 20, 282, lw - 196, 38, fill=C_BG, stroke="#93C5FD", sw=1.2, rx=8))
    p.append(txt(lx + 34, 305, "Bắn máy quét mã vận đơn (SHP-*) hoặc mã Seal vào bao MB-202605-09...", size=10.5, color=C_MUTED))
    p.append(rect(lx + lw - 166, 282, 146, 38, fill=C_PRIMARY, stroke=None, rx=8))
    p.append(txt(lx + lw - 93, 305, "Xác nhận đóng bao", size=10.8, bold=True, color="#FFFFFF", align="middle"))

    # Compact Single-Line Manifest Items Table
    p.append(rect(lx + 20, 334, lw - 40, 28, fill="#F8FAFF", stroke="#CBD5E1", sw=1, rx=0))
    for cl, ox in [("MÃ VẬN ĐƠN", 32), ("KHỐI LƯỢNG", 196), ("NHÓM HÀNG", 292), ("THỜI ĐIỂM QUÉT", 422), ("ĐỐI SOÁT", 566)]:
        p.append(txt(lx + ox, 352, cl, size=9.2, bold=True, color="#1F2B6F"))
    m_rows = [
        ("SHP-202605-0017", "1,8 kg", "Hàng dễ vỡ", "14:22:08 (Idemp OK)", "Khớp tuyến", C_SUCCESS_BG, C_SUCCESS),
        ("SHP-202605-0014", "4,2 kg", "Điện tử", "14:22:11 (Idemp OK)", "Khớp tuyến", C_SUCCESS_BG, C_SUCCESS),
        ("SHP-202605-0012", "0,4 kg", "Tài liệu", "14:22:15 (Idemp OK)", "Khớp tuyến", C_SUCCESS_BG, C_SUCCESS),
        ("SHP-202605-0009", "8,5 kg", "Cồng kềnh", "14:22:19 (Idemp OK)", "Khớp tuyến", C_SUCCESS_BG, C_SUCCESS),
        ("SHP-202605-0006", "2,1 kg", "Thông thường", "14:22:24 (Idemp OK)", "Khớp tuyến", C_SUCCESS_BG, C_SUCCESS),
    ]
    for ri, (c1, c2, c3, c4, c5, bg, col) in enumerate(m_rows):
        ry = 362 + ri * 36
        p.append(f'<line x1="{lx+20}" y1="{ry+36}" x2="{lx+lw-20}" y2="{ry+36}" stroke="#E2E8F0" stroke-width="1"/>')
        p.append(txt(lx + 32, ry + 22, c1, size=10.3, bold=True, color=C_PRIMARY, family=MONO))
        p.append(txt(lx + 196, ry + 22, c2, size=10.2, color=C_TEXT))
        p.append(txt(lx + 292, ry + 22, c3, size=10.2, color=C_MUTED))
        p.append(txt(lx + 422, ry + 22, c4, size=9.8, color=C_MUTED))
        p.append(pill(lx + 562, ry + 7, 86, 21, c5, fill=bg, color=col, size=8.8))

    # Bottom Seal Audit strip
    p.append(rect(lx + 20, 560, lw - 40, 80, fill="#ECFDF5", stroke="#6EE7B7", sw=1, rx=10))
    p.append(txt(lx + 34, 584, "Chuỗi nghiệm thu niêm phong (SealRecord → ReceiveRecord)", size=11, bold=True, color=C_SUCCESS))
    p.append(txt(lx + 34, 604, "• Xuất bến Hub gửi: Chụp ảnh cửa thùng xe + quét Seal SL-88421 → phát sự kiện manifest.dispatched.", size=9.6, color="#065F46"))
    p.append(txt(lx + 34, 622, "• Cập bến Hub đích: So khớp Seal 100% trước khi mở bao; sai/đứt seal tự đẩy sang Giám định QA.", size=9.6, color="#065F46"))

    # Right Column (40%): COD Reconciliation & VietQR (payment-service :3011)
    rx = lx + lw + 18
    rw = W - rx - 46
    p.append(rect(rx, 128, rw, 530, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=14))
    p.append(txt(rx + 20, 156, "2. Quyết toán công nợ COD Bưu tá (SePay/VietQR)", size=13.5, bold=True, color=C_TEXT))
    p.append(txt(rx + 20, 175, "Tự động gạch nợ công nợ ca qua Webhook HMAC · Trần tiền mặt 15 triệu", size=9.8, color=C_MUTED))

    # 2 Summary cards
    p.append(rect(rx + 20, 192, (rw - 52) / 2, 68, fill=C_PRIMARY_SOFT, stroke="#93C5FD", sw=1, rx=10))
    p.append(txt(rx + 32, 214, "TỔNG COD PHẢI THU CA", size=9, bold=True, color=C_PRIMARY))
    p.append(txt(rx + 32, 242, "18.650.000 đ", size=16.5, bold=True, color=C_PRIMARY))

    p.append(rect(rx + 32 + (rw - 52) / 2, 192, (rw - 52) / 2, 68, fill=C_SUCCESS_BG, stroke="#6EE7B7", sw=1, rx=10))
    p.append(txt(rx + 44 + (rw - 52) / 2, 214, "ĐÃ ĐỐI SOÁT VIETQR", size=9, bold=True, color=C_SUCCESS))
    p.append(txt(rx + 44 + (rw - 52) / 2, 242, "15.200.000 đ", size=16.5, bold=True, color=C_SUCCESS))

    # Courier COD table
    c_rows = [
        ("Nguyễn Văn A (NV01)", "3.450.000 đ", "Chờ nộp", C_WARN_BG, C_WARN),
        ("Trần Thanh B (NV02)", "6.800.000 đ", "Đã gạch nợ", C_SUCCESS_BG, C_SUCCESS),
        ("Lê Minh C (NV03)", "8.400.000 đ", "Đã gạch nợ", C_SUCCESS_BG, C_SUCCESS),
        ("Phạm Quốc D (NV04)", "0 đ", "Không phát sinh", C_BG, C_MUTED),
    ]
    for i, (cn, amt, st, bg, col) in enumerate(c_rows):
        cy = 276 + i * 44
        p.append(rect(rx + 20, cy, rw - 40, 38, fill="#FAFBFD", stroke=C_BORDER, sw=1, rx=8))
        p.append(txt(rx + 32, cy + 23, cn, size=10.3, bold=True, color=C_TEXT))
        p.append(txt(rx + rw - 134, cy + 23, amt, size=10.5, bold=True, color=C_PRIMARY, align="end"))
        p.append(pill(rx + rw - 122, cy + 8, 92, 22, st, fill=bg, color=col, size=8.8))

    # Dynamic VietQR Card
    p.append(rect(rx + 20, 460, rw - 40, 180, fill="#F8FAFF", stroke="#93C5FD", sw=1.2, rx=12))
    # QR graphic box
    p.append(rect(rx + 36, 480, 128, 128, fill="#FFFFFF", stroke=C_TEXT, sw=1.5, rx=8))
    for qr_r in range(5):
        for qr_c in range(5):
            if (qr_r + qr_c) % 2 == 0 or (qr_r in (0, 4) and qr_c in (0, 4)):
                p.append(rect(rx + 48 + qr_c * 21, 492 + qr_r * 21, 16, 16, fill=C_TEXT, stroke=None, rx=2))
    p.append(txt(rx + 180, 498, "Mã VietQR Quyết toán Lô", size=12, bold=True, color=C_PRIMARY))
    p.append(txt(rx + 180, 520, "Mã lô: SETTLEMENT-0518", size=10.3, bold=True, color=C_TEXT, family=MONO))
    p.append(txt(rx + 180, 540, "Số tiền: 3.450.000 VNĐ", size=11, bold=True, color=C_DANGER))
    p.append(txt(rx + 180, 560, "Cú pháp: COD SETTLEMENT-0518", size=9.6, color=C_MUTED))
    p.append(pill(rx + 180, 578, 176, 26, "SePay Webhook: Tự gạch nợ 30s", fill=C_SUCCESS_BG, color=C_SUCCESS, size=9))

    p.append(zone_footer(W, 692, [
        ("1", "Đóng bao & Kẹp chì Seal", "Gom đơn vào bao MB, khóa SealRecord chống tráo/thất lạc"),
        ("2", "Quét mã chống trùng (Idempotency)", "Đồng bộ sự kiện lên RabbitMQ cập nhật toàn bộ đơn trong bao"),
        ("3", "Đối soát COD tự động VietQR", "Kiểm soát trần tiền mặt 15 triệu & gạch nợ qua SePay Webhook"),
    ]))
    return svg_wrap(W, H, "\n".join(p))


# =============================================================================
# 3. OPS WEB: STRAY INVESTIGATION & 24H CCTV HEARING DRAWER (Hình 4.12)
# =============================================================================
def build_ops_stray_investigation():
    W, H = 1280, 760
    p = []
    p.append(browser_frame(24, 18, W - 48, 658, "https://ops.nexus-ex.site/app/function-groups/service-quality/stray-investigation", "NEXUS Ops — Giám định đơn lạc & CCTV"))

    # Top bar
    p.append(rect(25, 60, W - 50, 52, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    p.append(txt(46, 91, "Chất lượng dịch vụ  >  Giám định đơn lạc & Phân tích chuỗi vết quét (Chain of Custody)", size=13.5, bold=True, color=C_TEXT))
    p.append(pill(W - 266, 74, 220, 26, "Bắt buộc xem toàn cảnh trước phán quyết", fill=C_WARN_BG, color=C_WARN, size=9.2))

    # Left Table Area (54% — Strict Single-Line Table, NO inline verdict buttons per AGENTS.md §4.5!)
    lx, lw = 46, 636
    p.append(rect(lx, 128, lw, 530, fill="#FFFFFF", stroke="#D9DEF3", sw=1.2, rx=12))
    p.append(txt(lx + 18, 156, "Danh sách hồ sơ giám định bất thường (Nhấp dòng để mở Drawer)", size=13, bold=True, color=C_TEXT))

    # 4 Break-point filter pills
    for i, (bp, bg, col) in enumerate([
        ("Tất cả (12)", C_PRIMARY, "#FFFFFF"),
        ("Lưu kho >48h (5)", C_WARN_BG, C_WARN),
        ("Đường trục (3)", C_DANGER_BG, C_DANGER),
        ("Sai luồng (4)", C_PRIMARY_SOFT, C_PRIMARY),
    ]):
        p.append(pill(lx + 18 + i * 148, 170, 138, 25, bp, fill=bg, color=col, size=9.2))

    # Table Header
    p.append(rect(lx + 1, 210, lw - 2, 30, fill="#F8FAFF", stroke="#CBD5E1", sw=1, rx=0))
    for cl, ox in [("MÃ VẬN ĐƠN", 14), ("NHÓM ĐỨT GÃY", 156), ("ĐƠN VỊ TÌNH NGHI", 330), ("TRẠNG THÁI", 494)]:
        p.append(txt(lx + ox, 229, cl, size=9.2, bold=True, color="#1F2B6F"))

    inv_rows = [
        ("SHP-202605-0082", "WAREHOUSE_STALE_LOSS", "Hub HCM02 (88%)", "Đang điều trần 24h", True, C_WARN_BG, C_WARN),
        ("SHP-202605-0079", "LINEHAUL_IN_TRANSIT", "Xe TRIP-HN08 (92%)", "Chờ trích CCTV", False, C_DANGER_BG, C_DANGER),
        ("SHP-202605-0071", "MISROUTED_SORTING", "Mega Hub ĐN (81%)", "Đã tìm thấy (Cứu)", False, C_SUCCESS_BG, C_SUCCESS),
        ("SHP-202605-0064", "LAST_MILE_UNACCOUNTED", "Bưu tá NV09 (95%)", "Chuyển Claims", False, C_PURPLE_BG, C_PURPLE),
        ("SHP-202605-0058", "WAREHOUSE_STALE_LOSS", "Hub HN04 (84%)", "Đang điều trần 24h", False, C_WARN_BG, C_WARN),
    ]
    for ri, (code, bp, susp, st, active, bg, col) in enumerate(inv_rows):
        ry = 240 + ri * 40
        if active:
            p.append(rect(lx + 1, ry, lw - 2, 40, fill="#EFF6FF", stroke="#93C5FD", sw=1.2, rx=0))
        p.append(f'<line x1="{lx+1}" y1="{ry+40}" x2="{lx+lw-1}" y2="{ry+40}" stroke="#E2E8F0" stroke-width="1"/>')
        p.append(txt(lx + 14, ry + 24, code, size=10.3, bold=True, color=C_PRIMARY, family=MONO))
        p.append(txt(lx + 156, ry + 24, bp, size=9.4, bold=True, color=C_TEXT, family=MONO))
        p.append(txt(lx + 330, ry + 24, susp, size=9.8, color=C_MUTED))
        p.append(pill(lx + 492, ry + 9, 130, 22, st, fill=bg, color=col, size=8.8))

    # 4-Stage SOP Legend Box inside bottom of left panel
    p.append(rect(lx + 18, 466, lw - 36, 174, fill="#F8FAFC", stroke=C_BORDER, sw=1, rx=10))
    p.append(txt(lx + 32, 490, "Quy trình 4 giai đoạn khép kín (Không quy chụp vội vàng):", size=11, bold=True, color=C_TEXT))
    sop_steps = [
        ("1. Bắt điểm đứt gãy:", "Audit Engine đối chiếu lịch sử quét Inbound/Outbound và sai lệch cân nặng."),
        ("2. Điều trần 24 giờ (+12h):", "Cho đơn vị tình nghi nộp video CCTV bàn dỡ lưu trên MinIO Object Storage."),
        ("3. Ưu tiên Cứu đơn:", "Rà soát kho tìm lại kiện → chuyển RESOLVED_FOUND, triệt tiêu rủi ro đền bù."),
        ("4. Phán quyết & Claims:", "Quá hạn không chứng minh vô can → tự sinh Hồ sơ Bồi thường bên Claims."),
    ]
    for i, (s1, s2) in enumerate(sop_steps):
        p.append(txt(lx + 32, 514 + i * 28, f"• {s1}", size=9.8, bold=True, color=C_PRIMARY))
        p.append(txt(lx + 188, 514 + i * 28, s2, size=9.5, color=C_MUTED))

    # Right Slide-Over Full-Context Drawer (44%!)
    dx = lx + lw + 16
    dw = W - dx - 46
    p.append(f'<g filter="url(#cardShadow)">{rect(dx, 128, dw, 530, fill="#FFFFFF", stroke="#60A5FA", sw=1.8, rx=14)}</g>')
    p.append(f'<path d="M{dx} 142 Q{dx} 128 {dx+14} 128 H{dx+dw-14} Q{dx+dw} 128 {dx+dw} 142 V186 H{dx} Z" fill="url(#navyGrad)"/>')
    p.append(txt(dx + 20, 154, "HỒ SƠ GIÁM ĐỊNH: SHP-202605-0082", size=13, bold=True, color="#FFFFFF", family=MONO))
    p.append(txt(dx + 20, 174, "Cửa sổ điều trần 24h — Còn lại: 14:28:15 · Độ tin cậy AI: 88%", size=10, color="#FDE68A"))

    # Domino Chain of Custody Timeline
    p.append(txt(dx + 20, 210, "Chuỗi vết quét Domino (Chain of Custody)", size=11.5, bold=True, color=C_TEXT))
    chain = [
        ("✓ 16/05 09:10 · Pickup Scan — Kho Shop 411 (2,4 kg)", C_SUCCESS),
        ("✓ 16/05 14:35 · Inbound Scan — Hub HCM02 (2,4 kg)", C_SUCCESS),
        ("✕ ĐỨT GÃY > 48 GIỜ: Không phát sinh Outbound Scan tại Hub HCM02", C_DANGER),
    ]
    for i, (ct, col) in enumerate(chain):
        cy = 224 + i * 32
        p.append(rect(dx + 20, cy, dw - 40, 26, fill="#FEF2F2" if i == 2 else "#F8FAFC", stroke="#FCA5A5" if i == 2 else C_BORDER, sw=1, rx=6))
        p.append(txt(dx + 30, cy + 17, ct, size=9.6, bold=(i == 2), color=col))

    # MinIO CCTV Evidence Preview Box
    p.append(txt(dx + 20, 340, "Bằng chứng Video CCTV & Biên bản (MinIO S3)", size=11.5, bold=True, color=C_TEXT))
    p.append(rect(dx + 20, 352, dw - 40, 118, fill="#0F172A", stroke=None, rx=10))
    p.append(txt(dx + dw / 2, 404, "▶  CCTV_CAM04_HCM02_16052026_1435.mp4", size=10.5, bold=True, color="#E0F2FE", align="middle", family=MONO))
    p.append(txt(dx + dw / 2, 426, "Bucket: nexus-pod-images/claims-evidence/INV-0082/", size=9.2, color="#93C5FD", align="middle", family=MONO))
    p.append(pill(dx + 34, 438, 156, 22, "Đã nộp biên bản bàn giao", fill="#1E3A8A", color="#FFFFFF", size=8.8))

    # Liability Summary
    p.append(rect(dx + 20, 484, dw - 40, 56, fill="#FFFBEB", stroke="#FCD34D", sw=1, rx=8))
    p.append(txt(dx + 32, 504, "Đơn vị tình nghi #1: Hub HCM02  ·  Đề xuất bồi thường: 1.000.000 đ", size=10, bold=True, color=C_WARN))
    p.append(txt(dx + 32, 524, "Căn cứ: Điều 25 NĐ 47/2011 (Hàng không khai giá — trần 4× cước / 1 triệu)", size=9.2, color="#92400E"))

    # Mandatory Full-Context Action Buttons inside Drawer ONLY
    p.append(rect(dx + 20, 556, (dw - 52) / 2, 38, fill=C_SUCCESS, stroke=None, rx=8))
    p.append(txt(dx + 20 + (dw - 52) / 4, 579, "Đã tìm thấy hàng (Cứu đơn)", size=10.5, bold=True, color="#FFFFFF", align="middle"))
    p.append(rect(dx + 32 + (dw - 52) / 2, 556, (dw - 52) / 2, 38, fill=C_DANGER, stroke=None, rx=8))
    p.append(txt(dx + 32 + (dw - 52) * 3 / 4, 579, "Phán quyết → Claims", size=10.5, bold=True, color="#FFFFFF", align="middle"))
    p.append(rect(dx + 20, 604, dw - 40, 34, fill="#FFFFFF", stroke=C_PRIMARY, sw=1.1, rx=8))
    p.append(txt(dx + dw / 2, 625, "Gia hạn điều trần +12 giờ (Trích xuất CCTV liên Hub)", size=10.2, bold=True, color=C_PRIMARY, align="middle"))

    p.append(zone_footer(W, 692, [
        ("1", "Không đặt nút phán quyết ngoài bảng", "Triệt tiêu bấm nhầm — bắt buộc mở Drawer xem toàn cảnh"),
        ("2", "Chuỗi Domino & CCTV trên MinIO", "Đối chiếu trực tiếp điểm đứt gãy >48h và video camera bàn dỡ"),
        ("3", "Tự động liên kết Claims Liability", "Cứu đơn khi thấy hàng hoặc tự sinh hồ sơ bồi thường sau 24h"),
    ]))
    return svg_wrap(W, H, "\n".join(p))


# =============================================================================
# 4. COURIER MOBILE: NDR REPORT, VIETQR COD & OPS CHAT (Hình 4.14)
# =============================================================================
def build_courier_ndr_cod_chat():
    W, H = 1220, 780
    p = []
    p.append(rect(24, 18, W - 48, 678, fill="#F8FAFC", stroke=C_BORDER, sw=1.2, rx=16))
    p.append(txt(W / 2, 54, "COURIER MOBILE — Xử lý ngoại lệ NDR, Nộp tiền COD VietQR & Chat Ops Realtime", size=16, bold=True, color=C_TEXT, align="middle"))
    p.append(txt(W / 2, 76, "Đồng bộ sự cố giao thất bại tức thì về bưu cục · Gạch nợ tự động qua SePay · Kênh chat WebSocket (/ws/chat)", size=11, color=C_MUTED, align="middle"))

    # PHONE 1: NDR Incident Reporting
    ph1, (sx, sy, sw, sh) = phone_frame(165, 96, 360, 558, "15:10", "Màn hình 3: Báo cáo sự cố giao thất bại (NDR)")
    p.append(ph1)
    p.append(rect(sx, sy + 26, sw, 42, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    p.append(txt(sx + sw / 2, sy + 52, "Báo cáo Giao thất bại (NDR)", size=13, bold=True, color=C_DANGER, align="middle"))

    p.append(rect(sx + 16, sy + 78, sw - 32, 56, fill="#FEF2F2", stroke="#FCA5A5", sw=1, rx=10))
    p.append(txt(sx + 28, sy + 99, "SHP-202605-0015 · Lần giao thất bại thứ 2/3", size=10.5, bold=True, color=C_DANGER, family=MONO))
    p.append(txt(sx + 28, sy + 120, "Đã ghi nhận 3 cuộc gọi liên hệ người nhận theo quy chế", size=9.2, color="#991B1B"))

    p.append(txt(sx + 16, sy + 154, "Chọn lý do chuẩn hóa (masterdata-service):", size=10.5, bold=True, color=C_TEXT))
    reasons = [
        ("●  Không liên lạc được (Thuê bao / Không nghe máy)", True),
        ("○  Người nhận hẹn giao lại khung giờ khác", False),
        ("○  Sai địa chỉ giao hàng / Không tìm thấy số nhà", False),
        ("○  Khách từ chối nhận hàng (Kích hoạt hoàn)", False),
    ]
    for i, (rl, sel) in enumerate(reasons):
        ry = sy + 166 + i * 38
        p.append(rect(sx + 16, ry, sw - 32, 32, fill=C_PRIMARY_SOFT if sel else "#FFFFFF", stroke=C_PRIMARY if sel else C_BORDER, sw=1.1, rx=8))
        p.append(txt(sx + 26, ry + 20, rl, size=9.6, bold=sel, color=C_PRIMARY if sel else C_TEXT))

    # Field evidence photo box
    p.append(txt(sx + 16, sy + 334, "Ảnh minh chứng hiện trường (Bắt buộc):", size=10.5, bold=True, color=C_TEXT))
    p.append(rect(sx + 16, sy + 344, 148, 76, fill="#E2E8F0", stroke=C_BORDER, sw=1, rx=10))
    p.append(txt(sx + 90, sy + 382, "📷 Ảnh trước cửa", size=9.8, bold=True, color=C_TEXT, align="middle"))
    p.append(txt(sx + 90, sy + 398, "MinIO S3 OK", size=8.8, color=C_SUCCESS, align="middle"))
    p.append(rect(sx + 176, sy + 344, 148, 76, fill="#E2E8F0", stroke=C_BORDER, sw=1, rx=10))
    p.append(txt(sx + 250, sy + 382, "📞 Log 3 cuộc gọi", size=9.8, bold=True, color=C_TEXT, align="middle"))
    p.append(txt(sx + 250, sy + 398, "MinIO S3 OK", size=8.8, color=C_SUCCESS, align="middle"))

    p.append(rect(sx + 16, sy + 436, sw - 32, 42, fill=C_DANGER, stroke=None, rx=10))
    p.append(txt(sx + sw / 2, sy + 461, "Gửi báo cáo NDR về Bưu cục", size=12, bold=True, color="#FFFFFF", align="middle"))

    # PHONE 2: VietQR COD Settlement + Ops Realtime Chat
    ph2, (sx2, sy2, sw2, sh2) = phone_frame(695, 96, 360, 558, "17:45", "Màn hình 4: Nộp COD VietQR & Chat Điều phối Ops")
    p.append(ph2)
    p.append(rect(sx2, sy2 + 26, sw2, 42, fill=C_PRIMARY, stroke=None, rx=0))
    p.append(txt(sx2 + sw2 / 2, sy2 + 52, "Quyết toán COD & Trao đổi Ops", size=12.5, bold=True, color="#FFFFFF", align="middle"))

    # COD Settlement VietQR Card
    p.append(rect(sx2 + 16, sy2 + 78, sw2 - 32, 196, fill="#FFFFFF", stroke="#93C5FD", sw=1.2, rx=12))
    p.append(txt(sx2 + 28, sy2 + 99, "Lô quyết toán: SETTLEMENT-0518", size=10.5, bold=True, color=C_PRIMARY, family=MONO))
    p.append(txt(sx2 + 28, sy2 + 120, "3.450.000 VNĐ", size=19, bold=True, color=C_TEXT))
    p.append(pill(sx2 + sw2 - 134, sy2 + 102, 106, 22, "Hạn nộp 23:59", fill=C_WARN_BG, color=C_WARN, size=9))
    # Mini QR
    p.append(rect(sx2 + 28, sy2 + 134, 86, 86, fill="#FFFFFF", stroke=C_TEXT, sw=1.3, rx=6))
    for r in range(4):
        for c in range(4):
            if (r + c) % 2 == 0:
                p.append(rect(sx2 + 36 + c * 18, sy2 + 142 + r * 18, 13, 13, fill=C_TEXT, stroke=None, rx=2))
    p.append(txt(sx2 + 128, sy2 + 154, "Quét mã bằng App ngân hàng", size=10, bold=True, color=C_TEXT))
    p.append(txt(sx2 + 128, sy2 + 172, "Nội dung: COD SETTLEMENT-0518", size=9.2, color=C_MUTED))
    p.append(txt(sx2 + 128, sy2 + 190, "Tự động giải tỏa công nợ về 0đ", size=9.2, color=C_SUCCESS))
    p.append(pill(sx2 + 128, sy2 + 202, 176, 22, "SePay Webhook tự động 100%", fill=C_SUCCESS_BG, color=C_SUCCESS, size=8.8))
    p.append(txt(sx2 + 28, sy2 + 258, "Trần nợ tiền mặt trong ca: 3,45 / 15,0 triệu đ (An toàn)", size=9.3, bold=True, color=C_MUTED))

    # Ops-Courier Realtime Chat Box (/ws/chat + Redis Pub/Sub + chat_db)
    p.append(rect(sx2 + 16, sy2 + 286, sw2 - 32, 198, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=12))
    p.append(txt(sx2 + 28, sy2 + 308, "Chat nội bộ Ops Hub 002C001 (/ws/chat)", size=11, bold=True, color=C_TEXT))
    p.append(rect(sx2 + 28, sy2 + 320, 224, 38, fill=C_BG, stroke=C_BORDER, sw=1, rx=10))
    p.append(txt(sx2 + 38, sy2 + 336, "Ops: Đơn SHP-0015 khách mới hẹn", size=9.5, color=C_TEXT))
    p.append(txt(sx2 + 38, sy2 + 350, "giao lại 18h hôm nay, em giữ nhé.", size=9.5, color=C_TEXT))

    p.append(rect(sx2 + 96, sy2 + 368, 216, 36, fill=C_PRIMARY, stroke=None, rx=10))
    p.append(txt(sx2 + 106, sy2 + 384, "Bưu tá: Dạ rõ, em đã quét giữ kho", size=9.5, color="#FFFFFF"))
    p.append(txt(sx2 + 106, sy2 + 398, "tạm và sẽ nộp COD xong trước 18h.", size=9.5, color="#FFFFFF"))

    p.append(rect(sx2 + 28, sy2 + 414, sw2 - 56, 32, fill=C_BG, stroke=C_BORDER, sw=1, rx=16))
    p.append(txt(sx2 + 42, sy2 + 434, "Nhắn tin cho Điều hành viên...", size=9.6, color=C_MUTED))
    p.append(txt(sx2 + 28, sy2 + 468, "Đồng bộ Redis Pub/Sub (gateway-bff:chat) · Lưu chat_db", size=8.8, color=C_MUTED))

    p.append(zone_footer(W, 712, [
        ("1", "Chuẩn hóa báo cáo NDR", "Gắn lý do chuẩn + ảnh hiện trường → tự đếm 3 lần thất bại"),
        ("2", "Gạch nợ COD tự động VietQR", "Kiểm soát trần 15 triệu & chốt nộp trước 23:59 hằng ngày"),
        ("3", "Chat nội bộ thời gian thực", "Kết nối WebSocket /ws/chat + Redis Pub/Sub lưu tại chat_db"),
    ]))
    return svg_wrap(W, H, "\n".join(p))


# =============================================================================
# 5. ADMIN WEB: MOBILE PERMISSION OVERRIDE & 4-TIER HUB/ZONE (Hình 4.16)
# =============================================================================
def build_admin_rbac_hub():
    W, H = 1280, 760
    p = []
    p.append(browser_frame(24, 18, W - 48, 658, "https://admin.nexus-ex.site/app/mobile-permissions", "NEXUS Admin — Phân quyền & Mạng lưới"))

    # Left Sidebar
    p.append(rect(25, 60, 200, 615, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    p.append(txt(42, 92, "Quản trị hệ thống", size=15, bold=True, color=C_TEXT))
    for i, (lbl, act) in enumerate([
        ("Tổng quan", False), ("Tài khoản Ops/Shipper", False), ("Phân quyền Mobile", True),
        ("Mạng lưới Hub (4 cấp)", False), ("Phân vùng Zone", False), ("Nhật ký Audit Log", False),
    ]):
        ny = 122 + i * 40
        if act:
            p.append(rect(36, ny, 178, 32, fill="#EEF2FF", stroke="#818CF8", sw=1.2, rx=8))
            p.append(txt(48, ny + 20, lbl, size=11, bold=True, color="#3730A3"))
        else:
            p.append(txt(48, ny + 20, lbl, size=10.8, color=C_MUTED))

    # Left Main Card: Mobile Permission Profile & Override Matrix (auth-service :3010)
    mx, lw = 244, 520
    p.append(rect(mx, 76, lw, 582, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=12))
    p.append(txt(mx + 18, 104, "1. Ma trận Phân quyền Di động (Profile & Override)", size=14, bold=True, color=C_TEXT))
    p.append(txt(mx + 18, 122, "Thu hồi tức thì qua Opaque Token Introspect — Không cần đổi vai trò gốc", size=9.8, color=C_MUTED))

    # Role selector + User override bar
    p.append(pill(mx + 18, 138, 142, 26, "Nhóm: COURIER", fill=C_PRIMARY, color="#FFFFFF", size=9.8))
    p.append(pill(mx + 170, 138, 132, 26, "Nhóm: OPS_SCAN", fill=C_BG, color=C_MUTED, size=9.8))
    p.append(pill(mx + 312, 138, 190, 26, "Ghi đè: NV01 (Override)", fill=C_WARN_BG, color=C_WARN, size=9.5, stroke="#FCD34D"))

    perms = [
        ("SCAN_PICKUP", "Quét nhận hàng tại kho Merchant", True, False),
        ("DELIVERY_POD", "Xác nhận phát hàng & tải ảnh POD", True, False),
        ("REPORT_NDR", "Báo cáo sự cố giao thất bại (NDR)", True, False),
        ("MANIFEST_SEAL", "Đóng bao trung chuyển & kẹp chì Seal", False, True),
        ("VEHICLE_SCAN", "Quét xuất/nhập chuyến xe liên Hub", False, False),
        ("COD_EXCEED_LIMIT", "Ghi đè thu COD vượt hạn mức tạm thời", False, True),
        ("CANCEL_FIELD", "Hủy tác vụ đột xuất ngoài hiện trường", False, False),
    ]
    for i, (pcode, pdesc, default_on, ovr) in enumerate(perms):
        py = 180 + i * 54
        p.append(rect(mx + 18, py, lw - 36, 46, fill="#FFFBEB" if ovr else "#FAFBFD", stroke="#FCD34D" if ovr else C_BORDER, sw=1, rx=9))
        p.append(txt(mx + 30, py + 19, pcode, size=10.3, bold=True, color=C_PRIMARY, family=MONO))
        p.append(txt(mx + 30, py + 36, pdesc, size=9.4, color=C_MUTED))
        if ovr:
            p.append(pill(mx + lw - 186, py + 12, 82, 22, "OVERRIDE", fill=C_WARN_BG, color=C_WARN, size=8.5))
        # Toggle switch
        on = default_on or ovr
        tx = mx + lw - 76
        p.append(rect(tx, py + 12, 42, 22, fill=C_SUCCESS if on else "#CBD5E1", stroke=None, rx=11))
        p.append(f'<circle cx="{tx+31 if on else tx+11}" cy="{py+23}" r="8" fill="#FFFFFF"/>')

    # Audit log strip at bottom of left card
    p.append(rect(mx + 18, 568, lw - 36, 72, fill="#F8FAFC", stroke=C_BORDER, sw=1, rx=8))
    p.append(txt(mx + 30, 590, "AdminAuditLog tự động ghi vết:", size=10, bold=True, color=C_TEXT))
    p.append(txt(mx + 30, 608, "• 15:02 SYSTEM_ADMIN bật override MANIFEST_SEAL cho NV01 (Hiệu lực 24h)", size=9.2, color=C_MUTED))
    p.append(txt(mx + 30, 625, "• Phiên Opaque Token tự cập nhật quyền ở lần gọi API kế tiếp.", size=9.2, color=C_SUCCESS))

    # Right Main Card: 4-Tier Hub Network & Spatial Polygon Zones (masterdata-service :3001)
    rx = mx + lw + 18
    rw = W - rx - 42
    p.append(rect(rx, 76, rw, 582, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=12))
    p.append(txt(rx + 18, 104, "2. Cấu trúc Mạng lưới Hub 4 cấp & Tuyến Đa giác (Zone)", size=13.5, bold=True, color=C_TEXT))
    p.append(txt(rx + 18, 122, "Quản trị cây Hub (masterdata_db) & vùng Spatial Polygon phục vụ điều phối tự động", size=9.6, color=C_MUTED))

    # Mini Geofence Map Card
    p.append(rect(rx + 18, 140, rw - 36, 210, fill="#EFF6FF", stroke="#93C5FD", sw=1.2, rx=12))
    # Decorative grid lines + Spatial Polygon zones
    for gx_off in range(40, int(rw - 40), 55):
        p.append(f'<line x1="{rx+18+gx_off}" y1="140" x2="{rx+18+gx_off}" y2="350" stroke="#DBEAFE" stroke-width="1"/>')
    for gy_off in range(35, 210, 42):
        p.append(f'<line x1="{rx+18}" y1="{140+gy_off}" x2="{rx+rw-18}" y2="{140+gy_off}" stroke="#DBEAFE" stroke-width="1"/>')
    # 3 Spatial Polygons
    p.append(f'<polygon points="{rx+56},178 {rx+196},162 {rx+214},256 {rx+84},274" fill="#3B82F6" fill-opacity="0.22" stroke="{C_PRIMARY}" stroke-width="2"/>')
    p.append(txt(rx + 134, 224, "ZONE-HCM-Q1/Q3", size=9.5, bold=True, color=C_PRIMARY, align="middle"))
    p.append(f'<polygon points="{rx+214},170 {rx+376},184 {rx+392},290 {rx+224},266" fill="#10B981" fill-opacity="0.22" stroke="{C_SUCCESS}" stroke-width="2"/>')
    p.append(txt(rx + 302, 232, "ZONE-THUDUC", size=9.5, bold=True, color=C_SUCCESS, align="middle"))
    p.append(f'<circle cx="{rx+198}" cy="242" r="9" fill="{C_DANGER}" stroke="#FFFFFF" stroke-width="2"/>')
    p.append(pill(rx + 32, 316, 224, 22, "● Mega Hub 002C001 (Bán kính phủ 25km)", fill="#FFFFFF", color=C_TEXT, size=8.8))

    # 4-Tier Hub Hierarchy Cards
    tiers = [
        ("Cấp 1 · Mega Hub (3)", "Hà Nội · Đà Nẵng · TP.HCM — Cửa ngõ liên miền", C_PRIMARY),
        ("Cấp 2 · Regional Hub (6)", "Trung tâm gom tuyến cụm tỉnh khu vực", "#0284C7"),
        ("Cấp 3 · Provincial Hub (12)", "Bưu cục cấp tỉnh/thành phố điều phối quận huyện", C_SUCCESS),
        ("Cấp 4 · Local Post Office (17)", "Bưu cục cơ sở quản lý trực tiếp bưu tá chặng cuối", C_WARN),
    ]
    for i, (t1, t2, col) in enumerate(tiers):
        ty = 368 + i * 68
        p.append(rect(rx + 18, ty, rw - 36, 58, fill="#FAFBFD", stroke=C_BORDER, sw=1, rx=10))
        p.append(rect(rx + 18, ty, 6, 58, fill=col, stroke=None, rx=3))
        p.append(txt(rx + 34, ty + 23, t1, size=11.2, bold=True, color=col))
        p.append(txt(rx + 34, ty + 43, t2, size=9.6, color=C_MUTED))

    p.append(zone_footer(W, 692, [
        ("1", "Phân quyền Mobile động", "Bật/tắt thao tác theo nhóm hoặc ghi đè riêng từng nhân sự"),
        ("2", "Bản đồ đa giác Spatial Polygon", "Cố định tọa độ kho Merchant giúp tự động phân tuyến chính xác"),
        ("3", "Quản trị cây Hub 4 cấp", "Chuẩn hóa danh mục nền tảng tại masterdata-service"),
    ]))
    return svg_wrap(W, H, "\n".join(p))


# =============================================================================
# 6. CUSTOMER MOBILE: CREATE ORDER IATA & LIVE TIMELINE (Hình 4.18)
# =============================================================================
def build_customer_order_timeline():
    W, H = 1220, 780
    p = []
    p.append(rect(24, 18, W - 48, 678, fill="#F8FAFC", stroke=C_BORDER, sw=1.2, rx=16))
    p.append(txt(W / 2, 54, "CUSTOMER MOBILE — Tạo đơn cá nhân tính cước IATA & Chi tiết Hành trình Timeline", size=16, bold=True, color=C_TEXT, align="middle"))
    p.append(txt(W / 2, 76, "Đồng bộ động cơ định giá pricing-service (:3012) & Read Model hành trình tracking-service (:3008)", size=11, color=C_MUTED, align="middle"))

    # PHONE 1: Create Order + IATA Calculator
    ph1, (sx, sy, sw, sh) = phone_frame(165, 96, 360, 558, "10:15", "Màn hình 3: Tạo đơn cá nhân & Ước tính cước IATA")
    p.append(ph1)
    p.append(rect(sx, sy + 26, sw, 42, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    p.append(txt(sx + sw / 2, sy + 52, "Tạo đơn gửi bưu phẩm", size=13, bold=True, color=C_TEXT, align="middle"))

    # Sender / Receiver compact card
    p.append(rect(sx + 16, sy + 78, sw - 32, 92, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=12))
    p.append(txt(sx + 28, sy + 99, "● Gửi từ: Sổ địa chỉ mặc định (Q.1, TP.HCM)", size=9.8, bold=True, color=C_PRIMARY))
    p.append(txt(sx + 28, sy + 122, "● Giao đến: Lê Minh — Cầu Giấy, Hà Nội", size=9.8, bold=True, color=C_SUCCESS))
    p.append(pill(sx + 28, sy + 136, 174, 22, "Tuyến: Trục chính (+7.000đ)", fill=C_PRIMARY_SOFT, color=C_PRIMARY, size=9))

    # Weight & 3D Dimensions
    p.append(rect(sx + 16, sy + 180, sw - 32, 114, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=12))
    p.append(txt(sx + 28, sy + 202, "Thông số bưu kiện & Quy đổi IATA", size=10.8, bold=True, color=C_TEXT))
    p.append(txt(sx + 28, sy + 224, "Cân nặng: 1,5 kg   |   D×R×C: 30 × 20 × 15 cm", size=9.6, color=C_MUTED))
    p.append(rect(sx + 28, sy + 236, sw - 56, 26, fill=C_PRIMARY_SOFT, stroke=None, rx=6))
    p.append(txt(sx + 38, sy + 253, "Trọng lượng tính cước: max(1,5; 1,5) = 1,5 kg", size=9.5, bold=True, color=C_PRIMARY))
    p.append(txt(sx + 28, sy + 280, "Thu hộ COD: 0 đ   ·   Hàng thông thường", size=9.4, color=C_MUTED))

    # 3 Service tier cards
    for i, (s_name, s_eta, s_fee, sel) in enumerate([
        ("Giao Tiết kiệm", "3–4 ngày", "25.000 đ", False),
        ("Giao Tiêu chuẩn", "2–3 ngày", "35.000 đ", True),
        ("Giao Hỏa tốc", "Trong 24h", "57.000 đ", False),
    ]):
        ry = sy + 306 + i * 44
        p.append(rect(sx + 16, ry, sw - 32, 38, fill="#EFF6FF" if sel else "#FFFFFF", stroke=C_PRIMARY if sel else C_BORDER, sw=1.4 if sel else 1, rx=10))
        p.append(txt(sx + 28, ry + 17, s_name, size=10.5, bold=True, color=C_PRIMARY if sel else C_TEXT))
        p.append(txt(sx + 28, ry + 31, f"Dự kiến: {s_eta}", size=8.8, color=C_MUTED))
        p.append(txt(sx + sw - 28, ry + 24, s_fee, size=12, bold=True, color=C_PRIMARY if sel else C_TEXT, align="end"))

    p.append(rect(sx + 16, sy + 448, sw - 32, 42, fill=C_PRIMARY, stroke=None, rx=10))
    p.append(txt(sx + sw / 2, sy + 473, "Tạo đơn hàng (35.000 đ)", size=12, bold=True, color="#FFFFFF", align="middle"))

    # PHONE 2: Live Tracking Timeline (tracking-service :3008)
    ph2, (sx2, sy2, sw2, sh2) = phone_frame(695, 96, 360, 558, "10:16", "Màn hình 4: Chi tiết Hành trình & Ảnh POD")
    p.append(ph2)
    p.append(rect(sx2, sy2 + 26, sw2, 42, fill=C_PRIMARY, stroke=None, rx=0))
    p.append(txt(sx2 + sw2 / 2, sy2 + 52, "Hành trình SHP-202605-0018", size=12.5, bold=True, color="#FFFFFF", align="middle"))

    # Current Status Banner
    p.append(rect(sx2 + 16, sy2 + 78, sw2 - 32, 66, fill=C_SUCCESS_BG, stroke="#6EE7B7", sw=1, rx=12))
    p.append(txt(sx2 + 28, sy2 + 100, "✓  GIAO HÀNG THÀNH CÔNG", size=11.5, bold=True, color=C_SUCCESS))
    p.append(txt(sx2 + 28, sy2 + 118, "Người nhận đã ký nhận lúc 10:12 · 18/05/2026", size=9.4, color="#065F46"))
    p.append(txt(sx2 + 28, sy2 + 133, "Dữ liệu Read Model tracking_db (32 ms)", size=8.8, color="#047857"))

    # Vertical Timeline Milestones
    events = [
        ("10:12 · Giao thành công (Có ảnh POD & OTP)", "Q.3, TP.HCM · Bưu tá NV01", True),
        ("08:05 · Đang đi phát chặng cuối", "Bưu cục phát Quận 3 (002P003)", False),
        ("05:40 · Đã gỡ bao & chia chọn", "Mega Hub TP.HCM (002C001)", False),
        ("22:15 · Xe trung chuyển xuất bến", "Bao MB-202605-09 · Seal SL-88421", False),
        ("16:30 · Đã lấy hàng thành công", "Kho người gửi Q.1, TP.HCM", False),
    ]
    for i, (e1, e2, top) in enumerate(events):
        ey = sy2 + 164 + i * 48
        p.append(f'<circle cx="{sx2+32}" cy="{ey}" r="6" fill="{C_SUCCESS if top else C_PRIMARY}"/>')
        if i < len(events) - 1:
            p.append(f'<line x1="{sx2+32}" y1="{ey+6}" x2="{sx2+32}" y2="{ey+42}" stroke="#CBD5E1" stroke-width="2"/>')
        p.append(txt(sx2 + 48, ey + 3, e1, size=9.8, bold=top, color=C_SUCCESS if top else C_TEXT))
        p.append(txt(sx2 + 48, ey + 19, e2, size=8.8, color=C_MUTED))

    # POD Thumbnail Card
    p.append(rect(sx2 + 16, sy2 + 404, sw2 - 32, 86, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=12))
    p.append(rect(sx2 + 28, sy2 + 416, 62, 62, fill="#EFF6FF", stroke="#93C5FD", sw=1, rx=8))
    p.append(txt(sx2 + 59, sy2 + 451, "POD", size=11, bold=True, color=C_PRIMARY, align="middle"))
    p.append(txt(sx2 + 102, sy2 + 434, "Ảnh bằng chứng giao hàng (MinIO)", size=10.2, bold=True, color=C_TEXT))
    p.append(txt(sx2 + 102, sy2 + 452, "deliveries/SHP-202605-0018.jpg", size=9, color=C_MUTED, family=MONO))
    p.append(pill(sx2 + 102, sy2 + 460, 124, 20, "Đánh giá bưu tá ★★★★★", fill=C_WARN_BG, color=C_WARN, size=8.5))

    p.append(zone_footer(W, 712, [
        ("1", "Tính cước nhất quán IATA", "Cùng động cơ pricing-service cho 3 gói Tiết kiệm/Tiêu chuẩn/Hỏa tốc"),
        ("2", "Timeline Read Model tốc độ cao", "Truy vấn trực tiếp tracking_db tách tải hoàn toàn khỏi CSDL ghi"),
        ("3", "Minh bạch POD & Đánh giá", "Hiển thị ảnh bàn giao từ MinIO S3 & đánh giá chất lượng bưu tá"),
    ]))
    return svg_wrap(W, H, "\n".join(p))


# =============================================================================
# 7. GUEST WEB: PUBLIC TRACKING RESULT & IATA CALCULATOR (Hình 4.20)
# =============================================================================
def build_guest_tracking_pricing():
    W, H = 1280, 760
    p = []
    p.append(browser_frame(24, 18, W - 48, 658, "https://tracking.nexus-ex.site/track/SHP-202605-0018", "NEXUS Public — Tra cứu & Tính cước"))

    # Header
    p.append(rect(25, 60, W - 50, 54, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    p.append(rect(50, 73, 28, 28, fill=C_PRIMARY, stroke=None, rx=6))
    p.append(txt(64, 92, "NX", size=10.5, bold=True, color="#FFFFFF", align="middle"))
    p.append(txt(86, 92, "NEXUS EXPRESS", size=14, bold=True, color=C_PRIMARY))
    p.append(txt(260, 92, "Tra cứu hành trình công khai (Ẩn dữ liệu PII nhạy cảm theo NĐ 13/2023)", size=11, color=C_MUTED))
    p.append(pill(W - 210, 73, 160, 28, "Nâng cấp tài khoản KH", fill=C_PRIMARY, color="#FFFFFF", size=10))

    # Left Column (56%): Public Tracking Result
    lx, lw = 50, 680
    p.append(rect(lx, 130, lw, 528, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=14))
    p.append(txt(lx + 20, 158, "Kết quả tra cứu vận đơn: SHP-202605-0018", size=14.5, bold=True, color=C_PRIMARY, family=MONO))
    p.append(pill(lx + lw - 156, 140, 136, 24, "ĐANG GIAO HÀNG", fill=C_SUCCESS_BG, color=C_SUCCESS, size=9.5))

    # Horizontal Progress Stepper (5 stages)
    p.append(rect(lx + 20, 178, lw - 40, 88, fill="#F8FAFF", stroke="#BFDBFE", sw=1, rx=12))
    stages = ["Khởi tạo", "Đã lấy hàng", "Trung chuyển", "Đang đi phát", "Hoàn tất"]
    for i, stg in enumerate(stages):
        sx_st = lx + 78 + i * 130
        done = i < 4
        p.append(f'<circle cx="{sx_st}" cy="212" r="11" fill="{C_SUCCESS if i == 3 else (C_PRIMARY if done else "#CBD5E1")}"/>')
        p.append(txt(sx_st, 216, "✓" if i < 3 else ("●" if i == 3 else "5"), size=10, bold=True, color="#FFFFFF", align="middle"))
        if i < 4:
            p.append(f'<line x1="{sx_st+11}" y1="212" x2="{sx_st+119}" y2="212" stroke="{C_PRIMARY if i < 3 else "#CBD5E1"}" stroke-width="2.5"/>')
        p.append(txt(sx_st, 244, stg, size=10, bold=(i == 3), color=C_SUCCESS if i == 3 else C_TEXT, align="middle"))

    # Masked PII Info Strip
    p.append(rect(lx + 20, 280, lw - 40, 52, fill="#FAFBFD", stroke=C_BORDER, sw=1, rx=10))
    p.append(txt(lx + 34, 301, "Tuyến: TP. Hồ Chí Minh  →  Quận 3, TP.HCM  ·  Gói: Giao Tiêu chuẩn", size=10.5, bold=True, color=C_TEXT))
    p.append(txt(lx + 34, 320, "Người nhận: Nguyễn *** Quân (0909***114)  ·  Khối lượng tính cước: 5,0 kg (IATA)", size=9.6, color=C_MUTED))

    # Timeline list
    t_events = [
        ("18/05 09:30", "Bưu tá đang trên đường giao kiện hàng", "Bưu cục phát Quận 3 (002P003)", True),
        ("18/05 06:15", "Kiện hàng đã gỡ bao & phân tuyến phát", "Mega Hub TP.HCM (002C001)", False),
        ("17/05 21:40", "Đã nhập kho trung tâm khai thác", "Mega Hub TP.HCM (002C001)", False),
        ("17/05 16:20", "Bưu tá đã thu gom hàng tại kho người gửi", "Bưu cục Quận 1 (002P001)", False),
        ("17/05 14:05", "Vận đơn được khởi tạo trên hệ thống", "Cổng Đối tác Merchant", False),
    ]
    for i, (tm, desc, hub, top) in enumerate(t_events):
        ty = 356 + i * 56
        p.append(txt(lx + 26, ty + 14, tm, size=10, bold=True, color=C_PRIMARY if top else C_MUTED, family=MONO))
        p.append(f'<circle cx="{lx+124}" cy="{ty+10}" r="6" fill="{C_SUCCESS if top else C_PRIMARY}"/>')
        if i < len(t_events) - 1:
            p.append(f'<line x1="{lx+124}" y1="{ty+16}" x2="{lx+124}" y2="{ty+60}" stroke="#CBD5E1" stroke-width="2"/>')
        p.append(txt(lx + 144, ty + 14, desc, size=10.8, bold=top, color=C_SUCCESS if top else C_TEXT))
        p.append(txt(lx + 144, ty + 31, hub, size=9.6, color=C_MUTED))

    # Right Column (40%): Interactive IATA Calculator Widget (Guest -> 1-click Create Order)
    rx = lx + lw + 18
    rw = W - rx - 50
    p.append(rect(rx, 130, rw, 528, fill="#FFFFFF", stroke="#93C5FD", sw=1.4, rx=14))
    p.append(f'<path d="M{rx} 144 Q{rx} 130 {rx+14} 130 H{rx+rw-14} Q{rx+rw} 130 {rx+rw} 144 V184 H{rx} Z" fill="url(#brandGrad)"/>')
    p.append(txt(rx + 20, 163, "Công cụ Ước tính cước chuẩn IATA (V/6000)", size=13, bold=True, color="#FFFFFF"))

    g_fields = [
        ("Tỉnh/TP gửi → Tỉnh/TP nhận", "TP. Hồ Chí Minh  →  TP. Hà Nội (Trục chính)"),
        ("Khối lượng thực tế (kg)", "2,0 kg"),
        ("Kích thước Dài × Rộng × Cao (cm)", "40 × 30 × 20 cm  →  Thể tích: 4,0 kg"),
    ]
    for i, (gl, gv) in enumerate(g_fields):
        gy = 200 + i * 62
        p.append(txt(rx + 20, gy + 12, gl, size=9.8, bold=True, color=C_MUTED))
        p.append(rect(rx + 20, gy + 18, rw - 40, 34, fill=C_BG, stroke=C_BORDER, sw=1, rx=8))
        p.append(txt(rx + 32, gy + 39, gv, size=10.5, bold=True, color=C_TEXT))

    # Formula callout
    p.append(rect(rx + 20, 392, rw - 40, 44, fill="#EFF6FF", stroke="#93C5FD", sw=1, rx=8))
    p.append(txt(rx + 32, 410, "W tính cước = max(2,0 kg; 40×30×20 / 6000) = 4,0 kg", size=10, bold=True, color=C_PRIMARY))
    p.append(txt(rx + 32, 427, "Phụ phí vùng Trục chính HN–HCM: +7.000 VNĐ", size=9.2, color=C_MUTED))

    # 3 Live Quote Results
    q_res = [
        ("Giao Tiết kiệm (3–4 ngày)", "39.000 đ", C_SUCCESS),
        ("Giao Tiêu chuẩn (2–3 ngày)", "55.000 đ", C_PRIMARY),
        ("Giao Hỏa tốc (Trong 24h)", "97.000 đ", C_WARN),
    ]
    for i, (ql, qv, col) in enumerate(q_res):
        qy = 450 + i * 44
        p.append(rect(rx + 20, qy, rw - 40, 36, fill="#FAFBFD", stroke=C_BORDER, sw=1, rx=8))
        p.append(txt(rx + 32, qy + 22, ql, size=10.5, bold=True, color=C_TEXT))
        p.append(txt(rx + rw - 32, qy + 23, qv, size=12.5, bold=True, color=col, align="end"))

    p.append(rect(rx + 20, 594, rw - 40, 44, fill=C_PRIMARY, stroke=None, rx=10))
    p.append(txt(rx + rw / 2, 620, "Chuyển thông tin sang Tạo đơn ngay →", size=11.5, bold=True, color="#FFFFFF", align="middle"))

    p.append(zone_footer(W, 692, [
        ("1", "Tra cứu công khai bảo vệ PII", "Che ẩn một phần họ tên/SĐT người nhận theo NĐ 13/2023"),
        ("2", "Tính cước IATA V/6000 trực tiếp", "Hiển thị tường minh trọng lượng thể tích & 3 gói dịch vụ"),
        ("3", "Chuyển tiếp Tạo đơn 1 chạm", "Giữ nguyên tham số đã nhập khi khách chuyển sang tạo đơn"),
    ]))
    return svg_wrap(W, H, "\n".join(p))


def render_png(svg_path):
    txt_svg = open(svg_path, encoding="utf-8").read()
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', txt_svg)
    w, h = int(float(m.group(1))), int(float(m.group(2)))
    png_path = svg_path.replace(".svg", ".png")
    subprocess.run(
        [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            f"--window-size={w},{h}",
            "--force-device-scale-factor=2",
            f"--screenshot={os.path.abspath(png_path)}",
            f"file://{os.path.abspath(svg_path)}",
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print(f"[OK] {svg_path} -> {png_path} ({w}x{h}@2x, {os.path.getsize(png_path)//1024} KB)")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    builders = [
        ("ui-merchant-create-and-list.svg", build_merchant_create_and_list),
        ("ui-ops-manifest-cod.svg", build_ops_manifest_cod),
        ("ui-ops-stray-investigation.svg", build_ops_stray_investigation),
        ("ui-courier-ndr-cod-chat.svg", build_courier_ndr_cod_chat),
        ("ui-admin-rbac-hub.svg", build_admin_rbac_hub),
        ("ui-customer-order-timeline.svg", build_customer_order_timeline),
        ("ui-guest-tracking-pricing.svg", build_guest_tracking_pricing),
    ]
    for fname, fn in builders:
        out_svg = os.path.join(OUT_DIR, fname)
        with open(out_svg, "w", encoding="utf-8") as f:
            f.write(fn())
        render_png(out_svg)


if __name__ == "__main__":
    main()
