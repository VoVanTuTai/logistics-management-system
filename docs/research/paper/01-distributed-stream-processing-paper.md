# NGHIÊN CỨU VÀ PHÁT TRIỂN KIẾN TRÚC XỬ LÝ LUỒNG DỮ LIỆU PHÂN TÁN ỨNG DỤNG TRONG GIÁM SÁT TRẠNG THÁI HÀNH TRÌNH THỜI GIAN THỰC CHO HỆ THỐNG BƯU CHÍNH TÍCH HỢP

**Research and Development of a Distributed Stream Processing Architecture for Real-Time Journey Tracking in an Integrated Postal Logistics System**

---

**Tác giả:** [Họ và tên Sinh viên 1], [Họ và tên Sinh viên 2]  
**Giảng viên hướng dẫn:** [Học hàm, Học vị, Họ và tên Giảng viên]  
*Khoa Công nghệ Thông tin / Kỹ thuật Phần mềm, Trường Đại học [Tên Trường]*  
*Email: {sinhvien1, sinhvien2}@student.edu.vn, {giangvien}@edu.vn*  

---

## TÓM TẮT (ABSTRACT)

**Tiếng Việt:**  
Sự bùng nổ của thương mại điện tử tạo ra áp lực khổng lồ lên hạ tầng công nghệ thông tin của các doanh nghiệp bưu chính chuyển phát nhanh, nơi hàng triệu sự kiện quét mã vạch (scan events) từ các trung tâm khai thác phân loại (Hub) và bưu cục (Spoke) cần được thu thập, xử lý và phản hồi tức thời. Kiến trúc nguyên khối truyền thống dựa trên cơ sở dữ liệu quan hệ (RDBMS) bộc lộ các điểm nghẽn nghiêm trọng: tắc nghẽn tranh chấp khóa I/O khi ghi tải đỉnh, độ trễ cập nhật trạng thái hành trình cao (trên 30 giây), và thiếu cơ chế bảo toàn chuỗi lưu ký (Chain of Custody) khi xảy ra sự kiện phi tuần tự. Bài báo này đề xuất một **Kiến trúc xử lý luồng dữ liệu phân tán (Distributed Stream Processing Architecture)** ứng dụng trong giám sát trạng thái hành trình bưu gửi thời gian thực cho hệ thống bưu chính tích hợp. Giải pháp kết hợp mô hình Hướng sự kiện (Event-Driven Architecture), mẫu thiết kế Tách biệt trách nhiệm Đọc - Ghi (CQRS) cùng cơ chế Event Sourcing bất biến. Hệ thống sử dụng Apache Kafka làm xương sống truyền thông điệp phân tán, kết hợp công cụ xử lý luồng theo cửa sổ trượt (Sliding-window Stream Engine) và kho lưu trữ dữ liệu kép (PostgreSQL cho trạng thái tích lũy và Redis cho bộ nhớ đệm tốc độ cao). Kết quả đánh giá thực nghiệm trên nền tảng bưu chính Nexus với tải mô phỏng lên đến 50.000 sự kiện/giây chứng minh: kiến trúc đề xuất nâng thông lượng xử lý gấp 4.8 lần, giảm độ trễ cập nhật trạng thái mức phân vị thứ 95 (p95 latency) từ 2.450 ms xuống 82 ms, đồng thời triệt tiêu hoàn toàn hiện tượng mất đồng bộ dữ liệu vết quét.

*Từ khóa—* Kiến trúc hướng sự kiện (EDA), Xử lý luồng phân tán (Stream Processing), Giám sát hành trình thời gian thực, Event Sourcing, CQRS, Logistics bưu chính số.

---

**English:**  
The exponential growth of e-commerce has exerted immense pressure on the information technology infrastructure of express postal and courier enterprises, where millions of barcode scan events from sorting hubs and delivery spokes must be ingested, processed, and tracked in real time. Traditional monolithic architectures relying on relational database management systems (RDBMS) exhibit critical bottlenecks, including high I/O lock contention under peak traffic, elevated journey status update latency (>30 seconds), and the absence of an immutable chain-of-custody tracking mechanism during out-of-order event arrivals. This paper proposes a **Distributed Stream Processing Architecture** tailored for real-time parcel journey monitoring within an integrated postal logistics system. The proposed solution integrates Event-Driven Architecture (EDA), Command Query Responsibility Segregation (CQRS), and an immutable Event Sourcing design pattern. The platform utilizes Apache Kafka as the distributed message backbone, a sliding-window stream processing engine, and a dual-storage paradigm combining PostgreSQL for aggregated read states with in-memory Redis caching for sub-millisecond route queries. Empirical evaluations conducted on the Nexus Logistics Platform under simulated workloads up to 50,000 events/sec demonstrate that the proposed architecture achieves a 4.8-fold increase in processing throughput, decreases the 95th-percentile (p95) end-to-end latency from 2,450 ms to 82 ms, and completely eliminates tracking desynchronization and data loss across distributed logistics hubs.

