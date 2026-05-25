import { TestBed } from '@angular/core/testing';
import { NotificationsService } from './notifications.service';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

const mockSupabase = {
  client: {
    auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({}) },
    from: () => ({
      select: () => ({ eq: () => ({ order: async () => ({ data: [] }) }) }),
      update: () => ({ eq: () => ({ eq: async () => ({}) }) }),
      delete: () => ({ eq: () => ({ eq: async () => ({}) }) }),
      insert: async () => ({ error: null }),
    }),
  },
};

const mockAuth = { user: () => null };

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationsService,
        { provide: AuthService, useValue: mockAuth },
        { provide: SupabaseService, useValue: mockSupabase },
      ],
    });
    service = TestBed.inject(NotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty notifications', () => {
    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });
});
