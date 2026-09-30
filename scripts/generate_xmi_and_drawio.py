#!/usr/bin/env python3
"""
Generator for:
1. OMG UML 2.5 XMI Model (01-use-case-general-system.xmi) for Visual Paradigm Import
2. Interactive Magnet Connector Diagram (01-use-case-general-system.drawio) for Draw.io / Diagrams.net
"""

import os
import xml.etree.ElementTree as ET
import html

def generate_xmi(output_path):
    """
    Generates standard OMG UML 2.5 compliant XMI file for Visual Paradigm.
    Import in Visual Paradigm: Project > Import > OMG UML 2.x XMI...
    """
    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append('<xmi:XMI xmi:version="2.5" xmlns:xmi="http://www.omg.org/spec/XMI/20131001" xmlns:uml="http://www.omg.org/spec/UML/20131001">')
    lines.append('  <uml:Model xmi:type="uml:Model" xmi:id="model_nexus_logistics" name="Nexus Logistics Enterprise Platform">')

    # 7 ACTORS
    actors = [
        ("actor_guest", "Khách Vãng Lai (Guest User)", "Tra cứu bưu gửi công khai, tính cước IATA, Chat AI 24/7, tạo đơn vãng lai"),
        ("actor_customer", "Khách Hàng Cá Nhân (Customer C-End)", "Tạo đơn lẻ, sổ địa chỉ, tra cứu realtime, xác thực OTP 6 số"),
        ("actor_merchant", "Người Gửi Hàng (Merchant B2B)", "Tạo đơn Web Portal, in phiếu A6/A7, in hàng loạt, đặt pickup, đối soát COD"),
        ("actor_ops", "Nhân Viên Vận Hành (Ops Staff)", "Dashboard, tạo đơn quầy, duyệt pickup, gán shipper, manifest, seal, linehaul, kho"),
        ("actor_shipper", "Nhân Viên Giao Hàng (Shipper)", "Nhiệm vụ ngày, GPS, scan pickup, liên hệ khách, OTP, POD chữ ký số, báo NDR, thu COD"),
        ("actor_admin", "Quản Trị Viên (System Admin)", "Tài khoản toàn hệ thống, phân công, RBAC Matrix, Hub 4 cấp, Zones, System Config, Audit"),
        ("actor_system", "Trợ Lý AI & Hệ Thống (Supporting System)", "Động cơ IATA V/6000, Hybrid RAG, 5 Dynamic Tools, SSE Stream, Outbox Relay RabbitMQ")
    ]
    
    for aid, aname, adesc in actors:
        lines.append(f'    <packagedElement xmi:type="uml:Actor" xmi:id="{aid}" name="{html.escape(aname)}">')
        if aid == "actor_customer":
            lines.append('      <generalization xmi:type="uml:Generalization" xmi:id="gen_cust_guest" general="actor_guest"/>')
        elif aid == "actor_ops":
            lines.append('      <generalization xmi:type="uml:Generalization" xmi:id="gen_ops_shipper" general="actor_shipper"/>')
        lines.append('    </packagedElement>')

    # 6 PACKAGES + AUTH GATEWAY
    packages = [
        ("pkg_auth", "Cổng Xác Thực & Bảo Mật Hệ Thống (auth-service • gateway-bff)", [
            ("UC-AUTH-01", "Đăng nhập hệ thống (Core Auth Hub)", "uc-core", [("inc", "UC-AUTH-03")], []),
            ("UC-AUTH-02", "Đăng xuất hệ thống", "uc-ext", [], [("ext", "UC-AUTH-01")]),
            ("UC-AUTH-03", "Quản lý thông tin tài khoản", "uc-core", [], [])
        ]),
        ("pkg_orders", "Phân Hệ 1: Tiếp Nhận & Quản Lý Đơn Hàng (shipment-service • pickup-service)", [
            ("UC-ORD-01", "Tạo đơn gửi bưu phẩm", "uc-abstract", [("inc", "UC-ORD-05")], []),
            ("UC-ORD-01a", "Tạo đơn hàng Web Portal", "uc-core", [], [("gen", "UC-ORD-01")]),
            ("UC-ORD-01b", "Tạo đơn gửi hàng lẻ", "uc-core", [], [("gen", "UC-ORD-01")]),
            ("UC-ORD-01c", "Tạo đơn khách vãng lai", "uc", [], [("gen", "UC-ORD-01")]),
            ("UC-ORD-02", "Quản lý & Lọc danh sách đơn", "uc-core", [], []),
            ("UC-ORD-03", "Yêu cầu đổi thông tin giao", "uc", [], []),
            ("UC-ORD-04", "Hủy đơn hàng chưa lấy", "uc", [], []),
            ("UC-ORD-05", "In nhãn phiếu gửi A6/A7", "uc-core", [], []),
            ("UC-ORD-06", "In nhiều vận đơn hàng loạt", "uc-core", [], [("ext", "UC-ORD-02")]),
            ("UC-ORD-07", "Gắn tem Hàng Dễ Vỡ [FRAGILE]", "uc-ext", [], [("ext", "UC-ORD-05")]),
            ("UC-ORD-08", "Quản lý sổ địa chỉ", "uc", [], []),
            ("UC-ORD-09", "Đặt lịch hẹn lấy hàng Pickup", "uc-core", [], [])
        ]),
        ("pkg_hub", "Phân Hệ 2: Bưu Cục, Điều Phối & Trung Chuyển (scan • manifest • dispatch)", [
            ("UC-HUB-01", "Giám sát Dashboard thời gian thực", "uc-core", [], []),
            ("UC-HUB-01a", "Tra cứu hành trình đơn nội bộ", "uc", [], []),
            ("UC-HUB-01b", "Tạo đơn hàng tại quầy (Walk-in)", "uc-core", [], []),
            ("UC-HUB-02", "Bảng kê manifest & Đóng bao", "uc-core", [("inc", "UC-HUB-03")], []),
            ("UC-HUB-02a", "Phê duyệt yêu cầu lấy hàng Pickup", "uc-core", [("inc", "UC-HUB-02b")], []),
            ("UC-HUB-02b", "Gán việc shipper (lấy & phát)", "uc-core", [], []),
            ("UC-HUB-02c", "Xác nhận lấy hàng (Scan Pickup)", "uc", [("inc", "UC-HUB-02b")], []),
            ("UC-HUB-03", "Đóng seal niêm kẹp chì an ninh", "uc", [], []),
            ("UC-HUB-04", "Quản lý chuyến xe tải Linehaul", "uc-core", [("inc", "UC-HUB-05"), ("inc", "UC-HUB-02")], []),
            ("UC-HUB-05", "Cấp tem niêm phong xe tải (XT)", "uc", [], []),
            ("UC-HUB-06", "Quét xuất kho Outbound", "uc-core", [("inc", "UC-HUB-02")], []),
            ("UC-HUB-07", "Quét nhập kho Inbound", "uc-core", [("inc", "UC-HUB-08")], []),
            ("UC-HUB-08", "Gỡ bao & Kiểm đếm chia chọn", "uc", [("inc", "UC-HUB-09")], []),
            ("UC-HUB-09", "Quét bàn giao bưu tá (handoff)", "uc-core", [], [])
        ]),
        ("pkg_delivery", "Phân Hệ 3: Giao Hàng Chặng Cuối & Xử Lý Sự Cố (delivery-service • shipment)", [
            ("UC-DEL-01", "Quản lý danh sách nhiệm vụ giao", "uc-core", [], []),
            ("UC-DEL-01a", "Bản đồ lộ trình giao hàng GPS", "uc", [], [("ext", "UC-DEL-01")]),
            ("UC-DEL-02", "Liên hệ người nhận (ẩn số)", "uc", [], []),
            ("UC-DEL-03", "Xác thực mã OTP 6 chữ số", "uc-core", [], []),
            ("UC-DEL-04", "Chụp ảnh POD & Chữ ký số", "uc-core", [], []),
            ("UC-DEL-05", "Xác nhận giao thành công", "uc-core", [("inc", "UC-DEL-03"), ("inc", "UC-DEL-04")], []),
            ("UC-DEL-06", "Cập nhật sự cố thất bại NDR", "uc", [], [("ext", "UC-DEL-05")]),
            ("UC-DEL-06a", "Hẹn lại ngày phát (Reschedule)", "uc-ext", [], [("ext", "UC-DEL-06")]),
            ("UC-DEL-07", "Xử lý sự cố phát thất bại (NDR)", "uc-core", [("inc", "UC-DEL-08")], []),
            ("UC-DEL-08", "Quản lý & Tạo chuyển hoàn RTS", "uc-core", [], [])
        ]),
        ("pkg_finance", "Phân Hệ 4: Tài Chính, Thu Hộ COD & Đối Soát (payment-service • reporting)", [
            ("UC-FIN-01", "Thu hộ tiền mặt COD", "uc-core", [], []),
            ("UC-FIN-02", "Nộp tiền COD qua VietQR", "uc-core", [("inc", "UC-FIN-01")], []),
            ("UC-FIN-03", "Phê duyệt quyết toán COD thủ công", "uc", [], [("ext", "UC-FIN-04")]),
            ("UC-FIN-04", "Đối soát giải ngân COD & VietQR", "uc-core", [], []),
            ("UC-FIN-05", "Lịch sử đối soát SePay/VietQR", "uc-core", [], []),
            ("UC-FIN-06", "Khớp nối SePay & Khấu trừ tự động", "uc-core", [("inc", "UC-FIN-04")], []),
            ("UC-FIN-07", "Khấu trừ cước hoàn phân tầng", "uc-ext", [], [("ext", "UC-FIN-05")])
        ]),
        ("pkg_ai", "Phân Hệ 5: Trợ Lý AI Logistics RAG & Tra Cứu Hành Trình (chatbot-service • tracking)", [
            ("UC-AI-01", "Tra cứu hành trình bưu phẩm", "uc-abstract", [], []),
            ("UC-AI-01a", "Tra cứu bưu kiện công khai", "uc", [], [("gen", "UC-AI-01")]),
            ("UC-AI-01b", "Tra cứu hành trình realtime", "uc-core", [], [("gen", "UC-AI-01")]),
            ("UC-AI-01c", "Tra cứu tiến độ (Merchant)", "uc-core", [], [("gen", "UC-AI-01")]),
            ("UC-AI-02", "Ước tính cước phí bưu chính IATA", "uc-core", [("inc", "UC-AI-03")], []),
            ("UC-AI-03", "Động cơ cước chuẩn IATA V/6000", "uc-core", [], []),
            ("UC-AI-04", "Trò chuyện cùng trợ lý AI 24/7", "uc-core", [("inc", "UC-AI-06"), ("inc", "UC-AI-07")], []),
            ("UC-AI-05a", "Tool: Tra cứu vận đơn (track)", "uc", [], []),
            ("UC-AI-05b", "Tool: Tính cước tự động (calc)", "uc", [], []),
            ("UC-AI-05c", "Tool: Tra hàng cấm gửi (policy)", "uc", [], []),
            ("UC-AI-05d", "Tool: Chính sách bồi thường 100%", "uc", [], []),
            ("UC-AI-05e", "Tool: Tìm bưu cục gần nhất (geo)", "uc", [], []),
            ("UC-AI-06", "Truy xuất tri thức Hybrid RAG", "uc-core", [
                ("inc", "UC-AI-06a"), ("inc", "UC-AI-05a"), ("inc", "UC-AI-05b"),
                ("inc", "UC-AI-05c"), ("inc", "UC-AI-05d"), ("inc", "UC-AI-05e")
            ], []),
            ("UC-AI-06a", "Fallback mô hình LLM (Gemini/GPT)", "uc", [], []),
            ("UC-AI-07", "Phản hồi dạng dòng SSE Streaming", "uc-core", [("inc", "UC-AI-07a")], []),
            ("UC-AI-07a", "Cách ly phiên an toàn (Session)", "uc", [], [])
        ]),
        ("pkg_admin", "Phân Hệ 6: Quản Trị Hệ Thống, RBAC & Cấu Hình (masterdata • auth-service)", [
            ("UC-ADM-01", "Quản lý tài khoản toàn hệ thống", "uc-core", [("inc", "UC-ADM-02")], []),
            ("UC-ADM-02", "Phân công nhân sự & Tuyến", "uc", [], []),
            ("UC-ADM-03", "Quản lý phân quyền RBAC Matrix", "uc-core", [], []),
            ("UC-ADM-04", "Phân quyền mobile override", "uc-ext", [], [("ext", "UC-ADM-03")]),
            ("UC-ADM-05", "Quản lý danh mục Hub 4 cấp", "uc-core", [("inc", "UC-ADM-06")], []),
            ("UC-ADM-06", "Quản lý khu vực / Zone địa lý", "uc", [], []),
            ("UC-ADM-07", "Danh mục lý do giao NDR", "uc", [], []),
            ("UC-ADM-08", "Cấu hình tham số hệ thống", "uc-core", [], []),
            ("UC-ADM-09", "Kiểm toán nhật ký hệ thống", "uc-core", [], []),
            ("UC-ADM-10", "Chuyển giao Outbox & RabbitMQ", "uc-core", [("inc", "UC-ADM-11")], []),
            ("UC-ADM-11", "Chiếu Read Model Timeline & KPI", "uc-core", [], [])
        ])
    ]

    for pid, pname, uclist in packages:
        lines.append(f'    <packagedElement xmi:type="uml:Package" xmi:id="{pid}" name="{html.escape(pname)}">')
        for ucid, utitle, utype, incs, exts in uclist:
            safe_id = ucid.replace("-", "_").lower()
            lines.append(f'      <packagedElement xmi:type="uml:UseCase" xmi:id="{safe_id}" name="{ucid}: {html.escape(utitle)}">')
            for rel_type, target_ucid in incs:
                tgt_id = target_ucid.replace("-", "_").lower()
                inc_id = f"inc_{safe_id}_{tgt_id}"
                lines.append(f'        <include xmi:type="uml:Include" xmi:id="{inc_id}" addition="{tgt_id}"/>')
            for rel_type, target_ucid in exts:
                tgt_id = target_ucid.replace("-", "_").lower()
                if rel_type == "ext":
                    ext_id = f"ext_{safe_id}_{tgt_id}"
                    lines.append(f'        <extend xmi:type="uml:Extend" xmi:id="{ext_id}" extendedCase="{tgt_id}"/>')
                elif rel_type == "gen":
                    gen_id = f"gen_{safe_id}_{tgt_id}"
                    lines.append(f'        <generalization xmi:type="uml:Generalization" xmi:id="{gen_id}" general="{tgt_id}"/>')
            lines.append('      </packagedElement>')
        lines.append('    </packagedElement>')

    lines.append('  </uml:Model>')
    lines.append('</xmi:XMI>')

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Generated XMI successfully: {output_path} ({len(lines)} lines)")

