import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

const mockSupabase = {
  client: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({}),
      signInWithPassword: async ({ email }: { email: string }) => {
        if (email === 'demo@papertrade.pro') return { data: { user: { id: 'uid-1' } }, error: null };
        return { data: null, error: { message: 'Invalid credentials' } };
      },
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  },
};

describe('LoginComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        AuthService,
        { provide: SupabaseService, useValue: mockSupabase },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render email and password inputs', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#email')).not.toBeNull();
    expect(el.querySelector('#password')).not.toBeNull();
  });

  it('should render the sign-in button', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.textContent).toContain('Sign in');
  });

  it('should pre-fill demo credentials', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    expect(comp.email).toBe('demo@papertrade.pro');
    expect(comp.password).toBe('Demo1234!');
  });
});
