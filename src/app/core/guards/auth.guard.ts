import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.waitForReady();
  return auth.isAuthenticated() ? true : router.createUrlTree(['/auth/login']);
};

export const guestGuard: CanActivateFn = async () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.waitForReady();
  return auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
