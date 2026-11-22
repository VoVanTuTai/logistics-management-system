import os, sys, glob, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.abspath('.'))
import generate_vp_batch as gen

TITLES = {
    # 01-guest
    '01-01': '01-01. Sequence - Guest Tra Cứu Đơn Hàng (BCE)',
    '01-02': '01-02. Sequence - Guest Đăng Ký Tài Khoản (BCE)',
    '01-03': '01-03. Sequence - Guest Tính Cước Vận Chuyển (BCE)',
    '01-04': '01-04. Sequence - Guest Tra Cứu Bưu Cục (BCE)',
    '01-05': '01-05. Sequence - Guest Trợ Lý AI Chatbot (BCE)',
    # 02-merchant
    '02-01': '02-01. Sequence - Merchant Đăng Nhập (BCE)',
    '02-02': '02-02. Sequence - Merchant Đổi Mật Khẩu (BCE)',
    '02-03': '02-03. Sequence - Merchant Đăng Xuất (BCE)',
    '02-04': '02-04. Sequence - Merchant Tạo Đơn Hàng (BCE)',
    '02-05': '02-05. Sequence - Merchant Quản Lý Danh Sách Đơn Hàng (BCE)',
    '02-06': '02-06. Sequence - Merchant Quản Lý Yêu Cầu Lấy Hàng (BCE)',
    '02-07': '02-07. Sequence - Merchant In Nhãn Đơn Hàng (BCE)',
    '02-08': '02-08. Sequence - Merchant Tra Cứu Vận Đơn (BCE)',
    '02-09': '02-09. Sequence - Merchant Hủy Đơn Hàng (BCE)',
    '02-10': '02-10. Sequence - Merchant Yêu Cầu Hoàn Hàng (BCE)',
    '02-11': '02-11. Sequence - Merchant Tài Chính Đối Soát (BCE)',
    # 03-courier
    '03-01': '03-01. Sequence - Courier Đăng Nhập (BCE)',
    '03-02': '03-02. Sequence - Courier Đổi Mật Khẩu (BCE)',
    '03-03': '03-03. Sequence - Courier Đăng Xuất (BCE)',
    '03-04': '03-04. Sequence - Courier Quản Lý Nhiệm Vụ (BCE)',
    '03-05': '03-05. Sequence - Courier Xác Nhận Lấy Hàng (BCE)',
    '03-06': '03-06. Sequence - Courier Liên Hệ Khách Hàng (BCE)',
    '03-07': '03-07. Sequence - Courier Chụp Ảnh Bằng Chứng POD (BCE)',
    '03-07-delivery-success': '03-08. Sequence - Courier Xác Nhận Phát Hàng Thành Công (BCE)',
    '03-08': '03-09. Sequence - Courier Báo Cáo Sự Cố Thất Bại (BCE)',
    '03-09': '03-10. Sequence - Courier Nộp Tiền Thu Hộ COD (BCE)',
    '03-10': '03-11. Sequence - Courier Giám Sát Công Nợ COD (BCE)',
    # 04-ops-staff
    '04-01': '04-01. Sequence - OPS Đăng Nhập (BCE)',
    '04-02': '04-02. Sequence - OPS Đổi Mật Khẩu (BCE)',
    '04-03': '04-03. Sequence - OPS Đăng Xuất (BCE)',
    '04-04': '04-04. Sequence - OPS Giám Sát Dashboard (BCE)',
    '04-05': '04-05. Sequence - OPS Tra Cứu Hành Trình (BCE)',
    '04-06': '04-06. Sequence - OPS Tạo Đơn Tại Quầy POS (BCE)',
    '04-07': '04-07. Sequence - OPS Điều Phối Đơn Lấy (BCE)',
    '04-08': '04-08. Sequence - OPS Điều Phối Đơn Phát (BCE)',
    '04-09': '04-09. Sequence - OPS Đóng Bao MB (BCE)',
    '04-10': '04-10. Sequence - OPS Gỡ Bao MB (BCE)',
    '04-11': '04-11. Sequence - OPS Quản Lý Chuyến Xe Tuyến Trục (BCE)',
    '04-12': '04-12. Sequence - OPS Quét Xe Xuất Bến Outbound (BCE)',
    '04-13': '04-13. Sequence - OPS Quét Xe Đến Inbound (BCE)',
    '04-14': '04-14. Sequence - OPS Xử Lý Sự Cố Giao Hàng NDR (BCE)',
    '04-15': '04-15. Sequence - OPS Quản Lý Chuyển Hoàn (BCE)',
    '04-16': '04-16. Sequence - OPS Tài Chính Đối Soát COD (BCE)',
    '04-17': '04-17. Sequence - OPS Quản Lý Tem Bao (BCE)',
    '04-18': '04-18. Sequence - OPS Gửi Hàng (BCE)',
    '04-19': '04-19. Sequence - OPS Nhận Hàng (BCE)',
    # 05-admin
    '05-01': '05-01. Sequence - Admin Đăng Nhập (BCE)',
    '05-02': '05-02. Sequence - Admin Đăng Xuất (BCE)',
    '05-03': '05-03. Sequence - Admin Giám Sát Tổng Quan (BCE)',
    '05-04': '05-04. Sequence - Admin Quản Lý Mạng Lưới Bưu Cục (BCE)',
    '05-05': '05-05. Sequence - Admin Quản Lý Hub (BCE)',
    '05-06': '05-06. Sequence - Admin Quản Lý Zone Cước (BCE)',
    '05-07': '05-07. Sequence - Admin Cấu Hình Lỗi Vận Chuyển NDR (BCE)',
    '05-08': '05-08. Sequence - Admin Cấu Hình Điều Khoản Dịch Vụ (BCE)',
    '05-09': '05-09. Sequence - Admin Quản Lý Tài Khoản OPS (BCE)',
    '05-10': '05-10. Sequence - Admin Quản Lý Tài Khoản Courier (BCE)',
    '05-11': '05-11. Sequence - Admin Quản Lý Tài Khoản Merchant (BCE)',
    '05-12': '05-12. Sequence - Admin Quản Lý Tài Khoản Khách Hàng (BCE)',
    '05-13': '05-13. Sequence - Admin Phân Quyền Mobile (BCE)',
    # 06-customer
    '06-01': '06-01. Sequence - Customer Đăng Ký Tài Khoản (BCE)',
    '06-02': '06-02. Sequence - Customer Đăng Nhập (BCE)',
    '06-03': '06-03. Sequence - Customer Quản Lý Hồ Sơ (BCE)',
    '06-04': '06-04. Sequence - Customer Đăng Xuất (BCE)',
    '06-05': '06-05. Sequence - Customer Quản Lý Sổ Địa Chỉ (BCE)',
    '06-06': '06-06. Sequence - Customer Tạo Đơn Gửi Bưu Phẩm (BCE)',
    '06-07': '06-07. Sequence - Customer Tra Cứu Đơn Hàng (BCE)',
    '06-08': '06-08. Sequence - Customer Ước Tính Cước (BCE)',
    '06-09': '06-09. Sequence - Customer Trợ Lý AI Hỗ Trợ (BCE)',
    '06-10': '06-10. Sequence - Customer Quản Lý Tài Khoản Ngân Hàng (BCE)',
}

