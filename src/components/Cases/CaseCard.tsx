import React from 'react';
import { Calendar, User, MapPin, MoreVertical } from 'lucide-react';
import { DeceasedProfile } from '../../types';

interface CaseCardProps {
  case: DeceasedProfile;
  onClick: () => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ case: caseData, onClick }) => {
  const statusColors = {
    quote: 'bg-yellow-100 text-yellow-800',
    ongoing: 'bg-blue-100 text-blue-800',
    closed: 'bg-green-100 text-green-800'
  };

  const serviceTypeColors = {
    burial: 'bg-purple-100 text-purple-800',
    cremation: 'bg-orange-100 text-orange-800',
    memorial: 'bg-blue-100 text-blue-800'
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img
            src={caseData.picture || 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
            alt={caseData.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{caseData.name}</h3>
            <p className="text-sm text-slate-600">
              {caseData.dateOfBirth.toLocaleDateString()} - {caseData.dateOfDeath.toLocaleDateString()}
            </p>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">Director: {caseData.assignedDirector}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">
            Created: {caseData.createdAt.toLocaleDateString()}
          </span>
        </div>

        {caseData.culturalRequirements && (
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">{caseData.culturalRequirements}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[caseData.status]}`}>
            {caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1)}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${serviceTypeColors[caseData.serviceType]}`}>
            {caseData.serviceType.charAt(0).toUpperCase() + caseData.serviceType.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CaseCard;