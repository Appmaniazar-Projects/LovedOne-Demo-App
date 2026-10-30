import { supabase } from '../../supabaseClient';

// Calls an edge function and surfaces its JSON `error` message instead of
// supabase-js's generic "Edge Function returned a non-2xx status code".
export async function invokeFunction<T = any>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message || `${name} failed`;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const parsed = await ctx.json();
        if (parsed?.error) message = parsed.error;
      } catch {
        /* keep the generic message */
      }
    }
    throw new Error(message);
  }
  return data as T;
}

export const payatAdmin = <T = any>(action: string, parlorId: string, extra: Record<string, unknown> = {}) =>
  invokeFunction<T>('payat-admin', { action, parlorId, ...extra });
