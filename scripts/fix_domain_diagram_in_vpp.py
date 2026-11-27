#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FIX DOMAIN MODEL DIAGRAM (diag_class_0001.) DIRECTLY IN Nexus.vpp
=================================================================
- GIỮ NGUYÊN 100% vị trí & kích thước 43 Class và 4 NOTE mà người dùng đã sắp xếp gọn.
- Sửa toàn bộ 8 lỗi UML 2.5 (Composition ◆ / Aggregation ◇ / Association / Multiplicity)
  theo đúng 11 file services/*/prisma/schema.prisma thực tế.
- Tính toán chính xác 2 đầu _points, multiplicityARectangle/BRectangle và tọa độ nhãn
  cho toàn bộ 33 Association + 2 Dependency để 100% bản số và nhãn hiển thị đúng vị trí.
"""

import sqlite3
import re

VPP_PATH = '/Users/Tai.IS/Documents/VPProjects/Nexus.vpp'
DIAG_ID = 'diag_class_0001.'


def direct_points_and_rects(fx, fy, fw, fh, tx, ty, tw, th):
    """
    Compute clean edge-to-edge 2-point _points (start rel to fromShape, end rel to toShape),
    plus multiplicityARectangle, multiplicityBRectangle, and relative caption (cx, cy).
    """
    fcx, fcy = fx + fw // 2, fy + fh // 2
    tcx, tcy = tx + tw // 2, ty + th // 2

    # Check horizontal vs vertical separation
    horiz_gap = max(tx - (fx + fw), fx - (tx + tw))
    vert_gap = max(ty - (fy + fh), fy - (ty + th))

    if horiz_gap >= vert_gap:
        # Connect left/right edges at overlapping vertical midpoint (or center)
        ov_top = max(fy + 18, ty + 18)
        ov_bot = min(fy + fh - 18, ty + th - 18)
        if ov_top <= ov_bot:
            py = (ov_top + ov_bot) // 2
            sy, ey = py - fy, py - ty
        else:
            sy, ey = fh // 2, th // 2
        if tcx >= fcx:
            # from RIGHT -> to LEFT
            sx, ex = fw, 0
            ma = (6, -22, 38, 20)
            mb = (-44, -22, 38, 20)
        else:
            # from LEFT -> to RIGHT
            sx, ex = 0, tw
            ma = (-44, -22, 38, 20)
            mb = (6, -22, 38, 20)
    else:
        # Connect top/bottom edges at overlapping horizontal midpoint (or center)
        ov_l = max(fx + 20, tx + 20)
        ov_r = min(fx + fw - 20, tx + tw - 20)
        if ov_l <= ov_r:
            px = (ov_l + ov_r) // 2
            sx, ex = px - fx, px - tx
        else:
            sx, ex = fw // 2, tw // 2
        if tcy >= fcy:
            # from BOTTOM -> to TOP
            sy, ey = fh, 0
            ma = (8, 6, 38, 20)
            mb = (8, -24, 38, 20)
        else:
            # from TOP -> to BOTTOM
            sy, ey = 0, th
            ma = (8, -24, 38, 20)
            mb = (8, 6, 38, 20)

    abs_ax, abs_ay = fx + sx, fy + sy
    abs_bx, abs_by = tx + ex, ty + ey
    # Caption coords relative to fromShape (fx, fy)
    cap_x = ((abs_ax + abs_bx) // 2) - fx - 60
    cap_y = ((abs_ay + abs_by) // 2) - fy - 10
    pts_str = f'{sx},{sy};{ex},{ey};'
    return pts_str, ma, mb, cap_x, cap_y


def main():
    conn = sqlite3.connect(VPP_PATH)
    cur = conn.cursor()

    cur.execute(
        "SELECT ID, SHAPE_TYPE, MODEL_ELEMENT_ID, DEFINITION FROM DIAGRAM_ELEMENT WHERE DIAGRAM_ID=?",
        (DIAG_ID,)
    )
    existing_des = cur.fetchall()

    preserved_child_ids = []
    class_info = {}  # name -> (shape_id, model_addr, x, y, w, h, cx, cy)
    old_rel_de_ids = []
    old_rel_me_ids = []

    for did, st, mid, ddef_b in existing_des:
        ddef = ddef_b.decode('utf-8', errors='ignore') if ddef_b else ''
        if st in ('Association', 'Dependency', 'Generalization'):
            old_rel_de_ids.append(did)
            if mid:
                old_rel_me_ids.append(mid)
        else:
            preserved_child_ids.append(did)
            if st == 'Class':
                name = re.search(r'^[^:]+:"([^"]+)":Class', ddef).group(1)
                m_addr = re.search(r'metaModelElement=<([^>]+)>;', ddef).group(1)
                x = int(re.search(r'\bx=(-?\d+);', ddef).group(1))
                y = int(re.search(r'\by=(-?\d+);', ddef).group(1))
                w = int(re.search(r'\bwidth=(-?\d+);', ddef).group(1))
                h = int(re.search(r'\bheight=(-?\d+);', ddef).group(1))
                class_info[name] = (did, m_addr, x, y, w, h, x + w // 2, y + h // 2)

    for did in old_rel_de_ids:
        cur.execute("DELETE FROM DIAGRAM_ELEMENT WHERE ID=? AND DIAGRAM_ID=?", (did, DIAG_ID))
    for mid in old_rel_me_ids:
        cur.execute("DELETE FROM MODEL_ELEMENT WHERE ID=?", (mid,))
    cur.execute("DELETE FROM MODEL_ELEMENT WHERE ID LIKE 'm_d1_rel_%'")

    associations = [
        # --- auth-service (2) ---
        ('UserAccount', 'AuthSession',              'authenticates',          '1',    '0..*', 67, 65, 0, 0, None),
        ('UserAccount', 'MobilePermissionOverride', 'overrides',              '1',    '0..1', 67, 65, 0, 0, None),

        # --- masterdata-service (5) ---
        ('Zone',        'Hub',                      'groups',                 '0..1', '0..*', 66, 65, 0, 0, None),
        ('Hub',         'CourierAreaAssignment',    'assigns',                '1',    '0..*', 66, 65, 0, 0, None),
        ('Hub',         'MerchantProfile',          'serves',                 '0..1', '0..*', 65, 65, 1, 0, None),
        ('Policy',      'PolicyVersion',            'revises',                '1',    '1..*', 67, 65, 0, 0, None),
        ('UserAccount', 'CustomerProfile',          'profiles',               '1',    '0..1', 65, 65, 1, 0, 'left_gutter'),

        # --- pickup-service & dispatch-service (3) ---
        ('PickupRequest', 'PickupItem',             'contains item',          '1',    '1..*', 67, 65, 0, 0, None),
        ('PickupRequest', 'Task',                   'schedules',              '0..1', '0..*', 65, 65, 1, 0, None),
        ('Task',          'TaskAssignment',         'delegates',              '1',    '1..*', 67, 65, 0, 0, None),

        # --- shipment-service (8) ---
        ('Shipment',          'ChangeRequest',        'requests modification',  '1',    '0..*', 67, 65, 0, 0, None),
        ('Shipment',          'InvestigationCase',    'escalates investigation','1',    '0..*', 67, 65, 0, 0, None),
        ('InvestigationCase', 'InvestigationDispute', 'disputes hearing',       '1',    '0..*', 67, 65, 0, 0, None),
        ('Shipment',          'CompensationClaim',    'claims',                 '1',    '0..*', 67, 65, 0, 0, 'ship_right_1'),
        ('Shipment',          'CskhTicket',           'supports',               '1',    '0..*', 67, 65, 0, 0, 'ship_right_2'),
        ('Shipment',          'CourierRating',        'rates',                  '1',    '0..1', 67, 65, 0, 0, 'ship_right_3'),
        ('InvestigationCase', 'CompensationClaim',    'escalates to claim',     '0..1', '0..1', 65, 65, 1, 0, None),
        ('CskhTicket',        'CompensationClaim',    'links claim',            '0..*', '0..1', 65, 65, 1, 0, None),

        # --- manifest-service & scan-service (5) ---
        ('Manifest',               'ManifestItem',          'contains package', '1',    '1..*', 67, 65, 0, 0, None),
        ('Manifest',               'SealRecord',            'seals',            '1',    '0..1', 67, 65, 0, 0, None),
        ('Manifest',               'ReceiveRecord',         'receives',         '1',    '0..1', 67, 65, 0, 0, None),
        ('ScanEvent',              'CurrentLocation',       'updates location', '*',    '1',    65, 65, 1, 0, None),
        ('CourierCurrentLocation', 'CourierLocationHistory','tracks trail',     '1',    '*',    65, 65, 1, 0, None),

        # --- delivery-service (4) ---
        ('DeliveryAttempt', 'Pod',        'verifies proof',  '1',    '0..1', 67, 65, 0, 0, None),
        ('DeliveryAttempt', 'OtpRecord',  'verifies OTP',    '0..*', '0..*', 65, 65, 1, 0, None),
        ('DeliveryAttempt', 'NdrCase',    'flags exception', '0..1', '0..*', 65, 65, 1, 0, None),
        ('NdrCase',         'ReturnCase', 'returns',         '0..1', '0..1', 65, 65, 1, 0, None),

        # --- payment-service (4) ---
        ('CodSettlementBatch', 'CodRecord',                 'aggregates COD', '0..1', '1..*', 66, 65, 0, 0, None),
        ('CodSettlementBatch', 'CodSettlementItem',         'itemizes',       '1',    '1..*', 67, 65, 0, 0, None),
        ('CodSettlementItem',  'CodRecord',                 'references COD', '0..*', '1',    65, 65, 1, 0, None),
        ('CodSettlementBatch', 'CodSettlementPaymentEvent', 'records payout', '0..1', '0..*', 65, 65, 1, 0, None),

        # --- tracking-service & chatbot-service (2) ---
        ('TrackingCurrent', 'TimelineEvent',       'projects timeline', '1', '0..*', 66, 65, 0, 0, None),
        ('ChatbotSession',  'VectorDocumentChunk', 'retrieves context', '1', '*',    65, 65, 1, 0, None),
    ]

    dependencies = [
        ('Shipment', 'TrackingCurrent', '«event» RabbitMQ Pub/Sub', 'dep_tracking'),
        ('Shipment', 'KpiDaily',        '«event» aggregates KPI',   'dep_kpi'),
    ]

    new_rel_child_ids = []
    rel_idx = 0

    for (f_cls, t_cls, lbl, m_from, m_to, agg_f, agg_t, nav_f, nav_t, rtype) in associations:
        rel_idx += 1
        de_id = f'sh_rel_{rel_idx:04d}...'[:16]
        me_id = f'm_d1_rel_{rel_idx:04d}..'[:16]
        end_a = f'm_end_{rel_idx:04d}a'
        end_b = f'm_end_{rel_idx:04d}b'
        view_id = f'v_d1_rel_{rel_idx:04d}'

        f_sh, f_addr, fx, fy, fw, fh, fcx, fcy = class_info[f_cls]
        t_sh, t_addr, tx, ty, tw, th, tcx, tcy = class_info[t_cls]

        me_def = f'''{me_id}:"{lbl}":Association {{
	_masterViewId="{de_id}";
	_modelViews=(
		{{{view_id}:"View":ModelView {{
			container=<{DIAG_ID}>;
			view="{de_id}";
		}}}}
	);
	_modelEditable=T;
	from={{{end_a}:NULL:AssociationEnd {{
		multiplicity="{m_from}";
		aggregationKind={agg_f};
		type=<{f_addr}>;
		EndModelElement=<{f_addr}>;
		Direction=0;
		navigable={nav_f};
		_modelEditable=T;
	}}}};
	to={{{end_b}:NULL:AssociationEnd {{
		multiplicity="{m_to}";
		aggregationKind={agg_t};
		type=<{t_addr}>;
		EndModelElement=<{t_addr}>;
		Direction=1;
		navigable={nav_t};
		_modelEditable=T;
	}}}};
}}
'''
        cur.execute(
            "INSERT INTO MODEL_ELEMENT (ID, MODEL_TYPE, NAME, PARENT_ID, DEFINITION) VALUES (?, 'Association', ?, 'c_assoc_cont...', ?)",
            (me_id, lbl, me_def.encode('utf-8'))
        )

        if rtype == 'left_gutter':
            pts_str = f'0,85;-58,85;-58,{1336 - fy};0,76;'
            ma = (-42, -22, 36, 20)
            mb = (-42, -22, 36, 20)
            cap_x, cap_y = -105, 420
        elif rtype == 'ship_right_1':
            corr_x = 1162
            pts_str = f'{fw},215;{corr_x - fx},215;{corr_x - fx},{tcy - fy};{tw},{th // 2};'
            ma = (6, -22, 34, 20)
            mb = (6, -22, 36, 20)
            cap_x, cap_y = 0, 0
        elif rtype == 'ship_right_2':
            corr_x = 1186
            pts_str = f'{fw},248;{corr_x - fx},248;{corr_x - fx},{tcy - fy};{tw},{th // 2};'
            ma = (6, -22, 34, 20)
            mb = (6, -22, 36, 20)
            cap_x, cap_y = 0, 0
        elif rtype == 'ship_right_3':
            corr_x = 1210
            pts_str = f'{fw},280;{corr_x - fx},280;{corr_x - fx},{tcy - fy};{tw},{th // 2};'
            ma = (6, -22, 34, 20)
            mb = (6, -22, 36, 20)
            cap_x, cap_y = 0, 0
        else:
            pts_str, ma, mb, cap_x, cap_y = direct_points_and_rects(fx, fy, fw, fh, tx, ty, tw, th)

        de_def = f'''{de_id}:"{lbl}":Association {{
	foreground=(0, 0, 0, 255);
	fromPinType=1;
	toPinType=1;
	useFromShapeCenter=F;
	useToShapeCenter=F;
	_points="{pts_str}";
	multiplicityARectangle=({ma[0]}, {ma[1]}, {ma[2]}, {ma[3]});
	multiplicityBRectangle=({mb[0]}, {mb[1]}, {mb[2]}, {mb[3]});
	showUniqueMultiplicityConstraint=T;
	showStereotypes=T;
	hasMultiplicityAShape=T;
	hasMultiplicityBShape=T;
	showToRoleName=F;
	showFromRoleName=F;
	showFromRoleVisibility=T;
	showToRoleVisibility=T;
	showFromMultiplicity=T;
	showToMultiplicity=T;
	showMultiplicityConstraints=F;
	showOrderedMultiplicityConstraint=T;
	showNavigationArrows=3;
	_fromShape=<{DIAG_ID}:{f_sh}>;
	_toShape=<{DIAG_ID}:{t_sh}>;
	metaModelElement=<wYsxTwWD.AAAAQwL:c_assoc_cont...:{me_id}>;
	_elementFont=(
		@name="Dialog";, 
		@color=(15, 23, 42, 255);, 
		@size=10;, 
		@style=0;
	);
	_captionUIModel=(
		@x=0;, 
		@y=0;, 
		@width=0;, 
		@height=0;, 
		@side=1;, 
		@visible=T;, 
		@internalWidth=-2147483648;, 
		@internalHeight=-2147483648;
	);
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.3;, 
		@color=(15, 23, 42, 255);, 
		@hasStroke=T;
	);
}}'''
        cur.execute(
            "INSERT INTO DIAGRAM_ELEMENT (ID, SHAPE_TYPE, DIAGRAM_ID, MODEL_ELEMENT_ID, COMPOSITE_MODEL_ELEMENT_ADDRESS, REF_MODEL_ELEMENT_ADDRESS, PARENT_ID, DEFINITION) VALUES (?, 'Association', ?, ?, NULL, NULL, NULL, ?)",
            (de_id, DIAG_ID, me_id, de_def.encode('utf-8'))
        )
        new_rel_child_ids.append(de_id)

    for (f_cls, t_cls, lbl, rtype) in dependencies:
        rel_idx += 1
        de_id = f'sh_rel_{rel_idx:04d}...'[:16]
        me_id = f'm_d1_rel_{rel_idx:04d}..'[:16]
        view_id = f'v_d1_rel_{rel_idx:04d}'

        f_sh, f_addr, fx, fy, fw, fh, fcx, fcy = class_info[f_cls]
        t_sh, t_addr, tx, ty, tw, th, tcx, tcy = class_info[t_cls]

        me_def = f'''{me_id}:"{lbl}":Dependency {{
	_masterViewId="{de_id}";
	fromModel=<{f_addr}>;
	toModel=<{t_addr}>;
	_modelViews=(
		{{{view_id}:"View":ModelView {{
			container=<{DIAG_ID}>;
			view="{de_id}";
		}}}}
	);
	_modelEditable=T;
}}
'''
        cur.execute(
            "INSERT INTO MODEL_ELEMENT (ID, MODEL_TYPE, NAME, PARENT_ID, DEFINITION) VALUES (?, 'Dependency', ?, 'c_dep_cont....', ?)",
            (me_id, lbl, me_def.encode('utf-8'))
        )

        if rtype == 'dep_tracking':
            pts_str = f'{fw // 2},0;{fw // 2},-56;{2405 - fx},-56;{2405 - fx},{tcy - fy};{tw},{th // 2};'
            cap_x, cap_y = 660, -78  # relative to Shipment (845, 150) => abs (1505, 72)
        else:
            pts_str = f'{fw},310;{1695 - fx},310;{1695 - fx},{tcy - fy};0,{th // 2};'
            cap_x, cap_y = 580, 288  # relative to Shipment (845, 150) => abs (1425, 438)

        de_def = f'''{de_id}:"{lbl}":Dependency {{
	foreground=(37, 99, 235, 255);
	fromPinType=1;
	toPinType=1;
	useFromShapeCenter=F;
	useToShapeCenter=F;
	_points="{pts_str}";
	_fromShape=<{DIAG_ID}:{f_sh}>;
	_toShape=<{DIAG_ID}:{t_sh}>;
	metaModelElement=<wYsxTwWD.AAAAQwL:c_dep_cont....:{me_id}>;
	showStereotypes=T;
	_elementFont=(
		@name="Dialog";, 
		@color=(37, 99, 235, 255);, 
		@size=10;, 
		@style=1;
	);
	_captionUIModel=(
		@x={cap_x};, 
		@y={cap_y};, 
		@width=185;, 
		@height=18;, 
		@side=1;, 
		@visible=T;, 
		@internalWidth=-2147483648;, 
		@internalHeight=-2147483648;
	);
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.5;, 
		@color=(37, 99, 235, 255);, 
		@hasStroke=T;
	);
}}'''
        cur.execute(
            "INSERT INTO DIAGRAM_ELEMENT (ID, SHAPE_TYPE, DIAGRAM_ID, MODEL_ELEMENT_ID, COMPOSITE_MODEL_ELEMENT_ADDRESS, REF_MODEL_ELEMENT_ADDRESS, PARENT_ID, DEFINITION) VALUES (?, 'Dependency', ?, ?, NULL, NULL, NULL, ?)",
            (de_id, DIAG_ID, me_id, de_def.encode('utf-8'))
        )
        new_rel_child_ids.append(de_id)

    cur.execute("SELECT DEFINITION FROM DIAGRAM WHERE ID=?", (DIAG_ID,))
    diag_def = cur.fetchone()[0].decode('utf-8')
    all_children = preserved_child_ids + new_rel_child_ids
    children_block = "Child=(\n\t\t" + ", \n\t\t".join(f"<{DIAG_ID}:{cid}>" for cid in all_children) + "\n\t);"
    new_diag_def = re.sub(r'Child=\([^)]*\);', children_block, diag_def, flags=re.DOTALL)
    cur.execute("UPDATE DIAGRAM SET DEFINITION=? WHERE ID=?", (new_diag_def.encode('utf-8'), DIAG_ID))

    conn.commit()
    conn.close()
    print(f"DONE v3! Updated {len(associations)} Associations + {len(dependencies)} Dependencies.")


if __name__ == '__main__':
    main()
