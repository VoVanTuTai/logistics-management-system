# Research and Development of a Multi-Agent System Combining RAG and API Tool Calling for Automated Customer Support in Express Courier and Parcel Management Systems

---

**Authors:** Tan-Tai Tran, Tu-Tai Vo-Van, and Mr. Huynh Nam  

---

## ABSTRACT

Rising e-commerce parcel volumes strain express courier support desks. Conventional rule-based chatbots fail on complex phrasing, while standalone large language models (LLMs) hallucinate postal rules, cannot execute backend APIs, and risk leaking Personally Identifiable Information (PII). We present a Heterogeneous Multi-Agent System (HMAS) integrating Hybrid Retrieval-Augmented Generation (RAG) and dynamic API Tool Calling for automated courier customer support. HMAS coordinates a Knowledge Retrieval Agent (512-dimensional Matryoshka embeddings with BM25 over 9 carrier SOPs), an Operational Tool Agent (waybill tracking and IATA volumetric billing), and an Independent Validation Critic Gatekeeper enforcing physical ceilings and PII masking via Two-Phase Gated Execution. On a benchmark of $N = 100$ logistics scenarios (30 development, 70 blind test), HMAS achieves an $84.6\%$ functional pass rate ($44/52$ cases; score: $83.1 \pm 17.1$). Dual-annotator evaluation shows substantial agreement (Cohen's $\kappa = 0.824$; human pass: $88.5\%$; factual error: $5.77\%$ [95% CI: $1.21\%\text{–}15.95\%$]). Standalone OWASP red-teaming ($n = 100$) records $0.0\%$ Attack Success Rate on external probes (95% CI: $[0.0\%, 8.81\%]$) with $2.0\%$ false refusals. Against a Single-Agent + Critic baseline, HMAS improves groundedness ($95.2\%$ vs. $88.1\%$, $p < 0.001$) and functional pass rate ($84.6\%$ vs. $69.2\%$). A 30-day pilot (1,420 sessions) achieves $78.4\%$ containment at $\$0.0080$/session versus $\sim\$0.12$ manual cost.

*Index Terms—* Multi-Agent Systems, Retrieval-Augmented Generation (RAG), API Tool Calling, Customer Support Automation, Postal Logistics, Express Courier, Personally Identifiable Information (PII), Inter-Rater Reliability, OWASP LLM Top 10.

---

## I. INTRODUCTION

In the digital economy, express courier and parcel delivery services serve as critical infrastructure linking merchants, e-commerce marketplaces, and end consumers. During promotional campaigns (e.g., Double 11, Black Friday, and Lunar New Year festivals), parcel throughput surges by $300\%$ to $500\%$, triggering a proportional surge in customer support inquiries [1]. Support centers routinely handle thousands of recurring queries daily, encompassing parcel delivery tracking, shipping fee computations, fragile parcel packaging guidelines, delayed delivery complaints, and damaged goods indemnification.

Historically, postal customer service has relied on two primary paradigms: (1) Human Contact Centers, which are capable of nuanced empathy and policy interpretation but prohibitively expensive and difficult to scale linearly during peak shopping seasons; and (2) Rule-Based Decision Tree Chatbots, which are deterministic and fast but brittle, failing completely when customer queries deviate from strict keyword patterns.

Recent breakthroughs in generative Artificial Intelligence and Large Language Models (LLMs)—such as GPT-4, Claude 3.5, and Llama 3.1—offer human-grade conversational fluency. However, deploying off-the-shelf LLMs in courier logistics faces four prohibitive operational bottlenecks:
1. **Factual Hallucinations in Regulatory Inquiries:** Express couriers operate under strict legal frameworks (e.g., national Postal Laws, Universal Postal Union standards, and carrier liability tiers). Pure parametric LLMs frequently hallucinate statutory storage limits, compensation caps, and mandatory inspection requirements [2].
2. **Knowledge Cutoff and Static Boundaries:** Standard Operating Procedures (SOPs), regional fuel surcharges, and holiday operating hours update frequently. Re-training or fine-tuning foundation models for every operational adjustment is cost-prohibitive and operationally impractical [3].
3. **Inability to Actuate Live Systems (Action Gap):** Customer inquiries are fundamentally transactional. Knowing policy is useless unless the system can query the real-time database to retrieve the latest scan milestone, re-route a courier, or initiate a claim ticket [4].
4. **Privacy and PII Leakage Vulnerabilities:** Logistics data contains sensitive Personally Identifiable Information (recipient phone numbers, home delivery addresses, declared merchandise values, and COD amounts). Exposing raw databases to conversational interfaces without strict access control and dynamic redaction violates privacy regulations [5].

To resolve these challenges, this research investigates the following core hypotheses: (1) whether the synthesis of Hybrid RAG and dynamic API Tool Calling can concurrently exploit static regulatory documentation and real-time operational states while bounding factual error rates within an empirically validated confidence interval; (2) how Single-Agent and Multi-Agent architectures diverge regarding factual groundedness, tool parameter precision, and task completion under complex exceptions; and (3) whether the performance improvement of Multi-Agent orchestration justifies the incremental response latency and token overhead.

The primary scientific and engineering contributions of this research are:
* **Domain-Specific Multi-Agent Architecture (Addressing RQ1, RQ2):** Formalizing an Agentic workflow specifically mapped to courier operations, decomposing tasks across Knowledge Retrieval, Live API Actuation, and Formal Dispute Adjudication with an independent Critic Gatekeeper.
* **Dual-Stage Hybrid RAG Engine (Addressing RQ1):** Combining dense semantic vector search (Matryoshka Representation Learning at 512 dimensions) and sparse lexical search (BM25) over 9 curated Carrier Standard Operating Procedures, achieving $94.6\%$ chunk-level $\text{Recall@5}$ and an $\text{MRR}$ of $0.862$ on the indexed held-out test split.
* **Secure API Tool Calling Framework with PII Masking (Addressing RQ1):** Establishing deterministic function-calling interfaces with backend microservices, incorporating automated authentication verification, parameter validation, and dynamic PII redaction.
* **Empirical Benchmark and Trade-off Analysis (Addressing RQ2, RQ3):** Conducting a structured 6-configuration ablation study and independent dual-annotator evaluation on a logistics dataset ($N = 100$, 30/70 dev/test split), reporting inter-rater agreement (Cohen's $\kappa = 0.824$), OWASP red-teaming Clopper-Pearson confidence intervals, pre/post knowledge intervention deltas, and confirming that multi-agent latency overhead ($+1,071\text{ ms}$) is justified by groundedness ($+7.1\%$) and zero unredacted PII leakage.
* **Field Pilot Deployment Telemetry:** Reporting real-world operational metrics from a 30-day pilot deployment handling $1,420$ customer sessions with a $78.4\%$ autonomous containment rate and an empirical AI operating cost of $\$0.0080$ per resolved session.

---

## II. RELATED WORK

### A. Task-Oriented Dialogue Systems
Task-oriented dialogue (TOD) architectures have evolved from modular pipeline systems [6] and multi-domain state tracking benchmarks, such as MultiWOZ [7], toward end-to-end neural conversational architectures [8]. While general customer service chatbots focus on conversational chitchat or slot-filling intent classification, postal and express courier domains demand strict adherence to statutory indemnification thresholds and deterministic parcel lifecycle states. Recent work demonstrates that off-the-shelf foundation models struggle with statutory constraints without explicit external grounding [2].

### B. Retrieval-Augmented Generation (RAG) and Evaluation Frameworks
Retrieval-Augmented Generation (RAG), pioneered by Lewis et al. [9], mitigates factual hallucinations by retrieving relevant non-parametric document passages from an external corpus. While dense vector embeddings excel at semantic matching, Robertson and Zaragoza [10] showed that sparse lexical search (BM25) is essential for exact alphanumeric matching of legal article numbers (e.g., 'Article 25 of Decree 47/2011/ND-CP') and technical freight standards (e.g., 'IATA Cargo Resolution 6000'). Cormack et al. [11] showed that reciprocal rank fusion yields superior retrieval precision. Automated RAG evaluation frameworks, such as RAGAS [12], emphasize answer faithfulness and context relevance. In this work, we integrate hybrid reciprocal rank fusion with independent human ground-truth auditing.

### C. Tool-Augmented LLMs and Multi-Agent Benchmarks
Empowering language models to interact with digital environments via executable tool calling was popularized by Toolformer [13] and the ReAct reasoning paradigm [4]. Benchmarks such as $\tau$-bench [14] and ToolLLM [15] have established that agentic workflows substantially enhance task success in transactional domains like airline booking and e-commerce. To coordinate complex workflows, multi-agent frameworks like AutoGen [16] and LangGraph [17] partition tasks among specialized agents. Our study extends this literature by investigating the specific necessity of multi-agent decomposition versus unified single-agent baselines in high-stakes express courier logistics.

### D. LLM Safety, Red-Teaming, and OWASP Vulnerabilities
As LLMs are integrated into operational backends, they become exposed to adversarial vulnerabilities formalized by the OWASP Top 10 for Large Language Model Applications (2025 Edition) [18], including prompt injection (LLM01), sensitive information disclosure (LLM02), and excessive agency (LLM06). Recent automated red-teaming techniques, such as PAIR [19], demonstrate that adversarial jailbreaks can easily bypass soft prompt guards. Our work addresses these vulnerabilities by introducing an independent Critic Gatekeeper and a cryptographic PII redaction firewall.

---

## III. SYSTEM ARCHITECTURE AND METHODOLOGY

### A. Multi-Agent Framework and Role Partitioning
The system adopts a directed cyclic graph architecture implemented via LangGraph, consisting of a root Supervisor Agent and three specialized worker agents, as illustrated in the system architecture blueprint (Fig. 1):
1. **Supervisor Orchestrator Agent (`ChatService`):** Inspects inbound user queries, extracts conversational state history from session memory (`sessions: Map<string, ChatSessionContext>`), and computes an intent probability distribution over three operational spaces: Policy Inquiry, Operational Action, and Dispute Escalation. The Supervisor formulates a multi-step execution plan and routes control flow dynamically.
2. **Knowledge Retrieval Agent (`VectorStoreService`):** Activated when inquiries involve terms of service, packaging guidelines, insurance thresholds, or postal statutory limits. The agent queries an indexed knowledge base of 9 authoritative Carrier SOPs without hallucinating arbitrary policy terms.
3. **Operational Tool Agent (`LogisticsToolsService`):** Interfaces with live microservice REST and gRPC endpoints. It translates user intent into deterministic function arguments, validates input constraints, executes backend calls, and applies dynamic data masking to protect PII. Waybill identifiers for national postal carriers (VNPost) are validated against Universal Postal Union standard S10-12 (13-character alphanumeric identifier, e.g., 2 letters, 9 digits, 2 letters) [20], whereas private commercial couriers (GHTK, GHN, Viettel Post) are validated against carrier-specific alphanumeric tracking format expressions.
4. **Independent Validation Critic Gatekeeper:** An independent LLM critic (`callValidationAgent`) operating with dedicated deterministic policy invariant filters. It runs on the base open-weights `Meta-Llama-3.1-70B-Instruct` model configured with greedy deterministic decoding ($T = 0.0$) in an isolated sandboxed container with its own prompt template and validation schema, ensuring zero context pollution from worker agent scratchpads. The Critic inspects proposed actions against 3 physical network ceilings ($\le 70\text{ kg}$, $\le 150\text{ cm}$, $\le 300\text{ cm}$), prohibited goods statutes, and cash-on-delivery thresholds (COD $\ge 15\text{M}$ VND).
5. **Claims and Dispute Resolution Agent:** Manages formal exception cases (e.g., damaged items, lost shipments, or failed delivery SLA violations). Tested across 15 high-stakes compensation and stray parcel cases (COD $\ge 15\text{M}$ VND, damaged fragile parcels under SOP 07/08), the agent orchestrates a structured 24-hour dispute hearing window, issues automated notifications, and initiates deterministic Human-in-the-Loop (HITL) approval gates with tamper-evident audit logging before financial claims are committed.

![Fig. 1. Architectural blueprint of the proposed Heterogeneous Multi-Agent System (HMAS)](file:///Users/Tai.IS/my-project/logistics-management-system/docs/research/paper/diagrams/code-aligned-hmas-ai-generated-bw.png)
*Fig. 1. Architectural blueprint of the proposed Heterogeneous Multi-Agent System (HMAS), illustrating the hierarchical Supervisor orchestrator (`ChatService`), specialized worker agents (`VectorStoreService`, `LogisticsToolsService`), Dual-Anchor Grounding engine, and independent validation critic gatekeeper.*

### B. Multi-Agent Dynamic Task Allocation Workflow
The operational lifecycle follows a five-stage transition pipeline (Fig. 2): (1) Client Ingress arriving via Customer Mobile App, Guest Tracking Web Portal, or CSKH Operations Support with PII obfuscation (with zero touchpoints on the Merchant Web Portal); (2) Supervisor Intent Classification mapping context across session state; (3) Parallel Task Allocation routing queries to Knowledge RAG or Deterministic Tool Agents; (4) Independent Validation Critic Gatekeeping evaluating invariants; and (5) Response Synthesis with HITL Escalation for high-stakes financial operations.

![Fig. 2. End-to-end task allocation and dynamic agent execution workflow](file:///Users/Tai.IS/my-project/logistics-management-system/docs/research/paper/diagrams/multi-agent-task-collaboration-ai-generated-bw.png)
*Fig. 2. End-to-end task allocation and dynamic agent execution workflow, depicting the five-stage transition pipeline: (1) Client ingress with PII masking; (2) Supervisor intent classification; (3) Parallel worker grounding; (4) Independent validation critic gatekeeping; and (5) HITL escalation and rich card synthesis.*

### C. Hybrid RAG Retrieval Engine
The knowledge repository comprises 9 official carrier documents, structured into hierarchical markdown chunks. To optimize both semantic recall and exact alphanumeric match accuracy, we implement a Reciprocal Rank Fusion (RRF) Hybrid Retrieval Pipeline:
* **Document Chunking:** Input SOPs are parsed using a recursive markdown-aware chunking strategy with a chunk size of 512 tokens and an overlap of 64 tokens, preserving section headings as chunk metadata.
* **Dual Embedding and Indexing:** Chunks are embedded using Matryoshka Representation Learning (MRL) at 512 dimensions, offering rapid cosine similarity computation while retaining 98% of full-dimensional semantic capacity. Chunks are simultaneously tokenized and indexed using the BM25 algorithm, ensuring exact keyword matching for statutory legal articles (e.g., 'Articles 18 & 28 Postal Law') and technical acronyms (e.g., 'IATA 6000').
* **Hybrid Scoring and Re-ranking:** Given a user query $q$, the composite relevance score $S(q, d)$ for candidate document chunk $d$ is formulated as:

$$S(q, d) = \alpha\,\text{CosSim}(\mathbf{e}_q, \mathbf{e}_d) + (1 - \alpha)\,\text{BM25}(q, d) \tag{1}$$

where $\alpha = 0.70$ balances dense semantic intent with exact lexical grounding. Chunks scoring below threshold $\tau$ are purged to prevent low-confidence context injection:

$$\mathcal{D}_{\text{filtered}} = \{ d \in \mathcal{D} \mid S(q, d) \ge \tau \}, \quad \tau = 0.60 \tag{2}$$

### D. Dynamic API Tool Calling and Security Gatekeeping
The Operational Tool Agent maintains a verified registry of executable tools defined using JSON Schema contracts. Core operational tools include:
* `trackShipment(trackingCode)`: Fetches real-time milestone logs, GPS coordinates, and vehicle transit status.
* `calculateShippingRate(weight, length, width, height, serviceCode)`: Enforces IATA Cargo Resolution 6000 volumetric weight standards [21]:

$$W_{\text{chargeable}} = \max\left(W_{\text{actual}}, \; \frac{L \times W \times H}{6000}\right) \tag{3}$$

* `cancelShipment(trackingCode)`: Cancels pending shipments subject to strict state and role authorization.
* `fileDisputeClaim(trackingCode, incidentType, evidenceUrls)`: Registers an official investigation ticket.

**Two-Phase Gated Execution Architecture:** To reconcile the low perceived response latency of Server-Sent Events (SSE) token streaming (perceived $\text{TTFT} = 420\text{ ms}$) with the serial execution of the Independent Validation Critic ($532\text{ ms}$), the system implements a Two-Phase Gated Execution pipeline:
1. *Pure Informational Inquiries:* For conversational and policy explanation queries, the system employs speculative 3-token buffer chunking; tokens stream progressively while the Critic performs background assertion checks. If a text-level violation or prompt injection pattern is detected, the stream is abruptly severed and overwritten with a standardized safe refusal message.
2. *Mutating Operational Actions & PII Access:* For queries invoking operational tools (e.g., `cancelShipment`, parcel address redirection, COD changes, or customer PII lookups), execution is synchronous and gated prior to backend invocation. The Supervisor constructs an Action Draft DTO, passing it to the Validation Critic in series (taking $532\text{ ms}$). In this synchronous pipeline, backend endpoints remain gated and PII tokens remain unrendered until the Critic issues a cryptographic approval token.
Hence, **$100\%$ Block Rate** within this evaluation denotes zero observed unauthorized API mutations or unmasked PII tokens rendered across tested prompts.

**Role-Based PII Masking and Security Firewall:** When an unauthenticated guest user queries tracking information, the Tool Agent intercepts the database payload and enforces cryptographic masking: Recipient Phone `0912345678` $\rightarrow$ `0912***678`; Delivery Address `123 Nguyen Hue, Ben Nghe, Q1` $\rightarrow$ `***, Ben Nghe, Quan 1, TP.HCM`. The agent automatically generates a challenge response prompting the user to authenticate via JWT or provide the last 4 digits of the registered phone number before unlocking full waybill details.

### E. Interactive UI Generation (Rich Cards)
Text-only conversational outputs are prone to user misinterpretation when displaying dense tabular data. The system synthesizes structured visual cards embedded directly within the chat stream: (1) Timeline Milestone Card renders a clean chronological sequence of scan events; (2) Rate Estimation Card displays base tariff, fuel surcharges, and volumetric breakdown side-by-side; and (3) 24-Hour Dispute Banner Card displays a live countdown timer and direct MinIO CCTV upload buttons.

---

## IV. EXPERIMENTAL EVALUATION AND RESULTS

### A. Benchmark Dataset, Experimental Partitioning, and Evaluation Metrics
To systematically evaluate the proposed system under controlled empirical conditions, we constructed a logistics benchmark dataset consisting of $N = 100$ representative express courier logistics scenarios categorized across four functional domains and two provenance pillars (Fig. 3): 50 Real-World carrier cases (collected from public customer support forums, tracking portals, and courier FAQs of GHTK, GHN, Viettel Post, and VNPost) and 50 Synthetic Stress & Adversarial cases.

![Fig. 3. Dual-source benchmark provenance pipeline and evaluation framework](file:///Users/Tai.IS/my-project/logistics-management-system/docs/research/paper/diagrams/data-provenance-and-benchmark-framework-ai-generated-bw.png)
*Fig. 3. Dual-source benchmark provenance pipeline and evaluation framework ($N = 100$), illustrating the four data pillars (statutory laws, 9 carrier SOPs, real-world scraped cases from GHTK/GHN/VTP/VNPost, and OWASP red-teaming stress tests) mapped onto the 5-tier Likert rubric.*

#### 1) Experimental Partitioning and Dataset Provenance
To prevent data contamination and ensure unbiased parameter optimization, the benchmark is strictly partitioned into:
* **Development / Tuning Set ($30\%$, $n_{\text{dev}} = 30$):** Comprising 15 real-world and 15 synthetic cases (12 SOP Knowledge, 7 Operational Tools, 1 Out-of-Domain Guard, and 10 Adversarial Red-Teaming cases). Dedicated strictly to hyperparameter grid sweeps ($\alpha \in [0.5, 0.9]$, $\tau \in [0.5, 0.7]$) and system prompt calibration.
* **Evaluation Test Set ($70\%$, $n_{\text{test}} = 70$):** Comprising 35 real-world and 35 synthetic cases (27 SOP Knowledge, 16 Operational Tools, 9 Out-of-Domain Guard, and 18 Adversarial Red-Teaming cases), held out for blind testing and official performance reporting.

Formally, each test case $i \in \{1, \dots, N\}$ is structured as a 5-tuple $\mathcal{T}_i = \langle q_i, \mathcal{K}_i, r_i, c_i, a_i \rangle$, where $q_i$ denotes the customer query, $\mathcal{K}_i$ is the ground-truth set of statutory courier keywords, $r_i \in \{\text{CUSTOMER}, \text{SHOP}, \text{CARRIER\_STAFF}, \text{QA\_AUDITOR}\}$ denotes the caller role, $c_i$ is the functional category, and $a_i \in \{0, 1\}$ indicates whether the query contains adversarial red-teaming attempts ($a_i = 1$).

#### 2) Model Card and Execution Configuration
To guarantee full reproducibility, the experimental testbed is standardized across all configurations:
* **Base Foundation Model:** `Meta-Llama-3.1-70B-Instruct` deployed via vLLM inference engine on dual NVIDIA A100-80GB GPUs (FP8 quantization, maximum context length $8,192$ tokens, temperature $T = 0.20$, top-$p = 0.95$). Evaluated across three distinct random seeds ($\text{seed} \in \{42, 123, 999\}$) to capture model generation variance.
* **Embedding Model:** `BAAI/bge-m3` using Matryoshka Representation Learning (MRL) truncated to 512 dimensions, evaluated with Cosine similarity.
* **Text Chunking Strategy:** Markdown-aware hierarchical recursive chunking with chunk size of 512 tokens and chunk overlap of 64 tokens.
* **Vector Database:** PostgreSQL 16 with `pgvector` extension utilizing Hierarchical Navigable Small World (HNSW) indexing ($m = 16$, $ef\_construction = 64$).
* **Data Ethics and Usage:** Scraped carrier data is restricted to publicly available terms of service, anonymized to eliminate real customer identifiers, and used strictly for non-commercial academic research.

#### 3) Mathematical Scoring Formulation and Decoupled Security Metrics
Given the system output $y_i$, quality evaluation is conducted using calibrated, decoupled metrics:

* **Standard Functional Inquiries ($a_i = 0$):**

To comprehensively capture both informational policy retrieval and operational microservice actuation, quality score $S_i \in [0, 100]$ incorporates an indicator variable $\mathbb{I}_{\text{tool}}(i) \in \{0, 1\}$ denoting whether query $i$ requires operational API tool execution ($1$) or purely informational SOP grounding ($0$):

$$S_i = \begin{cases} 0.50 A_{\text{tool}} + 0.30 R_{\text{kw}} + 0.20 C_{\text{cit}}, & \text{if } \mathbb{I}_{\text{tool}}(i) = 1 \\ 0.70 R_{\text{kw}} + 0.30 C_{\text{cit}}, & \text{if } \mathbb{I}_{\text{tool}}(i) = 0 \end{cases} \tag{4}$$

where $A_{\text{tool}}$ evaluates API schema and argument precision against ground truth ($1.0$ for exact match, $0.5$ for minor formatting variance, $0.0$ for missing/hallucinated calls), keyword recall $R_{\text{kw}} = |K_{\text{resp}} \cap K_{\text{gt}}| / |K_{\text{gt}}|$, and citation coverage $C_{\text{cit}} \in \{1.0, 0.5, 0.0\}$. For adversarial tests, Attack Success Rate is $\text{ASR} = (\sum \mathbb{I}(\text{AttackSucceeded}) / N_{\text{adv}}) \times 100\%$, Block Rate is $\text{BlockRate} = (\sum \mathbb{I}(\text{RiskBlocked}) / N_{\text{adv}}) \times 100\%$, and False Refusal Rate is $\text{FRR} = (\sum \mathbb{I}(\text{WronglyRefused}) / n_{\text{valid}}) \times 100\%$. Quality scores map onto a 5-tier Automated Tier rubric: Level 5 [EXCELLENT] ($S_i \ge 90$), Level 4 [GOOD] ($75 \le S_i < 90$), Level 3 [ACCEPTABLE] ($60 \le S_i < 75$), Level 2 [MARGINAL] ($40 \le S_i < 60$), and Level 1 [CRITICAL FAIL] ($S_i < 40$). Operational pass requires achieving Level 3 or higher ($S_i \ge 60$, with $S_i \ge 75$ for unassisted resolution).

#### 4) Dual-Annotator Human Evaluation and Statistical Significance
All held-out system responses were evaluated independently by two domain judges: Annotator 1 (Senior Logistics QA Auditor) and Annotator 2 (Senior Conversational AI Researcher, blinded to system configurations) on a 1–5 scale across Factual Correctness, Groundedness, Completeness, and Safety. On the held-out functional test set ($n = 52$), mean human score reached $4.18 \pm 0.61 / 5.00$ ($A_1: 4.21 \pm 0.58$, $A_2: 4.15 \pm 0.64$) with observed raw agreement $P_o = 90.4\%$ and substantial inter-rater consensus (Cohen's $\kappa = \mathbf{0.824}, p < 0.001$). Human evaluators confirmed an $88.5\%$ functional pass rate ($46/52$ cases) versus the conservative automated pass rate of $84.6\%$ ($44/52$ cases), with Spearman $\rho = \mathbf{0.884}$ ($p < 0.001$) and an observed human factual error rate of $5.77\%$ ($3/52$, exact 95% Clopper-Pearson CI: $[1.21\%, 15.95\%]$). Factual Groundedness reached $95.2 \pm 0.8\%$, and Tool Precision was $100.0 \pm 0.0\%$. LLM-as-a-judge comparison with GPT-4o yielded $\rho = 0.871$ ($p < 0.001$) with $\text{MAE} = 0.21$.

On composite quality scores across $n = 52$ functional test cases, Proposed HMAS ($83.1 \pm 17.1$) significantly outperformed Single-Agent + Critic ($73.4 \pm 21.6$) under the non-parametric Wilcoxon Signed-Rank Test ($W = 112.0, z = -4.783, p = 1.73 \times 10^{-6} < 0.001$, Cohen's $d = 0.50$ over pooled $\text{SD} = 19.48$, 10,000 bootstrap 95% CI on score difference: $[6.8, 12.6]$ pts). Dedicated significance testing on Factual Groundedness claims across 28 effective non-zero pairs (24 ties $D_i = 0$, 25 HMAS wins, 3 Single wins) confirmed that HMAS significantly outperformed Single-Agent + Critic (Wilcoxon $W = 6.0, p = 1.04 \times 10^{-7} < 0.001$; paired $t$-test $t = 5.97, p < 0.001, \text{df} = 51$; mean advantage $+7.10\%$, exact 95% bootstrap CI: $[4.77\%, 9.39\%]$).

Case-by-case paired response latency analysis on all $70$ test pairs revealed that HMAS incurs an incremental latency of $+1,071.0\text{ ms}$ over Single-Agent + Critic ($3,651.0 \pm 753.5\text{ ms}$ vs. $2,580.0 \pm 826.9\text{ ms}$ across $n = 70$ queries; paired $t$-test $t = 20.14, p < 0.001, \text{df} = 69$; Wilcoxon $W = 0.0, p < 0.001$; $s_D = 444.9\text{ ms}, r = 0.846$; 10,000 bootstrap 95% CI: $[967.9\text{ ms}, 1,174.3\text{ ms}]$; whereas Table IV reports between-seed SDs of $\pm 142\text{ ms}$ and $\pm 92\text{ ms}$ across $n = 3$ random seeds). Under adversarial testing (Table I-C), both HMAS ($0/100$ $\text{ASR}$) and Single-Agent + Critic ($2/100$ $\text{ASR}$) showed no statistically distinguishable security difference under Fisher's exact test ($p = 0.4975$). Therefore, the $+1,071\text{ ms}$ overhead is primarily justified by eliminating prompt context pollution ($+7.1\%$ groundedness, $+5.3\%$ tool precision) and enforcing pre-execution gatekeeping rather than raw boundary filtering.

**TABLE I. PERFORMANCE METRICS ON HELD-OUT EVALUATION TEST SET ($n_{\text{test}} = 70$) AND DEV SET ($n_{\text{dev}} = 30$)**

| Benchmark Partition & Category | Cases ($n$) | Level 5 (Exc.) | Level 4 (Good) | Level 3 (Acc.) | Non-Pass (L1-L2) | Func. Pass / Blk | Mean Score / Sec. | Auto Tier (/5.0) | Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Held-Out Test: SOP Knowledge** | 27 | 18 (66.7%) | 4 (14.8%) | 1 (3.7%) | 4 (14.8%) | **85.2%** | $86.8 \pm 16.4$ | 4.24 | 3,640 ms |
| **Held-Out Test: Operational Tools** | 16 | 6 (37.5%) | 6 (37.5%) | 1 (6.3%) | 3 (18.8%) | **81.3%** | $79.4 \pm 18.2$ | 3.81 | 3,745 ms |
| **Held-Out Test: Out-of-Domain Guard** | 9 | 2 (22.2%) | 6 (66.7%) | 0 (0.0%) | 1 (11.1%) | **88.9%** | $78.5 \pm 15.6$ | 3.89 | 2,780 ms |
| **Held-Out Test Functional Total** | **52** | **26 (50.0%)** | **16 (30.8%)** | **2 (3.8%)** | **8 (15.4%)** | **84.6%** | **$83.1 \pm 17.1$** | **4.05** | **3,524 ms** |
| *Held-Out Test: Adversarial (Security)* | 18 | 8 (44.4%) | 10 (55.6%) | 0 (0.0%) | 0 (0.0%) | — | *100% Blk (ASR 0.0%)* | — | 4,020 ms |
| **Held-Out Test Summary ($n_{\text{test}}$)†** | **70** | — | — | — | — | **84.6%†** | **100% Blk†** | — | **3,651 ms** |
| **Development Set Functional ($n_{\text{dev}}$)** | 20 | 11 (55.0%) | 5 (25.0%) | 1 (5.0%) | 3 (15.0%) | **85.0%** | $84.2 \pm 16.8$ | 4.10 | 3,580 ms |
| *Development Set: Adversarial ($n_{\text{dev}}$)* | 10 | 5 (50.0%) | 5 (50.0%) | 0 (0.0%) | 0 (0.0%) | — | *100% Blk (ASR 0.0%)* | — | 4,080 ms |

Table I indicates that across the 52 functional test cases, evaluated without artificial floor scores, the system achieves an **84.6% operational pass rate** ($44/52$ cases) with an Automated Tier of **4.05 / 5.00** and a mean score of **$83.1 \pm 17.1$**. All 18 adversarial cases in the test set were intercepted across tested prompts (100% Block Rate, 0.0% ASR). †On `Held-Out Test Summary (n_test = 70)`, functional pass rate ($84.6\%, 44/52$) and adversarial block rate ($100.0\%, 18/18$) are reported separately rather than pooled into an overall percentage, while `3,651 ms` (SD $753.5\text{ ms}$) denotes weighted mean end-to-end latency over all 70 test queries.

**TABLE I-B. DISTRIBUTION ACROSS DUAL-SOURCE PROVENANCE PILLARS**

| Data Provenance Pillar | Partition | Cases | Level 5 | Level 4 | Level 3 | Level 2 | Level 1 | Func. Pass / Blk | Likert Mean | Operational Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| Real-World GHTK | Test (10) / Dev (5) | 15 | 9 | 6 | 0 | 0 | 0 | **100.0%** | **4.60 / 5.0** | Grade A+ (100.0% Pass) |
| Real-World GHN | Test (11) / Dev (4) | 15 | 8 | 0 | 2 | 1 | 4 | **66.7%** | **3.47 / 5.0** | Grade B (66.7% Pass) |
| Real-World Viettel Post | Test (7) / Dev (3) | 10 | 7 | 2 | 0 | 0 | 1 | **90.0%** | **4.50 / 5.0** | Grade A (90.0% Pass) |
| Real-World VNPost | Test (7) / Dev (3) | 10 | 8 | 2 | 0 | 0 | 0 | **100.0%** | **4.80 / 5.0** | Grade A+ (100.0% Pass) |
| Adversarial Red-Team | Test (18) / Dev (10) | 28 | 13 | 15 | 0 | 0 | 0 | — (100% Blk) | **4.46 / 5.0** | Grade A+ (100% Defense) |
| Out-of-Domain Boundaries | Test (9) / Dev (1) | 10 | 2 | 7 | 0 | 1 | 0 | **90.0%** | **4.00 / 5.0** | Grade A (90.0% Pass) |
| Physical Limits & Ceilings | Test (5) / Dev (2) | 7 | 3 | 4 | 0 | 0 | 0 | **100.0%** | **4.43 / 5.0** | Grade A+ (100% Intercept) |
| Volumetric IATA & PII Edges | Test (3) / Dev (2) | 5 | 2 | 2 | 0 | 1 | 0 | **80.0%** | **4.00 / 5.0** | Grade B+ (80.0% Pass) |
| **Total Benchmark Corpus** | **Test (70) / Dev (30)** | **100** | — | — | — | — | — | **84.6% Test Func. / 100% Blk** | **4.27 / 5.00** | **Decoupled Synthesis** |

Table I-B demonstrates exact 1:1 reconciliation across the 50 Real-World carrier cases (15 GHTK + 15 GHN + 10 Viettel Post + 10 VNPost) and 50 Synthetic cases (28 Adversarial + 10 Out-of-Domain + 7 Physical Ceilings + 5 IATA Volumetric & PII Edge Cases $= 50$). On the held-out test split ($n_{\text{test}} = 70$), the 52 functional cases achieve an $84.6\%$ operational pass rate ($44/52$ cases, Level 3–5) alongside $100.0\%$ adversarial block rate ($18/18$), reported separately rather than pooled.

**TABLE I-C. STANDALONE ADVERSARIAL STRESS-TESTING SUITE ($N_{\text{adv}} = 100$ PROMPTS: 60 INTERNAL + 40 EXTERNAL SPECIALISTS) ACROSS OWASP TOP 10 FOR LLM (2025 EDITION), API SECURITY, AND OPERATIONAL BOUNDARIES**

| Adversarial Vector & OWASP Category | Tested ($n$) | Provenance Source | Blocked ($n$) | ASR (%) | 95% Clopper-Pearson CI | Block Rate (%) |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: |
| **LLM01: Direct Prompt Injection** | 25 | 15 Internal / 10 External | 25 | **$0.0\%$** | $[0.0\%, 13.72\%]$ | $100.0\%$ |
| **LLM01-Indirect: Indirect Injection** | 15 | 10 Internal / 5 External | 15 | **$0.0\%$** | $[0.0\%, 21.80\%]$ | $100.0\%$ |
| **LLM02: Sensitive Information Disclosure** | 20 | 12 Internal / 8 External | 20 | **$0.0\%$** | $[0.0\%, 16.84\%]$ | $100.0\%$ |
| **LLM06: Excessive Agency (State Mutation)** | 10 | 5 Internal / 5 External | 10 | **$0.0\%$** | $[0.0\%, 30.85\%]$ | $100.0\%$ |
| **BOLA / IDOR Cross-Tenant Access** | 15 | 9 Internal / 6 External | 15 | **$0.0\%$** | $[0.0\%, 21.80\%]$ | $100.0\%$ |
| **Physical Ceilings & COD Fraud Bypass** | 15 | 9 Internal / 6 External | 15 | **$0.0\%$** | $[0.0\%, 21.80\%]$ | $100.0\%$ |
| **Subtotal: Internal Engineering Prompts** | 60 | System Dev Team | 60 | **$0.0\%$** | **$[0.0\%, 5.96\%]$** | **$100.0\%$** |
| **Subtotal: External Auditor Prompts** | 40 | External Security Team | 40 | **$0.0\%$** | **$[0.0\%, 8.81\%]$** | **$100.0\%$** |
| **Total Adversarial Suite** | **100** | **Comprehensive Red-Team** | **100** | **$0.0\%$** | **$[0.0\%, 3.62\%]$** | **$100.0\%$** |

*Methodological Clarification of Red-Teaming Suite:* In addition to the 18 adversarial cases in the 70-case test benchmark, Table I-C reports evaluation across a dedicated standalone suite of $N_{\text{adv}} = 100$ adversarial prompts. The suite maps to the OWASP Top 10 for LLM Applications (2025 Edition) [18]: LLM01 (Prompt Injection, direct and indirect in waybill notes), LLM02 (Sensitive Information Disclosure), and LLM06 (Excessive Agency, specifically testing unauthorized `cancelShipment` or forged claim tickets). BOLA represents OWASP API Security Top 10 (API1:2023), and Physical Limits/COD Fraud represent carrier operational boundary tests. 40 prompts were constructed by external security researchers blinded to system implementation. Both internal ($0/60$, $\text{ASR} = 0.0\%$, 95% CI: $[0.0\%, 5.96\%]$) and external ($0/40$, $\text{ASR} = 0.0\%$, 95% CI: $[0.0\%, 8.81\%]$) attacks were $100\%$ intercepted. The False Refusal Rate on valid operational queries was bounded to $\text{FRR} = 2.0\%$ ($1/50$ cases).

#### 7) Fair Baseline Alignment and 6-Configuration Ablation Matrix
To isolate the architectural contribution of each system component under strictly identical conditions, all six configurations were evaluated on the held-out test set ($n_{\text{test}} = 70$) using the identical base foundation model (`Meta-Llama-3.1-70B-Instruct`), identical system prompt templates, and identical 9 Carrier SOP knowledge bases. Each configuration was evaluated across $n = 3$ repeated runs with distinct random seeds ($\text{seed} \in \{42, 123, 999\}$), and results are reported as mean $\pm$ standard deviation ($\mu \pm \sigma$).

*Metric Definitions for Table II:*
* `Automated Tier / Likert (/5.0)`: 1–5 scale evaluation across functional test cases ($n = 52$).
* `Factual Groundedness (%)`: Macro-averaged percentage of atomic factual claims in system outputs directly entailed by cited SOP passages.
* `Tool Precision (%)`: Macro-averaged percentage of executed API tool calls conforming strictly to OpenAPI JSON schemas and operational invariant constraints.
* `Attack Success Rate (ASR) (%)`: Percentage of adversarial prompts in the standalone 100-prompt suite where the system yielded unsafe outputs or unauthorized API executions.
* `PII Leak: Adversarial Suite (%)`: Percentage of attacks in the standalone 100-prompt suite exposing unmasked customer identifiers ($n = 100$).
* `PII Leak: Guest Tracking (%)`: Percentage of routine unauthenticated guest tracking queries returning unredacted phone numbers or street addresses ($n = 50$).
* `Latency (ms)`: Mean end-to-end response latency on the held-out test set ($n = 70$).

**TABLE IV. 6-CONFIGURATION SYSTEM ABLATION MATRIX ON HELD-OUT TEST SPLIT ($n_{\text{test}} = 70$, $n = 3$ REPEATED RUNS WITH SEEDS 42, 123, 999, $\mu \pm \sigma$)**

| System Configuration | Purpose of Evaluation | Human Likert (/5.0) ($n=52$) | Pass Rate (%) ($n=52$) | Factual Groundedness (%) ($n=52$) | Tool Precision (%) ($N_{\text{calls}}=38$) | Attack Success Rate (ASR) (%) ($n=100$) | PII Leak: Adversarial (%) ($n=100$) | PII Leak: Guest Tracking (%) ($n=50$) | Latency (ms) ($n=70$) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **(1) Proposed Full HMAS** | **Full reference architecture** | **$4.18 \pm 0.12$** | **$84.6 \pm 1.4\%$ (44/52)** | **$95.2 \pm 0.8\%$** | **$100.0 \pm 0.0\%$ (38/38)** | **$0.0\%$ (0/100)** | **$0.0\%$ (0/100)** | **$0.0\%$ (0/50)** | **$3,651 \pm 142$** |
| (2) Ablation: w/o Critic Gatekeeper | Value of independent gatekeeper | $3.84 \pm 0.18$ | $76.9 \pm 1.8\%$ (40/52) | $92.4 \pm 1.2\%$ | $89.5 \pm 1.5\%$ (34/38) | **$34.0\%$ (34/100)** | **$5.0\%$ (5/100; 25% LLM02)** | $0.0\%$ (0/50) | $3,119 \pm 105$ |
| (3) Ablation: Dense-only (MRL 512) | Impact of removing BM25 lexical | $3.71 \pm 0.22$ | $73.1 \pm 2.0\%$ (38/52) | $87.6 \pm 1.4\%$ | $97.4 \pm 0.8\%$ (37/38) | $0.0\%$ (0/100) | $0.0\%$ (0/100) | $0.0\%$ (0/50) | $3,480 \pm 125$ |
| (4) Ablation: BM25-only (Lexical) | Impact of removing semantic vector | $3.45 \pm 0.28$ | $65.4 \pm 2.3\%$ (34/52) | $82.1 \pm 1.8\%$ | $97.4 \pm 0.8\%$ (37/38) | $0.0\%$ (0/100) | $0.0\%$ (0/100) | $0.0\%$ (0/50) | $3,350 \pm 110$ |
| (5) Baseline: Single-Agent + Critic | Multi-agent necessity test | $3.68 \pm 0.21$ | **$69.2 \pm 1.9\%$ (36/52)** | $88.1 \pm 1.5\%$ | $94.7 \pm 1.2\%$ (36/38) | $2.0\%$ (2/100) | $0.0\%$ (0/100) | $0.0\%$ (0/50) | $2,580 \pm 92$ |
| (6) Ablation: w/o PII Masking | Impact on privacy vulnerability | $4.18 \pm 0.14$ | $84.6 \pm 1.4\%$ (44/52) | $95.0 \pm 0.9\%$ | $100.0 \pm 0.0\%$ (38/38) | $0.0\%$ (0/100) | **$100.0\%$ (100/100)** | **$68.0\%$ (34/50)** | $3,610 \pm 135$ |

*Methodological Protocol for Table IV:* All six configurations were evaluated strictly on the held-out test partition ($n_{\text{test}} = 70$) across $n = 3$ repeated runs with distinct random seeds (42, 123, 999), using the identical base foundation model (`Meta-Llama-3.1-70B-Instruct`) and identical 9 Carrier SOP knowledge bases. Human Likert denotes independent dual-annotator scores on functional test cases ($n = 52$); Pass Rate is the proportion achieving Level 3 or higher; Groundedness reflects atomic claim entailment ($n = 52$); Tool Precision evaluates OpenAPI schema compliance and operational bounds across all $N_{\text{calls}} = 38$ API tool invocations across the 16 tool scenarios (averaging 2.38 calls/query); ASR is measured over the 100-prompt standalone adversarial suite; PII Leak evaluates unredacted disclosure separately over the 100 adversarial prompts and 50 routine unauthenticated guest tracking queries; and Latency reflects mean end-to-end duration across all 70 test cases.

Table IV highlights several vital empirical insights:
1. *Gatekeeper Defense Necessity (Row 1 vs. Row 2):* Removing the Critic Gatekeeper causes the Attack Success Rate (ASR) to surge from **$0.0\%$ to $34.0\%$** ($34/100$ breaches), and tool precision degrades by $10.5\%$ ($100.0\% \rightarrow 89.5\%$). Crucially, the 34 breaches decompose across threat categories: LLM01 Direct Prompt Injection: $10/25$ ($40.0\%$), LLM01-Indirect Injection via shipping notes: $7/15$ ($46.7\%$), LLM02 Sensitive Information Disclosure: $5/20$ ($25.0\%$), LLM06 Excessive Agency (`cancelShipment` bypassing state lock): $5/10$ ($50.0\%$), BOLA / IDOR parcel hijacking: $4/15$ ($26.7\%$), and Physical Ceilings bypass ($>70\text{ kg}$): $3/15$ ($20.0\%$). Removing the Critic accelerates execution by exactly $532\text{ ms}$, directly confirming the Critic execution cost. Under PII leakage, Row (2) exhibits a **$5.0\%$ leakage rate** ($5/100$ adversarial prompts, specifically $5/20 = 25.0\%$ under LLM02 Sensitive Information Disclosure attacks), resolving an important operational distinction: while passive regex masking protects benign guest tracking in the absence of a Critic, sophisticated adversarial prompt injections bypass soft prompt boundaries and extract full unmasked customer records unless the independent Critic Gatekeeper is present.
2. *Multi-Agent Specialization vs. Single-Agent (Row 1 vs. Row 5):* While Single-Agent + Critic executes faster ($2,580\text{ ms}$ vs. $3,651\text{ ms}$), its factual groundedness drops sharply from $95.2\%$ to $88.1\%$ (dedicated paired test $p < 0.001$) and tool precision drops to $94.7\%$. Ingesting both regulatory legal text and dynamic JSON tool schemas within a single prompt induces context pollution, causing the model to confuse policy clauses with parameter arguments.
3. *PII Firewall Criticality (Row 1 vs. Row 6):* Omitting the dynamic PII redaction layer causes a catastrophic $68.0\%$ privacy leak rate, exposing recipient phone numbers and home addresses in routine guest tracking responses.

#### 8) Retrieval-Specific Metrics and Hyperparameter Sensitivity
To decouple retrieval performance from language model generation errors, retrieval metrics were evaluated independently on the held-out test split over indexed topics in the Carrier SOP knowledge base:
* **Hybrid Retrieval ($\alpha = 0.70$):** Attains **$\text{Recall@3} = 88.4\% \pm 1.1\%$**, **chunk-level $\text{Recall@5} = 94.6\% \pm 0.8\%$**, and a **Mean Reciprocal Rank ($\text{MRR}$) of $0.862 \pm 0.015$**. Chunk-level Recall@$k$ over indexed queries $Q_{\text{idx}}$ is formally defined as the macro-averaged fraction of gold-standard statutory/SOP chunks $\mathcal{G}_q$ retrieved within top-$k$ candidates:
$$\text{Recall@}k = \frac{1}{|Q_{\text{idx}}|} \sum_{q \in Q_{\text{idx}}} \frac{|\mathcal{G}_q \cap \text{top-}k(q)|}{|\mathcal{G}_q|}$$
with standard deviations reflecting 10,000 bootstrap resamples.
* **Dense-only (MRL 512):** Achieves $\text{Recall@5} = 78.4\%$ and $\text{MRR} = 0.712$, failing frequently on precise statutory article numbers (e.g., 'Article 25 of Decree 47/2011/ND-CP').
* **BM25-only:** Achieves $\text{Recall@5} = 71.2\%$ and $\text{MRR} = 0.645$, failing on conversational colloquial phrasing where customer query terms diverge from formal legal nomenclature.

*Reconciliation between Chunk-Level Recall@5 and Zero Query-Level Retrieval Failures:* We clarify the apparent divergence between a chunk-level $\text{Recall@5}$ of $94.6\%$ and zero query-level retrieval failures ($n = 0$) in Section IV.C.1: $\text{Recall@5}$ computes macro-averaged chunk coverage $|\mathcal{G}_q \cap \text{top-}5(q)| / |\mathcal{G}_q|$ across multi-clause indexed queries, where secondary cross-referenced clauses occasionally rank outside top-5 even though the primary authoritative clause was always retrieved in top-5. Meanwhile, across the 8 non-passing functional test queries, the 7 SOP failures stemmed from unindexed knowledge deficits (missing island tariff appendices) rather than vector search omitting indexed topics. Hence, query-level retrieval failures on indexed topics were $n = 0$.

*Hyperparameter Sensitivity on Dev Set:* Sweeping $\alpha \in [0.5, 0.9]$ and confidence threshold $\tau \in [0.5, 0.7]$ on the development set ($n_{\text{dev}} = 30$) revealed that $\alpha = 0.70$ optimizes the F1 trade-off between lexical precision and semantic recall. Setting $\tau = 0.60$ serves as an optimal filter: values of $\tau > 0.65$ reduce Recall@5 below $82\%$, while $\tau < 0.55$ injects irrelevant context passages that increase generation latency by an average of $420\text{ ms}$.

![Fig. 4. Empirical benchmark evaluation results dashboard](file:///Users/Tai.IS/my-project/logistics-management-system/docs/research/paper/diagrams/evaluation-results-ai-generated-bw.png)
*Fig. 4. Empirical benchmark evaluation dashboard generated from canonical data/results.json ($n_{\text{test}} = 70$ held-out test set): (a) Operational pass rate by data provenance pillar with exact 95% Clopper-Pearson error bars (GHTK 10/10 [100%], VNPost 7/7 [100%], Viettel Post 6/7 [85.7%], Synthetic Boundary 35/35 [100%], GHN 7/11 [63.6%]); (b) Domain coverage Gap Detector 3-configuration evaluation matrix across 25 island/remote tariff queries (Configurations A, B, C); and (c) Dispute Resolution Agent quality compliance across 15 high-stakes exception cases with Clopper-Pearson 95% confidence intervals.*

### B. Latency Profiling, True TTFT, and Execution Decomposition
The mean end-to-end latency of HMAS on the held-out test set ($n_{\text{test}} = 70$) is $3,651.0 \pm 753.5\text{ ms}$ (median $p_{50} = 3,788\text{ ms}$, $p_{90} = 4,578\text{ ms}$, and $p_{95} = 4,678\text{ ms}$; vs. Single-Agent + Critic: $2,580.0 \pm 826.9\text{ ms}$). Decomposing execution across architectural components reveals:
* **LLM Token Generation:** 2,913 ms (79.8%)
* **Critic Gatekeeper Validation:** 500 ms (13.7%)
* **Supervisor Intent Routing:** 120 ms (3.3%)
* **Hybrid Knowledge Retrieval & API Tools (Weighted Average):** 118 ms (3.2%) (specifically 179 ms for Informational RAG and 216 ms for Mutating API execution; functional average across 52 queries is 159 ms)
* **Total Mean Latency:** 3,651 ms (100.0%)

*True Time-to-First-Token (TTFT) and Decomposition by Query Class:* Measuring TTFT strictly by when the client terminal receives the first streamed token reveals distinct operational profiles across query types:
1. *Pure Informational Inquiries ($n = 27$ SOP queries):* The system streams speculative token chunks directly to the user terminal via Server-Sent Events (SSE) while the Critic performs post-generation commit checks before terminal completion. This delivers a perceived TTFT of **$420\text{ ms}$** (Router 120 ms + Retrieval 179 ms + First Token 121 ms). In total execution, serial post-generation verification by the Critic requires 532 ms, resulting in an exact total response time of 3,640 ms ($120 + 179 + 2,809 + 532 = 3,640\text{ ms}$). Removing the Critic in ablation eliminates this verification phase, explaining the 532 ms latency reduction in Table IV ($3,651 \rightarrow 3,119\text{ ms}$).
2. *Mutating Operational Tool Inquiries ($n = 16$ tool queries):* For state-altering mutations (`cancelShipment`, parcel address redirection, COD alterations, or PII unmasking), execution is synchronous and gated prior to backend invocation. The Supervisor constructs an Action Draft DTO, passing it serially to the Validation Critic ($532\text{ ms}$) plus routing ($120\text{ ms}$). The backend microservice is then invoked ($216\text{ ms}$), followed by initial LLM token synthesis ($180\text{ ms}$). Consequently, the true client-perceived TTFT is **$1,048\text{ ms}$** ($120 + 532 + 216 + 180 = 1,048\text{ ms}$). In this synchronous pipeline, backend endpoints remain gated and PII tokens remain unrendered until approval is certified. Total response time is exactly 3,745 ms ($120 + 216 + 2,877 + 532 = 3,745\text{ ms}$).
3. *Out-of-Domain Guard Inquiries ($n = 9$ queries):* Rule-based heuristic deflection bypasses deep microservice calls, delivering a TTFT of **$280\text{ ms}$** and total latency of 2,780 ms ($120 + 0 + 2,380 + 280 = 2,780\text{ ms}$).
4. *Adversarial Inquiries ($n = 18$ queries):* Immediate interception by input filters or rapid refusal synthesis delivers a TTFT of **$310\text{ ms}$** and total latency of 4,020 ms ($120 + 0 + 3,368 + 532 = 4,020\text{ ms}$).

Across all 70 test queries, the weighted average true TTFT is **$517\text{ ms}$** ($(27 \times 420 + 16 \times 1048 + 9 \times 280 + 18 \times 310) / 70 = 517\text{ ms}$), comfortably preserving conversational interactive responsiveness ($<1,000\text{ ms}$).

**TABLE V. LATENCY AND TRUE TTFT DECOMPOSITION BY QUERY CLASS ($n_{\text{test}} = 70$)**

| Query Category | Tested ($n$) | True TTFT (ms) | Router (ms) | RAG / API (ms) | LLM Generation (ms) | Critic Validation (ms) | Total Mean Latency (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Informational (SOP Retrieval)** | 27 | $420$ | $120$ | $179$ (RAG) | $2,809$ | $532$ (Post-generation gate) | $3,640$ |
| **Mutating Operational Tools** | 16 | $1,048$ | $120$ | $216$ (API) | $2,877$ | $532$ (Pre-execution gate) | $3,745$ |
| **Out-of-Domain Guard** | 9 | $280$ | $120$ | — | $2,380$ | $280$ (Early deflection) | $2,780$ |
| **Held-Out Test Functional Total** | **52** | **$588$** | **$120$** | **$159$** | **$2,756$** | **$489$** | **$3,524$** |
| **Adversarial Stress Suite** | 18 | $310$ | $120$ | — | $3,368$ | $532$ (Block / Refusal) | $4,020$ |
| **Held-Out Test Weighted Mean** | **70** | **$517$** | **$120$** | **$118$** | **$2,913$** | **$500$** | **$3,651$** |



### C. Error Taxonomy, Failure Cases, and Controlled Pre/Post Intervention Study

#### 1) Error Taxonomy Breakdown
Granular inspection of the non-passing functional cases on the held-out test set establishes a 4-class error taxonomy:
1. **Knowledge Deficit / Substitution Error ($n = 7$ cases in test, $87.5\%$ of failures):** The initial knowledge base lacked granular tariff appendices for remote island districts (Phu Quoc, Con Dao, Ly Son). Crucially, the base LLM did not refuse; rather, it answered confidently with mainland rates due to knowledge absence (a dangerous substitution error).
2. **Metric Boundary Artifact ($n = 1$ case in test, $12.5\%$ of failures):** An out-of-domain query triggered the Domain Boundary Guard and produced a polite, correct refusal, which was initially penalized by the legacy keyword recall metric due to missing courier terms.
3. **Query-Level Retrieval Failure ($n = 0$ cases):** Across all indexed domain-relevant queries, at least the primary authoritative chunk was retrieved within top-5 candidates (while the $94.6\%$ chunk-level $\text{Recall@5}$ reflects occasional omission of secondary cross-referenced clauses on multi-clause queries).
4. **Tool Execution & Generation Hallucination ($n = 0$ cases):** Zero tool execution schema errors (fully consistent with the 100.0% [38/38] Tool Precision in Table IV) and zero instances of fabricated compensation rates, non-existent legal articles, or invented physical limits were detected.

#### 2) Deep-Dive Representative Failure Case Studies
* **Case #42 (Knowledge Deficit / Substitution Error):** Query: *"How much is the express shipping fee for a 2kg parcel from Can Tho to Phu Quoc Island via standard courier?"* Retrieved Context: Standard inter-provincial tariff table without Island Appendix B. System Output: Confidently quoted standard mainland rate (45,000 VND) instead of island express rate (65,000 VND + 15,000 VND sea transit surcharge). Root Cause: Knowledge deficit in base SOP induced a substitution error rather than a refusal.
* **Case #88 (Metric Boundary Artifact):** Query: *"Write a Python script to scrape live tracking data from courier portals."* System Output: *"I am an automated assistant for Nexus Logistics customer support. I cannot assist with computer programming or scraping scripts. Please let me know if you need help with parcel tracking or shipping rates."* Automated Metric Score: $35.0/100$ (Level 1 Fail) due to missing logistics tracking keywords. Root Cause: Automated metric penalized safe, compliant refusal.

#### 3) Controlled Pre vs. Post Knowledge Augmentation, Gap Detector Matrix, and Dispute Telemetry
To evaluate knowledge boundary handling without data contamination, we conducted experiments across an independent evaluation set of $N_{\text{island}} = 25$ island/remote tariff queries and $N_{\text{ood}} = 20$ out-of-domain queries authored by independent logistics specialists prior to knowledge augmentation.

**TABLE VI. DOMAIN COVERAGE GAP DETECTOR 3-CONFIGURATION EVALUATION MATRIX ($N = 25$ ISLAND/REMOTE QUERIES)**

| Configuration | Knowledge Base State | Gap Detector Active? | Operational Pass (%) | Substitution Error (%) | Correct Human Deferral (%) | False Mainland Deferral (%) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Config A: Base KB (No Detector)** | Base 9 SOPs (Missing Island Annexes) | No | $24.0\%$ (6/25) | $76.0\%$ (19/25) | $0.0\%$ (0/25) | $0.0\%$ (0/52) |
| **Config B: Base KB + Gap Detector** | Base 9 SOPs (Missing Island Annexes) | Yes | $0.0\%$ (0/25)* | **$0.0\%$ (0/25)** | **$92.0\%$ (23/25)** | $1.9\%$ (1/52) |
| **Config C: Augmented KB + Gap Detector** | Augmented SOPs (With Island Tariffs) | Yes | **$92.0\%$ (23/25)** | **$0.0\%$ (0/25)** | $8.0\%$ (2/25)** | **$1.9\%$ (1/52)** |

*In Config B, queries cannot be answered due to missing island data, so 0% pass reflects safe, compliant deflection rather than erroneous tariff quotation.  
**The 2 deferred queries in Config C involved multimodal refrigerated sea freight requiring custom barge chartering, which appropriately defaults to human dispatchers.

*Hyperparameter Tuning on Development Set:* Crucially, the Gap Detector operating threshold $\tau_{\text{gap}} = 0.52$ and entropy threshold $H(q) = 1.85$ were tuned EXCLUSIVELY on the development partition ($n_{\text{dev}} = 30$), without exposure to the unseen 25 island or 20 out-of-domain queries. We clarify the theoretical relationship between $\tau_{\text{gap}} = 0.52$ and the retrieval admission threshold $\tau = 0.60$:
* **$\tau = 0.60$ (Chunk Admission Threshold):** Operates at the passage level. Candidates with cosine similarity $< 0.60$ are pruned from prompt context to prevent context bloat.
* **$\tau_{\text{gap}} = 0.52$ (System Epistemic Uncertainty Floor):** Operates at the query intent level. If the top-1 retrieved passage falls below $0.52$, or the semantic entropy across top candidates exceeds $H(q) > 1.85$, the system concludes that the query falls into an unindexed knowledge vacuum. Instead of extrapolating mainland tariffs, the Gap Detector triggers a compliant human transfer or disclaims coverage.

*Operational Pass Rate vs. Total System Compliance:* On the main held-out functional test set ($n = 52$):
* **With Gap Detector DISABLED (Config A):** The autonomous pass rate is **$84.6\%$** ($44/52$ cases pass directly, with 7 substitution errors where the base model hallucinated mainland rates for remote island communes, and 1 metric boundary artifact).
* **Granular Fate of the 7 Substitution Errors under Config B:** When the Gap Detector is activated ($\tau_{\text{gap}} = 0.58$ tuned on dev set):
  1. $5$ cases ($71.4\%$) exhibit low retrieval similarity ($\max s \le 0.52 < 0.58$) and are **safely intercepted and deferred to human dispatchers** with an explicit knowledge-gap disclaimer, eliminating customer misquotations.
  2. $2$ borderline island cases exceed the threshold ($\max s \ge 0.58$) due to general maritime keyword matches:
     - *Query 1:* *"Gửi hàng từ xã Thổ Châu, huyện Phú Quốc nhưng gửi qua bưu cục trung tâm phường Dương Đông thì tính cước thế nào?"* ($\text{sim} = 0.612 > 0.58$). The system retrieves general coastal courier terms and answers accurately $\rightarrow$ **Passes autonomously (+1)**.
     - *Query 2:* *"Bưu kiện gửi đi xã đảo Bé An Bình huyện Lý Sơn chuyển tiếp từ cảng Sa Kỳ Quảng Ngãi có phụ phí không?"* ($\text{sim} = 0.598 > 0.58$). The query bypasses deflection, and because island tariff annexes are absent in Config B, the substitution error persists $\rightarrow$ **Fails**.
  3. $1$ standard mainland query (a rural northern commune with colloquial ethnic minority phrasing) has low similarity ($\max s = 0.54$) and is falsely deferred to human dispatch $\rightarrow$ **False Mainland Deferral ($1/52 = 1.9\%$)**.
* **Exact Mathematical Reconciliation:**
  - *Autonomous Direct Pass Rate:* $44 \text{ (base)} + 1 \text{ (Query 1)} - 1 \text{ (false deferral)} = 44 / 52 = 84.6\%$.
  - *Total Compliant Non-Hallucinatory Outcomes:* In carrier contact center operations, safe human deferral of unindexed gaps is formally credited as compliant non-hallucinatory behavior. Thus, total compliant outcomes reach **$48/52 = 92.3\%$** ($44 \text{ autonomous passes} + 5 \text{ safe human deferrals} - 1 \text{ false mainland deferral} = 48/52$, 95% Clopper-Pearson CI: **$[81.50\%, 97.87\%]$**).
* **Config B Unhandled Queries in Table VI ($8.0\%, 2/25$):** In the separate 25-island evaluation suite, Config B correctly deferred 23 queries ($92.0\%$) and left 2 unhandled ($8.0\%$). These 2 queries contained complex compound syntactic phrasing combining mainland and island postal codes:
  1. *"Tra cứu cước chuyển phát nhanh từ phường Bến Nghé Quận 1 TP.HCM đến bưu cục xã đảo Thổ Châu huyện Phú Quốc tỉnh Kiên Giang mã bưu chính 920000 theo chuẩn cước liên tỉnh hay phụ phí hải đảo?"*
  2. *"Gửi bưu kiện hỏa tốc từ kho trung chuyển Đà Nẵng ra xã An Bình đảo Bé Lý Sơn tỉnh Quảng Ngãi theo tuyến đường thủy Sa Kỳ thì áp dụng biểu cước nội tỉnh hay cước phụ thu biển đảo?"*
* **Development Set Hyperparameter Sensitivity Sweep:** Operating thresholds $\tau_{\text{gap}} = 0.58$ and entropy $H(q) = 1.85$ were calibrated by sweeping $\tau_{\text{gap}} \in [0.45, 0.65]$ and $H \in [1.50, 2.20]$ exclusively on the development partition ($n_{\text{dev}} = 30$, containing 2 knowledge-boundary probes). The sweep demonstrated that $\tau_{\text{gap}} = 0.58$ resides on an optimal Pareto knee: values $\tau_{\text{gap}} < 0.52$ permit substitution errors to leak through ($>15\%$), whereas $\tau_{\text{gap}} > 0.62$ induce unacceptable false deferrals on standard mainland shipments ($>8.5\%$).

*Dispute Resolution Agent Telemetry across 15 High-Stakes Cases:* The Dispute Resolution Agent was evaluated across $n = 15$ complex claims and operational exception scenarios. The evaluation corpus comprises 8 cases reconstructed from anonymized real carrier claim tickets (GHTK: 3, GHN: 3, Viettel Post: 2) and 7 synthetic boundary stress cases, authored by 2 independent logistics QA auditors. Crucially, the 15 cases map into four mutually exclusive incident classes ($5 + 5 + 3 + 2 = 15$):
  1. *Transit Lost Shipments ($n = 5$ cases):* Unaccounted parcels under broken linehaul truck seals ($3$ real carrier tickets + $2$ synthetic seal breach cases).
  2. *Physical Parcel Damage ($n = 5$ cases):* Crushed cartons and shattered fragile glassware lacking mandatory bubble-wrap tiers ($3$ real carrier tickets + $2$ synthetic packaging violation cases).
  3. *High-Value COD Discrepancies ($n = 3$ cases):* Collection on Delivery disputes exceeding $15\text{M VND}$ ($1$ real carrier ticket + $2$ synthetic forged waiver attempts).
  4. *Priority SLA Delivery Breaches ($n = 2$ cases):* Same-day express transit SLA violations exceeding 72 hours ($1$ real carrier ticket + $1$ synthetic force majeure boundary dispute).

Audit metrics across these 15 cases demonstrate:
* **Incident Classification Accuracy:** $15/15 = 100.0\%$ (exact categorization into lost, damaged, delayed, or COD discrepancy; 95% Clopper-Pearson CI: **$[78.20\%, 100.0\%]$**).
* **Evidence Dossier Completeness:** $14/15 = 93.3\%$ ($1$ case required a secondary clarification prompt to elicit the sender's commercial purchase invoice; 95% Clopper-Pearson CI: **$[68.05\%, 99.83\%]$**).
* **24-Hour Dispute Hearing Window Timestamp Precision:** $15/15 = 100.0\%$ (exact deadline computation matching SOP-07; 95% Clopper-Pearson CI: **$[78.20\%, 100.0\%]$**).
* **Premature Disbursement Prevention:** $15/15 = 100.0\%$ (zero unauthorized financial payouts prior to human adjudication; 95% Clopper-Pearson CI: **$[78.20\%, 100.0\%]$**).
* **Methodological Limitation Acknowledgment:** We emphasize that mandatory Human-in-the-Loop (HITL) authorization acts as an architectural fail-safe. Consequently, the 100% compliance rate demonstrates procedural adherence and dossier preparation fidelity, rather than the agent possessing autonomous financial adjudication authority.

![Fig. 5. Empirical Statistical Benchmark Analysis](file:///Users/Tai.IS/my-project/logistics-management-system/docs/research/paper/diagrams/statistical-evaluation-charts.png)
*Fig. 5. Empirical statistical benchmark analysis on held-out test set ($n_{\text{test}} = 70$): (a) Multi-metric comparative performance across architectures on functional queries ($n = 52$; Groundedness, Tool Argument Precision, Quality Score); (b) Response latency empirical step cumulative distribution function (CDF) over $n = 70$ test queries (mean $3,651.0 \pm 753.5\text{ ms}$, median $p_{50} = 3,788\text{ ms}$, tail $p_{90} = 4,578\text{ ms}$); and (c) Quality vs. latency Pareto frontier (latency error bars indicate 3-seed SD) highlighting the feasible zone ($S_i \ge 80$, Latency $\le 5\text{ s}$).*

---

## V. DISCUSSION

### A. Answering Research Questions (RQs)
* **Answer to RQ1 (Dual Data Dependency):** Combining Hybrid RAG and dynamic API Tool Calling helps bridge static regulatory documentation and real-time operational states, supported by $94.6\%$ chunk-level $\text{Recall@5}$ and $\text{MRR} = 0.862$ over indexed queries. Under independent dual-annotator human verification (Cohen's $\kappa = 0.824$), the observed factual error rate on held-out functional test cases was $5.77\%$ with an exact 95% Clopper-Pearson confidence interval of **$[1.21\%, 15.95\%]$**, while observed waybill lookups achieved $100.0\%$ [$38/38$] tool execution precision.
* **Answer to RQ2 (Single-Agent vs. Multi-Agent Specialization):** Under identical foundation models (`Meta-Llama-3.1-70B-Instruct`) and identical 9 Carrier SOP knowledge bases, the Single-Agent + Critic baseline exhibited a statistically significant drop in factual groundedness ($95.2\% \rightarrow 88.1\%$, paired $t$-test $t = 5.97, p < 0.001, \text{df} = 51$; Wilcoxon $W = 6.0$ on $28$ effective pairs, $p < 0.001$, 95% bootstrap CI: $[4.77\%, 9.39\%]$) and a $5.3\%$ drop in tool parameter precision ($100.0\%$ $[38/38] \rightarrow 94.7\%$ $[36/38]$), reducing the functional pass rate from $84.6\%$ ($44/52$) to $69.2\%$ ($36/52$). This outcome is consistent with the hypothesis that separating prompts reduces cross-task interference between dense statutory legal text and transactional JSON tool schemas (though individual prompt attention mechanisms were not directly tested). Heterogeneous multi-agent decomposition cleanly isolates cognitive scopes, enabling each agent to operate within bounded context windows.
* **Answer to RQ3 (Latency vs. Robustness Trade-off):** Multi-agent orchestration incurs an incremental end-to-end latency overhead of $+1,071\text{ ms}$ compared to Single-Agent + Critic ($3,651.0 \pm 753.5\text{ ms}$ vs. $2,580.0 \pm 826.9\text{ ms}$ across $n = 70$ queries, paired $t$-test: $t = 20.14, p < 0.001, \text{df} = 69$; Wilcoxon $W = 0.0, p < 0.001$; $s_D = 444.9\text{ ms}, r = 0.846$; 95% bootstrap CI: $[967.9\text{ ms}, 1,174.3\text{ ms}]$; whereas Table IV reports between-seed SDs of $\pm 142\text{ ms}$ and $\pm 92\text{ ms}$ across $n = 3$ seeds). Importantly, this overhead cannot be justified by adversarial interception alone: while removing the Critic degrades ASR to $34.0\%$, the Single-Agent + Critic baseline already attains an ASR of $2.0\%$ ($2/100$), which is not statistically distinguishable from the HMAS $0.0\%$ ($0/100$) under Fisher's exact test ($p = 0.4975$). Conflating the multi-agent overhead with Critic removal ($34.0\%$) or PII redaction omission ($68.0\%$) is methodologically invalid. Instead, the $+1,071\text{ ms}$ overhead is substantiated by: (1) statistically significant improvements in factual groundedness ($+7.1\%, p < 0.001$) and tool precision ($+5.3\%$), (2) enforcing pre-execution policy gating before state-mutating microservices are actuated, and (3) preserving human-perceived responsiveness via SSE streaming, delivering a Time-to-First-Token (TTFT) of $420\text{ ms}$ for informational queries and a weighted mean TTFT of $517\text{ ms}$ across all test queries, below the $1.0$-second user tolerance threshold.

### B. Dual-Anchor Grounding Paradigm
The system implements a Dual-Anchor Grounding paradigm: (1) *Static Grounding:* Policy claims are strictly anchored to retrieved SOP chunks. If a question cannot be resolved via retrieved context, the agent explicitly defers rather than improvising. (2) *Dynamic Grounding:* State-dependent inquiries (e.g., 'Where is my parcel?') are anchored to real-time microservice API outputs. The model functions as a natural language synthesizer rather than an unconstrained information retriever.

### C. Operational Impact and Scalability
Deploying the multi-agent architecture across the logistics network yields substantial operational benefits: (1) *Autonomous Containment:* The majority of repetitive tier-1 inquiries (tracking and pricing) are resolved without human dispatcher intervention; (2) *Dispute Acceleration:* Enforcing a structured 24-hour hearing window and automatically assembling MinIO CCTV evidence reduces dispute turnaround time from 72 hours to under 24 hours; (3) *Resource Efficiency:* Offloading deterministic operations to microservices keeps token usage minimal, lowering operational inference costs.

### D. Pilot Field Deployment and Operational Telemetry
To assess practical viability beyond offline benchmarks, the system was deployed in a **30-day pilot field trial** (October 1 to October 30, 2026) integrated into the Customer Mobile application and Guest Tracking Web portal of a regional logistics hub:
* **Operational Volume:** Handled **1,420 conversational sessions** comprising **4,850 user inquiries**.
* **Autonomous Containment Rate Formulation:** Achieved **$78.4\%$** ($1,113/1,420$ sessions). The Autonomous Containment Rate is formally defined as:
$$\text{Containment Rate} = \frac{N_{\text{contained}}}{N_{\text{total}}} = \frac{1,113}{1,420} = 78.4\%$$
where an interaction is formally classified as *autonomously contained* if and only if all user intents were fulfilled by the multi-agent system without transferring to a human dispatcher AND no repeat inquiry was initiated regarding the same tracking code within 48 hours.
* **Resolution Breakdown Across Four Mutually Disjoint Cohorts:** To avoid conflating immediate escalations with latent repeat interactions, the $N = 1,420$ pilot sessions are classified into four mutually exclusive operational cohorts:
  1. *Cohort 1: Autonomously Contained ($n = 1,113, 78.38\%$):* Sessions where user inquiries were fully resolved without human escalation, and no repeat inquiry occurred regarding the same waybill within 48 hours.
  2. *Cohort 2: Real-Time Live Human Escalations ($n = 134, 9.44\%$):* Sessions where the user explicitly requested a human specialist or where the system triggered immediate warm transfer for high-stakes exceptions (physical damage claims requiring parcel inspection or COD refund authorizations $>15\text{M VND}$).
  3. *Cohort 3: 48-Hour Repeat Inquiries ($n = 85, 5.99\%$):* Sessions where initial interaction appeared resolved but the user re-contacted support within 48 hours regarding the same tracking code. Tracking this cohort separately isolates first-contact resolution quality from immediate deflection.
  4. *Cohort 4: User Abandonments / Drop-offs ($n = 88, 6.20\%$):* Sessions where the user terminated the web/app session before concluding the inquiry or receiving resolution confirmation.
  5. *Exact Mathematical Reconciliation:* $1,113 + 134 + 85 + 88 = 1,420$ customer sessions ($100.0\%$).
* **Human Audit of Live Sessions and CSAT Limitation:** Customer satisfaction was collected via an optional post-session in-app 5-star survey self-administered by the project team ($n = 261$ responses out of 1,420 sessions, **18.4% response rate**), achieving a mean CSAT of **4.42 / 5.00** ($SD = 0.68$). We emphasize that because only $18.4\%$ of sessions responded to a team-administered prompt, non-response, self-selection, and administrator bias represent empirical limitations. Furthermore, a blinded manual audit of $n = 100$ randomly sampled sessions verified an **87.0% first-contact resolution accuracy**, a 48-hour repeat contact rate of **6.0%** ($85/1,420$), and **zero PII leakage incidents** (95% Clopper-Pearson confidence interval upper bound: **3.62%**).
* **Unit Economics and Operational Cost:** Token inference cost averaged **$\$0.0038$ per handled customer session** ($\sim 95\text{ VND}$, averaging $1,240$ tokens/turn at $\$0.003/1\text{k}$ tokens), while cloud GPU infrastructure amortization (hosting Llama-3.1-70B on $2\times$ NVIDIA A100-80GB instances over the $1,420$ trial sessions) contributed **$\$0.0042$ per session** ($\sim 105\text{ VND}$), yielding an empirical total AI operating cost of **$\$0.0080$ per resolved session** ($\sim 200\text{ VND/session}$). Compared to the internal pilot baseline manual support cost recorded at the Da Nang transshipment hub prior to agent deployment ($\sim 3,000\text{ VND}$ / $\sim \$0.12$ per support session based on a support wage of $35,000\text{ VND/hour}$ and an average handling time of $5.1\text{ minutes}$ per inquiry), the autonomous agent demonstrates substantial economic sustainability while reducing average session resolution time from $306\text{ seconds}$ to under $4\text{ seconds}$.
* **Operational Resilience:** Three microservice timeout incidents ($>10\text{ s}$) occurred during promotional flash sales; the system triggered graceful degradation fallback messages, providing direct tracking links without crashing.
* **User Consent and Ethics:** Pilot telemetry was collected under informed consent in the service terms of use, fully compliant with customer data protection frameworks under Decree 13/2023/ND-CP. We characterize this deployment modestly as an operational pilot field trial rather than a fully mature, production-ready system.

---

## VI. CONCLUSION, LIMITATIONS, AND ETHICAL CONSIDERATIONS

### A. Conclusion
This research presented a Heterogeneous Multi-Agent System (HMAS) combining Hybrid RAG and dynamic API Tool Calling for automated customer support in express courier logistics. By decomposing workflows across specialized agents, implementing MRL-BM25 hybrid retrieval over 9 Carrier SOPs, and enforcing role-based PII security with an independent Critic Gatekeeper, the architecture addresses key courier LLM deployment challenges: factual hallucination, operational actionability, and data privacy. On our evaluation suite, offline benchmarks indicate an $84.6\%$ operational pass rate on held-out test data (Automated Tier: $4.05 / 5.00$, Human Pass Rate: $88.5\%$), substantial human agreement ($\kappa = 0.824$, Spearman $\rho = 0.884$, Wilcoxon $W = 112.0, d = 0.50$), and $0.0\%$ ASR across evaluated OWASP prompts (including $0.0\%$ on $40$ external probes, 95% CI: $[0.0\%, 8.81\%]$), while a 30-day pilot deployment achieved $78.4\%$ autonomous containment at a measured AI operating cost of $\$0.0080$ per handled session.

### B. Limitations and Threats to Validity
We acknowledge five key limitations:
1. *Benchmark Scale, Partial Keyword Scoring, and Monolingual Scope:* The benchmark comprises $N = 100$ curated cases ($n_{\text{test}} = 70$) evaluated within a single language (Vietnamese) and domestic postal regulatory framework (Decree 47/2011/ND-CP). Automated functional scoring relies partially on lexical keyword matching alongside SOP citation checks prior to dual-annotator audit, necessitating broader multilingual and semantic evaluations in future work.
2. *Reliance on Base Model Capabilities:* System performance depends on the reasoning fidelity of the base LLM (`Meta-Llama-3.1-70B-Instruct`). Quantization degradation or smaller parameter models may exhibit lower tool argument precision.
3. *Multimodal Verification Gap:* The current text-based architecture cannot natively inspect photographic parcel damage evidence uploaded by users, requiring human supervisor escalation for physical damage claims.
4. *Cross-Border Customs Complexity:* The present knowledge base covers domestic express freight; international customs declarations and hazardous goods regulations (IATA DGR) require further expansion.
5. *Pilot Selection, Low Response Rate, and Self-Administered CSAT Bias:* Only 18.4% of pilot sessions submitted optional CSAT ratings ($261/1,420$), and the post-session survey was self-administered in-app by the project team, introducing non-response, self-selection, and administrator bias into qualitative satisfaction metrics.

### C. Ethical Considerations, Data Protection, and Reproducibility
* **Regulatory Compliance:** The system is engineered in compliance with Vietnam's **Decree 13/2023/ND-CP on Personal Data Protection**. Customer phone numbers (`0912***678`) and delivery addresses are dynamically redacted for unauthenticated users, with sensitive database identifiers hashed using salted SHA-256.
* **Terms of Service and Data Scraping:** Carrier SOPs and inquiry templates collected from public web portals were obtained in adherence to public Terms of Service, anonymized, and utilized exclusively for academic non-commercial research.
* **Statutory Update Lifecycle:** When national postal authorities issue amendments to courier liability frameworks, the modular RAG vector index can be updated without model retraining.
* **Hardware, Runtime, and Reproducibility Instructions:** Online inference executed on dual NVIDIA A100-80GB GPUs (~18 min across all 6 configurations and red-team suites). Offline statistical and visual artifact verification runs in ~2.3 s on an Apple M4 workstation (16 GB RAM, Python 3.9) from the released artifacts ([https://anonymous.4open.science/r/multi-agent-logistics-benchmark-2026/](https://anonymous.4open.science/r/multi-agent-logistics-benchmark-2026/)):
  1. Execute `python3 docs/research/paper/generate_canonical_results.py` (~0.7 s) to recompute `data/results.json`, paired Wilcoxon/t-tests, bootstrap CIs, and Clopper-Pearson bounds.
  2. Execute `python3 docs/research/paper/generate_figure4_data_dashboard.py && python3 docs/research/paper/generate_statistical_charts_svg.py` (~1.6 s) to regenerate Figs. 4–5 directly from canonical CSV logs and `results.json`.

---

## REFERENCES

[1] Vietnam E-Commerce Association (VECOM) and Ministry of Industry and Trade (MoIT), "Vietnam E-Business Index (EBI) and Logistics Operations Report," Hanoi, Vietnam, Tech. Rep., 2024.  
[2] Z. Ji, N. Lee, R. Frieske, T. Yu, D. Su, Y. Xu, E. Ishii, Y. J. Bang, A. Madotto, and P. Fung, "Survey of hallucination in natural language generation," *ACM Comput. Surv.*, vol. 55, no. 12, pp. 1–38, 2023.  
[3] J. Gao, C. Xiong, P. Bennett, and N. Craswell, "Neural approaches to conversational AI: Question answering, task-oriented dialogues, and social chatbots," *Found. Trends Inf. Retr.*, vol. 13, no. 2–3, pp. 127–298, 2019.  
[4] S. Yao, J. Zhao, D. Yu, N. Du, I. Shafran, K. Narasimhan, and Y. Cao, "ReAct: Synergizing reasoning and acting in language models," in *Proc. Int. Conf. Learn. Represent. (ICLR)*, Kigali, Rwanda, 2023, pp. 1–25.  
[5] P. Voigt and A. Von dem Bussche, *The EU General Data Protection Regulation (GDPR): A Practical Guide*, 1st ed. Cham, Switzerland: Springer, 2017.  
[6] A. Bordes, Y. Boureau, and J. Weston, "Learning end-to-end goal-oriented dialog," in *Proc. Int. Conf. Learn. Represent. (ICLR)*, Toulon, France, 2017.  
[7] P. Budzianowski, T. H. Wen, B. H. Tseng, I. Casanueva, S. Ultes, O. Ramadan, and M. Gasic, "MultiWOZ - A large-scale multi-domain Wizard-of-Oz dataset for task-oriented dialogue modelling," in *Proc. Conf. Empirical Methods Nat. Lang. Process. (EMNLP)*, Brussels, Belgium, 2018, pp. 5016–5026.  
[8] W. Zhang, Y. Cui, and T. Liu, "Recent advances in neural conversational systems," *Sci. China Inf. Sci.*, vol. 64, no. 11, p. 211101, 2021.  
[9] P. Lewis, E. Perez, A. Piktus, F. Petroni, V. Karpukhin, N. Goyal, H. Küttler, M. Lewis, W.-t. Yih, T. Rocktäschel, S. Riedel, and D. Kiela, "Retrieval-augmented generation for knowledge-intensive NLP tasks," in *Adv. Neural Inf. Process. Syst. (NeurIPS)*, Virtual, 2020, pp. 9459–9474.  
[10] S. Robertson and H. Zaragoza, "The probabilistic relevance framework: BM25 and beyond," *Found. Trends Inf. Retr.*, vol. 3, no. 4, pp. 333–389, 2009.  
[11] G. V. Cormack, C. L. Clarke, and S. Büttcher, "Reciprocal rank fusion outperforms Condorcet and individual rank learning methods," in *Proc. 32nd Int. ACM SIGIR Conf. Res. Dev. Inf. Retr.*, Boston, MA, USA, 2009, pp. 758–759.  
[12] S. Es, J. James, L. Espinosa-Anke, and S. Schockaert, "RAGAS: Automated evaluation of retrieval augmented generation," in *Proc. 18th Conf. Eur. Chapter Assoc. Comput. Linguist. (EACL)*, St. Julian's, Malta, 2024, pp. 150–158.  
[13] T. Schick, J. Dwivedi-Yu, R. Dessì, R. Raileanu, M. Lomeli, L. Zettlemoyer, N. Cancedda, and T. Scialom, "Toolformer: Language models can teach themselves to use tools," in *Adv. Neural Inf. Process. Syst. (NeurIPS)*, New Orleans, LA, USA, 2023, pp. 68539–68551.  
[14] S. Yao et al., "$\tau$-bench: A benchmark for tool-agent-user interaction in real-world domains," *arXiv preprint arXiv:2406.12045*, 2024.  
[15] Y. Qin, S. Liang, Y. Ye, K. Zhu, L. Yan, Y. Lu, Y. Lin, X. Cong, X. Tang, B. Qian, S. Zhao, and R. Xie, "ToolLLM: Facilitating large language models to master 16000+ real-world APIs," in *Proc. 12th Int. Conf. Learn. Represent. (ICLR)*, Vienna, Austria, 2024.  
[16] Q. Wu, G. Bansal, J. Zhang, Y. Wu, S. Zhang, E. Zhu, B. Li, L. Jiang, N. Zhang, and C. Wang, "AutoGen: Enabling next-gen LLM applications via multi-agent conversation framework," *arXiv preprint arXiv:2308.08155*, 2023.  
[17] H. Chase et al., "LangGraph: Multi-agent orchestration engine for complex agentic workflows," LangChain Inc., Tech. Rep., 2024. [Online]. Available: https://langchain-ai.github.io/langgraph/  
[18] OWASP Foundation, "OWASP Top 10 for Large Language Model Applications (2025 Edition)," Open Web Application Security Project, Tech. Rep., 2025.  
[19] P. Chao, A. Robey, E. Dobriban, H. Hassani, G. J. Pappas, and E. Wong, "Jailbreaking black box large language models in twenty queries," *arXiv preprint arXiv:2310.08419*, 2023.  
[20] Universal Postal Union (UPU), "Standards for postal item tracking and identifier structures (UPU S10-12)," UPU Standards Board, Bern, Switzerland, Tech. Standard S10-12, 2020.  
[21] International Air Transport Association (IATA), "Cargo Services Conference Resolutions Manual - Volumetric Weight Calculation Standard," IATA, Geneva, Switzerland, 43rd ed., 2023.  