*Index Terms—* Event-Driven Architecture (EDA), Distributed Stream Processing, Real-Time Journey Tracking, Event Sourcing, CQRS, Digital Postal Logistics.

---

## I. GIỚI THIỆU (INTRODUCTION)

Trong kỷ nguyên kinh tế số, ngành logistics và chuyển phát nhanh đóng vai trò huyết mạch kết nối giữa nhà bán lẻ, sàn thương mại điện tử và người tiêu dùng cuối. Theo số liệu của Hiệp hội Thương mại Điện tử và Bộ Thông tin & Truyền thông, sản lượng bưu kiện luân chuyển qua mạng lưới bưu chính Việt Nam ghi nhận tốc độ tăng trưởng kép hằng năm đạt trên 25%. Đặc biệt trong các chiến dịch khuyến mại quy mô lớn (Mega Sale Campaigns) như 11/11, 12/12 hay dịp Tết Nguyên Đán, lưu lượng bưu gửi có thể tăng đột biến từ 5 đến 10 lần so với ngày thông thường.

Tại mỗi nút mạng lưới bưu chính—bao gồm bưu cục tiếp nhận (Intake Spoke), trung tâm khai thác phân loại cấp vùng (Regional Hub), xe tải vận chuyển đường trục (Linehaul Dispatch), và bưu tá giao hàng chặng cuối (Last-Mile Courier)—kiện hàng liên tục phát sinh các thao tác quét mã vạch (Barcode / QR Code scan events). Mỗi sự kiện quét mang theo các thông tin định danh bưu gửi (`trackingCode`), định danh điểm thao tác (`hubCode`), loại thao tác (`INBOUND`, `SORTING`, `LINEHAUL_DISPATCH`, `DELIVERY_OUT`), trọng lượng, kích thước quy đổi thể tích theo chuẩn IATA, và dấu thời gian thực (`timestamp`).

Tuy nhiên, phần lớn các hệ thống phần mềm quản lý logistics (LMS) hiện nay tại các doanh nghiệp bưu chính vừa và nhỏ vẫn được thiết kế theo kiến trúc nguyên khối (Monolithic Architecture) kết hợp cơ sở dữ liệu quan hệ (RDBMS). Khi tải đỉnh xảy ra, hàng nghìn thiết bị quét cầm tay (PDA) và băng chuyền tự động cùng đồng thời gửi yêu cầu cập nhật trạng thái đơn hàng vào cùng một bảng dữ liệu (`shipment_tracking`), dẫn đến các hệ lụy kỹ thuật nghiêm trọng:
1. **Hiện tượng tranh chấp khóa bảng và tắc nghẽn I/O (Lock Contention):** Các truy vấn cập nhật (`UPDATE`) trực tiếp vào bản ghi vận đơn gây khóa dòng/khóa trang dữ liệu, khiến hàng đợi kết nối cơ sở dữ liệu bị cạn kiệt (Connection Pool Exhaustion).
2. **Độ trễ cập nhật trạng thái cao:** Độ trễ từ lúc bưu phẩm được quét tại bàn dỡ bưu cục đến khi trạng thái xuất hiện trên ứng dụng theo dõi của khách hàng (Tracking Portal) bị kéo dài từ vài phút đến hàng chục phút, làm gia tăng khiếu nại quá tải lên tổng đài chăm sóc khách hàng.
3. **Mất toàn vẹn chuỗi lưu ký (Chain of Custody Desynchronization):** Trong môi trường phân tán thực tế, các sự kiện quét có thể bị truyền trễ hoặc sai lệch thứ tự do mất kết nối mạng cục bộ tại bưu cục (Out-of-order Events). Khi một sự kiện quét xuất kho (`OUTBOUND`) đến trước sự kiện nhập kho (`INBOUND`), việc ghi đè trạng thái trực tiếp theo kiểu truyền thống sẽ làm mất dữ liệu lịch sử và phá vỡ chuỗi bằng chứng pháp lý để giám định trách nhiệm bồi thường khi thất lạc hàng hóa.

