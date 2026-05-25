import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    canActivate: [guestGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent),
        title: 'Sign in · PaperTrade Pro',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        title: 'Create account · PaperTrade Pro',
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/app-shell/app-shell.component').then(m => m.AppShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard · PaperTrade Pro',
      },
      {
        path: 'markets',
        loadComponent: () =>
          import('./features/markets/markets.component').then(m => m.MarketsComponent),
        title: 'Markets · PaperTrade Pro',
      },
      {
        path: 'portfolio',
        loadComponent: () =>
          import('./features/portfolio/portfolio.component').then(m => m.PortfolioComponent),
        title: 'Portfolio · PaperTrade Pro',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders.component').then(m => m.OrdersComponent),
        title: 'Orders · PaperTrade Pro',
      },
      {
        path: 'trade/:symbol',
        loadComponent: () =>
          import('./features/trade/trade.component').then(m => m.TradeComponent),
        title: 'Trade · PaperTrade Pro',
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
        title: 'Analytics · PaperTrade Pro',
      },
      {
        path: 'onboarding',
        loadComponent: () =>
          import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent),
        title: 'Onboarding · PaperTrade Pro',
      },
      {
        path: 'watchlist',
        loadComponent: () =>
          import('./features/watchlist/watchlist.component').then(m => m.WatchlistComponent),
        title: 'Watchlist · PaperTrade Pro',
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./features/alerts/alerts.component').then(m => m.AlertsComponent),
        title: 'Alerts · PaperTrade Pro',
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
        title: 'Notifications · PaperTrade Pro',
      },
      {
        path: 'competitions',
        loadComponent: () =>
          import('./features/competitions/competitions.component').then(m => m.CompetitionsComponent),
        title: 'Competitions · PaperTrade Pro',
      },
      {
        path: 'competitions/:id',
        loadComponent: () =>
          import('./features/competition-detail/competition-detail.component').then(m => m.CompetitionDetailComponent),
        title: 'Competition · PaperTrade Pro',
      },
      {
        path: 'academy',
        loadComponent: () =>
          import('./features/academy/academy.component').then(m => m.AcademyComponent),
        title: 'Academy · PaperTrade Pro',
      },
      {
        path: 'academy/lesson/:id',
        loadComponent: () =>
          import('./features/academy-lesson/academy-lesson.component').then(m => m.AcademyLessonComponent),
        title: 'Lesson · PaperTrade Pro',
      },
      {
        path: 'academy/glossary',
        loadComponent: () =>
          import('./features/academy-glossary/academy-glossary.component').then(m => m.AcademyGlossaryComponent),
        title: 'Glossary · PaperTrade Pro',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Settings · PaperTrade Pro',
      },
      { path: 'settings/account', redirectTo: 'settings' },
      {
        path: 'help',
        loadComponent: () =>
          import('./features/help/help.component').then(m => m.HelpComponent),
        title: 'Help · PaperTrade Pro',
      },
      {
        path: 'ai-assistant',
        loadComponent: () =>
          import('./features/ai-assistant/ai-assistant.component').then(m => m.AiAssistantComponent),
        title: 'AI Assistant · PaperTrade Pro',
      },
      {
        path: 'achievements',
        loadComponent: () =>
          import('./features/achievements/achievements.component').then(m => m.AchievementsComponent),
        title: 'Achievements · PaperTrade Pro',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Not found · PaperTrade Pro',
  },
];
