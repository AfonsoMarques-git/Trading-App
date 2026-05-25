import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

export type NotifType = 'order' | 'alert' | 'risk' | 'system';

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  constructor() {
    if (!this.isBrowser) return;
    effect(() => {
      const user = this.auth.user();
      if (user) this.load(user.id);
      else this.notifications.set([]);
    });
  }

  private async load(userId: string): Promise<void> {
    const { data } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) {
      this.notifications.set(data.map((r: any) => ({
        id: r.id,
        type: r.type as NotifType,
        title: r.title,
        body: r.body,
        read: r.read,
        timestamp: new Date(r.created_at),
      })));
    }
  }

  async markRead(id: string): Promise<void> {
    const userId = this.auth.user()?.id;
    this.notifications.update(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (userId) await this.supabase.client.from('notifications').update({ read: true }).eq('id', id).eq('user_id', userId);
  }

  async markAllRead(): Promise<void> {
    const userId = this.auth.user()?.id;
    this.notifications.update(prev => prev.map(n => ({ ...n, read: true })));
    if (userId) await this.supabase.client.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  }

  async delete(id: string): Promise<void> {
    const userId = this.auth.user()?.id;
    this.notifications.update(prev => prev.filter(n => n.id !== id));
    if (userId) await this.supabase.client.from('notifications').delete().eq('id', id).eq('user_id', userId);
  }

  async add(notif: Omit<AppNotification, 'id' | 'read' | 'timestamp'>): Promise<void> {
    const userId = this.auth.user()?.id;
    const newNotif: AppNotification = {
      ...notif, id: `n-${Math.random().toString(36).slice(2, 7)}`, read: false, timestamp: new Date(),
    };
    this.notifications.update(prev => [newNotif, ...prev]);
    if (userId) {
      await this.supabase.client.from('notifications').insert({
        id: newNotif.id, user_id: userId, type: notif.type, title: notif.title, body: notif.body,
      });
    }
  }
}
