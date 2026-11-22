#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE STANDARD UML 2.5 USE CASE DIAGRAMS DIRECTLY IN VISUAL PARADIGM (Nexus.vpp)
===================================================================================
1. Master System Use Cases - Overview (02. Master System Use Cases - Overview)
2. 6 Actor-Specific Use Case Diagrams:
   - 03. Use Case - Actor Khách Vãng Lai (Guest)
   - 04. Use Case - Actor Người Gửi Hàng (Merchant)
   - 05. Use Case - Actor Nhân Viên Giao Hàng (Courier)
   - 06. Use Case - Actor Nhân Viên Vận Hành (Ops Staff)
   - 07. Use Case - Actor Khách Hàng Cá Nhân (Customer C-End)
   - 08. Use Case - Actor Quản Trị Viên (System Admin)
"""

import sqlite3
import os
import shutil
import subprocess

VPP_PATH = '/Users/Tai.IS/Documents/VPProjects/Nexus.vpp'
BACKUP_PATH = '/Users/Tai.IS/Documents/VPProjects/Nexus.vpp.backup_before_uc_standard'
EXPORT_DIR = '/Users/Tai.IS/Documents/VPProjects/exported_diagrams_v2'
os.makedirs(EXPORT_DIR, exist_ok=True)

def backup_db():
    if not os.path.exists(BACKUP_PATH):
        shutil.copyfile(VPP_PATH, BACKUP_PATH)
        print(f"Backed up {VPP_PATH} to {BACKUP_PATH}")

def get_connection():
    return sqlite3.connect(VPP_PATH)

def escape_str(s):
    if not s: return ""
    return s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '')

def update_canonical_model_elements(cur):
    """Cập nhật tên sạch chuẩn 100% trong MODEL_ELEMENT, triệt tiêu mọi Mojibake/lỗi font"""
    canonical_names = {
        # Actor
        'YosxTwWD.AAAAQuH': 'Khách Vãng Lai (Guest)',
        'YosxTwWD.AAAAQuI': 'Khách Hàng Cá Nhân (Customer)',
        '4osxTwWD.AAAAQuK': 'Người Gửi Hàng (Merchant)',
        'EosxTwWD.AAAAQuL': 'Nhân Viên Vận Hành (Ops Staff)',
        'EosxTwWD.AAAAQuN': 'Nhân Viên Giao Hàng (Courier)',
        'EosxTwWD.AAAAQuO': 'Quản Trị Viên (System Admin)',

        # Subsystems
        'UosxTwWD.AAAAQuW': 'Phân Hệ 1: Tiếp Nhận & Quản Lý Đơn Hàng (shipment • pickup)',
        'sosxTwWD.AAAAQup': 'Phân Hệ 2: Bưu Cục, Điều Phối & Trung Chuyển (scan • manifest • dispatch)',
        'iosxTwWD.AAAAQvA': 'Phân Hệ 3: Giao Hàng Chặng Cuối & Xử Lý Sự Cố (delivery • ndr • return)',
        'KosxTwWD.AAAAQvR': 'Phân Hệ 4: Tài Chính, Thu Hộ COD & Đối Soát (finance • payment • cod)',
        'aosxTwWD.AAAAQvd': 'Phân Hệ 5: Trợ Lý AI Logistics RAG & Tra Cứu Hành Trình (ai • tracking • pricing)',
        'WosxTwWD.AAAAQv7': 'Phân Hệ 6: Quản Trị Hệ Thống, RBAC & Cấu Hình (masterdata • admin • rbac)',
        'kosxTwWD.AAAAQuQ': 'Cổng Xác Thực & Bảo Mật Hệ Thống (Central Identity Provider IdP)',

        # Use cases Phân hệ 1
        'UosxTwWD.AAAAQuZ': 'UC-ORD-01: Tạo đơn hàng',
        '0osxTwWD.AAAAQub': 'UC-ORD-02: Tạo đơn gửi bưu phẩm cá nhân',
        '0osxTwWD.AAAAQud': 'UC-ORD-03: Tra cứu trạng thái bưu kiện',
        '0osxTwWD.AAAAQuf': 'UC-ORD-04: Quản lý danh sách đơn hàng',
        '0osxTwWD.AAAAQug': 'UC-ORD-05: Yêu cầu đổi thông tin giao',
        'MosxTwWD.AAAAQui': 'UC-ORD-06: In nhãn đơn',
        'MosxTwWD.AAAAQuh': 'UC-ORD-07: Hủy đơn hàng chưa lấy',
        'MosxTwWD.AAAAQuj': 'UC-ORD-08: In nhiều vận đơn hàng loạt',
        'MosxTwWD.AAAAQul': 'UC-ORD-09: Gán nhãn Hàng Dễ Vỡ [FRAGILE]',
        'sosxTwWD.AAAAQun': 'UC-ORD-10: Quản lý địa chỉ mặc định',
        'sosxTwWD.AAAAQuo': 'UC-ORD-11: Quản lý yêu cầu lấy hàng',
        'UosxTwWD.AAAAQuX': 'UC-ORD-BASE: Tạo đơn gửi bưu phẩm',

        # Phân hệ 2
        'sosxTwWD.AAAAQuq': 'UC-HUB-01: Giám sát Dashboard vận hành',
        'cosxTwWD.AAAAQus': 'UC-HUB-02: Tạo đơn hàng tại quầy (POS)',
        'cosxTwWD.AAAAQur': 'UC-HUB-03: Tra cứu hành trình đơn',
        'cosxTwWD.AAAAQut': 'UC-HUB-04: Đóng bao',
        'iosxTwWD.AAAAQu9': 'UC-HUB-05: Gỡ bao',
        '8osxTwWD.AAAAQu1': 'UC-HUB-06: Quản lý chuyến xe tải',
        'CosxTwWD.AAAAQu5': 'UC-HUB-07: Quét xe đi (Outbound)',
        'iosxTwWD.AAAAQu7': 'UC-HUB-08: Quét xe đến (Inbound)',
        'CosxTwWD.AAAAQu4': 'UC-HUB-09: Quản lý tem bao',
        '8osxTwWD.AAAAQux': 'UC-HUB-10: Điều phối đơn hàng lấy & phát',
        '8osxTwWD.AAAAQu0': 'UC-HUB-11: Quản lý tem niêm phong seal',
        'iosxTwWD.AAAAQu_': 'UC-HUB-12: Gửi hàng & Nhận hàng bưu cục',
        'cosxTwWD.AAAAQuv': 'UC-HUB-13: Phê duyệt yêu cầu lấy hàng Pickup',

        # Phân hệ 3
        'SosxTwWD.AAAAQvB': 'UC-DEL-01: Quản lý danh sách nhiệm vụ ngày',
        '8osxTwWD.AAAAQuy': 'UC-DEL-02: Xác nhận lấy hàng',
        'SosxTwWD.AAAAQvE': 'UC-DEL-03: Liên hệ người nhận',
        'yosxTwWD.AAAAQvG': 'UC-DEL-04: Chụp ảnh bằng chứng POD',
        'SosxTwWD.AAAAQvF': 'UC-DEL-05: Xác thực mã OTP phát hàng',
        'yosxTwWD.AAAAQvH': 'UC-DEL-06: Xác nhận phát thành công',
        'yosxTwWD.AAAAQvK': 'UC-DEL-07: Báo cáo sự cố phát thất bại',
        'KosxTwWD.AAAAQvM': 'UC-DEL-08: Hẹn lại ngày phát (Reschedule)',
        'KosxTwWD.AAAAQvO': 'UC-DEL-09: Xử lý sự cố giao thất bại (NDR)',
        'KosxTwWD.AAAAQvQ': 'UC-DEL-10: Quản lý chuyển hoàn (Return)',

        # Phân hệ 4
        'KosxTwWD.AAAAQvS': 'UC-FIN-01: Thu hộ tiền mặt COD',
        'qosxTwWD.AAAAQvT': 'UC-FIN-02: Nộp tiền COD qua VietQR',
        'qosxTwWD.AAAAQvV': 'UC-FIN-03: Giám sát hạn mức công nợ',
        'qosxTwWD.AAAAQvX': 'UC-FIN-04: Quản lý tài chính & Đối soát COD',
        'qosxTwWD.AAAAQvY': 'UC-FIN-05: Lịch sử đối soát SePay/VietQR',
        'qosxTwWD.AAAAQvZ': 'UC-FIN-06: Khớp nối SePay & Khấu trừ tự động',
        'aosxTwWD.AAAAQvb': 'UC-FIN-07: Khấu trừ cước hoàn phân tầng',

        # Phân hệ 5
        'aosxTwWD.AAAAQvf': 'UC-GST-01: Tra cứu trạng thái bưu kiện',
        '6osxTwWD.AAAAQvh': 'UC-CUS-06: Tra cứu đơn hàng',
        '6osxTwWD.AAAAQvj': 'UC-MER-08: Tra cứu vận đơn',
        '6osxTwWD.AAAAQvl': 'UC-GST-03: Ước tính cước',
        'GosxTwWD.AAAAQvo': 'UC-GST-04: Trợ lý AI Tra cứu (Chatbot)',
        'GosxTwWD.AAAAQvn': 'UC-AI-03: Động cơ cước chuẩn IATA V/6000',
        'mosxTwWD.AAAAQvv': 'UC-GST-05: Tìm kiếm bưu cục',
        'mosxTwWD.AAAAQvt': 'UC-AI-05c: Tra cứu danh mục hàng cấm gửi',
        'mosxTwWD.AAAAQvu': 'UC-AI-05d: Chính sách bồi thường Điều 25',
        'mosxTwWD.AAAAQvw': 'UC-AI-06: Truy xuất tri thức Hybrid RAG',

        # Phân hệ 6
        '2osxTwWD.AAAAQv8': 'UC-ADM-01: Giám sát tổng quan hệ thống',
        '2osxTwWD.AAAAQwC': 'UC-ADM-04: Quản lý mạng lưới bưu cục',
        '2osxTwWD.AAAAQwE': 'UC-ADM-05: Quản lý Hub',
        'OosxTwWD.AAAAQwG': 'UC-ADM-06: Quản lý Zone',
        'OosxTwWD.AAAAQwF': 'UC-ADM-07: Cấu hình lỗi vận chuyển (NDR)',
        'OosxTwWD.AAAAQwH': 'UC-ADM-08: Cấu hình điều khoản và dịch vụ',
        '2osxTwWD.AAAAQv_': 'UC-ADM-09: Quản lý tài khoản Ops',
        '2osxTwWD.AAAAQwA': 'UC-ADM-10: Quản lý tài khoản Courier',
        'OosxTwWD.AAAAQwI': 'UC-ADM-11: Quản lý tài khoản Merchant',
        'OosxTwWD.AAAAQwK': 'UC-ADM-12: Quản lý tài khoản Khách hàng',
        '2osxTwWD.AAAAQv.': 'UC-ADM-13: Phân quyền Mobile',
        'OosxTwWD.AAAAQwJ': 'UC-ADM-14: Kiểm toán nhật ký hệ thống',

        # Central Auth
        'kosxTwWD.AAAAQuR': 'UC-AUTH-01: Đăng nhập hệ thống (Core Auth)',
        'UosxTwWD.AAAAQuV': 'UC-AUTH-03: Quản lý hồ sơ',
        'kosxTwWD.AAAAQuT': 'UC-AUTH-02: Đăng xuất'
    }

    updated = 0
    for mid, mname in canonical_names.items():
        cur.execute('UPDATE MODEL_ELEMENT SET NAME=? WHERE ID=?', (mname, mid))
        if cur.rowcount > 0:
            updated += 1
    print(f"Normalized {updated} MODEL_ELEMENT records to canonical UTF-8 names.")

def build_master_usecase_diagram(cur):
    """
    XÂY DỰNG SƠ ĐỒ USE CASE TỔNG QUÁT:
    - 6 Actors: 4 bên cánh trái, 2 bên cánh phải.
    - 6 Packages phân hệ + 1 Package Central Auth ở giữa.
    - All UseCases phân bổ khoa học, zero overlap, chuẩn UML 2.5.
    """
    diag_id = 'diag_uc_master.'
    diag_name = '02. Master System Use Cases - Overview'

    # Xóa các element cũ của diagram này
    cur.execute('DELETE FROM DIAGRAM_ELEMENT WHERE DIAGRAM_ID=?', (diag_id,))
    cur.execute('DELETE FROM DIAGRAM WHERE ID=?', (diag_id,))

    child_shapes = []
    de_rows = []
    shape_counter = 0

    def make_id(prefix):
        nonlocal shape_counter
        shape_counter += 1
        return f"{prefix[:4]}_{diag_id[-4:]}_{shape_counter:04d}."[:16]

    # 1. Actors definition
    # Left flank: Merchant, Guest, Customer, Admin
    # Right flank: Ops Staff, Courier
    actors_info = [
        # (actor_id, de_id, name, x, y)
        ('4osxTwWD.AAAAQuK', make_id('sh_act_mer'), 'Người Gửi Hàng\n(Merchant)', 80, 200),
        ('YosxTwWD.AAAAQuH', make_id('sh_act_gst'), 'Khách Vãng Lai\n(Guest)', 80, 800),
        ('YosxTwWD.AAAAQuI', make_id('sh_act_cus'), 'Khách Hàng Cá Nhân\n(Customer)', 80, 1400),
        ('EosxTwWD.AAAAQuO', make_id('sh_act_adm'), 'Quản Trị Viên\n(System Admin)', 80, 2000),
        ('EosxTwWD.AAAAQuL', make_id('sh_act_ops'), 'Nhân Viên Vận Hành\n(Ops Staff)', 2800, 250),
        ('EosxTwWD.AAAAQuN', make_id('sh_act_drv'), 'Nhân Viên Giao Hàng\n(Courier)', 2800, 1350),
    ]

    actor_map = {}
    for aid, de_id, aname, ax, ay in actors_info:
        aw, ah = 70, 95
        adef = f'''{de_id}:"{escape_str(aname)}":Actor {{
	parentConnectorHeaderLength=40;
	background=(224, 242, 254, 255);
	foreground=(30, 58, 138, 255);
	width={aw};
	height={ah};
	connectToPoint=T;
	x={ax};
	y={ay};
	metaModelElement=<{aid}>;
	_elementFont=(
		@name="Dialog";, 
		@color=(30, 58, 138, 255);, 
		@size=11;, 
		@style=1;
	);
}}'''
        child_shapes.append(f'<{diag_id}:{de_id}>')
        de_rows.append((de_id, 'Actor', diag_id, aid, None, None, None, adef.encode('utf-8')))
        actor_map[aid] = (de_id, ax, ay, aw, ah)

    # 2. Packages definition & Use Cases inside Packages
    # Grid of Subsystems:
    # Row 1: Pkg 1 (X=360, Y=80, W=1120, H=640), Pkg 2 (X=1560, Y=80, W=1150, H=640)
    # Row 2: Central Auth (X=960, Y=760, W=960, H=340)
    # Row 3: Pkg 4 (X=360, Y=1150, W=1120, H=620), Pkg 3 (X=1560, Y=1150, W=1150, H=620)
    # Row 4: Pkg 5 (X=360, Y=1820, W=1120, H=680), Pkg 6 (X=1560, Y=1820, W=1150, H=680)

    packages_spec = [
        # (pkg_id, name, x, y, w, h, bg_color, fg_color, [use_case_ids])
        (
            'UosxTwWD.AAAAQuW',
            'Phân Hệ 1: Tiếp Nhận & Quản Lý Đơn Hàng (shipment • pickup)',
            360, 80, 1120, 640,
            (254, 243, 199), (146, 64, 14), # amber
            [
                'UosxTwWD.AAAAQuZ', '0osxTwWD.AAAAQub', '0osxTwWD.AAAAQud',
                '0osxTwWD.AAAAQuf', '0osxTwWD.AAAAQug', 'MosxTwWD.AAAAQui',
                'MosxTwWD.AAAAQuh', 'MosxTwWD.AAAAQuj', 'MosxTwWD.AAAAQul',
                'sosxTwWD.AAAAQun', 'sosxTwWD.AAAAQuo', 'UosxTwWD.AAAAQuX'
            ]
        ),
        (
            'sosxTwWD.AAAAQup',
            'Phân Hệ 2: Bưu Cục, Điều Phối & Trung Chuyển (scan • manifest • dispatch)',
            1560, 80, 1150, 640,
            (236, 253, 245), (6, 95, 70), # mint
            [
                'sosxTwWD.AAAAQuq', 'cosxTwWD.AAAAQus', 'cosxTwWD.AAAAQur',
                'cosxTwWD.AAAAQut', 'iosxTwWD.AAAAQu9', '8osxTwWD.AAAAQu1',
                'CosxTwWD.AAAAQu5', 'iosxTwWD.AAAAQu7', 'CosxTwWD.AAAAQu4',
                '8osxTwWD.AAAAQux', '8osxTwWD.AAAAQu0', 'iosxTwWD.AAAAQu_',
                'cosxTwWD.AAAAQuv'
            ]
        ),
        (
            'kosxTwWD.AAAAQuQ',
            'Cổng Xác Thực & Bảo Mật Hệ Thống (Central Identity Provider IdP)',
            960, 760, 960, 340,
            (238, 242, 255), (67, 56, 202), # indigo
            [
                'kosxTwWD.AAAAQuR', 'kosxTwWD.AAAAQuT', 'UosxTwWD.AAAAQuV'
            ]
        ),
        (
            'KosxTwWD.AAAAQvR',
            'Phân Hệ 4: Tài Chính, Thu Hộ COD & Đối Soát (finance • payment • cod)',
            360, 1150, 1120, 620,
            (255, 241, 242), (159, 18, 57), # rose
            [
                'KosxTwWD.AAAAQvS', 'qosxTwWD.AAAAQvT', 'qosxTwWD.AAAAQvV',
                'qosxTwWD.AAAAQvX', 'qosxTwWD.AAAAQvY', 'qosxTwWD.AAAAQvZ',
                'aosxTwWD.AAAAQvb'
            ]
        ),
        (
            'iosxTwWD.AAAAQvA',
            'Phân Hệ 3: Giao Hàng Chặng Cuối & Xử Lý Sự Cố (delivery • ndr • return)',
            1560, 1150, 1150, 620,
            (240, 249, 255), (3, 105, 161), # sky
            [
                'SosxTwWD.AAAAQvB', '8osxTwWD.AAAAQuy', 'SosxTwWD.AAAAQvE',
                'yosxTwWD.AAAAQvG', 'SosxTwWD.AAAAQvF', 'yosxTwWD.AAAAQvH',
                'yosxTwWD.AAAAQvK', 'KosxTwWD.AAAAQvM', 'KosxTwWD.AAAAQvO',
                'KosxTwWD.AAAAQvQ'
            ]
        ),
        (
            'aosxTwWD.AAAAQvd',
            'Phân Hệ 5: Trợ Lý AI Logistics RAG & Tra Cứu Hành Trình (ai • tracking • pricing)',
            360, 1820, 1120, 680,
            (245, 243, 255), (107, 33, 168), # purple
            [
                'aosxTwWD.AAAAQvf', '6osxTwWD.AAAAQvh', '6osxTwWD.AAAAQvj',
                '6osxTwWD.AAAAQvl', 'GosxTwWD.AAAAQvo', 'GosxTwWD.AAAAQvn',
                'mosxTwWD.AAAAQvv', 'mosxTwWD.AAAAQvt', 'mosxTwWD.AAAAQvu',
                'mosxTwWD.AAAAQvw'
            ]
        ),
        (
            'WosxTwWD.AAAAQv7',
            'Phân Hệ 6: Quản Trị Hệ Thống, RBAC & Cấu Hình (masterdata • admin • rbac)',
            1560, 1820, 1150, 680,
            (241, 245, 249), (51, 65, 85), # slate
            [
                '2osxTwWD.AAAAQv8', '2osxTwWD.AAAAQwC', '2osxTwWD.AAAAQwE',
                'OosxTwWD.AAAAQwG', 'OosxTwWD.AAAAQwF', 'OosxTwWD.AAAAQwH',
                '2osxTwWD.AAAAQv_', '2osxTwWD.AAAAQwA', 'OosxTwWD.AAAAQwI',
                'OosxTwWD.AAAAQwK', '2osxTwWD.AAAAQv.', 'OosxTwWD.AAAAQwJ'
            ]
        )
    ]

    uc_shape_map = {} # uid -> (de_id, ux, uy, uw, uh, pid)

    for pid, pname, px, py, pw, ph, bg_rgb, fg_rgb, uc_ids in packages_spec:
        # Create Package Shape
        pkg_de = make_id('sh_pkg')
        pdef = f'''{pkg_de}:"{escape_str(pname)}":Package {{
	parentConnectorHeaderLength=40;
	background=(
		{bg_rgb[0]}, 
		{bg_rgb[1]}, 
		{bg_rgb[2]}, 
		255
	);
	foreground=(
		{fg_rgb[0]}, 
		{fg_rgb[1]}, 
		{fg_rgb[2]}, 
		255
	);
	width={pw};
	height={ph};
	x={px};
	y={py};
	metaModelElement=<{pid}>;
	_elementFont=(
		@name="Dialog";, 
		@color=(
			{fg_rgb[0]}, 
			{fg_rgb[1]}, 
			{fg_rgb[2]}, 
			255
		);, 
		@size=12;, 
		@style=1;
	);
}}'''
        child_shapes.append(f'<{diag_id}:{pkg_de}>')
        de_rows.append((pkg_de, 'Package', diag_id, pid, None, None, None, pdef.encode('utf-8')))

        # Arrange Use Cases in 3 columns inside the package
        cols = 3 if pw >= 1000 else 2
        col_w = 260
        row_h = 75
        pad_x = 35
        pad_y = 65

        for u_idx, uid in enumerate(uc_ids):
            # Query name from DB
            row = cur.execute('SELECT NAME FROM MODEL_ELEMENT WHERE ID=?', (uid,)).fetchone()
            uname = row[0] if row else f"UC {uid}"

            col = u_idx % cols
            row_idx = u_idx // cols
            ux = px + pad_x + col * (col_w + 30)
            uy = py + pad_y + row_idx * (row_h + 20)
            uw = col_w
            uh = row_h

            uc_de = make_id('sh_uc')
            uc_def = f'''{uc_de}:"{escape_str(uname)}":UseCase {{
	parentConnectorHeaderLength=40;
	background=(255, 255, 255, 255);
	foreground=(15, 23, 42, 255);
	width={uw};
	height={uh};
	connectToPoint=T;
	x={ux};
	y={uy};
	metaModelElement=<{pid}:{uid}>;
	_elementFont=(
		@name="Dialog";, 
		@color=(15, 23, 42, 255);, 
		@size=10;, 
		@style=0;
	);
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.2;, 
		@color=(
			{fg_rgb[0]}, 
			{fg_rgb[1]}, 
			{fg_rgb[2]}, 
			255
		);, 
		@hasStroke=T;
	);
}}'''
            child_shapes.append(f'<{diag_id}:{uc_de}>')
            de_rows.append((uc_de, 'UseCase', diag_id, uid, None, None, None, uc_def.encode('utf-8')))
            uc_shape_map[uid] = (uc_de, ux, uy, uw, uh, pid)

    # 3. Connectors: Associations from Actors to Primary Use Cases
    # Each Actor connects cleanly to representative entry Use Cases
    associations = [
        # Merchant connections
        ('4osxTwWD.AAAAQuK', ['UosxTwWD.AAAAQuZ', '0osxTwWD.AAAAQuf', 'MosxTwWD.AAAAQui', 'sosxTwWD.AAAAQuo', 'KosxTwWD.AAAAQvX']),
        # Guest connections
        ('YosxTwWD.AAAAQuH', ['aosxTwWD.AAAAQvf', '6osxTwWD.AAAAQvl', 'GosxTwWD.AAAAQvo', 'mosxTwWD.AAAAQvv']),
        # Customer connections
        ('YosxTwWD.AAAAQuI', ['0osxTwWD.AAAAQub', '6osxTwWD.AAAAQvh', 'sosxTwWD.AAAAQun', 'GosxTwWD.AAAAQvo']),
        # Admin connections
        ('EosxTwWD.AAAAQuO', ['2osxTwWD.AAAAQv8', '2osxTwWD.AAAAQwC', '2osxTwWD.AAAAQwE', 'OosxTwWD.AAAAQwG', 'OosxTwWD.AAAAQwF', '2osxTwWD.AAAAQv_']),
        # Ops Staff connections
        ('EosxTwWD.AAAAQuL', ['sosxTwWD.AAAAQuq', 'cosxTwWD.AAAAQus', 'cosxTwWD.AAAAQut', '8osxTwWD.AAAAQu1', 'CosxTwWD.AAAAQu5', 'KosxTwWD.AAAAQvO', 'qosxTwWD.AAAAQvX']),
        # Courier connections
        ('EosxTwWD.AAAAQuN', ['SosxTwWD.AAAAQvB', '8osxTwWD.AAAAQuy', 'yosxTwWD.AAAAQvG', 'yosxTwWD.AAAAQvH', 'yosxTwWD.AAAAQvK', 'KosxTwWD.AAAAQvS', 'qosxTwWD.AAAAQvT'])
    ]

    for aid, target_uids in associations:
        act_de, ax, ay, aw, ah = actor_map[aid]
        act_cx = ax + aw // 2
        act_cy = ay + ah // 2
        for uid in target_uids:
            if uid not in uc_shape_map: continue
            uc_de, ux, uy, uw, uh, pid = uc_shape_map[uid]
            uc_cx = ux + uw // 2
            uc_cy = uy + uh // 2

            asc_de = make_id('sh_asc')
            asc_def = f'''{asc_de}:NULL:Association {{
	foreground=(148, 163, 184, 255);
	fromPinType=1;
	toPinType=1;
	useFromShapeCenter=T;
	useToShapeCenter=T;
	_points="{act_cx},{act_cy};{uc_cx},{uc_cy};";
	_fromShape=<{diag_id}:{act_de}>;
	_toShape=<{diag_id}:{uc_de}>;
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.2;, 
		@color=(100, 116, 139, 255);, 
		@hasStroke=T;
	);
}}'''
            child_shapes.append(f'<{diag_id}:{asc_de}>')
            de_rows.append((asc_de, 'Association', diag_id, None, None, None, None, asc_def.encode('utf-8')))

    # 4. Dependency «include» to Central Auth
    core_auth_uid = 'kosxTwWD.AAAAQuR' # UC-AUTH-01
    if core_auth_uid in uc_shape_map:
        auth_de, ax, ay, aw, ah, _ = uc_shape_map[core_auth_uid]
        auth_cx = ax + aw // 2
        auth_cy = ay + ah // 2

        included_from = [
            'UosxTwWD.AAAAQuZ', # Merchant Tạo đơn
            'sosxTwWD.AAAAQuq', # Ops Dashboard
            'SosxTwWD.AAAAQvB', # Courier Nhiệm vụ
            '2osxTwWD.AAAAQv8', # Admin Giám sát
        ]

        for f_uid in included_from:
            if f_uid not in uc_shape_map: continue
            from_de, fx, fy, fw, fh, _ = uc_shape_map[f_uid]
            fcx = fx + fw // 2
            fcy = fy + fh // 2

            dep_de = make_id('sh_dep')
            dep_def = f'''{dep_de}:"include":Dependency {{
	foreground=(79, 70, 229, 255);
	fromPinType=1;
	toPinType=1;
	useFromShapeCenter=T;
	useToShapeCenter=T;
	_points="{fcx},{fcy};{auth_cx},{auth_cy};";
	_fromShape=<{diag_id}:{from_de}>;
	_toShape=<{diag_id}:{auth_de}>;
	_elementFont=(
		@name="Dialog";, 
		@color=(79, 70, 229, 255);, 
		@size=10;, 
		@style=2;
	);
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.0;, 
		@color=(99, 102, 241, 255);, 
		@hasStroke=T;
	);
}}'''
            de_rows.append((dep_de, 'Dependency', diag_id, None, None, None, None, dep_def.encode('utf-8')))

    children_str = ', \n\t\t'.join(child_shapes)
    diag_def = f'''{diag_id}:"{diag_name}":UseCaseDiagram {{
	paintConnectorThroughLabel=1;
	_shapeGroups=NULL;
	diagramBackground=(255, 255, 255, 255);
	connectorLabelOrientation=0;
	showPackageNameStyle=0;
	showDefaultPackage=F;
	pointConnectorEndToCompartmentMember=T;
	showUseCaseExtensionPoint=T;
	autoFitShapesSize=F;
	showDiagramFrame=T;
	connectorStyle=1;
	creationTime=1790775686767;
	pmAuthor="Tai.IS";
	Child=(
		{children_str}
	);
	modelElementNameAlignment=4;
	connectorLineJumps=0;
	showUseCaseId=F;
}}'''

    cur.execute('INSERT INTO DIAGRAM (ID, DIAGRAM_TYPE, NAME, DEFINITION) VALUES (?, ?, ?, ?)',
                (diag_id, 'UseCaseDiagram', diag_name, diag_def.encode('utf-8')))
    cur.executemany('INSERT INTO DIAGRAM_ELEMENT (ID, SHAPE_TYPE, DIAGRAM_ID, MODEL_ELEMENT_ID, COMPOSITE_MODEL_ELEMENT_ADDRESS, REF_MODEL_ELEMENT_ADDRESS, PARENT_ID, DEFINITION) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', de_rows)
    print(f"Generated {diag_name}: {len(child_shapes)} shapes + {len(de_rows)-len(child_shapes)} connectors.")


def build_actor_usecase_diagram(cur, diag_id, diag_name, actor_id, actor_name, boundary_title, use_cases, bg_color=(239, 246, 255), fg_color=(30, 58, 138)):
    """
    Xây dựng sơ đồ Use Case theo từng Actor riêng lẻ:
    - Actor ở cánh trái.
    - System Boundary Package ở giữa.
    - Use cases bố trí 2 cột: Cột 1 (Nghiệp vụ cốt lõi), Cột 2 (Phụ trợ / Included / Extended).
    - Associations từ Actor tới các Use Case nghiệp vụ.
    - Dependencies «include» tới Auth / các tính năng liên quan.
    """
    cur.execute('DELETE FROM DIAGRAM_ELEMENT WHERE DIAGRAM_ID=?', (diag_id,))
    cur.execute('DELETE FROM DIAGRAM WHERE ID=?', (diag_id,))

    child_shapes = []
    de_rows = []
    shape_counter = 0

    def make_id(prefix):
        nonlocal shape_counter
        shape_counter += 1
        return f"{prefix[:4]}_{diag_id[-4:]}_{shape_counter:04d}."[:16]

    # Calculate height based on number of use cases
    n_ucs = len(use_cases)
    n_rows = (n_ucs + 1) // 2
    box_h = max(650, n_rows * 95 + 130)
    box_w = 780
    act_y = box_h // 2 - 40

    # 1. Actor Shape
    act_de = make_id('sh_act')
    aw, ah = 70, 95
    ax, ay = 80, act_y
    adef = f'''{act_de}:"{escape_str(actor_name)}":Actor {{
	parentConnectorHeaderLength=40;
	background=(224, 242, 254, 255);
	foreground=(30, 58, 138, 255);
	width={aw};
	height={ah};
	connectToPoint=T;
	x={ax};
	y={ay};
	metaModelElement=<{actor_id}>;
	_elementFont=(
		@name="Dialog";, 
		@color=(30, 58, 138, 255);, 
		@size=11;, 
		@style=1;
	);
}}'''
    child_shapes.append(f'<{diag_id}:{act_de}>')
    de_rows.append((act_de, 'Actor', diag_id, actor_id, None, None, None, adef.encode('utf-8')))

    # 2. System Boundary Shape (Package)
    pkg_de = make_id('sh_pkg')
    px, py = 260, 50
    pw, ph = box_w, box_h
    pdef = f'''{pkg_de}:"{escape_str(boundary_title)}":Package {{
	parentConnectorHeaderLength=40;
	_fillColor=(
		@gradientStyle=1;, 
		@transparency=0;, 
		@type=1;, 
		@color1=(
			{bg_color[0]}, 
			{bg_color[1]}, 
			{bg_color[2]}, 
			0
		);
	);
	background=(
		{bg_color[0]}, 
		{bg_color[1]}, 
		{bg_color[2]}, 
		255
	);
	foreground=(
		{fg_color[0]}, 
		{fg_color[1]}, 
		{fg_color[2]}, 
		255
	);
	width={pw};
	height={ph};
	x={px};
	y={py};
	_elementFont=(
		@name="Dialog";, 
		@color=(
			{fg_color[0]}, 
			{fg_color[1]}, 
			{fg_color[2]}, 
			255
		);, 
		@size=12;, 
		@style=1;
	);
}}'''
    de_rows.append((pkg_de, 'Package', diag_id, None, None, None, None, pdef.encode('utf-8')))

    # 3. Place Use Cases in 2 columns
    col_w = 320
    row_h = 65
    pad_x = 40
    pad_y = 65

    uc_shapes = {}
    auth_uc_de = None

    for i, (uc_code, uc_name, is_secondary) in enumerate(use_cases):
        col = 1 if is_secondary else 0
        # row index in column
        if is_secondary:
            sec_idx = sum(1 for _, _, s in use_cases[:i] if s)
            r_idx = sec_idx
        else:
            pri_idx = sum(1 for _, _, s in use_cases[:i] if not s)
            r_idx = pri_idx

        ux = px + pad_x + col * (col_w + 40)
        uy = py + pad_y + r_idx * (row_h + 20)
        uw = col_w
        uh = row_h

        display_name = f"{uc_code}: {uc_name}"
        uc_de = make_id('sh_uc')
        uc_def = f'''{uc_de}:"{escape_str(display_name)}":UseCase {{
	parentConnectorHeaderLength=40;
	_fillColor=(
		@gradientStyle=1;, 
		@transparency=0;, 
		@type=1;, 
		@color1=(
			255, 
			255, 
			255, 
			255
		);
	);
	background=(255, 255, 255, 255);
	foreground=(15, 23, 42, 255);
	width={uw};
	height={uh};
	connectToPoint=T;
	x={ux};
	y={uy};
	_elementFont=(
		@name="Dialog";, 
		@color=(15, 23, 42, 255);, 
		@size=10;, 
		@style=0;
	);
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.2;, 
		@color=(
			{fg_color[0]}, 
			{fg_color[1]}, 
			{fg_color[2]}, 
			255
		);, 
		@hasStroke=T;
	);
}}'''
        child_shapes.append(f'<{diag_id}:{uc_de}>')
        de_rows.append((uc_de, 'UseCase', diag_id, None, None, None, None, uc_def.encode('utf-8')))
        uc_shapes[uc_code] = (uc_de, ux, uy, uw, uh, is_secondary)

        if 'Đăng nhập' in uc_name or 'Đăng ký' in uc_name:
            if not auth_uc_de: auth_uc_de = uc_de

    # 4. Associations from Actor to Primary Use Cases (and Auth)
    act_cx = ax + aw // 2
    act_cy = ay + ah // 2

    for uc_code, (uc_de, ux, uy, uw, uh, is_sec) in uc_shapes.items():
        if not is_sec:
            uc_cx = ux + uw // 2
            uc_cy = uy + uh // 2
            asc_de = make_id('sh_asc')
            asc_def = f'''{asc_de}:NULL:Association {{
	foreground=(100, 116, 139, 255);
	fromPinType=1;
	toPinType=1;
	useFromShapeCenter=T;
	useToShapeCenter=T;
	_points="{act_cx},{act_cy};{ux},{uc_cy};";
	_fromShape=<{diag_id}:{act_de}>;
	_toShape=<{diag_id}:{uc_de}>;
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.2;, 
		@color=(100, 116, 139, 255);, 
		@hasStroke=T;
	);
}}'''
            child_shapes.append(f'<{diag_id}:{asc_de}>')
            de_rows.append((asc_de, 'Association', diag_id, None, None, None, None, asc_def.encode('utf-8')))

    # 5. Dependencies «include» from Primary to Secondary Use Cases
    for i, (uc_code, uc_name, is_sec) in enumerate(use_cases):
        if is_sec:
            sec_de, sx, sy, sw, sh, _ = uc_shapes[uc_code]
            sec_cx = sx
            sec_cy = sy + sh // 2
            # Connect from corresponding primary
            pri_candidates = [c for c, (d, x, y, w, h, s) in uc_shapes.items() if not s]
            if pri_candidates:
                # pick closest primary
                pri_code = pri_candidates[min(i % len(pri_candidates), len(pri_candidates)-1)]
                pri_de, px_, py_, pw_, ph_, _ = uc_shapes[pri_code]
                pri_cx = px_ + pw_
                pri_cy = py_ + ph_ // 2

                dep_de = make_id('sh_dep')
                dep_def = f'''{dep_de}:"include":Dependency {{
	foreground=(79, 70, 229, 255);
	fromPinType=1;
	toPinType=1;
	useFromShapeCenter=T;
	useToShapeCenter=T;
	_points="{pri_cx},{pri_cy};{sec_cx},{sec_cy};";
	_fromShape=<{diag_id}:{pri_de}>;
	_toShape=<{diag_id}:{sec_de}>;
	_elementFont=(
		@name="Dialog";, 
		@color=(79, 70, 229, 255);, 
		@size=10;, 
		@style=2;
	);
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.0;, 
		@color=(99, 102, 241, 255);, 
		@hasStroke=T;
	);
}}'''
                child_shapes.append(f'<{diag_id}:{dep_de}>')
                de_rows.append((dep_de, 'Dependency', diag_id, None, None, None, None, dep_def.encode('utf-8')))

    child_shapes.append(f'<{diag_id}:{pkg_de}>')
    children_str = ', \n\t\t'.join(child_shapes)
    diag_def = f'''{diag_id}:"{diag_name}":UseCaseDiagram {{
	paintConnectorThroughLabel=1;
	_shapeGroups=NULL;
	diagramBackground=(255, 255, 255, 255);
	connectorLabelOrientation=0;
	showPackageNameStyle=0;
	showDefaultPackage=F;
	pointConnectorEndToCompartmentMember=T;
	showUseCaseExtensionPoint=T;
	autoFitShapesSize=F;
	showDiagramFrame=T;
	connectorStyle=1;
	creationTime=1790775686767;
	pmAuthor="Tai.IS";
	Child=(
		{children_str}
	);
	modelElementNameAlignment=4;
	connectorLineJumps=0;
	showUseCaseId=F;
}}'''

    cur.execute('INSERT INTO DIAGRAM (ID, DIAGRAM_TYPE, NAME, DEFINITION) VALUES (?, ?, ?, ?)',
                (diag_id, 'UseCaseDiagram', diag_name, diag_def.encode('utf-8')))
    cur.executemany('INSERT INTO DIAGRAM_ELEMENT (ID, SHAPE_TYPE, DIAGRAM_ID, MODEL_ELEMENT_ID, COMPOSITE_MODEL_ELEMENT_ADDRESS, REF_MODEL_ELEMENT_ADDRESS, PARENT_ID, DEFINITION) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', de_rows)
    print(f"Generated {diag_name}: {len(child_shapes)} shapes + {len(de_rows)-len(child_shapes)} connectors.")


def export_diagrams_to_png():
    """Xuất tất cả 7 sơ đồ Use Case ra file PNG chất lượng cao"""
    java_bin = '/Applications/Visual Paradigm.app/Contents/Resources/jre.bundle/Contents/Home/bin/java'
    vp_bin = '/Applications/Visual Paradigm.app/Contents/Resources/app/bin'
    cp = '.:../lib/vpplatform.jar:../lib/jniwrap.jar:../lib/winpack.jar:../ormlib/orm.jar:../ormlib/orm-core.jar:../lib/lib01.jar:../lib/lib02.jar:../lib/lib03.jar:../lib/lib04.jar:../lib/lib05.jar:../lib/lib06.jar:../lib/lib07.jar:../lib/lib08.jar:../lib/lib09.jar:../lib/lib10.jar:../lib/lib11.jar:../lib/lib12.jar:../lib/lib13.jar:../lib/lib14.jar:../lib/lib15.jar:../lib/lib16.jar:../lib/lib17.jar:../lib/lib18.jar:../lib/lib19.jar:../lib/lib20.jar'

    diagram_exports = [
        ('02. Master System Use Cases - Overview', '01-use-case-general-system-vp.png'),
        ('03. Use Case - Actor Khách Vãng Lai (Guest)', '08-use-case-actor-guest-vp.png'),
        ('04. Use Case - Actor Người Gửi Hàng (Merchant)', '06-use-case-actor-merchant-vp.png'),
        ('05. Use Case - Actor Nhân Viên Giao Hàng (Courier)', '05-use-case-actor-courier-vp.png'),
        ('06. Use Case - Actor Nhân Viên Vận Hành (Ops Staff)', '04-use-case-actor-ops-staff-vp.png'),
        ('07. Use Case - Actor Khách Hàng Cá Nhân (Customer C-End)', '07-use-case-actor-customer-vp.png'),
        ('08. Use Case - Actor Quản Trị Viên (System Admin)', '03-use-case-actor-system-admin-vp.png'),
    ]

    print("\n=======================================================")
    print("  EXPORTING ALL 7 USE CASE DIAGRAMS FROM VISUAL PARADIGM")
    print("=======================================================")

    exported_files = []
    for diag_name, out_file in diagram_exports:
        out_path = os.path.join(EXPORT_DIR, out_file)
        cmd = [
            java_bin,
            '-Xms256m', '-Xmx1024m', '-Djava.awt.headless=true',
            '-cp', cp,
            'com.vp.cmd.ExportDiagramImage',
            '-project', VPP_PATH,
            '-out', out_path,
            '-diagram', diag_name,
            '-type', 'png'
        ]
        res = subprocess.run(cmd, cwd=vp_bin, capture_output=True, text=True)
        if os.path.exists(out_path):
            file_size = os.path.getsize(out_path)
            print(f"  [OK] Exported '{diag_name}' -> {out_path} ({file_size:,} bytes)")
            exported_files.append(out_path)
        else:
            print(f"  [FAIL] Could not export '{diag_name}'")
            if res.stderr:
                print("   Stderr:", res.stderr[:300])

    return exported_files

def main():
    backup_db()
    conn = get_connection()
    cur = conn.cursor()

    # 1. Chuẩn hóa tên ModelElement
    update_canonical_model_elements(cur)

    # 2. Sơ đồ Use Case Tổng Quát (Master Diagram is built separately via build_textbook_master_usecase.py)
    # build_master_usecase_diagram(cur)

    # 3. Sơ đồ 03: Guest (5 UCs)
    guest_ucs = [
        ('UC-GST-01', 'Đăng ký nâng cấp tài khoản', False),
        ('UC-GST-02', 'Tra cứu trạng thái bưu kiện', False),
        ('UC-GST-03', 'Ước tính cước & thời gian', False),
        ('UC-GST-04', 'Trợ lý AI Tra cứu (Chatbot)', False),
        ('UC-GST-05', 'Tìm kiếm bưu cục gần nhất', False),
        ('UC-PRC-BASE', 'Động cơ cước chuẩn IATA', True),
        ('UC-AI-RAG', 'Truy xuất tri thức Hybrid RAG', True),
    ]
    build_actor_usecase_diagram(
        cur, 'diag_uc_act_guest', '03. Use Case - Actor Khách Vãng Lai (Guest)',
        'YosxTwWD.AAAAQuH', 'Khách Vãng Lai\n(Guest)',
        'Phân Hệ Khách Vãng Lai (Guest Services • Tracking & AI)',
        guest_ucs, bg_color=(240, 253, 250), fg_color=(15, 118, 110)
    )

    # 4. Sơ đồ 04: Merchant (12 UCs)
    merchant_ucs = [
        ('UC-MER-01', 'Đăng nhập cổng Merchant', False),
        ('UC-MER-02', 'Đổi mật khẩu tài khoản', True),
        ('UC-MER-03', 'Đăng xuất', True),
        ('UC-MER-04', 'Quản lý hồ sơ doanh nghiệp', True),
        ('UC-MER-05', 'Tạo đơn hàng', False),
        ('UC-MER-06', 'In nhãn đơn bưu phẩm', True),
        ('UC-MER-07', 'Quản lý danh sách đơn hàng', False),
        ('UC-MER-08', 'Tra cứu hành trình đơn', False),
        ('UC-MER-09', 'Hủy đơn hàng chưa lấy', False),
        ('UC-MER-10', 'Yêu cầu hoàn hàng', False),
        ('UC-MER-11', 'Đối soát & Tài chính COD', False),
        ('UC-MER-12', 'Quản lý yêu cầu lấy hàng', False),
    ]
    build_actor_usecase_diagram(
        cur, 'diag_uc_act_merchant', '04. Use Case - Actor Người Gửi Hàng (Merchant)',
        '4osxTwWD.AAAAQuK', 'Người Gửi Hàng\n(Merchant)',
        'Cổng Thông Tin Chủ Shop (Merchant Portal • Order & Finance)',
        merchant_ucs, bg_color=(254, 243, 199), fg_color=(180, 83, 9)
    )

    # 5. Sơ đồ 05: Courier (11 UCs)
    courier_ucs = [
        ('UC-DRV-01', 'Đăng nhập ứng dụng di động', False),
        ('UC-DRV-02', 'Đổi mật khẩu tài xế', True),
        ('UC-DRV-03', 'Đăng xuất', True),
        ('UC-DRV-04', 'Quản lý danh sách nhiệm vụ ngày', False),
        ('UC-DRV-05', 'Xác nhận lấy hàng (Pickup)', False),
        ('UC-DRV-06', 'Liên hệ người nhận (ẩn số)', False),
        ('UC-DRV-07', 'Chụp ảnh bằng chứng POD', True),
        ('UC-DRV-08', 'Xác nhận phát thành công', False),
        ('UC-DRV-09', 'Báo cáo sự cố phát thất bại', False),
        ('UC-DRV-10', 'Nộp tiền COD qua VietQR', False),
        ('UC-DRV-11', 'Giám sát hạn mức công nợ', False),
    ]
    build_actor_usecase_diagram(
        cur, 'diag_uc_act_courier', '05. Use Case - Actor Nhân Viên Giao Hàng (Courier)',
        'EosxTwWD.AAAAQuN', 'Nhân Viên Giao Hàng\n(Courier)',
        'Ứng Dụng Di Động Bưu Tá (Courier Mobile App • Delivery & COD)',
        courier_ucs, bg_color=(240, 249, 255), fg_color=(3, 105, 161)
    )

    # 6. Sơ đồ 06: Ops Staff (19 UCs)
    ops_ucs = [
        ('UC-OPS-01', 'Đăng nhập hệ thống bưu cục', False),
        ('UC-OPS-02', 'Đổi mật khẩu nhân viên', True),
        ('UC-OPS-03', 'Đăng xuất', True),
        ('UC-OPS-04', 'Giám sát Dashboard vận hành', False),
        ('UC-OPS-05', 'Tra cứu hành trình đơn', False),
        ('UC-OPS-06', 'Tạo đơn hàng tại quầy (POS)', False),
        ('UC-OPS-07', 'Điều phối đơn hàng lấy', False),
        ('UC-OPS-08', 'Điều phối đơn hàng phát', False),
        ('UC-OPS-09', 'Đóng bao manifest', False),
        ('UC-OPS-10', 'Gỡ bao & Kiểm đếm chia chọn', False),
        ('UC-OPS-11', 'Quản lý chuyến xe tải Linehaul', False),
        ('UC-OPS-12', 'Quét xe xuất bến (Outbound)', False),
        ('UC-OPS-13', 'Quét xe đến (Inbound)', False),
        ('UC-OPS-14', 'Xử lý sự cố giao thất bại (NDR)', False),
        ('UC-OPS-15', 'Quản lý chuyển hoàn (Return)', False),
        ('UC-OPS-16', 'Tài chính & Đối soát COD', False),
        ('UC-OPS-17', 'Quản lý tem bao', True),
        ('UC-OPS-18', 'Gửi hàng liên bưu cục', True),
        ('UC-OPS-19', 'Nhận hàng bưu cục đến', True),
    ]
    build_actor_usecase_diagram(
        cur, 'diag_uc_act_ops', '06. Use Case - Actor Nhân Viên Vận Hành (Ops Staff)',
        'EosxTwWD.AAAAQuL', 'Nhân Viên Vận Hành\n(Ops Staff)',
        'Hệ Thống Quản Lý Bưu Cục & Hub (Hub Operations & Transit)',
        ops_ucs, bg_color=(236, 253, 245), fg_color=(6, 95, 70)
    )

    # 7. Sơ đồ 07: Customer (10 UCs)
    customer_ucs = [
        ('UC-CUS-01', 'Đăng ký tài khoản người dùng', False),
        ('UC-CUS-02', 'Đăng nhập ứng dụng khách hàng', False),
        ('UC-CUS-03', 'Quản lý hồ sơ cá nhân', True),
        ('UC-CUS-04', 'Đăng xuất tài khoản khách hàng', True),
        ('UC-CUS-05', 'Tạo đơn gửi bưu phẩm cá nhân', False),
        ('UC-CUS-06', 'Tra cứu đơn hàng', False),
        ('UC-CUS-07', 'Ước tính cước & thời gian giao', False),
        ('UC-CUS-08', 'Quản lý địa chỉ mặc định', False),
        ('UC-CUS-09', 'Trợ lý AI hỗ trợ đơn hàng', False),
        ('UC-CUS-10', 'Quản lý tài khoản ngân hàng', False),
    ]
    build_actor_usecase_diagram(
        cur, 'diag_uc_act_customer', '07. Use Case - Actor Khách Hàng Cá Nhân (Customer C-End)',
        'YosxTwWD.AAAAQuI', 'Khách Hàng Cá Nhân\n(Customer)',
        'Cổng Khách Hàng Cá Nhân (Customer Portal & Mobile App)',
        customer_ucs, bg_color=(255, 241, 242), fg_color=(159, 18, 57)
    )

    # 8. Sơ đồ 08: Admin (13 UCs)
    admin_ucs = [
        ('UC-ADM-01', 'Đăng nhập cổng Admin', False),
        ('UC-ADM-02', 'Đăng xuất', True),
        ('UC-ADM-03', 'Giám sát tổng quan hệ thống', False),
        ('UC-ADM-04', 'Cấu hình mạng lưới bưu cục', False),
        ('UC-ADM-05', 'Quản lý danh mục Hub 4 cấp', False),
        ('UC-ADM-06', 'Quản lý khu vực / Zone địa lý', False),
        ('UC-ADM-07', 'Cấu hình lỗi vận chuyển (NDR)', False),
        ('UC-ADM-08', 'Cấu hình điều khoản và dịch vụ', False),
        ('UC-ADM-09', 'Quản lý tài khoản Ops', False),
        ('UC-ADM-10', 'Quản lý tài khoản Courier', False),
        ('UC-ADM-11', 'Quản lý tài khoản Merchant', False),
        ('UC-ADM-12', 'Quản lý tài khoản khách hàng', False),
        ('UC-ADM-13', 'Phân quyền Mobile override', False),
    ]
    build_actor_usecase_diagram(
        cur, 'diag_uc_act_admin', '08. Use Case - Actor Quản Trị Viên (System Admin)',
        'EosxTwWD.AAAAQuO', 'Quản Trị Viên\n(System Admin)',
        'Hệ Thống Quản Trị Trung Tâm (Central Admin & Governance)',
        admin_ucs, bg_color=(241, 245, 249), fg_color=(51, 65, 85)
    )

    conn.commit()
    conn.close()
    print("Database updated and committed successfully!")

    # 9. Export All Diagrams
    export_diagrams_to_png()

if __name__ == '__main__':
    main()