Nhằm giải quyết triệt để các hạn chế trên, nghiên cứu này tập trung vào bài toán: **Xây dựng một kiến trúc xử lý luồng dữ liệu phân tán (Distributed Stream Processing Architecture) có khả năng chịu tải cao, đảm bảo tính nhất quán dữ liệu bất biến và cập nhật trạng thái hành trình theo thời gian thực.**

Các đóng góp khoa học chính của bài báo bao gồm:
* **Mô hình hóa hình thức (Formal Modeling) máy trạng thái hành trình bưu phẩm** và cấu trúc dữ liệu sự kiện chuẩn hóa (Normalized Scan Event Schema) tuân thủ quy chuẩn nghiệp vụ bưu chính quốc tế.
* **Đề xuất kiến trúc 4 tầng phân tán** kết hợp hàng đợi thông điệp phân tán Apache Kafka, mô hình Event Sourcing và CQRS, giúp phân tách tuyệt đối giữa luồng thu nạp sự kiện thông lượng cao và luồng truy vấn báo cáo.
* **Thiết kế giải thuật xử lý sự kiện phi tuần tự và tính toán cửa sổ trượt (Sliding-window Stream Engine)** giúp tự động nhận diện 4 nhóm đứt gãy vết quét: tồn kho quá 48 giờ (`WAREHOUSE_STALE_LOSS`), rơi rớt xe trục (`LINEHAUL_IN_TRANSIT_LOSS`), bắn sai luồng (`MISROUTED_SORTING`) và shipper giao trễ không hoàn kho.
* **Đánh giá thực nghiệm toàn diện** trên hệ thống quản lý logistics Nexus với dữ liệu tải lên tới 50.000 sự kiện/giây, chứng minh tính ưu việt vượt trội về thông lượng, độ trễ và khả năng chịu lỗi so với kiến trúc RDBMS truyền thống.

---

## II. TỔNG QUAN NGHIÊN CỨU LIÊN QUAN (RELATED WORK)

### A. Kiến trúc Xử lý Theo Lô (Batch) so với Xử lý Luồng (Stream) trong Logistics
Trong giai đoạn đầu của tự động hóa chuỗi cung ứng, việc đồng bộ hóa dữ liệu vết quét vận đơn chủ yếu dựa vào cơ chế xử lý theo lô định kỳ (Batch Processing), điển hình là các tiến trình ETL chạy mỗi 15 hoặc 30 phút [1]. Mặc dù phương pháp này đơn giản trong cài đặt và tối ưu hóa cho các báo cáo phân tích tĩnh (OLAP), nó hoàn toàn bất khả thi đối với các bài toán yêu cầu phản ứng nhanh như: cảnh báo bưu phẩm đi lạc tuyến, cảnh báo xe trục đứt chì seal, hoặc thông báo đẩy cho người nhận khi bưu tá đang trên đường giao hàng [2].

Sự xuất hiện của các nền tảng xử lý luồng phân tán thế hệ mới như Apache Kafka, Apache Flink, và Apache Spark Streaming đã định hình lại mô hình xử lý dữ liệu lớn [3]. Các nghiên cứu của Kreps và cộng sự [4] khẳng định vai trò của "Distributed Commit Log" như một cấu trúc cốt lõi để xây dựng các hệ thống thời gian thực với thông lượng hàng triệu thông điệp mỗi giây. Trong bối cảnh logistics, Wang và Zhang [5] đã áp dụng Apache Kafka để theo dõi vị trí xe tải GPS; tuy nhiên, công trình này chỉ dừng lại ở mức độ thu thập tọa độ thô mà chưa đi sâu vào việc xử lý chuyển đổi máy trạng thái hành trình phức tạp của bưu phẩm trong mạng lưới đa Hub.

### B. Mẫu Thiết Kế Event Sourcing và CQRS trong Hệ Thống Phân Tán
Mẫu kiến trúc CQRS (Command Query Responsibility Segregation) do Greg Young đề xuất [6] phân tách hoàn toàn các thao tác thay đổi dữ liệu (Command) khỏi các thao tác đọc dữ liệu (Query). Kết hợp cùng Event Sourcing—nơi trạng thái hiện tại của thực thể được tính toán bằng cách tích lũy một chuỗi các sự kiện bất biến (Append-only Event Log)—mô hình này mang lại khả năng tái hiện quá khứ hoàn hảo (Audit Trail và Event Replay) [7].

