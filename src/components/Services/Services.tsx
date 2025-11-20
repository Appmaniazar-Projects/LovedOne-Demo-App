import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Heart, 
  Users, 
  Shield, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Globe,
  Mail,
  Clock,
  Info,
  Award,
  Check,
  ArrowRight,
  X,
  Send
} from 'lucide-react';

interface PlanCardProps {
  title: string;
  premium: string;
  members?: string;
  benefits: string[];
  accent: 'blue' | 'green' | 'purple' | 'amber';
  icon: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  isPopular?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ title, premium, members, benefits, accent, icon, isSelected, onSelect, isPopular }) => {
  const { theme } = useTheme();
  
  const accentColors = {
    blue: 'from-blue-500 to-cyan-400',
    green: 'from-green-500 to-emerald-400',
    purple: 'from-purple-500 to-pink-400',
    amber: 'from-amber-500 to-orange-400'
  };

  const borderColors = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    purple: 'border-purple-500',
    amber: 'border-amber-500'
  };

  const bgColors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    amber: 'bg-amber-50 dark:bg-amber-900/20'
  };

  return (
    <div className={`relative rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      isSelected 
        ? `${borderColors[accent]} ${bgColors[accent]} shadow-lg scale-105` 
        : theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
            MOST POPULAR
          </span>
        </div>
      )}
      
      {isSelected && (
        <div className="absolute -top-3 -right-3">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${accentColors[accent]} flex items-center justify-center shadow-lg`}>
            <Check className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      <div className={`h-1 w-full bg-gradient-to-r ${accentColors[accent]} rounded-t-xl mb-4`} />
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      </div>
      
      <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Monthly Premium</span>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">{premium}</span>
        </div>
      </div>

      {members && (
        <div className="mb-4">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
            {members}
          </span>
        </div>
      )}

      <ul className="space-y-2 mb-6">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}>{benefit}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
          isSelected
            ? `bg-gradient-to-r ${accentColors[accent]} text-white shadow-lg hover:shadow-xl`
            : theme === 'dark'
            ? 'bg-gray-700 text-white hover:bg-gray-600'
            : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
        }`}
      >
        {isSelected ? (
          <>
            <Check className="w-5 h-5" />
            Selected
          </>
        ) : (
          <>
            Select Plan
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
};

interface PriceTableProps {
  title: string;
  rows: { members: string; cover: string; premium: string }[];
  icon?: React.ReactNode;
  accent?: 'blue' | 'purple' | 'green' | 'amber';
  variant?: 'members-contribution' | 'extended-funeral' | 'default';
}

const PriceTable: React.FC<PriceTableProps> = ({ title, rows, icon, accent = 'blue', variant = 'default' }) => {
  const { theme } = useTheme();
  
  const accentColors = {
    blue: {
      gradient: 'from-blue-500 to-cyan-500',
      icon: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      border: 'border-blue-200 dark:border-blue-700',
      bg: 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20'
    },
    purple: {
      gradient: 'from-purple-500 to-pink-500',
      icon: 'bg-gradient-to-br from-purple-500 to-pink-500',
      border: 'border-purple-200 dark:border-purple-700',
      bg: 'bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20'
    },
    green: {
      gradient: 'from-green-500 to-emerald-500',
      icon: 'bg-gradient-to-br from-green-500 to-emerald-500',
      border: 'border-green-200 dark:border-green-700',
      bg: 'bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20'
    },
    amber: {
      gradient: 'from-amber-500 to-orange-500',
      icon: 'bg-gradient-to-br from-amber-500 to-orange-500',
      border: 'border-amber-200 dark:border-amber-700',
      bg: 'bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-900/20'
    }
  };

  const colors = accentColors[accent];
  
  return (
    <div className={`rounded-xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${colors.border} ${colors.bg}`}>
      <div className="flex items-center gap-3 mb-6">
        {icon && (
          <div className={`w-12 h-12 rounded-full ${colors.icon} flex items-center justify-center shadow-lg`}>
            {icon}
          </div>
        )}
        <div>
          <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Choose your coverage level</p>
        </div>
      </div>
      
      <div className="overflow-hidden rounded-xl border-2 border-slate-200 dark:border-gray-700 shadow-md">
        <table className="w-full">
          <thead className={`bg-gradient-to-r ${colors.gradient}`}>
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-white">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Members
                </div>
              </th>
              <th className="px-6 py-4 text-center text-sm font-bold text-white">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  Cover
                </div>
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-white">
                <div className="flex items-center justify-end gap-2">
                  <span className="font-bold">R</span>
                  Premium
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
            {rows.map((row, index) => (
              <tr 
                key={index} 
                className={`group transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700/50 bg-gray-800/50' 
                    : 'hover:bg-slate-50 bg-white'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-slate-100'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium">{row.members}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    theme === 'dark' 
                      ? 'bg-blue-900/30 text-blue-300' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    <Shield className="w-3 h-3" />
                    {row.cover}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{row.premium}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/month</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

            {accent === 'purple' && (
        <div className={`mt-4 p-4 rounded-lg border-2 ${
          theme === 'dark' ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-purple-900 dark:text-purple-200 mb-1">NB: Children Under 6 Years</p>
              <p className="text-sm text-purple-800 dark:text-purple-300">
                Children under the age of 6 will be given service (burial), tent and 40 chairs with hearse only
              </p>
            </div>
          </div>
        </div>
      )}
      
      {accent === 'blue' && variant === 'members-contribution' && (
        <div className={`mt-4 p-5 rounded-xl border-2 shadow-md ${
          theme === 'dark' ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border-blue-600' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300'
        }`}>
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-300 dark:border-blue-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-blue-900 dark:text-blue-100">Important Terms & Conditions</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">Please read carefully</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Age Requirement */}
            <div className="group p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">Age Requirement</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">All members must be under 65 years old</p>
                </div>
              </div>
            </div>
            
            {/* Family Relationship */}
            <div className="group p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">Family Relationship</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">They must be family related</p>
                </div>
              </div>
            </div>
            
            {/* Replacement Policy */}
            <div className="group p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">Replacement Policy</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">No replacement after death of a member</p>
                </div>
              </div>
            </div>
            
            {/* Children Payout Structure */}
            <div className="group p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">Children Payout Structure</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">Children under 14 years old have a percentage payout:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className={`p-2 rounded-lg text-center ${
                      theme === 'dark' ? 'bg-blue-800/40' : 'bg-white'
                    } border border-blue-300 dark:border-blue-600`}>
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">1-5 years</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">25%</p>
                    </div>
                    
                    <div className={`p-2 rounded-lg text-center ${
                      theme === 'dark' ? 'bg-blue-800/40' : 'bg-white'
                    } border border-blue-300 dark:border-blue-600`}>
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">6-13 years</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">50%</p>
                    </div>
                    
                    <div className={`p-2 rounded-lg text-center ${
                      theme === 'dark' ? 'bg-blue-800/40' : 'bg-white'
                    } border border-blue-300 dark:border-blue-600`}>
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">14-65 years</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">100%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {accent === 'blue' && variant === 'extended-funeral' && (
        <div className={`mt-4 p-5 rounded-xl border-2 shadow-md ${
          theme === 'dark' ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border-blue-600' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300'
        }`}>
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-300 dark:border-blue-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-blue-900 dark:text-blue-100">99 Months Waiting Period</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">Important coverage information</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Age Group */}
            <div className="group p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">Age Group Coverage</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">Available for members aged 65-84 years</p>
                </div>
              </div>
            </div>
            
            {/* Catering */}
            <div className="group p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">Catering / Izandla</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">R60 - Caters for the whole family</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`mt-4 p-3 rounded-lg ${
        theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
      }`}>
        <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>All premiums are monthly payments. Terms and conditions apply.</span>
        </p>
      </div>
      

    </div>
  );
};

interface SelectedPlan {
  name: string;
  coverage: string;
  premium: string;
}

const Services: React.FC = () => {
  const { theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  const handlePlanSelect = (planName: string, coverage: string, premium: string) => {
    console.log('Plan selected:', { planName, coverage, premium });
    try {
      // If clicking the same plan, deselect it
      if (selectedPlan?.name === planName) {
        setSelectedPlan(null);
        setShowInquiryModal(false);
      } else {
        // Select new plan and show modal
        const newPlan = { name: planName, coverage, premium };
        console.log('Setting new plan:', newPlan);
        setSelectedPlan(newPlan);
        setShowInquiryModal(true);
      }
    } catch (error) {
      console.error('Error in handlePlanSelect:', error);
    }
  };

  const isPlanSelected = (planName: string) => {
    return selectedPlan?.name === planName;
  };

  return (
    <div className={`min-h-screen p-6 space-y-10 ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'}`}>
      {/* Decorative Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-blue-400 to-purple-400" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-green-400 to-cyan-400" />
      </div>

      {/* Header */}
      <div className="relative">
        <div className={`rounded-2xl border overflow-hidden shadow-xl ${
          theme === 'dark' ? 'border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800' : 'border-slate-200 bg-gradient-to-br from-white to-slate-50'
        }`}>
          <div className="px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">🕊️</div>
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-green-600">
                  UBUNYE FUNERALS
                </h1>
              </div>
              <p className={`text-lg flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
                <Heart className="w-5 h-5 text-rose-500" />
                Caring and Always There For You
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-blue-500" />
                <span>Tel: 031 504 4185</span>
                <span className="mx-2">•</span>
                <span>Fax: 086 684 9777 / 086 516 0914</span>
              </div>
            </div>
            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-200'}`}>
              <img src="/api/placeholder/150/150" alt="Ubunye Funerals Logo" className="w-32 h-32 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Funeral Plans */}
      <div>
        <h2 className={`text-3xl font-bold mb-3 text-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Our Funeral Plans
        </h2>
        <p className={`text-center mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
          Select the plan that best suits your family's needs
        </p>
        
        {selectedPlan && (
          <div className={`mb-6 p-4 rounded-lg border-2 border-green-500 ${theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-300">Plan Selected</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>{selectedPlan.name} - {selectedPlan.premium}/month</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Change Plan
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PlanCard
            title="FAMILY BURIAL SOCIETY (FBS)"
            premium="R120.00"
            accent="purple"
            icon={<Users className="w-6 h-6 text-purple-500" />}
            isSelected={selectedPlan?.name === "FAMILY BURIAL SOCIETY (FBS)"}
            onSelect={() => handlePlanSelect("FAMILY BURIAL SOCIETY (FBS)", "11 family members", "R120.00")}
            benefits={[
              'Coffin, Hearse & Family car',
              'Mortuary storage',
              'Free delivery/collection within 50km of our offices',
              'Tent, Table & Chairs',
              'Funeral programmes',
              'Vegetables'
            ]}
          />

          <PlanCard
            title="KOPANO (KPND)"
            premium="R170.00"
            accent="blue"
            icon={<Shield className="w-6 h-6 text-blue-500" />}
            isSelected={selectedPlan?.name === "KOPANO (KPND)"}
            onSelect={() => handlePlanSelect("KOPANO (KPND)", "11 family members", "R170.00")}
            isPopular={true}
            benefits={[
              'Coffin/hearse & Family car',
              'Mortuary storage',
              'Free delivery/collection within 50km',
              'Tent, Table, Chairs & Gas stove (empty gas cylinder)',
              'Funeral programmes',
              'Vegetables',
              'Grocery package (5L fish oil, 500g tea, 1kg powder milk, 12.5kg maize, 10kg sugar, 10kg rice & 3x castor pots & Flour)'
            ]}
          />

          <PlanCard
            title="URMBISA"
            premium="R270.00"
            accent="green"
            icon={<Award className="w-6 h-6 text-green-500" />}
            isSelected={selectedPlan?.name === "URMBISA"}
            onSelect={() => handlePlanSelect("URMBISA", "10 family members", "R270.00")}
            benefits={[
              'Casket/Hearse &Family car',
              'Coffin Spread',
              'Mortuary storage',
              'Free delivery/collection within 50km of our offices',
              'Tent, Table, Chairs & Gas stove (empty gas cylinder)',
              'Funeral programmes',
              'Vegetables'
            ]}
          />
        </div>

        {selectedPlan && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                alert(`Thank you for selecting ${selectedPlan.name}! Our team will contact you shortly to complete your registration.`);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
            >
              <Phone className="w-6 h-6" />
              Proceed with {selectedPlan.name}
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Inkomo Products */}
      <div>
        <h2 className={`text-3xl font-bold mb-3 text-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Inkomo Products
        </h2>
        <p className={`text-center mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
          Flexible coverage options for individuals and families
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Non Members */}
          <div className={`relative rounded-xl border-2 p-6 shadow-lg transition-all duration-300 cursor-pointer ${
            isPlanSelected('INKOMO - Non Members')
              ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 shadow-xl scale-105'
              : theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:shadow-xl hover:-translate-y-1' : 'bg-white border-slate-200 hover:shadow-xl hover:-translate-y-1'
          }`}
          onClick={() => handlePlanSelect('INKOMO - Non Members', 'From R105', 'R105')}>
            {isPlanSelected('INKOMO - Non Members') && (
              <div className="absolute -top-3 -right-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  INKOMO PRODUCT
                </h3>
                <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Non Members</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="group p-4 rounded-lg border-2 border-transparent hover:border-rose-300 dark:hover:border-rose-700 bg-gradient-to-r from-slate-50 to-rose-50 dark:from-gray-700/50 dark:to-rose-900/20 transition-all duration-300 hover:shadow-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                      <Users className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <span className="text-sm font-medium">Single member under 65 years</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">from</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">R105</span>
                  </div>
                </div>
              </div>

              <div className="group p-4 rounded-lg border-2 border-transparent hover:border-rose-300 dark:hover:border-rose-700 bg-gradient-to-r from-slate-50 to-rose-50 dark:from-gray-700/50 dark:to-rose-900/20 transition-all duration-300 hover:shadow-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <span className="text-sm font-medium">Immediate Family (Member & Spouse)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">from</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">R115</span>
                  </div>
                </div>
              </div>

              <div className="group p-4 rounded-lg border-2 border-transparent hover:border-rose-300 dark:hover:border-rose-700 bg-gradient-to-r from-slate-50 to-rose-50 dark:from-gray-700/50 dark:to-rose-900/20 transition-all duration-300 hover:shadow-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <span className="text-sm font-medium">Single Member between 65 - 74 years</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">from</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">R125</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Ideal for individuals seeking basic coverage without membership requirements</span>
              </p>
            </div>
          </div>

          {/* Extended */}
          <div className={`relative rounded-xl border-2 p-6 shadow-lg transition-all duration-300 cursor-pointer ${
            isPlanSelected('INKOMO - Immediate Family')
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 shadow-xl scale-105'
              : theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:shadow-xl hover:-translate-y-1' : 'bg-white border-slate-200 hover:shadow-xl hover:-translate-y-1'
          }`}
          onClick={() => handlePlanSelect('INKOMO - Immediate Family', 'R75', 'R75')}>
            {isPlanSelected('INKOMO - Immediate Family') && (
              <div className="absolute -top-3 -right-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  INKOMO PRODUCT
                </h3>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Premium Display */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">R</span>
                    </div>
                    <span className="font-bold text-lg">Monthly Premium</span>
                  </div>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">R75</span>
                </div>
              </div>

              {/* Coverage Details */}
              <div className={`p-4 rounded-lg border-2 ${
                theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Coverage Includes
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Immediate family (Member & Spouse)</span>
                  </div>
                  
                  <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Children over 14-21 years of age</span>
                  </div>
                  
                  <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium">Children over 21 years covered up to 25 years of age</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Provided they are still at Tertiary and proof must be provided at claim stage
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Extended coverage for families with tertiary students up to age 25</span>
              </p>
            </div>
          </div>

          {/* Extended - Duplicate */}
          <div className={`relative rounded-xl border-2 p-6 shadow-lg transition-all duration-300 cursor-pointer ${
            isPlanSelected('INKOMO - Extended Coverage')
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 shadow-xl scale-105'
              : theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:shadow-xl hover:-translate-y-1' : 'bg-white border-slate-200 hover:shadow-xl hover:-translate-y-1'
          }`}
          onClick={() => handlePlanSelect('INKOMO - Extended Coverage', 'R70', 'R70')}>
            {isPlanSelected('INKOMO - Extended Coverage') && (
              <div className="absolute -top-3 -right-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  INKOMO PRODUCT
                </h3>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Extended Coverage</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Premium Display */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">R</span>
                    </div>
                    <span className="font-bold text-lg">Monthly Premium</span>
                  </div>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">R70</span>
                </div>
              </div>

              {/* Coverage Details */}
              <div className={`p-4 rounded-lg border-2 ${
                theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Coverage Options
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Single member under 65</span>
                  </div>
                  
                  <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium">Single members between 66yrs - 74</span>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">R100.00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Voucher Option */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-2xl">R</span>
                  </div>
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-200 mb-1">Special Voucher Option</p>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      R7000 voucher will be paid if no livestock is required
                    </p>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className={`p-4 rounded-lg border-2 ${
                theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Conditions
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">No age restriction limits</span>
                  </div>
                  
                  <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">No medical test/examination</span>
                  </div>
                  
                  <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">FBS and KPN caters for 11 family members</span>
                  </div>
                  
                  <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Urmbisa caters for 10 family members</span>
                  </div>
                  
                  <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                    <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">6 Month waiting period</span>
                  </div>
                  
                  <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                    <span className="text-amber-500 font-bold mt-0.5 flex-shrink-0">R</span>
                    <span className="text-xs">R150.00 joining fee</span>
                  </div>
                  
                  <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                    <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Under Plus Plan Products 5% admin will be deducted at claim stage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div>
        <h2 className={`text-3xl font-bold mb-3 text-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Terms & Conditions
        </h2>
        <p className={`text-center mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
          Important information about our funeral plans
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Benefits Card */}
          <div className={`rounded-xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
            theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-green-900/20 border-green-700' : 'bg-gradient-to-br from-white to-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">Benefits</h3>
                <p className="text-xs text-green-700 dark:text-green-300">What you get with our plans</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="group p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">No age restriction limits</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Coverage available for all ages</p>
                  </div>
                </div>
              </div>

              <div className="group p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">No medical test examination</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Simple enrollment process</p>
                  </div>
                </div>
              </div>

              <div className="group p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">FBS and KPN: 11 family members</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Comprehensive family coverage</p>
                  </div>
                </div>
              </div>

              <div className="group p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">URMBISA: 10 family members</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Extended family protection</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements Card */}
          <div className={`rounded-xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
            theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-amber-900/20 border-amber-700' : 'bg-gradient-to-br from-white to-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">Requirements</h3>
                <p className="text-xs text-amber-700 dark:text-amber-300">What you need to know</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="group p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">6 months waiting period</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Standard waiting time before claims</p>
                  </div>
                </div>
              </div>

              <div className="group p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">R</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">R150.00 joining fee</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">One-time registration cost</p>
                  </div>
                </div>
              </div>

              <div className="group p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Plus Plan: 5% admin fee</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Deducted at claim stage for Plus Products</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>All terms and conditions apply as per the policy agreement</span>
              </p>
            </div>
            
          </div>
        </div>
      </div>

      {/* Family Funeral Cover */}
      <PriceTable
        title="FAMILY FUNERAL COVER"
        icon={<Heart className="w-6 h-6 text-white" />}
        accent="purple"
        rows={[
          { members: '14-64', cover: 'R15 000', premium: 'R150' },
          { members: '14-64', cover: 'R20 000', premium: 'R200' },
          { members: '14-64', cover: 'R30 000', premium: 'R270' }
        ]}
      />

      {/* Members Contribution */}
      <PriceTable
        title="MEMBERS CONTRIBUTION - THE PLUS PRODUCT"
        icon={<Users className="w-6 h-6 text-white" />}
        accent="blue"
        variant="members-contribution"
        rows={[
          { members: '1 + 5', cover: 'R10 000', premium: 'R220' },
          { members: '1 + 5', cover: 'R15 000', premium: 'R260' },
          { members: '1 + 5', cover: 'R20 000', premium: 'R290' },
          { members: '1 + 5', cover: 'R25 000', premium: 'R360' },
          { members: '1 + 5', cover: 'R30 000', premium: 'R450' },
          { members: '1 + 9', cover: 'R10 000', premium: 'R300' },
          { members: '1 + 9', cover: 'R15 000', premium: 'R360' },
          { members: '1 + 9', cover: 'R20 000', premium: 'R480' },
          { members: '1 + 9', cover: 'R25 000', premium: 'R530' },
          { members: '1 + 9', cover: 'R30 000', premium: 'R650' },
        ]}
      />

      {/* Single/Extended Funeral Cover */}
      <PriceTable
        title="SINGLE / EXTENDED FUNERAL COVER"
        icon={<Users className="w-6 h-6 text-white" />}
        accent="blue"
        variant="extended-funeral"
        rows={[
          { members: '65 - 74', cover: 'R10 000', premium: 'R140' },
          { members: '65 - 74', cover: 'R15 000', premium: 'R200' },
          { members: '75 - 84', cover: 'R10 000', premium: 'R205' },
        ]}
      />

      {/* Single Member Plans */}
      <PriceTable
        title="SINGLE MEMBER 18-64 YEARS"
        icon={<Shield className="w-6 h-6 text-white" />}
        accent="green"
        rows={[
          { members: 'Cover', cover: 'R5 000', premium: 'R45' },
          { members: 'Cover', cover: 'R10 000', premium: 'R65' },
          { members: 'Cover', cover: 'R15 000', premium: 'R90' },
          { members: 'Cover', cover: 'R20 000', premium: 'R130' },
          { members: 'Cover', cover: 'R30 000', premium: 'R170' }
        ]}
      />

      {/* Cash or Service Section */}
      <div>
        <div className={`rounded-xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 mb-6 ${
          theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-amber-900/20 border-amber-700' : 'bg-gradient-to-br from-white to-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">R</span>
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                CASH OR SERVICE
              </h3>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          {/* R10,000 Benefits */}
          <div className={`relative flex-1 min-w-[300px] p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
              isPlanSelected('R10 000 Benefits')
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 shadow-lg scale-105'
                : theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-200'
            }`}
            onClick={() => handlePlanSelect('R10 000 Benefits', 'R10 000', 'R65')}>
              {isPlanSelected('R10 000 Benefits') && (
                <div className="absolute -top-3 -right-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-bold text-lg">R10 000 Benefits</p>
                </div>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">R65/mo</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Flat lid coffin</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Tent</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">40 chairs</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">2 tables</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">100 funeral programmes</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Hearse</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Family car</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Coffin spread</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">100 km distance at no extra cost</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Storage, delivery & registration of death</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Grave marker</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Grave arrangement</span>
              </div>
            </div>
          </div>

          {/* R15,000 Benefits */}
          <div className={`relative flex-1 min-w-[300px] p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
              isPlanSelected('R15 000 Benefits')
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 shadow-lg scale-105'
                : theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-200'
            }`}
            onClick={() => handlePlanSelect('R15 000 Benefits', 'R15 000', 'R90')}>
              {isPlanSelected('R15 000 Benefits') && (
                <div className="absolute -top-3 -right-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <p className="font-bold text-lg">R15 000 Benefits</p>
              </div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">R90/mo</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Three tier coffin (Pine)</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Tent</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">50 chairs</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">2 tables</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">100 funeral programmes</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Hearse</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Family car</span>
              </div>
            </div>
          </div>

          {/* R20,000 Benefits */}
          <div className={`relative flex-1 min-w-[300px] p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
              isPlanSelected('R20 000 Benefits')
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 shadow-lg scale-105'
                : theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-200'
            }`}
            onClick={() => handlePlanSelect('R20 000 Benefits', 'R20 000', 'R130')}>
              {isPlanSelected('R20 000 Benefits') && (
                <div className="absolute -top-3 -right-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <p className="font-bold text-lg">R20 000 Benefits</p>
              </div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">R130/mo</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Dutch casket</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Tent</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">50 chairs</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">2 tables</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">100 funeral programmes</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Hearse</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Family car</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Coffin spread</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">100 km distance at no extra cost</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Storage, delivery & registration of death</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Grave marker</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Grave yard arrangement</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Toilet</span>
              </div>
            </div>
          </div>

          {/* R25,000 Benefits */}
          <div className={`relative flex-1 min-w-[300px] p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
              isPlanSelected('R25 000 Benefits')
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 shadow-lg scale-105'
                : theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-200'
            }`}
            onClick={() => handlePlanSelect('R25 000 Benefits', 'R25 000', 'R150')}>
              {isPlanSelected('R25 000 Benefits') && (
                <div className="absolute -top-3 -right-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <p className="font-bold text-lg">R25 000 Benefits</p>
              </div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">R150/mo</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Flat lid cherry casket</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Tent</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">70 Chairs</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">4 Tables</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">120 Funeral programmes</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Hearse</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Family Car</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Big Coffin spread</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">100 km distance at no extra cost</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Storage, delivery and registration of death</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Grave marker</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Grave arrangement</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Toilets</span>
              </div>
            </div>
          </div>

          {/* R30,000 Benefits */}
          <div className={`relative flex-1 min-w-[300px] p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
              isPlanSelected('R30 000 Benefits')
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 shadow-lg scale-105'
                : theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-200'
            }`}
            onClick={() => handlePlanSelect('R30 000 Benefits', 'R30 000', 'R170')}>
              {isPlanSelected('R30 000 Benefits') && (
                <div className="absolute -top-3 -right-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <p className="font-bold text-lg">R30 000 Benefits</p>
              </div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">R170/mo</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Min Dome/Flour tier casket</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Tent</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">80 Chairs</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">6 Tables</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">150 Funeral programmes</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Hearse</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Family car (2)</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Big Coffin spread</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">2 Poses</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">100 km distance at no extra cost</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Storage, delivery & registration of death</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className={`w-full p-3 rounded-lg ${
            theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
          }`}>
            <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>Choose between cash payout or full service package</span>
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h2 className={`text-3xl font-bold mb-3 text-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Get In Touch
        </h2>
        <p className={`text-center mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
          Visit us at our branches or reach out to us
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tembisa Branch */}
          <div className={`rounded-xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
            theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-blue-900/20 border-blue-700' : 'bg-gradient-to-br from-white to-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">TEMBISA BRANCH</h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">Main Office</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Address</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">755 Kangaroo Crescent</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Temong Section, Tembisa</p>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Phone</p>
                    <a href="tel:0315044185" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Tel: 031 504 4185</a>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fax: 086 684 9777 / 086 516 0914</p>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Email</p>
                    <a href="mailto:ubunye@ubunyefunerals.co.za" className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
                      ubunye@ubunyefunerals.co.za
                    </a>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Website</p>
                    <a href="https://www.ubunyefunerals.co.za" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      www.ubunyefunerals.co.za
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kwamhlanga Branch */}
          <div className={`rounded-xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
            theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-purple-900/20 border-purple-700' : 'bg-gradient-to-br from-white to-purple-50 border-purple-200'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400">KWAMHLANGA BRANCH</h3>
                <p className="text-xs text-purple-700 dark:text-purple-300">Regional Office</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Address</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mooki Road</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Kwamhlanga</p>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Phone</p>
                    <a href="tel:0315044185" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Tel: 031 504 4185</a>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fax: 086 684 9777 / 086 516 0914</p>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Email</p>
                    <a href="mailto:ubunye@ubunyefunerals.co.za" className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
                      ubunye@ubunyefunerals.co.za
                    </a>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Website</p>
                    <a href="https://www.ubunyefunerals.co.za" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      www.ubunyefunerals.co.za
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className={`rounded-xl border-2 p-6 text-center ${
          theme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600' : 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300'
        }`}>
          <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Ready to Get Started?
          </h3>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
            Contact us today for more information or to sign up
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="tel:0315044185" 
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              <Phone className="w-5 h-5" />
              Call Us Now
            </a>
            <a 
              href="mailto:ubunye@ubunyefunerals.co.za" 
              className={`w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-lg px-8 py-4 font-bold text-lg border-2 transition-all hover:scale-105 shadow-lg hover:shadow-xl ${
                theme === 'dark' ? 'border-gray-600 text-white hover:bg-gray-700' : 'border-slate-400 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Mail className="w-5 h-5" />
              Email Us
            </a>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiryModal && selectedPlan && (() => {
        console.log('Rendering modal with plan:', selectedPlan);
        return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Plan Selected</h2>
                </div>
                <button
                  onClick={() => {
                    setShowInquiryModal(false);
                    setSelectedPlan(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className={`p-6 rounded-lg border-2 mb-6 ${
                theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{selectedPlan.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Coverage: {selectedPlan.coverage}</p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-green-900/20 border-2 border-green-700' : 'bg-green-50 border-2 border-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Monthly Premium:</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {selectedPlan.premium}
                    </span>
                  </div>
                </div>
              </div>

              <p className={`text-sm text-center mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                Would you like to inquire about this funeral plan? We'll send your details to our team.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowInquiryModal(false);
                    setSelectedPlan(null);
                  }}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  }`}
                >
                  Choose Different Plan
                </button>
                <a
                  href={`mailto:ubunye@ubunyefunerals.co.za?subject=${encodeURIComponent('Funeral Plan Inquiry - ' + selectedPlan.name)}&body=${encodeURIComponent('Hello,\n\nI am interested in the following funeral plan:\n\nPlan: ' + selectedPlan.name + '\nCoverage: ' + selectedPlan.coverage + '\nMonthly Premium: ' + selectedPlan.premium + '\n\nPlease contact me with more information about this plan.\n\nThank you.')}`}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg"
                  onClick={() => setShowInquiryModal(false)}
                >
                  <Send className="w-5 h-5" />
                  Send Inquiry
                </a>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};

export default Services;
