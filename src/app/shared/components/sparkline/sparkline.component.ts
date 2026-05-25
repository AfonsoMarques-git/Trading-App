import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Fixed-precision helper — keeps SVG path strings short. */
function f(n: number): string { return n.toFixed(2); }

@Component({
  selector: 'app-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="sparkline"
      [attr.viewBox]="vb()"
      preserveAspectRatio="none"
      [style.width.px]="width()"
      [style.height.px]="height()"
      role="img"
      aria-label="Price trend"
    >
      <defs>
        <!-- Three-stop gradient: line colour fades to transparent at the bottom,
             matching the Revolut / Robinhood area-chart aesthetic. -->
        <linearGradient [attr.id]="gid()" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   [attr.stop-color]="color()" stop-opacity="0.22"/>
          <stop offset="55%"  [attr.stop-color]="color()" stop-opacity="0.06"/>
          <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0"/>
        </linearGradient>
        <!-- Clip so the area fill never bleeds outside the SVG bounds. -->
        <clipPath [attr.id]="cid()">
          <rect x="0" y="0" [attr.width]="width()" [attr.height]="height()"/>
        </clipPath>
      </defs>

      <!-- Area fill (clipped) -->
      <path
        [attr.clip-path]="'url(#' + cid() + ')'"
        [attr.d]="area()"
        [attr.fill]="'url(#' + gid() + ')'"
        stroke="none"
      />

      <!-- Smooth curve line — Catmull-Rom cubic bezier, 1.5 px, rounded ends -->
      <path
        [attr.d]="line()"
        fill="none"
        [attr.stroke]="color()"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  `,
  styles: [`:host { display: inline-block; line-height: 0; } .sparkline { display: block; }`],
})
export class SparklineComponent {
  readonly data   = input.required<number[]>();
  readonly width  = input<number>(120);
  readonly height = input<number>(36);
  /**
   * 'auto'  — green when last ≥ first, red otherwise (default)
   * 'up'    — force green
   * 'down'  — force red
   */
  readonly trend  = input<'up' | 'down' | 'auto'>('auto');

  // Stable unique IDs so multiple sparklines on the same page
  // don't share gradient/clip-path IDs.
  private readonly _uid = Math.random().toString(36).slice(2, 8);
  protected readonly gid = computed(() => `sg-${this._uid}`);
  protected readonly cid = computed(() => `sc-${this._uid}`);
  protected readonly vb  = computed(() => `0 0 ${this.width()} ${this.height()}`);

  protected readonly color = computed(() => {
    const t = this.trend();
    if (t === 'up')   return 'var(--color-accent-green)';
    if (t === 'down') return 'var(--color-accent-red)';
    const d = this.data();
    if (d.length < 2) return 'var(--color-text-muted)';
    return d[d.length - 1] >= d[0]
      ? 'var(--color-accent-green)'
      : 'var(--color-accent-red)';
  });

  protected readonly line = computed(() => this._paths().line);
  protected readonly area = computed(() => this._paths().area);

  private _paths(): { line: string; area: string } {
    const d = this.data();
    if (!d || d.length < 2) return { line: '', area: '' };

    const W   = this.width();
    const H   = this.height();
    const PAD = 2; // vertical padding so the 1.5 px stroke doesn't clip at edges

    const min   = Math.min(...d);
    const max   = Math.max(...d);
    const range = max - min || 1;

    // Map each value to an (x, y) SVG coordinate.
    const pts = d.map((v, i) => ({
      x: (i / (d.length - 1)) * W,
      y: PAD + (1 - (v - min) / range) * (H - PAD * 2),
    }));

    // ── Smooth cubic bezier via Catmull-Rom → Bezier conversion ──────────────
    // For each segment p[i-1] → p[i]:
    //   cp1 = p[i-1] + (p[i] - p[i-2]) / 6
    //   cp2 = p[i]   - (p[i+1] - p[i-1]) / 6
    //
    // α = 1/6 gives a tight, clean curve that doesn't overshoot extremes —
    // the same algorithm used by Revolut and most finance chart libraries.
    const cmds: string[] = [`M${f(pts[0].x)},${f(pts[0].y)}`];

    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[Math.max(0, i - 2)];
      const p1 = pts[i - 1];
      const p2 = pts[i];
      const p3 = pts[Math.min(pts.length - 1, i + 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      cmds.push(
        `C${f(cp1x)},${f(cp1y)} ${f(cp2x)},${f(cp2y)} ${f(p2.x)},${f(p2.y)}`,
      );
    }

    const lineStr = cmds.join(' ');
    const last    = pts[pts.length - 1];
    // Close the area fill by dropping to the bottom-left corner.
    const areaStr = `${lineStr} L${f(last.x)},${H} L0,${H} Z`;

    return { line: lineStr, area: areaStr };
  }
}
