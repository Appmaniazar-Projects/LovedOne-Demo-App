import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Account Settings</h2>
        <p className="text-slate-600">This is a placeholder for account settings.</p>
        
        <hr className="my-8" />

        <h2 className="text-xl font-bold text-slate-900 mb-4">Notification Settings</h2>
        <p className="text-slate-600">This is a placeholder for notification settings.</p>
        
        <hr className="my-8" />

        <h2 className="text-xl font-bold text-slate-900 mb-4">Theme Settings</h2>
        <p className="text-slate-600">This is a placeholder for theme settings.</p>
      </div>
    </div>
  );
};

export default SettingsPage;
