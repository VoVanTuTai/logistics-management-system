import glob, os
from run_batch_generator import TITLES, get_diagram_info

files = sorted(glob.glob('docs/sequence-diagrams/Visual_Paradigm/*.png'))

groups = {
    '01': ('01. Khách Vãng Lai (Guest Web)', []),
    '02': ('02. Người Gửi Hàng (Merchant Web)', []),
    '03': ('03. Nhân Viên Giao Hàng (Courier Mobile)', []),
    '04': ('04. Nhân Viên Vận Hành (Ops Web)', []),
    '05': ('05. Quản Trị Viên (System Admin)', []),
    '06': ('06. Khách Hàng Cá Nhân (Customer Mobile)', [])
}

for f in files:
    bn = os.path.basename(f)
    prefix = bn[:2]
    if prefix in groups:
        groups[prefix][1].append(f)

lines = []
lines.append('# BỘ SƠ ĐỒ TUẦN TỰ VISUAL PARADIGM (UML 2.5 BCE STANDARD)')
lines.append('## Hệ Thống Quản Trị & Vận Hành Bưu Chính Logistics Nexus Express\n')
lines.append('> **Tiêu chuẩn học thuật**: Đồ họa chuẩn hóa theo UML 2.5 BCE (Boundary - Control - Entity) với biểu tượng Robustness Analysis, thanh kích hoạt Execution Occurrences (Cyan Bars #7ACFF5), khung rẽ nhánh Combined Fragment (alt / else / opt / loop) và ghi chú nghiệp vụ (#FEF3C7).\n')
lines.append(f'**Tổng số sơ đồ**: {len(files)} sơ đồ tuần tự | **File dự án**: `Nexus.vpp` (12MB)\n')

for code, (group_name, glist) in sorted(groups.items()):
    lines.append(f'### {group_name} ({len(glist)} sơ đồ)')
    lines.append('| STT | Mã Sơ Đồ | Tên Sơ Đồ Nghiệp Vụ Chuẩn UML 2.5 BCE | Hình Ảnh Export (Visual Paradigm) |')
    lines.append('| :---: | :---: | :--- | :--- |')
    for i, path in enumerate(glist, 1):
        bn = os.path.basename(path)
        # Match key
        key = bn[:5]
        if 'delivery-success' in bn:
            key = '03-07-delivery-success'
        clean_title = TITLES.get(key, bn.replace('.png', '').replace('_', ' '))
        lines.append(f'| {i:02d} | `{key}` | **{clean_title}** | [{bn}](./{bn}) |')
    lines.append('')

with open('docs/sequence-diagrams/Visual_Paradigm/README.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print('Updated docs/sequence-diagrams/Visual_Paradigm/README.md with formal titles!')
