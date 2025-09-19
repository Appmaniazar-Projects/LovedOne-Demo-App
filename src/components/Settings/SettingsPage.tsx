import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Settings</h1>
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-8 rounded-lg shadow-md transition-colors duration-200">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Account Settings</h2>
        <p className="text-slate-600 dark:text-gray-300">This is a placeholder for account settings.</p>
        
        <hr className="my-8 border-slate-200 dark:border-gray-700" />

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Notification Settings</h2>
        <p className="text-slate-600 dark:text-gray-300">This is a placeholder for notification settings.</p>
        
        <hr className="my-8 border-slate-200 dark:border-gray-700" />

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Theme Settings</h2>
        <p className="text-slate-600 dark:text-gray-300">This is a placeholder for theme settings.</p>
      </div>
    </div>
  );
};

export default SettingsPage;
