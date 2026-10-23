import { createClient, SupabaseClient } from '@supabase/supabase-js';

const memoryStorage = new Map<string, string>();

const safeBrowserStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback to in-memory storage when iframe blocks localStorage
    }
    return memoryStorage.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback to in-memory storage when iframe blocks localStorage
    }
    memoryStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Fallback to in-memory storage when iframe blocks localStorage
    }
    memoryStorage.delete(key);
  },
};

const envObj = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ({} as Record<string, string>);
const rawUrl = (envObj.VITE_SUPABASE_URL || '').trim();
const rawAnonKey = (envObj.VITE_SUPABASE_ANON_KEY || '').trim();

export function isSupabaseClientConfigured(): boolean {
  if (!rawUrl || !rawAnonKey) return false;
  if (
    rawUrl.includes('your-project-ref.supabase.co') ||
    rawUrl === 'MY_SUPABASE_URL' ||
    rawAnonKey === 'your-public-anon-key' ||
    rawAnonKey === 'MY_SUPABASE_ANON_KEY'
  ) {
    return false;
  }
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function initSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseClientConfigured()) return null;
  try {
    return createClient(rawUrl, rawAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: safeBrowserStorage,
      },
    });
  } catch (err) {
    console.warn('Supabase client initialization fallback:', err);
    return null;
  }
}

export const supabase: SupabaseClient | null = initSupabaseClient();

export function getSupabaseProjectHost(): string | null {
  if (!isSupabaseClientConfigured()) return null;
  try {
    return new URL(rawUrl).host;
  } catch {
    return null;
  }
}
