#!/usr/bin/env python3
"""
Upgrade Section 6.4.2 LEVEL 4 (TABLE[210]: TC-031 .. TC-040 — Kho vận, hub,
manifest, scan và phạm vi linehaul) inside
docs/BaoCaoKLTN_TranTanTai_VoVanTuTai_version4_final.docx
to the exact 8-column 10pt studio-grade academic format matching Section 6.4.1:

  Test ID | Mô tả | Điều kiện trước | Các bước test | Dữ liệu Test | Kết quả mong muốn | Kết quả thực tế | Pass/Fail

100% grounded in the real Nexus Express codebase:
- services/masterdata-service (HubsService, ZonesService, Configs/NdrReasons/MerchantProfiles)
- services/manifest-service (ManifestsService, ManifestStateMachine, SealRecord, ReceiveRecord)
- services/scan-service (ScansService, LocationsService, IdempotencyRecord, CurrentLocation)
- apps/ops-web/src/pages/function-groups/operations-platform/linehaul/*
"""

import os
import re
import docx
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

DOC_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai_version4_final.docx"
TARGET_TABLE_INDEX = 210  # LEVEL 4 table in Section 6.4.2

HEADERS = [
    "Test ID",
    "Mô tả",
    "Điều kiện trước",
    "Các bước test",
    "Dữ liệu Test",
    "Kết quả mong muốn",
    "Kết quả thực tế",
    "Pass/\u200bFail",
]

# Exact Section 3 printable width = 11907 - 1701 - 1134 = 9072 twips (16.0 cm A4 portrait)
COL_WIDTHS = [940, 1040, 1020, 1380, 1320, 1380, 1372, 620]
assert sum(COL_WIDTHS) == 9072

