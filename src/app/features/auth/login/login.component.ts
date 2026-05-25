import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-card fade-in">
      <header class="auth-header">
        <span class="eyebrow">Welcome back</span>
        <h2 class="title">Sign in to your account</h2>
        <p class="subtitle">Enter your credentials to access your paper trading dashboard.</p>
      </header>

      <form class="auth-form" (submit)="onSubmit($event)" novalidate>
        <div class="input-group">
          <label class="input-label" for="email">Email</label>
          <input
            id="email"
            class="input"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            [(ngModel)]="email"
            name="email"
            required
          />
        </div>

        <div class="input-group">
          <div class="label-row">
            <label class="input-label" for="password">Password</label>
            <a class="forgot-link" href="#">Forgot password?</a>
          </div>
          <div class="password-input">
            <input
              id="password"
              class="input"
              [type]="showPassword() ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              [(ngModel)]="password"
              name="password"
              required
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
        </div>

        <label class="checkbox">
          <input type="checkbox" [(ngModel)]="remember" name="remember"/>
          <span>Keep me signed in for 30 days</span>
        </label>

        @if (errorMsg(); as e) {
          <div class="form-error" role="alert">{{ e }}</div>
        }

        <button type="submit" class="btn btn-primary btn-lg btn-block" [disabled]="submitting()">
          @if (submitting()) {
            <span>Signing in…</span>
          } @else {
            <span>Sign in</span>
          }
        </button>

        <div class="divider"><span>or continue with</span></div>

        <div class="social-row">
          <button type="button" class="btn btn-secondary social-btn">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#fff" d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.66-5.85-5.95 0-3.29 2.63-5.95 5.85-5.95 1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.84 4 14.69 3 12 3 6.92 3 2.8 7.12 2.8 12.2 2.8 17.28 6.92 21.4 12 21.4c6.93 0 9.5-4.86 9.5-7.34 0-.5-.05-.86-.15-1.96z"/></svg>
            Google
          </button>
          <button type="button" class="btn btn-secondary social-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.26 5.69.41.35.78 1.04.78 2.11 0 1.53-.01 2.76-.01 3.13 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
            GitHub
          </button>
        </div>

        <p class="alt-link">
          Don't have an account?
          <a routerLink="/auth/register">Create one free</a>
        </p>
      </form>
    </div>
  `,
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  protected email = 'demo@papertrade.pro';
  protected password = 'Demo1234!';
  protected remember = true;

  protected readonly showPassword = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  toggleShow() { this.showPassword.update(v => !v); }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMsg.set(null);
    this.submitting.set(true);
    this.cdr.markForCheck();

    const result = await this.auth.login(this.email, this.password);

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
