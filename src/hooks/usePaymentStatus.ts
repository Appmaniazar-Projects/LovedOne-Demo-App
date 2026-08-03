// hooks/usePaymentStatus.ts
//
// Phase 5 from the plan. Rather than pure polling, this uses Supabase
// Realtime (already in your stack) to get instant updates when the
// payat-callback function writes the new status, with a polling fallback
// in case the Realtime subscription drops.

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Payment, PaymentStatus } from '../types/payments';

interface UsePaymentStatusResult {
  payment: Payment | null;
  status: PaymentStatus | null;
  loading: boolean;
  error: string | null;
}

const POLL_INTERVAL_MS = 5000;
const POLL_FALLBACK_AFTER_MS = 10000; // if no Realtime event lands within this, start polling too

export function usePaymentStatus(paymentId: string | null): UsePaymentStatusResult {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!paymentId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPayment() {
      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setPayment(data as unknown as Payment);
        // stop polling once we reach a terminal state
        if (data && ['paid', 'failed', 'expired', 'refunded', 'cancelled'].includes(data.status)) {
          stopPolling();
        }
      }
      setLoading(false);
    }

    function startPolling() {
      if (pollTimer.current) return;
      pollTimer.current = setInterval(fetchPayment, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    }

    // Initial fetch
    fetchPayment();

    // Realtime subscription — instant updates when payat-callback writes
    const channel = supabase
      .channel(`payment-status-${paymentId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'payments', filter: `id=eq.${paymentId}` },
        (payload) => {
          if (cancelled) return;
          setPayment(payload.new as unknown as Payment);
          if (fallbackTimer.current) {
            clearTimeout(fallbackTimer.current);
            fallbackTimer.current = null;
          }
          if (['paid', 'failed', 'expired', 'refunded', 'cancelled'].includes(payload.new.status)) {
            stopPolling();
          }
        }
      )
      .subscribe();

    // If Realtime doesn't deliver anything quickly, fall back to polling
    // so the UI never gets stuck waiting on a dropped subscription.
    fallbackTimer.current = setTimeout(startPolling, POLL_FALLBACK_AFTER_MS);

    return () => {
      cancelled = true;
      stopPolling();
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
      supabase.removeChannel(channel);
    };
  }, [paymentId]);

  return { payment, status: payment?.status ?? null, loading, error };
}
