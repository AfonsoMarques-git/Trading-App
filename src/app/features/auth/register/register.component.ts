import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-card fade-in">
      <header class="auth-header">
        <span class="eyebrow">Get started</span>
        <h2 class="title">Create your trading account</h2>
        <p class="subtitle">Start trading with $100,000 in virtual capital. No credit card required.</p>
      </header>

      <form class="auth-form" (submit)="onSubmit($event)" novalidate>
        <div class="input-group">
          <label class="input-label" for="name">Display name</label>
          <input
            id="name"
            class="input"
            type="text"
            autocomplete="name"
            placeholder="Alex Morgan"
            [ngModel]="displayName()"
            (ngModelChange)="displayName.set($event)"
            name="displayName"
            required
          />
        </div>

        <div class="input-group">
          <label class="input-label" for="email">Email</label>
          <input
            id="email"
            class="input"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            [ngModel]="email()"
            (ngModelChange)="email.set($event)"
            name="email"
            required
          />
        </div>

        <div class="input-group">
          <label class="input-label" for="password">Password</label>
          <div class="password-input">
            <input
              id="password"
              class="input"
              [type]="showPassword() ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="At least 8 characters"
              [ngModel]="password()"
              (ngModelChange)="password.set($event)"
              name="password"
              required
              minlength="8"
            />
            <button
              type="button"
              class="password-toggle"
              (click)="toggleShow()"
              [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
            >
              <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="16"/>
            </button>
          </div>
          @if (password()) {
            <div class="strength">
              <div class="strength-bar" [class.active]="strength() >= 1" [attr.data-level]="strength()"></div>
              <div class="strength-bar" [class.active]="strength() >= 2" [attr.data-level]="strength()"></div>
              <div class="strength-bar" [class.active]="strength() >= 3" [attr.data-level]="strength()"></div>
              <div class="strength-bar" [class.active]="strength() >= 4" [attr.data-level]="strength()"></div>
              <span class="strength-label" [attr.data-level]="strength()">{{ strengthLabel() }}</span>
            </div>
          }
        </div>

        <label class="checkbox">
          <input type="checkbox" [(ngModel)]="agreeTos" name="agreeTos" required/>
          <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</span>
        </label>

        @if (errorMsg(); as e) {
          <div class="form-error" role="alert">{{ e }}</div>
        }

        <button type="submit" class="btn btn-primary btn-lg btn-block" [disabled]="submitting() || !agreeTos">
          @if (submitting()) {
            <span>Creating account…</span>
          } @else {
            <span>Create free account</span>
          }
        </button>

        <p class="alt-link">
          Already have an account?
          <a routerLink="/auth/login">Sign in instead</a>
        </p>
      </form>
    </div>
  `,
  styleUrls: ['../login/login.component.css', './register.component.css'],
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly displayName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected agreeTos = false;

  protected readonly showPassword = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  protected readonly strength = computed(() => {
    const p = this.password();
    let score = 0;
    if (!p) return 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  });

  protected readonly strengthLabel = computed(() => {
    const s = this.strength();
    if (!this.password()) return '';
    return ['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'][s] ?? '';
  });

  toggleShow() { this.showPassword.update(v => !v); }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMsg.set(null);

    if (!this.agreeTos) {
      this.errorMsg.set('You must agree to the Terms of Service to continue.');
      return;
    }
    if (this.password().length < 8) {
      this.errorMsg.set('Password must be at least 8 characters.');
      return;
    }

    this.submitting.set(true);
    this.cdr.markForCheck();

    const result = await this.auth.register(this.email(), this.password(), this.displayName());

    if (!result.ok) {
      this.errorMsg.set(result.error);
      this.submitting.set(false);
      this.cdr.markForCheck();
      return;
    }

    this.submitting.set(false);
    this.router.navigate(['/dashboard']);
  }
}
