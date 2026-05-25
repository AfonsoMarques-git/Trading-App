import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { PortfolioService } from '../../core/services/portfolio.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface Message { role: 'user' | 'assistant'; text: string; timestamp: Date; }

const RESPONSES: { pattern: RegExp; reply: string }[] = [
  { pattern: /win rate|winrate/i,       reply: 'Your current win rate is based on trades where the price moved in your favour since execution. A win rate above 50% is a good baseline — focus on position sizing to protect profits even when the win rate dips.' },
  { pattern: /portfolio|p&l|pnl/i,      reply: 'Your portfolio value combines your cash balance and the current market value of your holdings. Unrealised P&L reflects open position gains/losses; they only become real when you close the trade.' },
  { pattern: /stop.?loss|risk/i,        reply: 'A common rule of thumb is to risk no more than 1–2% of your portfolio on any single trade. Set your stop-loss before entering a position — not after — so emotion doesn\'t drive the decision.' },
  { pattern: /buy|sell|trade|order/i,   reply: 'Before placing any order, consider the trend, support/resistance levels, and your risk per trade. Market orders fill instantly; limit orders give you price control but may not fill if the market moves away.' },
  { pattern: /diversif/i,               reply: 'Diversification across sectors and asset classes reduces unsystematic risk. Holding 8–15 uncorrelated positions is usually enough to benefit from diversification without over-diluting your best ideas.' },
  { pattern: /crypto|bitcoin|btc/i,     reply: 'Crypto assets are highly volatile — typically 3–5× the volatility of equities. Keep position sizes smaller than you would for stocks, and be prepared for large intraday swings.' },
  { pattern: /hello|hi|hey|help/i,      reply: 'Hi! I\'m your AI trading assistant. Ask me about portfolio strategy, risk management, order types, or how to read a chart. I\'m here to help you learn.' },
  { pattern: /market|stock|equity/i,    reply: 'Equity markets react to earnings, macro data, and sentiment. Focus on understanding why a stock moves, not just that it moved. Fundamentals matter for longer holds; technicals matter more for shorter trades.' },
  { pattern: /learn|beginner|start/i,   reply: 'The Academy is a great starting point. Begin with the Trading Basics module, then try placing a few paper trades to apply what you\'ve learned. Real learning happens through doing.' },
];

const FALLBACK = 'That\'s a great question. In general, successful trading comes down to discipline, risk management, and continuous learning. Try the Academy for structured lessons, or ask me something specific about your portfolio or trading strategy.';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow">AI Assistant</span>
          <h1 class="page-title">Trading assistant</h1>
          <p class="page-sub">Ask me anything about trading strategy, risk, or your portfolio.</p>
        </div>
        <button class="btn btn-secondary" (click)="clearChat()">
          <app-icon name="close" [size]="14"/>
          Clear chat
        </button>
      </header>

      <!-- Suggestions -->
      @if (messages().length === 0) {
        <div class="suggestions">
          @for (s of suggestions; track s) {
            <button class="suggestion-chip" (click)="sendSuggestion(s)">{{ s }}</button>
          }
        </div>
      }

      <!-- Chat history -->
      <div class="chat-window" #chatWindow>
        @for (msg of messages(); track msg.timestamp) {
          <div class="message" [class.is-user]="msg.role === 'user'" [class.is-assistant]="msg.role === 'assistant'">
            @if (msg.role === 'assistant') {
              <div class="msg-avatar">
                <app-icon name="ai" [size]="14"/>
              </div>
            }
            <div class="msg-bubble">
              <p class="msg-text">{{ msg.text }}</p>
              <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
            </div>
          </div>
        }
        @if (typing()) {
          <div class="message is-assistant">
            <div class="msg-avatar"><app-icon name="ai" [size]="14"/></div>
            <div class="msg-bubble typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        }
      </div>

      <!-- Input -->
      <div class="chat-input-row">
        <input
          type="text"
          class="chat-input"
          placeholder="Ask about strategy, risk, or your portfolio…"
          [value]="inputText()"
          (input)="inputText.set($any($event.target).value)"
          (keydown.enter)="send()"
          [disabled]="typing()"
        />
        <button class="btn btn-primary" (click)="send()" [disabled]="!inputText().trim() || typing()">
          <app-icon name="trade" [size]="14"/>
          Send
        </button>
      </div>
    </div>
  `,
  styleUrl: './ai-assistant.component.css',
})
export class AiAssistantComponent implements AfterViewChecked {
  private readonly portfolio = inject(PortfolioService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('chatWindow') private chatWindow!: ElementRef<HTMLDivElement>;

  protected readonly messages = signal<Message[]>([
    { role: 'assistant', text: 'Hello! I\'m your AI trading assistant. I can help with trading strategy, risk management, order types, and reading your portfolio. What would you like to know?', timestamp: new Date() },
  ]);
  protected readonly inputText = signal('');
  protected readonly typing = signal(false);

  protected readonly suggestions = [
    'How do I improve my win rate?',
    'Explain stop-loss orders',
    'What is diversification?',
    'How should I manage risk?',
  ];

  protected sendSuggestion(text: string): void {
    this.inputText.set(text);
    this.send();
  }

  protected send(): void {
    const text = this.inputText().trim();
    if (!text || this.typing()) return;

    this.messages.update(prev => [...prev, { role: 'user', text, timestamp: new Date() }]);
    this.inputText.set('');
    this.typing.set(true);

    const reply = this.getReply(text);
    setTimeout(() => {
      this.messages.update(prev => [...prev, { role: 'assistant', text: reply, timestamp: new Date() }]);
      this.typing.set(false);
      this.cdr.markForCheck();
    }, 900 + Math.random() * 600);
  }

  protected clearChat(): void {
    this.messages.set([{ role: 'assistant', text: 'Chat cleared. Ask me anything!', timestamp: new Date() }]);
  }

  protected formatTime(d: Date): string {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private getReply(text: string): string {
    for (const r of RESPONSES) {
      if (r.pattern.test(text)) return r.reply;
    }
    return FALLBACK;
  }

  ngAfterViewChecked(): void {
    if (this.chatWindow?.nativeElement) {
      const el = this.chatWindow.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
