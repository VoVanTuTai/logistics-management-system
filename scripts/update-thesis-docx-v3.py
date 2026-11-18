#!/usr/bin/env python3
"""
Generate BaoCaoKLTN_TranTanTai_VoVanTuTai_version3.docx from version2.docx.

Applies all 3 phases of the approved Anti-Plagiarism, Deduplication & Humanization Plan:
  - Phase 1: Restructure & rewrite Chapter 2 (17 verbose textbook sections -> 6 concise,
             Nexus-Express-contextualized technical groups, preserving Table 2.1 and ALL
             23 citations [1]..[23] accurately mapped to TAI LIEU THAM KHAO).
  - Phase 2: Deduplicate & humanize Chapters 1, 3, and 4 using "Single Home per Concept"
             (fix scrambled ports in 4.5, fix 11->12 DB list in 3.3.3.2, fix 66->69 UC,
             align Opaque Bearer Token, fix typos & remove blank padding).
  - Phase 3: Clean Chapters 5, 6, 7, 8 & TOC (fix 66->69 UC in Ch.5, condense repeated
             6-actor blocks in 5.1.1 & 7.2.1, fix Redis/PWA/VPS inaccuracies in Ch.6-7,
             eliminate 100% of AI boilerplate/cliches across the entire thesis).
"""

import copy
import os
import re
import docx
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

INPUT_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai_version2.docx"
OUTPUT_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai_version3.docx"


def set_para_text(p, new_text):
    """Replace paragraph text while preserving its paragraph style and first run formatting."""
    if not p.runs:
        p.text = new_text
        return
    r0_rpr = copy.deepcopy(p.runs[0]._r.find(qn("w:rPr")))
    # Remove all existing run/hyperlink children except pPr
    for child in list(p._element):
        if child.tag != qn("w:pPr"):
            p._element.remove(child)
    r = OxmlElement("w:r")
    if r0_rpr is not None:
        r.append(r0_rpr)
    t = OxmlElement("w:t")
    if new_text.startswith(" ") or new_text.endswith(" "):
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    t.text = new_text
    r.append(t)
    p._element.append(r)


def make_styled_para_before(ref_elem, text, template_p):
    """Clone formatting (pPr + first run rPr) from template_p and insert before ref_elem."""
    new_p = OxmlElement("w:p")
    pPr = template_p._element.find(qn("w:pPr"))
    if pPr is not None:
        new_p.append(copy.deepcopy(pPr))
    r = OxmlElement("w:r")
    if template_p.runs:
        rPr = template_p.runs[0]._r.find(qn("w:rPr"))
        if rPr is not None:
            r.append(copy.deepcopy(rPr))
    t = OxmlElement("w:t")
    if text.startswith(" ") or text.endswith(" "):
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    t.text = text
    r.append(t)
    new_p.append(r)
    ref_elem.addprevious(new_p)
    return new_p


def remove_elem(elem):
    parent = elem.getparent()
    if parent is not None:
        parent.remove(elem)


def enable_update_fields(doc):
    settings = doc.settings.element
    uf = settings.find(qn("w:updateFields"))
    if uf is None:
        uf = OxmlElement("w:updateFields")
        settings.append(uf)
    uf.set(qn("w:val"), "true")


