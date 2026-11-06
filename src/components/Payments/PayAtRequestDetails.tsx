import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, ExternalLink, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PayAtRequestDetailsProps {
  accountNumber?: string | null;
  reference?: string | null;
  paymentLink?: string | null;
  expiresAt?: string | null;
  amount?: number | null;
  description?: string | null;
}

const copy = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied.`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}.`);
  }
};

const Row: React.FC<{ label: string; value: string; mono?: boolean; large?: boolean }> = ({ label, value, mono, large }) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <div className="min-w-0 text-left">
      <p className="text-xs text-slate-500 dark:text-gray-400">{label}</p>
      <p className={`${mono ? 'font-mono tracking-wider' : ''} ${large ? 'text-xl font-bold' : 'text-sm'} text-slate-900 dark:text-white break-all`}>
        {value}
      </p>
    </div>
    <button
      type="button"
      onClick={() => copy(value, label)}
      className="shrink-0 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
      aria-label={`Copy ${label}`}
    >
      <Copy className="w-4 h-4" />
    </button>
  </div>
);

/**
 * Everything Pay@ hands back for a payment request: the payable account
 * number (works at any till or banking app), the reference, and the
 * payment link + QR for paying online.
 */
const PayAtRequestDetails: React.FC<PayAtRequestDetailsProps> = ({
  accountNumber, reference, paymentLink, expiresAt, amount, description,
}) => {
  const formattedAmount = amount != null
    ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)
    : null;

  const share = async () => {
    if (!paymentLink) return;
    const text = [
      'Payment request',
      description ? `For: ${description}` : null,
      formattedAmount ? `Amount: ${formattedAmount}` : null,
      accountNumber ? `Pay@ account number: ${accountNumber} (pay at any Pay@ till or banking app)` : null,
      `Or pay online: ${paymentLink}`,
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Payment request', text });
        return;
      } catch {
        /* user cancelled share sheet — fall back to copy */
      }
    }
    copy(text, 'Payment message');
  };

  return (
    <div className="space-y-4">
      {paymentLink && (
        <div className="flex flex-col items-center">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <QRCodeSVG value={paymentLink} size={176} level="M" />
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">Customer scans to pay online</p>
        </div>
      )}

      <div className="divide-y divide-slate-200 dark:divide-gray-700 px-4 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
        {accountNumber && <Row label="Pay@ account number" value={accountNumber} mono large />}
        {reference && reference !== accountNumber && <Row label="Pay@ reference" value={reference} mono />}
        {paymentLink && <Row label="Payment link" value={paymentLink} />}
      </div>

      {(accountNumber || reference) && (
        <p className="text-xs text-slate-500 dark:text-gray-400">
          The customer can pay with this number at any Pay@ retail till (cash or card) or in their banking app.
        </p>
      )}

      {paymentLink && (
        <div className="flex flex-wrap justify-center gap-2">
          <a
            href={paymentLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700"
          >
            <ExternalLink className="w-4 h-4" /> Open link
          </a>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700"
          >
            <Share2 className="w-4 h-4" /> Share with customer
          </button>
        </div>
      )}

      {expiresAt && (
        <p className="text-xs text-center text-slate-500">Expires {new Date(expiresAt).toLocaleString('en-ZA')}</p>
      )}
    </div>
  );
};

export default PayAtRequestDetails;
