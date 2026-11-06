import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';
import PayAtRequestDetails from './PayAtRequestDetails';

interface ProviderFormProps {
  parlorId: string;
  caseId?: string;
  clientId?: string;
  invoiceId?: string;
  defaultAmount?: number;
  defaultDescription?: string;
  onCancel: () => void;
  onDone: () => void;
}

interface CreatedRequest {
  paymentId: string;
  reference: string;
  paymentLink?: string;
  accountNumber?: string;
  expiresAt?: string;
  amount: number;
  description: string;
}

interface OpenInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  description: string | null;
  status: string;
}

const inputCls =
  'w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white';
const labelCls = 'block text-sm font-medium text-slate-900 dark:text-white mb-1';

const formatZar = (n: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n);

// supabase.functions.invoke hides the server's JSON error body behind
// error.context (a Response). Pull it out so staff see the real reason,
// e.g. "Parlour needs a valid 5-digit Pay@ prefix".
async function readFunctionError(error: any): Promise<string> {
  try {
    const body = await error?.context?.json?.();
    if (body?.error) return body.error;
  } catch {
    /* not JSON */
  }
  return error?.message || 'Failed to create Pay@ payment request';
}

const PayAtPaymentForm: React.FC<ProviderFormProps> = ({
  parlorId, caseId, clientId, invoiceId, defaultAmount, defaultDescription, onCancel, onDone,
}) => {
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : '');
  const [description, setDescription] = useState(defaultDescription || '');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [invoices, setInvoices] = useState<OpenInvoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoiceId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedRequest | null>(null);
  const [checking, setChecking] = useState(false);

  const { status, payment, refresh } = usePaymentStatus(created?.paymentId ?? null);

  // Prefill customer details from the client record.
  useEffect(() => {
    if (!clientId) return;
    supabase
      .from('clients')
      .select('name, phone, email')
      .eq('id', clientId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setCustomerName((v) => v || data.name || '');
        setCustomerMobile((v) => v || data.phone || '');
        setCustomerEmail((v) => v || data.email || '');
      });
  }, [clientId]);

  // Load unpaid invoices for this client/case so the payment can be linked
  // (the Pay@ callback marks the invoice paid once it's fully covered).
  useEffect(() => {
    if (!parlorId) return;
    let q = supabase
      .from('invoices')
      .select('id, invoice_number, amount, description, status')
      .eq('parlor_id', parlorId)
      .in('status', ['draft', 'sent', 'overdue'])
      .order('issued_at', { ascending: false })
      .limit(50);
    if (clientId) q = q.eq('client_id', clientId);
    else if (caseId) q = q.eq('case_id', caseId);
    q.then(({ data, error }) => {
      if (error) {
        console.warn('Could not load invoices for Pay@ form:', error.message);
        return;
      }
      setInvoices((data as OpenInvoice[]) || []);
    });
  }, [parlorId, clientId, caseId]);

  const handleInvoiceChange = (id: string) => {
    setSelectedInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      if (!amount) setAmount(String(inv.amount));
      if (!description) setDescription(inv.description || `Invoice ${inv.invoice_number}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (customerMobile && !/^\+?\d[\d\s-]{8,14}$/.test(customerMobile.trim())) {
      toast.error('Please enter a valid mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payat-reference', {
        body: {
          parlorId,
          caseId,
          clientId,
          invoiceId: selectedInvoiceId || undefined,
          amount: parsedAmount,
          description: description.trim(),
          customerNameSurname: customerName.trim() || undefined,
          customerMobileNumber: customerMobile.replace(/[\s-]/g, '') || undefined,
          customerEmail: customerEmail.trim() || undefined,
        },
      });

      if (error) throw new Error(await readFunctionError(error));
      if (!data?.paymentId || !data?.reference) throw new Error('Unexpected response from Pay@ service');

      setCreated({
        paymentId: data.paymentId,
        reference: data.reference,
        paymentLink: data.paymentLink,
        accountNumber: data.accountNumber,
        expiresAt: data.expiresAt,
        amount: parsedAmount,
        description: description.trim(),
      });
    } catch (err: any) {
      console.error('Failed to create Pay@ request', err);
      toast.error(err?.message || 'Failed to create Pay@ payment request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    await refresh();
    setChecking(false);
  };

  const startOver = () => {
    setCreated(null);
  };

  // ── Step 1: create the request ──────────────────────────────────
  if (!created) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {invoices.length > 0 && (
          <div>
            <label className={labelCls}>Invoice (optional)</label>
            <select value={selectedInvoiceId} onChange={(e) => handleInvoiceChange(e.target.value)} className={inputCls}>
              <option value="">Not linked to an invoice</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} — {formatZar(Number(inv.amount))} ({inv.status})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelCls}>Amount (ZAR)</label>
          <input type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea rows={2} required value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
        </div>

        <fieldset className="space-y-3 pt-2 border-t border-slate-200 dark:border-gray-700">
          <legend className="text-sm font-semibold text-slate-900 dark:text-white pt-3">Customer</legend>
          <div>
            <label className={labelCls}>Name and surname</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Mobile number</label>
              <input type="tel" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} placeholder="0821234567" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputCls} />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white">
            Back
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Creating…' : 'Create Pay@ request'}
          </button>
        </div>
      </form>
    );
  }

  // ── Step 3a: paid ───────────────────────────────────────────────
  if (status === 'paid') {
    return (
      <div className="space-y-4 text-center py-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">Payment received</p>
        <p className="text-sm text-slate-600 dark:text-gray-300">
          {formatZar(created.amount)} confirmed by Pay@
          {payment?.paidAt ? ` on ${new Date(payment.paidAt).toLocaleString('en-ZA')}` : ''}.
        </p>
        <button onClick={onDone} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Close</button>
      </div>
    );
  }

  // ── Step 3b: failed / expired / cancelled ───────────────────────
  if (status === 'failed' || status === 'expired' || status === 'cancelled') {
    const Icon = status === 'expired' ? Clock : XCircle;
    return (
      <div className="space-y-4 text-center py-4">
        <Icon className={`w-12 h-12 mx-auto ${status === 'expired' ? 'text-amber-500' : 'text-red-500'}`} />
        <p className="text-lg font-medium text-slate-900 dark:text-white">
          {status === 'expired' ? 'This payment request expired' : `Payment ${status}`}
        </p>
        <p className="text-sm text-slate-600 dark:text-gray-300">
          The customer can't pay with reference {created.accountNumber || created.reference} any more. Create a new request to try again.
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={onDone} className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white">Close</button>
          <button onClick={startOver} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create new request</button>
        </div>
      </div>
    );
  }

  // ── Step 2: awaiting payment ────────────────────────────────────
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-slate-600 dark:text-gray-300">
        Share these details with the customer. They can pay {formatZar(created.amount)} at any Pay@ till, in their banking app, or online.
      </p>

      <PayAtRequestDetails
        accountNumber={created.accountNumber}
        reference={created.reference}
        paymentLink={created.paymentLink}
        expiresAt={created.expiresAt}
        amount={created.amount}
        description={created.description}
      />

      <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Waiting for Pay@ to confirm payment…
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={handleCheckStatus}
          disabled={checking}
          className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white inline-flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} /> Check status
        </button>
        <button onClick={onDone} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Done — I'll check back later
        </button>
      </div>
    </div>
  );
};

export default PayAtPaymentForm;
