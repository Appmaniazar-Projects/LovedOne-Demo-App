import React, { useEffect, useState } from 'react';
import { X, Banknote, Landmark, QrCode, CreditCard, Repeat } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { PaymentMethod } from '../../types/payments';
import CashPaymentForm from '../Payments/CashPaymentForm';
import EftPaymentForm from '../Payments/EftPaymentForm';
import PayAtPaymentForm from '../Payments/PayAtPaymentForm';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  parlorId: string;
  caseId?: string;
  clientId?: string;
  onPaymentCreated?: () => void;
}

interface MethodOption {
  method: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const ALL_METHODS: MethodOption[] = [
  { method: 'cash', label: 'Cash', icon: <Banknote className="w-5 h-5" />, description: 'Payment received in person' },
  { method: 'eft', label: 'EFT / Bank Transfer', icon: <Landmark className="w-5 h-5" />, description: 'Bank details + reference, optional POP upload' },
  { method: 'payat', label: 'Pay@', icon: <QrCode className="w-5 h-5" />, description: 'Retail store or QR payment via Pay@' }
];


const ALWAYS_AVAILABLE: PaymentMethod[] = ['cash', 'eft', 'payat'];

const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  isOpen,
  onClose,
  parlorId,
  caseId,
  clientId,
  onPaymentCreated,
}) => {
  const [enabledMethods, setEnabledMethods] = useState<PaymentMethod[]>(ALWAYS_AVAILABLE);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);

  useEffect(() => {
    if (!isOpen || !parlorId) return;
    setSelectedMethod(null);
    loadEnabledProviders();
  }, [isOpen, parlorId]);

  const loadEnabledProviders = async () => {
    setLoadingProviders(true);
    try {
      const { data, error } = await supabase
        .from('parlor_payment_providers')
        .select('provider, is_enabled')
        .eq('parlor_id', parlorId)
        .eq('is_enabled', true);

      if (error) throw error;

      const providerMethods = (data || []).map((row: any) => row.provider as PaymentMethod);
      setEnabledMethods([...ALWAYS_AVAILABLE, ...providerMethods]);
    } catch (e) {
      console.error('Failed to load enabled payment providers', e);
      setEnabledMethods(ALWAYS_AVAILABLE);
    } finally {
      setLoadingProviders(false);
    }
  };

  if (!isOpen) return null;

  const visibleMethods = ALL_METHODS.filter((m) => enabledMethods.includes(m.method));

  const handleDone = () => {
    onPaymentCreated?.();
    onClose();
  };

  const renderForm = () => {
    const shared = { parlorId, caseId, clientId, onCancel: () => setSelectedMethod(null), onDone: handleDone };
    switch (selectedMethod) {
      case 'cash':
        return <CashPaymentForm {...shared} />;
      case 'eft':
        return <EftPaymentForm {...shared} />;
      case 'payat':
        return <PayAtPaymentForm {...shared} />;
        
        // the equivalent build-out these would need with their own providers.
        return (
          <div className="text-center py-8">
            <p className="text-slate-600 dark:text-gray-300">
              This payment method isn't wired up to a provider yet.
            </p>
            <button
              onClick={() => setSelectedMethod(null)}
              className="mt-4 px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white"
            >
              Back
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-lg shadow-2xl w-full max-w-lg relative bg-white dark:bg-gray-900 border border-white/20 dark:border-gray-700/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {selectedMethod ? 'Collect Payment' : 'Choose Payment Method'}
          </h2>
          <p className="text-slate-600 dark:text-gray-300 mb-6">
            {selectedMethod
              ? ALL_METHODS.find((m) => m.method === selectedMethod)?.description
              : 'Select how the customer is paying'}
          </p>

          {!selectedMethod && (
            loadingProviders ? (
              <div className="text-center py-8 text-slate-500">Loading available methods…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibleMethods.map((opt) => (
                  <button
                    key={opt.method}
                    onClick={() => setSelectedMethod(opt.method)}
                    className="flex items-center gap-3 p-4 border border-slate-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                  >
                    <span className="text-blue-600 dark:text-blue-400">{opt.icon}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{opt.label}</span>
                  </button>
                ))}
                {visibleMethods.length === ALWAYS_AVAILABLE.length && (
                  <p className="col-span-full text-xs text-slate-400 mt-2">
                    Only cash and EFT are enabled for this parlour. Enable Pay@ or other
                    providers in parlour settings once onboarded.
                  </p>
                )}
              </div>
            )
          )}

          {selectedMethod && renderForm()}
        </div>
      </div>
    </div>
  );
};

export default CollectPaymentModal;
