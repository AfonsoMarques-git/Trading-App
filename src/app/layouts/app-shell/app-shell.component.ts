import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <app-sidebar/>
      <div class="shell-main">
        <app-topbar/>
        <main class="shell-content" tabindex="-1">
          <router-outlet/>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
      background-color: var(--color-bg-primary);
    }
    .shell-main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .shell-content {
      flex: 1;
      padding: var(--space-6);
      max-width: 1480px;
      width: 100%;
      margin: 0 auto;
      animation: fadeIn var(--transition-base) ease-out;
    }
    @media (max-width: 640px) {
      .shell-content { padding: var(--space-4); }
    }
  `],
})
export class AppShellComponent {}
