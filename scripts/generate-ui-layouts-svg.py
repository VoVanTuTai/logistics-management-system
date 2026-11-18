#!/usr/bin/env python3
"""
Generate 6 Studio-Grade Brand UI Layout Blueprints (SVG + 2x PNG) directly aligned
with the real React Web & React Native/Expo codebase of Nexus Express System:
  1. ui-merchant-web-layout.{svg,png}    (Hình 4.8  - merchant-web :5174)
  2. ui-ops-web-layout.{svg,png}         (Hình 4.9  - ops-web :5173)
  3. ui-courier-mobile-layout.{svg,png}  (Hình 4.10 - courier-mobile Expo APK)
  4. ui-admin-web-layout.{svg,png}       (Hình 4.11 - admin-web :5175)
  5. ui-customer-mobile-layout.{svg,png} (Hình 4.12 - customer-mobile Expo APK)
  6. ui-guest-web-layout.{svg,png}       (Hình 4.13 - guest-web :5177)
"""

import html
import os
import re
import subprocess

OUT_DIR = "docs/architecture/diagrams"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONT = "'Manrope','Inter','Helvetica Neue',Arial,sans-serif"

# Shared Nexus Express Brand Palette (from ops-web/theme.css & courier-mobile/colors.ts)
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


def esc(s):
    return html.escape(str(s), quote=True)


def txt(x, y, s, size=12, bold=False, color=C_TEXT, align="start", family=FONT):
    w = "700" if bold else "500"
    return (
        f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
        f'font-weight="{w}" fill="{color}" text-anchor="{align}">{esc(s)}</text>'
    )


def rect(x, y, w, h, fill=C_SURFACE, stroke=C_BORDER, sw=1.2, rx=10, dashed=False, opacity=1.0):
    da = ' stroke-dasharray="5,4"' if dashed else ""
    op = f' opacity="{opacity}"' if opacity < 1.0 else ""
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ' stroke="none"'
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{st}{da}{op}/>'


def pill(x, y, w, h, label_str, fill=C_PRIMARY_SOFT, color=C_PRIMARY, size=10.5, bold=True, stroke=None):
    return (
        rect(x, y, w, h, fill=fill, stroke=stroke, sw=1, rx=h / 2)
        + txt(x + w / 2, y + h / 2 + size * 0.35, label_str, size=size, bold=bold, color=color, align="middle")
    )


def svg_wrap(w, h, inner, defs=""):
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
    {defs}
  </defs>
  <rect width="{w}" height="{h}" fill="#FFFFFF"/>
  {inner}
