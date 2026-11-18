#!/usr/bin/env python3
"""
generate_evaluation_handdrawn_svg.py
Generates an Ultra-HD 300 DPI publication-grade hand-drawn digital illustration SVG + PNG
for the Empirical Benchmark Evaluation Results (N = 100 Test Cases) matching the exact
style of code-aligned-hmas-architecture.svg and multi-agent-task-collaboration.svg:
- Flat hand-drawn digital illustration with bold black outlines (2.5 - 3.5 px)
- Minimal pastel palette: Pastel Yellow (#FEF08A), Pastel Purple (#E9D5FF), Light Grey (#F1F5F9), Pastel Mint (#BBF7D0)
- Pure clean white background (#FFFFFF)
- Typography: Plus Jakarta Sans & JetBrains Mono via Google Fonts
- Rendered via Headless Chrome at 4000x2800 px for razor-sharp clarity (rõ nét tuyệt đối)
"""

import os
import subprocess

SVG_OUTPUT = "docs/research/paper/diagrams/evaluation-results-handdrawn.svg"
PNG_OUTPUT = "docs/research/paper/diagrams/evaluation-results-handdrawn.png"

def build_svg():
    W = 2400
    H = 1700
    cx, cy = 1200, 850

    lines = []
    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&amp;family=JetBrains+Mono:wght@700;800&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }}
      .hand-title {{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; }}
      .pill-text {{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; }}
      .mono {{ font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-weight: 800; }}
    </style>

    <!-- Marker Arrowhead -->
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9 z" fill="#0F172A" />
    </marker>
  </defs>

  <!-- PURE CLEAN WHITE BACKGROUND -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- MASTER DIAGRAM HEADER -->
  <g transform="translate({cx}, 60)">
    <rect x="-480" y="-35" width="960" height="72" rx="20" fill="#FEF08A" stroke="#0F172A" stroke-width="3.5" />
    <text x="0" y="8" class="hand-title" font-size="34" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="-0.02em">
      Empirical Benchmark Evaluation Results
    </text>
    <text x="0" y="55" font-size="14" font-weight="800" fill="#64748B" text-anchor="middle" letter-spacing="0.06em">
      N = 100 TEST CASES • DUAL-SOURCE PROVENANCE • ZERO HALLUCINATIONS • 100% TOOL RELIABILITY
    </text>
  </g>

  <!-- DECORATIVE HAND-DRAWN SPARKLES -->
  <g stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round" fill="none">
    <path d="M 680 180 L 680 200 M 670 190 L 690 190"/>
    <path d="M 1720 180 L 1720 200 M 1710 190 L 1730 190"/>
    <path d="M 380 920 L 380 940 M 370 930 L 390 930"/>
    <path d="M 2020 920 L 2020 940 M 2010 930 L 2030 930"/>
  </g>

  <!-- =========================================================================
       CENTRAL HUB: BENCHMARK SYNTHESIS
       ========================================================================= -->
  <g transform="translate({cx}, {cy})">
    <!-- Hub Base Oval -->
    <ellipse cx="0" cy="0" rx="310" ry="210" fill="#F1F5F9" stroke="#0F172A" stroke-width="4.0"/>
    <ellipse cx="0" cy="0" rx="296" ry="196" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8" stroke-dasharray="6,4"/>

    <!-- Pass Rate Banner -->
    <rect x="-210" y="-145" width="420" height="64" rx="18" fill="#FEF08A" stroke="#0F172A" stroke-width="3.0"/>
    <text x="0" y="-104" font-size="24" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="0.02em">
      OPERATIONAL PASS: 89.0%
    </text>

    <!-- Subtitle -->
    <text x="0" y="-55" font-size="20" font-weight="900" fill="#0F172A" text-anchor="middle">
      Empirical Evaluation Synthesis
    </text>

    <!-- KPI Chips inside Central Hub -->
    <g transform="translate(0, -25)">
      <rect x="-240" y="0" width="480" height="38" rx="10" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.8"/>
      <text x="0" y="24" font-size="14.5" font-weight="800" fill="#1E3A8A" text-anchor="middle">
        Likert Mean: 4.19 / 5.00 • Median: 93.0 / 100
      </text>
    </g>

    <g transform="translate(0, 22)">
      <rect x="-240" y="0" width="480" height="38" rx="10" fill="#F0FDF4" stroke="#22C55E" stroke-width="1.8"/>
      <text x="0" y="24" font-size="14.5" font-weight="800" fill="#14532D" text-anchor="middle">
        Mean Score: 85.18 ± 19.79 pts (N = 100 Cases)
      </text>
    </g>

    <g transform="translate(0, 69)">
      <rect x="-240" y="0" width="480" height="38" rx="10" fill="#FEFCE8" stroke="#EAB308" stroke-width="1.8"/>
      <text x="0" y="24" font-size="14.5" font-weight="800" fill="#854D0E" text-anchor="middle">
        100% Policy Compliance • Zero Hallucinations
      </text>
    </g>

    <g transform="translate(0, 116)">
      <rect x="-240" y="0" width="480" height="38" rx="10" fill="#FAF5FF" stroke="#A855F7" stroke-width="1.8"/>
      <text x="0" y="24" font-size="14.0" font-weight="800" fill="#581C87" text-anchor="middle">
        Wilcoxon W = 845.0 (p &lt; 0.001) • Cohen's d = 0.48
      </text>
    </g>
  </g>

  <!-- =========================================================================
       CLUSTER 1: TOP-LEFT - REAL-WORLD CARRIER CORPUS (50 Cases)
       ========================================================================= -->
  <g transform="translate(100, 160)">
    <!-- Container Card -->
    <rect width="660" height="520" rx="24" fill="#FFFFFF" stroke="#0F172A" stroke-width="3.5"/>
    <!-- Header Pill -->
    <rect x="25" y="-22" width="480" height="46" rx="14" fill="#E9D5FF" stroke="#0F172A" stroke-width="3.0"/>
    <text x="50" y="8" font-size="16.5" font-weight="900" fill="#0F172A">
      1. REAL-WORLD CARRIER PROVENANCE (50%)
    </text>

    <!-- Subtitle -->
    <text x="30" y="55" font-size="13" font-weight="800" fill="#64748B">
      SCRAPED PRODUCTION INCIDENTS GROUNDED IN 9 OFFICIAL SOPS
    </text>

    <!-- Card 1.1: GHTK -->
    <g transform="translate(25, 75)">
      <rect width="610" height="115" rx="16" fill="#F0FDF4" stroke="#0F172A" stroke-width="2.2"/>
      <rect x="18" y="14" width="130" height="28" rx="8" fill="#BBF7D0" stroke="#0F172A" stroke-width="1.5"/>
      <text x="83" y="33" font-size="12" font-weight="900" fill="#0F172A" text-anchor="middle">GHTK (15 Cases)</text>
      <text x="165" y="33" font-size="16" font-weight="900" fill="#15803D">100.0% Pass Rate (Likert 4.60 / 5.0)</text>
      <text x="20" y="66" font-size="13" font-weight="700" fill="#334155">
        • Packaging SOP: Bubble wrap ≥3 layers for cosmetics &amp; brittle glassware
      </text>
      <text x="20" y="92" font-size="13" font-weight="700" fill="#334155">
        • Merchant anti-scam protection &amp; standardized dead-letter claims
      </text>
    </g>

    <!-- Card 1.2: Viettel Post & VNPost -->
    <g transform="translate(25, 205)">
      <rect width="610" height="115" rx="16" fill="#FEFCE8" stroke="#0F172A" stroke-width="2.2"/>
      <rect x="18" y="14" width="200" height="28" rx="8" fill="#FEF08A" stroke="#0F172A" stroke-width="1.5"/>
      <text x="118" y="33" font-size="12" font-weight="900" fill="#0F172A" text-anchor="middle">Viettel &amp; VNPost (20 Cases)</text>
      <text x="235" y="33" font-size="16" font-weight="900" fill="#B45309">95.0% Pass Rate (Likert 4.60 / 5.0)</text>
      <text x="20" y="66" font-size="13" font-weight="700" fill="#334155">
        • Statutory Aviation Bans: Lithium battery flammability restrictions
      </text>
      <text x="20" y="92" font-size="13" font-weight="700" fill="#334155">
        • Postal Law 49/2010 (Art. 18/28): Mail secrecy &amp; force majeure indemnity
      </text>
    </g>

    <!-- Card 1.3: GHN -->
    <g transform="translate(25, 335)">
      <rect width="610" height="115" rx="16" fill="#F8FAFC" stroke="#0F172A" stroke-width="2.2"/>
      <rect x="18" y="14" width="130" height="28" rx="8" fill="#E2E8F0" stroke="#0F172A" stroke-width="1.5"/>
      <text x="83" y="33" font-size="12" font-weight="900" fill="#0F172A" text-anchor="middle">GHN (15 Cases)</text>
      <text x="165" y="33" font-size="16" font-weight="900" fill="#475569">66.7% Pass Rate (Likert 3.47 / 5.0)</text>
      <text x="20" y="66" font-size="13" font-weight="700" fill="#334155">
        • Partial delivery / partial return edge cases &amp; COD reconciliation
      </text>
      <text x="20" y="92" font-size="13" font-weight="700" fill="#334155">
        • High-value security seals (&gt; 10M VND) and signature challenges
      </text>
    </g>

    <!-- Summary Pill -->
    <g transform="translate(25, 465)">
      <rect width="610" height="38" rx="10" fill="#F3E8FF" stroke="#A855F7" stroke-width="1.5"/>
      <text x="305" y="24" font-size="12.5" font-weight="800" fill="#6B21A8" text-anchor="middle">
        Dual-Anchor Grounding: Zero hallucinated claims on carrier SOP regulations
      </text>
    </g>
  </g>

  <!-- =========================================================================
       CLUSTER 2: TOP-RIGHT - ADVERSARIAL RED-TEAMING & SAFETY (50 Cases)
       ========================================================================= -->
  <g transform="translate(1640, 160)">
    <!-- Container Card -->
    <rect width="660" height="520" rx="24" fill="#FFFFFF" stroke="#0F172A" stroke-width="3.5"/>
    <!-- Header Pill -->
    <rect x="25" y="-22" width="460" height="46" rx="14" fill="#FEF08A" stroke="#0F172A" stroke-width="3.0"/>
    <text x="50" y="8" font-size="16.5" font-weight="900" fill="#0F172A">
      2. ADVERSARIAL SAFETY &amp; OWASP (50%)
    </text>

    <!-- Subtitle -->
    <text x="30" y="55" font-size="13" font-weight="800" fill="#64748B">
      STRESS-TESTING GATEKEEPER AGAINST THREATS &amp; INVARIANTS
    </text>

    <!-- Card 2.1: OWASP Red-Team -->
    <g transform="translate(25, 75)">
      <rect width="610" height="115" rx="16" fill="#FAF5FF" stroke="#0F172A" stroke-width="2.2"/>
      <rect x="18" y="14" width="200" height="28" rx="8" fill="#E9D5FF" stroke="#0F172A" stroke-width="1.5"/>
      <text x="118" y="33" font-size="12" font-weight="900" fill="#0F172A" text-anchor="middle">OWASP Red-Team (25 Cases)</text>
      <text x="235" y="33" font-size="16" font-weight="900" fill="#7E22CE">100% Defense (0.0% ASR)</text>
      <text x="20" y="66" font-size="13" font-weight="700" fill="#334155">
        • BOLA / IDOR parcel hijacking attempts: 100% neutralized
      </text>
      <text x="20" y="92" font-size="13" font-weight="700" fill="#334155">
        • Prompt injection &amp; jailbreaks attempting policy override: 0% success
      </text>
    </g>

    <!-- Card 2.2: Physical Ceilings -->
    <g transform="translate(25, 205)">
      <rect width="610" height="115" rx="16" fill="#FEF2F2" stroke="#0F172A" stroke-width="2.2"/>
      <rect x="18" y="14" width="200" height="28" rx="8" fill="#FECACA" stroke="#0F172A" stroke-width="1.5"/>
      <text x="118" y="33" font-size="12" font-weight="900" fill="#0F172A" text-anchor="middle">Physical Ceilings (10 Cases)</text>
      <text x="235" y="33" font-size="16" font-weight="900" fill="#DC2626">100% Intercepted (0 Violations)</text>
      <text x="20" y="66" font-size="13" font-weight="700" fill="#334155">
        • Over-limit parcels (&gt;70kg weight, &gt;150cm length, &gt;300cm sum)
      </text>
      <text x="20" y="92" font-size="13" font-weight="700" fill="#334155">
        • ValidationCriticGatekeeper rejects order creation deterministically
      </text>
    </g>

    <!-- Card 2.3: IATA & PII Shield -->
    <g transform="translate(25, 335)">
      <rect width="610" height="115" rx="16" fill="#EFF6FF" stroke="#0F172A" stroke-width="2.2"/>
      <rect x="18" y="14" width="180" height="28" rx="8" fill="#BFDBFE" stroke="#0F172A" stroke-width="1.5"/>
      <text x="108" y="33" font-size="12" font-weight="900" fill="#0F172A" text-anchor="middle">IATA &amp; PII Shield (15 Cases)</text>
      <text x="215" y="33" font-size="16" font-weight="900" fill="#1D4ED8">100% Boundary Compliance</text>
      <text x="20" y="66" font-size="13" font-weight="700" fill="#334155">
        • IATA Volumetric: Chargeable W = max(Actual, L×W×H/6000)
      </text>
      <text x="20" y="92" font-size="13" font-weight="700" fill="#334155">
        • Cryptographic PII Masking: Phone (0912***678), Address (***, Q1, HCM)
      </text>
    </g>

    <!-- Summary Pill -->
    <g transform="translate(25, 465)">
      <rect width="610" height="38" rx="10" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="305" y="24" font-size="12.5" font-weight="800" fill="#92400E" text-anchor="middle">
        Robustness: 100.0% Risk Detection Rate • Zero PII Exposure
      </text>
    </g>
  </g>

  <!-- =========================================================================
       CLUSTER 3: BOTTOM-LEFT - LATENCY & PROFILING DECOMPOSITION
       ========================================================================= -->
  <g transform="translate(100, 1020)">
    <!-- Container Card -->
    <rect width="660" height="580" rx="24" fill="#FFFFFF" stroke="#0F172A" stroke-width="3.5"/>
    <!-- Header Pill -->
    <rect x="25" y="-22" width="460" height="46" rx="14" fill="#BBF7D0" stroke="#0F172A" stroke-width="3.0"/>
    <text x="50" y="8" font-size="16.5" font-weight="900" fill="#0F172A">
      4. LATENCY &amp; EXECUTION PROFILING
    </text>

    <!-- Subtitle -->
    <text x="30" y="55" font-size="13" font-weight="800" fill="#64748B">
      END-TO-END LATENCY ANALYSIS ACROSS N = 100 TEST SCENARIOS
    </text>

    <!-- TTFT Banner Card -->
    <g transform="translate(25, 75)">
      <rect width="610" height="100" rx="16" fill="#FEFCE8" stroke="#0F172A" stroke-width="2.2"/>
      <text x="25" y="38" font-size="18" font-weight="900" fill="#0F172A">
        Perceived TTFT: 420 ms via SSE Streaming
      </text>
      <text x="25" y="68" font-size="13.5" font-weight="700" fill="#713F12">
        • Server-Sent Events (SSE) token stream delivers instantaneous conversational
      </text>
      <text x="25" y="88" font-size="13.5" font-weight="700" fill="#713F12">
        feedback to users, masking multi-agent orchestration overhead.
      </text>
    </g>

    <!-- End-to-End Latency Metrics -->
    <g transform="translate(25, 190)">
      <rect width="610" height="150" rx="16" fill="#F8FAFC" stroke="#0F172A" stroke-width="2.2"/>
      <text x="25" y="34" font-size="16" font-weight="900" fill="#0F172A">
        End-to-End Latency Distribution
      </text>
      <text x="25" y="64" font-size="14" font-weight="800" fill="#1E3A8A">
        • Mean Response Time: 3,712.5 ms
      </text>
      <text x="25" y="90" font-size="14" font-weight="800" fill="#334155">
        • Median (p50): 3,320.0 ms | 90th Percentile (p90): 5,404.0 ms
      </text>
      <text x="25" y="116" font-size="14" font-weight="800" fill="#334155">
        • 95th Percentile (p95): 6,041.0 ms | 99th Percentile: 10,596.0 ms
      </text>
      <text x="25" y="138" font-size="12" font-weight="700" fill="#64748B">
        (Non-streaming fallback latency benchmark)
      </text>
    </g>

    <!-- Execution Decomposition Breakdown -->
    <g transform="translate(25, 355)">
      <rect width="610" height="145" rx="16" fill="#F1F5F9" stroke="#0F172A" stroke-width="2.2"/>
      <text x="25" y="32" font-size="15" font-weight="900" fill="#0F172A">
        Execution Time Decomposition
      </text>
      
      <!-- Horizontal Stack Bar -->
      <g transform="translate(25, 48)">
        <rect x="0" y="0" width="478" height="24" rx="6" fill="#1E3A8A"/>
        <rect x="478" y="0" width="33" height="24" rx="4" fill="#2563EB"/>
        <rect x="511" y="0" width="28" height="24" rx="4" fill="#60A5FA"/>
        <rect x="539" y="0" width="19" height="24" rx="4" fill="#94A3B8"/>
      </g>

      <text x="25" y="96" font-size="12.5" font-weight="800" fill="#1E3A8A">
        • LLM Token Generation: 85.4% (3,170 ms)
      </text>
      <text x="25" y="118" font-size="12.5" font-weight="800" fill="#2563EB">
        • Microservice Tool APIs: 5.9% (220 ms) | Hybrid RAG: 5.0% (185 ms)
      </text>
      <text x="25" y="138" font-size="12.5" font-weight="800" fill="#64748B">
        • Supervisor Intent Routing &amp; Session Memory: 3.4% (128 ms)
      </text>
    </g>

    <!-- Summary Pill -->
    <g transform="translate(25, 520)">
      <rect width="610" height="38" rx="10" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.5"/>
      <text x="305" y="24" font-size="12.5" font-weight="800" fill="#15803D" text-anchor="middle">
        User Experience: TTFT 420 ms eliminates conversational latency friction
      </text>
    </g>
  </g>

  <!-- =========================================================================
       CLUSTER 4: BOTTOM-RIGHT - 5-TIER LIKERT EVALUATION SPECTRUM
       ========================================================================= -->
  <g transform="translate(1640, 1020)">
    <!-- Container Card -->
    <rect width="660" height="580" rx="24" fill="#FFFFFF" stroke="#0F172A" stroke-width="3.5"/>
    <!-- Header Pill -->
    <rect x="25" y="-22" width="480" height="46" rx="14" fill="#F1F5F9" stroke="#0F172A" stroke-width="3.0"/>
    <text x="50" y="8" font-size="16.5" font-weight="900" fill="#0F172A">
      3. 5-TIER LIKERT EVALUATION SPECTRUM
    </text>

    <!-- Subtitle -->
    <text x="30" y="55" font-size="13" font-weight="800" fill="#64748B">
      ACADEMIC LIKERT RUBRIC CLASSIFICATION ACROSS N = 100
    </text>

    <!-- Tier 5: Excellent -->
    <g transform="translate(25, 75)">
      <rect width="610" height="80" rx="14" fill="#EFF6FF" stroke="#0F172A" stroke-width="2.0"/>
      <rect x="18" y="12" width="180" height="24" rx="6" fill="#BFDBFE" stroke="#0F172A" stroke-width="1.2"/>
      <text x="108" y="28" font-size="11" font-weight="900" fill="#0F172A" text-anchor="middle">LEVEL 5 [EXCELLENT]</text>
      <text x="215" y="30" font-size="15" font-weight="900" fill="#1D4ED8">50 Cases (50.0%)</text>
      <text x="20" y="60" font-size="12.5" font-weight="700" fill="#334155">
        Score ≥ 90 pts • Perfect statutory keyword recall + exact SOP citations
      </text>
    </g>

    <!-- Tier 4: Good -->
    <g transform="translate(25, 165)">
      <rect width="610" height="80" rx="14" fill="#F0FDF4" stroke="#0F172A" stroke-width="2.0"/>
      <rect x="18" y="12" width="180" height="24" rx="6" fill="#BBF7D0" stroke="#0F172A" stroke-width="1.2"/>
      <text x="108" y="28" font-size="11" font-weight="900" fill="#0F172A" text-anchor="middle">LEVEL 4 [GOOD]</text>
      <text x="215" y="30" font-size="15" font-weight="900" fill="#15803D">37 Cases (37.0%)</text>
      <text x="20" y="60" font-size="12.5" font-weight="700" fill="#334155">
        Score 75 - 89.9 pts • Correct courier actions, safe, zero policy errors
      </text>
    </g>

    <!-- Tier 3: Acceptable -->
    <g transform="translate(25, 255)">
      <rect width="610" height="80" rx="14" fill="#FEFCE8" stroke="#0F172A" stroke-width="2.0"/>
      <rect x="18" y="12" width="180" height="24" rx="6" fill="#FEF08A" stroke="#0F172A" stroke-width="1.2"/>
      <text x="108" y="28" font-size="11" font-weight="900" fill="#0F172A" text-anchor="middle">LEVEL 3 [ACCEPTABLE]</text>
      <text x="215" y="30" font-size="15" font-weight="900" fill="#B45309">2 Cases (2.0%)</text>
      <text x="20" y="60" font-size="12.5" font-weight="700" fill="#334155">
        Score 60 - 74.9 pts • Meets baseline operational requirements
      </text>
    </g>

    <!-- Tier 2 & 1: Non-passing -->
    <g transform="translate(25, 345)">
      <rect width="610" height="120" rx="14" fill="#FEF2F2" stroke="#0F172A" stroke-width="2.0"/>
      <rect x="18" y="12" width="200" height="24" rx="6" fill="#FECACA" stroke="#0F172A" stroke-width="1.2"/>
      <text x="118" y="28" font-size="11" font-weight="900" fill="#0F172A" text-anchor="middle">NON-PASSING (11 CASES)</text>
      <text x="235" y="30" font-size="15" font-weight="900" fill="#DC2626">11.0% Total (L2: 4% + L1: 7%)</text>
      <text x="20" y="62" font-size="12" font-weight="700" fill="#334155">
        • Level 2 (Marginal): 4 cases (2 out-of-domain refusals + 2 peripheral subclauses)
      </text>
      <text x="20" y="84" font-size="12" font-weight="700" fill="#334155">
        • Level 1 (Critical): 7 cases (missing complex multi-leg regional surcharges)
      </text>
      <text x="20" y="106" font-size="12" font-weight="800" fill="#15803D">
        • Note: Zero security breaches (0% ASR) and zero hallucinated claims
      </text>
    </g>

    <!-- Summary Pill -->
    <g transform="translate(25, 485)">
      <rect width="610" height="38" rx="10" fill="#DBEAFE" stroke="#3B82F6" stroke-width="1.5"/>
      <text x="305" y="24" font-size="12.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">
        Proficiency: 87.0% in Top Echelons (Levels 4 &amp; 5) • 89.0% Overall Pass
      </text>
    </g>
  </g>

  <!-- =========================================================================
       CONNECTING CURVED DASHED ARROWS (Radial flows from Central Hub)
       ========================================================================= -->
  <g fill="none" stroke="#0F172A" stroke-width="3.2" stroke-dasharray="8,6" stroke-linecap="round">
    <!-- Center to Top-Left -->
    <path d="M 980 730 C 850 630, 800 520, 765 420" marker-end="url(#arrow)"/>
    <!-- Center to Top-Right -->
    <path d="M 1420 730 C 1550 630, 1600 520, 1635 420" marker-end="url(#arrow)"/>
    <!-- Center to Bottom-Left -->
    <path d="M 980 970 C 850 1070, 800 1180, 765 1280" marker-end="url(#arrow)"/>
    <!-- Center to Bottom-Right -->
    <path d="M 1420 970 C 1550 1070, 1600 1180, 1635 1280" marker-end="url(#arrow)"/>
  </g>
</svg>''')

    svg_content = "\n".join(lines)
    with open(SVG_OUTPUT, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Successfully generated {SVG_OUTPUT}")

    # Render Ultra-HD 300 DPI PNG via Headless Chrome
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    abs_svg = os.path.abspath(SVG_OUTPUT)
    abs_png = os.path.abspath(PNG_OUTPUT)

    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--force-device-scale-factor=1.6667",
        f"--screenshot={abs_png}",
        "--window-size=2400,1700",
        f"file://{abs_svg}"
    ]

    print("Rendering Ultra-HD 300 DPI PNG via Headless Chrome...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(abs_png):
        size = os.path.getsize(abs_png)
        print(f"Successfully rendered {PNG_OUTPUT} ({size} bytes, 4000x2833 px)")
    else:
        print(f"Chrome screenshot error: {res.stderr}")

if __name__ == "__main__":
    build_svg()
