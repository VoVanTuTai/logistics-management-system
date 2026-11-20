#!/usr/bin/env python3
"""
Update the graduation thesis title and align all 4 strategic narrative anchors
(Covers, EN/VN Abstracts, Chapter 1 Problem/Objectives/Scope, Chapter 8 Conclusion)
in docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx to the Paper 1 research title:

  VI: Nghiên cứu và Phát triển Kiến trúc Multi-Agent kết hợp RAG và API Tool Calling
      nhằm tự động hóa chăm sóc khách hàng trong hệ thống quản lý và trung chuyển
      bưu kiện cho doanh nghiệp chuyển phát nhanh
  EN: Research and Development of a Multi-Agent Architecture Integrating Hybrid-RAG
      and API Tool Calling for Automated Customer Support in Express Parcel
      Management and Transit Systems

Preserves exact run formatting on covers/headings and 100% metric consistency with
Bảng 7.3 (HMAS: Groundedness 94.8%, Tool Accuracy 100.0%, Mean 85.2 ± 19.8),
Section 6.4.1 (160/160), and Section 6.4.2 (89/100).
"""

import os
import docx

DOC_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx"

NEW_TITLE_VI_UPPER = (
    "NGHIÊN CỨU VÀ ỨNG DỤNG KIẾN TRÚC MULTI-AGENT KẾT HỢP RAG VÀ API TOOL CALLING "
    "NHẰM TỰ ĐỘNG HÓA CHĂM SÓC KHÁCH HÀNG TRONG HỆ THỐNG QUẢN LÝ VÀ TRUNG CHUYỂN "
    "BƯU KIỆN CHO DOANH NGHIỆP CHUYỂN PHÁT NHANH"
)

NEW_TITLE_VI_QUOTE = (
    "Nghiên cứu và Ứng dụng Kiến trúc Multi-Agent kết hợp RAG và API Tool Calling "
    "nhằm tự động hóa chăm sóc khách hàng trong hệ thống quản lý và trung chuyển "
    "bưu kiện cho doanh nghiệp chuyển phát nhanh"
)

NEW_TITLE_EN_UPPER = (
    "RESEARCH AND APPLICATION OF A MULTI-AGENT ARCHITECTURE INTEGRATING HYBRID-RAG "
    "AND API TOOL CALLING FOR AUTOMATED CUSTOMER SUPPORT IN EXPRESS PARCEL "
    "MANAGEMENT AND TRANSIT SYSTEMS"
)


def set_paragraph_text_preserve_style(p, new_text):
    """Replace full text of paragraph p while preserving its first run's exact rPr formatting."""
    if p.runs:
        p.runs[0].text = new_text
        for r in p.runs[1:]:
            r.text = ""
    else:
        p.text = new_text