</svg>'''


def browser_frame(x, y, w, h, url, tab_title):
    out = []
    # Outer frame
    out.append(f'<g filter="url(#cardShadow)">{rect(x, y, w, h, fill=C_BG, stroke="#CBD5E1", sw=1.5, rx=14)}</g>')
    # Top chrome bar
    out.append(f'<path d="M{x} {y+14} Q{x} {y} {x+14} {y} H{x+w-14} Q{x+w} {y} {x+w} {y+14} V{y+42} H{x} Z" fill="#EEF2F7" stroke="#CBD5E1" stroke-width="1"/>')
    # Window dots
    for idx, col in enumerate(["#EF4444", "#F59E0B", "#22C55E"]):
        out.append(f'<circle cx="{x+22+idx*16}" cy="{y+21}" r="5" fill="{col}"/>')
    # Active tab pill
    out.append(rect(x + 76, y + 8, 236, 26, fill="#FFFFFF", stroke="#CBD5E1", sw=1, rx=7))
    out.append(rect(x + 86, y + 14, 14, 14, fill=C_PRIMARY, stroke=None, rx=3))
    out.append(txt(x + 93, y + 25, "N", size=9.5, bold=True, color="#FFFFFF", align="middle"))
    out.append(txt(x + 108, y + 25, tab_title, size=10.5, bold=True, color=C_TEXT))
    # URL bar
    url_x = x + 324
    url_w = w - 358
    out.append(rect(url_x, y + 9, url_w, 24, fill="#FFFFFF", stroke="#CBD5E1", sw=1, rx=12))
    out.append(txt(url_x + 16, y + 25, f"🔒  {url}", size=10.5, bold=False, color=C_MUTED))
    return "\n".join(out)


def zone_footer(w, y, items):
    """Bottom clean architectural layout annotation strip."""
    out = [rect(24, y, w - 48, 52, fill="#F8FAFC", stroke="#CBD5E1", sw=1.2, rx=10)]
    step = (w - 80) / len(items)
    for i, (badge, title, desc) in enumerate(items):
        bx = 42 + i * step
        out.append(f'<circle cx="{bx+11}" cy="{y+26}" r="11" fill="{C_PRIMARY}"/>')
        out.append(txt(bx + 11, y + 30, badge, size=10.5, bold=True, color="#FFFFFF", align="middle"))
        out.append(txt(bx + 30, y + 22, title, size=10.8, bold=True, color=C_TEXT))
        out.append(txt(bx + 30, y + 38, desc, size=9.6, bold=False, color=C_MUTED))
    return "\n".join(out)


def phone_frame(x, y, w, h, status_time="09:41", subtitle=""):
    out = []
    out.append(f'<g filter="url(#cardShadow)">{rect(x, y, w, h, fill="#0F172A", stroke="#334155", sw=2, rx=34)}</g>')
    # Screen area
    sx, sy, sw, sh = x + 10, y + 10, w - 20, h - 20
    out.append(rect(sx, sy, sw, sh, fill=C_BG, stroke="none", rx=26))
    # Dynamic notch
    out.append(rect(x + w / 2 - 44, sy + 6, 88, 16, fill="#0F172A", stroke=None, rx=8))
    out.append(txt(sx + 20, sy + 18, status_time, size=10, bold=True, color=C_TEXT))
    out.append(txt(sx + sw - 18, sy + 18, "5G  100%", size=9.5, bold=True, color=C_TEXT, align="end"))
    if subtitle:
        out.append(txt(x + w / 2, y + h + 24, subtitle, size=12, bold=True, color=C_TEXT, align="middle"))
    return "\n".join(out), (sx, sy, sw, sh)


# =============================================================================
# 1. MERCHANT WEB (Hình 4.8) — Based on real MerchantSidebar & MerchantDashboardView
# =============================================================================
def build_merchant_web():
    W, H = 1280, 760
    p = []
    p.append(browser_frame(24, 18, W - 48, 658, "https://merchant.nexus-ex.site/dashboard", "NEXUS Express — Merchant Web"))

    # Left Sidebar (x=25..238, y=60..675)
    p.append(rect(25, 60, 214, 615, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    # Brand mark
    p.append(rect(42, 76, 30, 30, fill=C_PRIMARY, stroke=None, rx=7))
    p.append(txt(57, 96, "NX", size=11.5, bold=True, color="#FFFFFF", align="middle"))
    p.append(txt(80, 90, "NEXUS Express", size=14, bold=True, color=C_TEXT))
    p.append(txt(80, 105, "Merchant Portal", size=10, bold=False, color=C_MUTED))

    nav_items = [
        ("Tổng quan", True),
        ("Tạo đơn hàng", False),
        ("Danh sách đơn hàng", False),
        ("Yêu cầu lấy hàng", False),
        ("Tra cứu vận đơn", False),
        ("Đổi thông tin giao", False),
        ("Yêu cầu hoàn hàng", False),
        ("In vận đơn (A6/A7)", False),
        ("Đối soát & COD", False),
        ("Tài khoản & Kho", False),
    ]
    for i, (lbl, active) in enumerate(nav_items):
        ny = 126 + i * 42
        if active:
            p.append(rect(38, ny, 188, 34, fill=C_PRIMARY, stroke=None, rx=8))
            p.append(txt(54, ny + 21, f"▪  {lbl}", size=11.5, bold=True, color="#FFFFFF"))
        else:
            p.append(txt(54, ny + 21, f"◦  {lbl}", size=11.2, bold=False, color=C_MUTED))
    # Bottom logout button
    p.append(rect(38, 620, 188, 34, fill=C_DANGER_BG, stroke="#FECACA", sw=1, rx=8))
    p.append(txt(132, 641, "Đăng xuất", size=11, bold=True, color=C_DANGER, align="middle"))

    # Top content header
    mx = 258
    p.append(rect(239, 60, W - 264, 58, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    p.append(txt(mx, 86, "Tổng quan", size=18, bold=True, color=C_TEXT))
    p.append(txt(mx, 104, "Merchant Portal  >  Tổng quan vận hành", size=10.5, bold=False, color=C_MUTED))
    p.append(rect(W - 365, 74, 210, 32, fill=C_BG, stroke=C_BORDER, sw=1, rx=8))
    p.append(txt(W - 350, 94, "Tìm kiếm mã vận đơn...", size=10.5, color=C_MUTED))
    p.append(f'<circle cx="{W-116}" cy="90" r="15" fill="{C_PRIMARY}"/>')
    p.append(txt(W - 116, 94, "SH", size=10, bold=True, color="#FFFFFF", align="middle"))
    p.append(txt(W - 94, 94, "Shop 411", size=10.5, bold=True, color=C_TEXT))

    # Hero Brand Banner
    p.append(rect(mx, 134, W - mx - 44, 104, fill="url(#brandGrad)", stroke=None, rx=14))
    p.append(txt(mx + 24, 160, "MERCHANT PERFORMANCE", size=10, bold=True, color="#BFDBFE"))
    p.append(txt(mx + 24, 188, "Tổng quan vận hành & Đối soát COD", size=19, bold=True, color="#FFFFFF"))
    p.append(txt(mx + 24, 212, "Theo dõi nhịp đơn, cước IATA (V/6000) và tiền thu hộ COD theo thời gian thực.", size=11, color="#DBEAFE"))
    # Tracking input inside banner
    p.append(rect(W - 392, 168, 224, 38, fill="#1E5AC8", stroke="#60A5FA", sw=1, rx=8))
    p.append(txt(W - 376, 191, "SHP-202605-0018", size=11, color="#E0F2FE"))
    p.append(rect(W - 158, 168, 96, 38, fill="#FFFFFF", stroke=None, rx=8))
    p.append(txt(W - 110, 191, "Tra cứu", size=11.5, bold=True, color=C_PRIMARY, align="middle"))

    # 5 KPI Cards
    kpis = [
        ("TỔNG ĐƠN HÔM NAY", "42", "Tạo mới trong ngày", C_PRIMARY),
        ("ĐƠN CHỜ LẤY HÀNG", "8", "Chờ bưu tá thu gom", C_WARN),
        ("ĐANG TRUNG CHUYỂN", "19", "Qua mạng lưới Hub 4 cấp", C_PRIMARY_LIGHT),
        ("GIAO THÀNH CÔNG", "14", "93,3% tỷ lệ phát đạt", C_SUCCESS),
        ("THẤT BẠI / HOÀN", "1", "Cần xử lý NDR / Hoàn", C_DANGER),
    ]
    kw = (W - mx - 44 - 4 * 14) / 5
    for i, (t1, val, sub, col) in enumerate(kpis):
        kx = mx + i * (kw + 14)
        p.append(rect(kx, 254, kw, 98, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=12))
        p.append(txt(kx + 14, 277, t1, size=9.2, bold=True, color=C_MUTED))
        p.append(txt(kx + 14, 314, val, size=24, bold=True, color=col))
        p.append(txt(kx + 14, 336, sub, size=9.5, color=C_MUTED))

    # Bottom 2 Charts: 7-day Bar Chart (left 62%) + Donut Status (right 35%)
    lw = 602
    p.append(rect(mx, 368, lw, 286, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=12))
    p.append(txt(mx + 18, 394, "7 NGÀY GẦN NHẤT", size=9.5, bold=True, color=C_MUTED))
    p.append(txt(mx + 18, 416, "Sản lượng đơn hàng & Phí vận chuyển", size=14, bold=True, color=C_TEXT))
    p.append(pill(mx + lw - 186, 384, 168, 28, "1.845.000 đ phí tạm tính", fill=C_PRIMARY_SOFT, color=C_PRIMARY, size=10))
    # Bars
    bars = [("T2", 42), ("T3", 58), ("T4", 75), ("T5", 64), ("T6", 118), ("T7", 156), ("CN", 96)]
    base_y = 616
    for i, (day, bh) in enumerate(bars):
        bx = mx + 44 + i * 76
        p.append(rect(bx, base_y - bh, 22, bh, fill="#38BDF8", stroke=None, rx=6))
        p.append(rect(bx + 26, base_y - int(bh * 0.78), 22, int(bh * 0.78), fill=C_PRIMARY, stroke=None, rx=6))
        p.append(txt(bx + 24, base_y + 18, day, size=10.5, bold=True, color=C_MUTED, align="middle"))

    rx_card = mx + lw + 16
    rw = W - rx_card - 44
    p.append(rect(rx_card, 368, rw, 286, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=12))
    p.append(txt(rx_card + 18, 394, "TỶ TRỌNG", size=9.5, bold=True, color=C_MUTED))
    p.append(txt(rx_card + 18, 416, "Trạng thái vận đơn", size=14, bold=True, color=C_TEXT))
    cx, cy = rx_card + rw / 2, 514
    p.append(f'<circle cx="{cx}" cy="{cy}" r="62" fill="none" stroke="#E2E8F0" stroke-width="22"/>')
    p.append(f'<circle cx="{cx}" cy="{cy}" r="62" fill="none" stroke="{C_PRIMARY}" stroke-width="22" stroke-dasharray="220 390" transform="rotate(-90 {cx} {cy})"/>')
    p.append(f'<circle cx="{cx}" cy="{cy}" r="62" fill="none" stroke="{C_SUCCESS}" stroke-width="22" stroke-dasharray="115 390" stroke-dashoffset="-220" transform="rotate(-90 {cx} {cy})"/>')
    p.append(f'<circle cx="{cx}" cy="{cy}" r="62" fill="none" stroke="{C_WARN}" stroke-width="22" stroke-dasharray="55 390" stroke-dashoffset="-335" transform="rotate(-90 {cx} {cy})"/>')
    p.append(txt(cx, cy + 2, "42", size=22, bold=True, color=C_TEXT, align="middle"))
    p.append(txt(cx, cy + 19, "vận đơn", size=10.5, color=C_MUTED, align="middle"))
    p.append(txt(rx_card + 22, 616, "● Đang giao: 19    ● Đã phát: 14    ● Chờ lấy: 8", size=10, color=C_MUTED))

    p.append(zone_footer(W, 692, [
        ("1", "Sidebar cố định (214px)", "Điều hướng 10 phân hệ quản trị shop"),
        ("2", "Banner thương hiệu & Tra cứu", "Định danh NEXUS + tra cứu mã tức thì"),
        ("3", "Khối KPI & Biểu đồ trực quan", "5 thẻ trạng thái + biểu đồ 7 ngày & COD"),
    ]))
    return svg_wrap(W, H, "\n".join(p))


# =============================================================================
# 2. OPS WEB (Hình 4.9) — Based on real ops-web AppShell & DashboardPage
# =============================================================================
def build_ops_web():
    W, H = 1280, 760
    p = []
    p.append(browser_frame(24, 18, W - 48, 658, "https://ops.nexus-ex.site/app/dashboard", "NEXUS Ops Web — Control Tower"))

    # Top Header Bar
    p.append(rect(25, 60, W - 50, 62, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    p.append(rect(46, 74, 34, 34, fill=C_PRIMARY, stroke=None, rx=8))
    p.append(txt(63, 95, "NX", size=11.5, bold=True, color="#FFFFFF", align="middle"))
    p.append(txt(90, 88, "NEXUS VN", size=13, bold=True, color=C_TEXT))
    p.append(txt(90, 103, "NEXUS LOGISTICS CONTROL TOWER", size=9.2, bold=True, color=C_MUTED))
    # Center Tracking Bar
    p.append(rect(386, 75, 420, 34, fill=C_BG, stroke=C_BORDER, sw=1.2, rx=17))
    p.append(txt(406, 96, "🔍  Tra cứu mã vận đơn toàn mạng lưới...", size=11, color=C_MUTED))
    p.append(pill(742, 79, 58, 26, "Tìm", fill=C_PRIMARY, color="#FFFFFF", size=10.5))
    # User badge right
    p.append(rect(W - 320, 75, 190, 34, fill=C_BG, stroke=C_BORDER, sw=1, rx=17))
    p.append(txt(W - 225, 96, "20000002 · Điều Hành Hub", size=10.5, bold=True, color=C_TEXT, align="middle"))
    p.append(rect(W - 118, 75, 76, 34, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=17))
    p.append(txt(W - 80, 96, "Đăng xuất", size=10.5, bold=True, color=C_TEXT, align="middle"))

    # Hero Control Tower Brand Banner
    p.append(rect(46, 138, W - 92, 148, fill="url(#brandGrad)", stroke=None, rx=16))
    p.append(txt(W / 2, 186, "NEXUS EXPRESS SYSTEM", size=26, bold=True, color="#FFFFFF", align="middle"))
    p.append(txt(W / 2, 214, "DIGITIZATION  •  AUTOMATION  •  INTELLIGENCE", size=12.5, bold=True, color="#DBEAFE", align="middle"))
    p.append(txt(W / 2, 238, "Vận hành tập trung Hub 4 cấp, theo dõi chuỗi vết quét thời gian thực và đối soát đa kênh.", size=11.5, color="#BFDBFE", align="middle"))
    # Hub badge inside banner bottom-left
    p.append(rect(68, 224, 152, 46, fill="#1E5AC8", stroke="#60A5FA", sw=1, rx=10))
    p.append(txt(82, 242, "Hub đang theo dõi", size=9.5, color="#BFDBFE"))
    p.append(txt(82, 260, "002C001 · Mega HCM", size=11.5, bold=True, color="#FFFFFF"))

    # Left Main Function Grid (70%)
    gx, gy, gw = 46, 304, 830
    p.append(rect(gx, gy, gw, 352, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=14))
    p.append(txt(gx + 22, gy + 32, "Menu chính — 5 Nhóm Chức năng Khai thác Bưu cục", size=15, bold=True, color=C_TEXT))

    # Big primary left tile: Nền tảng điều hành
    p.append(rect(gx + 22, gy + 50, 250, 280, fill=C_PRIMARY_SOFT, stroke="#BFDBFE", sw=1.4, rx=14))
    p.append(rect(gx + 119, gy + 132, 56, 56, fill="#FFFFFF", stroke="#93C5FD", sw=1.2, rx=14))
    p.append(txt(gx + 147, gy + 167, "⌘", size=24, bold=True, color=C_PRIMARY, align="middle"))
    p.append(txt(gx + 147, gy + 216, "Nền tảng điều hành", size=14.5, bold=True, color=C_TEXT, align="middle"))
    p.append(txt(gx + 147, gy + 238, "Dashboard · Dispatch · Chat Ops", size=10, color=C_MUTED, align="middle"))

    # 4 tiles in 2x2 grid on the right
    tiles = [
        ("Kinh doanh bưu cục", "Tạo đơn tại quầy · Yêu cầu lấy · Đối soát COD", "📍"),
        ("Vận chuyển tuyến", "Đóng bao MB · Seal · Quét xe đi/đến Hub", "🚚"),
        ("Chỉ số vận hành", "KPI sản lượng · Tỷ lệ SLA · Tồn kho quá hạn", "📊"),
        ("Chất lượng dịch vụ", "Xử lý NDR · Hoàn hàng · Giám định đơn lạc", "🛡"),
    ]
    tw, th = 256, 132
    for idx, (t_title, t_sub, ico) in enumerate(tiles):
        r, c = divmod(idx, 2)
        tx = gx + 290 + c * (tw + 16)
        ty = gy + 50 + r * (th + 16)
        p.append(rect(tx, ty, tw, th, fill="#FAFBFD", stroke=C_BORDER, sw=1.2, rx=14))
        p.append(rect(tx + 106, ty + 18, 44, 44, fill=C_PRIMARY_SOFT, stroke=None, rx=12))
        p.append(txt(tx + 128, ty + 47, ico, size=18, bold=True, color=C_PRIMARY, align="middle"))
        p.append(txt(tx + 128, ty + 84, t_title, size=13, bold=True, color=C_TEXT, align="middle"))
        p.append(txt(tx + 128, ty + 104, t_sub, size=9.2, color=C_MUTED, align="middle"))

    # Right Notification Panel (28%)
    nx, ny, nw = gx + gw + 18, 304, W - (gx + gw + 18) - 46
    p.append(rect(nx, ny, nw, 352, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=14))
    p.append(txt(nx + 18, ny + 32, "Thông báo vận hành", size=15, bold=True, color=C_TEXT))
    notices = [
        ("Ghim · Quan trọng", C_PRIMARY_SOFT, C_PRIMARY, "Hoàn tất đồng bộ Zone mới trước 18:00", "tránh lệch phân tuyến tại khung giờ cao điểm."),
        ("Mới", "#E0F2FE", "#0369A1", "Nhóm Hub HCM01–HCM03 đã kích hoạt", "quy trình quét Inbound/Outbound có khóa lũy đẳng."),
        ("Cần xử lý", C_WARN_BG, C_WARN, "Cảnh báo 3 kiện lưu kho > 48h cần đối chiếu", "camera CCTV trong cửa sổ điều trần 24 giờ."),
        ("Tài chính COD", C_SUCCESS_BG, C_SUCCESS, "Phiên đối soát SePay/VietQR hoàn tất", "tự động gạch nợ công nợ ca cho 18 bưu tá."),
    ]
    for i, (tag, bg, col, l1, l2) in enumerate(notices):
        iy = ny + 52 + i * 72
        p.append(pill(nx + 18, iy, 114, 21, tag, fill=bg, color=col, size=9.2))
        p.append(txt(nx + 18, iy + 38, l1, size=10.3, bold=True, color=C_TEXT))
        p.append(txt(nx + 18, iy + 54, l2, size=9.6, color=C_MUTED))

    # Floating Chat/AI FAB
    p.append(f'<circle cx="{W-68}" cy="634" r="22" fill="{C_PRIMARY}" filter="url(#cardShadow)"/>')
    p.append(txt(W - 68, 640, "AI", size=12, bold=True, color="#FFFFFF", align="middle"))

    p.append(zone_footer(W, 692, [
        ("1", "Topbar Control Tower", "Tra cứu vận đơn nhanh + nhận diện ca trực Hub"),
        ("2", "Banner định danh thương hiệu", "Hiển thị mã Hub đang vận hành (4 cấp)"),
        ("3", "5 Nhóm nghiệp vụ & Thông báo", "Phân luồng tác nghiệp kho, tuyến, KPI và QA/CSKH"),
    ]))
    return svg_wrap(W, H, "\n".join(p))


# =============================================================================
# 3. COURIER MOBILE (Hình 4.10) — 2-Phone Layout from courier-mobile HomeScreen & Scan
# =============================================================================
def build_courier_mobile():
    W, H = 1220, 780
    p = []
    # Subtle stage backdrop
    p.append(rect(24, 18, W - 48, 678, fill="#F8FAFC", stroke=C_BORDER, sw=1.2, rx=16))
    p.append(txt(W / 2, 54, "COURIER MOBILE — Ứng dụng Nhân viên Giao nhận (React Native / Expo 54)", size=16.5, bold=True, color=C_TEXT, align="middle"))
    p.append(txt(W / 2, 76, "Tối ưu thao tác một tay ngoài hiện trường · Quét mã vạch Camera · Chụp ảnh POD · Hàng đợi ngoại tuyến (AsyncStorage)", size=11, color=C_MUTED, align="middle"))

    # PHONE 1: Home / Nhiệm vụ (Left)
    ph1_svg, (sx, sy, sw, sh) = phone_frame(165, 96, 360, 558, "09:41", "Màn hình 1: Bảng điều phối & Tác vụ hiện trường")
    p.append(ph1_svg)

    # Navy Brand Header inside Phone 1
    p.append(f'<path d="M{sx} {sy+26} Q{sx} {sy} {sx+26} {sy} H{sx+sw-26} Q{sx+sw} {sy} {sx+sw} {sy+26} V{sy+138} Q{sx+sw} {sy+158} {sx+sw-20} {sy+158} H{sx+20} Q{sx} {sy+158} {sx} {sy+138} Z" fill="url(#navyGrad)"/>')
    # Re-draw white status bar + notch cleanly over dark header
    p.append(rect(165 + 180 - 44, sy + 6, 88, 16, fill="#0F172A", stroke=None, rx=8))
    p.append(txt(sx + 20, sy + 18, "09:41", size=10, bold=True, color="#FFFFFF"))
    p.append(txt(sx + sw - 18, sy + 18, "5G  100%", size=9.5, bold=True, color="#FFFFFF", align="end"))
    p.append(txt(sx + 20, sy + 48, "Xin chào,", size=11, color="#BFDBFE"))
    p.append(txt(sx + 20, sy + 72, "Nguyễn Văn Bưu Tá", size=16, bold=True, color="#FFFFFF"))
    p.append(txt(sx + 20, sy + 92, "Mã NV: 20000001 · Hub 002C001", size=10, color="#93C5FD"))
    p.append(pill(sx + 20, sy + 108, 152, 26, "➤  Sẵn sàng giao nhận", fill="#1E3A8A", color="#FFFFFF", size=10, stroke="#60A5FA"))
    p.append(f'<circle cx="{sx+sw-64}" cy="{sy+54}" r="16" fill="#234585"/>')
    p.append(txt(sx + sw - 64, sy + 59, "QR", size=9.5, bold=True, color="#FFFFFF", align="middle"))
    p.append(f'<circle cx="{sx+sw-26}" cy="{sy+54}" r="16" fill="#234585"/>')
    p.append(txt(sx + sw - 26, sy + 59, "🔔", size=11, color="#FFFFFF", align="middle"))

    # 2 Task KPI Cards
    p.append(rect(sx + 16, sy + 168, 148, 66, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=12))
    p.append(txt(sx + 30, sy + 194, "Đợi lấy", size=10.5, color=C_MUTED))
    p.append(txt(sx + 148, sy + 202, "6", size=20, bold=True, color=C_PRIMARY, align="end"))
    p.append(txt(sx + 30, sy + 220, "Phiếu thu gom", size=9.2, color=C_MUTED))

    p.append(rect(sx + 176, sy + 168, 148, 66, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=12))
    p.append(txt(sx + 190, sy + 194, "Đợi phát", size=10.5, color=C_MUTED))
    p.append(txt(sx + 308, sy + 202, "14", size=20, bold=True, color=C_SUCCESS, align="end"))
    p.append(txt(sx + 190, sy + 220, "Đơn giao chặng cuối", size=9.2, color=C_MUTED))

    # Amber Status Bar
    p.append(rect(sx + 16, sy + 244, sw - 32, 46, fill=C_WARN_BG, stroke="#FCD34D", sw=1, rx=10))
    p.append(txt(sx + 30, sy + 264, "Đơn đang xử lý (ASSIGNED)", size=10.5, bold=True, color=C_WARN))
    p.append(txt(sx + 30, sy + 280, "Công nợ COD ca: 3.450.000 đ / 15.000.000 đ", size=9.2, color="#92400E"))
    p.append(txt(sx + sw - 28, sy + 272, "20", size=15, bold=True, color=C_WARN, align="end"))

    # 9-Icon Custom Apps Grid (exact match to courier-mobile screenshot!)
    p.append(rect(sx + 16, sy + 300, sw - 32, 180, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=12))
    p.append(txt(sx + 28, sy + 322, "Ứng dụng tác nghiệp hiện trường", size=11.5, bold=True, color=C_TEXT))
    actions = [
        ("Nhận hàng", C_SUCCESS_BG, C_SUCCESS), ("Phát hàng", C_PRIMARY_SOFT, C_PRIMARY),
        ("Gửi hàng", C_SUCCESS_BG, C_SUCCESS), ("Hàng đến", C_PRIMARY_SOFT, C_PRIMARY),
        ("Đóng bao", C_WARN_BG, C_WARN), ("Xe đi", C_PRIMARY_SOFT, C_PRIMARY),
        ("Tiền COD", C_PRIMARY_SOFT, C_PRIMARY), ("Theo dõi", C_PRIMARY_SOFT, C_PRIMARY),
    ]
    for idx, (lbl, bg, col) in enumerate(actions):
        r, c = divmod(idx, 4)
        ax = sx + 30 + c * 74
        ay = sy + 334 + r * 68
        p.append(rect(ax + 12, ay, 36, 36, fill=bg, stroke=None, rx=10))
        p.append(txt(ax + 30, ay + 23, lbl[0], size=13, bold=True, color=col, align="middle"))
        p.append(txt(ax + 30, ay + 52, lbl, size=9, bold=True, color=C_TEXT, align="middle"))

    # 5-Tab Bottom Bar with Center Blue Scan FAB
    by = sy + sh - 52
    p.append(rect(sx, by, sw, 52, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    tabs1 = [("Nhiệm vụ", True), ("Thống kê", False), ("Quét mã", False), ("Chat", False), ("Cá nhân", False)]
    for i, (t_lbl, act) in enumerate(tabs1):
        tx = sx + 34 + i * 68
        if i == 2:
            p.append(f'<circle cx="{tx}" cy="{by+14}" r="20" fill="{C_PRIMARY}"/>')
            p.append(txt(tx, by + 19, "[ ]", size=11, bold=True, color="#FFFFFF", align="middle"))
            p.append(txt(tx, by + 46, t_lbl, size=8.8, bold=True, color=C_PRIMARY, align="middle"))
        else:
            p.append(txt(tx, by + 32, t_lbl, size=9.2, bold=act, color=C_PRIMARY if act else C_MUTED, align="middle"))

    # PHONE 2: Scan + POD + Offline Queue (Right)
    ph2_svg, (sx2, sy2, sw2, sh2) = phone_frame(695, 96, 360, 558, "09:42", "Màn hình 2: Quét mã POD & Hàng đợi Ngoại tuyến")
    p.append(ph2_svg)

    # Top bar
    p.append(rect(sx2, sy2 + 26, sw2, 42, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    p.append(txt(sx2 + sw2 / 2, sy2 + 52, "Xác nhận Phát hàng & POD", size=13, bold=True, color=C_TEXT, align="middle"))

    # Offline Queue Sync Banner
    p.append(rect(sx2 + 16, sy2 + 78, sw2 - 32, 44, fill="#ECFDF5", stroke="#6EE7B7", sw=1, rx=10))
    p.append(txt(sx2 + 28, sy2 + 97, "●  Offline Queue (AsyncStorage): Đã đồng bộ", size=10, bold=True, color=C_SUCCESS))
    p.append(txt(sx2 + 28, sy2 + 113, "Tự động phát lại kèm idempotencyKey khi có mạng", size=9, color="#065F46"))

    # Camera Barcode Preview Mockup
    p.append(rect(sx2 + 16, sy2 + 132, sw2 - 32, 134, fill="#0F172A", stroke=None, rx=14))
    p.append(rect(sx2 + 46, sy2 + 154, sw2 - 92, 68, fill="none", stroke="#38BDF8", sw=2, rx=8, dashed=True))
    p.append(txt(sx2 + sw2 / 2, sy2 + 193, "||||  || ||| | ||  ||||", size=18, bold=True, color="#E0F2FE", align="middle"))
    p.append(pill(sx2 + 78, sy2 + 232, sw2 - 156, 22, "SHP-202605-0018 · Hợp lệ", fill=C_SUCCESS, color="#FFFFFF", size=9.5))

    # POD + OTP + COD Card
    p.append(rect(sx2 + 16, sy2 + 278, sw2 - 32, 144, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=12))
    p.append(txt(sx2 + 28, sy2 + 300, "Thông tin bàn giao chặng cuối", size=11.5, bold=True, color=C_TEXT))
    p.append(txt(sx2 + 28, sy2 + 322, "• Người nhận: Trần Minh Quân — Q.3, TP.HCM", size=9.8, color=C_MUTED))
    p.append(txt(sx2 + 28, sy2 + 340, "• Thu hộ COD: 450.000 VNĐ (Tiền mặt / VietQR)", size=9.8, bold=True, color=C_PRIMARY))
    p.append(txt(sx2 + 28, sy2 + 358, "• Ảnh POD: Đã chụp (Tải S3 Presign → MinIO)", size=9.8, color=C_SUCCESS))
    p.append(txt(sx2 + 28, sy2 + 376, "• Xác thực OTP 6 số: [ 4  8  2  9  1  0 ]", size=9.8, bold=True, color=C_TEXT))
    p.append(rect(sx2 + 28, sy2 + 390, 134, 24, fill=C_DANGER_BG, stroke="#FCA5A5", sw=1, rx=6))
    p.append(txt(sx2 + 95, sy2 + 406, "Báo sự cố NDR", size=9.5, bold=True, color=C_DANGER, align="middle"))
    p.append(rect(sx2 + 172, sy2 + 390, 138, 24, fill=C_PRIMARY_SOFT, stroke="#93C5FD", sw=1, rx=6))
    p.append(txt(sx2 + 241, sy2 + 406, "Hiện mã VietQR", size=9.5, bold=True, color=C_PRIMARY, align="middle"))

    # Primary CTA button
    p.append(rect(sx2 + 16, sy2 + 434, sw2 - 32, 42, fill=C_PRIMARY, stroke=None, rx=10))
    p.append(txt(sx2 + sw2 / 2, sy2 + 459, "Xác nhận Phát hàng thành công", size=12, bold=True, color="#FFFFFF", align="middle"))

    # Center connecting arrow between Phone 1 and Phone 2
    p.append(f'<line x1="540" y1="370" x2="678" y2="370" stroke="{C_PRIMARY}" stroke-width="2" stroke-dasharray="6,4"/>')
    p.append(f'<polygon points="682,370 670,364 670,376" fill="{C_PRIMARY}"/>')
    p.append(pill(554, 338, 112, 24, "Chọn tác vụ / Quét", fill=C_PRIMARY_SOFT, color=C_PRIMARY, size=9.5))

    p.append(zone_footer(W, 712, [
        ("1", "Header định danh & Công nợ ca", "Hiển thị mã NV, Hub trực thuộc & hạn mức 15 triệu COD"),
        ("2", "Lưới tác vụ & FAB Quét mã", "Phân quyền động qua MobilePermissionProfile/Override"),
        ("3", "Offline-First (AsyncStorage)", "Lưu hàng đợi khi mất sóng & đồng bộ chống trùng lặp"),
    ]))
    return svg_wrap(W, H, "\n".join(p))


# =============================================================================
# 4. ADMIN WEB (Hình 4.11) — Based on real admin-web AppShell & AdminDashboardPage
# =============================================================================
def build_admin_web():
    W, H = 1280, 760
    p = []
    p.append(browser_frame(24, 18, W - 48, 658, "https://admin.nexus-ex.site/app/dashboard", "NEXUS Admin Portal"))

    # Left Sidebar
    p.append(rect(25, 60, 224, 615, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    p.append(txt(42, 92, "Quản trị hệ thống", size=16.5, bold=True, color=C_TEXT))
    p.append(txt(42, 110, "Cấu hình nền tảng & Danh mục", size=10, color=C_MUTED))
    # User card
    p.append(rect(38, 124, 198, 78, fill=C_BG, stroke=C_BORDER, sw=1, rx=10))
    p.append(txt(50, 145, "10000001", size=12, bold=True, color=C_TEXT))
    p.append(txt(50, 161, "vai trò: SYSTEM_ADMIN", size=9.5, color=C_MUTED))
    p.append(rect(50, 170, 174, 24, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=6))
    p.append(txt(137, 186, "Đăng xuất", size=10, bold=True, color=C_TEXT, align="middle"))

    p.append(txt(42, 226, "DỮ LIỆU DANH MỤC & RBAC", size=9.2, bold=True, color=C_MUTED))
    admin_nav = [
        ("Tổng quan", True),
        ("Tài khoản Ops", False),
        ("Tài khoản Shipper", False),
        ("Tài khoản Merchant", False),
        ("Tài khoản Khách hàng", False),
        ("Phân quyền Mobile", False),
        ("Nhật ký kiểm toán (Audit)", False),
        ("Mạng lưới Hub (4 cấp)", False),
        ("Phân vùng địa lý (Zone)", False),
        ("Lý do NDR & Chính sách", False),
    ]
    for i, (lbl, act) in enumerate(admin_nav):
        ny = 238 + i * 41
        if act:
            p.append(rect(38, ny, 198, 33, fill="#EEF2FF", stroke="#818CF8", sw=1.2, rx=8))
            p.append(txt(52, ny + 21, lbl, size=11.5, bold=True, color="#3730A3"))
        else:
            p.append(txt(52, ny + 21, lbl, size=11.2, color=C_TEXT))

    # Main Content Area
    mx = 270
    # Top KPI strip
    top_kpis = [
        ("TỔNG TÀI KHOẢN", "128", "Ops · Shipper · Merchant · KH"),
        ("MẠNG LƯỚI HUB", "38", "Mega · Regional · Prov · Local"),
        ("PHÂN VÙNG ZONE", "63", "Tuyến đa giác Spatial Polygon"),
        ("MÃ LỖI NDR", "14", "Chuẩn hóa toàn hệ thống"),
    ]
    kw = (W - mx - 46 - 3 * 14) / 4
    for i, (k1, v1, s1) in enumerate(top_kpis):
        kx = mx + i * (kw + 14)
        p.append(rect(kx, 78, kw, 78, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=12))
        p.append(txt(kx + 14, 100, k1, size=9.2, bold=True, color=C_MUTED))
        p.append(txt(kx + 14, 130, v1, size=22, bold=True, color=C_PRIMARY))
        p.append(txt(kx + 14, 148, s1, size=9, color=C_MUTED))

    # Middle row: Account bar chart + Active/Disabled donut
    p.append(rect(mx, 172, 566, 240, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=12))
    p.append(txt(mx + 18, 198, "Cơ cấu tài khoản theo nhóm vai trò", size=14, bold=True, color=C_TEXT))
    p.append(txt(mx + 18, 216, "So sánh quy mô Ops Staff, Courier, Merchant và Customer đang quản trị.", size=10, color=C_MUTED))
    ac_bars = [("Ops Staff", 142, "#4F46E5"), ("Courier", 128, "#0284C7"), ("Merchant", 112, "#D97706"), ("Customer", 92, C_SUCCESS)]
    for i, (lbl, bh, col) in enumerate(ac_bars):
        bx = mx + 46 + i * 124
        p.append(rect(bx, 376 - bh, 74, bh, fill=col, stroke=None, rx=8))
        p.append(txt(bx + 37, 396, lbl, size=10.5, bold=True, color=C_MUTED, align="middle"))

    rx = mx + 584
    rw = W - rx - 46
    p.append(rect(rx, 172, rw, 240, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=12))
    p.append(txt(rx + 18, 198, "Trạng thái tài khoản", size=14, bold=True, color=C_TEXT))
    p.append(txt(rx + 18, 216, "Tỷ lệ đang hoạt động và vô hiệu hóa.", size=10, color=C_MUTED))
    cx, cy = rx + rw / 2, 304
    p.append(f'<circle cx="{cx}" cy="{cy}" r="58" fill="none" stroke="{C_SUCCESS}" stroke-width="24" stroke-dasharray="336 365" transform="rotate(-90 {cx} {cy})"/>')
    p.append(f'<circle cx="{cx}" cy="{cy}" r="58" fill="none" stroke="{C_DANGER}" stroke-width="24" stroke-dasharray="29 365" stroke-dashoffset="-336" transform="rotate(-90 {cx} {cy})"/>')
    p.append(txt(cx, cy + 5, "92%", size=18, bold=True, color=C_TEXT, align="middle"))
    p.append(txt(cx, 395, "■ ACTIVE (118)    ■ DISABLED (10)", size=10, bold=True, color=C_MUTED, align="middle"))

    # Bottom row: Masterdata Health chart
    p.append(rect(mx, 428, W - mx - 46, 226, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=12))
    p.append(txt(mx + 18, 454, "Sức khỏe dữ liệu danh mục nền tảng (Masterdata Health)", size=14, bold=True, color=C_TEXT))
    p.append(txt(mx + 18, 472, "Theo dõi danh mục Hub, Zone, NDR Reason và tham số cấu hình đang kích hoạt.", size=10, color=C_MUTED))
    md_bars = [("Hub (38)", 120, 8), ("Zone (63)", 110, 18), ("NDR Reason (14)", 72, 6), ("Config & Policy (36)", 116, 4)]
    for i, (lbl, act_h, inact_h) in enumerate(md_bars):
        bx = mx + 52 + i * 224
        p.append(rect(bx, 616 - act_h, 118, act_h, fill=C_SUCCESS, stroke=None, rx=6))
        p.append(rect(bx, 616 - act_h - inact_h, 118, inact_h, fill="#F59E0B", stroke=None, rx=4))
        p.append(txt(bx + 59, 636, lbl, size=10.5, bold=True, color=C_MUTED, align="middle"))

    p.append(zone_footer(W, 692, [
        ("1", "Sidebar Quản trị RBAC", "Phân tách quản trị tài khoản, Hub/Zone & Audit Log"),
        ("2", "Giám sát cơ cấu tài khoản", "Theo dõi tức thời tỷ lệ ACTIVE/DISABLED toàn hệ thống"),
        ("3", "Kiểm soát Masterdata & Mobile", "Cấu hình ma trận quyền di động & danh mục bưu chính"),
    ]))
    return svg_wrap(W, H, "\n".join(p))


# =============================================================================
# 5. CUSTOMER MOBILE (Hình 4.12) — 2-Phone Layout from customer-mobile Home & AI Chat
# =============================================================================
def build_customer_mobile():
    W, H = 1220, 780
    p = []
    p.append(rect(24, 18, W - 48, 678, fill="#F8FAFC", stroke=C_BORDER, sw=1.2, rx=16))
    p.append(txt(W / 2, 54, "CUSTOMER MOBILE — Ứng dụng Khách hàng Cá nhân (React Native / Expo 54)", size=16.5, bold=True, color=C_TEXT, align="middle"))
    p.append(txt(W / 2, 76, "Tạo đơn cá nhân · Ước tính cước IATA V/6000 · Tra cứu Timeline thực tế · Trợ lý AI Hybrid RAG (Rich Card)", size=11, color=C_MUTED, align="middle"))

    # PHONE 1: Customer Home Screen
    ph1_svg, (sx, sy, sw, sh) = phone_frame(165, 96, 360, 558, "09:41", "Màn hình 1: Trang chủ, Tạo đơn & Ước tính cước")
    p.append(ph1_svg)

    # Blue Brand Header
    p.append(f'<path d="M{sx} {sy+26} Q{sx} {sy} {sx+26} {sy} H{sx+sw-26} Q{sx+sw} {sy} {sx+sw} {sy+26} V{sy+128} H{sx} Z" fill="url(#brandGrad)"/>')
    p.append(rect(165 + 180 - 44, sy + 6, 88, 16, fill="#0F172A", stroke=None, rx=8))
    p.append(txt(sx + 20, sy + 18, "09:41", size=10, bold=True, color="#FFFFFF"))
    p.append(txt(sx + sw - 18, sy + 18, "5G  100%", size=9.5, bold=True, color="#FFFFFF", align="end"))
    p.append(txt(sx + 20, sy + 50, "NEXUS EXPRESS", size=12, bold=True, color="#BFDBFE"))
    p.append(txt(sx + 20, sy + 74, "Xin chào, Minh Anh", size=16.5, bold=True, color="#FFFFFF"))
    # Search box inside header
    p.append(rect(sx + 16, sy + 88, sw - 32, 32, fill="#FFFFFF", stroke=None, rx=10))
    p.append(txt(sx + 30, sy + 108, "🔍  Nhập mã vận đơn SHP-... để tra cứu", size=10, color=C_MUTED))

    # Promo Banner
    p.append(rect(sx + 16, sy + 140, sw - 32, 74, fill="#EFF6FF", stroke="#93C5FD", sw=1, rx=12))
    p.append(pill(sx + 28, sy + 150, 126, 20, "HỎA TỐC LIÊN TỈNH", fill=C_PRIMARY, color="#FFFFFF", size=8.5))
    p.append(txt(sx + 28, sy + 186, "Đồng giá Tiết kiệm chỉ từ 18.000đ", size=12, bold=True, color=C_TEXT))
    p.append(txt(sx + 28, sy + 202, "Ước tính cước chuẩn IATA tự động trong 1 chạm", size=9.5, color=C_MUTED))

    # 2x2 Quick Actions Grid (exact match to QuickActionsGrid.tsx)
    qas = [
        ("Tạo đơn gửi", "Khởi tạo nhanh", C_PRIMARY_SOFT, C_PRIMARY),
        ("Ước tính cước", "Chuẩn IATA V/6000", "#ECFDF5", C_SUCCESS),
        ("Sổ địa chỉ", "Kho & người nhận", C_WARN_BG, C_WARN),
        ("Trợ lý AI 24/7", "Hỏi đáp & Khiếu nại", "#F3E8FF", "#7C3AED"),
    ]
    for idx, (q1, q2, bg, col) in enumerate(qas):
        r, c = divmod(idx, 2)
        qx = sx + 16 + c * 158
        qy = sy + 226 + r * 72
        p.append(rect(qx, qy, 150, 62, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=12))
        p.append(rect(qx + 10, qy + 13, 34, 34, fill=bg, stroke=None, rx=9))
        p.append(txt(qx + 27, qy + 35, q1[0], size=13, bold=True, color=col, align="middle"))
        p.append(txt(qx + 52, qy + 29, q1, size=11, bold=True, color=C_TEXT))
        p.append(txt(qx + 52, qy + 45, q2, size=8.8, color=C_MUTED))

    # Active Shipment Summary Card
    p.append(rect(sx + 16, sy + 374, sw - 32, 98, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=12))
    p.append(txt(sx + 28, sy + 394, "Vận đơn đang giao gần nhất", size=10.5, bold=True, color=C_MUTED))
    p.append(txt(sx + 28, sy + 414, "SHP-202605-0018", size=12.5, bold=True, color=C_PRIMARY))
    p.append(pill(sx + sw - 122, sy + 398, 96, 22, "Đang giao hàng", fill=C_SUCCESS_BG, color=C_SUCCESS, size=9))
    p.append(txt(sx + 28, sy + 436, "Hub 002C001 (TP.HCM)  →  Q.3, TP.HCM", size=9.8, color=C_TEXT))
    p.append(txt(sx + 28, sy + 456, "Cập nhật: 09:30 · Bưu tá đang trên đường giao", size=9.2, color=C_MUTED))

    # 4-Tab Bottom Navigator (exact match to MainTabNavigator.tsx!)
    by = sy + sh - 52
    p.append(rect(sx, by, sw, 52, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    for i, (tl, act) in enumerate([("Trang chủ", True), ("Đơn hàng", False), ("Tra cứu", False), ("Cá nhân", False)]):
        tx = sx + 42 + i * 85
        p.append(txt(tx, by + 32, tl, size=10, bold=act, color=C_PRIMARY if act else C_MUTED, align="middle"))

    # PHONE 2: AI Assistant Hybrid RAG + Rich Generative UI Card
    ph2_svg, (sx2, sy2, sw2, sh2) = phone_frame(695, 96, 360, 558, "09:42", "Màn hình 2: Trợ lý AI Hybrid RAG & Rich Card")
    p.append(ph2_svg)

    # Chat Header
    p.append(rect(sx2, sy2 + 26, sw2, 46, fill=C_PRIMARY, stroke=None, rx=0))
    p.append(txt(sx2 + 20, sy2 + 48, "Trợ lý AI Nexus Express", size=12.5, bold=True, color="#FFFFFF"))
    p.append(txt(sx2 + 20, sy2 + 63, "Hybrid RAG 3072-D · SSE · Kiểm soát HITL", size=9, color="#BFDBFE"))

    # User bubble
    p.append(rect(sx2 + 78, sy2 + 86, sw2 - 94, 48, fill=C_PRIMARY, stroke=None, rx=14))
    p.append(txt(sx2 + 90, sy2 + 106, "Kiểm tra giúp đơn SHP-202605-0018", size=10, color="#FFFFFF"))
    p.append(txt(sx2 + 90, sy2 + 122, "và nếu hàng vỡ thì bồi thường thế nào?", size=10, color="#FFFFFF"))

    # AI Response Bubble + Rich Shipment Card
    p.append(rect(sx2 + 16, sy2 + 146, sw2 - 32, 272, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=14))
    p.append(txt(sx2 + 28, sy2 + 168, "Đơn SHP-202605-0018 đang giao chặng cuối:", size=10.5, bold=True, color=C_TEXT))

    # Embedded Rich Shipment Card
    p.append(rect(sx2 + 28, sy2 + 180, sw2 - 56, 86, fill=C_BG, stroke="#BFDBFE", sw=1, rx=10))
    p.append(txt(sx2 + 40, sy2 + 200, "SHP-202605-0018 · Giao Tiêu chuẩn", size=10.5, bold=True, color=C_PRIMARY))
    # Progress Stepper dots
    for j, st_lbl in enumerate(["Tạo đơn", "Lấy hàng", "Hub", "Đang giao"]):
        dx = sx2 + 52 + j * 70
        p.append(f'<circle cx="{dx}" cy="{sy2+222}" r="6" fill="{C_PRIMARY if j < 3 else C_SUCCESS}"/>')
        if j < 3:
            p.append(f'<line x1="{dx+6}" y1="{sy2+222}" x2="{dx+64}" y2="{sy2+222}" stroke="{C_PRIMARY}" stroke-width="2"/>')
        p.append(txt(dx, sy2 + 242, st_lbl, size=8.5, bold=True, color=C_MUTED, align="middle"))
    p.append(txt(sx2 + 40, sy2 + 258, "COD: 450.000đ · Dự kiến giao hôm nay", size=9.2, color=C_TEXT))

    # Policy citation text (NĐ 47 & HITL)
    p.append(txt(sx2 + 28, sy2 + 286, "Về bồi thường (Điều 25 NĐ 47/2011/NĐ-CP):", size=10, bold=True, color=C_TEXT))
    p.append(txt(sx2 + 28, sy2 + 303, "• Không khai giá: tối thiểu 4× cước (trần 1 triệu).", size=9.3, color=C_MUTED))
    p.append(txt(sx2 + 28, sy2 + 319, "• Có bảo hiểm khai giá: đền 100% giá trị thực.", size=9.3, color=C_MUTED))
    p.append(txt(sx2 + 28, sy2 + 335, "• Hồ sơ sẽ bàn giao QA thẩm định CCTV (HITL).", size=9.3, color=C_MUTED))
    p.append(pill(sx2 + 28, sy2 + 346, 174, 20, "Nguồn: SOP_02_Claims.md", fill="#F1F5F9", color=C_MUTED, size=8.8))

    # Action Chips
    p.append(pill(sx2 + 28, sy2 + 378, 92, 26, "Hẹn lịch giao", fill=C_PRIMARY_SOFT, color=C_PRIMARY, size=9.2, stroke="#93C5FD"))
    p.append(pill(sx2 + 126, sy2 + 378, 86, 26, "Đổi địa chỉ", fill=C_PRIMARY_SOFT, color=C_PRIMARY, size=9.2, stroke="#93C5FD"))
    p.append(pill(sx2 + 218, sy2 + 378, 92, 26, "Mở khiếu nại", fill=C_WARN_BG, color=C_WARN, size=9.2, stroke="#FCD34D"))

    # Chat input bar
    p.append(rect(sx2 + 16, sy2 + 432, sw2 - 32, 38, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=19))
    p.append(txt(sx2 + 32, sy2 + 455, "Nhập câu hỏi hoặc mã vận đơn...", size=10, color=C_MUTED))
    p.append(f'<circle cx="{sx2+sw2-34}" cy="{sy2+451}" r="14" fill="{C_PRIMARY}"/>')
    p.append(txt(sx2 + sw2 - 34, sy2 + 455, "➤", size=10, bold=True, color="#FFFFFF", align="middle"))

    p.append(f'<line x1="540" y1="370" x2="678" y2="370" stroke="{C_PRIMARY}" stroke-width="2" stroke-dasharray="6,4"/>')
    p.append(f'<polygon points="682,370 670,364 670,376" fill="{C_PRIMARY}"/>')
    p.append(pill(554, 338, 112, 24, "Mở Trợ lý AI SSE", fill="#F3E8FF", color="#7C3AED", size=9.5))

    p.append(zone_footer(W, 712, [
        ("1", "Điều hướng 4 Tab chuẩn C-End", "Trang chủ · Đơn hàng · Tra cứu · Cá nhân (MainTabNavigator)"),
        ("2", "Tiện ích gửi lẻ & IATA", "Tạo đơn cá nhân, ước tính cước V/6000 & sổ địa chỉ"),
        ("3", "Rich Generative UI (SSE)", "Thẻ tiến trình đơn hàng + Action Chips + Trích dẫn SOP"),
    ]))
    return svg_wrap(W, H, "\n".join(p))


# =============================================================================
# 6. GUEST WEB (Hình 4.13) — Based on real guest-web PortalHeader & LogisticsAnimatedBanner
# =============================================================================
def build_guest_web():
    W, H = 1280, 760
    p = []
    p.append(browser_frame(24, 18, W - 48, 658, "https://tracking.nexus-ex.site/", "NEXUS Public Tracking"))

    # Portal Header
    p.append(rect(25, 60, W - 50, 62, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=0))
    p.append(rect(54, 75, 32, 32, fill=C_PRIMARY, stroke=None, rx=8))
    p.append(txt(70, 96, "NX", size=11.5, bold=True, color="#FFFFFF", align="middle"))
    p.append(txt(94, 96, "NEXUS EXPRESS", size=15, bold=True, color=C_PRIMARY))
    for i, nav in enumerate(["Tra cứu vận đơn", "Ước tính cước", "Mạng lưới bưu cục", "Dịch vụ & Chính sách"]):
        p.append(txt(280 + i * 164, 96, nav, size=11.5, bold=(i == 0), color=C_PRIMARY if i == 0 else C_TEXT))
    p.append(pill(W - 236, 75, 88, 32, "Đăng nhập", fill="#FFFFFF", color=C_PRIMARY, size=10.5, stroke=C_PRIMARY))
    p.append(pill(W - 138, 75, 88, 32, "Đăng ký", fill=C_PRIMARY, color="#FFFFFF", size=10.5))

    # Full-width Brand Hero Banner (exact strings from LogisticsAnimatedBanner.tsx!)
    p.append(rect(54, 138, W - 108, 174, fill="url(#brandGrad)", stroke=None, rx=16))
    p.append(pill(80, 158, 290, 24, "⚡ NEXUS EXPRESS • HỎA TỐC LIÊN TỈNH 24H", fill="#1D5BD6", color="#FFFFFF", size=9.5, stroke="#60A5FA"))
    p.append(txt(80, 214, "HẠ TẦNG VẬN TẢI BƯU CHÍNH NEXUS", size=24, bold=True, color="#FFFFFF"))
    p.append(txt(80, 240, "Tra cứu hành trình thời gian thực, ước tính cước IATA (V/6000) và tư vấn AI 24/7 không cần đăng nhập.", size=11.5, color="#DBEAFE"))
    # 3 SLA Badges
    for i, btxt in enumerate(["Lấy Hàng 30 Phút", "Chuẩn SLA 99,4%", "Tuyến Bay Trục 24H"]):
        p.append(pill(80 + i * 168, 262, 154, 28, f"✓  {btxt}", fill="#1649B5", color="#E0F2FE", size=10))

    # Quick Lookup / Pricing Tabs Card (overlapping style below hero)
    p.append(rect(54, 328, 760, 146, fill="#FFFFFF", stroke=C_BORDER, sw=1.3, rx=14))
    p.append(pill(74, 344, 152, 30, "Tra cứu hành trình", fill=C_PRIMARY, color="#FFFFFF", size=10.5))
    p.append(pill(236, 344, 168, 30, "Ước tính cước IATA", fill=C_BG, color=C_MUTED, size=10.5))
    p.append(pill(414, 344, 148, 30, "Tìm bưu cục gần nhất", fill=C_BG, color=C_MUTED, size=10.5))
    # Search input + CTA
    p.append(rect(74, 390, 560, 44, fill=C_BG, stroke="#93C5FD", sw=1.4, rx=10))
    p.append(txt(92, 417, "Nhập mã vận đơn (VD: SHP-202605-0018) hoặc SĐT người nhận...", size=11.5, color=C_MUTED))
    p.append(rect(646, 390, 148, 44, fill=C_PRIMARY, stroke=None, rx=10))
    p.append(txt(720, 417, "Tra cứu ngay", size=12, bold=True, color="#FFFFFF", align="middle"))
    p.append(txt(74, 456, "Kết nối trực tiếp Read Model tracking-service (< 35 ms) — không giới hạn đăng nhập.", size=9.8, color=C_MUTED))

    # 3 Pricing Service Cards below
    svcs = [
        ("Giao Tiết kiệm", "18.000đ / 2kg đầu", "Vượt cân +3.500đ/0,5kg · Tối ưu chi phí SME", C_SUCCESS),
        ("Giao Tiêu chuẩn", "28.000đ / 2kg đầu", "Vượt cân +5.000đ/0,5kg · Cân bằng tốc độ", C_PRIMARY),
        ("Giao Hỏa tốc", "42.000đ / 1kg đầu", "Vượt cân +8.000đ/0,5kg · Ưu tiên tuyến trục", "#D97706"),
    ]
    sw_c = (760 - 2 * 14) / 3
    for i, (s1, s2, s3, col) in enumerate(svcs):
        cx_s = 54 + i * (sw_c + 14)
        p.append(rect(cx_s, 490, sw_c, 164, fill="#FFFFFF", stroke=C_BORDER, sw=1.2, rx=12))
        p.append(rect(cx_s, 490, sw_c, 6, fill=col, stroke=None, rx=3))
        p.append(txt(cx_s + 16, 524, s1, size=13.5, bold=True, color=C_TEXT))
        p.append(txt(cx_s + 16, 554, s2, size=16, bold=True, color=col))
        p.append(txt(cx_s + 16, 582, s3, size=9.5, color=C_MUTED))
        p.append(pill(cx_s + 16, 608, 128, 28, "Tính cước & Tạo đơn", fill=C_BG, color=C_TEXT, size=9.8, stroke=C_BORDER))

    # Right Side Floating AI Assistant Widget (FloatingAiChatWidget.tsx!)
    wx, wy, ww, wh = 834, 328, W - 834 - 54, 326
    p.append(f'<g filter="url(#cardShadow)">{rect(wx, wy, ww, wh, fill="#FFFFFF", stroke="#93C5FD", sw=1.5, rx=14)}</g>')
    p.append(f'<path d="M{wx} {wy+14} Q{wx} {wy} {wx+14} {wy} H{wx+ww-14} Q{wx+ww} {wy} {wx+ww} {wy+14} V{wy+52} H{wx} Z" fill="{C_PRIMARY}"/>')
    p.append(txt(wx + 18, wy + 26, "Trợ lý AI Logistics 24/7", size=12.5, bold=True, color="#FFFFFF"))
    p.append(txt(wx + 18, wy + 42, "Hybrid RAG · SSE Streaming · 4 Công cụ động", size=9.2, color="#BFDBFE"))

    p.append(rect(wx + 16, wy + 66, ww - 32, 42, fill=C_BG, stroke=C_BORDER, sw=1, rx=10))
    p.append(txt(wx + 28, wy + 84, "Xin chào! Bạn cần tra đơn, tính cước IATA", size=10, color=C_TEXT))
    p.append(txt(wx + 28, wy + 99, "hay kiểm tra danh mục hàng cấm gửi?", size=10, color=C_TEXT))

    p.append(rect(wx + 88, wy + 120, ww - 104, 36, fill=C_PRIMARY, stroke=None, rx=10))
    p.append(txt(wx + 100, wy + 142, "Pin lithium có được gửi bay không?", size=10, color="#FFFFFF"))

    p.append(rect(wx + 16, wy + 168, ww - 32, 96, fill="#EFF6FF", stroke="#BFDBFE", sw=1, rx=10))
    p.append(txt(wx + 28, wy + 188, "Theo SOP_03_Prohibited_Goods.md:", size=10, bold=True, color=C_PRIMARY))
    p.append(txt(wx + 28, wy + 206, "• Pin rời > 100Wh bị cấm vận chuyển đường bay.", size=9.5, color=C_TEXT))
    p.append(txt(wx + 28, wy + 222, "• Pin gắn trong thiết bị được đi đường bộ tiêu chuẩn.", size=9.5, color=C_TEXT))
    p.append(pill(wx + 28, wy + 234, 152, 20, "Trích dẫn: SOP #03 · 0,42s", fill="#FFFFFF", color=C_MUTED, size=8.8))

    p.append(rect(wx + 16, wy + 276, ww - 32, 34, fill="#FFFFFF", stroke=C_BORDER, sw=1, rx=17))
    p.append(txt(wx + 30, wy + 297, "Hỏi trợ lý AI Nexus...", size=10, color=C_MUTED))

    p.append(zone_footer(W, 692, [
        ("1", "Header & Hero thương hiệu", "Cổng công khai (Public Portal) không yêu cầu đăng nhập"),
        ("2", "Tra cứu & Biểu cước IATA", "Tra cứu Read Model + 3 gói Tiết kiệm/Tiêu chuẩn/Hỏa tốc"),
        ("3", "Floating AI Chat Widget", "Tư vấn 24/7 qua SSE tích hợp sẵn ngay trên trang chủ"),
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
        ("ui-merchant-web-layout.svg", build_merchant_web),
        ("ui-ops-web-layout.svg", build_ops_web),
        ("ui-courier-mobile-layout.svg", build_courier_mobile),
        ("ui-admin-web-layout.svg", build_admin_web),
        ("ui-customer-mobile-layout.svg", build_customer_mobile),
        ("ui-guest-web-layout.svg", build_guest_web),
    ]
    for fname, fn in builders:
        out_svg = os.path.join(OUT_DIR, fname)
        with open(out_svg, "w", encoding="utf-8") as f:
            f.write(fn())
        render_png(out_svg)


if __name__ == "__main__":
    main()
