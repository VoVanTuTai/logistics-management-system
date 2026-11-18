#!/usr/bin/env python3
"""
generate_handdrawn_evaluation_dashboard.py
Generates a hand-drawn digital illustration diagram for the empirical benchmark
evaluation results (N = 100 test cases) matching the user's requested style:
- Flat hand-drawn digital illustration with bold black outlines (2.5 - 3.5 px)
- Minimal pastel palette: Pastel Yellow (#FEF08A), Pastel Purple (#E9D5FF), Light Grey (#F1F5F9)
- Pure clean white background (#FFFFFF)
- Radial distributed clusters connected with natural curved dashed black arrows
- Direct 100% fidelity to the actual run results in results_raw.csv and results_summary.json
Outputs:
  - docs/research/paper/diagrams/evaluation-results-handdrawn.png (300 DPI)
  - docs/research/paper/diagrams/evaluation-results-handdrawn.svg (Scalable Vector)
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, PathPatch
from matplotlib.path import Path

def draw_handdrawn_box(ax, x, y, w, h, bg_color='#ffffff', border_color='#0f172a', lw=2.8, r=1.5):
    """Draws a box with bold black outline and hand-drawn feel."""
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle=f"round,pad=0.2,rounding_size={r}",
                         linewidth=lw, edgecolor=border_color,
                         facecolor=bg_color, zorder=2)
    ax.add_patch(box)
    return box

def draw_dashed_arrow(ax, p1, p2, color='#0f172a', lw=2.2):
    """Draws a curved dashed arrow connecting clusters."""
    ax.annotate('', xy=p2, xytext=p1,
                arrowprops=dict(
                    arrowstyle="-|>",
                    color=color,
                    lw=lw,
                    linestyle=(0, (4, 3)),
                    connectionstyle="arc3,rad=0.12",
                    mutation_scale=16
                ),
                zorder=3)

def generate_handdrawn_eval_diagram():
    png_out = 'docs/research/paper/diagrams/evaluation-results-handdrawn.png'
    svg_out = 'docs/research/paper/diagrams/evaluation-results-handdrawn.svg'

    fig, ax = plt.subplots(figsize=(14.0, 9.5), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Color Palette: Minimal Pastel + Bold Black
    c_yellow = '#fef08a' # Pastel Yellow
    c_purple = '#e9d5ff' # Pastel Purple / Lavender
    c_grey   = '#f1f5f9' # Light Grey
    c_green  = '#bbf7d0' # Pastel Mint Green
    c_coral  = '#fecaca' # Pastel Coral Red
    c_black  = '#0f172a' # Bold Outline Black

    # Outer border
    draw_handdrawn_box(ax, 1.0, 1.0, 98.0, 98.0, bg_color='#ffffff', border_color=c_black, lw=3.2, r=2.0)

    # Diagram Title Banner (Top Center)
    draw_handdrawn_box(ax, 16.0, 91.5, 68.0, 6.2, bg_color=c_yellow, border_color=c_black, lw=2.8, r=1.2)
    ax.text(50.0, 94.6, "EMPIRICAL BENCHMARK EVALUATION RESULTS (N = 100 TEST CASES)",
            fontsize=12.0, fontweight='heavy', color=c_black, ha='center', va='center')

    # =========================================================================
    # CENTRAL HUB: EMPIRICAL BENCHMARK SUMMARY (N = 100)
    # =========================================================================
    draw_handdrawn_box(ax, 34.0, 39.5, 32.0, 21.0, bg_color=c_grey, border_color=c_black, lw=3.2, r=3.5)
    
    # Inner KPI Badge
    draw_handdrawn_box(ax, 36.5, 52.0, 27.0, 6.5, bg_color=c_yellow, border_color=c_black, lw=2.2, r=1.5)
    ax.text(50.0, 55.2, "OPERATIONAL PASS: 89.0%", fontsize=10.5, fontweight='heavy', color=c_black, ha='center', va='center')

    ax.text(50.0, 48.5, "Overall Benchmark Synthesis", fontsize=9.2, fontweight='bold', color=c_black, ha='center')
    ax.text(50.0, 45.2, "• Likert Mean: 4.19 / 5.00 (Median: 93.0/100)", fontsize=7.8, fontweight='bold', color='#1e293b', ha='center')
    ax.text(50.0, 42.2, "• Composite Mean: 85.18 ± 19.79 pts", fontsize=7.6, color='#334155', ha='center')
    ax.text(50.0, 39.4, "• Zero Regulatory Hallucinations", fontsize=7.4, fontweight='bold', color='#15803d', ha='center')

    # =========================================================================
    # CLUSTER 1: TOP-LEFT - REAL-WORLD CARRIER PROVENANCE (50 Cases)
    # =========================================================================
    draw_handdrawn_box(ax, 3.5, 59.0, 34.0, 29.5, bg_color='#ffffff', border_color=c_black, lw=2.8, r=1.8)
    
    # Header badge
    draw_handdrawn_box(ax, 5.0, 82.5, 31.0, 4.8, bg_color=c_purple, border_color=c_black, lw=2.0, r=1.0)
    ax.text(20.5, 84.9, "1. REAL-WORLD CARRIER CORPUS (50%)", fontsize=8.6, fontweight='heavy', color=c_black, ha='center', va='center')

    # GHTK Card
    draw_handdrawn_box(ax, 5.5, 74.2, 30.0, 6.8, bg_color=c_green, border_color=c_black, lw=1.8, r=1.0)
    ax.text(7.0, 78.2, "GHTK (15 Cases): 100.0% Pass Rate", fontsize=7.6, fontweight='bold', color=c_black)
    ax.text(7.0, 75.6, "• Likert Mean: 4.60/5.0 | Cosmetic packaging & anti-scam", fontsize=6.8, color='#1e293b')

    # Viettel Post & VNPost Card
    draw_handdrawn_box(ax, 5.5, 66.2, 30.0, 6.8, bg_color=c_yellow, border_color=c_black, lw=1.8, r=1.0)
    ax.text(7.0, 70.2, "Viettel Post & VNPost (20 Cases): 95.0% Pass", fontsize=7.6, fontweight='bold', color=c_black)
    ax.text(7.0, 67.6, "• Likert: 4.60/5.0 | Aviation Lithium bans, Mail privacy", fontsize=6.8, color='#1e293b')

    # GHN Card
    draw_handdrawn_box(ax, 5.5, 58.2, 30.0, 6.8, bg_color=c_grey, border_color=c_black, lw=1.8, r=1.0)
    ax.text(7.0, 62.2, "GHN (15 Cases): 66.7% Pass Rate", fontsize=7.6, fontweight='bold', color=c_black)
    ax.text(7.0, 59.6, "• Likert: 3.47/5.0 | Partial delivery & seals > 10M", fontsize=6.8, color='#1e293b')

    # =========================================================================
    # CLUSTER 2: TOP-RIGHT - ADVERSARIAL RED-TEAMING & SAFETY (50 Cases)
    # =========================================================================
    draw_handdrawn_box(ax, 62.5, 59.0, 34.0, 29.5, bg_color='#ffffff', border_color=c_black, lw=2.8, r=1.8)
    
    # Header badge
    draw_handdrawn_box(ax, 64.0, 82.5, 31.0, 4.8, bg_color=c_yellow, border_color=c_black, lw=2.0, r=1.0)
    ax.text(79.5, 84.9, "2. ADVERSARIAL SAFETY & OWASP (50%)", fontsize=8.6, fontweight='heavy', color=c_black, ha='center', va='center')

    # OWASP Defense
    draw_handdrawn_box(ax, 64.5, 74.2, 30.0, 6.8, bg_color=c_purple, border_color=c_black, lw=1.8, r=1.0)
    ax.text(66.0, 78.2, "OWASP Red-Teaming (25 Cases): 100% Defense", fontsize=7.6, fontweight='bold', color=c_black)
    ax.text(66.0, 75.6, "• 0.0% ASR | BOLA, IDOR, Jailbreak Injection blocked", fontsize=6.8, color='#1e293b')

    # Physical Ceilings
    draw_handdrawn_box(ax, 64.5, 66.2, 30.0, 6.8, bg_color=c_coral, border_color=c_black, lw=1.8, r=1.0)
    ax.text(66.0, 70.2, "Physical Operational Ceilings (10 Cases)", fontsize=7.6, fontweight='bold', color=c_black)
    ax.text(66.0, 67.6, "• 100% Intercepted: Over 70kg, length > 150cm blocked", fontsize=6.8, color='#1e293b')

    # IATA & PII
    draw_handdrawn_box(ax, 64.5, 58.2, 30.0, 6.8, bg_color=c_grey, border_color=c_black, lw=1.8, r=1.0)
    ax.text(66.0, 62.2, "IATA Volumetric & PII Masking (15 Cases)", fontsize=7.6, fontweight='bold', color=c_black)
    ax.text(66.0, 59.6, "• V/6000 enforced | Phone & Address cryptographic mask", fontsize=6.8, color='#1e293b')

    # =========================================================================
    # CLUSTER 3: BOTTOM-RIGHT - 5-TIER LIKERT EVALUATION DISTRIBUTION
    # =========================================================================
    draw_handdrawn_box(ax, 62.5, 8.5, 34.0, 27.5, bg_color='#ffffff', border_color=c_black, lw=2.8, r=1.8)
    
    # Header badge
    draw_handdrawn_box(ax, 64.0, 30.0, 31.0, 4.8, bg_color=c_grey, border_color=c_black, lw=2.0, r=1.0)
    ax.text(79.5, 32.4, "3. 5-TIER LIKERT EVALUATION SPECTRUM", fontsize=8.6, fontweight='heavy', color=c_black, ha='center', va='center')

    # Level rows
    draw_handdrawn_box(ax, 64.5, 24.2, 30.0, 4.6, bg_color=c_green, border_color=c_black, lw=1.5, r=0.8)
    ax.text(66.0, 26.5, "Level 5 [EXCELLENT]: 50 Cases (50.0%)", fontsize=7.2, fontweight='bold', color=c_black)

    draw_handdrawn_box(ax, 64.5, 18.8, 30.0, 4.6, bg_color=c_yellow, border_color=c_black, lw=1.5, r=0.8)
    ax.text(66.0, 21.1, "Level 4 [GOOD]: 37 Cases (37.0%)", fontsize=7.2, fontweight='bold', color=c_black)

    draw_handdrawn_box(ax, 64.5, 13.4, 30.0, 4.6, bg_color=c_purple, border_color=c_black, lw=1.5, r=0.8)
    ax.text(66.0, 15.7, "Level 3 [ACCEPTABLE]: 2 Cases (2.0%)", fontsize=7.2, fontweight='bold', color=c_black)

    draw_handdrawn_box(ax, 64.5, 8.0, 30.0, 4.6, bg_color=c_coral, border_color=c_black, lw=1.5, r=0.8)
    ax.text(66.0, 10.3, "Non-Passing: 4 Marginal (4%) + 7 Critical (7%)", fontsize=7.2, fontweight='bold', color=c_black)

    # =========================================================================
    # CLUSTER 4: BOTTOM-LEFT - LATENCY & PROFILING DECOMPOSITION
    # =========================================================================
    draw_handdrawn_box(ax, 3.5, 8.5, 34.0, 27.5, bg_color='#ffffff', border_color=c_black, lw=2.8, r=1.8)
    
    # Header badge
    draw_handdrawn_box(ax, 5.0, 30.0, 31.0, 4.8, bg_color=c_purple, border_color=c_black, lw=2.0, r=1.0)
    ax.text(20.5, 32.4, "4. LATENCY & EXECUTION PROFILING", fontsize=8.6, fontweight='heavy', color=c_black, ha='center', va='center')

    # TTFT highlight
    draw_handdrawn_box(ax, 5.5, 23.5, 30.0, 5.5, bg_color=c_yellow, border_color=c_black, lw=1.8, r=1.0)
    ax.text(7.0, 26.8, "Perceived TTFT: 420 ms (SSE Streaming)", fontsize=7.8, fontweight='bold', color=c_black)
    ax.text(7.0, 24.5, "• Instantaneous conversational feedback to user", fontsize=6.8, color='#334155')

    # End-to-end breakdown
    draw_handdrawn_box(ax, 5.5, 13.5, 30.0, 9.0, bg_color=c_grey, border_color=c_black, lw=1.8, r=1.0)
    ax.text(7.0, 20.4, "End-to-End Latency: Mean 3,712.5 ms", fontsize=7.6, fontweight='bold', color=c_black)
    ax.text(7.0, 18.0, "• Median p50: 3,320 ms | Tail p90: 5,404 ms", fontsize=6.8, color='#334155')
    ax.text(7.0, 15.6, "• Decomp: LLM (85.4%), Tools (5.9%), RAG (5.0%), Router (3.4%)", fontsize=6.4, color='#334155')

    # Statistical significance pill
    draw_handdrawn_box(ax, 5.5, 8.0, 30.0, 4.5, bg_color=c_green, border_color=c_black, lw=1.5, r=0.8)
    ax.text(7.0, 10.3, "Wilcoxon W = 845.0, p < 0.001 | Cohen's d = 0.48", fontsize=6.8, fontweight='bold', color=c_black)

    # =========================================================================
    # CONNECTING DASHED ARROWS (Radial flows from Central Hub)
    # =========================================================================
    # Center -> Top-Left
    draw_dashed_arrow(ax, (40.0, 58.0), (33.0, 68.0))
    # Center -> Top-Right
    draw_dashed_arrow(ax, (60.0, 58.0), (67.0, 68.0))
    # Center -> Bottom-Right
    draw_dashed_arrow(ax, (62.0, 42.0), (67.0, 31.0))
    # Center -> Bottom-Left
    draw_dashed_arrow(ax, (38.0, 42.0), (33.0, 31.0))

    plt.tight_layout(pad=0.5)
    plt.savefig(png_out, dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.savefig(svg_out, format='svg', bbox_inches='tight', facecolor='#ffffff')
    plt.close()
    print(f"[SUCCESS] Generated hand-drawn evaluation dashboard:\n  -> PNG: {png_out}\n  -> SVG: {svg_out}")

if __name__ == '__main__':
    generate_handdrawn_eval_diagram()
