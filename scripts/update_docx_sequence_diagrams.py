import os
import re
import sys
import docx
from docx.oxml import parse_xml
from PIL import Image

def main():
    docx_path = sys.argv[1] if len(sys.argv) > 1 else 'docs/BaoCaoDoAnNexus.docx'
    output_path = sys.argv[2] if len(sys.argv) > 2 else docx_path
    
    vp_dir = 'docs/sequence-diagrams/Visual_Paradigm'
    
    mapping = [
        # 5.4.1 Guest (5)
        ('5.4.1.1 Tra cứu trạng thái bưu kiện', '01-01_01-guest-tracking-bce.png'),
        ('5.4.1.2 Đăng ký tài khoản', '01-02_02-guest-registration-bce.png'),
        ('5.4.1.3 Ước tính cước', '01-03_03-quote-pricing-bce.png'),
        ('5.4.1.4 Trợ lý tư vấn AI Chatbot', '01-05_05-ai-chatbot-assistant-bce.png'),
        ('5.4.1.5 Tra cứu bưu cục / điểm gửi hàng', '01-04_04-hub-lookup-bce.png'),
        
        # 5.4.2 Merchant (11)
        ('5.4.2.1 Đăng nhập cổng Merchant', '02-01_01-merchant-login-bce.png'),
        ('5.4.2.2 Đổi mật khẩu tài khoản', '02-02_02-merchant-change-password-bce.png'),
        ('5.4.2.3 Đăng xuất', '02-03_03-merchant-logout-bce.png'),
        ('5.4.2.4 Tạo đơn hàng', '02-04_04-merchant-create-shipment-bce.png'),
        ('5.4.2.5 Quản lý đơn hàng', '02-05_05-merchant-shipment-list-bce.png'),
        ('5.4.2.6 Quản lý yêu cầu lấy hàng', '02-06_06-merchant-pickup-management-bce.png'),
        ('5.4.2.7 In nhãn vận đơn', '02-07_07-merchant-print-label-bce.png'),
        ('5.4.2.8 Tra cứu vận đơn', '02-08_08-merchant-tracking-lookup-bce.png'),
        ('5.4.2.9 Hủy đơn hàng', '02-09_09-merchant-cancel-shipment-bce.png'),
        ('5.4.2.10 Yêu cầu hoàn hàng', '02-10_10-merchant-return-request-bce.png'),
        ('5.4.2.11 Quản lý tài chính & Đối soát COD', '02-11_11-merchant-finance-reconciliation-bce.png'),

        # 5.4.3 Courier (11)
        ('5.4.3.1 Đăng nhập ứng dụng di động', '03-01_01-courier-login-bce.png'),
        ('5.4.3.2 Đổi mật khẩu tài xế', '03-02_02-courier-change-password-bce.png'),
        ('5.4.3.3 Đăng xuất', '03-03_03-courier-logout-bce.png'),
        ('5.4.3.4 Quản lý nhiệm vụ giao nhận', '03-04_04-courier-task-management-bce.png'),
        ('5.4.3.5 Xác nhận lấy hàng', '03-05_05-courier-pickup-confirmation-bce.png'),
        ('5.4.3.6 Liên hệ người nhận', '03-06_06-courier-contact-customer-bce.png'),
        ('5.4.3.7 Chụp ảnh bằng chứng POD', '03-07_07-courier-pod-capture-bce.png'),
        ('5.4.3.8 Xác nhận phát thành công', '03-07-delivery-success_07-courier-delivery-success-bce.png'),
        ('5.4.3.9 Báo cáo sự cố phát thất bại', '03-08_08-courier-delivery-failure-bce.png'),
        ('5.4.3.10 Nộp tiền COD', '03-09_09-courier-cod-remittance-bce.png'),
        ('5.4.3.11 Giám sát hạn mức công nợ', '03-10_10-courier-liability-supervision-bce.png'),

        # 5.4.4 Ops Staff (19)
        ('5.4.4.1 Đăng nhập hệ thống bưu cục', '04-01_01-ops-login-bce.png'),
        ('5.4.4.2 Đổi mật khẩu nhân viên', '04-02_02-ops-change-password-bce.png'),
        ('5.4.4.3 Đăng xuất', '04-03_03-ops-logout-bce.png'),
        ('5.4.4.4 Giám sát Dashboard vận hành', '04-04_04-ops-dashboard-monitoring-bce.png'),
        ('5.4.4.5 Tra cứu hành trình đơn', '04-05_05-ops-tracking-lookup-bce.png'),
        ('5.4.4.6 Tạo đơn hàng tại quầy', '04-06_06-ops-create-shipment-pos-bce.png'),
        ('5.4.4.7 Điều phối đơn hàng lấy', '04-07_07-ops-pickup-dispatch-bce.png'),
        ('5.4.4.8 Điều phối đơn hàng phát', '04-08_08-ops-delivery-dispatch-bce.png'),
        ('5.4.4.9 Đóng bao', '04-09_09-ops-bag-seal-bce.png'),
        ('5.4.4.10 Gỡ bao', '04-10_10-ops-bag-unseal-bce.png'),
        ('5.4.4.11 Quản lý chuyến xe', '04-11_11-ops-linehaul-trip-management-bce.png'),
        ('5.4.4.12 Quét xe đi (Outbound)', '04-12_12-ops-vehicle-outbound-bce.png'),
        ('5.4.4.13 Quét xe đến (Inbound)', '04-13_13-ops-vehicle-inbound-bce.png'),
        ('5.4.4.14 Xử lý sự cố giao thất bại (NDR)', '04-14_14-ops-ndr-resolution-bce.png'),
        ('5.4.4.15 Quản lý chuyển hoàn (Return)', '04-15_15-ops-return-management-bce.png'),
        ('5.4.4.16 Tài chính & Đối soát COD', '04-16_16-ops-finance-cod-settlement-bce.png'),
        ('5.4.4.17 Quản lý tem bao', '04-17_17-ops-bag-label-management-bce.png'),
        ('5.4.4.18 Gửi hàng', '04-18_18-ops-send-goods-bce.png'),
        ('5.4.4.19 Nhận hàng', '04-19_19-ops-goods-arrival-bce.png'),

        # 5.4.5 Customer (10)
        ('5.4.5.1 Đăng ký tài khoản người dùng', '06-01_01-customer-register-bce.png'),
        ('5.4.5.2 Đăng nhập', '06-02_02-customer-login-bce.png'),
        ('5.4.5.3 Quản lý hồ sơ', '06-03_03-customer-profile-management-bce.png'),
        ('5.4.5.4 Đăng xuất tài khoản khách hàng', '06-04_04-customer-logout-bce.png'),
        ('5.4.5.5 Tạo đơn gửi bưu phẩm cá nhân', '06-06_06-customer-create-shipment-bce.png'),
        ('5.4.5.6 Tra cứu đơn hàng', '06-07_07-customer-tracking-lookup-bce.png'),
        ('5.4.5.7 Ước tính cước và thời gian giao', '06-08_08-customer-quote-pricing-bce.png'),
        ('5.4.5.8 Quản lý địa chỉ mặc định', '06-05_05-customer-address-management-bce.png'),
        ('5.4.5.9 Trợ lý AI hỗ trợ đơn hàng (Tra cứu, phản ánh)', '06-09_09-customer-ai-assistant-bce.png'),
        ('5.4.5.10 Quản lý tài khoản ngân hàng', '06-10_10-customer-bank-account-bce.png'),

        # 5.4.6 Admin (13)
        ('5.4.6.1 Đăng nhập', '05-01_01-admin-login-bce.png'),
        ('5.4.6.2 Đăng xuất', '05-02_02-admin-logout-bce.png'),
        ('5.4.6.3 Giám sát tổng quan hệ thống', '05-03_03-admin-dashboard-overview-bce.png'),
        ('5.4.6.4 Quản lý mạng lưới bưu cục', '05-04_04-admin-network-map-bce.png'),
        ('5.4.6.5 Quản lý Hub', '05-05_05-admin-hub-management-bce.png'),
        ('5.4.6.6 Quản lý Zone', '05-06_06-admin-zone-management-bce.png'),
        ('5.4.6.7 Cấu hình lỗi vận chuyển', '05-07_07-admin-ndr-reason-config-bce.png'),
        ('5.4.6.8 Cấu hình điều khoản và dịch vụ', '05-08_08-admin-policy-terms-config-bce.png'),
        ('5.4.6.9 Quản lý tài khoản Ops', '05-09_09-admin-ops-account-management-bce.png'),
        ('5.4.6.10 Quản lý tài khoản Courier', '05-10_10-admin-courier-account-management-bce.png'),
        ('5.4.6.11 Quản lý tài khoản Merchant', '05-11_11-admin-merchant-account-management-bce.png'),
        ('5.4.6.12 Quản lý tài khoản Khách hàng', '05-12_12-admin-customer-account-management-bce.png'),
        ('5.4.6.13 Phân quyền Mobile', '05-13_13-admin-mobile-permission-override-bce.png'),
    ]

    map_dict = {item[0]: item[1] for item in mapping}
    
    print(f"Loading document: {docx_path}...")
    doc = docx.Document(docx_path)
    
    # Exact page boundary constants (A4 paper with 2.0cm margins)
    # Content width: 21.0cm - 2.0cm - 2.0cm = 17.0cm = 6,120,000 EMU
    MAX_W = 6120000
    
    # Maximum safe heights allowing Heading + Diagram on the exact same single page:
    MAX_H_FIRST = 7190000    # 19.97 cm (Page 1: Heading 2 + intro text + Heading 3 + Heading 4 + Diagram)
    MAX_H_H3 = 8090000       # 22.47 cm (Section start pages: Heading 3 + Heading 4 + Diagram)
    MAX_H_REGULAR = 8440000  # 23.44 cm (Regular pages: Heading 4 + Diagram)
    
    h3_start_titles = {
        '5.4.2 Nhóm các chức năng Merchant: (Chủ shop)',
        '5.4.3 Nhóm các chức năng Courier: (Nhân viên giao nhận)',
        '5.4.4 Nhóm các chức năng Ops Staff: (Nhân viên vận hành bưu cục)',
        '5.4.5 Nhóm các chức năng Customer: (Khách hàng cá nhân C-End)',
        '5.4.6 Nhóm các chức năng Admin: (Quản trị viên hệ thống)',
    }
    
    first_h4_under_h3 = {
        '5.4.1.1 Tra cứu trạng thái bưu kiện',
        '5.4.2.1 Đăng nhập cổng Merchant',
        '5.4.3.1 Đăng nhập ứng dụng di động',
        '5.4.4.1 Đăng nhập hệ thống bưu cục',
        '5.4.5.1 Đăng ký tài khoản người dùng',
        '5.4.6.1 Đăng nhập',
    }
    
    success_count = 0
    
    # First: configure pageBreakBefore on section headings
    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if txt in h3_start_titles:
            p.paragraph_format.page_break_before = True
            p.paragraph_format.keep_with_next = True
        elif p.style.name == 'Heading 4' and 1334 <= i <= 1485:
            p.paragraph_format.keep_with_next = True
            if txt not in first_h4_under_h3:
                p.paragraph_format.page_break_before = True
            else:
                p.paragraph_format.page_break_before = False
        elif p.style.name == 'Heading 2' and '5.5 Thiết kế cơ sở dữ liệu' in txt:
            p.paragraph_format.page_break_before = True
            p.paragraph_format.keep_with_next = True

    # Second: update images with maximized proportional scaling
    for i, p in enumerate(doc.paragraphs):
        if 1334 <= i <= 1485 and p.style.name == 'Heading 4':
            title = p.text.strip()
            if title in map_dict:
                fname = map_dict[title]
                img_path = os.path.join(vp_dir, fname)
                
                if not os.path.exists(img_path):
                    print(f"ERROR: Image file not found: {img_path}")
                    continue
                
                # Next paragraph contains the image
                next_p = doc.paragraphs[i + 1]
                xml = next_p._element.xml
                rids = re.findall(r'r:embed=\"(rId\d+)\"', xml)
                
                if not rids:
                    print(f"WARNING: No r:embed found in next paragraph for {title}")
                    continue
                
                rid = rids[0]
                part = doc.part.related_parts[rid]
                
                # Read new PNG bytes
                with open(img_path, 'rb') as f:
                    new_bytes = f.read()
                
                # Replace blob
                part._blob = new_bytes
                
                # Determine max available height for this page
                if title == '5.4.1.1 Tra cứu trạng thái bưu kiện':
                    max_h = MAX_H_FIRST
                elif title in first_h4_under_h3:
                    max_h = MAX_H_H3
                else:
                    max_h = MAX_H_REGULAR
                
                # Calculate maximized proportional dimensions
                im = Image.open(img_path)
                orig_w, orig_h = im.size
                
                scale_w = MAX_W / orig_w
                scale_h = max_h / orig_h
                scale = min(scale_w, scale_h)
                
                cx = int(orig_w * scale)
                cy = int(orig_h * scale)
                
                lim_type = "WIDTH-FLUSH" if scale == scale_w else "PAGE-HEIGHT"
                
                # Update XML extents and formatting
                new_xml = xml
                new_xml = re.sub(r'<wp:extent cx=\"\d+\" cy=\"\d+\"/>', f'<wp:extent cx=\"{cx}\" cy=\"{cy}\"/>', new_xml)
                new_xml = re.sub(r'<a:ext cx=\"\d+\" cy=\"\d+\"/>', f'<a:ext cx=\"{cx}\" cy=\"{cy}\"/>', new_xml)
                
                # Center alignment
                if '<w:jc w:val=' in new_xml:
                    new_xml = re.sub(r'<w:jc w:val=\"\w+\"/>', '<w:jc w:val=\"center\"/>', new_xml)
                else:
                    new_xml = new_xml.replace('</w:pPr>', '<w:jc w:val="center"/></w:pPr>')
                
                # Spacing before 0, after 0 to maximize available page space
                if '<w:spacing ' in new_xml:
                    new_xml = re.sub(r'<w:spacing [^/]+/>', '<w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>', new_xml)
                else:
                    new_xml = new_xml.replace('</w:pPr>', '<w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>')
                
                new_p_elem = parse_xml(new_xml.encode('utf-8'))
                next_p._element.getparent().replace(next_p._element, new_p_elem)
                
                success_count += 1
                w_cm = cx / 360000
                h_cm = cy / 360000
                print(f"[{success_count:02d}/69] Maximized: {title[:32]:<32} -> {w_cm:4.1f}cm x {h_cm:4.1f}cm ({lim_type})")
    
    print(f"\nTotal diagrams maximized and updated: {success_count} / {len(mapping)}")
    if success_count == len(mapping):
        print(f"Saving updated document to: {output_path}...")
        doc.save(output_path)
        print("Done! Document successfully updated and saved.")
    else:
        print("ERROR: Did not update all 69 diagrams! Aborting save.")
        sys.exit(1)

if __name__ == '__main__':
    main()