def main():
    assert os.path.exists(INPUT_PATH), f"Missing {INPUT_PATH}"
    doc = docx.Document(INPUT_PATH)
    paras = doc.paragraphs
    print(f"Loaded {INPUT_PATH}: {len(paras)} paragraphs, {len(doc.tables)} tables")

    # Capture clean template paragraphs for Chapter 2 rebuild BEFORE any removals
    tpl_h2 = paras[481]      # Heading 2
    tpl_h3 = paras[486]      # Heading 3
    tpl_norm = paras[482]    # Normal
    tpl_list = paras[500]    # List Paragraph
    tpl_h6 = paras[497]      # Heading 6 (table caption)

    # Track elements to delete at the end (using element references so indices stay stable!)
    elems_to_remove = []

    # =========================================================================
    # PHASE 2A: CHƯƠNG 1 — Cắt lặp 6 actor, xóa mở bài AI & từ sáo, chuẩn hóa
    # =========================================================================
    ch1_updates = {
        335: (
            "Sự mở rộng nhanh của bán hàng trực tuyến kéo theo khối lượng đơn giao hàng tăng mạnh về cả tần suất "
            "lẫn yêu cầu đối soát. Với các đơn vị chuyển phát nhanh, thách thức lớn nhất hiện nay không nằm ở khâu "
            "nhận đơn đơn lẻ, mà ở việc đồng bộ trạng thái kiện hàng xuyên suốt từ lúc lấy hàng tại kho người gửi, "
            "chia chọn tại bưu cục trung chuyển cho tới giao chặng cuối, thu hộ COD và xử lý hoàn hàng."
        ),
        336: (
            "Nhiều hệ thống quản lý vận đơn trước đây được xây dựng theo kiến trúc nguyên khối (Monolithic), "
            "dễ phát sinh hạn chế khi lưu lượng đơn hàng tăng cao theo mùa vụ:"
        ),
        337: (
            "Nghẽn tài nguyên cục bộ tại các thao tác có tần suất đọc/ghi cao như quét mã vạch nhập xuất kho, "
            "tính cước đa vùng và tra cứu hành trình vận đơn."
        ),
        338: (
            "Phụ thuộc chặt giữa các phân hệ trên cùng một cơ sở dữ liệu khiến sự cố hoặc đợt cập nhật ở một chức năng "
            "có thể ảnh hưởng dây chuyền sang các luồng vận hành khác."
        ),
        339: (
            "Khó tích hợp linh hoạt trợ lý tự động hỗ trợ tra cứu hành trình, giải đáp quy định gửi hàng và tiếp nhận "
            "khiếu nại ngoài giờ hành chính."
        ),
        340: (
            "Xuất phát từ thực tế đó, nhóm thực hiện đề tài \"Thiết kế và xây dựng hệ thống quản lý và trung chuyển "
            "bưu kiện cho doanh nghiệp chuyển phát nhanh dựa trên kiến trúc Microservices\" nhằm xây dựng một nền tảng "
            "phân tán có khả năng cô lập dữ liệu rõ ràng, mở rộng theo từng phân hệ và tích hợp trợ lý AI có kiểm soát."
        ),
        343: (
            "Đề tài hướng tới số hóa và chuẩn hóa chuỗi nghiệp vụ chuyển phát nhanh nội địa theo thực tiễn vận hành "
            "bưu chính và quy định hiện hành của Luật Bưu chính Việt Nam:"
        ),
        344: (
            "Quản lý xuyên suốt vòng đời vận đơn từ lúc khởi tạo, lấy hàng, đóng bao niêm phong kẹp chì seal, trung chuyển "
            "qua mạng lưới bưu cục 4 cấp cho tới giao phát kèm ảnh minh chứng POD, xử lý giao thất bại và chuyển hoàn."
        ),
        345: (
            "Chuẩn hóa luồng khai thác chia chọn và điều phối giữa các cấp bưu cục (Mega Hub, Regional Hub, Provincial Hub, "
            "Local Post Office) gắn với bảng kê đóng bao và bàn giao chuyến xe liên bưu cục."
        ),
        346: (
            "Thống nhất một động cơ tính cước dùng chung cho toàn bộ ứng dụng Web, Mobile và trợ lý AI, tránh lệch phí "
            "giữa bước báo giá và bước đối soát."
        ),
        347: (
            "Triển khai kiến trúc Microservices gắn với các cơ chế đảm bảo độ tin cậy dữ liệu gồm Database-per-Service, "
            "Transactional Outbox, tách bạch Đọc/Ghi (CQRS-Lite) và chống xử lý trùng lặp (Idempotency)."
        ),
        350: (
            "Về kiến trúc và backend: Xây dựng 14 microservices độc lập bằng NestJS, TypeScript và Prisma ORM "
            "(riêng gateway-bff kết nối chat_db qua pg.Pool), quản trị 12 cơ sở dữ liệu PostgreSQL tách biệt và đồng bộ "
            "sự kiện bất đồng bộ qua RabbitMQ theo mẫu Transactional Outbox và CQRS-Lite."
        ),
        351: (
            "Về ứng dụng người dùng: Phát triển 6 ứng dụng đầu cuối phục vụ 6 nhóm tác nhân gồm 4 ứng dụng Web "
            "(React 18 / Vite 5 / TailwindCSS) và 2 ứng dụng di động (Expo 54 / React Native 0.81)."
        ),
        354: (
            "Về phân hệ AI: Xây dựng chatbot-service chạy độc lập với Google Gemini (gemini-3.5-flash-lite), "
            "dự phòng qua Groq LPU (openai/gpt-oss-120b, qwen/qwen3.8-27b) và tác tử kiểm duyệt rủi ro trên OpenRouter "
            "(nvidia/nemotron-3.5-lightning:free), ứng dụng Hybrid RAG (vector 3072 chiều), gọi công cụ tra cứu nội bộ và truyền luồng SSE."
        ),
        355: (
            "Về kiểm soát truy cập: Tập trung hóa xác thực bằng Opaque Bearer Token kết hợp phân quyền theo vai trò (RBAC) "
            "và cơ chế ghi đè quyền trên thiết bị di động."
        ),
        # 1.3 Yêu cầu ban đầu: rút gọn từ 6 đoạn lặp 6 actor thành 2 đoạn tổng quan gọn (Single Home ở Ch.3)
        357: (
            "Hệ thống Nexus Express cần đáp ứng đồng thời hai nhóm nhu cầu chính trong chuỗi vận hành chuyển phát nhanh. "
            "Ở nhóm người dùng bên ngoài (khách vãng lai, khách hàng cá nhân và đối tác gửi hàng Merchant), hệ thống phải "
            "hỗ trợ dự toán cước, tạo đơn, in nhãn mã vạch, theo dõi hành trình trực tuyến, quản lý yêu cầu hoàn hàng, "
            "đối soát tiền thu hộ COD và tra cứu quy định qua trợ lý AI."
        ),
        358: (
            "Ở nhóm vận hành nội bộ (bưu tá hiện trường, nhân viên bưu cục và quản trị viên), hệ thống cần cung cấp công cụ "
            "nhận nhiệm vụ lấy/giao trên di động có hàng đợi ngoại tuyến (Offline Queue), chụp ảnh POD, quét mã nhập xuất kho, "
            "đóng bao kẹp chì seal trung chuyển liên bưu cục, xử lý ca giao thất bại (NDR), quyết toán COD và quản trị danh mục "
            "mạng lưới Hub/Zone cùng phân quyền truy cập. Chi tiết vai trò và yêu cầu từng nhóm tác nhân được phân tích đầy đủ tại Chương 3."
        ),
        # 1.4.1 Đối tượng nghiên cứu: cắt đoạn lặp chi tiết công thức & 6 actor (chỉ giữ danh mục phạm vi nghiên cứu)
        376: (
            "Quy chuẩn nghiệp vụ bưu chính nội địa: vòng đời vận đơn, quy tắc tính cước thể tích theo chuẩn IATA, "
            "phân cấp mạng lưới bưu cục 4 cấp, quy trình giao phát có bằng chứng POD, xử lý giao thất bại (NDR), "
            "bồi thường theo Luật Bưu chính và đối soát tiền thu hộ COD (phân tích chi tiết tại Chương 3)."
        ),
        382: (
            "6 nhóm tác nhân tham gia hệ thống gồm: Khách vãng lai (Guest), Khách hàng cá nhân (Customer), Đối tác gửi hàng (Merchant), "
            "Nhân viên giao nhận (Courier), Nhân viên vận hành (Ops Staff) và Quản trị viên (Admin). Vai trò cụ thể của từng nhóm "
            "được trình bày tập trung tại Mục 3.1."
        ),
        # 1.4.2 Phạm vi đề tài
        388: (
            "Đề tài tập trung xây dựng nền tảng quản lý và trung chuyển bưu kiện cho nghiệp vụ chuyển phát nhanh nội địa "
            "tại Việt Nam với phạm vi cụ thể như sau:"
        ),
        389: (
            "Đối tượng sử dụng: Phục vụ 6 nhóm tác nhân trong chuỗi giao nhận nội địa (Guest, Customer, Merchant, Courier, "
            "Ops Staff và Admin). Các bên ngoài phạm vi chuyển phát nội địa như hải quan xuất nhập khẩu hoặc hãng tàu quốc tế "
            "không nằm trong phạm vi thực hiện."
        ),
        395: (
            "Quản lý bảng kê đóng bao (Manifest), niêm phong chì seal và bàn giao chuyến xe trung chuyển giữa các bưu cục."
        ),
        399: (
            "Tích hợp trợ lý AI Hybrid RAG có gọi công cụ nội bộ (tra cứu vận đơn, ước tính cước, kiểm tra hàng cấm, "
            "hướng dẫn khiếu nại) và truyền phản hồi theo luồng SSE."
        ),
        # 1.5 Ý nghĩa khoa học và thực tiễn
        404: (
            "Đánh giá và kiểm chứng thực tế việc áp dụng kiến trúc Microservices hướng sự kiện trong bài toán chuyển phát nhanh, "
            "giúp tách tải giữa các thao tác ghi giao dịch kho và truy vấn tra cứu hành trình."
        ),
        405: (
            "Triển khai đồng bộ các mẫu thiết kế phân tán gồm Database-per-Service, Transactional Outbox và CQRS-Lite Read Model, "
            "minh họa khả năng đảm bảo nhất quán cuối (Eventual Consistency) mà không cần dùng giao dịch khóa phân tán phức tạp."
        ),
        408: (
            "Hỗ trợ doanh nghiệp chuyển phát nhanh chuẩn hóa quy trình từ nhận đơn, chia chọn tại kho, đóng bao kẹp chì seal "
            "đến giao chặng cuối và quyết toán COD, góp phần giảm sai sót nhập liệu và thất thoát hàng hóa."
        ),
        412: (
            "Tạo nền tảng kỹ thuật có khả năng mở rộng theo từng phân hệ và sẵn sàng kết nối đối tác bán hàng bên ngoài qua API/Webhook."
        ),
        # 1.6 Đề xuất giải pháp
        414: (
            "Từ đặc thù luân chuyển kiện hàng vật lý qua nhiều điểm chạm, đề tài xây dựng hệ thống Nexus Express theo kiến trúc "
            "Microservices hướng sự kiện, lấy trạng thái vòng đời vận đơn làm trung tâm điều phối giữa các dịch vụ."
        ),
        417: (
            "Bao phủ chuỗi nghiệp vụ chuyển phát nội địa từ lấy hàng, chia chọn qua mạng lưới bưu cục 4 cấp, trung chuyển liên bưu cục "
            "bằng bảng kê đóng bao cho tới phát hàng chặng cuối và xử lý hoàn hàng."
        ),
        426: (
            "Frontend Web (4 ứng dụng): React 18, Vite 5, TypeScript, TailwindCSS, Zustand và TanStack Query v5."
        ),
        433: (
            "Hạ tầng triển khai: Quản lý 15 tiến trình Node.js bằng PM2 kết hợp 4 container Docker Desktop (PostgreSQL, RabbitMQ, "
            "Redis, MinIO) và công khai HTTPS qua Cloudflare Zero Trust Tunnel."
        ),
        435: (
            "Xác thực phiên làm việc bằng Opaque Bearer Token quản lý tập trung tại auth-service, cho phép thu hồi phiên ngay lập tức khi đăng xuất hoặc khóa tài khoản."
        ),
        440: (
            "Khảo sát quy trình khai thác bưu chính thực tế gồm lấy hàng, chia chọn kho, đóng bao trung chuyển, giao chặng cuối, xử lý NDR và đối soát COD."
        ),
        441: (
            "Tìm hiểu quy định tính cước thể tích IATA, phân tầng chính sách chuyển hoàn và khung bồi thường theo Luật Bưu chính Việt Nam."
        ),
        446: (
            "Thiết kế phân hệ trợ lý AI Hybrid RAG kết hợp công cụ tra cứu nội bộ và cơ chế kiểm duyệt rủi ro trước khi bàn giao xử lý khiếu nại."
        ),
        # 1.7 Bố cục báo cáo (cập nhật đúng Chương 2 mới 6 mục)
        453: (
            "Chương 2 - Cơ sở lý thuyết: Trình bày nền tảng kỹ thuật cốt lõi được chọn lọc và đối chiếu trực tiếp với hệ thống "
            "Nexus Express gồm 6 nhóm: đặc thù chuyển phát nhanh, kiến trúc Microservices/BFF/RabbitMQ/Outbox, Database-per-Service/CQRS/PostgreSQL/MinIO, "
            "xác thực phân quyền và NestJS/TypeScript, giao diện Web/Mobile ngoại tuyến, và AI Hybrid RAG cùng hạ tầng Docker/PM2."
        ),
    }

    for idx, txt in ch1_updates.items():
        set_para_text(paras[idx], txt)

    # Remove redundant paragraphs inside Ch.1:
    # - P[352], P[353] (merged into P[351])
    # - P[359]..P[363] (duplicate 6-actor paragraphs in 1.3)
    # - P[377]..P[380] (duplicate IATA/Hub/Insurance/3-tier lines in 1.4.1)
    # - P[383]..P[386] (duplicate 6-actor list in 1.4.1)
    # - P[460]..P[478] (19 blank empty padding lines at end of Ch.1; keep P[479] as 1 spacer)
    for idx in (
        [352, 353]
        + list(range(359, 364))
        + list(range(377, 381))
        + list(range(383, 387))
        + list(range(460, 479))
    ):
        elems_to_remove.append(paras[idx]._element)

    # =========================================================================
    # PHASE 1: CHƯƠNG 2 — Tái cấu trúc 17 mục dàn trải -> 6 nhóm gắn thực tế
    # Bảo toàn Table 2.1 (doc.tables[2]) và 100% trích dẫn [1]..[23] chuẩn xác
    # =========================================================================
    # Find Table 2.1 element so we insert content before & after it cleanly
    tbl_2_1_elem = doc.tables[2]._element

    # Content BEFORE Table 2.1 (Sections 2.1 and 2.2.1 lead-in + Bảng 2.1 caption)
    ch2_before_table = [
        ("H2", "2.1. Đặc thù nghiệp vụ chuyển phát nhanh và bài toán hệ thống phân tán"),
        ("N", (
            "Hoạt động chuyển phát nhanh bưu chính mang đặc trưng kết hợp giữa dòng chảy vật lý ngoài hiện trường và dòng "
            "dữ liệu giao dịch thời gian thực. Một vận đơn thông thường phải đi qua nhiều điểm chạm nối tiếp như khởi tạo đơn, "
            "thu gom chặng đầu, cân đo chia chọn tại kho trung chuyển, đóng bao niêm phong liên bưu cục, giao phát chặng cuối "
            "kèm ảnh xác nhận và quyết toán tiền thu hộ COD [1]. Mỗi khâu có đặc tính tải và yêu cầu lưu trữ khác nhau: "
            "bưu cục giờ cao điểm phát sinh lượng quét mã vạch ghi liên tục, trong khi khách hàng và chủ shop lại truy vấn "
            "hành trình đọc với tần suất rất lớn."
        )),
        ("N", (
            "Khi đặt toàn bộ các nghiệp vụ này vào một ứng dụng nguyên khối dùng chung cơ sở dữ liệu, các truy vấn thống kê "
            "hoặc tra cứu hành trình dễ gây tranh chấp khóa bảng với luồng ghi quét kho và thanh toán COD. Vì vậy, thiết kế "
            "hệ thống cho Nexus Express đòi hỏi tách rõ ranh giới miền nghiệp vụ, cách ly dữ liệu đọc/ghi và cho phép các phân hệ "
            "trao đổi sự kiện không đồng bộ để duy trì vận hành liên tục ngay cả khi một thành phần gặp sự cố cục bộ."
        )),
        ("H2", "2.2. Kiến trúc Microservices, API Gateway/BFF và giao tiếp hướng sự kiện"),
        ("H3", "2.2.1. Phân rã miền nghiệp vụ (DDD) và so sánh với kiến trúc nguyên khối"),
        ("N", (
            "Kiến trúc Microservices tổ chức phần mềm thành tập hợp các dịch vụ nhỏ, chạy trên tiến trình độc lập và xoay quanh "
            "từng miền nghiệp vụ cụ thể (Bounded Context) theo phương pháp Thiết kế hướng miền (Domain-Driven Design – DDD) [2], [3]. "
            "Thay vì chia sẻ mã nguồn và lược đồ bảng chung như mô hình nguyên khối, mỗi dịch vụ có chu kỳ phát triển, triển khai "
            "và mở rộng tài nguyên riêng, đồng thời khoanh vùng lỗi khi một phân hệ quá tải [4], [5]."
        )),
        ("N", (
            "Tuy nhiên, Microservices không phải lựa chọn mặc định cho mọi bài toán vì kéo theo chi phí vận hành mạng nội bộ, "
            "quản lý nhất quán dữ liệu phân tán và gỡ lỗi xuyên dịch vụ. Nhóm chấp nhận sự đánh đổi này cho Nexus Express do nghiệp vụ "
            "bưu chính tách tự nhiên thành các vòng đời độc lập (đơn hàng, quét kho, điều phối, đối soát COD, tra cứu và trợ lý AI), "
            "phù hợp để phân rã thành 14 dịch vụ có trách nhiệm rõ ràng. Bảng 2.1 đối chiếu các tiêu chí chính giữa hai mô hình."
        )),
        ("H6", "Bảng 2.1. So sánh kiến trúc Monolithic và Microservices"),
    ]

    # Content AFTER Table 2.1 (Sections 2.2.2 -> 2.6.3)
    ch2_after_table = [
        ("H3", "2.2.2. Cổng giao tiếp API Gateway và mẫu thiết kế Backend-For-Frontend (BFF)"),
        ("N", (
            "Trong hệ thống gồm nhiều dịch vụ nội bộ, việc để ứng dụng Web và Mobile gọi trực tiếp từng cổng dịch vụ sẽ làm "
            "phức tạp cấu hình phía máy khách và phơi bày cấu trúc mạng nội bộ. API Gateway đóng vai trò điểm vào duy nhất "
            "(Single Entrypoint) tiếp nhận lưu lượng từ bên ngoài, kiểm tra xác thực sơ bộ, giới hạn tần suất và định tuyến "
            "tới đúng dịch vụ đích [5]. Mở rộng theo hướng Backend-For-Frontend (BFF), lớp cổng này còn tổng hợp dữ liệu và "
            "điều chỉnh định dạng phản hồi phù hợp với đặc thù từng nhóm giao diện như web quản trị hay ứng dụng di động [4]."
        )),
        ("N", (
            "Tại Nexus Express, thay vì triển khai nhiều cổng BFF tách rời làm tăng tiêu thụ bộ nhớ, nhóm hợp nhất vào dịch vụ "
            "gateway-bff (cổng 3000) phân tách định tuyến theo tiền tố vai trò (/ops/*, /merchant/*, /admin/*, /courier/*, "
            "/customer/*, /public/*). Ngoài nhiệm vụ reverse proxy REST, gateway-bff còn giữ vai trò đầu mối duy nhất cho "
            "WebSocket thời gian thực, cấp URL ký sẵn tải ảnh POD lên MinIO và chuyển tiếp luồng phản hồi SSE từ chatbot-service."
        )),
        ("H3", "2.2.3. Kiến trúc hướng sự kiện, RabbitMQ và mẫu Transactional Outbox"),
        ("N", (
            "Các dịch vụ vi mô kết hợp hai kiểu giao tiếp tùy bản chất nghiệp vụ: giao tiếp đồng bộ (HTTP/REST) dùng khi cần "
            "kết quả tức thì như tính cước hoặc kiểm tra trạng thái đơn trước khi thao tác [5]; giao tiếp bất đồng bộ qua "
            "kiến trúc hướng sự kiện (Event-Driven Architecture – EDA) dùng để truyền thông báo trạng thái đã xảy ra mà không "
            "khóa luồng xử lý của dịch vụ nguồn [4], [6]. Theo mô hình Publish/Subscribe, dịch vụ phát hành chỉ cần gửi sự kiện "
            "vào bộ điều phối trung gian (Message Broker) để các dịch vụ quan tâm tự đăng ký tiêu thụ."
        )),
        ("N", (
            "Nhóm lựa chọn RabbitMQ (triển khai trên giao thức AMQP [7]) làm message broker thay cho Apache Kafka vì hai lý do "
            "thực tế: mức tiêu thụ RAM thấp phù hợp triển khai trên một nút máy chủ 16 GB RAM, và hỗ trợ sẵn Topic Exchange "
            "định tuyến linh hoạt theo khóa phân cấp (dùng ký tự * và #) kèm cơ chế xác nhận Ack/Nack, lưu bền vững (Durable) "
            "và hàng đợi lỗi Dead-Letter Exchange (DLX) kết hợp TTL. Trong Nexus Express, mọi sự kiện nghiệp vụ đi qua topic "
            "exchange domain.events; thông điệp xử lý lỗi được đưa qua các hàng đợi thử lại theo độ trễ (retry.10s, retry.1m) "
            "trước khi chuyển sang hàng đợi lưu vết (.dlq) để kiểm tra thủ công."
        )),
        ("N", (
            "Một rủi ro phổ biến trong giao tiếp sự kiện là lỗi ghi kép (Dual-write): dịch vụ đã lưu xong cơ sở dữ liệu nhưng "
            "mất kết nối tới RabbitMQ ngay trước lúc gửi sự kiện, khiến dữ liệu giữa các dịch vụ bị lệch [2], [4]. Để khắc phục, "
            "Nexus Express áp dụng mẫu Transactional Outbox trên 9 dịch vụ ghi: bản ghi nghiệp vụ và bản ghi sự kiện trong bảng "
            "OutboxEvent được ghi chung một giao dịch ACID cục bộ, sau đó tiến trình Relay định kỳ đọc và đẩy lên RabbitMQ. "
            "Do cơ chế gửi ít nhất một lần (At-least-once) có thể phát lặp thông điệp khi mạng gián đoạn, phía dịch vụ tiêu thụ "
            "bắt buộc kiểm tra khóa lũy đẳng (idempotencyKey) để bỏ qua các sự kiện đã xử lý [2]."
        )),
        ("H2", "2.3. Tổ chức dữ liệu phân tán: Database-per-Service, CQRS và lưu trữ đa mô hình"),
        ("H3", "2.3.1. Nguyên tắc Database-per-Service và tách bạch Đọc/Ghi (CQRS-Lite)"),
        ("N", (
            "Nguyên tắc Database-per-Service quy định mỗi microservice sở hữu hoàn toàn dữ liệu thuộc miền nghiệp vụ của mình "
            "và không cho phép dịch vụ khác truy cập trực tiếp bằng SQL JOIN hay khóa ngoại vật lý [2], [4]. Quy tắc này giúp "
            "mỗi dịch vụ tự do thay đổi cấu trúc bảng mà không làm gãy dịch vụ khác, đồng thời xác lập rõ Nguồn sự thật duy nhất "
            "(Single Source of Truth) cho từng thực thể như trạng thái vận đơn, vị trí quét kho hay công nợ COD."
        )),
        ("N", (
            "Song song đó, mẫu Command Query Responsibility Segregation (CQRS) tách mô hình cập nhật dữ liệu (Write Model) khỏi "
            "mô hình phục vụ truy vấn tổng hợp (Read Model) [8]. Thay vì truy vấn liên bảng phức tạp trực tiếp vào kho giao dịch "
            "khi khách tra cứu hành trình hoặc quản lý xem báo cáo KPI, Read Model lưu dữ liệu đã làm phẳng và cập nhật gần như "
            "tức thời thông qua việc lắng nghe sự kiện từ RabbitMQ [2], [8]. Trong Nexus Express, nhóm triển khai biến thể gọn "
            "(CQRS-Lite) với hai dịch vụ thuần đọc là tracking-service và reporting-service."
        )),
        ("H3", "2.3.2. PostgreSQL 16, Prisma ORM và chiến lược lưu trữ đa mô hình"),
        ("N", (
            "PostgreSQL 16 là hệ quản trị cơ sở dữ liệu quan hệ đối tượng tuân thủ chặt ACID, hỗ trợ cơ chế kiểm soát đồng thời "
            "đa phiên bản (MVCC) giúp luồng đọc không chặn luồng ghi, cùng kiểu dữ liệu JSONB cho phép lưu bản chụp biểu cước "
            "hoặc siêu dữ liệu linh hoạt bên cạnh các bảng quan hệ chuẩn [11]. Để rút ngắn thời gian ánh xạ dữ liệu và tận dụng "
            "kiểm tra kiểu tĩnh của TypeScript, 11 dịch vụ nghiệp vụ của hệ thống sử dụng Prisma ORM thông qua tệp khai báo "
            "schema.prisma, trình sinh truy vấn an toàn kiểu Prisma Client và công cụ quản lý phiên bản lược đồ Prisma Migrate [12]."
        )),
        ("N", (
            "Thay vì áp dụng cứng nhắc một công cụ cho toàn bộ hệ thống, nhóm vận dụng lưu trữ đa mô hình (Polyglot Persistence) "
            "theo đặc thù từng dịch vụ: 11 dịch vụ dùng Prisma ORM trên 11 cơ sở dữ liệu PostgreSQL riêng; riêng gateway-bff kết nối "
            "trực tiếp chat_db bằng thư viện pg.Pool nhẹ để quản lý hội thoại thời gian thực mà không cần tải thêm tầng ORM; "
            "pricing-service hoạt động phi trạng thái (stateless) hoàn toàn trong bộ nhớ; còn chatbot-service nạp chỉ mục vector "
            "từ tệp vector-index.json vào RAM để truy xuất nhanh dưới 5 ms."
        )),
        ("H3", "2.3.3. Lưu trữ đối tượng MinIO S3 và kênh thông điệp Redis Pub/Sub"),
        ("N", (
            "Các tệp nhị phân như ảnh minh chứng giao hàng (POD), ảnh chứng cứ chăm sóc khách hàng và hồ sơ khiếu nại không phù hợp "
            "để lưu trực tiếp trong cơ sở dữ liệu quan hệ vì làm phình kích thước bản sao lưu. MinIO cung cấp máy chủ lưu trữ đối tượng "
            "mã nguồn mở tương thích chuẩn Amazon S3 API, quản lý tệp theo cấu trúc phẳng trong các thùng chứa (Bucket) kèm cơ chế "
            "cấp liên kết tải lên tạm thời (Presigned URL) [22]. Trong hệ thống, toàn bộ tệp đa phương tiện được tổ chức trong một "
            "bucket duy nhất nexus-pod-images phân tách theo tiền tố thư mục (deliveries/, cskh-evidence/, claims-evidence/)."
        )),
        ("N", (
            "Bên cạnh đó, Redis 7 được triển khai với vai trò hẹp và rõ ràng là kênh xuất bản/đăng ký (Pub/Sub) trên topic "
            "gateway-bff:chat nhằm đồng bộ tin nhắn trò chuyện thời gian thực giữa các kết nối WebSocket tại lớp Gateway, "
            "tránh lạm dụng bộ đệm phân tán cho các luồng đã có Read Model PostgreSQL đảm nhiệm."
        )),
        ("H2", "2.4. Xác thực, phân quyền và nền tảng phát triển Backend"),
        ("H3", "2.4.1. Cơ chế xác thực Bearer Token và phân quyền đa tầng (RBAC & Mobile Override)"),
        ("N", (
            "Trên hệ thống phân tán phục vụ đồng thời trình duyệt Web và ứng dụng di động, cơ chế phiên dựa trên cookie truyền thống "
            "khó chia sẻ giữa nhiều miền và thiết bị. Hai hướng tiếp cận phổ biến hiện nay là mã thông báo tự chứa phi trạng thái "
            "(JWT) và mã thông báo đục quản lý phiên tập trung (Opaque Bearer Token) [4], [5]. Dù JWT giảm thao tác tra cứu phiên, "
            "việc thu hồi quyền ngay lập tức trước khi token hết hạn lại phức tạp khi cần khóa khẩn cấp tài khoản bưu tá hoặc thu hồi "
            "quyền thao tác hiện trường."
        )),
        ("N", (
            "Vì yêu cầu kiểm soát thu hồi phiên tức thì trong nghiệp vụ quản lý dòng tiền COD, Nexus Express lựa chọn Opaque Bearer Token "
            "sinh ngẫu nhiên do auth-service phát hành và đối chiếu phiên tập trung trong auth_db, gửi qua tiêu đề HTTP "
            "Authorization: Bearer <token>. Kiểm soát truy cập được tổ chức hai lớp gồm lớp biên giới tại gateway-bff (xác minh phiên "
            "và chặn truy cập trái phép) kết hợp lớp dịch vụ miền kiểm tra phân quyền theo vai trò (Role-Based Access Control – RBAC) [4], [5]. "
            "Riêng với lực lượng tác nghiệp trên di động, hệ thống bổ sung hồ sơ quyền di động (MobilePermissionProfile) và cơ chế ghi đè "
            "quyền tạm thời (Permission Override), cho phép quản trị viên bật hoặc tắt từng thao tác nhạy cảm mà không phải đổi vai trò gốc."
        )),
        ("H3", "2.4.2. Khung ứng dụng NestJS và ngôn ngữ TypeScript trong cấu trúc Monorepo"),
        ("N", (
            "Toàn bộ 14 dịch vụ backend của hệ thống được phát triển bằng NestJS trên nền tảng Node.js và TypeScript [9], [10]. "
            "NestJS cung cấp kiến trúc mô-đun hóa rõ ràng gồm Module, Controller, Service cùng cơ chế tiêm phụ thuộc (Dependency Injection) "
            "và đường ống xử lý yêu cầu (Pipes xác thực dữ liệu, Guards kiểm soát quyền truy cập, Interceptors ghi nhật ký), giúp cấu trúc "
            "mã nguồn giữa 14 dịch vụ duy trì tính đồng nhất khi làm việc nhóm [9]."
        )),
        ("N", (
            "TypeScript bổ sung hệ thống kiểm tra kiểu tĩnh ở thời điểm biên dịch trên nền JavaScript [10]. Khi kết hợp trong kho mã nguồn "
            "tập trung (Monorepo), nhóm đặt toàn bộ định nghĩa DTO, kiểu dữ liệu API và cấu trúc sự kiện RabbitMQ vào thư mục dùng chung "
            "contracts/, giúp phát hiện sớm sai lệch hợp đồng dữ liệu giữa dịch vụ phát hành, dịch vụ tiêu thụ và giao diện client ngay trước khi chạy."
        )),
        ("H2", "2.5. Công nghệ phát triển giao diện Web và Ứng dụng di động ngoại tuyến"),
        ("H3", "2.5.1. ReactJS và công cụ đóng gói Vite cho hệ sinh thái 4 cổng Web"),
        ("N", (
            "Bốn cổng web của hệ thống (quản trị, vận hành bưu cục, đối tác gửi hàng và tra cứu công khai) được xây dựng theo kiến trúc "
            "ứng dụng trang đơn (SPA) bằng ReactJS dựa trên tư duy phân rã giao diện thành các thành phần (Component) độc lập, quản lý "
            "luồng dữ liệu một chiều qua Props/State và tối ưu cập nhật DOM qua Virtual DOM [18]. Nhóm kết hợp TanStack Query để quản lý "
            "bộ nhớ đệm trạng thái từ API và Zustand cho trạng thái giao diện cục bộ nhằm giảm mã lặp so với các thư viện quản lý trạng thái nặng."
        )),
        ("N", (
            "Ở tầng đóng gói, Vite thay thế các bundler truyền thống bằng cách tận dụng Native ES Modules khi phát triển, biên dịch gói phụ thuộc "
            "bằng esbuild và hỗ trợ cập nhật nóng (HMR) ở mức mili-giây [19]. Trong môi trường triển khai thực tế, mã nguồn sau khi build tĩnh "
            "của cả 4 cổng web được phục vụ gọn nhẹ bởi một tiến trình Node.js duy nhất (nexus-static-web), giúp tiết kiệm bộ nhớ đáng kể."
        )),
        ("H3", "2.5.2. React Native, Expo và mẫu Hàng đợi ngoại tuyến (Offline Queue)"),
        ("N", (
            "Hai ứng dụng di động cho bưu tá (courier-mobile) và khách hàng cá nhân (customer-mobile) được phát triển bằng React Native kết hợp "
            "hệ sinh thái Expo để dùng chung nền tảng TypeScript/React nhưng vẫn biên dịch sang thành phần giao diện bản địa và truy cập mượt phần cứng "
            "camera quét mã vạch, chụp ảnh POD [20], [21]."
        )),
        ("N", (
            "Do bưu tá thường thao tác tại tầng hầm, thang máy hoặc khu vực sóng di động yếu, ứng dụng courier-mobile áp dụng mẫu thiết kế "
            "Hàng đợi ngoại tuyến (Offline Queue) lưu bền bỉ trên AsyncStorage [4], [21]. Khi thiết bị mất kết nối, các thao tác quét mã hoặc "
            "xác nhận giao phát không bị mất mà được xếp vào hàng đợi cục bộ kèm khóa định danh duy nhất (idempotencyKey); ngay khi có mạng "
            "trở lại, tiến trình nền tự động đồng bộ tuần tự lên máy chủ và đảm bảo phía backend không ghi nhận trùng lặp [2], [4]."
        )),
        ("H2", "2.6. Trợ lý AI ứng dụng Hybrid RAG, kiểm soát rủi ro và hạ tầng triển khai"),
        ("H3", "2.6.1. Retrieval-Augmented Generation (RAG), tìm kiếm lai và gọi công cụ động"),
        ("N", (
            "Các mô hình ngôn ngữ lớn (LLM) phát triển trên nền tảng học máy và xử lý ngôn ngữ tự nhiên cho phép xây dựng tác tử hội thoại "
            "hiểu ngữ cảnh linh hoạt hơn nhiều so với chatbot theo kịch bản cứng [13], [14]. Trong lĩnh vực chuyển phát nhanh, nhu cầu tra cứu "
            "hành trình, hỏi biểu cước và quy định bồi thường lặp lại với tần suất cao tạo động lực ứng dụng AI để giảm tải tổng đài [15]. "
            "Tuy nhiên, LLM thuần dễ gặp hiện tượng ảo giác (hallucination) — tự suy diễn sai giá cước hoặc mức đền bù pháp lý."
        )),
        ("N", (
            "Kỹ thuật Tạo sinh tăng cường truy xuất (Retrieval-Augmented Generation – RAG) khắc phục nhược điểm này bằng cách chuyển tài liệu "
            "nghiệp vụ thành vector ngữ nghĩa (Embeddings) và truy xuất các đoạn liên quan nhất đưa vào ngữ cảnh trước khi mô hình sinh câu trả lời [16]. "
            "Trong Nexus Express, nhóm kết hợp RAG ngữ nghĩa (vector 3072 chiều từ gemini-embedding-001) với tìm kiếm từ khóa/từ điển đồng nghĩa "
            "ngành bưu chính (Hybrid Search) trên 9 tài liệu SOP nội bộ; đồng thời áp dụng cơ chế gọi công cụ động (Tool Calling) để truy vấn dữ liệu "
            "biến động theo thời gian thực từ shipment-service, tracking-service và pricing-service [14], [16]."
        )),
        ("H3", "2.6.2. Điều phối đa mô hình dự phòng, truyền luồng SSE và kiểm soát Human-in-the-Loop"),
        ("N", (
            "Thay vì dồn toàn bộ trách nhiệm sinh phản hồi và tự kiểm duyệt vào một mô hình duy nhất dễ gặp xung đột chỉ thị hoặc gián đoạn "
            "khi quá hạn mức API, chatbot-service được viết thuần TypeScript theo đường ống đa tầng có cơ chế dự phòng (Multi-LLM Waterfall) [4]: "
            "mô hình chính Google Gemini (gemini-3.5-flash-lite) xử lý mặc định, tự động chuyển dự phòng trong giới hạn 4 giây sang Groq LPU "
            "(openai/gpt-oss-120b cho nhánh công cụ và qwen/qwen3.8-27b cho nhánh tri thức SOP) khi gặp lỗi hoặc giới hạn tốc độ."
        )),
        ("N", (
            "Trước khi sinh phản hồi hoặc thực thi tác vụ nhạy cảm, hệ thống áp dụng chốt chặn an toàn đầu vào (OWASP LLM / bảo vệ PII) "
            "kết hợp tác tử thẩm định độc lập (Validation Agent sử dụng nvidia/nemotron-3.5-lightning:free trên OpenRouter) và nguyên tắc "
            "Human-in-the-Loop (HITL): AI chỉ hướng dẫn, thu thập chứng cứ và mở hồ sơ, không tự quyết định chi trả bồi thường mà bàn giao "
            "cho bộ phận QA & Ops Web. Nội dung phản hồi được truyền một chiều từ máy chủ về giao diện qua chuẩn Server-Sent Events (SSE) "
            "trên kết nối HTTP thông thường, giúp hiển thị từng đoạn văn bản sớm hơn và gọn nhẹ hơn so với mở thêm kênh WebSocket riêng [17]."
        )),
        ("H3", "2.6.3. Đóng gói hạ tầng bằng Docker Compose và quản lý tiến trình PM2"),
        ("N", (
            "Docker sử dụng công nghệ cô lập tiến trình ở mức nhân hệ điều hành (Containerization) giúp đóng gói phần mềm cùng các thư viện "
            "phụ thuộc thành môi trường chạy đồng nhất; Docker Compose mở rộng khả năng đó để khai báo và khởi chạy nhiều container cùng mạng "
            "ảo nội bộ và vùng lưu trữ bền bỉ (Volumes) chỉ qua một tệp cấu hình YAML [23]."
        )),
        ("N", (
            "Trong bài toán triển khai thực tế của Nexus Express trên máy chủ Apple Silicon (16 GB RAM), nếu đóng gói toàn bộ 14 microservices "
            "và các cổng web thành hơn 20 container riêng lẻ sẽ gây dư thừa bộ nhớ đáng kể. Do đó, nhóm chọn mô hình lai thực dụng: dùng Docker "
            "Compose vận hành đúng 4 thành phần hạ tầng có trạng thái cần môi trường chuẩn hóa cao (PostgreSQL 16, RabbitMQ 3.13, Redis 7, MinIO S3), "
            "còn 15 tiến trình Node.js ứng dụng chạy trực tiếp qua PM2 kết hợp Cloudflare Zero Trust Tunnel để công khai HTTPS an toàn."
        )),
    ]

    tpl_map = {"H2": tpl_h2, "H3": tpl_h3, "N": tpl_norm, "L": tpl_list, "H6": tpl_h6}

    # Insert new Chapter 2 before and after Table 2.1
    for kind, txt in ch2_before_table:
        make_styled_para_before(tbl_2_1_elem, txt, tpl_map[kind])

    # Anchor for after Table 2.1 is the element right after Table 2.1 (which is P[498])
    after_tbl_anchor = tbl_2_1_elem.getnext()
    for kind, txt in ch2_after_table:
        make_styled_para_before(after_tbl_anchor, txt, tpl_map[kind])

    # Mark ALL old Chapter 2 paragraphs (P[481]..P[721]) for removal (keeping P[480] Heading 1 & Table 2.1!)
    for idx in range(481, 722):
        elems_to_remove.append(paras[idx]._element)

    # =========================================================================
    # PHASE 2B: CHƯƠNG 3 — Xóa mở bài AI/lặp, cắt lặp 3.3.2, sửa 66->69 & 12 DB
    # =========================================================================
    ch3_updates = {
        724: (
            "Chương này phân tích hiện trạng và đặc tả các yêu cầu nghiệp vụ cốt lõi cho nền tảng quản lý và trung chuyển "
            "bưu kiện Nexus Express, vận hành theo mô hình mạng lưới trung chuyển tập trung (Hub-and-Spoke) 4 cấp kết hợp "
            "giao nhận chặng cuối (Last-mile Delivery). Trong đó, nhân viên vận hành bưu cục (Ops Staff) và bưu tá (Courier) "
            "được phân công gắn chặt với từng điểm trung chuyển (Hub) và phân vùng địa lý (Zone)."
        ),
        725: (
            "Hệ thống phục vụ 6 nhóm tác nhân trên 4 ứng dụng Web và 2 ứng dụng di động chuyên biệt. Kiến trúc kỹ thuật của "
            "cổng giao tiếp, cơ chế xác thực phân quyền và phân hệ trợ lý AI được thiết kế chi tiết tại Chương 4; phần dưới đây "
            "tập trung làm rõ vai trò nghiệp vụ, quy trình vận hành chuẩn (BPMN) và các ràng buộc dữ liệu bất biến của bài toán."
        ),
        # Remove P[726] (repeated AI/RAG marketing pitch "Một điểm đột phá..." belonging to Ch.4)
        729: (
            "Đối tác gửi hàng (Merchant): Là các cửa hàng kinh doanh trực tuyến và doanh nghiệp B2B sử dụng cổng merchant-web "
            "để quản lý hoạt động gửi hàng. Mỗi tài khoản cửa hàng gắn cố định địa chỉ kho vật lý theo phân vùng đa giác "
            "(Spatial Polygon) nhằm hạn chế sai lệch tọa độ khi hệ thống tự động phân tuyến lấy hàng. Đối tác có thể tạo đơn "
            "kèm cước tạm tính, in nhãn mã vạch dán kiện, tra cứu hành trình, hủy đơn khi chưa lấy, gửi yêu cầu hoàn hàng đối "
            "với đơn đã lấy nhưng chưa phát và theo dõi bảng kê đối soát COD, cước vận chuyển và số tiền thực nhận."
        ),
        732: (
            "Khách hàng cá nhân (Customer C-End): Là người dùng cá nhân gửi bưu phẩm nhỏ lẻ hoặc theo dõi các đơn hàng mua sắm "
            "trực tuyến trên ứng dụng di động và cổng web đồng bộ. Người dùng có thể đăng ký tài khoản, quản lý hồ sơ, lưu địa chỉ "
            "mặc định và tài khoản ngân hàng nhận tiền COD/hoàn tiền, ước tính cước và thời gian giao, tạo đơn gửi cá nhân, "
            "theo dõi cả đơn gửi đi lẫn đơn nhận về theo số điện thoại, đồng thời trao đổi với trợ lý AI để tra cứu hoặc gửi phản ánh."
        ),
        # Fix typo in P[782] ("trung trung ngược" -> "trung chuyển ngược")
        782: paras[782].text.replace("chu trình trung trung ngược", "chu trình trung chuyển ngược"),
        # 3.3.1 Yêu cầu kinh doanh
        817: (
            "Từ khảo sát quy trình thực tế ở Mục 3.2, hệ thống Nexus Express cần đáp ứng 4 nhóm yêu cầu kinh doanh trọng tâm sau:"
        ),
        818: (
            "Chuẩn hóa chuỗi vận hành bưu chính: Số hóa liên thông vòng đời vận đơn từ tạo đơn, điều phối lấy hàng theo phân vùng "
            "địa lý (Spatial Polygon), đóng bao trung chuyển kèm chì seal (Manifest) đến giao chặng cuối có ảnh POD và chuyển hoàn."
        ),
        819: (
            "Tách tải tại các điểm nghẽn giao dịch: Cô lập các nhóm thao tác có tần suất cao như quét mã kho, tính cước và tra cứu "
            "hành trình để hạn chế ảnh hưởng chéo trong các khung giờ cao điểm."
        ),
        820: (
            "Minh bạch cước phí và dòng tiền COD: Thống nhất một quy tắc tính cước IATA (V/6000) trên tất cả các kênh, kiểm soát "
            "hạn mức tiền mặt bưu tá (15.000.000 VNĐ/ca) và tự động hóa đối soát COD qua VietQR nhằm hạn chế thất thoát."
        ),
        821: (
            "Giảm tải chăm sóc khách hàng bằng trợ lý AI: Cung cấp kênh tra cứu vận đơn, dự toán cước và giải đáp quy định bồi thường "
            "tự động 24/7, đồng thời chuyển các hồ sơ tranh chấp phức tạp về nhân sự QA xử lý."
        ),
        # 3.3.2 Yêu cầu người dùng — Rút gọn 38 dòng liệt kê lặp thành 6 đoạn mục tiêu gọn gàng theo từng nhóm tác nhân
        823: (
            "Dựa trên vai trò đã phân tích tại Mục 3.1, kỳ vọng sử dụng chính của 6 nhóm người dùng đối với hệ thống được tổng hợp như sau "
            "(danh mục chức năng chi tiết được phân rã tại Mục 3.3.3.1):"
        ),
        824: (
            "Đối tác gửi hàng (Merchant): Cần thao tác tạo đơn nhanh (đơn lẻ hoặc theo lô), in nhãn đúng khổ giấy (A5, K80, 100x150mm), "
            "theo dõi trạng thái đơn theo thời gian thực, chủ động hủy đơn chưa lấy hoặc yêu cầu hoàn hàng và đối chiếu minh bạch số tiền COD thực nhận."
        ),
        825: (
            "Nhân viên giao hàng (Courier): Cần danh sách nhiệm vụ lấy/giao gọn rõ trên di động, quét mã và chụp ảnh POD nhanh tại điểm giao, "
            "gọi người nhận trực tiếp, báo cáo sự cố NDR có ảnh hiện trường, theo dõi hạn mức công nợ tiền mặt và nộp COD nhanh qua VietQR."
        ),
        826: (
            "Nhân viên vận hành (Ops Staff): Cần bảng điều khiển giám sát sản lượng Hub, công cụ tạo đơn tại quầy, điều phối ngoại lệ cho bưu tá, "
            "thao tác trọn chuỗi đóng bao/gỡ bao/quét xe đi-đến kèm chì seal, xử lý đơn NDR sang chuyển hoàn và đối soát công nợ COD theo từng bưu tá."
        ),
        827: (
            "Khách hàng cá nhân (Customer C-End): Cần quản lý địa chỉ mặc định và tài khoản ngân hàng thuận tiện, ước tính cước trước khi tạo đơn, "
            "xem chính xác lịch sử các đơn gửi lẫn đơn sắp nhận và hỏi đáp nhanh qua trợ lý AI."
        ),
        828: (
            "Khách vãng lai (Guest): Cần tra cứu trạng thái vận đơn, ước tính cước IATA, tìm bưu cục gần nhất và hỏi quy định hàng cấm/bồi thường "
            "ngay trên cổng công khai mà không bắt buộc đăng nhập, đồng thời có thể đăng ký nâng cấp thành tài khoản Customer khi cần."
        ),
        829: (
            "Quản trị viên (Admin): Cần màn hình quản trị tập trung cho mạng lưới Hub 4 cấp, phân vùng Zone, danh mục lý do NDR, chính sách vận hành, "
            "vòng đời tài khoản của 4 nhóm người dùng và ma trận phân quyền thao tác trên ứng dụng di động."
        ),
        # 3.3.3.1 Fix 66 -> 69 Use Case
        864: (
            "Dựa trên ma trận nghiệp vụ thống nhất của hệ thống, các yêu cầu chức năng được phân nhóm theo 6 tác nhân "
            "(tương ứng 69 ca sử dụng – Use Cases đặc tả chi tiết tại Chương 5) như sau:"
        ),
        # 3.3.3.2 Fix 11 DB -> 12 DB + stateless + vector store
        939: (
            "Database-per-Service: Hệ thống cô lập 12 cơ sở dữ liệu PostgreSQL độc lập (11 cơ sở dữ liệu quản lý qua Prisma ORM gồm "
            "auth_db, masterdata_db, shipment_db, pickup_db, dispatch_db, manifest_db, scan_db, delivery_db, payment_db, tracking_db, "
            "reporting_db và chat_db do gateway-bff quản lý qua pg.Pool), kết hợp pricing-service phi trạng thái và chỉ mục vector RAM "
            "của chatbot-service. Không thực hiện SQL JOIN chéo cơ sở dữ liệu."
        ),
        # 3.3.3.3 Clean hype words ("tuyệt đối", "100%")
        957: (
            "Quyền hạn của Read Model: tracking-service và reporting-service chỉ tiêu thụ sự kiện để dựng khung nhìn tra cứu "
            "và báo cáo, không tự sinh hoặc sửa đổi trạng thái nghiệp vụ gốc."
        ),
        959: (
            "Công thức tính cước vận chuyển phải đồng nhất giữa tất cả các kênh (Merchant tạo đơn, Ops tạo đơn tại quầy, Guest/Customer "
            "ước tính cước và trợ lý AI), sử dụng trọng lượng tính cước W = max(Khối lượng thực tế, (Dài × Rộng × Cao) / 6000)."
        ),
        960: (
            "Phí vận chuyển được chốt và lưu bản chụp (snapshot) tại thời điểm tạo đơn; số liệu cước hiển thị trên bảng kê Đối soát & "
            "Tài chính của Merchant phải khớp với mức phí đã chốt lúc khởi tạo."
        ),
        962: (
            "Địa chỉ kho lấy hàng của mỗi tài khoản Merchant được gắn cố định theo phân vùng địa lý (Spatial Polygon) và Hub mặc định "
            "nhằm đảm bảo thuật toán điều phối tự động phân tuyến chính xác."
        ),
    }

    for idx, txt in ch3_updates.items():
        set_para_text(paras[idx], txt)

    # Remove redundant paragraphs in Ch.3: P[726] (AI pitch duplicate) and P[830]..P[861] (32 redundant bullets in 3.3.2)
    elems_to_remove.append(paras[726]._element)
    for idx in range(830, 862):
        elems_to_remove.append(paras[idx]._element)

    # =========================================================================
    # PHASE 2C: CHƯƠNG 4 — Single-Home gọn lại phần lặp Ch.3, sửa 4 cổng port 4.5, đồng bộ Opaque Token
    # =========================================================================
    ch4_updates = {
        972: (
            "Tầng Cổng giao tiếp trung tâm (API Gateway BFF – cổng 3000): Là điểm tiếp nhận duy nhất (Single Entrypoint) "
            "cho toàn bộ lưu lượng HTTPS/WSS từ 6 ứng dụng client và các yêu cầu tích hợp đối tác HMAC từ DT_COMMERCE (api.truongam.tech). "
            "Gateway đảm nhiệm xác thực Opaque Bearer Token, phân quyền RBAC, giới hạn tần suất truy cập (2.400 req/phút), điều phối "
            "WebSocket (/ws/chat, /ws/tasks, /ws/locations), cấp URL ký sẵn (S3 Presign) tải ảnh lên MinIO, lưu lịch sử chat vào "
            "chat_db (pg.Pool) và chuyển tiếp luồng HTTP/SSE tới chatbot-service."
        ),
        # Condense Hub 4-tier in 4.1.3 (Single Home is Ch.3; Ch.4 maps it to masterdata & manifest)
        989: (
            "Ánh xạ mạng lưới Hub 4 cấp và trung chuyển liên bưu cục: Cấu trúc mạng lưới Hub-and-Spoke 4 cấp đã phân tích ở Chương 3 "
            "(Cấp 1 – Mega Hub tại Hà Nội/Đà Nẵng/TP.HCM; Cấp 2 – Regional Hub; Cấp 3 – Provincial Hub; Cấp 4 – Local Post Office/Station) "
            "được chuẩn hóa thành cây danh mục trong masterdata-service (:3001). Nghiệp vụ gom bao và bàn giao các chuyến xe trung chuyển "
            "giữa các Hub được tích hợp trực tiếp trong manifest-service (:3005) cùng chu trình kẹp chì niêm phong (SealRecord) và nghiệm thu "
            "hàng đến (ReceiveRecord), giúp tránh phân mảnh giao dịch giữa khâu đóng bao và xuất chuyến."
        ),
        1001: (
            "Dịch vụ Cổng giao tiếp trung tâm (gateway-bff – Port 3000): Là điểm tiếp nhận duy nhất cho 6 ứng dụng Client và đối tác "
            "DT_COMMERCE (HMAC). Gateway xác thực Opaque Bearer Token kết hợp RBAC, giới hạn tần suất 2.400 req/phút, định tuyến "
            "REST/WebSocket tới 13 dịch vụ nội bộ theo tiền tố URL (/merchant/*, /ops/*, /admin/*, /courier/*, /customer/*, /public/*, "
            "/api/*, /chat/*), cấp URL ký sẵn tải ảnh lên MinIO, lưu hội thoại vào chat_db (pg.Pool) và chuyển tiếp luồng SSE từ chatbot-service."
        ),
        # 4.2.2 Pricing: technical implementation without re-explaining IATA from scratch
        1005: (
            "Động cơ Định giá dùng chung (pricing-service – Port 3012): Hoạt động phi trạng thái (stateless, phiên bản biểu phí "
            "NEXUS_RATES_2026_05 nạp sẵn trong bộ nhớ) nhằm áp dụng nhất quán quy tắc trọng lượng quy đổi IATA V/6000 (Mục 3.2.1 & 3.3.3.3) "
            "cho mọi ứng dụng Client và trợ lý AI. Dịch vụ hiện thực hóa ma trận 3 vùng cước (Nội tỉnh: +0đ; Trục chính Hà Nội – TP.HCM: "
            "+7.000đ; Liên tỉnh: +12.000đ) trên 3 gói dịch vụ (Tiết kiệm 18.000đ/2kg đầu, Tiêu chuẩn 28.000đ/2kg đầu, Hỏa tốc 42.000đ/1kg đầu), "
            "kèm bộ chuẩn hóa tiền tố địa danh (\"Tỉnh\", \"TP.\", bí danh \"Sài Gòn\" → \"TP. Hồ Chí Minh\") để tránh sai lệch vùng khi nhập địa chỉ tự do."
        ),
        # 4.2.3 scan-service: remove "100% rủi ro"
        1014: (
            "Dịch vụ Quét mã vạch và Định vị vật lý (scan-service – Port 3006): Là nguồn dữ liệu chuẩn cho lịch sử quét mã vạch và vị trí "
            "vật lý hiện tại của bưu phẩm (CurrentLocation), ghi nhận các mốc lấy hàng (Pickup Scan), nhập kho (Inbound Scan) và xuất kho "
            "(Outbound Scan). Toàn bộ API quét mã đều kiểm tra khóa Idempotency Key để ngăn ghi trùng khi kết nối mạng chập chờn."
        ),
        # 4.2.4 delivery-service: condense fragile/insurance policy mapping (Single Home in Ch.3.2.6)
        1017: (
            "Thực thi chính sách hàng dễ vỡ và bảo hiểm khai giá: Dựa trên khung pháp lý tại Mục 3.2.6 (Điều 40 Luật Bưu chính 2010 và "
            "Điều 25 Nghị định 47/2011/NĐ-CP), khi kiện hàng đánh dấu dễ vỡ, hệ thống tự động in nhãn cảnh báo [FRAGILE - HÀNG DỄ VỠ] và "
            "ràng buộc kiểm tra quy cách đóng gói trước khi nhận. Ở phân hệ bảo hiểm, đơn không khai giá áp dụng mức đền tối thiểu 4 lần "
            "cước (trần 1.000.000 VNĐ); gói khai giá toàn diện thu phí 0,5% cho giá trị 1–10 triệu đồng (tối thiểu 5.000đ) và 1,0% cho "
            "giá trị 10–30 triệu đồng (kèm hóa đơn VAT), bồi hoàn 100% thiệt hại thực tế tối đa 30.000.000 VNĐ/đơn."
        ),
        # 4.2.5 payment-service: condense 3-tier return fee mapping
        1022: (
            "Thực thi chính sách phân tầng khách hàng và cước hoàn: Dịch vụ áp dụng 3 mức cấu hình theo hạng tài khoản đã nêu ở Chương 3: "
            "Khách vãng lai (Guest) chịu phí hoàn 50% cước chiều đi và thanh toán tiền mặt/VietQR khi nhận lại hàng; Đối tác tiêu chuẩn "
            "(Standard SME) chịu 50% cước chiều đi và tự động cấn trừ vào phiên đối soát COD gần nhất; Doanh nghiệp VIP (VIP Enterprise) "
            "được miễn phí hoàn (0đ) và đối soát công nợ theo hợp đồng định kỳ."
        ),
        # 4.2.6 chatbot-service: fix NX-xxxxxx -> SHP-* and remove minor fluff
        1031: (
            "Thay vì phụ thuộc vào một mô hình ngôn ngữ duy nhất dễ bị gián đoạn hoặc tự suy diễn mức bồi thường sai quy định, "
            "dịch vụ được tổ chức theo đường ống thành phần kết hợp đa nhà cung cấp (Hình 4.5): tách biệt chốt chặn an toàn đầu vào "
            "(Security Gatekeeper), bộ định tuyến ý định (Intent Router), nhánh truy xuất tri thức lai (Hybrid RAG Retrieval), "
            "nhánh công cụ dữ liệu thời gian thực (Logistics Tools), tác tử kiểm duyệt rủi ro (Validation Agent qua OpenRouter) và "
            "chuỗi dự phòng đa LLM (Google Gemini → Groq LPU). Hệ thống áp dụng nguyên tắc Human-in-the-Loop (HITL): trợ lý AI chỉ "
            "thu thập chứng cứ, giải thích căn cứ pháp lý và mở hồ sơ, không tự duyệt chuyển tiền bồi thường mà bàn giao sang bộ phận "
            "QA & Ops Web thẩm định CCTV và chi trả."
        ),
        1037: (
            "trackShipment(tracking_number): Nhận diện mã vận đơn (dạng SHP-*) và gọi API nội bộ sang tracking-service (:3008) để lấy "
            "trạng thái hiện tại, mốc hành trình chi tiết và thời gian giao dự kiến."
        ),
        1038: (
            "calculatePricing(origin, destination, weight, dimensions): Gọi trực tiếp pricing-service (:3012) để tính cước theo cùng "
            "biểu phí và quy tắc IATA V/6000 của hệ thống."
        ),
        1047: (
            "Tuân thủ căn cứ pháp chế: Các đoạn trích SOP gắn trực tiếp điều khoản bồi thường (Điều 40 Luật Bưu chính 2010 và Điều 25 "
            "Nghị định 47/2011/NĐ-CP) để phản hồi có nguồn đối chiếu rõ ràng."
        ),
        1063: (
            "Thẻ Vận đơn Trực quan (Shipment Cards): Khi người dùng tra cứu đơn hàng, giao diện hiển thị thẻ tóm tắt gồm mã vận đơn, "
            "thanh tiến trình trạng thái (Progress Stepper), thời gian dự kiến giao, thông tin bưu tá phụ trách và số tiền thu hộ COD."
        ),
        1064: (
            "Nút Bấm Tác vụ Nhanh (Action Chips): Tùy theo trạng thái hiện tại của đơn hàng, giao diện gợi ý các nút thao tác một chạm "
            "ngay dưới tin nhắn (như [Hẹn lại lịch giao], [Đổi địa chỉ nhận hàng], [Hủy đơn hàng], [Xem chính sách đền bù]), giúp người "
            "dùng thao tác nhanh trên màn hình nhỏ mà không cần gõ lại câu lệnh dài."
        ),
        1066: (
            "Hệ thống áp dụng nguyên tắc Database-per-Service kết hợp lưu trữ đa mô hình (Polyglot Persistence) như trình bày ở Hình 4.7. "
            "Toàn bộ 12 cơ sở dữ liệu quan hệ trên PostgreSQL 16 (khởi tạo qua infra/dev/postgres/init-multiple-dbs.sql) được cấp chuỗi "
            "kết nối DATABASE_URL riêng cho từng dịch vụ: 9 cơ sở dữ liệu ghi nghiệp vụ (Prisma + OutboxEvent), 2 cơ sở dữ liệu đọc CQRS "
            "thuần đọc (tracking_db, reporting_db, không có Outbox) và chat_db do gateway-bff quản lý trực tiếp qua pg.Pool. Hai dịch vụ "
            "còn lại không dùng RDBMS là pricing-service (stateless in-memory rules) và chatbot-service (Local Vector Store vector-index.json "
            "nạp RAM). Các dịch vụ không thực hiện SQL JOIN hoặc đặt khóa ngoại vật lý liên cơ sở dữ liệu, mà liên kết qua khóa logic có đánh "
            "chỉ mục (shipmentCode, hubCode, courierId)."
        ),
        # 4.5 FIX SCRAMBLED WEB PORTS to match 4.1.1 & scripts/serve-static-apps.mjs 100%!
        1079: (
            "Giao diện hệ thống được phân tách thành 6 ứng dụng đầu cuối phù hợp với môi trường thao tác của từng nhóm tác nhân:"
        ),
        1080: "4.5.1. Cổng thông tin Đối tác gửi hàng (merchant-web - Port 5174)",
        1098: "4.5.2. Cổng thông tin Vận hành trung tâm khai thác (ops-web - Port 5173)",
        1126: "4.5.4. Cổng thông tin Quản trị viên hệ thống (admin-web - Port 5175)",
        1144: "4.5.6. Cổng thông tin Tra cứu công khai và Trợ lý ảo (guest-web - Port 5177)",
        1149: (
            "Khung trò chuyện trực tuyến với Trợ lý AI Logistics RAG, nhận phản hồi tuần tự qua giao thức Server-Sent Events (SSE)."
        ),
        # 4.6 Clean hype words ("phòng thủ chuyên sâu", "tuyệt đối")
        1151: (
            "Để bảo vệ dữ liệu nghiệp vụ và duy trì độ ổn định khi vận hành liên tục, hệ thống triển khai các lớp kiểm soát sau:"
        ),
        1152: (
            "Xác thực và Phân quyền đa tầng: Hệ thống sử dụng Opaque Bearer Token có thời hạn kết hợp quản trị phiên tập trung tại "
            "auth-service. Mọi truy vấn từ Web và Mobile đi qua GatewayAuthGuard ở lớp biên, kết hợp phân quyền RBAC và "
            "MobilePermissionOverride nhằm kiểm soát chặt các thao tác nghiệp vụ nhạy cảm."
        ),
        1155: (
            "Chiến lược Sao lưu và Phục hồi: Các cơ sở dữ liệu PostgreSQL được thiết kế tách biệt để ưu tiên sao lưu độc lập các kho "
            "giao dịch trọng yếu (shipment_db, payment_db, delivery_db); ảnh minh chứng POD và chứng cứ trên MinIO/S3 hỗ trợ cấu hình "
            "nhân bản vùng chứa (Bucket Replication) phục vụ khôi phục dữ liệu khi gặp sự cố phần cứng."
        ),
    }

    for idx, txt in ch4_updates.items():
        set_para_text(paras[idx], txt)

    # Remove condensed/redundant paragraphs in Ch.4:
    # - P[990]..P[994] (merged into P[989])
    # - P[1006]..P[1008] (merged into P[1005])
    # - P[1018]..P[1019] (merged into P[1017])
    # - P[1023]..P[1025] (merged into P[1022])
    for idx in (
        list(range(990, 995))
        + list(range(1006, 1009))
        + [1018, 1019]
        + list(range(1023, 1026))
    ):
        elems_to_remove.append(paras[idx]._element)

    # =========================================================================
    # PHASE 3: CHƯƠNG 5, 6, 7, 8 & TOC
    # =========================================================================
    ch5_to_8_updates = {
        # Chương 5: Rút gọn lặp 6 actor ở 5.1.1 & sửa 66 -> 69 Use Cases!
        1173: (
            "Các biểu đồ Use Case dưới đây tương ứng với 6 nhóm tác nhân đã mô tả chi tiết tại Mục 3.1, ánh xạ trực tiếp "
            "tới 6 ứng dụng đầu cuối:"
        ),
        1174: "1. Khách vãng lai (Guest — guest-web): Truy cập các ca sử dụng tra cứu vận đơn, dự toán cước, tìm bưu cục và hỏi đáp AI công khai.",
        1175: "2. Đối tác gửi hàng (Merchant — merchant-web): Thực hiện nhóm ca sử dụng tạo đơn, in nhãn, hủy/hoàn đơn và đối soát COD.",
        1176: "3. Nhân viên giao hàng (Courier — courier-mobile): Thực hiện nhóm ca sử dụng lấy hàng, phát hàng kèm ảnh POD, báo cáo NDR và nộp COD.",
        1177: "4. Nhân viên vận hành (Ops Staff — ops-web): Thực hiện nhóm ca sử dụng điều phối, đóng/gỡ bao trung chuyển, xử lý NDR/hoàn hàng và đối soát bưu cục.",
        1178: "5. Khách hàng cá nhân (Customer C-End — customer-mobile): Thực hiện nhóm ca sử dụng quản lý hồ sơ/địa chỉ, gửi hàng cá nhân và tra cứu đơn.",
        1179: "6. Quản trị viên (Admin — admin-web): Thực hiện nhóm ca sử dụng quản trị Hub/Zone, tài khoản, danh mục lỗi NDR và ma trận phân quyền di động.",
        1181: "Hệ thống bao gồm 69 ca sử dụng (Use Case) nghiệp vụ được phân nhóm theo 6 nhóm tác nhân chính:",
        1189: (
            "Phần này trình bày chi tiết đặc tả luồng sự kiện của 69 ca sử dụng trong hệ thống Nexus Express, "
            "được phân loại theo 6 nhóm tác nhân tương ứng với các bảng tổng hợp ở Mục 5.1.2."
        ),

        # Chương 6: Fix Nexus Logistic, 3x "triệt để", VPS Docker Compose, Linehaul, token naming
        1874: (
            "Bảng 6.2 tổng hợp các công nghệ, thư viện và phiên bản thực tế được sử dụng xuyên suốt các phân tầng của hệ thống:"
        ),
        1877: (
            "Nội dung mục này liệt kê các nhóm API thực tế đã xây dựng theo từng microservice trong hệ thống Nexus Express, "
            "thể hiện rõ phạm vi trách nhiệm của mỗi dịch vụ."
        ),
        1981: "6.3.4. Cơ chế bảo mật SSL/TLS và xử lý lỗi Mixed Content",
        1983: "Bên cạnh mã hóa đường truyền, cấu hình định tuyến còn xử lý dứt điểm lỗi Mixed Content thường gặp trên các ứng dụng SPA:",
        1985: (
            "• Để tránh lỗi Mixed Content trên trình duyệt, mỗi ứng dụng Web gọi API theo cùng gốc tên miền HTTPS (same-origin) "
            "hoặc qua địa chỉ HTTPS chính thức, sau đó nexus-static-web chuyển tiếp nội bộ về gateway-bff (http://127.0.0.1:3000) "
            "và nâng cấp kết nối WebSocket (HTTP 101 Switching Protocols) an toàn."
        ),
        1991: (
            "• Quản lý phiên và phân quyền: Phiên đăng nhập sử dụng cặp Opaque Bearer Token với Access Token thời hạn ngắn "
            "(ACCESS_TOKEN_TTL_SECONDS=900 — 15 phút) nhằm giới hạn rủi ro lộ phiên, kết hợp Refresh Token (30 ngày) lưu kiểm soát tại auth_db."
        ),
        2005: (
            "Giai đoạn kiểm thử chức năng xác minh mức độ đáp ứng của toàn bộ 69 Use Case đã đặc tả tại Chương 5 trên cả 6 nhóm tác nhân "
            "(Guest, Customer, Merchant, Courier, Ops Staff và Admin). Mỗi Use Case được xây dựng các kịch bản dữ liệu hợp lệ và ngoại lệ "
            "(tổng cộng 153 kịch bản) để kiểm chứng hành vi hệ thống trên môi trường chạy thực tế."
        ),
        2015: (
            "Kiểm thử các chức năng khai thác tại Hub và bưu cục trên cổng ops-web gồm: đăng nhập, giám sát Dashboard sản lượng, "
            "tạo đơn tại quầy, điều phối bưu tá lấy/phát hàng, đóng bao kẹp chì seal, gỡ bao kiểm đếm kiện con, quản lý chuyến xe "
            "trung chuyển liên bưu cục (quét xe đi/xe đến), xử lý ca NDR, quản lý chuyển hoàn và đối soát COD:"
        ),
        2019: (
            "Phạm vi đánh giá. Bộ test case này được xây dựng theo đúng phạm vi thực tế của Nexus Express: 14 microservices, "
            "gateway-bff, truyền thông hướng sự kiện RabbitMQ, Database-per-Service, COD, tracking/reporting, ứng dụng di động "
            "và môi trường triển khai Apple Silicon (PM2 + Docker Desktop + Cloudflare Tunnel)."
        ),
        2051: (
            "Về kiểm thử kỹ thuật và mức độ sẵn sàng vận hành (Mục 6.4.2), hệ thống đạt 83/100 tiêu chí (83,0%). Các hạng mục nền tảng "
            "như xác thực Opaque Bearer Token, kiểm soát tải tại gateway-bff (Rate Limit 2.400 req/phút, Body Limit 1 MB), HTTPS qua "
            "Cloudflare Tunnel, truyền thông bất đồng bộ RabbitMQ (Outbox + DLX/TTL Retry) và cô lập 12 cơ sở dữ liệu PostgreSQL đều "
            "đạt yêu cầu. 17 tiêu chí chưa đạt chủ yếu thuộc nhóm hạ tầng doanh nghiệp quy mô lớn (như tách riêng dịch vụ quản lý đội xe "
            "đường trục, Saga compensation đầy đủ, mTLS nội bộ, sao lưu tự động lên đám mây và Distributed Tracing), được ghi nhận làm hướng phát triển."
        ),

        # Chương 7: Cắt lặp 6 đoạn dài ở 7.2.1, sửa lỗi Redis/PWA/IndexedDB, xóa từ sáo AI
        2059: (
            "Bộ kịch bản đánh giá chức năng bao phủ toàn bộ 69 Use Case đã đặc tả tại Chương 5 và kiểm thử chi tiết tại Mục 6.4.1, "
            "gồm tổng cộng 153 kịch bản phân bổ theo 6 nhóm tác nhân: Khách vãng lai (15 kịch bản trên guest-web), Khách hàng cá nhân "
            "(21 kịch bản trên customer-mobile), Đối tác gửi hàng (28 kịch bản trên merchant-web), Bưu tá (26 kịch bản trên courier-mobile, "
            "bao gồm chụp POD và đồng bộ hàng đợi ngoại tuyến), Nhân viên vận hành (38 kịch bản trên ops-web, bao gồm đóng/gỡ bao, "
            "chuyến xe liên Hub, NDR và đối soát COD) và Quản trị viên (25 kịch bản trên admin-web). Kết quả chi tiết được tổng hợp tại Bảng 7.1."
        ),
        2067: (
            "Đánh giá hiệu năng được thực hiện trên môi trường triển khai thực tế (Apple Silicon M4, 16 GB RAM, PM2 + 4 Docker containers "
            "qua Cloudflare Tunnel), tập trung vào các API có tần suất gọi cao: xác thực phiên, tạo đơn kèm tính cước IATA, tra cứu Read Model "
            "hành trình, quét mã kho, tải ảnh POD lên MinIO và truyền luồng SSE từ chatbot-service."
        ),
        2068: (
            "Các chỉ tiêu đo lường gồm thời gian phản hồi trung bình (Mean Latency), phân vị độ trễ p90/p95/p99 (Tail Latency), "
            "thông lượng xử lý (req/s) và tỷ lệ lỗi (Error Rate). Phép đo nhằm kiểm chứng hiệu quả tách tải giữa luồng ghi giao dịch, "
            "Read Model CQRS trên PostgreSQL và cơ chế truyền sự kiện bất đồng bộ qua RabbitMQ."
        ),
        2070: (
            "Đánh giá khả dụng kiểm tra mức độ thuận tiện và độ ổn định thao tác trên các thiết bị thực tế, bao gồm 4 cổng Web "
            "(Admin, Ops Staff, Merchant, Guest) hỗ trợ bố cục thích ứng (Responsive Design) trên màn hình máy tính và 2 ứng dụng di động "
            "React Native/Expo (Customer Mobile và Courier Mobile APK) tối ưu cho thao tác nhanh ngoài hiện trường."
        ),
        2071: (
            "Các bài thử khả dụng trọng tâm gồm: tốc độ nhận diện mã vạch qua Expo Camera trên thiết bị Android; khả năng lưu tạm "
            "và tự động đồng bộ của hàng đợi ngoại tuyến (Offline Queue trên AsyncStorage) khi bưu tá thao tác ở khu vực mất sóng "
            "như tầng hầm, thang máy; và trải nghiệm mở khung trò chuyện nổi (Floating Chat Widget) tra cứu cùng trợ lý AI."
        ),
        2073: (
            "Đánh giá bảo mật kiểm tra các lớp kiểm soát truy cập gồm: phòng vệ lớp biên tại gateway-bff (lọc nguồn gốc CORS cho "
            "*.nexus-ex.site, giới hạn tần suất 2.400 req/phút, giới hạn tải trọng 1 MB), xác thực Opaque Bearer Token và phân quyền "
            "RBAC ngăn truy cập chéo dữ liệu giữa các tài khoản (BOLA/IDOR), xác thực Partner HMAC (DT_COMMERCE) và kiểm tra chữ ký Webhook SePay."
        ),
        2092: (
            "Kiểm định Dấu hạng Wilcoxon (Wilcoxon Signed-Rank Test) trên các cặp sai số giữa mô hình đề xuất và Baseline 2 ghi nhận "
            "W = 845,0, giá trị chuẩn hóa z = -4,838 và mức ý nghĩa thống kê p = 1,31 × 10^-6 < 0,001, đủ cơ sở bác bỏ giả thuyết vô hiệu. "
            "Kích thước hiệu ứng Cohen's d = 0,48 nằm ở mức trung bình, cho thấy mức cải thiện chất lượng phản hồi có ý nghĩa thực tế."
        ),
        2097: (
            "Kết quả kiểm thử bảo mật cho thấy các cơ chế kiểm soát truy cập hoạt động đúng thiết kế: Opaque Bearer Token không chứa "
            "dữ liệu nhạy cảm có thể giải mã phía máy khách và cho phép thu hồi phiên tức thì tại auth_db; phân quyền RBAC ngăn chặn "
            "truy cập chéo tài nguyên (BOLA/IDOR) giữa các Merchant, đồng thời giới hạn bưu tá chỉ cập nhật được các vận đơn thuộc nhiệm vụ được giao."
        ),
        2115: (
            "3. Nghiệp vụ vận tải đường trục (Linehaul) chưa tách dịch vụ độc lập và chưa có IoT: Hiện quy trình đóng bao và bàn giao "
            "chuyến xe được gộp chung trong manifest-service, chưa tách riêng phân hệ quản lý đội xe tải riêng biệt hoặc tích hợp thiết bị "
            "định vị GPS phần cứng và cân đo kích thước tự động DWS."
        ),

        # Chương 8: Đồng bộ Opaque Token & bỏ từ sáo AI ("kỷ nguyên số hóa", "4 trụ cột chiến lược", "triệt để", "tuyệt đối", "100%")
        2122: (
            "Về kiểm soát truy cập: Tập trung hóa lưu lượng tại gateway-bff với xác thực Opaque Bearer Token, phân quyền RBAC, "
            "ma trận quyền di động, lọc nguồn gốc CORS (*.nexus-ex.site), giới hạn tải trọng 1 MB, Rate Limiting 2.400 req/phút "
            "và xác thực đối tác HMAC (DT_COMMERCE)."
        ),
        2134: (
            "Những hạn chế trên phản ánh đúng khoảng cách giữa phạm vi một khóa luận tốt nghiệp với hệ thống bưu chính thương mại "
            "quy mô lớn, đồng thời là cơ sở xác định các hướng phát triển tiếp theo."
        ),
        2136: (
            "Để mở rộng hệ thống Nexus Express tiệm cận yêu cầu vận hành thương mại thực tế, các hướng nâng cấp tiếp theo tập trung vào 4 nhóm chính:"
        ),
        2143: (
            "1. Bổ sung xác thực đa yếu tố (MFA/TOTP): Áp dụng xác thực hai bước cho các tài khoản quản trị (Admin), điều hành bưu cục "
            "(Ops Staff) và đối soát COD nhằm giảm nguy cơ chiếm đoạt tài khoản."
        ),
        2151: (
            "4. Tự động hóa sao lưu và phục hồi dữ liệu (Disaster Recovery): Thiết lập lịch sao lưu nén hằng ngày cho 12 cơ sở dữ liệu "
            "PostgreSQL và thùng chứa MinIO lên lưu trữ đám mây (AWS S3 hoặc Cloudflare R2), kèm quy trình kiểm thử khôi phục định kỳ."
        ),
        2153: (
            "1. Triển khai mô hình AI tự lưu trữ (On-premise LLM): Thử nghiệm vận hành các mô hình mã nguồn mở (như Qwen hoặc Llama) "
            "trên máy chủ GPU nội bộ qua vLLM hoặc Ollama để giảm phụ thuộc hạn mức API đám mây và tăng quyền kiểm soát dữ liệu nội bộ."
        ),
        2154: (
            "2. Tinh chỉnh mô hình cho địa danh và nghiệp vụ Việt Nam (Domain Fine-Tuning): Huấn luyện bổ sung trên dữ liệu địa giới hành chính "
            "3 cấp và thuật ngữ bưu chính Việt Nam nhằm nâng cao độ chính xác khi chuẩn hóa địa chỉ giao hàng viết tắt hoặc thiếu dấu."
        ),
        2155: (
            "3. Hỗ trợ tương tác giọng nói (Voice Assistant) cho bưu tá: Tích hợp nhận diện và tổng hợp giọng nói tiếng Việt trên Courier Mobile "
            "để hỗ trợ bưu tá tra cứu địa chỉ hoặc cập nhật trạng thái thuận tiện và an toàn hơn khi di chuyển."
        ),
        2156: (
            "4. Tích hợp thiết bị IoT tại kho và xe trung chuyển: Kết nối định vị GPS, cảm biến đóng mở thùng xe liên tỉnh cùng cân điện tử "
            "và camera đo kích thước tự động (DWS) tại bàn khai thác Hub để giảm thao tác nhập liệu thủ công."
        ),

        # Update cached TOC entries for Chapter 2 (P[133]..P[138]) & Chapter 3 (P[151]..P[153])
        133: "2.1.\tĐặc thù nghiệp vụ chuyển phát nhanh và bài toán hệ thống phân tán\t4",
        134: "2.2.\tKiến trúc Microservices, API Gateway/BFF và giao tiếp hướng sự kiện\t4",
        135: "2.3.\tTổ chức dữ liệu phân tán: Database-per-Service, CQRS và lưu trữ đa mô hình\t7",
        136: "2.4.\tXác thực, phân quyền và nền tảng phát triển Backend\t9",
        137: "2.5.\tCông nghệ phát triển giao diện Web và Ứng dụng di động ngoại tuyến\t10",
        138: "2.6.\tTrợ lý AI ứng dụng Hybrid RAG, kiểm soát rủi ro và hạ tầng triển khai\t11",
        151: "3.1.\tKhảo sát hiện trạng - Mô tả hiện tại của doanh nghiệp về hệ thống\t14",
        152: "3.2.\tMô tả các quy trình hoạt động của hệ thống\t16",
        153: "3.3.\tXác định các mức yêu cầu của hệ thống\t22",
    }

    for idx, txt in ch5_to_8_updates.items():
        set_para_text(paras[idx], txt)

    # Remove redundant paragraphs in Ch.7 (P[2060]..P[2065] — 6 repeated actor paragraphs in 7.2.1)
    for idx in range(2060, 2066):
        elems_to_remove.append(paras[idx]._element)

    # Remove obsolete cached TOC lines for old Ch.2 (P[139]..P[149]) & old Ch.3 (P[154])
    for idx in list(range(139, 150)) + [154]:
        elems_to_remove.append(paras[idx]._element)

    # Clean stale VPS / hype wording inside 6 table cells in Ch.6-7
    table_cell_fixes = [
        (204, 9, 0, "LEVEL 9 - Triển khai, build và môi trường vận hành thực tế"),
        (204, 9, 4, "Kiểm tra khả năng chạy thực tế với PM2 (15 tiến trình) + 4 container Docker Desktop, env, healthcheck và Cloudflare Tunnel."),
        (205, 6, 0, "Triển khai thực tế"),
        (212, 7, 5, "createRateLimitMiddleware dùng GATEWAY_RATE_LIMIT_* trong môi trường triển khai thực tế."),
        (213, 10, 3, "Một event được xử lý đúng một lần (exactly-once) trên toàn hệ thống."),
        (221, 3, 5, "Chặn toàn bộ 28/28 kịch bản Prompt Injection, Jailbreak và yêu cầu rò rỉ dữ liệu cá nhân PII"),
    ]
    for ti, ri, ci, new_val in table_cell_fixes:
        cell = doc.tables[ti].rows[ri].cells[ci]
        if cell.paragraphs:
            set_para_text(cell.paragraphs[0], new_val)

    # Execute all element removals cleanly
    for el in elems_to_remove:
        remove_elem(el)

    # Ensure Word updates TOC and field numbers automatically on open
    enable_update_fields(doc)

    doc.save(OUTPUT_PATH)
    print(f"Saved {OUTPUT_PATH} successfully! Removed {len(elems_to_remove)} redundant elements.")


if __name__ == "__main__":
    main()
