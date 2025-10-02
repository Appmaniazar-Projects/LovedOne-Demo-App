import React from 'react';
import { Calendar, User, MapPin, MoreVertical } from 'lucide-react';
import { DeceasedProfile } from '../../types';

interface CaseCardProps {
  case: DeceasedProfile;
  onClick: () => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ case: caseData, onClick }) => {
  const statusColors = {
    quote: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    ongoing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    closed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
  };

  const serviceTypeColors = {
    burial: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    cremation: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
    memorial: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img
            src={caseData.picture || 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
            alt={caseData.name}
            className="w-16 h-16 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{caseData.name}</h3>
            <p className="text-sm text-slate-600 dark:text-gray-300">
              {caseData.dateOfBirth.toLocaleDateString()} - {caseData.dateOfDeath.toLocaleDateString()}
            </p>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-all duration-300 hover:rotate-90">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2 transition-transform duration-300 group-hover:translate-x-1">
          <User className="w-4 h-4 text-slate-400 dark:text-gray-500 transition-colors duration-300 group-hover:text-blue-500" />
          <span className="text-sm text-slate-600 dark:text-gray-300">Director: {caseData.assignedDirector}</span>
        </div>
        
        <div className="flex items-center space-x-2 transition-transform duration-300 group-hover:translate-x-1">
          <Calendar className="w-4 h-4 text-slate-400 dark:text-gray-500 transition-colors duration-300 group-hover:text-blue-500" />
          <span className="text-sm text-slate-600 dark:text-gray-300">
            Created: {caseData.createdAt.toLocaleDateString()}
          </span>
        </div>

        {caseData.culturalRequirements && (
          <div className="flex items-center space-x-2 transition-transform duration-300 group-hover:translate-x-1">
            <MapPin className="w-4 h-4 text-slate-400 dark:text-gray-500 transition-colors duration-300 group-hover:text-blue-500" />
            <span className="text-sm text-slate-600 dark:text-gray-300">{caseData.culturalRequirements}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[caseData.status]} transition-all duration-300 group-hover:scale-110`}>
            {caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1)}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${serviceTypeColors[caseData.serviceType]} transition-all duration-300 group-hover:scale-110`}>
            {caseData.serviceType.charAt(0).toUpperCase() + caseData.serviceType.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CaseCard;