def main():
    assert os.path.exists(DOC_PATH), f"Missing {DOC_PATH}"
    doc = docx.Document(DOC_PATH)

    # 1. Cover page (P[10]), Inner cover (P[35]), EN Abstract title (P[80]), VN Abstract title (P[87])
    for idx in (10, 35, 87):
        assert "QUẢN LÝ VÀ TRUNG CHUYỂN BƯU KIỆN" in doc.paragraphs[idx].text.upper(), (
            f"Unexpected text at P[{idx}]: {doc.paragraphs[idx].text[:80]}"
        )
        set_paragraph_text_preserve_style(doc.paragraphs[idx], NEW_TITLE_VI_UPPER)

    for idx in (59, 80):
        assert "PARCEL MANAGEMENT AND TRANSIT SYSTEM" in doc.paragraphs[idx].text.upper() or "MULTI-AGENT ARCHITECTURE" in doc.paragraphs[idx].text.upper(), (
            f"Unexpected EN title at P[{idx}]: {doc.paragraphs[idx].text[:80]}"
        )
        set_paragraph_text_preserve_style(doc.paragraphs[idx], NEW_TITLE_EN_UPPER)
    print("[OK] Updated Covers (P[10], P[35], P[59]) and Abstract Titles (P[80], P[87])")

    # 2. English Abstract (P[82..85])
    set_paragraph_text_preserve_style(
        doc.paragraphs[82],
        "The rapid growth of e-commerce has created massive customer support workloads in express parcel logistics, "
        "ranging from real-time shipment tracking and volumetric freight estimation to packaging compliance and damage "
        "compensation inquiries under Vietnam's Postal Law. Directly deploying standalone Large Language Models (LLMs) "
        "introduces severe operational risks, including policy hallucinations, personal data (PII) leakage, and "
        "unauthorized database mutations. To address these challenges, this thesis researches and develops a guardrailed "
        "Multi-Agent architecture (HMAS) integrating Hybrid Retrieval-Augmented Generation (Hybrid-RAG) and live API Tool "
        "Calling to automate customer support on top of a real-world express parcel management and transit platform (Nexus Express).",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[83],
        "Implemented natively in TypeScript/NestJS without heavy orchestration frameworks, the AI subsystem coordinates "
        "specialized stages: a deterministic Stage-0 Security Gatekeeper blocking prompt injections and PII leaks under "
        "Decree 13/2023/ND-CP, an Intent Router executing 9 live REST tools (tracking, IATA V/6000 tariff quoting, retail "
        "order creation, post-order updates, claim lookup, and human handoff), an in-memory Hybrid-RAG engine over 9 SOPs "
        "(59 chunks, 3,072-D embeddings with lexical synonym expansion and explicit Citations[]), a multi-provider LLM "
        "fallback chain (Google Gemini, Groq LPU, OpenRouter), and Human-in-the-Loop (HITL) escalation into OPS/QA claim "
        "workflows. To validate real-time tool actuation end to end, the underlying Nexus Express enterprise platform was "
        "built with 14 independent microservices, 12 isolated PostgreSQL databases, RabbitMQ Outbox/CQRS, Opaque Bearer "
        "Token authentication, 5 web portals, and 2 React Native (Expo) mobile applications.",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[84],
        "Empirical evaluation on a 100-case logistics benchmark demonstrates that the proposed Multi-Agent architecture "
        "achieves 94.8% Groundedness, 100.0% Tool Accuracy, and a mean quality score of 85.2 ± 19.8, significantly "
        "outperforming Traditional RAG (48.2 ± 22.9, Cohen's d = 1.73, p < 0.001) and Single-Agent ReAct (74.6 ± 24.1, "
        "d = 0.48, p < 0.001). On the live Apple Silicon deployment (PM2, Docker Desktop, Cloudflare Zero Trust Tunnel), "
        "the integrated system passed 160/160 functional test cases across 69 Use Cases (including HITL complaint handling) "
        "and 89/100 production-readiness technical criteria.",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[85],
        "Keywords: Multi-Agent architecture, Hybrid-RAG, API Tool Calling, Human-in-the-Loop (HITL), LLM guardrails, "
        "express parcel logistics, microservices architecture, automated customer support.",
    )
    print("[OK] Updated English Abstract (P[82..85])")

    # 3. Vietnamese Abstract (P[89..92])
    set_paragraph_text_preserve_style(
        doc.paragraphs[89],
        "Sự bùng nổ của thương mại điện tử khiến khối lượng yêu cầu hỗ trợ khách hàng trong các doanh nghiệp chuyển phát "
        "nhanh tăng đột biến, từ tra cứu hành trình, tính cước thể tích đến tư vấn đóng gói và giải quyết khiếu nại bồi "
        "thường theo Luật Bưu chính. Việc ứng dụng trực tiếp các mô hình ngôn ngữ lớn (LLM) đơn lẻ vào nghiệp vụ dễ dẫn "
        "tới ảo giác chính sách, rò rỉ dữ liệu cá nhân (PII) và thao tác ghi dữ liệu trái phép. Xuất phát từ thực tiễn đó, "
        "khóa luận tập trung nghiên cứu và phát triển kiến trúc Multi-Agent có rào chắn (HMAS) kết hợp Hybrid-RAG và gọi "
        "công cụ API thời gian thực (API Tool Calling) nhằm tự động hóa chăm sóc khách hàng trên nền tảng quản lý và trung "
        "chuyển bưu kiện thực tế Nexus Express.",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[90],
        "Phân hệ trợ lý AI (chatbot-service) được phát triển thuần TypeScript/NestJS với chuỗi phối hợp đa tác tử: "
        "chốt chặn bảo mật Stage-0 Security Gatekeeper ngăn tiêm lệnh và bảo vệ PII theo Nghị định 13/2023/NĐ-CP; "
        "bộ định tuyến gọi 9 công cụ API thực tế (tra cứu vận đơn, tính cước IATA V/6000, tạo đơn lẻ, hủy/đổi địa chỉ/hẹn "
        "giao lại, tra cứu bồi thường và chuyển tiếp CSKH); động cơ tìm kiếm lai Hybrid-RAG trên 59 chunks SOP (vector "
        "3.072 chiều kết hợp mở rộng từ đồng nghĩa kèm trích dẫn Citations[] theo Nghị định 47/2011/NĐ-CP); cơ chế dự phòng "
        "đa nhà cung cấp LLM (Google Gemini, Groq LPU, OpenRouter) và quy trình Human-in-the-Loop (HITL) chuyển phiếu "
        "khiếu nại về bộ phận CSKH/QA. Để chứng minh khả năng thực thi công cụ trực tiếp, nhóm đồng thời xây dựng hoàn "
        "chỉnh hệ thống lõi Nexus Express gồm 14 microservices, 12 cơ sở dữ liệu PostgreSQL cô lập, RabbitMQ Outbox/CQRS, "
        "xác thực Opaque Bearer Token, 5 cổng Web và 2 ứng dụng di động React Native/Expo.",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[91],
        "Kết quả thực nghiệm trên bộ dữ liệu 100 kịch bản bưu chính cho thấy kiến trúc Multi-Agent đề xuất đạt độ bám sát "
        "tri thức 94,8%, độ chính xác gọi công cụ 100,0% và điểm trung bình 85,2 ± 19,8, vượt trội có ý nghĩa thống kê so "
        "với Traditional RAG (48,2 ± 22,9; Cohen's d = 1,73; p < 0,001) và Single-Agent ReAct (74,6 ± 24,1; d = 0,48; "
        "p < 0,001). Hệ thống tích hợp triển khai vận hành thực tế trên Apple Silicon (PM2, Docker Desktop, Cloudflare "
        "Zero Trust Tunnel) đã vượt qua 160/160 kịch bản kiểm thử chức năng (bao phủ 69 Use Cases và luồng khiếu nại HITL) "
        "cùng 89/100 tiêu chí kỹ thuật sẵn sàng vận hành.",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[92],
        "Từ khóa: Kiến trúc Multi-Agent, Hybrid-RAG, API Tool Calling, Human-in-the-Loop (HITL), rào chắn an toàn LLM, "
        "chăm sóc khách hàng tự động, chuyển phát nhanh, kiến trúc microservices.",
    )
    print("[OK] Updated Vietnamese Abstract (P[89..92])")

    # 4. Chapter 1: Problem statement (P[334]), Purpose (P[337]), Objectives (P[343..346]), Scope (P[367])
    set_paragraph_text_preserve_style(
        doc.paragraphs[334],
        f"Xuất phát từ thực tế đó, nhóm thực hiện đề tài \"{NEW_TITLE_VI_QUOTE}\" nhằm nghiên cứu, xây dựng kiến trúc "
        "tác tử đa vai trò (Multi-Agent) có rào chắn an toàn kết hợp tìm kiếm lai Hybrid-RAG, gọi công cụ API thời gian "
        "thực và chuyển tiếp Human-in-the-Loop (HITL), đồng thời hiện thực hóa nền tảng quản lý và trung chuyển bưu kiện "
        "phân tán 14 microservices làm môi trường vận hành và kiểm chứng thực tế.",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[337],
        "Đề tài hướng tới giải quyết đồng thời bài toán tự động hóa chăm sóc khách hàng bằng Multi-Agent có kiểm soát "
        "pháp lý và bài toán chuẩn hóa nền tảng nghiệp vụ chuyển phát nhanh nội địa theo Luật Bưu chính Việt Nam:",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[344],
        "Về nghiên cứu và phát triển kiến trúc Multi-Agent AI: Xây dựng phân hệ chatbot-service thuần TypeScript/NestJS "
        "phối hợp chốt chặn bảo mật Stage-0 Gatekeeper, động cơ Hybrid-RAG (vector 3.072 chiều trên 59 chunks SOP kèm "
        "Citations[]), 9 công cụ API Tool Calling thời gian thực, chuỗi dự phòng đa mô hình LLM (Google Gemini, Groq LPU, "
        "OpenRouter), truyền luồng SSE và cơ chế kiểm soát rủi ro Human-in-the-Loop (HITL) tích hợp quy trình CSKH/Claims.",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[345],
        "Về nền tảng microservices thực thi nghiệp vụ: Xây dựng hoàn chỉnh hệ thống lõi Nexus Express gồm 14 microservices "
        "độc lập (NestJS, TypeScript, Prisma ORM), quản trị 12 cơ sở dữ liệu PostgreSQL tách biệt, đồng bộ sự kiện bất "
        "đồng bộ qua RabbitMQ theo mẫu Transactional Outbox và CQRS-Lite để phục vụ dữ liệu sống cho các API công cụ.",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[346],
        "Về ứng dụng đa nền tảng đầu cuối: Phát triển 5 cổng Web (React 18 / Vite 5 / TailwindCSS) và 2 ứng dụng di động "
        "(Expo 54 / React Native 0.81) phục vụ 6 nhóm tác nhân, trong đó nhúng trực tiếp khung Trợ lý AI hướng khách hàng "
        "trên guest-web (FloatingAiChatWidget), customer-mobile (FloatingAiChatModal) và bảng tiếp nhận HITL trên ops-web.",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[367],
        "Đề tài tập trung nghiên cứu, phát triển kiến trúc Multi-Agent kết hợp Hybrid-RAG và API Tool Calling phục vụ "
        "chăm sóc khách hàng tự động, vận hành trực tiếp trên nền tảng quản lý và trung chuyển bưu kiện nội địa Việt Nam "
        "với phạm vi cụ thể như sau:",
    )
    print("[OK] Updated Chapter 1 Problem, Purpose, Objectives, and Scope (P[334..367])")

    # 5. Chapter 8 Conclusion (P[1842..1844])
    set_paragraph_text_preserve_style(
        doc.paragraphs[1842],
        f"Khóa luận đã hoàn thành đầy đủ các mục tiêu của đề tài \"{NEW_TITLE_VI_QUOTE}\", kết hợp chặt chẽ giữa nghiên "
        "cứu kiến trúc Multi-Agent có rào chắn an toàn (HMAS) với việc xây dựng và vận hành thực tế nền tảng chuyển phát "
        "nhanh phân tán đa kênh Nexus Express.",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[1843],
        "Về nghiên cứu và phát triển Multi-Agent AI, phân hệ chatbot-service tích hợp chốt chặn Stage-0 Security "
        "Gatekeeper, Hybrid-RAG (59 chunks SOP kèm trích dẫn Citations[]), 9 công cụ API Tool Calling thời gian thực và "
        "luồng bàn giao Human-in-the-Loop (HITL) sang CSKH/QA đã đạt độ bám sát tri thức 94,8%, độ chính xác gọi công cụ "
        "100,0% và điểm trung bình 85,2 ± 19,8 trên bộ benchmark 100 kịch bản (vượt trội Traditional RAG và ReAct).",
    )
    set_paragraph_text_preserve_style(
        doc.paragraphs[1844],
        "Về nền tảng kỹ thuật thực thi, hệ thống lõi chứng minh tính khả thi của kiến trúc 14 microservices theo nguyên "
        "tắc Database-per-Service (12 cơ sở dữ liệu PostgreSQL độc lập), truyền thông sự kiện RabbitMQ Outbox/CQRS, "
        "xác thực Opaque Bearer Token kèm khóa brute-force, vượt qua 160/160 kịch bản kiểm thử chức năng và 89/100 tiêu "
        "chí kỹ thuật sẵn sàng vận hành.",
    )
    print("[OK] Updated Chapter 8 Conclusion (P[1842..1844])")

    doc.save(DOC_PATH)
    print(f"\nSaved {DOC_PATH} with complete Multi-Agent + RAG + API Tool Calling thesis alignment!")


if __name__ == "__main__":
    main()
