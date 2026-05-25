import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NotificationsService, NotifType } from '../../core/services/notifications.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type Filter = 'all' | NotifType;

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [IconComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow">Notifications</span>
          <h1 class="page-title">Activity</h1>
          <p class="page-sub">{{ notifs.unreadCount() }} unread</p>
        </div>
        @if (notifs.unreadCount() > 0) {
          <button class="btn btn-secondary" (click)="notifs.markAllRead()">
            <app-icon name="check" [size]="14"/>
            Mark all read
          </button>
        }
      </header>

      <!-- Filter tabs -->
      <div class="filter-row">
        <div class="filter-tabs" role="tablist">
          @for (f of filters; track f.id) {
            <button
              class="filter-tab"
              role="tab"
              [class.is-active]="filter() === f.id"
              (click)="filter.set(f.id)"
            >
              {{ f.label }}
              <span class="filter-count">{{ countFor(f.id) }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Notification list -->
      @if (filtered().length === 0) {
        <app-empty-state
          title="No notifications"
          description="Activity from your trades, alerts, and the system will appear here."
        />
      } @else {
        <div class="notif-list">
          @for (n of filtered(); track n.id) {
            <div
              class="notif-row"
              [class.is-unread]="!n.read"
              (click)="notifs.markRead(n.id)"
            >
              <div class="notif-icon-wrap" [class]="'type-' + n.type">
                <app-icon [name]="iconFor(n.type)" [size]="14"/>
              </div>
              <div class="notif-content">
                <p class="notif-title">{{ n.title }}</p>
                <p class="notif-body">{{ n.body }}</p>
                <span class="notif-time">{{ formatTime(n.timestamp) }}</span>
              </div>
              @if (!n.read) {
                <span class="unread-dot" aria-label="Unread"></span>
              }
              <button class="btn-icon notif-delete" title="Dismiss" (click)="dismiss($event, n.id)">
                <app-icon name="close" [size]="12"/>
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent {
  protected readonly notifs = inject(NotificationsService);

  protected readonly filter = signal<Filter>('all');

  protected readonly filters: { id: Filter; label: string }[] = [
    { id: 'all',    label: 'All'     },
    { id: 'order',  label: 'Orders'  },
    { id: 'alert',  label: 'Alerts'  },
    { id: 'risk',   label: 'Risk'    },
    { id: 'system', label: 'System'  },
  ];

  protected readonly filtered = computed(() => {
    const f = this.filter();
    const all = this.notifs.notifications();
    return f === 'all' ? all : all.filter(n => n.type === f);
  });

  protected countFor(f: Filter): number {
    const all = this.notifs.notifications();
    return f === 'all' ? all.length : all.filter(n => n.type === f).length;
  }

  protected iconFor(type: NotifType): 'trade' | 'alerts' | 'help' | 'bell' {
    const map: Record<NotifType, 'trade' | 'alerts' | 'help' | 'bell'> = {
      order: 'trade', alert: 'alerts', risk: 'help', system: 'bell',
    };
    return map[type];
  }

  protected formatTime(d: Date): string {
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  protected dismiss(e: Event, id: string): void {
    e.stopPropagation();
    this.notifs.delete(id);
  }
}
