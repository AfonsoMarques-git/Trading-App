import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'dashboard' | 'markets' | 'portfolio' | 'orders' | 'watchlist'
  | 'analytics' | 'ai' | 'trophy' | 'academy' | 'alerts' | 'settings'
  | 'search' | 'bell' | 'logout' | 'chevron-left' | 'chevron-right'
  | 'chevron-down' | 'plus' | 'check' | 'close' | 'help' | 'achievements'
  | 'logo' | 'trade' | 'menu' | 'eye' | 'eye-off';

/**
 * Inline SVG icon renderer. Renders each icon using static `@switch` cases
 * with real SVG primitive elements (path, line, rect, circle, polyline)
 * so it works in SSR (domino) without `[innerHTML]`.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('dashboard') {
          <rect x="3" y="3" width="7" height="9" rx="1.5"/>
          <rect x="14" y="3" width="7" height="5" rx="1.5"/>
          <rect x="14" y="12" width="7" height="9" rx="1.5"/>
          <rect x="3" y="16" width="7" height="5" rx="1.5"/>
        }
        @case ('markets') {
          <path d="M3 17 L9 11 L13 15 L21 6"/>
          <polyline points="15 6 21 6 21 12"/>
        }
        @case ('portfolio') {
          <path d="M3 7 h18 v12 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 z"/>
          <path d="M8 7 V5 a2 2 0 0 1 2 -2 h4 a2 2 0 0 1 2 2 v2"/>
        }
        @case ('orders') {
          <rect x="4" y="3" width="16" height="18" rx="2"/>
          <path d="M8 8 h8"/>
          <path d="M8 12 h8"/>
          <path d="M8 16 h5"/>
        }
        @case ('watchlist') {
          <path d="M12 17.27 L18.18 21 L16.54 13.97 L22 9.24 L14.81 8.62 L12 2 L9.19 8.62 L2 9.24 L7.46 13.97 L5.82 21 z"/>
        }
        @case ('analytics') {
          <path d="M3 3 v18 h18"/>
          <path d="M7 14 V18"/>
          <path d="M12 9 V18"/>
          <path d="M17 5 V18"/>
        }
        @case ('ai') {
          <rect x="4" y="6" width="16" height="12" rx="2"/>
          <path d="M9 11 v2"/>
          <path d="M15 11 v2"/>
          <path d="M12 6 V3"/>
          <path d="M2 12 H4"/>
          <path d="M20 12 H22"/>
        }
        @case ('trophy') {
          <path d="M8 21 h8"/>
          <path d="M12 17 v4"/>
          <path d="M7 4 h10 v6 a5 5 0 0 1 -10 0 z"/>
          <path d="M17 6 h3 v2 a3 3 0 0 1 -3 3"/>
          <path d="M7 6 H4 v2 a3 3 0 0 0 3 3"/>
        }
        @case ('academy') {
          <path d="M22 10 L12 5 L2 10 L12 15 z"/>
          <path d="M6 12 V17 c0 1 3 3 6 3 s6 -2 6 -3 V12"/>
          <path d="M22 10 V16"/>
        }
        @case ('alerts') {
          <path d="M18 16 v-5 a6 6 0 0 0 -12 0 v5 l-2 2 v1 h16 v-1 z"/>
          <path d="M10 21 a2 2 0 0 0 4 0"/>
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15 a1.65 1.65 0 0 0 .33 1.82 l.06 .06 a2 2 0 0 1 -2.83 2.83 l-.06 -.06 a1.65 1.65 0 0 0 -1.82 -.33 a1.65 1.65 0 0 0 -1 1.51 V21 a2 2 0 0 1 -4 0 v-.09 a1.65 1.65 0 0 0 -1 -1.51 a1.65 1.65 0 0 0 -1.82 .33 l-.06 .06 a2 2 0 0 1 -2.83 -2.83 l.06 -.06 a1.65 1.65 0 0 0 .33 -1.82 a1.65 1.65 0 0 0 -1.51 -1 H3 a2 2 0 0 1 0 -4 h.09 A1.65 1.65 0 0 0 4.6 9 a1.65 1.65 0 0 0 -.33 -1.82 l-.06 -.06 a2 2 0 0 1 2.83 -2.83 l.06 .06 a1.65 1.65 0 0 0 1.82 .33 H9 a1.65 1.65 0 0 0 1 -1.51 V3 a2 2 0 0 1 4 0 v.09 a1.65 1.65 0 0 0 1 1.51 a1.65 1.65 0 0 0 1.82 -.33 l.06 -.06 a2 2 0 0 1 2.83 2.83 l-.06 .06 a1.65 1.65 0 0 0 -.33 1.82 V9 a1.65 1.65 0 0 0 1.51 1 H21 a2 2 0 0 1 0 4 h-.09 a1.65 1.65 0 0 0 -1.51 1 z"/>
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7"/>
          <path d="m21 21 -4.3 -4.3"/>
        }
        @case ('bell') {
          <path d="M18 16 v-5 a6 6 0 0 0 -12 0 v5 l-2 2 v1 h16 v-1 z"/>
          <path d="M10 21 a2 2 0 0 0 4 0"/>
        }
        @case ('logout') {
          <path d="M9 21 H5 a2 2 0 0 1 -2 -2 V5 a2 2 0 0 1 2 -2 h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        }
        @case ('chevron-left') {
          <polyline points="15 18 9 12 15 6"/>
        }
        @case ('chevron-right') {
          <polyline points="9 18 15 12 9 6"/>
        }
        @case ('chevron-down') {
          <polyline points="6 9 12 15 18 9"/>
        }
        @case ('plus') {
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        }
        @case ('check') {
          <polyline points="20 6 9 17 4 12"/>
        }
        @case ('close') {
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        }
        @case ('help') {
          <circle cx="12" cy="12" r="9"/>
          <path d="M9.09 9 a3 3 0 0 1 5.83 1 c0 2 -3 3 -3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        }
        @case ('achievements') {
          <circle cx="12" cy="8" r="6"/>
          <polyline points="8.21 13.89 7 22 12 19 17 22 15.79 13.88"/>
        }
        @case ('logo') {
          <path d="M6 18 L11 12 L15 16 L21 6"/>
        }
        @case ('trade') {
          <path d="M7 15 L17 5"/>
          <polyline points="11 5 17 5 17 11"/>
          <path d="M17 9 L7 19"/>
          <polyline points="13 19 7 19 7 13"/>
        }
        @case ('menu') {
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        }
        @case ('eye') {
          <path d="M1 12 s4 -8 11 -8 s11 8 11 8 s-4 8 -11 8 s-11 -8 -11 -8 z"/>
          <circle cx="12" cy="12" r="3"/>
        }
        @case ('eye-off') {
          <path d="M17.94 17.94 A10.07 10.07 0 0 1 12 20 c-7 0 -11 -8 -11 -8 a18.45 18.45 0 0 1 5.06 -5.94"/>
          <path d="M9.9 4.24 A9.12 9.12 0 0 1 12 4 c7 0 11 8 11 8 a18.5 18.5 0 0 1 -2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        }
      }
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; line-height: 0; }
    svg { display: block; }
  `],
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<number>(18);
}
