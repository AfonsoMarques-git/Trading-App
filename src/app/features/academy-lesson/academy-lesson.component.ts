import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface LessonContent {
  title: string;
  module: string;
  duration: string;
  sections: { heading: string; body: string }[];
  keyTakeaways: string[];
}

const LESSONS: Record<string, LessonContent> = {
  'what-is-trading': {
    title: 'What is stock trading?',
    module: 'Trading Basics',
    duration: '5 min',
    sections: [
      { heading: 'Overview', body: 'Stock trading is the buying and selling of shares in publicly listed companies. When you buy a share, you own a small fraction of that company and are entitled to a proportional share of its profits and assets.' },
      { heading: 'How prices move', body: 'Prices are driven by supply and demand. When more people want to buy a stock than sell it, the price rises. Conversely, when sellers outnumber buyers, the price falls. News, earnings reports, and macroeconomic data all shift supply and demand rapidly.' },
      { heading: 'Paper trading', body: 'Paper trading lets you practise all of this with virtual money. You get identical order types, price feeds, and portfolio mechanics — without any financial risk. It\'s the fastest way to build real intuition for how markets behave.' },
    ],
    keyTakeaways: [
      'Stocks represent fractional ownership of a company.',
      'Price is determined by supply and demand.',
      'Paper trading lets you build skill risk-free.',
    ],
  },
  'order-types': {
    title: 'Market vs limit orders',
    module: 'Trading Basics',
    duration: '6 min',
    sections: [
      { heading: 'Market orders', body: 'A market order executes immediately at the best available price. You are guaranteed execution but not a specific price. Use market orders when speed is more important than precision.' },
      { heading: 'Limit orders', body: 'A limit order executes only at your specified price or better. A buy limit order fills at or below your limit price; a sell limit order fills at or above. You control the price but risk the order never filling if the market doesn\'t reach your level.' },
      { heading: 'Which to use?', body: 'For liquid assets with tight spreads, market orders are usually fine. For illiquid assets or large orders, limit orders protect you from paying too much (or receiving too little).' },
    ],
    keyTakeaways: [
      'Market orders guarantee execution, not price.',
      'Limit orders guarantee price, not execution.',
      'Use limit orders to control entry and exit points precisely.',
    ],
  },
};

const DEFAULT_LESSON: LessonContent = {
  title: 'Lesson content',
  module: 'Academy',
  duration: '5 min',
  sections: [
    { heading: 'Overview', body: 'This lesson covers foundational trading concepts that will help you make more informed decisions in the market.' },
    { heading: 'Key concepts', body: 'Understanding market mechanics, price discovery, and order execution are the cornerstones of successful trading. Take your time with each section and use the paper trading simulator to practise immediately after.' },
  ],
  keyTakeaways: [
    'Build a solid foundation before advancing.',
    'Practise each concept in the simulator.',
    'Review this lesson whenever you need a refresher.',
  ],
};

@Component({
  selector: 'app-academy-lesson',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <nav class="breadcrumb">
        <a routerLink="/academy" class="breadcrumb-link">
          <app-icon name="chevron-left" [size]="12"/>
          Academy
        </a>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">{{ lesson().module }}</span>
      </nav>

      <header class="lesson-head">
        <div class="lesson-meta">
          <span class="badge badge-green">{{ lesson().module }}</span>
          <span class="lesson-duration">
            <app-icon name="academy" [size]="12"/>
            {{ lesson().duration }} read
          </span>
        </div>
        <h1 class="lesson-title">{{ lesson().title }}</h1>
      </header>

      <div class="lesson-layout">
        <article class="lesson-body">
          @for (section of lesson().sections; track section.heading) {
            <section class="lesson-section">
              <h2 class="section-heading">{{ section.heading }}</h2>
              <p class="section-body">{{ section.body }}</p>
            </section>
          }
        </article>

        <aside class="lesson-side">
          <div class="takeaways-card">
            <h3 class="takeaways-title">
              <app-icon name="check" [size]="14"/>
              Key takeaways
            </h3>
            <ul class="takeaways-list">
              @for (t of lesson().keyTakeaways; track t) {
                <li class="takeaway-item">{{ t }}</li>
              }
            </ul>
          </div>

          <div class="practice-card">
            <h3 class="practice-title">Ready to practise?</h3>
            <p class="practice-desc">Apply what you've learned using real market prices.</p>
            <a routerLink="/trade/AAPL" class="btn btn-primary" style="width: 100%; justify-content: center;">
              Open simulator
            </a>
          </div>
        </aside>
      </div>
    </div>
  `,
  styleUrl: './academy-lesson.component.css',
})
export class AcademyLessonComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly lesson = computed(() => {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    return LESSONS[id] ?? DEFAULT_LESSON;
  });
}