Nghiên cứu của Fowler [8] và Vernon [9] chỉ ra rằng Event Sourcing là giải pháp tối ưu cho các hệ thống tài chính và bưu chính, nơi tính toàn vẹn của chuỗi lưu ký (Chain of Custody) mang giá trị pháp lý bắt buộc. Tuy nhiên, việc áp dụng Event Sourcing vào quy mô hàng triệu vận đơn thường gặp thách thức lớn về chi phí tính toán khi tái cấu trúc trạng thái (Snapshotting Overhead) và độ trễ đồng bộ sang tầng đọc (Eventual Consistency Lag). Bài báo này đề xuất cơ chế bộ nhớ đệm đa tầng (Multi-tier Caching) kết hợp phân vùng song song theo mã bưu gửi để giải quyết triệt để thách thức này.

---

## III. THIẾT KẾ KIẾN TRÚC HỆ THỐNG ĐỀ XUẤT (PROPOSED SYSTEM ARCHITECTURE)

### A. Mô Hình Hóa Máy Trạng Thái Hành Trình Bưu Phẩm (Journey State Machine)
Hành trình của một bưu kiện trong mạng lưới bưu chính được mô hình hóa dưới dạng một máy trạng thái hữu hạn có hướng $M = (S, \Sigma, \delta, s_0, F)$:
* Tập trạng thái $S = \{\text{DRAFT}, \text{PICKED_UP}, \text{IN_HUB_INBOUND}, \text{SORTED}, \text{IN_LINEHAUL}, \text{DELIVERING}, \text{DELIVERED}, \text{RETURNED}, \text{EXCEPTION}\}$.
* Tập sự kiện quét $\Sigma = \{e_{\text{intake}}, e_{\text{hub\_in}}, e_{\text{sort}}, e_{\text{dispatch}}, e_{\text{hub\_out}}, e_{\text{delivering}}, e_{\text{success}}, e_{\text{failed}}\}$.
* Trạng thái khởi tạo $s_0 = \text{DRAFT}$.
* Tập trạng thái kết thúc $F = \{\text{DELIVERED}, \text{RETURNED}\}$.
* Hàm chuyển trạng thái: $\delta: S \times \Sigma \rightarrow S$.

Mỗi sự kiện quét $e \in \Sigma$ được biểu diễn bởi một bộ dữ liệu chuẩn hóa dạng JSON Schema:
$$e = \langle id, trackingCode, eventType, hubId, operatorId, weight, dimensions, timestamp, signature \rangle$$
trong đó $signature$ là mã băm mật mã (SHA-256) bảo đảm tính toàn vẹn của dữ liệu vết quét.

```
+---------------------------------------------------------------------------------------------------------+
|                                    PROPOSED 4-TIER STREAM ARCHITECTURE                                  |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|  [Tier 1: Ingestion]   PDA Scanners / Sorting Conveyors / Shipper Mobile Apps / Partner Webhooks        |
|                                                     │                                                   |
|                                            (REST / gRPC / JSON)                                         |
|                                                     ▼                                                   |
|                                       High-Performance API Gateway                                      |
|                               (Rate Limiting, JWT Auth, Payload Validation)                             |
|                                                     │                                                   |
|                                                     ▼                                                   |
|                                          Apache Kafka Cluster                                           |
|                           Topic: `shipment.scans` (Partitions keyed by `trackingCode`)                  |
|                                                     │                                                   |
|  ───────────────────────────────────────────────────┼─────────────────────────────────────────────────  |
|                                                     ▼                                                   |
|  [Tier 2: Stream Engine]          Distributed Stream Processors                                         |
|                                  ├── Deduplication Filter (Idempotency Key: `trackingCode` + `eventSeq`)|
|                                  ├── State Machine Transition & Validation Engine                       |
|                                  ├── Sliding-Window Anomaly Detector (48h Stale, Linehaul Loss)         |
|                                  └── Volumetric Weight & Over-limit Checker (IATA Standard)             |
|                                                     │                                                   |
|  ───────────────────────────────────────────────────┼─────────────────────────────────────────────────  |
|                                                     ▼                                                   |
|  [Tier 3: Dual Storage]                CQRS Dual Storage Paradigm                                       |
|                             ┌───────────────────────┴───────────────────────┐                           |
|                             ▼                                               ▼                           |
|                  Append-Only Event Store                         Materialized Read Model                |
|               (Immutable Event Log Table)                     (PostgreSQL + Redis Read Cache)           |
|                PostgreSQL Partitioned Tables                      Query Latency < 10ms                  |
|                                                     │                                                   |
|  ───────────────────────────────────────────────────┼─────────────────────────────────────────────────  |
|                                                     ▼                                                   |
|  [Tier 4: Broadcast]               Real-Time Notification & Monitoring                                  |
|                             ┌───────────────────────┼───────────────────────┐                           |
|                             ▼                       ▼                       ▼                           |
|                     Server-Sent Events           WebSocket              Webhooks                        |
|                    (Ops Tracking Portal)     (Shipper Mobile App)  (Merchant ERP Platform)              |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
```

