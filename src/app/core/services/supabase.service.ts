import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/** Returns true when the environment has real Supabase credentials. */
function hasValidConfig(): boolean {
  return (
    environment.supabaseUrl.startsWith('http') &&
    environment.supabaseKey.length > 20
  );
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient;
  readonly configured = hasValidConfig();

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));

    if (this.configured) {
      this.client = createClient(environment.supabaseUrl, environment.supabaseKey, {
        auth: {
          persistSession: browser,
          autoRefreshToken: browser,
          detectSessionInUrl: browser,
        },
      });
    } else {
      // Placeholder client used during build / before credentials are set.
      // All calls on this client will fail gracefully — services handle null data.
      this.client = createClient('https://placeholder.supabase.co', 'placeholder-key-000000000000000000000000', {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
  }
}