LEVEL4_ROWS = [
    (
        "TC-031",
        "Quản lý Master Data Hub/Zone và cây phân cấp 4 tầng",
        "masterdata-service (:3009) chạy; tài khoản ADMIN đã xác thực; Zone 003 tồn tại.",
        "1. Gọi POST /hubs tạo Hub mới thuộc Zone 003.\n2. Thử tạo lại trùng code.\n3. Gọi GET /hubs/regional-hierarchy và PATCH cập nhật.",
        "code: \"003W099\"\nname: \"Bưu cục Gò Vấp 2\"\nlevel: 3; zoneCode: \"003\"\nradius: 5 km",
        "Tạo thành công Hub mới, ghi AdminAuditLog (HUB_CREATED) & Outbox; chặn trùng mã (HTTP 409) và trả đúng cây 3 miền (001/002/003).",
        "HubsService lưu Hub vào masterdata_db, kiểm tra tồn tại zoneCode, ghi audit HUB_CREATED, trả 409 khi trùng mã và xuất đúng cấu trúc 3 miền.",
        "Pass",
    ),
    (
        "TC-032",
        "Quản lý Config hệ thống, lý do NDR và MerchantProfile",
        "masterdata_db đang hoạt động; ADMIN có quyền cấu hình tham số nền.",
        "1. Gọi PATCH /configs cập nhật trần phát lại.\n2. Gọi POST /ndr-reasons thêm mã lý do.\n3. Gọi POST /merchant-profiles gán defaultHubCode.",
        "key: \"MAX_DELIVERY_ATTEMPTS\"=3\nNDR: \"NDR_07\"\nMerchant: hub \"003P001\", GPS (10.82, 106.68)",
        "Lưu tập trung Config, NdrReason và MerchantProfile; đồng bộ sự kiện cập nhật masterdata qua Outbox để các service kho/giao nhận dùng chung.",
        "Các controller Configs, NdrReasons, MerchantProfiles lưu đúng vào masterdata_db, phát sự kiện MasterdataOutbox và ghi nhận AdminAuditLog.",
        "Pass",
    ),
    (
        "TC-033",
        "Tạo Manifest bao hàng, chặn đơn trùng bao và đơn bị khóa",
        "manifest-service (:3005) & shipment-service (:3002) chạy; đơn SHP-01 hợp lệ, đơn SHP-LOCK đang isLocked=true.",
        "1. Gọi POST /manifests gán SHP-01.\n2. Gọi lại tạo bao khác chứa SHP-01.\n3. Thử gán đơn SHP-LOCK vào bao mới.",
        "manifestCode: \"MB003-2605-01\"\norigin: \"003P001\"\ndest: \"001N001\"\nshipments: [\"SHP-01\"]",
        "Bao tạo thành công với status CREATED; chặn gán trùng đơn vào bao đang mở (HTTP 409) và chặn đơn bị khóa sự cố (HTTP 400).",
        "ManifestsService tạo Manifest kèm ManifestItem, gọi shipment-service chặn đơn bị khóa (trừ RETURN_STARTED) và trả 409 khi SHP-01 đã thuộc bao active.",
        "Pass",
    ),
    (
        "TC-034",
        "Sinh mã bao hàng loạt và thêm/gỡ vận đơn khỏi bao",
        "OPS đang thao tác phân loại tại Hub 003P001; tồn tại bao ở trạng thái CREATED.",
        "1. Gọi POST /manifests/bags/generate (quantity=5).\n2. Thử sinh bao với origin=dest.\n3. Gọi /shipments/add và /shipments/remove (xả bao).",
        "originHubCode: \"003P001\"\ndestinationHubCode: \"001N001\"\nquantity: 5 (1..200)\nnote: \"EMPTY_BAG\"",
        "Sinh 5 mã bao chuẩn MB{3 số Hub}{4 số giờ}{001..005}; chặn origin=dest (400); add chỉ mở khi CREATED; remove phát sự kiện manifest.unsealed.",
        "Sinh đúng 5 bao tiền tố MB001..., trả 400 khi trùng Hub gửi/đích, chặn add nếu bao đã SEALED và ghi OpsAuditLog + Outbox khi gỡ/xả bao.",
        "Pass",
    ),
    (
        "TC-035",
        "Niêm phong bao hàng (Seal Manifest) và khóa chỉnh sửa",
        "Bao MB003-2605-01 đang ở trạng thái CREATED và đã chứa 12 vận đơn.",
        "1. Gọi POST /manifests/:id/seal kèm mã chì.\n2. Kiểm tra SealRecord & trạng thái bao.\n3. Thử gọi /shipments/add thêm đơn sau khi seal.",
        "sealedBy: \"ops_hub_hcm\"\nnote: \"SEAL-CAP-88210\"",
        "ManifestStateMachine chuyển CREATED → SEALED, lưu SealRecord, phát manifest.sealed qua Outbox, ghi OpsAuditLog và chặn thêm đơn mới.",
        "Bao chuyển SEALED kèm thời điểm sealedAt, lưu SealRecord, đẩy sự kiện manifest.sealed (Outbox), ghi MANIFEST_SEALED và trả 400 khi thử add thêm đơn.",
        "Pass",
    ),
    (
        "TC-036",
        "Xác nhận nhận bao hàng tại Hub đích (Receive Manifest)",
        "Bao MB003-2605-01 đang ở trạng thái SEALED vừa trung chuyển tới Hub đích 001N001.",
        "1. Đăng nhập OPS tại Hub đích 001N001.\n2. Gọi POST /manifests/:id/receive.\n3. Kiểm tra ReceiveRecord và trạng thái.",
        "receivedBy: \"ops_hub_hn\"\nprocessingHubCode: \"001N001\"\nnote: \"Nguyên chì, đủ 12 kiện\"",
        "canReceive xác nhận hợp lệ (CREATED/SEALED → RECEIVED), lưu ReceiveRecord, ghi MANIFEST_RECEIVED và phát manifest.received qua Outbox.",
        "Bao chuyển RECEIVED kèm receivedAt, tạo ReceiveRecord trong manifest_db, ghi OpsAuditLog và đẩy manifest.received đồng bộ tracking-service.",
        "Pass",
    ),
    (
        "TC-037",
        "Quét vật lý Pickup/Inbound/Outbound có Idempotency & chốt khóa",
        "scan-service (:3004) chạy; đơn SHP-01 hợp lệ; đơn SHP-LOCK bị khóa sự cố.",
        "1. Gọi POST /scans/inbound với idempotencyKey.\n2. Gửi lại đúng request trùng key.\n3. Quét OUTBOUND đơn SHP-LOCK vs quét INBOUND ghi chú INVENTORY_CHECK.",
        "shipmentCode: \"SHP-01\"\nlocationCode: \"003P001\"\nidempotencyKey: \"SCN-2605-99\"",
        "Lần 1 tạo ScanEvent + Outbox; lần 2 trùng key trả nguyên snapshot từ IdempotencyRecord (không trùng sự kiện); chặn đơn khóa trừ kiểm tồn.",
        "Khóa phạm vi scan.inbound:SCN-2605-99 ngăn ghi trùng thành công; trả 400 chặn đơn khóa khi OUTBOUND nhưng cho phép INBOUND kèm INVENTORY_CHECK.",
        "Pass",
    ),
    (
        "TC-038",
        "Cập nhật và truy vấn vị trí hiện tại của kiện hàng & bưu tá",
        "Đơn SHP-01 vừa hoàn tất quét INBOUND tại Hub 003P001; scan-service đang chạy.",
        "1. Gọi GET /locations/SHP-01.\n2. Gọi POST /locations/couriers/current cập nhật GPS.\n3. Gọi GET /locations/SHP-01/latest-position & /history.",
        "shipmentCode: \"SHP-01\"\ncourierId: \"CR-007\"\nGPS: (10.7769, 106.7009)",
        "Upsert CurrentLocation (source=SCAN), lưu CourierCurrentLocation & CourierLocationHistory, trả vị trí mới nhất và phát realtime WebSocket.",
        "LocationController trả đúng locationCode 003P001, lastScanType INBOUND, lịch sử GPS bưu tá đầy đủ và phát sự kiện qua LocationsRealtimeGateway.",
        "Pass",
    ),
    (
        "TC-039",
        "Tách riêng microservice Quản lý Đội xe đường trục (Linehaul Fleet)",
        "Đối chiếu kiến trúc hệ thống (14 microservices trong ecosystem.config.cjs & docker-compose).",
        "1. Kiểm tra danh sách services/ tìm linehaul-service.\n2. Kiểm tra DB riêng, route trên gateway-bff và cấu hình PM2/Docker.",
        "Phạm vi kiểm tra: services/*, ecosystem.config.cjs, gateway-bff routes",
        "Tồn tại microservice linehaul-service độc lập có source, cơ sở dữ liệu đội xe, routing gateway và cấu hình triển khai riêng.",
        "Nghiệp vụ đóng bao/seal/nhận bao đã gộp trong manifest-service (:3005); chưa tách microservice linehaul-service và DB quản lý đội xe độc lập.",
        "Fail",
    ),
    (
        "TC-040",
        "Vòng đời Xe đi/Xe đến/Seal xe & cảm biến GPS tích hợp backend",
        "Kiểm tra trang LinehaulVehicleSealPage và LinehaulTripManagementPage trên ops-web (:5173).",
        "1. Tạo chuyến xe LINEHAUL_TRIP trên ops-web.\n2. Kiểm tra dữ liệu gửi xuống backend và lưu trữ cục bộ.\n3. Kiểm tra luồng GPS xe tải liên tỉnh.",
        "tripCode: \"TR-HCM-HN-01\"\nvehiclePlate: \"51C-882.19\"\nsealCode: \"SEAL-LH-09\"",
        "Vòng đời Trip/Vehicle/Driver/Seal được lưu bảng riêng trên backend và đồng bộ tọa độ GPS thời gian thực từ thiết bị gắn xe tải.",
        "ops-web gọi POST /manifests, /seal, /receive đồng bộ vào manifest_db nhưng metadata chuyến xe lưu ghép trong trường note + localStorage và chưa tích hợp GPS phần cứng.",
        "Fail",
    ),
]