def get_diagram_info(puml_path):
    parts = puml_path.split('/')
    actor_num = parts[2].split('-')[0]
    sub_num = parts[3].split('-')[0]
    filename = parts[4].replace('.puml', '')
    
    key = f"{actor_num}-{sub_num}"
    if 'delivery-success' in filename:
        key = f"{actor_num}-{sub_num}-delivery-success"
        
    title = TITLES.get(key, f"{key}. Sequence - {filename} (BCE)")
    out_fname = f"{key}_{filename}"
    return title, out_fname

def run_batch(actor_folder):
    pumls = sorted(glob.glob(f"docs/sequence-diagrams/{actor_folder}/**/*.puml", recursive=True))
    print(f"=== BATCH: {actor_folder} ({len(pumls)} diagrams) ===")
    
    diagrams = []
    for p in pumls:
        title, out_fname = get_diagram_info(p)
        print(f"  Parsing: {p} -> {title}")
        d = gen.process_diagram(title, p, out_fname)
        diagrams.append(d)
        
    java_src = gen.generate_java_source(diagrams, class_name='NexusSequencePlugin')
    
    plugin_dir = '/Users/Tai.IS/Library/Application Support/VisualParadigm/plugins/nexus_sequence_plugin'
    java_file = os.path.join(plugin_dir, 'nexus', 'NexusSequencePlugin.java')
    os.makedirs(os.path.dirname(java_file), exist_ok=True)
    with open(java_file, 'w', encoding='utf-8') as f:
        f.write(java_src)
        
    print(f"  Compiling {java_file}...")
    javac = "/Applications/Visual Paradigm.app/Contents/Resources/jre.bundle/Contents/Home/bin/javac"
    res = subprocess.run([javac, "-cp", ".:/tmp/vp_classes", java_file], capture_output=True, text=True)
    if res.returncode != 0:
        print("  COMPILATION ERROR:\n", res.stderr)
        return False
        
    print("  Executing Plugin in Visual Paradigm...")
    java_bin = "/Applications/Visual Paradigm.app/Contents/Resources/jre.bundle/Contents/Home/bin/java"
    vp_bin = "/Applications/Visual Paradigm.app/Contents/Resources/app/bin"
    cp = ".:../lib/vpplatform.jar:../lib/jniwrap.jar:../lib/winpack.jar:../ormlib/orm.jar:../ormlib/orm-core.jar:../lib/lib01.jar:../lib/lib02.jar:../lib/lib03.jar:../lib/lib04.jar:../lib/lib05.jar:../lib/lib06.jar:../lib/lib07.jar:../lib/lib08.jar:../lib/lib09.jar:../lib/lib10.jar:../lib/lib11.jar:../lib/lib12.jar:../lib/lib13.jar:../lib/lib14.jar:../lib/lib15.jar:../lib/lib16.jar:../lib/lib17.jar:../lib/lib18.jar:../lib/lib19.jar:../lib/lib20.jar"
    
    cmd = [
        java_bin,
        "-Xms256m", "-Xmx768m", "-Djava.awt.headless=true",
        "-cp", cp,
        "com.vp.cmd.Plugin",
        "-project", "/tmp/Nexus_staging.vpp",
        "-pluginid", "nexus_sequence_plugin"
    ]
    res2 = subprocess.run(cmd, cwd=vp_bin, capture_output=True, text=True)
    print("  Plugin execution finished with code:", res2.returncode)
    for line in res2.stdout.splitlines():
        if "Building:" in line or "Exported PNG" in line or "ALL DIAGRAMS SAVED" in line:
            print("   ", line)
    if res2.returncode != 0:
        print("  STDERR:\n", res2.stderr)
        return False
        
    return True

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else '02-merchant'
    ok = run_batch(target)
    if ok:
        print(f"Batch {target} SUCCEEDED!")
    else:
        print(f"Batch {target} FAILED!")
        sys.exit(1)
