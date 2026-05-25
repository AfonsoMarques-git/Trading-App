import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseService } from './supabase.service';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  initials: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _user = signal<AuthUser | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = () => this._user() !== null;

  private readyResolve!: () => void;
  private readonly readyPromise = new Promise<void>(res => { this.readyResolve = res; });

  /** Resolves once the initial session check is done. Used by authGuard. */
  waitForReady(): Promise<void> { return this.readyPromise; }

  constructor() {
    if (this.isBrowser) {
      this.initSession();
      this.supabase.client.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          this._user.set(null);
        }
        // When session appears via onAuthStateChange we intentionally do NOT
        // call loadProfile here — login() and register() await it explicitly.
        // initSession() covers the "returning user" (page refresh) path.
      });
    } else {
      // SSR: resolve immediately with no user
      this.readyResolve();
    }
  }

  private async initSession(): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      if (session) {
        await this.loadProfile(session.user.id, session.user.email ?? '');
      }
    } catch (e) {
      console.error('[auth] initSession error:', e);
    } finally {
      this.readyResolve();
    }
  }

  /** Always resolves — never throws. Sets _user even if DB queries fail. */
  private async loadProfile(userId: string, email: string): Promise<void> {
    const fallbackName = email.split('@')[0] ?? 'Trader';
    let displayName = fallbackName;

    try {
      // Ensure profile row exists (trigger may not have fired for this account).
      // ignoreDuplicates: true → ON CONFLICT DO NOTHING, so existing balance is preserved.
      await this.supabase.client
        .from('profiles')
        .upsert(
          { id: userId, display_name: fallbackName, cash_balance: 100000.00 },
          { onConflict: 'id', ignoreDuplicates: true },
        );

      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();

      if (error) console.error('[auth] profile select error:', error);
      if (data?.display_name) displayName = data.display_name;
    } catch (e) {
      console.error('[auth] loadProfile DB error (continuing with fallback):', e);
    }

    this._user.set({
      id: userId,
      email,
      displayName,
      initials: displayName
        .trim()
        .split(/\s+/)
        .map((w: string) => w[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('') || 'PT',
    });
  }

  async login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };

      // Await profile load so _user is set before the caller navigates —
      // the auth guard checks isAuthenticated() synchronously after navigation.
      if (data.user) {
        await this.loadProfile(data.user.id, data.user.email ?? email);
      }
      return { ok: true };
    } catch (e: any) {
      console.error('[auth] login error:', e);
      return { ok: false, error: e?.message ?? 'Login failed. Check your connection and try again.' };
    }
  }

  async register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const { data, error } = await this.supabase.client.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName.trim() } },
      });
      if (error) return { ok: false, error: error.message };

      // When auto-confirm is enabled the user gets a session immediately.
      if (data.user && data.session) {
        await this.loadProfile(data.user.id, data.user.email ?? email);
      }
      return { ok: true };
    } catch (e: any) {
      console.error('[auth] register error:', e);
      return { ok: false, error: e?.message ?? 'Registration failed. Check your connection and try again.' };
    }
  }

  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this._user.set(null);
  }
}