def add_soft_breaks(text, is_test_id=False):
    """Insert zero-width spaces at natural code boundaries so 10pt text wraps cleanly."""
    if is_test_id:
        return text  # TC-031..TC-040 (6 chars) fits on 1 single line at 10pt in 940 twips!
    text = re.sub(r"_(?=[A-Za-z0-9])", "_\u200b", text)
    text = re.sub(r"\.(?=[A-Za-z])", ".\u200b", text)
    text = re.sub(r"(?<=[A-Za-z])\(", "\u200b(", text)
    text = re.sub(r"/(?=[A-Za-z0-9:])", "/\u200b", text)

    def _split_camel(m):
        tok = m.group(0)
        if len(tok) >= 14:
            return re.sub(r"(?<=[a-z])(?=[A-Z])", "\u200b", tok)
        return tok

    text = re.sub(r"\b[A-Za-z][A-Za-z0-9]{13,}\b", _split_camel, text)
    return text


def set_black_borders(tbl):
    tblPr = tbl._tbl.tblPr
    old = tblPr.find(qn("w:tblBorders"))
    if old is not None:
        tblPr.remove(old)
    borders = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), "000000")
        borders.append(el)
    tblPr.append(borders)


def set_cell_margins(tbl, top=40, bottom=40, left=36, right=36):
    tblPr = tbl._tbl.tblPr
    old = tblPr.find(qn("w:tblCellMar"))
    if old is not None:
        tblPr.remove(old)
    mar = OxmlElement("w:tblCellMar")
    for side, val in (("top", top), ("bottom", bottom), ("left", left), ("right", right)):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tblPr.append(mar)