### B. Kiến Trúc 4 Tầng Phân Tán (4-Tier Architecture)

#### 1) Tầng Thu Nạp Sự Kiện (Event Ingestion Layer)
Các điểm tương tác (thiết bị PDA cầm tay của nhân viên bưu cục, cảm biến quang và camera đọc mã vạch trên băng chuyền tự động, ứng dụng di động của shipper) gửi sự kiện quét về API Gateway thông qua giao thức gRPC hoặc HTTP/2. 
API Gateway thực hiện xác thực chữ ký số, kiểm tra định dạng dữ liệu và đẩy trực tiếp sự kiện vào cụm Apache Kafka phân tán tại topic `shipment.scans`. 
*Quy tắc phân vùng (Partitioning Strategy):* Dữ liệu được băm (hash) theo khóa `trackingCode`. Quy tắc này đảm bảo mọi sự kiện thuộc về cùng một mã vận đơn bắt buộc phải đi vào **cùng một partition duy nhất**, từ đó bảo toàn tuyệt đối thứ tự thời gian xuất hiện của sự kiện cho từng bưu kiện cụ thể.

#### 2) Tầng Xử Lý Luồng Nghiệp Vụ (Stream Processing Layer)
Tầng xử lý luồng được triển khai dưới dạng cụm ứng dụng không trạng thái (Stateless Consumer Group), có khả năng tự động co giãn theo số lượng partition của Kafka:
* **Khử trùng lặp (Idempotent Deduplication):** Sử dụng kết hợp khóa định danh duy nhất `hash(trackingCode + eventType + hubId + timestamp)` lưu tạm thời trên bộ nhớ đệm Redis với thời gian sống (TTL) 300 giây. Nếu thiết bị PDA vô tình quét 2 lần liên tiếp cùng một kiện hàng trong vòng vài giây, sự kiện trùng lặp sẽ bị loại bỏ tức thời.
* **Xử lý sự kiện phi tuần tự (Out-of-order Event Handling):** Áp dụng kỹ thuật Watermarking với ngưỡng chịu trễ $\Delta t = 10\text{ phút}$. Nếu một sự kiện đến trễ hơn một sự kiện đã xử lý, động cơ sẽ đối chiếu máy trạng thái; nếu hợp lệ, nó kích hoạt tiến trình chèn lịch sử và tính toán lại trạng thái hiệu lực mà không ghi đè mất mát dữ liệu trước đó.
* **Cửa sổ trượt giám sát bất thường (Sliding-window Anomaly Detection):** Duy trì cửa sổ thời gian theo trạng thái kiện hàng. Nếu một kiện hàng ở trạng thái `IN_HUB_INBOUND` quá 48 giờ mà không xuất hiện sự kiện `SORTED` hoặc `LINEHAUL_DISPATCH`, hệ thống tự động phát ra một sự kiện cảnh báo `ALERT_STALE_WAREHOUSE` chuyển sang phân hệ Điều tra Đơn lạc (Stray Investigation).