def generate_drawio(output_path):
    """
    Generates standard Diagrams.net / Draw.io (.drawio) XML file.
    Every single line is an interactive edge (connector) with source and target magnets!
    When opened in Draw.io or diagrams.net, dragging any Use Case automatically stretches the lines.
    """
    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append('<mxfile host="app.diagrams.net" modified="2026-09-30T13:30:00.000Z" agent="Mozilla/5.0" version="24.0.0" type="device">')
    lines.append('  <diagram id="nexus_usecase" name="Sơ đồ Use Case Tổng Quát Nexus Logistics (Visual Paradigm Style)">')
    lines.append('    <mxGraphModel dx="2600" dy="1600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="7500" pageHeight="4600" math="0" shadow="0">')
    lines.append('      <root>')
    lines.append('        <mxCell id="0"/>')
    lines.append('        <mxCell id="1" parent="0"/>')

    # Background frame
    lines.append('        <!-- Background System Boundary -->')
    lines.append('        <mxCell id="sys_boundary" value="&lt;b&gt;«system» RANH GIỚI HỆ THỐNG: NEXUS ENTERPRISE LOGISTICS PLATFORM (15 BACKEND MICROSERVICES &amp;amp; 6 CLIENT APPS)&lt;/b&gt;" style="swimlane;whiteSpace=wrap;html=1;startSize=42;rounded=0;arcSize=2;fillColor=#FFFFFF;strokeColor=#2D4A70;strokeWidth=2.2;fontColor=#1E3A5F;fontFamily=Segoe UI;fontSize=15;align=left;spacingLeft=20;" vertex="1" parent="1">')
    lines.append('          <mxGeometry x="720" y="170" width="6060" height="3980" as="geometry"/>')
    lines.append('        </mxCell>')

    # 7 ACTORS
    actor_defs = [
        ("actor_merchant", "Người Gửi Hàng (Merchant)", "(Shop B2B • 15 UCs)", "merchant-web :5174", 240, 680),
        ("actor_customer", "Khách Hàng Cá Nhân", "(C-End • 6 UCs)", "customer-mobile :8082", 240, 1600),
        ("actor_guest", "Khách Vãng Lai (Guest)", "(Public • 9 UCs)", "guest-web :5177", 240, 2700),
        ("actor_ops", "Nhân Viên Vận Hành", "(Ops Staff Bưu Cục & Hub • 19 UCs)", "ops-web :5173", 7260, 720),
        ("actor_shipper", "Nhân Viên Giao Hàng", "(Shipper Chặng Cuối • 13 UCs)", "courier-mobile :8081", 7260, 2200),
        ("actor_admin", "Quản Trị Viên (Admin)", "(System Admin • 11 UCs)", "admin-web :5175", 7260, 3550),
        ("actor_system", "Trợ Lý AI & Hệ Thống", "chatbot-service • outbox relay\nEvent Bus & Read Models", "", 7140, 4150)
    ]

    for aid, aname, arole, aapp, ax, ay in actor_defs:
        if aid == "actor_system":
            val = f"&lt;b&gt;«supporting system actor»&lt;/b&gt;&lt;br&gt;&lt;b&gt;{html.escape(aname)}&lt;/b&gt;&lt;br&gt;{html.escape(arole)}"
            lines.append(f'        <mxCell id="{aid}" value="{val}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#EDF4FA;strokeColor=#2E5B88;strokeWidth=1.8;fontColor=#0F2942;fontFamily=Segoe UI;fontSize=12;align=center;" vertex="1" parent="1">')
            lines.append(f'          <mxGeometry x="{ax}" y="{ay}" width="310" height="96" as="geometry"/>')
            lines.append('        </mxCell>')
        else:
            val = f"&lt;b&gt;{html.escape(aname)}&lt;/b&gt;&lt;br&gt;{html.escape(arole)}&lt;br&gt;&lt;i&gt;{html.escape(aapp)}&lt;/i&gt;"
            lines.append(f'        <mxCell id="{aid}" value="{val}" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#FFFFFF;strokeColor=#0F2942;strokeWidth=2.2;fontColor=#0F2942;fontFamily=Segoe UI;fontSize=13;" vertex="1" parent="1">')
            lines.append(f'          <mxGeometry x="{ax-25}" y="{ay-60}" width="50" height="100" as="geometry"/>')
            lines.append('        </mxCell>')

    # PACKAGES & USE CASES WITH EXACT COORDS
    packages_drawio = [
        ("pkg_auth", "CỔNG XÁC THỰC & BẢO MẬT HỆ THỐNG (auth-service • gateway-bff)", 3060, 190, 1400, 570, [
            ("uc_auth_01", "UC-AUTH-01", "Đăng nhập hệ thống (Core Auth Hub)", 3760, 390, 330, 72, "core"),
            ("uc_auth_02", "UC-AUTH-02", "Đăng xuất hệ thống", 3360, 620, 290, 56, "ext"),
            ("uc_auth_03", "UC-AUTH-03", "Quản lý thông tin tài khoản", 4160, 620, 310, 56, "core")
        ]),
        ("pkg_1", "PHÂN HỆ 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG — shipment-service • pickup-service", 760, 190, 1800, 1490, [
            ("uc_ord_01a", "UC-ORD-01a", "Tạo đơn hàng Web Portal", 1040, 310, 290, 54, "core"),
            ("uc_ord_02", "UC-ORD-02", "Quản lý & Lọc danh sách đơn", 1040, 450, 290, 54, "core"),
            ("uc_ord_03", "UC-ORD-03", "Yêu cầu đổi thông tin giao", 1040, 590, 290, 54, "std"),
            ("uc_ord_04", "UC-ORD-04", "Hủy đơn hàng chưa lấy", 1040, 730, 270, 54, "std"),
            ("uc_ord_09", "UC-ORD-09", "Đặt lịch hẹn lấy hàng Pickup", 1040, 870, 300, 56, "core"),
            ("uc_ord_01b", "UC-ORD-01b", "Tạo đơn gửi hàng lẻ", 1040, 1050, 280, 54, "core"),
            ("uc_ord_08", "UC-ORD-08", "Quản lý sổ địa chỉ", 1040, 1190, 270, 52, "std"),
            ("uc_ord_01c", "UC-ORD-01c", "Tạo đơn khách vãng lai", 1040, 1350, 280, 54, "std"),
            ("uc_ord_06", "UC-ORD-06", "In nhiều vận đơn hàng loạt", 1660, 310, 300, 54, "core"),
            ("uc_ord_01", "UC-ORD-01", "Tạo đơn gửi bưu phẩm", 1660, 470, 310, 60, "abs"),
            ("uc_ord_05", "UC-ORD-05", "In nhãn phiếu gửi A6/A7", 1660, 630, 280, 54, "core"),
            ("uc_ord_07", "UC-ORD-07", "Gắn tem Hàng Dễ Vỡ [FRAGILE]", 1660, 790, 290, 54, "ext")
        ]),
        ("pkg_5", "PHÂN HỆ 5: TRỢ LÝ AI LOGISTICS RAG & TRA CỨU HÀNH TRÌNH — chatbot-service • tracking", 760, 1940, 1800, 2160, [
            ("uc_ai_01b", "UC-AI-01b", "Tra cứu hành trình realtime", 1040, 2080, 290, 54, "core"),
            ("uc_ai_01c", "UC-AI-01c", "Tra cứu tiến độ (Merchant)", 1040, 2220, 290, 54, "core"),
            ("uc_ai_01a", "UC-AI-01a", "Tra cứu bưu kiện công khai", 1040, 2360, 290, 54, "std"),
            ("uc_ai_02", "UC-AI-02", "Ước tính cước phí bưu chính IATA", 1040, 2520, 300, 56, "core"),
            ("uc_ai_04", "UC-AI-04", "Trò chuyện cùng trợ lý AI 24/7", 1040, 2700, 300, 60, "core"),
            ("uc_ai_01", "UC-AI-01", "Tra cứu hành trình bưu phẩm", 1660, 2220, 310, 60, "abs"),
            ("uc_ai_03", "UC-AI-03", "Động cơ cước chuẩn IATA V/6000", 1660, 2520, 310, 56, "core"),
            ("uc_ai_06", "UC-AI-06", "Truy xuất tri thức Hybrid RAG", 1660, 2700, 310, 56, "core"),
            ("uc_ai_06a", "UC-AI-06a", "Fallback mô hình LLM (Gemini/GPT)", 1660, 2860, 300, 54, "std"),
            ("uc_ai_07", "UC-AI-07", "Phản hồi dạng dòng SSE Streaming", 1660, 3020, 300, 56, "core"),
            ("uc_ai_07a", "UC-AI-07a", "Cách ly phiên an toàn (Session)", 1660, 3180, 300, 54, "std"),
            ("uc_ai_05a", "UC-AI-05a", "Tool: Tra cứu vận đơn (track)", 2280, 2520, 310, 54, "std"),
            ("uc_ai_05b", "UC-AI-05b", "Tool: Tính cước tự động (calc)", 2280, 2660, 310, 54, "std"),
            ("uc_ai_05c", "UC-AI-05c", "Tool: Tra hàng cấm gửi (policy)", 2280, 2800, 310, 54, "std"),
            ("uc_ai_05d", "UC-AI-05d", "Tool: Chính sách bồi thường 100%", 2280, 2940, 310, 54, "std"),
            ("uc_ai_05e", "UC-AI-05e", "Tool: Tìm bưu cục gần nhất (geo)", 2280, 3080, 310, 54, "std")
        ]),
        ("pkg_4", "PHÂN HỆ 4: TÀI CHÍNH, THU HỘ COD & ĐỐI SOÁT — payment-service • reporting", 2860, 1940, 1800, 1300, [
            ("uc_fin_05", "UC-FIN-05", "Lịch sử đối soát SePay/VietQR", 3260, 2200, 300, 56, "core"),
            ("uc_fin_07", "UC-FIN-07", "Khấu trừ cước hoàn phân tầng", 3260, 2460, 300, 56, "ext"),
            ("uc_fin_04", "UC-FIN-04", "Đối soát giải ngân COD & VietQR", 3260, 2760, 310, 56, "core"),
            ("uc_fin_03", "UC-FIN-03", "Phê duyệt quyết toán COD thủ công", 3260, 3040, 310, 56, "std"),
            ("uc_fin_01", "UC-FIN-01", "Thu hộ tiền mặt COD", 4260, 2200, 290, 54, "core"),
            ("uc_fin_02", "UC-FIN-02", "Nộp tiền COD qua VietQR", 4260, 2460, 290, 54, "core"),
            ("uc_fin_06", "UC-FIN-06", "Khớp nối SePay & Khấu trừ tự động", 4260, 2760, 310, 56, "core")
        ]),
        ("pkg_2", "PHÂN HỆ 2: BƯU CỤC, ĐIỀU PHỐI & TRUNG CHUYỂN — scan • manifest • dispatch", 4960, 190, 1780, 1490, [
            ("uc_hub_01", "UC-HUB-01", "Giám sát Dashboard thời gian thực", 6440, 280, 290, 54, "core"),
            ("uc_hub_01a", "UC-HUB-01a", "Tra cứu hành trình đơn nội bộ", 6440, 400, 290, 54, "std"),
            ("uc_hub_01b", "UC-HUB-01b", "Tạo đơn hàng tại quầy (Walk-in)", 6440, 520, 290, 54, "core"),
            ("uc_hub_02a", "UC-HUB-02a", "Phê duyệt yêu cầu lấy hàng Pickup", 6440, 640, 300, 54, "core"),
            ("uc_hub_02b", "UC-HUB-02b", "Gán việc shipper (lấy & phát)", 6440, 760, 300, 54, "core"),
            ("uc_hub_02c", "UC-HUB-02c", "Xác nhận lấy hàng (Scan Pickup)", 6440, 880, 290, 54, "std"),
            ("uc_hub_06", "UC-HUB-06", "Quét xuất kho Outbound", 6440, 1000, 280, 54, "core"),
            ("uc_hub_07", "UC-HUB-07", "Quét nhập kho Inbound", 6440, 1120, 280, 54, "core"),
            ("uc_hub_04", "UC-HUB-04", "Quản lý chuyến xe tải Linehaul", 5860, 640, 300, 56, "core"),
            ("uc_hub_02", "UC-HUB-02", "Bảng kê manifest & Đóng bao", 5860, 880, 310, 56, "core"),
            ("uc_hub_08", "UC-HUB-08", "Gỡ bao & Kiểm đếm chia chọn", 5860, 1120, 300, 54, "std"),
            ("uc_hub_05", "UC-HUB-05", "Cấp tem niêm phong xe tải (XT)", 5260, 640, 300, 54, "std"),
            ("uc_hub_03", "UC-HUB-03", "Đóng seal niêm kẹp chì an ninh", 5260, 880, 300, 54, "std"),
            ("uc_hub_09", "UC-HUB-09", "Quét bàn giao bưu tá (handoff)", 5260, 1120, 300, 54, "core")
        ]),
        ("pkg_3", "PHÂN HỆ 3: GIAO HÀNG CHẶNG CUỐI & SỰ CỐ — delivery-service • shipment", 4960, 1940, 1780, 1100, [
            ("uc_del_01", "UC-DEL-01", "Quản lý danh sách nhiệm vụ giao", 6440, 2040, 290, 54, "core"),
            ("uc_del_01a", "UC-DEL-01a", "Bản đồ lộ trình giao hàng GPS", 6440, 2160, 290, 54, "std"),
            ("uc_del_02", "UC-DEL-02", "Liên hệ người nhận (ẩn số)", 6440, 2280, 280, 52, "std"),
            ("uc_del_05", "UC-DEL-05", "Xác nhận giao thành công", 6440, 2400, 300, 56, "core"),
            ("uc_del_06", "UC-DEL-06", "Cập nhật sự cố thất bại NDR", 6440, 2520, 290, 54, "std"),
            ("uc_del_06a", "UC-DEL-06a", "Hẹn lại ngày phát (Reschedule)", 6440, 2640, 290, 54, "ext"),
            ("uc_del_03", "UC-DEL-03", "Xác thực mã OTP 6 chữ số", 5860, 2160, 290, 54, "core"),
            ("uc_del_04", "UC-DEL-04", "Chụp ảnh POD & Chữ ký số", 5860, 2380, 290, 54, "core"),
            ("uc_del_07", "UC-DEL-07", "Xử lý sự cố phát thất bại (NDR)", 5260, 2160, 300, 56, "core"),
            ("uc_del_08", "UC-DEL-08", "Quản lý & Tạo chuyển hoàn RTS", 5260, 2380, 300, 56, "core")
        ]),
        ("pkg_6", "PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG, RBAC & CẤU HÌNH — masterdata • auth-service", 4960, 3240, 1780, 860, [
            ("uc_adm_01", "UC-ADM-01", "Quản lý tài khoản toàn hệ thống", 6440, 3360, 290, 54, "core"),
            ("uc_adm_05", "UC-ADM-05", "Quản lý danh mục Hub 4 cấp", 6440, 3490, 290, 54, "core"),
            ("uc_adm_03", "UC-ADM-03", "Quản lý phân quyền RBAC Matrix", 6440, 3620, 300, 54, "core"),
            ("uc_adm_07", "UC-ADM-07", "Danh mục lý do giao NDR", 6440, 3750, 290, 54, "std"),
            ("uc_adm_08", "UC-ADM-08", "Cấu hình tham số hệ thống", 6440, 3880, 290, 54, "core"),
            ("uc_adm_09", "UC-ADM-09", "Kiểm toán nhật ký hệ thống", 6440, 4010, 290, 54, "core"),
            ("uc_adm_02", "UC-ADM-02", "Phân công nhân sự & Tuyến", 5860, 3360, 290, 54, "std"),
            ("uc_adm_06", "UC-ADM-06", "Quản lý khu vực / Zone địa lý", 5860, 3490, 290, 54, "std"),
            ("uc_adm_04", "UC-ADM-04", "Phân quyền mobile override", 5860, 3620, 290, 54, "ext"),
            ("uc_adm_10", "UC-ADM-10", "Chuyển giao Outbox & RabbitMQ", 5260, 3750, 300, 54, "core"),
            ("uc_adm_11", "UC-ADM-11", "Chiếu Read Model Timeline & KPI", 5260, 3880, 300, 54, "core")
        ])
    ]

    for pid, pname, px, py, pw, ph, ucs in packages_drawio:
        lines.append(f'        <!-- Package: {pname} -->')
        tab_style = "swimlane;whiteSpace=wrap;html=1;startSize=36;rounded=1;arcSize=3;fillColor=#F8FAFD;strokeColor=#4C769E;strokeWidth=1.4;fontColor=#1E3A5F;fontFamily=Segoe UI;fontSize=13;fontStyle=1;align=left;spacingLeft=15;"
        lines.append(f'        <mxCell id="{pid}" value="{html.escape(pname)}" style="{tab_style}" vertex="1" parent="1">')
        lines.append(f'          <mxGeometry x="{px}" y="{py}" width="{pw}" height="{ph}" as="geometry"/>')
        lines.append('        </mxCell>')

        for ucid_tag, ucid_str, utitle, cx, cy, w, h, utype in ucs:
            if utype == "core":
                style = "ellipse;whiteSpace=wrap;html=1;fillColor=#E2EEF8;strokeColor=#204B76;strokeWidth=2.2;fontColor=#0F172A;fontFamily=Segoe UI;fontSize=12;align=center;"
            elif utype == "abs":
                style = "ellipse;whiteSpace=wrap;html=1;fillColor=#E2E8F0;strokeColor=#475569;strokeWidth=1.6;dashed=1;fontColor=#334155;fontFamily=Segoe UI;fontSize=12;fontStyle=2;align=center;"
            elif utype == "ext":
                style = "ellipse;whiteSpace=wrap;html=1;fillColor=#F1F5F9;strokeColor=#4C769E;strokeWidth=1.4;dashed=1;fontColor=#0F172A;fontFamily=Segoe UI;fontSize=12;align=center;"
            else: # std
                style = "ellipse;whiteSpace=wrap;html=1;fillColor=#EDF4FA;strokeColor=#4C769E;strokeWidth=1.4;fontColor=#0F172A;fontFamily=Segoe UI;fontSize=12;align=center;"

            prefix = "&lt;i&gt;«abstract»&lt;/i&gt;&lt;br&gt;" if utype == "abs" else ""
            val = f"{prefix}&lt;b&gt;{ucid_str}&lt;/b&gt;&lt;br&gt;{html.escape(utitle)}"
            # Convert center cx, cy to top-left x, y
            x = cx - w / 2
            y = cy - h / 2
            lines.append(f'        <mxCell id="{ucid_tag}" value="{val}" style="{style}" vertex="1" parent="1">')
            lines.append(f'          <mxGeometry x="{x:.1f}" y="{y:.1f}" width="{w}" height="{h}" as="geometry"/>')
            lines.append('        </mxCell>')

    # CONNECTORS: DYNAMICALLY BOUND EDGES
    edge_idx = 100

    def add_edge(src, tgt, style, label=""):
        nonlocal edge_idx
        edge_idx += 1
        val = html.escape(label)
        lines.append(f'        <mxCell id="edge_{edge_idx}" value="{val}" style="{style}" edge="1" parent="1" source="{src}" target="{tgt}">')
        lines.append('          <mxGeometry relative="1" as="geometry"/>')
        lines.append('        </mxCell>')

    assoc_style = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#243B53;strokeWidth=1.4;endArrow=none;"
    inc_style = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;strokeColor=#334E68;strokeWidth=1.3;endArrow=block;endFill=1;fontSize=11;fontFamily=Segoe UI;fontColor=#1E3A5F;labelBackgroundColor=#FFFFFF;rounded=1;"
    ext_style = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;strokeColor=#334E68;strokeWidth=1.3;endArrow=block;endFill=1;fontSize=11;fontFamily=Segoe UI;fontColor=#1E3A5F;labelBackgroundColor=#FFFFFF;rounded=1;"
    gen_style = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#243B53;strokeWidth=1.6;endArrow=block;endFill=0;rounded=1;"

    # Actor Generalizations
    add_edge("actor_customer", "actor_guest", gen_style, "«generalizes»")
    add_edge("actor_ops", "actor_shipper", gen_style, "«generalizes»")

    # Merchant Associations
    add_edge("actor_merchant", "uc_ord_01a", assoc_style)
    add_edge("actor_merchant", "uc_ord_02", assoc_style)
    add_edge("actor_merchant", "uc_ord_03", assoc_style)
    add_edge("actor_merchant", "uc_ord_04", assoc_style)
    add_edge("actor_merchant", "uc_ord_09", assoc_style)
    add_edge("actor_merchant", "uc_auth_01", assoc_style, "[Merchant]")
    add_edge("actor_merchant", "uc_ai_01c", assoc_style, "[Merchant]")
    add_edge("actor_merchant", "uc_fin_05", assoc_style, "[Merchant]")

    # Customer Associations
    add_edge("actor_customer", "uc_ord_01b", assoc_style)
    add_edge("actor_customer", "uc_ord_08", assoc_style)
    add_edge("actor_customer", "uc_ai_01b", assoc_style)
    add_edge("actor_customer", "uc_auth_01", assoc_style, "[Customer]")
    add_edge("actor_customer", "uc_del_03", assoc_style, "[Customer]")

    # Guest Associations
    add_edge("actor_guest", "uc_ord_01c", assoc_style)
    add_edge("actor_guest", "uc_ai_01a", assoc_style)
    add_edge("actor_guest", "uc_ai_02", assoc_style)
    add_edge("actor_guest", "uc_ai_04", assoc_style)

    # Ops Staff Associations
    add_edge("actor_ops", "uc_hub_01", assoc_style)
    add_edge("actor_ops", "uc_hub_01a", assoc_style)
    add_edge("actor_ops", "uc_hub_01b", assoc_style)
    add_edge("actor_ops", "uc_hub_02a", assoc_style)
    add_edge("actor_ops", "uc_hub_02b", assoc_style)
    add_edge("actor_ops", "uc_hub_06", assoc_style)
    add_edge("actor_ops", "uc_hub_07", assoc_style)
    add_edge("actor_ops", "uc_hub_04", assoc_style)
    add_edge("actor_ops", "uc_auth_01", assoc_style, "[Ops Staff]")
    add_edge("actor_ops", "uc_del_07", assoc_style, "[Ops Staff]")
    add_edge("actor_ops", "uc_fin_04", assoc_style, "[Ops Staff]")
    add_edge("actor_ops", "uc_fin_03", assoc_style, "[Ops Staff]")

    # Shipper Associations
    add_edge("actor_shipper", "uc_del_01", assoc_style)
    add_edge("actor_shipper", "uc_del_01a", assoc_style)
    add_edge("actor_shipper", "uc_del_02", assoc_style)
    add_edge("actor_shipper", "uc_del_05", assoc_style)
    add_edge("actor_shipper", "uc_del_06", assoc_style)
    add_edge("actor_shipper", "uc_del_06a", assoc_style)
    add_edge("actor_shipper", "uc_hub_02c", assoc_style, "[Shipper]")
    add_edge("actor_shipper", "uc_fin_01", assoc_style, "[Shipper]")
    add_edge("actor_shipper", "uc_fin_02", assoc_style, "[Shipper]")
    add_edge("actor_shipper", "uc_auth_01", assoc_style, "[Shipper]")

    # Admin Associations
    add_edge("actor_admin", "uc_adm_01", assoc_style)
    add_edge("actor_admin", "uc_adm_05", assoc_style)
    add_edge("actor_admin", "uc_adm_03", assoc_style)
    add_edge("actor_admin", "uc_adm_07", assoc_style)
    add_edge("actor_admin", "uc_adm_08", assoc_style)
    add_edge("actor_admin", "uc_adm_09", assoc_style)
    add_edge("actor_admin", "uc_auth_01", assoc_style, "[Admin]")

    # Supporting System Actor
    add_edge("actor_system", "uc_adm_10", assoc_style, "[System]")
    add_edge("actor_system", "uc_adm_11", assoc_style, "[System]")
    add_edge("actor_system", "uc_fin_06", assoc_style, "[System]")
    add_edge("actor_system", "uc_ai_03", assoc_style, "[System & AI]")
    add_edge("actor_system", "uc_ai_07", assoc_style, "[System & AI]")

    # Intra-Package Use Case Dependencies
    # Auth
    add_edge("uc_auth_02", "uc_auth_01", ext_style, "«extend»")
    add_edge("uc_auth_01", "uc_auth_03", inc_style, "«include»")

    # Orders (Pkg 1)
    add_edge("uc_ord_01a", "uc_ord_01", gen_style)
    add_edge("uc_ord_01b", "uc_ord_01", gen_style)
    add_edge("uc_ord_01c", "uc_ord_01", gen_style)
    add_edge("uc_ord_01", "uc_ord_05", inc_style, "«include»")
    add_edge("uc_ord_07", "uc_ord_05", ext_style, "«extend»")
    add_edge("uc_ord_06", "uc_ord_02", ext_style, "«extend»")

    # AI & Tracking (Pkg 5)
    add_edge("uc_ai_01b", "uc_ai_01", gen_style)
    add_edge("uc_ai_01c", "uc_ai_01", gen_style)
    add_edge("uc_ai_01a", "uc_ai_01", gen_style)
    add_edge("uc_ai_02", "uc_ai_03", inc_style, "«include»")
    add_edge("uc_ai_04", "uc_ai_06", inc_style, "«include»")
    add_edge("uc_ai_06", "uc_ai_06a", inc_style, "«include»")
    add_edge("uc_ai_04", "uc_ai_07", inc_style, "«include»")
    add_edge("uc_ai_07", "uc_ai_07a", inc_style, "«include»")
    add_edge("uc_ai_06", "uc_ai_05a", inc_style, "«include»")
    add_edge("uc_ai_06", "uc_ai_05b", inc_style, "«include»")
    add_edge("uc_ai_06", "uc_ai_05c", inc_style, "«include»")
    add_edge("uc_ai_06", "uc_ai_05d", inc_style, "«include»")
    add_edge("uc_ai_06", "uc_ai_05e", inc_style, "«include»")

    # Finance (Pkg 4)
    add_edge("uc_fin_07", "uc_fin_05", ext_style, "«extend»")
    add_edge("uc_fin_02", "uc_fin_01", inc_style, "«include»")
    add_edge("uc_fin_03", "uc_fin_04", ext_style, "«extend»")
    add_edge("uc_fin_06", "uc_fin_04", inc_style, "«include»")

    # Hub (Pkg 2)
    add_edge("uc_hub_02a", "uc_hub_02b", inc_style, "«include»")
    add_edge("uc_hub_02c", "uc_hub_02b", inc_style, "«include»")
    add_edge("uc_hub_04", "uc_hub_05", inc_style, "«include»")
    add_edge("uc_hub_04", "uc_hub_02", inc_style, "«include»")
    add_edge("uc_hub_02", "uc_hub_03", inc_style, "«include»")
    add_edge("uc_hub_06", "uc_hub_02", inc_style, "«include»")
    add_edge("uc_hub_07", "uc_hub_08", inc_style, "«include»")
    add_edge("uc_hub_08", "uc_hub_09", inc_style, "«include»")

    # Delivery (Pkg 3)
    add_edge("uc_del_01a", "uc_del_01", ext_style, "«extend»")
    add_edge("uc_del_05", "uc_del_03", inc_style, "«include»")
    add_edge("uc_del_05", "uc_del_04", inc_style, "«include»")
    add_edge("uc_del_06", "uc_del_05", ext_style, "«extend»")
    add_edge("uc_del_06a", "uc_del_06", ext_style, "«extend»")
    add_edge("uc_del_07", "uc_del_08", inc_style, "«include»")

    # Admin (Pkg 6)
    add_edge("uc_adm_01", "uc_adm_02", inc_style, "«include»")
    add_edge("uc_adm_05", "uc_adm_06", inc_style, "«include»")
    add_edge("uc_adm_04", "uc_adm_03", ext_style, "«extend»")
    add_edge("uc_adm_10", "uc_adm_11", inc_style, "«include»")

    lines.append('      </root>')
    lines.append('    </mxGraphModel>')
    lines.append('  </diagram>')
    lines.append('</mxfile>')

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Generated Draw.io successfully: {output_path} ({len(lines)} lines)")

if __name__ == "__main__":
    out_dir = os.path.abspath("docs/graduation-thesis/figma-page-1-system-and-data/diagrams")
    os.makedirs(out_dir, exist_ok=True)
    
    xmi_path = os.path.join(out_dir, "01-use-case-general-system.xmi")
    generate_xmi(xmi_path)
    
    drawio_path = os.path.join(out_dir, "01-use-case-general-system.drawio")
    generate_drawio(drawio_path)
