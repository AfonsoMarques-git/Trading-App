import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Dynamic trade route: render on demand (SSR) so any symbol works
    path: 'trade/:symbol',
    renderMode: RenderMode.Server,
  },
  {
    path: 'competitions/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'academy/lesson/:id',
    renderMode: RenderMode.Server,
  },
  {
    // Default: prerender all known static routes for fastest TTFB
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