def configure_fixed_table(tbl):
    tblPr = tbl._tbl.tblPr
    for tag in ("w:tblStyle", "w:tblW", "w:tblLayout", "w:tblInd", "w:tblLook", "w:jc"):
        old = tblPr.find(qn(tag))
        if old is not None:
            tblPr.remove(old)

    tblW = OxmlElement("w:tblW")
    tblW.set(qn("w:w"), str(sum(COL_WIDTHS)))
    tblW.set(qn("w:type"), "dxa")
    tblPr.append(tblW)

    tblInd = OxmlElement("w:tblInd")
    tblInd.set(qn("w:w"), "0")
    tblInd.set(qn("w:type"), "dxa")
    tblPr.append(tblInd)

    tblLayout = OxmlElement("w:tblLayout")
    tblLayout.set(qn("w:type"), "fixed")
    tblPr.append(tblLayout)

    old_grid = tbl._tbl.find(qn("w:tblGrid"))
    if old_grid is not None:
        tbl._tbl.remove(old_grid)
    grid = OxmlElement("w:tblGrid")
    for w in COL_WIDTHS:
        gc = OxmlElement("w:gridCol")
        gc.set(qn("w:w"), str(w))
        grid.append(gc)
    tblPr.addnext(grid)

    set_black_borders(tbl)
    set_cell_margins(tbl, top=40, bottom=40, left=36, right=36)


