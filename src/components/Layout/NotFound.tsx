import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">The page you requested doesn't exist or has been moved.</p>
        <Link to="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Go Home</Link>
      </div>
    </div>
  );
};

export default NotFound;