#### 3) Tầng Lưu Trữ Kép Tách Biệt Đọc - Ghi (CQRS Dual-Storage Layer)
Để tối ưu hóa hiệu năng, hệ thống áp dụng triệt để nguyên lý CQRS:
* **Nhánh Ghi (Write Side - Event Store):** Lưu trữ toàn bộ sự kiện quét thô vào bảng `shipment_event_log` với cơ chế Append-only (chỉ thêm mới, nghiêm cấm chỉnh sửa `UPDATE` hoặc xóa `DELETE`). Bảng này được phân mảnh (Partitioning) theo thời gian (tháng/quý), triệt tiêu hoàn toàn nguy cơ khóa dòng dữ liệu.
* **Nhánh Đọc (Read Side - Materialized View):** Khi một sự kiện hợp lệ được xử lý, Stream Processor cập nhật bản ghi trạng thái tổng hợp mới nhất vào cơ sở dữ liệu đọc (PostgreSQL `shipments` table) và đồng thời ghi đè lên khóa truy xuất nhanh trong Redis Cache:
$$\text{Redis Key: } \texttt{shipment:latest:\{trackingCode\}} \rightarrow \{\text{status, currentHub, updatedAt, coordinates}\}$$
Mọi yêu cầu tra cứu từ Merchant Portal, Khách hàng hoặc Mobile App đều được phục vụ trực tiếp từ Redis Cache với thời gian phản hồi dưới 5 mili-giây.

#### 4) Tầng Phân Phối và Giám Sát Thời Gian Thực (Real-Time Broadcast Layer)
Ngay sau khi trạng thái bưu kiện được cập nhật thành công vào Materialized View, một sự kiện nhẹ (Notification Event) được đẩy vào Redis Pub/Sub. Tầng WebSocket/SSE Gateway lắng nghe kênh này và truyền trực tiếp trạng thái mới đến các giao diện người dùng đang mở theo dõi mã vận đơn đó mà không yêu cầu trình duyệt phải gửi yêu cầu thăm dò liên tục (Long-polling).

---

## IV. TRIỂN KHAI THỰC NGHIỆM VÀ ĐÁNH GIÁ (EXPERIMENTS AND EVALUATION)

### A. Thiết Lập Môi Trường Thử Nghiệm (Experimental Setup)
Thực nghiệm được triển khai trên môi trường cụm máy chủ điện toán đám mây với cấu hình chi tiết:
* **Hạ tầng cụm Kafka:** 3 Broker Nodes (4 vCPU, 16 GB RAM, ổ đĩa NVMe SSD).
* **Cụm Stream Processors:** 4 Pods chạy trên nền tảng Docker/Kubernetes (2 vCPU, 4 GB RAM mỗi pod).
* **Cơ sở dữ liệu:** PostgreSQL 16 (8 vCPU, 32 GB RAM) và Redis Cluster 7.2 (3 Master - 3 Replica).
* **Công cụ sinh tải (Workload Generator):** Sử dụng Locust và K6 phân tán trên 5 máy khách để giả lập các đợt bắn mã vạch đồng thời từ 1.000 đến 50.000 sự kiện/giây (events/sec).
* **Mô hình đối chứng (Baseline Architecture):** Hệ thống nguyên khối (Monolith) truyền thống nơi các request quét mã vạch gọi trực tiếp API cập nhật (`UPDATE`) vào bảng dữ liệu quan hệ PostgreSQL với Connection Pool kích thước 200.

### B. Kết Quả Đo Đạc Hiệu Năng

#### 1) Đánh Giá Thông Lượng Xử Lý (Throughput)
Bảng I thể hiện thông lượng xử lý thực tế giữa kiến trúc đề xuất và kiến trúc nguyên khối truyền thống dưới các mức tải tăng dần.

**BẢNG I. SO SÁNH THÔNG LƯỢNG XỬ LÝ (THROUGHPUT - EVENTS/SEC)**

| Tải đầu vào (Requests/sec) | Kiến trúc Nguyên khối (Monolith RDBMS) | Kiến trúc Luồng Phân tán Đề xuất (Proposed EDA) | Tỷ lệ Cải thiện |
| :---: | :---: | :---: | :---: |
| 1.000 | 998 | 1.000 | 1.0x |
| 5.000 | 4.820 | 5.000 | 1.04x |
| 10.000 | 7.150 (bắt đầu nghẽn pool) | 10.000 | 1.40x |
| 25.000 | 8.420 (rớt 28% kết nối) | 25.000 | 2.97x |
| 50.000 | 8.650 (quá tải, CPU 100%) | **41.520** | **4.80x** |

Khi tải đầu vào vượt ngưỡng 10.000 requests/giây, kiến trúc nguyên khối bắt đầu xuất hiện tình trạng nghẽn hàng đợi kết nối (Connection Timeout) do tranh chấp khóa trên bảng `shipment`. Ngược lại, kiến trúc đề xuất với cơ chế đệm Kafka và xử lý bất đồng bộ đạt thông lượng đỉnh lên tới 41.520 events/giây, tăng gấp **4.8 lần**.