def populate_cell(tc, text, col_w, is_header=False, center=False, is_test_id=False, is_fail=False):
    tcPr = tc.find(qn("w:tcPr"))
    if tcPr is None:
        tcPr = OxmlElement("w:tcPr")
        tc.insert(0, tcPr)
    for tag in ("w:tcW", "w:shd", "w:vAlign", "w:tcMar"):
        old = tcPr.find(qn(tag))
        if old is not None:
            tcPr.remove(old)
    tcW = OxmlElement("w:tcW")
    tcW.set(qn("w:w"), str(col_w))
    tcW.set(qn("w:type"), "dxa")
    tcPr.append(tcW)

    vAlign = OxmlElement("w:vAlign")
    vAlign.set(qn("w:val"), "center" if is_header else "top")
    tcPr.append(vAlign)

    if is_header:
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear")
        shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), "F2F4F8")
        tcPr.append(shd)

    for child in list(tc):
        if child.tag == qn("w:p"):
            tc.remove(child)

    if not is_header:
        text = add_soft_breaks(text, is_test_id=is_test_id)

    lines = text.split("\n")
    for idx_l, line in enumerate(lines):
        p = OxmlElement("w:p")
        pPr = OxmlElement("w:pPr")
        ind = OxmlElement("w:ind")
        ind.set(qn("w:left"), "0")
        ind.set(qn("w:right"), "0")
        ind.set(qn("w:firstLine"), "0")
        pPr.append(ind)
        sp = OxmlElement("w:spacing")
        sp.set(qn("w:before"), "0")
        sp.set(qn("w:after"), "24" if idx_l < len(lines) - 1 else "0")
        sp.set(qn("w:line"), "230")
        sp.set(qn("w:lineRule"), "auto")
        pPr.append(sp)
        jc = OxmlElement("w:jc")
        jc.set(qn("w:val"), "center" if (is_header or center) else "left")
        pPr.append(jc)
        p.append(pPr)

        r = OxmlElement("w:r")
        rPr = OxmlElement("w:rPr")
        rf = OxmlElement("w:rFonts")
        rf.set(qn("w:ascii"), "Times New Roman")
        rf.set(qn("w:hAnsi"), "Times New Roman")
        rf.set(qn("w:cs"), "Times New Roman")
        rPr.append(rf)
        if is_header or is_fail:
            rPr.append(OxmlElement("w:b"))
        rPr.append(OxmlElement("w:noProof"))
        sz = OxmlElement("w:sz")
        sz.set(qn("w:val"), "20")  # 10pt Times New Roman
        rPr.append(sz)
        szCs = OxmlElement("w:szCs")
        szCs.set(qn("w:val"), "20")
        rPr.append(szCs)
        col = OxmlElement("w:color")
        col.set(qn("w:val"), "B91C1C" if is_fail else "000000")
        rPr.append(col)
        r.append(rPr)

        t = OxmlElement("w:t")
        if line.startswith(" ") or line.endswith(" "):
            t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        t.text = line
        r.append(t)
        p.append(r)
        tc.append(p)


def rebuild_6col_to_8col(tbl, rows_data):
    """Replace all rows of tbl with a clean 8-column header + rows_data."""
    # Remove all existing <w:tr> rows so column count shifts cleanly from 6 -> 8
    for tr in list(tbl._tbl.findall(qn("w:tr"))):
        tbl._tbl.remove(tr)

    configure_fixed_table(tbl)

    # Header row
    hdr_tr = OxmlElement("w:tr")
    hdr_trPr = OxmlElement("w:trPr")
    hdr_trPr.append(OxmlElement("w:tblHeader"))
    hdr_trPr.append(OxmlElement("w:cantSplit"))
    hdr_tr.append(hdr_trPr)
    for ci, h_txt in enumerate(HEADERS):
        tc = OxmlElement("w:tc")
        populate_cell(tc, h_txt, COL_WIDTHS[ci], is_header=True)
        hdr_tr.append(tc)
    tbl._tbl.append(hdr_tr)

    # Data rows
    for row_tuple in rows_data:
        tr = OxmlElement("w:tr")
        trPr = OxmlElement("w:trPr")
        trPr.append(OxmlElement("w:cantSplit"))
        tr.append(trPr)
        for ci, val in enumerate(row_tuple):
            tc = OxmlElement("w:tc")
            populate_cell(
                tc,
                val,
                COL_WIDTHS[ci],
                is_header=False,
                center=(ci in (0, 7)),
                is_test_id=(ci == 0),
                is_fail=(ci == 7 and val.lower() == "fail"),
            )
            tr.append(tc)
        tbl._tbl.append(tr)


def main():
    assert os.path.exists(DOC_PATH), f"Missing {DOC_PATH}"
    doc = docx.Document(DOC_PATH)
    tbl = doc.tables[TARGET_TABLE_INDEX]
    first_id = tbl.rows[1].cells[0].text.strip()
    assert first_id == "TC-031", f"Expected TABLE[{TARGET_TABLE_INDEX}] to start with TC-031, got {first_id!r}"

    rebuild_6col_to_8col(tbl, LEVEL4_ROWS)
    doc.save(DOC_PATH)
    print(f"[OK] Upgraded LEVEL 4 TABLE[{TARGET_TABLE_INDEX}] ({len(LEVEL4_ROWS)} test cases: TC-031..TC-040) -> 8-col 10pt 9072-twip fixed format!")


if __name__ == "__main__":
    main()