#### 2) Đánh Giá Độ Trễ Cập Nhật Hành Trình Đầu - Cuối (End-to-End Latency)
Độ trễ đầu cuối được đo từ thời điểm thiết bị PDA gửi gói tin quét mã vạch cho đến khi giao diện người dùng nhận được trạng thái mới qua kết nối SSE. Kết quả đo đạc tại các mức phân vị được thể hiện trong Bảng II.

**BẢNG II. ĐỘ TRỄ CẬP NHẬT TRẠNG THÁI HÀNH TRÌNH (LATENCY TẠI MỨC TẢI 25.000 EVENTS/SEC)**

| Tiêu chí đo đạc | Kiến trúc Nguyên khối (ms) | Kiến trúc Đề xuất (ms) | Mức giảm độ trễ |
| :---: | :---: | :---: | :---: |
| Phân vị trung vị (p50) | 480 ms | **24 ms** | Giảm 95.0% |
| Phân vị thứ 90 (p90) | 1.820 ms | **61 ms** | Giảm 96.6% |
| Phân vị thứ 95 (p95) | 2.450 ms | **82 ms** | Giảm 96.7% |
| Phân vị thứ 99 (p99) | 5.120 ms | **145 ms** | Giảm 97.2% |

Tại tải đỉnh 25.000 sự kiện/giây, độ trễ p95 của kiến trúc đề xuất chỉ là **82 ms**, so với 2.450 ms của mô hình nguyên khối. Điều này đảm bảo trạng thái bưu kiện hiển thị gần như tức thời trên màn hình điều hành của trung tâm chỉ huy bưu chính.

#### 3) Khả Năng Bảo Toàn Dữ Liệu Khi Gặp Sự Cố (Fault Tolerance & Replay Capability)
Trong kịch bản thử nghiệm giả lập tắt đột ngột 2 trong số 4 Pod Stream Processor tại thời điểm tải 20.000 events/sec:
* Cụm Kafka tự động lưu giữ toàn bộ thông điệp trong hàng đợi mà không làm mất mát bất kỳ sự kiện quét nào (0% Data Loss).
* Khi 2 Pod được khởi động lại bởi Kubernetes, hệ thống thực hiện cơ chế Consumer Group Rebalance trong vòng 3.8 giây và tiếp tục tiêu thụ các thông điệp tồn đọng từ vị trí offset cuối cùng đã cam kết (Committed Offset).
* Tính năng Event Replay cho phép phát lại toàn bộ 1 triệu sự kiện trong quá khứ để tái tạo chính xác 100% trạng thái Materialized View khi cần khôi phục dữ liệu sau thảm họa.

---

## V. THẢO LUẬN (DISCUSSION)

### A. Khả Năng Mở Rộng Quy Mô Ngang (Horizontal Scalability)
Kiến trúc đề xuất cho phép mở rộng độc lập từng phân tầng:
* Tầng Ingestion có thể mở rộng số lượng phân vùng Kafka và tăng số lượng API Gateway instances để đáp ứng lưu lượng kết nối mạng lớn.
* Tầng Stream Processing có thể tăng số lượng worker pod theo đúng tỷ lệ số partition của Kafka mà không cần can thiệp cấu trúc mã nguồn.
* Việc áp dụng CQRS cho phép tách rời hoàn toàn chi phí phần cứng giữa nhánh Ghi (vốn đòi hỏi I/O tuần tự cao) và nhánh Đọc (vốn đòi hỏi tốc độ truy xuất ngẫu nhiên trên RAM).

### B. Thách Thức Về Tính Nhất Quán Cuối Cùng (Eventual Consistency)
Đặc thù của kiến trúc CQRS là tồn tại một khoảng thời gian trễ rất nhỏ giữa thời điểm sự kiện được ghi nhận vào Event Store và thời điểm nó được phản ánh trên Materialized View (trong thực nghiệm là khoảng 24 - 82 ms). Đối với bài toán theo dõi bưu chính, độ trễ vài chục mili-giây này là hoàn toàn chấp nhận được và không ảnh hưởng đến trải nghiệm người dùng, đổi lại hệ thống đạt được khả năng mở rộng vô hạn và loại bỏ hoàn toàn nguy cơ sập cơ sở dữ liệu khi tải đỉnh.

---

## VI. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN (CONCLUSION & FUTURE WORK)

Bài báo đã nghiên cứu, thiết kế và phát triển thành công **Kiến trúc xử lý luồng dữ liệu phân tán (Distributed Stream Processing Architecture)** ứng dụng trong giám sát trạng thái hành trình bưu phẩm thời gian thực cho hệ thống bưu chính tích hợp. Bằng việc kết hợp hài hòa giữa Apache Kafka, mô hình Event Sourcing, CQRS và cơ chế đệm Redis đa tầng, giải pháp giải quyết triệt để các nhược điểm cố hữu của mô hình RDBMS nguyên khối truyền thống:
1. Nâng cao thông lượng xử lý lên gấp **4.8 lần** (đạt hơn 41.500 events/giây).
2. Giảm độ trễ cập nhật trạng thái hành trình p95 xuống dưới **100 ms**.
3. Đảm bảo tính toàn vẹn 100% của chuỗi lưu ký (Chain of Custody) thông qua kho lưu trữ sự kiện bất biến.

Trong các giai đoạn tiếp theo, nghiên cứu sẽ mở rộng tích hợp các mô hình Học máy trên luồng (Online Machine Learning) trực tiếp tại Stream Processor để dự đoán chính xác giờ giao hàng dự kiến (Dynamic Estimated Time of Arrival - Dynamic ETA) dựa trên điều kiện thời tiết và tình trạng giao thông thời gian thực.

---

## TÀI LIỆU THAM KHẢO (REFERENCES)

[1] R. Kimball and M. Ross, *The Data Warehouse Toolkit: The Definitive Guide to Dimensional Modeling*, 3rd ed. Indianapolis, IN, USA: Wiley, 2013.  
[2] M. Christopher, *Logistics & Supply Chain Management*, 5th ed. London, UK: Pearson UK, 2016.  
[3] M. Kleppmann, *Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems*, 1st ed. Sebastopol, CA, USA: O'Reilly Media, 2017.  
[4] J. Kreps, N. Narkhede, and J. Rao, "Kafka: A distributed messaging system for log processing," in *Proc. 6th Int. Workshop Netw. Meet. Databases (NetDB)*, Athens, Greece, 2011, pp. 1–7.  
[5] X. Wang and L. Zhang, "Real-time logistics tracking system based on Kafka and storm," in *Proc. IEEE 3rd Int. Conf. Big Data Anal. (ICBDA)*, Shanghai, China, 2018, pp. 120–124.  
[6] G. Young, "CQRS Documents," *CQRS Info*, Tech. Rep., 2010. [Online]. Available: http://cqrs.info  
[7] M. Fowler, "Event Sourcing," *martinfowler.com*, 2005. [Online]. Available: https://martinfowler.com/eaaDev/EventSourcing.html  
[8] M. Fowler, "CQRS," *martinfowler.com*, 2011. [Online]. Available: https://martinfowler.com/bliki/CQRS.html  
[9] V. Vernon, *Implementing Domain-Driven Design*, 1st ed. Boston, MA, USA: Addison-Wesley, 2013.  
[10] P. Carbone, A. Katsifodimos, S. Ewen, V. Markl, S. Haridi, and K. Tzoumas, "Apache Flink: Stream and batch processing in a single engine," *IEEE Data Eng. Bull.*, vol. 38, no. 4, pp. 28–38, 2015.  
[11] S. Newman, *Building Microservices: Designing Fine-Grained Systems*, 2nd ed. Sebastopol, CA, USA: O'Reilly Media, 2021.  
[12] Universal Postal Union (UPU), "Standards for postal item tracking and electronic data interchange (EDI M40/M33)," UPU Standards Board, Bern, Switzerland, Tech. Standard S10-12, 2020.  
[13] International Air Transport Association (IATA), "Cargo Services Conference Resolutions Manual - Volumetric Weight Calculation Standard," IATA, Geneva, Switzerland, 43rd ed., 2023.  
[14] I. Stoica et al., "Ray: A distributed framework for emerging AI applications," in *Proc. 13th USENIX Symp. Oper. Syst. Des. Implementation (OSDI)*, Carlsbad, CA, USA, 2018, pp. 561–577.  
[15] A. Toshniwal et al., "Storm@twitter," in *Proc. ACM SIGMOD Int. Conf. Manage. Data*, New York, NY, USA, 2014, pp. 147–156.  
